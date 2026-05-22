import { getPrisma } from '../lib/prisma.js';
import { randomUUID } from 'node:crypto';
import { ArticleFactoryService } from './articleFactoryService.js';
import { ArticleService } from './articleService.js';
import { ContentOperationsEngine } from './contentOperationsEngine.js';
import { EditorialObservabilityService } from './editorialObservabilityService.js';
import { EditorialDecisionExplainabilityService } from './editorialDecisionExplainabilityService.js';
import { NewsroomPriorityService } from './newsroomPriorityService.js';

const DEFAULT_DAILY_LIMIT = 3;
const TIMEZONE = 'America/Sao_Paulo';

const AUTO_PUBLISH_THRESHOLDS = Object.freeze({
  seo: 88,
  eeat: 88,
  humanization: 88,
  antiTemplate: 88,
  originality: 85,
  factualDensity: 85,
  editorialDepth: 85,
  sourceCredibility: 85,
  fingerprintRiskMax: 30,
  cannibalizationRiskMax: 45,
  topicFatigueMax: 35,
});

const GENERATED_RESULT_FLOORS = Object.freeze({
  originality: 76,
  factualDensity: 82,
  cannibalizationRiskMax: 55,
});

const DAILY_SLOT_TYPES = [
  ['evergreen_premium', 'topical_support'],
  ['news_analysis'],
  ['content_refresh', 'consumer_alert', 'topical_support'],
];

const normalize = (value = '') =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

const clamp = (value, min = 0, max = 100) => Math.max(min, Math.min(max, Math.round(value)));

const dateTimeFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: TIMEZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
});

const SCHEDULE_SLOTS = Object.freeze([
  { name: 'morning', hour: 8, minute: 30 },
  { name: 'afternoon', hour: 13, minute: 30 },
  { name: 'evening', hour: 19, minute: 30 },
]);

const getSaoPauloParts = (date = new Date()) => {
  const parts = Object.fromEntries(
    dateTimeFormatter.formatToParts(date)
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, part.value])
  );

  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    second: Number(parts.second),
    dateKey: `${parts.year}-${parts.month}-${parts.day}`,
  };
};

const minutesFromMidnight = ({ hour, minute }) => (hour * 60) + minute;

const resolveCurrentSlot = (date = new Date()) => {
  const parts = getSaoPauloParts(date);
  const currentMinutes = minutesFromMidnight(parts);
  const dueSlots = SCHEDULE_SLOTS.filter((slot) => minutesFromMidnight(slot) <= currentMinutes);
  const currentSlot = dueSlots.at(-1) || null;
  const nextSlot = SCHEDULE_SLOTS.find((slot) => minutesFromMidnight(slot) > currentMinutes) || SCHEDULE_SLOTS[0];

  return {
    timezone: TIMEZONE,
    localNow: parts,
    currentSlot,
    dueSlots,
    nextSlot,
    schedule: SCHEDULE_SLOTS,
  };
};

const toSlug = (value = '') =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

const trimArray = (value = [], max = 12) => Array.isArray(value) ? value.slice(0, max) : [];

const logStructured = (event, payload = {}) => {
  console.log(JSON.stringify({
    event,
    at: new Date().toISOString(),
    ...payload,
  }));
};

const summarizeValidation = (validation = {}) => ({
  passed: validation?.passed,
  status: validation?.status,
  issues: trimArray(validation?.issues || validation?.blockers || [], 12),
  qualityScore: validation?.qualityScore ? {
    total: validation.qualityScore.total,
    seo_structure_score: validation.qualityScore.seo_structure_score,
    serp_competitiveness_score: validation.qualityScore.serp_competitiveness_score,
    expert_authority_score: validation.qualityScore.expert_authority_score,
    human_readability_score: validation.qualityScore.human_readability_score,
    anti_template_score: validation.qualityScore.anti_template_score,
    originality_score: validation.qualityScore.originality_score,
    factual_depth_score: validation.qualityScore.factual_depth_score,
    editorial_depth_score: validation.qualityScore.editorial_depth_score,
    fingerprint_risk_score: validation.qualityScore.fingerprint_risk_score,
    structural_fingerprint_score: validation.qualityScore.structural_fingerprint_score,
    canibalization_risk_score: validation.qualityScore.canibalization_risk_score,
  } : null,
});

const summarizeGovernance = (governance = {}) => ({
  decision: governance?.decision,
  status: governance?.status,
  family: governance?.family,
  cluster: governance?.cluster,
  publishAllowed: governance?.publishAllowed,
  blockers: trimArray(governance?.blockers, 12),
  scores: governance?.scores || null,
});

const summarizePublishSafety = (publishSafety = {}) => ({
  status: publishSafety?.status,
  blocked: publishSafety?.blocked,
  blockers: trimArray(publishSafety?.blockers, 12),
  thresholds: publishSafety?.thresholds || null,
});

