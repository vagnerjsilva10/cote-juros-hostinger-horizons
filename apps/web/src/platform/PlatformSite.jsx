import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  BadgeCheck,
  BookOpenText,
  Car,
  Clock3,
  CreditCard,
  DollarSign,
  Eye,
  FileCheck2,
  Handshake,
  HeartPulse,
  Home,
  Landmark,
  Mail,
  MapPin,
  Percent,
  Plane,
  Radar,
  Scale,
  SearchCheck,
  ShieldCheck,
  Smartphone,
  UserRound
} from 'lucide-react';
import AdSenseBlock, { ADSENSE_PLATFORM_SLOTS } from '@/components/AdSenseBlock.jsx';
import SmartQuiz from '@/components/smart-quiz/SmartQuiz.jsx';
import BlogPage from '@/pages/BlogPage.jsx';
import BlogArticlePage from '@/pages/BlogArticlePage.jsx';
import { resolveArticleImageAlt, resolveBlogImage } from '@/lib/content/blogImages.js';
import { getArticlePath, getArticleSummary, getEditorialTitle, hasRenderableArticleContent, normalizeArticleData } from '@/lib/content/articles.js';
import { buildCreditasOffer, getCardOffers, getCreditOffers, getFinancingOffers, getInsuranceOffers } from '@/platform/services/offerAdapter.js';
import { getCreditasStatus } from '@/platform/services/creditasAdapter.js';
import { getCurrentCustomer, loginCustomer, logoutCustomer, registerCustomer } from '@/platform/services/authAdapter.js';
import { getLeadFromLocalStorage } from '@/platform/services/leadAdapter.js';
import { recommendProducts } from '@/platform/services/recommendationAdapter.js';
import { saveQuizProgress } from '@/platform/services/quizAdapter.js';
import { portalApi } from '@/platform/services/portalApi.js';
import { trackEvent } from '@/platform/services/trackingAdapter.js';
import { formatCurrencyBRL, parseCurrencyBRL } from '@/utils/currency.js';
import '@/platform/platformHtml.css';

const productRows = [
  ['Creditas', 'Crédito com garantia', 'Sob', 'análise', ['Imóvel ou veículo', 'Simulação com garantia', 'Condições da parceira'], 'CRE', 'Garantia', 'badge-loan', 'guarantee'],
  ['Banco Itaú', 'Empréstimo Pessoal', '1,79%', 'ao mês', ['Até R$ 50.000', 'Até 60 parcelas', 'Análise do parceiro'], 'ITA', 'Empréstimo', 'badge-loan', 'loan'],
  ['Nubank', 'Cartão Roxinho', 'Sem', 'anuidade', ['Cashback em compras', 'App completo', 'Limite personalizável'], 'NUB', 'Cartão', 'badge-card', 'card'],
  ['Caixa Econômica', 'Financiamento Imóvel', '9,5%', 'ao ano', ['FGTS como entrada', 'Até 35 anos', 'Minha Casa Minha Vida'], 'CEF', 'Financiamento', 'badge-finance', 'financing'],
  ['Porto Seguro', 'Auto Completo', 'A partir', 'R$ 89/mês', ['Carro reserva incluso', 'Assistência 24h', 'App de acionamento'], 'POR', 'Seguro Auto', 'badge-insurance', 'insurance'],
  ['Santander', 'Crédito Pessoal', '2,05%', 'ao mês', ['Até R$ 30.000', '48 parcelas', 'Proposta online'], 'SAN', 'Empréstimo', 'badge-loan', 'loan'],
  ['C6 Bank', 'C6 Carbono', 'Milhas', '+ benefícios', ['1 ponto por real', 'Sala VIP aeroporto', 'Anuidade isenta'], 'C6', 'Cartão', 'badge-card', 'card']
];

const insuranceCards = [
  ['Seguro Auto', 'Cobertura completa, parcial e terceiros. Assistência 24h e carro reserva.', '/seguro-auto', 'Cotar seguro auto'],
  ['Seguro Viagem', 'Emergência médica, bagagem, cancelamento e assistência no exterior.', '/seguro-viagem', 'Cotar seguro viagem'],
  ['Seguro de Vida', 'Proteção para você e sua família. Invalidez, morte acidental e mais.', '/seguro-vida', 'Cotar seguro de vida'],
  ['Seguro Residencial', 'Proteção para seu imóvel contra roubo, incêndio e danos elétricos.', '/seguros', 'Ver coberturas'],
  ['Seguro Celular', 'Proteção contra roubo, furto e danos acidentais do seu smartphone.', '/seguros', 'Ver coberturas'],
  ['Proteção Financeira', 'Seguro prestamista e proteção em caso de imprevistos financeiros.', '/seguros', 'Ver coberturas']
];

const categoryCards = [
  ['Empréstimos', 'Compare taxas de crédito pessoal, FGTS, consignado e mais.', 'Comparar empréstimos', '/comparar', 'var(--accent)'],
  ['Cartões de Crédito', 'Sem anuidade, com cashback, milhas e benefícios exclusivos.', 'Comparar cartões', '/comparar', '#22D3A0'],
  ['Financiamentos', 'Imóvel, veículo e outros financiamentos com as melhores condições.', 'Comparar financiamentos', '/comparar', '#F59E0B'],
  ['Seguros', 'Auto, vida, viagem, residencial. Compare coberturas e escolha.', 'Comparar seguros', '/seguros', '#F43F5E'],
  ['Radar de Crédito', 'Entenda seu perfil e veja caminhos possíveis antes de decidir.', 'Acessar Radar', '/radar', 'var(--accent)'],
  ['Educação Financeira', 'Artigos, guias e conteúdo para tomar decisões com mais consciência.', 'Ler artigos', '/blog', 'var(--accent)']
];

const faqItems = [
  ['A Cote Juros é um banco?', 'Não. A Cote Juros é uma plataforma de comparação. Não somos banco, não concedemos crédito e não fazemos parte de nenhuma instituição financeira.'],
  ['A Cote Juros cobra algum valor?', 'Não cobramos nenhum valor do usuário para comparar ou acessar informações. Nunca exigimos pagamento antecipado.'],
  ['A aprovação é garantida?', 'Não garantimos aprovação. As decisões de crédito são dos parceiros e dependem da análise individual de cada um.'],
  ['Como meus dados são protegidos?', 'Seguimos as diretrizes da LGPD. Seus dados são usados apenas para melhorar a comparação e nunca são vendidos a terceiros sem consentimento.'],
  ['Posso confiar nas taxas exibidas?', 'As informações são fornecidas pelos parceiros e atualizadas regularmente, mas podem variar conforme perfil, disponibilidade e condições de mercado. Sempre confirme com o parceiro antes de contratar.'],
  ['O Radar de Crédito é uma análise oficial?', 'O Radar é uma ferramenta indicativa baseada nas informações fornecidas. Não substitui uma análise oficial de crédito por uma instituição financeira.']
];

const heroTrustItems = [
  { label: 'Análise simples', Icon: SearchCheck },
  { label: 'Sem pressão', Icon: Handshake },
  { label: 'Parceiros verificados', Icon: BadgeCheck }
];

const heroQuickAmounts = [1000, 5000, 10000, 20000];

const trustStripItems = [
  { label: 'Dados protegidos pela LGPD', Icon: ShieldCheck },
  { label: 'Resultado em minutos', Icon: Clock3 },
  { label: 'Sem custo para comparar', Icon: DollarSign },
  { label: 'Parceiros verificados', Icon: BadgeCheck }
];

const radarFeatureItems = [
  { label: 'Análise do perfil financeiro', Icon: UserRound },
  { label: 'Indicadores de elegibilidade por produto', Icon: SearchCheck },
  { label: 'Caminhos possíveis sem compromisso', Icon: Scale },
  { label: 'Resultado em minutos', Icon: Clock3 }
];

const complianceItems = [
  { text: 'Não somos uma instituição financeira. Apenas comparamos e conectamos.', Icon: Landmark },
  { text: 'Não cobramos nenhum valor antecipado para análise de crédito.', Icon: DollarSign },
  { text: 'A aprovação depende da análise individual de cada parceiro.', Icon: SearchCheck },
  { text: 'Seus dados são protegidos em conformidade com a LGPD.', Icon: ShieldCheck }
];

const categoryIconByTitle = {
  Empréstimos: Landmark,
  'Cartões de Crédito': CreditCard,
  Financiamentos: Home,
  Seguros: ShieldCheck,
  'Radar de Crédito': Radar,
  'Educação Financeira': BookOpenText
};

const insuranceIconByName = {
  'Seguro Auto': Car,
  'Seguro Viagem': Plane,
  'Seguro de Vida': HeartPulse,
  'Seguro Residencial': Home,
  'Seguro Celular': Smartphone,
  'Proteção Financeira': ShieldCheck
};

const eligibilityIconByLabel = {
  'Empréstimo pessoal': Landmark,
  'Cartão de crédito': CreditCard,
  Financiamento: Home,
  Seguros: ShieldCheck
};

const missionIconByLabel = {
  Transparência: Eye,
  'Sem pressão': Handshake,
  'Custo zero': DollarSign
};

const valueIconByTitle = {
  Segurança: ShieldCheck,
  Educação: BookOpenText,
  Clareza: Eye
};

const contactIconByLabel = {
  'E-mail': Mail,
  Atendimento: Clock3,
  Localização: MapPin
};

function ArrowIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}

const fallbackPlatformHeaderNav = [
  ['In\u00edcio', '/'],
  ['Comparar', '/comparar'],
  ['Radar de Cr\u00e9dito', '/radar'],
  ['Blog', '/blog']
];

const fallbackPlatformFooterSections = [
  { title: 'Cote Juros', links: [['Sobre n\u00f3s', '/sobre'], ['Contato', '/contato'], ['FAQ', '/faq'], ['Blog', '/blog']] },
  { title: 'Comparar', links: [['Empr\u00e9stimos', '/comparar'], ['Cart\u00f5es', '/comparar'], ['Financiamentos', '/comparar'], ['Seguros', '/seguros']] },
  { title: 'Seguros', links: [['Seguro Auto', '/seguro-auto'], ['Seguro Viagem', '/seguro-viagem'], ['Seguro de Vida', '/seguro-vida'], ['Seguro Residencial', '/seguros']] },
  { title: '\u00c1rea do cliente', links: [['Entrar', '/login'], ['Criar conta', '/criar-conta'], ['Minha conta', '/dashboard'], ['Pol\u00edtica de privacidade', '/politica-de-privacidade']] }
];

