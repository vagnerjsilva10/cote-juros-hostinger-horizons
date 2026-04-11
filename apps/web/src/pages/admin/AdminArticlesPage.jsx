import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import AdminPageHeader from '@/admin/AdminPageHeader.jsx';
import { portalApi } from '@/platform/services/portalApi.js';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const emptyForm = {
  id: '',
  title: '',
  slug: '',
  category: 'Finanças Pessoais',
  status: 'draft',
  summary: '',
  excerpt: '',
  seoTitle: '',
  seoDescription: '',
  image: '',
  content: ''
};

export default function AdminArticlesPage() {
  const [articles, setArticles] = useState([]);
  const [filters, setFilters] = useState({ search: '', status: 'all' });
  const [editing, setEditing] = useState(emptyForm);

  const loadData = async () => {
    const data = await portalApi.getAdminArticles(filters);
    setArticles(data);
  };

  useEffect(() => {
    loadData();
  }, [filters.search, filters.status]);

  const handleSave = async (event) => {
    event.preventDefault();
    await portalApi.saveAdminArticle(editing);
    toast.success('Artigo salvo.');
    setEditing(emptyForm);
    loadData();
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader title="CMS / Articles" description="Operação de artigos com draft/publicação e SEO." actionLabel="Novo artigo" onAction={() => setEditing(emptyForm)} />

      <Card className="border-slate-200">
        <CardContent className="pt-6 grid gap-4 md:grid-cols-2">
          <Input placeholder="Buscar artigo" value={filters.search} onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))} />
          <Select value={filters.status} onValueChange={(value) => setFilters((prev) => ({ ...prev, status: value }))}>
            <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="published">Published</SelectItem>
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
                  <TableHead>Título</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {articles.map((article) => (
                  <TableRow key={article.id}>
                    <TableCell>{article.title}</TableCell>
                    <TableCell>{article.category}</TableCell>
                    <TableCell>{article.status}</TableCell>
                    <TableCell className="space-x-2">
                      <Button size="sm" variant="outline" onClick={() => setEditing({ ...emptyForm, ...article })}>Editar</Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={async () => {
                          await portalApi.toggleAdminArticlePublish(article.id);
                          toast.success('Status de publicação atualizado.');
                          loadData();
                        }}
                      >
                        {article.status === 'published' ? 'Despublicar' : 'Publicar'}
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
              <div><Label>Título</Label><Input value={editing.title} onChange={(e) => setEditing((prev) => ({ ...prev, title: e.target.value }))} required /></div>
              <div><Label>Slug</Label><Input value={editing.slug} onChange={(e) => setEditing((prev) => ({ ...prev, slug: e.target.value }))} /></div>
              <div><Label>Categoria</Label><Input value={editing.category} onChange={(e) => setEditing((prev) => ({ ...prev, category: e.target.value }))} /></div>
              <div>
                <Label>Status</Label>
                <Select value={editing.status} onValueChange={(value) => setEditing((prev) => ({ ...prev, status: value }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Resumo / excerpt</Label><Textarea rows={3} value={editing.summary} onChange={(e) => setEditing((prev) => ({ ...prev, summary: e.target.value, excerpt: e.target.value }))} /></div>
              <div><Label>SEO title</Label><Input value={editing.seoTitle} onChange={(e) => setEditing((prev) => ({ ...prev, seoTitle: e.target.value }))} /></div>
              <div><Label>SEO description</Label><Textarea rows={2} value={editing.seoDescription} onChange={(e) => setEditing((prev) => ({ ...prev, seoDescription: e.target.value }))} /></div>
              <div><Label>Featured image URL</Label><Input value={editing.image} onChange={(e) => setEditing((prev) => ({ ...prev, image: e.target.value }))} /></div>
              <div><Label>Body content</Label><Textarea rows={8} value={editing.content} onChange={(e) => setEditing((prev) => ({ ...prev, content: e.target.value }))} /></div>
              <Button type="submit" className="w-full">Salvar artigo</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
