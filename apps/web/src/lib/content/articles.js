import { normalizeMojibake } from '@/lib/textEncoding.js';
import { resolveArticleImageAlt, resolveArticleImageSources } from '@/lib/content/blogImages.js';

const FALLBACK_AUTHOR = 'Equipe Cote Juros';
const FALLBACK_CATEGORY = 'Finanças pessoais';

const isObjectRecord = (value) => Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const normalizeText = (value = '') =>
  String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

const sanitizeInlineText = (value = '') => normalizeMojibake(String(value || '')).replace(/\s+/g, ' ').trim();
const sanitizeRichText = (value = '') => normalizeMojibake(String(value || '')).trim();

const ROUTE_REWRITES = {
  '/blog/calculo-rescisao-trabalhista': '/calculo-de-rescisao-trabalhista',
  '/blog/aviso-previo-na-demissao': '/pedido-de-demissao',
  '/qual-e-o-melhor-investimento-para-quem-tem-pouco-dinheiro': '/qual-e-o-melhor-investimento',
  '/entendendo-os-juros-abusivos-como-identifica-los-e-proteger-suas-financas-pessoais': '/entendendo-os-juros-abusivos',
  '/como-economizar-dinheiro-e-fazer-seu-salario-render-mais': '/como-economizar-dinheiro',
  '/10-formas-de-ganhar-dinheiro-sem-investir': '/como-ganhar-dinheiro-online-sem-investir',
  '/como-a-educacao-financeira-pode-prevenir-dividas': '/como-a-educacao-financeira-pode-prevenir-dividas-e-promover-o-planejamento-financeiro-pessoal',
  '/category/blog/entenda-os-juros-abusivos': '/juros-abusivos',
  '/category/tudo-sobre-credito': '/blog'
};

const resolveCategoryName = (value, fallback = FALLBACK_CATEGORY) => {
  if (isObjectRecord(value)) {
    return sanitizeInlineText(value.name || value.label || value.title || fallback) || fallback;
  }

  return sanitizeInlineText(value || fallback) || fallback;
};

const normalizeRoutePath = (value = '') => {
  const raw = sanitizeInlineText(value);
  if (!raw) return '';

  const normalized = raw.startsWith('http')
    ? (() => {
        try {
          return new URL(raw).pathname;
        } catch {
          return raw;
        }
      })()
    : raw;

  const path = `/${String(normalized).replace(/^\/+|\/+$/g, '')}`;
  return ROUTE_REWRITES[path] || path;
};

const ROUTE_LABELS = {
  '/educacao-financeira': 'Educação Financeira',
  '/diagnostico-financeiro': 'Diagnóstico Financeiro',
  '/cote-finance-ai': 'Cote Finance AI',
  '/emprestimos': 'Empréstimos',
  '/cartoes': 'Cartões',
  '/financiamentos': 'Financiamentos',
  '/ferramentas': 'Ferramentas',
  '/blog': 'Blog Cote Juros'
};

const slugify = (value = '') =>
  normalizeText(value)
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

const sanitizeStringArray = (value) => {
  if (Array.isArray(value)) {
    return value
      .map((item) => sanitizeInlineText(item))
      .filter(Boolean);
  }

  if (typeof value === 'string') {
    return value
      .split(/\n+/)
      .map((item) => sanitizeInlineText(item))
      .filter(Boolean);
  }

  return [];
};

const startCase = (value = '') =>
  sanitizeInlineText(value)
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

const prettifySlugLabel = (value = '') => {
  const normalized = String(value || '').replace(/^\/+|\/+$/g, '');
  if (!normalized) return '';

  const mapped = ROUTE_LABELS[`/${normalized}`];
  if (mapped) return mapped;

  const plain = normalized
    .split('/')
    .pop()
    ?.replace(/-/g, ' ') || '';

  const title = startCase(plain);
  return normalizeMojibake(title);
};

const isSlugLikeLabel = (value = '') => /^[a-z0-9/-]+$/i.test(String(value || '').trim()) || !/[A-ZÀ-Ý]/.test(String(value || '').trim());
const startsWithExplore = (value = '') => /^explor(ar|e)\b/i.test(sanitizeInlineText(value));

const sanitizeDate = (value, fallback = new Date().toISOString()) => {
  const date = new Date(value || fallback);
  return Number.isNaN(date.getTime()) ? fallback : date.toISOString();
};

const buildDefaultSummary = (title, category) =>
  `Entenda ${title.toLowerCase()} com uma leitura clara, prática e focada em ${category.toLowerCase()}.`;

const buildFallbackIntro = (title, category) => [
  `${title} é um tema que costuma aparecer quando a pessoa quer decidir com mais clareza, reduzir ruído e ganhar controle sobre o próprio dinheiro.`,
  `Neste guia da Cote Juros, você vai ver os pontos que mais importam em ${category.toLowerCase()}, erros comuns e próximos passos para agir com segurança.`
];

const buildFallbackSections = (title, category, tags = []) => {
  const theme = tags[0] || category.toLowerCase();

  return [
    {
      heading: `O que ${title.toLowerCase()} significa na prática`,
      paragraphs: [
        `Na prática, ${title.toLowerCase()} não é só teoria. O ponto principal é entender como esse tema afeta seu orçamento, sua margem mensal e suas escolhas de crédito.`,
        `Quando você organiza a leitura por contexto, custo e impacto real no dia a dia, fica mais fácil filtrar promessas exageradas e tomar decisões mais consistentes.`
      ],
      bullets: []
    },
    {
      heading: 'Como analisar com mais clareza',
      paragraphs: [
        `Antes de seguir, vale colocar este assunto ao lado da sua realidade financeira atual: renda, despesas fixas, uso de crédito e prioridades dos próximos meses.`,
        `Esse tipo de leitura evita decisões tomadas no impulso e ajuda a entender se ${theme} está alinhado com o momento que você vive hoje.`
      ],
      bullets: [
        'defina o objetivo financeiro por trás da decisão',
        'compare custo, prazo e impacto no orçamento',
        'evite avançar sem entender o cenário completo'
      ]
    },
    {
      heading: 'Próximos passos para colocar em prática',
      paragraphs: [
        `O caminho mais seguro costuma ser simples: entender seu ponto de partida, priorizar poucas ações e revisar o resultado mês a mês.`,
        `Se ainda houver dúvida, use simuladores, conteúdos relacionados e um diagnóstico financeiro antes de contratar qualquer produto.`
      ],
      bullets: [
        'registre o cenário atual',
        'acompanhe evolução de forma simples',
        'ajuste a estratégia com base em números reais'
      ]
    }
  ];
};

