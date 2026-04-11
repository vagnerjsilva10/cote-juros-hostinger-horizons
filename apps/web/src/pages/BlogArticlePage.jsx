import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CalendarDays, Clock, User } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AdSpace } from '@/components/AdSpace.jsx';
import { portalApi } from '@/platform/services/portalApi.js';
import { getBlogEditorialPage } from '@/seo/seoCatalog.js';

const CATEGORY_THUMBNAILS = {
  emprestimos: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=1600&q=80',
  cartoes: 'https://images.unsplash.com/photo-1601597111158-2fceff292cdc?auto=format&fit=crop&w=1600&q=80',
  financas: 'https://images.unsplash.com/photo-1553729459-efe14ef6055d?auto=format&fit=crop&w=1600&q=80',
  score: 'https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=1600&q=80',
  financiamento: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1600&q=80'
};

const fallbackThumbnail = 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1600&q=80';

const normalize = (value = '') =>
  String(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

const slugify = (value = '') =>
  normalize(value)
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

const resolveArticleSlug = (article) => slugify(article?.slug || article?.title || article?.id || 'artigo');

const resolveArticleImage = (article) => {
  if (article?.image && String(article.image).trim().length > 0) return article.image;

  const categoryKey = normalize(article?.category || '');
  if (categoryKey.includes('emprest')) return CATEGORY_THUMBNAILS.emprestimos;
  if (categoryKey.includes('cart')) return CATEGORY_THUMBNAILS.cartoes;
  if (categoryKey.includes('finan') && !categoryKey.includes('financi')) return CATEGORY_THUMBNAILS.financas;
  if (categoryKey.includes('score')) return CATEGORY_THUMBNAILS.score;
  if (categoryKey.includes('financi')) return CATEGORY_THUMBNAILS.financiamento;

  return fallbackThumbnail;
};

const formatDate = (date) =>
  new Date(date).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

function BlogArticlePage() {
  const { articleSlug } = useParams();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    portalApi
      .getArticles({ sort: 'recent' })
      .then((items) => setArticles(Array.isArray(items) ? items : []))
      .finally(() => setLoading(false));
  }, []);

  const article = useMemo(() => {
    const fromList = articles.find((item) => resolveArticleSlug(item) === articleSlug);
    if (fromList) {
      return {
        ...fromList,
        author: fromList.author || 'Equipe Cote Juros',
        source: 'editorial'
      };
    }

    const fromSeo = getBlogEditorialPage(`/blog/${articleSlug}`);
    if (!fromSeo) return null;

    const content = Array.isArray(fromSeo.body) ? fromSeo.body.join('\n\n') : '';
    const words = content.split(/\s+/).filter(Boolean).length;

    return {
      id: `seo-${articleSlug}`,
      title: fromSeo.heading,
      summary: fromSeo.description,
      content,
      category: fromSeo.articleCategory || 'Editorial',
      readTime: Math.max(4, Math.round(words / 220)),
      publishDate: new Date().toISOString(),
      image: fallbackThumbnail,
      author: 'Equipe Cote Juros',
      slug: articleSlug,
      source: 'seo'
    };
  }, [articles, articleSlug]);

  const paragraphs = useMemo(() => {
    if (!article?.content) return [];
    return String(article.content)
      .split(/\n+/)
      .map((item) => item.trim())
      .filter(Boolean);
  }, [article]);

  const relatedArticles = useMemo(() => {
    if (!article) return [];

    const currentSlug = resolveArticleSlug(article);
    return articles
      .filter((item) => resolveArticleSlug(item) !== currentSlug)
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
            <p className="text-muted-foreground">Esse conteúdo pode ter sido movido ou removido.</p>
            <Link to="/blog">
              <Button>Voltar para o blog</Button>
            </Link>
          </CardContent>
        </Card>
      </section>
    );
  }

  const canonicalPath = `/blog/${resolveArticleSlug(article)}`;

  return (
    <>
      <Helmet>
        <title>{`${article.title} | Blog Cote Juros`}</title>
        <meta name="description" content={article.summary || 'Guia financeiro completo do Cote Juros.'} />
        <link rel="canonical" href={canonicalPath} />
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

          <h1 className="max-w-4xl text-white">{article.title}</h1>

          <p className="mt-5 max-w-3xl text-lg text-slate-300">{article.summary}</p>

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
          <article>
            <div className="mb-8 overflow-hidden rounded-[18px] border border-border bg-white">
              <img src={resolveArticleImage(article)} alt={article.title} className="h-full max-h-[460px] w-full object-cover" />
            </div>

            <Card className="border-border bg-white">
              <CardContent className="space-y-6 p-7 md:p-10">
                {paragraphs.map((paragraph, index) => (
                  <React.Fragment key={`${article.id}-${index}`}>
                    <p className="text-base leading-8 text-muted-foreground md:text-lg">{paragraph}</p>
                    {index === 0 ? <AdSpace height="120px" /> : null}
                    {index === Math.floor(paragraphs.length / 2) && index > 0 ? <AdSpace height="220px" /> : null}
                  </React.Fragment>
                ))}

                <AdSpace height="150px" />
              </CardContent>
            </Card>
          </article>

          <aside className="space-y-6 lg:sticky lg:top-24 lg:h-fit">
            <AdSpace height="320px" />
            <Card className="border-border bg-white">
              <CardContent className="space-y-3 p-6">
                <h3 className="text-xl">Continue sua leitura</h3>
                <p className="text-sm text-muted-foreground">
                  Compare opções de crédito e veja guias práticos para decidir com mais segurança.
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
                    <img src={resolveArticleImage(item)} alt={item.title} className="h-full w-full object-cover" />
                  </div>
                  <CardContent className="flex h-full flex-col gap-4 p-6">
                    <Badge variant="outline" className="w-fit">{item.category}</Badge>
                    <h3 className="text-xl">{item.title}</h3>
                    <p className="line-clamp-3 text-sm text-muted-foreground">{item.summary}</p>
                    <Link to={`/blog/${resolveArticleSlug(item)}`} className="mt-auto">
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
