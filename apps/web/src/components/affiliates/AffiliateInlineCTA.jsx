import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AffiliateDisclosure from './AffiliateDisclosure.jsx';

function AffiliateInlineCTA({ offer, title = 'Compare uma opção relacionada', onSelect }) {
  if (!offer) return null;

  return (
    <section className="rounded-[20px] border border-primary/20 bg-white p-6 shadow-[var(--shadow-sm)]">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary/80">Conteúdo relacionado</p>
      <h3 className="mt-2 text-2xl text-foreground">{title}</h3>
      <p className="mt-3 text-sm text-muted-foreground">{offer.description}</p>
      {offer.audience ? <p className="mt-3 text-sm text-muted-foreground">{offer.audience}</p> : null}
      <div className="mt-5">
        <Button onClick={() => onSelect?.(offer)}>
          {offer.ctaText || 'Ver condições'} <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
      <AffiliateDisclosure text={offer.disclosureText} className="mt-4" />
    </section>
  );
}

export default AffiliateInlineCTA;
