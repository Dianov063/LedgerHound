import React from 'react';
import { renderToBuffer } from '@react-pdf/renderer';
import { sendReport } from './sendReport';
import { backfillBlockTimestamps } from './backfill-timestamps';
import { ReportDocument } from './reportPdf';
import { getReportTranslations, type TimelineT } from './report-i18n';
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
import { analyzeScamPatterns } from './patternDetection';
export type { PatternAnalysis, ScamPattern } from './patternDetection';
import { traceCrossChain } from './crossChainTracer';
export type { CrossChainTrace, CrossChainHop, BridgeInteraction, ChainActivity } from './crossChainTracer';
import { KNOWN_ENTITIES, getKnownEntity, getComplianceEmail, getComplianceEmailByParent, isCexAddress } from './known-entities';
import { isKnownPhishing, getPhishingTag } from './known-phishing';
import { getAddressLabelsBatch } from './labels/federation';
import type { AddressLabelResponse } from './labels/types';
import { detectSpoofTarget, detectScriptCategory, LEGITIMATE_TOKENS, detectUnicodeSpoofing, normalizeForDisplay } from './unicode-spoofing';
import { detectAddressPoisoning } from './address-poisoning';
export type { PoisoningAnalysis, AddressPoisoningCampaign, FraudClusterEntry } from './address-poisoning';
export type { UnicodeSpoofingAnalysis, UnicodeSpoofEvidence } from './unicode-spoofing';

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
const EVM_CHAINS = new Set(['base', 'arb', 'op', 'avax', 'linea', 'zksync', 'scroll', 'mantle', 'bnb', 'polygon']);

// KNOWN_ENTITIES moved to lib/known-entities.ts (single source of truth).
// Removed fabricated entry 0xd882cfc20f... "Flagged Address" (was tied to
// fictional CryptoTrade Pro SEED platform — see docs/removed-fabricated-entries.md).
// 2026-05-20

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

const REAL_ASSET_SYMBOLS = new Set([
  'ETH', 'WETH', 'BTC', 'WBTC',
  'USDT', 'USDC', 'DAI', 'BUSD', 'TUSD', 'FRAX', 'PYUSD',
  'ARB', 'OP', 'MATIC', 'BNB', 'AVAX', 'SOL', 'MNT',
  'LINK', 'UNI', 'AAVE', 'CRV', 'MKR', 'SNX', 'COMP',
  'LDO', 'RPL', 'GRT', 'ENS', 'DYDX', 'STETH', 'RETH', 'CBETH',
]);

const NULL_ADDRESS = '0x0000000000000000000000000000000000000000';

