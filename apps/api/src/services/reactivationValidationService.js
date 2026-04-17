import { ReactivationTokenService } from './reactivationTokenService.js';

const BR_PHONE_MIN = 12;
const BR_PHONE_MAX = 13;

export const ReactivationValidationService = {
  normalizeLeadInput(input = {}) {
    const email = ReactivationTokenService.normalizeEmail(input.email);
    const phone = ReactivationTokenService.normalizePhone(input.phone);
    const requestedAmount = input.requestedAmount == null ? null : Number(input.requestedAmount);
    const income = input.income == null ? null : Number(input.income);

    return {
      ...input,
      fullName: input.fullName ? String(input.fullName).trim().replace(/\s+/g, ' ') : null,
      email,
      phone,
      productType: input.productType || 'loan',
      requestedAmount: Number.isFinite(requestedAmount) ? requestedAmount : null,
      income: Number.isFinite(income) ? income : null,
      employmentStatus: input.employmentStatus ? String(input.employmentStatus).trim().toLowerCase() : null,
      hasRestriction: typeof input.hasRestriction === 'boolean' ? input.hasRestriction : null,
      hasGuarantee: typeof input.hasGuarantee === 'boolean' ? input.hasGuarantee : false,
      guaranteeType: input.guaranteeType ? String(input.guaranteeType).trim().toLowerCase() : null,
      segment: input.segment ? String(input.segment).trim().toLowerCase() : null,
      source: input.source ? String(input.source).trim() : null
    };
  },

  isValidEmail(email) {
    if (!email) return true;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  },

  isValidPhone(phone) {
    if (!phone) return false;
    return phone.length >= BR_PHONE_MIN && phone.length <= BR_PHONE_MAX;
  },

  assertSubmittable(input = {}) {
    const errors = [];
    if (!input.fullName || input.fullName.length < 3) errors.push('fullName is required');
    if (!this.isValidPhone(input.phone)) errors.push('phone must be a valid Brazilian phone number');
    if (!this.isValidEmail(input.email)) errors.push('email must be valid');
    if (input.income == null || input.income < 0) errors.push('income must be zero or greater');
    if (!input.employmentStatus) errors.push('employmentStatus is required');
    if (typeof input.hasRestriction !== 'boolean') errors.push('hasRestriction is required');
    if (input.requestedAmount != null && input.requestedAmount < 100) errors.push('requestedAmount must be at least 100');
    if (errors.length) {
      const error = new Error('Invalid reactivation payload');
      error.name = 'ValidationError';
      error.details = errors;
      throw error;
    }
  }
};