const fallbackPlatformLegalLinks = [['Termos de uso', '/termos-de-uso'], ['Privacidade', '/politica-de-privacidade']];
const fallbackPlatformFooterDisclaimer = '2025 Cote Juros. A Cote Juros n\u00e3o \u00e9 banco, n\u00e3o concede cr\u00e9dito e n\u00e3o garante aprova\u00e7\u00e3o. Sujeito \u00e0 an\u00e1lise dos parceiros. Informa\u00e7\u00f5es sujeitas a altera\u00e7\u00e3o.';
const isProductionRuntime = () =>
  Boolean(import.meta.env.PROD || (typeof window !== 'undefined' && /(^|\.)cotejuros\.(com\.br|br)$/i.test(window.location.hostname)));

const normalizePlatformLinks = (items = []) =>
  items
    .filter((item) => item?.label && item?.href)
    .sort((a, b) => Number(a.order || 0) - Number(b.order || 0))
    .map((item) => [item.label, item.href]);

const normalizeFooterSections = (tree = []) => {
  const sections = tree
    .filter((item) => item?.label)
    .map((item) => ({ title: item.label, links: normalizePlatformLinks(item.links || []) }))
    .filter((section) => section.links.length > 0);

  return sections.length ? sections : fallbackPlatformFooterSections;
};

function usePlatformSiteFoundation() {
  const [siteFoundation, setSiteFoundation] = useState({ navigation: null, disclaimers: [] });

  useEffect(() => {
    let mounted = true;

    Promise.allSettled([
      portalApi.getSiteNavigation(),
      portalApi.getSiteDisclaimers({ placement: 'footer' })
    ]).then(([navigationResult, disclaimersResult]) => {
      if (!mounted) return;
      setSiteFoundation({
        navigation: navigationResult.status === 'fulfilled' ? navigationResult.value : null,
        disclaimers: disclaimersResult.status === 'fulfilled' && Array.isArray(disclaimersResult.value) ? disclaimersResult.value : []
      });
    });

    return () => {
      mounted = false;
    };
  }, []);

  return siteFoundation;
}

function PlatformHeader() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const nav = fallbackPlatformHeaderNav;

  const { navigation } = usePlatformSiteFoundation();
  const apiNav = normalizePlatformLinks(navigation?.byLocation?.header || []);
  const apiMobileNav = normalizePlatformLinks(navigation?.byLocation?.mobile || []);
  const visibleNav = apiNav.length ? apiNav : nav;
  const visibleMobileNav = apiMobileNav.length ? apiMobileNav : visibleNav;

  return (
    <>
      <header id="main-header">
        <div className="header-inner">
          <Link to="/" className="logo">
            <span className="logo-text"><span className="logo-primary">Cote</span><span className="logo-accent">Juros</span></span>
          </Link>
          <nav>
            {visibleNav.map(([label, href]) => (
              <Link key={href} className={`nav-link ${location.pathname === href ? 'active' : ''}`} to={href}>{label}</Link>
            ))}
          </nav>
          <div className="header-actions">
            <Link to="/login" className="btn-ghost">Entrar</Link>
            <Link to="/quiz" className="btn-primary"><ArrowIcon /> Ver caminhos para meu perfil</Link>
          </div>
          <button type="button" className="menu-toggle" onClick={() => setOpen((value) => !value)}>Menu</button>
        </div>
      </header>
      <div className={`mobile-nav ${open ? 'open' : ''}`} id="mobile-nav">
        {visibleMobileNav.map(([label, href]) => <Link key={href} className="nav-link" to={href} onClick={() => setOpen(false)}>{label}</Link>)}
      </div>
    </>
  );
}

