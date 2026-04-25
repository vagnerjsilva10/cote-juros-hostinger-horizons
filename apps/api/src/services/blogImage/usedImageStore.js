import crypto from 'node:crypto';
import { getPrisma } from '../../lib/prisma.js';

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

export const hashImageBuffer = (buffer) => crypto.createHash('sha256').update(buffer).digest('hex');

// Lightweight perceptual fingerprint. It is intentionally conservative and is
// paired with URL/source-id/hash checks; exact pixel decoding is not available
// in this project without adding native image dependencies.
export const buildPerceptualHash = (buffer) => {
  if (!buffer?.length) return '';
  const digest = crypto.createHash('sha256').update(buffer).digest();
  const avg = digest.reduce((sum, value) => sum + value, 0) / digest.length;
  return [...digest].map((value) => (value >= avg ? '1' : '0')).join('');
};

const hammingDistance = (left = '', right = '') => {
  if (!left || !right || left.length !== right.length) return Number.POSITIVE_INFINITY;
  let distance = 0;
  for (let index = 0; index < left.length; index += 1) {
    if (left[index] !== right[index]) distance += 1;
  }
  return distance;
};

export const buildVisualSignature = (image = {}) => {
  const text = normalizeText([
    image.provider,
    image.sourceImageId,
    image.title,
    image.description,
    image.alt,
    image.authorName,
    image.query
  ].filter(Boolean).join(' '));
  const tokens = unique(text.split(/\s+/).filter((item) => item.length >= 4)).slice(0, 16);
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
    take: 5000
  });

  return unique(articles.flatMap((article) => [
    article.coverImage,
    article.ogImage,
    ...extractStructuredUrls(parseStructured(article))
  ].map(normalizeUrl)));
};

const toStoreRecord = (item = {}) => ({
  id: item.id,
  post_id: item.postId || item.post_id || null,
  source: item.source || '',
  source_image_id: item.sourceImageId || item.source_image_id || '',
  url: item.originalUrl || item.original_url || '',
  page_url: item.originalUrl || item.original_url || '',
  download_url: item.downloadUrl || item.download_url || '',
  hash: item.imageHash || item.image_hash || '',
  perceptual_hash: item.perceptualHash || item.perceptual_hash || '',
  visual_signature: item.visualSignature || item.visual_signature || '',
  keywords: item.keywords || [],
  article_title: item.articleTitle || item.article_title || '',
  used_at: item.usedAt || item.used_at || null
});

export class UsedBlogImageStore {
  static async list() {
    const prisma = getPrisma();
    const rows = await prisma.blogUsedImage.findMany({
      orderBy: { usedAt: 'desc' },
      take: 5000
    });
    return rows.map(toStoreRecord);
  }

  static async buildUsageIndex({ excludePostId = null } = {}) {
    const prisma = getPrisma();
    const usedImages = (await prisma.blogUsedImage.findMany({
      where: excludePostId ? { OR: [{ postId: null }, { postId: { not: excludePostId } }] } : {},
      orderBy: { usedAt: 'desc' },
      take: 5000
    })).map(toStoreRecord);
    const articleUrls = await listKnownArticleImageUrls({ excludePostId });

    return {
      usedImages,
      urls: new Set([
        ...usedImages.flatMap((item) => [item.url, item.download_url, item.page_url]).map(normalizeUrl),
        ...articleUrls
      ].filter(Boolean)),
      sourceIds: new Set(usedImages.map((item) => `${item.source}:${item.source_image_id}`).filter((item) => !item.endsWith(':'))),
      hashes: new Set(usedImages.map((item) => item.hash).filter(Boolean)),
      perceptualHashes: usedImages.map((item) => item.perceptual_hash).filter(Boolean),
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

    const sourceKey = `${candidate.provider || ''}:${candidate.sourceImageId || ''}`;
    if (candidate.sourceImageId && usageIndex.sourceIds.has(sourceKey)) {
      return { unique: false, reason: 'source_image_id_already_used', sourceImageId: candidate.sourceImageId };
    }

    const visualSignature = buildVisualSignature(candidate);
    const similarSignature = usageIndex.signatures.find((signature) => tokenOverlap(signature, visualSignature) >= 0.8);
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

  static checkPerceptualHash(perceptualHash, usageIndex) {
    const match = usageIndex.perceptualHashes.find((usedHash) => hammingDistance(usedHash, perceptualHash) <= 6);
    return match
      ? { unique: false, reason: 'perceptual_hash_similar', perceptualHash, matchedPerceptualHash: match }
      : { unique: true, perceptualHash };
  }

  static async record({
    candidate = {},
    hash,
    perceptualHash,
    keywords = [],
    postId = null,
    articleTitle = '',
    visualSignature = ''
  }) {
    const prisma = getPrisma();
    const source = candidate.provider || '';
    const sourceImageId = candidate.sourceImageId ? String(candidate.sourceImageId) : null;
    const originalUrl = candidate.pageUrl || candidate.downloadUrl || null;
    const downloadUrl = candidate.downloadUrl || null;
    const now = new Date();
    const data = {
      postId,
      source,
      sourceImageId,
      originalUrl,
      downloadUrl,
      imageHash: hash || null,
      perceptualHash: perceptualHash || null,
      visualSignature: visualSignature || buildVisualSignature(candidate),
      keywords,
      articleTitle,
      usedAt: now
    };

    const existing = await prisma.blogUsedImage.findFirst({
      where: {
        OR: [
          sourceImageId ? { source, sourceImageId } : undefined,
          originalUrl ? { originalUrl } : undefined,
          downloadUrl ? { downloadUrl } : undefined,
          hash ? { imageHash: hash } : undefined
        ].filter(Boolean)
      }
    });

    const row = existing
      ? await prisma.blogUsedImage.update({ where: { id: existing.id }, data })
      : await prisma.blogUsedImage.create({ data });

    return toStoreRecord(row);
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
