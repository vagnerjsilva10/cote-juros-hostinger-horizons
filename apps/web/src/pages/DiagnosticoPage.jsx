
import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { ArrowRight, CheckCircle2, ChevronLeft } from 'lucide-react';
import { simulationFunnelService } from '@/platform/services/simulationFunnelService.js';
import { redirectToFinanceAi } from '@/platform/integrations/coteFinanceAI.js';

function DiagnosticoPage() {
  const [step, setStep] = useState(1);
  const [data, setData] = useState({
    valor: 10000,
    renda: 5000,
    score: 'Médio',
    dividas: false,
    cpf: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [showOffers, setShowOffers] = useState(false);

  const nextStep = () => setStep(s => Math.min(s + 1, 5));
  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  const handleCpfChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 11) value = value.slice(0,11);
    if (value.length > 9) value = value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
    else if (value.length > 6) value = value.replace(/(\d{3})(\d{3})(\d{1,3})/, "$1.$2.$3");
    else if (value.length > 3) value = value.replace(/(\d{3})(\d{1,3})/, "$1.$2");
    setData({ ...data, cpf: value });
  };

  const submitDiagnostico = async () => {
    if (data.cpf.length !== 14) {
      toast.error('Por favor, insira um CPF válido.');
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
    toast.success(`Diagnóstico concluído com sucesso! Lead ${lead.id}`);
  };

  const renderOffers = () => {
    // Basic logic mapping based on rules
    let recomendedLoan = "Empréstimo Pessoal Itaú (Taxa 3.2% a.m)";
    let recomendCard = "Cartão Nubank (Sem Anuidade)";

    if (data.score === 'Alto' && !data.dividas) {
      recomendedLoan = "Empréstimo Consignado Caixa (Taxa 1.2% a.m)";
      recomendCard = "Itaú Personnalité Black";
    } else if (data.score === 'Baixo' || data.dividas) {
      recomendedLoan = "Empréstimo Garantia Inter (Taxa 1.8% a.m) ou Negativado";
      recomendCard = "Cartão de Crédito Pré-pago C6";
    }

    return (
      <motion.div initial={{ opacity:0, y: 20 }} animate={{ opacity:1, y:0 }} className="max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-3xl font-bold">Diagnóstico Concluído</h2>
          <p className="text-muted-foreground mt-2">Encontramos opções desenhadas para o seu perfil (Score {data.score}).</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="border-primary/30 shadow-md">
            <CardContent className="p-8 space-y-4">
              <div className="text-sm font-semibold uppercase tracking-wider text-primary">Recomendação de Crédito</div>
              <h3 className="text-2xl font-bold">{recomendedLoan}</h3>
              <p className="text-muted-foreground">Com base na sua renda de R$ {data.renda.toLocaleString()} e seu histórico, esta é a linha de crédito com melhor Custo Efetivo Total para R$ {data.valor.toLocaleString()}.</p>
              <Button className="w-full mt-4">Solicitar Crédito</Button>
            </CardContent>
          </Card>

          <Card className="border-secondary/30 shadow-md">
            <CardContent className="p-8 space-y-4">
              <div className="text-sm font-semibold uppercase tracking-wider text-secondary">Recomendação de Cartão</div>
              <h3 className="text-2xl font-bold">{recomendCard}</h3>
              <p className="text-muted-foreground">Seu perfil se alinha perfeitamente com os benefícios deste cartão. Altas chances de aprovação imediata.</p>
              <Button variant="secondary" className="w-full mt-4">Pedir Cartão</Button>
            </CardContent>
          </Card>
        </div>

        <div className="text-center pt-8">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
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
            <Button variant="outline" onClick={() => {setShowOffers(false); setStep(1);}}>Refazer Diagnóstico</Button>
          </div>
        </div>
      </motion.div>
    );
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Qual valor de crédito você precisa?</h2>
            <div className="text-4xl font-bold text-primary py-4">R$ {data.valor.toLocaleString('pt-BR')}</div>
            <Slider value={[data.valor]} onValueChange={v => setData({...data, valor: v[0]})} max={500000} min={1000} step={1000} />
            <Button className="w-full h-12 text-lg mt-8" onClick={nextStep}>Continuar <ArrowRight className="ml-2" /></Button>
          </div>
        );
      case 2:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Qual a sua renda mensal aproximada?</h2>
            <div className="text-4xl font-bold text-primary py-4">R$ {data.renda.toLocaleString('pt-BR')}</div>
            <Slider value={[data.renda]} onValueChange={v => setData({...data, renda: v[0]})} max={50000} min={1000} step={500} />
            <Button className="w-full h-12 text-lg mt-8" onClick={nextStep}>Continuar <ArrowRight className="ml-2" /></Button>
          </div>
        );
      case 3:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Qual seu score aproximado?</h2>
            <RadioGroup value={data.score} onValueChange={v => setData({...data, score: v})} className="space-y-3">
              {['Alto', 'Médio', 'Baixo'].map(s => (
                <div key={s} className={`border rounded-xl p-4 flex items-center space-x-3 cursor-pointer transition-colors ${data.score === s ? 'bg-primary/5 border-primary' : 'hover:bg-muted'}`} onClick={() => setData({...data, score: s})}>
                  <RadioGroupItem value={s} id={s} />
                  <Label htmlFor={s} className="flex-1 cursor-pointer font-medium text-lg">{s} {s==='Alto'?'(750-1000)':s==='Médio'?'(550-749)':'(0-549)'}</Label>
                </div>
              ))}
            </RadioGroup>
            <Button className="w-full h-12 text-lg mt-8" onClick={nextStep}>Continuar <ArrowRight className="ml-2" /></Button>
          </div>
        );
      case 4:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Você possui dívidas em aberto no momento?</h2>
            <div className="flex items-center justify-between p-6 border rounded-xl bg-card">
              <Label className="text-lg font-medium cursor-pointer" htmlFor="dividas">Tenho dívidas pendentes (Negativado)</Label>
              <Switch id="dividas" checked={data.dividas} onCheckedChange={c => setData({...data, dividas: c})} />
            </div>
            <Button className="w-full h-12 text-lg mt-8" onClick={nextStep}>Continuar <ArrowRight className="ml-2" /></Button>
          </div>
        );
      case 5:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Último passo: Informe seu CPF</h2>
            <p className="text-muted-foreground">Usamos seu CPF apenas para simular ofertas reais de forma segura. Não consultamos o Serasa neste momento.</p>
            <Input 
              className="h-14 text-xl text-center font-variant-tabular bg-background text-foreground" 
              placeholder="000.000.000-00" 
              value={data.cpf} 
              onChange={handleCpfChange} 
            />
            <Button 
              className="w-full h-14 text-lg mt-8 gradient-fintech text-white border-0" 
              onClick={submitDiagnostico}
              disabled={loading}
            >
              {loading ? 'Analisando perfil...' : 'Gerar Ofertas Personalizadas'}
            </Button>
          </div>
        );
      default: return null;
    }
  }

  return (
    <>
      <Helmet>
        <title>Diagnóstico Financeiro Inteligente - Cote Juros</title>
      </Helmet>

      <div className="min-h-[85vh] flex flex-col bg-muted/30 py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex-1 flex flex-col justify-center">
          
          {!showOffers ? (
            <div className="max-w-xl mx-auto w-full">
              <div className="mb-8">
                <div className="flex justify-between text-sm font-medium mb-2 text-muted-foreground">
                  <span>Passo {step} de 5</span>
                  <span>{step * 20}% Concluído</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
                  <div className="bg-primary h-2.5 transition-all duration-500 ease-in-out" style={{ width: `${step * 20}%` }}></div>
                </div>
              </div>

              <Card className="shadow-lg border-muted">
                <CardContent className="p-8 sm:p-12 relative">
                  {step > 1 && (
                    <button onClick={prevStep} className="absolute top-6 left-6 text-muted-foreground hover:text-foreground transition-colors" aria-label="Voltar">
                      <ChevronLeft className="w-6 h-6" />
                    </button>
                  )}
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={step}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                      className="pt-6"
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

