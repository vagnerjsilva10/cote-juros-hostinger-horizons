import { getPrisma } from '../lib/prisma.js';
import { SimulationService } from './simulationService.js';

const digitsOnly = (value = '') => String(value).replace(/\D/g, '');

const normalizeText = (value) => (typeof value === 'string' ? value.trim() : value);
const normalizeNullableText = (value) => normalizeText(value) || null;
const normalizeDate = (value) => (value ? new Date(`${value}T00:00:00.000Z`) : null);

const normalizeLeadPayload = (payload = {}) => ({
  fullName: normalizeText(payload.fullName),
  cpf: digitsOnly(payload.cpf),
  email: normalizeText(payload.email)?.toLowerCase() || null,
  phone: digitsOnly(payload.phone || '') || null,
  birthDate: normalizeDate(payload.birthDate || payload.jurosBaixosProfile?.info?.birth_date),
  mothersName: normalizeNullableText(payload.mothersName || payload.jurosBaixosProfile?.info?.mothers_name),
  gender: normalizeNullableText(payload.gender || payload.jurosBaixosProfile?.info?.gender),
  maritalStatus: normalizeNullableText(payload.maritalStatus || payload.jurosBaixosProfile?.info?.marital_status),
  educationalLevel: normalizeNullableText(payload.educationalLevel || payload.jurosBaixosProfile?.info?.educationalLevel),
  birthCity: normalizeNullableText(payload.birthCity || payload.jurosBaixosProfile?.info?.birth_city),
  birthState: normalizeNullableText(payload.birthState || payload.jurosBaixosProfile?.info?.birth_state)?.toUpperCase() || null,
  address: normalizeNullableText(payload.address || payload.jurosBaixosProfile?.residence?.address),
  addressNumber: normalizeNullableText(payload.addressNumber || payload.jurosBaixosProfile?.residence?.number),
  district: normalizeNullableText(payload.district || payload.jurosBaixosProfile?.residence?.district),
  city: normalizeNullableText(payload.city || payload.jurosBaixosProfile?.residence?.city),
  state: normalizeNullableText(payload.state || payload.jurosBaixosProfile?.residence?.state)?.toUpperCase() || null,
  zipCode: digitsOnly(payload.zipCode || payload.jurosBaixosProfile?.residence?.zip_code || '') || null,
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

const buildLeadProfiles = (lead) => ({
  personalProfile: {
    fullName: lead.fullName,
    cpf: lead.cpf,
    email: lead.email,
    phone: lead.phone,
    birthDate: lead.birthDate,
    mothersName: lead.mothersName,
    gender: lead.gender,
    maritalStatus: lead.maritalStatus,
    educationalLevel: lead.educationalLevel
  },
  birthProfile: {
    birthCity: lead.birthCity,
    birthState: lead.birthState
  },
  residentialProfile: {
    address: lead.address,
    addressNumber: lead.addressNumber,
    district: lead.district,
    city: lead.city,
    state: lead.state,
    zipCode: lead.zipCode
  },
  financialProfile: {
    requestedAmount: lead.requestedAmount,
    income: lead.income,
    scoreRange: lead.scoreRange,
    employmentStatus: lead.employmentStatus,
    hasRestriction: lead.hasRestriction
  },
  jurosBaixosProfile: {
    due_date: null,
    info: {
      birth_city: lead.birthCity,
      birth_date: lead.birthDate ? lead.birthDate.toISOString().slice(0, 10) : null,
      birth_state: lead.birthState,
      mothers_name: lead.mothersName,
      gender: lead.gender,
      marital_status: lead.maritalStatus,
      educationalLevel: lead.educationalLevel
    },
    residence: {
      address: lead.address,
      number: lead.addressNumber,
      district: lead.district,
      city: lead.city,
      state: lead.state,
      zip_code: lead.zipCode
    }
  }
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
      ...buildLeadProfiles(lead),
      legacySimulationLeadId: legacyLead.id
    };
  }

  static async getById(id) {
    const lead = await getPrisma().creditLead.findUnique({
      where: { id },
      include: {
        providerSessions: {
          orderBy: { updatedAt: 'desc' }
        }
      }
    });

    if (!lead) return null;

    return {
      ...lead,
      ...buildLeadProfiles(lead)
    };
  }

  static async updateById(id, payload) {
    const data = normalizeLeadPayload(payload);
    const updated = await getPrisma().creditLead.update({
      where: { id },
      data
    });

    return {
      ...updated,
      ...buildLeadProfiles(updated)
    };
  }
}
