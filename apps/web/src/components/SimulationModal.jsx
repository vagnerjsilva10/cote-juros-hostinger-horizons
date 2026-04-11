import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Briefcase, Building2, CalendarDays, CheckCircle2, ChevronLeft, Home, LoaderCircle, ShieldCheck, User, UserMinus, Wallet, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { simulationFunnelService } from '@/platform/services/simulationFunnelService.js';

const STORAGE_KEY = 'cj.credit-funnel.v2';
const STATES = ['AC','AL','AM','AP','BA','CE','DF','ES','GO','MA','MG','MS','MT','PA','PB','PE','PI','PR','RJ','RN','RO','RR','RS','SC','SE','SP','TO'];
const JOBS = [{ id: 'CLT', icon: Briefcase }, { id: 'PJ', icon: Building2 }, { id: 'Autonomo', icon: User }, { id: 'Aposentado', icon: Wallet }, { id: 'Desempregado', icon: UserMinus }];
const SCORES = ['Baixo', 'Medio', 'Alto'];
const GENDERS = [['MALE', 'Masculino'], ['FEMALE', 'Feminino'], ['OTHER', 'Outro']];
const MARITAL = [['SINGLE', 'Solteiro(a)'], ['MARRIED', 'Casado(a)'], ['DIVORCED', 'Divorciado(a)'], ['WIDOWED', 'Viuvo(a)'], ['STABLE_UNION', 'Uniao estavel']];
const EDUCATION = [['INCOMPLETE_ELEMENTARY', 'Fundamental incompleto'], ['ELEMENTARY', 'Fundamental completo'], ['INCOMPLETE_HIGH', 'Medio incompleto'], ['HIGH', 'Medio completo'], ['INCOMPLETE_COLLEGE', 'Superior incompleto'], ['COLLEGE', 'Superior completo'], ['INCOMPLETE_POSTGRADUATE', 'Pos incompleta'], ['POSTGRADUATE', 'Pos completa']];
const STEPS = [
  ['intention', 'Quanto voce quer contratar?', 'Valor e prazo para buscar linhas mais aderentes.'],
  ['financial', 'Como esta o seu perfil financeiro?', 'Esses dados ajudam a priorizar ofertas com melhor encaixe.'],
  ['personal', 'Agora seus dados pessoais', 'Pedimos apenas o necessario para seguir com a simulacao real.'],
  ['residence', 'Nascimento e endereco', 'Completamos o cadastro exigido pelo provedor sem pesar a jornada.'],
  ['review', 'Revise e confirme', 'Uma ultima checagem antes de buscar suas ofertas.']
];

const initialData = (initialAmount = 10000) => ({
  intention: { requestedAmount: initialAmount, installments: 24, productType: 'loan' },
  financial: { income: 5000, employmentStatus: '', scoreRange: '', hasRestriction: null },
  personal: { fullName: '', cpf: '', phone: '', email: '', birthDate: '', mothersName: '', gender: '', maritalStatus: '', educationalLevel: '' },
  residence: { birthCity: '', birthState: '', address: '', number: '', district: '', city: '', state: '', zipCode: '' },
  termsAccepted: false
});

