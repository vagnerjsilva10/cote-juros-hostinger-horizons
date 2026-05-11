import 'dotenv/config.js';
import { getPrisma } from '../lib/prisma.js';
import { ContentDistributionService } from '../services/contentDistributionService.js';
import {
  buildPublicStoryUrl,
  normalizePublicStoryUrl,
  normalizeStorySeoHtml,
  validateWebStorySeo
} from '../services/webStorySeoService.js';

const parseArgs = () => {
  const args = process.argv.slice(2);
  const entries = new Map();

  for (const arg of args) {
    if (!arg.startsWith('--')) continue;
    const [key, value] = arg.slice(2).split('=');
    entries.set(key, value ?? 'true');
  }

  return {
    limit: Number(entries.get('limit') || 25),
    slug: entries.get('slug') || '',
    dryRun: entries.get('dryRun') === 'true',
    triggerSource: entries.get('trigger') || 'web-story-backfill'
  };
};

const getStructured = (record = {}) =>
  record.structuredContent && typeof record.structuredContent === 'object'
    ? record.structuredContent
    : {};

const hasLegacyStoryIssue = (record = {}) => {
  const structured = getStructured(record);
  const html = structured.distributionAssets?.webStoryHtml || '';
  const slides = structured.distributionAssets?.slides || [];
  const webStory = structured.distribution?.webStory;

  return Boolean(webStory?.url)
    && (
      html.includes('linearGradient id="bg"')
      || html.includes('class="copy"')
      || html.includes('/assets/slide-')
      || !html.includes('object-fit="cover"')
      || slides.some((slide) => !String(slide.content || '').includes('<image href="http'))
      || slides.some((slide) => String(slide.content || '').includes('preserveAspectRatio="xMidYMid slice"'))
      || slides.some((slide) => !String(slide.content || '').includes('linearGradient id="readability"'))
      || !webStory.validation?.passed
    );
};

const auditStorySeo = (record = {}) => {
  const structured = getStructured(record);
  const webStory = structured.distribution?.webStory;
  const storyPublicPath = webStory?.path || `/stories/${record.slug}`;
  const originalStoryUrl = webStory?.url || '';
  const originalHtml = structured.distributionAssets?.webStoryHtml || '';
  const originalBookendJson = structured.distributionAssets?.bookendJson || '';
  const originalCombined = [
    originalStoryUrl,
    originalHtml,
    originalBookendJson,
    JSON.stringify(structured.distribution || {})
  ].join('\n');
  const storedMixedDomain = /api\.cotejuros\.com\.br|localhost|127\.0\.0\.1/i.test(originalCombined);
  const storyUrl = webStory?.url ? normalizePublicStoryUrl(webStory.url, storyPublicPath) : '';
  const html = normalizeStorySeoHtml(structured.distributionAssets?.webStoryHtml || '');
  const bookendJson = normalizeStorySeoHtml(structured.distributionAssets?.bookendJson || '');
  const slideAssets = (structured.distributionAssets?.slides || []).map((asset) => ({
    ...asset,
    content: normalizeStorySeoHtml(asset.content || '')
  }));
  const publicSite = process.env.PUBLIC_SITE_URL || 'https://www.cotejuros.com.br';
  const posterImageUrl = String(structured.coverImage || structured.ogImage || structured.distribution?.pinterest?.imageUrl || `${publicSite}/images/pinterest/${record.slug}.svg`)
    .replace(/^https?:\/\/api\.cotejuros\.com\.br/i, publicSite);
  const articlePayload = toArticlePayload(record);

  if (!webStory?.url && !webStory?.path) {
    return {
      status: 'story_pending',
      missing: true,
      valid: false,
      storyUrl: '',
      expectedStoryUrl: buildPublicStoryUrl(storyPublicPath),
      issues: ['story ausente']
    };
  }

  const validation = validateWebStorySeo({
    article: articlePayload,
    storyHtml: html,
    bookendJson,
    distribution: {
      ...structured.distribution,
      webStory: {
        ...webStory,
        url: storyUrl
      },
      pinterest: structured.distribution?.pinterest ? {
        ...structured.distribution.pinterest,
        imageUrl: posterImageUrl
      }
        : structured.distribution?.pinterest
    },
    slideAssets,
    posterImageUrl,
    storyPublicPath,
    articleUrl: articlePayload.canonicalUrl
  });

  return {
    status: validation.passed ? 'story_generated' : 'story_failed',
    missing: false,
    valid: validation.passed,
    storyUrl,
    expectedStoryUrl: validation.expectedStoryUrl,
    canonical: validation.canonical,
    wrongDomain: storedMixedDomain || Boolean(originalStoryUrl && !originalStoryUrl.startsWith(process.env.PUBLIC_SITE_URL || 'https://www.cotejuros.com.br')),
    canonicalWrongDomain: Boolean(validation.canonical && !validation.canonical.startsWith(process.env.PUBLIC_SITE_URL || 'https://www.cotejuros.com.br')),
    storedMixedDomain,
    issues: validation.issues,
    validation
  };
};

