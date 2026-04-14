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
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.45, ease: [0.4, 0, 0.2, 1] }
};

const profileCards = [
  {
    title: 'Está com o nome negativado?',
    description: 'Veja caminhos mais realistas para o seu momento, sem perder tempo com rotas improváveis.',
    href: '/emprestimo-para-negativado'
  },
  {
    title: 'Trabalha com renda fixa?',
    description: 'Comece por opções que costumam conversar melhor com um perfil CLT e renda previsível.',
    href: '/emprestimo-para-clt'
  },
  {
    title: 'Tem renda variável?',
    description: 'Entenda possibilidades pensadas para autônomos, MEI e quem precisa de mais flexibilidade.',
    href: '/emprestimo-para-autonomo'
  }
];

const trustCards = [
  {
    title: 'Leitura clara do cenário',
    description: 'Você entende primeiro o que pode fazer sentido, antes de qualquer decisão.'
  },
  {
    title: 'Sem cobrança antecipada',
    description: 'O início é leve, transparente e sem custo para começar.'
  },
  {
    title: 'Decisão no seu tempo',
    description: 'Você só avança quando quiser. Sem urgência artificial e sem pressão.'
  }
];

const contentBlocks = [
  {
    title: 'Conteúdo que ajuda a decidir melhor',
    description: 'Guias editoriais para entender score, juros, prazos e como comparar custos sem cair em promessa vaga.',
    image:
      'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80'
  },
  {
    title: 'Contexto real para a sua escolha',
    description: 'A plataforma organiza informações antes de te levar para a próxima etapa, reduzindo ruído e aumentando confiança.',
    image:
      'https://images.unsplash.com/photo-1556740749-887f6717d7e4?auto=format&fit=crop&w=1200&q=80'
  }
];

const faqItems = [
  {
    question: 'Preciso pagar algo para começar?',
    answer: 'Não. Você pode começar sem compromisso e sem cobrança antecipada.'
  },
  {
    question: 'Vou ser aprovado com certeza?',
    answer: 'Não. A aprovação final depende do parceiro e da análise do seu perfil.'
  },
  {
    question: 'Preciso fechar na hora?',
    answer: 'Não. Primeiro você entende os caminhos possíveis e decide com calma.'
  },
  {
    question: 'A Cote Juros libera dinheiro?',
    answer: 'Não. A Cote Juros não é banco. Nosso papel é organizar opções e indicar a próxima etapa quando fizer sentido.'
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
          content="Descubra agora quais opções de crédito você realmente pode conseguir. Sem compromisso, sem cobrança antecipada e sem misturar análise com contratação."
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
                Responda algumas perguntas rápidas e veja caminhos possíveis sem compromisso e sem cobrança antecipada.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button size="lg" onClick={openPrimaryFlow}>
                  Ver minhas opções agora
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <a href="#como-funciona">
                  <Button size="lg" variant="outline">
                    Entender como funciona
                  </Button>
                </a>
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                {['Sem compromisso', 'Sem cobrança antecipada', 'Você decide com calma'].map((item) => (
                  <div key={item} className="premium-pill">
                    <CheckCircle2 className="h-4 w-4 text-[#10B981]" />
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
            <h2 className="mt-4 text-slate-950">Uma jornada simples, sem formulário pesado logo na entrada</h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-slate-600">
              Primeiro você entende o cenário. Depois compara opções. Só então decide se quer seguir para um parceiro.
            </p>
          </motion.div>

          <div className="stagger-rise mt-12 grid gap-5 md:grid-cols-3">
            {[
              ['1. Conte o básico', 'Valor, renda e contexto em poucos passos para organizar melhor a análise.'],
              ['2. Veja caminhos possíveis', 'A leitura interna mostra opções e cenários antes de qualquer saída externa.'],
              ['3. Avance se fizer sentido', 'Quando você quiser seguir, o redirecionamento fica claro e separado.']
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
            <h2 className="mt-4 text-slate-950">Escolha o ponto de partida mais próximo da sua realidade</h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-slate-600">
              Em vez de misturar tudo, a experiência começa por contexto. Isso reduz ruído e aumenta clareza.
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
            <span className="section-kicker border-white/15 bg-white/10 text-sky-100">Clareza e confiança</span>
            <h2 className="section-title-gradient mt-5 max-w-3xl">Você entende a análise antes de qualquer redirecionamento</h2>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-300">
              A experiência premium aqui está em separar bem o que é leitura interna do que é saída para parceiro.
            </p>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {trustCards.map((item) => (
                <div key={item.title} className="dark-glass-card rounded-[18px] px-5 py-5">
                  <p className="text-base font-semibold text-white">{item.title}</p>
                  <p className="mt-3 text-sm leading-7 text-slate-300">{item.description}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <section className="page-section border-b border-slate-200 bg-white">
        <div className="page-shell">
          <div className="grid gap-6 lg:grid-cols-2">
            {contentBlocks.map((item) => (
              <motion.article key={item.title} {...animationIn} className="overflow-hidden rounded-[24px] border border-border bg-white shadow-[0_10px_30px_rgba(0,0,0,0.05)]">
                <img src={item.image} alt={item.title} className="h-64 w-full object-cover" />
                <div className="p-7">
                  <span className="section-eyebrow bg-slate-50">Conteúdo e contexto</span>
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
            className="mx-auto max-w-4xl rounded-[28px] border border-slate-200 bg-white px-7 py-8 shadow-[0_20px_50px_rgba(15,23,42,0.05)] sm:px-10 sm:py-10"
          >
            <div className="flex items-start gap-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <ShieldCheck className="h-6 w-6 text-slate-900" />
              </div>
              <div>
                <span className="section-eyebrow bg-slate-50">Nosso papel</span>
                <h2 className="mt-4 text-slate-950">A Cote Juros organiza o cenário. O parceiro cuida da contratação.</h2>
                <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">
                  Isso evita a mistura entre produto interno e monetização, deixa a jornada mais honesta e melhora a percepção de confiança.
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
            <h2 className="mt-4 text-slate-950">Veja caminhos possíveis sem entrar em um formulário pesado de cara</h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-slate-600">
              Leva menos de 2 minutos para entender o cenário inicial.
            </p>
            <div className="mt-8 flex justify-center">
              <Button size="lg" onClick={openPrimaryFlow}>
                Ver minhas opções agora
                <ArrowRight className="h-4 w-4" />
              </Button>
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
