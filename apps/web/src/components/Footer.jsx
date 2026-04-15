import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, ShieldCheck } from 'lucide-react';
import { CoteJurosLogo } from './CoteJurosLogo.jsx';

function Footer() {
  const currentYear = new Date().getFullYear();

  const footerSections = [
    {
      title: 'Crédito',
      links: [
        { label: 'Empréstimos', path: '/emprestimos' },
        { label: 'Cartões', path: '/cartoes' },
        { label: 'Financiamentos', path: '/financiamentos' },
        { label: 'Comparar empréstimo online', path: '/comparar/emprestimo-online' }
      ]
    },
    {
      title: 'Conteúdo',
      links: [
        { label: 'Blog', path: '/blog' },
        { label: 'Como funciona', path: '/sobre-nos' },
        { label: 'Ofertas externas', path: '/ofertas' },
        { label: 'Ferramentas', path: '/ferramentas' }
      ]
    },
    {
      title: 'Institucional',
      links: [
        { label: 'Sobre', path: '/sobre-nos' },
        { label: 'Contato', path: '/contato' },
        { label: 'Privacidade', path: '/politica-de-privacidade' },
        { label: 'Termos', path: '/termos-de-uso' }
      ]
    },
    {
      title: 'Ecossistema',
      links: [{ label: 'Cote Finance', path: '/cote-finance-ai' }]
    }
  ];

  return (
    <footer className="footer-premium-bg border-t border-border py-12 sm:py-14 lg:py-16">
      <div className="page-shell">
        <div className="mb-10 grid gap-8 lg:mb-12 lg:grid-cols-[1.5fr_repeat(4,1fr)] lg:gap-10">
          <div className="max-w-md space-y-5">
            <Link to="/" className="inline-block">
              <CoteJurosLogo />
            </Link>
            <p className="text-sm leading-7 text-muted-foreground">
              A Cote Juros ajuda você a comparar crédito com mais clareza, entender condições antes de contratar e decidir sem cobrança antecipada.
            </p>
            <div className="flex flex-wrap gap-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-white px-3 py-2 text-xs font-medium text-foreground shadow-[0_6px_16px_rgba(15,23,42,0.04)]">
                <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                Sem cobrança antecipada
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-white px-3 py-2 text-xs font-medium text-foreground shadow-[0_6px_16px_rgba(15,23,42,0.04)]">
                Você decide com calma
              </div>
            </div>
          </div>

          {footerSections.map((section) => (
            <div key={section.title}>
              <span className="mb-4 block text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                {section.title}
              </span>
              <ul className="space-y-2.5">
                {section.links.map((link) => (
                  <li key={link.path}>
                    <Link
                      to={link.path}
                      className="link-animated group inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                    >
                      {link.label}
                      <ArrowUpRight className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3 border-t border-border pt-5 md:flex-row md:items-center md:justify-between md:pt-6">
          <div>
            <p className="text-sm font-medium text-foreground">Cote Juros © {currentYear}</p>
            <p className="text-sm text-muted-foreground">
              A Cote Juros não é banco, não concede crédito diretamente e não garante aprovação.
            </p>
          </div>
          <p className="text-sm text-muted-foreground">Compare antes de contratar.</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
