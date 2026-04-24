import fs from 'node:fs/promises';
import { createEditorialLogger } from './editorialLogger.js';

const logger = createEditorialLogger('image-selector');
const GEMINI_VISION_MODEL = process.env.GEMINI_IMAGE_SELECTOR_MODEL || process.env.GEMINI_EDITORIAL_MODEL || 'gemini-2.5-flash';
const MINIMUM_WINNER_SCORE = 75;

const STOPWORDS = new Set([
  'a', 'o', 'os', 'as', 'de', 'da', 'do', 'das', 'dos', 'e', 'em', 'para', 'por', 'com',
  'sem', 'uma', 'um', 'na', 'no', 'nas', 'nos', 'ao', 'aos', 'ou', 'que', 'como', 'mais',
  'menos', 'antes', 'depois', 'sobre', 'entre', 'vale', 'pena'
]);

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const normalize = (value = '') =>
  String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

const tokenize = (...values) =>
  values
    .flatMap((value) => normalize(value).split(/[^a-z0-9]+/))
    .map((item) => item.trim())
    .filter((item) => item.length >= 3 && !STOPWORDS.has(item));

const unique = (items = []) => Array.from(new Set(items.filter(Boolean)));

const parsePngDimensions = (buffer) => {
  if (buffer.length < 24) return null;
  const isPng = buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  if (!isPng) return null;

  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
    mimeType: 'image/png'
  };
};

const parseSvgDimensions = (buffer) => {
  const text = buffer.toString('utf8');
  if (!text.includes('<svg')) return null;

  const widthMatch = text.match(/\bwidth="(\d+(?:\.\d+)?)"/i);
  const heightMatch = text.match(/\bheight="(\d+(?:\.\d+)?)"/i);
  const viewBoxMatch = text.match(/\bviewBox="[^"]*\s(\d+(?:\.\d+)?)\s(\d+(?:\.\d+)?)"/i);

  const width = Number(widthMatch?.[1] || viewBoxMatch?.[1] || 0);
  const height = Number(heightMatch?.[1] || viewBoxMatch?.[2] || 0);

  return {
    width: Number.isFinite(width) ? width : 0,
    height: Number.isFinite(height) ? height : 0,
    mimeType: 'image/svg+xml'
  };
};

const getImageMetadata = async (variant = {}) => {
  if (!variant.absolutePath) {
    return {
      width: variant.metadata?.width || variant.width || 1024,
      height: variant.metadata?.height || variant.height || 1024,
      mimeType: variant.metadata?.mimeType || 'image/jpeg',
      fileSizeBytes: variant.metadata?.fileSizeBytes || variant.fileSizeBytes || 120000,
      base64: null
    };
  }

  const buffer = await fs.readFile(variant.absolutePath);
  const png = parsePngDimensions(buffer);
  const svg = png ? null : parseSvgDimensions(buffer);
  const stats = await fs.stat(variant.absolutePath);

  return {
    width: png?.width || svg?.width || 0,
    height: png?.height || svg?.height || 0,
    mimeType: png?.mimeType || svg?.mimeType || 'application/octet-stream',
    fileSizeBytes: variant.fileSizeBytes || stats.size,
    base64: buffer.toString('base64')
  };
};

const scoreRelevance = ({ variant, topicTerms, clusterTerms }) => {
  const promptTerms = unique(tokenize(variant.prompt, variant.intent, variant.label));
  const matchedTopicTerms = topicTerms.filter((term) => promptTerms.includes(term)).length;
  const matchedClusterTerms = clusterTerms.filter((term) => promptTerms.includes(term)).length;
  const intentBase = variant.intent === 'human' ? 17 : variant.intent === 'editorial' ? 18 : 16;
  const bonus = Math.min(8, matchedTopicTerms * 2 + matchedClusterTerms);
  return clamp(intentBase + bonus, 0, 25);
};

const scoreBrandAlignment = ({ variant }) => {
  const prompt = normalize(variant.prompt);
  let score = 8;
  if (prompt.includes('fintech')) score += 3;
  if (prompt.includes('premium')) score += 3;
  if (prompt.includes('clean')) score += 2;
  if (prompt.includes('white') || prompt.includes('soft background')) score += 2;
  if (prompt.includes('purple')) score += 2;
  if (variant.intent === 'editorial') score += 2;
  return clamp(score, 0, 20);
};

