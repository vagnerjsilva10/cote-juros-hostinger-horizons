import { repairPortugueseInObject } from './portugueseTextService.js';

const normalize = (value = '') =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

const GENERIC_PHRASES = [
  ['ter clareza', 'enxergar o custo real'],
  ['tomar melhores decisoes', 'decidir com base em numeros'],
  ['contextualizar', 'explicar o que muda na pratica'],
  ['menos friccao', 'menos obstaculo'],
  ['organizar sua jornada', 'organizar os proximos passos'],
  ['solucao ideal', 'alternativa possivel'],
  ['vale lembrar', 'o detalhe que costuma pesar']
];

const replaceGenericPhrases = (value = '') =>
  GENERIC_PHRASES.reduce((text, [from, to]) => text.replace(new RegExp(from, 'gi'), to), String(value || ''));

const fraudPixInsights = [
  'Em golpe com Pix, o erro mais caro costuma ser tentar resolver rapido demais.',
  'O MED nao e promessa de devolucao, mas e o caminho formal para tentar bloquear ou recuperar valores em caso de fraude.',
  'Quando alguem usa pressa, vergonha ou medo para pedir uma transferencia, trate como sinal de risco.',
  'Print sozinho ajuda, mas protocolo do banco, boletim de ocorrencia e relato organizado costumam pesar mais.'
];

const creditInsights = [
  'Muita gente olha apenas para a parcela. E ai mora o problema.',
  'Banco aprova olhando risco para ele; voce precisa decidir olhando risco para sua casa.',
  'Quem promete aprovar todo mundo normalmente nao esta vendendo credito; esta vendendo ansiedade.',
  'Se a proposta depende de torcida, ela nao e plano; e aposta.'
];

const buildMiniScenarios = ({ isFraudPix }) => isFraudPix
  ? [
      'Cenario comum: a pessoa recebe uma mensagem dizendo que um Pix caiu errado e que precisa devolver agora. Se ela transfere sem conferir origem, comprovante e canal oficial do banco, pode transformar uma abordagem suspeita em perda real.',
      'Outro caso frequente: o golpista mostra um comprovante editado, pede sigilo e cria urgencia. A decisao correta e parar, abrir o app do banco por conta propria e falar com o atendimento oficial.'
    ]
  : [
      'Cenario comum: a parcela cabe no simulador, mas nao cabe no mes em que chega remedio, material escolar ou conserto da moto.',
      'Outro caso frequente: a pessoa troca uma divida barulhenta por uma parcela silenciosa e longa. No primeiro dia parece alivio; no terceiro mes vira aperto.'
    ];

export const applyOpinionatedFinanceLayerV2 = ({ article = {}, keyword = '', topical = null } = {}) => {
  const haystack = normalize([keyword, article.title, article.summary, article.content].filter(Boolean).join(' '));
  const isFraudPix = /pix|golpe|fraude|med|estelionato/.test(haystack);
  const insights = isFraudPix ? fraudPixInsights : creditInsights;
  const scenarios = buildMiniScenarios({ isFraudPix });

  const sections = (article.sections || []).map((section, index) => {
    const paragraphs = (section.paragraphs || []).map(replaceGenericPhrases);
    const shouldInject = index === 0 || /golpe|risco|cuidado|cet|parcela|banco|med|provas|boletim/i.test(section.heading || '');
    return {
      ...section,
      paragraphs: shouldInject
        ? [paragraphs[0], insights[index % insights.length], ...paragraphs.slice(1)].filter(Boolean)
        : paragraphs,
      bullets: (section.bullets || []).map(replaceGenericPhrases)
    };
  });

  return repairPortugueseInObject({
    ...article,
    intro: (article.intro || []).map(replaceGenericPhrases),
    expertInsights: [...(article.expertInsights || []), ...insights].slice(0, 8),
    miniScenarios: scenarios,
    topicalAuthorityHints: topical?.suggestedInternalLinks || [],
    sections,
    conclusion: (article.conclusion || []).map(replaceGenericPhrases),
    editorialPipeline: {
      ...(article.editorialPipeline || {}),
      stages: [
        ...((article.editorialPipeline || {}).stages || []),
        { name: 'Humanization 2.0', output: 'Ritmo variado, imperfeicao controlada, cenarios curtos e linguagem anticorporativa.' },
        { name: 'Opinionated Finance Engine', output: 'Leitura critica, sinais de armadilha, consequencias reais e posicao editorial.' }
      ]
    }
  });
};

export class OpinionatedFinanceService {
  static apply(context = {}) {
    return applyOpinionatedFinanceLayerV2(context);
  }
}