interface Transfer {
  from: string;
  to: string;
  value: number | null;
  asset: string | null;
  /**
   * Raw token symbol exactly as returned upstream, BEFORE `sanitizeAsset()`
   * strips non-ASCII chars. `asset` is the display-safe (ASCII-only) form;
   * `assetRaw` preserves Unicode for attack-technique detection (Phase 2).
   * Invariant: always set when any symbol exists — equals `asset` for chains
   * that don't sanitize, equals the original for the Alchemy/ETH path.
   * 2026-05-21.
   */
  assetRaw?: string | null;
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

/** Sanitize asset symbol — strip non-printable/non-ASCII chars */
function sanitizeAsset(raw: string | null | undefined): string | null {
  if (!raw) return null;
  // Keep only printable ASCII (space through tilde)
  const clean = raw.replace(/[^\x20-\x7E]/g, '').trim();
  return clean || null;
}

/**
 * Classify a token transfer into spam / unicode-spoof / clean.
 *
 * 2026-05-21 (Phase 2): Unicode-spoof tokens are forensic EVIDENCE, not
 * spam — so we check them FIRST (using `assetRaw`, the un-sanitized symbol)
 * and short-circuit before the spam heuristics. `detectSpoofTarget` requires
 * ≥3 non-ASCII chars, so sanitized fragments like "UD" (from "ÚЅDТ") can
 * never false-positive here — only the genuine raw Unicode symbol matches.
 */
export function classifyToken(tx: Transfer | UnifiedTransfer): { isSpam: boolean; isSpoof: boolean; spoofTarget?: string } {
  // 1. Unicode-spoof check on the RAW symbol (never the sanitized `asset`).
  const raw = tx.assetRaw;
  if (raw) {
    const spoofTarget = detectSpoofTarget(raw, LEGITIMATE_TOKENS as string[]);
    if (spoofTarget) {
      return { isSpam: false, isSpoof: true, spoofTarget };
    }
  }

  // 2. Existing spam heuristics on the sanitized display symbol.
  const asset = (tx.asset || '').trim();

  // No asset name or control characters → spam
  if (!asset || asset.charCodeAt(0) < 32) return { isSpam: true, isSpoof: false };

  // Non-ASCII characters (¿, °, Ñ, ¹, Ž, etc.) → almost always spam on EVM chains
  if (/[^\x20-\x7E]/.test(asset) && !KNOWN_TOKENS.has(asset.toUpperCase())) return { isSpam: true, isSpoof: false };

  const lower = asset.toLowerCase();

  // URL patterns, very long names, suspicious chars, @-handles, spaces in name
  if (/[/:.<>@~+]/.test(asset) || asset.length > 15) return { isSpam: true, isSpoof: false };
  if (/\s/.test(asset) && !KNOWN_TOKENS.has(asset.toUpperCase())) return { isSpam: true, isSpoof: false };
  if (/^https?/i.test(asset) || /\.(com|io|org|net|xyz|co)/i.test(asset)) return { isSpam: true, isSpoof: false };

  // Exact-match spam names
  if (SPAM_EXACT.has(lower)) return { isSpam: true, isSpoof: false };

  // Substring-match spam keywords
  if (SPAM_KEYWORDS.some((s) => lower.includes(s))) return { isSpam: true, isSpoof: false };

  // Minted from null address AND not a known legitimate token → spam airdrop
  if (tx.from === NULL_ADDRESS && !KNOWN_TOKENS.has(asset.toUpperCase())) return { isSpam: true, isSpoof: false };

  // Absurdly large value (>1M) for unknown tokens → spam airdrop
  // Legitimate tokens rarely exceed 1M units in a single transfer unless it's SHIB/PEPE
  const val = safeValue(tx);
  if (val > 1e6 && !KNOWN_TOKENS.has(asset.toUpperCase())) return { isSpam: true, isSpoof: false };

  return { isSpam: false, isSpoof: false };
}

/** Backwards-compatible boolean wrapper. */
function isSpamToken(tx: Transfer | UnifiedTransfer): boolean {
  return classifyToken(tx).isSpam;
}

/** Filter out spam tokens — keep meaningful value, known assets AND spoof evidence */
function filterSpam(transfers: (Transfer | UnifiedTransfer)[]): (Transfer | UnifiedTransfer)[] {
  return transfers.filter((tx) => {
    // Always keep ETH/native transfers
    if (tx.category === 'external') return true;
    const { isSpam, isSpoof } = classifyToken(tx);
    // 2026-05-21: keep Unicode-spoof tokens — they're attack evidence, not noise.
    if (isSpoof) return true;
    // Filter spam
    if (isSpam) return false;
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

/** Delay helper */
const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

async function fetchAllTransfers(address: string, direction: 'from' | 'to', alchemyUrl?: string): Promise<Transfer[]> {
  const all: Transfer[] = [];
  let pageKey: string | undefined;
  const url = alchemyUrl || getAlchemyUrl('eth');

  for (let i = 0; i < 10; i++) { // max 10 pages
    const params: any = {
      fromBlock: '0x0',
      toBlock: 'latest',
      order: 'desc', // newest first — critical for wallets with >1000 txs
      category: ['external', 'erc20'],
      withMetadata: true,
      maxCount: '0x64', // 100 per page
    };
    if (direction === 'from') params.fromAddress = address;
    else params.toAddress = address;
    if (pageKey) params.pageKey = pageKey;

    const body = JSON.stringify({ id: 1, jsonrpc: '2.0', method: 'alchemy_getAssetTransfers', params: [params] });

    // Retry with exponential backoff on rate limit errors
    let json: any;
    for (let attempt = 0; attempt < 3; attempt++) {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      });
      json = await res.json();
      if (json.error?.message?.includes('compute units per second')) {
        logger.warn({ attempt, direction }, '[fetchAllTransfers] Alchemy rate limit, retrying...');
        await delay(1000 * (attempt + 1)); // 1s, 2s, 3s
        continue;
      }
      break;
    }
    if (json.error) throw new Error(json.error.message);

    const transfers = json.result?.transfers || [];
    // Sanitize asset names (Alchemy can return non-ASCII in token symbols).
    // 2026-05-21: preserve the ORIGINAL symbol in `assetRaw` BEFORE stripping
    // non-ASCII — Phase 2 attack detectors need the raw Unicode (e.g. the
    // Lisu "ꓴꓢꓓꓔ" / mixed-script "ÚЅDТ" USDT spoofs would otherwise be
    // destroyed by sanitizeAsset → null / "UD").
    for (const t of transfers) {
      t.assetRaw = t.asset ?? null;
      t.asset = sanitizeAsset(t.asset);
    }
    // Log first transfer structure on first page for debugging
    if (i === 0 && transfers.length > 0) {
      const t = transfers[0];
      logger.info({
        direction,
        keys: Object.keys(t),
        hasMetadata: !!t.metadata,
        metadataKeys: t.metadata ? Object.keys(t.metadata) : [],
        blockTimestamp: t.metadata?.blockTimestamp || 'MISSING',
        asset: t.asset,
        value: t.value,
        category: t.category,
      }, '[fetchAllTransfers] Sample transfer structure');
    }
    all.push(...transfers);
    pageKey = json.result?.pageKey;
    if (!pageKey) break;

    // Small delay between pages to stay under CU/s limit
    if (pageKey) await delay(200);
  }

  return all;
}

/** Unified transfer type for all chains */
interface UnifiedTransfer {
  from: string;
  to: string;
  value: number | null;
  asset: string | null;
  /** See `Transfer.assetRaw`. Raw upstream symbol, pre-sanitization. 2026-05-21. */
  assetRaw?: string | null;
  category: string;
  direction: 'IN' | 'OUT';
  hash?: string;
  rawContract?: { value?: string; decimal?: string; address?: string };
  metadata?: { blockTimestamp?: string };
}

/**
 * Fetch transfers from the correct chain tracker.
 * Returns { incoming, outgoing } arrays in a unified format.
 *
 * 2026-05-21: wraps `fetchTransfersForNetworkInner` to guarantee the
 * `assetRaw` invariant across ALL chains — non-ETH trackers don't sanitize,
 * so for them `assetRaw` simply mirrors `asset`; the Alchemy/ETH path sets
 * `assetRaw` itself (to the original) inside `fetchAllTransfers`. Detectors
 * can therefore always read `assetRaw` without per-chain branching.
 */
async function fetchTransfersForNetwork(
  address: string,
  network: string,
): Promise<{ incoming: UnifiedTransfer[]; outgoing: UnifiedTransfer[] }> {
  const { incoming, outgoing } = await fetchTransfersForNetworkInner(address, network);
  const ensure = (t: UnifiedTransfer) => {
    if (t.assetRaw === undefined) t.assetRaw = t.asset;
  };
  incoming.forEach(ensure);
  outgoing.forEach(ensure);
  return { incoming, outgoing };
}

async function fetchTransfersForNetworkInner(
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

  // Default: Ethereum via Alchemy (most detailed)
  // Sequential to avoid CU/s rate limit on free tier
  const alchemyUrl = getAlchemyUrl(network);
  const outgoing = await fetchAllTransfers(address, 'from', alchemyUrl);
  await delay(300); // breathing room between directional queries
  const incoming = await fetchAllTransfers(address, 'to', alchemyUrl);

  // Backfill timestamps if Alchemy didn't return metadata (e.g., BNB chain)
  const allTransfers = [...outgoing, ...incoming];
  await backfillBlockTimestamps(allTransfers, network, alchemyUrl);
  // allTransfers shares references with outgoing/incoming — mutations propagate

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

export interface RiskBreakdown {
  unknownWalletInteraction: number;
  mixerInteraction: number;
  exchangeInteraction: number;
  multiHopTransfers: number;
  stablecoinUsage: number;
  sanctionedAddress: number;
  scamDbMatch: number;
}

export interface TimelineEvent {
  date: string;
  type: 'ACTIVATION' | 'MAJOR_INFLOW' | 'MAJOR_OUTFLOW' | 'EXCHANGE_INTERACTION' | 'MIXER_INTERACTION' | 'LAST_ACTIVITY';
  description: string;
  highlight?: boolean;
  /** Counterparty address (Phase 2.5 Fix 3) — lets the PDF flag misdirection
   *  events (OUT to a secondary spoof) distinctly from legitimate sends. */
  counterparty?: string;
}

export interface ExitPoint {
  address: string;
  amount: number;
  token: string;
  date: string;
  entityType: string;
  entityName: string | null;
  recoveryDifficulty: string;
}

export interface ExitPointAnalysis {
  exitPoints: ExitPoint[];
  hasKycExit: boolean;
  hasMixerUsage: boolean;
  hasCrossChain: boolean;
  overallRecoveryAssessment: string;
}

export interface RecoveryScenario {
  name: string;
  probability: string;
  recoveryChance: string;
  description: string;
  action: string;
}

/** Unicode-spoof token evidence surfaced in the Asset Summary (Phase 2). */
export interface SpoofTokenEvidence {
  /** Raw spoof symbol (the original Unicode, e.g. "ꓴꓢꓓꓔ"). Forensic source. */
  symbol: string;
  /** NFC-normalised display form (composes combining marks). 2026-05-21. */
  symbolDisplay: string;
  /** Legitimate ticker it mimics (e.g. "USDT"). */
  mimicsLegitimate: string;
  /** Unicode script category for context. */
  scriptCategory: string;
  /** Number of transfers carrying this spoof symbol. */
  count: number;
}

export interface AssetSummary {
  realAssets: { symbol: string; totalIn: number; totalOut: number }[];
  spamTokens: { symbol: string; count: number }[];
  /**
   * 2026-05-21 (Phase 2): Unicode-spoof tokens, kept SEPARATE from spam —
   * these are forensic evidence of a spoofing attack, not airdrop noise.
   */
  spoofTokens: SpoofTokenEvidence[];
  spamCount: number;
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
  /**
   * Known counterparties. `parentEntity` (added 2026-05-20) groups multiple
   * hot wallets under the same brand (e.g. 5 Binance hot wallets → one
   * Binance entry in dedup logic). Falls back to `label` when absent.
   */
  identifiedEntities: { address: string; label: string; type: string; interactions: number; parentEntity?: string; complianceEmail?: string }[];
  riskScore: number;
  riskLabel: string;
  /**
   * Recovery probability assessment.
   * 2026-05-20: Replaced raw `recoveryScore`/`recoveryLabel` pair with this
   * structured object — adds disclaimer + transparent factors and hard-caps
   * the score at 35% to avoid making implicit guarantees.
   */
  recoveryAssessment: RecoveryAssessment;
  /** @deprecated Use recoveryAssessment.score. Kept for transitional PDF rendering. */
  recoveryScore: number;
  /** @deprecated Use recoveryAssessment.label. Kept for transitional PDF rendering. */
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
    /** Raw symbol (Phase 2.5) — display the original Unicode for spoof rows. */
    assetRaw?: string | null;
    /** True when this transfer's token is a Unicode spoof of a legit ticker. */
    isSpoof?: boolean;
    /** The legitimate ticker the spoof mimics (e.g. 'USDT'). */
    spoofTarget?: string;
  }[];
  graphData: GraphData | null;
  riskBreakdown: RiskBreakdown;
  timeline: TimelineEvent[];
  exitPointAnalysis: ExitPointAnalysis;
  recoveryScenarios: RecoveryScenario[];
  assetSummary: AssetSummary;
  patternAnalysis: import('./patternDetection').PatternAnalysis;
  crossChainTrace: import('./crossChainTracer').CrossChainTrace | null;
  // Narrative & Evidence
  narrative: NarrativeData;
  evidenceStrength: EvidenceStrength;
  topInflows: { from: string; value: number; token: string; date: string }[];
  /** Compliance emails for ALL identified exchanges (not just primary) */
  exchangeComplianceEmails: { name: string; email: string }[];
  /** Legal Weight — which purposes this report is suitable for */
  legalWeight: { label: string; suitable: boolean }[];
  /** Primary asset by volume — token with highest total flow (e.g. USDT instead of BNB) */
  primaryAsset: { symbol: string; totalIn: number; totalOut: number } | null;
  /**
   * Number of counterparty addresses that match `lib/known-phishing.ts`.
   * Used by Evidence Strength to distinguish subject-vs-counterparty matches —
   * a victim's evidence is the counterparty's flags, not their own.
   * Added 2026-05-20 (Phase 0 fix 1.3).
   */
  counterpartyPhishingFlags: number;
  /**
   * Number of counterparty addresses that appear in the LedgerHound scam DB.
   * Same role as `counterpartyPhishingFlags`. Added 2026-05-20.
   */
  counterpartyScamDbMatches: number;
  /**
   * Phase 1 federation — labels for the top-N counterparties merged from
   * Chainabuse, GoPlus, OFAC, KNOWN_ENTITIES, KNOWN_PHISHING and scam-db.
   * Limited to the top 20 by volume to keep generation under Vercel's
   * function timeout. Empty when federation is disabled/failed.
   * Added 2026-05-20.
   */
  addressLabels: import('./labels/types').AddressLabelResponse[];
  /**
   * True when at least one external source (Chainabuse/GoPlus/OFAC) failed
   * during federation. The PDF shows a footnote when set so readers know
   * intelligence may be incomplete. Added 2026-05-20.
   */
  externalIntelligenceDegraded: boolean;
  /**
   * Phase 2 attack-technique analysis: address poisoning (vanity-address
   * spoofing) and Unicode spoofing (look-alike token symbols). Both run on
   * the RAW (un-spam-filtered) transaction set. Added 2026-05-21.
   */
  attackTechniques: {
    addressPoisoning: import('./address-poisoning').PoisoningAnalysis;
    unicodeSpoofing: import('./unicode-spoofing').UnicodeSpoofingAnalysis;
  };
  /**
   * Phase 2.5 (Part 7): exchange KYC entry vs exit separation. Distinguishes
   * the victim's own funding exchange from any cash-out exchange.
   */
  exchangeAnalysis: ExchangeAnalysis;
}

export type WalletRole =
  | 'victim'             // funds RECEIVED from CEX, sent to unknown counterparties — typical scam victim
  | 'aggregator'         // collects from many senders, forwards to CEX (scam collector)
  | 'transit'            // high throughput, no CEX in/out (pure routing)
  | 'distributor'        // few senders → many recipients
  | 'exchange_deposit'   // single recipient = CEX (deposit funnel)
  | 'aggregation'        // legacy alias for aggregator
  | 'personal'           // low activity
  | 'unknown';

export interface NarrativeData {
  walletType: WalletRole;
  walletTypeLabel: string;
  /** Confidence 0-1 from role classifier. Higher = more decisive evidence. */
  roleConfidence: number;
  /** Human-readable bullets explaining WHY this role was chosen. */
  roleReasoning: string[];
  uniqueSenders: number;
  uniqueReceivers: number;
  forwardingPercent: number;     // % of funds forwarded within 24h
  primaryExitExchange: string;   // e.g. "Binance"
  primaryExitExchangeEmail: string;
  summary: string;               // Auto-generated narrative paragraph
  conclusion: string;            // One-line conclusion
}

export interface RecoveryAssessment {
  /** 2-35. Recovery probability percentage, hard-capped at 35% — most
   *  cryptocurrency fraud cases do not result in full recovery. */
  score: number;
  /** Human-readable label, e.g. "Low — recovery requires sustained legal effort..." */
  label: string;
  /** Bucket for UI coloring/sorting. */
  tier: 'VERY_LOW' | 'LOW' | 'MODERATE' | 'HIGHER_THAN_AVERAGE';
  /** Mandatory legal disclaimer — must always be displayed alongside the score. */
  disclaimer: string;
  /** Factors that pushed score up/down — for transparency. */
  factors: {
    positive: string[];
    negative: string[];
  };
}

/**
 * 2026-05-21 (Phase 2.5 / Part 7): distinguishes a CEX the VICTIM funded
 * from (entry — their own KYC) vs a CEX funds flowed TO (exit — potential
 * scammer cash-out KYC). Critical so legal counsel doesn't conflate the
 * victim's own Binance account with the scammer's.
 */
export interface ExchangeEntry {
  address: string;
  label: string;
  parentEntity: string;
  type: 'entry' | 'exit';
  interactionCount: number;
  totalValue: number;
  token: string;
  complianceEmail?: string;
}

export interface ExchangeAnalysis {
  entryPoints: ExchangeEntry[];   // CEX → victim wallet (victim's own funding)
  exitPoints: ExchangeEntry[];    // victim wallet → CEX (rare for victims)
  hasEntryKyc: boolean;
  hasExitKyc: boolean;
}

export interface EvidenceStrength {
  score: number;                // 0–100
  label: string;                // STRONG / MODERATE / WEAK
  /**
   * `severity` (2026-05-21) flags a met factor that should be visually
   * emphasised — 'critical' renders red in the PDF (e.g. confirmed
   * misdirection of victim funds to a spoof address).
   */
  factors: { label: string; met: boolean; severity?: 'critical' | 'high' }[];
}

function calculateRiskBreakdown(
  identifiedEntities: { type: string }[],
  counterpartyCount: number,
  outgoing: (Transfer | UnifiedTransfer)[],
  incoming: (Transfer | UnifiedTransfer)[],
  ofacWarning: boolean,
  scamDbMatches: ScamDbMatch[],
): RiskBreakdown {
  const breakdown: RiskBreakdown = {
    unknownWalletInteraction: 0,
    mixerInteraction: 0,
    exchangeInteraction: 0,
    multiHopTransfers: 0,
    stablecoinUsage: 0,
    sanctionedAddress: 0,
    scamDbMatch: 0,
  };

  const knownCount = identifiedEntities.length;
  if (counterpartyCount > 0 && knownCount / counterpartyCount < 0.2) {
    breakdown.unknownWalletInteraction = 20;
  }
  if (identifiedEntities.some(e => e.type === 'mixer')) breakdown.mixerInteraction = 30;
  if (identifiedEntities.some(e => e.type === 'exchange')) breakdown.exchangeInteraction = -10;

  // Multi-hop: check for rapid sequential outflows (3+ within same day)
  const outDates = outgoing
    .map(tx => tx.metadata?.blockTimestamp ? new Date(tx.metadata.blockTimestamp).toDateString() : '')
    .filter(Boolean);
  const dateCounts = new Map<string, number>();
  for (const d of outDates) dateCounts.set(d, (dateCounts.get(d) || 0) + 1);
  if (Array.from(dateCounts.values()).some(c => c >= 3)) breakdown.multiHopTransfers = 15;

  // Stablecoin movement
  const allTx = [...outgoing, ...incoming];
  const hasStable = allTx.some(tx => {
    const asset = (tx.asset || '').toUpperCase();
    return ['USDT', 'USDC', 'DAI', 'BUSD', 'TUSD', 'FRAX', 'PYUSD'].includes(asset);
  });
  if (hasStable) breakdown.stablecoinUsage = 5;

  if (ofacWarning) breakdown.sanctionedAddress = 40;
  if (scamDbMatches.length > 0) breakdown.scamDbMatch = 25;

  return breakdown;
}

function classifyAssets(
  incoming: (Transfer | UnifiedTransfer)[],
  outgoing: (Transfer | UnifiedTransfer)[],
  nativeCurrency: string = 'ETH',
): AssetSummary {
  const realIn = new Map<string, number>();
  const realOut = new Map<string, number>();
  const spam = new Map<string, number>();
  // 2026-05-21 (Phase 2): separate bucket for Unicode-spoof evidence.
  // Keyed by the RAW spoof symbol so "ꓴꓢꓓꓔ" and "ÚЅDТ" are distinct entries.
  const spoof = new Map<string, SpoofTokenEvidence>();

  const classify = (tx: Transfer | UnifiedTransfer, dir: 'in' | 'out') => {
    const { isSpoof, spoofTarget } = classifyToken(tx);

    // Unicode-spoof tokens → dedicated bucket (NOT spam, NOT real).
    if (isSpoof && tx.assetRaw) {
      const key = tx.assetRaw;
      const existing = spoof.get(key);
      if (existing) {
        existing.count += 1;
      } else {
        spoof.set(key, {
          symbol: tx.assetRaw,
          symbolDisplay: normalizeForDisplay(tx.assetRaw),
          mimicsLegitimate: spoofTarget || 'unknown',
          scriptCategory: detectScriptCategory(tx.assetRaw),
          count: 1,
        });
      }
      return;
    }

    const asset = (tx.asset || '').toUpperCase().trim();
    if (!asset) return;
    const val = safeValue(tx);
    const isReal = REAL_ASSET_SYMBOLS.has(asset);
    const isSpamTx = isSpamToken(tx);

    if (isReal && !isSpamTx) {
      if (dir === 'in') realIn.set(asset, (realIn.get(asset) || 0) + val);
      else realOut.set(asset, (realOut.get(asset) || 0) + val);
    } else if (asset && !isReal) {
      spam.set(asset, (spam.get(asset) || 0) + 1);
    }
  };

  for (const tx of incoming) classify(tx, 'in');
  for (const tx of outgoing) classify(tx, 'out');

  // Also include native (external) category
  for (const tx of incoming) {
    if (tx.category === 'external') {
      const asset = (tx.asset || nativeCurrency).toUpperCase();
      if (REAL_ASSET_SYMBOLS.has(asset)) {
        realIn.set(asset, (realIn.get(asset) || 0) + safeValue(tx));
      }
    }
  }
  for (const tx of outgoing) {
    if (tx.category === 'external') {
      const asset = (tx.asset || nativeCurrency).toUpperCase();
      if (REAL_ASSET_SYMBOLS.has(asset)) {
        realOut.set(asset, (realOut.get(asset) || 0) + safeValue(tx));
      }
    }
  }

  const allSymbols = new Set([...Array.from(realIn.keys()), ...Array.from(realOut.keys())]);
  const realAssets = Array.from(allSymbols)
    .map(symbol => ({
      symbol,
      totalIn: Math.round((realIn.get(symbol) || 0) * 10000) / 10000,
      totalOut: Math.round((realOut.get(symbol) || 0) * 10000) / 10000,
    }))
    .sort((a, b) => (b.totalIn + b.totalOut) - (a.totalIn + a.totalOut));

  return {
    realAssets,
    spamTokens: Array.from(spam.entries())
      .map(([symbol, count]) => ({ symbol, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10),
    spoofTokens: Array.from(spoof.values()).sort((a, b) => b.count - a.count),
    spamCount: spam.size,
  };
}

function generateTimeline(
  incoming: (Transfer | UnifiedTransfer)[],
  outgoing: (Transfer | UnifiedTransfer)[],
  identifiedEntities: { address: string; type: string; label: string }[],
  nativeCurrency: string = 'ETH',
  tl: TimelineT = getReportTranslations('en').timeline,
): TimelineEvent[] {
  const events: TimelineEvent[] = [];
  const all = [
    ...incoming.map(tx => ({ ...tx, _dir: 'IN' as const })),
    ...outgoing.map(tx => ({ ...tx, _dir: 'OUT' as const })),
  ].filter(tx => tx.metadata?.blockTimestamp);

  all.sort((a, b) =>
    new Date(a.metadata!.blockTimestamp!).getTime() - new Date(b.metadata!.blockTimestamp!).getTime()
  );

  if (all.length === 0) return events;

  // First activity
  events.push({
    date: all[0].metadata!.blockTimestamp!.split('T')[0],
    type: 'ACTIVATION',
    description: tl.walletFirstActive,
  });

  // Major real-asset inflows (top 3)
  const realInflows = all
    .filter(tx => tx._dir === 'IN' && REAL_ASSET_SYMBOLS.has((tx.asset || '').toUpperCase()))
    .sort((a, b) => safeValue(b) - safeValue(a))
    .slice(0, 3);

  for (const tx of realInflows) {
    const val = safeValue(tx);
    if (val <= 0) continue;
    events.push({
      date: tx.metadata!.blockTimestamp!.split('T')[0],
      type: 'MAJOR_INFLOW',
      description: tl.received(fmtEth(val), tx.asset || nativeCurrency, (tx.from || '').slice(0, 10)),
    });
  }

  // Major real-asset outflows (top 3)
  const realOutflows = all
    .filter(tx => tx._dir === 'OUT' && REAL_ASSET_SYMBOLS.has((tx.asset || '').toUpperCase()))
    .sort((a, b) => safeValue(b) - safeValue(a))
    .slice(0, 3);

  for (const tx of realOutflows) {
    const val = safeValue(tx);
    if (val <= 0) continue;
    const entityMatch = identifiedEntities.find(e => e.address === (tx.to || '').toLowerCase());
    events.push({
      date: tx.metadata!.blockTimestamp!.split('T')[0],
      type: entityMatch?.type === 'exchange' ? 'EXCHANGE_INTERACTION' : entityMatch?.type === 'mixer' ? 'MIXER_INTERACTION' : 'MAJOR_OUTFLOW',
      description: tl.sent(fmtEth(val), tx.asset || nativeCurrency, entityMatch ? entityMatch.label : (tx.to || '').slice(0, 10) + '...'),
      highlight: true,
      counterparty: (tx.to || '').toLowerCase(),
    });
  }

  // Last activity
  const last = all[all.length - 1];
  if (all.length > 1) {
    events.push({
      date: last.metadata!.blockTimestamp!.split('T')[0],
      type: 'LAST_ACTIVITY',
      description: 'Last recorded activity',
    });
  }

  // Sort by date, deduplicate dates
  events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  return events;
}

function getRecoveryDifficulty(entityType: string): string {
  switch (entityType) {
    case 'exchange': return 'LOW - Subpoena possible';
    case 'mixer': return 'HIGH - Funds obfuscated';
    case 'defi': return 'MEDIUM - On-chain analysis possible';
    default: return 'UNKNOWN - Further investigation needed';
  }
}

function analyzeExitPoints(
  outgoing: (Transfer | UnifiedTransfer)[],
  identifiedEntities: { address: string; type: string; label: string }[],
  nativeCurrency: string = 'ETH',
): ExitPointAnalysis {
  const realOutflows = outgoing.filter(tx => {
    const asset = (tx.asset || '').toUpperCase();
    return REAL_ASSET_SYMBOLS.has(asset) || tx.category === 'external';
  });

  // Group by destination address, sum values
  const destMap = new Map<string, { amount: number; token: string; date: string }>();
  for (const tx of realOutflows) {
    const to = (tx.to || '').toLowerCase();
    if (!to || to === NULL_ADDRESS) continue;
    const existing = destMap.get(to);
    const val = safeValue(tx);
    const date = tx.metadata?.blockTimestamp?.split('T')[0] || '';
    if (!existing || val > existing.amount) {
      destMap.set(to, { amount: val, token: tx.asset || nativeCurrency, date });
    }
  }

  const exitPoints: ExitPoint[] = Array.from(destMap.entries())
    .sort((a, b) => b[1].amount - a[1].amount)
    .slice(0, 8)
    .map(([address, data]) => {
      const entity = identifiedEntities.find(e => e.address === address);
      return {
        address,
        amount: Math.round(data.amount * 10000) / 10000,
        token: data.token,
        date: data.date,
        entityType: entity?.type || 'unknown',
        entityName: entity?.label || null,
        recoveryDifficulty: getRecoveryDifficulty(entity?.type || ''),
      };
    });

  return {
    exitPoints,
    hasKycExit: exitPoints.some(e => e.entityType === 'exchange'),
    hasMixerUsage: exitPoints.some(e => e.entityType === 'mixer'),
    hasCrossChain: false, // Could be detected with bridge address list
    overallRecoveryAssessment: exitPoints.some(e => e.entityType === 'exchange')
      ? 'MEDIUM - Exchange exit detected'
      : exitPoints.some(e => e.entityType === 'mixer')
        ? 'LOW - Mixer used'
        : 'UNKNOWN - Further investigation needed',
  };
}

function generateRecoveryScenarios(exitAnalysis: ExitPointAnalysis, recoveryScore: number): RecoveryScenario[] {
  const scenarios: RecoveryScenario[] = [];

  scenarios.push({
    name: 'Scenario A: Funds reached KYC exchange',
    probability: exitAnalysis.hasKycExit ? 'HIGH' : 'LOW',
    recoveryChance: 'HIGH',
    description: exitAnalysis.hasKycExit
      ? 'Exchange detected. Subpoena can reveal account holder identity.'
      : 'No exchange exit detected yet. Deeper trace may reveal exchange endpoint.',
    action: exitAnalysis.hasKycExit
      ? 'File subpoena to exchange compliance department'
      : 'Commission deep trace to find exchange endpoint',
  });

  scenarios.push({
    name: 'Scenario B: Funds in unknown wallets',
    probability: exitAnalysis.exitPoints.some(e => e.entityType === 'unknown') ? 'HIGH' : 'LOW',
    recoveryChance: 'MEDIUM',
    description: 'Funds held in unidentified wallets. May be intermediary or final destination.',
    action: 'Continue monitoring for movement to exchange',
  });

  scenarios.push({
    name: 'Scenario C: Funds mixed or bridged',
    probability: exitAnalysis.hasMixerUsage ? 'HIGH' : 'LOW',
    recoveryChance: 'LOW',
    description: exitAnalysis.hasMixerUsage
      ? 'Mixer usage detected. Professional demixing analysis required.'
      : 'No mixer detected. Cross-chain bridge may have been used.',
    action: exitAnalysis.hasMixerUsage
      ? 'Engage specialized demixing service'
      : 'Check destination chains for continued activity',
  });

  return scenarios;
}

export async function generateReport(
  walletAddress: string,
  email: string,
  options?: { stripePaymentId?: string; amount?: number; network?: string; locale?: string },
) {
  const network = (options?.network || 'eth').toLowerCase();
  // Phase 3: report locale (en|es; others fall back to en in getReportTranslations).
  const reportLocale = options?.locale || 'en';
  // Phase 3 Batch 2.1: locale-aware generated prose (role reasoning, narrative,
  // evidence factors, legal weight). Same table the PDF renders with.
  const tReport = getReportTranslations(reportLocale);
  const tInv = tReport.investigation;
  const networkLabel = NETWORK_LABELS[network] || network.toUpperCase();
  const nativeCurrency = NATIVE_CURRENCY[network] || 'ETH';
  // Only lowercase for EVM addresses
  const address = ['btc', 'sol', 'trx'].includes(network) ? walletAddress : walletAddress.toLowerCase();
  const caseId = `LH-${Date.now().toString(36).toUpperCase()}`;
  const date = new Date().toISOString().split('T')[0];

  logger.info({ network, address }, '[generateReport] Starting report');

  // Fetch transfers from the correct chain
  const { incoming: rawIncoming, outgoing: rawOutgoing } = await fetchTransfersForNetwork(address, network);

  // Apply spam filter on all EVM chains (BNB is especially spam-heavy)
  const outgoing = filterSpam(rawOutgoing);
  const incoming = filterSpam(rawIncoming);
  const spamFiltered = (rawIncoming.length - incoming.length) + (rawOutgoing.length - outgoing.length);

  // Debug: log first transfer to verify metadata structure
  const sampleTx = rawIncoming[0] || rawOutgoing[0];
  logger.info({
    rawIn: rawIncoming.length, cleanIn: incoming.length,
    rawOut: rawOutgoing.length, cleanOut: outgoing.length, spamFiltered,
    sampleHasMetadata: !!sampleTx?.metadata,
    sampleBlockTimestamp: sampleTx?.metadata?.blockTimestamp || 'MISSING',
    sampleAsset: sampleTx?.asset || 'NONE',
  }, '[generateReport] Transfers fetched');

  // ── Phase 2: Attack Technique Analysis ──
  // 2026-05-21: run on RAW (un-spam-filtered) transfers — dust and
  // Unicode-named tokens are the very signals these detectors hunt for and
  // must NOT be stripped first. `assetRaw` carries the un-sanitized symbol.
  const rawAll = [...rawIncoming, ...rawOutgoing];
  // Phase 2.7: normalize upstream category strings ('external' = Alchemy native)
  // into the detector's enum so address-poisoning can tell native ETH from an
  // ERC-20 token and never mislabels a null-symbol spoof token as 'ETH'.
  const normalizeCategory = (c?: string): 'native' | 'erc20' | 'erc721' | 'unknown' => {
    const v = (c || '').toLowerCase();
    if (v === 'external' || v === 'native') return 'native';
    if (v === 'erc20' || v === 'token') return 'erc20';
    if (v === 'erc721' || v === 'erc1155') return 'erc721';
    return 'unknown';
  };
  const attackTxs = rawAll.map((tx) => ({
    from: tx.from || '',
    to: tx.to || '',
    value: safeValue(tx),
    asset: tx.asset ?? null,
    assetRaw: tx.assetRaw ?? tx.asset ?? null,
    category: normalizeCategory(tx.category),
    tokenContract: tx.rawContract?.address,
    hash: tx.hash,
    metadata: tx.metadata,
  }));
  const addressPoisoning = detectAddressPoisoning({ allTransactions: attackTxs, subjectAddress: address });
  const unicodeSpoofing = detectUnicodeSpoofing({ allTransactions: attackTxs });
  logger.info({
    event: 'attack_techniques_analyzed',
    poisoning_detected: addressPoisoning.detected,
    poisoning_campaigns: addressPoisoning.campaigns.length,
    poisoning_spoofs: addressPoisoning.totalSpoofsAcrossAllCampaigns,
    poisoning_successful_misdirections: addressPoisoning.campaigns.reduce((s, c) => s + c.successfulMisdirections, 0),
    poisoning_misdirected_value: addressPoisoning.totalMisdirectedToSecondarySpoofs,
    unicode_detected: unicodeSpoofing.detected,
    unicode_spoof_symbols: unicodeSpoofing.uniqueSpoofSymbols,
  }, '[generateReport] Attack techniques analyzed');

  // Calculate stats — ETH-only totals (different tokens can't be summed)
  let ethReceived = 0;
  let ethSent = 0;
  const tokenSet = new Set<string>();
  const counterpartyMap = new Map<string, { count: number; volume: number }>();
  const entityMap = new Map<string, { label: string; type: string; interactions: number; parentEntity?: string; complianceEmail?: string }>();
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
      entityMap.set(lower, {
        label: entity.label,
        type: entity.type,
        interactions: 0,
        parentEntity: entity.parentEntity,
        complianceEmail: entity.complianceEmail,
      });
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

  // ── Phase 1: Address Labels Federation ──
  // 2026-05-20: cross-reference top-20 counterparties by volume against
  // Chainabuse, GoPlus, OFAC SDN and local sources. Hard-capped at 20 so
  // total federation time stays under Vercel's function timeout budget
  // (concurrency 8 → ~10s worst case for cold cache; near-instant when
  // warmed by the 7-day S3 cache).
  let addressLabels: AddressLabelResponse[] = [];
  let externalIntelligenceDegraded = false;
  try {
    const top20 = Array.from(counterpartyMap.entries())
      .sort((a, b) => b[1].volume - a[1].volume)
      .slice(0, 20)
      .map(([addr]) => addr);
    addressLabels = await getAddressLabelsBatch(top20, network, 8);
    externalIntelligenceDegraded = addressLabels.some(r => r.hadExternalSourceFailure);
    const flaggedCount = addressLabels.filter(r => r.hasPhishingFlag || r.hasSanctionsFlag || r.hasScamFlag).length;
    logger.info({
      analyzed: top20.length,
      flagged: flaggedCount,
      degraded: externalIntelligenceDegraded,
    }, '[generateReport] Address labels federation done');
  } catch (err) {
    logger.error({ err }, '[generateReport] Address labels federation crashed — continuing without');
    externalIntelligenceDegraded = true;
  }

  // ── Risk score (improved with OFAC + scam DB + Phase 1 federation) ──
  let riskScore = 50; // baseline
  const hasMixer = identifiedEntities.some((e) => e.type === 'mixer');
  const hasExchange = identifiedEntities.some((e) => e.type === 'exchange');
  const hasScam = identifiedEntities.some((e) => e.type === 'scam');

  // Phase 1 signals from federation
  const federationSanctionsHits = addressLabels.filter(r => r.hasSanctionsFlag).length;
  const federationPhishingHits = addressLabels.filter(r => r.hasPhishingFlag).length;
  const federationScamHits = addressLabels.filter(r => r.hasScamFlag && !r.hasPhishingFlag).length;
  const externalOfacFound = addressLabels.some(r =>
    r.labels.some(l => l.source === 'ofac' && l.category === 'sanctions')
  );

  if (ofacWarning || externalOfacFound) {
    // OFAC = instant CRITICAL (whether from local KNOWN_ENTITIES or external OFAC list)
    riskScore = 95;
  } else {
    if (hasMixer) riskScore += 30;
    if (hasScam) riskScore += 25;
    if (scamDbMatches.length > 0) riskScore += 20; // Scam DB match
    if (!hasExchange && ethSent > 10) riskScore += 10;
    // 2026-05-20: was -20. CEX interaction does NOT lower risk by itself —
    // victims interact with CEX too (deposit before sending to scammer).
    // Smaller adjustment, just to break ties between otherwise-equal scores.
    if (hasExchange) riskScore -= 10;
    if (outgoing.length + incoming.length < 5) riskScore -= 15;

    // Phishing-tagged counterparty is strong signal — combine local list
    // (KNOWN_PHISHING) with anything the federation found from external sources.
    const localPhishingHits = Array.from(counterpartyMap.keys()).filter(isKnownPhishing).length;
    const totalPhishingHits = Math.max(localPhishingHits, federationPhishingHits);
    if (totalPhishingHits > 0) {
      // +10 per phishing-tagged counterparty, capped at +30.
      riskScore += Math.min(30, totalPhishingHits * 10);
    }

    // Federation scam-only hits (no phishing) — moderate boost.
    if (federationScamHits > 0) riskScore += Math.min(15, federationScamHits * 5);

    // Sanctions hits NOT covered by ofacWarning (e.g. GoPlus 'sanctioned' flag
    // on an address not in our KNOWN_ENTITIES). Hard-bump to CRITICAL.
    if (federationSanctionsHits > 0) riskScore = Math.max(riskScore, 85);
  }

  riskScore = Math.max(0, Math.min(100, riskScore));
  // riskLabel assigned after patternAnalysis (behavioral boost may adjust score)

  // ── Recovery Probability — realistic formula with hard cap ──
  // 2026-05-20 rewrite: cap at 35%, structured factors, mandatory disclaimer.
  // The previous formula could return up to 90% which created false expectations.
  const kycExchanges = identifiedEntities.filter(e => e.type === 'exchange');
  const positiveFactors: string[] = [];
  const negativeFactors: string[] = [];
  let recoveryScore = 5; // baseline — realistically low

  if (kycExchanges.length > 0) {
    recoveryScore += 10;
    positiveFactors.push(`Funds routed through KYC exchange (${kycExchanges[0].label}) — subpoena possible`);
  }
  if (scamDbMatches.length > 0) {
    recoveryScore += 5;
    positiveFactors.push('Counterparty linked to identified fraud cluster — strengthens legal case');
  }
  // Phishing-tag check on any counterparty
  const counterpartiesWithPhishingTag = Array.from(counterpartyMap.keys()).filter((a) => isKnownPhishing(a));
  if (counterpartiesWithPhishingTag.length > 0) {
    recoveryScore += 8;
    positiveFactors.push(`${counterpartiesWithPhishingTag.length} counterparty wallet(s) officially tagged Fake_Phishing on Etherscan`);
  }
  // Inactivity gates (rough — final 'inactiveDays' is computed slightly later in the existing flow)
  const lastTs = timestamps.length > 0 ? timestamps[timestamps.length - 1] : 0;
  const daysSinceLast = lastTs ? Math.floor((Date.now() - lastTs) / 86400000) : 9999;
  if (daysSinceLast < 30) {
    recoveryScore += 5;
    positiveFactors.push('Recent activity (<30 days) — funds may still be in early laundering stages');
  }
  if (daysSinceLast < 7) {
    recoveryScore += 3;
    positiveFactors.push('Very recent activity (<7 days) — improves the chance of an exchange/issuer compliance hold (at their discretion)');
  }

  if (hasMixer) {
    recoveryScore -= 15;
    negativeFactors.push('Mixer (Tornado Cash / Blender / Sinbad) usage detected — funds heavily obfuscated');
  }
  // ethSent here is in native units (ETH/BNB/etc.). For a rough USD-equivalent cutoff
  // we use a coarse "large flow" signal: >100 ETH or >$100k assumed average.
  if (ethSent > 100) {
    recoveryScore -= 3;
    negativeFactors.push('Large outflow volume — scammers prioritize rapid cash-out for high-value cases');
  }
  if (daysSinceLast > 180) {
    recoveryScore -= 5;
    negativeFactors.push('Stale activity (>6 months) — funds likely already cashed out');
  }

  recoveryScore = Math.max(2, Math.min(35, recoveryScore));

  let recoveryTier: RecoveryAssessment['tier'];
  let recoveryLabel: string;
  if (recoveryScore >= 25) {
    recoveryTier = 'HIGHER_THAN_AVERAGE';
    recoveryLabel = 'Higher than average — multiple positive factors present, but recovery still requires sustained legal action';
  } else if (recoveryScore >= 15) {
    recoveryTier = 'MODERATE';
    recoveryLabel = 'Moderate — some positive factors, recovery possible with proper legal action';
  } else if (recoveryScore >= 8) {
    recoveryTier = 'LOW';
    recoveryLabel = 'Low — recovery requires sustained legal effort and may take 6-18 months';
  } else {
    recoveryTier = 'VERY_LOW';
    recoveryLabel = 'Very low — recovery is unlikely but documentation enables legal/tax claims';
  }

  const recoveryAssessment: RecoveryAssessment = {
    score: recoveryScore,
    label: recoveryLabel,
    tier: recoveryTier,
    disclaimer: 'Statistical estimate based on case characteristics. Most cryptocurrency fraud cases do not result in full recovery. This metric is not a guarantee, prediction, or promise. Actual recovery depends on law enforcement action, exchange cooperation, and legal proceedings.',
    factors: {
      positive: positiveFactors,
      negative: negativeFactors,
    },
  };

  // ── Last activity / inactivity check ──
  const inactiveDays = timestamps.length > 0
    ? Math.floor((Date.now() - timestamps[timestamps.length - 1]) / 86400000)
    : 0;

  // ── Premium analysis sections ──
  const riskBreakdown = calculateRiskBreakdown(
    identifiedEntities, counterpartyMap.size, outgoing, incoming, ofacWarning, scamDbMatches,
  );

  const assetSummary = classifyAssets(incoming, outgoing, nativeCurrency);

  const timeline = generateTimeline(incoming, outgoing, identifiedEntities, nativeCurrency, tReport.timeline);

  const exitPointAnalysis = analyzeExitPoints(outgoing, identifiedEntities, nativeCurrency);

  const recoveryScenarios = generateRecoveryScenarios(exitPointAnalysis, recoveryScore);

  // ── Behavioral pattern analysis ──
  const patternAnalysis = analyzeScamPatterns(
    // Build TxInput[] from the combined transactions
    [
      ...incoming.map((tx) => ({
        date: tx.metadata?.blockTimestamp ? new Date(tx.metadata.blockTimestamp).toISOString().split('T')[0] : 'N/A',
        direction: 'IN' as const,
        from: tx.from || '',
        to: tx.to || '',
        value: safeValue(tx),
        token: tx.asset || nativeCurrency,
      })),
      ...outgoing.map((tx) => ({
        date: tx.metadata?.blockTimestamp ? new Date(tx.metadata.blockTimestamp).toISOString().split('T')[0] : 'N/A',
        direction: 'OUT' as const,
        from: tx.from || '',
        to: tx.to || '',
        value: safeValue(tx),
        token: tx.asset || nativeCurrency,
      })),
    ],
    identifiedEntities,
    assetSummary.spamCount,
  );

  logger.info({ patterns: patternAnalysis.patterns.length, risk: patternAnalysis.overallRisk }, '[generateReport] Pattern analysis done');

  // Fix: if behavioral analysis says CONFIRMED_SCAM, ensure risk score >= 75
  // Prevents contradiction of "LOW RISK" label alongside "CONFIRMED SCAM" behavioral assessment
  if (patternAnalysis.overallRisk === 'CONFIRMED_SCAM' && riskScore < 75) {
    riskScore = 75;
  } else if (patternAnalysis.overallRisk === 'LIKELY_SCAM' && riskScore < 55) {
    riskScore = 55;
  }

  let riskLabel: string;
  if (riskScore >= 85) riskLabel = 'CRITICAL';
  else if (riskScore >= 70) riskLabel = 'HIGH';
  else if (riskScore >= 40) riskLabel = 'MODERATE';
  else riskLabel = 'LOW';

  // ── Cross-chain tracing ──
  let crossChainTrace: import('./crossChainTracer').CrossChainTrace | null = null;
  try {
    const txInputs = [
      ...incoming.map((tx) => ({
        from: tx.from || '',
        to: tx.to || '',
        value: safeValue(tx),
        asset: tx.asset,
        direction: 'IN' as const,
        date: tx.metadata?.blockTimestamp ? new Date(tx.metadata.blockTimestamp).toISOString().split('T')[0] : 'N/A',
        category: tx.category,
      })),
      ...outgoing.map((tx) => ({
        from: tx.from || '',
        to: tx.to || '',
        value: safeValue(tx),
        asset: tx.asset,
        direction: 'OUT' as const,
        date: tx.metadata?.blockTimestamp ? new Date(tx.metadata.blockTimestamp).toISOString().split('T')[0] : 'N/A',
        category: tx.category,
      })),
    ];
    crossChainTrace = await traceCrossChain(address, network, txInputs, identifiedEntities);
    if (crossChainTrace?.detected) {
      logger.info({
        bridges: crossChainTrace.bridgeInteractions.length,
        chains: crossChainTrace.activeChains.length,
        intent: crossChainTrace.intent.label,
      }, '[generateReport] Cross-chain trace done');
    }
  } catch (err) {
    logger.error({ err }, '[generateReport] Cross-chain trace failed');
  }

  // Key findings
  const keyFindings: string[] = [];
  if (ofacWarning) {
    keyFindings.push(`CRITICAL: Wallet interacted with OFAC-sanctioned address(es): ${ofacEntities.map(e => e.label).join(', ')}. US persons are prohibited from transacting with these addresses.`);
  }
  if (hasMixer) keyFindings.push('Interactions with known mixer/tumbler services detected (Tornado Cash or similar). This is a significant risk indicator.');
  if (hasExchange) {
    // 2026-05-20 fix 1.2: dedupe by parentEntity so we don't print
    // "Binance Hot Wallet, Binance Hot Wallet, Binance 14 (Hot Wallet)…" —
    // collapse to a single "Binance" entry. Fall back to label when there's
    // no parentEntity recorded.
    const exchanges = Array.from(new Set(
      identifiedEntities
        .filter((e) => e.type === 'exchange')
        .map((e) => e.parentEntity || e.label)
    ));
    keyFindings.push(`Funds interacted with identified exchanges: ${exchanges.join(', ')}. KYC data may be available via subpoena.`);
  }
  if (hasScam) keyFindings.push('Interactions with flagged/scam-associated addresses detected.');
  if (scamDbMatches.length > 0) {
    for (const m of scamDbMatches) {
      keyFindings.push(`Counterparty ${m.address.slice(0, 10)}... linked to "${m.platformNames.join(', ')}" in LedgerHound Scam Database (${m.reports} reports, $${m.totalLoss.toLocaleString()} total losses).`);
    }
  }
  // Phase 2.7 (Issue #2): surface the substantive stablecoin movement first —
  // it is the actual money in most pig-butchering cases. Native ETH is often
  // just gas dust and must not be the only "amount" a reader sees.
  const STABLE_SYMBOLS = ['USDT', 'USDC', 'DAI', 'BUSD', 'TUSD', 'USDP', 'PYUSD'];
  const stableAssets = assetSummary.realAssets.filter(
    (a) => STABLE_SYMBOLS.includes(a.symbol) && (a.totalIn + a.totalOut) > 0,
  );
  for (const sa of stableAssets) {
    const parts: string[] = [];
    if (sa.totalOut > 0) {
      const n = outgoing.filter((t: any) => (t.asset || '').toUpperCase() === sa.symbol).length;
      parts.push(`sent ${sa.totalOut.toLocaleString('en-US', { maximumFractionDigits: 2 })} ${sa.symbol} across ${n} transfer(s)`);
    }
    if (sa.totalIn > 0) {
      const n = incoming.filter((t: any) => (t.asset || '').toUpperCase() === sa.symbol).length;
      parts.push(`received ${sa.totalIn.toLocaleString('en-US', { maximumFractionDigits: 2 })} ${sa.symbol} across ${n} transfer(s)`);
    }
    if (parts.length) keyFindings.push(`Wallet ${parts.join('; ')}.`);
  }
  const nativeSendCount = outgoing.filter((t: any) => t.category === 'external').length;
  if (ethSent > 0) {
    if (ethSent < 0.01 && stableAssets.length > 0) {
      keyFindings.push(`Native ${nativeCurrency} movement: ${fmtEth(ethSent)} ${nativeCurrency} across ${nativeSendCount} transaction(s) — gas/dust, separate from the stablecoin volume above.`);
    } else {
      keyFindings.push(`Wallet sent ${fmtEth(ethSent)} ${nativeCurrency} across ${nativeSendCount} native transactions.`);
    }
  }
  if (inactiveDays > 365) keyFindings.push(`Wallet inactive for ${inactiveDays} days (last activity: ${lastActivity}). Funds may have been moved to other wallets.`);
  if (spamFiltered > 0) keyFindings.push(`${spamFiltered} spam/airdrop token transfers were detected and filtered from this analysis.`);
  // Add cross-chain findings
  if (crossChainTrace?.detected) {
    if (crossChainTrace.bridgeInteractions.length > 0) {
      keyFindings.push(`CROSS-CHAIN: ${crossChainTrace.bridgeInteractions.length} bridge interaction(s) detected. ${crossChainTrace.escapePathSummary}`);
    } else if (crossChainTrace.activeChains.length > 0) {
      keyFindings.push(`MULTI-CHAIN: Wallet active on ${crossChainTrace.activeChains.length + 1} chains: ${crossChainTrace.activeChains.map(c => c.chainLabel).join(', ')}.`);
    }
    if (crossChainTrace.intent.label === 'LAUNDERING') {
      keyFindings.push(`CRITICAL: Cross-chain intent analysis indicates likely laundering behavior (${crossChainTrace.intent.confidence}% confidence). ${crossChainTrace.intent.reason}`);
    }
  }
  // Add behavioral pattern findings
  for (const p of patternAnalysis.patterns) {
    if (p.severity === 'CRITICAL' || p.severity === 'HIGH') {
      keyFindings.push(`BEHAVIORAL: ${p.name} detected (${p.confidence}% confidence). ${p.evidence[0]}`);
    }
  }
  if (keyFindings.length === 0) keyFindings.push('No high-risk indicators detected in automated analysis. Manual review recommended for comprehensive assessment.');

  // Recommendations
  const recommendations: string[] = [];
  if (ofacWarning) {
    recommendations.push('IMMEDIATE: Cease all interactions with this wallet. OFAC-sanctioned addresses carry severe legal penalties for US persons.');
  }
  if (hasExchange) {
    // 2026-05-20 fix 1.2: dedupe by parentEntity so we don't recommend
    // subpoenaing "Binance Hot Wallet" (label of a single hot wallet) — we
    // recommend "Binance" (the brand).
    const exchanges = Array.from(new Set(
      identifiedEntities.filter((e) => e.type === 'exchange').map((e) => e.parentEntity || e.label)
    ));
    recommendations.push(`Subpoena target identified: ${exchanges[0]}. Attorney can file discovery request for account holder information.`);
  }
  if (hasMixer) recommendations.push('Mixer usage detected. Professional demixing analysis recommended to trace funds through mixing service.');
  if (scamDbMatches.length > 0) recommendations.push('Counterparty addresses found in LedgerHound Scam Database. Existing victim reports may strengthen your legal case.');
  recommendations.push('File FBI IC3 report at ic3.gov if not already done.');
  recommendations.push('For court-ready certified investigation with expert testimony, contact LedgerHound at contact@ledgerhound.vip.');

  // Build transaction list: ETH first → major tokens → rest, dedup by token (max 3)
  type TxRow = { date: string; direction: 'IN' | 'OUT'; from: string; to: string; value: number; token: string; assetRaw?: string | null; isSpoof?: boolean; spoofTarget?: string };
  const MAJOR_TOKENS = new Set(['ETH', 'WETH', 'USDT', 'USDC', 'DAI', 'WBTC', 'BNB', 'WBNB', 'MATIC', 'AVAX', 'MNT']);
  const nativeUpper2 = nativeCurrency.toUpperCase();

  const toRow = (tx: Transfer, dir: 'IN' | 'OUT'): TxRow => {
    // 2026-05-21 (Phase 2.5): mark Unicode-spoof rows so the PDF can flag
    // them. Token displays the RAW symbol so the reader sees the real spoof.
    const cls = classifyToken(tx);
    return {
      date: tx.metadata?.blockTimestamp ? new Date(tx.metadata.blockTimestamp).toISOString().split('T')[0] : 'N/A',
      direction: dir,
      from: dir === 'IN' ? (tx.from || 'N/A') : (tx.from || address),
      to: dir === 'OUT' ? (tx.to || 'N/A') : (tx.to || address),
      value: safeValue(tx),
      token: cls.isSpoof && tx.assetRaw ? tx.assetRaw : (tx.asset || nativeCurrency),
      assetRaw: tx.assetRaw ?? null,
      isSpoof: cls.isSpoof,
      spoofTarget: cls.spoofTarget,
    };
  };

  const rawTxs: TxRow[] = [
    ...incoming.map((tx) => toRow(tx, 'IN')),
    ...outgoing.map((tx) => toRow(tx, 'OUT')),
  ];

  // Sort priority: native currency first, then major tokens, then others — within each group by value desc
  const sortKey = (tx: TxRow): number => {
    const upper = tx.token.toUpperCase();
    if (upper === nativeUpper2) return 0;
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

  // ── Narrative computation ──
  const uniqueSenders = new Set(incoming.map(tx => (tx.from || '').toLowerCase()).filter(Boolean)).size;
  const uniqueReceivers = new Set(outgoing.map(tx => (tx.to || '').toLowerCase()).filter(Boolean)).size;

  // Forwarding % — check how much of incoming value was sent out within 24h
  let forwardedWithin24h = 0;
  let totalInValue = 0;
  for (const inTx of incoming) {
    const inVal = safeValue(inTx);
    if (inVal <= 0) continue;
    totalInValue += inVal;
    const inTime = inTx.metadata?.blockTimestamp ? new Date(inTx.metadata.blockTimestamp).getTime() : 0;
    if (!inTime) continue;
    // Check if there's an outgoing tx within 24h of this incoming
    for (const outTx of outgoing) {
      const outTime = outTx.metadata?.blockTimestamp ? new Date(outTx.metadata.blockTimestamp).getTime() : 0;
      if (outTime > inTime && outTime - inTime < 86400000) {
        forwardedWithin24h += inVal;
        break;
      }
    }
  }
  const forwardingPercent = totalInValue > 0 ? Math.round((forwardedWithin24h / totalInValue) * 100) : 0;

  // 2026-05-20 fix 1.1+1.2: group exchange addresses by parentEntity to pick
  // the dominant *brand* (not a specific hot wallet). Email comes from
  // lib/known-entities.ts — no more synthesised compliance@binancehotwallet.com.
  type ExchangeBrand = {
    brand: string;            // e.g. "Binance"
    label: string;            // fallback display when no parent (e.g. "Gate.io")
    interactions: number;     // sum across all hot wallets of this brand
    addresses: string[];      // all hot wallet addresses
    complianceEmail: string;  // single brand-wide email, '' if unknown
  };
  const exchangeBrandsMap = new Map<string, ExchangeBrand>();
  for (const e of identifiedEntities) {
    if (e.type !== 'exchange') continue;
    const brand = e.parentEntity || e.label;
    const existing = exchangeBrandsMap.get(brand);
    if (existing) {
      existing.interactions += e.interactions;
      existing.addresses.push(e.address);
      // Prefer a non-empty complianceEmail when first one was empty
      if (!existing.complianceEmail && e.complianceEmail) {
        existing.complianceEmail = e.complianceEmail;
      }
    } else {
      exchangeBrandsMap.set(brand, {
        brand,
        label: e.label,
        interactions: e.interactions,
        addresses: [e.address],
        complianceEmail: e.complianceEmail || getComplianceEmailByParent(brand) || '',
      });
    }
  }
  const kycExchangeBrands: ExchangeBrand[] = Array.from(exchangeBrandsMap.values())
    .sort((a, b) => b.interactions - a.interactions);

  // Kept for backwards compatibility — kycExchangesSorted referenced elsewhere.
  // 2026-05-20: now exposes brand-level grouping rather than per-hot-wallet
  // entries, so consumers see "Binance" (13 interactions) instead of five
  // separate "Binance Hot Wallet" rows.
  const kycExchangesSorted = kycExchangeBrands.map(b => ({
    address: b.addresses[0],
    label: b.brand,
    type: 'exchange' as const,
    interactions: b.interactions,
    parentEntity: b.brand,
    complianceEmail: b.complianceEmail || undefined,
  }));
  const primaryExitExchange = kycExchangeBrands[0]?.brand || '';
  const primaryExitExchangeEmail = kycExchangeBrands[0]?.complianceEmail || '';

  // ── Wallet role classification (priority cascade) ──
  // 2026-05-20 rewrite:
  //   PRIORITY 1: subject in scam-db → 'aggregator'
  //   PRIORITY 2: subject in KNOWN_ENTITIES → exchange_deposit / etc.
  //   PRIORITY 3: VICTIM heuristic (received from CEX, sent to unknown)
  //   PRIORITY 4: existing transit / aggregation / exchange_deposit / personal
  // Reasoning bullets are accumulated for the PDF "How we classified this wallet" block.

  const subjectScamDbHit = scamDbMatches.find((m) => m.address.toLowerCase() === address.toLowerCase());
  const subjectKnownEntity = getKnownEntity(address);
  const cexInboundCount = incoming.filter((tx) => tx.from && getKnownEntity(tx.from)?.type === 'exchange').length;
  const cexOutboundCount = outgoing.filter((tx) => tx.to && getKnownEntity(tx.to)?.type === 'exchange').length;

  const inOutRatio = incoming.length > 0 ? outgoing.length / incoming.length : 0;
  const isTransit = forwardingPercent >= 70 && uniqueSenders >= 3 && cexInboundCount === 0;
  const isAggregator = uniqueSenders >= 10 && uniqueReceivers <= 5;
  const isExchangeDeposit = uniqueReceivers === 1 && kycExchangesSorted.length > 0;
  const totalTxCount = incoming.length + outgoing.length;

  // VICTIM heuristic — a wallet that received from a KYC exchange (its own funds),
  // then sent them to a small number of unknown addresses (the scammer).
  // Distinct from a transit wallet (which routes funds it didn't originally own).
  const isVictim =
    cexInboundCount > 0 &&
    uniqueReceivers > 0 &&
    uniqueReceivers <= 8 &&
    incoming.length <= 80 &&
    forwardingPercent >= 40 &&
    !subjectScamDbHit &&
    !subjectKnownEntity;

  let walletRole: WalletRole;
  let roleConfidence: number;
  const roleReasoning: string[] = [];

  if (subjectScamDbHit) {
    walletRole = 'aggregator';
    roleConfidence = 0.95;
    roleReasoning.push(tInv.roleReasoning.scamDbListed((subjectScamDbHit.platformNames || []).join(', ')));
    if (subjectScamDbHit.totalLoss) roleReasoning.push(tInv.roleReasoning.documentedLosses(subjectScamDbHit.totalLoss.toLocaleString()));
  } else if (subjectKnownEntity?.type === 'exchange') {
    walletRole = 'exchange_deposit';
    roleConfidence = 1.0;
    roleReasoning.push(tInv.roleReasoning.knownExchange(subjectKnownEntity.label));
  } else if (subjectKnownEntity?.type === 'mixer' || subjectKnownEntity?.type === 'sanctioned') {
    walletRole = 'unknown';
    roleConfidence = 1.0;
    roleReasoning.push(tInv.roleReasoning.knownInfra(subjectKnownEntity.label));
  } else if (isVictim) {
    walletRole = 'victim';
    roleConfidence = 0.85;
    roleReasoning.push(tInv.roleReasoning.victimKycEntry(cexInboundCount));
    roleReasoning.push(tInv.roleReasoning.victimForwarded(uniqueReceivers));
    roleReasoning.push(tInv.roleReasoning.victimLimitedHistory(totalTxCount));
    if (forwardingPercent >= 80) {
      roleReasoning.push(tInv.roleReasoning.victimRapidForward(forwardingPercent));
    }
  } else if (isAggregator && cexOutboundCount > 0) {
    walletRole = 'aggregator';
    roleConfidence = 0.9;
    roleReasoning.push(tInv.roleReasoning.aggregatorSenders(uniqueSenders, uniqueReceivers));
    roleReasoning.push(tInv.roleReasoning.aggregatorConsolidated(primaryExitExchange));
  } else if (isTransit) {
    walletRole = 'transit';
    roleConfidence = 0.75;
    roleReasoning.push(tInv.roleReasoning.transitForwarded(forwardingPercent));
    roleReasoning.push(tInv.roleReasoning.transitNoCex);
    roleReasoning.push(tInv.roleReasoning.transitSenders(uniqueSenders));
  } else if (isExchangeDeposit) {
    walletRole = 'exchange_deposit';
    roleConfidence = 0.7;
    roleReasoning.push(tInv.roleReasoning.exchangeSingleRecipient(primaryExitExchange));
    roleReasoning.push(tInv.roleReasoning.exchangeConsolidated(uniqueSenders));
  } else if (uniqueSenders <= 3 && uniqueReceivers > 10) {
    walletRole = 'distributor';
    roleConfidence = 0.7;
    roleReasoning.push(tInv.roleReasoning.distributor(uniqueSenders, uniqueReceivers));
  } else if (totalTxCount < 20) {
    walletRole = 'personal';
    roleConfidence = 0.6;
    roleReasoning.push(tInv.roleReasoning.personalLowCount(totalTxCount));
  } else {
    walletRole = 'unknown';
    roleConfidence = 0.3;
    roleReasoning.push(tInv.roleReasoning.unknownPattern(totalTxCount, uniqueSenders, uniqueReceivers));
    roleReasoning.push(tInv.roleReasoning.manualReview);
  }

  const walletTypeLabels: Record<WalletRole, string> = tInv.walletTypes;

  // Auto-generate narrative.
  // Phase 2.7.1 (Issue #7): when a stablecoin dominates the flow, the narrative
  // must lead with stablecoin volume — native ETH is usually just gas dust.
  // Mirrors the Key Findings logic so Page 4 prose can't contradict Page 2
  // (which previously read "Total outflow: 0.000243 ETH" while the real money
  // was tens of thousands of USDT).
  const NARRATIVE_STABLES = ['USDT', 'USDC', 'DAI', 'BUSD', 'TUSD', 'USDP', 'PYUSD'];
  const primaryStableAsset = assetSummary.realAssets
    .filter((a) => NARRATIVE_STABLES.includes(a.symbol) && (a.totalIn + a.totalOut) > 0)
    .sort((a, b) => (b.totalIn + b.totalOut) - (a.totalIn + a.totalOut))[0];
  const useStableNarrative = !!primaryStableAsset
    && (primaryStableAsset.totalIn + primaryStableAsset.totalOut) > (ethReceived + ethSent);
  const fmtAmt = (n: number) => n.toLocaleString('en-US', { maximumFractionDigits: 2 });
  const totalInDisplay = useStableNarrative
    ? `${fmtAmt(primaryStableAsset.totalIn)} ${primaryStableAsset.symbol}`
    : `${fmtEth(ethReceived)} ${nativeCurrency}`;
  const totalOutDisplay = useStableNarrative
    ? `${fmtAmt(primaryStableAsset.totalOut)} ${primaryStableAsset.symbol}`
    : `${fmtEth(ethSent)} ${nativeCurrency}`;
  // Supplementary native-ETH note when ETH is mere gas dust beside the stablecoin volume.
  const nativeDustSuffix = useStableNarrative && ethSent < 0.01
    ? tInv.narrative.nativeDustSuffix(fmtEth(ethSent), nativeCurrency)
    : '';
  let narrativeSummary = '';
  let narrativeConclusion = '';

  if (walletRole === 'victim') {
    narrativeSummary = tInv.narrative.summaryVictim(totalInDisplay, cexInboundCount, forwardingPercent, uniqueReceivers, totalOutDisplay, nativeDustSuffix);
    narrativeConclusion = tInv.narrative.conclusionVictim;
  } else if (walletRole === 'aggregator') {
    narrativeSummary = tInv.narrative.summaryAggregator(uniqueSenders, forwardingPercent, totalInDisplay, totalOutDisplay);
    if (primaryExitExchange) narrativeSummary += tInv.narrative.cashoutDestination(primaryExitExchange);
    narrativeConclusion = tInv.narrative.conclusionAggregator;
  } else if (walletRole === 'transit') {
    narrativeSummary = tInv.narrative.summaryTransit(uniqueSenders, forwardingPercent, totalInDisplay, totalOutDisplay);
    if (primaryExitExchange) narrativeSummary += tInv.narrative.cashoutDestination(primaryExitExchange);
    narrativeConclusion = tInv.narrative.conclusionTransit;
  } else if (walletRole === 'exchange_deposit') {
    narrativeSummary = tInv.narrative.summaryExchangeDeposit(primaryExitExchange, uniqueSenders, totalInDisplay, totalOutDisplay);
    narrativeConclusion = tInv.narrative.conclusionExchangeDeposit(primaryExitExchange);
  } else if (walletRole === 'distributor') {
    narrativeSummary = tInv.narrative.summaryDistributor(uniqueSenders, totalInDisplay, uniqueReceivers, totalOutDisplay);
    narrativeConclusion = tInv.narrative.conclusionDistributor;
  } else {
    narrativeSummary = tInv.narrative.summaryUnknown(totalTxCount, uniqueSenders, uniqueReceivers, totalInDisplay, totalOutDisplay);
    if (primaryExitExchange) narrativeSummary += tInv.narrative.routedThrough(primaryExitExchange);
    narrativeConclusion = hasMixer
      ? tInv.narrative.conclusionMixer
      : primaryExitExchange
        ? tInv.narrative.conclusionTraceable(primaryExitExchange)
        : tInv.narrative.conclusionFurther;
  }

  const narrative: NarrativeData = {
    walletType: walletRole,
    walletTypeLabel: walletTypeLabels[walletRole],
    roleConfidence,
    roleReasoning,
    uniqueSenders,
    uniqueReceivers,
    forwardingPercent,
    primaryExitExchange,
    primaryExitExchangeEmail,
    summary: narrativeSummary,
    conclusion: narrativeConclusion,
  };

  // ── Evidence Strength Score ──
  // 2026-05-20 fix 1.3: distinguish subject-vs-counterparty matches. When the
  // subject is a victim, the scam-db / phishing hits are on the COUNTERPARTY,
  // not the subject — so the bullet must say so to avoid implying the victim
  // wallet is itself the scam.
  const criticalPatterns = patternAnalysis.patterns.filter(p => p.severity === 'CRITICAL' || p.severity === 'HIGH').length;
  const subjectInScamDb = scamDbMatches.some(m => m.address.toLowerCase() === address.toLowerCase());
  const counterpartyScamDbMatches = scamDbMatches.filter(m => m.address.toLowerCase() !== address.toLowerCase()).length;
  const counterpartyPhishingFlags = Array.from(counterpartyMap.keys())
    .filter(a => a.toLowerCase() !== address.toLowerCase() && isKnownPhishing(a))
    .length;
  const isVictimRole = walletRole === 'victim';

  const evidenceFactors: EvidenceStrength['factors'] = [
    { label: tInv.evidence.txAnalyzed(incoming.length + outgoing.length), met: incoming.length + outgoing.length > 10 },
    { label: tInv.evidence.uniqueSenders(uniqueSenders), met: uniqueSenders >= 3 },
    { label: tInv.evidence.rapidForwarding(forwardingPercent), met: forwardingPercent >= 50 },
    // Phase 2.6: role-aware KYC exit. Previously this was unconditionally
    // "KYC exchange exit confirmed", which falsely triggered for a victim who
    // sent funds to her OWN exchange — contradicting the Investigation Summary
    // and Entity Identification pages. A subject→CEX outflow is the SCAMMER's
    // cash-out exit only when the subject is NOT the victim. Mirrors
    // scammerCashOutDetected() in reportPdf.tsx so the pages agree.
    isVictimRole
      ? { label: tInv.evidence.kycEntryConfirmed, met: kycExchangesSorted.length > 0 }
      : { label: tInv.evidence.scammerKycExit, met: exitPointAnalysis.hasKycExit },
    { label: tInv.evidence.criticalPatterns(criticalPatterns), met: criticalPatterns > 0 },
    // Scam-DB / phishing — wording differs by role.
    isVictimRole
      ? {
          label: counterpartyScamDbMatches > 0
            ? tInv.evidence.counterpartyScamDb(counterpartyScamDbMatches)
            : tInv.evidence.counterpartyScamDbGeneric,
          met: counterpartyScamDbMatches > 0,
        }
      : { label: tInv.evidence.scamDbMatch, met: scamDbMatches.length > 0 },
    isVictimRole
      ? {
          label: counterpartyPhishingFlags > 0
            ? tInv.evidence.counterpartyPhishing(counterpartyPhishingFlags)
            : tInv.evidence.counterpartyPhishingGeneric,
          met: counterpartyPhishingFlags > 0,
        }
      : { label: tInv.evidence.phishingTagged, met: counterpartyPhishingFlags > 0 },
    { label: tInv.evidence.timestampsVerified, met: timestamps.length > 0 },
    { label: tInv.evidence.crossChainTraced, met: crossChainTrace?.detected === true },
  ];

  // 2026-05-21 (Phase 2.5): attack-technique evidence bullets, campaign model.
  const poisoningSuccessfulMisdirections = addressPoisoning.campaigns.reduce((s, c) => s + c.successfulMisdirections, 0);
  if (addressPoisoning.detected) {
    const totalLookalikes = addressPoisoning.totalSpoofsAcrossAllCampaigns + addressPoisoning.campaigns.length;
    evidenceFactors.push({
      label: tInv.evidence.poisoningIdentified(totalLookalikes, addressPoisoning.campaigns.length),
      met: true,
      severity: 'high',
    });
  }
  if (poisoningSuccessfulMisdirections > 0) {
    // Phase 2.7: report REAL economic loss only (per-symbol), never mixed-unit
    // sums that conflate worthless spoof-token face amounts with real money.
    const realLoss = Object.entries(addressPoisoning.totalRealEconomicLoss)
      .filter(([, v]) => v > 0)
      .sort((a, b) => b[1] - a[1])
      .map(([sym, v]) => `${v.toLocaleString('en-US', { maximumFractionDigits: 2 })} ${sym}`)
      .join(', ');
    evidenceFactors.push({
      label: tInv.evidence.poisoningSucceeded(poisoningSuccessfulMisdirections, realLoss),
      met: true,
      severity: 'critical',
    });
  }
  if (unicodeSpoofing.detected) {
    evidenceFactors.push({
      label: tInv.evidence.unicodeSpoofing(unicodeSpoofing.uniqueSpoofSymbols),
      met: true,
      severity: 'high',
    });
  }

  const evidenceMetCount = evidenceFactors.filter(f => f.met).length;
  let evidenceScore = Math.min(100, Math.round((evidenceMetCount / evidenceFactors.length) * 100));
  // 2026-05-21: confirmed misdirection is decisive forensic evidence — bump.
  if (poisoningSuccessfulMisdirections > 0) {
    evidenceScore = Math.min(100, evidenceScore + 10);
  }
  const evidenceLabel = evidenceScore >= 70 ? tInv.evidence.labelStrong : evidenceScore >= 40 ? tInv.evidence.labelModerate : tInv.evidence.labelWeak;
  const evidenceStrength: EvidenceStrength = { score: evidenceScore, label: evidenceLabel, factors: evidenceFactors };

  // ── Top Inflows (for Victim Flow section) ──
  const topInflows = incoming
    .filter(tx => safeValue(tx) > 0)
    .sort((a, b) => safeValue(b) - safeValue(a))
    .slice(0, 5)
    .map(tx => ({
      from: tx.from || '',
      value: safeValue(tx),
      token: tx.asset || nativeCurrency,
      date: tx.metadata?.blockTimestamp ? new Date(tx.metadata.blockTimestamp).toISOString().split('T')[0] : 'N/A',
    }));

  // ── Exchange Compliance Emails (one per brand) ──
  // 2026-05-20 fix 1.1+1.2: build from brand-level grouping so we get a
  // single Binance entry (not 5×). Emails come from lib/known-entities.ts —
  // no synthesis fallback (the old code produced broken
  // compliance@binancehotwallet.com style addresses).
  const exchangeComplianceEmails = kycExchangeBrands
    .filter(b => b.complianceEmail)
    .map(b => ({ name: b.brand, email: b.complianceEmail }));

  // ── Exchange Entry vs Exit (Phase 2.5 / Part 7) ──
  // Entry = CEX → subject (the victim's OWN funding source / KYC).
  // Exit  = subject → CEX (rare for victims; would be the cash-out KYC).
  // Counterparty→CEX (one hop beyond) is out of scope for the base report —
  // see the "expanded counterparty trace" framing in the PDF/Actionable Steps.
  function aggregateExchanges(txs: (Transfer | UnifiedTransfer)[], dir: 'entry' | 'exit'): ExchangeEntry[] {
    const byBrand = new Map<string, ExchangeEntry>();
    for (const tx of txs) {
      const cexAddr = (dir === 'entry' ? tx.from : tx.to) || '';
      if (!isCexAddress(cexAddr)) continue;
      const entity = getKnownEntity(cexAddr)!;
      const brand = entity.parentEntity || entity.label;
      const val = isNativeLike(tx) ? safeValue(tx) : 0;
      const existing = byBrand.get(brand);
      if (existing) {
        existing.interactionCount += 1;
        existing.totalValue += val;
      } else {
        byBrand.set(brand, {
          address: cexAddr.toLowerCase(),
          label: entity.label,
          parentEntity: brand,
          type: dir,
          interactionCount: 1,
          totalValue: val,
          token: nativeCurrency,
          complianceEmail: entity.complianceEmail || getComplianceEmailByParent(brand) || undefined,
        });
      }
    }
    return Array.from(byBrand.values()).sort((a, b) => b.interactionCount - a.interactionCount);
  }
  const entryPoints = aggregateExchanges(incoming, 'entry');
  const exitPoints = aggregateExchanges(outgoing, 'exit');
  const exchangeAnalysis: ExchangeAnalysis = {
    entryPoints,
    exitPoints,
    hasEntryKyc: entryPoints.length > 0,
    hasExitKyc: exitPoints.length > 0,
  };

  // ── Legal Weight Assessment ──
  const legalWeight = [
    { label: tInv.legalWeight.lawEnforcement, suitable: true },
    { label: tInv.legalWeight.exchangeReview(hasExchange ? kycExchangesSorted.map(e => e.label).slice(0, 3).join(', ') : ''), suitable: true },
    { label: tInv.legalWeight.civilLitigation, suitable: true },
    { label: tInv.legalWeight.insurance, suitable: true },
    { label: tInv.legalWeight.regulatory, suitable: true },
    { label: tInv.legalWeight.courtUpgrade, suitable: false },
  ];

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
    recoveryAssessment,
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
    riskBreakdown,
    timeline,
    exitPointAnalysis,
    recoveryScenarios,
    assetSummary,
    narrative,
    evidenceStrength,
    topInflows,
    exchangeComplianceEmails,
    legalWeight,
    // Primary asset by volume: use highest-volume real asset from assetSummary
    // If the top asset is NOT the native currency and has more volume, use it (e.g. USDT on BNB chain)
    primaryAsset: (() => {
      const top = assetSummary.realAssets[0];
      if (!top) return null;
      const nativeEntry = assetSummary.realAssets.find(a => a.symbol === nativeCurrency);
      const topVol = top.totalIn + top.totalOut;
      const nativeVol = nativeEntry ? nativeEntry.totalIn + nativeEntry.totalOut : ethReceived + ethSent;
      // If top asset has at least 2x volume of native, it's the primary
      return topVol > nativeVol * 1.5 ? top : null;
    })(),
    patternAnalysis,
    crossChainTrace,
    counterpartyPhishingFlags,
    counterpartyScamDbMatches,
    addressLabels,
    externalIntelligenceDegraded,
    attackTechniques: {
      addressPoisoning,
      unicodeSpoofing,
    },
    exchangeAnalysis,
  };

  // Generate PDF
  const doc = React.createElement(ReportDocument, { data: reportData, locale: reportLocale }) as any;
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
  try {
    await sendReport(email, address, buf, caseId, downloadUrl);
    logger.info({ email, caseId }, '[generateReport] Email sent');
  } catch (emailErr: unknown) {
    logger.error({ err: emailErr, email }, '[generateReport] Email send failed (report still saved to S3)');
  }

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
