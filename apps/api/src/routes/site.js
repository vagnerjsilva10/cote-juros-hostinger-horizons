import express from 'express';
import { z } from 'zod';
import { asyncHandler } from '../lib/http.js';
import { SiteFoundationService } from '../services/siteFoundationService.js';

const router = express.Router();

const placementQuerySchema = z.object({
  placement: z.string().optional()
});

const seoQuerySchema = z.object({
  path: z.string().default('/')
});

router.get('/settings', asyncHandler(async (_req, res) => {
  res.json({ data: await SiteFoundationService.listPublicSettings() });
}));

router.get('/navigation', asyncHandler(async (_req, res) => {
  res.json({ data: await SiteFoundationService.listPublicNavigation() });
}));

router.get('/disclaimers', asyncHandler(async (req, res) => {
  const query = placementQuerySchema.parse(req.query || {});
  res.json({ data: await SiteFoundationService.listPublicDisclaimers(query) });
}));

router.get('/seo', asyncHandler(async (req, res) => {
  const query = seoQuerySchema.parse(req.query || {});
  res.json({ data: await SiteFoundationService.getPublicSeoMeta(query.path) });
}));

export default router;
