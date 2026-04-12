const normalizeText = (value = '') =>
  String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

const slugify = (value = '') =>
  normalizeText(value)
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

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

const hashString = (value = '') => {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
};

const imageThemeByCategory = (category = '') => {
  const key = normalizeText(category);
  if (key.includes('cart')) return ['#0ea5e9', '#e0f2fe', 'Cartoes e limite'];
  if (key.includes('emprest')) return ['#16a34a', '#dcfce7', 'Credito e emprestimos'];
  if (key.includes('score')) return ['#7c3aed', '#ede9fe', 'Score de credito'];
  if (key.includes('financi')) return ['#f59e0b', '#fef3c7', 'Financiamento inteligente'];
  if (key.includes('divid')) return ['#ef4444', '#fee2e2', 'Renegociacao de dividas'];
  return ['#2563eb', '#dbeafe', 'Planejamento financeiro'];
};

export const normalizeArticleSlug = (article = {}) =>
  slugify(article.slug || article.title || article.id || 'artigo');

export const getArticleSummary = (article = {}) =>
  article.summary || article.metaDescription || article.excerpt || '';

export const getEditorialTitle = (article = {}) => {
  const originalTitle = String(article.title || '').trim();
  if (!originalTitle) return '';

  const slug = normalizeArticleSlug(article);

  const directOverrides = {
    'educacao-financeira-para-quem-ganha-pouco': 'Como organizar suas finanças mesmo ganhando pouco',
    'educacao-financeira-para-quem-quer-financiar-imovel': 'Como financiar um imóvel sem comprometer sua renda'
  };

  if (directOverrides[slug]) return directOverrides[slug];

  const normalized = normalizeText(originalTitle);

  if (normalized.startsWith('educacao financeira para ')) {
    const audience = originalTitle.slice('Educação financeira para '.length).replace(/:.*/g, '').trim();
    if (audience) return `Como melhorar sua vida financeira: guia prático para ${audience}`;
  }

  if (normalized.startsWith('organizacao financeira para ')) {
    const audience = originalTitle.slice('Organização financeira para '.length).replace(/:.*/g, '').trim();
    if (audience) return `Organização financeira para ${audience}: passo a passo para sair do aperto`;
  }

  return originalTitle;
};

const buildGeneratedArticleImage = (article = {}) => {
  const slug = normalizeArticleSlug(article);
  const title = getEditorialTitle(article);
  const [primaryColor, softColor, label] = imageThemeByCategory(article.category || article.clusterLabel);
  const chartSeed = hashString(slug || title || 'cote-juros');
  const a = 36 + (chartSeed % 48);
  const b = 80 + (Math.floor(chartSeed / 13) % 54);
  const c = 128 + (Math.floor(chartSeed / 41) % 60);

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="720" viewBox="0 0 1200 720" role="img" aria-label="${title}">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${softColor}" />
          <stop offset="100%" stop-color="#ffffff" />
        </linearGradient>
      </defs>
      <rect width="1200" height="720" fill="url(#bg)" />
      <rect x="62" y="70" width="1076" height="580" rx="32" fill="rgba(255,255,255,0.85)" />
      <rect x="102" y="106" width="290" height="40" rx="20" fill="${primaryColor}" opacity="0.15" />
      <text x="128" y="132" font-family="Manrope, Inter, Arial, sans-serif" font-size="22" font-weight="700" fill="${primaryColor}">${label}</text>
      <text x="102" y="216" font-family="Space Grotesk, Manrope, Arial, sans-serif" font-size="56" font-weight="700" fill="#0f172a">${title.slice(0, 58)}${title.length > 58 ? '...' : ''}</text>
      <rect x="742" y="178" width="320" height="220" rx="24" fill="#ffffff" />
      <path d="M786 ${a + 146} C842 ${b + 92}, 908 ${c + 50}, 1020 250" fill="none" stroke="${primaryColor}" stroke-width="10" stroke-linecap="round" />
      <rect x="798" y="${a + 218}" width="24" height="58" rx="10" fill="${primaryColor}" opacity="0.25" />
      <rect x="846" y="${b + 164}" width="24" height="112" rx="10" fill="${primaryColor}" opacity="0.45" />
      <rect x="894" y="${c + 108}" width="24" height="168" rx="10" fill="${primaryColor}" opacity="0.7" />
      <rect x="102" y="568" width="336" height="18" rx="9" fill="${primaryColor}" opacity="0.16" />
      <rect x="102" y="602" width="288" height="18" rx="9" fill="#0f172a" opacity="0.08" />
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};

export const getArticleImage = (article = {}, fallbackImage = '') => {
  const image = String(article.image || '').trim();
  const lowerImage = image.toLowerCase();

  if (image && !lowerImage.includes('ui-avatars.com') && !lowerImage.includes('photo-1554224155-1696413565d3')) {
    return image;
  }

  return buildGeneratedArticleImage(article) || fallbackImage;
};

export const getArticleCategoryKey = (article = {}) => {
  const category = typeof article.category === 'string' ? article.category : article.category?.name || '';
  return normalizeText(category);
};

export const getArticleParagraphs = (article = {}) => {
  if (Array.isArray(article.intro) && article.intro.length) return article.intro;
  if (typeof article.content === 'string') {
    return article.content
      .split(/\n+/)
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
};

export const buildArticleToc = (article = {}) => {
  const items = [];

  if (Array.isArray(article.sections)) {
    article.sections.forEach((section, index) => {
      if (!section?.heading) return;
      items.push({
        id: `secao-${index + 1}`,
        label: section.heading
      });
    });
  }

  if (Array.isArray(article.faq) && article.faq.length) {
    items.push({ id: 'faq', label: 'Perguntas frequentes' });
  }

  if (Array.isArray(article.conclusion) && article.conclusion.length) {
    items.push({ id: 'conclusao', label: 'Conclusão' });
  }

  return items;
};

export const isArticleSlugMatch = (article = {}, slug = '') => {
  const articleSlug = normalizeArticleSlug(article);
  const requestedSlug = slugify(slug);
  if (!articleSlug || !requestedSlug) return false;

  const articleVariants = buildSlugVariants(articleSlug);
  const requestedVariants = buildSlugVariants(requestedSlug);

  return articleVariants.some((variant) => requestedVariants.includes(variant));
};

export const findArticleBySlug = (articles = [], slug = '') =>
  articles.find((article) => isArticleSlugMatch(article, slug)) || null;

