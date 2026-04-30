import { normalizeMojibake } from '@/lib/textEncoding.js';
import { resolveArticleImageAlt, resolveArticleImageSources } from '@/lib/content/blogImages.js';
import { BLOG_EDITORIAL_OVERRIDES, getBlogEditorialPriority } from '@/data/blogEditorialOverrides.js';

const ROUTE_LABELS = {
  '/educacao-financeira': 'Educacao Financeira',
  '/diagnostico-financeiro': 'Diagnostico Financeiro',
  '/cote-finance-ai': 'Cote Finance AI',
  '/emprestimos': 'Emprestimos',
  '/cartoes': 'Cartoes',
  '/financiamentos': 'Financiamentos',
  '/ferramentas': 'Ferramentas',
  '/blog': 'Blog Cote Juros'
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

const isObjectRecord = (value) => Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const extractTextValue = (value = '') => {
  if (isObjectRecord(value)) {
    return value.rendered || value.name || value.label || value.title || value.slug || value.value || '';
  }

  return value;
};

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

const stripHtmlArtifacts = (value = '') =>
  String(value || '')
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

const sanitizeInlineText = (value = '') =>
  normalizeMojibake(stripHtmlArtifacts(extractTextValue(value) || '')).replace(/\s+/g, ' ').trim();

const sanitizeRichText = (value = '') =>
  normalizeMojibake(stripHtmlArtifacts(extractTextValue(value) || '')).trim();

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

const sanitizeDate = (value) => {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString();
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

  return startCase(normalized.split('/').pop()?.replace(/-/g, ' ') || '');
};

const isSlugLikeLabel = (value = '') =>
  /^[a-z0-9/-]+$/i.test(String(value || '').trim()) || !/[A-ZÀ-Ý]/.test(String(value || '').trim());

const normalizeSectionHeading = (heading, title) => {
  const clean = sanitizeInlineText(heading);
  if (!clean) return '';

  const replacements = new Map([
    ['o que comparar antes de seguir', 'O que observar antes de tomar uma decisao'],
    ['como analisar com mais seguranca', 'Como analisar com mais seguranca e menos ruido'],
    ['erros que costumam sair caro', 'Erros que mais atrapalham no dia a dia']
  ]);

  return replacements.get(normalizeText(clean)) || clean || title;
};

const normalizeSections = (sections, title) => {
  if (!Array.isArray(sections)) return [];

  return sections
    .map((section) => ({
      heading: normalizeSectionHeading(section?.heading || section?.title || '', title),
      paragraphs: sanitizeStringArray(section?.paragraphs),
      bullets: sanitizeStringArray(section?.bullets)
        .map((bullet) => {
          const capitalized = bullet ? bullet.charAt(0).toUpperCase() + bullet.slice(1) : '';
          return /[.!?;:]$/.test(capitalized) ? capitalized : `${capitalized}.`;
        })
        .filter(Boolean)
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

const normalizeQuestionBlocks = (items) => {
  if (!Array.isArray(items)) return [];

  return items
    .map((item) => ({
      question: sanitizeInlineText(item?.question || ''),
      answer: sanitizeInlineText(item?.answer || '')
    }))
    .filter((item) => item.question && item.answer);
};

const normalizeCtas = (items) => {
  if (!Array.isArray(items)) return [];

  return items
    .map((item) => ({
      position: sanitizeInlineText(item?.position || ''),
      title: sanitizeInlineText(item?.title || ''),
      description: sanitizeInlineText(item?.description || ''),
      to: sanitizeInlineText(item?.to || item?.href || ''),
      label: sanitizeInlineText(item?.label || '')
    }))
    .filter((item) => item.title && item.to && item.label);
};

const normalizeInternalLinks = (links) => {
  if (!Array.isArray(links)) return [];

  return links
    .map((item) => {
      const path = sanitizeInlineText(item?.path || item?.href || '');
      const routeLabel = prettifySlugLabel(path);
      const rawTitle = sanitizeInlineText(item?.title || item?.label || item?.anchor || '');
      const rawAnchor = sanitizeInlineText(item?.anchor || item?.title || item?.label || '');
      const isKnownRouteLink = Boolean(ROUTE_LABELS[path]);
      const titleLooksGenerated =
        !rawTitle
        || isSlugLikeLabel(rawTitle)
        || (routeLabel && normalizeText(rawTitle) === normalizeText(routeLabel));
      const title = isKnownRouteLink ? routeLabel : titleLooksGenerated ? routeLabel || rawTitle : rawTitle;
      const anchorLooksGenerated =
        !rawAnchor
        || isSlugLikeLabel(rawAnchor)
        || (title && normalizeText(rawAnchor) === normalizeText(title));
      const anchor = isKnownRouteLink ? title : anchorLooksGenerated ? title || routeLabel || rawAnchor : rawAnchor;

      return {
        path,
        title: normalizeMojibake(title),
        anchor: normalizeMojibake(anchor || title)
      };
    })
    .filter((item) => item.path && item.title);
};

const normalizeExternalLinks = (links) => {
  if (!Array.isArray(links)) return [];

  return links
    .map((item) => ({
      label: sanitizeInlineText(item?.label || item?.title || ''),
      url: sanitizeInlineText(item?.url || item?.href || '')
    }))
    .filter((item) => item.label && item.url);
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
  return Math.max(1, Math.round(wordCount / 190) || 0);
};

export const normalizeArticleSlug = (article = {}) =>
  slugify(isObjectRecord(article) ? article.slug || article.title || article.h1 || article.id || '' : '');

export const normalizeArticleData = (article = {}) => {
  const baseSource = isObjectRecord(article) ? article : {};
  const rawSlug = slugify(baseSource.slug || baseSource.title || baseSource.h1 || baseSource.id || '');
  const source = rawSlug && BLOG_EDITORIAL_OVERRIDES[rawSlug]
    ? { ...baseSource, ...BLOG_EDITORIAL_OVERRIDES[rawSlug] }
    : baseSource;
  const title = sanitizeInlineText(source.title || source.h1 || source.seoTitle || source.metaTitle || '');
  const slug = normalizeArticleSlug({ ...source, title });
  const explicitRoutePath = sanitizeInlineText(source.routePath || source.path || '');
  const routePath = explicitRoutePath || (slug ? `/blog/${slug}` : '');
  const canonicalUrl =
    sanitizeInlineText(source.canonicalUrl || '') ||
    (routePath ? `https://www.cotejuros.com.br${routePath}${routePath.endsWith('/') ? '' : '/'}` : '');
  const category = sanitizeInlineText(source.category || source.categoryName || source.clusterLabel || '');
  const excerpt = sanitizeInlineText(source.excerpt || source.summary || source.metaDescription || source.seoDescription || '');
  const intro = sanitizeStringArray(source.intro);
  const sections = normalizeSections(source.sections, title);
  const faq = normalizeFaq(source.faq || source.faqSchema);
  const conclusion = sanitizeStringArray(source.conclusion);
  const tags = sanitizeStringArray(source.tags || source.keywords);
  const content = sanitizeRichText(source.content || '');
  const readTime = Number.isFinite(Number(source.readTime)) && Number(source.readTime) > 0
    ? Number(source.readTime)
    : estimateReadTime({ intro, sections, faq, conclusion, content });

  return {
    ...source,
    id: sanitizeInlineText(source.id || ''),
    slug,
    title,
    h1: sanitizeInlineText(source.h1 || title),
    description: sanitizeInlineText(source.metaDescription || source.seoDescription || excerpt),
    excerpt,
    summary: excerpt,
    category,
    categoryKey: normalizeText(category),
    author: sanitizeInlineText(source.author || source.authorName || ''),
    publishedAt: sanitizeDate(source.publishedAt || source.publishDate || source.createdAt),
    publishDate: sanitizeDate(source.publishedAt || source.publishDate || source.createdAt),
    date: sanitizeDate(source.publishedAt || source.publishDate || source.createdAt),
    updatedAt: sanitizeDate(source.updatedAt || source.modifiedAt || source.publishedAt || source.publishDate || source.createdAt),
    readingTime: readTime,
    readTime,
    tags,
    keywords: tags,
    intro,
    sections,
    conclusion,
    faq,
    content,
    featuredSnippet: sanitizeInlineText(source.featuredSnippet || ''),
    example: sanitizeInlineText(source.example || ''),
    alert: sanitizeInlineText(source.alert || ''),
    midQuestions: normalizeQuestionBlocks(source.midQuestions),
    ctas: normalizeCtas(source.ctas),
    financialImpact: sanitizeStringArray(source.financialImpact),
    alternatives: sanitizeStringArray(source.alternatives),
    internalLinks: normalizeInternalLinks(source.internalLinks),
    externalLinks: normalizeExternalLinks(source.externalLinks),
    metaTitle: sanitizeInlineText(source.metaTitle || ''),
    seoTitle: sanitizeInlineText(source.seoTitle || source.metaTitle || ''),
    metaDescription: sanitizeInlineText(source.metaDescription || source.seoDescription || excerpt),
    coverImage: sanitizeInlineText(source.coverImage || source.image || source.imageUrl || source.featuredImage || ''),
    coverImageAlt: sanitizeInlineText(source.coverImageAlt || source.imageAlt || source.alt || ''),
    ogImage: sanitizeInlineText(source.ogImage || source.image || source.coverImage || ''),
    image: sanitizeInlineText(source.coverImage || source.image || source.imageUrl || source.featuredImage || ''),
    imageAlt: sanitizeInlineText(source.coverImageAlt || source.imageAlt || source.alt || ''),
    cta: isObjectRecord(source.cta) ? source.cta : null,
    clusterLabel: sanitizeInlineText(source.clusterLabel || source.cluster || ''),
    routePath,
    canonicalUrl,
    legacyUrl: sanitizeInlineText(source.legacyUrl || ''),
    sourceType: sanitizeInlineText(source.sourceType || ''),
    status: sanitizeInlineText(source.status || '')
  };
};

export const hasRenderableArticleContent = (article = {}) => {
  const normalized = normalizeArticleData(article);
  return Boolean(
    normalized.slug
    && normalized.title
    && (
      normalized.intro.length
      || normalized.sections.length
      || normalized.conclusion.length
      || normalized.content
    )
  );
};

export const resolveArticleBySlug = ({ slug = '', directArticle = null, articles = [] } = {}) => {
  try {
    const normalizedSlug = slugify(slug);
    if (!normalizedSlug) return null;

    if (isObjectRecord(directArticle)) {
      const normalized = normalizeArticleData(directArticle);
      if (normalized.slug === normalizedSlug && hasRenderableArticleContent(normalized)) return normalized;
    }

    const list = Array.isArray(articles) ? articles : [];
    return list
      .map((item) => normalizeArticleData(item))
      .find((item) => item.slug === normalizedSlug && hasRenderableArticleContent(item)) || null;
  } catch (error) {
    console.error('[blog-article-resolver] falha ao resolver artigo', { slug, error });
    return null;
  }
};

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
  return normalizeArticleData(article).title;
};

export const getArticleImage = (article = {}) => resolveArticleImageSources(normalizeArticleData(article)).primary;
export const getArticleImageCandidates = (article = {}) => resolveArticleImageSources(normalizeArticleData(article));
export const getArticleImageAlt = (article = {}) => resolveArticleImageAlt(normalizeArticleData(article));
export { getBlogEditorialPriority };
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
  if (normalizedArticle.conclusion.length) items.push({ id: 'conclusao', label: 'Conclusao' });
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
    .find((article) => isArticleSlugMatch(article, slug) && hasRenderableArticleContent(article)) || null;
