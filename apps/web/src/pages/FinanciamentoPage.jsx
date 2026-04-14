import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { toast } from 'sonner';
import { ArrowRight, Car, Home, ShieldCheck } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PageHero from '@/components/PageHero.jsx';
import AffiliateOfferGrid from '@/components/affiliates/AffiliateOfferGrid.jsx';
import AffiliateInlineCTA from '@/components/affiliates/AffiliateInlineCTA.jsx';
import QuickCreditFlowModal from '@/components/QuickCreditFlowModal.jsx';
import { useAffiliatePlacements } from '@/hooks/useAffiliatePlacements.js';
import { portalApi } from '@/platform/services/portalApi.js';
import { trackingService } from '@/platform/services/trackingService.js';
import { partnerRedirectService } from '@/platform/services/partnerRedirectService.js';
import { affiliateRedirectService } from '@/platform/services/affiliateRedirectService.js';

function FinanciamentoPage() {
  const [financingData, setFinancingData] = useState([]);
  const [banksData, setBanksData] = useState([]);
  const [quickModalOpen, setQuickModalOpen] = useState(false);
  const affiliatePlacements = useAffiliatePlacements({ pageSlug: '/financiamento', productType: 'financing' });

  useEffect(() => {
    Promise.all([portalApi.getBanks(), portalApi.getOffers({ productType: 'financing' })]).then(([banks, offers]) => {
      setBanksData(Array.isArray(banks) ? banks : []);
      setFinancingData(Array.isArray(offers) ? offers : []);
    });
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
    const bank = banksData.find((item) => item.id === offer.bankId);
    const destinationUrl = bank?.website ? `https://${bank.website}` : 'https://www.cotejuros.com.br/financiamento';

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

  const handleAffiliateClick = async (offer, position) => {
    try {
      const result = await affiliateRedirectService.create({
        offerSlug: offer.offerSlug,
        pageSlug: '/financiamento',
        position
      });

      if (!result?.redirectUrl) {
        toast.error('Essa oferta ainda não possui link disponível.');
        return;
      }

      window.location.href = result.redirectUrl;
    } catch (error) {
      toast.error(error.message || 'Não foi possível abrir esta oferta agora.');
    }
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
                Continuar no parceiro <ArrowRight className="h-4 w-4" />
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
        <meta name="description" content="Compare financiamento de imóveis e veículos com leitura clara de taxa, prazo e entrada mínima." />
      </Helmet>

      <PageHero
        eyebrow="Comparação interna"
        badge="Financiamento com fluxo mais claro"
        centered
        title="Compare financiamento com clareza e só siga para o parceiro quando fizer sentido."
        subtitle="A página agora separa melhor comparação, decisão e saída externa para reduzir ruído na jornada."
      >
        <div className="flex flex-col justify-center gap-3 sm:flex-row">
          <Button size="lg" onClick={() => setQuickModalOpen(true)}>
            Ver minhas opções agora
          </Button>
          <a href="#resultados-financiamento">
            <Button size="lg" variant="outline">Ver comparação</Button>
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

      {affiliatePlacements.below_hero?.length ? (
        <div className="page-shell py-8">
          <AffiliateOfferGrid
            offers={affiliatePlacements.below_hero}
            title="Opções externas para continuar no parceiro"
            eyebrow="Destino externo"
            onSelect={(offer) => handleAffiliateClick(offer, 'below_hero')}
          />
        </div>
      ) : null}

      <div className="page-shell py-12" id="resultados-financiamento">
        <div className="mb-8 rounded-[24px] border border-border bg-white p-6 shadow-[0_10px_30px_rgba(0,0,0,0.05)]">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Comparaï¿½ï¿½o interna</p>
          <h2 className="mt-3 text-2xl text-foreground">Contexto, opções, decisão e só depois saída</h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground">
            Esta etapa serve para entender custo, prazo e entrada antes de qualquer redirecionamento.
          </p>
        </div>

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
                  Em geral, veículos mais novos costumam ter taxas menores e parcelas mais equilibradas.
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
                  No financiamento imobiliário, o uso do FGTS pode ajudar a reduzir a entrada quando disponível.
                </p>
              </div>
            </div>
            {renderCards((item) => item.category !== 'Carro' && item.category !== 'Moto')}
          </TabsContent>
        </Tabs>

        {affiliatePlacements.mid_content?.[0] ? (
          <div className="mt-8">
            <AffiliateInlineCTA
              offer={affiliatePlacements.mid_content[0]}
              title="Para continuar, vocï¿½ serï¿½ redirecionado"
              onSelect={(offer) => handleAffiliateClick(offer, 'mid_content')}
            />
          </div>
        ) : null}
      </div>

      <section className="border-t border-border bg-background-secondary py-16">
        <div className="page-shell">
          {affiliatePlacements.before_faq?.length ? (
            <div className="mb-8">
              <AffiliateOfferGrid
                offers={affiliatePlacements.before_faq}
                title="Opções externas antes da decisão final"
                eyebrow="Destino externo"
                onSelect={(offer) => handleAffiliateClick(offer, 'before_faq')}
              />
            </div>
          ) : null}

          <div className="mx-auto max-w-4xl rounded-[20px] border border-primary/20 bg-white px-8 py-10 text-center shadow-[var(--shadow-sm)]">
            <h2 className="mb-3">Quer entender qual caminho pode fazer mais sentido?</h2>
            <p className="mx-auto mb-7 max-w-2xl text-muted-foreground">
              Conte o básico sobre o seu momento e veja opções de crédito com mais clareza antes de assumir uma parcela de longo prazo.
            </p>
            <Button size="lg" onClick={() => setQuickModalOpen(true)}>Ver minhas opções agora</Button>
          </div>
        </div>
      </section>

      <QuickCreditFlowModal
        isOpen={quickModalOpen}
        onClose={() => setQuickModalOpen(false)}
        sourcePage="/financiamento"
        originLabel="financiamento"
      />
    </>
  );
}

export default FinanciamentoPage;