function PlatformFooter() {
  const { navigation, disclaimers } = usePlatformSiteFoundation();
  const footerSections = normalizeFooterSections(navigation?.treeByLocation?.footer || []);
  const legalLinks = normalizePlatformLinks(navigation?.byLocation?.legal || []);
  const footerDisclaimer = disclaimers.find((item) => item?.content)?.content || fallbackPlatformFooterDisclaimer;

  return (
    <footer>
      <div className="container">
        <div className="footer-top">
          <div className="footer-brand">
            <div className="footer-brand-name"><span className="logo-text"><span className="logo-primary">Cote</span><span className="logo-accent">Juros</span></span></div>
            <div className="footer-tagline">Plataforma brasileira de comparação de crédito, cartões, financiamentos e seguros.</div>
            <div className="api-ready-note">A Cote Juros não é uma instituição financeira e não concede crédito diretamente. Não cobramos valores antecipados.</div>
          </div>
          {footerSections.map((section) => <FooterCol key={section.title} title={section.title} links={section.links} />)}
        </div>
        <div className="footer-bottom">
          <div className="footer-legal">{footerDisclaimer}</div>
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            {(legalLinks.length ? legalLinks : fallbackPlatformLegalLinks).map(([label, href]) => (
              <Link key={href} style={{ fontSize: 12, color: 'var(--text-muted)' }} to={href}>{label}</Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }) {
  return (
    <div>
      <div className="footer-col-title">{title}</div>
      <ul className="footer-links">
        {links.map(([label, href]) => <li key={href + label}><Link to={href}>{label}</Link></li>)}
      </ul>
    </div>
  );
}

export function PlatformShell({ children, title = 'Cote Juros', bare = false }) {
  const location = useLocation();
  const isBlogRoute = location.pathname === '/blog' || location.pathname.startsWith('/blog/');

  return (
    <div className={`cj-platform${isBlogRoute ? ' cj-platform--blog-light' : ''}`}>
      <Helmet><title>{title}</title></Helmet>
      {bare ? null : <PlatformHeader />}
      {children}
      {bare ? null : <PlatformFooter />}
    </div>
  );
}

function HeroDashboard() {
  return (
    <div className="hero-visual reveal" style={{ transitionDelay: '0.2s', position: 'relative' }}>
      <div className="hero-dashboard">
        <div className="dash-header"><div className="dash-title">Radar de Crédito</div><div className="dash-badge">Ilustrativo</div></div>
        <div className="radar-visual">
          <div className="radar-label">Perfil financeiro</div>
          <div className="radar-score"><div className="score-ring">720</div><div className="score-info"><div className="score-title">Score estimado</div><div className="score-sub">Baseado no perfil informado</div></div></div>
          <div className="path-bars">
            {[
              ['Empréstimo pessoal', '82%'],
              ['Cartão de crédito', '68%'],
              ['Financiamento', '55%'],
              ['Seguro auto', '91%']
            ].map(([name, pct]) => (
              <div className="path-bar" key={name}>
                <div className="path-name">{name}</div>
                <div className="bar-track"><div className="bar-fill" style={{ width: pct }} /></div>
                <div className="bar-pct">{pct}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="dash-cards-row">
          <div className="mini-card"><div className="mini-card-label">Melhor taxa</div><div className="mini-card-value">1,79%</div><div className="mini-card-change"><Percent size={10} /> ao mês</div></div>
          <div className="mini-card"><div className="mini-card-label">Opções</div><div className="mini-card-value">12</div><div className="mini-card-change"><BadgeCheck size={10} /> parceiros</div></div>
        </div>
      </div>
      <div className="float-chip float-chip-1"><div className="float-dot" style={{ background: '#22D3A0' }} /> Caminhos possíveis</div>
      <div className="float-chip float-chip-2"><div className="float-dot" style={{ background: '#7C6EF7' }} /> Opções compatíveis</div>
    </div>
  );
}

function FunnelAmountCta({ sourcePage = '/', dark = true }) {
  const navigate = useNavigate();
  const [amount, setAmount] = useState(0);
  const [displayAmount, setDisplayAmount] = useState('');

  const updateAmount = (value) => {
    const nextAmount = parseCurrencyBRL(value);
    setAmount(nextAmount);
    setDisplayAmount(formatCurrencyBRL(nextAmount));
    return nextAmount;
  };

  const selectQuickAmount = (value) => {
    setAmount(value);
    setDisplayAmount(formatCurrencyBRL(value));
  };

  const startQuiz = async (event) => {
    event.preventDefault();
    const requestedAmount = amount || parseCurrencyBRL(displayAmount);
    saveQuizProgress({
      sourcePage,
      requestedAmount,
      quizAnswers: {
        requestedAmount,
        sourcePage
      }
    });
    await trackEvent('quiz_started', { sourcePage, requestedAmount });
    navigate('/quiz', { state: { requestedAmount, sourcePage } });
  };

  return (
    <form className={`funnel-amount-cta ${dark ? 'funnel-amount-cta--dark' : ''}`} onSubmit={startQuiz}>
      <label htmlFor={`requested-amount-${sourcePage.replace(/\W/g, '')}`}>De quanto você precisa?</label>
      <div className="funnel-amount-main">
        <input
          id={`requested-amount-${sourcePage.replace(/\W/g, '')}`}
          inputMode="numeric"
          placeholder="Ex: R$ 5.000"
          value={displayAmount}
          onChange={(event) => updateAmount(event.target.value)}
        />
        <button type="submit">Ver opções para meu perfil <ArrowIcon size={16} /></button>
      </div>
      <div className="funnel-quick-amounts" aria-label="Sugestões rápidas de valor">
        {heroQuickAmounts.map((value) => (
          <button
            key={value}
            type="button"
            className={amount === value ? 'is-active' : ''}
            onClick={() => selectQuickAmount(value)}
          >
            {formatCurrencyBRL(value)}
          </button>
        ))}
      </div>
      <div className="funnel-microcopy">
        <span><DollarSign size={14} /> Sem cobrança antecipada</span>
        <span><ShieldCheck size={14} /> Dados protegidos (LGPD)</span>
        <span><Clock3 size={14} /> Resultado em poucos minutos</span>
      </div>
    </form>
  );
}

export function PlatformHomePage() {
  return (
    <PlatformShell title="Cote Juros - Compare crédito, cartões e seguros">
      <div className="page active" id="page-home">
        <section id="hero">
          <div className="hero-bg"><div className="hero-orb-1" /><div className="hero-orb-2" /><div className="hero-grid" /></div>
          <div className="container">
            <div className="hero-inner">
              <div className="hero-left reveal">
                <div className="hero-badge"><div className="hero-badge-dot" /> Plataforma de decisão financeira</div>
                <h1 className="hero-title">Encontre opções de crédito para o seu perfil</h1>
                <p className="hero-desc">Responda algumas perguntas rápidas e veja caminhos possíveis antes de decidir.</p>
                <FunnelAmountCta sourcePage="/" />
                <div className="hero-actions" style={{ display: 'none' }}>
                  <Link className="btn-hero" to="/comparar">Ver minhas opções agora <ArrowIcon size={16} /></Link>
                  <Link className="btn-hero-outline" to="/radar">Radar de Crédito</Link>
                </div>
                <div className="hero-trust">
                  {heroTrustItems.map(({ label, Icon }) => (
                    <div className="hero-trust-item" key={label}><Icon size={14} strokeWidth={2.3} /> {label}</div>
                  ))}
                </div>
              </div>
              <HeroDashboard />
            </div>
          </div>
        </section>
        <TrustStrip />
        <HowItWorks />
        <RadarHome />
        <CategoriesHome />
        <BlogHome />
        <Compliance />
        <FinalCta />
      </div>
    </PlatformShell>
  );
}

function TrustStrip() {
  return (
    <section id="trust-strip">
      <div className="container"><div className="trust-inner">
        {trustStripItems.map(({ label, Icon }) => (
          <div className="trust-item" key={label}><div className="trust-icon-wrap"><Icon color="#9C8FFF" size={16} strokeWidth={2.3} /></div>{label}</div>
        ))}
      </div></div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    ['01', 'Você informa seu perfil', 'Renda, finalidade e situação do nome. Rápido, sem burocracia.', FileCheck2],
    ['02', 'Organizamos as possibilidades', 'Nosso Radar cruza seu perfil com os parceiros disponíveis.', Radar],
    ['03', 'Você compara antes de decidir', 'Taxas, condições e coberturas lado a lado. Sem letra miúda.', Scale],
    ['04', 'Segue para o parceiro quando fizer sentido', 'Você escolhe. A Cote Juros nunca força uma decisão.', Handshake]
  ];
  return (
    <section id="how-it-works" className="section-pad">
      <div className="container">
        <div style={{ textAlign: 'center', maxWidth: 520, margin: '0 auto' }}><div className="section-label" style={{ justifyContent: 'center' }}>Como funciona</div><h2 style={{ color: 'var(--light-text)', marginBottom: 14 }}>Da busca à decisão, em 4 passos</h2><p className="section-desc" style={{ margin: '0 auto', textAlign: 'center' }}>Processo simples, transparente e sem compromisso. Você compara com informação, não com promessa.</p></div>
        <div className="steps-grid">{steps.map(([num, title, desc, Icon], index) => <div className="step-card reveal" style={{ transitionDelay: `${index / 10}s` }} key={num}><div className="step-num">{num}</div><div className="step-icon-wrap"><Icon color="currentColor" size={22} strokeWidth={2.2} /></div><div className="step-title">{title}</div><div className="step-desc">{desc}</div></div>)}</div>
      </div>
    </section>
  );
}

function RadarHome() {
  return (
    <section id="radar" className="section-pad" style={{ background: 'var(--bg-primary)' }}>
      <div className="container"><div className="radar-section-inner">
        <div>
          <div className="section-label">Radar de Crédito</div>
          <h2 style={{ marginBottom: 16 }}>Entenda suas possibilidades<br /><span className="text-accent">antes de pedir</span></h2>
          <p className="section-desc" style={{ marginBottom: 28 }}>O Radar organiza caminhos possíveis com base no seu perfil. Você vê oportunidades, não promessas.</p>
          <ul className="platform-check-list">
            {radarFeatureItems.map(({ label }) => <li key={label}><span><RadarCheckIcon /></span>{label}</li>)}
          </ul>
          <Link className="btn-primary" to="/radar">Acessar Radar de Crédito <ArrowIcon /></Link>
        </div>
        <RadarCard />
      </div></div>
    </section>
  );
}

function RadarCheckIcon() {
  return <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#9C8FFF" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>;
}

function RadarCard() {
  return (
    <div className="radar-full-card reveal">
      <div className="radar-top-row"><div className="radar-user"><div className="avatar">MF</div><div><div className="user-name">Maria F.</div><div className="user-status">Análise ilustrativa</div></div></div><div className="radar-score-big"><div className="score-number">740</div><div className="score-label-sm">Score estimado</div></div></div>
      <div className="eligibility-section"><div className="eligibility-title">Caminhos possíveis</div>{[['Empréstimo pessoal', '85%', 'var(--accent)'], ['Cartão de crédito', '70%', '#22D3A0'], ['Financiamento', '55%', '#F59E0B'], ['Seguros', '93%', '#F43F5E']].map(([label, pct, color]) => <EligibilityRow key={label} label={label} pct={pct} color={color} />)}</div>
      <div className="radar-disclaimer">Dados e indicadores ilustrativos. As opções dependem da análise dos parceiros e podem variar conforme perfil.</div>
    </div>
  );
}

function EligibilityRow({ label, pct, color }) {
  const accentColor = label === 'Empréstimo pessoal' ? '#9C8FFF' : color;
  const pctColor = label === 'Empréstimo pessoal' ? 'var(--accent-light)' : color;
  const bg = {
    'Empréstimo pessoal': 'rgba(124,110,247,0.15)',
    'Cartão de crédito': 'rgba(34,211,160,0.12)',
    Financiamento: 'rgba(245,158,11,0.12)',
    Seguros: 'rgba(244,63,94,0.12)'
  }[label];
  return <div className="elig-row"><div className="elig-icon-w" style={{ background: bg }}><EligibilitySvg label={label} color={accentColor} /></div><span className="elig-label">{label}</span><div className="elig-bar-sm"><div className="elig-bar-sm-fill" style={{ width: pct, background: color }} /></div><span className="elig-pct-val" style={{ color: pctColor }}>{pct}</span></div>;
}

function EligibilitySvg({ label, color }) {
  if (label === 'Empréstimo pessoal') return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>;
  if (label === 'Cartão de crédito') return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round"><rect x="1" y="4" width="22" height="16" rx="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg>;
  if (label === 'Financiamento') return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>;
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>;
}

function CategoriesHome() {
  return <section id="categories" className="section-pad"><div className="container"><div style={{ textAlign: 'center', maxWidth: 520, margin: '0 auto' }}><div className="section-label" style={{ justifyContent: 'center', color: 'var(--accent-dark)' }}>O que você precisa</div><h2 style={{ color: 'var(--light-text)', marginBottom: 12 }}>Encontre o produto<br />certo para você</h2></div><div className="categories-grid">{categoryCards.map(([title, desc, label, href, color], index) => { const Icon = categoryIconByTitle[title] || BadgeCheck; return <Link className="category-card reveal" style={{ transitionDelay: `${(index % 3) / 10}s` }} key={title} to={href}><div className="cat-icon" style={{ background: color === 'var(--accent)' ? 'rgba(124,110,247,0.1)' : `${color}1A` }}><Icon color={color} size={22} strokeWidth={2.2} /></div><div><div className="cat-title">{title}</div><div className="cat-desc">{desc}</div></div><div className="cat-link" style={{ color }}>{label}<ArrowIcon /></div></Link>; })}</div></div></section>;
}

function BlogHome() {
  return <section id="blog-home" className="section-pad" style={{ background: 'var(--light-bg)' }}><div className="container"><div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20 }}><div><div className="section-label" style={{ color: 'var(--accent-dark)' }}>Educação financeira</div><h2 style={{ color: 'var(--light-text)' }}>Conteúdo para decidir<br />com mais consciência</h2></div><Link className="btn-outline" style={{ borderColor: 'var(--accent-dark)', color: 'var(--accent-dark)' }} to="/blog">Ver todos os artigos</Link></div><BlogGrid count={3} /></div></section>;
}

function BlogGrid({ count = 3 }) {
  const [articles, setArticles] = useState([]);
  const [loadState, setLoadState] = useState('loading');

  useEffect(() => {
    let active = true;
    setLoadState('loading');
    setArticles([]);

    portalApi
      .getArticles({ sort: 'recent', limit: count })
      .then((items) => {
        if (!active) return;
        const remoteArticles = Array.isArray(items)
          ? items.map((item) => normalizeArticleData(item)).filter(hasRenderableArticleContent).slice(0, count)
          : [];
        setArticles(remoteArticles);
        setLoadState(remoteArticles.length ? 'ready' : 'empty');
      })
      .catch((error) => {
        console.error('[home-blog] erro ao carregar artigos', error);
        if (!active) return;
        setArticles([]);
        setLoadState('error');
      });

    return () => {
      active = false;
    };
  }, [count]);

  if (loadState === 'loading') return <BlogGridSkeleton count={count} />;
  if (!articles.length) return <div className="blog-empty-state"><span>Artigos indisponíveis</span></div>;

  return <div className="blog-grid">{articles.map((article) => <HomeBlogCard article={article} key={article.slug || article.id || article.title} />)}</div>;
}

function BlogGridSkeleton({ count = 3 }) {
  return (
    <div className="blog-grid blog-grid--skeleton">
      {Array.from({ length: count }).map((_, index) => (
        <div className="blog-card blog-card--skeleton" key={index}>
          <div className="blog-skeleton-media" />
          <div className="blog-content">
            <div className="blog-skeleton-line blog-skeleton-line--meta" />
            <div className="blog-skeleton-line blog-skeleton-line--title" />
            <div className="blog-skeleton-line" />
            <div className="blog-skeleton-line blog-skeleton-line--short" />
          </div>
        </div>
      ))}
    </div>
  );
}

function HomeBlogCard({ article }) {
  const image = resolveBlogImage(article);
  const category = article.category || article.clusterLabel || 'Educação financeira';
  const readTime = article.readTime || article.readingTime || 6;
  const handleImageError = (event) => {
    const fallback = resolveBlogImage({
      category,
      clusterLabel: article.clusterLabel,
      coverImage: '',
      ogImage: '',
      image: '',
      thumbnail: '',
      heroImage: '',
      structuredContent: {}
    });
    if (event.currentTarget.getAttribute('src') !== fallback) event.currentTarget.src = fallback;
  };

  return (
    <Link className="blog-card" to={getArticlePath(article)}>
      <div className="blog-img">
        <img src={image} alt={resolveArticleImageAlt(article)} loading="lazy" decoding="async" onError={handleImageError} />
        <div className="blog-cat-badge">{category}</div>
      </div>
      <div className="blog-content">
        <div className="blog-meta"><span>{readTime} min de leitura</span><span>•</span><span>{category}</span></div>
        <div className="blog-title">{getEditorialTitle(article)}</div>
        <div className="blog-excerpt">{getArticleSummary(article)}</div>
      </div>
    </Link>
  );
}

function Compliance() {
  return <section id="compliance" className="section-pad-sm"><div className="container"><div className="compliance-grid">{complianceItems.map(({ text, Icon }) => <div className="comp-item" key={text}><div className="comp-ico"><Icon color="currentColor" size={16} strokeWidth={2.2} /></div><div className="comp-text">{text}</div></div>)}</div></div></section>;
}

function FinalCta() {
  return <section id="cta-final" className="section-pad"><div className="container"><div className="cta-wrap"><div className="cta-glow" /><div className="section-label" style={{ justifyContent: 'center' }}>Comece agora</div><h2 className="cta-title">Pronto para <span className="text-accent">comparar</span><br />com mais clareza?</h2><p className="cta-desc">Sem compromisso. Sem cobrança. Em minutos você vê caminhos possíveis para o seu perfil.</p><div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}><Link className="btn-hero" to="/comparar">Ver minhas opções agora <ArrowIcon size={16} /></Link><Link className="btn-hero-outline" to="/criar-conta">Criar conta grátis</Link></div></div></div></section>;
}

function InnerHero({ badge, title, desc, action }) {
  return <div className="inner-hero"><div className="container"><div className="inner-hero-badge">{badge}</div><h1>{title}</h1><p className="section-desc">{desc}</p>{action}</div></div>;
}

export function PlatformComparePage() {
  const isProduction = isProductionRuntime();
  const [offers, setOffers] = useState([]);
  useEffect(() => {
    let mounted = true;
    Promise.allSettled([getCreditOffers({ rank: true }), getCardOffers({ rank: true }), getFinancingOffers({ rank: true })])
      .then((results) => {
        if (!mounted) return;
        setOffers(results.flatMap((result) => (result.status === 'fulfilled' && Array.isArray(result.value) ? result.value : [])));
      });
    return () => {
      mounted = false;
    };
  }, []);
  const compareOffers = [...(!isProduction ? [buildCreditasOffer()] : []), ...offers].filter(Boolean);
  if (isProduction && !compareOffers.length) {
    return <PlatformShell title="Comparar produtos | Cote Juros"><div className="page active" id="page-compare"><InnerHero badge="Marketplace" title={<>Compare produtos<br /><span className="text-accent">financeiros</span></>} desc="Taxas, condicoes e coberturas lado a lado. Voce decide quando e se avancar." action={<div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 24 }}><Link className="btn-primary" to="/radar">Acessar Radar de Credito</Link><button className="btn-outline">Ver mais filtros</button></div>} /><section className="section-pad" style={{ background: 'var(--bg-surface)' }}><div className="container"><div className="compare-layout"><FilterSidebar /><div><AdSenseBlock adSlot={ADSENSE_PLATFORM_SLOTS.compareResults} minHeight={120} theme="dark" className="mb-adsense" /><div className="api-ready-note">Nenhuma oferta disponivel agora.</div><div className="api-ready-note">As condicoes exibidas podem variar conforme perfil e disponibilidade dos parceiros. A Cote Juros nao e banco e nao concede credito diretamente.</div></div></div></div></section></div></PlatformShell>;
  }
  const rows = compareOffers.length ? compareOffers.slice(0, 5).map((offer) => [offer.bankName || 'Parceiro', offer.title || offer.productName || 'Produto financeiro', offer.monthlyRate ? `${offer.monthlyRate}%` : offer.annualFee === 0 ? 'R$0' : offer.rate || 'Sob análise', offer.annualFee === 0 ? 'anuidade' : 'ao mês', offer.tags || ['Online', 'Parceiro verificado'], offer.bankName || 'CJ']) : productRows.map(([bank, product, rate, unit, tags, logo]) => [bank, product, rate, unit, tags, logo]);
  return <PlatformShell title="Comparar produtos | Cote Juros"><div className="page active" id="page-compare"><InnerHero badge="Marketplace" title={<>Compare produtos<br /><span className="text-accent">financeiros</span></>} desc="Taxas, condições e coberturas lado a lado. Você decide quando e se avançar." action={<div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 24 }}><Link className="btn-primary" to="/radar">Acessar Radar de Crédito</Link><button className="btn-outline">Ver mais filtros</button></div>} /><section className="section-pad" style={{ background: 'var(--bg-surface)' }}><div className="container"><div className="compare-layout"><FilterSidebar /><div><AdSenseBlock adSlot={ADSENSE_PLATFORM_SLOTS.compareResults} minHeight={120} theme="dark" className="mb-adsense" /><div className="compare-results">{rows.map(([bank, title, rate, unit, tags, logo]) => <CompareResult key={`${bank}-${title}`} title={`${bank} - ${title}`} subtitle="Parceiro verificado" rate={rate} desc={unit} tags={tags} logo={logo} />)}</div><div className="api-ready-note">As condições exibidas são ilustrativas e podem variar conforme perfil e disponibilidade dos parceiros. A Cote Juros não é banco e não concede crédito diretamente.</div></div></div></div></section></div></PlatformShell>;
}

