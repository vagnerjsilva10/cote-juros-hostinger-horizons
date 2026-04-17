import express from 'express';
import crypto from 'node:crypto';
import { z } from 'zod';
import { asyncHandler } from '../lib/http.js';
import {
  ADMIN_SESSION_TTL_SECONDS,
  assertLoginAllowed,
  checkAdminDatabaseHealth,
  clearAdminCookie,
  createAdminSession,
  ensureAdminBootstrap,
  logAdminAuth,
  hashValue,
  parseCookies,
  recordAdminAudit,
  requireAdminSession,
  requirePermission,
  resolveAdminSession,
  revokeAdminSession,
  setAdminCookie,
  verifyPassword
} from '../lib/adminAuth.js';
import { AdminService } from '../services/adminService.js';
import { getPrisma } from '../lib/prisma.js';

const router = express.Router();

const loginSchema = z.object({
  email: z.string().email().optional(),
  password: z.string().min(8)
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(8),
  newPassword: z.string().min(8)
});

const forgotPasswordSchema = z.object({
  email: z.string().email().optional()
});

const resetPasswordSchema = z.object({
  token: z.string().min(8),
  newPassword: z.string().min(8)
});

const auditQuerySchema = z.object({
  page: z.coerce.number().optional(),
  pageSize: z.coerce.number().optional(),
  resource: z.string().optional(),
  action: z.string().optional(),
  search: z.string().optional()
});

const userListQuerySchema = z.object({
  search: z.string().optional(),
  status: z.string().optional()
});

const userSaveSchema = z.object({
  email: z.string().email().optional(),
  fullName: z.string().min(3).max(160),
  status: z.enum(['active', 'invited', 'disabled']).optional(),
  password: z.string().min(8).optional(),
  roleCodes: z.array(z.string()).default([])
});

const leadListQuerySchema = z.object({
  page: z.coerce.number().optional(),
  pageSize: z.coerce.number().optional(),
  search: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  status: z.string().optional(),
  productType: z.string().optional(),
  originPage: z.string().optional(),
  partnerId: z.string().optional(),
  ownerId: z.string().optional(),
  suppressed: z.enum(['true', 'false']).optional()
});

const leadStatusSchema = z.object({
  status: z.string().min(2)
});

const leadNoteSchema = z.object({
  body: z.string().min(3).max(4000)
});

const leadTagsSchema = z.object({
  tags: z.array(z.string()).default([])
});

const leadOwnerSchema = z.object({
  ownerUserId: z.string().min(1),
  note: z.string().max(500).optional().nullable()
});

const leadSuppressionSchema = z.object({
  scope: z.enum(['manual', 'invalid', 'duplicated', 'opt_out', 'blocked']).default('manual'),
  reason: z.string().max(500).optional().nullable()
});

const partnerListQuerySchema = z.object({
  search: z.string().optional(),
  status: z.string().optional(),
  healthStatus: z.string().optional(),
  integrationType: z.string().optional()
});

const partnerSaveSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(3).max(160),
  slug: z.string().optional(),
  bankId: z.string().optional().nullable(),
  integrationType: z.enum(['tracking_link', 'webhook', 'api', 'manual']),
  trackingLink: z.string().optional().nullable(),
  webhookUrl: z.string().optional().nullable(),
  apiBaseUrl: z.string().optional().nullable(),
  productTypes: z.array(z.enum(['loan', 'credit_card', 'financing'])).default([]),
  status: z.enum(['active', 'inactive', 'draft', 'published', 'archived']).optional(),
  priority: z.coerce.number().optional(),
  weight: z.coerce.number().optional(),
  fallbackPartnerId: z.string().optional().nullable(),
  dailyLimit: z.coerce.number().optional().nullable(),
  monthlyLimit: z.coerce.number().optional().nullable(),
  slaMinutes: z.coerce.number().optional().nullable(),
  payoutLeadCents: z.coerce.number().optional().nullable(),
  payoutConversionCents: z.coerce.number().optional().nullable(),
  internalNotes: z.string().optional().nullable(),
  metadata: z.any().optional().nullable()
});

