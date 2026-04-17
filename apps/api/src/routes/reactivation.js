import express from 'express';
import { z } from 'zod';
import { asyncHandler } from '../lib/http.js';
import { ReactivationService } from '../services/reactivationService.js';
import { ReactivationTokenService } from '../services/reactivationTokenService.js';

const router = express.Router();
const publicHits = new Map();
const stringBoolean = z.preprocess((value) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return ['true', '1', 'sim', 'yes'].includes(value.toLowerCase());
  return value;
}, z.boolean());

const rateLimitPublic = (req, res, next) => {
  const key = String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown').split(',')[0];
  const now = Date.now();
  const windowMs = Number(process.env.REACTIVATION_RATE_LIMIT_WINDOW_MS || 60_000);
  const maxHits = Number(process.env.REACTIVATION_RATE_LIMIT_MAX || 40);
  const bucket = publicHits.get(key) || [];
  const recent = bucket.filter((timestamp) => now - timestamp < windowMs);
  recent.push(now);
  publicHits.set(key, recent);
  if (recent.length > maxHits) return res.status(429).json({ error: 'Too many requests' });
  return next();
};

const tokenSchema = z.object({
  token: z.string().min(16)
});

const importLeadSchema = z.object({
  externalLeadId: z.string().optional(),
  batchId: z.string().optional(),
  fullName: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  cpf: z.string().optional(),
  productType: z.enum(['loan', 'credit_card', 'financing']).default('loan'),
  source: z.string().optional(),
  segment: z.string().optional(),
  requestedAmount: z.coerce.number().optional(),
  income: z.coerce.number().optional(),
  employmentStatus: z.string().optional(),
  hasRestriction: stringBoolean.optional(),
  hasGuarantee: stringBoolean.optional(),
  guaranteeType: z.string().optional(),
  expiresAt: z.string().optional(),
  originalPayload: z.record(z.any()).optional()
});

const submitSchema = z.object({
  token: z.string().min(16),
  fullName: z.string().min(3),
  email: z.string().email().optional(),
  phone: z.string().min(10),
  productType: z.enum(['loan', 'credit_card', 'financing']).default('loan'),
  requestedAmount: z.coerce.number().min(100).optional(),
  income: z.coerce.number().min(0),
  employmentStatus: z.string().min(2),
  hasRestriction: stringBoolean,
  hasGuarantee: stringBoolean.optional(),
  guaranteeType: z.string().optional(),
  consentAccepted: z.literal(true),
  consentVersion: z.string().optional(),
  privacyPolicyVersion: z.string().optional(),
  source: z.string().optional(),
  idempotencyKey: z.string().min(12).optional()
});

const optOutSchema = z.object({
  token: z.string().min(16),
  scope: z.enum(['unsubscribe_email', 'unsubscribe_whatsapp', 'dnc_global', 'revoked_consent']).default('dnc_global'),
  reason: z.string().optional()
});

const refuseSchema = z.object({
  token: z.string().min(16),
  reason: z.string().optional()
});

const regenerateSchema = z.object({
  leadId: z.string().min(5)
});

const retryDeliveriesSchema = z.object({
  limit: z.coerce.number().min(1).max(100).optional()
});

const suppressionCheckSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().optional(),
  cpf: z.string().optional()
});

const querySchema = z.object({
  leadId: z.string().optional(),
  eventType: z.string().optional(),
  batchId: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  limit: z.string().optional()
});

const requireAutomationToken = (req, res, next) => {
  if (!process.env.COTE_API_TOKEN && process.env.NODE_ENV === 'production') {
    return res.status(503).json({ error: 'Automation token is not configured' });
  }
  if (!process.env.COTE_API_TOKEN) return next();
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (token !== process.env.COTE_API_TOKEN) return res.status(401).json({ error: 'Unauthorized' });
  return next();
};

