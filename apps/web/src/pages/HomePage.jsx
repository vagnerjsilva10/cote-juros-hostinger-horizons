import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle2, ChevronDown, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { QuickCreditFlowModal } from '@/components/QuickCreditFlowModal.jsx';
import { trackingService } from '@/platform/services/trackingService.js';

const animationIn = {
  initial: { opacity: 0, y: 18 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.35, ease: 'easeOut' }
};

const profileCards = [
  {
    title: 'Quero empréstimo pessoal',
    description: 'Veja caminhos para ganhar fôlego no orçamento ou tirar um plano do papel.',
    href: '/emprestimos'
  },
  {
    title: 'Estou com o nome negativado',
    description: 'Entenda quais opções ainda podem fazer sentido no seu momento.',
    href: '/emprestimo-para-negativado'
  },
  {
    title: 'Sou CLT',
    description: 'Veja opções que podem combinar com sua renda e seu perfil profissional.',
    href: '/emprestimo-para-clt'
  },
  {
    title: 'Sou autônomo',
    description: 'Descubra caminhos possíveis sem perder tempo em vários formulários.',
    href: '/emprestimo-para-autonomo'
  }
];

const trustItems = [
  'Sem compromisso',
  'Sem cobrança antecipada',
  'Você decide com calma',
  'Sem promessa de aprovação'
];

const faqItems = [
  {
    question: 'A Cote Juros faz empréstimo?',
    answer: 'Não. A Cote Juros não é banco e não libera dinheiro diretamente. Aqui você vê caminhos possíveis e segue para a próxima etapa se quiser.'
  },
  {
    question: 'Tem custo para usar?',
    answer: 'Não. Você pode começar sem cobrança antecipada.'
  },
  {
    question: 'A aprovação é garantida?',
    answer: 'Não. A decisão final depende do parceiro e do seu perfil.'
  },
  {
    question: 'Preciso fechar na hora?',
    answer: 'Não. Você pode ver as opções e decidir com calma.'
  }
];

