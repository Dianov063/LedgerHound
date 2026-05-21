/**
 * Address Poisoning Detector — Phase 2 / Phase 2.5 "campaign" model.
 *
 * 2026-05-21 (Phase 2.5) — REWRITE of the semantic model.
 *
 * The original model paired one "real recipient" with one "spoof", which
 * mis-describes reality: in the DZHLWK case EVERY address in the
 * 0x073a…609f cluster is fraudulent. There is no legitimate recipient — the
 * highest-volume address is the scam network's MAIN COLLECTOR, and the
 * other look-alikes are SECONDARY SPOOFS used for address poisoning.
 *
 * New model — "Address Poisoning Campaign":
 *   1. Find addresses the subject sent significant value to.
 *   2. Group them by vanity pattern (prefix + suffix). Also fold in any
 *      same-pattern addresses that merely dusted the subject (poisoning
 *      fingerprint) so the cluster picture is complete.
 *   3. A cluster with ≥2 members = a campaign. Highest value-received =
 *      main collector; the rest = secondary spoofs.
 *   4. "Misdirection loss" = total the subject sent to secondary spoofs.
 *
 * Threshold note: matching uses a 4-hex prefix + 4-hex suffix (8 hex chars).
 * The DZHLWK siblings share only the first 4 hex chars (073a) + last 4
 * (609f); the 6/8-hex thresholds suggested in specs miss them. Configurable
 * via options. False-positive rate ≈ 1/16^8 per pair — negligible.
 */

/* ─── Public types ────────────────────────────────────────────────── */

export type FraudClusterRole = 'main_collector' | 'secondary_spoof';

export interface FraudClusterEntry {
  address: string;
  role: FraudClusterRole;
  /** Total value the SUBJECT sent to this address, in `totalReceivedToken` units. */
  totalReceivedFromSubject: number;
  /** Dominant token the subject sent to this address. */
  totalReceivedToken: string;
  /** Number of OUT transactions from subject to this address. */
  transactionCount: number;
  /** ISO date of first/last value received from subject (empty if dust-only). */
  firstReceived: string;
  lastReceived: string;
  /** True if this address ALSO dusted the subject (classic poisoning fingerprint). */
  receivedDustFromCluster: boolean;
  dustTransactionHash?: string;
  /** Etherscan Fake_Phishing tag, if this address is in lib/known-phishing.ts. */
  etherscanFakePhishingTag?: string;
}

export interface AddressPoisoningCampaign {
  detected: boolean;
  /** "0x073a…609f" */
  vanityPattern: string;
  prefix: string;
  suffix: string;
  totalClusterAddresses: number;

  mainCollector: FraudClusterEntry;
  secondarySpoofs: FraudClusterEntry[]; // sorted by value received desc

  /** Sum the subject sent to ALL cluster members (main + spoofs), dominant token. */
  totalSentByVictim: number;
  totalToMainCollector: number;
  /** = misdirection loss (value sent to secondary spoofs). */
  totalToSecondarySpoofs: number;
  primaryToken: string;

  /** Count of secondary spoofs that received > significance threshold. */
  successfulMisdirections: number;
  hasFakePhishingTag: boolean;
  fakePhishingAddresses: string[];

  summary: string;
}

export interface PoisoningAnalysis {
  detected: boolean;
  technique: 'address_poisoning_campaign' | null;
  campaigns: AddressPoisoningCampaign[];
  /** Aggregate across all campaigns. */
  totalSpoofsAcrossAllCampaigns: number;
  totalMisdirectedToSecondarySpoofs: number;
  /** One-line summary across all campaigns, for logging / quick reads. */
  summary: string;
}

/* ─── Input shape ─────────────────────────────────────────────────── */

/**
 * Structural subset of `UnifiedTransfer` / `Transfer`. Pass the RAW
 * (un-spam-filtered) `incoming.concat(outgoing)` arrays — dust IS the signal.
 * `assetRaw` is used for dust classification when present.
 */
