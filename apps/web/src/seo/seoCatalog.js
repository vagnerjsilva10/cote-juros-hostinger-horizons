import { merchantMachineComparePages, merchantMachineStaticPages } from './merchantMachinesCatalog.js';
import { normalizeMojibakeDeep } from '../lib/textEncoding.js';

const DEFAULT_SITE_URL = 'https://cote-juros-hostinger-horizons-web.vercel.app';

export const corePillarPaths = [
  '/',
  '/emprestimos',
  '/cartoes',
  '/financiamentos',
  '/ferramentas',
  '/comparar',
  '/bancos',
  '/blog'
];

export const requiredBankRoutes = [
  { slug: 'nubank', bankId: 'nubank', name: 'Nubank' },
  { slug: 'itau', bankId: 'itau', name: 'ItaÃº' },
  { slug: 'santander', bankId: 'santander', name: 'Santander' },
  { slug: 'inter', bankId: 'inter', name: 'Banco Inter' },
  { slug: 'c6-bank', bankId: 'c6', name: 'C6 Bank' },
  { slug: 'bradesco', bankId: 'bradesco', name: 'Bradesco' },
  { slug: 'caixa', bankId: 'caixa', name: 'Caixa EconÃ´mica' }
];

export const comparePageDefinitions = [
  {
    slug: 'cartoes-sem-anuidade',
    heading: 'Compare cartÃµes sem anuidade por limite e benefÃ­cios.',
    title: 'Comparar cartÃµes sem anuidade: melhores opÃ§Ãµes e benefÃ­cios | Cote Juros',
    description: 'Veja cartÃµes sem anuidade com anÃ¡lise de limite, benefÃ­cios e perfil de aprovaÃ§Ã£o.',
    productType: 'credit_card',
    offerFilter: { annualFeeZero: true, sortBy: 'maxLimit' }
  },
  {
    slug: 'cartoes-cashback',
    heading: 'Compare cartÃµes com cashback e retorno em compras.',
    title: 'Comparar cartÃµes com cashback: taxas, limite e retorno | Cote Juros',
    description: 'Analise cartÃµes com cashback, anuidade e ganhos reais no dia a dia.',
    productType: 'credit_card',
    offerFilter: { benefitsAny: ['cashback'], sortBy: 'maxLimit' }
  },
  {
    slug: 'cartoes-milhas',
    heading: 'Compare cartÃµes com milhas para viajar pagando menos.',
    title: 'Comparar cartÃµes com milhas: pontuaÃ§Ã£o e benefÃ­cios | Cote Juros',
    description: 'Comparamos cartÃµes com milhas por pontuaÃ§Ã£o, anuidade e benefÃ­cios premium.',
    productType: 'credit_card',
    offerFilter: { benefitsAny: ['milhas', 'pontos'], sortBy: 'maxLimit' }
  },
  {
    slug: 'emprestimo-negativado',
    heading: 'Compare emprÃ©stimo para negativado com mais seguranÃ§a.',
    title: 'Comparar emprÃ©stimo para negativado: taxas e condiÃ§Ãµes | Cote Juros',
    description: 'Veja linhas de crÃ©dito para negativado, com foco em custo total e chance de aprovaÃ§Ã£o.',
    productType: 'loan',
    offerFilter: { categoriesAny: ['Negativado', 'Consignado'], sortBy: 'monthlyRate' }
  },
  {
    slug: 'emprestimo-online',
    heading: 'Compare emprÃ©stimo online antes de contratar crÃ©dito.',
    title: 'Comparar emprÃ©stimo online: taxas atualizadas e prazos | Cote Juros',
    description: 'Compare emprÃ©stimos online em um painel com taxas, prazos e valores mÃ¡ximos.',
    productType: 'loan',
    offerFilter: { categoriesAny: ['Pessoal', 'Garantia', 'Consignado'], sortBy: 'monthlyRate' },
    primaryCta: { label: 'Simular emprestimo', action: 'affiliate' },
    secondaryCta: { label: 'Ver comparacao completa', to: '/comparar/emprestimo-online' },
    heroFeature: {
      eyebrow: 'Oferta editorial em destaque',
      title: 'SuperSim',
      description:
        'Para quem quer pesquisar credito online sem cair em pagina comercial, a SuperSim aparece aqui como recomendacao editorial dentro de uma comparacao mais ampla.'
    },
    heroBadges: ['Analise rapida', 'Para negativado', 'Sem garantia', 'Online'],
    editorialSections: [
      {
        heading: 'Como pesquisar emprestimo online com mais clareza',
        paragraphs: [
          'Emprestimo online facilita a jornada, mas a decisao nao deve ser automatica. O ideal e cruzar velocidade, custo total e perfil de aprovacao antes do clique final.',
          'Nesta rota, a SuperSim entra como um CTA natural dentro da leitura editorial, sem competir com o comparador principal do portal.'
        ]
      },
      {
        heading: 'Onde a SuperSim faz sentido',
        paragraphs: [
          'A oferta ganha relevancia quando a prioridade e um processo digital e uma experiencia de simulacao mais objetiva.',
          'Ainda assim, ela deve ser lida como parte da comparacao. Em alguns perfis, outra modalidade pode gerar custo menor.'
        ],
        bullets: ['Boa aderencia para quem quer rapidez.', 'Ajuda a seguir a jornada com menos friccao.', 'Precisa ser comparada com parcela e custo total.']
      },
      {
        heading: 'Como evitar uma decisao apressada',
        paragraphs: [
          'Mesmo quando a pesquisa e online, vale reservar alguns minutos para olhar prazo, valor final pago e encaixe da parcela no orcamento.',
          'Essa leitura simples ja elimina boa parte dos erros mais comuns em credito pessoal.'
        ]
      }
    ],
    faq: [
      {
        question: 'Emprestimo online e sempre mais rapido?',
        answer:
          'O fluxo costuma ser mais agil, mas a velocidade real depende de analise, documentacao e politicas de cada parceiro.'
      },
      {
        question: 'A SuperSim e a unica opcao para emprestimo online?',
        answer:
          'Nao. Ela aparece aqui como uma recomendacao editorial, mas a comparacao com outras rotas do portal continua importante.'
      },
      {
        question: 'Como saber se a parcela vai caber?',
        answer:
          'Olhe o valor total pago, a quantidade de parcelas e o peso mensal no seu orcamento antes de seguir.'
      }
    ],
    linkGroups: [
      {
        title: 'Continue comparando',
        links: [
          { label: 'Comparar emprestimo online', path: '/comparar/emprestimo-online' },
          { label: 'Emprestimo para negativado', path: '/emprestimo-para-negativado' },
          { label: 'Pagina editorial da SuperSim', path: '/supersim-emprestimo' }
        ]
      }
    ],
    recommendationCards: [
      {
        label: 'Guia editorial',
        title: 'Entenda melhor a SuperSim antes do clique',
        description: 'Veja a analise completa com funcionamento, comparacao e FAQ.',
        ctaLabel: 'Abrir guia',
        to: '/supersim-emprestimo'
      }
    ]
  },
  {
    slug: 'financiamento-veiculo',
    heading: 'Compare financiamento de veÃ­culo por taxa, entrada e prazo.',
    title: 'Comparar financiamento de veÃ­culo: bancos e taxas | Cote Juros',
    description: 'Avalie financiamento de carro por custo total, entrada mÃ­nima e prazo mÃ¡ximo.',
    productType: 'financing',
    offerFilter: { categoriesAny: ['Carro', 'Moto'], sortBy: 'annualRate' }
  },
  ...merchantMachineComparePages
];

