import 'dotenv/config.js';
import { WebStoryOperationsService } from '../services/webStoryOperationsService.js';

const parseArgs = () => {
  const entries = new Map();
  for (const arg of process.argv.slice(2)) {
    if (!arg.startsWith('--')) continue;
    const [key, value] = arg.slice(2).split('=');
    entries.set(key, value ?? 'true');
  }

  return {
    dryRun: entries.get('dryRun') === 'true' || entries.get('real') !== 'true',
    firstRun: entries.get('firstRun') !== 'false',
    limit: entries.has('limit') ? Number(entries.get('limit')) : null,
    includeRecent: entries.has('includeRecent') ? Number(entries.get('includeRecent')) : 80,
    slug: entries.get('slug') || '',
    force: entries.get('force') === 'true',
  };
};

const main = async () => {
  const options = parseArgs();
  const result = await WebStoryOperationsService.runSelectiveProduction(options);
  console.log(JSON.stringify({
    ...result,
    flags: {
      WEB_STORY_GENERATION_ENABLED: process.env.WEB_STORY_GENERATION_ENABLED || '',
      WEB_STORY_PUBLISH_ENABLED: process.env.WEB_STORY_PUBLISH_ENABLED || '',
      WEB_STORY_INDEX_ENABLED: process.env.WEB_STORY_INDEX_ENABLED || '',
      WEB_STORY_DAILY_LIMIT: process.env.WEB_STORY_DAILY_LIMIT || '',
    },
  }, null, 2));
};

main().catch((error) => {
  console.error('[selective-web-stories] failed', error);
  process.exitCode = 1;
});
