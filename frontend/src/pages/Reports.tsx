import React, { useState, useEffect } from 'react';
import { RefreshCw, Calculator, FileText, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import api from '../services/api';

interface Risk { overall_risk: number; risk_level: string; total_assets: number; total_users: number; critical_assets: number; high_assets: number; admin_users: number; domain_admins: number; orphaned_accounts: number; }

export default function Reports() {
  const [risk, setRisk] = useState<Risk | null>(null);
  const [assets, setAssets] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [paths, setPaths] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const [r, a, u, p] = await Promise.all([api.get('/risk/summary'), api.get('/assets'), api.get('/users'), api.get('/attack-paths')]);
      setRisk(r.data); setAssets(a.data); setUsers(u.data); setPaths(p.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const calc = async () => {
    try { setCalculating(true); await api.post('/risk/calculate'); await load(); }
    catch (e) { alert('Erro ao calcular riscos'); }
    finally { setCalculating(false); }
  };

  if (loading) return <div className="flex h-64 items-center justify-center"><RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" /></div>;

  const riskVariant = (r: string): "critical" | "warning" | "info" | "secondary" => r === 'critical' ? 'critical' : r === 'high' ? 'warning' : r === 'medium' ? 'info' : 'secondary';
  const riskLabel = risk?.risk_level === 'critical' ? 'Crítico' : risk?.risk_level === 'high' ? 'Alto' : risk?.risk_level === 'medium' ? 'Médio' : 'Baixo';
  const barColor = risk?.risk_level === 'critical' ? 'bg-red-500' : risk?.risk_level === 'high' ? 'bg-amber-500' : risk?.risk_level === 'medium' ? 'bg-blue-500' : 'bg-emerald-500';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Relatórios</h1>
          <p className="text-sm text-muted-foreground">Análise de risco e métricas</p>
        </div>
        <Button onClick={calc} disabled={calculating}>
          <Calculator className="h-4 w-4 mr-2" /> {calculating ? 'Calculando...' : 'Recalcular Riscos'}
        </Button>
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Score Geral</p>
            <p className="text-3xl font-bold mt-1">{risk?.overall_risk || 0}</p>
            <div className="mt-2 h-1.5 rounded-full bg-secondary overflow-hidden">
              <div className={`h-full rounded-full ${barColor}`} style={{ width: `${risk?.overall_risk || 0}%` }} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Ativos Críticos</p>
            <p className="text-3xl font-bold mt-1 text-red-500">{risk?.critical_assets || 0}</p>
            <p className="text-xs text-muted-foreground mt-0.5">de {risk?.total_assets || 0} ativos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Domain Admins</p>
            <p className="text-3xl font-bold mt-1 text-amber-500">{risk?.domain_admins || 0}</p>
            <p className="text-xs text-muted-foreground mt-0.5">contas privilegiadas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Contas Órfãs</p>
            <p className="text-3xl font-bold mt-1 text-red-500">{risk?.orphaned_accounts || 0}</p>
            <p className="text-xs text-muted-foreground mt-0.5">sem proprietário</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm">Resumo Técnico</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: 'Ativos totais', value: assets.length, color: 'text-blue-500' },
              { label: 'Usuários mapeados', value: users.length, color: 'text-emerald-500' },
              { label: 'Caminhos de ataque', value: paths.length, color: 'text-amber-500' },
              { label: 'Ativos críticos', value: risk?.critical_assets || 0, color: 'text-red-500' },
              { label: 'Contas admin', value: risk?.admin_users || 0, color: 'text-amber-500' },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between rounded-md border border-border bg-background px-4 py-2.5">
                <span className="text-sm text-muted-foreground">{item.label}</span>
                <span className={`text-sm font-semibold ${item.color}`}>{item.value}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm">Relatório Executivo</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center rounded-lg border border-border bg-background p-6">
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Score de Risco Geral</p>
              <p className="text-6xl font-bold mt-2">{risk?.overall_risk || 0}</p>
              <Badge variant={riskVariant(risk?.risk_level || 'low')} className="mt-3 px-3 py-1">
                {riskLabel}
              </Badge>
              <div className="flex gap-12 mt-6 w-full justify-center">
                <div className="text-center">
                  <p className="text-xl font-bold">{risk?.total_assets || 0}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Ativos</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold">{risk?.total_users || 0}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Usuários</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
