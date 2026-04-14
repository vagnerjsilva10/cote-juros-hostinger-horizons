import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { ChevronRight, Clock, Filter, LayoutGrid, List, ShieldCheck, Sparkles, Star } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import PageHero from '@/components/PageHero.jsx';
import AffiliateOfferGrid from '@/components/affiliates/AffiliateOfferGrid.jsx';
import AffiliateInlineCTA from '@/components/affiliates/AffiliateInlineCTA.jsx';
import AffiliateSidebarWidget from '@/components/affiliates/AffiliateSidebarWidget.jsx';
import SuperSimOfferCard from '@/components/affiliates/SuperSimOfferCard.jsx';
import SuperSimInlineCTA from '@/components/affiliates/SuperSimInlineCTA.jsx';
import SuperSimSidebarCard from '@/components/affiliates/SuperSimSidebarCard.jsx';
import { useAffiliatePlacements } from '@/hooks/useAffiliatePlacements.js';
import { portalApi } from '@/platform/services/portalApi.js';
import { trackingService } from '@/platform/services/trackingService.js';
import { partnerRedirectService } from '@/platform/services/partnerRedirectService.js';
import { affiliateRedirectService } from '@/platform/services/affiliateRedirectService.js';
import { getNonSupersimOffers, getSupersimOffer } from '@/lib/supersim.js';

const bankAccentById = {
  itau: '#EC7000',
  nubank: '#8A05BE',
  santander: '#EC0000',
  c6: '#101010',
  caixa: '#005CA9',
  bb: '#F8D117',
  inter: '#FF7A00',
  bradesco: '#CC092F'
};

