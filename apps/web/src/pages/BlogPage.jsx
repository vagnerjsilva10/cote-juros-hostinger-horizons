import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { ArrowRight, CalendarDays, Clock, Search } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AdSpace } from '@/components/AdSpace.jsx';
import PageHero from '@/components/PageHero.jsx';
import { portalApi } from '@/platform/services/portalApi.js';

const CATEGORY_THUMBNAILS = {
  emprestimos: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=1200&q=80',
  cartoes: 'https://images.unsplash.com/photo-1601597111158-2fceff292cdc?auto=format&fit=crop&w=1200&q=80',
  financas: 'https://images.unsplash.com/photo-1553729459-efe14ef6055d?auto=format&fit=crop&w=1200&q=80',
  score: 'https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=1200&q=80',
  financiamento: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1200&q=80'
};

const fallbackThumbnail = 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1200&q=80';

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

const resolveArticleSlug = (article) => slugify(article?.slug || article?.title || article?.id || 'artigo');

function BlogPage() {
  const [articlesData, setArticlesData] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Todas');
  const [sort, setSort] = useState('recent');

  useEffect(() => {
    portalApi.getArticles().then((items) => setArticlesData(Array.isArray(items) ? items : []));
  }, []);

  const categories = useMemo(() => {
    const unique = new Set();
    articlesData.forEach((article) => {
      if (article?.category) unique.add(article.category);
    });
    return ['Todas', ...Array.from(unique)];
  }, [articlesData]);

  const filteredArticles = useMemo(() => {
    let result = articlesData.filter((article) => {
      const matchCategory = category === 'Todas' || article.category === category;
      const query = search.toLowerCase();
      const matchSearch =
        article.title.toLowerCase().includes(query) ||
        article.summary.toLowerCase().includes(query);

      return matchCategory && matchSearch;
    });

    if (sort === 'recent') result = [...result].sort((a, b) => new Date(b.publishDate) - new Date(a.publishDate));
    if (sort === 'read') result = [...result].sort((a, b) => (b.readTime || 0) - (a.readTime || 0));

    return result;
  }, [articlesData, category, search, sort]);

  const featured = filteredArticles[0];
  const rest = filteredArticles.slice(1);

  const formatDate = (date) =>
    new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });

  return (
    <>
      <Helmet>
        <title>Blog - Cote Juros</title>
        <meta
          name="description"
          content="Guias e análises para ajudar você a tomar decisões financeiras com mais segurança no dia a dia."
        />
      </Helmet>

      <PageHero
        centered
        badge="Editorial"
        title="Guias e análises para decidir melhor com seu dinheiro."
        subtitle="Conteúdo em linguagem clara para ajudar você a comparar opções, evitar juros altos e escolher com mais confiança."
      >
        <div className="relative mx-auto max-w-xl">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="h-12 rounded-full bg-background pl-11"
            placeholder="Busque por tema, banco ou tipo de crédito"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
      </PageHero>

      <div className="page-shell py-12">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap gap-2">
            {categories.map((item) => (
              <Button
                key={item}
                variant={category === item ? 'default' : 'outline'}
                className="rounded-full"
                onClick={() => setCategory(item)}
              >
                {item}
              </Button>
            ))}
          </div>

          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="w-[220px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Mais recente</SelectItem>
              <SelectItem value="read">Mais lido</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {featured ? (
          <Card className="mb-10 overflow-hidden">
            <div className="grid lg:grid-cols-[1.1fr_0.9fr]">
              <div className="min-h-[320px]">
                <img src={resolveArticleImage(featured)} alt={featured.title} className="h-full w-full object-cover" />
              </div>
              <CardContent className="flex flex-col justify-center gap-5 p-10">
                <Badge variant="outline" className="w-fit">Destaque da semana</Badge>
                <h2>{featured.title}</h2>
                <p>{featured.summary}</p>
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-primary" />
                    {formatDate(featured.publishDate)}
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" />
                    {featured.readTime} min de leitura
                  </span>
                </div>
                <Link to={`/blog/${resolveArticleSlug(featured)}`}>
                  <Button className="w-fit">
                    Ler artigo completo <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </div>
          </Card>
        ) : null}

        <div className="grid gap-8 lg:grid-cols-[1fr_280px]">
          <div className="grid gap-5 md:grid-cols-2">
            {rest.map((article, index) => (
              <React.Fragment key={article.id}>
                <Card className="surface-card overflow-hidden">
                  <div className="h-52">
                    <img src={resolveArticleImage(article)} alt={article.title} className="h-full w-full object-cover" />
                  </div>
                  <CardContent className="flex h-full flex-col gap-4 p-8">
                    <div className="flex items-center justify-between gap-3">
                      <Badge variant="outline">{article.category}</Badge>
                      <span className="text-xs text-muted-foreground">{article.readTime} min</span>
                    </div>
                    <h3>{article.title}</h3>
                    <p className="line-clamp-3">{article.summary}</p>
                    <div className="mt-auto flex items-center justify-between border-t border-border pt-4">
                      <span className="text-xs text-muted-foreground">{formatDate(article.publishDate)}</span>
                      <Link to={`/blog/${resolveArticleSlug(article)}`}>
                        <Button variant="link" className="px-0 text-primary">
                          Ler artigo
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
                {(index + 1) % 4 === 0 ? (
                  <div className="md:col-span-2">
                    <AdSpace height="150px" />
                  </div>
                ) : null}
              </React.Fragment>
            ))}

            {filteredArticles.length === 0 ? (
              <div className="rounded-[16px] border border-dashed border-border bg-background-secondary px-6 py-16 text-center md:col-span-2">
                <h3 className="text-2xl">Nenhum artigo encontrado.</h3>
                <p className="mt-3 text-muted-foreground">Tente outro termo de busca ou escolha uma categoria diferente.</p>
              </div>
            ) : null}
          </div>

          <div className="hidden lg:block">
            <AdSpace height="600px" />
          </div>
        </div>
      </div>
    </>
  );
}

export default BlogPage;
