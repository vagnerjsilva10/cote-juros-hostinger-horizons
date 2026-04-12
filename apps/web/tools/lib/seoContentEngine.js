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

const CLUSTER_THEMES = {
  emprestimos: {
    palette: ['#eff6ff', '#dbeafe', '#1d4ed8', '#0f172a'],
    accent: 'Empréstimos',
    icon: 'loan'
  },
  cartoes: {
    palette: ['#f8fafc', '#e2e8f0', '#0f172a', '#2563eb'],
    accent: 'Cartões',
    icon: 'card'
  },
  score: {
    palette: ['#f0fdf4', '#dcfce7', '#15803d', '#052e16'],
    accent: 'Score',
    icon: 'score'
  },
  'organizacao-financeira': {
    palette: ['#fff7ed', '#ffedd5', '#ea580c', '#431407'],
    accent: 'Planejamento',
    icon: 'planning'
  },
  'comparadores-simulacoes': {
    palette: ['#f5f3ff', '#ede9fe', '#7c3aed', '#2e1065'],
    accent: 'Simulações',
    icon: 'chart'
  },
  'dividas-renegociacao': {
    palette: ['#fef2f2', '#fee2e2', '#dc2626', '#450a0a'],
    accent: 'Renegociação',
    icon: 'warning'
  },
  'financiamento-credito': {
    palette: ['#ecfeff', '#cffafe', '#0891b2', '#083344'],
    accent: 'Financiamento',
    icon: 'house'
  },
  'educacao-financeira-pratica': {
    palette: ['#faf5ff', '#f3e8ff', '#9333ea', '#3b0764'],
    accent: 'Educação financeira',
    icon: 'growth'
  }
};

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

  return Math.max(7, Math.round(words / 190));
};

const hashString = (value = '') =>
  Array.from(String(value)).reduce((acc, char) => ((acc * 31) + char.charCodeAt(0)) % 1000000007, 7);

