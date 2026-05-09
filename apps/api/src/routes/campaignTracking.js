import express from 'express';
import { z } from 'zod';
import { asyncHandler } from '../lib/http.js';
import { CampaignTrackingService } from '../services/campaignTrackingService.js';

const router = express.Router();

const clickParamsSchema = z.object({
  clickId: z.string().min(12).max(120),
});

const manualConversionSchema = z.object({
  clickId: z.string().min(12).max(120),
  partnerId: z.string().optional(),
  status: z.enum(['pending', 'confirmed', 'approved', 'paid', 'rejected', 'cancelled']).default('confirmed'),
  externalId: z.string().optional(),
  commission: z.coerce.number().min(0).optional(),
  commissionValue: z.coerce.number().min(0).optional(),
  value: z.coerce.number().min(0).optional(),
  contractValue: z.coerce.number().min(0).optional(),
  currency: z.string().length(3).default('BRL'),
  convertedAt: z.string().datetime().optional(),
  rawPayload: z.record(z.any()).optional(),
});

const requireAutomationToken = (req, res, next) => {
  const expected = process.env.REACTIVATION_ADMIN_TOKEN || process.env.COTE_API_TOKEN;
  if (!expected && process.env.NODE_ENV === 'production') {
    return res.status(503).json({ error: 'Automation token is not configured' });
  }
  if (!expected) return next();
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (token !== expected) return res.status(401).json({ error: 'Unauthorized' });
  return next();
};

router.get(
  '/go/:clickId',
  asyncHandler(async (req, res) => {
    const fallbackUrl = CampaignTrackingService.fallbackUrl();
    const parsed = clickParamsSchema.safeParse(req.params);
    if (!parsed.success) return res.redirect(302, fallbackUrl);

    const click = await CampaignTrackingService.resolveClick(parsed.data.clickId);
    if (!click) return res.redirect(302, fallbackUrl);

    const destinationUrl = CampaignTrackingService.destinationForClick(click);
    try {
      await CampaignTrackingService.registerRedirect({
        click,
        req,
        destinationUrl,
        status: 'redirect_completed',
        httpStatus: 302,
      });
      return res.redirect(302, destinationUrl);
    } catch (error) {
      await CampaignTrackingService.registerRedirect({
        click,
        req,
        destinationUrl: click.fallbackUrl || fallbackUrl,
        status: 'redirect_failed',
        httpStatus: 302,
        errorMessage: String(error?.message || 'redirect_failed').slice(0, 240),
      }).catch(() => null);
      return res.redirect(302, click.fallbackUrl || fallbackUrl);
    }
  })
);

router.post(
  '/api/tracking/conversions/manual',
  requireAutomationToken,
  asyncHandler(async (req, res) => {
    const payload = manualConversionSchema.parse(req.body || {});
    let result;
    try {
      result = await CampaignTrackingService.recordManualConversion(payload);
    } catch (error) {
      if (error?.statusCode === 404) {
        return res.status(404).json({ error: 'CtaClick not found' });
      }
      throw error;
    }
    res.status(201).json({
      data: {
        id: result.conversion.id,
        clickId: result.conversion.clickId,
        partnerId: result.conversion.partnerId,
        status: result.conversion.status,
        commissionValue: result.conversion.commissionValue,
        contractValue: result.conversion.contractValue,
        currency: result.conversion.currency,
      },
    });
  })
);

router.get(
  '/api/tracking/campaign-dashboard',
  requireAutomationToken,
  asyncHandler(async (_req, res) => {
    res.json({ data: await CampaignTrackingService.dashboardSummary() });
  })
);

export default router;
