
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar } from 'lucide-react';

function BlogArticleCard({ article }) {
  return (
    <Card className="h-full flex flex-col hover:shadow-lg transition-all duration-200 overflow-hidden">
      <div className="aspect-video overflow-hidden">
        <img
          src={article.imagem}
          alt={article.titulo}
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
        />
      </div>
      <CardHeader>
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="secondary">{article.categoria}</Badge>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span>{new Date(article.data).toLocaleDateString('pt-BR')}</span>
          </div>
        </div>
        <h3 className="text-lg font-semibold text-balance leading-snug">{article.titulo}</h3>
      </CardHeader>
      <CardContent className="flex-1">
        <p className="text-sm text-muted-foreground leading-relaxed">{article.resumo}</p>
      </CardContent>
      <CardFooter className="mt-auto">
        <Button variant="outline" className="w-full transition-all duration-200 active:scale-[0.98]">
          Ler mais
        </Button>
      </CardFooter>
    </Card>
  );
}

export default BlogArticleCard;