const digits = (value = '') => String(value).replace(/\D/g, '');
const trim = (value = '') => value.trim().replace(/\s+/g, ' ');
const validEmail = (value = '') => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const validPhone = (value = '') => [10, 11].includes(digits(value).length);
const validZip = (value = '') => digits(value).length === 8;
const toIsoDate = (value = '') => {
  const raw = digits(value);
  return raw.length === 8 ? `${raw.slice(4, 8)}-${raw.slice(2, 4)}-${raw.slice(0, 2)}` : null;
};
const validDate = (value = '') => {
  const raw = digits(value);
  if (raw.length !== 8) return false;
  const day = Number(raw.slice(0, 2));
  const month = Number(raw.slice(2, 4));
  const year = Number(raw.slice(4, 8));
  const parsed = new Date(year, month - 1, day);
  return parsed.getFullYear() === year && parsed.getMonth() === month - 1 && parsed.getDate() === day && parsed <= new Date();
};
const formatCpf = (value = '') => {
  let next = digits(value).slice(0, 11);
  if (next.length > 9) next = next.replace(/(\d{3})(\d{3})(\d{3})(\d{1,2})/, '$1.$2.$3-$4');
  else if (next.length > 6) next = next.replace(/(\d{3})(\d{3})(\d{1,3})/, '$1.$2.$3');
  else if (next.length > 3) next = next.replace(/(\d{3})(\d{1,3})/, '$1.$2');
  return next;
};
const formatPhone = (value = '') => {
  let next = digits(value).slice(0, 11);
  if (next.length > 10) next = next.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  else if (next.length > 6) next = next.replace(/(\d{2})(\d{4,5})(\d{1,4})/, '($1) $2-$3');
  else if (next.length > 2) next = next.replace(/(\d{2})(\d{1,5})/, '($1) $2');
  return next;
};
const formatDate = (value = '') => {
  let next = digits(value).slice(0, 8);
  if (next.length > 4) next = next.replace(/(\d{2})(\d{2})(\d{1,4})/, '$1/$2/$3');
  else if (next.length > 2) next = next.replace(/(\d{2})(\d{1,2})/, '$1/$2');
  return next;
};
const formatZip = (value = '') => {
  let next = digits(value).slice(0, 8);
  if (next.length > 5) next = next.replace(/(\d{5})(\d{1,3})/, '$1-$2');
  return next;
};
const validCpf = (value = '') => {
  const cpf = digits(value);
  if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i += 1) sum += Number(cpf[i]) * (10 - i);
  let rest = (sum * 10) % 11;
  if (rest === 10) rest = 0;
  if (rest !== Number(cpf[9])) return false;
  sum = 0;
  for (let i = 0; i < 10; i += 1) sum += Number(cpf[i]) * (11 - i);
  rest = (sum * 10) % 11;
  if (rest === 10) rest = 0;
  return rest === Number(cpf[10]);
};
const maskedCpf = (value = '') => {
  const formatted = formatCpf(value);
  return formatted.length === 14 ? `${formatted.slice(0, 3)}.***.***-${formatted.slice(-2)}` : formatted;
};

const readStored = () => {
  if (typeof window === 'undefined') return null;
  try { return JSON.parse(window.localStorage.getItem(STORAGE_KEY) || 'null'); } catch { return null; }
};
const writeStored = (value) => {
  if (typeof window === 'undefined') return;
  try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value)); } catch {}
};
const clearStored = () => {
  if (typeof window !== 'undefined') window.localStorage.removeItem(STORAGE_KEY);
};

const Field = ({ label, children, hint }) => (
  <div className="space-y-2">
    <div className="flex items-center justify-between gap-3">
      <p className="text-sm font-semibold text-foreground">{label}</p>
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
    {children}
  </div>
);

