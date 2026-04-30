import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import SmartQuiz from '@/components/smart-quiz/SmartQuiz.jsx';
import { getCardOffers, getCreditOffers, getFinancingOffers, getInsuranceOffers } from '@/platform/services/offerAdapter.js';
import { loginCustomer } from '@/platform/services/authAdapter.js';
import { getLeadFromLocalStorage } from '@/platform/services/leadAdapter.js';
import { trackEvent } from '@/platform/services/trackingAdapter.js';
import '@/platform/platformHtml.css';

const productRows = [
  ['Banco Itau', 'Emprestimo Pessoal', '1,79%', 'ao mes', ['Ate R$50.000', '60 parcelas', 'Online'], 'ITA', 'Emprestimo', 'badge-loan'],
  ['Santander', 'Credito Pessoal', '2,05%', 'ao mes', ['Ate R$30.000', '48 parcelas', 'Online'], 'SAN', 'Emprestimo', 'badge-loan'],
  ['Caixa', 'Credito Pessoal FGTS', '1,29%', 'ao mes', ['Saldo FGTS', 'Baixo risco'], 'CEF', 'Financiamento', 'badge-finance'],
  ['Nubank', 'Cartao Roxinho', 'R$0', 'anuidade', ['Sem anuidade', 'Cashback', 'App premium'], 'NUB', 'Cartao', 'badge-card'],
  ['Porto Seguro', 'Seguro Auto Essencial', 'R$89', 'ao mes', ['Assistencia 24h', 'Terceiros', 'Guincho'], 'POR', 'Seguro', 'badge-insurance'],
  ['Creditas', 'Credito com garantia', '1,49%', 'ao mes', ['Garantia', 'Valores altos', 'Analise online'], 'CRE', 'Garantia', 'badge-loan']
];

const blogCards = [
  ['Emprestimos', 'Como escolher um emprestimo pessoal sem cair em armadilhas', 'Entenda o que avaliar antes de assinar: CET, prazo, parcela e reputacao do parceiro.', '15 min', 'Credito', 'linear-gradient(135deg,#1a0533,#2d1065)'],
  ['Cartoes', 'Cartao com cashback ou milhas: qual vale mais para o seu perfil?', 'A resposta depende dos seus habitos de consumo. Veja como calcular o retorno real.', '8 min', 'Cartoes', 'linear-gradient(135deg,#052918,#0a4d2e)'],
  ['Seguros', 'Seguro de vida: quando contratar e o que realmente cobre', 'Morte acidental, invalidez permanente e outros pontos essenciais que muita gente ignora.', '10 min', 'Seguros', 'linear-gradient(135deg,#1a0a05,#4d2210)'],
  ['Planejamento', '5 formas de sair do vermelho sem comprometer o salario inteiro', 'Estrategias reais para reorganizar as financas sem cortar tudo de uma vez.', '12 min', 'Planejamento', 'linear-gradient(135deg,#0a1a33,#103055)'],
  ['Financiamento', 'Financiamento imobiliario: o que ninguem te conta antes de assinar', 'CET, IPCA atrelado, prazo real e custos cartoriais. O que realmente importa.', '9 min', 'Financiamento', 'linear-gradient(135deg,#1a1a05,#3d3d0a)'],
  ['Credito', 'Score de credito: mitos, verdades e como melhorar o seu', 'O que realmente afeta sua pontuacao e acoes praticas para melhora-la com consistencia.', '7 min', 'Credito', 'linear-gradient(135deg,#1a0533,#330a4d)']
];

const insuranceCards = [
  ['Seguro Auto', 'Cobertura completa, parcial e terceiros. Assistencia 24h e carro reserva.', '/seguro-auto', 'Cotar seguro auto'],
  ['Seguro Viagem', 'Emergencia medica, bagagem, cancelamento e assistencia no exterior.', '/seguro-viagem', 'Cotar seguro viagem'],
  ['Seguro de Vida', 'Protecao para voce e sua familia. Invalidez, morte acidental e mais.', '/seguro-vida', 'Cotar seguro de vida'],
  ['Seguro Residencial', 'Protecao para seu imovel contra roubo, incendio e danos eletricos.', '/seguros', 'Ver coberturas'],
  ['Seguro Celular', 'Protecao contra roubo, furto e danos acidentais do seu smartphone.', '/seguros', 'Ver coberturas'],
  ['Protecao Financeira', 'Seguro prestamista e protecao em caso de imprevistos financeiros.', '/seguros', 'Ver coberturas']
];

const categoryCards = [
  ['Emprestimos', 'Compare credito pessoal, FGTS, consignado e online antes de decidir.', 'Comparar emprestimos', '/comparar', 'var(--accent)'],
  ['Cartoes de Credito', 'Sem anuidade, com cashback, milhas e beneficios exclusivos.', 'Comparar cartoes', '/comparar', '#22D3A0'],
  ['Financiamentos', 'Imovel, veiculo e outros financiamentos com melhores condicoes.', 'Comparar financiamentos', '/comparar', '#F59E0B'],
  ['Seguros', 'Auto, vida, viagem, residencial. Compare coberturas e escolha.', 'Comparar seguros', '/seguros', '#F43F5E'],
  ['Radar de Credito', 'Entenda seu perfil e veja caminhos possiveis antes de decidir.', 'Acessar Radar', '/radar', 'var(--accent)'],
  ['Educacao Financeira', 'Artigos, guias e conteudo para tomar decisoes com mais consciencia.', 'Ler artigos', '/blog', 'var(--accent)']
];

