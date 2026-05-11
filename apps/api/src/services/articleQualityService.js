import {
  findPortugueseEncodingIssues,
  repairPortugueseInObject,
  repairPortugueseText
} from './portugueseTextService.js';

const MAX_HEADLINE_LENGTH = 70;
const MIN_INTERNAL_LINKS = 3;
const GENERIC_TERMS = [
  'clareza',
  'jornada',
  'contexto',
  'organizacao',
  'organização',
  'momento financeiro',
  'decidir com seguranca',
  'decidir com segurança',
  'sem pressa',
  'tomar decisões melhores',
  'organizar sua jornada',
  'contextualizar',
  'menos fricção',
  'momento ideal',
  'solução completa'
];
const CLICKBAIT_PATTERNS = /segredo|imperdivel|garantido|aprovacao garantida|aprovação garantida|100%|nunca te contaram|chocante|urgente/i;
const AI_CONTENT_PATTERNS = /neste guia voce encontra|a ideia deste guia|com mais clareza|jornada financeira|decisão mais consciente|solução completa|contexto financeiro|sem complicação|de forma simples e prática/gi;
const TEMPLATE_HEADING_PATTERNS = /ponto essencial|lista rápida|checklist final|o que observar primeiro|alternativas antes de seguir|riscos comuns em/i;
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

const limitParagraph = (value = '') => trimToSentence(value, 620);

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
    .slice(0, 5),
  table: section.table && typeof section.table === 'object'
    ? {
        caption: compactText(section.table.caption || ''),
        columns: (Array.isArray(section.table.columns) ? section.table.columns : []).map(compactText).filter(Boolean).slice(0, 6),
        rows: (Array.isArray(section.table.rows) ? section.table.rows : [])
          .map((row) => (Array.isArray(row) ? row : []))
          .map((row) => row.map((cell) => trimToSentence(cell, 220)).filter(Boolean))
          .filter((row) => row.length >= 2)
          .slice(0, 12)
      }
    : null
});

const countPattern = (value = '', pattern) => (String(value || '').match(pattern) || []).length;

