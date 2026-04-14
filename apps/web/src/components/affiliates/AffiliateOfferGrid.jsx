import React from 'react';
import AffiliateOfferCard from './AffiliateOfferCard.jsx';

function AffiliateOfferGrid({ offers = [], title, eyebrow = 'Opções em destaque', onSelect }) {
  if (!offers.length) return null;

  return (
    <section className="rounded-[24px] border border-border bg-white p-8 shadow-[var(--shadow-sm)]">
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary/80">{eyebrow}</p>
        {title ? <h2 className="mt-2 text-3xl tracking-[-0.04em] text-foreground">{title}</h2> : null}
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {offers.map((offer) => (
          <AffiliateOfferCard key={offer.offerSlug} offer={offer} onSelect={onSelect} />
        ))}
      </div>
    </section>
  );
}

export default AffiliateOfferGrid;
