const MIN_WIDTH = 1200;
const MIN_HEIGHT = 675;

const normalize = (value = '') =>
  String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

const asText = (image = {}) =>
  normalize([
    image.title,
    image.description,
    image.alt,
    image.query,
    image.provider,
    image.kind,
    image.pageUrl,
    image.downloadUrl
  ].filter(Boolean).join(' '));

const asDescriptiveText = (image = {}) =>
  normalize([
    image.title,
    image.description,
    image.alt,
    image.provider,
    image.kind,
    image.pageUrl,
    image.downloadUrl
  ].filter(Boolean).join(' '));

const hasAny = (text = '', terms = []) => terms.some((term) => text.includes(term));

const BIG_TEXT_TERMS = [
  'banner',
  'poster',
  'flyer',
  'typography',
  'text effect',
  'quote',
  'headline',
  'title',
  'copy space with text'
];

const PLACEHOLDER_TERMS = [
  'placeholder',
  'template',
  'mockup',
  'blank screen',
  'empty screen',
  'abstract',
  'background',
  'wallpaper',
  'vector',
  'illustration',
  'cartoon',
  '3d render',
  'render',
  'clipart',
  'infographic'
];

const OFF_TOPIC_TERMS = [
  'football',
  'soccer',
  'player',
  'players',
  'referee',
  'student cheating',
  'exam',
  'passport',
  'passports',
  'citizen card',
  'id cards',
  'musicians',
  'performance on street'
];

const GENERIC_CHART_TERMS = [
  'chart',
  'graph',
  'growth graph',
  'bar chart',
  'financial chart',
  'analytics dashboard',
  'trading chart',
  'stock market chart',
  'candlestick'
];

const DATED_STYLE_TERMS = [
  'black and white',
  'monochrome',
  'grayscale',
  'vintage',
  'retro',
  'old fashioned',
  'film noir',
  '1950',
  '1960'
];

const REAL_PHOTO_TERMS = [
  'photo',
  'person',
  'people',
  'woman',
  'man',
  'couple',
  'family',
  'hands',
  'home',
  'office',
  'car',
  'house',
  'bank',
  'contract',
  'money',
  'credit card',
  'card',
  'smartphone',
  'phone',
  'laptop',
  'calculator',
  'documents'
];

const LICENSED_PROVIDERS = new Set(['freepik', 'pexels', 'unsplash']);

const allowedSubjectTerms = [
  'person',
  'people',
  'woman',
  'man',
  'couple',
  'family',
  'hands',
  'money',
  'cash',
  'currency',
  'banknote',
  'banknotes',
  'pesos',
  'dollars',
  'euro',
  'credit card',
  'card',
  'smartphone',
  'phone',
  'laptop',
  'contract',
  'document',
  'calculator',
  'car',
  'vehicle',
  'dealership',
  'house',
  'home',
  'mortgage',
  'real estate',
  'bank',
  'office',
  'bills',
  'debt'
];

const getArticleContextTerms = (article = {}) => normalize([
  article.title,
  article.h1,
  article.summary,
  article.excerpt,
  article.category,
  article.clusterLabel,
  ...(article.tags || [])
].filter(Boolean).join(' '));

const getIntentTerms = (intent = '') => {
  if (intent === 'vehicle-financing') return ['car', 'vehicle', 'dealership', 'financing', 'loan'];
  if (intent === 'personal-loan') return ['loan', 'money', 'contract', 'calculator', 'documents', 'finance'];
  if (intent === 'debt-negative-name') return ['debt', 'bills', 'worried', 'credit score', 'documents'];
  if (intent === 'credit-card') return ['credit card', 'card', 'payment', 'shopping', 'bill'];
  if (intent === 'home-financing') return ['home', 'house', 'mortgage', 'real estate', 'contract', 'family'];
  if (intent === 'financial-education') return ['budget', 'financial planning', 'family', 'finance', 'calculator'];
  return ['finance', 'money', 'contract', 'calculator', 'smartphone', 'laptop'];
};

const validateLicense = (image = {}, text = '') => {
  if (!LICENSED_PROVIDERS.has(image.provider)) return false;
  if (image.provider === 'freepik') {
    return Boolean(image.isFree) && String(image.pageUrl || '').includes('/free-photo/') && !hasAny(text, ['premium', 'freepik premium']);
  }
  return Boolean(image.isFree !== false);
};

const validateDimensions = (image = {}) => {
  const width = Number(image.width) || 0;
  const height = Number(image.height) || 0;
  const landscape = width > height;
  const ratio = height ? width / height : 0;
  return width >= MIN_WIDTH && height >= MIN_HEIGHT && landscape && ratio >= 1.4 && ratio <= 2.2;
};

const validateContext = ({ image, article = {}, intent = '' }) => {
  const text = asText(image);
  const descriptiveText = asDescriptiveText(image);
  const articleText = getArticleContextTerms(article);
  const intentTerms = getIntentTerms(intent);
  const hasSubject = hasAny(descriptiveText, allowedSubjectTerms);
  const hasIntentMatch = hasAny(descriptiveText, intentTerms);
  const articleTokens = articleText.split(/[^a-z0-9]+/).filter((term) => term.length >= 4);
  const overlap = articleTokens.filter((term) => descriptiveText.includes(term)).length;
  return hasSubject && (hasIntentMatch || overlap >= 1);
};

export const validateBlogImage = (image = {}, { article = {}, intent = '' } = {}) => {
  const text = asText(image);
  const checks = {
    isRealPhoto: image.kind === 'photo' && hasAny(text, REAL_PHOTO_TERMS) && !hasAny(text, ['vector', 'illustration', 'cartoon', 'render']),
    hasNoBigTextOverlay: !hasAny(text, BIG_TEXT_TERMS),
    isContextual: validateContext({ image, article, intent }),
    isNotPlaceholder: !hasAny(text, PLACEHOLDER_TERMS),
    isNotOffTopic: !hasAny(text, OFF_TOPIC_TERMS),
    isNotGenericChart: !hasAny(text, GENERIC_CHART_TERMS),
    isNotDatedStyle: !hasAny(text, DATED_STYLE_TERMS),
    hasValidLicense: validateLicense(image, text),
    widthMin: MIN_WIDTH,
    heightMin: MIN_HEIGHT,
    hasMinimumSize: validateDimensions(image)
  };

  const errors = Object.entries(checks)
    .filter(([key, value]) => typeof value === 'boolean' && !value)
    .map(([key]) => key);

  return {
    ...checks,
    passed: errors.length === 0,
    errors
  };
};

export const isTemplateOrPlaceholderImage = (value = '') => {
  const image = String(value || '').trim();
  const normalized = normalize(image);
  return !image
    || image.startsWith('data:image/svg')
    || normalized.includes('blog cote juros')
    || normalized.includes('guia editorial cote juros')
    || normalized.includes('/images/blog/default-cover')
    || normalized.includes('/images/blog/fallback-')
    || normalized.includes('/assets/blog/fallbacks/')
    || normalized.includes('/images/blog/variants/')
    || normalized.endsWith('.svg');
};

export const BLOG_IMAGE_MINIMUMS = {
  width: MIN_WIDTH,
  height: MIN_HEIGHT
};
