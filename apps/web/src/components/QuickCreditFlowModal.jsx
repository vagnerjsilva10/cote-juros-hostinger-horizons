import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  formatCurrencyValue,
  formatPhoneValue,
  parseCurrencyValue,
  submitQuickCreditApplication
} from '@/lib/quickCreditSubmission.js';

const EMPLOYMENT_OPTIONS = [
  { value: 'CLT', label: 'CLT' },
  { value: 'Autonomo', label: 'Autonomo' },
  { value: 'Aposentado', label: 'Aposentado' },
  { value: 'Empresario', label: 'Empresario' },
  { value: 'Desempregado', label: 'Desempregado' }
];

const emptyForm = {
  amount: 'R$ 10.000,00',
  income: 'R$ 5.000,00',
  hasRestriction: '',
  employmentStatus: '',
  fullName: '',
  phone: ''
};

const mapInitialDataToForm = (data = {}) => ({
  amount: data.amount ? formatCurrencyValue(data.amount) : emptyForm.amount,
  income: data.income ? formatCurrencyValue(data.income) : emptyForm.income,
  hasRestriction:
    data.hasRestriction === true || data.hasDebt === true
      ? 'yes'
      : data.hasRestriction === false || data.hasDebt === false
        ? 'no'
        : emptyForm.hasRestriction,
  employmentStatus: data.employmentStatus || data.employmentType || emptyForm.employmentStatus,
  fullName: data.fullName || emptyForm.fullName,
  phone: data.phone ? formatPhoneValue(data.phone) : emptyForm.phone
});

