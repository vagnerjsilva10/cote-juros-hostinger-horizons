import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import SmartQuiz from '@/components/smart-quiz/SmartQuiz.jsx';
import { getBlogArticleBySlug, getBlogArticles } from '@/platform/services/blogAdapter.js';
import { getCardOffers, getCreditOffers, getFinancingOffers, getInsuranceOffers } from '@/platform/services/offerAdapter.js';
import { getCurrentCustomer, loginCustomer, logoutCustomer } from '@/platform/services/authAdapter.js';
import { getLeadFromLocalStorage } from '@/platform/services/leadAdapter.js';
import { recommendProducts } from '@/platform/services/recommendationAdapter.js';
import { trackEvent } from '@/platform/services/trackingAdapter.js';
import '@/platform/platformHtml.css';

const productRows = [
  ['Banco Itaú', 'Empréstimo Pessoal', '1,79%', 'ao mês', ['Até R$ 50.000', 'Até 60 parcelas', 'Análise do parceiro'], 'ITA', 'Empréstimo', 'badge-loan', 'loan'],
  ['Nubank', 'Cartão Roxinho', 'Sem', 'anuidade', ['Cashback em compras', 'App completo', 'Limite personalizável'], 'NUB', 'Cartão', 'badge-card', 'card'],
  ['Caixa Econômica', 'Financiamento Imóvel', '9,5%', 'ao ano', ['FGTS como entrada', 'Até 35 anos', 'Minha Casa Minha Vida'], 'CEF', 'Financiamento', 'badge-finance', 'financing'],
  ['Porto Seguro', 'Auto Completo', 'A partir', 'R$ 89/mês', ['Carro reserva incluso', 'Assistência 24h', 'App de acionamento'], 'POR', 'Seguro Auto', 'badge-insurance', 'insurance'],
  ['Santander', 'Crédito Pessoal', '2,05%', 'ao mês', ['Até R$ 30.000', '48 parcelas', 'Proposta online'], 'SAN', 'Empréstimo', 'badge-loan', 'loan'],
  ['C6 Bank', 'C6 Carbono', 'Milhas', '+ benefícios', ['1 ponto por real', 'Sala VIP aeroporto', 'Anuidade isenta'], 'C6', 'Cartão', 'badge-card', 'card']
];

const compareFilters = [
  ['all', 'Todos'],
  ['loan', 'Empréstimos'],
  ['card', 'Cartões'],
  ['financing', 'Financiamentos'],
  ['insurance', 'Seguros']
];

const blogCards = [
  ['Empréstimos', 'Como escolher um empréstimo pessoal sem cair em armadilhas', 'Entenda o que avaliar antes de assinar: CET, prazo, parcela e reputação do parceiro.', '15 min de leitura', 'Crédito', 'linear-gradient(135deg,#1a0533,#2d1065)'],
  ['Cartões', 'Cartão com cashback ou milhas: qual vale mais para o seu perfil?', 'A resposta depende dos seus hábitos de consumo. Veja como calcular o retorno real.', '8 min de leitura', 'Cartões', 'linear-gradient(135deg,#052918,#0a4d2e)'],
  ['Seguros', 'Seguro de vida: quando contratar e o que realmente cobre', 'Morte acidental, invalidez permanente e outros pontos essenciais que muita gente ignora.', '10 min', 'Seguros', 'linear-gradient(135deg,#1a0a05,#4d2210)'],
  ['Planejamento', '5 formas de sair do vermelho sem comprometer o salário inteiro', 'Estratégias reais para reorganizar as finanças sem cortar tudo de uma vez.', '12 min', 'Planejamento', 'linear-gradient(135deg,#0a1a33,#103055)'],
  ['Financiamento', 'Financiamento imobiliário: o que ninguém te conta antes de assinar', 'CET, IPCA atrelado, prazo real e custos cartoriais. O que realmente importa.', '9 min', 'Financiamento', 'linear-gradient(135deg,#1a1a05,#3d3d0a)'],
  ['Crédito', 'Score de crédito: mitos, verdades e como melhorar o seu', 'O que realmente afeta sua pontuação e ações práticas para melhorá-la com consistência.', '7 min', 'Crédito', 'linear-gradient(135deg,#1a0533,#330a4d)']
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

function ArrowIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}

