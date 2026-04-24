import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getPrisma } from '../lib/prisma.js';
import {
  BLOG_CLUSTER_FALLBACKS,
  BLOG_IMAGE_DIR,
  BLOG_IMAGE_VARIANTS_DIR,
  EDITORIAL_FALLBACK_IMAGE_PATH,
  EDITORIAL_TMP_DIR,
  WEB_PUBLIC_DIR
} from './editorialConfig.js';
import { createEditorialLogger } from './editorialLogger.js';
import { getCuratedBlogImageCandidates } from './imageLibrary.js';
import { selectBestBlogImage } from './imageSelector.js';

const logger = createEditorialLogger('image-generator');
const OPENAI_IMAGE_MODEL = process.env.OPENAI_IMAGE_MODEL || 'gpt-image-1';
const OPENAI_IMAGE_ENDPOINT = 'https://api.openai.com/v1/images/generations';
const GEMINI_IMAGE_MODELS = Array.from(new Set([
  process.env.GEMINI_IMAGE_MODEL || 'gemini-2.5-flash-image',
  'gemini-3.1-flash-image-preview'
].filter(Boolean)));

const toSlug = (value = '') =>
  String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

const normalize = (value = '') =>
  String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const GENERATION_VARIANTS = Object.freeze([
  {
    key: 'a',
    label: 'pessoa/contexto humano',
    intent: 'human',
    builder: ({ topic, title, clusterLabel, visualSeed }) => ([
      'Create a premium fintech editorial cover image for a Brazilian finance article.',
      `Article title: ${title}.`,
      `Topic: ${topic}.`,
      `Cluster context: ${clusterLabel}.`,
      `Visual seed: ${visualSeed}.`,
      'Scene type: Brazilian person or couple in a realistic credit or financial decision moment.',
      'Show credible human emotion, clean wardrobe, subtle smartphone banking cues, contract, calculator or card depending on the topic.',
      'Bright soft background, premium editorial photography, soft lighting, modern composition, high detail.',
      'Fintech palette with subtle purple accents, no logo, no text, no watermark, no distorted hands, no distorted face.'
    ].join(' '))
  },
  {
    key: 'b',
    label: 'imagem conceitual financeira',
    intent: 'conceptual',
    builder: ({ topic, title, clusterLabel, visualSeed }) => ([
      'Create a premium conceptual finance illustration with realistic editorial style for a Brazilian credit portal.',
      `Article title: ${title}.`,
      `Topic: ${topic}.`,
      `Cluster context: ${clusterLabel}.`,
      `Visual seed: ${visualSeed}.`,
      'Focus on financial symbols such as charts, contracts, calculator, money flow, approval analysis or installment planning depending on the topic.',
      'Clean composition, high contrast focal point, uncluttered background, soft white and silver surfaces, subtle purple UI touches.',
      'Modern fintech art direction, premium and serious, no logo, no text, no watermark, no cartoon style.'
    ].join(' '))
  },
  {
    key: 'c',
    label: 'mockup fintech/editorial',
    intent: 'editorial',
    builder: ({ topic, title, clusterLabel, visualSeed }) => ([
      'Create a premium fintech editorial mockup cover for a Brazilian personal finance article.',
      `Article title: ${title}.`,
      `Topic: ${topic}.`,
      `Cluster context: ${clusterLabel}.`,
      `Visual seed: ${visualSeed}.`,
      'Use a clean desk or app mockup scene with smartphone interface, card or financing document, depending on the topic.',
      'Editorial magazine quality, premium product visual language, minimal composition, bright background, subtle purple interface accents.',
      'High detail, highly readable thumbnail silhouette, no logo, no text, no watermark, no strange hands or faces.'
    ].join(' '))
  }
]);

const RETRY_VARIANTS = Object.freeze([
  {
    key: 'd',
    label: 'close-up humano premium',
    intent: 'human',
    builder: ({ topic, title, clusterLabel, visualSeed }) => ([
      'Create a premium close-up editorial cover image for a Brazilian finance portal.',
      `Article title: ${title}.`,
      `Topic: ${topic}.`,
      `Cluster context: ${clusterLabel}.`,
      `Visual seed: ${visualSeed}.`,
      'Use a single Brazilian adult in a realistic planning moment, with smartphone, contract or payment card only if contextually relevant.',
      'Focus on face clarity, hands that look natural, clean background, soft depth of field and premium fintech mood.',
      'No text, no logo, no watermark, no exaggerated expressions.'
    ].join(' '))
  },
  {
    key: 'e',
    label: 'editorial dashboard limpo',
    intent: 'editorial',
    builder: ({ topic, title, clusterLabel, visualSeed }) => ([
      'Create a premium editorial fintech dashboard scene for a Brazilian credit article.',
      `Article title: ${title}.`,
      `Topic: ${topic}.`,
      `Cluster context: ${clusterLabel}.`,
      `Visual seed: ${visualSeed}.`,
      'Use a refined composition with mobile banking UI, document snippets, calculator or financing context, with clean white surfaces and subtle purple elements.',
      'Designed for click-through as article cover and thumbnail, premium, realistic, uncluttered.',
      'No text, no logo, no watermark, no cartoon look.'
    ].join(' '))
  }
]);

