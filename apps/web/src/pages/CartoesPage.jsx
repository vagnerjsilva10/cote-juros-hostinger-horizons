import React, { useState, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { creditCardsData } from '@/data/creditCardsData.js';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Filter, CheckCircle2, Sparkles, CreditCard, ChevronRight } from 'lucide-react';

function CartoesPage() {
  const [freeAnnuity, setFreeAnnuity] = useState(false);
  const [categories, setCategories] = useState({ Premium: false, Intermediário: false, Básico: false });
  const [benefits, setBenefits] = useState({ Cashback: false, Milhas: false, VIP: false });
  const [sort, setSort] = useState('limite-maior');

  const filteredCards = useMemo(() => {
    let result = creditCardsData.filter((card) => {
      const matchAnnuity = !freeAnnuity || card.annualFee === 0;

      const activeCats = Object.keys(categories).filter((k) => categories[k]);
      const matchCat = activeCats.length === 0 || activeCats.includes(card.category);

      const activeBens = Object.keys(benefits).filter((k) => benefits[k]);
      const matchBens = activeBens.length === 0 || activeBens.some((ben) =>
        card.benefits.some((cardBen) =>
          cardBen.toLowerCase().includes(ben.toLowerCase()) ||
          (ben === 'VIP' && cardBen.toLowerCase().includes('sala')) ||
          (ben === 'Milhas' && cardBen.toLowerCase().includes('pontos'))
        )
      );

      return matchAnnuity && matchCat && matchBens;
    });

    if (sort === 'limite-maior') result.sort((a, b) => b.maxLimit - a.maxLimit);
    if (sort === 'anuidade-menor') result.sort((a, b) => a.annualFee - b.annualFee);

    return result;
  }, [freeAnnuity, categories, benefits, sort]);

  const handleApply = (name) => {
    toast.success(`Redirecionando para solicitar o ${name}...`);
  };

  return (
    <>
      <Helmet>
        <title>Comparador de Cartões de Crédito - Cote Juros</title>
        <meta name="description" content="Encontre o cartão de crédito perfeito: sem anuidade, com milhas ou cashback." />
      </Helmet>

      <div className="bg-slate-50 border-b border-border py-12 lg:py-16 relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src="https://images.unsplash.com/photo-1674845740155-bb4d20fa1a54?auto=format&fit=crop&w=2000&q=80" alt="Cartões de Crédito" className="w-full h-full object-cover opacity-10 mix-blend-multiply grayscale" />
        </div>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4 text-foreground text-balance">Cartões de Crédito</h1>
          <p className="text-lg text-muted-foreground max-w-2xl font-medium">Milhas, cashback ou anuidade zero? Compare e escolha o cartão ideal para o seu bolso.</p>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-12 gap-8">

          <div className="lg:col-span-3 space-y-8">
            <div className="bg-white border rounded-[var(--radius-lg)] p-6 shadow-sm sticky top-24">
              <div className="flex items-center justify-between mb-6 border-b pb-4">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <Filter className="w-5 h-5 text-primary" /> Filtros
                </h3>
              </div>

              <div className="space-y-8">
                <div className="flex items-center justify-between">
                  <Label htmlFor="free-annuity" className="font-semibold text-foreground cursor-pointer">Apenas sem anuidade</Label>
                  <Switch id="free-annuity" checked={freeAnnuity} onCheckedChange={setFreeAnnuity} />
                </div>

                <div className="space-y-4">
                  <Label className="font-semibold text-foreground">Categoria do cartão</Label>
                  <div className="space-y-3">
                    {['Premium', 'Intermediário', 'Básico'].map((cat) => (
                      <div key={cat} className="flex items-center space-x-3">
                        <Checkbox
                          id={`cat-${cat}`}
                          checked={categories[cat]}
                          onCheckedChange={(checked) => setCategories((prev) => ({ ...prev, [cat]: checked }))}
                          className="data-[state=checked]:bg-primary data-[state=checked]:text-white"
                        />
                        <Label htmlFor={`cat-${cat}`} className="font-medium cursor-pointer">{cat}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <Label className="font-semibold text-foreground">Benefícios desejados</Label>
                  <div className="space-y-3">
                    {['Cashback', 'Milhas', 'VIP'].map((ben) => (
                      <div key={ben} className="flex items-center space-x-3">
                        <Checkbox
                          id={`ben-${ben}`}
                          checked={benefits[ben]}
                          onCheckedChange={(checked) => setBenefits((prev) => ({ ...prev, [ben]: checked }))}
                          className="data-[state=checked]:bg-secondary data-[state=checked]:text-white border-secondary/50"
                        />
                        <Label htmlFor={`ben-${ben}`} className="font-medium cursor-pointer">{ben === 'VIP' ? 'Acesso Sala VIP' : ben}</Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-9">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
              <p className="text-muted-foreground font-medium">
                Mostrando <span className="text-foreground font-bold">{filteredCards.length}</span> cartões
              </p>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <Label className="whitespace-nowrap font-medium">Ordenar:</Label>
                <Select value={sort} onValueChange={setSort}>
                  <SelectTrigger className="w-full sm:w-48 bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="limite-maior">Maior Limite (est.)</SelectItem>
                    <SelectItem value="anuidade-menor">Menor anuidade</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredCards.map((card) => {
                const isFree = card.annualFee === 0;
                const keyBenefit = card.benefits[0];

                return (
                  <Card key={card.id} className="card-premium flex flex-col transition-all overflow-hidden bg-white">
                    <div className="h-44 relative overflow-hidden bg-slate-900 group">
                      <img
                        src={card.image}
                        alt={card.name}
                        className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/45 to-transparent" />
                      <div className="absolute left-5 bottom-4 right-5 z-10">
                        <p className="text-xs uppercase tracking-wide text-slate-300 font-semibold">{card.bankName}</p>
                        <h3 className="text-white text-lg font-bold leading-tight">{card.name}</h3>
                      </div>
                      {card.category === 'Premium' && (
                        <Badge className="absolute top-4 right-4 bg-amber-500 text-amber-950 border-0 font-bold tracking-wider uppercase text-[10px]">
                          Premium <Sparkles className="w-3 h-3 ml-1" />
                        </Badge>
                      )}
                    </div>

                    <CardContent className="flex-1 p-6 flex flex-col">
                      <div className="grid grid-cols-2 gap-4 mb-5">
                        <div className="rounded-lg border border-border bg-slate-50 p-3">
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Anuidade</p>
                          <p className={`font-bold ${isFree ? 'text-emerald-600' : 'text-foreground'}`}>
                            {isFree ? 'GRÁTIS' : `R$ ${card.annualFee}/ano`}
                          </p>
                        </div>
                        <div className="rounded-lg border border-border bg-slate-50 p-3">
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Limite est.</p>
                          <p className="font-bold text-primary">Até R$ {card.maxLimit / 1000}k</p>
                        </div>
                      </div>

                      <div className="mb-5 rounded-xl border border-border bg-slate-50 p-4">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Benefício principal</p>
                        <p className="text-sm font-semibold text-foreground">{keyBenefit}</p>
                      </div>

                      <div className="flex-1">
                        <ul className="space-y-2.5">
                          {card.benefits.slice(0, 3).map((ben, idx) => {
                            const isCashback = ben.toLowerCase().includes('cashback');
                            const isPoints = ben.toLowerCase().includes('pontos') || ben.toLowerCase().includes('milhas');
                            const iconColor = isCashback ? 'text-emerald-600' : isPoints ? 'text-secondary' : 'text-primary';

                            return (
                              <li key={idx} className="flex items-start text-sm font-medium text-slate-700">
                                <CheckCircle2 className={`w-4 h-4 ${iconColor} mr-2 flex-shrink-0 mt-0.5`} />
                                <span className="leading-tight">{ben}</span>
                              </li>
                            );
                          })}
                        </ul>
                      </div>

                      <div className="mt-6 pt-4">
                        <Button className="w-full h-12 text-base font-bold gradient-fintech-hover border-0 shadow-md transition-all duration-300 hover:shadow-lg" onClick={() => handleApply(card.name)}>
                          Solicitar agora <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {filteredCards.length === 0 && (
              <div className="text-center py-20 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                <CreditCard className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-foreground">Nenhum cartão encontrado</h3>
                <p className="text-muted-foreground mt-2">Tente desmarcar alguns filtros de benefícios.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default CartoesPage;