function CheckIcon({ color = '#22D3A0', size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function PlatformHeader() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const nav = [
    ['Início', '/'],
    ['Comparar', '/comparar'],
    ['Radar de Crédito', '/radar'],
    ['Blog', '/blog']
  ];

  return (
    <>
      <header id="main-header">
        <div className="header-inner">
          <Link to="/" className="logo">
            <span className="logo-text"><span className="logo-primary">Cote</span><span className="logo-accent">Juros</span></span>
          </Link>
          <nav>
            {nav.map(([label, href]) => (
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
        {nav.map(([label, href]) => <Link key={href} className="nav-link" to={href} onClick={() => setOpen(false)}>{label}</Link>)}
      </div>
    </>
  );
}

function PlatformFooter() {
  return (
    <footer>
      <div className="container">
        <div className="footer-top">
          <div className="footer-brand">
            <div className="footer-brand-name"><span className="logo-text"><span className="logo-primary">Cote</span><span className="logo-accent">Juros</span></span></div>
            <div className="footer-tagline">Plataforma brasileira de comparação de crédito, cartões, financiamentos e seguros.</div>
            <div className="api-ready-note">A Cote Juros não é uma instituição financeira e não concede crédito diretamente. Não cobramos valores antecipados.</div>
          </div>
          <FooterCol title="Cote Juros" links={[['Sobre nós', '/sobre'], ['Contato', '/contato'], ['FAQ', '/faq'], ['Blog', '/blog']]} />
          <FooterCol title="Comparar" links={[['Empréstimos', '/comparar'], ['Cartões', '/comparar'], ['Financiamentos', '/comparar'], ['Seguros', '/seguros']]} />
          <FooterCol title="Seguros" links={[['Seguro Auto', '/seguro-auto'], ['Seguro Viagem', '/seguro-viagem'], ['Seguro de Vida', '/seguro-vida'], ['Seguro Residencial', '/seguros']]} />
          <FooterCol title="Área do cliente" links={[['Entrar', '/login'], ['Criar conta', '/criar-conta'], ['Minha conta', '/dashboard'], ['Política de privacidade', '/politica-de-privacidade']]} />
        </div>
        <div className="footer-bottom">
          <div className="footer-legal">2025 Cote Juros. A Cote Juros não é banco, não concede crédito e não garante aprovação. Sujeito à análise dos parceiros. Informações sujeitas a alteração.</div>
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            <Link style={{ fontSize: 12, color: 'var(--text-muted)' }} to="/termos-de-uso">Termos de uso</Link>
            <Link style={{ fontSize: 12, color: 'var(--text-muted)' }} to="/politica-de-privacidade">Privacidade</Link>
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
  return (
    <div className="cj-platform">
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
          <div className="mini-card"><div className="mini-card-label">Melhor taxa</div><div className="mini-card-value">1,79%</div><div className="mini-card-change"><CheckIcon size={10} /> ao mês</div></div>
          <div className="mini-card"><div className="mini-card-label">Opções</div><div className="mini-card-value">12</div><div className="mini-card-change"><CheckIcon size={10} /> parceiros</div></div>
        </div>
      </div>
      <div className="float-chip float-chip-1"><div className="float-dot" style={{ background: '#22D3A0' }} /> Empréstimo aprovado</div>
      <div className="float-chip float-chip-2"><div className="float-dot" style={{ background: '#7C6EF7' }} /> Cartão sem anuidade</div>
    </div>
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
                <div className="hero-badge"><div className="hero-badge-dot" /> Plataforma de comparação financeira</div>
                <h1 className="hero-title">Compare crédito, cartões e seguros <span className="gradient-text">com clareza</span></h1>
                <p className="hero-desc">Responda algumas perguntas e veja caminhos que podem fazer sentido para o seu perfil — sem cobrança antecipada e sem promessa de aprovação.</p>
                <div className="hero-actions">
                  <Link className="btn-hero" to="/comparar">Ver caminhos para meu perfil <ArrowIcon size={16} /></Link>
                  <Link className="btn-hero-outline" to="/radar">Radar de Crédito</Link>
                </div>
                <div className="hero-trust">
                  {['Sem cobranças antecipadas', 'Dados protegidos (LGPD)', 'Transparência total'].map((item) => <div className="hero-trust-item" key={item}><CheckIcon /> {item}</div>)}
                </div>
              </div>
              <HeroDashboard />
            </div>
          </div>
        </section>
        <TrustStrip />
        <HowItWorks />
        <RadarHome />
        <CompareHome />
        <CategoriesHome />
        <InsuranceHome />
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
        {['Dados protegidos pela LGPD', 'Resultado em minutos', 'Sem custo para comparar', 'Parceiros verificados'].map((item) => (
          <div className="trust-item" key={item}><div className="trust-icon-wrap"><CheckIcon color="#9C8FFF" size={16} /></div>{item}</div>
        ))}
      </div></div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    ['01', 'Você informa seu perfil', 'Renda, finalidade e situação do nome. Rápido, sem burocracia.'],
    ['02', 'Organizamos as possibilidades', 'Nosso Radar cruza seu perfil com os parceiros disponíveis.'],
    ['03', 'Você compara antes de decidir', 'Taxas, condições e coberturas lado a lado. Sem letra miúda.'],
    ['04', 'Segue para o parceiro quando fizer sentido', 'Você escolhe. A Cote Juros nunca força uma decisão.']
  ];
  return (
    <section id="how-it-works" className="section-pad">
      <div className="container">
        <div style={{ textAlign: 'center', maxWidth: 520, margin: '0 auto' }}><div className="section-label" style={{ justifyContent: 'center' }}>Como funciona</div><h2 style={{ color: 'var(--light-text)', marginBottom: 14 }}>Da busca à decisão, em 4 passos</h2><p className="section-desc" style={{ margin: '0 auto', textAlign: 'center' }}>Processo simples, transparente e sem compromisso. Você compara com informação, não com promessa.</p></div>
        <div className="steps-grid">{steps.map(([num, title, desc], index) => <div className="step-card reveal" style={{ transitionDelay: `${index / 10}s` }} key={num}><div className="step-num">{num}</div><div className="step-icon-wrap"><CheckIcon color="currentColor" size={22} /></div><div className="step-title">{title}</div><div className="step-desc">{desc}</div></div>)}</div>
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
            {['Análise do perfil financeiro', 'Indicadores de elegibilidade por produto', 'Caminhos possíveis sem compromisso', 'Resultado em minutos'].map((item) => <li key={item}><span><CheckIcon color="#9C8FFF" size={10} /></span>{item}</li>)}
          </ul>
          <Link className="btn-primary" to="/radar">Acessar Radar de Crédito <ArrowIcon /></Link>
        </div>
        <RadarCard />
      </div></div>
    </section>
  );
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
  return <div className="elig-row"><div className="elig-icon-w"><CheckIcon color={color} /></div><span className="elig-label">{label}</span><div className="elig-bar-sm"><div className="elig-bar-sm-fill" style={{ width: pct, background: color }} /></div><span className="elig-pct-val" style={{ color }}>{pct}</span></div>;
}

function CompareHome() {
  const [activeFilter, setActiveFilter] = useState('all');
  const visibleProducts = useMemo(() => {
    if (activeFilter === 'all') return productRows;
    return productRows.filter((row) => {
      const type = row[8];
      if (activeFilter === 'loan') return type === 'loan' || type === 'guarantee';
      return type === activeFilter;
    });
  }, [activeFilter]);

  return (
    <section id="compare-home" className="section-pad" style={{ background: 'var(--light-bg)' }}>
      <div className="container">
        <div style={{ textAlign: 'center', maxWidth: 520, margin: '0 auto' }}><div className="section-label" style={{ justifyContent: 'center', color: 'var(--accent-dark)' }}>Marketplace financeiro</div><h2 style={{ color: 'var(--light-text)', marginBottom: 12 }}>Compare e escolha<br />com mais segurança</h2><p className="section-desc" style={{ margin: '0 auto', textAlign: 'center', color: 'var(--light-muted)' }}>Taxas, condições e benefícios lado a lado. Você compara sem pressão.</p></div>
        <div className="adsense-placeholder"><span>Publicidade</span></div>
        <div className="filter-tabs">
          {compareFilters.map(([value, label]) => <button key={value} type="button" className={`filter-tab ${activeFilter === value ? 'active' : ''}`} aria-pressed={activeFilter === value} onClick={() => setActiveFilter(value)}>{label}</button>)}
        </div>
        <div className="products-grid">{visibleProducts.map((row) => <ProductCard key={`${row[0]}-${row[1]}`} row={row} />)}</div>
      </div>
    </section>
  );
}

function ProductCard({ row }) {
  const [bank, product, rate, unit, tags, , badge, badgeClass] = row;
  return (
    <div className="product-card">
      <div className={`card-badge ${badgeClass}`}>{badge}</div><div className="card-bank-name">{bank}</div><div className="card-product-name">{product}</div>
      <div className="card-rate-row"><span className="rate-value">{rate}</span><span className="rate-unit">{unit}</span></div>
      <div className="card-features">{tags.map((tag) => <div className="card-feat" key={tag}><div className="feat-dot" />{tag}</div>)}</div>
      <button className="card-cta">Ver condições <ArrowIcon /></button>
    </div>
  );
}

function CategoriesHome() {
  return <section id="categories" className="section-pad"><div className="container"><div style={{ textAlign: 'center', maxWidth: 520, margin: '0 auto' }}><div className="section-label" style={{ justifyContent: 'center', color: 'var(--accent-dark)' }}>O que você precisa</div><h2 style={{ color: 'var(--light-text)', marginBottom: 12 }}>Encontre o produto<br />certo para você</h2></div><div className="categories-grid">{categoryCards.map(([title, desc, label, href, color], index) => <Link className="category-card reveal" style={{ transitionDelay: `${(index % 3) / 10}s` }} key={title} to={href}><div className="cat-icon" style={{ background: color === 'var(--accent)' ? 'rgba(124,110,247,0.1)' : `${color}1A` }}><CheckIcon color={color} size={22} /></div><div><div className="cat-title">{title}</div><div className="cat-desc">{desc}</div></div><div className="cat-link" style={{ color }}>{label}<ArrowIcon /></div></Link>)}</div></div></section>;
}

function InsuranceHome() {
  return <section id="seguros-home" className="section-pad section-surface"><div className="container"><div className="seguros-inner"><div className="section-label" style={{ justifyContent: 'center' }}>Nova vertical</div><h2 style={{ marginBottom: 12 }}>Seguros que <span className="text-accent">protegem de verdade</span></h2><p className="section-desc" style={{ margin: '0 auto', textAlign: 'center' }}>Compare coberturas, entenda diferenças e escolha com mais segurança. Sem jargões.</p></div><InsuranceGrid /></div></section>;
}

function InsuranceGrid() {
  return <div className="seguros-grid">{insuranceCards.map(([name, desc, href, cta]) => <Link className="seguro-card" key={name} to={href}><div className="seg-icon"><CheckIcon color="currentColor" size={20} /></div><div className="seg-name">{name}</div><div className="seg-desc">{desc}</div><div className="seg-link">{cta} <ArrowIcon size={12} /></div></Link>)}</div>;
}

function BlogHome() {
  return <section id="blog-home" className="section-pad" style={{ background: 'var(--light-bg)' }}><div className="container"><div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20 }}><div><div className="section-label" style={{ color: 'var(--accent-dark)' }}>Educação financeira</div><h2 style={{ color: 'var(--light-text)' }}>Conteúdo para decidir<br />com mais consciência</h2></div><Link className="btn-outline" style={{ borderColor: 'var(--accent-dark)', color: 'var(--accent-dark)' }} to="/blog">Ver todos os artigos</Link></div><div className="adsense-placeholder" style={{ marginTop: 28 }}><span>Publicidade</span></div><BlogGrid count={3} /></div></section>;
}

function BlogGrid({ count = 3 }) {
  return <div className="blog-grid">{blogCards.slice(0, count).map(([cat, title, excerpt, time, topic, bg]) => <Link className="blog-card" key={title} to="/blog/como-escolher-emprestimo-pessoal"><div className="blog-img" style={{ background: bg }}><div className="blog-cat-badge">{cat}</div></div><div className="blog-content"><div className="blog-meta"><span>{time}</span><span>•</span><span>{topic}</span></div><div className="blog-title">{title}</div><div className="blog-excerpt">{excerpt}</div></div></Link>)}</div>;
}

function Compliance() {
  return <section id="compliance" className="section-pad-sm"><div className="container"><div className="compliance-grid">{['Não somos uma instituição financeira. Apenas comparamos e conectamos.', 'Não cobramos nenhum valor antecipado para análise de crédito.', 'A aprovação depende da análise individual de cada parceiro.', 'Seus dados são protegidos em conformidade com a LGPD.'].map((text) => <div className="comp-item" key={text}><div className="comp-ico"><CheckIcon color="currentColor" size={16} /></div><div className="comp-text">{text}</div></div>)}</div></div></section>;
}

function FinalCta() {
  return <section id="cta-final" className="section-pad"><div className="container"><div className="cta-wrap"><div className="cta-glow" /><div className="section-label" style={{ justifyContent: 'center' }}>Comece agora</div><h2 className="cta-title">Pronto para <span className="text-accent">comparar</span><br />com mais clareza?</h2><p className="cta-desc">Sem compromisso. Sem cobrança. Em minutos você vê caminhos possíveis para o seu perfil.</p><div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}><Link className="btn-hero" to="/comparar">Ver caminhos para meu perfil <ArrowIcon size={16} /></Link><Link className="btn-hero-outline" to="/criar-conta">Criar conta grátis</Link></div></div></div></section>;
}

function InnerHero({ badge, title, desc, action }) {
  return <div className="inner-hero"><div className="container"><div className="inner-hero-badge">{badge}</div><h1>{title}</h1><p className="section-desc">{desc}</p>{action}</div></div>;
}

export function PlatformComparePage() {
  const [offers, setOffers] = useState([]);
  useEffect(() => { Promise.all([getCreditOffers({ rank: true }), getCardOffers({ rank: true }), getFinancingOffers({ rank: true })]).then((groups) => setOffers(groups.flat().filter(Boolean))); }, []);
  const rows = offers.length ? offers.slice(0, 4).map((offer) => [offer.bankName || 'Parceiro', offer.title || offer.productName || 'Produto financeiro', offer.monthlyRate ? `${offer.monthlyRate}%` : offer.annualFee === 0 ? 'R$0' : 'Sob análise', offer.annualFee === 0 ? 'anuidade' : 'ao mês', ['Online', 'Parceiro verificado'], offer.bankName || 'CJ']) : productRows.map(([bank, product, rate, unit, tags, logo]) => [bank, product, rate, unit, tags, logo]);
  return <PlatformShell title="Comparar produtos | Cote Juros"><div className="page active" id="page-compare"><InnerHero badge="Marketplace" title={<>Compare produtos<br /><span className="text-accent">financeiros</span></>} desc="Taxas, condições e coberturas lado a lado. Você decide quando e se avançar." action={<div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 24 }}><Link className="btn-primary" to="/radar">Acessar Radar de Crédito</Link><button className="btn-outline">Ver mais filtros</button></div>} /><section className="section-pad" style={{ background: 'var(--bg-surface)' }}><div className="container"><div className="compare-layout"><FilterSidebar /><div><div className="adsense-placeholder-dark" style={{ marginBottom: 20 }}><span>Publicidade</span></div><div className="compare-results">{rows.map(([bank, title, rate, unit, tags, logo]) => <CompareResult key={`${bank}-${title}`} title={`${bank} - ${title}`} subtitle="Parceiro verificado" rate={rate} desc={unit} tags={tags} logo={logo} />)}</div><div className="api-ready-note">As condições exibidas são ilustrativas e podem variar conforme perfil e disponibilidade dos parceiros. A Cote Juros não é banco e não concede crédito diretamente.</div></div></div></div></section></div></PlatformShell>;
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
  return <PlatformShell title="Quiz inteligente | Cote Juros"><div className="page active" id="page-quiz"><InnerHero badge="Análise gratuita" title={<>Descubra qual caminho combina melhor com seu <span className="text-accent">momento financeiro</span></>} desc="Responda algumas perguntas e veja caminhos que podem fazer sentido para o seu perfil. Sem cobranças antecipadas e sem promessa de aprovação." /><section className="section-pad" style={{ background: 'var(--bg-surface)' }}><div className="container"><div className="quiz-shell"><div><SmartQuiz /></div><aside className="creditas-card"><div className="section-label">Funil preparado</div><h3 style={{ marginBottom: 10 }}>Quiz - resultado - lead - parceiro/API</h3><div className="quiz-side-list">{['Crédito com garantia', 'Seguros', 'Cartões', 'Compliance'].map((item) => <div className="quiz-side-item" key={item}><strong>{item}</strong><span>Rota preparada para adapters existentes, sem prometer aprovação.</span></div>)}</div></aside></div></div></section></div></PlatformShell>;
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
  return <PlatformShell title={`${badge} | Cote Juros`}><div className="page active" id={`page-${type}`}><InnerHero badge={badge} title={title} desc={desc} action={type !== 'seguros' ? <button className="btn-primary" style={{ marginTop: 24 }}>Cotar {badge.toLowerCase()}</button> : null} /><section className="section-pad" style={{ background: 'var(--bg-surface)' }}><div className="container">{type === 'seguros' ? <div className="seguros-grid">{gridOffers.map(([name, description, href, cta]) => <Link className="seguro-card" key={name} to={href}><div className="seg-icon"><CheckIcon color="currentColor" size={20} /></div><div className="seg-name">{name}</div><div className="seg-desc">{description}</div><div className="seg-link">{cta} <ArrowIcon size={12} /></div></Link>)}</div> : <div className="coverage-grid">{detailCards.map(([name, description]) => <div className="coverage-card" key={name}><div className="coverage-title">{name}</div><div className="coverage-desc">{description}</div></div>)}</div>}<div className="api-ready-note" style={{ marginTop: 24 }}>As condições variam por seguradora. Consulte o parceiro escolhido para cobertura exata.</div></div></section></div></PlatformShell>;
}

