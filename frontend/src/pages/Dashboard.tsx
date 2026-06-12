import React, { useState, useEffect } from 'react';
import { RefreshCw, Box, Users, GitBranch, Radar, Shield, AlertTriangle, ArrowRight, Lock, Server, Wifi } from 'lucide-react';
import { BentoGrid, type BentoItem } from '../components/ui/bento-grid';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import api from '../services/api';

interface Stats { total_assets: number; total_users: number; total_relationships: number; total_scans: number; critical_assets: number; admin_users: number; }
interface Asset { id: number; name: string; asset_type: string; criticality: string; ip_address: string; }
interface AttackPath { id: number; name: string; steps: any; overall_risk: string; description: string; hop_count: number; }
interface Risk { overall_risk: number; risk_level: string; total_assets: number; total_users: number; critical_assets: number; high_assets: number; admin_users: number; domain_admins: number; orphaned_accounts: number; }

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [criticalAssets, setCriticalAssets] = useState<Asset[]>([]);
  const [paths, setPaths] = useState<AttackPath[]>([]);
  const [risk, setRisk] = useState<Risk | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/dashboard/stats'),
      api.get('/assets'),
      api.get('/attack-paths'),
      api.get('/risk/summary'),
    ]).then(([s, a, p, r]) => {
      setStats(s.data);
      setCriticalAssets((a.data || []).filter((x: Asset) => x.criticality === 'critical'));
      setPaths((p.data || []).slice(0, 5));
      setRisk(r.data);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex h-64 items-center justify-center"><RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" /></div>;

  const riskLabel = risk?.risk_level === 'critical' ? 'Crítico' : risk?.risk_level === 'high' ? 'Alto' : risk?.risk_level === 'medium' ? 'Médio' : 'Baixo';

  const bentoItems: BentoItem[] = [
    {
      title: "Total de Ativos",
      meta: `${stats?.total_assets || 0} descobertos`,
      description: "Ativos mapeados na rede incluindo servidores, estações e dispositivos de rede.",
      icon: <Box className="w-4 h-4 text-blue-500" />,
      status: "Ativo",
      tags: ["Inventário", "Rede", "Scan"],
      colSpan: 1,
      hasPersistentHover: true,
    },
    {
      title: "Usuários Mapeados",
      meta: `${stats?.total_users || 0} contas`,
      description: "Contas de usuário descobertas incluindo administradores e contas de serviço.",
      icon: <Users className="w-4 h-4 text-emerald-500" />,
      status: "Mapeado",
      tags: ["Active Directory", "Contas"],
    },
    {
      title: "Score de Risco",
      meta: `${risk?.overall_risk || 0}/100`,
      description: `Nível de risco geral: ${riskLabel}. Baseado em criticidade, exposição e privilégios.`,
      icon: <Shield className="w-4 h-4 text-amber-500" />,
      status: riskLabel,
      tags: ["Risco", "Score", "Análise"],
      colSpan: 1,
      hasPersistentHover: true,
    },
    {
      title: "Caminhos de Ataque",
      meta: `${paths.length} descobertos`,
      description: "Vetores de ataque identificados entre ativos com relacionamentos de risco.",
      icon: <GitBranch className="w-4 h-4 text-red-500" />,
      status: paths.length > 0 ? "Analisado" : "Pendente",
      tags: ["BFS", "Grafo", "Vetores"],
    },
    {
      title: "Ativos Críticos",
      meta: `${criticalAssets.length} encontrados`,
      description: criticalAssets.length > 0
        ? `${criticalAssets.map(a => a.name).join(', ')} — requerem atenção imediata.`
        : "Nenhum ativo crítico identificado no momento.",
      icon: <AlertTriangle className="w-4 h-4 text-red-500" />,
      status: criticalAssets.length > 0 ? "Alerta" : "Normal",
      tags: ["Crítico", "Prioridade"],
      colSpan: 2,
    },
    {
      title: "Domain Admins",
      meta: `${risk?.domain_admins || 0} contas`,
      description: "Contas com privilégios de Domain Admin — vetor primário de ataque para comprometimento do domínio.",
      icon: <Lock className="w-4 h-4 text-violet-500" />,
      status: (risk?.domain_admins || 0) > 0 ? "Atenção" : "Seguro",
      tags: ["Privilegiados", "AD", "Domain"],
    },
    {
      title: "Network Scan",
      meta: `${stats?.total_scans || 0} scans`,
      description: "Descoberta de ativos via Nmap para mapeamento automático da infraestrutura de rede.",
      icon: <Radar className="w-4 h-4 text-sky-500" />,
      status: "Disponível",
      tags: ["Nmap", "Discovery", "Hosts"],
    },
    {
      title: "Relacionamentos",
      meta: `${stats?.total_relationships || 0} conexões`,
      description: "Grafo de dependências entre ativos — administradores, servidores, estações e contas de serviço.",
      icon: <Wifi className="w-4 h-4 text-pink-500" />,
      status: "Mapeado",
      tags: ["Grafo", "Dependências"],
      colSpan: 2,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Visão geral da segurança da organização</p>
      </div>

      <BentoGrid items={bentoItems} />

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Ativos Críticos</CardTitle>
          </CardHeader>
          <CardContent>
            {criticalAssets.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Nenhum ativo crítico encontrado</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>IP</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {criticalAssets.map(a => (
                    <TableRow key={a.id}>
                      <TableCell className="font-medium">{a.name}</TableCell>
                      <TableCell><Badge variant="secondary">{a.asset_type}</Badge></TableCell>
                      <TableCell className="text-muted-foreground">{a.ip_address || '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Últimos Caminhos de Ataque</CardTitle>
          </CardHeader>
          <CardContent>
            {paths.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Nenhum caminho analisado</p>
            ) : (
              <div className="space-y-3">
                {paths.map(p => (
                  <div key={p.id} className="flex items-center justify-between rounded-lg border border-border bg-background p-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10">
                        <ArrowRight className="h-4 w-4 text-red-500" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{p.name}</p>
                        <p className="text-xs text-muted-foreground">{p.hop_count} hops</p>
                      </div>
                    </div>
                    <Badge variant={p.overall_risk === 'critical' ? 'critical' : p.overall_risk === 'high' ? 'warning' : 'info'}>
                      {p.overall_risk}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
