import React from 'react';
import { renderToBuffer } from '@react-pdf/renderer';
import { sendReport } from './sendReport';
import { ReportDocument } from './reportPdf';
import { uploadReport, getReportDownloadUrl } from './s3-storage';
import { logReport } from './reports-log';
import { fetchBtcTransfers } from './bitcoin-tracker';
import { fetchSolTransfers } from './solana-tracker';
import { fetchTronTransfers } from './tron-tracker';
import { fetchEtherscanV2Transfers } from './etherscan-v2-tracker';
import { getAddressIndex } from './scam-db';
import { buildGraphData, type GraphData } from './generateGraphData';
import QRCode from 'qrcode';
import logger from '@/lib/logger';

function getAlchemyKey(): string {
  const key = process.env.ALCHEMY_API_KEY;
  if (!key) throw new Error('ALCHEMY_API_KEY not configured');
  return key;
}

function getAlchemyUrl(network: string = 'eth'): string {
  const key = getAlchemyKey();
  const hosts: Record<string, string> = {
    eth: 'eth-mainnet',
    bnb: 'bnb-mainnet',
    polygon: 'polygon-mainnet',
  };
  const host = hosts[network] || 'eth-mainnet';
  return `https://${host}.g.alchemy.com/v2/${key}`;
}

const NETWORK_LABELS: Record<string, string> = {
  eth: 'Ethereum (ETH)', btc: 'Bitcoin (BTC)', sol: 'Solana (SOL)', trx: 'TRON (TRX)',
  bnb: 'BNB Chain (BNB)', base: 'Base', arb: 'Arbitrum (ARB)', op: 'Optimism (OP)',
  avax: 'Avalanche (AVAX)', linea: 'Linea', zksync: 'zkSync Era', scroll: 'Scroll',
  mantle: 'Mantle', polygon: 'Polygon',
};

const NATIVE_CURRENCY: Record<string, string> = {
  eth: 'ETH', btc: 'BTC', sol: 'SOL', trx: 'TRX', bnb: 'BNB',
  base: 'ETH', arb: 'ETH', op: 'ETH', avax: 'AVAX', linea: 'ETH',
  zksync: 'ETH', scroll: 'ETH', mantle: 'MNT', polygon: 'MATIC',
};

/** EVM chains that use etherscan-v2-tracker */
const EVM_CHAINS = new Set(['base', 'arb', 'op', 'avax', 'linea', 'zksync', 'scroll', 'mantle']);

