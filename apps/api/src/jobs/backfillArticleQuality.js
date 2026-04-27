import 'dotenv/config.js';
import { PrismaClient } from '@prisma/client';
import { enforceArticleStandard, validateArticle } from '../services/articleQualityService.js';

const prisma = new PrismaClient();

const parseArgs = () => {
  const entries = new Map();
  for (const arg of process.argv.slice(2)) {
    if (!arg.startsWith('--')) continue;
    const [key, value] = arg.slice(2).split('=');
    entries.set(key, value ?? 'true');
  }

  return {
    limit: Number(entries.get('limit') || 50),
    dryRun: entries.get('dry-run') === 'true',
    includeDrafts: entries.get('include-drafts') === 'true'
  };
};

const compilePlainTextContent = (article = {}) =>
  [
    ...(article.intro || []),
    article.featuredSnippet,
    article.example,
    article.alert,
    ...((article.sections || []).flatMap((section) => [
      section.heading,
      section.subheading,
      ...(section.paragraphs || []),
      ...(section.bullets || [])
    ])),
    ...((article.midQuestions || []).flatMap((item) => [item.question, item.answer])),
    ...((article.financialImpact || [])),
    ...((article.alternatives || [])),
    ...((article.faq || []).flatMap((item) => [item.question, item.answer])),
    ...(article.conclusion || [])
  ].filter(Boolean).join('\n\n');

const getStructured = (article = {}) =>
  article.structuredContent && typeof article.structuredContent === 'object'
    ? article.structuredContent
    : {};

const accentMap = new Map([
  ['emprestimo', 'empréstimo'],
  ['emprestimos', 'empréstimos'],
  ['credito', 'crédito'],
  ['cartao', 'cartão'],
  ['cartoes', 'cartões'],
  ['veiculo', 'veículo'],
  ['veiculos', 'veículos'],
  ['imovel', 'imóvel'],
  ['imoveis', 'imóveis'],
  ['simulacao', 'simulação'],
  ['simulacoes', 'simulações'],
  ['divida', 'dívida'],
  ['dividas', 'dívidas'],
  ['financas', 'finanças'],
  ['educacao', 'educação'],
  ['salario', 'salário'],
  ['salarios', 'salários'],
  ['minimo', 'mínimo'],
  ['minimos', 'mínimos'],
  ['rapido', 'rápido'],
  ['rapida', 'rápida'],
  ['opcao', 'opção'],
  ['opcoes', 'opções'],
  ['emergencia', 'emergência'],
  ['revisao', 'revisão'],
  ['importancia', 'importância'],
  ['prisao', 'prisão'],
  ['historico', 'histórico'],
  ['inadimplencia', 'inadimplência'],
  ['operacao', 'operação'],
  ['investigacao', 'investigação'],
  ['lanca', 'lança'],
  ['maquinas', 'máquinas'],
  ['mao', 'mão'],
  ['debito', 'débito'],
  ['automatico', 'automático'],
  ['codigo', 'código'],
  ['cidadao', 'cidadão'],
  ['criancas', 'crianças'],
  ['diferenca', 'diferença'],
  ['consorcio', 'consórcio'],
  ['objecoes', 'objeções'],
  ['bancarias', 'bancárias'],
  ['projecoes', 'projeções'],
  ['economicas', 'econômicas'],
  ['fiscalizacao', 'fiscalização'],
  ['apreensao', 'apreensão'],
  ['autonomo', 'autônomo'],
  ['autonomos', 'autônomos'],
  ['devolucao', 'devolução'],
  ['amigavel', 'amigável'],
  ['economico', 'econômico'],
  ['definitivo', 'definitivo']
]);

const matchCase = (source, target) => {
  if (source.toUpperCase() === source) return target.toUpperCase();
  if (source[0] === source[0].toUpperCase()) return target[0].toUpperCase() + target.slice(1);
  return target;
};

const restoreCommonAccents = (value = '') => {
  let text = String(value || '');
  for (const [plain, accented] of accentMap) {
    text = text.replace(new RegExp(`\\b${plain}\\b`, 'gi'), (match) => matchCase(match, accented));
  }
  return text;
};

const slugToLabel = (slug = '') =>
  restoreCommonAccents(
    String(slug || '')
      .replace(/-/g, ' ')
      .replace(/\b\w/g, (letter) => letter.toUpperCase())
  ).trim();

