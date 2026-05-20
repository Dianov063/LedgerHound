/**
 * Smoke test: federation for the 3 spec-required addresses + a known OFAC.
 * Run: npx tsx scripts/smoke-test-federation.ts
 *
 * Expected results (without CHAINABUSE_API_KEY locally):
 *   - 0x073acba9…609f  → known_phishing label (DZHLWK Fake_Phishing2243661)
 *   - 0x098b716b…2f96  → ofac label (Ronin/Lazarus, confirmed in github mirror)
 *   - 0x28c6c062…1d60  → cex_whitelist label (Binance 14)
 *   - 0x12d66f87…ad11  → known_entity label (Tornado Cash via KNOWN_ENTITIES)
 *                       NOT ofac — delisted Nov 2024 (Van Loon ruling).
 *
 * Chainabuse calls without CHAINABUSE_API_KEY return null silently.
 * GoPlus runs unauthenticated against the public API.
 */
import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: path.join(process.cwd(), '.env.local') });
dotenv.config({ path: path.join(process.cwd(), '.env.production.local') });

import { getAddressLabels } from '../lib/labels/federation';

const TARGETS = [
  { addr: '0x073acba9caa50d332666a0eb361a47ad1d66609f', expect: 'known_phishing (DZHLWK)' },
  { addr: '0x098b716b8aaf21512996dc57eb0615e2383e2f96', expect: 'ofac (Ronin exploiter)' },
  { addr: '0x28c6c06298d514db089934071355e5743bf21d60', expect: 'cex_whitelist (Binance)' },
  { addr: '0x12d66f87a04a9e220c9d5078b7961664a758ad11', expect: 'known_entity (Tornado — delisted from OFAC)' },
];

async function main() {
  for (const { addr, expect } of TARGETS) {
    console.log('═'.repeat(70));
    console.log(`  ${addr}`);
    console.log(`  EXPECT: ${expect}`);
    console.log('═'.repeat(70));

    const res = await getAddressLabels(addr, 'eth');
    console.log(`  cached_at:               ${res.cached_at}`);
    console.log(`  total labels:            ${res.labels.length}`);
    console.log(`  highestConfidence:       ${res.highestConfidence}`);
    console.log(`  flags:`);
    console.log(`    hasPhishingFlag:       ${res.hasPhishingFlag}`);
    console.log(`    hasSanctionsFlag:      ${res.hasSanctionsFlag}`);
    console.log(`    hasScamFlag:           ${res.hasScamFlag}`);
    console.log(`    isKycExchange:         ${res.isKycExchange}`);
    console.log(`  hadExternalSourceFailure:${res.hadExternalSourceFailure}`);
    console.log();
    for (const l of res.labels) {
      console.log(`    [${l.source}] ${l.tag}`);
      console.log(`      category=${l.category}  confidence=${l.confidence}`);
      if (l.notes) console.log(`      notes: ${l.notes}`);
      if (l.url) console.log(`      url: ${l.url}`);
    }
    console.log();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
