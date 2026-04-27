import {
  findPortugueseEncodingIssues,
  repairPortugueseInObject,
  repairPortugueseText
} from './portugueseTextService.js';

const MAX_HEADLINE_LENGTH = 70;
const MIN_INTERNAL_LINKS = 3;
const INTENT_RULES = [
  { intent: 'news', pattern: /pris[aã]o|governo|lan[cç]a|recorde|2025|2026|stf|pf|banco master|selic hoje|cdi|sal[aá]rio|inss/i },
  { intent: 'tool', pattern: /calculadora|simulador|consulta|tabela|fipe/i },
  { intent: 'comparison', pattern: /melhor|diferen[cç]a|versus| ou |comparar|op[cç][oõ]es/i },
  { intent: 'howto', pattern: /^(como|qual|quais|posso|fiz|o que|quando|por que)\b/i },
  { intent: 'decision', pattern: /vale a pena|emprestimo|empr[eé]stimo|cr[eé]dito|financiamento|cart[aã]o|juros|d[ií]vida|score|reserva|consignado|renegoci|parcel|fatura|c[eé]t|pix|banco|invest/i }
];

const stripMarkdownArtifacts = (value = '') =>
  String(value || '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/(^|\s)#{1,6}\s*/g, ' ')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/_(.*?)_/g, '$1')
    .replace(/`([^`]+)`/g, '$1');

export const stripHtmlArtifacts = (value = '') =>
  stripMarkdownArtifacts(value)
    .replace(/<a\b[^>]*>([\s\S]*?)<\/a>/gi, '$1')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/p\s*>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\s+/g, ' ')
    .trim();

export const compactText = (value = '') => repairPortugueseText(stripHtmlArtifacts(value)).replace(/\s+/g, ' ').trim();

const ensureSentence = (value = '') => {
  const text = compactText(value);
  if (!text) return '';
  return /[.!?:]$/.test(text) ? text : `${text}.`;
};

const normalizeKeyword = (value = '') =>
  compactText(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

const includesKeyword = (value = '', keyword = '') => {
  if (!keyword) return true;
  const normalizedValue = normalizeKeyword(value);
  const normalizedKeyword = normalizeKeyword(keyword);
  if (normalizedValue.includes(normalizedKeyword)) return true;
  const tokens = normalizedKeyword.split(/[^a-z0-9]+/).filter((item) => item.length >= 3);
  if (!tokens.length) return true;
  const leadingTokens = tokens.slice(0, Math.min(4, tokens.length));
  const matched = leadingTokens.filter((token) => normalizedValue.includes(token)).length;
  return matched >= 1;
};

const trimToSentence = (value = '', max = 160) => {
  const text = ensureSentence(value);
  if (text.length <= max) return text;
  const slice = text.slice(0, max - 1).trim();
  const lastSpace = slice.lastIndexOf(' ');
  return `${slice.slice(0, lastSpace > 80 ? lastSpace : slice.length).trim()}.`;
};

export const classifyArticleIntent = ({ title = '', keyword = '', slug = '', category = '' } = {}) => {
  const haystack = compactText(`${title} ${keyword} ${String(slug).replace(/-/g, ' ')} ${category}`);
  return INTENT_RULES.find((rule) => rule.pattern.test(haystack))?.intent || 'guide';
};

const textArray = (items = [], max = 3) =>
  (Array.isArray(items) ? items : [])
    .map((item) => ensureSentence(item))
    .filter(Boolean)
    .slice(0, max);

const limitParagraph = (value = '') => trimToSentence(value, 320);

const buildQuestionHeadline = (keyword = '', fallbackTitle = '') => {
  const rawKeyword = compactText(keyword || fallbackTitle)
    .replace(/[?.!:]+$/g, '')
    .split(/\s+o que\s+|\s+como\s+|\s+guia\s+|\s+analise\s+|\s+análise\s+/i)[0]
    .trim() || compactText(keyword || fallbackTitle).replace(/[?.!:]+$/g, '');
  if (/vale a pena\?/i.test(rawKeyword) && rawKeyword.length <= MAX_HEADLINE_LENGTH) return rawKeyword;
  const baseKeyword = rawKeyword.length > 52
    ? rawKeyword.slice(0, 52).replace(/\s+\S*$/g, '').trim()
    : rawKeyword;
  const lowerKeyword = baseKeyword.charAt(0).toUpperCase() + baseKeyword.slice(1);
  const intent = classifyArticleIntent({ title: fallbackTitle, keyword: lowerKeyword });
  if (intent === 'news' || intent === 'tool' || intent === 'guide') {
    return lowerKeyword.length <= MAX_HEADLINE_LENGTH
      ? lowerKeyword
      : lowerKeyword.slice(0, MAX_HEADLINE_LENGTH).replace(/\s+\S*$/g, '').trim();
  }
  if (intent === 'comparison') {
    const candidate = `${lowerKeyword}: compare custos e riscos`;
    return candidate.length <= MAX_HEADLINE_LENGTH
      ? candidate
      : lowerKeyword.slice(0, MAX_HEADLINE_LENGTH).replace(/\s+\S*$/g, '').trim();
  }
  if (/vale a pena/i.test(lowerKeyword)) {
    const normalizedQuestion = lowerKeyword.replace(/\?+$/g, '');
    const candidate = `${normalizedQuestion}? Veja custos e riscos`;
    if (candidate.length <= MAX_HEADLINE_LENGTH) return candidate;
    const question = `${normalizedQuestion}?`;
    return question.length <= MAX_HEADLINE_LENGTH
      ? question
      : `${question.slice(0, MAX_HEADLINE_LENGTH - 1).replace(/\s+\S*$/g, '').trim()}?`;
  }
  if (/^(como|qual|quais|posso|fiz|o que|quando|por que)\b/i.test(lowerKeyword)) {
    const question = lowerKeyword.endsWith('?') ? lowerKeyword : `${lowerKeyword}?`;
    return question.length <= MAX_HEADLINE_LENGTH ? question : `${question.slice(0, MAX_HEADLINE_LENGTH - 1).replace(/\s+\S*$/g, '').trim()}?`;
  }
  if (!/emprestimo|cr[eé]dito|financiamento|cart[aã]o|juros|d[ií]vida|score|reserva|consignado|renegoci|parcel|fatura|c[eé]t|pix|banco|invest/i.test(lowerKeyword)) {
    return lowerKeyword.length <= MAX_HEADLINE_LENGTH
      ? lowerKeyword
      : lowerKeyword.slice(0, MAX_HEADLINE_LENGTH).replace(/\s+\S*$/g, '').trim();
  }
  const candidate = `${lowerKeyword} vale a pena? Veja custos e riscos`;
  if (candidate.length <= MAX_HEADLINE_LENGTH) return candidate;
  const short = `${lowerKeyword} vale a pena?`;
  return short.length <= MAX_HEADLINE_LENGTH ? short : short.slice(0, MAX_HEADLINE_LENGTH).trim();
};

const inferMoneyExample = ({ title = '', keyword = '' } = {}) => {
  const text = normalizeKeyword(`${title} ${keyword}`);
  if (/financiamento|carro|veiculo|entrada/.test(text)) {
    return 'Exemplo: um carro de R$ 40.000 financiado em 48 meses pode passar de R$ 60.000 no custo total quando juros, IOF, tarifas e seguro entram na conta.';
  }
  if (/cartao|rotativo|limite|fatura/.test(text)) {
    return 'Exemplo: uma fatura de R$ 2.000 no rotativo pode virar uma dívida bem maior em poucos meses se a pessoa pagar apenas o mínimo.';
  }
  if (/emprestimo|credito|negativado|consignado/.test(text)) {
    return 'Exemplo: um empréstimo de R$ 3.000 em 12 parcelas de R$ 330 custa R$ 3.960 no total, antes de comparar taxas e eventuais tarifas.';
  }
  return 'Exemplo: uma parcela de R$ 500 consome 25% de uma renda mensal de R$ 2.000 e reduz a margem para mercado, contas fixas e imprevistos.';
};

const buildAlert = ({ keyword = '' } = {}) =>
  `Atenção: antes de contratar ${compactText(keyword || 'crédito')}, compare CET, prazo, parcela e impacto na renda. Uma parcela que parece pequena pode apertar o orçamento se houver atraso, queda de renda ou nova emergência.`;

const buildFinancialImpact = ({ keyword = '' } = {}) => [
  `Impacto na renda: ${compactText(keyword || 'essa decisão')} deve caber no orçamento sem depender de novo crédito no mês seguinte.`,
  'Risco de endividamento: parcelas longas reduzem a flexibilidade e podem dificultar renegociações se a renda cair.',
  'Cenário negativo: atraso gera juros, multa, restrição de crédito e menos poder de escolha em novas propostas.'
];

const buildAlternatives = ({ keyword = '' } = {}) => [
  `Comparar outras modalidades antes de fechar ${compactText(keyword || 'a contratação')}.`,
  'Simular prazos menores e maiores para enxergar o custo total.',
  'Adiar a contratação quando a parcela comprometer uma parte alta da renda.',
  'Renegociar dívidas caras antes de assumir uma nova parcela.'
];

const buildMidQuestions = ({ keyword = '' } = {}) => [
  {
    question: `${compactText(keyword || 'Essa opção')} vale a pena?`,
    answer: 'Vale quando o custo total cabe na renda, o objetivo é claro e existem alternativas comparadas. Se a decisão depender de urgência extrema, o risco aumenta.'
  },
  {
    question: 'Qual número olhar primeiro?',
    answer: 'Olhe o CET, porque ele mostra o custo efetivo total e evita comparar apenas a parcela mensal.'
  }
];

const buildCtas = () => [
  {
    position: 'after_intro',
    title: 'Compare antes de contratar',
    description: 'Veja opções reais de crédito com base no seu perfil e entenda o custo antes de avançar.',
    to: '/emprestimos',
    label: 'Ver opções de crédito'
  },
  {
    position: 'middle',
    title: 'Simule o impacto na parcela',
    description: 'Use a comparação para entender prazo, juros e comprometimento de renda.',
    to: '/ferramentas',
    label: 'Usar ferramentas'
  },
  {
    position: 'before_conclusion',
    title: 'Decida com mais segurança',
    description: 'Revise alternativas e escolha apenas se a parcela fizer sentido no seu orçamento.',
    to: '/diagnostico-financeiro',
    label: 'Fazer diagnóstico'
  }
];

const normalizeSection = (section = {}) => ({
  heading: compactText(section.heading || section.title || ''),
  subheading: ensureSentence(section.subheading || section.description || ''),
  paragraphs: textArray(section.paragraphs || section.content || [], 3).map(limitParagraph),
  bullets: (Array.isArray(section.bullets) ? section.bullets : [])
    .map((item) => ensureSentence(item))
    .filter(Boolean)
    .slice(0, 5)
});

const hasSectionLike = (sections = [], pattern) =>
  sections.some((section) => pattern.test(normalizeKeyword(section.heading)));

const appendSectionIfMissing = (sections, pattern, section) => {
  if (hasSectionLike(sections, pattern)) return sections;
  return [...sections, section];
};

const ensureKeywordHeadings = (sections = [], keyword = '') => {
  const cleanKeyword = compactText(keyword);
  if (!cleanKeyword || sections.filter((section) => includesKeyword(section.heading, cleanKeyword)).length >= 2) {
    return sections;
  }

  return sections.map((section, index) => {
    if (index > 1) return section;
    if (includesKeyword(section.heading, cleanKeyword)) return section;
    return {
      ...section,
      heading: `${cleanKeyword}: ${section.heading}`.slice(0, 96)
    };
  });
};

const ensureFaq = ({ faq = [], keyword = '' } = {}) => {
  const base = (Array.isArray(faq) ? faq : [])
    .map((item) => ({
      question: compactText(item?.question || '').replace(/\.$/, '?'),
      answer: trimToSentence(item?.answer || '', 220)
    }))
    .filter((item) => item.question && item.answer);

  const defaults = [
    {
      question: `${compactText(keyword || 'Esse crédito')} vale a pena?`,
      answer: 'Vale se o custo total couber na renda e se houver comparação entre alternativas antes da contratação.'
    },
    {
      question: 'O que comparar antes de contratar?',
      answer: 'Compare CET, prazo, valor da parcela, custo total, tarifas e consequências em caso de atraso.'
    },
    {
      question: 'Qual o maior risco financeiro?',
      answer: 'O maior risco é comprometer renda demais e precisar de novo crédito para pagar despesas básicas.'
    },
    {
      question: 'Como reduzir o custo?',
      answer: 'Simule prazos diferentes, melhore o perfil de crédito quando possível e evite contratar com pressa.'
    },
    {
      question: 'A Cote Juros aprova crédito?',
      answer: 'Não. A Cote Juros ajuda a comparar informações e encaminhar para parceiros, mas não garante aprovação.'
    }
  ];

  for (const item of defaults) {
    if (base.length >= 6) break;
    if (!base.some((existing) => normalizeKeyword(existing.question) === normalizeKeyword(item.question))) {
      base.push(item);
    }
  }

  return base.slice(0, 6);
};

export const enforceArticleStandard = ({ article = {}, primaryKeyword = '', internalLinks = [] } = {}) => {
  const cleanArticle = repairPortugueseInObject(article);
  const keyword = compactText(primaryKeyword || cleanArticle.clusterKeyword || cleanArticle.tags?.[0] || cleanArticle.title || '');
  const editorialIntent = classifyArticleIntent({
    title: cleanArticle.title || cleanArticle.h1,
    keyword,
    slug: cleanArticle.slug,
    category: cleanArticle.category
  });
  const title = buildQuestionHeadline(keyword, cleanArticle.title || cleanArticle.h1);
  const intro = textArray(cleanArticle.intro || [], 2);
  const fallbackIntro = [
    `${keyword} exige comparar custo total, parcela e risco antes de decidir. A melhor escolha é aquela que cabe na renda e deixa claro o que acontece se houver atraso.`,
    'Neste guia, você vê a resposta direta, um exemplo com números, alertas importantes, alternativas e próximos passos para decidir com mais segurança.'
  ];

  let sections = (Array.isArray(cleanArticle.sections) ? cleanArticle.sections : []).map(normalizeSection).filter((section) => section.heading);
  sections = appendSectionIfMissing(sections, /exemplo|simulacao|numeros/, {
    heading: `${keyword}: exemplo real com números`,
    subheading: 'Uma simulação simples ajuda a enxergar o custo além da parcela.',
    paragraphs: [inferMoneyExample({ title, keyword }), 'Use o exemplo como referência inicial e sempre confira as condições exatas antes de contratar.'],
    bullets: ['Compare CET, prazo e custo total.', 'Veja se a parcela cabe mesmo em um mês ruim.']
  });
  sections = appendSectionIfMissing(sections, /alerta|risco|cuidado/, {
    heading: `Alerta antes de decidir sobre ${keyword}`,
    subheading: 'O risco aparece quando a parcela parece pequena, mas o contrato pesa por muitos meses.',
    paragraphs: [buildAlert({ keyword }), 'Se o pagamento depender de renda instável ou de novo crédito, a decisão precisa ser revista.'],
    bullets: ['Evite contratar por impulso.', 'Não compare apenas a parcela.']
  });
  sections = appendSectionIfMissing(sections, /impacto|renda|endividamento/, {
    heading: `Impacto financeiro de ${keyword}`,
    subheading: 'A decisão precisa caber na renda atual e no cenário negativo.',
    paragraphs: buildFinancialImpact({ keyword }).slice(0, 2),
    bullets: buildFinancialImpact({ keyword }).slice(2)
  });
  sections = appendSectionIfMissing(sections, /alternativa|opcoes|comparar/, {
    heading: `Alternativas antes de contratar ${keyword}`,
    subheading: 'Comparar caminhos reduz o risco de aceitar a primeira oferta.',
    paragraphs: ['Nem sempre a primeira proposta é a mais barata ou a mais adequada para o seu momento financeiro.', 'Antes de fechar, teste outros prazos, modalidades e cenários de renda.'],
    bullets: buildAlternatives({ keyword })
  });
  sections = appendSectionIfMissing(sections, /checklist|lista|passo/, {
    heading: `Lista rápida para avaliar ${keyword}`,
    subheading: 'Use estes pontos como filtro antes de avançar para uma proposta.',
    paragraphs: ['Uma lista simples evita que a decisão fique baseada apenas em urgência, propaganda ou valor da parcela.', 'Revise os pontos principais no celular antes de enviar dados ou aceitar qualquer proposta.'],
    bullets: ['Confirme o CET.', 'Compare pelo menos duas alternativas.', 'Veja o impacto na renda.', 'Leia as condições de atraso.']
  });
  while (sections.length < 5) {
    sections.push({
      heading: `Ponto essencial sobre ${keyword}`,
      subheading: 'Um reforço prático para manter a decisão clara e segura.',
      paragraphs: ['Antes de decidir, volte aos números principais e confira se o custo total combina com sua renda atual.', 'Se a resposta ainda não estiver clara, compare mais uma alternativa antes de avançar.'],
      bullets: ['Revise a parcela.', 'Compare o custo total.', 'Evite pressa na contratação.']
    });
  }
  sections = ensureKeywordHeadings(sections.slice(0, 8), keyword);

  const standard = {
    featuredSnippet: trimToSentence(
      cleanArticle.featuredSnippet || `${keyword} deve ser analisado pelo custo total, pelo impacto da parcela na renda e pelo risco de endividamento antes da contratação.`,
      180
    ),
    example: inferMoneyExample({ title, keyword }),
    alert: buildAlert({ keyword }),
    midQuestions: buildMidQuestions({ keyword }),
    ctas: buildCtas(),
    financialImpact: buildFinancialImpact({ keyword }),
    alternatives: buildAlternatives({ keyword }),
    qualityStandardVersion: '2026-04-finance-portal',
    discoverProfile: {
      intent: editorialIntent,
      headlineLength: title.length,
      imageRequired: true,
      mobileScanReady: true,
      recommendation: editorialIntent === 'news'
        ? 'priorizar atualidade, imagem forte e título factual'
        : editorialIntent === 'decision'
          ? 'priorizar comparação, risco, exemplo numérico e CTA'
          : 'priorizar resposta direta, FAQ e links para guias relacionados'
    }
  };

  return {
    ...cleanArticle,
    clusterKeyword: keyword,
    editorialIntent,
    title,
    h1: title,
    summary: trimToSentence(cleanArticle.summary || `${keyword}: veja custos, riscos, exemplos e alternativas para decidir com mais clareza antes de contratar.`, 155),
    metaTitle: title,
    metaDescription: trimToSentence(cleanArticle.metaDescription || `Entenda ${keyword}, compare custos reais, veja riscos, alternativas e exemplos antes de contratar.`, 165),
    intro: (intro.length >= 1 ? intro : fallbackIntro).map((paragraph, index) => (
      index === 0 && !includesKeyword(paragraph, keyword)
        ? `${keyword}: ${paragraph}`
        : paragraph
    )),
    sections,
    faq: ensureFaq({ faq: cleanArticle.faq, keyword }),
    conclusion: textArray(cleanArticle.conclusion || [], 2).length
      ? textArray(cleanArticle.conclusion || [], 2).map((paragraph, index) => (
          index === 0 && !includesKeyword(paragraph, keyword)
            ? `${keyword}: ${paragraph}`
            : paragraph
        ))
      : [
          `${keyword} pode fazer sentido quando o custo total e a parcela cabem na renda sem criar dependência de novo crédito.`,
          'Antes de decidir, compare alternativas, revise o CET e avance apenas quando a proposta estiver clara para o seu orçamento.'
        ],
    internalLinks: Array.isArray(internalLinks) && internalLinks.length ? internalLinks : cleanArticle.internalLinks,
    ...standard
  };
};

export const validateArticle = ({ article = {}, internalLinks = [], image = null, existingIssues = [] } = {}) => {
  const issues = [...existingIssues];
  const portugueseIssues = findPortugueseEncodingIssues(article);
  const keyword = compactText(article.clusterKeyword || article.tags?.[0] || article.title || '');
  const title = compactText(article.title || article.h1 || '');
  const intro = Array.isArray(article.intro) ? article.intro : [];
  const sections = Array.isArray(article.sections) ? article.sections : [];
  const faq = Array.isArray(article.faq) ? article.faq : [];
  const ctas = Array.isArray(article.ctas) ? article.ctas : [];
  const editorialIntent = article.editorialIntent || classifyArticleIntent({
    title,
    keyword,
    slug: article.slug,
    category: article.category
  });
  const plain = [
    ...intro,
    article.featuredSnippet,
    article.example,
    article.alert,
    ...sections.flatMap((section) => [section.heading, section.subheading, ...(section.paragraphs || []), ...(section.bullets || [])]),
    ...((article.midQuestions || []).flatMap((item) => [item.question, item.answer])),
    ...((article.financialImpact || [])),
    ...((article.alternatives || [])),
    ...faq.flatMap((item) => [item.question, item.answer]),
    ...(article.conclusion || [])
  ].filter(Boolean).join(' ');

  if (!title || title.length > MAX_HEADLINE_LENGTH) issues.push('Headline ausente ou acima de 70 caracteres');
  if (editorialIntent === 'decision' && keyword && !includesKeyword(title, keyword)) issues.push('Keyword principal ausente no título');
  if (intro.length < 1 || intro.length > 2) issues.push('Introdução deve ter 1 ou 2 parágrafos');
  if (editorialIntent === 'decision' && keyword && !includesKeyword(intro[0] || '', keyword)) issues.push('Keyword principal ausente no primeiro parágrafo');
  if (!article.featuredSnippet || compactText(article.featuredSnippet).length < 50) issues.push('Featured snippet ausente ou fraco');
  if (!sections.length || sections.length < 5) issues.push('Corpo explicativo insuficiente');
  if (!article.example || !/R\$\s?\d|[0-9]+%|\d+\s*mes/i.test(normalizeKeyword(article.example))) issues.push('Exemplo real com números ausente');
  if (!article.alert || !/atencao|risco|cuidado/i.test(normalizeKeyword(article.alert))) issues.push('Bloco de alerta ausente');
  if (!sections.some((section) => Array.isArray(section.bullets) && section.bullets.length >= 2)) issues.push('Lista escaneável ausente');
  if (!Array.isArray(article.midQuestions) || article.midQuestions.length < 1) issues.push('Perguntas no meio do conteúdo ausentes');
  if (ctas.length < 3) issues.push('Três CTAs obrigatórios ausentes');
  if (!Array.isArray(article.financialImpact) || article.financialImpact.length < 3) issues.push('Impacto financeiro incompleto');
  if (!Array.isArray(article.alternatives) || article.alternatives.length < 3) issues.push('Alternativas insuficientes');
  if (faq.length < 4 || faq.length > 6) issues.push('FAQ final deve ter 4 a 6 perguntas');
  if (!Array.isArray(article.conclusion) || !article.conclusion.length) issues.push('Conclusão ausente');
  if (editorialIntent === 'decision' && keyword && !includesKeyword((article.conclusion || []).join(' '), keyword)) issues.push('Keyword principal ausente na conclusão');
  if (editorialIntent === 'decision' && sections.filter((section) => includesKeyword(section.heading, keyword)).length < 2) issues.push('Keyword principal em menos de 2 subtítulos');
  if (!Array.isArray(internalLinks) || internalLinks.length < MIN_INTERNAL_LINKS) issues.push('Minimo de 3 links internos ausente');
  if (/<a\b|<\/a>|<[^>]+>/i.test(plain)) issues.push('HTML cru encontrado no texto do artigo');
  if (plain.split(/\s+/).some((word) => word.length > 42 && /[<>]/.test(word))) issues.push('Possivel artefato HTML em palavra longa');
  if (image && (!image.publicPath || !image.validationPassed || image.isFallback)) issues.push('Imagem editorial invalida');
  if (portugueseIssues.length) issues.push(`Problemas de acentuação/encoding em: ${portugueseIssues.slice(0, 12).join(', ')}`);

  return {
    passed: issues.length === 0,
    issues,
    checks: {
      headline: title,
      introParagraphs: intro.length,
      sections: sections.length,
      faq: faq.length,
      ctas: ctas.length,
      internalLinks: Array.isArray(internalLinks) ? internalLinks.length : 0
    },
    intent: editorialIntent
  };
};
