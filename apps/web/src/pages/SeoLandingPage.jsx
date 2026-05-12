import React, { useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import QuickCreditFlowModal from '@/components/QuickCreditFlowModal.jsx';
import AdSenseBlock, { ADSENSE_PLATFORM_SLOTS } from '@/components/AdSenseBlock.jsx';
import PageHero from '@/components/PageHero.jsx';
import { resolveSiteUrl } from '@/seo/seoCatalog.js';

function SeoLandingPage({ title, description, heading, content }) {
  const [modalOpen, setModalOpen] = useState(false);
  const canonicalUrl = useMemo(() => `${resolveSiteUrl()}${typeof window !== 'undefined' ? window.location.pathname : ''}`, []);

  return (
    <>
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={canonicalUrl} />
      </Helmet>

      <QuickCreditFlowModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        sourcePage={typeof window !== 'undefined' ? window.location.pathname : '/'}
        originLabel="seo-landing"
      />

      <PageHero
        badge="Credito"
        title={heading}
        subtitle={description}
      >
        <Button size="lg" onClick={() => setModalOpen(true)}>
          Ver minhas opcoes agora
        </Button>
      </PageHero>

      <section className="page-section bg-background">
        <div className="page-shell grid gap-8 lg:grid-cols-[1fr_320px]">
          <div className="space-y-8">
            <AdSenseBlock adSlot={ADSENSE_PLATFORM_SLOTS.blogTop} minHeight={120} />
            {content.map((paragraph, index) => (
              <React.Fragment key={`${paragraph.slice(0, 20)}-${index}`}>
                <div className="rounded-[16px] border border-border bg-background-secondary p-8">
                  <p>{paragraph}</p>
                </div>
                {index === 1 ? <AdSenseBlock adSlot={ADSENSE_PLATFORM_SLOTS.articleInline} minHeight={280} layout="in-article" format="fluid" /> : null}
              </React.Fragment>
            ))}

            <Card>
              <CardContent className="space-y-5 p-8">
                <h3>Quer seguir com mais clareza?</h3>
                <div className="space-y-3">
                  {[
                    'Comece por um fluxo simples.',
                    'Veja caminhos possiveis antes de decidir.',
                    'Sem compromisso e sem cobranca antecipada.'
                  ].map((item) => (
                    <div key={item} className="flex items-start gap-3">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 text-foreground" />
                      <p className="text-muted-foreground">{item}</p>
                    </div>
                  ))}
                </div>
                <Button onClick={() => setModalOpen(true)}>
                  Ver minhas opcoes agora <ArrowRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="space-y-4 p-8">
                <h3>Continue sua pesquisa</h3>
                <div className="grid gap-2 sm:grid-cols-2">
                  <Link to="/emprestimos" className="link-animated text-sm text-muted-foreground hover:text-foreground">Ver emprestimos</Link>
                  <Link to="/cartoes-de-credito" className="link-animated text-sm text-muted-foreground hover:text-foreground">Ver cartoes de credito</Link>
                  <Link to="/financiamento" className="link-animated text-sm text-muted-foreground hover:text-foreground">Ver financiamentos</Link>
                  <Link to="/blog" className="link-animated text-sm text-muted-foreground hover:text-foreground">Ler conteudos do blog</Link>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="lg:sticky lg:top-24">
              <CardContent className="space-y-4 p-8">
                <h4>Antes de seguir</h4>
                <p className="text-sm text-muted-foreground">
                  A Cote Juros nao e banco, nao garante aprovacao e nao cobra valor antecipado. Nosso papel e ajudar voce a ver caminhos possiveis com mais clareza.
                </p>
              </CardContent>
            </Card>
            <AdSenseBlock adSlot={ADSENSE_PLATFORM_SLOTS.articleSidebar} minHeight={320} />
          </div>
        </div>
      </section>
    </>
  );
}

export default SeoLandingPage;
