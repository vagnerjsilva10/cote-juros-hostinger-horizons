import React from 'react';
import { Helmet } from 'react-helmet';
import { Award, Shield, Target, Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import PageHero from '@/components/PageHero.jsx';

function SobreNosPage() {
  const values = [
    { icon: Target, title: 'Missao', description: 'Tornar a comparacao de credito mais legivel, direta e menos cansativa para o usuario.' },
    { icon: Users, title: 'Transparencia', description: 'Explicamos custo, prazo e aderencia sem criar artificios visuais desnecessarios.' },
    { icon: Award, title: 'Qualidade', description: 'Dados atualizados e apresentacao consistente ao longo de todo o sistema.' },
    { icon: Shield, title: 'Seguranca', description: 'Coleta minima e cuidado com o tratamento das informacoes pessoais.' }
  ];

  return (
    <>
      <Helmet>
        <title>Sobre - Cote Juros</title>
      </Helmet>

      <PageHero
        badge="Empresa"
        title="Uma camada de clareza entre o usuario e o mercado de credito."
        subtitle="A proposta da Cote Juros e simplificar leitura, comparacao e decisao com uma interface mais tipografica e menos carregada."
      />

      <section className="page-section bg-background">
        <div className="page-shell">
          <div className="mx-auto mb-16 max-w-3xl">
            <h2 className="mb-4">Quem somos</h2>
            <div className="space-y-4 text-lg text-muted-foreground">
              <p>
                A Cote Juros nasceu para transformar comparacao financeira em uma experiencia mais clara. Em vez de competir por excesso visual, a plataforma organiza informacao para que taxa, prazo e custo total sejam os protagonistas.
              </p>
              <p>
                O redesenho reforca essa ideia com uma linguagem mais proxima de software premium: muito espaco, contraste controlado e tipografia guiando o fluxo.
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
