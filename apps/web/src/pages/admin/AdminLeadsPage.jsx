import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import AdminPageHeader from '@/admin/AdminPageHeader.jsx';
import { portalApi } from '@/platform/services/portalApi.js';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

const statuses = ['new', 'qualified', 'sent', 'converted', 'archived'];

const formatMoney = (value) => {
  const number = Number(value || 0);
  if (!Number.isFinite(number) || number <= 0) return '-';
  return number.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
};

const emptyFilters = {
  page: 1,
  pageSize: 20,
  search: '',
  from: '',
  to: '',
  sourcePage: 'all',
  productType: 'all',
  status: 'all',
  ownerId: 'all',
  suppressed: 'false'
};

export default function AdminLeadsPage() {
  const [filters, setFilters] = useState(emptyFilters);
  const [dataset, setDataset] = useState({ items: [], meta: { page: 1, pageSize: 20, total: 0, totalPages: 1 }, facets: { tags: [], owners: [] } });
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
      const data = await portalApi.getAdminLeads(filters);
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
  }, [filters.page, filters.pageSize, filters.search, filters.from, filters.to, filters.sourcePage, filters.productType, filters.status, filters.ownerId, filters.suppressed]);

  useEffect(() => {
    if (selectedLeadId) loadLeadDetail(selectedLeadId);
  }, [selectedLeadId]);

  const sourceOptions = useMemo(() => {
    const values = new Set(dataset.items.map((lead) => lead.originPage || lead.sourcePage).filter(Boolean));
    return ['all', ...values];
  }, [dataset.items]);

  const ownerOptions = dataset.facets?.owners || [];

  const runAction = async (label, action) => {
    setBusyAction(label);
    try {
      await action();
      await loadLeads();
      if (selectedLeadId) await loadLeadDetail(selectedLeadId);
    } finally {
      setBusyAction('');
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Gestão de leads"
        description="Painel operacional com filtros, ownership, tags, trilha de roteamento e monetização."
      />

      <Card className="border-slate-200">
        <CardContent className="grid gap-4 pt-6 md:grid-cols-3 xl:grid-cols-6">
          <div className="xl:col-span-2">
            <Label>Buscar</Label>
            <Input
              placeholder="Nome, telefone, parceiro ou origem"
              value={filters.search}
              onChange={(event) => setFilters((current) => ({ ...current, page: 1, search: event.target.value }))}
            />
          </div>
          <div>
            <Label>De</Label>
            <Input type="date" value={filters.from} onChange={(event) => setFilters((current) => ({ ...current, page: 1, from: event.target.value }))} />
          </div>
          <div>
            <Label>Até</Label>
            <Input type="date" value={filters.to} onChange={(event) => setFilters((current) => ({ ...current, page: 1, to: event.target.value }))} />
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
            <Label>Status</Label>
            <Select value={filters.status} onValueChange={(value) => setFilters((current) => ({ ...current, page: 1, status: value }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {statuses.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Origem</Label>
            <Select value={filters.sourcePage} onValueChange={(value) => setFilters((current) => ({ ...current, page: 1, sourcePage: value }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {sourceOptions.map((item) => <SelectItem key={item} value={item}>{item === 'all' ? 'Todas' : item}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Owner</Label>
            <Select value={filters.ownerId} onValueChange={(value) => setFilters((current) => ({ ...current, page: 1, ownerId: value }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {ownerOptions.map((item) => <SelectItem key={item.id} value={item.id}>{item.fullName}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Suprimidos</Label>
            <Select value={filters.suppressed} onValueChange={(value) => setFilters((current) => ({ ...current, page: 1, suppressed: value }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="false">Não</SelectItem>
                <SelectItem value="true">Sim</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <Card className="border-slate-200">
          <CardContent className="pt-6">
            {loading ? <p className="text-sm text-slate-600">Carregando leads...</p> : null}
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Lead</TableHead>
                    <TableHead>Produto</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Parceiro</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Tags</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dataset.items.map((lead) => (
                    <TableRow
                      key={lead.id}
                      className={`cursor-pointer ${selectedLeadId === lead.id ? 'bg-slate-50' : ''}`}
                      onClick={() => setSelectedLeadId(lead.id)}
                    >
                      <TableCell>{lead.createdAt ? new Date(lead.createdAt).toLocaleString('pt-BR') : '-'}</TableCell>
                      <TableCell>
                        <p className="font-semibold text-slate-950">{lead.fullName || 'Lead sem nome'}</p>
                        <p className="text-xs text-slate-500">{lead.phone || '-'}</p>
                      </TableCell>
                      <TableCell>{lead.productType || '-'}</TableCell>
                      <TableCell>{lead.status || '-'}</TableCell>
                      <TableCell>{lead.partnerName || lead.partnerId || '-'}</TableCell>
                      <TableCell>{lead.ownerAssignment?.ownerUser?.fullName || '-'}</TableCell>
                      <TableCell>{(lead.tags || []).map((item) => item.label).join(', ') || '-'}</TableCell>
                    </TableRow>
                  ))}
                  {!loading && dataset.items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-slate-500">Nenhum lead encontrado para os filtros atuais.</TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
              <p>
                Página {dataset.meta?.page || 1} de {dataset.meta?.totalPages || 1} · {dataset.meta?.total || 0} leads
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={(dataset.meta?.page || 1) <= 1}
                  onClick={() => setFilters((current) => ({ ...current, page: Math.max(1, current.page - 1) }))}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={(dataset.meta?.page || 1) >= (dataset.meta?.totalPages || 1)}
                  onClick={() => setFilters((current) => ({ ...current, page: current.page + 1 }))}
                >
                  Próxima
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="space-y-5 pt-6">
            {!selectedLeadId ? <p className="text-sm text-slate-500">Selecione um lead para abrir o detalhe operacional.</p> : null}
            {selectedLeadId && detailLoading ? <p className="text-sm text-slate-600">Carregando detalhe do lead...</p> : null}

            {selectedLead ? (
              <>
                <div className="space-y-1 text-sm text-slate-600">
                  <p className="text-base font-bold text-slate-950">{selectedLead.fullName || 'Lead sem nome'}</p>
                  <p>{selectedLead.phone || '-'}</p>
                  <p><strong>Origem:</strong> {selectedLead.originPage || '-'}</p>
                  <p><strong>Produto:</strong> {selectedLead.productType || '-'}</p>
                  <p><strong>Status:</strong> {selectedLead.status || '-'}</p>
                  <p><strong>Renda:</strong> {formatMoney(selectedLead.income)}</p>
                  <p><strong>Valor solicitado:</strong> {formatMoney(selectedLead.requestedAmount)}</p>
                  <p><strong>Parceiro atual:</strong> {selectedLead.partnerName || selectedLead.partnerId || '-'}</p>
                  <p><strong>Envio:</strong> {selectedLead.deliveryMode || '-'}</p>
                </div>

                <div>
                  <Label>Status operacional</Label>
                  <Select
                    value={selectedLead.status || 'new'}
                    onValueChange={(value) => runAction('status', async () => {
                      await portalApi.updateAdminLeadStatus(selectedLead.id, value);
                      toast.success('Status do lead atualizado.');
                    })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {statuses.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Tags</Label>
                  <Input
                    value={tagInput}
                    onChange={(event) => setTagInput(event.target.value)}
                    placeholder="vip, alto valor, retorno"
                  />
                  <Button
                    type="button"
                    className="mt-2 w-full"
                    variant="outline"
                    disabled={busyAction === 'tags'}
                    onClick={() => runAction('tags', async () => {
                      await portalApi.setAdminLeadTags(selectedLead.id, tagInput.split(',').map((item) => item.trim()).filter(Boolean));
                      toast.success('Tags atualizadas.');
                    })}
                  >
                    {busyAction === 'tags' ? 'Salvando tags...' : 'Salvar tags'}
                  </Button>
                </div>

                <div>
                  <Label>Owner</Label>
                  <Select value={ownerId} onValueChange={setOwnerId}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sem owner</SelectItem>
                      {ownerOptions.map((item) => <SelectItem key={item.id} value={item.id}>{item.fullName}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Textarea
                    className="mt-2"
                    rows={2}
                    value={ownerNote}
                    onChange={(event) => setOwnerNote(event.target.value)}
                    placeholder="Observação da atribuição"
                  />
                  <Button
                    type="button"
                    className="mt-2 w-full"
                    variant="outline"
                    disabled={busyAction === 'owner' || ownerId === 'none'}
                    onClick={() => runAction('owner', async () => {
                      await portalApi.assignAdminLeadOwner(selectedLead.id, ownerId, ownerNote);
                      toast.success('Owner definido.');
                    })}
                  >
                    {busyAction === 'owner' ? 'Salvando owner...' : 'Salvar owner'}
                  </Button>
                </div>

                <div>
                  <Label>Nota operacional</Label>
                  <Textarea
                    rows={3}
                    value={noteBody}
                    onChange={(event) => setNoteBody(event.target.value)}
                    placeholder="Registrar contexto comercial, qualidade do lead ou próxima ação"
                  />
                  <Button
                    type="button"
                    className="mt-2 w-full"
                    variant="outline"
                    disabled={busyAction === 'note' || noteBody.trim().length < 3}
                    onClick={() => runAction('note', async () => {
                      await portalApi.addAdminLeadNote(selectedLead.id, noteBody.trim());
                      setNoteBody('');
                      toast.success('Nota adicionada.');
                    })}
                  >
                    {busyAction === 'note' ? 'Salvando nota...' : 'Adicionar nota'}
                  </Button>
                </div>

                <div className="grid gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={busyAction === 'routing'}
                    onClick={() => runAction('routing', async () => {
                      await portalApi.simulateAdminLeadRouting(selectedLead.id);
                      toast.success('Simulação de roteamento registrada.');
                    })}
                  >
                    {busyAction === 'routing' ? 'Simulando...' : 'Simular roteamento'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={busyAction === 'suppress'}
                    onClick={() => runAction('suppress', async () => {
                      await portalApi.suppressAdminLead(selectedLead.id, 'manual', 'Supressão manual via admin');
                      toast.success('Lead suprimido.');
                    })}
                  >
                    {busyAction === 'suppress' ? 'Suprimindo...' : 'Suprimir lead'}
                  </Button>
                </div>

                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-slate-950">Timeline operacional</h3>
                  <div className="max-h-[180px] space-y-3 overflow-auto rounded-lg border border-slate-200 p-3">
                    {(selectedLead.notes || []).map((note) => (
                      <div key={note.id} className="rounded-lg bg-slate-50 p-3 text-sm">
                        <p className="font-semibold text-slate-900">{note.authorUser?.fullName || note.authorUser?.email || 'Sistema'}</p>
                        <p className="mt-1 text-slate-700">{note.body}</p>
                        <p className="mt-2 text-xs text-slate-500">{new Date(note.createdAt).toLocaleString('pt-BR')}</p>
                      </div>
                    ))}
                    {(selectedLead.notes || []).length === 0 ? <p className="text-sm text-slate-500">Sem notas registradas ainda.</p> : null}
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-slate-950">Roteamento e score</h3>
                  <div className="space-y-2 rounded-lg border border-slate-200 p-3 text-sm text-slate-700">
                    <p><strong>Última decisão:</strong> {selectedLead.routingDecisions?.[0]?.partnerName || '-'}</p>
                    <p><strong>Regra aplicada:</strong> {selectedLead.routingDecisions?.[0]?.ruleMatched || '-'}</p>
                    <p><strong>Score:</strong> {selectedLead.scoreSnapshots?.[0]?.scoreValue ?? '-'}</p>
                    <p><strong>Faixa:</strong> {selectedLead.routingDecisions?.[0]?.scoreBand || '-'}</p>
                    <p><strong>Receita estimada:</strong> {formatMoney(selectedLead.revenueEvents?.[0]?.estimatedCents)}</p>
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
