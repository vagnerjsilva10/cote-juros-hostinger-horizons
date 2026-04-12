import { runSeoGeneration } from './lib/seoContentEngine.js';

const result = runSeoGeneration(process.argv.slice(2));

const target =
  result.options.slug ? `slug ${result.options.slug}` :
  result.options.cluster ? `cluster ${result.options.cluster}` :
  'todos os clusters';

console.log(
  `${result.options.dryRun ? 'Dry run concluído' : 'Artigos SEO gerados'} para ${target}: ${result.generatedCount} artigos (${result.topicCount} tópicos disponíveis).`
);
