import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { SimulationModal } from '@/components/SimulationModal.jsx';
import {
  Building2,
  Users,
  RefreshCw,
  ShieldCheck,
  Star,
  ArrowRight,
  CreditCard,
  DollarSign,
  Home,
  Calculator,
  BookOpen,
  Sparkles,
  CheckCircle2,
  BarChart3,
  Activity
} from 'lucide-react';
import { portalApi } from '@/platform/services/portalApi.js';
import { trackingService } from '@/platform/services/trackingService.js';

const AI_DASHBOARD_ASSET = '/assets/cote-finance-ai-dashboard.png';

function HomePage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [heroValue, setHeroValue] = useState('');
  const [testimonials, setTestimonials] = useState([]);

  const formatCurrency = (val) => {
    let v = val.replace(/\D/g, '');
    if (v) {
      v = (parseInt(v, 10) / 100).toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      });
    }
    setHeroValue(v);
  };

  const handleHeroSubmit = (e) => {
    e.preventDefault();
    setModalOpen(true);
  };
  useEffect(() => {
    portalApi.getTestimonials().then(setTestimonials);
  }, []);

  return (
    <>
      <Helmet>
        <title>Cote Juros - Comparador Financeiro Premium</title>
        <meta
          name="description"
          content="Compare empréstimos, cartões e financiamentos em segundos e encontre a melhor oferta para seu perfil."
        />
      </Helmet>

      <SimulationModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        initialAmount={heroValue ? parseInt(heroValue.replace(/\D/g, '')) / 100 : 10000}
      />

      <section className="relative isolate overflow-hidden border-b border-slate-800/80 bg-[linear-gradient(135deg,#0F172A_0%,#1E293B_40%,#312E81_100%)] text-white">
        <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(circle_at_16%_16%,rgba(96,165,250,0.16),transparent_36%),radial-gradient(circle_at_84%_18%,rgba(129,140,248,0.18),transparent_38%)]" />
        <div className="pointer-events-none absolute inset-0 z-0 opacity-[0.16] [background-image:linear-gradient(rgba(148,163,184,0.24)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.24)_1px,transparent_1px)] [background-size:64px_64px]" />
        <div className="pointer-events-none absolute -left-24 top-10 z-0 h-64 w-64 rounded-full bg-blue-500/12 blur-[95px]" />
        <div className="pointer-events-none absolute -right-28 top-4 z-0 h-72 w-72 rounded-full bg-violet-500/12 blur-[100px]" />

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 py-20 md:py-24 lg:py-28">
          <div className="max-w-5xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            >
              <span className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-4 py-2 text-sm font-semibold text-white/60 shadow-sm">
                <Sparkles className="h-4 w-4 text-white/80" /> Plataforma de comparação com curadoria premium
              </span>

              <h1 className="mb-6 text-white drop-shadow-[0_6px_24px_rgba(2,6,23,0.45)]">Cote juros antes de pegar crédito.</h1>

              <p className="mx-auto mb-10 max-w-3xl text-lg font-medium leading-relaxed text-white/80 md:text-2xl">
                Compare empréstimos, cartões e financiamentos em segundos para tomar decisões financeiras com mais segurança.
              </p>

              <div className="mx-auto mb-8 grid max-w-4xl gap-3 sm:grid-cols-3">
                {[
                  { label: 'Radar de taxas', value: 'Atualização diária' },
                  { label: 'Motor de elegibilidade', value: 'Leitura em segundos' },
                  { label: 'Curadoria inteligente', value: 'Ofertas priorizadas' }
                ].map((signal) => (
                  <div key={signal.label} className="rounded-xl border border-white/12 bg-white/8 px-4 py-3 text-left shadow-[0_12px_26px_-18px_rgba(2,6,23,0.92)] backdrop-blur-sm">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-white/60">{signal.label}</p>
                    <p className="text-sm font-semibold text-white">{signal.value}</p>
                  </div>
                ))}
              </div>

              <div className="relative max-w-3xl mx-auto">
                <div className="pointer-events-none absolute inset-x-12 -inset-y-3 bg-blue-500/16 blur-2xl" />
                <div className="relative rounded-2xl bg-white p-2 shadow-[0_20px_40px_rgba(0,0,0,0.25)]">
                  <form onSubmit={handleHeroSubmit} className="flex flex-col sm:flex-row gap-3 w-full">
                    <Input
                      placeholder="De quanto você precisa? (R$)"
                      className="h-14 text-lg bg-slate-50 border-slate-200 text-foreground rounded-xl shadow-inner"
                      value={heroValue}
                      onChange={(e) => formatCurrency(e.target.value)}
                    />
                    <Button
                      type="submit"
                      className="h-14 px-8 text-base md:text-lg font-bold rounded-xl gradient-fintech-hover border-0 text-white w-full sm:w-auto shadow-md transition-transform duration-300 hover:-translate-y-0.5"
                    >
                      Simular agora
                    </Button>
                  </form>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-center gap-2 text-sm font-medium text-white/80">
                <ShieldCheck className="w-4 h-4 text-white/80" /> Simulação 100% gratuita e segura
              </div>
            </motion.div>

            <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {[
                { label: 'Instituições analisadas', value: '50+' },
                { label: 'Simulações realizadas', value: 'Milhares' },
                { label: 'Atualização de taxas', value: 'Diária' },
                { label: 'Consulta de risco', value: 'Soft Query' }
              ].map((metric) => (
                <div key={metric.label} className="rounded-xl border border-white/12 bg-white/8 px-4 py-4 text-left shadow-[0_10px_24px_-18px_rgba(2,6,23,0.8)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/10 backdrop-blur-sm">
                  <p className="text-lg font-bold text-white">{metric.value}</p>
                  <p className="text-xs text-white/80 font-medium">{metric.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 bg-card border-b border-border">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 lg:gap-10">
            {[
              { icon: Building2, title: '50+ instituições analisadas', color: 'text-primary', bg: 'bg-primary/10' },
              { icon: Users, title: 'Milhares de simulações', color: 'text-secondary', bg: 'bg-secondary/10' },
              { icon: RefreshCw, title: 'Taxas atualizadas diariamente', color: 'text-accent', bg: 'bg-accent/10' },
              { icon: ShieldCheck, title: 'Segurança de dados garantida', color: 'text-primary', bg: 'bg-primary/10' }
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.45 }}
                className="flex flex-col items-center text-center space-y-3"
              >
                <div className={`w-14 h-14 rounded-2xl ${item.bg} flex items-center justify-center`}>
                  <item.icon className={`w-7 h-7 ${item.color}`} />
                </div>
                <span className="font-semibold text-foreground text-sm md:text-base leading-snug max-w-[170px]">{item.title}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 bg-secondary-subtle">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <h2 className="mb-4">Tudo para sua vida financeira</h2>
            <p className="text-lg text-muted-foreground">
              Soluções inteligentes para economizar tempo, reduzir custos e escolher crédito com mais confiança.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <Link to="/emprestimos" className="group">
              <Card className="card-premium h-full overflow-hidden border-0 bg-card relative p-8 transition-all duration-300 group-hover:-translate-y-1">
                <div className="absolute top-0 right-0 w-44 h-44 bg-primary/10 rounded-full blur-3xl -mr-12 -mt-12 transition-all group-hover:bg-primary/15" />
                <span className="mb-5 inline-flex rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold tracking-wide text-primary">Crédito pessoal</span>
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-5">
                  <DollarSign className="w-8 h-8 text-primary" />
                </div>
                <h3 className="mb-3 group-hover:text-primary transition-colors">Empréstimos</h3>
                <p className="text-muted-foreground mb-6 text-lg">
                  Compare taxas de crédito pessoal, consignado e com garantia nas principais instituições.
                </p>
                <div className="mb-6 grid grid-cols-2 gap-3">
                  <div className="rounded-lg border border-border bg-slate-50 px-3 py-2">
                    <p className="text-[11px] uppercase tracking-wide text-slate-500">Análise inicial</p>
                    <p className="text-sm font-semibold text-foreground">em minutos</p>
                  </div>
                  <div className="rounded-lg border border-border bg-slate-50 px-3 py-2">
                    <p className="text-[11px] uppercase tracking-wide text-slate-500">Comparação</p>
                    <p className="text-sm font-semibold text-foreground">50+ bancos</p>
                  </div>
                </div>
                <span className="font-semibold text-primary flex items-center">
                  Comparar ofertas <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </span>
              </Card>
            </Link>

            <Link to="/cartoes-de-credito" className="group">
              <Card className="card-premium h-full overflow-hidden border-0 bg-card relative p-8 transition-all duration-300 group-hover:-translate-y-1">
                <div className="absolute top-0 right-0 w-44 h-44 bg-secondary/10 rounded-full blur-3xl -mr-12 -mt-12 transition-all group-hover:bg-secondary/15" />
                <span className="mb-5 inline-flex rounded-full border border-secondary/20 bg-secondary/5 px-3 py-1 text-xs font-semibold tracking-wide text-secondary">Cartões premium</span>
                <div className="w-16 h-16 rounded-2xl bg-secondary/10 flex items-center justify-center mb-5">
                  <CreditCard className="w-8 h-8 text-secondary" />
                </div>
                <h3 className="mb-3 group-hover:text-secondary transition-colors">Cartões de Crédito</h3>
                <p className="text-muted-foreground mb-6 text-lg">
                  Filtre por benefícios como milhas, cashback ou ausência de anuidade e peça o seu.
                </p>
                <div className="mb-6 grid grid-cols-2 gap-3">
                  <div className="rounded-lg border border-border bg-slate-50 px-3 py-2">
                    <p className="text-[11px] uppercase tracking-wide text-slate-500">Sem anuidade</p>
                    <p className="text-sm font-semibold text-foreground">opções ativas</p>
                  </div>
                  <div className="rounded-lg border border-border bg-slate-50 px-3 py-2">
                    <p className="text-[11px] uppercase tracking-wide text-slate-500">Benefícios</p>
                    <p className="text-sm font-semibold text-foreground">milhas e cashback</p>
                  </div>
                </div>
                <span className="font-semibold text-secondary flex items-center">
                  Ver melhores cartões <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </span>
              </Card>
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <Link to="/financiamento" className="group">
              <Card className="card-premium h-full overflow-hidden border-0 bg-card p-6 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:shadow-[var(--shadow-md)]">
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-accent/80">Planejamento patrimonial</p>
                <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-4">
                  <Home className="w-6 h-6 text-accent" />
                </div>
                <h4 className="mb-2 group-hover:text-accent transition-colors">Financiamentos</h4>
                <p className="text-sm text-muted-foreground mb-4">Simule a compra da casa própria ou veículo.</p>
                <span className="text-sm font-semibold text-accent flex items-center">Simular <ArrowRight className="w-3 h-3 ml-1" /></span>
              </Card>
            </Link>
            <Link to="/ferramentas" className="group">
              <Card className="card-premium h-full overflow-hidden border-0 bg-card p-6 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:shadow-[var(--shadow-md)]">
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-primary/80">Inteligência de cálculo</p>
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <Calculator className="w-6 h-6 text-primary" />
                </div>
                <h4 className="mb-2 group-hover:text-primary transition-colors">Ferramentas</h4>
                <p className="text-sm text-muted-foreground mb-4">Calculadoras de juros compostos e mais.</p>
                <span className="text-sm font-semibold text-primary flex items-center">Acessar <ArrowRight className="w-3 h-3 ml-1" /></span>
              </Card>
            </Link>
            <Link to="/blog" className="group">
              <Card className="card-premium h-full overflow-hidden border-0 bg-card p-6 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:shadow-[var(--shadow-md)]">
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-secondary/80">Conteúdo editorial</p>
                <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center mb-4">
                  <BookOpen className="w-6 h-6 text-secondary" />
                </div>
                <h4 className="mb-2 group-hover:text-secondary transition-colors">Blog</h4>
                <p className="text-sm text-muted-foreground mb-4">Dicas e guias para sua educação financeira.</p>
                <span className="text-sm font-semibold text-secondary flex items-center">Ler artigos <ArrowRight className="w-3 h-3 ml-1" /></span>
              </Card>
            </Link>
          </div>
        </div>
      </section>

      <section className="relative border-y border-border bg-background py-14 md:py-16">
        <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
          <div className="absolute -right-20 top-8 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute -left-20 bottom-0 h-64 w-64 rounded-full bg-secondary/10 blur-3xl" />
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-10 items-center">
            <motion.div initial={{ opacity: 0, x: -24 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary font-semibold text-sm mb-6">
                <Sparkles className="w-4 h-4" /> Produto em destaque
              </div>
              <h2 className="mb-6">Cote Finance AI</h2>
              <p className="text-lg text-muted-foreground mb-8">
                Plataforma de organização financeira com IA para entender entradas, saídas e padrões de gasto, acompanhar metas, dívidas e investimentos e decidir melhor no dia a dia.
              </p>

              <div className="space-y-3 mb-8">
                {[
                  'Dashboard financeiro com visão consolidada do mês',
                  'Insights automáticos para identificar desperdícios e priorizar ajustes',
                  'Acompanhamento de metas, dívidas e carteira com contexto real'
                ].map((item) => (
                  <div key={item} className="flex items-start gap-2 text-muted-foreground font-medium">
                    <CheckCircle2 className="w-5 h-5 text-primary mt-0.5" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>

              <Link to="/cote-finance-ai">
                <Button
                  size="lg"
                  className="h-14 px-8 text-base gradient-fintech-hover border-0 text-white rounded-xl shadow-premium transition-transform duration-300 hover:-translate-y-0.5"
                  onClick={() =>
                    trackingService.trackCtaClick({
                      sourcePage: '/',
                      ctaId: 'home_ai_analisar',
                      ctaLabel: 'Analisar minhas finanças',
                      productType: 'loan'
                    })
                  }
                >
                  Analisar minhas finanças
                </Button>
              </Link>
            </motion.div>

            <motion.div
              animate={{ y: [0, -4, 0], rotate: [0, -0.45, 0] }}
              transition={{ duration: 12.5, repeat: Infinity, ease: [0.42, 0, 0.18, 1] }}
              className="relative mx-auto w-full max-w-[560px]"
            >
              <div className="pointer-events-none absolute -inset-x-8 -inset-y-8 rounded-[34px] bg-[radial-gradient(circle_at_55%_42%,rgba(37,99,235,0.22),rgba(30,64,175,0.08)_45%,transparent_74%)]" />
              <div className="pointer-events-none absolute inset-0 translate-y-4 rounded-[30px] bg-[#0f172a]/8 blur-xl" />

              <div className="relative overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[var(--shadow-md)]">
                <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-blue-300" />
                    <span className="h-2 w-2 rounded-full bg-sky-300" />
                    <span className="h-2 w-2 rounded-full bg-emerald-300/80" />
                  </div>
                  <span className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-600">
                    <BarChart3 className="h-3.5 w-3.5 text-primary" />
                    Cote Finance AI
                  </span>
                  <span className="rounded-full border border-slate-300 px-2 py-0.5 text-[10px] font-semibold text-slate-600">Live</span>
                </div>

                <div className="relative bg-slate-50 p-3">
                  <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white">
                    <img
                      src={AI_DASHBOARD_ASSET}
                      alt="Dashboard do Cote Finance AI"
                      className="h-[250px] w-full object-cover object-top"
                      loading="lazy"
                    />
                    <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,rgba(15,23,42,0.38),rgba(15,23,42,0.03)_42%,transparent)]" />
                    <div className="absolute inset-x-3 bottom-3 grid grid-cols-3 gap-2">
                      {[
                        { label: 'Entradas', value: 'R$ 5.840' },
                        { label: 'Saidas', value: 'R$ 4.960' },
                        { label: 'Margem', value: 'R$ 880' }
                      ].map((item) => (
                        <div key={item.label} className="rounded-lg border border-slate-200 bg-white/95 px-2.5 py-2 backdrop-blur-[2px]">
                          <p className="text-[10px] font-medium text-slate-500">{item.label}</p>
                          <p className="text-xs font-bold text-slate-700">{item.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <motion.div
                animate={{ y: [0, -2.2, 0], rotate: [0, -0.5, 0] }}
                transition={{ duration: 9.4, repeat: Infinity, ease: 'easeInOut', delay: 0.1 }}
                className="absolute -left-8 top-14 hidden rounded-2xl border border-slate-200 bg-white px-3 py-2.5 shadow-[var(--shadow-sm)] md:block"
              >
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Saldo atual</p>
                <p className="text-sm font-bold text-primary">R$ 7.110</p>
              </motion.div>

              <motion.div
                animate={{ y: [0, 2.8, 0], rotate: [0, 0.65, 0] }}
                transition={{ duration: 10.3, repeat: Infinity, ease: 'easeInOut', delay: 0.45 }}
                className="absolute -right-8 bottom-14 hidden items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2.5 shadow-[var(--shadow-sm)] md:flex"
              >
                <Activity className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Meta mensal</p>
                  <p className="text-xs font-bold text-slate-700">67% concluída</p>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-24 bg-secondary-subtle">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="mb-4">Milhares de histórias de sucesso</h2>
            <p className="text-lg text-muted-foreground">O que nossos usuários dizem sobre nós.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((t, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                <Card className="card-premium bg-card border-border h-full transition-all duration-300 hover:-translate-y-1">
                  <CardContent className="p-8 flex flex-col h-full">
                    <div className="mb-5 flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star key={star} className="w-5 h-5 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                      <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">{t.badge}</span>
                    </div>
                    <p className="mb-7 text-lg font-medium leading-relaxed text-foreground">"{t.quote}"</p>
                    <div className="mb-7 rounded-xl border border-primary/15 bg-primary/5 px-4 py-3">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-primary/80">Resultado reportado</p>
                      <p className="text-sm font-bold text-primary">{t.result}</p>
                    </div>
                    <div className="mt-auto flex items-center gap-4 border-t border-border pt-6">
                      <img src={t.avatar} alt={t.name} className="w-12 h-12 rounded-full shadow-sm" />
                      <div>
                        <p className="font-bold text-foreground">{t.name}</p>
                        <p className="text-sm text-muted-foreground">{t.location} • <span className="font-semibold text-primary">{t.product}</span></p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

export default HomePage;