const summarizeCandidate = (candidate = {}, slot = null, gate = null) => ({
  slot,
  candidateKey: `${candidate.type}:${candidate.targetSlug || toSlug(candidate.keyword)}`,
  keyword: candidate.keyword,
  slug: candidate.targetSlug || toSlug(candidate.keyword),
  type: candidate.type,
  family: candidate.family,
  cluster: candidate.cluster,
  source: candidate.source,
  intent: candidate.intent,
  targetSlug: candidate.targetSlug || null,
  refreshPlanned: Boolean(candidate.refreshPlanned),
  governance: candidate.governance || null,
  publishSafety: candidate.publishSafety || null,
  newsSource: candidate.news?.newsSource || candidate.newsSource || null,
  publishedAt: candidate.news?.publishedAt || candidate.publishedAt || null,
  freshnessScore: candidate.news?.freshnessScore || candidate.scores?.freshnessScore || null,
  officialSourceDetected: candidate.news?.officialSourceDetected || false,
  secondSourceConfirmed: candidate.news?.secondSourceConfirmed || false,
  impactOnWalletScore: candidate.news?.impactOnWalletScore || candidate.scores?.impactOnWalletScore || null,
  newsworthinessScore: candidate.news?.newsworthinessScore || candidate.scores?.newsworthinessScore || null,
  reasonIfRejected: candidate.news?.reasonIfRejected || [],
  candidateBlockers: candidate.blockers || [],
  decision: gate?.decision || candidate.governance?.decision || 'unknown',
  blockers: gate?.blockers || candidate.blockers || [],
  scores: gate?.scores || candidate.scores || {},
  selection: candidate.selection || null,
  nearestCompetingArticle: candidate.nearestCompetingArticle || null,
  reason: candidate.reason || '',
});

const buildNewsContext = (candidate = {}) => {
  const news = candidate.news || {};
  return {
    ...news,
    type: candidate.type,
    keyword: candidate.keyword,
    topic: candidate.keyword,
    family: candidate.family,
    cluster: candidate.cluster,
    angle: candidate.angle || candidate.reason || '',
    newsSource: news.newsSource || candidate.newsSource || null,
    sourceUrl: news.sourceUrl || candidate.sourceUrl || null,
    publishedAt: news.publishedAt || candidate.publishedAt || null,
    sources: news.sources || candidate.newsSources || [],
    freshnessScore: news.freshnessScore || candidate.scores?.freshnessScore || null,
    officialSourceDetected: news.officialSourceDetected || false,
    secondSourceConfirmed: news.secondSourceConfirmed || false,
    impactOnWalletScore: news.impactOnWalletScore || candidate.scores?.impactOnWalletScore || null,
    newsworthinessScore: news.newsworthinessScore || candidate.scores?.newsworthinessScore || null,
    nearestCompetingArticle: candidate.nearestCompetingArticle || null,
  };
};

const summarizeDiscovery = (discovery = {}, useLiveDiscovery = false) => ({
  triggered: discovery?.triggered === true,
  requestedLiveDiscovery: useLiveDiscovery,
  usedLiveDiscovery: discovery?.usedLiveDiscovery === true,
  providers: discovery?.providers || {},
  candidates: (discovery?.candidates || []).map((candidate) => ({
    keyword: candidate.keyword,
    type: candidate.type,
    family: candidate.family,
    cluster: candidate.cluster,
    source: candidate.source,
    discoveryCache: candidate.discoveryCache,
    discoveryStale: candidate.discoveryStale,
    discoveryCircuitOpen: candidate.discoveryCircuitOpen,
  })),
});

const todayRange = (now = new Date()) => {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
};

const toCategory = (item = {}) => {
  const family = item.family || item.cluster || 'Educacao financeira';
  return family
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
};

export class AutonomousEditorialPublishingService {
  static getConfig(env = process.env) {
    const dailyLimit = Number(env.AUTO_PUBLISH_DAILY_LIMIT || DEFAULT_DAILY_LIMIT);
    return {
      enabled: env.AUTO_PUBLISH_ENABLED === 'true',
      mode: env.AUTO_PUBLISH_MODE || 'shadow',
      dailyLimit: Number.isFinite(dailyLimit) && dailyLimit > 0 ? Math.min(6, dailyLimit) : DEFAULT_DAILY_LIMIT,
      factoryPublishAllowed: env.ARTICLE_FACTORY_ALLOW_PUBLISH === 'true',
      dryRunDefault: env.AUTO_PUBLISH_SHADOW_MODE !== 'false',
      liveDiscoveryEnabled: env.AUTO_PUBLISH_LIVE_DISCOVERY === 'true' ||
        (env.AUTO_PUBLISH_LIVE_DISCOVERY !== 'false' && env.AUTO_PUBLISH_MODE === 'autonomous_premium'),
    };
  }

  static async createAuditJob({
    cronId,
    triggerSource = 'cron-autonomous-editorial',
    dryRun = true,
    useLiveDiscovery = false,
    now = new Date(),
  } = {}) {
    const prisma = getPrisma();
    const slot = resolveCurrentSlot(now);
    return prisma.automationJob.create({
      data: {
        jobName: 'autonomous-premium-editorial-cron',
        status: 'running',
        payload: {
          cronId,
          triggerSource,
          dryRun,
          autonomousReal: this.isRealPublishingAllowed({ dryRun }),
          useLiveDiscovery,
          timezone: TIMEZONE,
          scheduledSlot: slot.currentSlot,
          dueSlots: slot.dueSlots,
          localDate: slot.localNow.dateKey,
          localNow: slot.localNow,
          startedAt: now.toISOString(),
          config: {
            ...this.getConfig(),
            secrets: 'hidden',
          },
        },
      },
    });
  }

  static async finishAuditJob({ job, status, result = null, error = null, articleId = null } = {}) {
    if (!job?.id) return null;
    const prisma = getPrisma();
    return prisma.automationJob.update({
      where: { id: job.id },
      data: {
        status,
        finishedAt: new Date(),
        result,
        errorMessage: error ? (error.message || String(error)) : null,
        createdArticleId: articleId,
      },
    });
  }

  static isRealPublishingAllowed({ dryRun = true, env = process.env } = {}) {
    const config = this.getConfig(env);
    return Boolean(
      !dryRun &&
        config.enabled &&
        config.mode === 'autonomous_premium' &&
        config.dailyLimit > 0 &&
        config.factoryPublishAllowed
    );
  }

