import { createEditorialLogger } from './editorialLogger.js';
import { findValidatedBlogImageCandidate } from './blogImage/automationService.js';
import { readImageDimensions } from './blogImage/imageMetadata.js';
import { syncArticleImageToWordpress } from './blogImage/wordpressPublisher.js';
import { validateBlogImage } from './blogImage/validator.js';
import { UsedBlogImageStore, buildPerceptualHash, hashImageBuffer } from './blogImage/usedImageStore.js';

const logger = createEditorialLogger('image-generator');

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
    const perceptualHash = selection.winner.perceptualHash || buildPerceptualHash(buffer);
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
    const perceptualUnique = UsedBlogImageStore.checkPerceptualHash(perceptualHash, usageIndex);
    if (!selection.winner.perceptualHash && !perceptualUnique.unique) {
      await logger.error('stock_image_duplicate_perceptual_hash_rejected', new Error('Image perceptual hash already used'), {
        slug,
        provider: selection.winner.provider,
        sourceUrl: selection.winner.pageUrl || selection.winner.downloadUrl,
        perceptualHash
      });

      return buildDraftImageResult({
        reason: 'Imagem unica obrigatoria nao encontrada.',
        errorMessage: 'Imagem descartada porque e visualmente parecida com outra ja usada.',
        metadata: {
          winnerKey: 'duplicate_perceptual_hash',
          perceptualHash
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

    const sourceUrl = candidate.pageUrl || candidate.downloadUrl;
    const wordpressSync = await syncArticleImageToWordpress({
      slug,
      articleTitle: title,
      imageCandidate: {
        ...candidate,
        validation
      },
      buffer,
      contentType
    });

    const usageRecord = await UsedBlogImageStore.record({
      candidate,
      hash,
      perceptualHash,
      keywords: selection.keywords,
      postId: null,
      articleTitle: title,
      visualSignature: selection.winner.uniqueness?.visualSignature || ''
    });

    await logger.info('stock_image_selected_for_editorial_article', {
      slug,
      provider: candidate.provider,
      sourceUrl,
      hash,
      publicPath: wordpressSync.imageUrl,
      usedImageRecordId: usageRecord.id,
      validation
    });

    return {
      provider: candidate.provider,
      prompt: candidate.query,
      publicPath: wordpressSync.imageUrl,
      absolutePath: null,
      fileSizeBytes: buffer.length,
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
        publicPath: wordpressSync.imageUrl,
        absolutePath: null,
        width: candidate.width,
        height: candidate.height,
        fileSizeBytes: buffer.length,
        sourceUrl
      }],
      scores: [{
        key: candidate.provider,
        total: candidate.score || 100,
        breakdown: candidate.breakdown || {},
        publicPath: wordpressSync.imageUrl,
        validation
      }],
      sourceType: 'licensed-stock-photo',
      usedImageRecordId: usageRecord.id,
      attribution: candidate.provider === 'freepik'
        ? {
            provider: 'freepik',
            label: 'Imagem: Freepik',
            sourceName: 'Freepik',
            url: 'https://www.freepik.com',
          sourceUrl,
          hash,
          perceptualHash,
          wordpress: wordpressSync.imageAttribution
        }
        : {
            provider: candidate.provider,
            sourceName: candidate.provider,
            sourceUrl,
            hash,
            perceptualHash,
            wordpress: wordpressSync.imageAttribution
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
