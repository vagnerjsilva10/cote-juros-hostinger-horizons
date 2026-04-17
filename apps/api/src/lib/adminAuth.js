import crypto from 'node:crypto';
import { getPrisma } from './prisma.js';

export const ADMIN_COOKIE_NAME = 'cj_admin_session';
export const ADMIN_SESSION_TTL_SECONDS = Number(process.env.ADMIN_SESSION_TTL_SECONDS || process.env.REACTIVATION_ADMIN_SESSION_TTL_SECONDS || 60 * 60 * 12);
const ADMIN_COOKIE_DOMAIN = process.env.ADMIN_COOKIE_DOMAIN || process.env.REACTIVATION_ADMIN_COOKIE_DOMAIN || '';

export const ADMIN_REQUIRED_TABLES = [
  'admin_users',
  'admin_roles',
  'admin_permissions',
  'admin_role_permissions',
  'admin_user_roles',
  'admin_sessions',
  'admin_login_attempts',
  'admin_audit_logs'
];

export class AdminAuthSetupError extends Error {
  constructor(message, { code = 'ADMIN_AUTH_SETUP_ERROR', statusCode = 500, details = null } = {}) {
    super(message);
    this.name = 'AdminAuthSetupError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

export const logAdminAuth = (level, event, details = {}) => {
  const payload = {
    event,
    at: new Date().toISOString(),
    ...details
  };
  const logger = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
  logger(`[admin-auth] ${event}`, payload);
};

const DEFAULT_PERMISSIONS = {
  super_admin: [
    ['*', '*']
  ],
  admin: [
    ['dashboard', 'view'],
    ['health', 'view'],
    ['users', 'view'],
    ['users', 'create'],
    ['users', 'edit'],
    ['leads', 'view'],
    ['leads', 'edit'],
    ['leads', 'export'],
    ['leads', 'resend'],
    ['leads', 'approve'],
    ['reactivation', 'view'],
    ['reactivation', 'edit'],
    ['email_ops', 'view'],
    ['email_ops', 'create'],
    ['email_ops', 'edit'],
    ['email_ops', 'publish'],
    ['offers', 'view'],
    ['offers', 'create'],
    ['offers', 'edit'],
    ['banks', 'view'],
    ['banks', 'create'],
    ['banks', 'edit'],
    ['partners', 'view'],
    ['partners', 'create'],
    ['partners', 'edit'],
    ['articles', 'view'],
    ['articles', 'create'],
    ['articles', 'edit'],
    ['articles', 'publish'],
    ['seo_pages', 'view'],
    ['seo_pages', 'create'],
    ['seo_pages', 'edit'],
    ['seo_pages', 'publish'],
    ['testimonials', 'view'],
    ['testimonials', 'create'],
    ['testimonials', 'edit'],
    ['settings', 'view'],
    ['settings', 'edit'],
    ['audit', 'view']
  ],
  operador: [
    ['dashboard', 'view'],
    ['health', 'view'],
    ['users', 'view'],
    ['leads', 'view'],
    ['leads', 'edit'],
    ['leads', 'export'],
    ['leads', 'resend'],
    ['reactivation', 'view'],
    ['reactivation', 'edit'],
    ['email_ops', 'view']
  ],
  marketing: [
    ['dashboard', 'view'],
    ['users', 'view'],
    ['leads', 'view'],
    ['email_ops', 'view'],
    ['email_ops', 'create'],
    ['email_ops', 'edit'],
    ['email_ops', 'publish'],
    ['offers', 'view'],
    ['seo_pages', 'view'],
    ['seo_pages', 'edit'],
    ['articles', 'view']
  ],
  conteudo: [
    ['users', 'view'],
    ['articles', 'view'],
    ['articles', 'create'],
    ['articles', 'edit'],
    ['articles', 'publish'],
    ['seo_pages', 'view'],
    ['seo_pages', 'create'],
    ['seo_pages', 'edit'],
    ['seo_pages', 'publish'],
    ['testimonials', 'view'],
    ['testimonials', 'edit']
  ],
  analista: [
    ['dashboard', 'view'],
    ['health', 'view'],
    ['users', 'view'],
    ['audit', 'view'],
    ['leads', 'view'],
    ['reactivation', 'view'],
    ['email_ops', 'view'],
    ['settings', 'view']
  ]
};

const ROLE_LABELS = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  operador: 'Operador',
  marketing: 'Marketing',
  conteudo: 'Conteúdo',
  analista: 'Analista'
};

const safeEqual = (left = '', right = '') => {
  const leftBuffer = Buffer.from(String(left));
  const rightBuffer = Buffer.from(String(right));
  if (leftBuffer.length !== rightBuffer.length) return false;
  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
};

const toBase64Url = (value) =>
  Buffer.from(value)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');

const fromBase64Url = (value) => {
  const normalized = String(value).replace(/-/g, '+').replace(/_/g, '/');
  const padding = normalized.length % 4 === 0 ? '' : '='.repeat(4 - (normalized.length % 4));
  return Buffer.from(`${normalized}${padding}`, 'base64').toString('utf8');
};

export const hashValue = (value) =>
  crypto.createHash('sha256').update(String(value)).digest('hex');

const getPasswordKey = () =>
  process.env.ADMIN_PASSWORD_HASH_SECRET
  || process.env.REACTIVATION_ADMIN_SESSION_SECRET
  || process.env.REACTIVATION_ADMIN_TOKEN
  || process.env.COTE_API_TOKEN
  || 'cote-juros-admin-password-secret';

export const hashPassword = (password) => {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(String(password), salt + getPasswordKey(), 64).toString('hex');
  return `${salt}:${derived}`;
};

export const verifyPassword = (password, storedHash = '') => {
  if (!storedHash || !storedHash.includes(':')) return false;
  const [salt, expected] = storedHash.split(':');
  const derived = crypto.scryptSync(String(password), salt + getPasswordKey(), 64).toString('hex');
  return safeEqual(derived, expected);
};

export const parseCookies = (req) => {
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

const getHostname = (value = '') => {
  if (!value) return '';
  try {
    return new URL(value).hostname.toLowerCase();
  } catch {
    return String(value).split(':')[0].toLowerCase();
  }
};

const isHostnameCoveredByDomain = (hostname, domain) => {
  if (!hostname || !domain) return false;
  const normalizedDomain = String(domain).replace(/^\./, '').toLowerCase();
  return hostname === normalizedDomain || hostname.endsWith(`.${normalizedDomain}`);
};

const resolveCookieDomain = (req) => {
  if (!ADMIN_COOKIE_DOMAIN) return '';
  const originHostname = getHostname(req?.headers?.origin || '');
  const forwardedHost = getHostname(req?.headers?.['x-forwarded-host'] || req?.headers?.host || '');
  const requestHostname = originHostname || forwardedHost;

  if (requestHostname && !isHostnameCoveredByDomain(requestHostname, ADMIN_COOKIE_DOMAIN)) {
    return '';
  }

  return ADMIN_COOKIE_DOMAIN;
};

const getCookieSecret = () =>
  process.env.ADMIN_SESSION_SECRET
  || process.env.REACTIVATION_ADMIN_SESSION_SECRET
  || process.env.REACTIVATION_ADMIN_TOKEN
  || process.env.COTE_API_TOKEN
  || '';

const serializeToken = (sessionId, secret) => {
  const payload = toBase64Url(JSON.stringify({ sid: sessionId, secret }));
  const signature = crypto.createHmac('sha256', getCookieSecret()).update(payload).digest('hex');
  return `${payload}.${signature}`;
};

const parseToken = (token) => {
  if (!token || !token.includes('.')) return null;
  const [payload, signature] = String(token).split('.');
  const expected = crypto.createHmac('sha256', getCookieSecret()).update(payload).digest('hex');
  if (!safeEqual(signature, expected)) return null;
  try {
    return JSON.parse(fromBase64Url(payload));
  } catch {
    return null;
  }
};

export const setAdminCookie = (req, res, token) => {
  const secure = process.env.NODE_ENV === 'production';
  const sameSite = secure ? 'None' : 'Lax';
  const cookieDomain = resolveCookieDomain(req);
  const parts = [
    `${ADMIN_COOKIE_NAME}=${encodeURIComponent(token)}`,
    'Path=/',
    'HttpOnly',
    `SameSite=${sameSite}`,
    `Max-Age=${ADMIN_SESSION_TTL_SECONDS}`
  ];
  if (secure) parts.push('Secure');
  if (cookieDomain) parts.push(`Domain=${cookieDomain}`);
  res.setHeader('Set-Cookie', parts.join('; '));
};

export const clearAdminCookie = (req, res) => {
  const secure = process.env.NODE_ENV === 'production';
  const sameSite = secure ? 'None' : 'Lax';
  const cookieDomain = resolveCookieDomain(req);
  const parts = [
    `${ADMIN_COOKIE_NAME}=`,
    'Path=/',
    'HttpOnly',
    `SameSite=${sameSite}`,
    'Max-Age=0'
  ];
  if (secure) parts.push('Secure');
  if (cookieDomain) parts.push(`Domain=${cookieDomain}`);
  res.setHeader('Set-Cookie', parts.join('; '));
};

export const getRequestMetadata = (req) => ({
  ipAddress: req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || null,
  userAgent: req.headers['user-agent'] || null
});

export const checkAdminDatabaseHealth = async (prisma = getPrisma()) => {
  const requiredTableList = ADMIN_REQUIRED_TABLES.map((table) => `'${table}'`).join(',');
  const tableRows = await prisma.$queryRawUnsafe(`
    select table_name
    from information_schema.tables
    where table_schema = 'public'
      and table_name in (${requiredTableList})
  `);
  const existingTables = new Set(tableRows.map((row) => row.table_name));
  const missingTables = ADMIN_REQUIRED_TABLES.filter((table) => !existingTables.has(table));

  let appliedMigrations = [];
  try {
    appliedMigrations = await prisma.$queryRaw`
      select migration_name
      from _prisma_migrations
      where finished_at is not null
        and rolled_back_at is null
        and migration_name in ('20260417_admin_governance_foundation', '20260417_admin_partner_configs')
      order by migration_name
    `;
  } catch {
    appliedMigrations = [];
  }

  return {
    ok: missingTables.length === 0,
    missingTables,
    requiredTables: ADMIN_REQUIRED_TABLES,
    appliedMigrations: appliedMigrations.map((row) => row.migration_name)
  };
};

export const ensureAdminDatabaseReady = async (prisma = getPrisma()) => {
  const health = await checkAdminDatabaseHealth(prisma);
  if (!health.ok) {
    throw new AdminAuthSetupError('Admin database is not migrated', {
      code: 'ADMIN_MIGRATION_MISSING',
      statusCode: 503,
      details: health
    });
  }
  return health;
};

const ensureRolesAndPermissions = async (prisma) => {
  await ensureAdminDatabaseReady(prisma);

  const seededSuperAdmin = await prisma.adminRole.findUnique({
    where: { code: 'super_admin' },
    include: {
      permissions: {
        include: {
          permission: true
        }
      }
    }
  });

  if (
    seededSuperAdmin?.permissions?.some((rolePermission) =>
      rolePermission.permission.resource === '*' && rolePermission.permission.action === '*'
    )
  ) {
    return;
  }

  for (const [code, permissions] of Object.entries(DEFAULT_PERMISSIONS)) {
    const role = await prisma.adminRole.upsert({
      where: { code },
      update: {
        name: ROLE_LABELS[code] || code,
        description: `Perfil ${ROLE_LABELS[code] || code}`
      },
      create: {
        code,
        name: ROLE_LABELS[code] || code,
        description: `Perfil ${ROLE_LABELS[code] || code}`
      }
    });

    for (const [resource, action] of permissions) {
      const permission = await prisma.adminPermission.upsert({
        where: {
          resource_action: { resource, action }
        },
        update: {},
        create: {
          resource,
          action,
          description: `${resource}:${action}`
        }
      });

      await prisma.adminRolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: role.id,
            permissionId: permission.id
          }
        },
        update: {},
        create: {
          roleId: role.id,
          permissionId: permission.id
        }
      });
    }
  }
};

