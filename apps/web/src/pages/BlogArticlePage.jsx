import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CalendarDays, Clock, ExternalLink, User } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AdSpace, ADSENSE_SLOT_IDS } from '@/components/AdSpace.jsx';
import { portalApi } from '@/platform/services/portalApi.js';
import { getArticleImage, getArticleSummary, normalizeArticleSlug } from '@/lib/content/articles.js';

const fallbackThumbnail = 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1600&q=80';

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

function BlogArticlePage() {
  const { articleSlug } = useParams();
  const [articles, setArticles] = useState([]);
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([portalApi.getArticles({ sort: 'recent' }), portalApi.getArticleBySlug(articleSlug)])
      .then(([items, articleData]) => {
        setArticles(Array.isArray(items) ? items : []);
        setArticle(articleData ? { ...articleData, author: articleData.author || 'Equipe Cote Juros' } : null);
      })
      .finally(() => setLoading(false));
  }, [articleSlug]);

  const relatedArticles = useMemo(() => {
    if (!article) return [];
    return articles
      .filter((item) => normalizeArticleSlug(item) !== normalizeArticleSlug(article))
      .sort((a, b) => {
        const aSameCategory = a.category === article.category ? 1 : 0;
        const bSameCategory = b.category === article.category ? 1 : 0;
        if (aSameCategory !== bSameCategory) return bSameCategory - aSameCategory;
        return new Date(b.publishDate) - new Date(a.publishDate);
      })
      .slice(0, 4);
  }, [article, articles]);

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
            <h1 className="text-3xl">Artigo não encontrado</h1>
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

      <section className="relative overflow-hidden border-b border-border bg-gradient-to-b from-slate-950 via-slate-900 to-slate-900 py-16 md:py-20">
        <div className="pointer-events-none absolute inset-0 hero-tech-grid opacity-40" />
        <div className="page-shell relative z-10">
          <Link to="/blog" className="mb-6 inline-flex items-center gap-2 text-sm text-slate-300 transition-colors hover:text-white">
            <ArrowLeft className="h-4 w-4" />
            Voltar para o blog
          </Link>

          <Badge variant="outline" className="mb-5 border-white/20 bg-white/10 text-white">
            {article.category}
          </Badge>

          <h1 className="max-w-4xl text-white">{article.h1 || article.title}</h1>
          <p className="mt-5 max-w-3xl text-lg text-slate-300">{getArticleSummary(article)}</p>

          <div className="mt-7 flex flex-wrap gap-5 text-sm text-slate-300">
            <span className="inline-flex items-center gap-2">
              <User className="h-4 w-4 text-sky-300" />
              {article.author}
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

      <section className="bg-background py-12 md:py-14">
        <div className="page-shell grid gap-10 lg:grid-cols-[1fr_300px]">
          <article className="min-w-0">
            <div className="mb-8 overflow-hidden rounded-[18px] border border-border bg-white">
              <img src={getArticleImage(article, fallbackThumbnail)} alt={article.title} className="h-full max-h-[460px] w-full object-cover" />
            </div>

            <Card className="border-border bg-white">
              <CardContent className="space-y-8 p-7 md:p-10">
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
                    <section key={section.heading} className="space-y-4">
                      <h2 className="text-2xl text-foreground">{section.heading}</h2>
                      {section.paragraphs?.map((paragraph, paragraphIndex) => (
                        <p key={`${section.heading}-${paragraphIndex}`} className="text-base leading-8 text-muted-foreground md:text-lg">
                          {paragraph}
                        </p>
                      ))}
                      {section.bullets?.length ? (
                        <ul className="space-y-3 pl-5 text-base text-muted-foreground marker:text-primary">
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
                  <section className="space-y-4 rounded-[18px] border border-border bg-background-secondary p-6 md:p-8">
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
                  <section className="space-y-4">
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
                    <div className="mt-5">
                      <a href={article.cta.href} className="inline-flex">
                        <Button>
                          {article.cta.label}
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </a>
                    </div>
                  </section>
                ) : null}

                {Array.isArray(article.internalLinks) && article.internalLinks.length ? (
                  <section className="space-y-4 border-t border-border pt-6">
                    <h2 className="text-2xl text-foreground">Leituras relacionadas</h2>
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

                <AdSpace height="150px" adSlot={ADSENSE_SLOT_IDS.articleFooter} />
              </CardContent>
            </Card>
          </article>

          <aside className="space-y-6 lg:sticky lg:top-24 lg:h-fit">
            <AdSpace height="320px" adSlot={ADSENSE_SLOT_IDS.sidebar} />

            <Card className="border-border bg-white">
              <CardContent className="space-y-3 p-6">
                <h3 className="text-xl">Continue sua leitura</h3>
                <p className="text-sm text-muted-foreground">
                  Veja comparadores, simuladores e guias práticos para decidir com mais clareza antes de contratar crédito.
                </p>
                <Link to="/ferramentas">
                  <Button variant="outline" className="w-full">Abrir ferramentas</Button>
                </Link>
              </CardContent>
            </Card>
          </aside>
        </div>
      </section>

      {relatedArticles.length ? (
        <section className="border-t border-border bg-background-secondary py-16">
          <div className="page-shell">
            <div className="mb-8">
              <h2 className="mb-3">Artigos relacionados</h2>
              <p className="text-muted-foreground">Mais leituras para você continuar sua jornada financeira.</p>
            </div>

            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              {relatedArticles.map((item) => (
                <Card key={item.id} className="surface-card overflow-hidden">
                  <div className="h-40">
                    <img src={getArticleImage(item, fallbackThumbnail)} alt={item.title} className="h-full w-full object-cover" />
                  </div>
                  <CardContent className="flex h-full flex-col gap-4 p-6">
                    <Badge variant="outline" className="w-fit">{item.category}</Badge>
                    <h3 className="text-xl">{item.title}</h3>
                    <p className="line-clamp-3 text-sm text-muted-foreground">{getArticleSummary(item)}</p>
                    <Link to={`/blog/${normalizeArticleSlug(item)}`} className="mt-auto">
                      <Button variant="link" className="px-0 text-primary">Ler artigo</Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}

export default BlogArticlePage;
