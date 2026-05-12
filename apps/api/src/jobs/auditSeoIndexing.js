import { PUBLIC_SITE_URL } from '../services/editorialConfig.js';

const args = process.argv.slice(2);
const getArg = (name, fallback = '') => {
  const prefix = `--${name}=`;
  const value = args.find((item) => item.startsWith(prefix));
  return value ? value.slice(prefix.length) : fallback;
};

const samplePath = getArg('path', '/blog/consignado-inss-cobranca-indevida/');
const siteUrl = PUBLIC_SITE_URL;

const fetchText = async (url, headers = {}) => {
  const response = await fetch(url, {
    redirect: 'follow',
    headers: {
      'User-Agent': 'CoteJurosSeoAudit/1.0',
      ...headers
    }
  });
  const text = await response.text();
  return { url, status: response.status, finalUrl: response.url, text };
};

const extract = (html, pattern) => String(html || '').match(pattern)?.[1] || '';

const hasArticleContent = (html = '') =>
  /<h1[\s>]/i.test(html)
  && /<main[\s>]/i.test(html)
  && /application\/ld\+json/i.test(html)
  && html.length > 8000;

const checks = [];
const addCheck = (name, passed, details = {}) => {
  checks.push({ name, passed: Boolean(passed), details });
};

const run = async () => {
  const robots = await fetchText(`${siteUrl}/robots.txt`);
  addCheck('robots 200', robots.status === 200, { status: robots.status });
  addCheck('robots sitemap www', robots.text.includes(`Sitemap: ${siteUrl}/sitemap.xml`), {
    expected: `Sitemap: ${siteUrl}/sitemap.xml`
  });
  addCheck('robots allow all', /User-agent:\s*\*/i.test(robots.text) && /Allow:\s*\//i.test(robots.text));

  const sitemap = await fetchText(`${siteUrl}/sitemap.xml`);
  addCheck('sitemap 200', sitemap.status === 200, { status: sitemap.status });
  addCheck('sitemap only www', !/https:\/\/cotejuros\.com\.br(\/|<)/i.test(sitemap.text) && !/api\.cotejuros\.com\.br/i.test(sitemap.text));

  const articleUrl = `${siteUrl}${samplePath.startsWith('/') ? samplePath : `/${samplePath}`}`;
  const article = await fetchText(articleUrl, {
    'Accept': 'text/html'
  });
  const canonical = extract(article.text, /<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i);
  const title = extract(article.text, /<title>([\s\S]*?)<\/title>/i);

  addCheck('article 200', article.status === 200, { status: article.status, finalUrl: article.finalUrl });
  addCheck('article canonical www', canonical.startsWith(`${siteUrl}/blog/`), { canonical });
  addCheck('article title real', title && !/^Cote Juros \| Compare/i.test(title), { title });
  addCheck('article JSON-LD', /application\/ld\+json/i.test(article.text));
  addCheck('article initial content', hasArticleContent(article.text), { bytes: article.text.length });
  addCheck('article adsense script', /pagead2\.googlesyndication\.com\/pagead\/js\/adsbygoogle\.js/i.test(article.text));

  const failed = checks.filter((item) => !item.passed);
  console.log(JSON.stringify({
    ok: failed.length === 0,
    siteUrl,
    samplePath,
    checks,
    failed
  }, null, 2));

  if (failed.length) process.exitCode = 1;
};

run().catch((error) => {
  console.error('[seo-audit] failed', error);
  process.exitCode = 1;
});