export const toolPageDefinitions = [
  {
    path: '/calculadora-juros',
    heading: 'Calculadora de juros para simular custo total do crÃ©dito.',
    title: 'Calculadora de juros: simulaÃ§Ã£o grÃ¡tis e rÃ¡pida | Cote Juros',
    description: 'Projete juros simples e compostos para comparar cenÃ¡rios antes de contratar crÃ©dito.',
    toolType: 'juros'
  },
  {
    path: '/calculadora-emprestimo',
    heading: 'Calculadora de emprÃ©stimo com foco em parcela e custo efetivo.',
    title: 'Calculadora de emprÃ©stimo: parcela e CET | Cote Juros',
    description: 'Simule emprÃ©stimo com taxa, prazo e valor para prever a parcela ideal.',
    toolType: 'emprestimo'
  },
  {
    path: '/calculadora-financiamento',
    heading: 'Calculadora de financiamento para organizar entrada e prazo.',
    title: 'Calculadora de financiamento de veÃ­culo e imÃ³vel | Cote Juros',
    description: 'Compare cenÃ¡rios de financiamento e reduza risco de juros abusivos.',
    toolType: 'financiamento'
  },
  {
    path: '/calculadora-parcela',
    heading: 'Calculadora de parcela para validar o peso da dÃ­vida no orÃ§amento.',
    title: 'Calculadora de parcela mensal com simulaÃ§Ã£o online | Cote Juros',
    description: 'Estime parcela ideal por valor financiado, taxa de juros e prazo em meses.',
    toolType: 'parcela'
  },
  {
    path: '/calculadora-comprometimento-renda',
    heading: 'Calculadora de comprometimento de renda para crÃ©dito responsÃ¡vel.',
    title: 'Calculadora de comprometimento de renda | Cote Juros',
    description: 'Veja se sua renda comporta o crÃ©dito e compare alternativas mais seguras.',
    toolType: 'comprometimento-renda'
  },
  {
    path: '/calculadora-cet',
    heading: 'Calculadora de CET para comparar o custo real entre bancos.',
    title: 'Calculadora de CET: compare custo efetivo total | Cote Juros',
    description: 'Calcule e compare CET para tomar decisÃµes financeiras mais inteligentes.',
    toolType: 'cet'
  }
];

