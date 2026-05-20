import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { getAddressIndex } from '@/lib/scam-db';
import { fetchWithTimeout } from '@/lib/fetch-timeout';
import { getKnownEntity } from '@/lib/known-entities';

type NetworkType = 'btc' | 'eth' | 'sol' | 'trx' | 'bnb' | 'polygon' | 'base' | 'arb' | 'op' | 'avax' | 'linea' | 'zksync' | 'scroll' | 'mantle';
type NetworkOrAuto = NetworkType | 'auto';

const VALID_NETWORKS: NetworkOrAuto[] = ['auto', 'btc', 'eth', 'sol', 'trx', 'bnb', 'polygon', 'base', 'arb', 'op', 'avax', 'linea', 'zksync', 'scroll', 'mantle'];
const EVM_NETWORKS: NetworkType[] = ['eth', 'bnb', 'polygon', 'base', 'arb', 'op', 'avax', 'linea', 'zksync', 'scroll', 'mantle'];

function getAlchemyKey(): string {
  const key = process.env.ALCHEMY_API_KEY;
  if (!key) throw new Error('ALCHEMY_API_KEY not configured');
  return key;
}

const getAlchemyEthUrl = () => `https://eth-mainnet.g.alchemy.com/v2/${getAlchemyKey()}`;
const getAlchemyPolygonUrl = () => `https://polygon-mainnet.g.alchemy.com/v2/${getAlchemyKey()}`;

// 2026-05-20: Per-network KNOWN_*_ENTITIES tables removed. Source of truth
// is now `lib/known-entities.ts` — accessed via `getKnownEntity()` which
// handles ETH (case-insensitive) and TRON/BTC/SOL (case-sensitive) lookups.
//
// Fabricated entries removed in this consolidation (no provenance):
//   - 0xd882cfc20f... "Flagged Address"
//   - 5 fabricated TRON "Pig Butchering"/"Fake Exchange"/"USDT Scam" entries
//   - WannaCry was reclassified from 'scam' to 'ransomware' (correct type).
// See docs/removed-fabricated-entries.md for full audit trail.

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
  return /^0x[a-fA-F0-9]{40}$/i.test(addr);
}

// ---- Alchemy-based fetching (ETH / Polygon) ----

async function fetchAlchemyTransfers(alchemyUrl: string, params: object) {
  const res = await fetchWithTimeout(alchemyUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: 1, jsonrpc: '2.0', method: 'alchemy_getAssetTransfers', params: [params] }),
  });
  const json = await res.json();
  if (json.error) throw new Error(json.error.message);
  return json.result?.transfers || [];
}

async function getAlchemyTransfersForAddress(alchemyUrl: string, address: string) {
  const base = {
    fromBlock: '0x0',
    toBlock: 'latest',
    category: ['external', 'erc20'],
    withMetadata: true,
    maxCount: '0x14', // 20 per direction to limit
  };

  const [outgoing, incoming] = await Promise.all([
    fetchAlchemyTransfers(alchemyUrl, { ...base, fromAddress: address }),
    fetchAlchemyTransfers(alchemyUrl, { ...base, toAddress: address }),
  ]);

  return { outgoing, incoming };
}

// ---- TRON fetching via TronGrid ----

/** Sanitize token symbol — scam tokens often set their symbol to URLs/domains */
function sanitizeTokenSymbol(raw: string): string {
  if (!raw || typeof raw !== 'string') return 'TOKEN';
  const s = raw.trim();
  // Reject URLs, domains, paths, HTML
  if (/[/:.<>]/.test(s) || s.length > 16 || /^https?/i.test(s) || /\.(com|io|org|net|xyz|co)/i.test(s)) {
    return 'TOKEN';
  }
  return s;
}

