import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import AdSenseBlock, { ADSENSE_PLATFORM_SLOTS } from '@/components/AdSenseBlock.jsx';
import SeoHead from '@/components/SeoHead.jsx';
import { portalApi } from '@/platform/services/portalApi.js';
import {
  getArticleImage,
  getArticlePath,
  getArticleSummary,
  getBlogEditorialPriority,
  getEditorialTitle,
  normalizeArticleData
} from '@/lib/content/articles.js';
import { articlesData as localArticlesData } from '@/data/articlesData.js';
import { normalizeMojibake } from '@/lib/textEncoding.js';
import { brandPages, canonicalUrl, homeBreadcrumb } from '@/seo/brandSeo.js';

const PAGE_SIZE = 12;
const BLOG_URL = canonicalUrl('/blog');

const FILTERS = ['Todos', 'Crédito', 'Cartões', 'Empréstimos', 'Seguros', 'Financiamento'];

const CATEGORY_GRADIENTS = {
  credito: 'linear-gradient(135deg,#1a0533,#2d1065)',
  cartoes: 'linear-gradient(135deg,#052918,#0a4d2e)',
  emprestimos: 'linear-gradient(135deg,#1a0533,#2d1065)',
  seguros: 'linear-gradient(135deg,#1a0a05,#4d2210)',
  financiamento: 'linear-gradient(135deg,#1a1a05,#3d3d0a)',
  planejamento: 'linear-gradient(135deg,#0a1a33,#103055)',
  default: 'linear-gradient(135deg,#1a0533,#330a4d)'
};

const normalizeText = (value = '') =>
  normalizeMojibake(String(value || ''))
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

const getCategoryKey = (article = {}) => {
  const text = normalizeText(`${article.category || ''} ${article.clusterLabel || ''} ${article.title || ''}`);
  if (text.includes('cart')) return 'cartoes';
  if (text.includes('seguro')) return 'seguros';
  if (text.includes('financi')) return 'financiamento';
  if (text.includes('planej') || text.includes('organiz') || text.includes('educ')) return 'planejamento';
  if (text.includes('emprest')) return 'emprestimos';
  if (text.includes('credito') || text.includes('score')) return 'credito';
  return 'default';
};

const isArticleInFilter = (article, filter) => {
  if (filter === 'Todos') return true;
  const key = getCategoryKey(article);
  const normalizedFilter = normalizeText(filter);
  if (normalizedFilter.includes('cart')) return key === 'cartoes';
  if (normalizedFilter.includes('seguro')) return key === 'seguros';
  if (normalizedFilter.includes('financi')) return key === 'financiamento';
  if (normalizedFilter.includes('emprest')) return key === 'emprestimos';
  if (normalizedFilter.includes('credito')) return key === 'credito' || key === 'emprestimos';
  return true;
};

function BlogCard({ article }) {
  const title = getEditorialTitle(article);
  const summary = getArticleSummary(article);
  const category = normalizeMojibake(article.category || 'Crédito');
  const gradient = CATEGORY_GRADIENTS[getCategoryKey(article)] || CATEGORY_GRADIENTS.default;

  return (
    <Link className="blog-card" to={getArticlePath(article)}>
      <div className="blog-img" style={{ background: gradient }}>
        <div className="blog-cat-badge">{category}</div>
      </div>
      <div className="blog-content">
        <div className="blog-meta">
          <span>{article.readingTime || article.readTime || 6} min</span>
          <span>&bull;</span>
          <span>{category}</span>
        </div>
        <div className="blog-title">{title}</div>
        <div className="blog-excerpt">{summary}</div>
      </div>
    </Link>
  );
}

function BlogPage() {
  const localArticles = useMemo(() => localArticlesData.map((item) => normalizeArticleData(item)), []);
  const [articlesData, setArticlesData] = useState(localArticles);
  const [activeFilter, setActiveFilter] = useState('Todos');
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
  }, [activeFilter]);

  const filteredArticles = useMemo(
    () =>
      articlesData
        .filter((article) => isArticleInFilter(article, activeFilter))
        .sort((a, b) => {
          const priorityDelta = getBlogEditorialPriority(a.slug) - getBlogEditorialPriority(b.slug);
          if (priorityDelta !== 0) return priorityDelta;
          return new Date(b.publishedAt) - new Date(a.publishedAt);
        }),
    [activeFilter, articlesData]
  );

  const visibleArticles = filteredArticles.slice(0, visibleCount);
  const hasMore = filteredArticles.length > visibleCount;

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

      <div className="inner-hero" style={{ background: 'var(--bg-primary)' }}>
        <div className="container">
          <div className="inner-hero-badge">Conteúdo</div>
          <h1>
            Educação <span className="text-accent">financeira</span>
          </h1>
          <p className="section-desc">
            Artigos, guias e análises para você tomar decisões com mais consciência e menos pressa.
          </p>
        </div>
      </div>

      <section className="section-pad" style={{ background: 'var(--light-bg)' }}>
        <div className="container">
          <AdSenseBlock adSlot={ADSENSE_PLATFORM_SLOTS.blogTop} minHeight={120} />

          <div className="filter-tabs" style={{ marginBottom: 28, marginTop: 0 }}>
            {FILTERS.map((filter) => (
              <button
                key={filter}
                type="button"
                className={`filter-tab ${activeFilter === filter ? 'active' : ''}`}
                onClick={() => setActiveFilter(filter)}
              >
                {filter}
              </button>
            ))}
          </div>

          <div className="blog-grid">
            {visibleArticles.map((article) => (
              <BlogCard key={article.slug} article={article} />
            ))}
          </div>

          <AdSenseBlock adSlot={ADSENSE_PLATFORM_SLOTS.blogBottom} minHeight={120} className="mt-adsense" />

          {hasMore ? (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 28 }}>
              <button type="button" className="btn-outline" style={{ borderColor: 'var(--accent-dark)', color: 'var(--accent-dark)' }} onClick={() => setVisibleCount((value) => value + PAGE_SIZE)}>
                Carregar mais artigos
              </button>
            </div>
          ) : null}
        </div>
      </section>
    </>
  );
}

export default BlogPage;
