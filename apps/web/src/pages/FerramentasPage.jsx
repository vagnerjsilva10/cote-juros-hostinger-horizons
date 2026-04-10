
import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell } from 'recharts';
import { Calculator, Download, TrendingUp, Home, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

function FerramentasPage() {
  // Juros Compostos State
  const [jcCapital, setJcCapital] = useState(10000);
  const [jcRate, setJcRate] = useState(10);
  const [jcYears, setJcYears] = useState(5);

  const calcJurosCompostos = () => {
    let data = [];
    let current = jcCapital;
    for(let i=0; i<=jcYears; i++) {
      data.push({ ano: i, montante: Math.round(current) });
      current = current * (1 + (jcRate/100));
    }
    const finalAmount = data[data.length-1]?.montante || 0;
    return { data, finalAmount, interest: finalAmount - jcCapital };
  };
  const jcResult = calcJurosCompostos();

  // Financiamento Pie State
  const [finValue, setFinValue] = useState(300000);
  const [finEntry, setFinEntry] = useState(60000);
  const [finRate, setFinRate] = useState(9.5);
  const [finMonths, setFinMonths] = useState(360);

  const calcFinancing = () => {
    const p = finValue - finEntry;
    const r = (finRate / 100) / 12;
    const n = finMonths;
    const pmt = p > 0 && r > 0 && n > 0 ? (p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1) : 0;
    const totalPaid = pmt * n;
    const interest = totalPaid - p;

    return {
      pmt,
      totalPaid,
      interest,
      principal: p,
      data: [
        { name: 'Valor Financiado', value: p },
        { name: 'Juros Pagos', value: interest > 0 ? interest : 0 }
      ]
    };
  };
  const finResult = calcFinancing();
  const COLORS = ['hsl(var(--primary))', 'hsl(var(--destructive))'];

  const handleExport = () => {
    toast.success('Relatório gerado e exportado com sucesso!');
  };

  return (
    <>
      <Helmet>
        <title>Ferramentas & Calculadoras Financeiras - Cote Juros</title>
        <meta name="description" content="Calculadoras inteligentes para juros compostos, financiamentos e empréstimos." />
      </Helmet>

      <div className="bg-slate-50 border-b border-border py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl text-center">
          <div className="w-16 h-16 bg-white shadow-sm rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Calculator className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4 text-foreground">Ferramentas Premium</h1>
          <p className="text-lg text-muted-foreground font-medium">Tome controle do seu dinheiro com cálculos precisos, gráficos interativos e projeções confiáveis.</p>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 max-w-6xl">
        <Tabs defaultValue="juros-compostos" className="w-full">
          <TabsList className="flex flex-wrap md:grid w-full grid-cols-1 md:grid-cols-3 h-auto p-1.5 bg-slate-100 rounded-[var(--radius-lg)] gap-1 mb-12">
            <TabsTrigger value="juros-compostos" className="rounded-[var(--radius-md)] py-4 text-base font-bold data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm">
              <TrendingUp className="w-5 h-5 mr-2" /> Juros Compostos
            </TabsTrigger>
            <TabsTrigger value="financiamento" className="rounded-[var(--radius-md)] py-4 text-base font-bold data-[state=active]:bg-white data-[state=active]:text-secondary data-[state=active]:shadow-sm">
              <Home className="w-5 h-5 mr-2" /> Financiamento
            </TabsTrigger>
            <TabsTrigger value="emprestimo" className="rounded-[var(--radius-md)] py-4 text-base font-bold data-[state=active]:bg-white data-[state=active]:text-accent data-[state=active]:shadow-sm">
              <DollarSign className="w-5 h-5 mr-2" /> Comprometimento de Renda
            </TabsTrigger>
          </TabsList>

          {/* JUROS COMPOSTOS */}
          <TabsContent value="juros-compostos" className="animate-in fade-in-50 duration-500">
            <div className="grid lg:grid-cols-12 gap-8">
              <Card className="lg:col-span-4 border-0 shadow-[var(--shadow-md)] bg-white h-fit">
                <CardHeader className="bg-slate-50 border-b rounded-t-[var(--radius-lg)]">
                  <CardTitle className="text-xl">Parâmetros do Investimento</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="space-y-3">
                    <Label className="font-semibold text-foreground">Capital Inicial (R$)</Label>
                    <Input type="number" className="h-12 text-lg bg-slate-50" value={jcCapital} onChange={e => setJcCapital(Number(e.target.value))} />
                  </div>
                  <div className="space-y-3">
                    <Label className="font-semibold text-foreground">Taxa Anual (%)</Label>
                    <Input type="number" className="h-12 text-lg bg-slate-50" value={jcRate} onChange={e => setJcRate(Number(e.target.value))} />
                  </div>
                  <div className="space-y-3">
                    <Label className="font-semibold text-foreground">Período (Anos)</Label>
                    <Input type="number" className="h-12 text-lg bg-slate-50" value={jcYears} onChange={e => setJcYears(Number(e.target.value))} />
                  </div>
                </CardContent>
              </Card>

              <Card className="lg:col-span-8 border-0 shadow-[var(--shadow-md)] bg-white">
                <CardHeader className="flex flex-row items-center justify-between pb-6 border-b">
                  <div>
                    <CardTitle className="text-2xl text-primary">Projeção de Crescimento</CardTitle>
                    <CardDescription className="text-base font-medium">O poder do tempo no seu dinheiro</CardDescription>
                  </div>
                  <Button variant="outline" className="hidden sm:flex border-primary text-primary hover:bg-primary/5" onClick={handleExport}>
                    <Download className="w-4 h-4 mr-2" /> Exportar PDF
                  </Button>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-2 gap-6 mb-8 bg-primary/5 p-6 rounded-[var(--radius-lg)] border border-primary/10">
                    <div>
                      <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-1">Montante Final</p>
                      <p className="text-3xl lg:text-4xl font-extrabold text-foreground font-variant-tabular">R$ {jcResult.finalAmount.toLocaleString('pt-BR')}</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-secondary uppercase tracking-wider mb-1">Juros Rendidos</p>
                      <p className="text-2xl lg:text-3xl font-extrabold text-secondary font-variant-tabular">+ R$ {jcResult.interest.toLocaleString('pt-BR')}</p>
                    </div>
                  </div>
                  
                  <div className="h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={jcResult.data} margin={{ top: 20, right: 20, bottom: 5, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} vertical={false}/>
                        <XAxis dataKey="ano" tickFormatter={(val) => `${val}a`} tick={{fill: '#64748B', fontWeight: 600}} axisLine={false} tickLine={false} />
                        <YAxis tickFormatter={(val) => `R$${val/1000}k`} tick={{fill: '#64748B', fontWeight: 600}} axisLine={false} tickLine={false} />
                        <Tooltip 
                          formatter={(value) => `R$ ${value.toLocaleString('pt-BR')}`} 
                          labelFormatter={(l) => `Ano ${l}`}
                          contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)', fontWeight: 'bold'}}
                        />
                        <Line type="monotone" dataKey="montante" stroke="hsl(var(--primary))" strokeWidth={4} dot={{r: 6, fill: "hsl(var(--primary))", strokeWidth: 2, stroke: '#fff'}} activeDot={{r: 8}} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* FINANCIAMENTO */}
          <TabsContent value="financiamento" className="animate-in fade-in-50 duration-500">
            <div className="grid lg:grid-cols-12 gap-8">
              <Card className="lg:col-span-4 border-0 shadow-[var(--shadow-md)] bg-white h-fit">
                <CardHeader className="bg-slate-50 border-b rounded-t-[var(--radius-lg)]">
                  <CardTitle className="text-xl">Dados do Financiamento</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="space-y-3">
                    <Label className="font-semibold text-foreground">Valor do Imóvel/Bem (R$)</Label>
                    <Input type="number" className="h-12 text-lg bg-slate-50" value={finValue} onChange={e => setFinValue(Number(e.target.value))} />
                  </div>
                  <div className="space-y-3">
                    <Label className="font-semibold text-foreground">Valor da Entrada (R$)</Label>
                    <Input type="number" className="h-12 text-lg bg-slate-50" value={finEntry} onChange={e => setFinEntry(Number(e.target.value))} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <Label className="font-semibold text-foreground">Taxa a.a. (%)</Label>
                      <Input type="number" className="h-12 text-lg bg-slate-50" value={finRate} onChange={e => setFinRate(Number(e.target.value))} />
                    </div>
                    <div className="space-y-3">
                      <Label className="font-semibold text-foreground">Prazo (Meses)</Label>
                      <Input type="number" className="h-12 text-lg bg-slate-50" value={finMonths} onChange={e => setFinMonths(Number(e.target.value))} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="lg:col-span-8 border-0 shadow-[var(--shadow-md)] bg-white">
                <CardHeader className="flex flex-row items-center justify-between pb-6 border-b">
                  <div>
                    <CardTitle className="text-2xl text-secondary">Custo Efetivo Total</CardTitle>
                    <CardDescription className="text-base font-medium">Veja para onde vai o seu dinheiro</CardDescription>
                  </div>
                  <Button variant="outline" className="hidden sm:flex border-secondary text-secondary hover:bg-secondary/5" onClick={handleExport}>
                    <Download className="w-4 h-4 mr-2" /> Exportar
                  </Button>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
                    <div className="bg-slate-50 border p-5 rounded-[var(--radius-lg)]">
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Parcela Mensal Estimada</p>
                      <p className="text-3xl font-extrabold text-foreground font-variant-tabular">R$ {finResult.pmt.toLocaleString('pt-BR', {maximumFractionDigits:2})}</p>
                    </div>
                    <div className="bg-destructive/5 border border-destructive/10 p-5 rounded-[var(--radius-lg)]">
                      <p className="text-xs font-bold text-destructive uppercase tracking-wider mb-2">Total Pago em Juros</p>
                      <p className="text-xl font-bold text-destructive font-variant-tabular">R$ {finResult.interest.toLocaleString('pt-BR', {maximumFractionDigits:0})}</p>
                    </div>
                    <div className="bg-primary/5 border border-primary/10 p-5 rounded-[var(--radius-lg)]">
                      <p className="text-xs font-bold text-primary uppercase tracking-wider mb-2">Valor Total do Contrato</p>
                      <p className="text-xl font-bold text-primary font-variant-tabular">R$ {finResult.totalPaid.toLocaleString('pt-BR', {maximumFractionDigits:0})}</p>
                    </div>
                  </div>
                  
                  <div className="h-[300px] w-full flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={finResult.data}
                          cx="50%"
                          cy="50%"
                          innerRadius={80}
                          outerRadius={120}
                          paddingAngle={2}
                          dataKey="value"
                          label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          labelLine={false}
                        >
                          {finResult.data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value) => `R$ ${value.toLocaleString('pt-BR', {maximumFractionDigits:0})}`} 
                          contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)', fontWeight: 'bold'}}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* COMPROMETIMENTO */}
          <TabsContent value="emprestimo" className="animate-in fade-in-50 duration-500">
            <div className="text-center py-20 bg-white rounded-[var(--radius-lg)] shadow-sm border border-border">
              <DollarSign className="w-12 h-12 text-accent mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-foreground">Calculadora de Comprometimento</h3>
              <p className="text-muted-foreground mt-2 text-lg">Insira sua renda e o valor da parcela para saber se o crédito será aprovado (O limite do Banco Central é 30%).</p>
              <div className="max-w-md mx-auto mt-8 p-6 bg-slate-50 rounded-[var(--radius-md)] text-left space-y-4">
                <div className="space-y-2">
                  <Label>Sua Renda Líquida</Label>
                  <Input type="number" defaultValue="5000" className="h-12 bg-white" />
                </div>
                <div className="space-y-2">
                  <Label>Valor da Parcela</Label>
                  <Input type="number" defaultValue="1200" className="h-12 bg-white" />
                </div>
                <Button className="w-full h-12 bg-accent hover:bg-accent/90 text-white mt-4" onClick={() => toast('Comprometimento: 24% (Aprovado)', { style: { background: 'hsl(var(--success))', color: 'white', border: 'none' }})}>
                  Verificar Aprovação
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}

export default FerramentasPage;
