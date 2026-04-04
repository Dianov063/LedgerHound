'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import {
  Search,
  Loader2,
  Download,
  ZoomIn,
  ZoomOut,
  Maximize2,
  X,
  ExternalLink,
  ChevronRight,
  GitBranch,
  Circle,
  AlertTriangle,
  Network,
  LayoutGrid,
} from 'lucide-react';

interface GraphNode {
  id: string;
  label: string;
  type: 'source' | 'exchange' | 'mixer' | 'defi' | 'intermediate' | 'unknown';
  totalIn: number;
  totalOut: number;
  txCount: number;
}

interface GraphEdge {
  source: string;
  target: string;
  value: number;
  token: string;
  hash: string;
  timestamp: string;
}

interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
  knownEntities: string[];
  totalNodes: number;
  totalEdges: number;
  maxReached: boolean;
}

const NODE_COLORS: Record<string, string> = {
  source: '#6366f1',
  exchange: '#22c55e',
  mixer: '#ef4444',
  defi: '#f59e0b',
  intermediate: '#64748b',
  unknown: '#94a3b8',
};

const NODE_LABELS: Record<string, string> = {
  source: 'Source',
  exchange: 'Exchange',
  mixer: 'Mixer',
  defi: 'DeFi',
  intermediate: 'Intermediate',
  unknown: 'Unknown',
};

