import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CalendarDays, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import BlogArticleCard from '@/components/BlogArticleCard.jsx';
import { portalApi } from '@/platform/services/portalApi.js';
import {
  buildArticleToc,
  findArticleBySlug,
  getArticleCategoryKey,
  getArticleImage,
  getArticleParagraphs,
  getArticleSummary,
  getEditorialTitle,
  normalizeArticleSlug
} from '@/lib/content/articles.js';

const fallbackThumbnail =
  'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1600&q=80';

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

const CATEGORY_ROUTES = [
  { match: 'emprest', path: '/emprestimos', label: 'Empréstimos' },
  { match: 'cart', path: '/cartoes-de-credito', label: 'Cartões de crédito' },
  { match: 'score', path: '/educacao-financeira', label: 'Score de crédito' },
  { match: 'financi', path: '/financiamento', label: 'Financiamento' },
  { match: 'divid', path: '/juros-abusivos', label: 'Dívidas e renegociação' },
  { match: 'educ', path: '/educacao-financeira', label: 'Educação financeira' },
  { match: 'organiz', path: '/educacao-financeira', label: 'Organização financeira' }
];

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
        const fallbackMatch = findArticleBySlug(articleList, articleSlug);

        setArticles(articleList);
        setArticle(articleData || fallbackMatch || null);
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

    return articles
      .filter((item) => normalizeArticleSlug(item) !== normalizeArticleSlug(article))
      .sort((a, b) => {
        const categoryA = getArticleCategoryKey(a).includes(currentCategory) ? 1 : 0;
        const categoryB = getArticleCategoryKey(b).includes(currentCategory) ? 1 : 0;
        if (categoryA !== categoryB) return categoryB - categoryA;
        return new Date(b.publishDate) - new Date(a.publishDate);
      })
      .slice(0, 4);
  }, [article, articles]);

  const orderedArticles = useMemo(
    () => [...articles].sort((a, b) => new Date(a.publishDate) - new Date(b.publishDate)),
    [articles]
  );

  const currentIndex = useMemo(
    () => orderedArticles.findIndex((item) => normalizeArticleSlug(item) === normalizeArticleSlug(article || { slug: articleSlug })),
    [orderedArticles, article, articleSlug]
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

  const editorialTitle = getEditorialTitle(article);
  const canonicalUrl = article.canonicalUrl || `https://www.cotejuros.com.br/blog/${normalizeArticleSlug(article)}`;
  const faqSchema = toFaqSchema(article);
  const introParagraphs = getArticleParagraphs(article);

  return (
    <>
      <Helmet>
        <title>{article.seoTitle || `${editorialTitle} | Blog Cote Juros`}</title>
        <meta name="description" content={article.metaDescription || getArticleSummary(article)} />
        <link rel="canonical" href={canonicalUrl} />
        {faqSchema ? <script type="application/ld+json">{JSON.stringify(faqSchema)}</script> : null}
      </Helmet>

      <section className="border-b border-border bg-background py-10 md:py-12">
        <div className="page-shell space-y-6">
          <Link to="/blog" className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline">
            <ArrowLeft className="h-4 w-4" />
            Voltar para o blog
          </Link>

          <Badge variant="outline" className="w-fit">{article.category}</Badge>

          <div className="space-y-4">
            <h1 className="max-w-4xl text-foreground">{article.h1 || editorialTitle}</h1>
            <p className="max-w-3xl text-lg leading-8 text-muted-foreground">{getArticleSummary(article)}</p>
          </div>

          <div className="flex flex-wrap gap-5 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-primary" />
              {formatDate(article.publishDate)}
            </span>
            <span className="inline-flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              {article.readTime || 6} min de leitura
            </span>
            <Link to={categoryRoute.path} className="inline-flex items-center gap-2 text-primary hover:underline">
              Mais em {categoryRoute.label}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-background py-8 md:py-10">
        <div className="page-shell space-y-8">
          <div className="overflow-hidden rounded-[20px] border border-border bg-white">
            <img src={getArticleImage(article, fallbackThumbnail)} alt={editorialTitle} className="h-full max-h-[460px] w-full object-cover" />
          </div>

          <article className="rounded-[20px] border border-border bg-white p-6 md:p-10">
            <div className="space-y-7">
              {introParagraphs.map((paragraph, index) => (
                <p key={`intro-${index}`} className="text-base leading-8 text-muted-foreground md:text-lg">{paragraph}</p>
              ))}

              {Array.isArray(article.sections)
                ? article.sections.map((section, index) => (
                  <section key={`section-${index}`} id={`secao-${index + 1}`} className="scroll-mt-28 space-y-4">
                    <h2 className="text-2xl text-foreground">{section.heading}</h2>
                    {section.paragraphs?.map((paragraph, paragraphIndex) => (
                      <p key={`section-${index}-p-${paragraphIndex}`} className="text-base leading-8 text-muted-foreground md:text-lg">
                        {paragraph}
                      </p>
                    ))}
                    {section.bullets?.length ? (
                      <ul className="space-y-2 pl-5 text-base leading-7 text-muted-foreground marker:text-primary">
                        {section.bullets.map((bullet, bulletIndex) => (
                          <li key={`section-${index}-b-${bulletIndex}`} className="pl-1">{bullet}</li>
                        ))}
                      </ul>
                    ) : null}
                  </section>
                ))
                : null}

              {Array.isArray(article.faq) && article.faq.length ? (
                <section id="faq" className="scroll-mt-28 space-y-4 rounded-[16px] border border-border bg-background-secondary p-5 md:p-6">
                  <h2 className="text-2xl text-foreground">Perguntas frequentes</h2>
                  <div className="space-y-5">
                    {article.faq.map((item, index) => (
                      <div key={`faq-${index}`} className="space-y-2">
                        <h3 className="text-lg text-foreground">{item.question}</h3>
                        <p className="text-base leading-7 text-muted-foreground">{item.answer}</p>
                      </div>
                    ))}
                  </div>
                </section>
              ) : null}

              {Array.isArray(article.conclusion) && article.conclusion.length ? (
                <section id="conclusao" className="scroll-mt-28 space-y-4">
                  <h2 className="text-2xl text-foreground">Conclusão</h2>
                  {article.conclusion.map((paragraph, index) => (
                    <p key={`conclusion-${index}`} className="text-base leading-8 text-muted-foreground md:text-lg">{paragraph}</p>
                  ))}
                </section>
              ) : null}

              {tocItems.length >= 3 ? (
                <section className="space-y-3 border-t border-border pt-6">
                  <h2 className="text-2xl text-foreground">Neste artigo</h2>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {tocItems.map((item) => (
                      <a key={item.id} href={`#${item.id}`} className="rounded-[12px] border border-border px-4 py-3 text-sm text-foreground hover:border-primary/35 hover:bg-primary/[0.03]">
                        {item.label}
                      </a>
                    ))}
                  </div>
                </section>
              ) : null}
            </div>
          </article>

          <section className="rounded-[22px] border border-primary/15 bg-primary/[0.04] p-6 md:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary/80">Diagnóstico financeiro</p>
            <h2 className="mt-3 text-2xl text-foreground">Quer saber o melhor próximo passo para o seu caso?</h2>
            <p className="mt-3 max-w-3xl text-base leading-7 text-muted-foreground">
              Faça um diagnóstico gratuito e receba orientações práticas para organizar sua vida financeira antes de contratar crédito.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <a href="https://finance.cotejuros.com.br/quiz" className="inline-flex">
                <Button>
                  Ir para o diagnóstico
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </a>
              <Link to="/ferramentas" className="inline-flex">
                <Button variant="outline">Ver simuladores</Button>
              </Link>
            </div>
          </section>

          {(previousArticle || nextArticle) ? (
            <section className="grid gap-4 md:grid-cols-2">
              {previousArticle ? (
                <Link
                  to={`/blog/${normalizeArticleSlug(previousArticle)}`}
                  className="rounded-[16px] border border-border bg-white p-5 transition-colors hover:border-primary/35 hover:bg-primary/[0.02]"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Artigo anterior</p>
                  <h3 className="mt-2 text-lg text-foreground">{getEditorialTitle(previousArticle)}</h3>
                </Link>
              ) : (
                <div />
              )}

              {nextArticle ? (
                <Link
                  to={`/blog/${normalizeArticleSlug(nextArticle)}`}
                  className="rounded-[16px] border border-border bg-white p-5 text-left transition-colors hover:border-primary/35 hover:bg-primary/[0.02]"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Próximo artigo</p>
                  <h3 className="mt-2 text-lg text-foreground">{getEditorialTitle(nextArticle)}</h3>
                </Link>
              ) : null}
            </section>
          ) : null}
        </div>
      </section>

      {relatedArticles.length ? (
        <section className="border-t border-border bg-background-secondary py-12 md:py-14">
          <div className="page-shell space-y-6">
            <h2 className="text-2xl text-foreground">Artigos relacionados</h2>
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
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

