/**
 * Cross-Chain Tracing Engine
 *
 * Detects bridge interactions in transaction data, scans the same address
 * on other EVM chains, and builds a cross-chain escape path with intent analysis.
 *
 * Works with existing Alchemy/Etherscan data — no bridge event parsing needed.
 */

import { fetchWithTimeout } from './fetch-timeout';
import logger from '@/lib/logger';

/* ── Bridge contract addresses ── */
const BRIDGE_CONTRACTS: Record<string, { name: string; chains: string[] }> = {
  // Stargate V1/V2
  '0x8731d54e9d02c286767d56ac03e8037c07e01e98': { name: 'Stargate Router', chains: ['ETH', 'ARB', 'OP', 'POLYGON', 'BNB', 'AVAX', 'BASE'] },
  '0xaf5191b0de278c7286d6c7cc6ab6bb8a73ba2cd6': { name: 'Stargate (STG)', chains: ['ETH', 'ARB', 'OP', 'POLYGON', 'BNB', 'AVAX'] },
  '0x296f55f8fb28e498b858d0bcda06d955b2cb3f97': { name: 'Stargate V2', chains: ['ETH', 'ARB', 'OP', 'BASE', 'AVAX'] },
  // Hop Protocol
  '0xb8901acb165ed027e32754e0ffe830802919727f': { name: 'Hop Protocol', chains: ['ETH', 'ARB', 'OP', 'POLYGON'] },
  // Across
  '0x5c7bcd6e7de5423a257d81b442095a1a6ced35c5': { name: 'Across Protocol', chains: ['ETH', 'ARB', 'OP', 'POLYGON', 'BASE'] },
  '0x269727f088f16e1aea52cf5a97b1cd41daa3f02d': { name: 'Across V2', chains: ['ETH', 'ARB', 'OP', 'POLYGON'] },
  // Native bridges
  '0x4dbd4fc535ac27206064b68ffcf827b0a60bab3f': { name: 'Arbitrum Gateway', chains: ['ETH', 'ARB'] },
  '0x99c9fc46f92e8a1c0dec1b1747d010903e884be1': { name: 'Optimism Gateway', chains: ['ETH', 'OP'] },
  '0xa0c68c638235ee32657e8f720a23cec1bfc77c77': { name: 'Polygon Bridge (PoS)', chains: ['ETH', 'POLYGON'] },
  '0x3154cf16ccdb4c6d922629664174b904d80f2c35': { name: 'Base Bridge', chains: ['ETH', 'BASE'] },
  // Multichain / Anyswap
  '0x6b7a87899490ece95443e979ca9485cbe7e71522': { name: 'Multichain', chains: ['ETH', 'BNB', 'POLYGON', 'AVAX'] },
  '0xe95fd76cf16008c12ff3b3a937cb16cd9cc20284': { name: 'Multichain V4', chains: ['ETH', 'BNB', 'POLYGON', 'AVAX'] },
  // Wormhole
  '0x98f3c9e6e3face36baad05fe09d375ef1464288b': { name: 'Wormhole', chains: ['ETH', 'SOL', 'BNB', 'POLYGON', 'AVAX'] },
  // Synapse
  '0x2796317b0ff8538f253012862c06787adfb8ceb6': { name: 'Synapse Bridge', chains: ['ETH', 'ARB', 'OP', 'POLYGON', 'BNB', 'AVAX'] },
  // Celer cBridge
  '0x5427fefa711eff984124bfbb1ab6fbf5e3da1820': { name: 'Celer cBridge', chains: ['ETH', 'ARB', 'OP', 'POLYGON', 'BNB'] },
  // LayerZero endpoint (generic)
  '0x66a71dcef29a0ffbdbe3c6a460a3b5bc225cd675': { name: 'LayerZero', chains: ['ETH', 'ARB', 'OP', 'POLYGON', 'BNB', 'AVAX', 'BASE'] },
  // Orbiter Finance
  '0x80c67432656d59144ceff962e8faf8926599bcf8': { name: 'Orbiter Finance', chains: ['ETH', 'ARB', 'OP', 'POLYGON', 'BASE', 'ZKSYNC', 'LINEA'] },
  '0xe4edb277e41dc89ab076a1f049f4a3efa700bce8': { name: 'Orbiter Finance 2', chains: ['ETH', 'ARB', 'OP', 'BASE', 'ZKSYNC'] },
};

