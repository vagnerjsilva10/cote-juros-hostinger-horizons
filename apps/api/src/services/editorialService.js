import { z } from 'zod';
import { getPrisma } from '../lib/prisma.js';
import { generateBlogImage } from './imageGenerator.js';
import {
  AUTHORITY_SOURCES,
  COMMERCIAL_DESTINATIONS,
  DEFAULT_EDITORIAL_CLUSTERS,
  SITE_BASE_URL
} from './editorialConfig.js';
import { createEditorialLogger } from './editorialLogger.js';

const logger = createEditorialLogger('editorial-service');
const OPENAI_RESPONSES_ENDPOINT = 'https://api.openai.com/v1/responses';
const OPENAI_EDITORIAL_MODEL = process.env.OPENAI_EDITORIAL_MODEL || 'gpt-5';
const GEMINI_TEXT_MODELS = Array.from(new Set([
  process.env.GEMINI_EDITORIAL_MODEL || 'gemini-2.5-pro',
  'gemini-2.5-flash'
].filter(Boolean)));

const GeneratedSectionSchema = z.object({
  heading: z.string().min(8),
  paragraphs: z.array(z.string().min(40)).min(2).max(4),
  bullets: z.array(z.string().min(8)).max(5).default([])
});

const GeneratedFaqSchema = z.object({
  question: z.string().min(12),
  answer: z.string().min(40)
});

const GeneratedCtaSchema = z.object({
  eyebrow: z.string().min(4),
  title: z.string().min(12),
  description: z.string().min(30),
  primary: z.object({
    to: z.string().min(1),
    label: z.string().min(2)
  }),
  secondary: z.object({
    to: z.string().min(1),
    label: z.string().min(2)
  })
});

const GeneratedArticleSchema = z.object({
  title: z.string().min(24),
  h1: z.string().min(24),
  summary: z.string().min(100),
  metaTitle: z.string().min(35).max(80),
  metaDescription: z.string().min(120).max(170),
  category: z.string().min(4),
  tags: z.array(z.string().min(3)).min(4).max(10),
  intro: z.array(z.string().min(70)).min(2).max(3),
  sections: z.array(GeneratedSectionSchema).min(5).max(8),
  faq: z.array(GeneratedFaqSchema).min(3).max(5),
  conclusion: z.array(z.string().min(60)).min(2).max(3),
  cta: GeneratedCtaSchema
});

const toSlug = (value = '') =>
  String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

const toCategorySlug = (value = '') => `blog-${toSlug(value || 'financas-pessoais')}`;
const countWords = (value = '') => String(value).trim().split(/\s+/).filter(Boolean).length;
const compactWhitespace = (value = '') => String(value || '').replace(/\s+/g, ' ').trim();
const extractJsonObject = (value = '') => {
  const text = String(value || '').trim();
  if (!text) throw new Error('Model response is empty');

  const fencedMatch = text.match(/```json\s*([\s\S]*?)```/i);
  if (fencedMatch?.[1]) return fencedMatch[1].trim();

  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start >= 0 && end > start) {
    return text.slice(start, end + 1);
  }

  throw new Error('Model response does not contain JSON');
};

const compilePlainTextContent = (article = {}) =>
  [
    ...(article.intro || []),
    ...((article.sections || []).flatMap((section) => [
      section.heading,
      ...(section.paragraphs || []),
      ...(section.bullets || [])
    ])),
    ...((article.faq || []).flatMap((item) => [item.question, item.answer])),
    ...(article.conclusion || [])
  ]
    .filter(Boolean)
    .join('\n\n');

const calculateReadTime = (wordCount) => Math.max(6, Math.round(wordCount / 190));
const normalizeDate = (date) => new Date(date).toISOString();

const flattenOpenAiOutput = (payload = {}) => {
  if (typeof payload.output_text === 'string' && payload.output_text.trim()) {
    return payload.output_text.trim();
  }

  const output = Array.isArray(payload.output) ? payload.output : [];
  const texts = output
    .flatMap((item) => Array.isArray(item.content) ? item.content : [])
    .map((item) => item?.text || '')
    .filter(Boolean);

  return texts.join('\n').trim();
};

