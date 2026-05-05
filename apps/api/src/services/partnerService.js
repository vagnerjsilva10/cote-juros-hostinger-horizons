import crypto from 'node:crypto';
import { getPrisma } from '../lib/prisma.js';

const ensureProtocol = (url) => (url && !url.startsWith('http') ? `https://${url}` : url);
const ALLOWED_CONVERSION_STATUS = new Set(['lead', 'approved', 'rejected', 'paid', 'canceled']);

const cleanUtm = (utm = {}) => ({
  source: utm.source || utm.utm_source || utm.utmSource || 'cotejuros',
  medium: utm.medium || utm.utm_medium || utm.utmMedium || null,
  campaign: utm.campaign || utm.utm_campaign || utm.utmCampaign || null,
  content: utm.content || utm.utm_content || utm.utmContent || null,
  term: utm.term || utm.utm_term || utm.utmTerm || null
});

const normalizePartner = (partner) => {
  if (!partner) return null;
  const metadata = partner.metadata && typeof partner.metadata === 'object' && !Array.isArray(partner.metadata)
    ? partner.metadata
    : {};
  return {
    ...partner,
    affiliateUrl: partner.affiliateUrl || partner.trackingLink || metadata.affiliateUrl || ''
  };
};

const hashIp = (value = '') => {
  const secret = process.env.TRACKING_HASH_SECRET || process.env.JWT_SECRET || '';
  if (!value || !secret) return null;
  return crypto.createHmac('sha256', secret).update(String(value)).digest('hex');
};

const getClientIp = (req) => {
  const forwarded = String(req?.headers?.['x-forwarded-for'] || '').split(',')[0].trim();
  return forwarded || req?.ip || req?.socket?.remoteAddress || '';
};

export class PartnerService {
  static buildRedirectUrl({ destinationUrl, trackingBaseUrl, sourcePage, utm = {}, offerId, clickId, partner }) {
    const base = trackingBaseUrl || destinationUrl;
    const safeBase = ensureProtocol(base || 'https://finance.cotejuros.com.br');
    const url = new URL(safeBase);
    const normalizedUtm = cleanUtm(utm);
    const metadata = partner?.metadata && typeof partner.metadata === 'object' && !Array.isArray(partner.metadata)
      ? partner.metadata
      : {};
    const acceptsXtra = metadata.acceptsXtra !== false;

    if (clickId && acceptsXtra) url.searchParams.set('xtra', clickId);
    if (offerId) url.searchParams.set('offer_id', offerId);
    if (sourcePage && !clickId) url.searchParams.set('source_page', sourcePage);

    if (normalizedUtm.source) url.searchParams.set('utm_source', normalizedUtm.source);
    if (normalizedUtm.medium) url.searchParams.set('utm_medium', normalizedUtm.medium);
    if (normalizedUtm.campaign) url.searchParams.set('utm_campaign', normalizedUtm.campaign);
    if (normalizedUtm.content) url.searchParams.set('utm_content', normalizedUtm.content);
    if (normalizedUtm.term) url.searchParams.set('utm_term', normalizedUtm.term);

    return url.toString();
  }

  static async findActivePartner({ partnerId, partnerSlug }) {
    if (!partnerId && !partnerSlug) return null;
    const partner = await getPrisma().partnerConfig.findFirst({
      where: {
        OR: [
          ...(partnerId ? [{ id: partnerId }, { slug: partnerId }] : []),
          ...(partnerSlug ? [{ slug: partnerSlug }, { id: partnerSlug }] : [])
        ],
        status: 'active',
        isActive: true
      }
    });
    return normalizePartner(partner);
  }

  static createClickId() {
    return `cj_${crypto.randomBytes(12).toString('hex')}`;
  }

  static async createTrackedRedirect({ partnerId, partnerSlug, simulationId, leadId, sourcePage, utm, userAgent, ipHash }) {
    const partner = await this.findActivePartner({ partnerId, partnerSlug });
    if (!partner) {
      const error = new Error('Parceiro ativo nao encontrado.');
      error.status = 404;
      error.code = 'PARTNER_NOT_FOUND';
      throw error;
    }
    if (!partner.affiliateUrl) {
      const error = new Error('Parceiro sem affiliateUrl configurada.');
      error.status = 422;
      error.code = 'PARTNER_AFFILIATE_URL_MISSING';
      throw error;
    }

    const normalizedUtm = cleanUtm(utm);
    const clickId = this.createClickId();
    const redirectUrl = this.buildRedirectUrl({
      destinationUrl: partner.affiliateUrl,
      sourcePage,
      utm: normalizedUtm,
      clickId,
      partner
    });

    const click = await getPrisma().partnerClick.create({
      data: {
        clickId,
        partnerId: partner.id,
        simulationId: simulationId || null,
        leadId: leadId || null,
        sourcePage,
        utmSource: normalizedUtm.source,
        utmMedium: normalizedUtm.medium,
        utmCampaign: normalizedUtm.campaign,
        utmContent: normalizedUtm.content,
        utmTerm: normalizedUtm.term,
        redirectUrl,
        userAgent: userAgent || null,
        ipHash: ipHash || null,
        status: 'redirect_started'
      }
    });

    return {
      ok: true,
      clickId,
      redirectUrl,
      resolvedUrl: redirectUrl,
      partnerId: partner.id,
      partnerSlug: partner.slug,
      click
    };
  }

  static async registerRedirect({ partnerId, offerId, sourcePage, destinationUrl }) {
    return getPrisma().partnerRedirect.create({
      data: {
        partnerId,
        offerId: offerId || null,
        sourcePage,
        destination: destinationUrl
      }
    });
  }

