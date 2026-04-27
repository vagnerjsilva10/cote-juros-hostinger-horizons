import 'dotenv/config.js';
import { PrismaClient } from '@prisma/client';
import {
  findPortugueseEncodingIssues,
  repairPortugueseInObject,
  repairPortugueseText
} from '../services/portugueseTextService.js';

const prisma = new PrismaClient();

const parseArgs = () => {
  const entries = new Map();
  for (const arg of process.argv.slice(2)) {
    if (!arg.startsWith('--')) continue;
    const [key, value] = arg.slice(2).split('=');
    entries.set(key, value ?? 'true');
  }

  return {
    limit: Number(entries.get('limit') || 500),
    dryRun: entries.get('dry-run') === 'true',
    status: entries.get('status') || 'all'
  };
};

const getStructured = (article = {}) =>
  article.structuredContent && typeof article.structuredContent === 'object'
    ? article.structuredContent
    : {};

const compilePlainTextContent = (article = {}) =>
  [
    ...(article.intro || []),
    article.featuredSnippet,
    article.example,
    article.alert,
    ...((article.sections || []).flatMap((section) => [
      section.heading,
      section.subheading,
      ...(section.paragraphs || []),
      ...(section.bullets || [])
    ])),
    ...((article.midQuestions || []).flatMap((item) => [item.question, item.answer])),
    ...((article.financialImpact || [])),
    ...((article.alternatives || [])),
    ...((article.faq || []).flatMap((item) => [item.question, item.answer])),
    ...(article.conclusion || [])
  ].filter(Boolean).join('\n\n');

const repairArticleRecord = (article) => {
  const structured = repairPortugueseInObject(getStructured(article));
  const nextContent = structured && Object.keys(structured).length
    ? compilePlainTextContent(structured)
    : repairPortugueseText(article.content || '');

  return {
    title: repairPortugueseText(article.title),
    content: nextContent,
    excerpt: repairPortugueseText(article.excerpt || structured.summary || ''),
    seoTitle: repairPortugueseText(article.seoTitle || structured.metaTitle || article.title),
    seoDescription: repairPortugueseText(article.seoDescription || structured.metaDescription || article.excerpt || ''),
    structuredContent: structured
  };
};

const main = async () => {
  const options = parseArgs();
  const where = options.status === 'all' ? {} : { status: options.status };
  const articles = await prisma.article.findMany({
    where,
    orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
    take: Number.isFinite(options.limit) && options.limit > 0 ? options.limit : 500
  });

  const results = [];

  for (const article of articles) {
    const beforeIssues = [
      ...findPortugueseEncodingIssues({
        title: article.title,
        content: article.content,
        excerpt: article.excerpt,
        seoTitle: article.seoTitle,
        seoDescription: article.seoDescription,
        structuredContent: article.structuredContent
      })
    ];
    const repaired = repairArticleRecord(article);
    const afterIssues = findPortugueseEncodingIssues(repaired);
    const changed = JSON.stringify({
      title: article.title,
      content: article.content,
      excerpt: article.excerpt,
      seoTitle: article.seoTitle,
      seoDescription: article.seoDescription,
      structuredContent: article.structuredContent
    }) !== JSON.stringify(repaired);

    if (changed && !options.dryRun) {
      await prisma.article.update({
        where: { id: article.id },
        data: repaired
      });
    }

    results.push({
      id: article.id,
      slug: article.slug,
      status: article.status,
      changed,
      beforeIssueCount: beforeIssues.length,
      afterIssueCount: afterIssues.length,
      remainingIssues: afterIssues.slice(0, 8)
    });
  }

  console.log(JSON.stringify({
    ok: true,
    dryRun: options.dryRun,
    processed: results.length,
    changed: results.filter((item) => item.changed).length,
    remainingWithIssues: results.filter((item) => item.afterIssueCount > 0).length,
    results
  }, null, 2));
};

main()
  .catch((error) => {
    console.error('[repair-article-portuguese] failed', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
