import { getLomadeeConfig } from './config.js';

const buildPath = (path, params = {}) => {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value == null || value === '') return;
    if (Array.isArray(value)) {
      if (value.length) query.set(key, value.join(','));
      return;
    }
    query.set(key, String(value));
  });

  return `${path}${query.toString() ? `?${query.toString()}` : ''}`;
};

export class LomadeeClient {
  static async request(path, options = {}) {
    const config = getLomadeeConfig();

    if (!config.apiKey) {
      throw new Error('LOMADEE_API_KEY is not configured');
    }

    const response = await fetch(`${config.apiBaseUrl}${path}`, {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'x-api-key': config.apiKey,
        ...(options.headers || {})
      },
      ...options
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Lomadee API request failed (${response.status}): ${text || 'empty body'}`);
    }

    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) return response.json();
    return response.text();
  }

  static get(path, params = {}) {
    return this.request(buildPath(path, params));
  }

  static post(path, body = {}) {
    return this.request(path, {
      method: 'POST',
      body: JSON.stringify(body)
    });
  }
}
