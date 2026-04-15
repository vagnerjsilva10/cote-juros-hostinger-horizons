import React from 'react';
import { Helmet } from 'react-helmet';
import { CheckCircle2, Handshake, Shield, Target } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import PageHero from '@/components/PageHero.jsx';

function SobreNosPage() {
  const values = [
    {
      icon: Target,
      title: 'Clareza primeiro',
      description: 'Ajudamos você a entender caminhos de crédito antes de decidir por onde seguir.'
    },
    {
      icon: Shield,
      title: 'Sem promessa falsa',
      description: 'Não garantimos aprovação, não liberamos dinheiro diretamente e não cobramos valor antecipado.'
    },
    {
      icon: Handshake,
      title: 'Próximo passo mais simples',
      description: 'Quando uma opção fizer sentido, mostramos a continuação com mais contexto e menos confusão.'
    },
    {
      icon: CheckCircle2,
      title: 'Cada produto no seu lugar',
      description: 'A Cote Juros cuida da jornada de crédito. O Cote Finance é um produto separado para organização financeira.'
    }
  ];

  return (
    <>
      <Helmet>
        <title>Sobre a Cote Juros</title>
        <meta
          name="description"
          content="Entenda o papel da Cote Juros: ajudar você a encontrar caminhos de crédito com mais clareza, sem promessa de aprovação e sem cobrança antecipada."
        />
      </Helmet>

      <PageHero
        badge="Sobre a Cote Juros"
        title="A gente ajuda você a enxergar caminhos de crédito com mais clareza."
        subtitle="A Cote Juros não é banco. Nosso papel é organizar informações, mostrar possibilidades reais e deixar a próxima decisão muito mais clara."
      />

      <section className="page-section bg-background">
        <div className="page-shell">
          <div className="mx-auto mb-16 max-w-3xl">
            <h2 className="mb-4">O que fazemos</h2>
            <div className="space-y-4 text-lg text-muted-foreground">
              <p>
                Quem procura crédito normalmente encontra muita promessa, formulários cansativos e pouca clareza. A Cote Juros existe para tornar esse começo mais simples.
              </p>
              <p>
                Você informa o básico, entende quais caminhos podem combinar com o seu momento e decide se quer seguir. As condições finais e a resposta da instituição sempre dependem de quem fizer a análise.
              </p>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            {values.map((item) => (
              <Card key={item.title} className="surface-card">
                <CardContent className="space-y-5 p-8">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-background-secondary">
                    <item.icon className="h-5 w-5 text-foreground" />
                  </div>
                  <div className="space-y-3">
                    <h3>{item.title}</h3>
                    <p>{item.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

export default SobreNosPage;
