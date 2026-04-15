import React from 'react';
import { ArrowRight, BadgeCheck, Building2, Clock3, ShieldCheck } from 'lucide-react';
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

const normalize = (value = '') =>
  String(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

const buildBadgeList = (offer = {}) => {
  if (Array.isArray(offer?.metadata?.badges) && offer.metadata.badges.length) {
    return offer.metadata.badges.slice(0, 3);
  }

  const category = normalize(offer.category || '');
  const audience = normalize(offer.audience || '');
  const title = normalize(offer.title || '');
  const badges = [];

  if (title.includes('rapida') || title.includes('rapido') || audience.includes('rapida')) badges.push('Análise rápida');
  if (category.includes('emprest')) badges.push('Crédito online');
  if (category.includes('cart')) badges.push('Leitura simples');
  if (category.includes('financi')) badges.push('Entenda os custos');
  if (audience.includes('negativado')) badges.push('Para negativado');
  if (audience.includes('mei')) badges.push('Ideal para MEI');
  if (audience.includes('sem garantia') || title.includes('sem garantia')) badges.push('Sem garantia');

  return [...new Set(badges)].slice(0, 3);
};

function AffiliateOfferCard({ offer, onSelect, featured = false }) {
  if (!offer) return null;

  const logoUrl = offer?.imageUrl || offer?.metadata?.logoUrl || '';
  const accentFromMeta = offer?.metadata?.accentColor || '#2563EB';
  const secondaryAccent = offer?.metadata?.secondaryAccentColor || '#0F172A';
  const badges = buildBadgeList(offer);

  return (
    <Card className={`surface-card h-full overflow-hidden border-border bg-white ${featured ? 'lg:col-span-2 xl:col-span-3' : ''}`.trim()}>
      <CardContent className={`grid h-full gap-0 p-0 ${featured ? 'lg:grid-cols-[minmax(0,1.12fr)_minmax(320px,0.88fr)]' : ''}`.trim()}>
        <div
          className="relative overflow-hidden border-b border-border p-6 sm:p-7 lg:border-b-0 lg:border-r"
          style={{
            background: `linear-gradient(135deg, ${accentFromMeta}12 0%, #ffffff 54%, ${secondaryAccent}08 100%)`
          }}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.96),transparent_40%)]" />
          <div className="relative flex h-full flex-col gap-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <div
                  className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[20px] border bg-white shadow-[0_12px_24px_rgba(15,23,42,0.06)]"
                  style={{ borderColor: `${accentFromMeta}22` }}
                >
                  {logoUrl ? (
                    <img src={logoUrl} alt={offer.merchantName} className="h-10 w-10 object-contain" />
                  ) : (
                    <span className="text-lg font-semibold" style={{ color: accentFromMeta }}>
                      {getInitials(offer.merchantName || offer.title)}
                    </span>
                  )}
                </div>

                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/80">
                    {offer.merchantName}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Badge variant="outline" className="border-primary/15 bg-white/90 text-foreground">
                      <Building2 className="mr-1 h-3.5 w-3.5" />
                      Parceiro externo
                    </Badge>
                    {badges[0] ? (
                      <Badge variant="outline" className="border-primary/15 bg-white/90 text-foreground">
                        <Clock3 className="mr-1 h-3.5 w-3.5" />
                        {badges[0]}
                      </Badge>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="hidden rounded-full border border-primary/12 bg-white/88 px-3 py-1 text-xs font-medium text-primary sm:block">
                {offer.category}
              </div>
            </div>

            <div className="max-w-2xl">
              <h3 className="text-2xl font-semibold tracking-[-0.04em] text-foreground sm:text-[1.95rem]">
                {offer.title}
              </h3>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-[15px]">
                {offer.description}
              </p>
            </div>

            {badges.length > 1 ? (
              <div className="flex flex-wrap gap-2">
                {badges.slice(1).map((badge) => (
                  <span
                    key={badge}
                    className="rounded-full border border-border bg-white/90 px-3 py-1.5 text-xs font-medium text-foreground"
                  >
                    {badge}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex h-full flex-col gap-5 p-6 sm:p-7">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            <div className="rounded-[18px] border border-border bg-background-secondary p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Ideal para
              </p>
              <p className="mt-2 text-sm leading-7 text-foreground">
                {offer.audience || 'Quem quer comparar custos, prazo e leitura das condições antes de seguir.'}
              </p>
            </div>

            <div className="rounded-[18px] border border-border bg-white p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                O que acontece ao clicar
              </p>
              <div className="mt-3 space-y-2">
                <div className="flex items-start gap-2">
                  <BadgeCheck className="mt-0.5 h-4 w-4 text-primary" />
                  <p className="text-sm leading-6 text-foreground">Você sai da Cote Juros e continua no ambiente do parceiro.</p>
                </div>
                <div className="flex items-start gap-2">
                  <ShieldCheck className="mt-0.5 h-4 w-4 text-primary" />
                  <p className="text-sm leading-6 text-foreground">
                    {offer.payoutText || 'Avance apenas se as condições fizerem sentido para o seu momento.'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-auto space-y-4">
            <Button
              className="w-full justify-between rounded-[12px]"
              onClick={() => onSelect?.(offer)}
            >
              {offer.ctaText || 'Continuar no parceiro'}
              <ArrowRight className="h-4 w-4" />
            </Button>

            <AffiliateDisclosure text={offer.disclosureText} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default AffiliateOfferCard;
