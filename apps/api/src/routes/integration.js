import express from 'express';
import { z } from 'zod';
import { asyncHandler } from '../lib/http.js';
import { AppIntegrationService } from '../services/appIntegrationService.js';

const router = express.Router();

router.post(
  '/app-link',
  asyncHandler(async (req, res) => {
    const schema = z.object({
      sourcePage: z.string().optional(),
      productType: z.enum(['loan', 'credit_card', 'financing']).optional(),
      simulationId: z.string().optional(),
      campaign: z.string().optional(),
      utm: z.record(z.string()).optional()
    });

    const payload = schema.parse(req.body || {});
    const url = AppIntegrationService.buildDeepLink(payload);

    res.json({ data: { url } });
  })
);

export default router;