export const blogEditorialDefinitions = [
  {
    path: '/blog/melhor-cartao-de-credito',
    heading: 'Melhor cartÃ£o de crÃ©dito: como escolher para o seu perfil.',
    title: 'Melhor cartÃ£o de crÃ©dito: guia completo para comparar | Cote Juros',
    description: 'Saiba como comparar anuidade, limite e benefÃ­cios para encontrar o melhor cartÃ£o.',
    articleCategory: 'CartÃµes de crÃ©dito',
    body: [
      'O melhor cartÃ£o de crÃ©dito nÃ£o Ã© o mais famoso, e sim o que combina com seu momento financeiro. Para decidir com seguranÃ§a, compare limite inicial, polÃ­tica de aumento de limite, anuidade e benefÃ­cios reais.',
      'No Cote Juros, vocÃª consegue cruzar custo e benefÃ­cio em um Ãºnico painel. A recomendaÃ§Ã£o prÃ¡tica Ã© comeÃ§ar por cartÃµes sem anuidade e sÃ³ migrar para opÃ§Ãµes premium quando os benefÃ­cios realmente compensarem.',
      'Antes de solicitar, avalie o impacto do cartÃ£o no seu orÃ§amento mensal. CartÃ£o bom Ã© aquele que melhora sua rotina e nÃ£o compromete sua margem de pagamento.'
    ]
  },
  {
    path: '/blog/como-aumentar-limite-cartao',
    heading: 'Como aumentar limite do cartÃ£o com estratÃ©gia e consistÃªncia.',
    title: 'Como aumentar limite do cartÃ£o: passos prÃ¡ticos | Cote Juros',
    description: 'Entenda como bancos avaliam limite e o que fazer para evoluir com mais rapidez.',
    articleCategory: 'CartÃµes de crÃ©dito',
    body: [
      'Aumento de limite depende de comportamento. Os bancos observam frequÃªncia de uso, pagamento em dia e estabilidade de renda para decidir novas liberaÃ§Ãµes.',
      'Concentrar gastos no cartÃ£o principal, manter baixa inadimplÃªncia e atualizar renda no app sÃ£o aÃ§Ãµes que aumentam chance de aprovaÃ§Ã£o para limite maior.',
      'Evite usar o limite total todos os meses. O ideal Ã© manter uso equilibrado e histÃ³rico positivo, mostrando capacidade de pagamento sustentÃ¡vel.'
    ]
  },
  {
    path: '/blog/emprestimo-para-negativado-funciona',
    heading: 'EmprÃ©stimo para negativado funciona? Entenda quando vale a pena.',
    title: 'EmprÃ©stimo para negativado funciona? Guia honesto | Cote Juros',
    description: 'Veja quais modalidades existem para negativado e como evitar custos abusivos.',
    articleCategory: 'EmprÃ©stimos',
    body: [
      'EmprÃ©stimo para negativado funciona quando hÃ¡ compatibilidade entre renda, parcela e risco da operaÃ§Ã£o. As opÃ§Ãµes mais comuns sÃ£o consignado e crÃ©dito com garantia.',
      'A chave Ã© comparar o custo efetivo total e nÃ£o apenas a taxa mensal. Em cenÃ¡rios de urgÃªncia, a pressa pode levar a contratos caros e difÃ­ceis de manter.',
      'Use comparadores confiÃ¡veis para validar bancos, taxas e condiÃ§Ãµes. Nunca faÃ§a pagamento antecipado para liberar crÃ©dito.'
    ]
  },
  {
    path: '/blog/qual-banco-libera-credito-mais-facil',
    heading: 'Qual banco libera crÃ©dito mais fÃ¡cil? Compare critÃ©rios reais.',
    title: 'Qual banco libera crÃ©dito mais fÃ¡cil? Comparativo atualizado | Cote Juros',
    description: 'Descubra quais critÃ©rios pesam na aprovaÃ§Ã£o e como melhorar seu perfil.',
    articleCategory: 'EmprÃ©stimos',
    body: [
      'NÃ£o existe um banco Ãºnico que aprova todo mundo. Cada instituiÃ§Ã£o combina score, renda, histÃ³rico e relacionamento para definir risco e limite.',
      'Bancos digitais costumam ter esteiras mais rÃ¡pidas, enquanto bancos tradicionais podem oferecer linhas com taxas melhores para clientes com relacionamento.',
      'A forma mais segura de ganhar velocidade Ã© comparar vÃ¡rios bancos em paralelo e ajustar o pedido ao seu perfil financeiro.'
    ]
  },
  {
    path: '/blog/como-reduzir-juros-do-emprestimo',
    heading: 'Como reduzir juros do emprÃ©stimo antes de contratar.',
    title: 'Como reduzir juros do emprÃ©stimo: estratÃ©gias prÃ¡ticas | Cote Juros',
    description: 'Aprenda tÃ¡ticas de negociaÃ§Ã£o e comparaÃ§Ã£o para pagar menos juros.',
    articleCategory: 'EducaÃ§Ã£o financeira',
    body: [
      'A melhor forma de reduzir juros Ã© entrar na negociaÃ§Ã£o com dados. Leve simulaÃ§Ãµes de bancos concorrentes e use o CET como referÃªncia de comparaÃ§Ã£o.',
      'Aumentar entrada, reduzir prazo e incluir garantia sÃ£o aÃ§Ãµes que normalmente derrubam taxa e melhoram custo total da operaÃ§Ã£o.',
      'Evite contratar crÃ©dito sem comparar pelo menos trÃªs propostas. Pequenas diferenÃ§as na taxa podem gerar economia relevante no contrato completo.'
    ]
  }
];