async function fetchTronGraphTransfers(address: string) {
  const apiKey = process.env.TRONGRID_API_KEY || '';
  const headers: Record<string, string> = {};
  if (apiKey) headers['TRON-PRO-API-KEY'] = apiKey;

  const [trxRes, trc20Res] = await Promise.all([
    fetchWithTimeout(`https://api.trongrid.io/v1/accounts/${address}/transactions?limit=200&only_confirmed=true`, { headers }),
    fetchWithTimeout(`https://api.trongrid.io/v1/accounts/${address}/transactions/trc20?limit=200&only_confirmed=true`, { headers }),
  ]);

  const trxJson = await trxRes.json();
  const trc20Json = await trc20Res.json();

  const outgoing: any[] = [];
  const incoming: any[] = [];

  // Parse native TRX transactions
  const trxData = trxJson.data || [];
  for (const tx of trxData) {
    const contract = tx.raw_data?.contract?.[0];
    if (!contract || contract.type !== 'TransferContract') continue;
    const param = contract.parameter?.value;
    if (!param) continue;

    const from = param.owner_address ? tronHexToBase58(param.owner_address) : '';
    const to = param.to_address ? tronHexToBase58(param.to_address) : '';
    const value = (param.amount || 0) / 1e6; // TRX has 6 decimals
    const hash = tx.txID || '';
    const timestamp = tx.block_timestamp ? new Date(tx.block_timestamp).toISOString() : '';

    const transfer = { from, to, value, asset: 'TRX', hash, metadata: { blockTimestamp: timestamp } };

    if (from === address) {
      outgoing.push(transfer);
    }
    if (to === address) {
      incoming.push(transfer);
    }
  }

  // Parse TRC20 token transactions (returns base58 addresses)
  const trc20Data = trc20Json.data || [];
  for (const tx of trc20Data) {
    const from = tx.from || '';
    const to = tx.to || '';
    const decimals = parseInt(tx.token_info?.decimals || '6', 10);
    const value = parseFloat(tx.value || '0') / Math.pow(10, decimals);
    const symbol = sanitizeTokenSymbol(tx.token_info?.symbol);
    const hash = tx.transaction_id || '';
    const timestamp = tx.block_timestamp ? new Date(tx.block_timestamp).toISOString() : '';

    const transfer = { from, to, value, asset: symbol, hash, metadata: { blockTimestamp: timestamp } };

    if (from === address) {
      outgoing.push(transfer);
    }
    if (to === address) {
      incoming.push(transfer);
    }
  }

  // Limit to 20 per direction
  return {
    outgoing: outgoing.slice(0, 20),
    incoming: incoming.slice(0, 20),
  };
}

const BASE58_ALPHA = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
const B58 = BigInt(58);
const ZERO = BigInt(0);

function tronHexToBase58(hex: string): string {
  // Already base58
  if (hex.startsWith('T')) return hex;
  // Need 21-byte hex starting with 41
  if (!hex.startsWith('41') || hex.length < 42) return hex;

  const payload = Buffer.from(hex.slice(0, 42), 'hex'); // 21 bytes
  const hash1 = createHash('sha256').update(payload).digest();
  const hash2 = createHash('sha256').update(hash1).digest();
  const checksum = hash2.slice(0, 4);
  const full = Buffer.concat([payload, checksum]); // 25 bytes

  let num = BigInt('0x' + full.toString('hex'));
  const chars: string[] = [];
  while (num > ZERO) {
    chars.push(BASE58_ALPHA[Number(num % B58)]);
    num = num / B58;
  }
  for (let i = 0; i < full.length; i++) {
    if (full[i] === 0) chars.push('1');
    else break;
  }
  return chars.reverse().join('');
}

// ---- BSC fetching via Alchemy (BSCScan V1 deprecated, V2 needs paid plan) ----
const getAlchemyBnbUrl = () => `https://bnb-mainnet.g.alchemy.com/v2/${getAlchemyKey()}`;

async function fetchBscGraphTransfers(address: string) {
  return getAlchemyTransfersForAddress(getAlchemyBnbUrl(), address);
}

// ---- Bitcoin fetching via Blockstream ----

