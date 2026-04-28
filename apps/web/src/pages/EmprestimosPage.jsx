import React, { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowUpRight, CheckCircle2, Filter, RotateCcw, ShieldCheck, SlidersHorizontal, Sparkles } from 'lucide-react';
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

const fallbackPartner = {
  id: 'supersim',
  slug: 'supersim',
  name: 'SuperSim',
  type: 'affiliate_link',
  mode: 'tracking_link',
  status: 'active',
  destinationUrl: 'https://susim.co/XQLX5t8rSqYxaWnPd7CQaw==',
  description: 'Opção de crédito pessoal online com análise conforme o perfil informado.',
  highlights: [
    'Processo online',
    'Pode ser alternativa para quem busca crédito rápido',
    'Condições sujeitas à análise do parceiro'
  ],
  ctaText: 'Ver condições',
  eventType: 'click_partner_supersim'
};

const normalizePartner = (partner = {}) => ({
  ...fallbackPartner,
  ...partner,
  id: partner.id || partner.slug || fallbackPartner.id,
  slug: partner.slug || partner.id || fallbackPartner.slug,
  destinationUrl: partner.destinationUrl || partner.url || fallbackPartner.destinationUrl,
  description:
    partner.id === 'supersim' || partner.slug === 'supersim'
      ? fallbackPartner.description
      : partner.description || 'Opção parceira para comparar condições de crédito antes de contratar.',
  highlights:
    partner.id === 'supersim' || partner.slug === 'supersim'
      ? fallbackPartner.highlights
      : Array.isArray(partner.highlights) && partner.highlights.length
        ? partner.highlights
        : ['Compare as condições', 'Confira custos e prazo', 'Sujeito à análise do parceiro'],
  ctaText: partner.ctaText || 'Ver condições',
  eventType: partner.eventType || `click_partner_${partner.slug || partner.id || 'partner'}`
});

const getOption = (items, value) => items.find((item) => item.value === value) || items[0];

function EmprestimosPage() {
  const location = useLocation();
  const quickLeadContext = location.state?.quickLeadContext || null;
  const [filters, setFilters] = useState({
    situation: 'unknown',
    amount: quickLeadContext?.amount ? 'custom' : 'unknown',
    creditType: 'personal',
    clientType: 'unknown',
    partner: 'all'
  });
  const [customAmount] = useState(quickLeadContext?.amount || null);
  const [recommendations, setRecommendations] = useState([fallbackPartner]);
  const [loading, setLoading] = useState(false);
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

  useEffect(() => {
    let ignore = false;
    setLoading(true);

    portalApi
      .matchCreditPartners(profile)
      .then((data) => {
        if (ignore) return;
        const items = Array.isArray(data?.recommendations) && data.recommendations.length
          ? data.recommendations
          : [fallbackPartner];
        setRecommendations(items.map(normalizePartner));
      })
      .catch(() => {
        if (!ignore) setRecommendations([fallbackPartner]);
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [profile]);

  const partnerOptions = useMemo(() => {
    const map = new Map();
    recommendations.forEach((partner) => {
      map.set(partner.id, partner.name);
    });
    if (!map.has('supersim')) map.set('supersim', 'SuperSim');
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
        eyebrow="Comparador de crédito"
        title="Compare opções de empréstimo para o seu perfil"
        subtitle="Filtre por valor, perfil e tipo de crédito para encontrar opções que podem fazer sentido antes de contratar."
      >
        <div className="flex flex-col gap-3 sm:flex-row">
          <a href="#comparador-emprestimos">
            <Button size="lg">
              Comparar opções
              <SlidersHorizontal className="h-4 w-4" />
            </Button>
          </a>
          <a href="#opcoes-emprestimos">
            <Button size="lg" variant="outline" className="hero-secondary-btn">Ver parceiros</Button>
          </a>
        </div>
      </PageHero>

      <section className="border-b border-border bg-white py-5">
        <div className="page-shell">
          <div className="flex flex-col gap-3 rounded-[18px] border border-slate-200 bg-slate-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
              <p className="text-sm leading-6 text-slate-700">
                A Cote Juros não é instituição financeira, não concede crédito diretamente e não garante aprovação. As condições são definidas pelos parceiros.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-background-secondary py-12" id="comparador-emprestimos">
        <div className="page-shell">
          <div className="grid gap-8 lg:grid-cols-[340px_1fr]">
            <aside className="lg:sticky lg:top-24 lg:h-fit">
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
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Com base no seu perfil</p>
                    <h2 className="mt-2 text-2xl font-medium tracking-[-0.025em] text-[#191F28]">Opções que podem fazer sentido</h2>
                    <p className="mt-2 max-w-2xl text-sm leading-7 text-muted-foreground">
                      Revise os filtros, compare as condições no parceiro e avance somente se fizer sentido para o seu momento.
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
                <div className="rounded-[22px] border border-border bg-white px-6 py-12 text-center shadow-[var(--shadow-sm)]">
                  <Sparkles className="mx-auto h-6 w-6 text-primary" />
                  <p className="mt-3 text-sm font-medium text-foreground">Atualizando recomendações...</p>
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
                            {index === 0 ? 'Opção padrão' : 'Ativo'}
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

              {!loading && !visiblePartners.length ? (
                <div className="rounded-[22px] border border-dashed border-border bg-white px-6 py-14 text-center">
                  <h3 className="text-2xl font-medium tracking-[-0.025em] text-foreground">Nenhuma opção encontrada.</h3>
                  <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-muted-foreground">
                    Ajuste os filtros ou limpe a seleção de parceiro para ampliar a comparação.
                  </p>
                  <Button className="mt-6" variant="outline" onClick={resetFilters}>Limpar filtros</Button>
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
