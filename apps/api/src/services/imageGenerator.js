import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { BLOG_IMAGE_DIR } from './editorialConfig.js';
import { createEditorialLogger } from './editorialLogger.js';
import { findValidatedBlogImageCandidate } from './blogImage/automationService.js';
import { readImageDimensions } from './blogImage/imageMetadata.js';
import { validateBlogImage } from './blogImage/validator.js';
import { UsedBlogImageStore, hashImageBuffer } from './blogImage/usedImageStore.js';

const logger = createEditorialLogger('image-generator');

const toSlug = (value = '') =>
  String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

const extractMimeExtension = (contentType = '') => {
  if (contentType.includes('png')) return 'png';
  if (contentType.includes('webp')) return 'webp';
  if (contentType.includes('jpeg') || contentType.includes('jpg')) return 'jpg';
  return 'jpg';
};

const downloadStockImageBuffer = async (url) => {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; CoteJurosBot/1.0; +https://www.cotejuros.com.br)'
    }
  });

  if (!response.ok) {
    throw new Error(`Stock image download failed (${response.status})`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return {
    buffer: Buffer.from(arrayBuffer),
    contentType: response.headers.get('content-type') || 'image/jpeg'
  };
};

const buildDraftImageResult = ({ reason, errorMessage = '', metadata = {} }) => ({
  provider: 'fallback',
  prompt: '',
  publicPath: '',
  absolutePath: null,
  fileSizeBytes: 0,
  width: 0,
  height: 0,
  isFallback: true,
  validationPassed: false,
  errorMessage: errorMessage || reason,
  winnerKey: 'none',
  winnerScore: 0,
  winnerReason: reason,
  variants: [],
  scores: [],
  ...metadata
});

const buildArticleForImageSearch = ({ title, topic, cluster }) => ({
  title,
  excerpt: topic,
  structured: {
    category: cluster,
    clusterLabel: cluster,
    tags: [topic, cluster].filter(Boolean)
  },
  category: { name: cluster },
  cluster: { name: cluster }
});

const writeWinnerImage = async ({ slug, buffer, contentType }) => {
  const safeSlug = toSlug(slug || `blog-${Date.now()}`) || `blog-${Date.now()}`;
  const finalDir = fileURLToPath(BLOG_IMAGE_DIR);
  await fs.mkdir(finalDir, { recursive: true });

  const extension = extractMimeExtension(contentType);
  const absolutePath = path.join(finalDir, `${safeSlug}.${extension}`);
  await fs.writeFile(absolutePath, buffer);
  const stats = await fs.stat(absolutePath);

  return {
    safeSlug,
    absolutePath,
    publicPath: `/images/blog/${safeSlug}.${extension}`,
    fileSizeBytes: stats.size
  };
};

export const generateBlogImage = async ({ title, topic, slug, cluster }) => {
  const article = buildArticleForImageSearch({ title, topic, cluster });
  const selection = await findValidatedBlogImageCandidate(article);

  if (!selection.winner) {
    await logger.error('stock_image_required_but_not_found', new Error('No validated stock image candidate found'), {
      slug,
      title,
      topic,
      cluster,
      keywords: selection.keywords,
      intent: selection.intent,
      rejected: selection.rejected
    });

    return buildDraftImageResult({
      reason: 'Imagem real obrigatoria nao encontrada.',
      errorMessage: 'Nenhuma foto real contextual e licenciada foi encontrada. Artigo deve permanecer em rascunho.',
      metadata: {
        rejected: selection.rejected,
        keywords: selection.keywords,
        intent: selection.intent
      }
    });
  }

  try {
    const downloaded = selection.winner.buffer
      ? { buffer: selection.winner.buffer, contentType: selection.winner.contentType || 'image/jpeg' }
      : await downloadStockImageBuffer(selection.winner.downloadUrl);
    const { buffer, contentType } = downloaded;
    const hash = selection.winner.hash || hashImageBuffer(buffer);
    const usageIndex = await UsedBlogImageStore.buildUsageIndex();
    const hashUnique = UsedBlogImageStore.checkHash(hash, usageIndex);
    if (!selection.winner.hash && !hashUnique.unique) {
      await logger.error('stock_image_duplicate_hash_rejected', new Error('Image hash already used'), {
        slug,
        provider: selection.winner.provider,
        sourceUrl: selection.winner.pageUrl || selection.winner.downloadUrl,
        hash
      });

      return buildDraftImageResult({
        reason: 'Imagem unica obrigatoria nao encontrada.',
        errorMessage: 'Imagem descartada porque o hash ja foi usado em outro artigo.',
        metadata: {
          winnerKey: 'duplicate_hash',
          hash
        }
      });
    }
    const dimensions = readImageDimensions(buffer);
    const candidate = {
      ...selection.winner,
      width: dimensions?.width || selection.winner.width,
      height: dimensions?.height || selection.winner.height
    };
    const validation = validateBlogImage(candidate, {
      article: {
        title,
        summary: topic,
        category: cluster,
        clusterLabel: cluster,
        tags: [topic, cluster].filter(Boolean)
      },
      intent: selection.intent
    });

    if (!validation.passed) {
      await logger.error('stock_image_download_validation_failed', new Error(validation.errors.join(', ')), {
        slug,
        provider: candidate.provider,
        pageUrl: candidate.pageUrl,
        dimensions,
        validation
      });

      return buildDraftImageResult({
        reason: 'Imagem real obrigatoria falhou na validacao final.',
        errorMessage: `Imagem rejeitada apos download: ${validation.errors.join(', ')}`,
        metadata: {
          width: candidate.width || 0,
          height: candidate.height || 0,
          winnerKey: 'rejected',
          winnerScore: candidate.score || 0
        }
      });
    }

    const published = await writeWinnerImage({ slug, buffer, contentType });
    const sourceUrl = candidate.pageUrl || candidate.downloadUrl;
    await UsedBlogImageStore.record({
      candidate,
      hash,
      keywords: selection.keywords,
      postId: slug || candidate.pageUrl,
      visualSignature: selection.winner.uniqueness?.visualSignature || ''
    });

    await logger.info('stock_image_selected_for_editorial_article', {
      slug,
      provider: candidate.provider,
      sourceUrl,
      hash,
      publicPath: published.publicPath,
      validation
    });

    return {
      provider: candidate.provider,
      prompt: candidate.query,
      publicPath: published.publicPath,
      absolutePath: published.absolutePath,
      fileSizeBytes: published.fileSizeBytes,
      width: candidate.width,
      height: candidate.height,
      isFallback: false,
      validationPassed: true,
      winnerKey: candidate.provider,
      winnerScore: candidate.score || 100,
      winnerReason: 'Foto real contextual, licenciada e validada antes da publicacao.',
      variants: [{
        key: candidate.provider,
        label: 'foto real contextual',
        intent: selection.intent,
        prompt: candidate.query,
        provider: candidate.provider,
        publicPath: published.publicPath,
        absolutePath: published.absolutePath,
        width: candidate.width,
        height: candidate.height,
        fileSizeBytes: published.fileSizeBytes,
        sourceUrl
      }],
      scores: [{
        key: candidate.provider,
        total: candidate.score || 100,
        breakdown: candidate.breakdown || {},
        publicPath: published.publicPath,
        validation
      }],
      sourceType: 'licensed-stock-photo',
      attribution: candidate.provider === 'freepik'
        ? {
            provider: 'freepik',
            label: 'Imagem: Freepik',
            sourceName: 'Freepik',
            url: 'https://www.freepik.com',
            sourceUrl,
            hash
          }
        : {
            provider: candidate.provider,
            sourceName: candidate.provider,
            sourceUrl,
            hash
          }
    };
  } catch (error) {
    await logger.error('stock_image_required_download_failed', error, {
      slug,
      provider: selection.winner.provider,
      sourceUrl: selection.winner.pageUrl || selection.winner.downloadUrl
    });

    return buildDraftImageResult({
      reason: 'Download da imagem real falhou. Artigo deve permanecer em rascunho.',
      errorMessage: error?.message || String(error),
      metadata: {
        winnerKey: 'download_failed'
      }
    });
  }
};
