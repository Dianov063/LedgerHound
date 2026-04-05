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
  ChevronDown,
  GitBranch,
  Circle,
  AlertTriangle,
  Network,
  LayoutGrid,
} from 'lucide-react';

interface GraphNode {
  id: string;
  label: string;
  type: 'source' | 'exchange' | 'mixer' | 'defi' | 'scam' | 'intermediate' | 'unknown';
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
  source: '#1a7de9',
  exchange: '#00c853',
  mixer: '#ff1744',
  defi: '#7c3aed',
  scam: '#ff6d00',
  intermediate: '#546e7a',
  unknown: '#546e7a',
};

const NODE_SIZES: Record<string, number> = {
  source: 45,
  exchange: 35,
  mixer: 35,
  defi: 32,
  scam: 38,
  intermediate: 25,
  unknown: 25,
};

const NODE_LABELS: Record<string, string> = {
  source: 'Your Address',
  exchange: 'Known Exchange',
  mixer: 'Mixer / High Risk',
  defi: 'DeFi Protocol',
  scam: 'Flagged / Scam',
  intermediate: 'Unknown Wallet',
  unknown: 'Unknown Wallet',
};

const LEGEND_ITEMS = [
  { color: '#1a7de9', label: 'Your Address', emoji: '🔵' },
  { color: '#00c853', label: 'Known Exchange', emoji: '🟢' },
  { color: '#ff1744', label: 'Mixer / High Risk', emoji: '🔴' },
  { color: '#7c3aed', label: 'DeFi Protocol', emoji: '🟣' },
  { color: '#ff6d00', label: 'Flagged / Scam', emoji: '🟠' },
  { color: '#546e7a', label: 'Unknown Wallet', emoji: '⚪' },
];

const LOADING_STEPS = [
  'Step 1/3: Fetching transactions...',
  'Step 2/3: Building graph...',
  'Step 3/3: Identifying entities...',
];

type NetworkType = 'btc' | 'eth' | 'sol' | 'trx' | 'bnb' | 'polygon' | 'base' | 'arb' | 'op' | 'avax' | 'ftm' | 'linea' | 'zksync' | 'scroll' | 'mantle';

const PRIMARY_NETWORKS: NetworkType[] = ['btc', 'eth', 'sol', 'trx', 'bnb', 'base', 'arb', 'op'];
const MORE_NETWORKS: NetworkType[] = ['avax', 'polygon', 'ftm', 'linea', 'zksync', 'scroll', 'mantle'];

const NETWORK_DISPLAY_LABELS: Record<NetworkType, string> = {
  btc: 'BTC',
  eth: 'ETH',
  sol: 'SOL',
  trx: 'TRON',
  bnb: 'BNB',
  polygon: 'MATIC',
  base: 'BASE',
  arb: 'ARB',
  op: 'OP',
  avax: 'AVAX',
  ftm: 'FTM',
  linea: 'LINEA',
  zksync: 'zkSYNC',
  scroll: 'SCROLL',
  mantle: 'MANTLE',
};

const EVM_NETWORKS: NetworkType[] = ['eth', 'bnb', 'polygon', 'base', 'arb', 'op', 'avax', 'ftm', 'linea', 'zksync', 'scroll', 'mantle'];

function getExplorerBaseUrl(network: NetworkType): string {
  switch (network) {
    case 'btc':
      return 'https://blockstream.info';
    case 'eth':
      return 'https://etherscan.io';
    case 'sol':
      return 'https://solscan.io';
    case 'trx':
      return 'https://tronscan.org/#';
    case 'bnb':
      return 'https://bscscan.com';
    case 'polygon':
      return 'https://polygonscan.com';
    case 'base':
      return 'https://basescan.org';
    case 'arb':
      return 'https://arbiscan.io';
    case 'op':
      return 'https://optimistic.etherscan.io';
    case 'avax':
      return 'https://snowtrace.io';
    case 'ftm':
      return 'https://ftmscan.com';
    case 'linea':
      return 'https://lineascan.build';
    case 'zksync':
      return 'https://era.zksync.network';
    case 'scroll':
      return 'https://scrollscan.com';
    case 'mantle':
      return 'https://mantlescan.xyz';
  }
}

function getExplorerAddressUrl(network: NetworkType, addr: string): string {
  const base = getExplorerBaseUrl(network);
  return `${base}/address/${addr}`;
}

