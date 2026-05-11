import { ArticleFactoryService } from './articleFactoryService.js';
import { SeoGrowthService } from './seoGrowthService.js';
import { getPrisma } from '../lib/prisma.js';
import { EditorialTopicFatigueService } from './editorialTopicFatigueService.js';

const SITE_BASE_URL = (process.env.SITE_BASE_URL || 'https://www.cotejuros.com.br').replace(/\/$/, '');

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const normalize = (value = '') =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

const toSlug = (value = '') =>
  normalize(value)
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

const unique = (items = []) => Array.from(new Set(items.filter(Boolean)));

const SEO_CLUSTER_STRATEGY = Object.freeze([
  {
    cluster: 'score',
    priority: 95,
    difficulty: 'media',
    cpcPotential: 'alto',
    volumePotential: 'alto',
    primaryIntent: 'educativo + decisorio',
    funnel: ['topo', 'meio', 'faq'],
    seedKeywords: ['score de credito', 'como aumentar score', 'score baixo consegue emprestimo', 'score para financiamento']
  },
  {
    cluster: 'negativado',
    priority: 100,
    difficulty: 'alta',
    cpcPotential: 'muito alto',
    volumePotential: 'alto',
    primaryIntent: 'comercial + comparativo',
    funnel: ['meio', 'comparativo', 'high_cpc', 'faq'],
    seedKeywords: ['emprestimo para negativado', 'cartao para negativado', 'nome sujo consegue credito', 'credito para negativado online']
  },
  {
    cluster: 'emprestimo',
    priority: 98,
    difficulty: 'alta',
    cpcPotential: 'muito alto',
    volumePotential: 'muito alto',
    primaryIntent: 'comparativo + transacional',
    funnel: ['meio', 'comparativo', 'high_cpc', 'long_tail'],
    seedKeywords: ['emprestimo pessoal online', 'simulacao de emprestimo', 'emprestimo com menor juros', 'emprestimo com garantia']
  },
  {
    cluster: 'cartao',
    priority: 86,
    difficulty: 'alta',
    cpcPotential: 'alto',
    volumePotential: 'alto',
    primaryIntent: 'comparativo + decisorio',
    funnel: ['topo', 'meio', 'comparativo', 'faq'],
    seedKeywords: ['cartao de credito para negativado', 'cartao sem anuidade', 'cartao consignado vale a pena', 'aumentar limite do cartao']
  },
  {
    cluster: 'FGTS',
    priority: 88,
    difficulty: 'media',
    cpcPotential: 'alto',
    volumePotential: 'medio-alto',
    primaryIntent: 'transacional + decisorio',
    funnel: ['meio', 'high_cpc', 'long_tail', 'faq'],
    seedKeywords: ['antecipacao fgts vale a pena', 'emprestimo fgts', 'saldo fgts bloqueado', 'saque aniversario emprestimo']
  },
  {
    cluster: 'consignado',
    priority: 90,
    difficulty: 'media-alta',
    cpcPotential: 'muito alto',
    volumePotential: 'alto',
    primaryIntent: 'comercial + comparativo',
    funnel: ['meio', 'comparativo', 'high_cpc'],
    seedKeywords: ['emprestimo consignado INSS', 'consignado privado CLT', 'margem consignavel', 'portabilidade consignado']
  },
  {
    cluster: 'financiamento',
    priority: 84,
    difficulty: 'alta',
    cpcPotential: 'muito alto',
    volumePotential: 'alto',
    primaryIntent: 'decisorio + comparativo',
    funnel: ['topo', 'meio', 'comparativo', 'high_cpc'],
    seedKeywords: ['financiamento de veiculo', 'financiamento sem entrada', 'score para financiamento', 'financiamento imovel sem entrada']
  },
  {
    cluster: 'dividas',
    priority: 92,
    difficulty: 'media',
    cpcPotential: 'medio-alto',
    volumePotential: 'muito alto',
    primaryIntent: 'educativo + decisorio',
    funnel: ['topo', 'meio', 'faq', 'long_tail'],
    seedKeywords: ['como sair das dividas', 'divida do cartao', 'juros do rotativo', 'superendividamento']
  },
  {
    cluster: 'renegociacao',
    priority: 89,
    difficulty: 'media',
    cpcPotential: 'medio-alto',
    volumePotential: 'alto',
    primaryIntent: 'decisorio + tutorial',
    funnel: ['topo', 'meio', 'faq'],
    seedKeywords: ['renegociacao de dividas', 'como limpar o nome', 'acordo de divida vale a pena', 'renegociar divida do cartao']
  },
  {
    cluster: 'credito pessoal',
    priority: 94,
    difficulty: 'alta',
    cpcPotential: 'muito alto',
    volumePotential: 'alto',
    primaryIntent: 'comercial + comparativo',
    funnel: ['meio', 'comparativo', 'high_cpc', 'long_tail'],
    seedKeywords: ['credito pessoal online', 'emprestimo pessoal com menor juros', 'credito pessoal para autonomo', 'credito pessoal sem garantia']
  }
]);

