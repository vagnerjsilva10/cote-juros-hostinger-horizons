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

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const SOURCE_REGISTRY = Object.freeze([
  {
    id: 'bcb-copom',
    name: 'Banco Central - Copom/Selic',
    url: 'https://www.bcb.gov.br/controleinflacao/copom',
    topics: ['selic', 'copom', 'juros', 'credito', 'inflacao'],
    authority: 100,
    freshnessWeight: 95,
    articleUse: 'explicar impacto em emprestimos, financiamento, cartao, renda fixa e custo da divida'
  },
  {
    id: 'bcb-open-finance',
    name: 'Banco Central - Open Finance',
    url: 'https://www.bcb.gov.br/estabilidadefinanceira/openfinance',
    topics: ['open finance', 'dados financeiros', 'credito', 'portabilidade'],
    authority: 98,
    freshnessWeight: 80,
    articleUse: 'traduzir mudancas de acesso a dados em comparacao de credito e seguranca'
  },
  {
    id: 'bcb-sgs',
    name: 'Banco Central - series economicas',
    url: 'https://www.bcb.gov.br/estatisticas',
    topics: ['credito', 'juros', 'inadimplencia', 'endividamento', 'spread'],
    authority: 100,
    freshnessWeight: 90,
    articleUse: 'usar dados para enriquecer artigos evergreen com contexto economico'
  },
  {
    id: 'gov-inss',
    name: 'INSS/Gov.br',
    url: 'https://www.gov.br/inss/pt-br/assuntos',
    topics: ['consignado', 'aposentados', 'beneficios', 'fraudes', 'inss'],
    authority: 96,
    freshnessWeight: 92,
    articleUse: 'explicar impacto pratico de regras, suspensoes, margem e protecao a beneficiarios'
  },
  {
    id: 'gov-previdencia',
    name: 'Ministerio da Previdencia',
    url: 'https://www.gov.br/previdencia/pt-br/noticias',
    topics: ['inss', 'consignado', 'descontos', 'fraudes', 'aposentadoria'],
    authority: 96,
    freshnessWeight: 88,
    articleUse: 'contextualizar mudancas regulatórias e riscos de desconto indevido'
  },
  {
    id: 'gov-trabalho-fgts',
    name: 'Ministerio do Trabalho - FGTS',
    url: 'https://www.gov.br/trabalho-e-emprego/pt-br/noticias-e-conteudo',
    topics: ['fgts', 'saque aniversario', 'credito do trabalhador', 'consignado privado'],
    authority: 94,
    freshnessWeight: 88,
    articleUse: 'transformar alteracoes de FGTS em decisao sobre saque, antecipacao e credito'
  },
  {
    id: 'caixa-fgts',
    name: 'Caixa - FGTS',
    url: 'https://www.caixa.gov.br/beneficios-trabalhador/fgts/Paginas/default.aspx',
    topics: ['fgts', 'saque', 'saldo', 'habitação', 'credito'],
    authority: 92,
    freshnessWeight: 78,
    articleUse: 'confirmar regras operacionais e caminhos seguros para o trabalhador'
  },
  {
    id: 'serasa',
    name: 'Serasa',
    url: 'https://www.serasa.com.br/',
    topics: ['score', 'inadimplencia', 'negativado', 'renegociacao', 'credito'],
    authority: 88,
    freshnessWeight: 86,
    articleUse: 'interpretar inadimplencia, score e comportamento de credito do consumidor'
  },
  {
    id: 'febraban',
    name: 'Febraban',
    url: 'https://portal.febraban.org.br/',
    topics: ['bancos', 'golpes', 'seguranca', 'credito', 'pix'],
    authority: 88,
    freshnessWeight: 82,
    articleUse: 'reforcar alertas de golpe e boas praticas bancarias'
  },
  {
    id: 'fintechs',
    name: 'Fintechs e bancos digitais',
    url: 'curated-watchlist',
    topics: ['nubank', 'fintechs', 'cartao', 'credito digital', 'open finance'],
    authority: 70,
    freshnessWeight: 72,
    articleUse: 'usar apenas como contexto; validar regra ou dado sensivel em fonte primaria'
  }
]);

