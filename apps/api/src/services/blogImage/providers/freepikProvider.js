const FREEPIK_BASE_URL = (process.env.FREEPIK_BASE_URL || 'https://www.freepik.com').replace(/\/$/, '');

const normalizeUrl = (value = '') => {
  if (!value) return '';
  if (value.startsWith('http://') || value.startsWith('https://')) return value;
  if (value.startsWith('//')) return `https:${value}`;
  if (value.startsWith('/')) return `${FREEPIK_BASE_URL}${value}`;
  return `${FREEPIK_BASE_URL}/${value}`;
};

const decodeHtml = (value = '') =>
  String(value)
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');

const parseMetaContent = (html = '', property = '') => {
  const regex = new RegExp(`<meta[^>]+(?:property|name)="${property}"[^>]+content="([^"]+)"`, 'i');
  return decodeHtml(html.match(regex)?.[1] || '');
};

const extractSearchPaths = (html = '') => {
  const matches = [...html.matchAll(/href="([^"]*\/free-photo\/[^"]+)"/gi)];
  return Array.from(new Set(matches.map((item) => item[1]).filter(Boolean))).slice(0, 18);
};

const parseDimensionsFromUrl = (url = '') => {
  const match = url.match(/(\d{3,4})x(\d{3,4})/i);
  if (!match) return { width: 0, height: 0 };
  return {
    width: Number(match[1]) || 0,
    height: Number(match[2]) || 0
  };
};

const fetchCandidateDetails = async (pageUrl, query) => {
  const response = await fetch(pageUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; CoteJurosBot/1.0; +https://www.cotejuros.com.br)'
    }
  });

  if (!response.ok) {
    throw new Error(`Freepik asset request failed (${response.status})`);
  }

  const html = await response.text();
  const title = parseMetaContent(html, 'og:title') || parseMetaContent(html, 'twitter:title') || 'Freepik image';
  const description = parseMetaContent(html, 'og:description') || '';
  const imageUrl = parseMetaContent(html, 'og:image') || parseMetaContent(html, 'twitter:image');
  const dimensions = parseDimensionsFromUrl(imageUrl);

  if (!imageUrl) {
    throw new Error('Freepik asset page did not expose og:image');
  }

  return {
    provider: 'freepik',
    kind: 'photo',
    isFree: true,
    attributionRequired: true,
    query,
    title,
    description,
    pageUrl,
    downloadUrl: imageUrl,
    previewUrl: imageUrl,
    width: dimensions.width,
    height: dimensions.height
  };
};

export const searchFreepikImages = async ({ keywords = [], perKeyword = 3 }) => {
  const results = [];

  for (const keyword of (Array.isArray(keywords) ? keywords : []).slice(0, 10)) {
    const searchUrl = `${FREEPIK_BASE_URL}/search?format=search&last_filter=query&last_value=${encodeURIComponent(keyword)}&query=${encodeURIComponent(keyword)}&type=photo`;
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; CoteJurosBot/1.0; +https://www.cotejuros.com.br)'
      }
    });

    if (!response.ok) continue;
    const html = await response.text();
    const paths = extractSearchPaths(html).slice(0, perKeyword);

    for (const relativePath of paths) {
      const pageUrl = normalizeUrl(relativePath);
      try {
        results.push(await fetchCandidateDetails(pageUrl, keyword));
      } catch {
        // skip broken candidate
      }
    }
  }

  return results.filter((item) => item.isFree && item.pageUrl.includes('/free-photo/'));
};
