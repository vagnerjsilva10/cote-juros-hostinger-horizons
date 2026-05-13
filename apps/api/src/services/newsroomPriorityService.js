const normalize = (value = '') =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

const clamp = (value, min = 0, max = 100) => Math.max(min, Math.min(max, Math.round(value)));

export class NewsroomPriorityService {
  static classifyOpportunity({
    keyword = '',
    trend = {},
    topicalAuthority = {},
    performance = {},
    risk = {},
  } = {}) {
    const text = normalize(keyword);
    const urgency = trend.urgency || (/selic|pix|inss|fgts|nova regra|mudanca/.test(text) ? 78 : 42);
    const searchDemand = trend.trafficPotential || (/emprestimo|cartao|score|pix|inss|fgts/.test(text) ? 74 : 56);
    const authorityGain = topicalAuthority.authorityOpportunity?.score || topicalAuthority.authorityGain || trend.authorityGain || 58;
    const misinformationRisk = risk.misinformationRisk || (/boato|golpe|nova regra|banco central|inss|fgts/.test(text) ? 72 : 35);
    const impactOnWallet = /juros|selic|credito|cartao|emprestimo|inss|fgts|pix|divida|golpe/.test(text) ? 86 : 58;
    const decayRisk = performance.serpDecayRisk || performance.decayScore || 0;

    const priorityScore = clamp(
      urgency * 0.22 +
        searchDemand * 0.2 +
        authorityGain * 0.18 +
        impactOnWallet * 0.22 +
        decayRisk * 0.1 -
        misinformationRisk * 0.08
    );

    return {
      keyword,
      priorityScore,
      decision: this.decideFormat({ text, urgency, authorityGain, decayRisk, misinformationRisk, priorityScore }),
      scores: {
        urgency,
        searchDemand,
        authorityGain,
        impactOnWallet,
        misinformationRisk,
        decayRisk,
      },
      policy: {
        needsHumanConfirmation: misinformationRisk >= 65 || urgency >= 80,
        publishMode: 'assisted_only',
        reason: 'newsroom prioriza impacto real, demanda e autoridade, mas nao ignora risco de desinformacao',
      },
    };
  }

  static decideFormat({ text, urgency, authorityGain, decayRisk, misinformationRisk, priorityScore }) {
    if (priorityScore < 45) return 'ignore';
    if (misinformationRisk >= 78 && urgency < 70) return 'aguardar_confirmacao';
    if (decayRisk >= 55) return 'content_refresh';
    if (/selic|nova regra|mudanca|hoje|copom|inss|fgts/.test(text) && urgency >= 70) return 'news_analysis';
    if (/golpe|fraude|falso|pix|boleto|cobranca indevida/.test(text)) return 'consumer_alert';
    if (authorityGain >= 72) return 'topical_support';
    if (/vale a pena|como escolher|guia|comparar/.test(text)) return 'evergreen_premium';
    return 'supporting_page';
  }

  static prioritizeQueue(opportunities = []) {
    return opportunities
      .map((item) => this.classifyOpportunity(item))
      .sort((a, b) => b.priorityScore - a.priorityScore);
  }
}

export default NewsroomPriorityService;