const loanCluster = [
  {
    path: '/supersim-emprestimo',
    heading: 'SuperSim Emprestimo: como funciona, quem pode pedir e se vale a pena',
    title: 'SuperSim Emprestimo: como funciona, quem pode pedir e se vale a pena | Cote Juros',
    description:
      'Guia editorial da SuperSim com funcionamento, perfil de aprovacao, valores, prazos, comparacao com outras opcoes e FAQ.',
    badge: 'Guia editorial',
    productType: 'loan',
    offerFilter: { categoriesAny: ['Pessoal', 'Negativado'], sortBy: 'monthlyRate' },
    primaryCta: { label: 'Simular emprestimo', action: 'affiliate' },
    secondaryCta: { label: 'Comparar emprestimos', to: '/emprestimos' },
    heroFeature: {
      eyebrow: 'Oferta editorial em destaque',
      title: 'SuperSim',
      description:
        'Leitura clara para entender onde a SuperSim se encaixa dentro da sua pesquisa por emprestimo online.'
    },
    heroBadges: ['Analise rapida', 'Para negativado', 'Sem garantia', 'Online'],
    highlights: [
      { label: 'Fluxo', value: '100% online' },
      { label: 'Perfil pesquisado', value: 'Credito pessoal' },
      { label: 'Leitura editorial', value: 'Sem tom comercial' }
    ],
    editorialSections: [
      {
        heading: 'O que e a SuperSim',
        paragraphs: [
          'A SuperSim aparece no radar de quem procura emprestimo pessoal online com uma esteira simples de simulacao e resposta rapida. No portal, ela entra como recomendacao editorial para usuarios que querem manter a pesquisa organizada sem sair clicando em varias paginas comerciais.',
          'O papel desta pagina e mostrar como a oferta funciona, quando ela pode fazer sentido e quais cuidados precisam ser considerados antes da solicitacao.'
        ]
      },
      {
        heading: 'Como funciona o emprestimo',
        paragraphs: [
          'O fluxo comeca com simulacao online, envio de dados e analise do perfil. A experiencia tende a ser objetiva, sem exigir garantia real para iniciar a jornada.',
          'Isso nao significa aprovacao automatica. A liberacao depende das regras do parceiro e da leitura de risco feita no momento do pedido.'
        ],
        bullets: ['Simulacao digital.', 'Analise de perfil antes da aprovacao.', 'Etapas pensadas para quem quer ganhar tempo.']
      },
      {
        heading: 'Quem pode solicitar',
        paragraphs: [
          'A procura costuma ser maior entre pessoas que precisam de credito pessoal online, inclusive usuarios que pesquisam alternativas para negativado.',
          'Mesmo assim, a decisao final depende de renda, historico, valor pedido e capacidade de pagamento.'
        ],
        bullets: [
          'Quem quer uma opcao sem garantia.',
          'Quem prefere processo online.',
          'Quem precisa comparar uma alternativa antes de fechar com banco tradicional.'
        ]
      },
      {
        heading: 'Valores disponiveis',
        paragraphs: [
          'Os valores aprovados variam conforme analise. O mais importante aqui nao e perseguir o limite maximo, e sim pedir apenas o que faz sentido para o objetivo imediato.',
          'No Cote Juros, a orientacao editorial e sempre alinhar o valor solicitado a uma parcela que continue sustentavel.'
        ]
      },
      {
        heading: 'Taxas e prazos',
        paragraphs: [
          'Como em qualquer emprestimo online, taxa e prazo mudam de acordo com o risco percebido na analise. Por isso, a melhor leitura nao olha so a promessa de velocidade.',
          'Vale observar custo total, quantidade de parcelas, valor final pago e possibilidade de comparar com outras linhas do portal.'
        ]
      },
      {
        heading: 'Pontos positivos',
        bullets: ['Fluxo online e mais direto.', 'Boa aderencia a pesquisas sobre credito rapido.', 'Ajuda o usuario a seguir a jornada sem sair do contexto editorial.']
      },
      {
        heading: 'Pontos de atencao',
        bullets: ['Aprovacao e limite nao sao garantidos.', 'Credito rapido ainda precisa caber no orcamento.', 'Sempre vale comparar com outra modalidade quando houver taxa menor.']
      },
      {
        heading: 'Comparacao com outras opcoes',
        paragraphs: [
          'A SuperSim faz mais sentido quando o usuario valoriza simplicidade e rapidez de fluxo. Em contrapartida, outras modalidades podem levar vantagem em custo quando ha margem consignavel ou bem em garantia.',
          'A recomendacao editorial e usar a SuperSim como um dos pontos de comparacao, nao como unica referencia.'
        ]
      },
      {
        heading: 'Para quem esse emprestimo faz sentido',
        paragraphs: [
          'Funciona melhor para quem quer resolver uma necessidade objetiva, prefere processo digital e busca um caminho natural dentro do portal para continuar a pesquisa.',
          'Se a prioridade for menor taxa absoluta, talvez outra modalidade seja mais adequada. Se a prioridade for agilidade com leitura simples, a SuperSim ganha espaco.'
        ]
      }
    ],
    comparisonTable: {
      columns: ['Opcao', 'Ponto forte', 'Ponto de atencao', 'Melhor encaixe'],
      rows: [
        ['SuperSim', 'Fluxo online e analise rapida', 'Conferir custo total e limite aprovado', 'Quem quer ganhar velocidade sem sair pesquisando do zero'],
        ['Consignado', 'Taxa normalmente menor', 'Exige margem consignavel', 'Aposentados, pensionistas ou servidores'],
        ['Credito com garantia', 'Pode ampliar valor e prazo', 'Envolve bem em garantia', 'Quem busca custo menor e tem patrimonio'],
        ['Emprestimo pessoal bancario', 'Mais opcoes em bancos tradicionais', 'Aprovacao pode ser mais seletiva', 'Perfis com score e renda mais estaveis']
      ],
      note:
        'A comparacao acima e editorial e serve para organizar a pesquisa. As condicoes finais sempre dependem da analise de cada parceiro.'
    },
    faq: [
      {
        question: 'A SuperSim faz emprestimo para negativado?',
        answer:
          'A marca costuma aparecer na pesquisa de quem busca credito mesmo com restricao, mas a aprovacao depende da analise do parceiro e do perfil informado.'
      },
      {
        question: 'A simulacao da SuperSim e online?',
        answer:
          'Sim. O fluxo e digital, o que ajuda quem quer entender valores, prazo e etapas antes de sair do portal.'
      },
      {
        question: 'Vale a pena pedir emprestimo na SuperSim?',
        answer:
          'Faz sentido para quem prioriza agilidade e quer comparar uma opcao online sem garantia. Ainda assim, o ideal e analisar custo total, parcela e aderencia ao seu momento.'
      },
      {
        question: 'A pagina da SuperSim no Cote Juros e publi?',
        answer:
          'Nao. O conteudo foi montado como recomendacao editorial, com disclosure discreto e contexto de comparacao para nao parecer pagina comercial.'
      }
    ],
    linkGroups: [
      {
        title: 'Continue comparando',
        links: [
          { label: 'Emprestimo online', path: '/emprestimo-online' },
          { label: 'Emprestimo para negativado', path: '/emprestimo-para-negativado' },
          { label: 'Emprestimo para autonomo', path: '/emprestimo-para-autonomo' },
          { label: 'Emprestimos para MEI', path: '/emprestimos-para-mei' }
        ]
      },
      {
        title: 'Conteudos do portal',
        links: [
          { label: 'Bancos digitais para credito rapido', path: '/bancos-digitais-para-credito-rapido' },
          { label: 'Melhores bancos para solicitar emprestimo', path: '/10-melhores-bancos-para-solicitar-emprestimo' },
          { label: '15 formas de conseguir dinheiro rapido', path: '/15-formas-de-conseguir-dinheiro-rapido-opcoes-e-riscos' }
        ]
      }
    ],
    recommendationCardsTitle: 'Continue a jornada',
    recommendationCards: [
      {
        label: 'Comparador',
        title: 'Ver emprestimos online em contexto',
        description: 'Compare outras rotas do portal antes de sair para a simulacao.',
        ctaLabel: 'Abrir comparador',
        to: '/emprestimo-online'
      },
      {
        label: 'Blog',
        title: 'Leia como evitar decisao no impulso',
        description: 'Artigos do blog ajudam a avaliar urgencia, score e risco antes de contratar.',
        ctaLabel: 'Ler artigo',
        to: '/15-formas-de-conseguir-dinheiro-rapido-opcoes-e-riscos'
      }
    ],
    usageTitle: 'Como ler esta analise',
    usageTips: [
      'Use esta pagina para entender o encaixe da SuperSim, nao para pular a comparacao.',
      'Passe pelo bloco de comparacao antes da simulacao.',
      'Confira tambem os artigos relacionados sobre credito rapido e negativado.'
    ]
  },
  {
    path: '/emprestimo-pessoal',
    heading: 'Emprestimo pessoal com comparacao clara de taxas e condicoes.',
    title: 'Emprestimo pessoal: compare taxas antes de contratar | Cote Juros',
    description: 'Compare emprestimo pessoal por taxa mensal, valor liberado e prazo maximo.',
    productType: 'loan',
    offerFilter: { categoriesAny: ['Pessoal'], sortBy: 'monthlyRate' }
  },
  {
    path: '/emprestimo-consignado',
    heading: 'Emprestimo consignado com foco em menor custo total.',
    title: 'Emprestimo consignado: comparacao de bancos e taxas | Cote Juros',
    description: 'Veja emprestimo consignado com leitura de taxa, prazo e valor disponivel.',
    productType: 'loan',
    offerFilter: { categoriesAny: ['Consignado'], sortBy: 'monthlyRate' }
  },
  {
    path: '/emprestimo-para-negativado',
    heading: 'Emprestimo para negativado com analise de risco e seguranca.',
    title: 'Emprestimo para negativado: compare opcoes reais | Cote Juros',
    description: 'Compare credito para negativado e encontre linhas mais aderentes ao seu perfil.',
    productType: 'loan',
    offerFilter: { categoriesAny: ['Negativado', 'Consignado'], sortBy: 'monthlyRate' }
  },
  {
    path: '/emprestimo-online',
    heading: 'Emprestimo online com comparacao instantanea de bancos.',
    title: 'Emprestimo online: tabela comparativa de taxas | Cote Juros',
    description: 'Analise ofertas de emprestimo online com taxas atualizadas e prazos.',
    productType: 'loan',
    offerFilter: { categoriesAny: ['Pessoal', 'Garantia', 'Consignado'], sortBy: 'monthlyRate' },
    primaryCta: { label: 'Simular emprestimo', action: 'affiliate' },
    secondaryCta: { label: 'Ver comparacao completa', to: '/comparar/emprestimo-online' },
    heroFeature: {
      eyebrow: 'Oferta editorial em destaque',
      title: 'SuperSim',
      description:
        'Para quem quer pesquisar credito online sem cair em pagina comercial, a SuperSim aparece aqui como recomendacao editorial dentro de uma comparacao mais ampla.'
    },
    heroBadges: ['Analise rapida', 'Para negativado', 'Sem garantia', 'Online'],
    editorialSections: [
      {
        heading: 'Como pesquisar emprestimo online com mais clareza',
        paragraphs: [
          'Emprestimo online facilita a jornada, mas a decisao nao deve ser automatica. O ideal e cruzar velocidade, custo total e perfil de aprovacao antes do clique final.',
          'Nesta rota, a SuperSim entra como um CTA natural dentro da leitura editorial, sem competir com o comparador principal do portal.'
        ]
      },
      {
        heading: 'Onde a SuperSim faz sentido',
        paragraphs: [
          'A oferta ganha relevancia quando a prioridade e um processo digital e uma experiencia de simulacao mais objetiva.',
          'Ainda assim, ela deve ser lida como parte da comparacao. Em alguns perfis, outra modalidade pode gerar custo menor.'
        ],
        bullets: ['Boa aderencia para quem quer rapidez.', 'Ajuda a seguir a jornada com menos friccao.', 'Precisa ser comparada com parcela e custo total.']
      },
      {
        heading: 'Como evitar uma decisao apressada',
        paragraphs: [
          'Mesmo quando a pesquisa e online, vale reservar alguns minutos para olhar prazo, valor final pago e encaixe da parcela no orcamento.',
          'Essa leitura simples ja elimina boa parte dos erros mais comuns em credito pessoal.'
        ]
      }
    ],
    faq: [
      {
        question: 'Emprestimo online e sempre mais rapido?',
        answer:
          'O fluxo costuma ser mais agil, mas a velocidade real depende de analise, documentacao e politicas de cada parceiro.'
      },
      {
        question: 'A SuperSim e a unica opcao para emprestimo online?',
        answer:
          'Nao. Ela aparece aqui como uma recomendacao editorial, mas a comparacao com outras rotas do portal continua importante.'
      },
      {
        question: 'Como saber se a parcela vai caber?',
        answer:
          'Olhe o valor total pago, a quantidade de parcelas e o peso mensal no seu orcamento antes de seguir.'
      }
    ],
    linkGroups: [
      {
        title: 'Continue comparando',
        links: [
          { label: 'Comparar emprestimo online', path: '/comparar/emprestimo-online' },
          { label: 'Emprestimo para negativado', path: '/emprestimo-para-negativado' },
          { label: 'Pagina editorial da SuperSim', path: '/supersim-emprestimo' }
        ]
      }
    ],
    recommendationCards: [
      {
        label: 'Guia editorial',
        title: 'Entenda melhor a SuperSim antes do clique',
        description: 'Veja a analise completa com funcionamento, comparacao e FAQ.',
        ctaLabel: 'Abrir guia',
        to: '/supersim-emprestimo'
      }
    ]
  },
  {
    path: '/emprestimo-online-rapido',
    heading: 'Emprestimo online rapido: como buscar velocidade sem perder clareza',
    title: 'Emprestimo online rapido: o que avaliar antes de contratar | Cote Juros',
    description:
      'Guia para quem busca emprestimo online rapido com contexto editorial, FAQ e integracao natural da oferta SuperSim.',
    productType: 'loan',
    offerFilter: { categoriesAny: ['Pessoal', 'Negativado'], sortBy: 'monthlyRate' },
    primaryCta: { label: 'Simular emprestimo', action: 'affiliate' },
    secondaryCta: { label: 'Ver emprestimos', to: '/emprestimos' },
    heroBadges: ['Analise rapida', 'Para negativado', 'Sem garantia', 'Online'],
    editorialSections: [
      {
        heading: 'Velocidade so vale quando vem com contexto',
        paragraphs: [
          'Quem busca emprestimo online rapido normalmente quer reduzir atrito, nao necessariamente contratar a primeira oferta que apareceu.',
          'Por isso a SuperSim entra nesta rota como uma recomendacao editorial: ela aproxima a conversao sem quebrar a experiencia do portal.'
        ]
      },
      {
        heading: 'Por que a SuperSim aparece aqui',
        paragraphs: [
          'A marca conversa com a intencao de busca por rapidez e processo digital. Isso cria um CTA natural depois da leitura, em vez de um bloco com cara de publicidade.',
          'A melhor pratica continua sendo comparar custo, prazo e utilidade real do credito.'
        ]
      }
    ],
    faq: [
      {
        question: 'Emprestimo online rapido significa dinheiro na hora?',
        answer:
          'Nao necessariamente. A rapidez costuma estar na analise e no fluxo digital, mas prazo de liberacao e aprovacao dependem do parceiro.'
      },
      {
        question: 'A SuperSim pode ajudar nessa busca?',
        answer:
          'Ela pode fazer sentido para quem quer um processo digital e leitura simples, desde que a oferta seja comparada com cuidado.'
      }
    ],
    linkGroups: [
      {
        title: 'Leituras complementares',
        links: [
          { label: 'SuperSim Emprestimo', path: '/supersim-emprestimo' },
          { label: 'Emprestimo online', path: '/emprestimo-online' },
          { label: 'Bancos digitais para credito rapido', path: '/bancos-digitais-para-credito-rapido' }
        ]
      }
    ]
  },
  {
    path: '/emprestimo-rapido',
    heading: 'Emprestimo rapido com leitura transparente de custo.',
    title: 'Emprestimo rapido: compare antes de contratar | Cote Juros',
    description: 'Encontre emprestimo rapido com foco em aprovacao e controle de juros.',
    productType: 'loan',
    offerFilter: { sortBy: 'monthlyRate' }
  },
  {
    path: '/emprestimo-sem-consulta',
    heading: 'Emprestimo sem consulta: compare riscos e condicoes reais.',
    title: 'Emprestimo sem consulta: simulacao e comparacao | Cote Juros',
    description: 'Avalie opcoes de credito com criterios flexiveis e menor risco de abuso.',
    productType: 'loan',
    offerFilter: { categoriesAny: ['Negativado', 'Consignado'], sortBy: 'monthlyRate' }
  },
  {
    path: '/emprestimo-para-mei',
    heading: 'Emprestimo para MEI com visao de fluxo de caixa e taxa.',
    title: 'Emprestimo para MEI: compare linhas de credito | Cote Juros',
    description: 'Compare emprestimos para MEI por custo, prazo e valor liberado.',
    productType: 'loan',
    offerFilter: { categoriesAny: ['Pessoal', 'Garantia'], sortBy: 'monthlyRate' }
  },
  {
    path: '/emprestimo-para-autonomo',
    heading: 'Emprestimo para autonomo com analise de aprovacao.',
    title: 'Emprestimo para autonomo: comparacao de taxas | Cote Juros',
    description: 'Encontre credito para autonomo com mais previsibilidade de parcela.',
    productType: 'loan',
    offerFilter: { categoriesAny: ['Pessoal', 'Garantia'], sortBy: 'monthlyRate' },
    primaryCta: { label: 'Simular emprestimo', action: 'affiliate' },
    secondaryCta: { label: 'Ver emprestimo online', to: '/emprestimo-online' },
    heroBadges: ['Analise rapida', 'Para negativado', 'Sem garantia', 'Online'],
    editorialSections: [
      {
        heading: 'O que pesa para o autonomo ao pedir credito',
        paragraphs: [
          'Autonomos costumam buscar flexibilidade, rapidez e menos burocracia. Isso torna a SuperSim uma recomendacao editorial coerente dentro desta rota.',
          'Ao mesmo tempo, vale comparar com outras linhas do portal para nao decidir apenas pela facilidade do fluxo.'
        ]
      },
      {
        heading: 'Quando a SuperSim pode ajudar',
        paragraphs: [
          'Ela conversa bem com quem quer uma experiencia online e leitura simples antes da simulacao.',
          'O cuidado continua sendo o mesmo: confirmar se a parcela encaixa em uma renda que pode oscilar.'
        ]
      }
    ],
    faq: [
      {
        question: 'Autonomo pode pedir emprestimo online?',
        answer:
          'Sim. A aprovacao depende da leitura de renda, historico e perfil, mas existem jornadas digitais voltadas a esse publico.'
      },
      {
        question: 'A SuperSim faz sentido para autonomo?',
        answer:
          'Pode fazer, especialmente quando o objetivo e manter um fluxo simples e online. Ainda assim, o ideal e comparar antes de seguir.'
      }
    ]
  },
  {
    path: '/emprestimo-para-negativado-online',
    heading: 'Emprestimo para negativado online: como comparar com mais seguranca',
    title: 'Emprestimo para negativado online: guia para pesquisar melhor | Cote Juros',
    description:
      'Entenda como avaliar emprestimo para negativado online sem cair em promessa facil e com insercao editorial da SuperSim.',
    productType: 'loan',
    offerFilter: { categoriesAny: ['Negativado', 'Pessoal'], sortBy: 'monthlyRate' },
    primaryCta: { label: 'Simular emprestimo', action: 'affiliate' },
    secondaryCta: { label: 'Ler guia de negativado', to: '/emprestimo-para-negativado' },
    heroBadges: ['Analise rapida', 'Para negativado', 'Sem garantia', 'Online'],
    editorialSections: [
      {
        heading: 'Credito para negativado pede mais filtro',
        paragraphs: [
          'Quem esta negativado costuma pesquisar com urgencia e menos margem para erro. Nessa hora, o portal precisa aproximar a conversao sem parecer pagina comercial.',
          'A SuperSim entra como sugestao editorial alinhada a essa busca, mas o texto continua reforcando comparacao e cautela.'
        ]
      },
      {
        heading: 'Quando a oferta faz sentido',
        paragraphs: [
          'Ela tende a chamar atencao de quem quer uma jornada online sem garantia e com resposta mais rapida.',
          'Ainda assim, o ponto central e analisar custo total, limite aprovado e impacto da parcela.'
        ]
      }
    ],
    faq: [
      {
        question: 'Todo negativado consegue emprestimo online?',
        answer:
          'Nao. Existem opcoes mais acessiveis, mas a aprovacao depende de analise e do risco identificado pelo parceiro.'
      },
      {
        question: 'A SuperSim garante aprovacao?',
        answer:
          'Nao. Ela aparece como alternativa editorial relevante, mas qualquer aprovacao depende do parceiro.'
      }
    ]
  },
  {
    path: '/emprestimo-urgente-hoje',
    heading: 'Emprestimo urgente hoje: como agir com rapidez sem decidir no impulso',
    title: 'Emprestimo urgente hoje: orientacao para quem precisa de dinheiro rapido | Cote Juros',
    description:
      'Conteudo util para quem pesquisa emprestimo urgente hoje, com FAQ, links internos e recomendacao editorial da SuperSim.',
    productType: 'loan',
    offerFilter: { categoriesAny: ['Pessoal', 'Negativado'], sortBy: 'monthlyRate' },
    primaryCta: { label: 'Simular emprestimo', action: 'affiliate' },
    secondaryCta: { label: 'Ver formas de conseguir dinheiro rapido', to: '/15-formas-de-conseguir-dinheiro-rapido-opcoes-e-riscos' },
    heroBadges: ['Analise rapida', 'Para negativado', 'Sem garantia', 'Online'],
    editorialSections: [
      {
        heading: 'Urgencia nao precisa virar impulso',
        paragraphs: [
          'Quando a busca e por emprestimo urgente hoje, o risco de cair em promessa facil aumenta. O papel desta pagina e reduzir esse risco sem esfriar a jornada.',
          'A SuperSim aparece como um CTA editorial natural para quem quer manter rapidez, mas ainda dentro de um ambiente de comparacao.'
        ]
      },
      {
        heading: 'O que checar antes de seguir',
        paragraphs: [
          'Mesmo em cenarios urgentes, vale olhar custo total, prazo e se existe outra rota menos cara no portal.',
          'Alguns minutos de leitura podem evitar uma decisao que pesa por meses.'
        ],
        bullets: ['Nao pague taxa antecipada.', 'Compare com outra pagina do portal.', 'Nao contrate valor acima do necessario.']
      }
    ],
    faq: [
      {
        question: 'Emprestimo urgente hoje e seguro?',
        answer:
          'Pode ser, desde que voce use canais confiaveis, nao pague taxa antecipada e compare o custo antes de contratar.'
      },
      {
        question: 'A SuperSim ajuda quem precisa de resposta rapida?',
        answer:
          'Ela se encaixa nessa intencao de busca, mas continua sendo importante revisar as condicoes antes da simulacao.'
      }
    ]
  },
  {
    path: '/emprestimo-rapido-pix',
    heading: 'Emprestimo rapido Pix: quando a promessa de velocidade faz sentido',
    title: 'Emprestimo rapido Pix: como comparar ofertas com mais contexto | Cote Juros',
    description:
      'Veja como pesquisar emprestimo rapido Pix sem cair em promessas exageradas e com insercao natural da SuperSim.',
    productType: 'loan',
    offerFilter: { categoriesAny: ['Pessoal', 'Negativado'], sortBy: 'monthlyRate' },
    primaryCta: { label: 'Simular emprestimo', action: 'affiliate' },
    secondaryCta: { label: 'Ler sobre credito rapido', to: '/bancos-digitais-para-credito-rapido' },
    heroBadges: ['Analise rapida', 'Para negativado', 'Sem garantia', 'Online'],
    editorialSections: [
      {
        heading: 'O que a busca por Pix rapido realmente significa',
        paragraphs: [
          'Na pratica, essa busca costuma apontar para usuarios que querem agilidade na liberacao e menos friccao na jornada.',
          'A SuperSim aparece aqui como CTA editorial porque conversa com essa expectativa sem transformar a pagina em anuncio.'
        ]
      },
      {
        heading: 'Velocidade precisa vir com comparacao',
        paragraphs: [
          'Mesmo quando a promessa e de fluxo rapido, a aprovacao final continua dependendo de analise.',
          'A pagina foi montada para manter a conversao natural e, ao mesmo tempo, reforcar leitura de custo e encaixe.'
        ]
      }
    ],
    faq: [
      {
        question: 'Emprestimo rapido Pix cai na hora?',
        answer:
          'Nem sempre. Mesmo em fluxos digitais, a liberacao depende da analise, das politicas do parceiro e da confirmacao do cadastro.'
      },
      {
        question: 'A SuperSim combina com essa busca?',
        answer:
          'Sim, porque ela se alinha a quem procura rapidez e experiencia digital, mas ainda precisa ser lida dentro de uma comparacao.'
      }
    ]
  }
];
const cardCluster = [
  {
    path: '/melhores-cartoes-de-credito',
    heading: 'Melhores cartÃµes de crÃ©dito com comparaÃ§Ã£o por perfil.',
    title: 'Melhores cartÃµes de crÃ©dito: compare limite e benefÃ­cios | Cote Juros',
    description: 'Analise cartÃµes por anuidade, limite e benefÃ­cios em uma tabela comparativa.',
    productType: 'credit_card',
    offerFilter: { sortBy: 'maxLimit' }
  },
  {
    path: '/cartao-sem-anuidade',
    heading: 'CartÃ£o sem anuidade com foco em custo zero e praticidade.',
    title: 'CartÃ£o sem anuidade: melhores opÃ§Ãµes para comparar | Cote Juros',
    description: 'Compare cartÃµes sem anuidade por limite, benefÃ­cios e banco emissor.',
    productType: 'credit_card',
    offerFilter: { annualFeeZero: true, sortBy: 'maxLimit' }
  },
  {
    path: '/cartao-com-cashback',
    heading: 'CartÃ£o com cashback para gerar retorno em compras.',
    title: 'CartÃ£o com cashback: comparativo atualizado | Cote Juros',
    description: 'Compare cartÃµes com cashback por retorno, limite e anuidade.',
    productType: 'credit_card',
    offerFilter: { benefitsAny: ['cashback'], sortBy: 'maxLimit' }
  },
  {
    path: '/cartao-com-milhas',
    heading: 'CartÃ£o com milhas para acumular pontos de viagem.',
    title: 'CartÃ£o com milhas: compare pontuaÃ§Ã£o e custo | Cote Juros',
    description: 'Veja cartÃµes com milhas e escolha pela melhor relaÃ§Ã£o custo-benefÃ­cio.',
    productType: 'credit_card',
    offerFilter: { benefitsAny: ['milhas', 'pontos'], sortBy: 'maxLimit' }
  },
  {
    path: '/cartao-para-negativado',
    heading: 'CartÃ£o para negativado com critÃ©rios de entrada mais acessÃ­veis.',
    title: 'CartÃ£o para negativado: compare opÃ§Ãµes e vantagens | Cote Juros',
    description: 'Compare cartÃµes para negativado com foco em aprovaÃ§Ã£o e custo.',
    productType: 'credit_card',
    offerFilter: { annualFeeZero: true, sortBy: 'annualFee' }
  },
  {
    path: '/cartao-para-mei',
    heading: 'CartÃ£o para MEI com benefÃ­cios para rotina empresarial.',
    title: 'CartÃ£o para MEI: compare limite e benefÃ­cios empresariais | Cote Juros',
    description: 'Encontre cartÃ£o para MEI com anÃ¡lise de limite, anuidade e vantagens.',
    productType: 'credit_card',
    offerFilter: { sortBy: 'maxLimit' }
  },
  {
    path: '/cartao-para-score-baixo',
    heading: 'CartÃ£o para score baixo com comparaÃ§Ã£o de risco e custo.',
    title: 'CartÃ£o para score baixo: opÃ§Ãµes para iniciar crÃ©dito | Cote Juros',
    description: 'Compare cartÃµes para score baixo e monte estratÃ©gia de evoluÃ§Ã£o de limite.',
    productType: 'credit_card',
    offerFilter: { annualFeeZero: true, sortBy: 'annualFee' }
  },
  {
    path: '/cartao-com-limite-alto',
    heading: 'CartÃ£o com limite alto para perfis com maior capacidade de renda.',
    title: 'CartÃ£o com limite alto: compare bancos e benefÃ­cios | Cote Juros',
    description: 'Veja cartÃµes com limite alto e compare anuidade, pontos e benefÃ­cios.',
    productType: 'credit_card',
    offerFilter: { minLimit: 10000, sortBy: 'maxLimit' }
  }
];

