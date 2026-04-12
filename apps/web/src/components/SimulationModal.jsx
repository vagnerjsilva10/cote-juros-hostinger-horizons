import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRight,
  Briefcase,
  Building2,
  CalendarDays,
  ChevronLeft,
  Home,
  LoaderCircle,
  ShieldCheck,
  User,
  UserMinus,
  Wallet,
  X
} from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { simulationFunnelService } from '@/platform/services/simulationFunnelService.js';

const STORAGE_KEY = 'cj.credit-funnel.v2';
const MIN_AMOUNT = 1000;
const MAX_AMOUNT = 500000;
const MIN_INCOME = 1000;
const MAX_INCOME = 50000;
const MIN_INSTALLMENTS = 3;
const MAX_INSTALLMENTS = 84;
const POPULAR_INSTALLMENTS = [6, 12, 18, 24, 36, 48, 60];
const QUICK_AMOUNTS = [5000, 10000, 20000, 35000];
const STATES = ['AC', 'AL', 'AM', 'AP', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MG', 'MS', 'MT', 'PA', 'PB', 'PE', 'PI', 'PR', 'RJ', 'RN', 'RO', 'RR', 'RS', 'SC', 'SE', 'SP', 'TO'];
const JOBS = [
  { id: 'CLT', label: 'CLT', icon: Briefcase },
  { id: 'PJ', label: 'PJ', icon: Building2 },
  { id: 'Autonomo', label: 'Autônomo', icon: User },
  { id: 'Aposentado', label: 'Aposentado', icon: Wallet },
  { id: 'Desempregado', label: 'Desempregado', icon: UserMinus }
];
const SCORES = [
  { id: 'Baixo', title: 'Baixo', copy: 'Para uma análise mais conservadora.' },
  { id: 'Medio', title: 'Médio', copy: 'Faixa intermediária de aprovação.' },
  { id: 'Alto', title: 'Alto', copy: 'Melhor chance de acessar taxas menores.' }
];
const GENDERS = [['MALE', 'Masculino'], ['FEMALE', 'Feminino'], ['OTHER', 'Outro']];
const MARITAL = [['SINGLE', 'Solteiro(a)'], ['MARRIED', 'Casado(a)'], ['DIVORCED', 'Divorciado(a)'], ['WIDOWED', 'Viúvo(a)'], ['STABLE_UNION', 'União estável']];
const EDUCATION = [['INCOMPLETE_ELEMENTARY', 'Fundamental incompleto'], ['ELEMENTARY', 'Fundamental completo'], ['INCOMPLETE_HIGH', 'Médio incompleto'], ['HIGH', 'Médio completo'], ['INCOMPLETE_COLLEGE', 'Superior incompleto'], ['COLLEGE', 'Superior completo'], ['INCOMPLETE_POSTGRADUATE', 'Pós incompleta'], ['POSTGRADUATE', 'Pós completa']];
const STEPS = [
  { id: 'intention', eyebrow: 'Simulação real', title: 'Quanto você quer contratar?', subtitle: 'Defina valor e prazo para buscar ofertas mais aderentes.', cta: 'Continuar' },
  { id: 'financial', eyebrow: 'Perfil financeiro', title: 'Como está seu perfil hoje?', subtitle: 'Esses dados ajudam a priorizar ofertas mais compatíveis.', cta: 'Continuar' },
  { id: 'personal', eyebrow: 'Dados pessoais', title: 'Agora, seus dados básicos', subtitle: 'Só pedimos o necessário para seguir com a simulação real.', cta: 'Continuar' },
  { id: 'residence', eyebrow: 'Cadastro', title: 'Nascimento e endereço', subtitle: 'Completamos o cadastro com o que o provedor realmente exige.', cta: 'Continuar' },
  { id: 'review', eyebrow: 'Revisão final', title: 'Revise antes de buscar ofertas', subtitle: 'Confira os dados e inicie a análise das ofertas disponíveis.', cta: 'Buscar ofertas' }
];

const initialData = (initialAmount = 10000) => ({
  intention: { requestedAmount: initialAmount, installments: 24, productType: 'loan' },
  financial: { income: 5000, employmentStatus: '', scoreRange: '', hasRestriction: null },
  personal: { fullName: '', cpf: '', phone: '', email: '', birthDate: '', mothersName: '', gender: '', maritalStatus: '', educationalLevel: '' },
  residence: { birthCity: '', birthState: '', address: '', number: '', district: '', city: '', state: '', zipCode: '' },
  termsAccepted: false
});

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const digits = (value = '') => String(value).replace(/\D/g, '');
const trim = (value = '') => value.trim().replace(/\s+/g, ' ');
const formatCurrency = (value = 0) => Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const parseCurrencyInput = (value = '') => {
  const numeric = digits(value);
  if (!numeric) return '';
  return clamp(parseInt(numeric, 10) / 100, MIN_AMOUNT, MAX_AMOUNT);
};
const formatCurrencyInput = (value = '') => (value === '' ? '' : formatCurrency(value));
const validEmail = (value = '') => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const validPhone = (value = '') => [10, 11].includes(digits(value).length);
const validZip = (value = '') => digits(value).length === 8;
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
  for (let index = 0; index < 9; index += 1) sum += Number(cpf[index]) * (10 - index);
  let rest = (sum * 10) % 11;
  if (rest === 10) rest = 0;
  if (rest !== Number(cpf[9])) return false;
  sum = 0;
  for (let index = 0; index < 10; index += 1) sum += Number(cpf[index]) * (11 - index);
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
  try {
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY) || 'null');
  } catch {
    return null;
  }
};
const writeStored = (value) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {}
};
const clearStored = () => {
  if (typeof window !== 'undefined') window.localStorage.removeItem(STORAGE_KEY);
};

