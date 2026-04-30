import { API_CONFIG, apiPost, withMockFallback } from '@/platform/services/apiClient.js';

const STORAGE_KEY = 'cote_tracking_events';

const readStoredEvents = () => {
  try {
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
};

const saveStoredEvent = (event) => {
  const events = readStoredEvents();
  events.push(event);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(events.slice(-100)));
};

const resolveEndpointPayload = (name, data = {}) => {
  if (name === 'partner_clicked') {
    return {
      endpoint: API_CONFIG.endpoints.trackingClicks,
      payload: {
        offerId: data.offerId,
        sourcePage: data.sourcePage || data.source || 'smart_quiz',
        utm_source: data.utm?.utm_source,
        utm_medium: data.utm?.utm_medium,
        utm_campaign: data.utm?.utm_campaign
      }
    };
  }

  if (name === 'dashboard_opened') {
    return {
      endpoint: API_CONFIG.endpoints.trackingIntegrations,
      payload: {
        sourcePage: data.sourcePage || '/dashboard',
        productContext: name,
        simulationId: data.leadId || data.simulationId
      }
    };
  }

  return {
    endpoint: API_CONFIG.endpoints.trackingCta,
    payload: {
      sourcePage: data.sourcePage || data.source || 'smart_quiz',
      ctaName: name,
      destination: data.destination || data.partnerRoute || data.mainProduct || null
    }
  };
};

export const trackEvent = async (name, data = {}) => {
  const event = {
    name,
    data,
    createdAt: new Date().toISOString()
  };

  const { endpoint, payload } = resolveEndpointPayload(name, data);

  return withMockFallback(
    () => apiPost(endpoint, payload),
    (error) => {
      saveStoredEvent({ ...event, error: error?.message || String(error), mode: 'fallback' });
      return { ok: true, mode: 'fallback', event };
    },
    `tracking:${name}`
  );
};

export const trackingAdapter = {
  trackEvent,
  getStoredEvents: readStoredEvents
};
