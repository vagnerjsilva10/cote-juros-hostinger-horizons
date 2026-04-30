import React from 'react';
import { Helmet } from 'react-helmet';
import SmartQuiz from '@/components/smart-quiz/SmartQuiz.jsx';

export default function SmartQuizPage() {
  return (
    <>
      <Helmet>
        <title>Quiz inteligente | Cote Juros</title>
        <meta name="description" content="Responda algumas perguntas e veja caminhos financeiros que podem fazer sentido para o seu perfil." />
      </Helmet>

      <section className="bg-[#0A0A0F] px-4 py-14 md:px-8 md:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 max-w-3xl text-white">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9C8FFF]">Análise gratuita</p>
            <h1 className="mt-4 text-4xl font-semibold tracking-[-0.05em] md:text-6xl">
              Veja caminhos que podem fazer sentido para o seu perfil
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-white/64">
              Sem cobrança antecipada e sem promessa de aprovação. A análise final depende dos parceiros.
            </p>
          </div>
          <SmartQuiz />
        </div>
      </section>
    </>
  );
}