/* ── Known entities for final destination identification ── */
const KNOWN_ENTITIES: Record<string, { label: string; type: 'exchange' | 'mixer' | 'defi' | 'scam' }> = {
  '0x28c6c06298d514db089934071355e5743bf21d60': { label: 'Binance', type: 'exchange' },
  '0xbe0eb53f46cd790cd13851d5eff43d12404d33e8': { label: 'Binance 2', type: 'exchange' },
  '0xf977814e90da44bfa03b6295a0616a897441acec': { label: 'Binance 3', type: 'exchange' },
  '0x71660c4005ba85c37ccec55d0c4493e66fe775d3': { label: 'Coinbase', type: 'exchange' },
  '0x503828976d22510aad0201ac7ec88293211d23da': { label: 'Coinbase 3', type: 'exchange' },
  '0x2910543af39aba0cd09dbb2d50200b3e800a63d2': { label: 'Kraken', type: 'exchange' },
  '0x6cc5f688a315f3dc28a7781717a9a798a59fda7b': { label: 'OKX', type: 'exchange' },
  '0xab5c66752a9e8167967685f1450532fb96d5d24f': { label: 'Huobi', type: 'exchange' },
  '0xf89d7b9c864f589bbf53a82105107622b35eaa40': { label: 'Bybit', type: 'exchange' },
  '0x2b5634c42055806a59e9107ed44d43c426e58258': { label: 'KuCoin', type: 'exchange' },
  '0x0d0707963952f2fba59dd06f2b425ace40b492fe': { label: 'Gate.io', type: 'exchange' },
  '0x077d360f11d220e4d5d9ba269170a1ef1fe5b62d': { label: 'ChangeNOW', type: 'exchange' },
  '0x12d66f87a04a9e220c9d5078b7961664a758ad11': { label: 'Tornado Cash', type: 'mixer' },
  '0x47ce0c6ed5b0ce3d3a51fdb1c52dc66a7c3c2936': { label: 'Tornado Cash 2', type: 'mixer' },
  '0x7f268357a8c2552623316e2562d90e642bb538e5': { label: 'FixedFloat', type: 'mixer' },
};

const CHAIN_LABELS: Record<string, string> = {
  eth: 'Ethereum', arb: 'Arbitrum', op: 'Optimism', base: 'Base',
  polygon: 'Polygon', bnb: 'BNB Chain', avax: 'Avalanche',
  linea: 'Linea', zksync: 'zkSync', scroll: 'Scroll', mantle: 'Mantle',
  sol: 'Solana', trx: 'TRON', btc: 'Bitcoin',
};

/* ── Exported types ── */
export interface BridgeInteraction {
  bridgeName: string;
  direction: 'OUT' | 'IN';
  counterparty: string;
  amount: number;
  token: string;
  date: string;
  possibleDestChains: string[];
}

export interface ChainActivity {
  chain: string;
  chainLabel: string;
  txCount: number;
  nativeBalance: number;
}

export interface CrossChainHop {
  step: number;
  fromChain: string;
  toChain: string;
  bridge: string;
  amount: number;
  token: string;
  date: string;
  confidence: number;
}

export interface CrossChainTrace {
  detected: boolean;
  bridgeInteractions: BridgeInteraction[];
  activeChains: ChainActivity[];
  hops: CrossChainHop[];
  escapePathSummary: string;
  finalDestination: {
    chain: string;
    address: string;
    entityType: string;
    entityName: string | null;
  } | null;
  intent: {
    label: 'NORMAL' | 'OBFUSCATION' | 'LAUNDERING';
    confidence: number;
    reason: string;
  };
}

/* ── Internal types ── */
interface TxInput {
  from: string;
  to: string;
  value: number;
  asset: string | null;
  direction: 'IN' | 'OUT';
  date: string;
  category?: string;
}

