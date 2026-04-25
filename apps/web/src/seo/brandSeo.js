export const SITE_URL = 'https://www.cotejuros.com.br';
export const SITE_NAME = 'Cote Juros';
export const SITE_ALTERNATE_NAME = 'CoteJuros';
export const SITE_LOGO_URL = `${SITE_URL}/brand/cote-juros-logo.svg`;
export const DEFAULT_OG_IMAGE =
  'https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=1200&q=80';

const cleanPath = (path = '/') => {
  if (!path || path === '/') return '/';
  return `/${String(path).replace(/^\/+/, '').replace(/\/+$/, '')}`;
};

export const canonicalUrl = (path = '/') => {
  const normalizedPath = cleanPath(path);
  return `${SITE_URL}${normalizedPath === '/' ? '/' : normalizedPath}`;
};

export const brandPages = {
  home: {
    path: '/',
    title: 'Cote Juros | Compare crédito com mais clareza antes de contratar',
    description:
      'Compare opções de crédito com mais clareza antes de contratar. Entenda custo real, parcelas e escolha com mais segurança, sem pressão.'
  },
  emprestimos: {
    path: '/emprestimos',
    title: 'Empréstimos | Compare opções com clareza | Cote Juros',
    description:
      'Compare empréstimos por valor, prazo e custo antes de contratar. Veja caminhos possíveis para o seu perfil, sem cobrança antecipada.'
  },
  cartoes: {
    path: '/cartoes',
    title: 'Cartões de crédito | Compare benefícios e custos | Cote Juros',
    description:
      'Compare cartões de crédito por anuidade, limite, benefícios e perfil antes de escolher a opção que faz sentido para você.'
  },
  financiamentos: {
    path: '/financiamentos',
    title: 'Financiamentos | Compare taxas, entrada e prazos | Cote Juros',
    description:
      'Compare opções de financiamento de veículos e imóveis com leitura clara de taxa, entrada, prazo e custo total.'
  },
  blog: {
    path: '/blog',
    title: 'Blog Cote Juros | Guias para decidir melhor sobre crédito',
    description:
      'Leia guias sobre empréstimo, cartão, score, dívidas, financiamento e organização financeira com explicações claras.'
  },
  comoFunciona: {
    path: '/como-funciona',
    title: 'Como funciona | Cote Juros',
    description:
      'Entenda como a Cote Juros ajuda você a comparar crédito, cartões e financiamentos antes de contratar, sem cobrança antecipada.'
  },
  ferramentas: {
    path: '/ferramentas',
    title: 'Ferramentas financeiras | Calculadoras da Cote Juros',
    description:
      'Use calculadoras de juros, financiamento e comprometimento de renda para entender parcelas e custo total antes de decidir.'
  },
  sobre: {
    path: '/sobre-nos',
    title: 'Sobre a Cote Juros | Comparação financeira com clareza',
    description:
      'Conheça a Cote Juros, uma plataforma criada para ajudar pessoas a comparar crédito com mais contexto antes de contratar.'
  },
  contato: {
    path: '/contato',
    title: 'Contato | Cote Juros',
    description:
      'Fale com a Cote Juros para dúvidas sobre a plataforma, conteúdo, parcerias e atendimento.'
  },
  faq: {
    path: '/perguntas-frequentes',
    title: 'Perguntas frequentes | Cote Juros',
    description:
      'Tire dúvidas sobre a Cote Juros, comparação de crédito, cobrança antecipada, aprovação e próximos passos.'
  }
};

export const homeBreadcrumb = { name: 'Início', path: '/' };

export const createOrganizationSchema = () => ({
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': `${SITE_URL}/#organization`,
  name: SITE_NAME,
  alternateName: SITE_ALTERNATE_NAME,
  url: `${SITE_URL}/`,
  logo: SITE_LOGO_URL
});

export const createWebSiteSchema = () => ({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': `${SITE_URL}/#website`,
  name: SITE_NAME,
  alternateName: SITE_ALTERNATE_NAME,
  url: `${SITE_URL}/`,
  publisher: {
    '@id': `${SITE_URL}/#organization`
  },
  inLanguage: 'pt-BR'
});

export const createBreadcrumbSchema = (items = []) => {
  const normalizedItems = items.filter(Boolean);

  if (normalizedItems.length < 2) return null;

  const lastItemPath = normalizedItems[normalizedItems.length - 1]?.path || '/';

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    '@id': `${canonicalUrl(lastItemPath)}#breadcrumb`,
    itemListElement: normalizedItems.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: canonicalUrl(item.path)
    }))
  };
};

export const createWebPageSchema = ({ title, description, path = '/', breadcrumbs = [] }) => {
  const url = canonicalUrl(path);
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': `${url}#webpage`,
    name: title,
    description,
    url,
    isPartOf: {
      '@id': `${SITE_URL}/#website`
    },
    about: {
      '@id': `${SITE_URL}/#organization`
    },
    inLanguage: 'pt-BR'
  };

  if (breadcrumbs.length > 1) {
    schema.breadcrumb = {
      '@id': `${url}#breadcrumb`
    };
  }

  return schema;
};
