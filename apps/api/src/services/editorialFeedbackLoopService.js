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
