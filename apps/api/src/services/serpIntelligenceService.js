import axios from 'axios';

const DEFAULT_OFFICIAL_SOURCES = [
  { label: 'Banco Central do Brasil', url: 'https://www.bcb.gov.br/', topics: ['juros', 'credito', 'emprestimo', 'financiamento', 'cet', 'banco'] },
  { label: 'Gov.br', url: 'https://www.gov.br/', topics: ['cpf', 'inss', 'consignado', 'financiamento', 'direito', 'consumidor'] },
  { label: 'Serasa', url: 'https://www.serasa.com.br/', topics: ['score', 'negativado', 'divida', 'cpf', 'credito'] },
  { label: 'Febraban', url: 'https://portal.febraban.org.br/', topics: ['banco', 'credito', 'juros', 'cartao', 'emprestimo'] },
  { label: 'CVM', url: 'https://www.gov.br/cvm/', topics: ['investimento', 'renda fixa', 'fundo', 'tesouro'] }
];

const FINANCIAL_ENTITIES = [
  'CET',
  'IOF',
  'taxa de juros',
  'custo total',
  'parcela',
  'prazo',
  'score',
  'CPF',
  'renda',
  'margem consignavel',
  'rotativo',
  'inadimplencia',
  'portabilidade',
  'contrato',
  'tarifa'
];

const normalize = (value = '') =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

const compact = (value = '') => String(value || '').replace(/\s+/g, ' ').trim();

const unique = (items = []) => Array.from(new Set(items.map(compact).filter(Boolean)));

const domainFromUrl = (value = '') => {
  try {
    return new URL(value).hostname.replace(/^www\./i, '').toLowerCase();
  } catch {
    return '';
  }
};

const classifyIntent = ({ keyword = '', results = [] } = {}) => {
  const text = normalize([
    keyword,
    ...results.flatMap((item) => [item.title, item.snippet])
  ].join(' '));

  if (/simulador|calculadora|consulta|tabela|fipe|calcular/.test(text)) return 'transacional';
  if (/melhor|comparar|comparativo|ranking|opcoes|versus| vs /.test(text)) return 'comparativo';
  if (/emprestimo|financiamento|cartao|contratar|solicitar|aprovar|proposta|oferta/.test(text)) return 'comercial';
  return 'informacional';
};

const inferContentType = (result = {}) => {
  const text = normalize(`${result.title} ${result.snippet} ${result.url}`);
  if (/simulador|calculadora|consulta|tabela/.test(text)) return 'ferramenta';
  if (/melhor|ranking|comparativo|opcoes/.test(text)) return 'lista comparativa';
  if (/guia|como|passo a passo|o que e|vale a pena/.test(text)) return 'guia explicativo';
  if (/noticia|2025|2026|hoje|mudanca|nova regra/.test(text)) return 'noticia';
  return 'artigo educativo';
};

const inferReaderProblem = ({ keyword = '', searchIntent = '' } = {}) => {
  const normalized = normalize(keyword);
  if (/negativado|score|cpf|restri/.test(normalized)) {
    return `Entender se ${keyword} e possivel, quais riscos existem e como evitar promessa de aprovacao facil.`;
  }
  if (/financiamento|veiculo|imovel|entrada/.test(normalized)) {
    return `Comparar custo total, entrada, prazo e risco antes de assumir uma parcela longa sobre ${keyword}.`;
  }
  if (/cartao|limite|fatura|rotativo/.test(normalized)) {
    return `Entender custos, limite, juros e cuidados para nao transformar ${keyword} em divida cara.`;
  }
  if (searchIntent === 'comparativo') {
    return `Escolher entre alternativas de ${keyword} sem comparar apenas a promessa comercial.`;
  }
  return `Resolver a duvida principal sobre ${keyword} com criterio pratico, numeros e cautela financeira.`;
};

const extractQuestionCandidates = ({ keyword = '', results = [], relatedQuestions = [] } = {}) => {
  const fromResults = results.flatMap((item) => {
    const text = `${item.title || ''}. ${item.snippet || ''}`;
    return text
      .split(/[.!?]/)
      .map(compact)
      .filter((sentence) => /^(como|qual|quais|quanto|vale|posso|o que|por que|quando)\b/i.test(sentence))
      .map((sentence) => `${sentence.replace(/\?+$/g, '')}?`);
  });

  const defaults = [
    `${keyword} vale a pena?`,
    `Quais cuidados antes de contratar ${keyword}?`,
    `Como comparar o custo real de ${keyword}?`,
    `Quais riscos financeiros existem em ${keyword}?`
  ];

  return unique([...relatedQuestions, ...fromResults, ...defaults]).slice(0, 8);
};