function LegacyPlatformBlogPage() {
  return <PlatformShell title="Blog | Cote Juros"><div className="page active" id="page-blog"><InnerHero badge="Conteúdo" title={<>Educação <span className="text-accent">financeira</span></>} desc="Artigos, guias e análises para você tomar decisões com mais consciência e menos pressa." /><section className="section-pad" style={{ background: 'var(--light-bg)' }}><div className="container"><div className="adsense-placeholder"><span>Publicidade</span></div><div className="filter-tabs" style={{ marginBottom: 28, marginTop: 0 }}>{['Todos', 'Crédito', 'Cartões', 'Seguros', 'Planejamento', 'Financiamento'].map((item, index) => <button key={item} className={`filter-tab ${index === 0 ? 'active' : ''}`}>{item}</button>)}</div><BlogGrid count={6} /><div className="adsense-placeholder" style={{ marginTop: 32 }}><span>Publicidade</span></div></div></section></div></PlatformShell>;
}

function LegacyPlatformBlogArticlePage() {
  return <PlatformShell title="Artigo | Cote Juros"><div className="page active" id="page-blog-detalhe"><section className="section-pad" style={{ background: 'var(--bg-primary)', paddingTop: 110 }}><div className="container"><div className="article-layout"><article><div className="article-header"><div className="article-cat">Crédito</div><div className="adsense-placeholder-dark" style={{ marginBottom: 16 }}><span>Publicidade</span></div><h1 className="article-title">Como escolher um empréstimo pessoal sem cair em armadilhas</h1><div className="article-meta"><span>15 min de leitura</span><span>•</span><span>Atualizado em jan 2025</span><span>•</span><span>Equipe Cote Juros</span></div></div><div className="article-body"><p>Contratar um empréstimo pessoal pode parecer simples, mas envolve variáveis que, se ignoradas, podem custar muito mais do que o esperado. Antes de assinar qualquer contrato, é fundamental entender o que está sendo contratado.</p><h3>O que é o CET e por que é o número mais importante</h3><p>O Custo Efetivo Total concentra todos os custos do crédito: taxa de juros, seguros obrigatórios, tarifas administrativas e IOF. É o número que permite uma comparação justa entre diferentes ofertas.</p><div className="adsense-placeholder-dark"><span>Publicidade</span></div><h3>Parcela menor não significa crédito mais barato</h3><p>Prazo mais longo resulta em parcelas menores, mas o valor total pago ao final pode ser significativamente maior. Sempre simule o total a ser pago.</p><h3>Cuidado com cobranças antecipadas</h3><p>Nenhuma instituição financeira séria exige pagamento antecipado para liberar crédito. A Cote Juros nunca cobra valores antecipados.</p><div className="adsense-placeholder-dark"><span>Publicidade</span></div><p className="article-callout">Compare sempre pelo CET, não pela taxa nominal. E nunca pague antecipado para ter crédito liberado.</p></div><div style={{ marginTop: 36 }}><Link className="btn-primary" to="/comparar">Comparar empréstimos agora</Link></div></article><aside className="article-sidebar"><div className="sidebar-widget"><div className="sidebar-widget-title">Comparar agora</div><p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 14, lineHeight: 1.6 }}>Veja opções disponíveis para o seu perfil.</p><Link className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} to="/comparar">Ver opções disponíveis</Link></div><div className="adsense-placeholder-dark"><span>Publicidade</span></div><div className="sidebar-widget"><div className="sidebar-widget-title">Artigos relacionados</div><div className="related-links"><Link to="/blog/score-de-credito">Score de crédito: mitos e verdades</Link><Link to="/blog/sair-do-vermelho">5 formas de sair do vermelho</Link></div></div></aside></div></div></section></div></PlatformShell>;
}