const pickFromArray = (items = [], seed = 0) => items[seed % items.length];

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
  const slugSource = cluster.topics[type].slugPattern || replaceTokens(cluster.topics[type].keywordPattern, { value });

  return {
    slug: slugify(slugSource),
    keyword: replaceTokens(cluster.topics[type].keywordPattern, { value }),
    title: replaceTokens(cluster.topics[type].titlePattern, { value }),
    intent: type === 'amount' ? 'alta-intencao' : type === 'profiles' ? 'comparacao' : 'informacional',
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

const buildEditorialTitle = (topic, cluster) => {
  if (topic.generatedFrom === 'amount') {
    return `${capitalize(cluster.primaryKeyword)} de ${topic.recipeValue} reais: quanto custa, que parcela esperar e como comparar sem erro`;
  }

  if (topic.generatedFrom === 'score' && cluster.id === 'cartoes') {
    return `Cartão de crédito para score ${topic.recipeValue}: o que observar para aumentar sua chance de aprovação`;
  }

  if (topic.generatedFrom === 'profiles') {
    return `${capitalize(cluster.primaryKeyword)} para ${topic.recipeValue}: o que costuma pesar na análise e como se preparar`;
  }

  if (cluster.id === 'educacao-financeira-pratica' && topic.keyword.includes('quem ganha pouco')) {
    return 'Como organizar suas finanças mesmo ganhando pouco: estratégias que realmente funcionam';
  }

  if (cluster.id === 'financiamento-credito' && topic.keyword.includes('financiar imóvel')) {
    return 'Como financiar um imóvel com segurança: guia completo para evitar erros caros';
  }

  return topic.title;
};

const buildSummary = (title, cluster) =>
  `${title}. Veja como comparar custo, risco e impacto no orçamento com exemplos práticos e critérios que realmente importam na decisão.`;

const buildMetaDescription = (title, cluster, topic) => {
  const endings = [
    'Entenda o que comparar, quais erros evitar e como decidir com mais clareza.',
    'Veja critérios práticos para analisar custo total, parcela e risco antes de seguir.',
    'Aprenda a ler taxa, CET, prazo e impacto no orçamento sem cair em atalhos ruins.'
  ];

  return `${title}. ${pickFromArray(endings, hashString(topic.slug))}`;
};

const buildInternalLinks = (topic, cluster, allTopics) => {
  const sameCluster = allTopics.filter((item) => item.clusterId === topic.clusterId && item.slug !== topic.slug).slice(0, 2);
  const relatedClusterArticles = allTopics.filter((item) => cluster.relatedClusters.includes(item.clusterId)).slice(0, 2);

  const hubLinks = cluster.supportPaths.slice(0, 3).map((path) => ({
    path,
    title: titleCase(path.replace(/\//g, ' ').replace(/-/g, ' ')).trim(),
    anchor:
      path === '/simulador-emprestimo'
        ? 'simular cenários com mais clareza'
        : `explorar ${titleCase(path.split('/').pop()?.replace(/-/g, ' ') || cluster.primaryKeyword).toLowerCase()}`
  }));

  const articleLinks = [...sameCluster, ...relatedClusterArticles].slice(0, 3).map((item) => ({
    path: `/blog/${item.slug}`,
    title: item.title,
    anchor: item.keyword
  }));

  return [...hubLinks, ...articleLinks].slice(0, 5);
};

const buildIntroduction = (topic, cluster, title) => [
  `${title} é uma busca comum de quem precisa tomar uma decisão financeira com mais segurança, sem olhar só para promessa de aprovação ou parcela pequena. O ponto central aqui é ${topic.angle}.`,
  `Neste guia, você vai encontrar critérios práticos para comparar ofertas, entender custo total, ler o impacto no orçamento e enxergar quando faz sentido avançar, esperar ou buscar alternativas.`
];

const buildContextParagraphs = (topic, cluster) => [
  `${capitalize(topic.keyword)} costuma ganhar relevância quando o orçamento já está apertado, a decisão envolve urgência ou o leitor quer evitar um erro caro. Nesse cenário, comparar com método vale mais do que reagir à primeira oferta disponível.`,
  `Antes de seguir, faça três perguntas: qual problema esse produto resolve agora, quanto a parcela pode comprometer da renda e qual é o custo total da decisão no horizonte completo. Esse filtro simples já elimina boa parte das escolhas ruins.`
];

const buildComparisonParagraphs = (topic, cluster) => [
  `Ao analisar ${topic.keyword}, olhe principalmente ${cluster.decisionChecklist.join(', ')}. Em finanças, pequenos ajustes de taxa, prazo ou exigência de perfil podem gerar uma diferença grande no valor final pago.`,
  `Também vale observar o que não aparece com destaque na divulgação: seguros embutidos, exigência de relacionamento, limite real aprovado, flexibilidade para antecipar parcelas e risco de pressionar demais o caixa do mês.`
];

const buildExampleParagraphs = (topic, cluster) => {
  if (topic.generatedFrom === 'amount') {
    const value = formatValue(topic.recipeValue);
    return [
      `Em um pedido de ${value}, a mesma quantia pode caber no bolso ou virar um peso difícil de carregar dependendo do prazo e do CET. Uma parcela mais baixa parece confortável no curto prazo, mas pode esconder um custo final muito maior.`,
      `Por isso, vale sempre simular pelo menos três cenários equivalentes: prazo curto, prazo intermediário e prazo longo. Assim, você entende o equilíbrio entre prestação mensal, total pago e folga para manter o orçamento saudável.`
    ];
  }

  if (topic.generatedFrom === 'profiles') {
    return [
      `Quando o tema envolve ${topic.recipeValue}, a leitura de risco costuma considerar estabilidade de renda, capacidade de comprovação, histórico recente e relação entre dívida e ganho mensal. Isso muda de instituição para instituição, mas o raciocínio central é parecido.`,
      `Na prática, quem se apresenta com documentos organizados, objetivo claro e simulação consistente costuma tomar decisões melhores e evita cair em linhas incompatíveis com o próprio momento.`
    ];
  }

  if (cluster.id === 'score') {
    return [
      `No caso do score, a melhora quase nunca vem de um único movimento isolado. O que pesa mais é consistência: contas em dia, uso equilibrado do crédito e menos sinais de pressão financeira no curto prazo.`,
      `Por isso, não faz sentido buscar atalhos mágicos. O melhor caminho costuma ser organizar o fluxo do mês, reduzir atrasos e construir histórico positivo ao longo do tempo.`
    ];
  }

  return [
    `Uma análise segura fica mais fácil quando você compara cenários equivalentes e transforma a decisão em um processo objetivo. Em vez de decidir pela urgência, vale montar uma leitura simples entre custo, prazo, flexibilidade e impacto mensal.`,
    `Esse tipo de organização também ajuda a perceber quando a oferta parece boa só na vitrine. Muitas vezes, o que faz diferença não é a chamada principal, mas o peso total da operação no orçamento real.`
  ];
};

const buildMistakeParagraphs = (topic) => [
  `Os erros mais caros costumam aparecer quando a decisão acontece sem comparação padronizada, leitura de contrato e revisão do orçamento. É assim que muita gente aceita uma condição aparentemente simples e descobre depois que o custo era bem mais alto.`,
  `Quanto mais previsível for o impacto dessa escolha na sua rotina, maior a chance de o crédito cumprir um papel útil em vez de abrir um problema novo. Clareza antes de contratar vale mais do que velocidade na aprovação.`
];

const buildFaqItems = (topic, cluster) => {
  const seededThemes = (cluster.faqThemes || []).slice(0, 2).map((question) => replaceTokens(question, { keyword: topic.keyword }));
  const questions = [
    ...seededThemes,
    `Qual é o principal erro ao avaliar ${topic.keyword}?`
  ];

  return questions.map((question, index) => {
    if (index === 0) {
      return {
        question,
        answer: `O ponto mais importante é comparar a decisão pelo custo total e pelo impacto no orçamento, e não só pela facilidade de contratação. Quando você olha taxa, CET, prazo e contexto de uso ao mesmo tempo, fica mais fácil perceber se a escolha realmente faz sentido.`
      };
    }

    if (index === 1) {
      return {
        question,
        answer: `O ideal é colocar propostas equivalentes lado a lado, sempre com o mesmo valor, prazo e perfil. Isso ajuda a enxergar diferença de exigência, flexibilidade, custo final e risco de apertar demais o mês.`
      };
    }

    return {
      question,
      answer: `O erro mais comum é decidir com base em urgência, propaganda ou parcela aparente, sem revisar contrato, CET e impacto no caixa. Em finanças, uma decisão mal calibrada pesa por meses ou anos.`
    };
  });
};

const buildConclusion = (topic) => [
  `A melhor decisão sobre ${topic.keyword} costuma nascer de uma comparação simples, mas completa. Quando você entende taxa, CET, prazo e impacto no orçamento, fica muito mais fácil separar o que parece bom do que realmente é saudável para o seu momento.`,
  `Antes de avançar, vale usar simuladores, revisar cenários equivalentes e confirmar se a escolha preserva sua margem mensal. Crédito funciona melhor quando entra como ferramenta e não como mais uma fonte de pressão.`
];

const buildArticleIllustration = (topic, cluster, index) => {
  const theme = CLUSTER_THEMES[cluster.id] || CLUSTER_THEMES['educacao-financeira-pratica'];
  const [bgStart, bgEnd, accent, ink] = theme.palette;
  const label = theme.accent.toUpperCase();
  const slugSeed = hashString(topic.slug);
  const title = buildEditorialTitle(topic, cluster);
  const shortTitle = title.length > 54 ? `${title.slice(0, 51)}...` : title;
  const bars = [52, 94, 138, 182].map((x, idx) => {
    const height = 40 + ((slugSeed + idx * 17) % 90);
    const y = 224 - height;
    return `<rect x="${x}" y="${y}" width="24" height="${height}" rx="10" fill="${accent}" opacity="${0.18 + idx * 0.14}" />`;
  }).join('');

  const linePath = `M36 ${176 - (slugSeed % 22)} C94 ${108 + (slugSeed % 28)}, 148 ${180 - (slugSeed % 33)}, 204 ${118 + (slugSeed % 26)} S308 ${86 + (slugSeed % 34)}, 372 ${66 + (slugSeed % 18)}`;

  const iconMap = {
    loan: '<circle cx="360" cy="88" r="18" fill="none" stroke-width="3" /><path d="M346 88h28M360 74v28" stroke-width="3" stroke-linecap="round" />',
    card: '<rect x="338" y="68" width="48" height="32" rx="8" fill="none" stroke-width="3" /><path d="M344 82h36" stroke-width="3" stroke-linecap="round" />',
    score: '<path d="M338 102l16-22 14 12 18-28" fill="none" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" /><circle cx="338" cy="102" r="4" /><circle cx="354" cy="80" r="4" /><circle cx="368" cy="92" r="4" /><circle cx="386" cy="64" r="4" />',
    planning: '<rect x="338" y="66" width="52" height="38" rx="10" fill="none" stroke-width="3" /><path d="M352 84h24M352 94h16" stroke-width="3" stroke-linecap="round" />',
    chart: '<path d="M338 102h52" fill="none" stroke-width="3" stroke-linecap="round" /><path d="M344 96l10-12 10 8 14-18 10 6" fill="none" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />',
    warning: '<path d="M364 66l24 40a8 8 0 0 1-7 12h-34a8 8 0 0 1-7-12l17-28z" fill="none" stroke-width="3" stroke-linejoin="round" /><path d="M364 84v12M364 104h.01" stroke-width="3" stroke-linecap="round" />',
    house: '<path d="M338 90l26-20 26 20" fill="none" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" /><path d="M346 88v24h36V88" fill="none" stroke-width="3" stroke-linejoin="round" />',
    growth: '<path d="M340 106c8-18 18-28 30-28 10 0 16 5 22 14 4-14 12-24 24-30" fill="none" stroke-width="3" stroke-linecap="round" />'
  };

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="720" viewBox="0 0 1200 720" role="img" aria-label="${title}">
      <defs>
        <linearGradient id="bg-${slugSeed}" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${bgStart}" />
          <stop offset="100%" stop-color="${bgEnd}" />
        </linearGradient>
      </defs>
      <rect width="1200" height="720" fill="url(#bg-${slugSeed})" />
      <rect x="52" y="58" width="1096" height="604" rx="32" fill="rgba(255,255,255,0.78)" />
      <rect x="84" y="96" width="212" height="38" rx="19" fill="${accent}" opacity="0.14" />
      <text x="110" y="121" font-family="Inter, Arial, sans-serif" font-size="24" font-weight="700" fill="${accent}" letter-spacing="1.6">${label}</text>
      <text x="84" y="208" font-family="Inter, Arial, sans-serif" font-size="58" font-weight="800" fill="${ink}">${shortTitle.replace(/&/g, '&amp;')}</text>
      <text x="84" y="268" font-family="Inter, Arial, sans-serif" font-size="28" font-weight="500" fill="${ink}" opacity="0.72">${cluster.label}</text>
      <g transform="translate(0 18)">
        <rect x="730" y="140" width="372" height="254" rx="28" fill="white" />
        <path d="${linePath}" fill="none" stroke="${accent}" stroke-width="10" stroke-linecap="round" />
        ${bars}
        <g transform="translate(712 12)" fill="none" stroke="${ink}" stroke="${ink}">
          ${iconMap[theme.icon] || iconMap.growth}
        </g>
      </g>
      <rect x="84" y="560" width="264" height="18" rx="9" fill="${accent}" opacity="0.16" />
      <rect x="84" y="596" width="318" height="18" rx="9" fill="${ink}" opacity="0.08" />
      <rect x="730" y="450" width="372" height="96" rx="26" fill="${accent}" opacity="0.1" />
      <text x="764" y="506" font-family="Inter, Arial, sans-serif" font-size="26" font-weight="700" fill="${accent}">Guia editorial Cote Juros</text>
    </svg>
  `.trim();

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};

const buildArticle = (topic, cluster, template, allTopics, index) => {
  const title = buildEditorialTitle(topic, cluster);
  const intro = buildIntroduction(topic, cluster, title);
  const sections = [
    {
      heading: `Quando ${topic.keyword} faz sentido na prática`,
      paragraphs: buildContextParagraphs(topic, cluster)
    },
    {
      heading: 'O que comparar antes de seguir',
      paragraphs: buildComparisonParagraphs(topic, cluster),
      bullets: cluster.decisionChecklist
    },
    {
      heading: 'Como analisar com mais segurança',
      paragraphs: buildExampleParagraphs(topic, cluster),
      bullets: cluster.stepFramework
    },
    {
      heading: 'Erros que costumam sair caro',
      paragraphs: buildMistakeParagraphs(topic),
      bullets: cluster.commonMistakes
    }
  ];

  const faq = buildFaqItems(topic, cluster);
  const conclusion = buildConclusion(topic);
  const internalLinks = buildInternalLinks(topic, cluster, allTopics);
  const canonicalUrl = `${SITE_URL}/blog/${topic.slug}`;

  return {
    id: `seo-${topic.slug}`,
    clusterId: cluster.id,
    clusterLabel: cluster.label,
    category: cluster.category,
    title,
    slug: topic.slug,
    seoTitle: `${title} | Cote Juros`,
    metaDescription: buildMetaDescription(title, cluster, topic),
    h1: title,
    summary: buildSummary(title, cluster),
    intro,
    sections,
    faq,
    conclusion,
    cta: template.cta,
    internalLinks,
    image: buildArticleIllustration(topic, cluster, index),
    author: template.editorial.defaultAuthor,
    publishDate: new Date(DEFAULT_PUBLISH_START.getTime() + index * 86400000).toISOString(),
    readTime: estimateReadTime([intro, ...sections, faq.map((item) => item.answer), conclusion]),
    keywords: [topic.keyword, cluster.primaryKeyword, cluster.category.toLowerCase()],
    canonicalUrl,
    faqSchema: faq,
    content: [...intro, ...sections.flatMap((section) => [section.heading, ...section.paragraphs, ...(section.bullets || [])]), ...faq.flatMap((item) => [item.question, item.answer]), ...conclusion].join('\n\n')
  };
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
  writeFileSync(
    manifestPath,
    JSON.stringify(
      articles.map((article) => ({
        slug: article.slug,
        title: article.title,
        category: article.category,
        clusterId: article.clusterId,
        canonicalUrl: article.canonicalUrl,
        relatedLinks: article.internalLinks.map((link) => link.path)
      })),
      null,
      2
    ),
    'utf8'
  );
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
