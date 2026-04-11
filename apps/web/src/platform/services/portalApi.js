import { portalRepository } from '@/platform/repositories/portalRepository.js';

const wait = (ms = 0) => new Promise((resolve) => setTimeout(resolve, ms));

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
    await wait();
    return portalRepository.listOffers(filters);
  },

  async getArticles(filters) {
    await wait();
    return portalRepository.listArticles(filters);
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
    await wait();
    return portalRepository.createSimulationLead(payload);
  },

  async trackClick(payload) {
    await wait();
    return portalRepository.trackClickEvent(payload);
  },

  async trackCta(payload) {
    await wait();
    return portalRepository.trackCtaEvent(payload);
  },

  async createPartnerRedirect(payload) {
    await wait();
    return portalRepository.createPartnerRedirect(payload);
  },

  async trackIntegration(payload) {
    await wait();
    return portalRepository.createIntegrationEvent(payload);
  }
};

