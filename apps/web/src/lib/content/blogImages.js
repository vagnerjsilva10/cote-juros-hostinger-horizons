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
  emprestimos: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1200&q=80',
  cartoes: 'https://images.unsplash.com/photo-1556740749-887f6717d7e4?auto=format&fit=crop&w=1200&q=80',
  financiamento: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=1200&q=80',
  score: 'https://images.unsplash.com/photo-1554224154-26032ffc0d07?auto=format&fit=crop&w=1200&q=80',
  dividas: 'https://images.unsplash.com/photo-1556745757-8d76bdb6984b?auto=format&fit=crop&w=1200&q=80',
  educacao: 'https://images.unsplash.com/photo-1573497491208-6b1acb260507?auto=format&fit=crop&w=1200&q=80',
  default: 'https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=1200&q=80'
};

const BLOG_CATEGORY_PHOTOS = {
  emprestimos: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1200&q=80',
  cartoes: 'https://images.unsplash.com/photo-1556740749-887f6717d7e4?auto=format&fit=crop&w=1200&q=80',
  financiamento: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=1200&q=80',
  score: 'https://images.unsplash.com/photo-1554224154-26032ffc0d07?auto=format&fit=crop&w=1200&q=80',
  dividas: 'https://images.unsplash.com/photo-1556745757-8d76bdb6984b?auto=format&fit=crop&w=1200&q=80',
  educacao: 'https://images.unsplash.com/photo-1573497491208-6b1acb260507?auto=format&fit=crop&w=1200&q=80',
  default: 'https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=1200&q=80'
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
  const explicitImageCandidates = [article.coverImage, article.image, article.imageUrl, article.featuredImage]
    .filter(isRenderableImage)
    .filter(Boolean);
  const stockImage = buildStockProviderImage(article);
  const categoryFallback = getBlogCategoryImage(article.category || article.clusterLabel);
  const globalFallback = BLOG_CATEGORY_FALLBACKS.default;

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
