import { banksData } from '@/data/banksData.js';
import { loansData } from '@/data/loansData.js';
import { creditCardsData } from '@/data/creditCardsData.js';
import { financingData } from '@/data/financingData.js';
import { articlesData } from '@/data/articlesData.js';

const normalizeLegacyText = (value = '') => String(value);

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
    title: 'Empréstimo para Negativado: Compare e Consiga Crédito - Cote Juros',
    description: 'Conseguir empréstimo com nome sujo é possível. Compare opções com garantia ou consignado e encontre as menores taxas.',
    heading: 'Empréstimo para Negativado Seguro e Online',
    content: [
      'Estar negativado não significa que você não pode ter acesso a crédito. Muitas instituições financeiras oferecem linhas específicas para quem está com restrições no CPF.',
      'As modalidades mais comuns para negativados são o empréstimo consignado e o empréstimo com garantia de veículo ou imóvel.',
      'Antes de fechar negócio, tome cuidado com fraudes: nenhuma instituição financeira séria cobra valores antecipados para liberar crédito.'
    ],
    type: 'loans'
  },
  {
    id: 'seo-cartao-sem-anuidade',
    path: '/cartao-sem-anuidade',
    title: 'Melhores Cartões de Crédito Sem Anuidade - Cote Juros',
    description: 'Não pague taxas! Compare e solicite os melhores cartões de crédito sem anuidade com limite alto e aprovação na hora.',
    heading: 'Cartões Sem Anuidade para o seu Perfil',
    content: [
      'Com a ascensão dos bancos digitais, diversas instituições oferecem cartões totalmente isentos de tarifas e com benefícios relevantes.',
      'Além da economia anual, muitos desses cartões oferecem programas de cashback, descontos em parceiros e controle total via aplicativo.',
      'Para escolher o melhor, avalie quais benefícios fazem sentido para sua rotina e compare o custo efetivo de cada opção.'
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
    quote: 'Encontrei um cartão sem anuidade com ótimo limite e cashback. Antes eu pagava taxas abusivas sem saber das opções.',
    result: '+R$ 230/mês cashback',
    badge: 'Oferta aprovada'
  },
  {
    id: 't-carlos',
    name: 'Carlos Oliveira',
    location: 'Belo Horizonte, MG',
    product: 'Empréstimo Pessoal',
    avatar: 'https://ui-avatars.com/api/?name=Carlos+Oliveira&background=14B8A6&color=fff',
    quote: 'Estava negativado e achei que não conseguiria crédito. A plataforma me mostrou opções reais que couberam no meu bolso.',
    result: 'Aprovação em 48h',
    badge: 'Caso concluído'
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

