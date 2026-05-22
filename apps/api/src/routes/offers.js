import express from 'express';
import { z } from 'zod';
import { asyncHandler, pickUtm } from '../lib/http.js';
import { OfferService } from '../services/offerService.js';

const router = express.Router();

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const offers = await OfferService.list(req.query);

    if (req.query.rank === 'true') {
      const ranked = OfferService.rank(offers, {
        requestedAmount: req.query.requestedAmount,
        scoreRange: req.query.scoreRange
      });
      return res.json({ data: ranked });
    }

    return res.json({ data: offers });
  })
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const offer = await OfferService.getById(req.params.id);
    if (!offer) return res.status(404).json({ error: 'Offer not found' });
    return res.json({ data: offer });
  })
);

router.post(
  '/:id/click',
  asyncHandler(async (req, res) => {
    const schema = z.object({
      sourcePage: z.string(),
      utm_source: z.string().optional(),
      utm_medium: z.string().optional(),
      utm_campaign: z.string().optional()
    });

    const payload = schema.parse(req.body || {});
    const offer = await OfferService.getById(req.params.id);
    if (!offer) return res.status(404).json({ error: 'Offer not found' });

    return res.json({
      data: {
        offerId: offer.id,
        redirectUrl: offer.partnerTrackingUrl || offer.redirectUrl,
        tracking: pickUtm(payload)
      }
    });
  })
);

export default router;
