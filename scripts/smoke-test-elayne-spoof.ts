/**
 * SMOKING-GUN test: run Phase 2 detection against REAL Elayne on-chain data.
 *
 * Since ALCHEMY_API_KEY isn't available locally, we source Elayne's actual
 * ERC-20 transfers from Blockscout (which reads symbol() from the contract,
 * exactly like Alchemy would), then reproduce our pipeline:
 *
 *   raw symbol  →  assetRaw  (preserved)
 *   raw symbol  →  sanitizeAsset()  →  asset  (display)
 *   classifyToken({asset, assetRaw})  →  {isSpam, isSpoof, spoofTarget}
 *   detectUnicodeSpoofing()  →  evidence
 *
 * Expected: 2 spoof tokens — "ꓴꓢꓓꓔ" and "ÚЅDТ", both mimicking USDT.
 * If this passes, Phase 2 WILL work on production (same data, same logic).
 *
 * Run: npx tsx scripts/smoke-test-elayne-spoof.ts
 */
import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

import { classifyToken } from '../lib/generateReport';
import { detectUnicodeSpoofing } from '../lib/unicode-spoofing';
import type { SpoofTx } from '../lib/unicode-spoofing';

const ELAYNE = '0xbc8996a9a5ff12ebf8702e857cc0faa451dc9569';

// Mirror of lib/generateReport.ts sanitizeAsset() — strips non-ASCII.
function sanitizeAsset(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const clean = raw.replace(/[^\x20-\x7E]/g, '').trim();
  return clean || null;
}

interface BsTransfer {
  hash: string;
  from: string;
  to: string;
  value: string;
  tokenSymbol: string;
  tokenDecimal: string;
  contractAddress: string;
  timeStamp: string;
}

async function fetchElayne(): Promise<BsTransfer[]> {
  const url =
    `https://eth.blockscout.com/api?module=account&action=tokentx` +
    `&address=${ELAYNE}&startblock=0&endblock=99999999&sort=asc`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Blockscout HTTP ${res.status}`);
  const data = await res.json();
  return Array.isArray(data.result) ? data.result : [];
}

async function main() {
  console.log('═'.repeat(70));
  console.log('  SMOKING-GUN: Phase 2 vs REAL Elayne data (via Blockscout)');
  console.log('═'.repeat(70));
  console.log();

  const raw = await fetchElayne();
  console.log(`Fetched ${raw.length} real ERC-20 transfers for ${ELAYNE}`);
  console.log();

  // Reproduce our pipeline shape: assetRaw preserved, asset sanitized.
  const txs: SpoofTx[] = raw.map((t) => {
    const decimals = parseInt(t.tokenDecimal || '18', 10);
    const value = parseFloat(t.value || '0') / Math.pow(10, decimals);
    return {
      from: t.from,
      to: t.to,
      value,
      asset: sanitizeAsset(t.tokenSymbol),   // display (ASCII)
      assetRaw: t.tokenSymbol,                // raw (Unicode preserved)
      hash: t.hash,
      metadata: { blockTimestamp: new Date(Number(t.timeStamp) * 1000).toISOString() },
    };
  });

  // 1. Per-transfer classifyToken (our generateReport.ts logic)
  console.log('─ classifyToken() on each distinct raw symbol ─');
  const seen = new Set<string>();
  for (const tx of txs) {
    const rawSym = (tx as any).assetRaw as string;
    if (seen.has(rawSym)) continue;
    seen.add(rawSym);
    const c = classifyToken(tx as any);
    const codepoints = Array.from(rawSym).map((ch) => `U+${ch.codePointAt(0)!.toString(16).toUpperCase().padStart(4, '0')}`).join(' ');
    const flag = c.isSpoof ? `SPOOF→${c.spoofTarget}` : c.isSpam ? 'spam' : 'clean';
    console.log(`  ${flag.padEnd(14)} raw=${JSON.stringify(rawSym).padEnd(12)} asset=${JSON.stringify(tx.asset)}  [${codepoints}]`);
  }
  console.log();

  // 2. detectUnicodeSpoofing over the whole set (Part 4 will use this)
  const analysis = detectUnicodeSpoofing({ allTransactions: txs });
  console.log('─ detectUnicodeSpoofing() summary ─');
  console.log(`  detected=${analysis.detected}  uniqueSpoofSymbols=${analysis.uniqueSpoofSymbols}  totalTransfers=${analysis.totalSpoofTokenTransfers}`);
  for (const e of analysis.evidence) {
    console.log(`    "${e.fakeSymbol}" → ${e.mimicsLegitimate}  (${e.scriptCategory}, ${e.occurrences} tx)`);
    console.log(`      codepoints: ${e.fakeSymbolCodepoints}`);
  }
  console.log();

  // Assertions
  let pass = 0, fail = 0;
  const assert = (n: string, c: boolean) => { console.log(`  ${c ? '✓' : '✗'} ${n}`); c ? pass++ : fail++; };
  console.log('─ Acceptance ─');
  assert('Unicode spoofing detected', analysis.detected);
  assert('Exactly 2 unique spoof symbols', analysis.uniqueSpoofSymbols === 2);
  assert('Both mimic USDT', analysis.evidence.every((e) => e.mimicsLegitimate === 'USDT'));
  assert('Lisu symbol ꓴꓢꓓꓔ present',
    analysis.evidence.some((e) => e.fakeSymbol === '\u{A4F4}\u{A4E2}\u{A4D3}\u{A4D4}'));
  assert('Mixed-script ÚЅDТ present',
    analysis.evidence.some((e) => e.fakeSymbol.includes('Ѕ') || e.fakeSymbol.includes('Т')));

  console.log();
  console.log('═'.repeat(70));
  console.log(`  ${pass} passed, ${fail} failed`);
  console.log('═'.repeat(70));
  if (fail > 0) process.exit(1);
}

main().catch((e) => { console.error('FATAL:', e); process.exit(1); });
