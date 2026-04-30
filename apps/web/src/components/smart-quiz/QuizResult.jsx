import React, { useState } from 'react';
import { ArrowRight, MessageCircle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { routeLeadToPartner, trackPartnerClick } from '@/platform/services/partnerAdapter.js';
import { trackEvent } from '@/platform/services/trackingAdapter.js';
import { openWhatsApp } from '@/platform/utils/whatsapp.js';
import LeadCaptureForm from '@/components/smart-quiz/LeadCaptureForm.jsx';

export default function QuizResult({ quizAnswers, recommendation, onRestart }) {
  const [lead, setLead] = useState(null);
  const [partnerStatus, setPartnerStatus] = useState('');

  const handlePartner = async () => {
    setPartnerStatus('Roteando...');
    await trackPartnerClick({
      sourcePage: 'smart_quiz',
      partnerId: recommendation.partnerRoute,
      destinationUrl: recommendation.partnerRoute
    });
    const routed = await routeLeadToPartner({ lead: lead || { source: 'smart_quiz', score: recommendation.score }, recommendation });
    setPartnerStatus(routed?.mode === 'fallback' ? 'Parceiro preparado em modo fallback.' : 'Parceiro preparado.');
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
          Opções limitadas para seu perfil
        </span>

        <h2 className="mt-5 max-w-2xl text-3xl font-semibold tracking-[-0.04em] md:text-4xl">
          Com base no seu perfil, esses caminhos podem fazer sentido
        </h2>

        <div className="mt-6 grid gap-4 sm:grid-cols-[180px_1fr]">
          <div className="rounded-[22px] border border-[#7C6EF7]/25 bg-[#7C6EF7]/10 p-5 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/55">Score ilustrativo</p>
            <strong className="mt-3 block text-5xl tracking-[-0.06em] text-white">{recommendation.score}</strong>
            <span className="mt-2 block text-sm text-white/70">{recommendation.profile}</span>
          </div>

          <div className="rounded-[22px] border border-white/10 bg-white/[0.04] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#9C8FFF]">Recomendação principal</p>
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

        <p className="mt-5 rounded-[18px] border border-white/10 bg-white/[0.04] p-4 text-sm leading-7 text-white/65">
          Resultado ilustrativo baseado nas informações fornecidas. A aprovação, contratação e condições dependem da análise dos parceiros. Quanto antes você avançar, mais opções podem aparecer.
        </p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Button onClick={handlePartner} className="h-12 rounded-full bg-[#7C6EF7] px-6 text-white hover:bg-[#6254D4]">
            Ver oferta com parceiro
            <ArrowRight className="h-4 w-4" />
          </Button>
          <Button onClick={handleWhatsApp} variant="outline" className="h-12 rounded-full border-white/15 bg-white/[0.04] px-6 text-white hover:bg-white/10">
            WhatsApp
            <MessageCircle className="h-4 w-4" />
          </Button>
          <Button onClick={onRestart} variant="ghost" className="h-12 rounded-full text-white/72 hover:bg-white/10 hover:text-white">
            Refazer análise
          </Button>
        </div>

        {partnerStatus ? <p className="mt-3 text-sm text-white/60">{partnerStatus}</p> : null}
      </div>

      <LeadCaptureForm quizAnswers={quizAnswers} recommendation={recommendation} onCaptured={setLead} />
    </div>
  );
}
