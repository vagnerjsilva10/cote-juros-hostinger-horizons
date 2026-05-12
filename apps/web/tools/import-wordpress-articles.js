import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '../../..');
const wordpressPostsPath = resolve(repoRoot, 'wp-posts-all.json');
const searchConsoleDir = resolve(repoRoot, 'tmp-search-console');

const outputModulePath = resolve(__dirname, '../src/data/wordpressMigratedArticles.js');
const inventoryPath = resolve(__dirname, '../content/migrations/wordpress/inventory.json');
const redirectsJsonPath = resolve(__dirname, '../public/content/migrations/wordpress-redirects.json');
const redirectsTxtPath = resolve(__dirname, '../public/wordpress-redirects.txt');

const SITE_URL = 'https://www.cotejuros.com.br';
const WORDPRESS_URL = 'https://wordpress.cotejuros.com.br';
const TITLE_SUFFIX = ' | Cote Juros';
const CATEGORY_IMAGE_FALLBACKS = {
  emprestimo: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1600&q=80',
  cartao: 'https://images.unsplash.com/photo-1556742502-ec7c0e9f34b1?auto=format&fit=crop&w=1600&q=80',
  financiamento: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1600&q=80',
  veiculo: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1600&q=80',
  juros: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1600&q=80',
  pix: 'https://images.unsplash.com/photo-1556740749-887f6717d7e4?auto=format&fit=crop&w=1600&q=80',
  default: 'https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=1600&q=80'
};

const slugify = (value = '') =>
  String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s/-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/\/+/g, '/')
    .replace(/^-|-$/g, '');

const normalizePath = (value = '') => {
  const clean = String(value || '').trim();
  if (!clean) return '';
  return `/${clean.replace(/^\/+|\/+$/g, '')}`;
};

const decodeEntities = (value = '') =>
  String(value)
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)))
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#039;/g, "'")
    .replace(/&rsquo;/gi, "'")
    .replace(/&lsquo;/gi, "'")
    .replace(/&rdquo;/gi, '"')
    .replace(/&ldquo;/gi, '"')
    .replace(/&ndash;/gi, '-')
    .replace(/&mdash;/gi, ' - ')
    .replace(/&hellip;/gi, '...')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>');

