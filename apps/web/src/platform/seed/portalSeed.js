import { banksData } from '@/data/banksData.js';
import { loansData } from '@/data/loansData.js';
import { creditCardsData } from '@/data/creditCardsData.js';
import { financingData } from '@/data/financingData.js';
import { articlesData } from '@/data/articlesData.js';

const normalizeLegacyText = (value = '') =>
  value
    .replaceAll('Ã©', 'é')
    .replaceAll('Ã£', 'ã')
    .replaceAll('Ã¡', 'á')
    .replaceAll('Ãª', 'ê')
    .replaceAll('Ã³', 'ó')
    .replaceAll('Ã§', 'ç')
    .replaceAll('Ã­', 'í')
    .replaceAll('Ãº', 'ú')
    .replaceAll('Ã´', 'ô');

export const categories = [
  { id: 'cat-loans', code: 'loans', label: 'Emprestimos', kind: 'product' },
  { id: 'cat-cards', code: 'cards', label: 'Cartoes de Credito', kind: 'product' },
  { id: 'cat-financing', code: 'financing', label: 'Financiamento', kind: 'product' },
  { id: 'cat-content-credit-score', code: 'score', label: 'Score de Credito', kind: 'content' },
  { id: 'cat-content-personal-finance', code: 'personal-finance', label: 'Financas Pessoais', kind: 'content' },
  { id: 'cat-seo-loans', code: 'seo-loans', label: 'SEO Emprestimos', kind: 'seo' },
  { id: 'cat-seo-cards', code: 'seo-cards', label: 'SEO Cartoes', kind: 'seo' }
];

export const banks = banksData.map((bank) => ({
  id: bank.id,
  name: normalizeLegacyText(bank.name),
  slug: bank.name.toLowerCase().replace(/\s+/g, '-'),
  logoUrl: bank.logo,
  color: bank.color,
  website: bank.website,
  phone: bank.phone,
  established: bank.established,
  metadata: { source: 'legacy-seed' }
}));

export const products = [
  { id: 'prod-loan-personal', name: 'Emprestimo Pessoal', type: 'loan', categoryId: 'cat-loans', description: 'Credito pessoal para diversos perfis.' },
  { id: 'prod-loan-consigned', name: 'Emprestimo Consignado', type: 'loan', categoryId: 'cat-loans', description: 'Credito com desconto em folha.' },
  { id: 'prod-loan-collateral', name: 'Emprestimo com Garantia', type: 'loan', categoryId: 'cat-loans', description: 'Credito com garantia de bem.' },
  { id: 'prod-credit-card', name: 'Cartao de Credito', type: 'credit_card', categoryId: 'cat-cards', description: 'Comparacao de cartoes por perfil e beneficios.' },
  { id: 'prod-financing-auto', name: 'Financiamento de Veiculo', type: 'financing', categoryId: 'cat-financing', description: 'Financiamento de carros e motos.' },
  { id: 'prod-financing-real-estate', name: 'Financiamento Imobiliario', type: 'financing', categoryId: 'cat-financing', description: 'Financiamento de imoveis e refinanciamento.' }
];

const resolveLoanProductId = (type) => {
  if (type === 'Consignado') return 'prod-loan-consigned';
  if (type === 'Garantia') return 'prod-loan-collateral';
  return 'prod-loan-personal';
};

const resolveFinancingProductId = (type) => {
  if (type === 'Imobiliario' || type === 'Refinanciamento') return 'prod-financing-real-estate';
  return 'prod-financing-auto';
};

export const offers = [
  ...loansData.map((loan) => ({
    id: `offer-${loan.id}`,
    bankId: loan.bankId,
    bankName: normalizeLegacyText(loan.bankName),
    productId: resolveLoanProductId(loan.type),
    productType: 'loan',
    category: normalizeLegacyText(loan.type),
    title: `${normalizeLegacyText(loan.type)} ${normalizeLegacyText(loan.bankName)}`,
    monthlyRate: loan.monthlyRate,
    annualRate: loan.annualRate,
    minValue: loan.minValue,
    maxValue: loan.maxValue,
    minTerm: loan.minTerm,
    maxTerm: loan.maxTerm,
    minIncome: loan.minIncome,
    minScore: normalizeLegacyText(loan.minScore),
    requirements: loan.requirements?.map((item) => normalizeLegacyText(item)),
    metadata: { originId: loan.id }
  })),
  ...creditCardsData.map((card) => ({
    id: `offer-${card.id}`,
    bankId: card.bankId,
    bankName: normalizeLegacyText(card.bankName),
    productId: 'prod-credit-card',
    productType: 'credit_card',
    category: normalizeLegacyText(card.category),
    title: normalizeLegacyText(card.name),
    annualFee: card.annualFee,
    minLimit: card.minLimit,
    maxLimit: card.maxLimit,
    benefits: card.benefits?.map((item) => normalizeLegacyText(item)),
    image: card.image,
    metadata: { originId: card.id }
  })),
  ...financingData.map((financing) => ({
    id: `offer-${financing.id}`,
    bankId: financing.bankId,
    bankName: normalizeLegacyText(financing.bankName),
    productId: resolveFinancingProductId(financing.type),
    productType: 'financing',
    category: normalizeLegacyText(financing.type),
    title: `${normalizeLegacyText(financing.type)} ${normalizeLegacyText(financing.bankName)}`,
    monthlyRate: financing.monthlyRate,
    annualRate: financing.annualRate,
    minDownPayment: financing.minDownPayment,
    maxDownPayment: financing.maxDownPayment,
    minTerm: financing.minTerm,
    maxTerm: financing.maxTerm,
    minValue: financing.minValue,
    maxValue: financing.maxValue,
    metadata: { originId: financing.id }
  }))
];

