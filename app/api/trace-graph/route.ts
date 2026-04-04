import { NextRequest, NextResponse } from 'next/server';

const ALCHEMY_URL = 'https://eth-mainnet.g.alchemy.com/v2/OAymykkPw_Oi3LINBgrqZ';

const KNOWN_ENTITIES: Record<string, { label: string; type: 'exchange' | 'mixer' | 'defi' }> = {
  '0x28c6c06298d514db089934071355e5743bf21d60': { label: 'Binance', type: 'exchange' },
  '0xbe0eb53f46cd790cd13851d5eff43d12404d33e8': { label: 'Binance 2', type: 'exchange' },
  '0x21a31ee1afc51d94c2efccaa2092ad1028285549': { label: 'Binance 3', type: 'exchange' },
  '0xdfd5293d8e347dfe59e90efd55b2956a1343963d': { label: 'Binance 4', type: 'exchange' },
  '0x71660c4005ba85c37ccec55d0c4493e66fe775d3': { label: 'Coinbase', type: 'exchange' },
  '0xa9d1e08c7793af67e9d92fe308d5697fb81d3e43': { label: 'Coinbase 2', type: 'exchange' },
  '0x503828976d22510aad0201ac7ec88293211d23da': { label: 'Coinbase 3', type: 'exchange' },
  '0x2910543af39aba0cd09dbb2d50200b3e800a63d2': { label: 'Kraken', type: 'exchange' },
  '0x53d284357ec70ce289d6d64134dfac8e511c8a3d': { label: 'Kraken 2', type: 'exchange' },
  '0x6cc5f688a315f3dc28a7781717a9a798a59fda7b': { label: 'OKX', type: 'exchange' },
  '0xfbb1b73c4f0bda4f67dca266ce6ef42f520fbb98': { label: 'Bittrex', type: 'exchange' },
  '0x1681195c176239ac5e72d9aebacf5b2492e0c4ee': { label: 'KuCoin', type: 'exchange' },
  '0x2b5634c42055806a59e9107ed44d43c426e58258': { label: 'KuCoin 2', type: 'exchange' },
  '0xdc76cd25977e0a5ae17155770273ad58648900d3': { label: 'Huobi', type: 'exchange' },
  '0xab5c66752a9e8167967685f1450532fb96d5d24f': { label: 'Huobi 2', type: 'exchange' },
  '0x0d0707963952f2fba59dd06f2b425ace40b492fe': { label: 'Gate.io', type: 'exchange' },
  '0x1151314c646ce4e0efd76d1af4760ae66a9fe30f': { label: 'Bitfinex', type: 'exchange' },
  '0x876eabf441b2ee5b5b0554fd502a8e0600950cfa': { label: 'Bitfinex 2', type: 'exchange' },
  '0x12d66f87a04a9e220c9d5078b7961664a758ad11': { label: 'Tornado Cash', type: 'mixer' },
  '0xd90e2f925da726b50c4ed8d0fb90ad053324f31b': { label: 'Tornado Cash 2', type: 'mixer' },
  '0x47ce0c6ed5b0ce3d3a51fdb1c52dc66a7c3c2936': { label: 'Tornado Cash 3', type: 'mixer' },
  '0x7a250d5630b4cf539739df2c5dacb4c659f2488d': { label: 'Uniswap V2 Router', type: 'defi' },
  '0xe592427a0aece92de3edee1f18e0157c05861564': { label: 'Uniswap V3 Router', type: 'defi' },
  '0xd9e1ce17f2641f24ae83637ab66a2cca9c378b9f': { label: 'SushiSwap Router', type: 'defi' },
  '0xdef1c0ded9bec7f1a1670819833240f027b25eff': { label: '0x Exchange', type: 'defi' },
};

async function fetchTransfers(params: object) {
  const res = await fetch(ALCHEMY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: 1, jsonrpc: '2.0', method: 'alchemy_getAssetTransfers', params: [params] }),
  });
  const json = await res.json();
  if (json.error) throw new Error(json.error.message);
  return json.result?.transfers || [];
}