router.post('/auth/login', asyncHandler(async (req, res) => {
  const requestId = req.headers['x-request-id'] || crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`;
  const { email, password } = loginSchema.parse(req.body || {});
  logAdminAuth('info', 'login_started', { requestId, emailProvided: Boolean(email) });

  const seededUser = await ensureAdminBootstrap();
  if (!seededUser) {
    logAdminAuth('warn', 'login_bootstrap_not_configured', { requestId });
    return res.status(503).json({
      error: 'Admin bootstrap is not configured',
      code: 'ADMIN_BOOTSTRAP_NOT_CONFIGURED',
      message: 'Admin nao provisionado. Configure ADMIN_BOOTSTRAP_PASSWORD na API e faca redeploy.'
    });
  }

  const ipAddress = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || null;
  const allowed = await assertLoginAllowed({ email: email || seededUser.email, ipAddress });
  if (!allowed) {
    await AdminService.registerFailedLogin({ email: email || seededUser.email, req, reason: 'rate_limited' });
    logAdminAuth('warn', 'login_rate_limited', { requestId, email: email || seededUser.email, ipAddress });
    return res.status(429).json({
      error: 'Too many login attempts. Try again later.',
      code: 'ADMIN_LOGIN_RATE_LIMITED',
      message: 'Muitas tentativas de login. Aguarde alguns minutos e tente novamente.'
    });
  }

  const prisma = getPrisma();
  const user = await prisma.adminUser.findUnique({
    where: { email: (email || seededUser.email).toLowerCase() },
    include: {
      roles: {
        include: {
          role: {
            include: {
              permissions: {
                include: {
                  permission: true
                }
              }
            }
          }
        }
      }
    }
  });

  if (!user || user.status !== 'active' || !verifyPassword(password, user.passwordHash)) {
    await AdminService.registerFailedLogin({ email: email || seededUser.email, req, reason: 'invalid_credentials' });
    logAdminAuth('warn', 'login_invalid_credentials', {
      requestId,
      email: email || seededUser.email,
      userFound: Boolean(user),
      userStatus: user?.status || null
    });
    return res.status(401).json({
      error: 'Unauthorized',
      code: 'ADMIN_INVALID_CREDENTIALS',
      message: 'Senha do admin invalida ou usuario admin inativo.'
    });
  }

  await AdminService.authenticateDefaultUser(password, req, user);
  const session = await createAdminSession(req, user);
  setAdminCookie(res, session.token);
  await recordAdminAudit({
    req,
    user,
    action: 'login_success',
    resource: 'admin_session',
    resourceId: session.session.id,
    metadata: { expiresAt: session.expiresAt.toISOString() }
  });
  logAdminAuth('info', 'login_success', { requestId, userId: user.id, email: user.email });

  res.json({
    data: {
      authenticated: true,
      expiresInSeconds: ADMIN_SESSION_TTL_SECONDS,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        roles: user.roles.map((item) => item.role.code)
      }
    }
  });
}));

router.get('/auth/diagnostics', asyncHandler(async (_req, res) => {
  const prisma = getPrisma();
  const database = await checkAdminDatabaseHealth(prisma);
  const [userCount, superAdmin] = await Promise.all([
    database.ok ? prisma.adminUser.count() : Promise.resolve(null),
    database.ok ? prisma.adminRole.findUnique({
      where: { code: 'super_admin' },
      include: {
        permissions: {
          include: {
            permission: true
          }
        }
      }
    }) : Promise.resolve(null)
  ]);

  res.json({
    data: {
      ok: database.ok && Boolean(superAdmin),
      database,
      bootstrap: {
        passwordConfigured: Boolean(process.env.ADMIN_BOOTSTRAP_PASSWORD || process.env.REACTIVATION_ADMIN_PASSWORD),
        userCount,
        superAdminExists: Boolean(superAdmin),
        superAdminWildcardPermission: Boolean(superAdmin?.permissions?.some((rolePermission) =>
          rolePermission.permission.resource === '*' && rolePermission.permission.action === '*'
        ))
      }
    }
  });
}));

router.post('/auth/logout', asyncHandler(async (req, res) => {
  const current = await resolveAdminSession(req);
  if (current?.session?.id) {
    await revokeAdminSession(current.session.id);
    await recordAdminAudit({
      req,
      user: current.user,
      action: 'logout',
      resource: 'admin_session',
      resourceId: current.session.id
    });
  }
  clearAdminCookie(res);
  res.json({ data: { authenticated: false } });
}));

router.get('/auth/session', asyncHandler(async (req, res) => {
  const session = await resolveAdminSession(req);
  res.json({
    data: {
      authenticated: Boolean(session),
      user: session ? {
        id: session.user.id,
        email: session.user.email,
        fullName: session.user.fullName,
        roles: session.user.roles.map((item) => item.role.code),
        permissions: session.permissions
      } : null
    }
  });
}));

router.post('/auth/forgot-password', asyncHandler(async (req, res) => {
  const { email } = forgotPasswordSchema.parse(req.body || {});
  const seededUser = await ensureAdminBootstrap();
  const targetEmail = (email || seededUser?.email || '').toLowerCase();
  if (!targetEmail) {
    return res.json({ data: { ok: true } });
  }

  const user = await getPrisma().adminUser.findUnique({ where: { email: targetEmail } });
  if (!user) return res.json({ data: { ok: true } });

  const rawToken = await AdminService.createPasswordResetToken(user);
  await recordAdminAudit({
    req,
    user,
    action: 'password_reset_requested',
    resource: 'admin_user',
    resourceId: user.id
  });

  res.json({
    data: {
      ok: true,
      ...(process.env.NODE_ENV !== 'production' ? { resetToken: rawToken } : {})
    }
  });
}));

router.post('/auth/reset-password', asyncHandler(async (req, res) => {
  const { token, newPassword } = resetPasswordSchema.parse(req.body || {});
  const prisma = getPrisma();
  const resetToken = await prisma.adminPasswordResetToken.findUnique({
    where: { tokenHash: hashValue(token) },
    include: { user: true }
  });
  if (!resetToken || resetToken.usedAt || resetToken.expiresAt <= new Date()) {
    return res.status(400).json({ error: 'Invalid or expired reset token' });
  }

  await AdminService.changePassword(resetToken.userId, newPassword, req);
  await prisma.adminPasswordResetToken.update({
    where: { id: resetToken.id },
    data: { usedAt: new Date() }
  });

  res.json({ data: { ok: true } });
}));

router.post('/auth/change-password', requireAdminSession, asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = changePasswordSchema.parse(req.body || {});
  if (!verifyPassword(currentPassword, req.adminUser.passwordHash)) {
    return res.status(400).json({ error: 'Current password is invalid' });
  }

  await AdminService.changePassword(req.adminUser.id, newPassword, req);
  res.json({ data: { ok: true } });
}));

router.get('/dashboard', requirePermission('dashboard', 'view'), asyncHandler(async (_req, res) => {
  res.json({ data: await AdminService.getDashboard() });
}));

router.get('/health', requirePermission('health', 'view'), asyncHandler(async (_req, res) => {
  res.json({ data: await AdminService.getHealthOverview() });
}));

router.get('/audit', requirePermission('audit', 'view'), asyncHandler(async (req, res) => {
  const filters = auditQuerySchema.parse(req.query || {});
  res.json({ data: await AdminService.listAuditLogs(filters) });
}));

router.get('/users/owners', requirePermission('leads', 'view'), asyncHandler(async (_req, res) => {
  res.json({ data: await AdminService.listLeadOwners() });
}));

router.get('/partners', requirePermission('partners', 'view'), asyncHandler(async (req, res) => {
  const filters = partnerListQuerySchema.parse(req.query || {});
  res.json({ data: await AdminService.listPartners(filters) });
}));

router.post('/partners', requirePermission('partners', 'create'), asyncHandler(async (req, res) => {
  const payload = partnerSaveSchema.parse(req.body || {});
  res.status(payload.id ? 200 : 201).json({ data: await AdminService.savePartner(payload, req, req.adminUser) });
}));

router.post('/partners/:partnerId/status', requirePermission('partners', 'edit'), asyncHandler(async (req, res) => {
  const partner = await AdminService.togglePartnerStatus(req.params.partnerId, req, req.adminUser);
  if (!partner) return res.status(404).json({ error: 'Partner not found' });
  res.json({ data: partner });
}));

router.post('/partners/:partnerId/test', requirePermission('partners', 'edit'), asyncHandler(async (req, res) => {
  const result = await AdminService.testPartner(req.params.partnerId, req, req.adminUser);
  if (!result) return res.status(404).json({ error: 'Partner not found' });
  res.json({ data: result });
}));

router.get('/users', requirePermission('users', 'view'), asyncHandler(async (req, res) => {
  const filters = userListQuerySchema.parse(req.query || {});
  res.json({ data: await AdminService.listUsers(filters) });
}));

router.get('/roles', requirePermission('users', 'view'), asyncHandler(async (_req, res) => {
  res.json({ data: await AdminService.listRoles() });
}));

router.post('/users', requirePermission('users', 'create'), asyncHandler(async (req, res) => {
  const payload = userSaveSchema.extend({
    email: z.string().email(),
    password: z.string().min(8)
  }).parse(req.body || {});
  res.status(201).json({ data: await AdminService.createUser(payload, req, req.adminUser) });
}));

router.post('/users/:userId', requirePermission('users', 'edit'), asyncHandler(async (req, res) => {
  const payload = userSaveSchema.parse(req.body || {});
  const user = await AdminService.updateUser(req.params.userId, payload, req, req.adminUser);
  if (!user) return res.status(404).json({ error: 'Admin user not found' });
  res.json({ data: user });
}));

router.get('/leads', requirePermission('leads', 'view'), asyncHandler(async (req, res) => {
  const filters = leadListQuerySchema.parse(req.query || {});
  res.json({ data: await AdminService.listLeads(filters) });
}));

router.get('/leads/:leadId', requirePermission('leads', 'view'), asyncHandler(async (req, res) => {
  const lead = await AdminService.getLead(req.params.leadId);
  if (!lead) return res.status(404).json({ error: 'Lead not found' });
  res.json({ data: lead });
}));

router.post('/leads/:leadId/status', requirePermission('leads', 'edit'), asyncHandler(async (req, res) => {
  const { status } = leadStatusSchema.parse(req.body || {});
  const lead = await AdminService.updateLeadStatus(req.params.leadId, status, req, req.adminUser);
  if (!lead) return res.status(404).json({ error: 'Lead not found' });
  res.json({ data: lead });
}));

router.post('/leads/:leadId/notes', requirePermission('leads', 'edit'), asyncHandler(async (req, res) => {
  const { body } = leadNoteSchema.parse(req.body || {});
  res.status(201).json({ data: await AdminService.addLeadNote(req.params.leadId, body, req, req.adminUser) });
}));

router.post('/leads/:leadId/tags', requirePermission('leads', 'edit'), asyncHandler(async (req, res) => {
  const { tags } = leadTagsSchema.parse(req.body || {});
  res.json({ data: await AdminService.setLeadTags(req.params.leadId, tags, req, req.adminUser) });
}));

router.post('/leads/:leadId/owner', requirePermission('leads', 'edit'), asyncHandler(async (req, res) => {
  const payload = leadOwnerSchema.parse(req.body || {});
  res.json({ data: await AdminService.assignLeadOwner(req.params.leadId, payload.ownerUserId, payload.note || null, req, req.adminUser) });
}));

router.post('/leads/:leadId/suppress', requirePermission('leads', 'edit'), asyncHandler(async (req, res) => {
  const payload = leadSuppressionSchema.parse(req.body || {});
  res.status(201).json({ data: await AdminService.suppressLead(req.params.leadId, payload.scope, payload.reason || null, req, req.adminUser) });
}));

router.post('/leads/:leadId/simulate-routing', requirePermission('leads', 'approve'), asyncHandler(async (req, res) => {
  const data = await AdminService.simulateRouting(req.params.leadId, req, req.adminUser);
  if (!data) return res.status(404).json({ error: 'Lead not found' });
  res.json({ data });
}));

export default router;
