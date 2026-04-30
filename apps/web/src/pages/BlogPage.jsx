import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Search } from 'lucide-react';
import AdSenseBlock, { ADSENSE_PLATFORM_SLOTS } from '@/components/AdSenseBlock.jsx';
import SeoHead from '@/components/SeoHead.jsx';
import { portalApi } from '@/platform/services/portalApi.js';
import {
  getArticleImage,
  getArticleImageCandidates,
  getArticlePath,
  getArticleSummary,
  getBlogEditorialPriority,
  getEditorialTitle,
  normalizeArticleData
} from '@/lib/content/articles.js';
import { articlesData as localArticlesData } from '@/data/articlesData.js';
import { normalizeMojibake } from '@/lib/textEncoding.js';
import { brandPages, canonicalUrl, homeBreadcrumb } from '@/seo/brandSeo.js';

const PAGE_SIZE = 9;
const BLOG_URL = canonicalUrl('/blog');

const CATEGORY_GRADIENTS = {
  emprestimos: 'linear-gradient(135deg,#1a0533,#2d1065)',
  cartoes: 'linear-gradient(135deg,#052918,#0a4d2e)',
  financiamento: 'linear-gradient(135deg,#1a1a05,#3d3d0a)',
  score: 'linear-gradient(135deg,#1a0533,#330a4d)',
  dividas: 'linear-gradient(135deg,#1a0a05,#4d2210)',
  educacao: 'linear-gradient(135deg,#0a1a33,#103055)',
  default: 'linear-gradient(135deg,#111118,#2a2a3f)'
};

const normalizeText = (value = '') =>
  normalizeMojibake(String(value || ''))
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

const getCategoryKey = (article = {}) => {
  const text = normalizeText(`${article.category || ''} ${article.clusterLabel || ''} ${article.title || ''}`);
  if (text.includes('cart')) return 'cartoes';
  if (text.includes('financi')) return 'financiamento';
  if (text.includes('score')) return 'score';
  if (text.includes('divid') || text.includes('renegoci')) return 'dividas';
  if (text.includes('educ') || text.includes('organiz')) return 'educacao';
  if (text.includes('emprest') || text.includes('credito')) return 'emprestimos';
  return 'default';
};

function BlogVisual({ article, className = '', priority = false }) {
  const imageSet = useMemo(() => getArticleImageCandidates(article), [article]);
  const sources = useMemo(() => [imageSet.primary, ...imageSet.fallbacks].filter(Boolean), [imageSet]);
  const [srcIndex, setSrcIndex] = useState(0);
  const currentSrc = sources[srcIndex];
  const category = normalizeMojibake(article?.category || 'Cote Juros');
  const gradient = CATEGORY_GRADIENTS[getCategoryKey(article)];

  useEffect(() => {
    setSrcIndex(0);
  }, [imageSet.primary]);

  if (!currentSrc) {
    return (
      <div className={`cj-blog-media-fallback ${className}`} style={{ background: gradient }} role="img" aria-label={`Imagem editorial sobre ${getEditorialTitle(article)}`}>
        <span>{category}</span>
      </div>
    );
  }

  return (
    <div className={`cj-blog-media ${className}`}>
      <img
        src={currentSrc}
        alt={article.coverImageAlt || article.imageAlt || `Imagem editorial sobre ${getEditorialTitle(article)}`}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        onError={() => setSrcIndex((current) => Math.min(current + 1, sources.length))}
      />
      <span>{category}</span>
    </div>
  );
}

function BlogCard({ article, formatDate, featured = false }) {
  const title = getEditorialTitle(article);
  const summary = getArticleSummary(article);
  const category = normalizeMojibake(article.category || 'Guia');

  return (
    <Link to={getArticlePath(article)} className={`cj-blog-card ${featured ? 'cj-blog-card--featured' : ''}`}>
      <BlogVisual article={article} priority={featured} />
      <div className="cj-blog-card-content">
        <div className="cj-blog-meta">
          <span>{article.readingTime || article.readTime || 6} min</span>
          <span>&bull;</span>
          <span>{category}</span>
        </div>
        <h3>{title}</h3>
        <p>{summary}</p>
        <span className="cj-blog-read-link">
          Ler artigo
          <ArrowRight size={14} />
        </span>
      </div>
    </Link>
  );
}