const faqItems = [
  ['A Cote Juros e um banco?', 'Nao. A Cote Juros e uma plataforma de comparacao. Nao somos banco, nao concedemos credito e nao fazemos parte de nenhuma instituicao financeira.'],
  ['A Cote Juros cobra algum valor?', 'Nao cobramos nenhum valor do usuario para comparar ou acessar informacoes. Nunca exigimos pagamento antecipado.'],
  ['A aprovacao e garantida?', 'Nao garantimos aprovacao. As decisoes de credito sao dos parceiros e dependem da analise individual de cada um.'],
  ['Como meus dados sao protegidos?', 'Seguimos as diretrizes da LGPD. Seus dados sao usados apenas para melhorar a comparacao e registrar consentimentos.'],
  ['Posso confiar nas taxas exibidas?', 'As informacoes podem variar conforme perfil, disponibilidade e condicoes de mercado. Sempre confirme com o parceiro antes de contratar.'],
  ['O Radar de Credito e uma analise oficial?', 'O Radar e uma ferramenta indicativa baseada nas informacoes fornecidas. Nao substitui uma analise oficial de credito.']
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
    ['Inicio', '/'],
    ['Comparar', '/comparar'],
    ['Radar de Credito', '/radar'],
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
            <div className="footer-tagline">Plataforma brasileira de comparacao de credito, cartoes, financiamentos e seguros.</div>
            <div className="api-ready-note">A Cote Juros nao e uma instituicao financeira e nao concede credito diretamente. Nao cobramos valores antecipados.</div>
          </div>
          <FooterCol title="Cote Juros" links={[['Sobre nos', '/sobre'], ['Contato', '/contato'], ['FAQ', '/faq'], ['Blog', '/blog']]} />
          <FooterCol title="Comparar" links={[['Emprestimos', '/comparar'], ['Cartoes', '/comparar'], ['Financiamentos', '/comparar'], ['Seguros', '/seguros']]} />
          <FooterCol title="Seguros" links={[['Seguro Auto', '/seguro-auto'], ['Seguro Viagem', '/seguro-viagem'], ['Seguro de Vida', '/seguro-vida'], ['Seguro Residencial', '/seguros']]} />
          <FooterCol title="Area do cliente" links={[['Entrar', '/login'], ['Criar conta', '/criar-conta'], ['Minha conta', '/dashboard'], ['Politica de privacidade', '/politica-de-privacidade']]} />
        </div>
        <div className="footer-bottom">
          <div className="footer-legal">2025 Cote Juros. A Cote Juros nao e banco, nao concede credito e nao garante aprovacao. Sujeito a analise dos parceiros. Informacoes sujeitas a alteracao.</div>
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
        <div className="dash-header"><div className="dash-title">Radar de Credito</div><div className="dash-badge">Ilustrativo</div></div>
        <div className="radar-visual">
          <div className="radar-label">Perfil financeiro</div>
          <div className="radar-score"><div className="score-ring">720</div><div className="score-info"><div className="score-title">Score estimado</div><div className="score-sub">Baseado no perfil informado</div></div></div>
          <div className="path-bars">
            {[
              ['Emprestimo pessoal', '82%'],
              ['Cartao de credito', '68%'],
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
          <div className="mini-card"><div className="mini-card-label">Melhor taxa</div><div className="mini-card-value">1,79%</div><div className="mini-card-change"><CheckIcon size={10} /> ao mes</div></div>
          <div className="mini-card"><div className="mini-card-label">Opcoes</div><div className="mini-card-value">12</div><div className="mini-card-change"><CheckIcon size={10} /> parceiros</div></div>
        </div>
      </div>
      <div className="float-chip float-chip-1"><div className="float-dot" style={{ background: '#22D3A0' }} /> Emprestimo aprovado</div>
      <div className="float-chip float-chip-2"><div className="float-dot" style={{ background: '#7C6EF7' }} /> Cartao sem anuidade</div>
    </div>
  );
}

export function PlatformHomePage() {
  return (
    <PlatformShell title="Cote Juros - Compare credito, cartoes e seguros">
      <div className="page active" id="page-home">
        <section id="hero">
          <div className="hero-bg"><div className="hero-orb-1" /><div className="hero-orb-2" /><div className="hero-grid" /></div>
          <div className="container">
            <div className="hero-inner">
              <div className="hero-left reveal">
                <div className="hero-badge"><div className="hero-badge-dot" /> Plataforma de comparacao financeira</div>
                <h1 className="hero-title">Compare credito, cartoes e seguros <span className="gradient-text">com clareza</span></h1>
                <p className="hero-desc">Responda algumas perguntas e veja caminhos que podem fazer sentido para o seu perfil - sem cobranca antecipada e sem promessa de aprovacao.</p>
                <div className="hero-actions">
                  <Link className="btn-hero" to="/comparar">Ver caminhos para meu perfil <ArrowIcon size={16} /></Link>
                  <Link className="btn-hero-outline" to="/radar">Radar de Credito</Link>
                </div>
                <div className="hero-trust">
                  {['Sem cobrancas antecipadas', 'Dados protegidos (LGPD)', 'Transparencia total'].map((item) => <div className="hero-trust-item" key={item}><CheckIcon /> {item}</div>)}
                </div>
              </div>
              <HeroDashboard />
            </div>
          </div>
        </section>
        <TrustStrip />
        <HowItWorks />
        <HomeQuiz />
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
    ['01', 'Voce informa seu perfil', 'Renda, finalidade e situacao do nome. Rapido, sem burocracia.'],
    ['02', 'Organizamos as possibilidades', 'Nosso Radar cruza seu perfil com os parceiros disponiveis.'],
    ['03', 'Voce compara antes de decidir', 'Taxas, condicoes e coberturas lado a lado. Sem letra miuda.'],
    ['04', 'Segue para o parceiro quando fizer sentido', 'Voce escolhe. A Cote Juros nunca forca uma decisao.']
  ];
  return (
    <section id="how-it-works" className="section-pad">
      <div className="container">
        <div style={{ textAlign: 'center', maxWidth: 520, margin: '0 auto' }}><div className="section-label" style={{ justifyContent: 'center' }}>Como funciona</div><h2 style={{ color: 'var(--light-text)', marginBottom: 14 }}>Da busca a decisao, em 4 passos</h2><p className="section-desc" style={{ margin: '0 auto', textAlign: 'center' }}>Processo simples, transparente e sem compromisso. Voce compara com informacao, nao com promessa.</p></div>
        <div className="steps-grid">{steps.map(([num, title, desc], index) => <div className="step-card reveal" style={{ transitionDelay: `${index / 10}s` }} key={num}><div className="step-num">{num}</div><div className="step-icon-wrap"><CheckIcon color="currentColor" size={22} /></div><div className="step-title">{title}</div><div className="step-desc">{desc}</div></div>)}</div>
      </div>
    </section>
  );
}

function HomeQuiz() {
  return (
    <section id="quiz-home" className="section-pad" style={{ background: 'var(--bg-surface)' }}>
      <div className="container">
        <div className="quiz-shell">
          <div>
            <div className="section-label">Analise gratuita</div>
            <h2 style={{ marginBottom: 12 }}>Descubra qual caminho combina melhor com seu <span className="text-accent">momento financeiro</span></h2>
            <p className="section-desc" style={{ marginBottom: 22 }}>O SmartQuiz usa os adapters ja integrados para organizar recomendacoes, registrar eventos e preparar o proximo passo sem prometer aprovacao.</p>
            <SmartQuiz />
          </div>
          <aside className="creditas-card">
            <div className="section-label">Funil preparado</div>
            <h3 style={{ marginBottom: 10 }}>Quiz - resultado - lead - parceiro/API</h3>
            <div className="quiz-side-list">
              {['Credito com garantia', 'Seguros', 'Cartoes', 'Compliance'].map((item) => <div className="quiz-side-item" key={item}><strong>{item}</strong><span>Rota preparada para adapters existentes, sem prometer aprovacao.</span></div>)}
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}

function RadarHome() {
  return (
    <section id="radar" className="section-pad" style={{ background: 'var(--bg-primary)' }}>
      <div className="container"><div className="radar-section-inner">
        <div>
          <div className="section-label">Radar de Credito</div>
          <h2 style={{ marginBottom: 16 }}>Entenda suas possibilidades<br /><span className="text-accent">antes de pedir</span></h2>
          <p className="section-desc" style={{ marginBottom: 28 }}>O Radar organiza caminhos possiveis com base no seu perfil. Voce ve oportunidades, nao promessas.</p>
          <ul className="platform-check-list">
            {['Analise do perfil financeiro', 'Indicadores de elegibilidade por produto', 'Caminhos possiveis sem compromisso', 'Resultado em minutos'].map((item) => <li key={item}><span><CheckIcon color="#9C8FFF" size={10} /></span>{item}</li>)}
          </ul>
          <Link className="btn-primary" to="/radar">Acessar Radar de Credito <ArrowIcon /></Link>
        </div>
        <RadarCard />
      </div></div>
    </section>
  );
}

function RadarCard() {
  return (
    <div className="radar-full-card reveal">
      <div className="radar-top-row"><div className="radar-user"><div className="avatar">MF</div><div><div className="user-name">Maria F.</div><div className="user-status">Analise ilustrativa</div></div></div><div className="radar-score-big"><div className="score-number">740</div><div className="score-label-sm">Score estimado</div></div></div>
      <div className="eligibility-section"><div className="eligibility-title">Caminhos possiveis</div>{[['Emprestimo pessoal', '85%', 'var(--accent)'], ['Cartao de credito', '70%', '#22D3A0'], ['Financiamento', '55%', '#F59E0B'], ['Seguros', '93%', '#F43F5E']].map(([label, pct, color]) => <EligibilityRow key={label} label={label} pct={pct} color={color} />)}</div>
      <div className="radar-disclaimer">Dados e indicadores ilustrativos. As opcoes dependem da analise dos parceiros e podem variar conforme perfil.</div>
    </div>
  );
}

function EligibilityRow({ label, pct, color }) {
  return <div className="elig-row"><div className="elig-icon-w"><CheckIcon color={color} /></div><span className="elig-label">{label}</span><div className="elig-bar-sm"><div className="elig-bar-sm-fill" style={{ width: pct, background: color }} /></div><span className="elig-pct-val" style={{ color }}>{pct}</span></div>;
}

function CompareHome() {
  return (
    <section id="compare-home" className="section-pad" style={{ background: 'var(--light-bg)' }}>
      <div className="container">
        <div style={{ textAlign: 'center', maxWidth: 520, margin: '0 auto' }}><div className="section-label" style={{ justifyContent: 'center', color: 'var(--accent-dark)' }}>Marketplace financeiro</div><h2 style={{ color: 'var(--light-text)', marginBottom: 12 }}>Compare e escolha<br />com mais seguranca</h2><p className="section-desc" style={{ margin: '0 auto', textAlign: 'center', color: 'var(--light-muted)' }}>Taxas, condicoes e beneficios lado a lado. Voce compara sem pressao.</p></div>
        <div className="adsense-placeholder"><span>Publicidade</span></div>
        <div className="filter-tabs">
          {['Todos', 'Emprestimos', 'Cartoes', 'Financiamentos', 'Seguros'].map((item, index) => <button key={item} className={`filter-tab ${index === 0 ? 'active' : ''}`}>{item}</button>)}
        </div>
        <div className="products-grid">{productRows.map((row) => <ProductCard key={`${row[0]}-${row[1]}`} row={row} />)}</div>
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
      <button className="card-cta">Ver condicoes <ArrowIcon /></button>
    </div>
  );
}

function CategoriesHome() {
  return <section id="categories" className="section-pad"><div className="container"><div className="categories-grid">{categoryCards.map(([title, desc, label, href, color], index) => <Link className="category-card reveal" style={{ transitionDelay: `${(index % 3) / 10}s` }} key={title} to={href}><div className="cat-icon" style={{ background: color === 'var(--accent)' ? 'rgba(124,110,247,0.1)' : `${color}1A` }}><CheckIcon color={color} size={22} /></div><div><div className="cat-title">{title}</div><div className="cat-desc">{desc}</div></div><div className="cat-link" style={{ color }}>{label}<ArrowIcon /></div></Link>)}</div></div></section>;
}

function InsuranceHome() {
  return <section id="seguros-home" className="section-pad section-surface"><div className="container"><div className="seguros-inner"><div className="section-label" style={{ justifyContent: 'center' }}>Nova vertical</div><h2 style={{ marginBottom: 12 }}>Seguros que <span className="text-accent">protegem de verdade</span></h2><p className="section-desc" style={{ margin: '0 auto', textAlign: 'center' }}>Compare coberturas, entenda diferencas e escolha com mais seguranca. Sem jargoes.</p></div><InsuranceGrid /></div></section>;
}

function InsuranceGrid() {
  return <div className="seguros-grid">{insuranceCards.map(([name, desc, href, cta]) => <Link className="seguro-card" key={name} to={href}><div className="seg-icon"><CheckIcon color="currentColor" size={20} /></div><div className="seg-name">{name}</div><div className="seg-desc">{desc}</div><div className="seg-link">{cta} <ArrowIcon size={12} /></div></Link>)}</div>;
}

function BlogHome() {
  return <section id="blog-home" className="section-pad" style={{ background: 'var(--light-bg)' }}><div className="container"><div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20 }}><div><div className="section-label" style={{ color: 'var(--accent-dark)' }}>Educacao financeira</div><h2 style={{ color: 'var(--light-text)' }}>Conteudo para decidir<br />com mais consciencia</h2></div><Link className="btn-outline" style={{ borderColor: 'var(--accent-dark)', color: 'var(--accent-dark)' }} to="/blog">Ver todos os artigos</Link></div><div className="adsense-placeholder" style={{ marginTop: 28 }}><span>Publicidade</span></div><BlogGrid count={3} /></div></section>;
}

