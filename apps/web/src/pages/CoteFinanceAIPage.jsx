
import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Brain, Zap, ShieldCheck, Target, ArrowRight } from 'lucide-react';
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
      ctaLabel: 'Comecar analise gratuita',
      productType: 'loan',
      campaign: 'portal_acquisition'
    });

    await redirectToFinanceAi({
      sourcePage: '/cote-finance-ai',
      productType: 'loan',
      campaign: 'portal_acquisition',
      search: location.search
    });
  };

  return (
    <>
      <Helmet>
        <title>Cote Finance AI - Inteligência Artificial Financeira</title>
        <meta name="description" content="Use nossa IA para encontrar as melhores ofertas de crédito com alta chance de aprovação." />
      </Helmet>

      {/* Hero */}
      <section className="relative pt-24 pb-32 overflow-hidden bg-foreground">
        <div className="absolute inset-0 z-0 gradient-fintech opacity-80" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}>
              <Badge className="bg-white/20 text-white hover:bg-white/30 border-0 mb-6 px-4 py-1.5 text-sm">
                <Brain className="w-4 h-4 mr-2" /> Tecnologia Exclusiva
              </Badge>
              <h1 className="text-white mb-6">Cote Finance AI</h1>
              <p className="text-xl text-white/90 mb-8 max-w-lg">
                Inteligência artificial para suas decisões financeiras. Cruzamos seu perfil com +50 bancos para encontrar crédito com até 95% de chance de aprovação.
              </p>
              <Button size="lg" className="h-14 px-8 text-lg rounded-xl bg-white text-primary hover:bg-slate-100 shadow-xl" onClick={handleFinanceAiEntry}>
                Começar análise gratuita <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </motion.div>
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.2 }}>
              <img src={AI_DASHBOARD_ASSET} alt="AI Dashboard" className="rounded-2xl shadow-2xl border-4 border-white/10" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2>Por que usar nossa IA?</h2>
            <p className="text-muted-foreground mt-4 text-lg">Vantagens exclusivas para o seu bolso.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: Zap, title: 'Análise rápida', desc: 'Resultados em menos de 3 minutos.' },
              { icon: Target, title: 'Ofertas personalizadas', desc: 'Crédito que cabe no seu orçamento.' },
              { icon: ShieldCheck, title: 'Sem impacto no score', desc: 'Consultas seguras (Soft Query).' },
              { icon: Brain, title: 'Dados protegidos', desc: 'Criptografia de ponta a ponta.' }
            ].map((b, i) => (
              <Card key={i} className="card-premium bg-card border-border">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <b.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-xl mb-2">{b.title}</h3>
                  <p className="text-muted-foreground text-sm">{b.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 bg-card border-y border-border">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-center mb-16">Como funciona</h2>
          <div className="space-y-12">
            {[
              { step: '1', title: 'Preencha seu perfil', desc: 'Informe dados básicos como renda e objetivo financeiro.' },
              { step: '2', title: 'A IA analisa o mercado', desc: 'Nosso algoritmo varre as políticas de crédito de dezenas de bancos.' },
              { step: '3', title: 'Receba as melhores ofertas', desc: 'Você vê apenas o que tem alta chance de aprovação para você.' }
            ].map((s, i) => (
              <div key={i} className="flex gap-6 items-start">
                <div className="w-12 h-12 rounded-full gradient-fintech flex items-center justify-center text-white font-bold text-xl flex-shrink-0 shadow-md">
                  {s.step}
                </div>
                <div>
                  <h3 className="text-2xl mb-2">{s.title}</h3>
                  <p className="text-muted-foreground text-lg">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

export default CoteFinanceAIPage;

