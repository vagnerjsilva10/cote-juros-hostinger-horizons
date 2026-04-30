import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { BarChart3, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getLeadFromLocalStorage } from '@/platform/services/leadAdapter.js';
import { trackEvent } from '@/platform/services/trackingAdapter.js';

const readLastAnalysis = () => {
  try {
    return JSON.parse(window.localStorage.getItem('cote_last_analysis') || 'null');
  } catch {
    return null;
  }
};

export default function CustomerDashboardPage() {
  const [analysis, setAnalysis] = useState(null);
  const [lead, setLead] = useState(null);

  useEffect(() => {
    setAnalysis(readLastAnalysis());
    setLead(getLeadFromLocalStorage());
    trackEvent('dashboard_opened', { sourcePage: '/dashboard' });
  }, []);

  const recommendation = analysis?.recommendation || lead?.recommendation;

  return (
    <>
      <Helmet>
        <title>Dashboard do cliente | Cote Juros</title>
      </Helmet>

      <section className="min-h-[72vh] bg-[#0A0A0F] px-4 py-14 text-white md:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9C8FFF]">Minha análise</p>
              <h1 className="mt-4 text-4xl font-semibold tracking-[-0.05em] md:text-6xl">Seu radar financeiro</h1>
            </div>
            <Link to="/quiz">
              <Button className="rounded-full bg-[#7C6EF7] text-white hover:bg-[#6254D4]">
                <RefreshCw className="h-4 w-4" />
                Refazer análise
              </Button>
            </Link>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <div className="rounded-[24px] border border-white/10 bg-white/[0.05] p-6">
              <BarChart3 className="h-5 w-5 text-[#22D3A0]" />
              <p className="mt-5 text-xs font-semibold uppercase tracking-[0.16em] text-white/45">Último score</p>
              <strong className="mt-2 block text-4xl tracking-[-0.05em]">{recommendation?.score ?? '--'}</strong>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-white/[0.05] p-6 md:col-span-3">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/45">Recomendação</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em]">
                {recommendation?.mainProduct || 'Nenhuma análise encontrada'}
              </h2>
              <p className="mt-3 text-sm leading-7 text-white/62">
                Perfil: {recommendation?.profile || 'sem dados'} · Status: {lead?.status || analysis?.status || 'aguardando análise'}
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
