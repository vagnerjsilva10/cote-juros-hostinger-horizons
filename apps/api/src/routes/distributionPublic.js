import express from 'express';
import { getPrisma } from '../lib/prisma.js';
import { PUBLIC_SITE_URL } from '../services/editorialConfig.js';
import {
  normalizePublicStoryUrl,
  normalizeStoredStoryDistribution,
  normalizeStorySeoHtml,
  validateWebStorySeo
} from '../services/webStorySeoService.js';

const router = express.Router();
const DISTRIBUTION_PUBLIC_BASE_URL = PUBLIC_SITE_URL;

const escapeXml = (value = '') =>
  String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

const getStructured = (article = {}) =>
  article?.structuredContent && typeof article.structuredContent === 'object'
    ? normalizeStoredStoryDistribution(article.structuredContent)
    : {};

const findPublishedArticleBySlug = async (slug) => {
  const prisma = getPrisma();
  return prisma.article.findFirst({
    where: {
      slug,
      status: 'published'
    },
    select: {
      slug: true,
      updatedAt: true,
      structuredContent: true
    }
  });
};

const getCanonicalArticleUrl = (article = {}) => {
  const structured = getStructured(article);
  return structured.canonicalUrl && structured.canonicalUrl.startsWith(PUBLIC_SITE_URL)
    ? structured.canonicalUrl
    : `${PUBLIC_SITE_URL}/blog/${article.slug}/`;
};

const getStorySitemapNode = (article = {}) => {
  const structured = getStructured(article);
  const story = structured.distribution?.webStory;
  if (!story?.url && !story?.path) return null;
  const storyUrl = normalizePublicStoryUrl(story.url, story.path);
  if (!storyUrl.startsWith(PUBLIC_SITE_URL)) return null;

  const validation = story.seoValidation || validateWebStorySeo({
    article: {
      ...structured,
      slug: article.slug,
      title: structured.title || article.title || article.slug,
      metaDescription: structured.metaDescription || structured.summary || ''
    },
    storyHtml: normalizeStorySeoHtml(structured.distributionAssets?.webStoryHtml || ''),
    bookendJson: normalizeStorySeoHtml(structured.distributionAssets?.bookendJson || ''),
    distribution: {
      ...structured.distribution,
      webStory: {
        ...story,
        url: storyUrl
      }
    },
    slideAssets: (structured.distributionAssets?.slides || []).map((asset) => ({
      ...asset,
      content: normalizeStorySeoHtml(asset.content || '')
    })),
    posterImageUrl: structured.coverImage || structured.ogImage || structured.distribution?.pinterest?.imageUrl || '',
    storyPublicPath: story.path || new URL(storyUrl).pathname,
    articleUrl: getCanonicalArticleUrl(article)
  });
  if (validation.passed === false) return null;

  return {
    loc: storyUrl,
    lastmod: new Date(article.updatedAt).toISOString(),
    priority: '0.6'
  };
};

