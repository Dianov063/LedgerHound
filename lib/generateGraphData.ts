/**
 * Generates graph node/edge data for the PDF fund flow visualization.
 * Pure data — no rendering. Used by reportPdf.tsx to draw SVG.
 *
 * Max 12 nodes, top counterparties by volume, dust filtered.
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
  /** Midpoint for label placement */
  labelX: number;
  labelY: number;
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
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
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
  const counterparties = new Map<string, { volume: number; direction: 'IN' | 'OUT'; label: string; type: string; token: string }>();
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
        token: tx.token || nativeCurrency,
      });
    }
  }

  if (counterparties.size === 0) return null;

  // Top 11 counterparties (+ 1 source = 12 max)
  const sorted = Array.from(counterparties.entries())
    .sort((a, b) => b[1].volume - a[1].volume)
    .slice(0, 11);

  // Layout: radial around center — fits within A4 content area (max ~480pt)
  const W = 470;
  const H = 330;
  const cx = W / 2;
  const cy = H / 2;
  const SOURCE_R = 20;

  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];

  // Source node at center
  nodes.push({
    id: addr,
    label: shortAddr(walletAddress),
    type: 'source',
    x: cx,
    y: cy,
    radius: SOURCE_R,
    volume: 0,
  });

  // Position counterparties in ellipse
  const rx = W / 2 - 60; // horizontal radius
  const ry = H / 2 - 55; // vertical radius
  const count = sorted.length;

  sorted.forEach(([cpAddr, data], i) => {
    const angle = (2 * Math.PI * i) / count - Math.PI / 2;
    const x = cx + rx * Math.cos(angle);
    const y = cy + ry * Math.sin(angle);
    const nodeR = data.type === 'exchange' || data.type === 'mixer' ? 16 : 13;

    nodes.push({
      id: cpAddr,
      label: data.label,
      type: data.type as GraphNode['type'],
      x,
      y,
      radius: nodeR,
      volume: data.volume,
    });

    // Calculate unit vector from center to counterparty
    const dx = x - cx;
    const dy = y - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 1) return;
    const ux = dx / dist;
    const uy = dy / dist;

    // Determine the value label
    const valueLabel = fmtValue(data.volume, data.token);

    if (data.direction === 'OUT') {
      // Arrow from center → counterparty
      const sx = cx + ux * (SOURCE_R + 4);
      const sy = cy + uy * (SOURCE_R + 4);
      const ex = x - ux * (nodeR + 8);
      const ey = y - uy * (nodeR + 8);
      edges.push({
        fromId: addr, toId: cpAddr,
        x1: sx, y1: sy, x2: ex, y2: ey,
        direction: 'OUT',
        label: valueLabel,
        labelX: (sx + ex) / 2,
        labelY: (sy + ey) / 2,
      });
    } else {
      // Arrow from counterparty → center
      const sx = x - ux * (nodeR + 4);
      const sy = y - uy * (nodeR + 4);
      const ex = cx + ux * (SOURCE_R + 8);
      const ey = cy + uy * (SOURCE_R + 8);
      edges.push({
        fromId: cpAddr, toId: addr,
        x1: sx, y1: sy, x2: ex, y2: ey,
        direction: 'IN',
        label: valueLabel,
        labelX: (sx + ex) / 2,
        labelY: (sy + ey) / 2,
      });
    }
  });

  return { nodes, edges, width: W, height: H };
}
