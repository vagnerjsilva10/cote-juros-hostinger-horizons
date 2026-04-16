import React, { useMemo, useState } from 'react';
import { MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Textarea } from '@/components/ui/textarea.jsx';

function ArticleComments({ articleSlug }) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    comment: ''
  });
  const [submitted, setSubmitted] = useState([]);

  const comments = useMemo(() => submitted.filter((item) => item.articleSlug === articleSlug), [submitted, articleSlug]);

  const handleChange = (field) => (event) => {
    setForm((current) => ({
      ...current,
      [field]: event.target.value
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.comment.trim()) return;

    setSubmitted((current) => [
      {
        id: `${articleSlug}-${Date.now()}`,
        articleSlug,
        name: form.name.trim(),
        email: form.email.trim(),
        comment: form.comment.trim(),
        createdAt: new Date().toISOString()
      },
      ...current
    ]);

    setForm({ name: '', email: '', comment: '' });
  };

  return (
    <section className="blog-comments min-w-0 rounded-[20px] border border-border bg-white p-5 sm:p-6 md:p-8">
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center">
        <div className="blog-comments-icon flex h-11 w-11 items-center justify-center rounded-full bg-primary/[0.08] text-primary">
          <MessageSquare className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <h2 className="blog-section-title text-2xl text-foreground">Comentários</h2>
          <p className="text-sm text-muted-foreground">
            Use este espaço para deixar uma dúvida ou contar se o conteúdo ajudou no seu caso.
          </p>
        </div>
      </div>

      <form className="mt-6 grid min-w-0 gap-4" onSubmit={handleSubmit}>
        <div className="grid min-w-0 gap-4 md:grid-cols-2">
          <Input value={form.name} onChange={handleChange('name')} placeholder="Seu nome" aria-label="Seu nome" />
          <Input value={form.email} onChange={handleChange('email')} placeholder="Seu e-mail" type="email" aria-label="Seu e-mail" />
        </div>
        <Textarea
          value={form.comment}
          onChange={handleChange('comment')}
          placeholder="Escreva seu comentário"
          aria-label="Escreva seu comentário"
          className="min-h-[140px]"
        />
        <div className="flex justify-end">
          <Button type="submit" className="w-full sm:w-auto">Enviar comentário</Button>
        </div>
      </form>

      <div className="mt-8 space-y-4">
        {comments.length ? (
          comments.map((comment) => (
            <article key={comment.id} className="blog-comments-item min-w-0 rounded-[16px] border border-border bg-background-secondary p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <strong className="blog-chip-title text-sm text-foreground">{comment.name}</strong>
                <span className="text-xs text-muted-foreground">
                  {new Date(comment.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                </span>
              </div>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">{comment.comment}</p>
            </article>
          ))
        ) : (
          <div className="blog-comments-empty min-w-0 rounded-[16px] border border-dashed border-border bg-background-secondary p-5 text-sm text-muted-foreground">
            Ainda não há comentários neste artigo. Se quiser, você pode ser a primeira pessoa a compartilhar uma dúvida ou experiência.
          </div>
        )}
      </div>
    </section>
  );
}

export default ArticleComments;
