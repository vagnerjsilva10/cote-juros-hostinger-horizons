import {
  calculateQuickCreditProfile,
  resolveQuickCreditPartner,
  resolveQuickCreditRecommendations
} from '@/lib/quickCreditRouting.js';
import { partnerRedirectService } from '@/platform/services/partnerRedirectService.js';
import { portalApi } from '@/platform/services/portalApi.js';
import { trackingService } from '@/platform/services/trackingService.js';

export const parseCurrencyValue = (value = '') => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  const digits = String(value || '').replace(/\D/g, '');
  return digits ? parseInt(digits, 10) / 100 : 0;
};

export const formatCurrencyValue = (value = '') => {
  const parsed = parseCurrencyValue(value);
  if (!parsed) return '';
  return parsed.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
};

export const formatPhoneValue = (value = '') => {
  let next = String(value || '').replace(/\D/g, '').slice(0, 11);
  if (next.length > 10) next = next.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  else if (next.length > 6) next = next.replace(/(\d{2})(\d{4,5})(\d{1,4})/, '($1) $2-$3');
  else if (next.length > 2) next = next.replace(/(\d{2})(\d{1,5})/, '($1) $2');
  return next;
};

export const normalizeQuickCreditLead = (data = {}) => ({
  amount: parseCurrencyValue(data.amount),
  income: parseCurrencyValue(data.income),
  hasRestriction: data.hasRestriction === true || data.hasRestriction === 'yes' || data.hasDebt === true,
  employmentStatus: data.employmentStatus || data.employmentType || '',
  fullName: String(data.fullName || '').trim(),
  phone: String(data.phone || '').replace(/\D/g, ''),
  email: String(data.email || '').trim(),
  goal: data.goal || '',
  consentAccepted: Boolean(data.consentAccepted),
  consentText: data.consentText || '',
  consentAcceptedAt: data.consentAcceptedAt || null
});

export const buildLeadResultFromJourney = (journey = {}) => ({
  leadId: journey.lead?.id || null,
  partnerId: journey.partner?.id || journey.lead?.partnerId,
  partnerName: journey.partner?.name || journey.lead?.partnerName,
  profile: journey.profile || journey.lead?.profile,
  deliveryMode: journey.deliveryMode || journey.lead?.deliveryMode,
  redirectUrl: journey.redirectUrl || journey.lead?.redirectUrl || '',
  recommendations: Array.isArray(journey.recommendations) ? journey.recommendations : [],
  status: journey.status || journey.lead?.status,
  sentAt: journey.sentAt || journey.lead?.updatedAt || journey.lead?.createdAt
});

export async function submitQuickCreditApplication({
  leadData,
  sourcePage = '/',
  originLabel = 'credito',
  ctaLabel = 'Continuar para comparar'
} = {}) {
  const normalized = normalizeQuickCreditLead(leadData);
  const utm = Object.fromEntries(new URLSearchParams(window.location.search).entries());

  await trackingService.trackCtaClick({
    sourcePage,
    ctaId: `quick_credit_flow_${originLabel}`,
    ctaLabel,
    productType: 'loan',
    utm
  });

  const quickCreditPayload = {
    sourcePage,
    productType: 'loan',
    amount: normalized.amount,
    requestedAmount: normalized.amount,
    income: normalized.income,
    hasDebt: normalized.hasRestriction,
    hasRestriction: normalized.hasRestriction,
    employmentType: normalized.employmentStatus,
    employmentStatus: normalized.employmentStatus,
    fullName: normalized.fullName,
    phone: normalized.phone,
    email: normalized.email,
    originLabel,
    utm,
    metadata: {
      goal: normalized.goal,
      consentAccepted: normalized.consentAccepted,
      consentText: normalized.consentText,
      consentAcceptedAt: normalized.consentAcceptedAt
    }
  };

  const backendJourney = await portalApi.startQuickCreditJourney(quickCreditPayload);
  if (backendJourney?.lead?.id) return buildLeadResultFromJourney(backendJourney);

  const profile = calculateQuickCreditProfile({
    income: normalized.income,
    hasRestriction: normalized.hasRestriction,
    employmentStatus: normalized.employmentStatus
  });
  const partner = resolveQuickCreditPartner(profile);
  const recommendations = resolveQuickCreditRecommendations({
    profile,
    amount: normalized.amount,
    hasRestriction: normalized.hasRestriction
  });

  const lead = await portalApi.createQuickCreditLead({
    ...quickCreditPayload,
    profile,
    partnerId: partner.id,
    partnerName: partner.name,
    deliveryMode: partner.mode,
    status: partner.mode === 'mock_api' ? 'qualified' : 'sent'
  });

  let redirectUrl = '';
  if (partner.mode === 'tracking_link') {
    const redirect = await partnerRedirectService.create({
      partnerId: partner.id,
      sourcePage,
      destinationUrl: partner.destinationUrl,
      productType: 'loan',
      utm
    });
    redirectUrl = redirect?.resolvedUrl || '';
    await portalApi.updateQuickCreditLead(lead.id, {
      redirectUrl,
      status: 'sent'
    });
  } else {
    await portalApi.submitMockPartnerLead({
      partnerId: partner.id,
      leadId: lead.id,
      sourcePage,
      productType: 'loan',
      profile
    });
    await portalApi.updateQuickCreditLead(lead.id, {
      status: 'qualified'
    });
  }

  return {
    leadId: lead?.id || null,
    partnerId: partner.id,
    partnerName: partner.name,
    profile,
    deliveryMode: partner.mode,
    redirectUrl,
    recommendations,
    status: partner.mode === 'mock_api' ? 'qualified' : 'sent',
    sentAt: new Date().toISOString()
  };
}