export function PlatformBlogPage() {
  const [articles, setArticles] = useState([]);
  const [activeCategory, setActiveCategory] = useState('Todos');

  useEffect(() => {
    let active = true;
    getBlogArticles({ sort: 'recent' })
      .then((items) => {
        if (active) setArticles(items);
      })
      .catch(() => {
        if (active) setArticles([]);
      });
    return () => {
      active = false;
    };
  }, []);

  const categories = useMemo(() => ['Todos', ...Array.from(new Set(articles.map((article) => article.category).filter(Boolean))).slice(0, 5)], [articles]);
  const visibleArticles = useMemo(() => articles.filter((article) => activeCategory === 'Todos' || article.category === activeCategory).slice(0, 12), [activeCategory, articles]);

  return <PlatformShell title="Blog | Cote Juros"><div className="page active" id="page-blog"><InnerHero badge="Conteúdo" title={<>Educação <span className="text-accent">financeira</span></>} desc="Artigos, guias e análises para você tomar decisões com mais consciência e menos pressa." /><section className="section-pad" style={{ background: 'var(--light-bg)' }}><div className="container">{/* ADSENSE SLOT FUTURO */}<div className="adsense-placeholder"><span>Publicidade</span></div><div className="filter-tabs" style={{ marginBottom: 28, marginTop: 0 }}>{categories.map((item) => <button type="button" key={item} className={`filter-tab ${activeCategory === item ? 'active' : ''}`} onClick={() => setActiveCategory(item)}>{item}</button>)}</div>{visibleArticles.length ? <div className="blog-grid">{visibleArticles.map((article) => <Link className="blog-card" key={article.slug} to={`/blog/${article.slug}`}><div className="blog-img" style={{ backgroundImage: article.coverImage ? `url(${article.coverImage})` : undefined, backgroundSize: 'cover', backgroundPosition: 'center' }}><div className="blog-cat">{article.category}</div></div><div className="blog-content"><div className="blog-title">{article.title}</div><div className="blog-excerpt">{article.summary}</div><div className="blog-meta"><span>{article.readTime || article.readingTime} min</span><span>{new Date(article.publishedAt).toLocaleDateString('pt-BR')}</span></div></div></Link>)}</div> : <BlogGrid count={6} />}{/* ADSENSE SLOT FUTURO */}<div className="adsense-placeholder" style={{ marginTop: 32 }}><span>Publicidade</span></div></div></section></div></PlatformShell>;
}

