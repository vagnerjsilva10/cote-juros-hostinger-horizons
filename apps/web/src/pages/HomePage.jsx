import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  BadgeCheck,
  Banknote,
  BarChart3,
  Bike,
  BookOpenText,
  Car,
  CreditCard,
  FileCheck2,
  Gauge,
  HeartPulse,
  Home,
  Landmark,
  LockKeyhole,
  PieChart,
  Plane,
  ShieldCheck,
  Sparkles,
  Timer,
  TrendingUp,
  WalletCards
} from 'lucide-react';
import SeoHead from '@/components/SeoHead.jsx';
import SmartQuiz from '@/components/smart-quiz/SmartQuiz.jsx';
import { trackingService } from '@/platform/services/trackingService.js';
import { brandPages, createOrganizationSchema, createWebSiteSchema } from '@/seo/brandSeo.js';

const reveal = {
  initial: { opacity: 0, y: 18 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.14 },
  transition: { duration: 0.42, ease: [0.4, 0, 0.2, 1] }
};

const trustItems = [
  { label: 'Sem cobrança antecipada', icon: Banknote },
  { label: 'Comparação gratuita', icon: BadgeCheck },
  { label: 'Você decide no seu ritmo', icon: Timer }
];

const homeTrustStripItems = [
  { title: 'Sem promessa falsa', text: 'A aprovação depende dos parceiros.', icon: FileCheck2 },
  { title: 'Sem taxa antecipada', text: 'Comece a comparação gratuitamente.', icon: Banknote },
  { title: 'Dados com finalidade clara', text: 'Usados para organizar sua análise.', icon: LockKeyhole }
];

const insuranceStackItems = [
  { label: 'Seguro auto', icon: Car },
  { label: 'Seguro moto', icon: Bike },
  { label: 'Seguro vida', icon: HeartPulse },
  { label: 'Seguro viagem', icon: Plane }
];

const steps = [
  {
    icon: FileCheck2,
    title: 'Informe seu momento',
    text: 'Valor, renda, objetivo e restrições entram na leitura inicial.'
  },
  {
    icon: Gauge,
    title: 'Receba uma leitura clara',
    text: 'O radar organiza caminhos possíveis antes de qualquer decisão.'
  },
  {
    icon: ShieldCheck,
    title: 'Avance só se fizer sentido',
    text: 'Você compara e segue apenas quando a próxima etapa combina com seu perfil.'
  }
];

const productCards = [
  { icon: Banknote, label: 'Empréstimos', href: '/emprestimos', stat: 'pessoal, CLT, autônomo' },
  { icon: CreditCard, label: 'Cartões', href: '/cartoes', stat: 'limite, anuidade, benefícios' },
  { icon: Home, label: 'Financiamento', href: '/financiamento', stat: 'entrada, prazo, parcela' },
  { icon: Car, label: 'Seguros', href: '/seguros', stat: 'auto, moto, vida, viagem' }
];

const categories = [
  ['Negativado', '/emprestimo-para-negativado'],
  ['CLT', '/emprestimo-para-clt'],
  ['Autônomo', '/emprestimo-para-autonomo'],
  ['Comparar bancos', '/bancos'],
  ['Calculadora CET', '/calculadora-cet'],
  ['Diagnóstico', '/diagnostico-financeiro']
];

const blogPreview = [
  ['Como comparar taxas de juros', '/blog/como-comparar-taxas-de-juros'],
  ['Score de crédito: como funciona', '/blog/score-de-credito-como-funciona'],
  ['Financiamento sem entrada vale a pena?', '/blog/financiamento-sem-entrada-vale-a-pena']
];