const normalizeSectionHeading = (heading, title) => {
  const clean = sanitizeInlineText(heading);
  if (!clean) return '';

  const replacements = new Map([
    ['o que comparar antes de seguir', 'O que observar antes de tomar uma decisão'],
    ['como analisar com mais segurança', 'Como analisar com mais segurança e menos ruído'],
    ['erros que costumam sair caro', 'Erros que mais atrapalham no dia a dia']
  ]);

  return replacements.get(clean.toLowerCase()) || clean || `Pontos importantes sobre ${title}`;
};

const normalizeSections = (sections, title) => {
  if (!Array.isArray(sections)) return [];

  return sections
    .map((section) => ({
      heading: normalizeSectionHeading(section?.heading || section?.title || '', title),
      paragraphs: sanitizeStringArray(section?.paragraphs),
      bullets: sanitizeStringArray(section?.bullets)
    }))
    .filter((section) => section.heading || section.paragraphs.length || section.bullets.length);
};

const normalizeFaq = (faq) => {
  if (!Array.isArray(faq)) return [];

  return faq
    .map((item) => ({
      question: sanitizeInlineText(item?.question || item?.name || ''),
      answer: sanitizeInlineText(item?.answer || item?.text || '')
    }))
    .filter((item) => item.question && item.answer);
};

const normalizeInternalLinks = (links) => {
  if (!Array.isArray(links)) return [];

  return links
    .map((item) => {
      const path = normalizeRoutePath(item?.path || item?.href || '');
      if (!path) return null;

      const routeLabel = prettifySlugLabel(path);
      const rawTitle = sanitizeInlineText(item?.title || item?.label || item?.anchor || '');
      const rawAnchor = sanitizeInlineText(item?.anchor || item?.title || item?.label || '');
      const isKnownRouteLink = Boolean(ROUTE_LABELS[path]);
      const titleLooksGenerated =
        !rawTitle ||
        isSlugLikeLabel(rawTitle) ||
        (routeLabel && normalizeText(rawTitle) === normalizeText(routeLabel));
      const title = isKnownRouteLink ? routeLabel : titleLooksGenerated ? routeLabel || rawTitle : rawTitle;
      const anchorLooksGenerated =
        !rawAnchor ||
        isSlugLikeLabel(rawAnchor) ||
        startsWithExplore(rawAnchor) ||
        (title && normalizeText(rawAnchor) === normalizeText(title));
      const anchorBase = isKnownRouteLink ? title : anchorLooksGenerated ? title || routeLabel || rawAnchor : rawAnchor;
      const safeAnchorBase = normalizeMojibake(anchorBase);

      return {
        path,
        title: normalizeMojibake(title),
        anchor: safeAnchorBase
          ? startsWithExplore(safeAnchorBase)
            ? safeAnchorBase.charAt(0).toUpperCase() + safeAnchorBase.slice(1)
            : `Leia também: ${safeAnchorBase.charAt(0).toLowerCase()}${safeAnchorBase.slice(1)}`
          : ''
      };
    })
    .filter((item) => item?.path && item.title);
};

const estimateReadTime = ({ intro = [], sections = [], faq = [], conclusion = [], content = '' }) => {
  const source = [
    sanitizeRichText(content),
    ...intro,
    ...conclusion,
    ...sections.flatMap((section) => [...section.paragraphs, ...section.bullets]),
    ...faq.flatMap((item) => [item.question, item.answer])
  ]
    .join(' ')
    .trim();

  const wordCount = source ? source.split(/\s+/).length : 0;
  return Math.max(4, Math.round(wordCount / 190) || 6);
};

const buildEditorialContent = ({ title, category, intro, sections, conclusion, tags, content }) => {
  const safeIntro = (intro.length ? intro : buildFallbackIntro(title, category)).map((item) => sanitizeInlineText(item)).filter(Boolean);
  const safeSections = (sections.length ? sections : buildFallbackSections(title, category, tags))
    .map((section) => ({
      heading: sanitizeInlineText(section.heading),
      paragraphs: sanitizeStringArray(section.paragraphs),
      bullets: sanitizeStringArray(section.bullets)
    }))
    .filter((section) => section.heading || section.paragraphs.length || section.bullets.length);
  const safeConclusion =
    (conclusion.length
      ? conclusion
      : [
          `O mais importante em ${title.toLowerCase()} é sair da leitura com mais clareza do que entrou: o que observar, o que evitar e qual próximo passo faz sentido agora.`,
          'Quando o conteúdo é usado como apoio à decisão, o blog passa a ser uma ferramenta prática e não apenas mais uma referência aberta no navegador.'
        ]).map((item) => sanitizeInlineText(item)).filter(Boolean);

  const fallbackContent =
    sanitizeRichText(content) ||
    [...safeIntro, ...safeSections.flatMap((section) => [section.heading, ...section.paragraphs, ...section.bullets]), ...safeConclusion].join('\n\n');

  return {
    intro: safeIntro,
    sections: safeSections,
    conclusion: safeConclusion,
    content: fallbackContent
  };
};

