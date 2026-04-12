import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const webRoot = resolve(__dirname, '..', '..');
const contentRoot = resolve(webRoot, 'content', 'seo');
const generatedRoot = resolve(contentRoot, 'generated');
const publicArticlesRoot = resolve(webRoot, 'public', 'content', 'seo', 'articles');
const clustersPath = resolve(contentRoot, 'clusters.json');
const topicsPath = resolve(contentRoot, 'topics.json');
const templatePath = resolve(contentRoot, 'templates', 'article-template.json');
const generatedArticlesPath = resolve(webRoot, 'src', 'data', 'generatedArticles.js');
const publicArticlesIndexPath = resolve(publicArticlesRoot, 'index.json');
const manifestPath = resolve(generatedRoot, 'articles-manifest.json');

const SITE_URL = 'https://www.cotejuros.com.br';
const DEFAULT_PUBLISH_START = new Date('2026-01-01T12:00:00.000Z');

const formatValue = (value) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0
  }).format(Number(value) || 0);

const titleCase = (value = '') =>
  String(value)
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

const capitalize = (value = '') => String(value).charAt(0).toUpperCase() + String(value).slice(1);

export const slugify = (value = '') =>
  String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

const parseJsonFile = (path) => JSON.parse(readFileSync(path, 'utf8').replace(/^\uFEFF/, ''));

const replaceTokens = (template, replacements) =>
  String(template).replace(/\{(\w+)\}/g, (_, key) => replacements[key] ?? '');

const estimateReadTime = (parts) => {
  const words = parts
    .flatMap((part) => {
      if (Array.isArray(part)) return part;
      if (typeof part === 'string') return [part];
      if (part?.paragraphs) return part.paragraphs;
      if (part?.bullets) return part.bullets;
      return [];
    })
    .join(' ')
    .split(/\s+/)
    .filter(Boolean).length;

  return Math.max(6, Math.round(words / 210));
};

const buildTopicFromRecipe = (cluster, type, recipeValue) => {
  if (type === 'static') {
    return {
      ...recipeValue,
      clusterId: cluster.id,
      clusterLabel: cluster.label,
      category: cluster.category
    };
  }

  const value = recipeValue;
  const replacements = {
    value,
    keyword: replaceTokens(cluster.topics[type].keywordPattern, { value }),
    cluster: cluster.label
  };

  const slugSource = cluster.topics[type].slugPattern || replaceTokens(cluster.topics[type].keywordPattern, { value });

  return {
    slug: slugify(slugSource),
    keyword: replaceTokens(cluster.topics[type].keywordPattern, { value }),
    title: replaceTokens(cluster.topics[type].titlePattern, { value }),
    intent: type === 'amount' ? 'alta-intencao' : 'informacional',
    angle: replaceTokens(cluster.topics[type].anglePattern, { value }),
    clusterId: cluster.id,
    clusterLabel: cluster.label,
    category: cluster.category,
    generatedFrom: type,
    recipeValue: value
  };
};

export const expandTopics = (clusters) => {
  const topics = [];

  clusters.forEach((cluster) => {
    (cluster.topics.static || []).forEach((item) => topics.push(buildTopicFromRecipe(cluster, 'static', item)));
    if (cluster.topics.amount?.values) cluster.topics.amount.values.forEach((value) => topics.push(buildTopicFromRecipe(cluster, 'amount', value)));
    if (cluster.topics.score?.values) cluster.topics.score.values.forEach((value) => topics.push(buildTopicFromRecipe(cluster, 'score', value)));
    if (cluster.topics.profiles?.values) cluster.topics.profiles.values.forEach((value) => topics.push(buildTopicFromRecipe(cluster, 'profiles', value)));
  });

  const seen = new Set();
  return topics.filter((topic) => {
    if (!topic.slug || seen.has(topic.slug)) return false;
    seen.add(topic.slug);
    return true;
  });
};

