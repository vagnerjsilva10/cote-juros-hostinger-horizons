import 'dotenv/config.js';
import { SeoGrowthService } from '../services/seoGrowthService.js';

const parseArgs = () => {
  const args = new Map(
    process.argv.slice(2)
      .filter((item) => item.startsWith('--'))
      .map((item) => {
        const [key, value = 'true'] = item.slice(2).split('=');
        return [key, value];
      })
  );

  return {
    mode: args.get('mode') || 'opportunities',
    limit: Number(args.get('limit') || 25),
    days: Number(args.get('days') || 28),
    minImpressions: Number(args.get('minImpressions') || 20)
  };
};

const main = async () => {
  const options = parseArgs();

  if (options.mode === 'sync') {
    const result = await SeoGrowthService.syncSearchConsole({
      days: options.days
    });
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  if (options.mode === 'sites') {
    const result = await SeoGrowthService.listSearchConsoleSites();
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  if (options.mode === 'health') {
    const result = await SeoGrowthService.checkSearchConsoleAccess();
    console.log(JSON.stringify(result, null, 2));
    if (!result.ok) process.exitCode = 1;
    return;
  }

  if (options.mode === 'refresh') {
    const result = await SeoGrowthService.applySafeRefresh({
      limit: Number.isFinite(options.limit) ? options.limit : 5
    });
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  const result = await SeoGrowthService.listSearchOpportunities({
    limit: Number.isFinite(options.limit) ? options.limit : 25,
    minImpressions: Number.isFinite(options.minImpressions) ? options.minImpressions : 20
  });
  console.log(JSON.stringify(result, null, 2));
};

main().catch((error) => {
  console.error('[seo-growth] failed', {
    message: error?.message || 'unknown error',
    code: error?.code,
    status: error?.status || error?.response?.status,
    reason: error?.response?.data?.error?.status || error?.cause?.status
  });
  process.exitCode = 1;
});
