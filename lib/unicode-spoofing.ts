/**
 * Unicode Spoofing Detector — Phase 2 attack-technique analysis.
 *
 * What it detects:
 *   Attackers create fake tokens with names that VISUALLY mimic legitimate
 *   token tickers using non-Latin scripts. The classic DZHLWK case is
 *   `ꓴꓢꓓꓔ` (Lisu Letters U+A4F4 U+A4E2 U+A4D3 U+A4D4) — visually
 *   indistinguishable from `USDT` but a worthless contract. They send
 *   "deposits" of this fake token to victims to make wallet history look
 *   like a refund has started.
 *
 * How:
 *   1. Reject pure-ASCII strings (legitimate tokens never include
 *      confusables) and reject any name already in the whitelist.
 *   2. Require ≥ 3 non-ASCII characters — a single diacritic (e.g. `Ξ`)
 *      isn't an intentional spoof, just a stylised symbol.
 *   3. Normalise the candidate by:
 *      a) mapping known confusable code-points (Lisu Letters, Cyrillic
 *         look-alikes, Greek look-alikes, fullwidth Latin) to ASCII;
 *      b) applying NFKD decomposition + stripping combining marks
 *         (handles Latin-with-diacritics and Mathematical Alphanumeric).
 *   4. Uppercase and compare to each legitimate ticker. A hit means we
 *      can attribute the spoof to a target.
 *
 * PIPELINE NOTE (Part 4 / integration):
 *   `lib/generateReport.ts: sanitizeAsset()` currently strips non-ASCII
 *   chars from the asset symbol at ingestion. So `ꓴꓢꓓꓔ` becomes `null`
 *   (all stripped) or `UꓢꓓꓔD` becomes `UD` (Latin-only fragment). The
 *   detector here operates on the RAW unsanitised symbol — the integration
 *   step must preserve the original name before sanitisation runs.
 *
 * 2026-05-20: Created.
 */

/* ─── Public types ────────────────────────────────────────────────── */

export type SpoofScriptCategory =
  | 'Lisu'
  | 'Cyrillic'
  | 'Greek'
  | 'Latin Diacritics'
  | 'Fullwidth Latin'
  | 'Mathematical'
  | 'Mixed'
  | 'Other';

export interface UnicodeSpoofEvidence {
  /** The fake symbol as it appears in transaction data. */
  fakeSymbol: string;
  /** Codepoints in standard U+HHHH notation (e.g. "U+A4F4 U+A4E2 U+A4D3 U+A4D4"). */
  fakeSymbolCodepoints: string;
  /** Legitimate ticker the spoof mimics (e.g. "USDT"). */
  mimicsLegitimate: string;
  /** Which Unicode script category(ies) the spoof draws from. */
  scriptCategory: SpoofScriptCategory;
  /** Number of transactions in the analysed set that carried this symbol. */
  occurrences: number;
  /** Sum of `value` across those transfers (token-native units). */
  totalFakeValueClaimed: number;
  /** Distinct sender addresses (lower-cased). */
  sourceAddresses: string[];
  /** A few example transactions for the PDF. */
  transactionExamples: Array<{
    hash?: string;
    timestamp: string;
    valueClaimed: number;
    from: string;
  }>;
}

export interface UnicodeSpoofingAnalysis {
  detected: boolean;
  technique: 'unicode_spoofing' | null;
  totalSpoofTokenTransfers: number;
  uniqueSpoofSymbols: number;
  evidence: UnicodeSpoofEvidence[];
  summary: string;
}

/** Structural subset of `UnifiedTransfer`/`Transfer` used by this module. */
export interface SpoofTx {
  from: string;
  to: string;
  value: number;
  /**
   * Display symbol (may be sanitized/ASCII-only). The detector prefers
   * `assetRaw` when present and only falls back to `asset`.
   */
  asset: string | null;
  /**
   * RAW upstream symbol with Unicode preserved. This is the field the
   * detector relies on — our pipeline sanitizes `asset` (stripping the
   * very characters we're hunting), so `assetRaw` must be supplied for
   * real spoofs to be caught. 2026-05-21.
   */
  assetRaw?: string | null;
  hash?: string;
  metadata?: { blockTimestamp?: string };
}

/* ─── Confusables map ──────────────────────────────────────────────── */
/*
 * Manually curated — Unicode publishes confusables.txt but it's huge and
 * lists every plausible look-alike. We only need code-points that real-world
 * crypto-scam token names use. NFKD decomposition handles the rest
 * (Mathematical Alphanumeric Symbols, fullwidth Latin, Latin with combining
 * diacritics, …).
 *
 * Object literal — duplicate keys would error in strict TS, so we group by
 * script for readability and use only ONE value per code point.
 */
