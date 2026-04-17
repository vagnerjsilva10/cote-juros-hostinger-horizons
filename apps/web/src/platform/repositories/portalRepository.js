import {
  appIntegrationSources,
  articles as articlesSeed,
  banks as banksSeed,
  categories,
  offers as offersSeed,
  products,
  seoFallbackPaths as seoFallbackPathsSeed,
  seoPages as seoPagesSeed,
  testimonials as testimonialsSeed
} from '@/platform/seed/portalSeed.js';
import { affiliateOffersSeed as affiliateSeed } from '@/platform/seed/affiliateSeed.js';
import { normalizeArticleData } from '@/lib/content/articles.js';

const defaultPartnersSeed = banksSeed.map((bank) => ({
  id: `partner-${bank.id}`,
  name: `${bank.name} Afiliados`,
  slug: toSlug(`${bank.name}-afiliados`),
  bankId: bank.id,
  status: 'active',
  integrationType: 'tracking_link',
  healthStatus: 'healthy',
  priority: 50,
  weight: 1,
  productTypes: ['loan', 'credit_card', 'financing'],
  redirectRules: 'default',
  trackingLink: bank.website ? `https://${bank.website}` : 'https://www.cotejuros.com.br/emprestimos',
  webhookUrl: '',
  apiBaseUrl: '',
  fallbackPartnerId: '',
  dailyLimit: null,
  monthlyLimit: null,
  slaMinutes: null,
  payoutLeadCents: null,
  payoutConversionCents: null,
  internalNotes: '',
  metadata: null,
  lastHealthCheckAt: null,
  lastErrorAt: null,
  lastErrorMessage: '',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
}));

const defaultSettingsSeed = {
  defaultCtaDestination: 'https://www.cotejuros.com.br/emprestimos',
  coteFinanceAiBaseUrl: 'https://finance.cotejuros.com.br',
  coteFinanceAiDashboardUrl: 'https://finance.cotejuros.com.br',
  supportEmail: 'suporte@cotejuros.com.br',
  socialLinks: {
    linkedin: '',
    instagram: '',
    twitter: '',
    facebook: ''
  },
  defaultSeo: {
    titleSuffix: ' - Cote Juros',
    defaultDescription: 'Compare ofertas financeiras com inteligência.'
  },
  analytics: {
    ga4Key: '',
    metaPixelKey: ''
  },
  sourceTagging: {
    enabled: true,
    sourceParamName: 'utm_source',
    mediumParamName: 'utm_medium',
    campaignParamName: 'utm_campaign'
  },
  updatedAt: new Date().toISOString()
};

const STORAGE_KEYS = {
  banks: 'cj.banks',
  offers: 'cj.offers',
  affiliateOffers: 'cj.affiliateOffers',
  articles: 'cj.articles.v5',
  seoPages: 'cj.seoPages',
  seoFallbackPaths: 'cj.seoFallbackPaths',
  testimonials: 'cj.testimonials',
  partners: 'cj.partners',
  settings: 'cj.settings',
  simulationLeads: 'cj.simulationLeads',
  clickEvents: 'cj.clickEvents',
  affiliateClicks: 'cj.affiliateClicks',
  ctaEvents: 'cj.ctaEvents',
  partnerRedirects: 'cj.partnerRedirects',
  integrationEvents: 'cj.integrationEvents'
};

const memoryStore = {
  banks: null,
  offers: null,
  affiliateOffers: null,
  articles: null,
  seoPages: null,
  seoFallbackPaths: null,
  testimonials: null,
  partners: null,
  settings: null,
  simulationLeads: [],
  clickEvents: [],
  affiliateClicks: [],
  ctaEvents: [],
  partnerRedirects: [],
  integrationEvents: []
};

const isBrowser = () => typeof window !== 'undefined';

const deepClone = (value) => JSON.parse(JSON.stringify(value));

const initialDataFor = (key) => {
  if (key === 'banks') return deepClone(banksSeed);
  if (key === 'offers') return deepClone(offersSeed);
  if (key === 'articles') return deepClone(articlesSeed.map((article) => normalizeArticleData(article)));
  if (key === 'seoPages') return deepClone(seoPagesSeed.map((page) => ({ ...page, status: page.status || 'published' })));
  if (key === 'seoFallbackPaths') return deepClone(seoFallbackPathsSeed);
  if (key === 'testimonials') return deepClone(testimonialsSeed.map((item) => ({ ...item, status: item.status || 'active', featured: item.featured ?? true })));
  if (key === 'partners') return deepClone(defaultPartnersSeed);
  if (key === 'settings') return deepClone(defaultSettingsSeed);
  if (key === 'affiliateOffers') return deepClone(affiliateSeed);
  if (key === 'affiliateClicks') return [];
  return [];
};

