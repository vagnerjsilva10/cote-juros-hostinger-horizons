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
  getBlogEditorialPriority,
  getEditorialTitle,
  normalizeArticleData
} from '@/lib/content/articles.js';
import { normalizeMojibake } from '@/lib/textEncoding.js';

const PAGE_SIZE = 12;
const BLOG_URL = 'https://www.cotejuros.com.br/blog';
const SITE_LOGO_URL = 'https://www.cotejuros.com.br/assets/logo/logo-current-site.svg';

const blogBaseSchema = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': 'https://www.cotejuros.com.br/#organization',
      name: 'Cote Juros',
      url: 'https://www.cotejuros.com.br',
      logo: SITE_LOGO_URL
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

function BlogPage() {
  const t = normalizeMojibake;
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

    articlesData.forEach((article) => {
      if (!article.category) return;
      grouped.set(article.category, (grouped.get(article.category) || 0) + 1);
    });

    return [
      { label: 'Todas', count: articlesData.length },
      ...Array.from(grouped.entries())
        .map(([label, count]) => ({ label: normalizeMojibake(label), count }))
        .sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'))
    ];
  }, [articlesData]);

  const filteredArticles = useMemo(() => {
    const query = search.trim().toLowerCase();

    return articlesData
      .filter((article) => {
        const normalizedCategory = normalizeMojibake(article.category || '');
        const inCategory = category === 'Todas' || normalizedCategory === category;
        if (!inCategory) return false;
        if (!query) return true;

        const haystack = `${getEditorialTitle(article)} ${getArticleSummary(article)} ${article.tags.join(' ')}`.toLowerCase();
        return haystack.includes(query);
      })
      .sort((a, b) => {
        const priorityDelta = getBlogEditorialPriority(a.slug) - getBlogEditorialPriority(b.slug);
        if (priorityDelta !== 0) return priorityDelta;
        return new Date(b.publishedAt) - new Date(a.publishedAt);
      });
  }, [articlesData, category, search]);

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
      description: 'Conteúdos sobre crédito, cartões, score, financiamento e organização financeira.',
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
        <title>Blog Cote Juros | Dicas para cuidar melhor do seu dinheiro</title>
        <meta
          name="description"
          content="Leia conteúdos sobre empréstimo, cartão, score, dívidas, financiamento e organização financeira com explicações claras e exemplos do dia a dia."
        />
        <meta name="robots" content="index,follow,max-image-preview:large" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Blog Cote Juros | Dicas para cuidar melhor do seu dinheiro" />
        <meta
          property="og:description"
          content="Guias claros para comparar custos, evitar armadilhas e organizar melhor sua vida financeira."
        />
        <meta property="og:url" content={BLOG_URL} />
        <meta property="og:image" content="https://www.cotejuros.com.br/assets/blog/fallbacks/editorial-global.svg" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Blog Cote Juros | Dicas para cuidar melhor do seu dinheiro" />
        <meta
          name="twitter:description"
          content="Conteúdos sobre crédito, cartões, score, financiamento e organização financeira em linguagem simples."
        />
        <link rel="canonical" href={BLOG_URL} />
        <script type="application/ld+json">{JSON.stringify(blogBaseSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(itemListSchema)}</script>
      </Helmet>

      <PageHero
        centered
        badge="Blog Cote Juros"
        title={t('Conte�do para entender antes de contratar')}
        subtitle={t('Guias editoriais com leitura clara, imagens mais humanas e contexto financeiro para decidir com mais confian�a.')}
      >
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="blog-hero-search rounded-full bg-background pl-11"
              placeholder={t('Busque por score, empr�stimo, cart�o, d�vidas ou or�amento')}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <div className="flex flex-wrap justify-center gap-2">
            {categories.slice(0, 8).map((item) => (
              <button
                key={item.label}
                type="button"
                className={`blog-hero-chip ${category === item.label ? 'is-active' : ''}`}
                onClick={() => setCategory(item.label)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </PageHero>

      <div className="page-shell space-y-12 py-12 md:space-y-16 md:py-16">
        <section className="grid gap-5 rounded-[28px] border border-border bg-white p-6 md:grid-cols-[1.15fr_0.85fr] md:p-8">
          <div className="space-y-3">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary/80">Comece por aqui</p>
            <h2 className="text-2xl text-foreground md:text-3xl">{t('Temas mais �teis para organizar a vida financeira com calma')}</h2>
            <p className="max-w-3xl text-base leading-7 text-muted-foreground">
              {t('Um blog mais silencioso, claro e �til para apoiar decis�es financeiras sem polui��o visual.')}
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
            <section className="rounded-[24px] border border-border bg-white px-6 py-14 text-center">
              <p className="text-muted-foreground">Carregando conteúdos do blog...</p>
            </section>
            <BlogGridSkeleton items={6} />
          </>
        ) : null}

        {featured ? (
          <section className="space-y-5">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-2xl text-foreground">Destaque da semana</h2>
              <Badge variant="outline">{normalizeMojibake(featured.category || '')}</Badge>
            </div>

            <Link
              to={getArticlePath(featured)}
              className="group grid overflow-hidden rounded-[28px] border border-border bg-white shadow-[0_12px_32px_rgba(15,23,42,0.06)] md:grid-cols-[1.1fr_0.9fr]"
            >
              <ArticleCoverImage
                article={featured}
                className="h-full w-full"
                aspectRatio="16 / 10"
                imageClassName="transition-transform duration-300 group-hover:scale-[1.03]"
              />

              <div className="flex flex-col justify-center gap-4 p-6 md:p-8">
                <p className="text-sm font-semibold uppercase tracking-[0.14em] text-primary/80">Artigo em destaque</p>
                <h3 className="text-3xl text-foreground">{getEditorialTitle(featured)}</h3>
                <p className="text-base leading-7 text-muted-foreground">{getArticleSummary(featured)}</p>
                <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                  <span>{formatDate(featured.publishedAt)}</span>
                  <span>&bull;</span>
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

        <AdSlotHorizontal />

        {trendingGuides.length ? (
          <section className="space-y-5">
            <h2 className="text-2xl text-foreground">Leituras recomendadas</h2>
            <div className="grid gap-5 md:grid-cols-3">
              {trendingGuides.map((article) => (
                <BlogArticleCard
                  key={article.slug}
                  article={article}
                  image={getArticleImage(article)}
                  formatDate={formatDate}
                  label="Ler artigo"
                />
              ))}
            </div>
          </section>
        ) : null}

        <section className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-2xl text-foreground">Navegue por tema</h2>
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

        <AdSlotInline />

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
                    <AdSlotResponsive className="sm:col-span-2 xl:col-span-3" />
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

        <section className="rounded-[28px] border border-primary/15 bg-primary/[0.04] p-6 md:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary/80">Próximo passo</p>
          <h2 className="mt-3 text-2xl text-foreground">Quando quiser sair da leitura, veja caminhos de crédito com mais contexto</h2>
          <p className="mt-3 max-w-3xl text-base leading-7 text-muted-foreground">
            O blog prepara a decisão. A jornada de crédito mostra possibilidades. E o redirecionamento ao parceiro só aparece depois, de forma separada.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link to="/emprestimos" className="inline-flex">
              <Button>
                Ver minhas opções agora
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/emprestimo-para-negativado" className="inline-flex">
              <Button variant="outline">Estou com o nome negativado</Button>
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}

export default BlogPage;
