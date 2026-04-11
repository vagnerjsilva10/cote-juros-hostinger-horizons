import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { ChevronRight, Clock, Filter, ShieldCheck, Sparkles, Star } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import PageHero from '@/components/PageHero.jsx';
import { portalApi } from '@/platform/services/portalApi.js';
import { trackingService } from '@/platform/services/trackingService.js';
import { partnerRedirectService } from '@/platform/services/partnerRedirectService.js';

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
  const [banksData, setBanksData] = useState([]);
  const [loansData, setLoansData] = useState([]);
  const [amount, setAmount] = useState([10000]);
  const [type, setType] = useState('Todos');
  const [score, setScore] = useState('Todos');
  const [term, setTerm] = useState([24]);
  const [sort, setSort] = useState('taxa-baixa');

  useEffect(() => {
    Promise.all([portalApi.getBanks(), portalApi.getOffers({ productType: 'loan' })]).then(([banks, offers]) => {
      setBanksData(banks);
      setLoansData(offers);
    });
  }, []);

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
    const destinationUrl = bank?.website ? `https://${bank.website}` : 'https://finance.cotejuros.com.br';

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

  const resetFilters = () => {
    setAmount([10000]);
    setType('Todos');
    setScore('Todos');
    setTerm([24]);
    setSort('taxa-baixa');
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

      <div className="page-shell py-12" id="resultados-emprestimos">
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
          </aside>

          <section>
            <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <p className="text-sm text-muted-foreground">
                {filteredLoans.length} oferta(s) organizadas para facilitar sua decisão.
              </p>
              <div className="flex flex-wrap items-center gap-3">
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
          </section>
        </div>
      </div>

      <section className="border-t border-border bg-background-secondary py-16">
        <div className="page-shell">
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
