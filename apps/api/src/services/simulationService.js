import { getPrisma } from '../lib/prisma.js';

const leadSelect = {
  id: true,
  productType: true,
  requestedAmount: true,
  income: true,
  scoreRange: true,
  employmentStatus: true,
  hasRestriction: true,
  fullName: true,
  phone: true,
  profile: true,
  partnerId: true,
  partnerName: true,
  deliveryMode: true,
  redirectUrl: true,
  status: true,
  utmSource: true,
  utmMedium: true,
  utmCampaign: true,
  originPage: true,
  createdAt: true,
  updatedAt: true
};

const quickLeadFields = [
  'productType',
  'requestedAmount',
  'income',
  'scoreRange',
  'employmentStatus',
  'hasRestriction',
  'fullName',
  'phone',
  'profile',
  'partnerId',
  'partnerName',
  'deliveryMode',
  'redirectUrl',
  'status',
  'utmSource',
  'utmMedium',
  'utmCampaign',
  'originPage'
];

const pickDefined = (payload = {}, fields = quickLeadFields) =>
  fields.reduce((acc, field) => {
    if (payload[field] !== undefined) acc[field] = payload[field];
    return acc;
  }, {});

export class SimulationService {
  static async createLead(payload) {
    return getPrisma().simulationLead.create({
      data: pickDefined(payload),
      select: leadSelect
    });
  }

  static async listLeads(filters = {}) {
    const where = {};

    if (filters.productType && filters.productType !== 'all') where.productType = filters.productType;
    if (filters.originPage && filters.originPage !== 'all') where.originPage = filters.originPage;
    if (filters.status && filters.status !== 'all') where.status = filters.status;

    if (filters.from || filters.to) {
      where.createdAt = {};
      if (filters.from) where.createdAt.gte = new Date(filters.from);
      if (filters.to) where.createdAt.lte = new Date(filters.to);
    }

    return getPrisma().simulationLead.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 500,
      select: leadSelect
    });
  }

  static async getOverview() {
    const prisma = getPrisma();
    const [leads, ctaClicks, appIntegrationEvents, clickEvents] = await Promise.all([
      prisma.simulationLead.findMany({
        orderBy: { createdAt: 'desc' },
        take: 1000,
        select: {
          id: true,
          productType: true,
          originPage: true,
          status: true,
          profile: true,
          partnerName: true,
          deliveryMode: true,
          createdAt: true
        }
      }),
      prisma.ctaEvent.count(),
      prisma.appIntegrationEvent.count(),
      prisma.clickEvent.findMany({
        orderBy: { createdAt: 'desc' },
        take: 1000,
        select: {
          offerId: true,
          offer: {
            select: {
              product: { select: { name: true } },
              bank: { select: { name: true } }
            }
          }
        }
      })
    ]);

    const leadsByProductType = leads.reduce((acc, lead) => {
      acc[lead.productType] = (acc[lead.productType] || 0) + 1;
      return acc;
    }, {});

    const topConvertingPages = Object.entries(
      leads.reduce((acc, lead) => {
        const page = lead.originPage || 'desconhecida';
        acc[page] = (acc[page] || 0) + 1;
        return acc;
      }, {})
    )
      .map(([page, count]) => ({ page, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const clicksByOffer = Object.entries(
      clickEvents.reduce((acc, click) => {
        const offerId = click.offerId || 'unknown';
        if (!acc[offerId]) {
          const offerTitle = [click.offer?.product?.name, click.offer?.bank?.name].filter(Boolean).join(' - ') || 'Oferta desconhecida';
          acc[offerId] = { offerId, offerTitle, count: 0 };
        }
        acc[offerId].count += 1;
        return acc;
      }, {})
    )
      .map(([, value]) => value)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalLeads: leads.length,
      leadsByProductType,
      clicksByOffer,
      ctaClicks,
      appIntegrationEvents,
      topConvertingPages,
      recentSimulationActivity: leads.slice(0, 8)
    };
  }

  static async getById(id) {
    return getPrisma().simulationLead.findUnique({ where: { id }, select: leadSelect });
  }

  static async updateLead(id, payload) {
    try {
      return await getPrisma().simulationLead.update({
        where: { id },
        data: pickDefined(payload, quickLeadFields.filter((field) => field !== 'productType')),
        select: leadSelect
      });
    } catch (error) {
      if (error?.code === 'P2025') return null;
      throw error;
    }
  }
}



