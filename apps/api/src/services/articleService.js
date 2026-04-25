import { getPrisma } from '../lib/prisma.js';

const parseStructuredContent = (article) => {
  if (article?.structuredContent && typeof article.structuredContent === 'object') {
    return article.structuredContent;
  }

  try {
    const parsed = JSON.parse(article?.content || '');
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
};

const serializeArticle = (article) => {
  const structured = parseStructuredContent(article);

  return {
    ...structured,
    id: article.id,
    slug: article.slug,
    title: article.title,
    h1: structured.h1 || article.title,
    content: article.content,
    excerpt: article.excerpt || structured.summary || '',
    summary: article.excerpt || structured.summary || '',
    category: article.category?.name || structured.category || '',
    categorySlug: article.category?.slug || '',
    author: article.author || 'Equipe Cote Juros',
    seoTitle: article.seoTitle || structured.metaTitle || article.title,
    metaTitle: article.seoTitle || structured.metaTitle || article.title,
    seoDescription: article.seoDescription || structured.metaDescription || article.excerpt || '',
    metaDescription: article.seoDescription || structured.metaDescription || article.excerpt || '',
    publishDate: article.publishedAt || article.createdAt,
    publishedAt: article.publishedAt || article.createdAt,
    updatedAt: article.updatedAt,
    status: article.status,
    coverImage: article.coverImage || structured.coverImage || '',
    image: article.ogImage || structured.ogImage || article.coverImage || structured.coverImage || '',
    ogImage: article.ogImage || structured.ogImage || '',
    imageAttribution: structured.imageAttribution || null,
    blogImageAutomation: structured.blogImageAutomation || null,
    readTime: article.readTime || structured.readTime || 6,
    wordCount: article.wordCount || structured.wordCount || 0,
    internalLinks: Array.isArray(structured.internalLinks) ? structured.internalLinks : [],
    externalLinks: Array.isArray(structured.externalLinks) ? structured.externalLinks : [],
    faq: Array.isArray(structured.faq) ? structured.faq : [],
    sections: Array.isArray(structured.sections) ? structured.sections : [],
    intro: Array.isArray(structured.intro) ? structured.intro : [],
    conclusion: Array.isArray(structured.conclusion) ? structured.conclusion : [],
    cta: structured.cta || null,
    routePath: structured.routePath || `/blog/${article.slug}`,
    canonicalUrl: structured.canonicalUrl || `https://www.cotejuros.com.br/blog/${article.slug}/`,
    clusterLabel: article.cluster?.name || structured.clusterLabel || ''
  };
};

export class ArticleService {
  static async list({ category, status = 'published', limit = 100 } = {}) {
    const where = { status };

    if (category) {
      where.OR = [
        { category: { slug: category } },
        { category: { name: category } }
      ];
    }

    return getPrisma().article.findMany({
      where,
      include: { category: true, cluster: true },
      orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
      take: Number(limit)
    }).then((items) => items.map(serializeArticle));
  }

  static async getBySlug(slug) {
    return getPrisma().article.findFirst({
      where: { slug, status: 'published' },
      include: { category: true, cluster: true }
    }).then((item) => (item ? serializeArticle(item) : null));
  }

  static async listByCategory(category) {
    return this.list({ category });
  }
}