function DashboardPreview() {
  return (
    <div className="cj-home-dashboard" aria-label="Preview do radar financeiro Cote Juros">
      <div className="cj-home-dashboard-top">
        <div>
          <span>Radar Cote Juros</span>
          <strong>Análise do perfil</strong>
        </div>
        <div className="cj-home-dashboard-score">
          <span>Match</span>
          <strong>87%</strong>
        </div>
      </div>

      <div className="cj-home-dashboard-grid">
        <div className="cj-home-kpi">
          <span>Valor buscado</span>
          <strong>R$ 12.000</strong>
        </div>
        <div className="cj-home-kpi">
          <span>Prazo ideal</span>
          <strong>18 meses</strong>
        </div>
      </div>

      <div className="cj-home-chart">
        {[42, 68, 55, 84, 72, 94].map((height, index) => (
          <span key={height} style={{ height: `${height}%`, animationDelay: `${index * 90}ms` }} />
        ))}
      </div>

      <div className="cj-home-dashboard-list">
        {[
          ['Crédito pessoal', 'Boa compatibilidade'],
          ['Cartão sem anuidade', 'Pode complementar'],
          ['Seguro auto', 'Cotação disponível']
        ].map(([label, value]) => (
          <div key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

function SectionHeading({ eyebrow, title, text, align = 'left' }) {
  return (
    <motion.div {...reveal} className={`cj-home-section-heading cj-home-section-heading-${align}`}>
      <span>{eyebrow}</span>
      <h2>{title}</h2>
      {text ? <p>{text}</p> : null}
    </motion.div>
  );
}

function HomePage() {
  const location = useLocation();
  const [quizResult, setQuizResult] = useState(null);

  useEffect(() => {
    if (!location.hash) return;
    const target = document.getElementById(location.hash.replace('#', ''));
    const timeoutId = window.setTimeout(() => target?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 180);
    return () => window.clearTimeout(timeoutId);
  }, [location.hash]);

  const trackHomeCta = (ctaId, ctaLabel) => {
    trackingService.trackCtaClick({
      sourcePage: '/',
      ctaId,
      ctaLabel,
      productType: 'loan'
    });
  };

  return (
    <>
      <SeoHead
        title={brandPages.home.title}
        description={brandPages.home.description}
        path={brandPages.home.path}
        structuredData={[createOrganizationSchema(), createWebSiteSchema()]}
      >
        <meta name="verify-admitad" content="1ae3db0be4" />
      </SeoHead>

      <div className="cj-home-v2">
        <section id="home-hero" className="cj-home-hero">
          <div className="cj-home-shell cj-home-hero-grid">
            <motion.div {...reveal} className="cj-home-hero-copy">
              <div className="cj-home-logo-text">
                <span>CJ</span>
                <strong>Cote Juros</strong>
              </div>
              <span className="cj-home-eyebrow">
                <Sparkles className="h-4 w-4" />
                Plataforma inteligente de comparação financeira
              </span>
              <h1>
                Compare crédito, cartões e seguros com <span>clareza antes de contratar</span>
              </h1>
              <p>
                A Cote Juros organiza seu perfil, objetivo e momento financeiro em uma leitura simples para você escolher o próximo passo com mais segurança.
              </p>
              <div className="cj-home-actions">
                <a href="#smart-quiz" className="cj-home-primary-btn" onClick={() => trackHomeCta('home_hero_quiz', 'Começar meu radar')}>
                  Começar meu radar
                  <ArrowRight className="h-4 w-4" />
                </a>
                <Link to="/comparar" className="cj-home-secondary-btn" onClick={() => trackHomeCta('home_hero_compare', 'Ver comparador')}>
                  Ver comparador
                </Link>
              </div>
              <div className="cj-home-hero-meta">
                {trustItems.map(({ label, icon: Icon }) => (
                  <span key={label}>
                    <Icon className="h-4 w-4" />
                    {label}
                  </span>
                ))}
              </div>
            </motion.div>

            <motion.div {...reveal} className="cj-home-dashboard-wrap">
              <div className="cj-home-float-card cj-home-float-left">
                <WalletCards className="h-4 w-4" />
                <strong>4 produtos</strong>
                <span>em um radar</span>
              </div>
              <div className="cj-home-float-card cj-home-float-right">
                <TrendingUp className="h-4 w-4" />
                <strong>Custo real</strong>
                <span>em foco</span>
              </div>
              <DashboardPreview />
            </motion.div>
          </div>
        </section>

        <section className="cj-home-trust-strip">
          <div className="cj-home-shell">
            {homeTrustStripItems.map(({ title, text, icon: Icon }) => (
              <div key={title}>
                <Icon className="h-5 w-5" />
                <strong>{title}</strong>
                <span>{text}</span>
              </div>
            ))}
          </div>
        </section>

        <section id="como-funciona" className="cj-home-section cj-home-light">
          <div className="cj-home-shell">
            <SectionHeading
              eyebrow="Como funciona"
              title="Um fluxo curto para transformar dúvida em comparação"
              text="Você não precisa sair preenchendo formulários longos antes de entender o que pode fazer sentido."
              align="center"
            />
            <div className="cj-home-steps">
              {steps.map((step) => {
                const Icon = step.icon;
                return (
                  <motion.div key={step.title} {...reveal} className="cj-home-step-card">
                    <Icon className="h-6 w-6" />
                    <h3>{step.title}</h3>
                    <p>{step.text}</p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        <section id="smart-quiz" className="cj-home-section cj-home-quiz-section">
          <div className="cj-home-shell">
            <SectionHeading
              eyebrow="SmartQuiz conectado"
              title="Descubra qual caminho combina melhor com seu momento financeiro"
              text="O quiz usa os adapters já preparados para recomendar, registrar eventos e manter a experiência API-ready."
            />
            <SmartQuiz onCompleted={setQuizResult} />
          </div>
        </section>

        <section className="cj-home-section cj-home-radar-preview">
          <div className="cj-home-shell cj-home-split">
            <SectionHeading
              eyebrow="Radar de crédito"
              title="Seu resultado vira uma visão prática para decidir"
              text="Depois do quiz, o dashboard organiza compatibilidade, próximos passos e produtos secundários em uma leitura única."
            />
            <motion.div {...reveal} className="cj-home-radar-card">
              <div className="cj-home-radar-score">
                <PieChart className="h-6 w-6" />
                <span>{quizResult ? 'Resultado do quiz' : 'Preview do radar'}</span>
                <strong>{quizResult?.score || 82}</strong>
              </div>
              <div className="cj-home-radar-lines">
                {(quizResult?.secondaryProducts || ['Empréstimo pessoal', 'Cartão sem anuidade', 'Seguro auto']).slice(0, 3).map((item, index) => (
                  <div key={item}>
                    <span>{item}</span>
                    <i style={{ width: `${86 - index * 13}%` }} />
                  </div>
                ))}
              </div>
              <Link to="/dashboard" className="cj-home-inline-link">
                Ver dashboard do cliente
                <ArrowRight className="h-4 w-4" />
              </Link>
            </motion.div>
          </div>
        </section>

        <section className="cj-home-section cj-home-light">
          <div className="cj-home-shell">
            <SectionHeading
              eyebrow="Comparação de produtos"
              title="Crédito, cartão, financiamento e seguros no mesmo ecossistema"
              text="Escolha um ponto de partida ou use o radar para ver o caminho mais coerente."
              align="center"
            />
            <div className="cj-home-product-grid">
              {productCards.map((product) => {
                const Icon = product.icon;
                return (
                  <Link key={product.label} to={product.href} className="cj-home-product-card">
                    <Icon className="h-6 w-6" />
                    <h3>{product.label}</h3>
                    <p>{product.stat}</p>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        <section className="cj-home-section cj-home-categories">
          <div className="cj-home-shell cj-home-split">
            <SectionHeading
              eyebrow="Categorias"
              title="Atalhos para comparar pelo seu perfil"
              text="Perfis diferentes pedem leituras diferentes. Estes atalhos mantêm as rotas existentes funcionando."
            />
            <div className="cj-home-category-list">
              {categories.map(([label, href]) => (
                <Link key={label} to={href}>
                  {label}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="cj-home-section cj-home-insurance">
          <div className="cj-home-shell cj-home-split">
            <motion.div {...reveal} className="cj-home-insurance-panel">
              <HeartPulse className="h-7 w-7" />
              <h2>Seguros também entram no radar</h2>
              <p>Compare coberturas possíveis para auto, moto, vida e viagem sem misturar promessa com contratação.</p>
              <Link to="/seguros" className="cj-home-primary-btn">
                Comparar seguros
                <ArrowRight className="h-4 w-4" />
              </Link>
            </motion.div>
            <motion.div {...reveal} className="cj-home-insurance-stack">
              {insuranceStackItems.map(({ label, icon: Icon }) => (
                <div key={label}>
                  <Icon className="h-5 w-5" />
                  <span>{label}</span>
                </div>
              ))}
            </motion.div>
          </div>
        </section>

        <section className="cj-home-section cj-home-light">
          <div className="cj-home-shell cj-home-split">
            <SectionHeading
              eyebrow="Blog preview"
              title="Conteúdo para decidir com menos impulso"
              text="Guias rápidos ajudam você a entender taxa, score, prazo e custo antes de seguir."
            />
            <div className="cj-home-blog-list">
              {blogPreview.map(([title, href]) => (
                <Link key={title} to={href}>
                  <BookOpenText className="h-5 w-5" />
                  <span>{title}</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="cj-home-section cj-home-compliance">
          <div className="cj-home-shell cj-home-compliance-grid">
            <div>
              <Landmark className="h-6 w-6" />
              <h2>Compliance claro desde a Home</h2>
              <p>
                A Cote Juros não é banco, não concede crédito diretamente, não garante aprovação e não cobra valor antecipado. A análise final, contratação e condições dependem dos parceiros.
              </p>
            </div>
            <div>
              <LockKeyhole className="h-6 w-6" />
              <h2>Dados com uso responsável</h2>
              <p>
                As informações preenchidas servem para montar uma leitura de perfil, registrar eventos da jornada e encaminhar possibilidades quando fizer sentido.
              </p>
            </div>
          </div>
        </section>

        <section id="final-cta" className="cj-home-final-cta">
          <div className="cj-home-shell">
            <motion.div {...reveal} className="cj-home-final-card">
              <BarChart3 className="h-8 w-8" />
              <h2>Comece pelo radar e compare antes de fechar qualquer contrato</h2>
              <p>Veja caminhos possíveis com uma leitura mais clara, sem pressão para avançar.</p>
              <a href="#smart-quiz" className="cj-home-primary-btn" onClick={() => trackHomeCta('home_final_quiz', 'Ver minhas opções agora')}>
                Ver minhas opções agora
                <ArrowRight className="h-4 w-4" />
              </a>
            </motion.div>
          </div>
        </section>
      </div>
    </>
  );
}

export default HomePage;