function BlogGrid({ count = 3 }) {
  return <div className="blog-grid">{blogCards.slice(0, count).map(([cat, title, excerpt, time, topic, bg]) => <Link className="blog-card" key={title} to="/blog/como-escolher-emprestimo-pessoal"><div className="blog-img" style={{ background: bg }}><div className="blog-cat-badge">{cat}</div></div><div className="blog-content"><div className="blog-meta"><span>{time}</span><span>-</span><span>{topic}</span></div><div className="blog-title">{title}</div><div className="blog-excerpt">{excerpt}</div></div></Link>)}</div>;
}

function Compliance() {
  return <section id="compliance" className="section-pad-sm"><div className="container"><div className="compliance-grid">{['Nao somos uma instituicao financeira. Apenas comparamos e conectamos.', 'Nao cobramos nenhum valor antecipado para analise de credito.', 'A aprovacao depende da analise individual de cada parceiro.', 'Seus dados sao protegidos em conformidade com a LGPD.'].map((text) => <div className="comp-item" key={text}><div className="comp-ico"><CheckIcon color="currentColor" size={16} /></div><div className="comp-text">{text}</div></div>)}</div></div></section>;
}

function FinalCta() {
  return <section id="cta-final" className="section-pad"><div className="container"><div className="cta-wrap"><div className="cta-glow" /><div className="section-label" style={{ justifyContent: 'center' }}>Comece agora</div><h2 className="cta-title">Pronto para <span className="text-accent">comparar</span><br />com mais clareza?</h2><p className="cta-desc">Sem compromisso. Sem cobranca. Em minutos voce ve caminhos possiveis para o seu perfil.</p><div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}><Link className="btn-hero" to="/comparar">Ver caminhos para meu perfil <ArrowIcon size={16} /></Link><Link className="btn-hero-outline" to="/criar-conta">Criar conta gratis</Link></div></div></div></section>;
}

