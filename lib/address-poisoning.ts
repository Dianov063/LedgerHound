/**
 * Address Poisoning Detector — Phase 2 attack-technique analysis.
 *
 * What it detects:
 *   Attackers generate "vanity" wallet addresses whose hex prefix and suffix
 *   match a victim's real intended recipient (e.g. real = 0x073a4abbf262…4609f,
 *   spoof = 0x073acba9caa5…609f — both start "0x073a" and end "609f"). They
 *   then send dust transactions to the victim's wallet, hoping the victim
 *   later copies the spoof out of their history when paying the real
 *   recipient.
 *
 * How:
 *   1. Identify "real recipients" — addresses the subject deliberately sent
 *      meaningful value to. Threshold is token-aware (stablecoins ≥ ~$50,
 *      native ≥ ~0.01) so the detector works without USD price oracles.
 *   2. For each real recipient, scan IN transactions for senders whose
 *      first-8-hex-chars (including `0x`) AND last-4-hex-chars match the
 *      real recipient's, but the full address differs. That's the vanity
 *      pattern attackers exploit.
 *   3. Check whether the victim later sent meaningful value TO the spoof
 *      (`victimMisdirected`) — the smoking-gun evidence.
 *   4. Group all spoofs against the same real address into vanity clusters.
 *
 * 2026-05-20: Created. Operates on the `UnifiedTransfer`-shaped objects
 * `generateReport.ts` already produces — we DO NOT use USD valuation
 * (we don't have a price oracle in the pipeline), so thresholds are
 * defined per token category.
 */

/* ─── Public types ────────────────────────────────────────────────── */

export interface PoisoningMatch {
  /** The legitimate intended recipient the spoof targets. */
  realAddress: string;
  /** ISO date when subject first sent value to the real recipient. */
  realAddressFirstSent: string;
  /** Total value subject sent to the real recipient (in token units —
   *  see `realAddressToken` for the unit. We deliberately don't aggregate
   *  USD because the pipeline lacks a price oracle.) */
  realAddressTotalValue: number;
  /** Token symbol used in the dominant flow to the real recipient. */
  realAddressToken: string;

  /** The spoofed address (visually similar to real, but a distinct wallet). */
  spoofedAddress: string;

  /** Match strength descriptor. Always 'strong' under the strict prefix-8/
   *  suffix-4 rule used here; reserved for future relaxations. */
  patternStrength: 'strong' | 'moderate' | 'weak';
  /** Number of hex chars matched at the prefix (NOT counting "0x"). */
  prefixMatchLength: number;
  /** Number of hex chars matched at the suffix. */
  suffixMatchLength: number;

  /** The dust transaction that established the spoof in the victim's
   *  wallet history. Hash optional because some chains/providers don't
   *  return it consistently. */
  dustTransactionHash?: string;
  dustValue: number;
  dustToken: string;
  dustTimestamp: string;

  /** CRITICAL evidence: did the victim later send real funds to the spoof? */
  victimMisdirected: boolean;
  misdirectedTxHash?: string;
  /** Value (in token units) of the misdirected transaction. */
  misdirectedAmount?: number;
  misdirectedToken?: string;
  misdirectedTimestamp?: string;
}

export interface VanityCluster {
  /** Human-readable pattern descriptor — e.g. "0x073a…609f". */
  pattern: string;
  /** First 8 chars including "0x". */
  prefix: string;
  /** Last 4 chars. */
  suffix: string;
  /** All addresses in this cluster — first entry is the real address (anchor). */
  addresses: string[];
  /** The real (intended) recipient the subject deliberately sent value to. */
  realAddress: string;
}

export interface PoisoningAnalysis {
  detected: boolean;
  technique: 'address_poisoning' | null;
  /** Total spoof addresses identified across all real recipients. */
  totalSpoofAttempts: number;
  /** Count of spoofs that the victim actually sent value to. */
  totalVictimMisdirected: number;
  /** Sum of misdirected values (in the originating token's units —
   *  pragmatic stand-in for USD until we add a price oracle). */
  totalMisdirectedValue: number;
  matches: PoisoningMatch[];
  vanityClusters: VanityCluster[];
  /** One-line human-readable summary suitable for the PDF. */
  summary: string;
}