const INTENT_PROFILES = Object.freeze({
  topo: {
    label: 'topo de funil',
    formats: ['guia explicativo', 'mitos e verdades', 'glossario financeiro'],
    ctaStyle: 'educativo'
  },
  meio: {
    label: 'meio de funil',
    formats: ['como comparar', 'quando vale a pena', 'checklist'],
    ctaStyle: 'comparacao'
  },
  comparativo: {
    label: 'comparativo',
    formats: ['alternativa A vs B', 'ranking editorial criterioso', 'tabela de decisao'],
    ctaStyle: 'comparar opcoes'
  },
  high_cpc: {
    label: 'high CPC',
    formats: ['decisao comercial com cautela', 'simulacao', 'produto financeiro explicado'],
    ctaStyle: 'conversao assistida'
  },
  long_tail: {
    label: 'long tail',
    formats: ['resposta direta', 'cenario numerico', 'pergunta especifica'],
    ctaStyle: 'proximo passo leve'
  },
  faq: {
    label: 'FAQ/search intent',
    formats: ['pergunta e resposta', 'snippet direto', 'bloco de duvidas'],
    ctaStyle: 'link contextual'
  }
});

const LOW_COMPETITION_MODIFIERS = [
  'vale a pena',
  'como funciona',
  'sem garantia',
  'com score baixo',
  'com nome sujo',
  'sem taxa antecipada',
  'para autonomo',
  'para CLT',
  'para MEI',
  'com renda baixa',
  'passo a passo',
  'o que comparar'
];

const QUESTION_TEMPLATES = [
  '{keyword} vale a pena?',
  'como conseguir {keyword}?',
  '{keyword} aprova na hora?',
  '{keyword} tem taxa antecipada?',
  'qual o risco de {keyword}?',
  'o que olhar antes de contratar {keyword}?',
  '{keyword} compensa para quem ganha pouco?',
  '{keyword} ajuda a limpar nome?'
];

const COMPARISON_TEMPLATES = [
  '{keyword} ou renegociacao de divida',
  '{keyword} ou cartao de credito',
  '{keyword} com garantia ou sem garantia',
  '{keyword} banco ou financeira',
  '{keyword} vs consignado',
  '{keyword} vs antecipacao FGTS'
];

const CONVERSATIONAL_TEMPLATES = [
  'tenho score {score} consigo emprestimo?',
  'quanto fica parcela de {amount} em {months}x',
  'nome sujo impede financiamento?',
  'vale trocar divida do cartao por emprestimo?',
  'consigo credito com CPF negativado e renda baixa?',
  'qual emprestimo tem menor risco para negativado?'
];

const SCORE_VALUES = ['300', '400', '500', '600'];
const AMOUNTS = ['1000', '3000', '5000', '10000'];
const MONTHS = ['12', '18', '24', '36'];

