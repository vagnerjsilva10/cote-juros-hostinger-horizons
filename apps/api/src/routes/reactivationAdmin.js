import express from 'express';
import { z } from 'zod';
import { asyncHandler } from '../lib/http.js';
import { ReactivationAdminService } from '../services/reactivationAdminService.js';

const router = express.Router();

const requireAdminToken = (req, res, next) => {
  const expected = process.env.REACTIVATION_ADMIN_TOKEN || process.env.COTE_API_TOKEN;
  if (!expected && process.env.NODE_ENV === 'production') {
    return res.status(503).json({ error: 'Admin token is not configured' });
  }
  if (!expected) return next();
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (token !== expected) return res.status(401).json({ error: 'Unauthorized' });
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

router.post('/webhooks/sendgrid', asyncHandler(async (req, res) => {
  const result = await ReactivationAdminService.handleSendGridWebhook(req.body || [], req);
  res.json({ data: result });
}));

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

router.post('/bootstrap-defaults', asyncHandler(async (req, res) => {
  const result = await ReactivationAdminService.bootstrapDefaults(req);
  res.status(201).json({ data: result });
}));

export default router;
