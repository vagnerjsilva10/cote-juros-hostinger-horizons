import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Gauge, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import SeoHead from '@/components/SeoHead.jsx';
import { homeBreadcrumb } from '@/seo/brandSeo.js';

const parseMoney = (value = '') => Number(String(value).replace(/\D/g, '') || 0);
const formatMoney = (value = 0) =>
  Number(value || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0
  });
const formatPercent = (value = 0) => `${Number(value || 0).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`;

const classifyRisk = (ratio) => {
  if (ratio <= 20) return { label: 'Confortável', tone: 'text-emerald-700', text: 'A parcela ocupa uma parte menor da renda. Ainda assim, confira outras despesas fixas.' };
  if (ratio <= 30) return { label: 'Atenção', tone: 'text-amber-700', text: 'A parcela já pesa no orçamento. Simule prazos e mantenha reserva para imprevistos.' };
  return { label: 'Alto risco', tone: 'text-red-700', text: 'A parcela pode comprometer demais a renda. Considere reduzir valor, aumentar prazo ou adiar a contratação.' };
};

function SimuladorComprometimentoRendaPage() {
  const [income, setIncome] = useState(5200);
  const [installment, setInstallment] = useState(1250);
  const [fixedCosts, setFixedCosts] = useState(2300);

  const result = useMemo(() => {
    const ratio = income > 0 ? (installment / income) * 100 : 0;
    const fixedRatio = income > 0 ? ((installment + fixedCosts) / income) * 100 : 0;
    const freeIncome = income - fixedCosts - installment;
    const risk = classifyRisk(ratio);
    return { ratio, fixedRatio, freeIncome, risk };
  }, [income, installment, fixedCosts]);

  return (
    <>
      <SeoHead
        title="Simulador de comprometimento de renda | Cote Juros"
        description="Simule quanto uma parcela compromete da sua renda e veja sinais de risco antes de contratar empréstimo ou financiamento."
        path="/simulador-comprometimento-renda"
        breadcrumbs={[homeBreadcrumb, { name: 'Ferramentas', path: '/ferramentas' }, { name: 'Comprometimento de renda', path: '/simulador-comprometimento-renda' }]}
        structuredData={[
          {
            '@context': 'https://schema.org',
            '@type': 'SoftwareApplication',
            name: 'Simulador de comprometimento de renda Cote Juros',
            applicationCategory: 'FinanceApplication',
            operatingSystem: 'Web',
            offers: { '@type': 'Offer', price: '0', priceCurrency: 'BRL' }
          }
        ]}
      />

      <section className="border-b border-border bg-background py-10 md:py-14">
        <div className="page-shell max-w-5xl space-y-5">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background-secondary px-3 py-2 text-sm font-medium text-muted-foreground">
            <Gauge className="h-4 w-4 text-primary" />
            Simulador gratuito
          </div>
          <h1 className="max-w-3xl text-3xl font-semibold leading-tight text-foreground md:text-5xl">
            Simulador de comprometimento de renda
          </h1>
          <p className="max-w-3xl text-lg leading-8 text-muted-foreground">
            Veja se a parcela de um empréstimo, cartão parcelado ou financiamento cabe no seu orçamento antes de seguir com a proposta.
          </p>
        </div>
      </section>

      <section className="page-shell py-12">
        <div className="grid gap-8 lg:grid-cols-[360px_1fr]">
          <Card>
            <CardHeader>
              <CardTitle>Preencha os valores</CardTitle>
              <CardDescription>Use sua renda líquida e suas despesas fixas mensais.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label>Renda mensal líquida</Label>
                <Input value={formatMoney(income)} inputMode="numeric" onChange={(event) => setIncome(parseMoney(event.target.value))} />
              </div>
              <div className="space-y-2">
                <Label>Parcela nova</Label>
                <Input value={formatMoney(installment)} inputMode="numeric" onChange={(event) => setInstallment(parseMoney(event.target.value))} />
              </div>
              <div className="space-y-2">
                <Label>Despesas fixas atuais</Label>
                <Input value={formatMoney(fixedCosts)} inputMode="numeric" onChange={(event) => setFixedCosts(parseMoney(event.target.value))} />
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Leitura do resultado</CardTitle>
                <CardDescription>Quanto menor o percentual, maior a folga para imprevistos.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-3">
                <div className="rounded-[10px] border border-border bg-background-secondary p-5">
                  <p className="text-sm text-muted-foreground">Parcela sobre renda</p>
                  <p className="mt-2 text-3xl font-semibold text-foreground">{formatPercent(result.ratio)}</p>
                </div>
                <div className="rounded-[10px] border border-border bg-background-secondary p-5">
                  <p className="text-sm text-muted-foreground">Gastos fixos + parcela</p>
                  <p className="mt-2 text-3xl font-semibold text-foreground">{formatPercent(result.fixedRatio)}</p>
                </div>
                <div className="rounded-[10px] border border-border bg-background-secondary p-5">
                  <p className="text-sm text-muted-foreground">Renda livre estimada</p>
                  <p className="mt-2 text-3xl font-semibold text-foreground">{formatMoney(result.freeIncome)}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="space-y-4 p-6">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-1 h-5 w-5 text-primary" />
                  <div>
                    <p className={`text-xl font-semibold ${result.risk.tone}`}>{result.risk.label}</p>
                    <p className="mt-2 text-muted-foreground">{result.risk.text}</p>
                  </div>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Link to="/calculadora-cet">
                    <Button>Comparar CET</Button>
                  </Link>
                  <Link to="/emprestimos">
                    <Button variant="outline">Ver empréstimos</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Como citar esta ferramenta</CardTitle>
                <CardDescription>Link recomendado para conteúdos sobre orçamento e crédito responsável.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="rounded-[10px] border border-border bg-background-secondary p-3 text-sm text-muted-foreground">
                  https://www.cotejuros.com.br/simulador-comprometimento-renda
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </>
  );
}

export default SimuladorComprometimentoRendaPage;
