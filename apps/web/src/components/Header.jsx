import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { CoteJurosLogo } from './CoteJurosLogo.jsx';

function Header() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isHome = location.pathname === '/';

  const navItems = [
    { label: 'Empréstimos', path: '/emprestimos' },
    { label: 'Cartões', path: '/cartoes' },
    { label: 'Financiamentos', path: '/financiamentos' },
    { label: 'Blog', path: '/blog' }
  ];

  const isActive = (path) => location.pathname.startsWith(path);

  return (
    <header
      className={`sticky top-0 z-50 w-full backdrop-blur-xl transition-colors ${
        isHome
          ? 'border-b border-slate-200/80 bg-white/90'
          : 'border-b border-border bg-white/95'
      }`}
    >
      <div className="page-shell">
        <div className="flex h-[66px] items-center justify-between sm:h-[72px]">
          <Link to="/" className="flex items-center">
            <CoteJurosLogo />
          </Link>

          <nav className="hidden items-center gap-1 lg:flex">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`rounded-full px-4 py-2 text-sm font-medium ${
                  isActive(item.path)
                    ? 'bg-slate-900 text-white shadow-[0_12px_28px_rgba(15,23,42,0.14)]'
                    : 'text-muted-foreground hover:bg-white hover:text-foreground hover:shadow-[0_10px_24px_rgba(15,23,42,0.06)]'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            <Link to="/emprestimos">
              <Button
                size="lg"
                className="px-5"
              >
                Ver opções agora
              </Button>
            </Link>
          </div>

          <div className="flex items-center gap-2 lg:hidden">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="h-10 w-10 rounded-full">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[88vw] max-w-[320px] border-l border-border bg-white px-5">
                <div className="mt-8 flex flex-col gap-6">
                  <div className="border-b border-border pb-5">
                    <CoteJurosLogo />
                  </div>

                  <nav className="flex flex-col gap-2">
                    {navItems.map((item) => (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setMobileOpen(false)}
                        className={`rounded-[12px] px-4 py-3 text-base font-medium ${
                          isActive(item.path)
                            ? 'bg-slate-900 text-white'
                            : 'text-muted-foreground hover:bg-background-secondary hover:text-foreground'
                        }`}
                      >
                        {item.label}
                      </Link>
                    ))}
                    <div className="mt-3 border-t border-border pt-5">
                      <Link to="/emprestimos" onClick={() => setMobileOpen(false)}>
                        <Button className="h-12 w-full text-base">
                          Ver opções agora
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
