const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

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
    .filter((item) => item.length >= 3);

const unique = (items = []) => Array.from(new Set(items.filter(Boolean)));

const PERSON_TERMS = ['person', 'people', 'woman', 'man', 'couple', 'family', 'adult', 'worker', 'businesswoman', 'businessman'];
const FINANCE_TERMS = ['finance', 'loan', 'credit', 'budget', 'money', 'bank', 'card', 'contract', 'calculator', 'smartphone', 'financial'];
const BAD_TERMS = [
  'cartoon',
  'kid',
  'child',
  'children',
  'vector',
  'illustration',
  'clipart',
  'colorful',
  'festival',
  'black and white',
  'monochrome',
  'grayscale',
  'vintage',
  'retro',
  'old fashioned',
  'film noir'
];
const MODERN_TERMS = ['modern', 'home', 'office', 'laptop', 'smartphone', 'clean', 'minimal', 'professional', 'realistic'];

const scoreKeywordAlignment = (candidateTerms, targetTerms) => {
  const matches = targetTerms.filter((term) => candidateTerms.includes(term)).length;
  return clamp(10 + matches * 3, 0, 30);
};

const scoreRealPeople = (candidateText) => {
  let score = 8;
  if (PERSON_TERMS.some((term) => candidateText.includes(term))) score += 12;
  if (MODERN_TERMS.some((term) => candidateText.includes(term))) score += 5;
  if (BAD_TERMS.some((term) => candidateText.includes(term))) score -= 14;
  return clamp(score, 0, 20);
};

const scoreFinancialContext = (candidateText) => {
  let score = 6;
  if (FINANCE_TERMS.some((term) => candidateText.includes(term))) score += 10;
  if (/phone|smartphone|contract|calculator|credit card|laptop/.test(candidateText)) score += 4;
  return clamp(score, 0, 20);
};

const scoreVisualQuality = (candidate = {}) => {
  const width = Number(candidate.width) || 0;
  const height = Number(candidate.height) || 0;
  const minSide = Math.min(width, height);
  let score = 8;
  if (minSide >= 900) score += 8;
  else if (minSide >= 600) score += 5;
  if ((candidate.provider || '') === 'freepik') score += 3;
  return clamp(score, 0, 15);
};

const scoreBackgroundAndStyle = (candidateText) => {
  let score = 6;
  if (/clean|neutral|minimal|modern|professional|natural light/.test(candidateText)) score += 5;
  if (/vector|illustration|cartoon|bright colors|black and white|monochrome|grayscale|vintage|retro|old fashioned|film noir/.test(candidateText)) score -= 10;
  return clamp(score, 0, 15);
};

const scoreProviderPriority = (provider = '') => {
  if (provider === 'pexels') return 10;
  if (provider === 'unsplash') return 8;
  if (provider === 'freepik') return 3;
  return 0;
};

export const rankBlogImageCandidates = ({ article = {}, candidates = [] }) => {
  const targetTerms = unique(tokenize(
    article.title,
    article.h1,
    article.summary,
    article.excerpt,
    article.category,
    article.clusterLabel,
    ...(article.tags || [])
  ));

  return (Array.isArray(candidates) ? candidates : [])
    .map((candidate) => {
      const candidateText = normalize([
        candidate.title,
        candidate.description,
        candidate.query,
        candidate.provider,
        candidate.kind
      ].join(' '));
      const candidateTerms = unique(tokenize(candidateText));

      const breakdown = {
        keywordAlignment: scoreKeywordAlignment(candidateTerms, targetTerms),
        realPeople: scoreRealPeople(candidateText),
        financialContext: scoreFinancialContext(candidateText),
        visualQuality: scoreVisualQuality(candidate),
        cleanStyle: scoreBackgroundAndStyle(candidateText),
        providerPriority: scoreProviderPriority(candidate.provider)
      };

      return {
        ...candidate,
        score: Object.values(breakdown).reduce((sum, value) => sum + value, 0),
        breakdown
      };
    })
    .sort((a, b) => b.score - a.score);
};