function EmprestimosPage() {
  const location = useLocation();
  const [banksData, setBanksData] = useState([]);
  const [loansData, setLoansData] = useState([]);
  const [creditJourney, setCreditJourney] = useState(location.state?.creditJourney || null);
  const [creditJourneyLoading, setCreditJourneyLoading] = useState(false);
  const [amount, setAmount] = useState([10000]);
  const [type, setType] = useState('Todos');
  const [score, setScore] = useState('Todos');
  const [term, setTerm] = useState([24]);
  const [sort, setSort] = useState('taxa-baixa');
  const [viewMode, setViewMode] = useState('grid');
  const affiliatePlacements = useAffiliatePlacements({ pageSlug: '/emprestimos', productType: 'loan' });
  const belowHeroSupersimOffer = getSupersimOffer(affiliatePlacements.below_hero || []);
  const belowHeroOtherOffers = getNonSupersimOffers(affiliatePlacements.below_hero || []);
  const midContentOffer = affiliatePlacements.mid_content?.[0] || null;
  const beforeFaqSupersimOffer = getSupersimOffer(affiliatePlacements.before_faq || []);
  const beforeFaqOtherOffers = getNonSupersimOffers(affiliatePlacements.before_faq || []);
  const sidebarOffer = affiliatePlacements.sidebar?.[0] || null;

  useEffect(() => {
    Promise.all([portalApi.getBanks(), portalApi.getOffers({ productType: 'loan' })]).then(([banks, offers]) => {
      setBanksData(banks);
      setLoansData(offers);
    });
  }, []);

  useEffect(() => {
    const simulationId = new URLSearchParams(location.search).get('credit_simulation_id');
    if (!simulationId) return;
    if (creditJourney?.simulation?.id === simulationId) return;

    let ignore = false;
    setCreditJourneyLoading(true);

    portalApi
      .getCreditSimulation(simulationId)
      .then((result) => {
        if (!ignore) setCreditJourney(result);
      })
      .catch(() => {
        if (!ignore) toast.error('Não foi possível carregar a simulação personalizada.');
      })
      .finally(() => {
        if (!ignore) setCreditJourneyLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [creditJourney?.simulation?.id, location.search]);

  const filteredLoans = useMemo(() => {
    let result = loansData.filter((loan) => {
      const matchValue = amount[0] >= loan.minValue && amount[0] <= loan.maxValue;
      const matchType = type === 'Todos' || loan.category === type;
      const matchScore =
        score === 'Todos' ||
        loan.minScore === score ||
        (score === 'Alto' && (loan.minScore === 'Medio' || loan.minScore === 'Baixo')) ||
        (score === 'Medio' && loan.minScore === 'Baixo');
      const matchTerm = term[0] >= loan.minTerm && term[0] <= loan.maxTerm;

      return matchValue && matchType && matchScore && matchTerm;
    });

    if (sort === 'taxa-baixa') result = [...result].sort((a, b) => a.monthlyRate - b.monthlyRate);
    if (sort === 'valor-maximo') result = [...result].sort((a, b) => b.maxValue - a.maxValue);
    if (sort === 'prazo-maior') result = [...result].sort((a, b) => b.maxTerm - a.maxTerm);

    return result;
  }, [amount, loansData, score, sort, term, type]);

  const bestRate = useMemo(() => {
    if (!filteredLoans.length) return null;
    const minRate = Math.min(...filteredLoans.map((item) => item.monthlyRate));
    return Number.isFinite(minRate) ? minRate.toFixed(2) : null;
  }, [filteredLoans]);

  const getBadge = (loanType, rate) => {
    if (rate < 2) return { icon: Star, text: 'Melhor taxa' };
    if (loanType === 'Negativado') return { icon: ShieldCheck, text: 'Sem consulta dura' };
    return { icon: Sparkles, text: 'Mais aderente' };
  };

  const handleSimulate = async (loan) => {
    const bank = banksData.find((item) => item.id === loan.bankId);
    const destinationUrl = bank?.website ? `https://${bank.website}` : 'https://finance.cotejuros.com.br/quiz';

    await trackingService.trackOfferClick({
      sourcePage: '/emprestimos',
      offerId: loan.id,
      target: destinationUrl,
      productType: 'loan',
      partnerId: loan.bankId,
      metadata: { monthlyRate: loan.monthlyRate }
    });

    const redirect = await partnerRedirectService.create({
      partnerId: loan.bankId,
      offerId: loan.id,
      destinationUrl,
      sourcePage: '/emprestimos',
      productType: 'loan'
    });

    toast.success(`Oferta registrada para ${loan.bankName}.`);
    window.location.href = redirect.resolvedUrl;
  };

  const handleCreditOfferClick = async (offer) => {
    try {
      const utm = Object.fromEntries(new URLSearchParams(window.location.search).entries());
      const tracking = await portalApi.trackCreditOfferClick({
        offerId: offer.id,
        sourcePage: '/emprestimos',
        utm
      });

      const destinationUrl = tracking?.redirectUrl || offer.redirectUrl;
      if (!destinationUrl) {
        toast.error('Essa oferta ainda não possui link de contratação disponível.');
        return;
      }

      toast.success(`Oferta registrada para ${offer.bankName}.`);
      window.location.href = destinationUrl;
    } catch (error) {
      toast.error(error.message || 'Não foi possível continuar para a oferta.');
    }
  };

  const resetFilters = () => {
    setAmount([10000]);
    setType('Todos');
    setScore('Todos');
    setTerm([24]);
    setSort('taxa-baixa');
  };

  const handleAffiliateClick = async (offer, position) => {
    try {
      const result = await affiliateRedirectService.create({
        offerSlug: offer.offerSlug,
        pageSlug: '/emprestimos',
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

  return (
    <>
      <Helmet>
        <title>Comparador de empréstimos - Cote Juros</title>
        <meta
          name="description"
          content="Compare taxa, prazo e valor máximo para encontrar o empréstimo mais aderente ao seu perfil."
        />
      </Helmet>

      <PageHero
        badge="Comparador de empréstimos"
        title="Compare empréstimos com foco em taxa e custo total."
        subtitle="Veja em poucos segundos as ofertas que cabem no seu momento e entenda o custo real antes de contratar."
      >
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link to="/diagnostico-financeiro">
            <Button size="lg">Analisar perfil completo</Button>
          </Link>
          <a href="#resultados-emprestimos">
            <Button size="lg" variant="outline">Ver ofertas agora</Button>
          </a>
        </div>
      </PageHero>

      <section className="border-b border-border bg-background-secondary py-8">
        <div className="page-shell grid gap-4 md:grid-cols-4">
          <div className="interactive-card px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Valor em análise</p>
            <p className="mt-2 text-xl font-semibold tracking-[-0.03em] text-foreground">R$ {amount[0].toLocaleString('pt-BR')}</p>
          </div>
          <div className="interactive-card px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Prazo selecionado</p>
            <p className="mt-2 text-xl font-semibold tracking-[-0.03em] text-foreground">{term[0]} meses</p>
          </div>
          <div className="interactive-card px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Melhor taxa atual</p>
            <p className="mt-2 text-xl font-semibold tracking-[-0.03em] text-primary">{bestRate ? `${bestRate}% a.m.` : '--'}</p>
          </div>
          <div className="interactive-card px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Ofertas visíveis</p>
            <p className="mt-2 text-xl font-semibold tracking-[-0.03em] text-foreground">{filteredLoans.length}</p>
          </div>
        </div>
      </section>

      {(belowHeroSupersimOffer || belowHeroOtherOffers.length) ? (
        <div className="page-shell space-y-6 py-8">
          {belowHeroSupersimOffer ? (
            <SuperSimOfferCard
              offer={belowHeroSupersimOffer}
              title="SuperSim como recomendacao editorial"
              description="Uma leitura objetiva para quem quer avancar para a simulacao sem sair do contexto do comparador de emprestimos."
              onSelect={(offer) => handleAffiliateClick(offer, 'below_hero')}
            />
          ) : null}

          {belowHeroOtherOffers.length ? (
            <AffiliateOfferGrid
              offers={belowHeroOtherOffers}
              title="Opções relacionadas para comparar com mais contexto"
              eyebrow="Veja condições"
              onSelect={(offer) => handleAffiliateClick(offer, 'below_hero')}
            />
          ) : null}
        </div>
      ) : null}

      <div className="page-shell py-12" id="resultados-emprestimos">
        {creditJourneyLoading ? (
          <div className="mb-8 rounded-[20px] border border-border bg-white px-8 py-10 shadow-[var(--shadow-sm)]">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">Simulação personalizada</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-foreground">Carregando suas ofertas reais...</h2>
          </div>
        ) : null}

        {creditJourney?.offers?.length ? (
          <section className="mb-10 rounded-[24px] border border-primary/15 bg-white p-8 shadow-[var(--shadow-md)]">
            <div className="flex flex-col gap-4 border-b border-border pb-6 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Jornada real de crédito</p>
                <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-foreground">Ofertas personalizadas para o seu perfil</h2>
                <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
                  Resultado da simulação {creditJourney.simulation?.provider === 'catalog_fallback' ? 'em fallback local' : 'integrada ao provedor'} com ofertas já normalizadas pela Cote Juros.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-[14px] border border-border bg-background-secondary px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Valor solicitado</p>
                  <p className="mt-1 text-sm font-semibold text-foreground">
                    {creditJourney.simulation?.requestedAmount ? `R$ ${Number(creditJourney.simulation.requestedAmount).toLocaleString('pt-BR')}` : '--'}
                  </p>
                </div>
                <div className="rounded-[14px] border border-border bg-background-secondary px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Parcelas</p>
                  <p className="mt-1 text-sm font-semibold text-foreground">{creditJourney.simulation?.installments || '--'}x</p>
                </div>
                <div className="rounded-[14px] border border-border bg-background-secondary px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Ofertas</p>
                  <p className="mt-1 text-sm font-semibold text-foreground">{creditJourney.offers.length}</p>
                </div>
              </div>
            </div>

            <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {creditJourney.offers.map((offer, index) => (
                <Card key={offer.id} className="surface-card h-full border-border bg-white">
                  <CardContent className="flex h-full flex-col gap-6 p-8">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{offer.provider === 'catalog_fallback' ? 'Fallback' : 'Marketplace'}</p>
                        <p className="mt-2 text-lg font-semibold text-foreground">{offer.bankName}</p>
                        <p className="text-sm text-muted-foreground">{offer.productName}</p>
                      </div>
                      <Badge variant={index === 0 ? 'default' : 'outline'} className={index === 0 ? 'border-0' : 'border-primary/25 bg-primary/10 text-primary'}>
                        {offer.matchLabel}
                      </Badge>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Taxa mensal</p>
                        <p className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-primary">
                          {offer.monthlyRate != null ? `${offer.monthlyRate}%` : '--'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">CET</p>
                        <p className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-foreground">
                          {offer.cet != null ? `${offer.cet}%` : '--'}
                        </p>
                      </div>
                    </div>

                    <div className="rounded-[14px] border border-border bg-background-secondary p-4">
                      <div className="grid gap-4 sm:grid-cols-3">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Valor aprovado</p>
                          <p className="mt-1 text-sm font-semibold text-foreground">
                            {offer.approvedAmount != null ? `R$ ${offer.approvedAmount.toLocaleString('pt-BR')}` : '--'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Parcela</p>
                          <p className="mt-1 text-sm font-semibold text-foreground">
                            {offer.installmentAmount != null ? `R$ ${offer.installmentAmount.toLocaleString('pt-BR')}` : '--'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Prazo</p>
                          <p className="mt-1 text-sm font-semibold text-foreground">{offer.termMonths ? `${offer.termMonths} meses` : '--'}</p>
                        </div>
                      </div>
                    </div>

                    <Button className="mt-auto w-full" onClick={() => handleCreditOfferClick(offer)}>
                      Continuar contratação <ChevronRight className="h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        ) : null}

        <div className="grid gap-8 lg:grid-cols-[300px_1fr]">
          <aside className="lg:sticky lg:top-24 lg:h-fit">
            <Card className="border-border bg-white shadow-[var(--shadow-sm)]">
              <CardContent className="space-y-8 p-8">
                <div className="flex items-center justify-between border-b border-border pb-4">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-primary" />
                    <h3 className="text-lg">Filtros da comparação</h3>
                  </div>
                  <button type="button" onClick={resetFilters} className="text-sm font-medium text-primary hover:text-primary-hover">
                    Limpar
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="flex items-end justify-between">
                    <Label>Valor desejado</Label>
                    <span className="text-sm font-semibold text-foreground">R$ {amount[0].toLocaleString('pt-BR')}</span>
                  </div>
                  <Slider value={amount} onValueChange={setAmount} max={500000} min={1000} step={1000} />
                </div>

                <div className="space-y-3">
                  <Label>Tipo de crédito</Label>
                  <Select value={type} onValueChange={setType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Todos">Todos os tipos</SelectItem>
                      <SelectItem value="Pessoal">Pessoal</SelectItem>
                      <SelectItem value="Consignado">Consignado</SelectItem>
                      <SelectItem value="Garantia">Com garantia</SelectItem>
                      <SelectItem value="Negativado">Negativado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-4">
                  <div className="flex items-end justify-between">
                    <Label>Prazo</Label>
                    <span className="text-sm font-semibold text-foreground">{term[0]} meses</span>
                  </div>
                  <Slider value={term} onValueChange={setTerm} max={84} min={6} step={1} />
                </div>

                <div className="space-y-3">
                  <Label>Score aproximado</Label>
                  <RadioGroup value={score} onValueChange={setScore} className="space-y-3">
                    {['Todos', 'Alto', 'Medio', 'Baixo'].map((item) => (
                      <label key={item} className="flex items-center gap-3 rounded-[10px] border border-border px-4 py-3 hover:bg-background-secondary">
                        <RadioGroupItem value={item} />
                        <span className="text-sm text-foreground">
                          {item === 'Todos' ? 'Não sei' : item === 'Medio' ? 'Médio' : item}
                        </span>
                      </label>
                    ))}
                  </RadioGroup>
                </div>
              </CardContent>
            </Card>

            {sidebarOffer ? (
              <div className="mt-6">
                {getSupersimOffer([sidebarOffer]) ? (
                  <SuperSimSidebarCard
                    offer={sidebarOffer}
                    onSelect={(offer) => handleAffiliateClick(offer, 'sidebar')}
                  />
                ) : (
                  <AffiliateSidebarWidget
                    offer={sidebarOffer}
                    onSelect={(offer) => handleAffiliateClick(offer, 'sidebar')}
                  />
                )}
              </div>
            ) : null}
          </aside>

          <section>
            <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <p className="text-sm text-muted-foreground">
                {filteredLoans.length} oferta(s) organizadas para facilitar sua decisão.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <div className="inline-flex items-center rounded-[10px] border border-border bg-white p-1">
                  <Button
                    type="button"
                    size="sm"
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    className="h-8 gap-1.5 px-3"
                    onClick={() => setViewMode('grid')}
                  >
                    <LayoutGrid className="h-3.5 w-3.5" />
                    Cards
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    className="h-8 gap-1.5 px-3"
                    onClick={() => setViewMode('list')}
                  >
                    <List className="h-3.5 w-3.5" />
                    Lista
                  </Button>
                </div>
                <Label className="whitespace-nowrap">Ordenar</Label>
                <Select value={sort} onValueChange={setSort}>
                  <SelectTrigger className="w-[220px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="taxa-baixa">Menor taxa</SelectItem>
                    <SelectItem value="valor-maximo">Maior valor</SelectItem>
                    <SelectItem value="prazo-maior">Maior prazo</SelectItem>
                  </SelectContent>
                </Select>
                <Link to="/diagnostico-financeiro">
                  <Button variant="outline">Analisar perfil</Button>
                </Link>
              </div>
            </div>

            {viewMode === 'grid' ? (
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {filteredLoans.map((loan) => {
                  const bank = banksData.find((item) => item.id === loan.bankId);
                  const badge = getBadge(loan.category, loan.monthlyRate);
                  const BadgeIcon = badge.icon;
                  const bankAccent = bank?.color || bankAccentById[loan.bankId] || '#2563EB';

                  return (
                    <Card key={loan.id} className="surface-card h-full border-border bg-white">
                      <CardContent className="flex h-full flex-col gap-6 p-8">
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-2">
                            <div
                              className="flex h-11 w-11 items-center justify-center rounded-xl border text-sm font-semibold"
                              style={{
                                borderColor: `${bankAccent}40`,
                                backgroundColor: `${bankAccent}1A`,
                                color: bankAccent
                              }}
                            >
                              {bank?.name?.charAt(0) || 'B'}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-foreground">{bank?.name || loan.bankName}</p>
                              <p className="text-sm text-muted-foreground">{loan.category}</p>
                            </div>
                          </div>
                          <Badge variant="outline" className="gap-1 border-primary/25 bg-primary/10 text-primary">
                            <BadgeIcon className="h-3 w-3" />
                            {badge.text}
                          </Badge>
                        </div>

                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Taxa mensal</p>
                          <p className="mt-2 text-4xl font-semibold tracking-[-0.05em] text-primary">{loan.monthlyRate}%</p>
                        </div>

                        <div className="rounded-[12px] border border-border bg-background-secondary p-4">
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Resumo da oferta</p>
                          <p className="mt-2 text-sm text-muted-foreground">
                            {loan.monthlyRate < 2
                              ? 'Uma das menores taxas dentro do filtro que você escolheu.'
                              : 'Boa opção para quem busca aprovação e parcelas previsíveis.'}
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4 border-t border-border pt-4">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Valor máximo</p>
                            <p className="mt-2 text-sm font-semibold text-foreground">R$ {(loan.maxValue / 1000).toFixed(0)}k</p>
                          </div>
                          <div>
                            <p className="flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              Prazo
                            </p>
                            <p className="mt-2 text-sm font-semibold text-foreground">{loan.maxTerm} meses</p>
                          </div>
                        </div>

                        <Button className="mt-auto w-full" onClick={() => handleSimulate(loan)}>
                          Simular oferta <ChevronRight className="h-4 w-4" />
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredLoans.map((loan) => {
                  const bank = banksData.find((item) => item.id === loan.bankId);
                  const badge = getBadge(loan.category, loan.monthlyRate);
                  const BadgeIcon = badge.icon;
                  const bankAccent = bank?.color || bankAccentById[loan.bankId] || '#2563EB';

                  return (
                    <Card key={loan.id} className="border-border bg-white">
                      <CardContent className="p-6">
                        <div className="grid items-center gap-5 lg:grid-cols-[1.3fr_0.9fr_0.9fr_220px]">
                          <div className="flex items-start gap-4">
                            <div
                              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border text-sm font-semibold"
                              style={{
                                borderColor: `${bankAccent}40`,
                                backgroundColor: `${bankAccent}1A`,
                                color: bankAccent
                              }}
                            >
                              {bank?.name?.charAt(0) || 'B'}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-foreground">{bank?.name || loan.bankName}</p>
                              <p className="text-sm text-muted-foreground">{loan.category}</p>
                              <Badge variant="outline" className="mt-2 gap-1 border-primary/25 bg-primary/10 text-primary">
                                <BadgeIcon className="h-3 w-3" />
                                {badge.text}
                              </Badge>
                            </div>
                          </div>

                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Taxa mensal</p>
                            <p className="mt-1 text-2xl font-semibold tracking-[-0.04em] text-primary">{loan.monthlyRate}%</p>
                          </div>

                          <div className="grid gap-2">
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Valor máximo</p>
                              <p className="mt-1 text-sm font-semibold text-foreground">R$ {(loan.maxValue / 1000).toFixed(0)}k</p>
                            </div>
                            <div>
                              <p className="flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                Prazo
                              </p>
                              <p className="mt-1 text-sm font-semibold text-foreground">{loan.maxTerm} meses</p>
                            </div>
                          </div>

                          <Button className="w-full lg:justify-center" onClick={() => handleSimulate(loan)}>
                            Simular oferta <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            {filteredLoans.length === 0 ? (
              <div className="rounded-[16px] border border-dashed border-border bg-background-secondary px-6 py-16 text-center">
                <h3 className="text-2xl">Nenhuma oferta encontrada.</h3>
                <p className="mt-3 text-muted-foreground">Ajuste valor, prazo ou score para ampliar a comparação.</p>
                <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
                  <Button variant="outline" onClick={resetFilters}>
                    Limpar filtros
                  </Button>
                  <Link to="/diagnostico-financeiro">
                    <Button>Analisar perfil completo</Button>
                  </Link>
                </div>
              </div>
            ) : null}

            {midContentOffer ? (
              <div className="mt-8">
                {getSupersimOffer([midContentOffer]) ? (
                  <SuperSimInlineCTA
                    offer={midContentOffer}
                    title="Antes de contratar, vale comparar a SuperSim"
                    onSelect={(offer) => handleAffiliateClick(offer, 'mid_content')}
                  />
                ) : (
                  <AffiliateInlineCTA
                    offer={midContentOffer}
                    title="Antes de contratar, veja uma alternativa para comparar"
                    onSelect={(offer) => handleAffiliateClick(offer, 'mid_content')}
                  />
                )}
              </div>
            ) : null}
          </section>
        </div>
      </div>

      <section className="border-t border-border bg-background-secondary py-16">
        <div className="page-shell">
          {(beforeFaqSupersimOffer || beforeFaqOtherOffers.length) ? (
            <div className="mb-8 space-y-6">
              {beforeFaqSupersimOffer ? (
                <SuperSimOfferCard
                  offer={beforeFaqSupersimOffer}
                  title="SuperSim antes da decisao final"
                  description="Bloco editorial para quem ja comparou ofertas e quer seguir para uma simulacao com CTA claro e badges visuais."
                  onSelect={(offer) => handleAffiliateClick(offer, 'before_faq')}
                />
              ) : null}

              {beforeFaqOtherOffers.length ? (
                <AffiliateOfferGrid
                  offers={beforeFaqOtherOffers}
                  title="Mais condições para você analisar antes da decisão final"
                  eyebrow="Compare opções"
                  onSelect={(offer) => handleAffiliateClick(offer, 'before_faq')}
                />
              ) : null}
            </div>
          ) : null}

          <div className="mx-auto max-w-4xl rounded-[20px] border border-primary/20 bg-white px-8 py-10 text-center shadow-[var(--shadow-sm)]">
            <h2 className="mb-3">Quer acelerar sua escolha com mais segurança?</h2>
            <p className="mx-auto mb-7 max-w-2xl text-muted-foreground">
              O diagnóstico cruza seu perfil com as melhores linhas para destacar opções com mais chance de aprovação e custo menor.
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

export default EmprestimosPage;


