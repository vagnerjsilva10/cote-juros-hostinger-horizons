import { portalApi } from '@/platform/services/portalApi.js';

export const affiliateRedirectService = {
  async create({ offerSlug, pageSlug, position }) {
    return portalApi.trackAffiliateOfferClick({
      offerSlug,
      pageSlug,
      position
    });
  }
};