const getAvailableProviders = () => {
  const providers = [];
  if (process.env.OPENAI_API_KEY) providers.push('openai');
  if (process.env.GEMINI_API_KEY) providers.push('gemini');
  return providers;
};

const parseFileSize = async (filePath) => {
  const stats = await fs.stat(filePath);
  return stats.size;
};

const resolvePublicAbsolutePath = (publicPath) => {
  const publicRoot = fileURLToPath(WEB_PUBLIC_DIR);
  return path.join(publicRoot, publicPath.replace(/^\//, ''));
};

const ensureRuntimeDirectories = async (slug) => {
  const safeSlug = toSlug(slug || `blog-${Date.now()}`) || `blog-${Date.now()}`;
  const tmpRoot = fileURLToPath(EDITORIAL_TMP_DIR);
  const tmpDir = path.join(tmpRoot, safeSlug);
  const variantsDir = fileURLToPath(BLOG_IMAGE_VARIANTS_DIR);
  const finalDir = fileURLToPath(BLOG_IMAGE_DIR);

  await fs.mkdir(tmpDir, { recursive: true });
  await fs.mkdir(variantsDir, { recursive: true });
  await fs.mkdir(finalDir, { recursive: true });

  return {
    safeSlug,
    tmpDir,
    variantsDir,
    finalDir
  };
};

const inferClusterKey = ({ cluster, topic, title }) => {
  const haystack = normalize(`${cluster} ${topic} ${title}`);
  if (/cart|credito|limite|anuidade/.test(haystack)) return 'cartoes';
  if (/financi|veiculo|imovel|entrada/.test(haystack)) return 'financiamentos';
  if (/score|cpf|serasa|spc/.test(haystack)) return 'score';
  if (/educ|reserva|orcamento|planejamento/.test(haystack)) return 'educacao';
  return 'emprestimos';
};

const resolveClusterFallbackPath = ({ cluster, topic, title }) => BLOG_CLUSTER_FALLBACKS[inferClusterKey({ cluster, topic, title })] || EDITORIAL_FALLBACK_IMAGE_PATH;

const buildRecentUsagePenalty = ({ usageCount = 0, mostRecentIndex = null }) => {
  if (!usageCount) return 0;

  let penalty = 0;
  if (mostRecentIndex !== null && mostRecentIndex <= 2) penalty += 24;
  else if (mostRecentIndex !== null && mostRecentIndex <= 5) penalty += 16;
  else if (mostRecentIndex !== null && mostRecentIndex <= 11) penalty += 8;

  penalty += Math.min(6, Math.max(0, usageCount - 1) * 3);
  return penalty;
};

const getRecentCoverImageUsage = async ({ cluster, topic, title, slug }) => {
  try {
    const prisma = getPrisma();
    const targetCluster = inferClusterKey({ cluster, topic, title });
    const recentArticles = await prisma.article.findMany({
      where: {
        status: 'published',
        slug: { not: slug },
        NOT: [{ coverImage: null }, { coverImage: '' }]
      },
      select: {
        slug: true,
        title: true,
        coverImage: true,
        cluster: {
          select: {
            name: true
          }
        }
      },
      orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
      take: 48
    });

    const usageMap = new Map();
    recentArticles
      .filter((item) => inferClusterKey({
        cluster: item.cluster?.name || '',
        topic: '',
        title: item.title || ''
      }) === targetCluster)
      .forEach((item, index) => {
        if (!item.coverImage) return;
        const current = usageMap.get(item.coverImage) || { count: 0, mostRecentIndex: index };
        current.count += 1;
        current.mostRecentIndex = Math.min(current.mostRecentIndex, index);
        usageMap.set(item.coverImage, current);
      });

    return usageMap;
  } catch (error) {
    await logger.warn('image_recent_usage_lookup_failed', {
      slug,
      error: error?.message || String(error)
    });
    return new Map();
  }
};

const ensureFallbackSource = async ({ cluster, topic, title }) => {
  const preferredPublicPath = resolveClusterFallbackPath({ cluster, topic, title });
  const preferredAbsolutePath = resolvePublicAbsolutePath(preferredPublicPath);

  try {
    await fs.access(preferredAbsolutePath);
    return {
      publicPath: preferredPublicPath,
      absolutePath: preferredAbsolutePath
    };
  } catch {
    const genericAbsolutePath = resolvePublicAbsolutePath(EDITORIAL_FALLBACK_IMAGE_PATH);
    return {
      publicPath: EDITORIAL_FALLBACK_IMAGE_PATH,
      absolutePath: genericAbsolutePath
    };
  }
};

const buildPromptSet = ({ title, topic, slug, cluster, retry = false }) => {
  const visualSeed = toSlug(slug || title || topic || cluster || 'cote-juros');
  const clusterLabel = cluster || topic || title;
  const source = retry ? RETRY_VARIANTS : GENERATION_VARIANTS;

  return source.map((variant) => ({
    key: variant.key,
    label: variant.label,
    intent: variant.intent,
    prompt: variant.builder({
      title,
      topic,
      slug,
      clusterLabel,
      visualSeed
    })
  }));
};

const extractOpenAiBuffer = async (payload) => {
  const item = payload?.data?.[0];
  if (!item) throw new Error('OpenAI image response did not return image data');

  if (item.b64_json) {
    return Buffer.from(item.b64_json, 'base64');
  }

  if (item.url) {
    const response = await fetch(item.url);
    if (!response.ok) throw new Error(`OpenAI image download failed with status ${response.status}`);
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  throw new Error('OpenAI image response did not include b64_json or url');
};

const extractGeminiBuffer = (payload) => {
  const inlineData =
    payload?.candidates?.[0]?.content?.parts?.find((part) => part?.inlineData?.data)?.inlineData?.data
    || payload?.predictions?.[0]?.bytesBase64Encoded
    || payload?.predictions?.[0]?.image?.bytesBase64Encoded
    || payload?.generatedImages?.[0]?.image?.imageBytes
    || payload?.images?.[0]?.bytesBase64Encoded;

  if (!inlineData) {
    throw new Error('Gemini image response did not include base64 image data');
  }

  return Buffer.from(inlineData, 'base64');
};

const generateWithOpenAi = async (prompt) => {
  const response = await fetch(OPENAI_IMAGE_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: OPENAI_IMAGE_MODEL,
      prompt,
      size: '1024x1024'
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI image generation failed (${response.status}): ${errorText}`);
  }

  const payload = await response.json();
  return extractOpenAiBuffer(payload);
};

const generateWithGemini = async (prompt) => {
  let lastError = null;

  for (const model of GEMINI_IMAGE_MODELS) {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
    const response = await fetch(`${endpoint}?key=${encodeURIComponent(process.env.GEMINI_API_KEY)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }]
          }
        ],
        generationConfig: {
          temperature: 0.9,
          responseModalities: ['TEXT', 'IMAGE']
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      lastError = new Error(`Gemini image generation failed for ${model} (${response.status}): ${errorText}`);
      continue;
    }

    const payload = await response.json();
    try {
      return extractGeminiBuffer(payload);
    } catch (error) {
      lastError = new Error(`Gemini image parsing failed for ${model}: ${error?.message || String(error)}`);
    }
  }

  throw lastError || new Error('Gemini image generation failed for all configured models');
};