async function getTransfersForAddress(address: string) {
  const base = {
    fromBlock: '0x0',
    toBlock: 'latest',
    category: ['external', 'erc20'],
    withMetadata: true,
    maxCount: '0x14', // 20 per direction to limit
  };

  const [outgoing, incoming] = await Promise.all([
    fetchTransfers({ ...base, fromAddress: address }),
    fetchTransfers({ ...base, toAddress: address }),
  ]);

  return { outgoing, incoming };
}

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

export async function POST(req: NextRequest) {
  try {
    const { address, depth = 1 } = await req.json();

    if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return NextResponse.json({ error: 'Invalid Ethereum address' }, { status: 400 });
    }

    const maxDepth = Math.min(Math.max(1, depth), 3);
    const nodes = new Map<string, GraphNode>();
    const edges: GraphEdge[] = [];
    const visited = new Set<string>();
    const MAX_NODES = 50;

    const getNodeType = (addr: string): GraphNode['type'] => {
      const entity = KNOWN_ENTITIES[addr];
      if (entity) return entity.type;
      return 'unknown';
    };

    const ensureNode = (addr: string, isSource = false) => {
      const lower = addr.toLowerCase();
      if (!nodes.has(lower)) {
        const entity = KNOWN_ENTITIES[lower];
        nodes.set(lower, {
          id: lower,
          label: entity?.label || `${lower.slice(0, 6)}…${lower.slice(-4)}`,
          type: isSource ? 'source' : getNodeType(lower),
          totalIn: 0,
          totalOut: 0,
          txCount: 0,
        });
      }
      return nodes.get(lower)!;
    };

    const traceHop = async (addr: string, currentDepth: number) => {
      const lower = addr.toLowerCase();
      if (visited.has(lower) || currentDepth > maxDepth || nodes.size >= MAX_NODES) return;
      visited.add(lower);

      const { outgoing, incoming } = await getTransfersForAddress(lower);

      for (const tx of outgoing) {
        if (!tx.to || nodes.size >= MAX_NODES) continue;
        const toLower = tx.to.toLowerCase();
        const fromNode = ensureNode(lower, currentDepth === 1);
        const toNode = ensureNode(toLower);
        fromNode.totalOut += tx.value || 0;
        fromNode.txCount++;
        toNode.totalIn += tx.value || 0;
        toNode.txCount++;

        edges.push({
          source: lower,
          target: toLower,
          value: tx.value || 0,
          token: tx.asset || 'ETH',
          hash: tx.hash || '',
          timestamp: tx.metadata?.blockTimestamp || '',
        });
      }

      for (const tx of incoming) {
        if (!tx.from || nodes.size >= MAX_NODES) continue;
        const fromLower = tx.from.toLowerCase();
        const fromNode = ensureNode(fromLower);
        const toNode = ensureNode(lower, currentDepth === 1);
        fromNode.totalOut += tx.value || 0;
        fromNode.txCount++;
        toNode.totalIn += tx.value || 0;
        toNode.txCount++;

        edges.push({
          source: fromLower,
          target: lower,
          value: tx.value || 0,
          token: tx.asset || 'ETH',
          hash: tx.hash || '',
          timestamp: tx.metadata?.blockTimestamp || '',
        });
      }

      // Trace next hop for outgoing destinations
      if (currentDepth < maxDepth) {
        const nextAddresses = outgoing
          .map((tx: any) => tx.to?.toLowerCase())
          .filter((a: string) => a && !visited.has(a) && !KNOWN_ENTITIES[a])
          .slice(0, 5); // limit branches

        for (const next of nextAddresses) {
          if (nodes.size >= MAX_NODES) break;
          await traceHop(next, currentDepth + 1);
        }
      }
    };

    ensureNode(address.toLowerCase(), true);
    await traceHop(address.toLowerCase(), 1);

    const knownEntities = Array.from(nodes.values())
      .filter((n) => n.type === 'exchange' || n.type === 'mixer' || n.type === 'defi')
      .map((n) => n.label);

    return NextResponse.json({
      nodes: Array.from(nodes.values()),
      edges,
      knownEntities,
      totalNodes: nodes.size,
      totalEdges: edges.length,
      maxReached: nodes.size >= MAX_NODES,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Trace failed' }, { status: 500 });
  }
}
