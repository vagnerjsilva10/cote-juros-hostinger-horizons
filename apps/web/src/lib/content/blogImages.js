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

const TOPIC_IMAGE_POOLS = {
  credito: [
    'https://images.unsplash.com/photo-1554224154-26032ffc0d07?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1556740749-887f6717d7e4?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1556742031-c6961e8560b0?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1607082349566-187342175e2f?auto=format&fit=crop&w=1600&q=80'
  ],
  dinheiro: [
    'https://images.unsplash.com/photo-1579621970795-87facc2f976d?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1600&q=80'
  ],
  emprestimo: [
    'https://images.unsplash.com/photo-1554224155-a1487473ffd9?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1589758438368-0ad531db3366?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1556155092-490a1ba16284?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=1600&q=80'
  ],
  cartao: [
    'https://images.unsplash.com/photo-1556742502-ec7c0e9f34b1?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1601597111158-2fceff292cdc?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1563013544-824ae1b704d3?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1518458028785-8fbcd101ebb9?auto=format&fit=crop&w=1600&q=80'
  ],
  score: [
    'https://images.unsplash.com/photo-1554224154-22dec7ec8818?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1604594849809-dfedbc827105?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1543286386-2e659306cd6c?auto=format&fit=crop&w=1600&q=80'
  ],
  orcamento: [
    'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1600&q=80'
  ],
  financiamento: [
    'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1501183638710-841dd1904471?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1600&q=80'
  ],
  veiculo: [
    'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1472220625704-91e1462799b2?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1460317442991-0ec209397118?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1560185007-5f0bb1866cab?auto=format&fit=crop&w=1600&q=80'
  ],
  golpes: [
    'https://images.unsplash.com/photo-1563013544-33c9d8d5b9e3?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1556745757-8d76bdb6984b?auto=format&fit=crop&w=1600&q=80'
  ],
  tecnologia: [
    'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1600&q=80'
  ]
};

export const BLOG_ARTICLE_IMAGE_MANIFEST = {
  'como-usar-tecnologia-para-organizar-financas':
    'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1600&q=80',
  'entendendo-os-juros-compostos-como-pequenas-dividas-podem-se-tornar-grandes-problemas-financeiros':
    'https://images.unsplash.com/photo-1554224155-1696413565d3?auto=format&fit=crop&w=1600&q=80'
};

const TOPIC_IMAGE_MATCHERS = [
  { key: 'tecnologia', terms: ['tecnologia', 'app', 'aplicativo', 'digital', 'drex'] },
  { key: 'golpes', terms: ['golpe', 'fraude', 'pix', 'seguranca', 'phishing'] },
  { key: 'cartao', terms: ['cartao', 'fatura', 'anuidade', 'cashback', 'milhas', 'rotativo'] },
  { key: 'score', terms: ['score', 'serasa', 'credito-pessoal-score'] },
  { key: 'financiamento', terms: ['financiamento', 'imovel', 'casa', 'apartamento'] },
  { key: 'veiculo', terms: ['veiculo', 'carro', 'moto', 'fipe', 'placa', 'apreensao'] },
  { key: 'emprestimo', terms: ['emprestimo', 'consignado', 'clt', 'mei', 'autonomo'] },
  { key: 'dinheiro', terms: ['dinheiro', 'renda', 'rescisao', 'reserva', 'salario', 'demissao'] },
  { key: 'orcamento', terms: ['orcamento', 'financas', 'economizar', 'gastos', 'metas', 'planejamento'] },
  { key: 'credito', terms: ['credito', 'juros', 'cdi', 'cet', 'banco'] }
];

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

const resolveTopicImagePoolKey = (article = {}) => {
  const keywords = getTopicKeywords(article);
  const haystack = keywords.join(' ');
  const matched = TOPIC_IMAGE_MATCHERS.find(({ terms }) => terms.some((term) => haystack.includes(term)));
  return matched?.key || '';
};

const buildStockProviderImage = (article = {}) => {
  const topicKey = resolveTopicImagePoolKey(article);
  const topicPool = TOPIC_IMAGE_POOLS[topicKey];
  const categoryKey = getCategoryKey(article.category || article.clusterLabel);
  const pool = topicPool?.length ? topicPool : STOCK_IMAGE_POOLS[categoryKey] || STOCK_IMAGE_POOLS.default;
  const seed = hashString(slugify(article.slug || article.title || article.id || 'cote-juros'));
  return pool[seed % pool.length];
};

