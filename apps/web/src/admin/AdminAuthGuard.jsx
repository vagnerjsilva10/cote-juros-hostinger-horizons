import React, { useMemo, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

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

  const expectedPassword = useMemo(() => import.meta.env.VITE_ADMIN_PASSCODE || 'admin123', []);

  if (location.pathname === '/admin/login') {
    if (authed) {
      return <Navigate to="/admin" replace />;
    }

    const handleSubmit = (event) => {
      event.preventDefault();
      if (password === expectedPassword) {
        window.sessionStorage.setItem(SESSION_KEY, 'ok');
        setAuthed(true);
        setError('');
        return;
      }
      setError('Senha inválida.');
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
              />
              {error ? <p className="text-sm text-red-600">{error}</p> : null}
              <Button type="submit" className="w-full">Entrar</Button>
              <p className="text-xs text-muted-foreground">Placeholder de proteção. Configure `VITE_ADMIN_PASSCODE` em produção.</p>
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
