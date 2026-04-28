import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowUpRight, CheckCircle2, Filter, RotateCcw, Search, ShieldCheck, SlidersHorizontal, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import PageHero from '@/components/PageHero.jsx';
import SeoHead from '@/components/SeoHead.jsx';
import { partnerRedirectService } from '@/platform/services/partnerRedirectService.js';
import { portalApi } from '@/platform/services/portalApi.js';
import { brandPages, homeBreadcrumb } from '@/seo/brandSeo.js';
import { useSiteDisclaimers, disclaimerText } from '@/hooks/useSiteDisclaimers.js';
import { usePageContent } from '@/hooks/useSiteSettings.js';

const situationOptions = [
  { value: 'unknown', label: 'Não sei informar', negativado: null },
  { value: 'restricted', label: 'Para negativado', negativado: true },
  { value: 'clear', label: 'Sem restrição', negativado: false }
];

const amountOptions = [
  { value: 'unknown', label: 'Não informar', amount: null },
  { value: 'up-to-2000', label: 'Até R$ 2.000', amount: 2000 },
  { value: '2001-5000', label: 'R$ 2.001 a R$ 5.000', amount: 5000 },
  { value: '5001-10000', label: 'R$ 5.001 a R$ 10.000', amount: 10000 },
  { value: '10001-25000', label: 'R$ 10.001 a R$ 25.000', amount: 25000 },
  { value: 'above-25000', label: 'Acima de R$ 25.000', amount: 30000 }
];

const creditTypeOptions = [
  { value: 'any', label: 'Outros' },
  { value: 'personal', label: 'Empréstimo pessoal' },
  { value: 'payroll', label: 'Consignado' },
  { value: 'vehicle-secured', label: 'Com garantia de veículo' },
  { value: 'home-secured', label: 'Com garantia de imóvel' },
  { value: 'fgts', label: 'FGTS' }
];

const clientTypeOptions = [
  { value: 'unknown', label: 'Outro', employmentStatus: '' },
  { value: 'clt', label: 'CLT / assalariado', employmentStatus: 'clt' },
  { value: 'self-employed', label: 'Autônomo', employmentStatus: 'autonomo' },
  { value: 'mei', label: 'MEI', employmentStatus: 'mei' },
  { value: 'retired', label: 'Aposentado / pensionista', employmentStatus: 'aposentado' },
  { value: 'public-servant', label: 'Servidor público', employmentStatus: 'servidor_publico' },
  { value: 'unemployed', label: 'Desempregado', employmentStatus: 'desempregado' }
];

const DEFAULT_LOANS_CONTENT = {
  hero: {
    eyebrow: 'Comparador de credito',
    title: 'Compare opcoes de emprestimo para o seu perfil',
    subtitle: 'Filtre por valor, perfil e tipo de credito para encontrar opcoes que podem fazer sentido antes de contratar.',
    primaryCta: 'Comparar opcoes',
    secondaryCta: 'Ver parceiros'
  },
  results: {
    eyebrow: 'Com base no seu perfil',
    title: 'Opcoes que podem fazer sentido',
    subtitle: 'Revise os filtros, compare as condicoes no parceiro e avance somente se fizer sentido para o seu momento.',
    emptyTitle: 'Estamos analisando opcoes para o seu perfil',
    emptyText: 'Ainda nao encontramos uma combinacao ideal com base nos criterios atuais. Voce pode ajustar os filtros ou explorar outras possibilidades disponiveis.',
    adjustFiltersLabel: 'Ajustar filtros',
    availableOptionsLabel: 'Ver opcoes disponiveis',
    errorTitle: 'Nao foi possivel atualizar as opcoes agora',
    errorText: 'Tente novamente em instantes. A pagina continua disponivel para ajustar os filtros sem perder o contexto.',
    retryLabel: 'Tentar novamente'
  }
};

const normalizePartner = (partner = {}) => ({
  ...partner,
  id: partner.id || partner.slug || partner.configId,
  slug: partner.slug || partner.id || partner.configId,
  destinationUrl: partner.destinationUrl || partner.url || '',
  description: partner.description || 'Opcao parceira para comparar condicoes de credito antes de contratar.',
  highlights:
    Array.isArray(partner.highlights) && partner.highlights.length
      ? partner.highlights
      : ['Compare as condicoes', 'Confira custos e prazo', 'Sujeito a analise do parceiro'],
  ctaText: partner.ctaText || 'Ver condicoes',
  eventType: partner.eventType || `click_partner_${partner.slug || partner.id || 'partner'}`
});

