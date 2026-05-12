import { getPrisma } from '../lib/prisma.js';

const PUBLIC_SITE_URL = 'https://www.cotejuros.com.br';

const normalizePublicUrl = (value = '') => {
  if (!value) return '';
  try {
    const url = new URL(value, PUBLIC_SITE_URL);
    if (url.hostname === 'cotejuros.com.br' || url.hostname === 'api.cotejuros.com.br') {
      url.protocol = 'https:';
      url.hostname = 'www.cotejuros.com.br';
    }
    return url.toString();
  } catch {
    return value;
  }
};

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
    coverImageAlt: structured.coverImageAlt || structured.imageAlt || '',
    imageAlt: structured.imageAlt || structured.coverImageAlt || '',
    imageAttribution: structured.imageAttribution || null,
    blogImageAutomation: structured.blogImageAutomation || null,
    readTime: article.readTime || structured.readTime || 0,
    wordCount: article.wordCount || structured.wordCount || 0,
    internalLinks: Array.isArray(structured.internalLinks) ? structured.internalLinks : [],
    externalLinks: Array.isArray(structured.externalLinks) ? structured.externalLinks : [],
    faq: Array.isArray(structured.faq) ? structured.faq : [],
    sections: Array.isArray(structured.sections) ? structured.sections : [],
    intro: Array.isArray(structured.intro) ? structured.intro : [],
    conclusion: Array.isArray(structured.conclusion) ? structured.conclusion : [],
    cta: structured.cta || null,
    routePath: structured.routePath || `/blog/${article.slug}`,
    canonicalUrl: normalizePublicUrl(structured.canonicalUrl || `${PUBLIC_SITE_URL}/blog/${article.slug}/`),
    clusterLabel: article.cluster?.name || structured.clusterLabel || ''
  };
};

const toSlug = (value = '') =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

const ensureBlogCategory = async (prisma, categoryName = 'Educacao financeira') => {
  const name = categoryName || 'Educacao financeira';
  return prisma.category.upsert({
    where: { slug: `blog-${toSlug(name)}` },
    update: {
      name,
      type: 'blog'
    },
    create: {
      slug: `blog-${toSlug(name)}`,
      name,
      type: 'blog'
    }
  });
};

const compileArticleContent = (structured = {}) =>
  [
    ...(structured.intro || []),
    ...((structured.sections || []).flatMap((section) => [
      section.heading,
      section.subheading,
      ...(section.paragraphs || []),
      ...(section.bullets || [])
    ])),
    ...((structured.faq || []).flatMap((item) => [item.question, item.answer])),
    ...(structured.conclusion || [])
  ].filter(Boolean).join('\n\n');

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

  static async createOrUpdateGeneratedArticle({
    article,
    status = 'draft',
    publishApproved = false,
    idempotencyKey = ''
  } = {}) {
    if (!article?.slug) throw new Error('Article slug is required');
    if (!article?.structuredContent) throw new Error('structuredContent is required');
    if (!article.coverImage || !article.ogImage) {
      throw new Error('coverImage and ogImage are required before saving generated article');
    }

    const prisma = getPrisma();
    const existing = idempotencyKey
      ? await prisma.article.findFirst({
          where: {
            structuredContent: {
              path: ['factoryIdempotencyKey'],
              equals: idempotencyKey
            }
          }
        })
      : null;
    const existingBySlug = existing || await prisma.article.findUnique({ where: { slug: article.slug } });

    if (existingBySlug && existingBySlug.status === 'published' && existingBySlug.structuredContent?.sourceType !== 'article-factory') {
      throw new Error(`Refusing to overwrite manually published article: ${existingBySlug.slug}`);
    }

    const finalStatus = publishApproved && status === 'published' ? 'published' : 'draft';
    const structuredContent = {
      ...article.structuredContent,
      factoryIdempotencyKey: idempotencyKey || article.structuredContent.factoryIdempotencyKey || '',
      sourceType: 'article-factory'
    };
    const category = await ensureBlogCategory(prisma, structuredContent.category || article.category);
    const wordCount = String(article.content || compileArticleContent(structuredContent)).split(/\s+/).filter(Boolean).length;
    const readTime = Math.max(1, Math.round(wordCount / 190));
    const data = {
      title: article.title,
      content: article.content || compileArticleContent(structuredContent),
      excerpt: article.excerpt || structuredContent.summary || '',
      categoryId: category.id,
      author: article.author || 'Equipe Cote Juros',
      seoTitle: article.metaTitle || article.seoTitle || article.title,
      seoDescription: article.metaDescription || article.seoDescription || article.excerpt || '',
      coverImage: article.coverImage,
      ogImage: article.ogImage,
      readTime,
      wordCount,
      structuredContent: {
        ...structuredContent,
        readTime,
        wordCount
      },
      status: finalStatus,
      publishedAt: finalStatus === 'published'
        ? (existingBySlug?.publishedAt || new Date())
        : null
    };

    const saved = existingBySlug
      ? await prisma.article.update({
          where: { id: existingBySlug.id },
          data,
          include: { category: true, cluster: true }
        })
      : await prisma.article.create({
          data: {
            ...data,
            slug: article.slug
          },
          include: { category: true, cluster: true }
        });

    return serializeArticle(saved);
  }
}



