import { normalizeMojibake } from '@/lib/textEncoding.js';
import { resolveArticleImageAlt, resolveArticleImageSources } from '@/lib/content/blogImages.js';

const normalizeText = (value = '') =>
  String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

const sanitizeInlineText = (value = '') => normalizeMojibake(String(value || '')).replace(/\s+/g, ' ').trim();
const sanitizeRichText = (value = '') => normalizeMojibake(String(value || '')).trim();

const sanitizeStringArray = (value) => {
  if (Array.isArray(value)) {
    return value
      .map((item) => sanitizeInlineText(item))
      .filter(Boolean);
  }

  if (typeof value === 'string') {
    return value
      .split(/[\n,|]/)
      .map((item) => sanitizeInlineText(item))
      .filter(Boolean);
  }

  return [];
};

const slugify = (value = '') =>
  normalizeText(value)
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

const sanitizeDate = (value, fallback = new Date().toISOString()) => {
  const date = new Date(value || fallback);
  return Number.isNaN(date.getTime()) ? fallback : date.toISOString();
};

const estimateReadTime = (article = {}) => {
  const source = [
    sanitizeRichText(article.content),
    ...sanitizeStringArray(article.intro),
    ...sanitizeStringArray(article.conclusion),
    ...(Array.isArray(article.sections)
      ? article.sections.flatMap((section) => [...sanitizeStringArray(section?.paragraphs), ...sanitizeStringArray(section?.bullets)])
      : []),
    ...sanitizeStringArray(article.faq?.flatMap?.((item) => [item?.question, item?.answer]) || [])
  ]
    .join(' ')
    .trim();

  const wordCount = source ? source.split(/\s+/).length : 0;
  return Math.max(4, Math.round(wordCount / 190) || 6);
};

const normalizeCategoryLabel = (value) => {
  const label = sanitizeInlineText(typeof value === 'string' ? value : value?.name || value?.label || '');
  return label || 'Finanças pessoais';
};

