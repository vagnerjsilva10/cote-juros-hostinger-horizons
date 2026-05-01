import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { loginCustomer, registerCustomer } from '@/platform/services/authAdapter.js';
import { trackEvent } from '@/platform/services/trackingAdapter.js';

export default function CustomerLoginPage({ signup = false }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');
    setSubmitting(true);

    try {
      await trackEvent('login_attempt', { sourcePage: signup ? '/criar-conta' : '/login' });
      const session = signup ? await registerCustomer(form) : await loginCustomer(form);
      if (session?.pendingConfirmation) {
        setMessage('Cadastro criado. Confirme seu e-mail para liberar o acesso.');
        return;
      }
      navigate('/dashboard');
    } catch (authError) {
      setError(authError?.message || 'Não foi possível autenticar agora.');
      await trackEvent('login_failed', { sourcePage: signup ? '/criar-conta' : '/login', reason: authError?.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>{signup ? 'Criar conta' : 'Login'} | Cote Juros</title>
      </Helmet>
      <section className="grid min-h-[72vh] place-items-center bg-[#0A0A0F] px-4 py-14 text-white">
        <form onSubmit={submit} className="w-full max-w-md rounded-[28px] border border-white/10 bg-white/[0.05] p-6">
          <h1 className="text-3xl font-semibold tracking-[-0.04em]">{signup ? 'Criar conta grátis' : 'Acessar minha conta'}</h1>
          <p className="mt-2 text-sm leading-6 text-white/60">Acesso protegido por Supabase Auth.</p>
          <div className="mt-6 grid gap-3">
            {signup ? <Input placeholder="Nome" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bg-white text-slate-950" /> : null}
            <Input required type="email" placeholder="E-mail" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="bg-white text-slate-950" />
            <Input required type="password" placeholder="Senha" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="bg-white text-slate-950" />
          </div>
          {error ? <p className="mt-4 rounded-xl border border-red-400/40 bg-red-500/10 p-3 text-sm text-red-100">{error}</p> : null}
          {message ? <p className="mt-4 rounded-xl border border-emerald-400/40 bg-emerald-500/10 p-3 text-sm text-emerald-100">{message}</p> : null}
          <Button disabled={submitting} className="mt-5 h-12 w-full rounded-full bg-[#7C6EF7] text-white hover:bg-[#6254D4]">
            {submitting ? 'Aguarde...' : signup ? 'Criar conta' : 'Entrar'}
          </Button>
        </form>
      </section>
    </>
  );
}
