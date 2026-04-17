import express from 'express';
import crypto from 'node:crypto';
import { z } from 'zod';
import { asyncHandler } from '../lib/http.js';
import { ReactivationAdminService } from '../services/reactivationAdminService.js';

const router = express.Router();
const ADMIN_COOKIE_NAME = 'cj_admin_session';
const ADMIN_SESSION_TTL_SECONDS = Number(process.env.REACTIVATION_ADMIN_SESSION_TTL_SECONDS || 60 * 60 * 12);

const safeEqual = (left = '', right = '') => {
  const leftBuffer = Buffer.from(String(left));
  const rightBuffer = Buffer.from(String(right));
  if (leftBuffer.length !== rightBuffer.length) return false;
  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
};

const getAdminSessionSecret = () => {
  return process.env.REACTIVATION_ADMIN_SESSION_SECRET
    || process.env.REACTIVATION_ADMIN_TOKEN
    || process.env.COTE_API_TOKEN
    || '';
};

const parseCookies = (req) => {
  const header = req.headers.cookie || '';
  return Object.fromEntries(
    header
      .split(';')
      .map((entry) => entry.trim())
      .filter(Boolean)
      .map((entry) => {
        const index = entry.indexOf('=');
        if (index === -1) return [entry, ''];
        return [entry.slice(0, index), decodeURIComponent(entry.slice(index + 1))];
      })
  );
};

const signAdminSession = () => {
  const secret = getAdminSessionSecret();
  if (!secret) return null;
  const now = Math.floor(Date.now() / 1000);
  const payload = Buffer.from(JSON.stringify({
    sub: 'reactivation-admin',
    iat: now,
    exp: now + ADMIN_SESSION_TTL_SECONDS,
    nonce: crypto.randomBytes(12).toString('hex')
  })).toString('base64url');
  const signature = crypto.createHmac('sha256', secret).update(payload).digest('base64url');
  return `${payload}.${signature}`;
};

const verifyAdminSession = (token) => {
  const secret = getAdminSessionSecret();
  if (!secret || !token || !token.includes('.')) return false;
  const [payload, signature] = token.split('.');
  const expected = crypto.createHmac('sha256', secret).update(payload).digest('base64url');
  if (!safeEqual(signature, expected)) return false;
  try {
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return parsed?.sub === 'reactivation-admin' && Number(parsed.exp || 0) > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
};

const setAdminCookie = (res, token) => {
  const secure = process.env.NODE_ENV === 'production';
  const domain = process.env.REACTIVATION_ADMIN_COOKIE_DOMAIN;
  const sameSite = secure ? 'None' : 'Lax';
  const parts = [
    `${ADMIN_COOKIE_NAME}=${encodeURIComponent(token)}`,
    'Path=/',
    'HttpOnly',
    `SameSite=${sameSite}`,
    `Max-Age=${ADMIN_SESSION_TTL_SECONDS}`
  ];
  if (secure) parts.push('Secure');
  if (domain) parts.push(`Domain=${domain}`);
  res.setHeader('Set-Cookie', parts.join('; '));
};

const clearAdminCookie = (res) => {
  const domain = process.env.REACTIVATION_ADMIN_COOKIE_DOMAIN;
  const secure = process.env.NODE_ENV === 'production';
  const sameSite = secure ? 'None' : 'Lax';
  const parts = [
    `${ADMIN_COOKIE_NAME}=`,
    'Path=/',
    'HttpOnly',
    `SameSite=${sameSite}`,
    'Max-Age=0'
  ];
  if (secure) parts.push('Secure');
  if (domain) parts.push(`Domain=${domain}`);
  res.setHeader('Set-Cookie', parts.join('; '));
};

const requireAdminToken = (req, res, next) => {
  const expected = process.env.REACTIVATION_ADMIN_TOKEN || process.env.COTE_API_TOKEN;
  const cookieToken = parseCookies(req)[ADMIN_COOKIE_NAME];
  const hasValidCookie = verifyAdminSession(cookieToken);
  if (hasValidCookie) return next();
  if (!expected && process.env.NODE_ENV === 'production') {
    return res.status(503).json({ error: 'Admin token is not configured' });
  }
  if (!expected) return next();
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!safeEqual(token, expected)) return res.status(401).json({ error: 'Unauthorized' });
  return next();
};

const jsonRecord = z.record(z.any()).optional().nullable();

const campaignSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(3),
  slug: z.string().min(3).optional(),
  description: z.string().optional().nullable(),
  status: z.enum(['draft', 'active', 'paused', 'completed', 'archived']).optional(),
  isActive: z.boolean().optional(),
  startsAt: z.string().optional().nullable(),
  endsAt: z.string().optional().nullable(),
  initialTemplateId: z.string().optional().nullable(),
  reminderTemplateId: z.string().optional().nullable(),
  lastCallTemplateId: z.string().optional().nullable(),
  flowDefinitionId: z.string().optional().nullable(),
  publishedFlowVersionId: z.string().optional().nullable(),
  dailyLimit: z.coerce.number().int().min(1).max(10000).optional(),
  batchSize: z.coerce.number().int().min(1).max(1000).optional(),
  sendWindow: jsonRecord,
  exitRules: jsonRecord,
  metadata: jsonRecord
});

const templateSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(3),
  slug: z.string().min(3).optional(),
  version: z.coerce.number().int().min(1).optional(),
  status: z.enum(['draft', 'active', 'inactive', 'archived']).optional(),
  isActive: z.boolean().optional(),
  subject: z.string().min(3),
  preheader: z.string().optional().nullable(),
  html: z.string().min(10),
  text: z.string().min(10),
  variables: z.array(z.string()).optional(),
  parentId: z.string().optional().nullable(),
  metadata: jsonRecord
});

const flowNodeSchema = z.object({
  key: z.string().min(1),
  type: z.enum([
    'trigger_lead_entry',
    'eligibility_filter',
    'delay',
    'send_email',
    'condition',
    'behavior_split',
    'wait_event',
    'mark_status',
    'add_suppression',
    'end_flow',
    'webhook_event',
    'route_partner',
    'update_lead_field'
  ]),
  label: z.string().min(1),
  config: jsonRecord,
  position: jsonRecord
});

const flowEdgeSchema = z.object({
  key: z.string().optional(),
  source: z.string().min(1),
  target: z.string().min(1),
  label: z.string().optional().nullable(),
  condition: jsonRecord
});

const flowSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(3),
  slug: z.string().min(3).optional(),
  description: z.string().optional().nullable(),
  status: z.enum(['draft', 'active', 'paused', 'archived']).optional(),
  isActive: z.boolean().optional(),
  publish: z.boolean().optional(),
  metadata: jsonRecord,
  definition: z.object({
    nodes: z.array(flowNodeSchema),
    edges: z.array(flowEdgeSchema)
  }).optional(),
  nodes: z.array(flowNodeSchema).optional(),
  edges: z.array(flowEdgeSchema).optional()
});

const statusSchema = z.object({
  status: z.string().min(2)
});

const templatePreviewSchema = z.object({
  variables: jsonRecord
});

const templateTestSchema = z.object({
  toEmail: z.string().email(),
  variables: jsonRecord
});

const resendLeadEmailSchema = z.object({
  templateId: z.string().min(1),
  sequenceKey: z.string().min(1).optional(),
  reactivationUrl: z.string().url()
});

const moveLeadFlowNodeSchema = z.object({
  executionId: z.string().optional(),
  nodeKey: z.string().min(1),
  reason: z.string().optional().nullable()
});

const suppressionApplySchema = z.object({
  leadId: z.string().optional(),
  email: z.string().email().optional(),
  scope: z.enum(['unsubscribe_email', 'unsubscribe_whatsapp', 'dnc_global', 'revoked_consent']).optional(),
  reason: z.string().min(2).optional()
}).refine((payload) => payload.leadId || payload.email, {
  message: 'leadId or email is required'
});

const suppressionReleaseSchema = z.object({
  suppressionId: z.string().optional(),
  leadId: z.string().optional(),
  email: z.string().email().optional(),
  scope: z.enum(['unsubscribe_email', 'unsubscribe_whatsapp', 'dnc_global', 'revoked_consent']).optional()
}).refine((payload) => payload.suppressionId || ((payload.leadId || payload.email) && payload.scope), {
  message: 'suppressionId or leadId/email plus scope is required'
});

const loginSchema = z.object({
  password: z.string().min(8)
});

router.post('/webhooks/sendgrid', asyncHandler(async (req, res) => {
  const result = await ReactivationAdminService.handleSendGridWebhook(req.body || [], req);
  res.json({ data: result });
}));