const DIVERSITY_PLAYBOOK = Object.freeze([
  {
    format: 'decisao opinativa',
    introPattern: 'comecar com uma pergunta incomoda e uma resposta curta',
    tablePattern: 'criterio | como avaliar | sinal de alerta',
    storyPattern: 'orcamento familiar apertado',
    ctaPattern: 'comparar sem promessa'
  },
  {
    format: 'simulacao numerica',
    introPattern: 'comecar pelo exemplo em reais',
    tablePattern: 'valor | prazo | parcela | custo total',
    storyPattern: 'parcela que parece pequena mas pesa no mes ruim',
    ctaPattern: 'simular antes de contratar'
  },
  {
    format: 'anti-golpe',
    introPattern: 'comecar pelo alerta de taxa antecipada/promessa',
    tablePattern: 'sinal | por que preocupa | o que fazer',
    storyPattern: 'pressa e atendimento informal',
    ctaPattern: 'verificar e comparar canais confiaveis'
  },
  {
    format: 'comparativo humano',
    introPattern: 'comecar pelo dilema real do leitor',
    tablePattern: 'alternativa | quando faz sentido | risco',
    storyPattern: 'trocar uma divida por outra',
    ctaPattern: 'escolher a alternativa mais segura'
  },
  {
    format: 'FAQ premium',
    introPattern: 'comecar com resposta direta de 2 frases',
    tablePattern: 'pergunta | resposta curta | detalhe importante',
    storyPattern: 'duvida especifica de busca conversacional',
    ctaPattern: 'aprofundar no hub do cluster'
  }
]);

const estimateAdsenseFit = ({ funnel = [], cpcPotential = '' }) => {
  const base = cpcPotential === 'muito alto' ? 35 : cpcPotential === 'alto' ? 28 : cpcPotential === 'medio-alto' ? 22 : 15;
  const commercialBoost = funnel.includes('high_cpc') ? 22 : funnel.includes('comparativo') ? 16 : 8;
  const longTailBoost = funnel.includes('long_tail') || funnel.includes('faq') ? 12 : 6;
  return clamp(base + commercialBoost + longTailBoost, 0, 100);
};

const classifyKeyword = ({ keyword = '', cluster = {} } = {}) => {
  const text = normalize(keyword);
  const intent = /quanto|parcela|simul|em \d+x/.test(text)
    ? 'long_tail'
    : /vs| ou |compar|melhor|menor juros/.test(text)
      ? 'comparativo'
      : /vale a pena|consegue|aprova|impede|taxa/.test(text)
        ? 'faq'
        : /emprestimo|credito|cartao|financiamento|consignado|fgts/.test(text)
          ? 'high_cpc'
          : 'topo';
  const difficulty = text.split(/\s+/).length >= 5 ? 'baixa-media' : cluster.difficulty || 'media';
  const cpcPotential = /emprestimo|credito|financiamento|consignado|cartao/.test(text)
    ? 'alto'
    : cluster.cpcPotential || 'medio';

  return {
    intent,
    intentLabel: INTENT_PROFILES[intent]?.label || intent,
    difficulty,
    cpcPotential,
    funnelStage: intent === 'topo' ? 'topo' : intent === 'faq' || intent === 'long_tail' ? 'meio' : 'meio/fundo'
  };
};

