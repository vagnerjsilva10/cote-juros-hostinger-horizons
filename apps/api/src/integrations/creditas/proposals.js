import { creditasRequest } from './client.js';
import {
  creditasAutoProposalPayloadSchema,
  creditasHomeProposalPayloadSchema
} from './schemas.js';

export const createCreditasAutoEquityProposal = (payload = {}) =>
  creditasRequest({
    path: '/proposals',
    method: 'POST',
    body: creditasAutoProposalPayloadSchema.parse(payload)
  });

export const createCreditasHomeEquityProposal = (payload = {}) =>
  creditasRequest({
    path: '/proposals/home',
    method: 'POST',
    headers: {
      Accept: 'application/vnd.creditas.v2+json'
    },
    body: creditasHomeProposalPayloadSchema.parse(payload)
  });
