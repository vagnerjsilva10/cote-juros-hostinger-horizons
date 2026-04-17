import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import AdminPageHeader from '@/admin/AdminPageHeader.jsx';
import { portalApi } from '@/platform/services/portalApi.js';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';

const emptyForm = {
  id: '',
  name: '',
  slug: '',
  bankId: '',
  integrationType: 'tracking_link',
  trackingLink: '',
  webhookUrl: '',
  apiBaseUrl: '',
  productTypes: ['loan'],
  status: 'active',
  priority: 50,
  weight: 1,
  fallbackPartnerId: '',
  dailyLimit: '',
  monthlyLimit: '',
  slaMinutes: '',
  payoutLeadCents: '',
  payoutConversionCents: '',
  internalNotes: '',
  metadataText: '{}'
};

const healthTone = {
  healthy: 'text-emerald-700 bg-emerald-50',
  warning: 'text-amber-700 bg-amber-50',
  error: 'text-red-700 bg-red-50',
  unknown: 'text-slate-600 bg-slate-100'
};

const integrationLabels = {
  tracking_link: 'Tracking link',
  webhook: 'Webhook',
  api: 'API',
  manual: 'Manual'
};

const productLabels = {
  loan: 'Empréstimo',
  credit_card: 'Cartão',
  financing: 'Financiamento'
};

const formatMoney = (cents) =>
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

const normalizePartnerToForm = (partner) => ({
  ...emptyForm,
  ...partner,
  bankId: partner.bankId || '',
  fallbackPartnerId: partner.fallbackPartnerId || '',
  dailyLimit: partner.dailyLimit ?? '',
  monthlyLimit: partner.monthlyLimit ?? '',
  slaMinutes: partner.slaMinutes ?? '',
  payoutLeadCents: partner.payoutLeadCents ?? '',
  payoutConversionCents: partner.payoutConversionCents ?? '',
  productTypes: Array.isArray(partner.productTypes) ? partner.productTypes : [],
  metadataText: partner.metadata ? JSON.stringify(partner.metadata, null, 2) : '{}'
});

