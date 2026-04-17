import React, { useState } from 'react';
import { Mail, MapPin, Phone } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import PageHero from '@/components/PageHero.jsx';
import SeoHead from '@/components/SeoHead.jsx';
import { brandPages, homeBreadcrumb } from '@/seo/brandSeo.js';

function ContatoPage() {
  const [formData, setFormData] = useState({ nome: '', email: '', assunto: '', mensagem: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!formData.nome || !formData.email || !formData.assunto || !formData.mensagem) {
      toast.error('Preencha todos os campos.');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      toast.success('Mensagem enviada com sucesso.');
      setFormData({ nome: '', email: '', assunto: '', mensagem: '' });
      setIsSubmitting(false);
    }, 1200);
  };

  return (
    <>
      <SeoHead
        title={brandPages.contato.title}
        description={brandPages.contato.description}
        path={brandPages.contato.path}
        breadcrumbs={[homeBreadcrumb, { name: 'Contato', path: brandPages.contato.path }]}
      />

      <PageHero
        breadcrumbs={[homeBreadcrumb, { name: 'Contato', path: brandPages.contato.path }]}
        badge="Contato"
        title="Fale com a equipe em um fluxo tão simples quanto o restante do produto."
        subtitle="O formulário segue a mesma linguagem do novo portal: poucos elementos, muito respiro e foco no texto."
      />

      <section className="page-section bg-background">
        <div className="page-shell grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <Card>
            <CardHeader>
              <CardTitle>Envie sua mensagem</CardTitle>
              <CardDescription>Responderemos o mais rápido possível.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label>Nome completo</Label>
                  <Input value={formData.nome} onChange={(event) => setFormData({ ...formData, nome: event.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>E-mail</Label>
                  <Input type="email" value={formData.email} onChange={(event) => setFormData({ ...formData, email: event.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Assunto</Label>
                  <Input value={formData.assunto} onChange={(event) => setFormData({ ...formData, assunto: event.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Mensagem</Label>
                  <Textarea value={formData.mensagem} onChange={(event) => setFormData({ ...formData, mensagem: event.target.value })} />
                </div>
                <Button size="lg" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? 'Enviando...' : 'Enviar mensagem'}
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="space-y-5">
            {[
              { icon: Mail, title: 'E-mail', value: 'contato@cotejuros.com.br' },
              { icon: Phone, title: 'Telefone', value: '(11) 3000-0000' },
              { icon: MapPin, title: 'Base', value: 'São Paulo, SP - Brasil' }
            ].map((item) => (
              <Card key={item.title}>
                <CardContent className="flex items-start gap-4 p-8">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-background-secondary">
                    <item.icon className="h-5 w-5 text-foreground" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{item.title}</p>
                    <p className="text-sm text-muted-foreground">{item.value}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

export default ContatoPage;
