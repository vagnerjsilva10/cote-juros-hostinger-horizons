import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, ShieldCheck } from 'lucide-react';
import { CoteJurosLogo } from './CoteJurosLogo.jsx';

function Footer() {
  const currentYear = new Date().getFullYear();

  const footerSections = [
    {
      title: 'Produto',
      links: [
        { label: 'Emprestimos', path: '/emprestimos' },
        { label: 'Cartoes', path: '/cartoes-de-credito' },
        { label: 'Financiamento', path: '/financiamento' },
        { label: 'Ferramentas', path: '/ferramentas' }
      ]
    },
    {
      title: 'Conteudo',
      links: [
        { label: 'Blog', path: '/blog' },
        { label: 'Diagnostico', path: '/diagnostico-financeiro' },
        { label: 'Cote Finance AI', path: '/cote-finance-ai' }
      ]
    },
    {
      title: 'Empresa',
      links: [
        { label: 'Sobre', path: '/sobre-nos' },
        { label: 'Contato', path: '/contato' },
        { label: 'Privacidade', path: '/politica-de-privacidade' },
        { label: 'Termos', path: '/termos-de-uso' }
      ]
    }
  ];

  return (
    <footer className="border-t border-border bg-background py-20">
      <div className="page-shell">
        <div className="mb-16 grid gap-12 lg:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div className="max-w-md space-y-6">
            <Link to="/" className="inline-block">
              <CoteJurosLogo />
            </Link>
            <p className="text-sm leading-7 text-muted-foreground">
              Um comparador financeiro com interface limpa, simulacao objetiva e orientacao para credito com menos ruido.
            </p>
            <div className="flex flex-wrap gap-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background-secondary px-3 py-2 text-xs font-medium text-foreground">
                <ShieldCheck className="h-3.5 w-3.5" />
                Experiencia segura
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background-secondary px-3 py-2 text-xs font-medium text-foreground">
                LGPD
              </div>
            </div>
          </div>

          {footerSections.map((section) => (
            <div key={section.title}>
              <span className="mb-5 block text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                {section.title}
              </span>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.path}>
                    <Link
                      to={link.path}
                      className="group inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
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

        <div className="flex flex-col gap-4 border-t border-border pt-8 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">Cote Juros © {currentYear}</p>
            <p className="text-sm text-muted-foreground">
              Credito explicado com mais clareza, menos excesso visual e foco no que importa.
            </p>
          </div>
          <p className="text-sm text-muted-foreground">Brasil • Plataforma digital</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
