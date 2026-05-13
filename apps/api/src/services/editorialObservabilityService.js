const clamp = (value, min = 0, max = 100) => Math.max(min, Math.min(max, Math.round(value)));

const avg = (values = []) => {
  const valid = values.map(Number).filter((value) => Number.isFinite(value));
  if (!valid.length) return 0;
  return Math.round(valid.reduce((sum, value) => sum + value, 0) / valid.length);
};

const countBy = (items = [], getter) =>
  items.reduce((acc, item) => {
    const key = getter(item) || 'unknown';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

const ratio = (part, total) => (total ? Number((part / total).toFixed(2)) : 0);

export class EditorialObservabilityService {
  static collectFromSimulation(simulation = {}) {
    const days = simulation.days || [];
    const selected = days.flatMap((day) => day.selected || []);
    const skippedSlots = days.flatMap((day) => day.skippedSlots || []);
    const blockedExamples = simulation.blockedSummary?.examples || [];
    const scores = selected.map((item) => item.scores || {});
    const byType = countBy(selected, (item) => item.type);
    const byCluster = countBy(selected, (item) => item.cluster);
    const byFamily = countBy(selected, (item) => item.family);
    const total = selected.length;
    const refreshCount = byType.content_refresh || 0;
    const evergreenCount = byType.evergreen_premium || 0;
    const newsCount = byType.news_analysis || 0;

    const metrics = {
      days: days.length,
      articlesGenerated: total,
      articlesGeneratedPerDay: ratio(total, Math.max(1, days.length)),
      articlesBlocked: simulation.blockedSummary?.count || blockedExamples.length,
      skips: skippedSlots.length,
      canibalizationDetected: selected.filter((item) => (item.scores?.canibalization || 0) >= 62).length + blockedExamples.filter((item) => (item.blockers || []).includes('canibalization_risk_high')).length,
      averageFingerprintRisk: avg(scores.map((score) => score.fingerprintRisk)),
      averageDiversityScore: avg(scores.map((score) => score.diversity)),
      averageTopicalAuthorityGain: avg(scores.map((score) => score.topicalAuthorityGain)),
      averageSeoScore: avg(scores.map((score) => score.seo)),
      averageEeatScore: avg(scores.map((score) => score.eeat)),
      averageHumanizationScore: avg(scores.map((score) => score.humanization)),
      averageOriginalityScore: avg(scores.map((score) => score.originality || score.diversity || 0)),
      averageNarrativeScore: avg(scores.map((score) => score.narrative || score.humanization || 0)),
      refreshRatio: ratio(refreshCount, total),
      evergreenNewsRatio: newsCount ? Number((evergreenCount / newsCount).toFixed(2)) : evergreenCount,
      distributionByCluster: byCluster,
      distributionByFamily: byFamily,
      distributionByType: byType,
    };

    const alerts = this.detectAlerts(metrics, selected, blockedExamples);
    return {
      ok: alerts.filter((alert) => alert.severity === 'critical').length === 0,
      generatedAt: new Date().toISOString(),
      source: simulation.dryRun ? 'dry-run' : 'production',
      metrics,
      alerts,
      recommendations: this.buildRecommendations(metrics, alerts),
    };
  }

  static detectAlerts(metrics = {}, selected = [], blockedExamples = []) {
    const alerts = [];
    const total = Math.max(1, metrics.articlesGenerated || 0);
    const clusterShare = Object.entries(metrics.distributionByCluster || {})
      .map(([cluster, count]) => ({ cluster, count, share: count / total }))
      .sort((a, b) => b.share - a.share);

    const creditShare = ['credito_emprestimo', 'cartao', 'score']
      .reduce((sum, cluster) => sum + (metrics.distributionByCluster?.[cluster] || 0), 0) / total;
    const pixShare = ['golpes_pix', 'pix_seguranca']
      .reduce((sum, cluster) => sum + (metrics.distributionByCluster?.[cluster] || 0), 0) / total;

    if (creditShare > 0.35) alerts.push({ severity: 'warning', type: 'credit_excess', message: 'Credito/cartao/score passaram de 35% da pauta.' });
    if (pixShare > 0.25) alerts.push({ severity: 'warning', type: 'pix_excess', message: 'Pix passou de 25% da pauta.' });
    if ((metrics.refreshRatio || 0) > 0.35) alerts.push({ severity: 'warning', type: 'refresh_excess', message: 'Refresh passou de 35% da operacao.' });
    if ((metrics.averageDiversityScore || 0) < 82) alerts.push({ severity: 'critical', type: 'diversity_drop', message: 'Diversidade editorial abaixo do minimo.' });
    if ((metrics.averageSeoScore || 0) < 82 || (metrics.averageEeatScore || 0) < 82) alerts.push({ severity: 'critical', type: 'quality_drop', message: 'SEO/EEAT medio abaixo do padrao.' });
    if ((metrics.averageFingerprintRisk || 0) > 28) alerts.push({ severity: 'critical', type: 'footprint_trend', message: 'Tendencia de footprint editorial.' });
    if (clusterShare[0]?.share > 0.22) alerts.push({ severity: 'warning', type: 'cluster_concentration', message: `Cluster ${clusterShare[0].cluster} concentrou ${Math.round(clusterShare[0].share * 100)}% da pauta.` });
    if (blockedExamples.some((item) => (item.blockers || []).includes('topic_fatigue_blocked'))) alerts.push({ severity: 'info', type: 'fatigue_detected', message: 'Fadiga editorial detectada e bloqueada antes da pauta final.' });
    if (selected.some((item) => (item.scores?.canibalization || 0) >= 100 && !item.refreshPlanned)) alerts.push({ severity: 'critical', type: 'bad_canibalization_escape', message: 'Canibalizacao alta escapou em artigo novo.' });

    return alerts;
  }

  static buildRecommendations(metrics = {}, alerts = []) {
    const recommendations = [
      'manter revisao humana obrigatoria antes de qualquer publicacao real',
      'usar skips como sinal positivo quando a pauta violar governanca',
      'separar refresh de nova URL para nao transformar atualizacao em canibalizacao',
    ];

    if (alerts.some((alert) => alert.type === 'credit_excess')) recommendations.push('reduzir credito/cartao/score e priorizar consumidor financeiro, educacao e alerts');
    if (alerts.some((alert) => alert.type === 'cluster_concentration')) recommendations.push('acionar discovery para clusters subexplorados antes de preencher a proxima semana');
    if ((metrics.averageTopicalAuthorityGain || 0) < 60) recommendations.push('aumentar supporting pages e hubs editoriais com entidades oficiais');
    if ((metrics.articlesBlocked || 0) > (metrics.articlesGenerated || 0)) recommendations.push('ampliar estoque de discovery e refresh para reduzir pressao em temas saturados');

    return recommendations;
  }

  static buildDashboards(observability = {}, simulation = {}) {
    const metrics = observability.metrics || {};
    const alerts = observability.alerts || [];
    const selected = (simulation.days || []).flatMap((day) => day.selected || []);

    const dashboard = (name, metricKeys, recommendation) => ({
      name,
      metrics: metricKeys.reduce((acc, key) => {
        acc[key] = metrics[key];
        return acc;
      }, {}),
      alerts: alerts.filter((alert) => this.alertMatchesDashboard(name, alert)),
      trend: 'simulated',
      risk: alerts.some((alert) => this.alertMatchesDashboard(name, alert) && alert.severity === 'critical') ? 'high' : alerts.some((alert) => this.alertMatchesDashboard(name, alert)) ? 'medium' : 'low',
      recommendations: [recommendation, ...observability.recommendations.slice(0, 2)].filter(Boolean),
    });

    return [
      dashboard('Editorial Health', ['articlesGenerated', 'articlesBlocked', 'skips', 'averageSeoScore', 'averageEeatScore'], 'acompanhar bloqueios como controle de qualidade, nao como falha operacional'),
      dashboard('Topical Authority', ['averageTopicalAuthorityGain', 'distributionByCluster', 'distributionByFamily'], 'priorizar clusters com ganho alto e baixa saturacao'),
      dashboard('Cannibalization Risk', ['canibalizationDetected'], 'diferenciar refresh de URL existente de artigo novo concorrente'),
      dashboard('Fingerprint Monitoring', ['averageFingerprintRisk', 'averageDiversityScore'], 'variar abertura, CTA, narrativa e estrutura semanalmente'),
      dashboard('Discovery Performance', ['articlesGeneratedPerDay', 'skips'], 'medir quantas pautas vieram de discovery e quantas salvaram slots'),
      dashboard('Refresh Opportunities', ['refreshRatio'], 'manter refresh entre 15% e 35% da operacao'),
      dashboard('Cluster Saturation', ['distributionByCluster'], 'bloquear clusters que ultrapassam concentracao semanal'),
      dashboard('SEO Quality Trends', ['averageSeoScore', 'averageOriginalityScore'], 'comparar CTR projetado e score SERP por formato'),
      dashboard('Newsroom Freshness', ['evergreenNewsRatio'], 'manter equilibrio entre evergreen, news e alerts'),
      dashboard('Humanization Trends', ['averageHumanizationScore', 'averageNarrativeScore'], 'monitorar queda de voz editorial e narrativa'),
    ].map((item) => ({
      ...item,
      sampleItems: selected.slice(0, 3).map((entry) => ({ keyword: entry.keyword, type: entry.type, cluster: entry.cluster })),
    }));
  }

  static alertMatchesDashboard(name, alert) {
    const map = {
      'Editorial Health': ['quality_drop', 'fatigue_detected'],
      'Topical Authority': ['cluster_concentration', 'credit_excess', 'pix_excess'],
      'Cannibalization Risk': ['bad_canibalization_escape', 'fatigue_detected'],
      'Fingerprint Monitoring': ['footprint_trend', 'diversity_drop'],
      'Discovery Performance': ['cluster_concentration'],
      'Refresh Opportunities': ['refresh_excess'],
      'Cluster Saturation': ['cluster_concentration', 'credit_excess', 'pix_excess'],
      'SEO Quality Trends': ['quality_drop'],
      'Newsroom Freshness': ['credit_excess', 'pix_excess'],
      'Humanization Trends': ['quality_drop', 'diversity_drop'],
    };
    return (map[name] || []).includes(alert.type);
  }
}

export default EditorialObservabilityService;