/* ── Step 1: Detect bridge interactions in existing transactions ── */
function detectBridgeInteractions(
  transactions: TxInput[],
  address: string,
): BridgeInteraction[] {
  const interactions: BridgeInteraction[] = [];
  const addrLower = address.toLowerCase();

  for (const tx of transactions) {
    const counterparty = tx.direction === 'OUT' ? (tx.to || '').toLowerCase() : (tx.from || '').toLowerCase();
    const bridge = BRIDGE_CONTRACTS[counterparty];

    if (bridge && tx.value > 0.001) {
      interactions.push({
        bridgeName: bridge.name,
        direction: tx.direction,
        counterparty,
        amount: tx.value,
        token: tx.asset || 'ETH',
        date: tx.date,
        possibleDestChains: bridge.chains,
      });
    }
  }

  // Sort by date
  interactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  return interactions;
}

/* ── Step 2: Scan same address on other EVM chains ── */
function getAlchemyKey(): string {
  return process.env.ALCHEMY_API_KEY || '';
}

const ALCHEMY_HOSTS: Record<string, string> = {
  eth: 'eth-mainnet', arb: 'arb-mainnet', op: 'opt-mainnet',
  base: 'base-mainnet', polygon: 'polygon-mainnet', bnb: 'bnb-mainnet',
};

const ETHERSCAN_V2_CHAINS: Record<string, { apiBase: string; needsKey: boolean }> = {
  avax: { apiBase: 'https://api.snowtrace.io/api', needsKey: true },
  linea: { apiBase: 'https://api.etherscan.io/v2/api?chainid=59144', needsKey: true },
  zksync: { apiBase: 'https://block-explorer-api.mainnet.zksync.io/api', needsKey: false },
  scroll: { apiBase: 'https://scroll.blockscout.com/api', needsKey: false },
  mantle: { apiBase: 'https://api.routescan.io/v2/network/mainnet/evm/5000/etherscan/api', needsKey: false },
};

async function getChainTxCount(chain: string, address: string): Promise<{ txCount: number; balance: number }> {
  const key = getAlchemyKey();

  // Alchemy-supported chains
  const host = ALCHEMY_HOSTS[chain];
  if (host && key) {
    const url = `https://${host}.g.alchemy.com/v2/${key}`;
    try {
      const [countRes, balRes] = await Promise.all([
        fetchWithTimeout(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: 1, jsonrpc: '2.0', method: 'eth_getTransactionCount', params: [address, 'latest'] }),
        }, 8000),
        fetchWithTimeout(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: 2, jsonrpc: '2.0', method: 'eth_getBalance', params: [address, 'latest'] }),
        }, 8000),
      ]);
      const countData = await countRes.json();
      const balData = await balRes.json();
      return {
        txCount: Number(BigInt(countData.result || '0x0')),
        balance: Number(BigInt(balData.result || '0x0')) / 1e18,
      };
    } catch {
      return { txCount: 0, balance: 0 };
    }
  }

  // Etherscan V2 chains
  const esConfig = ETHERSCAN_V2_CHAINS[chain];
  if (esConfig) {
    try {
      const apiKey = process.env.ETHERSCAN_API_KEY || '';
      const keyParam = esConfig.needsKey && apiKey ? `&apikey=${apiKey}` : '';
      const sep = esConfig.apiBase.includes('?') ? '&' : '?';
      const url = `${esConfig.apiBase}${sep}module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=1&offset=5&sort=desc${keyParam}`;
      const res = await fetchWithTimeout(url, {}, 8000);
      const data = await res.json();
      const count = data.status === '1' && Array.isArray(data.result) ? data.result.length : 0;
      return { txCount: count > 0 ? count : 0, balance: 0 };
    } catch {
      return { txCount: 0, balance: 0 };
    }
  }

  return { txCount: 0, balance: 0 };
}

