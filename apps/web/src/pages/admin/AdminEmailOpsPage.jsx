import React, { useEffect, useMemo, useState } from 'react';
import { portalApi } from '@/platform/services/portalApi.js';

const money = (cents = 0) => `R$ ${Number(cents / 100).toFixed(2)}`;
const percent = (value = 0) => `${Number(value || 0).toFixed(1)}%`;
const prettyJson = (value) => JSON.stringify(value || {}, null, 2);

const parseJsonOrThrow = (value, label) => {
  try {
    return value?.trim() ? JSON.parse(value) : {};
  } catch {
    throw new Error(`${label} contem JSON invalido.`);
  }
};

const getLatestFlowDefinition = (flow) => {
  return flow?.versions?.[0]?.definition || { nodes: [], edges: [] };
};

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

function TemplatesPanel({ templates, onEdit }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-slate-950">Templates</h2>
        <button
          type="button"
          className="rounded-lg bg-slate-950 px-3 py-2 text-xs font-semibold text-white"
          onClick={() => onEdit({})}
        >
          Novo template
        </button>
      </div>
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
            <button
              type="button"
              className="mt-4 rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700"
              onClick={() => onEdit(template)}
            >
              Editar template
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

function TemplateEditorPanel({ template, onSaved, onCancel }) {
  const [form, setForm] = useState(() => ({
    id: template?.id || undefined,
    name: template?.name || '',
    slug: template?.slug || '',
    status: template?.status || 'draft',
    isActive: Boolean(template?.isActive),
    subject: template?.subject || '',
    preheader: template?.preheader || '',
    html: template?.html || '',
    text: template?.text || '',
    variables: (template?.variables || ['firstName', 'reactivationUrl', 'unsubscribeUrl']).join(', '),
    metadata: prettyJson(template?.metadata || {})
  }));
  const [preview, setPreview] = useState(null);
  const [busy, setBusy] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    setForm({
      id: template?.id || undefined,
      name: template?.name || '',
      slug: template?.slug || '',
      status: template?.status || 'draft',
      isActive: Boolean(template?.isActive),
      subject: template?.subject || '',
      preheader: template?.preheader || '',
      html: template?.html || '',
      text: template?.text || '',
      variables: (template?.variables || ['firstName', 'reactivationUrl', 'unsubscribeUrl']).join(', '),
      metadata: prettyJson(template?.metadata || {})
    });
    setPreview(null);
    setMessage('');
  }, [template]);

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const payload = () => ({
    ...form,
    slug: form.slug || undefined,
    variables: form.variables.split(',').map((item) => item.trim()).filter(Boolean),
    metadata: parseJsonOrThrow(form.metadata, 'Metadata')
  });

  const save = async (publish = false) => {
    setBusy(publish ? 'Publicando' : 'Salvando');
    setMessage('');
    try {
      const saved = await portalApi.saveReactivationEmailTemplate({
        ...payload(),
        status: publish ? 'active' : form.status,
        isActive: publish ? true : form.isActive
      });
      setMessage(publish ? 'Template publicado.' : 'Template salvo.');
      onSaved(saved);
    } catch (err) {
      setMessage(err.message || 'Nao foi possivel salvar o template.');
    } finally {
      setBusy('');
    }
  };

  const renderPreview = async () => {
    setBusy('Gerando preview');
    setMessage('');
    try {
      if (form.id) {
        const result = await portalApi.previewReactivationEmailTemplate(form.id, {
          firstName: 'Marina',
          fullName: 'Marina Teste Cote',
          reactivationUrl: 'https://finance.cotejuros.com.br/r/exemplo-token',
          unsubscribeUrl: 'https://finance.cotejuros.com.br/r/exemplo-token?optout=1'
        });
        setPreview(result.rendered);
      } else {
        setPreview({
          subject: form.subject,
          preheader: form.preheader,
          html: form.html,
          text: form.text
        });
      }
    } catch (err) {
      setMessage(err.message || 'Nao foi possivel gerar preview.');
    } finally {
      setBusy('');
    }
  };

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-950">Editor de template</h2>
          <p className="text-sm text-slate-600">Edite assunto, preheader, HTML, texto plano e variaveis.</p>
        </div>
        <button type="button" className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700" onClick={onCancel}>
          Fechar
        </button>
      </div>
      {message ? <p className="mt-4 rounded-lg bg-slate-50 p-3 text-sm font-semibold text-slate-700">{message}</p> : null}
      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        <div className="space-y-3">
          <div className="grid gap-3 md:grid-cols-2">
            <label className="text-sm font-semibold text-slate-700">
              Nome
              <input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" value={form.name} onChange={(event) => update('name', event.target.value)} />
            </label>
            <label className="text-sm font-semibold text-slate-700">
              Slug
              <input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" value={form.slug} onChange={(event) => update('slug', event.target.value)} />
            </label>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="text-sm font-semibold text-slate-700">
              Status
              <select className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" value={form.status} onChange={(event) => update('status', event.target.value)}>
                <option value="draft">draft</option>
                <option value="active">active</option>
                <option value="inactive">inactive</option>
                <option value="archived">archived</option>
              </select>
            </label>
            <label className="flex items-center gap-2 pt-6 text-sm font-semibold text-slate-700">
              <input type="checkbox" checked={form.isActive} onChange={(event) => update('isActive', event.target.checked)} />
              Ativo
            </label>
          </div>
          <label className="block text-sm font-semibold text-slate-700">
            Assunto
            <input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" value={form.subject} onChange={(event) => update('subject', event.target.value)} />
          </label>
          <label className="block text-sm font-semibold text-slate-700">
            Preheader
            <input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" value={form.preheader} onChange={(event) => update('preheader', event.target.value)} />
          </label>
          <label className="block text-sm font-semibold text-slate-700">
            Variaveis
            <input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" value={form.variables} onChange={(event) => update('variables', event.target.value)} />
          </label>
          <label className="block text-sm font-semibold text-slate-700">
            Metadata JSON
            <textarea className="mt-1 h-24 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs" value={form.metadata} onChange={(event) => update('metadata', event.target.value)} />
          </label>
        </div>
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-slate-700">
            HTML
            <textarea className="mt-1 h-56 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs" value={form.html} onChange={(event) => update('html', event.target.value)} />
          </label>
          <label className="block text-sm font-semibold text-slate-700">
            Texto plano
            <textarea className="mt-1 h-36 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs" value={form.text} onChange={(event) => update('text', event.target.value)} />
          </label>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white" disabled={Boolean(busy)} onClick={() => save(false)}>
          {busy === 'Salvando' ? 'Salvando...' : 'Salvar rascunho'}
        </button>
        <button type="button" className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700" disabled={Boolean(busy)} onClick={() => save(true)}>
          Publicar
        </button>
        <button type="button" className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700" disabled={Boolean(busy)} onClick={renderPreview}>
          Preview
        </button>
      </div>
      {preview ? (
        <div className="mt-5 grid gap-4 xl:grid-cols-2">
          <div className="rounded-lg bg-slate-50 p-4 text-sm text-slate-700">
            <p><strong>Assunto:</strong> {preview.subject}</p>
            <p className="mt-2"><strong>Preheader:</strong> {preview.preheader || '-'}</p>
            <pre className="mt-3 whitespace-pre-wrap rounded-lg bg-white p-3 text-xs">{preview.text}</pre>
          </div>
          <iframe className="h-72 w-full rounded-lg border border-slate-200" title="Preview HTML" srcDoc={preview.html || ''} />
        </div>
      ) : null}
    </section>
  );
}