const flattenGeminiOutput = (payload = {}) => {
  const parts = payload?.candidates?.[0]?.content?.parts || [];
  return parts.map((part) => part?.text || '').filter(Boolean).join('\n').trim();
};

const normalizeParagraphList = (items = []) => {
  const normalized = (Array.isArray(items) ? items : [])
    .map((item) => compactWhitespace(item))
    .filter(Boolean)
    .flatMap((item) => item.split(/\n+/).map((chunk) => compactWhitespace(chunk)).filter(Boolean));

  const expanded = [];
  for (const paragraph of normalized) {
    if (paragraph.length >= 40) {
      expanded.push(paragraph);
      continue;
    }

    if (!expanded.length) {
      expanded.push(paragraph);
      continue;
    }

    expanded[expanded.length - 1] = `${expanded[expanded.length - 1]} ${paragraph}`.trim();
  }

  const merged = [];
  for (const paragraph of expanded) {
    if (!merged.length) {
      merged.push(paragraph);
      continue;
    }

    const shouldMerge = paragraph.length < 40 || merged.length >= 4;
    if (shouldMerge) {
      merged[merged.length - 1] = `${merged[merged.length - 1]} ${paragraph}`.trim();
    } else {
      merged.push(paragraph);
    }
  }

  return merged.slice(0, 4);
};

const normalizeSections = (sections = []) =>
  (Array.isArray(sections) ? sections : [])
    .map((section) => ({
      heading: compactWhitespace(section?.heading || section?.title || ''),
      paragraphs: normalizeParagraphList(section?.paragraphs || section?.content || []),
      bullets: (Array.isArray(section?.bullets) ? section.bullets : [])
        .map((item) => compactWhitespace(item))
        .filter(Boolean)
        .slice(0, 5)
    }))
    .filter((section) => section.heading && section.paragraphs.length >= 2)
    .slice(0, 8);

const buildFallbackSections = (title = '', category = '') => ([
  {
    heading: `O que ${compactWhitespace(title).toLowerCase()} significa na pratica`,
    paragraphs: [
      `Entender ${compactWhitespace(title).toLowerCase()} exige olhar para custo, contexto e impacto no orcamento, em vez de decidir apenas pela promessa mais chamativa.`,
      `Quando a leitura fica organizada por objetivo, prazo e risco real, fica mais facil separar uma opcao util de uma proposta que pode apertar o mes seguinte.`
    ],
    bullets: []
  },
  {
    heading: 'Quais pontos merecem mais atencao antes de contratar',
    paragraphs: [
      `Antes de seguir, vale comparar taxa, CET, prazo, valor de parcela, margem do orcamento e flexibilidade para lidar com imprevistos sem entrar em bola de neve.`,
      `Esse tipo de analise ajuda a transformar uma busca genérica em uma decisao mais madura, com menos pressa e mais clareza sobre o que cabe no seu momento.`
    ],
    bullets: ['compare custo total e nao apenas parcela', 'veja como a decisao afeta os proximos meses']
  },
  {
    heading: `Como ${compactWhitespace(category || 'o tema').toLowerCase()} entra nessa decisao`,
    paragraphs: [
      `No contexto de ${compactWhitespace(category || 'financas pessoais').toLowerCase()}, o mais importante e cruzar informacao tecnica com realidade financeira, porque a melhor opcao no papel nem sempre e a melhor no dia a dia.`,
      `Quanto maior o compromisso de longo prazo, mais importante fica revisar contrato, condicoes, margem mensal e o plano para nao depender de credito caro depois.`
    ],
    bullets: []
  }
]);

const trimMetaDescription = (value = '') => {
  const text = compactWhitespace(value);
  if (text.length <= 170) return text;
  return `${text.slice(0, 167).trim()}...`;
};

const trimMetaTitle = (value = '') => {
  const text = compactWhitespace(value);
  if (text.length <= 80) return text;
  return `${text.slice(0, 77).trim()}...`;
};

