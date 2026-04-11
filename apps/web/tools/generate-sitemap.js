import { writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { articlesData } from '../src/data/articlesData.js';
import { creditCardsData } from '../src/data/creditCardsData.js';
import {
  blogEditorialDefinitions,
  comparePageDefinitions,
  corePillarPaths,
  requiredBankRoutes,
  reservedSeoStaticPaths,
  slugify
} from '../src/seo/seoCatalog.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = resolve(__dirname, '../public');
const sitemapPath = resolve(publicDir, 'sitemap.xml');
const robotsPath = resolve(publicDir, 'robots.txt');

const siteUrl = (process.env.SITE_URL || process.env.VITE_SITE_URL || 'https://cote-juros-hostinger-horizons-web.vercel.app').replace(/\/$/, '');
const now = new Date().toISOString();

const fixedRoutes = [
  ...corePillarPaths,
  '/cartoes-de-credito',
  '/financiamento',
  '/diagnostico-financeiro',
  '/cote-finance-ai',
  '/sobre-nos',
  '/contato',
  '/politica-de-privacidade',
  '/termos-de-uso'
];

const comparisonRoutes = comparePageDefinitions.map((item) => `/comparar/${item.slug}`);
const bankRoutes = requiredBankRoutes.map((bank) => `/banco/${bank.slug}`);
const cardRoutes = creditCardsData.map((card) => `/cartao/${slugify(card.name || '')}`);
const blogRoutes = [
  ...blogEditorialDefinitions.map((article) => article.path),
  ...articlesData.map((article) => `/blog/${slugify(article.slug || article.title || '')}`)
];

const allRoutes = Array.from(
  new Set([
    ...fixedRoutes,
    ...reservedSeoStaticPaths,
    ...comparisonRoutes,
    ...bankRoutes,
    ...cardRoutes,
    ...blogRoutes
  ])
).filter(Boolean);

const toUrlNode = (path) => {
  const loc = `${siteUrl}${path === '/' ? '' : path}`;
  return [
    '  <url>',
    `    <loc>${loc}</loc>`,
    `    <lastmod>${now}</lastmod>`,
    '    <changefreq>daily</changefreq>',
    '    <priority>0.7</priority>',
    '  </url>'
  ].join('\n');
};

const sitemapXml = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...allRoutes.map(toUrlNode),
  '</urlset>'
].join('\n');

writeFileSync(sitemapPath, sitemapXml, 'utf8');

const robotsTxt = [
  'User-agent: *',
  'Allow: /',
  '',
  `Sitemap: ${siteUrl}/sitemap.xml`
].join('\n');

writeFileSync(robotsPath, robotsTxt, 'utf8');

console.log(`Sitemap atualizado com ${allRoutes.length} rotas.`);