const getOption = (items, value) => items.find((item) => item.value === value) || items[0];
const LOAN_FALLBACK_DISCLAIMER = 'A Cote Juros nao e instituicao financeira e nao garante aprovacao de credito. As condicoes sao definidas pelos parceiros.';

function EmprestimosPage() {
  const location = useLocation();
  const filtersRef = useRef(null);
  const content = usePageContent('loans', DEFAULT_LOANS_CONTENT);
  const loanDisclaimers = useSiteDisclaimers('emprestimos', [{
    key: 'not_bank',
    content: LOAN_FALLBACK_DISCLAIMER
  }]);
  const loanDisclaimer = disclaimerText(
    loanDisclaimers,
    'not_bank',
    LOAN_FALLBACK_DISCLAIMER
  );
  const quickLeadContext = location.state?.quickLeadContext || null;
  const [filters, setFilters] = useState({
    situation: 'unknown',
    amount: quickLeadContext?.amount ? 'custom' : 'unknown',
    creditType: 'personal',
    clientType: 'unknown',
    partner: 'all'
  });
  const [customAmount] = useState(quickLeadContext?.amount || null);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [matchError, setMatchError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [clickingPartnerId, setClickingPartnerId] = useState(null);

  const profile = useMemo(() => {
    const situation = getOption(situationOptions, filters.situation);
    const amount = filters.amount === 'custom'
      ? Number(customAmount || 0) || null
      : getOption(amountOptions, filters.amount).amount;
    const clientType = getOption(clientTypeOptions, filters.clientType);

    return {
      negativado: situation.negativado,
      renda: null,
      valor: amount,
      urgencia: amount && amount <= 5000 ? 'alta' : null,
      tipoCredito: filters.creditType,
      tipoCliente: filters.clientType,
      employmentStatus: clientType.employmentStatus
    };
  }, [customAmount, filters.amount, filters.clientType, filters.creditType, filters.situation]);

  const fetchRecommendations = useCallback(async ({ signal } = {}) => {
    setLoading(true);
    setMatchError('');

    try {
      const data = await portalApi.matchCreditPartners(profile, { throwOnError: true });
      if (signal?.aborted) return;
      const items = Array.isArray(data?.recommendations) ? data.recommendations : [];
      const activeItems = items
        .map(normalizePartner)
        .filter((partner) =>
          partner.id
          && partner.name
          && !['inactive', 'archived', 'disabled'].includes(String(partner.status || 'active').toLowerCase())
        );
      setRecommendations(activeItems);
    } catch (error) {
      if (signal?.aborted) return;
      setRecommendations([]);
      setMatchError(error?.message || 'Nao foi possivel carregar recomendacoes.');
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    const controller = new AbortController();
    fetchRecommendations({ signal: controller.signal });

    return () => {
      controller.abort();
    };
  }, [fetchRecommendations, refreshKey]);

  const partnerOptions = useMemo(() => {
    const map = new Map();
    recommendations.forEach((partner) => {
      map.set(partner.id, partner.name);
    });
    return Array.from(map.entries()).map(([value, label]) => ({ value, label }));
  }, [recommendations]);

  const visiblePartners = useMemo(() => {
    if (filters.partner === 'all') return recommendations;
    return recommendations.filter((partner) => partner.id === filters.partner || partner.slug === filters.partner);
  }, [filters.partner, recommendations]);

  const activeFilterLabels = useMemo(() => {
    const labels = [
      getOption(situationOptions, filters.situation).label,
      filters.amount === 'custom' && customAmount
        ? `R$ ${Number(customAmount).toLocaleString('pt-BR')}`
        : getOption(amountOptions, filters.amount).label,
      getOption(creditTypeOptions, filters.creditType).label,
      getOption(clientTypeOptions, filters.clientType).label
    ];
    if (filters.partner !== 'all') {
      labels.push(partnerOptions.find((item) => item.value === filters.partner)?.label || 'Parceiro');
    }
    return labels.filter(Boolean);
  }, [customAmount, filters, partnerOptions]);

  const updateFilter = (key, value) => {
    setFilters((current) => ({
      ...current,
      [key]: value
    }));
  };

  const resetFilters = () => {
    setFilters({
      situation: 'unknown',
      amount: customAmount ? 'custom' : 'unknown',
      creditType: 'personal',
      clientType: 'unknown',
      partner: 'all'
    });
  };

  const focusFilters = () => {
    filtersRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const showAvailableOptions = () => {
    setFilters({
      situation: 'unknown',
      amount: 'unknown',
      creditType: 'any',
      clientType: 'unknown',
      partner: 'all'
    });
    setRefreshKey((current) => current + 1);
  };

  const retryMatch = () => {
    setRefreshKey((current) => current + 1);
  };

  const handlePartnerClick = async (partner) => {
    if (!partner.destinationUrl) return;

    setClickingPartnerId(partner.id);
    try {
      await portalApi.trackIntegration({
        sourcePage: '/emprestimos',
        productContext: partner.eventType || `click_partner_${partner.id}`,
        simulationId: null
      });

      const redirect = await partnerRedirectService.create({
        partnerId: partner.id,
        destinationUrl: partner.destinationUrl,
        sourcePage: '/emprestimos',
        productType: 'loan',
        metadata: {
          eventType: partner.eventType || `click_partner_${partner.id}`,
          filters: profile
        }
      });

      window.location.href = redirect?.resolvedUrl || partner.destinationUrl;
    } catch {
      toast.error('Não foi possível registrar o clique agora, mas você ainda pode seguir.');
      window.location.href = partner.destinationUrl;
    }
  };

  return (
    <>
      <SeoHead
        title={brandPages.emprestimos.title}
        description={brandPages.emprestimos.description}
        path={brandPages.emprestimos.path}
        breadcrumbs={[homeBreadcrumb, { name: 'Empréstimos', path: brandPages.emprestimos.path }]}
      />

      <PageHero
        className="loans-page-hero"
        breadcrumbs={[homeBreadcrumb, { name: 'Empréstimos', path: brandPages.emprestimos.path }]}
        eyebrow={content.hero.eyebrow}
        title={content.hero.title}
        subtitle={content.hero.subtitle}
      >
        <div className="flex flex-col gap-3 sm:flex-row">
          <a href="#comparador-emprestimos">
            <Button size="lg">
              {content.hero.primaryCta}
              <SlidersHorizontal className="h-4 w-4" />
            </Button>
          </a>
          <a href="#opcoes-emprestimos">
            <Button size="lg" variant="outline" className="hero-secondary-btn">{content.hero.secondaryCta}</Button>
          </a>
        </div>
      </PageHero>

      <section className="border-b border-border bg-white py-5">
        <div className="page-shell">
          <div className="flex flex-col gap-3 rounded-[18px] border border-slate-200 bg-slate-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
              <p className="text-sm leading-6 text-slate-700">
                {loanDisclaimer}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-background-secondary py-12" id="comparador-emprestimos">
        <div className="page-shell">
          <div className="grid gap-8 lg:grid-cols-[340px_1fr]">
            <aside ref={filtersRef} className="scroll-mt-24 lg:sticky lg:top-24 lg:h-fit">
              <Card className="border-border bg-white shadow-[var(--shadow-sm)]">
                <CardContent className="space-y-6 p-7">
                  <div className="flex items-center justify-between border-b border-border pb-4">
                    <div className="flex items-center gap-2">
                      <Filter className="h-4 w-4 text-primary" />
                      <h2 className="text-lg font-medium text-foreground">Filtros</h2>
                    </div>
                    <button type="button" onClick={resetFilters} className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-primary-hover">
                      <RotateCcw className="h-3.5 w-3.5" />
                      Limpar
                    </button>
                  </div>

                  <div className="space-y-3">
                    <Label>Situação</Label>
                    <Select value={filters.situation} onValueChange={(value) => updateFilter('situation', value)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {situationOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <Label>Valor desejado</Label>
                    <Select value={filters.amount} onValueChange={(value) => updateFilter('amount', value)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {customAmount ? (
                          <SelectItem value="custom">R$ {Number(customAmount).toLocaleString('pt-BR')}</SelectItem>
                        ) : null}
                        {amountOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <Label>Tipo de crédito</Label>
                    <Select value={filters.creditType} onValueChange={(value) => updateFilter('creditType', value)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {creditTypeOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <Label>Tipo de cliente</Label>
                    <Select value={filters.clientType} onValueChange={(value) => updateFilter('clientType', value)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {clientTypeOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <Label>Parceiro</Label>
                    <Select value={filters.partner} onValueChange={(value) => updateFilter('partner', value)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos ativos</SelectItem>
                        {partnerOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </aside>

            <div id="opcoes-emprestimos" className="space-y-7">
              <div className="rounded-[24px] border border-border bg-white p-6 shadow-[var(--shadow-sm)]">
                <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">{content.results.eyebrow}</p>
                    <h2 className="mt-2 text-2xl font-medium tracking-[-0.025em] text-[#191F28]">{content.results.title}</h2>
                    <p className="mt-2 max-w-2xl text-sm leading-7 text-muted-foreground">
                      {content.results.subtitle}
                    </p>
                  </div>
                  <div className="rounded-[16px] border border-slate-200 bg-slate-50 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Parceiros exibidos</p>
                    <p className="mt-1 text-2xl font-semibold tracking-[-0.04em] text-slate-950">{visiblePartners.length}</p>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  {activeFilterLabels.map((label) => (
                    <Badge key={label} variant="outline" className="border-primary/20 bg-primary/5 text-primary">{label}</Badge>
                  ))}
                </div>
              </div>

              {loading ? (
                <div className="rounded-[24px] border border-slate-200 bg-white px-6 py-12 text-center shadow-[0_18px_54px_rgba(15,23,42,0.06)]">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/15 bg-primary/[0.06]">
                    <Sparkles className="h-5 w-5 text-primary" />
                  </div>
                  <p className="mt-4 text-sm font-semibold text-foreground">Atualizando recomendacoes...</p>
                  <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                    Estamos consultando as opcoes ativas para manter a comparacao alinhada ao seu perfil.
                  </p>
                </div>
              ) : null}

              {!loading && visiblePartners.length ? (
                <div className="grid gap-5 xl:grid-cols-2">
                  {visiblePartners.map((partner, index) => (
                    <Card key={partner.id} className="surface-card h-full border-border bg-white">
                      <CardContent className="flex h-full flex-col gap-6 p-7">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Parceiro</p>
                            <h3 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-foreground">{partner.name}</h3>
                          </div>
                          <Badge className={index === 0 ? 'border-0' : 'border-primary/25 bg-primary/10 text-primary'} variant={index === 0 ? 'default' : 'outline'}>
                            {index === 0 ? 'Opcao em destaque' : 'Ativo'}
                          </Badge>
                        </div>

                        <p className="text-sm leading-7 text-muted-foreground">{partner.description}</p>

                        <div className="grid gap-3">
                          {partner.highlights.map((highlight) => (
                            <div key={highlight} className="flex items-start gap-3 rounded-[14px] border border-slate-200 bg-slate-50 px-4 py-3">
                              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                              <span className="text-sm leading-6 text-slate-700">{highlight}</span>
                            </div>
                          ))}
                        </div>

                        <Button
                          className="mt-auto w-full"
                          onClick={() => handlePartnerClick(partner)}
                          disabled={clickingPartnerId === partner.id}
                        >
                          {clickingPartnerId === partner.id ? 'Abrindo...' : partner.ctaText}
                          <ArrowUpRight className="h-4 w-4" />
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : null}

              {!loading && matchError ? (
                <div className="mx-auto max-w-2xl rounded-[26px] border border-rose-100 bg-white px-6 py-12 text-center shadow-[0_20px_60px_rgba(15,23,42,0.07)] sm:px-10">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-rose-100 bg-rose-50">
                    <Search className="h-6 w-6 text-rose-500" />
                  </div>
                  <h3 className="mt-5 text-2xl font-medium tracking-[-0.025em] text-foreground">{content.results.errorTitle}</h3>
                  <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-muted-foreground">{content.results.errorText}</p>
                  <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
                    <Button onClick={retryMatch}>
                      {content.results.retryLabel}
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" onClick={focusFilters}>{content.results.adjustFiltersLabel}</Button>
                  </div>
                  <p className="mx-auto mt-6 max-w-xl text-xs leading-6 text-slate-500">{loanDisclaimer}</p>
                </div>
              ) : null}

              {!loading && !matchError && !visiblePartners.length ? (
                <div className="mx-auto max-w-2xl rounded-[26px] border border-slate-200 bg-white px-6 py-12 text-center shadow-[0_20px_60px_rgba(15,23,42,0.07)] sm:px-10">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/15 bg-primary/[0.06]">
                    <Search className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="mt-5 text-2xl font-medium tracking-[-0.025em] text-foreground">{content.results.emptyTitle}</h3>
                  <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-muted-foreground">{content.results.emptyText}</p>
                  <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
                    <Button variant="outline" onClick={focusFilters}>{content.results.adjustFiltersLabel}</Button>
                    <Button onClick={showAvailableOptions}>
                      {content.results.availableOptionsLabel}
                      <ArrowUpRight className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="mx-auto mt-6 max-w-xl text-xs leading-6 text-slate-500">{loanDisclaimer}</p>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export default EmprestimosPage;
