import { getPrisma } from '../lib/prisma.js';

const slugify = (value = '') =>
  String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

const normalizeSearch = (value = '') => String(value).trim();

export class ArticleService {
  static async list({ category, status = 'published', limit = 100, search } = {}) {
    const where = {};

    if (status && status !== 'all') {
      where.status = status;
    }

    if (category) {
      where.OR = [
        { category: { slug: category } },
        { category: { name: category } }
      ];
    }

    if (search) {
      const query = normalizeSearch(search);
      where.AND = [
        ...(where.AND || []),
        {
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { excerpt: { contains: query, mode: 'insensitive' } },
            { content: { contains: query, mode: 'insensitive' } },
            { slug: { contains: slugify(query), mode: 'insensitive' } }
          ]
        }
      ];
    }

    return getPrisma().article.findMany({
      where,
      include: { category: true },
      orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
      take: Number(limit)
    });
  }

  static async getBySlug(slug) {
    return getPrisma().article.findUnique({
      where: { slug },
      include: { category: true }
    });
  }

  static async listByCategory(category) {
    return this.list({ category });
  }

  static async save(payload = {}) {
    const prisma = getPrisma();
    const title = String(payload.title || '').trim();
    const slug = slugify(payload.slug || payload.title || '');

    if (!title || !slug) {
      throw new Error('Title and slug are required');
    }

    const categoryName = String(payload.category || '').trim();
    let categoryId = null;

    if (categoryName) {
      const category = await prisma.category.upsert({
        where: { slug: slugify(categoryName) || 'blog' },
        update: {
          name: categoryName,
          type: 'blog'
        },
        create: {
          name: categoryName,
          slug: slugify(categoryName) || 'blog',
          type: 'blog'
        }
      });
      categoryId = category.id;
    }

    const status = payload.status === 'published' ? 'published' : 'draft';
    const publishDate = payload.publishDate || payload.publishedAt || null;
    const data = {
      slug,
      title,
      content: String(payload.content || '').trim(),
      excerpt: String(payload.excerpt || payload.summary || '').trim() || null,
      author: String(payload.author || '').trim() || null,
      seoTitle: String(payload.seoTitle || payload.metaTitle || '').trim() || null,
      seoDescription: String(payload.seoDescription || payload.metaDescription || '').trim() || null,
      status,
      publishedAt: status === 'published' ? new Date(publishDate || Date.now()) : null,
      categoryId
    };

    if (payload.id) {
      return prisma.article.update({
        where: { id: payload.id },
        data,
        include: { category: true }
      });
    }

    const existing = await prisma.article.findUnique({ where: { slug } });
    if (existing) {
      return prisma.article.update({
        where: { id: existing.id },
        data,
        include: { category: true }
      });
    }

    return prisma.article.create({
      data,
      include: { category: true }
    });
  }

  static async togglePublish(id) {
    const prisma = getPrisma();
    const current = await prisma.article.findUnique({
      where: { id },
      include: { category: true }
    });

    if (!current) return null;

    const nextStatus = current.status === 'published' ? 'draft' : 'published';
    return prisma.article.update({
      where: { id },
      data: {
        status: nextStatus,
        publishedAt: nextStatus === 'published' ? current.publishedAt || new Date() : null
      },
      include: { category: true }
    });
  }
}



