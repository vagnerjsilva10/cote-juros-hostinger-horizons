import React from 'react';
import { ArrowRight, BadgeCheck, Building2 } from 'lucide-react';
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

function AffiliateInlineCTA({ offer, title = 'Compare uma opção relacionada', onSelect }) {
  if (!offer) return null;

  const accent = offer?.metadata?.accentColor || '#0F766E';
  const logoUrl = offer?.metadata?.logoUrl || '';

  return (
    <section
      className="overflow-hidden rounded-[24px] border border-primary/15 bg-white shadow-[var(--shadow-sm)]"
      style={{ background: `linear-gradient(135deg, ${accent}10 0%, #ffffff 48%, rgba(217,119,6,0.08) 100%)` }}
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
                    {getInitials(offer.merchantName || offer.title)}
                  </span>
                )}
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary/80">Veja também</p>
                <p className="text-sm font-semibold text-foreground">{offer.merchantName}</p>
              </div>
            </div>

            <Badge variant="outline" className="border-primary/20 bg-white/90 text-foreground">
              <Building2 className="mr-1 h-3.5 w-3.5" />
              Oferta relacionada
            </Badge>
          </div>

          <div>
            <h3 className="text-2xl font-semibold tracking-[-0.04em] text-foreground">{title}</h3>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">{offer.description}</p>
          </div>

          <div className="rounded-[18px] border border-border bg-white/90 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Ideal para</p>
            <p className="mt-2 text-sm leading-6 text-foreground">
              {offer.audience || 'Quem quer comparar melhor antes de seguir para a contratação.'}
            </p>
          </div>
        </div>

        <div className="rounded-[22px] border border-white/70 bg-white/92 p-5 shadow-[0_18px_34px_rgba(15,23,42,0.08)]">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Resumo rápido</p>
          <div className="mt-4 space-y-3">
            <div className="flex items-start gap-2">
              <BadgeCheck className="mt-0.5 h-4 w-4 text-primary" />
              <p className="text-sm text-foreground">Leitura simples das condições antes de sair da página.</p>
            </div>
            <div className="flex items-start gap-2">
              <BadgeCheck className="mt-0.5 h-4 w-4 text-primary" />
              <p className="text-sm text-foreground">Boa opção para comparar perfil, custos e praticidade.</p>
            </div>
          </div>

          <Button
            className="mt-5 h-12 w-full justify-between rounded-[14px] px-5 text-sm font-semibold shadow-[0_14px_30px_rgba(15,23,42,0.12)]"
            onClick={() => onSelect?.(offer)}
          >
            {offer.ctaText || 'Ver condições'}
            <ArrowRight className="h-4 w-4" />
          </Button>

          <AffiliateDisclosure text={offer.disclosureText} className="mt-4" />
        </div>
      </div>
    </section>
  );
}

export default AffiliateInlineCTA;