const UNICODE_CONFUSABLES: Record<string, string> = {
  // ─── Lisu Letters (U+A4D0..U+A4FF) ─────────────────────────────────
  // Source: Unicode 9.0 Lisu block. Mapping by visual similarity.
  '\u{A4D0}': 'B', // ꓐ LISU LETTER BA
  '\u{A4D1}': 'P', // ꓑ LISU LETTER PA
  '\u{A4D2}': 'P', // ꓒ LISU LETTER PHA
  '\u{A4D3}': 'D', // ꓓ LISU LETTER DA
  '\u{A4D4}': 'T', // ꓔ LISU LETTER TA
  '\u{A4D5}': 'T', // ꓕ LISU LETTER THA
  '\u{A4D6}': 'G', // ꓖ LISU LETTER GA
  '\u{A4D7}': 'K', // ꓗ LISU LETTER KA
  '\u{A4D8}': 'K', // ꓘ LISU LETTER KHA
  '\u{A4D9}': 'J', // ꓙ LISU LETTER JA
  '\u{A4DA}': 'C', // ꓚ LISU LETTER CA
  '\u{A4DB}': 'C', // ꓛ LISU LETTER CHA
  '\u{A4DC}': 'Z', // ꓜ LISU LETTER DZA
  '\u{A4DD}': 'T', // ꓝ LISU LETTER TSA
  '\u{A4DE}': 'T', // ꓞ LISU LETTER TSHA
  '\u{A4DF}': 'M', // ꓟ LISU LETTER MA
  '\u{A4E0}': 'N', // ꓠ LISU LETTER NA
  '\u{A4E1}': 'L', // ꓡ LISU LETTER LA
  '\u{A4E2}': 'S', // ꓢ LISU LETTER SA  ← used in DZHLWK case
  '\u{A4E3}': 'Z', // ꓣ LISU LETTER ZHA
  '\u{A4E4}': 'Z', // ꓤ LISU LETTER ZA
  '\u{A4E5}': 'N', // ꓥ LISU LETTER NGA
  '\u{A4E6}': 'H', // ꓦ LISU LETTER HA
  '\u{A4E7}': 'X', // ꓧ LISU LETTER XA
  '\u{A4E8}': 'H', // ꓨ LISU LETTER HHA
  '\u{A4E9}': 'F', // ꓩ LISU LETTER FA
  '\u{A4EA}': 'W', // ꓪ LISU LETTER WA
  '\u{A4EB}': 'S', // ꓫ LISU LETTER SHA
  '\u{A4EC}': 'Y', // ꓬ LISU LETTER YA
  '\u{A4ED}': 'G', // ꓭ LISU LETTER GHA
  '\u{A4EE}': 'A', // ꓮ LISU LETTER A
  '\u{A4EF}': 'A', // ꓯ LISU LETTER AE
  '\u{A4F0}': 'E', // ꓰ LISU LETTER E
  '\u{A4F1}': 'E', // ꓱ LISU LETTER EU
  '\u{A4F2}': 'I', // ꓲ LISU LETTER I
  '\u{A4F3}': 'O', // ꓳ LISU LETTER O
  '\u{A4F4}': 'U', // ꓴ LISU LETTER U  ← used in DZHLWK case
  '\u{A4F5}': 'V', // ꓵ LISU LETTER UE
  '\u{A4F6}': 'R', // ꓶ LISU LETTER R

  // ─── Cyrillic look-alikes ──────────────────────────────────────────
  '\u{0410}': 'A', // А
  '\u{0412}': 'B', // В
  '\u{0421}': 'C', // С
  '\u{0415}': 'E', // Е
  '\u{041D}': 'H', // Н
  '\u{041A}': 'K', // К
  '\u{041C}': 'M', // М
  '\u{041E}': 'O', // О
  '\u{0420}': 'P', // Р
  '\u{0422}': 'T', // Т  ← used in mixed-script USDT
  '\u{0425}': 'X', // Х
  '\u{0405}': 'S', // Ѕ  ← Cyrillic Dze, used in mixed-script USDT
  '\u{0408}': 'J', // Ј
  '\u{0406}': 'I', // І
  '\u{040E}': 'Y', // Ў (approx)
  '\u{0430}': 'a', // а
  '\u{0435}': 'e', // е
  '\u{043E}': 'o', // о
  '\u{0440}': 'p', // р
  '\u{0441}': 'c', // с
  '\u{0443}': 'y', // у
  '\u{0445}': 'x', // х

  // ─── Greek look-alikes ─────────────────────────────────────────────
  '\u{0391}': 'A', // Α
  '\u{0392}': 'B', // Β
  '\u{0395}': 'E', // Ε
  '\u{0396}': 'Z', // Ζ
  '\u{0397}': 'H', // Η
  '\u{0399}': 'I', // Ι
  '\u{039A}': 'K', // Κ
  '\u{039C}': 'M', // Μ
  '\u{039D}': 'N', // Ν
  '\u{039F}': 'O', // Ο
  '\u{03A1}': 'P', // Ρ
  '\u{03A4}': 'T', // Τ
  '\u{03A7}': 'X', // Χ
  '\u{03A5}': 'Y', // Υ
  // Lowercase Greek (rare in tickers but possible)
  '\u{03BF}': 'o', // ο

  // ─── Fullwidth Latin (U+FF21..U+FF3A) ──────────────────────────────
  // NFKD will normalize these to plain ASCII, but explicit mapping is
  // cheaper than running NFKD when we hit one.
  '\u{FF21}': 'A', '\u{FF22}': 'B', '\u{FF23}': 'C', '\u{FF24}': 'D',
  '\u{FF25}': 'E', '\u{FF26}': 'F', '\u{FF27}': 'G', '\u{FF28}': 'H',
  '\u{FF29}': 'I', '\u{FF2A}': 'J', '\u{FF2B}': 'K', '\u{FF2C}': 'L',
  '\u{FF2D}': 'M', '\u{FF2E}': 'N', '\u{FF2F}': 'O', '\u{FF30}': 'P',
  '\u{FF31}': 'Q', '\u{FF32}': 'R', '\u{FF33}': 'S', '\u{FF34}': 'T',
  '\u{FF35}': 'U', '\u{FF36}': 'V', '\u{FF37}': 'W', '\u{FF38}': 'X',
  '\u{FF39}': 'Y', '\u{FF3A}': 'Z',
};

