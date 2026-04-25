import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, ShieldCheck } from 'lucide-react';
import { CoteJurosLogo } from './CoteJurosLogo.jsx';
import { compactFooterSections } from '@/navigation/seoNavigation.js';

const legalLinks = [
  { label: 'Termos de uso', path: '/termos-de-uso' },
  { label: 'Privacidade', path: '/politica-de-privacidade' },
  { label: 'Contato', path: '/contato' }
];

function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer id="site-footer" className="footer-premium-bg footer-dark">
      <div className="page-shell">
        <div className="mb-8 grid gap-8 lg:grid-cols-[1.15fr_2fr] lg:gap-12">
          <div className="max-w-sm space-y-4">
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

          <nav aria-label="Links principais do site" className="grid min-w-0 gap-x-8 gap-y-7 sm:grid-cols-2 xl:grid-cols-4">
            {compactFooterSections.map((section) => (
              <div key={section.title}>
                <span className="footer-column-title mb-4 block text-[11px] font-medium uppercase tracking-[0.18em] text-white/50">
                  {section.title}
                </span>
                <ul className="space-y-2">
                  {section.links.map((link) => (
                    <li key={link.path}>
                      <Link
                        to={link.path}
                        className="link-animated group inline-flex items-center gap-1 text-sm leading-5 text-white/70 hover:text-white"
                      >
                        {link.label}
                        <ArrowUpRight className="h-3.5 w-3.5 shrink-0 opacity-0 transition-opacity group-hover:opacity-100" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <div className="mb-6 rounded-2xl border border-white/10 bg-white/[0.035] p-4 text-xs leading-6 text-white/62 md:p-5">
          <p className="font-semibold text-white/80">Importante: nossos serviços são gratuitos.</p>
          <p>
            A Cote Juros nunca solicita pagamento antecipado para liberar empréstimos, aumentar limite, aprovar crédito ou destravar qualquer oferta.
          </p>
          <p className="mt-2">
            A Cote Juros não é instituição financeira, não concede crédito diretamente, não aprova propostas e não realiza operações de crédito. Atuamos como portal de conteúdo, comparação e encaminhamento para parceiros. Ofertas e simulações, quando exibidas, são definidas pelas instituições ou empresas responsáveis, sujeitas à análise de crédito, políticas internas, IOF, CET, prazos, taxas e demais condições de cada parceiro.
          </p>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
            {legalLinks.map((link) => (
              <Link key={link.path} to={link.path} className="font-medium text-white/75 hover:text-white">
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2 border-t border-white/10 pt-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium text-white">Cote Juros &copy; {currentYear}</p>
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
