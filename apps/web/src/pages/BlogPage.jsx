import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { ArrowRight, Search, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AdSpace, ADSENSE_SLOT_IDS } from '@/components/AdSpace.jsx';
import PageHero from '@/components/PageHero.jsx';
import BlogArticleCard from '@/components/BlogArticleCard.jsx';
import { portalApi } from '@/platform/services/portalApi.js';
import { getArticleCategoryKey, getArticleImage, getArticleSummary } from '@/lib/content/articles.js';

const CATEGORY_THUMBNAILS = {
  emprestimos: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=1200&q=80',
  cartoes: 'https://images.unsplash.com/photo-1601597111158-2fceff292cdc?auto=format&fit=crop&w=1200&q=80',
  financas: 'https://images.unsplash.com/photo-1553729459-efe14ef6055d?auto=format&fit=crop&w=1200&q=80',
  score: 'https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=1200&q=80',
  financiamento: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1200&q=80',
  educacao: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1200&q=80'
};

const fallbackThumbnail = CATEGORY_THUMBNAILS.educacao;
const PAGE_SIZE = 9;

const normalize = (value = '') =>
  String(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

const resolveArticleImage = (article) => {
  const existing = getArticleImage(article, '');
  if (existing) return existing;

  const categoryKey = getArticleCategoryKey(article);
  if (categoryKey.includes('emprest')) return CATEGORY_THUMBNAILS.emprestimos;
  if (categoryKey.includes('cart')) return CATEGORY_THUMBNAILS.cartoes;
  if (categoryKey.includes('score')) return CATEGORY_THUMBNAILS.score;
  if (categoryKey.includes('financi')) return CATEGORY_THUMBNAILS.financiamento;
  if (categoryKey.includes('educ') || categoryKey.includes('organiz')) return CATEGORY_THUMBNAILS.educacao;
  if (categoryKey.includes('finan')) return CATEGORY_THUMBNAILS.financas;

  return fallbackThumbnail;
};

const getCategoryDescription = (category) => {
  const key = normalize(category);
  if (key.includes('emprest')) return 'Análises sobre taxa, CET, prazo e comparação entre propostas.';
  if (key.includes('cart')) return 'Guias sobre anuidade, limite, score e uso responsável do cartão.';
  if (key.includes('score')) return 'Conteúdo para entender score, aprovação e construção de histórico.';
  if (key.includes('financi')) return 'Leituras sobre entrada, amortização, CET e custo total.';
  if (key.includes('divid')) return 'Estratégias para reorganizar dívidas, renegociar e recuperar fôlego.';
  return 'Conteúdo editorial para tomar decisões financeiras com mais clareza.';
};

function BlogPage() {
  const [articlesData, setArticlesData] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Todas');
  const [sort, setSort] = useState('recent');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    portalApi.getArticles().then((items) => setArticlesData(Array.isArray(items) ? items : []));
  }, []);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [search, category, sort]);

  const categories = useMemo(() => {
    const grouped = new Map();
    articlesData.forEach((article) => {
      if (!article?.category) return;
      grouped.set(article.category, (grouped.get(article.category) || 0) + 1);
    });
    return [
      { label: 'Todas', count: articlesData.length },
      ...Array.from(grouped.entries()).map(([label, count]) => ({ label, count }))
    ];
  }, [articlesData]);

  const filteredArticles = useMemo(() => {
    let result = articlesData.filter((article) => {
      const matchCategory = category === 'Todas' || article.category === category;
      const query = search.toLowerCase();
      const haystack = `${article.title || ''} ${getArticleSummary(article)} ${(article.keywords || []).join(' ')}`.toLowerCase();
      return matchCategory && haystack.includes(query);
    });

    if (sort === 'recent') result = [...result].sort((a, b) => new Date(b.publishDate) - new Date(a.publishDate));
    if (sort === 'read') result = [...result].sort((a, b) => (b.readTime || 0) - (a.readTime || 0));
    if (sort === 'title') result = [...result].sort((a, b) => String(a.title || '').localeCompare(String(b.title || ''), 'pt-BR'));

    return result;
  }, [articlesData, category, search, sort]);

  const featured = filteredArticles[0];
  const visibleArticles = filteredArticles.slice(1, visibleCount + 1);
  const hasMore = filteredArticles.length > visibleCount + 1;
  const selectedCategory = categories.find((item) => item.label === category);

  const formatDate = (date) =>
    new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });

  return (
    <>
      <Helmet>
        <title>Blog Cote Juros | guias sobre crédito, juros, cartão e financiamento</title>
        <meta
          name="description"
          content="Veja guias em português sobre empréstimo, cartão de crédito, score, financiamento, juros abusivos e educação financeira prática."
        />
        <link rel="canonical" href="https://www.cotejuros.com.br/blog" />
      </Helmet>

      <PageHero
        centered
        badge="Editorial"
        title="Um hub editorial para comparar crédito com mais clareza."
        subtitle="Explore guias sobre empréstimos, cartões, score, dívidas e financiamento com navegação simples, leitura objetiva e próximos passos sempre disponíveis."
      >
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="h-12 rounded-full bg-background pl-11"
              placeholder="Busque por empréstimo, score, cartão, dívida ou financiamento"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <div className="flex flex-wrap justify-center gap-2">
            {categories.slice(0, 6).map((item) => (
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

      <div className="page-shell space-y-12 py-10 md:py-12">
        <section className="grid gap-4 rounded-[24px] border border-border bg-white p-5 md:grid-cols-[1fr_240px] md:p-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="outline">{selectedCategory?.label || 'Todas'}</Badge>
              <span className="text-sm text-muted-foreground">{filteredArticles.length} artigos encontrados</span>
            </div>
            <h2 className="text-2xl text-foreground">Navegue por tema, compare contextos e continue a leitura com facilidade.</h2>
            <p className="max-w-3xl text-muted-foreground">
              {category === 'Todas'
                ? 'O blog foi organizado como um hub editorial para ajudar você a descobrir artigos relacionados, voltar para categorias e seguir para simuladores e diagnósticos quando fizer sentido.'
                : getCategoryDescription(category)}
            </p>
          </div>

          <div className="flex flex-col gap-3 md:items-end">
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className="w-full md:w-[220px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Mais recentes</SelectItem>
                <SelectItem value="read">Leituras mais longas</SelectItem>
                <SelectItem value="title">Ordem alfabética</SelectItem>
              </SelectContent>
            </Select>
            <a href="https://finance.cotejuros.com.br/quiz" className="w-full md:w-auto">
              <Button className="w-full md:w-auto">
                Fazer diagnóstico financeiro
                <ArrowRight className="h-4 w-4" />
              </Button>
            </a>
          </div>
        </section>

        {featured ? (
          <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <Link
              to={`/blog/${featured.slug}`}
              className="group relative overflow-hidden rounded-[28px] border border-border bg-white shadow-[0_18px_45px_rgba(15,23,42,0.08)] transition-all duration-200 hover:-translate-y-1 hover:border-primary/30 hover:shadow-[0_24px_60px_rgba(15,23,42,0.14)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2"
            >
              <div className="grid h-full lg:grid-cols-[1.05fr_0.95fr]">
                <div className="min-h-[280px] overflow-hidden">
                  <img src={resolveArticleImage(featured)} alt={featured.title} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" />
                </div>
                <div className="flex flex-col justify-center gap-5 p-6 md:p-8">
                  <Badge variant="outline" className="w-fit">Destaque editorial</Badge>
                  <div className="space-y-3">
                    <h2 className="text-balance text-3xl text-foreground">{featured.title}</h2>
                    <p className="text-base leading-7 text-muted-foreground">{getArticleSummary(featured)}</p>
                  </div>
                  <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                    <span>{featured.category}</span>
                    <span>•</span>
                    <span>{formatDate(featured.publishDate)}</span>
                    <span>•</span>
                    <span>{featured.readTime} min</span>
                  </div>
                  <div className="inline-flex items-center gap-2 font-medium text-primary">
                    Ler destaque
                    <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                  </div>
                </div>
              </div>
            </Link>

            <div className="flex flex-col gap-4">
              <div className="rounded-[24px] border border-border bg-background-secondary p-6">
                <div className="flex items-center gap-2 text-primary">
                  <Sparkles className="h-4 w-4" />
                  <p className="text-sm font-semibold uppercase tracking-[0.18em]">Próximo passo</p>
                </div>
                <h3 className="mt-3 text-2xl text-foreground">Quer entender seu caso com mais contexto?</h3>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">
                  O Cote Finance AI ajuda você a organizar o momento financeiro, enxergar onde o dinheiro está indo e priorizar decisões antes de contratar crédito.
                </p>
                <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                  <a href="https://finance.cotejuros.com.br/quiz" className="inline-flex">
                    <Button>Fazer diagnóstico financeiro</Button>
                  </a>
                  <Link to="/cote-finance-ai" className="inline-flex">
                    <Button variant="outline">Entender como funciona</Button>
                  </Link>
                </div>
              </div>
              <AdSpace height="220px" adSlot={ADSENSE_SLOT_IDS.inContent} />
            </div>
          </section>
        ) : null}

        <section className="grid gap-8 lg:grid-cols-[1fr_280px]">
          <div className="space-y-8">
            <div className="space-y-3">
              <h2 className="text-2xl text-foreground">Artigos recentes e relacionados</h2>
              <p className="text-muted-foreground">
                Todos os cards abaixo são clicáveis e pensados para manter a leitura fluida, com descoberta contínua entre temas próximos.
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {visibleArticles.map((article, index) => (
                <React.Fragment key={article.id}>
                  <BlogArticleCard article={article} image={resolveArticleImage(article)} formatDate={formatDate} />
                  {(index + 1) % 6 === 0 ? (
                    <div className="md:col-span-2 xl:col-span-3">
                      <AdSpace height="150px" adSlot={ADSENSE_SLOT_IDS.feed} />
                    </div>
                  ) : null}
                </React.Fragment>
              ))}

              {filteredArticles.length === 0 ? (
                <div className="rounded-[16px] border border-dashed border-border bg-background-secondary px-6 py-16 text-center md:col-span-2 xl:col-span-3">
                  <h3 className="text-2xl">Nenhum artigo encontrado.</h3>
                  <p className="mt-3 text-muted-foreground">Tente outro termo de busca ou escolha uma categoria diferente.</p>
                </div>
              ) : null}
            </div>

            {hasMore ? (
              <div className="flex justify-center">
                <Button variant="outline" className="rounded-full px-7" onClick={() => setVisibleCount((current) => current + PAGE_SIZE)}>
                  Carregar mais artigos
                </Button>
              </div>
            ) : null}
          </div>

          <aside className="space-y-5 lg:sticky lg:top-24 lg:h-fit">
            <div className="rounded-[22px] border border-border bg-white p-5">
              <h3 className="text-xl text-foreground">Categorias do hub</h3>
              <div className="mt-4 space-y-3">
                {categories.slice(1).map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => setCategory(item.label)}
                    className="flex w-full items-center justify-between rounded-[14px] border border-border px-4 py-3 text-left transition-colors hover:border-primary/35 hover:bg-primary/[0.03]"
                  >
                    <span className="text-sm font-medium text-foreground">{item.label}</span>
                    <span className="text-xs text-muted-foreground">{item.count}</span>
                  </button>
                ))}
              </div>
            </div>

            <AdSpace height="600px" adSlot={ADSENSE_SLOT_IDS.sidebar} />
          </aside>
        </section>
      </div>
    </>
  );
}

export default BlogPage;
