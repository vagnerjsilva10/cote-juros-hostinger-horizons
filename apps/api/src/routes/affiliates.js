import express from 'express';
import { z } from 'zod';
import { asyncHandler } from '../lib/http.js';
import { AffiliateService } from '../services/affiliateService.js';
import { AwinService } from '../services/awinService.js';
import { AdmitadService } from '../services/admitadService.js';
import { LomadeeService } from '../services/lomadeeService.js';

const router = express.Router();

router.get(
  '/offers',
  asyncHandler(async (req, res) => {
    const schema = z.object({
      pageSlug: z.string().optional(),
      position: z.string().optional(),
      productType: z.enum(['loan', 'credit_card', 'financing']).optional(),
      limit: z.coerce.number().int().positive().max(24).optional()
    });

    const payload = schema.parse(req.query || {});
    const data = await AffiliateService.listOffers(payload);
    res.json({ data });
  })
);

router.get(
  '/placements',
  asyncHandler(async (req, res) => {
    const schema = z.object({
      pageSlug: z.string(),
      productType: z.enum(['loan', 'credit_card', 'financing']).optional()
    });

    const payload = schema.parse(req.query || {});
    const data = await AffiliateService.getPlacements(payload);
    res.json({ data });
  })
);

router.post(
  '/offers/:offerSlug/click',
  asyncHandler(async (req, res) => {
    const schema = z.object({
      pageSlug: z.string(),
      position: z.string()
    });

    const payload = schema.parse(req.body || {});
    const data = await AffiliateService.handleClick({
      offerSlug: req.params.offerSlug,
      pageSlug: payload.pageSlug,
      position: payload.position,
      userAgent: req.get('user-agent') || ''
    });

    if (!data) {
      return res.status(404).json({ error: 'Affiliate offer not found' });
    }

    return res.status(201).json({ data });
  })
);

router.get(
  '/awin/status',
  asyncHandler(async (_req, res) => {
    res.json({
      data: {
        configured: AwinService.isConfigured()
      }
    });
  })
);

router.get(
  '/admitad/status',
  asyncHandler(async (_req, res) => {
    res.json({
      data: {
        configured: AdmitadService.isConfigured()
      }
    });
  })
);

router.get(
  '/lomadee/status',
  asyncHandler(async (_req, res) => {
    res.json({
      data: {
        configured: LomadeeService.isConfigured()
      }
    });
  })
);

router.get(
  '/lomadee/brands',
  asyncHandler(async (req, res) => {
    const schema = z.object({
      search: z.string().optional(),
      page: z.coerce.number().int().positive().optional(),
      limit: z.coerce.number().int().positive().max(100).optional(),
      categories: z.string().optional(),
      isExclusive: z.coerce.boolean().optional(),
      isFavorite: z.coerce.boolean().optional(),
      isHighlight: z.coerce.boolean().optional(),
      isPublic: z.coerce.boolean().optional()
    });

    const payload = schema.parse(req.query || {});
    const data = await LomadeeService.listBrands(payload);
    res.json({ data });
  })
);

router.get(
  '/lomadee/campaigns',
  asyncHandler(async (req, res) => {
    const schema = z.object({
      page: z.coerce.number().int().positive().optional(),
      limit: z.coerce.number().int().positive().max(100).optional(),
      types: z.string().optional(),
      offerType: z.string().optional(),
      organizationId: z.string().optional(),
      organizationIds: z.string().optional(),
      name: z.string().optional(),
      isHighlight: z.coerce.boolean().optional(),
      categories: z.string().optional(),
      status: z.string().optional()
    });

    const payload = schema.parse(req.query || {});
    const data = await LomadeeService.listCampaigns(payload);
    res.json({ data });
  })
);

router.post(
  '/lomadee/sync',
  asyncHandler(async (req, res) => {
    const schema = z.object({
      page: z.coerce.number().int().positive().optional(),
      limit: z.coerce.number().int().positive().max(100).optional(),
      status: z.string().optional(),
      merchantQuery: z.string().optional(),
      name: z.string().optional(),
      categories: z.string().optional(),
      types: z.string().optional(),
      offerType: z.string().optional(),
      organizationId: z.string().optional()
    });

    const payload = schema.parse(req.body || {});
    const data = await LomadeeService.syncCampaigns(payload);
    res.status(201).json({ data });
  })
);

router.post(
  '/admitad/sync',
  asyncHandler(async (req, res) => {
    const schema = z.object({
      merchantQuery: z.string().optional(),
      limit: z.coerce.number().int().positive().max(100).optional()
    });

    const payload = schema.parse(req.body || {});
    const data = await AdmitadService.syncProgrammes(payload);
    res.status(201).json({ data });
  })
);

export default router;
