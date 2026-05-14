import { repairPortugueseText } from './portugueseTextService.js';

const NEWS_TYPES = new Set(['news_analysis', 'market_update', 'regulatory_update']);

const compact = (value = '') => String(value || '').replace(/\s+/g, ' ').trim();

const normalize = (value = '') =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

const toSlug = (value = '') =>
  normalize(value)
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

const unique = (items = []) => Array.from(new Set(items.map(compact).filter(Boolean)));

const formatDate = (value = '') => {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
};

const sourceLabel = (source = {}) =>
  compact(source.title || source.label || source.domain || source.url || '');

const displaySourceName = (value = '') => {
  const normalized = normalize(value);
  if (/bcb|banco central/.test(normalized)) return 'Banco Central';
  if (/agenciabrasil|agencia brasil|ebc/.test(normalized)) return 'Agencia Brasil';
  if (/ibge/.test(normalized)) return 'IBGE';
  if (/caixa/.test(normalized)) return 'Caixa';
  if (/receita|fazenda/.test(normalized)) return 'Receita Federal e Fazenda';
  if (/consumidor/.test(normalized)) return 'consumidor.gov.br';
  if (/gov/.test(normalized)) return 'Gov.br';
  return compact(value);
};

const officialUrl = (news = {}) => {
  const source = (news.sources || []).find((item) => /bcb|gov|ibge|caixa|receita|fazenda|consumidor/i.test(`${item.domain || ''} ${item.url || ''}`));
  if (source?.url) return source.url;
  if (/bcb/i.test(news.newsSource || '')) return 'https://www.bcb.gov.br/';
  if (/ibge/i.test(news.newsSource || '')) return 'https://www.ibge.gov.br/';
  if (/caixa/i.test(news.newsSource || '')) return 'https://www.caixa.gov.br/';
  if (/consumidor/i.test(news.newsSource || '')) return 'https://www.consumidor.gov.br/';
  return 'https://www.gov.br/';
};

const classifyNewsType = ({ type = '', intent = '', category = '' } = {}) => {
  const haystack = normalize(`${type} ${intent} ${category}`);
  if (/regulatory|regra|regulacao|banco central|receita|fgts|inss/.test(haystack)) return 'regulatory_update';
  if (/market|selic|copom|ipca|dolar|mercado/.test(haystack)) return 'market_update';
  if (/news/.test(haystack)) return 'news_analysis';
  return '';
};

export class FinancialNewsArticleComposerService {
  static isFinancialNewsContext({ type = '', intent = '', category = '', newsContext = null } = {}) {
    return NEWS_TYPES.has(type) || NEWS_TYPES.has(newsContext?.type) || Boolean(classifyNewsType({ type, intent, category }));
  }

  static validatePreflight(newsContext = {}) {
    const news = newsContext.news || newsContext;
    const type = newsContext.type || news.type || '';
    if (!NEWS_TYPES.has(type)) return { ok: true, blockers: [], news };

    const sources = Array.isArray(news.sources) ? news.sources : [];
    const hasRealSource = Boolean(news.newsSource || sources.some((item) => item.domain || item.url || item.title));
    const hasDate = Boolean(news.publishedAt);
    const hasFact = Boolean(compact(newsContext.keyword || newsContext.topic || news.fact || newsContext.angle).length > 20);
    const hasWalletImpact = Number(news.impactOnWalletScore || newsContext.impactOnWalletScore || 0) >= 58
      || /bolso|orcamento|renda|juros|pix|fgts|inss|ipca|selic|dolar|contribuinte|consumidor/i.test(`${newsContext.keyword || ''} ${newsContext.angle || ''}`);
    const hasDistinctAngle = !newsContext.nearestCompetingArticle
      || normalize(newsContext.nearestCompetingArticle?.slug || '') !== normalize(toSlug(newsContext.keyword || ''));

    const blockers = [
      !hasRealSource ? 'news_preflight_without_real_source' : null,
      !hasDate ? 'news_preflight_without_published_at' : null,
      !hasFact ? 'news_preflight_without_new_fact' : null,
      !hasWalletImpact ? 'news_preflight_without_wallet_impact' : null,
      !hasDistinctAngle ? 'news_preflight_angle_matches_existing_article' : null,
    ].filter(Boolean);

    return {
      ok: blockers.length === 0,
      blockers,
      news,
    };
  }

