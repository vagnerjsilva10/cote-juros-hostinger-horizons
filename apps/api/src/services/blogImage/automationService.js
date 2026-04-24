import { getPrisma } from '../../lib/prisma.js';
import { createEditorialLogger } from '../editorialLogger.js';
import { extractImageSearchKeywords } from './keywordService.js';
import { rankBlogImageCandidates } from './ranker.js';
import { searchFreepikImages } from './providers/freepikProvider.js';
import { searchPexelsImages } from './providers/pexelsProvider.js';
import { searchUnsplashImages } from './providers/unsplashProvider.js';
import { readImageDimensions } from './imageMetadata.js';
import { isTemplateOrPlaceholderImage, validateBlogImage } from './validator.js';
import { syncArticleImageToWordpress } from './wordpressPublisher.js';

const logger = createEditorialLogger('blog-image-automation');
const MAX_DAILY_IMAGES = Number(process.env.BLOG_IMAGE_MAX_PER_DAY || 3);

const isFallbackImage = (value = '') => isTemplateOrPlaceholderImage(value);

const parseStructuredContent = (article) => {
  if (article?.structuredContent && typeof article.structuredContent === 'object') {
    return article.structuredContent;
  }

  try {
    const parsed = JSON.parse(article?.content || '');
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
};

const getTodayIsoDate = () => new Date().toISOString().slice(0, 10);

const countImagesProcessedToday = async () => {
  const prisma = getPrisma();
  const recent = await prisma.article.findMany({
    where: {
      status: 'published'
    },
    select: {
      structuredContent: true,
      updatedAt: true
    },
    orderBy: { updatedAt: 'desc' },
    take: 60
  });

  const today = getTodayIsoDate();
  return recent.filter((item) => {
    const structured = parseStructuredContent(item);
    const syncedAt = structured?.imageAttribution?.syncedAt || structured?.blogImageAutomation?.syncedAt;
    return typeof syncedAt === 'string' && syncedAt.startsWith(today);
  }).length;
};

const listPendingArticles = async (limit = 1) => {
  const prisma = getPrisma();
  const items = await prisma.article.findMany({
    where: {
      status: 'published'
    },
    include: {
      category: true,
      cluster: true
    },
    orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
    take: 40
  });

  return items
    .map((article) => ({
      ...article,
      structured: parseStructuredContent(article)
    }))
    .filter((article) => {
      const attribution = article.structured?.imageAttribution;
      if (attribution?.provider === 'freepik') return false;
      return isFallbackImage(article.coverImage || article.structured?.coverImage || '');
    })
    .slice(0, limit);
};

const downloadImageBuffer = async (url) => {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; CoteJurosBot/1.0; +https://www.cotejuros.com.br)'
    }
  });

  if (!response.ok) {
    throw new Error(`Image download failed (${response.status})`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return {
    buffer: Buffer.from(arrayBuffer),
    contentType: response.headers.get('content-type') || 'image/jpeg'
  };
};

const getArticleImageContext = (article) => ({
  title: article.title,
  summary: article.excerpt,
  excerpt: article.excerpt,
  category: article.category?.name || article.structured?.category || '',
  clusterLabel: article.cluster?.name || article.structured?.clusterLabel || '',
  tags: article.structured?.tags || []
});

const searchCandidatesByPriority = async ({ keywords }) => {
  const freepik = await searchFreepikImages({ keywords, perKeyword: 4 });
  if (freepik.length) return { candidates: freepik, providerStage: 'freepik' };

  const pexels = await searchPexelsImages({ keywords, perKeyword: 4 });
  if (pexels.length) return { candidates: pexels, providerStage: 'pexels' };

  const unsplash = await searchUnsplashImages({ keywords, perKeyword: 4 });
  return { candidates: unsplash, providerStage: 'unsplash' };
};

export const findValidatedBlogImageCandidate = async (article) => {
  const { keywords, intent } = extractImageSearchKeywords({
    title: article.title,
    h1: article.title,
    summary: article.excerpt,
    excerpt: article.excerpt,
    category: article.category?.name || article.structured?.category || '',
    clusterLabel: article.cluster?.name || article.structured?.clusterLabel || '',
    tags: article.structured?.tags || []
  });

  const { candidates, providerStage } = await searchCandidatesByPriority({ keywords });
  const articleContext = getArticleImageContext(article);

  const ranked = rankBlogImageCandidates({
    article: articleContext,
    candidates
  });

  const rejected = [];
  for (const candidate of ranked) {
    const validation = validateBlogImage(candidate, {
      article: articleContext,
      intent
    });

    if (validation.passed) {
      return {
        keywords,
        intent,
        providerStage,
        candidates: ranked,
        rejected,
        winner: {
          ...candidate,
          validation
        }
      };
    }

    rejected.push({
      provider: candidate.provider,
      query: candidate.query,
      pageUrl: candidate.pageUrl,
      errors: validation.errors
    });
  }

  return {
    keywords,
    intent,
    providerStage,
    candidates: ranked,
    rejected,
    winner: null
  };
};

const updateLocalArticle = async ({ article, wordpressSync, selectedImage, keywords }) => {
  const prisma = getPrisma();
  const structured = parseStructuredContent(article);
  const nextStructured = {
    ...structured,
    coverImage: wordpressSync.imageUrl,
    ogImage: wordpressSync.imageUrl,
    imageAttribution: wordpressSync.imageAttribution,
    blogImageAutomation: {
      provider: selectedImage.provider,
      searchKeyword: selectedImage.query,
      sourceUrl: selectedImage.pageUrl || selectedImage.downloadUrl,
      selectedAt: new Date().toISOString(),
      score: selectedImage.score,
      keywords
    }
  };

  return prisma.article.update({
    where: { id: article.id },
    data: {
      coverImage: wordpressSync.imageUrl,
      ogImage: wordpressSync.imageUrl,
      structuredContent: nextStructured
    }
  });
};

export class BlogImageAutomationService {
  static async processNextArticle({ trigger = 'manual' } = {}) {
    const processedToday = await countImagesProcessedToday();
    if (processedToday >= MAX_DAILY_IMAGES) {
      await logger.info('blog_image_daily_limit_reached', { trigger, processedToday, limit: MAX_DAILY_IMAGES });
      return { processed: false, reason: 'daily_limit_reached' };
    }

    const [article] = await listPendingArticles(1);
    if (!article) {
      await logger.info('blog_image_no_pending_articles');
      return { processed: false, reason: 'no_pending_articles' };
    }

    const selection = await findValidatedBlogImageCandidate(article);
    if (!selection.winner) {
      await logger.warn('blog_image_no_candidate_found', {
        slug: article.slug,
        keywords: selection.keywords,
        intent: selection.intent,
        rejected: selection.rejected
      });
      return { processed: false, reason: 'no_candidate_found', slug: article.slug };
    }

    const { buffer, contentType } = await downloadImageBuffer(selection.winner.downloadUrl);
    const dimensions = readImageDimensions(buffer);
    const winnerWithDimensions = {
      ...selection.winner,
      width: dimensions?.width || selection.winner.width,
      height: dimensions?.height || selection.winner.height
    };
    const finalValidation = validateBlogImage(winnerWithDimensions, {
      article: getArticleImageContext(article),
      intent: selection.intent
    });

    if (!finalValidation.passed) {
      await logger.warn('blog_image_downloaded_candidate_rejected', {
        slug: article.slug,
        provider: selection.winner.provider,
        pageUrl: selection.winner.pageUrl,
        dimensions,
        errors: finalValidation.errors
      });
      return { processed: false, reason: 'downloaded_candidate_rejected', slug: article.slug };
    }

    const wordpressSync = await syncArticleImageToWordpress({
      slug: article.slug,
      articleTitle: article.title,
      imageCandidate: {
        ...winnerWithDimensions,
        validation: finalValidation
      },
      buffer,
      contentType
    });

    await updateLocalArticle({
      article,
      wordpressSync,
      selectedImage: {
        ...winnerWithDimensions,
        validation: finalValidation
      },
      keywords: selection.keywords
    });

    await logger.info('blog_image_article_processed', {
      slug: article.slug,
      provider: selection.winner.provider,
      keyword: selection.winner.query,
      imageUrl: selection.winner.pageUrl || selection.winner.downloadUrl,
      featuredImageUrl: wordpressSync.imageUrl,
      source: selection.winner.provider,
      validation: finalValidation
    });

    return {
      processed: true,
      slug: article.slug,
      keyword: selection.winner.query,
      imageUrl: selection.winner.pageUrl || selection.winner.downloadUrl,
      featuredImageUrl: wordpressSync.imageUrl,
      provider: selection.winner.provider,
      score: selection.winner.score
    };
  }
}
