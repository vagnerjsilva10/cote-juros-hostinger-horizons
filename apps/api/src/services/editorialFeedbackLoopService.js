const clamp = (value, min = 0, max = 100) => Math.max(min, Math.min(max, Math.round(value)));

const countWords = (value = '') => String(value || '').split(/\s+/).filter(Boolean).length;

const countTables = (article = {}) =>
  (article.sections || []).filter((section) => section.table?.rows?.length >= 2).length;

const text = (article = {}) => [
  article.title,
  article.summary,
  article.content,
  ...(article.intro || []),
  ...((article.sections || []).flatMap((section) => [
    section.heading,
    section.subheading,
    ...(section.paragraphs || []),
    ...(section.bullets || [])
  ])),
  ...((article.faq || []).flatMap((item) => [item.question, item.answer]))
].filter(Boolean).join(' ');

export class EditorialFeedbackLoopService {
  static ingestPerformanceSignals({
    article = {},
    searchConsole = {},
    analytics = {},
    conversions = {},
    rankings = {},
    backlinks = {},
  } = {}) {
    const ctr = Number(searchConsole.ctr || 0);
    const impressions = Number(searchConsole.impressions || 0);
    const clicks = Number(searchConsole.clicks || 0);
    const averagePosition = Number(searchConsole.averagePosition || rankings.averagePosition || 0);
    const scrollDepth = Number(analytics.scrollDepth || 0);
    const timeOnPage = Number(analytics.timeOnPage || 0);
    const bounceRate = Number(analytics.bounceRate || 0);
    const conversionRate = Number(conversions.conversionRate || 0);
    const backlinkCount = Number(backlinks.count || 0);

    return {
      slug: article.slug,
      title: article.title,
      capturedAt: new Date().toISOString(),
      metrics: {
        ctr,
        impressions,
        clicks,
        averagePosition,
        scrollDepth,
        timeOnPage,
        bounceRate,
        conversionRate,
        backlinkCount,
        engagementScore: clamp(scrollDepth * 0.35 + timeOnPage * 0.25 + conversionRate * 0.2 + Math.min(backlinkCount, 20)),
        serpDecayRisk: clamp((averagePosition > 12 ? 35 : 0) + (ctr < 1.2 && impressions > 300 ? 25 : 0) + (bounceRate > 70 ? 15 : 0)),
      },
      sourcePolicy: {
        allowedSources: ['Google Search Console', 'GA4', 'ranking tracker', 'CTA events', 'backlink monitor'],
        writeMode: 'append-only aggregate signals',
        autopublishImpact: 'never bypass governance',
      },
    };
  }

  static learnFromSignals({ signals = [] } = {}) {
    const byFormat = {};
    const byCluster = {};
    const byCta = {};
    const intros = [];
    const headlines = [];

    for (const signal of signals) {
      const meta = signal.metadata || {};
      const metrics = signal.metrics || {};
      const format = meta.contentType || 'unknown';
      const cluster = meta.cluster || 'unknown';
      const cta = meta.ctaPattern || 'unknown';
      byFormat[format] = this.aggregateLearning(byFormat[format], metrics);
      byCluster[cluster] = this.aggregateLearning(byCluster[cluster], metrics);
      byCta[cta] = this.aggregateLearning(byCta[cta], metrics);
      if (meta.introPattern) intros.push({ pattern: meta.introPattern, metrics });
      if (meta.headlinePattern) headlines.push({ pattern: meta.headlinePattern, metrics });
    }

    return {
      learnedAt: new Date().toISOString(),
      byFormat,
      byCluster,
      byCta,
      winningIntroPatterns: this.rankPatterns(intros),
      winningHeadlinePatterns: this.rankPatterns(headlines),
      refreshCandidates: signals
        .filter((signal) => (signal.metrics?.serpDecayRisk || 0) >= 55)
        .map((signal) => ({ slug: signal.slug, risk: signal.metrics.serpDecayRisk, reason: 'queda de SERP/engajamento' })),
      policy: 'aprendizado ajusta prioridade, estrutura e refresh; nao publica sozinho',
    };
  }

