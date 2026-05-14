import { getPrisma } from '../lib/prisma.js';
import { validateWebStorySeo } from './webStorySeoService.js';
import { WebStoryFingerprintService } from './webStoryFingerprintService.js';

const normalize = (value = '') =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

const clamp = (value, min = 0, max = 100) => Math.max(min, Math.min(max, Math.round(value)));

const getStructured = (record = {}) =>
  record.structuredContent && typeof record.structuredContent === 'object'
    ? record.structuredContent
    : {};

const storyUrl = (record = {}) => {
  const structured = getStructured(record);
  return structured.distribution?.webStory?.url || structured.distribution?.webStory?.path || '';
};

const storyCluster = (record = {}) => {
  const structured = getStructured(record);
  return structured.storyGeneration?.cluster ||
    structured.cluster ||
    record.cluster?.slug ||
    record.category?.slug ||
    'unknown';
};

const isCreditHeavy = (cluster = '') =>
  /emprestimo|credito|financiamento|score|cartao/i.test(cluster);

const hasAmpBoilerplate = (html = '') =>
  html.includes('@-webkit-keyframes -amp-start') &&
  html.includes('-moz-animation:-amp-start') &&
  html.includes('<noscript><style amp-boilerplate>body{-webkit-animation:none;-moz-animation:none;-ms-animation:none;animation:none}</style></noscript>');

export class WebStoryObservabilityService {
  static async auditExistingStories({ limit = 500 } = {}) {
    const prisma = getPrisma();
    const records = await prisma.article.findMany({
      where: { status: 'published' },
      include: { category: true, cluster: true },
      orderBy: { updatedAt: 'desc' },
      take: limit,
    });
    const storyRecords = records.filter((record) => Boolean(storyUrl(record)));
    const clusterCounts = storyRecords.reduce((acc, record) => {
      const cluster = storyCluster(record);
      acc[cluster] = (acc[cluster] || 0) + 1;
      return acc;
    }, {});

    const items = storyRecords.map((record) => this.auditRecord({ record, clusterCounts }));
    const summary = {
      totalStories: items.length,
      healthy: items.filter((item) => item.classification === 'healthy').length,
      needs_refresh: items.filter((item) => item.classification === 'needs_refresh').length,
      needs_rebuild: items.filter((item) => item.classification === 'needs_rebuild').length,
      archive_candidate: items.filter((item) => item.classification === 'archive_candidate').length,
      ampInvalid: items.filter((item) => !item.ampLikelyValid).length,
      canonicalIssues: items.filter((item) => item.issues.includes('canonical_or_seo_issue')).length,
      highFingerprint: items.filter((item) => (item.fingerprintRisk || 0) > 30).length,
      lowDiscover: items.filter((item) => (item.discoverReadiness || 0) > 0 && item.discoverReadiness < 85).length,
      saturatedClusters: Object.entries(clusterCounts)
        .filter(([cluster, count]) => count >= 5 || (isCreditHeavy(cluster) && count >= 3))
        .sort((a, b) => b[1] - a[1])
        .map(([cluster, count]) => ({ cluster, count })),
    };

    return {
      ok: true,
      generatedAt: new Date().toISOString(),
      summary,
      items,
      recommendations: this.recommend(summary),
    };
  }

