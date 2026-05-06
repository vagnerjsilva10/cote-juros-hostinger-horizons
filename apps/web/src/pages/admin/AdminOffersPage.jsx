import React, { useEffect, useMemo, useState } from 'react';
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

const emptyForm = {
  id: '',
  title: '',
  bankId: '',
  productType: 'loan',
  category: 'Pessoal',
  monthlyRate: '',
  annualRate: '',
  minValue: '',
  maxValue: '',
  minTerm: '',
  maxTerm: '',
  minScore: '',
  redirectUrl: 'https://www.cotejuros.com.br/emprestimos',
  partnerTrackingUrl: '',
  isFeatured: false,
  status: 'active'
};

export default function AdminOffersPage() {
  const [offers, setOffers] = useState([]);
  const [banks, setBanks] = useState([]);
  const [filters, setFilters] = useState({ search: '', productType: 'all', status: 'all' });
  const [editing, setEditing] = useState(emptyForm);

  const loadData = async () => {
    const [offersData, banksData] = await Promise.all([
      portalApi.getAdminOffers(filters),
      portalApi.getAdminBanks({ status: 'all' })
    ]);
    setOffers(offersData);
    setBanks(banksData);
  };

  useEffect(() => {
    loadData();
  }, [filters.search, filters.productType, filters.status]);

  const bankOptions = useMemo(() => banks.map((bank) => ({ value: bank.id, label: bank.name })), [banks]);

  const handleSave = async (event) => {
    event.preventDefault();
    await portalApi.saveAdminOffer({
      ...editing,
      monthlyRate: editing.monthlyRate === '' ? null : Number(editing.monthlyRate),
      annualRate: editing.annualRate === '' ? null : Number(editing.annualRate),
      minValue: editing.minValue === '' ? null : Number(editing.minValue),
      maxValue: editing.maxValue === '' ? null : Number(editing.maxValue),
      minTerm: editing.minTerm === '' ? null : Number(editing.minTerm),
      maxTerm: editing.maxTerm === '' ? null : Number(editing.maxTerm)
    });
    toast.success('Oferta salva com sucesso.');
    setEditing(emptyForm);
    loadData();
  };

  const handleEdit = (offer) => {
    setEditing({
      ...emptyForm,
      ...offer,
      monthlyRate: offer.monthlyRate ?? '',
      annualRate: offer.annualRate ?? '',
      minValue: offer.minValue ?? '',
      maxValue: offer.maxValue ?? '',
      minTerm: offer.minTerm ?? '',
      maxTerm: offer.maxTerm ?? ''
    });
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Gestao de ofertas"
        description="Gerencie ofertas, parceiros e regras de encaminhamento."
        actionLabel="Nova oferta"
        onAction={() => setEditing(emptyForm)}
      />

      <Card className="border-slate-200">
        <CardContent className="grid gap-4 pt-6 md:grid-cols-3">
          <Input placeholder="Buscar por titulo ou banco" value={filters.search} onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))} />
          <Select value={filters.productType} onValueChange={(value) => setFilters((prev) => ({ ...prev, productType: value }))}>
            <SelectTrigger><SelectValue placeholder="Produto" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os produtos</SelectItem>
              <SelectItem value="loan">Emprestimo</SelectItem>
              <SelectItem value="credit_card">Cartao de credito</SelectItem>
              <SelectItem value="financing">Financiamento</SelectItem>
            </SelectContent>
          </Select>
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

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <Card className="border-slate-200">
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Titulo</TableHead>
                  <TableHead>Banco</TableHead>
                  <TableHead>Produto</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Acoes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {offers.map((offer) => (
                  <TableRow key={offer.id}>
                    <TableCell>{offer.title}</TableCell>
                    <TableCell>{offer.bankName || '-'}</TableCell>
                    <TableCell>{getProductTypeLabel(offer.productType)}</TableCell>
                    <TableCell>{getRecordStatusLabel(offer.status || 'active')}</TableCell>
                    <TableCell className="space-x-2">
                      <Button size="sm" variant="outline" onClick={() => handleEdit(offer)}>Editar</Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={async () => {
                          await portalApi.toggleAdminOfferStatus(offer.id);
                          toast.success('Status atualizado.');
                          loadData();
                        }}
                      >
                        {offer.status === 'inactive' ? 'Ativar' : 'Desativar'}
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
              <div>
                <Label>Titulo</Label>
                <Input value={editing.title} onChange={(e) => setEditing((prev) => ({ ...prev, title: e.target.value }))} required />
              </div>
              <div>
                <Label>Banco</Label>
                <Select value={editing.bankId || undefined} onValueChange={(value) => setEditing((prev) => ({ ...prev, bankId: value }))}>
                  <SelectTrigger><SelectValue placeholder="Selecione o banco" /></SelectTrigger>
                  <SelectContent>
                    {bankOptions.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
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
                  <Label>Categoria</Label>
                  <Input value={editing.category} onChange={(e) => setEditing((prev) => ({ ...prev, category: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Taxa mensal (%)</Label><Input type="number" step="0.01" value={editing.monthlyRate} onChange={(e) => setEditing((prev) => ({ ...prev, monthlyRate: e.target.value }))} /></div>
                <div><Label>Taxa anual (%)</Label><Input type="number" step="0.01" value={editing.annualRate} onChange={(e) => setEditing((prev) => ({ ...prev, annualRate: e.target.value }))} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Valor minimo</Label><Input type="number" value={editing.minValue} onChange={(e) => setEditing((prev) => ({ ...prev, minValue: e.target.value }))} /></div>
                <div><Label>Valor maximo</Label><Input type="number" value={editing.maxValue} onChange={(e) => setEditing((prev) => ({ ...prev, maxValue: e.target.value }))} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Prazo minimo</Label><Input type="number" value={editing.minTerm} onChange={(e) => setEditing((prev) => ({ ...prev, minTerm: e.target.value }))} /></div>
                <div><Label>Prazo maximo</Label><Input type="number" value={editing.maxTerm} onChange={(e) => setEditing((prev) => ({ ...prev, maxTerm: e.target.value }))} /></div>
              </div>
              <div>
                <Label>URL de redirecionamento</Label>
                <Input value={editing.redirectUrl} onChange={(e) => setEditing((prev) => ({ ...prev, redirectUrl: e.target.value }))} />
              </div>
              <div>
                <Label>URL de acompanhamento do parceiro</Label>
                <Input value={editing.partnerTrackingUrl} onChange={(e) => setEditing((prev) => ({ ...prev, partnerTrackingUrl: e.target.value }))} />
              </div>
              <div className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2">
                <Label htmlFor="offer-featured">Destaque na vitrine</Label>
                <Switch id="offer-featured" checked={Boolean(editing.isFeatured)} onCheckedChange={(value) => setEditing((prev) => ({ ...prev, isFeatured: value }))} />
              </div>
              <Button type="submit" className="w-full">Salvar oferta</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
