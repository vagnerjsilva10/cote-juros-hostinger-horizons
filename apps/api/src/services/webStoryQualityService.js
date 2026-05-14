const normalize = (value = '') =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const clamp = (value, min = 0, max = 100) => Math.max(min, Math.min(max, Math.round(value)));

const THRESHOLDS = {
  visualEditorialQuality: 88,
  storyNarrativeStrength: 88,
  mobileReadability: 90,
  slideSpecificity: 85,
  CTAQuality: 85,
  EEATStoryScore: 88,
  antiTemplateVisualScore: 88,
  discoverPotential: 85,
};

const countDuplicates = (items = []) => {
  const counts = new Map();
  for (const item of items.filter(Boolean)) counts.set(item, (counts.get(item) || 0) + 1);
  return Array.from(counts.values()).filter((count) => count > 1).reduce((sum, count) => sum + count - 1, 0);
};

const roleCoverage = (slides = []) => {
  const roles = new Set(slides.map((slide) => slide.role).filter(Boolean));
  const required = ['problema', 'risco', 'exemplo', 'autoridade', 'checklist', 'cta'];
  return required.filter((role) => roles.has(role)).length / required.length;
};

const wordCount = (value = '') => normalize(value).split(/\s+/).filter(Boolean).length;

export class WebStoryQualityService {
  static evaluate({ story = {}, article = {}, seoValidation = {}, fingerprint = {} } = {}) {
    const slides = story.slides || [];
    const layouts = slides.map((slide) => slide.layout || '');
    const roles = slides.map((slide) => slide.role || '');
    const cues = slides.map((slide) => slide.visualCue || slide.imageRole || '');
    const headlines = slides.map((slide) => normalize(slide.headline || ''));
    const sublines = slides.map((slide) => normalize(slide.subline || ''));
    const genericHits = [...headlines, ...sublines].filter((text) =>
      /entenda|saiba mais|guia completo|tomar melhores decisoes|solucao ideal|vale lembrar|contextualizar/.test(text)
    ).length;
    const longSlides = slides.filter((slide) => wordCount(`${slide.headline || ''} ${slide.subline || ''}`) > 18).length;
    const shortSlides = slides.filter((slide) => wordCount(`${slide.headline || ''} ${slide.subline || ''}`) <= 15).length;
    const specificHits = [...headlines, ...sublines].filter((text) =>
      /pix|senha|codigo|cnpj|cet|contrato|banco central|gov|bo|protocolo|comprovante|taxa|renda|parcela|beneficio/.test(text)
    ).length;
    const authorityHits = [...headlines, ...sublines].filter((text) =>
      /banco|cnpj|contrato|cet|oficial|protocolo|comprovante|bo|analise|renda/.test(text)
    ).length;
    const duplicateLayouts = countDuplicates(layouts);
    const duplicateRoles = countDuplicates(roles);
    const duplicateCues = countDuplicates(cues);
    const arcScore = roleCoverage(slides) * 100;

    const visualEditorialQuality = clamp(
      92 -
        duplicateLayouts * 2 -
        duplicateCues * 3 -
        Math.max(0, 6 - slides.length) * 4 -
        (story.visualSystem?.palette?.accent ? 0 : 8)
    );
    const storyNarrativeStrength = clamp(arcScore - genericHits * 4 - Math.max(0, duplicateRoles - 2) * 3);
    const mobileReadability = clamp(98 - longSlides * 5 + Math.min(4, shortSlides));
    const slideSpecificity = clamp(78 + specificHits * 3 - genericHits * 5);
    const CTAQuality = clamp((story.cta?.label && story.cta?.url ? 92 : 72) - (normalize(story.cta?.label || '').includes('clique') ? 10 : 0));
    const EEATStoryScore = clamp(82 + authorityHits * 3 + (seoValidation.passed ? 4 : 0));
    const antiTemplateVisualScore = clamp(100 - (fingerprint.webStoryFingerprintRisk || 0) - duplicateLayouts * 2 - genericHits * 3);
    const discoverPotential = clamp(
      visualEditorialQuality * 0.18 +
        storyNarrativeStrength * 0.18 +
        mobileReadability * 0.16 +
        slideSpecificity * 0.14 +
        CTAQuality * 0.1 +
        EEATStoryScore * 0.12 +
        antiTemplateVisualScore * 0.12
    );

    const scores = {
      visualEditorialQuality,
      storyNarrativeStrength,
      mobileReadability,
      slideSpecificity,
      CTAQuality,
      EEATStoryScore,
      antiTemplateVisualScore,
      discoverPotential,
    };
    const blockers = Object.entries(THRESHOLDS)
      .filter(([key, threshold]) => scores[key] < threshold)
      .map(([key, threshold]) => `${key} abaixo de ${threshold}`);

    return {
      passed: blockers.length === 0,
      blockers,
      scores,
      thresholds: THRESHOLDS,
      signals: {
        slideCount: slides.length,
        arc: roles,
        arcCoverage: clamp(arcScore),
        longSlides,
        genericHits,
        specificHits,
        authorityHits,
        duplicateLayouts,
        duplicateCues,
      },
    };
  }
}

export default WebStoryQualityService;
