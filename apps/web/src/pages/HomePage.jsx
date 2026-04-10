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
  CheckCircle2
} from 'lucide-react';

const AI_DASHBOARD_ASSET = '/assets/cote-finance-ai-dashboard.png';

function HomePage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [heroValue, setHeroValue] = useState('');
  const [aiImageUnavailable, setAiImageUnavailable] = useState(false);

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
      name: 'Joao Silva',
      location: 'Sao Paulo, SP',
      product: 'Financiamento',
      avatar: 'https://ui-avatars.com/api/?name=Joao+Silva&background=0F62FE&color=fff',
      quote: 'Economizei mais de R$ 500 por mes no meu financiamento comparando as taxas aqui. O processo foi rapido e transparente.'
    },
    {
      name: 'Maria Santos',
      location: 'Rio de Janeiro, RJ',
      product: 'Cartao de Credito',
      avatar: 'https://ui-avatars.com/api/?name=Maria+Santos&background=7C3AED&color=fff',
      quote: 'Encontrei um cartao sem anuidade com otimo limite e cashback. Antes eu pagava taxas abusivas sem saber das opcoes.'
    },
    {
      name: 'Carlos Oliveira',
      location: 'Belo Horizonte, MG',
      product: 'Emprestimo Pessoal',
      avatar: 'https://ui-avatars.com/api/?name=Carlos+Oliveira&background=14B8A6&color=fff',
      quote: 'Estava negativado e achei que nao conseguiria credito. A plataforma me mostrou opcoes reais que couberam no meu bolso.'
    }
  ];

  return (
    <>
      <Helmet>
        <title>Cote Juros - Comparador Financeiro Premium</title>
        <meta
          name="description"
          content="Compare emprestimos, cartoes e financiamentos em segundos e encontre a melhor oferta para seu perfil."
        />
      </Helmet>

      <SimulationModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        initialAmount={heroValue ? parseInt(heroValue.replace(/\D/g, '')) / 100 : 10000}
      />

      <section className="relative overflow-hidden bg-background border-b border-border">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-secondary/10" />
          <div className="absolute -top-20 -left-20 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute -bottom-24 -right-20 h-80 w-80 rounded-full bg-secondary/10 blur-3xl" />
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 py-20 md:py-24 lg:py-28">
          <div className="max-w-5xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            >
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-white/90 px-4 py-2 text-sm font-semibold text-primary shadow-sm mb-8">
                <Sparkles className="h-4 w-4" /> Plataforma de comparacao com curadoria premium
              </span>

              <h1 className="mb-6 text-foreground">Cote juros antes de pegar credito.</h1>

              <p className="text-lg md:text-2xl text-muted-foreground mb-10 leading-relaxed max-w-3xl mx-auto font-medium">
                Compare emprestimos, cartoes e financiamentos em segundos para tomar decisoes financeiras com mais seguranca.
              </p>

              <div className="bg-card/95 backdrop-blur rounded-2xl shadow-premium max-w-3xl mx-auto p-4 sm:p-5 border border-border">
                <form onSubmit={handleHeroSubmit} className="flex flex-col sm:flex-row gap-3 w-full">
                  <Input
                    placeholder="De quanto voce precisa? (R$)"
                    className="h-14 text-lg bg-background border-border text-foreground rounded-xl"
                    value={heroValue}
                    onChange={(e) => formatCurrency(e.target.value)}
                  />
                  <Button
                    type="submit"
                    className="h-14 px-8 text-base md:text-lg font-bold rounded-xl gradient-fintech-hover border-0 text-white w-full sm:w-auto shadow-md"
                  >
                    Simular agora
                  </Button>
                </form>
              </div>

              <div className="mt-6 flex items-center justify-center gap-2 text-sm text-muted-foreground font-medium">
                <ShieldCheck className="w-4 h-4 text-primary" /> Simulacao 100% gratuita e segura
              </div>
            </motion.div>

            <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {[
                { label: 'Instituicoes analisadas', value: '50+' },
                { label: 'Simulacoes realizadas', value: 'Milhares' },
                { label: 'Atualizacao de taxas', value: 'Diaria' },
                { label: 'Consulta de risco', value: 'Soft Query' }
              ].map((metric) => (
                <div key={metric.label} className="rounded-xl border border-border bg-card px-4 py-4 text-left shadow-sm">
                  <p className="text-lg font-bold text-foreground">{metric.value}</p>
                  <p className="text-xs text-muted-foreground font-medium">{metric.label}</p>
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
              { icon: Building2, title: '50+ instituicoes analisadas', color: 'text-primary', bg: 'bg-primary/10' },
              { icon: Users, title: 'Milhares de simulacoes', color: 'text-secondary', bg: 'bg-secondary/10' },
              { icon: RefreshCw, title: 'Taxas atualizadas diariamente', color: 'text-accent', bg: 'bg-accent/10' },
              { icon: ShieldCheck, title: 'Seguranca de dados garantida', color: 'text-primary', bg: 'bg-primary/10' }
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
              Solucoes inteligentes para economizar tempo, reduzir custos e escolher credito com mais confianca.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <Link to="/emprestimos" className="group">
              <Card className="card-premium h-full overflow-hidden border-0 bg-card relative p-8">
                <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 rounded-full blur-3xl -mr-10 -mt-10 transition-all group-hover:bg-primary/10" />
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                  <DollarSign className="w-8 h-8 text-primary" />
                </div>
                <h3 className="mb-3 group-hover:text-primary transition-colors">Emprestimos</h3>
                <p className="text-muted-foreground mb-6 text-lg">
                  Compare taxas de credito pessoal, consignado e com garantia nas principais instituicoes.
                </p>
                <span className="font-semibold text-primary flex items-center">
                  Comparar ofertas <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </span>
              </Card>
            </Link>

            <Link to="/cartoes-de-credito" className="group">
              <Card className="card-premium h-full overflow-hidden border-0 bg-card relative p-8">
                <div className="absolute top-0 right-0 w-40 h-40 bg-secondary/5 rounded-full blur-3xl -mr-10 -mt-10 transition-all group-hover:bg-secondary/10" />
                <div className="w-16 h-16 rounded-2xl bg-secondary/10 flex items-center justify-center mb-6">
                  <CreditCard className="w-8 h-8 text-secondary" />
                </div>
                <h3 className="mb-3 group-hover:text-secondary transition-colors">Cartoes de Credito</h3>
                <p className="text-muted-foreground mb-6 text-lg">
                  Filtre por beneficios como milhas, cashback ou ausencia de anuidade e peca o seu.
                </p>
                <span className="font-semibold text-secondary flex items-center">
                  Ver melhores cartoes <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </span>
              </Card>
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <Link to="/financiamento" className="group">
              <Card className="card-premium h-full overflow-hidden border-0 bg-card p-6">
                <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-4">
                  <Home className="w-6 h-6 text-accent" />
                </div>
                <h4 className="mb-2 group-hover:text-accent transition-colors">Financiamentos</h4>
                <p className="text-sm text-muted-foreground mb-4">Simule a compra da casa propria ou veiculo.</p>
                <span className="text-sm font-semibold text-accent flex items-center">Simular <ArrowRight className="w-3 h-3 ml-1" /></span>
              </Card>
            </Link>
            <Link to="/ferramentas" className="group">
              <Card className="card-premium h-full overflow-hidden border-0 bg-card p-6">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <Calculator className="w-6 h-6 text-primary" />
                </div>
                <h4 className="mb-2 group-hover:text-primary transition-colors">Ferramentas</h4>
                <p className="text-sm text-muted-foreground mb-4">Calculadoras de juros compostos e mais.</p>
                <span className="text-sm font-semibold text-primary flex items-center">Acessar <ArrowRight className="w-3 h-3 ml-1" /></span>
              </Card>
            </Link>
            <Link to="/blog" className="group">
              <Card className="card-premium h-full overflow-hidden border-0 bg-card p-6">
                <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center mb-4">
                  <BookOpen className="w-6 h-6 text-secondary" />
                </div>
                <h4 className="mb-2 group-hover:text-secondary transition-colors">Blog</h4>
                <p className="text-sm text-muted-foreground mb-4">Dicas e guias para sua educacao financeira.</p>
                <span className="text-sm font-semibold text-secondary flex items-center">Ler artigos <ArrowRight className="w-3 h-3 ml-1" /></span>
              </Card>
            </Link>
          </div>
        </div>
      </section>

      <section className="py-24 relative overflow-hidden bg-background border-y border-border">
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute -right-20 top-8 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute -left-20 bottom-0 h-64 w-64 rounded-full bg-secondary/10 blur-3xl" />
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-14 items-center">
            <motion.div initial={{ opacity: 0, x: -24 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary font-semibold text-sm mb-6">
                <Sparkles className="w-4 h-4" /> Produto em destaque
              </div>
              <h2 className="mb-6">Cote Finance AI</h2>
              <p className="text-lg text-muted-foreground mb-8">
                Nossa inteligencia artificial cruza seu perfil com regras de credito de dezenas de instituicoes para priorizar ofertas com alta probabilidade de aprovacao.
              </p>

              <div className="space-y-3 mb-8">
                {[
                  'Leitura de perfil com foco em elegibilidade',
                  'Curadoria de ofertas por custo efetivo e chance de aprovacao',
                  'Fluxo orientado para decisao rapida e segura'
                ].map((item) => (
                  <div key={item} className="flex items-start gap-2 text-muted-foreground font-medium">
                    <CheckCircle2 className="w-5 h-5 text-primary mt-0.5" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>

              <Link to="/cote-finance-ai">
                <Button size="lg" className="h-14 px-8 text-base gradient-fintech-hover border-0 text-white rounded-xl shadow-premium">
                  Analisar minhas financas
                </Button>
              </Link>
            </motion.div>

            <motion.div initial={{ opacity: 0, scale: 0.96 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} className="relative">
              <div className="absolute inset-0 rounded-[28px] bg-gradient-to-tr from-primary/25 to-secondary/20 blur-xl" />

              <div className="relative rounded-[28px] border border-border bg-card shadow-2xl overflow-hidden">
                <div className="flex items-center gap-2 border-b border-border bg-background px-5 py-3">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-300" />
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
                  <span className="ml-3 text-xs text-muted-foreground font-medium">Cote Finance AI Dashboard</span>
                </div>

                {!aiImageUnavailable ? (
                  <img
                    src={AI_DASHBOARD_ASSET}
                    alt="Preview do dashboard Cote Finance AI"
                    className="w-full aspect-[16/10] object-cover"
                    onError={() => setAiImageUnavailable(true)}
                  />
                ) : (
                  <div className="aspect-[16/10] bg-gradient-to-br from-background via-primary/5 to-secondary/10 p-8">
                    <div className="h-full rounded-2xl border border-border bg-card p-5">
                      <div className="grid grid-cols-3 gap-3 mb-4">
                        <div className="h-12 rounded-lg bg-primary/10" />
                        <div className="h-12 rounded-lg bg-secondary/10" />
                        <div className="h-12 rounded-lg bg-accent/10" />
                      </div>
                      <div className="h-24 rounded-lg bg-muted mb-4" />
                      <div className="grid grid-cols-2 gap-3">
                        <div className="h-16 rounded-lg bg-muted" />
                        <div className="h-16 rounded-lg bg-muted" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-24 bg-secondary-subtle">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="mb-4">Milhares de historias de sucesso</h2>
            <p className="text-lg text-muted-foreground">O que nossos usuarios dizem sobre nos.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((t, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                <Card className="card-premium bg-card border-border h-full">
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
