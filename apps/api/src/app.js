import express from 'express';
import cors from 'cors';
import offersRoutes from './routes/offers.js';
import articlesRoutes from './routes/articles.js';
import simulationsRoutes from './routes/simulations.js';
import trackingRoutes from './routes/tracking.js';
import partnersRoutes from './routes/partners.js';
import integrationRoutes from './routes/integration.js';

export const createApp = () => {
  const app = express();

  app.use(
    cors({
      origin: process.env.CORS_ORIGIN || '*'
    })
  );
  app.use(express.json({ limit: '1mb' }));

  app.get('/health', (req, res) => {
    res.json({ ok: true, service: 'cote-juros-api', timestamp: new Date().toISOString() });
  });

  app.use('/api/offers', offersRoutes);
  app.use('/api/articles', articlesRoutes);
  app.use('/api/simulations', simulationsRoutes);
  app.use('/api/tracking', trackingRoutes);
  app.use('/api/partners', partnersRoutes);
  app.use('/api/integration', integrationRoutes);

  app.use((err, req, res, _next) => {
    if (err?.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation error', details: err.issues });
    }

    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  });

  return app;
};

