import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { SimulationModal } from '@/components/SimulationModal.jsx';
import { AdSpace } from '@/components/AdSpace.jsx';
import PageHero from '@/components/PageHero.jsx';

function SeoLandingPage({ title, description, heading, content }) {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
      </Helmet>

      <SimulationModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />

      <PageHero
        badge="Comparacao"
        title={heading}
        subtitle={description}
      >
        <Button size="lg" onClick={() => setModalOpen(true)}>
          Fazer simulacao gratuita
        </Button>
      </PageHero>

      <section className="page-section bg-background">
        <div className="page-shell grid gap-8 lg:grid-cols-[1fr_320px]">
          <div className="space-y-8">
            <AdSpace height="90px" />
            {content.map((paragraph, index) => (
              <React.Fragment key={`${paragraph.slice(0, 20)}-${index}`}>
                <div className="rounded-[16px] border border-border bg-background-secondary p-8">
                  <p>{paragraph}</p>
                </div>
                {index === 1 ? <AdSpace height="220px" /> : null}
              </React.Fragment>
            ))}

            <Card>
              <CardContent className="space-y-5 p-8">
                <h3>Pronto para comparar com mais clareza?</h3>
                <div className="space-y-3">
                  {[
                    'Analise inicial em fluxo simples.',
                    'Leitura organizada por taxa e prazo.',
                    'Comparacao com menos ruido visual.'
                  ].map((item) => (
                    <div key={item} className="flex items-start gap-3">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 text-foreground" />
                      <p className="text-muted-foreground">{item}</p>
                    </div>
                  ))}
                </div>
                <Button onClick={() => setModalOpen(true)}>
                  Comparar agora <ArrowRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="lg:sticky lg:top-24">
              <CardContent className="space-y-4 p-8">
                <h4>Por que usar o Cote Juros?</h4>
                <p className="text-sm text-muted-foreground">A plataforma foi redesenhada para apresentar menos ruído, mais respiro e uma hierarquia de texto muito mais clara.</p>
              </CardContent>
            </Card>
            <AdSpace height="600px" />
          </div>
        </div>
      </section>
    </>
  );
}

export default SeoLandingPage;
