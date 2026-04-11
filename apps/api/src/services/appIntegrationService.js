const FINANCE_APP_BASE = 'https://finance.cotejuros.com.br/app';

export class AppIntegrationService {
  static buildDeepLink({ sourcePage, productType, simulationId, utm = {}, campaign } = {}) {
    const url = new URL(FINANCE_APP_BASE);
    url.searchParams.set('auth', 'login');
    url.searchParams.set('period', 'this_month');
    url.searchParams.set('tz', 'America/Sao_Paulo');
    url.searchParams.set('tab', 'dashboard');
    url.searchParams.set('origin', 'portal');

    if (sourcePage) url.searchParams.set('source_page', sourcePage);
    if (productType) url.searchParams.set('product_type', productType);
    if (simulationId) url.searchParams.set('simulation_id', simulationId);
    if (campaign) url.searchParams.set('campaign', campaign);

    Object.entries(utm).forEach(([key, value]) => {
      if (value) url.searchParams.set(key, value);
    });

    return url.toString();
  }
}