const scorePremiumQuality = ({ metadata }) => {
  const minSide = Math.min(metadata.width || 0, metadata.height || 0);
  const maxSide = Math.max(metadata.width || 0, metadata.height || 0);
  const ratio = maxSide && minSide ? maxSide / minSide : 0;
  let score = 6;
  if (minSide >= 900) score += 8;
  if (metadata.fileSizeBytes >= 120000) score += 4;
  if (ratio >= 1 && ratio <= 1.9) score += 2;
  return clamp(score, 0, 20);
};

const scoreThumbnailClarity = ({ variant, metadata }) => {
  let score = variant.intent === 'human' ? 10 : variant.intent === 'editorial' ? 11 : 9;
  if ((metadata.width || 0) >= 900 && (metadata.height || 0) >= 900) score += 2;
  if ((metadata.fileSizeBytes || 0) >= 90000) score += 2;
  if (normalize(variant.prompt).includes('clean')) score += 1;
  return clamp(score, 0, 15);
};

const scoreAnomalySafety = ({ variant, metadata }) => {
  const prompt = normalize(variant.prompt);
  let score = 5;
  if (prompt.includes('no text')) score += 2;
  if (prompt.includes('no logo')) score += 1;
  if (prompt.includes('no watermark')) score += 1;
  if ((metadata.fileSizeBytes || 0) >= 60000) score += 1;
  return clamp(score, 0, 10);
};

const scoreClickPotential = ({ variant }) => {
  const prompt = normalize(variant.prompt);
  let score = variant.intent === 'human' ? 9 : variant.intent === 'editorial' ? 8 : 7;
  if (prompt.includes('emotion') || prompt.includes('realistic')) score += 1;
  return clamp(score, 0, 10);
};

const resolveRepetitionPenalty = (variant = {}) => clamp(Number(variant.recentUsagePenalty) || 0, 0, 30);

