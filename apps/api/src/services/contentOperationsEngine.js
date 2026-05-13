import { getPrisma } from '../lib/prisma.js';
import { SerpIntelligenceService } from './serpIntelligenceService.js';
import { EditorialTopicFatigueService } from './editorialTopicFatigueService.js';
import { EditorialMemoryService } from './editorialMemoryService.js';
import { EditorialFingerprintService } from './editorialFingerprintService.js';
import { TopicalAuthorityService } from './topicalAuthorityService.js';
import { TrendIntelligenceService } from './trendIntelligenceService.js';
import { LiveDiscoveryResilienceService } from './liveDiscoveryResilienceService.js';

const WEEKLY_CONTENT_MIX = {
  evergreen_premium: 6,
  news_analysis: 4,
  consumer_alert: 3,
  content_refresh: 4,
  topical_support: 4,
};

const CONTENT_TYPE_PROFILES = {
  evergreen_premium: {
    label: 'Evergreen Premium',
    minWords: 2500,
    maxWords: 4500,
    baseSeo: 88,
    baseEeat: 88,
    baseHumanization: 84,
    intent: 'evergreen_decision',
  },
  news_analysis: {
    label: 'News Analysis',
    minWords: 1200,
    maxWords: 2500,
    baseSeo: 82,
    baseEeat: 86,
    baseHumanization: 86,
    intent: 'freshness_explainer',
  },
  consumer_alert: {
    label: 'Consumer Alert',
    minWords: 1500,
    maxWords: 3200,
    baseSeo: 86,
    baseEeat: 90,
    baseHumanization: 88,
    intent: 'protection_action',
  },
  content_refresh: {
    label: 'Content Refresh',
    minWords: 900,
    maxWords: 2200,
    baseSeo: 84,
    baseEeat: 86,
    baseHumanization: 82,
    intent: 'update_existing',
  },
  topical_support: {
    label: 'Topical Support',
    minWords: 1200,
    maxWords: 2600,
    baseSeo: 83,
    baseEeat: 84,
    baseHumanization: 83,
    intent: 'supporting_authority',
  },
};

const DAILY_TYPE_PLAN = [
  ['evergreen_premium', 'consumer_alert', 'content_refresh'],
  ['news_analysis', 'topical_support', 'evergreen_premium'],
  ['evergreen_premium', 'content_refresh', 'news_analysis'],
  ['consumer_alert', 'topical_support', 'evergreen_premium'],
  ['news_analysis', 'content_refresh', 'topical_support'],
  ['evergreen_premium', 'consumer_alert', 'content_refresh'],
  ['news_analysis', 'topical_support', 'evergreen_premium'],
];

const SUBSTITUTION_PRIORITY = [
  'consumer_alert',
  'content_refresh',
  'topical_support',
  'news_analysis',
  'evergreen_premium',
];

