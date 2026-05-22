import React, { useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  buildCreditasPayload,
  checkCreditasEligibility,
  submitCreditasLead
} from '@/platform/services/creditasAdapter.js';
import { trackEvent } from '@/platform/services/trackingAdapter.js';
import { openWhatsApp } from '@/platform/utils/whatsapp.js';
import { formatCurrencyBRL, parseCurrencyBRL } from '@/components/smart-quiz/currency.js';
import { formatPhoneValue } from '@/lib/quickCreditSubmission.js';

const LGPD_TEXT = 'Autorizo a Cote Juros a compartilhar meus dados com a parceira Creditas para análise de opções de crédito com garantia. A aprovação e condições dependem da avaliação da parceira.';

const STATES = ['AC', 'AL', 'AM', 'AP', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MG', 'MS', 'MT', 'PA', 'PB', 'PE', 'PI', 'PR', 'RJ', 'RN', 'RO', 'RR', 'RS', 'SC', 'SE', 'SP', 'TO'];

const REQUIRED_FIELD_LABELS = {
  fullName: 'nome completo',
  phone: 'WhatsApp',
  email: 'e-mail',
  cpf: 'CPF',
  city: 'cidade',
  state: 'estado',
  guaranteeType: 'tipo de garantia',
  assetValue: 'valor estimado do bem',
  requestedAmount: 'valor desejado',
  income: 'renda mensal'
};

const hasMoneyValue = (value) => parseCurrencyBRL(value) > 0;

export default function CreditasExtraForm({ lead, quizAnswers, recommendation, onStatus }) {
  const hasIncome = hasMoneyValue(quizAnswers?.monthlyIncome ?? quizAnswers?.income ?? quizAnswers?.renda ?? lead?.monthlyIncome ?? lead?.income);
  const hasRequestedAmount = hasMoneyValue(quizAnswers?.amount ?? quizAnswers?.valor ?? quizAnswers?.requestedAmount ?? lead?.requestedAmount ?? lead?.amount);
  const [form, setForm] = useState({
    fullName: lead?.name || lead?.fullName || '',
    phone: lead?.phone || lead?.whatsapp || '',
    email: lead?.email || '',
    cpf: '',
    city: '',
    state: '',
    guaranteeType: '',
    assetValue: '',
    requestedAmount: '',
    income: '',
    consent: false
  });
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');
  const [requiredFields, setRequiredFields] = useState([]);

  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const submit = async (event) => {
    event.preventDefault();
    setStatus('submitting');
    setMessage('');
    setRequiredFields([]);

    const payload = buildCreditasPayload({
      lead: lead || {},
      quizAnswers,
      recommendation,
      extraFields: {
        ...form,
        fullName: form.fullName,
        phone: form.phone,
        email: form.email,
        income: parseCurrencyBRL(form.income),
        requestedAmount: parseCurrencyBRL(form.requestedAmount),
        assetValue: parseCurrencyBRL(form.assetValue),
        sourcePage: 'smart_quiz_creditas'
      }
    });

    await trackEvent('creditas_extra_form_submitted', {
      sourcePage: 'smart_quiz',
      guaranteeType: payload.guaranteeType
    });

    const eligibility = await checkCreditasEligibility(payload);
    if (eligibility?.mode === 'missing_required_data') {
      setStatus('missing');
      setRequiredFields(eligibility.requiredFields || []);
      setMessage('Faltam dados para consultar a Creditas com segurança.');
      onStatus?.(eligibility);
      return;
    }

    const leadResult = eligibility?.ok ? await submitCreditasLead(payload) : eligibility;
    const finalStatus = leadResult?.status || leadResult?.mode;
    onStatus?.(leadResult);

    if (leadResult?.mode === 'fallback') {
      setStatus('fallback');
      setMessage('Não conseguimos consultar as opções agora. Seus dados foram salvos para continuidade.');
      return;
    }

    if (leadResult?.ok) {
      setStatus('done');
      setMessage(finalStatus === 'not_eligible'
        ? 'Não elegível no momento. Você ainda pode seguir por outros caminhos.'
        : 'Consulta registrada. As condições dependem da avaliação da Creditas.');
      return;
    }

    setStatus('error');
    setMessage('Não conseguimos consultar as opções agora. Seus dados foram salvos para continuidade.');
  };

  return (
    <form className="creditas-extra-form" onSubmit={submit}>
      <div className="mb-4 flex items-start gap-3">
        <div className="mt-1 rounded-full bg-[#7C6EF7]/15 p-2 text-[#B8AEFF]">
          <ShieldCheck className="h-4 w-4" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">Simulação com garantia</h3>
          <p className="mt-1 text-sm leading-6 text-white/65">
            Complete apenas os dados necessários para consultar opções com garantia, sujeito a análise.
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {!lead?.name && !lead?.fullName ? <Input value={form.fullName} onChange={(event) => update('fullName', event.target.value)} placeholder="Nome completo" className="bg-white text-slate-950 sm:col-span-2" /> : null}
        {!lead?.phone && !lead?.whatsapp ? <Input value={form.phone} onChange={(event) => update('phone', formatPhoneValue(event.target.value))} placeholder="(11) 99999-9999" inputMode="tel" autoComplete="tel" maxLength={15} className="bg-white text-slate-950" /> : null}
        {!lead?.email ? <Input value={form.email} onChange={(event) => update('email', event.target.value)} placeholder="E-mail" type="email" className="bg-white text-slate-950" /> : null}
        <Input value={form.cpf} onChange={(event) => update('cpf', event.target.value)} placeholder="CPF" className="bg-white text-slate-950" />
        <select className="creditas-select" value={form.guaranteeType} onChange={(event) => update('guaranteeType', event.target.value)}>
          <option value="">Tipo de garantia</option>
          <option value="home">Imóvel</option>
          <option value="vehicle">Veículo</option>
        </select>
        <Input value={form.city} onChange={(event) => update('city', event.target.value)} placeholder="Cidade" className="bg-white text-slate-950" />
        <select className="creditas-select" value={form.state} onChange={(event) => update('state', event.target.value)}>
          <option value="">Estado</option>
          {STATES.map((state) => <option key={state} value={state}>{state}</option>)}
        </select>
        {!hasRequestedAmount ? <Input value={form.requestedAmount} onChange={(event) => update('requestedAmount', formatCurrencyBRL(event.target.value))} placeholder="Valor desejado" inputMode="numeric" className="bg-white text-slate-950" /> : null}
        {!hasIncome ? <Input value={form.income} onChange={(event) => update('income', formatCurrencyBRL(event.target.value))} placeholder="Renda mensal" inputMode="numeric" className="bg-white text-slate-950" /> : null}
        <Input value={form.assetValue} onChange={(event) => update('assetValue', formatCurrencyBRL(event.target.value))} placeholder="Valor estimado do bem" inputMode="numeric" className="bg-white text-slate-950 sm:col-span-2" />
      </div>

      <label className="mt-4 flex items-start gap-3 rounded-[16px] border border-white/10 bg-white/[0.04] p-3 text-sm leading-6 text-white/72">
        <input type="checkbox" checked={form.consent} onChange={(event) => update('consent', event.target.checked)} className="mt-1" />
        <span>{LGPD_TEXT}</span>
      </label>

      {message ? (
        <div className="mt-3 rounded-[16px] border border-white/10 bg-white/[0.04] p-3 text-sm leading-6 text-white/72">
          {message}
          {requiredFields.length ? <div className="mt-1 text-white/50">Complete: {requiredFields.map((field) => REQUIRED_FIELD_LABELS[field] || field).join(', ')}</div> : null}
        </div>
      ) : null}

      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <Button type="submit" disabled={status === 'submitting'} className="h-11 rounded-full bg-[#7C6EF7] px-5 text-white hover:bg-[#6254D4]">
          {status === 'submitting' ? 'Consultando...' : 'Continuar com Creditas'}
        </Button>
        {status === 'fallback' || status === 'error' ? (
          <Button type="button" variant="outline" className="h-11 rounded-full border-white/15 bg-white/[0.04] px-5 text-white hover:bg-white/10" onClick={() => openWhatsApp({ sourcePage: 'creditas_fallback', mainProduct: 'Crédito com garantia' })}>
            Continuar no WhatsApp
          </Button>
        ) : null}
      </div>
    </form>
  );
}
