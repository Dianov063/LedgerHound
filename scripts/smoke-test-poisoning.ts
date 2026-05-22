/**
 * Smoke test for `lib/address-poisoning.ts` — Phase 2.5 campaign model.
 *
 * Synthetic data modelled on the Elayne case (LH-MPD8HYCY):
 *   cluster 0x073a…609f, all fraudulent:
 *     main collector : 0x073a4abbf262…4609f  ($27,187 — highest volume)
 *     secondary spoof: 0x073a4e18d36d…d609f  ($11,020 — successful misdirection)
 *     dust-only spoofs: 0x073acba9…, 0x073aa536…  (poisoned, $0 received)
 *
 * Run: npx tsx scripts/smoke-test-poisoning.ts
 */
import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

import { detectAddressPoisoning, firstDifferingChar } from '../lib/address-poisoning';
import type { PoisonTx } from '../lib/address-poisoning';

const SUBJECT = '0xbc8996a9a5ff12ebf8702e857cc0faa451dc9569';
const MAIN = '0x073a4abbf262d8f946866f3ce62660ee7cf4609f';
const SPOOF_MIS = '0x073a4e18d36d6158475358eed4796235d84d609f';
const DUST1 = '0x073acba9caa50d332666a0eb361a47ad1d66609f';
const DUST2 = '0x073aa536cb3c3bd469ec076de4b208bebb37609f';
// Phase 2.7: a secondary spoof that received ONLY a worthless Lisu-USDT spoof
// token (the real on-chain 0x073a0F24…609F case). Must be reported separately
// from real economic loss, and must NEVER be relabeled as native ETH.
const SPOOF_FAKE = '0x073a0f24dbf3e5992048960598cc6d2486ac609f';
const LISU_USDT = '\u{A4F4}\u{A4E2}\u{A4D3}\u{A4D4}'; // ꓴꓢꓓꓔ — Lisu spoof of USDT
const FAKE_CONTRACT = '0xd248ecdb340403ac7acba97b1e8997d15596fc79';

let pass = 0;
let fail = 0;
function assert(name: string, cond: boolean, detail?: string) {
  console.log(`  ${cond ? '✓' : '✗'} ${name}${cond ? '' : `  ${detail || ''}`}`);
  if (cond) pass++; else fail++;
}

function tx(o: { from: string; to: string; value: number; asset: string; ts: string; hash?: string }): PoisonTx {
  // Real tokens: asset is a clean ASCII ticker; mark native vs erc20 by symbol.
  const cat = ['ETH', 'BNB', 'MATIC', 'AVAX', 'BTC'].includes(o.asset.toUpperCase()) ? 'native' as const : 'erc20' as const;
  return { from: o.from, to: o.to, value: o.value, asset: o.asset, assetRaw: o.asset, category: cat, hash: o.hash, metadata: { blockTimestamp: o.ts } };
}

function txSpoof(o: { from: string; to: string; value: number; assetRaw: string; ts: string; hash?: string; contract?: string }): PoisonTx {
  // Simulates the pipeline: a Unicode-spoof symbol is sanitized to a null
  // `asset` while `assetRaw` preserves the raw glyphs; category marks a token.
  return { from: o.from, to: o.to, value: o.value, asset: null, assetRaw: o.assetRaw, category: 'erc20', tokenContract: o.contract, hash: o.hash, metadata: { blockTimestamp: o.ts } };
}

