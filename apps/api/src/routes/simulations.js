import express from 'express';
import { z } from 'zod';
import { asyncHandler, pickUtm } from '../lib/http.js';
import { SimulationService } from '../services/simulationService.js';

const router = express.Router();

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const schema = z.object({
      productType: z.enum(['loan', 'credit_card', 'financing']),
      requestedAmount: z.number().optional(),
      income: z.number().optional(),
      scoreRange: z.string().optional(),
      employmentStatus: z.string().optional(),
      hasRestriction: z.boolean().optional(),
      originPage: z.string().optional(),
      utm_source: z.string().optional(),
      utm_medium: z.string().optional(),
      utm_campaign: z.string().optional()
    });

    const payload = schema.parse(req.body || {});
    const lead = await SimulationService.createLead({
      productType: payload.productType,
      requestedAmount: payload.requestedAmount,
      income: payload.income,
      scoreRange: payload.scoreRange,
      employmentStatus: payload.employmentStatus,
      hasRestriction: payload.hasRestriction,
      originPage: payload.originPage,
      ...pickUtm(payload)
    });

    res.status(201).json({ data: lead });
  })
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const lead = await SimulationService.getById(req.params.id);
    if (!lead) return res.status(404).json({ error: 'Simulation not found' });
    res.json({ data: lead });
  })
);

export default router;