function PlaceholderVisual({ name, accent = 'bg-primary/10' }) {
  return (
    <div className="relative overflow-hidden rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_24px_64px_rgba(15,23,42,0.08)]">
      <div className={`absolute -right-10 -top-10 h-40 w-40 rounded-full blur-3xl ${accent}`} />
      <div className="relative space-y-4">
        <div className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
          {name}
        </div>
        <div className="space-y-3 rounded-[22px] border border-slate-200 bg-slate-50 p-5">
          <div className="h-3 w-24 rounded-full bg-slate-200" />
          <div className="h-10 rounded-[16px] bg-white" />
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="h-20 rounded-[18px] bg-white" />
            <div className="h-20 rounded-[18px] bg-white" />
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="h-20 rounded-[18px] border border-slate-200 bg-white" />
          <div className="h-20 rounded-[18px] border border-slate-200 bg-white" />
          <div className="h-20 rounded-[18px] border border-slate-200 bg-white" />
        </div>
      </div>
    </div>
  );
}

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
      ctaLabel: 'Ver minhas opcoes agora',
      productType: 'loan'
    });
    setModalOpen(true);
  };

  return (
    <>
      <Helmet>
        <title>Cote Juros - Veja opções de crédito para o seu perfil</title>
        <meta
          name="description"
          content="Descubra agora quais opções de crédito podem fazer sentido para o seu perfil. Sem compromisso, sem cobrança antecipada e sem promessa falsa."
        />
        <meta name="verify-admitad" content="1ae3db0be4" />
        <link rel="canonical" href="https://cotejuros.com.br/" />
      </Helmet>

      <QuickCreditFlowModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        sourcePage="/"
        originLabel="home"
      />

      <section className="relative overflow-hidden border-b border-slate-200 bg-[linear-gradient(180deg,#f8fbff_0%,#ffffff_48%,#f7f9fc_100%)]">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-[-4rem] top-[-2rem] h-56 w-56 rounded-full bg-sky-200/45 blur-3xl" />
          <div className="absolute right-[-4rem] top-8 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute bottom-[-5rem] left-1/2 h-56 w-[36rem] -translate-x-1/2 rounded-full bg-slate-200/45 blur-3xl" />
        </div>

        <div className="page-shell relative py-16 sm:py-20 lg:py-24">
          <div className="grid items-center gap-12 lg:grid-cols-[1.02fr_0.98fr]">
            <motion.div {...animationIn} className="max-w-[640px]">
              <span className="inline-flex rounded-full border border-sky-200 bg-white/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-sky-700">
                Sem compromisso
              </span>
              <h1
                className="mt-5 text-[clamp(2.5rem,7vw,4.9rem)] font-bold leading-[0.98] tracking-[-0.055em] text-slate-950"
                style={{ fontFamily: '"Space Grotesk", "Manrope", sans-serif' }}
              >
                Veja opções de crédito que fazem sentido para o seu perfil
              </h1>
              <p className="mt-5 max-w-[36rem] text-base leading-8 text-slate-600 sm:text-lg">
                Responda algumas perguntas rápidas e descubra caminhos possíveis antes de decidir. Sem cobrança antecipada e sem promessa falsa.
              </p>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Button
                  size="lg"
                  className="h-12 rounded-[14px] bg-slate-950 px-6 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(15,23,42,0.22)] transition-all duration-200 hover:bg-slate-800"
                  onClick={openPrimaryFlow}
                >
                  Ver minhas opções agora
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <a href="#como-funciona">
                  <Button size="lg" variant="outline" className="h-12 rounded-[14px] border-slate-300 px-6 text-sm font-semibold">
                    Entender como funciona
                  </Button>
                </a>
              </div>

              <div className="mt-7 flex flex-wrap gap-3">
                {['Sem compromisso', 'Sem cobrança antecipada', 'Você decide com calma'].map((item) => (
                  <div key={item} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-[0_6px_16px_rgba(15,23,42,0.04)]">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    {item}
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div {...animationIn}>
              <PlaceholderVisual name="hero-credit-comparison-placeholder" accent="bg-sky-200/50" />
            </motion.div>
          </div>
        </div>
      </section>

      <section id="como-funciona" className="border-b border-slate-200 bg-white py-18 sm:py-20">
        <div className="page-shell">
          <motion.div {...animationIn} className="mx-auto max-w-3xl text-center">
            <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
              Como funciona
            </span>
            <h2 className="mt-4 text-[clamp(2rem,4vw,3.2rem)] font-semibold tracking-[-0.04em] text-slate-950">
              Funciona de forma simples
            </h2>
            <p className="mt-4 text-base leading-8 text-slate-600 sm:text-lg">
              Você conta o básico sobre o que precisa. A gente mostra caminhos possíveis. Se fizer sentido, você segue para a próxima etapa.
            </p>
          </motion.div>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {[
              ['1. Conte o básico', 'Valor, renda, trabalho e algumas informações simples para começar.'],
              ['2. Veja caminhos possíveis', 'Mostramos opções que podem combinar melhor com o seu momento.'],
              ['3. Decida com calma', 'Se quiser seguir, você avança para a próxima etapa sem pressão.']
            ].map(([title, description]) => (
              <motion.div key={title} {...animationIn}>
                <Card className="h-full rounded-[24px] border-slate-200 bg-white shadow-[0_18px_40px_rgba(15,23,42,0.05)]">
                  <CardContent className="p-7">
                    <h3 className="text-xl font-semibold tracking-[-0.03em] text-slate-950">{title}</h3>
                    <p className="mt-3 text-sm leading-7 text-slate-600">{description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-slate-50/70 py-18 sm:py-20">
        <div className="page-shell">
          <div className="grid items-center gap-10 lg:grid-cols-[0.9fr_1.1fr]">
            <motion.div {...animationIn}>
              <PlaceholderVisual name="profile-section-placeholder" accent="bg-primary/12" />
            </motion.div>

            <motion.div {...animationIn}>
              <span className="inline-flex rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                Seu momento
              </span>
              <h2 className="mt-4 text-[clamp(2rem,4vw,3rem)] font-semibold tracking-[-0.04em] text-slate-950">
                Escolha o caminho que mais combina com você
              </h2>
              <p className="mt-4 max-w-2xl text-base leading-8 text-slate-600">
                Não precisa tentar tudo ao mesmo tempo. Comece pelo caminho que parece mais próximo da sua realidade.
              </p>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                {profileCards.map((item) => (
                  <Link key={item.title} to={item.href}>
                    <Card className="h-full rounded-[22px] border-slate-200 bg-white transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_18px_36px_rgba(15,23,42,0.08)]">
                      <CardContent className="p-6">
                        <h3 className="text-lg font-semibold tracking-[-0.02em] text-slate-950">{item.title}</h3>
                        <p className="mt-2 text-sm leading-7 text-slate-600">{item.description}</p>
                        <div className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-slate-900">
                          Continuar
                          <ArrowRight className="h-4 w-4" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-white py-18 sm:py-20">
        <div className="page-shell">
          <div className="grid items-center gap-10 lg:grid-cols-[1.02fr_0.98fr]">
            <motion.div {...animationIn}>
              <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                Confiança
              </span>
              <h2 className="mt-4 text-[clamp(2rem,4vw,3rem)] font-semibold tracking-[-0.04em] text-slate-950">
                Clareza antes de qualquer decisão
              </h2>
              <p className="mt-4 max-w-2xl text-base leading-8 text-slate-600">
                Aqui o foco é ajudar você a entender os caminhos possíveis com mais calma, sem criar expectativa errada.
              </p>

              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                {trustItems.map((item) => (
                  <div key={item} className="flex items-start gap-3 rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-4">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-600" />
                    <p className="text-sm leading-7 text-slate-700">{item}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div {...animationIn}>
              <PlaceholderVisual name="trust-section-placeholder" accent="bg-emerald-200/45" />
            </motion.div>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-slate-50/70 py-18 sm:py-20">
        <div className="page-shell">
          <motion.div {...animationIn} className="mx-auto max-w-4xl rounded-[28px] border border-slate-200 bg-white px-7 py-8 shadow-[0_20px_50px_rgba(15,23,42,0.05)] sm:px-10 sm:py-10">
            <div className="flex items-start gap-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <ShieldCheck className="h-6 w-6 text-slate-900" />
              </div>
              <div>
                <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Nosso papel
                </span>
                <h2 className="mt-4 text-[clamp(1.8rem,3.5vw,2.6rem)] font-semibold tracking-[-0.04em] text-slate-950">
                  O nosso papel é te ajudar a encontrar opções
                </h2>
                <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">
                  A Cote Juros não é banco e não libera dinheiro diretamente. A gente ajuda você a encontrar caminhos possíveis e seguir para a próxima etapa com mais clareza.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-white py-18 sm:py-20">
        <div className="page-shell">
          <motion.div {...animationIn} className="mx-auto max-w-3xl text-center">
            <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
              Perguntas frequentes
            </span>
            <h2 className="mt-4 text-[clamp(2rem,4vw,3rem)] font-semibold tracking-[-0.04em] text-slate-950">
              O que você precisa saber antes de começar
            </h2>
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

      <section className="bg-[linear-gradient(180deg,#f8fafc_0%,#eef4ff_100%)] py-18 sm:py-20">
        <div className="page-shell">
          <motion.div {...animationIn} className="mx-auto max-w-4xl rounded-[30px] border border-slate-200 bg-white px-7 py-10 text-center shadow-[0_24px_70px_rgba(15,23,42,0.08)] sm:px-10 sm:py-12">
            <span className="inline-flex rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-sky-700">
              Comece agora
            </span>
            <h2 className="mt-4 text-[clamp(2rem,4vw,3.1rem)] font-semibold tracking-[-0.04em] text-slate-950">
              Descubra agora quais caminhos podem fazer sentido para você
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-8 text-slate-600">
              Leva pouco tempo para começar e entender melhor quais opções podem combinar com o seu perfil.
            </p>
            <div className="mt-8 flex justify-center">
              <Button
                size="lg"
                className="h-12 rounded-[14px] bg-slate-950 px-7 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(15,23,42,0.22)] transition-all duration-200 hover:bg-slate-800"
                onClick={openPrimaryFlow}
              >
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
