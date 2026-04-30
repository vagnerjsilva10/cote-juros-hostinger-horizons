import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CalendarDays, CheckCircle2, Clock, Home, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import BlogArticleCard from '@/components/BlogArticleCard.jsx';
import ArticleComments from '@/components/blog/ArticleComments.jsx';
import { AdSlotHorizontal, AdSlotInline, AdSlotResponsive } from '@/components/blog/AdSlot.jsx';
import SuperSimInlineCTA from '@/components/affiliates/SuperSimInlineCTA.jsx';
import { portalApi } from '@/platform/services/portalApi.js';
import { affiliateRedirectService } from '@/platform/services/affiliateRedirectService.js';
import { useAffiliatePlacements } from '@/hooks/useAffiliatePlacements.js';
import {
  buildArticleToc,
  getArticleCategoryKey,
  getArticleImage,
  getArticleImageCandidates,
  getArticlePath,
  getArticleParagraphs,
  getArticleSummary,
  getEditorialTitle,
  normalizeArticleData,
  resolveArticleBySlug
} from '@/lib/content/articles.js';
import { articlesData } from '@/data/articlesData.js';
import { getSupersimOffer, SUPERSIM_TARGET_ARTICLE_PATHS } from '@/lib/supersim.js';
import { normalizeMojibake, normalizeMojibakeDeep } from '@/lib/textEncoding.js';

const BLOG_BASE_URL = 'https://www.cotejuros.com.br/blog';
const SITE_LOGO_URL = 'https://www.cotejuros.com.br/brand/cote-juros-logo.svg';
const BLOG_HERO_FALLBACK_IMAGE = '/assets/editorial/editorial-credit-life.png';

const formatDate = (date) =>
  new Date(date).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

const buildArticleFaq = (article) => {
  if (Array.isArray(article?.faq) && article.faq.length) return article.faq;

  const title = getEditorialTitle(article) || article?.title || 'este tema';
  const category = article?.category || 'finanças pessoais';

  return [
    {
      question: `${title} vale para qualquer perfil financeiro?`,
      answer: `Depende do momento, da renda, das dívidas atuais e do objetivo. Use o guia como ponto de partida e compare as opções antes de contratar qualquer produto financeiro.`
    },
    {
      question: `O que comparar primeiro em ${category.toLowerCase()}?`,
      answer: 'Comece pelo custo total, prazo, impacto da parcela no orçamento e reputação da instituição. Evite decisões baseadas apenas na menor parcela.'
    },
    {
      question: 'A Cote Juros cobra para mostrar opções?',
      answer: 'Não há cobrança antecipada para consultar conteúdos e caminhos de comparação. A decisão final deve ser tomada com calma e sem compromisso.'
    }
  ];
};

const toFaqSchema = (article) => {
  const faq = buildArticleFaq(article);
  if (!faq.length) return null;

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer
      }
    }))
  };
};

const CATEGORY_ROUTES = normalizeMojibakeDeep([
  { match: 'emprest', path: '/emprestimos', label: 'Empréstimos' },
  { match: 'cart', path: '/cartoes-de-credito', label: 'Cartões de crédito' },
  { match: 'score', path: '/educacao-financeira', label: 'Score de crédito' },
  { match: 'financi', path: '/financiamento', label: 'Financiamento' },
  { match: 'divid', path: '/juros-abusivos', label: 'Dívidas e renegociação' },
  { match: 'educ', path: '/educacao-financeira', label: 'Educação financeira' },
  { match: 'organiz', path: '/educacao-financeira', label: 'Organização financeira' }
]);

const getCategoryRoute = (article) => {
  const key = getArticleCategoryKey(article);
  return CATEGORY_ROUTES.find((item) => key.includes(item.match)) || { path: '/blog', label: article?.category || 'Blog' };
};

const ArticleQualityCta = ({ item }) => {
  if (!item?.to || !item?.label) return null;

  return (
    <section className="blog-article-quality-cta min-w-0 rounded-[16px] border border-[rgba(91,108,255,0.22)] bg-background-secondary p-4 sm:p-5">
      <h2 className="text-lg text-foreground sm:text-xl">{item.title}</h2>
      {item.description ? <p className="mt-2 text-base leading-7 text-muted-foreground">{item.description}</p> : null}
      <Link to={item.to} className="mt-4 inline-flex">
        <Button>
          {item.label}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </Link>
    </section>
  );
};

const BLOG_SIDEBAR_READING = normalizeMojibakeDeep([
  {
    title: 'Melhores bancos para solicitar empréstimo',
    description: 'Compare perfis de crédito antes de assumir um contrato maior.'
  },
  {
    title: 'Calculadora do Cidadão',
    description: 'Use simulações para enxergar melhor juros e parcelas.'
  },
  {
    title: 'Reserva de emergência',
    description: 'Veja por que manter folga financeira é essencial antes de financiar.'
  }
]);

const INTERNAL_LINK_KEYWORDS = normalizeMojibakeDeep([
  { keyword: 'empréstimo pessoal', path: '/emprestimos', label: 'empréstimo pessoal' },
  { keyword: 'empréstimo', path: '/emprestimos', label: 'empréstimo' },
  { keyword: 'crédito', path: '/emprestimos', label: 'crédito' },
  { keyword: 'cartão de crédito', path: '/cartoes', label: 'cartão de crédito' },
  { keyword: 'cartão', path: '/cartoes', label: 'cartão' },
  { keyword: 'score', path: '/blog/score-de-credito-como-funciona', label: 'score' },
  { keyword: 'financiamento', path: '/financiamentos', label: 'financiamento' },
  { keyword: 'dívidas', path: '/blog/como-sair-das-dividas', label: 'dívidas' },
  { keyword: 'juros', path: '/blog/como-comparar-taxas-de-juros', label: 'juros' }
]);

const COMMERCIAL_LINK_LIBRARY = [
  {
    path: '/emprestimos',
    title: 'opções de empréstimo',
    anchor: 'compare opções de empréstimo antes de contratar'
  },
  {
    path: '/cartoes',
    title: 'cartões de crédito',
    anchor: 'compare cartões antes de contratar'
  },
  {
    path: '/financiamentos',
    title: 'opções de financiamento',
    anchor: 'compare opções de financiamento com calma'
  }
];

