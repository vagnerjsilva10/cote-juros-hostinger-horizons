import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import AdminPageHeader from '@/admin/AdminPageHeader.jsx';
import { getDeliveryModeLabel, getLeadProfileLabel, getLeadStatusLabel, getProductTypeLabel } from '@/admin/adminLabels.js';
import { portalApi } from '@/platform/services/portalApi.js';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';

const statuses = ['new', 'qualified', 'sent', 'converted', 'archived'];

const formatCurrency = (value) => {
  const number = Number(value || 0);
  if (!Number.isFinite(number) || number <= 0) return '-';
  return number.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0
  });
};

export default function AdminLeadsPage() {
  const [leads, setLeads] = useState([]);
  const [selectedLead, setSelectedLead] = useState(null);
  const [filters, setFilters] = useState({ from: '', to: '', sourcePage: 'all', productType: 'all', status: 'all' });

  const loadData = async () => {
    const data = await portalApi.getAdminLeads(filters);
    setLeads(data);
    if (selectedLead) {
      const fresh = data.find((lead) => lead.id === selectedLead.id) || null;
      setSelectedLead(fresh);
    }
  };

  useEffect(() => {
    loadData();
  }, [filters.from, filters.to, filters.sourcePage, filters.productType, filters.status]);

  const sourcePageOptions = useMemo(() => {
    const values = new Set(leads.map((lead) => lead.sourcePage || lead.originPage).filter(Boolean));
    return ['all', ...values];
  }, [leads]);

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Gestao de leads" description="Leads captados, perfil calculado, parceiro roteado e status operacional." />

      <Card className="border-slate-200">
        <CardContent className="grid gap-4 pt-6 md:grid-cols-5">
          <div><Label>De</Label><Input type="date" value={filters.from} onChange={(e) => setFilters((prev) => ({ ...prev, from: e.target.value }))} /></div>
          <div><Label>Ate</Label><Input type="date" value={filters.to} onChange={(e) => setFilters((prev) => ({ ...prev, to: e.target.value }))} /></div>
          <div>
            <Label>Pagina de origem</Label>
            <Select value={filters.sourcePage} onValueChange={(value) => setFilters((prev) => ({ ...prev, sourcePage: value }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {sourcePageOptions.map((item) => <SelectItem key={item} value={item}>{item === 'all' ? 'Todos' : item}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Produto</Label>
            <Select value={filters.productType} onValueChange={(value) => setFilters((prev) => ({ ...prev, productType: value }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="loan">Emprestimo</SelectItem>
                <SelectItem value="credit_card">Cartao de credito</SelectItem>
                <SelectItem value="financing">Financiamento</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Status</Label>
            <Select value={filters.status} onValueChange={(value) => setFilters((prev) => ({ ...prev, status: value }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {statuses.map((status) => <SelectItem key={status} value={status}>{getLeadStatusLabel(status)}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <Card className="border-slate-200">
          <CardContent className="pt-6">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Contato</TableHead>
                    <TableHead>Produto</TableHead>
                    <TableHead>Perfil</TableHead>
                    <TableHead>Parceiro</TableHead>
                    <TableHead>Envio</TableHead>
                    <TableHead>Origem</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leads.map((lead) => (
                    <TableRow key={lead.id} className="cursor-pointer" onClick={() => setSelectedLead(lead)}>
                      <TableCell>{new Date(lead.createdAt).toLocaleString('pt-BR')}</TableCell>
                      <TableCell>
                        <div className="min-w-[130px]">
                          <p className="font-medium text-slate-900">{lead.fullName || lead.name || '-'}</p>
                          <p className="text-xs text-slate-500">{lead.phone || '-'}</p>
                        </div>
                      </TableCell>
                      <TableCell>{getProductTypeLabel(lead.productType)}</TableCell>
                      <TableCell>{getLeadProfileLabel(lead.profile)}</TableCell>
                      <TableCell>{lead.partnerName || lead.partnerId || '-'}</TableCell>
                      <TableCell>{getDeliveryModeLabel(lead.deliveryMode)}</TableCell>
                      <TableCell>{lead.sourcePage || lead.originPage || '-'}</TableCell>
                      <TableCell>{getLeadStatusLabel(lead.status || 'new')}</TableCell>
                    </TableRow>
                  ))}
                  {leads.length === 0 ? (
                    <TableRow><TableCell colSpan={8} className="text-slate-500">Sem leads para os filtros atuais.</TableCell></TableRow>
                  ) : null}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="pt-6">
            {selectedLead ? (
              <div className="space-y-4">
                <h3 className="text-base font-semibold">Detalhes do lead</h3>
                <div className="space-y-1 text-sm text-slate-600">
                  <p><strong>ID:</strong> {selectedLead.id}</p>
                  <p><strong>Origem:</strong> {selectedLead.sourcePage || selectedLead.originPage || '-'}</p>
                  <p><strong>Produto:</strong> {getProductTypeLabel(selectedLead.productType)}</p>
                  <p><strong>Nome:</strong> {selectedLead.fullName || selectedLead.name || '-'}</p>
                  <p><strong>Telefone:</strong> {selectedLead.phone || '-'}</p>
                  <p><strong>Valor:</strong> {formatCurrency(selectedLead.amount || selectedLead.requestedAmount)}</p>
                  <p><strong>Renda:</strong> {formatCurrency(selectedLead.income)}</p>
                  <p><strong>Trabalho:</strong> {selectedLead.employmentType || selectedLead.employmentStatus || '-'}</p>
                  <p><strong>Negativado:</strong> {selectedLead.hasDebt == null ? '-' : selectedLead.hasDebt ? 'Sim' : 'Nao'}</p>
                  <p><strong>Score:</strong> {selectedLead.score || selectedLead.scoreRange || '-'}</p>
                  <p><strong>Perfil:</strong> {getLeadProfileLabel(selectedLead.profile)}</p>
                  <p><strong>Parceiro:</strong> {selectedLead.partnerName || selectedLead.partnerId || '-'}</p>
                  <p><strong>Modo de envio:</strong> {getDeliveryModeLabel(selectedLead.deliveryMode)}</p>
                  <p><strong>Redirect:</strong> {selectedLead.redirectUrl || '-'}</p>
                </div>
                <div>
                  <Label>Status</Label>
                  <Select
                    value={selectedLead.status || 'new'}
                    onValueChange={async (value) => {
                      await portalApi.updateAdminLeadStatus(selectedLead.id, value);
                      toast.success('Status do lead atualizado.');
                      loadData();
                    }}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {statuses.map((status) => <SelectItem key={status} value={status}>{getLeadStatusLabel(status)}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>UTM</Label>
                  <Textarea rows={5} value={JSON.stringify(selectedLead.utm || {
                    utm_source: selectedLead.utm_source,
                    utm_medium: selectedLead.utm_medium,
                    utm_campaign: selectedLead.utm_campaign
                  }, null, 2)} readOnly />
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-500">Selecione um lead na tabela para ver detalhes.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