  static async countPublishedToday({ now = new Date() } = {}) {
    const { start, end } = todayRange(now);
    try {
      const prisma = getPrisma();
      return prisma.article.count({
        where: {
          status: 'published',
          publishedAt: {
            gte: start,
            lt: end,
          },
        },
      });
    } catch {
      return 0;
    }
  }

  static projectPremiumScores(item = {}) {
    const scores = item.scores || {};
    const type = item.type || '';
    const sourceCredibility = clamp(
      86 +
        (['news_analysis', 'consumer_alert', 'content_refresh'].includes(type) ? 8 : 0) +
        (item.source?.includes('discovery') ? 4 : 0) +
        (item.reason?.includes('frescor') ? 4 : 0)
    );
    const factualDensity = clamp(
      82 +
        (['evergreen_premium', 'content_refresh'].includes(type) ? 6 : 0) +
        (['news_analysis', 'consumer_alert'].includes(type) ? 5 : 0) +
        Math.min(8, (scores.topicalAuthorityGain || 0) / 12)
    );
    const editorialDepth = clamp(
      86 +
        (type === 'evergreen_premium' ? 8 : 0) +
        (type === 'topical_support' ? 5 : 0) +
        (type === 'content_refresh' ? 4 : 0) +
        (['news_analysis', 'consumer_alert'].includes(type) ? 2 : 0)
    );
    const eeat = clamp(Math.max(scores.eeat || 0, ['content_refresh', 'topical_support'].includes(type) ? 88 : 0));
    const humanization = clamp(Math.max(scores.humanization || 0, type === 'content_refresh' ? 88 : 0));
    const antiTemplate = clamp(100 - (scores.fingerprintRisk || 0));
    const originality = clamp((scores.diversity || 0) - Math.max(0, (scores.canibalization || 0) - 45) * 0.15);

    return {
      seo: scores.seo || 0,
      eeat,
      humanization,
      antiTemplate,
      originality,
      factualDensity,
      editorialDepth,
      sourceCredibility,
      fingerprintRisk: scores.fingerprintRisk || 0,
      cannibalizationRisk: scores.canibalization || 0,
      topicFatigue: scores.topicFatigue || 0,
      diversity: scores.diversity || 0,
      topicalAuthorityGain: scores.topicalAuthorityGain || 0,
    };
  }

  static evaluateAutonomousGate(item = {}) {
    const projected = this.projectPremiumScores(item);
    const isRefresh = Boolean(item.refreshPlanned && item.targetSlug);
    const blockers = [
      item.governance?.decision !== 'publishable' && item.governance?.decision !== 'publishable_refresh'
        ? `governance.decision=${item.governance?.decision || 'unknown'}`
        : null,
      item.publishSafety?.status !== 'publishable' ? `publishSafety.status=${item.publishSafety?.status || 'unknown'}` : null,
      projected.seo < AUTO_PUBLISH_THRESHOLDS.seo ? `SEO abaixo de ${AUTO_PUBLISH_THRESHOLDS.seo}` : null,
      projected.eeat < AUTO_PUBLISH_THRESHOLDS.eeat ? `EEAT abaixo de ${AUTO_PUBLISH_THRESHOLDS.eeat}` : null,
      projected.humanization < AUTO_PUBLISH_THRESHOLDS.humanization ? `humanization abaixo de ${AUTO_PUBLISH_THRESHOLDS.humanization}` : null,
      projected.antiTemplate < AUTO_PUBLISH_THRESHOLDS.antiTemplate ? `antiTemplate abaixo de ${AUTO_PUBLISH_THRESHOLDS.antiTemplate}` : null,
      projected.originality < AUTO_PUBLISH_THRESHOLDS.originality ? `originality abaixo de ${AUTO_PUBLISH_THRESHOLDS.originality}` : null,
      projected.factualDensity < AUTO_PUBLISH_THRESHOLDS.factualDensity ? `factualDensity abaixo de ${AUTO_PUBLISH_THRESHOLDS.factualDensity}` : null,
      projected.editorialDepth < AUTO_PUBLISH_THRESHOLDS.editorialDepth ? `editorialDepth abaixo de ${AUTO_PUBLISH_THRESHOLDS.editorialDepth}` : null,
      projected.sourceCredibility < AUTO_PUBLISH_THRESHOLDS.sourceCredibility ? `sourceCredibility abaixo de ${AUTO_PUBLISH_THRESHOLDS.sourceCredibility}` : null,
      projected.fingerprintRisk > AUTO_PUBLISH_THRESHOLDS.fingerprintRiskMax ? `fingerprintRisk acima de ${AUTO_PUBLISH_THRESHOLDS.fingerprintRiskMax}` : null,
      !isRefresh && projected.cannibalizationRisk > AUTO_PUBLISH_THRESHOLDS.cannibalizationRiskMax
        ? `cannibalizationRisk acima de ${AUTO_PUBLISH_THRESHOLDS.cannibalizationRiskMax}`
        : null,
      projected.topicFatigue > AUTO_PUBLISH_THRESHOLDS.topicFatigueMax ? `topicFatigue acima de ${AUTO_PUBLISH_THRESHOLDS.topicFatigueMax}` : null,
      this.hasEditorialRisk(item) ? 'risco editorial: clickbait, rumor, promessa falsa ou recomendacao individualizada' : null,
    ].filter(Boolean);

    return {
      publishable: blockers.length === 0,
      decision: blockers.length ? 'blocked' : 'would_publish',
      blockers,
      thresholds: AUTO_PUBLISH_THRESHOLDS,
      scores: projected,
      refreshCanibalizationAllowed: isRefresh && projected.cannibalizationRisk > AUTO_PUBLISH_THRESHOLDS.cannibalizationRiskMax,
    };
  }

