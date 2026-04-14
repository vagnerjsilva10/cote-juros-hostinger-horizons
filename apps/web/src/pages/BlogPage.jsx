import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { ArrowRight, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import PageHero from '@/components/PageHero.jsx';
import BlogArticleCard from '@/components/BlogArticleCard.jsx';
import ArticleCoverImage from '@/components/blog/ArticleCoverImage.jsx';
import { AdSlotHorizontal, AdSlotInline, AdSlotResponsive } from '@/components/blog/AdSlot.jsx';
import BlogGridSkeleton from '@/components/blog/BlogGridSkeleton.jsx';
import { portalApi } from '@/platform/services/portalApi.js';
import {
  getArticleImage,
  getArticlePath,
  getArticleSummary,
  getEditorialTitle,
  normalizeArticleData
} from '@/lib/content/articles.js';

const PAGE_SIZE = 12;
const BLOG_URL = 'https://www.cotejuros.com.br/blog';

const BLOG_TOPIC_FILTERS = {
  educacao: ['educacao', 'organizacao', 'orcamento', 'reserva', 'score', 'planejamento', 'gastos', 'metas', 'financas'],
  dividas: ['divida', 'renegoci', 'juros abusivos', 'rotativo', 'cheque especial', 'parcelamento', 'nome sujo']
};

const matchesForcedTopic = (article, forcedTopic) => {
  if (!forcedTopic) return true;

  const keywords = BLOG_TOPIC_FILTERS[forcedTopic] || [];
  const haystack = [
    article.slug,
    article.category,
    article.categoryKey,
    article.title,
    article.h1,
    article.summary,
    ...(article.tags || [])
  ]
    .join(' ')
    .toLowerCase();

  return keywords.some((keyword) => haystack.includes(keyword));
};

const blogBaseSchema = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': 'https://www.cotejuros.com.br/#organization',
      name: 'Cote Juros',
      url: 'https://www.cotejuros.com.br',
      logo: 'https://www.cotejuros.com.br/assets/logo/logo-primary.png'
    },
    {
      '@type': 'WebSite',
      '@id': 'https://www.cotejuros.com.br/#website',
      name: 'Cote Juros',
      url: 'https://www.cotejuros.com.br'
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Início', item: 'https://www.cotejuros.com.br/' },
        { '@type': 'ListItem', position: 2, name: 'Blog', item: BLOG_URL }
      ]
    }
  ]
};