async function scanActiveChains(address: string, originChain: string): Promise<ChainActivity[]> {
  const chainsToScan = ['eth', 'arb', 'op', 'base', 'polygon', 'bnb', 'avax', 'linea', 'zksync', 'scroll', 'mantle']
    .filter(c => c !== originChain);

  const results = await Promise.allSettled(
    chainsToScan.map(async (chain) => {
      const { txCount, balance } = await getChainTxCount(chain, address.toLowerCase());
      if (txCount === 0 && balance === 0) throw new Error('inactive');
      return { chain, chainLabel: CHAIN_LABELS[chain] || chain.toUpperCase(), txCount, nativeBalance: balance };
    }),
  );

  const active: ChainActivity[] = [];
  for (const r of results) {
    if (r.status === 'fulfilled') active.push(r.value);
  }
  active.sort((a, b) => b.txCount - a.txCount);
  return active;
}

/* ── Step 3: Build cross-chain hops ── */
function buildHops(
  bridgeInteractions: BridgeInteraction[],
  activeChains: ChainActivity[],
  originChain: string,
): CrossChainHop[] {
  const hops: CrossChainHop[] = [];
  const activeChainsSet = new Set(activeChains.map(c => c.chain));
  const outBridges = bridgeInteractions.filter(b => b.direction === 'OUT');

  for (let i = 0; i < outBridges.length; i++) {
    const bridge = outBridges[i];
    // Determine most likely destination: intersection of bridge's possible chains and active chains
    const possibleDests = bridge.possibleDestChains
      .map(c => c.toLowerCase())
      .filter(c => c !== originChain && activeChainsSet.has(c));

    const destChain = possibleDests[0] || bridge.possibleDestChains.filter(c => c.toLowerCase() !== originChain)[0]?.toLowerCase() || 'unknown';

    hops.push({
      step: i + 1,
      fromChain: i === 0 ? originChain : (hops[i - 1]?.toChain || originChain),
      toChain: destChain,
      bridge: bridge.bridgeName,
      amount: bridge.amount,
      token: bridge.token,
      date: bridge.date,
      confidence: possibleDests.length > 0 ? 85 : 60,
    });
  }

  return hops;
}

/* ── Step 4: Find final destination ── */
function identifyFinalDestination(
  transactions: TxInput[],
  hops: CrossChainHop[],
  activeChains: ChainActivity[],
): CrossChainTrace['finalDestination'] {
  // Check outgoing transactions for known entities
  const outTxs = transactions.filter(tx => tx.direction === 'OUT' && tx.value > 0.01);

  for (const tx of outTxs) {
    const to = (tx.to || '').toLowerCase();
    const entity = KNOWN_ENTITIES[to];
    if (entity) {
      return {
        chain: hops.length > 0 ? hops[hops.length - 1].toChain : 'eth',
        address: to,
        entityType: entity.type,
        entityName: entity.label,
      };
    }
  }

  // If active on other chains, the last chain with most activity may be the destination
  if (activeChains.length > 0 && hops.length > 0) {
    return {
      chain: activeChains[0].chain,
      address: 'same wallet',
      entityType: 'unknown',
      entityName: null,
    };
  }

  return null;
}

/* ── Step 5: Intent analysis ── */
function analyzeIntent(
  bridgeInteractions: BridgeInteraction[],
  activeChains: ChainActivity[],
  hops: CrossChainHop[],
  hasMixer: boolean,
): CrossChainTrace['intent'] {
  const bridgeCount = bridgeInteractions.filter(b => b.direction === 'OUT').length;
  const chainCount = activeChains.length + 1; // +1 for origin

  // Mixer + bridge = strong laundering signal
  if (hasMixer && bridgeCount > 0) {
    return {
      label: 'LAUNDERING',
      confidence: 90,
      reason: `Bridge + mixer combination: ${bridgeCount} bridge hop(s) with mixer interaction detected`,
    };
  }

  // Multiple bridges in rapid succession
  if (bridgeCount >= 3) {
    const outBridges = bridgeInteractions.filter(b => b.direction === 'OUT');
    const first = new Date(outBridges[0].date).getTime();
    const last = new Date(outBridges[outBridges.length - 1].date).getTime();
    const hours = (last - first) / (1000 * 60 * 60);

    if (hours < 48) {
      return {
        label: 'LAUNDERING',
        confidence: 85,
        reason: `Rapid cross-chain movement: ${bridgeCount} bridges across ${chainCount} chains in ${Math.round(hours)} hours`,
      };
    }
  }

  // 2+ different bridge protocols or 4+ active chains
  if (bridgeCount >= 2 || chainCount >= 4) {
    return {
      label: 'OBFUSCATION',
      confidence: 70,
      reason: `Complex cross-chain path: ${bridgeCount} bridge(s), ${chainCount} active chain(s)`,
    };
  }

  // Single bridge, normal behavior
  if (bridgeCount === 1) {
    return {
      label: 'NORMAL',
      confidence: 60,
      reason: 'Single bridge transfer — common DeFi behavior',
    };
  }

  // Active on multiple chains but no bridge detected (could be CEX withdrawals)
  if (chainCount >= 3) {
    return {
      label: 'OBFUSCATION',
      confidence: 55,
      reason: `Activity on ${chainCount} chains without detected bridge — possible CEX-mediated transfers`,
    };
  }

  return {
    label: 'NORMAL',
    confidence: 50,
    reason: 'No significant cross-chain activity detected',
  };
}

