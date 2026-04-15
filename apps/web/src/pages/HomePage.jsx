import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle2, ChevronDown, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import CreditHeroPreview from '@/components/CreditHeroPreview.jsx';
import QuickCreditFlowModal from '@/components/QuickCreditFlowModal.jsx';
import { trackingService } from '@/platform/services/trackingService.js';

const animationIn = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.18 },
  transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] }
};

const marketBrands = [
  'SuperSim',
  'Banco PAN',
  'C6 Bank',
  'Nubank',
  'Banco Inter',
  'Santander'
];

const profileCards = [
  {
    title: 'Está com o nome negativado?',
    description: 'Veja por onde vale a pena começar sem cair em promessa fácil.',
    href: '/emprestimo-para-negativado'
  },
  {
    title: 'Tem renda fixa?',
    description: 'Entenda opções que podem encaixar melhor no seu orçamento.',
    href: '/emprestimo-para-clt'
  },
  {
    title: 'Tem renda variável?',
    description: 'Compare caminhos com mais cuidado antes de assumir parcelas.',
    href: '/emprestimo-para-autonomo'
  },
  {
    title: 'Quer entender antes de decidir?',
    description: 'Organize o cenário primeiro e avance com mais confiança.',
    href: '/educacao-financeira'
  }
];

const credibilityBlocks = [
  {
    eyebrow: 'Vida financeira real',
    title: 'Entenda seu momento antes de perder tempo em várias tentativas',
    description: 'A experiência foi pensada para trazer mais clareza logo no início, com contexto real e uma leitura mais humana do seu cenário.',
    image: 'https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=1400&q=80',
    alt: 'Casal moderno organizando finanças em um ambiente claro'
  },
  {
    eyebrow: 'Decisão com calma',
    title: 'Compare com mais segurança antes de seguir para qualquer próxima etapa',
    description: 'Menos ruído, menos promessa vazia e mais informação útil para você decidir com tranquilidade.',
    image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1400&q=80',
    alt: 'Pessoa usando notebook para analisar opções financeiras'
  }
];

const faqItems = [
  {
    question: 'Preciso pagar algo para começar?',
    answer: 'Não. Você pode começar sem compromisso e sem cobrança antecipada.'
  },
  {
    question: 'Isso garante aprovação?',
    answer: 'Não. A decisão final depende da instituição que analisar o seu caso.'
  },
  {
    question: 'Preciso decidir na hora?',
    answer: 'Não. Primeiro você entende os caminhos possíveis e só depois decide se quer continuar.'
  },
  {
    question: 'A Cote Juros empresta dinheiro?',
    answer: 'Não. Nosso papel é ajudar você a entender o cenário, comparar com mais clareza e seguir pelo melhor caminho.'
  }
];

function FaqItem({ item, isOpen, onToggle }) {
  return (
    <div className="rounded-[20px] border border-slate-200 bg-white px-5 py-5 shadow-[0_10px_24px_rgba(15,23,42,0.04)] transition-all duration-300 hover:-translate-y-[1px] hover:shadow-[0_14px_30px_rgba(15,23,42,0.06)]">
      <button type="button" onClick={onToggle} className="flex w-full items-center justify-between gap-4 text-left">
        <span className="text-base font-medium text-slate-900">{item.question}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-slate-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      <div className={`grid transition-[grid-template-rows,opacity,margin] duration-300 ${isOpen ? 'mt-3 grid-rows-[1fr] opacity-100' : 'mt-0 grid-rows-[0fr] opacity-0'}`}>
        <div className="overflow-hidden">
          <p className="max-w-3xl text-sm leading-7 text-slate-600">{item.answer}</p>
        </div>
      </div>
    </div>
  );
}