const txs: PoisonTx[] = [
  // Subject → MAIN collector (highest volume, two sends)
  tx({ from: SUBJECT, to: MAIN, value: 22187.44, asset: 'USDT', ts: '2026-04-01T00:00:00Z', hash: '0xm1' }),
  tx({ from: SUBJECT, to: MAIN, value: 5000.00,  asset: 'USDT', ts: '2026-04-05T00:00:00Z', hash: '0xm2' }),
  // Subject → SECONDARY spoof (successful misdirection — REAL USDT)
  tx({ from: SUBJECT, to: SPOOF_MIS, value: 11020.50, asset: 'USDT', ts: '2026-03-07T00:00:00Z', hash: '0xs1' }),
  // Subject → SECONDARY spoof that received ONLY a worthless Lisu-USDT spoof
  // token (Phase 2.7): must be reported separately, NOT as real economic loss,
  // and NEVER mislabeled as native ETH.
  txSpoof({ from: SUBJECT, to: SPOOF_FAKE, value: 4004.20, assetRaw: LISU_USDT, ts: '2026-02-25T03:27:59Z', hash: '0xfake1', contract: FAKE_CONTRACT }),
  // Dust-only spoofs that poisoned the subject (never received value)
  tx({ from: DUST1, to: SUBJECT, value: 0.001, asset: 'USDT', ts: '2026-03-15T00:00:00Z', hash: '0xd1' }),
  tx({ from: DUST2, to: SUBJECT, value: 0.0001, asset: 'USDT', ts: '2026-03-20T00:00:00Z', hash: '0xd2' }),
  // SPOOF_MIS also dusted the subject first (classic fingerprint)
  tx({ from: SPOOF_MIS, to: SUBJECT, value: 0.05, asset: 'USDT', ts: '2026-03-05T00:00:00Z', hash: '0xd3' }),
  // Unrelated legit send (different pattern) — must NOT cluster
  tx({ from: SUBJECT, to: '0x28c6c06298d514db089934071355e5743bf21d60', value: 1000, asset: 'USDT', ts: '2026-02-01T00:00:00Z' }),
  // Non-EVM — ignored
  tx({ from: 'bc1qaaa', to: 'bc1qbbb', value: 100, asset: 'BTC', ts: '2026-02-02T00:00:00Z' }),
];

console.log('═'.repeat(70));
console.log('  Address Poisoning — campaign model (Phase 2.5)');
console.log('═'.repeat(70));

const result = detectAddressPoisoning({ allTransactions: txs, subjectAddress: SUBJECT });

console.log();
console.log('  Summary:', result.summary);
console.log(`  detected=${result.detected} technique=${result.technique}`);
console.log(`  campaigns=${result.campaigns.length} totalSpoofs=${result.totalSpoofsAcrossAllCampaigns} totalMisdirected=${result.totalMisdirectedToSecondarySpoofs}`);
console.log();

const c = result.campaigns[0];
if (c) {
  console.log(`  Campaign: ${c.vanityPattern}  (${c.totalClusterAddresses} addresses)`);
  console.log(`    main collector: ${c.mainCollector.address}`);
  console.log(`      received ${c.mainCollector.totalReceivedFromSubject} ${c.mainCollector.totalReceivedToken} in ${c.mainCollector.transactionCount} tx`);
  console.log(`    secondary spoofs (${c.secondarySpoofs.length}):`);
  for (const s of c.secondarySpoofs) {
    console.log(`      ${s.address}  received=${s.totalReceivedFromSubject} ${s.totalReceivedToken}  dust=${s.receivedDustFromCluster}  diff=${firstDifferingChar(c.mainCollector.address, s.address)}`);
  }
  console.log(`    totalToMain=${c.totalToMainCollector} totalToSpoofs(mixed)=${c.totalToSecondarySpoofs} successful=${c.successfulMisdirections}`);
  console.log(`    realLoss=${JSON.stringify(c.totalMisdirectedReal)} spoofUnits=${JSON.stringify(c.totalMisdirectedSpoof)} unknown=${JSON.stringify(c.totalMisdirectedUnknown)}`);
}

console.log();
console.log('─'.repeat(70));
console.log('  Acceptance assertions');
console.log('─'.repeat(70));

