import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import AdminPageHeader from '@/admin/AdminPageHeader.jsx';
import { getLeadStatusLabel, getProductTypeLabel } from '@/admin/adminLabels.js';
import { portalApi } from '@/platform/services/portalApi.js';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

const statuses = ['new', 'qualified', 'sent', 'converted', 'archived'];
const DEFAULT_DATASET = {
  items: [],
  meta: { page: 1, pageSize: 20, total: 0, totalPages: 1 },
  facets: { tags: [], owners: [] }
};

const queueStages = [
  { id: 'all', label: 'Todos', status: 'all' },
  { id: 'new', label: 'Leads novos', status: 'new' },
  { id: 'analysis', label: 'Em análise', status: 'qualified' },
  { id: 'waiting', label: 'Aguardando retorno', status: 'all', virtual: true },
  { id: 'sent', label: 'Encaminhados', status: 'sent' },
  { id: 'converted', label: 'Convertidos', status: 'converted' },
  { id: 'archived', label: 'Arquivados', status: 'archived' }
];

const emptyFilters = {
  page: 1,
  pageSize: 20,
  search: '',
  from: '',
  to: '',
  productType: 'all',
  status: 'all',
  ownerId: 'all',
  suppressed: 'false'
};

const formatMoney = (value) => {
  const number = Number(value || 0);
  if (!Number.isFinite(number) || number <= 0) return '-';
  return number.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const formatMissing = (value, fallback) => value === '-' || !value ? fallback : value;

const getProductLabel = (value) => {
  const label = getProductTypeLabel(value);
  return label === '-' ? 'Produto não informado' : label;
};

const getLeadDate = (lead) => {
  const date = new Date(lead?.updatedAt || lead?.createdAt || '');
  return Number.isFinite(date.getTime()) ? date : null;
};

const getAgeInHours = (lead) => {
  const date = getLeadDate(lead);
  if (!date) return 0;
  return Math.max(0, Math.floor((Date.now() - date.getTime()) / 36e5));
};

const formatStoppedTime = (lead) => {
  if (!getLeadDate(lead)) return 'Sem data';
  const hours = getAgeInHours(lead);
  if (hours < 1) return 'Agora';
  if (hours < 24) return `${hours}h parado`;
  const days = Math.floor(hours / 24);
  return `${days}d parado`;
};

const isToday = (value) => {
  if (!value) return false;
  const date = new Date(value);
  const now = new Date();
  return date.toDateString() === now.toDateString();
};

const formatDateTime = (value) => {
  const date = new Date(value || '');
  if (!Number.isFinite(date.getTime())) return 'Data não informada';
  return date.toLocaleString('pt-BR');
};

const normalizeDataset = (data) => {
  const items = Array.isArray(data?.items) ? data.items : [];
  return {
    items,
    meta: {
      ...DEFAULT_DATASET.meta,
      ...(data?.meta || {}),
      total: data?.meta?.total ?? items.length
    },
    facets: {
      ...DEFAULT_DATASET.facets,
      ...(data?.facets || {}),
      owners: Array.isArray(data?.facets?.owners) ? data.facets.owners : [],
      tags: Array.isArray(data?.facets?.tags) ? data.facets.tags : []
    }
  };
};

const isLocalWorkspace = () => {
  const base = portalApi.getApiBaseUrl?.();
  return base === 'origem atual' && typeof window !== 'undefined' && /localhost|127\.0\.0\.1/i.test(window.location.hostname);
};

const hasOwner = (lead) => Boolean(lead?.ownerAssignment?.ownerUser?.fullName);

const isWaitingLead = (lead) => ['sent', 'qualified'].includes(lead?.status) && getAgeInHours(lead) >= 24;

const getPriority = (lead) => {
  const badges = [];
  if (lead?.status === 'new') badges.push({ label: 'Novo', tone: 'bg-blue-50 text-blue-700 border-blue-100' });
  if (!hasOwner(lead)) badges.push({ label: 'Sem responsável', tone: 'bg-amber-50 text-amber-700 border-amber-100' });
  if (isWaitingLead(lead)) badges.push({ label: 'Atrasado', tone: 'bg-red-50 text-red-700 border-red-100' });
  if (Number(lead?.requestedAmount || 0) >= 10000) badges.push({ label: 'Valor alto', tone: 'bg-violet-50 text-violet-700 border-violet-100' });
  if (lead?.status === 'qualified') badges.push({ label: 'Aguardando cliente', tone: 'bg-slate-50 text-slate-700 border-slate-200' });
  return badges.slice(0, 3);
};

const getNextAction = (lead) => {
  if (!lead) return 'Selecione um lead para começar.';
  if (!hasOwner(lead)) return 'Atribuir responsável para iniciar acompanhamento.';
  if (lead.status === 'new') return 'Qualificar informações e definir caminho de crédito.';
  if (lead.status === 'qualified') return 'Registrar contato e decidir encaminhamento.';
  if (lead.status === 'sent') return 'Acompanhar retorno do parceiro ou cliente.';
  if (lead.status === 'converted') return 'Validar conversão e manter histórico atualizado.';
  return 'Arquivado. Reabrir apenas se houver novo contexto.';
};

function QueueMetric({ label, value, hint }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-slate-950">{value}</p>
      {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}

function PriorityBadges({ lead }) {
  const badges = getPriority(lead);
  if (!badges.length) return <span className="rounded-full border border-emerald-100 bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">Em dia</span>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {badges.map((badge) => (
        <span key={badge.label} className={`rounded-full border px-2 py-1 text-xs font-semibold ${badge.tone}`}>
          {badge.label}
        </span>
      ))}
    </div>
  );
}

export default function AdminLeadsPage() {
  const [filters, setFilters] = useState(emptyFilters);
  const [activeQueue, setActiveQueue] = useState('all');
  const [dataset, setDataset] = useState(DEFAULT_DATASET);
  const [selectedLeadId, setSelectedLeadId] = useState('');
  const [selectedLead, setSelectedLead] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [noteBody, setNoteBody] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [ownerId, setOwnerId] = useState('none');
  const [ownerNote, setOwnerNote] = useState('');
  const [busyAction, setBusyAction] = useState('');

  const loadLeads = async () => {
    setLoading(true);
    try {
      const data = normalizeDataset(await portalApi.getAdminLeads(filters));
      setDataset(data);

      const selectedStillVisible = data.items.find((item) => item.id === selectedLeadId);
      if (!selectedLeadId && data.items[0]?.id) {
        setSelectedLeadId(data.items[0].id);
      } else if (!selectedStillVisible && selectedLeadId) {
        setSelectedLeadId('');
        setSelectedLead(null);
      }
    } catch (error) {
      toast.error(error.message || 'Não foi possível carregar os leads.');
    } finally {
      setLoading(false);
    }
  };

  const loadLeadDetail = async (leadId) => {
    if (!leadId) {
      setSelectedLead(null);
      return;
    }

    setDetailLoading(true);
    try {
      const data = await portalApi.getAdminLead(leadId);
      if (!data) {
        setSelectedLead(null);
        toast.error('Não foi possível abrir este lead.');
        return;
      }
      setSelectedLead(data);
      setTagInput((data.tags || []).map((item) => item.label).join(', '));
      setOwnerId(data.ownerAssignment?.ownerUser?.id || 'none');
      setOwnerNote(data.ownerAssignment?.note || '');
    } catch (error) {
      toast.error(error.message || 'Não foi possível carregar o detalhe do lead.');
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    loadLeads();
  }, [filters.page, filters.pageSize, filters.search, filters.from, filters.to, filters.productType, filters.status, filters.ownerId, filters.suppressed]);

  useEffect(() => {
    if (selectedLeadId) loadLeadDetail(selectedLeadId);
  }, [selectedLeadId]);

  const ownerOptions = dataset.facets?.owners || [];

  const visibleItems = useMemo(() => {
    if (activeQueue === 'waiting') return dataset.items.filter(isWaitingLead);
    return dataset.items;
  }, [dataset.items, activeQueue]);

  const metrics = useMemo(() => {
    const items = dataset.items || [];
    const withoutOwner = items.filter((lead) => !hasOwner(lead)).length;
    const newToday = items.filter((lead) => isToday(lead.createdAt)).length;
    const needsAction = items.filter((lead) => !hasOwner(lead) || isWaitingLead(lead) || lead.status === 'new').length;
    const oldestWaiting = items
      .filter(isWaitingLead)
      .sort((a, b) => (getLeadDate(a)?.getTime() || 0) - (getLeadDate(b)?.getTime() || 0))[0];
    return {
      withoutOwner,
      newToday,
      needsAction,
      oldestWaiting: oldestWaiting ? formatStoppedTime(oldestWaiting) : '-'
    };
  }, [dataset.items]);

  const runAction = async (label, action) => {
    setBusyAction(label);
    try {
      await action();
      await loadLeads();
      if (selectedLeadId) await loadLeadDetail(selectedLeadId);
    } catch (error) {
      toast.error(error.message || 'Não foi possível salvar esta mudança.');
    } finally {
      setBusyAction('');
    }
  };

  const setQueue = (stage) => {
    setActiveQueue(stage.id);
    setFilters((current) => ({
      ...current,
      page: 1,
      status: stage.status
    }));
  };

  const saveLeadStatus = async (leadId, status, successMessage = '') => {
    await portalApi.updateAdminLeadStatus(leadId, status);
    const persistedLead = await portalApi.getAdminLead(leadId);
    if (persistedLead?.status !== status) {
      throw new Error('O status não foi confirmado no servidor. A tela foi recarregada sem tratar a mudança como concluída.');
    }
    if (successMessage) toast.success(successMessage);
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Fila de leads"
        description="Acompanhe prioridades, responsáveis, próximos passos e evolução comercial dos leads."
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <QueueMetric label="Sem responsável" value={metrics.withoutOwner} hint="Precisam de dono" />
        <QueueMetric label="Novos hoje" value={metrics.newToday} hint="Entradas recentes" />
        <QueueMetric label="Precisam ação" value={metrics.needsAction} hint="Novo, atrasado ou sem dono" />
        <QueueMetric label="Mais tempo parado" value={metrics.oldestWaiting} hint="Aguardando retorno" />
      </div>

      <Card className="border-slate-200">
        <CardContent className="space-y-4 pt-6">
          {isLocalWorkspace() ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              Ambiente local: a tela só confirma mudanças quando o servidor responde. Se uma ação não gravar, ela mostra erro e não trata como concluída.
            </div>
          ) : null}

          <div className="flex gap-2 overflow-x-auto pb-1">
            {queueStages.map((stage) => (
              <button
                key={stage.id}
                type="button"
                onClick={() => setQueue(stage)}
                className={`shrink-0 rounded-full border px-3 py-2 text-sm font-semibold transition-colors ${
                  activeQueue === stage.id ? 'border-slate-950 bg-slate-950 text-white' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                {stage.label}
              </button>
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <div className="xl:col-span-2">
              <Label>Buscar</Label>
              <Input
                placeholder="Nome, telefone ou parceiro"
                value={filters.search}
                onChange={(event) => setFilters((current) => ({ ...current, page: 1, search: event.target.value }))}
              />
            </div>
            <div>
              <Label>Produto</Label>
              <Select value={filters.productType} onValueChange={(value) => setFilters((current) => ({ ...current, page: 1, productType: value }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="loan">Empréstimo</SelectItem>
                  <SelectItem value="credit_card">Cartão de crédito</SelectItem>
                  <SelectItem value="financing">Financiamento</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Responsável</Label>
              <Select value={filters.ownerId} onValueChange={(value) => setFilters((current) => ({ ...current, page: 1, ownerId: value }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {ownerOptions.map((item) => <SelectItem key={item.id} value={item.id}>{item.fullName}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Período</Label>
              <Input type="date" value={filters.from} onChange={(event) => setFilters((current) => ({ ...current, page: 1, from: event.target.value }))} />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.95fr]">
        <Card className="border-slate-200">
          <CardContent className="pt-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-950">Fila operacional</h2>
                <p className="text-sm text-slate-500">{visibleItems.length} leads nesta visão</p>
              </div>
              {loading ? <p className="text-sm text-slate-600">Carregando leads...</p> : null}
            </div>

            <div className="space-y-3">
              {visibleItems.map((lead) => (
                <button
                  type="button"
                  key={lead.id}
                  className={`w-full rounded-xl border p-4 text-left transition-colors ${
                    selectedLeadId === lead.id ? 'border-slate-950 bg-slate-50' : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                  onClick={() => setSelectedLeadId(lead.id)}
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-bold text-slate-950">{lead.fullName || 'Lead sem nome'}</p>
                        <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">{getLeadStatusLabel(lead.status)}</span>
                      </div>
                      <p className="mt-1 text-sm text-slate-600">{formatMissing(formatMoney(lead.requestedAmount), 'Valor não informado')} · {getProductLabel(lead.productType)}</p>
                      <p className="mt-1 text-xs text-slate-500">Responsável: {lead.ownerAssignment?.ownerUser?.fullName || 'Sem responsável'}</p>
                    </div>
                    <div className="flex flex-col gap-2 md:items-end">
                      <PriorityBadges lead={lead} />
                      <p className="text-xs font-semibold text-slate-500">{formatStoppedTime(lead)}</p>
                    </div>
                  </div>
                </button>
              ))}

              {!loading && visibleItems.length === 0 ? (
                <p className="rounded-lg border border-dashed border-slate-300 p-6 text-sm text-slate-500">Nenhum lead encontrado nesta fila.</p>
              ) : null}
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
              <p>Página {dataset.meta?.page || 1} de {dataset.meta?.totalPages || 1} · {dataset.meta?.total || 0} leads</p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled={(dataset.meta?.page || 1) <= 1} onClick={() => setFilters((current) => ({ ...current, page: Math.max(1, current.page - 1) }))}>Anterior</Button>
                <Button variant="outline" size="sm" disabled={(dataset.meta?.page || 1) >= (dataset.meta?.totalPages || 1)} onClick={() => setFilters((current) => ({ ...current, page: current.page + 1 }))}>Próxima</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="space-y-5 pt-6">
            {!selectedLeadId ? <p className="text-sm text-slate-500">Selecione um lead para abrir o acompanhamento.</p> : null}
            {selectedLeadId && detailLoading ? <p className="text-sm text-slate-600">Carregando acompanhamento...</p> : null}

            {selectedLead ? (
              <>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-bold text-slate-950">{selectedLead.fullName || 'Lead sem nome'}</p>
                      <p className="text-sm text-slate-600">{selectedLead.phone || 'Telefone não informado'}</p>
                    </div>
                    <PriorityBadges lead={selectedLead} />
                  </div>
                  <div className="mt-4 grid gap-3 text-sm text-slate-700 sm:grid-cols-2">
                    <p><strong>Valor:</strong> {formatMissing(formatMoney(selectedLead.requestedAmount), 'Valor não informado')}</p>
                    <p><strong>Produto:</strong> {getProductLabel(selectedLead.productType)}</p>
                    <p><strong>Status:</strong> {getLeadStatusLabel(selectedLead.status)}</p>
                    <p><strong>Responsável:</strong> {selectedLead.ownerAssignment?.ownerUser?.fullName || 'Sem responsável'}</p>
                    <p><strong>Parceiro sugerido:</strong> {selectedLead.partnerName || 'Sem parceiro sugerido'}</p>
                    <p><strong>Tempo parado:</strong> {formatStoppedTime(selectedLead)}</p>
                  </div>
                </div>

                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-amber-700">Próxima ação</p>
                  <p className="mt-1 text-sm font-semibold text-amber-950">{getNextAction(selectedLead)}</p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label>Status atual</Label>
                    <Select
                      value={selectedLead.status || 'new'}
                      disabled={Boolean(busyAction)}
                      onValueChange={(value) => runAction('status', async () => {
                        await saveLeadStatus(selectedLead.id, value, 'Status do lead atualizado.');
                      })}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{statuses.map((status) => <SelectItem key={status} value={status}>{getLeadStatusLabel(status)}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Responsável</Label>
                    <Select value={ownerId} onValueChange={setOwnerId} disabled={Boolean(busyAction)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sem responsável</SelectItem>
                        {ownerOptions.map((item) => <SelectItem key={item.id} value={item.id}>{item.fullName}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Textarea rows={2} value={ownerNote} onChange={(event) => setOwnerNote(event.target.value)} placeholder="Contexto para atribuição ou acompanhamento" />
                <Button
                  type="button"
                  className="w-full"
                  variant="outline"
                  disabled={busyAction === 'owner' || ownerId === 'none'}
                  onClick={() => runAction('owner', async () => {
                    await portalApi.assignAdminLeadOwner(selectedLead.id, ownerId, ownerNote);
                    toast.success('Responsável definido.');
                  })}
                >
                  {busyAction === 'owner' ? 'Salvando responsável...' : 'Atribuir responsável'}
                </Button>

                <div>
                  <Label>Observação</Label>
                  <Textarea rows={3} value={noteBody} onChange={(event) => setNoteBody(event.target.value)} placeholder="Registrar contato, objeção, retorno ou próxima ação" />
                  <Button
                    type="button"
                    className="mt-2 w-full"
                    variant="outline"
                    disabled={busyAction === 'note' || noteBody.trim().length < 3}
                    onClick={() => runAction('note', async () => {
                      await portalApi.addAdminLeadNote(selectedLead.id, noteBody.trim());
                      setNoteBody('');
                      toast.success('Observação adicionada.');
                    })}
                  >
                    {busyAction === 'note' ? 'Salvando observação...' : 'Adicionar observação'}
                  </Button>
                </div>

                <div>
                  <Label>Marcadores</Label>
                  <Input value={tagInput} onChange={(event) => setTagInput(event.target.value)} placeholder="alto valor, retorno, prioridade" />
                  <Button
                    type="button"
                    className="mt-2 w-full"
                    variant="outline"
                    disabled={busyAction === 'tags'}
                    onClick={() => runAction('tags', async () => {
                      await portalApi.setAdminLeadTags(selectedLead.id, tagInput.split(',').map((item) => item.trim()).filter(Boolean));
                      toast.success('Marcadores atualizados.');
                    })}
                  >
                    {busyAction === 'tags' ? 'Salvando marcadores...' : 'Salvar marcadores'}
                  </Button>
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                  <Button type="button" variant="outline" disabled={busyAction === 'followup'} onClick={() => runAction('followup', async () => {
                    await saveLeadStatus(selectedLead.id, 'qualified');
                    await portalApi.addAdminLeadNote(selectedLead.id, 'Acompanhamento marcado pelo operador.');
                    toast.success('Acompanhamento marcado.');
                  })}>
                    Marcar acompanhamento
                  </Button>
                  <Button type="button" variant="outline" disabled={busyAction === 'archive'} onClick={() => runAction('archive', async () => {
                    await saveLeadStatus(selectedLead.id, 'archived', 'Lead arquivado.');
                  })}>
                    Arquivar
                  </Button>
                </div>

                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-slate-950">Histórico</h3>
                  <div className="max-h-[220px] space-y-3 overflow-auto rounded-lg border border-slate-200 p-3">
                    {(selectedLead.notes || []).map((note) => (
                      <div key={note.id} className="rounded-lg bg-slate-50 p-3 text-sm">
                        <p className="font-semibold text-slate-900">{note.authorUser?.fullName || note.authorUser?.email || 'Sistema'}</p>
                        <p className="mt-1 text-slate-700">{note.body}</p>
                        <p className="mt-2 text-xs text-slate-500">{formatDateTime(note.createdAt)}</p>
                      </div>
                    ))}
                    {(selectedLead.notes || []).length === 0 ? <p className="text-sm text-slate-500">Sem observações registradas ainda.</p> : null}
                  </div>
                </div>
              </>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
