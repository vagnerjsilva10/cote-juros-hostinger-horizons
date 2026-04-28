import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, ShieldCheck } from 'lucide-react';
import { CoteJurosLogo } from './CoteJurosLogo.jsx';
import { compactFooterSections } from '@/navigation/seoNavigation.js';
import { portalApi } from '@/platform/services/portalApi.js';
import { settingValue, useSiteSettings } from '@/hooks/useSiteSettings.js';

const legalLinks = [
  { label: 'Termos de uso', path: '/termos-de-uso' },
  { label: 'Privacidade', path: '/politica-de-privacidade' },
  { label: 'Contato', path: '/contato' }
];

const fallbackFooterDisclaimers = [
  {
    key: 'no_upfront_fee',
    title: 'Importante: nossos servicos sao gratuitos.',
    content: 'A Cote Juros nunca solicita pagamento antecipado para liberar emprestimos, aumentar limite, aprovar credito ou destravar qualquer oferta.'
  },
  {
    key: 'not_bank',
    title: '',
    content: 'A Cote Juros nao e instituicao financeira, nao concede credito diretamente, nao aprova propostas e nao realiza operacoes de credito. Atuamos como portal de conteudo, comparacao e encaminhamento para parceiros. Ofertas e simulacoes, quando exibidas, sao definidas pelas instituicoes ou empresas responsaveis, sujeitas a analise de credito, politicas internas, IOF, CET, prazos, taxas e demais condicoes de cada parceiro.'
  }
];

function Footer() {
  const currentYear = new Date().getFullYear();
  const [navigation, setNavigation] = useState(null);
  const [disclaimers, setDisclaimers] = useState([]);
  const settings = useSiteSettings();

  useEffect(() => {
    let active = true;
    Promise.all([
      portalApi.getSiteNavigation(),
      portalApi.getSiteDisclaimers({ placement: 'footer' })
    ])
      .then(([navData, disclaimerData]) => {
        if (!active) return;
        setNavigation(navData || null);
        setDisclaimers(Array.isArray(disclaimerData) ? disclaimerData : []);
      })
      .catch(() => {
        if (!active) return;
        setNavigation(null);
        setDisclaimers([]);
      });
    return () => {
      active = false;
    };
  }, []);

  const footerSections = useMemo(() => {
    const tree = navigation?.treeByLocation?.footer || [];
    if (!tree.length) return compactFooterSections;

    const sections = tree.map((section) => ({
      title: section.label,
      links: (section.links || []).map((link) => ({ label: link.label, path: link.href }))
    })).filter((section) => section.title && section.links.length);

    return sections.length ? sections : compactFooterSections;
  }, [navigation]);

  const legalFooterLinks = useMemo(() => {
    const legalItems = navigation?.byLocation?.legal || [];
    if (!legalItems.length) return legalLinks;
    return legalItems.map((item) => ({ label: item.label, path: item.href })).filter((item) => item.label && item.path);
  }, [navigation]);

  const activeDisclaimers = disclaimers.length ? disclaimers : fallbackFooterDisclaimers;
  const description = settingValue(
    settings,
    'footer.description',
    'A Cote Juros ajuda voce a comparar credito com mais clareza, entender condicoes antes de contratar e decidir sem cobranca antecipada.'
  );
  const badges = settingValue(settings, 'footer.badges', ['Sem cobranca antecipada', 'Voce decide com mais calma']);
  const copyrightName = settingValue(settings, 'brand.name', 'Cote Juros');
  const bottomText = settingValue(settings, 'footer.bottomText', 'A Cote Juros nao e banco, nao concede credito diretamente e nao garante aprovacao.');
  const tagline = settingValue(settings, 'footer.tagline', 'Compare antes de contratar.');

  return (
    <footer id="site-footer" className="footer-premium-bg footer-dark">
      <div className="page-shell">
        <div className="mb-8 grid gap-8 lg:grid-cols-[1.15fr_2fr] lg:gap-12">
          <div className="max-w-sm space-y-4">
            <Link to="/" className="inline-block">
              <CoteJurosLogo variant="original-light" className="site-logo" />
            </Link>
            <p className="text-sm leading-6 text-white/70">
              {description}
            </p>
            <div className="flex flex-wrap gap-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-medium text-white/80">
                <ShieldCheck className="h-3.5 w-3.5 text-[var(--brand-3)]" />
                {badges[0] || 'Sem cobranca antecipada'}
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-medium text-white/80">
                {badges[1] || 'Voce decide com mais calma'}
              </div>
            </div>
          </div>

          <nav aria-label="Links principais do site" className="grid min-w-0 gap-x-8 gap-y-7 sm:grid-cols-2 xl:grid-cols-4">
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
          {activeDisclaimers.map((item, index) => (
            <div key={item.key || index} className={index ? 'mt-2' : ''}>
              {item.title ? <p className="font-semibold text-white/80">{item.title}</p> : null}
              <p>{item.content}</p>
            </div>
          ))}
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
            {legalFooterLinks.map((link) => (
              <Link key={link.path} to={link.path} className="font-medium text-white/75 hover:text-white">
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2 border-t border-white/10 pt-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium text-white">{copyrightName} &copy; {currentYear}</p>
            <p className="text-sm text-white/60">
              {bottomText}
            </p>
          </div>
          <p className="text-sm text-white/60">{tagline}</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
