import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, ChevronRight, CreditCard, Filter, LayoutGrid, List } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import PageHero from '@/components/PageHero.jsx';
import SeoHead from '@/components/SeoHead.jsx';
import QuickCreditFlowModal from '@/components/QuickCreditFlowModal.jsx';
import { portalApi } from '@/platform/services/portalApi.js';
import { brandPages, homeBreadcrumb } from '@/seo/brandSeo.js';

const bankCardImages = {
  nubank: '/assets/cards/nubank-card.svg',
  itau: '/assets/cards/itau-card.svg',
  santander: '/assets/cards/santander-card.svg',
  c6: '/assets/cards/c6-card.svg',
  inter: '/assets/cards/inter-card.svg',
  bradesco: '/assets/cards/bradesco-card.svg',
  bb: '/assets/cards/bb-card.svg'
};

const normalizeBankKey = (value = '') =>
  String(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

const resolveCardImage = (card) => {
  const bankName = normalizeBankKey(card?.bankName);
  if (bankName.includes('nubank')) return bankCardImages.nubank;
  if (bankName.includes('itau')) return bankCardImages.itau;
  if (bankName.includes('santander')) return bankCardImages.santander;
  if (bankName.includes('c6')) return bankCardImages.c6;
  if (bankName.includes('inter')) return bankCardImages.inter;
  if (bankName.includes('bradesco')) return bankCardImages.bradesco;
  if (bankName.includes('banco do brasil') || bankName.includes('bb')) return bankCardImages.bb;
  return card?.image;
};

const resolveCardPalette = (card) => {
  const bankName = normalizeBankKey(card?.bankName);
  if (bankName.includes('nubank')) return ['#6D28D9', '#8B5CF6'];
  if (bankName.includes('itau')) return ['#EA580C', '#F97316'];
  if (bankName.includes('santander')) return ['#B91C1C', '#EF4444'];
  if (bankName.includes('c6')) return ['#0F172A', '#334155'];
  if (bankName.includes('caixa')) return ['#2563EB', '#60A5FA'];
  if (bankName.includes('inter')) return ['#EA580C', '#FDBA74'];
  return ['#5B6CFF', '#9AA8FF'];
};

const resolveOfferLink = (card = {}) => {
  const rawLink = card.partnerTrackingUrl || card.redirectUrl || '';
  if (!rawLink) return '';
  if (rawLink.startsWith('/') || /^https?:\/\//i.test(rawLink)) return rawLink;
  return `https://${rawLink}`;
};

function CartoesPage() {
  const [cardsData, setCardsData] = useState([]);
  const [quickModalOpen, setQuickModalOpen] = useState(false);
  const [freeAnnuity, setFreeAnnuity] = useState(false);
  const [categories, setCategories] = useState({ Premium: false, Intermediario: false, Basico: false });
  const [benefits, setBenefits] = useState({ Cashback: false, Milhas: false, VIP: false });
  const [sort, setSort] = useState('limite-maior');
  const [viewMode, setViewMode] = useState('grid');
  const categoryOptions = [
    { value: 'Premium', label: 'Premium' },
    { value: 'Intermediario', label: 'Intermediário' },
    { value: 'Basico', label: 'Básico' }
  ];

  useEffect(() => {
    portalApi.getOffers({ productType: 'credit_card' }).then((items) => {
      setCardsData(Array.isArray(items) ? items : []);
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

  const freeCardsCount = useMemo(() => cardsData.filter((item) => item.annualFee === 0).length, [cardsData]);

  const bestLimit = useMemo(() => {
    if (!filteredCards.length) return 0;
    return Math.max(...filteredCards.map((item) => item.maxLimit || 0));
  }, [filteredCards]);

  const openInternalFlow = () => {
    setQuickModalOpen(true);
  };

  return (
    <>
      <SeoHead
        title={brandPages.cartoes.title}
        description={brandPages.cartoes.description}
        path={brandPages.cartoes.path}
        breadcrumbs={[homeBreadcrumb, { name: 'Cartões', path: brandPages.cartoes.path }]}
      />

      <PageHero
        breadcrumbs={[homeBreadcrumb, { name: 'Cartões', path: brandPages.cartoes.path }]}
        className="cards-page-hero"
        eyebrow="Cartões"
        badge="Compare antes de contratar"
        title="Veja opções de cartão com mais clareza antes de decidir."
        subtitle="Compare anuidade, limite e benefícios para entender o que faz sentido para o seu perfil."
      >
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button size="lg" className="cards-page-primary-btn" onClick={openInternalFlow}>Ver minhas opções agora</Button>
          <a href="#resultados-cartoes">
            <Button size="lg" variant="outline" className="cards-page-secondary-btn">Ver comparação</Button>
          </a>
        </div>
      </PageHero>

      <section className="cards-page-metrics-section border-b border-border bg-background-secondary py-10">
        <div className="page-shell grid gap-4 md:grid-cols-4">
          <div className="cards-metric-card interactive-card px-5 py-5">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Cartões no comparador</p>
            <p className="mt-2 text-xl font-medium tracking-[-0.03em] text-foreground">{cardsData.length}</p>
          </div>
          <div className="cards-metric-card interactive-card px-5 py-5">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Sem anuidade</p>
            <p className="cards-metric-value mt-2 text-xl font-medium tracking-[-0.03em]">{freeCardsCount}</p>
          </div>
          <div className="cards-metric-card interactive-card px-5 py-5">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Maior limite estimado</p>
            <p className="mt-2 text-xl font-medium tracking-[-0.03em] text-foreground">R$ {(bestLimit / 1000).toFixed(0)}k</p>
          </div>
          <div className="cards-metric-card interactive-card px-5 py-5">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Opções visíveis</p>
            <p className="mt-2 text-xl font-medium tracking-[-0.03em] text-foreground">{filteredCards.length}</p>
          </div>
        </div>
      </section>

      <div className="page-shell cards-page-shell py-14" id="resultados-cartoes">
        <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
          <aside className="cards-filters lg:sticky lg:top-24 lg:h-fit">
            <Card className="cards-filter-card border-border bg-white shadow-[var(--shadow-sm)]">
              <CardContent className="space-y-8 p-8">
                <div className="cards-filter-header flex items-center gap-2 border-b border-border pb-4">
                  <Filter className="cards-filter-icon h-4 w-4" />
                  <h3 className="cards-filter-title text-lg">Filtros da comparação</h3>
                </div>

                <div className="cards-filter-row flex items-center justify-between gap-4">
                  <Label htmlFor="free-annuity">Mostrar só cartões sem anuidade</Label>
                  <Switch id="free-annuity" className="cards-page-switch" checked={freeAnnuity} onCheckedChange={setFreeAnnuity} />
                </div>

                <div className="space-y-4">
                  <Label>Categoria</Label>
                  <div className="space-y-3">
                    {categoryOptions.map((item) => (
                      <label key={item.value} className="cards-filter-option flex items-center gap-3 rounded-[14px] border border-border px-4 py-3 transition-colors duration-300 hover:bg-background-secondary">
                        <Checkbox
                          className="cards-page-checkbox"
                          checked={categories[item.value]}
                          onCheckedChange={(checked) => setCategories((previous) => ({ ...previous, [item.value]: Boolean(checked) }))}
                        />
                        <span className="text-sm text-foreground">{item.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <Label>Benefícios</Label>
                  <div className="space-y-3">
                    {['Cashback', 'Milhas', 'VIP'].map((item) => (
                      <label key={item} className="cards-filter-option flex items-center gap-3 rounded-[14px] border border-border px-4 py-3 transition-colors duration-300 hover:bg-background-secondary">
                        <Checkbox
                          className="cards-page-checkbox"
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
            <div className="mb-7 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <p className="cards-results-copy text-sm text-muted-foreground">{filteredCards.length} cartão(ões) visíveis na comparação.</p>
              <div className="flex flex-wrap items-center gap-3">
                <div className="catalog-view-toggle" role="tablist" aria-label="Modo de visualização dos cartões">
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className={`catalog-view-toggle-option ${viewMode === 'grid' ? 'is-active' : ''}`}
                    onClick={() => setViewMode('grid')}
                  >
                    <LayoutGrid className="h-3.5 w-3.5" />
                    Em cards
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className={`catalog-view-toggle-option ${viewMode === 'list' ? 'is-active' : ''}`}
                    onClick={() => setViewMode('list')}
                  >
                    <List className="h-3.5 w-3.5" />
                    Em lista
                  </Button>
                </div>
                <Label className="whitespace-nowrap">Ordenar</Label>
                <Select value={sort} onValueChange={setSort}>
                  <SelectTrigger className="cards-select-trigger w-[220px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="cards-select-content">
                    <SelectItem className="cards-select-item" value="limite-maior">Maior limite</SelectItem>
                    <SelectItem className="cards-select-item" value="anuidade-menor">Menor anuidade</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" className="cards-page-secondary-btn" onClick={openInternalFlow}>Ver opções para meu perfil</Button>
              </div>
            </div>

            {viewMode === 'grid' ? (
              <div className="grid gap-6 md:grid-cols-2">
                {filteredCards.map((card) => {
                  const isFree = card.annualFee === 0;
                  const cardImage = resolveCardImage(card);
                  const hasPremiumAsset = Boolean(cardImage?.startsWith('/assets/cards/'));
                  const [toneA, toneB] = resolveCardPalette(card);
                  const offerLink = resolveOfferLink(card);

                  return (
                    <Card key={card.id} className="catalog-grid-card cards-offer-card surface-card h-full overflow-hidden border-border bg-white">
                      <div className="cards-offer-visual relative h-48 border-b border-border bg-slate-100">
                        <div className="cards-offer-glow absolute inset-0 bg-[radial-gradient(circle_at_12%_10%,rgba(148,163,184,0.2),transparent_46%)]" />
                        <div className="absolute inset-0 flex items-center justify-center p-4">
                          <div className="cards-card-media relative w-full max-w-[264px]">
                            {hasPremiumAsset ? (
                              <img
                                src={cardImage}
                                alt={card.title}
                                loading="eager"
                                decoding="sync"
                                draggable="false"
                                className="cards-card-art w-full rounded-2xl object-contain shadow-[0_16px_34px_rgba(15,23,42,0.28)]"
                              />
                            ) : (
                              <div
                                className="cards-card-art cards-fallback-art rounded-2xl border border-white/20 p-4 text-white shadow-[0_16px_34px_rgba(15,23,42,0.28)]"
                                style={{ background: `linear-gradient(135deg, ${toneA}, ${toneB})` }}
                              >
                                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/90 [text-shadow:0_1px_2px_rgba(0,0,0,0.5)]">
                                  {card.bankName}
                                </p>
                                <p className="mt-6 text-lg font-semibold leading-tight text-white [text-shadow:0_1px_3px_rgba(0,0,0,0.55)]">
                                  {card.title}
                                </p>
                                <p className="mt-8 text-[11px] uppercase tracking-[0.14em] text-white/90 [text-shadow:0_1px_2px_rgba(0,0,0,0.5)]">
                                  Crédito
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <CardContent className="catalog-grid-card__content cards-offer-content flex h-full flex-col gap-5 p-8">
                        <div className="cards-offer-bank border-b border-border pb-3">
                          <p className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-900">{card.bankName}</p>
                        </div>

                        <div className="cards-offer-badges flex items-center justify-between gap-3">
                          <Badge variant="outline" className="cards-offer-badge">{card.category}</Badge>
                          {isFree ? <Badge variant="secondary" className="cards-offer-badge-secondary">Sem anuidade</Badge> : null}
                        </div>

                        <div className="cards-offer-stats grid grid-cols-2 gap-4">
                          <div className="cards-offer-stat rounded-[14px] border border-border bg-background-secondary p-4">
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Anuidade</p>
                            <p className={`cards-offer-stat-value mt-2 text-sm font-medium ${isFree ? 'is-free' : 'text-foreground'}`}>
                              {isFree ? 'Grátis' : `R$ ${card.annualFee}/ano`}
                            </p>
                          </div>
                          <div className="cards-offer-stat rounded-[14px] border border-border bg-background-secondary p-4">
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Limite estimado</p>
                            <p className="cards-offer-stat-value mt-2 text-sm font-medium text-foreground">R$ {card.maxLimit / 1000}k</p>
                          </div>
                        </div>

                        <div className="cards-offer-benefits space-y-3">
                          {card.benefits?.slice(0, 3).map((benefit, index) => (
                            <div key={`${benefit}-${index}`} className="flex items-start gap-3">
                              <CheckCircle2 className="cards-benefit-icon mt-0.5 h-4 w-4" />
                              <p className="text-sm text-muted-foreground">{benefit}</p>
                            </div>
                          ))}
                        </div>

                        {offerLink ? (
                          <Button asChild className="catalog-card-cta mt-auto w-full">
                            <a href={offerLink} target="_blank" rel="noreferrer sponsored">
                              Ver cartão
                              <ChevronRight className="h-4 w-4" />
                            </a>
                          </Button>
                        ) : (
                          <Button className="catalog-card-cta mt-auto w-full" onClick={openInternalFlow}>
                            Ver cartão
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredCards.map((card) => {
                  const isFree = card.annualFee === 0;
                  const cardImage = resolveCardImage(card);
                  const hasPremiumAsset = Boolean(cardImage?.startsWith('/assets/cards/'));
                  const [toneA, toneB] = resolveCardPalette(card);
                  const offerLink = resolveOfferLink(card);

                  return (
                    <Card key={card.id} className="catalog-list-card cards-offer-list-card border-border bg-white shadow-[0_8px_20px_rgba(15,23,42,0.04)]">
                      <CardContent className="catalog-list-card__content p-7">
                        <div className="grid items-center gap-6 lg:grid-cols-[240px_1.55fr_220px]">
                          <div className="catalog-list-card__visual cards-offer-list-visual flex items-center justify-center rounded-[18px] border border-border bg-slate-50 p-5">
                            <div className="cards-card-media relative w-full max-w-[188px]">
                              {hasPremiumAsset ? (
                                <img
                                  src={cardImage}
                                  alt={card.title}
                                  loading="eager"
                                  decoding="sync"
                                  draggable="false"
                                  className="cards-card-art w-full rounded-2xl object-contain shadow-[0_14px_28px_rgba(15,23,42,0.22)]"
                                />
                              ) : (
                                <div
                                  className="cards-card-art cards-fallback-art rounded-2xl border border-white/20 p-4 text-white shadow-[0_14px_28px_rgba(15,23,42,0.22)]"
                                  style={{ background: `linear-gradient(135deg, ${toneA}, ${toneB})` }}
                                >
                                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/90">{card.bankName}</p>
                                  <p className="mt-4 text-base font-semibold leading-tight text-white">{card.title}</p>
                                  <p className="mt-6 text-[11px] uppercase tracking-[0.14em] text-white/90">Crédito</p>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="catalog-list-card__main space-y-5">
                            <div className="flex flex-wrap items-center gap-3">
                              <p className="text-lg font-semibold text-foreground">{card.bankName}</p>
                              <Badge variant="outline" className="cards-offer-badge">{card.category}</Badge>
                              {isFree ? <Badge variant="secondary" className="cards-offer-badge-secondary">Sem anuidade</Badge> : null}
                            </div>

                            <div className="catalog-list-card__meta-grid grid gap-4 sm:grid-cols-2">
                              <div className="catalog-list-card__stat">
                                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Anuidade</p>
                                <p className={`mt-2 text-sm font-medium ${isFree ? 'text-primary' : 'text-foreground'}`}>
                                  {isFree ? 'Grátis' : `R$ ${card.annualFee}/ano`}
                                </p>
                              </div>
                              <div className="catalog-list-card__stat">
                                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Limite estimado</p>
                                <p className="mt-2 text-sm font-medium text-foreground">R$ {card.maxLimit / 1000}k</p>
                              </div>
                            </div>

                            <div className="catalog-list-card__benefits cards-offer-benefits space-y-2">
                              {card.benefits?.slice(0, 3).map((benefit, index) => (
                                <div key={`${benefit}-${index}`} className="flex items-start gap-3">
                                  <CheckCircle2 className="cards-benefit-icon mt-0.5 h-4 w-4" />
                                  <p className="text-sm text-muted-foreground">{benefit}</p>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="catalog-list-card__actions flex items-center lg:justify-end">
                            {offerLink ? (
                              <Button asChild className="catalog-card-cta w-full lg:w-auto">
                                <a href={offerLink} target="_blank" rel="noreferrer sponsored">
                                  Ver cartão
                                  <ChevronRight className="h-4 w-4" />
                                </a>
                              </Button>
                            ) : (
                              <Button className="catalog-card-cta w-full lg:w-auto" onClick={openInternalFlow}>
                                Ver cartão
                                <ChevronRight className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            {filteredCards.length === 0 ? (
              <div className="cards-empty-state rounded-[20px] border border-dashed border-border bg-background-secondary px-6 py-16 text-center">
                <CreditCard className="mx-auto h-10 w-10 text-muted-foreground" />
                <h3 className="mt-4 text-2xl">Nenhum cartão encontrado.</h3>
                <p className="mt-3 text-muted-foreground">Reduza os filtros ativos para abrir mais opções.</p>
                <div className="mt-6">
                  <Button className="cards-page-primary-btn" onClick={openInternalFlow}>Ver minhas opções agora</Button>
                </div>
              </div>
            ) : null}
          </section>
        </div>
      </div>

      <section className="cards-page-cta-section cards-page-cta-section--light final-cta-section border-t border-border bg-background-secondary py-[4.5rem]">
        <div className="page-shell">
          <div className="cards-page-cta cards-page-cta--aligned final-cta-card mx-auto max-w-4xl rounded-[24px] border border-primary/20 bg-white px-8 py-11 text-center shadow-[var(--shadow-sm)]">
            <h2 className="cards-section-title cards-page-cta-title mb-3">Quer escolher um cartão com mais clareza?</h2>
            <p className="cards-page-cta-copy mx-auto mb-7 max-w-2xl text-muted-foreground">
              Responda o básico sobre o seu momento e veja caminhos que podem combinar melhor com o seu perfil, sem compromisso e sem cobrança antecipada.
            </p>
            <Button size="lg" onClick={openInternalFlow}>Ver minhas opções agora</Button>
          </div>
        </div>
      </section>

      <QuickCreditFlowModal
        isOpen={quickModalOpen}
        onClose={() => setQuickModalOpen(false)}
        sourcePage="/cartoes-de-credito"
        originLabel="cartoes"
      />
    </>
  );
}

export default CartoesPage;

