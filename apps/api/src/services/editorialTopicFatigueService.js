import { getPrisma } from '../lib/prisma.js';

const DAY_MS = 24 * 60 * 60 * 1000;

const STOPWORDS = new Set([
  'a', 'o', 'os', 'as', 'um', 'uma', 'de', 'do', 'da', 'dos', 'das', 'e', 'em', 'no', 'na', 'nos', 'nas',
  'para', 'por', 'com', 'sem', 'como', 'quando', 'quanto', 'qual', 'quais', 'que', 'vale', 'pena', 'sobre',
  'guia', 'completo', 'veja', 'custos', 'riscos', 'antes', 'contratar', 'fazer'
]);

const FAMILY_RULES = [
  { family: 'score', pattern: /score|pontuacao de credito|pontuação de crédito/i, weeklyMax: 1 },
  { family: 'FGTS', pattern: /fgts|saque aniversario|saque-aniversario/i, weeklyMax: 1 },
  { family: 'golpes_fraudes', pattern: /golpe|fraude|clonado|pix errado|compra indevida|cobranca indevida|cobrança indevida/i, weeklyMax: 2, weeklyMin: 1 },
  { family: 'trend_news', pattern: /selic|copom|inflacao|inflação|inss|nova regra|governo|banco central|2026|hoje/i, weeklyMax: 3, weeklyMin: 2 },
  { family: 'cartao', pattern: /cartao|cartão|limite|fatura|rotativo/i, weeklyMax: 2 },
  { family: 'consignado', pattern: /consignado|margem consignavel|margem consignável|inss/i, weeklyMax: 1 },
  { family: 'financiamento', pattern: /financiamento|veiculo|veículo|imovel|imóvel|entrada/i, weeklyMax: 1 },
  { family: 'dividas', pattern: /divida|dívida|endividamento|superendividamento|juros do rotativo/i, weeklyMax: 2 },
  { family: 'renegociacao', pattern: /renegociacao|renegociação|limpar o nome|acordo/i, weeklyMax: 1 },
  { family: 'credito_emprestimo', pattern: /credito|crédito|emprestimo|empréstimo|garantia|pessoal|negativado/i, weeklyMax: 2 },
  { family: 'educacao_financeira', pattern: /orcamento|orçamento|reserva|planejamento|educacao financeira|educação financeira/i, weeklyMax: 3, weeklyMin: 2 }
];

const normalize = (value = '') =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const tokenize = (value = '') =>
  normalize(value)
    .split(/\s+/)
    .filter((token) => token.length >= 3 && !STOPWORDS.has(token));

const jaccard = (a = [], b = []) => {
  const left = new Set(a);
  const right = new Set(b);
  if (!left.size || !right.size) return 0;
  const intersection = [...left].filter((token) => right.has(token)).length;
  const union = new Set([...left, ...right]).size;
  return Math.round((intersection / union) * 100);
};

export const inferEditorialFamily = ({ keyword = '', title = '', category = '', article = {} } = {}) => {
  const text = `${keyword} ${title} ${category} ${article.clusterKeyword || ''}`;
  return FAMILY_RULES.find((rule) => rule.pattern.test(text))?.family || 'educacao_financeira';
};

const summarizeRecentArticles = (items = []) => items.map((item) => {
  const structured = item.structuredContent && typeof item.structuredContent === 'object' ? item.structuredContent : {};
  const title = item.title || structured.title || '';
  const keyword = structured.clusterKeyword || structured.tags?.[0] || title;
  return {
    slug: item.slug,
    title,
    keyword,
    category: item.category?.name || structured.category || '',
    family: inferEditorialFamily({ keyword, title, category: item.category?.name || structured.category, article: structured }),
    publishedAt: item.publishedAt || item.createdAt
  };
});

