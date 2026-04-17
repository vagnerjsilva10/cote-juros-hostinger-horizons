import React, { useEffect, useMemo, useState } from 'react';
import { portalApi } from '@/platform/services/portalApi.js';

const money = (cents = 0) => `R$ ${Number(cents / 100).toFixed(2)}`;
const percent = (value = 0) => `${Number(value || 0).toFixed(1)}%`;

function Stat({ label, value, hint }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <p className="text-xs font-semibold uppercase text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-slate-950">{value}</p>
      {hint ? <p className="mt-1 text-sm text-slate-600">{hint}</p> : null}
    </div>
  );
}

function FlowCanvas({ flow }) {
  const version = flow?.versions?.[0];
  const definition = version?.definition || { nodes: [], edges: [] };
  const nodes = definition.nodes || [];
  const edges = definition.edges || [];
  const nodeMap = useMemo(() => new Map(nodes.map((node) => [node.key, node])), [nodes]);

  return (
    <div className="relative min-h-[520px] overflow-auto rounded-lg border border-slate-200 bg-slate-50">
      <div className="relative h-[520px] min-w-[2200px]">
        <svg className="absolute inset-0 h-full w-full" aria-hidden="true">
          {edges.map((edge) => {
            const source = nodeMap.get(edge.source);
            const target = nodeMap.get(edge.target);
            if (!source || !target) return null;
            const sx = Number(source.position?.x || 0) + 170;
            const sy = Number(source.position?.y || 0) + 42;
            const tx = Number(target.position?.x || 0);
            const ty = Number(target.position?.y || 0) + 42;
            const mid = sx + Math.max(80, (tx - sx) / 2);
            return (
              <g key={edge.key || `${edge.source}-${edge.target}`}>
                <path
                  d={`M ${sx} ${sy} C ${mid} ${sy}, ${mid} ${ty}, ${tx} ${ty}`}
                  fill="none"
                  stroke="#64748b"
                  strokeWidth="2"
                />
                {edge.label ? (
                  <text x={(sx + tx) / 2} y={(sy + ty) / 2 - 8} fill="#334155" fontSize="12" fontWeight="700">
                    {edge.label}
                  </text>
                ) : null}
              </g>
            );
          })}
        </svg>

        {nodes.map((node) => (
          <div
            key={node.key}
            className="absolute w-[170px] rounded-lg border border-slate-300 bg-white p-3 shadow-sm"
            style={{ left: Number(node.position?.x || 0), top: Number(node.position?.y || 0) }}
          >
            <p className="text-xs font-semibold uppercase text-teal-700">{node.type}</p>
            <p className="mt-1 text-sm font-bold text-slate-950">{node.label}</p>
            <p className="mt-2 break-words text-xs text-slate-500">{node.key}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function CampaignsPanel({ campaigns, onRefresh }) {
  const toggleStatus = async (campaign) => {
    const next = campaign.status === 'active' ? 'paused' : 'active';
    await portalApi.setReactivationEmailCampaignStatus(campaign.id, next);
    onRefresh();
  };

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-950">Campanhas</h2>
          <p className="text-sm text-slate-600">Controle de status, limites, templates e fluxo associado.</p>
        </div>
      </div>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
            <tr>
              <th className="py-3">Nome</th>
              <th>Status</th>
              <th>Limite</th>
              <th>Batch</th>
              <th>Flow</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {campaigns.map((campaign) => (
              <tr key={campaign.id} className="border-b border-slate-100">
                <td className="py-3">
                  <p className="font-semibold text-slate-950">{campaign.name}</p>
                  <p className="text-xs text-slate-500">{campaign.slug}</p>
                </td>
                <td>{campaign.status}</td>
                <td>{campaign.dailyLimit}/dia</td>
                <td>{campaign.batchSize}</td>
                <td className="max-w-[180px] truncate">{campaign.flowDefinitionId || '-'}</td>
                <td>
                  <button
                    type="button"
                    className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700"
                    onClick={() => toggleStatus(campaign)}
                  >
                    {campaign.status === 'active' ? 'Pausar' : 'Ativar'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {campaigns.length === 0 ? <p className="py-4 text-sm text-slate-500">Nenhuma campanha configurada.</p> : null}
      </div>
    </section>
  );
}

function TemplatesPanel({ templates }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5">
      <h2 className="text-lg font-bold text-slate-950">Templates</h2>
      <div className="mt-4 grid gap-3 xl:grid-cols-3">
        {templates.map((template) => (
          <div key={template.id} className="rounded-lg border border-slate-200 p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="font-bold text-slate-950">{template.name}</p>
              <span className="rounded bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">v{template.version}</span>
            </div>
            <p className="mt-2 text-sm font-semibold text-slate-700">{template.subject}</p>
            <p className="mt-2 text-xs text-slate-500">{template.status} / {template.isActive ? 'ativo' : 'inativo'}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {(template.variables || []).map((variable) => (
                <span key={variable} className="rounded bg-teal-50 px-2 py-1 text-xs font-semibold text-teal-800">
                  {variable}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function AdminEmailOpsPage() {
  const [dashboard, setDashboard] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [flows, setFlows] = useState([]);
  const [selectedFlowId, setSelectedFlowId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [dashboardData, campaignData, templateData, flowData] = await Promise.all([
        portalApi.getReactivationEmailAdminDashboard(),
        portalApi.getReactivationEmailCampaigns(),
        portalApi.getReactivationEmailTemplates(),
        portalApi.getReactivationFlows()
      ]);
      setDashboard(dashboardData);
      setCampaigns(campaignData || []);
      setTemplates(templateData || []);
      setFlows(flowData || []);
      setSelectedFlowId((current) => current || flowData?.[0]?.id || '');
    } catch (err) {
      setError(err.message || 'Nao foi possivel carregar o admin de email.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const selectedFlow = flows.find((flow) => flow.id === selectedFlowId) || flows[0];

  const bootstrap = async () => {
    await portalApi.bootstrapReactivationEmailAdmin();
    await load();
  };

  if (loading) return <p className="rounded-lg bg-white p-4 text-slate-700">Carregando operacao de email...</p>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-950">Email Ops</h1>
          <p className="mt-1 max-w-3xl text-sm text-slate-600">
            Campanhas, templates, eventos SendGrid e fluxo visual da reativacao de credito da Cote Juros.
          </p>
        </div>
        <button
          type="button"
          className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white"
          onClick={bootstrap}
        >
          Sincronizar fluxo padrao
        </button>
      </div>

      {error ? <p className="rounded-lg bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</p> : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Stat label="Fila" value={dashboard?.leadsInQueue || 0} hint="Leads importados ou visitados" />
        <Stat label="Enviados hoje" value={`${dashboard?.dailyLimitUsed || 0}/${dashboard?.dailyLimit || 0}`} hint={`${dashboard?.dailyLimitRemaining || 0} restantes`} />
        <Stat label="Entregues" value={dashboard?.delivered || 0} hint={`Abertura: ${percent(dashboard?.openRate)}`} />
        <Stat label="Cliques" value={dashboard?.clicks || 0} hint={`CTR: ${percent(dashboard?.clickRate)}`} />
        <Stat label="Bounces" value={dashboard?.bounces || 0} hint={`${dashboard?.spamReports || 0} spam reports`} />
        <Stat label="Opt-outs" value={dashboard?.optOuts || 0} hint="Supressao por evento" />
        <Stat label="Fluxos ativos" value={dashboard?.activeFlows || 0} hint={`${dashboard?.pausedFlows || 0} pausados`} />
        <Stat label="Receita estimada" value={money(dashboard?.estimatedRevenueCents || 0)} hint="Atribuida ao funil atual" />
      </div>

      <CampaignsPanel campaigns={campaigns} onRefresh={load} />
      <TemplatesPanel templates={templates} />

      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-bold text-slate-950">Health dos jobs</h2>
        <p className="text-sm text-slate-600">Ultimas execucoes registradas pelo motor da operacao.</p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
              <tr>
                <th className="py-3">Job</th>
                <th>Status</th>
                <th>Origem</th>
                <th>Inicio</th>
                <th>Duração</th>
                <th>Processados</th>
                <th>Erros</th>
              </tr>
            </thead>
            <tbody>
              {(dashboard?.recentJobRuns || []).map((run) => (
                <tr key={run.id} className="border-b border-slate-100">
                  <td className="py-3 font-semibold text-slate-950">{run.jobName}</td>
                  <td>{run.status}</td>
                  <td>{run.triggerSource || '-'}</td>
                  <td>{run.startedAt ? new Date(run.startedAt).toLocaleString('pt-BR') : '-'}</td>
                  <td>{run.durationMs ? `${Math.round(run.durationMs / 1000)}s` : '-'}</td>
                  <td>{run.processedCount ?? '-'}</td>
                  <td>{run.errorCount ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {(dashboard?.recentJobRuns || []).length === 0 ? (
            <p className="py-4 text-sm text-slate-500">Nenhum run registrado ainda.</p>
          ) : null}
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-950">Construtor visual de fluxo</h2>
            <p className="text-sm text-slate-600">Primeira versao publicada do fluxo initial, reminder e last call.</p>
          </div>
          <select
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            value={selectedFlow?.id || ''}
            onChange={(event) => setSelectedFlowId(event.target.value)}
          >
            {flows.map((flow) => (
              <option key={flow.id} value={flow.id}>{flow.name}</option>
            ))}
          </select>
        </div>
        {selectedFlow ? (
          <div className="mt-4">
            <div className="mb-3 flex flex-wrap gap-2 text-xs font-semibold">
              <span className="rounded bg-slate-100 px-2 py-1 text-slate-700">status: {selectedFlow.status}</span>
              <span className="rounded bg-slate-100 px-2 py-1 text-slate-700">ativo: {selectedFlow.isActive ? 'sim' : 'nao'}</span>
              <span className="rounded bg-slate-100 px-2 py-1 text-slate-700">versoes: {selectedFlow.versions?.length || 0}</span>
            </div>
            <FlowCanvas flow={selectedFlow} />
          </div>
        ) : (
          <p className="mt-4 text-sm text-slate-500">Nenhum fluxo encontrado.</p>
        )}
      </section>
    </div>
  );
}