const STATIC_CANDIDATES = [
  {
    keyword: 'como montar reserva de emergencia ganhando pouco',
    type: 'evergreen_premium',
    cluster: 'educacao_financeira',
    family: 'orcamento',
    angle: 'orcamento realista, pequenos valores e disciplina possivel',
  },
  {
    keyword: 'juros abusivos no cartao como identificar e contestar',
    type: 'evergreen_premium',
    cluster: 'consumidor_financeiro',
    family: 'cartao',
    angle: 'defesa do consumidor, contrato e custo efetivo',
  },
  {
    keyword: 'superendividamento como reorganizar dividas sem cair em novo credito',
    type: 'evergreen_premium',
    cluster: 'superendividamento',
    family: 'renegociacao',
    angle: 'prioridade de contas, minimo existencial e renegociacao',
  },
  {
    keyword: 'renegociar divida ou pegar emprestimo qual vale mais a pena',
    type: 'evergreen_premium',
    cluster: 'renegociacao',
    family: 'credito_emprestimo',
    angle: 'decisao comparativa com custo total e risco domestico',
  },
  {
    keyword: 'orcamento familiar 50 30 20 funciona no Brasil',
    type: 'evergreen_premium',
    cluster: 'orcamento_familiar',
    family: 'educacao_financeira',
    angle: 'adaptacao brasileira para renda apertada',
  },
  {
    keyword: 'portabilidade de salario ajuda a organizar as contas',
    type: 'evergreen_premium',
    cluster: 'consumidor_financeiro',
    family: 'bancos',
    angle: 'banco principal, tarifa, credito e autonomia financeira',
  },
  {
    keyword: 'como priorizar contas quando o salario nao cobre o mes',
    type: 'evergreen_premium',
    cluster: 'orcamento_familiar',
    family: 'educacao_financeira',
    angle: 'ordem de prioridade, contas essenciais, negociacao e dano evitavel',
  },
  {
    keyword: 'como sair do cheque especial sem trocar uma divida cara por outra',
    type: 'evergreen_premium',
    cluster: 'juros_abusivos',
    family: 'educacao_financeira',
    angle: 'juros caros, plano de saida e decisao entre renegociacao e credito',
  },
  {
    keyword: 'como conferir o Registrato do Banco Central antes de contratar credito',
    type: 'evergreen_premium',
    cluster: 'consumidor_financeiro',
    family: 'banco_central',
    angle: 'uso pratico de dado oficial para entender dividas, contas e riscos',
  },
  {
    keyword: 'como negociar divida com banco sem aceitar a primeira proposta',
    type: 'evergreen_premium',
    cluster: 'renegociacao',
    family: 'renegociacao',
    angle: 'leitura critica de desconto, prazo, entrada e custo final',
  },
  {
    keyword: 'como montar um plano financeiro depois de limpar o nome',
    type: 'evergreen_premium',
    cluster: 'educacao_financeira',
    family: 'educacao_financeira',
    angle: 'pos-negativacao, reconstrucao de rotina e prevencao de novo atraso',
  },
  {
    keyword: 'conta atrasada ou cartao rotativo qual pagar primeiro',
    type: 'evergreen_premium',
    cluster: 'orcamento_familiar',
    family: 'educacao_financeira',
    angle: 'decisao domestica entre juros, servico essencial e risco de corte',
  },
  {
    keyword: 'Selic mudou o que muda no seu bolso',
    type: 'news_analysis',
    cluster: 'juros_selic',
    family: 'news',
    angle: 'impacto em credito, renda fixa, cartao e renegociacao',
  },
  {
    keyword: 'nova regra do Pix o que muda para seguranca',
    type: 'news_analysis',
    cluster: 'pix_seguranca',
    family: 'pix',
    angle: 'explicacao pratica de risco, limite e contestacao',
  },
  {
    keyword: 'mudancas no INSS impacto para aposentados no credito',
    type: 'news_analysis',
    cluster: 'inss',
    family: 'consignado',
    angle: 'margem, desconto em folha e cuidados com oferta agressiva',
  },
  {
    keyword: 'FGTS saque aniversario o que acompanhar antes de antecipar',
    type: 'news_analysis',
    cluster: 'fgts',
    family: 'fgts',
    angle: 'liquidez futura, emergencia e custo da antecipacao',
  },
  {
    keyword: 'Banco Central alerta sobre segurança digital o que muda para o consumidor',
    type: 'news_analysis',
    cluster: 'consumidor_financeiro',
    family: 'news',
    angle: 'traduzir alerta institucional em passos praticos de protecao',
  },
  {
    keyword: 'mutirao de renegociacao de dividas como avaliar se vale a pena',
    type: 'news_analysis',
    cluster: 'renegociacao',
    family: 'news',
    angle: 'noticia de oportunidade com leitura de desconto, prazo e renda',
  },
  {
    keyword: 'mudanca em regras de cartao como afeta a fatura do consumidor',
    type: 'news_analysis',
    cluster: 'cartao',
    family: 'news',
    angle: 'explicar regulacao sem promessa e com impacto no bolso',
  },
  {
    keyword: 'como se proteger de golpe do falso atendente do banco',
    type: 'consumer_alert',
    cluster: 'golpes_bancarios',
    family: 'golpes_fraudes',
    angle: 'roteiro de verificacao antes de passar dados ou fazer Pix',
  },
  {
    keyword: 'golpe do boleto falso como conferir antes de pagar',
    type: 'consumer_alert',
    cluster: 'boletos_falsos',
    family: 'golpes_fraudes',
    angle: 'codigo de barras, beneficiario, comprovante e contestacao',
  },
  {
    keyword: 'consignado INSS cobranca indevida o que fazer',
    type: 'consumer_alert',
    cluster: 'inss',
    family: 'consumidor_financeiro',
    angle: 'extrato Meu INSS, banco, reclamacao e provas',
  },
  {
    keyword: 'golpe da falsa central antifraude como identificar',
    type: 'consumer_alert',
    cluster: 'golpes_bancarios',
    family: 'golpes_fraudes',
    angle: 'alerta sobre engenharia social, senha, acesso remoto e pressa',
  },
  {
    keyword: 'golpe do comprovante falso de Pix como se proteger',
    type: 'consumer_alert',
    cluster: 'golpes_pix',
    family: 'golpes_fraudes',
    angle: 'conferencia do extrato, comprovante falso e prova de recebimento',
  },
  {
    keyword: 'emprestimo falso pelo WhatsApp sinais de golpe',
    type: 'consumer_alert',
    cluster: 'golpes_fraudes',
    family: 'golpes_fraudes',
    angle: 'taxa antecipada, promessa de aprovacao e canal nao oficial',
  },
  {
    keyword: 'emprestimo para negativado atualizar dados de CET e golpes',
    type: 'content_refresh',
    cluster: 'credito_emprestimo',
    family: 'credito_emprestimo',
    targetSlug: 'emprestimo-para-negativado',
    angle: 'atualizar exemplos, CET, alertas e FAQ sem criar nova URL',
  },
  {
    keyword: 'fiz um Pix errado e agora atualizar MED e canais oficiais',
    type: 'content_refresh',
    cluster: 'golpes_pix',
    family: 'pix',
    targetSlug: 'fiz-um-pix-errado-e-agora',
    angle: 'refresh de MED, provas, banco e consumidor.gov.br',
  },
  {
    keyword: 'como aumentar score de credito atualizar mitos e cadastro positivo',
    type: 'content_refresh',
    cluster: 'score',
    family: 'score',
    targetSlug: 'como-aumentar-score-de-credito',
    angle: 'tirar promessa falsa e reforcar comportamento verificavel',
  },
  {
    keyword: 'cartao de credito para autonomo atualizar criterios de aprovacao',
    type: 'content_refresh',
    cluster: 'cartao',
    family: 'cartao',
    targetSlug: 'cartao-de-credito-para-autonomo',
    angle: 'comprovacao de renda, limite, risco e alternativas',
  },
  {
    keyword: 'como fazer orcamento mensal atualizar exemplos e checklist',
    type: 'content_refresh',
    cluster: 'orcamento_familiar',
    family: 'educacao_financeira',
    targetSlug: 'como-fazer-orcamento-mensal',
    angle: 'refresh pratico com calendario de contas, imprevistos e plano de corte',
  },
  {
    keyword: 'como controlar gastos do dia a dia atualizar exemplos brasileiros',
    type: 'content_refresh',
    cluster: 'orcamento_familiar',
    family: 'educacao_financeira',
    targetSlug: 'como-controlar-gastos-do-dia-a-dia',
    angle: 'atualizar artigo existente com cenarios de mercado, transporte e contas fixas',
  },
  {
    keyword: 'como priorizar dividas atualizar ordem de pagamento e riscos',
    type: 'content_refresh',
    cluster: 'renegociacao',
    family: 'renegociacao',
    targetSlug: 'como-priorizar-dividas',
    angle: 'refresh com criterio de juros, servico essencial, garantia e impacto familiar',
  },
  {
    keyword: 'como sair das dividas atualizar plano de 30 dias',
    type: 'content_refresh',
    cluster: 'renegociacao',
    family: 'renegociacao',
    targetSlug: 'como-sair-das-dividas',
    angle: 'refresh com ordem de prioridades, renda real e renegociacao responsavel',
  },
  {
    keyword: 'reserva de emergencia atualizar exemplos para renda apertada',
    type: 'content_refresh',
    cluster: 'orcamento_familiar',
    family: 'educacao_financeira',
    targetSlug: 'reserva-de-emergencia-como-montar',
    angle: 'refresh de reserva com valores pequenos, frequencia e gatilhos de uso',
  },
  {
    keyword: 'juros abusivos no cartao atualizar como contestar',
    type: 'content_refresh',
    cluster: 'consumidor_financeiro',
    family: 'cartao',
    targetSlug: 'juros-abusivos-no-cartao',
    angle: 'refresh com contrato, atendimento, consumidor.gov.br e prova documental',
  },
  {
    keyword: 'MED no Pix quando ajuda e quais sao os limites',
    type: 'topical_support',
    cluster: 'golpes_pix',
    family: 'pix',
    angle: 'supporting page para golpes Pix com limite pratico do mecanismo',
  },
  {
    keyword: 'consumidor gov br quando usar contra banco ou financeira',
    type: 'topical_support',
    cluster: 'consumidor_financeiro',
    family: 'defesa_consumidor',
    angle: 'ponte entre problema bancario, banco e reclamacao formal',
  },
  {
    keyword: 'boletim de ocorrencia online para golpe financeiro',
    type: 'topical_support',
    cluster: 'golpes_fraudes',
    family: 'golpes_fraudes',
    angle: 'documentar prejuizo e organizar prova antes da contestacao',
  },
  {
    keyword: 'margem consignavel como conferir no Meu INSS',
    type: 'topical_support',
    cluster: 'inss',
    family: 'consignado',
    angle: 'supporting page para consignado com foco em seguranca',
  },
  {
    keyword: 'cadastro positivo e score o que realmente muda',
    type: 'topical_support',
    cluster: 'score',
    family: 'score',
    angle: 'entidade de score sem promessa de aumento rapido',
  },
  {
    keyword: 'como conferir CNPJ de financeira antes de contratar',
    type: 'topical_support',
    cluster: 'consumidor_financeiro',
    family: 'defesa_consumidor',
    angle: 'checagem de empresa, canais oficiais e reducao de golpe',
  },
  {
    keyword: 'diferenca entre juros nominal CET e custo total',
    type: 'topical_support',
    cluster: 'juros_selic',
    family: 'educacao_financeira',
    angle: 'glossario pratico para melhorar comparacao de credito',
  },
  {
    keyword: 'como organizar comprovantes para reclamar de banco',
    type: 'topical_support',
    cluster: 'consumidor_financeiro',
    family: 'defesa_consumidor',
    angle: 'provas, protocolo, print, contrato e linha do tempo do problema',
  },
  {
    keyword: 'como usar o Registrato para conferir contas e emprestimos no seu CPF',
    type: 'topical_support',
    cluster: 'consumidor_financeiro',
    family: 'banco_central',
    angle: 'supporting page de dado oficial, CPF e prevencao de fraude',
  },
  {
    keyword: 'o que e minimo existencial no superendividamento',
    type: 'topical_support',
    cluster: 'superendividamento',
    family: 'defesa_consumidor',
    angle: 'explicar conceito juridico-financeiro em linguagem de orcamento domestico',
  },
  {
    keyword: 'como montar linha do tempo para reclamar de golpe financeiro',
    type: 'topical_support',
    cluster: 'golpes_fraudes',
    family: 'golpes_fraudes',
    angle: 'documentacao, datas, protocolos, banco, BO e consumidor.gov.br',
  },
];

