import { getAdmitadConfig } from './config.js';

let cachedAccessToken = null;
let cachedExpiresAt = 0;

const getValidCachedToken = () => {
  if (!cachedAccessToken || !cachedExpiresAt) return null;
  if (Date.now() >= cachedExpiresAt - 30_000) return null;
  return cachedAccessToken;
};

const loadAccessToken = async () => {
  const config = getAdmitadConfig();
  if (config.accessToken) return config.accessToken;

  const cached = getValidCachedToken();
  if (cached) return cached;

  if (!config.clientId || !config.clientSecret) {
    throw new Error('Admitad credentials are not configured');
  }

  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: config.clientId,
    client_secret: config.clientSecret,
    scope: config.scope
  });

  const response = await fetch(`${config.oauthBaseUrl}/token/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: body.toString()
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Admitad OAuth failed (${response.status}): ${text || 'empty body'}`);
  }

  const payload = await response.json();
  cachedAccessToken = payload.access_token;
  cachedExpiresAt = Date.now() + Number(payload.expires_in || 3600) * 1000;
  return cachedAccessToken;
};

export class AdmitadClient {
  static async request(path, options = {}) {
    const config = getAdmitadConfig();
    const token = await loadAccessToken();

    const response = await fetch(`${config.apiBaseUrl}${path}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
        ...(options.headers || {})
      },
      ...options
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Admitad API request failed (${response.status}): ${text || 'empty body'}`);
    }

    return response.json();
  }
}
