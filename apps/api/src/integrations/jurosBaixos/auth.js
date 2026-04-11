import crypto from 'crypto';
import { getJurosBaixosConfig } from './config.js';
import { JurosBaixosValidationError } from './errors.js';

const resolveExpiresAt = (payload = {}) => {
  const expiresIn = payload?.expiresIn || payload?.expires_in || payload?.data?.expiresIn || payload?.data?.expires_in || null;
  if (!expiresIn) return null;
  return new Date(Date.now() + Number(expiresIn) * 1000);
};

const decodeJwtPayload = (token) => {
  if (!token) return null;
  const [, payload] = String(token).split('.');
  if (!payload) return null;

  const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');

  try {
    return JSON.parse(Buffer.from(padded, 'base64').toString('utf8'));
  } catch {
    return null;
  }
};

export const createHmacHeaders = () => {
  const config = getJurosBaixosConfig();
  if (!config.hasClientCredentials) {
    throw new JurosBaixosValidationError('Juros Baixos thirdparty endpoints require JUROS_BAIXOS_CLIENT_ID and JUROS_BAIXOS_CLIENT_SECRET.');
  }

  const nonce = String(Date.now());
  const signature = crypto.createHmac('sha256', config.clientSecret).update(nonce).digest('base64');

  return {
    'X-Nonce': nonce,
    'X-ClientId': config.clientId,
    'X-Signature': signature
  };
};

export const extractJwtContext = (payload = {}) => {
  const token = payload?.accessToken || payload?.token || payload?.jwt || payload?.data?.accessToken || payload?.data?.token || null;
  const refreshToken = payload?.refreshToken || payload?.data?.refreshToken || null;
  const expiresAt = resolveExpiresAt(payload);
  const decoded = decodeJwtPayload(token);

  return {
    token,
    refreshToken,
    expiresAt,
    decoded,
    userId: decoded?.sub || null,
    sessionId: decoded?.sessionId || null
  };
};

export const getPartnerAuthContext = async () => ({
  authHeaders: createHmacHeaders()
});