const Field = ({ label, hint, error, children }) => (
  <div className="space-y-2">
    <div className="flex items-center justify-between gap-3">
      <p className="text-sm font-medium text-foreground">{label}</p>
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
    {children}
    {error ? <p className="text-xs text-rose-600">{error}</p> : null}
  </div>
);

const SegmentedOption = ({ active, onClick, title, copy }) => (
  <button
    type="button"
    onClick={onClick}
    className={`rounded-2xl border px-4 py-4 text-left transition-all ${active ? 'border-primary bg-primary/5 shadow-[0_8px_24px_rgba(37,99,235,0.10)]' : 'border-border bg-white hover:border-primary/30 hover:bg-background-secondary'}`}
  >
    <p className="text-sm font-semibold text-foreground">{title}</p>
    {copy ? <p className="mt-1 text-xs leading-5 text-muted-foreground">{copy}</p> : null}
  </button>
);

export function SimulationModal({ isOpen, onClose, initialAmount = 10000 }) {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [data, setData] = useState(() => ({ ...initialData(initialAmount), ...(readStored() || {}) }));
  const [amountInput, setAmountInput] = useState(formatCurrencyInput(initialAmount));
  const [incomeInput, setIncomeInput] = useState(formatCurrencyInput(5000));
  const current = STEPS[step];

  useEffect(() => {
    writeStored(data);
  }, [data]);

  useEffect(() => {
    setAmountInput(formatCurrencyInput(data.intention.requestedAmount));
  }, [data.intention.requestedAmount]);

  useEffect(() => {
    setIncomeInput(formatCurrencyInput(data.financial.income));
  }, [data.financial.income]);

  useEffect(() => {
    if (!isOpen) return;
    const stored = readStored();
    const nextData = { ...initialData(initialAmount), ...(stored || {}) };
    nextData.intention = {
      ...initialData(initialAmount).intention,
      ...(stored?.intention || {}),
      requestedAmount: stored?.intention?.requestedAmount || initialAmount
    };
    nextData.financial = { ...initialData(initialAmount).financial, ...(stored?.financial || {}) };
    setStep(0);
    setIsSubmitting(false);
    setData(nextData);
    setAmountInput(formatCurrencyInput(nextData.intention.requestedAmount));
    setIncomeInput(formatCurrencyInput(nextData.financial.income));
    simulationFunnelService.start({
      sourcePage: window.location.pathname,
      productType: 'loan',
      amount: nextData.intention.requestedAmount,
      utm: Object.fromEntries(new URLSearchParams(window.location.search).entries())
    });
  }, [initialAmount, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    simulationFunnelService.progress({
      sourcePage: window.location.pathname,
      productType: data.intention.productType,
      funnelStep: current.id,
      amount: data.intention.requestedAmount,
      score: data.financial.scoreRange,
      utm: Object.fromEntries(new URLSearchParams(window.location.search).entries()),
      metadata: { installments: data.intention.installments }
    });
  }, [current.id, data.financial.scoreRange, data.intention.installments, data.intention.productType, data.intention.requestedAmount, isOpen]);

  const setSection = (section, field, value) => {
    setData((previous) => ({
      ...previous,
      [section]: {
        ...previous[section],
        [field]: value
      }
    }));
  };

  const intentionErrors = {
    requestedAmount:
      data.intention.requestedAmount < MIN_AMOUNT || data.intention.requestedAmount > MAX_AMOUNT
        ? `Escolha um valor entre ${formatCurrency(MIN_AMOUNT)} e ${formatCurrency(MAX_AMOUNT)}.`
        : '',
    installments:
      data.intention.installments < MIN_INSTALLMENTS || data.intention.installments > MAX_INSTALLMENTS
        ? `Escolha um prazo entre ${MIN_INSTALLMENTS}x e ${MAX_INSTALLMENTS}x.`
        : ''
  };
  const financialErrors = {
    income: data.financial.income < MIN_INCOME ? `Informe uma renda a partir de ${formatCurrency(MIN_INCOME)}.` : '',
    employmentStatus: data.financial.employmentStatus ? '' : 'Selecione sua situação profissional.',
    scoreRange: data.financial.scoreRange ? '' : 'Selecione a faixa de score.',
    hasRestriction: typeof data.financial.hasRestriction === 'boolean' ? '' : 'Informe se há restrição no nome.'
  };
  const personalErrors = {
    fullName: trim(data.personal.fullName).length >= 3 ? '' : 'Informe seu nome completo.',
    cpf: validCpf(data.personal.cpf) ? '' : 'Digite um CPF válido.',
    phone: validPhone(data.personal.phone) ? '' : 'Digite um telefone válido com DDD.',
    email: validEmail(data.personal.email) ? '' : 'Digite um e-mail válido.',
    birthDate: validDate(data.personal.birthDate) ? '' : 'Digite uma data de nascimento válida.',
    mothersName: trim(data.personal.mothersName).length >= 3 ? '' : 'Informe o nome da sua mãe.',
    gender: data.personal.gender ? '' : 'Selecione o gênero.',
    maritalStatus: data.personal.maritalStatus ? '' : 'Selecione o estado civil.',
    educationalLevel: data.personal.educationalLevel ? '' : 'Selecione a escolaridade.'
  };
  const residenceErrors = {
    birthCity: trim(data.residence.birthCity).length >= 2 ? '' : 'Informe a cidade de nascimento.',
    birthState: data.residence.birthState ? '' : 'Selecione o estado de nascimento.',
    address: trim(data.residence.address).length >= 4 ? '' : 'Informe o endereço.',
    number: trim(data.residence.number).length >= 1 ? '' : 'Informe o número.',
    district: trim(data.residence.district).length >= 2 ? '' : 'Informe o bairro.',
    city: trim(data.residence.city).length >= 2 ? '' : 'Informe a cidade.',
    state: data.residence.state ? '' : 'Selecione o estado.',
    zipCode: validZip(data.residence.zipCode) ? '' : 'Digite um CEP válido.'
  };

  const intentionValid = !Object.values(intentionErrors).some(Boolean);
  const financialValid = !Object.values(financialErrors).some(Boolean);
  const personalValid = !Object.values(personalErrors).some(Boolean);
  const residenceValid = !Object.values(residenceErrors).some(Boolean);
  const reviewValid = data.termsAccepted && intentionValid && financialValid && personalValid && residenceValid;
  const validations = [intentionValid, financialValid, personalValid, residenceValid, reviewValid];

  const primaryHint = useMemo(() => {
    if (step === 0) return 'Valor e prazo podem ser ajustados a qualquer momento.';
    if (step === 1) return 'Quanto mais preciso o perfil, melhor a ordenação das ofertas.';
    if (step === 2) return 'Seus dados ficam protegidos e seguem para a API apenas no backend.';
    if (step === 3) return 'Esses dados são exigidos pelo provedor para simulação real.';
    return 'Revise tudo antes de seguir para as ofertas.';
  }, [step]);

  const review = useMemo(
    () => [
      ['Valor desejado', formatCurrency(data.intention.requestedAmount)],
      ['Parcelas', `${data.intention.installments}x`],
      ['Renda', formatCurrency(data.financial.income)],
      ['Nome', data.personal.fullName || '--'],
      ['CPF', maskedCpf(data.personal.cpf) || '--'],
      ['Telefone', data.personal.phone || '--'],
      ['E-mail', data.personal.email || '--'],
      [
        'Endereço',
        [
          data.residence.address && `${data.residence.address}, ${data.residence.number}`,
          data.residence.district,
          data.residence.city && `${data.residence.city}/${data.residence.state}`
        ]
          .filter(Boolean)
          .join(' · ') || '--'
      ]
    ],
    [data]
  );

  const handleAmountChange = (value) => {
    const parsed = parseCurrencyInput(value);
    setAmountInput(value === '' ? '' : formatCurrencyInput(parsed));
    if (parsed !== '') setSection('intention', 'requestedAmount', parsed);
  };

  const handleAmountBlur = () => {
    const parsed = parseCurrencyInput(amountInput);
    const next = parsed === '' ? MIN_AMOUNT : parsed;
    setSection('intention', 'requestedAmount', next);
    setAmountInput(formatCurrencyInput(next));
  };

  const handleIncomeChange = (value) => {
    const numeric = digits(value);
    if (!numeric) {
      setIncomeInput('');
      return;
    }
    const next = clamp(parseInt(numeric, 10) / 100, MIN_INCOME, MAX_INCOME);
    setIncomeInput(formatCurrencyInput(next));
    setSection('financial', 'income', next);
  };

  const handleIncomeBlur = () => {
    const normalized = digits(incomeInput)
      ? clamp(parseInt(digits(incomeInput), 10) / 100, MIN_INCOME, MAX_INCOME)
      : MIN_INCOME;
    setSection('financial', 'income', normalized);
    setIncomeInput(formatCurrencyInput(normalized));
  };

  const nextStep = () => {
    if (!validations[step]) {
      toast.error('Revise os campos destacados para continuar.');
      return;
    }
    setStep((currentStep) => Math.min(currentStep + 1, STEPS.length - 1));
  };

  const previousStep = () => setStep((currentStep) => Math.max(currentStep - 1, 0));

  const submit = async () => {
    if (!reviewValid) {
      toast.error('Confirme os dados e aceite os termos para continuar.');
      return;
    }

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
      toast.error(error.message || 'Não foi possível concluir a simulação agora.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex max-h-[92vh] w-[calc(100vw-1.5rem)] max-w-[880px] flex-col overflow-hidden border border-border bg-white p-0 shadow-[0_24px_80px_rgba(15,23,42,0.18)]">
        <DialogTitle className="sr-only">Simulação de crédito</DialogTitle>
        <DialogDescription className="sr-only">Preencha seus dados para visualizar ofertas personalizadas.</DialogDescription>

        <div className="border-b border-border bg-[linear-gradient(135deg,#f8fafc_0%,#ffffff_60%,#f7f3ec_100%)] px-5 py-4 sm:px-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="rounded-full border border-primary/15 bg-primary/5 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
                  {current.eyebrow}
                </span>
                <span className="text-xs font-medium text-muted-foreground">Passo {step + 1} de {STEPS.length}</span>
              </div>
              <div className="mt-3 flex items-center gap-3">
                {step > 0 ? (
                  <button
                    type="button"
                    onClick={previousStep}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-white text-muted-foreground transition-colors hover:bg-background-secondary hover:text-foreground"
                    aria-label="Voltar"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                ) : null}
                <div className="min-w-0">
                  <h2 className="text-xl font-semibold tracking-[-0.03em] text-foreground sm:text-2xl">{current.title}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{current.subtitle}</p>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-white text-muted-foreground transition-colors hover:bg-background-secondary hover:text-foreground"
              aria-label="Fechar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
              <span className="min-w-0 truncate">{primaryHint}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-border">
              <div className="h-full rounded-full bg-foreground transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-28 pt-4 sm:px-6 sm:pb-20 sm:pt-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={current.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="space-y-5"
            >
              {current.id === 'intention' ? (
                <div className="space-y-5">
                  <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                    <div className="rounded-3xl border border-border bg-white p-4 sm:p-5">
                      <Field label="Valor desejado" hint={`De ${formatCurrency(MIN_AMOUNT)} a ${formatCurrency(MAX_AMOUNT)}`} error={intentionErrors.requestedAmount}>
                        <Input
                          inputMode="numeric"
                          value={amountInput}
                          onChange={(event) => handleAmountChange(event.target.value)}
                          onBlur={handleAmountBlur}
                          className="h-14 rounded-2xl border-border bg-background-secondary text-2xl font-semibold tracking-[-0.03em] text-foreground sm:h-16 sm:text-3xl"
                        />
                      </Field>
                      <div className="mt-4">
                        <Slider
                          value={[data.intention.requestedAmount]}
                          onValueChange={(value) => setSection('intention', 'requestedAmount', value[0])}
                          min={MIN_AMOUNT}
                          max={MAX_AMOUNT}
                          step={500}
                          className="py-2"
                          trackClassName="h-2"
                          thumbClassName="h-6 w-6 sm:h-5 sm:w-5"
                        />
                        <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                          <span>{formatCurrency(MIN_AMOUNT)}</span>
                          <span>{formatCurrency(MAX_AMOUNT)}</span>
                        </div>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {QUICK_AMOUNTS.map((value) => (
                          <button
                            key={value}
                            type="button"
                            onClick={() => setSection('intention', 'requestedAmount', value)}
                            className={`min-h-[44px] rounded-full border px-4 text-sm font-medium transition-colors ${
                              data.intention.requestedAmount === value
                                ? 'border-primary bg-primary/10 text-primary'
                                : 'border-border bg-white text-muted-foreground hover:border-primary/25 hover:text-foreground'
                            }`}
                          >
                            {formatCurrency(value)}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-3xl border border-border bg-white p-4 sm:p-5">
                      <Field label="Prazo" hint={`De ${MIN_INSTALLMENTS}x a ${MAX_INSTALLMENTS}x`} error={intentionErrors.installments}>
                        <div className="flex items-center justify-between rounded-2xl border border-border bg-background-secondary px-4 py-3">
                          <p className="text-sm text-muted-foreground">Parcelas</p>
                          <p className="text-3xl font-semibold tracking-[-0.04em] text-foreground">{data.intention.installments}x</p>
                        </div>
                      </Field>
                      <div className="mt-4">
                        <Slider
                          value={[data.intention.installments]}
                          onValueChange={(value) => setSection('intention', 'installments', value[0])}
                          min={MIN_INSTALLMENTS}
                          max={MAX_INSTALLMENTS}
                          step={1}
                          className="py-2"
                          trackClassName="h-2"
                          thumbClassName="h-6 w-6 sm:h-5 sm:w-5"
                        />
                        <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                          <span>{MIN_INSTALLMENTS}x</span>
                          <span>{MAX_INSTALLMENTS}x</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}

              {current.id === 'financial' ? (
                <div className="space-y-5">
                  <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
                    <div className="rounded-3xl border border-border bg-background-secondary p-4 sm:p-5">
                      <Field label="Renda mensal" hint={`A partir de ${formatCurrency(MIN_INCOME)}`} error={financialErrors.income}>
                        <Input
                          inputMode="numeric"
                          value={incomeInput}
                          onChange={(event) => handleIncomeChange(event.target.value)}
                          onBlur={handleIncomeBlur}
                          className="h-14 rounded-2xl border-border bg-white text-xl font-semibold tracking-[-0.03em] text-foreground"
                        />
                      </Field>
                      <div className="mt-4">
                        <Slider
                          value={[data.financial.income]}
                          onValueChange={(value) => setSection('financial', 'income', value[0])}
                          min={MIN_INCOME}
                          max={MAX_INCOME}
                          step={500}
                          className="py-2"
                          trackClassName="h-2"
                          thumbClassName="h-6 w-6 sm:h-5 sm:w-5"
                        />
                        <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                          <span>{formatCurrency(MIN_INCOME)}</span>
                          <span>{formatCurrency(MAX_INCOME)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <Field label="Situação profissional" error={financialErrors.employmentStatus}>
                        <div className="grid grid-cols-2 gap-2 xl:grid-cols-3">
                          {JOBS.map((job) => (
                            <SegmentedOption
                              key={job.id}
                              active={data.financial.employmentStatus === job.id}
                              onClick={() => setSection('financial', 'employmentStatus', job.id)}
                              title={job.label}
                            />
                          ))}
                        </div>
                      </Field>
                      <Field label="Faixa de score" error={financialErrors.scoreRange}>
                        <div className="grid gap-2 sm:grid-cols-3">
                          {SCORES.map((score) => (
                            <SegmentedOption
                              key={score.id}
                              active={data.financial.scoreRange === score.id}
                              onClick={() => setSection('financial', 'scoreRange', score.id)}
                              title={score.title}
                              copy={score.copy}
                            />
                          ))}
                        </div>
                      </Field>
                    </div>
                  </div>
                  <Field label="Existe restrição no nome?" error={financialErrors.hasRestriction}>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {[
                        { value: false, title: 'Não', copy: 'Meu nome está regular.' },
                        { value: true, title: 'Sim', copy: 'Tenho alguma restrição.' }
                      ].map((item) => (
                        <SegmentedOption
                          key={String(item.value)}
                          active={data.financial.hasRestriction === item.value}
                          onClick={() => setSection('financial', 'hasRestriction', item.value)}
                          title={item.title}
                          copy={item.copy}
                        />
                      ))}
                    </div>
                  </Field>
                </div>
              ) : null}

              {current.id === 'personal' ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Nome completo" error={personalErrors.fullName}>
                    <Input placeholder="Seu nome completo" value={data.personal.fullName} onChange={(event) => setSection('personal', 'fullName', event.target.value)} className="h-12 rounded-2xl" />
                  </Field>
                  <Field label="CPF" error={personalErrors.cpf}>
                    <Input inputMode="numeric" placeholder="000.000.000-00" value={data.personal.cpf} onChange={(event) => setSection('personal', 'cpf', formatCpf(event.target.value))} className="h-12 rounded-2xl" />
                  </Field>
                  <Field label="Telefone" error={personalErrors.phone}>
                    <Input inputMode="tel" placeholder="(11) 99999-9999" value={data.personal.phone} onChange={(event) => setSection('personal', 'phone', formatPhone(event.target.value))} className="h-12 rounded-2xl" />
                  </Field>
                  <Field label="E-mail" error={personalErrors.email}>
                    <Input type="email" placeholder="voce@exemplo.com" value={data.personal.email} onChange={(event) => setSection('personal', 'email', event.target.value)} className="h-12 rounded-2xl" />
                  </Field>
                  <Field label="Data de nascimento" error={personalErrors.birthDate}>
                    <div className="relative">
                      <CalendarDays className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input inputMode="numeric" placeholder="dd/mm/aaaa" value={data.personal.birthDate} onChange={(event) => setSection('personal', 'birthDate', formatDate(event.target.value))} className="h-12 rounded-2xl pl-11" />
                    </div>
                  </Field>
                  <Field label="Nome da mãe" error={personalErrors.mothersName}>
                    <Input placeholder="Nome completo da sua mãe" value={data.personal.mothersName} onChange={(event) => setSection('personal', 'mothersName', event.target.value)} className="h-12 rounded-2xl" />
                  </Field>
                  <Field label="Gênero" error={personalErrors.gender}>
                    <Select value={data.personal.gender} onValueChange={(value) => setSection('personal', 'gender', value)}>
                      <SelectTrigger className="h-12 rounded-2xl"><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>{GENDERS.map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent>
                    </Select>
                  </Field>
                  <Field label="Estado civil" error={personalErrors.maritalStatus}>
                    <Select value={data.personal.maritalStatus} onValueChange={(value) => setSection('personal', 'maritalStatus', value)}>
                      <SelectTrigger className="h-12 rounded-2xl"><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>{MARITAL.map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent>
                    </Select>
                  </Field>
                  <div className="sm:col-span-2">
                    <Field label="Escolaridade" error={personalErrors.educationalLevel}>
                      <Select value={data.personal.educationalLevel} onValueChange={(value) => setSection('personal', 'educationalLevel', value)}>
                        <SelectTrigger className="h-12 rounded-2xl"><SelectValue placeholder="Selecione" /></SelectTrigger>
                        <SelectContent>{EDUCATION.map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent>
                      </Select>
                    </Field>
                  </div>
                </div>
              ) : null}

              {current.id === 'residence' ? (
                <div className="space-y-5">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Cidade de nascimento" error={residenceErrors.birthCity}>
                      <Input placeholder="Ex.: São Paulo" value={data.residence.birthCity} onChange={(event) => setSection('residence', 'birthCity', event.target.value)} className="h-12 rounded-2xl" />
                    </Field>
                    <Field label="Estado de nascimento" error={residenceErrors.birthState}>
                      <Select value={data.residence.birthState} onValueChange={(value) => setSection('residence', 'birthState', value)}>
                        <SelectTrigger className="h-12 rounded-2xl"><SelectValue placeholder="Selecione" /></SelectTrigger>
                        <SelectContent>{STATES.map((state) => <SelectItem key={state} value={state}>{state}</SelectItem>)}</SelectContent>
                      </Select>
                    </Field>
                  </div>

                  <div className="rounded-3xl border border-border bg-background-secondary p-4 sm:p-5">
                    <div className="mb-4 flex items-start gap-3">
                      <div className="rounded-full border border-border bg-white p-2"><Home className="h-4 w-4 text-foreground" /></div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">Endereço residencial</p>
                        <p className="text-sm text-muted-foreground">Informe o endereço onde você mora hoje.</p>
                      </div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="sm:col-span-2">
                        <Field label="Endereço" error={residenceErrors.address}>
                          <Input placeholder="Rua, avenida, alameda..." value={data.residence.address} onChange={(event) => setSection('residence', 'address', event.target.value)} className="h-12 rounded-2xl" />
                        </Field>
                      </div>
                      <Field label="Número" error={residenceErrors.number}>
                        <Input placeholder="123" value={data.residence.number} onChange={(event) => setSection('residence', 'number', event.target.value)} className="h-12 rounded-2xl" />
                      </Field>
                      <Field label="Bairro" error={residenceErrors.district}>
                        <Input placeholder="Seu bairro" value={data.residence.district} onChange={(event) => setSection('residence', 'district', event.target.value)} className="h-12 rounded-2xl" />
                      </Field>
                      <Field label="Cidade" error={residenceErrors.city}>
                        <Input placeholder="Sua cidade" value={data.residence.city} onChange={(event) => setSection('residence', 'city', event.target.value)} className="h-12 rounded-2xl" />
                      </Field>
                      <Field label="UF" error={residenceErrors.state}>
                        <Select value={data.residence.state} onValueChange={(value) => setSection('residence', 'state', value)}>
                          <SelectTrigger className="h-12 rounded-2xl"><SelectValue placeholder="Selecione" /></SelectTrigger>
                          <SelectContent>{STATES.map((state) => <SelectItem key={state} value={state}>{state}</SelectItem>)}</SelectContent>
                        </Select>
                      </Field>
                      <Field label="CEP" error={residenceErrors.zipCode}>
                        <Input inputMode="numeric" placeholder="00000-000" value={data.residence.zipCode} onChange={(event) => setSection('residence', 'zipCode', formatZip(event.target.value))} className="h-12 rounded-2xl" />
                      </Field>
                    </div>
                  </div>
                </div>
              ) : null}

              {current.id === 'review' ? (
                <div className="space-y-5">
                  <div className="rounded-3xl border border-border bg-white p-4 sm:p-5">
                    <div className="grid gap-3 sm:grid-cols-2">
                      {review.map(([label, value]) => (
                        <div key={label} className="rounded-2xl border border-border bg-background-secondary px-4 py-3">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
                          <p className="mt-1 text-sm font-semibold text-foreground">{value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-border bg-background-secondary p-4">
                    <div className="flex items-start gap-3">
                      <ShieldCheck className="mt-0.5 h-5 w-5 text-foreground" />
                      <p className="text-sm text-muted-foreground">Seus dados são enviados apenas para a API da Cote Juros. A integração com o provedor acontece somente no backend.</p>
                    </div>
                  </div>
                  <label className="flex items-start gap-3 rounded-2xl border border-border bg-white px-4 py-4 text-sm text-muted-foreground">
                    <Checkbox checked={data.termsAccepted} onCheckedChange={(checked) => setData((previous) => ({ ...previous, termsAccepted: Boolean(checked) }))} />
                    <span>Concordo com os Termos de Uso e Política de Privacidade para iniciar a análise das ofertas.</span>
                  </label>
                  {!data.termsAccepted ? <p className="text-xs text-rose-600">Aceite os termos para buscar as ofertas.</p> : null}
                </div>
              ) : null}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="sticky bottom-0 z-20 border-t border-border bg-white/95 px-4 py-3 backdrop-blur sm:px-6 sm:py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              {step < STEPS.length - 1
                ? 'Você pode voltar e ajustar qualquer etapa sem perder o que já preencheu.'
                : 'Tudo pronto. Agora vamos buscar as melhores ofertas para o seu perfil.'}
            </p>
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
              {step > 0 ? (
                <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={previousStep}>
                  Voltar
                </Button>
              ) : null}
              {step < STEPS.length - 1 ? (
                <Button type="button" className="w-full sm:w-auto" disabled={!validations[step]} onClick={nextStep}>
                  {current.cta} <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button type="button" className="w-full sm:w-auto" disabled={!reviewValid || isSubmitting} onClick={submit}>
                  {isSubmitting ? (
                    <>
                      <LoaderCircle className="h-4 w-4 animate-spin" /> Buscar ofertas
                    </>
                  ) : (
                    <>
                      Buscar ofertas <ArrowRight className="h-4 w-4" />
                    </>
                  )}
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
