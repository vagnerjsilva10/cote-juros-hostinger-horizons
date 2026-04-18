import React, { useState } from 'react';
import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  ChevronDown,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
  TrendingUp
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import HeroComparisonCard from '@/components/HeroComparisonCard.jsx';
import QuickCreditFlowModal from '@/components/QuickCreditFlowModal.jsx';
import SeoHead from '@/components/SeoHead.jsx';
import { trackingService } from '@/platform/services/trackingService.js';
import { normalizeMojibake, normalizeMojibakeDeep } from '@/lib/textEncoding.js';
import { brandPages, createOrganizationSchema, createWebSiteSchema } from '@/seo/brandSeo.js';

const animationIn = {
  initial: { opacity: 0, y: 18 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.16 },
  transition: { duration: 0.46, ease: [0.4, 0, 0.2, 1] }
};

const marketBrands = ['Banco PAN', 'C6 Bank', 'Nubank', 'Banco Inter', 'Santander', 'SuperSim'];
const editorialFeature = normalizeMojibakeDeep({
  tag: 'Comparação real'
});

const featureCards = normalizeMojibakeDeep([
  {
    title: 'Conte o básico',
    description: 'Informe valor, renda e perfil para começar a comparação com mais clareza.',
    metric: '01',
    bars: [42, 64, 86]
  },
  {
    title: 'Compare com calma',
    description: 'Veja caminhos possíveis antes de aceitar qualquer proposta.',
    metric: '02',
    bars: [78, 52, 68]
  },
  {
    title: 'Avance se fizer sentido',
    description: 'Você só segue quando a escolha combinar com o seu momento.',
    metric: '03',
    bars: [38, 58, 92]
  }
]);

const profileCards = normalizeMojibakeDeep([
  {
    title: 'Está com o nome negativado?',
    description: 'Veja por onde pode valer a pena começar antes de fechar qualquer contrato.',
    tag: 'Perfil'
  },
  {
    title: 'Tem renda fixa?',
    description: 'Compare condições com mais clareza antes de assumir parcelas.',
    tag: 'Renda'
  },
  {
    title: 'Autônomo?',
    description: 'Entenda caminhos possíveis para o seu perfil antes de tomar a decisão.',
    tag: 'Autônomo'
  }
]);

const credibilityBlocks = normalizeMojibakeDeep([
  {
    icon: ShieldCheck,
    title: 'Compare opções com mais clareza',
    description: 'A CoteJuros ajuda você a entender condições e custo antes de contratar.'
  },
  {
    icon: TrendingUp,
    title: 'Decida no seu ritmo',
    description: 'Você analisa com mais calma e avança só no que fizer sentido para o seu momento.'
  }
]);

const faqItems = normalizeMojibakeDeep([
  {
    question: 'Preciso pagar algo para começar?',
    answer: 'Não. Você pode começar sem compromisso e sem cobrança antecipada.'
  },
  {
    question: 'Isso garante aprovação?',
    answer: 'Não. A decisão final depende da instituição que analisa o seu perfil.'
  },
  {
    question: 'Preciso decidir na hora?',
    answer: 'Não. Você compara com mais calma e decide depois.'
  },
  {
    question: 'A CoteJuros empresta dinheiro?',
    answer: 'Não. A CoteJuros mostra caminhos possíveis para você comparar antes de contratar.'
  }
]);