/* ─── Public helpers ──────────────────────────────────────────────── */

export function hasNonAsciiChars(s: string): boolean {
  // eslint-disable-next-line no-control-regex
  return /[^\x00-\x7F]/.test(s);
}

/** Count non-ASCII characters (code-points). */
export function countNonAscii(s: string): number {
  let n = 0;
  for (const ch of s) {
    if (ch.codePointAt(0)! > 127) n++;
  }
  return n;
}

/**
 * Normalise a string into a comparable ASCII form, used for visual-spoof
 * detection only. Returns uppercase. NOT safe for round-trip — lossy.
 */
export function normalizeForVisualMatch(s: string): string {
  // Pass 1: explicit confusables map (script-specific look-alikes).
  let out = '';
  for (const ch of s) {
    out += UNICODE_CONFUSABLES[ch] ?? ch;
  }
  // Pass 2: NFKD decomposition (Latin diacritics + Mathematical Alphanumeric
  // + fullwidth — strips combining marks afterwards).
  out = out.normalize('NFKD').replace(/[̀-ͯ]/g, '');
  return out.toUpperCase();
}

/**
 * Detect whether `symbol` is a Unicode-spoof of any name in
 * `legitimateSymbols`. Returns the legit name on hit, null otherwise.
 *
 * Guards:
 *   - whitelist short-circuit (legit name passes unchanged)
 *   - no non-ASCII chars → not a spoof
 *   - fewer than 3 non-ASCII chars → not enough to be an intentional spoof
 *   - normalised form must EXACTLY equal a legit ticker (uppercase)
 */
export function detectSpoofTarget(
  symbol: string,
  legitimateSymbols: string[],
): string | null {
  if (!symbol) return null;
  // Whitelist short-circuit — case-insensitive against the canonical list.
  const upper = symbol.toUpperCase();
  for (const legit of legitimateSymbols) {
    if (legit.toUpperCase() === upper) return null;
  }
  if (!hasNonAsciiChars(symbol)) return null;
  if (countNonAscii(symbol) < 3) return null;

  const normalised = normalizeForVisualMatch(symbol);
  for (const legit of legitimateSymbols) {
    if (normalised === legit.toUpperCase() && symbol !== legit) {
      return legit;
    }
  }
  return null;
}

/* ─── Codepoint + script-category helpers (for the PDF) ───────────── */

export function getCodepoints(s: string): string {
  return Array.from(s)
    .map((ch) => `U+${ch.codePointAt(0)!.toString(16).toUpperCase().padStart(4, '0')}`)
    .join(' ');
}