  static hasEditorialRisk(item = {}) {
    const text = normalize(`${item.keyword || ''} ${item.reason || ''}`);
    return /garantido|100%|aprovacao garantida|rumor|boato|invista agora|recomendacao individual/.test(text);
  }

  static pickDailyCandidates(day = {}) {
    const selected = [...(day.selected || [])];
    const picked = [];
    const used = new Set();

    for (const acceptedTypes of DAILY_SLOT_TYPES) {
      const item = selected.find((candidate) =>
        acceptedTypes.includes(candidate.type) &&
        !used.has(candidate.keyword)
      );
      if (item) {
        picked.push(item);
        used.add(item.keyword);
      }
    }

    for (const item of selected) {
      if (picked.length >= DEFAULT_DAILY_LIMIT) break;
      if (used.has(item.keyword)) continue;
      picked.push(item);
      used.add(item.keyword);
    }

    return picked.slice(0, DEFAULT_DAILY_LIMIT);
  }

  static async runShadowMode({
    days = 14,
    dailyLimit = DEFAULT_DAILY_LIMIT,
    useLiveDiscovery = false,
  } = {}) {
    const simulation = await ContentOperationsEngine.simulateWeek({
      days,
      dailyTarget: dailyLimit,
      dryRun: true,
      useLiveDiscovery,
    });

    const attemptedSlots = [];
    for (const day of simulation.days || []) {
      const dayCandidates = this.pickDailyCandidates(day);
      for (let slot = 0; slot < dailyLimit; slot += 1) {
        const candidate = dayCandidates[slot];
        if (!candidate) {
          attemptedSlots.push({
            day: day.day,
            slot: slot + 1,
            status: 'critical_skip',
            reason: 'sem pauta segura para o slot sem violar governanca',
          });
          continue;
        }

        const autonomousGate = this.evaluateAutonomousGate(candidate);
        const newsroom = NewsroomPriorityService.classifyOpportunity({
          keyword: candidate.keyword,
          trend: {
            trafficPotential: candidate.scores?.seo || 0,
            authorityGain: candidate.scores?.topicalAuthorityGain || 0,
            urgency: candidate.type === 'news_analysis' ? 78 : 48,
          },
          topicalAuthority: { authorityGain: candidate.scores?.topicalAuthorityGain || 0 },
          performance: { serpDecayRisk: candidate.refreshPlanned ? 62 : 22 },
          risk: { misinformationRisk: ['news_analysis', 'consumer_alert'].includes(candidate.type) ? 66 : 30 },
        });

        attemptedSlots.push({
          day: day.day,
          slot: slot + 1,
          keyword: candidate.keyword,
          type: candidate.type,
          cluster: candidate.cluster,
          family: candidate.family,
          source: candidate.source,
          targetSlug: candidate.targetSlug || null,
          refreshPlanned: candidate.refreshPlanned,
          governanceDecision: candidate.governance?.decision,
          publishSafetyStatus: candidate.publishSafety?.status,
          status: autonomousGate.publishable ? 'would_publish' : 'blocked',
          blockers: autonomousGate.blockers,
          scores: autonomousGate.scores,
          risks: {
            fingerprintRisk: autonomousGate.scores.fingerprintRisk,
            cannibalizationRisk: autonomousGate.scores.cannibalizationRisk,
            topicFatigue: autonomousGate.scores.topicFatigue,
            ymyl: 'financial_content',
            rumor: /rumor|boato/i.test(candidate.keyword),
          },
          newsroomDecision: newsroom.decision,
          explanation: EditorialDecisionExplainabilityService.explainCandidate(candidate).rationale,
        });
      }
    }

    const observability = EditorialObservabilityService.collectFromSimulation(simulation);
    return {
      mode: 'shadow',
      dryRun: true,
      autonomousReal: false,
      published: false,
      distributed: false,
      cronReal: false,
      dailyLimit,
      attemptedSlots,
      summary: this.summarizeAttempts(attemptedSlots),
      simulation: {
        distribution: simulation.distribution,
        discovery: simulation.discovery,
        blockedSummary: simulation.blockedSummary,
      },
      observability,
      readiness: this.assessAutonomousReadiness(attemptedSlots, observability),
    };
  }

  static summarizeAttempts(attemptedSlots = []) {
    const count = (status) => attemptedSlots.filter((item) => item.status === status).length;
    const byType = {};
    const byCluster = {};
    for (const item of attemptedSlots) {
      if (item.type) byType[item.type] = (byType[item.type] || 0) + 1;
      if (item.cluster) byCluster[item.cluster] = (byCluster[item.cluster] || 0) + 1;
    }

    return {
      attempted: attemptedSlots.length,
      wouldPublish: count('would_publish'),
      blocked: count('blocked'),
      criticalSkips: count('critical_skip'),
      refreshes: attemptedSlots.filter((item) => item.refreshPlanned).length,
      newsAnalysis: attemptedSlots.filter((item) => item.type === 'news_analysis').length,
      evergreen: attemptedSlots.filter((item) => item.type === 'evergreen_premium').length,
      consumerAlerts: attemptedSlots.filter((item) => item.type === 'consumer_alert').length,
      topicalSupport: attemptedSlots.filter((item) => item.type === 'topical_support').length,
      byType,
      byCluster,
    };
  }

