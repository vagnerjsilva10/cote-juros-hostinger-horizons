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
    { label: 'Como funciona', path: '/como-funciona' },
    { label: 'Ferramentas', path: '/ferramentas' },
    { label: 'Blog', path: '/blog' }
  ];

  const isActive = (path) => location.pathname.startsWith(path);

  return (
    <header
      className={`site-header sticky top-0 z-50 w-full border-b border-white/[0.05] bg-[rgba(11,18,32,0.88)] transition-all duration-300 ${
        isScrolled ? 'shadow-[0_22px_52px_rgba(15,23,42,0.18)]' : 'shadow-[0_1px_0_rgba(255,255,255,0.02)]'
      }`}
      style={{ backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }}
    >
      <div className="page-shell">
        <div className="flex h-[72px] items-center justify-between">
          <Link to="/" className="flex items-center">
            <CoteJurosLogo variant="original-light" className="site-logo" />
          </Link>

          <nav className="hidden items-center gap-1 lg:flex">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`rounded-full px-3 py-2 text-[15px] font-medium leading-none transition-colors duration-200 ${
                  isActive(item.path)
                    ? 'bg-white/[0.08] text-white'
                    : 'text-[#CBD5F5] hover:text-white'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            <Link to="/emprestimos">
              <Button
                className="cta-button h-auto rounded-[10px] border-0 bg-[#6D5EF3] px-5 py-3 text-[15px] font-semibold text-white shadow-[0_10px_24px_rgba(109,94,243,0.22)] transition-colors duration-200 hover:bg-[#5B4FE0]"
              >
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
              <SheetContent side="right" className="w-[88vw] max-w-[320px] border-l border-white/10 bg-[#060d18] px-5">
                <div className="mt-6 flex flex-col gap-6">
                  <div className="border-b border-white/10 pb-4">
                    <CoteJurosLogo variant="original-light" className="site-logo" />
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
                        <Button className="h-10 w-full rounded-[10px] border-0 bg-[#6D5EF3] text-[13px] font-semibold text-white shadow-[0_10px_24px_rgba(109,94,243,0.22)] transition-colors duration-200 hover:bg-[#5B4FE0]">
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
