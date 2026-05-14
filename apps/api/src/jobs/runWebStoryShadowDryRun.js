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
    days: Number(entries.get('days') || 14),
    dailyTarget: Number(entries.get('dailyTarget') || 3),
    liveDiscovery: entries.get('liveDiscovery') === 'true',
  };
};

const main = async () => {
  const options = parseArgs();
  const result = await WebStoryOperationsService.simulate({
    days: options.days,
    dailyTarget: options.dailyTarget,
    dryRun: true,
    useLiveDiscovery: options.liveDiscovery,
  });

  console.log(JSON.stringify({
    ok: result.ok,
    safety: {
      story_published: result.story_published,
      story_distributed: result.story_distributed,
      story_indexed: result.story_indexed,
      autonomous_real: result.autonomous_real,
      commit: result.commit,
      push: result.push,
      gitAddDot: result.gitAddDot,
    },
    summary: result.summary,
    readiness: result.readiness,
    examples: result.examples,
    blockedExamples: result.blockedExamples,
  }, null, 2));
};

main().catch((error) => {
  console.error('[web-story-shadow-dry-run] failed', error);
  process.exitCode = 1;
});
