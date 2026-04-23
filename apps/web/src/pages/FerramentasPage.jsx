import React, { useState } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer, Line, LineChart, Tooltip, XAxis, YAxis } from 'recharts';
import { ArrowRight, Download, DollarSign, Home, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PageHero from '@/components/PageHero.jsx';
import SeoHead from '@/components/SeoHead.jsx';
import { brandPages, homeBreadcrumb } from '@/seo/brandSeo.js';

const formatCurrency = (value = 0, options = {}) =>
  Number(value || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
    ...options
  });

const parseCurrencyInput = (value = '') => {
  const digits = String(value).replace(/\D/g, '');
  return digits ? Number(digits) : 0;
};

function FerramentasPage() {
  const [jcCapital, setJcCapital] = useState(10000);
  const [jcRate, setJcRate] = useState(10);
  const [jcYears, setJcYears] = useState(5);

  const [finValue, setFinValue] = useState(300000);
  const [finEntry, setFinEntry] = useState(60000);
  const [finRate, setFinRate] = useState(9.5);
  const [finMonths, setFinMonths] = useState(360);
  const [incomeValue, setIncomeValue] = useState(5000);
  const [installmentValue, setInstallmentValue] = useState(1200);

  const calcJurosCompostos = () => {
    const data = [];
    let current = jcCapital;

    for (let year = 0; year <= jcYears; year += 1) {
      data.push({ ano: year, montante: Math.round(current) });
      current = current * (1 + jcRate / 100);
    }

    const finalAmount = data[data.length - 1]?.montante || 0;
    return { data, finalAmount, interest: finalAmount - jcCapital };
  };

  const calcFinancing = () => {
    const principal = finValue - finEntry;
    const monthlyRate = (finRate / 100) / 12;
    const months = finMonths;
    const installment = principal > 0 && monthlyRate > 0 && months > 0
      ? (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1)
      : 0;
    const totalPaid = installment * months;
    const interest = totalPaid - principal;

    return {
      installment,
      totalPaid,
      interest,
      data: [
        { name: 'Principal', value: principal },
        { name: 'Juros', value: Math.max(interest, 0) }
      ]
    };
  };

  const jcResult = calcJurosCompostos();
  const finResult = calcFinancing();
  const COLORS = ['#0F172A', '#D1D5DB'];

  const handleExport = () => {
    toast.success('Resumo exportado com sucesso.');
  };

  return (
    <>
      <SeoHead
        title={brandPages.ferramentas.title}
        description={brandPages.ferramentas.description}
        path={brandPages.ferramentas.path}
        breadcrumbs={[homeBreadcrumb, { name: 'Ferramentas', path: brandPages.ferramentas.path }]}
      />

      <PageHero
        breadcrumbs={[homeBreadcrumb, { name: 'Ferramentas', path: brandPages.ferramentas.path }]}
        eyebrow="Ferramentas"
        badge="Simule antes de decidir"
        title="Calculadoras simples para decidir com mais segurança."
        subtitle="Use calculadoras simples para entender quanto você realmente vai pagar em juros e parcelas antes de tomar uma decisão."
      >
        <div className="flex flex-col gap-3 sm:flex-row">
          <a href="#calculadoras-financeiras">
            <Button size="lg">
              Usar calculadoras
              <ArrowRight className="h-4 w-4" />
            </Button>
          </a>
          <a href="#juros-compostos">
            <Button size="lg" variant="outline" className="hero-secondary-btn">
              Ver simulações
            </Button>
          </a>
        </div>
      </PageHero>

      <div className="page-shell py-12" id="calculadoras-financeiras">
        <Tabs defaultValue="juros-compostos" className="w-full">
          <TabsList className="grid w-full grid-cols-1 gap-2 md:grid-cols-3">
            <TabsTrigger value="juros-compostos" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              Juros compostos
            </TabsTrigger>
            <TabsTrigger value="financiamento" className="gap-2">
              <Home className="h-4 w-4" />
              Financiamento
            </TabsTrigger>
            <TabsTrigger value="emprestimo" className="gap-2">
              <DollarSign className="h-4 w-4" />
              Comprometimento
            </TabsTrigger>
          </TabsList>

          <TabsContent value="juros-compostos" id="juros-compostos" className="mt-8">
            <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
              <Card>
                <CardHeader>
                  <CardTitle>Preencha os dados</CardTitle>
                  <CardDescription>Ajuste os valores e veja, de forma clara, como o resultado muda ao longo do tempo.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="space-y-2">
                    <Label>Capital inicial</Label>
                    <Input
                      type="text"
                      inputMode="numeric"
                      value={formatCurrency(jcCapital)}
                      onChange={(event) => setJcCapital(parseCurrencyInput(event.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Taxa anual (%)</Label>
                    <Input type="number" value={jcRate} onChange={(event) => setJcRate(Number(event.target.value))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Período (anos)</Label>
                    <Input type="number" value={jcYears} onChange={(event) => setJcYears(Number(event.target.value))} />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-col gap-4 border-b border-border sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle>Resultado da simulação</CardTitle>
                    <CardDescription>Entenda ano a ano quanto vira rendimento e quanto vira saldo final.</CardDescription>
                  </div>
                  <Button variant="outline" onClick={handleExport}>
                    <Download className="h-4 w-4" />
                    Exportar
                  </Button>
                </CardHeader>
                <CardContent className="space-y-8">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-[12px] border border-border bg-background-secondary p-5">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Montante final</p>
                      <p className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-foreground">{formatCurrency(jcResult.finalAmount)}</p>
                    </div>
                    <div className="rounded-[12px] border border-border bg-background-secondary p-5">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Juros acumulados</p>
                      <p className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-foreground">{formatCurrency(jcResult.interest)}</p>
                    </div>
                  </div>

                  <div className="h-[320px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={jcResult.data}>
                        <XAxis dataKey="ano" tick={{ fill: '#6B7280', fontSize: 12 }} axisLine={false} tickLine={false} />
                        <YAxis tickFormatter={(value) => formatCurrency(value)} tick={{ fill: '#6B7280', fontSize: 12 }} axisLine={false} tickLine={false} />
                        <Tooltip
                          formatter={(value) => formatCurrency(value)}
                          labelFormatter={(label) => `Ano ${label}`}
                          contentStyle={{ borderRadius: '12px', border: '1px solid #E5E7EB', boxShadow: '0 10px 30px rgba(15,23,42,0.08)' }}
                        />
                        <Line type="monotone" dataKey="montante" stroke="#0F172A" strokeWidth={3} dot={{ r: 4, fill: '#0F172A' }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="financiamento" className="mt-8">
            <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
              <Card>
                <CardHeader>
                  <CardTitle>Dados do financiamento</CardTitle>
                  <CardDescription>Informe entrada, taxa e prazo para descobrir se a parcela cabe no seu momento.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="space-y-2">
                    <Label>Valor do bem</Label>
                    <Input
                      type="text"
                      inputMode="numeric"
                      value={formatCurrency(finValue)}
                      onChange={(event) => setFinValue(parseCurrencyInput(event.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Entrada</Label>
                    <Input
                      type="text"
                      inputMode="numeric"
                      value={formatCurrency(finEntry)}
                      onChange={(event) => setFinEntry(parseCurrencyInput(event.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Taxa anual (%)</Label>
                    <Input type="number" value={finRate} onChange={(event) => setFinRate(Number(event.target.value))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Prazo (meses)</Label>
                    <Input type="number" value={finMonths} onChange={(event) => setFinMonths(Number(event.target.value))} />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-col gap-4 border-b border-border sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle>Quanto você paga no total</CardTitle>
                    <CardDescription>Veja de forma separada o valor financiado, os juros e o total que sai do seu bolso.</CardDescription>
                  </div>
                  <Button variant="outline" onClick={handleExport}>
                    <Download className="h-4 w-4" />
                    Exportar
                  </Button>
                </CardHeader>
                <CardContent className="space-y-8">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="rounded-[12px] border border-border bg-background-secondary p-5">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Parcela</p>
                      <p className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-foreground">
                        {formatCurrency(finResult.installment, { maximumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div className="rounded-[12px] border border-border bg-background-secondary p-5">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Juros</p>
                      <p className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-foreground">
                        {formatCurrency(finResult.interest)}
                      </p>
                    </div>
                    <div className="rounded-[12px] border border-border bg-background-secondary p-5">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Total</p>
                      <p className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-foreground">
                        {formatCurrency(finResult.totalPaid)}
                      </p>
                    </div>
                  </div>

                  <div className="h-[320px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={finResult.data}
                          cx="50%"
                          cy="50%"
                          innerRadius={78}
                          outerRadius={118}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {finResult.data.map((entry, index) => (
                            <Cell key={`${entry.name}-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value) => formatCurrency(value)}
                          contentStyle={{ borderRadius: '12px', border: '1px solid #E5E7EB', boxShadow: '0 10px 30px rgba(15,23,42,0.08)' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="emprestimo" className="mt-8">
            <Card>
              <CardContent className="space-y-8 p-10 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-background-secondary">
                  <DollarSign className="h-6 w-6 text-foreground" />
                </div>
                <div className="space-y-3">
                  <h3>Comprometimento de renda</h3>
                  <p className="mx-auto max-w-2xl text-muted-foreground">
                    Descubra em segundos se a parcela está confortável para o seu orçamento mensal.
                  </p>
                </div>
                <div className="mx-auto grid max-w-xl gap-4 text-left">
                  <div className="space-y-2">
                    <Label>Renda líquida</Label>
                    <Input
                      type="text"
                      inputMode="numeric"
                      value={formatCurrency(incomeValue)}
                      onChange={(event) => setIncomeValue(parseCurrencyInput(event.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Parcela</Label>
                    <Input
                      type="text"
                      inputMode="numeric"
                      value={formatCurrency(installmentValue)}
                      onChange={(event) => setInstallmentValue(parseCurrencyInput(event.target.value))}
                    />
                  </div>
                  <Button size="lg" onClick={() => toast.success('Comprometimento estimado: 24% da sua renda líquida')}>
                    Ver resultado
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}

export default FerramentasPage;

