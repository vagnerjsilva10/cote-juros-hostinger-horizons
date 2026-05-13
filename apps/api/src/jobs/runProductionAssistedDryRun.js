import 'dotenv/config.js';
import { ProductionAssistedMode } from '../services/productionAssistedMode.js';

const useLiveDiscovery = process.argv.includes('--live-discovery');

const result = await ProductionAssistedMode.simulate({
  days: 14,
  dailyTarget: 3,
  dryRun: true,
  useLiveDiscovery,
});

const compact = {
  safety: result.safety,
  readiness: result.readiness,
  distribution: result.simulation.distribution,
  observability: {
    metrics: result.observability.metrics,
    alerts: result.observability.alerts,
    recommendations: result.observability.recommendations,
  },
  dashboards: result.dashboards.map((dashboard) => ({
    name: dashboard.name,
    risk: dashboard.risk,
    alerts: dashboard.alerts,
    recommendations: dashboard.recommendations.slice(0, 3),
  })),
  days: result.simulation.days.map((day) => ({
    day: day.day,
    diversity: day.dailyEditorialDiversityScore,
    selected: day.selected.map((item) => ({
      keyword: item.keyword,
      type: item.type,
      cluster: item.cluster,
      decision: item.governance.decision,
      seo: item.scores.seo,
      eeat: item.scores.eeat,
      humanization: item.scores.humanization,
      fingerprintRisk: item.scores.fingerprintRisk,
      canibalization: item.scores.canibalization,
      refreshPlanned: item.refreshPlanned,
      reason: item.reason,
    })),
    skippedSlots: day.skippedSlots,
  })),
  approvalQueueSample: result.approvalQueue.slice(0, 8),
  feedback: {
    byFormat: result.feedback.byFormat,
    refreshCandidates: result.feedback.refreshCandidates.slice(0, 8),
  },
  decay: result.decay,
  explainabilitySample: result.explainability.selected.slice(0, 6),
};

console.log(JSON.stringify(compact, null, 2));
