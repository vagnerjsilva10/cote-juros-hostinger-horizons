import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { recommendProducts } from '@/platform/services/recommendationAdapter.js';
import { submitSmartQuiz } from '@/platform/services/quizAdapter.js';
import { trackEvent } from '@/platform/services/trackingAdapter.js';
import QuizResult from '@/components/smart-quiz/QuizResult.jsx';

const questions = [
  {
    key: 'objective',
    title: 'Qual caminho você quer comparar agora?',
    options: [
      ['credito', 'Crédito'],
      ['cartao', 'Cartão'],
      ['financiamento', 'Financiamento'],
      ['seguro', 'Seguro']
    ]
  },
  {
    key: 'amount',
    title: 'Qual valor aproximado faz sentido?',
    options: [
      [3000, 'Até R$ 3.000'],
      [10000, 'R$ 10.000'],
      [30000, 'R$ 30.000'],
      [80000, 'Acima de R$ 80.000']
    ]
  },
  {
    key: 'income',
    title: 'Qual sua renda mensal aproximada?',
    options: [
      [1800, 'Até R$ 2.000'],
      [4000, 'R$ 3.000 a R$ 5.000'],
      [9000, 'Acima de R$ 8.000'],
      [0, 'Prefiro não informar']
    ]
  },
  {
    key: 'workType',
    title: 'Como está sua ocupação hoje?',
    options: [
      ['CLT', 'CLT'],
      ['MEI/autônomo', 'MEI/autônomo'],
      ['Aposentado/pensionista', 'Aposentado/pensionista'],
      ['Desempregado', 'Desempregado']
    ]
  },
  {
    key: 'hasRestriction',
    title: 'Seu nome está negativado?',
    options: [
      [false, 'Não'],
      [true, 'Sim']
    ]
  }
];

export default function SmartQuiz({ onCompleted }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [status, setStatus] = useState('idle');
  const [recommendation, setRecommendation] = useState(null);

  const current = questions[step];
  const progress = useMemo(() => Math.round(((step + 1) / questions.length) * 100), [step]);

  const choose = async (value) => {
    if (step === 0) await trackEvent('quiz_started', { sourcePage: 'smart_quiz' });
    const nextAnswers = { ...answers, [current.key]: value };
    setAnswers(nextAnswers);
    await trackEvent('quiz_step_completed', {
      sourcePage: 'smart_quiz',
      step: current.key,
      value: String(value)
    });

    if (step < questions.length - 1) {
      window.setTimeout(() => setStep((item) => item + 1), 240);
      return;
    }

    setStatus('analyzing');
    window.setTimeout(async () => {
      const result = recommendProducts(nextAnswers);
      window.localStorage.setItem('cote_last_analysis', JSON.stringify({
        quizAnswers: nextAnswers,
        recommendation: result,
        status: 'result_viewed',
        updatedAt: new Date().toISOString()
      }));
      setRecommendation(result);
      setStatus('done');
      onCompleted?.(result);
      await submitSmartQuiz({
        source: 'smart_quiz',
        quizAnswers: nextAnswers,
        recommendation: result,
        score: result.score,
        profile: result.profile
      });
    }, 650);
  };

  const restart = () => {
    setStep(0);
    setAnswers({});
    setRecommendation(null);
    setStatus('idle');
  };

  if (recommendation) {
    return <QuizResult quizAnswers={answers} recommendation={recommendation} onRestart={restart} />;
  }

  return (
    <div className="rounded-[28px] border border-white/10 bg-[#111118] p-5 text-white shadow-[0_34px_90px_rgba(0,0,0,0.24)] md:p-7">
      <div className="mb-6">
        <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.16em] text-white/48">
          <span>Radar inteligente</span>
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
            <p className="mt-3 text-white/60">Com base na sua renda, algumas opções podem fazer mais sentido.</p>
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
            <p className="mt-3 text-sm leading-7 text-white/62">
              Descubra qual caminho combina melhor com seu momento financeiro.
            </p>

            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              {current.options.map(([value, label]) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => choose(value)}
                  className="group rounded-[18px] border border-white/10 bg-white/[0.04] p-5 text-left text-white transition duration-200 hover:scale-[1.02] hover:border-[#7C6EF7]/45 hover:bg-white/[0.07]"
                >
                  <span className="font-semibold">{label}</span>
                  <ArrowRight className="mt-5 h-4 w-4 text-white/35 transition group-hover:translate-x-1 group-hover:text-[#9C8FFF]" />
                </button>
              ))}
            </div>

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
