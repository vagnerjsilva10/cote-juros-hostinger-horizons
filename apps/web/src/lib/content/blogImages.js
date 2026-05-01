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

const isRenderableImage = (value) => {
  if (typeof value !== 'string') return false;
  const image = value.trim();
  if (!image || ['undefined', 'null', 'false', 'nan'].includes(image.toLowerCase())) return false;

  return (
    image.startsWith('/') ||
    image.startsWith('./') ||
    image.startsWith('../') ||
    image.startsWith('http://') ||
    image.startsWith('https://')
  );
};

export const BLOG_CATEGORY_FALLBACKS = {
  emprestimos: '/assets/editorial/editorial-man-contract.png',
  cartoes: '/assets/editorial/editorial-credit-life.png',
  financiamento: '/assets/editorial/editorial-couple-phone.png',
  score: '/assets/editorial/editorial-glass-dashboard.png',
  dividas: '/assets/editorial/editorial-woman-desk.png',
  educacao: '/assets/editorial/editorial-woman-phone.png',
  default: '/assets/editorial/editorial-analyst-cutout.png'
};

const BLOG_CATEGORY_PHOTOS = {
  ...BLOG_CATEGORY_FALLBACKS
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
  return BLOG_CATEGORY_PHOTOS[getCategoryKey(article.category || article.clusterLabel)] || BLOG_CATEGORY_PHOTOS.default;
};

export const buildGeneratedArticleImage = (article = {}) => {
  return buildStockProviderImage(article);
};

export const resolveArticleImageSources = (article = {}) => {
  const slug = slugify(article.slug || article.title || article.id || 'artigo');
  const isPriorityArticle = Boolean(BLOG_PRIORITY_IMAGE_LIBRARY[slug]);
  const manifestImage = BLOG_ARTICLE_IMAGE_MANIFEST[slug];
  const structuredContent = article.structuredContent || {};
  const explicitImageCandidates = [
    article.coverImage,
    article.ogImage,
    article.image,
    article.thumbnail,
    structuredContent.coverImage,
    structuredContent.heroImage,
    article.imageUrl,
    article.featuredImage
  ]
    .filter(isRenderableImage)
    .filter(Boolean);
  const stockImage = buildStockProviderImage(article);
  const categoryFallback = getBlogCategoryImage(article.category || article.clusterLabel);
  const globalFallback = BLOG_CATEGORY_FALLBACKS.default;

  const safeExplicitImages = explicitImageCandidates.filter((image) => !String(image).startsWith('data:image/'));
  const ordered = isPriorityArticle
    ? [
        ...safeExplicitImages,
        manifestImage,
        categoryFallback,
        globalFallback
      ].filter(Boolean)
    : [
        ...safeExplicitImages,
        manifestImage,
        stockImage,
        categoryFallback,
        globalFallback
      ].filter(Boolean);

  const unique = ordered.filter((value, index) => ordered.indexOf(value) === index);

  return {
    primary: unique[0] || stockImage,
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
