import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import AffiliateDisclosure from './AffiliateDisclosure.jsx';

function AffiliateSidebarWidget({ offer, onSelect }) {
  if (!offer) return null;

  return (
    <Card className="min-w-0 border-border bg-white">
      <CardContent className="min-w-0 space-y-4 p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary/80">Veja também</p>
        <h4 className="text-lg text-foreground">{offer.title}</h4>
        <p className="text-sm text-muted-foreground">{offer.description}</p>
        <Button className="w-full" onClick={() => onSelect?.(offer)}>
          {offer.ctaText || 'Ver condições'} <ArrowRight className="h-4 w-4" />
        </Button>
        <AffiliateDisclosure text={offer.disclosureText} />
      </CardContent>
    </Card>
  );
}

export default AffiliateSidebarWidget;
