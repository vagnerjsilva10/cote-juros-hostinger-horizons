import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRight,
  Briefcase,
  Building2,
  CheckCircle2,
  ChevronLeft,
  LoaderCircle,
  Mail,
  Phone,
  ShieldCheck,
  User,
  UserMinus,
  Wallet,
  XCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { simulationFunnelService } from '@/platform/services/simulationFunnelService.js';

export function SimulationModal({ isOpen, onClose, initialAmount = 10000 }) {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [data, setData] = useState({
    valor: initialAmount,
    parcelas: 24,
    renda: 5000,
    emprego: '',
    score: '',
    restricao: null,
    nome: '',
    cpf: '',
    telefone: '',
    email: '',
    terms: false
  });

  const navigate = useNavigate();

  useEffect(() => {
    if (!isOpen) return;

    setStep(1);
    setIsSubmitting(false);
    setData((previous) => ({
      ...previous,
      valor: initialAmount,
      parcelas: previous.parcelas || 24
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
      productType: 'loan',
      funnelStep: step,
      amount: data.valor,
      score: data.score,
      utm: Object.fromEntries(new URLSearchParams(window.location.search).entries()),
      metadata: {
        installments: data.parcelas
      }
    });
  }, [data.parcelas, data.score, data.valor, isOpen, step]);

  const employmentTypes = [
    { id: 'CLT', icon: Briefcase },
    { id: 'PJ', icon: Building2 },
    { id: 'Autônomo', icon: User },
    { id: 'Aposentado', icon: Wallet },
    { id: 'Desempregado', icon: UserMinus }
  ];

  const nextStep = () => setStep((current) => Math.min(current + 1, 7));
  const prevStep = () => setStep((current) => Math.max(current - 1, 1));

  const formatCPF = (value) => {
    let next = value.replace(/\D/g, '').slice(0, 11);
    if (next.length > 9) next = next.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    else if (next.length > 6) next = next.replace(/(\d{3})(\d{3})(\d{1,3})/, '$1.$2.$3');
    else if (next.length > 3) next = next.replace(/(\d{3})(\d{1,3})/, '$1.$2');
    setData((previous) => ({ ...previous, cpf: next }));
  };

  const formatPhone = (value) => {
    let next = value.replace(/\D/g, '').slice(0, 11);
    if (next.length > 10) next = next.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    else if (next.length > 6) next = next.replace(/(\d{2})(\d{4,5})(\d{1,4})/, '($1) $2-$3');
    else if (next.length > 2) next = next.replace(/(\d{2})(\d{1,5})/, '($1) $2');
    setData((previous) => ({ ...previous, telefone: next }));
  };

  const isIdentityStepValid =
    data.nome.trim().length >= 3 &&
    data.cpf.length === 14 &&
    data.telefone.replace(/\D/g, '').length >= 10 &&
    /\S+@\S+\.\S+/.test(data.email) &&
    data.terms;

  const handleComplete = async () => {
    try {
      setIsSubmitting(true);

      const utm = Object.fromEntries(new URLSearchParams(window.location.search).entries());
      const result = await simulationFunnelService.runCreditJourney({
        sourcePage: window.location.pathname,
        productType: 'loan',
        requestedAmount: data.valor,
        installments: data.parcelas,
        fullName: data.nome,
        cpf: data.cpf,
        phone: data.telefone,
        email: data.email,
        income: data.renda,
        scoreRange: data.score,
        hasRestriction: data.restricao,
        employmentStatus: data.emprego,
        utm
      });

      onClose();
      navigate(`/emprestimos?credit_simulation_id=${result.simulation.id}`, {
        state: {
          creditJourney: result
        }
      });
    } catch (error) {
      toast.error(error.message || 'Não foi possível concluir a simulação agora.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const stepTitle = [
    'Valor desejado',
    'Prazo ideal',
    'Renda mensal',
    'Vínculo principal',
    'Faixa de score',
    'Restrição no nome',
    'Dados finais'
  ];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl overflow-hidden border border-border bg-white p-0">
        <DialogTitle className="sr-only">Simulação de crédito</DialogTitle>
        <DialogDescription className="sr-only">Preencha seus dados para visualizar ofertas personalizadas.</DialogDescription>

        <div className="border-b border-border bg-background-secondary px-6 py-5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {step > 1 ? (
                <button type="button" onClick={prevStep} className="rounded-full border border-border p-2 text-muted-foreground hover:bg-background hover:text-foreground">
                  <ChevronLeft className="h-4 w-4" />
                </button>
              ) : null}
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Passo {step} de 7</p>
                <p className="text-sm font-medium text-foreground">{stepTitle[step - 1]}</p>
              </div>
            </div>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5, 6, 7].map((item) => (
                <span
                  key={item}
                  className={`h-1.5 w-8 rounded-full transition-colors duration-200 ${item <= step ? 'bg-foreground' : 'bg-border'}`}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="min-h-[500px] px-8 py-10 sm:px-12">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="space-y-8"
            >
              {step === 1 ? (
                <>
                  <div className="space-y-3">
                    <h2 className="text-3xl font-semibold tracking-[-0.03em] text-foreground">Qual valor você quer comparar?</h2>
                    <p className="text-base text-muted-foreground">Comece pelo montante real para reduzir ruído nas ofertas seguintes.</p>
                  </div>
                  <div className="rounded-[16px] border border-border bg-background-secondary px-6 py-8 text-center">
                    <p className="text-4xl font-semibold tracking-[-0.04em] text-foreground">R$ {data.valor.toLocaleString('pt-BR')}</p>
                  </div>
                  <Slider value={[data.valor]} onValueChange={(value) => setData((previous) => ({ ...previous, valor: value[0] }))} max={500000} min={1000} step={1000} />
                  <Button size="lg" className="w-full" onClick={nextStep}>
                    Continuar <ArrowRight className="h-4 w-4" />
                  </Button>
                </>
              ) : null}

              {step === 2 ? (
                <>
                  <div className="space-y-3">
                    <h2 className="text-3xl font-semibold tracking-[-0.03em] text-foreground">Em quantas parcelas você pretende pagar?</h2>
                    <p className="text-base text-muted-foreground">Usamos essa referência para buscar ofertas mais próximas da sua necessidade.</p>
                  </div>
                  <div className="rounded-[16px] border border-border bg-background-secondary px-6 py-8 text-center">
                    <p className="text-4xl font-semibold tracking-[-0.04em] text-foreground">{data.parcelas}x</p>
                  </div>
                  <Slider value={[data.parcelas]} onValueChange={(value) => setData((previous) => ({ ...previous, parcelas: value[0] }))} max={84} min={3} step={1} />
                  <Button size="lg" className="w-full" onClick={nextStep}>
                    Continuar <ArrowRight className="h-4 w-4" />
                  </Button>
                </>
              ) : null}

              {step === 3 ? (
                <>
                  <div className="space-y-3">
                    <h2 className="text-3xl font-semibold tracking-[-0.03em] text-foreground">Qual é a sua renda mensal?</h2>
                    <p className="text-base text-muted-foreground">Usamos esse dado para priorizar ofertas mais compatíveis com o seu contexto.</p>
                  </div>
                  <div className="rounded-[16px] border border-border bg-background-secondary px-6 py-8 text-center">
                    <p className="text-4xl font-semibold tracking-[-0.04em] text-foreground">R$ {data.renda.toLocaleString('pt-BR')}</p>
                  </div>
                  <Slider value={[data.renda]} onValueChange={(value) => setData((previous) => ({ ...previous, renda: value[0] }))} max={50000} min={1000} step={500} />
                  <Button size="lg" className="w-full" onClick={nextStep}>
                    Continuar <ArrowRight className="h-4 w-4" />
                  </Button>
                </>
              ) : null}

              {step === 4 ? (
                <>
                  <div className="space-y-3">
                    <h2 className="text-3xl font-semibold tracking-[-0.03em] text-foreground">Como você recebe a maior parte da renda?</h2>
                    <p className="text-base text-muted-foreground">Uma seleção simples, direta e compatível com o funil atual.</p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {employmentTypes.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setData((previous) => ({ ...previous, emprego: item.id }));
                          setTimeout(nextStep, 180);
                        }}
                        className={`rounded-[12px] border p-5 text-left transition-all duration-200 ${
                          data.emprego === item.id ? 'border-foreground bg-background-secondary' : 'border-border bg-background hover:-translate-y-px hover:bg-background-secondary'
                        }`}
                      >
                        <item.icon className="mb-5 h-5 w-5 text-foreground" />
                        <p className="text-sm font-semibold text-foreground">{item.id}</p>
                      </button>
                    ))}
                  </div>
                </>
              ) : null}

              {step === 5 ? (
                <>
                  <div className="space-y-3">
                    <h2 className="text-3xl font-semibold tracking-[-0.03em] text-foreground">Qual faixa de score mais se aproxima do seu perfil?</h2>
                    <p className="text-base text-muted-foreground">A informação ajuda a ordenar as opções com mais clareza.</p>
                  </div>
                  <div className="grid gap-3">
                    {[
                      { id: 'Baixo', range: '300-549', copy: 'Perfil com aprovações mais restritas.' },
                      { id: 'Medio', range: '550-749', copy: 'Faixa intermediária com variação de custo.' },
                      { id: 'Alto', range: '750-1000', copy: 'Maior chance de taxas mais competitivas.' }
                    ].map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setData((previous) => ({ ...previous, score: item.id }));
                          setTimeout(nextStep, 180);
                        }}
                        className={`rounded-[12px] border p-5 text-left transition-all duration-200 ${
                          data.score === item.id ? 'border-foreground bg-background-secondary' : 'border-border bg-background hover:-translate-y-px hover:bg-background-secondary'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-lg font-semibold text-foreground">{item.id === 'Medio' ? 'Médio' : item.id}</p>
                            <p className="text-sm text-muted-foreground">{item.range}</p>
                            <p className="mt-2 text-sm text-muted-foreground">{item.copy}</p>
                          </div>
                          {data.score === item.id ? <CheckCircle2 className="h-5 w-5 text-foreground" /> : null}
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              ) : null}

              {step === 6 ? (
                <>
                  <div className="space-y-3">
                    <h2 className="text-3xl font-semibold tracking-[-0.03em] text-foreground">Existe alguma restrição em aberto?</h2>
                    <p className="text-base text-muted-foreground">Mantemos a pergunta objetiva para não criar atrito desnecessário.</p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {[
                      { value: true, label: 'Sim, existe restrição', icon: XCircle },
                      { value: false, label: 'Não, está regular', icon: CheckCircle2 }
                    ].map((item) => (
                      <button
                        key={String(item.value)}
                        type="button"
                        onClick={() => {
                          setData((previous) => ({ ...previous, restricao: item.value }));
                          setTimeout(nextStep, 180);
                        }}
                        className={`rounded-[12px] border p-6 text-left transition-all duration-200 ${
                          data.restricao === item.value ? 'border-foreground bg-background-secondary' : 'border-border bg-background hover:-translate-y-px hover:bg-background-secondary'
                        }`}
                      >
                        <item.icon className="mb-5 h-5 w-5 text-foreground" />
                        <p className="text-base font-semibold text-foreground">{item.label}</p>
                      </button>
                    ))}
                  </div>
                </>
              ) : null}

              {step === 7 ? (
                <>
                  <div className="space-y-3">
                    <h2 className="text-3xl font-semibold tracking-[-0.03em] text-foreground">Último passo para buscar suas ofertas.</h2>
                    <p className="text-base text-muted-foreground">Coletamos apenas os dados necessários para iniciar a jornada real de crédito no backend.</p>
                  </div>

                  <div className="space-y-4">
                    <Input
                      placeholder="Nome completo"
                      value={data.nome}
                      onChange={(event) => setData((previous) => ({ ...previous, nome: event.target.value }))}
                      className="h-14 text-base"
                    />

                    <Input
                      placeholder="000.000.000-00"
                      value={data.cpf}
                      onChange={(event) => formatCPF(event.target.value)}
                      className="h-14 text-base"
                    />

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="relative">
                        <Phone className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          placeholder="(11) 99999-9999"
                          value={data.telefone}
                          onChange={(event) => formatPhone(event.target.value)}
                          className="h-14 pl-11 text-base"
                        />
                      </div>

                      <div className="relative">
                        <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          type="email"
                          placeholder="voce@exemplo.com"
                          value={data.email}
                          onChange={(event) => setData((previous) => ({ ...previous, email: event.target.value }))}
                          className="h-14 pl-11 text-base"
                        />
                      </div>
                    </div>

                    <div className="rounded-[12px] border border-border bg-background-secondary p-4">
                      <div className="flex items-start gap-3">
                        <ShieldCheck className="mt-0.5 h-5 w-5 text-foreground" />
                        <p className="text-sm text-muted-foreground">
                          Seus dados são enviados apenas para a API da Cote Juros, que controla a integração com o provedor de crédito no backend.
                        </p>
                      </div>
                    </div>

                    <label className="flex items-center gap-3 text-sm text-muted-foreground">
                      <Checkbox
                        checked={data.terms}
                        onCheckedChange={(checked) => setData((previous) => ({ ...previous, terms: Boolean(checked) }))}
                      />
                      Concordo com os Termos de Uso e Política de Privacidade.
                    </label>
                  </div>

                  <Button size="lg" className="w-full" disabled={!isIdentityStepValid || isSubmitting} onClick={handleComplete}>
                    {isSubmitting ? (
                      <>
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                        Buscando ofertas
                      </>
                    ) : (
                      <>
                        Ver ofertas personalizadas <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                </>
              ) : null}
            </motion.div>
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default SimulationModal;
