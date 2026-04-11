import { portalApi } from '@/platform/services/portalApi.js';

const hashCpf = (cpf = '') => {
  const numeric = String(cpf).replace(/\D/g, '');
  if (!numeric) return undefined;
  return `cpf_${numeric.slice(0, 3)}***${numeric.slice(-2)}`;
};

const digitsOnly = (value = '') => String(value).replace(/\D/g, '');
const trimText = (value = '') => value.trim().replace(/\s+/g, ' ');
const toIsoDate = (value = '') => {
  const numeric = digitsOnly(value);
  return numeric.length === 8 ? `${numeric.slice(4, 8)}-${numeric.slice(2, 4)}-${numeric.slice(0, 2)}` : null;
};

const buildStartPayload = ({
  sourcePage,
  productType,
  requestedAmount,
  fullName,
  cpf,
  phone,
  email,
  income,
  scoreRange,
  hasRestriction,
  employmentStatus,
  birthDate,
  mothersName,
  gender,
  maritalStatus,
  educationalLevel,
  birthCity,
  birthState,
  address,
  addressNumber,
  district,
  city,
  state,
  zipCode,
  utm
} = {}) => ({
  fullName: trimText(fullName),
  cpf: digitsOnly(cpf),
  phone: digitsOnly(phone),
  email: trimText(email).toLowerCase(),
  requestedAmount,
  income,
  scoreRange,
  employmentStatus,
  hasRestriction,
  productType,
  sourcePage,
  utm_source: utm?.utm_source,
  utm_medium: utm?.utm_medium,
  utm_campaign: utm?.utm_campaign,
  birthDate: toIsoDate(birthDate),
  mothersName: trimText(mothersName),
  gender,
  maritalStatus,
  educationalLevel,
  birthCity: trimText(birthCity),
  birthState: trimText(birthState).toUpperCase(),
  address: trimText(address),
  addressNumber: trimText(addressNumber),
  district: trimText(district),
  city: trimText(city),
  state: trimText(state).toUpperCase(),
  zipCode: digitsOnly(zipCode),
  jurosBaixosProfile: {
    due_date: null,
    info: {
      birth_city: trimText(birthCity),
      birth_date: toIsoDate(birthDate),
      birth_state: trimText(birthState).toUpperCase(),
      mothers_name: trimText(mothersName),
      gender,
      marital_status: maritalStatus,
      educationalLevel
    },
    residence: {
      address: trimText(address),
      number: trimText(addressNumber),
      district: trimText(district),
      city: trimText(city),
      state: trimText(state).toUpperCase(),
      zip_code: digitsOnly(zipCode)
    }
  }
});

export const simulationFunnelService = {
  async start({ sourcePage, productType, amount, utm, metadata } = {}) {
    return portalApi.trackCta({
      sourcePage,
      ctaId: 'simulation_start',
      ctaLabel: 'Iniciar simulacao',
      productType,
      utm,
      metadata: { amount, ...metadata }
    });
  },

  async progress({ sourcePage, productType, funnelStep, amount, score, utm, metadata } = {}) {
    return portalApi.trackCta({
      sourcePage,
      ctaId: `simulation_step_${funnelStep}`,
      ctaLabel: `Passo ${funnelStep}`,
      productType,
      utm,
      metadata: { amount, score, ...metadata }
    });
  },

  async submitLead({ sourcePage, productType, amount, income, score, hasDebt, employmentType, cpf, funnelStep, utm, metadata } = {}) {
    const lead = await portalApi.captureSimulationLead({
      sourcePage,
      productType,
      amount,
      income,
      score,
      hasDebt,
      employmentType,
      cpfHash: hashCpf(cpf),
      funnelStep,
      utm,
      metadata
    });

    await portalApi.trackCta({
      sourcePage,
      ctaId: 'simulation_submit',
      ctaLabel: 'Enviar simulacao',
      productType,
      utm,
      metadata: { leadId: lead.id, amount, score, ...metadata }
    });

    return lead;
  },

  async runCreditJourney(input = {}) {
    const startPayload = buildStartPayload(input);
    const start = await portalApi.startCreditJourney(startPayload);

    const simulation = await portalApi.simulateCredit({
      leadId: start.lead.id,
      providerSessionId: start.providerSession?.id,
      requestedAmount: input.requestedAmount,
      installments: input.installments,
      productType: input.productType
    });

    await portalApi.trackCta({
      sourcePage: input.sourcePage,
      ctaId: 'simulation_submit',
      ctaLabel: 'Buscar ofertas',
      productType: input.productType,
      utm: input.utm,
      metadata: {
        leadId: start.lead.id,
        simulationId: simulation?.simulation?.id,
        requestedAmount: input.requestedAmount,
        installments: input.installments
      }
    });

    return {
      ...simulation,
      lead: start.lead,
      providerSession: start.providerSession
    };
  }
};
