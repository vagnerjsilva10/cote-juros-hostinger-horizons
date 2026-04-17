import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import AdminPageHeader from '@/admin/AdminPageHeader.jsx';
import { portalApi } from '@/platform/services/portalApi.js';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const emptyForm = {
  id: '',
  email: '',
  fullName: '',
  password: '',
  status: 'active',
  roleCodes: []
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [filters, setFilters] = useState({ search: '', status: 'all' });
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [userData, roleData] = await Promise.all([
        portalApi.getAdminUsers(filters),
        portalApi.getAdminRoles()
      ]);
      setUsers(userData || []);
      setRoles(roleData || []);
    } catch (error) {
      toast.error(error.message || 'Não foi possível carregar equipe e perfis.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filters.search, filters.status]);

  const sortedRoles = useMemo(() => roles.map((role) => ({
    ...role,
    permissionCount: role.permissions?.length || 0
  })), [roles]);

  const handleRoleToggle = (code) => {
    setForm((current) => ({
      ...current,
      roleCodes: current.roleCodes.includes(code)
        ? current.roleCodes.filter((item) => item !== code)
        : [...current.roleCodes, code]
    }));
  };

  const handleEdit = (user) => {
    setForm({
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      password: '',
      status: user.status,
      roleCodes: (user.roles || []).map((role) => role.code)
    });
  };

  const resetForm = () => setForm(emptyForm);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      if (form.id) {
        await portalApi.updateAdminUser(form.id, {
          fullName: form.fullName,
          password: form.password || undefined,
          status: form.status,
          roleCodes: form.roleCodes
        });
        toast.success('Usuário administrativo atualizado.');
      } else {
        await portalApi.createAdminUser({
          email: form.email,
          fullName: form.fullName,
          password: form.password,
          status: form.status,
          roleCodes: form.roleCodes
        });
        toast.success('Usuário administrativo criado.');
      }
      resetForm();
      await loadData();
    } catch (error) {
      toast.error(error.message || 'Não foi possível salvar o usuário administrativo.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Equipe e permissões"
        description="Gerencie usuários administrativos, status de acesso e perfis de permissão do painel."
      />

      <div className="grid gap-6 xl:grid-cols-[1.35fr_1fr]">
        <div className="space-y-6">
          <Card className="border-slate-200">
            <CardContent className="grid gap-4 pt-6 md:grid-cols-3">
              <div className="md:col-span-2">
                <Label>Buscar usuário</Label>
                <Input
                  placeholder="Nome ou email"
                  value={filters.search}
                  onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
                />
              </div>
              <div>
                <Label>Status</Label>
                <Select value={filters.status} onValueChange={(value) => setFilters((current) => ({ ...current, status: value }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="invited">Convidado</SelectItem>
                    <SelectItem value="disabled">Desabilitado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardContent className="pt-6">
              {loading ? <p className="text-sm text-slate-600">Carregando equipe...</p> : null}
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Usuário</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Perfis</TableHead>
                      <TableHead>Sessões</TableHead>
                      <TableHead>Último acesso</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id} className="cursor-pointer" onClick={() => handleEdit(user)}>
                        <TableCell>
                          <p className="font-medium text-slate-950">{user.fullName}</p>
                          <p className="text-xs text-slate-500">{user.email}</p>
                        </TableCell>
                        <TableCell>{user.status}</TableCell>
                        <TableCell>{(user.roles || []).map((role) => role.name).join(', ') || '-'}</TableCell>
                        <TableCell>{user.sessions?.length || 0}</TableCell>
                        <TableCell>{user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString('pt-BR') : '-'}</TableCell>
                      </TableRow>
                    ))}
                    {!loading && users.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-slate-500">Nenhum usuário encontrado.</TableCell>
                      </TableRow>
                    ) : null}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardContent className="pt-6">
              <h3 className="text-base font-semibold text-slate-950">Matriz de perfis</h3>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {sortedRoles.map((role) => (
                  <div key={role.id} className="rounded-lg border border-slate-200 p-4">
                    <p className="font-medium text-slate-950">{role.name}</p>
                    <p className="mt-1 text-sm text-slate-500">{role.code}</p>
                    <p className="mt-2 text-xs text-slate-500">{role.permissionCount} permissões vinculadas</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-slate-200">
          <CardContent className="pt-6">
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <h3 className="text-base font-semibold text-slate-950">
                  {form.id ? 'Editar usuário administrativo' : 'Novo usuário administrativo'}
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Defina acesso, status e perfis do membro da equipe.
                </p>
              </div>

              <div>
                <Label>Email</Label>
                <Input
                  value={form.email}
                  onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                  disabled={Boolean(form.id)}
                />
              </div>

              <div>
                <Label>Nome completo</Label>
                <Input
                  value={form.fullName}
                  onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value }))}
                />
              </div>

              <div>
                <Label>{form.id ? 'Nova senha (opcional)' : 'Senha inicial'}</Label>
                <Input
                  type="password"
                  value={form.password}
                  onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                />
              </div>

              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(value) => setForm((current) => ({ ...current, status: value }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="invited">Convidado</SelectItem>
                    <SelectItem value="disabled">Desabilitado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Perfis</Label>
                <div className="grid gap-2">
                  {sortedRoles.map((role) => (
                    <label key={role.id} className="flex items-start gap-3 rounded-lg border border-slate-200 p-3 text-sm">
                      <input
                        type="checkbox"
                        checked={form.roleCodes.includes(role.code)}
                        onChange={() => handleRoleToggle(role.code)}
                        className="mt-1"
                      />
                      <span>
                        <strong className="text-slate-950">{role.name}</strong>
                        <span className="mt-1 block text-slate-500">{role.permissionCount} permissões</span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  type="submit"
                  disabled={saving || !form.fullName || (!form.id && (!form.email || !form.password || form.roleCodes.length === 0))}
                  className="flex-1"
                >
                  {saving ? 'Salvando...' : form.id ? 'Salvar alterações' : 'Criar usuário'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Limpar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