function BlogPage() {
  const localArticles = useMemo(() => localArticlesData.map((item) => normalizeArticleData(item)), []);
  const [articlesData, setArticlesData] = useState(localArticles);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Todos');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    let active = true;
    setArticlesData(localArticles);

    portalApi
      .getArticles({ sort: 'recent' })
      .then((items) => {
        if (!active) return;
        const remoteArticles = Array.isArray(items) ? items.map((item) => normalizeArticleData(item)) : [];
        setArticlesData(remoteArticles.length ? remoteArticles : localArticles);
      })
      .catch((error) => {
        console.error('[blog-page] erro ao carregar artigos', error);
        if (active) setArticlesData(localArticles);
      });

    return () => {
      active = false;
    };
  }, [localArticles]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [search, category]);

  const categories = useMemo(() => {
    const grouped = new Map();

    articlesData.forEach((article) => {
      const label = normalizeMojibake(article.category || '');
      if (!label) return;
      grouped.set(label, (grouped.get(label) || 0) + 1);
    });

    return [
      { label: 'Todos', count: articlesData.length },
      ...Array.from(grouped.entries())
        .map(([label, count]) => ({ label, count }))
        .sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'))
    ];
  }, [articlesData]);

  const filteredArticles = useMemo(() => {
    const query = normalizeText(search.trim());

    return articlesData
      .filter((article) => {
        const normalizedCategory = normalizeMojibake(article.category || '');
        const inCategory = category === 'Todos' || normalizedCategory === category;
        if (!inCategory) return false;
        if (!query) return true;

        const haystack = normalizeText(`${getEditorialTitle(article)} ${getArticleSummary(article)} ${article.tags.join(' ')}`);
        return haystack.includes(query);
      })
      .sort((a, b) => {
        const priorityDelta = getBlogEditorialPriority(a.slug) - getBlogEditorialPriority(b.slug);
        if (priorityDelta !== 0) return priorityDelta;
        return new Date(b.publishedAt) - new Date(a.publishedAt);
      });
  }, [articlesData, category, search]);

  const featured = filteredArticles[0] || null;
  const topGuides = filteredArticles.slice(1, 4);
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

      <div className="cj-blog-page">
        <section className="inner-hero cj-blog-hero">
          <div className="container">
            <div className="inner-hero-badge">Conteúdo</div>
            <h1>
              Educação <span className="text-accent">financeira</span>
            </h1>
            <p className="section-desc">
              Artigos, guias e análises para você tomar decisões com mais consciência e menos pressa.
            </p>

            <div className="cj-blog-search">
              <Search size={16} />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar por crédito, score, cartões ou dívidas"
                aria-label="Buscar artigos"
              />
            </div>
          </div>
        </section>

        <section className="section-pad cj-blog-listing">
          <div className="container">
            <div className="filter-tabs cj-blog-tabs">
              {categories.slice(0, 8).map((item) => (
                <button
                  key={item.label}
                  type="button"
                  className={`filter-tab ${category === item.label ? 'active' : ''}`}
                  aria-pressed={category === item.label}
                  onClick={() => setCategory(item.label)}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {featured ? (
              <section className="cj-blog-featured">
                <div>
                  <div className="section-label">Leitura em destaque</div>
                  <h2>{getEditorialTitle(featured)}</h2>
                  <p>{getArticleSummary(featured)}</p>
                  <div className="cj-blog-featured-meta">
                    <span>{formatDate(featured.publishedAt)}</span>
                    <span>{featured.readingTime || featured.readTime || 6} min de leitura</span>
                  </div>
                  <Link to={getArticlePath(featured)} className="btn-primary">
                    Ler destaque
                    <ArrowRight size={14} />
                  </Link>
                </div>
                <Link to={getArticlePath(featured)} aria-label={`Ler ${getEditorialTitle(featured)}`}>
                  <BlogVisual article={featured} priority className="cj-blog-featured-media" />
                </Link>
              </section>
            ) : null}

            <AdSenseBlock adSlot={ADSENSE_PLATFORM_SLOTS.blogTop} minHeight={110} theme="dark" className="cj-blog-ad" />

            {topGuides.length ? (
              <section className="cj-blog-section">
                <div className="cj-blog-section-heading">
                  <div>
                    <div className="section-label">Guias úteis</div>
                    <h2>Leituras para decidir melhor</h2>
                  </div>
                  <span>{filteredArticles.length} artigos</span>
                </div>
                <div className="cj-blog-grid cj-blog-grid--top">
                  {topGuides.map((article) => (
                    <BlogCard key={article.slug} article={article} formatDate={formatDate} />
                  ))}
                </div>
              </section>
            ) : null}

            <section className="cj-blog-section">
              <div className="cj-blog-section-heading">
                <div>
                  <div className="section-label">Biblioteca</div>
                  <h2>Artigos recentes</h2>
                </div>
                <span>{filteredArticles.length} artigos encontrados</span>
              </div>

              {recentArticles.length ? (
                <div className="cj-blog-grid">
                  {recentArticles.map((article) => (
                    <BlogCard key={article.slug} article={article} formatDate={formatDate} />
                  ))}
                </div>
              ) : (
                <div className="cj-blog-empty">
                  <h3>Nenhum artigo encontrado</h3>
                  <p>Tente outro termo de busca ou escolha uma categoria diferente.</p>
                </div>
              )}

              {hasMore ? (
                <div className="cj-blog-more">
                  <button type="button" className="btn-outline" onClick={() => setVisibleCount((value) => value + PAGE_SIZE)}>
                    Carregar mais artigos
                  </button>
                </div>
              ) : null}
            </section>

            <section className="cj-blog-cta">
              <div>
                <div className="section-label">Próximo passo</div>
                <h2>Compare opções de crédito com a mesma clareza da leitura</h2>
                <p>Quando fizer sentido sair do conteúdo para a decisão, veja caminhos possíveis para seu perfil.</p>
              </div>
              <Link to="/comparar" className="btn-primary">
                Ver opções agora
                <ArrowRight size={14} />
              </Link>
            </section>
          </div>
        </section>
      </div>
    </>
  );
}

export default BlogPage;
