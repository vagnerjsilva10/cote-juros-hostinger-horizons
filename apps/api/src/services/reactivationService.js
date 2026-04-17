import crypto from 'crypto';
import { getPrisma } from '../lib/prisma.js';
import { ReactivationTokenService } from './reactivationTokenService.js';
import { ReactivationScoringService } from './reactivationScoringService.js';
import { ReactivationRoutingService } from './reactivationRoutingService.js';
import { ReactivationDeliveryService } from './reactivationDeliveryService.js';
import { ReactivationValidationService } from './reactivationValidationService.js';

const LOCK_TTL_MS = 2 * 60 * 1000;

const publicLead = (lead) => {
  if (!lead) return null;
  return {
    id: lead.id,
    externalLeadId: lead.externalLeadId,
    batchId: lead.batchId,
    status: lead.status,
    fullName: lead.fullName,
    email: lead.email,
    phone: lead.phone,
    productType: lead.productType,
    source: lead.source,
    segment: lead.segment,
    requestedAmount: lead.requestedAmount ? Number(lead.requestedAmount) : null,
    income: lead.income ? Number(lead.income) : null,
    employmentStatus: lead.employmentStatus,
    hasRestriction: lead.hasRestriction,
    hasGuarantee: lead.hasGuarantee,
    guaranteeType: lead.guaranteeType,
    scoreValue: lead.scoreValue,
    scoreBand: lead.scoreBand,
    qualification: lead.qualification,
    selectedPartnerId: lead.selectedPartnerId,
    selectedPartnerName: lead.selectedPartnerName,
    deliveryStatus: lead.deliveryStatus,
    estimatedRevenueCents: lead.estimatedRevenueCents,
    payoutCents: lead.payoutCents,
    expiresAt: lead.expiresAt,
    createdAt: lead.createdAt,
    updatedAt: lead.updatedAt
  };
};

const getClientIp = (req) =>
  String(req?.headers?.['x-forwarded-for'] || req?.socket?.remoteAddress || '')
    .split(',')[0]
    .trim();

const safeCreate = async (promiseFactory) => {
  try {
    return await promiseFactory();
  } catch (error) {
    if (error?.code === 'P2002') return null;
    throw error;
  }
};

const deliveryStatusToLeadStatus = (status) => {
  if (status === 'delivery_success') return 'delivery_success';
  if (status === 'delivery_retrying') return 'delivery_retrying';
  if (status === 'delivery_failed') return 'delivery_failed';
  return 'pending_delivery';
};

