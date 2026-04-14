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
      description: 'Ajudamos voce a entender caminhos de credito antes de decidir para onde seguir.'
    },
    {
      icon: Shield,
      title: 'Sem promessa falsa',
      description: 'Nao garantimos aprovacao, nao liberamos dinheiro diretamente e nao cobramos valor antecipado.'
    },
    {
      icon: Handshake,
      title: 'Proximo passo mais simples',
      description: 'Quando uma opcao fizer sentido, direcionamos voce para a etapa seguinte com o parceiro.'
    },
    {
      icon: CheckCircle2,
      title: 'Cada produto no seu lugar',
      description: 'Cote Juros foca em credito. Cote Finance e um produto separado para organizacao financeira.'
    }
  ];

  return (
    <>
      <Helmet>
        <title>Sobre - Cote Juros</title>
        <meta
          name="description"
          content="Entenda o papel da Cote Juros: ajudar voce a encontrar opcoes de credito com clareza, sem promessa de aprovacao e sem cobranca antecipada."
        />
      </Helmet>

      <PageHero
        badge="Sobre a Cote Juros"
        title="A gente ajuda voce a encontrar caminhos de credito com mais clareza."
        subtitle="A Cote Juros nao e banco. Nosso papel e organizar informacoes, mostrar opcoes possiveis e conectar voce com a proxima etapa quando fizer sentido."
      />

      <section className="page-section bg-background">
        <div className="page-shell">
          <div className="mx-auto mb-16 max-w-3xl">
            <h2 className="mb-4">O que fazemos</h2>
            <div className="space-y-4 text-lg text-muted-foreground">
              <p>
                Quem procura credito normalmente encontra muitas promessas, formularios longos e pouca clareza. A Cote Juros existe para deixar esse primeiro passo mais simples.
              </p>
              <p>
                Voce informa o basico, entende quais caminhos podem combinar com o seu perfil e decide se quer seguir. A analise final, as condicoes e a liberacao do credito sempre dependem do parceiro.
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