export default function GraphTracer() {
  const t = useTranslations('graph');
  const [address, setAddress] = useState('');
  const [depth, setDepth] = useState(2);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState('');
  const [data, setData] = useState<GraphData | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [layout, setLayout] = useState<'breadthfirst' | 'cose'>('breadthfirst');
  const cyRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const initCytoscape = useCallback(
    async (graphData: GraphData) => {
      if (!containerRef.current) return;

      const cytoscape = (await import('cytoscape')).default;

      if (cyRef.current) {
        cyRef.current.destroy();
      }

      const elements: any[] = [];

      for (const node of graphData.nodes) {
        elements.push({
          group: 'nodes',
          data: {
            id: node.id,
            label: node.label,
            type: node.type,
            totalIn: node.totalIn,
            totalOut: node.totalOut,
            txCount: node.txCount,
          },
        });
      }

      for (let i = 0; i < graphData.edges.length; i++) {
        const edge = graphData.edges[i];
        elements.push({
          group: 'edges',
          data: {
            id: `e${i}`,
            source: edge.source,
            target: edge.target,
            value: edge.value,
            token: edge.token,
            hash: edge.hash,
            timestamp: edge.timestamp,
            label: `${edge.value?.toFixed(4) || '0'} ${edge.token}`,
          },
        });
      }

      const cy = cytoscape({
        container: containerRef.current,
        elements,
        style: [
          {
            selector: 'node',
            style: {
              label: 'data(label)',
              'text-valign': 'bottom',
              'text-halign': 'center',
              'font-size': '10px',
              color: '#e2e8f0',
              'text-margin-y': 8,
              'background-color': (ele: any) => NODE_COLORS[ele.data('type')] || '#94a3b8',
              width: (ele: any) => Math.max(25, Math.min(60, 25 + ele.data('txCount') * 3)),
              height: (ele: any) => Math.max(25, Math.min(60, 25 + ele.data('txCount') * 3)),
              'border-width': (ele: any) => (ele.data('type') === 'source' ? 3 : 1),
              'border-color': (ele: any) =>
                ele.data('type') === 'source' ? '#a5b4fc' : 'rgba(255,255,255,0.1)',
              'text-outline-width': 2,
              'text-outline-color': '#0f172a',
              'text-wrap': 'ellipsis',
              'text-max-width': '80px',
            } as any,
          },
          {
            selector: 'edge',
            style: {
              width: (ele: any) => Math.max(1, Math.min(5, ele.data('value') * 0.5)),
              'line-color': '#475569',
              'target-arrow-color': '#475569',
              'target-arrow-shape': 'triangle',
              'curve-style': 'bezier',
              opacity: 0.6,
              label: 'data(label)',
              'font-size': '8px',
              color: '#94a3b8',
              'text-rotation': 'autorotate',
              'text-outline-width': 1.5,
              'text-outline-color': '#0f172a',
            } as any,
          },
          {
            selector: 'node:selected',
            style: {
              'border-width': 3,
              'border-color': '#6366f1',
              'overlay-color': '#6366f1',
              'overlay-opacity': 0.15,
            },
          },
          {
            selector: 'node.highlighted',
            style: {
              'border-width': 3,
              'border-color': '#f59e0b',
            },
          },
          {
            selector: 'edge.highlighted',
            style: {
              'line-color': '#f59e0b',
              'target-arrow-color': '#f59e0b',
              opacity: 1,
              width: 3,
            },
          },
        ] as any,
        layout: {
          name: layout === 'breadthfirst' ? 'breadthfirst' : 'cose',
          directed: true,
          padding: 40,
          spacingFactor: 1.5,
          animate: true,
          animationDuration: 500,
          ...(layout === 'cose'
            ? {
                nodeRepulsion: () => 8000,
                idealEdgeLength: () => 100,
                gravity: 0.5,
              }
            : {}),
        } as any,
        minZoom: 0.2,
        maxZoom: 3,
        wheelSensitivity: 0.3,
      });

      cy.on('tap', 'node', (evt: any) => {
        const nodeData = evt.target.data();
        const node = graphData.nodes.find((n) => n.id === nodeData.id);
        if (node) {
          setSelectedNode(node);
          cy.elements().removeClass('highlighted');
          evt.target.addClass('highlighted');
          evt.target.connectedEdges().addClass('highlighted');
          evt.target.neighborhood('node').addClass('highlighted');
        }
      });

      cy.on('tap', (evt: any) => {
        if (evt.target === cy) {
          setSelectedNode(null);
          cy.elements().removeClass('highlighted');
        }
      });

      cyRef.current = cy;
    },
    [layout]
  );

  useEffect(() => {
    if (data) {
      initCytoscape(data);
    }
  }, [data, layout, initCytoscape]);

  const handleTrace = async () => {
    if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
      setError(t('error_invalid'));
      return;
    }

    setLoading(true);
    setError('');
    setData(null);
    setSelectedNode(null);
    setProgress(t('progress_hop', { current: 1, total: depth }));

    try {
      const res = await fetch('/api/trace-graph', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, depth }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Trace failed');

      setData(json);
      setProgress('');
    } catch (err: any) {
      setError(err.message || t('error_failed'));
    } finally {
      setLoading(false);
    }
  };

  const handleZoomIn = () => cyRef.current?.zoom(cyRef.current.zoom() * 1.3);
  const handleZoomOut = () => cyRef.current?.zoom(cyRef.current.zoom() / 1.3);
  const handleFit = () => cyRef.current?.fit(undefined, 40);

  const handleExportPNG = () => {
    if (!cyRef.current) return;
    const png = cyRef.current.png({ full: true, scale: 2, bg: '#0f172a' });
    const link = document.createElement('a');
    link.download = `ledgerhound-graph-${address.slice(0, 8)}.png`;
    link.href = png;
    link.click();
  };

  const handleExportJSON = () => {
    if (!data) return;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.download = `ledgerhound-graph-${address.slice(0, 8)}.json`;
    link.href = URL.createObjectURL(blob);
    link.click();
  };

  return (
    <div className="bg-slate-950 min-h-screen">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-8">
        {/* Search Bar */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder={t('placeholder')}
                className="w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-xl pl-11 pr-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono"
                onKeyDown={(e) => e.key === 'Enter' && handleTrace()}
              />
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2">
                <span className="text-slate-400 text-sm whitespace-nowrap">{t('depth')}:</span>
                <select
                  value={depth}
                  onChange={(e) => setDepth(Number(e.target.value))}
                  className="bg-transparent text-white text-sm focus:outline-none cursor-pointer"
                >
                  <option value={1}>1 {t('hop')}</option>
                  <option value={2}>2 {t('hops')}</option>
                  <option value={3}>3 {t('hops')}</option>
                </select>
              </div>

              <button
                onClick={handleTrace}
                disabled={loading || !address}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-semibold px-6 py-3.5 rounded-xl transition-colors text-sm whitespace-nowrap"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    {t('tracing')}
                  </>
                ) : (
                  <>
                    <GitBranch size={16} />
                    {t('trace_btn')}
                  </>
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="mt-4 flex items-center gap-2 text-red-400 text-sm bg-red-950/50 border border-red-900 rounded-lg px-4 py-2.5">
              <AlertTriangle size={14} />
              {error}
            </div>
          )}

          {loading && progress && (
            <div className="mt-4 flex items-center gap-3">
              <div className="flex-1 bg-slate-800 rounded-full h-2 overflow-hidden">
                <div className="bg-indigo-500 h-full rounded-full animate-pulse" style={{ width: '60%' }} />
              </div>
              <span className="text-slate-400 text-xs whitespace-nowrap">{progress}</span>
            </div>
          )}
        </div>

        {/* Graph Area */}
        <div className="relative">
          <div
            ref={containerRef}
            className={`bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden transition-all ${
              data ? 'h-[600px]' : 'h-[400px]'
            }`}
            style={{ minHeight: data ? 600 : 400 }}
          >
            {!data && !loading && (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Network size={48} className="mx-auto text-slate-700 mb-4" />
                  <p className="text-slate-500 text-sm">{t('empty_state')}</p>
                </div>
              </div>
            )}
            {loading && !data && (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Loader2 size={40} className="mx-auto text-indigo-500 mb-4 animate-spin" />
                  <p className="text-slate-400 text-sm">{t('loading')}</p>
                  <p className="text-slate-600 text-xs mt-1">{progress}</p>
                </div>
              </div>
            )}
          </div>

          {/* Controls overlay */}
          {data && (
            <>
              {/* Zoom controls - top right */}
              <div className="absolute top-4 right-4 flex flex-col gap-1.5">
                <button
                  onClick={handleZoomIn}
                  className="bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-white p-2 rounded-lg transition-colors"
                  title="Zoom in"
                >
                  <ZoomIn size={16} />
                </button>
                <button
                  onClick={handleZoomOut}
                  className="bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-white p-2 rounded-lg transition-colors"
                  title="Zoom out"
                >
                  <ZoomOut size={16} />
                </button>
                <button
                  onClick={handleFit}
                  className="bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-white p-2 rounded-lg transition-colors"
                  title="Fit to view"
                >
                  <Maximize2 size={16} />
                </button>
              </div>

              {/* Layout toggle - top left */}
              <div className="absolute top-4 left-4 flex gap-1.5">
                <button
                  onClick={() => setLayout('breadthfirst')}
                  className={`flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border transition-colors ${
                    layout === 'breadthfirst'
                      ? 'bg-indigo-600 border-indigo-500 text-white'
                      : 'bg-slate-800/90 border-slate-700 text-slate-400 hover:text-white'
                  }`}
                >
                  <GitBranch size={12} />
                  {t('layout_tree')}
                </button>
                <button
                  onClick={() => setLayout('cose')}
                  className={`flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border transition-colors ${
                    layout === 'cose'
                      ? 'bg-indigo-600 border-indigo-500 text-white'
                      : 'bg-slate-800/90 border-slate-700 text-slate-400 hover:text-white'
                  }`}
                >
                  <LayoutGrid size={12} />
                  {t('layout_force')}
                </button>
              </div>

              {/* Stats bar - bottom */}
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                <div className="flex items-center gap-4 bg-slate-800/90 border border-slate-700 rounded-lg px-4 py-2">
                  <span className="text-slate-400 text-xs">
                    {t('nodes')}: <span className="text-white font-semibold">{data.totalNodes}</span>
                  </span>
                  <span className="text-slate-400 text-xs">
                    {t('edges')}: <span className="text-white font-semibold">{data.totalEdges}</span>
                  </span>
                  {data.knownEntities.length > 0 && (
                    <span className="text-emerald-400 text-xs">
                      {t('identified')}: {data.knownEntities.join(', ')}
                    </span>
                  )}
                  {data.maxReached && (
                    <span className="text-amber-400 text-xs flex items-center gap-1">
                      <AlertTriangle size={10} />
                      {t('max_reached')}
                    </span>
                  )}
                </div>

                {/* Export buttons */}
                <div className="flex gap-1.5">
                  <button
                    onClick={handleExportPNG}
                    className="flex items-center gap-1.5 bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs px-3 py-2 rounded-lg transition-colors"
                  >
                    <Download size={12} />
                    PNG
                  </button>
                  <button
                    onClick={handleExportJSON}
                    className="flex items-center gap-1.5 bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs px-3 py-2 rounded-lg transition-colors"
                  >
                    <Download size={12} />
                    JSON
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Legend */}
        {data && (
          <div className="mt-4 flex flex-wrap items-center gap-4 bg-slate-900 border border-slate-800 rounded-xl px-5 py-3">
            <span className="text-slate-500 text-xs font-medium uppercase tracking-wider">{t('legend')}:</span>
            {Object.entries(NODE_COLORS).map(([type, color]) => (
              <div key={type} className="flex items-center gap-1.5">
                <Circle size={10} fill={color} color={color} />
                <span className="text-slate-400 text-xs capitalize">{NODE_LABELS[type]}</span>
              </div>
            ))}
          </div>
        )}

        {/* Side Panel */}
        {selectedNode && (
          <div className="fixed top-0 right-0 h-full w-96 max-w-full bg-slate-900 border-l border-slate-800 shadow-2xl z-50 overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-white font-display font-bold text-lg">{t('node_details')}</h3>
                <button
                  onClick={() => setSelectedNode(null)}
                  className="text-slate-500 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Node type badge */}
              <div className="mb-4">
                <span
                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full"
                  style={{
                    backgroundColor: `${NODE_COLORS[selectedNode.type]}20`,
                    color: NODE_COLORS[selectedNode.type],
                  }}
                >
                  <Circle size={8} fill="currentColor" />
                  {NODE_LABELS[selectedNode.type]}
                </span>
              </div>

              {/* Address */}
              <div className="mb-6">
                <p className="text-slate-500 text-xs mb-1">{t('address')}</p>
                <p className="text-white font-mono text-sm break-all">{selectedNode.label}</p>
                <p className="text-slate-600 font-mono text-xs mt-1 break-all">{selectedNode.id}</p>
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="bg-slate-800 rounded-xl p-3 text-center">
                  <p className="text-emerald-400 font-bold text-lg">{selectedNode.totalIn.toFixed(2)}</p>
                  <p className="text-slate-500 text-xs">{t('total_in')}</p>
                </div>
                <div className="bg-slate-800 rounded-xl p-3 text-center">
                  <p className="text-red-400 font-bold text-lg">{selectedNode.totalOut.toFixed(2)}</p>
                  <p className="text-slate-500 text-xs">{t('total_out')}</p>
                </div>
                <div className="bg-slate-800 rounded-xl p-3 text-center">
                  <p className="text-indigo-400 font-bold text-lg">{selectedNode.txCount}</p>
                  <p className="text-slate-500 text-xs">{t('tx_count')}</p>
                </div>
              </div>

              {/* Connected edges */}
              {data && (
                <div className="mb-6">
                  <p className="text-slate-500 text-xs font-medium uppercase tracking-wider mb-3">{t('transactions')}</p>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {data.edges
                      .filter((e) => e.source === selectedNode.id || e.target === selectedNode.id)
                      .slice(0, 20)
                      .map((edge, i) => (
                        <div key={i} className="bg-slate-800 rounded-lg px-3 py-2.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className={edge.source === selectedNode.id ? 'text-red-400' : 'text-emerald-400'}>
                              {edge.source === selectedNode.id ? t('sent') : t('received')}
                            </span>
                            <span className="text-white font-mono">
                              {edge.value?.toFixed(4)} {edge.token}
                            </span>
                          </div>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-slate-600 font-mono text-[10px]">
                              {edge.source === selectedNode.id
                                ? `→ ${edge.target.slice(0, 10)}...`
                                : `← ${edge.source.slice(0, 10)}...`}
                            </span>
                            {edge.hash && (
                              <a
                                href={`https://etherscan.io/tx/${edge.hash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-indigo-400 hover:text-indigo-300 transition-colors"
                              >
                                <ExternalLink size={10} />
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="space-y-2">
                <a
                  href={`https://etherscan.io/address/${selectedNode.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium px-4 py-3 rounded-xl transition-colors"
                >
                  <ExternalLink size={14} />
                  {t('view_etherscan')}
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
