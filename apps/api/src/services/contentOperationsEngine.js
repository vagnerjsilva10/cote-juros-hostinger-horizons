import { getPrisma } from '../lib/prisma.js';
import { SerpIntelligenceService } from './serpIntelligenceService.js';
import { EditorialTopicFatigueService } from './editorialTopicFatigueService.js';
import { EditorialMemoryService } from './editorialMemoryService.js';
import { EditorialFingerprintService } from './editorialFingerprintService.js';
import { TopicalAuthorityService } from './topicalAuthorityService.js';
import { TrendIntelligenceService } from './trendIntelligenceService.js';
import { LiveDiscoveryResilienceService } from './liveDiscoveryResilienceService.js';

const WEEKLY_CONTENT_MIX = {
  evergreen_premium: 5,
  news_analysis: 4,
  market_update: 3,
  regulatory_update: 3,
  consumer_alert: 4,
  content_refresh: 3,
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
  market_update: {
    label: 'Market Update',
    minWords: 1000,
    maxWords: 2200,
    baseSeo: 81,
    baseEeat: 88,
    baseHumanization: 86,
    intent: 'market_context',
  },
  regulatory_update: {
    label: 'Regulatory Update',
    minWords: 1200,
    maxWords: 2600,
    baseSeo: 84,
    baseEeat: 92,
    baseHumanization: 86,
    intent: 'regulatory_explainer',
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
  ['news_analysis', 'evergreen_premium', 'consumer_alert'],
  ['regulatory_update', 'topical_support', 'evergreen_premium'],
  ['market_update', 'content_refresh', 'consumer_alert'],
  ['news_analysis', 'consumer_alert', 'topical_support'],
  ['regulatory_update', 'content_refresh', 'topical_support'],
  ['market_update', 'evergreen_premium', 'consumer_alert'],
  ['news_analysis', 'topical_support', 'evergreen_premium'],
];

const SUBSTITUTION_PRIORITY = [
  'news_analysis',
  'regulatory_update',
  'market_update',
  'consumer_alert',
  'content_refresh',
  'topical_support',
  'evergreen_premium',
];

const NEWS_TYPES = new Set(['news_analysis', 'market_update', 'regulatory_update']);
const CURRENT_AWARE_TYPES = new Set([...NEWS_TYPES, 'consumer_alert']);

const SATURATED_GENERIC_TERMS = [
  'credito',
  'emprestimo',
  'cartao',
  'financiamento',
  'score',
];

const FRESH_PRIORITY_TERMS = [
  'banco central',
  'bacen',
  'selic',
  'copom',
  'ipca',
  'dolar',
  'inss',
  'fgts',
  'consumidor gov',
  'consumidor.gov',
  'golpe',
  'fraude',
  'pix',
  'regulatoria',
  'regulacao',
  'nova regra',
  'mudanca',
  'direitos do consumidor',
  'orcamento familiar',
  'superendividamento',
  'minimo existencial',
];

const OFFICIAL_SOURCE_PATTERNS = [
  { label: 'Banco Central', pattern: /bcb gov br|bcb\.gov\.br|banco central|bacen|copom|selic/ },
  { label: 'IBGE', pattern: /ibge gov br|ibge\.gov\.br|ipca|inflacao/ },
  { label: 'INSS/Gov.br', pattern: /gov br|gov\.br|inss|meu inss|dataprev/ },
  { label: 'Caixa/FGTS', pattern: /caixa gov br|caixa\.gov\.br|fgts|saque aniversario/ },
  { label: 'Receita/Fazenda', pattern: /receita economia gov br|receita\.economia\.gov\.br|receitafederal|fazenda gov br|fazenda\.gov\.br|ministerio da fazenda/ },
  { label: 'Consumidor.gov.br', pattern: /consumidor gov br|consumidor\.gov\.br/ },
];

const TRUSTED_SECONDARY_PATTERNS = [
  /agenciabrasil ebc com br|agenciabrasil\.ebc\.com\.br/,
  /valor globo com|valor\.globo\.com/,
  /infomoney com br|infomoney\.com\.br/,
  /estadao com br|estadao\.com\.br/,
  /folha uol com br|folha\.uol\.com\.br/,
  /g1 globo com|g1\.globo\.com/,
  /cnnbrasil com br|cnnbrasil\.com\.br/,
  /exame com|exame\.com/,
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

function termHits(value = '', terms = []) {
  const normalized = normalizeText(value);
  return terms.filter((term) => normalized.includes(normalizeText(term)));
}

function compactNearestMatch(match = null) {
  if (!match) return null;
  return {
    slug: match.slug,
    title: match.title,
    family: match.family,
    status: match.status,
    score: match.score,
    semanticScore: match.semanticScore,
    titleScore: match.titleScore,
  };
}

function daysOld(dateLike = null, now = new Date()) {
  const date = dateLike ? new Date(dateLike) : null;
  if (!date || Number.isNaN(date.getTime())) return null;
  return Math.max(0, (now.getTime() - date.getTime()) / (24 * 60 * 60 * 1000));
}

function assessNewsMetadata(candidate = {}, now = new Date()) {
  const sources = candidate.newsSources || candidate.sources || [];
  const haystack = normalizeText([
    candidate.keyword,
    candidate.title,
    candidate.angle,
    candidate.newsSource,
    candidate.sourceUrl,
    ...sources.flatMap((source) => [source.domain, source.title, source.url]),
  ].join(' '));
  const firstPublishedAt = candidate.publishedAt || sources.find((source) => source.publishedAt)?.publishedAt || null;
  const ageDays = daysOld(firstPublishedAt, now);
  const officialSource = OFFICIAL_SOURCE_PATTERNS.find((source) => source.pattern.test(haystack));
  const officialSourceDetected = Boolean(officialSource);
  const secondSourceConfirmed = sources.length >= 2 || TRUSTED_SECONDARY_PATTERNS.some((pattern) => pattern.test(haystack));
  const freshnessScore = ageDays === null
    ? (NEWS_TYPES.has(candidate.type) ? 25 : 45)
    : clamp(100 - Math.max(0, ageDays - 1) * 18);
  const impactHits = termHits(haystack, [
    'bolso',
    'orcamento',
    'familia',
    'juros',
    'taxa',
    'beneficio',
    'desconto',
    'preco',
    'inflacao',
    'fatura',
    'renda',
    'conta',
    'pix',
  ]);
  const impactOnWalletScore = clamp(45 + impactHits.length * 9 + (officialSourceDetected ? 12 : 0));
  const newsworthinessScore = clamp(
    freshnessScore * 0.45 +
      impactOnWalletScore * 0.3 +
      (officialSourceDetected ? 18 : 0) +
      (secondSourceConfirmed ? 12 : 0)
  );
  const reasonIfRejected = [
    NEWS_TYPES.has(candidate.type) && !firstPublishedAt ? 'news_without_published_at' : null,
    NEWS_TYPES.has(candidate.type) && freshnessScore < 60 ? 'news_freshness_below_required' : null,
    NEWS_TYPES.has(candidate.type) && !officialSourceDetected && !secondSourceConfirmed ? 'news_without_official_or_second_source' : null,
    NEWS_TYPES.has(candidate.type) && impactOnWalletScore < 58 ? 'news_without_clear_wallet_impact' : null,
  ].filter(Boolean);

  return {
    newsSource: candidate.newsSource || sources[0]?.domain || candidate.source || null,
    sourceUrl: candidate.sourceUrl || sources[0]?.url || null,
    publishedAt: firstPublishedAt,
    sourceAgeDays: ageDays === null ? null : Number(ageDays.toFixed(2)),
    officialSourceDetected,
    officialSource: officialSource?.label || null,
    secondSourceConfirmed,
    freshnessScore,
    impactOnWalletScore,
    newsworthinessScore,
    reasonIfRejected,
    sources: sources.slice(0, 4),
  };
}

function classifyDiscoveredType({ seedType = 'topical_support', keyword = '', serpResult = {} } = {}) {
  const haystack = normalizeText([
    keyword,
    serpResult.searchIntent,
    serpResult.primaryTrend,
    ...(serpResult.entities || []),
    ...(serpResult.rawSerpSummary || []).flatMap((item) => [item.title, item.snippet, item.domain]),
  ].join(' '));

  if (/receita|fazenda|banco central|bacen|cmn|resolucao|regra|regulacao|norma|caixa|fgts|inss|gov br|consumidor gov/.test(haystack)) {
    return 'regulatory_update';
  }
  if (/dolar|mercado|ipca|inflacao|selic|copom|juros futuros|bolsa|cambio/.test(haystack)) {
    return 'market_update';
  }
  if (/golpe|fraude|vazamento|falso|alerta|seguranca|pix/.test(haystack)) {
    return 'consumer_alert';
  }
  return seedType;
}

function uniq(items) {
  return Array.from(new Set(items.filter(Boolean)));
}

async function mapWithConcurrency(items = [], limit = 4, mapper = async (item) => item) {
  const results = new Array(items.length);
  let cursor = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await mapper(items[index], index);
    }
  });
  await Promise.all(workers);
  return results;
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
    market_update: 'Entenda o dado de mercado pelo impacto no seu bolso antes de tomar decisao.',
    regulatory_update: 'Confira a fonte oficial e transforme a mudanca de regra em uma acao segura.',
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
      news: candidate.news || null,
    },
  };
}

