import { API_CONFIG, apiGet, withMockFallback } from '@/platform/services/apiClient.js';

const isProductionRuntime = () =>
  Boolean(import.meta.env.PROD || (typeof window !== 'undefined' && /(^|\.)cotejuros\.(com\.br|br)$/i.test(window.location.hostname)));

const toQueryString = (filters = {}) => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    params.set(key, String(value));
  });
  return params.toString();
};

const getOffersByType = (productType, filters = {}) => {
  const query = toQueryString({ ...filters, productType });
  return withMockFallback(
    () => apiGet(`${API_CONFIG.endpoints.creditOffers}${query ? `?${query}` : ''}`),
    [],
    `offers:${productType}`
  );
};

export const buildCreditasOffer = () => ({
  id: 'creditas_home_auto_equity',
  provider: 'creditas',
  bankName: 'Creditas',
  title: 'Creditas - Crédito com garantia',
  productName: 'Crédito com garantia Creditas',
  type: 'Empréstimo com garantia',
  productType: 'loan',
  rate: 'Sob análise',
  description: 'Refinanciamento de imóvel ou veículo pode fazer sentido, sujeito à análise da parceira.',
  cta: 'Ver condições',
  tags: ['Garantia', 'Imóvel ou veículo', 'Sujeito à análise']
});

export const getCreditOffers = (filters = {}) => getOffersByType('loan', filters);

export const getCardOffers = (filters = {}) => getOffersByType('credit_card', filters);

export const getFinancingOffers = (filters = {}) => getOffersByType('financing', filters);

export const getInsuranceOffers = async () => {
  if (isProductionRuntime()) return [];

  // DEV fallback: criar ProductType insurance / InsuranceQuote no backend antes de persistir seguros.
  return [
    {
      id: 'dev_mock_insurance_auto',
      type: 'insurance',
      title: '[DEV] Seguro auto',
      description: 'Compare coberturas, franquia e assistências antes de decidir.',
      cta: 'Comparar opções'
    },
    {
      id: 'dev_mock_insurance_home',
      type: 'insurance',
      title: '[DEV] Seguro residencial',
      description: 'Alternativas para proteger imóvel, bens e assistência emergencial.',
      cta: 'Ver alternativas'
    },
    {
      id: 'dev_mock_insurance_life',
      type: 'insurance',
      title: '[DEV] Seguro vida',
      description: 'Caminhos possíveis para proteção familiar e financeira.',
      cta: 'Entender coberturas'
    }
  ];
};

export const offerAdapter = {
  getCreditOffers,
  getCardOffers,
  getFinancingOffers,
  getInsuranceOffers,
  buildCreditasOffer
};