const financingCluster = [
  {
    path: '/financiamento-veiculo',
    heading: 'Financiamento de veÃ­culo com comparaÃ§Ã£o por taxa e entrada.',
    title: 'Financiamento de veÃ­culo: compare bancos e parcelas | Cote Juros',
    description: 'Compare financiamento de carro e moto por taxa anual e prazo total.',
    productType: 'financing',
    offerFilter: { categoriesAny: ['Carro', 'Moto'], sortBy: 'annualRate' }
  },
  {
    path: '/financiamento-imovel',
    heading: 'Financiamento de imÃ³vel com leitura de custo total.',
    title: 'Financiamento de imÃ³vel: compare taxas e condiÃ§Ãµes | Cote Juros',
    description: 'Analise financiamento imobiliÃ¡rio com prazo, entrada e taxa anual.',
    productType: 'financing',
    offerFilter: { categoriesAny: ['ImobiliÃ¡rio', 'Refinanciamento'], sortBy: 'annualRate' }
  },
  {
    path: '/financiamento-sem-entrada',
    heading: 'Financiamento sem entrada para cenÃ¡rios de menor capital inicial.',
    title: 'Financiamento sem entrada: compare condiÃ§Ãµes reais | Cote Juros',
    description: 'Veja opÃ§Ãµes com entrada reduzida e compare impacto no custo final.',
    productType: 'financing',
    offerFilter: { maxDownPayment: 10, sortBy: 'annualRate' }
  },
  {
    path: '/financiamento-para-negativado',
    heading: 'Financiamento para negativado com anÃ¡lise de alternativas.',
    title: 'Financiamento para negativado: comparaÃ§Ã£o segura | Cote Juros',
    description: 'Compare linhas de financiamento para negativado e reduza risco de contrato ruim.',
    productType: 'financing',
    offerFilter: { categoriesAny: ['Refinanciamento', 'Carro'], sortBy: 'annualRate' }
  },
  {
    path: '/financiamento-carro-usado',
    heading: 'Financiamento de carro usado com comparaÃ§Ã£o de taxas.',
    title: 'Financiamento carro usado: melhores taxas para comparar | Cote Juros',
    description: 'Analise bancos para financiar carro usado por taxa, prazo e entrada.',
    productType: 'financing',
    offerFilter: { categoriesAny: ['Carro'], sortBy: 'annualRate' }
  }
];

