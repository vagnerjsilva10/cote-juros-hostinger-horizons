import { getPrisma } from '../lib/prisma.js';
import { enforceArticleStandard, validateArticle } from './articleQualityService.js';
import { createEditorialLogger } from './editorialLogger.js';
import { SITE_BASE_URL } from './editorialConfig.js';
import { searchPexelsImages } from './blogImage/providers/pexelsProvider.js';
import { searchUnsplashImages } from './blogImage/providers/unsplashProvider.js';
import { UsedBlogImageStore } from './blogImage/usedImageStore.js';
import { ArticleService } from './articleService.js';
import { repairPortugueseText } from './portugueseTextService.js';
import { SerpIntelligenceService } from './serpIntelligenceService.js';
import { buildPremiumArticle } from './premiumArticleComposerService.js';
import { buildIntentSpecificArticle } from './intentSpecificComposerService.js';
import { EditorialTopicFatigueService } from './editorialTopicFatigueService.js';
import { buildPublishHardBlockers } from './publishSafetyService.js';
import { EditorialGovernanceService } from './editorialGovernanceService.js';
import { applyOpinionatedFinanceLayerV2 } from './opinionatedFinanceService.js';

const logger = createEditorialLogger('article-factory');

const toSlug = (value = '') =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

const compact = (value = '') => String(value || '').replace(/\s+/g, ' ').trim();

const unique = (items = []) => Array.from(new Set(items.filter(Boolean)));

const defaultExternalLinks = ({ intent = '', keyword = '' } = {}) => {
  const normalized = `${intent} ${keyword}`.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const links = [
    { label: 'Banco Central do Brasil', url: 'https://www.bcb.gov.br/' },
    { label: 'Portal Gov.br', url: 'https://www.gov.br/' }
  ];

  if (/invest|cvm|renda|tesouro/.test(normalized)) {
    links.push({ label: 'Comissao de Valores Mobiliarios', url: 'https://www.gov.br/cvm/' });
  }
  if (/score|divida|cpf|negativado|serasa/.test(normalized)) {
    links.push({ label: 'Serasa', url: 'https://www.serasa.com.br/' });
  }
  if (/banco|credito|emprestimo|juros|cartao/.test(normalized)) {
    links.push({ label: 'Febraban', url: 'https://portal.febraban.org.br/' });
  }

  return unique(links.map((item) => `${item.label}|${item.url}`))
    .map((item) => {
      const [label, url] = item.split('|');
      return { label, url };
    })
    .slice(0, 4);
};

const defaultInternalLinks = ({ category = '', keyword = '' } = {}) => {
  const normalized = `${category} ${keyword}`.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const links = [
    { path: '/blog', title: 'Blog Cote Juros', anchor: 'outros guias financeiros' },
    { path: '/ferramentas', title: 'Ferramentas financeiras', anchor: 'ferramentas da Cote Juros' },
    { path: '/diagnostico-financeiro', title: 'Diagnóstico financeiro', anchor: 'diagnóstico financeiro' }
  ];

  if (/cartao|limite|fatura/.test(normalized)) {
    links.push({ path: '/cartoes', title: 'Cartões', anchor: 'comparar cartões' });
  } else if (/financi/.test(normalized)) {
    links.push({ path: '/financiamentos', title: 'Financiamentos', anchor: 'comparar financiamentos' });
  } else {
    links.push({ path: '/emprestimos', title: 'Empréstimos', anchor: 'comparar empréstimos' });
  }

  return links.slice(0, 5);
};

