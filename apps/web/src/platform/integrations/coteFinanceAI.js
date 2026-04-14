import { portalApi } from '@/platform/services/portalApi.js';

export const FINANCE_AI_URL = 'https://finance.cotejuros.com.br';

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
  return FINANCE_AI_URL;
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
      try {
        const parsed = new URL(deepLink.url);
      if (parsed.origin === 'https://finance.cotejuros.com.br') {
        return { url: deepLink.url, utm };
      }
    } catch {
      // Fall back to the standardized product entry.
    }
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

