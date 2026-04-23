import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import PageHero from '@/components/PageHero.jsx';
import SeoHead from '@/components/SeoHead.jsx';
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
import { brandPages, canonicalUrl, homeBreadcrumb } from '@/seo/brandSeo.js';

const PAGE_SIZE = 12;
const BLOG_URL = canonicalUrl('/blog');

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
      <SeoHead
        title={brandPages.blog.title}
        description={brandPages.blog.description}
        path={brandPages.blog.path}
        breadcrumbs={[homeBreadcrumb, { name: 'Blog', path: brandPages.blog.path }]}
        structuredData={[itemListSchema]}
      />

      <PageHero
        centered
        breadcrumbs={[homeBreadcrumb, { name: 'Blog', path: brandPages.blog.path }]}
        className="blog-page-hero"
        badge="Blog Cote Juros"
        title={t('Conteúdo para entender crédito sem complicação')}
        subtitle={t('Guias simples para comparar, organizar as contas e tomar decisões com mais calma.')}
      >
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="blog-hero-search pl-11"
              placeholder={t('Busque por score, empréstimo, cartão, dívidas ou orçamento')}
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

      <div className="page-shell blog-page-shell space-y-12 py-12 md:space-y-16 md:py-16">
        <section className="blog-page-section blog-page-section--muted blog-intro-panel grid gap-5 p-6 md:grid-cols-[1.15fr_0.85fr] md:p-8">
          <div className="space-y-3">
            <p className="blog-kicker text-sm font-semibold uppercase tracking-[0.18em]">Comece por aqui</p>
            <h2 className="text-2xl text-foreground md:text-3xl">{t('Os temas mais úteis para cuidar da vida financeira com mais calma')}</h2>
            <p className="max-w-3xl text-base leading-7 text-muted-foreground">
              {t('Aqui você encontra explicações diretas, sem jargão e sem enrolação, para entender o que fazer em cada momento.')}
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3 md:grid-cols-1">
            {categories.slice(1, 4).map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => setCategory(item.label)}
                className="blog-topic-card px-4 py-4 text-left"
              >
                <span className="block text-sm font-semibold text-foreground">{item.label}</span>
                <span className="mt-1 block text-sm text-muted-foreground">{item.count} artigos</span>
              </button>
            ))}
          </div>
        </section>

        {loading ? (
          <>
            <section className="blog-status-panel px-6 py-14 text-center">
              <p className="text-muted-foreground">Carregando conteúdos do blog...</p>
            </section>
            <BlogGridSkeleton items={6} />
          </>
        ) : null}

        {featured ? (
          <section className="blog-page-section space-y-5">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-2xl text-foreground">Leitura em destaque</h2>
              <Badge variant="outline">{normalizeMojibake(featured.category || '')}</Badge>
            </div>

            <Link
              to={getArticlePath(featured)}
              className="blog-featured-card group grid overflow-hidden md:grid-cols-[1.1fr_0.9fr]"
            >
              <ArticleCoverImage
                article={featured}
                className="h-full w-full"
                aspectRatio="16 / 10"
                imageClassName="transition-transform duration-300 group-hover:scale-[1.03]"
              />

              <div className="flex flex-col justify-center gap-4 p-6 md:p-8">
                <p className="blog-kicker text-sm font-semibold uppercase tracking-[0.14em]">Artigo em destaque</p>
                <h3 className="text-3xl text-foreground">{getEditorialTitle(featured)}</h3>
                <p className="text-base leading-7 text-muted-foreground">{getArticleSummary(featured)}</p>
                <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                  <span>{formatDate(featured.publishedAt)}</span>
                  <span>&bull;</span>
                  <span>{featured.readingTime || featured.readTime || 6} min de leitura</span>
                </div>
                <span className="blog-read-link inline-flex items-center gap-2 font-medium">
                  Ler artigo
                  <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                </span>
              </div>
            </Link>
          </section>
        ) : null}

        <AdSlotHorizontal />

        {trendingGuides.length ? (
          <section className="blog-page-section blog-page-section--muted space-y-5">
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

        <section className="blog-page-section space-y-4">
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
                className={`blog-filter-chip ${category === item.label ? 'is-active' : ''}`}
              >
                {item.label} ({item.count})
              </button>
            ))}
          </div>
        </section>

        <AdSlotInline />

        <section className="blog-page-section blog-page-section--muted space-y-5">
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
            <div className="blog-status-panel border-dashed px-6 py-14 text-center">
              <h3 className="text-2xl text-foreground">Nenhum artigo encontrado</h3>
              <p className="mt-3 text-muted-foreground">Tente outro termo de busca ou uma categoria diferente.</p>
            </div>
          )}

          {hasMore ? (
            <div className="flex justify-center">
              <Button variant="outline" className="rounded-[8px] px-7" onClick={() => setVisibleCount((value) => value + PAGE_SIZE)}>
                Carregar mais artigos
              </Button>
            </div>
          ) : null}
        </section>

        <section className="blog-page-section blog-page-section--plain blog-cta-panel blog-page-cta-panel p-6 md:p-8">
          <p className="blog-kicker text-sm font-semibold uppercase tracking-[0.2em]">Próximo passo</p>
          <h2 className="mt-3 text-2xl text-foreground">Quando quiser sair da leitura, compare opções de crédito com mais clareza</h2>
          <p className="mt-3 max-w-3xl text-base leading-7 text-muted-foreground">
            O blog ajuda você a entender melhor o cenário. Quando fizer sentido, a comparação mostra caminhos possíveis para seguir com mais segurança.
          </p>
          <div className="blog-page-cta-actions mt-6 flex flex-wrap gap-3">
            <Link to="/emprestimos" className="inline-flex">
              <Button className="rounded-[8px]">
                Ver minhas opções agora
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/emprestimo-para-negativado" className="inline-flex">
              <Button variant="outline" className="rounded-[8px]">Estou com o nome negativado</Button>
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}

export default BlogPage;
