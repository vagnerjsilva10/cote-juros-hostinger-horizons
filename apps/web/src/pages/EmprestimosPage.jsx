import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { useLocation } from 'react-router-dom';
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
import { portalApi } from '@/platform/services/portalApi.js';
import QuickCreditFlowModal from '@/components/QuickCreditFlowModal.jsx';

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
  const [quickModalOpen, setQuickModalOpen] = useState(false);
  const [amount, setAmount] = useState([10000]);
  const [type, setType] = useState('Todos');
  const [score, setScore] = useState('Todos');
  const [term, setTerm] = useState([24]);
  const [sort, setSort] = useState('taxa-baixa');
  const [viewMode, setViewMode] = useState('grid');
  const quickLeadContext = location.state?.quickLeadContext || null;

  useEffect(() => {
    Promise.all([portalApi.getBanks(), portalApi.getOffers({ productType: 'loan' })]).then(([banks, offers]) => {
      setBanksData(Array.isArray(banks) ? banks : []);
      setLoansData(Array.isArray(offers) ? offers : []);
    });
  }, []);

  useEffect(() => {
    if (!quickLeadContext?.amount) return;
    setAmount([quickLeadContext.amount]);
  }, [quickLeadContext?.amount]);

  useEffect(() => {
    const simulationId = new URLSearchParams(location.search).get('credit_simulation_id');
    if (!simulationId || creditJourney?.simulation?.id === simulationId) return;

    let ignore = false;
    setCreditJourneyLoading(true);

    portalApi
      .getCreditSimulation(simulationId)
      .then((result) => {
        if (!ignore) setCreditJourney(result);
      })
      .catch(() => {
        if (!ignore) toast.error('Não foi possível carregar sua leitura personalizada agora.');
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
    if (rate < 2) return { icon: Star, text: 'Menor custo' };
    if (loanType === 'Negativado') return { icon: ShieldCheck, text: 'Mais sensível ao momento' };
    return { icon: Sparkles, text: 'Vale olhar com calma' };
  };

  const resetFilters = () => {
    setAmount([10000]);
    setType('Todos');
    setScore('Todos');
    setTerm([24]);
    setSort('taxa-baixa');
  };

  const openInternalFlow = () => {
    setQuickModalOpen(true);
  };

  return (
    <>
      <Helmet>
        <title>Empréstimos com mais clareza - Cote Juros</title>
        <meta
          name="description"
          content="Compare valor, prazo e custo com mais clareza para descobrir por onde vale a pena começar."
        />
      </Helmet>

      <QuickCreditFlowModal
        isOpen={quickModalOpen}
        onClose={() => setQuickModalOpen(false)}
        sourcePage="/emprestimos"
        originLabel="emprestimos"
      />

      <PageHero
        eyebrow="Empréstimos"
        badge="Compare antes de contratar"
        title="Veja opções de empréstimo com mais clareza antes de decidir."
        subtitle="Compare valor, prazo e custo para entender por onde vale a pena começar."
      >
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button size="lg" onClick={openInternalFlow}>Ver minhas opções agora</Button>
          <a href="#resultados-emprestimos">
            <Button size="lg" variant="outline">Ver comparação</Button>
          </a>
        </div>
      </PageHero>

      {quickLeadContext ? (
        <section className="border-b border-border bg-white py-6">
          <div className="page-shell">
            <div className="rounded-[20px] border border-primary/15 bg-primary/[0.04] px-5 py-4 shadow-[0_8px_18px_rgba(37,99,235,0.04)]">
              <p className="text-sm font-semibold text-foreground">
                {quickLeadContext.fullName ? `${quickLeadContext.fullName}, estas opções` : 'Estas opções'} podem ser um bom ponto de partida para você.
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Primeiro compare com calma. Depois decida se vale seguir.
              </p>
            </div>
          </div>
        </section>
      ) : null}

      <section className="border-b border-border bg-background-secondary py-10">
        <div className="page-shell grid gap-4 md:grid-cols-4">
          <div className="interactive-card px-5 py-5">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Valor escolhido</p>
            <p className="mt-2 text-xl font-medium tracking-[-0.03em] text-foreground">R$ {amount[0].toLocaleString('pt-BR')}</p>
          </div>
          <div className="interactive-card px-5 py-5">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Prazo escolhido</p>
            <p className="mt-2 text-xl font-medium tracking-[-0.03em] text-foreground">{term[0]} meses</p>
          </div>
          <div className="interactive-card px-5 py-5">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Menor custo no momento</p>
            <p className="mt-2 text-xl font-medium tracking-[-0.03em] text-primary">{bestRate ? `${bestRate}% a.m.` : '--'}</p>
          </div>
          <div className="interactive-card px-5 py-5">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Opções visíveis</p>
            <p className="mt-2 text-xl font-medium tracking-[-0.03em] text-foreground">{filteredLoans.length}</p>
          </div>
        </div>
      </section>

      <div className="page-shell py-14" id="resultados-emprestimos">
        {creditJourneyLoading ? (
          <div className="mb-10 rounded-[22px] border border-border bg-white px-8 py-10 shadow-[var(--shadow-sm)]">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">Leitura personalizada</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-foreground">Carregando o seu cenário...</h2>
          </div>
        ) : null}

        {creditJourney?.offers?.length ? (
          <section className="mb-12 rounded-[28px] border border-primary/15 bg-white p-8 shadow-[var(--shadow-md)] sm:p-10">
            <div className="flex flex-col gap-4 border-b border-border pb-7 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Com base no seu momento...</p>
                <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-foreground">Caminhos que merecem sua atenção agora</h2>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
                  Aqui você compara valor, prazo e custo com mais clareza antes de decidir o próximo passo.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-[16px] border border-border bg-background-secondary px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Valor pedido</p>
                  <p className="mt-1 text-sm font-semibold text-foreground">
                    {creditJourney.simulation?.requestedAmount ? `R$ ${Number(creditJourney.simulation.requestedAmount).toLocaleString('pt-BR')}` : '--'}
                  </p>
                </div>
                <div className="rounded-[16px] border border-border bg-background-secondary px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Parcelas previstas</p>
                  <p className="mt-1 text-sm font-semibold text-foreground">{creditJourney.simulation?.installments || '--'}x</p>
                </div>
                <div className="rounded-[16px] border border-border bg-background-secondary px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Caminhos</p>
                  <p className="mt-1 text-sm font-semibold text-foreground">{creditJourney.offers.length}</p>
                </div>
              </div>
            </div>

            <div className="mt-7 rounded-[20px] border border-slate-200 bg-slate-50 p-5">
              <p className="text-sm font-semibold text-slate-900">A decisão começa aqui dentro.</p>
              <p className="mt-2 text-sm text-slate-600">
                Use esta área para entender melhor o cenário antes de avançar no seu ritmo.
              </p>
            </div>

            <div className="mt-9 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {creditJourney.offers.map((offer, index) => (
                <Card key={offer.id} className="surface-card h-full border-border bg-white">
                  <CardContent className="flex h-full flex-col gap-6 p-8">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                          {offer.provider === 'catalog_fallback' ? 'Comparação' : 'Opção'}
                        </p>
                        <p className="mt-2 text-lg font-semibold text-foreground">{offer.bankName}</p>
                        <p className="text-sm text-muted-foreground">{offer.productName}</p>
                      </div>
                      <Badge
                        variant={index === 0 ? 'default' : 'outline'}
                        className={index === 0 ? 'border-0' : 'border-primary/25 bg-primary/10 text-primary'}
                      >
                        {offer.matchLabel}
                      </Badge>
                    </div>

                    <div className="grid gap-5 sm:grid-cols-2">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Taxa mensal</p>
                        <p className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-primary">
                          {offer.monthlyRate != null ? `${offer.monthlyRate}%` : '--'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Custo total</p>
                        <p className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-foreground">
                          {offer.cet != null ? `${offer.cet}%` : '--'}
                        </p>
                      </div>
                    </div>

                    <div className="rounded-[16px] border border-border bg-background-secondary p-4">
                      <div className="grid gap-4 sm:grid-cols-3">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Valor possível</p>
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

                    <Button className="mt-auto w-full" onClick={openInternalFlow}>
                      Quero entender melhor
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        ) : null}

        <div className="mb-10 rounded-[26px] border border-border bg-white p-7 shadow-[0_10px_30px_rgba(0,0,0,0.05)]">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-primary">Compare com mais calma</p>
          <h2 className="mt-3 text-2xl text-foreground">Ajuste o cenário e descubra o que pode fazer sentido</h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground">
            Esta parte existe para ajudar você a comparar com mais segurança antes de avançar.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
          <aside className="lg:sticky lg:top-24 lg:h-fit">
            <Card className="border-border bg-white shadow-[var(--shadow-sm)]">
              <CardContent className="space-y-8 p-8">
                <div className="flex items-center justify-between border-b border-border pb-4">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-primary" />
                    <h3 className="text-lg">Refine sua busca</h3>
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
                  <Label>Tipo de empréstimo</Label>
                  <Select value={type} onValueChange={setType}>
                    <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Todos">Todos os tipos</SelectItem>
                      <SelectItem value="Pessoal">Pessoal</SelectItem>
                      <SelectItem value="Consignado">Consignado</SelectItem>
                      <SelectItem value="Garantia">Com garantia</SelectItem>
                      <SelectItem value="Negativado">Para negativado</SelectItem>
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
                  <Label>Como está seu histórico financeiro?</Label>
                  <RadioGroup value={score} onValueChange={setScore} className="space-y-3">
                    {['Todos', 'Alto', 'Medio', 'Baixo'].map((item) => (
                      <label key={item} className="flex items-center gap-3 rounded-[12px] border border-border px-4 py-3 hover:bg-background-secondary">
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
          </aside>

          <section>
            <div className="mb-7 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <p className="text-sm text-muted-foreground">{filteredLoans.length} opções organizadas para facilitar sua decisão.</p>
              <div className="flex flex-wrap items-center gap-3">
                <div className="inline-flex items-center rounded-[10px] border border-border bg-white p-1">
                  <Button type="button" size="sm" variant={viewMode === 'grid' ? 'default' : 'ghost'} className="h-8 gap-1.5 px-3" onClick={() => setViewMode('grid')}>
                    <LayoutGrid className="h-3.5 w-3.5" />
                    Visual em cards
                  </Button>
                  <Button type="button" size="sm" variant={viewMode === 'list' ? 'default' : 'ghost'} className="h-8 gap-1.5 px-3" onClick={() => setViewMode('list')}>
                    <List className="h-3.5 w-3.5" />
                    Visual em lista
                  </Button>
                </div>
                <Label className="whitespace-nowrap">Ordenar</Label>
                <Select value={sort} onValueChange={setSort}>
                  <SelectTrigger className="w-[220px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="taxa-baixa">Menor taxa</SelectItem>
                    <SelectItem value="valor-maximo">Maior valor</SelectItem>
                    <SelectItem value="prazo-maior">Maior prazo</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" onClick={openInternalFlow}>Refazer busca rápida</Button>
              </div>
            </div>

            {viewMode === 'grid' ? (
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
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
                              style={{ borderColor: `${bankAccent}40`, backgroundColor: `${bankAccent}1A`, color: bankAccent }}
                            >
                              {bank?.name?.charAt(0) || 'B'}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-foreground">{bank?.name || loan.bankName}</p>
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
                          <p className="mt-2 text-4xl font-medium tracking-[-0.05em] text-primary">{loan.monthlyRate}%</p>
                        </div>

                        <div className="rounded-[14px] border border-border bg-background-secondary p-4">
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Resumo rápido</p>
                          <p className="mt-2 text-sm leading-7 text-muted-foreground">
                            {loan.monthlyRate < 2
                              ? 'Uma das melhores condições dentro do cenário que você escolheu.'
                              : 'Boa escolha para comparar custo, prazo e parcela com mais calma.'}
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4 border-t border-border pt-4">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Valor máximo</p>
                            <p className="mt-2 text-sm font-medium text-foreground">R$ {(loan.maxValue / 1000).toFixed(0)}k</p>
                          </div>
                          <div>
                            <p className="flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              Prazo
                            </p>
                            <p className="mt-2 text-sm font-medium text-foreground">{loan.maxTerm} meses</p>
                          </div>
                        </div>

                        <Button className="mt-auto w-full" onClick={openInternalFlow}>
                          Quero entender melhor
                          <ChevronRight className="h-4 w-4" />
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
                    <Card key={loan.id} className="border-border bg-white shadow-[0_8px_20px_rgba(15,23,42,0.04)]">
                      <CardContent className="p-7">
                        <div className="grid items-center gap-5 lg:grid-cols-[1.3fr_0.9fr_0.9fr_220px]">
                          <div className="flex items-start gap-4">
                            <div
                              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border text-sm font-semibold"
                              style={{ borderColor: `${bankAccent}40`, backgroundColor: `${bankAccent}1A`, color: bankAccent }}
                            >
                              {bank?.name?.charAt(0) || 'B'}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-foreground">{bank?.name || loan.bankName}</p>
                              <p className="text-sm text-muted-foreground">{loan.category}</p>
                              <Badge variant="outline" className="mt-2 gap-1 border-primary/25 bg-primary/10 text-primary">
                                <BadgeIcon className="h-3 w-3" />
                                {badge.text}
                              </Badge>
                            </div>
                          </div>

                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Taxa mensal</p>
                            <p className="mt-1 text-2xl font-medium tracking-[-0.04em] text-primary">{loan.monthlyRate}%</p>
                          </div>

                          <div className="grid gap-2">
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Valor máximo</p>
                              <p className="mt-1 text-sm font-medium text-foreground">R$ {(loan.maxValue / 1000).toFixed(0)}k</p>
                            </div>
                            <div>
                              <p className="flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                Prazo
                              </p>
                              <p className="mt-1 text-sm font-medium text-foreground">{loan.maxTerm} meses</p>
                            </div>
                          </div>

                          <Button className="w-full lg:justify-center" onClick={openInternalFlow}>
                            Quero entender melhor
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            {filteredLoans.length === 0 ? (
              <div className="rounded-[18px] border border-dashed border-border bg-background-secondary px-6 py-16 text-center">
                <h3 className="text-2xl">Nenhuma opção encontrada.</h3>
                <p className="mt-3 text-muted-foreground">Ajuste valor, prazo ou histórico financeiro para ampliar a comparação.</p>
                <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
                  <Button variant="outline" onClick={resetFilters}>Limpar filtros</Button>
                  <Button onClick={openInternalFlow}>Refazer busca rápida</Button>
                </div>
              </div>
            ) : null}
          </section>
        </div>
      </div>

      <section className="border-t border-border bg-background-secondary py-[4.5rem]">
        <div className="page-shell">
          <div className="mx-auto max-w-4xl rounded-[24px] border border-primary/20 bg-white px-8 py-11 text-center shadow-[var(--shadow-sm)]">
            <h2 className="mb-3">Quer recomeçar com mais clareza?</h2>
            <p className="mx-auto mb-7 max-w-2xl text-muted-foreground">
              Recomece com alguns dados básicos e veja caminhos que podem combinar melhor com o seu momento.
            </p>
            <Button size="lg" onClick={openInternalFlow}>Ver minhas opções agora</Button>
          </div>
        </div>
      </section>
    </>
  );
}

export default EmprestimosPage;