async function fetchBtcGraphTransfers(address: string) {
  const outgoing: any[] = [];
  const incoming: any[] = [];

  try {
    const res = await fetchWithTimeout(`https://blockstream.info/api/address/${address}/txs`);
    if (!res.ok) return { outgoing, incoming };
    const txs: any[] = await res.json();

    for (const tx of txs.slice(0, 40)) {
      const hash = tx.txid || '';
      const timestamp = tx.status?.block_time
        ? new Date(tx.status.block_time * 1000).toISOString()
        : '';

      const inVin = tx.vin?.some((i: any) => i.prevout?.scriptpubkey_address === address);
      const inVout = tx.vout?.some((o: any) => o.scriptpubkey_address === address);

      if (inVin) {
        // OUT: find primary recipient
        let primaryTo = '';
        let largest = 0;
        for (const o of tx.vout || []) {
          if (o.scriptpubkey_address !== address && (o.value || 0) > largest) {
            largest = o.value || 0;
            primaryTo = o.scriptpubkey_address || '';
          }
        }
        const totalIn = (tx.vin || []).reduce((s: number, i: any) => i.prevout?.scriptpubkey_address === address ? s + (i.prevout.value || 0) : s, 0);
        const change = (tx.vout || []).reduce((s: number, o: any) => o.scriptpubkey_address === address ? s + (o.value || 0) : s, 0);
        const value = (totalIn - change) / 1e8;

        if (primaryTo && value > 0) {
          outgoing.push({ from: address, to: primaryTo, value, asset: 'BTC', hash, metadata: { blockTimestamp: timestamp } });
        }
      }

      if (inVout && !inVin) {
        // IN: find primary sender
        let primaryFrom = '';
        let largest = 0;
        for (const i of tx.vin || []) {
          if ((i.prevout?.value || 0) > largest) {
            largest = i.prevout?.value || 0;
            primaryFrom = i.prevout?.scriptpubkey_address || '';
          }
        }
        const received = (tx.vout || []).reduce((s: number, o: any) => o.scriptpubkey_address === address ? s + (o.value || 0) : s, 0);
        const value = received / 1e8;

        if (primaryFrom && value > 0) {
          incoming.push({ from: primaryFrom, to: address, value, asset: 'BTC', hash, metadata: { blockTimestamp: timestamp } });
        }
      }
    }
  } catch (err) {
    console.error('[trace-graph] BTC fetch error:', err);
  }

  return { outgoing: outgoing.slice(0, 20), incoming: incoming.slice(0, 20) };
}

// ---- Solana fetching via Helius/public RPC ----

async function fetchSolGraphTransfers(address: string) {
  const outgoing: any[] = [];
  const incoming: any[] = [];

  const heliusKey = process.env.HELIUS_API_KEY || '';
  const rpcUrl = heliusKey
    ? `https://mainnet.helius-rpc.com/?api-key=${heliusKey}`
    : 'https://api.mainnet-beta.solana.com';

  try {
    // Get recent signatures
    const sigRes = await fetchWithTimeout(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'getSignaturesForAddress', params: [address, { limit: 30 }] }),
    });
    const sigJson = await sigRes.json();
    const sigs = sigJson.result || [];

    for (const sig of sigs.slice(0, 20)) {
      try {
        const txRes = await fetchWithTimeout(rpcUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'getTransaction', params: [sig.signature, { encoding: 'jsonParsed', maxSupportedTransactionVersion: 0 }] }),
        });
        const txJson = await txRes.json();
        const tx = txJson.result;
        if (!tx || !tx.meta || tx.meta.err) continue;

        const accountKeys: string[] = tx.transaction.message.accountKeys.map((k: any) => typeof k === 'string' ? k : k.pubkey);
        const idx = accountKeys.indexOf(address);
        if (idx === -1) continue;

        const diff = tx.meta.postBalances[idx] - tx.meta.preBalances[idx];
        if (diff === 0) continue;

        const value = Math.abs(diff) / 1e9;
        const feePayer = accountKeys[0];
        const timestamp = tx.blockTime ? new Date(tx.blockTime * 1000).toISOString() : '';

        if (diff < 0) {
          outgoing.push({ from: address, to: feePayer !== address ? feePayer : (accountKeys[1] || ''), value, asset: 'SOL', hash: sig.signature, metadata: { blockTimestamp: timestamp } });
        } else {
          incoming.push({ from: feePayer !== address ? feePayer : (accountKeys[1] || ''), to: address, value, asset: 'SOL', hash: sig.signature, metadata: { blockTimestamp: timestamp } });
        }
      } catch { /* skip individual tx errors */ }
      // Small delay to avoid rate limits
      await new Promise(r => setTimeout(r, 50));
    }
  } catch (err) {
    console.error('[trace-graph] SOL fetch error:', err);
  }

  return { outgoing: outgoing.slice(0, 20), incoming: incoming.slice(0, 20) };
}

// ---- EVM chains via chain-specific explorer APIs ----

