import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { ShieldCheck } from 'lucide-react';
import { getInsuranceOffers } from '@/platform/services/offerAdapter.js';

export default function InsurancePage({ type = 'seguros' }) {
  const [offers, setOffers] = useState([]);

  useEffect(() => {
    getInsuranceOffers({ type }).then(setOffers);
  }, [type]);

  return (
    <>
      <Helmet>
        <title>Seguros | Cote Juros</title>
        <meta name="description" content="Compare opções de seguros e entenda coberturas possíveis antes de decidir." />
      </Helmet>

      <section className="bg-[#0A0A0F] px-4 py-14 text-white md:px-8 md:py-20">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#22D3A0]">Seguros API-ready</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-[-0.05em] md:text-6xl">
            Compare seguros com clareza antes de escolher
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-white/64">
            Entenda coberturas, assistências e alternativas possíveis. Não prometemos menor preço garantido.
          </p>
        </div>
      </section>

      <section className="bg-[#f8fafc] px-4 py-12 md:px-8">
        <div className="mx-auto max-w-6xl">
          {/* TODO: backend ainda não suporta ProductType insurance / InsuranceQuote. Estes cards são mock visual API-ready. */}
          <div className="grid gap-4 md:grid-cols-3">
            {offers.map((offer) => (
              <article key={offer.id} className="rounded-[22px] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-5 inline-flex rounded-2xl bg-emerald-50 p-3 text-emerald-700">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <h2 className="text-2xl font-semibold tracking-[-0.03em] text-slate-950">{offer.title}</h2>
                <p className="mt-3 text-sm leading-7 text-slate-600">{offer.description}</p>
                <button className="mt-6 rounded-full bg-[#111118] px-5 py-3 text-sm font-semibold text-white">
                  {offer.cta}
                </button>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