function InnerHero({ badge, title, desc, action }) {
  return <div className="inner-hero"><div className="container"><div className="inner-hero-badge">{badge}</div><h1>{title}</h1><p className="section-desc">{desc}</p>{action}</div></div>;
}

export function PlatformComparePage() {
  const [offers, setOffers] = useState([]);
  useEffect(() => { Promise.all([getCreditOffers({ rank: true }), getCardOffers({ rank: true }), getFinancingOffers({ rank: true })]).then((groups) => setOffers(groups.flat().filter(Boolean))); }, []);
  const rows = offers.length ? offers.slice(0, 4).map((offer) => [offer.bankName || 'Parceiro', offer.title || offer.productName || 'Produto financeiro', offer.monthlyRate ? `${offer.monthlyRate}%` : offer.annualFee === 0 ? 'R$0' : 'Sob analise', offer.annualFee === 0 ? 'anuidade' : 'ao mes', ['Online', 'Parceiro verificado'], offer.bankName || 'CJ']) : productRows.map(([bank, product, rate, unit, tags, logo]) => [bank, product, rate, unit, tags, logo]);
  return <PlatformShell title="Comparar produtos | Cote Juros"><div className="page active" id="page-compare"><InnerHero badge="Marketplace" title={<>Compare produtos<br /><span className="text-accent">financeiros</span></>} desc="Taxas, condicoes e coberturas lado a lado. Voce decide quando e se avancar." action={<div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 24 }}><Link className="btn-primary" to="/radar">Acessar Radar de Credito</Link><button className="btn-outline">Ver mais filtros</button></div>} /><section className="section-pad" style={{ background: 'var(--bg-surface)' }}><div className="container"><div className="compare-layout"><FilterSidebar /><div><div className="adsense-placeholder-dark" style={{ marginBottom: 20 }}><span>Publicidade</span></div><div className="compare-results">{rows.map(([bank, title, rate, unit, tags, logo]) => <CompareResult key={`${bank}-${title}`} title={`${bank} - ${title}`} subtitle="Parceiro verificado" rate={rate} desc={unit} tags={tags} logo={logo} />)}</div><div className="api-ready-note">As condicoes exibidas sao ilustrativas e podem variar conforme perfil e disponibilidade dos parceiros. A Cote Juros nao e banco e nao concede credito diretamente.</div></div></div></div></section></div></PlatformShell>;
}

