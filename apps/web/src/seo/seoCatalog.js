import { merchantMachineComparePages, merchantMachineStaticPages } from './merchantMachinesCatalog.js';
import { normalizeMojibakeDeep } from '../lib/textEncoding.js';

const DEFAULT_SITE_URL = 'https://cote-juros-hostinger-horizons-web.vercel.app';

export const corePillarPaths = [
  '/',
  '/emprestimos',
  '/cartoes',
  '/financiamentos',
  '/ferramentas',
  '/como-funciona',
  '/perguntas-frequentes',
  '/comparar',
  '/bancos',
  '/blog'
];

export const requiredBankRoutes = [
  { slug: 'nubank', bankId: 'nubank', name: 'Nubank' },
  { slug: 'itau', bankId: 'itau', name: 'Itaú' },
  { slug: 'santander', bankId: 'santander', name: 'Santander' },
  { slug: 'inter', bankId: 'inter', name: 'Banco Inter' },
  { slug: 'c6-bank', bankId: 'c6', name: 'C6 Bank' },
  { slug: 'bradesco', bankId: 'bradesco', name: 'Bradesco' },
  { slug: 'caixa', bankId: 'caixa', name: 'Caixa Econômica' }
];

export const comparePageDefinitions = [
  {
    slug: 'cartoes-sem-anuidade',
    heading: 'Compare cartões sem anuidade por limite e benefícios.',
    title: 'Comparar cartões sem anuidade: melhores opções e benefícios | Cote Juros',
    description: 'Veja cartões sem anuidade com leitura de limite, benefícios e critérios antes de solicitar.',
    productType: 'credit_card',
    offerFilter: { annualFeeZero: true, sortBy: 'maxLimit' }
  },
  {
    slug: 'cartoes-cashback',
    heading: 'Compare cartões com cashback e retorno em compras.',
    title: 'Comparar cartões com cashback: taxas, limite e retorno | Cote Juros',
    description: 'Analise cartões com cashback, anuidade e ganhos reais no dia a dia.',
    productType: 'credit_card',
    offerFilter: { benefitsAny: ['cashback'], sortBy: 'maxLimit' }
  },
  {
    slug: 'cartoes-milhas',
    heading: 'Compare cartões com milhas para viajar pagando menos.',
    title: 'Comparar cartões com milhas: pontuação e benefícios | Cote Juros',
    description: 'Comparamos cartões com milhas por pontuação, anuidade e benefícios premium.',
    productType: 'credit_card',
    offerFilter: { benefitsAny: ['milhas', 'pontos'], sortBy: 'maxLimit' }
  },
  {
    slug: 'emprestimo-negativado',
    heading: 'Compare empréstimo para negativado com mais segurança.',
    title: 'Comparar empréstimo para negativado: taxas e condições | Cote Juros',
    description: 'Veja linhas de crédito para negativado, com foco em custo total, prazo e critérios do parceiro.',
    productType: 'loan',
    offerFilter: { categoriesAny: ['Negativado', 'Consignado'], sortBy: 'monthlyRate' }
  },
  {
    slug: 'emprestimo-online',
    heading: 'Compare empréstimo online antes de contratar crédito.',
    title: 'Comparar empréstimo online: taxas atualizadas e prazos | Cote Juros',
    description: 'Compare empréstimos online em um painel com taxas, prazos e valores máximos.',
    productType: 'loan',
    offerFilter: { categoriesAny: ['Pessoal', 'Garantia', 'Consignado'], sortBy: 'monthlyRate' },
    primaryCta: { label: 'Simular empréstimo', action: 'affiliate' },
    secondaryCta: { label: 'Ver comparação completa', to: '/comparar/emprestimo-online' },
    heroFeature: {
      eyebrow: 'Oferta editorial em destaque',
      title: 'SuperSim',
      description:
        'Para quem quer pesquisar crédito online sem cair em página comercial, a SuperSim aparece aqui como recomendação editorial dentro de uma comparação mais ampla.'
    },
    heroBadges: ['Análise rápida', 'Para negativado', 'Sem garantia', 'Online'],
    editorialSections: [
      {
        heading: 'Como pesquisar empréstimo online com mais clareza',
        paragraphs: [
          'Empréstimo online facilita a jornada, mas a decisão não deve ser automática. O ideal é cruzar velocidade, custo total e adequação ao seu perfil antes do clique final.',
          'Nesta rota, a SuperSim entra como um CTA natural dentro da leitura editorial, sem competir com o comparador principal do portal.'
        ]
      },
      {
        heading: 'Onde a SuperSim faz sentido',
        paragraphs: [
          'A oferta ganha relevância quando a prioridade é um processo digital e uma experiência de simulação mais objetiva.',
          'Ainda assim, ela deve ser lida como parte da comparação. Em alguns perfis, outra modalidade pode gerar custo menor.'
        ],
        bullets: ['Boa aderência para quem quer rapidez.', 'Ajuda a seguir a jornada com menos fricção.', 'Precisa ser comparada com parcela e custo total.']
      },
      {
        heading: 'Como evitar uma decisao apressada',
        paragraphs: [
          'Mesmo quando a pesquisa é online, vale reservar alguns minutos para olhar prazo, valor final pago e encaixe da parcela no orçamento.',
          'Essa leitura simples já elimina boa parte dos erros mais comuns em crédito pessoal.'
        ]
      }
    ],
    faq: [
      {
        question: 'Empréstimo online é sempre mais rápido?',
        answer:
          'O fluxo costuma ser mais ágil, mas a velocidade real depende de análise, documentação e políticas de cada parceiro.'
      },
      {
        question: 'A SuperSim é a única opção para empréstimo online?',
        answer:
          'Não. Ela aparece aqui como uma recomendação editorial, mas a comparação com outras rotas do portal continua importante.'
      },
      {
        question: 'Como saber se a parcela vai caber?',
        answer:
          'Olhe o valor total pago, a quantidade de parcelas e o peso mensal no seu orçamento antes de seguir.'
      }
    ],
    linkGroups: [
      {
        title: 'Continue comparando',
        links: [
          { label: 'Comparar empréstimo online', path: '/comparar/emprestimo-online' },
          { label: 'Empréstimo para negativado', path: '/emprestimo-para-negativado' },
          { label: 'Página editorial da SuperSim', path: '/supersim-emprestimo' }
        ]
      }
    ],
    recommendationCards: [
      {
        label: 'Guia editorial',
        title: 'Entenda melhor a SuperSim antes do clique',
        description: 'Veja a análise completa com funcionamento, comparação e FAQ.',
        ctaLabel: 'Abrir guia',
        to: '/supersim-emprestimo'
      }
    ]
  },
  {
    slug: 'financiamento-veiculo',
    heading: 'Compare financiamento de veículo por taxa, entrada e prazo.',
    title: 'Comparar financiamento de veículo: bancos e taxas | Cote Juros',
    description: 'Avalie financiamento de carro por custo total, entrada mínima e prazo máximo.',
    productType: 'financing',
    offerFilter: { categoriesAny: ['Carro', 'Moto'], sortBy: 'annualRate' }
  },
  ...merchantMachineComparePages
];

