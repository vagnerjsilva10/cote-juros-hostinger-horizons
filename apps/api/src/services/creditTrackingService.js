import crypto from 'crypto';
import { getPrisma } from '../lib/prisma.js';

const maskCpf = (cpf = '') => {
  const digits = String(cpf).replace(/\D/g, '');
  if (!digits) return null;
  return `${digits.slice(0, 3)}***${digits.slice(-2)}`;
};

const safeLog = (payload = {}) => {
  const clone = { ...payload };
  if (clone.cpf) clone.cpf = maskCpf(clone.cpf);
  if (clone.externalJwt) clone.externalJwt = '[redacted]';
  if (clone.clientSecret) clone.clientSecret = '[redacted]';
  if (clone.apiKey) clone.apiKey = '[redacted]';
  return clone;
};

export class CreditTrackingService {
  static log(eventName, payload = {}, level = 'info') {
    const logger = console[level] || console.info;
    logger(`[${eventName}]`, safeLog(payload));
  }

  static async recordOfferClick(payload) {
    return getPrisma().creditOfferClick.create({
      data: {
        simulationId: payload.simulationId,
        offerSnapshotId: payload.offerSnapshotId,
        provider: payload.provider || 'juros_baixos',
        sourcePage: payload.sourcePage,
        utmSource: payload.utmSource || null,
        utmMedium: payload.utmMedium || null,
        utmCampaign: payload.utmCampaign || null
      }
    });
  }

  static async recordWebhookReceipt({ provider = 'juros_baixos', sourcePage = '/api/credit/webhook', simulationId = null, productContext = 'credit_webhook' } = {}) {
    return getPrisma().appIntegrationEvent.create({
      data: {
        sourcePage,
        productContext: `${provider}:${productContext}`,
        simulationId
      }
    });
  }

  static verifyWebhookSignature({ rawBody, signature, secret }) {
    if (!secret || !signature) return false;
    const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
    const normalizedSignature = signature.replace(/^sha256=/, '');
    if (expected.length !== normalizedSignature.length) return false;
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(normalizedSignature));
  }
}
