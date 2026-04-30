import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CalendarDays, CheckCircle2, Clock, Home, ShieldCheck } from 'lucide-react';
import AdSenseBlock, { ADSENSE_PLATFORM_SLOTS } from '@/components/AdSenseBlock.jsx';
import { portalApi } from '@/platform/services/portalApi.js';
import {
  buildArticleToc,
  getArticleCategoryKey,
  getArticleImage,
  getArticleImageCandidates,
  getArticlePath,
  getArticleParagraphs,
  getArticleSummary,
  getEditorialTitle,
  normalizeArticleData,
  resolveArticleBySlug
} from '@/lib/content/articles.js';
import { articlesData } from '@/data/articlesData.js';
import { normalizeMojibakeDeep } from '@/lib/textEncoding.js';

const BLOG_BASE_URL = 'https://www.cotejuros.com.br/blog';
const SITE_LOGO_URL = 'https://www.cotejuros.com.br/brand/cote-juros-logo.svg';

const CATEGORY_ROUTES = normalizeMojibakeDeep([
  { match: 'emprest', path: '/emprestimos', label: 'Empréstimos' },
  { match: 'cart', path: '/cartoes', label: 'Cartões' },
  { match: 'score', path: '/blog/score-de-credito-como-funciona', label: 'Score' },
  { match: 'financi', path: '/financiamentos', label: 'Financiamentos' },
  { match: 'educ', path: '/blog', label: 'Educação financeira' }
]);

const INTERNAL_LINK_KEYWORDS = normalizeMojibakeDeep([
  { keyword: 'empréstimo pessoal', path: '/emprestimos' },
  { keyword: 'empréstimo', path: '/emprestimos' },
  { keyword: 'crédito', path: '/emprestimos' },
  { keyword: 'cartão de crédito', path: '/cartoes' },
  { keyword: 'cartão', path: '/cartoes' },
  { keyword: 'score', path: '/blog/score-de-credito-como-funciona' },
  { keyword: 'financiamento', path: '/financiamentos' },
  { keyword: 'dívidas', path: '/blog/como-sair-das-dividas' },
  { keyword: 'juros', path: '/blog/como-comparar-taxas-de-juros' }
]);

const CATEGORY_VISUALS = {
  emprestimos: ['#edf2ff', '#dff7f0', '#5b6cff'],
  cartoes: ['#eefbf7', '#e9efff', '#10b981'],
  financiamento: ['#fff7ed', '#eff6ff', '#f59e0b'],
  score: ['#f5f3ff', '#eff6ff', '#7c3aed'],
  default: ['#f8fafc', '#eef2ff', '#5b6cff']
};

const formatDate = (date) =>
  new Date(date).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

const normalizeIntentText = (value = '') =>
  String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

const tokenizeEditorialText = (value = '') =>
  normalizeIntentText(value)
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length > 2);

const getCategoryRoute = (article) => {
  const key = getArticleCategoryKey(article);
  return CATEGORY_ROUTES.find((item) => key.includes(item.match)) || { path: '/blog', label: article?.category || 'Blog' };
};

const getVisualPalette = (article = {}) => {
  const key = getArticleCategoryKey(article);
  if (key.includes('cart')) return CATEGORY_VISUALS.cartoes;
  if (key.includes('financi')) return CATEGORY_VISUALS.financiamento;
  if (key.includes('score')) return CATEGORY_VISUALS.score;
  if (key.includes('emprest')) return CATEGORY_VISUALS.emprestimos;
  return CATEGORY_VISUALS.default;
};

const buildArticleFaq = (article) => {
  if (Array.isArray(article?.faq) && article.faq.length) return article.faq;

  const title = getEditorialTitle(article) || article?.title || 'este tema';
  const category = article?.category || 'finanças pessoais';

  return [
    {
      question: `${title} vale para qualquer perfil financeiro?`,
      answer: 'Depende da renda, das dívidas atuais, do objetivo e do momento. Use o guia como ponto de partida e compare opções antes de contratar.'
    },
    {
      question: `O que comparar primeiro em ${category.toLowerCase()}?`,
      answer: 'Comece pelo custo total, prazo, impacto da parcela no orçamento e reputação da instituição. Evite decidir apenas pela menor parcela.'
    },
    {
      question: 'A Cote Juros cobra para mostrar opções?',
      answer: 'Não há cobrança antecipada para consultar conteúdos e caminhos de comparação. A decisão final deve ser tomada com calma e sem compromisso.'
    }
  ];
};

