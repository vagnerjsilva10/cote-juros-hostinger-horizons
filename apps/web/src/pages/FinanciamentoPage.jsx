import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowRight, Car, Home, ShieldCheck } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PageHero from '@/components/PageHero.jsx';
import { portalApi } from '@/platform/services/portalApi.js';
import { trackingService } from '@/platform/services/trackingService.js';
import { partnerRedirectService } from '@/platform/services/partnerRedirectService.js';

function FinanciamentoPage() {
  const [financingData, setFinancingData] = useState([]);

  useEffect(() => {
    portalApi.getOffers({ productType: 'financing' }).then(setFinancingData);
  }, []);

  const bestAnnualRate = useMemo(() => {
    if (!financingData.length) return null;
    const rate = Math.min(...financingData.map((item) => item.annualRate));
    return Number.isFinite(rate) ? rate.toFixed(2) : null;
  }, [financingData]);

  const maxTerm = useMemo(() => {
    if (!financingData.length) return 0;
    return Math.max(...financingData.map((item) => item.maxTerm || 0));
  }, [financingData]);

  const handleSimulate = async (offer) => {
    const destinationUrl = 'https://finance.cotejuros.com.br';

    await trackingService.trackOfferClick({
      sourcePage: '/financiamento',
      offerId: offer.id,
      target: destinationUrl,
      productType: 'financing',
      partnerId: offer.bankId,
      metadata: { annualRate: offer.annualRate }
    });

    const redirect = await partnerRedirectService.create({
      partnerId: offer.bankId,
      offerId: offer.id,
      destinationUrl,
      sourcePage: '/financiamento',
      productType: 'financing'
    });

    toast.success(`Interesse registrado para simulação com ${offer.bankName}.`);
    window.location.href = redirect.resolvedUrl;
  };

  const renderCards = (filterFn) => {
    const data = financingData.filter(filterFn);

    return (
      <div className="grid gap-5 md:grid-cols-2">
        {data.map((item) => (
          <Card key={item.id} className="surface-card h-full border-border bg-white">
            <CardContent className="flex h-full flex-col gap-6 p-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <Badge variant="outline" className="border-primary/25 bg-primary/10 text-primary">{item.category}</Badge>
                  <h3 className="mt-4">{item.bankName}</h3>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Taxa anual</p>
                  <p className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-primary">{item.annualRate}%</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-[12px] border border-border bg-background-secondary p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Valor máximo</p>
                  <p className="mt-2 text-sm font-semibold text-foreground">R$ {(item.maxValue / 1000).toFixed(0)}k</p>
                </div>
                <div className="rounded-[12px] border border-border bg-background-secondary p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Prazo</p>
                  <p className="mt-2 text-sm font-semibold text-foreground">{item.maxTerm} meses</p>
                </div>
              </div>

              <div className="rounded-[12px] border border-border bg-background-secondary p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Entrada mínima</p>
                <p className="mt-2 text-sm text-muted-foreground">A partir de {item.minDownPayment}% do valor do bem.</p>
              </div>

              <Button className="mt-auto w-full" onClick={() => handleSimulate(item)}>
                Simular financiamento <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <>
      <Helmet>
        <title>Comparador de financiamento - Cote Juros</title>
        <meta name="description" content="Compare financiamento de imóveis e veículos com leitura premium de taxa, prazo e entrada mínima." />
      </Helmet>

      <PageHero
        badge="Comparador de financiamentos"
        centered
        title="Compare financiamento com clareza de taxa, entrada e prazo."
        subtitle="A mesma linguagem premium da home aplicada para decisão de veículos e imóveis com mais confiança."
      >
        <div className="flex flex-col justify-center gap-3 sm:flex-row">
          <Link to="/diagnostico-financeiro">
            <Button size="lg">Analisar perfil completo</Button>
          </Link>
          <a href="#resultados-financiamento">
            <Button size="lg" variant="outline">Ver opções agora</Button>
          </a>
        </div>
      </PageHero>

      <section className="border-b border-border bg-background-secondary py-8">
        <div className="page-shell grid gap-4 md:grid-cols-4">
          <div className="interactive-card px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Ofertas no comparador</p>
            <p className="mt-2 text-xl font-semibold tracking-[-0.03em] text-foreground">{financingData.length}</p>
          </div>
          <div className="interactive-card px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Melhor taxa anual</p>
            <p className="mt-2 text-xl font-semibold tracking-[-0.03em] text-primary">{bestAnnualRate ? `${bestAnnualRate}%` : '--'}</p>
          </div>
          <div className="interactive-card px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Maior prazo</p>
            <p className="mt-2 text-xl font-semibold tracking-[-0.03em] text-foreground">{maxTerm} meses</p>
          </div>
          <div className="interactive-card px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Leitura de condições</p>
            <p className="mt-2 text-xl font-semibold tracking-[-0.03em] text-foreground">Completa</p>
          </div>
        </div>
      </section>

      <div className="page-shell py-12" id="resultados-financiamento">
        <Tabs defaultValue="veiculos" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="veiculos" className="gap-2">
              <Car className="h-4 w-4" />
              Veículos
            </TabsTrigger>
            <TabsTrigger value="imobiliario" className="gap-2">
              <Home className="h-4 w-4" />
              Imóveis
            </TabsTrigger>
          </TabsList>

          <TabsContent value="veiculos" className="mt-8 space-y-6">
            <div className="rounded-[12px] border border-border bg-background-secondary p-5">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 text-primary" />
                <p className="text-sm text-muted-foreground">
                  Veículos mais novos costumam concentrar taxas menores e prazos mais competitivos.
                </p>
              </div>
            </div>
            {renderCards((item) => item.category === 'Carro' || item.category === 'Moto')}
          </TabsContent>

          <TabsContent value="imobiliario" className="mt-8 space-y-6">
            <div className="rounded-[12px] border border-border bg-background-secondary p-5">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 text-primary" />
                <p className="text-sm text-muted-foreground">
                  Em financiamento imobiliário, o uso do FGTS pode reduzir a entrada conforme regra aplicável.
                </p>
              </div>
            </div>
            {renderCards((item) => item.category !== 'Carro' && item.category !== 'Moto')}
          </TabsContent>
        </Tabs>
      </div>

      <section className="border-t border-border bg-background-secondary py-16">
        <div className="page-shell">
          <div className="mx-auto max-w-4xl rounded-[20px] border border-primary/20 bg-white px-8 py-10 text-center shadow-[var(--shadow-sm)]">
            <h2 className="mb-3">Quer validar seu financiamento com mais segurança?</h2>
            <p className="mx-auto mb-7 max-w-2xl text-muted-foreground">
              O diagnóstico financeiro organiza sua capacidade de pagamento para você decidir com mais confiança antes de assumir o contrato.
            </p>
            <Link to="/diagnostico-financeiro">
              <Button size="lg">Analisar perfil agora</Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

export default FinanciamentoPage;
