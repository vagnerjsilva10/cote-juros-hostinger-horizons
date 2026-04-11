import { getJurosBaixosConfig } from './config.js';
import { jurosBaixosRequest } from './client.js';

let partnerTokenCache = null;

const resolveTokenFromPayload = (payload = {}) =>
  payload?.access_token ||
  payload?.token ||
  payload?.jwt ||
  payload?.data?.access_token ||
  payload?.data?.token ||
  payload?.data?.jwt ||
  null;

const resolveExpiresAt = (payload = {}) => {
  const expiresIn =
    payload?.expires_in ||
    payload?.expiresIn ||
    payload?.data?.expires_in ||
    payload?.data?.expiresIn ||
    null;

  if (!expiresIn) return null;
  return new Date(Date.now() + Number(expiresIn) * 1000);
};

export const getPartnerAccessToken = async ({ forceRefresh = false } = {}) => {
  const config = getJurosBaixosConfig();
  if (!config.hasClientCredentials) return null;

  if (!forceRefresh && partnerTokenCache?.token && partnerTokenCache.expiresAt && partnerTokenCache.expiresAt > new Date(Date.now() + 60_000)) {
    return partnerTokenCache;
  }

  const payload = await jurosBaixosRequest({
    path: config.endpoints.partnerAuthPath,
    method: 'POST',
    body: {
      grant_type: 'client_credentials',
      client_id: config.clientId,
      client_secret: config.clientSecret
    }
  });

  const token = resolveTokenFromPayload(payload);
  const expiresAt = resolveExpiresAt(payload);

  partnerTokenCache = {
    token,
    expiresAt
  };

  return partnerTokenCache;
};

export const getPartnerAuthContext = async () => {
  const partnerToken = await getPartnerAccessToken();
  return {
    token: partnerToken?.token || null,
    expiresAt: partnerToken?.expiresAt || null
  };
};
