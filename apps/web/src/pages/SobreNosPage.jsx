import React from 'react';
import { Helmet } from 'react-helmet';
import { Award, Shield, Target, Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import PageHero from '@/components/PageHero.jsx';

function SobreNosPage() {
  const values = [
    { icon: Target, title: 'Missão', description: 'Tornar a comparação de crédito mais legível, direta e menos cansativa para o usuário.' },
    { icon: Users, title: 'Transparência', description: 'Explicamos custo, prazo e aderência sem criar artifícios visuais desnecessários.' },
    { icon: Award, title: 'Qualidade', description: 'Dados atualizados e apresentação consistente ao longo de todo o sistema.' },
    { icon: Shield, title: 'Segurança', description: 'Coleta mínima e cuidado com o tratamento das informações pessoais.' }
  ];

  return (
    <>
      <Helmet>
        <title>Sobre - Cote Juros</title>
      </Helmet>

      <PageHero
        badge="Empresa"
        title="Uma camada de clareza entre o usuário e o mercado de crédito."
        subtitle="A proposta da Cote Juros é simplificar leitura, comparação e decisão com uma interface mais tipográfica e menos carregada."
      />

      <section className="page-section bg-background">
        <div className="page-shell">
          <div className="mx-auto mb-16 max-w-3xl">
            <h2 className="mb-4">Quem somos</h2>
            <div className="space-y-4 text-lg text-muted-foreground">
              <p>
                A Cote Juros nasceu para transformar comparação financeira em uma experiência mais clara. Em vez de competir por excesso visual, a plataforma organiza informação para que taxa, prazo e custo total sejam os protagonistas.
              </p>
              <p>
                O redesenho reforça essa ideia com uma linguagem mais próxima de software premium: muito espaço, contraste controlado e tipografia guiando o fluxo.
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
