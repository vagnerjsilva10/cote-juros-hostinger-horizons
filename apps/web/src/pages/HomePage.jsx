
import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { SimulationModal } from '@/components/SimulationModal.jsx';
import { 
  Building2, Users, RefreshCw, ShieldCheck, Star, 
  ArrowRight, CreditCard, DollarSign, Home, Calculator, BookOpen
} from 'lucide-react';

function HomePage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [heroValue, setHeroValue] = useState('');

  const formatCurrency = (val) => {
    let v = val.replace(/\D/g, '');
    if (v) {
      v = (parseInt(v, 10) / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
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
      quote: 'Economizei mais de R$ 500 por mês no meu financiamento comparando as taxas aqui. O processo foi super rápido e transparente.'
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
        <meta name="description" content="Compare empréstimos, cartões e financiamentos em segundos e encontre a melhor oferta para seu perfil." />
      </Helmet>

      <SimulationModal isOpen={modalOpen} onClose={() => setModalOpen(false)} initialAmount={heroValue ? parseInt(heroValue.replace(/\D/g, '')) / 100 : 10000} />

      {/* Hero Section */}
      <section className="relative min-h-[85vh] flex items-center overflow-hidden bg-white">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-[#0F62FE]/5 to-[#7C3AED]/5 z-10" />
          <img
            src="https://images.unsplash.com/photo-1634693148975-362d570ca495?auto=format&fit=crop&w=2000&q=80"
            alt="Pessoas felizes usando celular"
            className="w-full h-full object-cover opacity-20 mix-blend-multiply"
          />
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-20">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
            >
              <h1 className="mb-6 text-foreground">
                Cote juros antes de pegar crédito.
              </h1>
              <p className="text-xl md:text-2xl text-foreground-secondary mb-10 leading-relaxed max-w-3xl mx-auto font-medium">
                Compare empréstimos, cartões e financiamentos em segundos e encontre a melhor oferta para seu perfil.
              </p>
              
              <div className="bg-white p-4 rounded-2xl shadow-premium max-w-2xl mx-auto flex flex-col sm:flex-row gap-3 border border-border">
                <form onSubmit={handleHeroSubmit} className="flex-1 flex flex-col sm:flex-row gap-3 w-full">
                  <div className="relative flex-1">
                    <Input 
                      placeholder="De quanto você precisa? (R$)"
                      className="h-14 text-lg pl-4 bg-slate-50 border-slate-200 text-foreground rounded-xl focus-visible:ring-primary"
                      value={heroValue}
                      onChange={(e) => formatCurrency(e.target.value)}
                    />
                  </div>
                  <Button type="submit" className="h-14 px-8 text-lg font-bold rounded-xl gradient-fintech-hover border-0 text-white w-full sm:w-auto shadow-md">
                    Simular agora
                  </Button>
                </form>
              </div>
              <p className="text-sm text-foreground-secondary mt-6 flex items-center justify-center gap-2 font-medium">
                <ShieldCheck className="w-4 h-4 text-primary" /> Simulação 100% gratuita e segura
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-12 bg-white border-b border-border">
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
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="flex flex-col items-center text-center space-y-3"
              >
                <div className={`w-14 h-14 rounded-2xl ${item.bg} flex items-center justify-center`}>
                  <item.icon className={`w-7 h-7 ${item.color}`} />
                </div>
                <span className="font-semibold text-foreground text-sm md:text-base leading-snug max-w-[150px]">{item.title}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Bento Grid */}
      <section className="py-24 bg-background-secondary">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="mb-4">Tudo para sua vida financeira</h2>
            <p className="text-lg text-foreground-secondary max-w-2xl mx-auto">
              Soluções inteligentes para economizar tempo e dinheiro.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <Link to="/emprestimos" className="group">
              <Card className="card-premium h-full overflow-hidden border-0 bg-white relative p-8">
                <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 rounded-full blur-3xl -mr-10 -mt-10 transition-all group-hover:bg-primary/10" />
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                  <DollarSign className="w-8 h-8 text-primary" />
                </div>
                <h3 className="mb-3 group-hover:text-primary transition-colors">Empréstimos</h3>
                <p className="text-foreground-secondary mb-6 text-lg">
                  Compare taxas de crédito pessoal, consignado e com garantia nas principais instituições.
                </p>
                <span className="font-semibold text-primary flex items-center">
                  Comparar ofertas <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </span>
              </Card>
            </Link>

            <Link to="/cartoes-de-credito" className="group">
              <Card className="card-premium h-full overflow-hidden border-0 bg-white relative p-8">
                <div className="absolute top-0 right-0 w-40 h-40 bg-secondary/5 rounded-full blur-3xl -mr-10 -mt-10 transition-all group-hover:bg-secondary/10" />
                <div className="w-16 h-16 rounded-2xl bg-secondary/10 flex items-center justify-center mb-6">
                  <CreditCard className="w-8 h-8 text-secondary" />
                </div>
                <h3 className="mb-3 group-hover:text-secondary transition-colors">Cartões de Crédito</h3>
                <p className="text-foreground-secondary mb-6 text-lg">
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
              <Card className="card-premium h-full overflow-hidden border-0 bg-white p-6">
                <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-4">
                  <Home className="w-6 h-6 text-accent" />
                </div>
                <h4 className="mb-2 group-hover:text-accent transition-colors">Financiamentos</h4>
                <p className="text-sm text-foreground-secondary mb-4">Simule a compra da casa própria ou veículo.</p>
                <span className="text-sm font-semibold text-accent flex items-center">Simular <ArrowRight className="w-3 h-3 ml-1" /></span>
              </Card>
            </Link>
            <Link to="/ferramentas" className="group">
              <Card className="card-premium h-full overflow-hidden border-0 bg-white p-6">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <Calculator className="w-6 h-6 text-primary" />
                </div>
                <h4 className="mb-2 group-hover:text-primary transition-colors">Ferramentas</h4>
                <p className="text-sm text-foreground-secondary mb-4">Calculadoras de juros compostos e mais.</p>
                <span className="text-sm font-semibold text-primary flex items-center">Acessar <ArrowRight className="w-3 h-3 ml-1" /></span>
              </Card>
            </Link>
            <Link to="/blog" className="group">
              <Card className="card-premium h-full overflow-hidden border-0 bg-white p-6">
                <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center mb-4">
                  <BookOpen className="w-6 h-6 text-secondary" />
                </div>
                <h4 className="mb-2 group-hover:text-secondary transition-colors">Blog</h4>
                <p className="text-sm text-foreground-secondary mb-4">Dicas e guias para sua educação financeira.</p>
                <span className="text-sm font-semibold text-secondary flex items-center">Ler artigos <ArrowRight className="w-3 h-3 ml-1" /></span>
              </Card>
            </Link>
          </div>
        </div>
      </section>

      {/* Cote Finance AI Section */}
      <section className="py-24 relative overflow-hidden bg-white border-y border-border">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary font-semibold text-sm mb-6">
                <Star className="w-4 h-4" /> Novo Recurso
              </div>
              <h2 className="mb-6">
                Cote Finance AI
              </h2>
              <p className="text-lg text-foreground-secondary mb-8">
                Nossa inteligência artificial faz uma varredura completa no mercado cruzando os dados do seu perfil com mais de 50 instituições para encontrar ofertas com até 95% de chance de aprovação.
              </p>
              <Link to="/cote-finance-ai">
                <Button size="lg" className="h-14 px-8 text-base gradient-fintech-hover border-0 text-white rounded-xl shadow-premium">
                  Analisar minhas finanças
                </Button>
              </Link>
            </motion.div>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} className="relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-secondary/10 rounded-3xl transform rotate-3 scale-105" />
              <img src="https://horizons-cdn.hostinger.com/443c1e2a-f701-46c0-a2d0-6f5862cdb5b5/2496356277d287d29e67622d8e0f4ba4.png" alt="AI Dashboard" className="relative rounded-2xl shadow-2xl border border-border" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-24 bg-background-secondary">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="mb-4">Milhares de histórias de sucesso</h2>
            <p className="text-lg text-foreground-secondary">O que nossos usuários dizem sobre nós.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((t, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                <Card className="card-premium bg-white border-border h-full">
                  <CardContent className="p-8 flex flex-col h-full">
                    <div className="flex items-center gap-1 mb-6">
                      {[1,2,3,4,5].map(star => <Star key={star} className="w-5 h-5 fill-amber-400 text-amber-400" />)}
                    </div>
                    <p className="text-foreground text-lg leading-relaxed mb-8 flex-1 font-medium">"{t.quote}"</p>
                    <div className="flex items-center gap-4 mt-auto pt-6 border-t border-border">
                      <img src={t.avatar} alt={t.name} className="w-12 h-12 rounded-full shadow-sm" />
                      <div>
                        <p className="font-bold text-foreground">{t.name}</p>
                        <p className="text-sm text-foreground-secondary">{t.location} • <span className="font-semibold text-primary">{t.product}</span></p>
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
