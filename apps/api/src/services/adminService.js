import crypto from 'node:crypto';
import { getPrisma } from '../lib/prisma.js';
import { hashPassword, hashValue, recordAdminAudit } from '../lib/adminAuth.js';
import { getJurosBaixosHealth } from '../integrations/jurosBaixos/config.js';
import { getCreditasHealth } from '../integrations/creditas/config.js';
import { PartnerMatcherService } from './partnerMatcherService.js';
import { PartnerService } from './partnerService.js';

const leadDetailInclude = {
  tagAssignments: {
    include: {
      tag: true
    },
    orderBy: {
      createdAt: 'asc'
    }
  },
  ownerAssignment: {
    include: {
      ownerUser: {
        select: {
          id: true,
          email: true,
          fullName: true
        }
      }
    }
  },
  notes: {
    include: {
      authorUser: {
        select: {
          id: true,
          email: true,
          fullName: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  },
  routingDecisions: {
    orderBy: {
      createdAt: 'desc'
    }
  },
  deliveryAttempts: {
    orderBy: {
      attemptedAt: 'desc'
    }
  },
  suppressions: {
    orderBy: {
      createdAt: 'desc'
    }
  },
  scoreSnapshots: {
    orderBy: {
      createdAt: 'desc'
    }
  },
  revenueEvents: {
    orderBy: {
      occurredAt: 'desc'
    }
  },
  payoutEvents: {
    orderBy: {
      occurredAt: 'desc'
    }
  }
};

const serializeLead = (lead) => {
  if (!lead) return null;
  return {
    ...lead,
    requestedAmount: lead.requestedAmount != null ? Number(lead.requestedAmount) : null,
    income: lead.income != null ? Number(lead.income) : null,
    tags: (lead.tagAssignments || []).map((assignment) => ({
      id: assignment.tag.id,
      key: assignment.tag.key,
      label: assignment.tag.label,
      color: assignment.tag.color
    }))
  };
};

const normalizePagination = ({ page = 1, pageSize = 20 } = {}) => {
  const normalizedPage = Math.max(1, Number(page || 1));
  const normalizedPageSize = Math.min(100, Math.max(10, Number(pageSize || 20)));
  return {
    page: normalizedPage,
    pageSize: normalizedPageSize,
    skip: (normalizedPage - 1) * normalizedPageSize
  };
};

const buildLeadWhere = (filters = {}) => {
  const where = {};

  if (filters.productType && filters.productType !== 'all') where.productType = filters.productType;
  if (filters.status && filters.status !== 'all') where.status = filters.status;
  if (filters.originPage && filters.originPage !== 'all') where.originPage = filters.originPage;
  if (filters.partnerId && filters.partnerId !== 'all') where.partnerId = filters.partnerId;
  if (filters.deliveryMode && filters.deliveryMode !== 'all') where.deliveryMode = filters.deliveryMode;

  if (filters.from || filters.to) {
    where.createdAt = {};
    if (filters.from) where.createdAt.gte = new Date(filters.from);
    if (filters.to) where.createdAt.lte = new Date(filters.to);
  }

  if (filters.search) {
    where.OR = [
      { fullName: { contains: filters.search, mode: 'insensitive' } },
      { phone: { contains: filters.search, mode: 'insensitive' } },
      { partnerName: { contains: filters.search, mode: 'insensitive' } },
      { originPage: { contains: filters.search, mode: 'insensitive' } }
    ];
  }

  if (filters.ownerId && filters.ownerId !== 'all') {
    where.ownerAssignment = {
      ownerUserId: filters.ownerId
    };
  }

  if (filters.suppressed === 'true') {
    where.suppressions = {
      some: {}
    };
  }

  return where;
};

const buildLeadStatusSummary = (items = []) =>
  items.reduce((acc, item) => {
    acc[item.status] = (acc[item.status] || 0) + 1;
    return acc;
  }, {});

const serializeAdminUser = (user) => ({
  ...user,
  roles: (user.roles || []).map((item) => ({
    id: item.role.id,
    code: item.role.code,
    name: item.role.name
  }))
});

const serializePartner = (partner) => ({
  ...partner,
  bankName: partner.bank?.name || null,
  fallbackPartnerName: partner.fallbackPartner?.name || null,
  affiliateUrl: partner.affiliateUrl || partner.trackingLink || partner.metadata?.affiliateUrl || ''
});

const toNullableNumber = (value) => {
  if (value === '' || value == null) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

const slugify = (value = '') =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'item';

const serializeBank = (bank) => ({
  ...bank,
  logoUrl: bank.logo || '',
  logo: bank.logo || ''
});

const serializeOffer = (offer) => ({
  id: offer.id,
  bankId: offer.bankId,
  productId: offer.productId,
  bankName: offer.bank?.name || '',
  productType: offer.product?.type || null,
  category: offer.product?.category?.name || offer.product?.name || '',
  title: [offer.product?.name, offer.bank?.name].filter(Boolean).join(' '),
  monthlyRate: offer.interestRate != null ? Number(offer.interestRate) : null,
  annualRate: offer.cet != null ? Number(offer.cet) : null,
  minValue: offer.minAmount != null ? Number(offer.minAmount) : null,
  maxValue: offer.maxAmount != null ? Number(offer.maxAmount) : null,
  minTerm: offer.minTerm,
  maxTerm: offer.maxTerm,
  minScore: offer.scoreRequirement || '',
  redirectUrl: offer.redirectUrl,
  partnerTrackingUrl: offer.partnerTrackingUrl || '',
  isFeatured: offer.isFeatured,
  status: offer.status,
  createdAt: offer.createdAt,
  updatedAt: offer.updatedAt
});

const serializeArticle = (article) => ({
  ...article,
  category: article.category?.name || '',
  categorySlug: article.category?.slug || '',
  summary: article.excerpt || '',
  image: article.coverImage || '',
  coverImage: article.coverImage || '',
  ogImage: article.ogImage || '',
  coverImageAlt: article.structuredContent?.coverImageAlt || article.structuredContent?.imageAlt || '',
  imageAlt: article.structuredContent?.imageAlt || article.structuredContent?.coverImageAlt || '',
  readTime: article.readTime || 0,
  wordCount: article.wordCount || 0,
  publishDate: article.publishedAt || article.createdAt
});

const parseArticleStructuredContent = (article) => {
  if (article?.structuredContent && typeof article.structuredContent === 'object' && !Array.isArray(article.structuredContent)) {
    return article.structuredContent;
  }

  try {
    const parsed = JSON.parse(article?.content || '{}');
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
};

const hasOwn = (object, key) => Object.prototype.hasOwnProperty.call(object || {}, key);

const ensureProductForOffer = async (prisma, payload) => {
  const productType = payload.productType || 'loan';
  const categoryName = payload.category || (
    productType === 'credit_card' ? 'Cartao de Credito' : productType === 'financing' ? 'Financiamento' : 'Emprestimo Pessoal'
  );
  const productName = payload.title || categoryName;
  const categorySlug = slugify(`${productType}-${categoryName}`);

  const category = await prisma.category.upsert({
    where: { slug: categorySlug },
    update: {
      name: categoryName,
      type: 'product'
    },
    create: {
      slug: categorySlug,
      name: categoryName,
      type: 'product'
    }
  });

  const existing = await prisma.financialProduct.findFirst({
    where: {
      type: productType,
      name: productName,
      categoryId: category.id
    }
  });

  if (existing) return existing;

  return prisma.financialProduct.create({
    data: {
      type: productType,
      name: productName,
      description: payload.description || null,
      categoryId: category.id
    }
  });
};

const ensureArticleCategory = async (prisma, categoryName = 'Financas Pessoais') => {
  const name = categoryName || 'Financas Pessoais';
  return prisma.category.upsert({
    where: { slug: slugify(`blog-${name}`) },
    update: {
      name,
      type: 'blog'
    },
    create: {
      slug: slugify(`blog-${name}`),
      name,
      type: 'blog'
    }
  });
};

export class AdminService {
  static async authenticateDefaultUser(password, req, user) {
    const prisma = getPrisma();
    const updatedUser = await prisma.adminUser.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date()
      }
    });

    await prisma.adminLoginAttempt.create({
      data: {
        userId: updatedUser.id,
        email: updatedUser.email,
        success: true,
        ipAddress: req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || null,
        userAgent: req.headers['user-agent'] || null
      }
    });

    return updatedUser;
  }

  static async registerFailedLogin({ email = null, req, reason = 'invalid_credentials' }) {
    return getPrisma().adminLoginAttempt.create({
      data: {
        email,
        success: false,
        failureReason: reason,
        ipAddress: req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || null,
        userAgent: req.headers['user-agent'] || null
      }
    });
  }

  static async createPasswordResetToken(user) {
    const prisma = getPrisma();
    const rawToken = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
    const tokenHash = hashValue(rawToken);
    await prisma.adminPasswordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + (1000 * 60 * 30))
      }
    });
    return rawToken;
  }

  static async changePassword(userId, nextPassword, req) {
    const prisma = getPrisma();
    const user = await prisma.adminUser.update({
      where: { id: userId },
      data: {
        passwordHash: hashPassword(nextPassword)
      }
    });
    await recordAdminAudit({
      req,
      user,
      action: 'password_changed',
      resource: 'admin_user',
      resourceId: user.id,
      metadata: { email: user.email }
    });
    return user;
  }

  static async getDashboard() {
    const prisma = getPrisma();
    const [recentLeads, totalLeads, openAlerts, activeSessions, revenueTotals] = await Promise.all([
      prisma.simulationLead.findMany({
        orderBy: { createdAt: 'desc' },
        take: 200,
        include: {
          ownerAssignment: {
            include: {
              ownerUser: {
                select: { id: true, fullName: true, email: true }
              }
            }
          }
        }
      }),
      prisma.simulationLead.count(),
      prisma.platformAlert.count({ where: { status: 'open' } }),
      prisma.adminSession.count({ where: { status: 'active', expiresAt: { gt: new Date() } } }),
      prisma.revenueEvent.aggregate({
        _sum: {
          estimatedCents: true,
          confirmedCents: true
        }
      })
    ]);

    const byProduct = recentLeads.reduce((acc, lead) => {
      acc[lead.productType] = (acc[lead.productType] || 0) + 1;
      return acc;
    }, {});

    const byStatus = buildLeadStatusSummary(recentLeads);

    return {
      totalLeads,
      activeSessions,
      openAlerts,
      estimatedRevenueCents: revenueTotals._sum.estimatedCents || 0,
      confirmedRevenueCents: revenueTotals._sum.confirmedCents || 0,
      leadsByProduct: byProduct,
      leadsByStatus: byStatus,
      recentLeads: recentLeads.slice(0, 12).map(serializeLead)
    };
  }

  static async getHealthOverview() {
    const prisma = getPrisma();
    const [recentChecks, alerts, partnerSummary] = await Promise.all([
      prisma.integrationHealthCheck.findMany({
        orderBy: { checkedAt: 'desc' },
        take: 12
      }),
      prisma.platformAlert.findMany({
        orderBy: [
          { status: 'asc' },
          { createdAt: 'desc' }
        ],
        take: 10
      }),
      prisma.partnerConfig.groupBy({
        by: ['healthStatus', 'status'],
        _count: {
          _all: true
        }
      }).catch(() => [])
    ]);

    const partnerHealth = partnerSummary.reduce((acc, item) => {
      const key = item.healthStatus || 'unknown';
      acc[key] = (acc[key] || 0) + (item._count?._all || 0);
      return acc;
    }, {});

    const openAlerts = alerts.filter((item) => item.status === 'open');
    const severities = openAlerts.reduce((acc, item) => {
      acc[item.severity] = (acc[item.severity] || 0) + 1;
      return acc;
    }, {});

    return {
      generatedAt: new Date().toISOString(),
      api: {
        service: 'cote-juros-api',
        databaseConfigured: Boolean(process.env.DATABASE_URL),
        environment: process.env.NODE_ENV || 'development'
      },
      integrations: {
        jurosBaixos: getJurosBaixosHealth(),
        creditas: getCreditasHealth()
      },
      alerts: {
        open: openAlerts.length,
        total: alerts.length,
        bySeverity: severities,
        items: alerts
      },
      partners: {
        byHealthStatus: partnerHealth
      },
      checks: recentChecks,
      scheduledJobs: [
        {
          key: 'importLeadsFromSheets',
          cron: '*/5 * * * *',
          enabled: true,
          description: 'Importa novos leads da planilha operacional.'
        },
        {
          key: 'retryPendingDeliveries',
          cron: '*/15 * * * *',
          enabled: true,
          description: 'Reprocessa entregas pendentes e falhas recuperáveis.'
        },
        {
          key: 'sendReactivationEmails',
          cron: process.env.REACTIVATION_EMAIL_CRON || '30 9-17 * * 1-5',
          enabled: process.env.REACTIVATION_EMAIL_ENABLED === 'true',
          description: 'Dispara a próxima onda segura da régua de reativação.'
        },
        {
          key: 'syncReactivationKpis',
          cron: '0 * * * *',
          enabled: Boolean(process.env.REACTIVATION_BATCH_ID),
          description: 'Sincroniza métricas de lotes e receita operacional.'
        }
      ]
    };
  }

  static async listAuditLogs({ page = 1, pageSize = 20, resource = '', action = '', search = '' } = {}) {
    const prisma = getPrisma();
    const pagination = normalizePagination({ page, pageSize });
    const where = {};

    if (resource) where.resource = resource;
    if (action) where.action = action;
    if (search) {
      where.OR = [
        { actorEmail: { contains: search, mode: 'insensitive' } },
        { resourceId: { contains: search, mode: 'insensitive' } },
        { action: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [items, total] = await Promise.all([
      prisma.adminAuditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: pagination.skip,
        take: pagination.pageSize
      }),
      prisma.adminAuditLog.count({ where })
    ]);

    return {
      items,
      page: pagination.page,
      pageSize: pagination.pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pagination.pageSize))
    };
  }

  static async listLeadOwners() {
    const prisma = getPrisma();
    return prisma.adminUser.findMany({
      where: {
        status: 'active',
        roles: {
          some: {
            role: {
              code: { in: ['super_admin', 'admin', 'operador', 'analista'] }
            }
          }
        }
      },
      orderBy: { fullName: 'asc' },
      select: {
        id: true,
        email: true,
        fullName: true
      }
    });
  }

  static async listRoles() {
    const prisma = getPrisma();
    return prisma.adminRole.findMany({
      orderBy: { name: 'asc' },
      include: {
        permissions: {
          include: {
            permission: true
          }
        }
      }
    });
  }

  static async listUsers({ search = '', status = '' } = {}) {
    const prisma = getPrisma();
    const where = {};

    if (status && status !== 'all') where.status = status;
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { fullName: { contains: search, mode: 'insensitive' } }
      ];
    }

    const users = await prisma.adminUser.findMany({
      where,
      orderBy: [
        { status: 'asc' },
        { fullName: 'asc' }
      ],
      include: {
        roles: {
          include: {
            role: true
          }
        },
        sessions: {
          where: {
            status: 'active',
            expiresAt: { gt: new Date() }
          },
          orderBy: {
            lastSeenAt: 'desc'
          },
          take: 3
        }
      }
    });

    return users.map(serializeAdminUser);
  }

  static async listBanks({ search = '', status = '' } = {}) {
    const prisma = getPrisma();
    const where = {};

    if (status && status !== 'all') where.status = status;
    if (search) where.name = { contains: search, mode: 'insensitive' };

    const banks = await prisma.bank.findMany({
      where,
      orderBy: { name: 'asc' }
    });

    return banks.map(serializeBank);
  }

  static async saveBank(payload, req, actorUser) {
    const prisma = getPrisma();
    const data = {
      name: payload.name,
      logo: payload.logoUrl || payload.logo || null,
      website: payload.website || null,
      status: payload.status || 'active'
    };

    const bank = payload.id
      ? await prisma.bank.update({
        where: { id: payload.id },
        data
      })
      : await prisma.bank.create({ data });

    await recordAdminAudit({
      req,
      user: actorUser,
      action: payload.id ? 'bank_updated' : 'bank_created',
      resource: 'banks',
      resourceId: bank.id,
      after: data
    });

    return serializeBank(bank);
  }

  static async toggleBankStatus(id, req, actorUser) {
    const prisma = getPrisma();
    const current = await prisma.bank.findUnique({ where: { id } });
    if (!current) return null;

    const bank = await prisma.bank.update({
      where: { id },
      data: {
        status: current.status === 'inactive' ? 'active' : 'inactive'
      }
    });

    await recordAdminAudit({
      req,
      user: actorUser,
      action: 'bank_status_toggled',
      resource: 'banks',
      resourceId: bank.id,
      before: { status: current.status },
      after: { status: bank.status }
    });

    return serializeBank(bank);
  }

  static async listOffers({ search = '', productType = '', status = '', bankId = '' } = {}) {
    const prisma = getPrisma();
    const where = {};

    if (status && status !== 'all') where.status = status;
    if (bankId && bankId !== 'all') where.bankId = bankId;
    if (productType && productType !== 'all') where.product = { type: productType };
    if (search) {
      where.OR = [
        { bank: { name: { contains: search, mode: 'insensitive' } } },
        { product: { name: { contains: search, mode: 'insensitive' } } }
      ];
    }

    const offers = await prisma.offer.findMany({
      where,
      include: {
        bank: true,
        product: {
          include: {
            category: true
          }
        }
      },
      orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }]
    });

    return offers.map(serializeOffer);
  }

  static async saveOffer(payload, req, actorUser) {
    const prisma = getPrisma();
    const product = await ensureProductForOffer(prisma, payload);
    const data = {
      bankId: payload.bankId,
      productId: product.id,
      interestRate: toNullableNumber(payload.monthlyRate),
      cet: toNullableNumber(payload.annualRate),
      minAmount: toNullableNumber(payload.minValue),
      maxAmount: toNullableNumber(payload.maxValue),
      minTerm: payload.minTerm === '' || payload.minTerm == null ? null : Number(payload.minTerm),
      maxTerm: payload.maxTerm === '' || payload.maxTerm == null ? null : Number(payload.maxTerm),
      scoreRequirement: payload.minScore || null,
      redirectUrl: payload.redirectUrl || 'https://www.cotejuros.com.br',
      partnerTrackingUrl: payload.partnerTrackingUrl || null,
      isFeatured: Boolean(payload.isFeatured),
      status: payload.status || 'active'
    };

    const offer = payload.id
      ? await prisma.offer.update({
        where: { id: payload.id },
        data,
        include: {
          bank: true,
          product: { include: { category: true } }
        }
      })
      : await prisma.offer.create({
        data,
        include: {
          bank: true,
          product: { include: { category: true } }
        }
      });

    await recordAdminAudit({
      req,
      user: actorUser,
      action: payload.id ? 'offer_updated' : 'offer_created',
      resource: 'offers',
      resourceId: offer.id,
      after: data
    });

    return serializeOffer(offer);
  }

  static async toggleOfferStatus(id, req, actorUser) {
    const prisma = getPrisma();
    const current = await prisma.offer.findUnique({ where: { id } });
    if (!current) return null;

    const offer = await prisma.offer.update({
      where: { id },
      data: {
        status: current.status === 'inactive' ? 'active' : 'inactive'
      },
      include: {
        bank: true,
        product: { include: { category: true } }
      }
    });

    await recordAdminAudit({
      req,
      user: actorUser,
      action: 'offer_status_toggled',
      resource: 'offers',
      resourceId: offer.id,
      before: { status: current.status },
      after: { status: offer.status }
    });

    return serializeOffer(offer);
  }

  static async listArticles({ search = '', status = '' } = {}) {
    const prisma = getPrisma();
    const where = {};

    if (status && status !== 'all') where.status = status;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { excerpt: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } }
      ];
    }

    const articles = await prisma.article.findMany({
      where,
      include: { category: true },
      orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }]
    });

    return articles.map(serializeArticle);
  }

  static async saveArticle(payload, req, actorUser) {
    const prisma = getPrisma();
    const current = payload.id ? await prisma.article.findUnique({ where: { id: payload.id } }) : null;
    const category = await ensureArticleCategory(prisma, payload.category);
    const status = payload.status || 'draft';
    const coverImage = payload.coverImage || payload.image || null;
    const ogImage = hasOwn(payload, 'ogImage') ? (payload.ogImage || null) : (payload.image || coverImage);
    const imageAlt = payload.coverImageAlt || payload.imageAlt || payload.altText || null;
    const structuredContent = {
      ...parseArticleStructuredContent(current || payload)
    };
    if (coverImage) structuredContent.coverImage = coverImage;
    if (ogImage) structuredContent.ogImage = ogImage;
    if (imageAlt) {
      structuredContent.coverImageAlt = imageAlt;
      structuredContent.imageAlt = imageAlt;
    }
    if ((hasOwn(payload, 'coverImage') || hasOwn(payload, 'image')) && !coverImage) delete structuredContent.coverImage;
    if ((hasOwn(payload, 'ogImage') || hasOwn(payload, 'image')) && !ogImage) delete structuredContent.ogImage;
    if ((hasOwn(payload, 'coverImageAlt') || hasOwn(payload, 'imageAlt') || hasOwn(payload, 'altText')) && !imageAlt) {
      delete structuredContent.coverImageAlt;
      delete structuredContent.imageAlt;
    }
    const data = {
      title: payload.title,
      slug: payload.slug || slugify(payload.title),
      content: payload.content || '',
      excerpt: payload.summary || payload.excerpt || null,
      categoryId: category.id,
      author: payload.author || null,
      seoTitle: payload.seoTitle || null,
      seoDescription: payload.seoDescription || payload.metaDescription || null,
      coverImage,
      ogImage,
      structuredContent,
      publishedAt: status === 'published' ? (payload.publishedAt ? new Date(payload.publishedAt) : new Date()) : null,
      status
    };

    const article = payload.id
      ? await prisma.article.update({
        where: { id: payload.id },
        data,
        include: { category: true }
      })
      : await prisma.article.create({
        data,
        include: { category: true }
      });

    await recordAdminAudit({
      req,
      user: actorUser,
      action: payload.id ? 'article_updated' : 'article_created',
      resource: 'articles',
      resourceId: article.id,
      after: { title: article.title, slug: article.slug, status: article.status }
    });

    return serializeArticle(article);
  }

  static async toggleArticlePublish(id, req, actorUser) {
    const prisma = getPrisma();
    const current = await prisma.article.findUnique({
      where: { id },
      include: { category: true }
    });
    if (!current) return null;

    const nextStatus = current.status === 'published' ? 'draft' : 'published';
    const article = await prisma.article.update({
      where: { id },
      data: {
        status: nextStatus,
        publishedAt: nextStatus === 'published' ? new Date() : null
      },
      include: { category: true }
    });

    await recordAdminAudit({
      req,
      user: actorUser,
      action: 'article_status_toggled',
      resource: 'articles',
      resourceId: article.id,
      before: { status: current.status },
      after: { status: article.status }
    });

    return serializeArticle(article);
  }

  static async createUser(payload, req, actorUser) {
    const prisma = getPrisma();
    const roleCodes = Array.from(new Set((payload.roleCodes || []).filter(Boolean)));
    const roles = await prisma.adminRole.findMany({
      where: { code: { in: roleCodes } }
    });

    const user = await prisma.adminUser.create({
      data: {
        email: payload.email.toLowerCase(),
        fullName: payload.fullName,
        passwordHash: hashPassword(payload.password),
        status: payload.status || 'active',
        roles: {
          create: roles.map((role) => ({
            roleId: role.id
          }))
        }
      },
      include: {
        roles: {
          include: {
            role: true
          }
        },
        sessions: {
          where: {
            status: 'active',
            expiresAt: { gt: new Date() }
          },
          take: 3
        }
      }
    });

    await recordAdminAudit({
      req,
      user: actorUser,
      action: 'admin_user_created',
      resource: 'admin_user',
      resourceId: user.id,
      after: {
        email: user.email,
        fullName: user.fullName,
        status: user.status,
        roleCodes
      }
    });

    return serializeAdminUser(user);
  }

  static async updateUser(userId, payload, req, actorUser) {
    const prisma = getPrisma();
    const current = await prisma.adminUser.findUnique({
      where: { id: userId },
      include: {
        roles: {
          include: {
            role: true
          }
        }
      }
    });
    if (!current) return null;

    await prisma.adminUserRole.deleteMany({ where: { userId } });

    const roleCodes = Array.from(new Set((payload.roleCodes || []).filter(Boolean)));
    const roles = await prisma.adminRole.findMany({
      where: { code: { in: roleCodes } }
    });

    const updated = await prisma.adminUser.update({
      where: { id: userId },
      data: {
        fullName: payload.fullName ?? current.fullName,
        status: payload.status ?? current.status,
        ...(payload.password ? { passwordHash: hashPassword(payload.password) } : {}),
        roles: {
          create: roles.map((role) => ({
            roleId: role.id
          }))
        }
      },
      include: {
        roles: {
          include: {
            role: true
          }
        },
        sessions: {
          where: {
            status: 'active',
            expiresAt: { gt: new Date() }
          },
          take: 3
        }
      }
    });

    await recordAdminAudit({
      req,
      user: actorUser,
      action: 'admin_user_updated',
      resource: 'admin_user',
      resourceId: userId,
      before: {
        fullName: current.fullName,
        status: current.status,
        roleCodes: current.roles.map((item) => item.role.code)
      },
      after: {
        fullName: updated.fullName,
        status: updated.status,
        roleCodes: updated.roles.map((item) => item.role.code),
        passwordRotated: Boolean(payload.password)
      }
    });

    return serializeAdminUser(updated);
  }

  static async listPartners({ search = '', status = '', healthStatus = '', integrationType = '' } = {}) {
    const prisma = getPrisma();
    const where = {};

    if (status && status !== 'all') where.status = status;
    if (healthStatus && healthStatus !== 'all') where.healthStatus = healthStatus;
    if (integrationType && integrationType !== 'all') where.integrationType = integrationType;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
        { internalNotes: { contains: search, mode: 'insensitive' } }
      ];
    }

    const partners = await prisma.partnerConfig.findMany({
      where,
      orderBy: [
        { priority: 'desc' },
        { updatedAt: 'desc' }
      ],
      include: {
        bank: true,
        fallbackPartner: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    return partners.map(serializePartner);
  }

  static async savePartner(payload, req, actorUser) {
    const prisma = getPrisma();
    const slug = (payload.slug || payload.name || 'parceiro')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const current = payload.id
      ? await prisma.partnerConfig.findUnique({ where: { id: payload.id } })
      : null;

    const data = {
      name: payload.name,
      slug,
      bankId: payload.bankId || null,
      integrationType: payload.integrationType,
      trackingLink: payload.trackingLink || null,
      productType: payload.productType || null,
      actionType: payload.actionType || null,
      affiliateUrl: payload.affiliateUrl || payload.trackingLink || null,
      isActive: payload.isActive ?? payload.status !== 'inactive',
      webhookUrl: payload.webhookUrl || null,
      apiBaseUrl: payload.apiBaseUrl || null,
      productTypes: payload.productTypes || [],
      status: payload.status || 'active',
      healthStatus: payload.healthStatus || current?.healthStatus || 'unknown',
      priority: Number(payload.priority || 50),
      weight: Number(payload.weight || 1),
      fallbackPartnerId: payload.fallbackPartnerId || null,
      dailyLimit: payload.dailyLimit != null ? Number(payload.dailyLimit) : null,
      monthlyLimit: payload.monthlyLimit != null ? Number(payload.monthlyLimit) : null,
      slaMinutes: payload.slaMinutes != null ? Number(payload.slaMinutes) : null,
      payoutLeadCents: payload.payoutLeadCents != null ? Number(payload.payoutLeadCents) : null,
      payoutConversionCents: payload.payoutConversionCents != null ? Number(payload.payoutConversionCents) : null,
      internalNotes: payload.internalNotes || null,
      metadata: payload.metadata || null
    };

    const partner = payload.id
      ? await prisma.partnerConfig.update({
        where: { id: payload.id },
        data,
        include: {
          bank: true,
          fallbackPartner: { select: { id: true, name: true } }
        }
      })
      : await prisma.partnerConfig.create({
        data,
        include: {
          bank: true,
          fallbackPartner: { select: { id: true, name: true } }
        }
      });

    await recordAdminAudit({
      req,
      user: actorUser,
      action: payload.id ? 'partner_updated' : 'partner_created',
      resource: 'partner',
      resourceId: partner.id,
      before: current,
      after: {
        name: partner.name,
        slug: partner.slug,
        integrationType: partner.integrationType,
        status: partner.status,
      healthStatus: partner.healthStatus
      }
    });

    return serializePartner(partner);
  }

  static async getPartnerPerformance() {
    return PartnerService.getPerformance();
  }

  static async togglePartnerStatus(id, req, actorUser) {
    const prisma = getPrisma();
    const current = await prisma.partnerConfig.findUnique({ where: { id } });
    if (!current) return null;

    const nextStatus = current.status === 'inactive' ? 'active' : 'inactive';
    const partner = await prisma.partnerConfig.update({
      where: { id },
      data: {
        status: nextStatus,
        isActive: nextStatus === 'active'
      },
      include: {
        bank: true,
        fallbackPartner: { select: { id: true, name: true } }
      }
    });

    await recordAdminAudit({
      req,
      user: actorUser,
      action: 'partner_status_toggled',
      resource: 'partner',
      resourceId: id,
      before: { status: current.status },
      after: { status: partner.status }
    });

    return serializePartner(partner);
  }

  static async testPartner(id, req, actorUser) {
    const prisma = getPrisma();
    const partner = await prisma.partnerConfig.findUnique({
      where: { id },
      include: {
        bank: true,
        fallbackPartner: { select: { id: true, name: true } }
      }
    });
    if (!partner) return null;

    let healthStatus = 'healthy';
    let message = 'Configuracao pronta para operacao.';

    if (partner.integrationType === 'tracking_link' && !partner.trackingLink && !partner.affiliateUrl) {
      healthStatus = 'warning';
      message = 'Parceiro sem tracking link configurado.';
    }
    if (partner.integrationType === 'webhook' && !partner.webhookUrl) {
      healthStatus = 'error';
      message = 'Parceiro webhook sem URL configurada.';
    }
    if (partner.integrationType === 'api' && !partner.apiBaseUrl) {
      healthStatus = 'error';
      message = 'Parceiro API sem base URL configurada.';
    }
    if (!partner.productTypes?.length) {
      healthStatus = healthStatus === 'error' ? 'error' : 'warning';
      message = healthStatus === 'error'
        ? message
        : 'Parceiro sem produtos vinculados.';
    }

    const checkedAt = new Date();
    const updated = await prisma.partnerConfig.update({
      where: { id },
      data: {
        healthStatus,
        lastHealthCheckAt: checkedAt,
        lastErrorAt: healthStatus === 'error' ? checkedAt : null,
        lastErrorMessage: healthStatus === 'error' ? message : null
      },
      include: {
        bank: true,
        fallbackPartner: { select: { id: true, name: true } }
      }
    });

    await prisma.integrationHealthCheck.create({
      data: {
        integrationKey: `partner:${partner.slug}`,
        status: healthStatus,
        details: {
          partnerId: partner.id,
          partnerName: partner.name,
          integrationType: partner.integrationType,
          message
        },
        checkedAt
      }
    });

    await recordAdminAudit({
      req,
      user: actorUser,
      action: 'partner_tested',
      resource: 'partner',
      resourceId: id,
      after: {
        healthStatus,
        message
      }
    });

    return {
      partner: serializePartner(updated),
      result: {
        healthStatus,
        message,
        checkedAt
      }
    };
  }

  static async listLeads(filters = {}) {
    const prisma = getPrisma();
    const pagination = normalizePagination(filters);
    const where = buildLeadWhere(filters);

    const [items, total, tags, owners] = await Promise.all([
      prisma.simulationLead.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: pagination.skip,
        take: pagination.pageSize,
        include: {
          tagAssignments: {
            include: { tag: true }
          },
          ownerAssignment: {
            include: {
              ownerUser: {
                select: {
                  id: true,
                  email: true,
                  fullName: true
                }
              }
            }
          },
          suppressions: {
            take: 1,
            orderBy: { createdAt: 'desc' }
          },
          routingDecisions: {
            take: 1,
            orderBy: { createdAt: 'desc' }
          },
          scoreSnapshots: {
            take: 1,
            orderBy: { createdAt: 'desc' }
          }
        }
      }),
      prisma.simulationLead.count({ where }),
      prisma.leadTag.findMany({ orderBy: { label: 'asc' } }),
      this.listLeadOwners()
    ]);

    return {
      items: items.map(serializeLead),
      meta: {
        page: pagination.page,
        pageSize: pagination.pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / pagination.pageSize))
      },
      facets: {
        tags,
        owners
      }
    };
  }

  static async getLead(leadId) {
    const lead = await getPrisma().simulationLead.findUnique({
      where: { id: leadId },
      include: leadDetailInclude
    });
    return serializeLead(lead);
  }

  static async updateLeadStatus(leadId, status, req, user) {
    const prisma = getPrisma();
    const current = await prisma.simulationLead.findUnique({ where: { id: leadId } });
    if (!current) return null;

    const updated = await prisma.simulationLead.update({
      where: { id: leadId },
      data: { status }
    });

    await recordAdminAudit({
      req,
      user,
      action: 'lead_status_updated',
      resource: 'lead',
      resourceId: leadId,
      before: { status: current.status },
      after: { status: updated.status }
    });

    return serializeLead(updated);
  }

  static async addLeadNote(leadId, body, req, user) {
    const prisma = getPrisma();
    const note = await prisma.leadNote.create({
      data: {
        leadId,
        body,
        authorUserId: user?.id || null
      },
      include: {
        authorUser: {
          select: {
            id: true,
            email: true,
            fullName: true
          }
        }
      }
    });

    await recordAdminAudit({
      req,
      user,
      action: 'lead_note_added',
      resource: 'lead',
      resourceId: leadId,
      after: { noteId: note.id, body: note.body }
    });

    return note;
  }

  static async setLeadTags(leadId, tags, req, user) {
    const prisma = getPrisma();
    const normalizedTags = Array.from(new Set((tags || []).map((item) => String(item).trim()).filter(Boolean)));
    const previous = await prisma.leadTagAssignment.findMany({
      where: { leadId },
      include: { tag: true }
    });

    await prisma.leadTagAssignment.deleteMany({ where: { leadId } });

    const assignments = [];
    for (const tagLabel of normalizedTags) {
      const key = tagLabel
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');

      const tag = await prisma.leadTag.upsert({
        where: { key },
        update: { label: tagLabel },
        create: {
          key,
          label: tagLabel
        }
      });

      const assignment = await prisma.leadTagAssignment.create({
        data: {
          leadId,
          tagId: tag.id
        },
        include: {
          tag: true
        }
      });
      assignments.push(assignment);
    }

    await recordAdminAudit({
      req,
      user,
      action: 'lead_tags_updated',
      resource: 'lead',
      resourceId: leadId,
      before: { tags: previous.map((item) => item.tag.label) },
      after: { tags: assignments.map((item) => item.tag.label) }
    });

    return assignments.map((item) => item.tag);
  }

  static async assignLeadOwner(leadId, ownerUserId, note, req, user) {
    const prisma = getPrisma();
    const previous = await prisma.leadOwnerAssignment.findUnique({
      where: { leadId },
      include: {
        ownerUser: {
          select: { id: true, fullName: true, email: true }
        }
      }
    });

    const assignment = await prisma.leadOwnerAssignment.upsert({
      where: { leadId },
      update: {
        ownerUserId,
        note: note || null
      },
      create: {
        leadId,
        ownerUserId,
        note: note || null
      },
      include: {
        ownerUser: {
          select: { id: true, fullName: true, email: true }
        }
      }
    });

    await recordAdminAudit({
      req,
      user,
      action: 'lead_owner_assigned',
      resource: 'lead',
      resourceId: leadId,
      before: previous ? { owner: previous.ownerUser } : null,
      after: { owner: assignment.ownerUser, note: assignment.note || null }
    });

    return assignment;
  }

  static async suppressLead(leadId, scope, reason, req, user) {
    const prisma = getPrisma();
    const suppression = await prisma.leadSuppression.create({
      data: {
        leadId,
        scope,
        reason: reason || null,
        source: 'admin'
      }
    });

    await recordAdminAudit({
      req,
      user,
      action: 'lead_suppressed',
      resource: 'lead',
      resourceId: leadId,
      after: { suppressionId: suppression.id, scope, reason: reason || null }
    });

    return suppression;
  }

  static async simulateRouting(leadId, req, user) {
    const prisma = getPrisma();
    const lead = await prisma.simulationLead.findUnique({ where: { id: leadId } });
    if (!lead) return null;

    const profile = PartnerMatcherService.calculateProfile({
      income: lead.income != null ? Number(lead.income) : 0,
      hasRestriction: Boolean(lead.hasRestriction),
      employmentStatus: lead.employmentStatus || ''
    });
    const recommendations = await PartnerMatcherService.match({
      productType: lead.productType,
      lead: {
        requestedAmount: lead.requestedAmount != null ? Number(lead.requestedAmount) : 0,
        income: lead.income != null ? Number(lead.income) : 0,
        hasRestriction: Boolean(lead.hasRestriction),
        employmentStatus: lead.employmentStatus || ''
      }
    });
    const partner = recommendations[0];
    const scoreValue = Math.max(0, Math.min(100, Math.round(
      (lead.income != null ? Number(lead.income) / 100 : 0)
      + (lead.hasRestriction ? 15 : 35)
      + (lead.employmentStatus === 'CLT' ? 20 : 10)
    )));
    const scoreBand = scoreValue >= 75 ? 'A' : scoreValue >= 55 ? 'B' : 'C';

    const [routingDecision, scoreSnapshot, deliveryAttempt, revenueEvent] = await Promise.all([
      prisma.leadRoutingDecision.create({
        data: {
          leadId,
          routeType: 'simulation',
          inputSnapshot: {
            income: lead.income != null ? Number(lead.income) : null,
            employmentStatus: lead.employmentStatus,
            hasRestriction: lead.hasRestriction,
            productType: lead.productType
          },
          ruleMatched: `profile:${profile}`,
          partnerId: partner.id,
          partnerName: partner.name,
          fallbackUsed: false,
          reason: 'Simulação manual de roteamento',
          scoreValue,
          scoreBand
        }
      }),
      prisma.leadScoreSnapshot.create({
        data: {
          leadId,
          productType: lead.productType,
          scoreValue,
          normalizedScore: scoreValue,
          eligibilityScore: scoreValue,
          propensityScore: scoreValue >= 75 ? 90 : scoreValue >= 55 ? 70 : 45,
          explanation: {
            profile,
            income: lead.income != null ? Number(lead.income) : null,
            hasRestriction: Boolean(lead.hasRestriction),
            employmentStatus: lead.employmentStatus || null
          }
        }
      }),
      prisma.leadDeliveryAttempt.create({
        data: {
          leadId,
          partnerId: partner.id,
          partnerName: partner.name,
          mode: partner.mode,
          status: 'simulated',
          requestPayload: {
            leadId,
            productType: lead.productType,
            profile
          },
          responsePayload: {
            destinationUrl: partner.destinationUrl || null,
            recommendations: recommendations.map((item) => item.id)
          }
        }
      }),
      prisma.revenueEvent.create({
        data: {
          leadId,
          partnerId: partner.id,
          productType: lead.productType,
          sourcePage: lead.originPage,
          eventType: 'routing_simulated',
          estimatedCents: partner.mode === 'tracking_link' ? 4500 : 2500,
          confirmedCents: 0,
          metadata: {
            partnerName: partner.name,
            profile,
            scoreBand
          }
        }
      })
    ]);

    await recordAdminAudit({
      req,
      user,
      action: 'lead_routing_simulated',
      resource: 'lead',
      resourceId: leadId,
      after: {
        routingDecisionId: routingDecision.id,
        scoreSnapshotId: scoreSnapshot.id,
        deliveryAttemptId: deliveryAttempt.id,
        revenueEventId: revenueEvent.id
      }
    });

    return {
      profile,
      partner,
      recommendations,
      routingDecision,
      scoreSnapshot,
      deliveryAttempt,
      revenueEvent
    };
  }
}
