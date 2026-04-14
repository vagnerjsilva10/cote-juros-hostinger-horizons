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
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.45, ease: 'easeOut' }
};

const profileCards = [
  {
    title: 'Está com o nome negativado?',
    description: 'Veja o que ainda pode ser possível no seu momento, sem perder tempo com caminhos improváveis.',
    href: '/emprestimo-para-negativado'
  },
  {
    title: 'Trabalha registrado?',
    description: 'Entenda quais opções podem fazer mais sentido para quem tem renda fixa mensal.',
    href: '/emprestimo-para-clt'
  },
  {
    title: 'Tem renda variável?',
    description: 'Comece por um caminho mais próximo da realidade de quem trabalha por conta ou tem renda flexível.',
    href: '/emprestimo-para-autonomo'
  }
];

const faqItems = [
  {
    question: 'Preciso pagar algo para começar?',
    answer: 'Não. Você pode começar sem compromisso e sem cobrança antecipada.'
  },
  {
    question: 'Vou ser aprovado com certeza?',
    answer: 'Não. A aprovação final depende do parceiro e do seu perfil.'
  },
  {
    question: 'Preciso fechar na hora?',
    answer: 'Não. Você pode ver caminhos possíveis primeiro e decidir com calma.'
  },
  {
    question: 'A Cote Juros libera dinheiro?',
    answer: 'Não. A Cote Juros não é banco. A gente mostra opções e te direciona para a próxima etapa quando fizer sentido.'
  }
];

function FaqItem({ item, isOpen, onToggle }) {
  return (
    <div className="rounded-[20px] border border-slate-200 bg-white px-5 py-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
      <button type="button" onClick={onToggle} className="flex w-full items-center justify-between gap-4 text-left">
        <span className="text-base font-semibold text-slate-900">{item.question}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen ? <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">{item.answer}</p> : null}
    </div>
  );
}

