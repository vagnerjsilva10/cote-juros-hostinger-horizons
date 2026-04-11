import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { portalApi } from '@/platform/services/portalApi.js';

export default function AdminDashboardPage() {
  const [data, setData] = useState({
    totalLeads: 0,
    leadsByProductType: {},
    clicksByOffer: [],
    ctaClicks: 0,
    appIntegrationEvents: 0,
    topConvertingPages: [],
    recentSimulationActivity: []
  });

  useEffect(() => {
    portalApi.getAdminAnalyticsOverview().then(setData);
  }, []);

  const metrics = [
    { label: 'Total leads', value: data.totalLeads },
    { label: 'CTA clicks', value: data.ctaClicks },
    { label: 'App integration events', value: data.appIntegrationEvents },
    { label: 'Produtos com leads', value: Object.keys(data.leadsByProductType || {}).length }
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <Card key={metric.label} className="border-slate-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">{metric.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold text-slate-900">{metric.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-base">Leads por produto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {Object.entries(data.leadsByProductType || {}).map(([product, count]) => (
              <div key={product} className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2">
                <span className="text-sm text-slate-600">{product}</span>
                <span className="font-semibold text-slate-900">{count}</span>
              </div>
            ))}
            {Object.keys(data.leadsByProductType || {}).length === 0 ? (
              <p className="text-sm text-slate-500">Sem leads registrados ainda.</p>
            ) : null}
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-base">Top páginas (origem de lead)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {(data.topConvertingPages || []).map((item) => (
              <div key={item.page} className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2">
                <span className="text-sm text-slate-600">{item.page}</span>
                <span className="font-semibold text-slate-900">{item.count}</span>
              </div>
            ))}
            {(data.topConvertingPages || []).length === 0 ? (
              <p className="text-sm text-slate-500">Sem dados suficientes ainda.</p>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-base">Cliques por oferta</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Oferta</TableHead>
                <TableHead>Cliques</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data.clicksByOffer || []).map((row) => (
                <TableRow key={row.offerId}>
                  <TableCell>{row.offerTitle}</TableCell>
                  <TableCell>{row.count}</TableCell>
                </TableRow>
              ))}
              {(data.clicksByOffer || []).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={2} className="text-slate-500">Sem cliques registrados.</TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-base">Atividade recente de simulação</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Produto</TableHead>
                <TableHead>Página</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data.recentSimulationActivity || []).map((lead) => (
                <TableRow key={lead.id}>
                  <TableCell>{new Date(lead.createdAt).toLocaleString('pt-BR')}</TableCell>
                  <TableCell>{lead.productType || '-'}</TableCell>
                  <TableCell>{lead.sourcePage || lead.originPage || '-'}</TableCell>
                  <TableCell>{lead.status || 'new'}</TableCell>
                </TableRow>
              ))}
              {(data.recentSimulationActivity || []).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-slate-500">Sem atividade recente.</TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
