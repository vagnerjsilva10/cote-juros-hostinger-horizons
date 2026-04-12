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
    { label: 'Home', path: '/' },
    { label: 'Empréstimos', path: '/emprestimos' },
    { label: 'Cartões', path: '/cartoes' },
    { label: 'Financiamentos', path: '/financiamentos' },
    { label: 'Ferramentas', path: '/ferramentas' },
    { label: 'Blog', path: '/blog' }
  ];

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <header
      className={`sticky top-0 z-50 w-full backdrop-blur-xl transition-colors ${
        isHome
          ? 'border-b border-slate-200/80 bg-gradient-to-b from-[#eef4ff]/95 via-[#e8f0ff]/92 to-[#f4f8ff]/88'
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
                    ? 'bg-slate-900/10 text-slate-900'
                    : 'text-muted-foreground hover:bg-background-secondary hover:text-foreground'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            <Link to="/diagnostico-financeiro">
              <Button
                size="lg"
                className="rounded-[10px] bg-[#111827] px-5 text-white shadow-[0_1px_2px_rgba(0,0,0,0.06),0_6px_16px_rgba(0,0,0,0.14)] transition-all duration-200 hover:bg-slate-800"
              >
                Analisar perfil
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
                            ? 'bg-primary/10 text-primary'
                            : 'text-muted-foreground hover:bg-background-secondary hover:text-foreground'
                        }`}
                      >
                        {item.label}
                      </Link>
                    ))}
                    <div className="mt-3 border-t border-border pt-5">
                      <Link to="/diagnostico-financeiro" onClick={() => setMobileOpen(false)}>
                        <Button className="h-12 w-full bg-[#111827] text-base text-white transition-all duration-200 hover:bg-slate-800">
                          Analisar perfil
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