function FilterSidebar() {
  const fields = [
    ['Tipo de produto', ['Todos', 'Emprestimo pessoal', 'Cartao de credito', 'Financiamento', 'Seguro']],
    ['Valor desejado', null],
    ['Prazo', ['Qualquer', 'Ate 12 meses', 'De 12 a 36 meses', 'Acima de 36 meses']],
    ['Situacao do nome', ['Nome limpo', 'Restricao no CPF']],
    ['Finalidade', ['Qualquer', 'Quitar dividas', 'Reformar imovel', 'Emergencia', 'Viagem']]
  ];
  return <div className="filter-sidebar"><div className="filter-section-title">Filtros</div>{fields.map(([label, options]) => <div className="filter-group" key={label}><div className="filter-label">{label}</div>{options ? <select className="filter-select">{options.map((item) => <option key={item}>{item}</option>)}</select> : <input className="filter-input" placeholder="Ex: R$ 10.000" />}</div>)}<button className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>Aplicar filtros</button></div>;
}

function CompareResult({ title, subtitle, rate, desc, tags, logo }) {
  return <div className="compare-card"><div className="compare-card-main"><div className="bank-logo">{String(logo).slice(0, 3).toUpperCase()}</div><div><div className="compare-card-title">{title}</div><div className="compare-card-subtitle">{subtitle}</div><div className="compare-card-tags">{(tags || []).map((tag) => <span className="tag" key={tag}>{tag}</span>)}</div></div></div><div className="compare-card-rate"><div className="rate-big">{rate}</div><div className="rate-desc">{desc}</div></div><div className="compare-card-action"><button className="btn-primary">Ver oferta</button><span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Parceiro verificado</span></div></div>;
}

export function PlatformQuizPage() {
  return <PlatformShell title="Quiz inteligente | Cote Juros"><div className="page active" id="page-quiz"><InnerHero badge="Analise gratuita" title={<>Descubra qual caminho combina melhor com seu <span className="text-accent">momento financeiro</span></>} desc="Responda algumas perguntas e veja caminhos que podem fazer sentido para o seu perfil. Sem cobrancas antecipadas e sem promessa de aprovacao." /><section className="section-pad" style={{ background: 'var(--bg-surface)' }}><div className="container"><div className="quiz-shell"><div><SmartQuiz /></div><aside className="creditas-card"><div className="section-label">Funil preparado</div><h3 style={{ marginBottom: 10 }}>Quiz - resultado - lead - parceiro/API</h3><div className="quiz-side-list">{['Credito com garantia', 'Seguros', 'Cartoes', 'Compliance'].map((item) => <div className="quiz-side-item" key={item}><strong>{item}</strong><span>Rota preparada para adapters existentes, sem prometer aprovacao.</span></div>)}</div></aside></div></div></section></div></PlatformShell>;
}

export function PlatformRadarPage() {
  return <PlatformShell title="Radar de credito | Cote Juros"><div className="page active" id="page-radar"><InnerHero badge="Novo produto" title={<>Radar de <span className="text-accent">Credito</span></>} desc="Entenda seu perfil financeiro e veja caminhos possiveis antes de tomar qualquer decisao. Sem custo, sem compromisso." action={<Link className="btn-primary" style={{ marginTop: 24 }} to="/dashboard">Iniciar analise do perfil</Link>} /><section className="section-pad" style={{ background: 'var(--bg-surface)' }}><div className="container"><div style={{ maxWidth: 700, margin: '0 auto' }}><div className="dashboard-api-card"><div style={{ textAlign: 'center', marginBottom: 32 }}><div className="section-label" style={{ justifyContent: 'center' }}>Dashboard</div><h2 style={{ marginBottom: 8 }}>Seu perfil financeiro</h2><p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Dados e indicadores ilustrativos. As opcoes dependem da analise dos parceiros.</p></div><div className="stats-grid"><Stat label="Score estimado" value="740" color="var(--accent-light)" /><Stat label="Opcoes encontradas" value="12" /><Stat label="Melhor taxa" value="1,29%" color="var(--success)" /></div><div style={{ marginTop: 28 }}><div className="eligibility-title">Elegibilidade por produto</div>{[['Emprestimo pessoal', '85%', 'var(--accent)'], ['Cartao de credito', '70%', '#22D3A0'], ['Financiamento', '55%', '#F59E0B'], ['Seguros', '93%', '#F43F5E']].map(([label, pct, color]) => <EligibilityRow key={label} label={label} pct={pct} color={color} />)}</div></div></div></div></section></div></PlatformShell>;
}

function Stat({ label, value, color = 'var(--text-primary)' }) {
  return <div className="stat-card"><div className="stat-label">{label}</div><div className="stat-value" style={{ color }}>{value}</div></div>;
}