const hubPages = [
  {
    path: '/comparar',
    heading: 'Comparadores financeiros para escolher com clareza.',
    title: 'Comparar crÃ©dito, cartÃµes e financiamento | Cote Juros',
    description: 'Acesse comparadores de crÃ©dito, cartÃµes e financiamento para entender custos, benefÃ­cios e condiÃ§Ãµes antes de contratar.',
    pageType: 'hub'
  },
  {
    path: '/bancos',
    heading: 'Bancos comparados em um Ãºnico ecossistema de decisÃ£o.',
    title: 'Bancos para comparar taxas, cartÃµes e emprÃ©stimos | Cote Juros',
    description: 'Explore bancos com visÃ£o de cartÃµes, emprÃ©stimos, financiamento e condiÃ§Ãµes.',
    pageType: 'hub'
  }
];

export const seoStaticPages = normalizeMojibakeDeep([
  ...loanCluster,
  ...cardCluster,
  ...financingCluster,
  ...merchantMachineStaticPages,
  ...toolPageDefinitions.map((tool) => ({ ...tool, pageType: 'tool' })),
  ...blogEditorialDefinitions.map((article) => ({ ...article, pageType: 'blog-article' })),
  ...hubPages
].map((item) => ({
  badge: item.badge || 'Comparador financeiro',
  pageType: item.pageType || 'product',
  ...item
})));

