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
    <section className="rounded-[20px] border border-border bg-white p-6 md:p-8">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/[0.08] text-primary">
          <MessageSquare className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-2xl text-foreground">Comentarios</h2>
          <p className="text-sm text-muted-foreground">
            Use este espaco para deixar uma duvida ou contar se o conteudo ajudou no seu caso.
          </p>
        </div>
      </div>

      <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
        <div className="grid gap-4 md:grid-cols-2">
          <Input value={form.name} onChange={handleChange('name')} placeholder="Seu nome" aria-label="Seu nome" />
          <Input value={form.email} onChange={handleChange('email')} placeholder="Seu e-mail" type="email" aria-label="Seu e-mail" />
        </div>
        <Textarea
          value={form.comment}
          onChange={handleChange('comment')}
          placeholder="Escreva seu comentario"
          aria-label="Escreva seu comentario"
          className="min-h-[140px]"
        />
        <div className="flex justify-end">
          <Button type="submit">Enviar comentario</Button>
        </div>
      </form>

      <div className="mt-8 space-y-4">
        {comments.length ? (
          comments.map((comment) => (
            <article key={comment.id} className="rounded-[16px] border border-border bg-background-secondary p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <strong className="text-sm text-foreground">{comment.name}</strong>
                <span className="text-xs text-muted-foreground">
                  {new Date(comment.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                </span>
              </div>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">{comment.comment}</p>
            </article>
          ))
        ) : (
          <div className="rounded-[16px] border border-dashed border-border bg-background-secondary p-5 text-sm text-muted-foreground">
            Ainda nao ha comentarios neste artigo. Se quiser, voce pode ser a primeira pessoa a compartilhar uma duvida ou experiencia.
          </div>
        )}
      </div>
    </section>
  );
}

export default ArticleComments;
