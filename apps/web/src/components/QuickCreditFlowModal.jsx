import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { portalApi } from '@/platform/services/portalApi.js';
import { trackingService } from '@/platform/services/trackingService.js';
import { calculateQuickCreditProfile, resolveQuickCreditPartner } from '@/lib/quickCreditRouting.js';
import { partnerRedirectService } from '@/platform/services/partnerRedirectService.js';

const EMPLOYMENT_OPTIONS = [
  { value: 'CLT', label: 'CLT' },
  { value: 'Autonomo', label: 'Autônomo' },
  { value: 'Aposentado', label: 'Aposentado' },
  { value: 'Empresario', label: 'Empresário' },
  { value: 'Desempregado', label: 'Desempregado' }
];

const formatCurrencyInput = (value = '') => {
  const digits = String(value || '').replace(/\D/g, '');
  if (!digits) return '';
  return (parseInt(digits, 10) / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
};

const parseCurrency = (value = '') => {
  const digits = String(value || '').replace(/\D/g, '');
  return digits ? parseInt(digits, 10) / 100 : 0;
};

const formatPhone = (value = '') => {
  let next = String(value || '').replace(/\D/g, '').slice(0, 11);
  if (next.length > 10) next = next.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  else if (next.length > 6) next = next.replace(/(\d{2})(\d{4,5})(\d{1,4})/, '($1) $2-$3');
  else if (next.length > 2) next = next.replace(/(\d{2})(\d{1,5})/, '($1) $2');
  return next;
};

const emptyForm = {
  amount: 'R$ 10.000,00',
  income: 'R$ 5.000,00',
  hasRestriction: '',
  employmentStatus: '',
  fullName: '',
  phone: ''
};

export function QuickCreditFlowModal({ isOpen, onClose, sourcePage = '/', originLabel = 'credito' }) {
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setForm(emptyForm);
    setIsSubmitting(false);
  }, [isOpen]);

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const isValid =
    parseCurrency(form.amount) >= 1000 &&
    parseCurrency(form.income) >= 1000 &&
    typeof form.hasRestriction === 'string' &&
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
      const utm = Object.fromEntries(new URLSearchParams(window.location.search).entries());

      await trackingService.trackCtaClick({
        sourcePage,
        ctaId: `quick_credit_flow_${originLabel}`,
        ctaLabel: 'Ver minhas opções agora',
        productType: 'loan',
        utm
      });

      const quickCreditPayload = {
        sourcePage,
        productType: 'loan',
        amount: parseCurrency(form.amount),
        income: parseCurrency(form.income),
        hasDebt: form.hasRestriction === 'yes',
        employmentType: form.employmentStatus,
        fullName: form.fullName.trim(),
        phone: form.phone.replace(/\D/g, ''),
        originLabel,
        utm
      };

      const backendJourney = await portalApi.startQuickCreditJourney(quickCreditPayload);

      if (backendJourney?.lead?.id) {
        onClose();
        navigate('/proxima-etapa', {
          state: {
            leadResult: {
              leadId: backendJourney.lead.id,
              partnerId: backendJourney.partner?.id || backendJourney.lead.partnerId,
              partnerName: backendJourney.partner?.name || backendJourney.lead.partnerName,
              profile: backendJourney.profile || backendJourney.lead.profile,
              deliveryMode: backendJourney.deliveryMode || backendJourney.lead.deliveryMode,
              redirectUrl: backendJourney.redirectUrl || backendJourney.lead.redirectUrl || '',
              status: backendJourney.status || backendJourney.lead.status,
              sentAt: backendJourney.sentAt || backendJourney.lead.updatedAt || backendJourney.lead.createdAt
            }
          }
        });
        return;
      }

      const profile = calculateQuickCreditProfile({
        income: parseCurrency(form.income),
        hasRestriction: form.hasRestriction === 'yes',
        employmentStatus: form.employmentStatus
      });
      const partner = resolveQuickCreditPartner(profile);

      const lead = await portalApi.createQuickCreditLead({
        ...quickCreditPayload,
        profile,
        partnerId: partner.id,
        partnerName: partner.name,
        deliveryMode: partner.mode,
        originLabel,
        status: partner.mode === 'mock_api' ? 'qualified' : 'sent',
        utm
      });

      let redirectUrl = '';
      if (partner.mode === 'tracking_link') {
        const redirect = await partnerRedirectService.create({
          partnerId: partner.id,
          sourcePage,
          destinationUrl: partner.destinationUrl,
          productType: 'loan',
          utm
        });
        redirectUrl = redirect?.resolvedUrl || '';
        await portalApi.updateQuickCreditLead(lead.id, {
          redirectUrl,
          status: 'sent'
        });
      } else {
        await portalApi.submitMockPartnerLead({
          partnerId: partner.id,
          leadId: lead.id,
          sourcePage,
          productType: 'loan',
          profile
        });
        await portalApi.updateQuickCreditLead(lead.id, {
          status: 'qualified'
        });
      }

      onClose();
      navigate('/proxima-etapa', {
        state: {
          leadResult: {
            leadId: lead?.id || null,
            partnerId: partner.id,
            partnerName: partner.name,
            profile,
            deliveryMode: partner.mode,
            redirectUrl,
            status: partner.mode === 'mock_api' ? 'qualified' : 'sent',
            sentAt: new Date().toISOString()
          }
        }
      });
    } catch (error) {
      toast.error(error.message || 'Não foi possível continuar agora.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="hero-modal-shell w-[calc(100vw-1rem)] max-w-[780px] overflow-hidden rounded-[24px] border border-slate-200 bg-white p-0 shadow-[0_28px_76px_rgba(15,23,42,0.18)]">
        <DialogTitle className="sr-only">Veja suas opções com mais clareza</DialogTitle>
        <DialogDescription className="sr-only">Preencha o básico para continuar. Sem cobrança antecipada.</DialogDescription>

        <div className="hero-modal-top border-b border-slate-200 px-5 py-4 sm:px-6 sm:py-[1.125rem]">
          <span className="inline-flex rounded-full border border-primary/15 bg-primary/[0.05] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
            Crédito com clareza
          </span>
          <h2 className="mt-3 max-w-xl text-[1.5rem] font-semibold tracking-[-0.04em] text-slate-950 sm:text-[1.7rem]">
            Veja suas opções com mais clareza
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">
            Preencha o básico para continuar. Sem cobrança antecipada.
          </p>
        </div>

        <div className="max-h-[68vh] overflow-y-auto px-5 py-4 sm:px-6">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Valor</Label>
              <Input
                value={form.amount}
                onChange={(event) => updateField('amount', formatCurrencyInput(event.target.value))}
                placeholder="R$ 10.000,00"
                className="hero-modal-input h-11 rounded-[14px]"
              />
            </div>
            <div className="space-y-2">
              <Label>Renda</Label>
              <Input
                value={form.income}
                onChange={(event) => updateField('income', formatCurrencyInput(event.target.value))}
                placeholder="R$ 5.000,00"
                className="hero-modal-input h-11 rounded-[14px]"
              />
            </div>

            <div className="space-y-2">
              <Label>Negativado</Label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'yes', label: 'Sim' },
                  { value: 'no', label: 'Não' }
                ].map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => updateField('hasRestriction', item.value)}
                    className={`hero-modal-choice h-11 rounded-[14px] border text-sm font-medium transition-all ${
                      form.hasRestriction === item.value
                        ? 'border-primary bg-primary text-white shadow-[0_10px_24px_rgba(37,99,235,0.18)]'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-primary/30 hover:bg-slate-50'
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
                <SelectTrigger className="hero-modal-input h-11 rounded-[14px]">
                  <SelectValue placeholder="Escolha uma opção" />
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
                className="hero-modal-input h-11 rounded-[14px]"
              />
            </div>
            <div className="space-y-2">
              <Label>Telefone</Label>
              <Input
                value={form.phone}
                onChange={(event) => updateField('phone', formatPhone(event.target.value))}
                placeholder="(11) 99999-9999"
                className="hero-modal-input h-11 rounded-[14px]"
              />
            </div>
          </div>
        </div>

        <div className="border-t border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] px-5 py-3.5 sm:px-6">
          <div className="flex flex-col gap-3">
            <div className="rounded-[16px] border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                <p className="text-sm leading-6 text-slate-600">
                  A Cote Juros não é banco. Nosso papel é mostrar opções para você comparar antes de contratar.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-slate-900">Você preenche o básico e segue com mais clareza.</p>
                <p className="text-xs leading-6 text-slate-500">Sem compromisso e sem cobrança antecipada.</p>
              </div>
              <Button
                className="hero-modal-cta h-11 rounded-[14px] px-6 text-sm font-semibold text-white"
                disabled={!isValid || isSubmitting}
                onClick={handleSubmit}
              >
                {isSubmitting ? 'Buscando opções...' : 'Ver minhas opções agora'}
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
