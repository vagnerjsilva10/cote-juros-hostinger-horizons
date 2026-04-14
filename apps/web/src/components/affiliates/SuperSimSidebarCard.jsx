import React from 'react';
import { ArrowRight, BadgeCheck } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import AffiliateDisclosure from './AffiliateDisclosure.jsx';
import { SUPERSIM_BADGES } from '@/lib/supersim.js';

const getInitials = (value = '') =>
  String(value)
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

function SuperSimSidebarCard({
  offer,
  title = 'SuperSim',
  description = 'Opcao editorial para quem quer continuar a pesquisa com uma simulacao online.',
  ctaLabel = 'Simular emprestimo',
  onSelect
}) {
  if (!offer) return null;

  const accent = offer?.metadata?.accentColor || '#16A34A';
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
                {getInitials(offer.merchantName || title)}
              </span>
            )}
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary/80">Recomendado</p>
            <p className="text-sm font-semibold text-foreground">{title}</p>
          </div>
        </div>
      </div>

      <CardContent className="min-w-0 space-y-4 p-6">
        <div className="space-y-3">
          <Badge variant="outline" className="border-primary/20 bg-primary/[0.04] text-foreground">
            {SUPERSIM_BADGES[1]}
          </Badge>
          <h4 className="text-lg leading-7 text-foreground">{description}</h4>
          <p className="text-sm leading-6 text-muted-foreground">
            {offer.audience || 'Boa opcao para quem quer seguir para uma analise externa com mais contexto.'}
          </p>
        </div>

        <div className="space-y-2 rounded-[16px] border border-border bg-background-secondary p-4">
          {SUPERSIM_BADGES.filter((item) => item !== SUPERSIM_BADGES[1]).map((item) => (
            <div key={item} className="flex items-start gap-2">
              <BadgeCheck className="mt-0.5 h-4 w-4 text-primary" />
              <p className="text-sm text-foreground">{item}</p>
            </div>
          ))}
        </div>

        <Button className="h-11 w-full justify-between rounded-[14px] px-4 text-sm font-semibold" onClick={() => onSelect?.(offer)}>
          {ctaLabel}
          <ArrowRight className="h-4 w-4" />
        </Button>
        <AffiliateDisclosure text={offer.disclosureText} />
      </CardContent>
    </Card>
  );
}

export default SuperSimSidebarCard;
