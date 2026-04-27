import express from 'express';
import { asyncHandler } from '../lib/http.js';
import { ArticleCronAutomationService } from '../services/articleCronAutomationService.js';

const router = express.Router();

const resolveBearerToken = (req) => {
  const header = req.get('authorization') || '';
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || '';
};

const requireCronSecret = (req, res, next) => {
  const expected = process.env.CRON_SECRET;
  const received = resolveBearerToken(req) || req.query.secret || '';

  if (expected && received === expected) return next();

  return res.status(401).json({
    ok: false,
    error: 'Unauthorized cron request'
  });
};

const parseLimit = (value, fallback = 1, max = 3) => {
  const parsed = Number(value || fallback);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.min(max, Math.floor(parsed));
};

router.use(requireCronSecret);

router.get(
  '/diagnostics',
  asyncHandler(async (_req, res) => {
    res.json(await ArticleCronAutomationService.diagnostics());
  })
);

router.get(
  '/run',
  asyncHandler(async (req, res) => {
    const result = await ArticleCronAutomationService.runDue({
      triggerSource: req.get('user-agent')?.includes('vercel-cron')
        ? 'vercel-cron-articles'
        : (req.query.trigger || 'cron-articles')
    });
    res.status(result.status === 'failed' ? 500 : 200).json(result);
  })
);

router.post(
  '/run-now',
  asyncHandler(async (req, res) => {
    const result = await ArticleCronAutomationService.runNow({
      triggerSource: req.body?.trigger || req.query.trigger || 'manual-run-now',
      limit: parseLimit(req.body?.limit || req.query.limit, 1, 3),
      force: true
    });
    res.status(result.status === 'failed' ? 500 : 200).json(result);
  })
);

export default router;
