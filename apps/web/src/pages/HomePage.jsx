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
  transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] }
};

const profileCards = [
  {
    title: 'Está com o nome negativado?',
    description: 'Comece por um caminho mais compatível com o seu momento.',
    href: '/emprestimo-para-negativado'
  },
  {
    title: 'Tem renda fixa?',
    description: 'Veja possibilidades pensadas para quem tem renda mais previsível.',
    href: '/emprestimo-para-clt'
  },
  {
    title: 'Tem renda variável?',
    description: 'Entenda opções para autônomos, MEI e perfis mais flexíveis.',
    href: '/emprestimo-para-autonomo'
  }
];

const contentBlocks = [
  {
    eyebrow: 'Conteúdo editorial',
    title: 'Leituras mais claras para quem quer decidir com calma',
    description: 'Guias sobre crédito, orçamento e comparação com uma linguagem mais simples e visual mais confiável.',
    image: 'https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=1400&q=80',
    alt: 'Casal moderno analisando finanças em um ambiente claro'
  },
  {
    eyebrow: 'Vida financeira real',
    title: 'Mais contexto antes da próxima etapa',
    description: 'A experiência foi desenhada para explicar melhor o cenário antes de qualquer decisão ou saída externa.',
    image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1400&q=80',
    alt: 'Pessoa usando notebook para organizar a vida financeira'
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
    question: 'Preciso decidir na hora?',
    answer: 'Não. Primeiro você entende os caminhos possíveis e decide com calma.'
  },
  {
    question: 'A Cote Juros libera dinheiro?',
    answer: 'Não. A Cote Juros não é banco. Nosso papel é organizar informações e indicar a próxima etapa quando fizer sentido.'
  }
];

