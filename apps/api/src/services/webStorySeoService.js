import { PUBLIC_SITE_URL } from './editorialConfig.js';
import { isTemplateOrPlaceholderImage } from './blogImage/validator.js';

const FORBIDDEN_URL_PATTERNS = [
  /https?:\/\/api\.cotejuros\.com\.br/gi,
  /https?:\/\/localhost(?::\d+)?/gi,
  /https?:\/\/127\.0\.0\.1(?::\d+)?/gi,
  /https?:\/\/0\.0\.0\.0(?::\d+)?/gi
];

const escapeRegExp = (value = '') => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const buildPublicStoryUrl = (storyPublicPath = '') => {
  const path = String(storyPublicPath || '').startsWith('/')
    ? storyPublicPath
    : `/${storyPublicPath || ''}`;
  return `${PUBLIC_SITE_URL}${path.replace(/\/?$/, '/')}`;
};

export const normalizePublicStoryUrl = (value = '', fallbackPath = '') => {
  if (fallbackPath) return buildPublicStoryUrl(fallbackPath);
  try {
    const url = new URL(value);
    if (!url.pathname.startsWith('/stories/')) return value;
    return `${PUBLIC_SITE_URL}${url.pathname.replace(/\/?$/, '/')}`;
  } catch {
    return value && String(value).startsWith('/stories/')
      ? buildPublicStoryUrl(value)
      : value;
  }
};

export const normalizeStorySeoHtml = (html = '') => {
  let normalized = String(html || '');
  for (const pattern of FORBIDDEN_URL_PATTERNS) {
    normalized = normalized.replace(pattern, PUBLIC_SITE_URL);
  }
  const configured = process.env.DISTRIBUTION_PUBLIC_BASE_URL || process.env.SITE_BASE_URL || '';
  if (configured && configured !== PUBLIC_SITE_URL) {
    normalized = normalized.replace(new RegExp(escapeRegExp(configured.replace(/\/$/, '')), 'g'), PUBLIC_SITE_URL);
  }
  return normalized;
};

const findForbiddenUrls = (value = '') =>
  FORBIDDEN_URL_PATTERNS.flatMap((pattern) => {
    pattern.lastIndex = 0;
    return String(value || '').match(pattern) || [];
  });

const extractCanonical = (html = '') =>
  String(html || '').match(/<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i)?.[1]
  || String(html || '').match(/<link\s+href=["']([^"']+)["']\s+rel=["']canonical["']/i)?.[1]
  || '';

const extractJsonLd = (html = '') => {
  const raw = String(html || '').match(/<script\s+type=["']application\/ld\+json["']>([\s\S]*?)<\/script>/i)?.[1];
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const isValidAbsoluteImage = (value = '') => {
  if (!/^https?:\/\//i.test(value)) return false;
  if (isTemplateOrPlaceholderImage(value)) return false;
  return true;
};

export const validateWebStorySeo = ({
  article = {},
  storyHtml = '',
  bookendJson = '',
  distribution = {},
  slideAssets = [],
  posterImageUrl = '',
  storyPublicPath = '',
  articleUrl = ''
} = {}) => {
  const expectedStoryUrl = buildPublicStoryUrl(storyPublicPath || distribution?.webStory?.path || `/stories/${article.slug}`);
  const normalizedHtml = normalizeStorySeoHtml(storyHtml);
  const normalizedBookend = normalizeStorySeoHtml(bookendJson);
  const canonical = extractCanonical(normalizedHtml);
  const jsonLd = extractJsonLd(normalizedHtml);
  const combined = [
    storyHtml,
    bookendJson,
    JSON.stringify(distribution || {}),
    JSON.stringify(slideAssets || [])
  ].join('\n');
  const forbiddenUrls = findForbiddenUrls(combined);
  const storyUrl = normalizePublicStoryUrl(distribution?.webStory?.url || expectedStoryUrl, storyPublicPath);
  const issues = [
    canonical !== expectedStoryUrl ? `canonical incorreto: ${canonical || 'ausente'}` : null,
    storyUrl !== expectedStoryUrl ? `story URL incorreta: ${storyUrl || 'ausente'}` : null,
    !normalizedHtml.includes('<amp-story ') ? 'AMP story ausente' : null,
    !article.title || String(article.title).trim().length < 8 ? 'title inválido' : null,
    !(article.metaDescription || article.summary || article.excerpt) ? 'descrição ausente' : null,
    !isValidAbsoluteImage(posterImageUrl) ? 'poster inválido' : null,
    !jsonLd ? 'JSON-LD ausente ou inválido' : null,
    jsonLd && jsonLd.mainEntityOfPage !== expectedStoryUrl ? 'JSON-LD mainEntityOfPage incorreto' : null,
    jsonLd && jsonLd.image !== posterImageUrl ? 'JSON-LD image incorreta' : null,
    articleUrl && !String(articleUrl).startsWith(PUBLIC_SITE_URL) ? `articleUrl fora do domínio público: ${articleUrl}` : null,
    forbiddenUrls.length ? `mixed-domain detectado: ${Array.from(new Set(forbiddenUrls)).join(', ')}` : null,
    !Array.isArray(slideAssets) || slideAssets.length < 5 ? 'slides insuficientes' : null,
    Array.isArray(slideAssets) && slideAssets.some((asset) => !String(asset.content || '').includes('<image href="http')) ? 'slide com imagem quebrada' : null
  ].filter(Boolean);

  return {
    passed: issues.length === 0,
    issues,
    expectedStoryUrl,
    canonical,
    storyUrl,
    canonicalDomain: canonical ? new URL(canonical).hostname : null,
    forbiddenUrls: Array.from(new Set(forbiddenUrls)),
    checks: {
      hasAmpStory: normalizedHtml.includes('<amp-story '),
      hasJsonLd: Boolean(jsonLd),
      posterValid: isValidAbsoluteImage(posterImageUrl),
      slideCount: Array.isArray(slideAssets) ? slideAssets.length : 0,
      publicSiteUrl: PUBLIC_SITE_URL
    }
  };
};

export const buildStoryGenerationState = ({
  status,
  reason = '',
  url = '',
  canonical = '',
  error = '',
  validation = null
} = {}) => ({
  status,
  reason,
  url: url ? normalizePublicStoryUrl(url) : '',
  canonical: canonical ? normalizePublicStoryUrl(canonical) : '',
  error,
  validation,
  updatedAt: new Date().toISOString()
});

export const normalizeStoredStoryDistribution = (structured = {}) => {
  const distribution = structured.distribution || {};
  const webStory = distribution.webStory || {};
  if (!webStory.url && !webStory.path) return structured;
  let path = webStory.path || '';
  if (!path) {
    try {
      path = new URL(webStory.url).pathname;
    } catch {
      path = '';
    }
  }
  const normalizedUrl = normalizePublicStoryUrl(webStory.url, path);
  return {
    ...structured,
    distribution: {
      ...distribution,
      webStory: {
        ...webStory,
        url: normalizedUrl,
        canonicalUrl: normalizedUrl
      }
    },
    distributionAssets: structured.distributionAssets ? {
      ...structured.distributionAssets,
      webStoryHtml: normalizeStorySeoHtml(structured.distributionAssets.webStoryHtml || ''),
      bookendJson: normalizeStorySeoHtml(structured.distributionAssets.bookendJson || '')
    } : structured.distributionAssets,
    storyGeneration: structured.storyGeneration || buildStoryGenerationState({
      status: 'story_generated',
      url: normalizedUrl,
      canonical: normalizedUrl,
      reason: 'legacy_normalized_on_read'
    })
  };
};
