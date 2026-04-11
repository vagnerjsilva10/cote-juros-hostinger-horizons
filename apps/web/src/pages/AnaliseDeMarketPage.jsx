import React from 'react';
import { Helmet } from 'react-helmet';
import { Minus, TrendingDown, TrendingUp } from 'lucide-react';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import PageHero from '@/components/PageHero.jsx';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

function AnaliseDeMarketPage() {
  const marketData = [
    {
      categoria: 'Empréstimo pessoal',
      taxaMedia: '2.39%',
      tendencia: 'baixa',
      variacao: '-0.15%',
      descricao: 'As taxas de empréstimo pessoal cederam levemente no trimestre com o ambiente de juros mais controlado.'
    },
    {
      categoria: 'Empréstimo consignado',
      taxaMedia: '1.69%',
      tendencia: 'estavel',
      variacao: '0.00%',
      descricao: 'O consignado segue como uma das linhas mais acessíveis e manteve comportamento estável.'
    },
    {
      categoria: 'Financiamento de veículos',
      taxaMedia: '1.89%',
      tendencia: 'alta',
      variacao: '+0.08%',
      descricao: 'A demanda mais aquecida elevou discretamente o custo médio dessa categoria.'
    },
    {
      categoria: 'Financiamento imobiliário',
      taxaMedia: '0.94%',
      tendencia: 'baixa',
      variacao: '-0.05%',
      descricao: 'O custo médio do financiamento imobiliário mostra movimento de acomodação no período.'
    },
    {
      categoria: 'Cartões de crédito',
      taxaMedia: '13.89%',
      tendencia: 'estavel',
      variacao: '+0.02%',
      descricao: 'O rotativo segue elevado, reforçando a importância de pagar a fatura integralmente.'
    }
  ];

  const getTrendIcon = (trend) => {
    if (trend === 'alta') return <TrendingUp className="h-4 w-4 text-foreground" />;
    if (trend === 'baixa') return <TrendingDown className="h-4 w-4 text-foreground" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  const getTrendBadge = (trend) => {
    if (trend === 'alta') return <Badge variant="outline">Em alta</Badge>;
    if (trend === 'baixa') return <Badge variant="secondary">Em baixa</Badge>;
    return <Badge variant="outline">Estável</Badge>;
  };

  return (
    <>
      <Helmet>
        <title>Análise de mercado - Cote Juros</title>
        <meta name="description" content="Acompanhe tendências e médias do mercado de crédito em uma leitura mais limpa." />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />
        <PageHero
          badge="Mercado"
          title="Análise de mercado em uma interface mais calma."
          subtitle="Leituras sintéticas sobre custo médio e variação recente nas principais categorias do crédito."
        />

        <section className="page-section bg-background">
          <div className="page-shell space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Panorama - Abril 2026</CardTitle>
                <CardDescription>
                  O mercado de crédito mostra sinais de estabilização, com algumas categorias cedendo levemente e outras mantendo comportamento lateral.
                </CardDescription>
              </CardHeader>
            </Card>

            <div className="space-y-5">
              {marketData.map((item) => (
                <Card key={item.categoria} className="surface-card">
                  <CardHeader>
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div className="space-y-2">
                        <CardTitle className="text-xl">{item.categoria}</CardTitle>
                        <CardDescription>{item.descricao}</CardDescription>
                      </div>
                      {getTrendBadge(item.tendencia)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-6 md:grid-cols-3">
                      <div>
                        <p className="text-sm text-muted-foreground">Taxa média mensal</p>
                        <p className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-foreground">{item.taxaMedia}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Variação no trimestre</p>
                        <div className="mt-2 flex items-center gap-2">
                          {getTrendIcon(item.tendencia)}
                          <p className="text-2xl font-semibold tracking-[-0.04em] text-foreground">{item.variacao}</p>
                        </div>
                      </div>
                      <div className="flex items-end text-sm text-muted-foreground">
                        Dados atualizados em {new Date().toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
}

export default AnaliseDeMarketPage;