const expandSeedKeyword = ({ seed, cluster }) => {
  const modifierKeywords = LOW_COMPETITION_MODIFIERS.map((modifier) => `${seed} ${modifier}`);
  const questions = QUESTION_TEMPLATES.map((template) => template.replace('{keyword}', seed));
  const comparisons = COMPARISON_TEMPLATES.map((template) => template.replace('{keyword}', seed));
  const conversational = CONVERSATIONAL_TEMPLATES.flatMap((template) => {
    if (template.includes('{score}')) return SCORE_VALUES.map((score) => template.replace('{score}', score));
    if (template.includes('{amount}') || template.includes('{months}')) {
      return AMOUNTS.flatMap((amount) => MONTHS.map((months) => template.replace('{amount}', amount).replace('{months}', months)));
    }
    return [template];
  });

  return unique([...modifierKeywords, ...questions, ...comparisons, ...conversational])
    .map((keyword) => ({
      keyword,
      slug: toSlug(keyword),
      cluster: cluster.cluster,
      sourceSeed: seed,
      ...classifyKeyword({ keyword, cluster }),
      recommendedFormat: INTENT_PROFILES[classifyKeyword({ keyword, cluster }).intent]?.formats?.[0] || 'guia premium',
      adsenseFit: estimateAdsenseFit({ funnel: cluster.funnel, cpcPotential: cluster.cpcPotential })
    }));
};

const buildHubPath = (cluster) => `/blog/hub/${toSlug(cluster.cluster)}`;

const buildInterlinkingPlan = ({ clusters = SEO_CLUSTER_STRATEGY, keywords = [] } = {}) => {
  const clusterByName = new Map(clusters.map((cluster) => [cluster.cluster, cluster]));
  const hubLinks = clusters.map((cluster) => ({
    cluster: cluster.cluster,
    hubPath: buildHubPath(cluster),
    anchorGuidelines: [
      `${cluster.cluster}: guia principal`,
      `comparar ${cluster.cluster} com seguranca`,
      `duvidas sobre ${cluster.cluster}`
    ],
    maxLinksPerArticle: 6,
    avoidAnchors: ['clique aqui', 'melhor opcao garantida', 'aprovacao garantida']
  }));

  const crossClusterRules = [
    ['score', 'emprestimo', 'score baixo consegue emprestimo'],
    ['score', 'financiamento', 'score para financiamento'],
    ['negativado', 'renegociacao', 'limpar nome antes de contratar credito'],
    ['negativado', 'cartao', 'cartao para negativado'],
    ['emprestimo', 'FGTS', 'antecipacao FGTS como alternativa'],
    ['emprestimo', 'consignado', 'comparar consignado e emprestimo pessoal'],
    ['dividas', 'renegociacao', 'renegociar antes de pegar novo credito'],
    ['financiamento', 'score', 'score baixo no financiamento']
  ].map(([from, to, anchor]) => ({
    fromCluster: from,
    toCluster: to,
    fromHub: buildHubPath(clusterByName.get(from) || { cluster: from }),
    toHub: buildHubPath(clusterByName.get(to) || { cluster: to }),
    anchor,
    rule: 'linkar apenas quando a secao tratar dessa decisao; evitar rodape repetitivo'
  }));

  const relatedArticleRules = keywords.slice(0, 50).map((item) => ({
    keyword: item.keyword,
    cluster: item.cluster,
    suggestedLinks: unique([
      buildHubPath(clusterByName.get(item.cluster) || { cluster: item.cluster }),
      '/emprestimos',
      item.cluster === 'cartao' ? '/cartoes' : null,
      item.cluster === 'financiamento' ? '/financiamentos' : null,
      '/diagnostico-financeiro'
    ]).slice(0, 4),
    anchorStyle: item.intent === 'faq'
      ? 'pergunta natural no meio do texto'
      : item.intent === 'comparativo'
        ? 'anchor descritiva de comparacao'
        : 'anchor semantica contextual'
  }));

  return {
    hubLinks,
    crossClusterRules,
    relatedArticleRules,
    guardrails: [
      'maximo 6 links internos por artigo premium',
      'no maximo 2 links comerciais acima da dobra',
      'variar anchors por contexto, nunca repetir a mesma anchor em lote',
      'linkar para hub quando o artigo for long tail',
      'linkar para artigo especifico quando a secao responder uma duvida adjacente'
    ]
  };
};

