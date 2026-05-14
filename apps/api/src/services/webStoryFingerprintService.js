const normalize = (value = '') =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const clamp = (value, min = 0, max = 100) => Math.max(min, Math.min(max, Math.round(value)));

const firstWords = (value = '', count = 4) => normalize(value).split(/\s+/).slice(0, count).join(' ');
const MAX_STORY_FINGERPRINT_RISK = 30;

const countDuplicates = (items = []) => {
  const counts = new Map();
  for (const item of items.filter(Boolean)) counts.set(item, (counts.get(item) || 0) + 1);
  return Array.from(counts.values()).filter((count) => count > 1).reduce((sum, count) => sum + count - 1, 0);
};

export class WebStoryFingerprintService {
  static evaluate({ story = {}, history = [] } = {}) {
    const slides = story.slides || [];
    const headlines = slides.map((slide) => slide.headline || slide.title || '');
    const sublines = slides.map((slide) => slide.subline || slide.body || '');
    const layouts = slides.map((slide) => slide.layout || slide.kind || 'content');
    const ctas = [story.cta?.label, story.cta?.url, ...slides.map((slide) => slide.ctaLabel)].filter(Boolean);
    const headlineOpenings = headlines.map((headline) => firstWords(headline, 3));
    const narrativeOpenings = sublines.map((subline) => firstWords(subline, 4));
    const textWordCounts = slides.map((slide) => normalize(`${slide.headline || ''} ${slide.subline || ''}`).split(/\s+/).filter(Boolean).length);
    const longSlides = textWordCounts.filter((count) => count > 24).length;
    const sameImageCount = Math.max(0, slides.length - new Set(slides.map((slide) => slide.imageRole || slide.imageUrl || '')).size);

    const visualRepetitionRisk = clamp(
      countDuplicates(layouts) * 5 +
        sameImageCount * 4 +
        (story.visualSystem?.templateKey === 'default' ? 10 : 0)
    );
    const narrativeRepetitionRisk = clamp(
      countDuplicates(headlineOpenings) * 9 +
        countDuplicates(narrativeOpenings) * 7 +
        longSlides * 6
    );
    const templateRepetitionRisk = clamp(
      countDuplicates(ctas) * 14 +
        this.compareWithHistory(story, history) * 0.55 +
        (slides.length === 6 ? 8 : 0)
    );
    const webStoryFingerprintRisk = clamp(
      visualRepetitionRisk * 0.35 +
        narrativeRepetitionRisk * 0.35 +
        templateRepetitionRisk * 0.3
    );

    const blockers = [
      webStoryFingerprintRisk > MAX_STORY_FINGERPRINT_RISK ? `webStoryFingerprintRisk acima de ${MAX_STORY_FINGERPRINT_RISK}` : null,
      visualRepetitionRisk > 38 ? 'risco visual repetitivo' : null,
      narrativeRepetitionRisk > 38 ? 'narrativa repetitiva' : null,
      templateRepetitionRisk > 42 ? 'template/CTA repetitivo' : null,
      longSlides > 2 ? 'excesso de texto em slides' : null,
    ].filter(Boolean);

    return {
      passed: blockers.length === 0,
      blockers,
      webStoryFingerprintRisk,
      visualRepetitionRisk,
      narrativeRepetitionRisk,
      templateRepetitionRisk,
      signals: {
        slideCount: slides.length,
        longSlides,
        sameImageCount,
        repeatedHeadlineOpenings: countDuplicates(headlineOpenings),
        repeatedNarrativeOpenings: countDuplicates(narrativeOpenings),
      },
    };
  }

  static compareWithHistory(story = {}, history = []) {
    if (!Array.isArray(history) || !history.length) return 0;
    const signature = this.signature(story);
    let highest = 0;
    for (const item of history) {
      const other = this.signature(item);
      const overlap = signature.filter((part) => other.includes(part)).length;
      highest = Math.max(highest, clamp((overlap / Math.max(1, signature.length)) * 100));
    }
    return highest;
  }

  static signature(story = {}) {
    const slides = story.slides || [];
    return [
      story.type || story.contentType || '',
      story.cluster || '',
      story.visualSystem?.templateKey || '',
      story.cta?.label || '',
      ...slides.slice(0, 4).map((slide) => `${slide.kind || ''}:${firstWords(slide.headline || '', 2)}`),
    ].map(normalize).filter(Boolean);
  }
}

export default WebStoryFingerprintService;
