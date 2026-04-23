import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CalendarDays, Clock, Home } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import BlogArticleCard from '@/components/BlogArticleCard.jsx';
import ArticleComments from '@/components/blog/ArticleComments.jsx';
import ArticleCoverImage from '@/components/blog/ArticleCoverImage.jsx';
import BlogArticleSkeleton from '@/components/blog/BlogArticleSkeleton.jsx';
import { AdSlotHorizontal, AdSlotInline, AdSlotResponsive } from '@/components/blog/AdSlot.jsx';
import SuperSimInlineCTA from '@/components/affiliates/SuperSimInlineCTA.jsx';
import SuperSimSidebarCard from '@/components/affiliates/SuperSimSidebarCard.jsx';
import { portalApi } from '@/platform/services/portalApi.js';
import { affiliateRedirectService } from '@/platform/services/affiliateRedirectService.js';
import { useAffiliatePlacements } from '@/hooks/useAffiliatePlacements.js';
import {
  buildArticleToc,
  getArticleCategoryKey,
  getArticleImage,
  getArticlePath,
  getArticleParagraphs,
  getArticleSummary,
  getEditorialTitle,
  normalizeArticleData,
  resolveArticleBySlug
} from '@/lib/content/articles.js';
import { getSupersimOffer, SUPERSIM_TARGET_ARTICLE_PATHS } from '@/lib/supersim.js';
import { normalizeMojibake, normalizeMojibakeDeep } from '@/lib/textEncoding.js';

const BLOG_BASE_URL = 'https://www.cotejuros.com.br/blog';
const SITE_LOGO_URL = 'https://www.cotejuros.com.br/assets/logo/logo-current-site.svg';

const formatDate = (date) =>
  new Date(date).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

