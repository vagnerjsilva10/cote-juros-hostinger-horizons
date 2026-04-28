import { getPrisma } from '../lib/prisma.js';
import { recordAdminAudit } from '../lib/adminAuth.js';

const normalizePath = (path = '/') => {
  const value = String(path || '/').trim();
  if (!value || value === '/') return '/';
  return `/${value.replace(/^\/+/, '').replace(/\/+$/, '')}`;
};

const serializeSetting = (item) => item ? {
  id: item.id,
  key: item.key,
  value: item.value,
  group: item.group,
  description: item.description,
  isPublic: item.isPublic,
  createdAt: item.createdAt,
  updatedAt: item.updatedAt
} : null;

const serializeNavigation = (item) => item ? {
  id: item.id,
  location: item.location,
  label: item.label,
  href: item.href,
  order: item.order,
  isActive: item.isActive,
  parentId: item.parentId,
  createdAt: item.createdAt,
  updatedAt: item.updatedAt
} : null;

const serializeDisclaimer = (item) => item ? {
  id: item.id,
  key: item.key,
  title: item.title,
  content: item.content,
  placement: item.placement,
  isActive: item.isActive,
  createdAt: item.createdAt,
  updatedAt: item.updatedAt
} : null;

const serializeSeoMeta = (item) => item ? {
  id: item.id,
  path: item.path,
  title: item.title,
  description: item.description,
  canonical: item.canonical,
  robots: item.robots,
  ogTitle: item.ogTitle,
  ogDescription: item.ogDescription,
  ogImage: item.ogImage,
  isActive: item.isActive,
  createdAt: item.createdAt,
  updatedAt: item.updatedAt
} : null;

const groupNavigation = (items = []) => {
  const byId = new Map(items.map((item) => [item.id, { ...serializeNavigation(item), links: [] }]));
  const roots = [];

  items.forEach((item) => {
    const node = byId.get(item.id);
    if (item.parentId && byId.has(item.parentId)) {
      byId.get(item.parentId).links.push(node);
    } else {
      roots.push(node);
    }
  });

  return roots.sort((a, b) => Number(a.order || 0) - Number(b.order || 0));
};

const settingsResponse = (items = []) => ({
  items: items.map(serializeSetting),
  byKey: Object.fromEntries(items.map((item) => [item.key, item.value]))
});

export class SiteFoundationService {
  static async listPublicSettings() {
    const items = await getPrisma().siteSetting.findMany({
      where: { isPublic: true },
      orderBy: [{ group: 'asc' }, { key: 'asc' }]
    });
    return settingsResponse(items);
  }