function FaqItem({ item, isOpen, onToggle }) {
  return (
    <div className="rounded-[18px] border border-slate-200 bg-white px-5 py-5 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
      <button type="button" onClick={onToggle} className="flex w-full items-center justify-between gap-4 text-left">
        <span className="text-base font-medium text-slate-900">{item.question}</span>
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
          content="Descubra agora quais opções de crédito você realmente pode conseguir. Sem compromisso, sem cobrança antecipada e com uma experiência mais clara."
        />
        <meta name="verify-admitad" content="1ae3db0be4" />
        <link rel="canonical" href="https://cotejuros.com.br/" />
      </Helmet>

      <QuickCreditFlowModal isOpen={modalOpen} onClose={() => setModalOpen(false)} sourcePage="/" originLabel="home" />

      <section className="relative overflow-hidden border-b border-slate-200 bg-white">
        <div className="pointer-events-none absolute inset-0">
          <div className="hero-premium-clean absolute inset-0" />
          <div className="hero-tech-grid absolute inset-0 opacity-24" />
          <div className="absolute left-[-3rem] top-0 h-56 w-56 rounded-full bg-sky-100/70 blur-3xl" />
          <div className="absolute right-[-2rem] top-10 h-56 w-56 rounded-full bg-primary/5 blur-3xl" />
        </div>

        <div className="page-shell relative py-16 sm:py-20 lg:py-24">
          <div className="grid items-center gap-12 lg:grid-cols-[1.04fr_0.88fr]">
            <motion.div {...animationIn} className="max-w-[620px]">
              <span className="section-eyebrow border-white/80 bg-white/90">
                Sem compromisso
              </span>

              <h1 className="mt-6 text-slate-950">
                Descubra agora quais <span className="hero-word-emphasis">opções de crédito</span> você realmente pode conseguir
              </h1>

              <p className="mt-6 max-w-[34rem] text-lg leading-8 text-slate-600">
                Responda algumas perguntas rápidas e veja caminhos possíveis sem compromisso e sem cobrança antecipada.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button size="lg" onClick={openPrimaryFlow}>
                  Ver minhas opções agora
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <a href="#como-funciona">
                  <Button size="lg" variant="outline">
                    Como funciona
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

            <motion.div {...animationIn} className="mx-auto w-full max-w-[430px]">
              <CreditHeroPreview />
            </motion.div>
          </div>
        </div>
      </section>

      <section id="como-funciona" className="page-section border-b border-slate-200 bg-white">
        <div className="page-shell">
          <motion.div {...animationIn} className="mx-auto max-w-3xl text-center">
            <span className="section-eyebrow">Como funciona</span>
            <h2 className="mt-4 text-slate-950">Uma entrada mais leve, clara e sem excesso</h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-slate-600">
              Primeiro você entende o contexto. Depois compara caminhos. Só então decide se quer seguir.
            </p>
          </motion.div>

          <div className="stagger-rise mt-12 grid gap-5 md:grid-cols-3">
            {[
              ['1. Conte o básico', 'Valor, renda e contexto em poucos passos.'],
              ['2. Veja caminhos possíveis', 'A leitura interna mostra opções antes de qualquer saída externa.'],
              ['3. Avance quando quiser', 'Você segue apenas se fizer sentido para o seu momento.']
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
            <h2 className="mt-4 text-slate-950">Escolha um ponto de partida mais próximo da sua realidade</h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-slate-600">
              Em vez de tentar tudo ao mesmo tempo, a experiência começa por contexto.
            </p>
          </motion.div>

          <div className="stagger-rise mt-12 grid gap-5 lg:grid-cols-3">
            {profileCards.map((item) => (
              <Link key={item.title} to={item.href}>
                <Card className="surface-card group h-full border-slate-200 bg-white">
                  <CardContent className="p-7">
                    <h3 className="text-slate-950 transition-colors group-hover:text-primary">{item.title}</h3>
                    <p className="mt-4 text-sm leading-7 text-slate-600">{item.description}</p>
                    <div className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-slate-900">
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
          <motion.div {...animationIn} className="premium-dark-panel rounded-[28px] px-8 py-10 text-white sm:px-12 sm:py-14">
            <span className="section-kicker border-white/15 bg-white/10 text-slate-100">Clareza e confiança</span>
            <h2 className="section-title-gradient mt-5 max-w-3xl">Você entende a análise antes de qualquer redirecionamento</h2>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-300">
              O valor da experiência está em explicar melhor o cenário antes da próxima etapa.
            </p>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {[
                'Sem pressão para decidir',
                'Sem cobrança antecipada',
                'Mais contexto antes de avançar'
              ].map((item) => (
                <div key={item} className="dark-glass-card rounded-[18px] px-5 py-5 text-sm text-slate-200">
                  {item}
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
              <motion.article key={item.title} {...animationIn} className="overflow-hidden rounded-[24px] border border-border bg-white shadow-[0_10px_24px_rgba(15,23,42,0.05)]">
                <img src={item.image} alt={item.alt} className="h-64 w-full object-cover" />
                <div className="p-7">
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
            className="mx-auto max-w-4xl rounded-[28px] border border-slate-200 bg-white px-7 py-8 shadow-[0_10px_24px_rgba(15,23,42,0.05)] sm:px-10 sm:py-10"
          >
            <div className="flex items-start gap-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <ShieldCheck className="h-6 w-6 text-slate-900" />
              </div>
              <div>
                <span className="section-eyebrow bg-slate-50">Nosso papel</span>
                <h2 className="mt-4 text-slate-950">A Cote Juros organiza o cenário com mais clareza</h2>
                <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">
                  A proposta é simplificar a leitura do contexto antes da próxima decisão.
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
            className="mx-auto max-w-4xl rounded-[28px] border border-slate-200 bg-white px-7 py-10 text-center shadow-[0_18px_40px_rgba(15,23,42,0.08)] sm:px-10 sm:py-12"
          >
            <span className="section-eyebrow border-sky-200 bg-sky-50 text-sky-700">Comece agora</span>
            <h2 className="mt-4 text-slate-950">Veja caminhos possíveis sem entrar em um fluxo pesado logo de início</h2>
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