const buildScalePolicy = () => ({
  mode: 'premium-assisted-production',
  autoPublish: false,
  dailyLimits: {
    totalArticles: 5,
    perCluster: 2,
    highCpc: 2,
    sameIntent: 3,
    faqLongTail: 4
  },
  weeklyRamp: [
    { week: 1, articlesPerDay: 2, focus: 'validar qualidade e indexacao inicial' },
    { week: 2, articlesPerDay: 3, focus: 'preencher hubs prioritarios' },
    { week: 3, articlesPerDay: 4, focus: 'expandir long tails com Search Console' },
    { week: 4, articlesPerDay: 5, focus: 'manter cadencia e refresh assistido' }
  ],
  indexation: [
    'publicar primeiro pillars e comparativos de maior EEAT',
    'aguardar sinais de indexacao antes de explodir long tails',
    'usar sitemap e links internos gradualmente',
    'nao publicar centenas de URLs parecidas no mesmo dia'
  ],
  reviewGates: [
    'qualityScore.total >= 88',
    'anti_template_score >= 82',
    'human_readability_score >= 78',
    'tableCount >= 2 para high CPC',
    'sem promessa de aprovacao',
    'revisao humana obrigatoria antes de publicar'
  ]
});

const countTables = (article = {}) =>
  (Array.isArray(article.sections) ? article.sections : [])
    .filter((section) => section.table?.rows?.length >= 2)
    .length;

const countWords = (article = {}, fallbackWordCount = 0) => {
  if (Number(fallbackWordCount) > 0) return Number(fallbackWordCount);
  const text = [
    ...(article.intro || []),
    article.featuredSnippet,
    article.example,
    ...((article.sections || []).flatMap((section) => [
      section.heading,
      section.subheading,
      ...(section.paragraphs || []),
      ...(section.bullets || []),
      section.table?.caption,
      ...(section.table?.columns || []),
      ...((section.table?.rows || []).flat())
    ])),
    ...((article.faq || []).flatMap((item) => [item.question, item.answer])),
    ...(article.conclusion || [])
  ].filter(Boolean).join(' ');
  return text.split(/\s+/).filter(Boolean).length;
};

const enforceCanonicalSinglePublish = async ({ result, canonicalSlug }) => {
  const publishedRecord = result.articleRecord || {};
  if (!canonicalSlug || !publishedRecord.slug || publishedRecord.slug === canonicalSlug) return publishedRecord;

  const prisma = getPrisma();
  const [source, destination] = await Promise.all([
    prisma.article.findUnique({ where: { slug: publishedRecord.slug } }),
    prisma.article.findUnique({ where: { slug: canonicalSlug } })
  ]);

  if (!source || !destination || source.status !== 'published') return publishedRecord;
  if (source.structuredContent?.sourceType !== 'article-factory') return publishedRecord;

  const structuredContent = {
    ...(source.structuredContent || {}),
    slug: canonicalSlug,
    routePath: `/blog/${canonicalSlug}`,
    canonicalUrl: `${SITE_BASE_URL}/blog/${canonicalSlug}/`,
    factoryMigratedFrom: source.slug
  };

  const [canonicalRecord] = await prisma.$transaction([
    prisma.article.update({
      where: { id: destination.id },
      data: {
        title: source.title,
        content: source.content,
        excerpt: source.excerpt,
        categoryId: source.categoryId,
        author: source.author,
        seoTitle: source.seoTitle,
        seoDescription: source.seoDescription,
        coverImage: source.coverImage,
        ogImage: source.ogImage,
        readTime: source.readTime,
        wordCount: source.wordCount,
        structuredContent,
        status: 'published',
        publishedAt: new Date()
      }
    }),
    prisma.article.update({
      where: { id: source.id },
      data: {
        status: 'draft',
        publishedAt: null,
        structuredContent: {
          ...(source.structuredContent || {}),
          canonicalDisabled: true,
          manualDuplicateRetiredAt: new Date().toISOString()
        }
      }
    })
  ]);

  return canonicalRecord;
};

