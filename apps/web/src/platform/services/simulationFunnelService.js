import { portalApi } from '@/platform/services/portalApi.js';

const hashCpf = (cpf = '') => {
  const digits = cpf.replace(/\D/g, '');
  if (!digits) return undefined;
  return `cpf_${digits.slice(0, 3)}***${digits.slice(-2)}`;
};

export const simulationFunnelService = {
  async start({ sourcePage, productType, amount, utm, metadata } = {}) {
    return portalApi.trackCta({
      sourcePage,
      ctaId: 'simulation_start',
      ctaLabel: 'Iniciar simulacao',
      productType,
      utm,
      metadata: {
        amount,
        ...metadata
      }
    });
  },

  async progress({ sourcePage, productType, funnelStep, amount, score, utm, metadata } = {}) {
    return portalApi.trackCta({
      sourcePage,
      ctaId: `simulation_step_${funnelStep}`,
      ctaLabel: `Passo ${funnelStep}`,
      productType,
      utm,
      metadata: {
        amount,
        score,
        ...metadata
      }
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
      metadata: {
        leadId: lead.id,
        amount,
        score,
        ...metadata
      }
    });

    return lead;
  }
};

