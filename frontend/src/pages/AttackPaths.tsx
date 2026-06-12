import React, { useState, useEffect } from 'react';
import { RefreshCw, GitBranch, AlertTriangle, ArrowRight, Layers } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import api from '../services/api';

interface Path { id: number; name: string; description: string; source_asset_id: number; target_asset_id: number; steps: any[]; hop_count: number; overall_risk: string; is_valid: boolean; }
interface Asset { id: number; name: string; }

export default function AttackPaths() {
  const [paths, setPaths] = useState<Path[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [selected, setSelected] = useState<Path | null>(null);
  const [riskFilter, setRiskFilter] = useState('all');
  const [search, setSearch] = useState('');

  const load = () => {
    setLoading(true);
    Promise.all([api.get('/attack-paths'), api.get('/assets')])
      .then(([p, a]) => { setPaths(p.data); setAssets(a.data); })
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const analyze = () => {
    setAnalyzing(true);
    api.post('/attack-paths/analyze').then(load).finally(() => setAnalyzing(false));
  };

  const assetName = (id: number) => assets.find(a => a.id === id)?.name || `#${id}`;

  const riskVariant = (r: string): "critical" | "warning" | "info" | "secondary" => r === 'critical' ? 'critical' : r === 'high' ? 'warning' : r === 'medium' ? 'info' : 'secondary';

  const filtered = paths.filter(p => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.description?.toLowerCase().includes(search.toLowerCase());
    const matchRisk = riskFilter === 'all' || p.overall_risk === riskFilter;
    return matchSearch && matchRisk;
  });

  const stepColors = ['bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-red-500', 'bg-violet-500'];

  if (loading) return <div className="flex h-64 items-center justify-center"><RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Caminhos de Ataque</h1>
          <p className="text-sm text-muted-foreground">{paths.length} caminhos descobertos</p>
        </div>
        <Button onClick={analyze} disabled={analyzing}><GitBranch className="h-4 w-4 mr-2" /> {analyzing ? 'Analisando...' : 'Analisar Caminhos'}</Button>
      </div>

      <div className="flex gap-3">
        <Input placeholder="Buscar caminhos..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-sm" />
        <Select value={riskFilter} onValueChange={setRiskFilter}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Risco" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os riscos</SelectItem>
            <SelectItem value="critical">Crítico</SelectItem>
            <SelectItem value="high">Alto</SelectItem>
            <SelectItem value="medium">Médio</SelectItem>
            <SelectItem value="low">Baixo</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-[1fr_1fr]">
        <div className="space-y-2 max-h-[calc(100vh-240px)] overflow-y-auto pr-1">
          {filtered.length === 0 ? (
            <Card><CardContent className="flex flex-col items-center justify-center py-12"><AlertTriangle className="h-10 w-10 text-muted-foreground mb-3" /><p className="text-sm text-muted-foreground">Nenhum caminho encontrado</p></CardContent></Card>
          ) : (
            filtered.map(p => (
              <Card key={p.id} className={`cursor-pointer transition-colors hover:border-primary ${selected?.id === p.id ? 'border-primary' : ''}`} onClick={() => setSelected(p)}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold">{p.name}</span>
                    <Badge variant={riskVariant(p.overall_risk)}>{p.overall_risk}</Badge>
                  </div>
                  {p.description && <p className="text-xs text-muted-foreground mb-2">{p.description}</p>}
                  <Badge variant="secondary"><Layers className="h-3 w-3 mr-1" /> {p.hop_count} hops</Badge>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <Card className="sticky top-0">
          {selected ? (
            <CardContent className="p-5">
              <div className="mb-4">
                <h3 className="text-base font-semibold">{selected.name}</h3>
                <div className="flex gap-2 mt-2">
                  <Badge variant={riskVariant(selected.overall_risk)}>{selected.overall_risk}</Badge>
                  <Badge variant="secondary">{selected.hop_count} hops</Badge>
                </div>
              </div>

              <div className="mb-5">
                <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-3">Vetor de Ataque</p>
                {(selected.steps || []).map((step: any, i: number) => (
                  <div key={i}>
                    <div className="flex items-center gap-3">
                      <div className={`flex h-7 w-7 items-center justify-center rounded-full text-white text-[11px] font-bold ${stepColors[i % 5]}`}>{i + 1}</div>
                      <div>
                        <p className="text-sm font-medium">{step.description || `Step ${i + 1}`}</p>
                        {step.technique && <p className="text-xs text-muted-foreground">{step.technique}</p>}
                      </div>
                    </div>
                    {i < (selected.steps?.length || 0) - 1 && (
                      <div className="ml-3 border-l-2 border-dashed border-border h-4 ml-[13px]" />
                    )}
                  </div>
                ))}
              </div>

              <div className="border-t border-border pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Origem</span>
                  <span className="font-medium">{assetName(selected.source_asset_id)}</span>
                </div>
                <div className="flex justify-center"><ArrowRight className="h-4 w-4 text-muted-foreground" /></div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Alvo</span>
                  <span className="font-medium">{assetName(selected.target_asset_id)}</span>
                </div>
              </div>
            </CardContent>
          ) : (
            <CardContent className="flex flex-col items-center justify-center py-16">
              <AlertTriangle className="h-10 w-10 text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">Selecione um caminho para ver detalhes</p>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}