function deriveCandidateFromSerp(keyword, serpResult, type = 'topical_support') {
  const gaps = serpResult?.contentGaps || [];
  const related = serpResult?.relatedSearches || [];
  const paa = serpResult?.peopleAlsoAsk || [];
  const rawSummary = serpResult?.rawSerpSummary || [];
  const seedType = classifyDiscoveredType({ seedType: type, keyword, serpResult });
  const terms = [...related, ...paa, ...gaps]
    .map((item) => (typeof item === 'string' ? item : item?.question || item?.query || item?.gap || ''))
    .map((item) => normalizeText(item))
    .filter(Boolean);

  const newsTitle = rawSummary
    .map((item) => normalizeText(item.title || ''))
    .find((term) => term.length > 20);
  const picked = NEWS_TYPES.has(seedType)
    ? (newsTitle || keyword)
    : (terms.find((term) => term.length > 20 && !term.includes('emprestimo para negativado')) || keyword);
  const rawSources = rawSummary
    .filter((item) => item.domain || item.title)
    .map((item) => ({
      title: item.title,
      domain: item.domain,
      url: item.url || null,
      publishedAt: item.publishedAt || null,
    }));
  const classifiedType = classifyDiscoveredType({ seedType, keyword: picked, serpResult });
  const newsMetadata = assessNewsMetadata({
    keyword: picked,
    type: classifiedType,
    newsSource: rawSources[0]?.domain || null,
    publishedAt: rawSources[0]?.publishedAt || null,
    newsSources: rawSources,
    angle: `pauta descoberta por SERP recente para cobrir lacuna associada a ${keyword}`,
  });
  return {
    keyword: picked,
    type: classifiedType,
    cluster: TopicalAuthorityService.classifyCluster({ keyword: picked, category: type }),
    family: TopicalAuthorityService.classifyCluster({ keyword: picked, category: type }),
    angle: `pauta descoberta por SERP recente para cobrir lacuna associada a ${keyword}`,
    source: 'serp_discovery',
    news: newsMetadata,
    newsSource: newsMetadata.newsSource,
    sourceUrl: newsMetadata.sourceUrl,
    publishedAt: newsMetadata.publishedAt,
    newsSources: newsMetadata.sources,
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
    maxSerpSeeds = 6,
  } = {}) {
    const hasSerpApi = Boolean(process.env.SERPAPI_API_KEY);
    const hasValueSerp = Boolean(process.env.VALUESERP_API_KEY);
    const canUseLive = Boolean(useLiveDiscovery && (hasSerpApi || hasValueSerp));

    const seeds = [
      { keyword: 'Banco Central nova regra Pix seguranca consumidor', type: 'regulatory_update', searchMode: 'news', recencyDays: 3 },
      { keyword: 'Copom Selic ata impacto orcamento familiar', type: 'market_update', searchMode: 'news', recencyDays: 3 },
      { keyword: 'IPCA IBGE alimentos orcamento familiar', type: 'market_update', searchMode: 'news', recencyDays: 7 },
      { keyword: 'INSS golpes consignado bloqueio beneficio aposentado', type: 'consumer_alert' },
      { keyword: 'FGTS Caixa saque aniversario mudancas regras trabalhador', type: 'regulatory_update', searchMode: 'news', recencyDays: 7 },
      { keyword: 'Receita Federal Fazenda mudanca imposto renda consumidor', type: 'regulatory_update', searchMode: 'news', recencyDays: 7 },
      { keyword: 'consumidor.gov.br bancos reclamacao financeira provas', type: 'topical_support' },
      { keyword: 'superendividamento minimo existencial renegociacao consumidor', type: 'evergreen_premium' },
      { keyword: 'golpes financeiros novos alerta Banco Central Pix', type: 'consumer_alert' },
      { keyword: 'dolar mercado cambio impacto cartao internacional consumidor', type: 'market_update', searchMode: 'news', recencyDays: 3 },
    ];
    const recentIso = new Date().toISOString();
    const yesterdayIso = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const discovered = [
      {
        keyword: 'INSS golpes no consignado como bloquear desconto indevido',
        type: 'consumer_alert',
        cluster: 'inss_consignado',
        family: 'golpes_fraudes',
        angle: 'protecao de beneficio, prova, banco, Meu INSS e contestacao',
        source: 'simulated_discovery',
        publishedAt: yesterdayIso,
        newsSource: 'gov.br',
        newsSources: [
          { domain: 'gov.br', title: 'INSS e canais oficiais', publishedAt: yesterdayIso },
          { domain: 'consumidor.gov.br', title: 'Reclamacao e prova documental', publishedAt: yesterdayIso },
        ],
      },
      {
        keyword: 'ata do Copom como ler impacto da Selic no orcamento familiar',
        type: 'market_update',
        cluster: 'juros_selic',
        family: 'news',
        angle: 'explicar noticia economica sem recomendacao impulsiva de credito',
        source: 'simulated_discovery',
        publishedAt: recentIso,
        newsSource: 'bcb.gov.br',
        newsSources: [
          { domain: 'bcb.gov.br', title: 'Comunicado e ata do Copom', publishedAt: recentIso },
          { domain: 'agenciabrasil.ebc.com.br', title: 'Cobertura economica recente', publishedAt: recentIso },
        ],
      },
      {
        keyword: 'consumidor gov br contra banco como organizar provas',
        type: 'topical_support',
        cluster: 'consumidor_gov',
        family: 'defesa_consumidor',
        angle: 'protocolos, documentos, linha do tempo e pedido objetivo',
        source: 'simulated_discovery',
      },
      {
        keyword: 'IPCA dos alimentos como ajustar o orcamento familiar',
        type: 'market_update',
        cluster: 'ipca_orcamento',
        family: 'educacao_financeira',
        angle: 'inflacao no mercado, substituicoes, prioridade de contas e reserva minima',
        source: 'simulated_discovery',
        publishedAt: recentIso,
        newsSource: 'ibge.gov.br',
        newsSources: [
          { domain: 'ibge.gov.br', title: 'IPCA e grupos de alimentos', publishedAt: recentIso },
          { domain: 'agenciabrasil.ebc.com.br', title: 'Analise de inflacao recente', publishedAt: recentIso },
        ],
      },
      {
        keyword: 'dolar alto no cartao internacional como reduzir risco antes da compra',
        type: 'market_update',
        cluster: 'dolar_consumidor',
        family: 'defesa_consumidor',
        angle: 'IOF, data de conversao, limite, contestacao e orcamento',
        source: 'simulated_discovery',
        publishedAt: recentIso,
        newsSource: 'bcb.gov.br',
        newsSources: [
          { domain: 'bcb.gov.br', title: 'Cotacao e cambio oficial', publishedAt: recentIso },
          { domain: 'valor.globo.com', title: 'Dolar e mercado no dia', publishedAt: recentIso },
        ],
      },
      {
        keyword: 'Banco Central nova regra de seguranca do Pix como afeta o consumidor',
        type: 'regulatory_update',
        cluster: 'pix_seguranca',
        family: 'banco_central',
        angle: 'mudanca oficial traduzida em limites, contestacao e cuidado antes de transferir',
        source: 'simulated_discovery',
        publishedAt: recentIso,
        newsSource: 'bcb.gov.br',
        newsSources: [
          { domain: 'bcb.gov.br', title: 'Regras e comunicados sobre Pix', publishedAt: recentIso },
          { domain: 'agenciabrasil.ebc.com.br', title: 'Cobertura de servico sobre Pix', publishedAt: recentIso },
        ],
      },
      {
        keyword: 'FGTS Caixa novas regras o que conferir antes de antecipar saque aniversario',
        type: 'regulatory_update',
        cluster: 'fgts',
        family: 'fgts',
        angle: 'fonte oficial, saldo bloqueado, custo da antecipacao e impacto na emergencia',
        source: 'simulated_discovery',
        publishedAt: recentIso,
        newsSource: 'caixa.gov.br',
        newsSources: [
          { domain: 'caixa.gov.br', title: 'Informacoes oficiais sobre FGTS', publishedAt: recentIso },
          { domain: 'gov.br', title: 'Regras trabalhistas e canais oficiais', publishedAt: recentIso },
        ],
      },
      {
        keyword: 'Receita Federal e Fazenda o que muda no bolso do contribuinte',
        type: 'regulatory_update',
        cluster: 'receita_fazenda',
        family: 'impostos',
        angle: 'mudanca oficial explicada por prazo, documento, risco de multa e caixa familiar',
        source: 'simulated_discovery',
        publishedAt: recentIso,
        newsSource: 'gov.br',
        newsSources: [
          { domain: 'gov.br', title: 'Receita Federal e Ministerio da Fazenda', publishedAt: recentIso },
          { domain: 'agenciabrasil.ebc.com.br', title: 'Servico sobre prazo e regras fiscais', publishedAt: recentIso },
        ],
      },
      {
        keyword: 'superendividamento e minimo existencial como proteger contas essenciais',
        type: 'evergreen_premium',
        cluster: 'superendividamento',
        family: 'defesa_consumidor',
        angle: 'lei do superendividamento, audiencia de conciliacao e contas essenciais',
        source: 'simulated_discovery',
      },
      {
        keyword: 'golpe do Pix por aproximacao como conferir antes de contestar',
        type: 'consumer_alert',
        cluster: 'golpes_pix',
        family: 'golpes_fraudes',
        angle: 'alerta pratico com comprovante, contestacao no banco e boletim de ocorrencia',
        source: 'simulated_discovery',
        publishedAt: yesterdayIso,
        newsSource: 'bcb.gov.br',
        newsSources: [
          { domain: 'bcb.gov.br', title: 'Seguranca do Pix e MED', publishedAt: yesterdayIso },
          { domain: 'consumidor.gov.br', title: 'Canais de contestacao', publishedAt: yesterdayIso },
        ],
      },
    ];

    for (const candidate of discovered) {
      if (CURRENT_AWARE_TYPES.has(candidate.type)) {
        candidate.news = assessNewsMetadata(candidate);
      }
    }

    const liveResults = [];
    if (canUseLive) {
      const resilient = await LiveDiscoveryResilienceService.fetchWithResilience({
        key: `serp-discovery:${seeds.map((seed) => seed.keyword).join('|')}`,
        timeoutMs: 14000,
        retries: 1,
        fetcher: async () => {
          const settled = await Promise.allSettled(seeds.slice(0, maxSerpSeeds).map(async (seed) => {
            const serp = await SerpIntelligenceService.analyzeKeyword({
              keyword: seed.keyword,
              dryRun: false,
              topN: 8,
              searchMode: seed.searchMode || (NEWS_TYPES.has(seed.type) ? 'news' : 'web'),
              recencyDays: seed.recencyDays || (NEWS_TYPES.has(seed.type) ? 3 : null),
            });
            return deriveCandidateFromSerp(seed.keyword, serp, seed.type);
          }));
          const items = settled
            .filter((result) => result.status === 'fulfilled')
            .map((result) => result.value);
          return {
            ok: true,
            candidates: LiveDiscoveryResilienceService.rankOffline(items),
            provider: process.env.SERPAPI_API_KEY ? 'serpapi' : 'valueserp',
            failedSeeds: settled.filter((result) => result.status === 'rejected').length,
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
        serpUsed: canUseLive && hasSerpApi,
        valueSerpUsed: canUseLive && !hasSerpApi && hasValueSerp,
        providerMissing: [
          !hasSerpApi ? 'SERPAPI_API_KEY' : null,
          !hasValueSerp ? 'VALUESERP_API_KEY' : null,
        ].filter(Boolean),
        providerWarnings: [
          !hasSerpApi ? 'SERPAPI_API_KEY ausente: live discovery depende de VALUESERP_API_KEY' : null,
          !hasValueSerp ? 'VALUESERP_API_KEY ausente: seguindo com SERPAPI quando disponivel' : null,
        ].filter(Boolean),
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
    const isNews = NEWS_TYPES.has(candidate.type);
    const news = CURRENT_AWARE_TYPES.has(candidate.type)
      ? assessNewsMetadata({ ...candidate, newsSources: candidate.newsSources || candidate.news?.sources || [] })
      : null;
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
    if (clusterWeekCount >= 3 && !NEWS_TYPES.has(candidate.type)) blockers.push('weekly_cluster_pressure');
    if (typeWeekCount >= typeTarget) blockers.push('weekly_type_quota_filled');
    if ((authority?.clusterHealth?.status === 'overcovered' || authority?.clusterHealth?.status === 'saturated') && !isRefresh) {
      blockers.push('topical_saturation');
    }
    if (isNews) {
      if (!news?.publishedAt) blockers.push('news_without_published_at');
      if ((news?.freshnessScore || 0) < 60) blockers.push('news_freshness_low');
      if (!news?.officialSourceDetected && !news?.secondSourceConfirmed) blockers.push('news_source_unconfirmed');
      if ((news?.impactOnWalletScore || 0) < 58) blockers.push('wallet_impact_low');
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
        (CURRENT_AWARE_TYPES.has(candidate.type) ? 5 : 0) +
        (news?.officialSourceDetected ? 4 : 0) +
        (news?.secondSourceConfirmed ? 2 : 0) -
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
      angle: candidate.angle || null,
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
        freshnessScore: news?.freshnessScore || trend?.freshness || 0,
        impactOnWalletScore: news?.impactOnWalletScore || 0,
        newsworthinessScore: news?.newsworthinessScore || 0,
        semanticSimilarity: memory?.highestSemanticSimilarity || 0,
        titleSimilarity: memory?.highestTitleSimilarity || 0,
        canibalization: canibalizationRisk,
      },
      nearestCompetingArticle: compactNearestMatch(memory?.closestMatches?.[0]),
      closestMatches: (memory?.closestMatches || []).slice(0, 3).map(compactNearestMatch),
      news,
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
    if ((trend?.freshnessScore || 0) >= 60 || NEWS_TYPES.has(candidate.type)) parts.push('tem frescor editorial');
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

    return mapWithConcurrency(
      candidates,
      4,
      (candidate) => this.evaluateCandidate({ candidate, dayIndex: 0, weekState, dryRun })
    );
  }

  static candidateKey(item = {}) {
    return `${item.type}:${item.targetSlug || toSlug(item.keyword)}`;
  }

  static scoreAutonomousCandidate(item = {}) {
    const haystack = `${item.keyword || ''} ${item.family || ''} ${item.cluster || ''} ${item.angle || ''} ${item.reason || ''}`;
    const genericHits = termHits(haystack, SATURATED_GENERIC_TERMS);
    const freshnessHits = termHits(haystack, FRESH_PRIORITY_TERMS);
    const semanticSimilarity = item.scores?.semanticSimilarity || 0;
    const titleSimilarity = item.scores?.titleSimilarity || 0;
    const canibalization = item.scores?.canibalization || 0;
    const fingerprintRisk = item.scores?.fingerprintRisk || 0;
    const refreshLike = Boolean(item.targetSlug || item.refreshPlanned || item.updatePlanned);
    const officialOrFresh = freshnessHits.length > 0 || CURRENT_AWARE_TYPES.has(item.type);
    const news = item.news || {};

    const penalties = {
      genericCredit: genericHits.length * (officialOrFresh ? 12 : 28),
      similarSlugOrKeyword: Math.max(0, titleSimilarity - 35) * 1.6 + Math.max(0, semanticSimilarity - 42) * 1.2,
      disguisedRefresh: refreshLike && item.type !== 'content_refresh' ? 40 : 0,
      refreshPressure: item.type === 'content_refresh' && canibalization > 45 ? 22 : 0,
      canibalization: Math.max(0, canibalization - 35) * 2.2,
      fingerprint: Math.max(0, fingerprintRisk - 24) * 2.4,
      staleNews: NEWS_TYPES.has(item.type) ? Math.max(0, 70 - (news.freshnessScore || 0)) * 1.8 : 0,
      weakSource: NEWS_TYPES.has(item.type) && !news.officialSourceDetected && !news.secondSourceConfirmed ? 42 : 0,
      lowWalletImpact: NEWS_TYPES.has(item.type) ? Math.max(0, 62 - (news.impactOnWalletScore || 0)) * 1.2 : 0,
    };

    const boosts = {
      currentFinancial: freshnessHits.length * 18,
      newsOrRegulatory: CURRENT_AWARE_TYPES.has(item.type) ? 22 : 0,
      recentNews: NEWS_TYPES.has(item.type) && (news.freshnessScore || 0) >= 80 ? 28 : 0,
      officialChange: NEWS_TYPES.has(item.type) && news.officialSourceDetected ? 24 : 0,
      confirmedNews: NEWS_TYPES.has(item.type) && news.secondSourceConfirmed ? 16 : 0,
      walletImpact: NEWS_TYPES.has(item.type) ? Math.max(0, (news.impactOnWalletScore || 0) - 60) * 0.9 : 0,
      lowCannibalization: Math.max(0, 45 - canibalization) * 0.5,
      officialConsumer: /banco central|bacen|consumidor gov|consumidor\.gov|inss|fgts/.test(normalizeText(haystack)) ? 20 : 0,
      underusedCluster: Math.max(0, (item.scores?.topicalAuthorityGain || 0) - 70) * 0.7,
    };

    const base =
      (item.scores?.seo || 0) +
      (item.scores?.eeat || 0) +
      (item.scores?.humanization || 0) +
      (item.scores?.diversity || 0) +
      (item.scores?.topicalAuthorityGain || 0);

    const penaltyTotal = Object.values(penalties).reduce((sum, value) => sum + value, 0);
    const boostTotal = Object.values(boosts).reduce((sum, value) => sum + value, 0);

    return {
      score: Math.round(base + boostTotal - penaltyTotal),
      base: Math.round(base),
      penalties,
      boosts,
      genericHits,
      freshnessHits,
    };
  }

  static pickCandidateOptionsForSlot({ evaluations, desiredType, usedKeys, weekState, limit = 3 }) {
    const eligible = evaluations
      .filter((item) => item.type === desiredType)
      .filter((item) => !usedKeys.has(this.candidateKey(item)))
      .filter((item) => item.governance.publishAllowed)
      .filter((item) => !weekState.dayClusters.has(item.cluster))
      .filter((item) => (weekState.typeCounts.get(item.type) || 0) < (weekState.typeTargets?.[item.type] || WEEKLY_CONTENT_MIX[item.type] || 0))
      .map((item) => ({
        ...item,
        selection: this.scoreAutonomousCandidate(item),
      }))
      .sort((a, b) => b.selection.score - a.selection.score);

    return eligible.slice(0, limit);
  }

  static pickCandidateForSlot({ evaluations, desiredType, usedKeys, weekState }) {
    return this.pickCandidateOptionsForSlot({ evaluations, desiredType, usedKeys, weekState, limit: 1 })[0] || null;
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
      const candidateOptions = [];

      for (const desiredType of desiredTypes) {
        const slotNumber = selected.length + skippedSlots.length + 1;
        let options = this.pickCandidateOptionsForSlot({
          evaluations: baseEvaluations,
          desiredType,
          usedKeys,
          weekState,
          limit: 3,
        });
        let picked = options[0] || null;
        let selectedType = desiredType;

        let substitutionUsed = false;
        if (!picked) {
          for (const fallbackType of SUBSTITUTION_PRIORITY) {
            options = this.pickCandidateOptionsForSlot({
              evaluations: baseEvaluations,
              desiredType: fallbackType,
              usedKeys,
              weekState,
              limit: 3,
            });
            picked = options[0] || null;
            if (picked) {
              substitutionUsed = true;
              selectedType = fallbackType;
              break;
            }
          }
        }

        if (picked) {
          const seenOptionKeys = new Set(options.map((item) => this.candidateKey(item)));
          const fallbackOptions = [];
          for (const fallbackType of SUBSTITUTION_PRIORITY) {
            if (fallbackType === selectedType && desiredType !== 'content_refresh') continue;
            for (const fallbackOption of this.pickCandidateOptionsForSlot({
              evaluations: baseEvaluations,
              desiredType: fallbackType,
              usedKeys,
              weekState,
              limit: 3,
            })) {
              const optionKey = this.candidateKey(fallbackOption);
              if (seenOptionKeys.has(optionKey)) continue;
              seenOptionKeys.add(optionKey);
              fallbackOptions.push(fallbackOption);
            }
          }
          if (desiredType === 'content_refresh') {
            options = [...options, ...fallbackOptions]
              .sort((a, b) => b.selection.score - a.selection.score)
              .slice(0, 3);
            picked = options[0] || picked;
            selectedType = picked.type;
            substitutionUsed = selectedType !== desiredType;
          } else if (options.length < 3) {
            options = [...options, ...fallbackOptions].slice(0, 3);
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

        candidateOptions.push({
          slot: slotNumber,
          desiredType,
          selectedType,
          substitutionUsed,
          options,
          rejectedBeforeGeneration: baseEvaluations
            .filter((item) => item.type === desiredType)
            .filter((item) => item.blockers.length)
            .slice(0, 6)
            .map((item) => ({
              keyword: item.keyword,
              slug: item.targetSlug || toSlug(item.keyword),
              type: item.type,
              family: item.family,
              cluster: item.cluster,
              blockers: item.blockers,
              reason: item.reason,
              scores: item.scores,
              nearestCompetingArticle: item.nearestCompetingArticle,
            })),
        });

        const key = this.candidateKey(picked);
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
        candidateOptions,
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
          freshnessScore: item.scores.freshnessScore,
          impactOnWalletScore: item.scores.impactOnWalletScore,
          newsworthinessScore: item.scores.newsworthinessScore,
          topicalAuthorityGain: item.scores.topicalAuthorityGain,
          canibalization: item.scores.canibalization,
          news: item.news || null,
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