const CHAIN_EXPLORER_APIS: Partial<Record<NetworkType, { base: string; needsKey: boolean; nativeCurrency: string }>> = {
  arb:    { base: 'https://api.etherscan.io/v2/api?chainid=42161', needsKey: true, nativeCurrency: 'ETH' },
  linea:  { base: 'https://api.etherscan.io/v2/api?chainid=59144', needsKey: true, nativeCurrency: 'ETH' },
  base:   { base: 'https://base.blockscout.com/api', needsKey: false, nativeCurrency: 'ETH' },
  op:     { base: 'https://explorer.optimism.io/api', needsKey: false, nativeCurrency: 'ETH' },
  avax:   { base: 'https://api.snowtrace.io/api', needsKey: true, nativeCurrency: 'AVAX' },
  zksync: { base: 'https://block-explorer-api.mainnet.zksync.io/api', needsKey: false, nativeCurrency: 'ETH' },
  scroll: { base: 'https://scroll.blockscout.com/api', needsKey: false, nativeCurrency: 'ETH' },
  mantle: { base: 'https://api.routescan.io/v2/network/mainnet/evm/5000/etherscan/api', needsKey: false, nativeCurrency: 'MNT' },
};

async function fetchChainExplorerGraphTransfers(address: string, network: NetworkType) {
  const config = CHAIN_EXPLORER_APIS[network];
  if (!config) return { outgoing: [], incoming: [] };

  const apiKey = process.env.ETHERSCAN_API_KEY || '';
  const addr = address.toLowerCase();
  const outgoing: any[] = [];
  const incoming: any[] = [];

  try {
    const keyParam = config.needsKey && apiKey ? `&apikey=${apiKey}` : '';
    const sep = config.base.includes('?') ? '&' : '?';
    const baseParams = `${sep}module=account&address=${addr}&sort=desc&page=1&offset=40${keyParam}`;

    const fetchSafe = async (url: string) => {
      try {
        const res = await fetchWithTimeout(url, { redirect: 'follow' }, 15000);
        return await res.json();
      } catch { return { status: '0', result: [] }; }
    };

    const [nativeJson, tokenJson] = await Promise.all([
      fetchSafe(`${config.base}${baseParams}&action=txlist`),
      fetchSafe(`${config.base}${baseParams}&action=tokentx`),
    ]);

    // Native txs
    if (nativeJson.status === '1' && Array.isArray(nativeJson.result)) {
      for (const tx of nativeJson.result.slice(0, 40)) {
        if (tx.isError === '1') continue;
        const from = (tx.from || '').toLowerCase();
        const to = (tx.to || '').toLowerCase();
        const value = parseFloat(tx.value || '0') / 1e18;
        const hash = tx.hash || '';
        const timestamp = tx.timeStamp ? new Date(parseInt(tx.timeStamp, 10) * 1000).toISOString() : '';
        if (value === 0) continue;
        const transfer = { from, to, value, asset: config.nativeCurrency, hash, metadata: { blockTimestamp: timestamp } };
        if (from === addr) outgoing.push(transfer);
        if (to === addr) incoming.push(transfer);
      }
    }

    // Token txs
    if (tokenJson.status === '1' && Array.isArray(tokenJson.result)) {
      for (const tx of tokenJson.result.slice(0, 40)) {
        const from = (tx.from || '').toLowerCase();
        const to = (tx.to || '').toLowerCase();
        const decimals = parseInt(tx.tokenDecimal || '18', 10);
        const value = parseFloat(tx.value || '0') / Math.pow(10, decimals);
        const symbol = sanitizeTokenSymbol(tx.tokenSymbol || 'TOKEN');
        const hash = tx.hash || '';
        const timestamp = tx.timeStamp ? new Date(parseInt(tx.timeStamp, 10) * 1000).toISOString() : '';
        const transfer = { from, to, value, asset: symbol, hash, metadata: { blockTimestamp: timestamp } };
        if (from === addr) outgoing.push(transfer);
        if (to === addr) incoming.push(transfer);
      }
    }
  } catch (err) {
    console.error(`[trace-graph] ${network} explorer API error:`, err);
  }

  return { outgoing: outgoing.slice(0, 20), incoming: incoming.slice(0, 20) };
}

// ---- Unified transfer fetcher ----

