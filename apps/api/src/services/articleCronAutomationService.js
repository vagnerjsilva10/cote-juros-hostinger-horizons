import { getPrisma } from '../lib/prisma.js';
import { EditorialService } from './editorialService.js';
import { checkWordpressHealth } from './blogImage/wordpressPublisher.js';

const TIMEZONE = 'America/Sao_Paulo';
const DAILY_LIMIT = Number(process.env.ARTICLE_AUTOMATION_DAILY_LIMIT || 3);
const isPublishingApproved = () => process.env.ARTICLE_AUTOMATION_ALLOW_PUBLISH === 'true';
const SITE_BASE_URL = (process.env.SITE_BASE_URL || 'https://www.cotejuros.com.br').replace(/\/$/, '');
const SCHEDULE_SLOTS = Object.freeze([
  { name: 'morning', hour: 8, minute: 30 },
  { name: 'afternoon', hour: 13, minute: 30 },
  { name: 'evening', hour: 19, minute: 30 }
]);

const dateTimeFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: TIMEZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false
});

const getSaoPauloParts = (date = new Date()) => {
  const parts = Object.fromEntries(
    dateTimeFormatter.formatToParts(date)
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, part.value])
  );

  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    second: Number(parts.second),
    dateKey: `${parts.year}-${parts.month}-${parts.day}`
  };
};

const getSaoPauloDayRange = (date = new Date()) => {
  const { dateKey } = getSaoPauloParts(date);
  return {
    dateKey,
    start: new Date(`${dateKey}T00:00:00-03:00`),
    end: new Date(`${dateKey}T23:59:59.999-03:00`)
  };
};

const minutesFromMidnight = ({ hour, minute }) => (hour * 60) + minute;

const getDueSlots = (date = new Date()) => {
  const parts = getSaoPauloParts(date);
  const nowMinutes = minutesFromMidnight(parts);
  return SCHEDULE_SLOTS.filter((slot) => minutesFromMidnight(slot) <= nowMinutes);
};

const getNextSlot = (date = new Date()) => {
  const parts = getSaoPauloParts(date);
  const nowMinutes = minutesFromMidnight(parts);
  const slot = SCHEDULE_SLOTS.find((item) => minutesFromMidnight(item) > nowMinutes) || SCHEDULE_SLOTS[0];
  const dayOffset = minutesFromMidnight(slot) > nowMinutes ? 0 : 1;
  const base = new Date(`${parts.dateKey}T00:00:00-03:00`);
  base.setUTCDate(base.getUTCDate() + dayOffset);
  base.setUTCHours(slot.hour + 3, slot.minute, 0, 0);
  return {
    name: slot.name,
    localTime: `${String(slot.hour).padStart(2, '0')}:${String(slot.minute).padStart(2, '0')}`,
    scheduledAt: base.toISOString()
  };
};

const serializeArticle = (article = null) => {
  if (!article) return null;
  const structured = article.structuredContent && typeof article.structuredContent === 'object'
    ? article.structuredContent
    : {};
  return {
    id: article.id,
    slug: article.slug,
    title: article.title,
    status: article.status,
    publishedAt: article.publishedAt,
    coverImage: article.coverImage || structured.coverImage || '',
    url: `${SITE_BASE_URL}/blog/${article.slug}/`
  };
};

const normalizeError = (error) => ({
  name: error?.name || 'Error',
  message: error?.message || String(error),
  stack: error?.stack || null
});

const getPublishedTodayCount = async (prisma, now = new Date()) => {
  const range = getSaoPauloDayRange(now);
  const count = await prisma.article.count({
    where: {
      status: 'published',
      publishedAt: {
        gte: range.start,
        lte: range.end
      }
    }
  });

  return {
    count,
    ...range
  };
};

const validatePublishedArticle = (item = {}) => {
  const article = item.article || {};
  const structured = article.structuredContent && typeof article.structuredContent === 'object'
    ? article.structuredContent
    : article;
  const issues = [];
  if (!article.title) issues.push('missing_title');
  if (!article.slug) issues.push('missing_slug');
  if (!structured.content && !Array.isArray(structured.sections)) issues.push('missing_content');
  if (!structured.metaDescription && !article.metaDescription) issues.push('missing_meta_description');
  if (!structured.category && !article.category) issues.push('missing_category');
  if (!structured.cta && !Array.isArray(structured.ctas)) issues.push('missing_cta');
  if (!Array.isArray(structured.faq) || !structured.faq.length) issues.push('missing_faq');
  if (!article.coverImage && !structured.coverImage) issues.push('missing_cover_image');
  if (item.validation?.passed === false) issues.push(...(item.validation.issues || []));
  if (item.image?.validationPassed === false) issues.push(item.image.errorMessage || 'image_validation_failed');

  return {
    passed: issues.length === 0,
    issues
  };
};

