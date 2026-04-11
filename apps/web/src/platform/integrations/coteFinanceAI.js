import { portalApi } from '@/platform/services/portalApi.js';

const FINANCE_APP_BASE = 'https://finance.cotejuros.com.br/app';

const parseUtmFromSearch = (search = '') => {
  const params = new URLSearchParams(search);
  const utm = {};

  ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'].forEach((key) => {
    const value = params.get(key);
    if (value) utm[key] = value;
  });

  return utm;
};

export const buildCoteFinanceAiUrl = ({
  sourcePage,
  productType,
  campaign,
  utm = {},
  simulationContext,
  timezone = 'America/Sao_Paulo'
} = {}) => {
  const url = new URL(FINANCE_APP_BASE);
  url.searchParams.set('auth', 'login');
  url.searchParams.set('period', 'this_month');
  url.searchParams.set('tz', timezone);
  url.searchParams.set('tab', 'dashboard');

  if (sourcePage) url.searchParams.set('source_page', sourcePage);
  if (productType) url.searchParams.set('product_type', productType);
  if (campaign) url.searchParams.set('campaign', campaign);

  Object.entries(utm).forEach(([key, value]) => {
    if (value) url.searchParams.set(key, value);
  });

  if (simulationContext?.leadId) url.searchParams.set('lead_id', simulationContext.leadId);
  if (simulationContext?.amount != null) url.searchParams.set('sim_amount', String(simulationContext.amount));
  if (simulationContext?.score) url.searchParams.set('sim_score', simulationContext.score);

  return url.toString();
};

export const createFinanceAiRedirect = async ({
  sourcePage,
  productType,
  campaign,
  search,
  simulationContext,
  metadata
} = {}) => {
  const utm = parseUtmFromSearch(search);

  await portalApi.trackIntegration({
    sourcePage,
    productType,
    campaign,
    utm,
    simulationContext,
    metadata
  });

  const deepLink = await portalApi.getFinanceAiDeepLink({
    sourcePage,
    productType,
    simulationId: simulationContext?.leadId,
    campaign,
    utm
  });

  if (deepLink?.url) {
    return { url: deepLink.url, utm };
  }

  const url = buildCoteFinanceAiUrl({
    sourcePage,
    productType,
    campaign,
    utm,
    simulationContext
  });

  return { url, utm };
};

export const redirectToFinanceAi = async (context = {}) => {
  const { url } = await createFinanceAiRedirect(context);
  if (typeof window !== 'undefined') {
    window.location.href = url;
  }
  return url;
};