const toFaqSchema = (article) => {
  if (!Array.isArray(article?.faq) || !article.faq.length) return null;

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: article.faq.map((item) => ({
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

const normalizeIntentText = (value = '') =>
  String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

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

function BlogArticlePage({ articleSlugOverride = '' }) {
  const t = normalizeMojibake;
  const { articleSlug } = useParams();
  const resolvedSlug = articleSlugOverride || articleSlug;
  const [articles, setArticles] = useState([]);
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setLoadError('');

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
        setArticle(safeArticle || null);
      })
      .catch((error) => {
        console.error('[blog-article-page] erro ao carregar artigo', error);
        if (!active) return;
        setLoadError(normalizeMojibake('Não foi possível carregar este artigo agora.'));
        setArticles([]);
        setArticle(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [resolvedSlug]);

  const safeArticle = useMemo(() => (article ? normalizeMojibakeDeep(normalizeArticleData(article)) : null), [article]);
  const affiliatePlacements = useAffiliatePlacements({
    pageSlug: safeArticle?.routePath || '',
    productType: 'loan'
  });
  const shouldShowSupersimCtas = Boolean(safeArticle?.routePath && SUPERSIM_TARGET_ARTICLE_PATHS.includes(safeArticle.routePath));
  const introSupersimOffer = shouldShowSupersimCtas ? getSupersimOffer(affiliatePlacements.below_hero || []) : null;
  const midSupersimOffer = shouldShowSupersimCtas ? getSupersimOffer(affiliatePlacements.mid_content || []) : null;
  const faqSupersimOffer = shouldShowSupersimCtas ? getSupersimOffer(affiliatePlacements.before_faq || []) : null;
  const sidebarSupersimOffer = shouldShowSupersimCtas ? getSupersimOffer(affiliatePlacements.sidebar || []) : null;
  const categoryRoute = useMemo(
    () => (safeArticle ? getCategoryRoute(safeArticle) : { path: '/blog', label: 'Blog' }),
    [safeArticle]
  );
  const conversionCta = useMemo(
    () => (safeArticle ? getArticleConversionCta(safeArticle, categoryRoute) : null),
    [safeArticle, categoryRoute]
  );
  const tocItems = useMemo(() => (safeArticle ? buildArticleToc(safeArticle) : []), [safeArticle]);

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

  if (loading) {
    return <BlogArticleSkeleton />;
  }

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
  const socialImage = getArticleImage(safeArticle);
  const faqSchema = toFaqSchema(safeArticle);
  const introParagraphs = getArticleParagraphs(safeArticle);
  const sections = Array.isArray(safeArticle.sections) ? safeArticle.sections : [];
  const midSectionIndex = sections.length > 2 ? Math.ceil(sections.length / 2) - 1 : -1;
  const showPreConclusionAd = Boolean((Array.isArray(safeArticle.faq) && safeArticle.faq.length) || (Array.isArray(safeArticle.conclusion) && safeArticle.conclusion.length));

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
        <script type="application/ld+json">{JSON.stringify(articleSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>
        {faqSchema ? <script type="application/ld+json">{JSON.stringify(faqSchema)}</script> : null}
      </Helmet>

      <section className="blog-article-hero border-b border-border bg-background py-6 md:py-10">
        <div className="page-shell min-w-0 space-y-5 md:space-y-6">
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

          <div className="blog-article-header space-y-4 md:space-y-5">
            <Badge variant="outline" className="w-fit">{safeArticle.category}</Badge>
            <div className="blog-article-headline space-y-3">
              <h1 className="blog-article-title max-w-4xl text-3xl leading-tight text-foreground sm:text-4xl lg:text-5xl">{safeArticle.h1 || editorialTitle}</h1>
              <p className="blog-article-summary max-w-3xl text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">{getArticleSummary(safeArticle)}</p>
            </div>
          </div>

          <div className="blog-article-meta flex flex-wrap gap-x-5 gap-y-3 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-2">
              <CalendarDays className="blog-meta-icon h-4 w-4" />
              {formatDate(safeArticle.publishedAt)}
            </span>
            <span className="inline-flex items-center gap-2">
              <Clock className="blog-meta-icon h-4 w-4" />
              {safeArticle.readingTime || safeArticle.readTime || 6} min de leitura
            </span>
            <span>{safeArticle.author}</span>
            <Link to={categoryRoute.path} className="blog-inline-link inline-flex items-center gap-2 hover:underline">
              Mais em {categoryRoute.label}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="blog-article-cover-grid grid min-w-0 gap-5 pt-2">
            <ArticleCoverImage
              article={safeArticle}
              className="blog-article-cover min-w-0 w-full max-h-[430px] rounded-[18px] border border-border md:rounded-[20px]"
              aspectRatio="16 / 9"
            />
          </div>
        </div>
      </section>

      <section className="blog-article-page bg-background py-6 md:py-10">
        <div className="page-shell min-w-0 space-y-8">
          <div className="blog-article-layout grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-8">
            <div className="min-w-0 space-y-6 md:space-y-8">
              <article className="blog-article-body-card min-w-0 rounded-[18px] border border-border bg-white p-4 sm:p-6 md:rounded-[20px] md:p-10">
                <div className="blog-article-richtext space-y-7 md:space-y-8">
                  {introParagraphs.map((paragraph, index) => (
                    <p key={`intro-${index}`} className="text-base leading-7 text-muted-foreground sm:leading-8 md:text-lg">{paragraph}</p>
                  ))}

                  {introSupersimOffer ? (
                    <SuperSimInlineCTA
                      offer={introSupersimOffer}
                      title={t('Se você quer comparar uma opção online, vale olhar a SuperSim')}
                      onSelect={(offer) => handleAffiliateClick(offer, 'below_hero')}
                    />
                  ) : null}

                  <AdSlotResponsive />

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
                        {section.paragraphs?.map((paragraph, paragraphIndex) => (
                          <p key={`section-${index}-p-${paragraphIndex}`} className="text-base leading-7 text-muted-foreground sm:leading-8 md:text-lg">
                            {paragraph}
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

                      {index === midSectionIndex ? <AdSlotInline /> : null}
                      {index === midSectionIndex && midSupersimOffer ? (
                        <SuperSimInlineCTA
                          offer={midSupersimOffer}
                          title={t('A SuperSim entra aqui como próxima etapa natural da leitura')}
                          onSelect={(offer) => handleAffiliateClick(offer, 'mid_content')}
                        />
                      ) : null}
                    </React.Fragment>
                  ))}

                  {safeArticle.internalLinks.length ? (
                    <section className="blog-article-link-grid min-w-0 rounded-[18px] border border-border bg-background-secondary p-4 sm:p-5 md:p-6">
                      <h2 className="text-xl text-foreground sm:text-2xl">Leituras recomendadas</h2>
                      <div className="blog-article-chip-grid mt-4 grid gap-3 sm:grid-cols-2">
                        {safeArticle.internalLinks.slice(0, 6).map((item) => (
                          <Link
                            key={item.path}
                            to={item.path}
                            className="blog-article-chip-link min-w-0 rounded-[14px] border border-border bg-white px-4 py-4 text-sm leading-6 text-foreground transition-colors"
                          >
                            <span className="block break-words font-semibold">{item.title}</span>
                            <span className="mt-1 block text-muted-foreground">{item.anchor}</span>
                          </Link>
                        ))}
                      </div>
                    </section>
                  ) : null}

                  {showPreConclusionAd ? <AdSlotHorizontal /> : null}

                  {faqSupersimOffer ? (
                    <SuperSimInlineCTA
                      offer={faqSupersimOffer}
                      title={t('Antes da FAQ, você pode continuar a pesquisa com a SuperSim')}
                      onSelect={(offer) => handleAffiliateClick(offer, 'before_faq')}
                    />
                  ) : null}

                  {Array.isArray(safeArticle.faq) && safeArticle.faq.length ? (
                    <section id="faq" className="blog-article-faq min-w-0 scroll-mt-28 space-y-4 rounded-[16px] border border-border bg-background-secondary p-4 sm:p-5 md:p-6">
                      <h2 className="text-xl text-foreground sm:text-2xl">Perguntas frequentes</h2>
                      <div className="space-y-5">
                        {safeArticle.faq.map((item, index) => (
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
                        <p key={`conclusion-${index}`} className="text-base leading-7 text-muted-foreground sm:leading-8 md:text-lg">{paragraph}</p>
                      ))}
                    </section>
                  ) : null}
                </div>
              </article>

              <section className="blog-article-conversion min-w-0 rounded-[22px] p-5 sm:p-6 md:p-8">
                <p className="blog-kicker text-sm font-semibold uppercase tracking-[0.2em]">{conversionCta?.eyebrow || t('Próximo passo')}</p>
                <h2 className="mt-3 text-xl text-foreground sm:text-2xl">{conversionCta?.title || t('Quer dar o próximo passo com mais clareza?')}</h2>
                <p className="mt-3 max-w-3xl text-base leading-7 text-muted-foreground">
                  {conversionCta?.description}
                </p>
                <div className="blog-article-conversion-actions mt-4 flex flex-col gap-3 border-t border-[#E5E7EB] pt-6 sm:flex-row sm:flex-wrap">
                  <Link to={conversionCta?.primary.to || '/emprestimos'} className="inline-flex w-full sm:w-auto">
                    <Button className="w-full sm:w-auto">
                      {conversionCta?.primary.label || t('Ver minhas opções agora')}
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
              <section className="blog-article-sidebar-card min-w-0 rounded-[18px] border border-border bg-white p-5 md:p-6">
                <h2 className="text-xl text-foreground">Continue a leitura</h2>
                <div className="mt-4 space-y-3">
                  {sidebarReading.map((item) => (
                    <Link
                      key={`sidebar-reading-${item.title}`}
                      to={item.path}
                      className="blog-article-jump-link block min-w-0 rounded-[14px] border border-border bg-background-secondary px-4 py-4 text-sm transition-colors"
                    >
                      <span className="block break-words font-semibold text-foreground">{item.title}</span>
                      <span className="mt-1 block leading-6 text-muted-foreground">{item.description}</span>
                    </Link>
                  ))}
                </div>
              </section>
              {sidebarSupersimOffer ? (
                <SuperSimSidebarCard
                  offer={sidebarSupersimOffer}
                  onSelect={(offer) => handleAffiliateClick(offer, 'sidebar')}
                />
              ) : null}
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
