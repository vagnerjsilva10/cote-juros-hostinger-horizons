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

const statuses = ['new', 'qualified', 'sent', 'converted', 'archived'];

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
      <AdminPageHeader title="Lead Management" description="Funil de simulações com status operacional e detalhes de origem." />

      <Card className="border-slate-200">
        <CardContent className="pt-6 grid gap-4 md:grid-cols-5">
          <div><Label>De</Label><Input type="date" value={filters.from} onChange={(e) => setFilters((prev) => ({ ...prev, from: e.target.value }))} /></div>
          <div><Label>Até</Label><Input type="date" value={filters.to} onChange={(e) => setFilters((prev) => ({ ...prev, to: e.target.value }))} /></div>
          <div>
            <Label>Source page</Label>
            <Select value={filters.sourcePage} onValueChange={(value) => setFilters((prev) => ({ ...prev, sourcePage: value }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {sourcePageOptions.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Produto</Label>
            <Select value={filters.productType} onValueChange={(value) => setFilters((prev) => ({ ...prev, productType: value }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">all</SelectItem>
                <SelectItem value="loan">loan</SelectItem>
                <SelectItem value="credit_card">credit_card</SelectItem>
                <SelectItem value="financing">financing</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Status</Label>
            <Select value={filters.status} onValueChange={(value) => setFilters((prev) => ({ ...prev, status: value }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">all</SelectItem>
                {statuses.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <Card className="border-slate-200">
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Produto</TableHead>
                  <TableHead>Origem</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.map((lead) => (
                  <TableRow key={lead.id} className="cursor-pointer" onClick={() => setSelectedLead(lead)}>
                    <TableCell>{new Date(lead.createdAt).toLocaleString('pt-BR')}</TableCell>
                    <TableCell>{lead.productType || '-'}</TableCell>
                    <TableCell>{lead.sourcePage || lead.originPage || '-'}</TableCell>
                    <TableCell>{lead.status || 'new'}</TableCell>
                  </TableRow>
                ))}
                {leads.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-slate-500">Sem leads para os filtros atuais.</TableCell></TableRow>
                ) : null}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="pt-6">
            {selectedLead ? (
              <div className="space-y-4">
                <h3 className="text-base font-semibold">Detalhes do lead</h3>
                <div className="text-sm text-slate-600 space-y-1">
                  <p><strong>ID:</strong> {selectedLead.id}</p>
                  <p><strong>Origem:</strong> {selectedLead.sourcePage || selectedLead.originPage || '-'}</p>
                  <p><strong>Produto:</strong> {selectedLead.productType || '-'}</p>
                  <p><strong>Valor:</strong> {selectedLead.amount || selectedLead.requestedAmount || '-'}</p>
                  <p><strong>Renda:</strong> {selectedLead.income || '-'}</p>
                  <p><strong>Score:</strong> {selectedLead.score || selectedLead.scoreRange || '-'}</p>
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
                      {statuses.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}
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
