import express from 'express';
import { z } from 'zod';
import { asyncHandler } from '../lib/http.js';
import { PartnerService } from '../services/partnerService.js';

const router = express.Router();

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

export default router;
