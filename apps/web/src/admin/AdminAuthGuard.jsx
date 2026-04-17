import React, { useMemo, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { portalApi } from '@/platform/services/portalApi.js';

const SESSION_KEY = 'cj.admin.session';

function isAuthenticated() {
  if (typeof window === 'undefined') return false;
  return window.sessionStorage.getItem(SESSION_KEY) === 'ok';
}

export default function AdminAuthGuard({ children }) {
  const location = useLocation();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [authed, setAuthed] = useState(() => isAuthenticated());
  const [busy, setBusy] = useState(false);

  const expectedPassword = useMemo(() => import.meta.env.VITE_ADMIN_PASSCODE || '', []);

  if (location.pathname === '/admin/login') {
    if (authed) {
      return <Navigate to="/admin" replace />;
    }

    const handleSubmit = async (event) => {
      event.preventDefault();
      setBusy(true);
      setError('');

      try {
        if (expectedPassword && password === expectedPassword) {
          window.sessionStorage.setItem(SESSION_KEY, 'ok');
          setAuthed(true);
          return;
        }

        await portalApi.loginReactivationEmailAdmin(password);
        window.sessionStorage.setItem(SESSION_KEY, 'ok');
        setAuthed(true);
      } catch {
        setError('Senha invalida ou API de admin indisponivel.');
      } finally {
        setBusy(false);
      }
    };

    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <Card className="w-full max-w-md border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl">Admin Cote Juros</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Digite a senha de admin"
                autoComplete="current-password"
              />
              {error ? <p className="text-sm text-red-600">{error}</p> : null}
              <Button type="submit" className="w-full" disabled={busy || password.length < 8}>
                {busy ? 'Entrando...' : 'Entrar'}
              </Button>
              <p className="text-xs text-muted-foreground">
                Use a senha configurada em REACTIVATION_ADMIN_PASSWORD na API.
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!authed) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
}

export function clearAdminSession() {
  if (typeof window === 'undefined') return;
  window.sessionStorage.removeItem(SESSION_KEY);
}
