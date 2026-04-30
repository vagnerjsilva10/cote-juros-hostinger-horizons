import React from 'react';
import { Helmet } from 'react-helmet';
import SmartQuiz from '@/components/smart-quiz/SmartQuiz.jsx';

export default function CreditRadarPage() {
  return (
    <>
      <Helmet>
        <title>Radar de crédito | Cote Juros</title>
      </Helmet>
      <section className="bg-[#0A0A0F] px-4 py-14 text-white md:px-8 md:py-20">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#22D3A0]">Radar de crédito</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-[-0.05em] md:text-6xl">
            Entenda seu perfil antes de comparar
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-white/64">
            O score é ilustrativo e serve para organizar caminhos possíveis, sempre sujeitos à análise dos parceiros.
          </p>
          <div className="mt-9">
            <SmartQuiz />
          </div>
        </div>
      </section>
    </>
  );
}