const DRY_RUN_SIGNALS = Object.freeze([
  {
    title: 'Selic alta encarece crédito e muda a comparação entre empréstimo pessoal e consignado',
    sourceIds: ['bcb-copom', 'bcb-sgs'],
    topics: ['selic', 'credito', 'emprestimo', 'consignado'],
    impact: 'aumenta a importância de comparar CET, prazo e custo total antes de trocar dívidas',
    consumerDecision: 'avaliar se a parcela menor não esconde custo total maior',
    cluster: 'emprestimo',
    recency: 'alta',
    urgency: 'media',
    evergreenBridge: 'como comparar empréstimos quando os juros sobem',
    articleExamples: [
      'O que muda no empréstimo após a alta da Selic',
      'Empréstimo pessoal ou consignado: o que comparar quando os juros sobem'
    ]
  },
  {
    title: 'Novas regras e fiscalizações do consignado reforçam atenção a descontos e custos extras',
    sourceIds: ['gov-inss', 'gov-previdencia', 'febraban'],
    topics: ['consignado', 'inss', 'aposentados', 'fraudes'],
    impact: 'beneficiários precisam olhar valor líquido, custos embutidos, margem e autorização',
    consumerDecision: 'conferir contrato e benefício antes de aceitar portabilidade ou refinanciamento',
    cluster: 'consignado',
    recency: 'alta',
    urgency: 'alta',
    evergreenBridge: 'como saber se o consignado INSS está seguro',
    articleExamples: [
      'Como novas regras do consignado afetam aposentados',
      'Consignado INSS: sinais de cobrança indevida antes de contratar'
    ]
  },
  {
    title: 'FGTS e saque-aniversário seguem gerando dúvidas sobre antecipação, bloqueio e uso do saldo',
    sourceIds: ['gov-trabalho-fgts', 'caixa-fgts'],
    topics: ['fgts', 'saque aniversario', 'antecipacao fgts'],
    impact: 'trabalhador precisa comparar liquidez imediata, bloqueio futuro e custo da antecipação',
    consumerDecision: 'não antecipar saldo sem entender prazo, desconto e perda de flexibilidade',
    cluster: 'FGTS',
    recency: 'media',
    urgency: 'media',
    evergreenBridge: 'antecipação do FGTS vale a pena?',
    articleExamples: [
      'Antecipar FGTS vale a pena com as regras atuais?',
      'Saque-aniversário: quando o dinheiro rápido pode sair caro'
    ]
  },
  {
    title: 'Inadimplência e score pressionam aprovação de crédito para negativados',
    sourceIds: ['serasa', 'bcb-sgs'],
    topics: ['inadimplencia', 'score', 'negativado', 'credito'],
    impact: 'mais consumidores buscam crédito caro em momento de orçamento apertado',
    consumerDecision: 'comparar alternativas antes de assumir parcela que só cabe no melhor cenário',
    cluster: 'negativado',
    recency: 'media',
    urgency: 'alta',
    evergreenBridge: 'score baixo consegue empréstimo?',
    articleExamples: [
      'O que o aumento da inadimplência muda para quem busca crédito',
      'Score baixo em cenário de crédito caro: como comparar sem cair em promessa'
    ]
  },
  {
    title: 'Golpes financeiros evoluem com Pix, crédito falso e promessa de aprovação fácil',
    sourceIds: ['febraban', 'gov-inss'],
    topics: ['golpes', 'pix', 'credito falso', 'taxa antecipada'],
    impact: 'pessoas em busca de dinheiro rápido ficam mais vulneráveis a taxa antecipada e links falsos',
    consumerDecision: 'verificar fonte, contrato, CNPJ e nunca pagar taxa antes da liberação',
    cluster: 'seguranca financeira',
    recency: 'alta',
    urgency: 'alta',
    evergreenBridge: 'como saber se um empréstimo online é golpe',
    articleExamples: [
      'Empréstimo com taxa antecipada: por que esse alerta voltou a crescer',
      'Golpes de crédito: como identificar promessa falsa antes de enviar documentos'
    ]
  }
]);

const CONTENT_MIX = Object.freeze({
  evergreen: {
    weight: 45,
    cadence: '2-3 artigos/semana',
    validity: '9-18 meses',
    refresh: 'atualizar quando Search Console cair, regra mudar ou fonte oficial alterar dado'
  },
  longTail: {
    weight: 25,
    cadence: '2-4 artigos/semana',
    validity: '6-12 meses',
    refresh: 'revisar FAQs, exemplos numericos e links internos a cada trimestre'
  },
  trendNews: {
    weight: 15,
    cadence: '1-2 artigos/semana',
    validity: '7-45 dias para hook; 3-6 meses se virar explicador evergreen',
    refresh: 'converter em evergreen ou arquivar quando o gancho perder relevancia'
  },
  seasonal: {
    weight: 10,
    cadence: 'por calendario: IR, 13o, FGTS, Black Friday, volta as aulas',
    validity: 'ciclo anual',
    refresh: 'atualizar ano, regras, calendario e exemplos antes do pico'
  },
  opportunistic: {
    weight: 5,
    cadence: 'somente quando houver alto impacto ao consumidor',
    validity: '3-20 dias',
    refresh: 'nao insistir se nao houver busca, CTR ou utilidade pratica'
  }
});

