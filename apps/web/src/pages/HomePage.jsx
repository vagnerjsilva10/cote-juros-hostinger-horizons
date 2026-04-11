import React, { useState } from 'react';
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

function HomePage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [heroValue, setHeroValue] = useState('');

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

  const testimonials = [
    {
      name: 'João Silva',
      location: 'São Paulo, SP',
      product: 'Financiamento',
      avatar: 'https://ui-avatars.com/api/?name=Joao+Silva&background=0F62FE&color=fff',
      quote: 'Economizei mais de R$ 500 por mês no meu financiamento comparando as taxas aqui. O processo foi rápido e transparente.'
    },
    {
      name: 'Maria Santos',
      location: 'Rio de Janeiro, RJ',
      product: 'Cartão de Crédito',
      avatar: 'https://ui-avatars.com/api/?name=Maria+Santos&background=7C3AED&color=fff',
      quote: 'Encontrei um cartão sem anuidade com ótimo limite e cashback. Antes eu pagava taxas abusivas sem saber das opções.'
    },
    {
      name: 'Carlos Oliveira',
      location: 'Belo Horizonte, MG',
      product: 'Empréstimo Pessoal',
      avatar: 'https://ui-avatars.com/api/?name=Carlos+Oliveira&background=14B8A6&color=fff',
      quote: 'Estava negativado e achei que não conseguiria crédito. A plataforma me mostrou opções reais que couberam no meu bolso.'
    }
  ];

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

      <section className="relative isolate overflow-hidden border-b border-slate-800/80 bg-gradient-to-b from-[#0B1220] to-[#111827] text-white">
        <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(circle_at_20%_18%,rgba(59,130,246,0.15),transparent_42%),radial-gradient(circle_at_82%_14%,rgba(124,58,237,0.13),transparent_44%)]" />
        <div className="pointer-events-none absolute -left-24 top-12 z-0 h-64 w-64 rounded-full bg-blue-500/10 blur-[90px]" />
        <div className="pointer-events-none absolute -right-24 top-6 z-0 h-72 w-72 rounded-full bg-violet-500/10 blur-[95px]" />

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 py-20 md:py-24 lg:py-28">
          <div className="max-w-5xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            >
              <span className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/20 bg-slate-900/40 px-4 py-2 text-sm font-semibold text-white shadow-sm">
                <Sparkles className="h-4 w-4 text-cyan-300" /> Plataforma de comparação com curadoria premium
              </span>

              <h1 className="mb-6 text-white drop-shadow-[0_6px_24px_rgba(2,6,23,0.45)]">Cote juros antes de pegar crédito.</h1>

              <p className="mx-auto mb-10 max-w-3xl text-lg font-medium leading-relaxed text-slate-200 md:text-2xl">
                Compare empréstimos, cartões e financiamentos em segundos para tomar decisões financeiras com mais segurança.
              </p>

              <div className="relative max-w-3xl mx-auto">
                <div className="pointer-events-none absolute inset-x-12 -inset-y-3 bg-blue-500/16 blur-2xl" />
                <div className="relative rounded-2xl border border-slate-200/90 bg-white p-4 shadow-[0_22px_48px_-26px_rgba(2,6,23,0.75)] sm:p-5">
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

              <div className="mt-6 flex items-center justify-center gap-2 text-sm font-medium text-slate-200">
                <ShieldCheck className="w-4 h-4 text-cyan-300" /> Simulação 100% gratuita e segura
              </div>
            </motion.div>

            <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {[
                { label: 'Instituições analisadas', value: '50+' },
                { label: 'Simulações realizadas', value: 'Milhares' },
                { label: 'Atualização de taxas', value: 'Diária' },
                { label: 'Consulta de risco', value: 'Soft Query' }
              ].map((metric) => (
                <div key={metric.label} className="rounded-xl border border-slate-200/20 bg-slate-900/40 px-4 py-4 text-left shadow-[0_10px_24px_-18px_rgba(2,6,23,0.8)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-slate-900/50">
                  <p className="text-lg font-bold text-white">{metric.value}</p>
                  <p className="text-xs text-slate-200 font-medium">{metric.label}</p>
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
              <Card className="card-premium h-full overflow-hidden border-0 bg-card relative p-8 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:shadow-xl">
                <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 rounded-full blur-3xl -mr-10 -mt-10 transition-all group-hover:bg-primary/10" />
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                  <DollarSign className="w-8 h-8 text-primary" />
                </div>
                <h3 className="mb-3 group-hover:text-primary transition-colors">Empréstimos</h3>
                <p className="text-muted-foreground mb-6 text-lg">
                  Compare taxas de crédito pessoal, consignado e com garantia nas principais instituições.
                </p>
                <span className="font-semibold text-primary flex items-center">
                  Comparar ofertas <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </span>
              </Card>
            </Link>

            <Link to="/cartoes-de-credito" className="group">
              <Card className="card-premium h-full overflow-hidden border-0 bg-card relative p-8 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:shadow-xl">
                <div className="absolute top-0 right-0 w-40 h-40 bg-secondary/5 rounded-full blur-3xl -mr-10 -mt-10 transition-all group-hover:bg-secondary/10" />
                <div className="w-16 h-16 rounded-2xl bg-secondary/10 flex items-center justify-center mb-6">
                  <CreditCard className="w-8 h-8 text-secondary" />
                </div>
                <h3 className="mb-3 group-hover:text-secondary transition-colors">Cartões de Crédito</h3>
                <p className="text-muted-foreground mb-6 text-lg">
                  Filtre por benefícios como milhas, cashback ou ausência de anuidade e peça o seu.
                </p>
                <span className="font-semibold text-secondary flex items-center">
                  Ver melhores cartões <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </span>
              </Card>
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <Link to="/financiamento" className="group">
              <Card className="card-premium h-full overflow-hidden border-0 bg-card p-6 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:shadow-xl">
                <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-4">
                  <Home className="w-6 h-6 text-accent" />
                </div>
                <h4 className="mb-2 group-hover:text-accent transition-colors">Financiamentos</h4>
                <p className="text-sm text-muted-foreground mb-4">Simule a compra da casa própria ou veículo.</p>
                <span className="text-sm font-semibold text-accent flex items-center">Simular <ArrowRight className="w-3 h-3 ml-1" /></span>
              </Card>
            </Link>
            <Link to="/ferramentas" className="group">
              <Card className="card-premium h-full overflow-hidden border-0 bg-card p-6 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:shadow-xl">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <Calculator className="w-6 h-6 text-primary" />
                </div>
                <h4 className="mb-2 group-hover:text-primary transition-colors">Ferramentas</h4>
                <p className="text-sm text-muted-foreground mb-4">Calculadoras de juros compostos e mais.</p>
                <span className="text-sm font-semibold text-primary flex items-center">Acessar <ArrowRight className="w-3 h-3 ml-1" /></span>
              </Card>
            </Link>
            <Link to="/blog" className="group">
              <Card className="card-premium h-full overflow-hidden border-0 bg-card p-6 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:shadow-xl">
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

      <section className="py-14 md:py-16 relative overflow-hidden bg-background border-y border-border">
        <div className="absolute inset-0 z-0 pointer-events-none">
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
                Nossa inteligência artificial cruza seu perfil com regras de crédito de dezenas de instituições para priorizar ofertas com alta probabilidade de aprovação.
              </p>

              <div className="space-y-3 mb-8">
                {[
                  'Leitura de perfil com foco em elegibilidade',
                  'Curadoria de ofertas por custo efetivo e chance de aprovação',
                  'Fluxo orientado para decisão rápida e segura'
                ].map((item) => (
                  <div key={item} className="flex items-start gap-2 text-muted-foreground font-medium">
                    <CheckCircle2 className="w-5 h-5 text-primary mt-0.5" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>

              <Link to="/cote-finance-ai">
                <Button size="lg" className="h-14 px-8 text-base gradient-fintech-hover border-0 text-white rounded-xl shadow-premium transition-transform duration-300 hover:-translate-y-0.5">
                  Analisar minhas finanças
                </Button>
              </Link>
            </motion.div>

            <motion.div
              animate={{ y: [0, -3, 0], rotate: [-0.25, -0.55, -0.25] }}
              transition={{ duration: 13, repeat: Infinity, ease: [0.42, 0, 0.18, 1] }}
              className="relative mx-auto w-full max-w-[520px]"
            >
              <div className="pointer-events-none absolute -inset-x-10 -inset-y-8 rounded-[36px] bg-[radial-gradient(circle_at_50%_34%,rgba(37,99,235,0.20),rgba(30,64,175,0.10)_40%,transparent_72%)]" />
              <div className="pointer-events-none absolute inset-0 translate-y-4 rounded-[30px] bg-[#020617]/45 blur-xl" />
              <div className="pointer-events-none absolute inset-0 rounded-[30px] bg-gradient-to-tr from-blue-500/18 via-transparent to-indigo-500/16 blur-xl" />

              <div className="relative overflow-hidden rounded-[28px] border border-[#2A3B59] bg-[#070F1E] shadow-[0_42px_95px_-38px_rgba(29,78,216,0.56)] md:[transform:perspective(1500px)_rotateY(-2.8deg)]">
                <div className="flex items-center justify-between border-b border-[#273754] bg-[#0A1428] px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-cyan-300/80" />
                    <span className="h-2 w-2 rounded-full bg-indigo-300/80" />
                    <span className="h-2 w-2 rounded-full bg-emerald-300/80" />
                  </div>
                  <span className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-300">
                    <BarChart3 className="h-3.5 w-3.5 text-cyan-300" />
                    Cote Finance AI
                  </span>
                  <span className="h-2 w-8 rounded-full bg-slate-600/70" />
                </div>

                <div className="grid grid-cols-[88px,1fr] gap-3 bg-[#050D1D] p-4">
                  <div className="space-y-2 rounded-xl border border-[#25344F] bg-[#0A152A] p-2.5">
                    <div className="h-7 rounded-lg bg-[#1C2A43]" />
                    <div className="h-7 rounded-lg bg-[#18243A]" />
                    <div className="h-7 rounded-lg bg-[#163056]" />
                    <div className="h-7 rounded-lg bg-[#18243A]" />
                  </div>

                  <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-2.5">
                      {[
                        { label: 'Custo total', value: '8.9%' },
                        { label: 'Aprovação', value: '92%' },
                        { label: 'Economia', value: 'R$ 640' }
                      ].map((item) => (
                        <div key={item.label} className="rounded-lg border border-[#2A3B59] bg-[#0A152A] px-2.5 py-2">
                          <p className="text-[10px] font-medium text-slate-400">{item.label}</p>
                          <p className="text-sm font-bold text-slate-100">{item.value}</p>
                        </div>
                      ))}
                    </div>

                    <div className="rounded-xl border border-[#2A3B59] bg-[#0A152A] p-3">
                      <div className="mb-3 flex items-center justify-between">
                        <p className="text-xs font-semibold text-slate-200">Performance de ofertas</p>
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-cyan-300">Atualizado</p>
                      </div>
                      <div className="relative h-[116px] overflow-hidden rounded-lg border border-[#263754] bg-[#040B19] p-2.5">
                        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(56,189,248,0.12),transparent_58%)]" />
                        <div className="pointer-events-none absolute inset-x-2.5 top-[24%] border-t border-[#274165]/45" />
                        <div className="pointer-events-none absolute inset-x-2.5 top-[45%] border-t border-[#233554]/40" />
                        <div className="pointer-events-none absolute inset-x-2.5 top-[66%] border-t border-[#1E2E49]/38" />
                        <div className="flex h-full items-end gap-1.5">
                          {[28, 40, 35, 52, 46, 62, 58, 70].map((h, idx) => (
                            <div key={idx} className="relative flex-1 overflow-hidden rounded-t-md bg-gradient-to-t from-[#1D4ED8] via-[#2563EB] to-[#67E8F9] shadow-[0_0_16px_rgba(37,99,235,0.25)]" style={{ height: `${h}%` }}>
                              <span className="absolute inset-x-0 top-0 h-[1px] bg-cyan-100/75" />
                              <span className="absolute inset-x-0 top-1 h-[1px] bg-cyan-200/35" />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <motion.div
                animate={{ y: [0, -1.8, 0], rotate: [0, -0.7, 0] }}
                transition={{ duration: 9.6, repeat: Infinity, ease: 'easeInOut', delay: 0.1 }}
                className="absolute -left-7 top-12 hidden rounded-2xl border border-[#2A3B59] bg-[#0A152A] px-3 py-2.5 shadow-[0_22px_36px_-24px_rgba(2,6,23,0.72)] md:block"
              >
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Saldo atual</p>
                <p className="text-sm font-bold text-cyan-300">R$ 7.110</p>
              </motion.div>

              <motion.div
                animate={{ y: [0, 2.6, 0], rotate: [0, 0.75, 0] }}
                transition={{ duration: 10.2, repeat: Infinity, ease: 'easeInOut', delay: 0.45 }}
                className="absolute -right-8 bottom-14 hidden items-center gap-2 rounded-2xl border border-[#2A3B59] bg-[#0A152A] px-3 py-2.5 shadow-[0_22px_36px_-24px_rgba(2,6,23,0.72)] md:flex"
              >
                <Activity className="h-4 w-4 text-emerald-400" />
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Meta mensal</p>
                  <p className="text-xs font-bold text-slate-100">67% concluída</p>
                </div>
              </motion.div>

              <motion.div
                animate={{ y: [0, -1.2, 0], rotate: [0, 0.45, 0] }}
                transition={{ duration: 11.2, repeat: Infinity, ease: 'easeInOut', delay: 0.7 }}
                className="absolute -right-6 -top-8 hidden rounded-2xl border border-[#2A3B59] bg-[#0A152A] px-3 py-2 shadow-[0_22px_36px_-24px_rgba(2,6,23,0.72)] lg:block"
              >
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Insight IA</p>
                <p className="text-xs font-semibold text-slate-100">Troca recomendada: -1.4% CET</p>
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
                <Card className="card-premium bg-card border-border h-full transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl">
                  <CardContent className="p-8 flex flex-col h-full">
                    <div className="flex items-center gap-1 mb-6">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star key={star} className="w-5 h-5 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <p className="text-foreground text-lg leading-relaxed mb-8 flex-1 font-medium">"{t.quote}"</p>
                    <div className="flex items-center gap-4 mt-auto pt-6 border-t border-border">
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
