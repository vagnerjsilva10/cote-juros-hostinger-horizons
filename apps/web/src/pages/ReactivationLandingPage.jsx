import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';
import SeoHead from '@/components/SeoHead.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Checkbox } from '@/components/ui/checkbox.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Label } from '@/components/ui/label.jsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx';
import { portalApi } from '@/platform/services/portalApi.js';

const CONSENT_VERSION = '2026-04-16';
const PRIVACY_POLICY_VERSION = '2026-04-16';

const productLabels = {
  loan: 'Emprestimo pessoal',
  credit_card: 'Cartao de credito',
  financing: 'Financiamento'
};

const moneyToNumber = (value) => {
  const normalized = String(value || '').replace(/\./g, '').replace(',', '.').replace(/[^\d.]/g, '');
  return normalized ? Number(normalized) : undefined;
};

const getIdempotencyKey = (token) => {
  const storageKey = `cj_reactivation_submit_${token}`;
  const existing = window.localStorage.getItem(storageKey);
  if (existing) return existing;
  const value =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}_${Math.random().toString(36).slice(2)}`;
  window.localStorage.setItem(storageKey, value);
  return value;
};

function Field({ label, children }) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-semibold text-foreground">{label}</Label>
      {children}
    </div>
  );
}

export default function ReactivationLandingPage() {
  const { token } = useParams();
  const [searchParams] = useSearchParams();
  const [lead, setLead] = useState(null);
  const [step, setStep] = useState(1);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const [accepted, setAccepted] = useState(false);
  const [result, setResult] = useState(null);
  const [dismissedOptOutPrompt, setDismissedOptOutPrompt] = useState(false);
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    productType: 'loan',
    requestedAmount: '',
    income: '',
    employmentStatus: 'clt',
    hasRestriction: 'false',
    hasGuarantee: 'false',
    guaranteeType: ''
  });

  useEffect(() => {
    let ignore = false;
    setStatus('loading');
    portalApi
      .getReactivationLead(token, { markViewed: true })
      .then((data) => {
        if (ignore) return;
        setLead(data);
        setForm((current) => ({
          ...current,
          fullName: data?.fullName || current.fullName,
          email: data?.email || current.email,
          phone: data?.phone || current.phone,
          productType: data?.productType || current.productType,
          requestedAmount: data?.requestedAmount ? String(data.requestedAmount) : current.requestedAmount,
          income: data?.income ? String(data.income) : current.income,
          employmentStatus: data?.employmentStatus || current.employmentStatus,
          hasRestriction: data?.hasRestriction === true ? 'true' : current.hasRestriction,
          hasGuarantee: data?.hasGuarantee === true ? 'true' : current.hasGuarantee,
          guaranteeType: data?.guaranteeType || current.guaranteeType
        }));
        setStatus(data?.status === 'expired' || data?.status === 'revoked' ? data.status : 'ready');
      })
      .catch((err) => {
        if (ignore) return;
        setError(err.message || 'Nao foi possivel validar este link.');
        setStatus('error');
      });

    return () => {
      ignore = true;
    };
  }, [token]);

  const greeting = useMemo(() => {
    const firstName = (form.fullName || lead?.fullName || '').trim().split(' ')[0];
    return firstName ? `${firstName}, confirme seu interesse em credito` : 'Confirme seu interesse em credito';
  }, [form.fullName, lead?.fullName]);

  const updateForm = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const validateStepOne = () => {
    if (!form.fullName.trim() || form.fullName.trim().length < 3) return 'Informe seu nome completo.';
    if (form.phone.replace(/\D/g, '').length < 10) return 'Informe um WhatsApp valido.';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return 'Informe um e-mail valido.';
    return '';
  };

  const goToConsent = () => {
    const message = validateStepOne();
    if (message) {
      setError(message);
      return;
    }
    setError('');
    setStep(2);
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!accepted) {
      setError('Para continuar, confirme o consentimento LGPD.');
      return;
    }
    setStatus('submitting');
    setError('');

    try {
      const payload = {
        token,
        fullName: form.fullName.trim(),
        email: form.email.trim() || undefined,
        phone: form.phone.trim(),
        productType: form.productType,
        requestedAmount: moneyToNumber(form.requestedAmount),
        income: moneyToNumber(form.income),
        employmentStatus: form.employmentStatus,
        hasRestriction: form.hasRestriction === 'true',
        hasGuarantee: form.hasGuarantee === 'true',
        guaranteeType: form.hasGuarantee === 'true' ? form.guaranteeType : undefined,
        consentAccepted: true,
        consentVersion: CONSENT_VERSION,
        privacyPolicyVersion: PRIVACY_POLICY_VERSION,
        source: '/r/[token]',
        idempotencyKey: getIdempotencyKey(token)
      };
      const data = await portalApi.submitReactivationLead(payload);
      setResult(data);
      setStatus('done');
    } catch (err) {
      setError(err.message || 'Nao foi possivel enviar seus dados agora.');
      setStatus('ready');
    }
  };

  const optOut = async (scope) => {
    setStatus('submitting');
    setError('');
    try {
      await portalApi.optOutReactivationLead({ token, scope, reason: 'lead_request' });
      setStatus('opted_out');
    } catch (err) {
      setError(err.message || 'Nao foi possivel registrar sua preferencia.');
      setStatus('ready');
    }
  };

  const refuseConsent = async () => {
    setStatus('submitting');
    setError('');
    try {
      await portalApi.refuseReactivationConsent({ token, reason: 'consent_not_accepted' });
      setStatus('refused');
    } catch (err) {
      setError(err.message || 'Nao foi possivel registrar sua recusa.');
      setStatus('ready');
    }
  };

  const blockedStatus = ['expired', 'revoked', 'opted_out', 'refused'].includes(status);
  const showOptOutPrompt = searchParams.get('optout') === '1' && !dismissedOptOutPrompt && status === 'ready';

  return (
    <>
      <SeoHead
        title="Atualize seu perfil de credito | Cote Juros"
        description="Confirme seu interesse, autorize o uso dos dados e veja caminhos de credito compativeis com seu momento."
        path={`/r/${token}`}
        robots="noindex,nofollow"
      />

      <section className="bg-[#f7faf9]">
        <div className="mx-auto grid min-h-[72vh] max-w-7xl gap-10 px-4 py-10 md:grid-cols-[1.05fr_0.95fr] md:px-8 md:py-14">
          <div className="flex flex-col justify-center">
            <div className="mb-5 inline-flex w-fit items-center gap-2 rounded-md border border-emerald-200 bg-white px-3 py-2 text-sm font-semibold text-emerald-800">
              <ShieldCheck className="h-4 w-4" />
              Link seguro Cote Juros
            </div>
            <h1 className="max-w-3xl text-4xl font-bold leading-tight text-slate-950 md:text-6xl">{greeting}</h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-700">
              Atualize poucos dados para avaliarmos seu perfil e encaminharmos sua solicitacao para um parceiro de credito
              autorizado, sem promessa de aprovacao e sem cobranca antecipada.
            </p>
            <div className="mt-8 grid gap-3 text-sm text-slate-700 sm:grid-cols-3">
              {['Consentimento claro', 'Analise automatica', 'Auditoria por lead'].map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-700" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative min-h-[340px] overflow-hidden rounded-lg bg-slate-950">
            <img
              src="/assets/editorial/editorial-woman-phone.png"
              alt="Pessoa conferindo uma proposta pelo celular"
              className="h-full min-h-[340px] w-full object-cover opacity-80"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-transparent p-6 text-white">
              <p className="text-sm font-semibold uppercase tracking-[0.08em] text-emerald-200">Voce no controle</p>
              <p className="mt-2 max-w-md text-2xl font-bold">Voce decide se quer continuar depois da indicacao.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white px-4 py-10 md:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 md:grid-cols-[0.72fr_1.28fr]">
          <aside className="space-y-4">
            <div className="rounded-lg border border-slate-200 p-5">
              <h2 className="text-xl font-bold text-slate-950">Uso dos dados</h2>
              <p className="mt-3 text-sm leading-6 text-slate-700">
                Seus dados serao usados para confirmar interesse, qualificar seu perfil, registrar consentimento e enviar a
                solicitacao ao parceiro mais adequado.
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 p-5">
              <h2 className="text-xl font-bold text-slate-950">Preferencias</h2>
              <div className="mt-3 flex flex-col gap-2 text-sm">
                <button className="text-left font-semibold text-slate-700 underline" type="button" onClick={() => optOut('unsubscribe_whatsapp')}>
                  Nao quero receber WhatsApp
                </button>
                <button className="text-left font-semibold text-slate-700 underline" type="button" onClick={() => optOut('dnc_global')}>
                  Nao quero mais contato
                </button>
              </div>
            </div>
          </aside>

          <div className="rounded-lg border border-slate-200 p-5 md:p-7">
            {showOptOutPrompt ? (
              <div className="space-y-5">
                <h2 className="text-3xl font-bold text-slate-950">Remover seu contato?</h2>
                <p className="text-slate-700">
                  Voce chegou pelo link de remocao. Se confirmar, a Cote Juros registrara sua preferencia e nao usara
                  este cadastro para novos contatos desta operacao.
                </p>
                {error ? <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button type="button" onClick={() => optOut('dnc_global')} className="rounded-md">
                    Confirmar remocao
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setDismissedOptOutPrompt(true)} className="rounded-md">
                    Continuar para atualizacao
                  </Button>
                </div>
              </div>
            ) : blockedStatus ? (
              <div className="space-y-3">
                <h2 className="text-3xl font-bold text-slate-950">Preferencia registrada</h2>
                <p className="text-slate-700">
                  Seu link nao seguira para envio a parceiros. A Cote Juros registrou esta decisao na trilha de auditoria.
                </p>
              </div>
            ) : status === 'done' ? (
              <div className="space-y-5">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-md bg-emerald-100 text-emerald-800">
                  <Sparkles className="h-6 w-6" />
                </div>
                <h2 className="text-3xl font-bold text-slate-950">Perfil atualizado</h2>
                <p className="text-slate-700">
                  Seu perfil foi direcionado para <strong>{result?.partner?.name || 'o parceiro mais adequado'}</strong>.
                  A analise final depende das politicas do parceiro.
                </p>
                {result?.redirectUrl ? (
                  <Button asChild className="rounded-md">
                    <a href={result.redirectUrl}>Continuar com seguranca</a>
                  </Button>
                ) : (
                  <p className="rounded-md bg-slate-100 p-4 text-sm text-slate-700">
                    Recebemos sua solicitacao. Um canal autorizado podera continuar o atendimento.
                  </p>
                )}
              </div>
            ) : (
              <form className="grid gap-5" onSubmit={submit}>
                <div>
                  <p className="text-sm font-semibold text-emerald-800">Etapa {step} de 2</p>
                  <h2 className="mt-1 text-3xl font-bold text-slate-950">
                    {step === 1 ? 'Confirme seus dados' : 'Autorize a analise'}
                  </h2>
                  <p className="mt-2 text-sm text-slate-700">
                    {step === 1
                      ? 'Use seus dados atuais para melhorar a compatibilidade da indicacao.'
                      : 'Leia o consentimento antes de enviar. Voce pode recusar sem custo.'}
                  </p>
                </div>

                {error ? <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}

                {step === 1 ? (
                  <>
                    <div className="grid gap-4 md:grid-cols-2">
                      <Field label="Nome completo">
                        <Input value={form.fullName} onChange={(event) => updateForm('fullName', event.target.value)} required />
                      </Field>
                      <Field label="WhatsApp">
                        <Input value={form.phone} onChange={(event) => updateForm('phone', event.target.value)} required />
                      </Field>
                      <Field label="E-mail">
                        <Input type="email" value={form.email} onChange={(event) => updateForm('email', event.target.value)} />
                      </Field>
                      <Field label="Produto desejado">
                        <Select value={form.productType} onValueChange={(value) => updateForm('productType', value)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {Object.entries(productLabels).map(([value, label]) => (
                              <SelectItem key={value} value={value}>{label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </Field>
                    </div>
                    <Button type="button" onClick={goToConsent} className="w-full rounded-md md:w-fit">
                      Continuar
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="grid gap-4 md:grid-cols-2">
                      <Field label="Valor desejado">
                        <Input value={form.requestedAmount} onChange={(event) => updateForm('requestedAmount', event.target.value)} placeholder="Ex.: 5000" />
                      </Field>
                      <Field label="Renda mensal">
                        <Input value={form.income} onChange={(event) => updateForm('income', event.target.value)} placeholder="Ex.: 3500" required />
                      </Field>
                      <Field label="Ocupacao">
                        <Select value={form.employmentStatus} onValueChange={(value) => updateForm('employmentStatus', value)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="clt">CLT</SelectItem>
                            <SelectItem value="autonomo">Autonomo</SelectItem>
                            <SelectItem value="mei">MEI</SelectItem>
                            <SelectItem value="servidor_publico">Servidor publico</SelectItem>
                            <SelectItem value="aposentado">Aposentado</SelectItem>
                          </SelectContent>
                        </Select>
                      </Field>
                      <Field label="Possui restricao no nome?">
                        <Select value={form.hasRestriction} onValueChange={(value) => updateForm('hasRestriction', value)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="false">Nao</SelectItem>
                            <SelectItem value="true">Sim</SelectItem>
                          </SelectContent>
                        </Select>
                      </Field>
                      <Field label="Possui garantia?">
                        <Select value={form.hasGuarantee} onValueChange={(value) => updateForm('hasGuarantee', value)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="false">Nao</SelectItem>
                            <SelectItem value="true">Sim</SelectItem>
                          </SelectContent>
                        </Select>
                      </Field>
                      {form.hasGuarantee === 'true' ? (
                        <Field label="Tipo de garantia">
                          <Select value={form.guaranteeType} onValueChange={(value) => updateForm('guaranteeType', value)}>
                            <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="veiculo">Veiculo</SelectItem>
                              <SelectItem value="imovel">Imovel</SelectItem>
                              <SelectItem value="fgts">FGTS</SelectItem>
                              <SelectItem value="outro">Outro</SelectItem>
                            </SelectContent>
                          </Select>
                        </Field>
                      ) : null}
                    </div>

                    <label className="flex gap-3 rounded-md border border-slate-200 p-4 text-sm leading-6 text-slate-700">
                      <Checkbox checked={accepted} onCheckedChange={(value) => setAccepted(Boolean(value))} />
                      <span>
                        Autorizo a Cote Juros a tratar meus dados para atualizar meu cadastro, calcular compatibilidade,
                        compartilhar a solicitacao com parceiros de credito e registrar eventos de auditoria. Versoes:
                        consentimento {CONSENT_VERSION}, privacidade {PRIVACY_POLICY_VERSION}.
                      </span>
                    </label>

                    <div className="flex flex-col gap-3 sm:flex-row">
                      <Button type="submit" disabled={!accepted || status === 'submitting'} className="rounded-md">
                        {status === 'submitting' ? 'Enviando...' : 'Atualizar e ver caminho'}
                      </Button>
                      <Button type="button" variant="outline" onClick={() => setStep(1)} className="rounded-md">
                        Voltar
                      </Button>
                      <Button type="button" variant="ghost" onClick={refuseConsent} className="rounded-md">
                        Recusar consentimento
                      </Button>
                    </div>
                  </>
                )}
              </form>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
