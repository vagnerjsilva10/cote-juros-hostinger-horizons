import { banksData } from '@/data/banksData.js';
import { loansData } from '@/data/loansData.js';
import { creditCardsData } from '@/data/creditCardsData.js';
import { financingData } from '@/data/financingData.js';
import { articlesData } from '@/data/articlesData.js';
import { normalizeMojibake } from '@/lib/textEncoding.js';

const normalizeLegacyText = (value = '') => normalizeMojibake(String(value));

export const categories = [
  { id: 'cat-loans', code: 'loans', label: 'Empréstimos', kind: 'product' },
  { id: 'cat-cards', code: 'cards', label: 'Cartões de Crédito', kind: 'product' },
  { id: 'cat-financing', code: 'financing', label: 'Financiamento', kind: 'product' },
  { id: 'cat-content-credit-score', code: 'score', label: 'Score de Crédito', kind: 'content' },
  { id: 'cat-content-personal-finance', code: 'personal-finance', label: 'Finanças Pessoais', kind: 'content' },
  { id: 'cat-seo-loans', code: 'seo-loans', label: 'SEO Empréstimos', kind: 'seo' },
  { id: 'cat-seo-cards', code: 'seo-cards', label: 'SEO Cartões', kind: 'seo' }
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
  { id: 'prod-loan-personal', name: 'Empréstimo Pessoal', type: 'loan', categoryId: 'cat-loans', description: 'Crédito pessoal para diversos perfis.' },
  { id: 'prod-loan-consigned', name: 'Empréstimo Consignado', type: 'loan', categoryId: 'cat-loans', description: 'Crédito com desconto em folha.' },
  { id: 'prod-loan-collateral', name: 'Empréstimo com Garantia', type: 'loan', categoryId: 'cat-loans', description: 'Crédito com garantia de bem.' },
  { id: 'prod-credit-card', name: 'Cartão de Crédito', type: 'credit_card', categoryId: 'cat-cards', description: 'Comparação de cartões por perfil e benefícios.' },
  { id: 'prod-financing-auto', name: 'Financiamento de Veículo', type: 'financing', categoryId: 'cat-financing', description: 'Financiamento de carros e motos.' },
  { id: 'prod-financing-real-estate', name: 'Financiamento Imobiliário', type: 'financing', categoryId: 'cat-financing', description: 'Financiamento de imóveis e refinanciamento.' }
];

const resolveLoanProductId = (type) => {
  if (type === 'Consignado') return 'prod-loan-consigned';
  if (type === 'Garantia') return 'prod-loan-collateral';
  return 'prod-loan-personal';
};

const resolveFinancingProductId = (type) => {
  if (type === 'Imobiliário' || type === 'Refinanciamento') return 'prod-financing-real-estate';
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
    title: 'Emprestimo para Negativado: Compare Caminhos Possiveis - Cote Juros',
    description: 'Veja caminhos de credito que podem fazer sentido para quem esta negativado, com cuidado sobre custo, prazo e proximo passo.',
    heading: 'Emprestimo para negativado com mais clareza',
    content: [
      'Estar negativado nao fecha todas as portas, mas exige mais cuidado antes de pedir credito.',
      'Algumas modalidades podem fazer sentido dependendo de renda, garantia, margem e regras do parceiro.',
      'Antes de seguir, compare custo total e desconfie de qualquer cobranca antecipada para liberar credito.'
    ],
    type: 'loans'
  },
  {
    id: 'seo-cartao-sem-anuidade',
    path: '/cartao-sem-anuidade',
    title: 'Cartoes de Credito Sem Anuidade para Comparar - Cote Juros',
    description: 'Compare cartoes sem anuidade com foco em custo, beneficios e criterios antes de solicitar.',
    heading: 'Cartoes sem anuidade para comparar com calma',
    content: [
      'Muitos bancos digitais oferecem cartoes sem anuidade, mas os beneficios e criterios variam bastante.',
      'Antes de pedir, vale comparar limite, custo, beneficios e como o cartao entra no seu dia a dia.',
      'A aprovacao e o limite final dependem da analise do emissor.'
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
    name: 'João Silva',
    location: 'São Paulo, SP',
    product: 'Financiamento',
    avatar: 'https://ui-avatars.com/api/?name=João+Silva&background=0F62FE&color=fff',
    quote: 'Economizei mais de R$ 500 por mês no meu financiamento comparando as taxas aqui. O processo foi rápido e transparente.',
    result: '-R$ 527/mês',
    badge: 'Perfil verificado'
  },
  {
    id: 't-maria',
    name: 'Maria Santos',
    location: 'Rio de Janeiro, RJ',
    product: 'Cartão de Crédito',
    avatar: 'https://ui-avatars.com/api/?name=Maria+Santos&background=7C3AED&color=fff',
    quote: 'Consegui comparar cartoes sem anuidade e entender melhor quais beneficios faziam sentido para minha rotina.',
    result: 'Comparacao mais clara',
    badge: 'Perfil comparado'
  },
  {
    id: 't-carlos',
    name: 'Carlos Oliveira',
    location: 'Belo Horizonte, MG',
    product: 'Empréstimo Pessoal',
    avatar: 'https://ui-avatars.com/api/?name=Carlos+Oliveira&background=14B8A6&color=fff',
    quote: 'Estava negativado e consegui entender quais caminhos ainda valiam uma comparacao com cuidado.',
    result: 'Caminhos avaliados',
    badge: 'Jornada orientada'
  }
];

export const appIntegrationSources = [
  { id: 'src-home-hero', sourcePage: '/', ctaId: 'hero_simular', productType: 'loan' },
  { id: 'src-home-ai', sourcePage: '/', ctaId: 'home_ai_analisar', productType: 'loan' },
  { id: 'src-finance-context', sourcePage: '/diagnostico-financeiro', ctaId: 'finance_organization', productType: 'loan' },
  { id: 'src-loans', sourcePage: '/emprestimos', ctaId: 'offer_simulate', productType: 'loan' },
  { id: 'src-cards', sourcePage: '/cartoes-de-credito', ctaId: 'offer_apply', productType: 'credit_card' },
  { id: 'src-financing', sourcePage: '/financiamento', ctaId: 'offer_financing_simulate', productType: 'financing' }
];