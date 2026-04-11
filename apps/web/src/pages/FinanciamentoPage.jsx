import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Home, Car, Calendar, ArrowRight, ShieldCheck } from 'lucide-react';
import { portalApi } from '@/platform/services/portalApi.js';
import { trackingService } from '@/platform/services/trackingService.js';

function FinanciamentoPage() {
  const [financingData, setFinancingData] = useState([]);

  useEffect(() => {
    portalApi.getOffers({ productType: 'financing' }).then(setFinancingData);
  }, []);

  const handleSimulate = async (offer) => {
    await trackingService.trackOfferClick({
      sourcePage: '/financiamento',
      offerId: offer.id,
      target: 'https://finance.cotejuros.com.br',
      productType: 'financing',
      partnerId: offer.bankId,
      metadata: { annualRate: offer.annualRate }
    });

    toast.success(`Interesse registrado para simulacao com ${offer.bankName}.`);
  };

  const renderCards = (filterFn) => {
    const data = financingData.filter(filterFn);

    return (
      <div className="grid md:grid-cols-2 gap-8 mt-8">
        {data.map((fin) => (
          <Card key={fin.id} className="card-premium overflow-hidden bg-white border-slate-200">
            <CardContent className="p-0">
              <div className="p-6 md:p-8 border-b border-slate-100 flex justify-between items-start bg-slate-50">
                <div>
                  <Badge variant="outline" className="mb-3 bg-white">{fin.category}</Badge>
                  <h3 className="text-2xl font-extrabold text-foreground">{fin.bankName}</h3>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Taxa a.a.</p>
                  <p className="text-2xl font-extrabold text-primary">{fin.annualRate}%</p>
                </div>
              </div>

              <div className="p-6 md:p-8 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm font-semibold text-muted-foreground mb-1 flex items-center gap-1"><Car className="w-4 h-4" /> Valor</p>
                    <p className="text-lg font-bold text-foreground">Ate R$ {(fin.maxValue / 1000).toFixed(0)}k</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-muted-foreground mb-1 flex items-center gap-1"><Calendar className="w-4 h-4" /> Prazo Max</p>
                    <p className="text-lg font-bold text-foreground">{fin.maxTerm} meses</p>
                  </div>
                  <div className="col-span-2 bg-slate-50 rounded-lg p-4 border border-slate-100">
                    <p className="text-sm font-semibold text-muted-foreground mb-1">Condicao de Entrada</p>
                    <p className="text-base font-bold text-foreground">A partir de {fin.minDownPayment}% do valor do bem</p>
                  </div>
                </div>

                <Button className="w-full h-14 text-lg font-bold gradient-fintech-hover border-0 shadow-[var(--shadow-sm)]" onClick={() => handleSimulate(fin)}>
                  Simular Financiamento <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <>
      <Helmet>
        <title>Comparador de Financiamentos - Cote Juros</title>
        <meta name="description" content="Simule o financiamento da sua casa ou carro com as menores taxas." />
      </Helmet>

      <div className="bg-foreground text-background py-16 lg:py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[#0F62FE]/20 to-[#7C3AED]/20 mix-blend-overlay z-0" />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center max-w-3xl">
          <Badge className="bg-white/10 text-white hover:bg-white/20 border-0 mb-6 px-4 py-1.5 text-sm">Financiamentos</Badge>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-6 text-white text-balance">Realize seu sonho pagando menos</h1>
          <p className="text-xl text-slate-300 font-medium">Compare as taxas de financiamento imobiliario e de veiculos nos maiores bancos do pais.</p>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 max-w-5xl">
        <Tabs defaultValue="veiculos" className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-16 p-1.5 bg-slate-100 rounded-[var(--radius-lg)]">
            <TabsTrigger value="veiculos" className="rounded-[var(--radius-md)] text-lg font-bold data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all">
              <Car className="w-5 h-5 mr-2" /> Veiculos
            </TabsTrigger>
            <TabsTrigger value="imobiliario" className="rounded-[var(--radius-md)] text-lg font-bold data-[state=active]:bg-white data-[state=active]:text-secondary data-[state=active]:shadow-sm transition-all">
              <Home className="w-5 h-5 mr-2" /> Imoveis
            </TabsTrigger>
          </TabsList>

          <TabsContent value="veiculos" className="mt-4 animate-in fade-in-50 slide-in-from-bottom-4 duration-500">
            <div className="bg-blue-50 border border-blue-100 rounded-[var(--radius-lg)] p-6 mb-8 mt-8 flex items-start gap-4">
              <ShieldCheck className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
              <p className="text-blue-900 font-medium leading-relaxed">
                As taxas para financiamento de veiculos variam de acordo com o ano de fabricacao. Veiculos mais novos costumam ter taxas menores.
              </p>
            </div>
            {renderCards((item) => item.category === 'Carro' || item.category === 'Moto')}
          </TabsContent>

          <TabsContent value="imobiliario" className="mt-4 animate-in fade-in-50 slide-in-from-bottom-4 duration-500">
            <div className="bg-purple-50 border border-purple-100 rounded-[var(--radius-lg)] p-6 mb-8 mt-8 flex items-start gap-4">
              <ShieldCheck className="w-6 h-6 text-secondary flex-shrink-0 mt-1" />
              <p className="text-purple-900 font-medium leading-relaxed">
                Para o financiamento imobiliario, voce pode usar seu FGTS como entrada se o imovel se enquadrar nas regras do SFH.
              </p>
            </div>
            {renderCards((item) => item.category !== 'Carro' && item.category !== 'Moto')}
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}

export default FinanciamentoPage;

