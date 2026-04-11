import { getJurosBaixosConfig } from './config.js';
import { extractJwtContext, getPartnerAuthContext } from './auth.js';
import { jurosBaixosRequest } from './client.js';
import { JurosBaixosApiError, JurosBaixosValidationError } from './errors.js';

const digitsOnly = (value = '') => String(value).replace(/\D/g, '');

const buildIdentityPayload = ({ lead }) => {
  const payload = {
    name: lead.fullName,
    cpf: digitsOnly(lead.cpf),
    email: lead.email || null,
    mobile_phone: digitsOnly(lead.phone || '')
  };

  const missing = Object.entries(payload)
    .filter(([, value]) => value === null || value === '')
    .map(([key]) => key);

  if (missing.length) {
    throw new JurosBaixosValidationError(`Missing Juros Baixos thirdparty create fields: ${missing.join(', ')}.`, {
      details: { missingFields: missing }
    });
  }

  return payload;
};

const resolveSessionPayload = (payload = {}, fallbackUserId = null) => {
  const jwtContext = extractJwtContext(payload);

  return {
    externalUserId: jwtContext.userId || payload?.objectId || fallbackUserId || null,
    externalSessionId: jwtContext.sessionId || null,
    externalJwt: jwtContext.token || null,
    refreshToken: jwtContext.refreshToken || null,
    tokenExpiresAt: jwtContext.expiresAt ? jwtContext.expiresAt.toISOString() : null
  };
};

export const createThirdPartyUser = async ({ lead }) => {
  const config = getJurosBaixosConfig();
  const auth = await getPartnerAuthContext();

  try {
    const payload = await jurosBaixosRequest({
      path: config.endpoints.userCreatePath,
      method: 'POST',
      authHeaders: auth.authHeaders,
      body: buildIdentityPayload({ lead })
    });

    return resolveSessionPayload(payload);
  } catch (error) {
    if (error instanceof JurosBaixosApiError && error.statusCode === 412) {
      return resolveSessionPayload(error.details, error.details?.objectId || null);
    }

    throw error;
  }
};

export const authenticateThirdPartyUser = async ({ externalUserId }) => {
  const config = getJurosBaixosConfig();
  const auth = await getPartnerAuthContext();

  if (!externalUserId) {
    throw new JurosBaixosValidationError('Juros Baixos thirdparty login requires a userId created by /thirdparty/create.');
  }

  const payload = await jurosBaixosRequest({
    path: config.endpoints.userAuthPath,
    method: 'POST',
    authHeaders: auth.authHeaders,
    body: {
      userId: externalUserId
    }
  });

  return resolveSessionPayload(payload, externalUserId);
};
