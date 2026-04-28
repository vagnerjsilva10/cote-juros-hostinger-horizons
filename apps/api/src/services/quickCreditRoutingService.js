import { PartnerMatcherService } from './partnerMatcherService.js';

export class QuickCreditRoutingService {
  static calculateProfile(input = {}) {
    return PartnerMatcherService.calculateProfile(input);
  }

  static async resolvePartner(profileOrLead = 'geral') {
    const lead = typeof profileOrLead === 'string' ? { profile: profileOrLead } : profileOrLead;
    const recommendations = await PartnerMatcherService.match({ lead, productType: lead.productType || 'loan' });
    return recommendations[0];
  }
}
