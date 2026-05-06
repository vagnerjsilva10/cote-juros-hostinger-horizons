import React, { useEffect, useState } from 'react';
import { portalApi } from '@/platform/services/portalApi.js';

const money = (cents = 0) =>
  Number(cents || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });

function MetricCard({ label, value, hint }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5">
      <p className="text-sm font-semibold text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-bold text-slate-950">{value}</p>
      {hint ? <p className="mt-2 text-sm text-slate-600">{hint}</p> : null}
    </div>
  );
}

export default function AdminDashboardPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    portalApi
      .getAdminDashboard()
      .then(setData)
      .catch((loadError) => setError(loadError.message || 'Não foi possível carregar o painel.'));
  }, []);

  if (error) return <p className="rounded-lg bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</p>;
  if (!data) return <p className="rounded-lg bg-white p-4 text-sm text-slate-700">Carregando painel executivo...</p>;

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Prioridade operacional</p>
            <h2 className="mt-1 text-xl font-bold text-slate-950">
              {data.openAlerts ? `${data.openAlerts} alerta${data.openAlerts === 1 ? '' : 's'} pedem atenção` : 'Operação sem alertas abertos'}
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Use esta visão para priorizar leads, parceiros e receita antes de navegar pelos módulos.
            </p>
          </div>
          <div className={`rounded-full px-4 py-2 text-sm font-semibold ${data.openAlerts ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>
            {data.openAlerts ? 'Revisar alertas' : 'Tudo em ordem'}
          </div>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Leads monitorados" value={data.totalLeads || 0} hint="Base operacional ativa" />
        <MetricCard label="Sessões administrativas" value={data.activeSessions || 0} hint="Usuários autenticados agora" />
        <MetricCard label="Receita estimada" value={money(data.estimatedRevenueCents || 0)} hint="Projeção atual de monetização" />
        <MetricCard label="Receita confirmada" value={money(data.confirmedRevenueCents || 0)} hint={`${data.openAlerts || 0} alertas operacionais abertos`} />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="text-base font-bold text-slate-950">Leads por produto</h2>
          <div className="mt-4 space-y-3">
            {Object.entries(data.leadsByProduct || {}).map(([product, count]) => (
              <div key={product} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm">
                <span className="text-slate-600">{product}</span>
                <span className="font-semibold text-slate-950">{count}</span>
              </div>
            ))}
            {Object.keys(data.leadsByProduct || {}).length === 0 ? (
              <p className="text-sm text-slate-500">Ainda não há volume suficiente para segmentação por produto.</p>
            ) : null}
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="text-base font-bold text-slate-950">Leads por status operacional</h2>
          <div className="mt-4 space-y-3">
            {Object.entries(data.leadsByStatus || {}).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm">
                <span className="text-slate-600">{status}</span>
                <span className="font-semibold text-slate-950">{count}</span>
              </div>
            ))}
            {Object.keys(data.leadsByStatus || {}).length === 0 ? (
              <p className="text-sm text-slate-500">Nenhum status agregado disponível ainda.</p>
            ) : null}
          </div>
        </section>
      </div>

      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="text-base font-bold text-slate-950">Leads recentes</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
              <tr>
                <th className="py-3">Data</th>
                <th>Lead</th>
                <th>Produto</th>
                <th>Status</th>
                <th>Parceiro</th>
                <th>Responsável</th>
              </tr>
            </thead>
            <tbody>
              {(data.recentLeads || []).map((lead) => (
                <tr key={lead.id} className="border-b border-slate-100">
                  <td className="py-3">{lead.createdAt ? new Date(lead.createdAt).toLocaleString('pt-BR') : '-'}</td>
                  <td>
                    <p className="font-semibold text-slate-950">{lead.fullName || 'Lead sem nome'}</p>
                    <p className="text-xs text-slate-500">{lead.phone || '-'}</p>
                  </td>
                  <td>{lead.productType || '-'}</td>
                  <td>{lead.status || '-'}</td>
                  <td>{lead.partnerName || lead.partnerId || '-'}</td>
                  <td>{lead.ownerAssignment?.ownerUser?.fullName || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {(data.recentLeads || []).length === 0 ? <p className="pt-4 text-sm text-slate-500">Sem leads recentes.</p> : null}
        </div>
      </section>
    </div>
  );
}