/* ── Main export ── */
export async function traceCrossChain(
  address: string,
  originChain: string,
  transactions: TxInput[],
  identifiedEntities: { type: string }[],
): Promise<CrossChainTrace> {
  logger.info({ address: address.slice(0, 10), originChain }, '[crossChain] Starting trace');

  // Only scan for EVM addresses
  const isEVM = /^0x[a-fA-F0-9]{40}$/i.test(address);

  // Step 1: Detect bridge interactions from existing tx data
  const bridgeInteractions = detectBridgeInteractions(transactions, address);
  logger.info({ bridges: bridgeInteractions.length }, '[crossChain] Bridge interactions found');

  // Step 2: Scan other chains (EVM only)
  let activeChains: ChainActivity[] = [];
  if (isEVM) {
    try {
      activeChains = await scanActiveChains(address, originChain);
      logger.info({ activeChains: activeChains.length }, '[crossChain] Multi-chain scan done');
    } catch (err) {
      logger.error({ err }, '[crossChain] Multi-chain scan failed');
    }
  }

  // No cross-chain activity
  if (bridgeInteractions.length === 0 && activeChains.length === 0) {
    return {
      detected: false,
      bridgeInteractions: [],
      activeChains: [],
      hops: [],
      escapePathSummary: 'No cross-chain activity detected.',
      finalDestination: null,
      intent: { label: 'NORMAL', confidence: 50, reason: 'No cross-chain activity detected' },
    };
  }

  // Step 3: Build hops
  const hops = buildHops(bridgeInteractions, activeChains, originChain);

  // Step 4: Final destination
  const hasMixer = identifiedEntities.some(e => e.type === 'mixer');
  const finalDestination = identifyFinalDestination(transactions, hops, activeChains);

  // Step 5: Intent
  const intent = analyzeIntent(bridgeInteractions, activeChains, hops, hasMixer);

  // Build summary
  const allChains = [originChain, ...activeChains.map(c => c.chain)];
  const uniqueChains = Array.from(new Set(allChains));
  const chainLabels = uniqueChains.map(c => CHAIN_LABELS[c] || c.toUpperCase());

  let summary: string;
  if (hops.length > 0) {
    const path = [originChain, ...hops.map(h => h.toChain)]
      .map(c => (CHAIN_LABELS[c] || c).toUpperCase())
      .join(' → ');
    summary = `Cross-chain path detected: ${path}. ${bridgeInteractions.length} bridge interaction(s) via ${Array.from(new Set(bridgeInteractions.map(b => b.bridgeName))).join(', ')}.`;
  } else if (activeChains.length > 0) {
    summary = `Wallet active on ${uniqueChains.length} chains: ${chainLabels.join(', ')}. No direct bridge transactions detected — transfers may have been mediated through centralized exchanges.`;
  } else {
    summary = 'No cross-chain activity detected.';
  }

  if (finalDestination?.entityName) {
    summary += ` Final destination: ${finalDestination.entityName} on ${CHAIN_LABELS[finalDestination.chain] || finalDestination.chain}.`;
  }

  return {
    detected: true,
    bridgeInteractions,
    activeChains,
    hops,
    escapePathSummary: summary,
    finalDestination,
    intent,
  };
}
