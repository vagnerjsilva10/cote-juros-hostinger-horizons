import { CreditasNotConfiguredError } from './errors.js';

const DEFAULTS = {
  staging: {
    authUrl: 'https://auth-staging.creditas.com.br/api/affiliate_clients/tokens',
    apiBaseUrl: 'https://stg-api.creditas.io/b2b'
  },
  production: {
    authUrl: 'https://auth.creditas.com.br/api/affiliate_clients/tokens',
    apiBaseUrl: 'https://api.creditas.io/b2b'
  }
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

const normalizeEnvironment = (value) => {
  const normalized = String(value || '').toLowerCase().trim();
  return normalized === 'production' || normalized === 'prod' ? 'production' : 'staging';
};

const buildConfig = () => {
  const environment = normalizeEnvironment(readString('CREDITAS_ENV') || readString('CREDITAS_ENVIRONMENT'));
  const defaults = DEFAULTS[environment];
  const consumerKey = readString('CREDITAS_CONSUMER_KEY');
  const consumerSecret = readString('CREDITAS_CONSUMER_SECRET');
  const authUrl = (readString('CREDITAS_AUTH_URL') || defaults.authUrl).replace(/\s+$/, '');
  const apiBaseUrl = (readString('CREDITAS_API_BASE_URL') || readString('CREDITAS_BASE_URL') || defaults.apiBaseUrl).replace(/\/$/, '');
  const configured = Boolean(consumerKey && consumerSecret && authUrl && apiBaseUrl);
  const missing = [];

  if (!consumerKey) missing.push('CREDITAS_CONSUMER_KEY');
  if (!consumerSecret) missing.push('CREDITAS_CONSUMER_SECRET');
  if (!authUrl) missing.push('CREDITAS_AUTH_URL');
  if (!apiBaseUrl) missing.push('CREDITAS_API_BASE_URL');

  return {
    provider: 'creditas',
    environment,
    configured,
    available: configured,
    status: configured ? 'available' : 'disabled',
    missing,
    consumerKey,
    consumerSecret,
    authUrl,
    apiBaseUrl,
    timeoutMs: readInt('CREDITAS_TIMEOUT_MS', 15000),
    retryCount: readInt('CREDITAS_RETRY_COUNT', 1),
    webhookSecret: readString('CREDITAS_WEBHOOK_SECRET')
  };
};

export const getCreditasConfig = () => {
  cachedConfig ||= buildConfig();
  return cachedConfig;
};

export const isCreditasConfigured = () => getCreditasConfig().configured;

export const assertCreditasConfigured = () => {
  if (!isCreditasConfigured()) {
    throw new CreditasNotConfiguredError('Creditas integration is disabled because required environment variables are missing.');
  }
};

export const getCreditasHealth = () => {
  const config = getCreditasConfig();
  return {
    provider: config.provider,
    environment: config.environment,
    configured: config.configured,
    available: config.available,
    status: config.status,
    missing: config.missing,
    hasConsumerKey: Boolean(config.consumerKey),
    hasConsumerSecret: Boolean(config.consumerSecret),
    hasWebhookSecret: Boolean(config.webhookSecret),
    authUrl: config.authUrl,
    apiBaseUrl: config.apiBaseUrl,
    timeoutMs: config.timeoutMs,
    retryCount: config.retryCount
  };
};
