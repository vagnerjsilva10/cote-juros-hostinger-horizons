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
  'Esta área reúne apenas destinos externos selecionados.',
  'Para continuar, você será redirecionado ao parceiro.',
  'Podemos receber comissão sem custo adicional para você.'
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
        toast.error('Esta oferta ainda não possui link disponível.');
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
        <title>Ofertas e parceiros - Cote Juros</title>
        <meta
          name="description"
          content="Veja ofertas de parceiros em uma página separada, com aviso claro de redirecionamento e transparência sobre comissão."
        />
      </Helmet>

      <PageHero
        eyebrow="Ofertas selecionadas"
        badge="Ambiente separado do produto principal"
        centered
        title="Veja parceiros em um espaço próprio, com clareza antes de continuar."
        subtitle="As páginas principais da Cote Juros seguem focadas em contexto, comparação e leitura do seu cenário. Nesta área, reunimos apenas ofertas externas com aviso editorial e transparência."
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
              <Button size="lg">Ver ofertas selecionadas</Button>
            </a>
          </div>
        </div>
      </PageHero>

      <div className="page-shell py-14 sm:py-18">
        <section className="rounded-[28px] border border-border bg-white p-8 shadow-[var(--shadow-sm)] sm:p-10">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/80">Curadoria separada</p>
              <h2 className="mt-3 max-w-2xl text-3xl text-foreground">
                Produto principal de um lado. Continuidade com parceiros do outro.
              </h2>
              <p className="mt-4 max-w-2xl text-base leading-8 text-muted-foreground">
                Esta página existe para manter a experiência principal mais clara. Você entende o produto dentro da Cote Juros primeiro e só entra em uma oferta externa quando isso fizer sentido para o seu momento.
              </p>
            </div>

            <div className="rounded-[24px] border border-border bg-background-secondary p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/80">O que você encontra aqui</p>
              <div className="mt-5 space-y-4">
                {[
                  'Destaques editoriais com leitura rápida do cenário.',
                  'Resumo simples sobre perfil indicado e próximos passos.',
                  'Aviso explícito antes de qualquer saída da Cote Juros.'
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
            <h2 className="mt-3 text-3xl text-foreground">Ofertas externas para quem decidiu avançar com crédito pessoal.</h2>
            <p className="mt-4 text-base leading-8 text-muted-foreground">
              Esta seção é editorial e separada do comparador principal. Use-a quando você já tiver entendido o contexto e quiser seguir para uma simulação no ambiente do parceiro.
            </p>
          </div>

          {supersimOffer ? (
            <SuperSimOfferCard
              offer={{ ...supersimOffer, disclosureText: supersimOffer.disclosureText || 'Podemos receber comissão sem custo adicional.' }}
              title="SuperSim"
              description="Uma opção editorial para quem quer avaliar crédito pessoal com linguagem direta, leitura simples e continuidade externa bem sinalizada."
              ctaLabel="Simular empréstimo"
              badgeLabel="Destaque editorial"
              onSelect={(offer) => handleAffiliateClick(offer, 'ofertas-loan-featured')}
            />
          ) : null}

          {otherLoanOffers.length ? (
            <AffiliateOfferGrid
              offers={otherLoanOffers.map((offer) => ({
                ...offer,
                ctaText: offer.ctaText || 'Simular empréstimo',
                disclosureText: offer.disclosureText || 'Podemos receber comissão sem custo adicional.'
              }))}
              title="Para continuar, você será redirecionado ao parceiro"
              eyebrow="Ofertas externas"
              onSelect={(offer) => handleAffiliateClick(offer, 'ofertas-loan-grid')}
            />
          ) : null}
        </section>

        {creditCardOffers.length ? (
          <section className="mt-20 space-y-6">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/80">Cartões</p>
              <h2 className="mt-3 text-3xl text-foreground">Parceiros externos para quem quer continuar a análise de cartões.</h2>
              <p className="mt-4 text-base leading-8 text-muted-foreground">
                Os comparativos continuam nas páginas principais. Aqui ficam apenas opções externas para seguir em um ambiente parceiro, com aviso claro antes do clique.
              </p>
            </div>

            <AffiliateOfferGrid
              offers={creditCardOffers.map((offer) => ({
                ...offer,
                ctaText: offer.ctaText || 'Ver cartão',
                disclosureText: offer.disclosureText || 'Podemos receber comissão sem custo adicional.'
              }))}
              title="Para continuar, você será redirecionado ao parceiro"
              eyebrow="Parceiros externos"
              onSelect={(offer) => handleAffiliateClick(offer, 'ofertas-credit-card')}
            />
          </section>
        ) : null}

        {financingOffers.length ? (
          <section className="mt-20 space-y-6">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/80">Financiamentos</p>
              <h2 className="mt-3 text-3xl text-foreground">Destinos externos para quem quer seguir com financiamento.</h2>
              <p className="mt-4 text-base leading-8 text-muted-foreground">
                Mantivemos essa saída em uma área própria para preservar a leitura do produto principal e deixar cada passo mais previsível.
              </p>
            </div>

            <AffiliateOfferGrid
              offers={financingOffers.map((offer) => ({
                ...offer,
                ctaText: offer.ctaText || 'Simular financiamento',
                disclosureText: offer.disclosureText || 'Podemos receber comissão sem custo adicional.'
              }))}
              title="Para continuar, você será redirecionado ao parceiro"
              eyebrow="Parceiros externos"
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
                <h2 className="mt-3 text-3xl text-foreground">Quer continuar pela experiência principal da Cote Juros?</h2>
                <p className="mt-4 text-base leading-8 text-muted-foreground">
                  Se você prefere comparar primeiro dentro do app, volte para as páginas principais e siga pela leitura interna antes de decidir por um parceiro.
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
                Esta página reúne apenas parceiros e destinos externos. O produto principal continua separado, com foco em contexto, comparação e clareza.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export default OfertasPage;
