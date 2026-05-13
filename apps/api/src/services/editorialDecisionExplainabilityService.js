const scoreLabel = (score = 0) => {
  if (score >= 85) return 'forte';
  if (score >= 70) return 'adequado';
  if (score >= 55) return 'moderado';
  return 'baixo';
};

const blockerLabels = {
  canibalization_risk_high: 'risco alto de competir com uma URL existente',
  topic_fatigue_blocked: 'fadiga editorial no tema ou cluster',
  fingerprint_risk_high: 'risco alto de footprint estrutural',
  same_day_cluster_repetition: 'repeticao de cluster no mesmo dia',
  weekly_cluster_pressure: 'pressao semanal excessiva no cluster',
  weekly_type_quota_filled: 'quota semanal do formato ja preenchida',
  topical_saturation: 'cluster saturado para novo artigo',
};

export class EditorialDecisionExplainabilityService {
  static explainCandidate(item = {}) {
    const scores = item.scores || {};
    const blockers = item.blockers || [];
    const decision = item.governance?.decision || 'unknown';
    const publishAllowed = Boolean(item.governance?.publishAllowed);

    const drivers = [
      scores.seo ? `SEO ${scoreLabel(scores.seo)} (${scores.seo})` : null,
      scores.eeat ? `EEAT ${scoreLabel(scores.eeat)} (${scores.eeat})` : null,
      scores.humanization ? `humanizacao ${scoreLabel(scores.humanization)} (${scores.humanization})` : null,
      scores.diversity ? `diversidade ${scoreLabel(scores.diversity)} (${scores.diversity})` : null,
      scores.topicalAuthorityGain ? `ganho de autoridade ${scoreLabel(scores.topicalAuthorityGain)} (${scores.topicalAuthorityGain})` : null,
    ].filter(Boolean);

    const risksAvoided = blockers.map((blocker) => blockerLabels[blocker] || blocker);
    const rationale = publishAllowed
      ? [
          `Pauta escolhida porque combina ${item.contentTypeLabel || item.type} com cluster ${item.cluster}.`,
          item.reason || 'A pauta preserva diversidade e tem utilidade editorial.',
          `Principais sinais: ${drivers.join('; ')}.`,
          item.refreshPlanned
            ? 'Como refresh, a canibalizacao esperada indica atualizacao de URL existente, nao criacao de concorrente interno.'
            : 'Como artigo novo, passou sem canibalizacao bloqueante.',
        ]
      : [
          `Pauta recusada para proteger qualidade editorial no cluster ${item.cluster}.`,
          risksAvoided.length ? `Riscos evitados: ${risksAvoided.join('; ')}.` : 'Risco editorial nao especificado.',
          `Scores observados: ${drivers.join('; ')}.`,
        ];

    return {
      keyword: item.keyword,
      cluster: item.cluster,
      family: item.family,
      contentType: item.type,
      decision,
      publishAllowed,
      rationale,
      influence: {
        seo: scores.seo || 0,
        eeat: scores.eeat || 0,
        humanization: scores.humanization || 0,
        diversity: scores.diversity || 0,
        fingerprintRisk: scores.fingerprintRisk || 0,
        canibalization: scores.canibalization || 0,
        topicalAuthorityGain: scores.topicalAuthorityGain || 0,
      },
      risksAvoided,
    };
  }

  static explainSimulation(simulation = {}) {
    const selected = (simulation.days || []).flatMap((day) =>
      (day.selected || []).map((item) => ({
        day: day.day,
        ...this.explainCandidate(item),
      }))
    );
    const skipped = (simulation.days || []).flatMap((day) =>
      (day.skippedSlots || []).map((slot) => ({
        day: day.day,
        decision: slot.decision,
        reason: slot.reason,
        desiredType: slot.desiredType,
        rationale: ['Slot recusado porque nao havia pauta elegivel sem violar governanca.'],
      }))
    );

    return {
      selected,
      skipped,
      summary: {
        selectedCount: selected.length,
        skippedCount: skipped.length,
        auditPolicy: 'toda pauta deve explicar ganho editorial, risco evitado e score decisivo',
      },
    };
  }
}

export default EditorialDecisionExplainabilityService;