export function PlatformInsurancePage({ type = 'seguros' }) {
  const [offers, setOffers] = useState([]);
  useEffect(() => { getInsuranceOffers({ type }).then(setOffers); }, [type]);
  const pageMap = {
    auto: ['Seguro Auto', <>Seguro de carro <span className="text-accent">que voce entende</span></>, 'Compare coberturas, entenda o que esta incluso e escolha com seguranca. Sem letra miuda.'],
    moto: ['Seguro Moto', <>Seguro de moto <span className="text-accent">sem jargoes</span></>, 'Compare protecao para sua moto, assistencia e coberturas possiveis.'],
    viagem: ['Seguro Viagem', <>Viaje com <span className="text-accent">tranquilidade</span></>, 'Emergencia medica no exterior, bagagem extraviada, cancelamento de voo. Compare coberturas.'],
    vida: ['Seguro de Vida', <>Protecao para <span className="text-accent">quem voce ama</span></>, 'Morte, invalidez, doenca grave. Entenda o que cada plano cobre e escolha com consciencia.'],
    seguros: ['Seguros', <>Seguros que <span className="text-accent">protegem de verdade</span></>, 'Compare coberturas, entenda diferencas e escolha com mais seguranca. Sem prometer menor preco garantido.']
  };
  const [badge, title, desc] = pageMap[type] || pageMap.seguros;
  const detailCards = type === 'auto'
    ? [['Cobertura Completa', 'Colisao, roubo, furto, incendio e fenomenos naturais.'], ['Cobertura Terceiros', 'Danos que voce causa a outros veiculos ou pessoas.'], ['Assistencia 24h', 'Guincho, troca de pneu, chaveiro e emergencias.'], ['Carro Reserva', 'Veiculo substituto enquanto o seu esta em conserto.']]
    : [['Emergencia e suporte', 'Coberturas variam conforme seguradora e plano.'], ['Protecao financeira', 'Compare limites, franquias e exclusoes antes de contratar.'], ['Assistencia', 'Entenda o que esta incluso no atendimento.']];
  const gridOffers = offers.length ? offers.map((offer) => [offer.title, offer.description, '#', offer.cta || 'Cotar']) : insuranceCards;
  return <PlatformShell title={`${badge} | Cote Juros`}><div className="page active" id={`page-${type}`}><InnerHero badge={badge} title={title} desc={desc} action={type !== 'seguros' ? <button className="btn-primary" style={{ marginTop: 24 }}>Cotar {badge.toLowerCase()}</button> : null} /><section className="section-pad" style={{ background: 'var(--bg-surface)' }}><div className="container">{type === 'seguros' ? <div className="seguros-grid">{gridOffers.map(([name, description, href, cta]) => <Link className="seguro-card" key={name} to={href}><div className="seg-icon"><CheckIcon color="currentColor" size={20} /></div><div className="seg-name">{name}</div><div className="seg-desc">{description}</div><div className="seg-link">{cta} <ArrowIcon size={12} /></div></Link>)}</div> : <div className="coverage-grid">{detailCards.map(([name, description]) => <div className="coverage-card" key={name}><div className="coverage-title">{name}</div><div className="coverage-desc">{description}</div></div>)}</div>}<div className="api-ready-note" style={{ marginTop: 24 }}>As condicoes variam por seguradora. Consulte o parceiro escolhido para cobertura exata.</div></div></section></div></PlatformShell>;
}

export function PlatformBlogPage() {
  return <PlatformShell title="Blog | Cote Juros"><div className="page active" id="page-blog"><InnerHero badge="Conteudo" title={<>Educacao <span className="text-accent">financeira</span></>} desc="Artigos, guias e analises para voce tomar decisoes com mais consciencia e menos pressa." /><section className="section-pad" style={{ background: 'var(--light-bg)' }}><div className="container"><div className="adsense-placeholder"><span>Publicidade</span></div><div className="filter-tabs" style={{ marginBottom: 28, marginTop: 0 }}>{['Todos', 'Credito', 'Cartoes', 'Seguros', 'Planejamento', 'Financiamento'].map((item, index) => <button key={item} className={`filter-tab ${index === 0 ? 'active' : ''}`}>{item}</button>)}</div><BlogGrid count={6} /><div className="adsense-placeholder" style={{ marginTop: 32 }}><span>Publicidade</span></div></div></section></div></PlatformShell>;
}

export function PlatformBlogArticlePage() {
  return <PlatformShell title="Artigo | Cote Juros"><div className="page active" id="page-blog-detalhe"><section className="section-pad" style={{ background: 'var(--bg-primary)', paddingTop: 110 }}><div className="container"><div className="article-layout"><article><div className="article-header"><div className="article-cat">Credito</div><div className="adsense-placeholder-dark" style={{ marginBottom: 16 }}><span>Publicidade</span></div><h1 className="article-title">Como escolher um emprestimo pessoal sem cair em armadilhas</h1><div className="article-meta"><span>15 min de leitura</span><span>-</span><span>Atualizado em jan 2025</span><span>-</span><span>Equipe Cote Juros</span></div></div><div className="article-body"><p>Contratar um emprestimo pessoal pode parecer simples, mas envolve variaveis que, se ignoradas, podem custar muito mais do que o esperado. Antes de assinar qualquer contrato, e fundamental entender o que esta sendo contratado.</p><h3>O que e o CET e por que e o numero mais importante</h3><p>O Custo Efetivo Total concentra todos os custos do credito: taxa de juros, seguros obrigatorios, tarifas administrativas e IOF. E o numero que permite uma comparacao justa entre diferentes ofertas.</p><div className="adsense-placeholder-dark"><span>Publicidade</span></div><h3>Parcela menor nao significa credito mais barato</h3><p>Prazo mais longo resulta em parcelas menores, mas o valor total pago ao final pode ser significativamente maior. Sempre simule o total a ser pago.</p><h3>Cuidado com cobrancas antecipadas</h3><p>Nenhuma instituicao financeira seria exige pagamento antecipado para liberar credito. A Cote Juros nunca cobra valores antecipados.</p><div className="adsense-placeholder-dark"><span>Publicidade</span></div><p className="article-callout">Compare sempre pelo CET, nao pela taxa nominal. E nunca pague antecipado para ter credito liberado.</p></div><div style={{ marginTop: 36 }}><Link className="btn-primary" to="/comparar">Comparar emprestimos agora</Link></div></article><aside className="article-sidebar"><div className="sidebar-widget"><div className="sidebar-widget-title">Comparar agora</div><p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 14, lineHeight: 1.6 }}>Veja opcoes disponiveis para o seu perfil.</p><Link className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} to="/comparar">Ver opcoes disponiveis</Link></div><div className="adsense-placeholder-dark"><span>Publicidade</span></div><div className="sidebar-widget"><div className="sidebar-widget-title">Artigos relacionados</div><div className="related-links"><Link to="/blog/score-de-credito">Score de credito: mitos e verdades</Link><Link to="/blog/sair-do-vermelho">5 formas de sair do vermelho</Link></div></div></aside></div></div></section></div></PlatformShell>;
}