const countWords = (chunks = []) =>
  chunks
    .join(' ')
    .split(/\s+/)
    .filter(Boolean).length;

const resolveEditorialTopic = ({ title = '', category = '', tags = [], slug = '' }) => {
  const haystack = normalizeText([title, category, slug, ...tags].join(' '));
  if (haystack.includes('cart')) return 'cartoes';
  if (haystack.includes('score') || haystack.includes('serasa')) return 'score';
  if (haystack.includes('financi') || haystack.includes('imovel') || haystack.includes('veiculo') || haystack.includes('carro')) return 'financiamento';
  if (haystack.includes('emprest') || haystack.includes('consignado') || haystack.includes('credito')) return 'emprestimos';
  if (haystack.includes('orcamento') || haystack.includes('gasto') || haystack.includes('meta') || haystack.includes('reserva')) return 'organizacao';
  if (haystack.includes('pix') || haystack.includes('golpe') || haystack.includes('fraude')) return 'seguranca';
  return 'educacao';
};

const getTopicLexicon = (topic) => {
  if (topic === 'cartoes') {
    return {
      comparator: 'anuidade, limite inicial, regras de aumento de limite e custo do rotativo',
      scenario: 'uma pessoa que concentra gastos recorrentes, evita parcelamentos longos e acompanha a data de vencimento',
      mistakes: ['ignorar o custo do rotativo', 'olhar sÃ³ o limite e esquecer a anuidade', 'parcelar compras sem revisar o fluxo do mÃªs'],
      checklist: ['comparar anuidade, juros e benefÃ­cios no mesmo quadro', 'checar se a renda comporta a fatura integral', 'usar alertas para vencimento e fechamento'],
      alternatives: 'cartÃµes sem anuidade, dÃ©bito, Pix e renegociaÃ§Ã£o da fatura'
    };
  }

  if (topic === 'score') {
    return {
      comparator: 'histÃ³rico de pagamentos, cadastros atualizados, uso de crÃ©dito e volume de consultas recentes',
      scenario: 'alguÃ©m que atrasou contas no passado, renegociou dÃ­vidas e agora quer reconstruir credibilidade no mercado',
      mistakes: ['abrir muitos pedidos em pouco tempo', 'deixar cadastros desatualizados', 'focar sÃ³ no nÃºmero sem corrigir o comportamento financeiro'],
      checklist: ['pagar contas em dia por alguns ciclos', 'manter dados cadastrais completos', 'acompanhar relatÃ³rios e evitar pedidos impulsivos'],
      alternatives: 'linhas com garantia, consignado, reorganizaÃ§Ã£o do orÃ§amento e diagnÃ³stico financeiro'
    };
  }

  if (topic === 'financiamento') {
    return {
      comparator: 'entrada, prazo, CET, valor total pago e impacto da parcela no orÃ§amento',
      scenario: 'uma famÃ­lia que precisa financiar um bem sem comprometer a reserva nem empurrar o custo total para um patamar ruim',
      mistakes: ['aceitar prazo longo sem olhar custo total', 'subestimar seguro e tarifas', 'ignorar o valor de entrada que reduziria juros'],
      checklist: ['simular pelo menos trÃªs cenÃ¡rios de prazo', 'somar entrada, parcelas e custos acessÃ³rios', 'validar se sobra margem para imprevistos'],
      alternatives: 'compra Ã  vista futura, consÃ³rcio, bem usado ou reforÃ§o de entrada'
    };
  }

  if (topic === 'organizacao') {
    return {
      comparator: 'receita, despesas fixas, despesas variÃ¡veis, metas e previsibilidade do caixa',
      scenario: 'alguÃ©m que quer sair do piloto automÃ¡tico e transformar informaÃ§Ã£o financeira em rotina simples de acompanhamento',
      mistakes: ['anotar por poucos dias e desistir', 'misturar gastos essenciais com impulsivos', 'nÃ£o revisar o plano no fim do mÃªs'],
      checklist: ['separar despesas por prioridade', 'definir uma meta financeira por vez', 'criar uma revisÃ£o semanal curta e objetiva'],
      alternatives: 'planilhas simples, apps de controle, automaÃ§Ã£o de contas e metas de curto prazo'
    };
  }

  if (topic === 'seguranca') {
    return {
      comparator: 'origem da oferta, urgÃªncia artificial, pedido de dados sensÃ­veis e evidÃªncias de confiabilidade',
      scenario: 'uma pessoa que recebe contato por mensagem ou redes sociais e precisa decidir rÃ¡pido sem cair em fraude',
      mistakes: ['clicar em link sem verificar domÃ­nio', 'pagar taxa antecipada', 'compartilhar senha ou cÃ³digo de confirmaÃ§Ã£o'],
      checklist: ['validar site e canal oficial', 'desconfiar de pressÃ£o por pagamento imediato', 'confirmar informaÃ§Ãµes em fontes independentes'],
      alternatives: 'contato pelo canal oficial, comparaÃ§Ã£o em portais confiÃ¡veis e consulta a reputaÃ§Ã£o da empresa'
    };
  }

  return {
    comparator: 'taxa, CET, prazo, risco e aderÃªncia ao seu momento financeiro',
    scenario: 'uma pessoa que precisa tomar decisÃ£o sem pressa, comparando custo, utilidade e impacto no orÃ§amento',
    mistakes: ['decidir sÃ³ pela urgÃªncia', 'comparar pouco antes de contratar', 'ignorar o custo total da escolha'],
    checklist: ['colocar custo, prazo e objetivo lado a lado', 'validar se a parcela cabe com folga', 'usar comparaÃ§Ãµes e conteÃºdos de apoio antes de fechar'],
    alternatives: 'diagnÃ³stico financeiro, comparaÃ§Ão entre ofertas e ajuste do plano de gastos'
  };
};

