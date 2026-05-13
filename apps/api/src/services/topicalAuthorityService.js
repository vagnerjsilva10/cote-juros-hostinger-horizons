import { inferEditorialFamily } from './editorialTopicFatigueService.js';

const normalize = (value = '') =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

const CLUSTERS = Object.freeze({
  golpes_pix: {
    entities: ['pix', 'med', 'banco central', 'consumidor.gov.br', 'boletim de ocorrencia', 'conta laranja', 'golpe'],
    pillar: '/blog/golpes-financeiros',
    supporting: ['/blog/golpe-do-pix', '/blog/med-pix', '/blog/como-recuperar-pix-golpe'],
    minWeekly: 2,
    maxWeekly: 3
  },
  consignado: {
    entities: ['inss', 'margem consignavel', 'beneficio', 'portabilidade', 'desconto em folha'],
    pillar: '/blog/emprestimo-consignado',
    supporting: ['/blog/margem-consignavel', '/blog/portabilidade-consignado'],
    minWeekly: 0,
    maxWeekly: 1
  },
  score: {
    entities: ['score', 'serasa', 'spc', 'cpf', 'cadastro positivo'],
    pillar: '/blog/score-de-credito',
    supporting: ['/blog/como-aumentar-score', '/blog/score-baixo'],
    minWeekly: 0,
    maxWeekly: 1
  },
  cartao: {
    entities: ['cartao', 'limite', 'anuidade', 'rotativo', 'fatura'],
    pillar: '/blog/cartao-de-credito',
    supporting: ['/blog/cartao-sem-anuidade', '/blog/rotativo-cartao'],
    minWeekly: 0,
    maxWeekly: 2
  },
  renegociacao: {
    entities: ['renegociacao', 'limpar nome', 'acordo', 'divida', 'superendividamento'],
    pillar: '/blog/renegociacao-de-dividas',
    supporting: ['/blog/como-sair-das-dividas', '/blog/superendividamento'],
    minWeekly: 1,
    maxWeekly: 2
  },
  fgts: {
    entities: ['fgts', 'saque aniversario', 'saldo bloqueado', 'antecipacao'],
    pillar: '/blog/fgts',
    supporting: ['/blog/antecipacao-fgts', '/blog/saque-aniversario'],
    minWeekly: 0,
    maxWeekly: 1
  },
  inss: {
    entities: ['inss', 'aposentado', 'pensionista', 'beneficio', 'meu inss'],
    pillar: '/blog/inss',
    supporting: ['/blog/emprestimo-inss', '/blog/beneficio-inss'],
    minWeekly: 0,
    maxWeekly: 1
  },
  educacao_financeira: {
    entities: ['orcamento', 'reserva', 'juros', 'renda', 'planejamento'],
    pillar: '/blog/educacao-financeira',
    supporting: ['/blog/orcamento-familiar', '/blog/reserva-de-emergencia'],
    minWeekly: 2,
    maxWeekly: 4
  },
  consumidor_financeiro: {
    entities: ['consumidor', 'banco central', 'reclamacao', 'consumidor.gov.br', 'procon'],
    pillar: '/blog/consumidor-financeiro',
    supporting: ['/blog/juros-abusivos', '/blog/reclamacao-banco'],
    minWeekly: 1,
    maxWeekly: 3
  },
  credito_emprestimo: {
    entities: ['emprestimo', 'credito', 'cet', 'parcela', 'taxa', 'garantia'],
    pillar: '/blog/emprestimos',
    supporting: ['/blog/emprestimo-para-negativado', '/blog/emprestimo-com-garantia'],
    minWeekly: 0,
    maxWeekly: 2
  }
});

const scoreEntities = ({ text = '', entities = [] }) => {
  const normalized = normalize(text);
  return entities.reduce((sum, entity) => sum + (normalized.includes(normalize(entity)) ? 1 : 0), 0);
};

export class TopicalAuthorityService {
  static clusters() {
    return CLUSTERS;
  }

