import React, { useEffect, useState } from 'react';
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
import { Textarea } from '@/components/ui/textarea';

const emptyForm = {
  id: '',
  path: '/',
  title: '',
  description: '',
  canonical: '',
  robots: 'index,follow,max-image-preview:large',
  ogTitle: '',
  ogDescription: '',
  ogImage: '',
  isActive: true
};

export default function AdminSeoPagesPage() {
  const [items, setItems] = useState([]);
  const [filters, setFilters] = useState({ search: '', status: 'all' });
  const [editing, setEditing] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await portalApi.getAdminSeoPages(filters);
      setItems(Array.isArray(data) ? data : []);
    } catch (loadError) {
      setError(loadError.message || 'Nao foi possivel carregar SEO.');
      toast.error(loadError.message || 'Nao foi possivel carregar SEO.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filters.search, filters.status]);

  const handleSave = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await portalApi.saveAdminSeoPage(editing);
      toast.success('SEO salvo no banco.');
      setEditing(emptyForm);
      await loadData();
    } catch (saveError) {
      toast.error(saveError.message || 'Nao foi possivel salvar SEO.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (item) => {
    try {
      await portalApi.toggleAdminSeoPublish(item);
      toast.success('Status do SEO atualizado.');
      await loadData();
    } catch (toggleError) {
      toast.error(toggleError.message || 'Nao foi possivel atualizar status.');
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Excluir SEO de ${item.path}?`)) return;
    try {
      await portalApi.deleteAdminSeoMeta(item.id);
      toast.success('SEO excluido.');
      await loadData();
    } catch (deleteError) {
      toast.error(deleteError.message || 'Nao foi possivel excluir SEO.');
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader title="SEO por rota" description="Metas publicas por path. O site usa fallback de codigo quando nao existe registro ativo." actionLabel="Novo SEO" onAction={() => setEditing(emptyForm)} />

      {error ? <p className="rounded-lg bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</p> : null}

      <Card className="border-slate-200">
        <CardContent className="grid gap-4 pt-6 md:grid-cols-2">
          <Input placeholder="Buscar path" value={filters.search} onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))} />
          <Select value={filters.status} onValueChange={(value) => setFilters((prev) => ({ ...prev, status: value }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="active">Ativos</SelectItem>
              <SelectItem value="inactive">Inativos</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_1fr]">
        <Card className="border-slate-200">
          <CardContent className="pt-6">
            {loading ? <p className="text-sm text-slate-600">Carregando SEO...</p> : null}
            {!loading && !items.length ? <p className="text-sm text-slate-500">Nenhum SEO cadastrado.</p> : null}
            {items.length ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Path</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Acoes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-mono text-xs">{item.path}</TableCell>
                      <TableCell>{item.title}</TableCell>
                      <TableCell>{item.isActive ? 'Ativo' : 'Inativo'}</TableCell>
                      <TableCell className="space-x-2">
                        <Button size="sm" variant="outline" onClick={() => setEditing({ ...emptyForm, ...item, canonical: item.canonical || '', robots: item.robots || emptyForm.robots, ogTitle: item.ogTitle || '', ogDescription: item.ogDescription || '', ogImage: item.ogImage || '' })}>Editar</Button>
                        <Button size="sm" variant="outline" onClick={() => handleToggle(item)}>{item.isActive ? 'Inativar' : 'Ativar'}</Button>
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
              <div><Label>Path</Label><Input value={editing.path} onChange={(e) => setEditing((prev) => ({ ...prev, path: e.target.value }))} required /></div>
              <div><Label>Title</Label><Input value={editing.title} onChange={(e) => setEditing((prev) => ({ ...prev, title: e.target.value }))} required /></div>
              <div><Label>Description</Label><Textarea rows={3} value={editing.description} onChange={(e) => setEditing((prev) => ({ ...prev, description: e.target.value }))} required /></div>
              <div><Label>Canonical opcional</Label><Input value={editing.canonical || ''} onChange={(e) => setEditing((prev) => ({ ...prev, canonical: e.target.value }))} /></div>
              <div><Label>Robots</Label><Input value={editing.robots || ''} onChange={(e) => setEditing((prev) => ({ ...prev, robots: e.target.value }))} /></div>
              <div><Label>OG title</Label><Input value={editing.ogTitle || ''} onChange={(e) => setEditing((prev) => ({ ...prev, ogTitle: e.target.value }))} /></div>
              <div><Label>OG description</Label><Textarea rows={2} value={editing.ogDescription || ''} onChange={(e) => setEditing((prev) => ({ ...prev, ogDescription: e.target.value }))} /></div>
              <div><Label>OG image</Label><Input value={editing.ogImage || ''} onChange={(e) => setEditing((prev) => ({ ...prev, ogImage: e.target.value }))} /></div>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <Checkbox checked={editing.isActive} onCheckedChange={(value) => setEditing((prev) => ({ ...prev, isActive: Boolean(value) }))} />
                Ativo no site publico
              </label>
              <Button type="submit" className="w-full" disabled={saving}>{saving ? 'Salvando...' : 'Salvar SEO'}</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