const buildSupplementalSections = ({ title, category, tags = [], slug = '' }) => {
  const topic = resolveEditorialTopic({ title, category, tags, slug });
  const lexicon = getTopicLexicon(topic);

  return [
    {
      heading: 'Como avaliar este tema com mais clareza no dia a dia',
      paragraphs: [
        `Um bom ponto de partida Ã© transformar ${title.toLowerCase()} em perguntas objetivas. Em vez de buscar apenas uma resposta rÃ¡pida, vale comparar ${lexicon.comparator}. Esse recorte reduz ruÃ­do e deixa a decisÃ£o mais aderente ao que realmente importa para o seu bolso.`,
        `Na prÃ¡tica, isso significa sair da leitura abstrata e levar o tema para nÃºmeros concretos: quanto custa, quanto tempo dura, qual risco existe e o que muda no seu caixa a partir do prÃ³ximo mÃªs. Quando essa leitura acontece antes da contrataÃ§Ã£o, o conteÃºdo vira ferramenta de decisÃ£o e nÃ£o sÃ³ mais um artigo aberto no navegador.`
      ],
      bullets: [
        `compare ${lexicon.comparator}`,
        'registre os cenÃ¡rios mais provÃ¡veis antes de decidir',
        'priorize opÃ§Ãµes com leitura simples e custo transparente'
      ]
    },
    {
      heading: 'Exemplo prÃ¡tico para sair da teoria',
      paragraphs: [
        `Imagine ${lexicon.scenario}. Nesse contexto, olhar apenas a promessa comercial quase sempre leva a uma leitura incompleta. O que muda o jogo Ã© projetar a decisÃ£o para a rotina: qual parcela ou compromisso entra no mÃªs, que margem sobra para imprevistos e o que acontece se a renda oscilar.`,
        `Quando vocÃª coloca esse tipo de cenÃ¡rio na mesa, fica mais fÃ¡cil perceber se a soluÃ§Ã£o Ã© sustentÃ¡vel. Muitas vezes a melhor decisÃ£o nÃ£o Ã© a mais rÃ¡pida, e sim a que preserva liquidez, previsibilidade e capacidade de ajuste caso o contexto mude nas prÃ³ximas semanas.`
      ],
      bullets: [
        'simule um cenÃ¡rio conservador e outro realista',
        'revise o impacto da decisÃ£o em 30, 60 e 90 dias',
        'considere custos indiretos que normalmente passam despercebidos'
      ]
    },
    {
      heading: 'Erros que mais custam caro nesse tipo de decisÃ£o',
      paragraphs: [
        `Parte dos problemas nasce menos da falta de informaÃ§Ã£o e mais da leitura apressada. Isso acontece quando a pessoa contrata ou muda de estratÃ©gia antes de entender o custo total e a utilidade real da escolha.`,
        `Outro ponto crÃ­tico Ã© confundir facilidade com adequaÃ§Ã£o. Uma aprovaÃ§Ã£o rÃ¡pida, um limite maior ou uma condiÃ§Ã£o aparentemente acessÃ­vel nÃ£o significam, por si sÃ³, que a soluÃ§Ã£o faz sentido para o seu momento financeiro.`
      ],
      bullets: lexicon.mistakes
    },
    {
      heading: 'Checklist antes de seguir',
      paragraphs: [
        `Se a ideia Ã© tomar uma decisÃ£o melhor, vale encerrar a leitura com um checklist enxuto. Esse processo simples aumenta a qualidade da escolha e diminui o risco de arrependimento, principalmente em temas financeiros que afetam vÃ¡rios meses do orÃ§amento.`
      ],
      bullets: lexicon.checklist
    },
    {
      heading: 'Alternativas e prÃ³ximos passos que valem consideraÃ§Ã£o',
      paragraphs: [
        `Nem sempre a melhor resposta estÃ¡ na primeira opÃ§Ã£o analisada. Muitas vezes, as alternativas mais saudÃ¡veis surgem quando vocÃª compara o tema central do artigo com outros caminhos possÃ­veis, como ${lexicon.alternatives}.`,
        `Esse tipo de comparaÃ§Ã£o amplia a visÃ£o estratÃ©gica e ajuda a construir uma decisÃ£o mais robusta. Quanto maior a clareza sobre objetivo, custo e risco, menor a chance de assumir um compromisso que pesa demais depois.`
      ],
      bullets: [
        'faÃ§a uma nova rodada de comparaÃ§Ã£o com foco em custo total',
        'avalie se existe uma opÃ§Ã£o mais simples para o mesmo objetivo',
        'use o diagnÃ³stico financeiro como etapa final antes de contratar'
      ]
    }
  ].map((section) => ({
    heading: sanitizeInlineText(section.heading),
    paragraphs: section.paragraphs.map((paragraph) => sanitizeInlineText(paragraph)).filter(Boolean),
    bullets: section.bullets.map((bullet) => sanitizeInlineText(bullet)).filter(Boolean)
  }));
};

const buildFallbackFaq = ({ title, category, tags = [], slug = '' }) => {
  const topic = resolveEditorialTopic({ title, category, tags, slug });
  const lexicon = getTopicLexicon(topic);

  return [
    {
      question: `Como saber se ${title.toLowerCase()} faz sentido para o meu momento?`,
      answer: `O caminho mais seguro Ã© comparar ${lexicon.comparator} e validar se a decisÃ£o melhora sua rotina financeira sem apertar o caixa dos prÃ³ximos meses.`
    },
    {
      question: 'Qual erro mais comum nesse tipo de escolha?',
      answer: `O erro mais frequente Ã© decidir com pressa e sem olhar custo total. Em geral, isso aparece quando a pessoa ignora pontos como ${lexicon.mistakes[0]} e segue apenas a promessa mais chamativa.`
    },
    {
      question: 'Vale comparar alternativas antes de seguir?',
      answer: `Sim. Comparar alternativas reduz risco e melhora a qualidade da decisÃ£o, especialmente quando existem caminhos como ${lexicon.alternatives}.`
    }
  ].map((item) => ({
    question: sanitizeInlineText(item.question),
    answer: sanitizeInlineText(item.answer)
  }));
};