const classifyTrend = (signal = {}) => {
  const hotTopics = ['selic', 'consignado', 'inss', 'golpes', 'inadimplencia', 'fgts', 'credito'];
  const text = normalize(`${signal.title} ${(signal.topics || []).join(' ')} ${signal.impact || ''}`);
  const topicScore = hotTopics.filter((topic) => text.includes(topic)).length * 10;
  const recencyScore = signal.recency === 'alta' ? 30 : signal.recency === 'media' ? 18 : 8;
  const urgencyScore = signal.urgency === 'alta' ? 25 : signal.urgency === 'media' ? 14 : 5;
  const decisionScore = signal.consumerDecision ? 15 : 0;
  const authorityScore = (signal.sourceIds || []).length >= 2 ? 12 : 6;
  const score = clamp(topicScore + recencyScore + urgencyScore + decisionScore + authorityScore, 0, 100);

  return {
    score,
    heat: score >= 80 ? 'quente' : score >= 60 ? 'monitorar' : 'baixo',
    contentType: score >= 80 ? 'trend/news explicativo' : 'evergreen com contexto atual',
    shouldDraft: score >= 65,
    shouldPublishAutomatically: false
  };
};

const buildArticleBrief = (signal = {}) => {
  const classification = classifyTrend(signal);
  const mainExample = signal.articleExamples?.[0] || signal.evergreenBridge || signal.title;
  const keyword = mainExample.replace(/[?.!:]+$/g, '');

  return {
    keyword,
    slug: toSlug(keyword),
    cluster: signal.cluster,
    contentType: classification.contentType,
    angle: `Nao noticiar por noticiar: explicar ${signal.impact} e transformar em decisao pratica para o consumidor.`,
    intent: 'explicativo + decisorio',
    titleOptions: signal.articleExamples || [mainExample],
    mustCover: [
      'o que aconteceu ou esta mudando',
      'quem e afetado',
      'impacto em juros, parcela, CET, score, renda ou risco',
      'o que comparar antes de decidir',
      'sinais de alerta e limites da interpretacao',
      'fontes oficiais usadas'
    ],
    freshnessRules: [
      'abrir com data/contexto temporal quando houver mudanca regulatoria',
      'separar fato confirmado de interpretacao editorial',
      'nao prometer taxa, aprovacao ou resultado',
      'incluir bloco: o que fazer agora / o que esperar / quando pausar'
    ],
    suggestedStructure: [
      'Resposta direta em 2-3 frases',
      'O que mudou e por que importa',
      'Impacto pratico no bolso',
      'Comparativo antes/depois ou cenario numerico',
      'Riscos e sinais de alerta',
      'Checklist de decisao',
      'FAQ com busca real',
      'CTA natural para comparar ou diagnosticar'
    ],
    sources: (signal.sourceIds || [])
      .map((id) => SOURCE_REGISTRY.find((source) => source.id === id))
      .filter(Boolean)
      .map(({ id, name, url, articleUse }) => ({ id, name, url, articleUse })),
    classification
  };
};

