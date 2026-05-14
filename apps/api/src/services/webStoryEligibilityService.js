const normalize = (value = '') =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

const clamp = (value, min = 0, max = 100) => Math.max(min, Math.min(max, Math.round(value)));

const VISUAL_CLUSTERS = [
  'golpes_pix',
  'pix_seguranca',
  'golpes_fraudes',
  'golpes_bancarios',
  'boletos_falsos',
  'inss',
  'fgts',
  'consumidor_financeiro',
  'juros_selic',
  'superendividamento',
];

const VISUAL_TYPES = [
  'news_analysis',
  'consumer_alert',
  'evergreen_premium',
  'topical_support',
];

const LOW_STORY_TYPES = [
  'content_refresh',
];

const MIN_ELIGIBILITY_SCORE = 80;
const MAX_DUPLICATE_RISK = 45;
const MAX_FINGERPRINT_RISK = 30;

const HIGH_INTENT_PATTERNS = [
  /golpe|fraude|falso|pix|boleto|ligacao|atendente|banco/,
  /inss|fgts|beneficio|aposentado|consignado/,
  /checklist|passo a passo|como se proteger|o que fazer|o que muda/,
  /selic|nova regra|mudanca|alerta|cuidado/,
  /comparar|vale a pena|decisao|risco/,
];

export class WebStoryEligibilityService {
  static evaluate({ article = {}, candidate = {}, existingStories = [] } = {}) {
    const merged = {
      ...candidate,
      ...article,
      scores: {
        ...(candidate.scores || {}),
        ...(article.scores || {}),
      },
    };
    const text = normalize([
      merged.keyword,
      merged.title,
      merged.h1,
      merged.slug,
      merged.cluster,
      merged.family,
      merged.category,
      merged.type,
      Array.isArray(merged.tags) ? merged.tags.join(' ') : '',
    ].filter(Boolean).join(' '));
    const scores = merged.scores || {};
    const type = merged.type || merged.contentType || '';
    const cluster = merged.cluster || merged.family || '';
    const storySignals = HIGH_INTENT_PATTERNS.reduce((sum, pattern) => sum + (pattern.test(text) ? 1 : 0), 0);
    const hasVisualCluster = VISUAL_CLUSTERS.includes(cluster) || VISUAL_CLUSTERS.some((item) => text.includes(item.replace(/_/g, ' ')));
    const hasVisualType = VISUAL_TYPES.includes(type);
    const hasLowStoryType = LOW_STORY_TYPES.includes(type) && !/alerta|nova regra|mudanca|golpe/.test(text);
    const hasImage = Boolean(merged.coverImage || merged.ogImage || merged.image || merged.featuredImageUrl);
    const qualityScore = clamp(
      Math.max(scores.eeat || 0, scores.humanization || 0, scores.seo || 0, scores.originality || 0)
    );
    const riskPenalty =
      (scores.fingerprintRisk || 0) * 0.35 +
      Math.max(0, (scores.canibalization || scores.cannibalizationRisk || 0) - 45) * 0.35 +
      (scores.topicFatigue || 0) * 0.25;
    const duplicateRisk = this.detectDuplicateRisk(merged, existingStories);

    const webStoryEligibilityScore = clamp(
      28 +
        storySignals * 12 +
        (hasVisualCluster ? 18 : 0) +
        (hasVisualType ? 10 : 0) +
        (hasImage ? 8 : 0) +
        Math.min(14, qualityScore / 7) -
        (hasLowStoryType ? 26 : 0) -
        riskPenalty -
        duplicateRisk * 0.3
    );

    const blockers = [
      webStoryEligibilityScore < MIN_ELIGIBILITY_SCORE ? `webStoryEligibilityScore abaixo de ${MIN_ELIGIBILITY_SCORE}` : null,
      !hasImage ? 'imagem editorial ausente' : null,
      hasLowStoryType ? 'refresh pequeno ou conteudo excessivamente textual' : null,
      duplicateRisk > MAX_DUPLICATE_RISK ? 'story semelhante ja existente' : null,
      (scores.eeat || 88) < 82 ? 'EEAT baixo para Web Story' : null,
      (scores.humanization || 88) < 82 ? 'humanizacao baixa para Web Story' : null,
      (scores.fingerprintRisk || 0) > MAX_FINGERPRINT_RISK ? 'fingerprint editorial alto' : null,
      (scores.canibalization || scores.cannibalizationRisk || 0) > 70 && !merged.refreshPlanned ? 'canibalizacao alta' : null,
    ].filter(Boolean);

    return {
      eligible: blockers.length === 0,
      decision: blockers.length ? 'story_blocked' : 'story_eligible',
      webStoryEligibilityScore,
      blockers,
      signals: {
        storySignals,
        hasVisualCluster,
        hasVisualType,
        hasImage,
        hasLowStoryType,
        duplicateRisk,
      },
      policy: {
        generateForEveryArticle: false,
        publishMode: process.env.WEB_STORY_PUBLISH_ENABLED === 'true' ? 'selective_production' : 'dry_run_shadow_only',
        thresholds: {
          minEligibilityScore: MIN_ELIGIBILITY_SCORE,
          maxDuplicateRisk: MAX_DUPLICATE_RISK,
          maxFingerprintRisk: MAX_FINGERPRINT_RISK,
        },
        rule: 'gerar story apenas quando o formato melhora experiencia mobile e Discover sem thin content',
      },
    };
  }

  static detectDuplicateRisk(item = {}, existingStories = []) {
    const key = normalize(item.slug || item.keyword || item.title);
    if (!key || !Array.isArray(existingStories) || !existingStories.length) return 0;
    const tokens = new Set(key.split(/\s+/).filter((token) => token.length > 3));
    let highest = 0;
    for (const story of existingStories) {
      const other = normalize(story.slug || story.keyword || story.title);
      const otherTokens = other.split(/\s+/).filter((token) => token.length > 3);
      const overlap = otherTokens.filter((token) => tokens.has(token)).length;
      highest = Math.max(highest, clamp((overlap / Math.max(1, Math.min(tokens.size, otherTokens.length))) * 100));
    }
    return highest;
  }
}

export default WebStoryEligibilityService;
