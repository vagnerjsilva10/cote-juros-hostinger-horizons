import { ContentOperationsEngine } from './contentOperationsEngine.js';
import { EditorialObservabilityService } from './editorialObservabilityService.js';
import { EditorialDecisionExplainabilityService } from './editorialDecisionExplainabilityService.js';
import { EditorialFeedbackLoopService } from './editorialFeedbackLoopService.js';
import { ContentDecayService } from './contentDecayService.js';
import { NewsroomPriorityService } from './newsroomPriorityService.js';

export class ProductionAssistedMode {
  static async simulate({
    days = 14,
    dailyTarget = 3,
    dryRun = true,
    useLiveDiscovery = false,
  } = {}) {
    const simulation = await ContentOperationsEngine.simulateWeek({
      days,
      dailyTarget,
      dryRun,
      useLiveDiscovery,
    });
    const observability = EditorialObservabilityService.collectFromSimulation(simulation);
    const dashboards = EditorialObservabilityService.buildDashboards(observability, simulation);
    const explainability = EditorialDecisionExplainabilityService.explainSimulation(simulation);
    const newsroom = NewsroomPriorityService.prioritizeQueue(
      simulation.days.flatMap((day) =>
        (day.selected || []).map((item) => ({
          keyword: item.keyword,
          trend: { trafficPotential: item.scores?.seo || 0, authorityGain: item.scores?.topicalAuthorityGain || 0 },
          topicalAuthority: { authorityGain: item.scores?.topicalAuthorityGain || 0 },
          performance: { serpDecayRisk: item.refreshPlanned ? 62 : 24 },
          risk: { misinformationRisk: item.type === 'news_analysis' || item.type === 'consumer_alert' ? 68 : 32 },
        }))
      )
    );
    const feedback = EditorialFeedbackLoopService.learnFromSignals({
      signals: simulation.days.flatMap((day) =>
        (day.selected || []).map((item) => ({
          slug: item.targetSlug || item.keyword,
          metadata: {
            contentType: item.type,
            cluster: item.cluster,
            ctaPattern: item.refreshPlanned ? 'refresh_review' : 'natural_tools_or_blog',
            introPattern: item.type,
            headlinePattern: item.intent,
          },
          metrics: {
            ctr: Math.max(1.2, (item.scores?.seo || 80) / 22),
            scrollDepth: item.scores?.humanization || 80,
            timeOnPage: item.scores?.eeat || 80,
            conversionRate: item.type === 'evergreen_premium' ? 2.2 : 1.1,
            averagePosition: Math.max(4, 18 - (item.scores?.seo || 80) / 10),
            serpDecayRisk: item.refreshPlanned ? 62 : 25,
          },
        }))
      ),
    });
    const decay = ContentDecayService.analyzePortfolio({
      articles: simulation.days.flatMap((day) =>
        (day.selected || [])
          .filter((item) => item.refreshPlanned)
          .map((item, index) => ({
            id: `${day.day}-${index}`,
            slug: item.targetSlug,
            title: item.keyword,
            updatedAt: new Date(Date.now() - 140 * 86400000).toISOString(),
            faq: [],
          }))
      ),
      performanceBySlug: Object.fromEntries(
        simulation.days.flatMap((day) =>
          (day.selected || [])
            .filter((item) => item.refreshPlanned)
            .map((item) => [item.targetSlug, { averagePosition: 14, previousAveragePosition: 8, ctr: 1.1, previousCtr: 2.4 }])
        )
      ),
      serpBySlug: Object.fromEntries(
        simulation.days.flatMap((day) =>
          (day.selected || [])
            .filter((item) => item.refreshPlanned)
            .map((item) => [item.targetSlug, { intentChanged: false, regulatoryChange: item.cluster === 'score' || item.cluster === 'credito_emprestimo' }])
        )
      ),
    });

    return {
      mode: 'production_assisted_dry_run',
      safety: {
        published: false,
        persisted: false,
        distributed: false,
        cronReal: false,
        autopublish: false,
        humanReviewRequired: true,
      },
      approvalQueue: simulation.days.flatMap((day) =>
        (day.selected || []).map((item) => ({
          day: day.day,
          keyword: item.keyword,
          contentType: item.type,
          cluster: item.cluster,
          decision: item.governance?.decision,
          reviewStatus: 'pending_human_review',
          publishAction: 'manual_assisted_only',
          explanation: EditorialDecisionExplainabilityService.explainCandidate(item).rationale,
        }))
      ),
      simulation,
      observability,
      dashboards,
      explainability,
      newsroom,
      feedback,
      decay,
      readiness: this.assessReadiness({ observability, simulation }),
    };
  }

  static assessReadiness({ observability = {}, simulation = {} } = {}) {
    const criticalAlerts = (observability.alerts || []).filter((alert) => alert.severity === 'critical');
    const selected = simulation.distribution?.selectedCount || 0;
    const expected = (simulation.target?.days || 0) * (simulation.target?.dailyTarget || 0);
    const fillRate = expected ? selected / expected : 0;

    return {
      productionAssisted: criticalAlerts.length === 0 && fillRate >= 0.85 ? 'GO' : 'CAUTION',
      partialAutopublish: 'NO-GO',
      fullAutopublish: 'NO-GO',
      reasons: [
        'revisao humana obrigatoria mantida',
        'discovery live ainda precisa maturar com observabilidade real',
        'YMYL financeiro exige aprovacao editorial antes de publicar',
        fillRate < 1 ? 'sistema pode pular slots se governanca bloquear pauta' : 'capacidade de pauta simulada atendida',
      ],
    };
  }
}

export default ProductionAssistedMode;