const normalizeInternalLinks = (links) => {
  if (!Array.isArray(links)) return [];

  return links
    .map((item) => ({
      path: sanitizeInlineText(item?.path || item?.href || ''),
      title: sanitizeInlineText(item?.title || item?.label || item?.anchor || ''),
      anchor: sanitizeInlineText(item?.anchor || item?.title || item?.label || '')
    }))
    .filter((item) => item.path && item.title);
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

const normalizeSections = (sections) => {
  if (!Array.isArray(sections)) return [];

  return sections
    .map((section) => ({
      heading: sanitizeInlineText(section?.heading || section?.title || ''),
      paragraphs: sanitizeStringArray(section?.paragraphs),
      bullets: sanitizeStringArray(section?.bullets)
    }))
    .filter((section) => section.heading || section.paragraphs.length || section.bullets.length);
};

export const normalizeArticleSlug = (article = {}) =>
  slugify(article.slug || article.title || article.h1 || article.id || 'artigo');

export const normalizeArticleData = (article = {}, options = {}) => {
  const nowIso = options.nowIso || new Date().toISOString();
  const title = sanitizeInlineText(article.title || article.h1 || article.seoTitle || article.metaTitle || 'Artigo Cote Juros');
  const slug = normalizeArticleSlug({ ...article, title });
  const excerpt = sanitizeInlineText(article.excerpt || article.summary || article.metaDescription || '');
  const category = normalizeCategoryLabel(article.category || article.categoryName || article.clusterLabel);
  const intro = sanitizeStringArray(article.intro);
  const sections = normalizeSections(article.sections);
  const faq = normalizeFaq(article.faq || article.faqSchema);
  const conclusion = sanitizeStringArray(article.conclusion);
  const content = sanitizeRichText(article.content || '');
  const tags = sanitizeStringArray(article.tags || article.keywords);
  const coverImage = sanitizeInlineText(article.coverImage || article.image || article.imageUrl || article.featuredImage || '');
  const coverImageAlt = sanitizeInlineText(article.coverImageAlt || article.imageAlt || article.alt || '');
  const publishedAt = sanitizeDate(article.publishedAt || article.publishDate || article.createdAt, nowIso);
  const updatedAt = sanitizeDate(article.updatedAt || article.modifiedAt || publishedAt, publishedAt);
  const author = sanitizeInlineText(article.author || article.authorName || 'Equipe Cote Juros');
  const readTime = Number.isFinite(Number(article.readTime)) && Number(article.readTime) > 0 ? Number(article.readTime) : estimateReadTime(article);

  const normalized = {
    ...article,
    id: sanitizeInlineText(article.id || `article-${slug}`),
    title,
    slug,
    h1: sanitizeInlineText(article.h1 || title),
    excerpt,
    summary: excerpt,
    seoTitle: sanitizeInlineText(article.seoTitle || article.metaTitle || `${title} | Blog Cote Juros`),
    metaTitle: sanitizeInlineText(article.metaTitle || ''),
    metaDescription:
      sanitizeInlineText(article.metaDescription || excerpt) ||
      `Leia ${title} no blog da Cote Juros e compare melhor suas decisões financeiras.`,
    category,
    categoryKey: normalizeText(category),
    author,
    tags,
    keywords: tags,
    coverImage,
    coverImageAlt: coverImageAlt || `Capa editorial do artigo ${title}`,
    image: coverImage,
    imageAlt: coverImageAlt || `Capa editorial do artigo ${title}`,
    publishedAt,
    publishDate: publishedAt,
    updatedAt,
    readTime,
    intro,
    sections,
    faq,
    conclusion,
    content,
    canonicalUrl: sanitizeInlineText(article.canonicalUrl || ''),
    internalLinks: normalizeInternalLinks(article.internalLinks),
    status: sanitizeInlineText(article.status || 'published') || 'published'
  };

  if (!normalized.coverImage && import.meta.env.DEV) {
    console.warn('[blog-article-normalizer] artigo sem imagem explícita, usando fallback', normalized.slug);
  }

  return normalized;
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
  const normalizedArticle = normalizeArticleData(article);
  const originalTitle = normalizedArticle.title;
  if (!originalTitle) return '';

  const slug = normalizedArticle.slug;

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

export const getArticleImage = (article = {}) => resolveArticleImageSources(normalizeArticleData(article)).primary;
export const getArticleImageCandidates = (article = {}) => resolveArticleImageSources(normalizeArticleData(article));
export const getArticleImageAlt = (article = {}) => resolveArticleImageAlt(normalizeArticleData(article));

export const getArticleCategoryKey = (article = {}) => normalizeArticleData(article).categoryKey;

export const getArticleParagraphs = (article = {}) => {
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
  const normalizedArticle = normalizeArticleData(article);
  const items = [];

  normalizedArticle.sections.forEach((section, index) => {
    if (!section.heading) return;
    items.push({
      id: `secao-${index + 1}`,
      label: section.heading
    });
  });

  if (normalizedArticle.faq.length) {
    items.push({ id: 'faq', label: 'Perguntas frequentes' });
  }

  if (normalizedArticle.conclusion.length) {
    items.push({ id: 'conclusao', label: 'Conclusão' });
  }

  return items;
};

export const isArticleSlugMatch = (article = {}, slug = '') => {
  const articleSlug = normalizeArticleSlug(normalizeArticleData(article));
  const requestedSlug = slugify(slug);
  if (!articleSlug || !requestedSlug) return false;

  const articleVariants = buildSlugVariants(articleSlug);
  const requestedVariants = buildSlugVariants(requestedSlug);

  return articleVariants.some((variant) => requestedVariants.includes(variant));
};

export const findArticleBySlug = (articles = [], slug = '') =>
  articles.map(normalizeArticleData).find((article) => isArticleSlugMatch(article, slug)) || null;