const buildArticleDraft = ({ topic, keyword, intent = 'guide', category = 'Educacao financeira', serpIntelligence = null }) => {
  const cleanKeyword = repairPortugueseText(compact(keyword || topic));
  const cleanTopic = repairPortugueseText(compact(topic || cleanKeyword));
  const cleanCategory = repairPortugueseText(compact(category || 'Educacao financeira'));
  const title = `${cleanKeyword}: como avaliar custos, riscos e alternativas`;
  const excerpt = `Entenda ${cleanKeyword}, veja cuidados praticos, exemplos e alternativas para decidir com mais seguranca.`;

  const structure = Array.isArray(serpIntelligence?.recommendedStructure) ? serpIntelligence.recommendedStructure : [];
  const faqQuestions = Array.isArray(serpIntelligence?.faqQuestions) ? serpIntelligence.faqQuestions : [];
  const gaps = Array.isArray(serpIntelligence?.contentGaps) ? serpIntelligence.contentGaps : [];

  return {
    title,
    h1: title,
    slug: toSlug(cleanKeyword),
    excerpt,
    summary: excerpt,
    metaTitle: title.slice(0, 80),
    metaDescription: `Entenda ${cleanKeyword}, compare custos reais, veja riscos e alternativas antes de tomar uma decisao financeira.`,
    category: cleanCategory,
    tags: unique([cleanKeyword, cleanTopic, cleanCategory, intent, 'Cote Juros']).slice(0, 8),
    intro: [
      `${cleanKeyword} exige comparar custo total, impacto na renda e riscos antes de qualquer decisao. ${serpIntelligence?.readerProblem || 'A ideia deste guia e mostrar o que olhar primeiro e como evitar escolhas tomadas no impulso.'}`,
      `A seguir, voce encontra uma leitura pratica sobre ${cleanTopic}, com exemplo numerico, alertas, links uteis e um caminho de comparacao sem promessa de aprovacao.`
    ],
    sections: [
      {
        heading: structure[0] || `${cleanKeyword}: o que observar primeiro`,
        subheading: 'Comece pelo custo total e pelo efeito da parcela no orcamento.',
        paragraphs: [
          `O primeiro passo e separar desejo, urgencia e capacidade real de pagamento. Em temas de ${cleanCategory.toLowerCase()}, a decisao costuma ficar mais segura quando o custo total aparece antes da parcela.`,
          `Tambem vale checar se a proposta depende de taxa antecipada, promessa de aprovacao ou informacao incompleta. Esses sinais aumentam o risco de prejuizo.`
        ],
        bullets: ['Compare CET, prazo e custo total.', 'Desconfie de cobranca antecipada.', 'Simule um mes de renda menor.']
      },
      {
        heading: structure[1] || `Exemplo real para analisar ${cleanKeyword}`,
        subheading: 'Uma simulacao simples mostra como a parcela pode enganar.',
        paragraphs: [
          'Exemplo: uma parcela de R$ 420 pode parecer baixa, mas em 18 meses representa R$ 7.560 antes de considerar tarifas, atrasos ou perda de renda.',
          'Por isso, a comparacao precisa considerar o contrato inteiro. Quando a renda mensal e apertada, uma diferenca pequena na taxa pode virar um problema grande no acumulado.'
        ],
        bullets: ['Some todas as parcelas.', 'Compare a taxa mensal e anual.', 'Veja se existe tarifa adicional.']
      },
      {
        heading: structure[2] || `Riscos comuns em ${cleanKeyword}`,
        subheading: 'O risco maior aparece quando a decisao nasce da pressa.',
        paragraphs: [
          `O principal risco em ${cleanKeyword} e assumir uma parcela que cabe apenas no melhor cenario. Se houver atraso, queda de renda ou despesa inesperada, o custo pode crescer rapido.`,
          'Outro cuidado e evitar propostas que prometem resultado garantido. A Cote Juros nao e banco, nao garante aprovacao e nao cobra taxa antecipada para liberar credito.'
        ],
        bullets: ['Nao aceite promessa de aprovacao garantida.', 'Guarde comprovantes e contratos.', 'Revise o custo em caso de atraso.']
      },
      {
        heading: structure[3] || `Alternativas antes de seguir com ${cleanKeyword}`,
        subheading: 'Comparar caminhos reduz a chance de contratar caro.',
        paragraphs: [
          'Antes de contratar, vale testar prazos diferentes, simular valores menores e avaliar se uma reorganizacao de despesas resolve parte do problema.',
          'Em alguns casos, renegociar uma divida cara ou adiar a contratacao por alguns dias gera economia maior do que aceitar a primeira oferta.'
        ],
        bullets: ['Simule pelo menos dois prazos.', 'Compare modalidades diferentes.', 'Considere renegociar antes de contratar.']
      },
      {
        heading: structure[4] || `Checklist final para ${cleanKeyword}`,
        subheading: 'Use estes pontos antes de enviar dados ou aceitar uma proposta.',
        paragraphs: [
          'A decisao fica mais segura quando existe uma lista objetiva de verificacao. Ela evita que a comunicacao comercial pese mais do que os numeros reais.',
          'Se algum ponto importante estiver ausente, o melhor caminho e pausar, pedir esclarecimento e comparar outra opcao.'
        ],
        bullets: unique(['CET informado.', 'Prazo claro.', 'Parcela cabe na renda.', 'Instituicao identificada.', 'Sem taxa antecipada.', ...gaps.slice(0, 2)]).slice(0, 5)
      }
    ],
    faq: [
      { question: faqQuestions[0] || `${cleanKeyword} vale a pena?`, answer: 'Vale quando o custo total cabe na renda, a finalidade e clara e existem alternativas comparadas antes da decisao.' },
      { question: faqQuestions[1] || 'O que comparar primeiro?', answer: 'Compare CET, prazo, valor da parcela, custo total e consequencias em caso de atraso.' },
      { question: 'A Cote Juros aprova credito?', answer: 'Nao. A Cote Juros organiza informacoes e caminhos de comparacao, mas a aprovacao depende da analise dos parceiros.' },
      { question: faqQuestions[2] || 'Como evitar golpe?', answer: 'Nao pague taxa antecipada, confira a empresa, leia o contrato e desconfie de promessa de aprovacao garantida.' }
    ],
    conclusion: [
      `${cleanKeyword} pode fazer sentido quando a decisao nasce de comparacao, e nao de pressa. O custo total precisa estar claro antes de qualquer compromisso.`,
      'Use o artigo como ponto de partida, compare alternativas e avance apenas quando a proposta fizer sentido para o seu orcamento.'
    ],
    serpIntelligence,
    cta: {
      eyebrow: 'Proximo passo',
      title: 'Compare antes de contratar',
      description: 'Veja opcoes e ferramentas para decidir com mais clareza, sem promessa falsa e sem taxa antecipada.',
      primary: { to: '/emprestimos', label: 'Ver opcoes agora' },
      secondary: { to: '/blog', label: 'Continuar lendo' }
    }
  };
};