assert('detected = true', result.detected);
assert('technique = address_poisoning_campaign', result.technique === 'address_poisoning_campaign');
assert('exactly 1 campaign', result.campaigns.length === 1, `got ${result.campaigns.length}`);
assert('vanity pattern starts 0x073a', !!c && c.vanityPattern.startsWith('0x073a'), c?.vanityPattern);
assert('cluster has ≥4 addresses (main + 3 spoofs)', !!c && c.totalClusterAddresses >= 4, `got ${c?.totalClusterAddresses}`);
assert('main collector is the highest-volume address', !!c && c.mainCollector.address === MAIN,
  `got ${c?.mainCollector.address}`);
assert('main collector received 27187.44', !!c && Math.abs(c.mainCollector.totalReceivedFromSubject - 27187.44) < 0.01,
  `got ${c?.mainCollector.totalReceivedFromSubject}`);
assert('main > top secondary spoof', !!c && c.mainCollector.totalReceivedFromSubject > c.secondarySpoofs[0].totalReceivedFromSubject);
assert('exactly 1 successful (real-value) misdirection', !!c && c.successfulMisdirections === 1, `got ${c?.successfulMisdirections}`);
assert('SPOOF_MIS is a secondary spoof', !!c && c.secondarySpoofs.some(s => s.address === SPOOF_MIS));
assert('SPOOF_MIS flagged receivedDustFromCluster', !!c && !!c.secondarySpoofs.find(s => s.address === SPOOF_MIS)?.receivedDustFromCluster);

// ── Phase 2.7: token-category integrity ──
assert('campaign real loss = 11020.50 USDT', !!c && Math.abs((c.totalMisdirectedReal['USDT'] || 0) - 11020.50) < 0.01,
  `got ${JSON.stringify(c?.totalMisdirectedReal)}`);
assert('campaign spoof units = 4004.20 USDT-spoof', !!c && Math.abs((c.totalMisdirectedSpoof['USDT-spoof'] || 0) - 4004.20) < 0.01,
  `got ${JSON.stringify(c?.totalMisdirectedSpoof)}`);
assert('spoof units NOT counted in real loss', !!c && !Object.keys(c.totalMisdirectedReal).some(k => k.toLowerCase().includes('spoof')) && !((c.totalMisdirectedReal['USDT'] || 0) > 11020.51),
  `got ${JSON.stringify(c?.totalMisdirectedReal)}`);
const fakeEntry = c?.secondarySpoofs.find(s => s.address === SPOOF_FAKE);
assert('SPOOF_FAKE present as secondary spoof', !!fakeEntry);
assert('SPOOF_FAKE classified as spoof', !!fakeEntry && fakeEntry.tokenCategory === 'spoof', `got ${fakeEntry?.tokenCategory}`);
assert('SPOOF_FAKE mimics USDT', !!fakeEntry && fakeEntry.spoofMimicsToken === 'USDT', `got ${fakeEntry?.spoofMimicsToken}`);
assert('SPOOF_FAKE NOT labeled ETH (the bug)', !!fakeEntry && fakeEntry.totalReceivedToken !== 'ETH', `got ${fakeEntry?.totalReceivedToken}`);
assert('SPOOF_FAKE carries spoof contract', !!fakeEntry && fakeEntry.tokenContract === FAKE_CONTRACT, `got ${fakeEntry?.tokenContract}`);
assert('aggregate real economic loss = 11020.50 USDT', Math.abs((result.totalRealEconomicLoss['USDT'] || 0) - 11020.50) < 0.01,
  `got ${JSON.stringify(result.totalRealEconomicLoss)}`);
assert('aggregate spoof units routed = 4004.20', Math.abs((result.totalSpoofUnitsRouted['USDT-spoof'] || 0) - 4004.20) < 0.01,
  `got ${JSON.stringify(result.totalSpoofUnitsRouted)}`);
assert('legit CEX address NOT in any campaign',
  !result.campaigns.some(camp => [camp.mainCollector, ...camp.secondarySpoofs].some(e => e.address === '0x28c6c06298d514db089934071355e5743bf21d60')));

console.log();
console.log('═'.repeat(70));
console.log(`  ${pass} passed, ${fail} failed`);
console.log('═'.repeat(70));
if (fail > 0) process.exit(1);