function HomePage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);

  const openPrimaryFlow = () => {
    trackingService.trackCtaClick({
      sourcePage: '/',
      ctaId: 'home_primary_cta',
      ctaLabel: 'Ver minhas opções agora',
      productType: 'loan'
    });
    setModalOpen(true);
  };

  return (
    <>
      <Helmet>
        <title>Cote Juros - Descubra opções de crédito para o seu perfil</title>
        <meta
          name="description"
          content="Descubra agora quais opções de crédito você realmente pode conseguir. Sem compromisso, sem cobrança antecipada e sem promessa falsa."
        />
        <meta name="verify-admitad" content="1ae3db0be4" />
        <link rel="canonical" href="https://cotejuros.com.br/" />
      </Helmet>

      <QuickCreditFlowModal isOpen={modalOpen} onClose={() => setModalOpen(false)} sourcePage="/" originLabel="home" />

      <section className="relative overflow-hidden border-b border-slate-200 bg-white">
        <div className="pointer-events-none absolute inset-0">
          <div className="hero-premium-clean absolute inset-0" />
          <div className="hero-tech-grid absolute inset-0 opacity-55" />
          <div className="absolute left-[-4rem] top-[-2rem] h-64 w-64 rounded-full bg-sky-200/50 blur-3xl" />
          <div className="absolute right-[-4rem] top-8 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
        </div>

        <div className="page-shell relative py-16 sm:py-20 lg:py-24">
          <div className="grid items-center gap-12 lg:grid-cols-[1.04fr_0.96fr]">
            <motion.div {...animationIn} className="max-w-[640px]">
              <span className="section-eyebrow border-white/90 bg-white/90 shadow-[0_10px_24px_rgba(15,23,42,0.06)]">
                Sem compromisso
              </span>

              <h1 className="mt-6 text-slate-950">
                Descubra agora quais <span className="hero-word-emphasis">opções de crédito</span> você realmente pode
                conseguir
              </h1>

              <p className="mt-6 max-w-[36rem] text-lg leading-8 text-slate-600">
                Responda algumas perguntas rápidas e veja caminhos possíveis — sem compromisso e sem cobrança antecipada.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button size="lg" className="px-6" onClick={openPrimaryFlow}>
                  Ver minhas opções agora
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <a href="#como-funciona">
                  <Button size="lg" variant="outline" className="px-6">
                    Entender como funciona
                  </Button>
                </a>
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                {['Sem compromisso', 'Sem cobrança antecipada', 'Você decide com calma'].map((item) => (
                  <div key={item} className="premium-pill">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    {item}
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div {...animationIn}>
              <CreditHeroPreview />
            </motion.div>
          </div>
        </div>
      </section>

      <section id="como-funciona" className="page-section border-b border-slate-200 bg-white">
        <div className="page-shell">
          <motion.div {...animationIn} className="mx-auto max-w-3xl text-center">
            <span className="section-eyebrow">Como funciona</span>
            <h2 className="mt-4 text-slate-950">Você começa em poucos minutos</h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-slate-600">
              O foco aqui é te mostrar um caminho simples, claro e sem enrolação.
            </p>
          </motion.div>

          <div className="stagger-rise mt-12 grid gap-5 md:grid-cols-3">
            {[
              ['Responda o básico', 'Conte quanto precisa, sua renda e algumas informações rápidas para começar.'],
              ['Veja o que pode funcionar', 'A gente organiza caminhos mais próximos do seu perfil para você comparar melhor.'],
              ['Decida com calma', 'Se fizer sentido, você avança. Se não fizer, você para por ali sem pressão.']
            ].map(([title, description]) => (
              <Card key={title} className="surface-card h-full border-slate-200 bg-white">
                <CardContent className="p-7">
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
            <h2 className="mt-4 text-slate-950">Escolha o caminho que mais combina com o seu momento</h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-slate-600">
              Em vez de tentar tudo ao mesmo tempo, comece pelo que parece mais próximo da sua realidade.
            </p>
          </motion.div>

          <div className="stagger-rise mt-12 grid gap-5 lg:grid-cols-3">
            {profileCards.map((item) => (
              <Link key={item.title} to={item.href}>
                <Card className="surface-card group h-full rounded-[24px] border-slate-200 bg-white">
                  <CardContent className="p-7">
                    <h3 className="text-slate-950 transition-colors group-hover:text-primary">{item.title}</h3>
                    <p className="mt-4 text-sm leading-7 text-slate-600">{item.description}</p>
                    <div className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-950">
                      Continuar
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
          <motion.div {...animationIn} className="premium-dark-panel rounded-[32px] px-8 py-10 text-white sm:px-12 sm:py-14">
            <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-sky-100">
              Confiança
            </span>
            <h2 className="mt-5 max-w-3xl text-white">Clareza antes de qualquer decisão</h2>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-300">
              Aqui você começa sem pressão, sem cobrança antecipada e sem promessa falsa.
            </p>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {['Sem compromisso', 'Sem cobrança antecipada', 'Sem promessa falsa'].map((item) => (
                <div key={item} className="rounded-[18px] border border-white/10 bg-white/5 px-4 py-4 text-sm font-medium text-white/90">
                  {item}
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <section className="page-section border-b border-slate-200 bg-slate-50/70">
        <div className="page-shell">
          <motion.div
            {...animationIn}
            className="mx-auto max-w-4xl rounded-[28px] border border-slate-200 bg-white px-7 py-8 shadow-[0_20px_50px_rgba(15,23,42,0.05)] sm:px-10 sm:py-10"
          >
            <div className="flex items-start gap-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <ShieldCheck className="h-6 w-6 text-slate-900" />
              </div>
              <div>
                <span className="section-eyebrow bg-slate-50">Nosso papel</span>
                <h2 className="mt-4 text-slate-950">Nosso papel é te ajudar a encontrar caminhos</h2>
                <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">
                  A gente não é banco — e é justamente por isso que você consegue ver suas opções com mais clareza.
                </p>
                <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-600">
                  Mostramos caminhos possíveis. A decisão é sempre sua.
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
            className="mx-auto max-w-4xl rounded-[30px] border border-slate-200 bg-white px-7 py-10 text-center shadow-[0_24px_70px_rgba(15,23,42,0.08)] sm:px-10 sm:py-12"
          >
            <span className="section-eyebrow border-sky-200 bg-sky-50 text-sky-700">Comece agora</span>
            <h2 className="mt-4 text-slate-950">Descubra agora o que pode fazer sentido para você</h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-slate-600">
              Leva menos de 2 minutos para começar.
            </p>
            <div className="mt-8 flex justify-center">
              <Button size="lg" className="px-7" onClick={openPrimaryFlow}>
                Ver minhas opções agora
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>

          <p className="mx-auto mt-6 max-w-3xl text-center text-xs leading-6 text-slate-500">
            A Cote Juros não é banco, não concede crédito diretamente e não garante aprovação. Não cobramos valor
            antecipado.
          </p>
        </div>
      </section>
    </>
  );
}

export default HomePage;
