import React from 'react';
import { Helmet } from 'react-helmet';
import { useLocation } from 'react-router-dom';
import { ArrowRight, Brain, ChartColumnIncreasing, CircleDollarSign, Goal, Landmark, MessageCircleMore, ShieldCheck, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { redirectToFinanceAi } from '@/platform/integrations/coteFinanceAI.js';
import { trackingService } from '@/platform/services/trackingService.js';

const AI_DASHBOARD_ASSET = '/assets/cote-finance-ai-dashboard.png';

function CoteFinanceAIPage() {
  const location = useLocation();

  const handleFinanceAiEntry = async () => {
    await trackingService.trackCtaClick({
      sourcePage: '/cote-finance-ai',
      ctaId: 'cote_finance_ai_start',
      ctaLabel: 'Entrar no Cote Finance AI',
      campaign: 'portal_finance_ai_page'
    });

    await redirectToFinanceAi({
      sourcePage: '/cote-finance-ai',
      campaign: 'portal_finance_ai_page',
      search: location.search
    });
  };

  const featureCards = [
    { icon: ChartColumnIncreasing, title: 'Dashboard financeiro', copy: 'Visão consolidada de entradas, saídas e margem do período.' },
    { icon: CircleDollarSign, title: 'Receitas e despesas', copy: 'Categorias mais claras para entender para onde o dinheiro está indo.' },
    { icon: Goal, title: 'Metas', copy: 'Acompanhamento de objetivos com menos ruído de interface.' },
    { icon: Landmark, title: 'Dívidas', copy: 'Monitoramento de compromissos para priorizar ajustes.' },
    { icon: Wallet, title: 'Carteira', copy: 'Visibilidade patrimonial de forma mais simples.' },
    { icon: MessageCircleMore, title: 'Insights', copy: 'Leituras automáticas e alertas em fluxos elegíveis.' }
  ];

  return (
    <>
      <Helmet>
        <title>Cote Finance AI - Controle financeiro</title>
        <meta
          name="description"
          content="Organize entradas, saídas, metas e dívidas em uma interface minimalista e orientada por clareza."
        />
      </Helmet>

      <section className="relative overflow-hidden border-b border-border bg-background">
        <div className="pointer-events-none absolute inset-0 hero-grid opacity-60" />
        <div className="page-shell relative py-24 md:py-32">
          <div className="grid items-center gap-12 lg:grid-cols-[1fr_1.05fr]">
            <div className="space-y-6">
              <Badge variant="outline" className="gap-2">
                <Brain className="h-3 w-3" />
                Cote Finance AI
              </Badge>
              <h1 className="max-w-3xl">Controle financeiro com o mesmo rigor visual do novo portal.</h1>
              <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
                O produto complementa a comparação de crédito com uma camada de organização mensal, metas e leitura de comportamento financeiro.
              </p>
              <div className="space-y-3">
                {[
                  'Entradas e saídas com estrutura mais limpa.',
                  'Visão de metas, dívidas e patrimônio no mesmo ambiente.',
                  'Apresentação mais próxima de software premium do que de landing page promocional.'
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <ShieldCheck className="mt-0.5 h-5 w-5 text-foreground" />
                    <p className="text-base text-muted-foreground">{item}</p>
                  </div>
                ))}
              </div>
              <Button size="lg" onClick={handleFinanceAiEntry}>
                Entrar no Cote Finance AI <ArrowRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="rounded-[20px] border border-border bg-white p-4 shadow-[var(--shadow-md)]">
              <img src={AI_DASHBOARD_ASSET} alt="Dashboard do Cote Finance AI" className="w-full rounded-[14px] border border-border" />
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-border bg-background-secondary py-20 md:py-24">
        <div className="page-shell">
          <div className="mx-auto mb-14 max-w-3xl text-center">
            <span className="section-eyebrow mb-5">Módulos</span>
            <h2 className="mb-4">Recursos alinhados ao novo sistema visual.</h2>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
              O produto ganha uma apresentação mais tipográfica, com blocos discretos e o mesmo contraste do restante da plataforma.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {featureCards.map((item) => (
              <Card key={item.title} className="surface-card">
                <CardContent className="space-y-5 p-8">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-white">
                    <item.icon className="h-5 w-5 text-foreground" />
                  </div>
                  <div className="space-y-3">
                    <h3>{item.title}</h3>
                    <p>{item.copy}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="page-section bg-background">
        <div className="page-shell max-w-4xl">
          <div className="space-y-6 rounded-[20px] border border-border bg-background-secondary p-10">
            <span className="section-eyebrow">Transparência</span>
            <h2>O Cote Finance AI organiza o financeiro. Não promete aprovação automática.</h2>
            <p className="text-lg text-muted-foreground">
              A página deixa claro o papel do produto: organizar, dar contexto e apoiar decisões melhores, sem promessas artificiais.
            </p>
            <Button size="lg" className="w-fit" onClick={handleFinanceAiEntry}>
              Acessar plataforma <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}

export default CoteFinanceAIPage;