const buildTrendDraftPreview = (brief = {}) => {
  const sourceNames = (brief.sources || []).map((source) => source.name).join(', ');
  const title = brief.titleOptions?.[0] || brief.keyword;
  const slug = brief.slug || toSlug(title);
  const primarySource = brief.sources?.[0]?.name || 'fonte oficial';

  return {
    title,
    slug,
    metaDescription: `${title}: entenda o impacto prático no crédito, na parcela, no CET e nas decisões financeiras do consumidor.`,
    editorialType: brief.contentType,
    angle: brief.angle,
    sourceContext: {
      primarySources: brief.sources || [],
      sourceUse: 'fontes sustentam fato/contexto; a Cote Juros entra com interpretação prática e cautela financeira',
      temporalContextRequired: true
    },
    outline: [
      'Resposta direta: o que muda para o consumidor',
      'O fato confirmado e as fontes usadas',
      'Impacto prático em juros, parcela, CET e renda',
      'Quem deve ter mais cuidado',
      'Cenário numérico antes/depois',
      'Checklist de decisão',
      'Perguntas frequentes',
      'Conclusão com CTA natural'
    ],
    draft: {
      intro: [
        `${title} não deve ser lido como uma manchete isolada. Para quem vai contratar crédito, renegociar dívida ou comparar parcelas, a pergunta útil é outra: o que muda no bolso?`,
        `A leitura editorial da Cote Juros parte de ${sourceNames || primarySource}, mas evita transformar dado econômico em alarme. O ponto é traduzir o movimento em decisão prática: comparar CET, prazo, parcela, risco de atraso e alternativas antes de aceitar uma proposta.`
      ],
      sections: [
        {
          heading: 'O que aconteceu e por que importa',
          paragraphs: [
            `O tema entra no radar porque afeta custo, acesso ou segurança financeira do consumidor. Em vez de repetir a notícia, o artigo deve separar fato confirmado, interpretação e consequência prática.`,
            `Quando o assunto envolve ${brief.cluster}, a consequência costuma aparecer na parcela, na margem de renda, na exigência de análise ou no risco de contratação por impulso.`
          ]
        },
        {
          heading: 'Impacto prático no bolso',
          paragraphs: [
            'A primeira mudança que o leitor precisa entender é se o custo total ficou mais relevante que a parcela mensal. Muita gente olha apenas para o valor que cabe hoje e ignora o quanto pagará no contrato inteiro.',
            'Um exemplo simples deve entrar no artigo final: comparar duas propostas com o mesmo valor e prazos diferentes, mostrando parcela, total pago e risco de atraso.'
          ],
          table: {
            columns: ['Ponto de atenção', 'Como interpretar', 'Decisão prática'],
            rows: [
              ['CET', 'Mostra custo efetivo total, não só juros anunciados', 'Comparar propostas pelo mesmo valor e prazo'],
              ['Parcela', 'Pode parecer baixa por causa de prazo longo', 'Ver total pago antes de aceitar'],
              ['Renda', 'Define margem real para imprevistos', 'Testar a parcela em um mês ruim'],
              ['Fonte', 'Evita boato ou promessa comercial', 'Confirmar regra em fonte oficial']
            ]
          }
        },
        {
          heading: 'O que fazer agora',
          paragraphs: [
            'O artigo deve terminar com uma orientação simples: pausar se faltar informação, comparar alternativas e não contratar por medo de perder uma oferta.',
            'A Cote Juros não deve prometer aprovação nem taxa baixa. O valor editorial está em reduzir ansiedade e aumentar qualidade da decisão.'
          ],
          bullets: [
            'Verifique fonte e data da informação.',
            'Compare CET, prazo e custo total.',
            'Desconfie de taxa antecipada e aprovação garantida.',
            'Use o tema atual como contexto, não como gatilho de pressa.'
          ]
        }
      ],
      faq: [
        {
          question: `${title} muda a aprovação de crédito?`,
          answer: 'Pode influenciar condições, análise e custo, mas aprovação sempre depende de perfil, renda, modalidade e política da instituição.'
        },
        {
          question: 'Vale contratar crédito logo depois de uma notícia econômica?',
          answer: 'Só vale se a proposta continuar fazendo sentido no CET, no prazo e na renda. Notícia não substitui comparação.'
        },
        {
          question: 'Qual número olhar primeiro?',
          answer: 'Olhe o CET e o custo total pago. A parcela mensal sozinha pode esconder prazo longo ou custo alto.'
        }
      ],
      cta: {
        title: 'Compare antes de contratar',
        description: 'Use a notícia como contexto, mas tome a decisão olhando custo total, renda e risco real.',
        primary: { to: '/emprestimos', label: 'Comparar opções' },
        secondary: { to: '/diagnostico-financeiro', label: 'Avaliar orçamento' }
      }
    },
    validation: {
      dryRunOnly: true,
      publishableWithoutHumanReview: false,
      requiredBeforePublish: [
        'validar dado atual na fonte oficial',
        'inserir data do evento',
        'checar se houve atualização posterior',
        'revisar tom para evitar urgência artificial'
      ]
    }
  };
};

export class FinancialNewsIntelligenceService {
  static listSources() {
    return {
      ok: true,
      dryRun: true,
      sources: SOURCE_REGISTRY,
      guardrail: 'fontes de fintechs/bancos digitais so entram como contexto; dado sensivel precisa de fonte primaria'
    };
  }

  static detectTrends({ limit = 10 } = {}) {
    const trends = DRY_RUN_SIGNALS
      .map((signal) => ({
        ...signal,
        sources: (signal.sourceIds || []).map((id) => SOURCE_REGISTRY.find((source) => source.id === id)).filter(Boolean),
        classification: classifyTrend(signal),
        articleBrief: buildArticleBrief(signal)
      }))
      .sort((a, b) => b.classification.score - a.classification.score)
      .slice(0, Math.min(Number(limit) || 10, DRY_RUN_SIGNALS.length));

    return {
      ok: true,
      dryRun: true,
      autoPublish: false,
      persisted: false,
      generatedAt: new Date().toISOString(),
      detectionLogic: [
        'priorizar fonte primaria e autoridade',
        'dar peso a recencia, urgencia e impacto direto no consumidor',
        'promover noticia apenas quando ela vira decisao financeira pratica',
        'rebaixar noticia sem gancho evergreen ou sem fonte confiavel'
      ],
      trends
    };
  }