function FilterSidebar() {
  const fields = [
    ['Tipo de produto', ['Todos', 'Empréstimo pessoal', 'Cartão de crédito', 'Financiamento', 'Seguro']],
    ['Valor desejado', null],
    ['Prazo', ['Qualquer', 'Até 12 meses', 'De 12 a 36 meses', 'Acima de 36 meses']],
    ['Situação do nome', ['Nome limpo', 'Restrição no CPF']],
    ['Finalidade', ['Qualquer', 'Quitar dívidas', 'Reformar imóvel', 'Emergência', 'Viagem']]
  ];
  return <div className="filter-sidebar"><div className="filter-section-title">Filtros</div>{fields.map(([label, options]) => <div className="filter-group" key={label}><div className="filter-label">{label}</div>{options ? <select className="filter-select">{options.map((item) => <option key={item}>{item}</option>)}</select> : <input className="filter-input" placeholder="Ex: R$ 10.000" />}</div>)}<button className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>Aplicar filtros</button></div>;
}

function CompareResult({ title, subtitle, rate, desc, tags, logo }) {
  return <div className="compare-card"><div className="compare-card-main"><div className="bank-logo">{String(logo).slice(0, 3).toUpperCase()}</div><div><div className="compare-card-title">{title}</div><div className="compare-card-subtitle">{subtitle}</div><div className="compare-card-tags">{(tags || []).map((tag) => <span className="tag" key={tag}>{tag}</span>)}</div></div></div><div className="compare-card-rate"><div className="rate-big">{rate}</div><div className="rate-desc">{desc}</div></div><div className="compare-card-action"><button className="btn-primary">Ver oferta</button><span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Parceiro verificado</span></div></div>;
}

export function PlatformQuizPage() {
  const quizSideItems = [
    ['Crédito com garantia', 'Encontramos opções de crédito conforme o seu perfil, sem prometer aprovação.'],
    ['Seguros', 'Conectamos você a opções de seguros alinhadas à sua necessidade.'],
    ['Cartões', 'Buscamos alternativas de cartões conforme seu perfil financeiro.'],
    ['Segurança e privacidade', 'Seus dados são tratados com proteção e responsabilidade durante todo o processo.']
  ];

  return <PlatformShell title="Quiz inteligente | Cote Juros"><div className="page active" id="page-quiz"><InnerHero badge="Análise gratuita" title={<>Descubra qual caminho combina melhor com seu <span className="text-accent">momento financeiro</span></>} desc="Responda algumas perguntas e veja caminhos que podem fazer sentido para o seu perfil. Sem cobranças antecipadas e sem promessa de aprovação." /><section className="section-pad" style={{ background: 'var(--bg-surface)' }}><div className="container"><div className="quiz-shell"><div><SmartQuiz /></div><aside className="creditas-card"><div className="section-label">Como funciona</div><h3 style={{ marginBottom: 10 }}>Responda ao quiz → analisamos seu perfil → buscamos opções disponíveis → conectamos você a parceiros compatíveis.</h3><div className="quiz-side-list">{quizSideItems.map(([title, description]) => <div className="quiz-side-item" key={title}><strong>{title}</strong><span>{description}</span></div>)}</div><p className="api-ready-note" style={{ marginTop: 14 }}>As opções dependem da análise dos parceiros e podem variar conforme o perfil informado.</p></aside></div></div></section></div></PlatformShell>;
}

export function PlatformRadarPage() {
  const radarRows = [
    ['loan', 'Empréstimo pessoal', '85%', 'var(--accent)', 'var(--accent-light)', 'rgba(124,110,247,0.15)'],
    ['card', 'Cartão de crédito', '70%', '#22D3A0', '#22D3A0', 'rgba(34,211,160,0.12)'],
    ['home', 'Financiamento', '55%', '#F59E0B', '#F59E0B', 'rgba(245,158,11,0.12)'],
    ['shield', 'Seguros', '93%', '#F43F5E', '#F43F5E', 'rgba(244,63,94,0.12)']
  ];

  return (
    <PlatformShell title="Radar de crédito | Cote Juros">
      <div className="page active" id="page-radar">
        <InnerHero
          badge="Novo produto"
          title={<>Radar de <span className="text-accent">Crédito</span></>}
          desc="Entenda seu perfil financeiro e veja caminhos possíveis antes de tomar qualquer decisão. Sem custo, sem compromisso."
          action={<Link className="btn-primary" style={{ marginTop: 24 }} to="/dashboard">Iniciar análise do perfil</Link>}
        />
        <section className="section-pad" style={{ background: 'var(--bg-surface)' }}>
          <div className="container">
            <div style={{ maxWidth: 700, margin: '0 auto' }}>
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 20, padding: 36, marginBottom: 24 }}>
                <div style={{ textAlign: 'center', marginBottom: 32 }}>
                  <div className="section-label" style={{ justifyContent: 'center' }}>Dashboard</div>
                  <h2 style={{ marginBottom: 8, color: '#FFFFFF' }}>Seu perfil financeiro</h2>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Dados e indicadores ilustrativos. As opções dependem da análise dos parceiros.</p>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 28 }}>
                  <RadarStat label="Score estimado" value="740" color="var(--accent-light)" />
                  <RadarStat label="Opções encontradas" value="12" />
                  <RadarStat label="Melhor taxa" value="1,29%" color="var(--success)" />
                </div>
                <div>
                  <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: 14 }}>Elegibilidade por produto</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {radarRows.map(([icon, label, pct, barColor, textColor, iconBg]) => (
                      <RadarEligibilityRow key={label} icon={icon} label={label} pct={pct} barColor={barColor} textColor={textColor} iconBg={iconBg} />
                    ))}
                  </div>
                </div>
              </div>
              <div style={{ padding: '14px 16px', background: 'var(--bg-card)', border: '1px dashed var(--border)', borderRadius: 10, fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.7 }}>
                ⓘ Indicadores ilustrativos. Para uma análise real, preencha seu perfil completo.
                <div style={{ marginTop: 10 }}><Link className="btn-primary" to="/criar-conta">Criar conta e analisar perfil</Link></div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </PlatformShell>
  );
}

