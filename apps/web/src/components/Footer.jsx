import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Twitter, Instagram, Linkedin, ShieldCheck, Lock, Building } from 'lucide-react';
import { CoteJurosLogo } from './CoteJurosLogo.jsx';

function Footer() {
  const currentYear = new Date().getFullYear();

  const footerSections = [
    {
      title: 'Comparadores',
      links: [
        { label: 'Melhores empréstimos', path: '/melhores-emprestimos' },
        { label: 'Melhores cartões', path: '/melhores-cartoes' },
        { label: 'Melhores financiamentos', path: '/financiamento' },
        { label: 'Comparador de taxas', path: '/emprestimos' }
      ]
    },
    {
      title: 'Ferramentas',
      links: [
        { label: 'Simuladores', path: '/ferramentas' },
        { label: 'Calculadoras', path: '/ferramentas' },
        { label: 'Análise de Perfil', path: '/diagnostico-financeiro' },
        { label: 'Cote Finance AI', path: '/cote-finance-ai' }
      ]
    },
    {
      title: 'Educação',
      links: [
        { label: 'Blog', path: '/blog' },
        { label: 'Guias', path: '/blog' },
        { label: 'Como aumentar score', path: '/como-aumentar-score' },
        { label: 'Dicas financeiras', path: '/blog' }
      ]
    },
    {
      title: 'Empresa',
      links: [
        { label: 'Sobre', path: '/sobre-nos' },
        { label: 'Contato', path: '/contato' },
        { label: 'Carreiras', path: '/sobre-nos' },
        { label: 'Imprensa', path: '/contato' }
      ]
    },
    {
      title: 'Legal',
      links: [
        { label: 'Privacidade', path: '/politica-de-privacidade' },
        { label: 'Termos', path: '/termos-de-uso' },
        { label: 'LGPD', path: '/politica-de-privacidade' },
        { label: 'Aviso', path: '/termos-de-uso' }
      ]
    }
  ];

  const socialItems = [
    { label: 'LinkedIn', Icon: Linkedin },
    { label: 'Twitter', Icon: Twitter },
    { label: 'Instagram', Icon: Instagram },
    { label: 'Facebook', Icon: Facebook }
  ];

  return (
    <footer className="bg-secondary-subtle border-t border-border pt-20 pb-10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 lg:gap-12 mb-16">
          <div className="col-span-2 lg:col-span-2 space-y-6">
            <Link to="/" className="inline-block">
              <CoteJurosLogo variant="horizontal" className="h-14 w-auto" />
            </Link>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-sm">
              Comparador financeiro inteligente. Encontre as melhores taxas de empréstimos, cartões e financiamentos do mercado em segundos.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 bg-white rounded-lg py-2 px-3 border border-border shadow-sm">
                <ShieldCheck className="w-4 h-4 text-primary" />
                <span className="text-xs font-semibold text-foreground">SSL Seguro</span>
              </div>
              <div className="flex items-center gap-2 bg-white rounded-lg py-2 px-3 border border-border shadow-sm">
                <Lock className="w-4 h-4 text-primary" />
                <span className="text-xs font-semibold text-foreground">LGPD</span>
              </div>
              <div className="flex items-center gap-2 bg-white rounded-lg py-2 px-3 border border-border shadow-sm">
                <Building className="w-4 h-4 text-primary" />
                <span className="text-xs font-semibold text-foreground">Bacen</span>
              </div>
            </div>
          </div>

          {footerSections.map((section) => (
            <div key={section.title} className="col-span-1">
              <span className="text-sm font-bold text-foreground uppercase tracking-wider mb-6 block">
                {section.title}
              </span>
              <ul className="space-y-4">
                {section.links.map((link) => (
                  <li key={link.path}>
                    <Link
                      to={link.path}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors duration-200 font-medium"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-border pt-8 flex flex-col md:flex-row justify-between items-center space-y-6 md:space-y-0">
          <div className="flex flex-col items-center md:items-start space-y-2">
            <p className="text-sm text-muted-foreground font-medium">
              Cote Juros © {currentYear}. Todos os direitos reservados.
            </p>
            <p className="text-xs text-muted-foreground/80">
              Operação digital no Brasil • Informações societárias no lançamento oficial
            </p>
          </div>

          <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-full border border-border shadow-sm">
            <Lock className="w-3 h-3 text-primary" />
            <span className="text-xs text-muted-foreground font-medium">Seus dados são protegidos com criptografia SSL</span>
          </div>

          <div className="flex items-center space-x-5">
            {socialItems.map(({ label, Icon }) => (
              <button
                key={label}
                type="button"
                aria-label={`${label} em breve`}
                title={`${label} em breve`}
                className="text-muted-foreground/70 transition-colors duration-200 cursor-default"
              >
                <Icon className="h-5 w-5" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
