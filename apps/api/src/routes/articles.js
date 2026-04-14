import express from 'express';
import { asyncHandler } from '../lib/http.js';
import { ArticleService } from '../services/articleService.js';

const router = express.Router();

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const data = await ArticleService.list(req.query);
    res.json({ data });
  })
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const data = await ArticleService.save(req.body);
    res.json({ data });
  })
);

router.get(
  '/slug/:slug',
  asyncHandler(async (req, res) => {
    const article = await ArticleService.getBySlug(req.params.slug);
    if (!article) return res.status(404).json({ error: 'Article not found' });
    res.json({ data: article });
  })
);

router.get(
  '/category/:category',
  asyncHandler(async (req, res) => {
    const data = await ArticleService.listByCategory(req.params.category);
    res.json({ data });
  })
);

router.post(
  '/:id/toggle-publish',
  asyncHandler(async (req, res) => {
    const article = await ArticleService.togglePublish(req.params.id);
    if (!article) return res.status(404).json({ error: 'Article not found' });
    res.json({ data: article });
  })
);

router.get(
  '/:slug',
  asyncHandler(async (req, res) => {
    const article = await ArticleService.getBySlug(req.params.slug);
    if (!article) return res.status(404).json({ error: 'Article not found' });
    res.json({ data: article });
  })
);

export default router;
