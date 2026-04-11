import { prisma } from '../lib/prisma.js';

export class ArticleService {
  static async list({ category, status = 'published', limit = 100 } = {}) {
    const where = { status };

    if (category) {
      where.OR = [
        { category: { slug: category } },
        { category: { name: category } }
      ];
    }

    return prisma.article.findMany({
      where,
      include: { category: true },
      orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
      take: Number(limit)
    });
  }

  static async getBySlug(slug) {
    return prisma.article.findUnique({
      where: { slug },
      include: { category: true }
    });
  }

  static async listByCategory(category) {
    return this.list({ category });
  }
}

