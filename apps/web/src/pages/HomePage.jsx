import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  Calculator,
  CheckCircle2,
  CreditCard,
  HandCoins,
  Lightbulb,
  ShieldCheck,
  Sparkles,
  TrendingUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { SimulationModal } from '@/components/SimulationModal.jsx';
import { portalApi } from '@/platform/services/portalApi.js';
import { trackingService } from '@/platform/services/trackingService.js';

const bankLogos = [
  { name: 'Nubank', logo: 'https://logo.clearbit.com/nubank.com.br' },
  { name: 'Itaú', logo: 'https://logo.clearbit.com/itau.com.br' },
  { name: 'Santander', logo: 'https://logo.clearbit.com/santander.com.br' },
  { name: 'C6', logo: 'https://logo.clearbit.com/c6bank.com.br' },
  { name: 'Inter', logo: 'https://logo.clearbit.com/bancointer.com.br' },
  { name: 'Banco do Brasil', logo: 'https://logo.clearbit.com/bb.com.br' }
];

const fallbackTestimonials = [
  {
    name: 'Larissa M.',
    location: 'São Paulo, SP',
    product: 'Empréstimo pessoal',
    quote: 'Vi taxa, prazo e custo total no mesmo lugar e evitei fechar um contrato mais caro.',
    badge: 'Economia real'
  },
  {
    name: 'Rafael P.',
    location: 'Belo Horizonte, MG',
    product: 'Cartão de crédito',
    quote: 'Consegui comparar benefícios e condições sem perder tempo em vários sites de banco.',
    badge: 'Decisão segura'
  },
  {
    name: 'Marina C.',
    location: 'Curitiba, PR',
    product: 'Financiamento',
    quote: 'O comparador me mostrou opções mais aderentes ao meu perfil e com melhor custo.',
    badge: 'Comparação inteligente'
  }
];

const fallbackComparisonRows = [
  {
    product: 'Empréstimo pessoal',
    bank: 'Banco parceiro',
    rate: 'A partir de 1,89% a.m.',
    limit: 'Até R$ 80.000',
    benefit: 'Custo total claro antes de contratar.'
  },
  {
    product: 'Cartão de crédito',
    bank: 'Instituição digital',
    rate: 'Sem anuidade em linhas selecionadas',
    limit: 'Até R$ 20.000',
    benefit: 'Comparação de limite, anuidade e benefícios reais.'
  },
  {
    product: 'Financiamento',
    bank: 'Banco tradicional',
    rate: 'A partir de 8,99% a.a.',
    limit: 'Até 360 meses',
    benefit: 'Leitura rápida de entrada, taxa e prazo.'
  }
];

const animationIn = {
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.35, ease: 'easeOut' }
};

const formatCurrency = (value) => {
  let next = value.replace(/\D/g, '');
  if (next) {
    next = (parseInt(next, 10) / 100).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  }
  return next;
};

const formatRate = (value, suffix) => {
  if (value == null || Number.isNaN(Number(value))) return '--';
  return `${Number(value).toFixed(2)}% ${suffix}`;
};

