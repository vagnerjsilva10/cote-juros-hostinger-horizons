import React, { useEffect, useState } from 'react';
import { portalApi } from '@/platform/services/portalApi.js';

const formatPercent = (value) => `${Number(value || 0).toFixed(2)}%`;

function KpiCard({ label, value, helper }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5">
      <p className="text-sm font-semibold text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-bold text-slate-950">{value}</p>
      {helper ? <p className="mt-2 text-sm text-slate-600">{helper}</p> : null}
    </div>
  );
}

export default function AdminReactivationPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    portalApi
      .getReactivationKpis()
      .then(setData)
      .catch((err) => setError(err.message || 'Não foi possível carregar os KPIs.'));
  }, []);

  if (error) return <p className="rounded-lg bg-red-50 p-4 text-red-700">{error}</p>;
  if (!data) return <p className="rounded-lg bg-white p-4 text-slate-700">Carregando KPIs de reativação...</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-950">Reativação de leads</h1>
        <p className="mt-1 text-sm text-slate-600">Funil simples para acompanhar base, consentimento, roteamento e auditoria.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <KpiCard label="Leads importados" value={data.totalLeads} helper={`Visita: ${formatPercent(data.conversionRates?.visitRate)}`} />
        <KpiCard label="Visitas" value={data.visits} helper={`Consentimento: ${formatPercent(data.conversionRates?.consentRate)}`} />
        <KpiCard label="Consentimentos" value={data.consents} helper={`Formulario: ${formatPercent(data.conversionRates?.formRate)}`} />
        <KpiCard label="Entregues" value={data.delivered} helper={`Entrega: ${formatPercent(data.conversionRates?.deliveryRate)}`} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-bold text-slate-950">Status</h2>
          <div className="mt-4 space-y-3">
            {Object.entries(data.byStatus || {}).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between border-b border-slate-100 pb-2 text-sm">
                <span className="font-semibold text-slate-700">{status}</span>
                <span className="text-slate-950">{count}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-bold text-slate-950">Parceiros</h2>
          <div className="mt-4 space-y-3">
            {(data.byPartner || []).map((partner) => (
              <div key={partner.partnerId} className="flex items-center justify-between border-b border-slate-100 pb-2 text-sm">
                <span className="font-semibold text-slate-700">{partner.partnerName}</span>
                <span className="text-slate-950">
                  {partner.leads} / R$ {Number((partner.estimatedRevenueCents || 0) / 100).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-bold text-slate-950">Delivery e receita</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <KpiCard label="Formularios" value={data.forms || 0} helper="Submissoes completas" />
          <KpiCard label="Qualificados" value={data.qualified || 0} helper="Com score e parceiro" />
          <KpiCard label="Falhas" value={data.deliveryFailed || 0} helper="Exigem retry ou revisao" />
          <KpiCard
            label="Receita estimada"
            value={`R$ ${Number((data.revenue?.estimatedRevenueCents || 0) / 100).toFixed(2)}`}
            helper="Baseada no parceiro roteado"
          />
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-bold text-slate-950">Eventos LGPD</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {Object.entries(data.auditEvents || {}).map(([eventType, count]) => (
            <div key={eventType} className="rounded-md bg-slate-50 p-3">
              <p className="text-xs font-semibold uppercase text-slate-500">{eventType}</p>
              <p className="mt-1 text-xl font-bold text-slate-950">{count}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
