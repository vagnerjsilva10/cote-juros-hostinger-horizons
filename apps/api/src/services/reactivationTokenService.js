import crypto from 'crypto';

const TOKEN_BYTES = 24;
const DEV_TOKEN_SECRET = 'cote-juros-dev-secret';
const DEV_PII_SECRET = 'cote-juros-pii-dev-secret';

const getTokenSecret = () => {
  const secret = process.env.REACTIVATION_TOKEN_SECRET || process.env.APP_SECRET || DEV_TOKEN_SECRET;
  if (process.env.NODE_ENV === 'production' && secret === DEV_TOKEN_SECRET) {
    throw new Error('REACTIVATION_TOKEN_SECRET must be configured in production');
  }
  return secret;
};

const getPiiSecret = () => {
  const secret = process.env.REACTIVATION_PII_HASH_SECRET || process.env.REACTIVATION_TOKEN_SECRET || DEV_PII_SECRET;
  if (process.env.NODE_ENV === 'production' && secret === DEV_PII_SECRET) {
    throw new Error('REACTIVATION_PII_HASH_SECRET must be configured in production');
  }
  return secret;
};

const hmac = (secret, value) => crypto.createHmac('sha256', secret).update(String(value || '')).digest('hex');

export const ReactivationTokenService = {
  generateToken() {
    return crypto.randomBytes(TOKEN_BYTES).toString('base64url');
  },

  hashToken(token) {
    return hmac(getTokenSecret(), token);
  },

  last4(token) {
    return String(token || '').slice(-4);
  },

  hashCpf(cpf) {
    const normalizedCpf = String(cpf || '').replace(/\D/g, '');
    if (!normalizedCpf) return null;
    return hmac(getPiiSecret(), normalizedCpf);
  },

  normalizeEmail(email) {
    const value = String(email || '').trim().toLowerCase();
    return value || null;
  },

  normalizePhone(phone) {
    const digits = String(phone || '').replace(/\D/g, '');
    if (!digits) return null;
    if (digits.startsWith('55') && digits.length >= 12 && digits.length <= 13) return digits;
    if (digits.length >= 10 && digits.length <= 11) return `55${digits}`;
    return digits;
  },

  hashEmail(email) {
    const normalized = this.normalizeEmail(email);
    return normalized ? hmac(getPiiSecret(), normalized) : null;
  },

  hashPhone(phone) {
    const normalized = this.normalizePhone(phone);
    return normalized ? hmac(getPiiSecret(), normalized) : null;
  },

  hashPayload(payload) {
    return hmac(getPiiSecret(), JSON.stringify(payload || {}));
  },

  buildIdempotencyKey(parts = []) {
    return hmac(getTokenSecret(), parts.filter(Boolean).join(':'));
  }
};
