
import React, { useState, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { banksData } from '@/data/banksData.js';
import { loansData } from '@/data/loansData.js';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Filter, Star, Clock, ShieldCheck, CheckCircle2, ChevronRight } from 'lucide-react';

function EmprestimosPage() {
  const [amount, setAmount] = useState([10000]);
  const [type, setType] = useState('Todos');
  const [score, setScore] = useState('Todos');
  const [term, setTerm] = useState([24]);
  const [sort, setSort] = useState('taxa-baixa');

  const filteredLoans = useMemo(() => {
    let result = loansData.filter(loan => {
      const matchValue = amount[0] >= loan.minValue && amount[0] <= loan.maxValue;
      const matchType = type === 'Todos' || loan.type === type;
      const matchScore = score === 'Todos' || loan.minScore === score || 
                         (score === 'Alto' && (loan.minScore === 'Médio' || loan.minScore === 'Baixo')) ||
                         (score === 'Médio' && loan.minScore === 'Baixo');
      const matchTerm = term[0] >= loan.minTerm && term[0] <= loan.maxTerm;
      
      return matchValue && matchType && matchScore && matchTerm;
    });

    if (sort === 'taxa-baixa') result.sort((a, b) => a.monthlyRate - b.monthlyRate);
    if (sort === 'valor-maximo') result.sort((a, b) => b.maxValue - a.maxValue);
    if (sort === 'prazo-maior') result.sort((a, b) => b.maxTerm - a.maxTerm);

    return result;
  }, [amount, type, score, term, sort]);

  const getBadgeStyle = (loanType, rate) => {
    if (rate < 2.0) return { icon: Star, text: 'Melhor taxa', color: 'bg-teal-100 text-teal-800 border-teal-200' };
    if (loanType === 'Negativado') return { icon: ShieldCheck, text: 'Sem consulta', color: 'bg-purple-100 text-purple-800 border-purple-200' };
    if (loanType === 'Pessoal') return { icon: CheckCircle2, text: 'Aprovação rápida', color: 'bg-green-100 text-green-800 border-green-200' };
    return { icon: CheckCircle2, text: 'Mais aprovado', color: 'bg-blue-100 text-blue-800 border-blue-200' };
  };

  const handleSimulate = (bankName) => {
    toast.success(`Redirecionando para a oferta do ${bankName}...`);
  };

  const resetFilters = () => {
    setAmount([10000]);
    setType('Todos');
    setScore('Todos');
    setTerm([24]);
    setSort('taxa-baixa');
  };

  return (
    <>
      <Helmet>
        <title>Comparador de Empréstimos - Cote Juros</title>
        <meta name="description" content="Compare as melhores taxas de empréstimos e encontre o crédito ideal." />
      </Helmet>

      <div className="bg-slate-50 border-b border-border py-12 lg:py-16 relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src="https://images.unsplash.com/photo-1583223527919-dfb0e34bd4e0?auto=format&fit=crop&w=2000&q=80" alt="Empréstimos bg" className="w-full h-full object-cover opacity-10 mix-blend-multiply grayscale" />
        </div>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4 text-foreground text-balance">Comparador de Empréstimos</h1>
          <p className="text-lg text-muted-foreground max-w-2xl font-medium">Filtre por taxas, prazos e valores. Encontre o crédito aprovado para o seu perfil em segundos.</p>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-12 gap-8">
          
          {/* Sidebar Filters */}
          <div className="lg:col-span-3 space-y-8">
            <div className="bg-white border rounded-[var(--radius-lg)] p-6 shadow-sm sticky top-24">
              <div className="flex items-center justify-between mb-6 border-b pb-4">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <Filter className="w-5 h-5 text-primary" /> Filtros
                </h3>
                <button onClick={resetFilters} className="text-sm text-muted-foreground hover:text-primary transition-colors">Limpar</button>
              </div>
              
              <div className="space-y-8">
                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <Label className="font-semibold text-foreground">Valor Desejado</Label>
                    <span className="font-bold text-primary text-lg font-variant-tabular">R$ {amount[0].toLocaleString('pt-BR')}</span>
                  </div>
                  <Slider value={amount} onValueChange={setAmount} max={500000} min={1000} step={1000} />
                </div>

                <div className="space-y-3">
                  <Label className="font-semibold text-foreground">Tipo de Crédito</Label>
                  <Select value={type} onValueChange={setType}>
                    <SelectTrigger className="bg-slate-50">
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Todos">Todos os tipos</SelectItem>
                      <SelectItem value="Pessoal">Pessoal</SelectItem>
                      <SelectItem value="Consignado">Consignado</SelectItem>
                      <SelectItem value="Garantia">Com Garantia</SelectItem>
                      <SelectItem value="Negativado">Para Negativado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <Label className="font-semibold text-foreground">Prazo (Meses)</Label>
                    <span className="font-bold text-primary font-variant-tabular">{term[0]}x</span>
                  </div>
                  <Slider value={term} onValueChange={setTerm} max={84} min={6} step={1} />
                </div>

                <div className="space-y-3">
                  <Label className="font-semibold text-foreground">Seu Score</Label>
                  <RadioGroup value={score} onValueChange={setScore} className="space-y-2">
                    {['Todos', 'Alto', 'Médio', 'Baixo'].map(s => (
                      <div key={s} className="flex items-center space-x-2">
                        <RadioGroupItem value={s} id={`score-${s}`} />
                        <Label htmlFor={`score-${s}`} className="font-medium cursor-pointer">{s === 'Todos' ? 'Não sei' : s}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                <Button className="w-full h-12 rounded-[var(--radius-md)] bg-primary text-white hover:bg-primary/90" onClick={() => toast.success('Filtros aplicados!')}>
                  Aplicar filtros
                </Button>
              </div>
            </div>
          </div>

          {/* Results Grid */}
          <div className="lg:col-span-9">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
              <p className="text-muted-foreground font-medium">
                Mostrando <span className="text-foreground font-bold">{filteredLoans.length}</span> ofertas encontradas
              </p>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <Label className="whitespace-nowrap font-medium">Ordenar:</Label>
                <Select value={sort} onValueChange={setSort}>
                  <SelectTrigger className="w-full sm:w-48 bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="taxa-baixa">Menor Taxa</SelectItem>
                    <SelectItem value="valor-maximo">Maior Valor</SelectItem>
                    <SelectItem value="prazo-maior">Maior Prazo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredLoans.map(loan => {
                const bank = banksData.find(b => b.id === loan.bankId);
                const badgeInfo = getBadgeStyle(loan.type, loan.monthlyRate);
                const BadgeIcon = badgeInfo.icon;
                
                return (
                  <Card key={loan.id} className="card-premium overflow-hidden group flex flex-col h-full bg-white relative pt-4">
                    <div className="absolute top-4 right-4">
                      <Badge className={`border px-2 py-1 flex items-center gap-1 font-semibold ${badgeInfo.color}`}>
                        <BadgeIcon className="w-3 h-3" /> {badgeInfo.text}
                      </Badge>
                    </div>

                    <CardContent className="p-6 flex flex-col h-full">
                      <div className="flex items-center gap-4 mb-6 pt-4">
                        <div className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold shadow-sm" style={{ backgroundColor: bank?.color, color: '#fff' }}>
                          {bank?.name.charAt(0)}
                        </div>
                        <div>
                          <h3 className="font-extrabold text-lg text-foreground leading-tight">{bank?.name}</h3>
                          <p className="text-sm text-muted-foreground font-medium">{loan.type}</p>
                        </div>
                      </div>

                      <div className="space-y-4 mb-8 flex-1">
                        <div>
                          <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Taxa de Juros</p>
                          <p className="text-3xl font-extrabold text-primary font-variant-tabular">
                            {loan.monthlyRate}% <span className="text-base font-semibold text-muted-foreground">a.m.</span>
                          </p>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                          <div>
                            <p className="text-xs font-semibold text-muted-foreground uppercase">Valor</p>
                            <p className="font-bold text-foreground text-sm">Até R$ {(loan.maxValue/1000).toFixed(0)}k</p>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1"><Clock className="w-3 h-3"/> Prazo</p>
                            <p className="font-bold text-foreground text-sm">Até {loan.maxTerm}m</p>
                          </div>
                        </div>
                      </div>

                      <Button 
                        className="w-full h-12 text-base font-bold gradient-fintech-hover border-0 shadow-[var(--shadow-sm)] mt-auto"
                        onClick={() => handleSimulate(bank?.name)}
                      >
                        Simular Oferta <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
            
            {filteredLoans.length === 0 && (
              <div className="text-center py-20 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                <Filter className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-foreground">Nenhuma oferta encontrada</h3>
                <p className="text-muted-foreground mt-2">Ajuste seus filtros para ver mais opções.</p>
                <Button variant="outline" className="mt-6" onClick={resetFilters}>Limpar todos os filtros</Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default EmprestimosPage;
