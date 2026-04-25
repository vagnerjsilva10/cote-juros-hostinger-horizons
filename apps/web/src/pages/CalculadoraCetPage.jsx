import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calculator, Copy, FileText, Link as LinkIcon } from 'lucide-react';
import { toast } from 'sonner';
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
const formatPercent = (value = 0) => `${Number(value || 0).toLocaleString('pt-BR', { maximumFractionDigits: 2 })}%`;

function CalculadoraCetPage() {
  const [amount, setAmount] = useState(8000);
  const [installment, setInstallment] = useState(735);
  const [months, setMonths] = useState(14);
  const [fees, setFees] = useState(350);

  const result = useMemo(() => {
    const financed = Math.max(amount - fees, 1);
    const totalPaid = Math.max(installment * months, 0);
    const totalCost = Math.max(totalPaid - amount + fees, 0);
    const monthlyCet = financed > 0 && months > 0
      ? (Math.pow(totalPaid / financed, 1 / months) - 1) * 100
      : 0;
    const annualCet = (Math.pow(1 + monthlyCet / 100, 12) - 1) * 100;

    return {
      financed,
      totalPaid,
      totalCost,
      monthlyCet: Number.isFinite(monthlyCet) ? monthlyCet : 0,
      annualCet: Number.isFinite(annualCet) ? annualCet : 0
    };
  }, [amount, installment, months, fees]);

  const copySummary = async () => {
    const text = [
      'Resumo da calculadora de CET da Cote Juros',
      `Valor liberado: ${formatMoney(amount)}`,
      `Parcela: ${formatMoney(installment)}`,
      `Prazo: ${months} meses`,
      `Tarifas/seguros: ${formatMoney(fees)}`,
      `Total pago: ${formatMoney(result.totalPaid)}`,
      `CET mensal aproximado: ${formatPercent(result.monthlyCet)}`,
      `CET anual aproximado: ${formatPercent(result.annualCet)}`
    ].join('\n');
    await navigator.clipboard.writeText(text);
    toast.success('Resumo copiado.');
  };

  return (
    <>
      <SeoHead
        title="Calculadora de CET | Custo efetivo total aproximado | Cote Juros"
        description="Calcule uma estimativa de CET mensal e anual para comparar emprestimos com mais clareza antes de contratar."
        path="/calculadora-cet"
        breadcrumbs={[homeBreadcrumb, { name: 'Ferramentas', path: '/ferramentas' }, { name: 'Calculadora de CET', path: '/calculadora-cet' }]}
        structuredData={[
          {
            '@context': 'https://schema.org',
            '@type': 'SoftwareApplication',
            name: 'Calculadora de CET Cote Juros',
            applicationCategory: 'FinanceApplication',
            operatingSystem: 'Web',
            offers: { '@type': 'Offer', price: '0', priceCurrency: 'BRL' }
          }
        ]}
      />

      <section className="border-b border-border bg-background py-10 md:py-14">
        <div className="page-shell grid gap-8 lg:grid-cols-[1fr_380px] lg:items-center">
          <div className="max-w-3xl space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background-secondary px-3 py-2 text-sm font-medium text-muted-foreground">
              <Calculator className="h-4 w-4 text-primary" />
              Ferramenta gratuita
            </div>
            <h1 className="text-3xl font-semibold leading-tight text-foreground md:text-5xl">
              Calculadora de CET para comparar emprestimos
            </h1>
            <p className="text-lg leading-8 text-muted-foreground">
              Estime o custo efetivo total a partir do valor liberado, parcela, prazo e tarifas. Use o resultado como ponto de partida para comparar propostas equivalentes.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <a href="#calculadora">
                <Button size="lg">Calcular CET</Button>
              </a>
              <Link to="/ferramentas">
                <Button size="lg" variant="outline">Ver outras ferramentas</Button>
              </Link>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Resultado rapido</CardTitle>
              <CardDescription>Estimativa baseada nos dados preenchidos.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">CET mensal aproximado</p>
                <p className="text-3xl font-semibold text-foreground">{formatPercent(result.monthlyCet)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">CET anual aproximado</p>
                <p className="text-3xl font-semibold text-foreground">{formatPercent(result.annualCet)}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section id="calculadora" className="page-shell py-12">
        <div className="grid gap-8 lg:grid-cols-[360px_1fr]">
          <Card>
            <CardHeader>
              <CardTitle>Dados da proposta</CardTitle>
              <CardDescription>Inclua tarifas, seguros e custos obrigatorios conhecidos.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label>Valor liberado</Label>
                <Input value={formatMoney(amount)} inputMode="numeric" onChange={(event) => setAmount(parseMoney(event.target.value))} />
              </div>
              <div className="space-y-2">
                <Label>Valor da parcela</Label>
                <Input value={formatMoney(installment)} inputMode="numeric" onChange={(event) => setInstallment(parseMoney(event.target.value))} />
              </div>
              <div className="space-y-2">
                <Label>Prazo em meses</Label>
                <Input type="number" value={months} onChange={(event) => setMonths(Number(event.target.value))} />
              </div>
              <div className="space-y-2">
                <Label>Tarifas e seguros</Label>
                <Input value={formatMoney(fees)} inputMode="numeric" onChange={(event) => setFees(parseMoney(event.target.value))} />
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              {[
                ['Total pago', formatMoney(result.totalPaid)],
                ['Custo adicional', formatMoney(result.totalCost)],
                ['Base financiada', formatMoney(result.financed)]
              ].map(([label, value]) => (
                <Card key={label}>
                  <CardContent className="p-5">
                    <p className="text-sm text-muted-foreground">{label}</p>
                    <p className="mt-2 text-2xl font-semibold text-foreground">{value}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Como usar o resultado</CardTitle>
                <CardDescription>O CET aproximado ajuda a comparar propostas com prazos e custos semelhantes.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-muted-foreground">
                <p>Quanto maior o CET, maior tende a ser o custo real da operacao. Compare sempre propostas de mesmo valor, prazo e perfil de risco.</p>
                <p>Se uma oferta tiver parcela menor, mas prazo muito maior, o total pago pode ficar mais caro. Por isso o CET deve ser lido junto com total pago e tarifas.</p>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button onClick={copySummary} variant="outline">
                    <Copy className="h-4 w-4" />
                    Copiar resumo
                  </Button>
                  <Link to="/blog/emprestimo-para-negativado-como-funciona">
                    <Button variant="outline">
                      <FileText className="h-4 w-4" />
                      Ler guia relacionado
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Referencia para citar</CardTitle>
                <CardDescription>Use esta ferramenta como fonte em conteudos sobre custo de credito.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 rounded-[10px] border border-border bg-background-secondary p-3 text-sm text-muted-foreground">
                  <LinkIcon className="h-4 w-4" />
                  https://www.cotejuros.com.br/calculadora-cet
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </>
  );
}

export default CalculadoraCetPage;