const inferMustCoverTopics = ({ keyword = '', results = [], searchIntent = '' } = {}) => {
  const text = normalize(results.flatMap((item) => [item.title, item.snippet]).join(' '));
  const topics = [
    `Resposta direta sobre ${keyword}`,
    'Custo total, CET, juros, prazo e parcela',
    'Exemplo numerico em reais',
    'Riscos de atraso, endividamento e promessa de aprovacao',
    'Alternativas antes da contratacao',
    'Checklist de decisao'
  ];

  if (/score|negativado|cpf/.test(text)) topics.push('Impacto do score e restricoes no CPF');
  if (/simulador|calculadora|tabela/.test(text) || searchIntent === 'transacional') topics.push('Como simular e interpretar uma tabela');
  if (/comparar|melhor|opcoes|ranking/.test(text) || searchIntent === 'comparativo') topics.push('Comparacao entre alternativas e criterios objetivos');

  return unique(topics).slice(0, 10);
};

const inferContentGaps = ({ keyword = '', results = [] } = {}) => {
  const text = normalize(results.flatMap((item) => [item.title, item.snippet]).join(' '));
  const gaps = [];

  if (!/cet|custo efetivo total/.test(text)) gaps.push('Explicar CET e custo total com linguagem simples.');
  if (!/exemplo|simulacao|r\$|\d+%/.test(text)) gaps.push('Trazer exemplo numerico realista em reais, prazo e percentual.');
  if (!/risco|atraso|inadimplencia|cuidado/.test(text)) gaps.push('Mostrar risco financeiro e cenario negativo antes de recomendar qualquer caminho.');
  if (!/gov|banco central|bcb|serasa|febraban/.test(text)) gaps.push('Citar fontes oficiais brasileiras relevantes para dar lastro factual.');
  if (!/checklist|passo a passo|lista/.test(text)) gaps.push('Adicionar checklist prático para tomada de decisao.');

  return gaps.length ? gaps : [`Criar angulo proprio para ${keyword} com comparacao, exemplos e cautelas que os concorrentes tratam superficialmente.`];
};

const inferEntities = ({ keyword = '', results = [] } = {}) => {
  const haystack = normalize(`${keyword} ${results.flatMap((item) => [item.title, item.snippet]).join(' ')}`);
  return FINANCIAL_ENTITIES.filter((entity) => haystack.includes(normalize(entity))).slice(0, 10);
};

const inferOfficialSources = ({ keyword = '', entities = [] } = {}) => {
  const haystack = normalize(`${keyword} ${entities.join(' ')}`);
  return DEFAULT_OFFICIAL_SOURCES
    .filter((source) => source.topics.some((topic) => haystack.includes(normalize(topic))))
    .slice(0, 4);
};

const buildRecommendedStructure = ({ keyword = '', searchIntent = '', mustCoverTopics = [] } = {}) => {
  const intentLead = {
    informacional: 'O que e e resposta direta',
    comercial: 'Quando faz sentido e quando evitar',
    comparativo: 'Comparacao objetiva entre alternativas',
    transacional: 'Como simular ou consultar com seguranca'
  }[searchIntent] || 'Resposta direta';

  return unique([
    `${intentLead} sobre ${keyword}`,
    ...mustCoverTopics.slice(1, 5),
    'Tabela/checklist com criterios de comparacao',
    'FAQ com perguntas reais da SERP',
    'Conclusao com CTA natural para comparar na Cote Juros'
  ]).slice(0, 8);
};

const buildTopPatterns = ({ results = [] } = {}) => {
  const domains = results.map((item) => domainFromUrl(item.url)).filter(Boolean);
  const types = results.map(inferContentType);
  return unique([
    ...types.map((type) => `Tipo recorrente: ${type}`),
    domains.length ? `Dominios analisados: ${unique(domains).slice(0, 6).join(', ')}` : '',
    results.some((item) => /guia|como|passo/i.test(`${item.title} ${item.snippet}`)) ? 'Concorrentes usam formato guia/passos.' : '',
    results.some((item) => /melhor|compar/i.test(`${item.title} ${item.snippet}`)) ? 'Concorrentes tentam capturar comparacao/opcoes.' : ''
  ]).slice(0, 8);
};

const normalizeSerpApiPayload = (payload = {}) => ({
  results: (payload.organic_results || []).map((item, index) => ({
    position: Number(item.position || index + 1),
    title: item.title || '',
    url: item.link || '',
    snippet: item.snippet || '',
    displayedLink: item.displayed_link || '',
    richData: {
      sitelinks: item.sitelinks || null,
      aboutThisResult: item.about_this_result || null
    }
  })),
  relatedQuestions: (payload.related_questions || [])
    .map((item) => item.question || item.title || '')
    .filter(Boolean)
});

const normalizeValueSerpPayload = (payload = {}) => ({
  results: (payload.organic_results || []).map((item, index) => ({
    position: Number(item.position || index + 1),
    title: item.title || '',
    url: item.link || item.url || '',
    snippet: item.snippet || '',
    displayedLink: item.displayed_link || '',
    richData: {}
  })),
  relatedQuestions: (payload.related_questions || payload.people_also_ask || [])
    .map((item) => item.question || item.title || '')
    .filter(Boolean)
});

