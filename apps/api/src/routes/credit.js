import express from 'express';
import { z } from 'zod';
import { asyncHandler, pickUtm } from '../lib/http.js';
import { CreditOfferService } from '../services/creditOfferService.js';
import { CreditSimulationService } from '../services/creditSimulationService.js';
import { CreditTrackingService } from '../services/creditTrackingService.js';
import { getJurosBaixosConfig, getJurosBaixosHealth } from '../integrations/jurosBaixos/config.js';

const router = express.Router();

const startSchema = z.object({
  fullName: z.string().min(3),
  cpf: z.string().min(11),
  email: z.string().email().optional(),
  phone: z.string().min(10).optional(),
  requestedAmount: z.number().positive(),
  income: z.number().positive().optional(),
  scoreRange: z.string().optional(),
  employmentStatus: z.string().optional(),
  hasRestriction: z.boolean().optional(),
  productType: z.enum(['loan', 'credit_card', 'financing']),
  sourcePage: z.string().optional(),
  utm_source: z.string().optional(),
  utm_medium: z.string().optional(),
  utm_campaign: z.string().optional()
});

const simulateSchema = z.object({
  leadId: z.string().min(1),
  providerSessionId: z.string().optional(),
  requestedAmount: z.number().positive(),
  installments: z.number().int().positive(),
  productType: z.enum(['loan', 'credit_card', 'financing'])
});

const clickSchema = z.object({
  sourcePage: z.string(),
  utm_source: z.string().optional(),
  utm_medium: z.string().optional(),
  utm_campaign: z.string().optional()
});

const webhookSchema = z.object({}).passthrough();

router.get(
  '/health',
  asyncHandler(async (_req, res) => {
    res.json({
      data: {
        ok: true,
        ...getJurosBaixosHealth(),
        timestamp: new Date().toISOString()
      }
    });
  })
);

router.post(
  '/start',
  asyncHandler(async (req, res) => {
    const payload = startSchema.parse(req.body || {});
    const journey = await CreditSimulationService.startJourney({
      ...payload,
      ...pickUtm(payload)
    });

    res.status(201).json({ data: journey });
  })
);

router.post(
  '/simulate',
  asyncHandler(async (req, res) => {
    const payload = simulateSchema.parse(req.body || {});
    const result = await CreditSimulationService.simulate(payload);
    res.status(201).json({ data: result });
  })
);

router.get(
  '/simulations/:id',
  asyncHandler(async (req, res) => {
    const simulation = await CreditSimulationService.getSimulationById(req.params.id);
    if (!simulation) return res.status(404).json({ error: 'Credit simulation not found' });
    return res.json({ data: simulation });
  })
);

router.post(
  '/offers/:id/click',
  asyncHandler(async (req, res) => {
    const payload = clickSchema.parse(req.body || {});
    const offer = await CreditOfferService.getById(req.params.id);
    if (!offer) return res.status(404).json({ error: 'Credit offer not found' });

    const click = await CreditTrackingService.recordOfferClick({
      simulationId: offer.simulation.id,
      offerSnapshotId: offer.id,
      provider: offer.provider,
      sourcePage: payload.sourcePage,
      ...pickUtm(payload)
    });

    CreditTrackingService.log('CREDIT_OFFER_CLICK', {
      simulationId: offer.simulation.id,
      offerId: offer.id,
      provider: offer.provider,
      sourcePage: payload.sourcePage
    });

    return res.status(201).json({
      data: {
        clickId: click.id,
        simulationId: offer.simulation.id,
        offerId: offer.id,
        redirectUrl: offer.redirectUrl,
        provider: offer.provider
      }
    });
  })
);

router.post(
  '/webhook',
  asyncHandler(async (req, res) => {
    const payload = webhookSchema.parse(req.body || {});
    const config = getJurosBaixosConfig();
    const signature = req.headers['x-juros-baixos-signature'];
    const rawBody = JSON.stringify(payload);

    if (config.webhookSecret) {
      const valid = CreditTrackingService.verifyWebhookSignature({
        rawBody,
        signature: Array.isArray(signature) ? signature[0] : signature,
        secret: config.webhookSecret
      });

      if (!valid) {
        return res.status(401).json({ error: 'Invalid webhook signature' });
      }
    }

    await CreditTrackingService.recordWebhookReceipt();
    CreditTrackingService.log('CREDIT_WEBHOOK_RECEIVED', {
      provider: 'juros_baixos',
      keys: Object.keys(payload)
    });

    return res.status(202).json({ data: { received: true } });
  })
);

export default router;
