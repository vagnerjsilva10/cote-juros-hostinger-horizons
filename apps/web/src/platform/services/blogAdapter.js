import { portalApi } from '@/platform/services/portalApi.js';
import {
  getArticleImage,
  getArticleSummary,
  getEditorialTitle,
  normalizeArticleData,
  resolveArticleBySlug
} from '@/lib/content/articles.js';

const toPlatformArticle = (article = {}) => {
  const normalized = normalizeArticleData(article);
  const routePath = `/blog/${normalized.slug}`;
  const canonicalUrl = `https://www.cotejuros.com.br${routePath}`;

  return {
    ...normalized,
    title: getEditorialTitle(normalized),
    summary: getArticleSummary(normalized),
    excerpt: getArticleSummary(normalized),
    coverImage: getArticleImage(normalized),
    image: getArticleImage(normalized),
    routePath,
    canonicalUrl
  };
};

export const getBlogArticles = async (filters = {}) => {
  const articles = await portalApi.getArticles({ sort: 'recent', ...filters });
  return (Array.isArray(articles) ? articles : [])
    .map(toPlatformArticle)
    .filter((article) => article.status === 'published' || !article.status);
};

export const getBlogArticleBySlug = async (slug = '') => {
  const [articles, directArticle] = await Promise.all([
    getBlogArticles({ sort: 'recent' }),
    portalApi.getArticleBySlug(slug)
  ]);

  const resolved = resolveArticleBySlug({
    slug,
    directArticle: directArticle ? toPlatformArticle(directArticle) : null,
    articles
  });

  return resolved ? toPlatformArticle(resolved) : null;
};

export const blogAdapter = {
  getBlogArticles,
  getBlogArticleBySlug
};
