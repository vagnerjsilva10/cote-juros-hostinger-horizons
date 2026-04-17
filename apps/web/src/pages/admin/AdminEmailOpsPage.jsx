import React, { useEffect, useMemo, useState } from 'react';
import { portalApi } from '@/platform/services/portalApi.js';

const money = (cents = 0) => `R$ ${Number(cents / 100).toFixed(2)}`;
const percent = (value = 0) => `${Number(value || 0).toFixed(1)}%`;
const prettyJson = (value) => JSON.stringify(value || {}, null, 2);
const defaultVariables = ['firstName', 'fullName', 'reactivationUrl', 'unsubscribeUrl'];

const parseJsonOrThrow = (value, label) => {
  try {
    return value?.trim() ? JSON.parse(value) : {};
  } catch {
    throw new Error(`${label} contem JSON invalido.`);
  }
};

const latestDefinition = (flow) => flow?.versions?.[0]?.definition || { nodes: [], edges: [] };
const latestVersion = (flow) => flow?.versions?.[0] || null;

const badgeTone = {
  active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  published: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  sent: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  delivered: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  draft: 'bg-slate-50 text-slate-700 border-slate-200',
  paused: 'bg-amber-50 text-amber-700 border-amber-200',
  waiting: 'bg-amber-50 text-amber-700 border-amber-200',
  inactive: 'bg-slate-50 text-slate-600 border-slate-200',
  archived: 'bg-slate-50 text-slate-600 border-slate-200',
  failed: 'bg-red-50 text-red-700 border-red-200',
  error: 'bg-red-50 text-red-700 border-red-200'
};

function Badge({ children, tone = 'draft' }) {
  return (
    <span className={`inline-flex items-center rounded-md border px-2 py-1 text-xs font-semibold ${badgeTone[tone] || badgeTone.draft}`}>
      {children}
    </span>
  );
}

function Notice({ tone = 'info', title, children }) {
  const toneClass = tone === 'danger'
    ? 'border-red-200 bg-red-50 text-red-800'
    : tone === 'success'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
      : tone === 'warning'
        ? 'border-amber-200 bg-amber-50 text-amber-800'
        : 'border-slate-200 bg-slate-50 text-slate-700';
  return (
    <div className={`rounded-lg border p-4 text-sm ${toneClass}`}>
      {title ? <p className="font-bold">{title}</p> : null}
      {children ? <div className={title ? 'mt-1' : ''}>{children}</div> : null}
    </div>
  );
}

