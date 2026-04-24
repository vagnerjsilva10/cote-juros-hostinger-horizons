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
import { UsedBlogImageStore, hashImageBuffer } from './usedImageStore.js';

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
  const stages = [
    { providerStage: 'freepik', candidates: await searchFreepikImages({ keywords, perKeyword: 3 }) },
    { providerStage: 'pexels', candidates: await searchPexelsImages({ keywords, perKeyword: 3 }) },
    { providerStage: 'unsplash', candidates: await searchUnsplashImages({ keywords, perKeyword: 3 }) }
  ];

  return stages.map((stage) => ({
    ...stage,
    candidates: Array.from(new Map(
      stage.candidates
        .filter((item) => item?.pageUrl || item?.downloadUrl)
        .map((item) => [item.pageUrl || item.downloadUrl, item])
    ).values())
  }));
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

  const providerStages = await searchCandidatesByPriority({ keywords });
  const articleContext = getArticleImageContext(article);
  const usageIndex = await UsedBlogImageStore.buildUsageIndex({ excludePostId: article.id || null });

  const allRanked = [];

  const rejected = [];
  for (const stage of providerStages) {
    const ranked = rankBlogImageCandidates({
      article: articleContext,
      candidates: stage.candidates
    });
    allRanked.push(...ranked);

    for (const candidate of ranked) {
      const candidateUnique = UsedBlogImageStore.checkCandidate({ candidate, usageIndex });
      if (!candidateUnique.unique) {
        rejected.push({
          provider: candidate.provider,
          query: candidate.query,
          pageUrl: candidate.pageUrl,
          reason: candidateUnique.reason,
          matchedUrl: candidateUnique.matchedUrl || '',
          visualSignature: candidateUnique.visualSignature || ''
        });
        continue;
      }

      const validation = validateBlogImage(candidate, {
        article: articleContext,
        intent
      });

      if (!validation.passed) {
        rejected.push({
          provider: candidate.provider,
          query: candidate.query,
          pageUrl: candidate.pageUrl,
          reason: 'quality_validation_failed',
          errors: validation.errors
        });
        continue;
      }

      try {
        const { buffer, contentType } = await downloadImageBuffer(candidate.downloadUrl);
        const hash = hashImageBuffer(buffer);
        const hashUnique = UsedBlogImageStore.checkHash(hash, usageIndex);
        if (!hashUnique.unique) {
          rejected.push({
            provider: candidate.provider,
            query: candidate.query,
            pageUrl: candidate.pageUrl,
            reason: hashUnique.reason,
            hash
          });
          continue;
        }

        const dimensions = readImageDimensions(buffer);
        const candidateWithDimensions = {
          ...candidate,
          width: dimensions?.width || candidate.width,
          height: dimensions?.height || candidate.height
        };
        const finalValidation = validateBlogImage(candidateWithDimensions, {
          article: articleContext,
          intent
        });

        if (!finalValidation.passed) {
          rejected.push({
            provider: candidate.provider,
            query: candidate.query,
            pageUrl: candidate.pageUrl,
            reason: 'downloaded_quality_validation_failed',
            errors: finalValidation.errors,
            dimensions
          });
          continue;
        }

        return {
          keywords,
          intent,
          providerStage: stage.providerStage,
          candidates: allRanked,
          rejected,
          winner: {
            ...candidateWithDimensions,
            validation: finalValidation,
            uniqueness: candidateUnique,
            hash,
            buffer,
            contentType
          }
        };
      } catch (error) {
        rejected.push({
          provider: candidate.provider,
          query: candidate.query,
          pageUrl: candidate.pageUrl,
          reason: 'download_failed',
          error: error?.message || String(error)
        });
      }
    }
  }

  return {
    keywords,
    intent,
    providerStage: providerStages.find((stage) => stage.candidates.length)?.providerStage || 'none',
    candidates: allRanked,
    rejected,
    winner: null
  };
};

const updateLocalArticle = async ({ article, wordpressSync, selectedImage, keywords }) => {
  const prisma = getPrisma();
  const structured = parseStructuredContent(article);
  const syncedAt = new Date().toISOString();
  const nextStructured = {
    ...structured,
    coverImage: wordpressSync.imageUrl,
    ogImage: wordpressSync.imageUrl,
    imageAttribution: wordpressSync.imageAttribution,
    blogImageAutomation: {
      provider: selectedImage.provider,
      searchKeyword: selectedImage.query,
      sourceUrl: selectedImage.pageUrl || selectedImage.downloadUrl,
      downloadUrl: selectedImage.downloadUrl,
      hash: selectedImage.hash,
      visualSignature: selectedImage.uniqueness?.visualSignature || '',
      selectedAt: syncedAt,
      syncedAt,
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

const markArticleDraftOnImageFailure = async ({ article, reason, details = {} }) => {
  if (!article?.id) return null;
  const prisma = getPrisma();
  const structured = parseStructuredContent(article);
  return prisma.article.update({
    where: { id: article.id },
    data: {
      status: 'draft',
      structuredContent: {
        ...structured,
        blogImageAutomation: {
          ...(structured.blogImageAutomation || {}),
          blockedAt: new Date().toISOString(),
          blockedReason: reason,
          blockedDetails: details
        }
      }
    }
  });
};

export class BlogImageAutomationService {
  static async processArticleImage(article, { trigger = 'manual' } = {}) {
    if (!article) return { processed: false, reason: 'article_not_found' };

    const selection = await findValidatedBlogImageCandidate(article);
    if (!selection.winner) {
      await logger.error('no_unique_image_found', new Error('no unique image found'), {
        slug: article.slug,
        keywords: selection.keywords,
        intent: selection.intent,
        rejected: selection.rejected
      });
      await markArticleDraftOnImageFailure({
        article,
        reason: 'no unique image found',
        details: {
          keywords: selection.keywords,
          rejected: selection.rejected
        }
      });
      return {
        processed: false,
        reason: 'no_unique_image_found',
        slug: article.slug,
        rejected: selection.rejected,
        keywords: selection.keywords
      };
    }

    const { buffer, contentType } = selection.winner;
    const dimensions = { width: selection.winner.width, height: selection.winner.height };
    const winnerWithDimensions = {
      ...selection.winner,
      buffer: undefined,
      contentType: undefined
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
      await markArticleDraftOnImageFailure({
        article,
        reason: 'downloaded candidate rejected',
        details: {
          provider: selection.winner.provider,
          pageUrl: selection.winner.pageUrl,
          errors: finalValidation.errors
        }
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

    const usageRecord = await UsedBlogImageStore.record({
      candidate: winnerWithDimensions,
      hash: selection.winner.hash,
      keywords: selection.keywords,
      postId: article.id,
      visualSignature: selection.winner.uniqueness?.visualSignature || ''
    });

    await logger.info('blog_image_article_processed', {
      slug: article.slug,
      trigger,
      provider: selection.winner.provider,
      keyword: selection.winner.query,
      imageUrl: selection.winner.pageUrl || selection.winner.downloadUrl,
      featuredImageUrl: wordpressSync.imageUrl,
      source: selection.winner.provider,
      hash: selection.winner.hash,
      usedImageRecordId: usageRecord.id,
      discarded: selection.rejected,
      validation: finalValidation
    });

    return {
      processed: true,
      slug: article.slug,
      keyword: selection.winner.query,
      imageUrl: selection.winner.pageUrl || selection.winner.downloadUrl,
      featuredImageUrl: wordpressSync.imageUrl,
      provider: selection.winner.provider,
      score: selection.winner.score,
      hash: selection.winner.hash
    };
  }

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

    return this.processArticleImage(article, { trigger });
  }
}
