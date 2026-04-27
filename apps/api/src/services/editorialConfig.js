export const SITE_BASE_URL = (process.env.SITE_BASE_URL || 'https://www.cotejuros.com.br').replace(/\/$/, '');
export const WEB_PUBLIC_DIR = new URL('../../../web/public/', import.meta.url);
export const BLOG_IMAGE_DIR = new URL('../../../web/public/images/blog/', import.meta.url);
export const BLOG_IMAGE_VARIANTS_DIR = new URL('../../../web/public/images/blog/variants/', import.meta.url);
export const WEB_STORIES_DIR = new URL('../../../web/public/stories/', import.meta.url);
export const PINTEREST_IMAGE_DIR = new URL('../../../web/public/images/pinterest/', import.meta.url);
export const EDITORIAL_TMP_DIR = new URL('../../tmp/generated-images/', import.meta.url);
export const EDITORIAL_LOG_DIR = new URL('../../logs/editorial/', import.meta.url);
export const EDITORIAL_FALLBACK_IMAGE_PATH =
  'https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=1200&q=80';
export const EDITORIAL_FALLBACK_IMAGE_ABSOLUTE_URL = EDITORIAL_FALLBACK_IMAGE_PATH;
export const PINTEREST_API_BASE_URL = process.env.PINTEREST_API_BASE_URL || 'https://api.pinterest.com/v5';
export const BLOG_CLUSTER_FALLBACKS = Object.freeze({
  emprestimos: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1200&q=80',
  cartoes: 'https://images.unsplash.com/photo-1556740749-887f6717d7e4?auto=format&fit=crop&w=1200&q=80',
  financiamentos: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=1200&q=80',
  score: 'https://images.unsplash.com/photo-1554224154-26032ffc0d07?auto=format&fit=crop&w=1200&q=80',
  educacao: 'https://images.unsplash.com/photo-1573497491208-6b1acb260507?auto=format&fit=crop&w=1200&q=80'
});

export const COMMERCIAL_DESTINATIONS = Object.freeze([
  {
    path: '/emprestimos',
    title: 'compare opcoes de emprestimo',
    anchor: 'compare opcoes de emprestimo antes de contratar'
  },
  {
    path: '/cartoes',
    title: 'compare cartoes de credito',
    anchor: 'compare cartoes de credito com mais clareza'
  },
  {
    path: '/financiamentos',
    title: 'compare opcoes de financiamento',
    anchor: 'compare opcoes de financiamento com calma'
  }
]);

export const AUTHORITY_SOURCES = Object.freeze([
  {
    label: 'Banco Central',
    url: 'https://www.bcb.gov.br/'
  },
  {
    label: 'Serasa',
    url: 'https://www.serasa.com.br/'
  },
  {
    label: 'SPC Brasil',
    url: 'https://www.spcbrasil.org.br/'
  },
  {
    label: 'IBGE',
    url: 'https://www.ibge.gov.br/'
  }
]);

export const DEFAULT_EDITORIAL_SCHEDULE = Object.freeze({
  morning: process.env.EDITORIAL_CRON_MORNING || '30 8 * * *',
  afternoon: process.env.EDITORIAL_CRON_AFTERNOON || '30 13 * * *',
  evening: process.env.EDITORIAL_CRON_EVENING || '30 19 * * *'
});

