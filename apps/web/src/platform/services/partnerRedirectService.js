import { portalApi } from '@/platform/services/portalApi.js';

export const partnerRedirectService = {
  async create({ partnerId, offerId, destinationUrl, sourcePage, productType, utm, metadata }) {
    const redirect = await portalApi.createPartnerRedirect({
      partnerId,
      offerId,
      destinationUrl,
      sourcePage,
      productType,
      utm,
      metadata
    });

    await portalApi.trackClick({
      type: 'partner_redirect',
      sourcePage,
      target: destinationUrl,
      offerId,
      partnerId,
      productType,
      utm,
      metadata
    });

    return {
      ...redirect,
      resolvedUrl: redirect?.resolvedUrl || redirect?.destination || destinationUrl
    };
  }
};