const getTopicBlueprint = ({ title, category, slug, tags = [] }) => {
  const topic = resolveEditorialTopic({ title, category, slug, tags });
  const lexicon = getTopicLexicon(topic);

  const defaults = {
    focus: 'custo total, utilidade real e impacto da decisão no orçamento dos próximos meses',
    persona: 'uma pessoa comum, com renda apertada e pouco tempo para comparar alternativas com calma',
    situation: 'a necessidade aparece rápido, mas a escolha errada pode virar uma dor de cabeça que dura muitos meses',
    compare: [
      'olhar apenas a promessa comercial costuma esconder custo, prazo e risco',
      'comparar dois ou três cenários coloca a decisão em perspectiva e ajuda a enxergar o que cabe de verdade no orçamento',
      'a melhor opção quase sempre é a que combina clareza, previsibilidade e espaço para imprevistos'
    ],
    tips: [
      'anote o valor que cabe no mês antes de comparar qualquer opção',
      'leia o custo total, não só a parcela ou o benefício principal',
      'desconfie de urgência artificial e de promessa boa demais para o seu contexto'
    ],
    alternatives: 'adiar a contratação por alguns dias, reorganizar gastos, negociar condições ou buscar uma opção mais simples',
    internalRoutes: ['/blog', '/ferramentas', '/diagnostico-financeiro']
  };

  const byTopic = {
    emprestimos: {
      focus: 'CET, prazo, parcela final e risco de comprometer a renda além do que seria saudável',
      persona: 'alguém que precisa de fôlego no curto prazo, mas não quer transformar urgência em um contrato caro',
      situation: 'a oferta parece resolver o problema hoje, mas a parcela pode apertar ainda mais o caixa nas próximas semanas',
      alternatives: 'renegociação, empréstimo com prazo menor, reforço de renda temporário ou espera para comparar melhor',
      internalRoutes: ['/emprestimos', '/ferramentas', '/diagnostico-financeiro']
    },
    cartoes: {
      focus: 'anuidade, juros do rotativo, limite inicial e benefício que realmente faz diferença na rotina',
      persona: 'quem quer usar o cartão com controle, sem trocar praticidade por dívida cara',
      situation: 'um cartão pode parecer vantajoso no app, mas virar problema quando a fatura cresce sem planejamento',
      alternatives: 'cartão sem anuidade, débito, Pix ou reorganização da fatura atual',
      internalRoutes: ['/cartoes-de-credito', '/ferramentas', '/diagnostico-financeiro']
    },
    score: {
      focus: 'histórico de pagamentos, uso do crédito, atualização cadastral e consistência ao longo do tempo',
      persona: 'quem quer melhorar a imagem financeira sem cair em promessas milagrosas',
      situation: 'o número do score vira ansiedade, mas a melhora real depende de comportamento repetido por alguns meses',
      alternatives: 'regularizar pendências, reduzir pedidos simultâneos e organizar contas fixas',
      internalRoutes: ['/educacao-financeira', '/diagnostico-financeiro', '/blog']
    },
    financiamento: {
      focus: 'entrada, prazo, custo total pago e folga financeira depois de assumir a parcela',
      persona: 'uma família que quer financiar sem perder margem para manutenção, seguro e imprevistos',
      situation: 'a parcela cabe no limite, mas o custo acumulado cresce muito quando o prazo é longo demais',
      alternatives: 'aumentar entrada, reduzir prazo, considerar bem usado ou adiar a compra',
      internalRoutes: ['/financiamento', '/ferramentas', '/diagnostico-financeiro']
    },
    organizacao: {
      focus: 'previsibilidade do caixa, priorização de gastos e rotina simples de acompanhamento',
      persona: 'quem quer sair do improviso e transformar informação financeira em decisão prática',
      situation: 'o problema não está em faltar ferramenta, mas em não ter um processo simples para revisar o mês',
      alternatives: 'planilha simples, agenda semanal de revisão e metas menores',
      internalRoutes: ['/educacao-financeira', '/ferramentas', '/blog']
    },
    seguranca: {
      focus: 'origem da oferta, sinais de golpe, pedido de dados sensíveis e pressão para agir rápido',
      persona: 'quem recebeu uma mensagem, ligação ou link e precisa distinguir oportunidade de armadilha',
      situation: 'a urgência criada por terceiros costuma empurrar a decisão antes da checagem mínima',
      alternatives: 'validar canais oficiais, pausar a conversa e confirmar informações em fonte confiável',
      internalRoutes: ['/juros-abusivos', '/blog', '/diagnostico-financeiro']
    }
  };

  return {
    title,
    category,
    lexicon,
    ...(byTopic[topic] || {}),
    ...defaults,
    ...(byTopic[topic] || {})
  };
};