const coerceGeneratedArticle = (raw = {}) => ({
  ...raw,
  title: compactWhitespace(raw?.title || raw?.h1 || ''),
  h1: compactWhitespace(raw?.h1 || raw?.title || ''),
  summary: compactWhitespace(raw?.summary || raw?.excerpt || ''),
  metaTitle: trimMetaTitle(raw?.metaTitle || raw?.seoTitle || raw?.title || ''),
  metaDescription: trimMetaDescription(raw?.metaDescription || raw?.seoDescription || raw?.summary || ''),
  category: compactWhitespace(raw?.category || 'Emprestimos'),
  tags: (Array.isArray(raw?.tags) ? raw.tags : [])
    .map((item) => compactWhitespace(item))
    .filter(Boolean)
    .slice(0, 10),
  intro: normalizeParagraphList(raw?.intro || []).slice(0, 3),
  sections: (function () {
    const normalizedSections = normalizeSections(raw?.sections || []);
    if (normalizedSections.length >= 5) return normalizedSections;
    const fallbackSections = buildFallbackSections(raw?.title || raw?.h1 || '', raw?.category || 'Emprestimos');
    const completed = [...normalizedSections];

    for (const section of fallbackSections) {
      if (completed.length >= 5) break;
      const duplicate = completed.some((item) => compactWhitespace(item.heading).toLowerCase() === compactWhitespace(section.heading).toLowerCase());
      if (!duplicate) completed.push(section);
    }

    return completed.slice(0, 8);
  })(),
  faq: (Array.isArray(raw?.faq) ? raw.faq : [])
    .map((item) => ({
      question: compactWhitespace(item?.question || ''),
      answer: compactWhitespace(item?.answer || '')
    }))
    .filter((item) => item.question.length >= 12 && item.answer.length >= 40)
    .slice(0, 5),
  conclusion: normalizeParagraphList(raw?.conclusion || []).slice(0, 3),
  cta: {
    eyebrow: compactWhitespace(raw?.cta?.eyebrow || 'Proximo passo'),
    title: compactWhitespace(raw?.cta?.title || 'Compare opcoes com mais clareza'),
    description: compactWhitespace(raw?.cta?.description || 'Veja caminhos de credito que podem fazer sentido para o seu momento, com contexto e sem pressa.'),
    primary: {
      to: compactWhitespace(raw?.cta?.primary?.to || '/emprestimos'),
      label: compactWhitespace(raw?.cta?.primary?.label || 'Ver opcoes agora')
    },
    secondary: {
      to: compactWhitespace(raw?.cta?.secondary?.to || '/blog'),
      label: compactWhitespace(raw?.cta?.secondary?.label || 'Continuar aprendendo')
    }
  }
});

const getAvailableAiProviders = () => {
  const providers = [];
  if (process.env.OPENAI_API_KEY) providers.push('openai');
  if (process.env.GEMINI_API_KEY) providers.push('gemini');
  return providers;
};

const getScheduleSlotDate = (baseDate, slotIndex) => {
  const date = new Date(baseDate);
  const slots = [
    { hours: 8, minutes: 15 },
    { hours: 14, minutes: 15 },
    { hours: 20, minutes: 15 }
  ];
  const slot = slots[slotIndex % slots.length];
  const dayOffset = Math.floor(slotIndex / slots.length);
  date.setUTCDate(date.getUTCDate() + dayOffset);
  date.setUTCHours(slot.hours + 3, slot.minutes, 0, 0);
  return date;
};

const buildBriefPayload = ({ cluster, brief, scheduleDate }) => ({
  clusterSlug: cluster.slug,
  clusterLabel: cluster.name,
  primaryKeyword: brief.primaryKeyword,
  secondaryKeywords: brief.secondaryKeywords,
  pillarTitle: cluster.pillarTitle,
  pillarSlug: cluster.pillarSlug,
  stage: brief.stage,
  angle: brief.angle,
  targetLength: '1200-2000 palavras',
  requiredStructure: ['h1', 'summary', '6-8 h2/h3 blocks', 'faq', 'cta'],
  requiredLinks: {
    pillar: `/blog/${cluster.pillarSlug}`,
    commercial: cluster.commercialPath
  },
  scheduledFor: normalizeDate(scheduleDate)
});