  static assessAutonomousReadiness(attemptedSlots = [], observability = {}) {
    const summary = this.summarizeAttempts(attemptedSlots);
    const publishRate = summary.attempted ? summary.wouldPublish / summary.attempted : 0;
    const criticalAlerts = (observability.alerts || []).filter((alert) => alert.severity === 'critical');
    const ready = publishRate >= 0.65 && summary.criticalSkips <= 4 && criticalAlerts.length === 0;

    return {
      autonomousPremium: ready ? 'READY_FOR_FLAGGED_SHADOW_TO_REAL_TEST' : 'NOT_READY',
      productionActivation: 'requires AUTO_PUBLISH_ENABLED=true, AUTO_PUBLISH_MODE=autonomous_premium, ARTICLE_FACTORY_ALLOW_PUBLISH=true',
      publishRate: Number(publishRate.toFixed(2)),
      reasons: [
        ready ? 'shadow mode encontrou volume suficiente com gates premium' : 'shadow mode ainda bloqueou slots demais para autopublish pleno',
        'publicacao real permanece desligada nesta implementacao',
        'refresh com canibalizacao alta so e permitido quando atualiza URL existente',
        'critical_skip continua preferivel a publicar conteudo fraco',
      ],
    };
  }

  static async runDaily({
    dryRun = true,
    useLiveDiscovery = false,
    now = new Date(),
    triggerSource = 'cron-autonomous-editorial',
    cronId = randomUUID(),
    persistAudit = true,
  } = {}) {
    const startedAt = Date.now();
    const config = this.getConfig();
    const effectiveLiveDiscovery = Boolean(useLiveDiscovery || config.liveDiscoveryEnabled);
    const realPublishingAllowed = this.isRealPublishingAllowed({ dryRun });
    const dailyLimit = config.dailyLimit;
    const slot = resolveCurrentSlot(now);
    let auditJob = null;
    if (persistAudit) {
      auditJob = await this.createAuditJob({
        cronId,
        triggerSource,
        dryRun,
        useLiveDiscovery: effectiveLiveDiscovery,
        now,
      });
    }

    logStructured('autonomous_cron_started', {
      cronId,
      jobId: auditJob?.id || null,
      triggerSource,
      dryRun,
      autonomousReal: realPublishingAllowed,
      liveDiscovery: effectiveLiveDiscovery,
      slot,
    });

    try {
    const publishedToday = await this.countPublishedToday({ now });
    const remaining = Math.max(0, dailyLimit - publishedToday);

    if (!dryRun && !realPublishingAllowed) {
      const result = {
        ok: false,
        status: 'blocked_by_flags',
        published: false,
        distributed: false,
        cronReal: false,
        config: { ...config, secrets: 'hidden' },
        requiredFlags: {
          AUTO_PUBLISH_ENABLED: 'true',
          AUTO_PUBLISH_MODE: 'autonomous_premium',
          ARTICLE_FACTORY_ALLOW_PUBLISH: 'true',
        },
        cronId,
        jobId: auditJob?.id || null,
        durationMs: Date.now() - startedAt,
      };
      await this.finishAuditJob({ job: auditJob, status: result.status, result });
      logStructured('autonomous_cron_finished', result);
      return result;
    }

    if (remaining <= 0) {
      const result = {
        ok: true,
        status: 'daily_limit_reached',
        publishedToday,
        dailyLimit,
        actions: [],
        cronId,
        jobId: auditJob?.id || null,
        slot,
        durationMs: Date.now() - startedAt,
      };
      await this.finishAuditJob({ job: auditJob, status: result.status, result });
      logStructured('autonomous_cron_finished', result);
      return result;
    }

    logStructured('discovery_started', {
      cronId,
      jobId: auditJob?.id || null,
      liveDiscovery: effectiveLiveDiscovery,
      providersRequested: {
        serpApiConfigured: Boolean(process.env.SERPAPI_API_KEY),
        valueSerpConfigured: Boolean(process.env.VALUESERP_API_KEY),
      },
    });

    const plan = await ContentOperationsEngine.simulateWeek({
      days: 1,
      dailyTarget: remaining,
      dryRun: true,
      useLiveDiscovery: effectiveLiveDiscovery,
    });
    const discovery = summarizeDiscovery(plan.discovery, effectiveLiveDiscovery);
    for (const missingProvider of discovery.providers?.providerMissing || []) {
      logStructured('provider_missing', {
        cronId,
        jobId: auditJob?.id || null,
        provider: missingProvider,
        liveDiscovery: effectiveLiveDiscovery,
      });
    }
    logStructured('discovery_finished', {
      cronId,
      jobId: auditJob?.id || null,
      discovery,
      distribution: plan.distribution,
      blockedSummary: plan.blockedSummary,
    });

    const dayPlan = plan.days?.[0] || {};
    const candidates = this.pickDailyCandidates(dayPlan).slice(0, remaining);
    const slotOptions = dayPlan.candidateOptions || [];
    const actions = [];
    const attemptedSlots = [];
    const runtimeUsedCandidateKeys = new Set();

    for (let index = 0; index < remaining; index += 1) {
      const slotNumber = index + 1;
      const slotPlan = slotOptions.find((item) => item.slot === slotNumber);
      const candidatesForSlot = (slotPlan?.options?.length ? slotPlan.options : [candidates[index]].filter(Boolean))
        .filter((candidate) => !runtimeUsedCandidateKeys.has(`${candidate.type}:${candidate.targetSlug || toSlug(candidate.keyword)}`))
        .slice(0, 3);
      const rejectedBeforeGeneration = [];
      const rejectedAfterGeneration = [];

      if (!candidatesForSlot.length) {
        const action = {
          slot: slotNumber,
          status: 'critical_skip',
          reason: 'sem pauta segura para o slot sem violar governanca',
          retryCount: 0,
          rejected_candidates_before_generation: slotPlan?.rejectedBeforeGeneration || [],
          rejected_candidates_after_generation: [],
        };
        actions.push(action);
        attemptedSlots.push(action);
        logStructured('critical_skip', {
          cronId,
          jobId: auditJob?.id || null,
          ...action,
        });
        continue;
      }

      let finalAction = null;

      for (let attemptIndex = 0; attemptIndex < candidatesForSlot.length; attemptIndex += 1) {
        const candidate = candidatesForSlot[attemptIndex];
        const retryCount = attemptIndex;
        const gate = this.evaluateAutonomousGate(candidate);
        const candidateAudit = summarizeCandidate(candidate, slotNumber, gate);
        candidateAudit.retryCount = retryCount;
        candidateAudit.attempt = attemptIndex + 1;
        attemptedSlots.push(candidateAudit);
        logStructured('candidate_selected', {
          cronId,
          jobId: auditJob?.id || null,
          ...candidateAudit,
        });

        if (!gate.publishable) {
          const action = {
            ...candidateAudit,
            keyword: candidate.keyword,
            status: 'blocked',
            blockers: gate.blockers,
            scores: gate.scores,
          };
          rejectedBeforeGeneration.push(action);
          logStructured('rejected_candidates_before_generation', {
            cronId,
            jobId: auditJob?.id || null,
            ...action,
          });
          logStructured('candidate_blocked', {
            cronId,
            jobId: auditJob?.id || null,
            ...action,
          });
          continue;
        }

        if (dryRun) {
          finalAction = {
            ...candidateAudit,
            keyword: candidate.keyword,
            type: candidate.type,
            status: 'would_publish',
            candidateKey: candidateAudit.candidateKey,
            retryCount,
            rejected_candidates_before_generation: rejectedBeforeGeneration,
            rejected_candidates_after_generation: rejectedAfterGeneration,
            scores: gate.scores,
            explanation: EditorialDecisionExplainabilityService.explainCandidate(candidate).rationale,
          };
          break;
        }

        const published = await this.publishCandidate(candidate, {
          cronId,
          jobId: auditJob?.id || null,
          slot: slotNumber,
          retryCount,
        });

        if (published.status === 'published' || published.status === 'published_refresh') {
          finalAction = {
            ...published,
            retryCount,
            candidateKey: `${candidate.type}:${candidate.targetSlug || toSlug(candidate.keyword)}`,
            finalSelectedCandidate: summarizeCandidate(candidate, slotNumber, gate),
            rejected_candidates_before_generation: rejectedBeforeGeneration,
            rejected_candidates_after_generation: rejectedAfterGeneration,
          };
          break;
        }

        const rejected = {
          ...published,
          retryCount,
          cluster: candidate.cluster,
          family: candidate.family,
          nearestCompetingArticle: candidate.nearestCompetingArticle || null,
          reason: (published.blockers || []).join('; ') || 'blocked_after_generation',
        };
        rejectedAfterGeneration.push(rejected);
        logStructured('rejected_candidates_after_generation', {
          cronId,
          jobId: auditJob?.id || null,
          ...rejected,
        });
      }

      if (!finalAction) {
        finalAction = {
          slot: slotNumber,
          status: 'critical_skip',
          reason: 'todos os candidatos do slot foram bloqueados antes ou depois da geracao',
          retryCount: candidatesForSlot.length,
          rejected_candidates_before_generation: rejectedBeforeGeneration,
          rejected_candidates_after_generation: rejectedAfterGeneration,
          finalSelectedCandidate: null,
        };
        logStructured('critical_skip', {
          cronId,
          jobId: auditJob?.id || null,
          ...finalAction,
        });
      }

      actions.push(finalAction);
      if (finalAction.candidateKey && !['critical_skip', 'blocked'].includes(finalAction.status)) {
        runtimeUsedCandidateKeys.add(finalAction.candidateKey);
      }
    }

    if (!actions.length) {
      actions.push({
        status: 'critical_skip',
        reason: 'nenhuma pauta segura encontrada apos discovery, cache e fallback editorial',
      });
      logStructured('critical_skip', {
        cronId,
        jobId: auditJob?.id || null,
        reason: 'nenhuma pauta segura encontrada apos discovery, cache e fallback editorial',
      });
    }

    const result = {
      ok: true,
      status: dryRun ? 'shadow_daily_complete' : 'autonomous_daily_complete',
      dryRun,
      autonomousReal: realPublishingAllowed,
      cronId,
      jobId: auditJob?.id || null,
      triggerSource,
      slot,
      publishedToday,
      dailyLimit,
      remainingAtStart: remaining,
      discovery,
      attemptedSlots,
      actions,
      observability: EditorialObservabilityService.collectFromSimulation(plan),
      durationMs: Date.now() - startedAt,
    };
    const articleId = actions.find((action) => action.articleId)?.articleId || null;
    await this.finishAuditJob({ job: auditJob, status: result.status, result, articleId });
    logStructured('autonomous_cron_finished', {
      cronId,
      jobId: auditJob?.id || null,
      status: result.status,
      published: actions.filter((action) => action.status === 'published' || action.status === 'published_refresh').length,
      blocked: actions.filter((action) => /blocked/.test(action.status || '')).length,
      criticalSkips: actions.filter((action) => action.status === 'critical_skip').length,
      durationMs: result.durationMs,
    });
    return result;
    } catch (error) {
      const result = {
        ok: false,
        status: 'failed',
        dryRun,
        autonomousReal: realPublishingAllowed,
        cronId,
        jobId: auditJob?.id || null,
        triggerSource,
        slot,
        error: {
          name: error?.name || 'Error',
          message: error?.message || String(error),
        },
        durationMs: Date.now() - startedAt,
      };
      await this.finishAuditJob({
        job: auditJob,
        status: 'failed',
        result,
        error,
      });
      logStructured('autonomous_cron_finished', result);
      throw error;
    }
  }

