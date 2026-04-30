import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { ArrowRight, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getCardOffers, getCreditOffers, getFinancingOffers } from '@/platform/services/offerAdapter.js';

const productTabs = [
  { key: 'credit', label: 'Crédito' },
  { key: 'card', label: 'Cartões' },
  { key: 'financing', label: 'Financiamentos' }
];

const fallbackCards = {
  credit: [
    { id: 'credit_local_1', title: 'Empréstimo pessoal', bankName: 'Catálogo Cote Juros', monthlyRate: null, category: 'Crédito', matchLabel: 'Fallback visual' }
  ],
  card: [
    { id: 'card_local_1', title: 'Cartão sem anuidade', bankName: 'Catálogo Cote Juros', annualFee: 0, category: 'Cartão', matchLabel: 'Fallback visual' }
  ],
  financing: [
    { id: 'financing_local_1', title: 'Financiamento', bankName: 'Catálogo Cote Juros', category: 'Financiamento', matchLabel: 'Fallback visual' }
  ]
};

export default function ComparePage() {
  const [tab, setTab] = useState('credit');
  const [offers, setOffers] = useState({ credit: [], card: [], financing: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    Promise.all([
      getCreditOffers({ rank: true }),
      getCardOffers({ rank: true }),
      getFinancingOffers({ rank: true })
    ])
      .then(([credit, card, financing]) => {
        if (!active) return;
        setOffers({
          credit: credit?.length ? credit : fallbackCards.credit,
          card: card?.length ? card : fallbackCards.card,
          financing: financing?.length ? financing : fallbackCards.financing
        });
      })
      .finally(() => active && setLoading(false));

    return () => {
      active = false;
    };
  }, []);

  const currentOffers = useMemo(() => offers[tab] || [], [offers, tab]);

  return (
    <>
      <Helmet>
        <title>Comparar opções | Cote Juros</title>
        <meta name="description" content="Compare opções de crédito, cartões e financiamentos com clareza antes de decidir." />
      </Helmet>

      <section className="bg-[#0A0A0F] px-4 py-14 text-white md:px-8 md:py-20">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9C8FFF]">Comparação</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-[-0.05em] md:text-6xl">
            Compare opções antes de avançar
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-white/64">
            As condições dependem da análise dos parceiros. A Cote Juros não é banco e não garante aprovação.
          </p>
        </div>
      </section>

      <section className="bg-[#f8fafc] px-4 py-10 md:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-6 flex flex-col gap-3 rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <SlidersHorizontal className="h-4 w-4" />
              Filtros visuais
            </div>
            <div className="flex flex-wrap gap-2">
              {productTabs.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setTab(item.key)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    tab === item.key ? 'bg-[#111118] text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4">
            {loading ? (
              <div className="rounded-[22px] border border-slate-200 bg-white p-8 text-slate-600">Carregando opções...</div>
            ) : currentOffers.map((offer) => (
              <article key={offer.id} className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#7C6EF7]">{offer.category || offer.productType || 'Opção'}</p>
                    <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-slate-950">{offer.title || offer.productName || offer.bankName}</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {offer.bankName || 'Parceiro'} · {offer.matchLabel || 'Compatível para comparação'}
                    </p>
                  </div>
                  <Button className="rounded-full bg-[#7C6EF7] text-white hover:bg-[#6254D4]">
                    Comparar opção
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
