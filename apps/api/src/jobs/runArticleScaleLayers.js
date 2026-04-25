import 'dotenv/config.js';
import { ArticleScaleService } from '../services/articleScaleService.js';

const parseArgs = () => {
  const entries = new Map();
  for (const arg of process.argv.slice(2)) {
    if (!arg.startsWith('--')) continue;
    const [key, value] = arg.slice(2).split('=');
    entries.set(key, value ?? 'true');
  }

  return {
    mode: entries.get('mode') || 'all',
    limit: Number(entries.get('limit') || 200)
  };
};

const main = async () => {
  const options = parseArgs();
  const limit = Number.isFinite(options.limit) && options.limit > 0 ? options.limit : 200;
  const result = options.mode === 'quality'
    ? await ArticleScaleService.runQualityMonitor({ limit })
    : options.mode === 'clusters'
      ? await ArticleScaleService.buildClusterQueue({ limit })
      : options.mode === 'discover'
        ? await ArticleScaleService.runDiscoverAudit({ limit })
        : options.mode === 'search'
          ? await ArticleScaleService.buildSearchConsolePriority({ limit })
          : await ArticleScaleService.runScaleLayers({ limit });

  console.log(JSON.stringify(result, null, 2));
};

main().catch((error) => {
  console.error('[article-scale-layers] failed', error);
  process.exitCode = 1;
});
