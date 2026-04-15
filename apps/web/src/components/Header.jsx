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
    const onScroll = () => setIsScrolled(window.scrollY > 14);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navItems = [
    { label: 'Empréstimos', path: '/emprestimos' },
    { label: 'Cartões', path: '/cartoes' },
    { label: 'Financiamentos', path: '/financiamentos' },
    { label: 'Ofertas', path: '/ofertas' },
    { label: 'Blog', path: '/blog' }
  ];

  const isActive = (path) => location.pathname.startsWith(path);

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        isScrolled
          ? 'border-b border-white/10 bg-[rgba(11,15,25,0.95)] shadow-[0_16px_38px_rgba(2,6,23,0.28)]'
          : 'border-b border-white/8 bg-[rgba(11,15,25,0.78)]'
      }`}
      style={{ backdropFilter: 'blur(10px)' }}
    >
      <div className="page-shell">
        <div className="flex h-[70px] items-center justify-between sm:h-[76px]">
          <Link to="/" className="flex items-center">
            <CoteJurosLogo variant="original" />
          </Link>

          <nav className="hidden items-center gap-1 lg:flex">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-all duration-300 ${
                  isActive(item.path)
                    ? 'border border-white/15 bg-white/10 text-[#E5E7EB]'
                    : 'text-[#E5E7EB] hover:bg-white/8 hover:text-[#2563EB]'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            <Link to="/emprestimos">
              <Button className="h-11 border-0 bg-[linear-gradient(90deg,#2563EB_0%,#4F46E5_100%)] px-5 text-white shadow-[0_6px_20px_rgba(37,99,235,0.25)] transition-all duration-300 hover:-translate-y-[1px] hover:brightness-110">
                Ver opções
              </Button>
            </Link>
          </div>

          <div className="flex items-center gap-2 lg:hidden">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-full border-white/20 bg-white/5 text-[#E5E7EB] hover:bg-white/10 hover:text-[#E5E7EB]"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[88vw] max-w-[320px] border-l border-white/10 bg-[#0B0F19] px-5">
                <div className="mt-8 flex flex-col gap-6">
                  <div className="border-b border-white/10 pb-5">
                    <CoteJurosLogo variant="original-light" />
                  </div>

                  <nav className="flex flex-col gap-2">
                    {navItems.map((item) => (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setMobileOpen(false)}
                        className={`rounded-[12px] px-4 py-3 text-base font-medium ${
                          isActive(item.path)
                            ? 'border border-white/15 bg-white/10 text-[#E5E7EB]'
                            : 'text-[#E5E7EB] hover:bg-white/8 hover:text-[#2563EB]'
                        }`}
                      >
                        {item.label}
                      </Link>
                    ))}
                    <div className="mt-3 border-t border-white/10 pt-5">
                      <Link to="/emprestimos" onClick={() => setMobileOpen(false)}>
                        <Button className="w-full border-0 bg-[linear-gradient(90deg,#2563EB_0%,#4F46E5_100%)] text-base text-white shadow-[0_6px_20px_rgba(37,99,235,0.25)] transition-all duration-300 hover:-translate-y-[1px] hover:brightness-110">
                          Ver opções
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
