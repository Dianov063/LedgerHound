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
  // Empty until reviewed entries are approved.
  //
  // Two kinds of entry — both REQUIRE a sources[] chain:
  //
  // (A) SOURCE-LISTED (regulator warning / OFAC / Etherscan). No victim reports of
  //     our own → victims:0, totalLoss:0. The public page frames it as a factual
  //     restatement of the source, never "reported by 0 victims". For clone-firm
  //     warnings, set clonesLegitimate — the impersonated legit firm must NEVER be
  //     presented as the scam.
  //
  //   {
  //     slug: 'crypto-trade-365',
  //     name: 'Crypto-Trade 365',
  //     urls: ['<fraudulent domain from the FCA warning>'],
  //     types: ['fake_exchange'],
  //     reportIds: [], totalLoss: 0, lossCurrency: 'USD', victims: 0,
  //     addresses: [],
  //     verified: true, trustScore: 90, staffVerified: true, blockchainVerifiedCount: 0,
  //     firstReported: '<FCA warning date>', lastReported: '<FCA warning date>',
  //     sources: [{
  //       type: 'regulator_warning', authority: 'FCA (UK)',
  //       url: 'https://www.fca.org.uk/news/warnings/crypto-trade-365-clone-fca-authorised-firm',
  //       date: '<from the FCA page>',
  //       clonesLegitimate: '<the FCA-authorised firm being cloned>',
  //       note: 'Clone of an FCA-authorised firm; not authorised to operate in the UK.',
  //     }],
  //   },
  //
  // (B) FORENSIC/VICTIM-REPORTED (our own case, e.g. DZHLWK). Real on-chain
  //     evidence + Etherscan tag; victims/totalLoss come from the actual case.

  // ── Batch 1: FCA clone-firm warnings (verified against fca.org.uk primary
  //    pages, 2026-06-29). Source-listed entries: victims/totalLoss = 0 by
  //    design — the page restates the regulator's warning, not victim reports. ──
  {
    slug: 'crypto-trade-365',
    name: 'Crypto-Trade 365',
    urls: ['crypto-trade365.com'],
    types: ['fake_exchange'],
    reportIds: [],
    totalLoss: 0,
    lossCurrency: 'USD',
    victims: 0,
    addresses: [],
    verified: true,
    trustScore: 90,
    staffVerified: true,
    blockchainVerifiedCount: 0,
    firstReported: '2022-04-25',
    lastReported: '2022-04-25',
    sources: [{
      type: 'regulator_warning',
      authority: 'FCA (UK)',
      reference: 'Clone of FRN 507958',
      url: 'https://www.fca.org.uk/news/warnings/crypto-trade-365-clone-fca-authorised-firm',
      date: '2022-04-25',
      clonesLegitimate: 'Rational Foreign Exchange Limited (FRN 507958)',
      note: 'FCA warning: clone firm impersonating an FCA-authorised firm; not authorised to operate in the UK. Fraudulent site: crypto-trade365.com.',
    }],
  },
  {
    slug: 'spreadex-fx-clone',
    name: 'Spreadex FX (spreadexfx.com)',
    urls: ['spreadexfx.com'],
    types: ['fake_exchange'],
    reportIds: [],
    totalLoss: 0,
    lossCurrency: 'USD',
    victims: 0,
    addresses: [],
    verified: true,
    trustScore: 90,
    staffVerified: true,
    blockchainVerifiedCount: 0,
    firstReported: '2026-02-24',
    lastReported: '2026-02-24',
    sources: [{
      type: 'regulator_warning',
      authority: 'FCA (UK)',
      reference: 'Clone of FRN 190941',
      url: 'https://www.fca.org.uk/news/warnings/spreadex-fx-spreadfxcom-clone-fca-authorised-firm',
      date: '2026-02-24',
      clonesLegitimate: 'Spreadex Limited (FRN 190941)',
      note: 'FCA warning: clone firm impersonating an FCA-authorised firm; not authorised or registered by the FCA. Fraudulent site: spreadexfx.com.',
    }],
  },
  {
    slug: 'global-markets-ltd-clone',
    name: 'Global Markets Ltd (globalmarketsltd.org)',
    urls: ['globalmarketsltd.org', 'cabinet.globalmarketsltd.org'],
    types: ['fake_exchange'],
    reportIds: [],
    totalLoss: 0,
    lossCurrency: 'USD',
    victims: 0,
    addresses: [],
    verified: true,
    trustScore: 90,
    staffVerified: true,
    blockchainVerifiedCount: 0,
    firstReported: '2026-03-17',
    lastReported: '2026-03-17',
    sources: [{
      type: 'regulator_warning',
      authority: 'FCA (UK)',
      reference: 'Clone of FRN 124384',
      url: 'https://www.fca.org.uk/news/warnings/global-markets-ltd-clone-fca-authorised-firm',
      date: '2026-03-17',
      clonesLegitimate: 'Citigroup Global Markets Limited (FRN 124384)',
      note: 'FCA warning: clone firm impersonating an FCA-authorised firm; not authorised or registered by the FCA. Fraudulent sites: globalmarketsltd.org, cabinet.globalmarketsltd.org.',
    }],
  },
];