function ManualActionsPanel({ templates }) {
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [testEmail, setTestEmail] = useState('');
  const [preview, setPreview] = useState(null);
  const [leadId, setLeadId] = useState('');
  const [reactivationUrl, setReactivationUrl] = useState('');
  const [nodeKey, setNodeKey] = useState('');
  const [suppressionEmail, setSuppressionEmail] = useState('');
  const [suppressionScope, setSuppressionScope] = useState('unsubscribe_email');
  const [busy, setBusy] = useState('');
  const [message, setMessage] = useState('');

  const templateId = selectedTemplateId || templates[0]?.id || '';
  const templateOptions = templates || [];

  const runAction = async (label, action) => {
    setBusy(label);
    setMessage('');
    try {
      const result = await action();
      setMessage(`${label}: concluido. ${JSON.stringify(result || {})}`);
      return result;
    } catch (err) {
      setMessage(`${label}: ${err.message || 'falhou'}`);
      return null;
    } finally {
      setBusy('');
    }
  };

  const buildPreviewVariables = () => ({
    firstName: 'Marina',
    name: 'Marina',
    fullName: 'Marina Teste Cote',
    reactivationUrl: reactivationUrl || 'https://finance.cotejuros.com.br/r/exemplo-token',
    unsubscribeUrl: reactivationUrl ? `${reactivationUrl}?optout=1` : 'https://finance.cotejuros.com.br/r/exemplo-token?optout=1'
  });

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-950">Acoes manuais</h2>
          <p className="text-sm text-slate-600">Preview, teste, reenvio, pausa de fluxo e supressao sem acessar o banco.</p>
        </div>
        {busy ? <span className="rounded bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700">{busy}...</span> : null}
      </div>

      {message ? <p className="mt-4 break-words rounded-lg bg-slate-50 p-3 text-xs font-semibold text-slate-700">{message}</p> : null}

      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        <div className="rounded-lg border border-slate-200 p-4">
          <h3 className="font-bold text-slate-950">Template</h3>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <label className="text-sm font-semibold text-slate-700">
              Template
              <select
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                value={templateId}
                onChange={(event) => setSelectedTemplateId(event.target.value)}
              >
                {templateOptions.map((template) => (
                  <option key={template.id} value={template.id}>{template.name}</option>
                ))}
              </select>
            </label>
            <label className="text-sm font-semibold text-slate-700">
              Email de teste
              <input
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                value={testEmail}
                onChange={(event) => setTestEmail(event.target.value)}
                placeholder="voce@cotejuros.com.br"
              />
            </label>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-lg bg-slate-950 px-3 py-2 text-xs font-semibold text-white"
              onClick={() => runAction('Preview do template', async () => {
                const result = await portalApi.previewReactivationEmailTemplate(templateId, buildPreviewVariables());
                setPreview(result);
                return { subject: result?.rendered?.subject };
              })}
              disabled={!templateId || Boolean(busy)}
            >
              Gerar preview
            </button>
            <button
              type="button"
              className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700"
              onClick={() => runAction('Envio de teste', () => portalApi.sendReactivationTemplateTest(templateId, {
                toEmail: testEmail,
                variables: buildPreviewVariables()
              }))}
              disabled={!templateId || !testEmail || Boolean(busy)}
            >
              Enviar teste
            </button>
          </div>
          {preview ? (
            <div className="mt-4 space-y-2 rounded-lg bg-slate-50 p-3 text-xs text-slate-700">
              <p><strong>Assunto:</strong> {preview.rendered?.subject}</p>
              <p><strong>Preheader:</strong> {preview.rendered?.preheader || '-'}</p>
              <textarea
                className="h-32 w-full rounded-lg border border-slate-200 bg-white p-2 font-mono text-xs"
                value={preview.rendered?.text || ''}
                readOnly
              />
            </div>
          ) : null}
        </div>

        <div className="rounded-lg border border-slate-200 p-4">
          <h3 className="font-bold text-slate-950">Lead e supressao</h3>
          <div className="mt-3 grid gap-3">
            <label className="text-sm font-semibold text-slate-700">
              Lead ID
              <input
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                value={leadId}
                onChange={(event) => setLeadId(event.target.value)}
                placeholder="cuid do reactivation_leads"
              />
            </label>
            <label className="text-sm font-semibold text-slate-700">
              URL de reativacao
              <input
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                value={reactivationUrl}
                onChange={(event) => setReactivationUrl(event.target.value)}
                placeholder="https://finance.cotejuros.com.br/r/token"
              />
            </label>
            <label className="text-sm font-semibold text-slate-700">
              Node key
              <input
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                value={nodeKey}
                onChange={(event) => setNodeKey(event.target.value)}
                placeholder="send_initial"
              />
            </label>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-lg bg-slate-950 px-3 py-2 text-xs font-semibold text-white"
              onClick={() => runAction('Reenvio manual', () => portalApi.resendReactivationLeadEmail(leadId, {
                templateId,
                sequenceKey: 'manual_resend',
                reactivationUrl
              }))}
              disabled={!leadId || !templateId || !reactivationUrl || Boolean(busy)}
            >
              Reenviar email
            </button>
            <button
              type="button"
              className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700"
              onClick={() => runAction('Pausar fluxo do lead', () => portalApi.pauseReactivationLeadFlow(leadId))}
              disabled={!leadId || Boolean(busy)}
            >
              Pausar lead
            </button>
            <button
              type="button"
              className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700"
              onClick={() => runAction('Mover lead no fluxo', () => portalApi.moveReactivationLeadFlowNode(leadId, {
                nodeKey,
                reason: 'admin_manual'
              }))}
              disabled={!leadId || !nodeKey || Boolean(busy)}
            >
              Mover node
            </button>
            <button
              type="button"
              className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700"
              onClick={() => runAction('Forcar proxima execucao', () => portalApi.forceReactivationLeadNextExecution(leadId))}
              disabled={!leadId || Boolean(busy)}
            >
              Forcar proxima etapa
            </button>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <label className="text-sm font-semibold text-slate-700">
              Email para supressao
              <input
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                value={suppressionEmail}
                onChange={(event) => setSuppressionEmail(event.target.value)}
                placeholder="lead@email.com"
              />
            </label>
            <label className="text-sm font-semibold text-slate-700">
              Escopo
              <select
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                value={suppressionScope}
                onChange={(event) => setSuppressionScope(event.target.value)}
              >
                <option value="unsubscribe_email">unsubscribe_email</option>
                <option value="unsubscribe_whatsapp">unsubscribe_whatsapp</option>
                <option value="dnc_global">dnc_global</option>
                <option value="revoked_consent">revoked_consent</option>
              </select>
            </label>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700"
              onClick={() => runAction('Aplicar supressao', () => portalApi.applyReactivationSuppression({
                leadId: leadId || undefined,
                email: suppressionEmail || undefined,
                scope: suppressionScope,
                reason: 'admin_manual'
              }))}
              disabled={(!leadId && !suppressionEmail) || Boolean(busy)}
            >
              Aplicar supressao
            </button>
            <button
              type="button"
              className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700"
              onClick={() => runAction('Liberar supressao', () => portalApi.releaseReactivationSuppression({
                leadId: leadId || undefined,
                email: suppressionEmail || undefined,
                scope: suppressionScope
              }))}
              disabled={(!leadId && !suppressionEmail) || Boolean(busy)}
            >
              Liberar supressao
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function FlowEditorPanel({ flow, onSaved }) {
  const [form, setForm] = useState(() => ({
    name: flow?.name || '',
    slug: flow?.slug || '',
    description: flow?.description || '',
    status: flow?.status || 'draft',
    isActive: Boolean(flow?.isActive),
    definition: prettyJson(getLatestFlowDefinition(flow))
  }));
  const [validation, setValidation] = useState(null);
  const [busy, setBusy] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    setForm({
      name: flow?.name || '',
      slug: flow?.slug || '',
      description: flow?.description || '',
      status: flow?.status || 'draft',
      isActive: Boolean(flow?.isActive),
      definition: prettyJson(getLatestFlowDefinition(flow))
    });
    setValidation(null);
    setMessage('');
  }, [flow]);

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const readDefinition = () => {
    const parsed = parseJsonOrThrow(form.definition, 'Definicao do fluxo');
    return {
      nodes: Array.isArray(parsed.nodes) ? parsed.nodes : [],
      edges: Array.isArray(parsed.edges) ? parsed.edges : []
    };
  };

  const validate = async () => {
    setBusy('Validando');
    setMessage('');
    try {
      const result = await portalApi.validateReactivationFlow(readDefinition());
      setValidation(result);
      setMessage(result.valid ? 'Fluxo valido.' : 'Fluxo tem erros de configuracao.');
      return result;
    } catch (err) {
      setValidation({ valid: false, errors: [{ message: err.message }] });
      setMessage(err.message || 'Nao foi possivel validar o fluxo.');
      return null;
    } finally {
      setBusy('');
    }
  };

  const save = async (publish = false) => {
    setBusy(publish ? 'Publicando' : 'Salvando');
    setMessage('');
    try {
      const definition = readDefinition();
      const result = await portalApi.saveReactivationFlow({
        id: flow?.id,
        name: form.name,
        slug: form.slug || undefined,
        description: form.description || null,
        status: publish ? 'active' : form.status,
        isActive: publish ? true : form.isActive,
        publish,
        definition
      });
      setValidation(result.validation);
      setMessage(publish ? 'Nova versao publicada.' : 'Rascunho salvo como nova versao.');
      onSaved(result);
    } catch (err) {
      setMessage(err.message || 'Nao foi possivel salvar o fluxo.');
    } finally {
      setBusy('');
    }
  };

  const addNode = (type) => {
    try {
      const definition = readDefinition();
      const index = definition.nodes.length + 1;
      const key = `${type}_${index}`;
      const nextNode = {
        key,
        type,
        label: type.replaceAll('_', ' '),
        config: type === 'delay' ? { amount: 3, unit: 'days' } : {},
        position: { x: 120 + index * 210, y: 280 }
      };
      update('definition', prettyJson({ ...definition, nodes: [...definition.nodes, nextNode] }));
    } catch (err) {
      setMessage(err.message);
    }
  };

  const connectLastNodes = () => {
    try {
      const definition = readDefinition();
      if (definition.nodes.length < 2) throw new Error('Adicione pelo menos dois nos.');
      const source = definition.nodes[definition.nodes.length - 2].key;
      const target = definition.nodes[definition.nodes.length - 1].key;
      const edge = { key: `${source}-${target}`, source, target };
      update('definition', prettyJson({ ...definition, edges: [...definition.edges, edge] }));
    } catch (err) {
      setMessage(err.message);
    }
  };

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-950">Editor visual do fluxo</h2>
          <p className="text-sm text-slate-600">Edite a definicao, valide, salve rascunho e publique uma nova versao.</p>
        </div>
        {flow?.versions?.[0] ? <span className="rounded bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">v{flow.versions[0].version}</span> : null}
      </div>
      {message ? <p className="mt-4 rounded-lg bg-slate-50 p-3 text-sm font-semibold text-slate-700">{message}</p> : null}
      <div className="mt-5 grid gap-4 lg:grid-cols-[360px_1fr]">
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-slate-700">
            Nome
            <input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" value={form.name} onChange={(event) => update('name', event.target.value)} />
          </label>
          <label className="block text-sm font-semibold text-slate-700">
            Slug
            <input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" value={form.slug} onChange={(event) => update('slug', event.target.value)} />
          </label>
          <label className="block text-sm font-semibold text-slate-700">
            Descricao
            <textarea className="mt-1 h-20 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" value={form.description || ''} onChange={(event) => update('description', event.target.value)} />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm font-semibold text-slate-700">
              Status
              <select className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" value={form.status} onChange={(event) => update('status', event.target.value)}>
                <option value="draft">draft</option>
                <option value="active">active</option>
                <option value="paused">paused</option>
                <option value="archived">archived</option>
              </select>
            </label>
            <label className="flex items-center gap-2 pt-6 text-sm font-semibold text-slate-700">
              <input type="checkbox" checked={form.isActive} onChange={(event) => update('isActive', event.target.checked)} />
              Ativo
            </label>
          </div>
          <div className="rounded-lg border border-slate-200 p-3">
            <p className="text-sm font-bold text-slate-950">Adicionar no</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {['send_email', 'delay', 'condition', 'wait_event', 'mark_status', 'end_flow'].map((type) => (
                <button key={type} type="button" className="rounded-lg border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-700" onClick={() => addNode(type)}>
                  {type}
                </button>
              ))}
              <button type="button" className="rounded-lg bg-slate-950 px-2 py-1 text-xs font-semibold text-white" onClick={connectLastNodes}>
                Conectar ultimos
              </button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700" disabled={Boolean(busy)} onClick={validate}>
              Validar
            </button>
            <button type="button" className="rounded-lg bg-slate-950 px-3 py-2 text-xs font-semibold text-white" disabled={Boolean(busy)} onClick={() => save(false)}>
              Salvar rascunho
            </button>
            <button type="button" className="rounded-lg border border-teal-300 bg-teal-50 px-3 py-2 text-xs font-semibold text-teal-800" disabled={Boolean(busy)} onClick={() => save(true)}>
              Publicar
            </button>
          </div>
          {validation ? (
            <div className={`rounded-lg p-3 text-xs ${validation.valid ? 'bg-teal-50 text-teal-800' : 'bg-red-50 text-red-700'}`}>
              <p className="font-bold">{validation.valid ? 'Fluxo valido' : 'Erros do fluxo'}</p>
              {(validation.errors || []).map((item, index) => (
                <p key={`${item.path || 'error'}-${index}`} className="mt-1">{item.path ? `${item.path}: ` : ''}{item.message}</p>
              ))}
            </div>
          ) : null}
        </div>
        <textarea
          className="min-h-[520px] w-full rounded-lg border border-slate-300 p-3 font-mono text-xs"
          value={form.definition}
          onChange={(event) => update('definition', event.target.value)}
        />
      </div>
    </section>
  );
}

