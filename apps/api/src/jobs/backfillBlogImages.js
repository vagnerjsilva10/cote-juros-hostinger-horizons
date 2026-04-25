import { config as loadEnv } from 'dotenv';
import { getPrisma } from '../lib/prisma.js';
import { BlogImageAutomationService } from '../services/blogImage/automationService.js';
import { isTemplateOrPlaceholderImage } from '../services/blogImage/validator.js';
import { UsedBlogImageStore, normalizeBlogImageUrl } from '../services/blogImage/usedImageStore.js';

const args = process.argv.slice(2);
loadEnv();
loadEnv({ path: 'apps/api/.env', override: true });
const limitArg = args.find((item) => item.startsWith('--limit='));
const slugArg = args.find((item) => item.startsWith('--slug='));
const dryRun = args.includes('--dry-run');
const limit = Number(limitArg?.split('=')[1] || 10);
const forcedSlug = slugArg?.split('=')[1] || '';

const parseStructured = (article = {}) => {
  if (article?.structuredContent && typeof article.structuredContent === 'object') return article.structuredContent;
  try {
    const parsed = JSON.parse(article?.content || '');
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
};

const imageKeyForArticle = (article = {}) => {
  const structured = parseStructured(article);
  return normalizeBlogImageUrl(
    structured?.blogImageAutomation?.sourceUrl ||
    structured?.imageAttribution?.originalUrl ||
    article.coverImage ||
    structured?.coverImage ||
    article.ogImage ||
    structured?.ogImage
  );
};

const listTemplateTargets = async () => {
  const prisma = getPrisma();
  const articles = await prisma.article.findMany({
    where: { status: 'published' },
    include: { category: true, cluster: true },
    orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
    take: 1000
  });

  return articles
    .map((article) => ({ ...article, structured: parseStructured(article) }))
    .filter((article) => isTemplateOrPlaceholderImage(article.coverImage || article.structured?.coverImage || ''));
};

const uniqueById = (items = []) => {
  const seen = new Set();
  return items.filter((item) => {
    if (!item?.id || seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
};

const main = async () => {
  const prisma = getPrisma();
  const corrected = [];
  const skipped = [];
  const duplicateGroups = await UsedBlogImageStore.findDuplicateArticleGroups();
  const duplicateTargets = duplicateGroups.flatMap((group) => group.slice(1));
  const templateTargets = await listTemplateTargets();
  const forcedTarget = forcedSlug
    ? await prisma.article.findUnique({ where: { slug: forcedSlug }, include: { category: true, cluster: true } })
    : null;
  const targets = uniqueById([
    forcedTarget,
    ...duplicateTargets,
    ...templateTargets
  ].filter(Boolean)).slice(0, limit);

  for (const article of targets) {
    const before = imageKeyForArticle(article);
    if (dryRun) {
      skipped.push({ slug: article.slug, reason: 'dry_run', before });
      continue;
    }

    try {
      const result = await BlogImageAutomationService.processArticleImage(article, { trigger: 'backfill' });
      if (!result.processed) {
        skipped.push({ ...result, before });
        continue;
      }
      corrected.push({
        slug: result.slug,
        provider: result.provider,
        before,
        after: result.imageUrl,
        featuredImageUrl: result.featuredImageUrl,
        hash: result.hash
      });
    } catch (error) {
      skipped.push({
        slug: article.slug,
        before,
        reason: 'backfill_failed',
        error: error?.message || String(error)
      });
    }
  }

  console.log(JSON.stringify({
    dryRun,
    limit,
    duplicateGroups: duplicateGroups.map((group) => group.map((article) => article.slug)),
    templateTargets: templateTargets.map((article) => article.slug),
    targetCount: targets.length,
    correctedCount: corrected.length,
    corrected,
    skipped
  }, null, 2));
};

main().catch((error) => {
  console.error('[blog-image-backfill] failed', error);
  process.exitCode = 1;
});
