import { ArticleService } from './articleService.js';
import { PUBLIC_SITE_URL } from './editorialConfig.js';

const ADSENSE_CLIENT_ID = 'ca-pub-2873725911890738';
const DEFAULT_SHELL = `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body>
  <div id="root"></div>
</body>
</html>`;

let cachedShell = null;
let cachedShellAt = 0;

const escapeHtml = (value = '') =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const stripTags = (value = '') => String(value || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

const normalizePublicUrl = (value = '') => {
  if (!value) return '';
  try {
    const url = new URL(value, PUBLIC_SITE_URL);
    if (url.hostname === 'cotejuros.com.br' || url.hostname === 'api.cotejuros.com.br') {
      url.protocol = 'https:';
      url.hostname = 'www.cotejuros.com.br';
    }
    if (url.hostname !== 'www.cotejuros.com.br' && url.hostname.endsWith('.cotejuros.com.br')) {
      return value;
    }
    return url.toString();
  } catch {
    return value;
  }
};

const getCanonicalUrl = (article) =>
  `${PUBLIC_SITE_URL}/blog/${article.slug}/`;

const getSummary = (article) =>
  stripTags(article.metaDescription || article.seoDescription || article.summary || article.excerpt || '');

const getImage = (article) =>
  normalizePublicUrl(article.ogImage || article.image || article.coverImage || `${PUBLIC_SITE_URL}/brand/cote-juros-logo.svg`);

const getParagraphs = (article) => {
  const intro = Array.isArray(article.intro) ? article.intro : [];
  if (intro.length) return intro.map(stripTags).filter(Boolean);
  const content = stripTags(article.content || '');
  if (!content) return [];
  return content.split(/\n{2,}/).map(stripTags).filter(Boolean).slice(0, 3);
};

const renderJsonLd = (payload) =>
  `<script type="application/ld+json">${JSON.stringify(payload).replace(/</g, '\\u003c')}</script>`;

const fetchShellHtml = async () => {
  const now = Date.now();
  if (cachedShell && now - cachedShellAt < 5 * 60 * 1000) return cachedShell;

  try {
    const response = await fetch(`${PUBLIC_SITE_URL}/`, {
      headers: { 'User-Agent': 'CoteJurosSeoSnapshot/1.0' }
    });
    if (!response.ok) throw new Error(`shell ${response.status}`);
    const html = await response.text();
    cachedShell = html || DEFAULT_SHELL;
    cachedShellAt = now;
    return cachedShell;
  } catch {
    cachedShell = DEFAULT_SHELL;
    cachedShellAt = now;
    return cachedShell;
  }
};

const buildArticleSchema = ({ article, canonicalUrl, imageUrl }) => ({
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: article.metaTitle || article.seoTitle || article.title,
  description: getSummary(article),
  image: [imageUrl],
  datePublished: article.publishedAt || article.publishDate,
  dateModified: article.updatedAt || article.publishedAt || article.publishDate,
  mainEntityOfPage: canonicalUrl,
  author: {
    '@type': 'Person',
    name: article.author || 'Equipe Cote Juros'
  },
  publisher: {
    '@type': 'Organization',
    name: 'Cote Juros',
    logo: {
      '@type': 'ImageObject',
      url: `${PUBLIC_SITE_URL}/brand/cote-juros-logo.svg`
    }
  },
  articleSection: article.category || 'Educação financeira',
  keywords: Array.isArray(article.tags) ? article.tags.join(', ') : ''
});

const buildBreadcrumbSchema = ({ article, canonicalUrl }) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Início', item: `${PUBLIC_SITE_URL}/` },
    { '@type': 'ListItem', position: 2, name: 'Blog', item: `${PUBLIC_SITE_URL}/blog` },
    { '@type': 'ListItem', position: 3, name: article.title, item: canonicalUrl }
  ]
});

const buildFaqSchema = (article) => {
  const faq = Array.isArray(article.faq) ? article.faq.filter((item) => item?.question && item?.answer) : [];
  if (!faq.length) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map((item) => ({
      '@type': 'Question',
      name: stripTags(item.question),
      acceptedAnswer: {
        '@type': 'Answer',
        text: stripTags(item.answer)
      }
    }))
  };
};

