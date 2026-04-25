import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, ShieldCheck } from 'lucide-react';
import { CoteJurosLogo } from './CoteJurosLogo.jsx';
import { compactFooterSections } from '@/navigation/seoNavigation.js';

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
              A Cote Juros ajuda voc\u00EA a comparar cr\u00E9dito com mais clareza, entender condi\u00E7\u00F5es antes de contratar e decidir sem cobran\u00E7a antecipada.
            </p>
            <div className="flex flex-wrap gap-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-medium text-white/80">
                <ShieldCheck className="h-3.5 w-3.5 text-[var(--brand-3)]" />
                Sem cobran\u00E7a antecipada
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-medium text-white/80">
                Voc\u00EA decide com mais calma
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

        <div className="flex flex-col gap-2 border-t border-white/10 pt-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium text-white">Cote Juros &copy; {currentYear}</p>
            <p className="text-sm text-white/60">
              A Cote Juros n\u00E3o \u00E9 banco, n\u00E3o concede cr\u00E9dito diretamente e n\u00E3o garante aprova\u00E7\u00E3o.
            </p>
          </div>
          <p className="text-sm text-white/60">Compare antes de contratar.</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
