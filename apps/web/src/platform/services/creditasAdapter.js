import { API_CONFIG, apiPost, withMockFallback } from '@/platform/services/apiClient.js';
import { saveLeadLocally } from '@/platform/services/leadAdapter.js';
import { trackEvent } from '@/platform/services/trackingAdapter.js';

const STATUS_STORAGE_KEY = 'cote_creditas_status';

const parseMoney = (value) => {
  if (typeof value === 'number') return value;
  const normalized = String(value || '').replace(/\./g, '').replace(',', '.').replace(/[^\d.]/g, '');
  return normalized ? Number(normalized) : undefined;
};

const onlyDigits = (value = '') => String(value || '').replace(/\D/g, '');

export const saveCreditasStatus = (status) => {
  const data = {
    ...status,
    updatedAt: new Date().toISOString()
  };
  window.localStorage.setItem(STATUS_STORAGE_KEY, JSON.stringify(data));
  return data;
};

export const getCreditasStatus = () => {
  try {
    return JSON.parse(window.localStorage.getItem(STATUS_STORAGE_KEY) || 'null');
  } catch {
    return null;
  }
};

export const isCreditasEligibleRecommendation = (recommendation = {}, quizAnswers = {}) => {
  const requestedAmount = parseMoney(quizAnswers.amount ?? quizAnswers.valor ?? quizAnswers.requestedAmount);
  const income = parseMoney(quizAnswers.monthlyIncome ?? quizAnswers.income ?? quizAnswers.renda);
  const productText = `${recommendation.mainProduct || ''} ${recommendation.partnerRoute || ''}`.toLowerCase();

  if ((recommendation.score || 0) < 60) return false;
  if (productText.includes('garantia') || productText.includes('creditas')) return true;
  if (requestedAmount >= 30000 && income >= 3000) return true;
  return false;
};

export const buildCreditasPayload = ({ lead = {}, quizAnswers = {}, recommendation = {}, extraFields = {} } = {}) => ({
  fullName: lead.name || lead.fullName || extraFields.fullName,
  phone: onlyDigits(lead.phone || lead.whatsapp || extraFields.phone),
  email: lead.email || extraFields.email,
  cpf: onlyDigits(extraFields.cpf || lead.cpf),
  income: parseMoney(quizAnswers.monthlyIncome ?? quizAnswers.income ?? quizAnswers.renda ?? lead.monthlyIncome ?? lead.income ?? extraFields.income),
  requestedAmount: parseMoney(quizAnswers.amount ?? quizAnswers.valor ?? quizAnswers.requestedAmount ?? lead.requestedAmount ?? lead.amount ?? extraFields.requestedAmount),
  productType: 'loan',
  guaranteeType: extraFields.guaranteeType,
  assetValue: parseMoney(extraFields.assetValue),
  city: extraFields.city,
  state: extraFields.state,
  consent: extraFields.consent === true,
  sourcePage: extraFields.sourcePage || lead.source || 'cotejuros-platform',
  quizAnswers,
  recommendation
});

const fallbackCreditas = (payload, error) => {
  const fallback = {
    ok: false,
    mode: 'fallback',
    provider: 'creditas',
    status: 'saved_for_followup',
    message: 'Não conseguimos consultar a parceira agora. Seus dados foram salvos para continuidade.',
    error: error?.message || String(error)
  };

  saveCreditasStatus(fallback);
  saveLeadLocally({
    ...payload,
    creditas: fallback,
    status: 'creditas_saved_for_followup'
  });

  return fallback;
};

export const checkCreditasEligibility = async (payload = {}) => {
  await trackEvent('creditas_eligibility_requested', {
    sourcePage: payload.sourcePage || 'cotejuros-platform',
    guaranteeType: payload.guaranteeType
  });

  const result = await withMockFallback(
    () => apiPost(API_CONFIG.endpoints.creditasEligibility, payload),
    (error) => fallbackCreditas(payload, error),
    'creditas:eligibility'
  );

  if (result?.mode === 'missing_required_data') {
    await trackEvent('creditas_eligibility_missing_data', {
      sourcePage: payload.sourcePage || 'cotejuros-platform',
      requiredFields: (result.requiredFields || []).join(',')
    });
  } else if (result?.ok) {
    await trackEvent('creditas_eligibility_success', {
      sourcePage: payload.sourcePage || 'cotejuros-platform',
      status: result.status
    });
  }

  saveCreditasStatus(result);
  return result;
};

export const submitCreditasLead = async (payload = {}) => {
  const result = await withMockFallback(
    () => apiPost(API_CONFIG.endpoints.creditasLead, payload),
    (error) => fallbackCreditas(payload, error),
    'creditas:lead'
  );

  await trackEvent(result?.ok ? 'creditas_lead_submitted' : 'creditas_lead_failed', {
    sourcePage: payload.sourcePage || 'cotejuros-platform',
    status: result?.status || result?.mode
  });

  saveCreditasStatus(result);
  saveLeadLocally({
    ...payload,
    creditas: result,
    status: result?.status || result?.mode || 'creditas_checked'
  });

  return result;
};

export const creditasAdapter = {
  checkCreditasEligibility,
  submitCreditasLead,
  buildCreditasPayload,
  isCreditasEligibleRecommendation,
  getCreditasStatus,
  saveCreditasStatus
};