  static buildFreshnessStrategy() {
    return {
      ok: true,
      dryRun: true,
      contentMix: CONTENT_MIX,
      recommendedPublishing: [
        'manter evergreen e long tail como base de autoridade',
        'publicar trend/news explicativo apenas quando houver fonte primaria e impacto pratico',
        'limitar trends a 15-20% da producao para evitar cara de AI news spam',
        'converter bons trends em evergreen atualizado quando mantiverem busca',
        'exigir revisao humana em regulatorio, INSS, consignado, juros e golpes'
      ],
      refreshCadence: {
        highImpactTrend: 'revisar em 7, 15 e 45 dias',
        regulatory: 'revisar quando a fonte oficial atualizar',
        economicData: 'revisar no proximo Copom/IPCA/relatorio relevante',
        evergreenWithFreshHook: 'revisar trimestralmente ou por queda de CTR'
      }
    };
  }

  static buildTrendToArticlePipeline({ limit = 5 } = {}) {
    const trends = this.detectTrends({ limit }).trends;
    const briefs = trends.map((trend) => trend.articleBrief);

    return {
      ok: true,
      dryRun: true,
      autoPublish: false,
      persisted: false,
      pipeline: [
        'trend/news',
        'impact analysis',
        'SEO opportunity',
        'editorial angle',
        'premium article draft',
        'human review',
        'manual publish'
      ],
      reviewGates: [
        'fonte primaria presente',
        'data/contexto temporal claro',
        'impacto pratico no consumidor',
        'sem noticia pura sem decisao',
        'sem promessa financeira',
        'sem publicacao automatica'
      ],
      briefs
    };
  }

  static async createTrendArticlePreview({ keyword = '', limit = 5 } = {}) {
    const pipeline = this.buildTrendToArticlePipeline({ limit });
    const selected = keyword
      ? pipeline.briefs.find((brief) => normalize(brief.keyword).includes(normalize(keyword)) || normalize(keyword).includes(normalize(brief.keyword)))
      : pipeline.briefs[0];

    if (!selected) throw new Error('No trend brief available for preview');

    return {
      ok: true,
      mode: 'financial-news-trend-preview',
      dryRun: true,
      autoPublish: false,
      persisted: false,
      published: false,
      distributed: false,
      selectedBrief: selected,
      draft: buildTrendDraftPreview(selected)
    };
  }

  static buildDiagnosis({ limit = 5 } = {}) {
    const sources = this.listSources();
    const trends = this.detectTrends({ limit });
    const freshness = this.buildFreshnessStrategy();
    const pipeline = this.buildTrendToArticlePipeline({ limit });

    return {
      ok: true,
      dryRun: true,
      published: false,
      persisted: false,
      cron: false,
      autoPublish: false,
      sources: sources.sources,
      trendDetection: trends,
      examples: pipeline.briefs.map((brief) => ({
        title: brief.titleOptions[0],
        cluster: brief.cluster,
        angle: brief.angle,
        sources: brief.sources.map((source) => source.name)
      })),
      freshness,
      seoAdsenseImpact: {
        expected: 'aumentar freshness, CTR em temas quentes e cobertura de topical authority sem abandonar evergreen',
        bestUse: 'usar trend como hook e evergreen como corpo principal',
        adsensePotential: 'alto em credito, consignado, financiamento, score e golpes; medio em noticia institucional pura'
      },
      risks: {
        footprint: 'medio se repetir estrutura trend -> impacto -> checklist em todos os artigos',
        aiNewsSpam: 'alto se publicar noticias curtas sem interpretacao; baixo no modo assistido com fonte primaria e decisao pratica',
        mitigations: [
          'limitar trends a 15-20% da producao',
          'exigir fonte primaria e bloco de impacto pratico',
          'variar formatos: explicador, checklist, comparativo, cenario numerico, anti-golpe',
          'publicacao sempre manual'
        ]
      },
      recommendation: {
        assistedProduction: 'GO',
        automaticPublishing: 'NO-GO',
        reason: 'camada deve enriquecer pauta e draft; YMYL financeiro atual precisa revisao humana antes de publicar'
      }
    };
  }
}