  static aggregateLearning(current = {}, metrics = {}) {
    const count = (current.count || 0) + 1;
    const next = {
      count,
      averageCtr: ((current.averageCtr || 0) * (count - 1) + (metrics.ctr || 0)) / count,
      averageScrollDepth: ((current.averageScrollDepth || 0) * (count - 1) + (metrics.scrollDepth || 0)) / count,
      averageTimeOnPage: ((current.averageTimeOnPage || 0) * (count - 1) + (metrics.timeOnPage || 0)) / count,
      averageConversionRate: ((current.averageConversionRate || 0) * (count - 1) + (metrics.conversionRate || 0)) / count,
      averageRanking: ((current.averageRanking || 0) * (count - 1) + (metrics.averagePosition || 0)) / count,
    };
    next.health = clamp(next.averageCtr * 12 + next.averageScrollDepth * 0.45 + next.averageTimeOnPage * 0.25 + next.averageConversionRate * 8 - next.averageRanking * 1.2);
    return next;
  }

  static rankPatterns(items = []) {
    return items
      .map((item) => ({
        pattern: item.pattern,
        score: clamp((item.metrics.ctr || 0) * 12 + (item.metrics.scrollDepth || 0) * 0.5 + (item.metrics.timeOnPage || 0) * 0.2),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 8);
  }

  static projectPerformanceSignals({ article = {}, validation = {}, governance = {} } = {}) {
    const body = text(article);
    const words = article.wordCount || countWords(body);
    const tables = countTables(article);
    const faqCount = Array.isArray(article.faq) ? article.faq.length : 0;
    const quality = validation.qualityScore || {};
    const fingerprintRisk = governance.fingerprint?.fingerprintRiskScore || quality.fingerprint_risk_score || 0;
    const canibalizationRisk = governance.memory?.canibalizationRisk || quality.canibalization_risk_score || 0;

    const ctr = clamp(50 + (quality.serp_competitiveness_score || 0) * 0.25 + (quality.editorial_personality_score || 0) * 0.15 - fingerprintRisk * 0.25);
    const scrollDepth = clamp(45 + Math.min(words, 3500) / 80 + tables * 4 + faqCount * 2 - fingerprintRisk * 0.2);
    const timeOnPage = clamp(40 + Math.min(words, 4200) / 70 + (quality.narrative_strength_score || 0) * 0.25);
    const rankingPotential = clamp((quality.total || 0) * 0.55 + (quality.topical_authority_score || 0) * 0.25 - canibalizationRisk * 0.25 + (quality.originality_score || 0) * 0.2);
    const conversion = clamp(38 + (quality.practical_value_score || 0) * 0.3 + (quality.intent_match_score || 0) * 0.2 - fingerprintRisk * 0.2);
    const bounce = clamp(70 - scrollDepth * 0.35 - (quality.human_readability_score || 0) * 0.15 + fingerprintRisk * 0.3);

    return {
      ok: true,
      simulated: true,
      metrics: {
        ctrProjection: ctr,
        scrollDepthProjection: scrollDepth,
        timeOnPageProjection: timeOnPage,
        rankingPotential,
        conversionProjection: conversion,
        bounceRisk: bounce,
        topicalDecayRisk: canibalizationRisk > 55 ? 72 : fingerprintRisk > 35 ? 58 : 34
      },
      learningHooks: [
        'comparar aberturas por CTR e scroll depth',
        'marcar CTAs que convertem sem repetir padrao',
        'reduzir clusters quando ranking/engajamento cair por saturacao',
        'promover formatos com melhor tempo na pagina',
        'detectar canibalizacao por query e URL antes de publicar outro artigo'
      ],
      integrationPlan: {
        sourceSignals: ['Search Console', 'GA4', 'logs internos', 'conversoes de CTA', 'ranking tracker'],
        writePolicy: 'somente registrar metricas agregadas; nunca autopublicar por performance sem governanca',
        nextStep: 'criar tabela editorial_performance_signal quando houver decisao de persistencia'
      }
    };
  }
}