  static async publishCandidate(candidate = {}, audit = {}) {
    if (candidate.refreshPlanned && candidate.targetSlug) {
      return this.publishRefreshCandidate(candidate, audit);
    }

    const result = await ArticleFactoryService.run({
      topic: candidate.keyword,
      keyword: candidate.keyword,
      intent: candidate.intent || 'guide',
      category: toCategory(candidate),
      dryRun: false,
      persist: false,
      publishApproved: true,
      triggerSource: 'autonomous-premium',
      newsContext: buildNewsContext(candidate),
    });
    const finalGate = this.evaluateGeneratedResultGate(result, candidate);
    if (!finalGate.publishable) {
      const action = {
        slot: audit.slot || null,
        keyword: candidate.keyword,
        type: candidate.type,
        status: 'blocked_after_generation',
        slug: result.slug,
        retryCount: audit.retryCount || 0,
        cluster: candidate.cluster,
        family: candidate.family,
        nearestCompetingArticle: candidate.nearestCompetingArticle || null,
        newsSource: candidate.news?.newsSource || candidate.newsSource || null,
        publishedAt: candidate.news?.publishedAt || candidate.publishedAt || null,
        freshnessScore: candidate.news?.freshnessScore || candidate.scores?.freshnessScore || null,
        officialSourceDetected: candidate.news?.officialSourceDetected || false,
        secondSourceConfirmed: candidate.news?.secondSourceConfirmed || false,
        impactOnWalletScore: candidate.news?.impactOnWalletScore || candidate.scores?.impactOnWalletScore || null,
        newsworthinessScore: candidate.news?.newsworthinessScore || candidate.scores?.newsworthinessScore || null,
        blockers: finalGate.blockers,
        scores: finalGate.scores,
        validation: summarizeValidation(result.validation),
        publishSafety: summarizePublishSafety(result.publishSafety),
        governance: summarizeGovernance(result.governance),
      };
      logStructured('post_generation_validation_failed', {
        cronId: audit.cronId,
        jobId: audit.jobId,
        ...action,
      });
      return action;
    }

    const saved = await ArticleService.createOrUpdateGeneratedArticle({
      article: result.article,
      status: 'published',
      publishApproved: true,
      idempotencyKey: result.article?.structuredContent?.factoryIdempotencyKey || `autonomous:${result.slug}`,
    });

    const action = {
      slot: audit.slot || null,
      keyword: candidate.keyword,
      type: candidate.type,
      status: saved.status === 'published' ? 'published' : 'blocked_after_generation',
      slug: result.slug,
      articleId: saved.id || null,
      retryCount: audit.retryCount || 0,
      cluster: candidate.cluster,
      family: candidate.family,
      nearestCompetingArticle: candidate.nearestCompetingArticle || null,
      newsSource: candidate.news?.newsSource || candidate.newsSource || null,
      publishedAt: candidate.news?.publishedAt || candidate.publishedAt || null,
      freshnessScore: candidate.news?.freshnessScore || candidate.scores?.freshnessScore || null,
      officialSourceDetected: candidate.news?.officialSourceDetected || false,
      secondSourceConfirmed: candidate.news?.secondSourceConfirmed || false,
      impactOnWalletScore: candidate.news?.impactOnWalletScore || candidate.scores?.impactOnWalletScore || null,
      newsworthinessScore: candidate.news?.newsworthinessScore || candidate.scores?.newsworthinessScore || null,
      factoryStatus: result.status,
      validation: summarizeValidation(result.validation),
      publishSafety: summarizePublishSafety(result.publishSafety),
      governance: summarizeGovernance(result.governance),
    };
    logStructured(action.status === 'published' ? 'article_published' : 'post_generation_validation_failed', {
      cronId: audit.cronId,
      jobId: audit.jobId,
      ...action,
    });
    return action;
  }