const toFaqSchema = (article) => {
  const faq = buildArticleFaq(article);
  if (!faq.length) return null;

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer
      }
    }))
  };
};

const getSemanticArticleLinks = (article, articles, count = 6) => {
  const baseTokens = new Set(tokenizeEditorialText([article?.title, article?.h1, article?.category, article?.summary, ...(article?.tags || [])].join(' ')));
  const currentCategory = getArticleCategoryKey(article);

  return (Array.isArray(articles) ? articles : [])
    .map((item) => normalizeArticleData(item))
    .filter((candidate) => candidate.slug !== article.slug)
    .map((candidate) => {
      const candidateTokens = tokenizeEditorialText([candidate.title, candidate.h1, candidate.category, candidate.summary, ...(candidate.tags || [])].join(' '));
      const sharedTokens = candidateTokens.filter((token) => baseTokens.has(token)).length;
      const sameCategory = getArticleCategoryKey(candidate) === currentCategory ? 1 : 0;

      return {
        candidate,
        score: sharedTokens * 2 + sameCategory * 8
      };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return new Date(b.candidate.publishedAt) - new Date(a.candidate.publishedAt);
    })
    .slice(0, count)
    .map(({ candidate }) => ({
      path: getArticlePath(candidate),
      title: getEditorialTitle(candidate),
      summary: getArticleSummary(candidate),
      article: candidate
    }));
};

