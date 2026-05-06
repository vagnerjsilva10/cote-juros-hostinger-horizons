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
  slug: '',
  logoUrl: '',
  color: '#111827',
  website: '',
  status: 'active'
};

export default function AdminBanksPage() {
  const [banks, setBanks] = useState([]);
  const [filters, setFilters] = useState({ search: '', status: 'all' });
  const [editing, setEditing] = useState(emptyForm);

  const loadData = async () => {
    const data = await portalApi.getAdminBanks(filters);
    setBanks(data);
  };

  useEffect(() => {
    loadData();
  }, [filters.search, filters.status]);

  const handleSave = async (event) => {
    event.preventDefault();
    await portalApi.saveAdminBank(editing);
    toast.success('Banco salvo com sucesso.');
    setEditing(emptyForm);
    loadData();
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Gestao de bancos" description="Cadastro e operacao dos bancos." actionLabel="Novo banco" onAction={() => setEditing(emptyForm)} />

      <Card className="border-slate-200">
        <CardContent className="grid gap-4 pt-6 md:grid-cols-2">
          <Input placeholder="Buscar banco" value={filters.search} onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))} />
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
                  <TableHead>Nome</TableHead>
                  <TableHead>Website</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Acoes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {banks.map((bank) => (
                  <TableRow key={bank.id}>
                    <TableCell>{bank.name}</TableCell>
                    <TableCell>{bank.website || '-'}</TableCell>
                    <TableCell>{getRecordStatusLabel(bank.status || 'active')}</TableCell>
                    <TableCell className="space-x-2">
                      <Button variant="outline" size="sm" onClick={() => setEditing({ ...emptyForm, ...bank })}>Editar</Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          await portalApi.toggleAdminBankStatus(bank.id);
                          toast.success('Status atualizado.');
                          loadData();
                        }}
                      >
                        {bank.status === 'inactive' ? 'Ativar' : 'Desativar'}
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
              <div><Label>Identificador</Label><Input value={editing.slug} onChange={(e) => setEditing((prev) => ({ ...prev, slug: e.target.value }))} /></div>
              <div><Label>URL do logo</Label><Input value={editing.logoUrl} onChange={(e) => setEditing((prev) => ({ ...prev, logoUrl: e.target.value }))} /></div>
              <div><Label>Cor</Label><Input value={editing.color} onChange={(e) => setEditing((prev) => ({ ...prev, color: e.target.value }))} /></div>
              <div><Label>Website</Label><Input value={editing.website} onChange={(e) => setEditing((prev) => ({ ...prev, website: e.target.value }))} /></div>
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
              <Button type="submit" className="w-full">Salvar banco</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
