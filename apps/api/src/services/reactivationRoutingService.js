const parsePartners = () => {
  if (process.env.REACTIVATION_PARTNERS_JSON) {
    try {
      const partners = JSON.parse(process.env.REACTIVATION_PARTNERS_JSON);
      if (Array.isArray(partners) && partners.length) return partners;
    } catch {
      // fallback below
    }
  }

  return [
    {
      id: 'prime-credit',
      name: 'Parceiro Prime',
      mode: 'webhook',
      destination: process.env.REACTIVATION_PARTNER_PRIME_WEBHOOK || '',
      accepts: { qualifications: ['prime'], minScore: 72, productTypes: ['loan', 'financing'], allowGuaranteeBoost: true },
      priority: 100,
      estimatedRevenueCents: 9000
    },
    {
      id: 'standard-credit',
      name: 'Parceiro Standard',
      mode: 'redirect',
      destination: process.env.REACTIVATION_PARTNER_STANDARD_URL || 'https://www.cotejuros.com.br/ofertas',
      accepts: { qualifications: ['standard'], minScore: 45, productTypes: ['loan', 'credit_card', 'financing'] },
      priority: 80,
      estimatedRevenueCents: 4500
    },
    {
      id: 'restriction-friendly',
      name: 'Parceiro Restrição',
      mode: 'whatsapp',
      destination: process.env.REACTIVATION_PARTNER_RESTRICTION_WHATSAPP || '',
      accepts: { qualifications: ['restriction_friendly'], minScore: 40, productTypes: ['loan'] },
      priority: 70,
      estimatedRevenueCents: 3000
    },
    {
      id: 'nurture',
      name: 'Nutrição Cote Juros',
      mode: 'email',
      destination: process.env.REACTIVATION_NURTURE_EMAIL || '',
      accepts: { qualifications: ['nurture'], minScore: 0, productTypes: ['loan', 'credit_card', 'financing'] },
      priority: 10,
      estimatedRevenueCents: 0
    }
  ];
};

const acceptsLead = (partner, lead, score) => {
  const accepts = partner.accepts || {};
  if (Number(score.value) < Number(accepts.minScore || 0)) return false;
  if (Array.isArray(accepts.productTypes) && !accepts.productTypes.includes(lead.productType)) return false;
  if (lead.hasGuarantee && accepts.allowGuaranteeBoost && Number(score.value) >= 45) return true;
  if (Array.isArray(accepts.qualifications) && !accepts.qualifications.includes(score.qualification)) return false;
  return true;
};

export const ReactivationRoutingService = {
  listPartners() {
    return parsePartners().sort((a, b) => Number(b.priority || 0) - Number(a.priority || 0));
  },

  selectPartner(lead, score) {
    const partner = this.listPartners().find((item) => acceptsLead(item, lead, score));
    return partner || this.listPartners().find((item) => item.id === 'nurture');
  },

  buildRedirectUrl({ partner, leadId, tokenLast4, utm = {} }) {
    if (!partner?.destination) return null;
    const url = new URL(partner.destination);
    url.searchParams.set('cj_lead', leadId);
    url.searchParams.set('cj_token', tokenLast4);
    url.searchParams.set('utm_source', utm.utm_source || 'reactivation');
    url.searchParams.set('utm_medium', utm.utm_medium || partner.mode);
    url.searchParams.set('utm_campaign', utm.utm_campaign || 'lead_reactivation');
    return url.toString();
  }
};
