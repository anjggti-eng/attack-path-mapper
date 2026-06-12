import React, { useEffect, useRef } from 'react';
import cytoscape from 'cytoscape';

interface GraphData {
  nodes: Array<{
    data: {
      id: string;
      label: string;
      type: string;
      criticality?: string;
      risk_score?: number;
    };
  }>;
  edges: Array<{
    data: {
      source: string;
      target: string;
      relation_type: string;
      privilege_level?: string;
    };
  }>;
}

interface Props {
  data: GraphData;
  onNodeClick?: (nodeId: string) => void;
}

const GraphVisualization: React.FC<Props> = ({ data, onNodeClick }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<cytoscape.Core | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    if (cyRef.current) {
      cyRef.current.destroy();
    }

    const cy = cytoscape({
      container: containerRef.current,
      elements: {
        nodes: data.nodes,
        edges: data.edges,
      },
      style: [
        {
          selector: 'node',
          style: {
            'background-color': '#3b82f6',
            label: 'data(label)',
            'text-valign': 'center',
            color: '#fff',
            'text-outline-width': 2,
            'text-outline-color': '#3b82f6',
            'font-size': '12px',
            width: 40,
            height: 40,
          },
        },
        {
          selector: 'node[type="server"]',
          style: {
            'background-color': '#ef4444',
            shape: 'rectangle',
          },
        },
        {
          selector: 'node[type="firewall"]',
          style: {
            'background-color': '#f59e0b',
            shape: 'diamond',
          },
        },
        {
          selector: 'node[type="user"]',
          style: {
            'background-color': '#10b981',
            shape: 'ellipse',
          },
        },
        {
          selector: 'node[criticality="critical"]',
          style: {
            'background-color': '#dc2626',
            'border-width': 3,
            'border-color': '#fbbf24',
          },
        },
        {
          selector: 'node[criticality="high"]',
          style: {
            'background-color': '#ea580c',
          },
        },
        {
          selector: 'edge',
          style: {
            width: 2,
            'line-color': '#374151',
            'target-arrow-color': '#374151',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
          },
        },
        {
          selector: 'edge[relation_type="admin_of"]',
          style: {
            'line-color': '#ef4444',
            'target-arrow-color': '#ef4444',
          },
        },
        {
          selector: 'edge[relation_type="has_access"]',
          style: {
            'line-color': '#f59e0b',
            'target-arrow-color': '#f59e0b',
          },
        },
      ],
      layout: {
        name: 'cose',
        idealEdgeLength: 100,
        nodeOverlap: 20,
        refresh: 20,
        randomize: false,
        componentSpacing: 100,
        nodeRepulsion: 400000,
        edgeElasticity: 100,
        nestingFactor: 1.2,
        gravity: 1,
        numIter: 1000,
        initialTemp: 200,
        coolingFactor: 0.95,
        minTemp: 1.0,
      } as any,
    });

    cy.on('tap', 'node', (evt) => {
      if (onNodeClick) {
        onNodeClick(evt.target.id());
      }
    });

    cyRef.current = cy;

    return () => {
      if (cyRef.current) {
        cyRef.current.destroy();
      }
    };
  }, [data, onNodeClick]);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '600px',
        background: '#0a0e17',
        borderRadius: '8px',
      }}
    />
  );
};

export default GraphVisualization;
