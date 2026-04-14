import { getPrisma } from '../lib/prisma.js';

const ensureProtocol = (url) => (url && !url.startsWith('http') ? `https://${url}` : url);

export class PartnerService {
  static buildRedirectUrl({ destinationUrl, trackingBaseUrl, sourcePage, utm = {}, offerId }) {
    const base = trackingBaseUrl || destinationUrl;
    const safeBase = ensureProtocol(base || 'https://finance.cotejuros.com.br');
    const url = new URL(safeBase);

    if (offerId) url.searchParams.set('offer_id', offerId);
    if (sourcePage) url.searchParams.set('source_page', sourcePage);

    Object.entries(utm).forEach(([key, value]) => {
      if (value) url.searchParams.set(key, value);
    });

    return url.toString();
  }

  static async registerRedirect({ partnerId, offerId, sourcePage, destinationUrl }) {
    return getPrisma().partnerRedirect.create({
      data: {
        partnerId,
        offerId: offerId || null,
        sourcePage,
        destination: destinationUrl
      }
    });
  }

  static async submitMockApiLead({ partnerId, leadId, sourcePage, productType, profile }) {
    const event = await getPrisma().appIntegrationEvent.create({
      data: {
        sourcePage,
        productContext: `mock_api:${partnerId}:${productType || 'loan'}:${profile || 'sem_perfil'}`,
        simulationId: leadId || null
      }
    });

    return {
      id: event.id,
      partnerId,
      leadId: leadId || null,
      status: 'accepted',
      externalProtocol: `mock_${event.id}`,
      createdAt: event.createdAt
    };
  }
}