const buildReaderFriendlySections = ({ title, category, slug, tags = [] }) => {
  const blueprint = getTopicBlueprint({ title, category, slug, tags });

  return [
    {
      heading: 'Entenda o ponto principal antes de decidir',
      paragraphs: [
        `Quando o assunto é ${title.toLowerCase()}, a melhor leitura começa pelo que realmente pesa no bolso: ${blueprint.focus}. Esse filtro ajuda a separar o que é útil do que é só discurso de venda ou informação solta.`,
        `Em vez de buscar uma resposta pronta, vale perguntar como essa decisão conversa com sua renda, suas despesas fixas e o espaço que sobra no fim do mês. Essa mudança de perspectiva costuma evitar escolhas apressadas e deixa a análise muito mais prática.`
      ],
      bullets: [
        `coloque ${blueprint.lexicon.comparator} lado a lado`,
        'olhe o impacto no mês seguinte antes de fechar qualquer escolha',
        'dê preferência ao que você consegue explicar com clareza para si mesmo'
      ]
    },
    {
      heading: 'Exemplo prático para trazer o tema para a vida real',
      paragraphs: [
        `Imagine ${blueprint.persona}. Nesse cenário, ${blueprint.situation}. O erro mais comum é decidir só pela facilidade do momento, sem projetar como isso vai aparecer na rotina daqui a 30, 60 ou 90 dias.`,
        `Quando a pessoa transforma o caso em números simples, a decisão muda de nível. Fica mais fácil perceber o que cabe com folga, o que já nasce apertado e o que pode funcionar apenas em um cenário muito otimista.`
      ],
      bullets: [
        'monte um cenário realista e outro mais conservador',
        'considere o que acontece se surgir um gasto inesperado',
        'avalie se o benefício continua fazendo sentido depois do primeiro mês'
      ]
    },
    {
      heading: 'Comparação rápida entre cenários',
      paragraphs: [
        `Boa decisão financeira quase sempre nasce de comparação. Não basta saber se algo é possível; é preciso entender se é adequado para o seu momento e se existe um caminho mais leve para chegar ao mesmo resultado.`,
        `Uma leitura honesta costuma separar três quadros: quando faz sentido seguir, quando o alerta fica amarelo e quando é melhor recuar para reorganizar a base antes de avançar.`
      ],
      bullets: [
        `faz mais sentido quando ${blueprint.compare[1]}`,
        `merece cautela quando ${blueprint.compare[0]}`,
        `normalmente fica mais seguro quando ${blueprint.compare[2]}`
      ]
    },
    {
      heading: 'Erros comuns que deixam a decisão mais cara',
      paragraphs: [
        `Muita gente erra não por falta de informação, mas por dar peso demais ao detalhe menos importante. Isso acontece quando a pessoa olha só para taxa, limite, aprovação ou benefício principal e deixa de lado o conjunto da escolha.`,
        `Outro erro recorrente é comparar pouco. Em finanças, pequenas diferenças de prazo, custo total e regra de uso podem produzir um resultado bem diferente no longo prazo.`
      ],
      bullets: blueprint.lexicon.mistakes
    },
    {
      heading: 'Dicas práticas para aplicar ainda hoje',
      paragraphs: [
        `Você não precisa montar uma planilha complexa para tomar uma decisão melhor. Na maioria dos casos, alguns cuidados objetivos já aumentam muito a qualidade da escolha e reduzem o risco de arrependimento.`,
        `A lógica é simples: clareza primeiro, comparação depois e contratação por último. Quando essa ordem se inverte, o custo emocional e financeiro tende a subir.`
      ],
      bullets: blueprint.tips
    },
    {
      heading: 'Checklist final antes de seguir',
      paragraphs: [
        `Se a intenção é sair deste artigo com um próximo passo mais claro, feche a leitura com um checklist enxuto. Esse pequeno ritual ajuda a reduzir impulso, melhora o senso de controle e deixa a decisão mais coerente com a sua realidade.`
      ],
      bullets: blueprint.lexicon.checklist
    },
    {
      heading: 'Alternativas que também merecem comparação',
      paragraphs: [
        `Nem sempre a solução principal é a melhor para o momento. Em vários cenários, comparar com ${blueprint.alternatives} amplia sua visão e evita assumir um compromisso desnecessariamente pesado.`,
        `A melhor decisão não é a mais empolgante nem a mais rápida. É a que resolve o problema sem criar outro maior logo na frente.`
      ],
      bullets: [
        'compare pelo objetivo real, não pelo nome do produto',
        'prefira opções que mantêm alguma margem para imprevistos',
        'se ainda houver dúvida, volte para a comparação antes de assinar ou contratar'
      ]
    }
  ].map((section) => ({
    heading: sanitizeInlineText(section.heading),
    paragraphs: section.paragraphs.map((paragraph) => sanitizeInlineText(paragraph)).filter(Boolean),
    bullets: section.bullets.map((bullet) => sanitizeInlineText(bullet)).filter(Boolean)
  }));
};

const buildReaderFriendlyFaq = ({ title, category, slug, tags = [] }) => {
  const blueprint = getTopicBlueprint({ title, category, slug, tags });

  return [
    {
      question: `Como saber se ${title.toLowerCase()} faz sentido para mim agora?`,
      answer: `O melhor caminho é cruzar ${blueprint.focus} com a sua rotina atual. Se a escolha resolve um problema real sem apertar demais o orçamento dos próximos meses, ela tende a fazer mais sentido.`
    },
    {
      question: 'Qual é o erro mais comum ao avaliar esse tema?',
      answer: `O deslize mais frequente é decidir pela pressa e comparar pouco. Em geral, isso aparece quando a pessoa ignora pontos como ${blueprint.lexicon.mistakes[0]} e segue apenas a promessa mais chamativa.`
    },
    {
      question: 'Vale a pena comparar outras alternativas antes de seguir?',
      answer: `Sim. Em finanças, comparar alternativas costuma melhorar a decisão e reduzir risco. Muitas vezes, caminhos como ${blueprint.alternatives} entregam um resultado melhor com menos pressão no orçamento.`
    }
  ].map((item) => ({
    question: sanitizeInlineText(item.question),
    answer: sanitizeInlineText(item.answer)
  }));
};

