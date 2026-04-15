import React from 'react';
import { ArrowRight, BadgeCheck, ShieldCheck, Zap } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import AffiliateDisclosure from './AffiliateDisclosure.jsx';
import { SUPERSIM_BADGES, SUPERSIM_BENEFITS } from '@/lib/supersim.js';

const getInitials = (value = '') =>
  String(value)
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

function SuperSimOfferCard({
  offer,
  title = 'SuperSim Empréstimo',
  description = 'Uma alternativa editorial para quem quer avaliar empréstimo online com análise rápida, linguagem simples e chance de encaixe para perfis com restrição.',
  ctaLabel = 'Simular empréstimo',
  badgeLabel = 'Destaque editorial',
  benefits = SUPERSIM_BENEFITS,
  onSelect
}) {
  if (!offer) return null;

  const accent = offer?.metadata?.accentColor || '#16A34A';
  const secondaryAccent = offer?.metadata?.secondaryAccentColor || '#14532D';
  const logoUrl = offer?.imageUrl || offer?.metadata?.logoUrl || '';

  return (
    <Card className="surface-card overflow-hidden border-border bg-white">
      <CardContent className="grid gap-0 p-0 lg:grid-cols-[minmax(0,1.12fr)_minmax(320px,0.88fr)]">
        <div
          className="relative overflow-hidden border-b border-border p-6 sm:p-7 lg:border-b-0 lg:border-r"
          style={{
            background: `linear-gradient(135deg, ${accent}12 0%, #ffffff 54%, ${secondaryAccent}10 100%)`
          }}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.96),transparent_42%)]" />

          <div className="relative space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <div
                  className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[20px] border bg-white shadow-[0_12px_24px_rgba(15,23,42,0.06)]"
                  style={{ borderColor: `${accent}24` }}
                >
                  {logoUrl ? (
                    <img src={logoUrl} alt={offer.merchantName} className="h-10 w-10 object-contain" />
                  ) : (
                    <span className="text-lg font-semibold" style={{ color: accent }}>
                      {getInitials(offer.merchantName || title)}
                    </span>
                  )}
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/80">{offer.merchantName}</p>
                  <Badge variant="outline" className="border-primary/15 bg-white/90 text-foreground">
                    <Zap className="mr-1 h-3.5 w-3.5" />
                    {badgeLabel}
                  </Badge>
                </div>
              </div>

              <div className="flex flex-wrap justify-end gap-2">
                {SUPERSIM_BADGES.map((item) => (
                  <Badge key={item} variant="outline" className="border-primary/15 bg-white/90 text-foreground">
                    {item}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <h2 className="text-2xl font-semibold tracking-[-0.04em] text-foreground sm:text-[1.95rem]">{title}</h2>
              <p className="max-w-2xl text-sm leading-7 text-muted-foreground sm:text-[15px]">
                {description}
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-[18px] border border-border bg-white/92 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Resumo rápido</p>
                <p className="mt-2 text-sm leading-7 text-foreground">
                  Ideal para quem quer uma leitura objetiva antes de seguir para a simulação externa.
                </p>
              </div>

              <div className="rounded-[18px] border border-border bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Perfil mais comum</p>
                <p className="mt-2 text-sm leading-7 text-foreground">
                  {offer.audience || 'Quem busca crédito pessoal online com fluxo simples e resposta ágil.'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex h-full flex-col gap-5 p-6 sm:p-7">
          <div className="space-y-4">
            {benefits.map((item) => (
              <div key={item} className="flex items-start gap-3 rounded-[16px] border border-border bg-background-secondary p-4">
                <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <p className="text-sm leading-7 text-foreground">{item}</p>
              </div>
            ))}
          </div>

          <div className="rounded-[18px] border border-border bg-white p-4">
            <div className="flex items-start gap-2">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <p className="text-sm leading-7 text-foreground">
                {offer.payoutText || 'Condições sujeitas à análise do parceiro e variam conforme o perfil.'}
              </p>
            </div>
          </div>

          <div className="mt-auto space-y-4">
            <Button
              className="h-12 w-full justify-between rounded-[14px] px-5 text-sm font-semibold"
              onClick={() => onSelect?.(offer)}
            >
              {ctaLabel}
              <ArrowRight className="h-4 w-4" />
            </Button>
            <AffiliateDisclosure text={offer.disclosureText} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default SuperSimOfferCard;