router.post('/auth/login', asyncHandler(async (req, res) => {
  const configuredPassword = process.env.REACTIVATION_ADMIN_PASSWORD;
  if (!configuredPassword) {
    return res.status(process.env.NODE_ENV === 'production' ? 503 : 400).json({
      error: 'Admin password is not configured'
    });
  }
  const { password } = loginSchema.parse(req.body || {});
  if (!safeEqual(password, configuredPassword)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const token = signAdminSession();
  if (!token) return res.status(503).json({ error: 'Admin session secret is not configured' });
  setAdminCookie(res, token);
  res.json({ data: { authenticated: true, expiresInSeconds: ADMIN_SESSION_TTL_SECONDS } });
}));

router.post('/auth/logout', (_req, res) => {
  clearAdminCookie(res);
  res.json({ data: { authenticated: false } });
});

router.get('/auth/session', (req, res) => {
  const cookieToken = parseCookies(req)[ADMIN_COOKIE_NAME];
  res.json({ data: { authenticated: verifyAdminSession(cookieToken) } });
});

router.use(requireAdminToken);

router.get('/dashboard', asyncHandler(async (_req, res) => {
  res.json({ data: await ReactivationAdminService.dashboard() });
}));

router.get('/campaigns', asyncHandler(async (_req, res) => {
  res.json({ data: await ReactivationAdminService.listCampaigns() });
}));

router.post('/campaigns', asyncHandler(async (req, res) => {
  const payload = campaignSchema.parse(req.body || {});
  const campaign = await ReactivationAdminService.saveCampaign(payload, req);
  res.status(payload.id ? 200 : 201).json({ data: campaign });
}));

router.post('/campaigns/:id/duplicate', asyncHandler(async (req, res) => {
  const campaign = await ReactivationAdminService.duplicateCampaign(req.params.id, req);
  if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
  res.status(201).json({ data: campaign });
}));

router.post('/campaigns/:id/status', asyncHandler(async (req, res) => {
  const { status } = statusSchema.parse(req.body || {});
  const campaign = await ReactivationAdminService.setCampaignStatus(req.params.id, status, req);
  res.json({ data: campaign });
}));

router.get('/templates', asyncHandler(async (_req, res) => {
  res.json({ data: await ReactivationAdminService.listTemplates() });
}));

router.post('/templates', asyncHandler(async (req, res) => {
  const payload = templateSchema.parse(req.body || {});
  const template = await ReactivationAdminService.saveTemplate(payload, req);
  res.status(payload.id ? 200 : 201).json({ data: template });
}));

router.post('/templates/:id/preview', asyncHandler(async (req, res) => {
  const payload = templatePreviewSchema.parse(req.body || {});
  const preview = await ReactivationAdminService.previewTemplate(req.params.id, payload.variables || {});
  if (!preview) return res.status(404).json({ error: 'Template not found' });
  res.json({ data: preview });
}));

router.post('/templates/:id/test-send', asyncHandler(async (req, res) => {
  const payload = templateTestSchema.parse(req.body || {});
  const result = await ReactivationAdminService.sendTemplateTest({
    templateId: req.params.id,
    toEmail: payload.toEmail,
    variables: payload.variables || {}
  }, req);
  if (!result) return res.status(404).json({ error: 'Template not found' });
  res.json({ data: result });
}));

router.get('/flows', asyncHandler(async (_req, res) => {
  res.json({ data: await ReactivationAdminService.listFlows() });
}));

router.get('/flows/:id', asyncHandler(async (req, res) => {
  const flow = await ReactivationAdminService.getFlow(req.params.id);
  if (!flow) return res.status(404).json({ error: 'Flow not found' });
  res.json({ data: flow });
}));

router.post('/flows', asyncHandler(async (req, res) => {
  const payload = flowSchema.parse(req.body || {});
  const flow = await ReactivationAdminService.saveFlow(payload, req);
  res.status(payload.id ? 200 : 201).json({ data: flow });
}));

router.post('/flows/validate', asyncHandler(async (req, res) => {
  const payload = z.object({ nodes: z.array(flowNodeSchema), edges: z.array(flowEdgeSchema) }).parse(req.body || {});
  res.json({ data: ReactivationAdminService.validateFlow(payload) });
}));

router.post('/flows/:id/status', asyncHandler(async (req, res) => {
  const { status } = statusSchema.parse(req.body || {});
  const flow = await ReactivationAdminService.setFlowStatus(req.params.id, status, req);
  res.json({ data: flow });
}));

router.get('/leads/:leadId/timeline', asyncHandler(async (req, res) => {
  const timeline = await ReactivationAdminService.leadTimeline(req.params.leadId);
  if (!timeline.lead) return res.status(404).json({ error: 'Lead not found' });
  res.json({ data: timeline });
}));

router.post('/leads/:leadId/resend-email', asyncHandler(async (req, res) => {
  const payload = resendLeadEmailSchema.parse(req.body || {});
  const result = await ReactivationAdminService.resendLeadEmail({
    leadId: req.params.leadId,
    ...payload
  }, req);
  if (!result) return res.status(404).json({ error: 'Lead or template not found' });
  res.json({ data: result });
}));

router.post('/leads/:leadId/pause-flow', asyncHandler(async (req, res) => {
  const result = await ReactivationAdminService.pauseLeadFlow(req.params.leadId, req);
  res.json({ data: result });
}));

router.post('/leads/:leadId/move-flow-node', asyncHandler(async (req, res) => {
  const payload = moveLeadFlowNodeSchema.parse(req.body || {});
  const result = await ReactivationAdminService.moveLeadFlowNode({
    leadId: req.params.leadId,
    ...payload
  }, req);
  if (!result) return res.status(404).json({ error: 'Active lead flow execution not found' });
  res.json({ data: result });
}));

router.post('/leads/:leadId/force-next-execution', asyncHandler(async (req, res) => {
  const result = await ReactivationAdminService.forceNextExecution(req.params.leadId, req);
  res.json({ data: result });
}));

router.post('/suppressions/apply', asyncHandler(async (req, res) => {
  const payload = suppressionApplySchema.parse(req.body || {});
  const suppression = await ReactivationAdminService.applyLeadSuppression(payload, req);
  res.status(201).json({ data: suppression });
}));

router.post('/suppressions/release', asyncHandler(async (req, res) => {
  const payload = suppressionReleaseSchema.parse(req.body || {});
  const result = await ReactivationAdminService.releaseSuppression(payload, req);
  res.json({ data: result });
}));

router.post('/bootstrap-defaults', asyncHandler(async (req, res) => {
  const result = await ReactivationAdminService.bootstrapDefaults(req);
  res.status(201).json({ data: result });
}));

export default router;
