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

export default router;
