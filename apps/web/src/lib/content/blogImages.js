import { BLOG_PRIORITY_IMAGE_LIBRARY, BLOG_PRIORITY_IMAGE_MANIFEST } from '@/data/blogEditorialOverrides.js';

const normalizeText = (value = '') =>
  String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

const slugify = (value = '') =>
  normalizeText(value)
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

const hashString = (value = '') => {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash;
};

const isRenderableImage = (value) => {
  if (typeof value !== 'string') return false;
  const image = value.trim();
  if (!image || ['undefined', 'null', 'false', 'nan'].includes(image.toLowerCase())) return false;

  return (
    image.startsWith('data:image/') ||
    image.startsWith('/') ||
    image.startsWith('./') ||
    image.startsWith('../') ||
    image.startsWith('http://') ||
    image.startsWith('https://')
  );
};

export const BLOG_CATEGORY_FALLBACKS = {
  emprestimos: '/assets/blog/fallbacks/category-emprestimos.svg',
  cartoes: '/assets/blog/fallbacks/category-cartoes.svg',
  financiamento: '/assets/blog/fallbacks/category-financiamento.svg',
  score: '/assets/blog/fallbacks/category-score.svg',
  dividas: '/assets/blog/fallbacks/category-dividas.svg',
  default: '/assets/blog/fallbacks/editorial-global.svg'
};

const STOCK_IMAGE_POOLS = {
  emprestimos: [
    'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1579621970795-87facc2f976d?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1556740749-887f6717d7e4?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1589758438368-0ad531db3366?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1556155092-490a1ba16284?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1554224155-a1487473ffd9?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1607082349566-187342175e2f?auto=format&fit=crop&w=1600&q=80'
  ],
  cartoes: [
    'https://images.unsplash.com/photo-1556742393-d75f468bfcb0?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1556742502-ec7c0e9f34b1?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1601597111158-2fceff292cdc?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1563013544-824ae1b704d3?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1554224154-26032ffc0d07?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1518458028785-8fbcd101ebb9?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1556742393-d75f468bfcb0?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1473186578172-c141e6798cf4?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1556742031-c6961e8560b0?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1554224155-3a589877462f?auto=format&fit=crop&w=1600&q=80'
  ],
  financiamento: [
    'https://images.unsplash.com/photo-1501183638710-841dd1904471?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1501183638710-841dd1904471?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1460317442991-0ec209397118?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1472220625704-91e1462799b2?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1460317442991-0ecadf09c2dc?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1560185007-5f0bb1866cab?auto=format&fit=crop&w=1600&q=80'
  ],
  score: [
    'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1554224154-22dec7ec8818?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1604594849809-dfedbc827105?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1554224155-1696413565d3?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1554224155-cfa08c2a758f?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1556740749-6d790f150f35?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1556742393-d75f468bfcb0?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1543286386-2e659306cd6c?auto=format&fit=crop&w=1600&q=80'
  ],
  educacao: [
    'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1513258496099-48168024aec0?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1516534775068-ba3e7458af70?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1516321165247-4aa89a48be28?auto=format&fit=crop&w=1600&q=80'
  ],
  default: [
    'https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1556740749-887f6717d7e4?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1556745757-8d76bdb6984b?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1473186578172-c141e6798cf4?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1600&q=80'
  ]
};

const KEYWORD_IMAGE_OVERRIDES = {
  tecnologia: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1600&q=80',
  aplicativo: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=1600&q=80',
  cartao: 'https://images.unsplash.com/photo-1556742502-ec7c0e9f34b1?auto=format&fit=crop&w=1600&q=80',
  score: 'https://images.unsplash.com/photo-1554224154-22dec7ec8818?auto=format&fit=crop&w=1600&q=80',
  financiamento: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1600&q=80',
  veiculo: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1600&q=80',
  imovel: 'https://images.unsplash.com/photo-1501183638710-841dd1904471?auto=format&fit=crop&w=1600&q=80',
  divida: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1600&q=80',
  reserva: 'https://images.unsplash.com/photo-1579621970795-87facc2f976d?auto=format&fit=crop&w=1600&q=80',
  orcamento: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1600&q=80'
};

export const BLOG_ARTICLE_IMAGE_MANIFEST = {
  ...BLOG_PRIORITY_IMAGE_MANIFEST,
  'como-usar-tecnologia-para-organizar-financas':
    'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1600&q=80'
};

const getCategoryKey = (category = '') => {
  const key = normalizeText(category);
  if (key.includes('emprest')) return 'emprestimos';
  if (key.includes('cart')) return 'cartoes';
  if (key.includes('financi')) return 'financiamento';
  if (key.includes('score')) return 'score';
  if (key.includes('educ') || key.includes('organiz')) return 'educacao';
  if (key.includes('divid') || key.includes('renegoci')) return 'dividas';
  return 'default';
};

export const getBlogCategoryImage = (category = '') => BLOG_CATEGORY_FALLBACKS[getCategoryKey(category)] || BLOG_CATEGORY_FALLBACKS.default;

const getTopicKeywords = (article = {}) => {
  const raw = `${article.slug || ''} ${article.title || ''} ${article.category || ''} ${(article.tags || article.keywords || []).join(' ')}`;
  return normalizeText(raw).split(/\s+/).filter(Boolean);
};