function EmptyState({ title, description, actionLabel, onAction }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6">
      <p className="font-bold text-slate-950">{title}</p>
      <p className="mt-2 max-w-2xl text-sm text-slate-600">{description}</p>
      {actionLabel && onAction ? (
        <button
          type="button"
          className="mt-4 rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          onClick={onAction}
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}

function Section({ id, eyebrow, title, description, action, children }) {
  return (
    <section id={id} className="scroll-mt-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          {eyebrow ? <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{eyebrow}</p> : null}
          <h2 className="mt-1 text-xl font-bold text-slate-950">{title}</h2>
          {description ? <p className="mt-2 max-w-3xl text-sm text-slate-600">{description}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function Stat({ label, value, hint, tone = 'default' }) {
  const accent = tone === 'danger' ? 'text-red-700' : tone === 'success' ? 'text-emerald-700' : 'text-slate-950';
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-3 text-3xl font-black leading-none ${accent}`}>{value}</p>
      {hint ? <p className="mt-2 text-sm text-slate-600">{hint}</p> : null}
    </div>
  );
}

function FlowCanvas({ flow }) {
  const version = latestVersion(flow);
  const definition = version?.definition || { nodes: [], edges: [] };
  const nodes = definition.nodes || [];
  const edges = definition.edges || [];
  const nodeMap = useMemo(() => new Map(nodes.map((node) => [node.key, node])), [nodes]);

  if (!flow || nodes.length === 0) {
    return (
      <EmptyState
        title="Nenhum fluxo publicado."
        description="Sincronize o fluxo padrao para criar a regua inicial com entrada, emails, esperas, condicoes e encerramentos."
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-950">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
        <div>
          <p className="font-bold text-white">{flow.name}</p>
          <p className="text-xs text-slate-300">{flow.slug} / v{version?.version || 1}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge tone={flow.status}>{flow.status}</Badge>
          <Badge tone={version?.status || 'draft'}>{version?.status || 'draft'}</Badge>
        </div>
      </div>
      <div className="relative min-h-[540px] overflow-auto bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:32px_32px]">
        <div className="relative h-[540px] min-w-[2200px]">
          <svg className="absolute inset-0 h-full w-full" aria-hidden="true">
            {edges.map((edge) => {
              const source = nodeMap.get(edge.source);
              const target = nodeMap.get(edge.target);
              if (!source || !target) return null;
              const sx = Number(source.position?.x || 0) + 190;
              const sy = Number(source.position?.y || 0) + 48;
              const tx = Number(target.position?.x || 0);
              const ty = Number(target.position?.y || 0) + 48;
              const mid = sx + Math.max(90, (tx - sx) / 2);
              return (
                <g key={edge.key || `${edge.source}-${edge.target}`}>
                  <path d={`M ${sx} ${sy} C ${mid} ${sy}, ${mid} ${ty}, ${tx} ${ty}`} fill="none" stroke="#94a3b8" strokeWidth="2" />
                  {edge.label ? <text x={(sx + tx) / 2} y={(sy + ty) / 2 - 10} fill="#e2e8f0" fontSize="12" fontWeight="700">{edge.label}</text> : null}
                </g>
              );
            })}
          </svg>
          {nodes.map((node) => (
            <div
              key={node.key}
              className="absolute w-[190px] rounded-lg border border-white/15 bg-white p-4 shadow-lg"
              style={{ left: Number(node.position?.x || 0), top: Number(node.position?.y || 0) }}
            >
              <p className="text-xs font-bold uppercase text-teal-700">{node.type}</p>
              <p className="mt-1 text-sm font-black text-slate-950">{node.label}</p>
              <p className="mt-3 break-words rounded bg-slate-50 px-2 py-1 text-xs text-slate-500">{node.key}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CampaignsPanel({ campaigns, onRefresh, onBootstrap }) {
  const [busy, setBusy] = useState('');

  const toggleStatus = async (campaign) => {
    const next = campaign.status === 'active' ? 'paused' : 'active';
    const ok = window.confirm(`${next === 'paused' ? 'Pausar' : 'Ativar'} a campanha "${campaign.name}"? Essa acao muda a regua operacional.`);
    if (!ok) return;
    setBusy(campaign.id);
    try {
      await portalApi.setReactivationEmailCampaignStatus(campaign.id, next);
      await onRefresh();
    } finally {
      setBusy('');
    }
  };

  if (!campaigns.length) {
    return (
      <EmptyState
        title="Nenhuma campanha criada ainda."
        description="Crie sua primeira campanha sincronizando o fluxo padrao. Ela conecta templates, limites diarios e fluxo publicado."
        actionLabel="Sincronizar campanha padrao"
        onAction={onBootstrap}
      />
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200">
      <table className="w-full min-w-[920px] text-left text-sm">
        <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
          <tr>
            <th className="px-4 py-3">Campanha</th>
            <th>Status</th>
            <th>Limite</th>
            <th>Batch</th>
            <th>Flow</th>
            <th>Acao</th>
          </tr>
        </thead>
        <tbody>
          {campaigns.map((campaign) => (
            <tr key={campaign.id} className="border-b border-slate-100">
              <td className="px-4 py-4">
                <p className="font-bold text-slate-950">{campaign.name}</p>
                <p className="text-xs text-slate-500">{campaign.slug}</p>
              </td>
              <td><Badge tone={campaign.status}>{campaign.status}</Badge></td>
              <td>{campaign.dailyLimit}/dia</td>
              <td>{campaign.batchSize}</td>
              <td className="max-w-[220px] truncate">{campaign.flowDefinitionId || '-'}</td>
              <td>
                <button
                  type="button"
                  className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 disabled:opacity-60"
                  onClick={() => toggleStatus(campaign)}
                  disabled={busy === campaign.id}
                >
                  {campaign.status === 'active' ? 'Pausar' : 'Ativar'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TemplatesPanel({ templates, onEdit, onBootstrap }) {
  if (!templates.length) {
    return (
      <EmptyState
        title="Nenhum template criado ainda."
        description="Sincronize os templates padrao ou crie um novo template para iniciar a regua com conteudo versionado."
        actionLabel="Sincronizar templates padrao"
        onAction={onBootstrap}
      />
    );
  }

  return (
    <div className="grid gap-4 xl:grid-cols-3">
      {templates.map((template) => (
        <article key={template.id} className="rounded-lg border border-slate-200 p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-black text-slate-950">{template.name}</p>
              <p className="mt-1 text-xs text-slate-500">{template.slug}</p>
            </div>
            <Badge tone={template.status}>v{template.version} / {template.status}</Badge>
          </div>
          <p className="mt-4 text-sm font-bold text-slate-800">{template.subject}</p>
          <p className="mt-2 text-xs text-slate-500">{template.isActive ? 'Template ativo para envio' : 'Nao ativo'}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {(template.variables || []).slice(0, 5).map((variable) => (
              <span key={variable} className="rounded bg-teal-50 px-2 py-1 text-xs font-semibold text-teal-800">{`{{${variable}}}`}</span>
            ))}
          </div>
          <button type="button" className="mt-5 rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700" onClick={() => onEdit(template)}>
            Editar template
          </button>
        </article>
      ))}
    </div>
  );
}

function TemplateEditorPanel({ template, onSaved, onCancel }) {
  const [tab, setTab] = useState('content');
  const [form, setForm] = useState({});
  const [preview, setPreview] = useState(null);
  const [busy, setBusy] = useState('');
  const [message, setMessage] = useState(null);

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
      variables: (template?.variables || defaultVariables).join(', '),
      metadata: prettyJson(template?.metadata || {})
    });
    setPreview(null);
    setMessage(null);
    setTab('content');
  }, [template]);

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const variables = form.variables?.split(',').map((item) => item.trim()).filter(Boolean) || [];

  const validate = () => {
    if (!form.name?.trim()) throw new Error('Informe o nome do template.');
    if (!form.subject?.trim()) throw new Error('Informe o assunto do email.');
    if (!form.html?.trim() || form.html.length < 10) throw new Error('Informe o HTML do email.');
    if (!form.text?.trim() || form.text.length < 10) throw new Error('Informe o texto plano do email.');
    parseJsonOrThrow(form.metadata, 'Metadata');
  };

  const payload = () => ({
    ...form,
    slug: form.slug || undefined,
    variables,
    metadata: parseJsonOrThrow(form.metadata, 'Metadata')
  });

  const save = async (publish = false) => {
    setBusy(publish ? 'Publicando' : 'Salvando');
    setMessage(null);
    try {
      validate();
      const saved = await portalApi.saveReactivationEmailTemplate({
        ...payload(),
        status: publish ? 'active' : form.status,
        isActive: publish ? true : form.isActive
      });
      setMessage({ tone: 'success', text: publish ? 'Template publicado e marcado como ativo.' : 'Rascunho salvo.' });
      onSaved(saved);
    } catch (err) {
      setMessage({ tone: 'danger', text: err.message || 'Nao foi possivel salvar o template.' });
    } finally {
      setBusy('');
    }
  };

  const renderPreview = async () => {
    setBusy('Gerando preview');
    setMessage(null);
    try {
      validate();
      if (form.id) {
        const result = await portalApi.previewReactivationEmailTemplate(form.id, {
          firstName: 'Marina',
          fullName: 'Marina Teste Cote',
          reactivationUrl: 'https://finance.cotejuros.com.br/r/exemplo-token',
          unsubscribeUrl: 'https://finance.cotejuros.com.br/r/exemplo-token?optout=1'
        });
        setPreview(result.rendered);
      } else {
        setPreview({ subject: form.subject, preheader: form.preheader, html: form.html, text: form.text });
      }
      setTab('preview');
    } catch (err) {
      setMessage({ tone: 'danger', text: err.message || 'Nao foi possivel gerar preview.' });
    } finally {
      setBusy('');
    }
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-black text-slate-950">{form.id ? 'Editar template' : 'Novo template'}</h3>
          <p className="mt-1 text-sm text-slate-600">Conteudo, configuracoes e preview em um unico lugar.</p>
        </div>
        <button type="button" className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700" onClick={onCancel}>
          Fechar editor
        </button>
      </div>

      {message ? <div className="mt-4"><Notice tone={message.tone}>{message.text}</Notice></div> : null}

      <div className="mt-5 flex flex-wrap gap-2">
        {[
          ['content', 'Conteudo'],
          ['settings', 'Configuracoes'],
          ['preview', 'Preview']
        ].map(([key, label]) => (
          <button key={key} type="button" className={`rounded-lg px-4 py-2 text-sm font-semibold ${tab === key ? 'bg-slate-950 text-white' : 'border border-slate-300 bg-white text-slate-700'}`} onClick={() => setTab(key)}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'content' ? (
        <div className="mt-5 grid gap-4 xl:grid-cols-2">
          <div className="space-y-4">
            <label className="block text-sm font-semibold text-slate-700">
              Assunto
              <input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" value={form.subject || ''} onChange={(event) => update('subject', event.target.value)} />
            </label>
            <label className="block text-sm font-semibold text-slate-700">
              Preheader
              <input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" value={form.preheader || ''} onChange={(event) => update('preheader', event.target.value)} />
            </label>
            <label className="block text-sm font-semibold text-slate-700">
              HTML
              <textarea className="mt-1 h-72 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs" value={form.html || ''} onChange={(event) => update('html', event.target.value)} />
            </label>
          </div>
          <div className="space-y-4">
            <label className="block text-sm font-semibold text-slate-700">
              Texto plano
              <textarea className="mt-1 h-48 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs" value={form.text || ''} onChange={(event) => update('text', event.target.value)} />
            </label>
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <p className="font-bold text-slate-950">Variaveis disponiveis</p>
              <p className="mt-1 text-sm text-slate-600">Use variaveis com chaves duplas no assunto, HTML e texto.</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {variables.map((variable) => <span key={variable} className="rounded bg-teal-50 px-2 py-1 text-xs font-semibold text-teal-800">{`{{${variable}}}`}</span>)}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {tab === 'settings' ? (
        <div className="mt-5 grid gap-4 xl:grid-cols-2">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block text-sm font-semibold text-slate-700">
              Nome
              <input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" value={form.name || ''} onChange={(event) => update('name', event.target.value)} />
            </label>
            <label className="block text-sm font-semibold text-slate-700">
              Slug
              <input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" value={form.slug || ''} onChange={(event) => update('slug', event.target.value)} />
            </label>
            <label className="block text-sm font-semibold text-slate-700">
              Status
              <select className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" value={form.status || 'draft'} onChange={(event) => update('status', event.target.value)}>
                <option value="draft">draft</option>
                <option value="active">active</option>
                <option value="inactive">inactive</option>
                <option value="archived">archived</option>
              </select>
            </label>
            <label className="flex items-center gap-2 pt-7 text-sm font-semibold text-slate-700">
              <input type="checkbox" checked={Boolean(form.isActive)} onChange={(event) => update('isActive', event.target.checked)} />
              Template ativo
            </label>
          </div>
          <div className="space-y-4">
            <label className="block text-sm font-semibold text-slate-700">
              Variaveis
              <input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" value={form.variables || ''} onChange={(event) => update('variables', event.target.value)} />
            </label>
            <label className="block text-sm font-semibold text-slate-700">
              Metadata JSON
              <textarea className="mt-1 h-32 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs" value={form.metadata || '{}'} onChange={(event) => update('metadata', event.target.value)} />
            </label>
          </div>
        </div>
      ) : null}

      {tab === 'preview' ? (
        <div className="mt-5">
          {preview ? (
            <div className="grid gap-4 xl:grid-cols-2">
              <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-700">
                <p><strong>Assunto:</strong> {preview.subject}</p>
                <p className="mt-2"><strong>Preheader:</strong> {preview.preheader || '-'}</p>
                <pre className="mt-4 max-h-72 overflow-auto whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-xs">{preview.text}</pre>
              </div>
              <iframe className="h-96 w-full rounded-lg border border-slate-200 bg-white" title="Preview HTML" srcDoc={preview.html || ''} />
            </div>
          ) : (
            <EmptyState title="Preview ainda nao gerado." description="Clique em gerar preview para revisar assunto, preheader, HTML e texto plano com variaveis de exemplo." />
          )}
        </div>
      ) : null}

      <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-200 pt-5">
        <button type="button" className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60" disabled={Boolean(busy)} onClick={() => save(false)}>
          {busy === 'Salvando' ? 'Salvando...' : 'Salvar rascunho'}
        </button>
        <button type="button" className="rounded-lg border border-teal-300 bg-teal-50 px-4 py-2 text-sm font-semibold text-teal-800 disabled:opacity-60" disabled={Boolean(busy)} onClick={() => save(true)}>
          {busy === 'Publicando' ? 'Publicando...' : 'Publicar e ativar'}
        </button>
        <button type="button" className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 disabled:opacity-60" disabled={Boolean(busy)} onClick={renderPreview}>
          {busy === 'Gerando preview' ? 'Gerando...' : 'Gerar preview'}
        </button>
      </div>
    </div>
  );
}

function ManualActionsPanel({ templates }) {
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [testEmail, setTestEmail] = useState('');
  const [leadId, setLeadId] = useState('');
  const [reactivationUrl, setReactivationUrl] = useState('');
  const [nodeKey, setNodeKey] = useState('');
  const [suppressionEmail, setSuppressionEmail] = useState('');
  const [suppressionScope, setSuppressionScope] = useState('unsubscribe_email');
  const [reason, setReason] = useState('');
  const [preview, setPreview] = useState(null);
  const [busy, setBusy] = useState('');
  const [message, setMessage] = useState(null);

  const templateId = selectedTemplateId || templates[0]?.id || '';
  const canUseTemplate = Boolean(templateId);
  const canTargetLead = Boolean(leadId.trim());
  const canResend = canTargetLead && canUseTemplate && Boolean(reactivationUrl.trim());

  const runAction = async ({ label, action, confirmText, success }) => {
    if (confirmText && !window.confirm(confirmText)) return null;
    setBusy(label);
    setMessage(null);
    try {
      const result = await action();
      setMessage({ tone: 'success', text: success || `${label} concluido.` });
      return result;
    } catch (err) {
      const raw = err.message || 'Acao falhou.';
      const text = raw.includes('SENDGRID_API_KEY')
        ? 'Provider de envio ainda nao configurado. Configure SENDGRID_API_KEY na API antes de enviar.'
        : raw;
      setMessage({ tone: 'danger', text });
      return null;
    } finally {
      setBusy('');
    }
  };

  const previewVariables = () => ({
    firstName: 'Marina',
    fullName: 'Marina Teste Cote',
    reactivationUrl: reactivationUrl || 'https://finance.cotejuros.com.br/r/exemplo-token',
    unsubscribeUrl: reactivationUrl ? `${reactivationUrl}?optout=1` : 'https://finance.cotejuros.com.br/r/exemplo-token?optout=1'
  });

  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_1.1fr]">
      <div className="rounded-lg border border-slate-200 p-5">
        <h3 className="font-black text-slate-950">Acoes seguras</h3>
        <p className="mt-1 text-sm text-slate-600">Preview e envio de teste nao alteram o estado do lead.</p>
        <div className="mt-4 grid gap-3">
          <label className="text-sm font-semibold text-slate-700">
            Template
            <select className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" value={templateId} onChange={(event) => setSelectedTemplateId(event.target.value)}>
              {templates.map((template) => <option key={template.id} value={template.id}>{template.name}</option>)}
            </select>
          </label>
          <label className="text-sm font-semibold text-slate-700">
            Email de teste
            <input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" value={testEmail} onChange={(event) => setTestEmail(event.target.value)} placeholder="voce@cotejuros.com.br" />
          </label>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="rounded-lg bg-slate-950 px-3 py-2 text-xs font-semibold text-white disabled:opacity-60" disabled={!canUseTemplate || Boolean(busy)} onClick={() => runAction({
              label: 'Preview do template',
              action: async () => {
                const result = await portalApi.previewReactivationEmailTemplate(templateId, previewVariables());
                setPreview(result.rendered);
                return result;
              },
              success: 'Preview gerado com variaveis de exemplo.'
            })}>
              Preview
            </button>
            <button type="button" className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 disabled:opacity-60" disabled={!canUseTemplate || !testEmail || Boolean(busy)} onClick={() => runAction({
              label: 'Envio de teste',
              action: () => portalApi.sendReactivationTemplateTest(templateId, { toEmail: testEmail, variables: previewVariables() }),
              success: 'Envio de teste solicitado ao provider.'
            })}>
              Enviar teste
            </button>
          </div>
        </div>
        {preview ? (
          <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
            <p className="font-bold text-slate-950">{preview.subject}</p>
            <p className="mt-2 text-slate-600">{preview.preheader || '-'}</p>
          </div>
        ) : null}
      </div>

      <div className="rounded-lg border border-red-200 bg-red-50/40 p-5">
        <h3 className="font-black text-red-950">Acoes criticas</h3>
        <p className="mt-1 text-sm text-red-800">Essas acoes mudam estado operacional. Revise o lead alvo antes de confirmar.</p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <label className="text-sm font-semibold text-slate-700">
            Lead ID
            <input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" value={leadId} onChange={(event) => setLeadId(event.target.value)} placeholder="lead_xxx" />
          </label>
          <label className="text-sm font-semibold text-slate-700">
            URL de reativacao
            <input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" value={reactivationUrl} onChange={(event) => setReactivationUrl(event.target.value)} placeholder="https://finance.cotejuros.com.br/r/token" />
          </label>
          <label className="text-sm font-semibold text-slate-700">
            Node de destino
            <input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" value={nodeKey} onChange={(event) => setNodeKey(event.target.value)} placeholder="reminder" />
          </label>
          <label className="text-sm font-semibold text-slate-700">
            Motivo operacional
            <input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" value={reason} onChange={(event) => setReason(event.target.value)} placeholder="ex: ajuste manual solicitado" />
          </label>
          <label className="text-sm font-semibold text-slate-700">
            Email para supressao
            <input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" value={suppressionEmail} onChange={(event) => setSuppressionEmail(event.target.value)} placeholder="lead@email.com" />
          </label>
          <label className="text-sm font-semibold text-slate-700">
            Escopo da supressao
            <select className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" value={suppressionScope} onChange={(event) => setSuppressionScope(event.target.value)}>
              <option value="unsubscribe_email">unsubscribe_email</option>
              <option value="unsubscribe_whatsapp">unsubscribe_whatsapp</option>
              <option value="dnc_global">dnc_global</option>
              <option value="revoked_consent">revoked_consent</option>
            </select>
          </label>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 disabled:opacity-60" disabled={!canResend || Boolean(busy)} onClick={() => runAction({
            label: 'Reenvio manual',
            confirmText: `Reenviar email para o lead ${leadId}?`,
            action: () => portalApi.resendReactivationLeadEmail(leadId, { templateId, sequenceKey: 'manual_resend', reactivationUrl }),
            success: 'Reenvio manual registrado.'
          })}>
            Reenviar email
          </button>
          <button type="button" className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800 disabled:opacity-60" disabled={!canTargetLead || Boolean(busy)} onClick={() => runAction({
            label: 'Pausar lead',
            confirmText: `Pausar execucoes ativas do lead ${leadId}?`,
            action: () => portalApi.pauseReactivationLeadFlow(leadId),
            success: 'Lead pausado nas execucoes ativas.'
          })}>
            Pausar lead
          </button>
          <button type="button" className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800 disabled:opacity-60" disabled={!canTargetLead || !nodeKey || !reason || Boolean(busy)} onClick={() => runAction({
            label: 'Mover node',
            confirmText: `Mover o lead ${leadId} para o node ${nodeKey}?`,
            action: () => portalApi.moveReactivationLeadFlowNode(leadId, { nodeKey, reason }),
            success: 'Lead movido para o node informado.'
          })}>
            Mover node
          </button>
          <button type="button" className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800 disabled:opacity-60" disabled={!canTargetLead || Boolean(busy)} onClick={() => runAction({
            label: 'Forcar proxima etapa',
            confirmText: `Forcar a proxima etapa para o lead ${leadId}?`,
            action: () => portalApi.forceReactivationLeadNextExecution(leadId),
            success: 'Proxima etapa liberada para execucao.'
          })}>
            Forcar proxima etapa
          </button>
          <button type="button" className="rounded-lg border border-red-300 bg-red-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-60" disabled={(!canTargetLead && !suppressionEmail) || !reason || Boolean(busy)} onClick={() => runAction({
            label: 'Aplicar supressao',
            confirmText: `Aplicar supressao ${suppressionScope} neste alvo? Essa acao impede novos envios no escopo selecionado.`,
            action: () => portalApi.applyReactivationSuppression({ leadId: leadId || undefined, email: suppressionEmail || undefined, scope: suppressionScope, reason }),
            success: 'Supressao aplicada com sucesso.'
          })}>
            Aplicar supressao
          </button>
        </div>
      </div>

      <div className="xl:col-span-2">
        {busy ? <Notice tone="warning">{busy} em andamento...</Notice> : null}
        {message ? <div className="mt-3"><Notice tone={message.tone}>{message.text}</Notice></div> : null}
      </div>
    </div>
  );
}

function LeadTimelinePanel() {
  const [leadId, setLeadId] = useState('');
  const [timeline, setTimeline] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);

  const loadTimeline = async () => {
    setBusy(true);
    setMessage(null);
    setTimeline(null);
    try {
      const result = await portalApi.getReactivationLeadTimeline(leadId);
      setTimeline(result);
    } catch (err) {
      setMessage({ tone: 'danger', text: err.message || 'Nao foi possivel carregar o lead.' });
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
    <div>
      <div className="flex flex-wrap gap-2">
        <input className="min-w-[280px] flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm" value={leadId} onChange={(event) => setLeadId(event.target.value)} placeholder="Lead ID" />
        <button type="button" className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60" disabled={!leadId || busy} onClick={loadTimeline}>
          {busy ? 'Buscando...' : 'Buscar lead'}
        </button>
      </div>
      {message ? <div className="mt-4"><Notice tone={message.tone}>{message.text}</Notice></div> : null}
      {!timeline ? (
        <div className="mt-4">
          <EmptyState title="Busque um lead para ver a timeline." description="Informe o Lead ID para consultar emails, eventos de provider, passos do fluxo e auditoria operacional." />
        </div>
      ) : null}
      {timeline?.lead ? (
        <div className="mt-5 grid gap-4 xl:grid-cols-[320px_1fr]">
          <div className="rounded-lg border border-slate-200 p-4 text-sm text-slate-700">
            <p className="font-black text-slate-950">{timeline.lead.fullName || 'Lead sem nome'}</p>
            <p className="mt-2">Status: <strong>{timeline.lead.status}</strong></p>
            <p>Score: <strong>{timeline.lead.scoreValue ?? '-'}</strong> / {timeline.lead.scoreBand || '-'}</p>
            <p>Parceiro: <strong>{timeline.lead.selectedPartnerName || '-'}</strong></p>
            <p>Delivery: <strong>{timeline.lead.deliveryStatus || '-'}</strong></p>
            <p className="mt-2 break-all text-xs text-slate-500">{timeline.lead.externalLeadId || timeline.lead.id}</p>
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
            {eventRows.length === 0 ? <EmptyState title="Nenhum evento encontrado." description="Assim que a operacao rodar para este lead, emails, eventos e passos do fluxo aparecerao aqui." /> : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function JobsPanel({ runs = [] }) {
  if (!runs.length) {
    return <EmptyState title="Nenhum job executado ainda." description="Assim que a operacao rodar, execucoes, duracao, processados e erros aparecerao aqui." />;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200">
      <table className="w-full min-w-[860px] text-left text-sm">
        <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
          <tr>
            <th className="px-4 py-3">Job</th>
            <th>Status</th>
            <th>Origem</th>
            <th>Inicio</th>
            <th>Duracao</th>
            <th>Processados</th>
            <th>Erros</th>
          </tr>
        </thead>
        <tbody>
          {runs.map((run) => (
            <tr key={run.id} className="border-b border-slate-100">
              <td className="px-4 py-3 font-bold text-slate-950">{run.jobName}</td>
              <td><Badge tone={run.status}>{run.status}</Badge></td>
              <td>{run.triggerSource || '-'}</td>
              <td>{run.startedAt ? new Date(run.startedAt).toLocaleString('pt-BR') : '-'}</td>
              <td>{run.durationMs ? `${Math.round(run.durationMs / 1000)}s` : '-'}</td>
              <td>{run.processedCount ?? '-'}</td>
              <td>{run.errorCount ?? 0}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function FlowBuilderPanel({ flows, selectedFlow, selectedFlowId, setSelectedFlowId, onBootstrap, onSaved }) {
  const [form, setForm] = useState({});
  const [validation, setValidation] = useState(null);
  const [busy, setBusy] = useState('');
  const [message, setMessage] = useState(null);

  useEffect(() => {
    setForm({
      name: selectedFlow?.name || '',
      slug: selectedFlow?.slug || '',
      description: selectedFlow?.description || '',
      status: selectedFlow?.status || 'draft',
      isActive: Boolean(selectedFlow?.isActive),
      definition: prettyJson(latestDefinition(selectedFlow))
    });
    setValidation(null);
    setMessage(null);
  }, [selectedFlow]);

  const readDefinition = () => parseJsonOrThrow(form.definition, 'Definicao do fluxo');

  const validate = async () => {
    setBusy('Validando');
    setMessage(null);
    try {
      const result = await portalApi.validateReactivationFlow(readDefinition());
      setValidation(result);
    } catch (err) {
      setMessage({ tone: 'danger', text: err.message || 'Nao foi possivel validar o fluxo.' });
    } finally {
      setBusy('');
    }
  };

  const save = async (publish = false) => {
    const ok = publish ? window.confirm('Publicar uma nova versao deste fluxo? A regua passara a usar a nova definicao quando vinculada a campanha.') : true;
    if (!ok) return;
    setBusy(publish ? 'Publicando' : 'Salvando');
    setMessage(null);
    try {
      if (!form.name?.trim()) throw new Error('Informe o nome do fluxo.');
      const result = await portalApi.saveReactivationFlow({
        id: selectedFlow?.id,
        name: form.name,
        slug: form.slug || undefined,
        description: form.description || null,
        status: form.status,
        isActive: form.isActive,
        publish,
        definition: readDefinition()
      });
      setMessage({ tone: 'success', text: publish ? 'Fluxo publicado.' : 'Rascunho salvo.' });
      onSaved(result);
    } catch (err) {
      setMessage({ tone: 'danger', text: err.message || 'Nao foi possivel salvar o fluxo.' });
    } finally {
      setBusy('');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <select className="rounded-lg border border-slate-300 px-3 py-2 text-sm" value={selectedFlowId || ''} onChange={(event) => setSelectedFlowId(event.target.value)}>
          {flows.map((flow) => <option key={flow.id} value={flow.id}>{flow.name}</option>)}
        </select>
        <button type="button" className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white" onClick={onBootstrap}>
          Sincronizar fluxo padrao
        </button>
      </div>

      <FlowCanvas flow={selectedFlow} />

      {!selectedFlow ? (
        <EmptyState title="Nenhum fluxo encontrado." description="Sincronize o fluxo padrao para iniciar com uma estrutura publicada e editavel." actionLabel="Sincronizar fluxo padrao" onAction={onBootstrap} />
      ) : (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-5">
          <div className="grid gap-4 lg:grid-cols-[340px_1fr]">
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-slate-700">
                Nome
                <input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" value={form.name || ''} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
              </label>
              <label className="block text-sm font-semibold text-slate-700">
                Slug
                <input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" value={form.slug || ''} onChange={(event) => setForm((current) => ({ ...current, slug: event.target.value }))} />
              </label>
              <label className="block text-sm font-semibold text-slate-700">
                Descricao
                <textarea className="mt-1 h-20 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" value={form.description || ''} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-sm font-semibold text-slate-700">
                  Status
                  <select className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" value={form.status || 'draft'} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}>
                    <option value="draft">draft</option>
                    <option value="active">active</option>
                    <option value="paused">paused</option>
                    <option value="archived">archived</option>
                  </select>
                </label>
                <label className="flex items-center gap-2 pt-7 text-sm font-semibold text-slate-700">
                  <input type="checkbox" checked={Boolean(form.isActive)} onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))} />
                  Ativo
                </label>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 disabled:opacity-60" disabled={Boolean(busy)} onClick={validate}>Validar</button>
                <button type="button" className="rounded-lg bg-slate-950 px-3 py-2 text-xs font-semibold text-white disabled:opacity-60" disabled={Boolean(busy)} onClick={() => save(false)}>Salvar rascunho</button>
                <button type="button" className="rounded-lg border border-teal-300 bg-teal-50 px-3 py-2 text-xs font-semibold text-teal-800 disabled:opacity-60" disabled={Boolean(busy)} onClick={() => save(true)}>Publicar</button>
              </div>
              {validation ? (
                <Notice tone={validation.valid ? 'success' : 'danger'} title={validation.valid ? 'Fluxo valido' : 'Erros do fluxo'}>
                  {(validation.errors || []).length ? validation.errors.map((item, index) => (
                    <p key={`${item.path || 'error'}-${index}`}>{item.path ? `${item.path}: ` : ''}{item.message}</p>
                  )) : <p>Pronto para publicar.</p>}
                </Notice>
              ) : null}
              {message ? <Notice tone={message.tone}>{message.text}</Notice> : null}
            </div>
            <textarea className="min-h-[520px] w-full rounded-lg border border-slate-300 bg-white p-3 font-mono text-xs" value={form.definition || '{}'} onChange={(event) => setForm((current) => ({ ...current, definition: event.target.value }))} />
          </div>
        </div>
      )}
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
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
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
      const text = err.message || 'Nao foi possivel carregar o Email Ops.';
      const friendly = text.toLowerCase().includes('forbidden')
        ? 'Acesso negado ao Email Ops. Seu usuario nao possui permissao email_ops.'
        : text.toLowerCase().includes('sessao')
          ? text
          : text.includes('SENDGRID')
            ? 'Integracao de email indisponivel. Verifique configuracao do provider.'
            : text;
      setError({ tone: 'danger', text: friendly });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const selectedFlow = flows.find((flow) => flow.id === selectedFlowId) || flows[0] || null;

  const bootstrap = async () => {
    const ok = window.confirm('Sincronizar campanha, templates e fluxo padrao? Itens existentes serao atualizados de forma idempotente.');
    if (!ok) return;
    setSyncing(true);
    setError(null);
    try {
      await portalApi.bootstrapReactivationEmailAdmin();
      await load();
    } catch (err) {
      setError({ tone: 'danger', text: err.message || 'Nao foi possivel sincronizar o fluxo padrao.' });
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return <Notice>Carregando Email Ops com a sessao do admin principal...</Notice>;
  }

  return (
    <div className="space-y-8">
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Admin / Email Ops</p>
            <h1 className="mt-2 text-3xl font-black text-slate-950">Email Ops</h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-600">
              Operacao de reativacao por email com campanhas, templates, acoes manuais, jobs e fluxo visual usando exclusivamente a sessao do admin principal.
            </p>
          </div>
          <button type="button" className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60" onClick={bootstrap} disabled={syncing}>
            {syncing ? 'Sincronizando...' : 'Sincronizar fluxo padrao'}
          </button>
        </div>
        <div className="mt-5 flex flex-wrap gap-2 text-xs font-semibold">
          <a className="rounded-lg border border-slate-200 px-3 py-2 text-slate-700" href="#overview">Visao geral</a>
          <a className="rounded-lg border border-slate-200 px-3 py-2 text-slate-700" href="#content">Conteudo</a>
          <a className="rounded-lg border border-slate-200 px-3 py-2 text-slate-700" href="#operation">Operacao</a>
          <a className="rounded-lg border border-slate-200 px-3 py-2 text-slate-700" href="#infra">Infraestrutura</a>
        </div>
      </div>

      {error ? <Notice tone={error.tone}>{error.text}</Notice> : null}

      <Section id="overview" eyebrow="1. Visao geral" title="Status operacional da regua" description="KPIs principais, campanhas e limites de envio da operacao de reativacao.">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Stat label="Fila" value={dashboard?.leadsInQueue || 0} hint="Leads importados ou visitados" />
          <Stat label="Enviados hoje" value={`${dashboard?.dailyLimitUsed || 0}/${dashboard?.dailyLimit || 0}`} hint={`${dashboard?.dailyLimitRemaining || 0} restantes`} />
          <Stat label="Entregues" value={dashboard?.delivered || 0} hint={`Abertura: ${percent(dashboard?.openRate)}`} tone="success" />
          <Stat label="Cliques" value={dashboard?.clicks || 0} hint={`CTR: ${percent(dashboard?.clickRate)}`} />
          <Stat label="Bounces" value={dashboard?.bounces || 0} hint={`${dashboard?.spamReports || 0} spam reports`} tone={(dashboard?.bounces || 0) > 0 ? 'danger' : 'default'} />
          <Stat label="Opt-outs" value={dashboard?.optOuts || 0} hint="Supressao por evento" />
          <Stat label="Fluxos ativos" value={dashboard?.activeFlows || 0} hint={`${dashboard?.pausedFlows || 0} pausados`} />
          <Stat label="Receita estimada" value={money(dashboard?.estimatedRevenueCents || 0)} hint="Atribuida ao funil atual" />
        </div>
        <div className="mt-6">
          <CampaignsPanel campaigns={campaigns} onRefresh={load} onBootstrap={bootstrap} />
        </div>
      </Section>

      <Section
        id="content"
        eyebrow="2. Conteudo"
        title="Templates e versoes"
        description="Gerencie assunto, preheader, HTML, texto plano, variaveis e estado publicado dos templates."
        action={<button type="button" className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white" onClick={() => setEditingTemplate({})}>Novo template</button>}
      >
        <TemplatesPanel templates={templates} onEdit={setEditingTemplate} onBootstrap={bootstrap} />
        {editingTemplate ? (
          <div className="mt-6">
            <TemplateEditorPanel
              template={editingTemplate}
              onCancel={() => setEditingTemplate(null)}
              onSaved={async (template) => {
                setEditingTemplate(template);
                await load();
              }}
            />
          </div>
        ) : null}
      </Section>

      <Section id="operation" eyebrow="3. Operacao" title="Acoes manuais e timeline do lead" description="Execute intervenções controladas com confirmacao e consulte o historico operacional do lead.">
        <ManualActionsPanel templates={templates} />
        <div className="mt-6 rounded-lg border border-slate-200 p-5">
          <h3 className="font-black text-slate-950">Timeline do lead</h3>
          <p className="mt-1 text-sm text-slate-600">Busca por lead, eventos do provider, mensagens e etapas do fluxo.</p>
          <div className="mt-4">
            <LeadTimelinePanel />
          </div>
        </div>
      </Section>

      <Section id="infra" eyebrow="4. Infraestrutura" title="Jobs, saude do fluxo e construtor visual" description="Acompanhe execucoes recentes e mantenha o fluxo padrao sincronizado, validado e publicado.">
        <JobsPanel runs={dashboard?.recentJobRuns || []} />
        <div className="mt-6">
          <FlowBuilderPanel
            flows={flows}
            selectedFlow={selectedFlow}
            selectedFlowId={selectedFlow?.id || selectedFlowId}
            setSelectedFlowId={setSelectedFlowId}
            onBootstrap={bootstrap}
            onSaved={load}
          />
        </div>
      </Section>
    </div>
  );
}
