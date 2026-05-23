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
 *
 * 2026-05-22 (Phase 2.7) — TOKEN-CATEGORY INTEGRITY.
 *   Misdirection amounts are now classified as real / spoof / unknown so the
 *   report never sums fake-token face amounts as if they were real money.
 *   Root cause fixed: a Unicode-spoof token (e.g. Lisu "ꓴꓢꓓꓔ" = fake USDT)
 *   sanitizes to a null symbol upstream; the old `tx.asset || 'ETH'` fallback
 *   then relabeled it native "ETH", producing a bogus "4,004.20 ETH" figure.
 *   We now key aggregation by a classification that keeps native, real
 *   tokens, and each spoof contract in separate buckets, and report real
 *   economic loss separately from worthless spoof-token units.
 */

import {
  detectSpoofTarget,
  normalizeForDisplay,
  getCodepoints,
  detectScriptCategory,
  LEGITIMATE_TOKENS,
} from './unicode-spoofing';

/* ─── Public types ────────────────────────────────────────────────── */

export type FraudClusterRole = 'main_collector' | 'secondary_spoof';

/** Economic classification of a token the subject sent (Phase 2.7). */
export type PoisonTokenCategory = 'real' | 'spoof' | 'unknown';

/** Per-token slice of what the subject sent to one cluster address. */
export interface ClusterTokenSlice {
  category: PoisonTokenCategory;
  /** Display symbol — real ticker, NFC spoof glyph, or "(unknown token)". */
  symbol: string;
  /** Legit ticker the spoof imitates (category === 'spoof'). */
  mimics?: string;
  /** ERC-20 contract address, when known. */
  contract?: string;
  /** Codepoints of the RAW on-chain symbol (forensic, when non-ASCII). */
  codepoints?: string;
  /** Unicode script category of the spoof (e.g. "Lisu", "Mixed"). */
  scriptCategory?: string;
  value: number;
  count: number;
}

export interface FraudClusterEntry {
  address: string;
  role: FraudClusterRole;
  /** Total value the SUBJECT sent to this address, in `totalReceivedToken` units. */
  totalReceivedFromSubject: number;
  /** Dominant token the subject sent to this address (display label). */
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

  /* ── Phase 2.7 classification of the DOMINANT token (for display) ── */
  tokenCategory: PoisonTokenCategory;
  /** Legit ticker the dominant spoof imitates (e.g. "USDT"). */
  spoofMimicsToken?: string;
  /** Contract of the dominant token, when known. */
  tokenContract?: string;
  /** NFC-normalised display symbol of the dominant token. */
  tokenSymbolDisplay: string;
  /** Codepoints of the dominant token symbol (forensic, when non-ASCII). */
  tokenSymbolCodepoints?: string;
  /** Full per-token breakdown of value the subject sent to this address. */
  tokenBreakdown: ClusterTokenSlice[];
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
  /** = misdirection loss (value sent to secondary spoofs), dominant-token sum.
   *  NOTE (Phase 2.7): mixed-unit; kept for backward compat. Prefer the
   *  category-separated totals below for any legal/economic claim. */
  totalToSecondarySpoofs: number;
  primaryToken: string;

  /* ── Phase 2.7: category-separated misdirection totals (to spoofs) ── */
  /** Real economic loss — REAL tokens the subject sent to secondary spoofs. */
  totalMisdirectedReal: Record<string, number>;
  /** Worthless spoof-token face units routed to secondary spoofs (NOT loss). */
  totalMisdirectedSpoof: Record<string, number>;
  /** Unclassified tokens routed to secondary spoofs. */
  totalMisdirectedUnknown: Record<string, number>;

  /* ── Phase 3.1 Stage 7: clean, unit-separated victim totals to the WHOLE
     cluster (main collector + spoofs). Use these for any economic claim —
     never `totalSentByVictim` (mixed-unit). ── */
  /** Real-currency the subject sent to ALL cluster members, by symbol. */
  totalRealByVictim: Record<string, number>;
  /** Worthless spoof-token units the subject sent to ALL cluster members. */
  totalSpoofByVictim: Record<string, number>;

  /** Count of secondary spoofs that received REAL value above threshold. */
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
  /** Dominant-token mixed sum across campaigns (backward compat). */
  totalMisdirectedToSecondarySpoofs: number;
  /** Phase 2.7: real economic loss to secondary spoofs, by symbol. */
  totalRealEconomicLoss: Record<string, number>;
  /** Phase 2.7: worthless spoof-token units routed to secondary spoofs. */
  totalSpoofUnitsRouted: Record<string, number>;
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
  /**
   * Normalized transfer category (Phase 2.7). Lets the detector distinguish
   * native currency from ERC-20 tokens. Previously absent — so a token whose
   * Unicode symbol sanitized to null (e.g. the Lisu "ꓴꓢꓓꓔ" USDT spoof) was
   * silently relabeled as native 'ETH' via the `tx.asset || 'ETH'` fallback,
   * producing the bogus "4,004.20 ETH" misdirection figure.
   */
  category?: 'native' | 'erc20' | 'erc721' | 'unknown';
  /** ERC-20 contract address — for forensic linking + spoof identification. */
  tokenContract?: string;
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

/** Format a {symbol: amount} record as "1,234.50 USDT, 0.50 ETH". */
function fmtTokenMap(rec: Record<string, number>): string {
  const parts = Object.entries(rec)
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([sym, v]) => `${v.toLocaleString('en-US', { maximumFractionDigits: 2 })} ${sym}`);
  return parts.join(', ');
}

