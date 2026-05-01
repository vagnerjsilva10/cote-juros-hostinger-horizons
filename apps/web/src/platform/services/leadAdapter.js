import { API_CONFIG, apiPatch, apiPost, withMockFallback } from '@/platform/services/apiClient.js';
import { trackEvent } from '@/platform/services/trackingAdapter.js';

const LEAD_STORAGE_KEY = 'cote_lead';
const isProductionRuntime = () =>
  Boolean(import.meta.env.PROD || (typeof window !== 'undefined' && /(^|\.)cotejuros\.(com\.br|br)$/i.test(window.location.hostname)));

const parseMoney = (value) => {
  if (typeof value === 'number') return value;
  const normalized = String(value || '').replace(/\./g, '').replace(',', '.').replace(/[^\d.]/g, '');
  return normalized ? Number(normalized) : undefined;
};

const normalizePhone = (value = '') => String(value || '').replace(/\D/g, '');

const mapLeadToSimulation = (payload = {}) => {
  const answers = payload.quizAnswers || {};
  const recommendation = payload.recommendation || {};

  return {
    productType: recommendation.mainProduct?.toLowerCase().includes('cart') ? 'credit_card' : 'loan',
    requestedAmount: parseMoney(answers.amount ?? answers.valor ?? payload.requestedAmount),
    income: parseMoney(answers.income ?? answers.renda ?? payload.income),
    scoreRange: String(payload.score ?? recommendation.score ?? ''),
    employmentStatus: answers.workType || answers.tipoTrabalho || answers.employmentStatus || payload.employmentStatus,
    hasRestriction: Boolean(answers.hasRestriction ?? answers.negativado ?? payload.hasRestriction),
    fullName: payload.name || payload.fullName,
    phone: normalizePhone(payload.phone || payload.whatsapp),
    profile: payload.profile || recommendation.profile,
    partnerId: recommendation.partnerRoute,
    partnerName: recommendation.mainProduct,
    deliveryMode: 'smart_quiz_adapter',
    status: payload.status || 'new',
    originPage: payload.source || 'smart_quiz',
    utm_source: payload.utm?.utm_source,
    utm_medium: payload.utm?.utm_medium,
    utm_campaign: payload.utm?.utm_campaign
  };
};

export const saveLeadLocally = (payload) => {
  const data = {
    ...payload,
    updatedAt: new Date().toISOString()
  };
  window.localStorage.setItem(LEAD_STORAGE_KEY, JSON.stringify(data));
  return data;
};

export const getLeadFromLocalStorage = () => {
  try {
    return JSON.parse(window.localStorage.getItem(LEAD_STORAGE_KEY) || 'null');
  } catch {
    return null;
  }
};

export const captureLead = async (payload = {}) => {
  const createdAt = new Date().toISOString();
  const localPayload = saveLeadLocally({
    ...payload,
    consent: Boolean(payload.consent),
    source: payload.source || 'smart_quiz',
    createdAt
  });

  const simulationPayload = mapLeadToSimulation(localPayload);
  const endpoint = simulationPayload.fullName && simulationPayload.phone && simulationPayload.income
    ? API_CONFIG.endpoints.quickCredit
    : API_CONFIG.endpoints.leadCapture;

  const apiPayload = endpoint === API_CONFIG.endpoints.quickCredit
    ? {
        productType: simulationPayload.productType,
        requestedAmount: simulationPayload.requestedAmount,
        income: simulationPayload.income || 1000,
        employmentStatus: simulationPayload.employmentStatus || 'nao_informado',
        hasRestriction: Boolean(simulationPayload.hasRestriction),
        fullName: simulationPayload.fullName,
        phone: simulationPayload.phone,
        sourcePage: simulationPayload.originPage,
        originPage: simulationPayload.originPage,
        originLabel: 'smart_quiz',
        utm: payload.utm
      }
    : simulationPayload;

  const result = await withMockFallback(
    () => apiPost(endpoint, apiPayload),
    {
      ok: true,
      mode: 'fallback',
      id: `local_${Date.now()}`,
      lead: localPayload
    },
    'lead:capture'
  );

  const normalized = result?.lead || result;
  saveLeadLocally({
    ...localPayload,
    backend: normalized,
    backendLeadId: normalized?.id || normalized?.lead?.id || result?.id,
    mode: result?.mode || 'api'
  });

  await trackEvent('lead_submitted', {
    sourcePage: localPayload.source,
    leadId: normalized?.id || result?.id,
    score: payload.score,
    recommendation: payload.recommendation?.mainProduct
  });

  return result;
};

export const updateLeadStatus = async (id, status) => {
  if (!id || String(id).startsWith('local_')) {
    if (isProductionRuntime()) {
      throw new Error('Atualizacao de lead local bloqueada em producao.');
    }
    const local = getLeadFromLocalStorage() || {};
    return saveLeadLocally({ ...local, status, mode: 'fallback' });
  }

  return withMockFallback(
    () => apiPatch(`${API_CONFIG.endpoints.leadCapture}/${id}`, { status }),
    () => {
      const local = getLeadFromLocalStorage() || {};
      return saveLeadLocally({ ...local, status, mode: 'fallback' });
    },
    'lead:update-status'
  );
};

export const leadAdapter = {
  captureLead,
  updateLeadStatus,
  getLeadFromLocalStorage,
  saveLeadLocally
};
