import React, { useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, ExternalLink, ShieldCheck } from 'lucide-react';
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

const trustPoints = [
  'Aqui ficam apenas opções externas selecionadas.',
  'Antes de clicar, você entende o que pode esperar.',
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

  const handleAffiliateClick = async (offer, position) => {
    try {
      const result = await affiliateRedirectService.create({
        offerSlug: offer.offerSlug,
        pageSlug: '/ofertas',
        position
      });

      if (!result?.redirectUrl) {
        toast.error('Esta oferta ainda não está disponível agora.');
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
        <title>Ofertas externas selecionadas - Cote Juros</title>
        <meta
          name="description"
          content="Veja ofertas externas em uma área separada, com leitura clara, aviso de saída e transparência antes de continuar."
        />
      </Helmet>

      <PageHero
        eyebrow="Ofertas externas"
        badge="Área separada da experiência principal"
        centered
        title="Quando fizer sentido sair do portal, você encontra as opções aqui."
        subtitle="A experiência principal da Cote Juros continua focada em clareza e comparação. Nesta área, reunimos apenas ofertas externas com leitura rápida, aviso de saída e mais contexto antes do clique."
      >
        <div className="flex flex-col items-center justify-center gap-4">
          <div className="grid w-full max-w-4xl gap-4 md:grid-cols-3">
            {trustPoints.map((item, index) => (
              <div
                key={item}
                className="interactive-card rounded-[20px] border border-border bg-white/92 px-5 py-5 text-left shadow-[0_12px_32px_rgba(15,23,42,0.05)] animate-fade-in-up"
                style={{ animationDelay: `${index * 80}ms` }}
              >
                <p className="text-sm leading-7 text-foreground">{item}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-col justify-center gap-3 sm:flex-row">
            <Link to="/emprestimos">
              <Button size="lg" variant="outline">Voltar para a comparação</Button>
            </Link>
            <a href="#ofertas-emprestimos">
              <Button size="lg">Ver ofertas agora</Button>
            </a>
          </div>
        </div>
      </PageHero>

      <div className="page-shell py-14 sm:py-20">
        <section className="rounded-[28px] border border-border bg-white p-8 shadow-[var(--shadow-sm)] sm:p-10">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/80">Curadoria separada</p>
              <h2 className="mt-3 max-w-2xl text-3xl text-foreground">
                A comparação principal fica de um lado. As saídas externas ficam aqui.
              </h2>
              <p className="mt-4 max-w-2xl text-base leading-8 text-muted-foreground">
                Esta página existe para manter a experiência principal mais limpa. Você entende seu momento primeiro e só considera uma opção externa quando isso realmente fizer sentido.
              </p>
            </div>

            <div className="rounded-[24px] border border-border bg-background-secondary p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/80">O que você encontra aqui</p>
              <div className="mt-5 space-y-4">
                {[
                  'Destaques com leitura rápida e linguagem simples.',
                  'Resumo objetivo sobre perfil mais comum e pontos de atenção.',
                  'Aviso claro antes de qualquer saída da Cote Juros.'
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-primary" />
                    <p className="text-sm leading-7 text-foreground">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="ofertas-emprestimos" className="mt-16 space-y-6">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/80">Empréstimos</p>
            <h2 className="mt-3 text-3xl text-foreground">Opções para quem quer avançar com crédito pessoal.</h2>
            <p className="mt-4 text-base leading-8 text-muted-foreground">
              Esta área é separada da comparação principal. Use quando você já tiver entendido o cenário e quiser olhar uma alternativa externa com mais objetividade.
            </p>
          </div>

          {supersimOffer ? (
            <SuperSimOfferCard
              offer={{ ...supersimOffer, disclosureText: supersimOffer.disclosureText || 'Se você avançar por este link, a Cote Juros pode receber comissão sem custo extra para você.' }}
              title="SuperSim"
              description="Uma opção para quem quer comparar empréstimo pessoal com leitura simples, pedido 100% online e uma saída mais direta quando o momento pede agilidade."
              ctaLabel="Simular empréstimo"
              badgeLabel="Destaque editorial"
              onSelect={(offer) => handleAffiliateClick(offer, 'ofertas-loan-featured')}
            />
          ) : null}

          {otherLoanOffers.length ? (
            <AffiliateOfferGrid
              offers={otherLoanOffers.map((offer) => ({
                ...offer,
                ctaText: offer.ctaText || 'Ver condições',
                disclosureText: offer.disclosureText || 'Se você avançar por este link, a Cote Juros pode receber comissão sem custo extra para você.'
              }))}
              title="Para continuar, você será direcionado para uma instituição externa"
              eyebrow="Ofertas externas"
              onSelect={(offer) => handleAffiliateClick(offer, 'ofertas-loan-grid')}
            />
          ) : null}
        </section>

        {creditCardOffers.length ? (
          <section className="mt-20 space-y-6">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/80">Cartões</p>
              <h2 className="mt-3 text-3xl text-foreground">Saídas externas para quem quer continuar olhando cartões.</h2>
              <p className="mt-4 text-base leading-8 text-muted-foreground">
                A comparação principal continua nas páginas do produto. Aqui ficam apenas alternativas externas para quem decidiu seguir.
              </p>
            </div>

            <AffiliateOfferGrid
              offers={creditCardOffers.map((offer) => ({
                ...offer,
                ctaText: offer.ctaText || 'Ver condições',
                disclosureText: offer.disclosureText || 'Se você avançar por este link, a Cote Juros pode receber comissão sem custo extra para você.'
              }))}
              title="Para continuar, você será direcionado para uma instituição externa"
              eyebrow="Ofertas externas"
              onSelect={(offer) => handleAffiliateClick(offer, 'ofertas-credit-card')}
            />
          </section>
        ) : null}

        {financingOffers.length ? (
          <section className="mt-20 space-y-6">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/80">Financiamentos</p>
              <h2 className="mt-3 text-3xl text-foreground">Alternativas externas para quem quer seguir com financiamento.</h2>
              <p className="mt-4 text-base leading-8 text-muted-foreground">
                Mantivemos esta área separada para que a experiência principal continue limpa e a saída externa apareça só na hora certa.
              </p>
            </div>

            <AffiliateOfferGrid
              offers={financingOffers.map((offer) => ({
                ...offer,
                ctaText: offer.ctaText || 'Simular financiamento',
                disclosureText: offer.disclosureText || 'Se você avançar por este link, a Cote Juros pode receber comissão sem custo extra para você.'
              }))}
              title="Para continuar, você será direcionado para uma instituição externa"
              eyebrow="Ofertas externas"
              onSelect={(offer) => handleAffiliateClick(offer, 'ofertas-financing')}
            />
          </section>
        ) : null}
      </div>

      <section className="border-t border-border bg-background-secondary py-16 sm:py-20">
        <div className="page-shell">
          <div className="mx-auto max-w-4xl rounded-[28px] border border-border bg-white p-8 shadow-[var(--shadow-sm)] sm:p-10">
            <div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-center">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/80">Voltar para o produto</p>
                <h2 className="mt-3 text-3xl text-foreground">Prefere decidir com mais calma dentro da Cote Juros?</h2>
                <p className="mt-4 text-base leading-8 text-muted-foreground">
                  Se você ainda quer comparar antes de sair do portal, volte para as páginas principais e continue pela leitura interna.
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

            <div className="mt-6 flex items-start gap-3 rounded-[18px] border border-border bg-background-secondary p-4">
              <ShieldCheck className="mt-1 h-4 w-4 shrink-0 text-primary" />
              <p className="text-sm leading-7 text-foreground">
                Esta página reúne apenas saídas externas. A experiência principal continua separada, com foco em contexto, comparação e clareza.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export default OfertasPage;
