
import React from 'react';
import { Helmet } from 'react-helmet';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Target, Users, Award, Shield } from 'lucide-react';

function SobreNosPage() {
  const values = [
    {
      icon: Target,
      title: 'Missão',
      description: 'Democratizar o acesso à informação sobre crédito e ajudar brasileiros a tomar decisões financeiras mais conscientes.'
    },
    {
      icon: Users,
      title: 'Transparência',
      description: 'Fornecemos comparações imparciais e informações claras sobre produtos financeiros, sem conflitos de interesse.'
    },
    {
      icon: Award,
      title: 'Qualidade',
      description: 'Mantemos nossos dados sempre atualizados e verificamos todas as informações antes de publicá-las.'
    },
    {
      icon: Shield,
      title: 'Segurança',
      description: 'Protegemos seus dados pessoais com os mais altos padrões de segurança e privacidade.'
    }
  ];

  return (
    <>
      <Helmet>
        <title>Sobre nós - Cote Juros</title>
        <meta name="description" content="Conheça a Cote Juros, o portal que ajuda brasileiros a encontrar as melhores opções de crédito." />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />

        <section className="py-12 bg-secondary">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-balance" style={{ letterSpacing: '-0.02em' }}>
              Sobre nós
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl">
              Conheça a história e os valores da Cote Juros
            </p>
          </div>
        </section>

        <section className="py-12">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto mb-12">
              <h2 className="text-3xl font-bold mb-6 text-balance">Quem somos</h2>
              <div className="space-y-4 text-lg leading-relaxed text-muted-foreground">
                <p>
                  A Cote Juros nasceu da necessidade de tornar o mercado de crédito mais transparente e acessível para todos os brasileiros. Sabemos que escolher um empréstimo, cartão de crédito ou financiamento pode ser confuso e estressante.
                </p>
                <p>
                  Nossa plataforma reúne informações de dezenas de instituições financeiras em um só lugar, permitindo que você compare taxas, condições e benefícios de forma rápida e fácil.
                </p>
                <p>
                  Acreditamos que todos merecem acesso a informações claras e imparciais sobre produtos financeiros. Por isso, trabalhamos todos os dias para manter nossos dados atualizados e fornecer conteúdo educativo de qualidade.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
              {values.map((value, index) => {
                const Icon = value.icon;
                return (
                  <Card key={index} className="hover:shadow-lg transition-all duration-200">
                    <CardHeader>
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Icon className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-xl font-semibold text-balance mb-2">{value.title}</CardTitle>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground leading-relaxed">{value.description}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <div className="max-w-3xl mx-auto">
              <Card className="bg-primary/5 border-primary/20">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold text-balance">Nosso compromisso</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-muted-foreground leading-relaxed">
                  <p>
                    Estamos comprometidos em fornecer informações precisas, atualizadas e imparciais sobre produtos financeiros. Não recebemos comissões de instituições financeiras por recomendações, garantindo que nossas comparações sejam sempre neutras.
                  </p>
                  <p>
                    Além disso, investimos constantemente em educação financeira, produzindo conteúdo de qualidade para ajudar você a tomar decisões mais conscientes sobre seu dinheiro.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
}

export default SobreNosPage;
