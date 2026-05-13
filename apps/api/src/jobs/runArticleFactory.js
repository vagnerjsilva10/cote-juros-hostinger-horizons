import 'dotenv/config.js';
import { ArticleFactoryService } from '../services/articleFactoryService.js';

const parseArgs = () => {
  const args = process.argv.slice(2);
  const entries = new Map();

  for (const arg of args) {
    if (!arg.startsWith('--')) continue;
    const separatorIndex = arg.indexOf('=');
    if (separatorIndex === -1) {
      entries.set(arg.slice(2), 'true');
      continue;
    }
    entries.set(arg.slice(2, separatorIndex), arg.slice(separatorIndex + 1));
  }

  return {
    topic: entries.get('topic') || entries.get('keyword') || '',
    keyword: entries.get('keyword') || entries.get('topic') || '',
    intent: entries.get('intent') || 'guide',
    category: entries.get('category') || 'Educacao financeira',
    dryRun: entries.get('dry-run') !== 'false',
    persist: entries.get('persist') === 'true',
    publishApproved: entries.get('publish-approved') === 'true',
    triggerSource: entries.get('trigger') || 'manual-factory'
  };
};

const main = async () => {
  const options = parseArgs();
  if (!options.keyword && !options.topic) {
    throw new Error('Use --keyword=\"palavra-chave\" ou --topic=\"tema\"');
  }
  if (options.publishApproved && !options.persist) {
    throw new Error('--publish-approved exige --persist=true');
  }
  if (options.publishApproved && process.env.ARTICLE_FACTORY_ALLOW_PUBLISH !== 'true') {
    throw new Error('Publicacao bloqueada. Configure ARTICLE_FACTORY_ALLOW_PUBLISH=true apenas apos aprovacao.');
  }

  const result = await ArticleFactoryService.run(options);
  console.log(JSON.stringify({
    ok: result.ok,
    dryRun: result.dryRun,
    persisted: result.persisted,
    status: result.status,
    slug: result.slug,
    title: result.title,
    image: result.image,
    serpIntelligence: {
      provider: result.serpIntelligence?.provider,
      searchIntent: result.serpIntelligence?.searchIntent,
      readerProblem: result.serpIntelligence?.readerProblem,
      mustCoverTopics: result.serpIntelligence?.mustCoverTopics?.slice(0, 6) || [],
      contentGaps: result.serpIntelligence?.contentGaps?.slice(0, 6) || [],
      faqQuestions: result.serpIntelligence?.faqQuestions?.slice(0, 5) || []
    },
    validation: result.validation,
    publishSafety: result.publishSafety,
    topicFatigue: result.topicFatigue,
    governance: result.governance ? {
      decision: result.governance.decision,
      blockers: result.governance.blockers,
      family: result.governance.family,
      cluster: result.governance.cluster,
      scores: result.governance.scores,
      closestMatches: result.governance.memory?.closestMatches?.slice(0, 3) || [],
      feedbackProjection: result.governance.feedbackProjection?.metrics || null,
      trend: result.governance.trend || null
    } : null,
    articleRecord: result.articleRecord || null,
    sample: {
      excerpt: result.article.excerpt,
      metaTitle: result.article.metaTitle,
      metaDescription: result.article.metaDescription,
      firstSection: result.article.structuredContent.sections?.[0] || null,
      faq: result.article.structuredContent.faq?.slice(0, 3) || []
    }
  }, null, 2));
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