const buildStructuredContent = ({ article, image, keyword, intent, category }) => ({
  ...article,
  clusterKeyword: keyword,
  editorialIntent: article.editorialIntent || intent,
  category,
  routePath: `/blog/${article.slug}`,
  canonicalUrl: `${SITE_BASE_URL}/blog/${article.slug}/`,
  coverImage: image.coverImage,
  ogImage: image.ogImage,
  coverImageAlt: image.altText,
  imageAlt: image.altText,
  imageAttribution: image.attribution,
  internalLinks: article.internalLinks,
  externalLinks: article.externalLinks,
  schema: {
    '@type': 'BlogPosting',
    headline: article.title,
    description: article.metaDescription,
    image: image.ogImage,
    keywords: article.keywords || article.tags || []
  },
  sourceType: 'article-factory'
});

const selectStockImage = async ({ keyword, topic, title, dryRun = false, reserveImage = false }) => {
  const queries = unique([
    keyword,
    topic,
    `${keyword} financas`,
    `${keyword} dinheiro`,
    'planejamento financeiro'
  ]).slice(0, 5);

  if (dryRun) {
    return {
      provider: 'dry-run',
      coverImage: 'https://images.pexels.com/photos/4386370/pexels-photo-4386370.jpeg',
      ogImage: 'https://images.pexels.com/photos/4386370/pexels-photo-4386370.jpeg',
      altText: `${keyword} - imagem editorial sobre planejamento financeiro`,
      attribution: {
        provider: 'dry-run',
        sourceName: 'Pexels example',
        sourceUrl: 'https://www.pexels.com/'
      },
      validationPassed: true
    };
  }

  const [pexels, unsplash] = await Promise.all([
    searchPexelsImages({ keywords: queries, perKeyword: 5 }),
    searchUnsplashImages({ keywords: queries, perKeyword: 5 })
  ]);
  const usageIndex = await UsedBlogImageStore.buildUsageIndex();
  const winner = [...pexels, ...unsplash].find((candidate) => UsedBlogImageStore.checkCandidate({ candidate, usageIndex }).unique);

  if (!winner?.downloadUrl) {
    throw new Error('Nenhuma imagem unica encontrada em Pexels/Unsplash. Artigo nao pode ser publicado.');
  }

  const uniqueness = UsedBlogImageStore.checkCandidate({ candidate: winner, usageIndex });
  if (reserveImage) {
    await UsedBlogImageStore.record({
      candidate: winner,
      keywords: queries,
      articleTitle: title,
      visualSignature: uniqueness.visualSignature || ''
    });
  }

  return {
    provider: winner.provider,
    coverImage: winner.downloadUrl,
    ogImage: winner.downloadUrl,
    altText: `${keyword} - imagem editorial sobre ${topic}`,
    attribution: {
      provider: winner.provider,
      sourceName: winner.authorName || winner.provider,
      sourceUrl: winner.pageUrl || winner.downloadUrl
    },
    validationPassed: true
  };
};