export interface PoisonTx {
  from: string;
  to: string;
  value: number;
  asset: string | null;
  assetRaw?: string | null;
  hash?: string;
  metadata?: { blockTimestamp?: string };
}

/* ─── Thresholds (token-aware, no USD oracle) ─────────────────────── */

const STABLECOINS = new Set(['USDT', 'USDC', 'DAI', 'BUSD', 'TUSD', 'FRAX', 'USDP', 'PYUSD']);
const NATIVES = new Set(['ETH', 'WETH', 'BNB', 'WBNB', 'MATIC', 'AVAX', 'MNT', 'BTC', 'WBTC', 'TRX', 'SOL']);

/** Is `value` significant enough to suggest the subject *meant* to send here? */
function isSignificantSend(value: number, asset: string | null): boolean {
  if (!Number.isFinite(value) || value <= 0) return false;
  const upper = (asset || '').toUpperCase();
  if (STABLECOINS.has(upper)) return value >= 50;
  if (NATIVES.has(upper)) return value >= 0.01;
  return value >= 1;
}

/** "Successful misdirection" threshold — a spoof that received real money. */
function isMisdirectionValue(value: number, token: string): boolean {
  return isSignificantSend(value, token);
}

/** Is `value` low enough to qualify as a dust transaction? */
function looksLikeDust(value: number, asset: string | null): boolean {
  if (!Number.isFinite(value) || value < 0) return false;
  if (value < 1) return true;
  const upper = (asset || '').toUpperCase();
  if (STABLECOINS.has(upper)) return value < 10;
  return value < 0.1;
}

/* ─── Helpers ─────────────────────────────────────────────────────── */

function tsOf(tx: PoisonTx): string {
  return tx.metadata?.blockTimestamp || '';
}

function isEvm(addr: string): boolean {
  return /^0x[0-9a-fA-F]{40}$/.test(addr);
}

/**
 * Return a "position N: 'a' vs 'b'" string for the first differing
 * character between two addresses. Exported for the PDF renderer.
 */
export function firstDifferingChar(addr1: string, addr2: string): string {
  const n = Math.min(addr1.length, addr2.length);
  for (let i = 0; i < n; i++) {
    if (addr1[i] !== addr2[i]) {
      return `position ${i}: "${addr1[i]}" vs "${addr2[i]}"`;
    }
  }
  return 'identical';
}

/* ─── Detector ────────────────────────────────────────────────────── */

const DEFAULT_PREFIX_HEX = 4;
const DEFAULT_SUFFIX_HEX = 4;
const MAX_TX_DEFAULT = 5000;

// Lazy import to avoid a hard dependency cycle at module load.
// eslint-disable-next-line @typescript-eslint/no-var-requires
function phishingTagFor(address: string): string | undefined {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getPhishingTag } = require('./known-phishing');
    return getPhishingTag(address);
  } catch {
    return undefined;
  }
}

interface PerTokenAgg { value: number; count: number; first: string; last: string }

/** Aggregate the subject's OUT value to one address, grouped by token, and
 *  return the dominant token + its summed value + tx count + date range. */
function dominantToken(perToken: Map<string, PerTokenAgg>): { token: string; value: number; count: number; first: string; last: string } {
  let best: { token: string; agg: PerTokenAgg } | null = null;
  let totalCount = 0;
  for (const [token, agg] of Array.from(perToken.entries())) {
    totalCount += agg.count;
    if (!best || agg.value > best.agg.value) best = { token, agg };
  }
  if (!best) return { token: 'ETH', value: 0, count: 0, first: '', last: '' };
  return { token: best.token, value: best.agg.value, count: totalCount, first: best.agg.first, last: best.agg.last };
}

