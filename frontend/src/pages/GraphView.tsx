import React, { useState, useEffect, useRef, useCallback } from 'react';
import { RefreshCw, Maximize2, ZoomIn, ZoomOut } from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import api from '../services/api';

export default function GraphView() {
  const cyRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const mountedRef = useRef(true);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState<any>(null);

  useEffect(() => {
    mountedRef.current = true;
    let cy: any = null;

    import('cytoscape').then(cyto => {
      if (!mountedRef.current || !containerRef.current) return;

      api.get('/graph').then(r => {
        if (!mountedRef.current || !containerRef.current) return;

        const { nodes, edges } = r.data;

        const elements = [
          ...nodes.map((n: any) => ({
            data: { id: String(n.id), label: n.label, type: n.type, criticality: n.criticality },
            classes: `node-${n.type} crit-${n.criticality || 'none'}`
          })),
          ...edges.map((e: any) => ({
            data: { id: `e${e.id}`, source: String(e.source_asset_id), target: String(e.target_asset_id), label: e.relationship_type },
            classes: `edge-${e.relationship_type}`
          }))
        ];

        cy = cyto.default({
          container: containerRef.current,
          elements,
          style: [
            { selector: 'node', style: { 'label': 'data(label)', 'background-color': '#3b82f6', 'color': '#fff', 'text-valign': 'center', 'text-halign': 'center', 'font-size': '11px', 'width': 50, 'height': 50, 'border-width': 2, 'border-color': '#1e40af', 'text-wrap': 'wrap', 'text-max-width': '80px' } },
            { selector: 'node.node-user_account', style: { 'shape': 'round-rectangle', 'background-color': '#22c55e', 'border-color': '#15803d' } },
            { selector: 'node.node-network_device', style: { 'shape': 'diamond', 'background-color': '#f59e0b', 'border-color': '#b45309' } },
            { selector: 'node.node-server', style: { 'background-color': '#3b82f6', 'border-color': '#1e40af' } },
            { selector: 'node.node-workstation', style: { 'background-color': '#8b5cf6', 'border-color': '#6d28d9' } },
            { selector: 'node.crit-critical', style: { 'border-width': 3, 'border-color': '#ef4444', 'background-color': '#dc2626' } },
            { selector: 'node.crit-high', style: { 'border-width': 3, 'border-color': '#f59e0b' } },
            { selector: 'edge', style: { 'width': 2, 'line-color': '#3a3a44', 'target-arrow-color': '#3a3a44', 'target-arrow-shape': 'triangle', 'curve-style': 'bezier', 'label': 'data(label)', 'font-size': '9px', 'color': '#71717a', 'text-background-color': '#18181b', 'text-background-opacity': 0.8, 'text-background-padding': '2px' } },
            { selector: 'edge.edge-admin', style: { 'line-color': '#ef4444', 'target-arrow-color': '#ef4444' } },
            { selector: 'edge.edge-manages', style: { 'line-color': '#22c55e', 'target-arrow-color': '#22c55e' } },
          ],
          layout: {
            name: 'preset',
            positions: (node: any) => {
              const id = node.id();
              const idx = nodes.findIndex((n: any) => String(n.id) === id);
              const total = nodes.length || 1;
              const angle = (2 * Math.PI * idx) / total;
              const radius = 150;
              return {
                x: (containerRef.current?.clientWidth || 600) / 2 + radius * Math.cos(angle),
                y: (containerRef.current?.clientHeight || 500) / 2 + radius * Math.sin(angle),
              };
            },
            fit: true,
            padding: 50,
          },
          minZoom: 0.2,
          maxZoom: 3,
          userZoomingEnabled: true,
          userPanningEnabled: true,
        });

        if (!mountedRef.current) { cy.destroy(); return; }

        cy.on('tap', 'node', (e: any) => {
          if (!mountedRef.current) return;
          const node = e.target;
          const neighbors = node.neighborhood().elements();
          cy.elements().removeClass('highlighted');
          node.addClass('highlighted');
          neighbors.addClass('highlighted');
          setSelectedNode({ id: node.id(), label: node.data('label'), type: node.data('type'), criticality: node.data('criticality'), neighbors: neighbors.length });
        });

        cy.on('tap', (e: any) => {
          if (!mountedRef.current) return;
          if (e.target === cy) { cy.elements().removeClass('highlighted'); setSelectedNode(null); }
        });

        cyRef.current = cy;
        setLoading(false);
      }).catch(() => { if (mountedRef.current) setLoading(false); });
    });

    return () => {
      mountedRef.current = false;
      if (cy) {
        cy.removeAllListeners();
        cy.destroy();
        cy = null;
      }
      cyRef.current = null;
    };
  }, []);

  const zoomIn = useCallback(() => {
    const cy = cyRef.current;
    if (!cy || cy.destroyed()) return;
    cy.zoom({ level: cy.zoom() * 1.3, renderedPosition: { x: (containerRef.current?.clientWidth || 0) / 2, y: (containerRef.current?.clientHeight || 0) / 2 } });
  }, []);

  const zoomOut = useCallback(() => {
    const cy = cyRef.current;
    if (!cy || cy.destroyed()) return;
    cy.zoom({ level: cy.zoom() * 0.7, renderedPosition: { x: (containerRef.current?.clientWidth || 0) / 2, y: (containerRef.current?.clientHeight || 0) / 2 } });
  }, []);

  const fitGraph = useCallback(() => {
    const cy = cyRef.current;
    if (!cy || cy.destroyed()) return;
    cy.fit(undefined, 50);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Grafo de Relacionamentos</h1>
          <p className="text-sm text-muted-foreground">Visualização interativa dos ativos e suas conexões</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={zoomIn}><ZoomIn className="h-4 w-4" /></Button>
          <Button variant="outline" size="icon" onClick={zoomOut}><ZoomOut className="h-4 w-4" /></Button>
          <Button variant="outline" size="icon" onClick={fitGraph}><Maximize2 className="h-4 w-4" /></Button>
        </div>
      </div>

      <Card className="relative overflow-hidden">
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-card">
            <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        )}
        <div ref={containerRef} className="w-full h-[500px] bg-background rounded-lg" />
      </Card>

      {selectedNode && (
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Selecionado</p>
              <p className="text-sm font-semibold mt-0.5">{selectedNode.label}</p>
            </div>
            <Badge variant="secondary">{selectedNode.type}</Badge>
            {selectedNode.criticality && (
              <Badge variant={selectedNode.criticality === 'critical' ? 'critical' : selectedNode.criticality === 'high' ? 'warning' : 'info'}>
                {selectedNode.criticality}
              </Badge>
            )}
            <Badge variant="info">{selectedNode.neighbors} vizinhos</Badge>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