function HomePage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);
  const [heroPreviewFocusSignal, setHeroPreviewFocusSignal] = useState(0);

  const openPrimaryFlow = () => {
    trackingService.trackCtaClick({
      sourcePage: '/',
      ctaId: 'home_primary_cta',
      ctaLabel: 'Ver minhas opções agora',
      productType: 'loan'
    });
    setModalOpen(true);
  };

  const focusHeroPreview = () => {
    trackingService.trackCtaClick({
      sourcePage: '/',
      ctaId: 'home_hero_focus_cta',
      ctaLabel: 'Ver minhas opções agora',
      productType: 'loan'
    });

    const previewElement = document.getElementById('hero-credit-preview');
    previewElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setHeroPreviewFocusSignal((value) => value + 1);

    window.setTimeout(() => {
      const firstInput = previewElement?.querySelector('input');
      if (firstInput instanceof HTMLInputElement) {
        firstInput.focus();
        firstInput.select();
      }
    }, 260);
  };

  return (
    <>
      <Helmet>
        <title>Cote Juros - Descubra caminhos de crédito com mais clareza</title>
        <meta
          name="description"
          content="Descubra quais caminhos de crédito fazem sentido para você. Sem promessa falsa, sem cobrança antecipada e com mais clareza para decidir."
        />
        <meta name="verify-admitad" content="1ae3db0be4" />
        <link rel="canonical" href="https://cotejuros.com.br/" />
      </Helmet>

      <QuickCreditFlowModal isOpen={modalOpen} onClose={() => setModalOpen(false)} sourcePage="/" originLabel="home" />

      <section className="relative overflow-hidden border-b border-slate-200 bg-white">
        <div className="pointer-events-none absolute inset-0">
          <div className="hero-premium-clean absolute inset-0" />
          <div className="hero-tech-grid absolute inset-0 opacity-16" />
          <div className="absolute left-[-3rem] top-0 h-56 w-56 rounded-full bg-sky-100/60 blur-3xl" />
          <div className="absolute right-[-2rem] top-10 h-56 w-56 rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute right-[24%] top-[12%] h-44 w-44 rounded-full bg-violet-100/40 blur-3xl" />
        </div>

        <div className="page-shell relative py-20 sm:py-24 lg:py-28">
          <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-10">
            <motion.div {...animationIn} className="max-w-[690px]">
              <span className="section-eyebrow border-white/80 bg-white/92">
                Sem promessa falsa. Sem cobrança antecipada.
              </span>

              <h1 className="hero-headline mt-7 text-slate-950">
                Descubra quais <span className="hero-word-emphasis-strong">caminhos de crédito</span> fazem sentido para você
              </h1>

              <p className="hero-subcopy mt-6 max-w-[36rem] text-slate-600">
                Em poucos minutos, você entende por onde vale a pena começar e evita perder tempo em várias tentativas sem clareza.
              </p>

              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Button size="lg" className="hero-primary-cta" onClick={focusHeroPreview}>
                  Ver minhas opções agora
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <a href="#como-funciona">
                  <Button size="lg" variant="outline">
                    Entender como funciona
                  </Button>
                </a>
              </div>

              <div className="mt-9 flex flex-wrap gap-3">
                {['Sem compromisso', 'Sem cobrança antecipada', 'Você decide com calma'].map((item) => (
                  <div key={item} className="premium-pill">
                    <CheckCircle2 className="h-4 w-4 text-[#10B981]" />
                    {item}
                  </div>
                ))}
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                {['Leitura clara do seu momento', 'Comparação com mais calma', 'Próximos passos sem pressão'].map((item) => (
                  <span key={item} className="hero-proof-pill">
                    {item}
                  </span>
                ))}
              </div>
            </motion.div>

            <motion.div {...animationIn} className="mx-auto w-full max-w-[400px] lg:mr-0 lg:pt-[4.8rem]">
              <CreditHeroPreview focusSignal={heroPreviewFocusSignal} onContinue={openPrimaryFlow} />
            </motion.div>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-white py-10 sm:py-12">
        <div className="page-shell">
          <motion.div {...animationIn} className="text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary/80">
              Instituições e marcas no radar de quem compara com mais cuidado
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              {marketBrands.map((brand) => (
                <div key={brand} className="brand-pill">
                  <span className="brand-dot" />
                  <span>{brand}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <section id="como-funciona" className="page-section border-b border-slate-200 bg-white">
        <div className="page-shell">
          <motion.div {...animationIn} className="mx-auto max-w-3xl text-center">
            <span className="section-eyebrow">Como funciona</span>
            <h2 className="mt-4 text-slate-950">Você não precisa sair tentando tudo de uma vez</h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg leading-[1.8] text-slate-600">
              Primeiro você entende o cenário. Depois compara com mais clareza. Só então decide se quer avançar.
            </p>
          </motion.div>

          <div className="stagger-rise mt-14 grid gap-6 md:grid-cols-3">
            {[
              ['Comece pelo que faz sentido', 'Responda o básico do seu momento e veja um caminho mais claro desde o início.'],
              ['Compare com mais segurança', 'Entenda possibilidades, custos e contexto antes de tomar qualquer decisão.'],
              ['Avance só quando estiver pronto', 'Depois de entender o cenário, você decide se quer continuar.']
            ].map(([title, description]) => (
              <Card key={title} className="surface-card h-full border-slate-200 bg-white">
                <CardContent className="p-8">
                  <h3 className="text-slate-950">{title}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="page-section border-b border-slate-200 bg-slate-50/70">
        <div className="page-shell">
          <motion.div {...animationIn} className="mx-auto max-w-3xl text-center">
            <span className="section-eyebrow bg-white">Seu momento</span>
            <h2 className="mt-4 text-slate-950">Comece pelo caminho que mais combina com o seu momento</h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg leading-[1.8] text-slate-600">
              Cada situação pede um ponto de partida diferente. Não tente tudo de uma vez: comece pelo que faz mais sentido agora.
            </p>
          </motion.div>

          <div className="stagger-rise mt-14 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {profileCards.map((item) => (
              <Link key={item.title} to={item.href}>
                <Card className="surface-card group h-full border-slate-200 bg-white">
                  <CardContent className="p-8">
                    <h3 className="text-slate-950 transition-colors group-hover:text-primary">{item.title}</h3>
                    <p className="mt-4 text-sm leading-7 text-slate-600">{item.description}</p>
                    <div className="mt-7 inline-flex items-center gap-2 text-sm font-medium text-slate-900">
                      Começar por aqui
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="page-section border-b border-slate-200 bg-white">
        <div className="page-shell">
          <motion.div {...animationIn} className="premium-dark-panel-home rounded-[34px] px-8 py-12 text-white sm:px-12 sm:py-16 lg:px-16 lg:py-20">
            <div className="grid gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
              <div>
                <span className="section-kicker border-white/15 bg-white/10 text-slate-100">Mais clareza antes da decisão</span>
                <h2 className="section-title-gradient-strong mt-6 max-w-3xl text-[clamp(2.2rem,4vw,3.75rem)] leading-[1.08]">
                  Clareza muda tudo quando o assunto é crédito
                </h2>
                <p className="mt-5 max-w-xl text-lg leading-[1.8] text-slate-300">
                  Quando você entende melhor o seu momento, fica mais fácil separar o que merece atenção do que só faz perder tempo.
                </p>

                <div className="mt-9 space-y-3">
                  {[
                    'Mais contexto antes da decisão',
                    'Menos tentativa no escuro',
                    'Mais calma para comparar'
                  ].map((item) => (
                    <div key={item} className="dark-benefit-row">
                      <CheckCircle2 className="h-4 w-4 text-sky-300" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-9 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-4 py-2 text-sm text-slate-200">
                  <ShieldCheck className="h-4 w-4 text-sky-300" />
                  Sem pressão. Sem cobrança antecipada. Sem enrolação.
                </div>
              </div>

              <div className="dark-visual-panel">
                <div className="dark-chart-card">
                  <div className="flex items-end justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Leitura mais clara</p>
                      <h3 className="mt-2 text-white">Entenda antes de avançar</h3>
                    </div>
                    <div className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-xs text-slate-200">
                      Em poucos minutos
                    </div>
                  </div>

                  <div className="mt-9 grid grid-cols-4 items-end gap-3">
                    {[38, 58, 74, 92].map((height, index) => (
                      <div key={height} className="space-y-3">
                        <div className="dark-chart-bar-shell">
                          <div
                            className="dark-chart-bar"
                            style={{ height: `${height}%`, animationDelay: `${index * 120}ms` }}
                          />
                        </div>
                        <div className="text-center text-xs text-slate-400">
                          {['Início', 'Leitura', 'Comparação', 'Decisão'][index]}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-9 rounded-[20px] border border-white/8 bg-white/[0.04] p-4">
                    <svg viewBox="0 0 320 120" className="w-full overflow-visible">
                      <defs>
                        <linearGradient id="homeDarkLine" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#60A5FA" />
                          <stop offset="55%" stopColor="#4F46E5" />
                          <stop offset="100%" stopColor="#7C3AED" />
                        </linearGradient>
                      </defs>
                      <path
                        d="M10 92 C 64 88, 82 70, 126 66 S 194 32, 240 34 S 292 16, 310 18"
                        fill="none"
                        stroke="url(#homeDarkLine)"
                        strokeWidth="4"
                        strokeLinecap="round"
                        className="chart-draw"
                      />
                      <circle cx="310" cy="18" r="6" fill="#60A5FA" className="chart-pulse" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="page-section border-b border-slate-200 bg-white">
        <div className="page-shell">
          <motion.div {...animationIn} className="mx-auto max-w-3xl text-center">
            <span className="section-eyebrow">Mais confiança no caminho</span>
            <h2 className="mt-4 text-slate-950">Um produto mais humano, com contexto real e menos ruído</h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg leading-[1.8] text-slate-600">
              A Cote Juros foi desenhada para ajudar você a enxergar melhor o cenário antes de qualquer próxima etapa.
            </p>
          </motion.div>

          <div className="mt-14 grid gap-6 lg:grid-cols-2">
            {credibilityBlocks.map((item) => (
              <motion.article key={item.title} {...animationIn} className="overflow-hidden rounded-[30px] border border-border bg-white shadow-[0_14px_30px_rgba(15,23,42,0.05)]">
                <img src={item.image} alt={item.alt} className="h-72 w-full object-cover transition-transform duration-500 hover:scale-[1.02]" />
                <div className="p-8">
                  <span className="section-eyebrow bg-slate-50">{item.eyebrow}</span>
                  <h3 className="mt-4 text-slate-950">{item.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{item.description}</p>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <section className="page-section border-b border-slate-200 bg-slate-50/70">
        <div className="page-shell">
          <motion.div
            {...animationIn}
            className="mx-auto max-w-4xl rounded-[32px] border border-slate-200 bg-white px-8 py-10 shadow-[0_12px_28px_rgba(15,23,42,0.05)] sm:px-10 sm:py-11"
          >
            <div className="flex items-start gap-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <ShieldCheck className="h-6 w-6 text-slate-900" />
              </div>
              <div>
                <span className="section-eyebrow bg-slate-50">Nosso papel</span>
                <h2 className="mt-4 text-slate-950">A Cote Juros existe para dar clareza antes da decisão</h2>
                <p className="mt-4 max-w-3xl text-lg leading-[1.8] text-slate-600">
                  Nosso papel é ajudar você a entender o cenário, comparar com calma e evitar escolhas no escuro.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="page-section border-b border-slate-200 bg-white">
        <div className="page-shell">
          <motion.div {...animationIn} className="mx-auto max-w-3xl text-center">
            <span className="section-eyebrow">Perguntas frequentes</span>
            <h2 className="mt-4 text-slate-950">O que você precisa saber antes de começar</h2>
          </motion.div>

          <div className="mx-auto mt-10 max-w-4xl space-y-4">
            {faqItems.map((item, index) => (
              <motion.div key={item.question} {...animationIn}>
                <FaqItem item={item} isOpen={openFaq === index} onToggle={() => setOpenFaq(openFaq === index ? -1 : index)} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="page-section bg-[linear-gradient(180deg,#f8fafc_0%,#eef4ff_100%)]">
        <div className="page-shell">
          <motion.div
            {...animationIn}
            className="mx-auto max-w-4xl rounded-[32px] border border-slate-200 bg-white px-8 py-11 text-center shadow-[0_18px_40px_rgba(15,23,42,0.08)] sm:px-10 sm:py-13"
          >
            <span className="section-eyebrow border-sky-200 bg-sky-50 text-sky-700">Comece agora</span>
            <h2 className="mt-4 text-slate-950">Veja o que realmente pode fazer sentido para você</h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg leading-[1.8] text-slate-600">
              Sem enrolação, sem promessa falsa e sem cobrança antecipada.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Button size="lg" onClick={openPrimaryFlow}>
                Descobrir meus caminhos agora
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Link to="/emprestimos">
                <Button size="lg" variant="outline">
                  Ver comparação
                </Button>
              </Link>
            </div>
          </motion.div>

          <p className="mx-auto mt-6 max-w-3xl text-center text-xs leading-6 text-slate-500">
            A Cote Juros não é banco, não concede crédito diretamente e não garante aprovação. Não cobramos valor antecipado.
          </p>
        </div>
      </section>
    </>
  );
}

export default HomePage;