const generateVariantBuffer = async ({ prompt, slug, variantKey }) => {
  const providers = getAvailableProviders();
  if (!providers.length) {
    throw new Error('Missing OPENAI_API_KEY or GEMINI_API_KEY for image generation');
  }

  let lastError = null;
  for (const provider of providers) {
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      try {
        const buffer = provider === 'openai'
          ? await generateWithOpenAi(prompt)
          : await generateWithGemini(prompt);

        if (!buffer?.length) {
          throw new Error('Generated image buffer is empty');
        }

        return { buffer, provider };
      } catch (error) {
        lastError = error;
        await logger.warn('image_variant_retry', {
          slug,
          variantKey,
          provider,
          attempt,
          error: error?.message || String(error)
        });
        if (attempt < 3) {
          await sleep(attempt * 1200);
        }
      }
    }
  }

  throw lastError || new Error(`Failed to generate image variant ${variantKey}`);
};

const writeVariantImage = async ({ tmpDir, safeSlug, variantKey, buffer }) => {
  const absolutePath = path.join(tmpDir, `${safeSlug}-${variantKey}.png`);
  await fs.writeFile(absolutePath, buffer);
  return absolutePath;
};

const publishVariantBackup = async ({ variantsDir, safeSlug, variantKey, sourceAbsolutePath }) => {
  const absolutePath = path.join(variantsDir, `${safeSlug}-${variantKey}.png`);
  await fs.copyFile(sourceAbsolutePath, absolutePath);
  return {
    absolutePath,
    publicPath: `/images/blog/variants/${safeSlug}-${variantKey}.png`
  };
};