export function PlatformBlogArticlePage() {
  const { articleSlug } = useParams();
  const [article, setArticle] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    Promise.all([getBlogArticleBySlug(articleSlug), getBlogArticles({ sort: 'recent' })])
      .then(([item, items]) => {
        if (!active) return;
        setArticle(item);
        setRelated((items || []).filter((candidate) => candidate.slug !== item?.slug).slice(0, 3));
      })
      .catch(() => {
        if (!active) return;
        setArticle(null);
        setRelated([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [articleSlug]);

  if (loading) {
    return <PlatformShell title="Artigo | Cote Juros"><div className="page active" id="page-blog-detalhe"><section className="section-pad" style={{ background: 'var(--bg-primary)', paddingTop: 110 }}><div className="container"><div className="dashboard-api-card">Carregando artigo...</div></div></section></div></PlatformShell>;
  }

  if (!article) {
    return <PlatformShell title="Artigo não encontrado | Cote Juros"><div className="page active" id="page-blog-detalhe"><section className="section-pad" style={{ background: 'var(--bg-primary)', paddingTop: 110 }}><div className="container"><div className="dashboard-api-card"><div className="dash-panel-title">Artigo não encontrado</div><p style={{ color: 'var(--text-secondary)', marginBottom: 18 }}>Não encontramos este conteúdo no acervo atual.</p><Link className="btn-primary" to="/blog">Voltar ao blog</Link></div></div></section></div></PlatformShell>;
  }

  const title = article.seoTitle || article.metaTitle || `${article.title} | Blog Cote Juros`;
  const description = article.metaDescription || article.description || article.summary;
  const canonical = article.canonicalUrl || `https://www.cotejuros.com.br/blog/${article.slug}`;

  return <PlatformShell title={title}><Helmet><meta name="description" content={description} /><link rel="canonical" href={canonical} /><meta property="og:title" content={title} /><meta property="og:description" content={description} /><meta property="og:type" content="article" /><meta property="og:url" content={canonical} />{article.coverImage ? <meta property="og:image" content={article.coverImage} /> : null}<meta name="twitter:card" content="summary_large_image" /></Helmet><div className="page active" id="page-blog-detalhe"><section className="section-pad" style={{ background: 'var(--bg-primary)', paddingTop: 110 }}><div className="container"><div className="article-layout"><article><div className="article-header"><div className="article-cat">{article.category}</div>{/* ADSENSE SLOT FUTURO */}<div className="adsense-placeholder-dark" style={{ marginBottom: 16 }}><span>Publicidade</span></div><h1 className="article-title">{article.h1 || article.title}</h1><div className="article-meta"><span>{article.readTime || article.readingTime} min de leitura</span><span>•</span><span>Atualizado em {new Date(article.updatedAt || article.publishedAt).toLocaleDateString('pt-BR')}</span><span>•</span><span>{article.author}</span></div></div><div className="article-body">{article.intro?.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}{article.sections?.map((section, index) => <React.Fragment key={`${section.heading}-${index}`}>{index === 1 ? <>{/* ADSENSE SLOT FUTURO */}<div className="adsense-placeholder-dark"><span>Publicidade</span></div></> : null}{section.heading ? <h3>{section.heading}</h3> : null}{section.paragraphs?.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}{section.bullets?.length ? <ul>{section.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}</ul> : null}</React.Fragment>)}{article.conclusion?.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}{article.faq?.length ? <><h3>Perguntas frequentes</h3>{article.faq.map((item) => <p key={item.question}><strong>{item.question}</strong><br />{item.answer}</p>)}</> : null}</div><div style={{ marginTop: 36 }}><Link className="btn-primary" to="/comparar">Comparar opções agora</Link></div></article><aside className="article-sidebar"><div className="sidebar-widget"><div className="sidebar-widget-title">Comparar agora</div><p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 14, lineHeight: 1.6 }}>Veja opções disponíveis para o seu perfil.</p><Link className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} to="/comparar">Ver opções disponíveis</Link></div>{/* ADSENSE SLOT FUTURO */}<div className="adsense-placeholder-dark"><span>Publicidade</span></div><div className="sidebar-widget"><div className="sidebar-widget-title">Artigos relacionados</div><div className="related-links">{related.map((item) => <Link key={item.slug} to={`/blog/${item.slug}`}>{item.title}</Link>)}</div></div></aside></div></div></section></div></PlatformShell>;
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
  return <PlatformShell title="Sobre | Cote Juros"><div className="page active" id="page-sobre"><InnerHero badge="Quem somos" title={<>Nossa <span className="text-accent">missão</span></>} desc="Acreditamos que decisões financeiras melhores começam com informação mais clara." /><section className="section-pad" style={{ background: 'var(--bg-surface)' }}><div className="container"><div className="about-mission"><div><div className="section-label">Propósito</div><h2 style={{ marginBottom: 16 }}>Comparação como ferramenta de <span className="text-accent">liberdade</span></h2><p style={{ color: 'var(--text-secondary)', fontSize: 15, lineHeight: 1.8, marginBottom: 20 }}>A Cote Juros nasceu da percepção de que muita gente contrata crédito, seguro ou financiamento sem entender bem as condições - e paga caro por isso.</p><p style={{ color: 'var(--text-secondary)', fontSize: 15, lineHeight: 1.8 }}>Não somos banco, não concedemos crédito e não temos interesse em empurrar nenhum produto específico. Nosso papel é organizar informação.</p></div><div className="mission-card">{['Transparência', 'Sem pressão', 'Custo zero'].map((item) => <div className="mission-row" key={item}><div className="mission-icon"><CheckIcon color="var(--accent-light)" size={16} /></div><div><strong>{item}</strong><span>Mostramos o que sabemos, sem prometer o que não podemos garantir.</span></div></div>)}</div></div><div className="values-grid">{values.map(([title, desc]) => <div className="value-card" key={title}><div className="value-icon"><CheckIcon color="var(--accent-light)" size={20} /></div><div className="value-title">{title}</div><div className="value-desc">{desc}</div></div>)}</div></div></section></div></PlatformShell>;
}

