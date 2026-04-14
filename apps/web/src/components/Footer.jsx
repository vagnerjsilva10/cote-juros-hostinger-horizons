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
    <footer className="border-t border-border bg-background py-12 sm:py-16 lg:py-18">
      <div className="page-shell">
        <div className="mb-10 grid gap-8 sm:gap-10 lg:mb-14 lg:grid-cols-[1.4fr_repeat(4,1fr)] lg:gap-12">
          <div className="max-w-md space-y-6">
            <Link to="/" className="inline-block">
              <CoteJurosLogo />
            </Link>
            <p className="text-sm leading-7 text-muted-foreground">
              A Cote Juros ajuda você a encontrar opções de crédito que podem fazer sentido para o seu perfil, com mais
              clareza e sem promessa falsa.
            </p>
            <div className="flex flex-wrap gap-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background-secondary px-3 py-2 text-xs font-medium text-foreground">
                <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                Sem cobrança antecipada
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background-secondary px-3 py-2 text-xs font-medium text-foreground">
                Não somos banco
              </div>
            </div>
          </div>

          {footerSections.map((section) => (
            <div key={section.title}>
              <span className="mb-5 block text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
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

        <div className="flex flex-col gap-3 border-t border-border pt-6 md:flex-row md:items-center md:justify-between md:pt-8">
          <div>
            <p className="text-sm font-medium text-foreground">Cote Juros © {currentYear}</p>
            <p className="text-sm text-muted-foreground">
              A Cote Juros não é banco, não concede crédito diretamente e não garante aprovação.
            </p>
          </div>
          <p className="text-sm text-muted-foreground">Sem compromisso e sem cobrança antecipada</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
