import { BlogImageAutomationService } from '../services/blogImage/automationService.js';

const args = process.argv.slice(2);
const limitArg = args.find((item) => item.startsWith('--limit='));
const limit = Number(limitArg?.split('=')[1] || 3);

const main = async () => {
  const corrected = [];
  const skipped = [];

  for (let index = 0; index < limit; index += 1) {
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
    correctedCount: corrected.length,
    corrected,
    skipped
  }, null, 2));
};

main().catch((error) => {
  console.error('[blog-image-backfill] failed', error);
  process.exitCode = 1;
});
