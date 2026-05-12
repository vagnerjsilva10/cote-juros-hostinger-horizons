import express from 'express';
import { asyncHandler } from '../lib/http.js';
import { ArticleSeoHtmlService } from '../services/articleSeoHtmlService.js';

const router = express.Router();

router.get(
  '/blog/:slug',
  asyncHandler(async (req, res) => {
    const html = await ArticleSeoHtmlService.render(req.params.slug);
    if (!html) {
      return res.status(404).type('html').send('<!doctype html><html lang="pt-BR"><body><h1>Artigo não encontrado</h1></body></html>');
    }

    res.setHeader('Cache-Control', 'public, s-maxage=900, stale-while-revalidate=86400');
    return res.type('html').send(html);
  })
);

export default router;