const normalizeStoredCollection = (key, value) => {
  if (key !== 'articles' || !Array.isArray(value)) return value;
  return value.map((article) => normalizeArticleData(article));
};

const safeRead = (key) => {
  if (!isBrowser()) {
    if (memoryStore[key] == null) memoryStore[key] = initialDataFor(key);
    return memoryStore[key];
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS[key]);
    if (!raw) return initialDataFor(key);
    return normalizeStoredCollection(key, JSON.parse(raw));
  } catch {
    return initialDataFor(key);
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
    // no-op for private mode/quota
  }
};

const appendEntity = (key, entity) => {
  const list = safeRead(key);
  const next = [...list, entity];
  safeWrite(key, next);
  return entity;
};

const upsertEntity = (key, entity) => {
  const list = safeRead(key);
  const idx = list.findIndex((item) => item.id === entity.id);
  if (idx >= 0) {
    const next = [...list];
    next[idx] = { ...next[idx], ...entity };
    safeWrite(key, next);
    return next[idx];
  }

  const next = [...list, entity];
  safeWrite(key, next);
  return entity;
};

const normalize = (text = '') =>
  String(text)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

const toSlug = (value = '') =>
  normalize(value)
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

const parseDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const sortByDateDesc = (a, b, field = 'createdAt') => {
  const dateA = parseDate(a?.[field]) || new Date(0);
  const dateB = parseDate(b?.[field]) || new Date(0);
  return dateB - dateA;
};

const withUpdatedAt = (value) => ({ ...value, updatedAt: new Date().toISOString() });

const ensureArticleDefaults = (article) =>
  normalizeArticleData({
    id: article.id || `article_${Date.now()}`,
    title: article.title || 'Novo artigo',
    slug: article.slug || toSlug(article.title || 'novo-artigo'),
    summary: article.summary || article.excerpt || '',
    excerpt: article.excerpt || article.summary || '',
    content: article.content || '',
  category: article.category || 'Finanças Pessoais',
  status: article.status || 'draft',
  seoTitle: article.seoTitle || article.title || 'Novo artigo',
  seoDescription: article.seoDescription || article.summary || '',
  image: article.image || '',
  publishDate: article.publishDate || new Date().toISOString(),
  readTime: article.readTime || 6,
  createdAt: article.createdAt || new Date().toISOString(),
  updatedAt: article.updatedAt || new Date().toISOString()
});

