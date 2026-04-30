import express from 'express';
import cors from 'cors';
import banksRoutes from './routes/banks.js';
import offersRoutes from './routes/offers.js';
import articlesRoutes from './routes/articles.js';
import simulationsRoutes from './routes/simulations.js';
import trackingRoutes from './routes/tracking.js';
import partnersRoutes from './routes/partners.js';
import integrationRoutes from './routes/integration.js';
import creditRoutes from './routes/credit.js';
import affiliatesRoutes from './routes/affiliates.js';
import reactivationRoutes from './routes/reactivation.js';
import reactivationAdminRoutes from './routes/reactivationAdmin.js';
import adminRoutes from './routes/admin.js';
import siteRoutes from './routes/site.js';
import internalRoutes from './routes/internal.js';
import cronArticlesRoutes from './routes/cronArticles.js';
import distributionPublicRoutes from './routes/distributionPublic.js';
import { PrismaConfigError } from './lib/prisma.js';
import { AdminAuthSetupError } from './lib/adminAuth.js';
import { IntegrationConfigurationError, JurosBaixosIntegrationError } from './integrations/jurosBaixos/errors.js';
import { getJurosBaixosHealth } from './integrations/jurosBaixos/config.js';
import { getCreditasHealth } from './integrations/creditas/config.js';
import { CreditasIntegrationError } from './integrations/creditas/errors.js';
import { CompetitorSeoResearchService } from './services/competitorSeoResearchService.js';
import { SeoGrowthService } from './services/seoGrowthService.js';

export const createApp = () => {
  const app = express();
  const defaultPublicOrigins = [
    'https://cotejuros.com.br',
    'https://www.cotejuros.com.br',
    'https://cotejuros.br',
    'https://www.cotejuros.br'
  ];
  const domainOriginAliases = (origin) => {
    try {
      const url = new URL(origin);
      const aliases = [origin];
      const webHosts = new Set([
        'cotejuros.com.br',
        'www.cotejuros.com.br',
        'cotejuros.br',
        'www.cotejuros.br'
      ]);

      if (webHosts.has(url.hostname)) {
        for (const host of webHosts) {
          aliases.push(`${url.protocol}//${host}`);
        }
      }

      return aliases;
    } catch {
      return [origin];
    }
  };

  const configuredOrigins = String(process.env.CORS_ORIGIN || defaultPublicOrigins.join(','))
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  const allowedOrigins = Array.from(new Set(configuredOrigins.flatMap((origin) => (
    origin === '*' ? ['*'] : domainOriginAliases(origin)
  ))));
  const isAllowedOrigin = (origin) =>
    !origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin);

  app.use((req, res, next) => {
    const origin = req.headers.origin;
    res.vary('Origin');

    if (origin && isAllowedOrigin(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,PUT,DELETE,OPTIONS');
      res.setHeader(
        'Access-Control-Allow-Headers',
        req.headers['access-control-request-headers'] || 'Content-Type, Authorization'
      );
    }

    if (req.method === 'OPTIONS') return res.sendStatus(204);
    return next();
  });

  app.use(
    cors({
      credentials: true,
      origin: (origin, callback) => {
        if (isAllowedOrigin(origin)) {
          return callback(null, true);
        }
        console.warn('[cors] blocked origin', { origin });
        return callback(null, false);
      }
    })
  );
  app.use(express.json({
    limit: '1mb',
    verify: (req, _res, buf) => {
      if (
        req.originalUrl?.startsWith('/api/reactivation-admin/webhooks/sendgrid') ||
        req.originalUrl?.startsWith('/api/credit/creditas/webhook')
      ) {
        req.rawBody = Buffer.from(buf);
      }
    }
  }));

  app.get('/health', (req, res) => {
    res.json({
      ok: true,
      service: 'cote-juros-api',
      databaseConfigured: Boolean(process.env.DATABASE_URL),
      integrations: {
        jurosBaixos: getJurosBaixosHealth(),
        creditas: getCreditasHealth()
      },
      seo: {
        searchConsole: SeoGrowthService.getSearchConsoleHealth(),
        competitors: CompetitorSeoResearchService.getHealth()
      },
      timestamp: new Date().toISOString()
    });
  });

  app.use('/api/banks', banksRoutes);
  app.use('/api/offers', offersRoutes);
  app.use('/api/articles', articlesRoutes);
  app.use('/api/simulations', simulationsRoutes);
  app.use('/api/tracking', trackingRoutes);
  app.use('/api/partners', partnersRoutes);
  app.use('/api/integration', integrationRoutes);
  app.use('/api/credit', creditRoutes);
  app.use('/api/affiliates', affiliatesRoutes);
  app.use('/api/reactivation', reactivationRoutes);
  app.use('/api/reactivation-admin', reactivationAdminRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/site', siteRoutes);
  app.use('/api/internal', internalRoutes);
  app.use('/api/cron/articles', cronArticlesRoutes);
  app.use('/', distributionPublicRoutes);

  app.use((err, req, res, _next) => {
    if (err?.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation error', details: err.issues });
    }

    if (err?.name === 'ValidationError') {
      return res.status(400).json({ error: 'Validation error', details: err.details || err.message });
    }

    if (err instanceof PrismaConfigError) {
      return res.status(500).json({ error: 'Database configuration error', message: err.message });
    }

    if (err instanceof AdminAuthSetupError) {
      return res.status(err.statusCode || 500).json({
        error: 'Admin authentication setup error',
        code: err.code || null,
        message: err.message,
        details: err.details || null
      });
    }

    if (err instanceof IntegrationConfigurationError) {
      return res.status(err.statusCode || 500).json({
        error: 'Integration configuration error',
        code: err.code || null,
        message: err.message
      });
    }

    if (err instanceof JurosBaixosIntegrationError) {
      return res.status(err.statusCode || 502).json({
        error: 'Provider integration error',
        code: err.code || null,
        message: err.message,
        details: err.expose ? err.details : null
      });
    }

    if (err instanceof CreditasIntegrationError) {
      return res.status(err.statusCode || 502).json({
        error: 'Creditas integration error',
        code: err.code || null,
        message: err.message,
        details: err.expose ? err.details : null
      });
    }

    if (req.originalUrl?.includes('/api/admin/email-ops') || req.originalUrl?.includes('/api/reactivation-admin')) {
      if (String(err?.message || '').includes('SENDGRID_API_KEY')) {
        return res.status(503).json({
          error: 'Email provider is not configured',
          code: 'EMAIL_PROVIDER_NOT_CONFIGURED',
          message: 'Provider de envio ainda nao configurado.'
        });
      }

      if (String(err?.message || '').includes('Lead does not have an email')) {
        return res.status(400).json({
          error: 'Lead has no email',
          code: 'EMAIL_OPS_LEAD_WITHOUT_EMAIL',
          message: 'O lead selecionado nao possui email para envio.'
        });
      }
    }

    if (err?.name?.startsWith('Prisma')) {
      return res.status(500).json({
        error: 'Database query error',
        code: err.code || null,
        message: err.message
      });
    }

    console.error(err);
    return res.status(500).json({
      error: 'Internal server error',
      name: err?.name || null,
      code: err?.code || null,
      message: err?.message || null
    });
  });

  return app;
};
