import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { ArrowRight, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import PageHero from '@/components/PageHero.jsx';
import BlogArticleCard from '@/components/BlogArticleCard.jsx';
import { portalApi } from '@/platform/services/portalApi.js';
import { getArticleImage, getArticleSummary, getEditorialTitle, normalizeArticleSlug } from '@/lib/content/articles.js';

const PAGE_SIZE = 12;

const fallbackImage =
  'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1600&q=80';

function BlogPage() {
  const [articlesData, setArticlesData] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Todas');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    portalApi.getArticles({ sort: 'recent' }).then((items) => setArticlesData(Array.isArray(items) ? items : []));
  }, []);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [search, category]);

  const categories = useMemo(() => {
    const grouped = new Map();

    articlesData.forEach((article) => {
      const label = typeof article.category === 'string' ? article.category : article.category?.name;
      if (!label) return;
      grouped.set(label, (grouped.get(label) || 0) + 1);
    });

    return [
      { label: 'Todas', count: articlesData.length },
      ...Array.from(grouped.entries())
        .map(([label, count]) => ({ label, count }))
        .sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'))
    ];
  }, [articlesData]);

  const filteredArticles = useMemo(() => {
    const query = search.trim().toLowerCase();

    return articlesData
      .filter((article) => {
        const label = typeof article.category === 'string' ? article.category : article.category?.name;
        const inCategory = category === 'Todas' || label === category;
        if (!inCategory) return false;

        if (!query) return true;

        const haystack = `${getEditorialTitle(article)} ${getArticleSummary(article)} ${(article.keywords || []).join(' ')}`.toLowerCase();
        return haystack.includes(query);
      })
      .sort((a, b) => new Date(b.publishDate) - new Date(a.publishDate));
  }, [articlesData, category, search]);

  const featured = filteredArticles[0];
  const trendingGuides = filteredArticles.slice(1, 4);
  const recentArticles = filteredArticles.slice(4, 4 + visibleCount);
  const hasMore = filteredArticles.length > 4 + visibleCount;

  const formatDate = (date) =>
    new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });

  return (
    <>
      <Helmet>
        <title>Blog Cote Juros | Guias financeiros para crédito, score e planejamento</title>
        <meta
          name="description"
          content="Leia guias editoriais da Cote Juros sobre empréstimo, cartões, score, financiamento, organização financeira e negociação de dívidas."
        />
        <link rel="canonical" href="https://www.cotejuros.com.br/blog" />
      </Helmet>

      <PageHero
        centered
        badge="Editorial Cote Juros"
        title="Guias financeiros para decidir com clareza antes de contratar crédito"
        subtitle="Conteúdo direto para comparar taxas, evitar armadilhas e organizar suas finanças no dia a dia."
      >
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="h-12 rounded-full bg-background pl-11"
              placeholder="Busque por score, empréstimo, cartão, dívidas ou orçamento"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <div className="flex flex-wrap justify-center gap-2">
            {categories.slice(0, 8).map((item) => (
              <Button
                key={item.label}
                variant={category === item.label ? 'default' : 'outline'}
                className="rounded-full"
                onClick={() => setCategory(item.label)}
              >
                {item.label}
              </Button>
            ))}
          </div>
        </div>
      </PageHero>

      <div className="page-shell space-y-12 py-10 md:space-y-14 md:py-14">
        {featured ? (
          <section className="space-y-5">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-2xl text-foreground">Destaque da semana</h2>
              <Badge variant="outline">{featured.category}</Badge>
            </div>

            <Link
              to={`/blog/${normalizeArticleSlug(featured)}`}
              className="group grid overflow-hidden rounded-[26px] border border-border bg-white md:grid-cols-[1.1fr_0.9fr]"
            >
              <div className="min-h-[250px] overflow-hidden bg-slate-100 md:min-h-[360px]">
                <img
                  src={getArticleImage(featured, fallbackImage)}
                  alt={getEditorialTitle(featured)}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                />
              </div>

              <div className="flex flex-col justify-center gap-4 p-6 md:p-8">
                <p className="text-sm font-semibold uppercase tracking-[0.14em] text-primary">Featured article</p>
                <h3 className="text-3xl text-foreground">{getEditorialTitle(featured)}</h3>
                <p className="text-base leading-7 text-muted-foreground">{getArticleSummary(featured)}</p>
                <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                  <span>{formatDate(featured.publishDate)}</span>
                  <span>•</span>
                  <span>{featured.readTime || 6} min de leitura</span>
                </div>
                <span className="inline-flex items-center gap-2 font-medium text-primary">
                  Ler artigo
                  <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                </span>
              </div>
            </Link>
          </section>
        ) : null}

        {trendingGuides.length ? (
          <section className="space-y-5">
            <h2 className="text-2xl text-foreground">Guias em alta</h2>
            <div className="grid gap-5 md:grid-cols-3">
              {trendingGuides.map((article) => (
                <BlogArticleCard
                  key={article.id}
                  article={article}
                  image={getArticleImage(article, fallbackImage)}
                  formatDate={formatDate}
                  label="Ler guia"
                />
              ))}
            </div>
          </section>
        ) : null}

        <section className="space-y-4">
          <h2 className="text-2xl text-foreground">Navegue por categoria</h2>
          <div className="flex flex-wrap gap-2">
            {categories.slice(1).map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => setCategory(item.label)}
                className="rounded-full border border-border bg-white px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-primary/35 hover:bg-primary/[0.04]"
              >
                {item.label} ({item.count})
              </button>
            ))}
          </div>
        </section>

        <section className="space-y-5">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-2xl text-foreground">Artigos recentes</h2>
            <span className="text-sm text-muted-foreground">{filteredArticles.length} artigos</span>
          </div>

          {recentArticles.length ? (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {recentArticles.map((article) => (
                <BlogArticleCard
                  key={article.id}
                  article={article}
                  image={getArticleImage(article, fallbackImage)}
                  formatDate={formatDate}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-[16px] border border-dashed border-border bg-background-secondary px-6 py-14 text-center">
              <h3 className="text-2xl text-foreground">Nenhum artigo encontrado</h3>
              <p className="mt-3 text-muted-foreground">Tente outro termo de busca ou uma categoria diferente.</p>
            </div>
          )}

          {hasMore ? (
            <div className="flex justify-center">
              <Button variant="outline" className="rounded-full px-7" onClick={() => setVisibleCount((value) => value + PAGE_SIZE)}>
                Carregar mais artigos
              </Button>
            </div>
          ) : null}
        </section>

        <section className="rounded-[24px] border border-primary/15 bg-primary/[0.04] p-6 md:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary/80">Próximo passo</p>
          <h2 className="mt-3 text-2xl text-foreground">Faça um diagnóstico financeiro gratuito</h2>
          <p className="mt-3 max-w-3xl text-base leading-7 text-muted-foreground">
            Descubra quais ajustes priorizar agora para melhorar score, reduzir custos e contratar crédito com mais segurança.
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
      </div>
    </>
  );
}

export default BlogPage;

