import { getCreditasConfig, assertCreditasConfigured } from './config.js';
import { CreditasApiError } from './errors.js';

const RETRYABLE_STATUS_CODES = new Set([408, 425, 429, 500, 502, 503, 504]);
const TOKEN_EXPIRY_SKEW_MS = 60_000;

let cachedToken = null;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const parseResponsePayload = async (response) => {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};

const withTimeout = async ({ timeoutMs, executor }) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await executor(controller.signal);
  } finally {
    clearTimeout(timer);
  }
};

const tokenStillValid = () =>
  cachedToken?.accessToken && cachedToken.expiresAt && cachedToken.expiresAt.getTime() - TOKEN_EXPIRY_SKEW_MS > Date.now();

export const getCreditasAccessToken = async ({ forceRefresh = false } = {}) => {
  assertCreditasConfigured();
  if (!forceRefresh && tokenStillValid()) return cachedToken;

  const config = getCreditasConfig();
  const payload = await withTimeout({
    timeoutMs: config.timeoutMs,
    executor: async (signal) => {
      const response = await fetch(config.authUrl, {
        method: 'POST',
        headers: {
          'Accept-Version': 'v1',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          consumer_key: config.consumerKey,
          consumer_secret: config.consumerSecret
        }),
        signal
      });

      const responsePayload = await parseResponsePayload(response);
      if (!response.ok) {
        throw new CreditasApiError(`Creditas authentication failed with status ${response.status}`, {
          statusCode: response.status,
          code: 'CREDITAS_AUTH_ERROR',
          details: responsePayload
        });
      }

      return responsePayload;
    }
  }).catch((error) => {
    if (error instanceof CreditasApiError) throw error;
    throw new CreditasApiError(error?.name === 'AbortError' ? 'Creditas authentication timed out.' : 'Unexpected Creditas authentication error.', {
      code: error?.name === 'AbortError' ? 'CREDITAS_AUTH_TIMEOUT' : 'CREDITAS_AUTH_NETWORK_ERROR',
      details: error?.message || null
    });
  });

  const accessToken = payload?.access_token || payload?.accessToken;
  if (!accessToken) {
    throw new CreditasApiError('Creditas authentication response did not include access_token.', {
      code: 'CREDITAS_AUTH_EMPTY_TOKEN',
      details: payload
    });
  }

  const expiresIn = Number(payload?.expires_in || payload?.expiresIn || 7200);
  cachedToken = {
    accessToken,
    tokenType: payload?.token_type || payload?.tokenType || 'bearer',
    refreshToken: payload?.refresh_token || payload?.refreshToken || null,
    expiresIn,
    expiresAt: new Date(Date.now() + expiresIn * 1000)
  };

  return cachedToken;
};

const buildApiHeaders = (token, headers = {}) => ({
  Accept: 'application/vnd.creditas.v1+json',
  'Content-Type': 'application/json;charset=UTF-8',
  Authorization: `Bearer ${token}`,
  ...headers
});

export const creditasRequest = async ({
  path,
  method = 'GET',
  headers = {},
  query,
  body,
  timeoutMs,
  retries
}) => {
  assertCreditasConfigured();
  const config = getCreditasConfig();
  const maxRetries = retries ?? config.retryCount;
  const requestTimeoutMs = timeoutMs ?? config.timeoutMs;
  const url = new URL(`${config.apiBaseUrl}${path.startsWith('/') ? path : `/${path}`}`);

  Object.entries(query || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value));
    }
  });

  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    const token = await getCreditasAccessToken({ forceRefresh: attempt > 0 });

    try {
      const response = await withTimeout({
        timeoutMs: requestTimeoutMs,
        executor: (signal) => fetch(url, {
          method,
          headers: buildApiHeaders(token.accessToken, headers),
          body: body == null ? undefined : JSON.stringify(body),
          signal
        })
      });

      const payload = await parseResponsePayload(response);

      if (!response.ok) {
        if (response.status === 401 && attempt < maxRetries) {
          cachedToken = null;
          continue;
        }

        const error = new CreditasApiError(`Creditas request failed with status ${response.status}`, {
          statusCode: response.status,
          code: 'CREDITAS_HTTP_ERROR',
          details: payload
        });

        if (attempt < maxRetries && RETRYABLE_STATUS_CODES.has(response.status)) {
          await sleep(250 * (attempt + 1));
          continue;
        }

        throw error;
      }

      return payload;
    } catch (error) {
      const isAbort = error?.name === 'AbortError';
      const isRetryableNetworkError = isAbort || error instanceof TypeError;

      if (attempt < maxRetries && isRetryableNetworkError) {
        await sleep(250 * (attempt + 1));
        continue;
      }

      if (error instanceof CreditasApiError) throw error;

      throw new CreditasApiError(isAbort ? 'Creditas request timed out.' : 'Unexpected Creditas request error.', {
        code: isAbort ? 'CREDITAS_TIMEOUT' : 'CREDITAS_NETWORK_ERROR',
        details: error?.message || null
      });
    }
  }

  throw new CreditasApiError('Creditas request exhausted retries.', { code: 'CREDITAS_RETRY_EXHAUSTED' });
};