function LeadTimelinePanel() {
  const [leadId, setLeadId] = useState('');
  const [timeline, setTimeline] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const loadTimeline = async () => {
    setBusy(true);
    setMessage('');
    setTimeline(null);
    try {
      const result = await portalApi.getReactivationLeadTimeline(leadId);
      setTimeline(result);
    } catch (err) {
      setMessage(err.message || 'Nao foi possivel carregar o lead.');
    } finally {
      setBusy(false);
    }
  };

  const eventRows = [
    ...(timeline?.auditEvents || []).map((item) => ({ type: `audit:${item.eventType}`, at: item.createdAt, detail: item.source || item.actor })),
    ...(timeline?.messages || []).map((item) => ({ type: `email:${item.sequenceKey}:${item.status}`, at: item.createdAt, detail: item.subject })),
    ...(timeline?.flowSteps || []).map((item) => ({ type: `flow:${item.nodeKey}:${item.status}`, at: item.startedAt || item.createdAt, detail: item.nodeType }))
  ].sort((a, b) => new Date(a.at || 0) - new Date(b.at || 0));

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-950">Timeline do lead</h2>
          <p className="text-sm text-slate-600">Veja onde o lead esta, quais emails recebeu e por quais etapas passou.</p>
        </div>
        <div className="flex gap-2">
          <input className="w-72 rounded-lg border border-slate-300 px-3 py-2 text-sm" value={leadId} onChange={(event) => setLeadId(event.target.value)} placeholder="Lead ID" />
          <button type="button" className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white" disabled={!leadId || busy} onClick={loadTimeline}>
            {busy ? 'Buscando...' : 'Buscar'}
          </button>
        </div>
      </div>
      {message ? <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-700">{message}</p> : null}
      {timeline?.lead ? (
        <div className="mt-5 grid gap-4 xl:grid-cols-[320px_1fr]">
          <div className="rounded-lg border border-slate-200 p-4 text-sm text-slate-700">
            <p className="font-bold text-slate-950">{timeline.lead.fullName || 'Lead sem nome'}</p>
            <p className="mt-2">Status: <strong>{timeline.lead.status}</strong></p>
            <p>Score: <strong>{timeline.lead.scoreValue ?? '-'}</strong> / {timeline.lead.scoreBand || '-'}</p>
            <p>Parceiro: <strong>{timeline.lead.selectedPartnerName || '-'}</strong></p>
            <p>Delivery: <strong>{timeline.lead.deliveryStatus || '-'}</strong></p>
            <p className="mt-2 text-xs text-slate-500">{timeline.lead.externalLeadId || timeline.lead.id}</p>
          </div>
          <div className="max-h-[420px] overflow-auto rounded-lg border border-slate-200">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-3 py-2">Quando</th>
                  <th>Evento</th>
                  <th>Detalhe</th>
                </tr>
              </thead>
              <tbody>
                {eventRows.map((event, index) => (
                  <tr key={`${event.type}-${event.at}-${index}`} className="border-b border-slate-100">
                    <td className="px-3 py-2">{event.at ? new Date(event.at).toLocaleString('pt-BR') : '-'}</td>
                    <td className="font-semibold text-slate-950">{event.type}</td>
                    <td>{event.detail || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {eventRows.length === 0 ? <p className="p-4 text-sm text-slate-500">Nenhum evento encontrado.</p> : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}

function AdminLoginPanel({ onLoggedIn }) {
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await portalApi.loginReactivationEmailAdmin(password);
      setPassword('');
      onLoggedIn();
    } catch (err) {
      setError(err.message || 'Nao foi possivel entrar.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-md rounded-lg border border-slate-200 bg-white p-6">
      <h1 className="text-2xl font-bold text-slate-950">Email Ops</h1>
      <p className="mt-2 text-sm text-slate-600">Entre para controlar campanhas, fluxos, templates e a regua de reativacao.</p>
      <form className="mt-5 space-y-4" onSubmit={submit}>
        <label className="block text-sm font-semibold text-slate-700">
          Senha do admin
          <input
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            placeholder="Senha configurada no backend"
          />
        </label>
        {error ? <p className="rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p> : null}
        <button
          type="submit"
          className="w-full rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          disabled={busy || password.length < 8}
        >
          {busy ? 'Entrando...' : 'Entrar'}
        </button>
        <p className="text-xs text-slate-500">API: {portalApi.getApiBaseUrl()}</p>
      </form>
    </div>
  );
}

export default function AdminEmailOpsPage() {
  const [dashboard, setDashboard] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [flows, setFlows] = useState([]);
  const [selectedFlowId, setSelectedFlowId] = useState('');
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [authRequired, setAuthRequired] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    setError('');
    setAuthRequired(false);
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
      if (String(err.message || '').toLowerCase().includes('unauthorized')) {
        setAuthRequired(true);
        return;
      }
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
  if (authRequired) return <AdminLoginPanel onLoggedIn={load} />;

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
        <button
          type="button"
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
          onClick={async () => {
            await portalApi.logoutReactivationEmailAdmin();
            setAuthRequired(true);
          }}
        >
          Sair
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
      <TemplatesPanel templates={templates} onEdit={setEditingTemplate} />
      {editingTemplate ? (
        <TemplateEditorPanel
          template={editingTemplate}
          onCancel={() => setEditingTemplate(null)}
          onSaved={async (template) => {
            setEditingTemplate(template);
            await load();
          }}
        />
      ) : null}
      <ManualActionsPanel templates={templates} />
      <LeadTimelinePanel />

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

      {selectedFlow ? (
        <FlowEditorPanel
          flow={selectedFlow}
          onSaved={async () => {
            await load();
          }}
        />
      ) : null}
    </div>
  );
}
