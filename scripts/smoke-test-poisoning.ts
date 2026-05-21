/**
 * Smoke test for `lib/address-poisoning.ts`.
 *
 * Uses synthetic data modelled on the Elayne case (LH-MPD8HYCY):
 *   real recipient: 0x073a4abbf262d8f946866f3ce62660ee7cf4609f
 *   spoofs       : 0x073acba9caa50d332666a0eb361a47ad1d66609f
 *                  0x073aa536cb3c3bd469ec076de4b208bebb37609f
 *                  0x073a4e18d36d6158475358eed4796235d84d609f  ← victim misdirected here
 *
 * Run: npx tsx scripts/smoke-test-poisoning.ts
 */

import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

import { detectAddressPoisoning, firstDifferingChar } from '../lib/address-poisoning';
import type { PoisonTx } from '../lib/address-poisoning';

const SUBJECT = '0xbc8996a9a5ff12ebf8702e857cc0faa451dc9569';
const REAL = '0x073a4abbf262d8f946866f3ce62660ee7cf4609f';
const SPOOF1 = '0x073acba9caa50d332666a0eb361a47ad1d66609f';
const SPOOF2 = '0x073aa536cb3c3bd469ec076de4b208bebb37609f';
const SPOOF_MISDIRECTED = '0x073a4e18d36d6158475358eed4796235d84d609f';
const SPOOF_NO_OUT = '0x073add839fa138db69ebe6cd46950302e7b8609f';

let pass = 0;
let fail = 0;
function assert(name: string, cond: boolean, detail?: string) {
  const ok = !!cond;
  console.log(`  ${ok ? '✓' : '✗'} ${name}${ok ? '' : `  ${detail || ''}`}`);
  if (ok) pass++; else fail++;
}

function tx(o: Partial<PoisonTx> & { from: string; to: string; value: number; asset: string; ts: string; hash?: string }): PoisonTx {
  return {
    from: o.from,
    to: o.to,
    value: o.value,
    asset: o.asset,
    hash: o.hash,
    metadata: { blockTimestamp: o.ts },
  };
}

const txs: PoisonTx[] = [
  // Significant intentional sends to REAL recipient — establishes "real recipient" set
  tx({ from: SUBJECT, to: REAL, value: 22187.44, asset: 'USDT', ts: '2026-04-01T00:00:00Z', hash: '0xreal1' }),
  tx({ from: SUBJECT, to: REAL, value: 5000.00,  asset: 'USDT', ts: '2026-04-05T00:00:00Z', hash: '0xreal2' }),

  // Dust IN from three spoofs (different vanity addresses, same prefix/suffix as REAL)
  tx({ from: SPOOF1,            to: SUBJECT, value: 0.001,  asset: 'ETH',  ts: '2026-03-15T00:00:00Z', hash: '0xdust1' }),
  tx({ from: SPOOF2,            to: SUBJECT, value: 0.0001, asset: 'USDT', ts: '2026-03-20T00:00:00Z', hash: '0xdust2' }),
  tx({ from: SPOOF_MISDIRECTED, to: SUBJECT, value: 0.05,   asset: 'USDT', ts: '2026-03-05T00:00:00Z', hash: '0xdust3' }),
  tx({ from: SPOOF_NO_OUT,      to: SUBJECT, value: 0.0,    asset: 'USDT', ts: '2026-03-18T00:00:00Z', hash: '0xdust4' }),

  // Victim MISDIRECTED $11,020.50 to SPOOF_MISDIRECTED — smoking-gun evidence
  tx({ from: SUBJECT, to: SPOOF_MISDIRECTED, value: 11020.50, asset: 'USDT', ts: '2026-03-07T00:00:00Z', hash: '0xmisdir' }),

  // Unrelated tx that should NOT trigger anything (random address, no vanity match)
  tx({ from: '0xabcdef1234567890abcdef1234567890abcdef12', to: SUBJECT, value: 0.001, asset: 'ETH', ts: '2026-03-10T00:00:00Z' }),

  // BTC-style transaction (non-EVM) — must be ignored by the EVM detector
  tx({ from: 'bc1qabcd', to: 'bc1qefgh', value: 100, asset: 'BTC', ts: '2026-03-12T00:00:00Z' }),
];

console.log('═'.repeat(70));
console.log('  Address Poisoning detector — Elayne case (synthetic)');
console.log('═'.repeat(70));

const result = detectAddressPoisoning({ allTransactions: txs, subjectAddress: SUBJECT });

console.log();
console.log('  Summary:', result.summary);
console.log(`  detected=${result.detected}  totalSpoofs=${result.totalSpoofAttempts}  misdirected=${result.totalVictimMisdirected}`);
console.log(`  vanityClusters=${result.vanityClusters.length}  totalMisdirectedValue=${result.totalMisdirectedValue}`);
console.log();
console.log('  Matches:');
for (const m of result.matches) {
  console.log(`    ${m.spoofedAddress}  ←spoofs→  ${m.realAddress}`);
  console.log(`      victimMisdirected=${m.victimMisdirected}` +
    (m.victimMisdirected ? `, amount=${m.misdirectedAmount} ${m.misdirectedToken}` : '') +
    `, diff=${firstDifferingChar(m.realAddress, m.spoofedAddress)}`);
}
console.log();
console.log('  Vanity clusters:');
for (const c of result.vanityClusters) {
  console.log(`    pattern=${c.pattern}  size=${c.addresses.length}  real=${c.realAddress.slice(0, 14)}…`);
}

console.log();
console.log('─'.repeat(70));
console.log('  Acceptance assertions');
console.log('─'.repeat(70));

assert('Detector reports detected', result.detected);
assert('Technique = address_poisoning', result.technique === 'address_poisoning');
assert('Found ≥ 4 spoof attempts', result.totalSpoofAttempts >= 4,
  `got ${result.totalSpoofAttempts}`);
assert('Exactly 1 misdirection recorded', result.totalVictimMisdirected === 1,
  `got ${result.totalVictimMisdirected}`);
assert('Misdirected value ≥ 11000', result.totalMisdirectedValue >= 11000,
  `got ${result.totalMisdirectedValue}`);
assert('1 vanity cluster (one real recipient)', result.vanityClusters.length === 1);
assert('Cluster contains ≥ 5 addresses (real + 4 spoofs)', result.vanityClusters[0].addresses.length >= 5,
  `got ${result.vanityClusters[0]?.addresses.length}`);
assert('Real address is anchor of cluster', result.vanityClusters[0].realAddress === REAL);

const misdirectedMatch = result.matches.find(m => m.victimMisdirected);
assert('Misdirected match points at the right spoof',
  !!misdirectedMatch && misdirectedMatch.spoofedAddress === SPOOF_MISDIRECTED);
assert('Misdirected amount = 11020.50',
  !!misdirectedMatch && Math.abs((misdirectedMatch.misdirectedAmount || 0) - 11020.50) < 0.01);
assert('Misdirected token = USDT',
  !!misdirectedMatch && misdirectedMatch.misdirectedToken === 'USDT');

assert('Unrelated random sender NOT in matches',
  !result.matches.some(m => m.spoofedAddress.startsWith('0xabcdef1234')));
assert('Non-EVM BTC transaction silently ignored',
  !result.matches.some(m => m.spoofedAddress.startsWith('bc1q')));

console.log();
console.log('═'.repeat(70));
console.log(`  ${pass} passed, ${fail} failed`);
console.log('═'.repeat(70));

if (fail > 0) process.exit(1);