function getExplorerTxUrl(network: NetworkType, hash: string): string {
  const base = getExplorerBaseUrl(network);
  if (network === 'btc') return `${base}/tx/${hash}`;
  if (network === 'sol') return `${base}/tx/${hash}`;
  if (network === 'trx') return `${base}/transaction/${hash}`;
  return `${base}/tx/${hash}`;
}

function getExplorerLabel(network: NetworkType): string {
  switch (network) {
    case 'btc':
      return 'View on Blockstream';
    case 'eth':
      return 'View on Etherscan';
    case 'sol':
      return 'View on Solscan';
    case 'trx':
      return 'View on TronScan';
    case 'bnb':
      return 'View on BscScan';
    case 'polygon':
      return 'View on PolygonScan';
    case 'base':
      return 'View on BaseScan';
    case 'arb':
      return 'View on Arbiscan';
    case 'op':
      return 'View on Optimistic Etherscan';
    case 'avax':
      return 'View on Snowtrace';
    case 'ftm':
      return 'View on FTMScan';
    case 'linea':
      return 'View on LineaScan';
    case 'zksync':
      return 'View on zkSync Explorer';
    case 'scroll':
      return 'View on ScrollScan';
    case 'mantle':
      return 'View on MantleScan';
  }
}

function isValidAddress(network: NetworkType, addr: string): boolean {
  if (network === 'btc') {
    return /^(1|3)[a-zA-Z0-9]{24,33}$|^bc1[a-zA-Z0-9]{25,62}$/.test(addr);
  }
  if (network === 'sol') {
    return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(addr);
  }
  if (network === 'trx') {
    return /^T[a-zA-Z0-9]{33}$/.test(addr);
  }
  // All EVM networks
  return /^0x[a-fA-F0-9]{40}$/i.test(addr);
}

function getPlaceholder(network: NetworkType): string {
  switch (network) {
    case 'btc':
      return 'Enter Bitcoin address (1..., 3..., bc1...)';
    case 'sol':
      return 'Enter Solana address';
    case 'trx':
      return 'Enter TRON address (T...)';
    default:
      return `Enter ${NETWORK_DISPLAY_LABELS[network]} address (0x...)`;
  }
}

function detectNetworkFromAddress(value: string): NetworkType | null {
  if (/^(1|3)[a-zA-Z0-9]{24,33}$/.test(value) || /^bc1[a-zA-Z0-9]{25,62}$/.test(value)) {
    return 'btc';
  }
  if (/^T[a-zA-Z0-9]{33}$/.test(value)) {
    return 'trx';
  }
  if (/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(value) && !value.startsWith('0x')) {
    // Could be Solana - only auto-detect if it doesn't look like BTC or TRON
    if (!value.startsWith('T') && !value.startsWith('1') && !value.startsWith('3') && !value.startsWith('bc1')) {
      return 'sol';
    }
  }
  return null;
}

/** Returns true if the network should NOT have its address lowercased */
function shouldPreserveCase(network: NetworkType): boolean {
  return network === 'btc' || network === 'sol' || network === 'trx';
}

