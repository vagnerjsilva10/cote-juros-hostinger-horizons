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
        { label: 'Como funciona', path: '/como-funciona' },
        { label: 'Ferramentas', path: '/ferramentas' },
        { label: 'Calculadora de CET', path: '/calculadora-cet' },
        { label: 'Estudo de crédito', path: '/estudos/custo-emprestimo-negativado-2026' },
        { label: 'Perguntas frequentes', path: '/perguntas-frequentes' }
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
    <footer id="site-footer" className="footer-premium-bg footer-dark">
      <div className="page-shell">
        <div className="mb-8 grid gap-8 lg:grid-cols-[1.45fr_repeat(4,1fr)] lg:gap-10">
          <div className="max-w-md space-y-4">
            <Link to="/" className="inline-block">
              <CoteJurosLogo variant="original-light" className="site-logo" />
            </Link>
            <p className="text-sm leading-6 text-white/70">
              A Cote Juros ajuda você a comparar crédito com mais clareza, entender condições antes de contratar e decidir sem cobrança antecipada.
            </p>
            <div className="flex flex-wrap gap-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-medium text-white/80">
                <ShieldCheck className="h-3.5 w-3.5 text-[var(--brand-3)]" />
                Sem cobrança antecipada
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-medium text-white/80">
                Você decide com mais calma
              </div>
            </div>
          </div>

          {footerSections.map((section) => (
            <div key={section.title}>
              <span className="footer-column-title mb-4 block text-[11px] font-medium uppercase tracking-[0.18em] text-white/50">
                {section.title}
              </span>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.path}>
                    <Link
                      to={link.path}
                      className="link-animated group inline-flex items-center gap-1 text-sm text-white/70 hover:text-white"
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

        <div className="flex flex-col gap-2 border-t border-white/10 pt-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium text-white">Cote Juros © {currentYear}</p>
            <p className="text-sm text-white/60">
              A Cote Juros não é banco, não concede crédito diretamente e não garante aprovação.
            </p>
          </div>
          <p className="text-sm text-white/60">Compare antes de contratar.</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
