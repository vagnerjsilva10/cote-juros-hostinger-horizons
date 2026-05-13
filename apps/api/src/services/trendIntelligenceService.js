const normalize = (value = '') =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

const TREND_TOPICS = Object.freeze([
  {
    key: 'selic',
    patterns: [/selic|juros basico|copom|taxa de juros/],
    entities: ['Banco Central', 'Copom', 'Selic'],
    defaultUrgency: 82,
    freshnessWindowDays: 3
  },
  {
    key: 'inss',
    patterns: [/inss|beneficio|aposentad|pensionista|meu inss/],
    entities: ['INSS', 'Meu INSS', 'Dataprev'],
    defaultUrgency: 72,
    freshnessWindowDays: 14
  },
  {
    key: 'fgts',
    patterns: [/fgts|saque aniversario|saldo bloqueado/],
    entities: ['FGTS', 'Caixa', 'Gov.br'],
    defaultUrgency: 70,
    freshnessWindowDays: 14
  },
  {
    key: 'pix_fraud',
    patterns: [/pix|med|golpe|fraude|conta laranja|mecanismo especial de devolucao/],
    entities: ['Banco Central', 'MED', 'Pix', 'consumidor.gov.br'],
    defaultUrgency: 86,
    freshnessWindowDays: 7
  },
  {
    key: 'regulatory',
    patterns: [/banco central|bacen|regra|regulacao|resolucao|open finance/],
    entities: ['Banco Central', 'CMN', 'Gov.br'],
    defaultUrgency: 78,
    freshnessWindowDays: 10
  },
  {
    key: 'consumer_behavior',
    patterns: [/inadimplencia|endividamento|consumidor|renegociacao|superendividamento/],
    entities: ['Serasa', 'CNC', 'Banco Central', 'Gov.br'],
    defaultUrgency: 68,
    freshnessWindowDays: 30
  }
]);

export class TrendIntelligenceService {
  static classifyTrendOpportunity({ keyword = '', topic = '', category = '', now = new Date() } = {}) {
    const haystack = normalize([keyword, topic, category].filter(Boolean).join(' '));
    const matches = TREND_TOPICS.filter((trend) => trend.patterns.some((pattern) => pattern.test(haystack)));
    const primary = matches[0] || {
      key: 'evergreen',
      entities: ['educacao financeira', 'orcamento', 'credito responsavel'],
      defaultUrgency: 32,
      freshnessWindowDays: 90
    };
    const freshness = primary.key === 'evergreen' ? 35 : Math.min(100, primary.defaultUrgency + matches.length * 4);
    const editorialOpportunity = primary.key === 'pix_fraud' || primary.key === 'selic' ? 88 : primary.key === 'evergreen' ? 62 : 74;
    const authorityGain = primary.entities.length >= 3 ? 82 : 68;
    const trafficPotential = /emprestimo|credito|pix|score|fgts|inss/.test(haystack) ? 78 : 58;

    return {
      ok: true,
      simulated: true,
      asOf: now.toISOString(),
      primaryTrend: primary.key,
      matchedTrends: matches.map((item) => item.key),
      entities: primary.entities,
      urgency: primary.defaultUrgency,
      freshness,
      editorialOpportunity,
      authorityGain,
      trafficPotential,
      recommendedAction: primary.key === 'evergreen'
        ? 'tratar como evergreen; publicar apenas se preencher lacuna de autoridade'
        : 'exigir fonte atualizada e angulo novo antes de publicar',
      futureIntegration: {
        sources: ['Banco Central', 'Gov.br', 'INSS', 'Caixa/FGTS', 'consumidor.gov.br', 'Google Trends', 'Search Console'],
        policy: 'trend aumenta prioridade, mas nao ignora governanca, qualidade ou fingerprint'
      }
    };
  }
}
