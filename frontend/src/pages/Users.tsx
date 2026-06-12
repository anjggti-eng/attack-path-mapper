import React, { useState, useEffect } from 'react';
import { RefreshCw, Plus, Trash2, Users as UsersIcon } from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import api from '../services/api';

interface User { id: number; username: string; email: string; role: string; is_domain_admin: boolean; is_active: boolean; }

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ username: '', email: '', role: 'user', is_domain_admin: false, password: 'P@ssw0rd!' });
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const load = () => { setLoading(true); api.get('/users').then(r => setUsers(r.data)).finally(() => setLoading(false)); };
  useEffect(() => { load(); }, []);

  const create = () => {
    if (!form.username.trim()) return;
    api.post('/users', form).then(() => { setShowModal(false); setForm({ username: '', email: '', role: 'user', is_domain_admin: false, password: 'P@ssw0rd!' }); load(); });
  };

  const remove = (id: number) => { if (window.confirm('Excluir este usuário?')) api.delete(`/users/${id}`).then(load); };

  const filtered = users.filter(u => {
    const matchSearch = !search || u.username.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const roleVariant = (r: string): "destructive" | "warning" | "secondary" => r === 'admin' ? 'destructive' : r === 'service' ? 'warning' : 'secondary';

  if (loading) return <div className="flex h-64 items-center justify-center"><RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Usuários</h1>
          <p className="text-sm text-muted-foreground">{users.length} usuários mapeados</p>
        </div>
        <Button onClick={() => setShowModal(true)}><Plus className="h-4 w-4 mr-2" /> Novo Usuário</Button>
      </div>

      <div className="flex gap-3">
        <Input placeholder="Buscar usuários..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-sm" />
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Função" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as funções</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="user">Usuário</SelectItem>
            <SelectItem value="service">Serviço</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <Card><CardContent className="flex flex-col items-center justify-center py-12"><UsersIcon className="h-10 w-10 text-muted-foreground mb-3" /><p className="text-sm text-muted-foreground">Nenhum usuário encontrado</p></CardContent></Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Username</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Função</TableHead>
                <TableHead>Domain Admin</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(u => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.username}</TableCell>
                  <TableCell className="text-muted-foreground">{u.email || '—'}</TableCell>
                  <TableCell><Badge variant={roleVariant(u.role)}>{u.role}</Badge></TableCell>
                  <TableCell>{u.is_domain_admin ? <Badge variant="destructive">Sim</Badge> : <Badge variant="secondary">Não</Badge>}</TableCell>
                  <TableCell>{u.is_active ? <Badge variant="success">Ativo</Badge> : <Badge variant="secondary">Inativo</Badge>}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => remove(u.id)}><Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Usuário</DialogTitle>
            <DialogDescription>Adicione um novo usuário ao sistema.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Username *</Label>
              <Input value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} placeholder="jose.silva" />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="jose@empresa.local" />
            </div>
            <div className="space-y-2">
              <Label>Função</Label>
              <Select value={form.role} onValueChange={v => setForm({ ...form, role: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Usuário</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="service">Serviço</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Senha</Label>
              <Input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="da" checked={form.is_domain_admin} onChange={e => setForm({ ...form, is_domain_admin: e.target.checked })} className="rounded border-gray-300" />
              <Label htmlFor="da">Domain Admin</Label>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowModal(false)}>Cancelar</Button>
              <Button onClick={create} disabled={!form.username.trim()}>Criar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
