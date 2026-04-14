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
    description: 'Veja cartões sem anuidade com análise de limite, benefícios e perfil de aprovação.',
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
    description: 'Veja linhas de crédito para negativado, com foco em custo total e chance de aprovação.',
    productType: 'loan',
    offerFilter: { categoriesAny: ['Negativado', 'Consignado'], sortBy: 'monthlyRate' }
  },
  {
    slug: 'emprestimo-online',
    heading: 'Compare empréstimo online antes de contratar crédito.',
    title: 'Comparar empréstimo online: taxas atualizadas e prazos | Cote Juros',
    description: 'Compare empréstimos online em um painel com taxas, prazos e valores máximos.',
    productType: 'loan',
    offerFilter: { categoriesAny: ['Pessoal', 'Garantia', 'Consignado'], sortBy: 'monthlyRate' }
  },
  {
    slug: 'financiamento-veiculo',
    heading: 'Compare financiamento de veículo por taxa, entrada e prazo.',
    title: 'Comparar financiamento de veículo: bancos e taxas | Cote Juros',
    description: 'Avalie financiamento de carro por custo total, entrada mínima e prazo máximo.',
    productType: 'financing',
    offerFilter: { categoriesAny: ['Carro', 'Moto'], sortBy: 'annualRate' }
  }
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
    description: 'Compare cenários de financiamento e reduza risco de juros abusivos.',
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
    description: 'Calcule e compare CET para tomar decisões financeiras mais inteligentes.',
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
      'Concentrar gastos no cartão principal, manter baixa inadimplência e atualizar renda no app são ações que aumentam chance de aprovação para limite maior.',
      'Evite usar o limite total todos os meses. O ideal é manter uso equilibrado e histórico positivo, mostrando capacidade de pagamento sustentável.'
    ]
  },
  {
    path: '/blog/emprestimo-para-negativado-funciona',
    heading: 'Empréstimo para negativado funciona? Entenda quando vale a pena.',
    title: 'Empréstimo para negativado funciona? Guia honesto | Cote Juros',
    description: 'Veja quais modalidades existem para negativado e como evitar custos abusivos.',
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
    description: 'Descubra quais critérios pesam na aprovação e como melhorar seu perfil.',
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
    offerFilter: { categoriesAny: ['Pessoal', 'Garantia', 'Consignado'], sortBy: 'monthlyRate' }
  },
  {
    path: '/emprestimo-rapido',
    heading: 'Empréstimo rápido com leitura transparente de custo.',
    title: 'Empréstimo rápido: compare antes de contratar | Cote Juros',
    description: 'Encontre empréstimo rápido com foco em aprovação e controle de juros.',
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
    heading: 'Empréstimo para autônomo com análise de aprovação.',
    title: 'Empréstimo para autônomo: comparação de taxas | Cote Juros',
    description: 'Encontre crédito para autônomo com mais previsibilidade de parcela.',
    productType: 'loan',
    offerFilter: { categoriesAny: ['Pessoal', 'Garantia'], sortBy: 'monthlyRate' }
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
    description: 'Compare cartões para negativado com foco em aprovação e custo.',
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

export const seoStaticPages = [
  ...loanCluster,
  ...cardCluster,
  ...financingCluster,
  ...toolPageDefinitions.map((tool) => ({ ...tool, pageType: 'tool' })),
  ...blogEditorialDefinitions.map((article) => ({ ...article, pageType: 'blog-article' })),
  ...hubPages
].map((item) => ({
  badge: item.badge || 'Comparador financeiro',
  pageType: item.pageType || 'product',
  ...item
}));

export const reservedSeoStaticPaths = seoStaticPages.map((page) => page.path);

const quickLinkPresets = {
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
};

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
  return seoStaticPages.find((page) => page.path === path) || null;
}

export function getComparePage(slug) {
  return comparePageDefinitions.find((page) => page.slug === slug) || null;
}

export function getBankRoute(slug) {
  return requiredBankRoutes.find((route) => route.slug === slug) || null;
}

export function getBlogEditorialPage(path) {
  return blogEditorialDefinitions.find((article) => article.path === path) || null;
}