const calculateQualityScore = ({
  article = {},
  internalLinks = [],
  plain = '',
  keyword = '',
  editorialIntent = ''
} = {}) => {
  const sections = Array.isArray(article.sections) ? article.sections : [];
  const faq = Array.isArray(article.faq) ? article.faq : [];
  const serp = article.serpIntelligence || {};
  const normalizedPlain = normalizeKeyword(plain);
  const wordCount = plain.split(/\s+/).filter(Boolean).length;
  const numberSignals = countPattern(plain, /R\$\s?\d|[0-9]+%|\d+\s*(mes|meses|dias|anos)|CET|IOF/gi);
  const genericHits = GENERIC_TERMS.reduce((total, term) => total + countPattern(normalizedPlain, new RegExp(normalizeKeyword(term), 'g')), 0);
  const aiPatternHits = countPattern(plain, AI_CONTENT_PATTERNS);
  const tableCount = sections.filter((section) => section.table?.rows?.length >= 2).length;
  const comparisonSignals = countPattern(normalizedPlain, /compar|modalidade|alternativa|garantia|consignado|fgts|renegoci|score|cpf|banco central|gov\.br|serasa|febraban/gi);
  const paragraphLengths = sections.flatMap((section) => section.paragraphs || []).map((paragraph) => paragraph.split(/\s+/).filter(Boolean).length);
  const repeatedOpenings = new Map();
  for (const paragraph of sections.flatMap((section) => section.paragraphs || [])) {
    const opening = normalizeKeyword(paragraph).split(/\s+/).slice(0, 4).join(' ');
    if (opening) repeatedOpenings.set(opening, (repeatedOpenings.get(opening) || 0) + 1);
  }
  const repeatedOpeningCount = [...repeatedOpenings.values()].filter((count) => count >= 2).length;
  const templateHeadingHits = sections.filter((section) => TEMPLATE_HEADING_PATTERNS.test(section.heading || '')).length;
  TEMPLATE_HEADING_PATTERNS.lastIndex = 0;
  const mustCover = Array.isArray(serp.mustCoverTopics) ? serp.mustCoverTopics : [];
  const coveredTopics = mustCover.filter((topic) => includesKeyword(plain, topic) || normalizeKeyword(topic).split(/\s+/).some((token) => token.length > 4 && normalizedPlain.includes(token)));
  const hasRiskLanguage = /risco|atraso|inadimpl|cuidado|cautela|cen[aá]rio negativo|endivid/i.test(normalizedPlain);
  const hasOfficialSource = Array.isArray(article.externalLinks)
    ? article.externalLinks.some((link) => /bcb|banco central|gov\.br|serasa|febraban|cvm/i.test(`${link.label || ''} ${link.url || ''}`))
    : /banco central|gov\.br|serasa|febraban|cvm/i.test(plain);

  const intentMatch = Math.min(100, 45
    + (includesKeyword(article.title || article.h1 || '', keyword) ? 15 : 0)
    + (includesKeyword(article.intro?.[0] || '', keyword) ? 15 : 0)
    + (serp.searchIntent && serp.searchIntent !== 'informacional' ? 10 : 5)
    + (coveredTopics.length ? 15 : 0));
  const factualDepth = Math.min(100, 10 + Math.min(numberSignals, 14) * 4 + comparisonSignals * 1.2 + tableCount * 8 + (hasOfficialSource ? 14 : 0) + (hasRiskLanguage ? 10 : 0));
  const expertAuthority = Math.min(100, 15 + tableCount * 10 + (hasOfficialSource ? 18 : 0) + Math.min(comparisonSignals, 20) * 2 + (wordCount >= 1800 ? 12 : 0));
  const editorialDepth = Math.min(100, 10 + Math.min(sections.length, 12) * 5 + Math.min(wordCount / 30, 70));
  const originality = Math.max(0, 100 - genericHits * 6 - aiPatternHits * 7 - templateHeadingHits * 5 - repeatedOpeningCount * 8);
  const practicalValue = Math.min(100, 15
    + (article.example ? 8 : 0)
    + tableCount * 10
    + (sections.some((section) => /checklist|passo|lista|tabela|compar/i.test(normalizeKeyword(section.heading))) ? 12 : 0)
    + Math.min((article.alternatives || []).length, 4) * 5
    + (faq.length >= 4 ? 6 : 0)
    + Math.min(numberSignals, 10) * 2);
  const humanReadability = Math.max(0, Math.min(100, 92
    - genericHits * 4
    - aiPatternHits * 8
    - repeatedOpeningCount * 10
    - (paragraphLengths.filter((length) => length > 95).length * 3)
    + (paragraphLengths.some((length) => length >= 25 && length <= 55) ? 8 : 0)));
  const serpCompetitiveness = Math.min(100, 20
    + (coveredTopics.length / Math.max(1, mustCover.length)) * 35
    + tableCount * 8
    + (wordCount >= 2200 ? 18 : wordCount >= 1500 ? 10 : 0)
    + (faq.length >= 5 ? 7 : 0));
  const antiTemplate = Math.max(0, 100 - templateHeadingHits * 9 - repeatedOpeningCount * 10 - aiPatternHits * 8);
  const seoStructure = Math.min(100, 15 + Math.min(sections.length, 12) * 5 + Math.min(faq.length, 6) * 4 + tableCount * 8 + (article.featuredSnippet ? 8 : 0));
  const internalLinkScore = Math.min(100, (Array.isArray(internalLinks) ? internalLinks.length : 0) * 25);
  const riskScore = Math.min(100, (CLICKBAIT_PATTERNS.test(article.title || '') ? 40 : 0) + (!hasRiskLanguage ? 25 : 0) + (!hasOfficialSource && editorialIntent !== 'guide' ? 15 : 0));
  const weighted = Math.round(
    intentMatch * 0.1
    + factualDepth * 0.15
    + expertAuthority * 0.13
    + editorialDepth * 0.13
    + originality * 0.13
    + practicalValue * 0.14
    + humanReadability * 0.1
    + serpCompetitiveness * 0.08
    + antiTemplate * 0.08
    + seoStructure * 0.04
    + internalLinkScore * 0.02
    - riskScore * 0.15
  );

  const cappedTotal = Math.min(
    weighted,
    originality + 8,
    humanReadability + 8,
    antiTemplate + 8,
    factualDepth + 6
  );

  return {
    total: Math.max(0, Math.min(100, Math.round(cappedTotal))),
    intent_match_score: intentMatch,
    factual_depth_score: factualDepth,
    expert_authority_score: Math.round(expertAuthority),
    editorial_depth_score: Math.round(editorialDepth),
    originality_score: originality,
    practical_value_score: practicalValue,
    human_readability_score: Math.round(humanReadability),
    serp_competitiveness_score: Math.round(serpCompetitiveness),
    anti_template_score: Math.round(antiTemplate),
    seo_structure_score: seoStructure,
    internal_link_score: internalLinkScore,
    risk_score: riskScore,
    signals: {
      wordCount,
      numberSignals,
      genericHits,
      aiPatternHits,
      tableCount,
      comparisonSignals,
      repeatedOpeningCount,
      templateHeadingHits,
      coveredSerpTopics: coveredTopics.length,
      requiredSerpTopics: mustCover.length,
      hasOfficialSource,
      hasRiskLanguage
    }
  };
};

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
  sections = ensureKeywordHeadings(sections.slice(0, cleanArticle.editorialPipeline ? 12 : 8), keyword);

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
  article = repairPortugueseInObject(article);
  internalLinks = repairPortugueseInObject(internalLinks);
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
    ...((article.expertInsights || [])),
    ...((article.retentionHooks || [])),
    ...sections.flatMap((section) => [
      section.heading,
      section.subheading,
      ...(section.paragraphs || []),
      ...(section.bullets || []),
      section.table?.caption,
      ...(section.table?.columns || []),
      ...((section.table?.rows || []).flat())
    ]),
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

  const qualityScore = calculateQualityScore({ article, internalLinks, plain, keyword, editorialIntent });
  const hasSerpIntelligence = article.serpIntelligence && article.serpIntelligence.ok !== false;

  if (article.editorialPipeline && qualityScore.signals.wordCount < 1800) issues.push('Artigo premium abaixo de 1800 palavras');
  if (CLICKBAIT_PATTERNS.test(title)) issues.push('Titulo com risco de clickbait ou promessa excessiva');
  if (qualityScore.signals.genericHits >= 6) issues.push('Texto com excesso de termos genericos e pouco especificos');
  if (qualityScore.signals.aiPatternHits >= 3) issues.push('Sinais de AI SEO content acima do aceitavel');
  if (qualityScore.signals.repeatedOpeningCount >= 3) issues.push('Repeticao estrutural em aberturas de paragrafos');
  if (qualityScore.signals.templateHeadingHits >= 3) issues.push('Headings com cara de template editorial');
  if (qualityScore.factual_depth_score < 70) issues.push('Profundidade factual insuficiente: faltam numeros, fonte oficial, tabela ou risco financeiro');
  if (qualityScore.expert_authority_score < 65) issues.push('Autoridade especializada insuficiente para YMYL financeiro');
  if (qualityScore.editorial_depth_score < 65) issues.push('Profundidade editorial insuficiente para keyword competitiva');
  if (qualityScore.practical_value_score < 70) issues.push('Valor pratico insuficiente: faltam exemplos, checklist, tabela ou passos acionaveis');
  if (qualityScore.human_readability_score < 70) issues.push('Leitura pouco humana ou repetitiva');
  if (qualityScore.anti_template_score < 70) issues.push('Score anti-template insuficiente');
  if (qualityScore.originality_score < 65) issues.push('Originalidade insuficiente ou estrutura programatica demais');
  if (article.editorialPipeline && qualityScore.signals.tableCount < 2) issues.push('Artigo premium precisa de pelo menos 2 tabelas reais');
  if (hasSerpIntelligence && qualityScore.signals.requiredSerpTopics > 0 && qualityScore.signals.coveredSerpTopics < 2) {
    issues.push('Intencao/lacunas da SERP pouco refletidas no artigo');
  }
  if (qualityScore.risk_score >= 45) issues.push('Risco editorial alto: cautela financeira, fontes ou titulo precisam revisao');

  return {
    passed: issues.length === 0,
    issues,
    checks: {
      headline: title,
      introParagraphs: intro.length,
      sections: sections.length,
      faq: faq.length,
      ctas: ctas.length,
      internalLinks: Array.isArray(internalLinks) ? internalLinks.length : 0,
      qualityScore
    },
    qualityScore,
    intent: editorialIntent
  };
};