function RadarStat({ label, value, color = 'var(--text-primary)' }) {
  return (
    <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 12, padding: 18, textAlign: 'center' }}>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>{label}</div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, color }}>{value}</div>
    </div>
  );
}

function RadarEligibilityIcon({ icon, color }) {
  if (icon === 'card') return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round"><rect x="1" y="4" width="22" height="16" rx="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg>;
  if (icon === 'home') return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /></svg>;
  if (icon === 'shield') return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>;
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>;
}

function RadarEligibilityRow({ icon, label, pct, barColor, textColor, iconBg }) {
  return (
    <div className="elig-row">
      <div className="elig-icon-w" style={{ background: iconBg }}>
        <RadarEligibilityIcon icon={icon} color={textColor} />
      </div>
      <span className="elig-label" style={{ width: 160 }}>{label}</span>
      <div style={{ flex: 1, height: 6, background: 'var(--border)', borderRadius: 6, overflow: 'hidden' }}>
        <div style={{ width: pct, height: '100%', background: icon === 'loan' ? 'linear-gradient(90deg,var(--accent),var(--accent-light))' : barColor, borderRadius: 6 }} />
      </div>
      <span style={{ fontSize: 12, color: textColor, width: 36, textAlign: 'right', fontWeight: 500 }}>{pct}</span>
    </div>
  );
}

function Stat({ label, value, color = 'var(--text-primary)' }) {
  return <div className="stat-card"><div className="stat-label">{label}</div><div className="stat-value" style={{ color }}>{value}</div></div>;
}

export function PlatformInsurancePage({ type = 'seguros' }) {
  const [offers, setOffers] = useState([]);
  useEffect(() => { getInsuranceOffers({ type }).then(setOffers); }, [type]);
  const pageMap = {
    auto: ['Seguro Auto', <>Seguro de carro <span className="text-accent">que você entende</span></>, 'Compare coberturas, entenda o que está incluso e escolha com segurança. Sem letra miúda.'],
    moto: ['Seguro Moto', <>Seguro de moto <span className="text-accent">sem jargões</span></>, 'Compare proteção para sua moto, assistência e coberturas possíveis.'],
    viagem: ['Seguro Viagem', <>Viaje com <span className="text-accent">tranquilidade</span></>, 'Emergência médica no exterior, bagagem extraviada, cancelamento de voo. Compare coberturas.'],
    vida: ['Seguro de Vida', <>Proteção para <span className="text-accent">quem você ama</span></>, 'Morte, invalidez, doença grave. Entenda o que cada plano cobre e escolha com consciência.'],
    seguros: ['Seguros', <>Seguros que <span className="text-accent">protegem de verdade</span></>, 'Compare coberturas, entenda diferenças e escolha com mais segurança. Sem prometer menor preço garantido.']
  };
  const [badge, title, desc] = pageMap[type] || pageMap.seguros;
  const detailCards = type === 'auto'
    ? [['Cobertura Completa', 'Colisão, roubo, furto, incêndio e fenômenos naturais.'], ['Cobertura Terceiros', 'Danos que você causa a outros veículos ou pessoas.'], ['Assistência 24h', 'Guincho, troca de pneu, chaveiro e emergências.'], ['Carro Reserva', 'Veículo substituto enquanto o seu está em conserto.']]
    : [['Emergência e suporte', 'Coberturas variam conforme seguradora e plano.'], ['Proteção financeira', 'Compare limites, franquias e exclusões antes de contratar.'], ['Assistência', 'Entenda o que está incluso no atendimento.']];
  const gridOffers = offers.length ? offers.map((offer) => [offer.title, offer.description, '#', offer.cta || 'Cotar']) : insuranceCards;
  return <PlatformShell title={`${badge} | Cote Juros`}><div className="page active" id={`page-${type}`}><InnerHero badge={badge} title={title} desc={desc} action={type !== 'seguros' ? <button className="btn-primary" style={{ marginTop: 24 }}>Cotar {badge.toLowerCase()}</button> : null} /><section className="section-pad" style={{ background: 'var(--bg-surface)' }}><div className="container">{type === 'seguros' ? <div className="seguros-grid">{gridOffers.map(([name, description, href, cta]) => { const Icon = insuranceIconByName[name] || ShieldCheck; return <Link className="seguro-card" key={name} to={href}><div className="seg-icon"><Icon color="currentColor" size={20} strokeWidth={2.2} /></div><div className="seg-name">{name}</div><div className="seg-desc">{description}</div><div className="seg-link">{cta} <ArrowIcon size={12} /></div></Link>; })}</div> : <div className="coverage-grid">{detailCards.map(([name, description]) => <div className="coverage-card" key={name}><div className="coverage-title">{name}</div><div className="coverage-desc">{description}</div></div>)}</div>}<div className="api-ready-note" style={{ marginTop: 24 }}>As condições variam por seguradora. Consulte o parceiro escolhido para cobertura exata.</div></div></section></div></PlatformShell>;
}

export function PlatformBlogPage() {
  return (
    <PlatformShell title="Blog | Cote Juros">
      <div className="page active" id="page-blog">
        <BlogPage />
      </div>
    </PlatformShell>
  );
}

export function PlatformBlogArticlePage() {
  const { articleSlug } = useParams();

  return (
    <PlatformShell title="Artigo | Cote Juros">
      <div className="page active" id="page-blog-detalhe">
        <BlogArticlePage articleSlugOverride={articleSlug} />
      </div>
    </PlatformShell>
  );
}

export function PlatformFaqPage() {
  return <PlatformShell title="FAQ | Cote Juros"><div className="page active" id="page-faq"><InnerHero badge="Dúvidas" title={<>Perguntas <span className="text-accent">frequentes</span></>} desc="Tudo que você precisa saber sobre como a Cote Juros funciona." /><section className="section-pad" style={{ background: 'var(--bg-surface)' }}><div className="container" style={{ maxWidth: 760 }}><div className="faq-list">{faqItems.map(([q, answer], index) => <FaqItem key={q} question={q} answer={answer} initiallyOpen={index === 0} />)}</div></div></section></div></PlatformShell>;
}

function FaqItem({ question, answer, initiallyOpen = false }) {
  const [open, setOpen] = useState(initiallyOpen);
  return <div className={`faq-item ${open ? 'open' : ''}`}><button type="button" className="faq-question" onClick={() => setOpen((value) => !value)}>{question}<div className="faq-icon">+</div></button><div className="faq-answer">{answer}</div></div>;
}

export function PlatformPrivacyPage() {
  const privacySections = [
    ['Quais dados podemos coletar', 'Podemos coletar dados informados por você, como nome, e-mail, telefone, CPF, renda, finalidade da busca, valor desejado, tipo de trabalho e situação do nome. Também podemos registrar dados técnicos de navegação, origem da visita, consentimentos e interações com a plataforma.'],
    ['Por que usamos esses dados', 'Usamos essas informações para organizar comparações, indicar caminhos possíveis, registrar sua solicitação, melhorar a experiência e permitir continuidade com parceiros quando você decidir avançar.'],
    ['Compartilhamento com parceiros', 'Quando você solicita uma cotação, análise ou continuação de proposta, podemos compartilhar apenas os dados necessários com parceiros financeiros, seguradoras, correspondentes ou serviços envolvidos naquela etapa. A Cote Juros não vende seus dados pessoais.'],
    ['Base legal e consentimento', 'Tratamos dados conforme a LGPD, com base em consentimento, execução de procedimentos solicitados por você, cumprimento de obrigações legais, prevenção a fraudes e legítimo interesse para melhorar segurança e funcionamento da plataforma.'],
    ['O que não fazemos', 'Não somos banco, não concedemos crédito, não garantimos aprovação e não cobramos pagamento antecipado para liberar valores. Também não solicitamos senhas bancárias por e-mail, WhatsApp ou telefone.'],
    ['Seus direitos', 'Você pode solicitar acesso, correção, exclusão, portabilidade, informações sobre compartilhamento, oposição ao tratamento e revogação de consentimento, conforme previsto na LGPD.'],
    ['Contato sobre privacidade', 'Para dúvidas ou solicitações relacionadas aos seus dados pessoais, entre em contato pelo e-mail privacidade@cotejuros.com.br.']
  ];

  return (
    <PlatformShell title="Política de Privacidade | Cote Juros">
      <div className="page active" id="page-politica-de-privacidade">
        <InnerHero
          badge="Privacidade"
          title={<>Política de <span className="text-accent">Privacidade</span></>}
          desc="Entenda como a Cote Juros trata dados pessoais para oferecer comparação financeira com transparência, segurança e respeito à LGPD."
        />
        <section className="section-pad" style={{ background: 'var(--bg-surface)' }}>
          <div className="container" style={{ maxWidth: 880 }}>
            <div className="api-ready-note" style={{ marginBottom: 24 }}>
              Última atualização: abril de 2026. Esta política se aplica às páginas, formulários, simulações, quizzes e áreas da plataforma Cote Juros.
            </div>
            <div style={{ display: 'grid', gap: 16 }}>
              {privacySections.map(([title, copy]) => (
                <div className="value-card" key={title}>
                  <div className="value-title">{title}</div>
                  <div className="value-desc" style={{ lineHeight: 1.75 }}>{copy}</div>
                </div>
              ))}
            </div>
            <div className="api-ready-note" style={{ marginTop: 24 }}>
              A Cote Juros pode atualizar esta política para refletir mudanças legais, operacionais ou de segurança. A versão mais recente estará sempre disponível nesta página.
            </div>
          </div>
        </section>
      </div>
    </PlatformShell>
  );
}

