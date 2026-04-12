import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { ArrowRight, Search, Sparkles, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { AdSpace, ADSENSE_SLOT_IDS } from '@/components/AdSpace.jsx';
import PageHero from '@/components/PageHero.jsx';
import BlogArticleCard from '@/components/BlogArticleCard.jsx';
import { portalApi } from '@/platform/services/portalApi.js';
import { getArticleCategoryKey, getArticleImage, getArticleSummary, normalizeArticleSlug } from '@/lib/content/articles.js';

const PAGE_SIZE = 9;

const CATEGORY_DESCRIPTIONS = {
  emprestimos: 'Leituras para comparar taxa, CET, parcela e custo total com mais critério.',
  cartoes: 'Guias sobre limite, anuidade, score, benefícios e uso saudável do cartão.',
  score: 'Conteúdo para entender aprovação, histórico financeiro e construção de crédito.',
  financiamento: 'Explicações sobre entrada, prazo, amortização, CET e custo final.',
  organizacao: 'Textos para reorganizar o orçamento, priorizar metas e recuperar margem.',
  dividas: 'Rotas práticas para renegociação, quitação e redução de pressão financeira.'
};

const fallbackImage =
  'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1600&q=80';

const getCategoryDescription = (articleCategory = '') => {
  const categoryKey = String(articleCategory)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

  if (categoryKey.includes('emprest')) return CATEGORY_DESCRIPTIONS.emprestimos;
  if (categoryKey.includes('cart')) return CATEGORY_DESCRIPTIONS.cartoes;
  if (categoryKey.includes('score')) return CATEGORY_DESCRIPTIONS.score;
  if (categoryKey.includes('financi')) return CATEGORY_DESCRIPTIONS.financiamento;
  if (categoryKey.includes('organiz')) return CATEGORY_DESCRIPTIONS.organizacao;
  if (categoryKey.includes('divid')) return CATEGORY_DESCRIPTIONS.dividas;
  return 'Conteúdo editorial para decidir melhor antes de contratar crédito.';
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
  const popularGuides = [...filteredArticles].slice(1).sort((a, b) => (b.readTime || 0) - (a.readTime || 0)).slice(0, 3);
  const latestArticles = filteredArticles.slice(1, visibleCount + 1);
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
          content="Explore guias da Cote Juros sobre empréstimo, cartões, score, renegociação, financiamento e educação financeira prática."
        />
        <link rel="canonical" href="https://www.cotejuros.com.br/blog" />
      </Helmet>

      <PageHero
        centered
        badge="Editorial Cote Juros"
        title="Guias para comparar crédito, juros e financiamento com mais clareza."
        subtitle="O blog da Cote Juros reúne análises, comparações e explicações práticas para quem quer decidir melhor antes de contratar crédito."
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

      <div className="page-shell space-y-10 py-10 md:space-y-12 md:py-12">
        <section className="grid gap-4 rounded-[24px] border border-border bg-white p-5 md:grid-cols-[1fr_240px] md:p-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="outline">{selectedCategory?.label || 'Todas'}</Badge>
              <span className="text-sm text-muted-foreground">{filteredArticles.length} artigos encontrados</span>
            </div>
            <h2 className="text-2xl text-foreground">Navegação editorial clara, com rotas de leitura que fazem sentido.</h2>
            <p className="max-w-3xl text-muted-foreground">
              {category === 'Todas'
                ? 'Comece pelo destaque editorial, aprofunde com os guias mais lidos e siga por categoria até encontrar o conteúdo mais próximo do seu momento.'
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
                <SelectItem value="read">Guias mais completos</SelectItem>
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
          <section className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
            <Link
              to={`/blog/${normalizeArticleSlug(featured)}`}
              className="group relative overflow-hidden rounded-[28px] border border-border bg-white shadow-[0_18px_45px_rgba(15,23,42,0.08)] transition-all duration-200 hover:-translate-y-1 hover:border-primary/30 hover:shadow-[0_24px_60px_rgba(15,23,42,0.14)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2"
            >
              <div className="grid h-full lg:grid-cols-[1.03fr_0.97fr]">
                <div className="min-h-[280px] overflow-hidden bg-slate-100">
                  <img
                    src={getArticleImage(featured, fallbackImage)}
                    alt={featured.title}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                  />
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

            <div className="space-y-4">
              <Card className="border-border bg-background-secondary">
                <CardContent className="space-y-4 p-6">
                  <div className="flex items-center gap-2 text-primary">
                    <TrendingUp className="h-4 w-4" />
                    <p className="text-sm font-semibold uppercase tracking-[0.18em]">Guias em alta</p>
                  </div>
                  <div className="space-y-4">
                    {popularGuides.map((article) => (
                      <Link
                        key={article.id}
                        to={`/blog/${normalizeArticleSlug(article)}`}
                        className="block rounded-[18px] border border-border bg-white px-4 py-4 transition-colors hover:border-primary/35 hover:bg-primary/[0.02]"
                      >
                        <p className="text-sm text-muted-foreground">{article.category}</p>
                        <h3 className="mt-2 text-lg text-foreground">{article.title}</h3>
                        <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">{getArticleSummary(article)}</p>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border bg-white">
                <CardContent className="space-y-4 p-6">
                  <div className="flex items-center gap-2 text-primary">
                    <Sparkles className="h-4 w-4" />
                    <p className="text-sm font-semibold uppercase tracking-[0.18em]">Próximo passo</p>
                  </div>
                  <h3 className="text-2xl text-foreground">Quer entender seu caso antes de contratar crédito?</h3>
                  <p className="text-sm leading-7 text-muted-foreground">
                    Faça um diagnóstico gratuito no Cote Finance AI para organizar o momento financeiro, visualizar prioridades e decidir com mais contexto.
                  </p>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <a href="https://finance.cotejuros.com.br/quiz" className="inline-flex">
                      <Button>Fazer diagnóstico financeiro</Button>
                    </a>
                    <Link to="/cote-finance-ai" className="inline-flex">
                      <Button variant="outline">Entender como funciona</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>
        ) : null}

        <section className="grid gap-8 lg:grid-cols-[1fr_280px]">
          <div className="space-y-8">
            <div className="space-y-3">
              <h2 className="text-2xl text-foreground">Artigos recentes</h2>
              <p className="text-muted-foreground">
                Conteúdo organizado para manter a leitura fluida, com cards clicáveis, títulos mais úteis e rotas claras para continuar navegando.
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {latestArticles.map((article, index) => (
                <React.Fragment key={article.id}>
                  <BlogArticleCard
                    article={article}
                    image={getArticleImage(article, fallbackImage)}
                    formatDate={formatDate}
                  />
                  {(index + 1) % 6 === 0 ? (
                    <div className="md:col-span-2 xl:col-span-3">
                      <AdSpace height="150px" adSlot={ADSENSE_SLOT_IDS.feed} />
                    </div>
                  ) : null}
                </React.Fragment>
              ))}

              {filteredArticles.length === 0 ? (
                <div className="rounded-[18px] border border-dashed border-border bg-background-secondary px-6 py-16 text-center md:col-span-2 xl:col-span-3">
                  <h3 className="text-2xl text-foreground">Nenhum artigo encontrado</h3>
                  <p className="mt-3 text-muted-foreground">Tente outro termo ou escolha uma categoria diferente.</p>
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
            <Card className="border-border bg-white">
              <CardContent className="space-y-4 p-5">
                <h3 className="text-xl text-foreground">Navegue por assunto</h3>
                <div className="space-y-3">
                  {categories.slice(1).map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => setCategory(item.label)}
                      className="flex w-full items-center justify-between rounded-[14px] border border-border px-4 py-3 text-left transition-colors hover:border-primary/35 hover:bg-primary/[0.03]"
                    >
                      <span className="pr-4 text-sm font-medium text-foreground">{item.label}</span>
                      <span className="text-xs text-muted-foreground">{item.count}</span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-border bg-background-secondary">
              <CardContent className="space-y-3 p-5">
                <h3 className="text-xl text-foreground">Rotas de leitura</h3>
                <p className="text-sm leading-7 text-muted-foreground">
                  Se você está comparando crédito agora, vale seguir por score, cartões e ferramentas de simulação para fechar a leitura com mais contexto.
                </p>
                <div className="space-y-2">
                  <Link to="/emprestimos" className="block text-sm font-medium text-primary hover:underline">Explorar empréstimos</Link>
                  <Link to="/cartoes-de-credito" className="block text-sm font-medium text-primary hover:underline">Explorar cartões de crédito</Link>
                  <Link to="/ferramentas" className="block text-sm font-medium text-primary hover:underline">Abrir simuladores e calculadoras</Link>
                </div>
              </CardContent>
            </Card>

            <AdSpace height="600px" adSlot={ADSENSE_SLOT_IDS.sidebar} />
          </aside>
        </section>
      </div>
    </>
  );
}

export default BlogPage;
