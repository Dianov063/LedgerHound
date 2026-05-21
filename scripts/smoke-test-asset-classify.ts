/**
 * Smoke test for Part 3 — classifyToken() spam/spoof separation.
 *
 * Acceptance:
 *   HEX (real airdrop spam, ASCII)        → isSpam=true,  isSpoof=false
 *   USDT (real)                            → isSpam=false, isSpoof=false
 *   ꓴꓢꓓꓔ raw (Lisu)                       → isSpam=false, isSpoof=true, USDT
 *   ÚЅDТ raw (mixed)                       → isSpam=false, isSpoof=true, USDT
 *   "UD" with NO assetRaw (legacy)         → NOT flagged spoof (false-pos guard)
 *   "UD" with assetRaw="ÚЅDТ"              → spoof via raw
 *
 * Run: npx tsx scripts/smoke-test-asset-classify.ts
 */
import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

import { classifyToken } from '../lib/generateReport';

const lisuUSDT = '\u{A4F4}\u{A4E2}\u{A4D3}\u{A4D4}'; // ꓴꓢꓓꓔ
const mixedUSDT = '\u{00DA}\u{0405}D\u{0422}';       // ÚЅDТ

let pass = 0;
let fail = 0;
function check(name: string, got: { isSpam: boolean; isSpoof: boolean; spoofTarget?: string }, want: { isSpam: boolean; isSpoof: boolean; spoofTarget?: string }) {
  const ok = got.isSpam === want.isSpam && got.isSpoof === want.isSpoof &&
    (want.spoofTarget === undefined || got.spoofTarget === want.spoofTarget);
  console.log(`  ${ok ? '✓' : '✗'} ${name}: isSpam=${got.isSpam} isSpoof=${got.isSpoof}${got.spoofTarget ? ` target=${got.spoofTarget}` : ''}` +
    (ok ? '' : `  (wanted isSpam=${want.isSpam} isSpoof=${want.isSpoof}${want.spoofTarget ? ` target=${want.spoofTarget}` : ''})`));
  if (ok) pass++; else fail++;
}

// Build minimal transfer-shaped objects. `category: 'erc20'` so we exercise
// the token path, not the native short-circuit.
function t(o: { asset: string | null; assetRaw?: string | null; from?: string; value?: number | null }): any {
  return {
    from: o.from || '0xattacker0000000000000000000000000000beef',
    to: '0xvictim00000000000000000000000000000000cafe',
    value: o.value ?? 1,
    asset: o.asset,
    assetRaw: o.assetRaw !== undefined ? o.assetRaw : o.asset,
    category: 'erc20',
  };
}

console.log('═'.repeat(70));
console.log('  Part 3 — classifyToken() spam/spoof separation');
console.log('═'.repeat(70));
console.log();

// HEX — real token but classic airdrop spam (ASCII). Should stay spam.
check('HEX (airdrop spam)', classifyToken(t({ asset: 'HEX', value: 5000000 })),
  { isSpam: true, isSpoof: false });

// Real USDT — neither spam nor spoof.
check('USDT (real)', classifyToken(t({ asset: 'USDT', value: 1000 })),
  { isSpam: false, isSpoof: false });
check('ETH (real)', classifyToken(t({ asset: 'ETH', value: 1 })),
  { isSpam: false, isSpoof: false });

// Lisu USDT — asset sanitizes to null, but raw is preserved.
check('ꓴꓢꓓꓔ raw (Lisu USDT)', classifyToken(t({ asset: null, assetRaw: lisuUSDT })),
  { isSpam: false, isSpoof: true, spoofTarget: 'USDT' });

// Mixed-script USDT — asset sanitizes to "UD", raw preserved.
check('ÚЅDТ raw (mixed USDT), asset="UD"', classifyToken(t({ asset: 'UD', assetRaw: mixedUSDT })),
  { isSpam: false, isSpoof: true, spoofTarget: 'USDT' });

// FALSE-POSITIVE GUARD: "UD" with no raw available (legacy path) — must NOT
// be flagged spoof. It's just a short token; spam heuristics may or may not
// flag it, but isSpoof must be false.
const udNoRaw = classifyToken(t({ asset: 'UD', assetRaw: null }));
check('UD with no assetRaw → not spoof', udNoRaw,
  { isSpam: udNoRaw.isSpam, isSpoof: false });

// FALSE-POSITIVE GUARD: legit single non-ASCII symbol (Ξ) not a spoof.
check('Ξ (single non-ASCII) → not spoof', classifyToken(t({ asset: null, assetRaw: '\u{039E}' })),
  { isSpam: classifyToken(t({ asset: null, assetRaw: '\u{039E}' })).isSpam, isSpoof: false });

console.log();
console.log('═'.repeat(70));
console.log(`  ${pass} passed, ${fail} failed`);
console.log('═'.repeat(70));
if (fail > 0) process.exit(1);
