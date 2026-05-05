import { portalApi } from '@/platform/services/portalApi.js';

export const partnerRedirectService = {
  async create({ partnerId, partnerSlug, simulationId, leadId, offerId, sourcePage, productType, utm, metadata }) {
    const redirect = await portalApi.createPartnerRedirect({
      partnerId,
      partnerSlug,
      simulationId,
      leadId,
      offerId,
      sourcePage,
      productType,
      utm,
      metadata
    });

    await portalApi.trackClick({
      type: 'partner_redirect',
      sourcePage,
      target: redirect?.clickId || partnerSlug || partnerId,
      offerId,
      partnerId,
      productType,
      utm,
      metadata
    });

    return {
      ...redirect,
      resolvedUrl: redirect?.redirectUrl || redirect?.resolvedUrl || redirect?.destination || null
    };
  }
};

