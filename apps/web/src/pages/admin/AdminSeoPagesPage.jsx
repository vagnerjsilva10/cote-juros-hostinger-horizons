import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import AdminPageHeader from '@/admin/AdminPageHeader.jsx';
import { getPublicationStatusLabel } from '@/admin/adminLabels.js';
import { portalApi } from '@/platform/services/portalApi.js';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';

const emptyForm = {
  id: '',
  slug: '',
  title: '',
  description: '',
  heroCopy: '',
  ctaCopy: 'Compare agora',
  type: 'all',
  category: '',
  status: 'draft'
};

export default function AdminSeoPagesPage() {
  const [pages, setPages] = useState([]);
  const [filters, setFilters] = useState({ search: '', status: 'all' });
  const [editing, setEditing] = useState(emptyForm);

  const loadData = async () => {
    const data = await portalApi.getAdminSeoPages(filters);
    setPages(data);
  };

  useEffect(() => {
    loadData();
  }, [filters.search, filters.status]);

  const handleSave = async (event) => {
    event.preventDefault();
    await portalApi.saveAdminSeoPage(editing);
    toast.success('Pagina SEO salva.');
    setEditing(emptyForm);
    loadData();
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Gestao de paginas SEO" description="Landing pages programaticas com publicacao controlada." actionLabel="Nova pagina" onAction={() => setEditing(emptyForm)} />

      <Card className="border-slate-200">
        <CardContent className="grid gap-4 pt-6 md:grid-cols-2">
          <Input placeholder="Buscar por titulo ou slug" value={filters.search} onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))} />
          <Select value={filters.status} onValueChange={(value) => setFilters((prev) => ({ ...prev, status: value }))}>
            <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="draft">Rascunho</SelectItem>
              <SelectItem value="published">Publicado</SelectItem>
              <SelectItem value="unpublished">Despublicado</SelectItem>
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
                  <TableHead>Slug</TableHead>
                  <TableHead>Titulo</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Acoes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pages.map((page) => (
                  <TableRow key={page.id}>
                    <TableCell>{page.path || `/${page.slug}`}</TableCell>
                    <TableCell>{page.title}</TableCell>
                    <TableCell>{page.type || 'all'}</TableCell>
                    <TableCell>{getPublicationStatusLabel(page.status)}</TableCell>
                    <TableCell className="space-x-2">
                      <Button size="sm" variant="outline" onClick={() => setEditing({ ...emptyForm, ...page, slug: page.slug || page.path?.replace(/^\//, '') || '' })}>Editar</Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={async () => {
                          await portalApi.toggleAdminSeoPublish(page.id);
                          toast.success('Status da pagina atualizado.');
                          loadData();
                        }}
                      >
                        {page.status === 'published' ? 'Despublicar' : 'Publicar'}
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
              <div><Label>Slug</Label><Input placeholder="ex.: emprestimo-online" value={editing.slug} onChange={(e) => setEditing((prev) => ({ ...prev, slug: e.target.value }))} required /></div>
              <div><Label>Titulo</Label><Input value={editing.title} onChange={(e) => setEditing((prev) => ({ ...prev, title: e.target.value }))} required /></div>
              <div><Label>Descricao</Label><Textarea rows={3} value={editing.description} onChange={(e) => setEditing((prev) => ({ ...prev, description: e.target.value }))} /></div>
              <div><Label>Texto principal</Label><Textarea rows={2} value={editing.heroCopy} onChange={(e) => setEditing((prev) => ({ ...prev, heroCopy: e.target.value }))} /></div>
              <div><Label>Texto do CTA</Label><Input value={editing.ctaCopy} onChange={(e) => setEditing((prev) => ({ ...prev, ctaCopy: e.target.value }))} /></div>
              <div><Label>Tipo de produto</Label><Input placeholder="loan | credit_card | financing | all" value={editing.type} onChange={(e) => setEditing((prev) => ({ ...prev, type: e.target.value }))} /></div>
              <div><Label>Categoria</Label><Input value={editing.category} onChange={(e) => setEditing((prev) => ({ ...prev, category: e.target.value }))} /></div>
              <div>
                <Label>Status</Label>
                <Select value={editing.status} onValueChange={(value) => setEditing((prev) => ({ ...prev, status: value }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Rascunho</SelectItem>
                    <SelectItem value="published">Publicado</SelectItem>
                    <SelectItem value="unpublished">Despublicado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full">Salvar pagina SEO</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