const buildHead = ({ article, canonicalUrl, imageUrl }) => {
  const title = article.metaTitle || article.seoTitle || `${article.title} | Blog Cote Juros`;
  const description = getSummary(article);
  const jsonLd = [
    buildArticleSchema({ article, canonicalUrl, imageUrl }),
    buildBreadcrumbSchema({ article, canonicalUrl }),
    buildFaqSchema(article)
  ].filter(Boolean);

  return [
    `<title>${escapeHtml(title)}</title>`,
    `<meta name="description" content="${escapeHtml(description)}">`,
    '<meta name="robots" content="index,follow,max-image-preview:large">',
    `<link rel="canonical" href="${escapeHtml(canonicalUrl)}">`,
    '<meta property="og:type" content="article">',
    `<meta property="og:title" content="${escapeHtml(title)}">`,
    `<meta property="og:description" content="${escapeHtml(description)}">`,
    `<meta property="og:url" content="${escapeHtml(canonicalUrl)}">`,
    `<meta property="og:image" content="${escapeHtml(imageUrl)}">`,
    `<meta property="article:published_time" content="${escapeHtml(article.publishedAt || article.publishDate || '')}">`,
    `<meta property="article:modified_time" content="${escapeHtml(article.updatedAt || article.publishedAt || '')}">`,
    '<meta name="twitter:card" content="summary_large_image">',
    `<meta name="twitter:title" content="${escapeHtml(title)}">`,
    `<meta name="twitter:description" content="${escapeHtml(description)}">`,
    `<meta name="twitter:image" content="${escapeHtml(imageUrl)}">`,
    `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT_ID}" crossorigin="anonymous" data-cj-adsense="true"></script>`,
    ...jsonLd.map(renderJsonLd)
  ].join('\n');
};

const renderSection = (section = {}, index = 0) => {
  const paragraphs = Array.isArray(section.paragraphs) ? section.paragraphs : [];
  const bullets = Array.isArray(section.bullets) ? section.bullets : [];
  return `<section id="secao-${index + 1}">
    ${section.heading ? `<h2>${escapeHtml(stripTags(section.heading))}</h2>` : ''}
    ${paragraphs.map((paragraph) => `<p>${escapeHtml(stripTags(paragraph))}</p>`).join('\n')}
    ${bullets.length ? `<ul>${bullets.map((bullet) => `<li>${escapeHtml(stripTags(bullet))}</li>`).join('')}</ul>` : ''}
  </section>`;
};

const renderArticleSnapshot = ({ article, canonicalUrl, imageUrl }) => {
  const intro = getParagraphs(article);
  const sections = Array.isArray(article.sections) ? article.sections : [];
  const faq = Array.isArray(article.faq) ? article.faq.filter((item) => item?.question && item?.answer) : [];
  const conclusion = Array.isArray(article.conclusion) ? article.conclusion : [];

  return `<main class="cj-seo-snapshot" data-seo-snapshot="article">
    <article>
      <header>
        <p>${escapeHtml(article.category || 'Blog Cote Juros')}</p>
        <h1>${escapeHtml(article.h1 || article.title)}</h1>
        <p>${escapeHtml(getSummary(article))}</p>
        <p>Atualizado em ${escapeHtml(article.updatedAt || article.publishedAt || article.publishDate || '')}</p>
        ${imageUrl ? `<img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(article.imageAlt || article.coverImageAlt || article.title)}" width="1200" height="630">` : ''}
      </header>
      ${intro.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join('\n')}
      ${sections.map(renderSection).join('\n')}
      ${conclusion.length ? `<section id="conclusao"><h2>Conclusão</h2>${conclusion.map((paragraph) => `<p>${escapeHtml(stripTags(paragraph))}</p>`).join('')}</section>` : ''}
      ${faq.length ? `<section id="faq"><h2>Perguntas frequentes</h2>${faq.map((item) => `<h3>${escapeHtml(stripTags(item.question))}</h3><p>${escapeHtml(stripTags(item.answer))}</p>`).join('')}</section>` : ''}
      <footer>
        <a href="${escapeHtml(canonicalUrl)}">Ler artigo na Cote Juros</a>
      </footer>
    </article>
  </main>`;
};

const stripExistingSeoHead = (html = '') =>
  html
    .replace(/<title>[\s\S]*?<\/title>/i, '')
    .replace(/<meta\s+name=["']description["'][^>]*>/gi, '')
    .replace(/<meta\s+name=["']robots["'][^>]*>/gi, '')
    .replace(/<link\s+rel=["']canonical["'][^>]*>/gi, '')
    .replace(/<meta\s+property=["']og:[^"']+["'][^>]*>/gi, '')
    .replace(/<meta\s+property=["']article:[^"']+["'][^>]*>/gi, '')
    .replace(/<meta\s+name=["']twitter:[^"']+["'][^>]*>/gi, '')
    .replace(/<script[^>]+pagead2\.googlesyndication\.com\/pagead\/js\/adsbygoogle\.js[^>]*><\/script>/gi, '')
    .replace(/<script\s+type=["']application\/ld\+json["']>[\s\S]*?<\/script>/gi, '');

export class ArticleSeoHtmlService {
  static async render(slug) {
    const article = await ArticleService.getBySlug(slug);
    if (!article) return null;

    const canonicalUrl = getCanonicalUrl(article);
    const imageUrl = getImage(article);
    const shell = stripExistingSeoHead(await fetchShellHtml());
    const head = buildHead({ article, canonicalUrl, imageUrl });
    const snapshot = renderArticleSnapshot({ article, canonicalUrl, imageUrl });

    return shell
      .replace('</head>', `${head}\n</head>`)
      .replace(/<div\s+id=["']root["']\s*><\/div>/i, `<div id="root">${snapshot}</div>`);
  }
}
