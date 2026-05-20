/**
 * Manually curated list of known phishing/scam wallets.
 *
 * Each entry MUST have:
 *   1. An external source (Etherscan Fake_Phishing#### tag, OFAC SDN entry,
 *      Chainabuse community report, court filing, etc.)
 *   2. A verifiedAt date (when we last confirmed the source)
 *   3. Free-text notes describing the case for audit purposes
 *
 * This list is INDEPENDENT of `lib/scam-db-verified-seed.ts` which stores
 * full platform records (with addresses + URLs + total losses). Use THIS
 * file for address-level phishing flags that don't fit a single "platform"
 * pattern — e.g., individual Etherscan-flagged wallets seen in case work.
 *
 * 2026-05-20: Initial entries from case LH-MPD8HYCY (DZHLWK FINTECH LTD
 * forensic investigation). Verified manually against Etherscan public pages.
 *
 * To add a new entry: confirm the Etherscan tag (or other source) is
 * actually live and update verifiedAt. Never add unverified addresses.
 */

export interface KnownPhishingEntry {
  address: string;
  etherscanTag?: string;          // e.g. "Fake_Phishing2243661"
  source: 'etherscan_manual' | 'community_report' | 'ofac' | 'ledgerhound_research';
  verifiedAt: string;             // ISO YYYY-MM-DD
  notes?: string;
  relatedPlatformSlug?: string;   // links to lib/scam-db-verified-seed.ts
}

const KNOWN_PHISHING: Record<string, KnownPhishingEntry> = {
  // ─── DZHLWK FINTECH LTD case (LH-MPD8HYCY) ───
  // 4 wallets in the cluster carrying official Etherscan Fake_Phishing tags.
  // Verified by direct lookup on etherscan.io/address/<addr> on 2026-05-20.
  '0x073acba9caa50d332666a0eb361a47ad1d66609f': {
    address: '0x073acba9caa50d332666a0eb361a47ad1d66609f',
    etherscanTag: 'Fake_Phishing2243661',
    source: 'etherscan_manual',
    verifiedAt: '2026-05-20',
    notes: 'Vanity-prefixed address in DZHLWK address-poisoning cluster (prefix 0x073a... suffix ...609f). Mimics legitimate DZHLWK collection wallet 0x073a4abb... — used in dust attacks to misdirect victim outflows.',
    relatedPlatformSlug: 'dzhlwk-fintech',
  },
  '0x30aee28326c556eb970b7848eb5de9790af8614a': {
    address: '0x30aee28326c556eb970b7848eb5de9790af8614a',
    etherscanTag: 'Fake_Phishing2790596',
    source: 'etherscan_manual',
    verifiedAt: '2026-05-20',
    notes: 'Connected wallet in DZHLWK fraud network.',
    relatedPlatformSlug: 'dzhlwk-fintech',
  },
  '0x4f06aa4a022d5a98c22614d36202614d362214d3': {
    address: '0x4f06aa4a022d5a98c22614d36202614d362214d3',
    etherscanTag: 'Fake_Phishing2895536',
    source: 'etherscan_manual',
    verifiedAt: '2026-05-20',
    notes: 'Connected wallet in DZHLWK fraud network.',
    relatedPlatformSlug: 'dzhlwk-fintech',
  },
  '0x4f068587311bb84352c351e4a36204c351e4a362': {
    address: '0x4f068587311bb84352c351e4a36204c351e4a362',
    etherscanTag: 'Fake_Phishing3070255',
    source: 'etherscan_manual',
    verifiedAt: '2026-05-20',
    notes: 'Connected wallet in DZHLWK fraud network.',
    relatedPlatformSlug: 'dzhlwk-fintech',
  },
};

/* ─── API helpers ──────────────────────────────────────────────────── */

export function isKnownPhishing(address: string): boolean {
  if (!address) return false;
  return !!KNOWN_PHISHING[address.toLowerCase()];
}

export function getPhishingEntry(address: string): KnownPhishingEntry | undefined {
  if (!address) return undefined;
  return KNOWN_PHISHING[address.toLowerCase()];
}

/** Returns the Etherscan tag (e.g., "Fake_Phishing2243661") if any. */
export function getPhishingTag(address: string): string | undefined {
  return getPhishingEntry(address)?.etherscanTag;
}

/** All known phishing addresses — used for batch screening. */
export function getAllKnownPhishingAddresses(): string[] {
  return Object.keys(KNOWN_PHISHING);
}

/** Number of currently tracked entries (for stats/health checks). */
export function getKnownPhishingCount(): number {
  return Object.keys(KNOWN_PHISHING).length;
}
