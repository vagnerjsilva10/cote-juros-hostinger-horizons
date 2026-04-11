
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { CoteJurosLogo } from './CoteJurosLogo.jsx';

function Header() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { label: 'Home', path: '/' },
    { label: 'Empréstimos', path: '/emprestimos' },
    { label: 'Cartões', path: '/cartoes-de-credito' },
    { label: 'Financiamentos', path: '/financiamento' },
    { label: 'Ferramentas', path: '/ferramentas' },
    { label: 'Blog', path: '/blog' }
  ];

  const isActive = (path) => {
    if (path === '/' && location.pathname !== '/') return false;
    return location.pathname.startsWith(path);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-white/95 backdrop-blur-md transition-all duration-200">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between">
          <Link to="/" className="flex items-center interactive-element hover:opacity-80">
            <CoteJurosLogo variant="horizontal" className="h-14 w-auto" />
          </Link>

          <nav className="hidden lg:flex items-center space-x-2">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`px-4 py-2 text-sm font-semibold rounded-full interactive-element ${
                  isActive(item.path)
                    ? 'text-primary bg-primary/5'
                    : 'text-slate-700 hover:text-primary hover:bg-slate-50'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="hidden lg:flex items-center space-x-4">
            <Link to="/diagnostico-financeiro">
              <Button className="gradient-fintech-hover text-white border-0 shadow-premium rounded-full px-6 h-11 font-semibold interactive-element active:scale-[0.98]">
                Analisar Perfil
              </Button>
            </Link>
          </div>

          <div className="flex items-center gap-2 lg:hidden">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full text-foreground">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px] border-l border-border bg-white">
                <div className="flex flex-col space-y-6 mt-8">
                  <div className="flex items-center space-x-3 pb-6 border-b border-border">
                    <CoteJurosLogo variant="symbol" className="w-12 h-12" />
                    <span className="text-lg font-bold text-foreground">Menu</span>
                  </div>
                  <nav className="flex flex-col space-y-2">
                    {navItems.map((item) => (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setMobileOpen(false)}
                        className={`px-4 py-3 text-base font-semibold rounded-xl interactive-element ${
                          isActive(item.path)
                            ? 'text-primary bg-primary/5'
                            : 'text-slate-700 hover:text-primary hover:bg-slate-50'
                        }`}
                      >
                        {item.label}
                      </Link>
                    ))}
                    <div className="pt-6 mt-4 border-t border-border">
                      <Link to="/diagnostico-financeiro" onClick={() => setMobileOpen(false)}>
                        <Button className="w-full gradient-fintech-hover text-white border-0 shadow-premium rounded-xl h-12 text-base font-semibold">
                          Analisar Perfil Grátis
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

