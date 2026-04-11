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
      categoria: 'Emprestimo pessoal',
      taxaMedia: '2.39%',
      tendencia: 'baixa',
      variacao: '-0.15%',
      descricao: 'As taxas de emprestimo pessoal cederam levemente no trimestre com o ambiente de juros mais controlado.'
    },
    {
      categoria: 'Emprestimo consignado',
      taxaMedia: '1.69%',
      tendencia: 'estavel',
      variacao: '0.00%',
      descricao: 'O consignado segue como uma das linhas mais acessiveis e manteve comportamento estavel.'
    },
    {
      categoria: 'Financiamento de veiculos',
      taxaMedia: '1.89%',
      tendencia: 'alta',
      variacao: '+0.08%',
      descricao: 'A demanda mais aquecida elevou discretamente o custo medio dessa categoria.'
    },
    {
      categoria: 'Financiamento imobiliario',
      taxaMedia: '0.94%',
      tendencia: 'baixa',
      variacao: '-0.05%',
      descricao: 'O custo medio do financiamento imobiliario mostra movimento de acomodacao no periodo.'
    },
    {
      categoria: 'Cartoes de credito',
      taxaMedia: '13.89%',
      tendencia: 'estavel',
      variacao: '+0.02%',
      descricao: 'O rotativo segue elevado, reforcando a importancia de pagar a fatura integralmente.'
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
    return <Badge variant="outline">Estavel</Badge>;
  };

  return (
    <>
      <Helmet>
        <title>Analise de mercado - Cote Juros</title>
        <meta name="description" content="Acompanhe tendencias e medias do mercado de credito em uma leitura mais limpa." />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />
        <PageHero
          badge="Mercado"
          title="Analise de mercado em uma interface mais calma."
          subtitle="Leituras sinteticas sobre custo medio e variacao recente nas principais categorias do credito."
        />

        <section className="page-section bg-background">
          <div className="page-shell space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Panorama - Abril 2026</CardTitle>
                <CardDescription>
                  O mercado de credito mostra sinais de estabilizacao, com algumas categorias cedendo levemente e outras mantendo comportamento lateral.
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
                        <p className="text-sm text-muted-foreground">Taxa media mensal</p>
                        <p className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-foreground">{item.taxaMedia}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Variacao no trimestre</p>
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
