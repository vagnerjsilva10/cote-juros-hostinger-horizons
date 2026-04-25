import 'dotenv/config.js';
import { CompetitorSeoResearchService } from '../services/competitorSeoResearchService.js';

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
    mode: args.get('mode') || 'run',
    queryLimit: Number(args.get('queryLimit') || 25),
    resultsPerQuery: Number(args.get('resultsPerQuery') || 10),
    limit: Number(args.get('limit') || 25),
    minScore: Number(args.get('minScore') || 45),
    createBriefs: args.get('createBriefs') !== 'false'
  };
};

const main = async () => {
  const options = parseArgs();

  if (options.mode === 'health') {
    console.log(JSON.stringify(CompetitorSeoResearchService.getHealth(), null, 2));
    return;
  }

  if (options.mode === 'opportunities') {
    const result = await CompetitorSeoResearchService.listOpportunities({
      limit: options.limit,
      minScore: options.minScore
    });
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  if (options.mode === 'briefs') {
    const result = await CompetitorSeoResearchService.createBriefsFromGaps({
      limit: options.limit,
      minScore: options.minScore
    });
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  const result = await CompetitorSeoResearchService.runResearch({
    queryLimit: options.queryLimit,
    resultsPerQuery: options.resultsPerQuery,
    createBriefs: options.createBriefs,
    briefLimit: Math.min(options.limit, 10)
  });
  console.log(JSON.stringify(result, null, 2));
  if (!result.ok) process.exitCode = 1;
};

main().catch((error) => {
  console.error('[competitor-seo] failed', {
    message: error?.message || 'unknown error',
    code: error?.code,
    status: error?.status || error?.response?.status
  });
  process.exitCode = 1;
});
