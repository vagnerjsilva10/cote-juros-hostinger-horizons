import express from 'express';
import { asyncHandler } from '../lib/http.js';
import { getPrisma } from '../lib/prisma.js';
import { ContentDistributionService } from '../services/contentDistributionService.js';
import { EditorialService } from '../services/editorialService.js';
import { SeoGrowthService } from '../services/seoGrowthService.js';
import { SendReactivationEmailsJob } from '../jobs/sendReactivationEmails.js';

const router = express.Router();

const parseLimit = (value, fallback, max) => {
  const parsed = Number(value || fallback);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.min(max, Math.floor(parsed));
};

const resolveBearerToken = (req) => {
  const header = req.get('authorization') || '';
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || '';
};

const requireInternalAuth = (req, res, next) => {
  const receivedToken = resolveBearerToken(req);
  const allowedTokens = [
    process.env.CRON_SECRET,
    process.env.COTE_API_TOKEN
  ].filter(Boolean);

  if (allowedTokens.length && allowedTokens.includes(receivedToken)) {
    return next();
  }

  return res.status(401).json({
    ok: false,
    error: 'Unauthorized internal job request'
  });
};

const toArticlePayload = (record) => {
  const structured = record.structuredContent && typeof record.structuredContent === 'object'
    ? record.structuredContent
    : {};

  return {
    ...structured,
    id: record.id,
    slug: record.slug,
    title: record.title,
    h1: structured.h1 || record.title,
    summary: record.excerpt || structured.summary || '',
    excerpt: record.excerpt || structured.summary || '',
    metaTitle: record.seoTitle || structured.metaTitle || record.title,
    metaDescription: record.seoDescription || structured.metaDescription || record.excerpt || '',
    category: record.category?.name || structured.category || '',
    clusterLabel: record.cluster?.name || structured.clusterLabel || '',
    clusterKeyword: record.cluster?.primaryKeyword || structured.clusterKeyword || '',
    coverImage: record.coverImage || structured.coverImage || '',
    ogImage: record.ogImage || structured.ogImage || '',
    routePath: structured.routePath || `/blog/${record.slug}`,
    canonicalUrl: structured.canonicalUrl || `${process.env.SITE_BASE_URL || 'https://www.cotejuros.com.br'}/blog/${record.slug}/`,
    tags: Array.isArray(structured.tags) ? structured.tags : [],
    intro: Array.isArray(structured.intro) ? structured.intro : [],
    sections: Array.isArray(structured.sections) ? structured.sections : [],
    conclusion: Array.isArray(structured.conclusion) ? structured.conclusion : []
  };
};

router.use(requireInternalAuth);

router.get(
  '/seo/search-console/health',
  asyncHandler(async (req, res) => {
    const result = await SeoGrowthService.checkSearchConsoleAccess();
    res.status(result.ok ? 200 : 503).json(result);
  })
);

router.get(
  '/seo/search-console/sync',
  asyncHandler(async (req, res) => {
    const days = parseLimit(req.query.days, 28, 90);
    const rowLimit = parseLimit(req.query.rowLimit, 25000, 25000);
    const result = await SeoGrowthService.syncSearchConsole({ days, rowLimit });
    res.status(result.ok === false ? 202 : 200).json(result);
  })
);

router.get(
  '/seo/opportunities',
  asyncHandler(async (req, res) => {
    const limit = parseLimit(req.query.limit, 25, 100);
    const minImpressions = parseLimit(req.query.minImpressions, 20, 10000);
    res.json(await SeoGrowthService.listSearchOpportunities({ limit, minImpressions }));
  })
);

router.get(
  '/seo/refresh/run',
  asyncHandler(async (req, res) => {
    const limit = parseLimit(req.query.limit, 5, 20);
    res.json(await SeoGrowthService.applySafeRefresh({ limit }));
  })
);

router.get(
  '/editorial/opportunities',
  asyncHandler(async (req, res) => {
    const limit = parseLimit(req.query.limit, 10, 50);
    const dueOnly = req.query.dueOnly === 'true';
    const items = await EditorialService.previewOpportunityQueue({ limit, dueOnly });

    res.json({
      ok: true,
      dueOnly,
      count: items.length,
      items
    });
  })
);

router.get(
  '/editorial/run',
  asyncHandler(async (req, res) => {
    const limit = parseLimit(req.query.limit, 1, 3);
    const triggerSource = req.get('user-agent')?.includes('vercel-cron')
      ? 'vercel-cron'
      : (req.query.trigger || 'internal');

    const result = await EditorialService.runScheduledPublication({
      limit,
      triggerSource
    });

    res.json({
      ok: true,
      processed: result.length,
      items: result.map((item) => ({
        jobRunId: item.jobRunId,
        slug: item.article?.slug,
        status: item.article?.status,
        wordCount: item.validation?.wordCount,
        webStory: item.distribution?.webStory?.path || null,
        pinterest: item.distribution?.pinterest?.status || null,
        distributionError: item.distributionError || null
      }))
    });
  })
);

router.get(
  '/distribution/backfill',
  asyncHandler(async (req, res) => {
    const prisma = getPrisma();
    const limit = parseLimit(req.query.limit, 3, 10);
    const force = req.query.force === 'true';
    const triggerSource = req.get('user-agent')?.includes('vercel-cron')
      ? 'vercel-cron-backfill'
      : (req.query.trigger || 'internal-backfill');

    const records = await prisma.article.findMany({
      where: {
        status: 'published'
      },
      include: {
        category: true,
        cluster: true,
        brief: true
      },
      orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
      take: force ? limit : Math.max(limit * 5, 15)
    });

    const items = [];
    const pendingRecords = records
      .filter((record) => {
        if (force) return true;
        const structured = record.structuredContent && typeof record.structuredContent === 'object'
          ? record.structuredContent
          : {};
        return !structured.distribution?.webStory?.url;
      })
      .slice(0, limit);

    for (const record of pendingRecords) {
      try {
        const distribution = await ContentDistributionService.distributePublishedArticle({
          articleRecord: record,
          articlePayload: toArticlePayload(record),
          brief: record.brief || {},
          triggerSource
        });

        items.push({
          slug: record.slug,
          ok: true,
          webStory: distribution.webStory.path,
          pinterest: distribution.pinterest.status
        });
      } catch (error) {
        items.push({
          slug: record.slug,
          ok: false,
          error: error?.message || String(error)
        });
      }
    }

    res.json({
      ok: true,
      scanned: records.length,
      processed: items.length,
      items
    });
  })
);

router.get(
  '/reactivation/send-emails',
  asyncHandler(async (req, res) => {
    const job = new SendReactivationEmailsJob();
    const stats = await job.run();

    res.json({
      ok: true,
      trigger: req.get('user-agent')?.includes('vercel-cron') ? 'vercel-cron' : (req.query.trigger || 'internal'),
      stats
    });
  })
);

export default router;
