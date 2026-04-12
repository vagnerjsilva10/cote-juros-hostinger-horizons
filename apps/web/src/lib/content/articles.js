export const normalizeArticleSlug = (article = {}) =>
  String(article.slug || article.title || article.id || 'artigo')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

export const getArticleSummary = (article = {}) =>
  article.summary || article.metaDescription || article.excerpt || '';

export const getArticleImage = (article = {}, fallbackImage = '') => article.image || fallbackImage;

export const getArticleParagraphs = (article = {}) => {
  if (Array.isArray(article.intro) && article.intro.length) return article.intro;
  if (typeof article.content === 'string') {
    return article.content
      .split(/\n+/)
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
};
