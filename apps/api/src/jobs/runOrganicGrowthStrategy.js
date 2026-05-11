import 'dotenv/config.js';
import { OrganicGrowthStrategyService } from '../services/organicGrowthStrategyService.js';
import { FinancialNewsIntelligenceService } from '../services/financialNewsIntelligenceService.js';

const parseArgs = () => {
  const entries = new Map();
  for (const arg of process.argv.slice(2)) {
    if (!arg.startsWith('--')) continue;
    const separatorIndex = arg.indexOf('=');
    if (separatorIndex === -1) {
      entries.set(arg.slice(2), 'true');
      continue;
    }
    entries.set(arg.slice(2, separatorIndex), arg.slice(separatorIndex + 1));
  }

  return {
    mode: entries.get('mode') || 'plan',
    keyword: entries.get('keyword') || '',
    topic: entries.get('topic') || '',
    cluster: entries.get('cluster') || '',
    category: entries.get('category') || 'Emprestimos',
    intent: entries.get('intent') || 'comparativo',
    limit: Number(entries.get('limit') || 120),
    minImpressions: Number(entries.get('minImpressions') || 20),
    includeSearchConsole: entries.get('include-search-console') === 'true'
  };
};

const main = async () => {
  const options = parseArgs();
  const limit = Number.isFinite(options.limit) && options.limit > 0 ? options.limit : 120;
  let result;

  if (options.mode === 'clusters') {
    result = OrganicGrowthStrategyService.buildClusterStrategy();
  } else if (options.mode === 'keywords') {
    result = OrganicGrowthStrategyService.expandKeywords({ limit, cluster: options.cluster });
  } else if (options.mode === 'interlinking') {
    result = OrganicGrowthStrategyService.buildInterlinkingPlan({ limit });
  } else if (options.mode === 'diversity') {
    result = OrganicGrowthStrategyService.buildEditorialDiversityPlan({
      keyword: options.keyword,
      cluster: options.cluster
    });
  } else if (options.mode === 'search-console') {
    result = await OrganicGrowthStrategyService.buildSearchConsoleFeedbackLoop({
      limit,
      minImpressions: Number.isFinite(options.minImpressions) ? options.minImpressions : 20
    });
  } else if (options.mode === 'assisted-preview') {
    result = await OrganicGrowthStrategyService.createAssistedProductionPreview({
      keyword: options.keyword,
      topic: options.topic,
      intent: options.intent,
      category: options.category
    });
  } else if (options.mode === 'manual-publish-one') {
    result = await OrganicGrowthStrategyService.manualPublishOne({
      keyword: options.keyword,
      topic: options.topic,
      intent: options.intent,
      category: options.category
    });
  } else if (options.mode === 'news-sources') {
    result = FinancialNewsIntelligenceService.listSources();
  } else if (options.mode === 'news-trends') {
    result = FinancialNewsIntelligenceService.detectTrends({ limit });
  } else if (options.mode === 'freshness') {
    result = FinancialNewsIntelligenceService.buildFreshnessStrategy();
  } else if (options.mode === 'trend-pipeline') {
    result = FinancialNewsIntelligenceService.buildTrendToArticlePipeline({ limit });
  } else if (options.mode === 'trend-preview') {
    result = await FinancialNewsIntelligenceService.createTrendArticlePreview({
      keyword: options.keyword,
      limit
    });
  } else if (options.mode === 'news-diagnosis') {
    result = FinancialNewsIntelligenceService.buildDiagnosis({ limit });
  } else {
    result = await OrganicGrowthStrategyService.buildGrowthPlan({
      keyword: options.keyword,
      cluster: options.cluster,
      limit,
      includeSearchConsole: options.includeSearchConsole
    });
  }

  console.log(JSON.stringify(result, null, 2));
};

main().catch((error) => {
  console.error('[organic-growth-strategy] failed', {
    message: error?.message || 'unknown error',
    code: error?.code,
    status: error?.status || error?.response?.status
  });
  process.exitCode = 1;
});
