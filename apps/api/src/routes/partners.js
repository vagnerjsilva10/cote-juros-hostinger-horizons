import express from 'express';
import { z } from 'zod';
import { asyncHandler } from '../lib/http.js';
import { PartnerService } from '../services/partnerService.js';
import { PartnerMatcherService } from '../services/partnerMatcherService.js';

const router = express.Router();
const fallbackProfile = {
  negativado: null,
  renda: null,
  valor: null,
  urgencia: null
};

router.post(
  '/match',
  asyncHandler(async (req, res) => {
    const schema = z.object({
      productType: z.enum(['loan', 'credit_card', 'financing']).default('loan'),
      profile: z
        .object({
          negativado: z.boolean().nullable().optional(),
          renda: z.number().nullable().optional(),
          valor: z.number().nullable().optional(),
          urgencia: z.string().nullable().optional()
        })
        .partial()
        .optional()
    });

    const payload = schema.parse(req.body || {});
    const profile = {
      ...fallbackProfile,
      ...(payload.profile || {})
    };

    const recommendations = await PartnerMatcherService.match({
      productType: payload.productType,
      lead: {
        hasRestriction: profile.negativado,
        income: profile.renda,
        requestedAmount: profile.valor,
        urgency: profile.urgencia
      }
    });

    res.json({
      data: {
        profile,
        recommendations
      }
    });
  })
);

router.post(
  '/redirect',
  asyncHandler(async (req, res) => {
    const schema = z.object({
      partnerId: z.string(),
      offerId: z.string().optional(),
      sourcePage: z.string(),
      destinationUrl: z.string().url(),
      trackingBaseUrl: z.string().url().optional(),
      utm: z.record(z.string()).optional()
    });

    const payload = schema.parse(req.body || {});

    const redirectUrl = PartnerService.buildRedirectUrl({
      destinationUrl: payload.destinationUrl,
      trackingBaseUrl: payload.trackingBaseUrl,
      sourcePage: payload.sourcePage,
      offerId: payload.offerId,
      utm: payload.utm
    });

    const record = await PartnerService.registerRedirect({
      partnerId: payload.partnerId,
      offerId: payload.offerId,
      sourcePage: payload.sourcePage,
      destinationUrl: redirectUrl
    });

    res.status(201).json({ data: { ...record, resolvedUrl: redirectUrl } });
  })
);

router.post(
  '/mock-api',
  asyncHandler(async (req, res) => {
    const schema = z.object({
      partnerId: z.string(),
      leadId: z.string().optional(),
      sourcePage: z.string(),
      productType: z.enum(['loan', 'credit_card', 'financing']).optional(),
      profile: z.string().optional()
    });

    const payload = schema.parse(req.body || {});
    const result = await PartnerService.submitMockApiLead({
      partnerId: payload.partnerId,
      leadId: payload.leadId,
      sourcePage: payload.sourcePage,
      productType: payload.productType,
      profile: payload.profile
    });

    res.status(202).json({ data: result });
  })
);

export default router;
