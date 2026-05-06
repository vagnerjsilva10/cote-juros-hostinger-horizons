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
  key: 'not_bank',
  title: '',
  content: '',
  placement: 'footer',
  isActive: true
};

export default function AdminDisclaimersPage() {
  const [items, setItems] = useState([]);
  const [editing, setEditing] = useState(emptyForm);
  const [placement, setPlacement] = useState('all');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await portalApi.getAdminDisclaimers({ placement: placement === 'all' ? '' : placement });
      setItems(Array.isArray(data) ? data : []);
    } catch (loadError) {
      setError(loadError.message || 'Nao foi possivel carregar disclaimers.');
      toast.error(loadError.message || 'Nao foi possivel carregar disclaimers.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [placement]);

  const handleSave = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await portalApi.saveAdminDisclaimer(editing);
      toast.success('Disclaimer salvo.');
      setEditing(emptyForm);
      await loadData();
    } catch (saveError) {
      toast.error(saveError.message || 'Nao foi possivel salvar.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Excluir o disclaimer ${item.key}?`)) return;
    try {
      await portalApi.deleteAdminDisclaimer(item.id);
      toast.success('Disclaimer excluido.');
      await loadData();
    } catch (deleteError) {
      toast.error(deleteError.message || 'Nao foi possivel excluir.');
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Disclaimers" description="Textos legais globais por area do site, com conteudo padrao no portal publico." actionLabel="Novo disclaimer" onAction={() => setEditing(emptyForm)} />

      {error ? <p className="rounded-lg bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</p> : null}

      <Card className="border-slate-200">
        <CardContent className="grid gap-4 pt-6 md:grid-cols-3">
          <div>
            <Label>Area do site</Label>
            <Select value={placement} onValueChange={setPlacement}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="home">Home</SelectItem>
                <SelectItem value="emprestimos">Emprestimos</SelectItem>
                <SelectItem value="resultado">Resultado</SelectItem>
                <SelectItem value="footer">Footer</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_1fr]">
        <Card className="border-slate-200">
          <CardContent className="pt-6">
            {loading ? <p className="text-sm text-slate-600">Carregando disclaimers...</p> : null}
            {!loading && !items.length ? <p className="text-sm text-slate-500">Nenhum disclaimer cadastrado.</p> : null}
            {items.length ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Identificador</TableHead>
                    <TableHead>Area do site</TableHead>
                    <TableHead>Titulo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Acoes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-mono text-xs">{item.key}</TableCell>
                      <TableCell>{item.placement}</TableCell>
                      <TableCell>{item.title || '-'}</TableCell>
                      <TableCell>{item.isActive ? 'Ativo' : 'Inativo'}</TableCell>
                      <TableCell className="space-x-2">
                        <Button size="sm" variant="outline" onClick={() => setEditing({ ...emptyForm, ...item })}>Editar</Button>
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
              <div><Label>Identificador</Label><Input value={editing.key} onChange={(e) => setEditing((prev) => ({ ...prev, key: e.target.value }))} required /></div>
              <div><Label>Titulo</Label><Input value={editing.title} onChange={(e) => setEditing((prev) => ({ ...prev, title: e.target.value }))} required /></div>
              <div>
                <Label>Area do site</Label>
                <Select value={editing.placement} onValueChange={(value) => setEditing((prev) => ({ ...prev, placement: value }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="home">Home</SelectItem>
                    <SelectItem value="emprestimos">Emprestimos</SelectItem>
                    <SelectItem value="resultado">Resultado</SelectItem>
                    <SelectItem value="footer">Footer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Conteudo</Label><Textarea rows={8} value={editing.content} onChange={(e) => setEditing((prev) => ({ ...prev, content: e.target.value }))} required /></div>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <Checkbox checked={editing.isActive} onCheckedChange={(value) => setEditing((prev) => ({ ...prev, isActive: Boolean(value) }))} />
                Ativo no site publico
              </label>
              <Button type="submit" className="w-full" disabled={saving}>{saving ? 'Salvando...' : 'Salvar disclaimer'}</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