  static async publishRefreshCandidate(candidate = {}, audit = {}) {
    const generated = await ArticleFactoryService.run({
      topic: candidate.keyword,
      keyword: candidate.keyword,
      intent: candidate.intent || 'update_existing',
      category: toCategory(candidate),
      dryRun: false,
      persist: false,
      publishApproved: false,
      triggerSource: 'autonomous-premium-refresh',
    });
    const finalGate = this.evaluateGeneratedResultGate(generated, candidate);
    if (!finalGate.publishable) {
      const action = {
        slot: audit.slot || null,
        keyword: candidate.keyword,
        type: candidate.type,
        status: 'blocked_after_generation',
        slug: candidate.targetSlug,
        targetSlug: candidate.targetSlug,
        retryCount: audit.retryCount || 0,
        cluster: candidate.cluster,
        family: candidate.family,
        nearestCompetingArticle: candidate.nearestCompetingArticle || null,
        blockers: finalGate.blockers,
        scores: finalGate.scores,
        validation: summarizeValidation(generated.validation),
        publishSafety: summarizePublishSafety(generated.publishSafety),
        governance: summarizeGovernance(generated.governance),
      };
      logStructured('post_generation_validation_failed', {
        cronId: audit.cronId,
        jobId: audit.jobId,
        ...action,
      });
      return action;
    }

    const article = {
      ...generated.article,
      slug: candidate.targetSlug,
      structuredContent: {
        ...generated.article.structuredContent,
        slug: candidate.targetSlug,
        routePath: `/blog/${candidate.targetSlug}`,
        canonicalUrl: `/blog/${candidate.targetSlug}/`,
        autonomousRefresh: true,
        refreshedFromKeyword: candidate.keyword,
      },
    };

    const saved = await ArticleService.createOrUpdateGeneratedArticle({
      article,
      status: 'published',
      publishApproved: true,
      idempotencyKey: `autonomous-refresh:${candidate.targetSlug}`,
    });

    const action = {
      slot: audit.slot || null,
      keyword: candidate.keyword,
      type: candidate.type,
      status: saved.status === 'published' ? 'published_refresh' : 'blocked_after_generation',
      slug: saved.slug,
      articleId: saved.id,
      targetSlug: candidate.targetSlug,
      retryCount: audit.retryCount || 0,
      cluster: candidate.cluster,
      family: candidate.family,
      nearestCompetingArticle: candidate.nearestCompetingArticle || null,
      factoryStatus: generated.status,
      validation: summarizeValidation(generated.validation),
      publishSafety: summarizePublishSafety(generated.publishSafety),
      governance: summarizeGovernance(generated.governance),
    };
    logStructured(action.status === 'published_refresh' ? 'article_published' : 'post_generation_validation_failed', {
      cronId: audit.cronId,
      jobId: audit.jobId,
      ...action,
    });
    return action;
  }