const EXTERNAL_SOURCE_LIBRARY = {
  bancoCentral: {
    label: 'Banco Central',
    url: 'https://www.bcb.gov.br/'
  },
  serasa: {
    label: 'Serasa',
    url: 'https://www.serasa.com.br/'
  },
  spc: {
    label: 'SPC Brasil',
    url: 'https://www.spcbrasil.org.br/'
  },
  ibge: {
    label: 'IBGE',
    url: 'https://www.ibge.gov.br/'
  }
};

const dedupeLinksByPath = (items = []) => {
  const seen = new Set();
  return items.filter((item) => {
    if (!item?.path || seen.has(item.path)) return false;
    seen.add(item.path);
    return true;
  });
};

const dedupeExternalByUrl = (items = []) => {
  const seen = new Set();
  return items.filter((item) => {
    if (!item?.url || seen.has(item.url)) return false;
    seen.add(item.url);
    return true;
  });
};

const normalizeIntentText = (value = '') =>
  String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

const tokenizeEditorialText = (value = '') =>
  normalizeIntentText(value)
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length > 2);

const getCommercialLinkCandidates = (article) => {
  const intent = normalizeIntentText([
    article?.title,
    article?.h1,
    article?.category,
    article?.summary,
    article?.excerpt,
    ...(article?.tags || [])
  ].join(' '));

  if (/(cart|anuidade|limite|cashback|milha|fatura|rotativo)/.test(intent)) {
    return [
      COMMERCIAL_LINK_LIBRARY[1],
      COMMERCIAL_LINK_LIBRARY[0],
      COMMERCIAL_LINK_LIBRARY[2]
    ];
  }

  if (/(financ|veiculo|imovel|entrada|sac|price|parcela do carro|carro)/.test(intent)) {
    return [
      COMMERCIAL_LINK_LIBRARY[2],
      COMMERCIAL_LINK_LIBRARY[0],
      COMMERCIAL_LINK_LIBRARY[1]
    ];
  }

  return [
    COMMERCIAL_LINK_LIBRARY[0],
    COMMERCIAL_LINK_LIBRARY[2],
    COMMERCIAL_LINK_LIBRARY[1]
  ];
};

const getExternalAuthorityLinks = (article) => {
  const intent = normalizeIntentText([
    article?.title,
    article?.h1,
    article?.category,
    article?.summary,
    article?.excerpt,
    ...(article?.tags || [])
  ].join(' '));

  if (/(score|negativado|cpf|cadastro|restricao|serasa|spc)/.test(intent)) {
    return [
      EXTERNAL_SOURCE_LIBRARY.serasa,
      EXTERNAL_SOURCE_LIBRARY.spc,
      EXTERNAL_SOURCE_LIBRARY.bancoCentral
    ];
  }

  if (/(reserva|orcamento|renda|familia|planejamento|organizacao|gastos)/.test(intent)) {
    return [
      EXTERNAL_SOURCE_LIBRARY.ibge,
      EXTERNAL_SOURCE_LIBRARY.bancoCentral
    ];
  }

  return [
    EXTERNAL_SOURCE_LIBRARY.bancoCentral,
    EXTERNAL_SOURCE_LIBRARY.ibge
  ];
};

const getSemanticArticleLinks = (article, articles, count = 6) => {
  const baseTokens = new Set(
    tokenizeEditorialText([
      article?.title,
      article?.h1,
      article?.category,
      article?.summary,
      ...(article?.tags || [])
    ].join(' '))
  );

  const currentCategory = getArticleCategoryKey(article);

  return (Array.isArray(articles) ? articles : [])
    .map((item) => normalizeArticleData(item))
    .filter((candidate) => candidate.slug !== article.slug)
    .map((candidate) => {
      const candidateTokens = tokenizeEditorialText([
        candidate.title,
        candidate.h1,
        candidate.category,
        candidate.summary,
        ...(candidate.tags || [])
      ].join(' '));

      const sharedTokens = candidateTokens.filter((token) => baseTokens.has(token)).length;
      const sameCategory = getArticleCategoryKey(candidate) === currentCategory ? 1 : 0;
      const sharedTags = (candidate.tags || []).filter((tag) =>
        (article.tags || []).some((ownTag) => normalizeIntentText(ownTag) === normalizeIntentText(tag))
      ).length;

      return {
        candidate,
        score: sharedTokens * 2 + sharedTags * 4 + sameCategory * 8
      };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return new Date(b.candidate.publishedAt) - new Date(a.candidate.publishedAt);
    })
    .slice(0, count)
    .map(({ candidate }) => ({
      path: getArticlePath(candidate),
      title: getEditorialTitle(candidate),
      anchor: getArticleSummary(candidate)
    }));
};

const getArticleConversionCta = (article, categoryRoute) => {
  const intent = normalizeIntentText([
    article?.title,
    article?.h1,
    article?.slug,
    article?.category,
    article?.summary,
    article?.excerpt
  ].filter(Boolean).join(' '));

  if (/(organiz|orcamento|controle financeiro|educacao financeira|diagnostico financeiro|planejamento financeiro)/.test(intent)) {
    return normalizeMojibakeDeep({
      eyebrow: 'Próximo passo',
      title: 'Quer organizar melhor seu dinheiro antes de decidir?',
      description: 'Se este conteúdo falou mais sobre rotina, planejamento ou controle, o Cote Finance pode ajudar você a enxergar seu mês com mais clareza.',
      primary: { to: '/cote-finance-ai', label: 'Conhecer o Cote Finance' },
      secondary: { to: categoryRoute.path, label: 'Ver conteúdo relacionado' }
    });
  }

  if (/(golpe|fraude|juros abusivos|divida|renegoci|contest)/.test(intent)) {
    return normalizeMojibakeDeep({
      eyebrow: 'Antes de decidir',
      title: 'Compare caminhos possíveis com calma',
      description: 'Quando o assunto envolve dívida, golpe ou cobrança confusa, vale respirar, comparar alternativas e evitar promessas fáceis.',
      primary: { to: '/emprestimos', label: 'Ver opções com calma' },
      secondary: { to: categoryRoute.path, label: 'Continuar lendo sobre o tema' }
    });
  }

  return normalizeMojibakeDeep({
    eyebrow: 'Próximo passo',
    title: 'Quer ver opções que combinam com seu perfil?',
    description: 'Se este conteúdo ajudou, agora você pode ver caminhos de crédito que podem fazer sentido para o seu momento, sem promessa falsa e sem cobrança antecipada.',
    primary: { to: '/emprestimos', label: 'Ver minhas opções agora' },
    secondary: { to: categoryRoute.path, label: 'Ver página relacionada' }
  });
};