export class ArticleCronAutomationService {
  static async createJob({ jobName, payload = {} }) {
    const prisma = getPrisma();
    return prisma.automationJob.create({
      data: {
        jobName,
        status: 'running',
        payload
      }
    });
  }

  static async finishJob({ job, status, result = null, error = null, articleId = null, wordpressPostId = null }) {
    const prisma = getPrisma();
    return prisma.automationJob.update({
      where: { id: job.id },
      data: {
        status,
        finishedAt: new Date(),
        result,
        errorMessage: error ? (error.message || String(error)) : null,
        createdArticleId: articleId,
        wordpressPostId
      }
    });
  }

  static async runNow({ triggerSource = 'manual-run-now', limit = 1, force = true } = {}) {
    const publishApproved = isPublishingApproved();
    const job = await this.createJob({
      jobName: 'article-publication-run-now',
      payload: {
        triggerSource,
        limit,
        force,
        publishApproved,
        timezone: TIMEZONE
      }
    });

    try {
      const result = await EditorialService.runScheduledPublication({
        limit,
        triggerSource,
        ignoreSchedule: force,
        ignoreRecentClusterCooldown: force,
        publishApproved
      });

      if (!result.length) {
        const payload = {
          ok: false,
          status: 'skipped',
          reason: 'no_eligible_editorial_brief',
          items: []
        };
        await this.finishJob({ job, status: 'skipped', result: payload });
        return payload;
      }

      const items = result.map((item) => ({
        jobRunId: item.jobRunId,
        article: item.article,
        validation: item.validation,
        image: {
          provider: item.image?.provider,
          publicPath: item.image?.publicPath,
          validationPassed: item.image?.validationPassed,
          errorMessage: item.image?.errorMessage || null
        },
        distributionError: item.distributionError || null,
        finalValidation: validatePublishedArticle(item)
      }));
      const failed = items.filter((item) => !item.finalValidation.passed);
      const firstArticle = items.find((item) => item.article?.id)?.article || null;
      const payload = {
        ok: failed.length === 0,
        status: failed.length ? 'failed' : (publishApproved ? 'success' : 'draft_saved'),
        publishApproved,
        target: 'cotejuros.com.br',
        items,
        article_id: firstArticle?.id || null,
        post_id: firstArticle?.id || null,
        url: firstArticle?.slug ? `${SITE_BASE_URL}/blog/${firstArticle.slug}/` : null
      };

      await this.finishJob({
        job,
        status: failed.length ? 'failed' : (publishApproved ? 'success' : 'draft_saved'),
        result: payload,
        error: failed.length ? new Error(failed.map((item) => item.finalValidation.issues.join(', ')).join(' | ')) : null,
        articleId: firstArticle?.id || null
      });

      return payload;
    } catch (error) {
      const payload = {
        ok: false,
        status: 'failed',
        error: normalizeError(error)
      };
      await this.finishJob({ job, status: 'failed', result: payload, error });
      throw error;
    }
  }

