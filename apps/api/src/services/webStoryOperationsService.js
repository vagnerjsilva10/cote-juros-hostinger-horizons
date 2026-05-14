import { ContentOperationsEngine } from './contentOperationsEngine.js';
import { getPrisma } from '../lib/prisma.js';
import { PUBLIC_SITE_URL } from './editorialConfig.js';
import { buildStoryGenerationState } from './webStorySeoService.js';
import { WebStoryGenerationService } from './webStoryGenerationService.js';

const DEFAULT_WEB_STORY_LIMIT = 3;
const FIRST_RUN_LIMIT = 1;

const normalize = (value = '') =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

const toSlug = (value = '') =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

const numberScore = (...values) => {
  for (const value of values) {
    const numeric = Number(value);
    if (Number.isFinite(numeric)) return Math.max(0, Math.min(100, Math.round(numeric)));
  }
  return 90;
};

const getStructured = (record = {}) =>
  record.structuredContent && typeof record.structuredContent === 'object'
    ? record.structuredContent
    : {};

const hasPublishedStory = (record = {}) => {
  const structured = getStructured(record);
  return Boolean(
    structured.distribution?.webStory?.url ||
    structured.distribution?.webStory?.path ||
    structured.storyGeneration?.status === 'story_published'
  );
};

const detectType = (record = {}, structured = {}) => {
  const text = normalize([
    record.title,
    record.slug,
    structured.keyword,
    structured.category,
    structured.clusterLabel,
    structured.cluster,
  ].filter(Boolean).join(' '));
  const expandedText = normalize([
    text,
    record.excerpt,
    structured.summary,
  ].filter(Boolean).join(' '));

  if (/golpe|fraude|falso|pix errado|atendente do banco|boleto falso/.test(text)) return 'consumer_alert';
  if (/selic|nova regra|mudanca|noticia|anunciou|governo|banco central/.test(text)) return 'news_analysis';
  if (/checklist|passo a passo|como se proteger|o que fazer/.test(expandedText)) return 'topical_support';
  if (structured.refreshPlan || structured.contentType === 'content_refresh') return 'content_refresh';
  return structured.contentType || structured.type || 'evergreen_premium';
};

const detectCluster = (record = {}, structured = {}) => {
  const text = normalize([
    record.title,
    record.slug,
    structured.keyword,
    structured.cluster,
    structured.family,
    record.category?.name,
    record.cluster?.name,
  ].filter(Boolean).join(' '));

  if (/pix/.test(text) && /golpe|fraude|errado|falso/.test(text)) return 'golpes_pix';
  if (/golpe|fraude|falso|atendente/.test(text)) return 'golpes_bancarios';
  if (/cartao/.test(text)) return 'cartao';
  if (/emprestimo|credito/.test(text)) return 'credito_emprestimo';
  if (/inss|aposent/.test(text)) return 'inss';
  if (/fgts/.test(text)) return 'fgts';
  if (/selic|juros/.test(text)) return 'juros_selic';
  if (/superendivid|consumidor/.test(text)) return 'consumidor_financeiro';
  return structured.cluster || structured.family || record.cluster?.primaryKeyword || record.category?.slug || 'educacao_financeira';
};

const priorityFor = (article = {}) => {
  const text = normalize(`${article.title} ${article.slug} ${article.cluster} ${article.type}`);
  if (/consumer_alert|golpe|fraude|falso|pix/.test(text)) return 100;
  if (/news_analysis|selic|nova regra|mudanca|inss|fgts/.test(text)) return 88;
  if (/checklist|passo a passo|como se proteger|o que fazer/.test(text)) return 78;
  if (/consumidor|superendivid/.test(text)) return 70;
  return 48;
};