router.post(
  '/import',
  requireAutomationToken,
  asyncHandler(async (req, res) => {
    const payload = importLeadSchema.parse(req.body || {});
    const result = await ReactivationService.createLeadFromImport(payload);
    res.status(201).json({ data: result });
  })
);

router.get(
  '/lead/:token',
  rateLimitPublic,
  asyncHandler(async (req, res) => {
    const { token } = tokenSchema.parse(req.params);
    const lead = await ReactivationService.getByToken(token, {
      req,
      markViewed: req.query.viewed === '1'
    });
    if (!lead) return res.status(404).json({ error: 'Lead not found' });
    res.json({ data: lead });
  })
);

router.post(
  '/submit',
  rateLimitPublic,
  asyncHandler(async (req, res) => {
    const payload = submitSchema.parse(req.body || {});
    const result = await ReactivationService.submit({
      token: payload.token,
      payload,
      req
    });

    if (!result) return res.status(404).json({ error: 'Lead not found' });
    if (result.expired) return res.status(410).json({ error: 'Token expired', data: result.lead });
    if (result.revoked) return res.status(410).json({ error: 'Token revoked', data: result.lead });
    if (result.suppressed) return res.status(403).json({ error: 'Lead suppressed', data: result.lead });
    if (result.processing) return res.status(409).json({ error: 'Lead is already processing', data: result.lead });
    res.status(201).json({ data: result });
  })
);

router.post(
  '/opt-out',
  rateLimitPublic,
  asyncHandler(async (req, res) => {
    const payload = optOutSchema.parse(req.body || {});
    const lead = await ReactivationService.registerOptOut({ ...payload, req });
    if (!lead) return res.status(404).json({ error: 'Lead not found' });
    res.json({ data: lead });
  })
);

router.post(
  '/refuse-consent',
  rateLimitPublic,
  asyncHandler(async (req, res) => {
    const payload = refuseSchema.parse(req.body || {});
    const lead = await ReactivationService.refuseConsent({ ...payload, req });
    if (!lead) return res.status(404).json({ error: 'Lead not found' });
    res.json({ data: lead });
  })
);

router.post(
  '/regenerate-token',
  requireAutomationToken,
  asyncHandler(async (req, res) => {
    const payload = regenerateSchema.parse(req.body || {});
    const result = await ReactivationService.regenerateToken({ leadId: payload.leadId, actor: 'automation' });
    res.json({ data: result });
  })
);

router.post(
  '/suppression/check',
  requireAutomationToken,
  asyncHandler(async (req, res) => {
    const payload = suppressionCheckSchema.parse(req.body || {});
    const result = await ReactivationService.checkSuppression({
      email: payload.email,
      phone: payload.phone,
      cpfHash: ReactivationTokenService.hashCpf(payload.cpf)
    });
    res.json({
      data: {
        suppressed: result.suppressed,
        emailSuppressed: result.emailSuppressed,
        whatsappSuppressed: result.whatsappSuppressed,
        matches: result.matches.map((item) => ({
          scope: item.scope,
          reason: item.reason,
          source: item.source,
          createdAt: item.createdAt
        }))
      }
    });
  })
);

router.post(
  '/deliveries/retry-due',
  requireAutomationToken,
  asyncHandler(async (req, res) => {
    const payload = retryDeliveriesSchema.parse(req.body || {});
    const result = await ReactivationService.retryDueDeliveries({ limit: payload.limit, req });
    res.json({ data: result });
  })
);

router.get(
  '/events',
  requireAutomationToken,
  asyncHandler(async (req, res) => {
    const filters = querySchema.parse(req.query || {});
    const events = await ReactivationService.listAuditEvents(filters);
    res.json({ data: events });
  })
);

router.get(
  '/kpis',
  asyncHandler(async (req, res) => {
    const filters = querySchema.parse(req.query || {});
    const kpis = await ReactivationService.getKpis(filters);
    res.json({ data: kpis });
  })
);

export default router;
