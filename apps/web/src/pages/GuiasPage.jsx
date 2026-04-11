
import React from 'react';
import { Helmet } from 'react-helmet';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, TrendingUp, CreditCard, DollarSign, Home, Shield } from 'lucide-react';
import PageHero from '@/components/PageHero.jsx';

function GuiasPage() {
  const guides = [
    {
      icon: TrendingUp,
      title: 'Guia completo do score de crédito',
      description: 'Aprenda tudo sobre score de crédito: como funciona, como consultar e como melhorar sua pontuação.',
      topics: ['O que é score de crédito', 'Como é calculado', 'Como melhorar seu score', 'Mitos e verdades']
    },
    {
      icon: DollarSign,
      title: 'Empréstimos: guia para iniciantes',
      description: 'Entenda os diferentes tipos de empréstimo, como escolher o melhor e evitar armadilhas.',
      topics: ['Tipos de empréstimo', 'Como comparar taxas', 'Documentação necessária', 'Cuidados ao contratar']
    },
    {
      icon: CreditCard,
      title: 'Cartões de crédito: uso consciente',
      description: 'Aprenda a usar cartão de crédito de forma inteligente e aproveitar os benefícios.',
      topics: ['Como escolher um cartão', 'Programas de pontos', 'Cashback', 'Evitando dívidas']
    },
    {
      icon: Home,
      title: 'Financiamento imobiliário passo a passo',
      description: 'Tudo o que você precisa saber para financiar seu imóvel com segurança.',
      topics: ['Tipos de financiamento', 'Documentação', 'Simulação', 'Aprovação e contratação']
    },
    {
      icon: Shield,
      title: 'Proteção financeira e seguros',
      description: 'Entenda a importância de proteger seu patrimônio e sua família.',
      topics: ['Seguro de vida', 'Seguro residencial', 'Seguro de veículos', 'Previdência privada']
    },
    {
      icon: BookOpen,
      title: 'Educação financeira básica',
      description: 'Fundamentos de finanças pessoais para organizar sua vida financeira.',
      topics: ['Orçamento pessoal', 'Reserva de emergência', 'Controle de gastos', 'Planejamento financeiro']
    }
  ];

  return (
    <>
      <Helmet>
        <title>Guias Financeiros - Cote Juros</title>
        <meta name="description" content="Guias completos sobre finanças pessoais, crédito, investimentos e muito mais." />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />
        <PageHero
          title="Guias financeiros"
          subtitle="Aprenda sobre finanças pessoais com nossos guias completos."
        />

        <section className="py-12">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {guides.map((guide, index) => {
                const Icon = guide.icon;
                return (
                  <Card key={index} className="hover:shadow-lg transition-all duration-200">
                    <CardHeader>
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Icon className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-xl font-semibold text-balance mb-2">{guide.title}</CardTitle>
                          <CardDescription>{guide.description}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 mb-4">
                        <p className="text-sm font-medium text-muted-foreground">Tópicos abordados:</p>
                        <ul className="space-y-1">
                          {guide.topics.map((topic, topicIndex) => (
                            <li key={topicIndex} className="flex items-start gap-2 text-sm">
                              <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                              <span>{topic}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <Button variant="outline" className="w-full transition-all duration-200 active:scale-[0.98]">
                        Ler guia completo
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
}

export default GuiasPage;

