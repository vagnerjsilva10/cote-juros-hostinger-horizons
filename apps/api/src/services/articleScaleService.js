import { getPrisma } from '../lib/prisma.js';
import { classifyArticleIntent, compactText, validateArticle } from './articleQualityService.js';
import { SeoGrowthService } from './seoGrowthService.js';

const normalize = (value = '') =>
  compactText(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

const getStructured = (article = {}) =>
  article.structuredContent && typeof article.structuredContent === 'object'
    ? article.structuredContent
    : {};

const getArticleIntent = (article = {}) => {
  const structured = getStructured(article);
  return structured.editorialIntent || classifyArticleIntent({
    title: article.title || structured.title,
    keyword: structured.clusterKeyword || article.cluster?.primaryKeyword || structured.tags?.[0],
    slug: article.slug,
    category: article.category?.name || structured.category
  });
};

const scoreDiscover = (article = {}) => {
  const structured = getStructured(article);
  const intent = getArticleIntent(article);
  const title = compactText(article.title || structured.title || '');
  const hasImage = Boolean(article.coverImage || structured.coverImage);
  const hasFreshness = article.updatedAt && (Date.now() - new Date(article.updatedAt).getTime()) < 14 * 24 * 60 * 60 * 1000;
  const hasSnippet = compactText(structured.featuredSnippet || '').length >= 50;
  const hasFaq = Array.isArray(structured.faq) && structured.faq.length >= 4;
  const titleFit = title.length >= 35 && title.length <= 78;
  const intentBoost = intent === 'news' ? 18 : intent === 'decision' ? 12 : intent === 'tool' ? 10 : 7;

  return Math.max(0, Math.min(100,
    intentBoost
    + (hasImage ? 22 : 0)
    + (hasFreshness ? 18 : 0)
    + (hasSnippet ? 14 : 0)
    + (hasFaq ? 12 : 0)
    + (titleFit ? 16 : 4)
  ));
};

const buildClusterSummary = (rows = []) => rows.map((cluster) => {
  const published = cluster.articles?.filter((article) => article.status === 'published') || [];
  const byIntent = published.reduce((acc, article) => {
    const intent = getArticleIntent(article);
    acc[intent] = (acc[intent] || 0) + 1;
    return acc;
  }, {});
  const missingIntents = ['guide', 'decision', 'comparison', 'howto', 'tool'].filter((intent) => !byIntent[intent]);
  const lastPublishedAt = published
    .map((article) => article.publishedAt || article.createdAt)
    .filter(Boolean)
    .sort((a, b) => new Date(b) - new Date(a))[0] || null;
  const ageDays = lastPublishedAt ? Math.round((Date.now() - new Date(lastPublishedAt).getTime()) / 86400000) : 999;
  const score = Math.min(100, missingIntents.length * 14 + Math.min(ageDays, 45) + (published.length < 5 ? 20 : 0));

  return {
    clusterId: cluster.id,
    clusterSlug: cluster.slug,
    clusterName: cluster.name,
    primaryKeyword: cluster.primaryKeyword,
    publishedCount: published.length,
    byIntent,
    missingIntents,
    lastPublishedAt,
    score
  };
}).sort((a, b) => b.score - a.score);

export class ArticleScaleService {
  static async runQualityMonitor({ limit = 500, includeDrafts = false } = {}) {
    const prisma = getPrisma();
    const startedAt = new Date();
    const articles = await prisma.article.findMany({
      where: includeDrafts ? {} : { status: 'published' },
      include: { category: true, cluster: true },
      orderBy: [{ updatedAt: 'desc' }],
      take: Math.min(Number(limit) || 500, 1000)
    });

    const items = articles.map((article) => {
      const structured = getStructured(article);
      const internalLinks = Array.isArray(structured.internalLinks) ? structured.internalLinks : [];
      const validation = validateArticle({ article: { ...structured, slug: article.slug, title: article.title }, internalLinks });
      const discoverScore = scoreDiscover(article);
      const issues = [...validation.issues];
      if (discoverScore < 55) issues.push(`Discover fraco: score ${discoverScore}`);

      return {
        slug: article.slug,
        status: article.status,
        intent: getArticleIntent(article),
        discoverScore,
        passed: issues.length === 0,
        issues,
        checks: validation.checks
      };
    });

    const failing = items.filter((item) => !item.passed);
    const jobRun = await prisma.editorialJobRun.create({
      data: {
        jobName: 'article-quality-monitor',
        triggerSource: 'scale-layer',
        status: failing.length ? 'draft_saved' : 'succeeded',
        startedAt,
        finishedAt: new Date(),
        durationMs: Date.now() - startedAt.getTime(),
        metadata: {
          scanned: items.length,
          failing: failing.length,
          items: items.slice(0, 200)
        },
        errorMessage: failing.length ? `${failing.length} artigos precisam de revisão` : null
      }
    });

    return {
      ok: true,
      jobRunId: jobRun.id,
      scanned: items.length,
      passing: items.length - failing.length,
      failing: failing.length,
      items: failing.slice(0, 50)
    };
  }

  static async buildClusterQueue({ limit = 20 } = {}) {
    const prisma = getPrisma();
    const clusters = await prisma.seoCluster.findMany({
      where: { status: 'active' },
      include: {
        articles: {
          select: {
            slug: true,
            title: true,
            status: true,
            publishedAt: true,
            createdAt: true,
            structuredContent: true,
            category: true,
            cluster: true
          }
        },
        briefs: {
          where: { status: { in: ['planned', 'briefing_ready', 'draft', 'failed'] } },
          orderBy: [{ scheduledFor: 'asc' }, { createdAt: 'asc' }],
          take: 5
        }
      }
    });

    const queue = buildClusterSummary(clusters).slice(0, Math.min(Number(limit) || 20, 50)).map((cluster) => ({
      ...cluster,
      nextBriefHint: cluster.missingIntents[0]
        ? `${cluster.primaryKeyword} - ${cluster.missingIntents[0]}`
        : `${cluster.primaryKeyword} - atualizar cluster`,
      recommendation: cluster.missingIntents.length
        ? `Criar conteudo ${cluster.missingIntents[0]} para fechar cobertura do cluster.`
        : 'Atualizar artigos com pior CTR e reforcar links internos.'
    }));

    return {
      ok: true,
      count: queue.length,
      queue
    };
  }

  static async buildSearchConsolePriority({ limit = 25 } = {}) {
    const opportunities = await SeoGrowthService.listSearchOpportunities({ limit, minImpressions: 5 });
    const items = (opportunities.items || []).map((item) => ({
      ...item,
      priorityType: item.metric.position >= 8 && item.metric.position <= 20
        ? 'near_top10'
        : item.metric.ctr < 0.02
          ? 'ctr_gap'
          : 'query_expansion',
      recommendedLayer: item.metric.position >= 8 && item.metric.position <= 20
        ? 'adicionar bloco direto, FAQ e 3 links internos para empurrar top 10'
        : 'testar headline/meta e reforcar resposta curta acima da dobra'
    }));

    return {
      ok: true,
      range: opportunities.range || null,
      count: items.length,
      items
    };
  }

  static async runDiscoverAudit({ limit = 200 } = {}) {
    const prisma = getPrisma();
    const articles = await prisma.article.findMany({
      where: { status: 'published' },
      include: { category: true, cluster: true },
      orderBy: [{ publishedAt: 'desc' }],
      take: Math.min(Number(limit) || 200, 500)
    });

    const items = articles.map((article) => {
      const structured = getStructured(article);
      const score = scoreDiscover(article);
      const title = compactText(article.title || '');
      const issues = [];
      if (!article.coverImage && !structured.coverImage) issues.push('imagem de capa ausente');
      if (title.length > 82) issues.push('headline longa para Discover');
      if (!structured.featuredSnippet) issues.push('resposta direta ausente');
      if (!Array.isArray(structured.ctas) || structured.ctas.length < 3) issues.push('CTAs incompletos');

      return {
        slug: article.slug,
        title,
        intent: getArticleIntent(article),
        score,
        issues,
        recommendation: score >= 75
          ? 'bom candidato para Discover'
          : 'melhorar imagem, atualidade, resposta direta e titulo'
      };
    }).sort((a, b) => a.score - b.score);

    return {
      ok: true,
      scanned: items.length,
      weak: items.filter((item) => item.score < 55).length,
      items: items.slice(0, 50)
    };
  }

  static async runScaleLayers({ limit = 200 } = {}) {
    const [quality, clusterQueue, searchPriority, discover] = await Promise.all([
      this.runQualityMonitor({ limit }),
      this.buildClusterQueue({ limit: 20 }),
      this.buildSearchConsolePriority({ limit: 25 }),
      this.runDiscoverAudit({ limit })
    ]);

    return {
      ok: true,
      layers: {
        intentClassification: true,
        qualityMonitor: quality,
        searchConsolePriority: searchPriority,
        clusterQueue,
        discover
      }
    };
  }
}