export function PlatformContactPage() {
  return <PlatformShell title="Contato | Cote Juros"><div className="page active" id="page-contato"><InnerHero badge="Fale conosco" title={<>Entre em <span className="text-accent">contato</span></>} desc="Dúvidas, parcerias ou sugestões. Estamos aqui." /><section className="section-pad" style={{ background: 'var(--bg-surface)' }}><div className="container"><div className="contact-layout"><div><h3 style={{ marginBottom: 20 }}>Canais disponíveis</h3>{[['E-mail', 'contato@cotejuros.com.br'], ['Atendimento', 'Segunda a sexta, 9h às 18h'], ['Localização', 'Brasil - atendimento digital']].map(([label, item]) => <div className="contact-card" key={item}><div className="contact-ico"><CheckIcon color="var(--accent-light)" size={18} /></div><div><div className="contact-val-label">{label}</div><div className="contact-val">{item}</div></div></div>)}</div><form className="contact-form"><h3 style={{ marginBottom: 20 }}>Envie uma mensagem</h3><div className="form-row"><div className="form-group"><label className="form-label">Nome</label><input className="form-input" placeholder="Seu nome" /></div><div className="form-group"><label className="form-label">E-mail</label><input className="form-input" type="email" placeholder="seu@email.com" /></div></div><div className="form-group"><label className="form-label">Assunto</label><select className="form-input"><option>Dúvida geral</option><option>Parceria comercial</option><option>Sugestão</option><option>Reclamação</option></select></div><div className="form-group"><label className="form-label">Mensagem</label><textarea className="form-input" placeholder="Escreva sua mensagem aqui..." /></div><button className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: 13 }} type="button">Enviar mensagem</button></form></div></div></section></div></PlatformShell>;
}

