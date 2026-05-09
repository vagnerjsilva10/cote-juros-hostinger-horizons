import crypto from 'node:crypto';
import { getPrisma } from '../lib/prisma.js';

const DEFAULT_FALLBACK_URL = 'https://www.cotejuros.com.br';
const CLICK_ID_BYTES = 18;

const safeUrl = (value, fallback = DEFAULT_FALLBACK_URL) => {
  try {
    const url = new URL(String(value || fallback));
    if (!['http:', 'https:'].includes(url.protocol)) return fallback;
    return url.toString();
  } catch {
    return fallback;
  }
};

const normalizeDecimal = (value) => {
  if (value === undefined || value === null || value === '') return null;
  const number = Number(value);
  if (!Number.isFinite(number)) return null;
  return number.toFixed(2);
};

const getIp = (req) => String(req?.headers?.['x-forwarded-for'] || req?.socket?.remoteAddress || '')
  .split(',')[0]
  .trim() || null;

export class CampaignTrackingService {
  static publicApiBaseUrl() {
    return safeUrl(
      process.env.PUBLIC_API_BASE_URL ||
        process.env.COTE_API_BASE_URL ||
        process.env.API_PUBLIC_URL ||
        'https://api.cotejuros.com.br'
    ).replace(/\/+$/, '');
  }

  static fallbackUrl() {
    return safeUrl(
      process.env.CAMPAIGN_REDIRECT_FALLBACK_URL ||
        process.env.REACTIVATION_BASE_URL ||
        DEFAULT_FALLBACK_URL
    );
  }

  static buildGoUrl(clickId) {
    return `${this.publicApiBaseUrl()}/go/${encodeURIComponent(clickId)}`;
  }

  static async ensureEmailCtaClick({ lead, campaign, messageRecord, sequence, destinationUrl, fallbackUrl }) {
    const prisma = getPrisma();
    const existing = messageRecord?.id
      ? await prisma.ctaClick.findFirst({
          where: {
            messageId: messageRecord.id,
            ctaType: sequence?.key || 'email_cta',
          },
        })
      : null;

    if (existing) return existing;

    return prisma.ctaClick.create({
      data: {
        clickId: this.generateClickId(),
        leadId: messageRecord?.leadId || (!process.env.REACTIVATION_TEST_EMAIL ? lead?.leadId || null : null),
        campaignId: campaign?.id || null,
        messageId: messageRecord?.id || null,
        source: 'reactivation_email',
        ctaType: sequence?.key || 'email_cta',
        destinationUrl: safeUrl(destinationUrl, this.fallbackUrl()),
        fallbackUrl: safeUrl(fallbackUrl || destinationUrl, this.fallbackUrl()),
        metadata: {
          campaignSlug: campaign?.slug || null,
          sequenceKey: sequence?.key || null,
          testMode: Boolean(process.env.REACTIVATION_TEST_EMAIL),
        },
      },
    });
  }

  static generateClickId() {
    return crypto.randomBytes(CLICK_ID_BYTES).toString('base64url');
  }

  static hashIp(ip) {
    if (!ip) return null;
    const secret = process.env.TRACKING_HASH_SECRET || process.env.REACTIVATION_PII_HASH_SECRET || 'local-dev-secret';
    return crypto.createHmac('sha256', secret).update(String(ip)).digest('hex');
  }

  static async resolveClick(clickId) {
    const prisma = getPrisma();
    return prisma.ctaClick.findUnique({
      where: { clickId },
      include: {
        partner: true,
        affiliateOffer: true,
      },
    });
  }

  static destinationForClick(click) {
    const partnerUrl = click?.partner?.affiliateUrl || click?.partner?.trackingLink || null;
    const affiliateUrl = click?.affiliateOffer?.trackingUrl || click?.affiliateOffer?.destinationUrl || null;
    return safeUrl(partnerUrl || affiliateUrl || click?.destinationUrl, click?.fallbackUrl || this.fallbackUrl());
  }

  static async registerRedirect({ click, req, destinationUrl, status = 'redirect_completed', httpStatus = 302, errorMessage = null }) {
    const prisma = getPrisma();
    const now = new Date();
    const [redirect] = await prisma.$transaction([
      prisma.redirectAttempt.create({
        data: {
          clickId: click.clickId,
          partnerId: click.partnerId || null,
          destinationUrl: safeUrl(destinationUrl, click.fallbackUrl || this.fallbackUrl()),
          fallbackUrl: safeUrl(click.fallbackUrl || this.fallbackUrl()),
          status,
          httpStatus,
          userAgent: req?.headers?.['user-agent'] || null,
          ipHash: this.hashIp(getIp(req)),
          referer: req?.headers?.referer || req?.headers?.referrer || null,
          errorMessage,
        },
      }),
      prisma.ctaClick.update({
        where: { clickId: click.clickId },
        data: {
          clickedAt: click.clickedAt || now,
          status: status === 'redirect_completed' ? 'clicked' : status,
        },
      }),
    ]);
    return redirect;
  }

  static async recordManualConversion(payload) {
    const prisma = getPrisma();
    const click = await prisma.ctaClick.findUnique({ where: { clickId: payload.clickId } });
    if (!click) {
      const error = new Error('CtaClick not found');
      error.statusCode = 404;
      throw error;
    }

    const conversion = await prisma.conversionAttribution.create({
      data: {
        clickId: click.clickId,
        partnerId: payload.partnerId || click.partnerId || null,
        status: payload.status || 'confirmed',
        externalId: payload.externalId || null,
        commissionValue: normalizeDecimal(payload.commissionValue ?? payload.commission),
        contractValue: normalizeDecimal(payload.contractValue ?? payload.value),
        currency: payload.currency || 'BRL',
        convertedAt: payload.convertedAt ? new Date(payload.convertedAt) : null,
        rawPayload: payload.rawPayload || {
          source: 'manual_import',
          receivedFields: Object.keys(payload).sort(),
        },
      },
    });

    return { click, conversion };
  }

  static async dashboardSummary() {
    const prisma = getPrisma();
    const [emailsSent, clicks, redirects, conversions, revenue] = await Promise.all([
      prisma.reactivationEmailMessage.count({
        where: { status: { in: ['sent', 'delivered', 'opened', 'clicked'] } },
      }),
      prisma.ctaClick.count(),
      prisma.redirectAttempt.count(),
      prisma.conversionAttribution.count(),
      prisma.conversionAttribution.aggregate({
        _sum: { commissionValue: true },
        where: { status: { in: ['confirmed', 'approved', 'paid'] } },
      }),
    ]);

    return {
      emailsSent,
      clicks,
      redirects,
      conversions,
      revenue: Number(revenue._sum.commissionValue || 0),
      currency: 'BRL',
    };
  }
}
