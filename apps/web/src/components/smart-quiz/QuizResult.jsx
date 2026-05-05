import React, { useState } from 'react';
import { ArrowRight, MessageCircle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { routeLeadToPartner, trackPartnerClick } from '@/platform/services/partnerAdapter.js';
import { isCreditasEligibleRecommendation, saveCreditasStatus } from '@/platform/services/creditasAdapter.js';
import { trackEvent } from '@/platform/services/trackingAdapter.js';
import { openWhatsApp } from '@/platform/utils/whatsapp.js';
import CreditasExtraForm from '@/components/smart-quiz/CreditasExtraForm.jsx';
import LeadCaptureForm from '@/components/smart-quiz/LeadCaptureForm.jsx';
import { formatCurrencyBRL } from '@/components/smart-quiz/currency.js';

const getFriendlyPartnerStatus = (status = {}) => {
  if (!status) return '';
  if (status?.mode === 'missing_required_data') return 'Complete os dados destacados para continuar com seguranca.';
  if (status?.mode === 'fallback' || status?.ok === false) return 'Nao conseguimos consultar as opcoes agora. Seus dados foram salvos para continuidade.';
  if (status?.status === 'not_eligible') return 'Essa opcao nao esta disponivel para o perfil informado no momento.';
  if (status?.ok) return status?.message || 'Consulta registrada. As condicoes dependem da avaliacao da parceira.';
  return status?.message || '';
};

export default function QuizResult({ quizAnswers, recommendation, onRestart }) {
  const [lead, setLead] = useState(null);
  const [partnerStatus, setPartnerStatus] = useState('');
  const [showCreditasForm, setShowCreditasForm] = useState(false);
  const showCreditas = isCreditasEligibleRecommendation(recommendation, quizAnswers);
  const summaryItems = [
    quizAnswers.monthlyIncome ? ['Renda mensal', formatCurrencyBRL(quizAnswers.monthlyIncome)] : null,
    quizAnswers.requestedAmount ? ['Valor desejado', formatCurrencyBRL(quizAnswers.requestedAmount)] : null
  ].filter(Boolean);

  const handlePartner = async () => {
    if (showCreditas) {
      setShowCreditasForm(true);
      setPartnerStatus(lead ? 'Complete os dados restantes para seguir.' : 'Preencha seus dados de contato e complete a simulacao com garantia.');
      saveCreditasStatus({
        ok: false,
        mode: 'extra_data_pending',
        provider: 'creditas',
        status: 'Dados complementares pendentes',
        message: 'Dados complementares pendentes para simulacao com garantia.'
      });
      await trackEvent('creditas_cta_clicked', { sourcePage: 'smart_quiz', score: recommendation.score });
      await trackEvent('creditas_extra_form_opened', { sourcePage: 'smart_quiz' });
      return;
    }

    setPartnerStatus('Preparando sua opcao...');
    await trackPartnerClick({
      sourcePage: 'smart_quiz',
      partnerId: recommendation.partnerRoute,
      destinationUrl: recommendation.partnerRoute
    });
    const routed = await routeLeadToPartner({ lead: lead || { source: 'smart_quiz', score: recommendation.score }, recommendation });
    setPartnerStatus(routed?.redirectUrl || routed?.destinationUrl
      ? 'Opcao pronta. Vamos abrir o proximo passo com seguranca.'
      : 'Opcao salva. Voce pode continuar pelo atendimento.');
  };

  const handleWhatsApp = () =>
    openWhatsApp({
      profile: recommendation.profile,
      mainProduct: recommendation.mainProduct,
      sourcePage: 'smart_quiz'
    });

  React.useEffect(() => {
    trackEvent('result_viewed', {
      sourcePage: 'smart_quiz',
      score: recommendation.score,
      profile: recommendation.profile,
      mainProduct: recommendation.mainProduct
    });
  }, [recommendation]);

  return (
    <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
      <div className="rounded-[28px] border border-white/10 bg-[#16161F] p-6 text-white shadow-[0_34px_90px_rgba(0,0,0,0.28)]">
        <span className="inline-flex items-center gap-2 rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1 text-xs font-semibold text-amber-100">
          <Sparkles className="h-3.5 w-3.5" />
          Opcoes limitadas para seu perfil
        </span>

        <h2 className="mt-5 max-w-2xl text-3xl font-semibold tracking-[-0.04em] md:text-4xl">
          Com base no seu perfil, esses caminhos podem fazer sentido
        </h2>

        <div className="mt-6 grid gap-4 sm:grid-cols-[180px_1fr]">
          <div className="rounded-[22px] border border-[#7C6EF7]/25 bg-[#7C6EF7]/10 p-5 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/55">Indicador de perfil</p>
            <strong className="mt-3 block text-5xl tracking-[-0.06em] text-white">{recommendation.score}</strong>
            <span className="mt-2 block text-sm text-white/70">{recommendation.profile}</span>
          </div>

          <div className="rounded-[22px] border border-white/10 bg-white/[0.04] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#9C8FFF]">Recomendacao principal</p>
            <h3 className="mt-2 text-2xl font-semibold text-white">{recommendation.mainProduct}</h3>
            <p className="mt-3 text-sm leading-7 text-white/68">{recommendation.explanation}</p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {(recommendation.secondaryProducts || []).slice(0, 3).map((item) => (
            <div key={item} className="rounded-[18px] border border-white/10 bg-white/[0.04] p-4 text-sm text-white/78">
              {item}
            </div>
          ))}
        </div>

        {summaryItems.length ? (
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {summaryItems.map(([label, value]) => (
              <div key={label} className="rounded-[18px] border border-white/10 bg-white/[0.04] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/45">{label}</p>
                <p className="mt-2 text-lg font-semibold text-white">{value}</p>
              </div>
            ))}
          </div>
        ) : null}

        <div className="mt-5 rounded-[18px] border border-white/10 bg-white/[0.04] p-4 text-sm leading-7 text-white/65">
          <h3 className="text-base font-semibold text-white">Como funciona sua analise</h3>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {[
              'Entendemos seu objetivo',
              'Avaliamos seu perfil',
              'Buscamos opcoes compativeis',
              'Conectamos com parceiros'
            ].map((item) => (
              <li key={item} className="flex gap-2">
                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[#22D3A0]" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-white/60">
            Resultado ilustrativo baseado nas informacoes fornecidas. A aprovacao, contratacao e condicoes dependem da analise dos parceiros.
          </p>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Button onClick={handlePartner} className="h-12 rounded-full bg-[#7C6EF7] px-6 text-white hover:bg-[#6254D4]">
            {showCreditas ? 'Simular com Creditas' : 'Ver opcao disponivel'}
            <ArrowRight className="h-4 w-4" />
          </Button>
          <Button onClick={handleWhatsApp} variant="outline" className="h-12 rounded-full border-white/15 bg-white/[0.04] px-6 text-white hover:bg-white/10">
            WhatsApp
            <MessageCircle className="h-4 w-4" />
          </Button>
          <Button onClick={onRestart} variant="ghost" className="h-12 rounded-full text-white/72 hover:bg-white/10 hover:text-white">
            Refazer analise
          </Button>
        </div>

        {partnerStatus ? <p className="mt-3 text-sm text-white/60">{partnerStatus}</p> : null}
        {showCreditasForm ? (
          <div className="mt-5">
            <CreditasExtraForm lead={lead} quizAnswers={quizAnswers} recommendation={recommendation} onStatus={(status) => setPartnerStatus(getFriendlyPartnerStatus(status))} />
          </div>
        ) : null}
      </div>

      <LeadCaptureForm quizAnswers={quizAnswers} recommendation={recommendation} onCaptured={setLead} />
    </div>
  );
}
