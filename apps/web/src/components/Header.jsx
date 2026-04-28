import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronDown, Menu } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { CoteJurosLogo } from './CoteJurosLogo.jsx';
import { primaryNavItems } from '@/navigation/seoNavigation.js';
import { portalApi } from '@/platform/services/portalApi.js';
import { settingValue, useSiteSettings } from '@/hooks/useSiteSettings.js';

const normalizeNavTree = (items = []) =>
  items
    .filter((item) => item?.label && item?.href)
    .map((item) => ({
      label: item.label,
      path: item.href,
      links: Array.isArray(item.links)
        ? item.links.filter((link) => link?.label && link?.href).map((link) => ({
          label: link.label,
          path: link.href
        }))
        : []
    }));

function Header() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [remoteNavItems, setRemoteNavItems] = useState(null);
  const settings = useSiteSettings();

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    let active = true;
    portalApi.getSiteNavigation()
      .then((data) => {
        if (!active) return;
        const headerItems = normalizeNavTree(data?.treeByLocation?.header || []);
        setRemoteNavItems(headerItems.length ? headerItems : null);
      })
      .catch(() => {
        if (active) setRemoteNavItems(null);
      });
    return () => {
      active = false;
    };
  }, []);

  const navItems = remoteNavItems || primaryNavItems;
  const ctaLabel = settingValue(settings, 'header.cta.label', 'Ver minhas opcoes');
  const ctaHref = settingValue(settings, 'header.cta.href', '/emprestimos');

  const isActive = (path) => location.pathname.startsWith(path);

  return (
    <header
      className={`site-header sticky top-0 z-50 w-full border-b border-white/[0.05] transition-all duration-300 ${
        isScrolled ? 'shadow-[0_22px_52px_rgba(15,23,42,0.18)]' : 'shadow-[0_1px_0_rgba(255,255,255,0.02)]'
      }`}
      style={{ backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }}
    >
      <div className="page-shell">
        <div className="flex h-[72px] items-center justify-between">
          <Link to="/" className="flex items-center">
            <CoteJurosLogo variant="original-light" className="site-logo" />
          </Link>

          <nav className="hidden items-center gap-1 lg:flex" aria-label="Navega\u00E7\u00E3o principal">
            {navItems.map((item) => (
              <div key={item.path} className="group relative">
                <Link
                  to={item.path}
                  className={`inline-flex items-center gap-1 rounded-full px-3 py-2 text-[15px] font-medium leading-none transition-colors duration-200 ${
                    isActive(item.path) ? 'bg-white/[0.08] text-white' : 'text-[#CBD5F5] hover:text-white'
                  }`}
                >
                  {item.label}
                  <ChevronDown className="h-3.5 w-3.5 opacity-70" />
                </Link>

                <div className="pointer-events-none absolute left-0 top-full z-50 hidden min-w-[260px] pt-3 opacity-0 transition duration-150 group-hover:pointer-events-auto group-hover:block group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:block group-focus-within:opacity-100">
                  <div className="rounded-[16px] border border-white/10 bg-[#07111f] p-3 shadow-[0_24px_70px_rgba(0,0,0,0.32)]">
                    <Link
                      to={item.path}
                      className="mb-2 block rounded-[12px] px-3 py-2 text-sm font-semibold text-white hover:bg-white/[0.06]"
                    >
                      Ver tudo em {item.label}
                    </Link>
                    <div className="h-px bg-white/10" />
                    <div className="mt-2 grid gap-1">
                      {item.links.slice(0, 6).map((link) => (
                        <Link
                          key={link.path}
                          to={link.path}
                          className="rounded-[10px] px-3 py-2 text-sm leading-5 text-[#CBD5F5] transition-colors hover:bg-white/[0.06] hover:text-white"
                        >
                          {link.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            <Link to={ctaHref}>
              <Button className="cta-button h-auto rounded-[10px] border-0 bg-[#6D5EF3] px-5 py-3 text-[15px] font-semibold text-white shadow-[0_10px_24px_rgba(109,94,243,0.22)] transition-colors duration-200 hover:bg-[#5B4FE0]">
                {ctaLabel}
              </Button>
            </Link>
          </div>

          <div className="flex items-center gap-2 lg:hidden">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="mobile-nav-trigger h-9 w-9 rounded-full border-white/[0.12] bg-white/[0.04] text-white hover:bg-white/[0.08] hover:text-white"
                >
                  <Menu className="h-4.5 w-4.5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="mobile-nav-sheet w-[88vw] max-w-[320px] border-l border-white/10 bg-[#060d18] px-5">
                <div className="mt-6 flex flex-col gap-6">
                  <div className="border-b border-white/10 pb-4">
                    <CoteJurosLogo variant="original-light" className="site-logo" />
                  </div>

                  <nav className="mobile-nav-links flex flex-col gap-3" aria-label="Navega\u00E7\u00E3o mobile">
                    {navItems.map((item) => (
                      <div key={item.path} className="rounded-[14px] border border-white/10 bg-white/[0.03] p-2">
                        <Link
                          to={item.path}
                          onClick={() => setMobileOpen(false)}
                          className={`block rounded-[10px] px-3 py-2 text-sm font-semibold ${
                            isActive(item.path)
                              ? 'bg-white/[0.08] text-white'
                              : 'text-[rgba(255,255,255,0.86)] hover:bg-white/[0.08] hover:text-white'
                          }`}
                        >
                          {item.label}
                        </Link>
                        <div className="mt-1 grid gap-1">
                          {item.links.slice(0, 6).map((link) => (
                            <Link
                              key={link.path}
                              to={link.path}
                              onClick={() => setMobileOpen(false)}
                              className="rounded-[9px] px-3 py-2 text-xs leading-5 text-[rgba(255,255,255,0.62)] hover:bg-white/[0.07] hover:text-white"
                            >
                              {link.label}
                            </Link>
                          ))}
                        </div>
                      </div>
                    ))}
                    <div className="mt-3 border-t border-white/10 pt-4">
                      <Link to={ctaHref} onClick={() => setMobileOpen(false)}>
                        <Button className="mobile-nav-cta h-10 w-full rounded-[10px] border-0 bg-[#6D5EF3] text-[13px] font-semibold text-white shadow-[0_10px_24px_rgba(109,94,243,0.22)] transition-colors duration-200 hover:bg-[#5B4FE0]">
                          {ctaLabel}
                        </Button>
                      </Link>
                    </div>
                  </nav>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
