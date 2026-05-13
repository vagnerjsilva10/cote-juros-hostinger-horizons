import { EditorialMemoryService } from './editorialMemoryService.js';
import { EditorialFingerprintService } from './editorialFingerprintService.js';
import { TopicalAuthorityService } from './topicalAuthorityService.js';
import { EditorialFeedbackLoopService } from './editorialFeedbackLoopService.js';
import { TrendIntelligenceService } from './trendIntelligenceService.js';
import { EditorialTopicFatigueService, inferEditorialFamily } from './editorialTopicFatigueService.js';

const clamp = (value, min = 0, max = 100) => Math.max(min, Math.min(max, Math.round(value)));

const calendarRules = () => Object.fromEntries(
  (EditorialTopicFatigueService.calendarPolicy().weeklyCaps || []).map((rule) => [rule.family, rule])
);

const qualityValue = (validation = {}, key, fallback = 0) => Number(validation.qualityScore?.[key] ?? fallback);

export class EditorialGovernanceService {
  static async evaluate({
    article = {},
    keyword = '',
    topic = '',
    category = '',
    intent = '',
    serpIntelligence = null,
    validation = null,
    topicFatigue = null,
    publishSafety = null,
    triggerSource = 'manual',
    mode = 'dry-run',
    publishApproved = false,
    now = new Date()
  } = {}) {
    const family = inferEditorialFamily({ keyword, topic: topic || article.title, category: category || article.category, intent });
    const memory = await EditorialMemoryService.buildMemory({
      article,
      keyword,
      intent,
      serpIntent: serpIntelligence?.searchIntent || article.serpIntelligence?.searchIntent || '',
      now
    });
    const fingerprint = EditorialFingerprintService.analyzeEditorialFingerprint({
      article,
      keyword,
      intent,
      serpIntent: serpIntelligence?.searchIntent,
      memory
    });
    const topicalAuthority = TopicalAuthorityService.analyze({ article, keyword, category, memory });
    const trend = TrendIntelligenceService.classifyTrendOpportunity({ keyword, topic, category, now });
    const feedbackProjection = EditorialFeedbackLoopService.projectPerformanceSignals({ article, validation, governance: { memory, fingerprint } });
    const rules = calendarRules();
    const familyRule = rules[family] || rules[topicalAuthority.cluster] || {};
    const last7FamilyCount = memory.windows?.last7d?.byFamily?.[family] || 0;
    const quotaExceeded = Number.isFinite(familyRule.maxPerWeek) && last7FamilyCount >= familyRule.maxPerWeek;

    const blockers = [
      validation && validation.passed === false ? 'quality validation failed' : null,
      publishSafety?.blocked ? 'publish safety blocked' : null,
      topicFatigue?.blocked ? 'topic fatigue blocked' : null,
      fingerprint.blocked ? 'fingerprint risk blocked' : null,
      memory.canibalizationRisk >= 62 ? 'canibalization risk high' : null,
      quotaExceeded ? `weekly quota exceeded for ${family}` : null,
      topicalAuthority.overcovered ? `cluster saturation for ${topicalAuthority.cluster}` : null,
      qualityValue(validation, 'anti_template_score', 100) < 82 ? 'anti-template score below gate' : null,
      qualityValue(validation, 'human_readability_score', 100) < 82 ? 'readability score below gate' : null,
      qualityValue(validation, 'editorial_depth_score', 100) < 78 ? 'editorial depth below gate' : null,
      qualityValue(validation, 'narrative_strength_score', 100) < 62 ? 'weak storytelling' : null,
      qualityValue(validation, 'editorial_personality_score', 100) < 62 ? 'weak editorial personality' : null,
      qualityValue(validation, 'fingerprint_risk_score', 0) > 35 ? 'quality fingerprint risk high' : null,
      /factory-fallback/i.test(triggerSource) && process.env.ARTICLE_AUTOMATION_FACTORY_FALLBACK_ENABLED !== 'true'
        ? 'factory fallback is disabled'
        : null,
      publishApproved && mode === 'autopublish' && process.env.ARTICLE_AUTOMATION_ALLOW_PUBLISH !== 'true'
        ? 'automatic publish is not explicitly enabled'
        : null
    ].filter(Boolean);

    const diversityScore = clamp(100 - Math.max(fingerprint.fingerprintRiskScore, memory.canibalizationRisk));
    const noveltyScore = clamp(100 - Math.max(topicFatigue?.topicFatigueScore || 0, memory.canibalizationRisk));
    const topicalBalanceScore = topicalAuthority.topicalBalanceScore;
    const saturationPressureScore = clamp(Math.max(
      topicFatigue?.topicFatigueScore || 0,
      topicalAuthority.saturationPressureScore,
      quotaExceeded ? 100 : 0
    ));
    const decision = blockers.length
      ? (fingerprint.fingerprintRiskScore > 55 || memory.canibalizationRisk > 70 || quotaExceeded ? 'skipped' : 'draft_blocked')
      : 'publishable';

    return {
      ok: true,
      authority: 'editorial-governance-final',
      decision,
      status: decision,
      family,
      cluster: topicalAuthority.cluster,
      publishAllowed: decision === 'publishable',
      blockers,
      scores: {
        diversityScore,
        noveltyScore,
        topicalBalanceScore,
        saturationPressureScore,
        fingerprintRiskScore: fingerprint.fingerprintRiskScore,
        canibalizationRisk: memory.canibalizationRisk,
        topicalAuthorityScore: topicalAuthority.topicalAuthorityScore
      },
      memory,
      fingerprint,
      topicalAuthority,
      trend,
      feedbackProjection,
      policy: {
        maxims: ['prefer SKIP to repetitive publishing', 'no silent fallback', 'final governance cannot be bypassed'],
        familyRule,
        mode,
        publishApproved
      }
    };
  }
}
