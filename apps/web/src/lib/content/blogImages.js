import { BLOG_PRIORITY_IMAGE_LIBRARY, BLOG_PRIORITY_IMAGE_MANIFEST } from '@/data/blogEditorialOverrides.js';

const normalizeText = (value = '') =>
  String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

const slugify = (value = '') =>
  normalizeText(value)
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

const hashString = (value = '') => {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash;
};

const isRenderableImage = (value) => {
  if (typeof value !== 'string') return false;
  const image = value.trim();
  if (!image || ['undefined', 'null', 'false', 'nan'].includes(image.toLowerCase())) return false;

  return (
    image.startsWith('data:image/') ||
    image.startsWith('/') ||
    image.startsWith('./') ||
    image.startsWith('../') ||
    image.startsWith('http://') ||
    image.startsWith('https://')
  );
};

export const BLOG_CATEGORY_FALLBACKS = {
  emprestimos: '/assets/blog/fallbacks/category-emprestimos.svg',
  cartoes: '/assets/blog/fallbacks/category-cartoes.svg',
  financiamento: '/assets/blog/fallbacks/category-financiamento.svg',
  score: '/assets/blog/fallbacks/category-score.svg',
  dividas: '/assets/blog/fallbacks/category-dividas.svg',
  default: '/assets/blog/fallbacks/editorial-global.svg'
};

export const BLOG_ARTICLE_IMAGE_MANIFEST = {
  ...BLOG_PRIORITY_IMAGE_MANIFEST
};

const getCategoryKey = (category = '') => {
  const key = normalizeText(category);
  if (key.includes('emprest')) return 'emprestimos';
  if (key.includes('cart')) return 'cartoes';
  if (key.includes('financi')) return 'financiamento';
  if (key.includes('score')) return 'score';
  if (key.includes('educ') || key.includes('organiz')) return 'educacao';
  if (key.includes('divid') || key.includes('renegoci')) return 'dividas';
  return 'default';
};

export const getBlogCategoryImage = (category = '') => BLOG_CATEGORY_FALLBACKS[getCategoryKey(category)] || BLOG_CATEGORY_FALLBACKS.default;

const buildStockProviderImage = (article = {}) => {
  return buildGeneratedArticleImage(article);
};

const getImagePalette = (category = '') => {
  const key = getCategoryKey(category);
  if (key === 'emprestimos') return { primary: '#2563eb', soft: '#dbeafe', accent: '#0f172a', eyebrow: 'EMPRESTIMOS' };
  if (key === 'cartoes') return { primary: '#0f766e', soft: '#ccfbf1', accent: '#0f172a', eyebrow: 'CARTOES' };
  if (key === 'financiamento') return { primary: '#ea580c', soft: '#fed7aa', accent: '#7c2d12', eyebrow: 'FINANCIAMENTO' };
  if (key === 'score') return { primary: '#7c3aed', soft: '#ddd6fe', accent: '#3b0764', eyebrow: 'SCORE' };
  if (key === 'dividas') return { primary: '#dc2626', soft: '#fecaca', accent: '#450a0a', eyebrow: 'DIVIDAS' };
  return { primary: '#1d4ed8', soft: '#dbeafe', accent: '#0f172a', eyebrow: 'BLOG COTE JUROS' };
};

export const buildGeneratedArticleImage = (article = {}) => {
  const slug = slugify(article.slug || article.title || article.id || 'cote-juros');
  const title = String(article.title || article.h1 || 'Guia editorial Cote Juros').trim();
  const palette = getImagePalette(article.category || article.clusterLabel);
  const seed = hashString(slug);
  const bars = Array.from({ length: 5 }, (_, index) => 52 + ((seed >> (index * 3)) % 86));
  const headline = title.length > 52 ? `${title.slice(0, 49)}...` : title;

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="720" viewBox="0 0 1200 720" role="img" aria-label="${headline}">
      <rect width="1200" height="720" fill="#ffffff" />
      <rect width="1200" height="720" fill="${palette.soft}" opacity="0.5" />
      <rect x="56" y="56" width="1088" height="608" rx="34" fill="#ffffff" fill-opacity="0.88" />
      <rect x="92" y="96" width="220" height="40" rx="20" fill="${palette.soft}" />
      <text x="122" y="122" fill="${palette.primary}" font-family="Arial, sans-serif" font-size="22" font-weight="700">${palette.eyebrow}</text>
      <text x="92" y="216" fill="${palette.accent}" font-family="Arial, sans-serif" font-size="56" font-weight="700">${headline}</text>
      <text x="92" y="274" fill="#475569" font-family="Arial, sans-serif" font-size="28">${String(article.category || 'Conteudo editorial').slice(0, 42)}</text>
      <rect x="740" y="158" width="302" height="236" rx="28" fill="#ffffff" />
      <path d="M786 314C834 284 874 280 916 238C948 208 992 186 1020 176" fill="none" stroke="${palette.primary}" stroke-width="10" stroke-linecap="round" />
      ${bars
        .map(
          (height, index) =>
            `<rect x="${792 + index * 46}" y="${326 - height}" width="24" height="${height}" rx="12" fill="${palette.primary}" opacity="${0.24 + index * 0.12}" />`
        )
        .join('')}
      <rect x="92" y="550" width="326" height="16" rx="8" fill="${palette.soft}" />
      <rect x="92" y="582" width="374" height="16" rx="8" fill="#e2e8f0" />
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};

export const resolveArticleImageSources = (article = {}) => {
  const slug = slugify(article.slug || article.title || article.id || 'artigo');
  const isPriorityArticle = Boolean(BLOG_PRIORITY_IMAGE_LIBRARY[slug]);
  const manifestImage = BLOG_ARTICLE_IMAGE_MANIFEST[slug];
  const explicitImageCandidates = [article.coverImage, article.image, article.imageUrl, article.featuredImage]
    .filter(isRenderableImage)
    .filter((image) => !String(image).includes('images.unsplash.com'));
  const stockImage = buildStockProviderImage(article);
  const categoryFallback = getBlogCategoryImage(article.category || article.clusterLabel);
  const globalFallback = BLOG_CATEGORY_FALLBACKS.default;
  const generatedFallback = buildGeneratedArticleImage(article);

  const ordered = isPriorityArticle
    ? [
        manifestImage,
        ...explicitImageCandidates.filter((image) => !String(image).startsWith('data:image/')),
        categoryFallback,
        globalFallback
      ].filter(Boolean)
    : [
        manifestImage,
        ...explicitImageCandidates.filter((image) => !String(image).startsWith('data:image/')),
        stockImage,
        categoryFallback,
        globalFallback,
        generatedFallback
      ].filter(Boolean);

  const unique = ordered.filter((value, index) => ordered.indexOf(value) === index);

  return {
    primary: unique[0] || generatedFallback,
    fallbacks: unique.slice(1)
  };
};

export const resolveArticleImageAlt = (article = {}) => {
  const explicitAlt =
    typeof article.coverImageAlt === 'string'
      ? article.coverImageAlt.trim()
      : typeof article.imageAlt === 'string'
        ? article.imageAlt.trim()
        : '';

  return explicitAlt || `Imagem editorial sobre ${String(article.title || article.h1 || 'Cote Juros').trim()}`;
};
