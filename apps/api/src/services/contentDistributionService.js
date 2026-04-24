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

const logger = createEditorialLogger('content-distribution');
const MAX_STORY_SLIDES = 8;
const MIN_STORY_SLIDES = 5;

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

const normalizeAbsoluteUrl = (value = '') => {
  if (!value) return '';
  if (/^https?:\/\//i.test(value)) return value;
  return `${SITE_BASE_URL}${value.startsWith('/') ? value : `/${value}`}`;
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

const buildStorySlides = (article = {}) => {
  const sections = Array.isArray(article.sections) ? article.sections : [];
  const slideCandidates = sections
    .flatMap((section) => [
      {
        title: section.heading,
        body: section.subheading || section.paragraphs?.[0] || ''
      },
      ...(Array.isArray(section.bullets) ? section.bullets.slice(0, 1).map((bullet) => ({
        title: bullet,
        body: section.heading
      })) : [])
    ])
    .filter((item) => item.title || item.body);

  const slides = [
    {
      kind: 'cover',
      headline: truncate(article.h1 || article.title, 72),
      subline: truncate(article.summary || article.excerpt, 96)
    },
    ...slideCandidates.slice(0, MAX_STORY_SLIDES - 2).map((item) => ({
      kind: 'content',
      headline: truncate(item.title, 62),
      subline: truncate(item.body, 104)
    })),
    {
      kind: 'cta',
      headline: 'Veja completo no site',
      subline: truncate(article.summary || article.title, 92)
    }
  ];

  while (slides.length < MIN_STORY_SLIDES) {
    const index = slides.length;
    const fallbackText = article.intro?.[index - 1] || article.conclusion?.[0] || article.summary || article.title;
    slides.splice(slides.length - 1, 0, {
      kind: 'content',
      headline: truncate(fallbackText, 62),
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

const buildStoryBackgroundSvg = ({ slide, index, article }) => {
  const [base, accent, highlight] = paletteForIndex(index);
  const label = escapeHtml(article.category || article.clusterLabel || 'Cote Juros');

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="720" height="1280" viewBox="0 0 720 1280" role="img" aria-label="${escapeHtml(slide.headline)}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${base}"/>
      <stop offset="0.58" stop-color="${accent}"/>
      <stop offset="1" stop-color="${highlight}"/>
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="35%" r="65%">
      <stop offset="0" stop-color="#FFFFFF" stop-opacity="0.36"/>
      <stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="720" height="1280" fill="url(#bg)"/>
  <rect width="720" height="1280" fill="url(#glow)"/>
  <circle cx="92" cy="210" r="155" fill="#FFFFFF" opacity="0.08"/>
  <circle cx="638" cy="1100" r="245" fill="#FFFFFF" opacity="0.10"/>
  <path d="M86 854 C216 744 322 798 442 682 C528 598 588 520 684 548 L684 1280 L86 1280 Z" fill="#020617" opacity="0.28"/>
  <rect x="64" y="72" width="196" height="44" rx="22" fill="#FFFFFF" opacity="0.16"/>
  <text x="88" y="101" fill="#FFFFFF" font-family="Arial, sans-serif" font-size="18" font-weight="700" opacity="0.92">${label}</text>
  <text x="64" y="1192" fill="#FFFFFF" font-family="Arial, sans-serif" font-size="18" font-weight="700" opacity="0.82">cotejuros.com.br</text>
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
    const bgUrl = `${SITE_BASE_URL}${storyPublicPath}/assets/${id}.svg`;
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
  <link rel="canonical" href="${escapeHtml(`${SITE_BASE_URL}${storyPublicPath}/`)}">
  <meta name="viewport" content="width=device-width,minimum-scale=1,initial-scale=1">
  <meta name="robots" content="index,follow,max-image-preview:large">
  <meta name="description" content="${escapeHtml(article.metaDescription || article.summary || article.excerpt || article.title)}">
  <script async src="https://cdn.ampproject.org/v0.js"></script>
  <script async custom-element="amp-story" src="https://cdn.ampproject.org/v0/amp-story-1.0.js"></script>
  <style amp-boilerplate>body{-webkit-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-moz-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-ms-animation:-amp-start 8s steps(1,end) 0s 1 normal both;animation:-amp-start 8s steps(1,end) 0s 1 normal both}@-webkit-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-moz-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-ms-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-o-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}</style><noscript><style amp-boilerplate>body{-webkit-animation:none;-moz-animation:none;-ms-animation:none;animation:none}</style></noscript>
  <style amp-custom>
    amp-story{font-family:Arial,sans-serif;color:#fff}
    .copy{padding:64px 48px 76px;text-shadow:0 2px 18px rgba(0,0,0,.34)}
    .spacer{height:38vh}
    .kicker{display:inline-block;margin:0 0 18px;padding:8px 16px;border-radius:999px;background:rgba(255,255,255,.16);font-size:16px;font-weight:800;letter-spacing:.08em;text-transform:uppercase}
    h1{margin:0;font-size:54px;line-height:1.02;font-weight:900;letter-spacing:0}
    p{max-width:600px;margin:18px 0 0;font-size:24px;line-height:1.28;font-weight:650;color:rgba(255,255,255,.9)}
    .cta{display:inline-flex;align-items:center;justify-content:center;min-height:56px;padding:0 28px;border-radius:999px;background:#fff;color:#111827;font-size:18px;font-weight:900;text-decoration:none}
  </style>
  <script type="application/ld+json">${JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.metaDescription || article.summary || article.excerpt,
    image: posterImageUrl,
    mainEntityOfPage: `${SITE_BASE_URL}${storyPublicPath}/`,
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
    <amp-story-bookend src="${escapeHtml(`${SITE_BASE_URL}${storyPublicPath}/bookend.json`)}" layout="nodisplay"></amp-story-bookend>
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

  await fs.mkdir(storyAssetsDir, { recursive: true });
  await fs.mkdir(pinterestDir, { recursive: true });

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
  const imageUrl = `${SITE_BASE_URL}${pinterestPublicPath}`;
  const payload = createPinterestPayload({ article, articleUrl, imageUrl, keywords });

  if (!accessToken || !boardId) {
    return {
      status: 'draft_saved',
      reason: 'Missing PINTEREST_ACCESS_TOKEN or PINTEREST_BOARD_ID',
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
    throw new Error(`Pinterest pin creation failed (${response.status}): ${responseText}`);
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
      prompt: `Generated visual background for Web Story slide: ${slide.headline}`,
      publicPath: `${storyPublicPath}/assets/slide-${index + 1}.svg`,
      width: 720,
      height: 1280,
      status: 'succeeded',
      metadata: {
        distributionType: 'web_story',
        slideIndex: index + 1,
        headline: slide.headline
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
      const slides = buildStorySlides(article);
      const pinterestPublicPath = `/images/pinterest/${dirs.safeSlug}.svg`;
      const pinterestImagePath = path.join(dirs.pinterestDir, `${dirs.safeSlug}.svg`);

      await Promise.all(slides.map((slide, index) => fs.writeFile(
        path.join(dirs.storyAssetsDir, `slide-${index + 1}.svg`),
        buildStoryBackgroundSvg({ slide, index, article }),
        'utf8'
      )));

      await fs.writeFile(
        pinterestImagePath,
        buildPinterestSvg({ article, keywords }),
        'utf8'
      );

      const posterImageUrl = `${SITE_BASE_URL}${pinterestPublicPath}`;
      const storyIndexPath = path.join(dirs.storyDir, 'index.html');
      await fs.writeFile(
        storyIndexPath,
        buildStoryHtml({
          article,
          slides,
          storyPublicPath: dirs.storyPublicPath,
          articleUrl,
          posterImageUrl
        }),
        'utf8'
      );
      await fs.writeFile(
        path.join(dirs.storyDir, 'bookend.json'),
        buildBookendJson({ article, articleUrl }),
        'utf8'
      );

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
          url: `${SITE_BASE_URL}${dirs.storyPublicPath}/`,
          slideCount: slides.length
        },
        pinterest: {
          status: pinterest.status,
          imagePath: pinterestPublicPath,
          imageUrl: `${SITE_BASE_URL}${pinterestPublicPath}`,
          title: pinterest.payload.title,
          description: pinterest.payload.description,
          pinId: pinterest.pinId || null,
          url: pinterest.url || null,
          draftReason: pinterest.reason || null
        },
        validation
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
            distribution
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
        pinterestStatus: pinterest.status
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
