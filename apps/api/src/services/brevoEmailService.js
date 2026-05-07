import axios from 'axios';

const BREVO_SMTP_EMAIL_URL = 'https://api.brevo.com/v3/smtp/email';
const DEFAULT_TIMEOUT_MS = 15000;
const DEFAULT_RETRIES = 2;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const isRetryableStatus = (status) => status === 429 || (status >= 500 && status <= 599);

const normalizeBrevoError = (error) => {
  const status = error.response?.status || null;
  const body = error.response?.data || null;
  const message = body?.message || body?.error || error.message || 'Brevo email request failed';
  const normalized = new Error(`Brevo ${status || 'request'}: ${message}`);
  normalized.name = 'BrevoEmailError';
  normalized.status = status;
  normalized.code = body?.code || error.code || null;
  normalized.retryable = status ? isRetryableStatus(status) : Boolean(error.code);
  normalized.responseBody = body;
  return normalized;
};

const validateEmailPayload = ({ to, subject, htmlContent, textContent }) => {
  const email = typeof to === 'string' ? to : to?.email;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || ''))) {
    throw new Error('Brevo payload validation failed: recipient email is invalid');
  }
  if (!subject) throw new Error('Brevo payload validation failed: subject is required');
  if (!htmlContent) throw new Error('Brevo payload validation failed: htmlContent is required');
  if (!textContent) throw new Error('Brevo payload validation failed: textContent is required');
};

export const buildBrevoTransactionalEmailPayload = ({
  to,
  name,
  subject,
  htmlContent,
  textContent,
  tags = [],
  params = {},
  headers = {},
  replyTo,
  senderName = process.env.BREVO_SENDER_NAME || 'Cote Juros',
  senderEmail = process.env.BREVO_SENDER_EMAIL,
}) => {
  const recipientEmail = typeof to === 'string' ? to : to?.email;
  const recipientName = name || (typeof to === 'object' ? to?.name : undefined);
  return {
    sender: {
      name: senderName,
      email: senderEmail,
    },
    to: [
      {
        email: recipientEmail,
        ...(recipientName ? { name: recipientName } : {}),
      },
    ],
    subject,
    htmlContent,
    textContent,
    ...(replyTo?.email ? { replyTo } : {}),
    ...(Object.keys(headers || {}).length > 0 ? { headers } : {}),
    ...(tags.length > 0 ? { tags } : {}),
    ...(Object.keys(params || {}).length > 0 ? { params } : {}),
  };
};

export async function sendBrevoTransactionalEmail({
  to,
  name,
  subject,
  htmlContent,
  textContent,
  tags = [],
  params = {},
  headers = {},
  replyTo,
  senderName,
  senderEmail,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  retries = DEFAULT_RETRIES,
}) {
  if (!process.env.BREVO_API_KEY) {
    throw new Error('BREVO_API_KEY is required when REACTIVATION_EMAIL_DRY_RUN=false');
  }
  if (!process.env.BREVO_SENDER_EMAIL) {
    throw new Error('BREVO_SENDER_EMAIL is required when REACTIVATION_EMAIL_DRY_RUN=false');
  }

  validateEmailPayload({ to, subject, htmlContent, textContent });
  const payload = buildBrevoTransactionalEmailPayload({
    to,
    name,
    subject,
    htmlContent,
    textContent,
    tags,
    params,
    headers,
    replyTo,
    senderName,
    senderEmail,
  });

  let lastError = null;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const response = await axios.post(BREVO_SMTP_EMAIL_URL, payload, {
        timeout: timeoutMs,
        headers: {
          'api-key': process.env.BREVO_API_KEY,
          'Content-Type': 'application/json',
        },
      });

      return {
        statusCode: response.status,
        providerMessageId: response.data?.messageId || null,
        responsePayload: {
          messageId: response.data?.messageId || null,
        },
      };
    } catch (error) {
      lastError = normalizeBrevoError(error);
      if (!lastError.retryable || attempt === retries) break;
      await sleep(500 * 2 ** attempt);
    }
  }

  throw lastError;
}

export async function sendBrevoBatchReactivationEmails(messages, options = {}) {
  const results = [];
  for (const message of messages) {
    results.push(await sendBrevoTransactionalEmail({ ...message, ...options }));
  }
  return results;
}
