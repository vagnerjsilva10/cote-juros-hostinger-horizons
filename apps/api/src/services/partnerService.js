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
}



