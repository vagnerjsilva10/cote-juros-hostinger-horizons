import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import AffiliateDisclosure from './AffiliateDisclosure.jsx';

function AffiliateOfferCard({ offer, onSelect }) {
  if (!offer) return null;

  return (
    <Card className="surface-card h-full border-border bg-white">
      <CardContent className="flex h-full flex-col gap-5 p-6">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary/80">{offer.merchantName}</p>
          <h3 className="text-xl text-foreground">{offer.title}</h3>
          <p className="text-sm text-muted-foreground">{offer.description}</p>
        </div>

        {offer.audience ? (
          <div className="rounded-[12px] border border-border bg-background-secondary p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Para quem faz sentido</p>
            <p className="mt-2 text-sm text-muted-foreground">{offer.audience}</p>
          </div>
        ) : null}

        <Button className="mt-auto w-full" onClick={() => onSelect?.(offer)}>
          {offer.ctaText || 'Ver condições'} <ArrowRight className="h-4 w-4" />
        </Button>

        <AffiliateDisclosure text={offer.disclosureText} />
      </CardContent>
    </Card>
  );
}

export default AffiliateOfferCard;