const buildStockProviderImage = (article = {}) => {
  const keywords = getTopicKeywords(article);
  const override = keywords.find((keyword) => KEYWORD_IMAGE_OVERRIDES[keyword]);
  if (override) return KEYWORD_IMAGE_OVERRIDES[override];

  const categoryKey = getCategoryKey(article.category || article.clusterLabel);
  const pool = STOCK_IMAGE_POOLS[categoryKey] || STOCK_IMAGE_POOLS.default;
  const seed = hashString(slugify(article.slug || article.title || article.id || 'cote-juros'));
  return pool[seed % pool.length];
};

const getImagePalette = (category = '') => {
  const key = getCategoryKey(category);
  if (key === 'emprestimos') return { primary: '#2563eb', soft: '#dbeafe', accent: '#0f172a', eyebrow: 'EMPRESTIMOS' };
  if (key === 'cartoes') return { primary: '#0f766e', soft: '#ccfbf1', accent: '#0f172a', eyebrow: 'CARTOES' };
  if (key === 'financiamento') return { primary: '#ea580c', soft: '#fed7aa', accent: '#7c2d12', eyebrow: 'FINANCIAMENTO' };
  if (key === 'score') return { primary: '#7c3aed', soft: '#ddd6fe', accent: '#3b0764', eyebrow: 'SCORE' };
  if (key === 'dividas') return { primary: '#dc2626', soft: '#fecaca', accent: '#450a0a', eyebrow: 'DIVIDAS' };
  return { primary: '#1d4ed8', soft: '#dbeafe', accent: '#0f172a', eyebrow: 'BLOG COTE JUROS' };
};

export const buildGeneratedArticleImage = (article = {}) => {
  const slug = slugify(article.slug || article.title || article.id || 'cote-juros');
  const title = String(article.title || article.h1 || 'Guia editorial Cote Juros').trim();
  const palette = getImagePalette(article.category || article.clusterLabel);
  const seed = hashString(slug);
  const bars = Array.from({ length: 5 }, (_, index) => 52 + ((seed >> (index * 3)) % 86));
  const headline = title.length > 52 ? `${title.slice(0, 49)}...` : title;

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="720" viewBox="0 0 1200 720" role="img" aria-label="${headline}">
      <rect width="1200" height="720" fill="#ffffff" />
      <rect width="1200" height="720" fill="${palette.soft}" opacity="0.5" />
      <rect x="56" y="56" width="1088" height="608" rx="34" fill="#ffffff" fill-opacity="0.88" />
      <rect x="92" y="96" width="220" height="40" rx="20" fill="${palette.soft}" />
      <text x="122" y="122" fill="${palette.primary}" font-family="Arial, sans-serif" font-size="22" font-weight="700">${palette.eyebrow}</text>
      <text x="92" y="216" fill="${palette.accent}" font-family="Arial, sans-serif" font-size="56" font-weight="700">${headline}</text>
      <text x="92" y="274" fill="#475569" font-family="Arial, sans-serif" font-size="28">${String(article.category || 'Conteudo editorial').slice(0, 42)}</text>
      <rect x="740" y="158" width="302" height="236" rx="28" fill="#ffffff" />
      <path d="M786 314C834 284 874 280 916 238C948 208 992 186 1020 176" fill="none" stroke="${palette.primary}" stroke-width="10" stroke-linecap="round" />
      ${bars
        .map(
          (height, index) =>
            `<rect x="${792 + index * 46}" y="${326 - height}" width="24" height="${height}" rx="12" fill="${palette.primary}" opacity="${0.24 + index * 0.12}" />`
        )
        .join('')}
      <rect x="92" y="550" width="326" height="16" rx="8" fill="${palette.soft}" />
      <rect x="92" y="582" width="374" height="16" rx="8" fill="#e2e8f0" />
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};

export const resolveArticleImageSources = (article = {}) => {
  const slug = slugify(article.slug || article.title || article.id || 'artigo');
  const isPriorityArticle = Boolean(BLOG_PRIORITY_IMAGE_LIBRARY[slug]);
  const manifestImage = BLOG_ARTICLE_IMAGE_MANIFEST[slug];
  const explicitImageCandidates = [article.coverImage, article.image, article.imageUrl, article.featuredImage].filter(isRenderableImage);
  const stockImage = buildStockProviderImage(article);
  const categoryFallback = getBlogCategoryImage(article.category || article.clusterLabel);
  const globalFallback = BLOG_CATEGORY_FALLBACKS.default;
  const generatedFallback = buildGeneratedArticleImage(article);

  const ordered = isPriorityArticle
    ? [
        manifestImage,
        ...explicitImageCandidates.filter((image) => !String(image).startsWith('data:image/')),
        categoryFallback,
        globalFallback
      ].filter(Boolean)
    : [
        manifestImage,
        ...explicitImageCandidates.filter((image) => !String(image).startsWith('data:image/')),
        stockImage,
        categoryFallback,
        globalFallback,
        generatedFallback
      ].filter(Boolean);

  const unique = ordered.filter((value, index) => ordered.indexOf(value) === index);

  return {
    primary: unique[0] || generatedFallback,
    fallbacks: unique.slice(1)
  };
};

export const resolveArticleImageAlt = (article = {}) => {
  const explicitAlt =
    typeof article.coverImageAlt === 'string'
      ? article.coverImageAlt.trim()
      : typeof article.imageAlt === 'string'
        ? article.imageAlt.trim()
        : '';

  return explicitAlt || `Imagem editorial sobre ${String(article.title || article.h1 || 'Cote Juros').trim()}`;
};