const toArticlePayload = (record) => {
  const structured = getStructured(record);
  const type = detectType(record, structured);
  const cluster = detectCluster(record, structured);
  const image = record.coverImage || structured.coverImage || record.ogImage || structured.ogImage || '';
  const quality = structured.qualityScore || structured.quality || {};
  const publishSafety = structured.publishSafety || {};
  const fingerprint = structured.structuralFingerprint || structured.fingerprint || {};
  const topicFatigue = structured.topicFatigue || publishSafety.topicFatigue || {};

  return {
    ...structured,
    id: record.id,
    slug: record.slug,
    title: record.title,
    h1: structured.h1 || record.title,
    keyword: structured.keyword || record.title,
    summary: record.excerpt || structured.summary || '',
    excerpt: record.excerpt || structured.summary || '',
    metaTitle: record.seoTitle || structured.metaTitle || record.title,
    metaDescription: record.seoDescription || structured.metaDescription || record.excerpt || '',
    category: record.category?.name || structured.category || '',
    clusterLabel: record.cluster?.name || structured.clusterLabel || cluster,
    clusterKeyword: record.cluster?.primaryKeyword || structured.clusterKeyword || cluster,
    coverImage: image,
    ogImage: record.ogImage || structured.ogImage || image,
    routePath: structured.routePath || `/blog/${record.slug}`,
    canonicalUrl: `${PUBLIC_SITE_URL}/blog/${record.slug}/`,
    tags: Array.isArray(structured.tags) ? structured.tags : [],
    intro: Array.isArray(structured.intro) ? structured.intro : [],
    sections: Array.isArray(structured.sections) ? structured.sections : [],
    conclusion: Array.isArray(structured.conclusion) ? structured.conclusion : [],
    type,
    cluster,
    family: structured.family || record.category?.slug || cluster,
    scores: {
      seo: numberScore(quality.serp_competitiveness_score, quality.seo, quality.total, structured.seoScore),
      eeat: numberScore(quality.expert_authority_score, quality.eeat, structured.eeatScore),
      humanization: numberScore(quality.human_readability_score, quality.humanization, structured.humanizationScore),
      originality: numberScore(quality.originality_score, quality.originality),
      fingerprintRisk: numberScore(
        fingerprint.fingerprintRisk,
        fingerprint.aiFootprintRiskScore,
        publishSafety.fingerprintRisk,
        18
      ),
      canibalization: numberScore(
        publishSafety.cannibalizationRisk,
        quality.canibalizationRisk,
        quality.cannibalizationRisk,
        12
      ),
      topicFatigue: numberScore(
        topicFatigue.topic_fatigue_score,
        topicFatigue.topicFatigueScore,
        publishSafety.topicFatigueScore,
        18
      ),
    },
  };
};

const todayKey = () => new Date().toISOString().slice(0, 10);

const safeLimit = (value = DEFAULT_WEB_STORY_LIMIT) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_WEB_STORY_LIMIT;
  return Math.min(DEFAULT_WEB_STORY_LIMIT, Math.round(parsed));
};