const buildInternalLinks = ({ article, candidates = [] }) => {
  const structured = getStructured(article);
  const currentLinks = Array.isArray(structured.internalLinks) ? structured.internalLinks : [];
  const links = [...currentLinks];

  const fixedLinks = [
    { path: '/emprestimos', title: 'Empréstimos', anchor: 'comparar opções de empréstimo' },
    { path: '/financiamentos', title: 'Financiamentos', anchor: 'entender opções de financiamento' },
    { path: '/ferramentas', title: 'Ferramentas', anchor: 'simular custos antes de contratar' }
  ];

  for (const item of candidates) {
    if (links.length >= 5) break;
    if (!item.slug || item.slug === article.slug) continue;
    links.push({
      path: `/blog/${item.slug}`,
      title: item.title,
      anchor: item.excerpt || item.title
    });
  }

  for (const item of fixedLinks) {
    if (links.length >= 6) break;
    links.push(item);
  }

  const seen = new Set();
  return links.filter((item) => {
    if (!item?.path || seen.has(item.path)) return false;
    seen.add(item.path);
    return true;
  }).slice(0, 6);
};

const inferKeyword = (article = {}) => {
  const structured = getStructured(article);
  const currentTitle = `${article.title || ''} ${structured.title || ''}`;
  if (/vale a pena\?|Veja custos e riscos|quanto vale a pena/i.test(currentTitle)) {
    return slugToLabel(article.slug);
  }

  return restoreCommonAccents(structured.clusterKeyword
    || article.cluster?.primaryKeyword
    || structured.tags?.[0]
    || slugToLabel(article.slug)
    || article.title);
};

const repairArticle = ({ article, relatedArticles }) => {
  const structured = getStructured(article);
  const internalLinks = buildInternalLinks({ article, candidates: relatedArticles });
  const repaired = enforceArticleStandard({
    article: {
      ...structured,
      slug: article.slug,
      title: restoreCommonAccents(article.title),
      h1: restoreCommonAccents(structured.h1 || article.title),
      summary: article.excerpt || structured.summary || '',
      metaTitle: article.seoTitle || structured.metaTitle || article.title,
      metaDescription: article.seoDescription || structured.metaDescription || article.excerpt || '',
      category: article.category?.name || structured.category || '',
      coverImage: article.coverImage || structured.coverImage || '',
      ogImage: article.ogImage || structured.ogImage || '',
      clusterLabel: article.cluster?.name || structured.clusterLabel || '',
      clusterKeyword: inferKeyword(article),
      internalLinks,
      externalLinks: Array.isArray(structured.externalLinks) ? structured.externalLinks : [],
      routePath: structured.routePath || `/blog/${article.slug}`,
      canonicalUrl: structured.canonicalUrl || `https://www.cotejuros.com.br/blog/${article.slug}/`,
      sourceType: structured.sourceType || 'article-quality-backfill'
    },
    primaryKeyword: inferKeyword(article),
    internalLinks
  });

  const validation = validateArticle({
    article: repaired,
    internalLinks
  });

  return {
    repaired,
    validation,
    internalLinks,
    status: validation.passed ? 'published' : 'draft'
  };
};

const main = async () => {
  const options = parseArgs();
  const articles = await prisma.article.findMany({
    where: options.includeDrafts
      ? {}
      : { status: 'published' },
    include: {
      category: true,
      cluster: true
    },
    orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
    take: Number.isFinite(options.limit) && options.limit > 0 ? options.limit : 50
  });

  const relatedArticles = await prisma.article.findMany({
    where: { status: 'published' },
    select: {
      slug: true,
      title: true,
      excerpt: true
    },
    orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
    take: 100
  });

  const results = [];

  for (const article of articles) {
    const { repaired, validation, status } = repairArticle({ article, relatedArticles });
    const wordCount = compilePlainTextContent(repaired).split(/\s+/).filter(Boolean).length;
    repaired.wordCount = wordCount;
    repaired.readTime = Math.max(6, Math.round(wordCount / 190));

    if (!options.dryRun) {
      await prisma.article.update({
        where: { id: article.id },
        data: {
          title: repaired.title,
          content: compilePlainTextContent(repaired),
          excerpt: repaired.summary,
          seoTitle: repaired.metaTitle,
          seoDescription: repaired.metaDescription,
          readTime: repaired.readTime,
          wordCount: repaired.wordCount,
          structuredContent: repaired,
          status,
          publishedAt: status === 'published' ? (article.publishedAt || new Date()) : null
        }
      });
    }

    results.push({
      slug: article.slug,
      status,
      updated: !options.dryRun,
      issues: validation.issues,
      checks: validation.checks
    });
  }

  console.log(JSON.stringify({
    ok: true,
    dryRun: options.dryRun,
    processed: results.length,
    published: results.filter((item) => item.status === 'published').length,
    drafts: results.filter((item) => item.status === 'draft').length,
    results
  }, null, 2));
};

main()
  .catch((error) => {
    console.error('[article-quality-backfill] failed', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
