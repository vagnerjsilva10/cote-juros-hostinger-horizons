import { portalRepository } from '@/platform/repositories/portalRepository.js';
import { normalizeMojibake, normalizeMojibakeDeep } from '@/lib/textEncoding.js';
import { findArticleBySlug, normalizeArticleData } from '@/lib/content/articles.js';

const wait = (ms = 0) => new Promise((resolve) => setTimeout(resolve, ms));
const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
const ADMIN_API_TOKEN = import.meta.env.VITE_ADMIN_API_TOKEN || '';
const useRemote = Boolean(API_BASE);

const toQueryString = (params = {}) => {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    if (Array.isArray(value)) {
      value.forEach((item) => query.append(key, String(item)));
      return;
    }
    query.set(key, String(value));
  });

  return query.toString();
};

const request = async (path, options = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    ...(path.startsWith('/api/reactivation-admin') && ADMIN_API_TOKEN ? { Authorization: `Bearer ${ADMIN_API_TOKEN}` } : {}),
    ...(options.headers || {})
  };
  const response = await fetch(`${API_BASE}${path}`, {
    headers,
    ...options
  });

  if (!response.ok) {
    let message = `API request failed (${response.status})`;

    try {
      const errorPayload = await response.json();
      if (errorPayload?.message) message = errorPayload.message;
      else if (errorPayload?.error) message = errorPayload.error;
    } catch {
      // ignore non-JSON error bodies
    }

    throw new Error(message);
  }

  const payload = await response.json();
  return normalizeMojibakeDeep(payload?.data);
};

