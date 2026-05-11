import axios from 'axios';
import { getPrisma } from '../lib/prisma.js';
import { DEFAULT_EDITORIAL_CLUSTERS, SITE_BASE_URL } from './editorialConfig.js';
import { EditorialService } from './editorialService.js';
import { createEditorialLogger } from './editorialLogger.js';
import { buildSerpIntelligenceFromResults } from './serpIntelligenceService.js';

const logger = createEditorialLogger('competitor-seo-research');
const OWN_DOMAIN_RE = /(^|\.)cotejuros\.com\.br$/i;
const DEFAULT_COMPETITORS = [
  'serasa.com.br',
  'finanzero.com.br',
  'mobills.com.br',
  'meutudo.com.br',
  'iq.com.br',
  'bxblue.com.br',
  'bompracredito.com.br',
  'melhorplano.net'
];
const COMMERCIAL_TERMS = [
  /emprestimo/i,
  /financiamento/i,
  /cartao/i,
  /juros/i,
  /score/i,
  /negativado/i,
  /simul/i,
  /compar/i
];

const normalize = (value = '') =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

const toSlug = (value = '') =>
  normalize(value)
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

const domainFromUrl = (value = '') => {
  try {
    return new URL(value).hostname.replace(/^www\./i, '').toLowerCase();
  } catch {
    return '';
  }
};

