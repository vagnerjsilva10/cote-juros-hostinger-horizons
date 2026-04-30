import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { loginCustomer } from '@/platform/services/authAdapter.js';
import { trackEvent } from '@/platform/services/trackingAdapter.js';

export default function CustomerLoginPage({ signup = false }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });

  const submit = async (event) => {
    event.preventDefault();
    await trackEvent('login_attempt', { sourcePage: signup ? '/criar-conta' : '/login' });
    await loginCustomer(form);
    navigate('/dashboard');
  };

  return (
    <>
      <Helmet>
        <title>{signup ? 'Criar conta' : 'Login'} | Cote Juros</title>
      </Helmet>
      <section className="grid min-h-[72vh] place-items-center bg-[#0A0A0F] px-4 py-14 text-white">
        <form onSubmit={submit} className="w-full max-w-md rounded-[28px] border border-white/10 bg-white/[0.05] p-6">
          <h1 className="text-3xl font-semibold tracking-[-0.04em]">{signup ? 'Criar conta grátis' : 'Acessar minha conta'}</h1>
          <p className="mt-2 text-sm leading-6 text-white/60">Mock seguro local até existir auth real de cliente.</p>
          <div className="mt-6 grid gap-3">
            {signup ? <Input placeholder="Nome" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bg-white text-slate-950" /> : null}
            <Input required type="email" placeholder="E-mail" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="bg-white text-slate-950" />
            <Input required type="password" placeholder="Senha" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="bg-white text-slate-950" />
          </div>
          <Button className="mt-5 h-12 w-full rounded-full bg-[#7C6EF7] text-white hover:bg-[#6254D4]">
            {signup ? 'Criar conta' : 'Entrar'}
          </Button>
        </form>
      </section>
    </>
  );
}