export function PlatformFaqPage() {
  return <PlatformShell title="FAQ | Cote Juros"><div className="page active" id="page-faq"><InnerHero badge="Duvidas" title={<>Perguntas <span className="text-accent">frequentes</span></>} desc="Tudo que voce precisa saber sobre como a Cote Juros funciona." /><section className="section-pad" style={{ background: 'var(--bg-surface)' }}><div className="container" style={{ maxWidth: 760 }}><div className="faq-list">{faqItems.map(([q, answer], index) => <FaqItem key={q} question={q} answer={answer} initiallyOpen={index === 0} />)}</div></div></section></div></PlatformShell>;
}

function FaqItem({ question, answer, initiallyOpen = false }) {
  const [open, setOpen] = useState(initiallyOpen);
  return <div className={`faq-item ${open ? 'open' : ''}`}><button type="button" className="faq-question" onClick={() => setOpen((value) => !value)}>{question}<div className="faq-icon">+</div></button><div className="faq-answer">{answer}</div></div>;
}

export function PlatformAboutPage() {
  const values = [['Seguranca', 'Dados protegidos. Parceiros verificados. Processo transparente.'], ['Educacao', 'Conteudo financeiro de qualidade para decisoes mais conscientes.'], ['Clareza', 'Informacao objetiva, sem jargoes desnecessarios ou promessas vagas.']];
  return <PlatformShell title="Sobre | Cote Juros"><div className="page active" id="page-sobre"><InnerHero badge="Quem somos" title={<>Nossa <span className="text-accent">missao</span></>} desc="Acreditamos que decisoes financeiras melhores comecam com informacao mais clara." /><section className="section-pad" style={{ background: 'var(--bg-surface)' }}><div className="container"><div className="about-mission"><div><div className="section-label">Proposito</div><h2 style={{ marginBottom: 16 }}>Comparacao como ferramenta de <span className="text-accent">liberdade</span></h2><p style={{ color: 'var(--text-secondary)', fontSize: 15, lineHeight: 1.8, marginBottom: 20 }}>A Cote Juros nasceu da percepcao de que muita gente contrata credito, seguro ou financiamento sem entender bem as condicoes - e paga caro por isso.</p><p style={{ color: 'var(--text-secondary)', fontSize: 15, lineHeight: 1.8 }}>Nao somos banco, nao concedemos credito e nao temos interesse em empurrar nenhum produto especifico. Nosso papel e organizar informacao.</p></div><div className="mission-card">{['Transparencia', 'Sem pressao', 'Custo zero'].map((item) => <div className="mission-row" key={item}><div className="mission-icon"><CheckIcon color="var(--accent-light)" size={16} /></div><div><strong>{item}</strong><span>Mostramos o que sabemos, sem prometer o que nao podemos garantir.</span></div></div>)}</div></div><div className="values-grid">{values.map(([title, desc]) => <div className="value-card" key={title}><div className="value-icon"><CheckIcon color="var(--accent-light)" size={20} /></div><div className="value-title">{title}</div><div className="value-desc">{desc}</div></div>)}</div></div></section></div></PlatformShell>;
}

