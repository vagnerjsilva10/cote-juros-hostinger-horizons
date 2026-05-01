import { API_CONFIG, apiPost, withMockFallback } from '@/platform/services/apiClient.js';
import { buildCreditasPayload, checkCreditasEligibility } from '@/platform/services/creditasAdapter.js';
import { trackEvent } from '@/platform/services/trackingAdapter.js';

const DEFAULT_PARTNER_DESTINATION = 'https://www.cotejuros.com.br/ofertas';

export const selectPartnerRoute = ({ score = 0 } = {}) => {
  if (score >= 70) {
    return {
      partnerId: 'creditas_or_premium_partner',
      partnerName: 'Parceiro garantia/premium',
      routeType: 'creditas',
      deliveryMode: 'creditas',
      destinationUrl: DEFAULT_PARTNER_DESTINATION,
      products: ['credito_com_garantia', 'cartao_premium', 'financiamento']
    };
  }

  if (score >= 40) {
    return {
      partnerId: 'standard_credit_partner',
      partnerName: 'Parceiro crédito padrão',
      routeType: 'standard_credit',
      deliveryMode: 'redirect',
      destinationUrl: DEFAULT_PARTNER_DESTINATION,
      products: ['emprestimo_pessoal', 'cartao_comum', 'seguros']
    };
  }

  return {
    partnerId: 'restricted_credit_partner',
    partnerName: 'Parceiro perfil restrição',
    routeType: 'restricted_credit',
    deliveryMode: 'mock_api',
    destinationUrl: DEFAULT_PARTNER_DESTINATION,
    products: ['negativado', 'seguro_protecao', 'cartao_basico']
  };
};

export const trackPartnerClick = async (payload = {}) =>
  trackEvent('partner_clicked', {
    sourcePage: payload.sourcePage || 'smart_quiz',
    partnerId: payload.partnerId,
    offerId: payload.offerId,
    destination: payload.destinationUrl
  });

export const routeLeadToPartner = async ({ lead, recommendation } = {}) => {
  const route = selectPartnerRoute({ score: recommendation?.score || lead?.score || 0 });
  const destinationUrl = recommendation?.redirectUrl || route.destinationUrl || DEFAULT_PARTNER_DESTINATION;

  await trackEvent('partner_routed', {
    sourcePage: lead?.source || 'smart_quiz',
    partnerId: route.partnerId,
    partnerRoute: route.routeType,
    score: recommendation?.score || lead?.score
  });

  if (route.routeType === 'creditas') {
    return routeToCreditas({ lead, recommendation, route });
  }

  if (route.deliveryMode === 'mock_api') {
    return withMockFallback(
      () => apiPost(API_CONFIG.endpoints.partnerMockApi, {
        partnerId: route.partnerId,
        leadId: lead?.backendLeadId || lead?.id,
        sourcePage: lead?.source || 'smart_quiz',
        productType: lead?.productType || 'loan',
        profile: recommendation?.profile || lead?.profile
      }),
      {
        ok: true,
        mode: 'fallback',
        ...route,
        status: 'accepted'
      },
      'partner:mock-api'
    );
  }

  return withMockFallback(
    () => apiPost(API_CONFIG.endpoints.partnerRedirect, {
      partnerId: route.partnerId,
      sourcePage: lead?.source || 'smart_quiz',
      destinationUrl,
      utm: lead?.utm
    }),
    {
      ok: true,
      mode: 'fallback',
      ...route,
      resolvedUrl: destinationUrl
    },
    'partner:redirect'
  );
};

export const routeToCreditas = async (payload = {}) => {
  const lead = payload.lead || payload;

  await trackEvent('creditas_lead_ready', {
    sourcePage: lead.source || 'smart_quiz',
    score: payload.recommendation?.score || lead.score
  });

  const creditasPayload = buildCreditasPayload({
    lead,
    quizAnswers: lead.quizAnswers,
    recommendation: payload.recommendation,
    extraFields: lead.creditasExtraFields || {}
  });

  if (!creditasPayload.cpf || !creditasPayload.email) {
    console.warn('[partner:creditas] dados mínimos ausentes; usando fallback sem enviar dados fictícios para a API.');
    return {
      ok: false,
      mode: 'missing_required_data',
      partnerId: 'creditas_or_premium_partner',
      partnerName: 'Creditas/parceiro garantia',
      routeType: 'creditas',
      requiredFields: ['cpf', 'city', 'state', 'guaranteeType'],
      reason: 'missing_required_customer_data'
    };
  }

  return checkCreditasEligibility(creditasPayload);
};

export const routeToInsurancePartner = async (payload = {}) => {
  // TODO: conectar parceiros de seguro quando ProductType insurance / InsuranceQuote existirem.
  await trackEvent('insurance_quote_ready', {
    sourcePage: payload.source || 'smart_quiz',
    product: payload.product || 'insurance'
  });

  return {
    ok: true,
    mode: 'mock',
    partnerId: 'insurance_partner_future',
    partnerName: 'Parceiro de seguros futuro',
    routeType: 'insurance'
  };
};

export const partnerAdapter = {
  routeLeadToPartner,
  routeToCreditas,
  routeToInsurancePartner,
  trackPartnerClick,
  selectPartnerRoute
};