export function PlatformTermsPage() {
  const termsSections = [
    ['Uso da plataforma', 'Ao acessar ou usar a Cote Juros, você concorda em utilizar a plataforma de forma lícita, responsável e com informações verdadeiras. O uso indevido, fraudulento ou que prejudique terceiros pode resultar na suspensão do acesso.'],
    ['Papel da Cote Juros', 'A Cote Juros é uma plataforma de comparação e organização de informações financeiras. Podemos apresentar conteúdos, simulações, caminhos possíveis e parceiros, mas não atuamos como banco, financeira, seguradora ou correspondente bancário responsável pela concessão final.'],
    ['Sem garantia de aprovação', 'Taxas, limites, prazos, coberturas, disponibilidade e aprovação dependem da análise e das regras de cada parceiro. Nenhuma informação exibida na plataforma representa aprovação garantida, proposta vinculante ou obrigação de contratação.'],
    ['Sem cobrança antecipada', 'A Cote Juros não cobra pagamento antecipado para liberar crédito, financiamento, cartão, seguro ou qualquer produto financeiro. Desconfie de pedidos de depósito, PIX ou taxa de liberação em nome da Cote Juros.'],
    ['Simulações e conteúdos', 'Simulações, rankings, artigos, quizzes e indicadores têm finalidade informativa e podem variar conforme dados informados, mercado, disponibilidade dos parceiros e regras comerciais. Eles não substituem contrato, proposta formal ou orientação profissional individual.'],
    ['Parceiros e sites de terceiros', 'Ao seguir para um parceiro, você estará sujeito às políticas, termos, critérios de análise e canais de atendimento desse parceiro. A Cote Juros não controla decisões, contratos, cobranças, atendimento ou sistemas de terceiros.'],
    ['Dados e privacidade', 'O tratamento de dados pessoais segue a nossa Política de Privacidade e a legislação aplicável, incluindo a LGPD. Ao preencher formulários ou solicitar contato, você declara ciência sobre o uso dos dados para dar continuidade à experiência solicitada.'],
    ['Propriedade intelectual', 'Textos, marcas, layout, componentes, identidade visual, comparações e demais materiais da plataforma pertencem à Cote Juros ou são usados com autorização. Não é permitido copiar, reproduzir ou explorar comercialmente o conteúdo sem autorização prévia.'],
    ['Alterações nos termos', 'Podemos atualizar estes termos para refletir mudanças legais, operacionais, comerciais ou de segurança. A versão vigente estará sempre disponível nesta página.'],
    ['Contato', 'Para dúvidas sobre estes termos, escreva para legal@cotejuros.com.br.']
  ];

  return (
    <PlatformShell title="Termos de Uso | Cote Juros">
      <div className="page active" id="page-termos-de-uso">
        <InnerHero
          badge="Termos"
          title={<>Termos de <span className="text-accent">Uso</span></>}
          desc="Veja as regras de uso da Cote Juros e entenda nosso papel como plataforma de comparação financeira."
        />
        <section className="section-pad" style={{ background: 'var(--bg-surface)' }}>
          <div className="container" style={{ maxWidth: 880 }}>
            <div className="api-ready-note" style={{ marginBottom: 24 }}>
              Última atualização: abril de 2026. Ao continuar navegando ou usando os serviços da Cote Juros, você declara estar de acordo com estes termos.
            </div>
            <div style={{ display: 'grid', gap: 16 }}>
              {termsSections.map(([title, copy]) => (
                <div className="value-card" key={title}>
                  <div className="value-title">{title}</div>
                  <div className="value-desc" style={{ lineHeight: 1.75 }}>{copy}</div>
                </div>
              ))}
            </div>
            <div className="api-ready-note" style={{ marginTop: 24 }}>
              A Cote Juros não solicita senhas bancárias e não exige pagamento antecipado para análise ou liberação de crédito.
            </div>
          </div>
        </section>
      </div>
    </PlatformShell>
  );
}

export function PlatformAboutPage() {
  const values = [['Segurança', 'Dados protegidos. Parceiros verificados. Processo transparente.'], ['Educação', 'Conteúdo financeiro de qualidade para decisões mais conscientes.'], ['Clareza', 'Informação objetiva, sem jargões desnecessários ou promessas vagas.']];
  return <PlatformShell title="Sobre | Cote Juros"><div className="page active" id="page-sobre"><InnerHero badge="Quem somos" title={<>Nossa <span className="text-accent">missão</span></>} desc="Acreditamos que decisões financeiras melhores começam com informação mais clara." /><section className="section-pad" style={{ background: 'var(--bg-surface)' }}><div className="container"><div className="about-mission"><div><div className="section-label">Propósito</div><h2 style={{ marginBottom: 16 }}>Comparação como ferramenta de <span className="text-accent">liberdade</span></h2><p style={{ color: 'var(--text-secondary)', fontSize: 15, lineHeight: 1.8, marginBottom: 20 }}>A Cote Juros nasceu da percepção de que muita gente contrata crédito, seguro ou financiamento sem entender bem as condições - e paga caro por isso.</p><p style={{ color: 'var(--text-secondary)', fontSize: 15, lineHeight: 1.8 }}>Não somos banco, não concedemos crédito e não temos interesse em empurrar nenhum produto específico. Nosso papel é organizar informação.</p></div><div className="mission-card">{['Transparência', 'Sem pressão', 'Custo zero'].map((item) => { const Icon = missionIconByLabel[item] || BadgeCheck; return <div className="mission-row" key={item}><div className="mission-icon"><Icon color="var(--accent-light)" size={16} strokeWidth={2.2} /></div><div><strong>{item}</strong><span>Mostramos o que sabemos, sem prometer o que não podemos garantir.</span></div></div>; })}</div></div><div className="values-grid">{values.map(([title, desc]) => { const Icon = valueIconByTitle[title] || BadgeCheck; return <div className="value-card" key={title}><div className="value-icon"><Icon color="var(--accent-light)" size={20} strokeWidth={2.2} /></div><div className="value-title">{title}</div><div className="value-desc">{desc}</div></div>; })}</div></div></section></div></PlatformShell>;
}

export function PlatformContactPage() {
  return <PlatformShell title="Contato | Cote Juros"><div className="page active" id="page-contato"><InnerHero badge="Fale conosco" title={<>Entre em <span className="text-accent">contato</span></>} desc="Dúvidas, parcerias ou sugestões. Estamos aqui." /><section className="section-pad" style={{ background: 'var(--bg-surface)' }}><div className="container"><div className="contact-layout"><div><h3 style={{ marginBottom: 20 }}>Canais disponíveis</h3>{[['E-mail', 'contato@cotejuros.com.br'], ['Atendimento', 'Segunda a sexta, 9h às 18h'], ['Localização', 'Brasil - atendimento digital']].map(([label, item]) => { const Icon = contactIconByLabel[label] || BadgeCheck; return <div className="contact-card" key={item}><div className="contact-ico"><Icon color="var(--accent-light)" size={18} strokeWidth={2.2} /></div><div><div className="contact-val-label">{label}</div><div className="contact-val">{item}</div></div></div>; })}</div><form className="contact-form"><h3 style={{ marginBottom: 20 }}>Envie uma mensagem</h3><div className="form-row"><div className="form-group"><label className="form-label">Nome</label><input className="form-input" placeholder="Seu nome" /></div><div className="form-group"><label className="form-label">E-mail</label><input className="form-input" type="email" placeholder="seu@email.com" /></div></div><div className="form-group"><label className="form-label">Assunto</label><select className="form-input"><option>Dúvida geral</option><option>Parceria comercial</option><option>Sugestão</option><option>Reclamação</option></select></div><div className="form-group"><label className="form-label">Mensagem</label><textarea className="form-input" placeholder="Escreva sua mensagem aqui..." /></div><button className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: 13 }} type="button">Enviar mensagem</button></form></div></div></section></div></PlatformShell>;
}

