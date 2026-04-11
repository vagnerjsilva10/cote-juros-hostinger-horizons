import { getJurosBaixosConfig } from './config.js';
import { getPartnerAuthContext } from './auth.js';
import { jurosBaixosRequest } from './client.js';
import { mapJurosBaixosSimulationResponse } from './mapper.js';

const digitsOnly = (value = '') => String(value).replace(/\D/g, '');

const buildSimulationPayload = ({ lead, simulation }) => ({
  requestedAmount: simulation.requestedAmount,
  installments: simulation.installments,
  productType: simulation.productType,
  customer: {
    fullName: lead.fullName,
    cpf: digitsOnly(lead.cpf),
    email: lead.email || undefined,
    phone: digitsOnly(lead.phone || ''),
    income: lead.income,
    scoreRange: lead.scoreRange,
    employmentStatus: lead.employmentStatus,
    hasRestriction: lead.hasRestriction
  },
  metadata: {
    leadId: lead.id,
    sourcePage: lead.sourcePage,
    utmSource: lead.utmSource,
    utmMedium: lead.utmMedium,
    utmCampaign: lead.utmCampaign
  }
});

export const createThirdPartySimulation = async ({ lead, simulation, userToken }) => {
  const config = getJurosBaixosConfig();
  const partnerAuth = await getPartnerAuthContext();
  const payload = await jurosBaixosRequest({
    path: config.endpoints.simulationCreatePath,
    method: 'POST',
    token: userToken || partnerAuth.token,
    body: buildSimulationPayload({ lead, simulation })
  });

  return mapJurosBaixosSimulationResponse(payload);
};
