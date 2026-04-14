import { getAwinConfig } from './config.js';

export class AwinClient {
  static async request(path, options = {}) {
    const config = getAwinConfig();

    if (!config.token) {
      throw new Error('AWIN_API_TOKEN is not configured');
    }

    const response = await fetch(`${config.apiBaseUrl}${path}`, {
      headers: {
        Authorization: `Bearer ${config.token}`,
        'Content-Type': 'application/json',
        ...(options.headers || {})
      },
      ...options
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Awin API request failed (${response.status}): ${body || 'empty body'}`);
    }

    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      return response.json();
    }

    return response.text();
  }
}
