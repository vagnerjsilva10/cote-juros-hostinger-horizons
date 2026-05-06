import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { clearAdminSession } from '@/admin/AdminAuthGuard.jsx';
import { CoteJurosLogo } from '@/components/CoteJurosLogo.jsx';
import { portalApi } from '@/platform/services/portalApi.js';

const navGroups = [
  {
    title: 'Visao Geral',
    items: [
      { to: '/admin', label: 'Dashboard', end: true },
      { to: '/admin/health?tab=alerts', label: 'Alertas' }
    ]
  },
  {
    title: 'Comercial',
    items: [
      { to: '/admin/leads', label: 'Leads' },
      { to: '/admin/partners', label: 'Parceiros', end: true },
      { to: '/admin/offers', label: 'Ofertas' },
      { to: '/admin/partners/performance', label: 'Performance' },
      { to: '/admin/banks', label: 'Bancos' }
    ]
  },
  {
    title: 'Conteudo',
    items: [
      { to: '/admin/articles', label: 'Artigos' },
      { to: '/admin/testimonials', label: 'Depoimentos' },
      { to: '/admin/seo-pages', label: 'SEO' }
    ]
  },
  {
    title: 'Relacionamento',
    items: [
      { to: '/admin/reactivation', label: 'Reativacao' },
      { to: '/admin/email-ops?tab=campaigns', label: 'Campanhas' },
      { to: '/admin/email-ops?tab=models', label: 'Modelos' },
      { to: '/admin/email-ops?tab=automation', label: 'Automacao' }
    ]
  },
  {
    title: 'Site',
    items: [
      { to: '/admin/navigation', label: 'Navegacao' },
      { to: '/admin/disclaimers', label: 'Disclaimers' },
      { to: '/admin/settings', label: 'Configuracoes publicas' }
    ]
  },
  {
    title: 'Equipe',
    items: [
      { to: '/admin/users?tab=users', label: 'Usuarios' },
      { to: '/admin/users?tab=sessions', label: 'Sessoes' },
      { to: '/admin/users?tab=permissions', label: 'Permissoes' }
    ]
  },
  {
    title: 'Sistema',
    items: [
      { to: '/admin/health?tab=status', label: 'Status do sistema' },
      { to: '/admin/audit', label: 'Auditoria' },
      { to: '/admin/health?tab=integrations', label: 'Integracoes' },
      { to: '/admin/settings?tab=advanced', label: 'Configuracoes avancadas' }
    ]
  }
];

const splitTarget = (to) => {
  const [path, search = ''] = to.split('?');
  return { path, search: search ? `?${search}` : '' };
};

export default function AdminLayout({ title, children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [session, setSession] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    let active = true;

    portalApi.getAdminSession()
      .then((data) => {
        if (!active) return;
        setSession(data?.user || null);
      })
      .catch(() => {
        if (!active) return;
        setSession(null);
      });

    return () => {
      active = false;
    };
  }, []);

  const currentPath = `${location.pathname}${location.search}`;

  const isItemActive = (item) => {
    const target = splitTarget(item.to);
    if (item.end || item.to === '/admin') {
      return currentPath === item.to || location.pathname === item.to;
    }
    if (target.search && location.pathname === target.path && !location.search) {
      return item.to.endsWith('tab=users') || item.to.endsWith('tab=campaigns') || item.to.endsWith('tab=status');
    }
    if (target.search) return currentPath === item.to;
    return location.pathname === target.path && !location.search;
  };

  const activeGroup = useMemo(() => {
    const group = navGroups.find((navGroup) => navGroup.items.some((item) => isItemActive(item)));
    return group?.title || '';
  }, [currentPath]);

  const handleLogout = async () => {
    await clearAdminSession();
    navigate('/admin/login');
  };

  const renderSidebar = (mode) => (
    <div className="flex h-full flex-col">
      <Link to="/admin" className="mb-6 inline-flex" onClick={() => setMobileOpen(false)}>
        <CoteJurosLogo />
      </Link>

      <nav className="space-y-5 overflow-y-auto pr-1">
        {navGroups.map((group) => {
          const groupActive = group.title === activeGroup;
          return (
            <div key={group.title} className={groupActive ? 'rounded-2xl bg-slate-50 p-2' : 'p-2'}>
              <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                {group.title}
              </p>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const active = isItemActive(item);
                  return (
                    <Link
                      key={`${group.title}-${item.label}`}
                      to={item.to}
                      onClick={() => {
                        if (mode === 'mobile') setMobileOpen(false);
                      }}
                      className={`block rounded-[10px] px-3 py-2.5 text-sm font-medium transition-colors ${
                        active ? 'bg-white text-slate-950 shadow-sm ring-1 ring-slate-200' : 'text-slate-600 hover:bg-white hover:text-slate-950'
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>
    </div>
  );

  return (
    <div className="min-h-screen bg-background-secondary">
      <div className="grid min-h-screen lg:grid-cols-[292px_1fr]">
        <aside className="hidden border-r border-border bg-white px-4 py-6 lg:block">
          {renderSidebar('desktop')}
        </aside>

        {mobileOpen ? (
          <div className="fixed inset-0 z-40 lg:hidden">
            <button
              type="button"
              aria-label="Fechar menu"
              className="absolute inset-0 bg-slate-950/35"
              onClick={() => setMobileOpen(false)}
            />
            <aside className="relative h-full w-[min(86vw,320px)] border-r border-border bg-white px-4 py-6 shadow-2xl">
              {renderSidebar('mobile')}
            </aside>
          </div>
        ) : null}

        <div className="flex min-w-0 flex-col">
          <header className="sticky top-0 z-10 border-b border-border bg-white/90 backdrop-blur-xl">
            <div className="flex min-h-[72px] items-center justify-between gap-4 px-4 py-3 lg:px-10">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Central operacional</p>
                <h1 className="truncate text-xl font-semibold tracking-[-0.03em] text-foreground sm:text-2xl">{title}</h1>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <Button variant="outline" size="sm" className="lg:hidden" onClick={() => setMobileOpen(true)}>
                  Menu
                </Button>
                {session ? (
                  <div className="hidden text-right sm:block">
                    <p className="text-sm font-medium text-foreground">{session.fullName || session.email}</p>
                    <p className="text-xs text-muted-foreground">{(session.roles || []).join(' - ') || 'admin'}</p>
                  </div>
                ) : null}
                <Link to="/" className="hidden text-sm text-muted-foreground hover:text-foreground sm:inline">Ver portal</Link>
                <Button variant="outline" size="sm" onClick={handleLogout}>Sair</Button>
              </div>
            </div>
          </header>

          <main className="p-4 sm:p-6 lg:p-10">{children}</main>
        </div>
      </div>
    </div>
  );
}
