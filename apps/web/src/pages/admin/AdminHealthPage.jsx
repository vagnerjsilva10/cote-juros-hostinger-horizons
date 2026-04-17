import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import AdminPageHeader from '@/admin/AdminPageHeader.jsx';
import { portalApi } from '@/platform/services/portalApi.js';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const healthTone = {
  healthy: 'text-emerald-700',
  warning: 'text-amber-700',
  error: 'text-red-700',
  unknown: 'text-slate-500',
  disabled: 'text-slate-500',
  available: 'text-emerald-700'
};

function MetricCard({ label, value, hint }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5">
      <p className="text-sm font-semibold text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-bold text-slate-950">{value}</p>
      {hint ? <p className="mt-2 text-sm text-slate-600">{hint}</p> : null}
    </div>
  );
}

const renderStatus = (value) => (
  <span className={healthTone[value] || 'text-slate-600'}>
    {value || 'unknown'}
  </span>
);

export default function AdminHealthPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    portalApi.getAdminHealth()
      .then((response) => {
        if (!active) return;
        setData(response);
      })
      .catch((error) => {
        if (!active) return;
        toast.error(error.message || 'Não foi possível carregar a saúde da plataforma.');
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Saúde operacional"
        description="Acompanhe integrações, alertas, checks recentes e o estado dos jobs agendados."
      />

      {loading ? (
        <Card className="border-slate-200">
          <CardContent className="pt-6 text-sm text-slate-600">Carregando saúde operacional...</CardContent>
        </Card>
      ) : null}

      {data ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="Alertas abertos"
              value={data.alerts?.open || 0}
              hint={`${data.alerts?.total || 0} alertas recentes registrados`}
            />
            <MetricCard
              label="Checks recentes"
              value={(data.checks || []).length}
              hint="Últimas verificações de integração salvas no banco"
            />
            <MetricCard
              label="Parceiros saudáveis"
              value={data.partners?.byHealthStatus?.healthy || 0}
              hint={`${data.partners?.byHealthStatus?.warning || 0} em atenção · ${data.partners?.byHealthStatus?.error || 0} com erro`}
            />
            <MetricCard
              label="Jobs ativos"
              value={(data.scheduledJobs || []).filter((item) => item.enabled).length}
              hint={`${(data.scheduledJobs || []).length} rotinas agendadas mapeadas`}
            />
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <Card className="border-slate-200">
              <CardContent className="space-y-4 pt-6">
                <div>
                  <h2 className="text-base font-bold text-slate-950">API e integrações</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Snapshot gerado em {data.generatedAt ? new Date(data.generatedAt).toLocaleString('pt-BR') : '-'}.
                  </p>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2">
                    <span className="text-slate-600">Serviço</span>
                    <span className="font-medium text-slate-950">{data.api?.service || '-'}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2">
                    <span className="text-slate-600">Ambiente</span>
                    <span className="font-medium text-slate-950">{data.api?.environment || '-'}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2">
                    <span className="text-slate-600">Banco configurado</span>
                    <span className="font-medium text-slate-950">{data.api?.databaseConfigured ? 'Sim' : 'Não'}</span>
                  </div>
                  <div className="rounded-lg border border-slate-200 px-3 py-3">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Juros Baixos</span>
                      <span className="font-medium">{renderStatus(data.integrations?.jurosBaixos?.status)}</span>
                    </div>
                    <p className="mt-2 text-xs text-slate-500">
                      Timeout: {data.integrations?.jurosBaixos?.timeoutMs || 0} ms · Retries: {data.integrations?.jurosBaixos?.retryCount || 0}
                    </p>
                    {(data.integrations?.jurosBaixos?.missing || []).length ? (
                      <p className="mt-2 text-xs text-amber-700">
                        Pendências: {(data.integrations.jurosBaixos.missing || []).join(', ')}
                      </p>
                    ) : null}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200">
              <CardContent className="space-y-4 pt-6">
                <div>
                  <h2 className="text-base font-bold text-slate-950">Severidade dos alertas</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Alertas operacionais abertos para acompanhamento manual.
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  {['critical', 'high', 'medium', 'low'].map((severity) => (
                    <div key={severity} className="rounded-lg border border-slate-200 p-4">
                      <p className="text-xs uppercase tracking-[0.14em] text-slate-500">{severity}</p>
                      <p className="mt-2 text-2xl font-bold text-slate-950">{data.alerts?.bySeverity?.[severity] || 0}</p>
                    </div>
                  ))}
                </div>

                <div className="rounded-lg border border-slate-200">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Alerta</TableHead>
                        <TableHead>Severidade</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(data.alerts?.items || []).slice(0, 5).map((alert) => (
                        <TableRow key={alert.id}>
                          <TableCell>
                            <p className="font-medium text-slate-950">{alert.message}</p>
                            <p className="text-xs text-slate-500">{alert.key}</p>
                          </TableCell>
                          <TableCell>{alert.severity}</TableCell>
                          <TableCell>{alert.status}</TableCell>
                        </TableRow>
                      ))}
                      {(data.alerts?.items || []).length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={3} className="text-slate-500">
                            Nenhum alerta recente registrado.
                          </TableCell>
                        </TableRow>
                      ) : null}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <Card className="border-slate-200">
              <CardContent className="pt-6">
                <h2 className="text-base font-bold text-slate-950">Checks de integração</h2>
                <div className="mt-4 overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Integração</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Tempo</TableHead>
                        <TableHead>Quando</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(data.checks || []).map((check) => (
                        <TableRow key={check.id}>
                          <TableCell className="font-medium text-slate-950">{check.integrationKey}</TableCell>
                          <TableCell>{renderStatus(check.status)}</TableCell>
                          <TableCell>{check.responseTimeMs != null ? `${check.responseTimeMs} ms` : '-'}</TableCell>
                          <TableCell>{check.checkedAt ? new Date(check.checkedAt).toLocaleString('pt-BR') : '-'}</TableCell>
                        </TableRow>
                      ))}
                      {(data.checks || []).length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-slate-500">
                            Ainda não há checks salvos. Rode testes de integração ou operações de parceiro para alimentar esta trilha.
                          </TableCell>
                        </TableRow>
                      ) : null}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200">
              <CardContent className="pt-6">
                <h2 className="text-base font-bold text-slate-950">Jobs agendados</h2>
                <div className="mt-4 overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Job</TableHead>
                        <TableHead>Cron</TableHead>
                        <TableHead>Ativo</TableHead>
                        <TableHead>Descrição</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(data.scheduledJobs || []).map((job) => (
                        <TableRow key={job.key}>
                          <TableCell className="font-medium text-slate-950">{job.key}</TableCell>
                          <TableCell className="font-mono text-xs">{job.cron}</TableCell>
                          <TableCell>{job.enabled ? 'Sim' : 'Não'}</TableCell>
                          <TableCell className="text-slate-600">{job.description}</TableCell>
                        </TableRow>
                      ))}
                      {(data.scheduledJobs || []).length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-slate-500">
                            Nenhuma rotina operacional mapeada no ambiente atual.
                          </TableCell>
                        </TableRow>
                      ) : null}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      ) : null}
    </div>
  );
}