const stripTags = (value = '') =>
  decodeEntities(String(value || ''))
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+\n/g, '\n')
    .replace(/\n\s+/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

const sanitizeText = (value = '') => stripTags(value).replace(/\s+/g, ' ').trim();

const escapeJs = (value) => JSON.stringify(value, null, 2);

const ensureDir = (filePath) => mkdirSync(dirname(filePath), { recursive: true });

const readSearchConsoleRows = () => {
  const pagesFile = readdirSync(searchConsoleDir).find((name) => slugify(name) === 'paginascsv');
  if (!pagesFile) return new Map();

  const raw = readFileSync(resolve(searchConsoleDir, pagesFile), 'utf8').trim();
  const lines = raw.split(/\r?\n/).filter(Boolean);
  const entries = new Map();

  lines.slice(1).forEach((line) => {
    const [page, clicks = '0', impressions = '0', ctr = '0%', position = '0'] = line.split(',');
    const url = String(page || '').trim();
    if (!url.startsWith(`${SITE_URL}/`)) return;

    const urlObject = new URL(url);
    const path = normalizePath(urlObject.pathname);
    if (!path || path === '/') return;

    entries.set(path, {
      url,
      path,
      clicks: Number(String(clicks).replace(',', '.')) || 0,
      impressions: Number(String(impressions).replace(',', '.')) || 0,
      ctr: String(ctr || '0%').trim(),
      position: Number(String(position).replace(',', '.')) || 0
    });
  });

  return entries;
};

const inferPriority = (impressions = 0) => {
  if (impressions >= 50) return 'alta';
  if (impressions >= 5) return 'media';
  return 'baixa';
};

const getFeaturedMedia = (post) => post?._embedded?.['wp:featuredmedia']?.[0] || null;
const getTerms = (post, index) => post?._embedded?.['wp:term']?.[index] || [];

const getFeaturedImage = (post) => {
  const media = getFeaturedMedia(post);
  const sizes = media?.media_details?.sizes || {};

  return (
    sizes.large?.source_url ||
    sizes.medium_large?.source_url ||
    sizes.full?.source_url ||
    media?.source_url ||
    ''
  );
};

const getFeaturedImageAlt = (post) => {
  const media = getFeaturedMedia(post);
  return sanitizeText(media?.alt_text || media?.caption?.rendered || media?.title?.rendered || '');
};

const resolveFallbackImage = ({ slug = '', title = '', category = '', tags = [] }) => {
  const haystack = slugify([slug, title, category, ...(Array.isArray(tags) ? tags : [])].join(' '));
  if (haystack.includes('cartao')) return CATEGORY_IMAGE_FALLBACKS.cartao;
  if (haystack.includes('emprest')) return CATEGORY_IMAGE_FALLBACKS.emprestimo;
  if (haystack.includes('financi')) return CATEGORY_IMAGE_FALLBACKS.financiamento;
  if (haystack.includes('veiculo') || haystack.includes('carro')) return CATEGORY_IMAGE_FALLBACKS.veiculo;
  if (haystack.includes('pix')) return CATEGORY_IMAGE_FALLBACKS.pix;
  if (haystack.includes('juro')) return CATEGORY_IMAGE_FALLBACKS.juros;
  return CATEGORY_IMAGE_FALLBACKS.default;
};

const cleanWordpressHtml = (html = '') =>
  String(html || '')
    .replace(/<div id="ez-toc-container"[\s\S]*?<\/nav>\s*<\/div>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\s(on\w+|style|class|id|data-[\w-]+|target|rel)="[^"]*"/gi, '')
    .replace(/\s(on\w+|style|class|id|data-[\w-]+|target|rel)='[^']*'/gi, '')
    .replace(/<div[^>]*>\s*<\/div>/gi, '');

const extractInternalLinks = (html = '') => {
  const links = [];
  const regex = /<a[^>]+href=(?:"([^"]+)"|'([^']+)')[^>]*>([\s\S]*?)<\/a>/gi;

  let match;
  while ((match = regex.exec(html))) {
    const href = match[1] || match[2] || '';
    const label = sanitizeText(match[3] || '');
    if (!href) continue;

    try {
      const absolute = href.startsWith('http') ? href : `${WORDPRESS_URL}${normalizePath(href)}`;
      const url = new URL(absolute);
      const sameHost = [WORDPRESS_URL, SITE_URL].some((origin) => url.href.startsWith(origin));
      if (!sameHost) continue;

      const path = normalizePath(url.pathname);
      if (!path || path === '/') continue;

      links.push({
        path,
        title: label || path.replace(/\//g, ' ').trim(),
        anchor: label || `Explore ${path.replace(/^\/+/, '').replace(/-/g, ' ')}`
      });
    } catch {
      // ignore malformed urls
    }
  }

  return links.filter((item, index, list) => list.findIndex((entry) => entry.path === item.path) === index).slice(0, 8);
};

const htmlToSections = (html = '', fallbackTitle = '') => {
  const cleaned = cleanWordpressHtml(html);
  const blockRegex = /<(h2|h3|h4|p|ul|ol|table)[^>]*>([\s\S]*?)<\/\1>/gi;

  const intro = [];
  const sections = [];
  const headings = [];
  let currentSection = null;

  const ensureSection = (heading) => {
    const safeHeading = sanitizeText(heading || fallbackTitle || 'Guia prático');
    currentSection = {
      heading: safeHeading,
      paragraphs: [],
      bullets: []
    };
    sections.push(currentSection);
    headings.push(safeHeading);
  };

  let match;
  while ((match = blockRegex.exec(cleaned))) {
    const tag = match[1].toLowerCase();
    const block = match[2] || '';

    if (tag.startsWith('h')) {
      ensureSection(block);
      continue;
    }

    if (tag === 'p') {
      const text = sanitizeText(block);
      if (!text) continue;

      if (!currentSection) intro.push(text);
      else currentSection.paragraphs.push(text);
      continue;
    }

    if (tag === 'ul' || tag === 'ol') {
      const items = Array.from(block.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)).map((item) => sanitizeText(item[1] || ''));
      const sanitizedItems = items.filter(Boolean);
      if (!sanitizedItems.length) continue;

      if (!currentSection) {
        ensureSection(fallbackTitle || 'Pontos principais');
      }

      currentSection.bullets.push(...sanitizedItems);
      continue;
    }

    if (tag === 'table') {
      const rows = Array.from(block.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)).map((row) =>
        Array.from((row[1] || '').matchAll(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/gi))
          .map((cell) => sanitizeText(cell[1] || ''))
          .filter(Boolean)
          .join(' | ')
      ).filter(Boolean);

      if (!rows.length) continue;
      if (!currentSection) ensureSection(fallbackTitle || 'Tabela');
      currentSection.bullets.push(...rows);
    }
  }

  if (!sections.length) {
    ensureSection(fallbackTitle || 'Visão geral');
    currentSection.paragraphs.push(...intro.splice(0));
  }

  const filteredSections = sections
    .map((section) => ({
      heading: section.heading,
      paragraphs: section.paragraphs.filter(Boolean),
      bullets: section.bullets.filter(Boolean)
    }))
    .filter((section) => section.heading || section.paragraphs.length || section.bullets.length);

  const introParagraphs = intro.filter(Boolean).slice(0, 3);
  const tailSection = filteredSections[filteredSections.length - 1];
  const conclusion = tailSection?.paragraphs?.slice(-2) || [];

  return {
    intro: introParagraphs,
    sections: filteredSections,
    conclusion,
    headings
  };
};

