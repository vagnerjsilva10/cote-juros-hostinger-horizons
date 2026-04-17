const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const toIsoString = (value) => {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
};

const maskSensitive = (value) => {
  if (!value || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map(maskSensitive);
  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => {
      if (['cpf', 'cpfHash', 'phone', 'email', 'fullName', 'mothersName'].includes(key)) {
        const text = String(item || '');
        return [key, text ? `${text.slice(0, 3)}***${text.slice(-2)}` : null];
      }
      return [key, maskSensitive(item)];
    })
  );
};

const postJson = async (url, payload, headers = {}) => {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...headers
    },
    body: JSON.stringify(payload)
  });

  const text = await response.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = { raw: text };
  }

  if (!response.ok) {
    const error = new Error(`Delivery failed with status ${response.status}`);
    error.responsePayload = body;
    throw error;
  }

  return body;
};

export const ReactivationDeliveryService = {
  maskSensitive,

  buildPayload({ lead, partner, score }) {
    return {
      leadId: lead.id,
      externalLeadId: lead.externalLeadId,
      fullName: lead.fullName,
      email: lead.email,
      phone: lead.phone,
      productType: lead.productType,
      requestedAmount: lead.requestedAmount ? Number(lead.requestedAmount) : null,
      income: lead.income ? Number(lead.income) : null,
      employmentStatus: lead.employmentStatus,
      hasRestriction: lead.hasRestriction,
      score,
      partner: {
        id: partner.id,
        name: partner.name,
        mode: partner.mode
      },
      consent: {
        givenAt: toIsoString(lead.consentGivenAt),
        version: lead.consentVersion,
        privacyPolicyVersion: lead.privacyPolicyVersion,
        source: lead.consentSource
      }
    };
  },

  getBackoffMs(retryCount = 0) {
    const baseMs = Number(process.env.REACTIVATION_DELIVERY_BACKOFF_MS || 1000);
    const cappedRetry = Math.min(Number(retryCount || 0), 5);
    return baseMs * 2 ** cappedRetry;
  },

  async deliver({ lead, partner, score, redirectUrl, retryCount = 0 }) {
    const payload = this.buildPayload({ lead, partner, score });
    const attempts = Math.max(1, Number(process.env.REACTIVATION_DELIVERY_ATTEMPTS || 3));
    let lastError = null;

    const send = async () => {
      if (partner.mode === 'webhook' && partner.destination) {
        const headers = process.env.REACTIVATION_PARTNER_WEBHOOK_TOKEN
          ? { Authorization: `Bearer ${process.env.REACTIVATION_PARTNER_WEBHOOK_TOKEN}` }
          : {};
        console.info('[reactivation.delivery.webhook.attempt]', {
          leadId: lead.id,
          partnerId: partner.id,
          retryCount,
          destinationHost: new URL(partner.destination).host
        });
        const responsePayload = await postJson(partner.destination, payload, headers);
        console.info('[reactivation.delivery.webhook.success]', {
          leadId: lead.id,
          partnerId: partner.id
        });
        return { status: 'delivery_success', requestPayload: maskSensitive(payload), responsePayload, destination: partner.destination };
      }

      if (partner.mode === 'email' && process.env.EMAIL_API_URL) {
        const responsePayload = await postJson(
          process.env.EMAIL_API_URL,
          {
            to: lead.email || process.env.REACTIVATION_NURTURE_EMAIL,
            templateId: process.env.EMAIL_REACTIVATION_TEMPLATE_ID,
            data: payload
          },
          process.env.EMAIL_API_KEY ? { Authorization: `Bearer ${process.env.EMAIL_API_KEY}` } : {}
        );
        return { status: 'delivery_success', requestPayload: maskSensitive(payload), responsePayload, destination: process.env.EMAIL_API_URL };
      }

      if (partner.mode === 'whatsapp' && process.env.WHATSAPP_API_URL) {
        const responsePayload = await postJson(
          process.env.WHATSAPP_API_URL,
          {
            to: lead.phone,
            template: process.env.WHATSAPP_REACTIVATION_TEMPLATE || 'cote_juros_reactivation',
            data: payload
          },
          process.env.WHATSAPP_API_KEY ? { Authorization: `Bearer ${process.env.WHATSAPP_API_KEY}` } : {}
        );
        return { status: 'delivery_success', requestPayload: maskSensitive(payload), responsePayload, destination: process.env.WHATSAPP_API_URL };
      }

      if (partner.mode === 'webhook' && !partner.destination) {
        console.warn('[reactivation.delivery.webhook.missing_destination]', {
          leadId: lead.id,
          partnerId: partner.id
        });
        return {
          status: 'pending_delivery',
          requestPayload: maskSensitive(payload),
          responsePayload: { reason: 'missing_partner_webhook_destination', partnerId: partner.id },
          destination: null
        };
      }

      return {
        status: partner.mode === 'redirect' ? 'delivery_success' : 'pending_delivery',
        requestPayload: maskSensitive(payload),
        responsePayload: null,
        destination: redirectUrl || partner.destination || null
      };
    };

    for (let attempt = 0; attempt < attempts; attempt += 1) {
      try {
        return await send();
      } catch (error) {
        lastError = error;
        if (attempt < attempts - 1) await sleep(this.getBackoffMs(retryCount + attempt));
      }
    }

    lastError.nextAttemptAt = new Date(Date.now() + this.getBackoffMs(retryCount + attempts));
    throw lastError;
  }
};
