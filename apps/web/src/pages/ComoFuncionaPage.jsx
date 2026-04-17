import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, ShieldCheck, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import PageHero from '@/components/PageHero.jsx';
import SeoHead from '@/components/SeoHead.jsx';
import { brandPages, homeBreadcrumb } from '@/seo/brandSeo.js';

const steps = [
  {
    title: 'Você informa o básico',
    description: 'Valor, renda, perfil e objetivo ajudam a organizar o ponto de partida sem formulário longo.'
  },
  {
    title: 'A Cote Juros organiza a leitura',
    description: 'Empréstimos, cartões e financiamentos aparecem com contexto para comparar custo, prazo e condições.'
  },
  {
    title: 'Você decide o próximo passo',
    description: 'Quando uma opção fizer sentido, você segue com mais clareza. Sem cobrança antecipada e sem pressão.'
  }
];

function ComoFuncionaPage() {
  const breadcrumbs = [homeBreadcrumb, { name: 'Como funciona', path: brandPages.comoFunciona.path }];

  return (
    <>
      <SeoHead
        title={brandPages.comoFunciona.title}
        description={brandPages.comoFunciona.description}
        path={brandPages.comoFunciona.path}
        breadcrumbs={breadcrumbs}
      />

      <PageHero
        breadcrumbs={breadcrumbs}
        badge="Como funciona"
        title="Comparar crédito fica melhor quando o caminho é claro."
        subtitle="A Cote Juros organiza informações para você entender possibilidades antes de contratar, sem promessa falsa e sem cobrança antecipada."
      >
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link to="/emprestimos">
            <Button size="lg">
              Ver minhas opções
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link to="/perguntas-frequentes">
            <Button size="lg" variant="outline" className="hero-secondary-btn">
              Tirar dúvidas
            </Button>
          </Link>
        </div>
      </PageHero>

      <section className="page-section bg-background">
        <div className="page-shell">
          <div className="mb-12 max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Jornada simples</p>
            <h2 className="mt-3">Da dúvida inicial até uma decisão mais segura.</h2>
            <p className="mt-4 text-lg leading-8 text-muted-foreground">
              A plataforma não substitui a análise das instituições financeiras. O papel da Cote Juros é melhorar a leitura antes de você avançar.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {steps.map((step, index) => (
              <Card key={step.title} className="surface-card">
                <CardContent className="h-full space-y-5 p-8">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-background-secondary text-sm font-semibold text-primary">
                    {String(index + 1).padStart(2, '0')}
                  </div>
                  <div className="space-y-3">
                    <h3>{step.title}</h3>
                    <p>{step.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {[
              { icon: ShieldCheck, text: 'Sem cobrança antecipada' },
              { icon: SlidersHorizontal, text: 'Comparação por perfil e contexto' },
              { icon: CheckCircle2, text: 'Você decide com mais calma' }
            ].map((item) => (
              <div key={item.text} className="interactive-card flex items-center gap-3 p-5">
                <item.icon className="h-5 w-5 text-primary" />
                <span className="font-semibold text-foreground">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

export default ComoFuncionaPage;
