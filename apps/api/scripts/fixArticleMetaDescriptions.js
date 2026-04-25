import { config as loadEnv } from 'dotenv';
import { PrismaClient } from '@prisma/client';

loadEnv();

const prisma = new PrismaClient();

const STOPWORDS = new Set([
  'para', 'como', 'sobre', 'guia', 'entenda', 'melhor', 'vale', 'pena',
  'voce', 'mais', 'menos', 'reais', '2025', '2026'
]);

const normalize = (value = '') =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

const words = (value = '') =>
  normalize(value)
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length >= 4 && !STOPWORDS.has(word));

const clean = (value = '') => String(value || '').replace(/\s+/g, ' ').trim();

const trimSentence = (value = '', max = 160) => {
  const sentence = clean(value);
  if (sentence.length <= max) return sentence;
  const cut = sentence.slice(0, max - 1);
  const last = Math.max(cut.lastIndexOf('.'), cut.lastIndexOf(','), cut.lastIndexOf(' '));
  return `${clean(cut.slice(0, last > 90 ? last : max - 1)).replace(/[,.]$/, '')}.`;
};

const ensureUsefulLength = (value = '', min = 110, max = 160) => {
  const additions = [
    'Veja pontos de atenção antes de tomar sua decisão.',
    'Compare opções com calma e evite custos desnecessários.',
    'Entenda os principais cuidados para evitar decisões ruins.'
  ];

  let sentence = clean(value);
  for (const addition of additions) {
    if (sentence.length >= min) break;
    const next = clean(`${sentence.replace(/\.$/, '')}. ${addition}`);
    if (next.length <= max) {
      sentence = next;
    }
  }

  return trimSentence(sentence, max);
};

const buildMeta = (article) => {
  const structured = article.structuredContent || {};
  const title = clean(article.title.replace(/\s*[:|-]\s*.+$/, ''));
  const primary = clean(
    structured.clusterKeyword ||
    article.cluster?.primaryKeyword ||
    structured.clusterLabel ||
    article.category?.name ||
    title
  );
  const haystack = normalize([title, primary, structured.category].join(' '));
  let tail = 'Veja como comparar custo total, taxas, prazos e riscos antes de decidir.';

  if (/cartao|fatura|limite|cashback|anuidade|milhas|rotativo/.test(haystack)) {
    tail = 'Compare anuidade, limite, taxas, fatura e riscos antes de escolher.';
  } else if (/financi|veiculo|carro|imovel|consorcio/.test(haystack)) {
    tail = 'Compare taxas, CET, prazo, parcela e riscos antes de contratar.';
  } else if (/divid|negativ|score|serasa|cpf|nome/.test(haystack)) {
    tail = 'Entenda alternativas, custos e cuidados para decidir com mais segurança.';
  } else if (/educacao|organizacao|orcamento|reserva|financas/.test(haystack)) {
    tail = 'Veja passos práticos para organizar o orçamento e evitar dívidas.';
  } else if (/juros/.test(haystack)) {
    tail = 'Entenda sinais de cobrança abusiva, custos e formas de se proteger.';
  }

  const prefix = title.length > 72
    ? `${title.slice(0, 69).replace(/\s+\S*$/, '')}...`
    : title;

  return ensureUsefulLength(`${prefix}: ${tail}`, 110, 160);
};

const isWeakMeta = (article) => {
  const meta = article.seoDescription ||
    article.structuredContent?.metaDescription ||
    article.structuredContent?.seoDescription ||
    '';
  const keywordSource = [
    article.cluster?.primaryKeyword,
    article.structuredContent?.clusterKeyword,
    article.structuredContent?.clusterLabel,
    ...(Array.isArray(article.structuredContent?.tags) ? article.structuredContent.tags : []),
    article.title
  ].filter(Boolean).join(' ');
  const keywords = [...new Set(words(keywordSource))].slice(0, 12);
  const matches = keywords.filter((keyword) => normalize(meta).includes(keyword));
  const badPlaceholder = /welcome to wordpress|students must be equipped/i.test(meta);
  return !meta || meta.length < 110 || meta.length > 170 || matches.length < 1 || badPlaceholder;
};

const main = async () => {
  const articles = await prisma.article.findMany({
    where: { status: 'published' },
    include: { cluster: true, category: true },
    take: 5000
  });

  const weak = articles.filter(isWeakMeta);
  const updates = [];

  for (const article of weak) {
    const nextMeta = buildMeta(article);
    const structuredContent = {
      ...(article.structuredContent || {}),
      metaDescription: nextMeta,
      seoDescription: nextMeta
    };

    await prisma.article.update({
      where: { id: article.id },
      data: {
        seoDescription: nextMeta,
        structuredContent
      }
    });

    updates.push({
      slug: article.slug,
      length: nextMeta.length,
      meta: nextMeta
    });
  }

  console.log(JSON.stringify({ updated: updates.length, updates }, null, 2));
};

main()
  .catch((error) => {
    console.error('[fix-article-meta-descriptions] failed', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