function FaqItem({ item, isOpen, onToggle }) {
  return (
    <div className="faq-item">
      <button type="button" onClick={onToggle} className="faq-trigger flex w-full items-center justify-between gap-4 text-left">
        <span>{item.question}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-slate-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      <div className={`grid transition-[grid-template-rows,opacity] duration-300 ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
        <div className="overflow-hidden">
          <div className="faq-content">{item.answer}</div>
        </div>
      </div>
    </div>
  );
}

function HomePage() {
  const location = useLocation();
  const [modalOpen, setModalOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);
  const t = normalizeMojibake;

  useEffect(() => {
    if (!location.hash) return;

    const id = location.hash.replace('#', '');
    const target = document.getElementById(id);
    if (!target) return;

    const timeoutId = window.setTimeout(() => {
      target.scrollIntoView({ behavior: 'auto', block: 'start' });
    }, 220);

    return () => window.clearTimeout(timeoutId);
  }, [location.hash]);

  const focusHeroPreview = () => {
    trackingService.trackCtaClick({
      sourcePage: '/',
      ctaId: 'home_hero_focus_cta',
      ctaLabel: t('Ver minhas opções agora'),
      productType: 'loan'
    });

    const previewElement = document.getElementById('hero-credit-preview');
    previewElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });

    window.setTimeout(() => {
      if (previewElement instanceof HTMLElement) {
        previewElement.setAttribute('tabindex', '-1');
        previewElement.focus({ preventScroll: true });
      }
    }, 220);
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

      <QuickCreditFlowModal isOpen={modalOpen} onClose={() => setModalOpen(false)} sourcePage="/" originLabel="home" />

      <section id="home-hero" className="hero-section">
        <div className="hero-ambient-grid" aria-hidden="true" />
        <div className="hero-ambient-orb hero-ambient-orb-one" aria-hidden="true" />
        <div className="hero-ambient-orb hero-ambient-orb-two" aria-hidden="true" />

        <div className="page-shell">
          <div className="hero-grid">
            <motion.div {...animationIn} className="hero-copy">
              <span className="hero-eyebrow">
                <Sparkles className="h-3.5 w-3.5" />
                {t('Grátis para comparar. Sem cobrança antecipada.')}
              </span>

              <h1 className="hero-title hero-heading heading-hero">
                {t('Compare ')}
                <span className="highlight">{t('crédito')}</span>
                {t(' com mais clareza antes de contratar')}
              </h1>

              <p className="hero-subtitle hero-subcopy">
                {t('A CoteJuros ajuda você a comparar empréstimo, cartão e financiamento com mais segurança, praticidade e sem pressão para fechar.')}
              </p>

              <div className="hero-data-rail" aria-hidden="true">
                <span>perfil</span>
                <i />
                <span>{t('condições')}</span>
                <i />
                <span>{t('decisão')}</span>
              </div>

              <div className="hero-actions">
                <a href="#hero-credit-preview" className="hero-primary-btn" onClick={focusHeroPreview}>
                  {t('Ver minhas opções agora')}
                  <ArrowRight className="h-4 w-4" />
                </a>
                <Link to="/como-funciona" className="hero-secondary-btn">
                  Entender como funciona
                </Link>
              </div>

              <div className="hero-trust">
                {normalizeMojibakeDeep(['Sem compromisso para começar', 'Sem cobrança antecipada', 'Você decide no seu ritmo']).map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-[var(--brand-2)]" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div {...animationIn} className="hero-product-wrap">
              <HeroComparisonCard />
            </motion.div>
          </div>
        </div>
      </section>

      <section className="signal-strip-section">
        <div className="page-shell">
          <motion.div {...animationIn} className="signal-strip">
            <span>{t('Comparação no radar')}</span>
            <div className="signal-strip-track">
              {marketBrands.map((brand) => (
                <div key={brand} className="signal-pill">
                  <span className="signal-dot" />
                  {brand}
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <section id="como-funciona" className="section section--compact art-section art-section-white">
        <div className="page-shell">
          <motion.div {...animationIn} className="section-heading-left">
            <h2 className="section-title">{t('Primeiro você compara. Depois decide se vale seguir.')}</h2>
            <p className="section-subtitle">
              {t('A CoteJuros organiza valor, perfil e custo para você entender por onde vale a pena começar.')}
            </p>
          </motion.div>

          <div className="steps-grid">
            {featureCards.map((item, index) => (
              <motion.div key={item.title} {...animationIn}>
                <Card className={`card art-card art-card-${index + 1}`}>
                  <CardContent className="p-0">
                    <div className="art-card-topline">
                      <span>{item.metric}</span>
                      <BadgeCheck className="h-4 w-4" />
                    </div>
                    <div className="art-card-visual" aria-hidden="true">
                      {item.bars.map((bar) => (
                        <span key={bar} style={{ height: `${bar}%` }} />
                      ))}
                    </div>
                    <h3 className="card-title">{item.title}</h3>
                    <p className="card-text">{item.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section id="experiencia-real" className="editorial-people-section">
        <div className="section-connector section-connector-top" aria-hidden="true" />
        <div className="page-shell">
          <motion.div {...animationIn} className="editorial-split editorial-people-grid">
            <div className="editorial-copy editorial-people-copy">
              <span className="eyebrow">{t('Experiência real')}</span>
              <h2>{t('Crédito não é só taxa. É contexto, momento e escolha.')}</h2>
              <p>
                {t('A CoteJuros ajuda você a comparar com mais clareza para entender o que faz sentido hoje, no seu perfil e no seu orçamento.')}
              </p>
            </div>

            <div className="editorial-media" aria-label="Comparação de crédito organizada em uma tela de notebook">
              <div className="editorial-visual-panel experience-panel" aria-hidden="true">
                <div className="experience-grid" />
                <div className="experience-sheen" />

                <div className="editorial-browser-bar experience-window-bar">
                  <span />
                  <span />
                  <span />
                </div>

                <div className="experience-card experience-card-primary">
                  <span className="experience-label">{t('valor desejado')}</span>
                  <strong>R$ 12.000</strong>
                  <div className="experience-progress">
                    <div className="experience-progress-fill" />
                  </div>
                </div>

                <div className="experience-card experience-card-profile">
                  <span className="experience-label">{t('perfil')}</span>
                  <strong>claro</strong>
                </div>

                <div className="experience-card experience-card-cost">
                  <span className="experience-label">{t('custo')}</span>
                  <strong>visível</strong>
                </div>

                <div className="experience-mini-bars">
                  <span className="experience-bar experience-bar-1" />
                  <span className="experience-bar experience-bar-2" />
                  <span className="experience-bar experience-bar-3" />
                </div>

                <div className="experience-chart">
                  <div className="experience-chart-surface" />
                  <svg className="experience-chart-svg" viewBox="0 0 640 220" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="experienceLine" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#8E96FF" />
                        <stop offset="55%" stopColor="#6676FF" />
                        <stop offset="100%" stopColor="#4F61F6" />
                      </linearGradient>
                      <linearGradient id="experienceArea" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="rgba(107, 120, 255, 0.18)" />
                        <stop offset="100%" stopColor="rgba(107, 120, 255, 0)" />
                      </linearGradient>
                      <filter id="experienceGlow" x="-30%" y="-80%" width="160%" height="260%">
                        <feGaussianBlur stdDeviation="8" result="blur" />
                        <feMerge>
                          <feMergeNode in="blur" />
                          <feMergeNode in="SourceGraphic" />
                        </feMerge>
                      </filter>
                    </defs>
                    <path
                      className="experience-chart-area"
                      d="M30,182 C94,182 130,156 194,142 C264,126 320,100 388,84 C454,68 520,70 610,54 L610,214 L30,214 Z"
                    />
                    <path
                      className="experience-chart-line-glow"
                      d="M30,182 C94,182 130,156 194,142 C264,126 320,100 388,84 C454,68 520,70 610,54"
                      fill="none"
                    />
                    <path
                      className="experience-chart-line"
                      d="M30,182 C94,182 130,156 194,142 C264,126 320,100 388,84 C454,68 520,70 610,54"
                      fill="none"
                      stroke="url(#experienceLine)"
                      strokeWidth="5.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <line className="experience-chart-guide" x1="610" y1="54" x2="610" y2="196" />
                    <circle className="experience-chart-dot-halo" cx="610" cy="54" r="13" />
                    <circle className="experience-chart-dot" cx="610" cy="54" r="6.5" />
                  </svg>
                </div>

                <div className="experience-floating-badge">
                  <span className="experience-floating-dot" />
                  {editorialFeature.tag}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="section section--compact art-section art-section-soft">
        <div className="page-shell">
          <motion.div {...animationIn} className="section-heading-left">
            <h2 className="section-title">{t('Escolha um ponto de partida para comparar com mais precisão')}</h2>
            <p className="section-subtitle">
              {t('Cada perfil pede uma leitura diferente. O importante é entender seu ponto de partida antes de contratar.')}
            </p>
          </motion.div>

          <div className="feature-grid">
            {profileCards.map((item, index) => (
              <motion.div key={item.title} {...animationIn}>
                <Card className="card profile-card">
                  <CardContent className="p-0">
                    <div className="profile-card-tag">{item.tag}</div>
                    <div className="profile-card-glow" aria-hidden="true" />
                    <h3 className="card-title">{item.title}</h3>
                    <p className="card-text">{item.description}</p>
                    <div className="profile-card-meter" aria-hidden="true">
                      <span style={{ width: `${52 + index * 14}%` }} />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="insight-section">
        <div className="section-connector section-connector-soft" aria-hidden="true" />
        <div className="page-shell">
          <motion.div {...animationIn} className="visual-reading-section">
            <div className="main-copy-card">
              <span className="eyebrow">{t('Mais clareza')}</span>
              <h2 className="block-title">{t('Compare crédito com uma leitura mais simples')}</h2>
              <p>
                {t('A proposta não é empurrar contrato. É organizar valor, renda, perfil e próximos passos para você enxergar melhor antes de decidir.')}
              </p>
            </div>

            <div className="widget-card conditions-widget" aria-hidden="true">
              <div className="conditions-widget-header">
                <span>{t('Condições')}</span>
                <span>{t('Simulação')}</span>
              </div>
              <div className="conditions-visual">
                <div className="conditions-axis" />
                <div className="conditions-curve" />
                <div className="mini-bars">
                  <span />
                  <span />
                  <span />
                  <span />
                </div>
              </div>
              <div className="conditions-widget-score">
                <strong>R$ 12.000</strong>
                <span>valor desejado</span>
              </div>
            </div>

            <div className="mini-side-stack">
              <div className="card">
                <LockKeyhole className="h-5 w-5 text-[var(--brand-primary)]" />
                <strong>{t('Sem cobrança antecipada')}</strong>
                <span>{t('Você compara antes de avançar.')}</span>
              </div>

              <div className="card card-dark custo-real-card">
                <TrendingUp className="h-5 w-5 text-[var(--brand-3)]" />
                <strong>{t('Custo real em foco')}</strong>
                <span>{t('Menos impulso, mais contexto.')}</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section id="dark-section-proof" className="dark-panel-section">
        <div className="section-connector section-connector-dark" aria-hidden="true" />
        <div className="page-shell">
          <motion.div {...animationIn} className="dark-panel">
            <div className="dark-panel-copy">
              <h2>
                {t('Entender o crédito antes')}
                <br />
                {t('de contratar muda a decisão')}
              </h2>
              <p>
                {t('Quando você compara com calma, fica mais fácil separar o que realmente vale a pena do que só parece bom.')}
              </p>

              <div className="dark-checklist">
                {[
                  'Compare antes de decidir',
                  'Entenda o custo real',
                  'Evite decisões no impulso',
                  'Escolha com mais segurança'
                ].map((item) => (
                  <div key={item} className="item">
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="dark-chart-card">
              <div className="mb-4 flex items-end justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/[0.58]">{t('Visão de comparação')}</p>
                  <h3 className="mt-2 text-[16px] font-medium text-white">{t('Do impulso à decisão')}</h3>
                </div>
                <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] text-white/70">
                  Em poucos minutos
                </div>
              </div>

              <div className="grid grid-cols-4 gap-3">
                {[32, 54, 76, 96].map((height, index) => (
                  <div key={height} className="space-y-2">
                    <div className="dark-chart-bar-shell">
                      <div className="dark-chart-bar" style={{ height: `${height}%`, animationDelay: `${index * 120}ms` }} />
                    </div>
                    <div className="text-center text-[11px] text-white/[0.58]">{normalizeMojibakeDeep(['Início','Leitura','Comparação','Decisão'])[index]}</div>
                  </div>
                ))}
              </div>

              <div className="mt-4 rounded-[18px] border border-white/[0.08] bg-white/[0.04] p-4">
                <svg viewBox="0 0 320 120" className="w-full overflow-visible">
                  <defs>
                    <linearGradient id="homeDarkLine" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#5B6CFF" />
                      <stop offset="100%" stopColor="#9AA8FF" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M10 94 C 68 86, 94 72, 128 64 S 204 32, 240 36 S 292 20, 310 20"
                    fill="none"
                    stroke="url(#homeDarkLine)"
                    strokeWidth="4"
                    strokeLinecap="round"
                    className="chart-draw"
                  />
                  <circle cx="310" cy="20" r="5" fill="#9AA8FF" className="chart-pulse" />
                </svg>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="section section--compact art-section art-section-white">
        <div className="page-shell">
          <motion.div {...animationIn} className="section-heading-center">
            <h2 className="section-title">{t('Comparar crédito fica mais fácil quando a proposta é direta')}</h2>
            <p className="section-subtitle">
              {t('A CoteJuros mostra condições com mais clareza para você entender antes de fechar contrato.')}
            </p>
          </motion.div>

          <div className="credit-grid credit-grid-rich">
            {credibilityBlocks.map((item) => {
              const Icon = item.icon;
              return (
                <motion.div key={item.title} {...animationIn}>
                  <Card className="card rich-card">
                    <CardContent className="p-0">
                      <div className="rich-card-icon">
                        <Icon className="h-5 w-5" />
                      </div>
                      <h3 className="card-title">{item.title}</h3>
                      <p className="card-text">{item.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      <section id="papel-cotejuros" className="section section--compact brand-note-section role-section">
        <div className="page-shell">
          <div className="role-card">
            <div className="role-content">
              <div className="role-copy">
                <span className="role-eyebrow">PAPEL DA COTEJUROS</span>
                <h2 className="role-title">{t('Compare empréstimos antes de contratar')}</h2>
                <p className="role-text">
                  {t('Veja opções de crédito com clareza, entenda o custo real e escolha com mais segurança.')}
                </p>
              </div>

              <div className="role-media">
                <img
                  src="/images/role-woman-purple.png"
                  alt="Mulher com fones roxos segurando celular com interface de comparação"
                  className="role-photo"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="faq-section faq-premium-section">
        <div className="page-shell">
          <motion.div {...animationIn} className="section-heading-center">
            <h2 className="section-title">{t('O que você precisa saber antes de ver suas opções')}</h2>
          </motion.div>

          <div className="faq-list">
            {faqItems.map((item, index) => (
              <motion.div key={item.question} {...animationIn}>
                <FaqItem item={item} isOpen={openFaq === index} onToggle={() => setOpenFaq(openFaq === index ? -1 : index)} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section id="final-cta" className="final-cta-section">
        <div className="page-shell">
          <motion.div {...animationIn} className="final-cta-card">
            <div className="final-cta-grid" aria-hidden="true" />
            <span className="final-cta-badge">{t('Comece com calma')}</span>
            <h2>
              {t('Compare opções de crédito antes')}
              <br />
              {t('de fechar qualquer contrato')}
            </h2>
            <p>
              {t('Veja caminhos possíveis sem pressão e avance só no que fizer sentido para você.')}
            </p>
            <a href="#hero-credit-preview" className="hero-primary-btn" onClick={focusHeroPreview}>
              {t('Ver minhas opções agora')}
              <ArrowRight className="h-4 w-4" />
            </a>
          </motion.div>
        </div>
      </section>
    </>
  );
}

export default HomePage;
