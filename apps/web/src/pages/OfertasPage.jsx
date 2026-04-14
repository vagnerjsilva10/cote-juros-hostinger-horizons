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
        toast.error('Essa oferta ainda não possui link disponível.');
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
        eyebrow="Parceiros e ofertas"
        badge="Ambiente separado do produto principal"
        centered
        title="Veja parceiros em um espaço próprio, com clareza sobre o que acontece ao continuar."
        subtitle="As páginas principais da Cote Juros ficam focadas em contexto, comparação e entrada no fluxo. Nesta área, reunimos apenas ofertas externas e avisos editoriais."
      >
        <div className="flex flex-col justify-center gap-3 sm:flex-row">
          <Link to="/emprestimos">
            <Button size="lg" variant="outline">Voltar para a comparação</Button>
          </Link>
          <a href="#ofertas-emprestimos">
            <Button size="lg">Ver parceiros agora</Button>
          </a>
        </div>
      </PageHero>

      <section className="border-b border-border bg-background-secondary py-8">
        <div className="page-shell grid gap-4 md:grid-cols-3">
          <div className="interactive-card px-5 py-5">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Como esta página funciona</p>
            <p className="mt-3 text-sm leading-7 text-foreground">
              Aqui você encontra apenas destinos externos organizados por categoria.
            </p>
          </div>
          <div className="interactive-card px-5 py-5">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Aviso obrigatório</p>
            <p className="mt-3 text-sm leading-7 text-foreground">
              Para continuar, você será redirecionado ao parceiro.
            </p>
          </div>
          <div className="interactive-card px-5 py-5">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Transparência</p>
            <p className="mt-3 text-sm leading-7 text-foreground">
              Podemos receber comissão sem custo adicional para você.
            </p>
          </div>
        </div>
      </section>

      <div className="page-shell py-12">
        <section className="mb-12 rounded-[24px] border border-border bg-white p-8 shadow-[var(--shadow-sm)]">
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-primary">Estrutura separada</p>
              <h2 className="mt-3 text-3xl text-foreground">Produto principal de um lado. Parceiros do outro.</h2>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground">
                Esta separação evita confusão entre comparação interna, simulação e monetização. Você entende o produto principal primeiro e só vê parceiros quando escolhe entrar nesta página.
              </p>
            </div>

            <div className="grid gap-3 rounded-[20px] border border-border bg-background-secondary p-5">
              {[
                'Com base no seu perfil, a leitura principal continua nas páginas de produto.',
                'Para continuar, você será redirecionado ao parceiro.',
                'Podemos receber comissão sem custo adicional.'
              ].map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <p className="text-sm text-foreground">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="ofertas-emprestimos" className="space-y-6">
          <div className="max-w-3xl">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-primary">Empréstimos</p>
            <h2 className="mt-3 text-3xl text-foreground">Ofertas externas para quem quer seguir com crédito pessoal.</h2>
            <p className="mt-4 text-sm leading-7 text-muted-foreground">
              Esta seção é editorial e separada do comparador principal. Use apenas quando fizer sentido continuar em um ambiente externo.
            </p>
          </div>

          {supersimOffer ? (
            <SuperSimOfferCard
              offer={{ ...supersimOffer, disclosureText: supersimOffer.disclosureText || 'Podemos receber comissão sem custo adicional.' }}
              title="SuperSim"
              description="Oferta editorial separada do fluxo principal para quem quer avaliar crédito pessoal com linguagem mais simples e continuidade direta no parceiro."
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
          <section className="mt-16 space-y-6">
            <div className="max-w-3xl">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-primary">Cartões</p>
              <h2 className="mt-3 text-3xl text-foreground">Parceiros externos para continuar a análise de cartões.</h2>
              <p className="mt-4 text-sm leading-7 text-muted-foreground">
                Os comparativos continuam nas páginas principais. Aqui entram apenas opções de saída para parceiros.
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
          <section className="mt-16 space-y-6">
            <div className="max-w-3xl">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-primary">Financiamentos</p>
              <h2 className="mt-3 text-3xl text-foreground">Destinos externos para quem quer seguir em financiamento.</h2>
              <p className="mt-4 text-sm leading-7 text-muted-foreground">
                Mantivemos esta saída em uma área própria para deixar a arquitetura do produto mais limpa e previsível.
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

      <section className="border-t border-border bg-background-secondary py-16">
        <div className="page-shell">
          <div className="mx-auto max-w-4xl rounded-[24px] border border-border bg-white p-8 shadow-[var(--shadow-sm)]">
            <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-primary">Voltar para o produto</p>
                <h2 className="mt-3 text-3xl text-foreground">Quer continuar pela experiência principal da Cote Juros?</h2>
                <p className="mt-4 text-sm leading-7 text-muted-foreground">
                  Se você prefere comparar primeiro dentro do app, volte para as páginas principais e siga pela leitura interna antes de decidir.
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
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <p className="text-sm text-foreground">
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
