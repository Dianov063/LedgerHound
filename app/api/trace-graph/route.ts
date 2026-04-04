import { NextRequest, NextResponse } from 'next/server';

const ALCHEMY_URL = 'https://eth-mainnet.g.alchemy.com/v2/OAymykkPw_Oi3LINBgrqZ';

const KNOWN_ENTITIES: Record<string, { label: string; type: 'exchange' | 'mixer' | 'defi' | 'scam' }> = {
  // Binance
  '0x28c6c06298d514db089934071355e5743bf21d60': { label: 'Binance', type: 'exchange' },
  '0xbe0eb53f46cd790cd13851d5eff43d12404d33e8': { label: 'Binance 2', type: 'exchange' },
  '0xf977814e90da44bfa03b6295a0616a897441acec': { label: 'Binance 3', type: 'exchange' },
  '0x8894e0a0c962cb723c1976a4421c95949be2d4e3': { label: 'Binance 4', type: 'exchange' },
  '0x21a31ee1afc51d94c2efccaa2092ad1028285549': { label: 'Binance 5', type: 'exchange' },

  // Coinbase
  '0x71660c4005ba85c37ccec55d0c4493e66fe775d3': { label: 'Coinbase', type: 'exchange' },
  '0xa090e606e30bd747d4e6245a1517ebe430f0057e': { label: 'Coinbase 2', type: 'exchange' },
  '0x503828976d22510aad0201ac7ec88293211d23da': { label: 'Coinbase 3', type: 'exchange' },

  // Kraken
  '0x2910543af39aba0cd09dbb2d50200b3e800a63d2': { label: 'Kraken', type: 'exchange' },
  '0x0a869d79a7052c7f1b55a8ebabbea3420f0d1e13': { label: 'Kraken 2', type: 'exchange' },

  // OKX
  '0x6cc5f688a315f3dc28a7781717a9a798a59fda7b': { label: 'OKX', type: 'exchange' },
  '0x236f9f97e0e62388479bf9e5ba4889e46b0273c3': { label: 'OKX 2', type: 'exchange' },

  // Huobi / HTX
  '0xab5c66752a9e8167967685f1450532fb96d5d24f': { label: 'Huobi', type: 'exchange' },
  '0x6748f50f686bfbca6fe8ad62b22228b87f31ff2b': { label: 'Huobi 2', type: 'exchange' },

  // Bybit
  '0xf89d7b9c864f589bbf53a82105107622b35eaa40': { label: 'Bybit', type: 'exchange' },

  // KuCoin
  '0x2b5634c42055806a59e9107ed44d43c426e58258': { label: 'KuCoin', type: 'exchange' },

  // Gate.io
  '0x0d0707963952f2fba59dd06f2b425ace40b492fe': { label: 'Gate.io', type: 'exchange' },

  // Bitfinex
  '0x77134cbc06cb00b66f4c7e623d5fdbf6777635ec': { label: 'Bitfinex', type: 'exchange' },

  // Crypto.com
  '0x6262998ced04146fa42253a5c0af90ca02dfd2a3': { label: 'Crypto.com', type: 'exchange' },

  // ChangeNOW
  '0x077d360f11d220e4d5d9ba269170a1ef1fe5b62d': { label: 'ChangeNOW', type: 'exchange' },

  // Tornado Cash (mixers - high risk)
  '0x12d66f87a04a9e220c9d5078b7961664a758ad11': { label: 'Tornado Cash', type: 'mixer' },
  '0x47ce0c6ed5b0ce3d3a51fdb1c52dc66a7c3c2936': { label: 'Tornado Cash 2', type: 'mixer' },
  '0x910cbd523d972eb0a6f4cae4618ad62622b39dbf': { label: 'Tornado Cash 3', type: 'mixer' },
  '0xa160cdab225685da1d56aa342ad8841c3b53f291': { label: 'Tornado Cash 4', type: 'mixer' },

  // FixedFloat (used by scammers)
  '0x7f268357a8c2552623316e2562d90e642bb538e5': { label: 'FixedFloat', type: 'mixer' },

  // Uniswap
  '0x7a250d5630b4cf539739df2c5dacb4c659f2488d': { label: 'Uniswap V2', type: 'defi' },
  '0xe592427a0aece92de3edee1f18e0157c05861564': { label: 'Uniswap V3', type: 'defi' },
  '0xd9e1ce17f2641f24ae83637ab66a2cca9c378b9f': { label: 'SushiSwap', type: 'defi' },
  '0xdef1c0ded9bec7f1a1670819833240f027b25eff': { label: '0x Exchange', type: 'defi' },

  // Known scam-related
  '0xd882cfc20f52f2599d84b8e8d58c7fb62cfe344b': { label: 'Flagged Address', type: 'scam' },
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
      .filter((n) => n.type === 'exchange' || n.type === 'mixer' || n.type === 'defi' || n.type === 'scam')
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
