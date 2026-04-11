import { getJurosBaixosConfig } from './config.js';
import { getPartnerAuthContext } from './auth.js';
import { jurosBaixosRequest } from './client.js';
import { mapJurosBaixosSimulationResponse } from './mapper.js';

export const fetchSimulationOffers = async ({ externalSimulationId, userToken }) => {
  const config = getJurosBaixosConfig();
  const partnerAuth = await getPartnerAuthContext();
  const path = config.endpoints.simulationOffersPath.replace(':simulationId', externalSimulationId);
  const payload = await jurosBaixosRequest({
    path,
    method: 'GET',
    token: userToken || partnerAuth.token
  });

  return mapJurosBaixosSimulationResponse(payload);
};