export function PlatformLoginPage({ signup = false }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', lastName: '', cpf: '', email: '', password: '' });
  const [authState, setAuthState] = useState({ loading: false, error: '', pendingConfirmation: false });
  const submit = async (event) => {
    event.preventDefault();
    setAuthState({ loading: true, error: '', pendingConfirmation: false });
    try {
      await trackEvent('login_attempt', { sourcePage: signup ? '/criar-conta' : '/login' });
      const session = signup ? await registerCustomer(form) : await loginCustomer(form);
      if (signup && session?.pendingConfirmation) {
        setAuthState({ loading: false, error: '', pendingConfirmation: true });
        return;
      }
      if (session?.authenticated || session?.customer) {
        navigate('/dashboard');
        return;
      }
      setAuthState({ loading: false, error: 'Nao foi possivel confirmar a sessao agora.', pendingConfirmation: false });
    } catch (error) {
      setAuthState({ loading: false, error: error?.message || 'Nao foi possivel autenticar agora.', pendingConfirmation: false });
    }
  };
  return <PlatformShell title={`${signup ? 'Criar conta' : 'Login'} | Cote Juros`} bare><div className="page active" id={signup ? 'page-criar-conta' : 'page-login'}><div className="auth-page"><div className="auth-bg-orb" /><form className="auth-card" style={signup ? { maxWidth: 480 } : undefined} onSubmit={submit}><div className="auth-logo"><span className="logo-text"><span className="logo-primary">Cote</span><span className="logo-accent">Juros</span></span></div><div className="auth-title">{signup ? 'Criar conta grátis' : 'Acessar minha conta'}</div><div className="auth-sub">{signup ? 'Compare produtos financeiros e salve suas análises.' : 'Entre para ver suas comparações e ofertas salvas.'}</div>{authState.error ? <div className="api-ready-note" style={{ marginBottom: 14 }}>{authState.error}</div> : null}{authState.pendingConfirmation ? <div className="api-ready-note" style={{ marginBottom: 14 }}>Cadastro recebido. Confirme seu e-mail antes de acessar o painel.</div> : null}{signup ? <div className="form-row"><div className="form-group"><label className="form-label">Nome</label><input className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Seu nome" disabled={authState.loading} /></div><div className="form-group"><label className="form-label">Sobrenome</label><input className="form-input" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} placeholder="Sobrenome" disabled={authState.loading} /></div></div> : null}<div className="form-group"><label className="form-label">E-mail</label><input className="form-input" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="seu@email.com" disabled={authState.loading} /></div><div className="form-group"><label className="form-label">Senha</label><input className="form-input" type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder={signup ? 'Mínimo 8 caracteres' : '********'} disabled={authState.loading} /></div>{signup ? <div className="form-group"><label className="form-label">CPF</label><input className="form-input" value={form.cpf} onChange={(e) => setForm({ ...form, cpf: e.target.value })} placeholder="000.000.000-00" disabled={authState.loading} /></div> : <Link className="forgot-link" to="/login">Esqueci minha senha</Link>}<button className="btn-auth" disabled={authState.loading}>{authState.loading ? 'Aguarde...' : signup ? 'Criar conta' : 'Entrar'}</button><div className="auth-divider">{signup ? 'já tenho conta' : 'ou'}</div><div className="auth-signup-link">{signup ? <Link to="/login">Fazer login</Link> : <>Não tem conta? <Link to="/criar-conta">Criar conta grátis</Link></>}</div><div className="auth-disclaimer">{signup ? 'Ao criar sua conta você concorda com os Termos de Uso e Política de Privacidade.' : 'Acesso destinado a clientes e parceiros da Cote Juros.'}<br />A Cote Juros não é banco e não solicita senhas por e-mail ou WhatsApp.</div></form></div></div></PlatformShell>;
}

const DASHBOARD_OFFERS_KEY = 'cote_dashboard_offers';
const DASHBOARD_SETTINGS_KEY = 'cote_dashboard_settings';

const dashboardMockOffers = [
  { id: 'mock_creditas', title: 'Creditas - Crédito com garantia', type: 'Empréstimo com garantia', rate: 'Sob análise', description: 'Refinanciamento de imóvel ou veículo pode fazer sentido.' },
  { id: 'mock_ita', title: 'Itaú - Empréstimo Pessoal', type: 'Empréstimo', rate: '1,79%/mês', description: 'Até R$ 50.000 com análise do parceiro.' },
  { id: 'mock_nub', title: 'Nubank - Cartão Roxinho', type: 'Cartão', rate: 'Sem anuidade', description: 'Limite personalizável e app completo.' },
  { id: 'mock_por', title: 'Porto Seguro - Auto Completo', type: 'Seguro', rate: 'R$ 89/mês', description: 'Assistência 24h e carro reserva conforme plano.' },
  { id: 'mock_cef', title: 'Caixa - Financiamento Imóvel', type: 'Financiamento', rate: '9,5% ao ano', description: 'FGTS como entrada e prazo estendido.' }
];

const dashboardNavItems = [
  ['Visão geral', '/dashboard'],
  ['Radar de Crédito', '/dashboard/analise'],
  ['Ofertas', '/dashboard/ofertas'],
  ['Histórico', '/dashboard/historico'],
  ['Meu perfil', '/dashboard/perfil'],
  ['Configurações', '/dashboard/configuracoes']
];

const readLocalJson = (key, fallback = null) => {
  try {
    return JSON.parse(window.localStorage.getItem(key) || 'null') ?? fallback;
  } catch {
    return fallback;
  }
};

const writeLocalJson = (key, value) => {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Local persistence is best-effort.
  }
};

const normalizeOffer = (offer, index = 0) => ({
  id: offer?.id || `offer_${index}`,
  title: offer?.title || offer?.name || `Oferta ${index + 1}`,
  type: offer?.type || offer?.productType || 'Oferta',
  rate: offer?.rate || offer?.interestRate || offer?.cta || 'Consultar',
  description: offer?.description || offer?.subtitle || 'Condição sujeita à análise do parceiro.'
});

function useDashboardData(sourcePage = '/dashboard') {
  const isProduction = isProductionRuntime();
  const [lead, setLead] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [customerLoading, setCustomerLoading] = useState(true);
  const [customerError, setCustomerError] = useState('');
  const [creditasStatus, setCreditasStatus] = useState(null);
  const [offers, setOffers] = useState(() => (isProduction ? [] : readLocalJson(DASHBOARD_OFFERS_KEY, dashboardMockOffers).map((offer) => ({ ...offer, title: `[DEV] ${offer.title}` }))));
  const [offersLoading, setOffersLoading] = useState(true);
  const [offersError, setOffersError] = useState('');
  const [history, setHistory] = useState([]);

  useEffect(() => {
    let mounted = true;
    const localLead = getLeadFromLocalStorage();
    const localAnalysis = readLocalJson('cote_last_analysis') || readLocalJson('cote_quiz_result');
    const events = readLocalJson('cote_tracking_events', []);
    const storedCreditasStatus = getCreditasStatus();
    const creditFunnel = readLocalJson('cj.credit-funnel.v2');
    const simulationLeads = readLocalJson('cj.simulationLeads', []);
    const storedOffers = isProduction ? [] : readLocalJson(DASHBOARD_OFFERS_KEY, []);
    const normalizedAnalysis = localAnalysis || (localLead?.quizAnswers ? { quizAnswers: localLead.quizAnswers, recommendation: recommendProducts(localLead.quizAnswers) } : null);

    setCustomerLoading(true);
    setCustomerError('');
    setLead(localLead);
    setAnalysis(normalizedAnalysis);
    setCreditasStatus(storedCreditasStatus);
    setHistory([
      ...(storedCreditasStatus ? [{ id: 'creditas_status', title: 'Creditas', type: 'Parceira', createdAt: storedCreditasStatus.updatedAt, description: storedCreditasStatus.message || storedCreditasStatus.status || storedCreditasStatus.mode }] : []),
      ...(normalizedAnalysis ? [{ id: 'last_analysis', title: 'Análise mais recente', type: 'Radar', createdAt: normalizedAnalysis.createdAt || localLead?.updatedAt, description: normalizedAnalysis.recommendation?.mainProduct || normalizedAnalysis.recommendation?.profile }] : []),
      ...(localLead ? [{ id: 'lead', title: 'Lead salvo localmente', type: 'Perfil', createdAt: localLead.updatedAt || localLead.createdAt, description: localLead.recommendation?.mainProduct || 'Dados do quiz salvos' }] : []),
      ...(creditFunnel ? [{ id: 'credit_funnel', title: 'Simulação de crédito', type: 'Simulação', createdAt: creditFunnel.updatedAt || creditFunnel.createdAt, description: creditFunnel.step ? `Etapa ${creditFunnel.step}` : 'Funil de crédito salvo' }] : []),
      ...simulationLeads.slice(-5).reverse().map((item, index) => ({ id: item.id || `simulation_${index}`, title: item.fullName || 'Simulação local', type: item.productType || 'Simulação', createdAt: item.updatedAt || item.createdAt, description: item.status || item.originPage || 'Lead de simulação' })),
      ...events.slice(-5).reverse().map((event, index) => ({ id: `event_${index}`, title: event.name || 'Evento', type: 'Atividade', createdAt: event.createdAt, description: event.data?.sourcePage || event.mode || 'Registro local' }))
    ]);

    if (storedOffers?.length) setOffers(storedOffers.map((offer, index) => normalizeOffer({ ...offer, title: `[DEV] ${offer.title || offer.name || `Oferta ${index + 1}`}` }, index)));

    getCurrentCustomer()
      .then((session) => {
        if (!mounted) return;
        setCustomerLoading(false);
        setCustomer(session?.customer || null);
      })
      .catch((error) => {
        if (!mounted) return;
        setCustomerLoading(false);
        setCustomerError(error?.message || 'Nao foi possivel carregar a sessao.');
        setCustomer(null);
      });

    setOffersLoading(true);
    setOffersError('');
    Promise.allSettled([
      getCreditOffers({ sourcePage }),
      getCardOffers({ sourcePage }),
      getFinancingOffers({ sourcePage }),
      getInsuranceOffers()
    ]).then((results) => {
      if (!mounted) return;
      const apiOffers = results.flatMap((result) => (result.status === 'fulfilled' && Array.isArray(result.value) ? result.value : []));
      const failed = results.some((result) => result.status === 'rejected');
      const normalized = apiOffers.length
        ? [...(!isProduction ? [buildCreditasOffer()] : []), ...apiOffers].filter(Boolean).map(normalizeOffer)
        : (isProduction ? [] : dashboardMockOffers.map((offer) => ({ ...offer, title: `[DEV] ${offer.title}` })).map(normalizeOffer));
      setOffers(normalized);
      setOffersLoading(false);
      setOffersError(failed && isProduction ? 'Nao foi possivel carregar ofertas agora.' : '');
      if (!isProduction) writeLocalJson(DASHBOARD_OFFERS_KEY, normalized);
    });

    trackEvent('dashboard_opened', { sourcePage, leadId: localLead?.backendLeadId });
    return () => {
      mounted = false;
    };
  }, [isProduction, sourcePage]);

  const recommendation = analysis?.recommendation || lead?.recommendation || recommendProducts(lead?.quizAnswers || {});
  const score = recommendation?.score || analysis?.score || lead?.score || 740;

  return { lead, analysis, customer, customerLoading, customerError, offers, offersLoading, offersError, history, recommendation, score, creditasStatus, isProduction };
}

function DashboardLayout({ children, title = 'Dashboard | Cote Juros' }) {
  const location = useLocation();
  const navigate = useNavigate();
  const activePath = location.pathname;

  const signOut = async () => {
    await logoutCustomer();
    navigate('/login');
  };

  return (
    <PlatformShell title={title} bare>
      <div className="page active" id="page-dashboard">
        <div className="dashboard-layout">
          <aside className="dash-sidebar">
            <div className="dash-sidebar-logo"><span className="logo-text"><span className="logo-primary">Cote</span><span className="logo-accent">Juros</span></span></div>
            <ul className="dash-menu">
              {dashboardNavItems.map(([label, path]) => (
                <li key={path}>
                  <Link className={`dash-menu-item ${activePath === path ? 'active' : ''}`} to={path}>{label}</Link>
                </li>
              ))}
              <li><button type="button" className="dash-menu-item" onClick={signOut}>Sair</button></li>
            </ul>
          </aside>
          <main className="dash-content">{children}</main>
        </div>
      </div>
    </PlatformShell>
  );
}