function FinanceAiIllustration() {
  return (
    <div className="relative overflow-hidden rounded-[24px] border border-primary/20 bg-white/95 p-5 shadow-[var(--shadow-md)] backdrop-blur-sm">
      <div className="pointer-events-none absolute -left-16 -top-16 h-44 w-44 rounded-full bg-primary/12 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -right-10 h-48 w-48 rounded-full bg-teal-400/15 blur-3xl" />
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="ai-ambient-glow h-64 w-64 rounded-full" />
      </div>

      <motion.div
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 4.8, repeat: Infinity, ease: 'easeInOut' }}
        className="relative z-10 space-y-3 rounded-[18px] border border-border bg-background-secondary p-4"
      >
        <div className="mb-1 flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Cote Finance AI</p>
          <span className="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-[10px] font-semibold text-primary">
            Atualizado
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.2, ease: 'easeOut', delay: 0.05 }}
            className="rounded-[12px] border border-emerald-200 bg-emerald-50 p-3"
          >
            <p className="text-[11px] uppercase tracking-[0.14em] text-emerald-700">Saldo</p>
            <p className="mt-1 text-sm font-semibold text-emerald-700">R$ 8.438,00</p>
            <p className="mt-1 text-[11px] text-emerald-700/80">+4,2% no mês</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.2, ease: 'easeOut', delay: 0.13 }}
            className="rounded-[12px] border border-orange-200 bg-orange-50 p-3"
          >
            <p className="text-[11px] uppercase tracking-[0.14em] text-orange-700">Despesas</p>
            <p className="mt-1 text-sm font-semibold text-orange-700">R$ 1.328,00</p>
            <p className="mt-1 text-[11px] text-orange-700/80">-7,1% na semana</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.2, ease: 'easeOut', delay: 0.2 }}
            className="rounded-[12px] border border-sky-200 bg-sky-50 p-3"
          >
            <p className="text-[11px] uppercase tracking-[0.14em] text-sky-700">Reserva</p>
            <p className="mt-1 text-sm font-semibold text-sky-700">R$ 7.110,00</p>
            <p className="mt-1 text-[11px] text-sky-700/80">Meta de 6 meses</p>
          </motion.div>
        </div>

        <div className="rounded-[14px] border border-border bg-white p-3">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-medium text-foreground">Fluxo mensal</p>
            <div className="flex gap-2">
              <span className="h-2 w-2 rounded-full bg-primary" />
              <span className="h-2 w-2 rounded-full bg-teal-500" />
              <span className="h-2 w-2 rounded-full bg-violet-400" />
            </div>
          </div>
          <svg viewBox="0 0 240 90" className="h-[92px] w-full">
            <path
              d="M4 70 C26 64, 40 52, 60 54 C84 56, 98 38, 120 40 C146 42, 156 60, 176 56 C198 52, 216 30, 236 20"
              fill="none"
              stroke="rgba(37,99,235,0.95)"
              strokeWidth="2.5"
              className="chart-draw"
            />
            <path
              d="M4 74 C24 78, 42 72, 62 66 C84 60, 104 60, 126 58 C150 56, 166 50, 188 50 C208 50, 224 46, 236 40"
              fill="none"
              stroke="rgba(13,148,136,0.75)"
              strokeWidth="2"
            />
            <path
              d="M4 80 C30 79, 48 74, 70 74 C92 74, 110 70, 132 68 C156 66, 176 64, 196 60 C216 56, 226 54, 236 50"
              fill="none"
              stroke="rgba(139,92,246,0.5)"
              strokeWidth="1.8"
            />
            <circle cx="236" cy="20" r="4" fill="#2563EB" className="chart-pulse" />
          </svg>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <motion.div
            animate={{ y: [0, -2, 0] }}
            transition={{ duration: 3.6, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }}
            className="rounded-[12px] border border-border bg-white p-3"
          >
            <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Transações</p>
            <ul className="mt-2 space-y-2 text-xs text-foreground">
              <li className="flex items-center justify-between">
                <span>Mercado</span>
                <span className="font-medium text-orange-600">-R$ 450</span>
              </li>
              <li className="flex items-center justify-between">
                <span>Salário</span>
                <span className="font-medium text-emerald-600">+R$ 4.650</span>
              </li>
            </ul>
          </motion.div>

          <motion.div
            animate={{ y: [0, -2, 0] }}
            transition={{ duration: 3.8, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
            className="rounded-[12px] border border-border bg-white p-3"
          >
            <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Alertas</p>
            <div className="mt-2 space-y-2 text-xs">
              <div className="rounded-md bg-amber-50 px-2 py-1.5 text-amber-700">Pico de gasto em alimentação.</div>
              <div className="rounded-md bg-violet-50 px-2 py-1.5 text-violet-700">Reserva mensal em evolução.</div>
            </div>
          </motion.div>
        </div>
      </motion.div>

      <div className="pointer-events-none absolute left-6 top-8 floating-dot h-3 w-3 rounded-full bg-primary/50" />
      <div className="pointer-events-none absolute bottom-10 right-8 floating-dot h-2 w-2 rounded-full bg-teal-400/60 [animation-delay:600ms]" />
    </div>
  );
}

