import React from 'react';
import { Helmet } from 'react-helmet';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Brain,
  CheckCircle2,
  CircleDollarSign,
  Goal,
  Landmark,
  MessageCircleMore,
  ShieldCheck,
  TrendingUp,
  Wallet
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { redirectToFinanceAi } from '@/platform/integrations/coteFinanceAI.js';
import { trackingService } from '@/platform/services/trackingService.js';

const animationIn = {
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.35, ease: 'easeOut' }
};

function SystemMotionShowcase() {
  return (
    <div className="relative overflow-hidden rounded-[22px] border border-primary/15 bg-white/95 p-5 shadow-[var(--shadow-md)]">
      <div className="pointer-events-none absolute -left-14 -top-16 h-44 w-44 rounded-full bg-primary/12 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-16 -right-12 h-48 w-48 rounded-full bg-teal-400/12 blur-3xl" />

      <motion.div
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        className="relative z-10 space-y-4"
      >
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { label: 'Entradas', value: 'R$ 6.850', tone: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
            { label: 'Saídas', value: 'R$ 4.920', tone: 'border-orange-200 bg-orange-50 text-orange-700' },
            { label: 'Margem', value: 'R$ 1.930', tone: 'border-sky-200 bg-sky-50 text-sky-700' }
          ].map((item, index) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.2, ease: 'easeOut', delay: 0.08 + index * 0.07 }}
              className={`rounded-[12px] border p-3 ${item.tone}`}
            >
              <p className="text-[11px] uppercase tracking-[0.14em]">{item.label}</p>
              <p className="mt-1 text-sm font-semibold">{item.value}</p>
            </motion.div>
          ))}
        </div>

        <div className="rounded-[14px] border border-border bg-white p-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-medium text-foreground">Fluxo financeiro vivo</p>
            <Badge variant="outline" className="border-primary/25 bg-primary/10 text-primary">
              Atualização diária
            </Badge>
          </div>
          <svg viewBox="0 0 240 90" className="h-[94px] w-full">
            <path
              d="M4 70 C26 64, 40 52, 60 54 C84 56, 98 38, 120 40 C146 42, 156 60, 176 56 C198 52, 216 30, 236 20"
              fill="none"
              stroke="rgba(37,99,235,0.95)"
              strokeWidth="2.5"
              className="chart-draw"
            />
            <path
              d="M4 76 C24 78, 44 70, 64 66 C88 62, 110 62, 132 58 C154 54, 176 52, 198 50 C216 48, 226 44, 236 38"
              fill="none"
              stroke="rgba(20,148,136,0.72)"
              strokeWidth="2"
            />
            <circle cx="236" cy="20" r="4" fill="#2563EB" className="chart-pulse" />
          </svg>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-[12px] border border-border bg-background-secondary p-3">
            <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Insight IA</p>
            <p className="mt-1 text-sm font-semibold text-foreground">Você pode economizar R$ 680/mês reduzindo recorrentes.</p>
          </div>
          <div className="rounded-[12px] border border-border bg-background-secondary p-3">
            <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Ação prioritária</p>
            <p className="mt-1 text-sm font-semibold text-foreground">Cortar 3 assinaturas com baixo uso nesta semana.</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

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

  const howItWorks = [
    {
      title: '1. Organize entradas e saídas',
      copy: 'Consolide transações e categorias para enxergar com clareza o que entra, o que sai e como está sua margem.'
    },
    {
      title: '2. Detecte saídas invisíveis',
      copy: 'O sistema aponta gastos recorrentes e hábitos que passam despercebidos, mas pesam no seu mês.'
    },
    {
      title: '3. Receba insights com IA',
      copy: 'A IA transforma dados brutos em recomendações práticas para reduzir desperdícios e melhorar decisões.'
    },
    {
      title: '4. Acompanhe evolução em rotina real',
      copy: 'Use metas, alertas e visão de tendência para manter constância e evoluir mês a mês.'
    }
  ];

  const modules = [
    { icon: CircleDollarSign, title: 'Entradas e saídas', copy: 'Visão consolidada do fluxo para decisões mais rápidas e conscientes.' },
    { icon: Goal, title: 'Metas financeiras', copy: 'Planeje objetivos e acompanhe avanço com menos ruído de interface.' },
    { icon: Landmark, title: 'Dívidas e compromissos', copy: 'Priorize ajustes e mantenha controle do que precisa ser renegociado.' },
    { icon: Wallet, title: 'Carteira e patrimônio', copy: 'Visualize distribuição financeira com leitura clara e comparável.' },
    { icon: Brain, title: 'Insights automáticos', copy: 'Sugestões práticas sobre cortes, foco mensal e oportunidades de melhoria.' },
    { icon: MessageCircleMore, title: 'Resumos e alertas', copy: 'Atualizações em canais como WhatsApp para manter ritmo no dia a dia.' }
  ];

  const plans = [
    {
      name: 'Free',
      price: 'Grátis',
      copy: 'Para começar a organizar o financeiro sem fricção.',
      bullets: ['Até 50 lançamentos por mês', 'Análise básica de saídas']
    },
    {
      name: 'Pro',
      price: 'R$ 29/mês',
      copy: 'Para controle completo e insights frequentes com IA.',
      bullets: ['Lançamentos ilimitados', 'Até 500 interações com IA por mês', 'Relatórios completos e metas ilimitadas']
    },
    {
      name: 'Premium',
      price: 'R$ 49/mês',
      copy: 'Para quem busca camada estratégica e automação avançada.',
      bullets: ['IA financeira sem limite mensal', 'Previsão de saldo e alertas inteligentes', 'Automação financeira no WhatsApp']
    }
  ];

  return (
    <>
      <Helmet>
        <title>Cote Finance AI - Assistente financeiro inteligente</title>
        <meta
          name="description"
          content="Entenda para onde seu dinheiro vai, receba insights com IA e acompanhe sua evolução financeira com clareza no Cote Finance AI."
        />
      </Helmet>

      <section className="relative overflow-hidden border-b border-border bg-background">
        <div className="pointer-events-none absolute inset-0 hero-grid opacity-60" />
        <div className="page-shell relative py-20 md:py-28">
          <div className="grid items-center gap-12 lg:grid-cols-[1fr_1.04fr]">
            <motion.div className="space-y-6" {...animationIn}>
              <Badge variant="outline" className="gap-2">
                <Brain className="h-3 w-3" />
                Cote Finance AI
              </Badge>
              <h1 className="max-w-3xl">Você não está sem dinheiro. Está sem visibilidade.</h1>
              <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
                Organize, analise, preveja e acompanhe suas finanças com clareza. O sistema mostra para onde seu dinheiro vai e o que ajustar agora.
              </p>
              <div className="space-y-3">
                {[
                  'Descobre saídas invisíveis que drenam sua margem.',
                  'Transforma dados em recomendações objetivas com IA.',
                  'Acompanha metas e evolução mensal sem planilhas.'
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
            </motion.div>

            <motion.div {...animationIn}>
              <SystemMotionShowcase />
            </motion.div>
          </div>
        </div>
      </section>

      <section className="border-b border-border bg-background-secondary py-20 md:py-24">
        <div className="page-shell">
          <motion.div className="mx-auto mb-12 max-w-3xl text-center" {...animationIn}>
            <span className="section-eyebrow mb-5">Como Funciona</span>
            <h2 className="mb-4">Fluxo pensado para mostrar exatamente como o produto trabalha no dia a dia.</h2>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
              Da organização inicial ao plano de ação com IA, cada etapa reduz ruído e aumenta previsibilidade financeira.
            </p>
          </motion.div>

          <div className="grid gap-5 md:grid-cols-2">
            {howItWorks.map((step, index) => (
              <motion.div key={step.title} {...animationIn} transition={{ duration: 0.3, delay: index * 0.06 }}>
                <Card className="surface-card h-full">
                  <CardContent className="space-y-3 p-7">
                    <h3>{step.title}</h3>
                    <p>{step.copy}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-border bg-background py-20 md:py-24">
        <div className="page-shell">
          <motion.div className="mx-auto mb-12 max-w-3xl text-center" {...animationIn}>
            <span className="section-eyebrow mb-5">Módulos</span>
            <h2 className="mb-4">Tudo o que você precisa para sair do escuro e decidir com contexto.</h2>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
              Estrutura de produto desenhada para clareza, constância e decisões com menos ansiedade.
            </p>
          </motion.div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {modules.map((item, index) => (
              <motion.div key={item.title} {...animationIn} transition={{ duration: 0.3, delay: index * 0.05 }}>
                <Card className="surface-card h-full">
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
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-border bg-background-secondary py-20 md:py-24">
        <div className="page-shell">
          <motion.div className="mx-auto mb-12 max-w-3xl text-center" {...animationIn}>
            <span className="section-eyebrow mb-5">Planos</span>
            <h2 className="mb-4">Modelos de acesso alinhados ao estágio financeiro de cada perfil.</h2>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
              Escolha entre iniciar gratuitamente ou avançar com camadas mais profundas de inteligência e automação.
            </p>
          </motion.div>

          <div className="grid gap-5 lg:grid-cols-3">
            {plans.map((plan, index) => (
              <motion.div key={plan.name} {...animationIn} transition={{ duration: 0.3, delay: index * 0.06 }}>
                <Card className={`h-full border-border bg-white ${plan.name === 'Pro' ? 'shadow-[var(--shadow-md)]' : 'shadow-[var(--shadow-sm)]'}`}>
                  <CardContent className="space-y-4 p-7">
                    <div className="flex items-center justify-between">
                      <h3>{plan.name}</h3>
                      {plan.name === 'Pro' ? <Badge className="bg-primary text-white">Mais escolhido</Badge> : null}
                    </div>
                    <p className="text-2xl font-semibold tracking-[-0.03em] text-foreground">{plan.price}</p>
                    <p className="text-sm text-muted-foreground">{plan.copy}</p>
                    <div className="space-y-2 pt-2">
                      {plan.bullets.map((item) => (
                        <div key={item} className="flex items-start gap-2">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" />
                          <p className="text-sm text-muted-foreground">{item}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="page-section bg-background">
        <div className="page-shell max-w-4xl">
          <motion.div className="space-y-6 rounded-[20px] border border-border bg-background-secondary p-10" {...animationIn}>
            <span className="section-eyebrow">Transparência</span>
            <h2>O Cote Finance AI organiza e orienta. Não promete enriquecimento rápido.</h2>
            <p className="text-lg text-muted-foreground">
              O foco do produto é clareza financeira prática: mostrar gargalos, sugerir ações e acompanhar evolução real com consistência.
            </p>
            <Button size="lg" className="w-fit" onClick={handleFinanceAiEntry}>
              Acessar plataforma <ArrowRight className="h-4 w-4" />
            </Button>
          </motion.div>
        </div>
      </section>
    </>
  );
}

export default CoteFinanceAIPage;
