import React from 'react';
import { ArrowRight, BadgeCheck } from 'lucide-react';
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

function SuperSimInlineCTA({
  offer,
  title = 'Antes de decidir, vale comparar a SuperSim',
  description = 'Se o seu objetivo e ganhar agilidade sem perder contexto, a SuperSim entra como uma recomendacao editorial natural para continuar a pesquisa.',
  ctaLabel = 'Simular emprestimo',
  onSelect
}) {
  if (!offer) return null;

  const accent = offer?.metadata?.accentColor || '#16A34A';
  const logoUrl = offer?.imageUrl || offer?.metadata?.logoUrl || '';

  return (
    <section
      className="overflow-hidden rounded-[24px] border border-primary/15 bg-white shadow-[var(--shadow-sm)]"
      style={{ background: `linear-gradient(135deg, ${accent}10 0%, #ffffff 48%, rgba(20,83,45,0.08) 100%)` }}
    >
      <div className="grid gap-6 p-6 sm:p-7 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-center">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-3">
              <div
                className="flex h-14 w-14 items-center justify-center rounded-[18px] border bg-white shadow-[0_12px_28px_rgba(15,23,42,0.08)]"
                style={{ borderColor: `${accent}24` }}
              >
                {logoUrl ? (
                  <img src={logoUrl} alt={offer.merchantName} className="h-9 w-9 object-contain" />
                ) : (
                  <span className="text-base font-bold" style={{ color: accent }}>
                    {getInitials(offer.merchantName || title)}
                  </span>
                )}
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary/80">Recomendacao editorial</p>
                <p className="text-sm font-semibold text-foreground">{offer.merchantName}</p>
              </div>
            </div>

            <Badge variant="outline" className="border-primary/20 bg-white/90 text-foreground">
              {SUPERSIM_BADGES[0]}
            </Badge>
          </div>

          <div>
            <h3 className="text-2xl font-semibold tracking-[-0.04em] text-foreground">{title}</h3>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">{description}</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {SUPERSIM_BADGES.slice(1).map((item) => (
              <div key={item} className="rounded-[16px] border border-border bg-white/90 px-4 py-3 text-sm font-medium text-foreground">
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[22px] border border-white/70 bg-white/92 p-5 shadow-[0_18px_34px_rgba(15,23,42,0.08)]">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Por que olhar esta opcao</p>
          <div className="mt-4 space-y-3">
            <div className="flex items-start gap-2">
              <BadgeCheck className="mt-0.5 h-4 w-4 text-primary" />
              <p className="text-sm text-foreground">Fluxo online e leitura simples para seguir a comparacao.</p>
            </div>
            <div className="flex items-start gap-2">
              <BadgeCheck className="mt-0.5 h-4 w-4 text-primary" />
              <p className="text-sm text-foreground">Faz sentido quando a prioridade e ganhar velocidade sem parecer propaganda.</p>
            </div>
          </div>

          <Button
            className="mt-5 h-12 w-full justify-between rounded-[14px] px-5 text-sm font-semibold shadow-[0_14px_30px_rgba(15,23,42,0.12)]"
            onClick={() => onSelect?.(offer)}
          >
            {ctaLabel}
            <ArrowRight className="h-4 w-4" />
          </Button>

          <AffiliateDisclosure text={offer.disclosureText} className="mt-4" />
        </div>
      </div>
    </section>
  );
}

export default SuperSimInlineCTA;
