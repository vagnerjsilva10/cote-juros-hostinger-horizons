import { AwinClient } from '../integrations/awin/client.js';
import { getAwinConfig, isAwinConfigured } from '../integrations/awin/config.js';

export class AwinService {
  static isConfigured() {
    return isAwinConfigured();
  }

  static buildTrackingUrl({ trackingUrl, destinationUrl, clickref }) {
    const config = getAwinConfig();
    const base = trackingUrl || destinationUrl;

    if (!base) return null;

    const url = new URL(base);

    if (clickref) {
      url.searchParams.set(config.clickRefParam, clickref);
    }

    if (destinationUrl && !trackingUrl) {
      url.searchParams.set('p', destinationUrl);
    }

    return url.toString();
  }

  static async previewLinkBuilder(params = {}) {
    if (!this.isConfigured()) {
      return {
        configured: false,
        endpoint: '/publishers/:publisherId/link-builder',
        baseUrl: getAwinConfig().apiBaseUrl
      };
    }

    const publisherId = params.publisherId || getAwinConfig().publisherId;
    if (!publisherId) {
      return {
        configured: true,
        ready: false,
        message: 'AWIN_PUBLISHER_ID is not configured'
      };
    }

    return AwinClient.request(`/publishers/${publisherId}/link-builder`, {
      method: 'POST',
      body: JSON.stringify(params.body || {})
    });
  }
}
