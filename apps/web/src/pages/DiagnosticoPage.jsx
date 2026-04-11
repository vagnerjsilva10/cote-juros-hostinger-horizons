import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, CheckCircle2, ChevronLeft } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { simulationFunnelService } from '@/platform/services/simulationFunnelService.js';
import { redirectToFinanceAi } from '@/platform/integrations/coteFinanceAI.js';

function DiagnosticoPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showOffers, setShowOffers] = useState(false);
  const [data, setData] = useState({
    valor: 10000,
    renda: 5000,
    score: 'Medio',
    dividas: false,
    cpf: ''
  });

  const nextStep = () => setStep((value) => Math.min(value + 1, 5));
  const prevStep = () => setStep((value) => Math.max(value - 1, 1));

  const handleCpfChange = (event) => {
    let value = event.target.value.replace(/\D/g, '').slice(0, 11);
    if (value.length > 9) value = value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    else if (value.length > 6) value = value.replace(/(\d{3})(\d{3})(\d{1,3})/, '$1.$2.$3');
    else if (value.length > 3) value = value.replace(/(\d{3})(\d{1,3})/, '$1.$2');
    setData((previous) => ({ ...previous, cpf: value }));
  };

  const submitDiagnostico = async () => {
    if (data.cpf.length !== 14) {
      toast.error('Insira um CPF válido.');
      return;
    }

    setLoading(true);
    const lead = await simulationFunnelService.submitLead({
      sourcePage: '/diagnostico-financeiro',
      productType: 'loan',
      amount: data.valor,
      income: data.renda,
      score: data.score,
      hasDebt: data.dividas,
      cpf: data.cpf,
      funnelStep: 'diagnostico_completed',
      utm: Object.fromEntries(new URLSearchParams(window.location.search).entries()),
      metadata: { flow: 'diagnostico' }
    });

    setLoading(false);
    setShowOffers(true);
    toast.success(`Diagnóstico concluído. Lead ${lead.id}.`);
  };

  const renderOffers = () => {
    let recommendedLoan = 'Empréstimo pessoal com faixa de custo intermediária';
    let recommendedCard = 'Cartão sem anuidade com maior aderência';

    if (data.score === 'Alto' && !data.dividas) {
      recommendedLoan = 'Linha com taxa mais competitiva para perfis premium';
      recommendedCard = 'Cartão com mais benefícios e maior chance de aprovação';
    } else if (data.score === 'Baixo' || data.dividas) {
      recommendedLoan = 'Linha voltada a renegociação ou crédito com garantia';
      recommendedCard = 'Cartão de entrada com critérios mais acessíveis';
    }

    return (
      <div className="mx-auto max-w-5xl space-y-8">
        <div className="text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-background-secondary">
            <CheckCircle2 className="h-6 w-6 text-foreground" />
          </div>
          <h2 className="mb-3">Diagnóstico concluído</h2>
          <p className="text-lg text-muted-foreground">Encontramos caminhos mais aderentes para o seu perfil atual.</p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <Card>
            <CardContent className="space-y-4 p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Crédito</p>
              <h3>{recommendedLoan}</h3>
              <p className="text-muted-foreground">
                Considerando renda, score e presença de dívidas, esta é a direção mais coerente para iniciar a comparação.
              </p>
              <Button className="w-full">Ver opções de crédito</Button>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-4 p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Cartão</p>
              <h3>{recommendedCard}</h3>
              <p className="text-muted-foreground">
                A leitura combina apetite de aprovação com menor complexidade visual para a próxima etapa.
              </p>
              <Button variant="outline" className="w-full">Ver opções de cartão</Button>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button
            onClick={() =>
              redirectToFinanceAi({
                sourcePage: '/diagnostico-financeiro',
                productType: 'loan',
                campaign: 'diagnostico_to_ai',
                search: window.location.search,
                simulationContext: { amount: data.valor, score: data.score }
              })
            }
          >
            Continuar no Cote Finance AI
          </Button>
          <Button variant="outline" onClick={() => { setShowOffers(false); setStep(1); }}>
            Refazer diagnóstico
          </Button>
        </div>
      </div>
    );
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <h3>Qual valor de crédito você precisa?</h3>
            <p className="text-4xl font-semibold tracking-[-0.04em] text-foreground">R$ {data.valor.toLocaleString('pt-BR')}</p>
            <Slider value={[data.valor]} onValueChange={(value) => setData((previous) => ({ ...previous, valor: value[0] }))} max={500000} min={1000} step={1000} />
            <Button className="w-full" onClick={nextStep}>Continuar <ArrowRight className="h-4 w-4" /></Button>
          </div>
        );
      case 2:
        return (
          <div className="space-y-6">
            <h3>Qual a sua renda mensal aproximada?</h3>
            <p className="text-4xl font-semibold tracking-[-0.04em] text-foreground">R$ {data.renda.toLocaleString('pt-BR')}</p>
            <Slider value={[data.renda]} onValueChange={(value) => setData((previous) => ({ ...previous, renda: value[0] }))} max={50000} min={1000} step={500} />
            <Button className="w-full" onClick={nextStep}>Continuar <ArrowRight className="h-4 w-4" /></Button>
          </div>
        );
      case 3:
        return (
          <div className="space-y-6">
            <h3>Qual score mais combina com o seu momento?</h3>
            <RadioGroup value={data.score} onValueChange={(value) => setData((previous) => ({ ...previous, score: value }))} className="space-y-3">
              {['Alto', 'Medio', 'Baixo'].map((item) => (
                <label key={item} className={`flex items-center gap-3 rounded-[12px] border px-4 py-4 transition-colors ${data.score === item ? 'border-foreground bg-background-secondary' : 'border-border hover:bg-background-secondary'}`}>
                  <RadioGroupItem value={item} />
                  <span className="text-sm text-foreground">{item === 'Medio' ? 'Médio' : item}</span>
                </label>
              ))}
            </RadioGroup>
            <Button className="w-full" onClick={nextStep}>Continuar <ArrowRight className="h-4 w-4" /></Button>
          </div>
        );
      case 4:
        return (
          <div className="space-y-6">
            <h3>Você possui dívidas em aberto?</h3>
            <div className="flex items-center justify-between rounded-[12px] border border-border bg-background-secondary px-5 py-4">
              <Label htmlFor="dividas" className="text-base text-foreground">Tenho dívidas pendentes</Label>
              <Switch id="dividas" checked={data.dividas} onCheckedChange={(checked) => setData((previous) => ({ ...previous, dividas: checked }))} />
            </div>
            <Button className="w-full" onClick={nextStep}>Continuar <ArrowRight className="h-4 w-4" /></Button>
          </div>
        );
      case 5:
        return (
          <div className="space-y-6">
            <h3>Último passo: informe seu CPF</h3>
            <p className="text-muted-foreground">Usamos esse dado para aproximar as ofertas do seu contexto, com mais clareza no próximo passo.</p>
            <Input
              className="h-14 text-center text-xl font-semibold tracking-[0.08em]"
              placeholder="000.000.000-00"
              value={data.cpf}
              onChange={handleCpfChange}
            />
            <Button className="w-full" disabled={loading} onClick={submitDiagnostico}>
              {loading ? 'Analisando...' : 'Gerar leitura personalizada'}
            </Button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <Helmet>
        <title>Diagnóstico financeiro - Cote Juros</title>
      </Helmet>

      <div className="min-h-[85vh] bg-background-secondary py-16">
        <div className="page-shell">
          {!showOffers ? (
            <div className="mx-auto max-w-xl">
              <div className="mb-6 flex items-center justify-between text-sm text-muted-foreground">
                <span>Passo {step} de 5</span>
                <span>{step * 20}% concluído</span>
              </div>
              <div className="mb-8 h-1.5 w-full rounded-full bg-border">
                <div className="h-1.5 rounded-full bg-foreground transition-all duration-300" style={{ width: `${step * 20}%` }} />
              </div>

              <Card>
                <CardContent className="relative p-10">
                  {step > 1 ? (
                    <button type="button" onClick={prevStep} className="absolute left-6 top-6 rounded-full border border-border p-2 text-muted-foreground hover:bg-background-secondary hover:text-foreground">
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                  ) : null}

                  <AnimatePresence mode="wait">
                    <motion.div
                      key={step}
                      initial={{ opacity: 0, x: 12 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -12 }}
                      transition={{ duration: 0.2, ease: 'easeOut' }}
                      className="pt-4"
                    >
                      {renderStep()}
                    </motion.div>
                  </AnimatePresence>
                </CardContent>
              </Card>
            </div>
          ) : (
            renderOffers()
          )}
        </div>
      </div>
    </>
  );
}

export default DiagnosticoPage;