export function detectScriptCategory(s: string): SpoofScriptCategory {
  let hasLisu = false;
  let hasCyrillic = false;
  let hasGreek = false;
  let hasLatinDiacritic = false;
  let hasFullwidth = false;
  let hasMath = false;
  for (const ch of s) {
    const cp = ch.codePointAt(0)!;
    if (cp >= 0xa4d0 && cp <= 0xa4ff) hasLisu = true;
    else if (cp >= 0x0400 && cp <= 0x04ff) hasCyrillic = true;
    else if (cp >= 0x0370 && cp <= 0x03ff) hasGreek = true;
    else if ((cp >= 0x00c0 && cp <= 0x00ff) || (cp >= 0x0100 && cp <= 0x017f)) hasLatinDiacritic = true;
    else if (cp >= 0xff00 && cp <= 0xffef) hasFullwidth = true;
    else if (cp >= 0x1d400 && cp <= 0x1d7ff) hasMath = true;
  }
  const categories = [hasLisu, hasCyrillic, hasGreek, hasLatinDiacritic, hasFullwidth, hasMath]
    .filter(Boolean).length;
  if (categories > 1) return 'Mixed';
  if (hasLisu) return 'Lisu';
  if (hasCyrillic) return 'Cyrillic';
  if (hasGreek) return 'Greek';
  if (hasLatinDiacritic) return 'Latin Diacritics';
  if (hasFullwidth) return 'Fullwidth Latin';
  if (hasMath) return 'Mathematical';
  return 'Other';
}

/* ─── Default whitelist ───────────────────────────────────────────── */

/** Legit ticker symbols to compare against. Order doesn't matter. */
export const LEGITIMATE_TOKENS: readonly string[] = [
  'USDT', 'USDC', 'DAI', 'BUSD', 'TUSD', 'USDP', 'FRAX', 'PYUSD',
  'ETH', 'WETH', 'BTC', 'WBTC', 'BNB', 'WBNB',
  'MATIC', 'AVAX', 'FTM', 'TRX', 'SOL', 'XRP', 'XLM',
  'LINK', 'UNI', 'AAVE', 'SUSHI', 'CRV', 'COMP', 'MKR', 'SNX',
  'LDO', 'RPL', 'GRT', 'ENS', 'DYDX', 'STETH', 'RETH', 'CBETH',
  'ARB', 'OP', 'LTC', 'BCH', 'ADA', 'ATOM', 'DOT', 'CAKE',
];

/* ─── Detector ────────────────────────────────────────────────────── */

export function detectUnicodeSpoofing(input: {
  allTransactions: SpoofTx[];
  legitimateTokens?: readonly string[];
}): UnicodeSpoofingAnalysis {
  const tokens = (input.legitimateTokens || LEGITIMATE_TOKENS) as string[];
  const byFakeSymbol = new Map<string, UnicodeSpoofEvidence>();

  for (const tx of input.allTransactions) {
    // Prefer the raw (Unicode-preserving) symbol — `asset` is sanitized in
    // our pipeline and would have the spoof characters stripped.
    const sym = tx.assetRaw ?? tx.asset;
    if (!sym) continue;
    const target = detectSpoofTarget(sym, tokens);
    if (!target) continue;

    const ev = byFakeSymbol.get(sym) || {
      fakeSymbol: sym,
      fakeSymbolCodepoints: getCodepoints(sym),
      mimicsLegitimate: target,
      scriptCategory: detectScriptCategory(sym),
      occurrences: 0,
      totalFakeValueClaimed: 0,
      sourceAddresses: [] as string[],
      transactionExamples: [] as UnicodeSpoofEvidence['transactionExamples'],
    };
    if (!byFakeSymbol.has(sym)) byFakeSymbol.set(sym, ev);

    ev.occurrences += 1;
    if (Number.isFinite(tx.value) && tx.value > 0) ev.totalFakeValueClaimed += tx.value;
    const fromLower = (tx.from || '').toLowerCase();
    if (fromLower && !ev.sourceAddresses.includes(fromLower)) {
      ev.sourceAddresses.push(fromLower);
    }
    if (ev.transactionExamples.length < 5) {
      ev.transactionExamples.push({
        hash: tx.hash,
        timestamp: tx.metadata?.blockTimestamp || '',
        valueClaimed: tx.value || 0,
        from: fromLower || 'unknown',
      });
    }
  }

  const evidence = Array.from(byFakeSymbol.values()).sort((a, b) => b.occurrences - a.occurrences);
  const detected = evidence.length > 0;

  let summary: string;
  if (!detected) {
    summary = 'No Unicode spoofing indicators detected in the analyzed transaction set.';
  } else {
    const labels = evidence.map((e) => `"${e.fakeSymbol}" (mimicking ${e.mimicsLegitimate})`).join(', ');
    summary =
      `Unicode spoofing attack identified — ${evidence.length} fake token ` +
      `symbol(s) detected: ${labels}. ` +
      `These tokens use non-Latin scripts (Lisu Letters, Cyrillic, Greek, etc.) ` +
      `to visually mimic legitimate cryptocurrencies and create false ` +
      `"deposit" or "refund" entries in wallet history.`;
  }

  return {
    detected,
    technique: detected ? 'unicode_spoofing' : null,
    totalSpoofTokenTransfers: evidence.reduce((sum, e) => sum + e.occurrences, 0),
    uniqueSpoofSymbols: evidence.length,
    evidence,
    summary,
  };
}
