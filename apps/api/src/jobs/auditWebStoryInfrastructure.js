import 'dotenv/config.js';
import { WebStoryObservabilityService } from '../services/webStoryObservabilityService.js';

const parseArgs = () => {
  const entries = new Map();
  for (const arg of process.argv.slice(2)) {
    if (!arg.startsWith('--')) continue;
    const [key, value] = arg.slice(2).split('=');
    entries.set(key, value ?? 'true');
  }
  return {
    limit: Number(entries.get('limit') || 500),
  };
};

const main = async () => {
  const result = await WebStoryObservabilityService.auditExistingStories(parseArgs());
  console.log(JSON.stringify(result, null, 2));
};

main().catch((error) => {
  console.error('[web-story-infrastructure-audit] failed', error);
  process.exitCode = 1;
});
