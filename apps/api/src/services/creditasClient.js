import { checkCreditasEligibility as requestCreditasEligibility } from '../integrations/creditas/eligibility.js';
import { getCreditasAccessToken } from '../integrations/creditas/client.js';
import { CreditasIntegrationError } from '../integrations/creditas/errors.js';

const REQUIRED_FIELDS = [
  'fullName',
  'phone',
  'email',
  'cpf',
  'income',
  'requestedAmount',
  'productType',
  'guaranteeType',
  'city',
  'state',
  'consent'
];

const normalizeDigits = (value = '') => String(value || '').replace(/\D/g, '');

const normalizeString = (value = '') => String(value || '').trim();

const normalizeMoney = (value) => {
  if (typeof value === 'number') return Number.isFinite(value) && value > 0 ? value : null;
  const normalized = String(value || '').replace(/\./g, '').replace(',', '.').replace(/[^\d.]/g, '');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

const normalizeGuaranteeType = (value = '') => {
  const text = normalizeString(value).toLowerCase();
  if (['home', 'imovel', 'imóvel', 'home_equity', 'real_estate'].includes(text)) return 'home';
  if (['auto', 'vehicle', 'veiculo', 'veículo', 'car', 'auto_equity'].includes(text)) return 'vehicle';
  return text;
};

const resolveCreditasProductType = (payload = {}) => {
  const guaranteeType = normalizeGuaranteeType(payload.guaranteeType);
  if (guaranteeType === 'home') return 'HOME_REFINANCING';
  if (guaranteeType === 'vehicle') return 'AUTO_REFINANCING';

  const productType = normalizeString(payload.productType).toUpperCase();
  if (productType.includes('HOME')) return 'HOME_REFINANCING';
  return 'AUTO_REFINANCING';
};

const toPublicPayload = (payload = {}) => ({
  fullName: normalizeString(payload.fullName || payload.name),
  phone: normalizeDigits(payload.phone || payload.whatsapp),
  email: normalizeString(payload.email).toLowerCase(),
  cpf: normalizeDigits(payload.cpf),
  income: normalizeMoney(payload.income),
  requestedAmount: normalizeMoney(payload.requestedAmount || payload.amount),
  productType: normalizeString(payload.productType || 'loan'),
  guaranteeType: normalizeGuaranteeType(payload.guaranteeType),
  assetValue: normalizeMoney(payload.assetValue),
  city: normalizeString(payload.city),
  state: normalizeString(payload.state).toUpperCase(),
  consent: payload.consent === true,
  sourcePage: normalizeString(payload.sourcePage || 'cotejuros-platform'),
  quizAnswers: payload.quizAnswers || null,
  recommendation: payload.recommendation || null
});

const findMissingRequiredFields = (payload = {}) => {
  const normalized = toPublicPayload(payload);
  return REQUIRED_FIELDS.filter((field) => {
    if (field === 'consent') return normalized.consent !== true;
    return normalized[field] === null || normalized[field] === undefined || normalized[field] === '';
  });
};

export const normalizeCreditasResponse = (response = {}, context = {}) => {
  const rawEligible = response?.eligible ?? response?.isEligible ?? response?.approved ?? response?.data?.eligible;
  const eligible = rawEligible === undefined ? null : Boolean(rawEligible);
  const status = response?.status || response?.data?.status || (eligible === false ? 'not_eligible' : 'eligibility_consulted');

  return {
    ok: true,
    mode: 'api',
    provider: 'creditas',
    productType: context.productType || null,
    guaranteeType: context.guaranteeType || null,
    eligible,
    status,
    message: eligible === false
      ? 'Nao elegivel no momento.'
      : 'Elegibilidade consultada. Condicoes dependem da avaliacao da parceira.',
    externalId: response?.id || response?.data?.id || response?.externalId || null
  };
};

export const normalizeCreditasError = (error) => ({
  ok: false,
  mode: 'creditas_error',
  provider: 'creditas',
  status: error?.statusCode || error?.status || 502,
  code: error?.code || 'CREDITAS_REQUEST_FAILED',
  message: error instanceof CreditasIntegrationError
    ? 'Nao conseguimos consultar a parceira agora.'
    : 'Erro inesperado ao consultar a parceira.',
  retryable: ['CREDITAS_TIMEOUT', 'CREDITAS_NETWORK_ERROR', 'CREDITAS_API_ERROR', 'CREDITAS_HTTP_ERROR'].includes(error?.code)
});

export const getCreditasToken = () => getCreditasAccessToken();

export const checkCreditasEligibility = async (payload = {}) => {
  const normalized = toPublicPayload(payload);
  const requiredFields = findMissingRequiredFields(payload);

  if (requiredFields.length) {
    return {
      ok: false,
      mode: 'missing_required_data',
      provider: 'creditas',
      requiredFields
    };
  }

  const productType = resolveCreditasProductType(normalized);

  try {
    const response = await requestCreditasEligibility({
      cpf: normalized.cpf,
      email: normalized.email,
      productType,
      scope: 'PRE_APPROVAL'
    });

    return normalizeCreditasResponse(response, {
      productType,
      guaranteeType: normalized.guaranteeType
    });
  } catch (error) {
    return normalizeCreditasError(error);
  }
};

export const submitCreditasEligibilityProxy = async (payload = {}) => {
  const eligibility = await checkCreditasEligibility(payload);
  if (!eligibility.ok) return eligibility;

  return {
    ...eligibility,
    mode: eligibility.mode === 'api' ? 'eligibility_proxy' : eligibility.mode,
    status: eligibility.eligible === false ? 'not_eligible' : 'eligibility_consulted',
    leadSubmitted: false,
    proposalSubmitted: false,
    message: eligibility.eligible === false
      ? 'Nao elegivel no momento.'
      : 'Elegibilidade consultada. Nenhum lead ou proposta foi enviado para a Creditas.'
  };
};

export const submitCreditasLead = submitCreditasEligibilityProxy;

export const submitCreditasProposal = async () => ({
  ok: false,
  mode: 'proposal_not_implemented',
  provider: 'creditas',
  status: 'not_sent',
  message: 'Envio real de proposta Creditas ainda nao implementado. Use /creditas/proposals somente com payload oficial validado.'
});

export const creditasClient = {
  getCreditasToken,
  checkCreditasEligibility,
  submitCreditasEligibilityProxy,
  submitCreditasLead,
  submitCreditasProposal,
  normalizeCreditasResponse,
  normalizeCreditasError
};
