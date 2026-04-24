import { BlogImageAutomationService } from '../services/blogImage/automationService.js';
import { UsedBlogImageStore } from '../services/blogImage/usedImageStore.js';

const args = process.argv.slice(2);
const limitArg = args.find((item) => item.startsWith('--limit='));
const limit = Number(limitArg?.split('=')[1] || 3);

const main = async () => {
  const corrected = [];
  const skipped = [];
  const duplicateGroups = await UsedBlogImageStore.findDuplicateArticleGroups();
  const duplicateTargets = duplicateGroups.flatMap((group) => group.slice(1));

  for (const article of duplicateTargets.slice(0, limit)) {
    const result = await BlogImageAutomationService.processArticleImage(article, { trigger: 'backfill-duplicate' });
    if (!result.processed) {
      skipped.push(result);
      continue;
    }
    corrected.push({
      slug: result.slug,
      provider: result.provider,
      sourceUrl: result.imageUrl,
      featuredImageUrl: result.featuredImageUrl
    });
  }

  for (let index = corrected.length; index < limit; index += 1) {
    const result = await BlogImageAutomationService.processNextArticle({ trigger: 'backfill' });
    if (!result.processed) {
      skipped.push(result);
      break;
    }
    corrected.push({
      slug: result.slug,
      provider: result.provider,
      sourceUrl: result.imageUrl,
      featuredImageUrl: result.featuredImageUrl
    });
  }

  console.log(JSON.stringify({
    limit,
    duplicateGroups: duplicateGroups.map((group) => group.map((article) => article.slug)),
    correctedCount: corrected.length,
    corrected,
    skipped
  }, null, 2));
};

main().catch((error) => {
  console.error('[blog-image-backfill] failed', error);
  process.exitCode = 1;
});
