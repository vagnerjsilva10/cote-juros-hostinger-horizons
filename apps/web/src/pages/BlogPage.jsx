import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { ArrowRight, CalendarDays, Clock, Search } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AdSpace } from '@/components/AdSpace.jsx';
import PageHero from '@/components/PageHero.jsx';
import { portalApi } from '@/platform/services/portalApi.js';

const CATEGORIES = ['Todas', 'Emprestimos', 'Cartoes de Credito', 'Financas Pessoais', 'Score de Credito', 'Financiamento'];

function BlogPage() {
  const [articlesData, setArticlesData] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Todas');
  const [sort, setSort] = useState('recent');
  const [selectedArticle, setSelectedArticle] = useState(null);

  useEffect(() => {
    portalApi.getArticles().then(setArticlesData);
  }, []);

  const filteredArticles = useMemo(() => {
    let result = articlesData.filter((article) => {
      const matchCategory = category === 'Todas' || article.category === category;
      const matchSearch =
        article.title.toLowerCase().includes(search.toLowerCase()) ||
        article.summary.toLowerCase().includes(search.toLowerCase());
      return matchCategory && matchSearch;
    });

    if (sort === 'recent') result = [...result].sort((a, b) => new Date(b.publishDate) - new Date(a.publishDate));
    if (sort === 'read') result = [...result].sort((a, b) => a.title.length - b.title.length);

    return result;
  }, [articlesData, category, search, sort]);

  const featured = filteredArticles[0];
  const rest = filteredArticles.slice(1);

  const formatDate = (date) => new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <>
      <Helmet>
        <title>Blog - Cote Juros</title>
      </Helmet>

      <PageHero
        centered
        badge="Editorial"
        title="Artigos organizados em uma leitura mais limpa."
        subtitle="Conteudo financeiro com menos blocos promocionais e mais foco no texto, resumo e contexto de publicacao."
      >
        <div className="relative mx-auto max-w-xl">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="h-12 rounded-full bg-background pl-11"
            placeholder="Buscar artigos..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
      </PageHero>

      <div className="page-shell py-12">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((item) => (
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
            <SelectTrigger className="w-[200px]">
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
                <img src={featured.image} alt={featured.title} className="h-full w-full object-cover grayscale" />
              </div>
              <CardContent className="flex flex-col justify-center gap-5 p-10">
                <Badge variant="outline" className="w-fit">Destaque</Badge>
                <h2>{featured.title}</h2>
                <p>{featured.summary}</p>
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-2">
                    <CalendarDays className="h-4 w-4" />
                    {formatDate(featured.publishDate)}
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    {featured.readTime} min
                  </span>
                </div>
                <Button className="w-fit" onClick={() => setSelectedArticle(featured)}>
                  Ler artigo <ArrowRight className="h-4 w-4" />
                </Button>
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
                    <img src={article.image} alt={article.title} className="h-full w-full object-cover grayscale" />
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
                      <Button variant="link" className="px-0" onClick={() => setSelectedArticle(article)}>
                        Abrir
                      </Button>
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
                <p className="mt-3 text-muted-foreground">Tente outro termo ou reduza os filtros ativos.</p>
              </div>
            ) : null}
          </div>

          <div className="hidden lg:block">
            <AdSpace height="600px" />
          </div>
        </div>
      </div>

      <Dialog open={!!selectedArticle} onOpenChange={(open) => !open && setSelectedArticle(null)}>
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto p-0">
          {selectedArticle ? (
            <div className="flex flex-col">
              <div className="h-64 border-b border-border sm:h-80">
                <img src={selectedArticle.image} alt={selectedArticle.title} className="h-full w-full object-cover grayscale" />
              </div>
              <div className="space-y-8 p-8 sm:p-10">
                <div className="space-y-4">
                  <Badge variant="outline">{selectedArticle.category}</Badge>
                  <h1 className="text-3xl sm:text-4xl">{selectedArticle.title}</h1>
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <span>{formatDate(selectedArticle.publishDate)}</span>
                    <span>{selectedArticle.readTime} min de leitura</span>
                  </div>
                </div>

                <AdSpace height="90px" />

                <div className="space-y-6">
                  {selectedArticle.content.split('\n\n').map((paragraph, index) => (
                    <React.Fragment key={`${selectedArticle.id}-${index}`}>
                      <p className="text-base leading-8 text-muted-foreground">{paragraph}</p>
                      {index === 2 ? <AdSpace height="220px" /> : null}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}

export default BlogPage;
