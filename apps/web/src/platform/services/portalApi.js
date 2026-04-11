import { portalRepository } from '@/platform/repositories/portalRepository.js';
import { normalizeMojibake, normalizeMojibakeDeep } from '@/lib/textEncoding.js';

const wait = (ms = 0) => new Promise((resolve) => setTimeout(resolve, ms));
const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
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
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
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

const normalizeArticleRecord = (article = {}) => ({
  ...article,
  title: normalizeMojibake(article.title || ''),
  summary: normalizeMojibake(article.summary || article.excerpt || ''),
  content: normalizeMojibake(article.content || ''),
  publishDate: article.publishDate || article.publishedAt || article.createdAt || new Date().toISOString(),
  readTime: article.readTime || 6,
  image:
    article.image ||
    'https://images.unsplash.com/photo-1554224155-1696413565d3?auto=format&fit=crop&w=1200&q=80',
  category: normalizeMojibake(article.category || article.categoryName || article.category?.name || 'Finanças Pessoais')
});

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
    await wait();
    return portalRepository.listSimulationLeads(filters);
  },

  async updateAdminLeadStatus(id, status) {
    await wait();
    return portalRepository.updateSimulationLeadStatus(id, status);
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
    await wait();
    return portalRepository.getAnalyticsOverview();
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
  }
};