export const DEFAULT_EDITORIAL_CLUSTERS = Object.freeze([
  {
    slug: 'emprestimo-para-negativado',
    primaryKeyword: 'emprestimo para negativado',
    name: 'Emprestimo para negativado',
    pillarTitle: 'Emprestimo para negativado: como avaliar custo real e alternativas seguras',
    description: 'Cluster focado em credito para quem esta com restricao no nome, comparando custo, elegibilidade e risco.',
    category: 'Emprestimos',
    commercialPath: '/emprestimos',
    briefs: [
      {
        slug: 'emprestimo-para-negativado-como-funciona',
        stage: 'pillar',
        title: 'Emprestimo para negativado: como funciona, quando faz sentido e o que observar',
        primaryKeyword: 'emprestimo para negativado',
        secondaryKeywords: ['credito para negativado', 'emprestimo com nome sujo', 'emprestimo pessoal para negativado'],
        angle: 'pillar'
      },
      {
        slug: 'emprestimo-para-negativado-sem-garantia',
        stage: 'top',
        title: 'Emprestimo para negativado sem garantia existe? O que muda no custo e na aprovacao',
        primaryKeyword: 'emprestimo para negativado sem garantia',
        secondaryKeywords: ['credito sem garantia para negativado', 'aprovacao para negativado', 'juros para negativado'],
        angle: 'awareness'
      },
      {
        slug: 'emprestimo-para-negativado-online',
        stage: 'middle',
        title: 'Emprestimo para negativado online: como comparar ofertas sem cair em promessa facil',
        primaryKeyword: 'emprestimo para negativado online',
        secondaryKeywords: ['emprestimo online para negativado', 'como comparar credito online', 'analise de oferta de credito'],
        angle: 'consideration'
      },
      {
        slug: 'emprestimo-para-negativado-com-garantia',
        stage: 'bottom',
        title: 'Emprestimo para negativado com garantia vale a pena? Veja quando reduz juros e quando aumenta o risco',
        primaryKeyword: 'emprestimo para negativado com garantia',
        secondaryKeywords: ['garantia de veiculo para emprestimo', 'credito com garantia para negativado', 'juros mais baixos com garantia'],
        angle: 'decision'
      }
    ]
  },
  {
    slug: 'financiamento-sem-entrada',
    primaryKeyword: 'financiamento sem entrada',
    name: 'Financiamento sem entrada',
    pillarTitle: 'Financiamento sem entrada: como ler parcelas, CET e risco de comprometer a renda',
    description: 'Cluster sobre financiamento de veiculo e imovel sem entrada, com foco em CET, parcela e planejamento.',
    category: 'Financiamentos',
    commercialPath: '/financiamentos',
    briefs: [
      {
        slug: 'financiamento-sem-entrada-como-avaliar',
        stage: 'pillar',
        title: 'Financiamento sem entrada: quando faz sentido e quando pesa demais no orcamento',
        primaryKeyword: 'financiamento sem entrada',
        secondaryKeywords: ['comprar carro sem entrada', 'financiamento de imovel sem entrada', 'como avaliar parcelas'],
        angle: 'pillar'
      },
      {
        slug: 'financiamento-carro-sem-entrada',
        stage: 'top',
        title: 'Financiamento de carro sem entrada: 7 pontos para analisar antes de assinar',
        primaryKeyword: 'financiamento carro sem entrada',
        secondaryKeywords: ['parcela do carro', 'CET do financiamento', 'entrada zero automovel'],
        angle: 'awareness'
      },
      {
        slug: 'financiamento-imovel-sem-entrada',
        stage: 'middle',
        title: 'Financiamento de imovel sem entrada: como comparar prazo, renda e custo total',
        primaryKeyword: 'financiamento imovel sem entrada',
        secondaryKeywords: ['simulacao financiamento imovel', 'comprometimento de renda', 'juros habitacionais'],
        angle: 'consideration'
      },
      {
        slug: 'entrada-ou-prazo-no-financiamento',
        stage: 'bottom',
        title: 'Melhor dar entrada maior ou alongar prazo? Como decidir no financiamento',
        primaryKeyword: 'dar entrada ou alongar prazo financiamento',
        secondaryKeywords: ['prazo do financiamento', 'amortizacao price ou sac', 'reduzir custo do financiamento'],
        angle: 'decision'
      }
    ]
  },
  {
    slug: 'cartao-para-negativado',
    primaryKeyword: 'cartao para negativado',
    name: 'Cartao para negativado',
    pillarTitle: 'Cartao para negativado: como escolher sem cair em limite ruim, taxa alta ou promessa vazia',
    description: 'Cluster para cartoes de credito acessiveis, cartoes consignados e alternativas para reorganizar uso do limite.',
    category: 'Cartoes',
    commercialPath: '/cartoes',
    briefs: [
      {
        slug: 'cartao-para-negativado-como-escolher',
        stage: 'pillar',
        title: 'Cartao para negativado: como escolher, o que comparar e quais riscos evitar',
        primaryKeyword: 'cartao para negativado',
        secondaryKeywords: ['cartao de credito para negativado', 'cartao aprovado com restricao', 'como escolher cartao'],
        angle: 'pillar'
      },
      {
        slug: 'cartao-consignado-vale-a-pena',
        stage: 'top',
        title: 'Cartao consignado vale a pena? Entenda taxa, limite e desconto em folha',
        primaryKeyword: 'cartao consignado vale a pena',
        secondaryKeywords: ['cartao consignado', 'desconto em folha', 'taxa do cartao consignado'],
        angle: 'awareness'
      },
      {
        slug: 'cartao-com-limite-baixo-como-usar',
        stage: 'middle',
        title: 'Cartao com limite baixo: como usar bem sem entrar no rotativo',
        primaryKeyword: 'cartao com limite baixo',
        secondaryKeywords: ['aumentar limite do cartao', 'evitar rotativo', 'uso do limite do cartao'],
        angle: 'consideration'
      },
      {
        slug: 'cartao-sem-anuidade-para-recomecar',
        stage: 'bottom',
        title: 'Cartao sem anuidade para recomecar: como comparar limite, aplicativo e custo real',
        primaryKeyword: 'cartao sem anuidade para recomecar',
        secondaryKeywords: ['cartao sem anuidade', 'cartao para organizar score', 'comparar cartao'],
        angle: 'decision'
      }
    ]
  },
  {
    slug: 'emprestimo-pessoal-online',
    primaryKeyword: 'emprestimo pessoal online',
    name: 'Emprestimo pessoal online',
    pillarTitle: 'Emprestimo pessoal online: como comparar taxas, prazo e risco antes de contratar',
    description: 'Cluster para buscas de emprestimo pessoal com foco em simulacao, seguranca, CET e comparacao.',
    category: 'Emprestimos',
    commercialPath: '/emprestimos',
    briefs: [
      {
        slug: 'emprestimo-pessoal-online-como-escolher',
        stage: 'pillar',
        title: 'Emprestimo pessoal online: como escolher sem cair em custo escondido',
        primaryKeyword: 'emprestimo pessoal online',
        secondaryKeywords: ['emprestimo online seguro', 'simular emprestimo pessoal', 'taxa de emprestimo pessoal'],
        angle: 'pillar'
      },
      {
        slug: 'emprestimo-online-seguro-como-identificar',
        stage: 'top',
        title: 'Emprestimo online seguro: sinais para identificar uma oferta confiavel',
        primaryKeyword: 'emprestimo online seguro',
        secondaryKeywords: ['golpe do emprestimo online', 'emprestimo sem taxa antecipada', 'credito online confiavel'],
        angle: 'awareness'
      },
      {
        slug: 'simulacao-de-emprestimo-pessoal-como-comparar',
        stage: 'middle',
        title: 'Simulacao de emprestimo pessoal: como comparar parcela, prazo e CET',
        primaryKeyword: 'simulacao de emprestimo pessoal',
        secondaryKeywords: ['simular emprestimo online', 'comparar parcela de emprestimo', 'custo efetivo total emprestimo'],
        angle: 'consideration'
      },
      {
        slug: 'emprestimo-pessoal-com-menor-juros',
        stage: 'bottom',
        title: 'Emprestimo pessoal com menor juros: o que realmente muda no custo final',
        primaryKeyword: 'emprestimo pessoal com menor juros',
        secondaryKeywords: ['menor taxa de emprestimo', 'comparar juros de emprestimo', 'emprestimo barato'],
        angle: 'decision'
      }
    ]
  },
  {
    slug: 'financiamento-de-veiculo',
    primaryKeyword: 'financiamento de veiculo',
    name: 'Financiamento de veiculo',
    pillarTitle: 'Financiamento de veiculo: como comparar entrada, parcela, CET e prazo',
    description: 'Cluster para financiamento automotivo com foco em carro usado, novo, entrada e score.',
    category: 'Financiamentos',
    commercialPath: '/financiamentos',
    briefs: [
      {
        slug: 'financiamento-de-veiculo-guia-completo',
        stage: 'pillar',
        title: 'Financiamento de veiculo: guia para avaliar parcela, entrada e custo total',
        primaryKeyword: 'financiamento de veiculo',
        secondaryKeywords: ['financiamento de carro', 'financiar carro usado', 'CET financiamento veiculo'],
        angle: 'pillar'
      },
      {
        slug: 'financiamento-de-carro-usado-cuidados',
        stage: 'top',
        title: 'Financiamento de carro usado: cuidados antes de assinar o contrato',
        primaryKeyword: 'financiamento de carro usado',
        secondaryKeywords: ['financiar usado', 'entrada carro usado', 'contrato financiamento automovel'],
        angle: 'awareness'
      },
      {
        slug: 'financiamento-de-veiculo-para-score-baixo',
        stage: 'middle',
        title: 'Financiamento de veiculo para score baixo: o que pode pesar na analise',
        primaryKeyword: 'financiamento de veiculo para score baixo',
        secondaryKeywords: ['score baixo financiamento carro', 'aprovar financiamento veiculo', 'credito para financiar carro'],
        angle: 'consideration'
      },
      {
        slug: 'financiamento-de-veiculo-com-entrada-ou-sem-entrada',
        stage: 'bottom',
        title: 'Financiamento de veiculo com entrada ou sem entrada: como decidir',
        primaryKeyword: 'financiamento de veiculo com entrada',
        secondaryKeywords: ['entrada financiamento carro', 'financiamento sem entrada carro', 'reduzir parcela do carro'],
        angle: 'decision'
      }
    ]
  },
  {
    slug: 'score-de-credito',
    primaryKeyword: 'score de credito',
    name: 'Score de credito',
    pillarTitle: 'Score de credito: como funciona e como usar a pontuacao a seu favor',
    description: 'Cluster para buscas sobre score, aprovacao, consulta, aumento de pontuacao e credito.',
    category: 'Score',
    commercialPath: '/emprestimos',
    briefs: [
      {
        slug: 'score-de-credito-guia-completo',
        stage: 'pillar',
        title: 'Score de credito: como funciona e o que realmente influencia a pontuacao',
        primaryKeyword: 'score de credito',
        secondaryKeywords: ['consulta score', 'pontuacao de credito', 'score serasa'],
        angle: 'pillar'
      },
      {
        slug: 'como-aumentar-score-rapido-com-seguranca',
        stage: 'top',
        title: 'Como aumentar score com seguranca: o que ajuda e o que e mito',
        primaryKeyword: 'como aumentar score',
        secondaryKeywords: ['aumentar score rapido', 'melhorar score de credito', 'score baixo'],
        angle: 'awareness'
      },
      {
        slug: 'score-baixo-consegue-emprestimo',
        stage: 'middle',
        title: 'Score baixo consegue emprestimo? Veja como comparar alternativas',
        primaryKeyword: 'score baixo consegue emprestimo',
        secondaryKeywords: ['emprestimo para score baixo', 'credito com score baixo', 'aprovacao com score baixo'],
        angle: 'consideration'
      },
      {
        slug: 'score-para-financiamento-qual-pontuacao-ajuda',
        stage: 'bottom',
        title: 'Score para financiamento: qual pontuacao ajuda e o que o banco avalia',
        primaryKeyword: 'score para financiamento',
        secondaryKeywords: ['score bom para financiar', 'score para financiar carro', 'score para financiamento imovel'],
        angle: 'decision'
      }
    ]
  },
  {
    slug: 'renegociacao-de-dividas',
    primaryKeyword: 'renegociacao de dividas',
    name: 'Renegociacao de dividas',
    pillarTitle: 'Renegociacao de dividas: como organizar prioridades e evitar acordos ruins',
    description: 'Cluster para dividas, limpar nome, cartao, cheque especial e acordos.',
    category: 'Dividas',
    commercialPath: '/emprestimos',
    briefs: [
      {
        slug: 'renegociacao-de-dividas-guia-completo',
        stage: 'pillar',
        title: 'Renegociacao de dividas: guia para negociar sem piorar o orcamento',
        primaryKeyword: 'renegociacao de dividas',
        secondaryKeywords: ['renegociar divida', 'limpar nome', 'acordo de divida'],
        angle: 'pillar'
      },
      {
        slug: 'como-limpar-o-nome-com-seguranca',
        stage: 'top',
        title: 'Como limpar o nome com seguranca: cuidados antes de fechar acordo',
        primaryKeyword: 'como limpar o nome',
        secondaryKeywords: ['nome negativado', 'acordo para limpar nome', 'serasa limpar nome'],
        angle: 'awareness'
      },
      {
        slug: 'renegociar-divida-do-cartao-ou-pegar-emprestimo',
        stage: 'middle',
        title: 'Renegociar divida do cartao ou pegar emprestimo? Como comparar',
        primaryKeyword: 'renegociar divida do cartao',
        secondaryKeywords: ['divida do cartao', 'emprestimo para quitar cartao', 'rotativo do cartao'],
        angle: 'consideration'
      },
      {
        slug: 'acordo-de-divida-vale-a-pena',
        stage: 'bottom',
        title: 'Acordo de divida vale a pena? Veja quando a parcela cabe no bolso',
        primaryKeyword: 'acordo de divida vale a pena',
        secondaryKeywords: ['parcelar divida', 'desconto para quitar divida', 'negociar divida atrasada'],
        angle: 'decision'
      }
    ]
  },
  {
    slug: 'juros-abusivos',
    primaryKeyword: 'juros abusivos',
    name: 'Juros abusivos',
    pillarTitle: 'Juros abusivos: como identificar sinais, comparar contrato e buscar orientacao',
    description: 'Cluster para educacao e comparacao sobre juros abusivos em cartao, emprestimo e financiamento.',
    category: 'Juros abusivos',
    commercialPath: '/emprestimos',
    briefs: [
      {
        slug: 'juros-abusivos-guia-completo',
        stage: 'pillar',
        title: 'Juros abusivos: como identificar sinais no contrato e no custo total',
        primaryKeyword: 'juros abusivos',
        secondaryKeywords: ['como identificar juros abusivos', 'juros abusivos no contrato', 'taxa abusiva'],
        angle: 'pillar'
      },
      {
        slug: 'juros-abusivos-no-cartao-como-identificar',
        stage: 'top',
        title: 'Juros abusivos no cartao: como identificar rotativo, parcelamento e encargos',
        primaryKeyword: 'juros abusivos no cartao',
        secondaryKeywords: ['rotativo do cartao', 'parcelamento da fatura', 'encargos do cartao'],
        angle: 'awareness'
      },
      {
        slug: 'juros-abusivos-em-financiamento-de-veiculo',
        stage: 'middle',
        title: 'Juros abusivos em financiamento de veiculo: quais pontos analisar',
        primaryKeyword: 'juros abusivos em financiamento de veiculo',
        secondaryKeywords: ['revisao de financiamento', 'CET financiamento veiculo', 'contrato de carro'],
        angle: 'consideration'
      },
      {
        slug: 'revisao-de-juros-abusivos-quando-procurar-ajuda',
        stage: 'bottom',
        title: 'Revisao de juros abusivos: quando procurar ajuda e quais documentos separar',
        primaryKeyword: 'revisao de juros abusivos',
        secondaryKeywords: ['documentos para revisar contrato', 'juros abusivos emprestimo', 'analise de contrato'],
        angle: 'decision'
      }
    ]
  }
]);
