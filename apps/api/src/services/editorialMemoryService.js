import { getPrisma } from '../lib/prisma.js';
import { inferEditorialFamily } from './editorialTopicFatigueService.js';
import { repairPortugueseText } from './portugueseTextService.js';

const DAY_MS = 24 * 60 * 60 * 1000;

const compact = (value = '') => String(value || '').replace(/\s+/g, ' ').trim();

const toSlug = (value = '') =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

const normalize = (value = '') =>
  repairPortugueseText(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const tokens = (value = '') =>
  new Set(normalize(value).split(/\s+/).filter((token) => token.length >= 4));

const similarity = (left = '', right = '') => {
  const a = tokens(left);
  const b = tokens(right);
  if (!a.size || !b.size) return 0;
  let intersection = 0;
  for (const token of a) {
    if (b.has(token)) intersection += 1;
  }
  return Math.round((intersection / (a.size + b.size - intersection)) * 100);
};

const firstSentence = (value = '') => compact(value).split(/(?<=[.!?])\s+/)[0] || '';

const titlePattern = (title = '') =>
  normalize(title)
    .replace(/\bcomo\b/g, 'como')
    .replace(/\bvale a pena\b/g, 'vale-a-pena')
    .replace(/\b\d+\b/g, '{num}')
    .split(/\s+/)
    .slice(0, 8)
    .join(' ');

const articleText = (article = {}) => [
  article.title,
  article.h1,
  article.summary,
  article.excerpt,
  article.metaDescription,
  ...(article.intro || []),
  article.featuredSnippet,
  ...((article.sections || []).flatMap((section) => [
    section.heading,
    section.subheading,
    ...(section.paragraphs || []),
    ...(section.bullets || [])
  ])),
  ...((article.faq || []).flatMap((item) => [item.question, item.answer])),
  ...(article.conclusion || []),
  article.content
].filter(Boolean).join(' ');

const sectionHeadings = (article = {}) =>
  (Array.isArray(article.sections) ? article.sections : [])
    .map((section) => compact(section.heading || section.title || ''))
    .filter(Boolean);

const faqQuestions = (article = {}) =>
  (Array.isArray(article.faq) ? article.faq : [])
    .map((item) => compact(item.question || ''))
    .filter(Boolean);

const ctaPattern = (article = {}) => {
  const cta = article.cta || {};
  return normalize([
    cta.title,
    cta.description,
    cta.primary?.to,
    cta.secondary?.to
  ].filter(Boolean).join(' ')).slice(0, 140);
};

export const buildEditorialFingerprint = ({ article = {}, keyword = '', intent = '', serpIntent = '' } = {}) => {
  const text = articleText(article);
  const introText = Array.isArray(article.intro) ? article.intro[0] : firstSentence(article.content || '');
  const headings = sectionHeadings(article);
  const faq = faqQuestions(article);

  return {
    family: inferEditorialFamily({ keyword, topic: article.title, category: article.category, intent }),
    keyword: compact(keyword || article.clusterKeyword || article.title || ''),
    intent: compact(intent || article.intent || ''),
    serpIntent: compact(serpIntent || article.serpIntelligence?.searchIntent || ''),
    titleStructure: titlePattern(article.title || article.h1 || ''),
    introStructure: normalize(firstSentence(introText)).slice(0, 180),
    headingStructure: headings.map(titlePattern).join(' | '),
    faqStructure: faq.map(titlePattern).join(' | '),
    ctaPattern: ctaPattern(article),
    narrativeAngle: normalize([
      article.editorialAngle,
      article.serpIntelligence?.recommendedAngle,
      headings[0],
      headings[1]
    ].filter(Boolean).join(' ')).slice(0, 220),
    emotionalFrame: /golpe|medo|pressa|ansiedade|aperto|divida|risco/.test(normalize(text))
      ? 'defensive-caution'
      : /compar|cet|parcela|taxa|custo/.test(normalize(text))
        ? 'decision-cost'
        : 'educational-neutral',
    textSample: normalize(text).slice(0, 2400)
  };
};

const summarizeWindow = ({ rows = [], since }) => {
  const filtered = rows.filter((row) => {
    const date = row.publishedAt || row.createdAt;
    return date && new Date(date).getTime() >= since.getTime();
  });
  const byFamily = {};
  const byIntent = {};

  for (const row of filtered) {
    const structured = row.structuredContent && typeof row.structuredContent === 'object' ? row.structuredContent : {};
    const family = inferEditorialFamily({
      keyword: structured.clusterKeyword || row.title,
      topic: row.title,
      category: structured.category || row.category?.name,
      intent: structured.intent || ''
    });
    const intent = structured.serpIntelligence?.searchIntent || structured.intent || 'unknown';
    byFamily[family] = (byFamily[family] || 0) + 1;
    byIntent[intent] = (byIntent[intent] || 0) + 1;
  }

  return { total: filtered.length, byFamily, byIntent };
};

export class EditorialMemoryService {
  static async buildMemory({
    article = {},
    keyword = '',
    intent = '',
    serpIntent = '',
    includeDrafts = false,
    now = new Date()
  } = {}) {
    const fingerprint = buildEditorialFingerprint({ article, keyword, intent, serpIntent });

    try {
      const prisma = getPrisma();
      const since = new Date(now.getTime() - 365 * DAY_MS);
      const rows = await prisma.article.findMany({
        where: {
          ...(includeDrafts ? {} : { status: 'published' }),
          OR: [
            { publishedAt: { gte: since } },
            { createdAt: { gte: since } }
          ]
        },
        select: {
          slug: true,
          title: true,
          excerpt: true,
          content: true,
          seoDescription: true,
          status: true,
          publishedAt: true,
          createdAt: true,
          structuredContent: true,
          category: { select: { name: true } }
        },
        orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
        take: 350
      });

      const closestMatches = rows.map((row) => {
        const structured = row.structuredContent && typeof row.structuredContent === 'object' ? row.structuredContent : {};
        const existingFingerprint = buildEditorialFingerprint({
          article: {
            ...structured,
            title: row.title,
            summary: structured.summary || row.excerpt,
            metaDescription: structured.metaDescription || row.seoDescription,
            content: row.content
          },
          keyword: structured.clusterKeyword || row.title,
          intent: structured.intent || '',
          serpIntent: structured.serpIntelligence?.searchIntent || ''
        });
        const semanticScore = similarity(fingerprint.textSample, existingFingerprint.textSample);
        const exactSlugMatch = row.slug && [article.slug, keyword, article.title, article.h1].map(toSlug).filter(Boolean).includes(row.slug);
        const exactKeywordMatch = normalize(keyword || article.title) && normalize(keyword || article.title) === normalize(row.title || structured.clusterKeyword || '');
        const titleScore = exactSlugMatch || exactKeywordMatch ? 100 : similarity(fingerprint.titleStructure, existingFingerprint.titleStructure);
        const narrativeScore = similarity(fingerprint.narrativeAngle, existingFingerprint.narrativeAngle);
        const ctaScore = similarity(fingerprint.ctaPattern, existingFingerprint.ctaPattern);
        const structureScore = similarity(
          `${fingerprint.headingStructure} ${fingerprint.faqStructure}`,
          `${existingFingerprint.headingStructure} ${existingFingerprint.faqStructure}`
        );
        const score = exactSlugMatch || exactKeywordMatch
          ? 100
          : Math.max(semanticScore, titleScore, Math.round((narrativeScore + ctaScore + structureScore) / 3));

        return {
          slug: row.slug,
          title: row.title,
          family: existingFingerprint.family,
          status: row.status,
          score,
          semanticScore,
          titleScore,
          narrativeScore,
          ctaScore,
          structureScore,
          exactSlugMatch,
          exactKeywordMatch
        };
      }).sort((a, b) => b.score - a.score).slice(0, 10);

      const windows = {
        last7d: summarizeWindow({ rows, since: new Date(now.getTime() - 7 * DAY_MS) }),
        last30d: summarizeWindow({ rows, since: new Date(now.getTime() - 30 * DAY_MS) }),
        last90d: summarizeWindow({ rows, since: new Date(now.getTime() - 90 * DAY_MS) }),
        last12m: summarizeWindow({ rows, since: new Date(now.getTime() - 365 * DAY_MS) })
      };

      const topMatch = closestMatches[0] || null;
      const canibalizationRisk = topMatch ? Math.max(topMatch.semanticScore, topMatch.titleScore) : 0;

      return {
        ok: true,
        fingerprint,
        windows,
        closestMatches,
        canibalizationRisk,
        memorySize: rows.length
      };
    } catch (error) {
      return {
        ok: false,
        fingerprint,
        windows: {
          last7d: { total: 0, byFamily: {}, byIntent: {} },
          last30d: { total: 0, byFamily: {}, byIntent: {} },
          last90d: { total: 0, byFamily: {}, byIntent: {} },
          last12m: { total: 0, byFamily: {}, byIntent: {} }
        },
        closestMatches: [],
        canibalizationRisk: 0,
        error: error?.message || String(error)
      };
    }
  }
}
