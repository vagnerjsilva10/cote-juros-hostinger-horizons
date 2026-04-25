import { creditasRequest } from './client.js';

export const checkCreditasEligibility = ({ cpf, email, productType, scope } = {}) =>
  creditasRequest({
    path: '/borrowers/eligibility',
    method: 'GET',
    query: {
      cpf: String(cpf || '').replace(/\D/g, ''),
      email,
      productType,
      scope
    }
  });

