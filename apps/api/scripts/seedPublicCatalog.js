import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { banksData } from '../../web/src/data/banksData.js';
import { loansData } from '../../web/src/data/loansData.js';
import { creditCardsData } from '../../web/src/data/creditCardsData.js';
import { financingData } from '../../web/src/data/financingData.js';
import { articlesData } from '../../web/src/data/articlesData.js';
import { normalizeMojibake } from '../../web/src/lib/textEncoding.js';

const prisma = new PrismaClient();

const clean = (value = '') => normalizeMojibake(String(value || '').trim());
const nullableClean = (value) => (value == null || value === '' ? null : clean(value));
const numberOrNull = (value) => (value == null || value === '' ? null : Number(value));
const slugify = (value = '') =>
  clean(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'item';

const productCategories = [
  { slug: 'product-emprestimo-pessoal', name: 'Pessoal', type: 'product' },
  { slug: 'product-emprestimo-consignado', name: 'Consignado', type: 'product' },
  { slug: 'product-emprestimo-com-garantia', name: 'Garantia', type: 'product' },
  { slug: 'product-emprestimo-negativado', name: 'Negativado', type: 'product' },
  { slug: 'product-cartao-basico', name: 'Basico', type: 'product' },
  { slug: 'product-cartao-intermediario', name: 'Intermediario', type: 'product' },
  { slug: 'product-cartao-premium', name: 'Premium', type: 'product' },
  { slug: 'product-financiamento-carro', name: 'Carro', type: 'product' },
  { slug: 'product-financiamento-moto', name: 'Moto', type: 'product' },
  { slug: 'product-financiamento-imobiliario', name: 'Imobiliario', type: 'product' },
  { slug: 'product-refinanciamento', name: 'Refinanciamento', type: 'product' }
];

const ensureCategory = async ({ slug, name, type }) =>
  prisma.category.upsert({
    where: { slug },
    update: { name: clean(name), type },
    create: { slug, name: clean(name), type }
  });

const ensureProduct = async ({ id, type, name, categoryName, description }) => {
  const category = await ensureCategory({
    slug: `product-${slugify(type)}-${slugify(categoryName || name)}`,
    name: categoryName || name,
    type: 'product'
  });

  return prisma.financialProduct.upsert({
    where: { id },
    update: {
      type,
      name: clean(name),
      description: nullableClean(description),
      categoryId: category.id
    },
    create: {
      id,
      type,
      name: clean(name),
      description: nullableClean(description),
      categoryId: category.id
    }
  });
};

const loanProductId = (type) => {
  if (type === 'Consignado') return 'prod-loan-consigned';
  if (type === 'Garantia') return 'prod-loan-collateral';
  if (type === 'Negativado') return 'prod-loan-negative';
  return 'prod-loan-personal';
};

const financingProductId = (type) => {
  if (type === 'Imobiliario' || type === 'Imobiliário') return 'prod-financing-real-estate';
  if (type === 'Refinanciamento') return 'prod-financing-refinancing';
  if (type === 'Moto') return 'prod-financing-motorcycle';
  return 'prod-financing-auto';
};

const seedBanks = async () => {
  for (const bank of banksData) {
    await prisma.bank.upsert({
      where: { id: bank.id },
      update: {
        name: clean(bank.name),
        logo: bank.logo || null,
        website: bank.website || null,
        status: 'active'
      },
      create: {
        id: bank.id,
        name: clean(bank.name),
        logo: bank.logo || null,
        website: bank.website || null,
        status: 'active'
      }
    });
  }
};

const seedProducts = async () => {
  for (const category of productCategories) {
    await ensureCategory(category);
  }

  const baseProducts = [
    { id: 'prod-loan-personal', type: 'loan', name: 'Emprestimo Pessoal', categoryName: 'Pessoal' },
    { id: 'prod-loan-consigned', type: 'loan', name: 'Emprestimo Consignado', categoryName: 'Consignado' },
    { id: 'prod-loan-collateral', type: 'loan', name: 'Emprestimo com Garantia', categoryName: 'Garantia' },
    { id: 'prod-loan-negative', type: 'loan', name: 'Emprestimo para Negativado', categoryName: 'Negativado' },
    { id: 'prod-financing-auto', type: 'financing', name: 'Financiamento de Veiculo', categoryName: 'Carro' },
    { id: 'prod-financing-motorcycle', type: 'financing', name: 'Financiamento de Moto', categoryName: 'Moto' },
    { id: 'prod-financing-real-estate', type: 'financing', name: 'Financiamento Imobiliario', categoryName: 'Imobiliario' },
    { id: 'prod-financing-refinancing', type: 'financing', name: 'Refinanciamento', categoryName: 'Refinanciamento' }
  ];

  for (const product of baseProducts) {
    await ensureProduct(product);
  }

  for (const card of creditCardsData) {
    await ensureProduct({
      id: `prod-card-${card.id}`,
      type: 'credit_card',
      name: card.name,
      categoryName: card.category
    });
  }
};

const seedOffers = async () => {
  for (const loan of loansData) {
    await prisma.offer.upsert({
      where: { id: `offer-${loan.id}` },
      update: {
        bankId: loan.bankId,
        productId: loanProductId(loan.type),
        interestRate: numberOrNull(loan.monthlyRate),
        cet: numberOrNull(loan.annualRate),
        minAmount: numberOrNull(loan.minValue),
        maxAmount: numberOrNull(loan.maxValue),
        minTerm: loan.minTerm,
        maxTerm: loan.maxTerm,
        scoreRequirement: clean(loan.minScore),
        redirectUrl: 'https://www.cotejuros.com.br/emprestimos',
        status: 'active'
      },
      create: {
        id: `offer-${loan.id}`,
        bankId: loan.bankId,
        productId: loanProductId(loan.type),
        interestRate: numberOrNull(loan.monthlyRate),
        cet: numberOrNull(loan.annualRate),
        minAmount: numberOrNull(loan.minValue),
        maxAmount: numberOrNull(loan.maxValue),
        minTerm: loan.minTerm,
        maxTerm: loan.maxTerm,
        scoreRequirement: clean(loan.minScore),
        redirectUrl: 'https://www.cotejuros.com.br/emprestimos',
        status: 'active'
      }
    });
  }

  for (const card of creditCardsData) {
    await prisma.offer.upsert({
      where: { id: `offer-${card.id}` },
      update: {
        bankId: card.bankId,
        productId: `prod-card-${card.id}`,
        minAmount: numberOrNull(card.minLimit),
        maxAmount: numberOrNull(card.maxLimit),
        redirectUrl: 'https://www.cotejuros.com.br/cartoes',
        status: 'active'
      },
      create: {
        id: `offer-${card.id}`,
        bankId: card.bankId,
        productId: `prod-card-${card.id}`,
        minAmount: numberOrNull(card.minLimit),
        maxAmount: numberOrNull(card.maxLimit),
        redirectUrl: 'https://www.cotejuros.com.br/cartoes',
        status: 'active'
      }
    });
  }

  for (const financing of financingData) {
    await prisma.offer.upsert({
      where: { id: `offer-${financing.id}` },
      update: {
        bankId: financing.bankId,
        productId: financingProductId(clean(financing.type)),
        interestRate: numberOrNull(financing.monthlyRate),
        cet: numberOrNull(financing.annualRate),
        minAmount: numberOrNull(financing.minValue),
        maxAmount: numberOrNull(financing.maxValue),
        minTerm: financing.minTerm,
        maxTerm: financing.maxTerm,
        redirectUrl: 'https://www.cotejuros.com.br/financiamento',
        status: 'active'
      },
      create: {
        id: `offer-${financing.id}`,
        bankId: financing.bankId,
        productId: financingProductId(clean(financing.type)),
        interestRate: numberOrNull(financing.monthlyRate),
        cet: numberOrNull(financing.annualRate),
        minAmount: numberOrNull(financing.minValue),
        maxAmount: numberOrNull(financing.maxValue),
        minTerm: financing.minTerm,
        maxTerm: financing.maxTerm,
        redirectUrl: 'https://www.cotejuros.com.br/financiamento',
        status: 'active'
      }
    });
  }
};

const seedArticles = async () => {
  const seenSlugs = new Set();

  for (const article of articlesData) {
    const slug = article.slug || slugify(article.title);
    if (!slug || seenSlugs.has(slug)) continue;
    seenSlugs.add(slug);

    const category = await ensureCategory({
      slug: `blog-${slugify(article.category || 'Financas Pessoais')}`,
      name: article.category || 'Financas Pessoais',
      type: 'blog'
    });
    const publishDate = article.publishDate || article.publishedAt || '2026-01-01T12:00:00.000Z';
    const content = article.content || article.body || article.summary || article.excerpt || article.title;

    await prisma.article.upsert({
      where: { slug },
      update: {
        title: clean(article.title),
        content: typeof content === 'string' ? clean(content) : JSON.stringify(content),
        excerpt: nullableClean(article.summary || article.excerpt || article.metaDescription),
        categoryId: category.id,
        author: nullableClean(article.author || 'Equipe Cote Juros'),
        seoTitle: nullableClean(article.seoTitle || article.metaTitle || article.title),
        seoDescription: nullableClean(article.seoDescription || article.metaDescription || article.summary),
        publishedAt: new Date(publishDate),
        status: 'published'
      },
      create: {
        id: article.id || undefined,
        slug,
        title: clean(article.title),
        content: typeof content === 'string' ? clean(content) : JSON.stringify(content),
        excerpt: nullableClean(article.summary || article.excerpt || article.metaDescription),
        categoryId: category.id,
        author: nullableClean(article.author || 'Equipe Cote Juros'),
        seoTitle: nullableClean(article.seoTitle || article.metaTitle || article.title),
        seoDescription: nullableClean(article.seoDescription || article.metaDescription || article.summary),
        publishedAt: new Date(publishDate),
        status: 'published'
      }
    });
  }
};

const main = async () => {
  await seedBanks();
  await seedProducts();
  await seedOffers();
  await seedArticles();

  const [banks, offers, articles] = await Promise.all([
    prisma.bank.count({ where: { status: 'active' } }),
    prisma.offer.count({ where: { status: 'active' } }),
    prisma.article.count({ where: { status: 'published' } })
  ]);

  console.log(JSON.stringify({ ok: true, banks, offers, articles }, null, 2));
};

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