  static async listAdminSettings({ group = '', search = '' } = {}) {
    const where = {};
    if (group) where.group = group;
    if (search) {
      where.OR = [
        { key: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { group: { contains: search, mode: 'insensitive' } }
      ];
    }
    const items = await getPrisma().siteSetting.findMany({
      where,
      orderBy: [{ group: 'asc' }, { key: 'asc' }]
    });
    return items.map(serializeSetting);
  }

  static async saveSetting(payload, req, actorUser) {
    const prisma = getPrisma();
    const current = payload.id
      ? await prisma.siteSetting.findUnique({ where: { id: payload.id } })
      : await prisma.siteSetting.findUnique({ where: { key: payload.key } });

    const data = {
      key: payload.key,
      value: payload.value,
      group: payload.group,
      description: payload.description || null,
      isPublic: Boolean(payload.isPublic)
    };

    const item = current
      ? await prisma.siteSetting.update({ where: { id: current.id }, data })
      : await prisma.siteSetting.create({ data });

    await recordAdminAudit({
      req,
      user: actorUser,
      action: current ? 'site_setting_updated' : 'site_setting_created',
      resource: 'site_setting',
      resourceId: item.id,
      before: current ? serializeSetting(current) : null,
      after: serializeSetting(item)
    });

    return serializeSetting(item);
  }

  static async deleteSetting(id, req, actorUser) {
    const prisma = getPrisma();
    const current = await prisma.siteSetting.findUnique({ where: { id } });
    if (!current) return null;
    await prisma.siteSetting.delete({ where: { id } });
    await recordAdminAudit({
      req,
      user: actorUser,
      action: 'site_setting_deleted',
      resource: 'site_setting',
      resourceId: id,
      before: serializeSetting(current)
    });
    return serializeSetting(current);
  }

  static async listPublicNavigation() {
    const items = await getPrisma().navigationItem.findMany({
      where: { isActive: true },
      orderBy: [{ location: 'asc' }, { order: 'asc' }]
    });
    return {
      items: items.map(serializeNavigation),
      byLocation: items.reduce((acc, item) => {
        acc[item.location] = acc[item.location] || [];
        acc[item.location].push(serializeNavigation(item));
        return acc;
      }, {}),
      treeByLocation: items.reduce((acc, item) => {
        acc[item.location] = acc[item.location] || [];
        return acc;
      }, Object.fromEntries([...new Set(items.map((item) => item.location))].map((location) => [
        location,
        groupNavigation(items.filter((item) => item.location === location))
      ])))
    };
  }

  static async listAdminNavigation({ location = '', active = '' } = {}) {
    const where = {};
    if (location) where.location = location;
    if (active === 'true') where.isActive = true;
    if (active === 'false') where.isActive = false;
    const items = await getPrisma().navigationItem.findMany({
      where,
      orderBy: [{ location: 'asc' }, { parentId: 'asc' }, { order: 'asc' }, { label: 'asc' }]
    });
    return items.map(serializeNavigation);
  }

  static async saveNavigation(payload, req, actorUser) {
    const prisma = getPrisma();
    const current = payload.id ? await prisma.navigationItem.findUnique({ where: { id: payload.id } }) : null;
    const data = {
      location: payload.location,
      label: payload.label,
      href: payload.href,
      order: Number(payload.order || 0),
      isActive: payload.isActive ?? true,
      parentId: payload.parentId || null
    };
    const item = current
      ? await prisma.navigationItem.update({ where: { id: current.id }, data })
      : await prisma.navigationItem.create({ data });

    await recordAdminAudit({
      req,
      user: actorUser,
      action: current ? 'navigation_item_updated' : 'navigation_item_created',
      resource: 'navigation_item',
      resourceId: item.id,
      before: current ? serializeNavigation(current) : null,
      after: serializeNavigation(item)
    });

    return serializeNavigation(item);
  }

  static async deleteNavigation(id, req, actorUser) {
    const prisma = getPrisma();
    const current = await prisma.navigationItem.findUnique({ where: { id } });
    if (!current) return null;
    await prisma.navigationItem.delete({ where: { id } });
    await recordAdminAudit({
      req,
      user: actorUser,
      action: 'navigation_item_deleted',
      resource: 'navigation_item',
      resourceId: id,
      before: serializeNavigation(current)
    });
    return serializeNavigation(current);
  }

  static async listPublicDisclaimers({ placement = '' } = {}) {
    const items = await getPrisma().legalDisclaimer.findMany({
      where: {
        isActive: true,
        ...(placement ? { placement } : {})
      },
      orderBy: [{ placement: 'asc' }, { key: 'asc' }]
    });
    return items.map(serializeDisclaimer);
  }

  static async listAdminDisclaimers({ placement = '', active = '' } = {}) {
    const where = {};
    if (placement) where.placement = placement;
    if (active === 'true') where.isActive = true;
    if (active === 'false') where.isActive = false;
    const items = await getPrisma().legalDisclaimer.findMany({
      where,
      orderBy: [{ placement: 'asc' }, { key: 'asc' }]
    });
    return items.map(serializeDisclaimer);
  }

  static async saveDisclaimer(payload, req, actorUser) {
    const prisma = getPrisma();
    const current = payload.id
      ? await prisma.legalDisclaimer.findUnique({ where: { id: payload.id } })
      : await prisma.legalDisclaimer.findFirst({
        where: {
          key: payload.key,
          placement: payload.placement
        }
      });
    const data = {
      key: payload.key,
      title: payload.title,
      content: payload.content,
      placement: payload.placement,
      isActive: payload.isActive ?? true
    };
    const item = current
      ? await prisma.legalDisclaimer.update({ where: { id: current.id }, data })
      : await prisma.legalDisclaimer.create({ data });
    await recordAdminAudit({
      req,
      user: actorUser,
      action: current ? 'legal_disclaimer_updated' : 'legal_disclaimer_created',
      resource: 'legal_disclaimer',
      resourceId: item.id,
      before: current ? serializeDisclaimer(current) : null,
      after: serializeDisclaimer(item)
    });
    return serializeDisclaimer(item);
  }

  static async deleteDisclaimer(id, req, actorUser) {
    const prisma = getPrisma();
    const current = await prisma.legalDisclaimer.findUnique({ where: { id } });
    if (!current) return null;
    await prisma.legalDisclaimer.delete({ where: { id } });
    await recordAdminAudit({
      req,
      user: actorUser,
      action: 'legal_disclaimer_deleted',
      resource: 'legal_disclaimer',
      resourceId: id,
      before: serializeDisclaimer(current)
    });
    return serializeDisclaimer(current);
  }

  static async getPublicSeoMeta(path = '/') {
    const item = await getPrisma().seoMeta.findFirst({
      where: {
        path: normalizePath(path),
        isActive: true
      }
    });
    return serializeSeoMeta(item);
  }

  static async listAdminSeoMeta({ path = '', active = '' } = {}) {
    const where = {};
    if (path) where.path = { contains: path, mode: 'insensitive' };
    if (active === 'true') where.isActive = true;
    if (active === 'false') where.isActive = false;
    const items = await getPrisma().seoMeta.findMany({
      where,
      orderBy: [{ path: 'asc' }]
    });
    return items.map(serializeSeoMeta);
  }

  static async saveSeoMeta(payload, req, actorUser) {
    const prisma = getPrisma();
    const path = normalizePath(payload.path);
    const current = payload.id
      ? await prisma.seoMeta.findUnique({ where: { id: payload.id } })
      : await prisma.seoMeta.findUnique({ where: { path } });
    const data = {
      path,
      title: payload.title,
      description: payload.description,
      canonical: payload.canonical || null,
      robots: payload.robots || 'index,follow,max-image-preview:large',
      ogTitle: payload.ogTitle || null,
      ogDescription: payload.ogDescription || null,
      ogImage: payload.ogImage || null,
      isActive: payload.isActive ?? true
    };
    const item = current
      ? await prisma.seoMeta.update({ where: { id: current.id }, data })
      : await prisma.seoMeta.create({ data });
    await recordAdminAudit({
      req,
      user: actorUser,
      action: current ? 'seo_meta_updated' : 'seo_meta_created',
      resource: 'seo_meta',
      resourceId: item.id,
      before: current ? serializeSeoMeta(current) : null,
      after: serializeSeoMeta(item)
    });
    return serializeSeoMeta(item);
  }

  static async deleteSeoMeta(id, req, actorUser) {
    const prisma = getPrisma();
    const current = await prisma.seoMeta.findUnique({ where: { id } });
    if (!current) return null;
    await prisma.seoMeta.delete({ where: { id } });
    await recordAdminAudit({
      req,
      user: actorUser,
      action: 'seo_meta_deleted',
      resource: 'seo_meta',
      resourceId: id,
      before: serializeSeoMeta(current)
    });
    return serializeSeoMeta(current);
  }
}
