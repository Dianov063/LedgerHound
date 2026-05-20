import type { ScamPlatform } from './scam-db';

/**
 * VERIFIED scam platforms — manually researched and confirmed.
 *
 * EVERY entry MUST have:
 *   1. Real on-chain evidence (TXIDs, blockchain analysis)
 *   2. At least one external corroborating source:
 *        - Etherscan tag (Fake_Phishing####)
 *        - OFAC SDN listing
 *        - Chainabuse community report
 *        - DOJ / FBI press release
 *        - Court filing / law enforcement action
 *        - LedgerHound forensic case (with case ID)
 *   3. Documented research process (link to evidence in docs/scam-research/)
 *
 * Currently EMPTY (post-2026-05-20 cleanup of fabricated SEED).
 * Phase 4 will populate with DZHLWK FINTECH LTD using full evidence chain
 * from case LH-MPD8HYCY.
 *
 * NEVER add unverified data here. False positives create legal liability:
 *   - Defamation claims (e.g., labelling Binance hot wallet as Ponzi)
 *   - Loss of credibility for the entire scam-database
 *   - SEO penalty from publishing low-quality content
 *
 * To add a new platform:
 *   1. Research the platform externally (see criteria above)
 *   2. Document evidence in docs/scam-research/<slug>.md
 *   3. Add a ScamPlatform entry to the array below
 *   4. Run `npx tsx scripts/run-seed.ts` or POST to /api/scam-database/seed
 *      with admin auth
 */
export const VERIFIED_SEED_PLATFORMS: ScamPlatform[] = [
  // Empty until Phase 4 adds DZHLWK FINTECH LTD.
  //
  // Template for future entries:
  //
  // {
  //   slug: 'dzhlwk-fintech',
  //   name: 'DZHLWK FINTECH LTD',
  //   urls: ['dzhlwk.com', 'dzhlwk.net'],
  //   types: ['pig_butchering'],
  //   reportIds: ['<generate via generateId()>'],
  //   totalLoss: 625000,
  //   lossCurrency: 'USD',
  //   victims: 105,
  //   addresses: [
  //     '0x073a4abbf262d8f946866f3ce62660ee7cf4609f',  // main collector — real, verified on-chain
  //     // ... more verified addresses
  //   ],
  //   verified: true,
  //   trustScore: 95,
  //   staffVerified: true,
  //   blockchainVerifiedCount: 60,
  //   firstReported: '2025-12-26',
  //   lastReported: new Date().toISOString(),
  // },
];