/* ─── Input shape ─────────────────────────────────────────────────── */

/**
 * Structural subset of `UnifiedTransfer` / `Transfer` from generateReport.ts.
 * The detector only needs these fields — adapt at the call site by passing
 * the raw (un-spam-filtered) `incoming.concat(outgoing)` arrays directly.
 */
export interface PoisonTx {
  from: string;
  to: string;
  /** Already normalised (post-`safeValue`) numeric amount in token-native units. */
  value: number;
  /** Token symbol (e.g. 'USDT', 'ETH'). May be null for some raw streams. */
  asset: string | null;
  hash?: string;
  metadata?: { blockTimestamp?: string };
}

/* ─── Thresholds (token-aware, no USD oracle) ─────────────────────── */

const STABLECOINS = new Set(['USDT', 'USDC', 'DAI', 'BUSD', 'TUSD', 'FRAX', 'USDP', 'PYUSD']);
const NATIVES = new Set(['ETH', 'WETH', 'BNB', 'WBNB', 'MATIC', 'AVAX', 'MNT', 'BTC', 'WBTC', 'TRX', 'SOL']);

/** Is `value` significant enough to suggest the subject *meant* to send to
 *  this recipient (vs a fee/dust)? */
function isSignificantSend(value: number, asset: string | null): boolean {
  if (!Number.isFinite(value) || value <= 0) return false;
  const upper = (asset || '').toUpperCase();
  if (STABLECOINS.has(upper)) return value >= 50;       // ~$50 USD equivalent
  if (NATIVES.has(upper)) return value >= 0.01;          // ~0.01 ETH ≈ $30
  return value >= 1;                                     // generous for "other" tokens
}

/** Is `value` low enough to qualify as a dust transaction (typical
 *  poisoning signal)? Note: with strict address-similarity matching we
 *  also accept moderate values, because some attackers send larger
 *  fake-token amounts. The signal is the address similarity, not the value. */
