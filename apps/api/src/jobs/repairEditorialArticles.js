import 'dotenv/config.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=1200&q=80';
const FALLBACK_OG = FALLBACK_IMAGE;

const compactWhitespace = (value = '') =>
  String(value || '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/(^|\s)#{1,6}\s*/g, ' ')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/_(.*?)_/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();

const ensureSentencePunctuation = (value = '') => {
  const text = compactWhitespace(value);
  if (!text) return '';
  return /[.!?:]$/.test(text) ? text : `${text}.`;
};

const normalizeKeyword = (value = '') =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

const ensureKeywordInTitle = (title = '', keyword = '') => {
  const cleanTitle = compactWhitespace(title);
  const cleanKeyword = compactWhitespace(keyword);
  if (!cleanKeyword) return cleanTitle;
  if (normalizeKeyword(cleanTitle).includes(normalizeKeyword(cleanKeyword))) return cleanTitle;
  return `${cleanKeyword}: ${cleanTitle}`.trim();
};

const ensureKeywordInFirstParagraph = (intro = [], keyword = '') => {
  const list = Array.isArray(intro) ? [...intro] : [];
  const cleanKeyword = compactWhitespace(keyword);
  if (!list.length || !cleanKeyword) return list;
  if (normalizeKeyword(list[0]).includes(normalizeKeyword(cleanKeyword))) return list;
  list[0] = ensureSentencePunctuation(`Antes de decidir, vale entender ${cleanKeyword} com clareza e sem pressa. ${list[0]}`);
  return list;
};

const normalizeParagraphList = (items = []) =>
  (Array.isArray(items) ? items : [])
    .map((item) => ensureSentencePunctuation(item))
    .filter(Boolean);

const normalizeSections = (sections = []) =>
  (Array.isArray(sections) ? sections : []).map((section) => ({
    ...section,
    heading: compactWhitespace(section?.heading || section?.title || ''),
    paragraphs: normalizeParagraphList(section?.paragraphs || []),
    bullets: (Array.isArray(section?.bullets) ? section.bullets : [])
      .map((item) => ensureSentencePunctuation(item))
      .filter(Boolean)
  }));

const repairStructuredContent = (structured = {}) => {
  const keyword = compactWhitespace(structured.clusterKeyword || structured.tags?.[0] || '');
  const title = ensureKeywordInTitle(structured.title || structured.h1 || '', keyword);
  const h1 = ensureKeywordInTitle(structured.h1 || title, keyword);
  const intro = ensureKeywordInFirstParagraph(normalizeParagraphList(structured.intro || []), keyword);
  const sections = normalizeSections(structured.sections || []);
  const faq = (Array.isArray(structured.faq) ? structured.faq : []).map((item) => ({
    question: ensureSentencePunctuation(item?.question || '').replace(/\.$/, '?'),
    answer: ensureSentencePunctuation(item?.answer || '')
  }));
  const conclusion = normalizeParagraphList(structured.conclusion || []);
  const summary = ensureSentencePunctuation(structured.summary || '');
  const metaTitle = ensureKeywordInTitle(compactWhitespace(structured.metaTitle || title), keyword).slice(0, 80);
  let metaDescription = ensureSentencePunctuation(structured.metaDescription || summary);

  if (keyword && !normalizeKeyword(metaDescription).includes(normalizeKeyword(keyword))) {
    metaDescription = `Entenda ${keyword} com mais clareza, veja custos reais, riscos e alternativas seguras antes de contratar.`;
  }

  return {
    ...structured,
    title,
    h1,
    intro,
    sections,
    faq,
    conclusion,
    summary,
    metaTitle,
    metaDescription,
    coverImage: FALLBACK_IMAGE,
    ogImage: FALLBACK_OG
  };
};

const compilePlainTextContent = (article = {}) =>
  [
    ...(article.intro || []),
    ...((article.sections || []).flatMap((section) => [
      section.heading,
      ...(section.paragraphs || []),
      ...(section.bullets || [])
    ])),
    ...((article.faq || []).flatMap((item) => [item.question, item.answer])),
    ...(article.conclusion || [])
  ]
    .filter(Boolean)
    .join('\n\n');

const main = async () => {
  const slugs = [
    'emprestimo-para-negativado-como-funciona',
    'emprestimo-para-negativado-sem-garantia'
  ];

  for (const slug of slugs) {
    const article = await prisma.article.findUnique({ where: { slug } });
    if (!article?.structuredContent || typeof article.structuredContent !== 'object') continue;

    const repaired = repairStructuredContent(article.structuredContent);

    await prisma.article.update({
      where: { slug },
      data: {
        title: repaired.title,
        excerpt: repaired.summary,
        seoTitle: repaired.metaTitle,
        seoDescription: repaired.metaDescription,
        coverImage: FALLBACK_IMAGE,
        ogImage: FALLBACK_OG,
        content: compilePlainTextContent(repaired),
        structuredContent: repaired
      }
    });
  }

  console.log(JSON.stringify({ ok: true, repaired: slugs }, null, 2));
};

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