const publishWinnerImage = async ({ finalDir, safeSlug, sourceAbsolutePath }) => {
  const absolutePath = path.join(finalDir, `${safeSlug}.png`);
  await fs.copyFile(sourceAbsolutePath, absolutePath);
  return {
    absolutePath,
    publicPath: `/images/blog/${safeSlug}.png`
  };
};

const createVariantResult = async ({ promptSpec, runtimeDirs, buffer, provider }) => {
  const absolutePath = await writeVariantImage({
    tmpDir: runtimeDirs.tmpDir,
    safeSlug: runtimeDirs.safeSlug,
    variantKey: promptSpec.key,
    buffer
  });
  const fileSizeBytes = await parseFileSize(absolutePath);
  const backup = await publishVariantBackup({
    variantsDir: runtimeDirs.variantsDir,
    safeSlug: runtimeDirs.safeSlug,
    variantKey: promptSpec.key,
    sourceAbsolutePath: absolutePath
  });

  return {
    key: promptSpec.key,
    label: promptSpec.label,
    intent: promptSpec.intent,
    prompt: promptSpec.prompt,
    provider,
    absolutePath,
    publicPath: backup.publicPath,
    backupAbsolutePath: backup.absolutePath,
    fileSizeBytes,
    width: 1024,
    height: 1024,
    generated: true
  };
};

const generatePromptVariants = async ({ promptSpecs, runtimeDirs, slug }) => {
  const variants = [];

  for (const promptSpec of promptSpecs) {
    try {
      const { buffer, provider } = await generateVariantBuffer({
        prompt: promptSpec.prompt,
        slug,
        variantKey: promptSpec.key
      });

      variants.push(await createVariantResult({
        promptSpec,
        runtimeDirs,
        buffer,
        provider
      }));
    } catch (error) {
      await logger.error('image_variant_failed', error, {
        slug,
        variantKey: promptSpec.key
      });
    }
  }

  return variants;
};

const buildFallbackSelection = async ({ runtimeDirs, slug, title, topic, cluster, promptSpecs, scores }) => {
  const fallbackSource = await ensureFallbackSource({ cluster, topic, title });
  const winner = await publishWinnerImage({
    finalDir: runtimeDirs.finalDir,
    safeSlug: runtimeDirs.safeSlug,
    sourceAbsolutePath: fallbackSource.absolutePath
  });
  const fileSizeBytes = await parseFileSize(winner.absolutePath);

  return {
    provider: 'fallback',
    prompt: promptSpecs.map((item) => ({ key: item.key, prompt: item.prompt })),
    publicPath: winner.publicPath,
    absolutePath: winner.absolutePath,
    fileSizeBytes,
    width: 1600,
    height: 900,
    isFallback: true,
    validationPassed: true,
    winnerKey: 'fallback',
    winnerScore: 100,
    winnerReason: `Nenhuma variante atingiu score minimo. Foi aplicado o fallback do cluster ${inferClusterKey({ cluster, topic, title })}.`,
    variants: [],
    scores
  };
};