  static async runDue({ triggerSource = 'vercel-cron' } = {}) {
    const prisma = getPrisma();
    const now = new Date();
    const publishApproved = isPublishingApproved();
    const daily = await getPublishedTodayCount(prisma, now);
    const dueSlots = getDueSlots(now);
    const expectedByNow = Math.min(DAILY_LIMIT, dueSlots.length);
    const missing = Math.max(0, expectedByNow - daily.count);

    const job = await this.createJob({
      jobName: 'article-publication-cron',
      payload: {
        triggerSource,
        timezone: TIMEZONE,
        localDate: daily.dateKey,
        dueSlots,
        publishedToday: daily.count,
        expectedByNow,
        missing,
        dailyLimit: DAILY_LIMIT,
        publishApproved
      }
    });

    try {
      if (!publishApproved) {
        const payload = {
          ok: true,
          status: 'skipped',
          reason: 'publication_requires_approval',
          publishApproved,
          message: 'ARTICLE_AUTOMATION_ALLOW_PUBLISH precisa estar true para o cron publicar automaticamente.'
        };
        await this.finishJob({ job, status: 'skipped', result: payload });
        return payload;
      }

      if (daily.count >= DAILY_LIMIT) {
        const payload = {
          ok: true,
          status: 'skipped',
          reason: 'daily_limit_reached',
          publishedToday: daily.count,
          dailyLimit: DAILY_LIMIT
        };
        await this.finishJob({ job, status: 'skipped', result: payload });
        return payload;
      }

      if (missing <= 0) {
        const payload = {
          ok: true,
          status: 'skipped',
          reason: dueSlots.length ? 'slot_already_satisfied' : 'no_due_slot_yet',
          publishedToday: daily.count,
          expectedByNow,
          dueSlots
        };
        await this.finishJob({ job, status: 'skipped', result: payload });
        return payload;
      }

      const payload = await this.runNow({
        triggerSource,
        limit: Math.min(missing, DAILY_LIMIT - daily.count),
        force: false
      });
      await this.finishJob({
        job,
        status: payload.ok ? 'success' : 'failed',
        result: payload,
        articleId: payload.items?.[0]?.article?.id || null
      });
      return payload;
    } catch (error) {
      const payload = {
        ok: false,
        status: 'failed',
        error: normalizeError(error)
      };
      await this.finishJob({ job, status: 'failed', result: payload, error });
      throw error;
    }
  }

  static async diagnostics() {
    const prisma = getPrisma();
    const now = new Date();
    const daily = await getPublishedTodayCount(prisma, now);
    const [
      lastAutomationJob,
      lastEditorialJob,
      lastCreatedArticle,
      lastPublishedArticle,
      failedJob,
      databaseCount
    ] = await Promise.all([
      prisma.automationJob.findFirst({ orderBy: { startedAt: 'desc' } }),
      prisma.editorialJobRun.findFirst({ orderBy: { startedAt: 'desc' } }),
      prisma.article.findFirst({ orderBy: { createdAt: 'desc' } }),
      prisma.article.findFirst({ where: { status: 'published' }, orderBy: { publishedAt: 'desc' } }),
      prisma.automationJob.findFirst({ where: { status: 'failed' }, orderBy: { startedAt: 'desc' } }),
      prisma.article.count()
    ]);

    const dueSlots = getDueSlots(now);
    const expectedByNow = Math.min(DAILY_LIMIT, dueSlots.length);
    const essential = {
      database: { ok: true, articleCount: databaseCount },
      coteJurosSite: { ok: true, baseUrl: SITE_BASE_URL },
      ai: {
        ok: Boolean(process.env.OPENAI_API_KEY || process.env.GEMINI_API_KEY),
        providers: {
          openai: Boolean(process.env.OPENAI_API_KEY),
          gemini: Boolean(process.env.GEMINI_API_KEY)
        }
      },
      pexels: { ok: Boolean(process.env.PEXELS_API_KEY) },
      unsplash: { ok: Boolean(process.env.UNSPLASH_ACCESS_KEY) },
      wordpressMedia: await checkWordpressHealth()
    };
    const essentialOk = essential.database.ok
      && essential.ai.ok
      && (essential.pexels.ok || essential.unsplash.ok)
      && essential.wordpressMedia.ok;

    return {
      ok: true,
      timezone: TIMEZONE,
      now: now.toISOString(),
      localNow: getSaoPauloParts(now),
      schedule: SCHEDULE_SLOTS,
      nextScheduledRun: getNextSlot(now),
      lastJobExecuted: lastAutomationJob || lastEditorialJob,
      lastArticleCreated: serializeArticle(lastCreatedArticle),
      lastArticlePublished: serializeArticle(lastPublishedArticle),
      lastFailureReason: failedJob?.errorMessage || lastEditorialJob?.errorMessage || null,
      publishedToday: daily.count,
      expectedPublishedByNow: expectedByNow,
      missingToday: Math.max(0, Math.min(DAILY_LIMIT, expectedByNow) - daily.count),
      dailyLimit: DAILY_LIMIT,
      integrations: essential,
      readyToPublishNow: essentialOk && daily.count < DAILY_LIMIT,
      canCronPublishNow: essentialOk && daily.count < DAILY_LIMIT && expectedByNow > daily.count,
      target: 'cotejuros.com.br'
    };
  }
}