export class OrganicGrowthStrategyService {
  static buildClusterStrategy() {
    const clusters = SEO_CLUSTER_STRATEGY
      .map((cluster) => ({
        ...cluster,
        adsenseFit: estimateAdsenseFit(cluster),
        recommendedCadence: cluster.priority >= 95 ? '2 artigos/semana' : cluster.priority >= 88 ? '1-2 artigos/semana' : '1 artigo/semana',
        firstMove: cluster.funnel.includes('high_cpc')
          ? 'pillar + comparativo + FAQ long tail'
          : 'pillar + perguntas frequentes + interlinks'
      }))
      .sort((a, b) => b.priority - a.priority);

    return {
      ok: true,
      clusters,
      matrix: clusters.map((cluster) => ({
        cluster: cluster.cluster,
        prioridade: cluster.priority,
        dificuldade: cluster.difficulty,
        cpcPotencial: cluster.cpcPotential,
        volume: cluster.volumePotential,
        intencao: cluster.primaryIntent
      }))
    };
  }

  static expandKeywords({ limit = 250, cluster: onlyCluster = '' } = {}) {
    const clusters = SEO_CLUSTER_STRATEGY.filter((item) => !onlyCluster || item.cluster === onlyCluster);
    const items = clusters.flatMap((cluster) =>
      cluster.seedKeywords.flatMap((seed) => expandSeedKeyword({ seed, cluster }))
    );
    const seenSlugs = new Set();
    const deduped = unique(items.map((item) => item.keyword))
      .map((keyword) => items.find((item) => item.keyword === keyword))
      .filter((item) => {
        if (!item?.slug || seenSlugs.has(item.slug)) return false;
        seenSlugs.add(item.slug);
        return true;
      })
      .sort((a, b) => {
        if (b.adsenseFit !== a.adsenseFit) return b.adsenseFit - a.adsenseFit;
        if (a.difficulty !== b.difficulty) return a.difficulty.localeCompare(b.difficulty);
        return a.keyword.length - b.keyword.length;
      })
      .slice(0, Math.min(Number(limit) || 250, 2000));

    return {
      ok: true,
      count: deduped.length,
      items: deduped,
      examples: deduped.slice(0, 20)
    };
  }

  static buildEditorialDiversityPlan({ keyword = '', cluster = '' } = {}) {
    const selectedIndex = Math.abs([...normalize(keyword || cluster)].reduce((sum, char) => sum + char.charCodeAt(0), 0)) % DIVERSITY_PLAYBOOK.length;
    const selected = DIVERSITY_PLAYBOOK[selectedIndex];

    return {
      ok: true,
      selected,
      calendar: EditorialTopicFatigueService.calendarPolicy(),
      playbook: DIVERSITY_PLAYBOOK,
      antiFootprintRules: [
        'rotacionar abertura: pergunta, cena, numero, alerta ou comparacao',
        'variar ordem entre tabela, exemplo, risco e FAQ',
        'usar no maximo 1 frase de voz editorial recorrente por artigo',
        'alternar CTA educativo, comparativo e diagnostico',
        'nao repetir os mesmos headings entre artigos do mesmo cluster'
      ]
    };
  }

  static buildInterlinkingPlan({ limit = 120 } = {}) {
    const expanded = this.expandKeywords({ limit }).items;
    return {
      ok: true,
      ...buildInterlinkingPlan({ keywords: expanded })
    };
  }