const KNOWN_ENTITIES: Record<string, { label: string; type: 'exchange' | 'mixer' | 'defi' | 'scam' }> = {
  '0x28c6c06298d514db089934071355e5743bf21d60': { label: 'Binance', type: 'exchange' },
  '0xbe0eb53f46cd790cd13851d5eff43d12404d33e8': { label: 'Binance 2', type: 'exchange' },
  '0xf977814e90da44bfa03b6295a0616a897441acec': { label: 'Binance 3', type: 'exchange' },
  '0x8894e0a0c962cb723c1976a4421c95949be2d4e3': { label: 'Binance 4', type: 'exchange' },
  '0x21a31ee1afc51d94c2efccaa2092ad1028285549': { label: 'Binance 5', type: 'exchange' },
  '0x71660c4005ba85c37ccec55d0c4493e66fe775d3': { label: 'Coinbase', type: 'exchange' },
  '0xa090e606e30bd747d4e6245a1517ebe430f0057e': { label: 'Coinbase 2', type: 'exchange' },
  '0x503828976d22510aad0201ac7ec88293211d23da': { label: 'Coinbase 3', type: 'exchange' },
  '0x2910543af39aba0cd09dbb2d50200b3e800a63d2': { label: 'Kraken', type: 'exchange' },
  '0x0a869d79a7052c7f1b55a8ebabbea3420f0d1e13': { label: 'Kraken 2', type: 'exchange' },
  '0x6cc5f688a315f3dc28a7781717a9a798a59fda7b': { label: 'OKX', type: 'exchange' },
  '0x236f9f97e0e62388479bf9e5ba4889e46b0273c3': { label: 'OKX 2', type: 'exchange' },
  '0xab5c66752a9e8167967685f1450532fb96d5d24f': { label: 'Huobi', type: 'exchange' },
  '0x6748f50f686bfbca6fe8ad62b22228b87f31ff2b': { label: 'Huobi 2', type: 'exchange' },
  '0xf89d7b9c864f589bbf53a82105107622b35eaa40': { label: 'Bybit', type: 'exchange' },
  '0x2b5634c42055806a59e9107ed44d43c426e58258': { label: 'KuCoin', type: 'exchange' },
  '0x0d0707963952f2fba59dd06f2b425ace40b492fe': { label: 'Gate.io', type: 'exchange' },
  '0x77134cbc06cb00b66f4c7e623d5fdbf6777635ec': { label: 'Bitfinex', type: 'exchange' },
  '0x6262998ced04146fa42253a5c0af90ca02dfd2a3': { label: 'Crypto.com', type: 'exchange' },
  '0x077d360f11d220e4d5d9ba269170a1ef1fe5b62d': { label: 'ChangeNOW', type: 'exchange' },
  // OFAC-Sanctioned Mixers (Tornado Cash)
  '0x12d66f87a04a9e220c9d5078b7961664a758ad11': { label: 'Tornado Cash (OFAC)', type: 'mixer' },
  '0x47ce0c6ed5b0ce3d3a51fdb1c52dc66a7c3c2936': { label: 'Tornado Cash 0.1 ETH (OFAC)', type: 'mixer' },
  '0x910cbd523d972eb0a6f4cae4618ad62622b39dbf': { label: 'Tornado Cash 10 ETH (OFAC)', type: 'mixer' },
  '0xa160cdab225685da1d56aa342ad8841c3b53f291': { label: 'Tornado Cash 100 ETH (OFAC)', type: 'mixer' },
  '0xd90e2f925da726b50c4ed8d0fb90ad053324f31b': { label: 'Tornado Cash 1 ETH (OFAC)', type: 'mixer' },
  '0xd4b88df4d29f5cedd6857912842cff3b20c8cfa3': { label: 'Tornado Cash 1000 DAI (OFAC)', type: 'mixer' },
  '0xfd8610d20aa15b7b2e3be39b396a1bc3516c7144': { label: 'Tornado Cash 10000 DAI (OFAC)', type: 'mixer' },
  '0x23773e65ed146a459791799d01336db287f25334': { label: 'Tornado Cash Governance (OFAC)', type: 'mixer' },
  // OFAC-Sanctioned Entities (Lazarus Group, Blender, Sinbad)
  '0x8589427373d6d84e98730d7795d8f6f8731fda16': { label: 'Ronin Bridge Exploiter (Lazarus/OFAC)', type: 'scam' },
  '0x098b716b8aaf21512996dc57eb0615e2383e2f96': { label: 'Ronin Bridge Exploiter 2 (OFAC)', type: 'scam' },
  '0xc455f7fd3e0e12afd51fba5c106909934d8a0e4a': { label: 'Blender.io (OFAC)', type: 'mixer' },
  '0x36dd7b862746fddfa5108aeb58fc831ae3961230': { label: 'Sinbad.io (OFAC)', type: 'mixer' },
  // Other Mixers
  '0x7f268357a8c2552623316e2562d90e642bb538e5': { label: 'FixedFloat', type: 'mixer' },
  '0x7a250d5630b4cf539739df2c5dacb4c659f2488d': { label: 'Uniswap V2', type: 'defi' },
  '0xe592427a0aece92de3edee1f18e0157c05861564': { label: 'Uniswap V3', type: 'defi' },
  '0xd9e1ce17f2641f24ae83637ab66a2cca9c378b9f': { label: 'SushiSwap', type: 'defi' },
  '0xdef1c0ded9bec7f1a1670819833240f027b25eff': { label: '0x Exchange', type: 'defi' },
  '0xd882cfc20f52f2599d84b8e8d58c7fb62cfe344b': { label: 'Flagged Address', type: 'scam' },
};

/* ── Known legitimate tokens (used to separate ETH stats from junk) ── */
const KNOWN_TOKENS = new Set([
  'ETH', 'WETH', 'USDT', 'USDC', 'DAI', 'WBTC', 'BTC',
  'MATIC', 'BNB', 'UNI', 'AAVE', 'LINK', 'CRV', 'MKR',
  'LDO', 'RPL', 'COMP', 'SNX', 'BAL', 'SUSHI', 'YFI',
  'GRT', 'ENS', 'DYDX', 'OP', 'ARB',
  'SAND', 'MANA', 'LRC', 'IMX', 'FXS', 'FRAX',
  'LUSD', 'RAI', 'RETH', 'STETH', 'CBETH', '1INCH',
  'TORN', 'OMG', 'SAI', 'REQ', 'MASK', 'DATA', 'LPT',
]);

const NULL_ADDRESS = '0x0000000000000000000000000000000000000000';

