import { prisma } from '../lib/prisma.js';

export class TrackingService {
  static async recordClick(payload) {
    return prisma.clickEvent.create({
      data: {
        offerId: payload.offerId || null,
        sourcePage: payload.sourcePage,
        utmSource: payload.utmSource,
        utmMedium: payload.utmMedium,
        utmCampaign: payload.utmCampaign
      }
    });
  }

  static async recordCta(payload) {
    return prisma.ctaEvent.create({
      data: {
        sourcePage: payload.sourcePage,
        ctaName: payload.ctaName,
        destination: payload.destination || null
      }
    });
  }

  static async recordAppIntegration(payload) {
    return prisma.appIntegrationEvent.create({
      data: {
        sourcePage: payload.sourcePage,
        productContext: payload.productContext || null,
        simulationId: payload.simulationId || null
      }
    });
  }
}