  static async buildSearchConsoleFeedbackLoop({ limit = 25, minImpressions = 20 } = {}) {
    const opportunities = await SeoGrowthService.listSearchOpportunities({ limit, minImpressions });
    const items = (opportunities.items || []).map((item) => {
      const query = item.metric.query;
      const expansion = classifyKeyword({ keyword: query, cluster: {} });
      const actionType = item.metric.ctr < 0.015 && item.metric.impressions >= minImpressions
        ? 'ctr_rewrite'
        : item.metric.position >= 8 && item.metric.position <= 20
          ? 'push_to_top10'
          : 'keyword_expansion';

      return {
        ...item,
        actionType,
        expansion,
        suggestedAction: actionType === 'ctr_rewrite'
          ? 'reescrever title/meta em preview; nao aplicar automaticamente'
          : actionType === 'push_to_top10'
            ? 'adicionar bloco premium, FAQ e links internos em preview'
            : 'criar briefing long tail assistido',
        autoRefresh: false
      };
    });

    return {
      ok: true,
      autoRefresh: false,
      configured: SeoGrowthService.getSearchConsoleHealth().configured,
      range: opportunities.range || null,
      count: items.length,
      items,
      detectors: [
        'paginas com impressoes e baixo CTR',
        'queries emergentes sem artigo dedicado',
        'posicoes 8-20 candidatas a reforco',
        'possivel canibalizacao por queries repetidas em URLs diferentes',
        'artigos que precisam de refresh por queda de CTR'
      ]
    };
  }

  static buildSafeScalePlan() {
    return {
      ok: true,
      policy: buildScalePolicy(),
      risk: {
        currentFootprintRisk: 'medio',
        riskDrivers: [
          'motor deterministico ainda pode repetir padroes se publicar volume alto',
          'clusters high CPC atraem concorrencia forte e exigem EEAT alto',
          'long tails muito parecidas podem gerar canibalizacao'
        ],
        mitigations: [
          'usar diversity layer por keyword',
          'limitar artigos por cluster/dia',
          'priorizar hubs e interlinking antes de long tails em massa',
          'revisao humana obrigatoria em high CPC/YMYL'
        ]
      }
    };
  }

  static async createAssistedProductionPreview({
    keyword,
    topic,
    intent = 'comparativo',
    category = 'Emprestimos',
    triggerSource = 'premium-assisted-production'
  } = {}) {
    const cleanKeyword = keyword || topic;
    if (!cleanKeyword) throw new Error('keyword is required for premium-assisted-production');

    const result = await ArticleFactoryService.dryRun({
      keyword: cleanKeyword,
      topic: topic || cleanKeyword,
      intent,
      category,
      triggerSource
    });

    return {
      ok: true,
      mode: 'premium-assisted-production',
      autoPublish: false,
      dryRun: true,
      persisted: false,
      published: false,
      distributed: false,
      requiresHumanReview: true,
      reviewChecklist: buildScalePolicy().reviewGates,
      diversityPlan: this.buildEditorialDiversityPlan({ keyword: cleanKeyword, cluster: category }),
      result
    };
  }