const ensureUniqueSlug = async ({ slug, idempotencyKey }) => {
  const prisma = getPrisma();
  const baseSlug = toSlug(slug || idempotencyKey);
  const existingByKey = await prisma.article.findFirst({
    where: {
      structuredContent: {
        path: ['factoryIdempotencyKey'],
        equals: idempotencyKey
      }
    }
  });
  if (existingByKey) return { slug: existingByKey.slug, existingArticle: existingByKey };

  let candidate = baseSlug;
  let suffix = 2;
  while (await prisma.article.findUnique({ where: { slug: candidate }, select: { id: true } })) {
    candidate = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  return { slug: candidate, existingArticle: null };
};

export async function generateArticle({ topic, keyword, intent = 'guide', category = 'Educacao financeira', serpIntelligence = null }) {
  const rawDraft = buildIntentSpecificArticle({ topic, keyword, intent, category, serpIntelligence })
    || buildPremiumArticle({ topic, keyword, intent, category, serpIntelligence })
    || buildArticleDraft({ topic, keyword, intent, category, serpIntelligence });
  const draft = applyOpinionatedFinanceLayerV2({ article: rawDraft, keyword });
  const internalLinks = Array.isArray(draft.internalLinks) && draft.internalLinks.length
    ? draft.internalLinks
    : defaultInternalLinks({ category, keyword });
  const externalLinks = Array.isArray(draft.externalLinks) && draft.externalLinks.length
    ? draft.externalLinks
    : defaultExternalLinks({ intent, keyword });
  const article = enforceArticleStandard({
    article: {
      ...draft,
      slug: draft.slug,
      keywords: draft.tags,
      internalLinks,
      externalLinks,
      serpIntelligence,
      sourceType: 'article-factory'
    },
    primaryKeyword: keyword,
    internalLinks
  });

  return {
    title: article.title,
    slug: article.slug,
    excerpt: article.summary,
    metaTitle: article.metaTitle,
    metaDescription: article.metaDescription,
    keywords: article.tags,
    content: [
      ...article.intro,
      ...article.sections.flatMap((section) => [section.heading, ...(section.paragraphs || []), ...(section.bullets || [])]),
      ...article.conclusion
    ].join('\n\n'),
    structuredContent: article,
    faq: article.faq,
    internalLinks,
    externalLinks,
    cta: article.cta,
    schema: {
      '@type': 'BlogPosting',
      headline: article.title,
      description: article.metaDescription,
      keywords: article.tags
    }
  };
}

export class ArticleFactoryService {
  static async dryRun(input = {}) {
    return this.run({ ...input, dryRun: true, persist: false, publishApproved: false });
  }

  static async run({
    topic,
    keyword,
    intent = 'guide',
    category = 'Educacao financeira',
    dryRun = false,
    persist = false,
    publishApproved = false,
    triggerSource = 'manual'
  } = {}) {
    const startedAt = Date.now();
    const cleanKeyword = repairPortugueseText(compact(keyword || topic));
    if (!cleanKeyword) throw new Error('keyword ou topic e obrigatorio');
    const cleanTopic = repairPortugueseText(compact(topic || cleanKeyword));
    const cleanCategory = repairPortugueseText(compact(category || 'Educacao financeira'));

    await logger.info('article_factory_started', {
      topic: cleanTopic,
      keyword: cleanKeyword,
      intent,
      category: cleanCategory,
      dryRun,
      persist,
      publishApproved,
      triggerSource
    });

    const serpIntelligence = await SerpIntelligenceService.analyzeKeyword({
      keyword: cleanKeyword,
      dryRun: dryRun || process.env.SERP_INTELLIGENCE_DRY_RUN === 'true'
    });
    const resolvedIntent = serpIntelligence.searchIntent || intent;
    const generated = await generateArticle({
      topic: cleanTopic,
      keyword: cleanKeyword,
      intent: resolvedIntent,
      category: cleanCategory,
      serpIntelligence
    });
    const idempotencyKey = toSlug(`${cleanKeyword}-${intent}-${cleanCategory}`);
    const slugState = dryRun
      ? { slug: generated.slug, existingArticle: null }
      : await ensureUniqueSlug({ slug: generated.slug, idempotencyKey });
    const image = await selectStockImage({
      keyword: cleanKeyword,
      topic: cleanTopic,
      title: generated.title,
      dryRun,
      reserveImage: persist
    });
    const article = {
      ...generated.structuredContent,
      slug: slugState.slug,
      routePath: `/blog/${slugState.slug}`,
      canonicalUrl: `${SITE_BASE_URL}/blog/${slugState.slug}/`,
      coverImage: image.coverImage,
      ogImage: image.ogImage,
      coverImageAlt: image.altText,
      imageAlt: image.altText,
      imageAttribution: image.attribution,
      factoryIdempotencyKey: idempotencyKey,
      factoryTriggerSource: triggerSource,
      sourceType: 'article-factory'
    };
    const structuredContent = buildStructuredContent({ article, image, keyword: cleanKeyword, intent: resolvedIntent, category: cleanCategory });
    const validation = validateArticle({
      article: structuredContent,
      internalLinks: structuredContent.internalLinks,
      image: {
        publicPath: image.coverImage,
        validationPassed: image.validationPassed,
        isFallback: false
      }
    });

    if (!image.validationPassed) validation.issues.push('Imagem obrigatoria ausente ou invalida');
    const topicFatigue = await EditorialTopicFatigueService.analyze({
      keyword: cleanKeyword,
      title: structuredContent.title || generated.title,
      category: cleanCategory,
      article: structuredContent
    });
    const publishSafety = buildPublishHardBlockers({
      article: structuredContent,
      validation,
      topicFatigue
    });
    const governance = await EditorialGovernanceService.evaluate({
      article: structuredContent,
      keyword: cleanKeyword,
      topic: cleanTopic,
      category: cleanCategory,
      intent: resolvedIntent,
      serpIntelligence,
      validation,
      topicFatigue,
      publishSafety,
      triggerSource,
      mode: publishApproved ? 'autopublish' : 'dry-run',
      publishApproved
    });
    const publishable = validation.passed && !publishSafety.blocked && governance.publishAllowed;

    const result = {
      ok: dryRun ? validation.passed : publishable,
      dryRun,
      persisted: false,
      status: publishApproved
        ? (publishable ? 'published' : governance.decision || 'draft_blocked')
        : 'draft',
      persistenceStatus: publishApproved && publishable ? 'published' : 'draft',
      slug: slugState.slug,
      title: article.title,
      image: {
        provider: image.provider,
        coverImage: image.coverImage,
        altText: image.altText
      },
      validation,
      topicFatigue,
      publishSafety,
      governance,
      serpIntelligence,
      article: {
        ...generated,
        slug: slugState.slug,
        coverImage: image.coverImage,
        ogImage: image.ogImage,
        structuredContent: {
          ...structuredContent,
          topicFatigue,
          publishSafety,
          editorialGovernance: governance
        }
      },
      durationMs: Date.now() - startedAt
    };

    if (persist) {
      const saved = await ArticleService.createOrUpdateGeneratedArticle({
        article: result.article,
        status: result.persistenceStatus,
        publishApproved: publishApproved && publishable,
        idempotencyKey
      });
      result.persisted = true;
      result.articleRecord = saved;
    }

    await logger.info('article_factory_finished', {
      slug: result.slug,
      ok: result.ok,
      persisted: result.persisted,
      status: result.status,
      imageProvider: result.image.provider,
      durationMs: result.durationMs
    });

    return result;
  }
}