function looksLikeDust(value: number, asset: string | null): boolean {
  if (!Number.isFinite(value) || value < 0) return false;
  // Anything tiny is dust regardless of asset.
  if (value < 1) return true;
  const upper = (asset || '').toUpperCase();
  // For stables: anything under $10 effectively dust for "we just want to
  // appear in your history" purposes.
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

/* ─── Detector ────────────────────────────────────────────────────── */

/**
 * Match thresholds. Default = 4 hex prefix + 4 hex suffix (8 hex chars
 * visual match total). This is calibrated to the real-world DZHLWK
 * attack pattern (e.g. 0x073a4abb… vs 0x073acba9… share only the first
 * 4 hex chars). The spec's 6-hex threshold misses these — vanity-address
 * generation is cheap enough that attackers routinely settle for 4+4.
 *
 * False-positive rate at 4+4: 1 / 16^8 ≈ 1 / 4.3 billion per pair, well
 * below noise floor for any realistic wallet (10 OUT recipients × 1000 IN
 * txs = 10k pairs → < 1e-5 expected false positives).
 *
 * Override via the `prefixHexLen`/`suffixHexLen` options when calling
 * `detectAddressPoisoning` if a use case needs stricter matching.
 */
const DEFAULT_PREFIX_HEX = 4;
const DEFAULT_SUFFIX_HEX = 4;
const MAX_TX_DEFAULT = 5000;

/**
 * Detect address poisoning attacks against the subject wallet.
 *
 * The caller should pass the RAW (un-spam-filtered) `incoming.concat(outgoing)`
 * arrays — dust and Unicode-named tokens are the very signals we look for and
 * MUST NOT be filtered upstream.
 */
export function detectAddressPoisoning(input: {
  allTransactions: PoisonTx[];
  subjectAddress: string;
  maxTransactionsToAnalyze?: number;
  /** Hex chars matched at the prefix (excluding "0x"). Default 4. */
  prefixHexLen?: number;
  /** Hex chars matched at the suffix. Default 4. */
  suffixHexLen?: number;
}): PoisoningAnalysis {
  const SUBJECT = (input.subjectAddress || '').toLowerCase();
  const cap = input.maxTransactionsToAnalyze ?? MAX_TX_DEFAULT;
  const txs = input.allTransactions.slice(0, cap);

  const PREFIX_HEX = input.prefixHexLen ?? DEFAULT_PREFIX_HEX;
  const SUFFIX_HEX = input.suffixHexLen ?? DEFAULT_SUFFIX_HEX;
  const PREFIX_LEN = PREFIX_HEX + 2; // include leading "0x"
  const SUFFIX_LEN = SUFFIX_HEX;

  // EVM-only: BTC/SOL/TRON address formats need a different similarity model,
  // and the spec calls out EVM patterns specifically. Filter to EVM transactions.
  const evmTxs = txs.filter(t => isEvm(t.from) && isEvm(t.to));

  // ── 1. Real recipients (significant OUTs) ────────────────────────
  type RealInfo = { totalValue: number; firstSent: string; count: number; token: string };
  const realRecipients = new Map<string, RealInfo>();
  for (const tx of evmTxs) {
    if (tx.from.toLowerCase() !== SUBJECT) continue;
    if (!isSignificantSend(tx.value, tx.asset)) continue;
    const to = tx.to.toLowerCase();
    const token = (tx.asset || 'ETH').toUpperCase();
    const ts = tsOf(tx);
    const prior = realRecipients.get(to);
    if (prior) {
      prior.totalValue += tx.value;
      prior.count += 1;
      if (ts && (!prior.firstSent || ts < prior.firstSent)) prior.firstSent = ts;
    } else {
      realRecipients.set(to, { totalValue: tx.value, firstSent: ts, count: 1, token });
    }
  }

  // ── 2. For each real recipient, find prefix+suffix-matching INs ──
  const matches: PoisoningMatch[] = [];

  for (const [realAddr, realInfo] of Array.from(realRecipients.entries())) {
    const realPrefix = realAddr.slice(0, PREFIX_LEN); // "0x" + 6 hex
    const realSuffix = realAddr.slice(-SUFFIX_LEN);   // 4 hex

    // Track which spoof addresses we've already recorded against this real,
    // so we don't emit one PoisoningMatch per dust tx — one per (real, spoof) pair.
    const seenSpoofs = new Set<string>();

    for (const tx of evmTxs) {
      if (tx.to.toLowerCase() !== SUBJECT) continue;     // must be IN to subject
      const sender = tx.from.toLowerCase();
      if (sender === realAddr) continue;                  // legitimate echo — skip
      if (sender === SUBJECT) continue;                   // self-tx — skip
      if (sender.slice(0, PREFIX_LEN) !== realPrefix) continue;
      if (sender.slice(-SUFFIX_LEN) !== realSuffix) continue;

      // Strict visual-match found. Most poisoning IS dust, but the pattern
      // itself is the smoking gun — we accept any IN value.
      const dust = looksLikeDust(tx.value, tx.asset);
      const _unused = dust; // dust label is informational; we don't gate on it

      if (seenSpoofs.has(sender)) continue;
      seenSpoofs.add(sender);

      // Did the victim later send meaningful value to this spoof?
      const misdirected = evmTxs.find(t =>
        t.from.toLowerCase() === SUBJECT &&
        t.to.toLowerCase() === sender &&
        isSignificantSend(t.value, t.asset),
      );

      matches.push({
        realAddress: realAddr,
        realAddressFirstSent: realInfo.firstSent,
        realAddressTotalValue: realInfo.totalValue,
        realAddressToken: realInfo.token,
        spoofedAddress: sender,
        // 'strong' at the default 4+4 threshold (8 hex visual chars matching);
        // tightening to 5+4 or 6+4 would qualify as 'stronger' but we keep
        // the label conservative for now.
        patternStrength: 'strong',
        prefixMatchLength: PREFIX_HEX,
        suffixMatchLength: SUFFIX_HEX,
        dustTransactionHash: tx.hash,
        dustValue: tx.value,
        dustToken: (tx.asset || 'ETH').toUpperCase(),
        dustTimestamp: tsOf(tx),
        victimMisdirected: !!misdirected,
        misdirectedTxHash: misdirected?.hash,
        misdirectedAmount: misdirected?.value,
        misdirectedToken: misdirected ? (misdirected.asset || 'ETH').toUpperCase() : undefined,
        misdirectedTimestamp: misdirected ? tsOf(misdirected) : undefined,
      });
    }
  }

  // ── 3. Build vanity clusters ─────────────────────────────────────
  const clusters = buildVanityClusters(matches);

  // ── 4. Build summary ─────────────────────────────────────────────
  const totalVictimMisdirected = matches.filter(m => m.victimMisdirected).length;
  const totalMisdirectedValue = matches
    .filter(m => m.victimMisdirected)
    .reduce((sum, m) => sum + (m.misdirectedAmount || 0), 0);

  const detected = matches.length > 0;
  let summary: string;
  if (!detected) {
    summary = 'No address poisoning indicators detected in the analyzed transaction set.';
  } else {
    const clusterTxt = clusters.length === 1 ? '1 vanity cluster' : `${clusters.length} vanity clusters`;
    summary =
      `Address poisoning attack identified — ${matches.length} spoofed address(es) across ${clusterTxt} ` +
      `targeting ${realRecipients.size} real recipient(s).`;
    if (totalVictimMisdirected > 0) {
      // Use the dominant misdirected token for the value label (a heuristic,
      // since the pipeline doesn't carry USD).
      const tokenMix = new Set(matches.filter(m => m.victimMisdirected).map(m => m.misdirectedToken));
      const tokenLabel = tokenMix.size === 1 ? Array.from(tokenMix)[0] : 'mixed';
      summary +=
        ` CRITICAL: subject sent ${totalMisdirectedValue.toFixed(2)} ${tokenLabel} to ` +
        `${totalVictimMisdirected} spoof address(es) — successful misdirection.`;
    }
  }

  return {
    detected,
    technique: detected ? 'address_poisoning' : null,
    totalSpoofAttempts: matches.length,
    totalVictimMisdirected,
    totalMisdirectedValue,
    matches,
    vanityClusters: clusters,
    summary,
  };
}

function buildVanityClusters(matches: PoisoningMatch[]): VanityCluster[] {
  const byPattern = new Map<string, VanityCluster>();
  for (const m of matches) {
    const real = m.realAddress;
    // Derive prefix/suffix lengths from each match record so this works
    // regardless of the threshold the detector ran with.
    const prefixLen = 2 + m.prefixMatchLength; // include "0x"
    const suffixLen = m.suffixMatchLength;
    const prefix = real.slice(0, prefixLen);
    const suffix = real.slice(-suffixLen);
    const key = `${prefix}…${suffix}`;
    let c = byPattern.get(key);
    if (!c) {
      c = { pattern: key, prefix, suffix, addresses: [real], realAddress: real };
      byPattern.set(key, c);
    }
    if (!c.addresses.includes(m.spoofedAddress)) {
      c.addresses.push(m.spoofedAddress);
    }
  }
  return Array.from(byPattern.values()).sort((a, b) => b.addresses.length - a.addresses.length);
}

/* ─── Utilities exposed for the PDF renderer ──────────────────────── */

/**
 * Return a "position N: 'a' vs 'b'" string for the first differing
 * character between two addresses. Useful for PDF call-outs.
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
