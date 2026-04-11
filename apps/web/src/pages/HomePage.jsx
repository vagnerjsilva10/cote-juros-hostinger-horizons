import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { SimulationModal } from '@/components/SimulationModal.jsx';
import {
  ArrowRight,
  BookOpen,
  Building2,
  Calculator,
  CheckCircle2,
  CreditCard,
  DollarSign,
  Home,
  ShieldCheck
} from 'lucide-react';
import { portalApi } from '@/platform/services/portalApi.js';
import { trackingService } from '@/platform/services/trackingService.js';

const AI_DASHBOARD_ASSET = '/assets/cote-finance-ai-dashboard.png';

function HomePage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [heroValue, setHeroValue] = useState('');
  const [testimonials, setTestimonials] = useState([]);

  useEffect(() => {
    portalApi.getTestimonials().then(setTestimonials).catch(() => setTestimonials([]));
  }, []);

  const formatCurrency = (value) => {
    let next = value.replace(/\D/g, '');
    if (next) {
      next = (parseInt(next, 10) / 100).toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      });
    }
    setHeroValue(next);
  };

  const handleHeroSubmit = (event) => {
    event.preventDefault();
    setModalOpen(true);
  };

  const productCards = [
    {
      icon: DollarSign,
      title: 'Emprestimos',
      copy: 'Filtre por taxa, prazo e perfil para reduzir o custo total do credito.',
      href: '/emprestimos'
    },
    {
      icon: CreditCard,
      title: 'Cartoes',
      copy: 'Compare anuidade, limite estimado e beneficios sem navegar por dezenas de paginas.',
      href: '/cartoes-de-credito'
    },
    {
      icon: Home,
      title: 'Financiamento',
      copy: 'Veja bancos, entrada minima e prazo maximo com uma leitura mais clara.',
      href: '/financiamento'
    }
  ];

  const supportCards = [
    {
      icon: Calculator,
      title: 'Ferramentas',
      copy: 'Calculos simples para juros compostos, financiamento e comprometimento de renda.',
      href: '/ferramentas'
    },
    {
      icon: BookOpen,
      title: 'Editorial',
      copy: 'Conteudo direto para explicar produtos, taxas e decisoes financeiras do dia a dia.',
      href: '/blog'
    },
    {
      icon: Building2,
      title: 'Institucional',
      copy: 'Uma camada mais objetiva entre o usuario e as informacoes do sistema.',
      href: '/sobre-nos'
    }
  ];

  const processSteps = [
    {
      step: '01',
      title: 'Defina o valor',
      copy: 'Comece pela necessidade real para evitar simular produtos fora do contexto.'
    },
    {
      step: '02',
      title: 'Leia taxas e elegibilidade',
      copy: 'A interface organiza prazo, taxa e requisitos sem ruido visual.'
    },
    {
      step: '03',
      title: 'Avance com seguranca',
      copy: 'Quando fizer sentido, siga para a simulacao e envie seus dados com clareza.'
    }
  ];

  return (
    <>
      <Helmet>
        <title>Cote Juros - Compare credito com clareza</title>
        <meta
          name="description"
          content="Compare emprestimos, cartoes e financiamentos com uma experiencia minimalista e focada em custo, prazo e elegibilidade."
        />
      </Helmet>

      <SimulationModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        initialAmount={heroValue ? parseInt(heroValue.replace(/\D/g, '')) / 100 : 10000}
      />

      <section className="relative overflow-hidden border-b border-border bg-background">
        <div className="pointer-events-none absolute inset-0 hero-grid opacity-60" />
        <div className="pointer-events-none absolute left-[8%] top-24 h-36 w-36 rounded-full bg-slate-900/5 blur-3xl" />
        <div className="pointer-events-none absolute right-[10%] top-20 h-44 w-44 rounded-full bg-slate-900/5 blur-3xl" />

        <div className="page-shell relative py-24 md:py-32">
          <div className="mx-auto max-w-4xl text-center">
            <span className="section-eyebrow mb-6">Credito com menos ruido</span>
            <h1 className="mx-auto mb-6 max-w-3xl">
              Compare juros, prazos e elegibilidade antes de assumir um contrato.
            </h1>
            <p className="mx-auto max-w-2xl text-lg leading-8 text-muted-foreground md:text-xl">
              Uma interface neutra, tipografica e objetiva para simular emprestimos, cartoes e financiamentos sem a sensacao de portal poluido.
            </p>

            <form onSubmit={handleHeroSubmit} className="mx-auto mt-10 max-w-2xl rounded-[16px] border border-border bg-white p-3 shadow-[var(--shadow-sm)]">
              <div className="flex flex-col gap-3 sm:flex-row">
                <Input
                  placeholder="De quanto voce precisa?"
                  className="h-12 border-0 bg-transparent text-base shadow-none focus-visible:ring-0"
                  value={heroValue}
                  onChange={(event) => formatCurrency(event.target.value)}
                />
                <Button type="submit" size="lg" className="h-12 min-w-[180px]">
                  Calcular juros
                </Button>
              </div>
            </form>

            <div className="mt-5 inline-flex items-center gap-2 text-sm text-muted-foreground">
              <ShieldCheck className="h-4 w-4 text-foreground" />
              Simulacao gratuita, fluxo seguro e leitura objetiva.
            </div>

            <div className="mt-14 grid gap-4 sm:grid-cols-3">
              {[
                { value: '50+', label: 'instituicoes monitoradas' },
                { value: 'Diario', label: 'ajuste de taxa e condicao' },
                { value: 'Soft query', label: 'consulta inicial sem derrubar score' }
              ].map((item) => (
                <div key={item.label} className="rounded-[12px] border border-border bg-background-secondary px-5 py-5 text-left">
                  <p className="text-2xl font-semibold tracking-[-0.03em] text-foreground">{item.value}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-border bg-background-secondary py-20 md:py-24">
        <div className="page-shell">
          <div className="mx-auto mb-14 max-w-3xl text-center">
            <span className="section-eyebrow mb-5">Tudo em um sistema</span>
            <h2 className="mb-4">Tudo o que voce precisa para comparar credito.</h2>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
              A estrutura segue a referencia: muito espaco, poucas decisoes visuais e cards que deixam a tipografia fazer o trabalho.
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            {productCards.map((item) => (
              <Link key={item.title} to={item.href}>
                <Card className="surface-card h-full">
                  <CardContent className="flex h-full flex-col gap-6 p-8">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-background-secondary">
                      <item.icon className="h-5 w-5 text-foreground" />
                    </div>
                    <div className="space-y-3">
                      <h3>{item.title}</h3>
                      <p>{item.copy}</p>
                    </div>
                    <div className="mt-auto inline-flex items-center gap-2 text-sm font-medium text-foreground">
                      Explorar <ArrowRight className="h-4 w-4" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-3">
            {supportCards.map((item) => (
              <Link key={item.title} to={item.href}>
                <Card className="surface-card h-full bg-white">
                  <CardContent className="flex h-full flex-col gap-5 p-8">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-background-secondary">
                      <item.icon className="h-5 w-5 text-foreground" />
                    </div>
                    <div className="space-y-3">
                      <h4>{item.title}</h4>
                      <p>{item.copy}</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="page-section border-b border-border bg-background">
        <div className="page-shell">
          <div className="mb-14 max-w-2xl">
            <span className="section-eyebrow mb-5">Processo simples</span>
            <h2 className="mb-4">Uma camada mais clara entre voce e o credito.</h2>
            <p className="section-copy">
              A pagina inicial fica mais proxima da referencia: hero centralizado, modulos discretos e explicacao curta de como o sistema funciona.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {processSteps.map((item) => (
              <div key={item.step} className="rounded-[12px] border border-border bg-background p-8">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">{item.step}</p>
                <h3 className="mt-6">{item.title}</h3>
                <p className="mt-3">{item.copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-border bg-background-secondary py-20 md:py-24">
        <div className="page-shell">
          <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="space-y-6">
              <span className="section-eyebrow">Cote Finance AI</span>
              <h2>Controle financeiro com a mesma linguagem minimalista do portal.</h2>
              <p className="section-copy">
                O produto complementar continua no ecossistema, mas com uma apresentacao mais silenciosa, mais proxima de software premium do que de landing page promocional.
              </p>

              <div className="space-y-3">
                {[
                  'Dashboard mensal com entradas, saidas e margem.',
                  'Leitura rapida de padroes de gasto e metas.',
                  'Fluxo de decisao com menos distracao visual.'
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 text-foreground" />
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
                      ctaLabel: 'Abrir Cote Finance AI',
                      productType: 'loan'
                    })
                  }
                >
                  Abrir Cote Finance AI
                </Button>
              </Link>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="rounded-[20px] border border-border bg-white p-4 shadow-[var(--shadow-md)]"
            >
              <img
                src={AI_DASHBOARD_ASSET}
                alt="Dashboard do Cote Finance AI"
                className="w-full rounded-[14px] border border-border object-cover"
                loading="lazy"
              />
            </motion.div>
          </div>
        </div>
      </section>

      <section className="page-section bg-background">
        <div className="page-shell">
          <div className="mx-auto mb-14 max-w-3xl text-center">
            <span className="section-eyebrow mb-5">Prova social</span>
            <h2 className="mb-4">Uma experiencia mais calma, sem perder resultado.</h2>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
              Os depoimentos entram em um grid discreto, com foco no texto e no efeito percebido pelos usuarios.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {testimonials.slice(0, 3).map((item, index) => (
              <Card key={`${item.name}-${index}`} className="surface-card h-full">
                <CardContent className="flex h-full flex-col gap-6 p-8">
                  <div className="inline-flex w-fit items-center rounded-full border border-border bg-background-secondary px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    {item.badge || 'Cliente'}
                  </div>
                  <p className="text-lg leading-8 text-foreground">"{item.quote}"</p>
                  <div className="mt-auto border-t border-border pt-5">
                    <p className="font-semibold text-foreground">{item.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.location} • {item.product}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-16 rounded-[20px] border border-border bg-background-secondary px-8 py-10 text-center">
            <div className="mx-auto max-w-2xl">
              <span className="section-eyebrow mb-5">Pronto para começar</span>
              <h2 className="mb-4">Calcule em segundos e avance apenas quando fizer sentido.</h2>
              <p className="mx-auto mb-8 max-w-xl text-lg text-muted-foreground">
                O redesenho prioriza leitura, espaco e neutralidade para deixar a tomada de decisao mais objetiva.
              </p>
              <div className="flex flex-col justify-center gap-3 sm:flex-row">
                <Button size="lg" onClick={() => setModalOpen(true)}>
                  Calcular juros
                </Button>
                <Link to="/blog">
                  <Button size="lg" variant="outline">
                    Ler o blog
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export default HomePage;
