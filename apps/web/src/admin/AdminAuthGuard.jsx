import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { portalApi } from '@/platform/services/portalApi.js';

export default function AdminAuthGuard({ children }) {
  const location = useLocation();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState({ authenticated: false, user: null });

  const refreshSession = async () => {
    try {
      const data = await portalApi.getAdminSession();
      const nextSession = {
        authenticated: Boolean(data?.authenticated),
        user: data?.user || null
      };
      setSession(nextSession);
      return nextSession;
    } catch (sessionError) {
      const nextSession = { authenticated: false, user: null };
      setSession(nextSession);
      if (location.pathname === '/admin/login') {
        setError(sessionError.message || 'Não foi possível validar a sessão do admin.');
      }
      return nextSession;
    } finally {
      setReady(true);
    }
  };

  useEffect(() => {
    refreshSession();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');

    try {
      await portalApi.loginAdmin(password);
      setPassword('');
      const nextSession = await refreshSession();
      if (!nextSession.authenticated) {
        setError('Login aceito, mas a sessão não foi persistida. Verifique cookie, CORS e domínio da API.');
      }
    } catch (submitError) {
      setError(submitError.message || 'Não foi possível autenticar no admin.');
    } finally {
      setBusy(false);
    }
  };

  if (!ready) {
    return <div className="min-h-screen bg-slate-50 p-6 text-sm text-slate-600">Validando sessão do admin...</div>;
  }

  if (location.pathname === '/admin/login') {
    if (session.authenticated) {
      return <Navigate to="/admin" replace />;
    }

    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <Card className="w-full max-w-md border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl">Admin Cote Juros</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <label className="block space-y-2 text-sm font-medium text-slate-700">
                <span>Senha do admin</span>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Senha configurada no backend"
                  autoComplete="current-password"
                />
              </label>
              {error ? <p className="text-sm text-red-600">{error}</p> : null}
              <Button type="submit" className="w-full" disabled={busy || password.length < 8}>
                {busy ? 'Entrando...' : 'Entrar'}
              </Button>
              {busy ? (
                <p className="text-xs text-muted-foreground">
                  Validando API, banco, senha e cookie de sessão. Se passar de alguns segundos, a chamada será interrompida com diagnóstico.
                </p>
              ) : null}
              <p className="text-xs text-muted-foreground">
                A autenticação é validada pela API com sessão segura e trilha de auditoria.
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!session.authenticated) {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  }

  return children;
}

export async function clearAdminSession() {
  try {
    await portalApi.logoutAdmin();
  } catch {
    // The UI will still redirect to login; the cookie cleanup is best-effort.
  }
}