  static buildPreflightBlockedResult({ topic, keyword, category, newsContext, blockers }) {
    const cleanKeyword = repairPortugueseText(compact(keyword || topic));
    const slug = toSlug(cleanKeyword || 'news-preflight-blocked');
    const article = {
      title: cleanKeyword || 'News bloqueada no preflight',
      h1: cleanKeyword || 'News bloqueada no preflight',
      slug,
      summary: 'Pauta de atualidade bloqueada antes da geracao por falta de lastro factual suficiente.',
      category,
      tags: unique([cleanKeyword, category, newsContext?.type, 'news preflight']).slice(0, 8),
      intro: ['Pauta bloqueada antes da geracao para evitar noticia sem lastro factual suficiente.'],
      sections: [],
      faq: [],
      conclusion: [],
      newsContext,
    };

    return {
      title: article.title,
      slug,
      excerpt: article.summary,
      metaTitle: article.title,
      metaDescription: article.summary,
      keywords: article.tags,
      content: article.summary,
      structuredContent: article,
      faq: [],
      internalLinks: [],
      externalLinks: [],
      cta: null,
      schema: { '@type': 'BlogPosting', headline: article.title, description: article.summary, keywords: article.tags },
      preflightBlocked: true,
      preflightBlockers: blockers,
    };
  }

