import React from 'react';
import AffiliateOfferCard from './AffiliateOfferCard.jsx';

function AffiliateOfferGrid({ offers = [], title, eyebrow = 'Destino externo', onSelect }) {
  if (!offers.length) return null;

  const isSingle = offers.length === 1;

  return (
    <section className="overflow-hidden rounded-[28px] border border-border bg-white shadow-[var(--shadow-sm)]">
      <div className="border-b border-border bg-[linear-gradient(180deg,rgba(245,247,250,0.92)_0%,rgba(255,255,255,0.98)_100%)] px-6 py-6 sm:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/80">{eyebrow}</p>
        {title ? (
          <div className="mt-2 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <h2 className="max-w-3xl text-3xl font-semibold tracking-[-0.05em] text-foreground">{title}</h2>
            <p className="max-w-xl text-sm leading-6 text-muted-foreground">
              Para continuar, você será redirecionado ao parceiro. Compare com calma e avance apenas se as condições fizerem sentido.
            </p>
          </div>
        ) : null}
      </div>

      <div className={`grid gap-5 p-5 sm:p-6 ${isSingle ? 'grid-cols-1' : 'md:grid-cols-2 xl:grid-cols-3'}`.trim()}>
        {offers.map((offer) => (
          <AffiliateOfferCard
            key={offer.offerSlug}
            offer={offer}
            onSelect={onSelect}
            featured={isSingle}
          />
        ))}
      </div>
    </section>
  );
}

export default AffiliateOfferGrid;
