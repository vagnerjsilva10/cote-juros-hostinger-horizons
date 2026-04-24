import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { BLOG_IMAGE_DIR, EDITORIAL_FALLBACK_IMAGE_PATH, WEB_PUBLIC_DIR } from './editorialConfig.js';
import { createEditorialLogger } from './editorialLogger.js';

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

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const parseFileSize = async (filePath) => {
  const stats = await fs.stat(filePath);
  return stats.size;
};

const ensureImageDirectory = async () => {
  await fs.mkdir(fileURLToPath(BLOG_IMAGE_DIR), { recursive: true });
};

const ensureFallbackImage = async () => {
  const publicRoot = fileURLToPath(WEB_PUBLIC_DIR);
  const fallbackPath = path.join(publicRoot, EDITORIAL_FALLBACK_IMAGE_PATH.replace(/^\//, ''));

  try {
    await fs.access(fallbackPath);
    return fallbackPath;
  } catch {
    const sourceLogo = path.join(publicRoot, 'logo.png');
    await fs.mkdir(path.dirname(fallbackPath), { recursive: true });
    await fs.copyFile(sourceLogo, fallbackPath);
    return fallbackPath;
  }
};

const buildPrompt = ({ title, topic, slug }) => {
  const safeTopic = topic || title;
  const safeSlug = toSlug(slug || title || topic || 'cote-juros');

  return [
    'Create a premium fintech editorial cover image for a Brazilian personal finance article.',
    `Main theme: ${safeTopic}.`,
    `Article title context: ${title}.`,
    `Visual seed: ${safeSlug}.`,
    'Show a Brazilian person or family in a realistic financial moment, with a positive but credible emotion.',
    'Include subtle credit, banking or planning cues like a smartphone banking interface, card, contract, calculator or home/car context depending on topic.',
    'Use clean white or very soft light background, soft studio lighting, modern composition, high detail, realistic photography.',
    'Use subtle purple UI accents and a premium fintech visual language similar to large Brazilian digital banks.',
    'No text, no watermark, no logo, no collage, no low quality artifacts.'
  ].join(' ');
};

const writeImageBuffer = async (slug, buffer) => {
  await ensureImageDirectory();
  const imageDir = fileURLToPath(BLOG_IMAGE_DIR);
  const safeSlug = toSlug(slug || `blog-${Date.now()}`) || `blog-${Date.now()}`;
  const absolutePath = path.join(imageDir, `${safeSlug}.png`);
  await fs.writeFile(absolutePath, buffer);
  return {
    absolutePath,
    publicPath: `/images/blog/${safeSlug}.png`
  };
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

const getAvailableProviders = () => {
  const providers = [];
  if (process.env.OPENAI_API_KEY) providers.push('openai');
  if (process.env.GEMINI_API_KEY) providers.push('gemini');
  return providers;
};

export const generateBlogImage = async ({ title, topic, slug }) => {
  const prompt = buildPrompt({ title, topic, slug });
  let lastError = null;
  const providers = getAvailableProviders();

  if (!providers.length) {
    throw new Error('Missing OPENAI_API_KEY or GEMINI_API_KEY for image generation');
  }

  for (const provider of providers) {
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      try {
        const buffer = provider === 'openai'
          ? await generateWithOpenAi(prompt)
          : await generateWithGemini(prompt);

        if (!buffer?.length) {
          throw new Error('Generated image buffer is empty');
        }

        const image = await writeImageBuffer(slug, buffer);
        const fileSizeBytes = await parseFileSize(image.absolutePath);

        if (!fileSizeBytes) {
          throw new Error('Generated image file is empty');
        }

        await logger.info('image_generated', {
          provider,
          slug,
          publicPath: image.publicPath,
          fileSizeBytes
        });

        return {
          provider,
          prompt,
          publicPath: image.publicPath,
          absolutePath: image.absolutePath,
          fileSizeBytes,
          width: 1024,
          height: 1024,
          isFallback: false
        };
      } catch (error) {
        lastError = error;
        await logger.warn('image_generation_retry', {
          provider,
          slug,
          attempt,
          error: error?.message || String(error)
        });
        if (attempt < 3) {
          await sleep(attempt * 1200);
        }
      }
    }
  }

  const fallbackAbsolutePath = await ensureFallbackImage();
  const fileSizeBytes = await parseFileSize(fallbackAbsolutePath);

  await logger.error('image_generation_fallback', lastError, {
    provider: providers.join(','),
    slug,
    fallbackPath: EDITORIAL_FALLBACK_IMAGE_PATH
  });

  return {
    provider: 'fallback',
    prompt,
    publicPath: EDITORIAL_FALLBACK_IMAGE_PATH,
    absolutePath: fallbackAbsolutePath,
    fileSizeBytes,
    width: 512,
    height: 512,
    isFallback: true,
    errorMessage: lastError?.message || 'Image generation failed'
  };
};