export const toolPageDefinitions = [
  {
    path: '/calculadora-juros',
    heading: 'Calculadora de juros para simular custo total do crédito.',
    title: 'Calculadora de juros: simulação grátis e rápida | Cote Juros',
    description: 'Projete juros simples e compostos para comparar cenários antes de contratar crédito.',
    toolType: 'juros'
  },
  {
    path: '/calculadora-emprestimo',
    heading: 'Calculadora de empréstimo com foco em parcela e custo efetivo.',
    title: 'Calculadora de empréstimo: parcela e CET | Cote Juros',
    description: 'Simule empréstimo com taxa, prazo e valor para prever a parcela ideal.',
    toolType: 'emprestimo'
  },
  {
    path: '/calculadora-financiamento',
    heading: 'Calculadora de financiamento para organizar entrada e prazo.',
    title: 'Calculadora de financiamento de veículo e imóvel | Cote Juros',
    description: 'Compare cenários de financiamento para entender custo, entrada e prazo antes de decidir.',
    toolType: 'financiamento'
  },
  {
    path: '/calculadora-parcela',
    heading: 'Calculadora de parcela para validar o peso da dívida no orçamento.',
    title: 'Calculadora de parcela mensal com simulação online | Cote Juros',
    description: 'Estime parcela ideal por valor financiado, taxa de juros e prazo em meses.',
    toolType: 'parcela'
  },
  {
    path: '/calculadora-comprometimento-renda',
    heading: 'Calculadora de comprometimento de renda para crédito responsável.',
    title: 'Calculadora de comprometimento de renda | Cote Juros',
    description: 'Veja se sua renda comporta o crédito e compare alternativas mais seguras.',
    toolType: 'comprometimento-renda'
  },
  {
    path: '/calculadora-cet',
    heading: 'Calculadora de CET para comparar o custo real entre bancos.',
    title: 'Calculadora de CET: compare custo efetivo total | Cote Juros',
    description: 'Calcule e compare CET para decidir com mais clareza.',
    toolType: 'cet'
  }
];

