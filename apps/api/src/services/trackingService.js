import { getPrisma } from '../lib/prisma.js';

export class TrackingService {
  static async recordClick(payload) {
    return getPrisma().clickEvent.create({
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
    return getPrisma().ctaEvent.create({
      data: {
        sourcePage: payload.sourcePage,
        ctaName: payload.ctaName,
        destination: payload.destination || null
      }
    });
  }

  static async recordAppIntegration(payload) {
    return getPrisma().appIntegrationEvent.create({
      data: {
        sourcePage: payload.sourcePage,
        productContext: payload.productContext || null,
        simulationId: payload.simulationId || null
      }
    });
  }
}