const ensureEditorialDepth = ({ title, category, slug, tags, intro, sections, conclusion, faq, content }) => {
  const minWords = 1200;
  const supplementalSections = [
    ...buildReaderFriendlySections({ title, category, slug, tags }),
    ...buildSupplementalSections({ title, category, slug, tags })
  ];
  const nextSections = [...sections];
  const nextFaq = faq.length ? faq : buildReaderFriendlyFaq({ title, category, slug, tags });

  let currentWordCount = countWords([
    content,
    ...intro,
    ...conclusion,
    ...nextFaq.flatMap((item) => [item.question, item.answer]),
    ...nextSections.flatMap((section) => [section.heading, ...section.paragraphs, ...section.bullets])
  ]);

  supplementalSections.forEach((section) => {
    if (currentWordCount >= minWords) return;
    if (nextSections.some((item) => normalizeText(item.heading) === normalizeText(section.heading))) return;

    nextSections.push(section);
    currentWordCount = countWords([
      content,
      ...intro,
      ...conclusion,
      ...nextFaq.flatMap((item) => [item.question, item.answer]),
      ...nextSections.flatMap((item) => [item.heading, ...item.paragraphs, ...item.bullets])
    ]);
  });

  return {
    sections: nextSections,
    faq: nextFaq
  };
};

const buildFallbackInternalLinks = ({ category = '', routePath = '' }) => {
  const topic = resolveEditorialTopic({ category, slug: routePath });
  const routeMap = {
    emprestimos: ['/emprestimos', '/diagnostico-financeiro', '/cote-finance-ai'],
    cartoes: ['/cartoes', '/diagnostico-financeiro', '/blog'],
    financiamento: ['/financiamentos', '/ferramentas', '/blog'],
    score: ['/diagnostico-financeiro', '/blog', '/cote-finance-ai'],
    organizacao: ['/ferramentas', '/diagnostico-financeiro', '/blog'],
    seguranca: ['/blog', '/ferramentas', '/diagnostico-financeiro'],
    educacao: ['/ferramentas', '/blog', '/cote-finance-ai']
  };

  return (routeMap[topic] || routeMap.educacao)
    .filter((path) => path !== routePath)
    .map((path) => ({ path }));
};

export const normalizeArticleSlug = (article = {}) =>
  slugify(
    (isObjectRecord(article) ? article.slug || article.title || article.h1 || article.id : '') || 'artigo'
  );

export const normalizeArticleData = (article = {}, options = {}) => {
  const source = isObjectRecord(article) ? article : {};
  const nowIso = options.nowIso || new Date().toISOString();
  const title = sanitizeInlineText(source.title || source.h1 || source.seoTitle || source.metaTitle || 'Artigo Cote Juros');
  const slug = normalizeArticleSlug({ ...source, title });
  const explicitRoutePath = normalizeRoutePath(source.routePath || source.path || '');
  const routePath = explicitRoutePath || (sanitizeInlineText(source.sourceType) === 'wordpress' ? `/${slug}` : `/blog/${slug}`);
  const canonicalUrl =
    sanitizeInlineText(source.canonicalUrl || '') ||
    `https://www.cotejuros.com.br${routePath}${routePath.endsWith('/') ? '' : '/'}`;
  const category =
    resolveCategoryName(source.categoryName || source.clusterLabel || source.category || FALLBACK_CATEGORY, FALLBACK_CATEGORY) ||
    FALLBACK_CATEGORY;
  const excerpt =
    sanitizeInlineText(source.excerpt || source.summary || source.metaDescription) || buildDefaultSummary(title, category);
  const intro = sanitizeStringArray(source.intro);
  const sections = normalizeSections(source.sections, title);
  const faq = normalizeFaq(source.faq || source.faqSchema);
  const conclusion = sanitizeStringArray(source.conclusion);
  const tags = sanitizeStringArray(source.tags || source.keywords);
  const editorial = buildEditorialContent({
    title,
    category,
    intro,
    sections,
    conclusion,
    tags,
    content: source.content
  });
  const depth = ensureEditorialDepth({
    title,
    category,
    slug,
    tags,
    intro: editorial.intro,
    sections: editorial.sections,
    conclusion: editorial.conclusion,
    faq,
    content: editorial.content
  });
  const author = sanitizeInlineText(source.author || source.authorName || FALLBACK_AUTHOR) || FALLBACK_AUTHOR;
  const publishedAt = sanitizeDate(source.publishedAt || source.publishDate || source.createdAt, nowIso);
  const updatedAt = sanitizeDate(source.updatedAt || source.modifiedAt || publishedAt, publishedAt);
  const readTime = Number.isFinite(Number(source.readTime)) && Number(source.readTime) > 0
    ? Number(source.readTime)
    : estimateReadTime({
      ...editorial,
      sections: depth.sections,
      faq: depth.faq
    });
  const normalizedInternalLinks = normalizeInternalLinks(source.internalLinks);
  const mergedInternalLinks = [...normalizedInternalLinks, ...normalizeInternalLinks(buildFallbackInternalLinks({ category, routePath }))].filter(
    (item, index, list) => item.path && list.findIndex((entry) => entry.path === item.path) === index
  );

  const normalized = {
    ...source,
    id: sanitizeInlineText(source.id || `article-${slug}`),
    slug,
    title,
    h1: sanitizeInlineText(source.h1 || title) || title,
    description: sanitizeInlineText(source.metaDescription || source.seoDescription || excerpt) || excerpt,
    excerpt,
    summary: excerpt,
    category,
    categoryKey: normalizeText(category),
    author,
    publishedAt,
    publishDate: publishedAt,
    date: publishedAt,
    updatedAt,
    readingTime: readTime,
    readTime,
    tags,
    keywords: tags,
    intro: editorial.intro,
    sections: depth.sections,
    conclusion: editorial.conclusion,
    faq: depth.faq,
    content: editorial.content,
    internalLinks: mergedInternalLinks,
    metaTitle: sanitizeInlineText(source.metaTitle || ''),
    seoTitle: sanitizeInlineText(source.seoTitle || source.metaTitle || `${title} | Blog Cote Juros`) || `${title} | Blog Cote Juros`,
    metaDescription:
      sanitizeInlineText(source.metaDescription || source.seoDescription || excerpt) ||
      `Guia da Cote Juros sobre ${title.toLowerCase()} com foco em clareza, organização e decisões financeiras mais seguras.`,
    coverImage: sanitizeInlineText(source.coverImage || source.image || source.imageUrl || source.featuredImage || ''),
    coverImageAlt: sanitizeInlineText(source.coverImageAlt || source.imageAlt || source.alt || '') || `Capa do artigo ${title}`,
    image: sanitizeInlineText(source.coverImage || source.image || source.imageUrl || source.featuredImage || ''),
    imageAlt: sanitizeInlineText(source.coverImageAlt || source.imageAlt || source.alt || '') || `Capa do artigo ${title}`,
    routePath,
    canonicalUrl,
    legacyUrl: sanitizeInlineText(source.legacyUrl || ''),
    sourceType: sanitizeInlineText(source.sourceType || 'editorial') || 'editorial',
    status: sanitizeInlineText(source.status || 'published') || 'published'
  };

  return normalized;
};