const buildGenerationPrompt = ({ cluster, brief, contextualLinks }) => `
Voce e um editor senior de conteudo SEO da Cote Juros, um portal brasileiro de comparacao de credito.

Escreva um artigo original em portugues do Brasil, profundo e natural, com linguagem clara, adulta e sem exageros promocionais.

Requisitos absolutos:
- entre 1200 e 2000 palavras
- H1 forte e objetivo
- 5 a 8 secoes com H2 e, quando fizer sentido, H3 dentro dos paragrafos
- 3 a 5 FAQs
- CTA final orientada a comparacao com clareza
- sem fluff, sem frases vazias, sem promessas de aprovacao
- tom premium fintech, parecido com grandes portais financeiros

Contexto do cluster:
${JSON.stringify({
    cluster: cluster.name,
    primaryKeyword: cluster.primaryKeyword,
    pillarTitle: cluster.pillarTitle,
    pillarSlug: cluster.pillarSlug,
    briefTitle: brief.title,
    briefKeyword: brief.primaryKeyword,
    secondaryKeywords: brief.secondaryKeywords,
    stage: brief.stage,
    category: cluster.category,
    contextualLinks
  }, null, 2)}

Responda somente JSON valido, sem markdown, com o seguinte formato:
{
  "title": string,
  "h1": string,
  "summary": string,
  "metaTitle": string,
  "metaDescription": string,
  "category": string,
  "tags": string[],
  "intro": string[],
  "sections": [{ "heading": string, "paragraphs": string[], "bullets": string[] }],
  "faq": [{ "question": string, "answer": string }],
  "conclusion": string[],
  "cta": {
    "eyebrow": string,
    "title": string,
    "description": string,
    "primary": { "to": string, "label": string },
    "secondary": { "to": string, "label": string }
  }
}`.trim();

const getContextualLinks = ({ cluster, relatedArticles = [] }) => ({
  pillar: {
    path: `/blog/${cluster.pillarSlug}`,
    title: cluster.pillarTitle,
    anchor: `guia completo sobre ${cluster.primaryKeyword}`
  },
  relatedArticles: relatedArticles.slice(0, 3).map((article) => ({
    path: `/blog/${article.slug}`,
    title: article.title,
    anchor: article.excerpt || article.title
  })),
  commercial: COMMERCIAL_DESTINATIONS
});

const buildInternalLinks = ({ cluster, article, relatedArticles = [] }) => {
  const links = [
    {
      path: `/blog/${cluster.pillarSlug}`,
      title: cluster.pillarTitle,
      anchor: `veja o guia principal sobre ${cluster.primaryKeyword}`
    },
    ...relatedArticles.slice(0, 3).map((item) => ({
      path: `/blog/${item.slug}`,
      title: item.title,
      anchor: item.excerpt || item.title
    }))
  ];

  if (/cart/i.test(article.category || '')) {
    links.push(COMMERCIAL_DESTINATIONS[1], COMMERCIAL_DESTINATIONS[0]);
  } else if (/financ/i.test(article.category || '')) {
    links.push(COMMERCIAL_DESTINATIONS[2], COMMERCIAL_DESTINATIONS[0]);
  } else {
    links.push(COMMERCIAL_DESTINATIONS[0], COMMERCIAL_DESTINATIONS[2]);
  }

  const seen = new Set();
  return links.filter((item) => {
    if (!item?.path || seen.has(item.path)) return false;
    seen.add(item.path);
    return true;
  }).slice(0, 6);
};

const buildExternalLinks = ({ article, cluster }) => {
  const haystack = `${article.title} ${article.summary} ${cluster.primaryKeyword}`.toLowerCase();
  const list = [AUTHORITY_SOURCES[0]];

  if (/negativ|score|cpf|restricao|cadastro/.test(haystack)) {
    list.push(AUTHORITY_SOURCES[1], AUTHORITY_SOURCES[2]);
  } else if (/orcamento|renda|reserva|familia|gasto|planejamento/.test(haystack)) {
    list.push(AUTHORITY_SOURCES[3]);
  } else {
    list.push(AUTHORITY_SOURCES[1]);
  }

  const seen = new Set();
  return list.filter((item) => {
    if (!item?.url || seen.has(item.url)) return false;
    seen.add(item.url);
    return true;
  }).slice(0, 3);
};

