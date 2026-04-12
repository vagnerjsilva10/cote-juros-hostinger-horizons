import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CalendarDays, Clock, ExternalLink, Home, User } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from '@/components/ui/breadcrumb.jsx';
import { AdSpace, ADSENSE_SLOT_IDS } from '@/components/AdSpace.jsx';
import BlogArticleCard from '@/components/BlogArticleCard.jsx';
import BlogFeedbackCard from '@/components/BlogFeedbackCard.jsx';
import BlogTableOfContents from '@/components/BlogTableOfContents.jsx';
import { portalApi } from '@/platform/services/portalApi.js';
import { buildArticleToc, getArticleCategoryKey, getArticleImage, getArticleSummary, normalizeArticleSlug } from '@/lib/content/articles.js';

const fallbackThumbnail =
  'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1600&q=80';

const CATEGORY_ROUTES = [
  { match: 'emprest', path: '/emprestimos', label: 'Empréstimos' },
  { match: 'cart', path: '/cartoes-de-credito', label: 'Cartões de crédito' },
  { match: 'score', path: '/educacao-financeira', label: 'Score de crédito' },
  { match: 'financi', path: '/financiamento', label: 'Financiamento' },
  { match: 'divid', path: '/juros-abusivos', label: 'Dívidas e renegociação' },
  { match: 'educ', path: '/educacao-financeira', label: 'Educação financeira' },
  { match: 'organiz', path: '/educacao-financeira', label: 'Organização financeira' }
];

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

const getCategoryRoute = (article) => {
  const key = getArticleCategoryKey(article);
  return CATEGORY_ROUTES.find((item) => key.includes(item.match)) || { path: '/blog', label: article?.category || 'Blog' };
};

