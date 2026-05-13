import { getPrisma } from '../lib/prisma.js';
import { ArticleFactoryService } from './articleFactoryService.js';
import { ArticleService } from './articleService.js';
import { ContentOperationsEngine } from './contentOperationsEngine.js';
import { EditorialObservabilityService } from './editorialObservabilityService.js';
import { EditorialDecisionExplainabilityService } from './editorialDecisionExplainabilityService.js';
import { NewsroomPriorityService } from './newsroomPriorityService.js';

const DEFAULT_DAILY_LIMIT = 3;

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
    };
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
  } = {}) {
    const config = this.getConfig();
    const realPublishingAllowed = this.isRealPublishingAllowed({ dryRun });
    const dailyLimit = config.dailyLimit;
    const publishedToday = await this.countPublishedToday({ now });
    const remaining = Math.max(0, dailyLimit - publishedToday);

    if (!dryRun && !realPublishingAllowed) {
      return {
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
      };
    }

    if (remaining <= 0) {
      return {
        ok: true,
        status: 'daily_limit_reached',
        publishedToday,
        dailyLimit,
        actions: [],
      };
    }

    const plan = await ContentOperationsEngine.simulateWeek({
      days: 1,
      dailyTarget: remaining,
      dryRun: true,
      useLiveDiscovery,
    });
    const candidates = this.pickDailyCandidates(plan.days?.[0] || {}).slice(0, remaining);
    const actions = [];

    for (const candidate of candidates) {
      const gate = this.evaluateAutonomousGate(candidate);
      if (!gate.publishable) {
        actions.push({
          keyword: candidate.keyword,
          status: 'blocked',
          blockers: gate.blockers,
          scores: gate.scores,
        });
        continue;
      }

      if (dryRun) {
        actions.push({
          keyword: candidate.keyword,
          type: candidate.type,
          status: 'would_publish',
          scores: gate.scores,
          explanation: EditorialDecisionExplainabilityService.explainCandidate(candidate).rationale,
        });
        continue;
      }

      const published = await this.publishCandidate(candidate);
      actions.push(published);
    }

    if (!actions.length) {
      actions.push({
        status: 'critical_skip',
        reason: 'nenhuma pauta segura encontrada apos discovery, cache e fallback editorial',
      });
    }

    return {
      ok: true,
      status: dryRun ? 'shadow_daily_complete' : 'autonomous_daily_complete',
      dryRun,
      autonomousReal: realPublishingAllowed,
      publishedToday,
      dailyLimit,
      remainingAtStart: remaining,
      actions,
      observability: EditorialObservabilityService.collectFromSimulation(plan),
    };
  }

  static async publishCandidate(candidate = {}) {
    if (candidate.refreshPlanned && candidate.targetSlug) {
      return this.publishRefreshCandidate(candidate);
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
    });
    const finalGate = this.evaluateGeneratedResultGate(result, candidate);
    if (!finalGate.publishable) {
      return {
        keyword: candidate.keyword,
        type: candidate.type,
        status: 'blocked_after_generation',
        slug: result.slug,
        blockers: finalGate.blockers,
        scores: finalGate.scores,
        validation: result.validation,
        publishSafety: result.publishSafety,
        governance: result.governance,
      };
    }

    const saved = await ArticleService.createOrUpdateGeneratedArticle({
      article: result.article,
      status: 'published',
      publishApproved: true,
      idempotencyKey: result.article?.structuredContent?.factoryIdempotencyKey || `autonomous:${result.slug}`,
    });

    return {
      keyword: candidate.keyword,
      type: candidate.type,
      status: saved.status === 'published' ? 'published' : 'blocked_after_generation',
      slug: result.slug,
      articleId: saved.id || null,
      factoryStatus: result.status,
      validation: result.validation,
      publishSafety: result.publishSafety,
      governance: result.governance,
    };
  }

  static async publishRefreshCandidate(candidate = {}) {
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
      return {
        keyword: candidate.keyword,
        type: candidate.type,
        status: 'blocked_after_generation',
        slug: candidate.targetSlug,
        targetSlug: candidate.targetSlug,
        blockers: finalGate.blockers,
        scores: finalGate.scores,
        validation: generated.validation,
        publishSafety: generated.publishSafety,
        governance: generated.governance,
      };
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

    return {
      keyword: candidate.keyword,
      type: candidate.type,
      status: saved.status === 'published' ? 'published_refresh' : 'blocked_after_generation',
      slug: saved.slug,
      articleId: saved.id,
      targetSlug: candidate.targetSlug,
      factoryStatus: generated.status,
      validation: generated.validation,
      publishSafety: generated.publishSafety,
      governance: generated.governance,
    };
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

    const blockers = [
      result.validation?.passed === false ? 'validacao editorial geral falhou' : null,
      result.publishSafety?.status !== 'publishable' ? `publishSafety.status=${result.publishSafety?.status || 'unknown'}` : null,
      governance.decision !== 'publishable' && governance.decision !== 'publishable_refresh' ? `governance.decision=${governance.decision || 'unknown'}` : null,
      scores.seo < AUTO_PUBLISH_THRESHOLDS.seo ? `SEO abaixo de ${AUTO_PUBLISH_THRESHOLDS.seo}` : null,
      scores.eeat < AUTO_PUBLISH_THRESHOLDS.eeat ? `EEAT abaixo de ${AUTO_PUBLISH_THRESHOLDS.eeat}` : null,
      scores.humanization < AUTO_PUBLISH_THRESHOLDS.humanization ? `humanization abaixo de ${AUTO_PUBLISH_THRESHOLDS.humanization}` : null,
      scores.antiTemplate < AUTO_PUBLISH_THRESHOLDS.antiTemplate ? `antiTemplate abaixo de ${AUTO_PUBLISH_THRESHOLDS.antiTemplate}` : null,
      scores.originality < AUTO_PUBLISH_THRESHOLDS.originality ? `originality abaixo de ${AUTO_PUBLISH_THRESHOLDS.originality}` : null,
      scores.factualDensity < AUTO_PUBLISH_THRESHOLDS.factualDensity ? `factualDensity abaixo de ${AUTO_PUBLISH_THRESHOLDS.factualDensity}` : null,
      scores.editorialDepth < AUTO_PUBLISH_THRESHOLDS.editorialDepth ? `editorialDepth abaixo de ${AUTO_PUBLISH_THRESHOLDS.editorialDepth}` : null,
      scores.sourceCredibility < AUTO_PUBLISH_THRESHOLDS.sourceCredibility ? `sourceCredibility abaixo de ${AUTO_PUBLISH_THRESHOLDS.sourceCredibility}` : null,
      scores.fingerprintRisk > AUTO_PUBLISH_THRESHOLDS.fingerprintRiskMax ? `fingerprintRisk acima de ${AUTO_PUBLISH_THRESHOLDS.fingerprintRiskMax}` : null,
      !isRefresh && scores.cannibalizationRisk > AUTO_PUBLISH_THRESHOLDS.cannibalizationRiskMax ? `cannibalizationRisk acima de ${AUTO_PUBLISH_THRESHOLDS.cannibalizationRiskMax}` : null,
      scores.topicFatigue > AUTO_PUBLISH_THRESHOLDS.topicFatigueMax ? `topicFatigue acima de ${AUTO_PUBLISH_THRESHOLDS.topicFatigueMax}` : null,
    ].filter(Boolean);

    return {
      publishable: blockers.length === 0,
      blockers,
      scores,
    };
  }
}

export default AutonomousEditorialPublishingService;