const shouldPreferGeneratedPrimary = () => true;

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
  const title = String(article.title || article.h1 || 'Blog Cote Juros').trim();
  const palette = getImagePalette(article.category || article.clusterLabel);
  const seed = hashString(slug);
  const headline = title.length > 58 ? `${title.slice(0, 55)}...` : title;
  const topicKey = resolveTopicImagePoolKey(article);
  const circles = Array.from({ length: 3 }, (_, index) => ({
    x: 760 + ((seed >> (index * 4)) % 220),
    y: 120 + ((seed >> (index * 6)) % 260),
    r: 42 + ((seed >> (index * 2)) % 40),
    opacity: 0.12 + index * 0.08
  }));
  const bars = Array.from({ length: 5 }, (_, index) => 66 + ((seed >> (index * 3)) % 96));
  const label = String(article.category || 'Conteúdo do blog').slice(0, 44);

  const glyphByTopic = {
    emprestimo:
      `<path d="M872 178c52 0 94 42 94 94s-42 94-94 94-94-42-94-94 42-94 94-94Zm0 42c-29 0-52 23-52 52s23 52 52 52 52-23 52-52-23-52-52-52Zm-4 18h18v22h22v18h-22v22h-18v-22h-22v-18h22z" fill="${palette.primary}" opacity="0.88"/>`,
    cartao:
      `<rect x="782" y="192" width="208" height="132" rx="24" fill="${palette.primary}" opacity="0.9"/><rect x="812" y="236" width="148" height="16" rx="8" fill="#ffffff" opacity="0.92"/><rect x="812" y="272" width="74" height="12" rx="6" fill="#ffffff" opacity="0.82"/>`,
    financiamento:
      `<path d="M782 300 884 212l102 88v42h-32v-66h-140v66h-32z" fill="${palette.primary}" opacity="0.9"/><rect x="852" y="286" width="32" height="56" rx="8" fill="#fff" opacity="0.86"/>`,
    score:
      `<path d="M808 328V222h32v106h-32Zm56 0v-72h32v72h-32Zm56 0v-124h32v124h-32Z" fill="${palette.primary}" opacity="0.92"/><path d="M804 204c52-12 96-8 148 18" fill="none" stroke="${palette.primary}" stroke-width="10" stroke-linecap="round" opacity="0.7"/>`,
    orcamento:
      `<circle cx="876" cy="248" r="74" fill="${palette.primary}" opacity="0.12"/><path d="M876 204v88M832 248h88" stroke="${palette.primary}" stroke-width="12" stroke-linecap="round"/><circle cx="876" cy="248" r="20" fill="${palette.primary}" opacity="0.92"/>`,
    veiculo:
      `<rect x="792" y="246" width="180" height="54" rx="18" fill="${palette.primary}" opacity="0.92"/><path d="M826 246 854 214h58l28 32" fill="${palette.primary}" opacity="0.72"/><circle cx="844" cy="312" r="18" fill="${palette.accent}"/><circle cx="922" cy="312" r="18" fill="${palette.accent}"/>`,
    golpes:
      `<path d="M876 194 960 224v52c0 54-33 92-84 116-51-24-84-62-84-116v-52z" fill="${palette.primary}" opacity="0.92"/><path d="M876 236v44" stroke="#fff" stroke-width="12" stroke-linecap="round"/><circle cx="876" cy="304" r="8" fill="#fff"/>`
  };
  const glyph = glyphByTopic[topicKey] || glyphByTopic.orcamento;

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="675" viewBox="0 0 1200 675" role="img" aria-label="${headline}">
      <rect width="1200" height="675" fill="#ffffff" />
      <rect width="1200" height="675" fill="${palette.soft}" opacity="0.62" />
      ${circles.map((circle) => `<circle cx="${circle.x}" cy="${circle.y}" r="${circle.r}" fill="${palette.primary}" opacity="${circle.opacity}" />`).join('')}
      <rect x="48" y="46" width="1104" height="583" rx="34" fill="#ffffff" fill-opacity="0.9" />
      <rect x="88" y="90" width="236" height="42" rx="21" fill="${palette.soft}" />
      <text x="122" y="122" fill="${palette.primary}" font-family="Arial, sans-serif" font-size="22" font-weight="700">${palette.eyebrow}</text>
      <text x="88" y="204" fill="${palette.accent}" font-family="Arial, sans-serif" font-size="54" font-weight="700">${headline}</text>
      <text x="88" y="262" fill="#475569" font-family="Arial, sans-serif" font-size="28">${label}</text>
      <rect x="744" y="136" width="292" height="232" rx="28" fill="#ffffff" fill-opacity="0.96" />
      ${glyph}
      <path d="M782 334C830 300 870 294 912 254C944 224 988 208 1010 194" fill="none" stroke="${palette.primary}" stroke-width="10" stroke-linecap="round" opacity="0.4" />
      ${bars
        .map(
          (height, index) =>
            `<rect x="${792 + index * 46}" y="${564 - height}" width="24" height="${height}" rx="12" fill="${palette.primary}" opacity="${0.24 + index * 0.12}" />`
        )
        .join('')}
      <rect x="88" y="516" width="312" height="16" rx="8" fill="${palette.soft}" />
      <rect x="88" y="548" width="384" height="16" rx="8" fill="#e2e8f0" />
      <rect x="744" y="430" width="292" height="118" rx="24" fill="${palette.soft}" opacity="0.72" />
      <text x="776" y="482" fill="${palette.primary}" font-family="Arial, sans-serif" font-size="26" font-weight="700">Blog Cote Juros</text>
      <text x="776" y="516" fill="${palette.accent}" font-family="Arial, sans-serif" font-size="22">Imagem exclusiva do artigo</text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};

export const resolveArticleImageSources = (article = {}) => {
  const slug = slugify(article.slug || article.title || article.id || 'artigo');
  const manifestImage = BLOG_ARTICLE_IMAGE_MANIFEST[slug];
  const explicitImageCandidates = [article.coverImage, article.image, article.imageUrl, article.featuredImage].filter(isRenderableImage);
  const categoryFallback = getBlogCategoryImage(article.category || article.clusterLabel);
  const globalFallback = BLOG_CATEGORY_FALLBACKS.default;
  const generatedFallback = buildGeneratedArticleImage(article);
  const primaryImage = shouldPreferGeneratedPrimary(article)
    ? generatedFallback
    : manifestImage || explicitImageCandidates.find((image) => !String(image).startsWith('data:image/')) || generatedFallback;

  const ordered = [
    primaryImage,
    manifestImage,
    ...explicitImageCandidates.filter((image) => !String(image).startsWith('data:image/')),
    generatedFallback,
    categoryFallback,
    globalFallback
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

  return explicitAlt || `Imagem do artigo sobre ${String(article.title || article.h1 || 'Cote Juros').trim()}`;
};