const pickInternalLinks = (topic, cluster, allTopics) => {
  const sameCluster = allTopics.filter((item) => item.clusterId === topic.clusterId && item.slug !== topic.slug).slice(0, 2);
  const relatedClusterArticles = allTopics.filter((item) => cluster.relatedClusters.includes(item.clusterId)).slice(0, 2);

  const hubLinks = cluster.supportPaths.slice(0, 3).map((path) => ({
    path,
    title: titleCase(path.replace(/\//g, ' ').replace(/-/g, ' ')).trim(),
    anchor: path === '/simulador-emprestimo' ? 'simular o impacto da parcela' : `ver mais sobre ${titleCase(path.split('/').pop()?.replace(/-/g, ' ') || cluster.primaryKeyword).toLowerCase()}`
  }));

  const articleLinks = [...sameCluster, ...relatedClusterArticles].slice(0, 3).map((item) => ({
    path: `/blog/${item.slug}`,
    title: item.title,
    anchor: item.keyword
  }));

  return [...hubLinks, ...articleLinks].slice(0, 5);
};

const buildSectionParagraphs = (topic, cluster, section) => {
  const { keyword, angle } = topic;
  const checklist = cluster.decisionChecklist.join(', ');

  if (section === 'contexto') {
    return [
      `${capitalize(keyword)} costuma ganhar importância quando a decisão precisa equilibrar urgência, custo e previsibilidade. Aqui, o foco é ${angle}.`,
      `Antes de seguir, vale alinhar três pontos: objetivo da decisão, capacidade mensal de pagamento e diferença entre oferta anunciada e custo real. Isso evita comparar propostas de forma incompleta.`
    ];
  }

  if (section === 'comparacao') {
    return [
      `Ao comparar ${keyword}, olhe principalmente ${checklist}. Em finanças, pequenas diferenças de taxa, prazo ou exigência de perfil podem alterar bastante o resultado final.`,
      `Também vale observar a aderência da oferta ao seu perfil. Uma linha aparentemente barata pode exigir renda, score ou relacionamento que nem sempre aparecem na chamada comercial.`
    ];
  }

  if (section === 'passo-a-passo') {
    return [
      `Uma boa decisão fica mais simples quando você usa um processo claro. Em vez de escolher pela pressa, compare cenários equivalentes e elimine propostas que pressionam demais o mês.`,
      `Quando o tema é ${keyword}, a disciplina na comparação costuma proteger mais do que qualquer promessa de aprovação rápida.`
    ];
  }

  return [
      `Os erros mais comuns em ${keyword} costumam ser evitáveis. Em geral, eles aparecem quando a decisão acontece sem leitura de contrato, sem simulação e sem comparação padronizada.`,
    `Quanto mais previsível for o impacto dessa decisão no seu orçamento, maior a chance de o crédito ou produto cumprir um papel útil em vez de abrir um problema novo.`
  ];
};

const buildFaqAnswer = (question, topic) => {
  if (question.includes('mais importante')) {
    return `O ponto mais importante é enxergar o custo e o impacto da decisão no seu orçamento completo. Em temas ligados a ${topic.keyword}, olhar só para a parcela ou para a aprovação costuma esconder o que realmente pesa no longo prazo.`;
  }

  if (question.includes('comparar opções')) {
    return `O ideal é comparar propostas equivalentes, com o mesmo valor, prazo e contexto de uso. Assim fica mais fácil entender diferença de CET, exigência de perfil, flexibilidade e custo total.`;
  }

  return `Sim. Simuladores e comparadores ajudam a transformar uma decisão emocional em uma decisão informada. Eles não substituem a leitura do contrato, mas reduzem bastante o risco de escolher no escuro.`;
};

const buildArticle = (topic, cluster, template, allTopics, index) => {
  const intro = [
    `${topic.title} é uma dúvida comum para quem quer decidir com mais clareza e menos risco de pagar caro. Na prática, o ponto central aqui é ${topic.angle}.`,
    `Ao longo do guia, você vai ver o que realmente merece atenção, como organizar a comparação e onde entram simuladores, CET, prazo e impacto no orçamento.`
  ];

  const sections = [
    {
      heading: 'Por que esse tema importa na prática',
      paragraphs: buildSectionParagraphs(topic, cluster, 'contexto')
    },
    {
      heading: `O que comparar antes de decidir`,
      paragraphs: buildSectionParagraphs(topic, cluster, 'comparacao'),
      bullets: cluster.decisionChecklist
    },
    {
      heading: 'Passo a passo para analisar com mais segurança',
      paragraphs: buildSectionParagraphs(topic, cluster, 'passo-a-passo'),
      bullets: cluster.stepFramework
    },
    {
      heading: 'Erros comuns que encarecem a decisão',
      paragraphs: buildSectionParagraphs(topic, cluster, 'erros'),
      bullets: cluster.commonMistakes
    }
  ];

  const faq = [
    `Qual é o ponto mais importante ao analisar ${topic.keyword}?`,
    `Como comparar opções ligadas a ${topic.keyword} com mais segurança?`,
    'Quando vale usar simuladores, comparadores e calculadoras?'
  ].map((question) => {
    return {
      question,
      answer: buildFaqAnswer(question, topic)
    };
  });

  const conclusion = [
    `A melhor decisão em ${topic.keyword} costuma nascer de uma comparação simples, mas completa. Quando você entende taxa, CET, prazo e impacto no orçamento, fica mais fácil perceber o que realmente faz sentido.`,
    `Se o objetivo é avançar com clareza, vale usar simuladores, comparar opções equivalentes e revisar se a escolha respeita o seu momento financeiro.`
  ];

  const internalLinks = pickInternalLinks(topic, cluster, allTopics);
  const canonicalUrl = `${SITE_URL}/blog/${topic.slug}`;

  const article = {
    id: `seo-${topic.slug}`,
    clusterId: cluster.id,
    clusterLabel: cluster.label,
    category: cluster.category,
    title: topic.title,
    slug: topic.slug,
    seoTitle: `${topic.title} | Cote Juros`,
    metaDescription: `${topic.title}. Veja critérios práticos para comparar custo, risco e próximos passos com mais clareza.`,
    h1: topic.title,
    summary: `${topic.title}. Entenda pontos de atenção, veja o que comparar e avance com mais clareza antes de decidir.`,
    intro,
    sections,
    faq,
    conclusion,
    cta: template.cta,
    internalLinks,
    image: cluster.articleImage,
    author: template.editorial.defaultAuthor,
    publishDate: new Date(DEFAULT_PUBLISH_START.getTime() + index * 86400000).toISOString(),
    readTime: estimateReadTime([intro, ...sections, faq.map((item) => item.answer), conclusion]),
    keywords: [topic.keyword, cluster.primaryKeyword, cluster.category.toLowerCase()],
    canonicalUrl,
    faqSchema: faq,
    content: [...intro, ...sections.flatMap((section) => [section.heading, ...section.paragraphs, ...(section.bullets || [])]), ...faq.flatMap((item) => [item.question, item.answer]), ...conclusion].join('\n\n')
  };

  return article;
};

const toArticleManifest = (articles) =>
  articles.map((article) => ({
    id: article.id,
    clusterId: article.clusterId,
    clusterLabel: article.clusterLabel,
    category: article.category,
    title: article.title,
    slug: article.slug,
    seoTitle: article.seoTitle,
    metaDescription: article.metaDescription,
    h1: article.h1,
    summary: article.summary,
    image: article.image,
    author: article.author,
    publishDate: article.publishDate,
    readTime: article.readTime,
    canonicalUrl: article.canonicalUrl,
    keywords: article.keywords
  }));

const toJsModule = (articles) => `export const generatedArticles = ${JSON.stringify(toArticleManifest(articles), null, 2)};\n`;

const parseArgs = (argv = []) =>
  argv.reduce((acc, arg) => {
    if (arg === '--dry-run') acc.dryRun = true;
    if (arg === '--all') acc.all = true;
    if (arg.startsWith('--cluster=')) acc.cluster = arg.split('=')[1];
    if (arg.startsWith('--slug=')) acc.slug = arg.split('=')[1];
    return acc;
  }, { dryRun: false, all: false, cluster: null, slug: null });

export const buildSeoArtifacts = (options = {}) => {
  const clusters = parseJsonFile(clustersPath);
  const template = parseJsonFile(templatePath);
  const expandedTopics = expandTopics(clusters);

  let filteredTopics = expandedTopics;
  if (options.cluster) filteredTopics = filteredTopics.filter((topic) => topic.clusterId === options.cluster);
  if (options.slug) filteredTopics = filteredTopics.filter((topic) => topic.slug === options.slug);

  const articles = filteredTopics.map((topic, index) => {
    const cluster = clusters.find((item) => item.id === topic.clusterId);
    return buildArticle(topic, cluster, template, expandedTopics, index);
  });

  return {
    clusters,
    topics: expandedTopics,
    filteredTopics,
    articles
  };
};

export const writeSeoArtifacts = ({ topics, articles }) => {
  mkdirSync(generatedRoot, { recursive: true });
  mkdirSync(publicArticlesRoot, { recursive: true });

  const manifest = toArticleManifest(articles);

  writeFileSync(topicsPath, JSON.stringify(topics, null, 2), 'utf8');
  writeFileSync(manifestPath, JSON.stringify(articles.map((article) => ({
    slug: article.slug,
    title: article.title,
    category: article.category,
    clusterId: article.clusterId,
    canonicalUrl: article.canonicalUrl,
    relatedLinks: article.internalLinks.map((link) => link.path)
  })), null, 2), 'utf8');
  writeFileSync(publicArticlesIndexPath, JSON.stringify(manifest, null, 2), 'utf8');
  articles.forEach((article) => {
    writeFileSync(resolve(publicArticlesRoot, `${article.slug}.json`), JSON.stringify(article, null, 2), 'utf8');
  });
  writeFileSync(generatedArticlesPath, toJsModule(articles), 'utf8');
};

export const runSeoGeneration = (argv = process.argv.slice(2)) => {
  const options = parseArgs(argv);
  const artifacts = buildSeoArtifacts(options);

  if (!options.dryRun) {
    writeSeoArtifacts(artifacts);
  }

  return {
    options,
    topicCount: artifacts.topics.length,
    generatedCount: artifacts.articles.length
  };
};
