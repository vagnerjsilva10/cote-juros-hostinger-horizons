import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import AdminPageHeader from '@/admin/AdminPageHeader.jsx';
import { getProductTypeLabel, getRecordStatusLabel } from '@/admin/adminLabels.js';
import { portalApi } from '@/platform/services/portalApi.js';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';

const emptyForm = {
  id: '',
  name: '',
  city: '',
  text: '',
  productType: 'loan',
  status: 'active',
  featured: false
};

export default function AdminTestimonialsPage() {
  const [items, setItems] = useState([]);
  const [filters, setFilters] = useState({ search: '', status: 'all' });
  const [editing, setEditing] = useState(emptyForm);

  const loadData = async () => {
    const data = await portalApi.getAdminTestimonials(filters);
    setItems(data);
  };

  useEffect(() => {
    loadData();
  }, [filters.search, filters.status]);

  const handleSave = async (event) => {
    event.preventDefault();
    await portalApi.saveAdminTestimonial(editing);
    toast.success('Depoimento salvo.');
    setEditing(emptyForm);
    loadData();
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Gestao de depoimentos" description="Prova social operacional para secoes publicas." actionLabel="Novo depoimento" onAction={() => setEditing(emptyForm)} />

      <Card className="border-slate-200">
        <CardContent className="grid gap-4 pt-6 md:grid-cols-2">
          <Input placeholder="Buscar depoimento" value={filters.search} onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))} />
          <Select value={filters.status} onValueChange={(value) => setFilters((prev) => ({ ...prev, status: value }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="active">Ativo</SelectItem>
              <SelectItem value="inactive">Inativo</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.3fr_1fr]">
        <Card className="border-slate-200">
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Cidade</TableHead>
                  <TableHead>Produto</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Destaque</TableHead>
                  <TableHead>Acoes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.name}</TableCell>
                    <TableCell>{item.city || item.location || '-'}</TableCell>
                    <TableCell>{getProductTypeLabel(item.productType || item.product)}</TableCell>
                    <TableCell>{getRecordStatusLabel(item.status)}</TableCell>
                    <TableCell>{item.featured ? 'Sim' : 'Nao'}</TableCell>
                    <TableCell className="space-x-2">
                      <Button size="sm" variant="outline" onClick={() => setEditing({ ...emptyForm, ...item, city: item.city || item.location || '', text: item.text || item.quote || '' })}>Editar</Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={async () => {
                          await portalApi.toggleAdminTestimonialStatus(item.id);
                          toast.success('Status atualizado.');
                          loadData();
                        }}
                      >
                        {item.status === 'inactive' ? 'Ativar' : 'Desativar'}
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
              <div><Label>Cidade</Label><Input value={editing.city} onChange={(e) => setEditing((prev) => ({ ...prev, city: e.target.value }))} /></div>
              <div><Label>Texto</Label><Textarea rows={4} value={editing.text} onChange={(e) => setEditing((prev) => ({ ...prev, text: e.target.value }))} required /></div>
              <div>
                <Label>Produto</Label>
                <Select value={editing.productType} onValueChange={(value) => setEditing((prev) => ({ ...prev, productType: value }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="loan">Emprestimo</SelectItem>
                    <SelectItem value="credit_card">Cartao de credito</SelectItem>
                    <SelectItem value="financing">Financiamento</SelectItem>
                  </SelectContent>
                </Select>
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
              <div className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2">
                <Label htmlFor="testimonial-featured">Em destaque</Label>
                <Switch id="testimonial-featured" checked={Boolean(editing.featured)} onCheckedChange={(value) => setEditing((prev) => ({ ...prev, featured: value }))} />
              </div>
              <Button type="submit" className="w-full">Salvar depoimento</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
