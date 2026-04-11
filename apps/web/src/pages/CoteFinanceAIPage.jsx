import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ArrowRight,
  Brain,
  ChartColumnIncreasing,
  CircleDollarSign,
  Goal,
  Landmark,
  MessageCircleMore,
  ShieldCheck,
  Wallet
} from 'lucide-react';
import { useLocation } from 'react-router-dom';
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

  const audienceCards = [
    {
      icon: Wallet,
      title: 'Para quem quer organizar o mês',
      description: 'Centralize entradas e saídas para enxergar o fluxo financeiro com clareza.'
    },
    {
      icon: Brain,
      title: 'Para quem busca decisões com contexto',
      description: 'Receba análises sobre padrões de gasto e prioridades de ajuste.'
    },
    {
      icon: ShieldCheck,
      title: 'Para quem quer evoluir sem complexidade',
      description: 'Acompanhe metas e rotina financeira sem depender de planilhas complexas.'
    }
  ];

  const featureCards = [
    {
      icon: ChartColumnIncreasing,
      title: 'Dashboard financeiro',
      description: 'Visão consolidada de entradas, saídas, margem e evolução do período.'
    },
    {
      icon: CircleDollarSign,
      title: 'Controle de receitas e despesas',
      description: 'Lançamentos por categoria para identificar para onde o dinheiro está indo.'
    },
    {
      icon: Goal,
      title: 'Metas financeiras',
      description: 'Acompanhe objetivos e progresso com contexto do seu mês.'
    },
    {
      icon: Landmark,
      title: 'Acompanhamento de dívidas',
      description: 'Monitore compromissos financeiros para priorizar ajustes com impacto real.'
    },
    {
      icon: Wallet,
      title: 'Investimentos e carteira',
      description: 'Tenha visibilidade do patrimônio e da distribuição dos seus recursos.'
    },
    {
      icon: MessageCircleMore,
      title: 'Insights e alertas',
      description: 'Receba direcionamentos automáticos e, nos planos elegíveis, alertas via WhatsApp.'
    }
  ];

  const steps = [
    {
      step: '1',
      title: 'Organize suas informações financeiras',
      description: 'Cadastre movimentações e tenha tudo em um único lugar.'
    },
    {
      step: '2',
      title: 'Entenda seu comportamento financeiro',
      description: 'A plataforma identifica padrões de gasto e pontos de atenção.'
    },
    {
      step: '3',
      title: 'Aja com plano claro',
      description: 'Priorize ajustes e acompanhe sua evolução mês a mês.'
    }
  ];

  return (
    <>
      <Helmet>
        <title>Cote Finance AI - Controle Financeiro com Inteligência</title>
        <meta
          name="description"
          content="Organize entradas e saídas, acompanhe metas, dívidas e investimentos com o Cote Finance AI. Tenha clareza para decidir melhor no seu financeiro."
        />
      </Helmet>

      <section className="relative pt-24 pb-32 overflow-hidden hero-fintech-bg">
        <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_20%_30%,rgba(37,99,235,0.08),transparent_40%)]" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}>
              <Badge className="bg-white text-primary border border-primary/20 mb-6 px-4 py-1.5 text-sm">
                <Brain className="w-4 h-4 mr-2" /> Produto Cote Finance AI
              </Badge>
              <h1 className="text-foreground mb-6">Visibilidade financeira para decidir melhor</h1>
              <p className="text-xl text-slate-600 mb-8 max-w-xl">
                O Cote Finance AI ajuda você a organizar sua vida financeira, entender padrões de gastos e agir com mais
                confiança no dia a dia. Menos achismo, mais clareza sobre o seu dinheiro.
              </p>
              <Button
                size="lg"
                className="h-14 px-8 text-lg rounded-xl gradient-fintech-hover text-white shadow-premium"
                onClick={handleFinanceAiEntry}
              >
                Entrar no Cote Finance AI <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </motion.div>

            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.2 }}>
              <img src={AI_DASHBOARD_ASSET} alt="Dashboard do Cote Finance AI" className="rounded-2xl shadow-[var(--shadow-md)] border border-border" />
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2>Para quem o Cote Finance AI é indicado</h2>
            <p className="text-muted-foreground mt-4 text-lg">Um assistente financeiro para quem quer controle real do mês.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {audienceCards.map((item, index) => (
              <Card key={index} className="card-premium bg-card border-border">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <item.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-xl mb-2">{item.title}</h3>
                  <p className="text-muted-foreground text-sm">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 bg-card border-y border-border">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2>O que você encontra na plataforma</h2>
            <p className="text-muted-foreground mt-4 text-lg">Módulos práticos para acompanhar e melhorar sua vida financeira.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featureCards.map((feature, index) => (
              <Card key={index} className="card-premium bg-background border-border">
                <CardContent className="p-6">
                  <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <feature.icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="text-xl mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 bg-background">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-center mb-16">Como funciona</h2>
          <div className="space-y-12">
            {steps.map((item, index) => (
              <div key={index} className="flex gap-6 items-start">
                <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white font-bold text-xl flex-shrink-0 shadow-[var(--shadow-sm)]">
                  {item.step}
                </div>
                <div>
                  <h3 className="text-2xl mb-2">{item.title}</h3>
                  <p className="text-muted-foreground text-lg">{item.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-16 p-6 rounded-2xl border border-border bg-card">
            <p className="text-muted-foreground text-sm leading-relaxed">
              O Cote Finance AI é uma plataforma de organização financeira. Esta página não promete aprovação de crédito,
              previsão de score ou correspondência automática com bancos.
            </p>
          </div>

          <div className="text-center mt-12">
            <Button size="lg" className="h-14 px-8 text-lg rounded-xl gradient-fintech-hover text-white shadow-premium" onClick={handleFinanceAiEntry}>
              Acessar plataforma agora <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}

export default CoteFinanceAIPage;