  static async registerLegacyRedirect({ partnerId, offerId, sourcePage, destinationUrl, trackingBaseUrl, utm }) {
    const redirectUrl = this.buildRedirectUrl({
      destinationUrl,
      trackingBaseUrl,
      sourcePage,
      offerId,
      utm
    });
    const record = await this.registerRedirect({
      partnerId,
      offerId,
      sourcePage,
      destinationUrl: redirectUrl
    });
    return { ...record, ok: true, resolvedUrl: redirectUrl, redirectUrl };
  }

  static assertPostbackSecret(secret) {
    const expected = process.env.PARTNER_POSTBACK_SECRET;
    if (!expected) {
      const error = new Error('Postback de parceiros indisponivel.');
      error.status = 503;
      error.code = 'PARTNER_POSTBACK_SECRET_NOT_CONFIGURED';
      throw error;
    }

    const provided = String(secret || '');
    const expectedBuffer = Buffer.from(expected);
    const providedBuffer = Buffer.from(provided);
    if (
      !provided
      || expectedBuffer.length !== providedBuffer.length
      || !crypto.timingSafeEqual(expectedBuffer, providedBuffer)
    ) {
      const error = new Error('Postback nao autorizado.');
      error.status = 401;
      error.code = 'PARTNER_POSTBACK_UNAUTHORIZED';
      throw error;
    }
  }

  static async recordPostback(payload = {}) {
    if (!ALLOWED_CONVERSION_STATUS.has(payload.status)) {
      const error = new Error('Status de conversao invalido.');
      error.status = 400;
      error.code = 'INVALID_CONVERSION_STATUS';
      throw error;
    }

    const click = await getPrisma().partnerClick.findUnique({
      where: { clickId: payload.clickId },
      include: { partner: true }
    });
    if (!click) {
      const error = new Error('clickId nao encontrado.');
      error.status = 404;
      error.code = 'CLICK_NOT_FOUND';
      throw error;
    }

    const partner = payload.partnerSlug
      ? await getPrisma().partnerConfig.findUnique({ where: { slug: payload.partnerSlug } })
      : click.partner;
    if (!partner || partner.id !== click.partnerId) {
      const error = new Error('Parceiro do postback nao corresponde ao clique.');
      error.status = 400;
      error.code = 'PARTNER_MISMATCH';
      throw error;
    }

    const data = {
      clickId: click.clickId,
      partnerId: click.partnerId,
      status: payload.status,
      externalId: payload.externalId || null,
      commissionValue: payload.commissionValue == null ? null : payload.commissionValue,
      contractValue: payload.contractValue == null ? null : payload.contractValue,
      rawPayload: payload.rawPayload || payload,
      receivedAt: new Date()
    };

    const conversion = payload.externalId
      ? await getPrisma().partnerConversion.upsert({
        where: {
          partnerId_externalId: {
            partnerId: click.partnerId,
            externalId: payload.externalId
          }
        },
        create: data,
        update: {
          status: data.status,
          commissionValue: data.commissionValue,
          contractValue: data.contractValue,
          rawPayload: data.rawPayload,
          receivedAt: data.receivedAt
        }
      })
      : await getPrisma().partnerConversion.create({ data });

    return {
      ok: true,
      conversionSaved: true,
      conversionId: conversion.id
    };
  }

  static async getPerformance() {
    const prisma = getPrisma();
    const partners = await prisma.partnerConfig.findMany({
      orderBy: [{ priority: 'desc' }, { name: 'asc' }],
      select: {
        id: true,
        name: true,
        slug: true,
        productType: true,
        productTypes: true
      }
    });

    const rows = await Promise.all(partners.map(async (partner) => {
      const [clicks, conversions] = await Promise.all([
        prisma.partnerClick.count({ where: { partnerId: partner.id } }),
        prisma.partnerConversion.findMany({ where: { partnerId: partner.id } })
      ]);
      const leads = conversions.filter((item) => item.status === 'lead').length;
      const approved = conversions.filter((item) => item.status === 'approved').length;
      const paidItems = conversions.filter((item) => item.status === 'paid');
      const paid = paidItems.length;
      const revenue = paidItems.reduce((sum, item) => sum + Number(item.commissionValue || 0), 0);
      const lastConversionAt = conversions.reduce((latest, item) => {
        const date = item.receivedAt || item.createdAt;
        return !latest || date > latest ? date : latest;
      }, null);

      return {
        partnerId: partner.id,
        partnerName: partner.name,
        partnerSlug: partner.slug,
        productType: partner.productType || partner.productTypes?.[0] || null,
        clicks,
        leads,
        approved,
        paid,
        revenue,
        clickToLeadRate: clicks ? leads / clicks : 0,
        clickToPaidRate: clicks ? paid / clicks : 0,
        revenuePerClick: clicks ? revenue / clicks : 0,
        lastConversionAt
      };
    }));

    return rows;
  }

  static buildRequestIpHash(req) {
    return hashIp(getClientIp(req));
  }

  static async submitMockApiLead({ partnerId, leadId, sourcePage, productType, profile }) {
    const event = await getPrisma().appIntegrationEvent.create({
      data: {
        sourcePage,
        productContext: `mock_api:${partnerId}:${productType || 'loan'}:${profile || 'sem_perfil'}`,
        simulationId: leadId || null
      }
    });

    return {
      id: event.id,
      partnerId,
      leadId: leadId || null,
      status: 'accepted',
      externalProtocol: `mock_${event.id}`,
      createdAt: event.createdAt
    };
  }
}