function DashboardHeader({ title, subtitle }) {
  return (
    <>
      <div className="dash-greeting">{title}</div>
      <div className="dash-sub">{subtitle}</div>
    </>
  );
}

function EmptyDashboardState({ title, copy }) {
  return (
    <div className="dashboard-api-card" style={{ textAlign: 'center' }}>
      <div className="dash-panel-title">{title}</div>
      <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.7, marginBottom: 18 }}>{copy}</p>
      <Link className="btn-primary" to="/quiz">Refazer análise</Link>
    </div>
  );
}

function DashboardOfferRows({ offers = [], compact = false }) {
  return (
    <>
      {offers.map((offer, index) => (
        <div className="offer-row" key={offer.id || `${offer.title}-${index}`}>
          <div>
            <div className="offer-name">{offer.title}</div>
            <div className="offer-type">{offer.type} · {offer.description}</div>
          </div>
          <div className="offer-rate">{offer.rate}</div>
          {!compact ? <Link className="btn-primary" style={{ fontSize: 12, padding: '7px 14px' }} to="/comparar">Ver</Link> : null}
        </div>
      ))}
    </>
  );
}

export function DashboardHomePage() {
  const data = useDashboardData('/dashboard');
  const { recommendation, score, offers, history, creditasStatus, offersLoading, offersError } = data;

  return (
    <DashboardLayout>
      <DashboardHeader title="Bem-vindo ao seu painel" subtitle="Seu painel está atualizado. Confira suas opções e análises." />
      <div className="dash-stats-row">
        <Stat label="Score estimado" value={score} color="var(--accent-light)" />
        <Stat label="Opções ativas" value={offers.length} />
        <Stat label="Melhor taxa" value={offers[0]?.rate || '—'} color="var(--success)" />
        <Stat label="Histórico" value={history.length} />
      </div>
      <div className="dash-panels">
        <div className="dash-panel"><div className="dash-panel-title">Resumo da análise</div><p style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>{recommendation?.explanation || 'Ainda não há análise completa. Faça o quiz para gerar uma recomendação personalizada.'}</p><div className="api-ready-note" style={{ marginTop: 18 }}>{recommendation?.mainProduct || 'Recomendação pendente'}</div></div>
        <div className="dash-panel"><div className="dash-panel-title">Radar de Crédito</div>{[['Empréstimo pessoal', '85%', 'var(--accent)'], ['Cartão de crédito', '70%', '#22D3A0'], ['Financiamento', '55%', '#F59E0B'], ['Seguros', '93%', '#F43F5E']].map(([label, pct, color]) => <div className="dash-radar-row" key={label}><div><span>{label}</span><span style={{ color }}>{pct}</span></div><div><i style={{ width: pct, background: color }} /></div></div>)}<Link className="btn-outline" style={{ width: '100%', justifyContent: 'center', marginTop: 20 }} to="/dashboard/analise">Ver análise completa</Link></div>
      </div>
      {creditasStatus ? <div className="dashboard-api-card" style={{ marginTop: 22 }}><div className="dash-panel-title">Status Creditas</div><p style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>{creditasStatus.message || 'Dados complementares pendentes'}</p><div className="api-ready-note" style={{ marginTop: 14 }}>{creditasStatus.status || creditasStatus.mode}</div></div> : null}
      <div className="dashboard-api-card" style={{ marginTop: 22 }}><div className="dash-panel-title">Ofertas para seu perfil</div>{offersLoading ? <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>Carregando ofertas...</p> : offers.length ? <DashboardOfferRows offers={offers.slice(0, 4)} /> : <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>{offersError || 'Nenhuma oferta disponível agora.'}</p>}<div className="partner-cta-row" style={{ marginTop: 18 }}><Link className="btn-primary" to="/dashboard/ofertas">Ver todas as ofertas</Link><Link className="btn-outline" to="/quiz">Refazer análise</Link></div></div>
    </DashboardLayout>
  );
}

export function DashboardAnalysisPage() {
  const { lead, analysis, recommendation, score } = useDashboardData('/dashboard/analise');
  const answers = analysis?.quizAnswers || lead?.quizAnswers || {};
  const answerRows = Object.entries(answers);

  return (
    <DashboardLayout title="Análise | Cote Juros">
      <DashboardHeader title="Análise do perfil" subtitle="Dados do quiz e leitura financeira do seu momento." />
      <div className="dash-stats-row"><Stat label="Score estimado" value={score} color="var(--accent-light)" /><Stat label="Perfil" value={recommendation?.profile || 'moderado'} /><Stat label="Produto principal" value={recommendation?.mainProduct ? 'ativo' : 'pendente'} /><Stat label="Origem" value={lead?.source || 'quiz'} /></div>
      {answerRows.length ? <div className="dashboard-api-card"><div className="dash-panel-title">Dados do quiz</div><div className="dashboard-api-grid" style={{ gridTemplateColumns: 'repeat(2,minmax(0,1fr))' }}>{answerRows.map(([key, value]) => <div className="dashboard-api-item" key={key}><strong>{key}</strong><span>{String(value)}</span></div>)}</div></div> : <EmptyDashboardState title="Nenhum quiz encontrado" copy="Responda o quiz para salvar seu perfil financeiro e gerar recomendações mais úteis." />}
      <div className="dash-panel" style={{ marginTop: 22 }}><div className="dash-panel-title">Recomendação</div><p style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>{recommendation?.explanation}</p><div className="partner-cta-row" style={{ marginTop: 18 }}><Link className="btn-primary" to="/dashboard/ofertas">Ver ofertas compatíveis</Link><Link className="btn-outline" to="/quiz">Atualizar respostas</Link></div></div>
    </DashboardLayout>
  );
}

export function DashboardOffersPage() {
  const { offers, offersLoading, offersError, isProduction } = useDashboardData('/dashboard/ofertas');
  return (
    <DashboardLayout title="Ofertas | Cote Juros">
      <DashboardHeader title="Ofertas para seu perfil" subtitle={isProduction ? 'Produtos carregados pela API.' : 'DEV: produtos podem usar fallback local sinalizado.'} />
      {offersLoading ? <div className="dashboard-api-card"><div className="dash-panel-title">Carregando ofertas</div></div> : offers.length ? <div className="dashboard-api-card"><div className="dash-panel-title">Opções disponíveis</div><DashboardOfferRows offers={offers} /></div> : <EmptyDashboardState title="Nenhuma oferta disponível" copy={offersError || 'Ainda não encontramos ofertas disponíveis para seu perfil.'} />}
    </DashboardLayout>
  );
}

export function DashboardHistoryPage() {
  const { history } = useDashboardData('/dashboard/historico');
  return (
    <DashboardLayout title="Histórico | Cote Juros">
      <DashboardHeader title="Histórico" subtitle="Registros locais de análises, leads e interações recentes." />
      {history.length ? <div className="dashboard-api-card dashboard-history-list"><div className="dash-panel-title">Atividades recentes</div><div className="dashboard-api-grid">{history.map((item) => <div className="dashboard-api-item" key={item.id}><strong>{item.title}</strong><span>{item.type} · {item.createdAt ? new Date(item.createdAt).toLocaleString('pt-BR') : 'sem data'}</span><span>{item.description}</span></div>)}</div></div> : <EmptyDashboardState title="Histórico vazio" copy="Quando você fizer uma análise, simulação ou salvar ofertas, os registros aparecerão aqui." />}
    </DashboardLayout>
  );
}

export function DashboardProfilePage() {
  const { customer, customerLoading, customerError, lead, isProduction } = useDashboardData('/dashboard/perfil');
  const profile = customer || (!isProduction ? { name: lead?.name || lead?.fullName || 'Cliente Cote Juros', email: lead?.email || 'cliente@cotejuros.com.br' } : null);
  return (
    <DashboardLayout title="Perfil | Cote Juros">
      <DashboardHeader title="Meu perfil" subtitle={isProduction ? 'Dados de usuario via authAdapter.' : 'DEV: dados podem usar perfil local sinalizado.'} />
      <div className="dashboard-api-card"><div className="dash-panel-title">Dados cadastrais</div>{customerLoading ? <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>Carregando sessão...</p> : customerError ? <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>{customerError}</p> : profile ? <div className="dashboard-api-grid" style={{ gridTemplateColumns: 'repeat(2,minmax(0,1fr))' }}><div className="dashboard-api-item"><strong>Nome</strong><span>{profile.name}</span></div><div className="dashboard-api-item"><strong>E-mail</strong><span>{profile.email}</span></div><div className="dashboard-api-item"><strong>Telefone</strong><span>{lead?.phone || lead?.whatsapp || 'Não informado'}</span></div><div className="dashboard-api-item"><strong>Status</strong><span>{customer ? 'sessão ativa' : 'perfil local DEV'}</span></div></div> : <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>Sessão de cliente não encontrada.</p>}<div className="partner-cta-row" style={{ marginTop: 18 }}><Link className="btn-primary" to="/quiz">Atualizar perfil financeiro</Link></div></div>
    </DashboardLayout>
  );
}

export function DashboardSettingsPage() {
  const [settings, setSettings] = useState(() => readLocalJson(DASHBOARD_SETTINGS_KEY, { email: true, whatsapp: false, analytics: true }));
  const toggle = (key) => setSettings((current) => {
    const next = { ...current, [key]: !current[key] };
    writeLocalJson(DASHBOARD_SETTINGS_KEY, next);
    trackEvent('dashboard_setting_changed', { setting: key, value: next[key], sourcePage: '/dashboard/configuracoes' });
    return next;
  });

  return (
    <DashboardLayout title="Configurações | Cote Juros">
      <DashboardHeader title="Configurações" subtitle="Preferências locais para comunicação e experiência." />
      <div className="dashboard-api-card"><div className="dash-panel-title">Preferências</div>{[['email', 'Receber atualizações por e-mail'], ['whatsapp', 'Receber alertas por WhatsApp'], ['analytics', 'Permitir cookies de análise']].map(([key, label]) => <div className="offer-row" key={key}><div><div className="offer-name">{label}</div><div className="offer-type">Preferência salva localmente</div></div><button type="button" className={`filter-tab ${settings[key] ? 'active' : ''}`} onClick={() => toggle(key)}>{settings[key] ? 'Ativo' : 'Inativo'}</button></div>)}</div>
    </DashboardLayout>
  );
}

export const PlatformDashboardPage = DashboardHomePage;