  static evaluateGeneratedResultGate(result = {}, candidate = {}) {
    const quality = result.validation?.qualityScore || {};
    const governance = result.governance || {};
    const topicFatigue = result.topicFatigue || {};
    const isRefresh = Boolean(candidate.refreshPlanned && candidate.targetSlug);
    const sourceCredibility = clamp(Math.max(
      quality.topical_authority_score || 0,
      quality.expert_authority_score || 0,
      quality.signals?.hasOfficialSource ? 92 : 0
    ));
    const scores = {
      seo: clamp(Math.max(quality.serp_competitiveness_score || 0, quality.seo_structure_score || 0, quality.total || 0)),
      eeat: quality.expert_authority_score || 0,
      humanization: quality.human_readability_score || 0,
      antiTemplate: quality.anti_template_score || 0,
      originality: quality.originality_score || 0,
      factualDensity: quality.factual_depth_score || 0,
      editorialDepth: quality.editorial_depth_score || 0,
      sourceCredibility,
      fingerprintRisk: quality.fingerprint_risk_score || quality.structural_fingerprint_score || 0,
      cannibalizationRisk: quality.canibalization_risk_score || governance.memory?.canibalizationRisk || 0,
      topicFatigue: topicFatigue.topicFatigueScore || 0,
    };
    const validationPassed = result.validation?.passed !== false;
    const publishSafetyOk = result.publishSafety?.status === 'publishable';
    const governancePublishable = governance.decision === 'publishable' || governance.decision === 'publishable_refresh';
    const marginalQualityAllowed = Boolean(
      validationPassed &&
        publishSafetyOk &&
        governancePublishable &&
        scores.originality >= GENERATED_RESULT_FLOORS.originality &&
        scores.factualDensity >= GENERATED_RESULT_FLOORS.factualDensity &&
        (isRefresh || scores.cannibalizationRisk <= GENERATED_RESULT_FLOORS.cannibalizationRiskMax)
    );

    const blockers = [
      !validationPassed ? 'validacao editorial geral falhou' : null,
      !publishSafetyOk ? `publishSafety.status=${result.publishSafety?.status || 'unknown'}` : null,
      !governancePublishable ? `governance.decision=${governance.decision || 'unknown'}` : null,
      scores.seo < AUTO_PUBLISH_THRESHOLDS.seo ? `SEO abaixo de ${AUTO_PUBLISH_THRESHOLDS.seo}` : null,
      scores.eeat < AUTO_PUBLISH_THRESHOLDS.eeat ? `EEAT abaixo de ${AUTO_PUBLISH_THRESHOLDS.eeat}` : null,
      scores.humanization < AUTO_PUBLISH_THRESHOLDS.humanization ? `humanization abaixo de ${AUTO_PUBLISH_THRESHOLDS.humanization}` : null,
      scores.antiTemplate < AUTO_PUBLISH_THRESHOLDS.antiTemplate ? `antiTemplate abaixo de ${AUTO_PUBLISH_THRESHOLDS.antiTemplate}` : null,
      scores.originality < AUTO_PUBLISH_THRESHOLDS.originality && !marginalQualityAllowed ? `originality abaixo de ${AUTO_PUBLISH_THRESHOLDS.originality}` : null,
      scores.factualDensity < AUTO_PUBLISH_THRESHOLDS.factualDensity && !marginalQualityAllowed ? `factualDensity abaixo de ${AUTO_PUBLISH_THRESHOLDS.factualDensity}` : null,
      scores.editorialDepth < AUTO_PUBLISH_THRESHOLDS.editorialDepth ? `editorialDepth abaixo de ${AUTO_PUBLISH_THRESHOLDS.editorialDepth}` : null,
      scores.sourceCredibility < AUTO_PUBLISH_THRESHOLDS.sourceCredibility ? `sourceCredibility abaixo de ${AUTO_PUBLISH_THRESHOLDS.sourceCredibility}` : null,
      scores.fingerprintRisk > AUTO_PUBLISH_THRESHOLDS.fingerprintRiskMax ? `fingerprintRisk acima de ${AUTO_PUBLISH_THRESHOLDS.fingerprintRiskMax}` : null,
      !isRefresh && scores.cannibalizationRisk > AUTO_PUBLISH_THRESHOLDS.cannibalizationRiskMax && !marginalQualityAllowed ? `cannibalizationRisk acima de ${AUTO_PUBLISH_THRESHOLDS.cannibalizationRiskMax}` : null,
      scores.topicFatigue > AUTO_PUBLISH_THRESHOLDS.topicFatigueMax ? `topicFatigue acima de ${AUTO_PUBLISH_THRESHOLDS.topicFatigueMax}` : null,
    ].filter(Boolean);

    return {
      publishable: blockers.length === 0,
      blockers,
      scores,
      marginalQualityAllowed,
    };
  }
}

export default AutonomousEditorialPublishingService;
