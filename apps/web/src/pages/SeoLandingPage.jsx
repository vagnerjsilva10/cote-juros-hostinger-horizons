
import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { Button } from '@/components/ui/button';
import { SimulationModal } from '@/components/SimulationModal.jsx';
import { AdSpace } from '@/components/AdSpace.jsx';
import { CheckCircle2, ArrowRight } from 'lucide-react';

function SeoLandingPage({ title, description, heading, content, type }) {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
      </Helmet>

      <SimulationModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />

      <div className="min-h-screen bg-background">
        <div className="bg-card border-b border-border py-16 md:py-24 relative overflow-hidden">
          <div className="absolute right-0 top-0 w-1/3 h-full bg-primary/5 rounded-l-full blur-3xl" />
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="max-w-3xl">
              <h1 className="mb-6 text-foreground">
                {heading}
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                {description}
              </p>
              <Button size="lg" className="h-14 px-8 text-lg rounded-xl gradient-fintech-hover border-0 text-white shadow-md" onClick={() => setModalOpen(true)}>
                Fazer simulação gratuita
              </Button>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid md:grid-cols-3 gap-12">
            <div className="md:col-span-2">
              <AdSpace height="90px" className="mb-8" />
              
              <div className="prose prose-lg dark:prose-invert max-w-none text-foreground leading-relaxed">
                {content.map((paragraph, index) => (
                  <React.Fragment key={index}>
                    <p className="mb-6">{paragraph}</p>
                    {index === 1 && <AdSpace height="250px" className="my-8" />}
                  </React.Fragment>
                ))}
              </div>
              
              <div className="mt-12 bg-primary/5 border border-primary/20 rounded-2xl p-8">
                <h3 className="mb-4 text-foreground">Pronto para encontrar a melhor oferta?</h3>
                <ul className="space-y-3 mb-6">
                  {['Análise de crédito em tempo real', 'Sem impacto no seu Score', 'Comparamos +50 instituições'].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-foreground font-medium">
                      <CheckCircle2 className="w-5 h-5 text-primary" /> {item}
                    </li>
                  ))}
                </ul>
                <Button className="gradient-fintech-hover border-0 text-white h-12 px-6 rounded-xl" onClick={() => setModalOpen(true)}>
                  Comparar agora <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-card border border-border rounded-2xl p-6 shadow-sm sticky top-28">
                <h4 className="font-bold text-lg mb-4 text-foreground">Por que usar o Cote Juros?</h4>
                <div className="space-y-4">
                  <div>
                    <h5 className="font-semibold text-primary">100% Gratuito</h5>
                    <p className="text-sm text-muted-foreground">Você não paga nada para usar nosso comparador.</p>
                  </div>
                  <div>
                    <h5 className="font-semibold text-secondary">Imparcialidade</h5>
                    <p className="text-sm text-muted-foreground">Mostramos as ofertas com as menores taxas primeiro.</p>
                  </div>
                  <div>
                    <h5 className="font-semibold text-accent">Segurança LGPD</h5>
                    <p className="text-sm text-muted-foreground">Seus dados são criptografados de ponta a ponta.</p>
                  </div>
                </div>
              </div>
              <AdSpace height="600px" />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default SeoLandingPage;
