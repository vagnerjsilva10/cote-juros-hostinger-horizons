const clamp = (value, min = 0, max = 100) => Math.max(min, Math.min(max, Math.round(value)));

const daysSince = (dateValue, now = new Date()) => {
  if (!dateValue) return 999;
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return 999;
  return Math.max(0, Math.floor((now.getTime() - date.getTime()) / 86400000));
};

export class ContentDecayService {
  static analyzeArticle({
    article = {},
    performance = {},
    serp = {},
    now = new Date(),
  } = {}) {
    const ageDays = daysSince(article.updatedAt || article.publishedAt, now);
    const rankingDrop = Math.max(0, (performance.previousAveragePosition || performance.averagePosition || 0) - (performance.averagePosition || 0));
    const ctrDrop = Math.max(0, (performance.previousCtr || performance.ctr || 0) - (performance.ctr || 0));
    const scrollDrop = Math.max(0, (performance.previousScrollDepth || performance.scrollDepth || 0) - (performance.scrollDepth || 0));
    const serpDrift = serp.intentChanged ? 30 : 0;
    const regulatoryRisk = serp.regulatoryChange ? 26 : 0;
    const staleStats = ageDays > 180 ? 18 : ageDays > 90 ? 10 : 0;
    const oldFaqs = ageDays > 120 && (article.faq || []).length < 4 ? 12 : 0;
    const brokenLinks = (article.brokenLinks || 0) * 8;

    const decayScore = clamp(
      ageDays / 6 +
        rankingDrop * 3 +
        ctrDrop * 2 +
        scrollDrop * 1.5 +
        serpDrift +
        regulatoryRisk +
        staleStats +
        oldFaqs +
        brokenLinks
    );

    return {
      articleId: article.id || null,
      slug: article.slug,
      title: article.title,
      ageDays,
      decayScore,
      signals: {
        rankingDrop,
        ctrDrop,
        scrollDrop,
        serpDrift: Boolean(serp.intentChanged),
        regulatoryChange: Boolean(serp.regulatoryChange),
        staleStats: staleStats > 0,
        outdatedFaqs: oldFaqs > 0,
        brokenLinks: article.brokenLinks || 0,
      },
      classification: this.classifyDecay(decayScore, { serp, article }),
      recommendedActions: this.recommendActions(decayScore, { serp, article }),
    };
  }

  static classifyDecay(score, { serp = {}, article = {} } = {}) {
    if (article.shouldArchive) return 'archival_candidate';
    if (serp.canonicalConflict) return 'merge';
    if (score >= 82) return 'rewrite_profundo';
    if (score >= 64) return 'rewrite_parcial';
    if (score >= 46) return 'refresh_medio';
    if (score >= 28) return 'refresh_leve';
    return 'monitorar';
  }

  static recommendActions(score, { serp = {}, article = {} } = {}) {
    const actions = [];
    if (score >= 28) actions.push('atualizar exemplos, FAQ e fontes oficiais');
    if (score >= 46) actions.push('reprocessar SERP e ajustar intencao de busca');
    if (score >= 64) actions.push('reescrever secoes centrais e revisar titulo/meta');
    if (score >= 82) actions.push('reestruturar artigo com novo outline e nova analise editorial');
    if (serp.canonicalConflict) actions.push('avaliar merge/redirect para evitar canibalizacao');
    if (article.brokenLinks) actions.push('corrigir links quebrados antes de republicar');
    if (!actions.length) actions.push('manter monitoramento sem refresh imediato');
    return actions;
  }

  static analyzePortfolio({ articles = [], performanceBySlug = {}, serpBySlug = {}, now = new Date() } = {}) {
    const items = articles.map((article) =>
      this.analyzeArticle({
        article,
        performance: performanceBySlug[article.slug] || {},
        serp: serpBySlug[article.slug] || {},
        now,
      })
    );

    return {
      generatedAt: now.toISOString(),
      count: items.length,
      byClassification: items.reduce((acc, item) => {
        acc[item.classification] = (acc[item.classification] || 0) + 1;
        return acc;
      }, {}),
      topOpportunities: items.sort((a, b) => b.decayScore - a.decayScore).slice(0, 12),
    };
  }
}

export default ContentDecayService;
