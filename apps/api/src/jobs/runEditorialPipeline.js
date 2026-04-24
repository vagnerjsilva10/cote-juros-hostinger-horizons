import 'dotenv/config.js';
import { EditorialService } from '../services/editorialService.js';

const parseArgs = () => {
  const args = process.argv.slice(2);
  const entries = new Map();

  for (const arg of args) {
    if (!arg.startsWith('--')) continue;
    const [key, value] = arg.slice(2).split('=');
    entries.set(key, value ?? 'true');
  }

  return {
    limit: Number(entries.get('limit') || 1),
    triggerSource: entries.get('trigger') || 'manual',
    ensureOnly: entries.get('ensure') === 'true'
  };
};

const main = async () => {
  const options = parseArgs();

  if (options.ensureOnly) {
    await EditorialService.ensureClusterCalendar();
    console.log(JSON.stringify({ ok: true, mode: 'ensure' }, null, 2));
    return;
  }

  const result = await EditorialService.runScheduledPublication({
    limit: Number.isFinite(options.limit) && options.limit > 0 ? options.limit : 1,
    triggerSource: options.triggerSource
  });

  console.log(JSON.stringify({
    ok: true,
    processed: result.length,
    items: result.map((item) => ({
      jobRunId: item.jobRunId,
      slug: item.article?.slug,
      status: item.article?.status,
      wordCount: item.validation?.wordCount,
      image: item.image?.publicPath,
      webStory: item.distribution?.webStory?.path || null,
      pinterest: item.distribution?.pinterest?.status || null,
      distributionError: item.distributionError || null
    }))
  }, null, 2));
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