function BlogPage({
  forcedTopic = '',
  pageTitle = 'Blog Cote Juros | Guias financeiros para crédito, score e planejamento',
  pageDescription = 'Leia guias e dicas da Cote Juros sobre empréstimo, cartões, score, financiamento, dívidas e organização financeira.',
  heroBadge = 'Blog Cote Juros',
  heroTitle = 'Guias financeiros para decidir com clareza antes de contratar crédito',
  heroSubtitle = 'Textos simples e úteis para comparar bancos, entender crédito e cuidar melhor do seu dinheiro.'
}) {
  const [articlesData, setArticlesData] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Todas');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    portalApi
      .getArticles({ sort: 'recent' })
      .then((items) => {
        if (!active) return;
        setArticlesData(Array.isArray(items) ? items.map((item) => normalizeArticleData(item)) : []);
      })
      .catch((error) => {
        console.error('[blog-page] erro ao carregar artigos', error);
        if (active) setArticlesData([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [search, category]);

  const categories = useMemo(() => {
    const grouped = new Map();
    const scopedArticles = articlesData.filter((article) => matchesForcedTopic(article, forcedTopic));

    scopedArticles.forEach((article) => {
      if (!article.category) return;
      grouped.set(article.category, (grouped.get(article.category) || 0) + 1);
    });

    return [
      { label: 'Todas', count: scopedArticles.length },
      ...Array.from(grouped.entries())
        .map(([label, count]) => ({ label, count }))
        .sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'))
    ];
  }, [articlesData, forcedTopic]);

  const filteredArticles = useMemo(() => {
    const query = search.trim().toLowerCase();

    return articlesData
      .filter((article) => {
        if (!matchesForcedTopic(article, forcedTopic)) return false;
        const inCategory = category === 'Todas' || article.category === category;
        if (!inCategory) return false;
        if (!query) return true;

        const haystack = `${getEditorialTitle(article)} ${getArticleSummary(article)} ${article.tags.join(' ')}`.toLowerCase();
        return haystack.includes(query);
      })
      .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
  }, [articlesData, category, forcedTopic, search]);

  const featured = filteredArticles[0] || null;
  const trendingGuides = filteredArticles.slice(1, 4);
  const recentArticles = filteredArticles.slice(4, 4 + visibleCount);
  const hasMore = filteredArticles.length > 4 + visibleCount;

  const formatDate = (date) =>
    new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });

  const itemListSchema = useMemo(
    () => ({
      '@context': 'https://schema.org',
      '@type': 'Blog',
      '@id': `${BLOG_URL}#blog`,
      name: 'Blog Cote Juros',
      description: 'Guias e dicas da Cote Juros sobre crédito, score, cartões, financiamento e organização financeira.',
      url: BLOG_URL,
      blogPost: filteredArticles.slice(0, 12).map((article, index) => ({
        '@type': 'BlogPosting',
        position: index + 1,
        headline: article.metaTitle || getEditorialTitle(article),
        url: `https://www.cotejuros.com.br${getArticlePath(article)}`,
        datePublished: article.publishedAt,
        dateModified: article.updatedAt,
        image: getArticleImage(article),
        author: {
          '@type': 'Person',
          name: article.author
        }
      }))
    }),
    [filteredArticles]
  );

  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta name="robots" content="index,follow,max-image-preview:large" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:url" content={BLOG_URL} />
        <meta property="og:image" content="https://www.cotejuros.com.br/assets/blog/fallbacks/editorial-global.svg" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
        <link rel="canonical" href={BLOG_URL} />
        <script type="application/ld+json">{JSON.stringify(blogBaseSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(itemListSchema)}</script>
      </Helmet>

      <PageHero
        centered
        badge={heroBadge}
        title={heroTitle}
        subtitle={heroSubtitle}
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

      <div className="page-shell space-y-10 py-10 md:space-y-14 md:py-14">
        <section className="grid gap-4 rounded-[24px] border border-border bg-white p-5 md:grid-cols-[1.3fr_0.7fr] md:p-7">
          <div className="space-y-3">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Guias e dicas</p>
            <h2 className="text-2xl text-foreground md:text-3xl">Conteúdo para entender crédito, comparar bancos e decidir com mais segurança</h2>
            <p className="max-w-3xl text-base leading-7 text-muted-foreground">
              Explore os temas mais importantes do dia a dia financeiro e encontre explicações claras para avançar com mais tranquilidade.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3 md:grid-cols-1">
            {categories.slice(1, 4).map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => setCategory(item.label)}
                className="rounded-[18px] border border-border bg-background-secondary px-4 py-4 text-left transition-colors hover:border-primary/35 hover:bg-primary/[0.03]"
              >
                <span className="block text-sm font-semibold text-foreground">{item.label}</span>
                <span className="mt-1 block text-sm text-muted-foreground">{item.count} artigos</span>
              </button>
            ))}
          </div>
        </section>

        {loading ? (
          <>
            <section className="rounded-[20px] border border-border bg-white px-6 py-14 text-center">
              <p className="text-muted-foreground">Carregando conteúdos do blog...</p>
            </section>
            <BlogGridSkeleton items={6} />
          </>
        ) : null}

        {featured ? (
          <section className="space-y-5">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-2xl text-foreground">Destaque da semana</h2>
              <Badge variant="outline">{featured.category}</Badge>
            </div>

            <Link
              to={getArticlePath(featured)}
              className="group grid overflow-hidden rounded-[26px] border border-border bg-white md:grid-cols-[1.1fr_0.9fr]"
            >
              <ArticleCoverImage
                article={featured}
                className="min-h-[250px] md:min-h-[360px]"
                imageClassName="transition-transform duration-300 group-hover:scale-[1.03]"
              />

              <div className="flex flex-col justify-center gap-4 p-6 md:p-8">
                <p className="text-sm font-semibold uppercase tracking-[0.14em] text-primary">Leitura em destaque</p>
                <h3 className="text-3xl text-foreground">{getEditorialTitle(featured)}</h3>
                <p className="text-base leading-7 text-muted-foreground">{getArticleSummary(featured)}</p>
                <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                  <span>{formatDate(featured.publishedAt)}</span>
                  <span>•</span>
                  <span>{featured.readingTime || featured.readTime || 6} min de leitura</span>
                </div>
                <span className="inline-flex items-center gap-2 font-medium text-primary">
                  Ler artigo
                  <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                </span>
              </div>
            </Link>
          </section>
        ) : null}

        <AdSlotHorizontal
          slot="blog-home-hero"
          title="Espaço para anúncio"
          description="Área discreta reservada para anúncio entre o destaque e os blocos do blog."
        />

        {trendingGuides.length ? (
          <section className="space-y-5">
            <h2 className="text-2xl text-foreground">Guias em alta</h2>
            <div className="grid gap-5 md:grid-cols-3">
              {trendingGuides.map((article) => (
                <BlogArticleCard
                  key={article.slug}
                  article={article}
                  image={getArticleImage(article)}
                  formatDate={formatDate}
                  label="Ler guia"
                />
              ))}
            </div>
          </section>
        ) : null}

        <section className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-2xl text-foreground">Navegue por categoria</h2>
            <span className="text-sm text-muted-foreground">{filteredArticles.length} artigos</span>
          </div>
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

        <AdSlotInline
          slot="blog-home-inline"
          title="Espaço para anúncio"
          description="Área discreta reservada para anúncio sem atrapalhar a leitura."
        />

        <section className="space-y-5">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-2xl text-foreground">Artigos recentes</h2>
            <span className="text-sm text-muted-foreground">{filteredArticles.length} artigos</span>
          </div>

          {recentArticles.length ? (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {recentArticles.map((article, index) => (
                <React.Fragment key={article.slug}>
                  <BlogArticleCard article={article} image={getArticleImage(article)} formatDate={formatDate} />
                  {index === 2 ? (
                    <AdSlotResponsive
                      slot="blog-home-feed"
                      className="sm:col-span-2 xl:col-span-3"
                      title="Slot responsivo entre blocos"
                      description="Pronto para futura integração com AdSense na listagem principal."
                    />
                  ) : null}
                </React.Fragment>
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
