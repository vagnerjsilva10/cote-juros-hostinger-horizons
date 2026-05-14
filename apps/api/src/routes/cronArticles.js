import express from 'express';
import { asyncHandler } from '../lib/http.js';
import { ArticleCronAutomationService } from '../services/articleCronAutomationService.js';
import { AutonomousEditorialPublishingService } from '../services/autonomousEditorialPublishingService.js';
import { WebStoryOperationsService } from '../services/webStoryOperationsService.js';

const router = express.Router();

const resolveBearerToken = (req) => {
  const header = req.get('authorization') || '';
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || '';
};

const requireCronSecret = (req, res, next) => {
  const allowedTokens = [
    process.env.CRON_SECRET,
    process.env.COTE_API_TOKEN
  ].filter(Boolean);
  const received = resolveBearerToken(req) || req.query.secret || '';

  if (allowedTokens.length && allowedTokens.includes(received)) return next();

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
    if (process.env.AUTO_PUBLISH_MODE === 'autonomous_premium') {
      const result = await AutonomousEditorialPublishingService.runDaily({
        dryRun: false,
        useLiveDiscovery: req.query.liveDiscovery === 'true',
      });

      console.log(JSON.stringify({
        event: 'autonomous_editorial_cron_finished',
        triggerSource: req.get('user-agent')?.includes('vercel-cron')
          ? 'vercel-cron-autonomous-editorial'
          : (req.query.trigger || 'cron-autonomous-editorial'),
        status: result.status,
        autonomousReal: result.autonomousReal,
        dailyLimit: result.dailyLimit,
        publishedToday: result.publishedToday,
        actions: (result.actions || []).map((action) => ({
          keyword: action.keyword,
          type: action.type,
          status: action.status,
          slug: action.slug,
          targetSlug: action.targetSlug,
          blockers: action.blockers || [],
        })),
      }));

      return res.status(result.ok === false ? 503 : 200).json(result);
    }

    const result = await ArticleCronAutomationService.runDue({
      triggerSource: req.get('user-agent')?.includes('vercel-cron')
        ? 'vercel-cron-articles'
        : (req.query.trigger || 'cron-articles')
    });
    res.status(result.status === 'failed' ? 500 : 200).json(result);
  })
);

router.get(
  '/web-stories/run',
  asyncHandler(async (req, res) => {
    const result = await WebStoryOperationsService.runSelectiveProduction({
      dryRun: req.query.dryRun === 'true',
      firstRun: false,
      limit: parseLimit(req.query.limit, process.env.WEB_STORY_DAILY_LIMIT || 3, 3),
      includeRecent: parseLimit(req.query.includeRecent, 180, 250),
      slug: req.query.slug || '',
      force: req.query.force === 'true'
    });

    console.log(JSON.stringify({
      event: 'selective_web_story_cron_finished',
      triggerSource: req.get('user-agent')?.includes('vercel-cron')
        ? 'vercel-cron-web-stories'
        : (req.query.trigger || 'cron-web-stories'),
      status: result.status,
      storyPublished: result.story_published,
      storyIndexed: result.story_indexed,
      dailyLimit: result.safety?.dailyLimit,
      publishedToday: result.safety?.publishedToday,
      published: (result.published || []).map((item) => ({
        slug: item.slug,
        storyUrl: item.storyUrl || item.url,
        type: item.type,
        cluster: item.cluster,
        scores: item.scores,
      })),
      blocked: (result.blocked || []).map((item) => ({
        slug: item.slug,
        status: item.status,
        blockers: item.blockers || [],
      })),
    }));

    res.status(result.ok === false ? 503 : 200).json(result);
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
