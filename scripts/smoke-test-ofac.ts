/**
 * Smoke test: verify OFAC module reads from S3 and finds known entries.
 * One-shot, not committed long-term.
 *
 * Run: npx tsx scripts/smoke-test-ofac.ts
 */
import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: path.join(process.cwd(), '.env.local') });
dotenv.config({ path: path.join(process.cwd(), '.env.production.local') });

import { checkOfac, loadOfacList } from '../lib/labels/ofac';

const TEST_ADDRESSES = [
  // Ronin exploiter 2 (Lazarus Group) — confirmed in github mirror's ETH list
  '0x098b716b8aaf21512996dc57eb0615e2383e2f96',
  // Tornado Cash 0.1 ETH pool — DELISTED Nov 2024 (Van Loon ruling). Expect NULL.
  '0x12d66f87a04a9e220c9d5078b7961664a758ad11',
  // Binance hot wallet — NOT sanctioned, expect null
  '0x28c6c06298d514db089934071355e5743bf21d60',
  // DZHLWK Fake_Phishing — NOT on OFAC, expect null
  '0x073acba9caa50d332666a0eb361a47ad1d66609f',
];

async function main() {
  const list = await loadOfacList();
  console.log(`Loaded ${list.size} OFAC entries from S3`);
  console.log();

  for (const addr of TEST_ADDRESSES) {
    const label = await checkOfac(addr);
    if (label) {
      console.log(`✓ ${addr}`);
      console.log(`    source: ${label.source}, category: ${label.category}, conf: ${label.confidence}`);
      console.log(`    tag: ${label.tag}`);
      console.log(`    verifiedAt: ${label.verifiedAt}`);
    } else {
      console.log(`✗ ${addr}  (no match)`);
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
