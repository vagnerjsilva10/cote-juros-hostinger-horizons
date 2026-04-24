import express from 'express';
import { getPrisma } from '../lib/prisma.js';
import { SITE_BASE_URL } from '../services/editorialConfig.js';

const router = express.Router();

const escapeXml = (value = '') =>
  String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

const getStructured = (article = {}) =>
  article?.structuredContent && typeof article.structuredContent === 'object'
    ? article.structuredContent
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

    const urls = articles
      .map((article) => {
        const distribution = getStructured(article).distribution;
        if (!distribution?.webStory?.url) return '';
        return [
          '  <url>',
          `    <loc>${escapeXml(distribution.webStory.url)}</loc>`,
          `    <lastmod>${new Date(article.updatedAt).toISOString()}</lastmod>`,
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
    const html = getStructured(article).distributionAssets?.webStoryHtml;
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
    const bookendJson = getStructured(article).distributionAssets?.bookendJson;
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
    return res.type('image/svg+xml').send(asset.content);
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
  res.redirect(301, `${SITE_BASE_URL}/stories-sitemap.xml`);
});

export default router;