function HomePage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [heroValue, setHeroValue] = useState('');
  const [testimonials, setTestimonials] = useState([]);
  const [comparisonRows, setComparisonRows] = useState(fallbackComparisonRows);
  const [catalogSize, setCatalogSize] = useState(0);
  const [bankCount, setBankCount] = useState(0);

  useEffect(() => {
    Promise.all([
      portalApi.getTestimonials(),
      portalApi.getBanks(),
      portalApi.getOffers({ productType: 'loan' }),
      portalApi.getOffers({ productType: 'credit_card' }),
      portalApi.getOffers({ productType: 'financing' })
    ])
      .then(([testimonialsData, banks, loans, cards, financing]) => {
        setTestimonials(Array.isArray(testimonialsData) ? testimonialsData : []);
        setBankCount(Array.isArray(banks) ? banks.length : 0);

        const nextRows = [];
        const sortedLoans = Array.isArray(loans) ? [...loans].sort((a, b) => (a.monthlyRate ?? 999) - (b.monthlyRate ?? 999)) : [];
        const sortedCards = Array.isArray(cards) ? [...cards].sort((a, b) => (a.annualFee ?? 999999) - (b.annualFee ?? 999999)) : [];
        const sortedFinancing = Array.isArray(financing) ? [...financing].sort((a, b) => (a.annualRate ?? 999) - (b.annualRate ?? 999)) : [];

        if (sortedLoans[0]) {
          const offer = sortedLoans[0];
          nextRows.push({
            product: 'Empréstimo pessoal',
            bank: offer.bankName || 'Banco parceiro',
            rate: formatRate(offer.monthlyRate, 'a.m.'),
            limit: `Até R$ ${(offer.maxAmount || 80000).toLocaleString('pt-BR')}`,
            benefit: `Oferta ${String(offer.category || 'personalizada').toLowerCase()} com foco em custo total.`
          });
        }

        if (sortedCards[0]) {
          const offer = sortedCards[0];
          nextRows.push({
            product: 'Cartão de crédito',
            bank: offer.bankName || 'Instituição digital',
            rate: offer.annualFee === 0 ? 'Sem anuidade' : `R$ ${offer.annualFee}/ano`,
            limit: `Até R$ ${(offer.maxLimit || 20000).toLocaleString('pt-BR')}`,
            benefit: offer.benefits?.[0] || 'Benefícios claros para comparar sem ruído.'
          });
        }

        if (sortedFinancing[0]) {
          const offer = sortedFinancing[0];
          nextRows.push({
            product: 'Financiamento',
            bank: offer.bankName || 'Banco tradicional',
            rate: formatRate(offer.annualRate, 'a.a.'),
            limit: `Prazo de até ${offer.maxTerm || 360} meses`,
            benefit: `Entrada inicial a partir de ${offer.minDownPayment || 20}% com leitura simples.`
          });
        }

        setComparisonRows(nextRows.length ? nextRows : fallbackComparisonRows);
        setCatalogSize((loans?.length || 0) + (cards?.length || 0) + (financing?.length || 0));
      })
      .catch(() => {
        setTestimonials([]);
        setComparisonRows(fallbackComparisonRows);
      });
  }, []);

  const testimonialItems = useMemo(() => {
    if (!Array.isArray(testimonials) || testimonials.length === 0) return fallbackTestimonials;
    return testimonials.slice(0, 3);
  }, [testimonials]);

  const productCards = [
    {
      icon: HandCoins,
      title: 'Empréstimos',
      copy: 'Compare taxas, custo total e prazo antes de fechar contrato.',
      href: '/emprestimos',
      accent: 'from-sky-100 to-white'
    },
    {
      icon: CreditCard,
      title: 'Cartões',
      copy: 'Filtre por anuidade, benefícios e limite estimado no mesmo painel.',
      href: '/cartoes-de-credito',
      accent: 'from-violet-100 to-white'
    },
    {
      icon: Building2,
      title: 'Financiamentos',
      copy: 'Compare bancos, taxas e prazos para descobrir a melhor opção para você.',
      href: '/financiamento',
      accent: 'from-teal-100 to-white'
    },
    {
      icon: Calculator,
      title: 'Ferramentas',
      copy: 'Simuladores para entender juros, parcelas e impacto no seu bolso.',
      href: '/ferramentas',
      accent: 'from-emerald-100 to-white'
    }
  ];

  const insights = [
    {
      title: 'Como melhorar seu score',
      copy: 'Organize pagamentos recorrentes, reduza uso do limite e mantenha histórico saudável.',
      icon: TrendingUp
    },
    {
      title: 'Como pagar menos juros',
      copy: 'Priorize custo efetivo total, compare taxas mensais e negocie prazo antes de contratar.',
      icon: ShieldCheck
    },
    {
      title: 'Como escolher cartão',
      copy: 'Avalie benefícios que você realmente usa e compare anuidade contra retorno real.',
      icon: Lightbulb
    }
  ];

  const { scrollYProgress } = useScroll();
  const heroParallaxY = useTransform(scrollYProgress, [0, 0.35], [0, 80]);

  const handleHeroSubmit = (event) => {
    event.preventDefault();
    trackingService.trackCtaClick({
      sourcePage: '/',
      ctaId: 'home_hero_analisar',
      ctaLabel: 'Analisar agora',
      productType: 'loan'
    });
    setModalOpen(true);
  };

  return (
    <>
      <Helmet>
        <title>Cote Juros - Comparador financeiro de crédito</title>
        <meta
          name="description"
          content="Compare empréstimos, cartões, financiamentos e ferramentas financeiras em uma plataforma clara, moderna e focada em decisão segura."
        />
      </Helmet>

      <SimulationModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        initialAmount={heroValue ? parseInt(heroValue.replace(/\D/g, ''), 10) / 100 : 10000}
      />

      <section className="hero-premium-dark relative overflow-hidden border-b border-slate-800">
        <div className="pointer-events-none absolute inset-0 hero-tech-grid-dark opacity-55" />
        <div className="pointer-events-none absolute inset-0 hero-scanlines opacity-35" />
        <div className="pointer-events-none absolute inset-0 hero-vignette opacity-60" />
        {[14, 34, 56, 78].map((offset, index) => (
          <motion.span
            key={offset}
            className="pointer-events-none absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-sky-300/30 to-transparent"
            style={{ top: `${offset}%` }}
            animate={{ opacity: [0.15, 0.4, 0.15], x: ['-2%', '2%', '-2%'] }}
            transition={{ duration: 8 + index, repeat: Infinity, ease: 'easeInOut' }}
          />
        ))}
        {[1, 2, 3, 4, 5, 6].map((id) => (
          <motion.span
            key={id}
            className="pointer-events-none absolute h-1.5 w-1.5 rounded-full bg-sky-300/60"
            style={{ left: `${12 + id * 13}%`, top: `${18 + (id % 3) * 18}%` }}
            animate={{ y: [0, -12, 0], opacity: [0.2, 0.8, 0.2] }}
            transition={{ duration: 7 + id, repeat: Infinity, ease: 'easeInOut', delay: id * 0.3 }}
          />
        ))}
        <motion.div
          className="pointer-events-none absolute left-[16%] top-20 h-32 w-32 rounded-full bg-sky-300/30 blur-3xl"
          animate={{ y: [0, -10, 0], opacity: [0.28, 0.52, 0.28] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="pointer-events-none absolute right-[15%] top-28 h-28 w-28 rounded-full bg-violet-300/30 blur-3xl"
          animate={{ y: [0, 8, 0], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          style={{ y: heroParallaxY }}
          className="pointer-events-none absolute left-1/2 top-16 h-72 w-[620px] -translate-x-1/2 hero-premium-glow"
        />

        <div className="page-shell relative py-20 md:py-28">
          <motion.div {...animationIn} className="mx-auto max-w-5xl text-center">
            <span className="inline-flex items-center rounded-full border border-sky-300/30 bg-sky-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-sky-200">
              Comparador financeiro completo
            </span>
            <h1 className="mx-auto mb-5 mt-6 max-w-4xl text-white">Cote juros antes de pegar crédito.</h1>
            <p className="mx-auto max-w-3xl text-lg leading-8 text-slate-300 md:text-xl">
              Compare taxas, limites e condições de empréstimos, cartões e financiamentos em um único lugar.
            </p>

            <form onSubmit={handleHeroSubmit} className="mx-auto mt-10 max-w-3xl rounded-[18px] border border-white/15 bg-white/5 p-3 shadow-[0_20px_50px_rgba(2,6,23,0.35)] backdrop-blur-md">
              <div className="flex flex-col gap-3 sm:flex-row">
                <Input
                  placeholder="Digite o valor que você quer analisar"
                  className="h-12 border border-white/20 bg-white/90 text-base shadow-none focus-visible:ring-2 focus-visible:ring-sky-300/60"
                  value={heroValue}
                  onChange={(event) => setHeroValue(formatCurrency(event.target.value))}
                />
                <Button type="submit" size="lg" className="h-12 min-w-[180px] bg-sky-500 text-white hover:bg-sky-400">
                  Analisar agora
                </Button>
              </div>
            </form>

            <div className="mt-5 inline-flex items-center gap-2 text-sm text-slate-300">
              <ShieldCheck className="h-4 w-4 text-sky-300" />
              Simulação gratuita para comparar opções sem pressão comercial.
            </div>

            <div className="mt-12 grid gap-4 sm:grid-cols-3">
              <div className="rounded-[16px] border border-white/15 bg-white/5 px-5 py-5 text-left backdrop-blur-sm">
                <p className="text-base font-semibold text-white">Comparação inteligente</p>
                <p className="mt-1 text-sm text-slate-300">
                  {catalogSize > 0 ? `${catalogSize}+ ofertas` : 'Ofertas de diferentes perfis'} em um único fluxo visual.
                </p>
              </div>
              <div className="rounded-[16px] border border-white/15 bg-white/5 px-5 py-5 text-left backdrop-blur-sm">
                <p className="text-base font-semibold text-white">Taxas atualizadas</p>
                <p className="mt-1 text-sm text-slate-300">
                  {bankCount > 0 ? `${bankCount}+ instituições` : 'Bancos e fintechs'} para comparar sem termos complicados.
                </p>
              </div>
              <div className="rounded-[16px] border border-white/15 bg-white/5 px-5 py-5 text-left backdrop-blur-sm">
                <p className="text-base font-semibold text-white">Decisão com segurança</p>
                <p className="mt-1 text-sm text-slate-300">Taxa, prazo e condições lado a lado para evitar surpresas.</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="border-b border-border bg-white py-12 md:py-14">
        <div className="page-shell">
          <motion.div {...animationIn} className="mx-auto max-w-5xl text-center">
            <span className="soft-blue-chip mb-5">Bancos disponiveis</span>
            <h2 className="mb-3">Instituições que você encontra no Cote Juros</h2>
            <p className="mx-auto max-w-2xl text-muted-foreground">
              Compare ofertas de Nubank, Itaú, Santander, C6, Inter e Banco do Brasil em um único fluxo.
            </p>
            <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {bankLogos.map((bank) => (
                <div key={bank.name} className="bank-pill justify-start px-4 py-3">
                  <img
                    src={bank.logo}
                    alt={`Logo ${bank.name}`}
                    className="h-5 w-5 rounded-full object-cover"
                    loading="lazy"
                  />
                  <span>{bank.name}</span>
                  <BadgeCheck className="ml-auto h-4 w-4 text-primary" />
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <section className="border-b border-border bg-background-secondary py-20 md:py-24">
        <div className="page-shell">
          <motion.div {...animationIn} className="mx-auto mb-14 max-w-3xl text-center">
            <span className="soft-blue-chip mb-5">Como o Cote Juros ajuda voce</span>
            <h2 className="mb-4">Da comparacao a decisao em 3 passos.</h2>
          </motion.div>
          <div className="grid gap-5 md:grid-cols-3">
            {[
              { title: '1. Compare taxas', copy: 'Veja em poucos segundos quanto cada opcao cobra em juros e custo total.' },
              { title: '2. Entenda as condicoes', copy: 'Entenda limite, prazo, anuidade e regras sem linguagem complicada.' },
              { title: '3. Escolha com seguranca', copy: 'Tome a melhor decisao com clareza antes de contratar qualquer produto.' }
            ].map((item) => (
              <motion.div key={item.title} {...animationIn}>
                <Card className="interactive-card h-full">
                  <CardContent className="p-7">
                    <h3 className="text-xl">{item.title}</h3>
                    <p className="mt-3 text-base text-muted-foreground">{item.copy}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-border bg-background py-20 md:py-24">
        <div className="page-shell">
          <motion.div {...animationIn} className="mx-auto mb-14 max-w-3xl text-center">
            <span className="soft-blue-chip mb-5">Produtos</span>
            <h2 className="mb-4">Tudo para comparar crédito com profundidade.</h2>
          </motion.div>

          <div className="grid gap-5 md:grid-cols-2">
            {productCards.map((item) => (
              <motion.div key={item.title} {...animationIn}>
                <Link to={item.href}>
                  <Card className="interactive-card h-full overflow-hidden">
                    <CardContent className="flex h-full flex-col gap-5 p-8">
                      <div className={`product-illustration bg-gradient-to-br ${item.accent}`}>
                        <div className="product-illustration-dot" />
                        <div className="product-illustration-line" />
                      </div>
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-primary/20 bg-primary/10">
                        <item.icon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="space-y-3">
                        <h3 className="text-2xl">{item.title}</h3>
                        <p>{item.copy}</p>
                      </div>
                      <div className="mt-auto inline-flex items-center gap-2 text-sm font-semibold text-primary">
                        Comparar agora <ArrowRight className="h-4 w-4" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-border bg-background-secondary py-20 md:py-24">
        <div className="page-shell">
          <motion.div {...animationIn} className="mb-10 max-w-3xl">
            <span className="soft-blue-chip mb-5">Comparação visual</span>
            <h2 className="mb-4">Veja taxas, limites e benefícios lado a lado.</h2>
            <p className="section-copy">Uma leitura objetiva para você escolher sem ruído e com mais confiança.</p>
          </motion.div>

          <motion.div {...animationIn} className="overflow-hidden rounded-[18px] border border-border bg-white shadow-[var(--shadow-sm)]">
            <div className="hidden grid-cols-[1.1fr_1fr_1fr_1fr_1.2fr] border-b border-border bg-background-secondary px-6 py-4 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground md:grid">
              <span>Produto</span>
              <span>Banco</span>
              <span>Taxa</span>
              <span>Limite</span>
              <span>Benefícios</span>
            </div>

            <div className="divide-y divide-border">
              {comparisonRows.map((item) => (
                <motion.div
                  key={`${item.product}-${item.bank}`}
                  whileHover={{ backgroundColor: 'rgba(241,245,249,0.7)' }}
                  className="grid gap-4 px-6 py-5 md:grid-cols-[1.1fr_1fr_1fr_1fr_1.2fr] md:gap-3"
                >
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground md:hidden">Produto</p>
                    <p className="font-semibold text-foreground">{item.product}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground md:hidden">Banco</p>
                    <p className="text-sm text-foreground">{item.bank}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground md:hidden">Taxa</p>
                    <p className="text-sm font-semibold text-primary">{item.rate}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground md:hidden">Limite</p>
                    <p className="text-sm text-muted-foreground">{item.limit}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground md:hidden">Benefícios</p>
                    <p className="text-sm text-muted-foreground">{item.benefit}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <section className="border-b border-border bg-background py-20 md:py-24">
        <div className="page-shell">
          <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
            <motion.div {...animationIn} className="space-y-6">
              <span className="soft-blue-chip">Cote Finance AI</span>
              <h2>Visão financeira viva para decidir melhor antes de contratar crédito.</h2>
              <p className="section-copy">
                O Cote Finance AI acompanha entradas, saídas e fôlego mensal para mostrar quando vale contratar e quando é melhor esperar.
              </p>

              <div className="space-y-3">
                {[
                  'Resumo mensal de receitas, gastos e saldo projetado.',
                  'Alertas quando a parcela pode apertar seu orçamento.',
                  'Recomendações simples para reduzir risco de juros abusivos.'
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 text-primary" />
                    <p className="text-base text-muted-foreground">{item}</p>
                  </div>
                ))}
              </div>

              <div className="pt-3">
                <Link to="/cote-finance-ai">
                  <Button
                    size="lg"
                    onClick={() =>
                      trackingService.trackCtaClick({
                        sourcePage: '/',
                        ctaId: 'home_ai_entry',
                        ctaLabel: 'Explorar Cote Finance AI',
                        productType: 'loan'
                      })
                    }
                  >
                    Explorar Cote Finance AI
                  </Button>
                </Link>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              whileHover={{ y: -4 }}
              className="transition-all duration-200 ease-out"
            >
              <div className="ai-showcase rounded-[24px] p-2">
                <FinanceAiIllustration />
              </div>
              <div className="mt-4 flex items-center gap-2 pl-1 text-sm text-muted-foreground">
                <Sparkles className="h-4 w-4 text-primary" />
                Simulação visual para facilitar a leitura do seu momento financeiro.
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="border-b border-border bg-background-secondary py-20 md:py-24">
        <div className="page-shell">
          <motion.div {...animationIn} className="mx-auto mb-14 max-w-3xl text-center">
            <span className="soft-blue-chip mb-5">Insights financeiros</span>
            <h2 className="mb-4">Dicas práticas para pagar menos juros.</h2>
          </motion.div>
          <div className="grid gap-5 md:grid-cols-3">
            {insights.map((item) => (
              <motion.div key={item.title} {...animationIn}>
                <Card className="interactive-card h-full">
                  <CardContent className="flex h-full flex-col gap-4 p-7">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/20 bg-primary/10">
                      <item.icon className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="text-xl">{item.title}</h3>
                    <p className="text-base text-muted-foreground">{item.copy}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-border bg-background py-20 md:py-24">
        <div className="page-shell">
          <motion.div {...animationIn} className="mx-auto mb-14 max-w-3xl text-center">
            <span className="soft-blue-chip mb-5">Depoimentos</span>
            <h2 className="mb-4">Quem compara antes, decide com mais tranquilidade.</h2>
          </motion.div>

          <div className="grid gap-5 md:grid-cols-3">
            {testimonialItems.map((item, index) => (
              <motion.div key={`${item.name}-${index}`} {...animationIn}>
                <Card className="interactive-card h-full">
                  <CardContent className="flex h-full flex-col gap-5 p-8">
                    <div className="soft-blue-chip w-fit">{item.badge || 'Cliente'}</div>
                    <p className="text-base tracking-[0.12em] text-amber-500">★★★★★</p>
                    <p className="text-lg leading-8 text-foreground">"{item.quote}"</p>
                    <div className="mt-auto border-t border-border pt-5">
                      <p className="font-semibold text-foreground">{item.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.location} | {item.product}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-border bg-background-secondary py-16 md:py-20">
        <div className="page-shell">
          <motion.div {...animationIn} className="mx-auto max-w-4xl rounded-[24px] border border-violet-200/70 bg-gradient-to-br from-white via-teal-50/40 to-violet-50/50 px-8 py-10 text-center shadow-[var(--shadow-sm)]">
            <span className="soft-blue-chip mb-4">Avaliacoes externas</span>
            <h2 className="mb-3">Sinta o poder das avaliacoes reais.</h2>
            <p className="mx-auto max-w-2xl text-muted-foreground">
              Clientes avaliam a experiencia de comparacao com foco em clareza, confianca e decisao financeira segura.
            </p>
            <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <div className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
                Trustpilot
              </div>
              <div className="text-xl tracking-[0.2em] text-amber-500">★★★★★</div>
              <p className="text-base font-semibold text-foreground">4.7 de 5 estrelas</p>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="bg-background-secondary py-20 md:py-24">
        <div className="page-shell">
          <motion.div {...animationIn} className="mx-auto max-w-4xl rounded-[24px] border border-primary/20 bg-white px-8 py-12 text-center shadow-[var(--shadow-md)]">
            <span className="soft-blue-chip mb-6">Análise final</span>
            <h2 className="mb-4">Descubra se você está pagando juros abusivos.</h2>
            <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground">
              Em poucos passos, você compara opções com leitura clara de taxa, benefício e condição para escolher com segurança.
            </p>
            <div className="flex flex-col justify-center gap-3 sm:flex-row">
              <Button
                size="lg"
                onClick={() => {
                  trackingService.trackCtaClick({
                    sourcePage: '/',
                    ctaId: 'home_final_analisar',
                    ctaLabel: 'Analisar agora',
                    productType: 'loan'
                  });
                  setModalOpen(true);
                }}
              >
                Analisar agora
              </Button>
              <Link to="/emprestimos">
                <Button size="lg" variant="outline">
                  Ver comparador
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
}

export default HomePage;
