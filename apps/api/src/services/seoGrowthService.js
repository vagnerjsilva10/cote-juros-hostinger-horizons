import { google } from 'googleapis';
import { getPrisma } from '../lib/prisma.js';
import { SITE_BASE_URL } from './editorialConfig.js';

const DEFAULT_SITE_URL = process.env.SEARCH_CONSOLE_SITE_URL || SITE_BASE_URL;
const SEARCH_CONSOLE_SCOPE = 'https://www.googleapis.com/auth/webmasters.readonly';
const BLOG_PATH_RE = /\/blog\/([^/?#]+)/i;

const normalizePrivateKey = (value = '') => String(value || '').replace(/\\n/g, '\n');
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const normalize = (value = '') =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

const toDateOnly = (date) => new Date(date).toISOString().slice(0, 10);
const addDays = (date, days) => {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
};

const getDateRange = (days = 28) => {
  const end = addDays(new Date(), -2);
  const start = addDays(end, -Math.max(1, Number(days) || 28));
  return {
    startDate: toDateOnly(start),
    endDate: toDateOnly(end),
    dateFrom: new Date(`${toDateOnly(start)}T00:00:00.000Z`),
    dateTo: new Date(`${toDateOnly(end)}T00:00:00.000Z`)
  };
};

const extractSlugFromPage = (page = '') => {
  const match = String(page || '').match(BLOG_PATH_RE);
  return match?.[1]?.replace(/\/$/, '') || '';
};

const getAuthClient = () => {
  const oauthClientId = process.env.SEARCH_CONSOLE_CLIENT_ID || process.env.GOOGLE_OAUTH_CLIENT_ID;
  const oauthClientSecret = process.env.SEARCH_CONSOLE_CLIENT_SECRET || process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  const oauthRefreshToken = process.env.SEARCH_CONSOLE_REFRESH_TOKEN || process.env.GOOGLE_OAUTH_REFRESH_TOKEN;
  const oauthRedirectUri = process.env.SEARCH_CONSOLE_REDIRECT_URI || 'http://localhost:3000/oauth2callback';

  if (oauthClientId && oauthClientSecret && oauthRefreshToken) {
    const oauthClient = new google.auth.OAuth2(oauthClientId, oauthClientSecret, oauthRedirectUri);
    oauthClient.setCredentials({ refresh_token: oauthRefreshToken });
    return oauthClient;
  }

  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || process.env.SEARCH_CONSOLE_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY || process.env.SEARCH_CONSOLE_PRIVATE_KEY;

  if (clientEmail && privateKey) {
    return new google.auth.JWT({
      email: clientEmail,
      key: normalizePrivateKey(privateKey),
      scopes: [SEARCH_CONSOLE_SCOPE]
    });
  }

  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    return new google.auth.GoogleAuth({
      scopes: [SEARCH_CONSOLE_SCOPE]
    });
  }

  return null;
};

const expectedCtrForPosition = (position) => {
  const value = Number(position) || 0;
  if (value <= 1) return 0.28;
  if (value <= 3) return 0.16;
  if (value <= 5) return 0.09;
  if (value <= 10) return 0.045;
  if (value <= 20) return 0.02;
  return 0.01;
};

const buildAction = ({ ctr, position, query }) => {
  if (position >= 8 && position <= 20) {
    return 'expandir secao, reforcar links internos e adicionar FAQ para buscar top 10';
  }

  if (ctr < expectedCtrForPosition(position) * 0.7) {
    return 'testar meta title e meta description com promessa mais clara para elevar CTR';
  }

  if (/como|qual|quanto|vale a pena|simul/.test(normalize(query))) {
    return 'adicionar resposta direta e FAQ baseada na consulta';
  }

  return 'reforcar atualizacao editorial e links internos';
};

const scoreOpportunity = ({ clicks, impressions, ctr, position, query }) => {
  const impressionScore = clamp(Math.log10(Math.max(Number(impressions) || 0, 1)) * 18, 0, 36);
  const positionScore = Number(position) >= 6 && Number(position) <= 20
    ? 34
    : Number(position) > 20 && Number(position) <= 35
      ? 18
      : Number(position) <= 5
        ? 8
        : 4;
  const ctrGap = Math.max(expectedCtrForPosition(position) - Number(ctr || 0), 0);
  const ctrScore = clamp(ctrGap * 500, 0, 22);
  const questionScore = /como|qual|quanto|vale a pena|simul|melhor/.test(normalize(query)) ? 8 : 0;
  const clickPenalty = Number(clicks) > 20 && Number(position) <= 5 ? 12 : 0;

  return Math.round(clamp(impressionScore + positionScore + ctrScore + questionScore - clickPenalty, 0, 100));
};

const serializeMetric = (metric = {}) => ({
  id: metric.id,
  page: metric.page,
  query: metric.query,
  clicks: metric.clicks,
  impressions: metric.impressions,
  ctr: Number(metric.ctr || 0),
  position: Number(metric.position || 0),
  dateFrom: metric.dateFrom,
  dateTo: metric.dateTo
});

export class SeoGrowthService {
  static getSearchConsoleHealth() {
    const hasOAuth = Boolean(
      (process.env.SEARCH_CONSOLE_CLIENT_ID || process.env.GOOGLE_OAUTH_CLIENT_ID)
      && (process.env.SEARCH_CONSOLE_CLIENT_SECRET || process.env.GOOGLE_OAUTH_CLIENT_SECRET)
      && (process.env.SEARCH_CONSOLE_REFRESH_TOKEN || process.env.GOOGLE_OAUTH_REFRESH_TOKEN)
    );
    const hasServiceAccount = Boolean(
      (process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || process.env.SEARCH_CONSOLE_CLIENT_EMAIL)
      && (process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY || process.env.SEARCH_CONSOLE_PRIVATE_KEY)
    );

    return {
      configured: Boolean(getAuthClient()),
      siteUrl: DEFAULT_SITE_URL,
      hasOAuth,
      hasServiceAccount,
      hasApplicationCredentials: Boolean(process.env.GOOGLE_APPLICATION_CREDENTIALS)
    };
  }

  static async syncSearchConsole({ days = 28, rowLimit = 25000 } = {}) {
    const auth = getAuthClient();
    if (!auth) {
      return {
        ok: false,
        reason: 'search_console_not_configured',
        health: this.getSearchConsoleHealth()
      };
    }

    const prisma = getPrisma();
    const range = getDateRange(days);
    const searchconsole = google.searchconsole({ version: 'v1', auth });
    const response = await searchconsole.searchanalytics.query({
      siteUrl: DEFAULT_SITE_URL,
      requestBody: {
        startDate: range.startDate,
        endDate: range.endDate,
        dimensions: ['page', 'query'],
        rowLimit: Math.min(Number(rowLimit) || 25000, 25000),
        startRow: 0,
        dimensionFilterGroups: [
          {
            filters: [
              {
                dimension: 'page',
                operator: 'contains',
                expression: '/blog/'
              }
            ]
          }
        ]
      }
    });

    const rows = Array.isArray(response.data?.rows) ? response.data.rows : [];
    let stored = 0;
    for (const row of rows) {
      const [page, query] = row.keys || [];
      if (!page || !query) continue;

      await prisma.seoSearchConsoleMetric.upsert({
        where: {
          siteUrl_page_query_dateFrom_dateTo: {
            siteUrl: DEFAULT_SITE_URL,
            page,
            query,
            dateFrom: range.dateFrom,
            dateTo: range.dateTo
          }
        },
        update: {
          clicks: Math.round(row.clicks || 0),
          impressions: Math.round(row.impressions || 0),
          ctr: Number(row.ctr || 0),
          position: Number(row.position || 0),
          syncedAt: new Date()
        },
        create: {
          siteUrl: DEFAULT_SITE_URL,
          page,
          query,
          dateFrom: range.dateFrom,
          dateTo: range.dateTo,
          clicks: Math.round(row.clicks || 0),
          impressions: Math.round(row.impressions || 0),
          ctr: Number(row.ctr || 0),
          position: Number(row.position || 0)
        }
      });
      stored += 1;
    }

    return {
      ok: true,
      siteUrl: DEFAULT_SITE_URL,
      range,
      rows: rows.length,
      stored
    };
  }

  static async listSearchConsoleSites() {
    const auth = getAuthClient();
    if (!auth) {
      return {
        ok: false,
        reason: 'search_console_not_configured',
        health: this.getSearchConsoleHealth()
      };
    }

    const searchconsole = google.searchconsole({ version: 'v1', auth });
    const response = await searchconsole.sites.list();
    const sites = (response.data?.siteEntry || []).map((site) => ({
      siteUrl: site.siteUrl,
      permissionLevel: site.permissionLevel
    }));

    return {
      ok: true,
      count: sites.length,
      configuredSiteUrl: DEFAULT_SITE_URL,
      sites
    };
  }

  static async listSearchOpportunities({ limit = 25, minImpressions = 20 } = {}) {
    const prisma = getPrisma();
    const latest = await prisma.seoSearchConsoleMetric.findFirst({
      orderBy: { dateTo: 'desc' },
      select: { dateFrom: true, dateTo: true, siteUrl: true }
    });

    if (!latest) {
      return {
        ok: true,
        configured: this.getSearchConsoleHealth().configured,
        count: 0,
        items: []
      };
    }

    const metrics = await prisma.seoSearchConsoleMetric.findMany({
      where: {
        siteUrl: latest.siteUrl,
        dateFrom: latest.dateFrom,
        dateTo: latest.dateTo,
        impressions: { gte: Number(minImpressions) || 20 }
      },
      orderBy: [{ impressions: 'desc' }, { position: 'asc' }],
      take: 500
    });

    const slugs = [...new Set(metrics.map((metric) => extractSlugFromPage(metric.page)).filter(Boolean))];
    const articles = await prisma.article.findMany({
      where: {
        slug: { in: slugs },
        status: 'published'
      },
      include: { cluster: true, category: true }
    });
    const articleBySlug = new Map(articles.map((article) => [article.slug, article]));

    const seen = new Set();
    const items = metrics
      .map((metric) => {
        const serialized = serializeMetric(metric);
        const slug = extractSlugFromPage(metric.page);
        const article = articleBySlug.get(slug);
        const score = scoreOpportunity(serialized);

        return {
          score,
          action: buildAction(serialized),
          slug,
          articleId: article?.id || null,
          title: article?.title || '',
          category: article?.category?.name || '',
          cluster: article?.cluster?.name || '',
          metric: serialized
        };
      })
      .filter((item) => item.slug && item.articleId && item.score >= 30)
      .sort((left, right) => {
        if (right.score !== left.score) return right.score - left.score;
        return right.metric.impressions - left.metric.impressions;
      })
      .filter((item) => {
        const key = `${item.slug}:${normalize(item.metric.query)}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, Math.min(Number(limit) || 25, 100));

    return {
      ok: true,
      range: {
        dateFrom: latest.dateFrom,
        dateTo: latest.dateTo
      },
      count: items.length,
      items
    };
  }

  static async applySafeRefresh({ limit = 5 } = {}) {
    const prisma = getPrisma();
    const opportunities = await this.listSearchOpportunities({ limit, minImpressions: 20 });
    const updates = [];

    for (const item of opportunities.items || []) {
      const article = await prisma.article.findUnique({
        where: { id: item.articleId }
      });
      if (!article) continue;

      const structured = article.structuredContent && typeof article.structuredContent === 'object'
        ? article.structuredContent
        : {};
      const existingFaq = Array.isArray(structured.faq) ? structured.faq : [];
      const query = item.metric.query;
      const question = /^(como|qual|quanto|vale|por que|o que)\b/i.test(query)
        ? `${query.replace(/\?+$/, '')}?`
        : `O que considerar sobre ${query}?`;
      const faqExists = existingFaq.some((faq) => normalize(faq.question).includes(normalize(query)));
      const nextFaq = faqExists
        ? existingFaq
        : [
            ...existingFaq,
            {
              question,
              answer: `Antes de decidir, compare custo total, taxas, prazo, riscos e alternativas. Essa consulta aparece nas buscas do Google e merece uma resposta direta dentro do artigo.`
            }
          ].slice(0, 6);

      const seoGrowth = {
        ...(structured.seoGrowth || {}),
        lastRefreshAt: new Date().toISOString(),
        opportunity: {
          score: item.score,
          query,
          action: item.action,
          impressions: item.metric.impressions,
          clicks: item.metric.clicks,
          ctr: item.metric.ctr,
          position: item.metric.position
        }
      };

      await prisma.article.update({
        where: { id: article.id },
        data: {
          structuredContent: {
            ...structured,
            faq: nextFaq,
            seoGrowth
          }
        }
      });

      updates.push({
        slug: item.slug,
        query,
        score: item.score,
        faqAdded: !faqExists
      });
    }

    return {
      ok: true,
      updated: updates.length,
      updates
    };
  }
}