router.get('/sitemap.xml', async (req, res, next) => {
  try {
    const prisma = getPrisma();
    const [articles, stories] = await Promise.all([
      prisma.article.findMany({
        where: { status: 'published' },
        select: {
          slug: true,
          updatedAt: true,
          publishedAt: true,
          structuredContent: true
        },
        orderBy: [{ publishedAt: 'desc' }, { updatedAt: 'desc' }],
        take: 5000
      }),
      prisma.article.findMany({
        where: { status: 'published' },
        select: {
          slug: true,
          updatedAt: true,
          structuredContent: true
        },
        orderBy: { updatedAt: 'desc' },
        take: 5000
      })
    ]);

    const fixedRoutes = [
      '/',
      '/blog',
      '/emprestimos',
      '/cartoes',
      '/cartoes-de-credito',
      '/financiamento',
      '/ferramentas',
      '/calculadora-cet',
      '/simulador-comprometimento-renda',
      '/estudos/custo-emprestimo-negativado-2026',
      '/diagnostico-financeiro',
      '/cote-finance-ai',
      '/como-funciona',
      '/sobre-nos',
      '/contato',
      '/perguntas-frequentes',
      '/politica-de-privacidade',
      '/termos-de-uso'
    ];

    const fixedNodes = fixedRoutes.map((path) => ({
      loc: `${PUBLIC_SITE_URL}${path === '/' ? '' : path}`,
      lastmod: new Date().toISOString(),
      priority: path === '/' ? '1.0' : '0.7'
    }));
    const articleNodes = articles.map((article) => ({
      loc: getCanonicalArticleUrl(article),
      lastmod: new Date(article.updatedAt || article.publishedAt).toISOString(),
      priority: '0.8'
    }));
    const storyNodes = stories
      .map(getStorySitemapNode)
      .filter(Boolean);

    const seen = new Set();
    const urls = [...fixedNodes, ...articleNodes, ...storyNodes]
      .filter((item) => {
        if (!item?.loc || seen.has(item.loc)) return false;
        seen.add(item.loc);
        return true;
      })
      .map((item) => [
        '  <url>',
        `    <loc>${escapeXml(item.loc)}</loc>`,
        `    <lastmod>${escapeXml(item.lastmod)}</lastmod>`,
        '    <changefreq>daily</changefreq>',
        `    <priority>${item.priority}</priority>`,
        '  </url>'
      ].join('\n'))
      .join('\n');

    res.set('Cache-Control', 'public, max-age=300, s-maxage=1800');
    return res.type('application/xml').send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`);
  } catch (error) {
    return next(error);
  }
});

router.get('/robots.txt', (_req, res) => {
  res.type('text/plain').send([
    'User-agent: *',
    'Allow: /',
    '',
    `Sitemap: ${PUBLIC_SITE_URL}/sitemap.xml`,
    `Sitemap: ${DISTRIBUTION_PUBLIC_BASE_URL}/stories-sitemap.xml`
  ].join('\n'));
});

router.get('/stories-sitemap.xml', async (req, res, next) => {
  try {
    const prisma = getPrisma();
    const articles = await prisma.article.findMany({
      where: {
        status: 'published'
      },
      select: {
        slug: true,
        updatedAt: true,
        structuredContent: true
      },
      orderBy: { updatedAt: 'desc' },
      take: 1000
    });

    const seen = new Set();
    const urls = articles
      .map((article) => {
        const node = getStorySitemapNode(article);
        if (!node) return '';
        const storyUrl = node.loc;
        if (seen.has(storyUrl)) return '';
        seen.add(storyUrl);
        return [
          '  <url>',
          `    <loc>${escapeXml(storyUrl)}</loc>`,
          `    <lastmod>${node.lastmod}</lastmod>`,
          '  </url>'
        ].join('\n');
      })
      .filter(Boolean)
      .join('\n');

    res.type('application/xml').send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`);
  } catch (error) {
    next(error);
  }
});

router.get('/stories/:slug/', async (req, res, next) => {
  try {
    const article = await findPublishedArticleBySlug(req.params.slug);
    const html = normalizeStorySeoHtml(getStructured(article).distributionAssets?.webStoryHtml || '');
    if (!html) return res.status(404).send('Web Story not found');
    res.set('Cache-Control', 'public, max-age=300, s-maxage=3600');
    return res.type('html').send(html);
  } catch (error) {
    return next(error);
  }
});

router.get('/stories/:slug/bookend.json', async (req, res, next) => {
  try {
    const article = await findPublishedArticleBySlug(req.params.slug);
    const bookendJson = normalizeStorySeoHtml(getStructured(article).distributionAssets?.bookendJson || '');
    if (!bookendJson) return res.status(404).json({ error: 'Bookend not found' });
    res.set('Cache-Control', 'public, max-age=300, s-maxage=3600');
    return res.type('json').send(bookendJson);
  } catch (error) {
    return next(error);
  }
});

router.get('/stories/:slug/assets/:asset', async (req, res, next) => {
  try {
    const article = await findPublishedArticleBySlug(req.params.slug);
    const targetPath = `/stories/${req.params.slug}/assets/${req.params.asset}`;
    const asset = (getStructured(article).distributionAssets?.slides || []).find((item) => item.path === targetPath);
    if (!asset?.content) return res.status(404).send('Story asset not found');
    res.set('Cache-Control', 'public, max-age=300, s-maxage=3600');
    return res.type('image/svg+xml').send(normalizeStorySeoHtml(asset.content));
  } catch (error) {
    return next(error);
  }
});

router.get('/images/pinterest/:slug.svg', async (req, res, next) => {
  try {
    const article = await findPublishedArticleBySlug(req.params.slug);
    const svg = getStructured(article).distributionAssets?.pinterestSvg;
    if (!svg) return res.status(404).send('Pinterest image not found');
    res.set('Cache-Control', 'public, max-age=300, s-maxage=3600');
    return res.type('image/svg+xml').send(svg);
  } catch (error) {
    return next(error);
  }
});

router.get('/stories', (_req, res) => {
  res.redirect(301, `${DISTRIBUTION_PUBLIC_BASE_URL}/stories-sitemap.xml`);
});

export default router;
