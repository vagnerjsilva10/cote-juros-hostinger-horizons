import 'dotenv/config.js';
import { getPrisma } from '../lib/prisma.js';
import { ContentDistributionService } from '../services/contentDistributionService.js';

const parseArgs = () => {
  const args = process.argv.slice(2);
  const entries = new Map();

  for (const arg of args) {
    if (!arg.startsWith('--')) continue;
    const [key, value] = arg.slice(2).split('=');
    entries.set(key, value ?? 'true');
  }

  return {
    limit: Number(entries.get('limit') || 5),
    slug: entries.get('slug') || '',
    force: entries.get('force') === 'true',
    triggerSource: entries.get('trigger') || 'manual'
  };
};

const toArticlePayload = (record) => {
  const structured = record.structuredContent && typeof record.structuredContent === 'object'
    ? record.structuredContent
    : {};

  return {
    ...structured,
    id: record.id,
    slug: record.slug,
    title: record.title,
    h1: structured.h1 || record.title,
    summary: record.excerpt || structured.summary || '',
    excerpt: record.excerpt || structured.summary || '',
    metaTitle: record.seoTitle || structured.metaTitle || record.title,
    metaDescription: record.seoDescription || structured.metaDescription || record.excerpt || '',
    category: record.category?.name || structured.category || '',
    clusterLabel: record.cluster?.name || structured.clusterLabel || '',
    clusterKeyword: record.cluster?.primaryKeyword || structured.clusterKeyword || '',
    coverImage: record.coverImage || structured.coverImage || '',
    ogImage: record.ogImage || structured.ogImage || '',
    routePath: structured.routePath || `/blog/${record.slug}`,
    canonicalUrl: `${process.env.PUBLIC_SITE_URL || 'https://www.cotejuros.com.br'}/blog/${record.slug}/`,
    tags: Array.isArray(structured.tags) ? structured.tags : [],
    intro: Array.isArray(structured.intro) ? structured.intro : [],
    sections: Array.isArray(structured.sections) ? structured.sections : [],
    conclusion: Array.isArray(structured.conclusion) ? structured.conclusion : []
  };
};

const main = async () => {
  const options = parseArgs();
  const prisma = getPrisma();

  const where = {
    status: 'published',
    ...(options.slug ? { slug: options.slug } : {})
  };

  const records = await prisma.article.findMany({
    where,
    include: {
      category: true,
      cluster: true,
      brief: true
    },
    orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
    take: Number.isFinite(options.limit) && options.limit > 0 ? options.limit : 5
  });

  const pending = records.filter((record) => {
    if (options.force) return true;
    const structured = record.structuredContent && typeof record.structuredContent === 'object'
      ? record.structuredContent
      : {};
    return !structured.distribution?.webStory?.url;
  });

  const items = [];
  for (const record of pending) {
    try {
      const distribution = await ContentDistributionService.distributePublishedArticle({
        articleRecord: record,
        articlePayload: toArticlePayload(record),
        brief: record.brief || {},
        triggerSource: options.triggerSource
      });

      items.push({
        slug: record.slug,
        ok: true,
        webStory: distribution.webStory.path,
        pinterest: distribution.pinterest.status
      });
    } catch (error) {
      items.push({
        slug: record.slug,
        ok: false,
        error: error?.message || String(error)
      });
    }
  }

  console.log(JSON.stringify({
    ok: true,
    scanned: records.length,
    processed: items.length,
    items
  }, null, 2));
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