const buildMetaDescription = (excerpt, intro, title) => {
  const base = sanitizeText(excerpt || intro?.[0] || title);
  if (!base) return `Guia da Cote Juros sobre ${title}.`;
  return base.length > 160 ? `${base.slice(0, 157).trim()}...` : base;
};

const estimateReadTime = (chunks) => {
  const text = chunks.filter(Boolean).join(' ');
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(4, Math.round(words / 190) || 4);
};

const buildArticleRecord = (post, metrics) => {
  const title = sanitizeText(post?.title?.rendered || post?.slug || 'Artigo Cote Juros');
  const slug = slugify(post?.slug || title);
  const routePath = `/${slug}`;
  const category = sanitizeText(getTerms(post, 0)?.[0]?.name || 'Conteúdo editorial');
  const tags = getTerms(post, 1).map((tag) => sanitizeText(tag?.name || '')).filter(Boolean);
  const { intro, sections, conclusion, headings } = htmlToSections(post?.content?.rendered || '', title);
  const excerpt = sanitizeText(post?.excerpt?.rendered || '');
  const contentChunks = [
    ...intro,
    ...sections.flatMap((section) => [section.heading, ...section.paragraphs, ...section.bullets]),
    ...conclusion
  ];
  const metaDescription = buildMetaDescription(excerpt, intro, title);
  const image = getFeaturedImage(post) || resolveFallbackImage({ slug, title, category, tags });
  const imageAlt = getFeaturedImageAlt(post) || `Imagem de capa do artigo ${title}`;
  const author = sanitizeText(post?._embedded?.author?.[0]?.name || 'Equipe Cote Juros');
  const canonicalUrl = `${SITE_URL}${routePath}/`;

  return {
    id: `wp-${post.id}`,
    sourceType: 'wordpress',
    wordpressPostId: post.id,
    slug,
    title,
    h1: title,
    routePath,
    canonicalUrl,
    legacyUrl: `${WORDPRESS_URL}/${slug}/`,
    category,
    tags,
    author,
    excerpt: excerpt || metaDescription,
    summary: excerpt || metaDescription,
    metaTitle: title,
    seoTitle: `${title}${TITLE_SUFFIX}`,
    metaDescription,
    publishedAt: new Date(post.date_gmt || post.date).toISOString(),
    updatedAt: new Date(post.modified_gmt || post.modified || post.date_gmt || post.date).toISOString(),
    readingTime: estimateReadTime(contentChunks),
    readTime: estimateReadTime(contentChunks),
    intro,
    sections,
    conclusion,
    faq: [],
    internalLinks: extractInternalLinks(post?.content?.rendered || '')
      .filter((item) => item.path !== routePath),
    content: contentChunks.join('\n\n'),
    coverImage: image,
    image,
    coverImageAlt: imageAlt,
    imageAlt,
    status: 'published',
    searchConsole: {
      clicks: metrics?.clicks || 0,
      impressions: metrics?.impressions || 0,
      ctr: metrics?.ctr || '0%',
      position: metrics?.position || 0,
      priority: inferPriority(metrics?.impressions || 0)
    }
  };
};