const buildInlineLinkMoments = ({ internalLinks = [], externalLinks = [] }) => {
  const [firstInternal, secondInternal, thirdInternal, fourthInternal, fifthInternal, sixthInternal] = internalLinks;
  const [firstExternal, secondExternal, thirdExternal] = externalLinks;

  return {
    opening: firstInternal && secondInternal
      ? {
        internal: [firstInternal, secondInternal],
        external: firstExternal ? [firstExternal] : []
      }
      : null,
    middle: thirdInternal || fourthInternal || secondExternal
      ? {
        internal: [thirdInternal, fourthInternal].filter(Boolean),
        external: secondExternal ? [secondExternal] : []
      }
      : null,
    closing: fifthInternal || sixthInternal || thirdExternal
      ? {
        internal: [fifthInternal, sixthInternal].filter(Boolean),
        external: thirdExternal ? [thirdExternal] : []
      }
      : null
  };
};

export const injectInternalLinks = (content, usedKeywords = new Set()) => {
  const text = String(content || '');
  if (!text) return text;

  const normalizedText = normalizeIntentText(text);
  const match = INTERNAL_LINK_KEYWORDS.find((item) => {
    const normalizedKeyword = normalizeIntentText(item.keyword);
    return !usedKeywords.has(normalizedKeyword) && normalizedText.includes(normalizedKeyword);
  });

  if (!match) return text;

  const normalizedKeyword = normalizeIntentText(match.keyword);
  const pattern = new RegExp(`(${match.keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'i');
  const parts = text.split(pattern);
  if (parts.length < 3) return text;

  usedKeywords.add(normalizedKeyword);

  return parts.map((part, index) => {
    if (index === 1) {
      return (
        <Link key={`${match.path}-${normalizedKeyword}`} to={match.path} className="blog-inline-link font-medium hover:underline">
          {part}
        </Link>
      );
    }

    return part;
  });
};

const InContentAd = ({ position, className = '' }) => {
  if (position === 'after-second-paragraph') {
    return <AdSlotResponsive className={className} />;
  }

  if (position === 'mid-article') {
    return <AdSlotInline className={className} />;
  }

  return <AdSlotHorizontal className={className} />;
};

const BlogHeroImage = ({ article, title }) => {
  const imageSet = useMemo(() => getArticleImageCandidates(article), [article]);
  const [srcIndex, setSrcIndex] = useState(0);
  const sources = useMemo(() => [imageSet.primary, ...imageSet.fallbacks, BLOG_HERO_FALLBACK_IMAGE].filter(Boolean), [imageSet]);
  const currentSrc = sources[srcIndex] || BLOG_HERO_FALLBACK_IMAGE;

  useEffect(() => {
    setSrcIndex(0);
  }, [imageSet.primary]);

  return (
    <img
      src={currentSrc}
      alt={article?.coverImageAlt || article?.imageAlt || title}
      loading="lazy"
      decoding="async"
      width="1200"
      height="630"
      onError={() => setSrcIndex((current) => Math.min(current + 1, sources.length - 1))}
    />
  );
};

function BlogArticlePage({ articleSlugOverride = '' }) {
  const t = normalizeMojibake;
  const { articleSlug } = useParams();
  const resolvedSlug = articleSlugOverride || articleSlug;
  const localArticles = useMemo(() => articlesData.map((item) => normalizeArticleData(item)), []);
  const localArticle = useMemo(
    () => resolveArticleBySlug({ slug: resolvedSlug, articles: localArticles }),
    [resolvedSlug, localArticles]
  );
  const [articles, setArticles] = useState(localArticles);
  const [article, setArticle] = useState(localArticle);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    let active = true;
    setLoadError('');
    setArticles(localArticles);
    setArticle(localArticle);

    Promise.all([portalApi.getArticles({ sort: 'recent' }), portalApi.getArticleBySlug(resolvedSlug)])
      .then(([items, articleData]) => {
        if (!active) return;

        const articleList = Array.isArray(items) ? items.map((item) => normalizeArticleData(item)) : [];
        const safeArticle = resolveArticleBySlug({
          slug: resolvedSlug,
          directArticle: articleData,
          articles: articleList
        });

        setArticles(articleList);
        setArticle(safeArticle || localArticle || null);
      })
      .catch((error) => {
        console.error('[blog-article-page] erro ao carregar artigo', error);
        if (!active) return;
        setLoadError(normalizeMojibake('Não foi possível carregar este artigo agora.'));
        setArticles(localArticles);
        setArticle(localArticle || null);
      });

    return () => {
      active = false;
    };
  }, [resolvedSlug, localArticle, localArticles]);

  const safeArticle = useMemo(() => (article ? normalizeMojibakeDeep(normalizeArticleData(article)) : null), [article]);
  const affiliatePlacements = useAffiliatePlacements({
    pageSlug: safeArticle?.routePath || '',
    productType: 'loan'
  });
  const shouldShowSupersimCtas = Boolean(safeArticle?.routePath && SUPERSIM_TARGET_ARTICLE_PATHS.includes(safeArticle.routePath));
  const introSupersimOffer = shouldShowSupersimCtas ? getSupersimOffer(affiliatePlacements.below_hero || []) : null;
  const midSupersimOffer = shouldShowSupersimCtas ? getSupersimOffer(affiliatePlacements.mid_content || []) : null;
  const faqSupersimOffer = shouldShowSupersimCtas ? getSupersimOffer(affiliatePlacements.before_faq || []) : null;
  const categoryRoute = useMemo(
    () => (safeArticle ? getCategoryRoute(safeArticle) : { path: '/blog', label: 'Blog' }),
    [safeArticle]
  );
  const conversionCta = useMemo(
    () => (safeArticle ? getArticleConversionCta(safeArticle, categoryRoute) : null),
    [safeArticle, categoryRoute]
  );
  const tocItems = useMemo(() => {
    if (!safeArticle) return [];

    const items = buildArticleToc(safeArticle);
    if (!items.some((item) => item.id === 'faq') && buildArticleFaq(safeArticle).length) {
      const conclusionIndex = items.findIndex((item) => item.id === 'conclusao');
      const faqItem = { id: 'faq', label: 'Perguntas frequentes' };
      if (conclusionIndex >= 0) {
        return [...items.slice(0, conclusionIndex), faqItem, ...items.slice(conclusionIndex)];
      }
      return [...items, faqItem];
    }

    return items;
  }, [safeArticle]);

  const relatedArticles = useMemo(() => {
    if (!safeArticle) return [];

    const currentCategory = getArticleCategoryKey(safeArticle);

    return articles
      .filter((item) => item.slug !== safeArticle.slug)
      .sort((a, b) => {
        const categoryA = getArticleCategoryKey(a).includes(currentCategory) ? 1 : 0;
        const categoryB = getArticleCategoryKey(b).includes(currentCategory) ? 1 : 0;
        if (categoryA !== categoryB) return categoryB - categoryA;
        return new Date(b.publishedAt) - new Date(a.publishedAt);
      })
      .slice(0, 3);
  }, [safeArticle, articles]);

  const commercialLinks = useMemo(
    () => (safeArticle ? getCommercialLinkCandidates(safeArticle) : []),
    [safeArticle]
  );

  const semanticArticleLinks = useMemo(
    () => (safeArticle ? getSemanticArticleLinks(safeArticle, articles, 6) : []),
    [safeArticle, articles]
  );

  const authorityInternalLinks = useMemo(() => {
    if (!safeArticle) return [];

    return dedupeLinksByPath([
      ...(safeArticle.internalLinks || []),
      ...commercialLinks,
      ...semanticArticleLinks
    ]).slice(0, 6);
  }, [safeArticle, commercialLinks, semanticArticleLinks]);

  const continueExploringLinks = useMemo(
    () => semanticArticleLinks.slice(0, 3),
    [semanticArticleLinks]
  );

  const externalAuthorityLinks = useMemo(
    () => (
      safeArticle
        ? dedupeExternalByUrl([
          ...(Array.isArray(safeArticle.externalLinks) ? safeArticle.externalLinks : []),
          ...getExternalAuthorityLinks(safeArticle)
        ]).slice(0, 3)
        : []
    ),
    [safeArticle]
  );

  const inlineLinkMoments = useMemo(
    () => buildInlineLinkMoments({
      internalLinks: authorityInternalLinks,
      externalLinks: externalAuthorityLinks
    }),
    [authorityInternalLinks, externalAuthorityLinks]
  );

  const sidebarReading = useMemo(() => {
    const findPath = (title) => {
      const lookup = normalizeIntentText(title);
      const matchedArticle = articles.find((item) => {
        const candidate = normalizeIntentText(getEditorialTitle(normalizeArticleData(item)));
        return candidate.includes(lookup);
      });

      return matchedArticle ? getArticlePath(normalizeArticleData(matchedArticle)) : '/blog';
    };

    return BLOG_SIDEBAR_READING.map((item) => ({
      ...item,
      path: findPath(item.title)
    }));
  }, [articles]);

  const orderedArticles = useMemo(
    () => [...articles].sort((a, b) => new Date(a.publishedAt) - new Date(b.publishedAt)),
    [articles]
  );

  const currentIndex = useMemo(
    () => orderedArticles.findIndex((item) => item.slug === (safeArticle?.slug || resolvedSlug)),
    [orderedArticles, safeArticle, resolvedSlug]
  );

  const previousArticle = currentIndex > 0 ? orderedArticles[currentIndex - 1] : null;
  const nextArticle = currentIndex >= 0 && currentIndex < orderedArticles.length - 1 ? orderedArticles[currentIndex + 1] : null;

  const handleAffiliateClick = async (offer, position) => {
    if (!offer || !safeArticle?.routePath) return;

    try {
      const result = await affiliateRedirectService.create({
        offerSlug: offer.offerSlug,
        pageSlug: safeArticle.routePath,
        position
      });

      if (result?.redirectUrl) {
        window.location.href = result.redirectUrl;
      }
    } catch {
      // keep article reading resilient
    }
  };

  if (!safeArticle) {
    return (
      <section className="page-shell py-20">
        <Card className="mx-auto max-w-2xl border-border bg-white text-center">
          <CardContent className="space-y-4 p-10">
            <p className="blog-kicker text-xs font-semibold uppercase tracking-[0.2em]">Blog Cote Juros</p>
            <h1 className="text-3xl text-foreground">{t('Artigo não encontrado')}</h1>
            <p className="text-muted-foreground">{loadError || t('Esse conteúdo pode ter sido movido, renomeado ou removido.')}</p>
            <Link to="/blog">
              <Button>Voltar para o blog</Button>
            </Link>
          </CardContent>
        </Card>
      </section>
    );
  }

  const editorialTitle = getEditorialTitle(safeArticle);
  const canonicalUrl = safeArticle.canonicalUrl || `https://www.cotejuros.com.br${getArticlePath(safeArticle)}/`;
  const socialImage = safeArticle.ogImage || getArticleImage(safeArticle);
  const faqSchema = toFaqSchema(safeArticle);
  const introParagraphs = getArticleParagraphs(safeArticle);
  const sections = Array.isArray(safeArticle.sections) ? safeArticle.sections : [];
  const faqItems = buildArticleFaq(safeArticle);
  const usedInternalLinkKeywords = new Set();
  const renderLinkedText = (paragraph) => injectInternalLinks(paragraph, usedInternalLinkKeywords);
  const articleCtas = Array.isArray(safeArticle.ctas) ? safeArticle.ctas : [];
  const introCta = articleCtas.find((item) => item.position === 'after_intro') || articleCtas[0];
  const middleCta = articleCtas.find((item) => item.position === 'middle') || articleCtas[1];
  const closingCta = articleCtas.find((item) => item.position === 'before_conclusion') || articleCtas[2];
  const midSectionIndex = sections.length > 2 ? Math.ceil(sections.length / 2) - 1 : -1;
  const showPreConclusionAd = Boolean(faqItems.length || (Array.isArray(safeArticle.conclusion) && safeArticle.conclusion.length));
  const webStory = safeArticle.distribution?.webStory;
  const webStoryUrl = webStory?.url || (webStory?.path ? `https://api.cotejuros.com.br${webStory.path}` : '');

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: t('Início'), item: 'https://www.cotejuros.com.br/' },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: BLOG_BASE_URL },
      { '@type': 'ListItem', position: 3, name: editorialTitle, item: canonicalUrl }
    ]
  };

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: safeArticle.metaTitle || editorialTitle,
    description: safeArticle.metaDescription || getArticleSummary(safeArticle),
    image: [socialImage],
    datePublished: safeArticle.publishedAt,
    dateModified: safeArticle.updatedAt,
    mainEntityOfPage: canonicalUrl,
    author: {
      '@type': 'Person',
      name: safeArticle.author
    },
    publisher: {
      '@type': 'Organization',
      name: 'Cote Juros',
      logo: {
        '@type': 'ImageObject',
        url: SITE_LOGO_URL
      }
    },
    articleSection: safeArticle.category,
    keywords: safeArticle.tags.join(', ')
  };

  return (
    <>
      <Helmet>
        <title>{safeArticle.metaTitle || safeArticle.seoTitle || `${editorialTitle} | Blog Cote Juros`}</title>
        <meta name="description" content={safeArticle.metaDescription || getArticleSummary(safeArticle)} />
        <meta name="robots" content="index,follow,max-image-preview:large" />
        <meta property="og:type" content="article" />
        <meta property="og:title" content={safeArticle.metaTitle || editorialTitle} />
        <meta property="og:description" content={safeArticle.metaDescription || getArticleSummary(safeArticle)} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:image" content={socialImage} />
        <meta property="article:published_time" content={safeArticle.publishedAt} />
        <meta property="article:modified_time" content={safeArticle.updatedAt} />
        <meta property="article:author" content={safeArticle.author} />
        <meta property="article:section" content={safeArticle.category} />
        {safeArticle.tags.slice(0, 8).map((tag) => (
          <meta key={tag} property="article:tag" content={tag} />
        ))}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={safeArticle.metaTitle || editorialTitle} />
        <meta name="twitter:description" content={safeArticle.metaDescription || getArticleSummary(safeArticle)} />
        <meta name="twitter:image" content={socialImage} />
        <link rel="canonical" href={canonicalUrl} />
        {webStoryUrl ? <link rel="amphtml" href={webStoryUrl} /> : null}
        <script type="application/ld+json">{JSON.stringify(articleSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>
        {faqSchema ? <script type="application/ld+json">{JSON.stringify(faqSchema)}</script> : null}
      </Helmet>

      <section className="blog-article-hero border-b border-border bg-background py-5 md:py-6">
        <div className="page-shell min-w-0 space-y-5">
          <nav aria-label="Breadcrumb" className="blog-article-breadcrumb flex min-w-0 flex-wrap items-center gap-2 text-xs text-muted-foreground sm:text-sm">
            <Link to="/" className="inline-flex items-center gap-1 hover:text-foreground">
              <Home className="h-4 w-4" />
              {t('Início')}
            </Link>
            <span>/</span>
            <Link to="/blog" className="hover:text-foreground">
              Blog
            </Link>
            <span>/</span>
            <span className="min-w-0 flex-1 truncate text-foreground sm:flex-none">{editorialTitle}</span>
          </nav>

          <Link to="/blog" className="blog-article-backlink inline-flex items-center gap-2 text-sm font-medium hover:underline">
            <ArrowLeft className="h-4 w-4" />
            Voltar para o blog
          </Link>

          <div className="blog-hero">
            <BlogHeroImage article={safeArticle} title={safeArticle.h1 || editorialTitle} />
            <div className="blog-hero-overlay" />
            <div className="blog-hero-content">
              <span className="blog-hero-category">{safeArticle.category || 'Educação Financeira'}</span>
              <h1 className="blog-article-title">{safeArticle.h1 || editorialTitle}</h1>
              <p className="blog-article-summary">{getArticleSummary(safeArticle)}</p>
              <p className="blog-hero-meta">
                <span className="inline-flex items-center gap-2">
                  <CalendarDays className="h-4 w-4" />
                  Atualizado em {formatDate(safeArticle.updatedAt || safeArticle.publishedAt)}
                </span>
                <span>{safeArticle.author}</span>
                <span className="inline-flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  {safeArticle.readingTime || safeArticle.readTime || 6} min de leitura
                </span>
              </p>
            </div>
          </div>

          {safeArticle.imageAttribution?.label ? (
            <p className="text-sm leading-6 text-muted-foreground">
              {safeArticle.imageAttribution.label}{' '}
              <a
                href={safeArticle.imageAttribution.url || 'https://www.freepik.com'}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="blog-inline-link font-medium hover:underline"
              >
                {safeArticle.imageAttribution.sourceName || 'Freepik'}
              </a>
            </p>
          ) : null}
        </div>
      </section>

      <section className="blog-article-page bg-background py-6 md:py-10">
        <div className="page-shell min-w-0 space-y-8">
          <div className="blog-article-layout grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-8">
            <div className="min-w-0 space-y-6 md:space-y-8">
              <article className="blog-article-body-card min-w-0 rounded-[18px] border border-border bg-white p-4 sm:p-6 md:rounded-[20px] md:p-10">
                <div className="blog-article-richtext space-y-7 md:space-y-8">
                  {introParagraphs.map((paragraph, index) => (
                    <React.Fragment key={`intro-${index}`}>
                      <p className="text-base leading-7 text-muted-foreground sm:leading-8 md:text-lg">{renderLinkedText(paragraph)}</p>
                      {index === 1 ? <InContentAd position="after-second-paragraph" /> : null}
                    </React.Fragment>
                  ))}

                  {safeArticle.featuredSnippet ? (
                    <section className="blog-article-featured-snippet min-w-0 border-l-4 border-primary bg-background-secondary px-4 py-4 sm:px-5">
                      <p className="blog-kicker text-xs font-semibold uppercase tracking-[0.18em]">Resposta rápida</p>
                      <p className="mt-2 text-base leading-7 text-foreground sm:text-lg">{safeArticle.featuredSnippet}</p>
                    </section>
                  ) : null}

                  <ArticleQualityCta item={introCta} />

                  {inlineLinkMoments.opening ? (
                    <p className="text-base leading-7 text-muted-foreground sm:leading-8 md:text-lg">
                      Se você quer transformar essa leitura em decisão prática, vale{' '}
                      <Link to={inlineLinkMoments.opening.internal[0].path} className="blog-inline-link font-medium hover:underline">
                        {inlineLinkMoments.opening.internal[0].anchor}
                      </Link>
                      {' '}e também entender{' '}
                      <Link to={inlineLinkMoments.opening.internal[1].path} className="blog-inline-link font-medium hover:underline">
                        {inlineLinkMoments.opening.internal[1].title}
                      </Link>{' '}
                      enquanto você confere a leitura com dados do{' '}
                      {inlineLinkMoments.opening.external.length ? (
                        <a
                          href={inlineLinkMoments.opening.external[0].url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="blog-inline-link font-medium hover:underline"
                        >
                          {inlineLinkMoments.opening.external[0].label}
                        </a>
                      ) : null}
                      .
                    </p>
                  ) : null}

                  {false && externalAuthorityLinks.length ? (
                    <p className="text-base leading-7 text-muted-foreground sm:leading-8 md:text-lg">
                      Para confrontar o tema com referências confiáveis, vale consultar{' '}
                      {externalAuthorityLinks.map((item, index) => (
                        <React.Fragment key={item.url}>
                          {index > 0 ? (index === externalAuthorityLinks.length - 1 ? ' e ' : ', ') : null}
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="blog-inline-link font-medium hover:underline"
                          >
                            {item.label}
                          </a>
                        </React.Fragment>
                      ))}
                      .
                    </p>
                  ) : null}

                  {introSupersimOffer ? (
                    <SuperSimInlineCTA
                      offer={introSupersimOffer}
                      title={t('Se você quer comparar uma opção online, vale olhar a SuperSim')}
                      onSelect={(offer) => handleAffiliateClick(offer, 'below_hero')}
                    />
                  ) : null}

                  {tocItems.length ? (
                    <section className="blog-article-toc min-w-0 rounded-[18px] border border-border bg-background-secondary p-4 sm:p-5 md:p-6">
                      <p className="blog-kicker text-sm font-semibold uppercase tracking-[0.18em]">{t('Neste artigo você vai encontrar')}</p>
                      <div className="blog-article-chip-grid mt-4 grid gap-3 sm:grid-cols-2">
                        {tocItems.slice(0, 6).map((item) => (
                          <a
                            key={item.id}
                            href={`#${item.id}`}
                            className="blog-article-chip-link min-w-0 rounded-[14px] border border-border bg-white px-4 py-4 text-sm leading-6 text-foreground transition-colors"
                          >
                            {item.label}
                          </a>
                        ))}
                      </div>
                    </section>
                  ) : null}

                  {sections.map((section, index) => (
                    <React.Fragment key={`section-${index}`}>
                      <section id={`secao-${index + 1}`} className="blog-article-section min-w-0 scroll-mt-28 space-y-4 md:space-y-5">
                        <h2 className="text-xl leading-tight text-foreground sm:text-2xl">{section.heading}</h2>
                        {section.subheading ? (
                          <p className="max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">
                            {section.subheading}
                          </p>
                        ) : null}
                        {section.paragraphs?.map((paragraph, paragraphIndex) => (
                          <p key={`section-${index}-p-${paragraphIndex}`} className="text-base leading-7 text-muted-foreground sm:leading-8 md:text-lg">
                            {renderLinkedText(paragraph)}
                          </p>
                        ))}
                        {section.bullets?.length ? (
                          <ul className="blog-article-list list-disc space-y-2 pl-6 text-base leading-7 text-muted-foreground sm:leading-8">
                            {section.bullets.map((bullet, bulletIndex) => (
                              <li key={`section-${index}-b-${bulletIndex}`} className="pl-1">{bullet}</li>
                            ))}
                          </ul>
                        ) : null}
                      </section>

                      {index === midSectionIndex ? <InContentAd position="mid-article" /> : null}
                      {index === midSectionIndex && safeArticle.example ? (
                        <section className="blog-article-example min-w-0 rounded-[16px] border border-border bg-background-secondary p-4 sm:p-5">
                          <h2 className="text-xl text-foreground sm:text-2xl">Exemplo com números</h2>
                          <p className="mt-3 text-base leading-7 text-muted-foreground sm:leading-8 md:text-lg">{safeArticle.example}</p>
                        </section>
                      ) : null}
                      {index === midSectionIndex && safeArticle.alert ? (
                        <section className="blog-article-alert min-w-0 rounded-[16px] border border-amber-200 bg-amber-50 p-4 text-amber-950 sm:p-5">
                          <h2 className="text-xl sm:text-2xl">Atenção</h2>
                          <p className="mt-3 text-base leading-7">{safeArticle.alert}</p>
                        </section>
                      ) : null}
                      {index === midSectionIndex && safeArticle.midQuestions?.length ? (
                        <section className="blog-article-mid-questions min-w-0 space-y-4">
                          {safeArticle.midQuestions.map((item, questionIndex) => (
                            <div key={`mid-question-${questionIndex}`} className="space-y-2">
                              <h2 className="text-xl text-foreground sm:text-2xl">{item.question}</h2>
                              <p className="text-base leading-7 text-muted-foreground sm:leading-8 md:text-lg">{item.answer}</p>
                            </div>
                          ))}
                        </section>
                      ) : null}
                      {index === midSectionIndex ? <ArticleQualityCta item={middleCta} /> : null}
                      {index === midSectionIndex && inlineLinkMoments.middle ? (
                        <p className="text-base leading-7 text-muted-foreground sm:leading-8 md:text-lg">
                          Para aprofundar a comparação sem sair do contexto, veja também{' '}
                          {inlineLinkMoments.middle.internal.map((item, itemIndex) => (
                            <React.Fragment key={item.path}>
                              {itemIndex > 0 ? (itemIndex === inlineLinkMoments.middle.internal.length - 1 ? ' e ' : ', ') : null}
                              <Link to={item.path} className="blog-inline-link font-medium hover:underline">
                                {itemIndex === 0 ? item.title : item.anchor}
                              </Link>
                            </React.Fragment>
                          ))}
                          {inlineLinkMoments.middle.external.length ? (
                            <>
                              {' '}e cruzar esses pontos com a base do{' '}
                              <a
                                href={inlineLinkMoments.middle.external[0].url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="blog-inline-link font-medium hover:underline"
                              >
                                {inlineLinkMoments.middle.external[0].label}
                              </a>
                            </>
                          ) : null}
                          .
                        </p>
                      ) : null}
                      {index === midSectionIndex && midSupersimOffer ? (
                        <SuperSimInlineCTA
                          offer={midSupersimOffer}
                          title={t('A SuperSim entra aqui como próxima etapa natural da leitura')}
                          onSelect={(offer) => handleAffiliateClick(offer, 'mid_content')}
                        />
                      ) : null}
                    </React.Fragment>
                  ))}

                  {authorityInternalLinks.length ? (
                    <section className="blog-article-link-grid min-w-0 rounded-[18px] border border-border bg-background-secondary p-4 sm:p-5 md:p-6">
                      <h2 className="text-xl text-foreground sm:text-2xl">Artigos relacionados</h2>
                      <div className="blog-article-chip-grid mt-4 grid gap-3 sm:grid-cols-2">
                        {authorityInternalLinks.map((item) => {
                          const isCommercial = COMMERCIAL_LINK_LIBRARY.some((commercial) => commercial.path === item.path);
                          const cardNode = (
                            <>
                              <h3 className="block break-words font-semibold text-foreground">{item.title}</h3>
                              <span className="mt-1 block text-muted-foreground">{item.anchor}</span>
                            </>
                          );

                          return isCommercial ? (
                            <Link
                              key={item.path}
                              to={item.path}
                              className="blog-article-chip-link min-w-0 rounded-[14px] border border-border bg-white px-4 py-4 text-sm leading-6 text-foreground transition-colors"
                            >
                              {cardNode}
                            </Link>
                          ) : (
                            <Link
                              key={item.path}
                              to={item.path}
                              className="blog-article-chip-link min-w-0 rounded-[14px] border border-border bg-white px-4 py-4 text-sm leading-6 text-foreground transition-colors"
                            >
                              {cardNode}
                            </Link>
                          );
                        })}
                      </div>
                    </section>
                  ) : null}

                  {inlineLinkMoments.closing ? (
                    <p className="text-base leading-7 text-muted-foreground sm:leading-8 md:text-lg">
                      Antes de fechar a leitura, ainda vale passar por{' '}
                      {inlineLinkMoments.closing.internal.map((item, index) => (
                        <React.Fragment key={item.path}>
                          {index > 0 ? (index === inlineLinkMoments.closing.internal.length - 1 ? ' e ' : ', ') : null}
                          <Link to={item.path} className="blog-inline-link font-medium hover:underline">
                            {index === 0 ? item.title : item.anchor}
                          </Link>
                        </React.Fragment>
                      ))}
                      {inlineLinkMoments.closing.external.length ? (
                        <>
                          {' '}além de conferir a referência do{' '}
                          <a
                            href={inlineLinkMoments.closing.external[0].url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="blog-inline-link font-medium hover:underline"
                          >
                            {inlineLinkMoments.closing.external[0].label}
                          </a>
                        </>
                      ) : null}
                      .
                    </p>
                  ) : null}

                  {safeArticle.financialImpact?.length ? (
                    <section className="blog-article-impact min-w-0 scroll-mt-28 space-y-4">
                      <h2 className="text-xl text-foreground sm:text-2xl">Impacto financeiro</h2>
                      <ul className="blog-article-list list-disc space-y-2 pl-6 text-base leading-7 text-muted-foreground sm:leading-8">
                        {safeArticle.financialImpact.map((item, index) => (
                          <li key={`impact-${index}`} className="pl-1">{item}</li>
                        ))}
                      </ul>
                    </section>
                  ) : null}

                  {safeArticle.alternatives?.length ? (
                    <section className="blog-article-alternatives min-w-0 scroll-mt-28 space-y-4">
                      <h2 className="text-xl text-foreground sm:text-2xl">Alternativas antes de contratar</h2>
                      <ul className="blog-article-list list-disc space-y-2 pl-6 text-base leading-7 text-muted-foreground sm:leading-8">
                        {safeArticle.alternatives.map((item, index) => (
                          <li key={`alternative-${index}`} className="pl-1">{item}</li>
                        ))}
                      </ul>
                    </section>
                  ) : null}

                  <ArticleQualityCta item={closingCta} />

                  {faqSupersimOffer ? (
                    <SuperSimInlineCTA
                      offer={faqSupersimOffer}
                      title={t('Antes da FAQ, você pode continuar a pesquisa com a SuperSim')}
                      onSelect={(offer) => handleAffiliateClick(offer, 'before_faq')}
                    />
                  ) : null}

                  {faqItems.length ? (
                    <section id="faq" className="blog-article-faq min-w-0 scroll-mt-28 space-y-4 rounded-[16px] border border-border bg-background-secondary p-4 sm:p-5 md:p-6">
                      <h2 className="text-xl text-foreground sm:text-2xl">Perguntas frequentes</h2>
                      <div className="space-y-5">
                        {faqItems.map((item, index) => (
                          <div key={`faq-${index}`} className="space-y-2">
                            <h3 className="text-lg text-foreground">{item.question}</h3>
                            <p className="text-base leading-7 text-muted-foreground">{item.answer}</p>
                          </div>
                        ))}
                      </div>
                    </section>
                  ) : null}

                  {Array.isArray(safeArticle.conclusion) && safeArticle.conclusion.length ? (
                    <section id="conclusao" className="blog-article-conclusion scroll-mt-28 space-y-4">
                      <h2 className="text-xl text-foreground sm:text-2xl">{t('Conclusão')}</h2>
                      {safeArticle.conclusion.map((paragraph, index) => (
                        <p key={`conclusion-${index}`} className="text-base leading-7 text-muted-foreground sm:leading-8 md:text-lg">{renderLinkedText(paragraph)}</p>
                      ))}
                    </section>
                  ) : null}

                  {continueExploringLinks.length ? (
                    <section className="blog-article-link-grid min-w-0 rounded-[18px] border border-border bg-background-secondary p-4 sm:p-5 md:p-6">
                      <h2 className="text-xl text-foreground sm:text-2xl">Continue explorando</h2>
                      <div className="blog-article-chip-grid mt-4 grid gap-3 sm:grid-cols-2">
                        {continueExploringLinks.map((item) => (
                          <Link
                            key={`continue-${item.path}`}
                            to={item.path}
                            className="blog-article-chip-link min-w-0 rounded-[14px] border border-border bg-white px-4 py-4 text-sm leading-6 text-foreground transition-colors"
                          >
                            <h3 className="block break-words font-semibold text-foreground">{item.title}</h3>
                            <span className="mt-1 block text-muted-foreground">{item.anchor}</span>
                          </Link>
                        ))}
                      </div>
                    </section>
                  ) : null}

                  {showPreConclusionAd ? <InContentAd position="article-end" /> : null}
                </div>
              </article>

              <section className="blog-article-conversion min-w-0 rounded-[22px] p-5 sm:p-6 md:p-8">
                <p className="blog-kicker text-sm font-semibold uppercase tracking-[0.2em]">{conversionCta?.eyebrow || t('Próximo passo')}</p>
                <h2 className="mt-3 text-xl text-foreground sm:text-2xl">Veja opções de crédito que fazem sentido para você</h2>
                <p className="mt-3 max-w-3xl text-base leading-7 text-muted-foreground">
                  {conversionCta?.description || 'Compare alternativas com clareza antes de tomar qualquer decisão.'}
                </p>
                <div className="mt-4 grid gap-2 text-sm font-medium text-foreground sm:grid-cols-2">
                  <span className="inline-flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    Sem cobrança antecipada
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    Sem compromisso
                  </span>
                </div>
                <div className="blog-article-conversion-actions mt-4 flex flex-col gap-3 border-t border-[#E5E7EB] pt-6 sm:flex-row sm:flex-wrap">
                  <Link to={conversionCta?.primary.to || '/emprestimos'} className="inline-flex w-full sm:w-auto">
                    <Button className="w-full sm:w-auto">
                      VER MINHAS OPÇÕES AGORA
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link to={conversionCta?.secondary.to || categoryRoute.path} className="inline-flex w-full sm:w-auto">
                    <Button variant="outline" className="w-full sm:w-auto">{conversionCta?.secondary.label || t('Ver página relacionada')}</Button>
                  </Link>
                </div>
              </section>

              {(previousArticle || nextArticle) ? (
                <section className="blog-article-pagination grid min-w-0 gap-4 md:grid-cols-2">
                  {previousArticle ? (
                    <Link
                      to={getArticlePath(previousArticle)}
                      className="blog-article-pagination-link min-w-0 rounded-[16px] border border-border bg-white p-5 transition-colors"
                    >
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Artigo anterior</p>
                      <h3 className="mt-2 text-lg text-foreground">{getEditorialTitle(previousArticle)}</h3>
                    </Link>
                  ) : (
                    <div className="hidden md:block" />
                  )}

                  {nextArticle ? (
                    <Link
                      to={getArticlePath(nextArticle)}
                      className="blog-article-pagination-link min-w-0 rounded-[16px] border border-border bg-white p-5 text-left transition-colors"
                    >
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{t('Próximo artigo')}</p>
                      <h3 className="mt-2 text-lg text-foreground">{getEditorialTitle(nextArticle)}</h3>
                    </Link>
                  ) : null}
                </section>
              ) : null}

              <ArticleComments articleSlug={safeArticle.slug} />
            </div>

            <aside className="blog-article-sidebar min-w-0 space-y-6 lg:sticky lg:top-24 lg:h-fit">
              <section className="blog-article-sidebar-card blog-article-sidebar-card--primary min-w-0 rounded-[18px] border border-border bg-white p-5 md:p-6">
                <p className="blog-kicker text-xs font-semibold uppercase tracking-[0.18em]">Crédito com clareza</p>
                <h2 className="mt-2 text-xl text-foreground">Veja opções de crédito para seu perfil</h2>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  Compare caminhos possíveis sem cobrança antecipada e avance só quando fizer sentido.
                </p>
                <Link to="/emprestimos" className="mt-5 inline-flex w-full">
                  <Button className="w-full">
                    Ver minhas opções
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </section>

              <section className="blog-article-sidebar-card min-w-0 rounded-[18px] border border-border bg-white p-5 md:p-6">
                <h2 className="text-xl text-foreground">Artigos populares</h2>
                <div className="mt-4 space-y-3">
                  {(semanticArticleLinks.length ? semanticArticleLinks.slice(0, 3) : sidebarReading).map((item) => (
                    <Link
                      key={`sidebar-reading-${item.path || item.title}`}
                      to={item.path}
                      className="blog-article-jump-link block min-w-0 rounded-[14px] border border-border bg-background-secondary px-4 py-4 text-sm transition-colors"
                    >
                      <span className="block break-words font-semibold text-foreground">{item.title}</span>
                      <span className="mt-1 block leading-6 text-muted-foreground">{item.anchor || item.description}</span>
                    </Link>
                  ))}
                </div>
              </section>

              <section className="blog-article-sidebar-card min-w-0 rounded-[18px] border border-border bg-white p-5 md:p-6">
                <div className="flex items-start gap-3">
                  <span className="blog-sidebar-mail-icon inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full">
                    <Mail className="h-5 w-5" />
                  </span>
                  <div>
                    <h2 className="text-xl text-foreground">Receba dicas financeiras</h2>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">Um resumo prático para comparar melhor crédito, cartões e organização financeira.</p>
                  </div>
                </div>
                <form className="mt-5 space-y-3">
                  <label className="sr-only" htmlFor="blog-sidebar-email">Email</label>
                  <input
                    id="blog-sidebar-email"
                    type="email"
                    placeholder="seu@email.com"
                    className="blog-sidebar-input w-full rounded-[10px] border border-border bg-background px-4 py-3 text-sm outline-none"
                  />
                  <Button type="button" variant="outline" className="w-full">Quero receber</Button>
                </form>
              </section>

              <AdSlotResponsive />
            </aside>
          </div>
        </div>
      </section>

      {relatedArticles.length ? (
        <section className="blog-article-related border-t border-border bg-background-secondary py-12 md:py-14">
          <div className="page-shell min-w-0 space-y-6">
            <div className="space-y-2">
              <p className="blog-kicker text-xs font-semibold uppercase tracking-[0.18em]">{t('Leia também')}</p>
              <h2 className="text-2xl text-foreground">{t('Mais conteúdos sobre o mesmo assunto')}</h2>
            </div>
            <div className="grid min-w-0 gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {relatedArticles.map((item) => (
                <BlogArticleCard
                  key={item.slug}
                  article={item}
                  formatDate={formatDate}
                  compact
                />
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}

export default BlogArticlePage;