const validateArticlePayload = ({ article, internalLinks, externalLinks, existingSlugs = new Set(), existingTitles = new Set() }) => {
  const plainText = compilePlainTextContent(article);
  const wordCount = countWords(plainText);
  const issues = [];

  if (wordCount < 1200) issues.push(`Conteudo curto demais: ${wordCount} palavras`);
  if (wordCount > 2200) issues.push(`Conteudo longo demais: ${wordCount} palavras`);
  if (!article.h1 || article.h1.length < 24) issues.push('H1 ausente ou fraco');
  if (!Array.isArray(article.sections) || article.sections.length < 5) issues.push('Menos de 5 secoes editoriais');
  if (!Array.isArray(article.faq) || article.faq.length < 3) issues.push('FAQ insuficiente');
  if (!Array.isArray(internalLinks) || internalLinks.length < 3) issues.push('Links internos insuficientes');
  if (!Array.isArray(externalLinks) || externalLinks.length < 1) issues.push('Links externos insuficientes');
  if (!article.cta?.primary?.to) issues.push('CTA primaria ausente');
  if (existingSlugs.has(article.slug)) issues.push(`Slug duplicado: ${article.slug}`);
  if (existingTitles.has(article.title.trim().toLowerCase())) issues.push(`Titulo duplicado: ${article.title}`);

  return {
    wordCount,
    readTime: calculateReadTime(wordCount),
    issues,
    passed: issues.length === 0
  };
};

const ensureBlogCategory = async (prisma, name = 'Financas pessoais') => prisma.category.upsert({
  where: { slug: toCategorySlug(name) },
  update: {
    name,
    type: 'blog'
  },
  create: {
    slug: toCategorySlug(name),
    name,
    type: 'blog'
  }
});

const serializeArticleRecord = (record) => {
  const structured = record.structuredContent && typeof record.structuredContent === 'object'
    ? record.structuredContent
    : {};

  return {
    ...structured,
    id: record.id,
    slug: record.slug,
    title: record.title,
    h1: structured.h1 || record.title,
    excerpt: record.excerpt || structured.summary || '',
    summary: record.excerpt || structured.summary || '',
    author: record.author || 'Equipe Cote Juros',
    seoTitle: record.seoTitle || structured.metaTitle || record.title,
    metaTitle: record.seoTitle || structured.metaTitle || record.title,
    metaDescription: record.seoDescription || structured.metaDescription || record.excerpt || '',
    coverImage: record.coverImage || structured.coverImage || '',
    ogImage: record.ogImage || structured.ogImage || '',
    readTime: record.readTime || structured.readTime || 6,
    wordCount: record.wordCount || structured.wordCount || 0,
    status: record.status,
    publishedAt: record.publishedAt,
    updatedAt: record.updatedAt,
    category: record.category?.name || structured.category || '',
    clusterLabel: record.cluster?.name || structured.clusterLabel || '',
    internalLinks: Array.isArray(structured.internalLinks) ? structured.internalLinks : [],
    externalLinks: Array.isArray(structured.externalLinks) ? structured.externalLinks : [],
    cta: structured.cta || null
  };
};