  static auditRecord({ record = {}, clusterCounts = {} } = {}) {
    const structured = getStructured(record);
    const html = structured.distributionAssets?.webStoryHtml || '';
    const distribution = structured.distribution || {};
    const webStory = distribution.webStory || {};
    const slides = structured.storyGeneration?.storyPreview?.slides || [];
    const cluster = storyCluster(record);
    const expectedStoryPath = webStory.path || `/stories/${record.slug}`;
    const seoValidation = validateWebStorySeo({
      article: {
        ...structured,
        slug: record.slug,
        title: record.title,
        metaDescription: structured.metaDescription || record.excerpt || structured.summary || '',
      },
      storyHtml: html,
      bookendJson: structured.distributionAssets?.bookendJson || '',
      distribution,
      slideAssets: structured.distributionAssets?.slides || [],
      posterImageUrl: structured.coverImage || record.coverImage || structured.ogImage || record.ogImage || '',
      storyPublicPath: expectedStoryPath,
      articleUrl: structured.canonicalUrl || `/blog/${record.slug}/`,
    });
    const fingerprint = WebStoryFingerprintService.evaluate({
      story: {
        slug: record.slug,
        cluster,
        slides,
        cta: structured.storyGeneration?.storyPreview?.cta || {},
        visualSystem: structured.storyGeneration?.storyPreview?.visualSystem || {},
      },
      history: [],
    });
    const scores = structured.storyGeneration?.scores || {};
    const discoverReadiness = Number(scores.discoverReadiness || scores.discoverPotential || 0);
    const fingerprintRisk = Number(scores.webStoryFingerprintRisk ?? fingerprint.webStoryFingerprintRisk ?? 0);
    const ampLikelyValid = hasAmpBoilerplate(html);
    const clusterSaturated = (clusterCounts[cluster] || 0) >= 5 || (isCreditHeavy(cluster) && (clusterCounts[cluster] || 0) >= 3);
    const wordSignals = normalize(slides.map((slide) => `${slide.headline || ''} ${slide.subline || ''}`).join(' '));
    const thinContent = slides.length < 5 || wordSignals.split(/\s+/).filter(Boolean).length < 35;
    const legacyWithoutScores = !structured.storyGeneration?.quality?.scores;

    const issues = [
      !ampLikelyValid ? 'amp_boilerplate_invalid' : null,
      !seoValidation.passed ? 'canonical_or_seo_issue' : null,
      fingerprintRisk > 30 ? 'fingerprint_high' : null,
      discoverReadiness > 0 && discoverReadiness < 85 ? 'discover_readiness_low' : null,
      clusterSaturated ? 'cluster_saturated' : null,
      thinContent ? 'thin_story_content' : null,
      legacyWithoutScores ? 'legacy_without_premium_scores' : null,
    ].filter(Boolean);
    const classification = this.classify({ issues, clusterSaturated, legacyWithoutScores, thinContent, seoValidation, ampLikelyValid });

    return {
      slug: record.slug,
      url: webStory.url || '',
      cluster,
      classification,
      issues,
      ampLikelyValid,
      seoPassed: seoValidation.passed,
      seoIssues: seoValidation.issues || [],
      fingerprintRisk: clamp(fingerprintRisk),
      discoverReadiness: discoverReadiness ? clamp(discoverReadiness) : null,
      slideCount: slides.length,
      clusterStoryCount: clusterCounts[cluster] || 0,
    };
  }

  static classify({ issues = [], clusterSaturated = false, legacyWithoutScores = false, thinContent = false, seoValidation = {}, ampLikelyValid = false } = {}) {
    if (!ampLikelyValid || !seoValidation.passed) return 'needs_rebuild';
    if (thinContent && clusterSaturated) return 'archive_candidate';
    if (clusterSaturated && legacyWithoutScores) return 'archive_candidate';
    if (legacyWithoutScores || issues.includes('discover_readiness_low')) return 'needs_refresh';
    return 'healthy';
  }

  static recommend(summary = {}) {
    return [
      summary.ampInvalid ? 'rebuild legado com boilerplate AMP valido antes de ampliar Discover' : null,
      summary.saturatedClusters?.length ? 'deindexar ou reconstruir apenas stories fortes em clusters saturados' : null,
      summary.archive_candidate ? 'criar fila de archive/noindex para stories legadas fracas' : null,
      summary.needs_refresh ? 'reconstruir stories importantes com composer premium e scores persistidos' : null,
    ].filter(Boolean);
  }
}

export default WebStoryObservabilityService;
