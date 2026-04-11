import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
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

    toast.success(`Interesse registrado para simulacao com ${offer.bankName}.`);
    window.location.href = redirect.resolvedUrl;
  };

  const renderCards = (filterFn) => {
    const data = financingData.filter(filterFn);

    return (
      <div className="grid gap-5 md:grid-cols-2">
        {data.map((item) => (
          <Card key={item.id} className="surface-card h-full">
            <CardContent className="flex h-full flex-col gap-6 p-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <Badge variant="outline">{item.category}</Badge>
                  <h3 className="mt-4">{item.bankName}</h3>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Taxa anual</p>
                  <p className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-foreground">{item.annualRate}%</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-[12px] border border-border bg-background-secondary p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Valor maximo</p>
                  <p className="mt-2 text-sm font-semibold text-foreground">R$ {(item.maxValue / 1000).toFixed(0)}k</p>
                </div>
                <div className="rounded-[12px] border border-border bg-background-secondary p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Prazo</p>
                  <p className="mt-2 text-sm font-semibold text-foreground">{item.maxTerm} meses</p>
                </div>
              </div>

              <div className="rounded-[12px] border border-border bg-background-secondary p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Entrada minima</p>
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
        <meta name="description" content="Compare financiamento de imoveis e veiculos com uma interface clara e neutra." />
      </Helmet>

      <PageHero
        badge="Financiamento"
        centered
        title="Compare financiamento com menos excesso visual."
        subtitle="A mesma linguagem tipografica do restante do sistema aplicada a veiculos e imoveis."
      />

      <div className="page-shell py-12">
        <Tabs defaultValue="veiculos" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="veiculos" className="gap-2">
              <Car className="h-4 w-4" />
              Veiculos
            </TabsTrigger>
            <TabsTrigger value="imobiliario" className="gap-2">
              <Home className="h-4 w-4" />
              Imoveis
            </TabsTrigger>
          </TabsList>

          <TabsContent value="veiculos" className="mt-8 space-y-6">
            <div className="rounded-[12px] border border-border bg-background-secondary p-5">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 text-foreground" />
                <p className="text-sm text-muted-foreground">
                  Veiculos mais novos costumam concentrar taxas menores e prazos mais competitivos.
                </p>
              </div>
            </div>
            {renderCards((item) => item.category === 'Carro' || item.category === 'Moto')}
          </TabsContent>

          <TabsContent value="imobiliario" className="mt-8 space-y-6">
            <div className="rounded-[12px] border border-border bg-background-secondary p-5">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 text-foreground" />
                <p className="text-sm text-muted-foreground">
                  Em financiamento imobiliario, o uso do FGTS pode reduzir a necessidade de entrada dependendo da regra aplicavel.
                </p>
              </div>
            </div>
            {renderCards((item) => item.category !== 'Carro' && item.category !== 'Moto')}
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}

export default FinanciamentoPage;
