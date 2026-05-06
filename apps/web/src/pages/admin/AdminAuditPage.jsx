import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import AdminPageHeader from '@/admin/AdminPageHeader.jsx';
import { portalApi } from '@/platform/services/portalApi.js';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';

const emptyFilters = {
  page: 1,
  pageSize: 20,
  resource: 'all',
  action: '',
  search: ''
};

const commonResources = [
  'all',
  'admin_session',
  'admin_user',
  'lead',
  'site_setting',
  'navigation_item',
  'legal_disclaimer',
  'seo_meta',
  'partner',
  'dashboard',
  'audit'
];

const resourceLabels = {
  all: 'Todos',
  admin_session: 'Sessões administrativas',
  admin_user: 'Usuários',
  lead: 'Leads',
  site_setting: 'Configurações públicas',
  navigation_item: 'Navegação',
  legal_disclaimer: 'Disclaimers',
  seo_meta: 'SEO',
  partner: 'Parceiros',
  dashboard: 'Dashboard',
  audit: 'Auditoria'
};

export default function AdminAuditPage() {
  const [filters, setFilters] = useState(emptyFilters);
  const [dataset, setDataset] = useState({ items: [], page: 1, pageSize: 20, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    setLoading(true);
    portalApi.getAdminAuditLogs({
      ...filters,
      resource: filters.resource === 'all' ? '' : filters.resource
    })
      .then((data) => {
        if (!active) return;
        setDataset(data || { items: [], page: 1, pageSize: 20, total: 0, totalPages: 1 });
      })
      .catch((error) => {
        if (!active) return;
        toast.error(error.message || 'Não foi possível carregar a trilha de auditoria.');
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [filters.page, filters.pageSize, filters.resource, filters.action, filters.search]);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Auditoria administrativa"
        description="Consulte quem fez o quê, quando fez e em qual entidade operacional."
      />

      <Card className="border-slate-200">
        <CardContent className="grid gap-4 pt-6 md:grid-cols-3 xl:grid-cols-5">
          <div className="xl:col-span-2">
            <Label>Buscar</Label>
            <Input
              placeholder="Email, recurso, ação ou identificador"
              value={filters.search}
              onChange={(event) => setFilters((current) => ({ ...current, page: 1, search: event.target.value }))}
            />
          </div>
          <div>
            <Label>Recurso</Label>
            <Select value={filters.resource} onValueChange={(value) => setFilters((current) => ({ ...current, page: 1, resource: value }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {commonResources.map((item) => (
                  <SelectItem key={item} value={item}>
                    {resourceLabels[item] || item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Ação</Label>
            <Input
              placeholder="ex.: login realizado"
              value={filters.action}
              onChange={(event) => setFilters((current) => ({ ...current, page: 1, action: event.target.value }))}
            />
          </div>
          <div>
            <Label>Itens por página</Label>
            <Select value={String(filters.pageSize)} onValueChange={(value) => setFilters((current) => ({ ...current, page: 1, pageSize: Number(value) }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {[20, 50, 100].map((size) => (
                  <SelectItem key={size} value={String(size)}>{size}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200">
        <CardContent className="pt-6">
          {loading ? <p className="text-sm text-slate-600">Carregando trilha de auditoria...</p> : null}

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Quando</TableHead>
                  <TableHead>Quem</TableHead>
                  <TableHead>Ação</TableHead>
                  <TableHead>Recurso</TableHead>
                  <TableHead>Identificador</TableHead>
                  <TableHead>IP</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(dataset.items || []).map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.createdAt ? new Date(item.createdAt).toLocaleString('pt-BR') : '-'}</TableCell>
                    <TableCell>
                      <p className="font-medium text-slate-950">{item.actorName || item.actorEmail || 'Sistema'}</p>
                      <p className="text-xs text-slate-500">{item.actorEmail || '-'}</p>
                    </TableCell>
                    <TableCell>{String(item.action || '-').replace(/_/g, ' ')}</TableCell>
                    <TableCell>{resourceLabels[item.resource] || item.resource || '-'}</TableCell>
                    <TableCell className="font-mono text-xs">{item.resourceId || '-'}</TableCell>
                    <TableCell className="text-xs text-slate-500">{item.ipAddress || '-'}</TableCell>
                  </TableRow>
                ))}
                {!loading && (dataset.items || []).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-slate-500">
                      Nenhum evento encontrado para os filtros atuais.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
            <p>
              Página {dataset.page || 1} de {dataset.totalPages || 1} · {dataset.total || 0} eventos
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={(dataset.page || 1) <= 1}
                onClick={() => setFilters((current) => ({ ...current, page: Math.max(1, current.page - 1) }))}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={(dataset.page || 1) >= (dataset.totalPages || 1)}
                onClick={() => setFilters((current) => ({ ...current, page: current.page + 1 }))}
              >
                Próxima
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
