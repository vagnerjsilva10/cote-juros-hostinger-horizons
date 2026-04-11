
import React from 'react';
import { Helmet } from 'react-helmet';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import PageHero from '@/components/PageHero.jsx';

function AnaliseDeMarketPage() {
  const marketData = [
    {
      categoria: 'Empréstimo pessoal',
      taxaMedia: '2.39%',
      tendencia: 'baixa',
      variacao: '-0.15%',
      descricao: 'Taxas de empréstimo pessoal apresentaram leve queda no último trimestre devido à redução da Selic.'
    },
    {
      categoria: 'Empréstimo consignado',
      taxaMedia: '1.69%',
      tendencia: 'estavel',
      variacao: '0.00%',
      descricao: 'Taxas de consignado mantiveram-se estáveis, continuando como a opção mais acessível do mercado.'
    },
    {
      categoria: 'Financiamento de veículos',
      taxaMedia: '1.89%',
      tendencia: 'alta',
      variacao: '+0.08%',
      descricao: 'Leve aumento nas taxas de financiamento de veículos devido ao aumento da demanda no setor automotivo.'
    },
    {
      categoria: 'Financiamento imobiliário',
      taxaMedia: '0.94%',
      tendencia: 'baixa',
      variacao: '-0.05%',
      descricao: 'Taxas de financiamento imobiliário em queda, impulsionadas por políticas de incentivo ao setor.'
    },
    {
      categoria: 'Cartões de crédito',
      taxaMedia: '13.89%',
      tendencia: 'estavel',
      variacao: '+0.02%',
      descricao: 'Taxas de juros rotativos do cartão de crédito mantêm-se elevadas, reforçando a importância do pagamento integral da fatura.'
    }
  ];

  const getTrendIcon = (tendencia) => {
    if (tendencia === 'alta') return <TrendingUp className="h-4 w-4 text-red-600" />;
    if (tendencia === 'baixa') return <TrendingDown className="h-4 w-4 text-green-600" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  const getTrendBadge = (tendencia) => {
    if (tendencia === 'alta') return <Badge variant="destructive">Em alta</Badge>;
    if (tendencia === 'baixa') return <Badge className="bg-green-600 text-white hover:bg-green-700">Em baixa</Badge>;
    return <Badge variant="secondary">Estável</Badge>;
  };

  return (
    <>
      <Helmet>
        <title>Análise de Mercado - Cote Juros</title>
        <meta name="description" content="Acompanhe as tendências do mercado de crédito brasileiro e análise de taxas de juros." />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />
        <PageHero
          title="Análise de mercado"
          subtitle="Acompanhe as tendências e taxas médias do mercado de crédito brasileiro."
        />

        <section className="py-12">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-8">
              <Card className="bg-primary/5 border-primary/20">
                <CardHeader>
                  <CardTitle className="text-balance">Panorama do mercado - Abril 2026</CardTitle>
                  <CardDescription>
                    O mercado de crédito brasileiro apresenta sinais de estabilização após período de alta volatilidade. A redução gradual da taxa Selic tem impactado positivamente as taxas de empréstimos e financiamentos.
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>

            <div className="space-y-6">
              {marketData.map((item, index) => (
                <Card key={index} className="hover:shadow-lg transition-all duration-200">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-xl font-semibold text-balance mb-2">{item.categoria}</CardTitle>
                        <CardDescription>{item.descricao}</CardDescription>
                      </div>
                      {getTrendBadge(item.tendencia)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Taxa média mensal</p>
                        <p className="text-3xl font-bold text-primary font-variant-tabular">{item.taxaMedia}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Variação no trimestre</p>
                        <div className="flex items-center gap-2">
                          {getTrendIcon(item.tendencia)}
                          <p className={`text-2xl font-semibold font-variant-tabular ${
                            item.tendencia === 'alta' ? 'text-red-600' : 
                            item.tendencia === 'baixa' ? 'text-green-600' : 
                            'text-muted-foreground'
                          }`}>
                            {item.variacao}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-end">
                        <div className="text-sm text-muted-foreground">
                          Dados atualizados em {new Date().toLocaleDateString('pt-BR')}
                        </div>
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