export const ReactivationService = {
  getClientIp,

  async audit({ leadId, eventType, actor = 'system', req, source, metadata, idempotencyKey }) {
    const prisma = getPrisma();
    return safeCreate(() =>
      prisma.reactivationAuditEvent.create({
        data: {
          leadId: leadId || null,
          eventType,
          actor,
          ipAddress: req ? getClientIp(req) : null,
          userAgent: req?.headers?.['user-agent'] || null,
          source: source || null,
          idempotencyKey: idempotencyKey || null,
          metadata: metadata || undefined
        }
      })
    );
  },

  async createLeadFromImport(payload = {}) {
    const prisma = getPrisma();
    const normalized = ReactivationValidationService.normalizeLeadInput(payload);
    const token = payload.token || ReactivationTokenService.generateToken();
    const tokenHash = ReactivationTokenService.hashToken(token);
    const expiresAt = payload.expiresAt
      ? new Date(payload.expiresAt)
      : new Date(Date.now() + Number(process.env.REACTIVATION_TOKEN_TTL_DAYS || 45) * 24 * 60 * 60 * 1000);
    const externalLeadId = payload.externalLeadId || null;
    const batchId = payload.batchId || null;

    const existing = externalLeadId
      ? await prisma.reactivationLead.findFirst({ where: { externalLeadId, batchId } })
      : null;
    if (existing) return { lead: publicLead(existing), token: null, duplicate: true };

    const lead = await prisma.reactivationLead.create({
      data: {
        externalLeadId,
        batchId,
        tokenHash,
        tokenLast4: ReactivationTokenService.last4(token),
        fullName: normalized.fullName,
        email: normalized.email,
        phone: normalized.phone,
        cpfHash: ReactivationTokenService.hashCpf(payload.cpf),
        productType: normalized.productType,
        source: normalized.source || 'base_consolidada',
        segment: normalized.segment,
        originalPayload: payload.originalPayload || payload,
        requestedAmount: normalized.requestedAmount,
        income: normalized.income,
        employmentStatus: normalized.employmentStatus,
        hasRestriction: normalized.hasRestriction,
        hasGuarantee: normalized.hasGuarantee,
        guaranteeType: normalized.guaranteeType,
        expiresAt
      }
    });

    await this.audit({
      leadId: lead.id,
      eventType: 'lead_imported',
      idempotencyKey: `lead_imported:${lead.id}`,
      metadata: { batchId: lead.batchId, source: lead.source }
    });
    await this.audit({
      leadId: lead.id,
      eventType: 'link_generated',
      idempotencyKey: `link_generated:${lead.id}:${lead.tokenLast4}`,
      metadata: { tokenLast4: lead.tokenLast4, expiresAt }
    });

    return { lead: publicLead(lead), token };
  },

  async getByToken(token, { req, markViewed = false } = {}) {
    const prisma = getPrisma();
    const tokenHash = ReactivationTokenService.hashToken(token);
    const lead = await prisma.reactivationLead.findUnique({ where: { tokenHash } });
    if (!lead) return null;

    if (lead.tokenRevokedAt || lead.consentRevokedAt) return { ...publicLead(lead), status: 'revoked' };
    if (lead.expiresAt && lead.expiresAt < new Date()) {
      const expired = await prisma.reactivationLead.update({ where: { id: lead.id }, data: { status: 'expired' } });
      await this.audit({ leadId: lead.id, eventType: 'token_expired', req, source: '/r/[token]', idempotencyKey: `token_expired:${lead.id}` });
      return publicLead(expired);
    }

    if (markViewed) {
      const updated = await prisma.reactivationLead.update({
        where: { id: lead.id },
        data: {
          status: lead.status === 'imported' ? 'visited' : lead.status,
          lastUsedAt: new Date()
        }
      });
      await this.audit({
        leadId: lead.id,
        eventType: 'page_viewed',
        req,
        source: '/r/[token]',
        metadata: { tokenLast4: lead.tokenLast4 }
      });
      return publicLead(updated);
    }

    return publicLead(lead);
  },

  async checkSuppression({ email, phone, cpfHash }) {
    const prisma = getPrisma();
    const emailHash = ReactivationTokenService.hashEmail(email);
    const phoneHash = ReactivationTokenService.hashPhone(phone);
    const filters = [];
    if (emailHash) filters.push({ emailHash });
    if (phoneHash) filters.push({ phoneHash });
    if (cpfHash) filters.push({ cpfHash });
    if (!filters.length) return { suppressed: false, matches: [] };

    const matches = await prisma.reactivationSuppression.findMany({
      where: {
        OR: filters,
        scope: { in: ['dnc_global', 'revoked_consent', 'unsubscribe_email', 'unsubscribe_whatsapp'] }
      },
      take: 20
    });

    return {
      suppressed: matches.some((item) => ['dnc_global', 'revoked_consent'].includes(item.scope)),
      emailSuppressed: Boolean(emailHash && matches.some((item) => item.emailHash === emailHash && item.scope === 'unsubscribe_email')),
      whatsappSuppressed: Boolean(phoneHash && matches.some((item) => item.phoneHash === phoneHash && item.scope === 'unsubscribe_whatsapp')),
      matches
    };
  },

  async acquireLeadLock(leadId) {
    const prisma = getPrisma();
    const lockId = crypto.randomUUID();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + LOCK_TTL_MS);
    const result = await prisma.reactivationLead.updateMany({
      where: {
        id: leadId,
        OR: [{ processingExpiresAt: null }, { processingExpiresAt: { lt: now } }]
      },
      data: {
        processingLockId: lockId,
        processingStartedAt: now,
        processingExpiresAt: expiresAt
      }
    });
    return result.count === 1 ? lockId : null;
  },

  async releaseLeadLock(leadId, lockId) {
    const prisma = getPrisma();
    await prisma.reactivationLead.updateMany({
      where: { id: leadId, processingLockId: lockId },
      data: {
        processingLockId: null,
        processingExpiresAt: null
      }
    });
  },

  async submit({ token, payload, req }) {
    const prisma = getPrisma();
    const normalized = ReactivationValidationService.normalizeLeadInput(payload);
    ReactivationValidationService.assertSubmittable(normalized);

    const tokenHash = ReactivationTokenService.hashToken(token);
    const currentLead = await prisma.reactivationLead.findUnique({ where: { tokenHash } });
    if (!currentLead) return null;

    if (currentLead.tokenRevokedAt || currentLead.consentRevokedAt) {
      return { revoked: true, lead: publicLead(currentLead) };
    }
    if (currentLead.expiresAt && currentLead.expiresAt < new Date()) {
      await prisma.reactivationLead.update({ where: { id: currentLead.id }, data: { status: 'expired' } });
      await this.audit({ leadId: currentLead.id, eventType: 'token_expired', req, source: '/api/reactivation/submit', idempotencyKey: `token_expired:${currentLead.id}` });
      return { expired: true, lead: publicLead(currentLead) };
    }

    const idempotencyKey =
      payload.idempotencyKey ||
      ReactivationTokenService.buildIdempotencyKey([currentLead.id, normalized.phone, normalized.email, normalized.requestedAmount, normalized.income]);

      if (currentLead.idempotencyKey === idempotencyKey && currentLead.deliveryStatus) {
        await this.audit({
        leadId: currentLead.id,
        eventType: 'duplicate_submit_ignored',
        req,
        idempotencyKey: `duplicate_submit_ignored:${currentLead.id}:${idempotencyKey}`
      });
      const delivery = await prisma.reactivationPartnerDelivery.findFirst({ where: { leadId: currentLead.id }, orderBy: { createdAt: 'desc' } });
      return {
        duplicate: true,
        lead: publicLead(currentLead),
        partner: currentLead.selectedPartnerId ? { id: currentLead.selectedPartnerId, name: currentLead.selectedPartnerName } : null,
        redirectUrl: delivery?.destination || null,
        delivery
      };
    }

    if (currentLead.idempotencyKey && currentLead.idempotencyKey !== idempotencyKey) {
      const existingDelivery = await prisma.reactivationPartnerDelivery.findFirst({ where: { leadId: currentLead.id }, orderBy: { createdAt: 'desc' } });
      if (existingDelivery) {
        await this.audit({
          leadId: currentLead.id,
          eventType: 'duplicate_submit_ignored',
          req,
          idempotencyKey: `duplicate_submit_ignored:${currentLead.id}:${idempotencyKey}`,
          metadata: { existingIdempotencyKey: currentLead.idempotencyKey, deliveryId: existingDelivery.id }
        });
        return {
          duplicate: true,
          lead: publicLead(currentLead),
          partner: currentLead.selectedPartnerId ? { id: currentLead.selectedPartnerId, name: currentLead.selectedPartnerName } : null,
          redirectUrl: existingDelivery.destination || null,
          delivery: existingDelivery
        };
      }
    }

    const suppression = await this.checkSuppression({ email: normalized.email, phone: normalized.phone, cpfHash: currentLead.cpfHash });
    await this.audit({
      leadId: currentLead.id,
      eventType: 'suppression_checked',
      req,
      idempotencyKey: `suppression_checked:${currentLead.id}:${idempotencyKey}`,
      metadata: {
        suppressed: suppression.suppressed,
        emailSuppressed: suppression.emailSuppressed,
        whatsappSuppressed: suppression.whatsappSuppressed
      }
    });
    if (suppression.suppressed || suppression.emailSuppressed || suppression.whatsappSuppressed) {
      const suppressedLead = await prisma.reactivationLead.update({
        where: { id: currentLead.id },
        data: { status: 'suppressed', deliveryStatus: 'suppressed', idempotencyKey }
      });
      return { suppressed: true, lead: publicLead(suppressedLead) };
    }

    const lockId = await this.acquireLeadLock(currentLead.id);
    if (!lockId) {
      return { processing: true, lead: publicLead(currentLead) };
    }

    try {
      const submittedAt = new Date();
      const consentVersion = payload.consentVersion || process.env.REACTIVATION_CONSENT_VERSION || '2026-04-16';
      const privacyPolicyVersion =
        payload.privacyPolicyVersion || process.env.REACTIVATION_PRIVACY_POLICY_VERSION || consentVersion;
      const submissionHash = ReactivationTokenService.hashPayload({
        leadId: currentLead.id,
        idempotencyKey,
        normalized
      });

      const updatedLead = await prisma.reactivationLead.update({
        where: { id: currentLead.id },
        data: {
          status: 'consented',
          fullName: normalized.fullName || currentLead.fullName,
          email: normalized.email || currentLead.email,
          phone: normalized.phone || currentLead.phone,
          productType: normalized.productType || currentLead.productType,
          requestedAmount: normalized.requestedAmount,
          income: normalized.income,
          employmentStatus: normalized.employmentStatus,
          hasRestriction: normalized.hasRestriction,
          hasGuarantee: normalized.hasGuarantee,
          guaranteeType: normalized.guaranteeType,
          consentGivenAt: submittedAt,
          consentIp: getClientIp(req),
          consentUserAgent: req?.headers?.['user-agent'] || null,
          consentVersion,
          privacyPolicyVersion,
          consentSource: payload.source || '/r/[token]',
          idempotencyKey,
          submissionHash,
          submittedAt,
          lastUsedAt: submittedAt
        }
      });

      await this.audit({ leadId: updatedLead.id, eventType: 'consent_granted', req, source: '/r/[token]', idempotencyKey: `consent_granted:${updatedLead.id}:${idempotencyKey}`, metadata: { consentVersion, privacyPolicyVersion, tokenLast4: updatedLead.tokenLast4 } });
      await this.audit({ leadId: updatedLead.id, eventType: 'form_submitted', req, source: '/r/[token]', idempotencyKey: `form_submitted:${updatedLead.id}:${idempotencyKey}`, metadata: { submissionHash } });

      const score = ReactivationScoringService.calculate({
        income: updatedLead.income ? Number(updatedLead.income) : 0,
        requestedAmount: updatedLead.requestedAmount ? Number(updatedLead.requestedAmount) : 0,
        employmentStatus: updatedLead.employmentStatus,
        hasRestriction: updatedLead.hasRestriction,
        hasGuarantee: updatedLead.hasGuarantee,
        guaranteeType: updatedLead.guaranteeType,
        segment: updatedLead.segment,
        hasConsent: true
      });

      const partner = ReactivationRoutingService.selectPartner(updatedLead, score);
      const redirectUrl = ReactivationRoutingService.buildRedirectUrl({
        partner,
        leadId: updatedLead.id,
        tokenLast4: updatedLead.tokenLast4,
        utm: {
          utm_source: 'reactivation',
          utm_medium: 'landing',
          utm_campaign: updatedLead.batchId || 'base_antiga'
        }
      });

      const deliveryIdempotencyKey = ReactivationTokenService.buildIdempotencyKey([
        'delivery',
        updatedLead.id,
        partner.id,
        idempotencyKey
      ]);

      const existingDelivery = await prisma.reactivationPartnerDelivery.findFirst({
        where: { OR: [{ idempotencyKey: deliveryIdempotencyKey }, { leadId: updatedLead.id, partnerId: partner.id }] }
      });
      const deliverySeed = existingDelivery || (await prisma.reactivationPartnerDelivery.create({
        data: {
          leadId: updatedLead.id,
          partnerId: partner.id,
          partnerName: partner.name,
          mode: partner.mode,
          status: 'pending_delivery',
          destination: redirectUrl || partner.destination || null,
          idempotencyKey: deliveryIdempotencyKey,
          requestPayload: ReactivationDeliveryService.maskSensitive(
            ReactivationDeliveryService.buildPayload({ lead: updatedLead, partner, score })
          )
        }
      }));

      const scoredLead = await prisma.reactivationLead.update({
        where: { id: updatedLead.id },
        data: {
          status: 'pending_delivery',
          scoreValue: score.value,
          scoreBand: score.band,
          qualification: score.qualification,
          selectedPartnerId: partner?.id || null,
          selectedPartnerName: partner?.name || null,
          deliveryStatus: 'pending_delivery',
          estimatedRevenueCents: partner?.estimatedRevenueCents || null
        }
      });

      await this.audit({ leadId: scoredLead.id, eventType: 'lead_scored', req, idempotencyKey: `lead_scored:${scoredLead.id}:${idempotencyKey}`, metadata: score });
      await this.audit({ leadId: scoredLead.id, eventType: 'partner_selected', req, idempotencyKey: `partner_selected:${scoredLead.id}:${partner.id}:${idempotencyKey}`, metadata: partner });

      let delivery = deliverySeed;
      if (existingDelivery && ['delivery_success', 'pending_delivery', 'delivery_retrying'].includes(existingDelivery.status)) {
        await this.audit({
          leadId: scoredLead.id,
          eventType: 'duplicate_submit_ignored',
          req,
          idempotencyKey: `duplicate_delivery_ignored:${scoredLead.id}:${existingDelivery.id}`,
          metadata: { deliveryId: existingDelivery.id, status: existingDelivery.status }
        });
        return {
          duplicate: true,
          lead: publicLead(scoredLead),
          score,
          partner,
          redirectUrl: existingDelivery.destination || redirectUrl,
          delivery: existingDelivery
        };
      }

      try {
        const deliveryResult = await ReactivationDeliveryService.deliver({
          lead: scoredLead,
          partner,
          score,
          redirectUrl,
          retryCount: deliverySeed.retryCount
        });
        delivery = await prisma.reactivationPartnerDelivery.update({
          where: { id: deliverySeed.id },
          data: {
            status: deliveryResult.status,
            destination: deliveryResult.destination,
            requestPayload: deliveryResult.requestPayload,
            responsePayload: deliveryResult.responsePayload,
            lastAttemptAt: new Date(),
            deliveredAt: deliveryResult.status === 'delivery_success' ? new Date() : null
          }
        });
        await prisma.reactivationLead.update({
          where: { id: scoredLead.id },
          data: {
            status: deliveryStatusToLeadStatus(delivery.status),
            deliveryStatus: delivery.status,
            deliveredAt: delivery.status === 'delivery_success' ? new Date() : null
          }
        });
        await this.audit({ leadId: scoredLead.id, eventType: 'partner_routed', req, idempotencyKey: `partner_routed:${scoredLead.id}:${delivery.id}`, metadata: { partnerId: partner.id, mode: partner.mode, deliveryId: delivery.id, status: delivery.status } });
      } catch (error) {
        const nextAttemptAt = error.nextAttemptAt || new Date(Date.now() + ReactivationDeliveryService.getBackoffMs(deliverySeed.retryCount + 1));
        const retryCount = deliverySeed.retryCount + 1;
        const maxRetries = Number(process.env.REACTIVATION_DELIVERY_MAX_RETRIES || 5);
        const status = retryCount >= maxRetries ? 'delivery_failed' : 'delivery_retrying';
        delivery = await prisma.reactivationPartnerDelivery.update({
          where: { id: deliverySeed.id },
          data: {
            status,
            retryCount,
            nextAttemptAt: status === 'delivery_retrying' ? nextAttemptAt : null,
            lastAttemptAt: new Date(),
            responsePayload: error.responsePayload || null,
            errorMessage: error.message
          }
        });
        await prisma.reactivationLead.update({
          where: { id: scoredLead.id },
          data: {
            status: deliveryStatusToLeadStatus(status),
            deliveryStatus: status
          }
        });
        await this.audit({
          leadId: scoredLead.id,
          eventType: status === 'delivery_retrying' ? 'delivery_retry_scheduled' : 'partner_route_failed',
          req,
          idempotencyKey: `${status}:${scoredLead.id}:${delivery.id}:${retryCount}`,
          metadata: { partnerId: partner.id, deliveryId: delivery.id, retryCount, nextAttemptAt, error: error.message }
        });
      }

      return {
        lead: publicLead(await prisma.reactivationLead.findUnique({ where: { id: scoredLead.id } })),
        score,
        partner,
        redirectUrl,
        delivery
      };
    } finally {
      await this.releaseLeadLock(currentLead.id, lockId);
    }
  },

  async registerOptOut({ token, scope = 'dnc_global', reason, req }) {
    const prisma = getPrisma();
    const lead = await prisma.reactivationLead.findUnique({
      where: { tokenHash: ReactivationTokenService.hashToken(token) }
    });
    if (!lead) return null;

    const data = {
      scope,
      emailHash: ReactivationTokenService.hashEmail(lead.email),
      phoneHash: ReactivationTokenService.hashPhone(lead.phone),
      cpfHash: lead.cpfHash,
      reason: reason || 'lead_request',
      source: '/r/[token]/opt-out'
    };

    await safeCreate(() => prisma.reactivationSuppression.create({ data }));
    const updated = await prisma.reactivationLead.update({
      where: { id: lead.id },
      data: {
        status: scope === 'revoked_consent' ? 'revoked' : 'suppressed',
        consentRevokedAt: scope === 'revoked_consent' ? new Date() : lead.consentRevokedAt,
        optOutReason: reason || scope,
        deliveryStatus: 'suppressed',
        tokenRevokedAt: scope === 'revoked_consent' ? new Date() : lead.tokenRevokedAt
      }
    });
    await this.audit({
      leadId: lead.id,
      eventType: scope === 'revoked_consent' ? 'consent_revoked' : 'opt_out_registered',
      req,
      idempotencyKey: `opt_out:${lead.id}:${scope}`,
      metadata: { scope, reason }
    });
    return publicLead(updated);
  },

  async refuseConsent({ token, reason, req }) {
    const prisma = getPrisma();
    const lead = await prisma.reactivationLead.findUnique({
      where: { tokenHash: ReactivationTokenService.hashToken(token) }
    });
    if (!lead) return null;
    const updated = await prisma.reactivationLead.update({
      where: { id: lead.id },
      data: {
        status: 'rejected',
        consentRefusedAt: new Date(),
        optOutReason: reason || 'consent_refused'
      }
    });
    await this.audit({ leadId: lead.id, eventType: 'consent_refused', req, idempotencyKey: `consent_refused:${lead.id}`, metadata: { reason } });
    return publicLead(updated);
  },

  async regenerateToken({ leadId, actor = 'system' }) {
    const prisma = getPrisma();
    const token = ReactivationTokenService.generateToken();
    const updated = await prisma.reactivationLead.update({
      where: { id: leadId },
      data: {
        tokenHash: ReactivationTokenService.hashToken(token),
        tokenLast4: ReactivationTokenService.last4(token),
        tokenRevokedAt: null,
        tokenRegeneratedAt: new Date(),
        expiresAt: new Date(Date.now() + Number(process.env.REACTIVATION_TOKEN_TTL_DAYS || 45) * 24 * 60 * 60 * 1000)
      }
    });
    await this.audit({ leadId, eventType: 'token_regenerated', actor, idempotencyKey: `token_regenerated:${leadId}:${updated.tokenLast4}`, metadata: { tokenLast4: updated.tokenLast4 } });
    return { lead: publicLead(updated), token };
  },

  async retryDueDeliveries({ limit = 25, req } = {}) {
    const prisma = getPrisma();
    const due = await prisma.reactivationPartnerDelivery.findMany({
      where: {
        status: 'delivery_retrying',
        nextAttemptAt: { lte: new Date() }
      },
      include: { lead: true },
      orderBy: { nextAttemptAt: 'asc' },
      take: Math.min(Number(limit || 25), 100)
    });

    const partners = ReactivationRoutingService.listPartners();
    const results = [];

    for (const delivery of due) {
      const claim = await prisma.reactivationPartnerDelivery.updateMany({
        where: {
          id: delivery.id,
          status: 'delivery_retrying',
          nextAttemptAt: { lte: new Date() }
        },
        data: {
          status: 'pending_delivery',
          nextAttemptAt: null
        }
      });
      if (claim.count !== 1) {
        results.push({ deliveryId: delivery.id, status: 'already_claimed' });
        continue;
      }

      const partner = partners.find((item) => item.id === delivery.partnerId);
      if (!partner || !delivery.lead) {
        await prisma.reactivationPartnerDelivery.update({
          where: { id: delivery.id },
          data: {
            status: 'delivery_failed',
            errorMessage: 'Partner or lead not available for retry'
          }
        });
        results.push({ deliveryId: delivery.id, status: 'delivery_failed' });
        continue;
      }

      const score = {
        value: delivery.lead.scoreValue || 0,
        band: delivery.lead.scoreBand || 'D',
        qualification: delivery.lead.qualification || 'nurture',
        reasons: {}
      };
      const redirectUrl = delivery.destination || ReactivationRoutingService.buildRedirectUrl({
        partner,
        leadId: delivery.lead.id,
        tokenLast4: delivery.lead.tokenLast4,
        utm: { utm_source: 'reactivation', utm_medium: 'retry', utm_campaign: delivery.lead.batchId || 'base_antiga' }
      });

      try {
        const deliveryResult = await ReactivationDeliveryService.deliver({
          lead: delivery.lead,
          partner,
          score,
          redirectUrl,
          retryCount: delivery.retryCount
        });
        const updated = await prisma.reactivationPartnerDelivery.update({
          where: { id: delivery.id },
          data: {
            status: deliveryResult.status,
            destination: deliveryResult.destination,
            requestPayload: deliveryResult.requestPayload,
            responsePayload: deliveryResult.responsePayload,
            lastAttemptAt: new Date(),
            nextAttemptAt: null,
            deliveredAt: deliveryResult.status === 'delivery_success' ? new Date() : null
          }
        });
        await prisma.reactivationLead.update({
          where: { id: delivery.lead.id },
          data: {
            status: deliveryStatusToLeadStatus(updated.status),
            deliveryStatus: updated.status,
            deliveredAt: updated.status === 'delivery_success' ? new Date() : null
          }
        });
        await this.audit({ leadId: delivery.lead.id, eventType: 'partner_routed', req, idempotencyKey: `partner_routed_retry:${delivery.id}:${delivery.retryCount}`, metadata: { deliveryId: delivery.id, status: updated.status } });
        results.push({ deliveryId: delivery.id, status: updated.status });
      } catch (error) {
        const retryCount = delivery.retryCount + 1;
        const maxRetries = Number(process.env.REACTIVATION_DELIVERY_MAX_RETRIES || 5);
        const status = retryCount >= maxRetries ? 'delivery_failed' : 'delivery_retrying';
        const updated = await prisma.reactivationPartnerDelivery.update({
          where: { id: delivery.id },
          data: {
            status,
            retryCount,
            nextAttemptAt: status === 'delivery_retrying' ? error.nextAttemptAt || new Date(Date.now() + ReactivationDeliveryService.getBackoffMs(retryCount)) : null,
            lastAttemptAt: new Date(),
            responsePayload: error.responsePayload || null,
            errorMessage: error.message
          }
        });
        await prisma.reactivationLead.update({
          where: { id: delivery.lead.id },
          data: { status: deliveryStatusToLeadStatus(updated.status), deliveryStatus: updated.status }
        });
        await this.audit({ leadId: delivery.lead.id, eventType: status === 'delivery_retrying' ? 'delivery_retry_scheduled' : 'partner_route_failed', req, idempotencyKey: `delivery_retry:${delivery.id}:${retryCount}`, metadata: { deliveryId: delivery.id, retryCount, status, error: error.message } });
        results.push({ deliveryId: delivery.id, status });
      }
    }

    return { processed: results.length, results };
  },

  async listAuditEvents(filters = {}) {
    const prisma = getPrisma();
    return prisma.reactivationAuditEvent.findMany({
      where: {
        leadId: filters.leadId || undefined,
        eventType: filters.eventType || undefined,
        createdAt: {
          gte: filters.from ? new Date(filters.from) : undefined,
          lte: filters.to ? new Date(filters.to) : undefined
        }
      },
      orderBy: { createdAt: 'desc' },
      take: Math.min(Number(filters.limit || 100), 500)
    });
  },

  async getKpis(filters = {}) {
    const prisma = getPrisma();
    const where = {
      createdAt: {
        gte: filters.from ? new Date(filters.from) : undefined,
        lte: filters.to ? new Date(filters.to) : undefined
      },
      batchId: filters.batchId || undefined
    };
    const auditWhere = {
      createdAt: where.createdAt,
      lead: filters.batchId ? { batchId: filters.batchId } : undefined
    };

    const [total, byStatus, byPartner, byBatch, deliveryCounts, auditCounts, revenue, recent] = await Promise.all([
      prisma.reactivationLead.count({ where }),
      prisma.reactivationLead.groupBy({ by: ['status'], where, _count: { _all: true } }),
      prisma.reactivationLead.groupBy({
        by: ['selectedPartnerId', 'selectedPartnerName'],
        where,
        _count: { _all: true },
        _sum: { estimatedRevenueCents: true, payoutCents: true }
      }),
      prisma.reactivationLead.groupBy({ by: ['batchId'], where, _count: { _all: true } }),
      prisma.reactivationPartnerDelivery.groupBy({ by: ['status'], _count: { _all: true } }),
      prisma.reactivationAuditEvent.groupBy({
        by: ['eventType'],
        where: auditWhere,
        _count: { _all: true }
      }),
      prisma.reactivationLead.aggregate({ where, _sum: { estimatedRevenueCents: true, payoutCents: true } }),
      prisma.reactivationLead.findMany({ where, orderBy: { updatedAt: 'desc' }, take: 20 })
    ]);

    const statusMap = Object.fromEntries(byStatus.map((item) => [item.status, item._count._all]));
    const deliveryMap = Object.fromEntries(deliveryCounts.map((item) => [item.status, item._count._all]));
    const eventMap = Object.fromEntries(auditCounts.map((item) => [item.eventType, item._count._all]));
    const visits = eventMap.page_viewed || 0;
    const consents = eventMap.consent_granted || 0;
    const forms = eventMap.form_submitted || 0;
    const qualified = (statusMap.qualified || 0) + (statusMap.pending_delivery || 0) + (statusMap.delivery_retrying || 0) + (statusMap.delivery_failed || 0) + (statusMap.delivery_success || 0);
    const routed = eventMap.partner_routed || 0;
    const delivered = deliveryMap.delivery_success || 0;

    return {
      totalLeads: total,
      sentLeads: total,
      visits,
      consents,
      forms,
      qualified,
      routed,
      delivered,
      deliveryFailed: deliveryMap.delivery_failed || 0,
      conversionRates: {
        visitRate: total ? Number(((visits / total) * 100).toFixed(2)) : 0,
        consentRate: visits ? Number(((consents / visits) * 100).toFixed(2)) : 0,
        formRate: consents ? Number(((forms / consents) * 100).toFixed(2)) : 0,
        qualificationRate: forms ? Number(((qualified / forms) * 100).toFixed(2)) : 0,
        deliveryRate: routed ? Number(((delivered / routed) * 100).toFixed(2)) : 0
      },
      revenue: {
        estimatedRevenueCents: revenue._sum.estimatedRevenueCents || 0,
        payoutCents: revenue._sum.payoutCents || 0
      },
      byStatus: statusMap,
      byDeliveryStatus: deliveryMap,
      byBatch: byBatch.map((item) => ({
        batchId: item.batchId || 'sem_batch',
        leads: item._count._all
      })),
      byPartner: byPartner.map((item) => ({
        partnerId: item.selectedPartnerId || 'none',
        partnerName: item.selectedPartnerName || 'Sem parceiro',
        leads: item._count._all,
        estimatedRevenueCents: item._sum.estimatedRevenueCents || 0,
        payoutCents: item._sum.payoutCents || 0
      })),
      auditEvents: eventMap,
      recentLeads: recent.map(publicLead)
    };
  }
};
