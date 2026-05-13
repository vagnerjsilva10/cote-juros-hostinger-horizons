import { buildEditorialFingerprint } from './editorialMemoryService.js';

const clamp = (value, min = 0, max = 100) => Math.max(min, Math.min(max, Math.round(value)));

const compact = (value = '') => String(value || '').replace(/\s+/g, ' ').trim();

const normalize = (value = '') =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

const repeatedStarts = (paragraphs = []) => {
  const starts = paragraphs
    .map((item) => normalize(item).split(/\s+/).slice(0, 4).join(' '))
    .filter(Boolean);
  return starts.length - new Set(starts).size;
};

const rhythmScore = (paragraphs = []) => {
  const lengths = paragraphs.map((item) => compact(item).split(/\s+/).filter(Boolean).length).filter(Boolean);
  if (lengths.length < 4) return 0;
  const average = lengths.reduce((sum, item) => sum + item, 0) / lengths.length;
  const variance = lengths.reduce((sum, item) => sum + Math.abs(item - average), 0) / lengths.length;
  return variance < 8 ? 22 : variance < 14 ? 12 : 4;
};

const collectParagraphs = (article = {}) => [
  ...(article.intro || []),
  article.featuredSnippet,
  ...((article.sections || []).flatMap((section) => section.paragraphs || [])),
  ...((article.faq || []).map((item) => item.answer)),
  ...(article.conclusion || [])
].filter(Boolean);

const collectHeadings = (article = {}) =>
  (Array.isArray(article.sections) ? article.sections : [])
    .map((section) => compact(section.heading || section.title || ''))
    .filter(Boolean);

const genericTransitionHits = (article = {}) => {
  const text = normalize([
    ...(article.intro || []),
    ...collectParagraphs(article),
    ...collectHeadings(article)
  ].join(' '));
  const patterns = [
    /vale lembrar/g,
    /nesse contexto/g,
    /ter clareza/g,
    /tomar melhores decisoes/g,
    /organizar sua jornada/g,
    /solucao ideal/g,
    /menos friccao/g,
    /contextualizar/g
  ];
  return patterns.reduce((sum, pattern) => sum + ((text.match(pattern) || []).length), 0);
};

export class EditorialFingerprintService {
  static analyzeEditorialFingerprint({ article = {}, keyword = '', intent = '', serpIntent = '', memory = null } = {}) {
    const fingerprint = buildEditorialFingerprint({ article, keyword, intent, serpIntent });
    const paragraphs = collectParagraphs(article);
    const headings = collectHeadings(article);
    const faq = Array.isArray(article.faq) ? article.faq.map((item) => compact(item.question)) : [];
    const closest = memory?.closestMatches || [];

    const openingRisk = Math.min(35, repeatedStarts(paragraphs) * 12);
    const headingRisk = headings.length - new Set(headings.map(normalize)).size > 0 ? 20 : 0;
    const faqRisk = faq.length - new Set(faq.map(normalize)).size > 0 ? 16 : 0;
    const transitionRisk = Math.min(28, genericTransitionHits(article) * 7);
    const rhythmRisk = rhythmScore(paragraphs);
    const memoryRisk = closest[0]?.score ? Math.round(closest[0].score * 0.55) : 0;
    const ctaRisk = closest[0]?.ctaScore ? Math.round(closest[0].ctaScore * 0.35) : 0;
    const narrativeRisk = closest[0]?.narrativeScore ? Math.round(closest[0].narrativeScore * 0.45) : 0;
    const structureRisk = closest[0]?.structureScore ? Math.round(closest[0].structureScore * 0.45) : 0;

    const fingerprintRiskScore = clamp(Math.max(
      openingRisk + Math.round(rhythmRisk * 0.5) + transitionRisk,
      headingRisk + faqRisk + rhythmRisk,
      memoryRisk,
      ctaRisk + narrativeRisk,
      structureRisk
    ));

    const warnings = [
      openingRisk >= 24 ? 'aberturas repetidas' : null,
      transitionRisk >= 21 ? 'transicoes genericas repetidas' : null,
      ctaRisk >= 25 ? 'padrao de CTA repetitivo' : null,
      narrativeRisk >= 30 ? 'framing narrativo parecido com artigo recente' : null,
      structureRisk >= 30 ? 'estrutura de headings/FAQ parecida demais' : null
    ].filter(Boolean);
    const blockers = fingerprintRiskScore > 35 ? ['fingerprint risk acima do limite'] : [];

    return {
      ok: true,
      fingerprint,
      fingerprintRiskScore,
      blocked: blockers.length > 0,
      blockers,
      warnings,
      scores: {
        openingRisk,
        headingRisk,
        faqRisk,
        transitionRisk,
        rhythmRisk,
        memoryRisk,
        ctaRisk,
        narrativeRisk,
        structureRisk
      },
      closestMatch: closest[0] || null
    };
  }
}