const parseListEnv = (value = '') =>
  String(value || '')
    .split(',')
    .map((item) => item.trim().replace(/^https?:\/\//i, '').replace(/^www\./i, '').replace(/\/.*$/, ''))
    .filter(Boolean);

const getCompetitors = () => parseListEnv(process.env.COMPETITOR_SEO_DOMAINS).length
  ? parseListEnv(process.env.COMPETITOR_SEO_DOMAINS)
  : DEFAULT_COMPETITORS;

const getProvider = () => {
  if (process.env.SERPAPI_API_KEY) return 'serpapi';
  if (process.env.VALUESERP_API_KEY) return 'valueserp';
  return process.env.COMPETITOR_SERP_PROVIDER || 'disabled';
};

const buildQueries = ({ limit = 25 } = {}) => {
  const queries = [];
  for (const cluster of DEFAULT_EDITORIAL_CLUSTERS) {
    queries.push({
      query: cluster.primaryKeyword,
      clusterSlug: cluster.slug,
      clusterName: cluster.name,
      source: 'cluster'
    });

    for (const brief of cluster.briefs || []) {
      queries.push({
        query: brief.primaryKeyword,
        clusterSlug: cluster.slug,
        clusterName: cluster.name,
        source: 'brief',
        briefSlug: brief.slug
      });
    }
  }

  const seen = new Set();
  return queries
    .filter((item) => {
      const key = normalize(item.query);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, Math.min(Number(limit) || 25, 100));
};

const normalizeSerpApiResults = (items = []) =>
  items.map((item, index) => ({
    title: item.title || '',
    url: item.link || '',
    snippet: item.snippet || '',
    position: Number(item.position || index + 1),
    raw: item
  }));

const normalizeValueSerpResults = (items = []) =>
  items.map((item, index) => ({
    title: item.title || '',
    url: item.link || item.url || '',
    snippet: item.snippet || '',
    position: Number(item.position || index + 1),
    raw: item
  }));

const calculateScore = ({ result, hasOwnCoverage, exactBriefExists, competitorDomain }) => {
  const position = Number(result.position || 20);
  const positionScore = Math.max(0, 42 - position * 3);
  const gapScore = hasOwnCoverage ? 8 : 32;
  const exactPenalty = exactBriefExists ? 18 : 0;
  const commercialScore = COMMERCIAL_TERMS.some((pattern) =>
    pattern.test(`${result.title} ${result.snippet} ${result.url}`)
  ) ? 18 : 8;
  const competitorScore = competitorDomain ? 12 : 0;

  return Math.max(0, Math.min(100, Math.round(positionScore + gapScore + commercialScore + competitorScore - exactPenalty)));
};

const buildRecommendedTitle = ({ query, result }) => {
  const cleanQuery = String(query || '').trim();
  if (/como|vale a pena|melhor|simul/i.test(cleanQuery)) {
    return `${cleanQuery.charAt(0).toUpperCase()}${cleanQuery.slice(1)}: guia para comparar com seguranca`;
  }

  const titleHint = String(result.title || '').split(/[|:-]/)[0].trim();
  if (titleHint && titleHint.length >= 24 && titleHint.length <= 80) {
    return `${titleHint}: o que comparar antes de decidir`;
  }

  return `${cleanQuery.charAt(0).toUpperCase()}${cleanQuery.slice(1)}: como comparar custo, risco e alternativas`;
};

export class CompetitorSeoResearchService {
  static getHealth() {
    const provider = getProvider();
    return {
      configured: provider === 'serpapi' || provider === 'valueserp',
      provider,
      competitors: getCompetitors(),
      hasSerpApi: Boolean(process.env.SERPAPI_API_KEY),
      hasValueSerp: Boolean(process.env.VALUESERP_API_KEY)
    };
  }

  static async fetchSerp({ query, num = 10 } = {}) {
    const provider = getProvider();
    if (provider === 'serpapi') {
      const response = await axios.get('https://serpapi.com/search.json', {
        timeout: 20000,
        params: {
          engine: 'google',
          q: query,
          google_domain: 'google.com.br',
          gl: 'br',
          hl: 'pt-br',
          num,
          api_key: process.env.SERPAPI_API_KEY
        }
      });
      return normalizeSerpApiResults(response.data?.organic_results || []);
    }

    if (provider === 'valueserp') {
      const response = await axios.get('https://api.valueserp.com/search', {
        timeout: 20000,
        params: {
          q: query,
          location: 'Brazil',
          google_domain: 'google.com.br',
          gl: 'br',
          hl: 'pt',
          num,
          api_key: process.env.VALUESERP_API_KEY
        }
      });
      return normalizeValueSerpResults(response.data?.organic_results || []);
    }

    return [];
  }

  static async runResearch({ queryLimit = 25, resultsPerQuery = 10, createBriefs = true, briefLimit = 5 } = {}) {
    const health = this.getHealth();
    if (!health.configured) {
      return {
        ok: false,
        status: 'disabled',
        reason: 'missing_serp_provider',
        health
      };
    }

    const prisma = getPrisma();
    await EditorialService.ensureClusterCalendar();
    const queries = buildQueries({ limit: queryLimit });
    const competitors = getCompetitors();
    const existingArticles = await prisma.article.findMany({
      where: { status: 'published' },
      select: { slug: true, title: true, excerpt: true, content: true, structuredContent: true }
    });
    const existingBriefs = await prisma.editorialBrief.findMany({
      select: { slug: true, primaryKeyword: true, title: true }
    });
    const existingBriefTerms = new Set(existingBriefs.map((brief) => normalize(brief.primaryKeyword || brief.title)));
    const stored = [];
    const serpByQuery = new Map();

    for (const item of queries) {
      let results = [];
      try {
        results = await this.fetchSerp({ query: item.query, num: resultsPerQuery });
      } catch (error) {
        await logger.warn('competitor_serp_fetch_failed', {
          query: item.query,
          error: error?.message || String(error)
        });
        continue;
      }

      const ownCoverage = existingArticles.some((article) =>
        normalize(`${article.title} ${article.excerpt || ''} ${article.content || ''}`).includes(normalize(item.query))
      );
      const exactBriefExists = existingBriefTerms.has(normalize(item.query));
      serpByQuery.set(item.query, {
        query: item.query,
        results: results.slice(0, resultsPerQuery)
      });

      for (const result of results) {
        const domain = domainFromUrl(result.url);
        if (!domain || OWN_DOMAIN_RE.test(domain)) continue;

        const competitorDomain = competitors.find((candidate) =>
          domain === candidate || domain.endsWith(`.${candidate}`)
        ) || domain;

        const recommendedTitle = buildRecommendedTitle({ query: item.query, result });
        const recommendedSlug = toSlug(recommendedTitle).slice(0, 90);
        const score = calculateScore({
          result,
          hasOwnCoverage: ownCoverage,
          exactBriefExists,
          competitorDomain
        });
        const gapReason = ownCoverage
          ? 'existing_article_can_be_expanded'
          : 'no_clear_published_coverage';

        const record = await prisma.competitorSeoOpportunity.upsert({
          where: {
            query_competitorUrl: {
              query: item.query,
              competitorUrl: result.url
            }
          },
          update: {
            clusterSlug: item.clusterSlug,
            clusterName: item.clusterName,
            competitorDomain,
            competitorTitle: result.title,
            snippet: result.snippet,
            position: result.position,
            score,
            gapReason,
            recommendedTitle,
            recommendedSlug,
            rawResult: result.raw || result,
            analyzedAt: new Date()
          },
          create: {
            query: item.query,
            clusterSlug: item.clusterSlug,
            clusterName: item.clusterName,
            competitorDomain,
            competitorUrl: result.url,
            competitorTitle: result.title,
            snippet: result.snippet,
            position: result.position,
            score,
            gapReason,
            recommendedTitle,
            recommendedSlug,
            rawResult: result.raw || result
          }
        });
        stored.push(record);
      }
    }

    const briefs = createBriefs
      ? await this.createBriefsFromGaps({ limit: briefLimit, serpByQuery })
      : { ok: true, created: 0, items: [] };

    return {
      ok: true,
      provider: health.provider,
      queries: queries.length,
      stored: stored.length,
      briefs
    };
  }

  static async listOpportunities({ limit = 25, minScore = 45 } = {}) {
    const prisma = getPrisma();
    const items = await prisma.competitorSeoOpportunity.findMany({
      where: {
        score: { gte: Number(minScore) || 45 },
        status: { in: ['new', 'brief_created'] }
      },
      orderBy: [{ score: 'desc' }, { position: 'asc' }, { analyzedAt: 'desc' }],
      take: Math.min(Number(limit) || 25, 100)
    });

    return {
      ok: true,
      configured: this.getHealth().configured,
      count: items.length,
      items
    };
  }

  static async createBriefsFromGaps({ limit = 5, minScore = 60, serpByQuery = new Map() } = {}) {
    const prisma = getPrisma();
    await EditorialService.ensureClusterCalendar();
    const opportunities = await prisma.competitorSeoOpportunity.findMany({
      where: {
        score: { gte: Number(minScore) || 60 },
        status: 'new',
        recommendedSlug: { not: null },
        clusterSlug: { not: null }
      },
      orderBy: [{ score: 'desc' }, { position: 'asc' }],
      take: Math.min(Number(limit) || 5, 20)
    });
    const created = [];

    for (const opportunity of opportunities) {
      const cluster = await prisma.seoCluster.findUnique({
        where: { slug: opportunity.clusterSlug || '' }
      });
      if (!cluster) continue;

      const slug = opportunity.recommendedSlug || toSlug(opportunity.recommendedTitle || opportunity.query);
      const existing = await prisma.editorialBrief.findUnique({ where: { slug } });
      if (existing) {
        await prisma.competitorSeoOpportunity.update({
          where: { id: opportunity.id },
          data: { status: 'brief_exists' }
        });
        continue;
      }

      const scheduledFor = new Date(Date.now() + (created.length + 1) * 24 * 60 * 60 * 1000);
      const serpContext = serpByQuery.get(opportunity.query) || {
        results: [{
          position: opportunity.position,
          title: opportunity.competitorTitle,
          url: opportunity.competitorUrl,
          snippet: opportunity.snippet
        }]
      };
      const serpIntelligence = buildSerpIntelligenceFromResults({
        keyword: opportunity.query,
        serp: serpContext
      });
      const briefPayload = {
        clusterSlug: cluster.slug,
        clusterLabel: cluster.name,
        primaryKeyword: opportunity.query,
        secondaryKeywords: [
          opportunity.competitorTitle,
          opportunity.competitorDomain,
          'comparar opcoes',
          'custo real'
        ].filter(Boolean).slice(0, 5),
        pillarTitle: cluster.pillarTitle,
        pillarSlug: cluster.pillarSlug,
        stage: 'middle',
        angle: 'competitor-gap',
        targetLength: '1400-2000 palavras',
        requiredStructure: serpIntelligence.recommendedStructure?.length
          ? serpIntelligence.recommendedStructure
          : ['h1', 'summary', '6-8 h2/h3 blocks', 'faq', 'cta'],
        competitorInsight: {
          source: opportunity.competitorDomain,
          url: opportunity.competitorUrl,
          title: opportunity.competitorTitle,
          position: opportunity.position,
          gapReason: opportunity.gapReason
        },
        serpIntelligence
      };

      const brief = await prisma.editorialBrief.create({
        data: {
          clusterId: cluster.id,
          slug,
          title: opportunity.recommendedTitle || opportunity.query,
          primaryKeyword: opportunity.query,
          secondaryKeywords: briefPayload.secondaryKeywords,
          stage: 'middle',
          brief: briefPayload,
          seoTitle: `${opportunity.recommendedTitle || opportunity.query} | Blog Cote Juros`,
          metaDescription: `Veja como avaliar ${opportunity.query}, comparar custo real e decidir com mais seguranca.`,
          scheduledFor,
          status: 'planned'
        }
      });

      await prisma.competitorSeoOpportunity.update({
        where: { id: opportunity.id },
        data: { status: 'brief_created' }
      });
      created.push({
        id: brief.id,
        slug: brief.slug,
        title: brief.title,
        query: opportunity.query,
        score: opportunity.score
      });
    }

    return {
      ok: true,
      created: created.length,
      items: created
    };
  }
}
