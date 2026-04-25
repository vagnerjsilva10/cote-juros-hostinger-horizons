import { creditasRequest } from './client.js';
import { mapCreditasOfferResponse } from './mapper.js';
import { creditasAutoOfferPayloadSchema } from './schemas.js';

export const createCreditasAutoEquityOffer = async (payload = {}) => {
  const parsedPayload = creditasAutoOfferPayloadSchema.parse(payload);
  const response = await creditasRequest({
    path: '/offers',
    method: 'POST',
    body: parsedPayload
  });

  return mapCreditasOfferResponse(response);
};

export const getCreditasAutoEquityOffer = async (id) => {
  const response = await creditasRequest({
    path: `/offers/${encodeURIComponent(id)}`,
    method: 'GET'
  });

  return mapCreditasOfferResponse(response);
};
