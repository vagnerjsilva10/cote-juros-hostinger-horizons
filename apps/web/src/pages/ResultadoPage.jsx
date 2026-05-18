import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowUpRight, BadgeCheck, Car, ClipboardCheck, CreditCard, LockKeyhole, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SeoHead from '@/components/SeoHead.jsx';
import { buildPartnerMatches, recommendProducts } from '@/platform/services/recommendationAdapter.js';
import { getQuizProgress, saveQuizProgress } from '@/platform/services/quizAdapter.js';
import { partnerRedirectService } from '@/platform/services/partnerRedirectService.js';
import { trackEvent } from '@/platform/services/trackingAdapter.js';
import { formatCurrencyBRL } from '@/components/smart-quiz/currency.js';

const CONSENT_VERSION = 'cj-funnel-v1';

const readLastAnalysis = () => {
  try {
    return JSON.parse(window.localStorage.getItem('cote_last_analysis') || 'null');
  } catch {
    return null;
  }
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

  const guaranteeMatch = matches.find((match) => String(match.productType || '').includes('equity')) || matches[0];
  const personalMatch = matches.find((match) => match.partnerId === 'standard-credit-hub') || matches.find((match) => match !== guaranteeMatch);
  const resultCards = [
    {
      key: 'secured-credit',
      match: guaranteeMatch,
      Icon: Car,
      title: 'Crédito com garantia de veículo',
      badge: 'Boa possibilidade',
      description: 'Você informou possuir uma garantia, o que pode abrir caminho para opções de crédito com taxas mais competitivas.',
      compatibility: 'Compatibilidade estimada: 90%',
      cta: 'Consultar opção',
      note: 'A análise final pode exigir CPF, dados complementares e validação do parceiro.'
    },
    {
      key: 'personal-credit',
      match: personalMatch,
      Icon: CreditCard,
      title: 'Crédito pessoal',
      badge: 'Disponível para análise',
      description: 'Uma alternativa para comparar opções sem garantia, conforme seu perfil informado.',
      compatibility: 'Compatibilidade estimada: 82%',
      cta: 'Ver opção'
    }
  ].filter((card) => card.match);

  const summaryItems = [
    quizAnswers.monthlyIncome ? ['Renda informada', formatCurrencyBRL(quizAnswers.monthlyIncome)] : null,
    quizAnswers.requestedAmount ? ['Valor solicitado', formatCurrencyBRL(quizAnswers.requestedAmount)] : null
  ].filter(Boolean);

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
      setStatus('Para avançar, revise seus dados de contato no quiz e tente novamente.');
      return;
    }

    if (match.actionType === 'eligibility' && !consents[match.partnerId]?.accepted) {
      setStatus('Antes de consultar essa opção, confirme a autorização de compartilhamento de dados no card.');
      return;
    }

    if (match.actionType === 'eligibility') {
      setStatus('Consulta registrada. As condições finais dependem da análise do parceiro.');
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
      setStatus('Não foi possível abrir essa opção agora. Tente novamente em instantes.');
    } finally {
      setRedirectingPartnerId('');
    }
  };

  return (
    <>
      <SeoHead
        title="Diagnóstico financeiro | Cote Juros"
        description="Veja um diagnóstico financeiro indicativo com caminhos possíveis para o seu perfil."
        path="/resultado"
      />

      <section className="bg-[#07111f] px-4 py-12 text-white md:py-16">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1fr_320px] lg:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9C8FFF]">Resultado indicativo</p>
            <h1 className="mt-3 max-w-3xl text-3xl font-semibold leading-tight tracking-[-0.02em] text-white md:text-4xl">
              Seu diagnóstico financeiro está pronto
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-white/72">
              Com base nas informações preenchidas, encontramos caminhos que podem fazer sentido para o seu perfil.
            </p>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-white/55">
              Este resultado é indicativo e não representa aprovação de crédito. As condições finais dependem da análise dos parceiros.
            </p>
          </div>

          <aside className="rounded-[24px] border border-white/10 bg-white/[0.05] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.22)]">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/48">Perfil analisado</p>
            <div className="mt-4 flex flex-wrap items-end gap-3">
              <strong className="text-5xl font-semibold tracking-[-0.05em] text-white">{recommendation.score}/100</strong>
              <span className="mb-2 rounded-full border border-[#7C6EF7]/25 bg-[#7C6EF7]/15 px-3 py-1 text-xs font-semibold text-[#D9D5FF]">Boa compatibilidade</span>
            </div>
            <p className="mt-4 text-sm leading-6 text-white/62">
              Seu perfil apresenta sinais positivos para consulta com parceiros, mas a aprovação depende da análise final.
            </p>
          </aside>
        </div>
      </section>

      <section className="bg-[#07111f] px-4 pb-14 md:pb-18">
        <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1fr_360px]">
          <main className="space-y-5">
            {resultCards.length ? resultCards.map(({ key, match, Icon, title, badge, description, compatibility, cta, note }) => (
              <article key={key} className="rounded-[26px] border border-white/10 bg-[#101a2b] p-6 text-white shadow-[0_26px_80px_rgba(0,0,0,0.24)]">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[#7C6EF7]/25 bg-[#7C6EF7]/14 text-[#D9D5FF]">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold tracking-[-0.02em] text-white md:text-2xl">{title}</h2>
                      <p className="mt-3 max-w-2xl text-sm leading-7 text-white/64">{description}</p>
                    </div>
                  </div>
                  <span className="w-fit rounded-full border border-[#7C6EF7]/25 bg-[#7C6EF7]/12 px-3 py-1 text-xs font-semibold text-[#D9D5FF]">
                    {badge}
                  </span>
                </div>

                <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-medium text-white/78">
                  {compatibility}
                </div>

                {match.actionType === 'eligibility' ? (
                  <label className="mt-4 flex cursor-pointer gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm leading-6 text-white/68">
                    <input type="checkbox" checked={Boolean(consents[match.partnerId]?.accepted)} onChange={(event) => event.target.checked && acceptConsent(match.partnerId)} />
                    <span>Autorizo a Cote Juros a compartilhar meus dados com o parceiro responsável para análise de crédito.</span>
                  </label>
                ) : null}

                <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <Button onClick={() => handlePartnerClick(match)} disabled={redirectingPartnerId === match.partnerId} className="h-11 rounded-full bg-[#7C6EF7] px-5 text-white shadow-[0_16px_36px_rgba(124,110,247,0.25)] hover:bg-[#6254D4]">
                    {redirectingPartnerId === match.partnerId ? 'Preparando...' : cta}
                    <ArrowUpRight className="h-4 w-4" />
                  </Button>
                  {note ? <p className="max-w-md text-xs leading-5 text-white/45">{note}</p> : null}
                </div>
              </article>
            )) : (
              <div className="rounded-[26px] border border-white/10 bg-[#101a2b] p-8 text-center text-white shadow-[0_26px_80px_rgba(0,0,0,0.24)]">
                <h2 className="text-2xl font-semibold text-white">Ainda não encontramos uma opção clara.</h2>
                <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-white/62">Tente reduzir o valor solicitado, informar renda/cidade ou revisar a finalidade do crédito.</p>
                <Link className="mt-6 inline-flex" to="/quiz"><Button className="rounded-full bg-[#7C6EF7] text-white hover:bg-[#6254D4]">Refazer análise</Button></Link>
              </div>
            )}

            {status ? <div className="rounded-2xl border border-[#7C6EF7]/20 bg-[#7C6EF7]/10 p-4 text-sm leading-6 text-[#D9D5FF]">{status}</div> : null}

            <div className="flex gap-3 rounded-[22px] border border-white/10 bg-white/[0.04] p-5 text-sm leading-7 text-white/58">
              <ShieldCheck className="mt-1 h-5 w-5 shrink-0 text-[#9C8FFF]" />
              <p>A Cote Juros não é banco, não concede crédito diretamente, não garante aprovação e não cobra taxa antecipada. As opções apresentadas dependem da análise e critérios dos parceiros.</p>
            </div>
          </main>

          <aside className="space-y-5">
            <section className="rounded-[26px] border border-white/10 bg-white/[0.04] p-6 text-white shadow-[0_26px_80px_rgba(0,0,0,0.18)]">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[#7C6EF7]/25 bg-[#7C6EF7]/14 text-[#D9D5FF]">
                <ClipboardCheck className="h-5 w-5" />
              </div>
              <h2 className="mt-5 text-xl font-semibold tracking-[-0.02em]">Como calculamos este diagnóstico</h2>
              <p className="mt-3 text-sm leading-7 text-white/60">
                Usamos as informações preenchidas no quiz, como renda informada, valor desejado, objetivo do crédito e existência de garantia. O resultado é apenas uma estimativa inicial.
              </p>
              <div className="mt-5 grid gap-2 text-sm text-white/66">
                {['Renda informada', 'Valor solicitado', 'Perfil declarado', 'Tipo de crédito desejado', 'Existência de garantia', 'Critérios dos parceiros'].map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <BadgeCheck className="h-4 w-4 text-[#9C8FFF]" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>

              {summaryItems.length ? (
                <div className="mt-5 grid gap-3">
                  {summaryItems.map(([label, value]) => (
                    <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/42">{label}</p>
                      <p className="mt-1 text-base font-semibold text-white">{value}</p>
                    </div>
                  ))}
                </div>
              ) : null}
            </section>

            <section className="rounded-[26px] border border-white/10 bg-white/[0.04] p-6 text-white shadow-[0_26px_80px_rgba(0,0,0,0.18)]">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[#7C6EF7]/25 bg-[#7C6EF7]/14 text-[#D9D5FF]">
                <LockKeyhole className="h-5 w-5" />
              </div>
              <h2 className="mt-5 text-xl font-semibold tracking-[-0.02em]">Preciso informar CPF ou conectar Open Finance?</h2>
              <p className="mt-3 text-sm leading-7 text-white/60">
                Neste primeiro diagnóstico, não é obrigatório conectar Open Finance. Alguns parceiros podem solicitar CPF, dados adicionais ou autorização de consulta para realizar a análise final.
              </p>
              <p className="mt-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm leading-6 text-white/66">
                Sem CPF ou dados complementares, o resultado permanece apenas indicativo.
              </p>
            </section>
          </aside>
        </div>
      </section>
    </>
  );
}

export default ResultadoPage;
