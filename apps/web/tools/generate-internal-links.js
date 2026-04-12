import { buildSeoArtifacts, writeSeoArtifacts } from './lib/seoContentEngine.js';

const options = process.argv.slice(2).reduce((acc, arg) => {
  if (arg.startsWith('--cluster=')) acc.cluster = arg.split('=')[1];
  if (arg.startsWith('--slug=')) acc.slug = arg.split('=')[1];
  if (arg === '--dry-run') acc.dryRun = true;
  return acc;
}, { cluster: null, slug: null, dryRun: false });

const artifacts = buildSeoArtifacts(options);

if (!options.dryRun) {
  writeSeoArtifacts(artifacts);
}

console.log(
  `${options.dryRun ? 'Dry run de links internos' : 'Links internos recalculados'}: ${artifacts.articles.length} artigos afetados.`
);
