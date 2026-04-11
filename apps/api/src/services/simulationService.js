import { getPrisma } from '../lib/prisma.js';

export class SimulationService {
  static async createLead(payload) {
    return getPrisma().simulationLead.create({
      data: {
        productType: payload.productType,
        requestedAmount: payload.requestedAmount,
        income: payload.income,
        scoreRange: payload.scoreRange,
        employmentStatus: payload.employmentStatus,
        hasRestriction: payload.hasRestriction,
        utmSource: payload.utmSource,
        utmMedium: payload.utmMedium,
        utmCampaign: payload.utmCampaign,
        originPage: payload.originPage
      }
    });
  }

  static async getById(id) {
    return getPrisma().simulationLead.findUnique({ where: { id } });
  }
}



