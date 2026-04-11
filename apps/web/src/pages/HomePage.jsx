import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Building2, Calculator, CheckCircle2, CreditCard, HandCoins, ShieldCheck, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { SimulationModal } from '@/components/SimulationModal.jsx';
import { portalApi } from '@/platform/services/portalApi.js';
import { trackingService } from '@/platform/services/trackingService.js';

const AI_DASHBOARD_ASSET = '/assets/cote-finance-ai-dashboard.png';

const fallbackTestimonials = [
  {
    name: 'Larissa M.',
    location: 'Sao Paulo, SP',
    product: 'Emprestimo pessoal',
    quote: 'Vi taxa, prazo e custo total no mesmo lugar e evitei fechar um contrato mais caro.',
    badge: 'Economia real'
  },
  {
    name: 'Rafael P.',
    location: 'Belo Horizonte, MG',
    product: 'Cartao de credito',
    quote: 'Consegui comparar beneficios e condicoes sem perder tempo em varios sites de banco.',
    badge: 'Decisao segura'
  },
  {
    name: 'Marina C.',
    location: 'Curitiba, PR',
    product: 'Financiamento',
    quote: 'O comparador me mostrou opcoes mais aderentes ao meu perfil e com melhor custo.',
    badge: 'Comparacao inteligente'
  }
];