export const ensureAdminBootstrap = async () => {
  const prisma = getPrisma();
  await ensureRolesAndPermissions(prisma);

  const bootstrapEmail = (process.env.ADMIN_BOOTSTRAP_EMAIL || 'admin@cotejuros.com.br').toLowerCase();
  const bootstrapName = process.env.ADMIN_BOOTSTRAP_NAME || 'Administrador Cote Juros';
  const bootstrapPassword = process.env.ADMIN_BOOTSTRAP_PASSWORD || process.env.REACTIVATION_ADMIN_PASSWORD || '';

  const existing = await prisma.adminUser.findUnique({
    where: { email: bootstrapEmail }
  });

  let user = existing;
  if (!existing) {
    if (!bootstrapPassword) return null;

    user = await prisma.adminUser.create({
      data: {
        email: bootstrapEmail,
        fullName: bootstrapName,
        passwordHash: hashPassword(bootstrapPassword)
      }
    });
  } else if (
    bootstrapPassword
    && (
      existing.status !== 'active'
      || existing.fullName !== bootstrapName
      || !verifyPassword(bootstrapPassword, existing.passwordHash)
    )
  ) {
    user = await prisma.adminUser.update({
      where: { id: existing.id },
      data: {
        fullName: bootstrapName,
        status: 'active',
        passwordHash: hashPassword(bootstrapPassword)
      }
    });
  }

  const superAdminRole = await prisma.adminRole.findUnique({ where: { code: 'super_admin' } });
  if (superAdminRole) {
    await prisma.adminUserRole.upsert({
      where: {
        userId_roleId: {
          userId: user.id,
          roleId: superAdminRole.id
        }
      },
      update: {},
      create: {
        userId: user.id,
        roleId: superAdminRole.id
      }
    });
  }

  return prisma.adminUser.findUnique({
    where: { id: user.id },
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
};

export const recordAdminAudit = async ({ req, user, action, resource, resourceId = null, before = null, after = null, metadata = null }) => {
  const prisma = getPrisma();
  const requestMeta = getRequestMetadata(req);
  return prisma.adminAuditLog.create({
    data: {
      actorUserId: user?.id || null,
      actorEmail: user?.email || null,
      action,
      resource,
      resourceId,
      before,
      after,
      metadata,
      ipAddress: requestMeta.ipAddress,
      userAgent: requestMeta.userAgent
    }
  });
};

export const createAdminSession = async (req, user) => {
  const prisma = getPrisma();
  const sessionSecret = crypto.randomBytes(32).toString('hex');
  const metadata = getRequestMetadata(req);
  const expiresAt = new Date(Date.now() + (ADMIN_SESSION_TTL_SECONDS * 1000));

  const session = await prisma.adminSession.create({
    data: {
      userId: user.id,
      sessionHash: hashValue(sessionSecret),
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
      expiresAt,
      lastSeenAt: new Date()
    }
  });

  return {
    token: serializeToken(session.id, sessionSecret),
    session,
    expiresAt
  };
};

export const revokeAdminSession = async (sessionId) => {
  if (!sessionId) return null;
  const prisma = getPrisma();
  try {
    return await prisma.adminSession.update({
      where: { id: sessionId },
      data: {
        status: 'revoked',
        revokedAt: new Date()
      }
    });
  } catch {
    return null;
  }
};

export const resolveAdminSession = async (req) => {
  const token = parseCookies(req)[ADMIN_COOKIE_NAME];
  const parsed = parseToken(token);
  if (!parsed?.sid || !parsed?.secret) return null;

  const prisma = getPrisma();
  const session = await prisma.adminSession.findUnique({
    where: { id: parsed.sid },
    include: {
      user: {
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
      }
    }
  });

  if (!session || session.status !== 'active' || !session.user || session.user.status !== 'active') return null;
  if (session.expiresAt <= new Date()) {
    await revokeAdminSession(session.id);
    return null;
  }
  if (!safeEqual(session.sessionHash, hashValue(parsed.secret))) return null;

  await prisma.adminSession.update({
    where: { id: session.id },
    data: {
      lastSeenAt: new Date(),
      expiresAt: new Date(Date.now() + (ADMIN_SESSION_TTL_SECONDS * 1000))
    }
  });

  const permissions = session.user.roles.flatMap((userRole) =>
    userRole.role.permissions.map((rolePermission) => `${rolePermission.permission.resource}:${rolePermission.permission.action}`)
  );

  return {
    session,
    user: session.user,
    permissions: Array.from(new Set(permissions))
  };
};

export const hasPermission = (sessionContext, resource, action) => {
  const permissions = sessionContext?.permissions || [];
  return permissions.includes('*:*')
    || permissions.includes(`${resource}:*`)
    || permissions.includes(`${resource}:${action}`);
};

export const requireAdminSession = async (req, res, next) => {
  const session = await resolveAdminSession(req);
  if (!session) return res.status(401).json({ error: 'Unauthorized' });
  req.adminSession = session;
  req.adminUser = session.user;
  return next();
};

export const requirePermission = (resource, action) => async (req, res, next) => {
  const session = req.adminSession || await resolveAdminSession(req);
  if (!session) return res.status(401).json({ error: 'Unauthorized' });
  if (!hasPermission(session, resource, action)) {
    return res.status(403).json({ error: 'Forbidden', message: `Missing permission ${resource}:${action}` });
  }
  req.adminSession = session;
  req.adminUser = session.user;
  return next();
};

export const assertLoginAllowed = async ({ email, ipAddress }) => {
  const prisma = getPrisma();
  const since = new Date(Date.now() - (15 * 60 * 1000));
  const failures = await prisma.adminLoginAttempt.count({
    where: {
      success: false,
      createdAt: { gte: since },
      OR: [
        email ? { email } : undefined,
        ipAddress ? { ipAddress } : undefined
      ].filter(Boolean)
    }
  });

  return failures < 5;
};
