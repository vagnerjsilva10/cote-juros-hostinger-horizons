import { normalizeMojibake } from '@/lib/textEncoding.js';
import { resolveArticleImageAlt, resolveArticleImageSources } from '@/lib/content/blogImages.js';
import { BLOG_EDITORIAL_OVERRIDES, getBlogEditorialPriority } from '@/data/blogEditorialOverrides.js';

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
        `Se ainda houver duvida, compare opcoes, leia conteudos relacionados e avance apenas quando o proximo passo fizer sentido para o seu perfil.`
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
        !rawTitle ||
        isSlugLikeLabel(rawTitle) ||
        (routeLabel && normalizeText(rawTitle) === normalizeText(routeLabel));
      const title = isKnownRouteLink ? routeLabel : titleLooksGenerated ? routeLabel || rawTitle : rawTitle;
      const anchorLooksGenerated =
        !rawAnchor ||
        isSlugLikeLabel(rawAnchor) ||
        (title && normalizeText(rawAnchor) === normalizeText(title));
      const anchorBase = isKnownRouteLink ? title : anchorLooksGenerated ? title || routeLabel || rawAnchor : rawAnchor;
      const safeAnchorBase = normalizeMojibake(anchorBase);

      return {
        path,
        title: normalizeMojibake(title),
        anchor: safeAnchorBase || normalizeMojibake(title)
      };
    })
    .filter((item) => item.path && item.title);
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
  const safeIntro = intro.length ? intro : buildFallbackIntro(title, category);
  const safeSections = sections.length ? sections : buildFallbackSections(title, category, tags);
  const safeConclusion =
    conclusion.length
      ? conclusion
      : [
          `O mais importante em ${title.toLowerCase()} é sair da leitura com mais clareza do que entrou: o que observar, o que evitar e qual próximo passo faz sentido agora.`,
          'Quando o conteúdo é usado como apoio à decisão, o blog passa a ser uma ferramenta prática e não apenas mais uma referência aberta no navegador.'
        ];

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

export const normalizeArticleSlug = (article = {}) =>
  slugify(
    (isObjectRecord(article) ? article.slug || article.title || article.h1 || article.id : '') || 'artigo'
  );

export const normalizeArticleData = (article = {}, options = {}) => {
  const baseSource = isObjectRecord(article) ? article : {};
  const rawSlug = slugify(baseSource.slug || baseSource.title || baseSource.h1 || baseSource.id || '');
  const source = rawSlug && BLOG_EDITORIAL_OVERRIDES[rawSlug]
    ? { ...baseSource, ...BLOG_EDITORIAL_OVERRIDES[rawSlug] }
    : baseSource;
  const nowIso = options.nowIso || new Date().toISOString();
  const title = sanitizeInlineText(source.title || source.h1 || source.seoTitle || source.metaTitle || 'Artigo Cote Juros');
  const slug = normalizeArticleSlug({ ...source, title });
  const explicitRoutePath = sanitizeInlineText(source.routePath || source.path || '');
  const routePath = explicitRoutePath || (sanitizeInlineText(source.sourceType) === 'wordpress' ? `/${slug}` : `/blog/${slug}`);
  const canonicalUrl =
    sanitizeInlineText(source.canonicalUrl || '') ||
    `https://www.cotejuros.com.br${routePath}${routePath.endsWith('/') ? '' : '/'}`;
  const category = sanitizeInlineText(source.category || source.categoryName || source.clusterLabel || FALLBACK_CATEGORY) || FALLBACK_CATEGORY;
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
  const author = sanitizeInlineText(source.author || source.authorName || FALLBACK_AUTHOR) || FALLBACK_AUTHOR;
  const publishedAt = sanitizeDate(source.publishedAt || source.publishDate || source.createdAt, nowIso);
  const updatedAt = sanitizeDate(source.updatedAt || source.modifiedAt || publishedAt, publishedAt);
  const readTime = Number.isFinite(Number(source.readTime)) && Number(source.readTime) > 0
    ? Number(source.readTime)
    : estimateReadTime(editorial);

  const normalized = {
    ...source,
    id: sanitizeInlineText(source.id || `article-${slug}`),
    slug,
    title,
    h1: sanitizeInlineText(source.h1 || title) || title,
    description: sanitizeInlineText(source.metaDescription || excerpt) || excerpt,
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
    sections: editorial.sections,
    conclusion: editorial.conclusion,
    faq,
    content: editorial.content,
    internalLinks: normalizeInternalLinks(source.internalLinks),
    metaTitle: sanitizeInlineText(source.metaTitle || ''),
    seoTitle: sanitizeInlineText(source.seoTitle || source.metaTitle || `${title} | Blog Cote Juros`) || `${title} | Blog Cote Juros`,
    metaDescription:
      sanitizeInlineText(source.metaDescription || excerpt) ||
      `Guia da Cote Juros sobre ${title.toLowerCase()} com foco em clareza, organização e decisões financeiras mais seguras.`,
    coverImage: sanitizeInlineText(source.coverImage || source.image || source.imageUrl || source.featuredImage || ''),
    coverImageAlt: sanitizeInlineText(source.coverImageAlt || source.imageAlt || source.alt || '') || `Capa editorial do artigo ${title}`,
    image: sanitizeInlineText(source.coverImage || source.image || source.imageUrl || source.featuredImage || ''),
    imageAlt: sanitizeInlineText(source.coverImageAlt || source.imageAlt || source.alt || '') || `Capa editorial do artigo ${title}`,
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