export const articles = articlesData.map((article) => ({
  ...article,
  title: normalizeLegacyText(article.title),
  summary: normalizeLegacyText(article.summary),
  content: normalizeLegacyText(article.content),
  category: normalizeLegacyText(article.category),
  status: 'published'
}));

export const seoPages = [
  {
    id: 'seo-emprestimo-negativado',
    path: '/emprestimo-para-negativado',
    title: 'Emprestimo para Negativado: Compare e Consiga Credito - Cote Juros',
    description: 'Conseguir emprestimo com nome sujo e possivel. Compare opcoes com garantia ou consignado e encontre as menores taxas.',
    heading: 'Emprestimo para Negativado Seguro e Online',
    content: [
      'Estar negativado nao significa que voce nao pode ter acesso a credito. Muitas instituicoes financeiras oferecem linhas especificas para quem esta com restricoes no CPF.',
      'As modalidades mais comuns para negativados sao o emprestimo consignado e o emprestimo com garantia de veiculo ou imovel.',
      'Antes de fechar negocio, tome cuidado com fraudes: nenhuma instituicao financeira seria cobra valores antecipados para liberar credito.'
    ],
    type: 'loans'
  },
  {
    id: 'seo-cartao-sem-anuidade',
    path: '/cartao-sem-anuidade',
    title: 'Melhores Cartoes de Credito Sem Anuidade - Cote Juros',
    description: 'Nao pague taxas! Compare e solicite os melhores cartoes de credito sem anuidade com limite alto e aprovacao na hora.',
    heading: 'Cartoes Sem Anuidade para o seu Perfil',
    content: [
      'Com a ascensao dos bancos digitais, diversas instituicoes oferecem cartoes totalmente isentos de tarifas e com beneficios relevantes.',
      'Alem da economia anual, muitos desses cartoes oferecem programas de cashback, descontos em parceiros e controle total via aplicativo.',
      'Para escolher o melhor, avalie quais beneficios fazem sentido para sua rotina e compare o custo efetivo de cada opcao.'
    ],
    type: 'cards'
  }
];

export const seoFallbackPaths = [
  '/emprestimo-online',
  '/emprestimo-rapido',
  '/cartao-com-milhas',
  '/como-aumentar-score',
  '/melhores-emprestimos',
  '/melhores-cartoes'
];

export const testimonials = [
  {
    id: 't-joao',
    name: 'Joao Silva',
    location: 'Sao Paulo, SP',
    product: 'Financiamento',
    avatar: 'https://ui-avatars.com/api/?name=Joao+Silva&background=0F62FE&color=fff',
    quote: 'Economizei mais de R$ 500 por mes no meu financiamento comparando as taxas aqui. O processo foi rapido e transparente.',
    result: '-R$ 527/mes',
    badge: 'Perfil verificado'
  },
  {
    id: 't-maria',
    name: 'Maria Santos',
    location: 'Rio de Janeiro, RJ',
    product: 'Cartao de Credito',
    avatar: 'https://ui-avatars.com/api/?name=Maria+Santos&background=7C3AED&color=fff',
    quote: 'Encontrei um cartao sem anuidade com otimo limite e cashback. Antes eu pagava taxas abusivas sem saber das opcoes.',
    result: '+R$ 230/mes cashback',
    badge: 'Oferta aprovada'
  },
  {
    id: 't-carlos',
    name: 'Carlos Oliveira',
    location: 'Belo Horizonte, MG',
    product: 'Emprestimo Pessoal',
    avatar: 'https://ui-avatars.com/api/?name=Carlos+Oliveira&background=14B8A6&color=fff',
    quote: 'Estava negativado e achei que nao conseguiria credito. A plataforma me mostrou opcoes reais que couberam no meu bolso.',
    result: 'Aprovacao em 48h',
    badge: 'Caso concluido'
  }
];

export const appIntegrationSources = [
  { id: 'src-home-hero', sourcePage: '/', ctaId: 'hero_simular', productType: 'loan' },
  { id: 'src-home-ai', sourcePage: '/', ctaId: 'home_ai_analisar', productType: 'loan' },
  { id: 'src-diagnostico', sourcePage: '/diagnostico-financeiro', ctaId: 'diagnostico_ai', productType: 'loan' },
  { id: 'src-loans', sourcePage: '/emprestimos', ctaId: 'offer_simulate', productType: 'loan' },
  { id: 'src-cards', sourcePage: '/cartoes-de-credito', ctaId: 'offer_apply', productType: 'credit_card' },
  { id: 'src-financing', sourcePage: '/financiamento', ctaId: 'offer_financing_simulate', productType: 'financing' }
];