export default function AdminPartnersPage() {
  const [partners, setPartners] = useState([]);
  const [banks, setBanks] = useState([]);
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    healthStatus: 'all',
    integrationType: 'all'
  });
  const [editing, setEditing] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingId, setTestingId] = useState('');

  const selectedPartner = useMemo(
    () => partners.find((partner) => partner.id === editing.id) || null,
    [partners, editing.id]
  );

  const fallbackOptions = useMemo(
    () => partners.filter((partner) => partner.id !== editing.id),
    [partners, editing.id]
  );

  const metrics = useMemo(() => {
    const healthy = partners.filter((partner) => partner.healthStatus === 'healthy').length;
    const warning = partners.filter((partner) => partner.healthStatus === 'warning').length;
    const error = partners.filter((partner) => partner.healthStatus === 'error').length;
    const active = partners.filter((partner) => partner.status === 'active').length;

    return {
      total: partners.length,
      active,
      healthy,
      warning,
      error,
      projectedLeadRevenueCents: partners.reduce((sum, partner) => sum + Number(partner.payoutLeadCents || 0), 0)
    };
  }, [partners]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [partnerData, bankData] = await Promise.all([
        portalApi.getAdminPartners(filters),
        portalApi.getAdminBanks({ status: 'all' })
      ]);
      setPartners(partnerData || []);
      setBanks(bankData || []);
    } catch (error) {
      toast.error(error.message || 'Não foi possível carregar os parceiros.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filters.search, filters.status, filters.healthStatus, filters.integrationType]);

  const handleSave = async (event) => {
    event.preventDefault();
    setSaving(true);

    try {
      let metadata = null;
      if (editing.metadataText?.trim()) {
        metadata = JSON.parse(editing.metadataText);
      }

      await portalApi.saveAdminPartner({
        ...editing,
        productTypes: editing.productTypes,
        metadata,
        priority: Number(editing.priority || 0),
        weight: Number(editing.weight || 0),
        dailyLimit: editing.dailyLimit === '' ? null : Number(editing.dailyLimit),
        monthlyLimit: editing.monthlyLimit === '' ? null : Number(editing.monthlyLimit),
        slaMinutes: editing.slaMinutes === '' ? null : Number(editing.slaMinutes),
        payoutLeadCents: editing.payoutLeadCents === '' ? null : Number(editing.payoutLeadCents),
        payoutConversionCents: editing.payoutConversionCents === '' ? null : Number(editing.payoutConversionCents),
        fallbackPartnerId: editing.fallbackPartnerId || null
      });

      toast.success('Parceiro salvo com sucesso.');
      setEditing(emptyForm);
      await loadData();
    } catch (error) {
      if (error instanceof SyntaxError) {
        toast.error('O campo de metadata precisa ser um JSON válido.');
      } else {
        toast.error(error.message || 'Não foi possível salvar o parceiro.');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (partner) => {
    const nextAction = partner.status === 'inactive' ? 'ativar' : 'desativar';
    if (!window.confirm(`Deseja ${nextAction} o parceiro ${partner.name}?`)) return;

    try {
      await portalApi.toggleAdminPartnerStatus(partner.id);
      toast.success('Status atualizado.');
      await loadData();
    } catch (error) {
      toast.error(error.message || 'Não foi possível atualizar o status.');
    }
  };

  const handleTest = async (partnerId) => {
    setTestingId(partnerId);
    try {
      const result = await portalApi.testAdminPartner(partnerId);
      toast.success(result?.result?.message || 'Teste operacional concluído.');
      await loadData();
      if (editing.id === partnerId) {
        const refreshed = (await portalApi.getAdminPartners({ search: '', status: 'all', healthStatus: 'all', integrationType: 'all' }))
          .find((partner) => partner.id === partnerId);
        if (refreshed) setEditing(normalizePartnerToForm(refreshed));
      }
    } catch (error) {
      toast.error(error.message || 'Não foi possível testar a integração do parceiro.');
    } finally {
      setTestingId('');
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Gestão de parceiros"
        description="Operação comercial de distribuição: integração, prioridade, peso, fallback, limites, payout e saúde."
        actionLabel="Novo parceiro"
        onAction={() => setEditing(emptyForm)}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard label="Parceiros" value={metrics.total} hint={`${metrics.active} ativos no momento`} />
        <MetricCard label="Saudáveis" value={metrics.healthy} hint={`${metrics.warning} em atenção · ${metrics.error} com erro`} />
        <MetricCard label="Payout estimado/lead" value={formatMoney(metrics.projectedLeadRevenueCents)} hint="Soma das regras ativas carregadas na tela" />
        <MetricCard label="Webhook/API" value={partners.filter((item) => ['webhook', 'api'].includes(item.integrationType)).length} hint="Parceiros com integração mais sensível" />
        <MetricCard label="Fallbacks" value={partners.filter((item) => item.fallbackPartnerId).length} hint="Parceiros com rota de contingência" />
      </div>

      <Card className="border-slate-200">
        <CardContent className="grid gap-4 pt-6 md:grid-cols-2 xl:grid-cols-4">
          <Input
            placeholder="Buscar parceiro, slug ou observação"
            value={filters.search}
            onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
          />
          <Select value={filters.status} onValueChange={(value) => setFilters((prev) => ({ ...prev, status: value }))}>
            <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="active">Ativo</SelectItem>
              <SelectItem value="inactive">Inativo</SelectItem>
              <SelectItem value="archived">Arquivado</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filters.healthStatus} onValueChange={(value) => setFilters((prev) => ({ ...prev, healthStatus: value }))}>
            <SelectTrigger><SelectValue placeholder="Saúde" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toda a saúde</SelectItem>
              <SelectItem value="healthy">Saudável</SelectItem>
              <SelectItem value="warning">Atenção</SelectItem>
              <SelectItem value="error">Erro</SelectItem>
              <SelectItem value="unknown">Desconhecido</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filters.integrationType} onValueChange={(value) => setFilters((prev) => ({ ...prev, integrationType: value }))}>
            <SelectTrigger><SelectValue placeholder="Integração" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as integrações</SelectItem>
              <SelectItem value="tracking_link">Tracking link</SelectItem>
              <SelectItem value="webhook">Webhook</SelectItem>
              <SelectItem value="api">API</SelectItem>
              <SelectItem value="manual">Manual</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.65fr_1fr]">
        <div className="space-y-6">
          <Card className="border-slate-200">
            <CardContent className="pt-6">
              {loading ? <p className="text-sm text-slate-600">Carregando parceiros...</p> : null}

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Parceiro</TableHead>
                    <TableHead>Banco</TableHead>
                    <TableHead>Integração</TableHead>
                    <TableHead>Saúde</TableHead>
                    <TableHead>Capacidade</TableHead>
                    <TableHead>Payout</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {partners.map((partner) => (
                    <TableRow key={partner.id}>
                      <TableCell>
                        <button
                          type="button"
                          className="text-left"
                          onClick={() => setEditing(normalizePartnerToForm(partner))}
                        >
                          <p className="font-medium text-slate-950">{partner.name}</p>
                          <p className="text-xs text-slate-500">{partner.slug}</p>
                          <p className="text-xs text-slate-400">
                            Prioridade {partner.priority} · Peso {partner.weight}
                          </p>
                        </button>
                      </TableCell>
                      <TableCell>{partner.bankName || '-'}</TableCell>
                      <TableCell>
                        <p>{integrationLabels[partner.integrationType] || partner.integrationType}</p>
                        <p className="text-xs text-slate-500">
                          {(partner.productTypes || []).map((item) => productLabels[item] || item).join(', ') || 'Sem produtos'}
                        </p>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${healthTone[partner.healthStatus] || healthTone.unknown}`}>
                          {partner.healthStatus || 'unknown'}
                        </span>
                        {partner.lastHealthCheckAt ? (
                          <p className="mt-2 text-xs text-slate-500">
                            {new Date(partner.lastHealthCheckAt).toLocaleString('pt-BR')}
                          </p>
                        ) : null}
                      </TableCell>
                      <TableCell className="text-sm text-slate-600">
                        <p>Dia: {partner.dailyLimit ?? '-'}</p>
                        <p>Mês: {partner.monthlyLimit ?? '-'}</p>
                        <p>SLA: {partner.slaMinutes ?? '-'} min</p>
                      </TableCell>
                      <TableCell className="text-sm text-slate-600">
                        <p>Lead: {partner.payoutLeadCents != null ? formatMoney(partner.payoutLeadCents) : '-'}</p>
                        <p>Conversão: {partner.payoutConversionCents != null ? formatMoney(partner.payoutConversionCents) : '-'}</p>
                      </TableCell>
                      <TableCell className="space-x-2">
                        <Button variant="outline" size="sm" onClick={() => setEditing(normalizePartnerToForm(partner))}>
                          Editar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={testingId === partner.id}
                          onClick={() => handleTest(partner.id)}
                        >
                          {testingId === partner.id ? 'Testando...' : 'Testar'}
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleToggleStatus(partner)}>
                          {partner.status === 'inactive' ? 'Ativar' : 'Desativar'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!loading && partners.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-slate-500">Nenhum parceiro encontrado.</TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardContent className="pt-6">
              <h2 className="text-base font-bold text-slate-950">Leitura operacional</h2>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div className="rounded-lg border border-slate-200 p-4">
                  <p className="text-sm font-medium text-slate-950">Prioridade e peso</p>
                  <p className="mt-2 text-sm text-slate-600">
                    Prioridade define preferência bruta. Peso ajuda a calibrar distribuição quando vários parceiros competem na mesma faixa.
                  </p>
                </div>
                <div className="rounded-lg border border-slate-200 p-4">
                  <p className="text-sm font-medium text-slate-950">Fallback</p>
                  <p className="mt-2 text-sm text-slate-600">
                    Configure fallback para parceiro reserva quando o principal estiver indisponível ou estourar limite operacional.
                  </p>
                </div>
                <div className="rounded-lg border border-slate-200 p-4">
                  <p className="text-sm font-medium text-slate-950">Teste de integração</p>
                  <p className="mt-2 text-sm text-slate-600">
                    O teste atual valida configuração mínima, grava check no banco e já ajuda a identificar webhook/API sem destino.
                  </p>
                </div>
                <div className="rounded-lg border border-slate-200 p-4">
                  <p className="text-sm font-medium text-slate-950">Payout</p>
                  <p className="mt-2 text-sm text-slate-600">
                    Deixe payout por lead e por conversão preenchidos para alimentar receita estimada, comparação e decisões comerciais.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-slate-200">
          <CardContent className="pt-6">
            <form className="space-y-4" onSubmit={handleSave}>
              <div>
                <h2 className="text-base font-bold text-slate-950">
                  {editing.id ? 'Editar parceiro' : 'Novo parceiro'}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Centralize regras comerciais, capacidade e integração em um só lugar.
                </p>
              </div>

              {selectedPartner ? (
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-medium text-slate-950">{selectedPartner.name}</span>
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${healthTone[selectedPartner.healthStatus] || healthTone.unknown}`}>
                      {selectedPartner.healthStatus || 'unknown'}
                    </span>
                  </div>
                  {selectedPartner.lastErrorMessage ? (
                    <p className="mt-3 text-xs text-red-700">{selectedPartner.lastErrorMessage}</p>
                  ) : (
                    <p className="mt-3 text-xs text-slate-500">
                      Último check: {selectedPartner.lastHealthCheckAt ? new Date(selectedPartner.lastHealthCheckAt).toLocaleString('pt-BR') : 'ainda não testado'}
                    </p>
                  )}
                </div>
              ) : null}

              <div>
                <Label>Nome</Label>
                <Input value={editing.name} onChange={(e) => setEditing((prev) => ({ ...prev, name: e.target.value }))} required />
              </div>

              <div>
                <Label>Slug</Label>
                <Input
                  value={editing.slug}
                  onChange={(e) => setEditing((prev) => ({ ...prev, slug: e.target.value }))}
                  placeholder="gerado automaticamente se vazio"
                />
              </div>

              <div>
                <Label>Banco</Label>
                <Select value={editing.bankId || 'none'} onValueChange={(value) => setEditing((prev) => ({ ...prev, bankId: value === 'none' ? '' : value }))}>
                  <SelectTrigger><SelectValue placeholder="Selecione o banco" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem banco vinculado</SelectItem>
                    {banks.map((bank) => <SelectItem key={bank.id} value={bank.id}>{bank.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Tipo de integração</Label>
                <Select value={editing.integrationType} onValueChange={(value) => setEditing((prev) => ({ ...prev, integrationType: value }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tracking_link">Tracking link</SelectItem>
                    <SelectItem value="webhook">Webhook</SelectItem>
                    <SelectItem value="api">API</SelectItem>
                    <SelectItem value="manual">Manual</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div><Label>Tracking link</Label><Input value={editing.trackingLink} onChange={(e) => setEditing((prev) => ({ ...prev, trackingLink: e.target.value }))} /></div>
              <div><Label>Webhook URL</Label><Input value={editing.webhookUrl} onChange={(e) => setEditing((prev) => ({ ...prev, webhookUrl: e.target.value }))} /></div>
              <div><Label>API base URL</Label><Input value={editing.apiBaseUrl} onChange={(e) => setEditing((prev) => ({ ...prev, apiBaseUrl: e.target.value }))} /></div>

              <div>
                <Label>Produtos suportados (csv)</Label>
                <Input
                  value={Array.isArray(editing.productTypes) ? editing.productTypes.join(',') : ''}
                  onChange={(e) => setEditing((prev) => ({
                    ...prev,
                    productTypes: e.target.value.split(',').map((item) => item.trim()).filter(Boolean)
                  }))}
                  placeholder="loan,credit_card,financing"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div><Label>Prioridade</Label><Input type="number" value={editing.priority} onChange={(e) => setEditing((prev) => ({ ...prev, priority: e.target.value }))} /></div>
                <div><Label>Peso</Label><Input type="number" value={editing.weight} onChange={(e) => setEditing((prev) => ({ ...prev, weight: e.target.value }))} /></div>
                <div><Label>Limite diário</Label><Input type="number" value={editing.dailyLimit} onChange={(e) => setEditing((prev) => ({ ...prev, dailyLimit: e.target.value }))} /></div>
                <div><Label>Limite mensal</Label><Input type="number" value={editing.monthlyLimit} onChange={(e) => setEditing((prev) => ({ ...prev, monthlyLimit: e.target.value }))} /></div>
                <div><Label>SLA (min)</Label><Input type="number" value={editing.slaMinutes} onChange={(e) => setEditing((prev) => ({ ...prev, slaMinutes: e.target.value }))} /></div>
                <div>
                  <Label>Status</Label>
                  <Select value={editing.status} onValueChange={(value) => setEditing((prev) => ({ ...prev, status: value }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Ativo</SelectItem>
                      <SelectItem value="inactive">Inativo</SelectItem>
                      <SelectItem value="archived">Arquivado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Payout por lead (centavos)</Label><Input type="number" value={editing.payoutLeadCents} onChange={(e) => setEditing((prev) => ({ ...prev, payoutLeadCents: e.target.value }))} /></div>
                <div><Label>Payout por conversão (centavos)</Label><Input type="number" value={editing.payoutConversionCents} onChange={(e) => setEditing((prev) => ({ ...prev, payoutConversionCents: e.target.value }))} /></div>
              </div>

              <div>
                <Label>Fallback</Label>
                <Select value={editing.fallbackPartnerId || 'none'} onValueChange={(value) => setEditing((prev) => ({ ...prev, fallbackPartnerId: value === 'none' ? '' : value }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem fallback</SelectItem>
                    {fallbackOptions.map((partner) => (
                      <SelectItem key={partner.id} value={partner.id}>{partner.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Observações internas</Label>
                <Textarea value={editing.internalNotes} onChange={(e) => setEditing((prev) => ({ ...prev, internalNotes: e.target.value }))} rows={4} />
              </div>

              <div>
                <Label>Metadata (JSON)</Label>
                <Textarea
                  value={editing.metadataText}
                  onChange={(e) => setEditing((prev) => ({ ...prev, metadataText: e.target.value }))}
                  rows={6}
                  placeholder='{"ownerTeam":"comercial","notes":"preferir horario comercial"}'
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="flex-1" disabled={saving}>
                  {saving ? 'Salvando...' : 'Salvar parceiro'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setEditing(emptyForm)}>
                  Limpar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
