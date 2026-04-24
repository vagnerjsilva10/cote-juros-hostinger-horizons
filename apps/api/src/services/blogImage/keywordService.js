const STOPWORDS = new Set([
  'a', 'o', 'os', 'as', 'de', 'da', 'do', 'das', 'dos', 'e', 'em', 'para', 'por', 'com',
  'sem', 'uma', 'um', 'na', 'no', 'nas', 'nos', 'ao', 'aos', 'que', 'como', 'mais', 'menos',
  'sobre', 'antes', 'depois', 'entre', 'vale', 'pena', 'guia', 'completo', 'entenda', 'veja'
]);

const normalize = (value = '') =>
  String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

const tokenize = (...values) =>
  values
    .flatMap((value) => normalize(value).split(/[^a-z0-9]+/))
    .map((item) => item.trim())
    .filter((item) => item.length >= 3 && !STOPWORDS.has(item));

const unique = (items = []) => Array.from(new Set(items.filter(Boolean)));

const INTENT_QUERY_LIBRARY = {
  'vehicle-financing': [
    'car financing',
    'car loan',
    'person with car',
    'vehicle financing',
    'car dealership'
  ],
  'personal-loan': [
    'personal loan',
    'financial planning',
    'person using calculator',
    'loan agreement',
    'money and documents'
  ],
  'debt-negative-name': [
    'debt',
    'financial problem',
    'worried person bills',
    'bills debt',
    'credit score'
  ],
  'credit-card': [
    'credit card payment',
    'person holding credit card',
    'online shopping credit card'
  ],
  'home-financing': [
    'home financing',
    'mortgage',
    'family house',
    'real estate contract'
  ],
  'financial-education': [
    'financial education',
    'family budget',
    'personal finance',
    'person planning finances'
  ]
};

const inferClusterKey = ({ category = '', clusterLabel = '', title = '', tags = [] }) => {
  const haystack = normalize([category, clusterLabel, title, ...(tags || [])].join(' '));
  if (/imovel|casa|habitacional|mortgage|real estate|refinanciamento de imovel/.test(haystack)) return 'home-financing';
  if (/financi|veiculo|entrada|leasing|parcela do carro|carro|fipe|dealership/.test(haystack)) return 'vehicle-financing';
  if (/cart|credito|anuidade|limite|fatura|rotativo/.test(haystack)) return 'credit-card';
  if (/score|cpf|serasa|spc|negativado|nome sujo|divid|renegoci|cheque especial|atras/.test(haystack)) return 'debt-negative-name';
  if (/educ|reserva|orcamento|planejamento|gastos|casal|mei|organiza|decisoes financeiras/.test(haystack)) return 'financial-education';
  return 'personal-loan';
};

const buildPhraseFromTokens = (tokens = [], fallback = '') => {
  const slice = unique(tokens).slice(0, 4);
  if (!slice.length) return fallback;
  return `${slice.join(' ')} brazil financial planning`.trim();
};

export const extractImageSearchKeywords = (article = {}) => {
  const clusterKey = inferClusterKey(article);
  const weightedTokens = tokenize(
    article.title,
    article.h1,
    article.summary,
    article.excerpt,
    article.category,
    article.clusterLabel,
    ...(article.tags || [])
  );

  const firstPhrase = buildPhraseFromTokens(weightedTokens, 'brazilian personal finance planning');
  const keywordPhrases = [
    ...INTENT_QUERY_LIBRARY[clusterKey],
    firstPhrase,
    `${normalize(article.title || article.h1 || '').replace(/[^a-z0-9\s]/g, ' ').trim()} real photo`,
    `${clusterKey.replace(/-/g, ' ')} person finance photo`
  ]
    .map((item) => item.replace(/\s+/g, ' ').trim())
    .filter((item) => item.length >= 8);

  return {
    clusterKey,
    intent: clusterKey,
    keywords: unique(keywordPhrases).slice(0, 6)
  };
};

export const inferImageClusterKey = inferClusterKey;