export default function GraphTracer() {
  const t = useTranslations('graph');
  const [address, setAddress] = useState('');
  const [network, setNetwork] = useState<NetworkType>('eth');
  const [depth, setDepth] = useState(2);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState('');
  const [data, setData] = useState<GraphData | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [layout, setLayout] = useState<'breadthfirst' | 'cose'>('breadthfirst');
  const [moreOpen, setMoreOpen] = useState(false);
  const cyRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const sourceAddressRef = useRef<string>('');
  const networkRef = useRef<NetworkType>('eth');
  const moreDropdownRef = useRef<HTMLDivElement>(null);

  // Close "More" dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (moreDropdownRef.current && !moreDropdownRef.current.contains(e.target as Node)) {
        setMoreOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto-detect network from address input
  const handleAddressChange = (value: string) => {
    setAddress(value);
    const detected = detectNetworkFromAddress(value);
    if (detected) {
      setNetwork(detected);
    }
  };

  const initCytoscape = useCallback(
    async (graphData: GraphData) => {
      if (!containerRef.current) return;

      const cytoscape = (await import('cytoscape')).default;

      if (cyRef.current) {
        cyRef.current.destroy();
      }

      const sourceAddr = sourceAddressRef.current;
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
        const isOutgoing = edge.source === sourceAddr;
        const isIncoming = edge.target === sourceAddr;
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
            edgeType: isOutgoing ? 'outgoing' : isIncoming ? 'incoming' : 'neutral',
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
              'font-size': '12px',
              color: '#e2e8f0',
              'text-margin-y': 10,
              'background-color': (ele: any) => NODE_COLORS[ele.data('type')] || '#546e7a',
              width: (ele: any) => NODE_SIZES[ele.data('type')] || 25,
              height: (ele: any) => NODE_SIZES[ele.data('type')] || 25,
              'border-width': (ele: any) => (ele.data('type') === 'source' ? 4 : 2),
              'border-color': (ele: any) => {
                const t = ele.data('type');
                if (t === 'source') return '#93c5fd';
                if (t === 'mixer') return '#ff616f';
                if (t === 'scam') return '#ffab40';
                return 'rgba(255,255,255,0.15)';
              },
              'text-outline-width': 2.5,
              'text-outline-color': '#0f172a',
              'text-wrap': 'ellipsis',
              'text-max-width': '100px',
            } as any,
          },
          {
            selector: 'edge',
            style: {
              width: (ele: any) => Math.max(2, Math.min(6, 2 + (ele.data('value') || 0) * 0.3)),
              'line-color': (ele: any) => {
                const et = ele.data('edgeType');
                if (et === 'outgoing') return '#ef4444';
                if (et === 'incoming') return '#22c55e';
                return '#475569';
              },
              'target-arrow-color': (ele: any) => {
                const et = ele.data('edgeType');
                if (et === 'outgoing') return '#ef4444';
                if (et === 'incoming') return '#22c55e';
                return '#475569';
              },
              'target-arrow-shape': 'triangle',
              'arrow-scale': 1.3,
              'curve-style': 'bezier',
              opacity: 0.7,
              label: 'data(label)',
              'font-size': '10px',
              color: '#94a3b8',
              'text-rotation': 'autorotate',
              'text-outline-width': 2,
              'text-outline-color': '#0f172a',
            } as any,
          },
          {
            selector: 'node:selected',
            style: {
              'border-width': 4,
              'border-color': '#6366f1',
              'overlay-color': '#6366f1',
              'overlay-opacity': 0.15,
            },
          },
          {
            selector: 'node.highlighted',
            style: {
              'border-width': 4,
              'border-color': '#f59e0b',
            },
          },
          {
            selector: 'edge.highlighted',
            style: {
              'line-color': '#f59e0b',
              'target-arrow-color': '#f59e0b',
              opacity: 1,
              width: 4,
            },
          },
        ] as any,
        layout: {
          name: layout === 'breadthfirst' ? 'breadthfirst' : 'cose',
          directed: true,
          padding: 80,
          spacingFactor: 1.8,
          animate: true,
          animationDuration: 500,
          ...(layout === 'breadthfirst'
            ? {
                roots: `#${sourceAddr}`,
              }
            : {
                nodeRepulsion: () => 10000,
                idealEdgeLength: () => 120,
                gravity: 0.4,
                padding: 80,
              }),
        } as any,
        minZoom: 0.15,
        maxZoom: 3,
        wheelSensitivity: 0.3,
      });

      // Fit after layout finishes
      cy.on('layoutstop', () => {
        cy.fit(undefined, 60);
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
    if (!address || !isValidAddress(network, address)) {
      setError(t('error_invalid'));
      return;
    }

    setLoading(true);
    setError('');
    setData(null);
    setSelectedNode(null);
    sourceAddressRef.current = shouldPreserveCase(network) ? address : address.toLowerCase();
    networkRef.current = network;

    // Animate loading steps
    setLoadingStep(0);
    const stepTimer1 = setTimeout(() => setLoadingStep(1), 2000);
    const stepTimer2 = setTimeout(() => setLoadingStep(2), 5000);

    try {
      const res = await fetch('/api/trace-graph', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, depth, network }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Trace failed');

      setLoadingStep(2);
      await new Promise((r) => setTimeout(r, 500));
      setData(json);
    } catch (err: any) {
      setError(err.message || t('error_failed'));
    } finally {
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      setLoading(false);
      setLoadingStep(0);
    }
  };

  const handleZoomIn = () => cyRef.current?.zoom(cyRef.current.zoom() * 1.3);
  const handleZoomOut = () => cyRef.current?.zoom(cyRef.current.zoom() / 1.3);
  const handleFit = () => cyRef.current?.fit(undefined, 60);

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

  const currentNetwork = networkRef.current;

  return (
    <div className="bg-slate-950 min-h-screen">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-8">
        {/* Search Bar */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-6">
          {/* Network selector tabs */}
          <div className="flex items-center gap-1 mb-3 flex-wrap">
            {PRIMARY_NETWORKS.map((n) => (
              <button
                key={n}
                onClick={() => { setNetwork(n); setMoreOpen(false); }}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  network === n
                    ? 'bg-brand-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
              >
                {NETWORK_DISPLAY_LABELS[n]}
              </button>
            ))}

            {/* More dropdown */}
            <div className="relative" ref={moreDropdownRef}>
              <button
                onClick={() => setMoreOpen(!moreOpen)}
                className={`flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  MORE_NETWORKS.includes(network)
                    ? 'bg-brand-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
              >
                {MORE_NETWORKS.includes(network) ? NETWORK_DISPLAY_LABELS[network] : 'More'}
                <ChevronDown size={12} className={`transition-transform ${moreOpen ? 'rotate-180' : ''}`} />
              </button>
              {moreOpen && (
                <div className="absolute top-full left-0 mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 min-w-[140px] py-1">
                  {MORE_NETWORKS.map((n) => (
                    <button
                      key={n}
                      onClick={() => { setNetwork(n); setMoreOpen(false); }}
                      className={`block w-full text-left px-4 py-2 text-xs font-semibold transition-colors ${
                        network === n
                          ? 'bg-brand-600/20 text-white'
                          : 'text-slate-400 hover:text-white hover:bg-slate-700'
                      }`}
                    >
                      {NETWORK_DISPLAY_LABELS[n]}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input
                type="text"
                value={address}
                onChange={(e) => handleAddressChange(e.target.value)}
                placeholder={getPlaceholder(network)}
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
        </div>

        {/* Graph Area */}
        <div className="relative">
          <div
            ref={containerRef}
            className={`bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden transition-all ${
              data ? 'h-[650px]' : 'h-[400px]'
            }`}
            style={{ minHeight: data ? 650 : 400 }}
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
                <div className="text-center max-w-xs">
                  <Loader2 size={40} className="mx-auto text-indigo-500 mb-6 animate-spin" />
                  <div className="space-y-3">
                    {LOADING_STEPS.map((step, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold transition-all duration-300 ${
                          i < loadingStep ? 'bg-emerald-500 text-white' :
                          i === loadingStep ? 'bg-indigo-500 text-white animate-pulse' :
                          'bg-slate-800 text-slate-600'
                        }`}>
                          {i < loadingStep ? '✓' : i + 1}
                        </div>
                        <span className={`text-sm transition-colors duration-300 ${
                          i <= loadingStep ? 'text-slate-300' : 'text-slate-600'
                        }`}>
                          {step}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Controls overlay */}
          {data && (
            <>
              {/* Legend - top left */}
              <div className="absolute top-4 left-4 bg-slate-800/95 border border-slate-700 rounded-xl px-4 py-3 space-y-1.5">
                {LEGEND_ITEMS.map((item) => (
                  <div key={item.label} className="flex items-center gap-2">
                    <span className="text-sm">{item.emoji}</span>
                    <span className="text-xs text-slate-300">{item.label}</span>
                  </div>
                ))}
              </div>

              {/* Layout toggle + zoom - top right */}
              <div className="absolute top-4 right-4 flex items-start gap-2">
                <div className="flex gap-1.5">
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
                <div className="flex flex-col gap-1.5">
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
                <p className="text-white font-semibold text-sm mb-1">{selectedNode.label}</p>
                <p className="text-slate-600 font-mono text-xs break-all">{selectedNode.id}</p>
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
                                href={getExplorerTxUrl(currentNetwork, edge.hash)}
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
                  href={getExplorerAddressUrl(currentNetwork, selectedNode.id)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium px-4 py-3 rounded-xl transition-colors"
                >
                  <ExternalLink size={14} />
                  {getExplorerLabel(currentNetwork)}
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