  static buildArticle({ topic, keyword, intent = 'guide', category = 'Educacao financeira', serpIntelligence = null, newsContext = {} } = {}) {
    const type = newsContext.type || classifyNewsType({ type: newsContext.type, intent, category }) || 'news_analysis';
    if (!NEWS_TYPES.has(type)) return null;

    const preflight = this.validatePreflight(newsContext);
    if (!preflight.ok) return null;

    const cleanKeyword = repairPortugueseText(compact(keyword || topic));
    const cleanTopic = repairPortugueseText(compact(topic || cleanKeyword));
    const news = preflight.news || {};
    const dateLabel = formatDate(news.publishedAt);
    const mainSource = displaySourceName(news.newsSource || sourceLabel(news.sources?.[0]) || 'fonte oficial');
    const secondSource = news.secondSourceConfirmed ? displaySourceName(sourceLabel(news.sources?.[1]) || 'segunda fonte confiavel') : '';
    const nearest = newsContext.nearestCompetingArticle;
    const titleByType = {
      regulatory_update: 'Regra financeira nova: impacto no bolso',
      market_update: 'Dado financeiro novo: efeito no orçamento',
      news_analysis: 'Atualidade financeira: impacto no bolso',
    };
    const title = type === 'regulatory_update' && /pix/i.test(cleanKeyword)
      ? 'Segurança do Pix: regra do BC e impacto no bolso'
      : titleByType[type];
    const slug = toSlug(`${title}-${dateLabel || cleanKeyword}`);
    const factualLine = `Em ${dateLabel || 'data informada pela fonte'}, ${mainSource} e ${secondSource || 'a fonte principal'} sustentam a pauta "${cleanKeyword}".`;
    const differenceLine = nearest?.slug
      ? `Diferenca editorial: esta materia cobre o fato datado e a acao imediata; nao repete o guia "${nearest.slug}".`
      : 'Diferenca editorial: a pauta fica presa ao fato datado, aos efeitos praticos e aos limites do que a fonte confirma.';
    const beforeAfterRows = type === 'regulatory_update'
      ? [
          ['Antes', 'Leitor dependia de regra anterior, aviso do banco ou boato em rede social.', 'Maior risco de agir por pressa ou aceitar orientacao falsa.'],
          ['Depois', `A verificacao parte de ${mainSource} e da data ${dateLabel}.`, 'A decisao passa por fonte oficial, registro e canal do banco.'],
          ['Ponto aberto', 'Detalhes operacionais podem depender de cada instituicao.', 'O consumidor deve guardar comprovantes e confirmar no app oficial.'],
        ]
      : [
          ['Dado', `Fonte: ${mainSource}, data ${dateLabel}.`, 'Usar o dado como alerta, nao como previsao garantida.'],
          ['Bolso', 'Juros, inflacao, cambio ou beneficio mudam renda disponivel.', 'Revisar dividas, compras e compromissos do mes.'],
          ['Limite', 'Mercado muda rapido e nem todo efeito chega no mesmo dia.', 'Evitar contratar no impulso so porque a noticia saiu.'],
        ];

    const sections = [
      {
        heading: 'Fato novo e fonte verificada',
        subheading: `${mainSource} aparece como base factual da noticia de ${dateLabel}.`,
        paragraphs: [
          `${factualLine} A leitura da Cote Juros e direta: o fato so vira artigo quando ajuda o leitor a reduzir risco, custo ou exposicao a golpe.`,
          `O ponto novo nao e vender urgencia. E separar o que a fonte confirma, quem pode ser afetado e qual providencia cabe hoje, antes de mexer em dinheiro.`,
        ],
        bullets: [`Data do fato: ${dateLabel}.`, `Fonte principal: ${mainSource}.`, secondSource ? `Segunda fonte: ${secondSource}.` : 'Sem segunda fonte editorial suficiente, a pauta deve ser tratada com cautela.'],
        table: {
          caption: 'Lastro factual usado pela redacao.',
          columns: ['Item', 'Evidencia', 'Como entra na decisao'],
          rows: [
            ['Fonte', mainSource, 'Define o que pode ser tratado como fato.'],
            ['Data', dateLabel || 'nao informada', 'Evita publicar noticia velha como se fosse nova.'],
            ['Impacto', `${news.impactOnWalletScore || newsContext.impactOnWalletScore || 0}/100`, 'Filtra pauta sem efeito pratico no bolso.'],
          ],
        },
      },
      {
        heading: type === 'regulatory_update' ? 'O que muda na pratica' : 'O dado economico por tras da noticia',
        subheading: type === 'market_update' ? 'O leitor precisa transformar o dado em decisao domestica, nao em aposta.' : 'A mudanca deve ser lida pelo efeito em prazo, canal e prova.',
        paragraphs: [
          type === 'regulatory_update'
            ? `Em atualizacao regulatoria, o leitor deve comparar o procedimento antigo com a orientacao nova. Se a regra envolve Pix, banco, Receita, FGTS ou INSS, o canal oficial pesa mais que mensagem recebida por telefone.`
            : `Em atualidade de mercado, o dado importa quando mexe com credito, dividas, consumo, renda fixa ou orcamento. A materia nao deve prever Selic, dolar ou IPCA; deve mostrar como se proteger da incerteza.`,
          `Na pratica, uma familia com R$ 800 de folga mensal nao deve assumir novo compromisso de R$ 250 sem testar um mes ruim. A noticia serve para revisar a decisao, nao para correr.`,
        ],
        bullets: ['Confirmar a fonte antes de agir.', 'Separar fato confirmado de interpretacao.', 'Revisar pagamentos dos proximos 30 dias.'],
        table: {
          caption: type === 'regulatory_update' ? 'Antes e depois para o consumidor.' : 'Do dado ao bolso.',
          columns: ['Leitura', 'O que a fonte sustenta', 'Impacto no bolso'],
          rows: beforeAfterRows,
        },
      },
      {
        heading: 'Quem pode ser afetado agora',
        subheading: 'A utilidade da noticia aparece quando o publico afetado fica claro.',
        paragraphs: [
          `A pauta afeta principalmente quem usa Pix, servicos bancarios digitais, canais oficiais de governo ou produtos financeiros ligados ao tema. O risco maior esta em agir com base em print, audio ou promessa de atendimento rapido.`,
          `Se houver divida, fatura aberta, beneficio do INSS, saque de FGTS ou compra em moeda estrangeira, a noticia deve entrar no planejamento do mes antes de qualquer nova contratacao.`,
        ],
        bullets: ['Consumidor com conta bancaria ativa.', 'Pessoa com pagamento ou transferencia pendente.', 'Familia com renda apertada e pouca margem para erro.'],
      },
      {
        heading: 'Exemplo pratico com dinheiro na mesa',
        subheading: 'O exemplo e hipotetico e serve para medir risco, nao para prometer resultado.',
        paragraphs: [
          `Imagine uma pessoa que precisa pagar R$ 1.200 hoje e recebe orientacao por mensagem para fazer um Pix fora do app oficial. Se o procedimento mudou ou existe alerta de seguranca, a economia de 5 minutos pode virar perda integral do valor.`,
          `Outro caso: se uma noticia de juros ou inflacao eleva o custo esperado de uma compra, adiar uma parcela de R$ 300 por 30 dias pode ser melhor do que assumir multa, rotativo ou novo emprestimo.`,
        ],
        bullets: ['Valor em risco no exemplo: R$ 1.200.', 'Prazo de revisao: 30 dias.', 'Gatilho de pausa: fonte nao confirmada ou canal fora do app oficial.'],
      },
      {
        heading: 'O que fazer agora sem inventar certeza',
        subheading: 'A acao correta e pequena, verificavel e documentada.',
        paragraphs: [
          `Primeiro, abra a fonte oficial ou o aplicativo da instituicao. Depois, registre protocolo, data, horario e print. Se houver cobranca, desconto ou transferencia suspeita, nao resolva por link recebido em conversa.`,
          `A Cote Juros recomenda tratar a noticia como sinal de revisao: conferir regra, prazo, custo e risco antes de contratar credito, antecipar FGTS, mexer em beneficio ou transferir dinheiro.`,
        ],
        bullets: ['Conferir fonte oficial.', 'Guardar comprovante e protocolo.', 'Evitar link recebido por mensagem.', 'Comparar impacto no orcamento antes de aceitar oferta.'],
      },
      {
        heading: 'O que ainda nao da para afirmar',
        subheading: 'Boa noticia financeira tambem mostra o limite da informacao.',
        paragraphs: [
          `Esta materia nao afirma que todo banco aplicara o mesmo procedimento no mesmo minuto. Tambem nao transforma um comunicado em promessa de estorno, aprovacao, reducao de juros ou ganho financeiro.`,
          `Se a fonte oficial nao trouxer numero, prazo ou regra operacional suficiente, o texto deve parar no que esta confirmado. O restante precisa aparecer como ponto a acompanhar.`,
        ],
        bullets: ['Sem promessa de estorno.', 'Sem previsao de taxa futura.', 'Sem orientacao fora dos canais oficiais.'],
      },
      {
        heading: 'Fontes oficiais e trilha de verificacao',
        subheading: 'A materia deve conseguir ser auditada depois da publicacao.',
        paragraphs: [
          `${mainSource} e a referencia principal desta pauta. ${secondSource ? `${secondSource} aparece como confirmacao secundaria.` : 'Quando nao ha segunda fonte, o texto precisa deixar essa limitacao visivel.'}`,
          `${differenceLine} Esse recorte reduz canibalizacao porque o artigo nao tenta ensinar tudo sobre Pix, juros ou imposto; ele cobre a mudanca datada e a decisao imediata.`,
        ],
        bullets: ['Fonte oficial citada no corpo.', 'Data do fato preservada.', 'Angulo separado de guias evergreen ja publicados.'],
      },
    ];

    return {
      title,
      h1: title,
      slug,
      excerpt: `${cleanKeyword}: veja fonte, data, impacto no bolso e proximos passos sem tratar rumor como fato.`,
      summary: `${cleanKeyword}: fonte ${mainSource}, data ${dateLabel}, impacto no bolso e limites do que ainda nao da para afirmar.`,
      metaTitle: title,
      metaDescription: `${cleanKeyword}: entenda o fato novo, a fonte, a data, o impacto no bolso e o que fazer agora sem cair em rumor.`,
      category,
      tags: unique([cleanKeyword, type, mainSource, 'atualidade financeira', 'impacto no bolso', 'fonte oficial']).slice(0, 8),
      editorialIntent: 'news',
      intentComposerProfile: {
        type: 'financial_news',
        preserveIntentSpecific: true,
        contentType: type,
      },
      editorialPipeline: false,
      featuredSnippet: `${cleanKeyword} deve ser lido como fato datado: fonte ${mainSource}, data ${dateLabel}, impacto no bolso e acao pratica antes de movimentar dinheiro.`,
      intro: [
        `${cleanKeyword} entrou no radar da Cote Juros porque combina fato recente, fonte identificada e efeito possivel no bolso. A data de referencia e ${dateLabel}, e a fonte principal e ${mainSource}.`,
        `A pergunta central nao e se a noticia parece grande. E o que muda para quem paga conta, usa Pix, depende de beneficio, tem divida ou precisa evitar golpe ainda esta semana.`,
      ],
      sections,
      example: `Exemplo: antes de transferir R$ 1.200 ou aceitar uma parcela de R$ 300 por mes, confira a fonte ${mainSource}, registre protocolo e teste o impacto no orcamento dos proximos 30 dias.`,
      alert: `Atencao: se a orientacao vier por link, telefone ou mensagem sem fonte oficial, pare antes de agir. Em noticia financeira, pressa pode virar perda, juros ou contestacao dificil.`,
      midQuestions: [
        {
          question: 'O que esta confirmado pela fonte?',
          answer: `${mainSource} aparece como base da pauta em ${dateLabel}. O texto separa essa informacao de previsoes ou promessas.`,
        },
        {
          question: 'Qual e o risco de agir no impulso?',
          answer: 'O risco e movimentar dinheiro, aceitar parcela ou enviar dados antes de conferir regra, canal e comprovante.',
        },
      ],
      ctas: [
        {
          position: 'after_intro',
          title: 'Confira antes de agir',
          description: 'Use a noticia para revisar fonte, prazo e impacto no orcamento antes de movimentar dinheiro.',
          to: '/diagnostico-financeiro',
          label: 'Revisar meu risco',
        },
        {
          position: 'mid_article',
          title: 'Compare o custo real',
          description: 'Se a noticia mexe com credito ou parcela, compare alternativas antes de assumir compromisso.',
          to: '/ferramentas',
          label: 'Ver ferramentas',
        },
        {
          position: 'before_conclusion',
          title: 'Continue acompanhando',
          description: 'Leia outras analises de bolso com fonte, data e cautela editorial.',
          to: '/blog',
          label: 'Ver mais analises',
        },
      ],
      financialImpact: [
        `Impacto imediato: revisar transferencias, parcelas ou beneficios ligados ao tema antes de agir.`,
        `Valor de exemplo: R$ 1.200 em uma transferencia ou R$ 300 por mes em parcela ja mudam o caixa familiar.`,
        `Prazo de cautela: 30 dias para observar regra, comunicacao do banco e efeito no orcamento.`,
        `Risco principal: transformar uma noticia em decisao cara sem confirmar fonte oficial.`,
      ],
      alternatives: [
        'Conferir o comunicado no site oficial antes de usar link recebido por mensagem.',
        'Adiar contratacao ou transferencia quando a fonte, o prazo ou o custo estiverem incompletos.',
        'Registrar protocolo e usar consumidor.gov.br quando houver cobranca, falha ou contestacao sem resposta.',
      ],
      expertInsights: [
        'Canal oficial pesa mais que print de conversa.',
        'Fato datado nao deve virar promessa financeira.',
        'A noticia so importa quando muda risco, custo ou prazo para o leitor.',
      ],
      faq: [
        {
          question: 'Essa noticia muda alguma coisa agora?',
          answer: 'Muda se voce usa o servico citado, tem pagamento pendente ou depende da regra para evitar custo, golpe ou contestacao.',
        },
        {
          question: 'Posso confiar em mensagem recebida pelo banco?',
          answer: 'Confie primeiro no app oficial, no site da instituicao e em canais reconhecidos. Link recebido em conversa merece verificacao extra.',
        },
        {
          question: 'A Cote Juros esta prevendo juros, dolar ou inflacao?',
          answer: 'Nao. A analise mostra impacto possivel no bolso e limites do que a fonte confirma, sem previsao especulativa.',
        },
        {
          question: 'Quando a pauta deve ser bloqueada?',
          answer: 'Quando falta fonte real, data real, fato novo, impacto no bolso ou angulo diferente de artigo ja publicado.',
        },
      ],
      conclusion: [
        `${cleanKeyword} so merece publicacao quando permanece preso a fonte, data, impacto no bolso e limite factual. Esse e o filtro que evita transformar atualidade em evergreen reciclado.`,
        'Antes de movimentar dinheiro, confirme a fonte oficial, guarde prova e compare o efeito no seu orcamento.',
      ],
      internalLinks: [
        { path: '/blog', title: 'Blog Cote Juros', anchor: 'analises financeiras recentes' },
        { path: '/ferramentas', title: 'Ferramentas financeiras', anchor: 'ferramentas para simular impacto no bolso' },
        { path: '/diagnostico-financeiro', title: 'Diagnostico financeiro', anchor: 'diagnostico do risco financeiro' },
      ],
      externalLinks: unique([
        `${mainSource}|${officialUrl(news)}`,
        secondSource ? `${secondSource}|${news.sources?.[1]?.url || 'https://agenciabrasil.ebc.com.br/'}` : '',
        'consumidor.gov.br|https://www.consumidor.gov.br/',
      ]).map((item) => {
        const [label, url] = item.split('|');
        return { label, url };
      }),
      serpIntelligence,
      newsContext: {
        ...news,
        type,
        keyword: cleanKeyword,
        topic: cleanTopic,
        angleDifference: differenceLine,
      },
      cta: {
        eyebrow: 'Atualidade financeira',
        title: 'Transforme noticia em decisao segura',
        description: 'Confira fonte, data e impacto no bolso antes de contratar, transferir ou enviar dados.',
        primary: { to: '/diagnostico-financeiro', label: 'Revisar risco' },
        secondary: { to: '/blog', label: 'Ler mais analises' },
      },
    };
  }
}

export const buildFinancialNewsArticle = (input = {}) => FinancialNewsArticleComposerService.buildArticle(input);
export const validateFinancialNewsPreflight = (newsContext = {}) => FinancialNewsArticleComposerService.validatePreflight(newsContext);

export default FinancialNewsArticleComposerService;
