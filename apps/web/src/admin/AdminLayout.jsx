import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { clearAdminSession } from '@/admin/AdminAuthGuard.jsx';
import { CoteJurosLogo } from '@/components/CoteJurosLogo.jsx';

const navItems = [
  { to: '/admin', label: 'Painel' },
  { to: '/admin/offers', label: 'Ofertas' },
  { to: '/admin/banks', label: 'Bancos' },
  { to: '/admin/partners', label: 'Parceiros' },
  { to: '/admin/articles', label: 'Artigos' },
  { to: '/admin/seo-pages', label: 'Páginas SEO' },
  { to: '/admin/leads', label: 'Leads' },
  { to: '/admin/reactivation', label: 'Reativacao' },
  { to: '/admin/email-ops', label: 'Email Ops' },
  { to: '/admin/testimonials', label: 'Depoimentos' },
  { to: '/admin/settings', label: 'Configurações' }
];

export default function AdminLayout({ title, children }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    clearAdminSession();
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen bg-background-secondary">
      <div className="grid min-h-screen lg:grid-cols-[260px_1fr]">
        <aside className="border-r border-border bg-white p-6">
          <Link to="/admin" className="mb-8 inline-flex">
            <CoteJurosLogo />
          </Link>

          <nav className="space-y-2">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/admin'}
                className={({ isActive }) =>
                  `block rounded-[10px] px-4 py-3 text-sm font-medium transition-colors ${
                    isActive ? 'bg-background-secondary text-foreground' : 'text-muted-foreground hover:bg-background-secondary hover:text-foreground'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </aside>

        <div className="flex min-w-0 flex-col">
          <header className="sticky top-0 z-10 border-b border-border bg-white/90 backdrop-blur-xl">
            <div className="flex h-[72px] items-center justify-between px-6 lg:px-10">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Administração</p>
                <h1 className="text-2xl font-semibold tracking-[-0.03em] text-foreground">{title}</h1>
              </div>
              <div className="flex items-center gap-3">
                <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">Ver portal</Link>
                <Button variant="outline" size="sm" onClick={handleLogout}>Sair</Button>
              </div>
            </div>
          </header>

          <main className="p-6 lg:p-10">{children}</main>
        </div>
      </div>
    </div>
  );
}