const ensureSeoPageDefaults = (page) => {
  const slug = page.slug || (page.path ? page.path.replace(/^\//, '') : toSlug(page.title || 'nova-pagina'));
  return {
    id: page.id || `seo_${Date.now()}`,
    slug,
    path: `/${slug}`,
    title: page.title || 'Nova página SEO',
    description: page.description || '',
    heading: page.heading || page.title || '',
    content: Array.isArray(page.content) ? page.content : [page.heroCopy || '', page.ctaCopy || ''].filter(Boolean),
    heroCopy: page.heroCopy || page.heading || '',
    ctaCopy: page.ctaCopy || 'Compare agora',
    type: page.type || page.productType || 'all',
    category: page.category || '',
    status: page.status || 'draft',
    createdAt: page.createdAt || new Date().toISOString(),
    updatedAt: page.updatedAt || new Date().toISOString()
  };
};

const ensureOfferDefaults = (offer) => ({
  id: offer.id || `offer_${Date.now()}`,
  title: offer.title || 'Nova oferta',
  bankId: offer.bankId || '',
  bankName: offer.bankName || '',
  productType: offer.productType || 'loan',
  category: offer.category || 'Pessoal',
  monthlyRate: offer.monthlyRate != null ? Number(offer.monthlyRate) : null,
  annualRate: offer.annualRate != null ? Number(offer.annualRate) : null,
  minValue: offer.minValue != null ? Number(offer.minValue) : null,
  maxValue: offer.maxValue != null ? Number(offer.maxValue) : null,
  minTerm: offer.minTerm != null ? Number(offer.minTerm) : null,
  maxTerm: offer.maxTerm != null ? Number(offer.maxTerm) : null,
  minScore: offer.minScore || '',
  minDownPayment: offer.minDownPayment != null ? Number(offer.minDownPayment) : null,
  redirectUrl: offer.redirectUrl || 'https://www.cotejuros.com.br/emprestimos',
  partnerTrackingUrl: offer.partnerTrackingUrl || '',
  isFeatured: Boolean(offer.isFeatured),
  status: offer.status || 'active',
  benefits: Array.isArray(offer.benefits) ? offer.benefits : [],
  createdAt: offer.createdAt || new Date().toISOString(),
  updatedAt: offer.updatedAt || new Date().toISOString()
});

const ensureBankDefaults = (bank) => ({
  id: bank.id || `bank_${Date.now()}`,
  name: bank.name || 'Novo banco',
  slug: bank.slug || toSlug(bank.name || `banco-${Date.now()}`),
  logoUrl: bank.logoUrl || '',
  color: bank.color || '#111827',
  website: bank.website || '',
  status: bank.status || 'active',
  createdAt: bank.createdAt || new Date().toISOString(),
  updatedAt: bank.updatedAt || new Date().toISOString()
});

const ensurePartnerDefaults = (partner) => ({
  id: partner.id || `partner_${Date.now()}`,
  name: partner.name || 'Novo parceiro',
  slug: partner.slug || toSlug(partner.name || `parceiro-${Date.now()}`),
  bankId: partner.bankId || '',
  trackingLink: partner.trackingLink || '',
  webhookUrl: partner.webhookUrl || '',
  apiBaseUrl: partner.apiBaseUrl || '',
  integrationType: partner.integrationType || 'tracking_link',
  healthStatus: partner.healthStatus || 'unknown',
  priority: partner.priority != null ? Number(partner.priority) : 50,
  weight: partner.weight != null ? Number(partner.weight) : 1,
  fallbackPartnerId: partner.fallbackPartnerId || '',
  dailyLimit: partner.dailyLimit != null ? Number(partner.dailyLimit) : null,
  monthlyLimit: partner.monthlyLimit != null ? Number(partner.monthlyLimit) : null,
  slaMinutes: partner.slaMinutes != null ? Number(partner.slaMinutes) : null,
  payoutLeadCents: partner.payoutLeadCents != null ? Number(partner.payoutLeadCents) : null,
  payoutConversionCents: partner.payoutConversionCents != null ? Number(partner.payoutConversionCents) : null,
  internalNotes: partner.internalNotes || '',
  metadata: partner.metadata || null,
  lastHealthCheckAt: partner.lastHealthCheckAt || null,
  lastErrorAt: partner.lastErrorAt || null,
  lastErrorMessage: partner.lastErrorMessage || '',
  productTypes: Array.isArray(partner.productTypes) ? partner.productTypes : [],
  redirectRules: partner.redirectRules || 'default',
  status: partner.status || 'active',
  createdAt: partner.createdAt || new Date().toISOString(),
  updatedAt: partner.updatedAt || new Date().toISOString()
});

const ensureTestimonialDefaults = (item) => ({
  id: item.id || `testimonial_${Date.now()}`,
  name: item.name || 'Cliente',
  location: item.location || item.city || '',
  city: item.city || item.location || '',
  quote: item.quote || item.text || '',
  text: item.text || item.quote || '',
  product: item.product || item.productType || 'loan',
  productType: item.productType || item.product || 'loan',
  status: item.status || 'active',
  featured: item.featured ?? false,
  createdAt: item.createdAt || new Date().toISOString(),
  updatedAt: item.updatedAt || new Date().toISOString()
});

const filterLeadByDate = (lead, from, to) => {
  if (!from && !to) return true;
  const createdAt = parseDate(lead.createdAt);
  if (!createdAt) return false;
  if (from) {
    const fromDate = parseDate(from);
    if (fromDate && createdAt < fromDate) return false;
  }
  if (to) {
    const toDate = parseDate(to);
    if (toDate && createdAt > toDate) return false;
  }
  return true;
};

export const portalRepository = {
  listBanks() {
    return safeRead('banks').filter((bank) => bank.status !== 'inactive');
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

    let result = safeRead('offers').filter((offer) => offer.status !== 'inactive');

    if (productType) result = result.filter((offer) => offer.productType === productType);

    if (category && category !== 'Todos') result = result.filter((offer) => offer.category === category);

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

    if (freeAnnuity) result = result.filter((offer) => offer.annualFee === 0);

    if (selectedCategories?.length) result = result.filter((offer) => selectedCategories.includes(offer.category));

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

  listAffiliateOffers(filters = {}) {
    const { pageSlug, position, productType, limit } = filters;
    let result = safeRead('affiliateOffers');

    if (productType) result = result.filter((offer) => offer.productType === productType);
    if (pageSlug) result = result.filter((offer) => Array.isArray(offer.pageSlugs) && offer.pageSlugs.includes(pageSlug));
    if (position) result = result.filter((offer) => Array.isArray(offer.placements) && offer.placements.includes(position));

    result = [...result].sort((a, b) => (b.priority || 0) - (a.priority || 0));
    return typeof limit === 'number' ? result.slice(0, limit) : result;
  },

  listAffiliatePlacements({ pageSlug, productType } = {}) {
    const offers = this.listAffiliateOffers({ pageSlug, productType });
    const placements = {};

    offers.forEach((offer) => {
      (offer.placements || []).forEach((placement) => {
        if (!placements[placement]) placements[placement] = [];
        placements[placement].push(offer);
      });
    });

    return {
      pageSlug,
      productType: productType || null,
      placements
    };
  },

  trackAffiliateClick(payload) {
    const event = {
      id: `affiliate_click_${Date.now()}`,
      createdAt: new Date().toISOString(),
      ...payload
    };
    appendEntity('affiliateClicks', event);

    const offer = safeRead('affiliateOffers').find((item) => item.offerSlug === payload.offerSlug);
    const clickref = payload.clickref || `${String(payload.pageSlug || '/').replace(/^\/+/, '').replace(/\//g, '-') || 'home'}|${payload.position}|${payload.offerSlug}|${payload.device}`;

    return {
      offer,
      clickref,
      device: payload.device,
      redirectUrl: offer?.trackingUrl
        ? `${offer.trackingUrl}${offer.trackingUrl.includes('?') ? '&' : '?'}clickref=${encodeURIComponent(clickref)}`
        : offer?.destinationUrl || null
    };
  },

  listArticles(filters = {}) {
    const { category, search, sort = 'recent', includeDrafts = false } = filters;
    let result = safeRead('articles');

    if (!includeDrafts) result = result.filter((article) => article.status !== 'draft');

    if (category && category !== 'Todas') result = result.filter((article) => article.category === category);

    if (search) {
      const query = normalize(search);
      result = result.filter((article) => normalize(`${article.title} ${article.summary}`).includes(query));
    }

    if (sort === 'recent') result = [...result].sort((a, b) => sortByDateDesc(a, b, 'publishDate'));
    if (sort === 'read') result = [...result].sort((a, b) => (b.readTime ?? 0) - (a.readTime ?? 0));

    return result.map((article) => normalizeArticleData(article));
  },

  getArticleBySlug(slug) {
    const matched = safeRead('articles').find((article) => toSlug(article.slug || article.title || article.id) === toSlug(slug)) || null;
    return matched ? normalizeArticleData(matched) : null;
  },

  listSeoPages() {
    return safeRead('seoPages').filter((page) => page.status !== 'draft' && page.status !== 'unpublished');
  },

  listSeoFallbackPaths() {
    return safeRead('seoFallbackPaths');
  },

  listTestimonials() {
    return safeRead('testimonials').filter((item) => item.status !== 'inactive');
  },

  listAppIntegrationSources() {
    return appIntegrationSources;
  },

  createSimulationLead(payload) {
    const lead = {
      id: `lead_${Date.now()}`,
      createdAt: new Date().toISOString(),
      status: 'new',
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
    const redirect = { id: `redirect_${Date.now()}`, createdAt: new Date().toISOString(), ...payload };
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
  },

  listAdminOffers(filters = {}) {
    const { search, productType, status, bankId } = filters;
    let data = safeRead('offers');
    if (productType && productType !== 'all') data = data.filter((item) => item.productType === productType);
    if (status && status !== 'all') data = data.filter((item) => item.status === status);
    if (bankId && bankId !== 'all') data = data.filter((item) => item.bankId === bankId);
    if (search) {
      const query = normalize(search);
      data = data.filter((item) => normalize(`${item.title} ${item.bankName}`).includes(query));
    }
    return data.sort((a, b) => sortByDateDesc(a, b, 'updatedAt'));
  },

  saveAdminOffer(payload) {
    const banks = safeRead('banks');
    const bank = banks.find((item) => item.id === payload.bankId);
    const offer = ensureOfferDefaults({ ...payload, bankName: bank?.name || payload.bankName || '' });
    return upsertEntity('offers', withUpdatedAt(offer));
  },

  toggleOfferStatus(id) {
    const offers = safeRead('offers');
    const current = offers.find((item) => item.id === id);
    if (!current) return null;
    const nextStatus = current.status === 'inactive' ? 'active' : 'inactive';
    return upsertEntity('offers', withUpdatedAt({ ...current, status: nextStatus }));
  },

  listAdminBanks(filters = {}) {
    const { search, status } = filters;
    let data = safeRead('banks');
    if (status && status !== 'all') data = data.filter((item) => item.status === status);
    if (search) {
      const query = normalize(search);
      data = data.filter((item) => normalize(item.name).includes(query));
    }
    return data.sort((a, b) => normalize(a.name).localeCompare(normalize(b.name)));
  },

  saveAdminBank(payload) {
    return upsertEntity('banks', withUpdatedAt(ensureBankDefaults(payload)));
  },

  toggleBankStatus(id) {
    const banks = safeRead('banks');
    const current = banks.find((item) => item.id === id);
    if (!current) return null;
    const nextStatus = current.status === 'inactive' ? 'active' : 'inactive';
    return upsertEntity('banks', withUpdatedAt({ ...current, status: nextStatus }));
  },

  listAdminPartners(filters = {}) {
    const { search, status, healthStatus, integrationType } = filters;
    let data = safeRead('partners');
    if (status && status !== 'all') data = data.filter((item) => item.status === status);
    if (healthStatus && healthStatus !== 'all') data = data.filter((item) => item.healthStatus === healthStatus);
    if (integrationType && integrationType !== 'all') data = data.filter((item) => item.integrationType === integrationType);
    if (search) {
      const query = normalize(search);
      data = data.filter((item) => normalize(`${item.name} ${item.redirectRules} ${item.slug || ''}`).includes(query));
    }
    return data.sort((a, b) => (b.priority || 0) - (a.priority || 0));
  },

  saveAdminPartner(payload) {
    return upsertEntity('partners', withUpdatedAt(ensurePartnerDefaults(payload)));
  },

  togglePartnerStatus(id) {
    const partners = safeRead('partners');
    const current = partners.find((item) => item.id === id);
    if (!current) return null;
    const nextStatus = current.status === 'inactive' ? 'active' : 'inactive';
    return upsertEntity('partners', withUpdatedAt({ ...current, status: nextStatus }));
  },

  listAdminArticles(filters = {}) {
    const { search, status } = filters;
    let data = safeRead('articles');
    if (status && status !== 'all') data = data.filter((item) => item.status === status);
    if (search) {
      const query = normalize(search);
      data = data.filter((item) => normalize(`${item.title} ${item.summary}`).includes(query));
    }
    return data.sort((a, b) => sortByDateDesc(a, b, 'updatedAt'));
  },

  saveAdminArticle(payload) {
    return upsertEntity('articles', withUpdatedAt(ensureArticleDefaults(payload)));
  },

  toggleArticlePublish(id) {
    const articles = safeRead('articles');
    const current = articles.find((item) => item.id === id);
    if (!current) return null;
    const nextStatus = current.status === 'published' ? 'draft' : 'published';
    return upsertEntity('articles', withUpdatedAt({ ...current, status: nextStatus }));
  },

  listAdminSeoPages(filters = {}) {
    const { search, status } = filters;
    let data = safeRead('seoPages');
    if (status && status !== 'all') data = data.filter((item) => item.status === status);
    if (search) {
      const query = normalize(search);
      data = data.filter((item) => normalize(`${item.title} ${item.path}`).includes(query));
    }
    return data.sort((a, b) => sortByDateDesc(a, b, 'updatedAt'));
  },

  saveAdminSeoPage(payload) {
    const page = ensureSeoPageDefaults(payload);
    return upsertEntity('seoPages', withUpdatedAt(page));
  },

  toggleSeoPagePublish(id) {
    const pages = safeRead('seoPages');
    const current = pages.find((item) => item.id === id);
    if (!current) return null;
    const nextStatus = current.status === 'published' ? 'unpublished' : 'published';
    return upsertEntity('seoPages', withUpdatedAt({ ...current, status: nextStatus }));
  },

  listSimulationLeads(filters = {}) {
    const { from, to, sourcePage, productType, status } = filters;
    let data = safeRead('simulationLeads');

    if (sourcePage && sourcePage !== 'all') {
      data = data.filter((item) => (item.sourcePage || item.originPage) === sourcePage);
    }

    if (productType && productType !== 'all') {
      data = data.filter((item) => (item.productType || item.product_type) === productType);
    }

    if (status && status !== 'all') {
      data = data.filter((item) => (item.status || 'new') === status);
    }

    data = data.filter((lead) => filterLeadByDate(lead, from, to));

    return data.sort((a, b) => sortByDateDesc(a, b, 'createdAt'));
  },

  updateSimulationLeadStatus(id, status) {
    const leads = safeRead('simulationLeads');
    const lead = leads.find((item) => item.id === id);
    if (!lead) return null;
    return upsertEntity('simulationLeads', withUpdatedAt({ ...lead, status }));
  },

  updateSimulationLead(id, patch = {}) {
    const leads = safeRead('simulationLeads');
    const lead = leads.find((item) => item.id === id);
    if (!lead) return null;
    return upsertEntity('simulationLeads', withUpdatedAt({ ...lead, ...patch }));
  },

  listAdminTestimonials(filters = {}) {
    const { search, status } = filters;
    let data = safeRead('testimonials');
    if (status && status !== 'all') data = data.filter((item) => item.status === status);
    if (search) {
      const query = normalize(search);
      data = data.filter((item) => normalize(`${item.name} ${item.quote || item.text}`).includes(query));
    }
    return data.sort((a, b) => sortByDateDesc(a, b, 'updatedAt'));
  },

  saveAdminTestimonial(payload) {
    return upsertEntity('testimonials', withUpdatedAt(ensureTestimonialDefaults(payload)));
  },

  toggleTestimonialStatus(id) {
    const data = safeRead('testimonials');
    const current = data.find((item) => item.id === id);
    if (!current) return null;
    const nextStatus = current.status === 'inactive' ? 'active' : 'inactive';
    return upsertEntity('testimonials', withUpdatedAt({ ...current, status: nextStatus }));
  },

  getSettings() {
    return safeRead('settings');
  },

  updateSettings(payload) {
    const current = safeRead('settings');
    const next = withUpdatedAt({ ...current, ...payload, socialLinks: { ...current.socialLinks, ...payload.socialLinks }, defaultSeo: { ...current.defaultSeo, ...payload.defaultSeo }, analytics: { ...current.analytics, ...payload.analytics }, sourceTagging: { ...current.sourceTagging, ...payload.sourceTagging } });
    safeWrite('settings', next);
    return next;
  },

  getAnalyticsOverview() {
    const leads = safeRead('simulationLeads');
    const clicks = safeRead('clickEvents');
    const ctaClicks = safeRead('ctaEvents');
    const integrations = safeRead('integrationEvents');
    const offers = safeRead('offers');

    const leadsByProductType = leads.reduce((acc, lead) => {
      const key = lead.productType || 'unknown';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    const clicksByOfferMap = clicks.reduce((acc, click) => {
      const offerId = click.offerId || 'unknown';
      acc[offerId] = (acc[offerId] || 0) + 1;
      return acc;
    }, {});

    const clicksByOffer = Object.entries(clicksByOfferMap)
      .map(([offerId, count]) => {
        const offer = offers.find((item) => item.id === offerId);
        return { offerId, offerTitle: offer?.title || 'Oferta desconhecida', count };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const pagesMap = leads.reduce((acc, lead) => {
      const page = lead.sourcePage || lead.originPage || 'desconhecida';
      acc[page] = (acc[page] || 0) + 1;
      return acc;
    }, {});

    const topConvertingPages = Object.entries(pagesMap)
      .map(([page, count]) => ({ page, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalLeads: leads.length,
      leadsByProductType,
      clicksByOffer,
      ctaClicks: ctaClicks.length,
      appIntegrationEvents: integrations.length,
      topConvertingPages,
      recentSimulationActivity: [...leads].sort((a, b) => sortByDateDesc(a, b, 'createdAt')).slice(0, 8)
    };
  }
};
