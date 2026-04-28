import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useLocation } from 'react-router-dom';
import { ArrowRight, CheckCircle2, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { getLeadProfileLabel } from '@/admin/adminLabels.js';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { partnerRedirectService } from '@/platform/services/partnerRedirectService.js';
import { portalApi } from '@/platform/services/portalApi.js';
import { useSiteDisclaimers, disclaimerText } from '@/hooks/useSiteDisclaimers.js';
import { usePageContent } from '@/hooks/useSiteSettings.js';

const DEFAULT_RESULT_CONTENT = {
  seo: {
    title: 'Resultado | Cote Juros',
    description: 'Compare opcoes de credito com base no seu perfil antes de contratar.'
  },
  hero: {
    titleWithProfile: 'Opcoes que podem fazer sentido para voce',
    titleGeneric: 'Veja algumas opcoes de credito',
    subtitleWithProfile: 'Com base nas informacoes fornecidas, estas sao algumas possibilidades. Avalie as condicoes antes de contratar.',
    subtitleGeneric: 'Estas sao algumas possibilidades que podem fazer sentido para diferentes perfis. Avalie as condicoes antes de contratar.'
  },
  summary: {
    profileLabel: 'Perfil',
    baseLabel: 'Base',
    baseValue: 'Com base no seu perfil',
    optionsLabel: 'Opcoes'
  },
  partner: {
    eyebrow: 'Parceiro',
    activeLabel: 'Ativo',
    fallbackDescription: 'Opcao parceira para comparar condicoes de credito antes de contratar.',
    defaultCta: 'Ver condicoes',
    openingLabel: 'Abrindo...'
  },
  empty: {
    title: 'Nao encontramos opcoes nesta sessao.',
    subtitle: 'Voce pode voltar para o comparador e refazer o perfil para ver opcoes disponiveis.',
    action: 'Ver opcoes'
  }
};

const buildLegacyRecommendation = (leadResult) => {
  if (!leadResult?.partnerName || !leadResult?.redirectUrl) return [];
  return [{
    id: leadResult.partnerId || 'legacy_partner',
    name: leadResult.partnerName,
    mode: leadResult.deliveryMode || 'tracking_link',
    type: 'affiliate_link',
    destinationUrl: leadResult.redirectUrl,
    description: 'Opcao parceira para comparar condicoes de credito com base no seu perfil.',
    highlights: ['Compare custo total', 'Confira prazo e condicoes', 'Sujeito a criterios do parceiro'],
    ctaText: 'Ver condicoes',
    eventType: `click_partner_${leadResult.partnerId || 'legacy'}`
  }];
};

function LeadNextStepPage() {
  const location = useLocation();
  const content = usePageContent('result', DEFAULT_RESULT_CONTENT);
  const resultDisclaimers = useSiteDisclaimers('resultado', [{
    key: 'not_bank',
    content: 'A Cote Juros nao e instituicao financeira e nao garante aprovacao de credito.'
  }]);
  const resultDisclaimer = disclaimerText(
    resultDisclaimers,
    'not_bank',
    'A Cote Juros nao e instituicao financeira e nao garante aprovacao de credito.'
  );
  const [clickingPartnerId, setClickingPartnerId] = useState(null);
  const [genericMatch, setGenericMatch] = useState(null);
  const leadResult = location.state?.leadResult || null;
  const hasProfile = Boolean(leadResult?.profile || leadResult?.leadId);

  useEffect(() => {
    if (leadResult) return;

    let ignore = false;
    const fallbackProfile = {
      negativado: null,
      renda: null,
      valor: null,
      urgencia: null
    };

    portalApi.matchCreditPartners(fallbackProfile).then((data) => {
      if (!ignore) setGenericMatch(data);
    });

    return () => {
      ignore = true;
    };
  }, [leadResult]);

  const recommendations = useMemo(() => {
    const items = Array.isArray(leadResult?.recommendations) && leadResult.recommendations.length
      ? leadResult.recommendations
      : Array.isArray(genericMatch?.recommendations) && genericMatch.recommendations.length
        ? genericMatch.recommendations
      : buildLegacyRecommendation(leadResult);

    return items.map((item) => ({
      ...item,
      destinationUrl: item.destinationUrl || item.url || (item.id === leadResult?.partnerId ? leadResult?.redirectUrl : '')
    }));
  }, [genericMatch?.recommendations, leadResult]);

  const handlePartnerClick = async (partner) => {
    const destinationUrl = partner.destinationUrl || leadResult?.redirectUrl;
    if (!destinationUrl) return;

    setClickingPartnerId(partner.id);
    try {
      await portalApi.trackIntegration({
        sourcePage: '/resultado',
        productContext: partner.eventType || `click_partner_${partner.id}`,
        simulationId: leadResult?.leadId || null
      });

      const redirect = await partnerRedirectService.create({
        partnerId: partner.id,
        destinationUrl,
        sourcePage: '/resultado',
        productType: 'loan',
        metadata: {
          eventType: partner.eventType || `click_partner_${partner.id}`,
          leadId: leadResult?.leadId || null
        }
      });

      window.location.href = redirect?.resolvedUrl || destinationUrl;
    } catch (error) {
      toast.error('Nao foi possivel registrar o clique agora, mas voce ainda pode seguir.');
      window.location.href = destinationUrl;
    }
  };

  return (
    <>
      <Helmet>
        <title>{content.seo.title}</title>
        <meta
          name="description"
          content={content.seo.description}
        />
      </Helmet>

      <section className="min-h-[72vh] bg-[linear-gradient(180deg,#f8fbff_0%,#ffffff_48%,#f7f9fc_100%)] py-16">
        <div className="page-shell">
          <div className="mx-auto max-w-5xl">
            <div className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-200 bg-white">
                <CheckCircle2 className="h-7 w-7 text-emerald-600" />
              </div>
              <h1 className="mt-5 text-[clamp(2rem,4vw,3rem)] font-medium tracking-[-0.035em] text-[#191F28]">
                {hasProfile ? content.hero.titleWithProfile : content.hero.titleGeneric}
              </h1>
              <p className="mx-auto mt-4 max-w-2xl text-base leading-8 text-slate-600">
                {hasProfile ? content.hero.subtitleWithProfile : content.hero.subtitleGeneric}
              </p>
            </div>

            {leadResult ? (
              <div className="mx-auto mt-8 grid max-w-3xl gap-3 rounded-[18px] border border-slate-200 bg-white px-5 py-4 text-left sm:grid-cols-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{content.summary.profileLabel}</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{getLeadProfileLabel(leadResult.profile)}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{content.summary.baseLabel}</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{content.summary.baseValue}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{content.summary.optionsLabel}</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{recommendations.length || 0}</p>
                </div>
              </div>
            ) : null}

            {recommendations.length ? (
              <div className="mt-10 grid gap-5 md:grid-cols-2">
                {recommendations.map((partner) => (
                  <Card key={partner.id} className="h-full border-slate-200 bg-white shadow-[0_14px_40px_rgba(15,23,42,0.06)]">
                    <CardContent className="flex h-full flex-col p-7">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{content.partner.eyebrow}</p>
                          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-slate-950">{partner.name}</h2>
                        </div>
                        <div className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                          {content.partner.activeLabel}
                        </div>
                      </div>

                      <p className="mt-4 text-sm leading-7 text-slate-600">
                        {partner.description || content.partner.fallbackDescription}
                      </p>

                      <div className="mt-5 grid gap-3">
                        {(partner.highlights || []).slice(0, 4).map((item) => (
                          <div key={item} className="flex items-start gap-3 rounded-[14px] border border-slate-200 bg-slate-50 px-4 py-3">
                            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                            <p className="text-sm leading-6 text-slate-700">{item}</p>
                          </div>
                        ))}
                      </div>

                      <Button
                        className="mt-6 h-12 w-full rounded-[14px] bg-slate-950 px-7 text-sm font-semibold text-white hover:bg-slate-800"
                        disabled={clickingPartnerId === partner.id}
                        onClick={() => handlePartnerClick(partner)}
                      >
                        {clickingPartnerId === partner.id ? content.partner.openingLabel : partner.ctaText || content.partner.defaultCta}
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="mx-auto mt-10 max-w-3xl rounded-[24px] border-slate-200 bg-white">
                <CardContent className="px-7 py-10 text-center">
                  <h2 className="text-2xl font-semibold tracking-[-0.03em] text-slate-950">{content.empty.title}</h2>
                  <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-600">
                    {content.empty.subtitle}
                  </p>
                  <Link to="/emprestimos" className="mt-6 inline-flex">
                    <Button>{content.empty.action}</Button>
                  </Link>
                </CardContent>
              </Card>
            )}

            <p className="mx-auto mt-8 max-w-3xl text-center text-xs leading-6 text-slate-500">
              {resultDisclaimer}
            </p>
          </div>
        </div>
      </section>
    </>
  );
}

export default LeadNextStepPage;