export const injectInternalLinks = (content, usedKeywords = new Set()) => {
  const text = String(content || '');
  if (!text) return text;

  const normalizedText = normalizeIntentText(text);
  const match = INTERNAL_LINK_KEYWORDS.find((item) => {
    const normalizedKeyword = normalizeIntentText(item.keyword);
    return !usedKeywords.has(normalizedKeyword) && normalizedText.includes(normalizedKeyword);
  });

  if (!match) return text;

  const normalizedKeyword = normalizeIntentText(match.keyword);
  const pattern = new RegExp(`(${match.keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'i');
  const parts = text.split(pattern);
  if (parts.length < 3) return text;

  usedKeywords.add(normalizedKeyword);

  return parts.map((part, index) => {
    if (index === 1) {
      return (
        <Link key={`${match.path}-${normalizedKeyword}`} to={match.path} className="cj-article-inline-link">
          {part}
        </Link>
      );
    }

    return part;
  });
};

function ArticleVisual({ article, title, className = '', imageClassName = '', reserveImage, priority = false }) {
  const imageSet = useMemo(() => getArticleImageCandidates(article), [article]);
  const [srcIndex, setSrcIndex] = useState(0);
  const sources = useMemo(() => [imageSet.primary, ...imageSet.fallbacks].filter(Boolean), [imageSet]);
  const currentSrc = sources[srcIndex];
  const shouldUseImage = Boolean(currentSrc && (!reserveImage || !reserveImage(currentSrc)));
  const palette = getVisualPalette(article);

  useEffect(() => {
    setSrcIndex(0);
  }, [imageSet.primary]);

  if (!shouldUseImage) {
    return (
      <div
        className={`cj-article-visual-fallback ${className}`}
        style={{
          '--fallback-a': palette[0],
          '--fallback-b': palette[1],
          '--fallback-c': palette[2]
        }}
        aria-label={`Imagem editorial para ${title}`}
        role="img"
      >
        <span>{article?.category || 'Cote Juros'}</span>
      </div>
    );
  }

  return (
    <img
      src={currentSrc}
      alt={article?.coverImageAlt || article?.imageAlt || title}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      width={priority ? '1200' : '640'}
      height={priority ? '630' : '360'}
      onError={() => setSrcIndex((current) => Math.min(current + 1, sources.length - 1))}
      className={`${className} ${imageClassName}`.trim()}
    />
  );
}

function PremiumAd({ position = 'article' }) {
  const isSidebar = position === 'sidebar';

  return (
    <AdSenseBlock
      adSlot={isSidebar ? ADSENSE_PLATFORM_SLOTS.articleSidebar : ADSENSE_PLATFORM_SLOTS.articleInline}
      className={`cj-article-ad cj-article-ad--${position}`}
      format={isSidebar ? 'auto' : 'fluid'}
      layout={isSidebar ? undefined : 'in-article'}
      minHeight={isSidebar ? 118 : 96}
      theme="light"
    />
  );
}

function RelatedArticleCard({ item, reserveImage }) {
  return (
    <Link to={item.path} className="cj-article-related-card">
      <ArticleVisual article={item.article} title={item.title} reserveImage={reserveImage} className="cj-article-related-media" />
      <div>
        <span>{item.article?.category || 'Guia'}</span>
        <h3>{item.title}</h3>
        <p>{item.summary}</p>
      </div>
    </Link>
  );
}

function SidebarLink({ item, reserveImage }) {
  return (
    <Link to={item.path} className="cj-article-sidebar-link">
      <ArticleVisual article={item.article} title={item.title} reserveImage={reserveImage} className="cj-article-sidebar-media" />
      <div>
        <span>{item.title}</span>
        <p>{item.summary}</p>
      </div>
    </Link>
  );
}

function BlogArticlePage({ articleSlugOverride = '' }) {
  const { articleSlug } = useParams();
  const resolvedSlug = articleSlugOverride || articleSlug;
  const localArticles = useMemo(() => articlesData.map((item) => normalizeArticleData(item)), []);
  const localArticle = useMemo(
    () => resolveArticleBySlug({ slug: resolvedSlug, articles: localArticles }),
    [resolvedSlug, localArticles]
  );
  const [articles, setArticles] = useState(localArticles);
  const [article, setArticle] = useState(localArticle);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    let active = true;
    setLoadError('');
    setArticles(localArticles);
    setArticle(localArticle);

    Promise.all([portalApi.getArticles({ sort: 'recent' }), portalApi.getArticleBySlug(resolvedSlug)])
      .then(([items, articleData]) => {
        if (!active) return;

        const articleList = Array.isArray(items) ? items.map((item) => normalizeArticleData(item)) : [];
        const safeArticle = resolveArticleBySlug({
          slug: resolvedSlug,
          directArticle: articleData,
          articles: articleList
        });

        setArticles(articleList.length ? articleList : localArticles);
        setArticle(safeArticle || localArticle || null);
      })
      .catch((error) => {
        console.error('[blog-article-page] erro ao carregar artigo', error);
        if (!active) return;
        setLoadError('Não foi possível carregar este artigo agora.');
        setArticles(localArticles);
        setArticle(localArticle || null);
      });

    return () => {
      active = false;
    };
  }, [resolvedSlug, localArticle, localArticles]);

  const safeArticle = useMemo(() => (article ? normalizeMojibakeDeep(normalizeArticleData(article)) : null), [article]);
  const categoryRoute = useMemo(
    () => (safeArticle ? getCategoryRoute(safeArticle) : { path: '/blog', label: 'Blog' }),
    [safeArticle]
  );
  const tocItems = useMemo(() => {
    if (!safeArticle) return [];
    const items = buildArticleToc(safeArticle);
    if (!items.some((item) => item.id === 'faq')) return [...items, { id: 'faq', label: 'Perguntas frequentes' }];
    return items;
  }, [safeArticle]);

  const relatedArticles = useMemo(
    () => (safeArticle ? getSemanticArticleLinks(safeArticle, articles, 3) : []),
    [safeArticle, articles]
  );

  const sidebarArticles = useMemo(
    () => (safeArticle ? getSemanticArticleLinks(safeArticle, articles, 4).slice(0, 3) : []),
    [safeArticle, articles]
  );

  if (!safeArticle) {
    return (
      <main className="cj-article-page">
        <section className="cj-article-not-found">
          <p>Blog Cote Juros</p>
          <h1>Artigo não encontrado</h1>
          <span>{loadError || 'Esse conteúdo pode ter sido movido, renomeado ou removido.'}</span>
          <Link to="/blog" className="btn-primary">
            Voltar para o blog
          </Link>
        </section>
      </main>
    );
  }

  const editorialTitle = getEditorialTitle(safeArticle);
  const canonicalUrl = safeArticle.canonicalUrl || `https://www.cotejuros.com.br${getArticlePath(safeArticle)}/`;
  const socialImage = safeArticle.ogImage || getArticleImage(safeArticle);
  const faqItems = buildArticleFaq(safeArticle);
  const faqSchema = toFaqSchema(safeArticle);
  const introParagraphs = getArticleParagraphs(safeArticle).slice(0, 3);
  const sections = Array.isArray(safeArticle.sections) ? safeArticle.sections : [];
  const midSectionIndex = sections.length > 1 ? Math.floor(sections.length / 2) : 0;
  const usedInternalLinkKeywords = new Set();
  const usedRelatedImages = new Set([socialImage].filter(Boolean));
  const reserveRelatedImage = (src) => {
    if (!src) return false;
    if (usedRelatedImages.has(src)) return true;
    usedRelatedImages.add(src);
    return false;
  };
  const renderLinkedText = (paragraph) => injectInternalLinks(paragraph, usedInternalLinkKeywords);

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Início', item: 'https://www.cotejuros.com.br/' },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: BLOG_BASE_URL },
      { '@type': 'ListItem', position: 3, name: editorialTitle, item: canonicalUrl }
    ]
  };

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: safeArticle.metaTitle || editorialTitle,
    description: safeArticle.metaDescription || getArticleSummary(safeArticle),
    image: [socialImage],
    datePublished: safeArticle.publishedAt,
    dateModified: safeArticle.updatedAt,
    mainEntityOfPage: canonicalUrl,
    author: {
      '@type': 'Person',
      name: safeArticle.author
    },
    publisher: {
      '@type': 'Organization',
      name: 'Cote Juros',
      logo: {
        '@type': 'ImageObject',
        url: SITE_LOGO_URL
      }
    },
    articleSection: safeArticle.category,
    keywords: safeArticle.tags.join(', ')
  };

  return (
    <>
      <Helmet>
        <title>{safeArticle.metaTitle || safeArticle.seoTitle || `${editorialTitle} | Blog Cote Juros`}</title>
        <meta name="description" content={safeArticle.metaDescription || getArticleSummary(safeArticle)} />
        <meta name="robots" content="index,follow,max-image-preview:large" />
        <meta property="og:type" content="article" />
        <meta property="og:title" content={safeArticle.metaTitle || editorialTitle} />
        <meta property="og:description" content={safeArticle.metaDescription || getArticleSummary(safeArticle)} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:image" content={socialImage} />
        <meta property="article:published_time" content={safeArticle.publishedAt} />
        <meta property="article:modified_time" content={safeArticle.updatedAt} />
        <meta property="article:author" content={safeArticle.author} />
        <meta property="article:section" content={safeArticle.category} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={safeArticle.metaTitle || editorialTitle} />
        <meta name="twitter:description" content={safeArticle.metaDescription || getArticleSummary(safeArticle)} />
        <meta name="twitter:image" content={socialImage} />
        <link rel="canonical" href={canonicalUrl} />
        <script type="application/ld+json">{JSON.stringify(articleSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>
        {faqSchema ? <script type="application/ld+json">{JSON.stringify(faqSchema)}</script> : null}
      </Helmet>

      <main className="cj-article-page">
        <section className="cj-article-hero">
          <div className="cj-article-shell">
            <nav aria-label="Breadcrumb" className="cj-article-breadcrumb">
              <Link to="/">
                <Home className="h-4 w-4" />
                Início
              </Link>
              <span>/</span>
              <Link to="/blog">Blog</Link>
              <span>/</span>
              <span>{editorialTitle}</span>
            </nav>

            <Link to="/blog" className="cj-article-back">
              <ArrowLeft className="h-4 w-4" />
              Voltar ao blog
            </Link>

            <div className="cj-article-hero-card">
              <ArticleVisual article={safeArticle} title={editorialTitle} className="cj-article-hero-image" priority />
              <div className="cj-article-hero-shade" />
              <div className="cj-article-hero-copy">
                <Link to={categoryRoute.path} className="cj-article-category">
                  {safeArticle.category || 'Educação financeira'}
                </Link>
                <h1>{safeArticle.h1 || editorialTitle}</h1>
                <p>{getArticleSummary(safeArticle)}</p>
                <div className="cj-article-meta">
                  <span>
                    <CalendarDays className="h-4 w-4" />
                    Atualizado em {formatDate(safeArticle.updatedAt || safeArticle.publishedAt)}
                  </span>
                  <span>{safeArticle.author}</span>
                  <span>
                    <Clock className="h-4 w-4" />
                    {safeArticle.readingTime || safeArticle.readTime || 6} min
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="cj-article-content-band">
          <div className="cj-article-shell cj-article-grid">
            <article className="cj-article-main">
              {tocItems.length ? (
                <aside className="cj-article-toc" aria-label="Sumário do artigo">
                  <span>Neste artigo</span>
                  <div>
                    {tocItems.slice(0, 6).map((item) => (
                      <a key={item.id} href={`#${item.id}`}>
                        {item.label}
                      </a>
                    ))}
                  </div>
                </aside>
              ) : null}

              <div className="cj-article-prose">
                {introParagraphs.map((paragraph, index) => (
                  <React.Fragment key={`intro-${index}`}>
                    <p>{renderLinkedText(paragraph)}</p>
                    {index === 1 ? <PremiumAd position="article" /> : null}
                  </React.Fragment>
                ))}

                {safeArticle.featuredSnippet ? (
                  <section className="cj-article-note">
                    <span>Resposta rápida</span>
                    <p>{safeArticle.featuredSnippet}</p>
                  </section>
                ) : null}

                {sections.map((section, index) => (
                  <React.Fragment key={`section-${index}`}>
                    <section id={`secao-${index + 1}`} className="cj-article-section">
                      <h2>{section.heading}</h2>
                      {section.paragraphs?.map((paragraph, paragraphIndex) => (
                        <p key={`section-${index}-p-${paragraphIndex}`}>{renderLinkedText(paragraph)}</p>
                      ))}
                      {section.bullets?.length ? (
                        <ul>
                          {section.bullets.map((bullet, bulletIndex) => (
                            <li key={`section-${index}-b-${bulletIndex}`}>{bullet}</li>
                          ))}
                        </ul>
                      ) : null}
                    </section>
                    {index === midSectionIndex ? <PremiumAd position="article" /> : null}
                  </React.Fragment>
                ))}

                {Array.isArray(safeArticle.conclusion) && safeArticle.conclusion.length ? (
                  <section id="conclusao" className="cj-article-section">
                    <h2>Conclusão</h2>
                    {safeArticle.conclusion.map((paragraph, index) => (
                      <p key={`conclusion-${index}`}>{renderLinkedText(paragraph)}</p>
                    ))}
                  </section>
                ) : null}

                {relatedArticles.length ? (
                  <section className="cj-article-related-panel" aria-label="Leituras relacionadas">
                    <div className="cj-article-section-heading">
                      <span>Continue lendo</span>
                      <h2>Guias relacionados para comparar melhor</h2>
                    </div>
                    <div className="cj-article-related-grid">
                      {relatedArticles.map((item) => (
                        <RelatedArticleCard key={item.path} item={item} reserveImage={reserveRelatedImage} />
                      ))}
                    </div>
                  </section>
                ) : null}

                {faqItems.length ? (
                  <section id="faq" className="cj-article-faq">
                    <div className="cj-article-section-heading">
                      <span>Dúvidas comuns</span>
                      <h2>Perguntas frequentes</h2>
                    </div>
                    {faqItems.map((item, index) => (
                      <details key={`faq-${index}`} open={index === 0}>
                        <summary>{item.question}</summary>
                        <p>{item.answer}</p>
                      </details>
                    ))}
                  </section>
                ) : null}

                <section className="cj-article-final-cta">
                  <span>Próximo passo</span>
                  <h2>Veja opções de crédito que fazem sentido para você</h2>
                  <p>Compare caminhos possíveis com clareza, sem promessa falsa e sem cobrança antecipada.</p>
                  <div>
                    <span>
                      <CheckCircle2 className="h-4 w-4" />
                      Sem cobrança antecipada
                    </span>
                    <span>
                      <CheckCircle2 className="h-4 w-4" />
                      Sem compromisso
                    </span>
                  </div>
                  <Link to="/emprestimos" className="btn-primary">
                    Ver minhas opções agora
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </section>
              </div>
            </article>

            <aside className="cj-article-sidebar" aria-label="Ações e leituras recomendadas">
              <section className="cj-article-sidebar-cta">
                <ShieldCheck className="h-5 w-5" />
                <span>Crédito com clareza</span>
                <h2>Veja opções de crédito para seu perfil</h2>
                <p>Compare alternativas sem cobrança antecipada e avance só quando fizer sentido.</p>
                <Link to="/emprestimos" className="btn-primary cj-article-sidebar-button">
                  Ver opções
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </section>

              {sidebarArticles.length ? (
                <section className="cj-article-sidebar-card">
                  <h2>Artigos populares</h2>
                  <div>
                    {sidebarArticles.map((item) => (
                      <SidebarLink key={`sidebar-${item.path}`} item={item} reserveImage={reserveRelatedImage} />
                    ))}
                  </div>
                </section>
              ) : null}

              <PremiumAd position="sidebar" />
            </aside>
          </div>
        </section>
      </main>
    </>
  );
}

export default BlogArticlePage;