export const blogEditorialDefinitions = [
  {
    path: '/blog/melhor-cartao-de-credito',
    heading: 'Melhor cartão de crédito: como escolher para o seu perfil.',
    title: 'Melhor cartão de crédito: guia completo para comparar | Cote Juros',
    description: 'Saiba como comparar anuidade, limite e benefícios para encontrar o melhor cartão.',
    articleCategory: 'Cartões de crédito',
    body: [
      'O melhor cartão de crédito não é o mais famoso, e sim o que combina com seu momento financeiro. Para decidir com segurança, compare limite inicial, política de aumento de limite, anuidade e benefícios reais.',
      'No Cote Juros, você consegue cruzar custo e benefício em um único painel. A recomendação prática é começar por cartões sem anuidade e só migrar para opções premium quando os benefícios realmente compensarem.',
      'Antes de solicitar, avalie o impacto do cartão no seu orçamento mensal. Cartão bom é aquele que melhora sua rotina e não compromete sua margem de pagamento.'
    ]
  },
  {
    path: '/blog/como-aumentar-limite-cartao',
    heading: 'Como aumentar limite do cartão com estratégia e consistência.',
    title: 'Como aumentar limite do cartão: passos práticos | Cote Juros',
    description: 'Entenda como bancos avaliam limite e o que fazer para evoluir com mais rapidez.',
    articleCategory: 'Cartões de crédito',
    body: [
      'Aumento de limite depende de comportamento. Os bancos observam frequência de uso, pagamento em dia e estabilidade de renda para decidir novas liberações.',
      'Concentrar gastos no cartão principal, pagar em dia e atualizar renda no app são ações que podem melhorar a leitura do seu perfil para limite maior.',
      'Evite usar o limite total todos os meses. O ideal é manter uso equilibrado e histórico positivo, mostrando capacidade de pagamento sustentável.'
    ]
  },
  {
    path: '/blog/emprestimo-para-negativado-funciona',
    heading: 'Empréstimo para negativado funciona? Entenda quando vale a pena.',
    title: 'Empréstimo para negativado funciona? Guia honesto | Cote Juros',
    description: 'Veja quais modalidades existem para negativado e como evitar custos que pesam demais.',
    articleCategory: 'Empréstimos',
    body: [
      'Empréstimo para negativado funciona quando há compatibilidade entre renda, parcela e risco da operação. As opções mais comuns são consignado e crédito com garantia.',
      'A chave é comparar o custo efetivo total e não apenas a taxa mensal. Em cenários de urgência, a pressa pode levar a contratos caros e difíceis de manter.',
      'Use comparadores confiáveis para validar bancos, taxas e condições. Nunca faça pagamento antecipado para liberar crédito.'
    ]
  },
  {
    path: '/blog/qual-banco-libera-credito-mais-facil',
    heading: 'Qual banco libera crédito mais fácil? Compare critérios reais.',
    title: 'Qual banco libera crédito mais fácil? Comparativo atualizado | Cote Juros',
    description: 'Entenda quais critérios os bancos costumam observar e como comparar com mais calma.',
    articleCategory: 'Empréstimos',
    body: [
      'Não existe um banco único que aprova todo mundo. Cada instituição combina score, renda, histórico e relacionamento para definir risco e limite.',
      'Bancos digitais costumam ter esteiras mais rápidas, enquanto bancos tradicionais podem oferecer linhas com taxas melhores para clientes com relacionamento.',
      'A forma mais segura de ganhar velocidade é comparar vários bancos em paralelo e ajustar o pedido ao seu perfil financeiro.'
    ]
  },
  {
    path: '/blog/como-reduzir-juros-do-emprestimo',
    heading: 'Como reduzir juros do empréstimo antes de contratar.',
    title: 'Como reduzir juros do empréstimo: estratégias práticas | Cote Juros',
    description: 'Aprenda táticas de negociação e comparação para pagar menos juros.',
    articleCategory: 'Educação financeira',
    body: [
      'A melhor forma de reduzir juros é entrar na negociação com dados. Leve simulações de bancos concorrentes e use o CET como referência de comparação.',
      'Aumentar entrada, reduzir prazo e incluir garantia são ações que normalmente derrubam taxa e melhoram custo total da operação.',
      'Evite contratar crédito sem comparar pelo menos três propostas. Pequenas diferenças na taxa podem gerar economia relevante no contrato completo.'
    ]
  }
];