export class EditorialService {
  static async ensureClusterCalendar() {
    const prisma = getPrisma();
    const now = new Date();
    let slotIndex = 0;

    for (const clusterConfig of DEFAULT_EDITORIAL_CLUSTERS) {
      const cluster = await prisma.seoCluster.upsert({
        where: { slug: clusterConfig.slug },
        update: {
          name: clusterConfig.name,
          primaryKeyword: clusterConfig.primaryKeyword,
          pillarTitle: clusterConfig.pillarTitle,
          pillarSlug: clusterConfig.briefs[0].slug,
          description: clusterConfig.description,
          status: 'active'
        },
        create: {
          slug: clusterConfig.slug,
          name: clusterConfig.name,
          primaryKeyword: clusterConfig.primaryKeyword,
          pillarTitle: clusterConfig.pillarTitle,
          pillarSlug: clusterConfig.briefs[0].slug,
          description: clusterConfig.description,
          status: 'active'
        }
      });

      for (const briefConfig of clusterConfig.briefs) {
        const scheduledFor = getScheduleSlotDate(now, slotIndex);
        slotIndex += 1;
        const briefPayload = buildBriefPayload({
          cluster: {
            ...clusterConfig,
            pillarSlug: clusterConfig.briefs[0].slug
          },
          brief: briefConfig,
          scheduleDate: scheduledFor
        });

        await prisma.editorialBrief.upsert({
          where: { slug: briefConfig.slug },
          update: {
            clusterId: cluster.id,
            title: briefConfig.title,
            primaryKeyword: briefConfig.primaryKeyword,
            secondaryKeywords: briefConfig.secondaryKeywords,
            stage: briefConfig.stage,
            brief: briefPayload,
            seoTitle: `${briefConfig.title} | Blog Cote Juros`,
            metaDescription: `Entenda ${briefConfig.primaryKeyword} com mais clareza, compare custo real e veja como decidir sem pressa.`,
            scheduledFor
          },
          create: {
            clusterId: cluster.id,
            slug: briefConfig.slug,
            title: briefConfig.title,
            primaryKeyword: briefConfig.primaryKeyword,
            secondaryKeywords: briefConfig.secondaryKeywords,
            stage: briefConfig.stage,
            brief: briefPayload,
            seoTitle: `${briefConfig.title} | Blog Cote Juros`,
            metaDescription: `Entenda ${briefConfig.primaryKeyword} com mais clareza, compare custo real e veja como decidir sem pressa.`,
            scheduledFor,
            status: 'planned'
          }
        });
      }
    }
  }

  static async listEditorialBacklog(limit = 20) {
    await this.ensureClusterCalendar();
    const prisma = getPrisma();
    return prisma.editorialBrief.findMany({
      where: {
        status: {
          in: ['planned', 'briefing_ready', 'draft', 'failed']
        }
      },
      include: {
        cluster: true
      },
      orderBy: [{ scheduledFor: 'asc' }, { createdAt: 'asc' }],
      take: limit
    });
  }

  static async runScheduledPublication({ limit = 1, triggerSource = 'manual' } = {}) {
    await this.ensureClusterCalendar();
    const prisma = getPrisma();
    const now = new Date();

    const briefs = await prisma.editorialBrief.findMany({
      where: {
        status: {
          in: ['planned', 'briefing_ready', 'draft', 'failed']
        },
        OR: [
          { scheduledFor: null },
          { scheduledFor: { lte: now } }
        ]
      },
      include: {
        cluster: true
      },
      orderBy: [{ scheduledFor: 'asc' }, { createdAt: 'asc' }],
      take: limit
    });

    const results = [];
    for (const brief of briefs) {
      results.push(await this.processBrief({ brief, triggerSource }));
    }

    return results;
  }

