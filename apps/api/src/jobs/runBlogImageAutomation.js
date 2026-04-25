import { config as loadEnv } from 'dotenv';
import { BlogImageAutomationService } from '../services/blogImage/automationService.js';

const args = process.argv.slice(2);
loadEnv();
loadEnv({ path: 'apps/api/.env', override: true });
const limitArg = args.find((item) => item.startsWith('--limit='));
const triggerArg = args.find((item) => item.startsWith('--trigger='));
const limit = Number(limitArg?.split('=')[1] || 1);
const trigger = triggerArg?.split('=')[1] || 'manual';

const main = async () => {
  const results = [];

  for (let index = 0; index < limit; index += 1) {
    const result = await BlogImageAutomationService.processNextArticle({ trigger });
    results.push(result);
    if (!result.processed) break;
  }

  console.log(JSON.stringify({ trigger, limit, results }, null, 2));
};

main().catch((error) => {
  console.error('[blog-image-automation] failed', error);
  process.exitCode = 1;
});