const fetchSerpResults = async ({ keyword, topN = 10 } = {}) => {
  if (process.env.SERPAPI_API_KEY) {
    const response = await axios.get('https://serpapi.com/search.json', {
      timeout: 20000,
      params: {
        engine: 'google',
        q: keyword,
        google_domain: 'google.com.br',
        gl: 'br',
        hl: 'pt-br',
        num: topN,
        api_key: process.env.SERPAPI_API_KEY
      }
    });
    return normalizeSerpApiPayload(response.data || {});
  }

  if (process.env.VALUESERP_API_KEY) {
    const response = await axios.get('https://api.valueserp.com/search', {
      timeout: 20000,
      params: {
        q: keyword,
        location: 'Brazil',
        google_domain: 'google.com.br',
        gl: 'br',
        hl: 'pt',
        num: topN,
        api_key: process.env.VALUESERP_API_KEY
      }
    });
    return normalizeValueSerpPayload(response.data || {});
  }

  return { results: [], relatedQuestions: [] };
};

const buildDryRunResults = (keyword = '') => ({
  results: [
    {
      position: 1,
      title: `${keyword}: guia completo para comparar custos e riscos`,
      url: 'https://example.com/guia',
      snippet: `Veja como analisar ${keyword}, comparar CET, prazo, parcela e alternativas antes de contratar.`
    },
    {
      position: 2,
      title: `Como funciona ${keyword} e quais cuidados tomar`,
      url: 'https://example.org/cuidados',
      snippet: 'Entenda requisitos, score, riscos de atraso, exemplos de parcela e perguntas frequentes.'
    },
    {
      position: 3,
      title: `Melhores opcoes de ${keyword}: compare antes de decidir`,
      url: 'https://example.net/comparativo',
      snippet: 'Comparativo com pontos positivos, riscos, documentos, taxas e alternativas.'
    }
  ],
  relatedQuestions: [
    `${keyword} vale a pena?`,
    `Como saber o CET de ${keyword}?`,
    `Quais riscos existem em ${keyword}?`
  ]
});

export const buildSerpIntelligenceFromResults = ({ keyword = '', serp = {} } = {}) => {
  const results = (serp.results || []).slice(0, 10);
  const relatedQuestions = serp.relatedQuestions || [];
  const searchIntent = classifyIntent({ keyword, results });
  const entities = inferEntities({ keyword, results });
  const mustCoverTopics = inferMustCoverTopics({ keyword, results, searchIntent });

  return {
    keyword,
    searchIntent,
    readerProblem: inferReaderProblem({ keyword, searchIntent }),
    topCompetitorPatterns: buildTopPatterns({ results }),
    mustCoverTopics,
    contentGaps: inferContentGaps({ keyword, results }),
    entities,
    faqQuestions: extractQuestionCandidates({ keyword, results, relatedQuestions }),
    officialSourcesToCite: inferOfficialSources({ keyword, entities }),
    recommendedStructure: buildRecommendedStructure({ keyword, searchIntent, mustCoverTopics }),
    uniqueAngle: `Transformar ${keyword} em uma decisao pratica: explicar custo total, riscos, exemplo numerico e checklist sem promessa de aprovacao.`,
    requiredExamples: [
      'Simulacao com valor em R$, prazo, parcela, custo total e percentual aproximado.',
      'Cenario negativo: atraso, queda de renda ou taxa maior que o esperado.'
    ],
    requiredTables: [
      'Tabela simples: criterio | como avaliar | sinal de alerta.',
      'Comparacao: alternativa | quando faz sentido | principal risco.'
    ],
    avoid: [
      'Copiar frases, estrutura ou conclusoes dos concorrentes.',
      'Prometer aprovacao, taxa baixa garantida ou resultado financeiro.',
      'Usar paragrafos vagos sem numero, fonte, exemplo ou decisao pratica.',
      'Repetir palavras como clareza, jornada, contexto e organizacao sem substancia.'
    ],
    rawSerpSummary: results.map((item) => ({
      position: item.position,
      title: item.title,
      domain: domainFromUrl(item.url),
      snippet: item.snippet
    }))
  };
};

export class SerpIntelligenceService {
  static async analyzeKeyword({ keyword, topN = 10, dryRun = false } = {}) {
    const cleanKeyword = compact(keyword);
    if (!cleanKeyword) throw new Error('keyword is required for SERP intelligence');
    const serp = dryRun ? buildDryRunResults(cleanKeyword) : await fetchSerpResults({ keyword: cleanKeyword, topN });

    return {
      ok: true,
      dryRun,
      provider: dryRun
        ? 'dry-run-sample'
        : process.env.SERPAPI_API_KEY
          ? 'serpapi'
          : process.env.VALUESERP_API_KEY
            ? 'valueserp'
            : 'disabled',
      generatedAt: new Date().toISOString(),
      ...buildSerpIntelligenceFromResults({ keyword: cleanKeyword, serp })
    };
  }
}