function BlogArticlePage() {
  const { articleSlug } = useParams();
  const [articles, setArticles] = useState([]);
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    Promise.all([portalApi.getArticles({ sort: 'recent' }), portalApi.getArticleBySlug(articleSlug)])
      .then(([items, articleData]) => {
        if (!active) return;

        const articleList = Array.isArray(items) ? items : [];
        const listMatch = articleList.find((item) => normalizeArticleSlug(item) === articleSlug);

        setArticles(articleList);
        setArticle(articleData || listMatch || null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [articleSlug]);

  const categoryRoute = useMemo(() => getCategoryRoute(article), [article]);
  const tocItems = useMemo(() => buildArticleToc(article), [article]);

  const relatedArticles = useMemo(() => {
    if (!article) return [];
    const currentCategory = getArticleCategoryKey(article);
    const currentKeywords = new Set(article.keywords || []);

    return articles
      .filter((item) => normalizeArticleSlug(item) !== normalizeArticleSlug(article))
      .sort((a, b) => {
        const aCategoryScore = getArticleCategoryKey(a).includes(currentCategory) ? 2 : 0;
        const bCategoryScore = getArticleCategoryKey(b).includes(currentCategory) ? 2 : 0;
        const aKeywordScore = (a.keywords || []).some((keyword) => currentKeywords.has(keyword)) ? 1 : 0;
        const bKeywordScore = (b.keywords || []).some((keyword) => currentKeywords.has(keyword)) ? 1 : 0;

        if (aCategoryScore !== bCategoryScore) return bCategoryScore - aCategoryScore;
        if (aKeywordScore !== bKeywordScore) return bKeywordScore - aKeywordScore;
        return new Date(b.publishDate) - new Date(a.publishDate);
      })
      .slice(0, 4);
  }, [article, articles]);

  const orderedArticles = useMemo(
    () => [...articles].sort((a, b) => new Date(a.publishDate) - new Date(b.publishDate)),
    [articles]
  );

  const currentIndex = useMemo(
    () => orderedArticles.findIndex((item) => normalizeArticleSlug(item) === articleSlug),
    [orderedArticles, articleSlug]
  );

  const previousArticle = currentIndex > 0 ? orderedArticles[currentIndex - 1] : null;
  const nextArticle = currentIndex >= 0 && currentIndex < orderedArticles.length - 1 ? orderedArticles[currentIndex + 1] : null;

  if (loading) {
    return (
      <section className="page-shell py-20">
        <p className="text-center text-muted-foreground">Carregando artigo...</p>
      </section>
    );
  }

  if (!article) {
    return (
      <section className="page-shell py-20">
        <Card className="mx-auto max-w-2xl border-border bg-white text-center">
          <CardContent className="space-y-4 p-10">
            <h1 className="text-3xl text-foreground">Artigo não encontrado</h1>
            <p className="text-muted-foreground">Esse conteúdo pode ter sido movido, renomeado ou removido.</p>
            <Link to="/blog">
              <Button>Voltar para o blog</Button>
            </Link>
          </CardContent>
        </Card>
      </section>
    );
  }

  const canonicalUrl = article.canonicalUrl || `https://www.cotejuros.com.br/blog/${normalizeArticleSlug(article)}`;
  const faqSchema = toFaqSchema(article);

  return (
    <>
      <Helmet>
        <title>{article.seoTitle || `${article.title} | Blog Cote Juros`}</title>
        <meta name="description" content={article.metaDescription || getArticleSummary(article)} />
        <link rel="canonical" href={canonicalUrl} />
        {faqSchema ? <script type="application/ld+json">{JSON.stringify(faqSchema)}</script> : null}
      </Helmet>

      <section className="relative overflow-hidden border-b border-border bg-gradient-to-b from-slate-950 via-slate-900 to-slate-900 py-14 md:py-18">
        <div className="pointer-events-none absolute inset-0 hero-tech-grid opacity-40" />
        <div className="page-shell relative z-10 space-y-6">
          <Breadcrumb>
            <BreadcrumbList className="text-slate-300">
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/" className="inline-flex items-center gap-2">
                    <Home className="h-4 w-4" />
                    Início
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/blog">Blog</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to={categoryRoute.path}>{categoryRoute.label}</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{article.title}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <Link to="/blog" className="inline-flex items-center gap-2 text-sm text-slate-300 transition-colors hover:text-white">
            <ArrowLeft className="h-4 w-4" />
            Voltar para o blog
          </Link>

          <Badge variant="outline" className="w-fit border-white/20 bg-white/10 text-white">
            {article.category}
          </Badge>

          <div className="space-y-5">
            <h1 className="max-w-4xl text-white">{article.h1 || article.title}</h1>
            <p className="max-w-3xl text-lg leading-8 text-slate-300">{getArticleSummary(article)}</p>
          </div>

          <div className="flex flex-wrap gap-5 text-sm text-slate-300">
            <span className="inline-flex items-center gap-2">
              <User className="h-4 w-4 text-sky-300" />
              {article.author || 'Equipe Cote Juros'}
            </span>
            <span className="inline-flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-sky-300" />
              {formatDate(article.publishDate)}
            </span>
            <span className="inline-flex items-center gap-2">
              <Clock className="h-4 w-4 text-sky-300" />
              {article.readTime} min de leitura
            </span>
          </div>
        </div>
      </section>

      <section className="bg-background py-10 md:py-12">
        <div className="page-shell grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
          <article className="min-w-0 space-y-8">
            <div className="overflow-hidden rounded-[22px] border border-border bg-white">
              <img src={getArticleImage(article, fallbackThumbnail)} alt={article.title} className="h-full max-h-[460px] w-full object-cover" />
            </div>

            {tocItems.length >= 3 ? (
              <div className="lg:hidden">
                <BlogTableOfContents items={tocItems} />
              </div>
            ) : null}

            <Card className="border-border bg-white">
              <CardContent className="space-y-8 p-6 md:p-10">
                {Array.isArray(article.intro)
                  ? article.intro.map((paragraph, index) => (
                    <React.Fragment key={`intro-${index}`}>
                      <p className="text-base leading-8 text-muted-foreground md:text-lg">{paragraph}</p>
                      {index === 0 ? <AdSpace height="120px" adSlot={ADSENSE_SLOT_IDS.articleTop} /> : null}
                    </React.Fragment>
                  ))
                  : null}

                {Array.isArray(article.sections)
                  ? article.sections.map((section, index) => (
                    <section key={section.heading} id={`secao-${index + 1}`} className="scroll-mt-28 space-y-4">
                      <h2 className="text-2xl text-foreground">{section.heading}</h2>
                      {section.paragraphs?.map((paragraph, paragraphIndex) => (
                        <p key={`${section.heading}-${paragraphIndex}`} className="text-base leading-8 text-muted-foreground md:text-lg">
                          {paragraph}
                        </p>
                      ))}
                      {section.bullets?.length ? (
                        <ul className="space-y-3 pl-5 text-base leading-7 text-muted-foreground marker:text-primary">
                          {section.bullets.map((bullet) => (
                            <li key={bullet} className="pl-1">{bullet}</li>
                          ))}
                        </ul>
                      ) : null}
                      {index === 1 ? <AdSpace height="220px" adSlot={ADSENSE_SLOT_IDS.articleInline} /> : null}
                    </section>
                  ))
                  : null}

                {Array.isArray(article.faq) && article.faq.length ? (
                  <section id="faq" className="scroll-mt-28 space-y-4 rounded-[18px] border border-border bg-background-secondary p-6 md:p-8">
                    <h2 className="text-2xl text-foreground">Perguntas frequentes</h2>
                    <div className="space-y-5">
                      {article.faq.map((item) => (
                        <div key={item.question} className="space-y-2">
                          <h3 className="text-lg text-foreground">{item.question}</h3>
                          <p className="text-base leading-7 text-muted-foreground">{item.answer}</p>
                        </div>
                      ))}
                    </div>
                  </section>
                ) : null}

                {Array.isArray(article.conclusion) ? (
                  <section id="conclusao" className="scroll-mt-28 space-y-4">
                    <h2 className="text-2xl text-foreground">Conclusão</h2>
                    {article.conclusion.map((paragraph, index) => (
                      <p key={`conclusion-${index}`} className="text-base leading-8 text-muted-foreground md:text-lg">{paragraph}</p>
                    ))}
                  </section>
                ) : null}

                {article.cta ? (
                  <section className="rounded-[22px] border border-primary/15 bg-primary/[0.03] p-6 md:p-8">
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary/80">{article.cta.eyebrow}</p>
                    <h2 className="mt-3 text-2xl text-foreground">{article.cta.title}</h2>
                    <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">{article.cta.description}</p>
                    <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                      <a href={article.cta.href} className="inline-flex">
                        <Button>
                          {article.cta.label}
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </a>
                      <Link to="/cote-finance-ai" className="inline-flex">
                        <Button variant="outline">Entender como funciona</Button>
                      </Link>
                    </div>
                  </section>
                ) : null}

                {Array.isArray(article.internalLinks) && article.internalLinks.length ? (
                  <section className="space-y-4 border-t border-border pt-6">
                    <h2 className="text-2xl text-foreground">Continue a leitura</h2>
                    <div className="grid gap-3 md:grid-cols-2">
                      {article.internalLinks.map((item) => (
                        <Link
                          key={`${item.path}-${item.anchor}`}
                          to={item.path}
                          className="rounded-[16px] border border-border bg-background-secondary px-4 py-4 transition-colors hover:border-primary/40 hover:bg-primary/[0.03]"
                        >
                          <p className="text-sm font-medium text-foreground">{item.anchor}</p>
                          <p className="mt-1 text-sm text-muted-foreground">{item.title}</p>
                        </Link>
                      ))}
                    </div>
                  </section>
                ) : null}

                <BlogFeedbackCard />
                <AdSpace height="150px" adSlot={ADSENSE_SLOT_IDS.articleFooter} />
              </CardContent>
            </Card>

            {(previousArticle || nextArticle) ? (
              <section className="grid gap-4 md:grid-cols-2">
                {previousArticle ? (
                  <Link
                    to={`/blog/${normalizeArticleSlug(previousArticle)}`}
                    className="rounded-[20px] border border-border bg-white p-5 transition-colors hover:border-primary/35 hover:bg-primary/[0.02]"
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Artigo anterior</p>
                    <div className="mt-3 flex items-start gap-3">
                      <ArrowLeft className="mt-1 h-4 w-4 text-primary" />
                      <div>
                        <h3 className="text-lg text-foreground">{previousArticle.title}</h3>
                        <p className="mt-1 text-sm text-muted-foreground">{getArticleSummary(previousArticle)}</p>
                      </div>
                    </div>
                  </Link>
                ) : (
                  <div />
                )}

                {nextArticle ? (
                  <Link
                    to={`/blog/${normalizeArticleSlug(nextArticle)}`}
                    className="rounded-[20px] border border-border bg-white p-5 text-left transition-colors hover:border-primary/35 hover:bg-primary/[0.02]"
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Próximo artigo</p>
                    <div className="mt-3 flex items-start gap-3">
                      <div>
                        <h3 className="text-lg text-foreground">{nextArticle.title}</h3>
                        <p className="mt-1 text-sm text-muted-foreground">{getArticleSummary(nextArticle)}</p>
                      </div>
                      <ArrowRight className="mt-1 h-4 w-4 text-primary" />
                    </div>
                  </Link>
                ) : null}
              </section>
            ) : null}
          </article>

          <aside className="space-y-6 lg:sticky lg:top-24 lg:h-fit">
            {tocItems.length >= 3 ? <BlogTableOfContents items={tocItems} /> : null}

            <Card className="border-border bg-white">
              <CardContent className="space-y-4 p-6">
                <h3 className="text-xl text-foreground">Próximos passos</h3>
                <p className="text-sm leading-7 text-muted-foreground">
                  Depois da leitura, você pode aprofundar por categoria, abrir ferramentas de comparação ou fazer um diagnóstico financeiro para entender o seu momento com mais contexto.
                </p>
                <div className="flex flex-col gap-3">
                  <Link to={categoryRoute.path}>
                    <Button variant="outline" className="w-full">Explorar {categoryRoute.label}</Button>
                  </Link>
                  <Link to="/ferramentas">
                    <Button variant="outline" className="w-full">Abrir simuladores e calculadoras</Button>
                  </Link>
                  <a href="https://finance.cotejuros.com.br/quiz">
                    <Button className="w-full">Fazer diagnóstico financeiro</Button>
                  </a>
                </div>
              </CardContent>
            </Card>

            <AdSpace height="320px" adSlot={ADSENSE_SLOT_IDS.sidebar} />
          </aside>
        </div>
      </section>

      {relatedArticles.length ? (
        <section className="border-t border-border bg-background-secondary py-16">
          <div className="page-shell space-y-8">
            <div className="space-y-3">
              <h2>Artigos relacionados</h2>
              <p className="text-muted-foreground">Continue por temas próximos para aprofundar a leitura sem sair do contexto.</p>
            </div>

            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              {relatedArticles.map((item) => (
                <BlogArticleCard
                  key={item.id}
                  article={item}
                  image={getArticleImage(item, fallbackThumbnail)}
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
