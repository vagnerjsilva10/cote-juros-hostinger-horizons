import { existsSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { creditCardsData } from '../src/data/creditCardsData.js';
import {
  comparePageDefinitions,
  corePillarPaths,
  requiredBankRoutes,
  reservedSeoStaticPaths,
  slugify
} from '../src/seo/seoCatalog.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = resolve(__dirname, '../public');
const sitemapPath = resolve(publicDir, 'sitemap.xml');
const sitemapIndexPath = resolve(publicDir, 'sitemap-index.xml');
const robotsPath = resolve(publicDir, 'robots.txt');

const normalizePublicSiteUrl = (value = '') => {
  const raw = String(value || 'https://www.cotejuros.com.br').trim().replace(/\/$/, '');
  try {
    const url = new URL(raw);
    if (url.hostname === 'www.cotejuros.com.br') return 'https://www.cotejuros.com.br';
    if (url.hostname === 'cotejuros.com.br' || url.hostname === 'api.cotejuros.com.br') {
      return 'https://www.cotejuros.com.br';
    }
    console.warn(`[sitemap] SITE_URL ignorado por domínio não canônico: ${raw}`);
    return 'https://www.cotejuros.com.br';
  } catch {
    return 'https://www.cotejuros.com.br';
  }
};

const siteUrl = normalizePublicSiteUrl(process.env.SITE_URL || process.env.VITE_SITE_URL);
const apiBaseUrl = (process.env.VITE_API_BASE_URL || process.env.API_BASE_URL || 'https://api.cotejuros.com.br').replace(/\/$/, '');
const allowLocalArticleFallback = process.env.SITEMAP_ALLOW_LOCAL_ARTICLE_FALLBACK !== 'false';
const now = new Date().toISOString();

const fixedRoutes = [
  ...corePillarPaths,
  '/quiz',
  '/radar',
  '/seguros',
  '/seguro-auto',
  '/seguro-moto',
  '/seguro-viagem',
  '/seguro-vida',
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

const excludedRoutePrefixes = [
  '/admin',
  '/dashboard',
  '/login',
  '/criar-conta',
  '/r/',
  '/resultado',
  '/proxima-etapa',
  '/motion-hero'
];

const isPublicSitemapRoute = (path = '') => {
  if (!path.startsWith('/')) return false;
  return !excludedRoutePrefixes.some((prefix) => path === prefix || path.startsWith(prefix));
};

const comparisonRoutes = comparePageDefinitions.map((item) => `/comparar/${item.slug}`);
const bankRoutes = requiredBankRoutes.map((bank) => `/banco/${bank.slug}`);
const cardRoutes = creditCardsData.map((card) => `/cartao/${slugify(card.name || '')}`);
const storiesDir = resolve(publicDir, 'stories');
const storyRoutes = existsSync(storiesDir)
  ? readdirSync(storiesDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => `/stories/${entry.name}/`)
  : [];

const fetchPublishedArticleRoutes = async () => {
  if (process.env.SITEMAP_FETCH_API === 'false') {
    if (!allowLocalArticleFallback) {
      throw new Error('SITEMAP_FETCH_API=false sem SITEMAP_ALLOW_LOCAL_ARTICLE_FALLBACK=true. A API e a fonte principal do sitemap.');
    }
    return [];
  }

  try {
    const response = await fetch(`${apiBaseUrl}/api/articles?limit=5000`);
    if (!response.ok) throw new Error(`API respondeu ${response.status}`);
    const payload = await response.json();
    const items = Array.isArray(payload?.data) ? payload.data : [];
    return items
      .map((article) => article?.routePath || (article?.slug ? `/blog/${article.slug}` : ''))
      .filter(Boolean);
  } catch (error) {
    console.warn(`[sitemap] Nao foi possivel buscar artigos publicados da API: ${error.message}`);
    if (!allowLocalArticleFallback) {
      throw error;
    }
    return [];
  }
};

const apiArticleRoutes = await fetchPublishedArticleRoutes();
const fetchLocalArticleRoutes = async () => {
  if (!allowLocalArticleFallback) return [];

  const [{ articlesData }, { wordpressMigratedArticlePaths }, { blogEditorialDefinitions }] = await Promise.all([
    import('../src/data/articlesData.js'),
    import('../src/data/wordpressMigratedArticles.js'),
    import('../src/seo/seoCatalog.js')
  ]);

  return [
    ...blogEditorialDefinitions.map((article) => article.path),
    ...articlesData
      .filter((article) => article?.sourceType !== 'wordpress')
      .map((article) => `/blog/${slugify(article.slug || article.title || '')}`),
    ...wordpressMigratedArticlePaths
  ];
};

const localArticleRoutes = await fetchLocalArticleRoutes();

const allRoutes = Array.from(
  new Set([
    ...fixedRoutes,
    ...reservedSeoStaticPaths,
    ...comparisonRoutes,
    ...bankRoutes,
    ...cardRoutes,
    ...apiArticleRoutes,
    ...localArticleRoutes,
    ...storyRoutes
  ])
).filter(isPublicSitemapRoute);

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

const sitemapIndexXml = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  '  <sitemap>',
  `    <loc>${siteUrl}/sitemap.xml</loc>`,
  `    <lastmod>${now}</lastmod>`,
  '  </sitemap>',
  '  <sitemap>',
  `    <loc>${siteUrl}/stories-sitemap.xml</loc>`,
  `    <lastmod>${now}</lastmod>`,
  '  </sitemap>',
  '</sitemapindex>'
].join('\n');

writeFileSync(sitemapIndexPath, sitemapIndexXml, 'utf8');

const robotsTxt = [
  'User-agent: Googlebot',
  'Allow: /',
  '',
  'User-agent: Mediapartners-Google',
  'Allow: /',
  '',
  'User-agent: *',
  'Allow: /',
  '',
  `Sitemap: ${siteUrl}/sitemap-index.xml`,
  `Sitemap: ${siteUrl}/sitemap.xml`,
  `Sitemap: ${siteUrl}/stories-sitemap.xml`
].join('\n');

writeFileSync(robotsPath, robotsTxt, 'utf8');

console.log(`Sitemap atualizado com ${allRoutes.length} rotas.`);