  static classifyCluster({ keyword = '', category = '', article = {} } = {}) {
    const direct = normalize(`${keyword} ${category}`);
    if (/pix|med|golpe|fraude|estelionato|boletim/.test(direct)) return 'golpes_pix';
    if (/consignado|margem consignavel|desconto em folha/.test(direct)) return 'consignado';
    if (/score|serasa|spc|cadastro positivo/.test(direct)) return 'score';
    if (/cartao|rotativo|fatura|anuidade/.test(direct)) return 'cartao';
    if (/renegoci|limpar nome|superendividamento|divida/.test(direct)) return 'renegociacao';
    if (/fgts|saque aniversario/.test(direct)) return 'fgts';
    if (/inss|aposentad|pensionista/.test(direct)) return 'inss';
    if (/financiamento|veiculo|imovel|entrada/.test(direct)) return 'credito_emprestimo';
    if (/emprestimo|credito|cet|parcela|taxa|garantia|negativado/.test(direct)) return 'credito_emprestimo';

    const haystack = normalize([
      keyword,
      category,
      article.title,
      article.h1,
      article.summary,
      article.content,
      ...((article.sections || []).map((section) => section.heading || ''))
    ].filter(Boolean).join(' '));

    if (/pix|med|golpe|fraude|estelionato|boletim/.test(haystack)) return 'golpes_pix';
    if (/consignado|margem consignavel|desconto em folha/.test(haystack)) return 'consignado';
    if (/score|serasa|spc|cadastro positivo/.test(haystack)) return 'score';
    if (/cartao|rotativo|fatura|anuidade/.test(haystack)) return 'cartao';
    if (/renegoci|limpar nome|superendividamento|divida/.test(haystack)) return 'renegociacao';
    if (/fgts|saque aniversario/.test(haystack)) return 'fgts';
    if (/inss|aposentad|pensionista/.test(haystack)) return 'inss';
    if (/consumidor|procon|banco central|juros abusivos|reclamacao/.test(haystack)) return 'consumidor_financeiro';
    if (/orcamento|reserva|educacao financeira|planejamento/.test(haystack)) return 'educacao_financeira';
    return inferEditorialFamily({ keyword, topic: article.title, category });
  }

  static analyze({ article = {}, keyword = '', category = '', memory = null } = {}) {
    const cluster = this.classifyCluster({ keyword, category, article });
    const config = CLUSTERS[cluster] || CLUSTERS.credito_emprestimo;
    const text = [
      article.title,
      article.summary,
      article.content,
      ...((article.sections || []).flatMap((section) => [
        section.heading,
        section.subheading,
        ...(section.paragraphs || []),
        ...(section.bullets || [])
      ]))
    ].filter(Boolean).join(' ');
    const entityHits = scoreEntities({ text, entities: config.entities });
    const last7Count = memory?.windows?.last7d?.byFamily?.[cluster] || memory?.windows?.last7d?.byFamily?.[inferEditorialFamily({ keyword, topic: article.title, category })] || 0;
    const last30Count = memory?.windows?.last30d?.byFamily?.[cluster] || 0;
    const saturationPressureScore = Math.min(100, Math.round((last7Count / Math.max(config.maxWeekly, 1)) * 100));
    const topicalAuthorityScore = Math.min(100, 55 + entityHits * 9 + (last30Count < 6 ? 10 : 0) - (saturationPressureScore > 100 ? 20 : 0));
    const underexplored = last30Count <= 1 && config.minWeekly > 0;
    const overcovered = last7Count >= config.maxWeekly;

    return {
      ok: true,
      cluster,
      entities: config.entities,
      entityHits,
      pillarPage: config.pillar,
      supportingPages: config.supporting,
      suggestedInternalLinks: [config.pillar, ...config.supporting].slice(0, 5),
      topicalAuthorityScore,
      topicalBalanceScore: overcovered ? 38 : underexplored ? 88 : 72,
      saturationPressureScore,
      underexplored,
      overcovered,
      gaps: config.entities.filter((entity) => !normalize(text).includes(normalize(entity))).slice(0, 6),
      recommendation: overcovered
        ? 'reduzir publicacao neste cluster e escolher tema de autoridade/fraude/educacao'
        : underexplored
          ? 'priorizar supporting page para fortalecer hub subexplorado'
          : 'publicar apenas se o angulo for novo e o fingerprint estiver baixo'
    };
  }
}
