import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Building2,
  Calculator,
  CheckCircle2,
  CreditCard,
  HandCoins,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { SimulationModal } from '@/components/SimulationModal.jsx';
import { portalApi } from '@/platform/services/portalApi.js';
import { trackingService } from '@/platform/services/trackingService.js';

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
    benefit: 'Análise de perfil com ordenação por custo total',
    condition: 'Prazo de 6 a 84 meses'
  },
  {
    product: 'Cartão de crédito',
    bank: 'Instituição digital',
    rate: 'Sem anuidade em linhas selecionadas',
    benefit: 'Comparativo de cashback, milhas e sala VIP',
    condition: 'Limite conforme renda e elegibilidade'
  },
  {
    product: 'Financiamento',
    bank: 'Banco tradicional',
    rate: 'A partir de 8,99% a.a.',
    benefit: 'Leitura rápida de taxa e entrada mínima',
    condition: 'Condições por tipo de bem e prazo'
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
    <div className="relative rounded-[24px] border border-primary/20 bg-white p-5 shadow-[var(--shadow-md)]">
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
              <div className="rounded-md bg-amber-50 px-2 py-1.5 text-amber-700">
                Pico de gasto em alimentação.
              </div>
              <div className="rounded-md bg-violet-50 px-2 py-1.5 text-violet-700">
                Reserva mensal em evolução.
              </div>
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
            benefit: `Linha ${String(offer.category || 'personalizada').toLowerCase()} com comparação por taxa efetiva`,
            condition: `Prazo até ${offer.maxTerm || 84} meses`
          });
        }

        if (sortedCards[0]) {
          const offer = sortedCards[0];
          nextRows.push({
            product: 'Cartão de crédito',
            bank: offer.bankName || 'Instituição digital',
            rate: offer.annualFee === 0 ? 'Sem anuidade' : `R$ ${offer.annualFee}/ano`,
            benefit: offer.benefits?.[0] || 'Comparação de benefícios por perfil',
            condition: `Limite estimado até R$ ${Math.round((offer.maxLimit || 0) / 1000)} mil`
          });
        }

        if (sortedFinancing[0]) {
          const offer = sortedFinancing[0];
          nextRows.push({
            product: 'Financiamento',
            bank: offer.bankName || 'Banco tradicional',
            rate: formatRate(offer.annualRate, 'a.a.'),
            benefit: `Entrada mínima de ${offer.minDownPayment || 20}%`,
            condition: `Prazo até ${offer.maxTerm || 360} meses`
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

  const productCards = [
    {
      icon: HandCoins,
      title: 'Empréstimos',
      copy: 'Compare taxas, custo total e prazo antes de fechar contrato.',
      href: '/emprestimos',
      tier: 'primary'
    },
    {
      icon: CreditCard,
      title: 'Cartões de crédito',
      copy: 'Filtre por anuidade, benefícios e limite estimado no mesmo painel.',
      href: '/cartoes-de-credito',
      tier: 'primary'
    },
    {
      icon: Building2,
      title: 'Financiamentos',
      copy: 'Visualize bancos, entrada mínima e condições por tipo de bem.',
      href: '/financiamento',
      tier: 'secondary'
    },
    {
      icon: Calculator,
      title: 'Ferramentas financeiras',
      copy: 'Simuladores para juros compostos, parcelas e comprometimento de renda.',
      href: '/ferramentas',
      tier: 'secondary'
    }
  ];

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

      <section className="hero-premium relative overflow-hidden border-b border-border">
        <div className="pointer-events-none absolute inset-0 hero-grid-soft opacity-25" />
        <motion.div
          className="pointer-events-none absolute left-[18%] top-20 h-28 w-28 rounded-full bg-primary/20 blur-3xl"
          animate={{ y: [0, -10, 0], opacity: [0.38, 0.55, 0.38] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="pointer-events-none absolute right-[15%] top-28 h-24 w-24 rounded-full bg-sky-300/25 blur-3xl"
          animate={{ y: [0, 8, 0], opacity: [0.3, 0.48, 0.3] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <div className="pointer-events-none absolute left-1/2 top-16 h-72 w-[560px] -translate-x-1/2 hero-premium-glow" />

        <div className="page-shell relative py-20 md:py-28">
          <motion.div {...animationIn} className="mx-auto max-w-5xl text-center">
            <span className="soft-blue-chip mb-6">Comparador financeiro completo</span>
            <h1 className="mx-auto mb-5 max-w-4xl">Cote juros antes de pegar crédito.</h1>
            <p className="mx-auto max-w-3xl text-lg leading-8 text-muted-foreground md:text-xl">
              Compare empréstimos, cartões e financiamentos com clareza de taxa, condições e benefícios para tomar uma decisão financeira mais segura.
            </p>

            <form onSubmit={handleHeroSubmit} className="hero-highlight mx-auto mt-10 max-w-3xl rounded-[18px] border border-primary/20 p-3 shadow-[var(--shadow-md)]">
              <div className="flex flex-col gap-3 sm:flex-row">
                <Input
                  placeholder="Digite o valor que você quer analisar"
                  className="h-12 border-0 bg-white text-base shadow-none focus-visible:ring-0"
                  value={heroValue}
                  onChange={(event) => setHeroValue(formatCurrency(event.target.value))}
                />
                <Button type="submit" size="lg" className="h-12 min-w-[180px]">
                  Analisar agora
                </Button>
              </div>
            </form>

            <div className="mt-5 inline-flex items-center gap-2 text-sm text-muted-foreground">
              <ShieldCheck className="h-4 w-4 text-primary" />
              Simulação gratuita e organizada para comparar sem pressão comercial.
            </div>

            <div className="mt-12 grid gap-4 sm:grid-cols-3">
              <div className="interactive-card px-5 py-5 text-left">
                <p className="text-base font-semibold text-foreground">Comparação inteligente</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {catalogSize > 0 ? `${catalogSize}+ ofertas` : 'Ofertas de diferentes perfis'} em um único fluxo.
                </p>
              </div>
              <div className="interactive-card px-5 py-5 text-left">
                <p className="text-base font-semibold text-foreground">Taxas atualizadas</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {bankCount > 0 ? `${bankCount}+ bancos` : 'Bancos e fintechs'} com leitura direta de custo.
                </p>
              </div>
              <div className="interactive-card px-5 py-5 text-left">
                <p className="text-base font-semibold text-foreground">Decisão mais segura</p>
                <p className="mt-1 text-sm text-muted-foreground">Taxa, prazo e condição no mesmo painel comparativo.</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="border-b border-border bg-background-secondary py-20 md:py-24">
        <div className="page-shell">
          <motion.div {...animationIn} className="mx-auto mb-14 max-w-3xl text-center">
            <span className="soft-blue-chip mb-5">Produtos</span>
            <h2 className="mb-4">Tudo para comparar crédito com profundidade.</h2>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
              Cada módulo foi organizado para reduzir dúvidas e aumentar conversão com linguagem clara de comparador financeiro.
            </p>
          </motion.div>

          <div className="grid gap-5 md:grid-cols-2">
            {productCards.map((item) => (
              <motion.div key={item.title} {...animationIn}>
                <Link to={item.href}>
                  <Card
                    className={`h-full transition-all duration-200 ease-out hover:-translate-y-1 ${
                      item.tier === 'primary'
                        ? 'border-primary/25 bg-white shadow-[var(--shadow-md)]'
                        : 'border-border bg-white shadow-[var(--shadow-sm)]'
                    }`}
                  >
                    <CardContent className="flex h-full flex-col gap-5 p-8">
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

      <section className="border-b border-border bg-background py-20 md:py-24">
        <div className="page-shell">
          <motion.div {...animationIn} className="mb-10 max-w-3xl">
            <span className="soft-blue-chip mb-5">Comparador financeiro</span>
            <h2 className="mb-4">Veja taxas, bancos, benefícios e condições lado a lado.</h2>
            <p className="section-copy">
              O Cote Juros volta a se posicionar como comparador: você enxerga custo, proposta e aderência sem navegar em páginas confusas.
            </p>
          </motion.div>

          <motion.div {...animationIn} className="overflow-hidden rounded-[18px] border border-border bg-white shadow-[var(--shadow-sm)]">
            <div className="hidden grid-cols-[1.2fr_1fr_1fr_1.2fr_1.2fr] border-b border-border bg-background-secondary px-6 py-4 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground md:grid">
              <span>Produto</span>
              <span>Banco</span>
              <span>Taxa</span>
              <span>Benefícios</span>
              <span>Condições</span>
            </div>

            <div className="divide-y divide-border">
              {comparisonRows.map((item) => (
                <div key={`${item.product}-${item.bank}`} className="grid gap-4 px-6 py-5 md:grid-cols-[1.2fr_1fr_1fr_1.2fr_1.2fr] md:gap-3">
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
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground md:hidden">Benefícios</p>
                    <p className="text-sm text-muted-foreground">{item.benefit}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground md:hidden">Condições</p>
                    <p className="text-sm text-muted-foreground">{item.condition}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <section className="border-b border-border bg-background-secondary py-20 md:py-24">
        <div className="page-shell">
          <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
            <motion.div {...animationIn} className="space-y-6">
              <span className="soft-blue-chip">Cote Finance AI</span>
              <h2>Gestão financeira viva para decidir melhor antes de contratar crédito.</h2>
              <p className="section-copy">
                O Cote Finance AI funciona como camada inteligente para acompanhar entradas, saídas e margem financeira enquanto você compara as melhores linhas de crédito.
              </p>

              <div className="space-y-3">
                {[
                  'Visão mensal de receitas, despesas e saldo projetado.',
                  'Alertas para gastos que pressionam sua capacidade de pagamento.',
                  'Sugestões de ajuste para reduzir risco de juros abusivos.'
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
              className="ai-showcase transition-all duration-200 ease-out"
            >
              <FinanceAiIllustration />
              <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                <Sparkles className="h-4 w-4 text-primary" />
                Ilustração dinâmica com contexto financeiro em tempo real.
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="border-b border-border bg-background py-20 md:py-24">
        <div className="page-shell">
          <motion.div {...animationIn} className="mx-auto mb-14 max-w-3xl text-center">
            <span className="soft-blue-chip mb-5">Depoimentos</span>
            <h2 className="mb-4">Quem compara antes, decide com mais tranquilidade.</h2>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
              Prova social real de quem reduziu custo e ganhou clareza para negociar melhor.
            </p>
          </motion.div>

          <div className="grid gap-5 md:grid-cols-3">
            {testimonialItems.map((item, index) => (
              <motion.div key={`${item.name}-${index}`} {...animationIn}>
                <Card className="interactive-card h-full">
                  <CardContent className="flex h-full flex-col gap-5 p-8">
                    <div className="soft-blue-chip w-fit">{item.badge || 'Cliente'}</div>
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