const buildInventoryRecord = (article, post) => ({
  title: article.title,
  slug: article.slug,
  url: article.routePath,
  legacyUrl: article.legacyUrl,
  category: article.category,
  tags: article.tags,
  metaTitle: article.metaTitle,
  metaDescription: article.metaDescription,
  image: article.image,
  imageAlt: article.imageAlt,
  publishedAt: article.publishedAt,
  updatedAt: article.updatedAt,
  author: article.author,
  headings: article.sections.map((section) => section.heading),
  clicks: article.searchConsole.clicks,
  impressions: article.searchConsole.impressions,
  ctr: article.searchConsole.ctr,
  position: article.searchConsole.position,
  priority: article.searchConsole.priority,
  wordpressPostId: post.id
});

const main = () => {
  const posts = JSON.parse(readFileSync(wordpressPostsPath, 'utf8'));
  const metricsMap = readSearchConsoleRows();
  const imported = posts
    .filter((post) => post?.status === 'publish' && post?.slug)
    .map((post) => {
      const routePath = `/${slugify(post.slug)}`;
      const metrics = metricsMap.get(routePath);
      return buildArticleRecord(post, metrics);
    })
    .sort((a, b) => {
      if (b.searchConsole.impressions !== a.searchConsole.impressions) {
        return b.searchConsole.impressions - a.searchConsole.impressions;
      }
      return new Date(b.publishedAt) - new Date(a.publishedAt);
    });

  const inventory = imported.map((article) => {
    const post = posts.find((entry) => Number(entry.id) === Number(article.wordpressPostId));
    return buildInventoryRecord(article, post);
  });

  const redirects = imported.map((article) => ({
    from: article.legacyUrl,
    to: `${SITE_URL}${article.routePath}`,
    status: 301
  }));

  const moduleSource = [
    '// This file is generated by apps/web/tools/import-wordpress-articles.js',
    `export const wordpressMigratedArticles = ${escapeJs(imported)};`,
    'export const wordpressMigratedArticlePaths = wordpressMigratedArticles.map((article) => article.routePath);',
    'export const wordpressMigratedArticleSlugs = wordpressMigratedArticles.map((article) => article.slug);'
  ].join('\n\n');

  ensureDir(outputModulePath);
  writeFileSync(outputModulePath, `${moduleSource}\n`, 'utf8');

  ensureDir(inventoryPath);
  writeFileSync(inventoryPath, `${JSON.stringify(inventory, null, 2)}\n`, 'utf8');

  ensureDir(redirectsJsonPath);
  writeFileSync(redirectsJsonPath, `${JSON.stringify(redirects, null, 2)}\n`, 'utf8');

  ensureDir(redirectsTxtPath);
  writeFileSync(
    redirectsTxtPath,
    `${redirects.map((item) => `${item.from} -> ${item.to}`).join('\n')}\n`,
    'utf8'
  );

  console.log(`Migrated ${imported.length} WordPress articles.`);
};

main();