export const resolveArticleBySlug = ({ slug = '', directArticle = null, articles = [] } = {}) => {
  try {
    const normalizedSlug = slugify(slug);
    if (!normalizedSlug) return null;

    if (isObjectRecord(directArticle)) {
      const normalized = normalizeArticleData(directArticle);
      if (normalized.slug === normalizedSlug) return normalized;
    }

    const list = Array.isArray(articles) ? articles : [];
    return list.map((item) => normalizeArticleData(item)).find((item) => item.slug === normalizedSlug) || null;
  } catch (error) {
    console.error('[blog-article-resolver] falha ao resolver artigo', { slug, error });
    return null;
  }
};

const SLUG_SUFFIX_VARIANTS = [
  '-como-avaliar',
  '-como-escolher',
  '-como-usar',
  '-como-funciona',
  '-como-analisar',
  '-como-ler',
  '-vale-a-pena'
];

const buildSlugVariants = (slug = '') => {
  const normalized = slugify(slug);
  if (!normalized) return [];

  const variants = new Set([normalized]);
  SLUG_SUFFIX_VARIANTS.forEach((suffix) => {
    if (normalized.endsWith(suffix)) variants.add(normalized.slice(0, -suffix.length));
  });

  return Array.from(variants).filter(Boolean);
};

export const getArticleSummary = (article = {}) => normalizeArticleData(article).summary;

export const getEditorialTitle = (article = {}) => {
  if (!isObjectRecord(article)) return '';
  const normalizedArticle = normalizeArticleData(article);
  const originalTitle = normalizedArticle.title;
  if (!originalTitle) return '';

  const slug = normalizedArticle.slug;
  const directOverrides = {
    'educacao-financeira-para-quem-ganha-pouco': 'Como organizar suas finanças mesmo ganhando pouco',
    'educacao-financeira-para-quem-quer-financiar-imovel': 'Como financiar um imóvel sem comprometer sua renda'
  };

  if (directOverrides[slug]) return directOverrides[slug];
  return originalTitle;
};

export const getArticleImage = (article = {}) => resolveArticleImageSources(normalizeArticleData(article)).primary;
export const getArticleImageCandidates = (article = {}) => resolveArticleImageSources(normalizeArticleData(article));
export const getArticleImageAlt = (article = {}) => resolveArticleImageAlt(normalizeArticleData(article));
export const getArticleCategoryKey = (article = {}) => (isObjectRecord(article) ? normalizeArticleData(article).categoryKey : '');
export const getArticlePath = (article = {}) => (isObjectRecord(article) ? normalizeArticleData(article).routePath : '/blog');

export const getArticleParagraphs = (article = {}) => {
  if (!isObjectRecord(article)) return [];
  const normalizedArticle = normalizeArticleData(article);
  if (normalizedArticle.intro.length) return normalizedArticle.intro;

  if (typeof normalizedArticle.content === 'string' && normalizedArticle.content) {
    return normalizedArticle.content
      .split(/\n+/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
};

export const buildArticleToc = (article = {}) => {
  if (!isObjectRecord(article)) return [];
  const normalizedArticle = normalizeArticleData(article);
  const items = normalizedArticle.sections
    .map((section, index) =>
      section.heading
        ? {
            id: `secao-${index + 1}`,
            label: section.heading
          }
        : null
    )
    .filter(Boolean);

  if (normalizedArticle.faq.length) items.push({ id: 'faq', label: 'Perguntas frequentes' });
  if (normalizedArticle.conclusion.length) items.push({ id: 'conclusao', label: 'Conclusão' });
  return items;
};

export const isArticleSlugMatch = (article = {}, slug = '') => {
  if (!isObjectRecord(article)) return false;
  const articleSlug = normalizeArticleSlug(normalizeArticleData(article));
  const requestedSlug = slugify(slug);
  if (!articleSlug || !requestedSlug) return false;

  const articleVariants = buildSlugVariants(articleSlug);
  const requestedVariants = buildSlugVariants(requestedSlug);
  return articleVariants.some((variant) => requestedVariants.includes(variant));
};

export const findArticleBySlug = (articles = [], slug = '') =>
  (Array.isArray(articles) ? articles : [])
    .map((article) => normalizeArticleData(article))
    .find((article) => isArticleSlugMatch(article, slug)) || null;