export function PlatformLoginPage({ signup = false }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', lastName: '', cpf: '', email: '', password: '' });
  const submit = async (event) => {
    event.preventDefault();
    await trackEvent('login_attempt', { sourcePage: signup ? '/criar-conta' : '/login' });
    await loginCustomer(form);
    navigate('/dashboard');
  };
  return <PlatformShell title={`${signup ? 'Criar conta' : 'Login'} | Cote Juros`} bare><div className="page active" id={signup ? 'page-criar-conta' : 'page-login'}><div className="auth-page"><div className="auth-bg-orb" /><form className="auth-card" style={signup ? { maxWidth: 480 } : undefined} onSubmit={submit}><div className="auth-logo"><span className="logo-text"><span className="logo-primary">Cote</span><span className="logo-accent">Juros</span></span></div><div className="auth-title">{signup ? 'Criar conta grátis' : 'Acessar minha conta'}</div><div className="auth-sub">{signup ? 'Compare produtos financeiros e salve suas análises.' : 'Entre para ver suas comparações e ofertas salvas.'}</div>{signup ? <div className="form-row"><div className="form-group"><label className="form-label">Nome</label><input className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Seu nome" /></div><div className="form-group"><label className="form-label">Sobrenome</label><input className="form-input" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} placeholder="Sobrenome" /></div></div> : null}<div className="form-group"><label className="form-label">E-mail</label><input className="form-input" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="seu@email.com" /></div><div className="form-group"><label className="form-label">Senha</label><input className="form-input" type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder={signup ? 'Mínimo 8 caracteres' : '********'} /></div>{signup ? <div className="form-group"><label className="form-label">CPF</label><input className="form-input" value={form.cpf} onChange={(e) => setForm({ ...form, cpf: e.target.value })} placeholder="000.000.000-00" /></div> : <Link className="forgot-link" to="/login">Esqueci minha senha</Link>}<button className="btn-auth">{signup ? 'Criar conta' : 'Entrar'}</button><div className="auth-divider">{signup ? 'já tenho conta' : 'ou'}</div><div className="auth-signup-link">{signup ? <Link to="/login">Fazer login</Link> : <>Não tem conta? <Link to="/criar-conta">Criar conta grátis</Link></>}</div><div className="auth-disclaimer">{signup ? 'Ao criar sua conta você concorda com os Termos de Uso e Política de Privacidade.' : 'Acesso destinado a clientes e parceiros da Cote Juros.'}<br />A Cote Juros não é banco e não solicita senhas por e-mail ou WhatsApp.</div></form></div></div></PlatformShell>;
}

const DASHBOARD_OFFERS_KEY = 'cote_dashboard_offers';
const DASHBOARD_SETTINGS_KEY = 'cote_dashboard_settings';

const dashboardMockOffers = [
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
  const [lead, setLead] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [offers, setOffers] = useState(() => readLocalJson(DASHBOARD_OFFERS_KEY, dashboardMockOffers));
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const localLead = getLeadFromLocalStorage();
    const localAnalysis = readLocalJson('cote_last_analysis') || readLocalJson('cote_quiz_result');
    const session = getCurrentCustomer();
    const events = readLocalJson('cote_tracking_events', []);
    const creditFunnel = readLocalJson('cj.credit-funnel.v2');
    const simulationLeads = readLocalJson('cj.simulationLeads', []);
    const storedOffers = readLocalJson(DASHBOARD_OFFERS_KEY, []);
    const normalizedAnalysis = localAnalysis || (localLead?.quizAnswers ? { quizAnswers: localLead.quizAnswers, recommendation: recommendProducts(localLead.quizAnswers) } : null);

    setLead(localLead);
    setAnalysis(normalizedAnalysis);
    setCustomer(session?.customer || null);
    setHistory([
      ...(normalizedAnalysis ? [{ id: 'last_analysis', title: 'Análise mais recente', type: 'Radar', createdAt: normalizedAnalysis.createdAt || localLead?.updatedAt, description: normalizedAnalysis.recommendation?.mainProduct || normalizedAnalysis.recommendation?.profile }] : []),
      ...(localLead ? [{ id: 'lead', title: 'Lead salvo localmente', type: 'Perfil', createdAt: localLead.updatedAt || localLead.createdAt, description: localLead.recommendation?.mainProduct || 'Dados do quiz salvos' }] : []),
      ...(creditFunnel ? [{ id: 'credit_funnel', title: 'Simulação de crédito', type: 'Simulação', createdAt: creditFunnel.updatedAt || creditFunnel.createdAt, description: creditFunnel.step ? `Etapa ${creditFunnel.step}` : 'Funil de crédito salvo' }] : []),
      ...simulationLeads.slice(-5).reverse().map((item, index) => ({ id: item.id || `simulation_${index}`, title: item.fullName || 'Simulação local', type: item.productType || 'Simulação', createdAt: item.updatedAt || item.createdAt, description: item.status || item.originPage || 'Lead de simulação' })),
      ...events.slice(-5).reverse().map((event, index) => ({ id: `event_${index}`, title: event.name || 'Evento', type: 'Atividade', createdAt: event.createdAt, description: event.data?.sourcePage || event.mode || 'Registro local' }))
    ]);

    if (storedOffers?.length) setOffers(storedOffers.map(normalizeOffer));

    Promise.allSettled([
      getCreditOffers({ sourcePage }),
      getCardOffers({ sourcePage }),
      getFinancingOffers({ sourcePage }),
      getInsuranceOffers()
    ]).then((results) => {
      const apiOffers = results.flatMap((result) => (result.status === 'fulfilled' && Array.isArray(result.value) ? result.value : []));
      const normalized = apiOffers.length ? apiOffers.map(normalizeOffer) : dashboardMockOffers;
      setOffers(normalized);
      writeLocalJson(DASHBOARD_OFFERS_KEY, normalized);
    });

    trackEvent('dashboard_opened', { sourcePage, leadId: localLead?.backendLeadId });
  }, [sourcePage]);

  const recommendation = analysis?.recommendation || lead?.recommendation || recommendProducts(lead?.quizAnswers || {});
  const score = recommendation?.score || analysis?.score || lead?.score || 740;

  return { lead, analysis, customer, offers, history, recommendation, score };
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
  const { recommendation, score, offers, history } = data;

  return (
    <DashboardLayout>
      <DashboardHeader title="Bem-vindo ao seu painel" subtitle="Seu painel está atualizado. Confira suas opções e análises." />
      <div className="dash-stats-row">
        <Stat label="Score estimado" value={score} color="var(--accent-light)" />
        <Stat label="Opções ativas" value={offers.length} />
        <Stat label="Melhor taxa" value={offers[0]?.rate || '1,79%'} color="var(--success)" />
        <Stat label="Histórico" value={history.length} />
      </div>
      <div className="dash-panels">
        <div className="dash-panel"><div className="dash-panel-title">Resumo da análise</div><p style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>{recommendation?.explanation || 'Ainda não há análise completa. Faça o quiz para gerar uma recomendação personalizada.'}</p><div className="api-ready-note" style={{ marginTop: 18 }}>{recommendation?.mainProduct || 'Recomendação pendente'}</div></div>
        <div className="dash-panel"><div className="dash-panel-title">Radar de Crédito</div>{[['Empréstimo pessoal', '85%', 'var(--accent)'], ['Cartão de crédito', '70%', '#22D3A0'], ['Financiamento', '55%', '#F59E0B'], ['Seguros', '93%', '#F43F5E']].map(([label, pct, color]) => <div className="dash-radar-row" key={label}><div><span>{label}</span><span style={{ color }}>{pct}</span></div><div><i style={{ width: pct, background: color }} /></div></div>)}<Link className="btn-outline" style={{ width: '100%', justifyContent: 'center', marginTop: 20 }} to="/dashboard/analise">Ver análise completa</Link></div>
      </div>
      <div className="dashboard-api-card" style={{ marginTop: 22 }}><div className="dash-panel-title">Ofertas para seu perfil</div><DashboardOfferRows offers={offers.slice(0, 4)} /><div className="partner-cta-row" style={{ marginTop: 18 }}><Link className="btn-primary" to="/dashboard/ofertas">Ver todas as ofertas</Link><Link className="btn-outline" to="/quiz">Refazer análise</Link></div></div>
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
  const { offers } = useDashboardData('/dashboard/ofertas');
  return (
    <DashboardLayout title="Ofertas | Cote Juros">
      <DashboardHeader title="Ofertas para seu perfil" subtitle="Produtos carregados via offerAdapter com fallback local." />
      {offers.length ? <div className="dashboard-api-card"><div className="dash-panel-title">Opções disponíveis</div><DashboardOfferRows offers={offers} /></div> : <EmptyDashboardState title="Nenhuma oferta disponível" copy="Ainda não encontramos ofertas salvas para seu perfil. Refazer a análise pode atualizar as opções." />}
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
  const { customer, lead } = useDashboardData('/dashboard/perfil');
  const profile = customer || { name: lead?.name || lead?.fullName || 'Cliente Cote Juros', email: lead?.email || 'cliente@cotejuros.com.br' };
  return (
    <DashboardLayout title="Perfil | Cote Juros">
      <DashboardHeader title="Meu perfil" subtitle="Dados de usuário via authAdapter com fallback local." />
      <div className="dashboard-api-card"><div className="dash-panel-title">Dados cadastrais</div><div className="dashboard-api-grid" style={{ gridTemplateColumns: 'repeat(2,minmax(0,1fr))' }}><div className="dashboard-api-item"><strong>Nome</strong><span>{profile.name}</span></div><div className="dashboard-api-item"><strong>E-mail</strong><span>{profile.email}</span></div><div className="dashboard-api-item"><strong>Telefone</strong><span>{lead?.phone || lead?.whatsapp || 'Não informado'}</span></div><div className="dashboard-api-item"><strong>Status</strong><span>{lead?.status || 'mock ativo'}</span></div></div><div className="partner-cta-row" style={{ marginTop: 18 }}><Link className="btn-primary" to="/quiz">Atualizar perfil financeiro</Link></div></div>
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
