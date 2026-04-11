import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { clearAdminSession } from '@/admin/AdminAuthGuard.jsx';
import { LogoIcon } from '@/components/Logo.tsx';

const navItems = [
  { to: '/admin', label: 'Dashboard' },
  { to: '/admin/offers', label: 'Offers' },
  { to: '/admin/banks', label: 'Banks' },
  { to: '/admin/partners', label: 'Partners' },
  { to: '/admin/articles', label: 'Articles' },
  { to: '/admin/seo-pages', label: 'SEO Pages' },
  { to: '/admin/leads', label: 'Leads' },
  { to: '/admin/testimonials', label: 'Testimonials' },
  { to: '/admin/settings', label: 'Settings' }
];

export default function AdminLayout({ title, children }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    clearAdminSession();
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="grid min-h-screen lg:grid-cols-[240px_1fr]">
        <aside className="border-r border-slate-200 bg-white p-4 lg:p-5">
          <Link to="/admin" className="mb-6 flex items-center gap-2 rounded-lg px-2 py-1.5">
            <LogoIcon className="h-7 w-7" />
            <span className="font-semibold text-slate-900">Cote Juros Admin</span>
          </Link>

          <nav className="space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/admin'}
                className={({ isActive }) => `block rounded-md px-3 py-2 text-sm font-medium transition-colors ${isActive ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </aside>

        <div className="flex min-w-0 flex-col">
          <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
            <div className="flex h-16 items-center justify-between px-4 lg:px-8">
              <h1 className="text-lg font-semibold text-slate-900">{title}</h1>
              <div className="flex items-center gap-2">
                <Link to="/" className="text-sm text-slate-500 hover:text-slate-900">Ver portal</Link>
                <Button variant="outline" size="sm" onClick={handleLogout}>Sair</Button>
              </div>
            </div>
          </header>

          <main className="p-4 lg:p-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
