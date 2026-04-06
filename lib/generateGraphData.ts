/**
 * Generates graph node/edge data for the PDF fund flow visualization.
 * Pure data — no rendering. Used by reportPdf.tsx to draw SVG.
 *
 * Max 15 nodes, top counterparties by volume, dust filtered.
 */

export interface GraphNode {
  id: string;
  label: string;
  type: 'source' | 'exchange' | 'mixer' | 'defi' | 'scam' | 'scam_database' | 'unknown';
  x: number;
  y: number;
  radius: number;
  volume: number;
}

export interface GraphEdge {
  fromId: string;
  toId: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  direction: 'IN' | 'OUT';
  label: string;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
  width: number;
  height: number;
}

const NODE_COLORS: Record<string, string> = {
  source: '#1a7de9',
  exchange: '#00c853',
  mixer: '#ff1744',
  defi: '#7c3aed',
  scam: '#ff6d00',
  scam_database: '#8B0000',
  unknown: '#546e7a',
};

export function getNodeColor(type: string): string {
  return NODE_COLORS[type] || NODE_COLORS.unknown;
}

function shortAddr(addr: string): string {
  if (!addr || addr.length < 14) return addr || '?';
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

function fmtValue(v: number, currency: string): string {
  if (v >= 1000) return `${(v / 1000).toFixed(1)}K ${currency}`;
  if (v >= 1) return `${v.toFixed(2)} ${currency}`;
  if (v >= 0.01) return `${v.toFixed(4)} ${currency}`;
  return `<0.01 ${currency}`;
}

/**
 * Build graph data from report transactions + entities.
 * Positions nodes in a radial layout centered on the source wallet.
 */
export function buildGraphData(params: {
  walletAddress: string;
  transactions: { direction: 'IN' | 'OUT'; from: string; to: string; value: number; token: string }[];
  identifiedEntities: { address: string; label: string; type: string }[];
  nativeCurrency: string;
}): GraphData | null {
  const { walletAddress, transactions, identifiedEntities, nativeCurrency } = params;
  const addr = walletAddress.toLowerCase();

  // Aggregate counterparties by volume
  const counterparties = new Map<string, { volume: number; direction: 'IN' | 'OUT'; label: string; type: string }>();
  const entityMap = new Map<string, { label: string; type: string }>();
  for (const e of identifiedEntities) {
    entityMap.set(e.address.toLowerCase(), { label: e.label, type: e.type });
  }

  for (const tx of transactions) {
    if (tx.value <= 0.001) continue; // filter dust
    const counterparty = tx.direction === 'OUT' ? tx.to : tx.from;
    if (!counterparty || counterparty === '—') continue;
    const cpLower = counterparty.toLowerCase();
    if (cpLower === addr) continue;

    const existing = counterparties.get(cpLower);
    if (existing) {
      existing.volume += tx.value;
    } else {
      const entity = entityMap.get(cpLower);
      counterparties.set(cpLower, {
        volume: tx.value,
        direction: tx.direction,
        label: entity?.label || shortAddr(counterparty),
        type: entity?.type || 'unknown',
      });
    }
  }

  if (counterparties.size === 0) return null;

  // Top 14 counterparties (+ 1 source = 15 max)
  const sorted = Array.from(counterparties.entries())
    .sort((a, b) => b[1].volume - a[1].volume)
    .slice(0, 14);

  // Layout: radial around center
  const W = 500;
  const H = 340;
  const cx = W / 2;
  const cy = H / 2;

  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];

  // Source node at center
  nodes.push({
    id: addr,
    label: 'Your Wallet',
    type: 'source',
    x: cx,
    y: cy,
    radius: 18,
    volume: 0,
  });

  // Position counterparties in ellipse
  const rx = W / 2 - 55; // horizontal radius
  const ry = H / 2 - 50; // vertical radius
  const count = sorted.length;

  sorted.forEach(([cpAddr, data], i) => {
    const angle = (2 * Math.PI * i) / count - Math.PI / 2;
    const x = cx + rx * Math.cos(angle);
    const y = cy + ry * Math.sin(angle);
    const r = data.type === 'exchange' || data.type === 'mixer' ? 14 : 11;

    nodes.push({
      id: cpAddr,
      label: data.label,
      type: data.type as GraphNode['type'],
      x,
      y,
      radius: r,
      volume: data.volume,
    });

    // Edge: shorten line so it doesn't overlap node circles
    const dx = x - cx;
    const dy = y - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const ux = dx / dist;
    const uy = dy / dist;

    const sourceR = 18;
    const targetR = r;

    if (data.direction === 'OUT') {
      edges.push({
        fromId: addr,
        toId: cpAddr,
        x1: cx + ux * (sourceR + 4),
        y1: cy + uy * (sourceR + 4),
        x2: x - ux * (targetR + 8),
        y2: y - uy * (targetR + 8),
        direction: 'OUT',
        label: fmtValue(data.volume, nativeCurrency),
      });
    } else {
      edges.push({
        fromId: cpAddr,
        toId: addr,
        x1: x + ux * (targetR + 4) * -1 + ux * (targetR + 4),
        y1: y + uy * (targetR + 4) * -1 + uy * (targetR + 4),
        x2: cx - ux * (sourceR + 8) + ux * (sourceR + 4),
        y2: cy - uy * (sourceR + 8) + uy * (sourceR + 4),
        direction: 'IN',
        label: fmtValue(data.volume, nativeCurrency),
      });
      // Simplify IN edge coordinates
      edges[edges.length - 1].x1 = x - ux * (targetR + 4) * -1;
      edges[edges.length - 1].y1 = y - uy * (targetR + 4) * -1;
      edges[edges.length - 1].x2 = cx + ux * (sourceR + 8) * -1;
      edges[edges.length - 1].y2 = cy + uy * (sourceR + 8) * -1;
    }
  });

  // Fix IN edges: from counterparty toward center
  for (const edge of edges) {
    if (edge.direction === 'IN') {
      const cp = nodes.find(n => n.id === edge.fromId && n.id !== addr);
      if (cp) {
        const dx = cx - cp.x;
        const dy = cy - cp.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const ux = dx / dist;
        const uy = dy / dist;
        edge.x1 = cp.x + ux * (cp.radius + 4);
        edge.y1 = cp.y + uy * (cp.radius + 4);
        edge.x2 = cx - ux * (18 + 8);
        edge.y2 = cy - uy * (18 + 8);
      }
    }
  }

  return { nodes, edges, width: W, height: H };
}
