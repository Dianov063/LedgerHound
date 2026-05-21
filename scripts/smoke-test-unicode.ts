/**
 * Smoke test for `lib/unicode-spoofing.ts`.
 *
 * Covers:
 *   - Lisu Letter USDT (ꓴꓢꓓꓔ — used in DZHLWK case)
 *   - Mixed Latin/Cyrillic USDT (ÚЅDТ)
 *   - False-positive guards (single-char Ξ/Ð, legit USDT, short fragments)
 *   - Full detector over synthetic transaction list
 *
 * Run: npx tsx scripts/smoke-test-unicode.ts
 */

import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

import {
  normalizeForVisualMatch,
  normalizeForDisplay,
  detectSpoofTarget,
  detectUnicodeSpoofing,
  getCodepoints,
  detectScriptCategory,
  LEGITIMATE_TOKENS,
} from '../lib/unicode-spoofing';
import type { SpoofTx } from '../lib/unicode-spoofing';

let pass = 0;
let fail = 0;
function assert(name: string, cond: boolean, detail?: string) {
  const ok = !!cond;
  console.log(`  ${ok ? '✓' : '✗'} ${name}${ok ? '' : `  ${detail ?? ''}`}`);
  if (ok) pass++; else fail++;
}

console.log('═'.repeat(70));
console.log('  Unicode Spoofing detector — DZHLWK case + calibration');
console.log('═'.repeat(70));

/* ─── Pure normaliser tests ──────────────────────────────────────── */
console.log();
console.log('1. normalizeForVisualMatch()');
const lisuUSDT = '\u{A4F4}\u{A4E2}\u{A4D3}\u{A4D4}'; // ꓴꓢꓓꓔ
assert('ꓴꓢꓓꓔ (Lisu) → USDT', normalizeForVisualMatch(lisuUSDT) === 'USDT',
  `got "${normalizeForVisualMatch(lisuUSDT)}"`);

const mixedUSDT = '\u{00DA}\u{0405}D\u{0422}'; // ÚЅDТ
assert('ÚЅDТ (Latin Ú + Cyrillic Ѕ + D + Cyrillic Т) → USDT',
  normalizeForVisualMatch(mixedUSDT) === 'USDT',
  `got "${normalizeForVisualMatch(mixedUSDT)}"`);

const fullwidthETH = '\u{FF25}\u{FF34}\u{FF28}'; // ETH (fullwidth)
assert('Fullwidth ETH → ETH', normalizeForVisualMatch(fullwidthETH) === 'ETH',
  `got "${normalizeForVisualMatch(fullwidthETH)}"`);

// NFC display normalization (Phase 2.5 polish): combining-mark form composes.
const combiningUSDT = 'U\u{0301}\u{0405}D\u{0422}'; // U + combining-acute + Ѕ + D + Т (5 cps)
assert('normalizeForDisplay composes U+0301 → Ú (5 cps → 4 cps)',
  normalizeForDisplay(combiningUSDT) === '\u{00DA}\u{0405}D\u{0422}' && Array.from(normalizeForDisplay(combiningUSDT)).length === 4,
  `got "${normalizeForDisplay(combiningUSDT)}" (${Array.from(normalizeForDisplay(combiningUSDT)).length} cps)`);
assert('normalizeForDisplay leaves Lisu untouched',
  normalizeForDisplay(lisuUSDT) === lisuUSDT);

// Mathematical Alphanumeric (𝐔𝐒𝐃𝐓 = U+1D414 + U+1D412 + U+1D403 + U+1D413)
const mathUSDT = '\u{1D414}\u{1D412}\u{1D403}\u{1D413}';
assert('Mathematical 𝐔𝐒𝐃𝐓 → USDT (via NFKD)',
  normalizeForVisualMatch(mathUSDT) === 'USDT',
  `got "${normalizeForVisualMatch(mathUSDT)}"`);

/* ─── detectSpoofTarget guards ───────────────────────────────────── */
console.log();
console.log('2. detectSpoofTarget() — calibration & guards');

assert('Lisu USDT detected', detectSpoofTarget(lisuUSDT, ['USDT']) === 'USDT',
  `got "${detectSpoofTarget(lisuUSDT, ['USDT'])}"`);
assert('Mixed Cyrillic USDT detected', detectSpoofTarget(mixedUSDT, ['USDT']) === 'USDT',
  `got "${detectSpoofTarget(mixedUSDT, ['USDT'])}"`);
assert('Fullwidth ETH detected', detectSpoofTarget(fullwidthETH, ['ETH']) === 'ETH',
  `got "${detectSpoofTarget(fullwidthETH, ['ETH'])}"`);

// False-positive guards
assert('Legit USDT not flagged', detectSpoofTarget('USDT', ['USDT']) === null);
assert('Legit ETH not flagged', detectSpoofTarget('ETH', ['ETH']) === null);
assert('Single non-ASCII Ξ not flagged (< 3 non-ASCII chars)',
  detectSpoofTarget('\u{039E}', ['ETH']) === null,
  `got "${detectSpoofTarget('\u{039E}', ['ETH'])}"`);
assert('Single non-ASCII Ð not flagged',
  detectSpoofTarget('\u{00D0}', ['DAI']) === null);
assert('Two-char ÚЅ not flagged (< 3 non-ASCII chars)',
  detectSpoofTarget('\u{00DA}\u{0405}', ['USDT']) === null);
assert('Pure ASCII unknown token not flagged',
  detectSpoofTarget('FOO', ['USDT']) === null);
assert('"USDT" already in whitelist short-circuits',
  detectSpoofTarget('USDT', LEGITIMATE_TOKENS as string[]) === null);

// Edge: candidate has 3 non-ASCII but doesn't match any legit
assert('3 random non-ASCII chars with no match → null',
  detectSpoofTarget('\u{0410}\u{0412}\u{0421}', ['USDT', 'ETH', 'DAI']) === null);

