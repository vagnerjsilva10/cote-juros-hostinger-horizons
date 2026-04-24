import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getPrisma } from '../../lib/prisma.js';

const DEFAULT_STORE_URL = new URL('../../../data/blog-used-images.json', import.meta.url);

const normalizeUrl = (value = '') =>
  String(value || '')
    .trim()
    .replace(/[?#].*$/, '')
    .replace(/\/$/, '')
    .toLowerCase();

const normalizeText = (value = '') =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const unique = (items = []) => Array.from(new Set(items.filter(Boolean)));

export const hashImageBuffer = (buffer) => crypto.createHash('sha1').update(buffer).digest('hex');

export const buildVisualSignature = (image = {}) => {
  const text = normalizeText([
    image.provider,
    image.title,
    image.description,
    image.alt,
    image.authorName,
    image.query
  ].filter(Boolean).join(' '));
  const tokens = unique(text.split(/\s+/).filter((item) => item.length >= 4)).slice(0, 12);
  const ratio = image.height ? Math.round((Number(image.width || 0) / Number(image.height)) * 10) / 10 : 0;
  return [image.provider, image.authorName || '', ratio, ...tokens].filter(Boolean).join('|');
};

const tokenOverlap = (a = '', b = '') => {
  const left = new Set(normalizeText(a).split(/\s+/).filter((item) => item.length >= 4));
  const right = new Set(normalizeText(b).split(/\s+/).filter((item) => item.length >= 4));
  if (!left.size || !right.size) return 0;
  const intersection = [...left].filter((item) => right.has(item)).length;
  return intersection / Math.min(left.size, right.size);
};

const getStorePath = () => fileURLToPath(process.env.BLOG_USED_IMAGES_STORE || DEFAULT_STORE_URL);

const readJson = async () => {
  const storePath = getStorePath();
  try {
    const raw = await fs.readFile(storePath, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed?.used_images) ? parsed.used_images : [];
  } catch (error) {
    if (error?.code === 'ENOENT') return [];
    throw error;
  }
};

const writeJson = async (items = []) => {
  const storePath = getStorePath();
  await fs.mkdir(path.dirname(storePath), { recursive: true });
  await fs.writeFile(
    storePath,
    `${JSON.stringify({ used_images: items }, null, 2)}\n`,
    'utf8'
  );
};

const extractStructuredUrls = (structured = {}) => [
  structured?.coverImage,
  structured?.ogImage,
  structured?.imageAttribution?.originalUrl,
  structured?.imageAttribution?.sourceUrl,
  structured?.blogImageAutomation?.sourceUrl,
  structured?.blogImageAutomation?.downloadUrl
].filter(Boolean);

const parseStructured = (article = {}) => {
  if (article?.structuredContent && typeof article.structuredContent === 'object') return article.structuredContent;
  try {
    const parsed = JSON.parse(article?.content || '');
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
};

export const listKnownArticleImageUrls = async ({ excludePostId = null } = {}) => {
  const prisma = getPrisma();
  const articles = await prisma.article.findMany({
    where: excludePostId ? { id: { not: excludePostId } } : {},
    select: {
      id: true,
      coverImage: true,
      ogImage: true,
      structuredContent: true,
      content: true
    },
    take: 1000
  });

  return unique(articles.flatMap((article) => [
    article.coverImage,
    article.ogImage,
    ...extractStructuredUrls(parseStructured(article))
  ].map(normalizeUrl)));
};

export class UsedBlogImageStore {
  static async list() {
    return readJson();
  }

  static async buildUsageIndex({ excludePostId = null } = {}) {
    const usedImages = await readJson();
    const articleUrls = await listKnownArticleImageUrls({ excludePostId });
    return {
      usedImages,
      urls: new Set([
        ...usedImages.flatMap((item) => [item.url, item.download_url, item.page_url]).map(normalizeUrl),
        ...articleUrls
      ].filter(Boolean)),
      hashes: new Set(usedImages.map((item) => item.hash).filter(Boolean)),
      signatures: usedImages.map((item) => item.visual_signature).filter(Boolean)
    };
  }

  static checkCandidate({ candidate = {}, usageIndex }) {
    const urls = [
      candidate.pageUrl,
      candidate.downloadUrl,
      candidate.previewUrl
    ].map(normalizeUrl).filter(Boolean);
    const matchedUrl = urls.find((url) => usageIndex.urls.has(url));
    if (matchedUrl) return { unique: false, reason: 'url_already_used', matchedUrl };

    const visualSignature = buildVisualSignature(candidate);
    const similarSignature = usageIndex.signatures.find((signature) => tokenOverlap(signature, visualSignature) >= 0.72);
    if (similarSignature) {
      return {
        unique: false,
        reason: 'visually_similar_composition',
        visualSignature,
        similarSignature
      };
    }

    return { unique: true, visualSignature };
  }

  static checkHash(hash, usageIndex) {
    return usageIndex.hashes.has(hash)
      ? { unique: false, reason: 'hash_already_used', hash }
      : { unique: true, hash };
  }

  static async record({ candidate = {}, hash, keywords = [], postId = null, visualSignature = '' }) {
    const items = await readJson();
    const now = new Date().toISOString();
    const url = candidate.pageUrl || candidate.downloadUrl;
    const next = [
      ...items.filter((item) => item.post_id !== postId && item.hash !== hash && normalizeUrl(item.url) !== normalizeUrl(url)),
      {
        id: crypto.randomUUID(),
        url,
        page_url: candidate.pageUrl || '',
        download_url: candidate.downloadUrl || '',
        hash,
        source: candidate.provider || '',
        keywords,
        post_id: postId,
        visual_signature: visualSignature || buildVisualSignature(candidate),
        used_at: now
      }
    ];
    await writeJson(next);
    return next[next.length - 1];
  }

  static async findDuplicateArticleGroups() {
    const prisma = getPrisma();
    const articles = await prisma.article.findMany({
      where: {
        status: 'published',
        NOT: [{ coverImage: null }, { coverImage: '' }]
      },
      include: {
        category: true,
        cluster: true
      },
      orderBy: [{ publishedAt: 'asc' }, { createdAt: 'asc' }]
    });

    const groups = new Map();
    for (const article of articles) {
      const structured = parseStructured(article);
      const key = normalizeUrl(structured?.blogImageAutomation?.sourceUrl || structured?.imageAttribution?.originalUrl || article.coverImage);
      if (!key) continue;
      const group = groups.get(key) || [];
      group.push({ ...article, structured });
      groups.set(key, group);
    }

    return [...groups.values()].filter((group) => group.length > 1);
  }
}

export const normalizeBlogImageUrl = normalizeUrl;
