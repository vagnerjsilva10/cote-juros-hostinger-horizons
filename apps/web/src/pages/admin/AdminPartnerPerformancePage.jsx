import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import AdminPageHeader from '@/admin/AdminPageHeader.jsx';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { portalApi } from '@/platform/services/portalApi.js';

const formatMoney = (value) =>
  Number(value || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });

const formatRate = (value) =>
  `${(Number(value || 0) * 100).toLocaleString('pt-BR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  })}%`;

function MetricCard({ label, value, hint }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5">
      <p className="text-sm font-semibold text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-bold text-slate-950">{value}</p>
      {hint ? <p className="mt-2 text-sm text-slate-600">{hint}</p> : null}
    </div>
  );
}

export default function AdminPartnerPerformancePage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');

    portalApi.getAdminPartnerPerformance()
      .then((items) => {
        if (!active) return;
        setRows(Array.isArray(items) ? items : []);
      })
      .catch((err) => {
        if (!active) return;
        const message = err?.message || 'Não foi possível carregar a performance dos parceiros.';
        setError(message);
        toast.error(message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const totals = useMemo(() => rows.reduce((acc, row) => ({
    clicks: acc.clicks + Number(row.clicks || 0),
    leads: acc.leads + Number(row.leads || 0),
    paid: acc.paid + Number(row.paid || 0),
    revenue: acc.revenue + Number(row.revenue || 0)
  }), { clicks: 0, leads: 0, paid: 0, revenue: 0 }), [rows]);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Performance de parceiros"
        description="Cliques, conversões, retornos dos parceiros e receita por parceiro em um único painel."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Cliques" value={totals.clicks} hint="Redirects rastreados" />
        <MetricCard label="Leads" value={totals.leads} hint="Retornos marcados como lead" />
        <MetricCard label="Pagos" value={totals.paid} hint="Retornos marcados como pago" />
        <MetricCard label="Receita" value={formatMoney(totals.revenue)} hint="Comissão confirmada" />
      </div>

      <Card className="border-slate-200">
        <CardContent className="pt-6">
          {loading ? <p className="text-sm text-slate-600">Carregando performance...</p> : null}
          {error ? <p className="text-sm text-red-700">{error}</p> : null}

          {!loading && !error && rows.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
              <p className="text-base font-semibold text-slate-950">Nenhuma performance registrada ainda.</p>
              <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-600">
                Quando os encaminhamentos e retornos dos parceiros começarem a entrar, os indicadores por parceiro aparecerão aqui.
              </p>
            </div>
          ) : null}

          {rows.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Parceiro</TableHead>
                  <TableHead>Produto</TableHead>
                  <TableHead>Cliques</TableHead>
                  <TableHead>Leads</TableHead>
                  <TableHead>Aprovados</TableHead>
                  <TableHead>Pagos</TableHead>
                  <TableHead>Receita</TableHead>
                  <TableHead>Conv. Lead</TableHead>
                  <TableHead>Conv. Pago</TableHead>
                  <TableHead>RPC</TableHead>
                  <TableHead>Última conversão</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.partnerId}>
                    <TableCell>
                      <p className="font-medium text-slate-950">{row.partnerName}</p>
                      <p className="text-xs text-slate-500">{row.partnerSlug}</p>
                    </TableCell>
                    <TableCell>{row.productType || '-'}</TableCell>
                    <TableCell>{row.clicks}</TableCell>
                    <TableCell>{row.leads}</TableCell>
                    <TableCell>{row.approved}</TableCell>
                    <TableCell>{row.paid}</TableCell>
                    <TableCell>{formatMoney(row.revenue)}</TableCell>
                    <TableCell>{formatRate(row.clickToLeadRate)}</TableCell>
                    <TableCell>{formatRate(row.clickToPaidRate)}</TableCell>
                    <TableCell>{formatMoney(row.revenuePerClick)}</TableCell>
                    <TableCell>{row.lastConversionAt ? new Date(row.lastConversionAt).toLocaleString('pt-BR') : '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
