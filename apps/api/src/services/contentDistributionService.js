import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getPrisma } from '../lib/prisma.js';
import {
  PINTEREST_API_BASE_URL,
  PINTEREST_IMAGE_DIR,
  SITE_BASE_URL,
  WEB_STORIES_DIR
} from './editorialConfig.js';
import { createEditorialLogger } from './editorialLogger.js';
import { isTemplateOrPlaceholderImage } from './blogImage/validator.js';

const logger = createEditorialLogger('content-distribution');
const MAX_STORY_SLIDES = 8;
const MIN_STORY_SLIDES = 5;
const WRITE_LOCAL_DISTRIBUTION_FILES = process.env.DISTRIBUTION_WRITE_LOCAL_FILES === 'true';
const DISTRIBUTION_PUBLIC_BASE_URL = (process.env.DISTRIBUTION_PUBLIC_BASE_URL || SITE_BASE_URL).replace(/\/$/, '');
const DEFAULT_PINTEREST_REQUIRED_SCOPES = [
  'pins:read',
  'pins:write',
  'boards:read',
  'boards:write',
  'user_accounts:read'
];
const PINTEREST_PUBLICATION_SCOPE_ERROR =
  'Pinterest token sem permissão de publicação. Gere um novo token após aprovação Standard Access com scopes pins:write e boards:write.';

const stripTags = (value = '') => String(value || '').replace(/<[^>]*>/g, ' ');
const compactWhitespace = (value = '') => stripTags(value).replace(/\s+/g, ' ').trim();

const escapeHtml = (value = '') =>
  String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const toSlug = (value = '') =>
  String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

const truncate = (value = '', max = 84) => {
  const text = compactWhitespace(value);
  if (text.length <= max) return text;
  const sliced = text.slice(0, max - 1).trim();
  return `${sliced.replace(/\s+\S*$/, '')}...`;
};

const truncateClean = (value = '', max = 84) => {
  const text = compactWhitespace(value).replace(/\s*[:|-]\s*.+$/, '').trim();
  if (text.length <= max) return text;
  return text.slice(0, max).trim().replace(/\s+\S*$/, '');
};

