const DEFAULT_API_BASE_URL = 'https://api.cotejuros.com.br';

export const API_CONFIG = {
  baseUrl: (import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL).replace(/\/$/, ''),
  endpoints: {
    leadCapture: '/api/simulations',
    quickCredit: '/api/simulations/quick-credit',
    quizSubmit: '/api/simulations/quick-credit',
    recommendations: '/api/recommendations',
    creditOffers: '/api/offers',
    insuranceOffers: '/api/offers/insurance',
    partnerRedirect: '/api/partners/redirect',
    partnerMockApi: '/api/partners/mock-api',
    creditasEligibility: '/api/credit/creditas/eligibility',
    creditasOffers: '/api/credit/creditas/offers',
    creditasProposals: '/api/credit/creditas/proposals',
    trackingCta: '/api/tracking/cta',
    trackingClicks: '/api/tracking/clicks',
    trackingIntegrations: '/api/tracking/integrations'
  }
};

const buildUrl = (path) => {
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_CONFIG.baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
};

export const normalizeApiError = (error) => {
  if (error?.name === 'AbortError') {
    return {
      message: 'A API demorou para responder.',
      code: 'REQUEST_TIMEOUT',
      status: 0,
      originalError: error
    };
  }

  return {
    message: error?.message || 'Não foi possível conectar à API.',
    code: error?.code || 'API_REQUEST_FAILED',
    status: error?.status || 0,
    details: error?.details || null,
    originalError: error
  };
};

const request = async (path, { method = 'GET', payload, headers, signal, timeoutMs = 15000 } = {}) => {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(buildUrl(path), {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(headers || {})
      },
      credentials: 'include',
      signal: signal || controller.signal,
      body: payload === undefined ? undefined : JSON.stringify(payload)
    });

    const contentType = response.headers.get('content-type') || '';
    const body = contentType.includes('application/json') ? await response.json() : null;

    if (!response.ok) {
      const error = new Error(body?.message || body?.error || `API request failed (${response.status})`);
      error.status = response.status;
      error.code = body?.code || null;
      error.details = body?.details || body || null;
      throw error;
    }

    return body?.data ?? body;
  } catch (error) {
    throw normalizeApiError(error);
  } finally {
    window.clearTimeout(timeoutId);
  }
};

export const apiGet = (path, options) => request(path, { ...options, method: 'GET' });

export const apiPost = (path, payload, options) => request(path, { ...options, method: 'POST', payload });

export const apiPatch = (path, payload, options) => request(path, { ...options, method: 'PATCH', payload });

export const withMockFallback = async (realCall, fallbackData, context = 'api') => {
  try {
    return await realCall();
  } catch (error) {
    const fallback = typeof fallbackData === 'function' ? fallbackData(error) : fallbackData;
    console.warn(`[${context}] usando fallback controlado`, {
      error: error?.message || String(error),
      fallbackMode: fallback?.mode || 'mock'
    });
    return fallback;
  }
};
