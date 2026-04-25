import crypto from 'crypto';
import { getCreditasConfig } from './config.js';

const getHeader = (headers, name) => {
  const value = headers?.[name] || headers?.[name.toLowerCase()];
  return Array.isArray(value) ? value[0] : value;
};

const parseSignatureInput = (value = '') => {
  const [, ...params] = String(value).split(';');
  return params.reduce((acc, item) => {
    const [key, rawValue] = item.split('=');
    if (key && rawValue) acc[key.trim()] = rawValue.trim().replace(/^"|"$/g, '');
    return acc;
  }, {});
};

const extractSignature = (value = '') => {
  const match = String(value).match(/:([a-f0-9+/=]+):/i);
  return match?.[1] || String(value).trim();
};

const timingSafeEqual = (a, b) => {
  const left = Buffer.from(String(a));
  const right = Buffer.from(String(b));
  return left.length === right.length && crypto.timingSafeEqual(left, right);
};

const sha256 = (body, encoding) =>
  crypto.createHash('sha256').update(body || Buffer.alloc(0)).digest(encoding);

const validateDigest = ({ rawBody, digest }) => {
  if (!digest) return { checked: false, valid: null };

  const [, value] = String(digest).split('=');
  if (!value) return { checked: true, valid: false };

  const expectedHex = sha256(rawBody, 'hex');
  const expectedBase64 = sha256(rawBody, 'base64');

  return {
    checked: true,
    valid: timingSafeEqual(value, expectedHex) || timingSafeEqual(value, expectedBase64)
  };
};

export const verifyCreditasWebhookSignature = ({ headers, rawBody, targetUri } = {}) => {
  const config = getCreditasConfig();
  if (!config.webhookSecret) {
    return { checked: false, valid: true, reason: 'CREDITAS_WEBHOOK_SECRET not configured' };
  }

  const digest = getHeader(headers, 'digest');
  const signature = getHeader(headers, 'signature');
  const signatureInput = getHeader(headers, 'signature-input');
  const host = getHeader(headers, 'host') || '';

  if (!digest || !signature || !signatureInput) {
    return { checked: true, valid: false, reason: 'Missing digest, signature, or signature-input header' };
  }

  const digestResult = validateDigest({ rawBody, digest });
  if (digestResult.checked && !digestResult.valid) {
    return { checked: true, valid: false, reason: 'Invalid digest header' };
  }

  const params = parseSignatureInput(signatureInput);
  if (params.alg !== 'hmac-sha256') {
    return { checked: true, valid: false, reason: 'Unsupported signature algorithm' };
  }

  const received = extractSignature(signature);
  const signatureParams = String(signature).split(':')[2] || '';
  const candidates = [
    `digest: ${digest}\nhost: ${host}\n${params.created || ''}${params.nonce || ''}${signatureParams}`,
    `digest: ${digest}\n@target-uri: ${targetUri || ''}\n${params.created || ''}${params.nonce || ''}${signatureParams}`,
    `"digest": ${digest}\n"@target-uri": ${targetUri || ''}\n"@signature-params": ${signatureInput}`
  ];

  const valid = candidates.some((candidate) => {
    const expectedHex = crypto.createHmac('sha256', config.webhookSecret).update(candidate).digest('hex');
    const expectedBase64 = crypto.createHmac('sha256', config.webhookSecret).update(candidate).digest('base64');
    return timingSafeEqual(received, expectedHex) || timingSafeEqual(received, expectedBase64);
  });

  return {
    checked: true,
    valid,
    reason: valid ? null : 'Invalid webhook signature'
  };
};