async function getTransfersForAddress(network: NetworkType, address: string) {
  switch (network) {
    case 'btc':
      return fetchBtcGraphTransfers(address);
    case 'eth':
      return getAlchemyTransfersForAddress(getAlchemyEthUrl(), address);
    case 'sol':
      return fetchSolGraphTransfers(address);
    case 'polygon':
      return getAlchemyTransfersForAddress(getAlchemyPolygonUrl(), address);
    case 'trx':
      return fetchTronGraphTransfers(address);
    case 'bnb':
      return fetchBscGraphTransfers(address);
    default: {
      // All other EVM chains via chain-specific explorer APIs
      if (CHAIN_EXPLORER_APIS[network]) return fetchChainExplorerGraphTransfers(address, network);
      return { outgoing: [], incoming: [] };
    }
  }
}

// ---- Graph types ----

interface GraphNode {
  id: string;
  label: string;
  type: 'source' | 'exchange' | 'mixer' | 'defi' | 'scam' | 'scam_database' | 'intermediate' | 'unknown';
  totalIn: number;
  totalOut: number;
  txCount: number;
  scamInfo?: { platforms: string[]; totalLoss: number; reports: number };
}

interface GraphEdge {
  source: string;
  target: string;
  value: number;
  token: string;
  hash: string;
  timestamp: string;
}

// ---- Auto-detect: try EVM chains in parallel, return first with data ----

const AUTO_EVM_ORDER: NetworkType[] = ['eth', 'bnb', 'polygon', 'base', 'arb', 'op', 'avax', 'linea', 'zksync', 'scroll', 'mantle'];

async function detectActiveEVMNetworks(address: string): Promise<{ best: NetworkType; activeOn: NetworkType[] }> {
  const results = await Promise.allSettled(
    AUTO_EVM_ORDER.map(async (net) => {
      const { outgoing, incoming } = await getTransfersForAddress(net, address.toLowerCase());
      const txCount = outgoing.length + incoming.length;
      if (txCount === 0) throw new Error('No data');
      return { net, txCount };
    })
  );

  const active: { net: NetworkType; txCount: number }[] = [];
  for (const r of results) {
    if (r.status === 'fulfilled') active.push(r.value);
  }

  if (active.length === 0) return { best: 'eth', activeOn: [] };

  // Pick chain with most transactions as "best"
  active.sort((a, b) => b.txCount - a.txCount);
  return {
    best: active[0].net,
    activeOn: active.map((a) => a.net),
  };
}

// ---- Route handler ----

