import { getPrisma } from '../lib/prisma.js';
import { SimulationService } from './simulationService.js';

const digitsOnly = (value = '') => String(value).replace(/\D/g, '');

const normalizeText = (value) => (typeof value === 'string' ? value.trim() : value);

const normalizeLeadPayload = (payload = {}) => ({
  fullName: normalizeText(payload.fullName),
  cpf: digitsOnly(payload.cpf),
  email: normalizeText(payload.email)?.toLowerCase() || null,
  phone: digitsOnly(payload.phone || ''),
  requestedAmount: payload.requestedAmount ?? null,
  income: payload.income ?? null,
  scoreRange: normalizeText(payload.scoreRange) || null,
  employmentStatus: normalizeText(payload.employmentStatus) || null,
  hasRestriction: payload.hasRestriction ?? null,
  productType: payload.productType,
  sourcePage: normalizeText(payload.sourcePage) || null,
  utmSource: payload.utmSource || null,
  utmMedium: payload.utmMedium || null,
  utmCampaign: payload.utmCampaign || null
});

export class CreditLeadService {
  static async createOrReuseLead(payload) {
    const data = normalizeLeadPayload(payload);
    const prisma = getPrisma();

    const existingLead = await prisma.creditLead.findFirst({
      where: {
        cpf: data.cpf,
        productType: data.productType
      },
      orderBy: { updatedAt: 'desc' }
    });

    const lead = existingLead
      ? await prisma.creditLead.update({
          where: { id: existingLead.id },
          data
        })
      : await prisma.creditLead.create({
          data
        });

    const legacyLead = await SimulationService.createLead({
      productType: data.productType,
      requestedAmount: data.requestedAmount,
      income: data.income,
      scoreRange: data.scoreRange,
      employmentStatus: data.employmentStatus,
      hasRestriction: data.hasRestriction,
      originPage: data.sourcePage,
      utmSource: data.utmSource,
      utmMedium: data.utmMedium,
      utmCampaign: data.utmCampaign
    });

    return {
      ...lead,
      legacySimulationLeadId: legacyLead.id
    };
  }

  static async getById(id) {
    return getPrisma().creditLead.findUnique({
      where: { id },
      include: {
        providerSessions: {
          orderBy: { updatedAt: 'desc' }
        }
      }
    });
  }
}
