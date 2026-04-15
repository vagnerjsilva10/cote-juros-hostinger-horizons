import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquareText, ThumbsDown, ThumbsUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

function BlogFeedbackCard() {
  const [vote, setVote] = useState(null);

  return (
    <Card className="border-border bg-white">
      <CardContent className="space-y-5 p-6 md:p-8">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary/75">Sua opinião</p>
          <h2 className="text-2xl text-foreground">Este artigo foi útil?</h2>
          <p className="text-sm leading-7 text-muted-foreground">
            Usamos esse retorno para deixar os conteúdos mais claros e mais úteis para quem quer decidir com calma.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            variant={vote === 'up' ? 'default' : 'outline'}
            onClick={() => setVote('up')}
            className="min-w-[150px]"
          >
            <ThumbsUp className="h-4 w-4" />
            Foi útil
          </Button>
          <Button
            type="button"
            variant={vote === 'down' ? 'default' : 'outline'}
            onClick={() => setVote('down')}
            className="min-w-[150px]"
          >
            <ThumbsDown className="h-4 w-4" />
            Pode melhorar
          </Button>
        </div>

        <div className="rounded-[18px] border border-border bg-background-secondary p-5">
          <div className="flex items-start gap-3">
            <MessageSquareText className="mt-0.5 h-5 w-5 text-primary" />
            <div className="space-y-2">
              <h3 className="text-lg text-foreground">Quer ver caminhos de crédito com mais clareza?</h3>
              <p className="text-sm leading-7 text-muted-foreground">
                Veja opções que podem fazer sentido para o seu momento, sem compromisso e sem cobrança antecipada.
              </p>
              <Link to="/emprestimos" className="inline-flex">
                <Button>Ver minhas opções agora</Button>
              </Link>
              <p className="text-xs text-muted-foreground">
                Ou, se preferir, volte para o <Link to="/blog" className="font-medium text-primary hover:underline">blog</Link>.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default BlogFeedbackCard;