function addToBucket(bucket: Record<string, number>, key: string, val: number): void {
  if (!Number.isFinite(val) || val <= 0) return;
  bucket[key] = (bucket[key] || 0) + val;
}

function mergeBucket(dest: Record<string, number>, src: Record<string, number>): void {
  for (const [k, v] of Object.entries(src)) addToBucket(dest, k, v);
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

/**
 * Like firstDifferingChar but returns the structured parts so the caller can
 * localize the wording (Phase 3 Batch 2.2). Returns null if identical.
 */
export function firstDifferingCharParts(addr1: string, addr2: string): { position: number; a: string; b: string } | null {
  const n = Math.min(addr1.length, addr2.length);
  for (let i = 0; i < n; i++) {
    if (addr1[i] !== addr2[i]) return { position: i, a: addr1[i], b: addr2[i] };
  }
  return null;
}

/* ─── Token classification (Phase 2.7) ────────────────────────────── */

interface PoisonTokenClass {
  /** Stable aggregation key — keeps native / each real token / each spoof
   *  contract / unknowns in separate buckets so units never get conflated. */
  key: string;
  category: PoisonTokenCategory;
  /** Human display symbol (NFC-normalised). */
  displaySymbol: string;
  /** Canonical real ticker, when category === 'real'. */
  realSymbol?: string;
  /** Legit ticker the spoof imitates, when category === 'spoof'. */
  mimics?: string;
  contract?: string;
  /** Codepoints, when the symbol carries non-ASCII (spoof / unknown-unicode). */
  codepoints?: string;
  /** Unicode script category of the spoof (e.g. "Lisu", "Mixed"). */
  scriptCategory?: string;
}

/**
 * Classify the token of a single OUT transfer. The crucial fix vs. the old
 * `tx.asset || 'ETH'` default: a token whose symbol sanitized to null is
 * NEVER treated as native ETH. Native is identified by `category`, spoofs by
 * matching the RAW symbol against legit tickers, and everything else is
 * conservatively "unknown" (excluded from real economic loss).
 */
function classifyPoisonToken(tx: PoisonTx): PoisonTokenClass {
  const raw = tx.assetRaw ?? tx.asset ?? null;
  const contract = tx.tokenContract;

  // 1) Native currency — `asset` is the chain's native ticker (ASCII, reliable).
  if (tx.category === 'native') {
    const sym = (tx.asset || 'ETH').toUpperCase();
    return { key: `native:${sym}`, category: 'real', displaySymbol: sym, realSymbol: sym };
  }

  // 2) Unicode-spoof of a legitimate ticker (e.g. Lisu "ꓴꓢꓓꓔ" → USDT).
  if (raw) {
    const target = detectSpoofTarget(raw, LEGITIMATE_TOKENS as string[]);
    if (target) {
      return {
        key: `spoof:${target}:${(contract || raw).toLowerCase()}`,
        category: 'spoof',
        displaySymbol: normalizeForDisplay(raw),
        mimics: target,
        contract,
        codepoints: getCodepoints(raw),
        scriptCategory: detectScriptCategory(raw),
      };
    }
  }

  // 3) Recognised real ERC-20 — clean ASCII symbol in the legit list.
  const ascii = (tx.asset || '').toUpperCase();
  if (ascii && (LEGITIMATE_TOKENS as string[]).includes(ascii)) {
    return { key: `real:${ascii}`, category: 'real', displaySymbol: ascii, realSymbol: ascii, contract };
  }

  // 4) Unknown — unlisted ASCII token, or a non-ASCII symbol that didn't match
  //    a known ticker (often sanitized to null upstream). Treated
  //    conservatively: NOT counted as real economic loss.
  const nonAscii = !!raw && /[^\x20-\x7E]/.test(raw);
  const disp =
    (tx.asset && tx.asset.trim()) ||
    (raw ? normalizeForDisplay(raw) : '') ||
    '(unknown token)';
  return {
    key: `unknown:${(contract || disp).toLowerCase()}`,
    category: 'unknown',
    displaySymbol: disp,
    contract,
    codepoints: nonAscii ? getCodepoints(raw as string) : undefined,
  };
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

interface PerTokenAgg { value: number; count: number; first: string; last: string; cls: PoisonTokenClass }

/** Rank for choosing the headline token: prefer real over spoof over unknown. */
function categoryRank(c: PoisonTokenCategory): number {
  return c === 'real' ? 2 : c === 'spoof' ? 1 : 0;
}

/**
 * From one address's per-token aggregation, return the dominant token (real
 * preferred, then by value), the total tx count, the date range, and the full
 * per-category breakdown.
 */
function dominantToken(perToken: Map<string, PerTokenAgg>): {
  cls: PoisonTokenClass;
  value: number;
  count: number;
  first: string;
  last: string;
  breakdown: ClusterTokenSlice[];
} {
  let best: PerTokenAgg | null = null;
  let totalCount = 0;
  const breakdown: ClusterTokenSlice[] = [];
  for (const agg of Array.from(perToken.values())) {
    totalCount += agg.count;
    breakdown.push({
      category: agg.cls.category,
      symbol: agg.cls.displaySymbol,
      mimics: agg.cls.mimics,
      contract: agg.cls.contract,
      codepoints: agg.cls.codepoints,
      scriptCategory: agg.cls.scriptCategory,
      value: agg.value,
      count: agg.count,
    });
    if (!best) {
      best = agg;
    } else {
      const r = categoryRank(agg.cls.category);
      const rb = categoryRank(best.cls.category);
      if (r > rb || (r === rb && agg.value > best.value)) best = agg;
    }
  }
  if (!best) {
    const cls: PoisonTokenClass = { key: 'native:ETH', category: 'real', displaySymbol: 'ETH', realSymbol: 'ETH' };
    return { cls, value: 0, count: 0, first: '', last: '', breakdown: [] };
  }
  return { cls: best.cls, value: best.value, count: totalCount, first: best.first, last: best.last, breakdown };
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
  // outValue[addr] = Map<tokenClassKey, agg>
  const outValue = new Map<string, Map<string, PerTokenAgg>>();
  for (const tx of txs) {
    if (tx.from.toLowerCase() !== SUBJECT) continue;
    if (!isSignificantSend(tx.value, tx.asset)) continue;
    const to = tx.to.toLowerCase();
    const cls = classifyPoisonToken(tx);
    const ts = tsOf(tx);
    let perToken = outValue.get(to);
    if (!perToken) { perToken = new Map(); outValue.set(to, perToken); }
    const agg = perToken.get(cls.key) || { value: 0, count: 0, first: ts, last: ts, cls };
    agg.value += tx.value;
    agg.count += 1;
    if (ts && (!agg.first || ts < agg.first)) agg.first = ts;
    if (ts && (!agg.last || ts > agg.last)) agg.last = ts;
    perToken.set(cls.key, agg);
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
      const dom = perToken ? dominantToken(perToken) : null;
      const cls: PoisonTokenClass = dom?.cls ?? {
        key: 'native:ETH', category: 'real', displaySymbol: 'ETH', realSymbol: 'ETH',
      };
      const headlineToken =
        cls.category === 'real' ? (cls.realSymbol ?? cls.displaySymbol)
          : cls.category === 'spoof' ? `${cls.mimics ?? '?'}-spoof`
            : (cls.displaySymbol || 'token');
      return {
        address: addr,
        role: 'secondary_spoof' as FraudClusterRole, // fixed below
        totalReceivedFromSubject: dom?.value ?? 0,
        totalReceivedToken: headlineToken,
        transactionCount: dom?.count ?? 0,
        firstReceived: dom?.first ?? '',
        lastReceived: dom?.last ?? '',
        receivedDustFromCluster: dustIn.has(addr),
        dustTransactionHash: dustIn.get(addr),
        etherscanFakePhishingTag: phishingTagFor(addr),
        tokenCategory: cls.category,
        spoofMimicsToken: cls.mimics,
        tokenContract: cls.contract,
        tokenSymbolDisplay: cls.displaySymbol,
        tokenSymbolCodepoints: cls.codepoints,
        tokenBreakdown: dom?.breakdown ?? [],
      };
    });

    // Sort by value received desc; highest = main collector.
    entries.sort((a, b) => b.totalReceivedFromSubject - a.totalReceivedFromSubject);
    const mainCollector = { ...entries[0], role: 'main_collector' as FraudClusterRole };
    const secondarySpoofs = entries.slice(1).map((e) => ({ ...e, role: 'secondary_spoof' as FraudClusterRole }));

    // Primary token = dominant token across cluster (by total dominant value).
    const tokenTotals = new Map<string, number>();
    for (const e of entries) tokenTotals.set(e.totalReceivedToken, (tokenTotals.get(e.totalReceivedToken) || 0) + e.totalReceivedFromSubject);
    let primaryToken = mainCollector.totalReceivedToken;
    let best = -1;
    for (const [tok, v] of Array.from(tokenTotals.entries())) { if (v > best) { best = v; primaryToken = tok; } }

    const totalToMainCollector = mainCollector.totalReceivedFromSubject;
    const totalToSecondarySpoofs = secondarySpoofs.reduce((s, e) => s + e.totalReceivedFromSubject, 0);
    const totalSentByVictim = totalToMainCollector + totalToSecondarySpoofs;

    // ── Phase 2.7: category-separated totals to secondary spoofs ──
    const totalMisdirectedReal: Record<string, number> = {};
    const totalMisdirectedSpoof: Record<string, number> = {};
    const totalMisdirectedUnknown: Record<string, number> = {};
    for (const sp of secondarySpoofs) {
      for (const b of sp.tokenBreakdown) {
        if (b.category === 'real') addToBucket(totalMisdirectedReal, b.symbol, b.value);
        else if (b.category === 'spoof') addToBucket(totalMisdirectedSpoof, `${b.mimics ?? '?'}-spoof`, b.value);
        else addToBucket(totalMisdirectedUnknown, b.symbol || 'unknown token', b.value);
      }
    }

    // ── Phase 3.1 Stage 7: unit-separated victim totals to the WHOLE cluster ──
    const totalRealByVictim: Record<string, number> = {};
    const totalSpoofByVictim: Record<string, number> = {};
    for (const e of [mainCollector, ...secondarySpoofs]) {
      for (const b of e.tokenBreakdown) {
        if (b.category === 'real') addToBucket(totalRealByVictim, b.symbol, b.value);
        else if (b.category === 'spoof') addToBucket(totalSpoofByVictim, `${b.mimics ?? '?'}-spoof`, b.value);
      }
    }

    // "Successful misdirection" = a secondary spoof that received REAL value
    // above threshold (a worthless spoof token reaching it is NOT a real loss).
    const successfulMisdirections = secondarySpoofs.filter((e) =>
      e.tokenBreakdown.some((b) => b.category === 'real' && isMisdirectionValue(b.value, b.symbol)),
    ).length;
    const fakePhishingAddresses = entries.filter((e) => e.etherscanFakePhishingTag).map((e) => e.address);

    const [prefix, suffix] = c.pattern.split('…');

    const realLossStr = fmtTokenMap(totalMisdirectedReal);
    const spoofUnitsStr = fmtTokenMap(totalMisdirectedSpoof);
    const summary = (() => {
      let s = `Address poisoning campaign on vanity pattern ${c.pattern} — ${entries.length} look-alike addresses. `;
      s += `Main collector received ${totalToMainCollector.toLocaleString('en-US', { maximumFractionDigits: 2 })} ${mainCollector.totalReceivedToken}. `;
      if (realLossStr) {
        s += `CRITICAL: ${successfulMisdirections} secondary spoof(s) received real funds totalling ${realLossStr} — successful misdirection.`;
      } else if (spoofUnitsStr) {
        s += `Secondary spoofs received only worthless spoof-token units (${spoofUnitsStr}); no real funds were misdirected.`;
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
      totalMisdirectedReal,
      totalMisdirectedSpoof,
      totalMisdirectedUnknown,
      totalRealByVictim,
      totalSpoofByVictim,
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

  // Phase 2.7 aggregates across campaigns.
  const totalRealEconomicLoss: Record<string, number> = {};
  const totalSpoofUnitsRouted: Record<string, number> = {};
  for (const c of campaigns) {
    mergeBucket(totalRealEconomicLoss, c.totalMisdirectedReal);
    mergeBucket(totalSpoofUnitsRouted, c.totalMisdirectedSpoof);
  }

  let summary: string;
  if (!detected) {
    summary = 'No address poisoning campaign detected in the analyzed transaction set.';
  } else {
    const successful = campaigns.reduce((s, c) => s + c.successfulMisdirections, 0);
    summary = `${campaigns.length} address poisoning campaign(s) detected across ${totalSpoofsAcrossAllCampaigns + campaigns.length} look-alike addresses.`;
    const realStr = fmtTokenMap(totalRealEconomicLoss);
    if (successful > 0 && realStr) {
      summary += ` CRITICAL: ${successful} successful misdirection(s) of real funds totalling ${realStr} sent to secondary spoof addresses.`;
    } else if (Object.keys(totalSpoofUnitsRouted).length > 0) {
      summary += ` Secondary spoofs received only worthless spoof-token units; no real economic loss to spoofs detected.`;
    }
  }

  return {
    detected,
    technique: detected ? 'address_poisoning_campaign' : null,
    campaigns,
    totalSpoofsAcrossAllCampaigns,
    totalMisdirectedToSecondarySpoofs,
    totalRealEconomicLoss,
    totalSpoofUnitsRouted,
    summary,
  };
}