const toArticlePreview = (candidate = {}) => ({
  slug: candidate.targetSlug || String(candidate.keyword || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-'),
  title: candidate.title || candidate.keyword,
  h1: candidate.title || candidate.keyword,
  keyword: candidate.keyword,
  type: candidate.type,
  cluster: candidate.cluster,
  family: candidate.family,
  summary: candidate.reason || `Resumo editorial sobre ${candidate.keyword}`,
  metaDescription: candidate.reason || `Entenda ${candidate.keyword} com contexto e proximos passos.`,
  reason: candidate.reason,
  coverImage: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1200&q=80',
  ogImage: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1200&q=80',
  scores: candidate.scores || {},
  sections: [
    {
      heading: candidate.keyword,
      subheading: candidate.reason || 'O ponto principal para decidir sem pressa.',
      paragraphs: [candidate.reason || 'Veja os riscos, fontes e passos antes de agir.'],
      bullets: ['Confira a fonte oficial', 'Evite decisao por impulso'],
    },
    {
      heading: 'O que muda na pratica',
      subheading: 'A pergunta certa e como isso afeta o bolso, o prazo ou a seguranca.',
      paragraphs: ['A story deve resumir o impacto e levar ao artigo completo.'],
      bullets: ['Compare risco', 'Salve comprovantes quando houver golpe'],
    },
    {
      heading: 'Proximo passo seguro',
      subheading: 'Pausar, conferir e so entao decidir.',
      paragraphs: ['Esse fechamento evita promessa falsa e CTA agressivo.'],
      bullets: ['Leia o guia completo'],
    },
  ],
});

export class WebStoryOperationsService {
  static getConfig(env = process.env) {
    return {
      generationEnabled: env.WEB_STORY_GENERATION_ENABLED === 'true',
      publishEnabled: env.WEB_STORY_PUBLISH_ENABLED === 'true',
      indexEnabled: env.WEB_STORY_INDEX_ENABLED === 'true',
      dailyLimit: safeLimit(env.WEB_STORY_DAILY_LIMIT || DEFAULT_WEB_STORY_LIMIT),
    };
  }

  static async runSelectiveProduction({
    limit = null,
    firstRun = false,
    dryRun = false,
    includeRecent = 80,
    slug = '',
    force = false,
  } = {}) {
    const config = this.getConfig();
    const maxAllowed = safeLimit(limit || (firstRun ? FIRST_RUN_LIMIT : config.dailyLimit));
    const prisma = getPrisma();
    const day = todayKey();
    const allExistingStories = await this.loadExistingStories(prisma);
    const existingStories = force && slug
      ? allExistingStories.filter((story) => story.slug !== slug)
      : allExistingStories;
    const publishedToday = allExistingStories.filter((item) => item.publishedAtDate === day).length;
    const remainingToday = Math.max(0, config.dailyLimit - publishedToday);
    const effectiveLimit = Math.min(maxAllowed, remainingToday);

    const safety = {
      generationEnabled: config.generationEnabled,
      publishEnabled: config.publishEnabled,
      indexEnabled: config.indexEnabled,
      dailyLimit: config.dailyLimit,
      publishedToday,
      remainingToday,
      effectiveLimit,
      dryRun,
    };

    if (!config.generationEnabled) {
      return {
        ok: true,
        status: 'story_generation_disabled',
        ...this.securityState({ dryRun }),
        safety,
        published: [],
        blocked: [],
        skipped: [{ reason: 'WEB_STORY_GENERATION_ENABLED != true' }],
      };
    }

    if (!dryRun && !config.publishEnabled) {
      return {
        ok: true,
        status: 'story_publish_disabled',
        ...this.securityState({ dryRun }),
        safety,
        published: [],
        blocked: [],
        skipped: [{ reason: 'WEB_STORY_PUBLISH_ENABLED != true' }],
      };
    }

    if (effectiveLimit <= 0) {
      return {
        ok: true,
        status: 'daily_limit_reached',
        ...this.securityState({ dryRun }),
        safety,
        published: [],
        blocked: [],
        skipped: [{ reason: 'WEB_STORY_DAILY_LIMIT atingido' }],
      };
    }

    const records = await prisma.article.findMany({
      where: {
        status: 'published',
        ...(slug ? { slug } : {}),
      },
      include: { category: true, cluster: true, brief: true },
      orderBy: [{ publishedAt: 'desc' }, { updatedAt: 'desc' }],
      take: includeRecent,
    });

    const candidates = records
      .filter((record) => force || !hasPublishedStory(record))
      .map((record) => ({ record, article: toArticlePayload(record) }))
      .sort((a, b) => priorityFor(b.article) - priorityFor(a.article));

    const published = [];
    const blocked = [];
    const skipped = [];
    const history = existingStories.map((story) => ({
      slug: story.slug,
      title: story.title,
      slides: story.slides || [],
      cta: story.cta || {},
      visualSystem: story.visualSystem || {},
      cluster: story.cluster,
    }));

    for (const { record, article } of candidates) {
      if (published.length >= effectiveLimit) {
        skipped.push({ slug: record.slug, title: record.title, reason: 'slot_limit_reached' });
        continue;
      }

      const result = WebStoryGenerationService.generate({
        article,
        candidate: {
          keyword: article.keyword,
          title: article.title,
          type: article.type,
          cluster: article.cluster,
          family: article.family,
          scores: article.scores,
        },
        existingStories: history,
        history,
        dryRun,
        indexable: config.indexEnabled,
      });

      const item = this.toResultItem({ record, article, result });

      if (!result.ok) {
        blocked.push(item);
        this.logDecision('web_story_blocked', item);
        continue;
      }

      if (dryRun) {
        published.push({ ...item, status: 'story_would_publish' });
        history.push(this.toHistoryItem(result));
        this.logDecision('web_story_would_publish', item);
        continue;
      }

      const updated = await this.persistStory({ prisma, record, article, result, day });
      const persistedItem = {
        ...item,
        status: 'story_published',
        url: result.story.canonical,
        articleUrl: article.canonicalUrl,
        updatedAt: updated.updatedAt,
      };
      published.push(persistedItem);
      history.push(this.toHistoryItem(result));
      this.logDecision('web_story_published', persistedItem);
    }

    return {
      ok: true,
      status: published.length ? 'story_publication_completed' : 'no_story_published',
      ...this.securityState({ dryRun }),
      story_published: !dryRun && published.length > 0,
      story_indexed: !dryRun && config.indexEnabled && published.length > 0,
      safety,
      published,
      blocked,
      skipped,
      sitemap: `${PUBLIC_SITE_URL}/stories-sitemap.xml`,
    };
  }

  static async loadExistingStories(prisma = getPrisma()) {
    const records = await prisma.article.findMany({
      where: { status: 'published' },
      select: {
        slug: true,
        title: true,
        structuredContent: true,
      },
      orderBy: { updatedAt: 'desc' },
      take: 1000,
    });

    return records
      .map((record) => {
        const structured = getStructured(record);
        const story = structured.distribution?.webStory;
        if (!story?.url && !story?.path) return null;
        return {
          slug: record.slug,
          title: record.title,
          url: story.url,
          path: story.path,
          cluster: structured.storyGeneration?.cluster || structured.cluster,
          publishedAtDate: structured.storyGeneration?.publishedAtDate || '',
          slides: structured.storyGeneration?.storyPreview?.slides || [],
          cta: structured.storyGeneration?.storyPreview?.cta || {},
          visualSystem: structured.storyGeneration?.storyPreview?.visualSystem || {},
        };
      })
      .filter(Boolean);
  }

  static async persistStory({ prisma = getPrisma(), record = {}, article = {}, result = {}, day = todayKey() } = {}) {
    const structured = getStructured(record);
    const story = result.story || {};
    const storyState = {
      ...buildStoryGenerationState({
        status: 'story_published',
        reason: 'selective_production_web_story',
        url: story.canonical,
        canonical: story.canonical,
        validation: result.seoValidation,
      }),
      publishedAt: new Date().toISOString(),
      publishedAtDate: day,
      indexEnabled: story.indexable === true,
      originArticleSlug: record.slug,
      cluster: article.cluster,
      family: article.family,
      type: article.type,
      scores: result.validation?.scores || {},
      eligibility: result.eligibility || {},
      fingerprint: result.fingerprint || {},
      quality: result.quality || {},
      storyPreview: {
        slug: story.slug,
        title: story.title,
        canonical: story.canonical,
        slides: story.slides,
        cta: story.cta,
        visualSystem: story.visualSystem,
      },
    };

    const nextStructured = {
      ...structured,
      coverImage: article.coverImage || structured.coverImage,
      ogImage: article.ogImage || structured.ogImage,
      canonicalUrl: article.canonicalUrl,
      distribution: {
        ...(structured.distribution || {}),
        webStory: {
          status: 'published',
          source: 'selective_production_web_story',
          path: story.storyPublicPath,
          url: story.canonical,
          canonicalUrl: story.canonical,
          articleUrl: article.canonicalUrl,
          slideCount: story.slides?.length || 0,
          seoValidation: result.seoValidation,
          publishedAt: storyState.publishedAt,
        },
      },
      distributionAssets: {
        ...(structured.distributionAssets || {}),
        webStoryHtml: story.html,
        bookendJson: story.bookendJson,
        slides: story.slideAssets,
      },
      storyGeneration: storyState,
    };

    return prisma.article.update({
      where: { id: record.id },
      data: { structuredContent: nextStructured },
      select: { id: true, slug: true, updatedAt: true },
    });
  }

  static toResultItem({ record = {}, article = {}, result = {} } = {}) {
    return {
      slug: record.slug,
      title: record.title,
      articleUrl: article.canonicalUrl,
      storyUrl: result.story?.canonical || '',
      type: article.type,
      cluster: article.cluster,
      family: article.family,
      status: result.status,
      eligible: result.eligibility?.eligible || false,
      blockers: result.validation?.issues || result.eligibility?.blockers || [],
      scores: result.validation?.scores || {},
      seoValidation: result.seoValidation || null,
      eligibility: result.eligibility ? {
        webStoryEligibilityScore: result.eligibility.webStoryEligibilityScore,
        signals: result.eligibility.signals,
      } : null,
      fingerprint: result.fingerprint ? {
        webStoryFingerprintRisk: result.fingerprint.webStoryFingerprintRisk,
        visualRepetitionRisk: result.fingerprint.visualRepetitionRisk,
        narrativeRepetitionRisk: result.fingerprint.narrativeRepetitionRisk,
        templateRepetitionRisk: result.fingerprint.templateRepetitionRisk,
      } : null,
      quality: result.quality ? {
        passed: result.quality.passed,
        scores: result.quality.scores,
        signals: result.quality.signals,
      } : null,
      reason: result.ok
        ? 'alto potencial mobile/Discover com gates de SEO, Discover readiness e anti-footprint aprovados'
        : 'bloqueado por governanca seletiva de Web Stories',
    };
  }

  static toHistoryItem(result = {}) {
    return {
      slug: result.story?.slug,
      title: result.story?.title,
      slides: result.story?.slides || [],
      cta: result.story?.cta || {},
      visualSystem: result.story?.visualSystem || {},
      cluster: result.story?.cluster,
    };
  }

  static securityState({ dryRun = false } = {}) {
    return {
      dryRun,
      story_distributed: false,
      autonomous_real: false,
      commit: false,
      push: false,
      gitAddDot: false,
    };
  }

  static logDecision(event, payload = {}) {
    console.log(JSON.stringify({
      event,
      at: new Date().toISOString(),
      slug: payload.slug,
      storyUrl: payload.storyUrl || payload.url || '',
      cluster: payload.cluster,
      type: payload.type,
      status: payload.status,
      scores: payload.scores,
      blockers: payload.blockers || [],
    }));
  }

  static async simulate({
    days = 14,
    dailyTarget = 3,
    dryRun = true,
    useLiveDiscovery = false,
  } = {}) {
    const editorialSimulation = await ContentOperationsEngine.simulateWeek({
      days,
      dailyTarget,
      dryRun: true,
      useLiveDiscovery,
    });
    const history = [];
    const attempted = [];

    for (const day of editorialSimulation.days || []) {
      for (const candidate of day.selected || []) {
        const article = toArticlePreview(candidate);
        const result = WebStoryGenerationService.generate({
          article,
          candidate,
          existingStories: history,
          history,
          dryRun,
        });

        if (result.ok) {
          history.push({
            slug: result.story.slug,
            title: result.story.title,
            type: candidate.type,
            cluster: candidate.cluster,
            slides: result.story.slides,
            cta: result.story.cta,
            visualSystem: result.story.visualSystem,
          });
        }

        attempted.push({
          day: day.day,
          keyword: candidate.keyword,
          type: candidate.type,
          cluster: candidate.cluster,
          family: candidate.family,
          articleApproved: candidate.governance?.decision === 'publishable' || candidate.governance?.decision === 'publishable_refresh',
          storyStatus: result.status,
          eligible: result.eligibility?.eligible || false,
          webStoryEligibilityScore: result.eligibility?.webStoryEligibilityScore || 0,
          blockers: result.validation?.issues || result.eligibility?.blockers || [],
          scores: result.validation?.scores || {},
          story: result.story ? {
            slug: result.story.slug,
            canonical: result.story.canonical,
            articleUrl: result.story.articleUrl,
            headline: result.story.headline,
            cta: result.story.cta,
            slideCount: result.story.slides.length,
            slides: result.story.slides.map((slide) => ({
              kind: slide.kind,
              headline: slide.headline,
              subline: slide.subline,
              layout: slide.layout,
            })),
          } : null,
        });
      }
    }

    return {
      ok: true,
      dryRun,
      story_published: false,
      story_distributed: false,
      story_indexed: false,
      autonomous_real: false,
      commit: false,
      push: false,
      gitAddDot: false,
      editorialSimulation: {
        distribution: editorialSimulation.distribution,
        blockedSummary: editorialSimulation.blockedSummary,
      },
      summary: this.summarize(attempted),
      attempted,
      examples: attempted.filter((item) => item.storyStatus === 'story_preview_ready').slice(0, 3),
      blockedExamples: attempted.filter((item) => item.storyStatus !== 'story_preview_ready').slice(0, 8),
      readiness: this.assessReadiness(attempted),
    };
  }

  static summarize(attempted = []) {
    const generated = attempted.filter((item) => item.storyStatus === 'story_preview_ready');
    const blocked = attempted.filter((item) => item.storyStatus !== 'story_preview_ready');
    const byCluster = {};
    const byType = {};
    for (const item of generated) {
      byCluster[item.cluster] = (byCluster[item.cluster] || 0) + 1;
      byType[item.type] = (byType[item.type] || 0) + 1;
    }
    return {
      articlesEvaluated: attempted.length,
      eligibleArticles: attempted.filter((item) => item.eligible).length,
      storiesGenerated: generated.length,
      storiesBlocked: blocked.length,
      averageEligibilityScore: Math.round(attempted.reduce((sum, item) => sum + item.webStoryEligibilityScore, 0) / Math.max(1, attempted.length)),
      averageFingerprintRisk: Math.round(generated.reduce((sum, item) => sum + (item.scores.webStoryFingerprintRisk || 0), 0) / Math.max(1, generated.length)),
      byCluster,
      byType,
    };
  }

  static assessReadiness(attempted = []) {
    const summary = this.summarize(attempted);
    const generationRate = summary.articlesEvaluated ? summary.storiesGenerated / summary.articlesEvaluated : 0;
    const ready = generationRate >= 0.25 && summary.averageFingerprintRisk <= 28;
    return {
      productionReadiness: ready ? 'READY_FOR_ASSISTED_STORY_PREVIEW' : 'NOT_READY_FOR_REAL_STORY_PUBLISHING',
      autopublishReadiness: 'NO_GO',
      reasons: [
        ready ? 'ha volume seletivo suficiente para preview assistido' : 'volume/qualidade ainda insuficiente para story em escala',
        'stories continuam noindex/nofollow em dry-run',
        'publicacao real exige flag separada e sitemap especifico',
        'nao gerar story para todo artigo reduz risco de spam visual',
      ],
    };
  }
}

export default WebStoryOperationsService;