  static async processBrief({ brief, triggerSource = 'manual' }) {
    const prisma = getPrisma();
    const jobRun = await prisma.editorialJobRun.create({
      data: {
        jobName: 'editorial-publication',
        triggerSource,
        clusterId: brief.clusterId,
        briefId: brief.id,
        status: 'running',
        metadata: {
          slug: brief.slug,
          title: brief.title
        }
      }
    });

    try {
      await prisma.editorialBrief.update({
        where: { id: brief.id },
        data: { status: 'generating' }
      });

      const relatedArticles = await prisma.article.findMany({
        where: {
          clusterId: brief.clusterId,
          status: 'published'
        },
        orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
        take: 6
      });

      const contextualLinks = getContextualLinks({
        cluster: brief.cluster,
        relatedArticles
      });

      const generated = await this.generateArticleFromAi({ brief, cluster: brief.cluster, contextualLinks });
      const image = await generateBlogImage({
        title: generated.title,
        topic: brief.primaryKeyword,
        slug: brief.slug
      });
      const internalLinks = buildInternalLinks({
        cluster: brief.cluster,
        article: generated,
        relatedArticles
      });
      const externalLinks = buildExternalLinks({
        article: generated,
        cluster: brief.cluster
      });

      const articlePayload = {
        ...generated,
        slug: brief.slug,
        routePath: `/blog/${brief.slug}`,
        canonicalUrl: `${SITE_BASE_URL}/blog/${brief.slug}/`,
        coverImage: image.publicPath,
        ogImage: `${SITE_BASE_URL}${image.publicPath}`,
        clusterLabel: brief.cluster.name,
        clusterKeyword: brief.cluster.primaryKeyword,
        internalLinks,
        externalLinks,
        readTime: 0,
        wordCount: 0,
        sourceType: 'editorial-automation'
      };

      const existingArticles = await prisma.article.findMany({
          where: {
            NOT: {
              slug: brief.slug
            }
          },
          select: { slug: true, title: true }
        });
      const existingSlugs = new Set(existingArticles.map((item) => item.slug));
      const existingTitles = new Set(existingArticles.map((item) => item.title.trim().toLowerCase()));

      const validation = validateArticlePayload({
        article: articlePayload,
        internalLinks,
        externalLinks,
        existingSlugs,
        existingTitles
      });

      articlePayload.wordCount = validation.wordCount;
      articlePayload.readTime = validation.readTime;

      const category = await ensureBlogCategory(prisma, generated.category || brief.cluster.name);
      const articleRecord = await prisma.article.upsert({
        where: { slug: brief.slug },
        update: {
          title: generated.title,
          content: compilePlainTextContent(articlePayload),
          excerpt: generated.summary,
          categoryId: category.id,
          clusterId: brief.clusterId,
          briefId: brief.id,
          author: 'Equipe Cote Juros',
          seoTitle: generated.metaTitle,
          seoDescription: generated.metaDescription,
          coverImage: image.publicPath,
          ogImage: `${SITE_BASE_URL}${image.publicPath}`,
          readTime: validation.readTime,
          wordCount: validation.wordCount,
          isPillar: brief.stage === 'pillar',
          structuredContent: articlePayload,
          publishedAt: validation.passed ? new Date() : null,
          status: validation.passed ? 'published' : 'draft'
        },
        create: {
          slug: brief.slug,
          title: generated.title,
          content: compilePlainTextContent(articlePayload),
          excerpt: generated.summary,
          categoryId: category.id,
          clusterId: brief.clusterId,
          briefId: brief.id,
          author: 'Equipe Cote Juros',
          seoTitle: generated.metaTitle,
          seoDescription: generated.metaDescription,
          coverImage: image.publicPath,
          ogImage: `${SITE_BASE_URL}${image.publicPath}`,
          readTime: validation.readTime,
          wordCount: validation.wordCount,
          isPillar: brief.stage === 'pillar',
          structuredContent: articlePayload,
          publishedAt: validation.passed ? new Date() : null,
          status: validation.passed ? 'published' : 'draft'
        },
        include: {
          category: true,
          cluster: true
        }
      });

      await prisma.editorialAsset.create({
        data: {
          articleId: articleRecord.id,
          slug: brief.slug,
          provider: image.provider,
          prompt: image.prompt,
          publicPath: image.publicPath,
          width: image.width,
          height: image.height,
          fileSizeBytes: image.fileSizeBytes,
          status: image.isFallback ? 'draft_saved' : 'succeeded',
          errorMessage: image.errorMessage || null,
          metadata: {
            isFallback: image.isFallback
          }
        }
      });

      await prisma.editorialBrief.update({
        where: { id: brief.id },
        data: {
          status: validation.passed ? 'published' : 'draft'
        }
      });

      await prisma.editorialJobRun.update({
        where: { id: jobRun.id },
        data: {
          articleId: articleRecord.id,
          status: validation.passed ? 'succeeded' : 'draft_saved',
          finishedAt: new Date(),
          durationMs: Date.now() - new Date(jobRun.startedAt).getTime(),
          metadata: {
            slug: brief.slug,
            validation,
            image: {
              provider: image.provider,
              publicPath: image.publicPath,
              fallback: image.isFallback
            }
          },
          errorMessage: validation.passed ? null : validation.issues.join(' | ')
        }
      });

      await logger.info('editorial_brief_processed', {
        briefId: brief.id,
        slug: brief.slug,
        status: validation.passed ? 'published' : 'draft',
        wordCount: validation.wordCount
      });

      return {
        jobRunId: jobRun.id,
        article: serializeArticleRecord(articleRecord),
        validation,
        image
      };
    } catch (error) {
      await prisma.editorialBrief.update({
        where: { id: brief.id },
        data: {
          status: 'failed'
        }
      });

      await prisma.editorialJobRun.update({
        where: { id: jobRun.id },
        data: {
          status: 'failed',
          finishedAt: new Date(),
          durationMs: Date.now() - new Date(jobRun.startedAt).getTime(),
          errorMessage: error?.message || String(error)
        }
      });

      await logger.error('editorial_brief_failed', error, {
        briefId: brief.id,
        slug: brief.slug
      });

      throw error;
    }
  }

