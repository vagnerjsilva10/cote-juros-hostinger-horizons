import React, { useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { ArrowRight, ExternalLink, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import PageHero from '@/components/PageHero.jsx';
import AffiliateOfferGrid from '@/components/affiliates/AffiliateOfferGrid.jsx';
import SuperSimOfferCard from '@/components/affiliates/SuperSimOfferCard.jsx';
import { Button } from '@/components/ui/button';
import { useAffiliatePlacements } from '@/hooks/useAffiliatePlacements.js';
import { affiliateRedirectService } from '@/platform/services/affiliateRedirectService.js';
import { getNonSupersimOffers, getSupersimOffer } from '@/lib/supersim.js';

const collectOffers = (placements = {}) => {
  const seen = new Set();

  return Object.values(placements)
    .flat()
    .filter(Boolean)
    .filter((offer) => {
      const key = offer.offerSlug || offer.id;
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
};

const handoffPoints = [
  'Esta área existe só para saídas externas, sem misturar com a comparação principal.',
  'Você entende o contexto antes e só clica quando a oferta fizer sentido.',
  'Se você avançar, a Cote Juros pode receber comissão sem custo extra para você.'
];

function OfertasPage() {
  const loanPlacements = useAffiliatePlacements({ pageSlug: '/emprestimos', productType: 'loan' });
  const creditCardPlacements = useAffiliatePlacements({ pageSlug: '/cartoes-de-credito', productType: 'credit_card' });
  const financingPlacements = useAffiliatePlacements({ pageSlug: '/financiamento', productType: 'financing' });

  const loanOffers = useMemo(() => collectOffers(loanPlacements), [loanPlacements]);
  const creditCardOffers = useMemo(() => collectOffers(creditCardPlacements), [creditCardPlacements]);
  const financingOffers = useMemo(() => collectOffers(financingPlacements), [financingPlacements]);

  const supersimOffer = useMemo(() => getSupersimOffer(loanOffers), [loanOffers]);
  const otherLoanOffers = useMemo(() => getNonSupersimOffers(loanOffers), [loanOffers]);
  const hasAnyOffer = loanOffers.length || creditCardOffers.length || financingOffers.length;

  const handleAffiliateClick = async (offer, position) => {
    try {
      const result = await affiliateRedirectService.create({
        offerSlug: offer.offerSlug,
        pageSlug: '/ofertas',
        position
      });

      if (!result?.redirectUrl) {
        toast.error('Esta oferta não está disponível agora.');
        return;
      }

      window.location.href = result.redirectUrl;
    } catch (error) {
      toast.error(error.message || 'Não foi possível abrir esta oferta agora.');
    }
  };

  return (
    <>
      <Helmet>
        <title>Ofertas externas selecionadas | Cote Juros</title>
        <meta
          name="description"
          content="Veja saídas externas em uma área separada, com leitura clara, aviso de saída e mais contexto antes do clique."
        />
      </Helmet>

      <PageHero
        eyebrow="Saídas externas"
        badge="Área separada da experiência principal"
        centered
        title="Quando fizer sentido sair da Cote Juros, as opções ficam aqui."
        subtitle="A comparação principal continua nas páginas de produto. Esta rota existe só para organizar ofertas externas com mais clareza, contexto e transparência."
      >
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-4">
          <div className="grid gap-4 md:grid-cols-3">
            {handoffPoints.map((item) => (
              <div
                key={item}
                className="rounded-[20px] border border-white/[0.08] bg-white/[0.04] px-5 py-5 text-left shadow-[0_16px_42px_rgba(2,6,23,0.16)] backdrop-blur"
              >
                <p className="text-sm leading-7 text-white/78">{item}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-col justify-center gap-3 sm:flex-row">
            <Link to="/emprestimos">
              <Button size="lg" variant="outline" className="hero-secondary-btn">
                Voltar para a comparação
              </Button>
            </Link>
            <a href="#ofertas-disponiveis" className="inline-flex">
              <Button size="lg">Ver ofertas agora</Button>
            </a>
          </div>
        </div>
      </PageHero>

      <div className="page-shell py-14 sm:py-18">
        <section className="grid gap-5 rounded-[28px] border border-border bg-white p-6 shadow-[var(--shadow-sm)] md:grid-cols-[1.1fr_0.9fr] md:p-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/80">Leitura direta</p>
            <h2 className="mt-3 text-3xl text-foreground">A área existe para não poluir a experiência principal.</h2>
            <p className="mt-4 max-w-2xl text-base leading-8 text-muted-foreground">
              Em vez de misturar saída externa com a leitura do produto, a Cote Juros deixa esse passo separado. Assim, você compara primeiro e só considera um clique externo quando isso fizer sentido.
            </p>
          </div>

          <div className="rounded-[24px] border border-border bg-background-secondary p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/80">Antes de seguir</p>
            <div className="mt-5 space-y-4">
              {[
                'Leia a descrição e o perfil mais comum da oferta.',
                'Entenda que o próximo passo acontece fora da Cote Juros.',
                'Compare custo, prazo e contexto antes de contratar.'
              ].map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <ShieldCheck className="mt-1 h-4 w-4 shrink-0 text-primary" />
                  <p className="text-sm leading-7 text-foreground">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="ofertas-disponiveis" className="mt-14 space-y-10">
          {!hasAnyOffer ? (
            <div className="rounded-[24px] border border-dashed border-border bg-background-secondary px-6 py-14 text-center">
              <h2 className="text-2xl text-foreground">Nenhuma oferta externa disponível agora</h2>
              <p className="mt-3 text-muted-foreground">Continue pela comparação principal para entender melhor o seu cenário antes de tentar novamente.</p>
              <div className="mt-6">
                <Link to="/emprestimos" className="inline-flex">
                  <Button>Ir para empréstimos</Button>
                </Link>
              </div>
            </div>
          ) : null}

          {loanOffers.length ? (
            <section className="space-y-6">
              <div className="max-w-3xl">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/80">Empréstimos</p>
                <h2 className="mt-3 text-3xl text-foreground">Ofertas externas para quem já decidiu olhar crédito pessoal.</h2>
                <p className="mt-4 text-base leading-8 text-muted-foreground">
                  Esta vitrine só faz sentido depois da leitura principal. Aqui entram saídas objetivas, sem prometer mais do que a oferta realmente entrega.
                </p>
              </div>

              {supersimOffer ? (
                <SuperSimOfferCard
                  offer={{
                    ...supersimOffer,
                    disclosureText:
                      supersimOffer.disclosureText || 'Se você avançar por este link, a Cote Juros pode receber comissão sem custo extra para você.'
                  }}
                  title="SuperSim"
                  description="Uma alternativa externa para quem quer seguir com empréstimo online de forma mais direta, depois de já ter comparado o cenário."
                  ctaLabel="Simular empréstimo"
                  badgeLabel="Saída externa"
                  onSelect={(offer) => handleAffiliateClick(offer, 'ofertas-loan-featured')}
                />
              ) : null}

              {otherLoanOffers.length ? (
                <AffiliateOfferGrid
                  offers={otherLoanOffers.map((offer) => ({
                    ...offer,
                    ctaText: offer.ctaText || 'Ver condições',
                    disclosureText:
                      offer.disclosureText || 'Se você avançar por este link, a Cote Juros pode receber comissão sem custo extra para você.'
                  }))}
                  title="Ao continuar, você será direcionado para uma instituição externa"
                  eyebrow="Ofertas externas"
                  onSelect={(offer) => handleAffiliateClick(offer, 'ofertas-loan-grid')}
                />
              ) : null}
            </section>
          ) : null}

          {creditCardOffers.length ? (
            <section className="space-y-6">
              <div className="max-w-3xl">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/80">Cartões</p>
                <h2 className="mt-3 text-3xl text-foreground">Saídas externas para quem quer seguir olhando cartões.</h2>
                <p className="mt-4 text-base leading-8 text-muted-foreground">
                  A comparação principal continua na navegação do produto. Esta seção existe só para organizar alternativas externas de forma mais limpa.
                </p>
              </div>

              <AffiliateOfferGrid
                offers={creditCardOffers.map((offer) => ({
                  ...offer,
                  ctaText: offer.ctaText || 'Ver condições',
                  disclosureText:
                    offer.disclosureText || 'Se você avançar por este link, a Cote Juros pode receber comissão sem custo extra para você.'
                }))}
                title="Ao continuar, você será direcionado para uma instituição externa"
                eyebrow="Ofertas externas"
                onSelect={(offer) => handleAffiliateClick(offer, 'ofertas-credit-card')}
              />
            </section>
          ) : null}

          {financingOffers.length ? (
            <section className="space-y-6">
              <div className="max-w-3xl">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/80">Financiamentos</p>
                <h2 className="mt-3 text-3xl text-foreground">Alternativas externas para quem quer seguir com financiamento.</h2>
                <p className="mt-4 text-base leading-8 text-muted-foreground">
                  Mantivemos esta área separada para o site continuar mais claro. A saída externa aparece aqui, e não no meio da jornada principal.
                </p>
              </div>

              <AffiliateOfferGrid
                offers={financingOffers.map((offer) => ({
                  ...offer,
                  ctaText: offer.ctaText || 'Simular financiamento',
                  disclosureText:
                    offer.disclosureText || 'Se você avançar por este link, a Cote Juros pode receber comissão sem custo extra para você.'
                }))}
                title="Ao continuar, você será direcionado para uma instituição externa"
                eyebrow="Ofertas externas"
                onSelect={(offer) => handleAffiliateClick(offer, 'ofertas-financing')}
              />
            </section>
          ) : null}
        </section>
      </div>

      <section className="border-t border-border bg-background-secondary py-16 sm:py-20">
        <div className="page-shell">
          <div className="mx-auto max-w-4xl rounded-[28px] border border-border bg-white p-8 shadow-[var(--shadow-sm)] sm:p-10">
            <div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-center">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/80">Voltar para o produto</p>
                <h2 className="mt-3 text-3xl text-foreground">Prefere decidir com mais calma dentro da Cote Juros?</h2>
                <p className="mt-4 text-base leading-8 text-muted-foreground">
                  Se você ainda quer comparar antes de sair do portal, continue pelas páginas principais e mantenha a leitura dentro da experiência principal.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row md:flex-col">
                <Link to="/emprestimos">
                  <Button className="w-full justify-between">
                    Ir para empréstimos
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/cartoes">
                  <Button variant="outline" className="w-full justify-between">
                    Ver cartões
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export default OfertasPage;
