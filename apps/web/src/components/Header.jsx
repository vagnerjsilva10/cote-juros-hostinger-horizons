import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { CoteJurosLogo } from './CoteJurosLogo.jsx';

function Header() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navItems = [
    { label: 'Empréstimos', path: '/emprestimos' },
    { label: 'Cartões', path: '/cartoes' },
    { label: 'Financiamentos', path: '/financiamentos' },
    { label: 'Blog', path: '/blog' }
  ];

  const isActive = (path) => location.pathname.startsWith(path);

  return (
    <header
      className={`sticky top-0 z-50 w-full border-b border-white/[0.08] bg-[rgba(2,6,14,0.98)] transition-all duration-300 ${
        isScrolled ? 'shadow-[0_14px_42px_rgba(1,4,10,0.42)]' : 'shadow-[0_1px_0_rgba(255,255,255,0.02)]'
      }`}
      style={{ backdropFilter: 'blur(12px)' }}
    >
      <div className="page-shell">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center">
            <CoteJurosLogo variant="original-light" />
          </Link>

          <nav className="hidden items-center gap-1 lg:flex">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`rounded-full px-3 py-2 text-[13px] font-medium leading-none transition-all duration-300 ${
                  isActive(item.path)
                    ? 'bg-white/[0.08] text-[rgba(255,255,255,0.98)]'
                    : 'text-[rgba(255,255,255,0.78)] hover:text-[rgba(255,255,255,0.98)]'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            <Link to="/emprestimos">
              <Button className="cta-button h-9 rounded-[10px] border-0 bg-[linear-gradient(135deg,#6C5CFF_0%,#4B7CFF_100%)] px-3.5 text-[13px] font-semibold text-white shadow-[0_12px_30px_rgba(76,98,255,0.24)] transition-all duration-300 hover:-translate-y-[1px] hover:brightness-105">
                Ver minhas opções
              </Button>
            </Link>
          </div>

          <div className="flex items-center gap-2 lg:hidden">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 rounded-full border-white/[0.12] bg-white/[0.04] text-white hover:bg-white/[0.08] hover:text-white"
                >
                  <Menu className="h-4.5 w-4.5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[88vw] max-w-[320px] border-l border-white/10 bg-[#08111f] px-5">
                <div className="mt-6 flex flex-col gap-6">
                  <div className="border-b border-white/10 pb-4">
                    <CoteJurosLogo variant="original-light" />
                  </div>

                  <nav className="flex flex-col gap-2">
                    {navItems.map((item) => (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setMobileOpen(false)}
                        className={`rounded-[12px] px-4 py-3 text-sm font-medium ${
                          isActive(item.path)
                            ? 'bg-white/[0.08] text-white'
                            : 'text-[rgba(255,255,255,0.78)] hover:bg-white/[0.08] hover:text-white'
                        }`}
                      >
                        {item.label}
                      </Link>
                    ))}
                    <div className="mt-3 border-t border-white/10 pt-4">
                      <Link to="/emprestimos" onClick={() => setMobileOpen(false)}>
                        <Button className="h-10 w-full rounded-[10px] border-0 bg-[linear-gradient(135deg,#6C5CFF_0%,#4B7CFF_100%)] text-[13px] font-semibold text-white shadow-[0_12px_30px_rgba(76,98,255,0.24)] transition-all duration-300 hover:-translate-y-[1px] hover:brightness-105">
                          Ver minhas opções
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

