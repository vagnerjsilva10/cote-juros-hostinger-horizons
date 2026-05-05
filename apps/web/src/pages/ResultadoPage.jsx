import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AlertTriangle, ArrowUpRight, CheckCircle2, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SeoHead from '@/components/SeoHead.jsx';
import { buildPartnerMatches, recommendProducts } from '@/platform/services/recommendationAdapter.js';
import { getQuizProgress, saveQuizProgress } from '@/platform/services/quizAdapter.js';
import { partnerRedirectService } from '@/platform/services/partnerRedirectService.js';
import { trackEvent } from '@/platform/services/trackingAdapter.js';

const CONSENT_VERSION = 'cj-funnel-v1';

const readLastAnalysis = () => {
  try {
    return JSON.parse(window.localStorage.getItem('cote_last_analysis') || 'null');
  } catch {
    return null;
  }
};

const chanceClass = {
  alta: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  média: 'bg-amber-50 text-amber-700 border-amber-100',
  baixa: 'bg-slate-100 text-slate-700 border-slate-200'
};

function ResultadoPage() {
  const location = useLocation();
  const stored = location.state || readLastAnalysis() || getQuizProgress() || {};
  const quizAnswers = stored.quizAnswers || {};
  const recommendation = stored.recommendation || recommendProducts(quizAnswers);
  const matches = useMemo(
    () => recommendation.partnerMatches || buildPartnerMatches(quizAnswers, recommendation),
    [quizAnswers, recommendation]
  );
  const [consents, setConsents] = useState({});
  const [status, setStatus] = useState('');
  const [redirectingPartnerId, setRedirectingPartnerId] = useState('');

  useEffect(() => {
    trackEvent('result_viewed', {
      sourcePage: quizAnswers.sourcePage || stored.sourcePage || '/resultado',
      score: recommendation.score,
      profile: recommendation.profileLabel
    });
  }, [quizAnswers.sourcePage, recommendation.profileLabel, recommendation.score, stored.sourcePage]);

  const acceptConsent = async (partnerId) => {
    const consent = {
      accepted: true,
      consentVersion: CONSENT_VERSION,
      timestamp: new Date().toISOString(),
      partnerId
    };
    setConsents((current) => ({ ...current, [partnerId]: consent }));
    saveQuizProgress({
      quizAnswers: {
        ...quizAnswers,
        consentPartnerSharing: true,
        consentVersion: CONSENT_VERSION
      },
      partnerConsent: consent
    });
    await trackEvent('consent_accepted', {
      sourcePage: '/resultado',
      partnerId,
      consentVersion: CONSENT_VERSION
    });
  };

  const handlePartnerClick = async (match) => {
    await trackEvent('partner_clicked', {
      sourcePage: '/resultado',
      partnerId: match.partnerId,
      destination: match.actionType
    });

    if (match.actionType === 'complete_data') {
      setStatus('Complete os dados pendentes no quiz antes de avançar com essa opção.');
      return;
    }

    if (match.actionType === 'eligibility' && !consents[match.partnerId]?.accepted) {
      setStatus('Para consultar elegibilidade com parceiro, aceite o compartilhamento de dados deste card.');
      return;
    }

    if (match.actionType === 'eligibility') {
      setStatus('Elegibilidade preparada. Nenhum dado foi enviado para parceiro real neste lote.');
      return;
    }

    setRedirectingPartnerId(match.partnerId);
    try {
      const redirect = await partnerRedirectService.create({
        partnerId: match.partnerId,
        partnerSlug: match.partnerId,
        sourcePage: '/resultado',
        productType: match.productType,
        utm: {
          source: 'cotejuros',
          medium: 'resultado',
          campaign: match.productType || 'parceiro'
        },
        metadata: {
          matchScore: match.matchScore,
          chanceLabel: match.chanceLabel
        }
      });

      await trackEvent('redirect_started', {
        sourcePage: '/resultado',
        partnerId: match.partnerId,
        destination: 'partner_redirect',
        clickId: redirect?.clickId
      });
      window.location.href = redirect.redirectUrl || redirect.resolvedUrl;
    } catch (error) {
      setStatus(error?.message || 'Não foi possível preparar o redirect rastreado agora.');
    } finally {
      setRedirectingPartnerId('');
    }
  };

  return (
    <>
      <SeoHead
        title="Resultado da análise | Cote Juros"
        description="Veja caminhos possíveis de crédito para o seu perfil, com score indicativo, motivos e alertas."
        path="/resultado"
      />
      <section className="bg-[#08111f] px-4 py-12 text-white md:py-16">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9C8FFF]">Resultado indicativo</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-semibold leading-tight tracking-[-0.03em] text-white md:text-5xl">
            Com base no seu perfil, encontramos caminhos possíveis.
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-white/68">
            A Cote Juros organiza alternativas para decisão. Não somos banco, não cobramos antecipado e não garantimos aprovação.
          </p>
        </div>
      </section>

      <section className="bg-slate-50 px-4 py-10 md:py-14">
        <div className="mx-auto grid max-w-6xl gap-7 lg:grid-cols-[360px_1fr]">
          <aside className="h-fit rounded-[24px] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Score indicativo</p>
            <div className="mt-5 flex items-end gap-3">
              <strong className="text-6xl font-semibold tracking-[-0.06em] text-slate-950">{recommendation.score}</strong>
              <span className="mb-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm font-semibold text-slate-700">{recommendation.profileLabel}</span>
            </div>

            <div className="mt-6 space-y-3">
              {(recommendation.reasons || []).map((reason) => (
                <div key={reason} className="flex gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-3 text-sm leading-6 text-emerald-900">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  {reason}
                </div>
              ))}
            </div>

            {(recommendation.warnings || []).length ? (
              <div className="mt-5 space-y-3">
                {recommendation.warnings.map((warning) => (
                  <div key={warning} className="flex gap-3 rounded-2xl border border-amber-100 bg-amber-50 p-3 text-sm leading-6 text-amber-900">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                    {warning}
                  </div>
                ))}
              </div>
            ) : null}
          </aside>

          <main className="space-y-5">
            {matches.length ? matches.map((match) => (
              <article key={match.partnerId} className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{match.productType}</p>
                    <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-slate-950">{match.partnerName}</h2>
                  </div>
                  <span className={`w-fit rounded-full border px-3 py-1 text-sm font-semibold ${chanceClass[match.chanceLabel] || chanceClass.baixa}`}>
                    Chance {match.chanceLabel}
                  </span>
                </div>

                <p className="mt-4 text-sm leading-7 text-slate-600">{match.reason}</p>
                <div className="mt-4 text-sm text-slate-500">Match: {match.matchScore}/100</div>

                {match.actionType === 'eligibility' ? (
                  <label className="mt-5 flex cursor-pointer gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                    <input type="checkbox" checked={Boolean(consents[match.partnerId]?.accepted)} onChange={(event) => event.target.checked && acceptConsent(match.partnerId)} />
                    <span>Autorizo a Cote Juros a compartilhar meus dados com o parceiro selecionado para análise de crédito.</span>
                  </label>
                ) : null}

                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <Button onClick={() => handlePartnerClick(match)} disabled={redirectingPartnerId === match.partnerId}>
                    {redirectingPartnerId === match.partnerId ? 'Preparando...' : match.ctaLabel}
                    <ArrowUpRight className="h-4 w-4" />
                  </Button>
                  {match.requiredFields?.length ? (
                    <span className="text-xs leading-5 text-slate-500">Campos pendentes: {match.requiredFields.join(', ')}</span>
                  ) : null}
                </div>
              </article>
            )) : (
              <div className="rounded-[24px] border border-slate-200 bg-white p-8 text-center shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
                <h2 className="text-2xl font-semibold text-slate-950">Ainda não encontramos uma opção clara.</h2>
                <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-600">Tente reduzir o valor solicitado, informar renda/cidade ou revisar a finalidade do crédito.</p>
                <Link className="mt-6 inline-flex" to="/quiz"><Button>Refazer análise</Button></Link>
              </div>
            )}

            {status ? <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-700">{status}</div> : null}

            <div className="flex gap-3 rounded-[20px] border border-slate-200 bg-white p-5 text-sm leading-7 text-slate-600">
              <ShieldCheck className="mt-1 h-5 w-5 shrink-0 text-[#7C6EF7]" />
              <p>A Cote Juros não é banco, não concede crédito diretamente, não garante aprovação e não cobra taxa antecipada. Dados só são compartilhados com parceiro mediante consentimento.</p>
            </div>
          </main>
        </div>
      </section>
    </>
  );
}

export default ResultadoPage;
