import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import AdminPageHeader from '@/admin/AdminPageHeader.jsx';
import { portalApi } from '@/platform/services/portalApi.js';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const emptyForm = {
  id: '',
  location: 'header',
  label: '',
  href: '/',
  order: 0,
  isActive: true,
  parentId: ''
};

export default function AdminNavigationPage() {
  const [items, setItems] = useState([]);
  const [editing, setEditing] = useState(emptyForm);
  const [location, setLocation] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await portalApi.getAdminNavigation({ location: location === 'all' ? '' : location });
      setItems(Array.isArray(data) ? data : []);
    } catch (loadError) {
      setError(loadError.message || 'Nao foi possivel carregar navegacao.');
      toast.error(loadError.message || 'Nao foi possivel carregar navegacao.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [location]);

  const parentOptions = useMemo(
    () => items.filter((item) => item.location === editing.location && item.id !== editing.id),
    [editing.id, editing.location, items]
  );

  const handleSave = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await portalApi.saveAdminNavigation({
        ...editing,
        order: Number(editing.order || 0),
        parentId: editing.parentId || null
      });
      toast.success('Item de navegacao salvo.');
      setEditing(emptyForm);
      await loadData();
    } catch (saveError) {
      toast.error(saveError.message || 'Nao foi possivel salvar.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Excluir o link ${item.label}?`)) return;
    try {
      await portalApi.deleteAdminNavigation(item.id);
      toast.success('Item excluido.');
      await loadData();
    } catch (deleteError) {
      toast.error(deleteError.message || 'Nao foi possivel excluir.');
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Navegacao" description="Header, footer, mobile e links legais controlados pelo SuperAdmin." actionLabel="Novo link" onAction={() => setEditing(emptyForm)} />

      {error ? <p className="rounded-lg bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</p> : null}

      <Card className="border-slate-200">
        <CardContent className="grid gap-4 pt-6 md:grid-cols-3">
          <div>
            <Label>Local</Label>
            <Select value={location} onValueChange={setLocation}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="header">Header</SelectItem>
                <SelectItem value="footer">Footer</SelectItem>
                <SelectItem value="mobile">Mobile</SelectItem>
                <SelectItem value="legal">Legal</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_1fr]">
        <Card className="border-slate-200">
          <CardContent className="pt-6">
            {loading ? <p className="text-sm text-slate-600">Carregando navegacao...</p> : null}
            {!loading && !items.length ? <p className="text-sm text-slate-500">Nenhum link cadastrado.</p> : null}
            {items.length ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Local</TableHead>
                    <TableHead>Label</TableHead>
                    <TableHead>Href</TableHead>
                    <TableHead>Ordem</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Acoes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.location}</TableCell>
                      <TableCell>{item.label}</TableCell>
                      <TableCell className="font-mono text-xs">{item.href}</TableCell>
                      <TableCell>{item.order}</TableCell>
                      <TableCell>{item.isActive ? 'Ativo' : 'Inativo'}</TableCell>
                      <TableCell className="space-x-2">
                        <Button size="sm" variant="outline" onClick={() => setEditing({ ...emptyForm, ...item, parentId: item.parentId || '' })}>Editar</Button>
                        <Button size="sm" variant="outline" onClick={() => handleDelete(item)}>Excluir</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : null}
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="pt-6">
            <form className="space-y-4" onSubmit={handleSave}>
              <div>
                <Label>Local</Label>
                <Select value={editing.location} onValueChange={(value) => setEditing((prev) => ({ ...prev, location: value, parentId: '' }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="header">Header</SelectItem>
                    <SelectItem value="footer">Footer</SelectItem>
                    <SelectItem value="mobile">Mobile</SelectItem>
                    <SelectItem value="legal">Legal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Label</Label><Input value={editing.label} onChange={(e) => setEditing((prev) => ({ ...prev, label: e.target.value }))} required /></div>
              <div><Label>Href</Label><Input value={editing.href} onChange={(e) => setEditing((prev) => ({ ...prev, href: e.target.value }))} required /></div>
              <div><Label>Ordem</Label><Input type="number" value={editing.order} onChange={(e) => setEditing((prev) => ({ ...prev, order: e.target.value }))} /></div>
              <div>
                <Label>Parent opcional</Label>
                <Select value={editing.parentId || 'none'} onValueChange={(value) => setEditing((prev) => ({ ...prev, parentId: value === 'none' ? '' : value }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem parent</SelectItem>
                    {parentOptions.map((item) => <SelectItem key={item.id} value={item.id}>{item.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <Checkbox checked={editing.isActive} onCheckedChange={(value) => setEditing((prev) => ({ ...prev, isActive: Boolean(value) }))} />
                Ativo no site publico
              </label>
              <Button type="submit" className="w-full" disabled={saving}>{saving ? 'Salvando...' : 'Salvar link'}</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
