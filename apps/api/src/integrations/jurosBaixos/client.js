import { getJurosBaixosConfig } from './config.js';
import { JurosBaixosApiError } from './errors.js';

const RETRYABLE_STATUS_CODES = new Set([408, 425, 429, 500, 502, 503, 504]);

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

const buildHeaders = ({ apiKey, token, headers, authHeaders }) => {
  const nextHeaders = {
    Accept: 'application/json',
    ...authHeaders,
    ...headers
  };

  if (apiKey) nextHeaders['x-api-key'] = apiKey;
  if (token) nextHeaders.Authorization = `Bearer ${token}`;

  return nextHeaders;
};

export const jurosBaixosRequest = async ({
  path,
  method = 'GET',
  headers = {},
  authHeaders = {},
  body,
  token,
  timeoutMs,
  retries
}) => {
  const config = getJurosBaixosConfig();
  const maxRetries = retries ?? config.retryCount;
  const requestTimeoutMs = timeoutMs ?? config.timeoutMs;
  const url = `${config.baseUrl}${path.startsWith('/') ? path : `/${path}`}`;

  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), requestTimeoutMs);

    try {
      const serializedBody =
        body == null || typeof body === 'string' || body instanceof ArrayBuffer ? body : JSON.stringify(body);

      const response = await fetch(url, {
        method,
        headers: buildHeaders({
          apiKey: config.apiKey,
          token,
          authHeaders,
          headers: serializedBody && !(body instanceof ArrayBuffer) ? { 'Content-Type': 'application/json', ...headers } : headers
        }),
        body: serializedBody,
        signal: controller.signal
      });

      const payload = await parseResponsePayload(response);

      if (!response.ok) {
        const error = new JurosBaixosApiError(`Juros Baixos request failed with status ${response.status}`, {
          statusCode: response.status,
          details: payload,
          code: 'JB_HTTP_ERROR'
        });

        if (attempt < maxRetries && RETRYABLE_STATUS_CODES.has(response.status)) {
          await sleep(200 * (attempt + 1));
          continue;
        }

        throw error;
      }

      return payload;
    } catch (error) {
      const isAbort = error?.name === 'AbortError';
      const isRetryableNetworkError = isAbort || error instanceof TypeError;

      if (attempt < maxRetries && isRetryableNetworkError) {
        await sleep(200 * (attempt + 1));
        continue;
      }

      if (error instanceof JurosBaixosApiError) throw error;

      throw new JurosBaixosApiError(isAbort ? 'Juros Baixos request timed out.' : 'Unexpected Juros Baixos request error.', {
        code: isAbort ? 'JB_TIMEOUT' : 'JB_NETWORK_ERROR',
        details: error?.message || null
      });
    } finally {
      clearTimeout(timer);
    }
  }

  throw new JurosBaixosApiError('Juros Baixos request exhausted retries.', { code: 'JB_RETRY_EXHAUSTED' });
};
