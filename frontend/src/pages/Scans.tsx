import React, { useState, useEffect } from 'react';
import { RefreshCw, Radar, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import api from '../services/api';

interface Scan { id: number; name: string; scan_type: string; status: string; targets: string; started_at: string; completed_at: string; }

export default function Scans() {
  const [scans, setScans] = useState<Scan[]>([]);
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [target, setTarget] = useState('');

  const load = () => {
    setLoading(true);
    Promise.all([api.get('/scans'), api.get('/assets')])
      .then(([s, a]) => { setScans(s.data); setAssets(a.data); })
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const startScan = () => {
    if (!target.trim()) return;
    setScanning(true);
    api.post('/scans', { name: `Scan ${target}`, scan_type: 'nmap', targets: target, timeout: 300 })
      .then(() => { setTarget(''); load(); })
      .finally(() => setScanning(false));
  };

  const remove = (id: number) => { if (window.confirm('Excluir este scan?')) api.delete(`/scans/${id}`).then(load); };

  const statusVariant = (s: string): "success" | "info" | "destructive" | "secondary" => s === 'completed' ? 'success' : s === 'running' ? 'info' : s === 'failed' ? 'destructive' : 'secondary';

  if (loading) return <div className="flex h-64 items-center justify-center"><RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Network Scan</h1>
        <p className="text-sm text-muted-foreground">Descoberta de ativos via Nmap</p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Novo Scan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Input value={target} onChange={e => setTarget(e.target.value)} placeholder="IP ou Range ex: 192.168.1.0/24" className="flex-1" />
            <Button onClick={startScan} disabled={scanning || !target.trim()}>
              <Radar className="h-4 w-4 mr-2" /> {scanning ? 'Escaneando...' : 'Iniciar Scan'}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">Usando nmap para descoberta de hosts e serviços</p>
        </CardContent>
      </Card>

      {scans.length === 0 ? (
        <Card><CardContent className="flex flex-col items-center justify-center py-12"><Radar className="h-10 w-10 text-muted-foreground mb-3" /><p className="text-sm text-muted-foreground">Nenhum scan realizado ainda</p></CardContent></Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Alvo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Início</TableHead>
                <TableHead>Fim</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {scans.map(s => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell><Badge variant="secondary">{s.scan_type}</Badge></TableCell>
                  <TableCell className="text-muted-foreground">{s.targets}</TableCell>
                  <TableCell><Badge variant={statusVariant(s.status)}>{s.status}</Badge></TableCell>
                  <TableCell className="text-muted-foreground text-xs">{s.started_at ? new Date(s.started_at).toLocaleString('pt-BR') : '—'}</TableCell>
                  <TableCell className="text-muted-foreground text-xs">{s.completed_at ? new Date(s.completed_at).toLocaleString('pt-BR') : '—'}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => remove(s.id)}><Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {assets.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Ativos Descobertos</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>IP</TableHead>
                  <TableHead>Criticidade</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assets.map((a: any) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">{a.name}</TableCell>
                    <TableCell><Badge variant="secondary">{a.asset_type}</Badge></TableCell>
                    <TableCell className="text-muted-foreground">{a.ip_address || '—'}</TableCell>
                    <TableCell><Badge variant={a.criticality === 'critical' ? 'critical' : a.criticality === 'high' ? 'warning' : a.criticality === 'medium' ? 'info' : 'secondary'}>{a.criticality}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
