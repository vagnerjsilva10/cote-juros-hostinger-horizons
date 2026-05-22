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
import { partnerRedirectService } from '@/platform/services/partnerRedirectService.js';
import { formatCurrencyBRL, parseCurrencyBRL } from '@/components/smart-quiz/currency.js';
import { formatPhoneValue } from '@/lib/quickCreditSubmission.js';

const LGPD_TEXT = 'Autorizo a Cote Juros a compartilhar meus dados com a parceira Creditas para análise de opções de crédito com garantia. A aprovação e condições dependem da avaliação da parceira.';
const CREDITAS_PARTNER_URL = 'https://www.creditas.com/emprestimo-de-qualidade';
const CREDITAS_OFFER_ID = 'offer-creditas-garantia-api';

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

const firstMoneyValue = (...values) => {
  const value = values.find((item) => hasMoneyValue(item));
  return value ? formatCurrencyBRL(value) : '';
};

const resolveCreditasProduct = (guaranteeType) => guaranteeType === 'vehicle' ? 'auto_equity' : 'home_equity';

export default function CreditasExtraForm({ lead, quizAnswers, recommendation, onStatus }) {
  const [form, setForm] = useState({
    fullName: lead?.name || lead?.fullName || '',
    phone: lead?.phone || lead?.whatsapp || '',
    email: lead?.email || '',
    cpf: '',
    city: '',
    state: '',
    guaranteeType: '',
    assetValue: '',
    requestedAmount: firstMoneyValue(quizAnswers?.amount, quizAnswers?.valor, quizAnswers?.requestedAmount, lead?.requestedAmount, lead?.amount),
    income: firstMoneyValue(quizAnswers?.monthlyIncome, quizAnswers?.income, quizAnswers?.renda, lead?.monthlyIncome, lead?.income),
    consent: false
  });
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');
  const [requiredFields, setRequiredFields] = useState([]);

  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const redirectToCreditas = async (payload, result) => {
    setStatus('redirecting');
    setMessage('Consulta registrada. Redirecionando para a Creditas...');

    try {
      const productType = resolveCreditasProduct(payload.guaranteeType);
      const redirect = await partnerRedirectService.create({
        partnerId: 'creditas',
        partnerSlug: 'creditas',
        offerId: CREDITAS_OFFER_ID,
        sourcePage: 'smart_quiz_creditas',
        productType,
        utm: {
          source: 'cotejuros',
          medium: 'resultado',
          campaign: productType
        },
        metadata: {
          provider: 'creditas',
          eligibilityStatus: result?.status || result?.mode,
          externalId: result?.externalId || null
        }
      });

      window.location.assign(redirect?.resolvedUrl || redirect?.redirectUrl || CREDITAS_PARTNER_URL);
    } catch (error) {
      await trackEvent('creditas_redirect_fallback_used', {
        sourcePage: 'smart_quiz_creditas',
        reason: error?.message || 'redirect_failed'
      });
      window.location.assign(CREDITAS_PARTNER_URL);
    }
  };

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

    let eligibility;
    try {
      eligibility = await checkCreditasEligibility(payload);
    } catch (error) {
      await redirectToCreditas(payload, {
        ok: false,
        mode: 'creditas_api_error',
        status: error?.status || error?.code || 'api_error'
      });
      return;
    }

    if (eligibility?.mode === 'missing_required_data') {
      setStatus('missing');
      setRequiredFields(eligibility.requiredFields || []);
      setMessage('Faltam dados para consultar a Creditas com segurança.');
      onStatus?.(eligibility);
      return;
    }

    let leadResult;
    try {
      leadResult = eligibility?.ok ? await submitCreditasLead(payload) : eligibility;
    } catch (error) {
      await redirectToCreditas(payload, {
        ok: false,
        mode: 'creditas_submit_error',
        status: error?.status || error?.code || 'submit_error'
      });
      return;
    }
    const finalStatus = leadResult?.status || leadResult?.mode;
    onStatus?.(leadResult);

    if (leadResult?.mode === 'fallback') {
      await redirectToCreditas(payload, leadResult);
      return;
    }

    if (leadResult?.ok) {
      if (finalStatus !== 'not_eligible') {
        await redirectToCreditas(payload, leadResult);
        return;
      }

      setStatus('done');
      setMessage('Não elegível no momento. Você ainda pode seguir por outros caminhos.');
      return;
    }

    await redirectToCreditas(payload, leadResult);
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
        {!lead?.name && !lead?.fullName ? <label className="creditas-field sm:col-span-2"><span>Nome completo</span><Input value={form.fullName} onChange={(event) => update('fullName', event.target.value)} placeholder="Nome completo" /></label> : null}
        {!lead?.phone && !lead?.whatsapp ? <label className="creditas-field"><span>WhatsApp</span><Input value={form.phone} onChange={(event) => update('phone', formatPhoneValue(event.target.value))} placeholder="(11) 99999-9999" inputMode="tel" autoComplete="tel" maxLength={15} /></label> : null}
        {!lead?.email ? <label className="creditas-field"><span>E-mail</span><Input value={form.email} onChange={(event) => update('email', event.target.value)} placeholder="seu@email.com" type="email" /></label> : null}
        <label className="creditas-field"><span>CPF</span><Input value={form.cpf} onChange={(event) => update('cpf', event.target.value)} placeholder="000.000.000-00" /></label>
        <label className="creditas-field"><span>Tipo de garantia</span><select className="creditas-select" value={form.guaranteeType} onChange={(event) => update('guaranteeType', event.target.value)}>
          <option value="">Selecione</option>
          <option value="home">Imóvel</option>
          <option value="vehicle">Veículo</option>
        </select></label>
        <label className="creditas-field"><span>Cidade</span><Input value={form.city} onChange={(event) => update('city', event.target.value)} placeholder="Cidade" /></label>
        <label className="creditas-field"><span>Estado</span><select className="creditas-select" value={form.state} onChange={(event) => update('state', event.target.value)}>
          <option value="">UF</option>
          {STATES.map((state) => <option key={state} value={state}>{state}</option>)}
        </select></label>
        <label className="creditas-field"><span>Valor desejado</span><Input value={form.requestedAmount} onChange={(event) => update('requestedAmount', formatCurrencyBRL(event.target.value))} placeholder="R$ 50.000" inputMode="numeric" /></label>
        <label className="creditas-field"><span>Renda mensal</span><Input value={form.income} onChange={(event) => update('income', formatCurrencyBRL(event.target.value))} placeholder="R$ 3.500" inputMode="numeric" /></label>
        <label className="creditas-field sm:col-span-2"><span>Valor estimado do bem</span><Input value={form.assetValue} onChange={(event) => update('assetValue', formatCurrencyBRL(event.target.value))} placeholder="R$ 150.000" inputMode="numeric" /></label>
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
        <Button type="submit" disabled={status === 'submitting' || status === 'redirecting'} className="h-11 rounded-full bg-[#7C6EF7] px-5 text-white hover:bg-[#6254D4]">
          {status === 'submitting' ? 'Consultando...' : status === 'redirecting' ? 'Redirecionando...' : 'Continuar com Creditas'}
        </Button>
      </div>
    </form>
  );
}