const buildCuratedLibrarySelection = async ({ title, topic, slug, cluster }) => {
  const library = getCuratedBlogImageCandidates({ title, topic, slug, cluster });
  if (!library.variants.length) return null;
  const recentUsage = await getRecentCoverImageUsage({ cluster, topic, title, slug });
  const variants = library.variants.map((variant) => {
    const usage = recentUsage.get(variant.publicPath);
    return {
      ...variant,
      recentUsagePenalty: buildRecentUsagePenalty({
        usageCount: usage?.count || 0,
        mostRecentIndex: usage?.mostRecentIndex ?? null
      }),
      recentUsageCount: usage?.count || 0
    };
  });

  const selection = await selectBestBlogImage({
    articleTitle: title,
    articleTopic: topic,
    articleCluster: cluster || library.cluster,
    variants
  });

  if (!selection.scores.length) return null;

  const winnerVariant = variants.find((item) => item.publicPath === selection.winnerPath) || variants[0];

  await logger.info('image_library_winner_selected', {
    slug,
    cluster: library.cluster,
    winnerPath: winnerVariant.publicPath,
    winnerScore: selection.winnerScore,
    winnerKey: selection.winnerKey
  });

  return {
    provider: 'library',
    prompt: winnerVariant.prompt,
    publicPath: winnerVariant.publicPath,
    absolutePath: null,
    fileSizeBytes: winnerVariant.fileSizeBytes,
    width: winnerVariant.metadata?.width || winnerVariant.width || 1024,
    height: winnerVariant.metadata?.height || winnerVariant.height || 1024,
    isFallback: false,
    validationPassed: true,
    winnerKey: selection.winnerKey,
    winnerScore: selection.winnerScore,
    winnerReason: `${selection.reason} Biblioteca curada usada como fallback semântico.`,
    variants,
    scores: selection.scores,
    sourceType: 'curated-library'
  };
};

export const generateBlogImage = async ({ title, topic, slug, cluster }) => {
  const runtimeDirs = await ensureRuntimeDirectories(slug);
  const promptSpecs = buildPromptSet({ title, topic, slug, cluster, retry: false });
  const initialVariants = await generatePromptVariants({
    promptSpecs,
    runtimeDirs,
    slug
  });

  if (!initialVariants.length) {
    const librarySelection = await buildCuratedLibrarySelection({ title, topic, slug, cluster });
    if (librarySelection) {
      return librarySelection;
    }

    const fallback = await buildFallbackSelection({
      runtimeDirs,
      slug,
      title,
      topic,
      cluster,
      promptSpecs,
      scores: []
    });

    await logger.error('image_generation_total_fallback', new Error('No initial variants were generated'), {
      slug,
      title
    });

    return fallback;
  }

  let allVariants = [...initialVariants];
  let selection = await selectBestBlogImage({
    articleTitle: title,
    articleTopic: topic,
    articleCluster: cluster || topic,
    variants: allVariants
  });

  if (!selection.passedMinimum) {
    const retryPromptSpecs = buildPromptSet({ title, topic, slug, cluster, retry: true });
    const retryVariants = await generatePromptVariants({
      promptSpecs: retryPromptSpecs,
      runtimeDirs,
      slug
    });

    allVariants = [...allVariants, ...retryVariants];

    if (retryVariants.length) {
      selection = await selectBestBlogImage({
        articleTitle: title,
        articleTopic: topic,
        articleCluster: cluster || topic,
        variants: allVariants
      });
    }
  }

  if (!selection.passedMinimum) {
    const librarySelection = await buildCuratedLibrarySelection({ title, topic, slug, cluster });
    if (librarySelection) {
      return librarySelection;
    }

    const fallback = await buildFallbackSelection({
      runtimeDirs,
      slug,
      title,
      topic,
      cluster,
      promptSpecs: [...promptSpecs, ...buildPromptSet({ title, topic, slug, cluster, retry: true })],
      scores: selection.scores
    });

    await logger.warn('image_selection_cluster_fallback', {
      slug,
      winnerScore: selection.winnerScore,
      minimumRequired: 75
    });

    return {
      ...fallback,
      variants: allVariants,
      scores: selection.scores
    };
  }

  const winnerVariant = allVariants.find((item) => item.publicPath === selection.winnerPath || item.absolutePath === selection.winnerAbsolutePath);
  const winnerPublished = await publishWinnerImage({
    finalDir: runtimeDirs.finalDir,
    safeSlug: runtimeDirs.safeSlug,
    sourceAbsolutePath: selection.winnerAbsolutePath
  });
  const fileSizeBytes = await parseFileSize(winnerPublished.absolutePath);

  await logger.info('image_generation_winner_selected', {
    slug,
    winnerKey: selection.winnerKey,
    winnerPath: winnerPublished.publicPath,
    winnerScore: selection.winnerScore,
    reason: selection.reason
  });

  return {
    provider: winnerVariant?.provider || 'unknown',
    prompt: winnerVariant?.prompt || '',
    publicPath: winnerPublished.publicPath,
    absolutePath: winnerPublished.absolutePath,
    fileSizeBytes,
    width: winnerVariant?.width || 1024,
    height: winnerVariant?.height || 1024,
    isFallback: false,
    validationPassed: true,
    winnerKey: selection.winnerKey,
    winnerScore: selection.winnerScore,
    winnerReason: selection.reason,
    variants: allVariants,
    scores: selection.scores
  };
};