function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function normalizeText(value = '') {
  return String(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function toSlug(value = '') {
  return normalizeText(value).replace(/\s+/g, '-').replace(/^-|-$/g, '');
}

function uniq(items) {
  return Array.from(new Set(items.filter(Boolean)));
}

function buildMockArticle(candidate, dayIndex = 0) {
  const profile = CONTENT_TYPE_PROFILES[candidate.type] || CONTENT_TYPE_PROFILES.evergreen_premium;
  const title = candidate.title || candidate.keyword;
  const introVariants = [
    `A pauta parte de uma pergunta concreta: ${title}. A resposta precisa caber no contrato, no bolso e no risco real do leitor.`,
    `${title} parece simples, mas a decisao muda quando entram custo, prazo, prova e consequencia pratica.`,
    `Antes de procurar uma solucao rapida para ${title}, vale separar urgencia, direito do consumidor e impacto financeiro.`,
  ];
  const ctaByType = {
    evergreen_premium: 'Compare custos, simule cenarios e avance apenas quando a conta fechar.',
    news_analysis: 'Entenda o impacto antes de mudar uma decisao financeira por causa da noticia.',
    consumer_alert: 'Salve provas, pare a transferencia e use canais oficiais antes de responder qualquer contato.',
    content_refresh: 'Atualize sua decisao com dados recentes e revise o artigo principal antes de contratar.',
    topical_support: 'Use este guia como apoio para navegar o hub financeiro com mais seguranca.',
  };

  return {
    title,
    slug: candidate.targetSlug || toSlug(title),
    category: candidate.family || candidate.cluster,
    keyword: candidate.keyword,
    topic: title,
    metaDescription: `${title}: contexto, riscos, exemplos e decisao pratica para o consumidor brasileiro.`,
    content: [
      introVariants[dayIndex % introVariants.length],
      `O angulo editorial e ${candidate.angle}. O objetivo nao e preencher calendario: e aumentar autoridade tematica com utilidade real.`,
      'A estrutura inclui comparacao, sinais de alerta, exemplos numericos, fontes oficiais, FAQ util e CTA coerente.',
      'Muita gente olha apenas para a parcela. E ai mora o problema.',
      'Banco aprova olhando risco para ele; voce precisa decidir olhando risco para sua casa.',
      'Quem promete resolver tudo sem analise normalmente vende ansiedade, nao seguranca financeira.',
    ].join('\n\n'),
    outline: [
      `Resposta direta sobre ${title}`,
      'O que muda no bolso',
      'Cenarios reais e exemplos numericos',
      'Erros comuns e sinais de alerta',
      'Checklist de decisao',
      'Fontes oficiais e proximos passos',
    ],
    sections: [
      { heading: `Resposta direta sobre ${title}` },
      { heading: 'O que muda no bolso' },
      { heading: 'Cenarios reais e exemplos numericos' },
      { heading: 'Erros comuns e sinais de alerta' },
      { heading: 'Checklist de decisao' },
    ],
    faq: [
      { question: `Quando ${title} vale a pena?`, answer: 'Quando reduz risco, custo ou incerteza sem criar uma divida pior.' },
      { question: 'Quais fontes conferir?', answer: 'Banco Central, Gov.br, consumidor.gov.br e canais oficiais da instituicao.' },
      { question: 'Qual e o maior erro?', answer: 'Decidir pela pressa sem comparar custo total, provas e consequencias.' },
    ],
    cta: ctaByType[candidate.type] || ctaByType.evergreen_premium,
    internalLinks: candidate.internalLinks || ['/blog', '/ferramentas', '/diagnostico-financeiro'],
    metadata: {
      contentType: candidate.type,
      targetSlug: candidate.targetSlug,
      minWords: profile.minWords,
      maxWords: profile.maxWords,
      narrativeAngle: candidate.angle,
      source: candidate.source || 'planned',
    },
  };
}

function deriveCandidateFromSerp(keyword, serpResult, type = 'topical_support') {
  const gaps = serpResult?.contentGaps || [];
  const related = serpResult?.relatedSearches || [];
  const paa = serpResult?.peopleAlsoAsk || [];
  const terms = [...related, ...paa, ...gaps]
    .map((item) => (typeof item === 'string' ? item : item?.question || item?.query || item?.gap || ''))
    .map((item) => normalizeText(item))
    .filter(Boolean);

  const picked = terms.find((term) => term.length > 20 && !term.includes('emprestimo para negativado')) || keyword;
  return {
    keyword: picked,
    type,
    cluster: TopicalAuthorityService.classifyCluster({ keyword: picked, category: type }),
    family: TopicalAuthorityService.classifyCluster({ keyword: picked, category: type }),
    angle: `pauta descoberta por SERP para cobrir lacuna associada a ${keyword}`,
    source: 'serp_discovery',
  };
}

export class ContentOperationsEngine {
  static getWeeklyMixTarget() {
    return { ...WEEKLY_CONTENT_MIX };
  }

  static getContentTypeProfiles() {
    return { ...CONTENT_TYPE_PROFILES };
  }

  static async loadRefreshCandidates({ limit = 8 } = {}) {
    try {
      const prisma = getPrisma();
      const articles = await prisma.blogArticle.findMany({
        where: { status: 'published' },
        orderBy: [{ updatedAt: 'asc' }, { publishedAt: 'asc' }],
        take: limit,
        select: {
          title: true,
          slug: true,
          category: true,
          keyword: true,
          publishedAt: true,
          updatedAt: true,
        },
      });

      return articles.map((article) => ({
        keyword: `${article.title} atualizar dados, exemplos e FAQ`,
        title: `Atualizar: ${article.title}`,
        type: 'content_refresh',
        cluster: TopicalAuthorityService.classifyCluster({
          keyword: `${article.keyword || article.title} ${article.category || ''}`,
          category: article.category,
        }),
        family: article.category || 'content_refresh',
        targetSlug: article.slug,
        angle: 'refresh SEO: novas entidades, SERP atualizada, exemplos e links internos',
        source: 'existing_content_refresh',
        publishedAt: article.publishedAt,
        updatedAt: article.updatedAt,
      }));
    } catch (error) {
      return [];
    }
  }

  static async discoverCandidates({
    dryRun = true,
    useLiveDiscovery = false,
    maxSerpSeeds = 4,
  } = {}) {
    const hasSerpApi = Boolean(process.env.SERPAPI_API_KEY);
    const hasValueSerp = Boolean(process.env.VALUESERP_API_KEY);
    const canUseLive = Boolean(useLiveDiscovery && (hasSerpApi || hasValueSerp));

    const seeds = [
      { keyword: 'golpes bancarios recentes Pix falso atendente', type: 'consumer_alert' },
      { keyword: 'mudanca Selic impacto no bolso consumidor', type: 'news_analysis' },
      { keyword: 'consumidor financeiro direitos banco financeira', type: 'topical_support' },
      { keyword: 'educacao financeira pratica dividas familia', type: 'evergreen_premium' },
    ];

    const discovered = [
      {
        keyword: 'como conferir se uma ligacao do banco e verdadeira',
        type: 'consumer_alert',
        cluster: 'golpes_bancarios',
        family: 'golpes_fraudes',
        angle: 'dor recorrente de consumidor: telefone, WhatsApp, senha e Pix',
        source: 'simulated_discovery',
      },
      {
        keyword: 'o que muda no seu bolso quando a Selic cai',
        type: 'news_analysis',
        cluster: 'juros_selic',
        family: 'news',
        angle: 'explicar noticia economica em linguagem de orcamento domestico',
        source: 'simulated_discovery',
      },
      {
        keyword: 'como contestar cobranca indevida no cartao de credito',
        type: 'topical_support',
        cluster: 'cartao',
        family: 'cartao',
        angle: 'supporting page de consumidor financeiro e prova documental',
        source: 'simulated_discovery',
      },
      {
        keyword: 'calendario financeiro da familia como planejar contas do mes',
        type: 'evergreen_premium',
        cluster: 'orcamento_familiar',
        family: 'educacao_financeira',
        angle: 'conteudo pratico para evitar atraso, juros e renegociacao ruim',
        source: 'simulated_discovery',
      },
    ];

    const liveResults = [];
    if (canUseLive) {
      const resilient = await LiveDiscoveryResilienceService.fetchWithResilience({
        key: `serp-discovery:${seeds.map((seed) => seed.keyword).join('|')}`,
        timeoutMs: 14000,
        retries: 1,
        fetcher: async () => {
          const items = [];
          for (const seed of seeds.slice(0, maxSerpSeeds)) {
            const serp = await SerpIntelligenceService.analyzeKeyword({
              keyword: seed.keyword,
              dryRun: false,
              limit: 8,
            });
            items.push(deriveCandidateFromSerp(seed.keyword, serp, seed.type));
          }
          return {
            ok: true,
            candidates: LiveDiscoveryResilienceService.rankOffline(items),
            provider: process.env.SERPAPI_API_KEY ? 'serpapi' : 'valueserp',
          };
        },
        fallback: () => ({
          ok: true,
          candidates: LiveDiscoveryResilienceService.rankOffline(discovered),
          provider: 'offline_fallback',
        }),
      });
      liveResults.push(...(resilient.candidates || []).map((item) => ({
        ...item,
        discoveryCache: resilient.cache,
        discoveryStale: resilient.stale,
        discoveryCircuitOpen: resilient.circuitOpen,
      })));
    }

    return {
      triggered: true,
      dryRun,
      usedLiveDiscovery: canUseLive,
      providers: {
        serpApiConfigured: hasSerpApi,
        valueSerpConfigured: hasValueSerp,
        serpUsed: canUseLive,
        trendsAdapter: 'planned',
        newsAdapter: 'planned',
        resilience: LiveDiscoveryResilienceService.getStatus(),
      },
      candidates: [...liveResults, ...discovered],
    };
  }

  static async buildCandidatePool(options = {}) {
    const refreshCandidates = await this.loadRefreshCandidates({ limit: 10 });
    const discovery = await this.discoverCandidates(options);
    const merged = [...STATIC_CANDIDATES, ...refreshCandidates, ...discovery.candidates];
    const seen = new Set();
    const candidates = merged.filter((candidate) => {
      const key = `${candidate.type}:${candidate.targetSlug || toSlug(candidate.keyword)}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return { candidates, discovery };
  }

  static async evaluateCandidate({
    candidate,
    dayIndex = 0,
    weekState = {},
    dryRun = true,
  } = {}) {
    const profile = CONTENT_TYPE_PROFILES[candidate.type] || CONTENT_TYPE_PROFILES.evergreen_premium;
    const mockArticle = buildMockArticle(candidate, dayIndex);
    const cluster = candidate.cluster || TopicalAuthorityService.classifyCluster({
      keyword: candidate.keyword,
      category: candidate.family,
    });

    const [memory, fingerprint, authority, trend, fatigue] = await Promise.all([
      EditorialMemoryService.buildMemory({ article: mockArticle }),
      EditorialFingerprintService.analyzeEditorialFingerprint(mockArticle),
      TopicalAuthorityService.analyze({
        article: mockArticle,
        keyword: candidate.keyword,
        category: candidate.family || cluster,
      }),
      TrendIntelligenceService.classifyTrendOpportunity(candidate.keyword),
      EditorialTopicFatigueService.analyze({
        article: mockArticle,
        keyword: candidate.keyword,
        category: candidate.family || cluster,
        dryRun,
      }),
    ]);

    const isRefresh = candidate.type === 'content_refresh';
    const canibalizationRisk = memory?.canibalizationRisk || 0;
    const fingerprintRisk = fingerprint?.fingerprintRiskScore || 0;
    const topicFatigue = fatigue?.topicFatigueScore || 0;
    const topicalAuthorityGain = clamp(
      (authority?.authorityOpportunity?.score || 55) +
        (authority?.clusterHealth?.status === 'undercovered' ? 18 : 0) +
        (isRefresh ? 10 : 0) +
        (candidate.source?.includes('discovery') ? 8 : 0)
    );

    const sameDayCluster = weekState.dayClusters?.has(cluster);
    const clusterWeekCount = weekState.weekClusters?.get(cluster) || 0;
    const typeWeekCount = weekState.typeCounts?.get(candidate.type) || 0;
    const typeTarget = weekState.typeTargets?.[candidate.type] || WEEKLY_CONTENT_MIX[candidate.type] || 0;

    const blockers = [];
    if (!isRefresh && canibalizationRisk >= 62) blockers.push('canibalization_risk_high');
    if (fingerprintRisk > 35) blockers.push('fingerprint_risk_high');
    if (fatigue?.blocked) blockers.push('topic_fatigue_blocked');
    if (sameDayCluster) blockers.push('same_day_cluster_repetition');
    if (clusterWeekCount >= 3 && candidate.type !== 'news_analysis') blockers.push('weekly_cluster_pressure');
    if (typeWeekCount >= typeTarget) blockers.push('weekly_type_quota_filled');
    if ((authority?.clusterHealth?.status === 'overcovered' || authority?.clusterHealth?.status === 'saturated') && !isRefresh) {
      blockers.push('topical_saturation');
    }

    const seoScore = clamp(
      profile.baseSeo +
        Math.min(10, (trend?.trafficPotential || 0) / 12) +
        Math.min(8, topicalAuthorityGain / 18) -
        fingerprintRisk / 5 -
        (!isRefresh ? canibalizationRisk / 7 : 0)
    );
    const eeatScore = clamp(
      profile.baseEeat +
        (authority?.recommendedEntities?.length ? 4 : 0) +
        (['consumer_alert', 'news_analysis'].includes(candidate.type) ? 5 : 0) -
        fingerprintRisk / 8
    );
    const humanizationScore = clamp(
      profile.baseHumanization +
        (candidate.angle?.length > 50 ? 5 : 0) -
        fingerprintRisk / 6 -
        (sameDayCluster ? 12 : 0)
    );
    const diversityScore = clamp(
      100 -
        fingerprintRisk -
        (sameDayCluster ? 24 : 0) -
        Math.max(0, clusterWeekCount - 1) * 10 -
        Math.max(0, typeWeekCount - typeTarget + 1) * 12
    );

    const decision = blockers.length ? 'skipped' : 'publishable';
    return {
      keyword: candidate.keyword,
      type: candidate.type,
      contentTypeLabel: profile.label,
      family: candidate.family || cluster,
      cluster,
      intent: candidate.intent || profile.intent,
      targetSlug: candidate.targetSlug || null,
      source: candidate.source || 'planned',
      governance: {
        decision: isRefresh && decision === 'publishable' ? 'publishable_refresh' : decision,
        publishAllowed: decision === 'publishable',
        dryRun,
      },
      publishSafety: {
        status: decision === 'publishable' ? 'publishable' : 'draft_blocked',
      },
      scores: {
        seo: seoScore,
        eeat: eeatScore,
        humanization: humanizationScore,
        diversity: diversityScore,
        fingerprintRisk,
        topicalAuthorityGain,
        topicFatigue,
        semanticSimilarity: memory?.highestSemanticSimilarity || 0,
        titleSimilarity: memory?.highestTitleSimilarity || 0,
        canibalization: canibalizationRisk,
      },
      blockers,
      reason: this.explainCandidateChoice({
        candidate,
        authority,
        trend,
        scores: { seoScore, eeatScore, humanizationScore, diversityScore, topicalAuthorityGain },
        isRefresh,
      }),
      refreshPlanned: isRefresh,
      updatePlanned: isRefresh
        ? {
            targetSlug: candidate.targetSlug,
            actions: [
              'nova SERP e entidades',
              'exemplos numericos atualizados',
              'FAQ e links internos revisados',
              'checagem de canibalizacao sem criar URL nova',
            ],
          }
        : null,
    };
  }

  static explainCandidateChoice({ candidate, authority, trend, scores, isRefresh }) {
    const parts = [];
    if (isRefresh) parts.push('melhora URL existente sem criar canibalizacao');
    if (candidate.source?.includes('discovery')) parts.push('veio de discovery para cobrir dor atual');
    if ((authority?.authorityOpportunity?.score || 0) >= 70) parts.push('aumenta topical authority');
    if ((trend?.freshnessScore || 0) >= 60 || candidate.type === 'news_analysis') parts.push('tem frescor editorial');
    if (scores.diversityScore >= 80) parts.push('preserva diversidade semanal');
    if (!parts.length) parts.push('preenche lacuna do calendario sem pressionar cluster saturado');
    return parts.join('; ');
  }

  static async evaluateCandidatePool({ candidates, dryRun = true } = {}) {
    const weekState = {
      dayClusters: new Set(),
      weekClusters: new Map(),
      typeCounts: new Map(),
    };

    const evaluations = [];
    for (const candidate of candidates) {
      const evaluated = await this.evaluateCandidate({ candidate, dayIndex: 0, weekState, dryRun });
      evaluations.push(evaluated);
    }
    return evaluations;
  }

  static pickCandidateForSlot({ evaluations, desiredType, usedKeys, weekState }) {
    const rank = (item) =>
      item.scores.seo +
      item.scores.eeat +
      item.scores.humanization +
      item.scores.diversity +
      item.scores.topicalAuthorityGain -
      item.scores.fingerprintRisk * 2 -
      item.scores.canibalization;

    const eligible = evaluations
      .filter((item) => item.type === desiredType)
      .filter((item) => !usedKeys.has(`${item.type}:${item.targetSlug || toSlug(item.keyword)}`))
      .filter((item) => item.governance.publishAllowed)
      .filter((item) => !weekState.dayClusters.has(item.cluster))
      .filter((item) => (weekState.typeCounts.get(item.type) || 0) < (weekState.typeTargets?.[item.type] || WEEKLY_CONTENT_MIX[item.type] || 0))
      .sort((a, b) => rank(b) - rank(a));

    return eligible[0] || null;
  }

  static async simulateWeek({
    days = 7,
    dailyTarget = 3,
    dryRun = true,
    useLiveDiscovery = false,
  } = {}) {
    const { candidates, discovery } = await this.buildCandidatePool({
      dryRun,
      useLiveDiscovery,
    });

    const baseEvaluations = await this.evaluateCandidatePool({ candidates, dryRun });
    const usedKeys = new Set();
    const targetMultiplier = Math.max(1, Math.ceil(days / 7));
    const typeTargets = Object.fromEntries(
      Object.entries(WEEKLY_CONTENT_MIX).map(([type, count]) => [type, count * targetMultiplier])
    );
    const weekState = {
      weekClusters: new Map(),
      typeCounts: new Map(),
      typeTargets,
    };
    const daysPlan = [];
    const blockedCandidates = [];

    for (let dayIndex = 0; dayIndex < days; dayIndex += 1) {
      const desiredTypes = (DAILY_TYPE_PLAN[dayIndex] || SUBSTITUTION_PRIORITY).slice(0, dailyTarget);
      const dayClusters = new Set();
      weekState.dayClusters = dayClusters;
      const selected = [];
      const skippedSlots = [];

      for (const desiredType of desiredTypes) {
        let picked = this.pickCandidateForSlot({
          evaluations: baseEvaluations,
          desiredType,
          usedKeys,
          weekState,
        });

        let substitutionUsed = false;
        if (!picked) {
          for (const fallbackType of SUBSTITUTION_PRIORITY) {
            picked = this.pickCandidateForSlot({
              evaluations: baseEvaluations,
              desiredType: fallbackType,
              usedKeys,
              weekState,
            });
            if (picked) {
              substitutionUsed = true;
              break;
            }
          }
        }

        if (!picked) {
          skippedSlots.push({
            desiredType,
            decision: 'skipped',
            reason: 'sem pauta elegivel sem violar governanca, diversidade ou quotas',
          });
          continue;
        }

        const key = `${picked.type}:${picked.targetSlug || toSlug(picked.keyword)}`;
        usedKeys.add(key);
        dayClusters.add(picked.cluster);
        weekState.weekClusters.set(picked.cluster, (weekState.weekClusters.get(picked.cluster) || 0) + 1);
        weekState.typeCounts.set(picked.type, (weekState.typeCounts.get(picked.type) || 0) + 1);
        selected.push({
          ...picked,
          slotType: desiredType,
          substitutionUsed,
          discoveryTriggered: picked.source?.includes('discovery') || discovery.triggered,
        });
      }

      const avgFingerprint = selected.length
        ? selected.reduce((sum, item) => sum + item.scores.fingerprintRisk, 0) / selected.length
        : 100;
      const dailyEditorialDiversityScore = clamp(
        (uniq(selected.map((item) => item.cluster)).length / Math.max(1, selected.length)) * 45 +
          (uniq(selected.map((item) => item.type)).length / Math.max(1, selected.length)) * 35 +
          (100 - avgFingerprint) * 0.2
      );

      const dayBlocked = baseEvaluations
        .filter((item) => item.blockers.length)
        .slice(0, 5)
        .map((item) => ({
          keyword: item.keyword,
          type: item.type,
          cluster: item.cluster,
          blockers: item.blockers,
          decision: item.governance.decision,
        }));

      blockedCandidates.push(...dayBlocked);
      daysPlan.push({
        day: dayIndex + 1,
        dateOffset: dayIndex,
        dailyEditorialDiversityScore,
        selected,
        skippedSlots,
        blockedExamples: dayBlocked,
      });
    }

    const distribution = this.calculateDistribution(daysPlan);
    return {
      dryRun,
      published: false,
      persisted: false,
      distributed: false,
      cron: false,
      commit: false,
      push: false,
      gitAddDot: false,
      target: {
        days,
        dailyTarget,
      weeklyTarget: days * dailyTarget,
        weeklyMix: typeTargets,
      },
      discovery,
      days: daysPlan,
      distribution,
      blockedSummary: this.summarizeBlocked(blockedCandidates),
      safety: {
        rule: 'preferir SKIP a publicar conteudo ruim, repetitivo ou canibalizado',
        fallbackPolicy: 'sem fallback silencioso para credito/cartao/score',
        realCron: false,
        realPublishing: false,
      },
    };
  }

  static calculateDistribution(daysPlan) {
    const byType = {};
    const byCluster = {};
    let refreshes = 0;
    let updates = 0;
    let selectedCount = 0;
    let skippedSlots = 0;

    for (const day of daysPlan) {
      skippedSlots += day.skippedSlots.length;
      for (const item of day.selected) {
        selectedCount += 1;
        byType[item.type] = (byType[item.type] || 0) + 1;
        byCluster[item.cluster] = (byCluster[item.cluster] || 0) + 1;
        if (item.refreshPlanned) refreshes += 1;
        if (item.updatePlanned) updates += 1;
      }
    }

    return {
      selectedCount,
      skippedSlots,
      byType,
      byCluster,
      refreshesPlanned: refreshes,
      updatesPlanned: updates,
      mixTarget: WEEKLY_CONTENT_MIX,
      dominantClusters: Object.entries(byCluster)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([cluster, count]) => ({ cluster, count })),
    };
  }

  static summarizeBlocked(blockedCandidates) {
    const byBlocker = {};
    for (const item of blockedCandidates) {
      for (const blocker of item.blockers || []) {
        byBlocker[blocker] = (byBlocker[blocker] || 0) + 1;
      }
    }

    return {
      count: blockedCandidates.length,
      byBlocker,
      examples: blockedCandidates.slice(0, 12),
    };
  }

  static toCompactReport(simulation) {
    return {
      safety: {
        published: simulation.published,
        persisted: simulation.persisted,
        distributed: simulation.distributed,
        cron: simulation.cron,
        commit: simulation.commit,
        push: simulation.push,
        gitAddDot: simulation.gitAddDot,
        dryRun: simulation.dryRun,
      },
      discovery: simulation.discovery.providers,
      distribution: simulation.distribution,
      days: simulation.days.map((day) => ({
        day: day.day,
        dailyEditorialDiversityScore: day.dailyEditorialDiversityScore,
        selected: day.selected.map((item) => ({
          keyword: item.keyword,
          type: item.type,
          cluster: item.cluster,
          intent: item.intent,
          governanceDecision: item.governance.decision,
          publishSafetyStatus: item.publishSafety.status,
          seo: item.scores.seo,
          eeat: item.scores.eeat,
          humanization: item.scores.humanization,
          diversity: item.scores.diversity,
          fingerprintRisk: item.scores.fingerprintRisk,
          topicalAuthorityGain: item.scores.topicalAuthorityGain,
          canibalization: item.scores.canibalization,
          reason: item.reason,
          discoveryTriggered: item.discoveryTriggered,
          refreshPlanned: item.refreshPlanned,
        })),
        skippedSlots: day.skippedSlots,
      })),
      blockedSummary: simulation.blockedSummary,
    };
  }
}

export default ContentOperationsEngine;
