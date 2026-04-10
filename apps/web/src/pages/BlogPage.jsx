
import React, { useState, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { articlesData } from '@/data/articlesData.js';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AdSpace } from '@/components/AdSpace.jsx';
import { Search, Clock, CalendarDays, ArrowRight } from 'lucide-react';

const CATEGORIES = ['Todas', 'Empréstimos', 'Cartões de Crédito', 'Finanças Pessoais', 'Score de Crédito', 'Financiamento'];

function BlogPage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Todas');
  const [sort, setSort] = useState('recent');
  const [selectedArticle, setSelectedArticle] = useState(null);

  const filteredArticles = useMemo(() => {
    let result = articlesData.filter(article => {
      const matchCat = category === 'Todas' || article.category === category;
      const matchSearch = article.title.toLowerCase().includes(search.toLowerCase()) || 
                          article.summary.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });

    if (sort === 'recent') result.sort((a,b) => new Date(b.publishDate) - new Date(a.publishDate));
    // Mock sorting for others
    if (sort === 'read') result.sort((a,b) => a.title.length - b.title.length);

    return result;
  }, [search, category, sort]);

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <>
      <Helmet>
        <title>Blog - Educação Financeira - Cote Juros</title>
      </Helmet>

      <div className="bg-card py-16 border-b border-border">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center max-w-3xl">
          <Badge className="mb-4 bg-primary/10 text-primary border-primary/20" variant="outline">Educação Financeira</Badge>
          <h1 className="mb-6">Blog Cote Juros</h1>
          <p className="text-lg text-muted-foreground mb-8">Dicas, guias e novidades para você dominar as suas finanças pessoais.</p>
          
          <div className="relative max-w-xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <Input 
              className="h-14 pl-12 rounded-full text-base bg-background text-foreground shadow-sm border-border" 
              placeholder="Buscar artigos..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-10">
          <div className="flex flex-wrap gap-2 justify-center md:justify-start">
            {CATEGORIES.map(cat => (
              <Button 
                key={cat} 
                variant={category === cat ? 'default' : 'outline'} 
                className="rounded-full"
                onClick={() => setCategory(cat)}
              >
                {cat}
              </Button>
            ))}
          </div>
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="w-[180px] bg-background">
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Mais recente</SelectItem>
              <SelectItem value="read">Mais lido</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 xl:col-span-9">
            <div className="grid md:grid-cols-2 gap-8">
              {filteredArticles.map((article, index) => (
                <React.Fragment key={article.id}>
                  <Card className="card-premium overflow-hidden flex flex-col bg-card">
                    <div className="h-48 overflow-hidden">
                      <img src={article.image} alt={article.title} className="w-full h-full object-cover" />
                    </div>
                    <CardContent className="flex-1 p-6 flex flex-col">
                      <div className="flex items-center justify-between mb-4">
                        <Badge variant="secondary" className="font-normal">{article.category}</Badge>
                        <div className="flex items-center text-xs text-muted-foreground">
                          <Clock className="w-3 h-3 mr-1" /> {article.readTime} min
                        </div>
                      </div>
                      <h3 className="text-xl font-bold leading-snug mb-3 hover:text-primary transition-colors cursor-pointer" onClick={() => setSelectedArticle(article)}>
                        {article.title}
                      </h3>
                      <p className="text-muted-foreground text-sm line-clamp-3 mb-6 flex-1">
                        {article.summary}
                      </p>
                      <div className="flex items-center justify-between mt-auto pt-4 border-t border-border">
                        <span className="text-xs text-muted-foreground flex items-center">
                          <CalendarDays className="w-3 h-3 mr-1" /> {formatDate(article.publishDate)}
                        </span>
                        <Button variant="ghost" className="p-0 h-auto text-primary hover:bg-transparent hover:text-primary/80" onClick={() => setSelectedArticle(article)}>
                          Ler Artigo <ArrowRight className="w-4 h-4 ml-1" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                  {/* Insert AdSpace after every 4th article */}
                  {(index + 1) % 4 === 0 && (
                    <div className="md:col-span-2">
                      <AdSpace height="150px" />
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
            
            {filteredArticles.length === 0 && (
              <div className="text-center py-20 text-muted-foreground">
                Nenhum artigo encontrado para a sua busca.
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="hidden lg:block lg:col-span-4 xl:col-span-3 space-y-8">
            <AdSpace height="600px" />
          </div>
        </div>
      </div>

      {/* Article Read Modal */}
      <Dialog open={!!selectedArticle} onOpenChange={(open) => !open && setSelectedArticle(null)}>
        <DialogContent className="max-w-4xl h-[90vh] overflow-y-auto p-0 bg-background border-border">
          {selectedArticle && (
            <div className="flex flex-col h-full">
              <div className="h-64 sm:h-80 relative flex-shrink-0">
                <img src={selectedArticle.image} alt={selectedArticle.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                <div className="absolute bottom-6 left-6 right-6">
                  <Badge className="mb-3 bg-primary text-white border-0">{selectedArticle.category}</Badge>
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white text-balance">{selectedArticle.title}</h1>
                </div>
              </div>
              <div className="p-6 sm:p-10 flex-1">
                <div className="flex items-center gap-6 text-sm text-muted-foreground mb-8 pb-4 border-b border-border">
                  <span className="flex items-center"><CalendarDays className="w-4 h-4 mr-2" /> {formatDate(selectedArticle.publishDate)}</span>
                  <span className="flex items-center"><Clock className="w-4 h-4 mr-2" /> {selectedArticle.readTime} min de leitura</span>
                </div>
                
                <AdSpace height="90px" className="mb-8" />

                <div className="prose prose-lg dark:prose-invert max-w-none text-foreground leading-relaxed">
                  {selectedArticle.content.split('\n\n').map((paragraph, i) => (
                    <React.Fragment key={i}>
                      <p className="mb-6 text-base md:text-lg">{paragraph}</p>
                      {i === 2 && <AdSpace height="250px" className="my-8" />}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

export default BlogPage;