export function QuickCreditFlowModal({ isOpen, onClose, sourcePage = '/', originLabel = 'credito', initialData = null }) {
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const hasInitialData = Boolean(initialData);

  useEffect(() => {
    if (!isOpen) return;
    setForm(initialData ? mapInitialDataToForm(initialData) : emptyForm);
    setIsSubmitting(false);
  }, [initialData, isOpen]);

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const isValid =
    parseCurrencyValue(form.amount) >= 1000 &&
    parseCurrencyValue(form.income) >= 1000 &&
    form.hasRestriction !== '' &&
    Boolean(form.employmentStatus) &&
    form.fullName.trim().length >= 3 &&
    form.phone.replace(/\D/g, '').length >= 10;

  const handleSubmit = async () => {
    if (!isValid) {
      toast.error('Preencha os campos para continuar.');
      return;
    }

    try {
      setIsSubmitting(true);
      const leadResult = await submitQuickCreditApplication({
        sourcePage,
        originLabel,
        ctaLabel: hasInitialData ? 'Continuar para comparar' : 'Ver minhas opcoes agora',
        leadData: {
          ...(initialData || {}),
          amount: parseCurrencyValue(form.amount),
          income: parseCurrencyValue(form.income),
          hasRestriction: form.hasRestriction === 'yes',
          employmentStatus: form.employmentStatus,
          fullName: form.fullName.trim(),
          phone: form.phone.replace(/\D/g, '')
        }
      });

      onClose();
      navigate('/resultado', { state: { leadResult } });
    } catch (error) {
      toast.error(error.message || 'Nao foi possivel continuar agora.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="hero-modal-shell w-[calc(100vw-1rem)] max-w-[760px] overflow-hidden rounded-[22px] border border-white/60 bg-white p-0 shadow-[0_28px_76px_rgba(15,23,42,0.22)]">
        <DialogTitle className="sr-only">Veja suas opcoes com mais clareza</DialogTitle>
        <DialogDescription className="sr-only">
          Revise seus dados para comparar opcoes. Sem cobranca antecipada.
        </DialogDescription>

        <div className="hero-modal-top border-b border-slate-200 px-5 py-4 sm:px-6">
          <span className="inline-flex rounded-full border border-[rgba(91,108,255,0.14)] bg-[rgba(91,108,255,0.06)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--brand-primary)]">
            Credito com clareza
          </span>
          <h2 className="mt-3 max-w-xl text-[1.45rem] font-medium tracking-[-0.028em] text-[#191F28] sm:text-[1.65rem]">
            {hasInitialData ? 'Revise seu perfil' : 'Veja suas opcoes com mais clareza'}
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">
            {hasInitialData
              ? 'Os dados do quiz ja estao aqui. Ajuste apenas se algo estiver errado.'
              : 'Preencha o basico para continuar. Sem cobranca antecipada.'}
          </p>
        </div>

        <div className="hero-modal-body max-h-[68vh] overflow-y-auto px-5 py-4 sm:px-6">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Valor</Label>
              <Input
                value={form.amount}
                onChange={(event) => updateField('amount', formatCurrencyValue(event.target.value))}
                placeholder="R$ 10.000,00"
                className="hero-modal-input h-[42px] rounded-[12px]"
              />
            </div>
            <div className="space-y-2">
              <Label>Renda</Label>
              <Input
                value={form.income}
                onChange={(event) => updateField('income', formatCurrencyValue(event.target.value))}
                placeholder="R$ 5.000,00"
                className="hero-modal-input h-[42px] rounded-[12px]"
              />
            </div>

            <div className="space-y-2">
              <Label>Negativado</Label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'yes', label: 'Sim' },
                  { value: 'no', label: 'Nao' }
                ].map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => updateField('hasRestriction', item.value)}
                    className={`hero-modal-choice h-[42px] rounded-[12px] border text-sm font-medium transition-all ${
                      form.hasRestriction === item.value
                        ? 'border-[rgba(91,108,255,0.2)] bg-[linear-gradient(180deg,#6070FF_0%,#5263FF_100%)] text-white shadow-none'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-[rgba(91,108,255,0.2)] hover:bg-slate-50'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Trabalho</Label>
              <Select value={form.employmentStatus} onValueChange={(value) => updateField('employmentStatus', value)}>
                <SelectTrigger className="hero-modal-input h-[42px] rounded-[12px]">
                  <SelectValue placeholder="Escolha uma opcao" />
                </SelectTrigger>
                <SelectContent>
                  {EMPLOYMENT_OPTIONS.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Nome</Label>
              <Input
                value={form.fullName}
                onChange={(event) => updateField('fullName', event.target.value)}
                placeholder="Como podemos te chamar?"
                className="hero-modal-input h-[42px] rounded-[12px]"
              />
            </div>
            <div className="space-y-2">
              <Label>Telefone</Label>
              <Input
                value={form.phone}
                onChange={(event) => updateField('phone', formatPhoneValue(event.target.value))}
                placeholder="(11) 99999-9999"
                className="hero-modal-input h-[42px] rounded-[12px]"
              />
            </div>
          </div>
        </div>

        <div className="hero-modal-footer border-t border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] px-5 py-3.5 sm:px-6">
          <div className="flex flex-col gap-3">
            <div className="rounded-[14px] border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[var(--brand-2)]" />
                <p className="text-sm leading-6 text-slate-600">
                  A Cote Juros nao e banco. Nosso papel e mostrar caminhos possiveis para voce comparar antes de contratar.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-slate-900">
                  {hasInitialData ? 'Voce segue sem preencher tudo de novo.' : 'Voce preenche o basico e segue com mais clareza.'}
                </p>
                <p className="text-xs leading-6 text-slate-500">Sem compromisso e sem cobranca antecipada.</p>
              </div>
              <Button
                className="hero-modal-cta h-[42px] rounded-[12px] px-6 text-[13px] font-semibold text-white"
                disabled={!isValid || isSubmitting}
                onClick={handleSubmit}
              >
                {isSubmitting ? 'Continuando...' : hasInitialData ? 'Continuar para comparar' : 'Ver minhas opcoes agora'}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default QuickCreditFlowModal;