const toArticlePayload = (record) => {
  const structured = getStructured(record);

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
    canonicalUrl: `${process.env.PUBLIC_SITE_URL || 'https://www.cotejuros.com.br'}/blog/${record.slug}/`,
    tags: Array.isArray(structured.tags) ? structured.tags : [],
    intro: Array.isArray(structured.intro) ? structured.intro : [],
    sections: Array.isArray(structured.sections) ? structured.sections : [],
    conclusion: Array.isArray(structured.conclusion) ? structured.conclusion : []
  };
};

const main = async () => {
  const options = parseArgs();
  const prisma = getPrisma();
  const records = await prisma.article.findMany({
    where: {
      status: 'published',
      ...(options.slug ? { slug: options.slug } : {})
    },
    include: {
      category: true,
      cluster: true,
      brief: true
    },
    orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
    take: Number.isFinite(options.limit) && options.limit > 0 ? options.limit : 25
  });

  const audited = records.map((record) => ({
    slug: record.slug,
    title: record.title,
    publishedAt: record.publishedAt,
    audit: auditStorySeo(record),
    legacyIssue: hasLegacyStoryIssue(record)
  }));
  const targets = records.filter((record) => {
    const audit = auditStorySeo(record);
    return audit.missing || !audit.valid || hasLegacyStoryIssue(record);
  });
  const corrected = [];
  const skipped = [];

  for (const record of targets) {
    if (options.dryRun) {
      skipped.push({ slug: record.slug, reason: 'dry_run', audit: auditStorySeo(record) });
      continue;
    }

    try {
      const distribution = await ContentDistributionService.distributePublishedArticle({
        articleRecord: record,
        articlePayload: toArticlePayload(record),
        brief: record.brief || {},
        triggerSource: options.triggerSource
      });

      corrected.push({
        slug: record.slug,
        webStory: distribution.webStory.path,
        validation: distribution.webStory.validation
      });
    } catch (error) {
      skipped.push({
        slug: record.slug,
        reason: 'web_story_backfill_failed',
        error: error?.message || String(error)
      });
    }
  }

  console.log(JSON.stringify({
    ok: true,
    dryRun: options.dryRun,
    scanned: records.length,
    targetCount: targets.length,
    storyBackfillMode: true,
    summary: {
      validStories: audited.filter((item) => item.audit.valid).length,
      invalidStories: audited.filter((item) => !item.audit.valid && !item.audit.missing).length,
      missingStories: audited.filter((item) => item.audit.missing).length,
      wrongDomainStories: audited.filter((item) => item.audit.wrongDomain || item.audit.canonicalWrongDomain).length,
      legacyStories: audited.filter((item) => item.legacyIssue).length
    },
    audit: audited.slice(0, 50),
    correctedCount: corrected.length,
    corrected,
    skipped
  }, null, 2));
};

main().catch((error) => {
  console.error('[web-story-backfill] failed', error);
  process.exitCode = 1;
});
