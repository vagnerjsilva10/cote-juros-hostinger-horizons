import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import AdminPageHeader from '@/admin/AdminPageHeader.jsx';
import { portalApi } from '@/platform/services/portalApi.js';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';

const emptyForm = {
  id: '',
  key: '',
  group: 'brand',
  valueText: '{}',
  description: '',
  isPublic: true
};

export default function AdminSettingsPage() {
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'public';
  const [items, setItems] = useState([]);
  const [editing, setEditing] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await portalApi.getAdminSettings();
      setItems(Array.isArray(data) ? data : []);
    } catch (loadError) {
      setError(loadError.message || 'Nao foi possivel carregar configuracoes.');
      toast.error(loadError.message || 'Nao foi possivel carregar configuracoes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const editItem = (item) => {
    setEditing({
      id: item.id,
      key: item.key,
      group: item.group,
      valueText: JSON.stringify(item.value ?? {}, null, 2),
      description: item.description || '',
      isPublic: Boolean(item.isPublic)
    });
  };

  const handleSave = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const value = JSON.parse(editing.valueText || 'null');
      await portalApi.saveAdminSetting({
        id: editing.id || undefined,
        key: editing.key,
        group: editing.group,
        value,
        description: editing.description || null,
        isPublic: Boolean(editing.isPublic)
      });
      toast.success('Configuracao salva no banco.');
      setEditing(emptyForm);
      await loadData();
    } catch (saveError) {
      toast.error(saveError instanceof SyntaxError ? 'Dados avançados precisam ser válidos.' : saveError.message || 'Nao foi possivel salvar.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Excluir a configuracao ${item.key}?`)) return;
    try {
      await portalApi.deleteAdminSetting(item.id);
      toast.success('Configuracao excluida.');
      await loadData();
    } catch (deleteError) {
      toast.error(deleteError.message || 'Nao foi possivel excluir.');
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Configurações públicas"
        description="Fonte operacional para marca, domínio, SEO padrão, logos, scripts, cores e configurações públicas."
        actionLabel="Nova configuração"
        onAction={() => setEditing(emptyForm)}
      />

      <div className="flex flex-wrap gap-2 rounded-lg border border-slate-200 bg-white p-2">
        {[
          ['public', 'Configuracoes publicas'],
          ['advanced', 'Configuracoes avancadas']
        ].map(([tab, label]) => (
          <Link
            key={tab}
            to={`/admin/settings?tab=${tab}`}
            className={`rounded-md px-3 py-2 text-sm font-semibold transition-colors ${
              activeTab === tab ? 'bg-slate-950 text-white' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950'
            }`}
          >
            {label}
          </Link>
        ))}
      </div>

      {error ? <p className="rounded-lg bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</p> : null}

      <div className="grid gap-6 xl:grid-cols-[1.35fr_1fr]">
        <Card className="border-slate-200">
          <CardContent className="pt-6">
            {loading ? <p className="text-sm text-slate-600">Carregando configuracoes...</p> : null}
            {!loading && !items.length ? <p className="text-sm text-slate-500">Nenhuma configuracao criada ainda.</p> : null}
            {items.length ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Chave</TableHead>
                    <TableHead>Grupo</TableHead>
                    <TableHead>Publica</TableHead>
                    <TableHead>Acoes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items
                    .filter((item) => activeTab === 'advanced' || item.isPublic)
                    .map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-mono text-xs">{item.key}</TableCell>
                      <TableCell>{item.group}</TableCell>
                      <TableCell>{item.isPublic ? 'Sim' : 'Nao'}</TableCell>
                      <TableCell className="space-x-2">
                        <Button size="sm" variant="outline" onClick={() => editItem(item)}>Editar</Button>
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
              <div><Label>Chave</Label><Input value={editing.key} onChange={(e) => setEditing((prev) => ({ ...prev, key: e.target.value }))} placeholder="brand.name" required /></div>
              <div><Label>Grupo</Label><Input value={editing.group} onChange={(e) => setEditing((prev) => ({ ...prev, group: e.target.value }))} required /></div>
              <div><Label>Descricao</Label><Input value={editing.description} onChange={(e) => setEditing((prev) => ({ ...prev, description: e.target.value }))} /></div>
              <div>
                <Label>Dados avançados</Label>
                <Textarea rows={10} value={editing.valueText} onChange={(e) => setEditing((prev) => ({ ...prev, valueText: e.target.value }))} required />
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <Checkbox checked={editing.isPublic} onCheckedChange={(value) => setEditing((prev) => ({ ...prev, isPublic: Boolean(value) }))} />
                Disponivel para o site publico
              </label>
              <Button type="submit" className="w-full" disabled={saving}>{saving ? 'Salvando...' : 'Salvar configuracao'}</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
