import { getJurosBaixosConfig } from './config.js';
import { getPartnerAuthContext } from './auth.js';
import { jurosBaixosRequest } from './client.js';

const digitsOnly = (value = '') => String(value).replace(/\D/g, '');

const buildIdentityPayload = ({ lead }) => ({
  fullName: lead.fullName,
  name: lead.fullName,
  cpf: digitsOnly(lead.cpf),
  email: lead.email || undefined,
  phone: digitsOnly(lead.phone || ''),
  source: 'cote_juros',
  metadata: {
    productType: lead.productType,
    sourcePage: lead.sourcePage
  }
});

const resolveSessionPayload = (payload = {}) => ({
  externalUserId: payload?.userId || payload?.externalUserId || payload?.data?.userId || payload?.data?.id || payload?.id || null,
  externalSessionId: payload?.sessionId || payload?.externalSessionId || payload?.data?.sessionId || null,
  externalJwt: payload?.jwt || payload?.token || payload?.access_token || payload?.data?.jwt || payload?.data?.token || null,
  tokenExpiresAt:
    payload?.expiresAt ||
    payload?.data?.expiresAt ||
    (payload?.expires_in ? new Date(Date.now() + Number(payload.expires_in) * 1000).toISOString() : null)
});

export const createThirdPartyUser = async ({ lead }) => {
  const config = getJurosBaixosConfig();
  const auth = await getPartnerAuthContext();

  const payload = await jurosBaixosRequest({
    path: config.endpoints.userCreatePath,
    method: 'POST',
    token: auth.token,
    body: buildIdentityPayload({ lead })
  });

  return resolveSessionPayload(payload);
};

export const authenticateThirdPartyUser = async ({ lead, externalUserId }) => {
  const config = getJurosBaixosConfig();
  const auth = await getPartnerAuthContext();

  const payload = await jurosBaixosRequest({
    path: config.endpoints.userAuthPath,
    method: 'POST',
    token: auth.token,
    body: {
      cpf: digitsOnly(lead.cpf),
      email: lead.email || undefined,
      externalUserId: externalUserId || undefined
    }
  });

  return resolveSessionPayload(payload);
};