interface Transfer {
  from: string;
  to: string;
  value: number | null;
  asset: string | null;
  hash?: string;
  category?: string;
  rawContract?: { value?: string; decimal?: string; address?: string };
  metadata?: { blockTimestamp?: string };
}

/* ── Spam detection keywords ── */
const SPAM_KEYWORDS = [
  'visit', 'claim', 'airdrop', 'reward', 'voucher', 'ticket',
  'bonus', 'gift', 'free', 'disney', 'ukraine', 'windows',
  'google', 'youtube', 'tesla', 'tiktok', 'porn',
  'mcdonalds', 'superbowl', 'superbo', 'netflix',
  'amazon', 'apple', 'twitter', 'facebook', 'instagram',
  'coinbase', 'binance', 'opensea', 'metamask',
];

const SPAM_EXACT = new Set([
  'visa', 'paypal', 'nba', 'nfl', 'pranksy', 'vitalik',
  'bowl', 'lens', 'mooney', 'solid', 'wlunc', 'vsolid',
  'zepe', 'dhold', 'sablier', 'tls', 'shi', 'nike', 'vish',
  'endgame', 'vshiba', 'kimu', 'koti', 'milkers',
  'flokisnacks', 'flokielon', 'flokifire', 'shibindia',
  'voof', 'sher', 'vb', 'apecoin', 'plsx', 'belle', 'vya',
  'year', 'sea', 'erc20', 'sz', 'upool', 'hex2t', 'disco',
  'minigogeta', 'vvb', 'kick', 'aaa', 'beb', 'swd', 'nme',
  'pyro', 'ethmny', 'fry', 'sushib', 'dtf', 'okswap',
  'lr', 'swc', 'doe', 'party', 'unii', 'fire', 'rev',
  'axn', 'aleph', 'ecrtt', 'uet', 'viu', 'fifamini',
  'elec', 'sc', 'mdt', 'umi', 'shibtzu', 'gsgc', 'manu',
  'gaia', 'hur', 'vbt', 'ape dao', 'da-fi', 'uni-v2',
  'time', 'kncl',
]);

/**
 * Alchemy getAssetTransfers: `value` is already in human-readable units.
 *   external → value = ETH amount (e.g. 1.5 means 1.5 ETH)
 *   erc20    → value = token amount (already divided by decimals)
 *
 * Fallback only when value is null: use rawContract.value (hex) ÷ 10^decimal.
 * Sanity cap: any single transfer > 1e15 is garbage data → return 0.
 */
function safeValue(tx: Transfer | UnifiedTransfer): number {
  // Alchemy pre-converted value — use directly
  if (tx.value !== null && tx.value !== undefined) {
    const v = Number(tx.value);
    if (!isNaN(v) && v < 1e15) return v;
    return 0; // impossibly large → garbage
  }

  // Fallback for ERC-20s where Alchemy returned value: null
  if (tx.rawContract?.value && tx.rawContract?.decimal) {
    try {
      const raw = BigInt(tx.rawContract.value);
      const rawDec = tx.rawContract.decimal;
      const decimals = rawDec.startsWith('0x')
        ? parseInt(rawDec, 16)
        : (parseInt(rawDec, 10) || 18);
      // Reject obviously broken decimals (0 or 1 → produces huge numbers)
      if (decimals < 2) return 0;
      const converted = Number(raw) / Math.pow(10, decimals);
      if (!isNaN(converted) && converted < 1e15) return converted;
    } catch {
      return 0;
    }
  }

  return 0;
}

/** Check if a token is likely spam/airdrop */
function isSpamToken(tx: Transfer | UnifiedTransfer): boolean {
  const asset = (tx.asset || '').trim();

  // No asset name or control characters → spam
  if (!asset || asset.charCodeAt(0) < 32) return true;

  const lower = asset.toLowerCase();

  // URL patterns, very long names, suspicious chars, @-handles, spaces in name
  if (/[/:.<>@]/.test(asset) || asset.length > 15) return true;
  if (/\s/.test(asset) && !KNOWN_TOKENS.has(asset.toUpperCase())) return true;
  if (/^https?/i.test(asset) || /\.(com|io|org|net|xyz|co)/i.test(asset)) return true;

  // Exact-match spam names
  if (SPAM_EXACT.has(lower)) return true;

  // Substring-match spam keywords
  if (SPAM_KEYWORDS.some((s) => lower.includes(s))) return true;

  // Minted from null address AND not a known legitimate token → spam airdrop
  if (tx.from === NULL_ADDRESS && !KNOWN_TOKENS.has(asset.toUpperCase())) return true;

  // Absurdly large value (>1M) for unknown tokens → spam airdrop
  // Legitimate tokens rarely exceed 1M units in a single transfer unless it's SHIB/PEPE
  const val = safeValue(tx);
  if (val > 1e6 && !KNOWN_TOKENS.has(asset.toUpperCase())) return true;

  return false;
}