const loanCluster = [
  {
    path: '/supersim-emprestimo',
    heading: 'SuperSim Emprestimo: como funciona, quem pode pedir e se vale a pena',
    title: 'SuperSim Emprestimo: como funciona, quem pode pedir e se vale a pena | Cote Juros',
    description:
      'Guia editorial da SuperSim com funcionamento, critérios, valores, prazos, comparação com outras opções e FAQ.',
    badge: 'Guia editorial',
    productType: 'loan',
    offerFilter: { categoriesAny: ['Pessoal', 'Negativado'], sortBy: 'monthlyRate' },
    primaryCta: { label: 'Simular emprestimo', action: 'affiliate' },
    secondaryCta: { label: 'Comparar emprestimos', to: '/emprestimos' },
    heroFeature: {
      eyebrow: 'Oferta editorial em destaque',
      title: 'SuperSim',
      description:
        'Leitura clara para entender onde a SuperSim se encaixa dentro da sua pesquisa por empréstimo online.'
    },
    heroBadges: ['Análise rápida', 'Para negativado', 'Sem garantia', 'Online'],
    highlights: [
      { label: 'Fluxo', value: '100% online' },
      { label: 'Perfil pesquisado', value: 'Credito pessoal' },
      { label: 'Leitura editorial', value: 'Sem tom comercial' }
    ],
    editorialSections: [
      {
    heading: 'O que é a SuperSim',
        paragraphs: [
          'A SuperSim aparece no radar de quem procura empréstimo pessoal online com uma esteira simples de simulação e resposta rápida. No portal, ela entra como recomendação editorial para usuários que querem manter a pesquisa organizada sem sair clicando em várias páginas comerciais.',
          'O papel desta página é mostrar como a oferta funciona, quando ela pode fazer sentido e quais cuidados precisam ser considerados antes da solicitação.'
        ]
      },
      {
        heading: 'Como funciona o empréstimo',
        paragraphs: [
          'O fluxo começa com simulação online, envio de dados e análise do perfil. A experiência tende a ser objetiva, sem exigir garantia real para iniciar a jornada.',
          'Isso não significa aprovação automática. A liberação depende das regras do parceiro e da leitura de risco feita no momento do pedido.'
        ],
        bullets: ['Simulação digital.', 'Análise de perfil antes da aprovação.', 'Etapas pensadas para quem quer ganhar tempo.']
      },
      {
        heading: 'Quem pode solicitar',
        paragraphs: [
          'A procura costuma ser maior entre pessoas que precisam de crédito pessoal online, inclusive usuários que pesquisam alternativas para negativado.',
          'Mesmo assim, a decisão final depende de renda, histórico, valor pedido e capacidade de pagamento.'
        ],
        bullets: [
          'Quem quer uma opção sem garantia.',
          'Quem prefere processo online.',
          'Quem precisa comparar uma alternativa antes de fechar com banco tradicional.'
        ]
      },
      {
        heading: 'Valores disponíveis',
        paragraphs: [
          'Os valores aprovados variam conforme análise. O mais importante aqui não é perseguir o limite máximo, e sim pedir apenas o que faz sentido para o objetivo imediato.',
          'No Cote Juros, a orientação editorial é sempre alinhar o valor solicitado a uma parcela que continue sustentável.'
        ]
      },
      {
        heading: 'Taxas e prazos',
        paragraphs: [
          'Como em qualquer empréstimo online, taxa e prazo mudam de acordo com o risco percebido na análise. Por isso, a melhor leitura não olha só a promessa de velocidade.',
          'Vale observar custo total, quantidade de parcelas, valor final pago e possibilidade de comparar com outras linhas do portal.'
        ]
      },
      {
        heading: 'Pontos positivos',
        bullets: ['Fluxo online é mais direto.', 'Boa aderência a pesquisas sobre crédito rápido.', 'Ajuda o usuário a seguir a jornada sem sair do contexto editorial.']
      },
      {
        heading: 'Pontos de atenção',
        bullets: ['Aprovação e limite não são garantidos.', 'Crédito rápido ainda precisa caber no orçamento.', 'Sempre vale comparar com outra modalidade quando houver taxa menor.']
      },
      {
        heading: 'Comparação com outras opções',
        paragraphs: [
          'A SuperSim faz mais sentido quando o usuário valoriza simplicidade e rapidez de fluxo. Em contrapartida, outras modalidades podem levar vantagem em custo quando há margem consignável ou bem em garantia.',
          'A recomendação editorial é usar a SuperSim como um dos pontos de comparação, não como única referência.'
        ]
      },
      {
        heading: 'Para quem esse empréstimo faz sentido',
        paragraphs: [
          'Funciona melhor para quem quer resolver uma necessidade objetiva, prefere processo digital e busca um caminho natural dentro do portal para continuar a pesquisa.',
          'Se a prioridade for menor taxa absoluta, talvez outra modalidade seja mais adequada. Se a prioridade for agilidade com leitura simples, a SuperSim ganha espaço.'
        ]
      }
    ],
    comparisonTable: {
      columns: ['Opção', 'Ponto forte', 'Ponto de atenção', 'Melhor encaixe'],
      rows: [
        ['SuperSim', 'Fluxo online e análise rápida', 'Conferir custo total e limite aprovado', 'Quem quer ganhar velocidade sem sair pesquisando do zero'],
        ['Consignado', 'Taxa normalmente menor', 'Exige margem consignável', 'Aposentados, pensionistas ou servidores'],
        ['Crédito com garantia', 'Pode ampliar valor e prazo', 'Envolve bem em garantia', 'Quem busca custo menor e tem patrimônio'],
        ['Empréstimo pessoal bancário', 'Mais opções em bancos tradicionais', 'Aprovação pode ser mais seletiva', 'Perfis com score e renda mais estáveis']
      ],
      note:
        'A comparação acima é editorial e serve para organizar a pesquisa. As condições finais sempre dependem da análise de cada parceiro.'
    },
    faq: [
      {
        question: 'A SuperSim faz emprestimo para negativado?',
        answer:
          'A marca costuma aparecer na pesquisa de quem busca crédito mesmo com restrição, mas a aprovação depende da análise do parceiro e do perfil informado.'
      },
      {
        question: 'A simulação da SuperSim é online?',
        answer:
          'Sim. O fluxo é digital, o que ajuda quem quer entender valores, prazo e etapas antes de sair do portal.'
      },
      {
        question: 'Vale a pena pedir emprestimo na SuperSim?',
        answer:
          'Faz sentido para quem prioriza agilidade e quer comparar uma opção online sem garantia. Ainda assim, o ideal é analisar custo total, parcela e aderência ao seu momento.'
      },
      {
        question: 'A página da SuperSim no Cote Juros é publi?',
        answer:
          'Não. O conteúdo foi montado como recomendação editorial, com disclosure discreto e contexto de comparação para não parecer página comercial.'
      }
    ],
    linkGroups: [
      {
        title: 'Continue comparando',
        links: [
          { label: 'Empréstimo online', path: '/emprestimo-online' },
          { label: 'Empréstimo para negativado', path: '/emprestimo-para-negativado' },
          { label: 'Empréstimo para autônomo', path: '/emprestimo-para-autonomo' },
          { label: 'Empréstimos para MEI', path: '/emprestimos-para-mei' }
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
        title: 'Ver empréstimos online em contexto',
        description: 'Compare outras rotas do portal antes de sair para a simulação.',
        ctaLabel: 'Abrir comparador',
        to: '/emprestimo-online'
      },
      {
        label: 'Blog',
        title: 'Leia como evitar decisão no impulso',
        description: 'Artigos do blog ajudam a avaliar urgência, score e risco antes de contratar.',
        ctaLabel: 'Ler artigo',
        to: '/15-formas-de-conseguir-dinheiro-rapido-opcoes-e-riscos'
      }
    ],
    usageTitle: 'Como ler esta análise',
    usageTips: [
      'Use esta página para entender o encaixe da SuperSim, não para pular a comparação.',
      'Passe pelo bloco de comparação antes da simulação.',
      'Confira também os artigos relacionados sobre crédito rápido e negativado.'
    ]
  },
  {
    path: '/emprestimo-pessoal',
    heading: 'Empréstimo pessoal com comparação clara de taxas e condições.',
    title: 'Empréstimo pessoal: compare taxas antes de contratar | Cote Juros',
    description: 'Compare empréstimo pessoal por taxa mensal, valor liberado e prazo máximo.',
    productType: 'loan',
    offerFilter: { categoriesAny: ['Pessoal'], sortBy: 'monthlyRate' }
  },
  {
    path: '/emprestimo-consignado',
    heading: 'Empréstimo consignado com foco em menor custo total.',
    title: 'Empréstimo consignado: comparação de bancos e taxas | Cote Juros',
    description: 'Veja empréstimo consignado com leitura de taxa, prazo e valor disponível.',
    productType: 'loan',
    offerFilter: { categoriesAny: ['Consignado'], sortBy: 'monthlyRate' }
  },
  {
    path: '/emprestimo-para-negativado',
    heading: 'Empréstimo para negativado com análise de risco e segurança.',
    title: 'Empréstimo para negativado: compare opções reais | Cote Juros',
    description: 'Compare crédito para negativado e encontre linhas mais aderentes ao seu perfil.',
    productType: 'loan',
    offerFilter: { categoriesAny: ['Negativado', 'Consignado'], sortBy: 'monthlyRate' }
  },
  {
    path: '/emprestimo-online',
    heading: 'Empréstimo online com comparação instantânea de bancos.',
    title: 'Empréstimo online: tabela comparativa de taxas | Cote Juros',
    description: 'Analise ofertas de empréstimo online com taxas atualizadas e prazos.',
    productType: 'loan',
    offerFilter: { categoriesAny: ['Pessoal', 'Garantia', 'Consignado'], sortBy: 'monthlyRate' },
    primaryCta: { label: 'Simular empréstimo', action: 'affiliate' },
    secondaryCta: { label: 'Ver comparação completa', to: '/comparar/emprestimo-online' },
    heroFeature: {
      eyebrow: 'Oferta editorial em destaque',
      title: 'SuperSim',
      description:
        'Para quem quer pesquisar crédito online sem cair em página comercial, a SuperSim aparece aqui como recomendação editorial dentro de uma comparação mais ampla.'
    },
    heroBadges: ['Análise rápida', 'Para negativado', 'Sem garantia', 'Online'],
    editorialSections: [
      {
        heading: 'Como pesquisar empréstimo online com mais clareza',
        paragraphs: [
          'Empréstimo online facilita a jornada, mas a decisão não deve ser automática. O ideal é cruzar velocidade, custo total e adequação ao seu perfil antes do clique final.',
          'Nesta rota, a SuperSim entra como um CTA natural dentro da leitura editorial, sem competir com o comparador principal do portal.'
        ]
      },
      {
        heading: 'Onde a SuperSim faz sentido',
        paragraphs: [
          'A oferta ganha relevância quando a prioridade é um processo digital e uma experiência de simulação mais objetiva.',
          'Ainda assim, ela deve ser lida como parte da comparação. Em alguns perfis, outra modalidade pode gerar custo menor.'
        ],
        bullets: ['Boa aderência para quem quer rapidez.', 'Ajuda a seguir a jornada com menos fricção.', 'Precisa ser comparada com parcela e custo total.']
      },
      {
        heading: 'Como evitar uma decisao apressada',
        paragraphs: [
          'Mesmo quando a pesquisa é online, vale reservar alguns minutos para olhar prazo, valor final pago e encaixe da parcela no orçamento.',
          'Essa leitura simples já elimina boa parte dos erros mais comuns em crédito pessoal.'
        ]
      }
    ],
    faq: [
      {
        question: 'Empréstimo online é sempre mais rápido?',
        answer:
          'O fluxo costuma ser mais ágil, mas a velocidade real depende de análise, documentação e políticas de cada parceiro.'
      },
      {
        question: 'A SuperSim é a única opção para empréstimo online?',
        answer:
          'Não. Ela aparece aqui como uma recomendação editorial, mas a comparação com outras rotas do portal continua importante.'
      },
      {
        question: 'Como saber se a parcela vai caber?',
        answer:
          'Olhe o valor total pago, a quantidade de parcelas e o peso mensal no seu orçamento antes de seguir.'
      }
    ],
    linkGroups: [
      {
        title: 'Continue comparando',
        links: [
          { label: 'Comparar empréstimo online', path: '/comparar/emprestimo-online' },
          { label: 'Empréstimo para negativado', path: '/emprestimo-para-negativado' },
          { label: 'Página editorial da SuperSim', path: '/supersim-emprestimo' }
        ]
      }
    ],
    recommendationCards: [
      {
        label: 'Guia editorial',
        title: 'Entenda melhor a SuperSim antes do clique',
        description: 'Veja a análise completa com funcionamento, comparação e FAQ.',
        ctaLabel: 'Abrir guia',
        to: '/supersim-emprestimo'
      }
    ]
  },
  {
    path: '/emprestimo-online-rapido',
    heading: 'Empréstimo online rápido: como buscar velocidade sem perder clareza',
    title: 'Empréstimo online rápido: o que avaliar antes de contratar | Cote Juros',
    description:
      'Guia para quem busca empréstimo online rápido com contexto editorial, FAQ e integração natural da oferta SuperSim.',
    productType: 'loan',
    offerFilter: { categoriesAny: ['Pessoal', 'Negativado'], sortBy: 'monthlyRate' },
    primaryCta: { label: 'Simular empréstimo', action: 'affiliate' },
    secondaryCta: { label: 'Ver empréstimos', to: '/emprestimos' },
    heroBadges: ['Análise rápida', 'Para negativado', 'Sem garantia', 'Online'],
    editorialSections: [
      {
        heading: 'Velocidade só vale quando vem com contexto',
        paragraphs: [
          'Quem busca empréstimo online rápido normalmente quer reduzir atrito, não necessariamente contratar a primeira oferta que apareceu.',
          'Por isso a SuperSim entra nesta rota como uma recomendação editorial: ela aproxima a conversão sem quebrar a experiência do portal.'
        ]
      },
      {
        heading: 'Por que a SuperSim aparece aqui',
        paragraphs: [
          'A marca conversa com a intenção de busca por rapidez e processo digital. Isso cria um CTA natural depois da leitura, em vez de um bloco com cara de publicidade.',
          'A melhor prática continua sendo comparar custo, prazo e utilidade real do crédito.'
        ]
      }
    ],
    faq: [
      {
        question: 'Empréstimo online rápido significa dinheiro na hora?',
        answer:
          'Não necessariamente. A rapidez costuma estar na análise e no fluxo digital, mas prazo de liberação e aprovação dependem do parceiro.'
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
          { label: 'SuperSim Empréstimo', path: '/supersim-emprestimo' },
          { label: 'Empréstimo online', path: '/emprestimo-online' },
          { label: 'Bancos digitais para crédito rápido', path: '/bancos-digitais-para-credito-rapido' }
        ]
      }
    ]
  },
  {
    path: '/emprestimo-rapido',
    heading: 'Empréstimo rápido com leitura transparente de custo.',
    title: 'Empréstimo rápido: compare antes de contratar | Cote Juros',
    description: 'Compare empréstimo rápido com foco em custo, prazo e próximo passo.',
    productType: 'loan',
    offerFilter: { sortBy: 'monthlyRate' }
  },
  {
    path: '/emprestimo-sem-consulta',
    heading: 'Empréstimo sem consulta: compare riscos e condições reais.',
    title: 'Empréstimo sem consulta: simulação e comparação | Cote Juros',
    description: 'Avalie opções de crédito com critérios flexíveis e menor risco de abuso.',
    productType: 'loan',
    offerFilter: { categoriesAny: ['Negativado', 'Consignado'], sortBy: 'monthlyRate' }
  },
  {
    path: '/emprestimo-para-mei',
    heading: 'Empréstimo para MEI com visão de fluxo de caixa e taxa.',
    title: 'Empréstimo para MEI: compare linhas de crédito | Cote Juros',
    description: 'Compare empréstimos para MEI por custo, prazo e valor liberado.',
    productType: 'loan',
    offerFilter: { categoriesAny: ['Pessoal', 'Garantia'], sortBy: 'monthlyRate' }
  },
  {
    path: '/emprestimo-para-autonomo',
    heading: 'Empréstimo para autônomo com comparação mais clara.',
    title: 'Empréstimo para autônomo: comparação de taxas | Cote Juros',
    description: 'Encontre crédito para autônomo com mais previsibilidade de parcela.',
    productType: 'loan',
    offerFilter: { categoriesAny: ['Pessoal', 'Garantia'], sortBy: 'monthlyRate' },
    primaryCta: { label: 'Simular empréstimo', action: 'affiliate' },
    secondaryCta: { label: 'Ver empréstimo online', to: '/emprestimo-online' },
    heroBadges: ['Análise rápida', 'Para negativado', 'Sem garantia', 'Online'],
    editorialSections: [
      {
        heading: 'O que pesa para o autônomo ao pedir crédito',
        paragraphs: [
          'Autônomos costumam buscar flexibilidade, rapidez e menos burocracia. Isso torna a SuperSim uma recomendação editorial coerente dentro desta rota.',
          'Ao mesmo tempo, vale comparar com outras linhas do portal para não decidir apenas pela facilidade do fluxo.'
        ]
      },
      {
        heading: 'Quando a SuperSim pode ajudar',
        paragraphs: [
          'Ela conversa bem com quem quer uma experiência online e leitura simples antes da simulação.',
          'O cuidado continua sendo o mesmo: confirmar se a parcela encaixa em uma renda que pode oscilar.'
        ]
      }
    ],
    faq: [
      {
        question: 'Autônomo pode pedir empréstimo online?',
        answer:
          'Sim. A aprovação depende da leitura de renda, histórico e perfil, mas existem jornadas digitais voltadas a esse público.'
      },
      {
        question: 'A SuperSim faz sentido para autônomo?',
        answer:
          'Pode fazer, especialmente quando o objetivo é manter um fluxo simples e online. Ainda assim, o ideal é comparar antes de seguir.'
      }
    ]
  },
  {
    path: '/emprestimo-para-negativado-online',
    heading: 'Empréstimo para negativado online: como comparar com mais segurança',
    title: 'Empréstimo para negativado online: guia para pesquisar melhor | Cote Juros',
    description:
      'Entenda como avaliar empréstimo para negativado online sem cair em promessa fácil e com inserção editorial da SuperSim.',
    productType: 'loan',
    offerFilter: { categoriesAny: ['Negativado', 'Pessoal'], sortBy: 'monthlyRate' },
    primaryCta: { label: 'Simular empréstimo', action: 'affiliate' },
    secondaryCta: { label: 'Ler guia de negativado', to: '/emprestimo-para-negativado' },
    heroBadges: ['Análise rápida', 'Para negativado', 'Sem garantia', 'Online'],
    editorialSections: [
      {
        heading: 'Crédito para negativado pede mais filtro',
        paragraphs: [
          'Quem está negativado costuma pesquisar com urgência e menos margem para erro. Nessa hora, o portal precisa aproximar a conversão sem parecer página comercial.',
          'A SuperSim entra como sugestão editorial alinhada a essa busca, mas o texto continua reforçando comparação e cautela.'
        ]
      },
      {
        heading: 'Quando a oferta faz sentido',
        paragraphs: [
          'Ela tende a chamar atenção de quem quer uma jornada online sem garantia e com resposta mais rápida.',
          'Ainda assim, o ponto central é analisar custo total, limite aprovado e impacto da parcela.'
        ]
      }
    ],
    faq: [
      {
        question: 'Todo negativado consegue empréstimo online?',
        answer:
          'Não. Existem opções mais acessíveis, mas a aprovação depende de análise e do risco identificado pelo parceiro.'
      },
      {
        question: 'A SuperSim garante aprovação?',
        answer:
          'Não. Ela aparece como alternativa editorial relevante, mas qualquer aprovação depende do parceiro.'
      }
    ]
  },
  {
    path: '/emprestimo-urgente-hoje',
    heading: 'Empréstimo urgente hoje: como agir com rapidez sem decidir no impulso',
    title: 'Empréstimo urgente hoje: orientação para quem precisa de dinheiro rápido | Cote Juros',
    description:
      'Conteúdo útil para quem pesquisa empréstimo urgente hoje, com FAQ, links internos e recomendação editorial da SuperSim.',
    productType: 'loan',
    offerFilter: { categoriesAny: ['Pessoal', 'Negativado'], sortBy: 'monthlyRate' },
    primaryCta: { label: 'Simular empréstimo', action: 'affiliate' },
    secondaryCta: { label: 'Ver formas de conseguir dinheiro rápido', to: '/15-formas-de-conseguir-dinheiro-rapido-opcoes-e-riscos' },
    heroBadges: ['Análise rápida', 'Para negativado', 'Sem garantia', 'Online'],
    editorialSections: [
      {
        heading: 'Urgência não precisa virar impulso',
        paragraphs: [
          'Quando a busca é por empréstimo urgente hoje, o risco de cair em promessa fácil aumenta. O papel desta página é reduzir esse risco sem esfriar a jornada.',
          'A SuperSim aparece como um CTA editorial natural para quem quer manter rapidez, mas ainda dentro de um ambiente de comparação.'
        ]
      },
      {
        heading: 'O que checar antes de seguir',
        paragraphs: [
          'Mesmo em cenários urgentes, vale olhar custo total, prazo e se existe outra rota menos cara no portal.',
          'Alguns minutos de leitura podem evitar uma decisão que pesa por meses.'
        ],
        bullets: ['Não pague taxa antecipada.', 'Compare com outra página do portal.', 'Não contrate valor acima do necessário.']
      }
    ],
    faq: [
      {
        question: 'Empréstimo urgente hoje é seguro?',
        answer:
          'Pode ser, desde que você use canais confiáveis, não pague taxa antecipada e compare o custo antes de contratar.'
      },
      {
        question: 'A SuperSim ajuda quem precisa de resposta rápida?',
        answer:
          'Ela se encaixa nessa intenção de busca, mas continua sendo importante revisar as condições antes da simulação.'
      }
    ]
  },
  {
    path: '/emprestimo-rapido-pix',
    heading: 'Empréstimo rápido Pix: quando a promessa de velocidade faz sentido',
    title: 'Empréstimo rápido Pix: como comparar ofertas com mais contexto | Cote Juros',
    description:
      'Veja como pesquisar empréstimo rápido Pix sem cair em promessas exageradas e com inserção natural da SuperSim.',
    productType: 'loan',
    offerFilter: { categoriesAny: ['Pessoal', 'Negativado'], sortBy: 'monthlyRate' },
    primaryCta: { label: 'Simular empréstimo', action: 'affiliate' },
    secondaryCta: { label: 'Ler sobre crédito rápido', to: '/bancos-digitais-para-credito-rapido' },
    heroBadges: ['Análise rápida', 'Para negativado', 'Sem garantia', 'Online'],
    editorialSections: [
      {
        heading: 'O que a busca por Pix rápido realmente significa',
        paragraphs: [
          'Na prática, essa busca costuma apontar para usuários que querem agilidade na liberação e menos fricção na jornada.',
          'A SuperSim aparece aqui como CTA editorial porque conversa com essa expectativa sem transformar a página em anúncio.'
        ]
      },
      {
        heading: 'Velocidade precisa vir com comparação',
        paragraphs: [
          'Mesmo quando a promessa é de fluxo rápido, a aprovação final continua dependendo de análise.',
          'A página foi montada para manter a conversão natural e, ao mesmo tempo, reforçar leitura de custo e encaixe.'
        ]
      }
    ],
    faq: [
      {
        question: 'Empréstimo rápido Pix cai na hora?',
        answer:
          'Nem sempre. Mesmo em fluxos digitais, a liberação depende da análise, das políticas do parceiro e da confirmação do cadastro.'
      },
      {
        question: 'A SuperSim combina com essa busca?',
        answer:
          'Sim, porque ela se alinha a quem procura rapidez e experiência digital, mas ainda precisa ser lida dentro de uma comparação.'
      }
    ]
  }
];
const cardCluster = [
  {
    path: '/melhores-cartoes-de-credito',
    heading: 'Melhores cartões de crédito com comparação por perfil.',
    title: 'Melhores cartões de crédito: compare limite e benefícios | Cote Juros',
    description: 'Analise cartões por anuidade, limite e benefícios em uma tabela comparativa.',
    productType: 'credit_card',
    offerFilter: { sortBy: 'maxLimit' }
  },
  {
    path: '/cartao-sem-anuidade',
    heading: 'Cartão sem anuidade com foco em custo zero e praticidade.',
    title: 'Cartão sem anuidade: melhores opções para comparar | Cote Juros',
    description: 'Compare cartões sem anuidade por limite, benefícios e banco emissor.',
    productType: 'credit_card',
    offerFilter: { annualFeeZero: true, sortBy: 'maxLimit' }
  },
  {
    path: '/cartao-com-cashback',
    heading: 'Cartão com cashback para gerar retorno em compras.',
    title: 'Cartão com cashback: comparativo atualizado | Cote Juros',
    description: 'Compare cartões com cashback por retorno, limite e anuidade.',
    productType: 'credit_card',
    offerFilter: { benefitsAny: ['cashback'], sortBy: 'maxLimit' }
  },
  {
    path: '/cartao-com-milhas',
    heading: 'Cartão com milhas para acumular pontos de viagem.',
    title: 'Cartão com milhas: compare pontuação e custo | Cote Juros',
    description: 'Veja cartões com milhas e escolha pela melhor relação custo-benefício.',
    productType: 'credit_card',
    offerFilter: { benefitsAny: ['milhas', 'pontos'], sortBy: 'maxLimit' }
  },
  {
    path: '/cartao-para-negativado',
    heading: 'Cartão para negativado com critérios de entrada mais acessíveis.',
    title: 'Cartão para negativado: compare opções e vantagens | Cote Juros',
    description: 'Compare cartões para negativado com foco em custo, critérios e próximo passo.',
    productType: 'credit_card',
    offerFilter: { annualFeeZero: true, sortBy: 'annualFee' }
  },
  {
    path: '/cartao-para-mei',
    heading: 'Cartão para MEI com benefícios para rotina empresarial.',
    title: 'Cartão para MEI: compare limite e benefícios empresariais | Cote Juros',
    description: 'Encontre cartão para MEI com análise de limite, anuidade e vantagens.',
    productType: 'credit_card',
    offerFilter: { sortBy: 'maxLimit' }
  },
  {
    path: '/cartao-para-score-baixo',
    heading: 'Cartão para score baixo com comparação de risco e custo.',
    title: 'Cartão para score baixo: opções para iniciar crédito | Cote Juros',
    description: 'Compare cartões para score baixo e monte estratégia de evolução de limite.',
    productType: 'credit_card',
    offerFilter: { annualFeeZero: true, sortBy: 'annualFee' }
  },
  {
    path: '/cartao-com-limite-alto',
    heading: 'Cartão com limite alto para perfis com maior capacidade de renda.',
    title: 'Cartão com limite alto: compare bancos e benefícios | Cote Juros',
    description: 'Veja cartões com limite alto e compare anuidade, pontos e benefícios.',
    productType: 'credit_card',
    offerFilter: { minLimit: 10000, sortBy: 'maxLimit' }
  }
];

