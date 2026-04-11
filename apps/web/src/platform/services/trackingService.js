import { portalApi } from '@/platform/services/portalApi.js';

export const trackingService = {
  async trackOfferClick({ sourcePage, offerId, target, productType, partnerId, utm, metadata }) {
    return portalApi.trackClick({
      type: 'offer_click',
      sourcePage,
      offerId,
      target,
      productType,
      partnerId,
      utm,
      metadata
    });
  },

  async trackCtaClick({ sourcePage, ctaId, ctaLabel, productType, campaign, utm, metadata }) {
    return portalApi.trackCta({
      sourcePage,
      ctaId,
      ctaLabel,
      productType,
      campaign,
      utm,
      metadata
    });
  }
};

