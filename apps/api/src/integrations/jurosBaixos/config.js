import { IntegrationConfigurationError, JurosBaixosNotConfiguredError } from './errors.js';

const DEFAULT_ENDPOINTS = {
  partnerAuthPath: '/oauth/token',
  userCreatePath: '/v1/users',
  userAuthPath: '/v1/users/authenticate',
  simulationCreatePath: '/v1/credit/simulations',
  simulationOffersPath: '/v1/credit/simulations/:simulationId/offers'
};

let cachedConfig;

const readString = (key) => {
  const value = process.env[key];
  return typeof value === 'string' ? value.trim() : '';
};

const readInt = (key, fallback) => {
  const value = Number.parseInt(readString(key), 10);
  return Number.isFinite(value) ? value : fallback;
};

const buildConfig = () => {
  const baseUrl = readString('JUROS_BAIXOS_BASE_URL').replace(/\/$/, '');
  const apiKey = readString('JUROS_BAIXOS_API_KEY');
  const clientId = readString('JUROS_BAIXOS_CLIENT_ID');
  const clientSecret = readString('JUROS_BAIXOS_CLIENT_SECRET');
  const webhookSecret = readString('JUROS_BAIXOS_WEBHOOK_SECRET');
  const hasClientCredentials = Boolean(clientId && clientSecret);
  const configured = Boolean(baseUrl && (apiKey || hasClientCredentials));

  const endpoints = {
    partnerAuthPath: readString('JUROS_BAIXOS_PARTNER_AUTH_PATH') || DEFAULT_ENDPOINTS.partnerAuthPath,
    userCreatePath: readString('JUROS_BAIXOS_USER_CREATE_PATH') || DEFAULT_ENDPOINTS.userCreatePath,
    userAuthPath: readString('JUROS_BAIXOS_USER_AUTH_PATH') || DEFAULT_ENDPOINTS.userAuthPath,
    simulationCreatePath: readString('JUROS_BAIXOS_SIMULATION_CREATE_PATH') || DEFAULT_ENDPOINTS.simulationCreatePath,
    simulationOffersPath: readString('JUROS_BAIXOS_SIMULATION_OFFERS_PATH') || DEFAULT_ENDPOINTS.simulationOffersPath
  };

  if (process.env.NODE_ENV === 'production') {
    const missing = [];
    if (!baseUrl) missing.push('JUROS_BAIXOS_BASE_URL');
    if (!apiKey && !hasClientCredentials) missing.push('JUROS_BAIXOS_API_KEY or JUROS_BAIXOS_CLIENT_ID + JUROS_BAIXOS_CLIENT_SECRET');
    if (missing.length) {
      throw new IntegrationConfigurationError(`Missing Juros Baixos environment configuration: ${missing.join(', ')}`);
    }
  }

  return {
    provider: 'juros_baixos',
    configured,
    baseUrl,
    apiKey,
    clientId,
    clientSecret,
    webhookSecret,
    hasClientCredentials,
    timeoutMs: readInt('JUROS_BAIXOS_TIMEOUT_MS', 10000),
    retryCount: readInt('JUROS_BAIXOS_RETRY_COUNT', 1),
    endpoints
  };
};

export const getJurosBaixosConfig = () => {
  cachedConfig ||= buildConfig();
  return cachedConfig;
};

export const validateJurosBaixosEnvironment = () => getJurosBaixosConfig();

export const isJurosBaixosConfigured = () => getJurosBaixosConfig().configured;

export const assertJurosBaixosConfigured = () => {
  if (!isJurosBaixosConfigured()) {
    throw new JurosBaixosNotConfiguredError('Juros Baixos integration is disabled because the required environment variables are missing.');
  }
};

export const getJurosBaixosHealth = () => {
  const config = getJurosBaixosConfig();
  return {
    provider: config.provider,
    configured: config.configured,
    hasBaseUrl: Boolean(config.baseUrl),
    hasApiKey: Boolean(config.apiKey),
    hasClientCredentials: config.hasClientCredentials,
    hasWebhookSecret: Boolean(config.webhookSecret),
    timeoutMs: config.timeoutMs,
    retryCount: config.retryCount,
    endpoints: Object.keys(config.endpoints)
  };
};