export const EditorialTopicFatigueService = {
  calendarPolicy() {
    return {
      weeklyCaps: FAMILY_RULES.map((rule) => ({
        family: rule.family,
        maxPerWeek: rule.weeklyMax,
        minPerWeek: rule.weeklyMin || 0
      })),
      recommendedMix: [
        { family: 'credito_emprestimo', target: 'maximo 2 por semana' },
        { family: 'score', target: 'maximo 1 por semana' },
        { family: 'FGTS', target: 'maximo 1 por semana' },
        { family: 'trend_news', target: 'minimo 2 por semana' },
        { family: 'golpes_fraudes', target: 'minimo 1 por semana' },
        { family: 'educacao_financeira', target: 'minimo 2 por semana' }
      ]
    };
  },

  async analyze({
    keyword = '',
    title = '',
    category = '',
    article = {},
    lookbackDays = 14
  } = {}) {
    const family = inferEditorialFamily({ keyword, title, category, article });
    const since = new Date(Date.now() - lookbackDays * DAY_MS);
    const weekSince = new Date(Date.now() - 7 * DAY_MS);
    const candidateTokens = tokenize(`${keyword} ${title} ${article.summary || ''}`);

    try {
      const recentRows = await getPrisma().article.findMany({
        where: {
          status: 'published',
          publishedAt: { gte: since }
        },
        include: { category: true, cluster: true },
        orderBy: [{ publishedAt: 'desc' }],
        take: 40
      });

      const recent = summarizeRecentArticles(recentRows);
      const familyRecent = recent.filter((item) => item.family === family);
      const familyThisWeek = familyRecent.filter((item) => new Date(item.publishedAt) >= weekSince);
      const similarities = recent.map((item) => ({
        slug: item.slug,
        title: item.title,
        family: item.family,
        titleSimilarity: jaccard(tokenize(title), tokenize(item.title)),
        semanticSimilarity: jaccard(candidateTokens, tokenize(`${item.keyword} ${item.title}`)),
        publishedAt: item.publishedAt
      })).sort((a, b) => Math.max(b.titleSimilarity, b.semanticSimilarity) - Math.max(a.titleSimilarity, a.semanticSimilarity));

      const closest = similarities[0] || null;
      const policy = FAMILY_RULES.find((rule) => rule.family === family) || { weeklyMax: 2 };
      const clusterRepetitionScore = Math.min(100, familyThisWeek.length * 35 + familyRecent.length * 12);
      const semanticSimilarityScore = closest?.semanticSimilarity || 0;
      const titleSimilarityScore = closest?.titleSimilarity || 0;
      const topicFatigueScore = Math.min(100, Math.round(
        clusterRepetitionScore * 0.45
        + semanticSimilarityScore * 0.35
        + titleSimilarityScore * 0.2
      ));
      const blockers = [
        familyThisWeek.length >= policy.weeklyMax ? `Cluster ${family} saturado: ${familyThisWeek.length}/${policy.weeklyMax} na semana` : null,
        semanticSimilarityScore >= 62 ? `Similaridade semantica alta com ${closest?.slug}` : null,
        titleSimilarityScore >= 58 ? `Headline parecida com ${closest?.slug}` : null,
        topicFatigueScore >= 65 ? 'Topic fatigue score alto' : null
      ].filter(Boolean);

      return {
        ok: true,
        family,
        topic_fatigue_score: topicFatigueScore,
        semantic_similarity_score: semanticSimilarityScore,
        title_similarity_score: titleSimilarityScore,
        cluster_repetition_score: clusterRepetitionScore,
        blocked: blockers.length > 0,
        blockers,
        policy: {
          weeklyMax: policy.weeklyMax,
          weekCount: familyThisWeek.length,
          lookbackDays
        },
        closestMatches: similarities.slice(0, 5),
        calendar: this.calendarPolicy()
      };
    } catch (error) {
      return {
        ok: false,
        family,
        topic_fatigue_score: 0,
        semantic_similarity_score: 0,
        cluster_repetition_score: 0,
        blocked: false,
        blockers: [],
        error: error?.message || 'topic fatigue unavailable',
        calendar: this.calendarPolicy()
      };
    }
  }
};
