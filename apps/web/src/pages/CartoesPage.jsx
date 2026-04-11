import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { CheckCircle2, ChevronRight, CreditCard, Filter } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import PageHero from '@/components/PageHero.jsx';
import { portalApi } from '@/platform/services/portalApi.js';
import { trackingService } from '@/platform/services/trackingService.js';
import { partnerRedirectService } from '@/platform/services/partnerRedirectService.js';

function CartoesPage() {
  const [cardsData, setCardsData] = useState([]);
  const [freeAnnuity, setFreeAnnuity] = useState(false);
  const [categories, setCategories] = useState({ Premium: false, Intermediario: false, Basico: false });
  const [benefits, setBenefits] = useState({ Cashback: false, Milhas: false, VIP: false });
  const [sort, setSort] = useState('limite-maior');

  useEffect(() => {
    portalApi.getOffers({ productType: 'credit_card' }).then((items) => {
      setCardsData(items);
    });
  }, []);

  const filteredCards = useMemo(() => {
    let result = cardsData.filter((card) => {
      const matchAnnuity = !freeAnnuity || card.annualFee === 0;
      const activeCats = Object.keys(categories).filter((key) => categories[key]);
      const matchCat = activeCats.length === 0 || activeCats.includes(card.category);
      const activeBenefits = Object.keys(benefits).filter((key) => benefits[key]);

      const matchBenefits =
        activeBenefits.length === 0 ||
        activeBenefits.some((benefit) =>
          card.benefits?.some(
            (cardBenefit) =>
              cardBenefit.toLowerCase().includes(benefit.toLowerCase()) ||
              (benefit === 'VIP' && cardBenefit.toLowerCase().includes('sala')) ||
              (benefit === 'Milhas' && cardBenefit.toLowerCase().includes('pontos'))
          )
        );

      return matchAnnuity && matchCat && matchBenefits;
    });

    if (sort === 'limite-maior') result = [...result].sort((a, b) => b.maxLimit - a.maxLimit);
    if (sort === 'anuidade-menor') result = [...result].sort((a, b) => a.annualFee - b.annualFee);

    return result;
  }, [benefits, cardsData, categories, freeAnnuity, sort]);

  const freeCardsCount = useMemo(
    () => cardsData.filter((item) => item.annualFee === 0).length,
    [cardsData]
  );

  const bestLimit = useMemo(() => {
    if (!filteredCards.length) return 0;
    return Math.max(...filteredCards.map((item) => item.maxLimit || 0));
  }, [filteredCards]);

  const handleApply = async (card) => {
    const destinationUrl = 'https://finance.cotejuros.com.br';

    await trackingService.trackOfferClick({
      sourcePage: '/cartoes-de-credito',
      offerId: card.id,
      target: destinationUrl,
      productType: 'credit_card',
      partnerId: card.bankId
    });

    const redirect = await partnerRedirectService.create({
      partnerId: card.bankId,
      offerId: card.id,
      destinationUrl,
      sourcePage: '/cartoes-de-credito',
      productType: 'credit_card'
    });

    toast.success(`Interesse registrado para ${card.title}.`);
    window.location.href = redirect.resolvedUrl;
  };

  return (
    <>
      <Helmet>
        <title>Comparador de cartões - Cote Juros</title>
        <meta name="description" content="Compare cartões por anuidade, limite estimado e benefícios em uma interface premium e objetiva." />
      </Helmet>

      <PageHero
        badge="Comparador de cartões"
        title="Encontre o cartão ideal com leitura clara de custo e benefício."
        subtitle="Compare anuidade, limite estimado e vantagens reais em uma grade de decisão feita para acelerar conversão."
      >
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link to="/diagnostico-financeiro">
            <Button size="lg">Analisar perfil completo</Button>
          </Link>
          <a href="#resultados-cartoes">
            <Button size="lg" variant="outline">Ver cartões agora</Button>
          </a>
        </div>
      </PageHero>

      <section className="border-b border-border bg-background-secondary py-8">
        <div className="page-shell grid gap-4 md:grid-cols-4">
          <div className="interactive-card px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Cartões no comparador</p>
            <p className="mt-2 text-xl font-semibold tracking-[-0.03em] text-foreground">{cardsData.length}</p>
          </div>
          <div className="interactive-card px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Sem anuidade</p>
            <p className="mt-2 text-xl font-semibold tracking-[-0.03em] text-primary">{freeCardsCount}</p>
          </div>
          <div className="interactive-card px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Maior limite estimado</p>
            <p className="mt-2 text-xl font-semibold tracking-[-0.03em] text-foreground">R$ {(bestLimit / 1000).toFixed(0)}k</p>
          </div>
          <div className="interactive-card px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Ofertas visíveis</p>
            <p className="mt-2 text-xl font-semibold tracking-[-0.03em] text-foreground">{filteredCards.length}</p>
          </div>
        </div>
      </section>

      <div className="page-shell py-12" id="resultados-cartoes">
        <div className="grid gap-8 lg:grid-cols-[300px_1fr]">
          <aside className="lg:sticky lg:top-24 lg:h-fit">
            <Card className="border-border bg-white shadow-[var(--shadow-sm)]">
              <CardContent className="space-y-8 p-8">
                <div className="flex items-center gap-2 border-b border-border pb-4">
                  <Filter className="h-4 w-4 text-primary" />
                  <h3 className="text-lg">Filtros da comparação</h3>
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="free-annuity">Apenas sem anuidade</Label>
                  <Switch id="free-annuity" checked={freeAnnuity} onCheckedChange={setFreeAnnuity} />
                </div>

                <div className="space-y-4">
                  <Label>Categoria</Label>
                  <div className="space-y-3">
                    {['Premium', 'Intermediario', 'Basico'].map((item) => (
                      <label key={item} className="flex items-center gap-3 rounded-[10px] border border-border px-4 py-3 hover:bg-background-secondary">
                        <Checkbox
                          checked={categories[item]}
                          onCheckedChange={(checked) => setCategories((previous) => ({ ...previous, [item]: Boolean(checked) }))}
                        />
                        <span className="text-sm text-foreground">{item}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <Label>Benefícios</Label>
                  <div className="space-y-3">
                    {['Cashback', 'Milhas', 'VIP'].map((item) => (
                      <label key={item} className="flex items-center gap-3 rounded-[10px] border border-border px-4 py-3 hover:bg-background-secondary">
                        <Checkbox
                          checked={benefits[item]}
                          onCheckedChange={(checked) => setBenefits((previous) => ({ ...previous, [item]: Boolean(checked) }))}
                        />
                        <span className="text-sm text-foreground">{item === 'VIP' ? 'Sala VIP' : item}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </aside>

          <section>
            <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <p className="text-sm text-muted-foreground">{filteredCards.length} cartão(ões) visíveis na comparação.</p>
              <div className="flex flex-wrap items-center gap-3">
                <Label className="whitespace-nowrap">Ordenar</Label>
                <Select value={sort} onValueChange={setSort}>
                  <SelectTrigger className="w-[220px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="limite-maior">Maior limite</SelectItem>
                    <SelectItem value="anuidade-menor">Menor anuidade</SelectItem>
                  </SelectContent>
                </Select>
                <Link to="/diagnostico-financeiro">
                  <Button variant="outline">Analisar perfil</Button>
                </Link>
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {filteredCards.map((card) => {
                const isFree = card.annualFee === 0;

                return (
                  <Card key={card.id} className="surface-card h-full overflow-hidden border-border bg-white">
                    <div className="relative h-44 border-b border-border bg-background-secondary">
                      <img src={card.image} alt={card.title} className="h-full w-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/35 via-slate-900/5 to-transparent" />
                      <div className="absolute inset-x-5 bottom-5">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/85">{card.bankName}</p>
                        <h3 className="mt-2 text-xl text-white">{card.title}</h3>
                      </div>
                    </div>

                    <CardContent className="flex h-full flex-col gap-5 p-8">
                      <div className="flex items-center justify-between gap-3">
                        <Badge variant="outline" className="border-primary/25 bg-primary/10 text-primary">{card.category}</Badge>
                        {isFree ? <Badge variant="secondary">Sem anuidade</Badge> : null}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="rounded-[12px] border border-border bg-background-secondary p-4">
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Anuidade</p>
                          <p className={`mt-2 text-sm font-semibold ${isFree ? 'text-primary' : 'text-foreground'}`}>
                            {isFree ? 'Grátis' : `R$ ${card.annualFee}/ano`}
                          </p>
                        </div>
                        <div className="rounded-[12px] border border-border bg-background-secondary p-4">
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Limite estimado</p>
                          <p className="mt-2 text-sm font-semibold text-foreground">R$ {card.maxLimit / 1000}k</p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        {card.benefits?.slice(0, 3).map((benefit, index) => (
                          <div key={`${benefit}-${index}`} className="flex items-start gap-3">
                            <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" />
                            <p className="text-sm text-muted-foreground">{benefit}</p>
                          </div>
                        ))}
                      </div>

                      <Button className="mt-auto w-full" onClick={() => handleApply(card)}>
                        Solicitar agora <ChevronRight className="h-4 w-4" />
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {filteredCards.length === 0 ? (
              <div className="rounded-[16px] border border-dashed border-border bg-background-secondary px-6 py-16 text-center">
                <CreditCard className="mx-auto h-10 w-10 text-muted-foreground" />
                <h3 className="mt-4 text-2xl">Nenhum cartão encontrado.</h3>
                <p className="mt-3 text-muted-foreground">Tente reduzir os filtros ativos para ver mais opções.</p>
                <div className="mt-6">
                  <Link to="/diagnostico-financeiro">
                    <Button>Analisar perfil completo</Button>
                  </Link>
                </div>
              </div>
            ) : null}
          </section>
        </div>
      </div>

      <section className="border-t border-border bg-background-secondary py-16">
        <div className="page-shell">
          <div className="mx-auto max-w-4xl rounded-[20px] border border-primary/20 bg-white px-8 py-10 text-center shadow-[var(--shadow-sm)]">
            <h2 className="mb-3">Quer escolher o cartão com mais aderência ao seu momento?</h2>
            <p className="mx-auto mb-7 max-w-2xl text-muted-foreground">
              O diagnóstico combina renda e comportamento financeiro para indicar linhas com maior chance de aprovação e melhor pacote de benefícios.
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

export default CartoesPage;