  static async generateArticleFromAi({ brief, cluster, contextualLinks }) {
    const prompt = buildGenerationPrompt({ brief, cluster, contextualLinks });
    const providers = getAvailableAiProviders();
    let lastError = null;

    if (!providers.length) {
      throw new Error('Missing OPENAI_API_KEY or GEMINI_API_KEY for editorial generation');
    }

    for (const provider of providers) {
      try {
        const rawText = provider === 'openai'
          ? await this.generateWithOpenAi(prompt)
          : await this.generateWithGemini(prompt);

        const parsed = JSON.parse(extractJsonObject(rawText));
        const validated = GeneratedArticleSchema.parse(coerceGeneratedArticle(parsed));

        return {
          ...validated,
          title: validated.title.trim(),
          h1: validated.h1.trim(),
          summary: validated.summary.trim(),
          metaTitle: validated.metaTitle.trim(),
          metaDescription: validated.metaDescription.trim(),
          category: validated.category.trim()
        };
      } catch (error) {
        lastError = error;
        await logger.warn('editorial_generation_provider_failed', {
          provider,
          briefId: brief.id,
          slug: brief.slug,
          error: error?.message || String(error)
        });
      }
    }

    throw lastError || new Error('Editorial generation failed for all providers');
  }

  static async generateWithOpenAi(prompt) {
    const response = await fetch(OPENAI_RESPONSES_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: OPENAI_EDITORIAL_MODEL,
        input: [
          {
            role: 'system',
            content: [
              {
                type: 'input_text',
                text: 'Voce escreve conteudo SEO premium em portugues do Brasil para um portal financeiro. Responda apenas JSON valido.'
              }
            ]
          },
          {
            role: 'user',
            content: [
              {
                type: 'input_text',
                text: prompt
              }
            ]
          }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI editorial generation failed (${response.status}): ${errorText}`);
    }

    const payload = await response.json();
    const text = flattenOpenAiOutput(payload);
    if (!text) throw new Error('OpenAI editorial generation returned empty output');
    return text;
  }

  static async generateWithGemini(prompt) {
    let lastError = null;

    for (const model of GEMINI_TEXT_MODELS) {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
      const response = await fetch(`${endpoint}?key=${encodeURIComponent(process.env.GEMINI_API_KEY)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: prompt }]
            }
          ],
          generationConfig: {
            temperature: 0.8,
            responseMimeType: 'application/json'
          }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        lastError = new Error(`Gemini editorial generation failed for ${model} (${response.status}): ${errorText}`);
        continue;
      }

      const payload = await response.json();
      const text = flattenGeminiOutput(payload);
      if (!text) {
        lastError = new Error(`Gemini editorial generation returned empty output for ${model}`);
        continue;
      }

      return text;
    }

    throw lastError || new Error('Gemini editorial generation failed for all configured models');
  }
}