const fallbackComparisonRows = [
  {
    product: 'Emprestimo pessoal',
    bank: 'Banco parceiro',
    rate: 'A partir de 1,89% a.m.',
    benefit: 'Analise de perfil com ordenacao por custo total',
    condition: 'Prazo de 6 a 84 meses'
  },
  {
    product: 'Cartao de credito',
    bank: 'Instituicao digital',
    rate: 'Sem anuidade em linhas selecionadas',
    benefit: 'Comparativo de cashback, milhas e sala VIP',
    condition: 'Limite conforme renda e elegibilidade'
  },
  {
    product: 'Financiamento',
    bank: 'Banco tradicional',
    rate: 'A partir de 8,99% a.a.',
    benefit: 'Leitura rapida de taxa e entrada minima',
    condition: 'Condicoes por tipo de bem e prazo'
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
            product: 'Emprestimo pessoal',
            bank: offer.bankName || 'Banco parceiro',
            rate: formatRate(offer.monthlyRate, 'a.m.'),
            benefit: `Linha ${String(offer.category || 'personalizada').toLowerCase()} com comparacao por taxa efetiva`,
            condition: `Prazo ate ${offer.maxTerm || 84} meses`
          });
        }

        if (sortedCards[0]) {
          const offer = sortedCards[0];
          nextRows.push({
            product: 'Cartao de credito',
            bank: offer.bankName || 'Instituicao digital',
            rate: offer.annualFee === 0 ? 'Sem anuidade' : `R$ ${offer.annualFee}/ano`,
            benefit: offer.benefits?.[0] || 'Comparacao de beneficios por perfil',
            condition: `Limite estimado ate R$ ${Math.round((offer.maxLimit || 0) / 1000)} mil`
          });
        }

        if (sortedFinancing[0]) {
          const offer = sortedFinancing[0];
          nextRows.push({
            product: 'Financiamento',
            bank: offer.bankName || 'Banco tradicional',
            rate: formatRate(offer.annualRate, 'a.a.'),
            benefit: `Entrada minima de ${offer.minDownPayment || 20}%`,
            condition: `Prazo ate ${offer.maxTerm || 360} meses`
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
      title: 'Emprestimos',
      copy: 'Compare taxas, custo total e prazo antes de fechar contrato.',
      href: '/emprestimos',
      tier: 'primary'
    },
    {
      icon: CreditCard,
      title: 'Cartoes de credito',
      copy: 'Filtre por anuidade, beneficios e limite estimado no mesmo painel.',
      href: '/cartoes-de-credito',
      tier: 'primary'
    },
    {
      icon: Building2,
      title: 'Financiamentos',
      copy: 'Visualize bancos, entrada minima e condicoes por tipo de bem.',
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
        <title>Cote Juros - Comparador financeiro de credito</title>
        <meta
          name="description"
          content="Compare emprestimos, cartoes, financiamentos e ferramentas financeiras em uma plataforma clara, moderna e focada em decisao segura."
        />
      </Helmet>

      <SimulationModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        initialAmount={heroValue ? parseInt(heroValue.replace(/\D/g, ''), 10) / 100 : 10000}
      />

      <section className="relative overflow-hidden border-b border-border bg-background">
        <div className="pointer-events-none absolute inset-0 hero-grid opacity-40" />
        <div className="pointer-events-none absolute left-[6%] top-20 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute right-[8%] top-16 h-52 w-52 rounded-full bg-primary/10 blur-3xl" />

        <div className="page-shell relative py-20 md:py-28">
          <motion.div {...animationIn} className="mx-auto max-w-5xl text-center">
            <span className="soft-blue-chip mb-6">Comparador financeiro completo</span>
            <h1 className="mx-auto mb-5 max-w-4xl">Cote juros antes de pegar credito.</h1>
            <p className="mx-auto max-w-3xl text-lg leading-8 text-muted-foreground md:text-xl">
              Compare emprestimos, cartoes e financiamentos com clareza de taxa, condicoes e beneficios para tomar uma decisao financeira mais segura.
            </p>

            <form onSubmit={handleHeroSubmit} className="hero-highlight mx-auto mt-10 max-w-3xl rounded-[18px] border border-primary/20 p-3 shadow-[var(--shadow-md)]">
              <div className="flex flex-col gap-3 sm:flex-row">
                <Input
                  placeholder="Digite o valor que voce quer analisar"
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
              Simulacao gratuita e organizada para comparar sem pressao comercial.
            </div>

            <div className="mt-12 grid gap-4 sm:grid-cols-3">
              <div className="interactive-card px-5 py-5 text-left">
                <p className="text-base font-semibold text-foreground">Comparacao inteligente</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {catalogSize > 0 ? `${catalogSize}+ ofertas` : 'Ofertas de diferentes perfis'} em um unico fluxo.
                </p>
              </div>
              <div className="interactive-card px-5 py-5 text-left">
                <p className="text-base font-semibold text-foreground">Taxas atualizadas</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {bankCount > 0 ? `${bankCount}+ bancos` : 'Bancos e fintechs'} com leitura direta de custo.
                </p>
              </div>
              <div className="interactive-card px-5 py-5 text-left">
                <p className="text-base font-semibold text-foreground">Decisao mais segura</p>
                <p className="mt-1 text-sm text-muted-foreground">Taxa, prazo e condicao no mesmo painel comparativo.</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="border-b border-border bg-background-secondary py-20 md:py-24">
        <div className="page-shell">
          <motion.div {...animationIn} className="mx-auto mb-14 max-w-3xl text-center">
            <span className="soft-blue-chip mb-5">Produtos</span>
            <h2 className="mb-4">Tudo para comparar credito com profundidade.</h2>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
              Cada modulo foi organizado para reduzir duvidas e aumentar conversao com linguagem clara de comparador financeiro.
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
            <h2 className="mb-4">Veja taxas, bancos, beneficios e condicoes lado a lado.</h2>
            <p className="section-copy">
              O Cote Juros volta a se posicionar como comparador: voce enxerga custo, proposta e aderencia sem navegar em paginas confusas.
            </p>
          </motion.div>

          <motion.div {...animationIn} className="overflow-hidden rounded-[18px] border border-border bg-white shadow-[var(--shadow-sm)]">
            <div className="hidden grid-cols-[1.2fr_1fr_1fr_1.2fr_1.2fr] border-b border-border bg-background-secondary px-6 py-4 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground md:grid">
              <span>Produto</span>
              <span>Banco</span>
              <span>Taxa</span>
              <span>Beneficios</span>
              <span>Condicoes</span>
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
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground md:hidden">Beneficios</p>
                    <p className="text-sm text-muted-foreground">{item.benefit}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground md:hidden">Condicoes</p>
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
              <h2>Gestao financeira viva para decidir melhor antes de contratar credito.</h2>
              <p className="section-copy">
                O Cote Finance AI funciona como camada inteligente para acompanhar entradas, saidas e margem financeira enquanto voce compara as melhores linhas de credito.
              </p>

              <div className="space-y-3">
                {[
                  'Visao mensal de receitas, despesas e saldo projetado.',
                  'Alertas para gastos que pressionam sua capacidade de pagamento.',
                  'Sugestoes de ajuste para reduzir risco de juros abusivos.'
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 text-primary" />
                    <p className="text-base text-muted-foreground">{item}</p>
                  </div>
                ))}
              </div>

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
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            >
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                whileHover={{ y: -4 }}
                className="ai-showcase rounded-[22px] border border-primary/20 bg-white p-4 transition-all duration-200 ease-out"
              >
                <img
                  src={AI_DASHBOARD_ASSET}
                  alt="Dashboard do Cote Finance AI"
                  className="w-full rounded-[14px] border border-border object-cover"
                  loading="lazy"
                />
                <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Painel inteligente com atualizacao de contexto financeiro.
                </div>
              </motion.div>
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
            <span className="soft-blue-chip mb-6">Analise final</span>
            <h2 className="mb-4">Descubra se voce esta pagando juros abusivos.</h2>
            <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground">
              Em poucos passos, voce compara opcoes com leitura clara de taxa, beneficio e condicao para escolher com seguranca.
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