export function PlatformContactPage() {
  return <PlatformShell title="Contato | Cote Juros"><div className="page active" id="page-contato"><InnerHero badge="Fale conosco" title={<>Entre em <span className="text-accent">contato</span></>} desc="Duvidas, parcerias ou sugestoes. Estamos aqui." /><section className="section-pad" style={{ background: 'var(--bg-surface)' }}><div className="container"><div className="contact-layout"><div><h3 style={{ marginBottom: 20 }}>Canais disponiveis</h3>{[['E-mail', 'contato@cotejuros.com.br'], ['Atendimento', 'Segunda a sexta, 9h as 18h'], ['Localizacao', 'Brasil - atendimento digital']].map(([label, item]) => <div className="contact-card" key={item}><div className="contact-ico"><CheckIcon color="var(--accent-light)" size={18} /></div><div><div className="contact-val-label">{label}</div><div className="contact-val">{item}</div></div></div>)}</div><form className="contact-form"><h3 style={{ marginBottom: 20 }}>Envie uma mensagem</h3><div className="form-row"><div className="form-group"><label className="form-label">Nome</label><input className="form-input" placeholder="Seu nome" /></div><div className="form-group"><label className="form-label">E-mail</label><input className="form-input" type="email" placeholder="seu@email.com" /></div></div><div className="form-group"><label className="form-label">Assunto</label><select className="form-input"><option>Duvida geral</option><option>Parceria comercial</option><option>Sugestao</option><option>Reclamacao</option></select></div><div className="form-group"><label className="form-label">Mensagem</label><textarea className="form-input" placeholder="Escreva sua mensagem aqui..." /></div><button className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: 13 }} type="button">Enviar mensagem</button></form></div></div></section></div></PlatformShell>;
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
  return <PlatformShell title={`${signup ? 'Criar conta' : 'Login'} | Cote Juros`} bare><div className="page active" id={signup ? 'page-criar-conta' : 'page-login'}><div className="auth-page"><div className="auth-bg-orb" /><form className="auth-card" style={signup ? { maxWidth: 480 } : undefined} onSubmit={submit}><div className="auth-logo"><span className="logo-text"><span className="logo-primary">Cote</span><span className="logo-accent">Juros</span></span></div><div className="auth-title">{signup ? 'Criar conta gratis' : 'Acessar minha conta'}</div><div className="auth-sub">{signup ? 'Compare produtos financeiros e salve suas analises.' : 'Entre para ver suas comparacoes e ofertas salvas.'}</div>{signup ? <div className="form-row"><div className="form-group"><label className="form-label">Nome</label><input className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Seu nome" /></div><div className="form-group"><label className="form-label">Sobrenome</label><input className="form-input" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} placeholder="Sobrenome" /></div></div> : null}<div className="form-group"><label className="form-label">E-mail</label><input className="form-input" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="seu@email.com" /></div><div className="form-group"><label className="form-label">Senha</label><input className="form-input" type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder={signup ? 'Minimo 8 caracteres' : '********'} /></div>{signup ? <div className="form-group"><label className="form-label">CPF</label><input className="form-input" value={form.cpf} onChange={(e) => setForm({ ...form, cpf: e.target.value })} placeholder="000.000.000-00" /></div> : <Link className="forgot-link" to="/login">Esqueci minha senha</Link>}<button className="btn-auth">{signup ? 'Criar conta' : 'Entrar'}</button><div className="auth-divider">{signup ? 'ja tenho conta' : 'ou'}</div><div className="auth-signup-link">{signup ? <Link to="/login">Fazer login</Link> : <>Nao tem conta? <Link to="/criar-conta">Criar conta gratis</Link></>}</div><div className="auth-disclaimer">{signup ? 'Ao criar sua conta voce concorda com os Termos de Uso e Politica de Privacidade.' : 'Acesso destinado a clientes e parceiros da Cote Juros.'}<br />A Cote Juros nao e banco e nao solicita senhas por e-mail ou WhatsApp.</div></form></div></div></PlatformShell>;
}

export function PlatformDashboardPage() {
  const [lead, setLead] = useState(null);
  const analysis = useMemo(() => {
    try { return JSON.parse(window.localStorage.getItem('cote_last_analysis') || 'null'); } catch { return null; }
  }, []);
  useEffect(() => { setLead(getLeadFromLocalStorage()); trackEvent('dashboard_opened', { sourcePage: '/dashboard' }); }, []);
  const rec = analysis?.recommendation || lead?.recommendation;
  const score = rec?.score || 740;
  return <PlatformShell title="Dashboard | Cote Juros" bare><div className="page active" id="page-dashboard"><div className="dashboard-layout"><aside className="dash-sidebar"><div className="dash-sidebar-logo"><span className="logo-text"><span className="logo-primary">Cote</span><span className="logo-accent">Juros</span></span></div><ul className="dash-menu">{['Visao geral', 'Radar de Credito', 'Comparacoes', 'Favoritos', 'Meu perfil', 'Sair'].map((item, index) => <li className={`dash-menu-item ${index === 0 ? 'active' : ''}`} key={item}>{item}</li>)}</ul></aside><main className="dash-content"><div className="dash-greeting">Bem-vindo, Maria</div><div className="dash-sub">Seu painel esta atualizado. Confira suas opcoes e analises.</div><div className="dash-stats-row"><Stat label="Score estimado" value={score} color="var(--accent-light)" /><Stat label="Opcoes ativas" value="12" /><Stat label="Melhor taxa" value="1,29%" color="var(--success)" /><Stat label="Comparacoes" value="3" /></div><div className="dash-panels"><div className="dash-panel"><div className="dash-panel-title">Ofertas para seu perfil</div>{[['Itau - Emp. Pessoal', 'Emprestimo', '1,79%/mes'], ['Caixa - FGTS', 'Emprestimo', '1,29%/mes'], ['Porto Seguro - Auto', 'Seguro', 'R$89/mes'], ['Nubank - Roxinho', 'Cartao', 'Sem anuidade']].map(([name, typeName, rate]) => <div className="offer-row" key={name}><div><div className="offer-name">{name}</div><div className="offer-type">{typeName}</div></div><div className="offer-rate">{rate}</div><button className="btn-primary" style={{ fontSize: 12, padding: '7px 14px' }}>Ver</button></div>)}</div><div className="dash-panel"><div className="dash-panel-title">Radar de Credito</div>{[['Emprestimo pessoal', '85%', 'var(--accent)'], ['Cartao de credito', '70%', '#22D3A0'], ['Financiamento', '55%', '#F59E0B'], ['Seguros', '93%', '#F43F5E']].map(([label, pct, color]) => <div className="dash-radar-row" key={label}><div><span>{label}</span><span style={{ color }}>{pct}</span></div><div><i style={{ width: pct, background: color }} /></div></div>)}<Link className="btn-outline" style={{ width: '100%', justifyContent: 'center', marginTop: 20 }} to="/radar">Ver analise completa</Link></div></div><div className="dashboard-api-card" style={{ marginTop: 22 }}><div className="dash-panel-title">Minha area Cote Juros</div><div className="dashboard-api-grid" style={{ gridTemplateColumns: 'repeat(3,minmax(0,1fr))' }}>{['Minhas analises', 'Recomendacoes salvas', 'Cotacoes de seguros', 'Propostas em andamento', 'Parceiros acessados', 'Status do radar'].map((item) => <div className="dashboard-api-item" key={item}><strong>{item}</strong><span>Area preparada para dados reais dos adapters.</span></div>)}</div><div className="partner-cta-row" style={{ marginTop: 18 }}><Link className="btn-primary" to="/quiz">Refazer analise</Link><Link className="btn-outline" to="/comparar">Ver novas opcoes</Link></div></div></main></div></div></PlatformShell>;
}