/* ─── getCodepoints + scriptCategory ─────────────────────────────── */
console.log();
console.log('3. getCodepoints() / detectScriptCategory()');
const expected = 'U+A4F4 U+A4E2 U+A4D3 U+A4D4';
assert(`Lisu USDT codepoints = ${expected}`,
  getCodepoints(lisuUSDT) === expected,
  `got "${getCodepoints(lisuUSDT)}"`);
assert('Lisu USDT category = Lisu', detectScriptCategory(lisuUSDT) === 'Lisu');
assert('Mixed USDT category = Mixed', detectScriptCategory(mixedUSDT) === 'Mixed');

/* ─── Full detector over synthetic txs ───────────────────────────── */
console.log();
console.log('4. detectUnicodeSpoofing() — full pipeline');

function mk(o: { from: string; to: string; value: number; asset: string | null; ts: string; hash?: string }): SpoofTx {
  return {
    from: o.from,
    to: o.to,
    value: o.value,
    asset: o.asset,
    hash: o.hash,
    metadata: { blockTimestamp: o.ts },
  };
}

const VICTIM = '0xbc8996a9a5ff12ebf8702e857cc0faa451dc9569';
const ATT1 = '0x073acba9caa50d332666a0eb361a47ad1d66609f';
const ATT2 = '0xfee1abcabcabcabcabcabcabcabcabcabcabcd2af';

const txs: SpoofTx[] = [
  // Legit USDT inflow from a CEX — must NOT be flagged
  mk({ from: '0x28c6c06298d514db089934071355e5743bf21d60', to: VICTIM, value: 22187.44, asset: 'USDT', ts: '2026-03-31T00:00:00Z', hash: '0xlegit' }),
  // Lisu USDT spoof (×3 transfers, same symbol, two senders)
  mk({ from: ATT1, to: VICTIM, value: 22187.44, asset: lisuUSDT, ts: '2026-04-01T00:00:00Z', hash: '0xspoof1' }),
  mk({ from: ATT1, to: VICTIM, value: 5000.00,  asset: lisuUSDT, ts: '2026-04-02T00:00:00Z', hash: '0xspoof2' }),
  mk({ from: ATT2, to: VICTIM, value: 100.00,   asset: lisuUSDT, ts: '2026-04-03T00:00:00Z', hash: '0xspoof3' }),
  // Mixed Cyrillic USDT spoof
  mk({ from: ATT2, to: VICTIM, value: 11020.50, asset: mixedUSDT, ts: '2026-03-07T00:00:00Z', hash: '0xspoof4' }),
  // Random scam token with non-ASCII but no legit target — should NOT be flagged
  mk({ from: ATT1, to: VICTIM, value: 1000, asset: '\u{0410}\u{0412}\u{0421}', ts: '2026-03-10T00:00:00Z' }),
  // Single-char Ξ — should NOT be flagged
  mk({ from: ATT1, to: VICTIM, value: 0.5, asset: '\u{039E}', ts: '2026-03-11T00:00:00Z' }),
];

const result = detectUnicodeSpoofing({ allTransactions: txs });

console.log();
console.log('  Summary:', result.summary);
console.log(`  detected=${result.detected}  uniqueSpoofSymbols=${result.uniqueSpoofSymbols}  totalTransfers=${result.totalSpoofTokenTransfers}`);
for (const e of result.evidence) {
  console.log(`    "${e.fakeSymbol}" → ${e.mimicsLegitimate}  (${e.scriptCategory}, ${e.occurrences} tx, ${e.sourceAddresses.length} sender(s))`);
  console.log(`      codepoints: ${e.fakeSymbolCodepoints}`);
}

console.log();
console.log('─'.repeat(70));
console.log('  Detector assertions');
console.log('─'.repeat(70));
assert('detected = true', result.detected);
assert('technique = unicode_spoofing', result.technique === 'unicode_spoofing');
assert('uniqueSpoofSymbols = 2', result.uniqueSpoofSymbols === 2,
  `got ${result.uniqueSpoofSymbols}`);
assert('totalSpoofTokenTransfers = 4', result.totalSpoofTokenTransfers === 4,
  `got ${result.totalSpoofTokenTransfers}`);
assert('Top evidence mimics USDT', result.evidence[0]?.mimicsLegitimate === 'USDT');
assert('Top evidence has script category Lisu', result.evidence[0]?.scriptCategory === 'Lisu');
assert('Lisu evidence has 3 occurrences', result.evidence[0]?.occurrences === 3,
  `got ${result.evidence[0]?.occurrences}`);
assert('Lisu evidence totalFakeValueClaimed = 27287.44',
  Math.abs((result.evidence[0]?.totalFakeValueClaimed || 0) - 27287.44) < 0.01,
  `got ${result.evidence[0]?.totalFakeValueClaimed}`);
assert('Lisu evidence has 2 unique senders',
  (result.evidence[0]?.sourceAddresses.length) === 2);
assert('Mixed evidence script category = Mixed',
  result.evidence[1]?.scriptCategory === 'Mixed');
assert('Random Cyrillic non-spoof NOT in evidence',
  !result.evidence.some((e) => e.fakeSymbol === '\u{0410}\u{0412}\u{0421}'));
assert('Single-char Ξ NOT in evidence',
  !result.evidence.some((e) => e.fakeSymbol === '\u{039E}'));
assert('Legit USDT inflow not interpreted as spoof',
  !result.evidence.some((e) => e.fakeSymbol === 'USDT'));

console.log();
console.log('═'.repeat(70));
console.log(`  ${pass} passed, ${fail} failed`);
console.log('═'.repeat(70));
if (fail > 0) process.exit(1);
