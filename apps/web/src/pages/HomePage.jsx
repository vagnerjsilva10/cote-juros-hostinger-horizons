import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
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

const bankInstitutions = ['Nubank', 'Itaú', 'Santander', 'C6 Bank', 'Inter', 'Banco do Brasil'];

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

const INSTALLMENT_OPTIONS = [
  { value: 12, factor: 0.1064 },
  { value: 18, factor: 0.0791 },
  { value: 24, factor: 0.06552 },
  { value: 36, factor: 0.0518 }
];

const parseCurrencyToNumber = (value) => {
  const sanitized = String(value || '').replace(/[^\d]/g, '');
  return sanitized ? parseInt(sanitized, 10) / 100 : 0;
};

const formatBrl = (value) =>
  Number(value || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });

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
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);
  const [heroValue, setHeroValue] = useState('R$ 2.000,00');
  const [heroInstallments, setHeroInstallments] = useState(24);
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
      copy: 'Veja taxa, CET e prazo no mesmo quadro para evitar crédito caro.',
      href: '/emprestimos',
      accent: 'from-sky-100 to-white'
    },
    {
      icon: CreditCard,
      title: 'Cartões',
      copy: 'Entenda anuidade, limite e benefícios antes de pedir o cartão.',
      href: '/cartoes-de-credito',
      accent: 'from-violet-100 to-white'
    },
    {
      icon: Building2,
      title: 'Financiamentos',
      copy: 'Compare entrada, parcela e custo final para não comprometer seu orçamento.',
      href: '/financiamento',
      accent: 'from-teal-100 to-white'
    },
    {
      icon: Calculator,
      title: 'Ferramentas',
      copy: 'Simule cenários e veja o impacto real da decisão no longo prazo.',
      href: '/ferramentas',
      accent: 'from-emerald-100 to-white'
    }
  ];

  const insights = [
    {
      title: 'Reduza o custo do crédito',
      copy: 'Aprenda a comparar taxa nominal e CET para não pagar juros escondidos.',
      icon: TrendingUp
    },
    {
      title: 'Decida sem pressa e sem escuro',
      copy: 'Veja sinais de risco antes de contratar e evite parcelas acima da sua capacidade.',
      icon: ShieldCheck
    },
    {
      title: 'Entenda crédito de forma prática',
      copy: 'Guias curtos para empréstimos, cartões e financiamentos com linguagem direta.',
      icon: Lightbulb
    }
  ];

  const estimatedInstallment = useMemo(() => {
    const amount = parseCurrencyToNumber(heroValue) || 2000;
    const selectedOption = INSTALLMENT_OPTIONS.find((item) => item.value === Number(heroInstallments)) || INSTALLMENT_OPTIONS[2];
    return amount * selectedOption.factor;
  }, [heroInstallments, heroValue]);

  const handleHeroSubmit = (event) => {
    event.preventDefault();
    trackingService.trackCtaClick({
      sourcePage: '/',
      ctaId: 'home_hero_simular',
      ctaLabel: 'Simular agora',
      productType: 'loan'
    });
    setModalOpen(true);
  };

  return (
    <>
      <Helmet>
        <title>Cote Juros - Compare juros, crédito e financiamento</title>
        <meta
          name="description"
          content="Compare juros, empréstimos, cartões de crédito e financiamento com mais clareza. Veja taxa, CET, parcela e custo total antes de contratar."
        />
        <meta name="verify-admitad" content="1ae3db0be4" />
        <link rel="canonical" href="https://cotejuros.com.br/" />
      </Helmet>

      <SimulationModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        initialAmount={heroValue ? parseInt(heroValue.replace(/\D/g, ''), 10) / 100 : 10000}
      />

      <section className="hero-premium-clean relative overflow-hidden border-b border-slate-200/60">
        <div className="pointer-events-none absolute inset-0 hero-premium-mist" />
        <motion.div
          className="pointer-events-none absolute left-1/2 top-[14%] h-52 w-[70%] -translate-x-1/2 hero-float-cloud"
          animate={{ opacity: [0.35, 0.56, 0.35], y: [0, -8, 0], scale: [1, 1.03, 1] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        />
        <div className="pointer-events-none absolute -left-24 top-6 h-64 w-64 rounded-full bg-sky-300/30 blur-3xl" />
        <div className="pointer-events-none absolute -right-16 top-0 h-72 w-72 rounded-full bg-indigo-200/30 blur-3xl" />
        <div className="pointer-events-none absolute bottom-[-90px] left-1/2 h-56 w-[540px] -translate-x-1/2 rounded-full bg-white/65 blur-3xl" />
        <motion.div
          className="pointer-events-none absolute -left-10 top-8 h-56 w-56 rounded-full bg-sky-300/25 blur-3xl"
          animate={{ x: [0, 16, 0], y: [0, -8, 0], opacity: [0.4, 0.62, 0.4], scale: [1, 1.06, 1] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="pointer-events-none absolute right-[8%] top-3 h-64 w-64 rounded-full bg-indigo-300/20 blur-3xl"
          animate={{ x: [0, -14, 0], y: [0, 10, 0], opacity: [0.34, 0.56, 0.34], scale: [1, 1.08, 1] }}
          transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
        />

        <div className="page-shell relative pb-12 pt-6 sm:pb-14 sm:pt-8 md:pb-20 md:pt-12 lg:pb-24 lg:pt-14">
          <motion.div {...animationIn} id="hero-layout" className="grid items-center gap-8 sm:gap-10 lg:grid-cols-[0.96fr_1.04fr] lg:gap-14">
            <div className="mx-auto max-w-[610px] text-center lg:mx-0 lg:text-left">
              <span className="inline-flex max-w-full items-center rounded-full border border-sky-200/80 bg-white/90 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-sky-700 transition-all duration-200 sm:text-[11px]">
                Comparar juros com clareza
              </span>
              <h1
                className="mt-4 text-[clamp(2.15rem,10vw,4.1rem)] font-bold leading-[1.02] tracking-[-0.04em] text-slate-900 sm:mt-5"
                style={{ fontFamily: '"Space Grotesk", "Manrope", sans-serif' }}
              >
                <span className="block sm:inline">Compare, escolha </span>
                <span className="block sm:inline">e contrate seu </span>
                <span className="block">
                  próximo <span className="hero-word-emphasis">crédito.</span>
                </span>
              </h1>
              <p className="mt-4 max-w-[34rem] text-sm font-normal leading-7 text-slate-600 sm:mt-5 sm:text-base sm:leading-8 md:text-lg">
                Compare juros de empréstimo, cartão de crédito e financiamento em um só lugar, com leitura simples de taxa, CET, parcela e custo total.
              </p>
              <div className="hero-proof-pill mx-auto mt-5 flex w-full max-w-[34rem] flex-wrap items-center justify-center gap-2 px-4 py-3 text-center lg:mx-0 lg:justify-start lg:text-left">
                <span>Compare juros e CET</span>
                <span className="hero-proof-dot" />
                <span>Taxas de crédito traduzidas</span>
                <span className="hero-proof-dot" />
                <span>Decisão com segurança</span>
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="hero-simulation-card mx-auto w-full max-w-[472px] rounded-[20px] border border-slate-200/80 bg-white/95 p-4 shadow-[0_20px_56px_rgba(15,23,42,0.08)] backdrop-blur-sm sm:p-5 lg:mt-8"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Simulador principal</p>
              <form
                onSubmit={handleHeroSubmit}
                className="mt-3.5 space-y-3.5"
              >
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">Quanto você deseja?</span>
                  <div className="relative">
                    <Input
                      placeholder="R$ 2.000,00"
                      className="h-11 rounded-xl border-slate-200 bg-white text-[15px] font-medium text-slate-800 shadow-none focus-visible:ring-2 focus-visible:ring-sky-200 sm:h-10 sm:text-[14px]"
                      value={heroValue}
                      onChange={(event) => setHeroValue(formatCurrency(event.target.value))}
                    />
                  </div>
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">Em quantas parcelas?</span>
                  <select
                    value={heroInstallments}
                    onChange={(event) => setHeroInstallments(Number(event.target.value))}
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-[15px] font-medium text-slate-800 outline-none transition-all focus:border-sky-300 focus:ring-2 focus:ring-sky-100 sm:h-10 sm:text-[14px]"
                  >
                    {INSTALLMENT_OPTIONS.map((item) => (
                      <option key={item.value} value={item.value}>
                        {`${item.value}x de ${formatBrl((parseCurrencyToNumber(heroValue) || 2000) * item.factor)}`}
                      </option>
                    ))}
                  </select>
                </label>

                <Button
                  type="submit"
                  size="lg"
                  className="h-11 w-full rounded-xl bg-[#2563EB] text-[15px] font-semibold text-white shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_20px_rgba(37,99,235,0.26)] transition-all duration-200 hover:bg-[#1D4ED8] hover:shadow-[0_1px_2px_rgba(0,0,0,0.04),0_10px_24px_rgba(29,78,216,0.3)] sm:h-10 sm:text-[14px]"
                >
                  Simular agora
                </Button>

                <p className="text-xs leading-5 text-slate-500 sm:leading-6">
                  Parcela estimada com taxa de referência de 3,99% ao mês. Os valores podem variar conforme o perfil e cada
                  instituição financeira.
                </p>
              </form>

              <div className="mt-4 grid gap-2 border-t border-slate-100 pt-3.5 sm:grid-cols-3">
                {[
                  'Simulação gratuita',
                  'Comparação em segundos',
                  'Múltiplas instituições'
                ].map((item) => (
                  <div key={item} className="inline-flex items-center gap-1.5 text-[13px] leading-5 text-slate-600 transition-all duration-200">
                    <CheckCircle2 className="h-4 w-4 text-[#14B8A6]" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>

              <div className="mt-3.5 rounded-xl border border-sky-100 bg-sky-50/70 px-3 py-2.5 text-[13px] font-medium text-sky-900">
                {`${heroInstallments}x de ${formatBrl(estimatedInstallment)}`}
              </div>
            </motion.div>
          </motion.div>

          <motion.div {...animationIn} className="mt-8 text-center sm:mt-10">
            <p className="text-sm leading-6 text-slate-500">
              {`${catalogSize || 30}+ ofertas ativas e ${bankCount || 8} instituições financeiras para comparar.`}
            </p>
          </motion.div>
        </div>
      </section>

      <section className="border-b border-border bg-white py-16 md:py-20">
        <div className="page-shell">
          <motion.div {...animationIn} className="mx-auto max-w-5xl text-center">
            <span className="soft-blue-chip mb-5">Instituições</span>
            <h2 className="mb-3 text-[clamp(2rem,3.5vw,2.7rem)] font-semibold tracking-[-0.025em]">
              Instituições financeiras para comparar crédito em um só lugar
            </h2>
            <p className="mx-auto max-w-2xl text-[1.03rem] font-normal leading-8 text-slate-600">
              Compare bancos digitais e tradicionais com o mesmo critério para empréstimos, cartões e financiamentos.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              {bankInstitutions.map((bank) => (
                <span key={bank} className="institution-chip">
                  {bank}
                </span>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <section className="border-b border-border bg-background-secondary py-24 md:py-28">
        <div className="page-shell">
          <motion.div {...animationIn} className="mx-auto mb-14 max-w-3xl text-center">
            <span className="soft-blue-chip mb-5">Como o Cote Juros ajuda você</span>
            <h2 className="mb-4">Compare juros, crédito e financiamento sem complicação.</h2>
          </motion.div>
          <div className="grid gap-5 md:grid-cols-3">
            {[
              { title: '1. Compare taxas e CET', copy: 'Veja o custo real do crédito, não só a taxa de vitrine.' },
              { title: '2. Entenda a parcela e o prazo', copy: 'Leia condições de empréstimo e financiamento com mais clareza.' },
              { title: '3. Escolha com segurança', copy: 'Contrate sabendo o impacto da parcela no seu mês.' }
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

      <section className="border-b border-border bg-background py-24 md:py-28">
        <div className="page-shell">
          <motion.div {...animationIn} className="mx-auto mb-14 max-w-3xl text-center">
            <span className="soft-blue-chip mb-5">Produtos</span>
            <h2 className="mb-4">Áreas do portal para comparar cada tipo de crédito.</h2>
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

      <section className="border-b border-border bg-background-secondary py-24 md:py-28">
        <div className="page-shell">
          <motion.div {...animationIn} className="mb-10 max-w-3xl">
            <span className="soft-blue-chip mb-5">Comparação visual</span>
            <h2 className="mb-4">Compare lado a lado e entenda o custo final do crédito.</h2>
            <p className="section-copy">Transparência para identificar juros altos, comparar taxas de crédito e escolher a opção mais equilibrada.</p>
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

      <section className="border-b border-border bg-background py-24 md:py-28">
        <div className="page-shell">
          <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
            <motion.div {...animationIn} className="space-y-6">
              <span className="soft-blue-chip">Cote Finance AI</span>
              <h2>Entenda seu momento financeiro antes de assumir uma nova parcela.</h2>
              <p className="section-copy">
                O Cote Finance AI complementa a comparação: mostra seu fôlego financeiro e aponta se faz sentido contratar agora ou esperar.
              </p>

              <div className="space-y-3">
                {[
                  'Mostra entradas e saídas com leitura simples.',
                  'Identifica quando a parcela pode pressionar seu orçamento.',
                  'Sugere ajustes para reduzir risco financeiro.'
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 text-[#14B8A6]" />
                    <p className="text-base text-muted-foreground">{item}</p>
                  </div>
                ))}
              </div>

              <div className="pt-3">
                <Button
                  size="lg"
                  className="bg-[#2563EB] text-white transition-all duration-200 hover:bg-[#1D4ED8]"
                  onClick={async () => {
                    await trackingService.trackCtaClick({
                      sourcePage: '/',
                      ctaId: 'home_ai_entry',
                      ctaLabel: 'Testar Cote Finance AI',
                      productType: 'loan'
                    });
                    navigate(`/cote-finance-ai${window.location.search || ''}`);
                  }}
                >
                  Testar Cote Finance AI
                </Button>
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
                Inteligência financeira para decidir com contexto, não no impulso.
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="border-b border-border bg-background-secondary py-24 md:py-28">
        <div className="page-shell">
          <motion.div {...animationIn} className="mx-auto mb-14 max-w-3xl text-center">
            <span className="soft-blue-chip mb-5">Conteúdo</span>
            <h2 className="mb-4">Educação financeira para comparar crédito e pagar menos juros.</h2>
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

      <section className="border-b border-border bg-background py-24 md:py-28">
        <div className="page-shell">
          <motion.div {...animationIn} className="mx-auto mb-14 max-w-3xl text-center">
            <span className="soft-blue-chip mb-5">Depoimentos</span>
            <h2 className="mb-4">Quem compara juros antes decide com mais tranquilidade.</h2>
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

      <section className="border-b border-border bg-background-secondary py-20 md:py-24">
        <div className="page-shell">
          <motion.div {...animationIn} className="mx-auto max-w-4xl rounded-[24px] border border-violet-200/70 bg-gradient-to-br from-white via-teal-50/40 to-violet-50/50 px-8 py-10 text-center shadow-[var(--shadow-sm)]">
            <span className="soft-blue-chip mb-4">Avaliações externas</span>
            <h2 className="mb-3">Confiança para comparar crédito com mais segurança.</h2>
            <p className="mx-auto max-w-2xl text-muted-foreground">
              Clientes avaliam a experiência de comparação com foco em clareza, confiança e decisão financeira segura.
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

      <section className="bg-background-secondary py-24 md:py-28">
        <div className="page-shell">
          <motion.div {...animationIn} className="mx-auto max-w-4xl rounded-[24px] border border-primary/20 bg-white px-8 py-12 text-center shadow-[var(--shadow-md)]">
            <span className="soft-blue-chip mb-6">Análise final</span>
            <h2 className="mb-4">Antes de assumir um crédito, compare juros e entenda o custo real.</h2>
            <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground">
              Compare empréstimos, cartões de crédito e financiamento, analise seu cenário financeiro e descubra se há juros abusivos antes de fechar contrato.
            </p>
            <div className="flex flex-col justify-center gap-3 sm:flex-row">
              <Button
                size="lg"
                className="bg-[#2563EB] text-white transition-all duration-200 hover:bg-[#1D4ED8]"
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



