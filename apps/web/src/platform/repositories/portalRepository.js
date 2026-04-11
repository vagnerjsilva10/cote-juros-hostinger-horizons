import {
  appIntegrationSources,
  articles,
  banks,
  categories,
  offers,
  products,
  seoFallbackPaths,
  seoPages,
  testimonials
} from '@/platform/seed/portalSeed.js';

const STORAGE_KEYS = {
  simulationLeads: 'cj.simulationLeads',
  clickEvents: 'cj.clickEvents',
  ctaEvents: 'cj.ctaEvents',
  partnerRedirects: 'cj.partnerRedirects',
  integrationEvents: 'cj.integrationEvents'
};

const memoryStore = {
  simulationLeads: [],
  clickEvents: [],
  ctaEvents: [],
  partnerRedirects: [],
  integrationEvents: []
};

const isBrowser = () => typeof window !== 'undefined';

const safeRead = (key) => {
  if (!isBrowser()) return memoryStore[key] || [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS[key]);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const safeWrite = (key, data) => {
  if (!isBrowser()) {
    memoryStore[key] = data;
    return;
  }
  try {
    window.localStorage.setItem(STORAGE_KEYS[key], JSON.stringify(data));
  } catch {
    // no-op in private mode / quota exceeded
  }
};

const appendEntity = (key, entity) => {
  const data = safeRead(key);
  const next = [...data, entity];
  safeWrite(key, next);
  return entity;
};

const normalize = (text = '') =>
  text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

export const portalRepository = {
  listBanks() {
    return banks;
  },

  listCategories(kind) {
    if (!kind) return categories;
    return categories.filter((category) => category.kind === kind);
  },

  listProducts(type) {
    if (!type) return products;
    return products.filter((product) => product.type === type);
  },

  listOffers(filters = {}) {
    const {
      productType,
      category,
      amount,
      term,
      score,
      freeAnnuity,
      selectedCategories,
      selectedBenefits,
      sort,
      search
    } = filters;

    let result = offers;

    if (productType) {
      result = result.filter((offer) => offer.productType === productType);
    }

    if (category && category !== 'Todos') {
      result = result.filter((offer) => offer.category === category);
    }

    if (typeof amount === 'number') {
      result = result.filter((offer) => {
        if (offer.minValue == null || offer.maxValue == null) return true;
        return amount >= offer.minValue && amount <= offer.maxValue;
      });
    }

    if (typeof term === 'number') {
      result = result.filter((offer) => {
        if (offer.minTerm == null || offer.maxTerm == null) return true;
        return term >= offer.minTerm && term <= offer.maxTerm;
      });
    }

    if (score && score !== 'Todos') {
      result = result.filter((offer) => {
        if (!offer.minScore) return true;
        if (offer.minScore === score) return true;
        if (score === 'Alto' && (offer.minScore === 'Médio' || offer.minScore === 'Baixo')) return true;
        if (score === 'Médio' && offer.minScore === 'Baixo') return true;
        return false;
      });
    }

    if (freeAnnuity) {
      result = result.filter((offer) => offer.annualFee === 0);
    }

    if (selectedCategories?.length) {
      result = result.filter((offer) => selectedCategories.includes(offer.category));
    }

    if (selectedBenefits?.length) {
      result = result.filter((offer) => {
        if (!offer.benefits?.length) return false;
        return selectedBenefits.some((benefit) =>
          offer.benefits.some((item) => normalize(item).includes(normalize(benefit)))
        );
      });
    }

    if (search) {
      const query = normalize(search);
      result = result.filter((offer) => normalize(`${offer.title} ${offer.bankName}`).includes(query));
    }

    if (sort === 'taxa-baixa') result = [...result].sort((a, b) => (a.monthlyRate ?? 999) - (b.monthlyRate ?? 999));
    if (sort === 'valor-maximo') result = [...result].sort((a, b) => (b.maxValue ?? 0) - (a.maxValue ?? 0));
    if (sort === 'prazo-maior') result = [...result].sort((a, b) => (b.maxTerm ?? 0) - (a.maxTerm ?? 0));
    if (sort === 'limite-maior') result = [...result].sort((a, b) => (b.maxLimit ?? 0) - (a.maxLimit ?? 0));
    if (sort === 'anuidade-menor') result = [...result].sort((a, b) => (a.annualFee ?? 999999) - (b.annualFee ?? 999999));

    return result;
  },

  listArticles(filters = {}) {
    const { category, search, sort = 'recent' } = filters;
    let result = articles.filter((article) => article.status !== 'draft');

    if (category && category !== 'Todas') {
      result = result.filter((article) => article.category === category);
    }

    if (search) {
      const query = normalize(search);
      result = result.filter((article) => normalize(`${article.title} ${article.summary}`).includes(query));
    }

    if (sort === 'recent') result = [...result].sort((a, b) => new Date(b.publishDate) - new Date(a.publishDate));
    if (sort === 'read') result = [...result].sort((a, b) => a.readTime - b.readTime);

    return result;
  },

  listSeoPages() {
    return seoPages;
  },

  listSeoFallbackPaths() {
    return seoFallbackPaths;
  },

  listTestimonials() {
    return testimonials;
  },

  listAppIntegrationSources() {
    return appIntegrationSources;
  },

  createSimulationLead(payload) {
    const lead = {
      id: `lead_${Date.now()}`,
      createdAt: new Date().toISOString(),
      ...payload
    };

    return appendEntity('simulationLeads', lead);
  },

  trackClickEvent(payload) {
    const event = {
      id: `click_${Date.now()}`,
      createdAt: new Date().toISOString(),
      ...payload
    };

    return appendEntity('clickEvents', event);
  },

  trackCtaEvent(payload) {
    const event = {
      id: `cta_${Date.now()}`,
      createdAt: new Date().toISOString(),
      ...payload
    };

    return appendEntity('ctaEvents', event);
  },

  createPartnerRedirect(payload) {
    const redirect = {
      id: `redirect_${Date.now()}`,
      ...payload
    };

    return appendEntity('partnerRedirects', redirect);
  },

  createIntegrationEvent(payload) {
    const event = {
      id: `integration_${Date.now()}`,
      createdAt: new Date().toISOString(),
      target: 'cote_finance_ai',
      ...payload
    };

    return appendEntity('integrationEvents', event);
  }
};