export function detectAddressPoisoning(input: {
  allTransactions: PoisonTx[];
  subjectAddress: string;
  maxTransactionsToAnalyze?: number;
  prefixHexLen?: number;
  suffixHexLen?: number;
}): PoisoningAnalysis {
  const SUBJECT = (input.subjectAddress || '').toLowerCase();
  const cap = input.maxTransactionsToAnalyze ?? MAX_TX_DEFAULT;
  const txs = input.allTransactions.slice(0, cap).filter((t) => isEvm(t.from) && isEvm(t.to));

  const PREFIX_HEX = input.prefixHexLen ?? DEFAULT_PREFIX_HEX;
  const SUFFIX_HEX = input.suffixHexLen ?? DEFAULT_SUFFIX_HEX;
  const PREFIX_LEN = PREFIX_HEX + 2; // include "0x"
  const SUFFIX_LEN = SUFFIX_HEX;

  const patternOf = (addr: string) => `${addr.slice(0, PREFIX_LEN)}…${addr.slice(-SUFFIX_LEN)}`;

  // ── Step 1: per-address aggregation of the subject's significant OUTs ──
  // outValue[addr] = Map<token, agg>
  const outValue = new Map<string, Map<string, PerTokenAgg>>();
  for (const tx of txs) {
    if (tx.from.toLowerCase() !== SUBJECT) continue;
    if (!isSignificantSend(tx.value, tx.asset)) continue;
    const to = tx.to.toLowerCase();
    const token = (tx.asset || 'ETH').toUpperCase();
    const ts = tsOf(tx);
    let perToken = outValue.get(to);
    if (!perToken) { perToken = new Map(); outValue.set(to, perToken); }
    const agg = perToken.get(token) || { value: 0, count: 0, first: ts, last: ts };
    agg.value += tx.value;
    agg.count += 1;
    if (ts && (!agg.first || ts < agg.first)) agg.first = ts;
    if (ts && (!agg.last || ts > agg.last)) agg.last = ts;
    perToken.set(token, agg);
  }

  // ── Step 2: dust-in senders (poisoning fingerprint) ──
  // dustIn[addr] = first dust tx hash
  const dustIn = new Map<string, string | undefined>();
  for (const tx of txs) {
    if (tx.to.toLowerCase() !== SUBJECT) continue;
    const from = tx.from.toLowerCase();
    if (from === SUBJECT) continue;
    if (!looksLikeDust(tx.value, tx.assetRaw ?? tx.asset)) continue;
    if (!dustIn.has(from)) dustIn.set(from, tx.hash);
  }

  // ── Step 3: build clusters keyed by vanity pattern ──
  // Members = value-destinations PLUS dust-senders sharing a pattern that
  // also appears among value-destinations (avoids clustering random dust).
  interface ClusterAcc {
    pattern: string;
    members: Set<string>;
  }
  const clusters = new Map<string, ClusterAcc>();

  // Seed clusters from value destinations.
  for (const addr of Array.from(outValue.keys())) {
    const key = patternOf(addr);
    let c = clusters.get(key);
    if (!c) { c = { pattern: key, members: new Set() }; clusters.set(key, c); }
    c.members.add(addr);
  }
  // Fold in dust-senders that match an existing cluster pattern.
  for (const addr of Array.from(dustIn.keys())) {
    const key = patternOf(addr);
    const c = clusters.get(key);
    if (c) c.members.add(addr);
  }

  // ── Step 4: build campaigns from clusters with ≥2 members ──
  const campaigns: AddressPoisoningCampaign[] = [];
  for (const c of Array.from(clusters.values())) {
    if (c.members.size < 2) continue;

    const entries: FraudClusterEntry[] = Array.from(c.members).map((addr) => {
      const perToken = outValue.get(addr);
      const dom = perToken ? dominantToken(perToken) : { token: 'ETH', value: 0, count: 0, first: '', last: '' };
      return {
        address: addr,
        role: 'secondary_spoof' as FraudClusterRole, // fixed below
        totalReceivedFromSubject: dom.value,
        totalReceivedToken: dom.token,
        transactionCount: dom.count,
        firstReceived: dom.first,
        lastReceived: dom.last,
        receivedDustFromCluster: dustIn.has(addr),
        dustTransactionHash: dustIn.get(addr),
        etherscanFakePhishingTag: phishingTagFor(addr),
      };
    });

    // Sort by value received desc; highest = main collector.
    entries.sort((a, b) => b.totalReceivedFromSubject - a.totalReceivedFromSubject);
    const mainCollector = { ...entries[0], role: 'main_collector' as FraudClusterRole };
    const secondarySpoofs = entries.slice(1).map((e) => ({ ...e, role: 'secondary_spoof' as FraudClusterRole }));

    // Primary token = dominant token across cluster (by total value).
    const tokenTotals = new Map<string, number>();
    for (const e of entries) tokenTotals.set(e.totalReceivedToken, (tokenTotals.get(e.totalReceivedToken) || 0) + e.totalReceivedFromSubject);
    let primaryToken = mainCollector.totalReceivedToken;
    let best = -1;
    for (const [tok, v] of Array.from(tokenTotals.entries())) { if (v > best) { best = v; primaryToken = tok; } }

    const totalToMainCollector = mainCollector.totalReceivedFromSubject;
    const totalToSecondarySpoofs = secondarySpoofs.reduce((s, e) => s + e.totalReceivedFromSubject, 0);
    const totalSentByVictim = totalToMainCollector + totalToSecondarySpoofs;
    const successfulMisdirections = secondarySpoofs.filter((e) => isMisdirectionValue(e.totalReceivedFromSubject, e.totalReceivedToken)).length;
    const fakePhishingAddresses = entries.filter((e) => e.etherscanFakePhishingTag).map((e) => e.address);

    const [prefix, suffix] = c.pattern.split('…');

    const summary = (() => {
      let s = `Address poisoning campaign on vanity pattern ${c.pattern} — ${entries.length} look-alike addresses. `;
      s += `Main collector received ${totalToMainCollector.toFixed(2)} ${mainCollector.totalReceivedToken}. `;
      if (successfulMisdirections > 0) {
        s += `CRITICAL: ${successfulMisdirections} secondary spoof(s) received a total of ${totalToSecondarySpoofs.toFixed(2)} ${primaryToken} — successful misdirection.`;
      } else {
        s += `No funds reached secondary spoofs (poisoning attempted, misdirection unsuccessful).`;
      }
      return s;
    })();

    campaigns.push({
      detected: true,
      vanityPattern: c.pattern,
      prefix,
      suffix,
      totalClusterAddresses: entries.length,
      mainCollector,
      secondarySpoofs,
      totalSentByVictim,
      totalToMainCollector,
      totalToSecondarySpoofs,
      primaryToken,
      successfulMisdirections,
      hasFakePhishingTag: fakePhishingAddresses.length > 0,
      fakePhishingAddresses,
      summary,
    });
  }

  // Sort campaigns by total victim outflow desc.
  campaigns.sort((a, b) => b.totalSentByVictim - a.totalSentByVictim);

  const detected = campaigns.length > 0;
  const totalMisdirectedToSecondarySpoofs = campaigns.reduce((s, c) => s + c.totalToSecondarySpoofs, 0);
  const totalSpoofsAcrossAllCampaigns = campaigns.reduce((s, c) => s + c.secondarySpoofs.length, 0);

  let summary: string;
  if (!detected) {
    summary = 'No address poisoning campaign detected in the analyzed transaction set.';
  } else {
    const successful = campaigns.reduce((s, c) => s + c.successfulMisdirections, 0);
    summary = `${campaigns.length} address poisoning campaign(s) detected across ${totalSpoofsAcrossAllCampaigns + campaigns.length} look-alike addresses.`;
    if (successful > 0) {
      summary += ` CRITICAL: ${successful} successful misdirection(s) totalling ${totalMisdirectedToSecondarySpoofs.toFixed(2)} (token-native units) sent to secondary spoof addresses.`;
    }
  }

  return {
    detected,
    technique: detected ? 'address_poisoning_campaign' : null,
    campaigns,
    totalSpoofsAcrossAllCampaigns,
    totalMisdirectedToSecondarySpoofs,
    summary,
  };
}