/** Filter out spam tokens — keep only transfers with meaningful value or known assets */
function filterSpam(transfers: (Transfer | UnifiedTransfer)[]): (Transfer | UnifiedTransfer)[] {
  return transfers.filter((tx) => {
    // Always keep ETH/native transfers
    if (tx.category === 'external') return true;
    // Filter spam
    if (isSpamToken(tx)) return false;
    // Filter dust: value rounds to ~0
    const val = safeValue(tx);
    if (val > 0 && val < 0.0001) return false;
    return true;
  });
}

/** Format value with smart precision: >1000 → 2 dec, <1 → 6 dec, else 4 dec */
export function fmtEth(v: number): string {
  const abs = Math.abs(v);
  if (abs >= 1000) {
    return v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  if (abs > 0 && abs < 1) {
    return v.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 6 });
  }
  return v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 });
}

async function fetchAllTransfers(address: string, direction: 'from' | 'to', alchemyUrl?: string): Promise<Transfer[]> {
  const all: Transfer[] = [];
  let pageKey: string | undefined;
  const url = alchemyUrl || getAlchemyUrl('eth');

  for (let i = 0; i < 10; i++) { // max 10 pages
    const params: any = {
      fromBlock: '0x0',
      toBlock: 'latest',
      category: ['external', 'erc20'],
      withMetadata: true,
      maxCount: '0x64', // 100 per page
    };
    if (direction === 'from') params.fromAddress = address;
    else params.toAddress = address;
    if (pageKey) params.pageKey = pageKey;

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: 1, jsonrpc: '2.0', method: 'alchemy_getAssetTransfers', params: [params] }),
    });
    const json = await res.json();
    if (json.error) throw new Error(json.error.message);

    const transfers = json.result?.transfers || [];
    all.push(...transfers);
    pageKey = json.result?.pageKey;
    if (!pageKey) break;
  }

  return all;
}

/** Unified transfer type for all chains */
interface UnifiedTransfer {
  from: string;
  to: string;
  value: number | null;
  asset: string | null;
  category: string;
  direction: 'IN' | 'OUT';
  hash?: string;
  rawContract?: { value?: string; decimal?: string; address?: string };
  metadata?: { blockTimestamp?: string };
}

/**
 * Fetch transfers from the correct chain tracker.
 * Returns { incoming, outgoing } arrays in a unified format.
 */
async function fetchTransfersForNetwork(
  address: string,
  network: string,
): Promise<{ incoming: UnifiedTransfer[]; outgoing: UnifiedTransfer[] }> {
  if (network === 'btc') {
    const { transfers } = await fetchBtcTransfers(address);
    return {
      incoming: transfers.filter((t) => t.direction === 'IN') as UnifiedTransfer[],
      outgoing: transfers.filter((t) => t.direction === 'OUT') as UnifiedTransfer[],
    };
  }

  if (network === 'sol') {
    const { transfers } = await fetchSolTransfers(address);
    return {
      incoming: transfers.filter((t) => t.direction === 'IN') as UnifiedTransfer[],
      outgoing: transfers.filter((t) => t.direction === 'OUT') as UnifiedTransfer[],
    };
  }

  if (network === 'trx') {
    const { transfers } = await fetchTronTransfers(address);
    return {
      incoming: transfers.filter((t) => t.direction === 'IN') as UnifiedTransfer[],
      outgoing: transfers.filter((t) => t.direction === 'OUT') as UnifiedTransfer[],
    };
  }

  if (EVM_CHAINS.has(network)) {
    const { transfers } = await fetchEtherscanV2Transfers(address, network);
    return {
      incoming: transfers.filter((t) => t.direction === 'IN') as UnifiedTransfer[],
      outgoing: transfers.filter((t) => t.direction === 'OUT') as UnifiedTransfer[],
    };
  }

  // Default: Ethereum/BNB/Polygon via Alchemy (most detailed)
  const alchemyUrl = getAlchemyUrl(network);
  const [outgoing, incoming] = await Promise.all([
    fetchAllTransfers(address, 'from', alchemyUrl),
    fetchAllTransfers(address, 'to', alchemyUrl),
  ]);
  return { incoming: incoming as unknown as UnifiedTransfer[], outgoing: outgoing as unknown as UnifiedTransfer[] };
}

