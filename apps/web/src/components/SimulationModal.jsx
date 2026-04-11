
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowRight, ChevronLeft, ShieldCheck, CheckCircle2, XCircle, Briefcase, User, Building2, GraduationCap, UserMinus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { simulationFunnelService } from '@/platform/services/simulationFunnelService.js';

export function SimulationModal({ isOpen, onClose, initialAmount = 10000 }) {
  const [step, setStep] = useState(1);
  const [data, setData] = useState({
    valor: initialAmount,
    renda: 5000,
    emprego: '',
    score: '',
    restricao: null,
    cpf: '',
    terms: false
  });
  
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      setData(prev => ({ ...prev, valor: initialAmount }));
      setStep(1);
      simulationFunnelService.start({
        sourcePage: window.location.pathname,
        productType: 'loan',
        amount: initialAmount,
        utm: Object.fromEntries(new URLSearchParams(window.location.search).entries())
      });
    }
  }, [isOpen, initialAmount]);

  useEffect(() => {
    if (!isOpen) return;
    simulationFunnelService.progress({
      sourcePage: window.location.pathname,
      productType: 'loan',
      funnelStep: step,
      amount: data.valor,
      score: data.score
    });
  }, [step, data.valor, data.score, isOpen]);

  const handleNext = () => setStep(s => Math.min(s + 1, 6));
  const handlePrev = () => setStep(s => Math.max(s - 1, 1));

  const formatCPF = (val) => {
    let v = val.replace(/\D/g, '').slice(0, 11);
    if (v.length > 9) v = v.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
    else if (v.length > 6) v = v.replace(/(\d{3})(\d{3})(\d{1,3})/, "$1.$2.$3");
    else if (v.length > 3) v = v.replace(/(\d{3})(\d{1,3})/, "$1.$2");
    setData({ ...data, cpf: v });
  };

  const handleComplete = async () => {
    const lead = await simulationFunnelService.submitLead({
      sourcePage: window.location.pathname,
      productType: 'loan',
      amount: data.valor,
      income: data.renda,
      score: data.score,
      hasDebt: data.restricao,
      employmentType: data.emprego,
      cpf: data.cpf,
      funnelStep: 'completed',
      utm: Object.fromEntries(new URLSearchParams(window.location.search).entries()),
      metadata: { modal: 'simulation' }
    });

    onClose();
    navigate(`/emprestimos?lead_id=${lead.id}`);
  };

  const employmentTypes = [
    { id: 'CLT', icon: Briefcase },
    { id: 'PJ', icon: Building2 },
    { id: 'Autônomo', icon: User },
    { id: 'Aposentado', icon: GraduationCap },
    { id: 'Desempregado', icon: UserMinus }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-xl p-0 overflow-hidden bg-white border-0 rounded-[16px] shadow-2xl">
        <DialogTitle className="sr-only">Simulação Financeira</DialogTitle>
        <DialogDescription className="sr-only">Preencha seus dados para receber ofertas.</DialogDescription>
        
        <div className="bg-slate-50 px-6 py-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            {step > 1 && (
              <button onClick={handlePrev} className="text-slate-600 hover:text-primary interactive-element">
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            <span className="font-semibold text-sm uppercase tracking-wider text-slate-600">
              Passo {step} de 6
            </span>
          </div>
          <div className="flex gap-1">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className={`h-1.5 w-6 rounded-full ${i <= step ? 'bg-primary' : 'bg-slate-200'} transition-colors duration-300`} />
            ))}
          </div>
        </div>

        <div className="p-8 sm:p-12 relative min-h-[450px] flex flex-col justify-center bg-white">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="w-full"
            >
              {step === 1 && (
                <div className="space-y-8">
                  <div className="text-center space-y-2">
                    <h2 className="text-3xl font-bold text-foreground">Qual valor você precisa?</h2>
                    <p className="text-slate-600">Deslize para escolher o valor ideal.</p>
                  </div>
                  <div className="text-5xl font-bold text-primary text-center py-6 font-variant-tabular">
                    R$ {data.valor.toLocaleString('pt-BR')}
                  </div>
                  <Slider 
                    value={[data.valor]} 
                    onValueChange={v => setData({...data, valor: v[0]})} 
                    max={500000} 
                    min={1000} 
                    step={1000} 
                    className="py-4"
                  />
                  <Button className="w-full h-14 text-lg rounded-xl gradient-fintech-hover border-0 text-white shadow-premium" onClick={handleNext}>
                    Próximo <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-8">
                  <div className="text-center space-y-2">
                    <h2 className="text-3xl font-bold text-foreground">Qual sua renda mensal?</h2>
                    <p className="text-slate-600">Isso nos ajuda a encontrar parcelas que cabem no seu bolso.</p>
                  </div>
                  <div className="text-5xl font-bold text-primary text-center py-6 font-variant-tabular">
                    R$ {data.renda.toLocaleString('pt-BR')}
                  </div>
                  <Slider 
                    value={[data.renda]} 
                    onValueChange={v => setData({...data, renda: v[0]})} 
                    max={50000} 
                    min={1000} 
                    step={500} 
                    className="py-4"
                  />
                  <Button className="w-full h-14 text-lg rounded-xl gradient-fintech-hover border-0 text-white shadow-premium" onClick={handleNext}>
                    Próximo <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-8">
                  <div className="text-center space-y-2">
                    <h2 className="text-3xl font-bold text-foreground">Qual seu tipo de vínculo?</h2>
                    <p className="text-slate-600">Selecione sua principal fonte de renda.</p>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {employmentTypes.map(emp => (
                      <div 
                        key={emp.id} 
                        onClick={() => { setData({...data, emprego: emp.id}); setTimeout(handleNext, 300); }}
                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 flex flex-col items-center gap-2 text-center ${data.emprego === emp.id ? 'ring-2 ring-primary border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-slate-50'}`}
                      >
                        <emp.icon className={`w-6 h-6 ${data.emprego === emp.id ? 'text-primary' : 'text-slate-600'}`} />
                        <span className="font-semibold text-sm text-foreground">{emp.id}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-8">
                  <div className="text-center space-y-2">
                    <h2 className="text-3xl font-bold text-foreground">Qual seu score aproximado?</h2>
                    <p className="text-slate-600">Sua pontuação nos birôs de crédito.</p>
                  </div>
                  <div className="grid gap-4">
                    {[
                      { id: 'Baixo', range: '300-549', desc: 'Dificuldade em aprovar crédito', color: 'border-slate-200 hover:border-primary hover:bg-slate-50' },
                      { id: 'Médio', range: '550-749', desc: 'Aprovação com taxas médias', color: 'border-slate-200 hover:border-primary hover:bg-slate-50' },
                      { id: 'Alto', range: '750-1000', desc: 'Melhores taxas do mercado', color: 'border-slate-200 hover:border-primary hover:bg-slate-50' }
                    ].map(s => (
                      <div 
                        key={s.id} 
                        onClick={() => { setData({...data, score: s.id}); setTimeout(handleNext, 300); }}
                        className={`p-5 rounded-xl border-2 cursor-pointer transition-all duration-200 flex justify-between items-center ${data.score === s.id ? 'ring-2 ring-primary border-primary bg-primary/5' : s.color}`}
                      >
                        <div>
                          <p className="font-bold text-lg text-foreground">{s.id} <span className="text-sm font-normal text-slate-600 ml-2">({s.range})</span></p>
                          <p className="text-sm text-slate-600">{s.desc}</p>
                        </div>
                        {data.score === s.id && <CheckCircle2 className="text-primary w-6 h-6" />}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {step === 5 && (
                <div className="space-y-8">
                  <div className="text-center space-y-2">
                    <h2 className="text-3xl font-bold text-foreground">Possui restrição no nome?</h2>
                    <p className="text-slate-600">Contas atrasadas ou nome negativado.</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div 
                      onClick={() => { setData({...data, restricao: true}); setTimeout(handleNext, 300); }}
                      className={`p-8 rounded-xl border-2 cursor-pointer transition-all duration-200 text-center flex flex-col items-center gap-3 ${data.restricao === true ? 'ring-2 ring-primary border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-slate-50'}`}
                    >
                      <XCircle className={`w-10 h-10 ${data.restricao === true ? 'text-primary' : 'text-slate-600'}`} />
                      <span className="font-bold text-lg text-foreground">Sim</span>
                    </div>
                    <div 
                      onClick={() => { setData({...data, restricao: false}); setTimeout(handleNext, 300); }}
                      className={`p-8 rounded-xl border-2 cursor-pointer transition-all duration-200 text-center flex flex-col items-center gap-3 ${data.restricao === false ? 'ring-2 ring-primary border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-slate-50'}`}
                    >
                      <CheckCircle2 className={`w-10 h-10 ${data.restricao === false ? 'text-primary' : 'text-slate-600'}`} />
                      <span className="font-bold text-lg text-foreground">Não</span>
                    </div>
                  </div>
                </div>
              )}

              {step === 6 && (
                <div className="space-y-8">
                  <div className="text-center space-y-2">
                    <h2 className="text-3xl font-bold text-foreground">Quase lá!</h2>
                    <p className="text-slate-600">Insira seu CPF para ver ofertas personalizadas.</p>
                  </div>
                  
                  <div className="space-y-4">
                    <Input 
                      placeholder="000.000.000-00" 
                      value={data.cpf}
                      onChange={(e) => formatCPF(e.target.value)}
                      className="h-16 text-2xl text-center font-bold tracking-wider rounded-xl bg-slate-50 text-foreground border-border focus-visible:ring-primary"
                    />
                    
                    <div className="bg-blue-50 p-4 rounded-xl flex items-start gap-3 border border-blue-100">
                      <ShieldCheck className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-blue-900 leading-relaxed font-medium">
                        Seu CPF será usado apenas para consultar ofertas de crédito. Não fazemos consultas que reduzam seu Score (Soft Query).
                      </p>
                    </div>

                    <div className="flex items-center space-x-2 pt-2">
                      <Checkbox 
                        id="terms" 
                        checked={data.terms} 
                        onCheckedChange={(c) => setData({...data, terms: c})} 
                      />
                      <label htmlFor="terms" className="text-sm font-medium leading-none text-slate-600 cursor-pointer">
                        Concordo com os Termos de Uso e Política de Privacidade.
                      </label>
                    </div>
                  </div>

                  <Button 
                    className="w-full h-14 text-lg rounded-xl gradient-fintech-hover border-0 text-white shadow-premium" 
                    disabled={data.cpf.length !== 14 || !data.terms}
                    onClick={handleComplete}
                  >
                    Ver ofertas personalizadas <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default SimulationModal;

