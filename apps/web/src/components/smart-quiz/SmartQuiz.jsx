import React, { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { recommendProducts } from '@/platform/services/recommendationAdapter.js';
import { saveQuizProgress, submitSmartQuiz, getQuizProgress } from '@/platform/services/quizAdapter.js';
import { trackEvent } from '@/platform/services/trackingAdapter.js';

const steps = [
  {
    key: 'monthlyIncome',
    title: 'Qual sua renda mensal?',
    type: 'money',
    placeholder: 'Ex: 3500'
  },
  {
    key: 'hasNegativeStatus',
    title: 'Seu nome está negativado?',
    options: [
      ['yes', 'Sim'],
      ['no', 'Não'],
      ['unknown', 'Não sei']
    ]
  },
  {
    key: 'creditPurpose',
    title: 'Qual o objetivo do crédito?',
    options: [
      ['quitar_dividas', 'Quitar dívidas'],
      ['emergencia', 'Emergência'],
      ['investir_negocio', 'Investir no negócio'],
      ['reforma', 'Reforma ou compra'],
      ['outro', 'Outro']
    ]
  },
  {
    key: 'occupation',
    title: 'Qual sua ocupação hoje?',
    options: [
      ['clt', 'CLT'],
      ['mei_autonomo', 'MEI/autônomo'],
      ['aposentado', 'Aposentado/pensionista'],
      ['servidor_publico', 'Servidor público'],
      ['desempregado', 'Desempregado']
    ]
  },
  {
    key: 'assets',
    title: 'Você possui veículo ou imóvel?',
    type: 'assets'
  },
  {
    key: 'location',
    title: 'Qual sua cidade e estado?',
    type: 'location'
  },
  {
    key: 'contact',
    title: 'Para salvar sua análise, informe seu contato',
    type: 'contact'
  }
];

const parseAmount = (value) => {
  if (typeof value === 'number') return value;
  const normalized = String(value || '').replace(/\./g, '').replace(',', '.').replace(/[^\d.]/g, '');
  return normalized ? Number(normalized) : 0;
};

export default function SmartQuiz({ onCompleted }) {
  const location = useLocation();
  const navigate = useNavigate();
  const stored = getQuizProgress();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState(() => ({
    requestedAmount: location.state?.requestedAmount ?? stored?.quizAnswers?.requestedAmount ?? stored?.requestedAmount ?? 0,
    sourcePage: location.state?.sourcePage ?? stored?.sourcePage ?? 'smart_quiz',
    ...(stored?.quizAnswers || {})
  }));
  const [draft, setDraft] = useState({});
  const [status, setStatus] = useState('idle');

  const current = steps[step];
  const progress = useMemo(() => Math.round(((step + 1) / steps.length) * 100), [step]);

  const persistStep = async (nextAnswers) => {
    saveQuizProgress({
      currentStep: step,
      sourcePage: nextAnswers.sourcePage || 'smart_quiz',
      requestedAmount: nextAnswers.requestedAmount,
      quizAnswers: nextAnswers
    });
    await trackEvent('quiz_step_completed', {
      sourcePage: nextAnswers.sourcePage || 'smart_quiz',
      step: current.key,
      progress
    });
  };

  const finish = async (nextAnswers) => {
    setStatus('analyzing');
    const recommendation = recommendProducts(nextAnswers);
    const resultPayload = {
      quizAnswers: nextAnswers,
      recommendation,
      status: 'completed',
      sourcePage: nextAnswers.sourcePage || 'smart_quiz',
      requestedAmount: nextAnswers.requestedAmount,
      updatedAt: new Date().toISOString()
    };

    window.localStorage.setItem('cote_last_analysis', JSON.stringify(resultPayload));
    saveQuizProgress(resultPayload);

    try {
      await submitSmartQuiz({
        source: nextAnswers.sourcePage || 'smart_quiz',
        quizAnswers: nextAnswers,
        recommendation,
        score: recommendation.score,
        profile: recommendation.profileLabel
      });
    } catch (error) {
      console.warn('[smart-quiz] lead interno nao enviado; resultado local preservado', {
        message: error?.message || String(error)
      });
    }
    onCompleted?.(recommendation);
    navigate('/resultado', { state: resultPayload });
  };

  const advance = async (patch) => {
    if (step === 0) await trackEvent('quiz_started', { sourcePage: answers.sourcePage || 'smart_quiz' });

    const nextAnswers = { ...answers, ...patch };
    setAnswers(nextAnswers);
    await persistStep(nextAnswers);

    if (step < steps.length - 1) {
      setDraft({});
      window.setTimeout(() => setStep((item) => item + 1), 180);
      return;
    }

    await finish(nextAnswers);
  };

  const submitDraft = () => {
    if (current.type === 'money') return advance({ [current.key]: parseAmount(draft[current.key]) });
    if (current.type === 'assets') {
      return advance({
        hasVehicle: Boolean(draft.hasVehicle),
        hasProperty: Boolean(draft.hasProperty)
      });
    }
    if (current.type === 'location') {
      return advance({
        city: String(draft.city || '').trim(),
        state: String(draft.state || '').trim().toUpperCase()
      });
    }
    if (current.type === 'contact') {
      return advance({
        contactName: String(draft.contactName || '').trim(),
        whatsapp: String(draft.whatsapp || '').trim(),
        email: String(draft.email || '').trim(),
        consentGeneral: true,
        consentVersion: 'cj-funnel-v1'
      });
    }
    return null;
  };

  const canSubmitDraft = () => {
    if (current.type === 'money') return parseAmount(draft[current.key]) > 0;
    if (current.type === 'assets') return true;
    if (current.type === 'location') return draft.city && String(draft.state || '').length >= 2;
    if (current.type === 'contact') return draft.contactName && draft.whatsapp && draft.email;
    return false;
  };

  return (
    <div className="rounded-[28px] border border-white/10 bg-[#111118] p-5 text-white shadow-[0_34px_90px_rgba(0,0,0,0.24)] md:p-7">
      <div className="mb-6">
        <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.16em] text-white/48">
          <span>Análise gratuita</span>
          <span>{progress}%</span>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-gradient-to-r from-[#7C6EF7] to-[#22D3A0] transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {status === 'analyzing' ? (
        <div className="grid min-h-[280px] place-items-center text-center">
          <div>
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-2 border-white/10 border-t-[#9C8FFF]" />
            <h2 className="mt-5 text-3xl font-semibold tracking-[-0.04em]">Analisando seu perfil...</h2>
            <p className="mt-3 text-white/60">Organizando caminhos possíveis, sem promessa de aprovação.</p>
          </div>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={current.key}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.24 }}
          >
            <h2 className="max-w-2xl text-3xl font-semibold tracking-[-0.04em] md:text-4xl">{current.title}</h2>
            <p className="mt-3 text-sm leading-7 text-white/62">Leva menos de 30 segundos e você decide se quer avançar.</p>

            {current.options ? (
              <div className="mt-7 grid gap-3 sm:grid-cols-2">
                {current.options.map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => advance({ [current.key]: value })}
                    className="group rounded-[18px] border border-white/10 bg-white/[0.04] p-5 text-left text-white transition duration-200 hover:scale-[1.02] hover:border-[#7C6EF7]/45 hover:bg-white/[0.07]"
                  >
                    <span className="font-semibold">{label}</span>
                    <ArrowRight className="mt-5 h-4 w-4 text-white/35 transition group-hover:translate-x-1 group-hover:text-[#9C8FFF]" />
                  </button>
                ))}
              </div>
            ) : null}

            {current.type === 'money' ? (
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <input className="min-h-12 flex-1 rounded-2xl border border-white/10 bg-white/[0.06] px-4 text-white outline-none focus:border-[#9C8FFF]" inputMode="numeric" placeholder={current.placeholder} value={draft[current.key] || ''} onChange={(event) => setDraft((item) => ({ ...item, [current.key]: event.target.value }))} />
                <Button disabled={!canSubmitDraft()} onClick={submitDraft} className="h-12 rounded-full bg-[#7C6EF7] px-6 text-white hover:bg-[#6254D4]">Continuar <ArrowRight className="h-4 w-4" /></Button>
              </div>
            ) : null}

            {current.type === 'assets' ? (
              <div className="mt-7 space-y-3">
                {[
                  ['hasVehicle', 'Possuo veículo'],
                  ['hasProperty', 'Possuo imóvel']
                ].map(([key, label]) => (
                  <label key={key} className="flex cursor-pointer items-center justify-between rounded-[18px] border border-white/10 bg-white/[0.04] p-5 text-white">
                    <span className="font-semibold">{label}</span>
                    <input type="checkbox" checked={Boolean(draft[key])} onChange={(event) => setDraft((item) => ({ ...item, [key]: event.target.checked }))} />
                  </label>
                ))}
                <Button onClick={submitDraft} className="h-12 rounded-full bg-[#7C6EF7] px-6 text-white hover:bg-[#6254D4]">Continuar <ArrowRight className="h-4 w-4" /></Button>
              </div>
            ) : null}

            {current.type === 'location' ? (
              <div className="mt-7 grid gap-3 sm:grid-cols-[1fr_120px]">
                <input className="min-h-12 rounded-2xl border border-white/10 bg-white/[0.06] px-4 text-white outline-none focus:border-[#9C8FFF]" placeholder="Cidade" value={draft.city || ''} onChange={(event) => setDraft((item) => ({ ...item, city: event.target.value }))} />
                <input className="min-h-12 rounded-2xl border border-white/10 bg-white/[0.06] px-4 text-white outline-none focus:border-[#9C8FFF]" placeholder="UF" maxLength={2} value={draft.state || ''} onChange={(event) => setDraft((item) => ({ ...item, state: event.target.value }))} />
                <Button disabled={!canSubmitDraft()} onClick={submitDraft} className="h-12 rounded-full bg-[#7C6EF7] px-6 text-white hover:bg-[#6254D4] sm:col-span-2">Continuar <ArrowRight className="h-4 w-4" /></Button>
              </div>
            ) : null}

            {current.type === 'contact' ? (
              <div className="mt-7 grid gap-3">
                <input className="min-h-12 rounded-2xl border border-white/10 bg-white/[0.06] px-4 text-white outline-none focus:border-[#9C8FFF]" placeholder="Nome" value={draft.contactName || ''} onChange={(event) => setDraft((item) => ({ ...item, contactName: event.target.value }))} />
                <input className="min-h-12 rounded-2xl border border-white/10 bg-white/[0.06] px-4 text-white outline-none focus:border-[#9C8FFF]" placeholder="WhatsApp" inputMode="tel" value={draft.whatsapp || ''} onChange={(event) => setDraft((item) => ({ ...item, whatsapp: event.target.value }))} />
                <input className="min-h-12 rounded-2xl border border-white/10 bg-white/[0.06] px-4 text-white outline-none focus:border-[#9C8FFF]" placeholder="E-mail" type="email" value={draft.email || ''} onChange={(event) => setDraft((item) => ({ ...item, email: event.target.value }))} />
                <p className="text-xs leading-6 text-white/52">Usamos esses dados para salvar sua análise. Compartilhamento com parceiro só acontece com aceite específico no resultado.</p>
                <Button disabled={!canSubmitDraft()} onClick={submitDraft} className="h-12 rounded-full bg-[#7C6EF7] px-6 text-white hover:bg-[#6254D4]">Ver resultado <ArrowRight className="h-4 w-4" /></Button>
              </div>
            ) : null}

            {step > 0 ? (
              <Button variant="ghost" onClick={() => setStep((item) => item - 1)} className="mt-5 rounded-full text-white/65 hover:bg-white/10 hover:text-white">
                <ChevronLeft className="h-4 w-4" />
                Voltar
              </Button>
            ) : null}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
