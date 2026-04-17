import express from 'express';
import cors from 'cors';
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
import { PrismaConfigError } from './lib/prisma.js';
import { IntegrationConfigurationError, JurosBaixosIntegrationError } from './integrations/jurosBaixos/errors.js';
import { getJurosBaixosHealth } from './integrations/jurosBaixos/config.js';

export const createApp = () => {
  const app = express();
  const configuredOrigins = String(process.env.CORS_ORIGIN || '*')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  const allowedOrigins = Array.from(new Set(configuredOrigins.flatMap((origin) => {
    if (origin === '*') return ['*'];
    try {
      const url = new URL(origin);
      if (url.hostname === 'cotejuros.com.br') {
        return [origin, `${url.protocol}//www.cotejuros.com.br`];
      }
      if (url.hostname === 'www.cotejuros.com.br') {
        return [origin, `${url.protocol}//cotejuros.com.br`];
      }
      return [origin];
    } catch {
      return [origin];
    }
  })));

  app.use(
    cors({
      credentials: true,
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
          return callback(null, true);
        }
        return callback(null, false);
      }
    })
  );
  app.use(express.json({
    limit: '1mb',
    verify: (req, _res, buf) => {
      if (req.originalUrl?.startsWith('/api/reactivation-admin/webhooks/sendgrid')) {
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
        jurosBaixos: getJurosBaixosHealth()
      },
      timestamp: new Date().toISOString()
    });
  });

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