export const reservedSeoStaticPaths = seoStaticPages.map((page) => page.path);

const quickLinkPresets = normalizeMojibakeDeep({
  comparadores: comparePageDefinitions.slice(0, 4).map((page) => ({
    label: page.heading,
    path: `/comparar/${page.slug}`
  })),
  bancos: requiredBankRoutes.map((bank) => ({
    label: `Comparar ${bank.name}`,
    path: `/banco/${bank.slug}`
  })),
  ferramentas: toolPageDefinitions.map((tool) => ({
    label: tool.heading,
    path: tool.path
  })),
  artigos: blogEditorialDefinitions.map((article) => ({
    label: article.heading,
    path: article.path
  }))
});

export function slugify(value = '') {
  return String(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export function resolveSiteUrl() {
  if (typeof window !== 'undefined' && window.location?.origin) return window.location.origin;
  return DEFAULT_SITE_URL;
}

export function getQuickLinks() {
  return quickLinkPresets;
}

export function getStaticSeoPage(path) {
  return normalizeMojibakeDeep(seoStaticPages.find((page) => page.path === path) || null);
}

export function getComparePage(slug) {
  return normalizeMojibakeDeep(comparePageDefinitions.find((page) => page.slug === slug) || null);
}

export function getBankRoute(slug) {
  return normalizeMojibakeDeep(requiredBankRoutes.find((route) => route.slug === slug) || null);
}

export function getBlogEditorialPage(path) {
  return normalizeMojibakeDeep(blogEditorialDefinitions.find((article) => article.path === path) || null);
}