const normalizeAbsoluteUrl = (value = '') => {
  if (!value) return '';
  if (/^https?:\/\//i.test(value)) return value;
  return `${SITE_BASE_URL}${value.startsWith('/') ? value : `/${value}`}`;
};

const isValidStoryImageUrl = (value = '') => {
  const url = normalizeAbsoluteUrl(value);
  return /^https?:\/\//i.test(url) && !isTemplateOrPlaceholderImage(url) && !url.endsWith('.svg');
};

const parseScopeList = (value = '') =>
  String(value || '')
    .split(/[\s,]+/)
    .map((scope) => scope.trim())
    .filter(Boolean);

const getRequiredPinterestScopes = () => {
  const configured = parseScopeList(process.env.PINTEREST_REQUIRED_SCOPES);
  return configured.length ? configured : DEFAULT_PINTEREST_REQUIRED_SCOPES;
};

const parsePinterestMissingScopes = (responseText = '') => {
  const text = String(responseText || '');
  const match = text.match(/Missing:\s*\[([^\]]+)\]/i);
  if (!match) return [];

  return match[1]
    .split(',')
    .map((scope) => scope.replace(/['"]/g, '').trim())
    .filter(Boolean);
};

const safePinterestJson = async (response) => {
  const text = await response.text();
  if (!text) return { text, data: null };

  try {
    return { text, data: JSON.parse(text) };
  } catch {
    return { text, data: { raw: text } };
  }
};

const probePinterestReadScope = async ({ accessToken, scope, path: endpointPath }) => {
  const response = await fetch(`${PINTEREST_API_BASE_URL}${endpointPath}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  });
  const body = await safePinterestJson(response);

  return {
    scope,
    ok: response.ok,
    status: response.status,
    missingScopes: parsePinterestMissingScopes(body.text),
    response: body.data
  };
};

export const validatePinterestTokenScopes = async ({
  accessToken = process.env.PINTEREST_ACCESS_TOKEN,
  boardId = process.env.PINTEREST_BOARD_ID
} = {}) => {
  const requiredScopes = getRequiredPinterestScopes();
  const configuredTokenScopes = parseScopeList(
    process.env.PINTEREST_TOKEN_SCOPES || process.env.PINTEREST_ACCESS_TOKEN_SCOPES
  );

  if (!accessToken || !boardId) {
    return {
      ok: false,
      message: 'Missing PINTEREST_ACCESS_TOKEN or PINTEREST_BOARD_ID',
      requiredScopes,
      configuredTokenScopes,
      missingScopes: requiredScopes,
      missingConfig: [
        !accessToken ? 'PINTEREST_ACCESS_TOKEN' : null,
        !boardId ? 'PINTEREST_BOARD_ID' : null
      ].filter(Boolean)
    };
  }

  if (configuredTokenScopes.length) {
    const missingScopes = requiredScopes.filter((scope) => !configuredTokenScopes.includes(scope));
    return {
      ok: missingScopes.length === 0,
      message: missingScopes.length ? PINTEREST_PUBLICATION_SCOPE_ERROR : null,
      requiredScopes,
      configuredTokenScopes,
      missingScopes,
      source: 'configured_token_scopes'
    };
  }

  const readScopeProbes = await Promise.all([
    probePinterestReadScope({ accessToken, scope: 'user_accounts:read', path: '/user_account' }),
    probePinterestReadScope({ accessToken, scope: 'boards:read', path: '/boards?page_size=1' }),
    probePinterestReadScope({ accessToken, scope: 'pins:read', path: '/pins?page_size=1' })
  ]);
  const failedReadScopes = readScopeProbes
    .filter((probe) => !probe.ok)
    .flatMap((probe) => probe.missingScopes.length ? probe.missingScopes : [probe.scope]);
  const unverifiedWriteScopes = requiredScopes.filter((scope) => scope.endsWith(':write'));
  const missingScopes = Array.from(new Set([...failedReadScopes, ...unverifiedWriteScopes]));

  return {
    ok: missingScopes.length === 0,
    message: missingScopes.length ? PINTEREST_PUBLICATION_SCOPE_ERROR : null,
    requiredScopes,
    configuredTokenScopes,
    missingScopes,
    readScopeProbes,
    source: 'pinterest_read_probe'
  };
};

const getArticleUrl = (article = {}) =>
  normalizeAbsoluteUrl(article.canonicalUrl || article.routePath || `/blog/${article.slug}/`);

const getSecondaryKeywords = (article = {}, brief = {}) => {
  const candidates = [
    ...(Array.isArray(article.tags) ? article.tags : []),
    article.clusterKeyword,
    brief.primaryKeyword,
    ...((Array.isArray(brief.secondaryKeywords) ? brief.secondaryKeywords : []))
  ];

  return Array.from(new Set(candidates.map(compactWhitespace).filter(Boolean))).slice(0, 8);
};

const pruneDanglingWords = (value = '') =>
  compactWhitespace(value).replace(/\s+(a|as|ao|aos|com|da|das|de|do|dos|e|em|na|nas|no|nos|o|os|para|por|se|sem|um|uma)$/i, '');

const buildShortStoryTitle = (value = '') => pruneDanglingWords(truncateClean(value, 42)) || 'Guia Cote Juros';

const trimStoryText = (value = '', max = 90) => {
  const text = compactWhitespace(value).split(/(?<=[.!?])\s+/).slice(0, 2).join(' ');
  return truncate(text, max);
};

const buildStorySlides = (article = {}) => {
  const sections = Array.isArray(article.sections) ? article.sections : [];
  const slideCandidates = sections
    .flatMap((section) => [
      {
        title: buildShortStoryTitle(section.heading),
        body: section.subheading || section.paragraphs?.[0] || ''
      },
      ...(Array.isArray(section.bullets) ? section.bullets.slice(0, 1).map((bullet) => ({
        title: buildShortStoryTitle(bullet),
        body: section.heading
      })) : [])
    ])
    .filter((item) => item.title || item.body);

  const slides = [
    {
      kind: 'cover',
      headline: buildShortStoryTitle(article.h1 || article.title),
      subline: trimStoryText(article.summary || article.excerpt, 90)
    },
    ...slideCandidates.slice(0, MAX_STORY_SLIDES - 2).map((item) => ({
      kind: 'content',
      headline: buildShortStoryTitle(item.title),
      subline: trimStoryText(item.body, 90)
    })),
    {
      kind: 'cta',
      headline: 'Veja o guia completo',
      subline: trimStoryText(article.summary || article.title, 90)
    }
  ];

  while (slides.length < MIN_STORY_SLIDES) {
    const index = slides.length;
    const fallbackText = article.intro?.[index - 1] || article.conclusion?.[0] || article.summary || article.title;
    slides.splice(slides.length - 1, 0, {
      kind: 'content',
      headline: buildShortStoryTitle(fallbackText),
      subline: truncate(article.clusterLabel || article.category || 'Guia Cote Juros', 72)
    });
  }

  return slides.slice(0, MAX_STORY_SLIDES);
};

const paletteForIndex = (index) => {
  const palettes = [
    ['#111827', '#6D28D9', '#22C55E'],
    ['#0F172A', '#2563EB', '#F59E0B'],
    ['#18181B', '#7C3AED', '#14B8A6'],
    ['#172554', '#0EA5E9', '#F97316'],
    ['#111827', '#059669', '#A855F7'],
    ['#312E81', '#DB2777', '#FACC15'],
    ['#0F172A', '#EA580C', '#22D3EE'],
    ['#14532D', '#4F46E5', '#F43F5E']
  ];
  return palettes[index % palettes.length];
};

const validateWebStorySlide = (slide = {}) => {
  const issues = [];
  if (!isValidStoryImageUrl(slide.imageUrl)) issues.push('no valid image for web story');
  if (!slide.headline || slide.headline.length > 42) issues.push('headline exceeds safe length');
  if ((slide.subline || '').length > 90) issues.push('subtitle exceeds safe length');
  if ((slide.body || '').length > 160) issues.push('body exceeds safe length');
  if (/[^\s]{24,}/.test(slide.headline || '')) issues.push('headline has unsafe long word');

  return {
    passed: issues.length === 0,
    issues,
    checkedViewports: ['360x640', '412x915']
  };
};

const validateWebStorySlides = (slides = []) => {
  const slideResults = slides.map((slide, index) => ({
    index: index + 1,
    ...validateWebStorySlide(slide)
  }));
  const issues = slideResults.flatMap((result) => result.issues.map((issue) => `slide ${result.index}: ${issue}`));
  return {
    passed: issues.length === 0,
    issues,
    slideResults
  };
};

const buildStoryBackgroundSvg = ({ slide, index, article }) => {
  const label = escapeHtml(article.category || article.clusterLabel || 'Cote Juros');
  const imageUrl = escapeHtml(slide.imageUrl);
  const headlineSize = slide.headline.length > 34 ? 48 : slide.headline.length > 24 ? 54 : 58;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="720" height="1280" viewBox="0 0 720 1280" role="img" aria-label="${escapeHtml(slide.headline)}">
  <defs>
    <linearGradient id="shade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#020617" stop-opacity="0.34"/>
      <stop offset="0.48" stop-color="#020617" stop-opacity="0.44"/>
      <stop offset="1" stop-color="#020617" stop-opacity="0.82"/>
    </linearGradient>
  </defs>
  <image href="${imageUrl}" x="0" y="0" width="720" height="1280" preserveAspectRatio="xMidYMid slice"/>
  <rect width="720" height="1280" fill="url(#shade)"/>
  <rect x="32" y="72" width="656" height="1112" fill="transparent"/>
  <rect x="48" y="82" width="220" height="44" rx="22" fill="#020617" opacity="0.42"/>
  <text x="70" y="111" fill="#FFFFFF" font-family="Arial, sans-serif" font-size="17" font-weight="800" opacity="0.95">${label}</text>
  <foreignObject x="48" y="700" width="634" height="300">
    <div xmlns="http://www.w3.org/1999/xhtml" style="max-width:88%;font-family:Arial,sans-serif;color:#fff;font-size:${headlineSize}px;line-height:1.02;font-weight:900;letter-spacing:0;overflow-wrap:break-word;word-break:normal;hyphens:auto;text-shadow:0 3px 18px rgba(0,0,0,.45);display:-webkit-box;-webkit-line-clamp:4;-webkit-box-orient:vertical;overflow:hidden;">${escapeHtml(slide.headline)}</div>
  </foreignObject>
  <foreignObject x="48" y="1008" width="624" height="130">
    <div xmlns="http://www.w3.org/1999/xhtml" style="font-family:Arial,sans-serif;color:rgba(255,255,255,.92);font-size:25px;line-height:1.22;font-weight:700;overflow-wrap:break-word;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;text-shadow:0 2px 14px rgba(0,0,0,.42);">${escapeHtml(slide.subline || '')}</div>
  </foreignObject>
  <text x="48" y="1184" fill="#FFFFFF" font-family="Arial, sans-serif" font-size="18" font-weight="800" opacity="0.88">cotejuros.com.br</text>
</svg>`;
};

const buildPinterestSvg = ({ article, keywords }) => {
  const [base, accent, highlight] = paletteForIndex((article.slug || '').length);
  const headline = escapeHtml(truncate(article.h1 || article.title, 92));
  const description = escapeHtml(truncate(article.summary || article.excerpt, 128));
  const keyword = escapeHtml(keywords[0] || article.category || 'Credito consciente');

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="1500" viewBox="0 0 1000 1500" role="img" aria-label="${headline}">
  <defs>
    <linearGradient id="pin-bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${base}"/>
      <stop offset="0.58" stop-color="${accent}"/>
      <stop offset="1" stop-color="${highlight}"/>
    </linearGradient>
    <radialGradient id="pin-glow" cx="52%" cy="24%" r="66%">
      <stop offset="0" stop-color="#FFFFFF" stop-opacity="0.34"/>
      <stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1000" height="1500" fill="url(#pin-bg)"/>
  <rect width="1000" height="1500" fill="url(#pin-glow)"/>
  <circle cx="110" cy="268" r="210" fill="#FFFFFF" opacity="0.08"/>
  <circle cx="924" cy="1302" r="310" fill="#FFFFFF" opacity="0.10"/>
  <path d="M0 1040 C168 900 324 960 486 806 C626 672 754 572 1000 638 L1000 1500 L0 1500 Z" fill="#020617" opacity="0.30"/>
  <rect x="80" y="86" width="288" height="58" rx="29" fill="#FFFFFF" opacity="0.16"/>
  <text x="118" y="124" fill="#FFFFFF" font-family="Arial, sans-serif" font-size="24" font-weight="700">Cote Juros</text>
  <rect x="80" y="238" width="700" height="54" rx="27" fill="#FFFFFF" opacity="0.18"/>
  <text x="116" y="274" fill="#FFFFFF" font-family="Arial, sans-serif" font-size="26" font-weight="700">${keyword}</text>
  <foreignObject x="80" y="390" width="820" height="540">
    <div xmlns="http://www.w3.org/1999/xhtml" style="font-family: Arial, sans-serif; color: #fff; font-size: 78px; line-height: 1.02; font-weight: 800;">${headline}</div>
  </foreignObject>
  <foreignObject x="84" y="980" width="760" height="220">
    <div xmlns="http://www.w3.org/1999/xhtml" style="font-family: Arial, sans-serif; color: rgba(255,255,255,.88); font-size: 34px; line-height: 1.25; font-weight: 600;">${description}</div>
  </foreignObject>
  <rect x="80" y="1280" width="434" height="72" rx="36" fill="#FFFFFF"/>
  <text x="122" y="1326" fill="#111827" font-family="Arial, sans-serif" font-size="28" font-weight="800">Ler guia completo</text>
  <text x="80" y="1428" fill="#FFFFFF" font-family="Arial, sans-serif" font-size="24" font-weight="700" opacity="0.86">cotejuros.com.br</text>
</svg>`;
};

const buildStoryHtml = ({ article, slides, storyPublicPath, articleUrl, posterImageUrl }) => {
  const title = escapeHtml(`${article.title} | Web Story Cote Juros`);
  const publisherLogo = `${SITE_BASE_URL}/assets/logo/logo-icon-square.png`;

  const pages = slides.map((slide, index) => {
    const id = `slide-${index + 1}`;
    const bgUrl = `${DISTRIBUTION_PUBLIC_BASE_URL}${storyPublicPath}/assets/${id}.svg`;
    const isCta = slide.kind === 'cta';
    const cta = isCta
      ? `<amp-story-cta-layer>
          <a href="${escapeHtml(articleUrl)}" class="cta">Veja completo no site</a>
        </amp-story-cta-layer>`
      : '';

    return `<amp-story-page id="${id}">
      <amp-story-grid-layer template="fill">
        <amp-img src="${escapeHtml(bgUrl)}" width="720" height="1280" layout="responsive" alt="${escapeHtml(slide.headline)}"></amp-img>
      </amp-story-grid-layer>
      <amp-story-grid-layer template="vertical" class="copy">
        <div class="spacer"></div>
        <p class="kicker">${escapeHtml(article.category || 'Cote Juros')}</p>
        <h1>${escapeHtml(slide.headline)}</h1>
        <p>${escapeHtml(slide.subline)}</p>
      </amp-story-grid-layer>
      ${cta}
    </amp-story-page>`;
  }).join('\n');

  return `<!doctype html>
<html amp lang="pt-BR">
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <link rel="canonical" href="${escapeHtml(`${DISTRIBUTION_PUBLIC_BASE_URL}${storyPublicPath}/`)}">
  <meta name="viewport" content="width=device-width,minimum-scale=1,initial-scale=1">
  <meta name="robots" content="index,follow,max-image-preview:large">
  <meta name="description" content="${escapeHtml(article.metaDescription || article.summary || article.excerpt || article.title)}">
  <script async src="https://cdn.ampproject.org/v0.js"></script>
  <script async custom-element="amp-story" src="https://cdn.ampproject.org/v0/amp-story-1.0.js"></script>
  <style amp-boilerplate>body{-webkit-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-moz-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-ms-animation:-amp-start 8s steps(1,end) 0s 1 normal both;animation:-amp-start 8s steps(1,end) 0s 1 normal both}@-webkit-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-moz-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-ms-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-o-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}</style><noscript><style amp-boilerplate>body{-webkit-animation:none;-moz-animation:none;-ms-animation:none;animation:none}</style></noscript>
  <style amp-custom>
    amp-story{font-family:Arial,sans-serif;color:#fff}
    .copy{padding:72px 32px 96px;text-shadow:0 2px 18px rgba(0,0,0,.34)}
    .spacer{height:0}
    .kicker,h1,p{display:none}
    .cta{display:inline-flex;align-items:center;justify-content:center;min-height:56px;padding:0 28px;border-radius:999px;background:#fff;color:#111827;font-size:18px;font-weight:900;text-decoration:none}
  </style>
  <script type="application/ld+json">${JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.metaDescription || article.summary || article.excerpt,
    image: posterImageUrl,
    mainEntityOfPage: `${DISTRIBUTION_PUBLIC_BASE_URL}${storyPublicPath}/`,
    isPartOf: articleUrl,
    publisher: {
      '@type': 'Organization',
      name: 'Cote Juros'
    }
  })}</script>
</head>
<body>
  <amp-story standalone
    title="${escapeHtml(article.title)}"
    publisher="Cote Juros"
    publisher-logo-src="${publisherLogo}"
    poster-portrait-src="${escapeHtml(posterImageUrl)}">
    ${pages}
    <amp-story-bookend src="${escapeHtml(`${DISTRIBUTION_PUBLIC_BASE_URL}${storyPublicPath}/bookend.json`)}" layout="nodisplay"></amp-story-bookend>
  </amp-story>
</body>
</html>`;
};

const buildBookendJson = ({ article, articleUrl }) => JSON.stringify({
  bookendVersion: 'v1.0',
  shareProviders: ['facebook', 'twitter', 'email'],
  components: [
    {
      type: 'heading',
      text: 'Continue lendo'
    },
    {
      type: 'small',
      title: article.title,
      url: articleUrl,
      image: normalizeAbsoluteUrl(article.coverImage || article.ogImage || '')
    }
  ]
}, null, 2);

const ensureDistributionDirs = async (slug) => {
  const safeSlug = toSlug(slug);
  if (!safeSlug) throw new Error('Missing article slug for distribution');

  const storiesRoot = fileURLToPath(WEB_STORIES_DIR);
  const storyDir = path.join(storiesRoot, safeSlug);
  const storyAssetsDir = path.join(storyDir, 'assets');
  const pinterestDir = fileURLToPath(PINTEREST_IMAGE_DIR);

  if (WRITE_LOCAL_DISTRIBUTION_FILES) {
    await fs.mkdir(storyAssetsDir, { recursive: true });
    await fs.mkdir(pinterestDir, { recursive: true });
  }

  return {
    safeSlug,
    storyDir,
    storyAssetsDir,
    pinterestDir,
    storyPublicPath: `/stories/${safeSlug}`
  };
};

const validateGeneratedFiles = async ({ storyIndexPath, pinterestImagePath, articleUrl }) => {
  const issues = [];
  if (WRITE_LOCAL_DISTRIBUTION_FILES) {
    try {
      await fs.access(storyIndexPath);
    } catch {
      issues.push('Web Story index.html ausente');
    }

    try {
      await fs.access(pinterestImagePath);
    } catch {
      issues.push('Imagem Pinterest ausente');
    }
  }

  try {
    const url = new URL(articleUrl);
    if (!url.pathname.startsWith('/blog/')) issues.push('Link do artigo nao aponta para /blog/');
  } catch {
    issues.push('Link do artigo invalido');
  }

  return {
    passed: issues.length === 0,
    issues
  };
};

const createPinterestPayload = ({ article, articleUrl, imageUrl, keywords }) => ({
  board_id: process.env.PINTEREST_BOARD_ID,
  title: truncate(article.metaTitle || article.title, 96),
  description: truncate([
    article.metaDescription || article.summary || article.excerpt,
    keywords.length ? `Palavras-chave: ${keywords.slice(0, 4).join(', ')}.` : '',
    'Veja o guia completo na Cote Juros.'
  ].filter(Boolean).join(' '), 480),
  link: articleUrl,
  media_source: {
    source_type: 'image_url',
    url: imageUrl
  }
});

const publishPinterestPin = async ({ article, articleUrl, pinterestPublicPath, keywords }) => {
  const accessToken = process.env.PINTEREST_ACCESS_TOKEN;
  const boardId = process.env.PINTEREST_BOARD_ID;
  const imageUrl = `${DISTRIBUTION_PUBLIC_BASE_URL}${pinterestPublicPath}`;
  const payload = createPinterestPayload({ article, articleUrl, imageUrl, keywords });
  const scopeValidation = await validatePinterestTokenScopes({ accessToken, boardId });

  if (!scopeValidation.ok) {
    await logger.warn('pinterest_token_scope_validation_failed', {
      slug: article.slug,
      message: scopeValidation.message,
      missingScopes: scopeValidation.missingScopes,
      requiredScopes: scopeValidation.requiredScopes,
      missingConfig: scopeValidation.missingConfig || [],
      validationSource: scopeValidation.source || 'config'
    });

    return {
      status: 'failed',
      reason: scopeValidation.message,
      missingScopes: scopeValidation.missingScopes,
      requiredScopes: scopeValidation.requiredScopes,
      validation: scopeValidation,
      payload
    };
  }

  const response = await fetch(`${PINTEREST_API_BASE_URL}/pins`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  const responseText = await response.text();
  let responsePayload = null;
  try {
    responsePayload = responseText ? JSON.parse(responseText) : null;
  } catch {
    responsePayload = { raw: responseText };
  }

  if (!response.ok) {
    const missingScopes = parsePinterestMissingScopes(responseText);
    await logger.warn('pinterest_pin_creation_failed', {
      slug: article.slug,
      status: response.status,
      missingScopes,
      response: responsePayload
    });

    return {
      status: 'failed',
      reason: `Pinterest pin creation failed (${response.status}): ${responseText}`,
      missingScopes,
      requiredScopes: scopeValidation.requiredScopes,
      response: responsePayload,
      payload
    };
  }

  return {
    status: 'published',
    pinId: responsePayload?.id || null,
    url: responsePayload?.link || null,
    response: responsePayload,
    payload
  };
};

const recordDistributionAssets = async ({ articleId, slug, slides, storyPublicPath, pinterestPublicPath }) => {
  const prisma = getPrisma();
  const data = [
    ...slides.map((slide, index) => ({
      articleId,
      slug: `${slug}-story-slide-${index + 1}`,
      provider: 'fallback',
      prompt: `Web Story slide with real image: ${slide.headline}`,
      publicPath: `${storyPublicPath}/assets/slide-${index + 1}.svg`,
      width: 720,
      height: 1280,
      status: 'succeeded',
      metadata: {
        distributionType: 'web_story',
        slideIndex: index + 1,
        headline: slide.headline,
        sourceImageUrl: slide.imageUrl,
        validation: validateWebStorySlide(slide)
      }
    })),
    {
      articleId,
      slug: `${slug}-pinterest`,
      provider: 'fallback',
      prompt: 'Generated vertical Pinterest creative from article metadata',
      publicPath: pinterestPublicPath,
      width: 1000,
      height: 1500,
      status: 'succeeded',
      metadata: {
        distributionType: 'pinterest_creative'
      }
    }
  ];

  await prisma.editorialAsset.createMany({ data });
};

export class ContentDistributionService {
  static async distributePublishedArticle({ articleRecord, articlePayload, brief, triggerSource = 'editorial' }) {
    const prisma = getPrisma();
    const article = {
      ...articlePayload,
      id: articleRecord.id,
      slug: articleRecord.slug,
      title: articleRecord.title,
      status: articleRecord.status,
      publishedAt: articleRecord.publishedAt
    };

    const jobRun = await prisma.editorialJobRun.create({
      data: {
        jobName: 'editorial-distribution',
        triggerSource,
        clusterId: articleRecord.clusterId,
        briefId: articleRecord.briefId,
        articleId: articleRecord.id,
        status: 'running',
        metadata: {
          slug: article.slug
        }
      }
    });

    try {
      if (articleRecord.status !== 'published') {
        throw new Error(`Article ${article.slug} is not published`);
      }

      const dirs = await ensureDistributionDirs(article.slug);
      const articleUrl = getArticleUrl(article);
      const keywords = getSecondaryKeywords(article, brief);
      const storyImageUrl = normalizeAbsoluteUrl(article.coverImage || article.ogImage || '');
      if (!isValidStoryImageUrl(storyImageUrl)) {
        throw new Error('no valid image for web story');
      }
      const slides = buildStorySlides(article).map((slide) => ({
        ...slide,
        imageUrl: storyImageUrl
      }));
      const storyValidation = validateWebStorySlides(slides);
      if (!storyValidation.passed) {
        throw new Error(`Web Story validation failed: ${storyValidation.issues.join(' | ')}`);
      }
      const pinterestPublicPath = `/images/pinterest/${dirs.safeSlug}.svg`;
      const pinterestImagePath = path.join(dirs.pinterestDir, `${dirs.safeSlug}.svg`);
      const slideAssets = slides.map((slide, index) => ({
        path: `${dirs.storyPublicPath}/assets/slide-${index + 1}.svg`,
        content: buildStoryBackgroundSvg({ slide, index, article })
      }));
      const pinterestSvg = buildPinterestSvg({ article, keywords });

      const posterImageUrl = `${DISTRIBUTION_PUBLIC_BASE_URL}${pinterestPublicPath}`;
      const storyIndexPath = path.join(dirs.storyDir, 'index.html');
      const storyHtml = buildStoryHtml({
        article,
        slides,
        storyPublicPath: dirs.storyPublicPath,
        articleUrl,
        posterImageUrl
      });
      const bookendJson = buildBookendJson({ article, articleUrl });

      if (WRITE_LOCAL_DISTRIBUTION_FILES) {
        await Promise.all(slideAssets.map((asset, index) => fs.writeFile(
          path.join(dirs.storyAssetsDir, `slide-${index + 1}.svg`),
          asset.content,
          'utf8'
        )));

        await fs.writeFile(pinterestImagePath, pinterestSvg, 'utf8');
        await fs.writeFile(storyIndexPath, storyHtml, 'utf8');
        await fs.writeFile(path.join(dirs.storyDir, 'bookend.json'), bookendJson, 'utf8');
      }

      const validation = await validateGeneratedFiles({
        storyIndexPath,
        pinterestImagePath,
        articleUrl
      });

      if (!validation.passed) {
        throw new Error(`Distribution validation failed: ${validation.issues.join(' | ')}`);
      }

      const pinterest = await publishPinterestPin({
        article,
        articleUrl,
        pinterestPublicPath,
        keywords
      });

      const distribution = {
        webStory: {
          status: 'created',
          path: `${dirs.storyPublicPath}/`,
          url: `${DISTRIBUTION_PUBLIC_BASE_URL}${dirs.storyPublicPath}/`,
          slideCount: slides.length
        },
        pinterest: {
          status: pinterest.status,
          imagePath: pinterestPublicPath,
          imageUrl: `${DISTRIBUTION_PUBLIC_BASE_URL}${pinterestPublicPath}`,
          title: pinterest.payload.title,
          description: pinterest.payload.description,
          pinId: pinterest.pinId || null,
          url: pinterest.url || null,
          draftReason: pinterest.reason || null,
          errorMessage: pinterest.status === 'failed' ? pinterest.reason : null,
          missingScopes: pinterest.missingScopes || [],
          requiredScopes: pinterest.requiredScopes || getRequiredPinterestScopes()
        },
        validation
      };
      distribution.webStory.validation = storyValidation;
      const distributionAssets = {
        webStoryHtml: storyHtml,
        bookendJson,
        slides: slideAssets,
        pinterestSvg
      };

      await recordDistributionAssets({
        articleId: articleRecord.id,
        slug: dirs.safeSlug,
        slides,
        storyPublicPath: dirs.storyPublicPath,
        pinterestPublicPath
      });

      await prisma.article.update({
        where: { id: articleRecord.id },
        data: {
          structuredContent: {
            ...articlePayload,
            distribution,
            distributionAssets
          }
        }
      });

      await prisma.editorialJobRun.update({
        where: { id: jobRun.id },
        data: {
          status: pinterest.status === 'published' ? 'succeeded' : 'draft_saved',
          finishedAt: new Date(),
          durationMs: Date.now() - new Date(jobRun.startedAt).getTime(),
          metadata: {
            slug: article.slug,
            distribution
          },
          errorMessage: pinterest.status === 'published' ? null : pinterest.reason
        }
      });

      await logger.info('article_distribution_completed', {
        slug: article.slug,
        storyPath: distribution.webStory.path,
        storyImageUrl,
        originalTitle: article.title,
        shortTitle: slides[0]?.headline,
        storyValidation,
        pinterestStatus: pinterest.status,
        pinterestMissingScopes: pinterest.missingScopes || []
      });

      return distribution;
    } catch (error) {
      await prisma.editorialJobRun.update({
        where: { id: jobRun.id },
        data: {
          status: 'failed',
          finishedAt: new Date(),
          durationMs: Date.now() - new Date(jobRun.startedAt).getTime(),
          errorMessage: error?.message || String(error)
        }
      });

      await logger.error('article_distribution_failed', error, {
        slug: article.slug,
        articleId: articleRecord.id
      });

      throw error;
    }
  }
}