const financingCluster = [
  {
    path: '/financiamento-veiculo',
    heading: 'Financiamento de veículo com comparação por taxa e entrada.',
    title: 'Financiamento de veículo: compare bancos e parcelas | Cote Juros',
    description: 'Compare financiamento de carro e moto por taxa anual e prazo total.',
    productType: 'financing',
    offerFilter: { categoriesAny: ['Carro', 'Moto'], sortBy: 'annualRate' }
  },
  {
    path: '/financiamento-imovel',
    heading: 'Financiamento de imóvel com leitura de custo total.',
    title: 'Financiamento de imóvel: compare taxas e condições | Cote Juros',
    description: 'Analise financiamento imobiliário com prazo, entrada e taxa anual.',
    productType: 'financing',
    offerFilter: { categoriesAny: ['Imobiliário', 'Refinanciamento'], sortBy: 'annualRate' }
  },
  {
    path: '/financiamento-sem-entrada',
    heading: 'Financiamento sem entrada para cenários de menor capital inicial.',
    title: 'Financiamento sem entrada: compare condições reais | Cote Juros',
    description: 'Veja opções com entrada reduzida e compare impacto no custo final.',
    productType: 'financing',
    offerFilter: { maxDownPayment: 10, sortBy: 'annualRate' }
  },
  {
    path: '/financiamento-para-negativado',
    heading: 'Financiamento para negativado com análise de alternativas.',
    title: 'Financiamento para negativado: comparação segura | Cote Juros',
    description: 'Compare linhas de financiamento para negativado e reduza risco de contrato ruim.',
    productType: 'financing',
    offerFilter: { categoriesAny: ['Refinanciamento', 'Carro'], sortBy: 'annualRate' }
  },
  {
    path: '/financiamento-carro-usado',
    heading: 'Financiamento de carro usado com comparação de taxas.',
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
    title: 'Comparar crédito, cartões e financiamento | Cote Juros',
    description: 'Acesse comparadores de crédito, cartões e financiamento para entender custos, benefícios e condições antes de contratar.',
    pageType: 'hub'
  },
  {
    path: '/bancos',
    heading: 'Bancos comparados em um único ecossistema de decisão.',
    title: 'Bancos para comparar taxas, cartões e empréstimos | Cote Juros',
    description: 'Explore bancos com visão de cartões, empréstimos, financiamento e condições.',
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


