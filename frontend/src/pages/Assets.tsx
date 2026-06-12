import React, { useState, useEffect } from 'react';
import { RefreshCw, Plus, Trash2, Box } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import api from '../services/api';

interface Asset { id: number; name: string; asset_type: string; ip_address: string; os: string; criticality: string; exposure: string; }

export default function Assets() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', asset_type: 'server', ip_address: '', os: '', criticality: 'medium', exposure: 'internal' });
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  const load = () => { setLoading(true); api.get('/assets').then(r => setAssets(r.data)).finally(() => setLoading(false)); };
  useEffect(() => { load(); }, []);

  const create = () => {
    if (!form.name.trim()) return;
    api.post('/assets', form).then(() => { setShowModal(false); setForm({ name: '', asset_type: 'server', ip_address: '', os: '', criticality: 'medium', exposure: 'internal' }); load(); });
  };

  const remove = (id: number) => { if (window.confirm('Excluir este ativo?')) api.delete(`/assets/${id}`).then(load); };

  const filtered = assets.filter(a => {
    const matchSearch = !search || a.name.toLowerCase().includes(search.toLowerCase()) || a.ip_address?.includes(search);
    const matchType = typeFilter === 'all' || a.asset_type === typeFilter;
    return matchSearch && matchType;
  });

  const riskVariant = (c: string): "critical" | "warning" | "info" | "secondary" => c === 'critical' ? 'critical' : c === 'high' ? 'warning' : c === 'medium' ? 'info' : 'secondary';

  if (loading) return <div className="flex h-64 items-center justify-center"><RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Ativos</h1>
          <p className="text-sm text-muted-foreground">{assets.length} ativos mapeados</p>
        </div>
        <Button onClick={() => setShowModal(true)}><Plus className="h-4 w-4 mr-2" /> Novo Ativo</Button>
      </div>

      <div className="flex gap-3">
        <Input placeholder="Buscar ativos..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-sm" />
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Tipo" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            <SelectItem value="server">Servidores</SelectItem>
            <SelectItem value="workstation">Estações</SelectItem>
            <SelectItem value="network_device">Rede</SelectItem>
            <SelectItem value="user_account">Usuários</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <Card><CardContent className="flex flex-col items-center justify-center py-12"><Box className="h-10 w-10 text-muted-foreground mb-3" /><p className="text-sm text-muted-foreground">Nenhum ativo encontrado</p></CardContent></Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>IP</TableHead>
                <TableHead>OS</TableHead>
                <TableHead>Criticidade</TableHead>
                <TableHead>Exposição</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(a => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">{a.name}</TableCell>
                  <TableCell><Badge variant="secondary">{a.asset_type}</Badge></TableCell>
                  <TableCell className="text-muted-foreground">{a.ip_address || '—'}</TableCell>
                  <TableCell className="text-muted-foreground">{a.os || '—'}</TableCell>
                  <TableCell><Badge variant={riskVariant(a.criticality)}>{a.criticality}</Badge></TableCell>
                  <TableCell><Badge variant={a.exposure === 'external' ? 'destructive' : 'secondary'}>{a.exposure}</Badge></TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => remove(a.id)}><Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" /></Button>
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
            <DialogTitle>Novo Ativo</DialogTitle>
            <DialogDescription>Adicione um novo ativo à inventário.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome *</Label>
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="ex: SRV-DC01" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={form.asset_type} onValueChange={v => setForm({ ...form, asset_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="server">Servidor</SelectItem>
                    <SelectItem value="workstation">Estação</SelectItem>
                    <SelectItem value="network_device">Dispositivo de Rede</SelectItem>
                    <SelectItem value="user_account">Conta de Usuário</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>IP</Label>
                <Input value={form.ip_address} onChange={e => setForm({ ...form, ip_address: e.target.value })} placeholder="192.168.1.10" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Sistema Operacional</Label>
              <Input value={form.os} onChange={e => setForm({ ...form, os: e.target.value })} placeholder="Windows Server 2022" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Criticidade</Label>
                <Select value={form.criticality} onValueChange={v => setForm({ ...form, criticality: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="critical">Crítico</SelectItem>
                    <SelectItem value="high">Alto</SelectItem>
                    <SelectItem value="medium">Médio</SelectItem>
                    <SelectItem value="low">Baixo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Exposição</Label>
                <Select value={form.exposure} onValueChange={v => setForm({ ...form, exposure: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="internal">Interno</SelectItem>
                    <SelectItem value="external">Externo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowModal(false)}>Cancelar</Button>
              <Button onClick={create} disabled={!form.name.trim()}>Criar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