const normalizeOfferRecord = (offer = {}) => {
  const bankName = normalizeMojibake(offer.bankName || offer.bank?.name || '');
  const productType = offer.productType || offer.product?.type || null;
  const base = {
    ...offer,
    bankName,
    productType,
    category: normalizeMojibake(offer.category || offer.product?.name || ''),
    monthlyRate: offer.monthlyRate ?? (offer.interestRate != null ? Number(offer.interestRate) : undefined),
    annualRate: offer.annualRate ?? (offer.cet != null ? Number(offer.cet) : undefined),
    minValue: offer.minValue ?? (offer.minAmount != null ? Number(offer.minAmount) : undefined),
    maxValue: offer.maxValue ?? (offer.maxAmount != null ? Number(offer.maxAmount) : undefined),
    minScore: normalizeMojibake(offer.minScore ?? offer.scoreRequirement),
    title: normalizeMojibake(offer.title || [offer.product?.name, bankName].filter(Boolean).join(' '))
  };

  if (productType === 'credit_card') {
    base.annualFee = base.annualFee ?? 0;
    base.maxLimit = base.maxLimit ?? (base.maxValue != null ? Number(base.maxValue) : undefined);
    base.image = base.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(bankName || 'Cartão')}&background=0f172a&color=fff&size=512`;
    base.benefits = (base.benefits ?? ['Limite personalizado', 'Gestão digital', 'Pagamento por aproximação']).map(normalizeMojibake);
    base.category = normalizeMojibake(base.category || 'Intermediário');
  }

  if (productType === 'financing') {
    base.minDownPayment = base.minDownPayment ?? 20;
    base.category = normalizeMojibake(base.category || offer.product?.name || 'Financiamento');
  }

  if (productType === 'loan') {
    base.category = normalizeMojibake(base.category || offer.product?.name || 'Pessoal');
  }

  return base;
};

const normalizeArticleRecord = (article = {}) =>
  normalizeArticleData({
    ...article,
    title: normalizeMojibake(article.title || ''),
    summary: normalizeMojibake(article.summary || article.excerpt || ''),
    excerpt: normalizeMojibake(article.excerpt || article.summary || ''),
    content: normalizeMojibake(article.content || ''),
    seoTitle: normalizeMojibake(article.seoTitle || article.title || ''),
    metaDescription: normalizeMojibake(article.metaDescription || article.summary || ''),
    h1: normalizeMojibake(article.h1 || article.title || ''),
  intro: Array.isArray(article.intro) ? article.intro.map((item) => normalizeMojibake(item)) : undefined,
  sections: Array.isArray(article.sections)
    ? article.sections.map((section) => ({
      ...section,
      heading: normalizeMojibake(section.heading || ''),
      paragraphs: Array.isArray(section.paragraphs) ? section.paragraphs.map((item) => normalizeMojibake(item)) : [],
      bullets: Array.isArray(section.bullets) ? section.bullets.map((item) => normalizeMojibake(item)) : []
    }))
    : undefined,
  faq: Array.isArray(article.faq)
    ? article.faq.map((item) => ({
      question: normalizeMojibake(item.question || ''),
      answer: normalizeMojibake(item.answer || '')
    }))
    : undefined,
  conclusion: Array.isArray(article.conclusion) ? article.conclusion.map((item) => normalizeMojibake(item)) : undefined,
  internalLinks: Array.isArray(article.internalLinks)
    ? article.internalLinks.map((item) => ({
      ...item,
      title: normalizeMojibake(item.title || ''),
      anchor: normalizeMojibake(item.anchor || '')
    }))
    : undefined,
  publishDate: article.publishDate || article.publishedAt || article.createdAt || new Date().toISOString(),
  readTime: article.readTime || 6,
  image:
    article.image ||
    'https://images.unsplash.com/photo-1554224155-1696413565d3?auto=format&fit=crop&w=1200&q=80',
  category: normalizeMojibake(article.category || article.categoryName || article.category?.name || 'Finanças Pessoais')
});

const fetchLocalArticleBySlug = async (slug) => {
  try {
    const directResponse = await fetch(`/content/seo/articles/${slug}.json`);
    if (directResponse.ok) {
      const payload = await directResponse.json();
      return normalizeArticleRecord(payload);
    }
  } catch {
    // ignore and fallback below
  }

  try {
    const indexResponse = await fetch('/content/seo/articles/index.json');
    if (indexResponse.ok) {
      const indexPayload = await indexResponse.json();
      const list = Array.isArray(indexPayload) ? indexPayload.map(normalizeArticleRecord) : [];
      const matched = findArticleBySlug(list, slug);
      if (matched?.slug) {
        const aliasResponse = await fetch(`/content/seo/articles/${matched.slug}.json`);
        if (aliasResponse.ok) {
          const payload = await aliasResponse.json();
          return normalizeArticleRecord(payload);
        }
      }
    }
  } catch {
    // ignore and fallback below
  }

  return portalRepository.getArticleBySlug(slug);
};
const normalizeCreditOfferRecord = (offer = {}) => ({
  id: offer.id,
  externalOfferId: offer.externalOfferId || offer.id,
  provider: offer.provider || 'juros_baixos',
  bankName: normalizeMojibake(offer.bankName || ''),
  productName: normalizeMojibake(offer.productName || ''),
  monthlyRate: offer.monthlyRate != null ? Number(offer.monthlyRate) : null,
  cet: offer.cet != null ? Number(offer.cet) : null,
  installmentAmount: offer.installmentAmount != null ? Number(offer.installmentAmount) : null,
  totalAmount: offer.totalAmount != null ? Number(offer.totalAmount) : null,
  approvedAmount: offer.approvedAmount != null ? Number(offer.approvedAmount) : null,
  termMonths: offer.termMonths != null ? Number(offer.termMonths) : null,
  redirectUrl: offer.redirectUrl || null,
  matchLabel: normalizeMojibake(offer.matchLabel || 'Compatível com seu perfil'),
  rawPayload: offer.rawPayload || null
});

const normalizeAffiliateOfferRecord = (offer = {}) => ({
  id: offer.id,
  network: offer.network || 'awin',
  advertiserId: offer.advertiserId || offer.advertiser_id || '',
  externalProgramId: offer.externalProgramId || offer.external_program_id || '',
  merchantName: normalizeMojibake(offer.merchantName || offer.merchant_name || ''),
  offerSlug: normalizeMojibake(offer.offerSlug || offer.offer_slug || ''),
  title: normalizeMojibake(offer.title || ''),
  category: normalizeMojibake(offer.category || ''),
  description: normalizeMojibake(offer.description || ''),
  audience: normalizeMojibake(offer.audience || ''),
  imageUrl: offer.imageUrl || offer.image_url || '',
  destinationUrl: offer.destinationUrl || offer.destination_url || '',
  trackingUrl: offer.trackingUrl || offer.tracking_url || '',
  payoutText: normalizeMojibake(offer.payoutText || offer.payout_text || ''),
  ctaText: normalizeMojibake(offer.ctaText || offer.cta_text || 'Ver condições'),
  disclosureText: normalizeMojibake(offer.disclosureText || offer.disclosure_text || ''),
  priority: Number(offer.priority || 0),
  productType: offer.productType || offer.product_type || null,
  pageSlugs: Array.isArray(offer.pageSlugs) ? offer.pageSlugs : [],
  placements: Array.isArray(offer.placements) ? offer.placements : [],
  metadata: offer.metadata || null
});

const buildLocalCreditOffers = (payload = {}) =>
  portalRepository
    .listOffers({
      productType: payload.productType || 'loan',
      amount: payload.requestedAmount
    })
    .slice(0, 6)
    .map((offer, index) =>
      normalizeCreditOfferRecord({
        id: `local_credit_offer_${index + 1}`,
        externalOfferId: offer.id,
        provider: 'catalog_fallback',
        bankName: offer.bankName,
        productName: offer.title || offer.category,
        monthlyRate: offer.monthlyRate,
        cet: offer.annualRate,
        approvedAmount: offer.maxValue,
        termMonths: payload.installments || offer.maxTerm,
        redirectUrl: offer.redirectUrl,
        matchLabel: index === 0 ? 'Destaque do portal' : 'Fallback do catálogo',
        rawPayload: offer
      })
    );

const normalizeSimulationLeadRecord = (lead = {}) => ({
  ...lead,
  amount: lead.amount ?? (lead.requestedAmount != null ? Number(lead.requestedAmount) : undefined),
  requestedAmount: lead.requestedAmount != null ? Number(lead.requestedAmount) : lead.requestedAmount,
  income: lead.income != null ? Number(lead.income) : lead.income,
  employmentType: lead.employmentType || lead.employmentStatus,
  hasDebt: lead.hasDebt ?? lead.hasRestriction,
  sourcePage: lead.sourcePage || lead.originPage
});

const serializeSimulationLeadPayload = (payload = {}) => ({
  productType: payload.productType || 'loan',
  requestedAmount: payload.requestedAmount ?? payload.amount,
  income: payload.income,
  scoreRange: payload.scoreRange ?? payload.score,
  employmentStatus: payload.employmentStatus ?? payload.employmentType,
  hasRestriction: payload.hasRestriction ?? payload.hasDebt,
  fullName: payload.fullName,
  phone: payload.phone,
  profile: payload.profile,
  partnerId: payload.partnerId,
  partnerName: payload.partnerName,
  deliveryMode: payload.deliveryMode,
  redirectUrl: payload.redirectUrl,
  status: payload.status,
  originPage: payload.originPage ?? payload.sourcePage,
  utm_source: payload.utm?.utm_source,
  utm_medium: payload.utm?.utm_medium,
  utm_campaign: payload.utm?.utm_campaign
});

const serializeSimulationLeadPatch = (payload = {}) => {
  const data = serializeSimulationLeadPayload(payload);
  delete data.productType;
  return data;
};

export const portalApi = {
  async getBanks() {
    await wait();
    return portalRepository.listBanks();
  },

  async getCategories(kind) {
    await wait();
    return portalRepository.listCategories(kind);
  },

  async getProducts(type) {
    await wait();
    return portalRepository.listProducts(type);
  },

  async getOffers(filters) {
    if (!useRemote) {
      await wait();
      return portalRepository.listOffers(filters);
    }

    try {
      const qs = toQueryString(filters);
      const data = await request(`/api/offers${qs ? `?${qs}` : ''}`);
      return Array.isArray(data) ? data.map(normalizeOfferRecord) : [];
    } catch {
      return portalRepository.listOffers(filters);
    }
  },

  async getArticles(filters) {
    if (!useRemote) {
      await wait();
      return portalRepository.listArticles(filters);
    }

    try {
      const qs = toQueryString(filters);
      const data = await request(`/api/articles${qs ? `?${qs}` : ''}`);
      return Array.isArray(data) ? data.map(normalizeArticleRecord) : [];
    } catch {
      return portalRepository.listArticles(filters);
    }
  },

  async getAffiliateOffers(filters) {
    if (!useRemote) {
      await wait();
      return portalRepository.listAffiliateOffers(filters).map(normalizeAffiliateOfferRecord);
    }

    try {
      const qs = toQueryString(filters);
      const data = await request(`/api/affiliates/offers${qs ? `?${qs}` : ''}`);
      return Array.isArray(data) ? data.map(normalizeAffiliateOfferRecord) : [];
    } catch {
      return portalRepository.listAffiliateOffers(filters).map(normalizeAffiliateOfferRecord);
    }
  },

  async getAffiliatePlacements(filters) {
    if (!useRemote) {
      await wait();
      const data = portalRepository.listAffiliatePlacements(filters);
      return {
        ...data,
        placements: Object.fromEntries(
          Object.entries(data.placements || {}).map(([placement, offers]) => [
            placement,
            offers.map(normalizeAffiliateOfferRecord)
          ])
        )
      };
    }

    try {
      const qs = toQueryString(filters);
      const data = await request(`/api/affiliates/placements${qs ? `?${qs}` : ''}`);
      return {
        ...data,
        placements: Object.fromEntries(
          Object.entries(data?.placements || {}).map(([placement, offers]) => [
            placement,
            Array.isArray(offers) ? offers.map(normalizeAffiliateOfferRecord) : []
          ])
        )
      };
    } catch {
      const data = portalRepository.listAffiliatePlacements(filters);
      return {
        ...data,
        placements: Object.fromEntries(
          Object.entries(data.placements || {}).map(([placement, offers]) => [
            placement,
            offers.map(normalizeAffiliateOfferRecord)
          ])
        )
      };
    }
  },

  async getArticleBySlug(slug) {
    if (!slug) return null;

    if (!useRemote) {
      await wait();
      return fetchLocalArticleBySlug(slug);
    }

    try {
      const data = await request(`/api/articles/slug/${slug}`);
      return data ? normalizeArticleRecord(data) : null;
    } catch {
      return fetchLocalArticleBySlug(slug);
    }
  },

  async getSeoPages() {
    await wait();
    return portalRepository.listSeoPages();
  },

  async getSeoFallbackPaths() {
    await wait();
    return portalRepository.listSeoFallbackPaths();
  },

  async getTestimonials() {
    await wait();
    return portalRepository.listTestimonials();
  },

  async getAppIntegrationSources() {
    await wait();
    return portalRepository.listAppIntegrationSources();
  },

  async captureSimulationLead(payload) {
    if (!useRemote) {
      await wait();
      return portalRepository.createSimulationLead(payload);
    }

    try {
      return await request('/api/simulations', {
        method: 'POST',
        body: JSON.stringify({
          productType: payload.productType,
          requestedAmount: payload.amount,
          income: payload.income,
          scoreRange: payload.score,
          employmentStatus: payload.employmentType,
          hasRestriction: payload.hasDebt,
          fullName: payload.fullName,
          phone: payload.phone,
          originPage: payload.sourcePage,
          utm_source: payload.utm?.utm_source,
          utm_medium: payload.utm?.utm_medium,
          utm_campaign: payload.utm?.utm_campaign
        })
      });
    } catch {
      return portalRepository.createSimulationLead(payload);
    }
  },

  async trackClick(payload) {
    if (!useRemote) {
      await wait();
      return portalRepository.trackClickEvent(payload);
    }

    try {
      return await request('/api/tracking/clicks', {
        method: 'POST',
        body: JSON.stringify({
          offerId: payload.offerId,
          sourcePage: payload.sourcePage,
          utm_source: payload.utm?.utm_source,
          utm_medium: payload.utm?.utm_medium,
          utm_campaign: payload.utm?.utm_campaign
        })
      });
    } catch {
      return portalRepository.trackClickEvent(payload);
    }
  },

  async trackCta(payload) {
    if (!useRemote) {
      await wait();
      return portalRepository.trackCtaEvent(payload);
    }

    try {
      return await request('/api/tracking/cta', {
        method: 'POST',
        body: JSON.stringify({
          sourcePage: payload.sourcePage,
          ctaName: payload.ctaId || payload.ctaLabel,
          destination: payload.destination || null
        })
      });
    } catch {
      return portalRepository.trackCtaEvent(payload);
    }
  },

  async createPartnerRedirect(payload) {
    if (!useRemote) {
      await wait();
      return portalRepository.createPartnerRedirect(payload);
    }

    try {
      return await request('/api/partners/redirect', {
        method: 'POST',
        body: JSON.stringify({
          partnerId: payload.partnerId,
          offerId: payload.offerId,
          sourcePage: payload.sourcePage,
          destinationUrl: payload.destinationUrl,
          utm: payload.utm
        })
      });
    } catch {
      return portalRepository.createPartnerRedirect(payload);
    }
  },

  async submitMockPartnerLead(payload) {
    if (!useRemote) {
      await wait();
      return portalRepository.createIntegrationEvent({
        sourcePage: payload.sourcePage,
        productContext: `mock_api:${payload.partnerId}:${payload.productType || 'loan'}:${payload.profile || 'sem_perfil'}`,
        simulationId: payload.leadId
      });
    }

    try {
      return await request('/api/partners/mock-api', {
        method: 'POST',
        body: JSON.stringify({
          partnerId: payload.partnerId,
          leadId: payload.leadId,
          sourcePage: payload.sourcePage,
          productType: payload.productType,
          profile: payload.profile
        })
      });
    } catch {
      return portalRepository.createIntegrationEvent({
        sourcePage: payload.sourcePage,
        productContext: `mock_api:${payload.partnerId}:${payload.productType || 'loan'}:${payload.profile || 'sem_perfil'}`,
        simulationId: payload.leadId
      });
    }
  },

  async trackIntegration(payload) {
    if (!useRemote) {
      await wait();
      return portalRepository.createIntegrationEvent(payload);
    }

    try {
      return await request('/api/tracking/integrations', {
        method: 'POST',
        body: JSON.stringify({
          sourcePage: payload.sourcePage,
          productContext: payload.productType,
          simulationId: payload.simulationContext?.leadId
        })
      });
    } catch {
      return portalRepository.createIntegrationEvent(payload);
    }
  },

  async getFinanceAiDeepLink(payload) {
    if (!useRemote) return null;

    try {
      return await request('/api/integration/app-link', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
    } catch {
      return null;
    }
  },

  async getAdminOffers(filters) {
    await wait();
    return portalRepository.listAdminOffers(filters);
  },

  async saveAdminOffer(payload) {
    await wait();
    return portalRepository.saveAdminOffer(payload);
  },

  async toggleAdminOfferStatus(id) {
    await wait();
    return portalRepository.toggleOfferStatus(id);
  },

  async getAdminBanks(filters) {
    await wait();
    return portalRepository.listAdminBanks(filters);
  },

  async saveAdminBank(payload) {
    await wait();
    return portalRepository.saveAdminBank(payload);
  },

  async toggleAdminBankStatus(id) {
    await wait();
    return portalRepository.toggleBankStatus(id);
  },

  async getAdminPartners(filters) {
    await wait();
    return portalRepository.listAdminPartners(filters);
  },

  async saveAdminPartner(payload) {
    await wait();
    return portalRepository.saveAdminPartner(payload);
  },

  async toggleAdminPartnerStatus(id) {
    await wait();
    return portalRepository.togglePartnerStatus(id);
  },

  async getAdminArticles(filters) {
    await wait();
    return portalRepository.listAdminArticles(filters);
  },

  async saveAdminArticle(payload) {
    await wait();
    return portalRepository.saveAdminArticle(payload);
  },

  async toggleAdminArticlePublish(id) {
    await wait();
    return portalRepository.toggleArticlePublish(id);
  },

  async getAdminSeoPages(filters) {
    await wait();
    return portalRepository.listAdminSeoPages(filters);
  },

  async saveAdminSeoPage(payload) {
    await wait();
    return portalRepository.saveAdminSeoPage(payload);
  },

  async toggleAdminSeoPublish(id) {
    await wait();
    return portalRepository.toggleSeoPagePublish(id);
  },

  async getAdminLeads(filters) {
    if (!useRemote) {
      await wait();
      return portalRepository.listSimulationLeads(filters);
    }

    try {
      const qs = toQueryString({
        ...filters,
        originPage: filters?.sourcePage
      });
      const data = await request(`/api/simulations${qs ? `?${qs}` : ''}`);
      return Array.isArray(data) ? data.map(normalizeSimulationLeadRecord) : [];
    } catch {
      return portalRepository.listSimulationLeads(filters);
    }
  },

  async updateAdminLeadStatus(id, status) {
    if (!useRemote) {
      await wait();
      return portalRepository.updateSimulationLeadStatus(id, status);
    }

    try {
      const data = await request(`/api/simulations/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
      return normalizeSimulationLeadRecord(data);
    } catch {
      return portalRepository.updateSimulationLeadStatus(id, status);
    }
  },

  async createQuickCreditLead(payload) {
    if (!useRemote) {
      await wait();
      return portalRepository.createSimulationLead(payload);
    }

    try {
      const data = await request('/api/simulations', {
        method: 'POST',
        body: JSON.stringify(serializeSimulationLeadPayload(payload))
      });
      return normalizeSimulationLeadRecord(data);
    } catch {
      return portalRepository.createSimulationLead(payload);
    }
  },

  async updateQuickCreditLead(id, payload) {
    if (!useRemote) {
      await wait();
      return portalRepository.updateSimulationLead(id, payload);
    }

    try {
      const data = await request(`/api/simulations/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(serializeSimulationLeadPatch(payload))
      });
      return normalizeSimulationLeadRecord(data);
    } catch {
      return portalRepository.updateSimulationLead(id, payload);
    }
  },

  async startQuickCreditJourney(payload) {
    if (!useRemote) return null;

    try {
      const data = await request('/api/simulations/quick-credit', {
        method: 'POST',
        body: JSON.stringify({
          productType: payload.productType || 'loan',
          amount: payload.amount,
          requestedAmount: payload.requestedAmount,
          income: payload.income,
          employmentStatus: payload.employmentStatus ?? payload.employmentType,
          hasRestriction: payload.hasRestriction ?? payload.hasDebt,
          fullName: payload.fullName,
          phone: payload.phone,
          sourcePage: payload.sourcePage,
          originPage: payload.originPage,
          originLabel: payload.originLabel,
          utm: payload.utm,
          utm_source: payload.utm?.utm_source,
          utm_medium: payload.utm?.utm_medium,
          utm_campaign: payload.utm?.utm_campaign
        })
      });

      return {
        ...data,
        lead: data?.lead ? normalizeSimulationLeadRecord(data.lead) : null
      };
    } catch {
      return null;
    }
  },

  async getAdminTestimonials(filters) {
    await wait();
    return portalRepository.listAdminTestimonials(filters);
  },

  async saveAdminTestimonial(payload) {
    await wait();
    return portalRepository.saveAdminTestimonial(payload);
  },

  async toggleAdminTestimonialStatus(id) {
    await wait();
    return portalRepository.toggleTestimonialStatus(id);
  },

  async getAdminSettings() {
    await wait();
    return portalRepository.getSettings();
  },

  async updateAdminSettings(payload) {
    await wait();
    return portalRepository.updateSettings(payload);
  },

  async getAdminAnalyticsOverview() {
    if (!useRemote) {
      await wait();
      return portalRepository.getAnalyticsOverview();
    }

    try {
      const data = await request('/api/simulations/overview');
      return {
        ...data,
        recentSimulationActivity: Array.isArray(data?.recentSimulationActivity)
          ? data.recentSimulationActivity.map(normalizeSimulationLeadRecord)
          : []
      };
    } catch {
      return portalRepository.getAnalyticsOverview();
    }
  },

  async startCreditJourney(payload) {
    if (!useRemote) {
      await wait();
      return {
        lead: {
          id: `local_credit_lead_${Date.now()}`,
          fullName: payload.fullName,
          cpf: payload.cpf,
          email: payload.email,
          phone: payload.phone,
          requestedAmount: payload.requestedAmount,
          income: payload.income,
          scoreRange: payload.scoreRange,
          employmentStatus: payload.employmentStatus,
          hasRestriction: payload.hasRestriction,
          productType: payload.productType,
          sourcePage: payload.sourcePage,
          birthDate: payload.birthDate || null,
          mothersName: payload.mothersName || null,
          gender: payload.gender || null,
          maritalStatus: payload.maritalStatus || null,
          educationalLevel: payload.educationalLevel || null,
          birthCity: payload.birthCity || null,
          birthState: payload.birthState || null,
          address: payload.address || null,
          addressNumber: payload.addressNumber || null,
          district: payload.district || null,
          city: payload.city || null,
          state: payload.state || null,
          zipCode: payload.zipCode || null,
          jurosBaixosProfile: payload.jurosBaixosProfile || null,
          createdAt: new Date().toISOString()
        },
        providerSession: {
          id: `local_provider_session_${Date.now()}`,
          provider: 'catalog_fallback',
          status: 'not_configured'
        }
      };
    }

    return request('/api/credit/start', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  async simulateCredit(payload) {
    if (!useRemote) {
      await wait();
      const simulationId = `local_credit_simulation_${Date.now()}`;
      return {
        simulation: {
          id: simulationId,
          leadId: payload.leadId,
          providerSessionId: payload.providerSessionId,
          provider: 'catalog_fallback',
          requestedAmount: payload.requestedAmount,
          installments: payload.installments,
          productType: payload.productType,
          status: 'completed',
          createdAt: new Date().toISOString()
        },
        offers: buildLocalCreditOffers(payload),
        providerConfigured: false
      };
    }

    const data = await request('/api/credit/simulate', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    return {
      ...data,
      offers: Array.isArray(data?.offers) ? data.offers.map(normalizeCreditOfferRecord) : []
    };
  },

  async getCreditSimulation(id) {
    if (!useRemote) {
      await wait();
      return {
        simulation: {
          id,
          provider: 'catalog_fallback',
          requestedAmount: null,
          installments: null,
          productType: 'loan',
          status: 'completed'
        },
        lead: null,
        providerSession: null,
        offers: buildLocalCreditOffers({ productType: 'loan' })
      };
    }

    const data = await request(`/api/credit/simulations/${id}`);
    return {
      ...data,
      offers: Array.isArray(data?.offers) ? data.offers.map(normalizeCreditOfferRecord) : []
    };
  },

  async trackCreditOfferClick({ offerId, sourcePage, utm }) {
    if (!useRemote) {
      await wait();
      return {
        offerId,
        redirectUrl: null,
        provider: 'catalog_fallback'
      };
    }

    return request(`/api/credit/offers/${offerId}/click`, {
      method: 'POST',
      body: JSON.stringify({
        sourcePage,
        utm_source: utm?.utm_source,
        utm_medium: utm?.utm_medium,
        utm_campaign: utm?.utm_campaign
      })
    });
  },

  async trackAffiliateOfferClick({ offerSlug, pageSlug, position }) {
    const device =
      typeof navigator !== 'undefined' && navigator.userAgent
        ? /mobile|android|iphone|ipod/i.test(navigator.userAgent)
          ? 'mobile'
          : /ipad|tablet/i.test(navigator.userAgent)
            ? 'tablet'
            : 'desktop'
        : 'desktop';

    if (!useRemote) {
      await wait();
      return portalRepository.trackAffiliateClick({
        offerSlug,
        pageSlug,
        position,
        device
      });
    }

    try {
      return await request(`/api/affiliates/offers/${offerSlug}/click`, {
        method: 'POST',
        body: JSON.stringify({
          pageSlug,
          position
        })
      });
    } catch {
      return portalRepository.trackAffiliateClick({
        offerSlug,
        pageSlug,
        position,
        device
      });
    }
  },

  async getReactivationLead(token, { markViewed = false } = {}) {
    if (!useRemote) {
      await wait();
      return {
        id: `local_reactivation_${token.slice(-6)}`,
        status: 'visited',
        fullName: '',
        productType: 'loan',
        segment: 'local_preview',
        expiresAt: null
      };
    }

    return request(`/api/reactivation/lead/${encodeURIComponent(token)}${markViewed ? '?viewed=1' : ''}`);
  },

  async submitReactivationLead(payload) {
    if (!useRemote) {
      await wait();
      return {
        lead: {
          id: `local_reactivation_${Date.now()}`,
          status: 'routed',
          fullName: payload.fullName,
          productType: payload.productType,
          scoreValue: 72,
          scoreBand: 'B',
          qualification: 'standard'
        },
        score: {
          value: 72,
          band: 'B',
          qualification: 'standard'
        },
        partner: {
          id: 'standard-credit',
          name: 'Parceiro Standard',
          mode: 'redirect'
        },
        redirectUrl: '/ofertas'
      };
    }

    return request('/api/reactivation/submit', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  async optOutReactivationLead(payload) {
    if (!useRemote) {
      await wait();
      return { status: 'suppressed', optOutReason: payload.reason || payload.scope };
    }

    return request('/api/reactivation/opt-out', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  async refuseReactivationConsent(payload) {
    if (!useRemote) {
      await wait();
      return { status: 'rejected', optOutReason: payload.reason || 'consent_refused' };
    }

    return request('/api/reactivation/refuse-consent', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  async getReactivationKpis(filters) {
    if (!useRemote) {
      await wait();
      return {
        totalLeads: 1200,
        sentLeads: 1200,
        visits: 384,
        consents: 156,
        forms: 140,
        qualified: 128,
        routed: 118,
        delivered: 102,
        deliveryFailed: 6,
        conversionRates: {
          visitRate: 32,
          consentRate: 40.63,
          formRate: 89.74,
          qualificationRate: 91.43,
          deliveryRate: 86.44
        },
        revenue: {
          estimatedRevenueCents: 428000,
          payoutCents: 0
        },
        byStatus: {
          imported: 816,
          visited: 228,
          consented: 38,
          delivery_success: 102,
          delivery_retrying: 10,
          delivery_failed: 6
        },
        byDeliveryStatus: {
          delivery_success: 102,
          delivery_retrying: 10,
          delivery_failed: 6
        },
        byBatch: [{ batchId: 'local_preview', leads: 1200 }],
        byPartner: [
          { partnerId: 'standard-credit', partnerName: 'Parceiro Standard', leads: 74 },
          { partnerId: 'restriction-friendly', partnerName: 'Parceiro Restrição', leads: 44 }
        ],
        auditEvents: {
          page_viewed: 384,
          consent_granted: 156,
          partner_routed: 118
        },
        recentLeads: []
      };
    }

    const qs = toQueryString(filters);
    return request(`/api/reactivation/kpis${qs ? `?${qs}` : ''}`);
  },

  async getReactivationEmailAdminDashboard() {
    if (!useRemote) {
      await wait();
      return {
        leadsInQueue: 42,
        sentToday: 5,
        delivered: 5,
        opens: 2,
        clicks: 1,
        bounces: 0,
        spamReports: 0,
        optOuts: 0,
        activeCampaigns: 1,
        activeFlows: 1,
        pausedFlows: 0,
        dailyLimit: 5,
        dailyLimitUsed: 5,
        dailyLimitRemaining: 0,
        openRate: 40,
        clickRate: 20,
        conversionToSubmit: 8,
        conversionByCampaign: [],
        conversionByPartner: [],
        estimatedRevenueCents: 9000,
        nextMessages: []
      };
    }

    return request('/api/reactivation-admin/dashboard');
  },

  async getReactivationEmailCampaigns() {
    if (!useRemote) return [];
    return request('/api/reactivation-admin/campaigns');
  },

  async saveReactivationEmailCampaign(payload) {
    return request('/api/reactivation-admin/campaigns', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  async setReactivationEmailCampaignStatus(id, status) {
    return request(`/api/reactivation-admin/campaigns/${id}/status`, {
      method: 'POST',
      body: JSON.stringify({ status })
    });
  },

  async getReactivationEmailTemplates() {
    if (!useRemote) return [];
    return request('/api/reactivation-admin/templates');
  },

  async saveReactivationEmailTemplate(payload) {
    return request('/api/reactivation-admin/templates', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  async getReactivationFlows() {
    if (!useRemote) {
      await wait();
      return [{
        id: 'preview-flow',
        name: 'Reativacao credito v1',
        slug: 'reactivation-credit-v1',
        status: 'active',
        isActive: true,
        versions: [{
          version: 1,
          definition: {
            nodes: [
              { key: 'trigger', type: 'trigger_lead_entry', label: 'Lead elegivel', position: { x: 80, y: 160 } },
              { key: 'initial', type: 'send_email', label: 'Email initial', position: { x: 320, y: 160 } },
              { key: 'wait', type: 'delay', label: 'Esperar 3 dias', position: { x: 560, y: 160 } },
              { key: 'condition', type: 'condition', label: 'Clicou?', position: { x: 800, y: 160 } }
            ],
            edges: [
              { key: 'e1', source: 'trigger', target: 'initial' },
              { key: 'e2', source: 'initial', target: 'wait' },
              { key: 'e3', source: 'wait', target: 'condition' }
            ]
          }
        }]
      }];
    }
    return request('/api/reactivation-admin/flows');
  },

  async saveReactivationFlow(payload) {
    return request('/api/reactivation-admin/flows', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  async validateReactivationFlow(definition) {
    return request('/api/reactivation-admin/flows/validate', {
      method: 'POST',
      body: JSON.stringify(definition)
    });
  },

  async bootstrapReactivationEmailAdmin() {
    return request('/api/reactivation-admin/bootstrap-defaults', {
      method: 'POST',
      body: JSON.stringify({})
    });
  }
};