  static async manualPublishOne({
    keyword,
    topic,
    intent = 'comparativo',
    category = 'Emprestimos',
    triggerSource = 'manual-premium-single-publish'
  } = {}) {
    const cleanKeyword = keyword || topic;
    if (!cleanKeyword) throw new Error('keyword is required for manual single publish');

    const result = await ArticleFactoryService.run({
      keyword: cleanKeyword,
      topic: topic || cleanKeyword,
      intent,
      category,
      dryRun: false,
      persist: true,
      publishApproved: true,
      triggerSource
    });

    const canonicalSlug = toSlug(cleanKeyword);
    const record = await enforceCanonicalSinglePublish({ result, canonicalSlug });
    const article = record.structuredContent || result.article?.structuredContent || {};
    const qualityScore = result.validation?.qualityScore || {};
    const slug = record.slug || result.slug;
    const url = article.canonicalUrl || `${SITE_BASE_URL}/blog/${slug}/`;
    const faqCount = Array.isArray(article.faq) ? article.faq.length : 0;
    const internalLinks = Array.isArray(article.internalLinks) ? article.internalLinks : [];

    return {
      ok: Boolean(result.ok && result.persisted && record.status === 'published'),
      mode: 'manual-single-publish',
      bulkPublish: false,
      cron: false,
      autoPublishMass: false,
      distributed: false,
      refreshAutomatic: false,
      publishedCount: record.status === 'published' ? 1 : 0,
      url,
      title: record.title || result.title,
      slug,
      canonicalUrl: article.canonicalUrl || url,
      metaDescription: record.metaDescription || article.metaDescription || result.article?.metaDescription || '',
      status: record.status,
      factoryStatus: result.status,
      publishedAt: record.publishedAt || null,
      scores: {
        editorial: qualityScore.total || 0,
        seo: qualityScore.seo_structure_score || 0,
        eeat: qualityScore.expert_authority_score || 0,
        factualDepth: qualityScore.factual_depth_score || 0,
        practicalValue: qualityScore.practical_value_score || 0,
        originality: qualityScore.originality_score || 0,
        antiTemplate: qualityScore.anti_template_score || 0,
        humanReadability: qualityScore.human_readability_score || 0
      },
      metrics: {
        wordCount: countWords(article, record.wordCount || article.wordCount),
        tableCount: countTables(article),
        faqCount,
        internalLinkCount: internalLinks.length
      },
      interlinks: internalLinks,
      searchConsoleReadiness: {
        readyForIndexing: record.status === 'published' && Boolean(article.canonicalUrl || url),
        canonicalValid: Boolean(article.canonicalUrl || url),
        schemaType: article.schema?.['@type'] || 'BlogPosting',
        thinContentRisk: countWords(article, record.wordCount || article.wordCount) >= 1800 ? 'baixo' : 'alto',
        aiSpamRisk: (qualityScore.anti_template_score || 0) >= 70 && (qualityScore.human_readability_score || 0) >= 70 ? 'baixo' : 'revisar'
      },
      validation: result.validation,
      topicFatigue: result.topicFatigue,
      publishSafety: result.publishSafety,
      article: record,
      guardrails: {
        oneArticleOnly: true,
        guardrailsUnchanged: true,
        cronDisabled: true,
        distributionDisabled: true,
        bulkPublishDisabled: true
      }
    };
  }

  static async buildGrowthPlan({ keyword = '', cluster = '', limit = 120, includeSearchConsole = false } = {}) {
    const clusters = this.buildClusterStrategy();
    const keywords = this.expandKeywords({ limit, cluster });
    const interlinking = this.buildInterlinkingPlan({ limit });
    const diversity = this.buildEditorialDiversityPlan({ keyword: keyword || keywords.items[0]?.keyword || '', cluster });
    const scale = this.buildSafeScalePlan();
    const searchConsole = includeSearchConsole
      ? await this.buildSearchConsoleFeedbackLoop({ limit: 25, minImpressions: 20 })
      : {
          ok: true,
          skipped: true,
          autoRefresh: false,
          reason: 'includeSearchConsole=false',
          structurePrepared: true
        };

    return {
      ok: true,
      strategy: {
        adsense: {
          approach: 'combinar high CPC com long tails de baixa concorrencia e conteudo premium assistido',
          priority: 'emprestimo, negativado, credito pessoal, consignado, score',
          guardrail: 'nao sacrificar EEAT por volume'
        },
        topicalAuthority: [
          'pillar por cluster prioritario',
          'comparativos e decisorios para meio/fundo',
          'FAQ long tail para capturar buscas pequenas',
          'interlinking hub -> spoke -> artigo relacionado',
          'refresh assistido guiado por Search Console'
        ]
      },
      clusters,
      keywords,
      interlinking,
      diversity,
      searchConsole,
      scale,
      goNoGo: {
        productionAssistedScale: 'GO',
        automaticPublishing: 'NO-GO',
        reason: 'motor premium esta pronto para preview e revisao humana; publicacao automatica em YMYL segue bloqueada'
      }
    };
  }
}
