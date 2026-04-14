import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import AdminPageHeader from '@/admin/AdminPageHeader.jsx';
import { getRecordStatusLabel } from '@/admin/adminLabels.js';
import { portalApi } from '@/platform/services/portalApi.js';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const emptyForm = {
  id: '',
  name: '',
  bankId: '',
  trackingLink: '',
  productTypes: ['loan'],
  redirectRules: 'default',
  status: 'active'
};

export default function AdminPartnersPage() {
  const [partners, setPartners] = useState([]);
  const [banks, setBanks] = useState([]);
  const [filters, setFilters] = useState({ search: '', status: 'all' });
  const [editing, setEditing] = useState(emptyForm);

  const loadData = async () => {
    const [partnerData, bankData] = await Promise.all([
      portalApi.getAdminPartners(filters),
      portalApi.getAdminBanks({ status: 'all' })
    ]);
    setPartners(partnerData);
    setBanks(bankData);
  };

  useEffect(() => {
    loadData();
  }, [filters.search, filters.status]);

  const handleSave = async (event) => {
    event.preventDefault();
    await portalApi.saveAdminPartner(editing);
    toast.success('Parceiro salvo com sucesso.');
    setEditing(emptyForm);
    loadData();
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Gestao de parceiros" description="Configuracao de links e regras por parceiro." actionLabel="Novo parceiro" onAction={() => setEditing(emptyForm)} />

      <Card className="border-slate-200">
        <CardContent className="grid gap-4 pt-6 md:grid-cols-2">
          <Input placeholder="Buscar parceiro" value={filters.search} onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))} />
          <Select value={filters.status} onValueChange={(value) => setFilters((prev) => ({ ...prev, status: value }))}>
            <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="active">Ativo</SelectItem>
              <SelectItem value="inactive">Inativo</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <Card className="border-slate-200">
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Parceiro</TableHead>
                  <TableHead>Banco</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Acoes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {partners.map((partner) => (
                  <TableRow key={partner.id}>
                    <TableCell>{partner.name}</TableCell>
                    <TableCell>{banks.find((item) => item.id === partner.bankId)?.name || '-'}</TableCell>
                    <TableCell>{getRecordStatusLabel(partner.status || 'active')}</TableCell>
                    <TableCell className="space-x-2">
                      <Button variant="outline" size="sm" onClick={() => setEditing({ ...emptyForm, ...partner })}>Editar</Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          await portalApi.toggleAdminPartnerStatus(partner.id);
                          toast.success('Status atualizado.');
                          loadData();
                        }}
                      >
                        {partner.status === 'inactive' ? 'Ativar' : 'Desativar'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="pt-6">
            <form className="space-y-4" onSubmit={handleSave}>
              <div><Label>Nome</Label><Input value={editing.name} onChange={(e) => setEditing((prev) => ({ ...prev, name: e.target.value }))} required /></div>
              <div>
                <Label>Banco</Label>
                <Select value={editing.bankId || undefined} onValueChange={(value) => setEditing((prev) => ({ ...prev, bankId: value }))}>
                  <SelectTrigger><SelectValue placeholder="Selecione o banco" /></SelectTrigger>
                  <SelectContent>
                    {banks.map((bank) => <SelectItem key={bank.id} value={bank.id}>{bank.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Link de rastreamento</Label><Input value={editing.trackingLink} onChange={(e) => setEditing((prev) => ({ ...prev, trackingLink: e.target.value }))} /></div>
              <div><Label>Regras de redirecionamento</Label><Input value={editing.redirectRules} onChange={(e) => setEditing((prev) => ({ ...prev, redirectRules: e.target.value }))} /></div>
              <div>
                <Label>Tipos de produto (csv)</Label>
                <Input
                  value={Array.isArray(editing.productTypes) ? editing.productTypes.join(',') : ''}
                  onChange={(e) => setEditing((prev) => ({ ...prev, productTypes: e.target.value.split(',').map((item) => item.trim()).filter(Boolean) }))}
                />
              </div>
              <div>
                <Label>Status</Label>
                <Select value={editing.status} onValueChange={(value) => setEditing((prev) => ({ ...prev, status: value }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="inactive">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full">Salvar parceiro</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