export function SimulationModal({ isOpen, onClose, initialAmount = 10000 }) {
  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [data, setData] = useState(() => ({ ...initialData(initialAmount), ...(readStored() || {}) }));
  const navigate = useNavigate();
  const current = STEPS[step];

  useEffect(() => { writeStored(data); }, [data]);

  useEffect(() => {
    if (!isOpen) return;
    const stored = readStored();
    setStep(0);
    setIsSubmitting(false);
    setData((previous) => ({
      ...initialData(initialAmount),
      ...previous,
      ...(stored || {}),
      intention: { ...initialData(initialAmount).intention, ...previous.intention, ...(stored?.intention || {}), requestedAmount: previous.intention?.requestedAmount || stored?.intention?.requestedAmount || initialAmount }
    }));

    simulationFunnelService.start({
      sourcePage: window.location.pathname,
      productType: 'loan',
      amount: initialAmount,
      utm: Object.fromEntries(new URLSearchParams(window.location.search).entries())
    });
  }, [initialAmount, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    simulationFunnelService.progress({
      sourcePage: window.location.pathname,
      productType: data.intention.productType,
      funnelStep: current[0],
      amount: data.intention.requestedAmount,
      score: data.financial.scoreRange,
      utm: Object.fromEntries(new URLSearchParams(window.location.search).entries()),
      metadata: { installments: data.intention.installments }
    });
  }, [current, data.financial.scoreRange, data.intention.installments, data.intention.productType, data.intention.requestedAmount, isOpen]);

  const setSection = (section, field, value) => setData((previous) => ({ ...previous, [section]: { ...previous[section], [field]: value } }));
  const intentionValid = data.intention.requestedAmount >= 1000 && data.intention.installments >= 3;
  const financialValid = data.financial.income >= 1000 && !!data.financial.employmentStatus && !!data.financial.scoreRange && typeof data.financial.hasRestriction === 'boolean';
  const personalValid = trim(data.personal.fullName).length >= 3 && validCpf(data.personal.cpf) && validPhone(data.personal.phone) && validEmail(data.personal.email) && validDate(data.personal.birthDate) && trim(data.personal.mothersName).length >= 3 && !!data.personal.gender && !!data.personal.maritalStatus && !!data.personal.educationalLevel;
  const residenceValid = trim(data.residence.birthCity).length >= 2 && !!data.residence.birthState && trim(data.residence.address).length >= 4 && trim(data.residence.number).length >= 1 && trim(data.residence.district).length >= 2 && trim(data.residence.city).length >= 2 && !!data.residence.state && validZip(data.residence.zipCode);
  const validations = [intentionValid, financialValid, personalValid, residenceValid, data.termsAccepted && intentionValid && financialValid && personalValid && residenceValid];

  const review = useMemo(() => ([
    ['Valor desejado', `R$ ${data.intention.requestedAmount.toLocaleString('pt-BR')}`],
    ['Parcelas', `${data.intention.installments}x`],
    ['Renda', `R$ ${data.financial.income.toLocaleString('pt-BR')}`],
    ['Nome', data.personal.fullName || '--'],
    ['CPF', maskedCpf(data.personal.cpf) || '--'],
    ['Telefone', data.personal.phone || '--'],
    ['Email', data.personal.email || '--'],
    ['Endereco', [data.residence.address && `${data.residence.address}, ${data.residence.number}`, data.residence.district, data.residence.city && `${data.residence.city}/${data.residence.state}`].filter(Boolean).join(' - ') || '--']
  ]), [data]);

  const submit = async () => {
    if (!validations[4]) return;
    try {
      setIsSubmitting(true);
      const utm = Object.fromEntries(new URLSearchParams(window.location.search).entries());
      const result = await simulationFunnelService.runCreditJourney({
        sourcePage: window.location.pathname,
        productType: data.intention.productType,
        requestedAmount: data.intention.requestedAmount,
        installments: data.intention.installments,
        fullName: data.personal.fullName,
        cpf: data.personal.cpf,
        phone: data.personal.phone,
        email: data.personal.email,
        income: data.financial.income,
        scoreRange: data.financial.scoreRange,
        hasRestriction: data.financial.hasRestriction,
        employmentStatus: data.financial.employmentStatus,
        birthDate: data.personal.birthDate,
        mothersName: data.personal.mothersName,
        gender: data.personal.gender,
        maritalStatus: data.personal.maritalStatus,
        educationalLevel: data.personal.educationalLevel,
        birthCity: data.residence.birthCity,
        birthState: data.residence.birthState,
        address: data.residence.address,
        addressNumber: data.residence.number,
        district: data.residence.district,
        city: data.residence.city,
        state: data.residence.state,
        zipCode: data.residence.zipCode,
        utm
      });
      clearStored();
      onClose();
      navigate(`/emprestimos?credit_simulation_id=${result.simulation.id}`, { state: { creditJourney: result } });
    } catch (error) {
      toast.error(error.message || 'Nao foi possivel concluir a simulacao agora.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[92vh] max-w-3xl overflow-hidden border border-border bg-white p-0">
        <DialogTitle className="sr-only">Simulacao de credito</DialogTitle>
        <DialogDescription className="sr-only">Preencha seus dados para visualizar ofertas personalizadas.</DialogDescription>

        <div className="border-b border-border bg-[linear-gradient(135deg,#f8fafc_0%,#ffffff_55%,#f7f3ec_100%)] px-6 py-5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {step > 0 ? <button type="button" onClick={() => setStep((currentStep) => Math.max(currentStep - 1, 0))} className="rounded-full border border-border bg-white p-2 text-muted-foreground hover:bg-background hover:text-foreground"><ChevronLeft className="h-4 w-4" /></button> : null}
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Passo {step + 1} de {STEPS.length}</p>
                <p className="mt-1 text-sm font-medium text-foreground">{current[1]}</p>
              </div>
            </div>
            <div className="flex min-w-[180px] items-center gap-2">{STEPS.map((item, index) => <span key={item[0]} className={`h-1.5 flex-1 rounded-full ${index <= step ? 'bg-foreground' : 'bg-border'}`} />)}</div>
          </div>
        </div>

        <div className="overflow-y-auto px-6 py-8 sm:px-10">
          <AnimatePresence mode="wait">
            <motion.div key={current[0]} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.2, ease: 'easeOut' }} className="space-y-8">
              <div className="space-y-3">
                <h2 className="text-3xl font-semibold tracking-[-0.04em] text-foreground">{current[1]}</h2>
                <p className="max-w-2xl text-base text-muted-foreground">{current[2]}</p>
              </div>

              {current[0] === 'intention' ? (
                <div className="space-y-8">
                  <div className="rounded-[20px] border border-border bg-background-secondary px-6 py-8 text-center">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Valor desejado</p>
                    <p className="mt-3 text-4xl font-semibold tracking-[-0.05em] text-foreground">R$ {data.intention.requestedAmount.toLocaleString('pt-BR')}</p>
                  </div>
                  <Slider value={[data.intention.requestedAmount]} onValueChange={(value) => setSection('intention', 'requestedAmount', value[0])} max={500000} min={1000} step={1000} />
                  <div className="rounded-[20px] border border-border bg-white p-6 shadow-[var(--shadow-sm)]">
                    <div className="flex items-end justify-between gap-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Prazo estimado</p>
                        <p className="mt-2 text-3xl font-semibold tracking-[-0.05em] text-foreground">{data.intention.installments}x</p>
                      </div>
                      <p className="max-w-[220px] text-right text-sm text-muted-foreground">Ajuste o prazo para buscar uma condicao mais proxima do seu momento.</p>
                    </div>
                    <div className="mt-6"><Slider value={[data.intention.installments]} onValueChange={(value) => setSection('intention', 'installments', value[0])} max={84} min={3} step={1} /></div>
                  </div>
                </div>
              ) : null}

              {current[0] === 'financial' ? (
                <div className="space-y-8">
                  <div className="rounded-[20px] border border-border bg-background-secondary px-6 py-8 text-center">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Renda mensal</p>
                    <p className="mt-3 text-4xl font-semibold tracking-[-0.05em] text-foreground">R$ {data.financial.income.toLocaleString('pt-BR')}</p>
                  </div>
                  <Slider value={[data.financial.income]} onValueChange={(value) => setSection('financial', 'income', value[0])} max={50000} min={1000} step={500} />
                  <div className="grid gap-3 sm:grid-cols-3">{JOBS.map((job) => <button key={job.id} type="button" onClick={() => setSection('financial', 'employmentStatus', job.id)} className={`rounded-[14px] border p-5 text-left ${data.financial.employmentStatus === job.id ? 'border-foreground bg-background-secondary' : 'border-border bg-background hover:bg-background-secondary'}`}><job.icon className="mb-4 h-5 w-5 text-foreground" /><p className="text-sm font-semibold text-foreground">{job.id}</p></button>)}</div>
                  <div className="grid gap-3">{SCORES.map((score) => <button key={score} type="button" onClick={() => setSection('financial', 'scoreRange', score)} className={`rounded-[14px] border p-5 text-left ${data.financial.scoreRange === score ? 'border-foreground bg-background-secondary' : 'border-border bg-background hover:bg-background-secondary'}`}><div className="flex items-start justify-between gap-4"><div><p className="text-lg font-semibold text-foreground">{score}</p><p className="mt-2 text-sm text-muted-foreground">Usamos isso para ordenar ofertas com mais clareza.</p></div>{data.financial.scoreRange === score ? <CheckCircle2 className="h-5 w-5 text-foreground" /> : null}</div></button>)}</div>
                  <div className="grid gap-3 sm:grid-cols-2">{[{ value: true, label: 'Sim, existe restricao', icon: XCircle }, { value: false, label: 'Nao, esta regular', icon: CheckCircle2 }].map((item) => <button key={String(item.value)} type="button" onClick={() => setSection('financial', 'hasRestriction', item.value)} className={`rounded-[14px] border p-6 text-left ${data.financial.hasRestriction === item.value ? 'border-foreground bg-background-secondary' : 'border-border bg-background hover:bg-background-secondary'}`}><item.icon className="mb-4 h-5 w-5 text-foreground" /><p className="text-base font-semibold text-foreground">{item.label}</p></button>)}</div>
                </div>
              ) : null}

              {current[0] === 'personal' ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input placeholder="Nome completo" value={data.personal.fullName} onChange={(event) => setSection('personal', 'fullName', event.target.value)} className="h-14 sm:col-span-2" />
                  <Input inputMode="numeric" placeholder="000.000.000-00" value={data.personal.cpf} onChange={(event) => setSection('personal', 'cpf', formatCpf(event.target.value))} className="h-14" />
                  <Input inputMode="tel" placeholder="(11) 99999-9999" value={data.personal.phone} onChange={(event) => setSection('personal', 'phone', formatPhone(event.target.value))} className="h-14" />
                  <Input type="email" placeholder="voce@exemplo.com" value={data.personal.email} onChange={(event) => setSection('personal', 'email', event.target.value)} className="h-14 sm:col-span-2" />
                  <div className="relative sm:col-span-2"><CalendarDays className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input inputMode="numeric" placeholder="Data de nascimento (dd/mm/aaaa)" value={data.personal.birthDate} onChange={(event) => setSection('personal', 'birthDate', formatDate(event.target.value))} className="h-14 pl-11" /></div>
                  <Input placeholder="Nome da mae" value={data.personal.mothersName} onChange={(event) => setSection('personal', 'mothersName', event.target.value)} className="h-14 sm:col-span-2" />
                  <Select value={data.personal.gender} onValueChange={(value) => setSection('personal', 'gender', value)}><SelectTrigger className="h-14"><SelectValue placeholder="Genero" /></SelectTrigger><SelectContent>{GENDERS.map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select>
                  <Select value={data.personal.maritalStatus} onValueChange={(value) => setSection('personal', 'maritalStatus', value)}><SelectTrigger className="h-14"><SelectValue placeholder="Estado civil" /></SelectTrigger><SelectContent>{MARITAL.map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select>
                  <Select value={data.personal.educationalLevel} onValueChange={(value) => setSection('personal', 'educationalLevel', value)}><SelectTrigger className="h-14 sm:col-span-2"><SelectValue placeholder="Escolaridade" /></SelectTrigger><SelectContent>{EDUCATION.map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select>
                </div>
              ) : null}

              {current[0] === 'residence' ? (
                <div className="space-y-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Input placeholder="Cidade de nascimento" value={data.residence.birthCity} onChange={(event) => setSection('residence', 'birthCity', event.target.value)} className="h-14" />
                    <Select value={data.residence.birthState} onValueChange={(value) => setSection('residence', 'birthState', value)}><SelectTrigger className="h-14"><SelectValue placeholder="Estado de nascimento" /></SelectTrigger><SelectContent>{STATES.map((state) => <SelectItem key={state} value={state}>{state}</SelectItem>)}</SelectContent></Select>
                  </div>
                  <div className="rounded-[20px] border border-border bg-white p-6 shadow-[var(--shadow-sm)]">
                    <div className="mb-5 flex items-center gap-3"><div className="rounded-full bg-background-secondary p-2"><Home className="h-4 w-4 text-foreground" /></div><div><p className="text-sm font-semibold text-foreground">Endereco residencial</p><p className="text-sm text-muted-foreground">Preencha onde voce mora hoje para completar a simulacao.</p></div></div>
                    <div className="grid gap-4 sm:grid-cols-[1.5fr_0.7fr]">
                      <Input placeholder="Endereco" value={data.residence.address} onChange={(event) => setSection('residence', 'address', event.target.value)} className="h-14" />
                      <Input placeholder="Numero" value={data.residence.number} onChange={(event) => setSection('residence', 'number', event.target.value)} className="h-14" />
                      <Input placeholder="Bairro" value={data.residence.district} onChange={(event) => setSection('residence', 'district', event.target.value)} className="h-14" />
                      <Input inputMode="numeric" placeholder="CEP" value={data.residence.zipCode} onChange={(event) => setSection('residence', 'zipCode', formatZip(event.target.value))} className="h-14" />
                      <Input placeholder="Cidade" value={data.residence.city} onChange={(event) => setSection('residence', 'city', event.target.value)} className="h-14" />
                      <Select value={data.residence.state} onValueChange={(value) => setSection('residence', 'state', value)}><SelectTrigger className="h-14"><SelectValue placeholder="UF" /></SelectTrigger><SelectContent>{STATES.map((state) => <SelectItem key={state} value={state}>{state}</SelectItem>)}</SelectContent></Select>
                    </div>
                  </div>
                </div>
              ) : null}

              {current[0] === 'review' ? (
                <div className="space-y-6">
                  <div className="rounded-[20px] border border-border bg-white p-6 shadow-[var(--shadow-sm)]">
                    <div className="mb-5 space-y-1"><p className="text-sm font-semibold text-foreground">Resumo da solicitacao</p><p className="text-sm text-muted-foreground">Revise os dados antes de buscar suas ofertas.</p></div>
                    <div className="grid gap-4 sm:grid-cols-2">{review.map(([label, value]) => <div key={label} className="rounded-[14px] border border-border bg-background-secondary px-4 py-4"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{label}</p><p className="mt-2 text-sm font-semibold text-foreground">{value}</p></div>)}</div>
                  </div>
                  <div className="rounded-[16px] border border-border bg-background-secondary p-4"><div className="flex items-start gap-3"><ShieldCheck className="mt-0.5 h-5 w-5 text-foreground" /><p className="text-sm text-muted-foreground">Seus dados sao enviados apenas para a API da Cote Juros. A integracao com o provedor acontece somente no backend.</p></div></div>
                  <label className="flex items-start gap-3 rounded-[14px] border border-border bg-white px-4 py-4 text-sm text-muted-foreground"><Checkbox checked={data.termsAccepted} onCheckedChange={(checked) => setData((previous) => ({ ...previous, termsAccepted: Boolean(checked) }))} /><span>Concordo com os Termos de Uso e Politica de Privacidade para iniciar a analise das ofertas.</span></label>
                </div>
              ) : null}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="border-t border-border bg-white px-6 py-5 sm:px-10">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">{step < STEPS.length - 1 ? 'Voce pode voltar e ajustar qualquer etapa sem perder o que ja preencheu.' : 'Tudo pronto. Vamos buscar as melhores ofertas para o seu perfil.'}</p>
            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              {step > 0 ? <Button type="button" variant="outline" size="lg" className="w-full sm:w-auto" onClick={() => setStep((currentStep) => Math.max(currentStep - 1, 0))}>Voltar</Button> : null}
              {step < STEPS.length - 1 ? (
                <Button type="button" size="lg" className="w-full sm:w-auto" disabled={!validations[step]} onClick={() => setStep((currentStep) => Math.min(currentStep + 1, STEPS.length - 1))}>
                  Continuar <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button type="button" size="lg" className="w-full sm:w-auto" disabled={!validations[4] || isSubmitting} onClick={submit}>
                  {isSubmitting ? <><LoaderCircle className="h-4 w-4 animate-spin" /> Buscando ofertas</> : <>Buscar ofertas <ArrowRight className="h-4 w-4" /></>}
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default SimulationModal;
