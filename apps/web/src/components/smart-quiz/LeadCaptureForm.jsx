import React, { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { captureLead } from '@/platform/services/leadAdapter.js';
import { trackEvent } from '@/platform/services/trackingAdapter.js';
import { formatPhoneValue } from '@/lib/quickCreditSubmission.js';

export default function LeadCaptureForm({ quizAnswers, recommendation, onCaptured }) {
  const [form, setForm] = useState({ name: '', phone: '', email: '', consent: false });
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');

  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const submit = async (event) => {
    event.preventDefault();
    if (!form.consent) {
      setError('Para continuar, aceite o consentimento LGPD.');
      return;
    }

    setStatus('submitting');
    setError('');

    const payload = {
      name: form.name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      consent: true,
      source: 'smart_quiz',
      quizAnswers,
      recommendation,
      score: recommendation.score,
      profile: recommendation.profile,
      createdAt: new Date().toISOString()
    };

    try {
      const result = await captureLead(payload);
      onCaptured?.({ ...payload, result });
      setStatus('done');
    } catch (err) {
      setError(err.message || 'Não foi possível enviar agora.');
      setStatus('idle');
    }
  };

  return (
    <form className="rounded-[24px] border border-white/10 bg-white/[0.05] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.18)]" onSubmit={submit}>
      <div className="mb-5 flex items-start gap-3">
        <div className="mt-1 rounded-full bg-emerald-400/15 p-2 text-emerald-300">
          <CheckCircle2 className="h-4 w-4" />
        </div>
        <div>
          <h3 className="text-xl font-semibold text-white">Receber minhas opções</h3>
          <p className="mt-1 text-sm leading-6 text-white/65">
            Para continuar, informe seus dados para receber opções compatíveis com seu perfil.
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Input value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="Nome" required className="bg-white text-slate-950" />
        <Input value={form.phone} onChange={(e) => update('phone', formatPhoneValue(e.target.value))} placeholder="(11) 99999-9999" inputMode="tel" autoComplete="tel" maxLength={15} required className="bg-white text-slate-950" />
        <Input value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="E-mail" type="email" className="bg-white text-slate-950 sm:col-span-2" />
      </div>

      <label className="mt-4 flex items-start gap-3 rounded-[16px] border border-white/10 bg-white/[0.04] p-3 text-sm leading-6 text-white/72">
        <input
          type="checkbox"
          checked={form.consent}
          onChange={(e) => update('consent', e.target.checked)}
          onFocus={() => trackEvent('lead_opened', { sourcePage: 'smart_quiz' })}
          className="mt-1"
        />
        <span>
          Autorizo a Cote Juros a tratar meus dados para registrar esta análise e encaminhar possibilidades a parceiros.
        </span>
      </label>

      {error ? <p className="mt-3 rounded-lg bg-rose-500/12 p-3 text-sm text-rose-100">{error}</p> : null}

      <Button type="submit" disabled={status === 'submitting'} className="mt-5 h-12 w-full rounded-full bg-[#7C6EF7] text-white hover:bg-[#6254D4]">
        {status === 'submitting' ? 'Enviando...' : 'Receber minhas opções'}
      </Button>
    </form>
  );
}
