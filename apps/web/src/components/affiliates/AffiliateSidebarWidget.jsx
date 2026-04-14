import React from 'react';
import { ArrowRight, BadgeCheck } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import AffiliateDisclosure from './AffiliateDisclosure.jsx';

const getInitials = (value = '') =>
  String(value)
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

function AffiliateSidebarWidget({ offer, onSelect }) {
  if (!offer) return null;

  const accent = offer?.metadata?.accentColor || '#0F766E';
  const logoUrl = offer?.imageUrl || offer?.metadata?.logoUrl || '';

  return (
    <Card className="min-w-0 overflow-hidden border-border bg-white">
      <div
        className="border-b border-border p-5"
        style={{ background: `linear-gradient(135deg, ${accent}12 0%, #ffffff 100%)` }}
      >
        <div className="flex items-center gap-3">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-[16px] border bg-white shadow-[0_10px_24px_rgba(15,23,42,0.08)]"
            style={{ borderColor: `${accent}24` }}
          >
            {logoUrl ? (
              <img src={logoUrl} alt={offer.merchantName} className="h-8 w-8 object-contain" />
            ) : (
              <span className="text-sm font-bold" style={{ color: accent }}>
                {getInitials(offer.merchantName || offer.title)}
              </span>
            )}
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary/80">Veja também</p>
            <p className="text-sm font-semibold text-foreground">{offer.merchantName}</p>
          </div>
        </div>
      </div>

      <CardContent className="min-w-0 space-y-4 p-6">
        <div className="space-y-3">
          <Badge variant="outline" className="border-primary/20 bg-primary/[0.04] text-foreground">
            {offer.category}
          </Badge>
          <h4 className="text-lg leading-7 text-foreground">{offer.title}</h4>
          <p className="text-sm leading-6 text-muted-foreground">{offer.description}</p>
        </div>

        {offer.audience ? (
          <div className="rounded-[16px] border border-border bg-background-secondary p-4">
            <div className="flex items-start gap-2">
              <BadgeCheck className="mt-0.5 h-4 w-4 text-primary" />
              <p className="text-sm text-foreground">{offer.audience}</p>
            </div>
          </div>
        ) : null}

        <Button className="h-11 w-full justify-between rounded-[14px] px-4 text-sm font-semibold" onClick={() => onSelect?.(offer)}>
          {offer.ctaText || 'Ver condições'} <ArrowRight className="h-4 w-4" />
        </Button>
        <AffiliateDisclosure text={offer.disclosureText} />
      </CardContent>
    </Card>
  );
}

export default AffiliateSidebarWidget;
