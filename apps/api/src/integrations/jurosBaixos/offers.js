import { getJurosBaixosConfig } from './config.js';
import { jurosBaixosRequest } from './client.js';
import { mapJurosBaixosSimulationResponse } from './mapper.js';

export const fetchSimulationOffers = async ({ externalSimulationId, userToken, statuses }) => {
  const config = getJurosBaixosConfig();
  const query = new URLSearchParams();
  const resolvedStatuses = statuses?.length ? statuses : ['PROPOSED', 'VALIDATING', 'ONGOING'];

  if (externalSimulationId) query.set('simulationId', externalSimulationId);
  query.set('status', resolvedStatuses.join(', '));

  const payload = await jurosBaixosRequest({
    path: `${config.endpoints.simulationOffersPath}${query.toString() ? `?${query.toString()}` : ''}`,
    method: 'GET',
    token: userToken
  });

  return mapJurosBaixosSimulationResponse(payload);
};

export const getOfferDetails = async ({ offerId, userToken }) =>
  jurosBaixosRequest({
    path: `/loans/no-collateral/offers/${offerId}`,
    method: 'GET',
    token: userToken
  });

export const selectOffer = async ({ offerId, userToken, payload = {} }) =>
  jurosBaixosRequest({
    path: `/loans/no-collateral/offers/${offerId}/select`,
    method: 'POST',
    token: userToken,
    body: payload
  });