export async function POST(req: NextRequest) {
  try {
    const { address, depth = 1, network = 'eth' } = await req.json();

    let net: NetworkType;
    let activeNetworks: NetworkType[] = [];

    if (network === 'auto') {
      // For 0x addresses, auto-detect EVM chain; for others, detect by format
      if (/^0x[a-fA-F0-9]{40}$/i.test(address)) {
        const detected = await detectActiveEVMNetworks(address);
        net = detected.best;
        activeNetworks = detected.activeOn;
      } else if (/^T[a-zA-Z0-9]{33}$/.test(address)) {
        net = 'trx';
      } else if (/^(1|3)[a-zA-Z0-9]{24,33}$/.test(address) || /^bc1[a-zA-Z0-9]{25,62}$/.test(address)) {
        net = 'btc';
      } else if (/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address)) {
        net = 'sol';
      } else {
        net = 'eth';
      }
    } else {
      net = (VALID_NETWORKS.includes(network) ? network : 'eth') as NetworkType;
    }

    if (!address || !isValidAddress(net, address)) {
      return NextResponse.json({ error: `Invalid ${net.toUpperCase()} address` }, { status: 400 });
    }

    const maxDepth = Math.min(Math.max(1, depth), 3);
    const nodes = new Map<string, GraphNode>();
    const edges: GraphEdge[] = [];
    const visited = new Set<string>();
    const MAX_NODES = 50;

    // BTC, SOL, TRON addresses are case-sensitive; EVM addresses are lowercased
    const caseSensitive = net === 'btc' || net === 'sol' || net === 'trx';
    const normalizeAddr = (addr: string) => (caseSensitive ? addr : addr.toLowerCase());

    const getNodeType = (addr: string): GraphNode['type'] => {
      const entity = getKnownEntity(addr);
      if (entity) return entity.type as GraphNode['type'];
      return 'unknown';
    };

    const ensureNode = (addr: string, isSource = false) => {
      const key = normalizeAddr(addr);
      if (!nodes.has(key)) {
        const entity = getKnownEntity(key);
        nodes.set(key, {
          id: key,
          label: entity?.label || `${key.slice(0, 6)}…${key.slice(-4)}`,
          type: isSource ? 'source' : getNodeType(key),
          totalIn: 0,
          totalOut: 0,
          txCount: 0,
        });
      }
      return nodes.get(key)!;
    };

    const traceHop = async (addr: string, currentDepth: number) => {
      const key = normalizeAddr(addr);
      if (visited.has(key) || currentDepth > maxDepth || nodes.size >= MAX_NODES) return;
      visited.add(key);

      const { outgoing, incoming } = await getTransfersForAddress(net, key);

      for (const tx of outgoing) {
        if (!tx.to || nodes.size >= MAX_NODES) continue;
        const toKey = normalizeAddr(tx.to);
        const fromNode = ensureNode(key, currentDepth === 1);
        const toNode = ensureNode(toKey);
        fromNode.totalOut += tx.value || 0;
        fromNode.txCount++;
        toNode.totalIn += tx.value || 0;
        toNode.txCount++;

        const nativeFallback = net === 'trx' ? 'TRX' : net === 'bnb' ? 'BNB' : net === 'polygon' ? 'MATIC' : 'ETH';
        edges.push({
          source: key,
          target: toKey,
          value: tx.value || 0,
          token: sanitizeTokenSymbol(tx.asset) !== 'TOKEN' ? sanitizeTokenSymbol(tx.asset) : nativeFallback,
          hash: tx.hash || '',
          timestamp: tx.metadata?.blockTimestamp || '',
        });
      }

      for (const tx of incoming) {
        if (!tx.from || nodes.size >= MAX_NODES) continue;
        const fromKey = normalizeAddr(tx.from);
        const fromNode = ensureNode(fromKey);
        const toNode = ensureNode(key, currentDepth === 1);
        fromNode.totalOut += tx.value || 0;
        fromNode.txCount++;
        toNode.totalIn += tx.value || 0;
        toNode.txCount++;

        const nativeFallbackIn = net === 'trx' ? 'TRX' : net === 'bnb' ? 'BNB' : net === 'polygon' ? 'MATIC' : 'ETH';
        edges.push({
          source: fromKey,
          target: key,
          value: tx.value || 0,
          token: sanitizeTokenSymbol(tx.asset) !== 'TOKEN' ? sanitizeTokenSymbol(tx.asset) : nativeFallbackIn,
          hash: tx.hash || '',
          timestamp: tx.metadata?.blockTimestamp || '',
        });
      }

      // Trace next hop for outgoing destinations
      if (currentDepth < maxDepth) {
        const nextAddresses = outgoing
          .map((tx: any) => normalizeAddr(tx.to || ''))
          .filter((a: string) => a && !visited.has(a) && !getKnownEntity(a))
          .slice(0, 5); // limit branches

        for (const next of nextAddresses) {
          if (nodes.size >= MAX_NODES) break;
          await traceHop(next, currentDepth + 1);
        }
      }
    };

    const rootAddr = normalizeAddr(address);
    ensureNode(rootAddr, true);
    await traceHop(rootAddr, 1);

    // Enrich nodes with scam database lookups (best-effort, non-blocking)
    try {
      const unknownNodes = Array.from(nodes.values()).filter(
        n => n.type === 'unknown' || n.type === 'intermediate' || n.type === 'scam'
      );
      const lookups = unknownNodes.slice(0, 15).map(async (node) => {
        try {
          const addrData = await getAddressIndex(node.id);
          if (addrData && addrData.platforms.length > 0) {
            node.type = 'scam_database';
            node.label = `${addrData.platformNames[0]} \u26A0\uFE0F`;
            node.scamInfo = {
              platforms: addrData.platformNames,
              totalLoss: addrData.totalLoss,
              reports: addrData.reports.length,
            };
          }
        } catch { /* skip individual lookup errors */ }
      });
      await Promise.all(lookups);
    } catch { /* scam DB enrichment failed — continue without it */ }

    const knownEntities = Array.from(nodes.values())
      .filter((n) => n.type === 'exchange' || n.type === 'mixer' || n.type === 'defi' || n.type === 'scam' || n.type === 'scam_database')
      .map((n) => n.label);

    return NextResponse.json({
      nodes: Array.from(nodes.values()),
      edges,
      knownEntities,
      totalNodes: nodes.size,
      totalEdges: edges.length,
      maxReached: nodes.size >= MAX_NODES,
      detectedNetwork: net,
      activeNetworks,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Trace failed' }, { status: 500 });
  }
}