const tryGeminiVisionEvaluation = async ({ variant, articleTitle, articleTopic, articleCluster, metadata }) => {
  if (!metadata.base64) return null;
  if (!process.env.GEMINI_API_KEY) return null;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_VISION_MODEL}:generateContent?key=${encodeURIComponent(process.env.GEMINI_API_KEY)}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: [
                    'Avalie esta imagem de capa para um artigo de finanças brasileiro.',
                    `Titulo: ${articleTitle}.`,
                    `Tema: ${articleTopic}.`,
                    `Cluster: ${articleCluster}.`,
                    `Intento visual esperado: ${variant.label}.`,
                    'Retorne apenas JSON com: relevance, brandAlignment, premiumQuality, thumbnailClarity, anomalyFree, clickPotential, notes, reason.',
                    'Cada score deve respeitar os limites: relevance 0-25, brandAlignment 0-20, premiumQuality 0-20, thumbnailClarity 0-15, anomalyFree 0-10, clickPotential 0-10.'
                  ].join(' ')
                },
                {
                  inlineData: {
                    mimeType: metadata.mimeType,
                    data: metadata.base64
                  }
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.1,
            responseMimeType: 'application/json'
          }
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini image selector failed (${response.status}): ${errorText}`);
    }

    const payload = await response.json();
    const text = payload?.candidates?.[0]?.content?.parts?.map((part) => part?.text || '').join('\n').trim();
    if (!text) return null;

    const parsed = JSON.parse(text);
    return {
      relevance: clamp(Number(parsed.relevance) || 0, 0, 25),
      brandAlignment: clamp(Number(parsed.brandAlignment) || 0, 0, 20),
      premiumQuality: clamp(Number(parsed.premiumQuality) || 0, 0, 20),
      thumbnailClarity: clamp(Number(parsed.thumbnailClarity) || 0, 0, 15),
      anomalyFree: clamp(Number(parsed.anomalyFree) || 0, 0, 10),
      clickPotential: clamp(Number(parsed.clickPotential) || 0, 0, 10),
      notes: Array.isArray(parsed.notes) ? parsed.notes.filter(Boolean) : [],
      reason: parsed.reason || ''
    };
  } catch (error) {
    await logger.warn('image_selector_multimodal_failed', {
      variantKey: variant.key,
      error: error?.message || String(error)
    });
    return null;
  }
};

const blendBreakdown = (base, visual) => {
  if (!visual) {
    return {
      ...base,
      notes: [],
      reason: 'Score calculado por metadados, prompt e validações automáticas.'
    };
  }

  return {
    relevance: clamp(Math.round(base.relevance * 0.35 + visual.relevance * 0.65), 0, 25),
    brandAlignment: clamp(Math.round(base.brandAlignment * 0.35 + visual.brandAlignment * 0.65), 0, 20),
    premiumQuality: clamp(Math.round(base.premiumQuality * 0.35 + visual.premiumQuality * 0.65), 0, 20),
    thumbnailClarity: clamp(Math.round(base.thumbnailClarity * 0.35 + visual.thumbnailClarity * 0.65), 0, 15),
    anomalyFree: clamp(Math.round(base.anomalyFree * 0.35 + visual.anomalyFree * 0.65), 0, 10),
    clickPotential: clamp(Math.round(base.clickPotential * 0.35 + visual.clickPotential * 0.65), 0, 10),
    notes: visual.notes || [],
    reason: visual.reason || 'Score combinado entre heurística e avaliação visual multimodal.'
  };
};

const scoreVariant = async ({ variant, articleTitle, articleTopic, articleCluster }) => {
  const metadata = await getImageMetadata(variant);
  const topicTerms = unique(tokenize(articleTitle, articleTopic));
  const clusterTerms = unique(tokenize(articleCluster));

  const heuristicBreakdown = {
    relevance: scoreRelevance({ variant, topicTerms, clusterTerms }),
    brandAlignment: scoreBrandAlignment({ variant }),
    premiumQuality: scorePremiumQuality({ metadata }),
    thumbnailClarity: scoreThumbnailClarity({ variant, metadata }),
    anomalyFree: scoreAnomalySafety({ variant, metadata }),
    clickPotential: scoreClickPotential({ variant })
  };

  const visualBreakdown = await tryGeminiVisionEvaluation({
    variant,
    articleTitle,
    articleTopic,
    articleCluster,
    metadata
  });

  const breakdown = blendBreakdown(heuristicBreakdown, visualBreakdown);
  const repetitionPenalty = resolveRepetitionPenalty(variant);
  const total = breakdown.relevance
    + breakdown.brandAlignment
    + breakdown.premiumQuality
    + breakdown.thumbnailClarity
    + breakdown.anomalyFree
    + breakdown.clickPotential
    - repetitionPenalty;

  return {
    key: variant.key,
    intent: variant.intent,
    label: variant.label,
    provider: variant.provider,
    publicPath: variant.publicPath,
    absolutePath: variant.absolutePath,
    prompt: variant.prompt,
    fileSizeBytes: metadata.fileSizeBytes,
    width: metadata.width,
    height: metadata.height,
    total: clamp(total, 0, 100),
    breakdown,
    repetitionPenalty,
    recentUsageCount: Number(variant.recentUsageCount) || 0,
    usedVisualEvaluation: Boolean(visualBreakdown)
  };
};

export const selectBestBlogImage = async ({
  articleTitle,
  articleTopic,
  articleCluster,
  variants
}) => {
  const preparedVariants = (Array.isArray(variants) ? variants : []).filter((item) => (item?.absolutePath || item?.publicPath) && item?.prompt);
  if (!preparedVariants.length) {
    throw new Error('No valid image variants were provided for selection');
  }

  const scores = [];
  for (const variant of preparedVariants) {
    scores.push(await scoreVariant({
      variant,
      articleTitle,
      articleTopic,
      articleCluster
    }));
  }

  scores.sort((a, b) => b.total - a.total);
  const winner = scores[0];

  const reason = winner.usedVisualEvaluation
    ? `A variante ${winner.key.toUpperCase()} venceu com score ${winner.total}/100 por melhor alinhamento visual, clareza de thumbnail e consistência premium.`
    : `A variante ${winner.key.toUpperCase()} venceu com score ${winner.total}/100 por melhor aderência ao tema, qualidade do prompt e sinais técnicos de thumbnail premium.`;

  await logger.info('image_selection_completed', {
    articleTitle,
    articleTopic,
    articleCluster,
    winnerKey: winner.key,
    winnerPath: winner.publicPath,
    winnerScore: winner.total,
    minimumScore: MINIMUM_WINNER_SCORE,
    scores: scores.map((item) => ({
      key: item.key,
      total: item.total,
      breakdown: item.breakdown,
      publicPath: item.publicPath
    }))
  });

  return {
    winnerPath: winner.publicPath,
    winnerAbsolutePath: winner.absolutePath,
    winnerKey: winner.key,
    winnerScore: winner.total,
    scores,
    reason,
    passedMinimum: winner.total >= MINIMUM_WINNER_SCORE
  };
};

export const IMAGE_SELECTION_MINIMUM_SCORE = MINIMUM_WINNER_SCORE;