export interface ScamDbMatch {
  address: string;
  platformNames: string[];
  platformSlugs: string[];
  totalLoss: number;
  reports: number;
  qrDataUri?: string; // Pre-generated QR code data URI for PDF
}

export interface ReportData {
  walletAddress: string;
  caseId: string;
  date: string;
  network: string;
  networkLabel: string;
  nativeCurrency: string;
  totalReceived: number;
  totalSent: number;
  netBalance: number;
  ethReceived: number;
  ethSent: number;
  transactionCount: number;
  uniqueTokens: string[];
  spamFiltered: number;
  firstActivity: string;
  lastActivity: string;
  inactiveDays: number;
  topCounterparties: { address: string; label: string; count: number; volume: number }[];
  identifiedEntities: { address: string; label: string; type: string; interactions: number }[];
  riskScore: number;
  riskLabel: string;
  recoveryScore: number;
  recoveryLabel: string;
  ofacWarning: boolean;
  scamDbMatches: ScamDbMatch[];
  keyFindings: string[];
  recommendations: string[];
  transactions: {
    date: string;
    direction: 'IN' | 'OUT';
    from: string;
    to: string;
    value: number;
    token: string;
  }[];
  graphData: GraphData | null;
}

export async function generateReport(
  walletAddress: string,
  email: string,
  options?: { stripePaymentId?: string; amount?: number; network?: string },
) {
  const network = (options?.network || 'eth').toLowerCase();
  const networkLabel = NETWORK_LABELS[network] || network.toUpperCase();
  const nativeCurrency = NATIVE_CURRENCY[network] || 'ETH';
  // Only lowercase for EVM addresses
  const address = ['btc', 'sol', 'trx'].includes(network) ? walletAddress : walletAddress.toLowerCase();
  const caseId = `LH-${Date.now().toString(36).toUpperCase()}`;
  const date = new Date().toISOString().split('T')[0];

  logger.info({ network, address }, '[generateReport] Starting report');

  // Fetch transfers from the correct chain
  const { incoming: rawIncoming, outgoing: rawOutgoing } = await fetchTransfersForNetwork(address, network);

  // Only apply spam filter for ETH (other chains have cleaner data)
  const outgoing = network === 'eth' ? filterSpam(rawOutgoing) : rawOutgoing;
  const incoming = network === 'eth' ? filterSpam(rawIncoming) : rawIncoming;
  const spamFiltered = (rawIncoming.length - incoming.length) + (rawOutgoing.length - outgoing.length);

  logger.info({ rawIn: rawIncoming.length, cleanIn: incoming.length, rawOut: rawOutgoing.length, cleanOut: outgoing.length, spamFiltered }, '[generateReport] Transfers fetched');

  // Calculate stats — ETH-only totals (different tokens can't be summed)
  let ethReceived = 0;
  let ethSent = 0;
  const tokenSet = new Set<string>();
  const counterpartyMap = new Map<string, { count: number; volume: number }>();
  const entityMap = new Map<string, { label: string; type: string; interactions: number }>();
  const timestamps: number[] = [];

  /** Only count native currency toward totals — token values are different units */
  const nativeUpper = nativeCurrency.toUpperCase();
  const isNativeLike = (tx: any) =>
    tx.category === 'external' ||
    (tx.asset || '').toUpperCase() === nativeUpper ||
    (nativeUpper === 'ETH' && (tx.asset || '').toUpperCase() === 'WETH');

  const processCounterparty = (addr: string, value: number) => {
    const lower = addr.toLowerCase();
    const existing = counterpartyMap.get(lower) || { count: 0, volume: 0 };
    existing.count++;
    existing.volume += value;
    counterpartyMap.set(lower, existing);

    const entity = KNOWN_ENTITIES[lower];
    if (entity && !entityMap.has(lower)) {
      entityMap.set(lower, { label: entity.label, type: entity.type, interactions: 0 });
    }
    if (entity) {
      entityMap.get(lower)!.interactions++;
    }
  };

  for (const tx of incoming) {
    const val = safeValue(tx);
    if (isNativeLike(tx)) ethReceived += val;
    if (tx.asset) tokenSet.add(tx.asset);
    if (tx.from) processCounterparty(tx.from, isNativeLike(tx) ? val : 0);
    if (tx.metadata?.blockTimestamp) timestamps.push(new Date(tx.metadata.blockTimestamp).getTime());
  }

  for (const tx of outgoing) {
    const val = safeValue(tx);
    if (isNativeLike(tx)) ethSent += val;
    if (tx.asset) tokenSet.add(tx.asset);
    if (tx.to) processCounterparty(tx.to, isNativeLike(tx) ? val : 0);
    if (tx.metadata?.blockTimestamp) timestamps.push(new Date(tx.metadata.blockTimestamp).getTime());
  }

  logger.info({ ethReceived: ethReceived.toFixed(4), ethSent: ethSent.toFixed(4), net: (ethReceived - ethSent).toFixed(4) }, '[generateReport] Balance calculated');

  timestamps.sort((a, b) => a - b);
  const firstActivity = timestamps.length > 0 ? new Date(timestamps[0]).toISOString().split('T')[0] : 'N/A';
  const lastActivity = timestamps.length > 0 ? new Date(timestamps[timestamps.length - 1]).toISOString().split('T')[0] : 'N/A';

  // Top counterparties
  const topCounterparties = Array.from(counterpartyMap.entries())
    .sort((a, b) => b[1].volume - a[1].volume)
    .slice(0, 5)
    .map(([addr, data]) => {
      const entity = KNOWN_ENTITIES[addr];
      return { address: addr, label: entity?.label || 'Unknown', count: data.count, volume: data.volume };
    });

  // Identified entities
  const identifiedEntities = Array.from(entityMap.entries()).map(([addr, data]) => ({
    address: addr,
    ...data,
  }));

  // ── OFAC detection ──
  const OFAC_KEYWORDS = ['OFAC', 'Lazarus', 'Blender.io', 'Sinbad.io'];
  const ofacEntities = identifiedEntities.filter(e =>
    OFAC_KEYWORDS.some(kw => e.label.includes(kw))
  );
  const ofacWarning = ofacEntities.length > 0;

  // ── Scam Database cross-reference ──
  const scamDbMatches: ScamDbMatch[] = [];
  const counterpartyAddresses = Array.from(counterpartyMap.keys()).slice(0, 30);
  try {
    const lookups = counterpartyAddresses.map(async (addr) => {
      try {
        const data = await getAddressIndex(addr);
        if (data && data.platforms.length > 0) {
          scamDbMatches.push({
            address: addr,
            platformNames: data.platformNames,
            platformSlugs: data.platforms,
            totalLoss: data.totalLoss,
            reports: data.reports.length,
          });
        }
      } catch { /* skip individual lookup errors */ }
    });
    await Promise.all(lookups);
  } catch { /* scam DB unavailable — continue without it */ }

  // Generate QR codes for scam DB matches (for PDF)
  for (const m of scamDbMatches) {
    if (m.platformSlugs.length > 0) {
      try {
        const url = `https://www.ledgerhound.vip/scam-database/platform/${m.platformSlugs[0]}`;
        m.qrDataUri = await QRCode.toDataURL(url, { width: 80, margin: 1, color: { dark: '#0f172a', light: '#ffffff' } });
      } catch { /* QR generation failed — skip */ }
    }
  }

  // ── Risk score (improved with OFAC + scam DB) ──
  let riskScore = 50; // baseline
  const hasMixer = identifiedEntities.some((e) => e.type === 'mixer');
  const hasExchange = identifiedEntities.some((e) => e.type === 'exchange');
  const hasScam = identifiedEntities.some((e) => e.type === 'scam');

  if (ofacWarning) riskScore = 95; // OFAC = instant CRITICAL
  else {
    if (hasMixer) riskScore += 30;
    if (hasScam) riskScore += 25;
    if (scamDbMatches.length > 0) riskScore += 20; // Scam DB match
    if (!hasExchange && ethSent > 10) riskScore += 10;
    if (hasExchange) riskScore -= 20;
    if (outgoing.length + incoming.length < 5) riskScore -= 15;
  }

  riskScore = Math.max(0, Math.min(100, riskScore));

  let riskLabel: string;
  if (riskScore >= 85) riskLabel = 'CRITICAL RISK';
  else if (riskScore >= 70) riskLabel = 'HIGH RISK';
  else if (riskScore >= 40) riskLabel = 'MODERATE RISK';
  else riskLabel = 'LOW RISK';

  // ── Recovery score ──
  let recoveryScore = 30; // baseline
  const kycExchanges = identifiedEntities.filter(e => e.type === 'exchange');
  if (kycExchanges.length > 0) recoveryScore += 40; // Funds on KYC exchange
  if (hasMixer) recoveryScore -= 25; // Through mixer = much harder
  if (outgoing.length + incoming.length < 20) recoveryScore += 10; // Simple flow
  if (ethSent < 1) recoveryScore += 5; // Small amount not distributed far

  recoveryScore = Math.max(5, Math.min(90, recoveryScore));

  let recoveryLabel: string;
  if (recoveryScore >= 60) recoveryLabel = 'HIGH — Funds likely on KYC exchange, subpoena possible';
  else if (recoveryScore >= 35) recoveryLabel = 'MEDIUM — Some exchange interaction, partial recovery possible';
  else recoveryLabel = 'LOW — Funds obfuscated through mixer or distributed';

  // ── Last activity / inactivity check ──
  const inactiveDays = timestamps.length > 0
    ? Math.floor((Date.now() - timestamps[timestamps.length - 1]) / 86400000)
    : 0;

  // Key findings
  const keyFindings: string[] = [];
  if (ofacWarning) {
    keyFindings.push(`CRITICAL: Wallet interacted with OFAC-sanctioned address(es): ${ofacEntities.map(e => e.label).join(', ')}. US persons are prohibited from transacting with these addresses.`);
  }
  if (hasMixer) keyFindings.push('Interactions with known mixer/tumbler services detected (Tornado Cash or similar). This is a significant risk indicator.');
  if (hasExchange) {
    const exchanges = identifiedEntities.filter((e) => e.type === 'exchange').map((e) => e.label);
    keyFindings.push(`Funds interacted with identified exchanges: ${exchanges.join(', ')}. KYC data may be available via subpoena.`);
  }
  if (hasScam) keyFindings.push('Interactions with flagged/scam-associated addresses detected.');
  if (scamDbMatches.length > 0) {
    for (const m of scamDbMatches) {
      keyFindings.push(`Counterparty ${m.address.slice(0, 10)}... linked to "${m.platformNames.join(', ')}" in LedgerHound Scam Database (${m.reports} reports, $${m.totalLoss.toLocaleString()} total losses).`);
    }
  }
  if (ethSent > 0) keyFindings.push(`Wallet sent ${fmtEth(ethSent)} ${nativeCurrency} across ${outgoing.filter((t: any) => t.category === 'external').length} native transactions.`);
  if (inactiveDays > 365) keyFindings.push(`Wallet inactive for ${inactiveDays} days (last activity: ${lastActivity}). Funds may have been moved to other wallets.`);
  if (spamFiltered > 0) keyFindings.push(`${spamFiltered} spam/airdrop token transfers were detected and filtered from this analysis.`);
  if (keyFindings.length === 0) keyFindings.push('No high-risk indicators detected in automated analysis. Manual review recommended for comprehensive assessment.');

  // Recommendations
  const recommendations: string[] = [];
  if (ofacWarning) {
    recommendations.push('IMMEDIATE: Cease all interactions with this wallet. OFAC-sanctioned addresses carry severe legal penalties for US persons.');
  }
  if (hasExchange) {
    const exchanges = identifiedEntities.filter((e) => e.type === 'exchange').map((e) => e.label);
    recommendations.push(`Subpoena target identified: ${exchanges[0]}. Attorney can file discovery request for account holder information.`);
  }
  if (hasMixer) recommendations.push('Mixer usage detected. Professional demixing analysis recommended to trace funds through mixing service.');
  if (scamDbMatches.length > 0) recommendations.push('Counterparty addresses found in LedgerHound Scam Database. Existing victim reports may strengthen your legal case.');
  recommendations.push('File FBI IC3 report at ic3.gov if not already done.');
  recommendations.push('For court-ready certified investigation with expert testimony, contact LedgerHound at contact@ledgerhound.vip.');

  // Build transaction list: ETH first → major tokens → rest, dedup by token (max 3)
  type TxRow = { date: string; direction: 'IN' | 'OUT'; from: string; to: string; value: number; token: string };
  const MAJOR_TOKENS = new Set(['ETH', 'WETH', 'USDT', 'USDC', 'DAI', 'WBTC']);

  const toRow = (tx: Transfer, dir: 'IN' | 'OUT'): TxRow => ({
    date: tx.metadata?.blockTimestamp ? new Date(tx.metadata.blockTimestamp).toISOString().split('T')[0] : 'N/A',
    direction: dir,
    from: dir === 'IN' ? (tx.from || 'N/A') : (tx.from || address),
    to: dir === 'OUT' ? (tx.to || 'N/A') : (tx.to || address),
    value: safeValue(tx),
    token: tx.asset || 'ETH',
  });

  const rawTxs: TxRow[] = [
    ...incoming.map((tx) => toRow(tx, 'IN')),
    ...outgoing.map((tx) => toRow(tx, 'OUT')),
  ];

  // Sort priority: ETH first, then major tokens, then others — within each group by value desc
  const sortKey = (tx: TxRow): number => {
    const upper = tx.token.toUpperCase();
    if (upper === 'ETH') return 0;
    if (MAJOR_TOKENS.has(upper)) return 1;
    return 2;
  };
  rawTxs.sort((a, b) => {
    const pa = sortKey(a), pb = sortKey(b);
    if (pa !== pb) return pa - pb;
    return b.value - a.value; // higher value first within same priority
  });

  // Deduplicate by TOKEN (max 3 rows per token symbol, then summary)
  const tokenCounts = new Map<string, { shown: number; total: number; totalValue: number }>();
  // Pre-count totals per token
  for (const tx of rawTxs) {
    const key = tx.token.toUpperCase();
    const existing = tokenCounts.get(key) || { shown: 0, total: 0, totalValue: 0 };
    existing.total++;
    existing.totalValue += tx.value;
    tokenCounts.set(key, existing);
  }

  const allTxs: TxRow[] = [];
  const tokenShown = new Map<string, number>();
  for (const tx of rawTxs) {
    const key = tx.token.toUpperCase();
    const shown = tokenShown.get(key) || 0;
    if (shown < 3) {
      allTxs.push(tx);
      tokenShown.set(key, shown + 1);
    } else if (shown === 3) {
      // Add summary row
      const stats = tokenCounts.get(key)!;
      const remaining = stats.total - 3;
      if (remaining > 0) {
        allTxs.push({
          date: '',
          direction: tx.direction,
          from: '—',
          to: '—',
          value: stats.totalValue,
          token: `+${remaining} more ${tx.token}`,
        });
      }
      tokenShown.set(key, shown + 1); // prevent duplicate summary
    }
    if (allTxs.length >= 50) break;
  }

  const round4 = (n: number) => Math.round(n * 10000) / 10000;

  const reportData: ReportData = {
    walletAddress: address,
    caseId,
    date,
    network,
    networkLabel,
    nativeCurrency,
    totalReceived: round4(ethReceived),
    totalSent: round4(ethSent),
    netBalance: round4(ethReceived - ethSent),
    ethReceived: round4(ethReceived),
    ethSent: round4(ethSent),
    transactionCount: outgoing.length + incoming.length,
    uniqueTokens: Array.from(tokenSet),
    spamFiltered,
    firstActivity,
    lastActivity,
    inactiveDays,
    topCounterparties,
    identifiedEntities,
    riskScore,
    riskLabel,
    recoveryScore,
    recoveryLabel,
    ofacWarning,
    scamDbMatches,
    keyFindings,
    recommendations,
    transactions: allTxs,
    graphData: buildGraphData({
      walletAddress: address,
      transactions: allTxs,
      identifiedEntities: identifiedEntities.map(e => ({ address: e.address, label: e.label, type: e.type })),
      nativeCurrency,
    }),
  };

  // Generate PDF
  const doc = React.createElement(ReportDocument, { data: reportData }) as any;
  const pdfBuffer = await renderToBuffer(doc);
  const buf = Buffer.from(pdfBuffer);

  // Upload to S3 and get presigned download URL
  let downloadUrl = '';
  let s3Key = '';
  try {
    logger.info({ pdfBytes: buf.length }, '[generateReport] Uploading to S3');
    s3Key = await uploadReport(buf, caseId);
    logger.info({ s3Key }, '[generateReport] S3 upload OK');
    downloadUrl = await getReportDownloadUrl(caseId);
    logger.info('[generateReport] Presigned URL generated');
  } catch (err: unknown) {
    logger.error({ err }, '[generateReport] S3 upload failed (continuing with email only)');
  }

  // Send email with download link
  await sendReport(email, address, buf, caseId, downloadUrl);

  // Log report to S3 (non-blocking — don't fail if this errors)
  try {
    await logReport({
      caseId,
      walletAddress: address,
      email,
      network,
      s3Key,
      downloadUrl,
      stripePaymentId: options?.stripePaymentId || '',
      createdAt: new Date().toISOString(),
      amount: options?.amount || 4900,
    });
  } catch (err) {
    logger.error({ err }, '[generateReport] Failed to log report');
  }

  return { ...reportData, downloadUrl, s3Key };
}
