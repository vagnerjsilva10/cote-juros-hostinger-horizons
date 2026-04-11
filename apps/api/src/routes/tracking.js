import express from 'express';
import { z } from 'zod';
import { asyncHandler, pickUtm } from '../lib/http.js';
import { TrackingService } from '../services/trackingService.js';

const router = express.Router();

router.post(
  '/clicks',
  asyncHandler(async (req, res) => {
    const schema = z.object({
      offerId: z.string().optional(),
      sourcePage: z.string(),
      utm_source: z.string().optional(),
      utm_medium: z.string().optional(),
      utm_campaign: z.string().optional()
    });

    const payload = schema.parse(req.body || {});
    const event = await TrackingService.recordClick({
      offerId: payload.offerId,
      sourcePage: payload.sourcePage,
      ...pickUtm(payload)
    });

    res.status(201).json({ data: event });
  })
);

router.post(
  '/cta',
  asyncHandler(async (req, res) => {
    const schema = z.object({
      sourcePage: z.string(),
      ctaName: z.string(),
      destination: z.string().optional()
    });

    const payload = schema.parse(req.body || {});
    const event = await TrackingService.recordCta(payload);
    res.status(201).json({ data: event });
  })
);

router.post(
  '/integrations',
  asyncHandler(async (req, res) => {
    const schema = z.object({
      sourcePage: z.string(),
      productContext: z.string().optional(),
      simulationId: z.string().optional()
    });

    const payload = schema.parse(req.body || {});
    const event = await TrackingService.recordAppIntegration(payload);
    res.status(201).json({ data: event });
  })
);

export default router;
