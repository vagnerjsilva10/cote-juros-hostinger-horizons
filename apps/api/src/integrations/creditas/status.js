import { creditasRequest } from './client.js';
import {
  creditasDocumentPayloadSchema,
  creditasProposalStatusQuerySchema
} from './schemas.js';

const v2Headers = {
  Accept: 'application/vnd.creditas.v2+json'
};

export const getCreditasProposalStatus = ({ proposalId, includes } = {}) => {
  const query = creditasProposalStatusQuerySchema.parse({ includes });

  return creditasRequest({
    path: `/proposals/${encodeURIComponent(proposalId)}/status`,
    method: 'GET',
    query,
    headers: v2Headers
  });
};

export const listCreditasProposalDocuments = (proposalId) =>
  creditasRequest({
    path: `/proposals/${encodeURIComponent(proposalId)}/documents`,
    method: 'GET'
  });

export const sendCreditasProposalDocument = ({ proposalId, payload } = {}) =>
  creditasRequest({
    path: `/proposals/${encodeURIComponent(proposalId)}/documents`,
    method: 'POST',
    body: creditasDocumentPayloadSchema.parse(payload || {})
  });
