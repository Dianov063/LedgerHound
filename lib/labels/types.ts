/**
 * Address Labels Federation — shared types.
 *
 * The federation queries multiple sources for risk/identity signals on a
 * single blockchain address and returns a unified, cached response.
 *
 * Sources:
 *   - etherscan_manual   — lib/known-phishing.ts (curated Fake_Phishing tags)
 *   - chainabuse         — community reports via Chainabuse API (rate-limited)
 *   - goplus             — GoPlus Security risk flags (free public API)
 *   - ofac               — US Treasury OFAC SDN list (cached in S3)
 *   - ledgerhound_scam_db — our S3-stored scam database (lib/scam-db.ts)
 *   - cex_whitelist      — KNOWN_ENTITIES exchange entries
 *   - known_entity       — KNOWN_ENTITIES non-exchange (DeFi, contracts, …)
 *   - known_phishing     — alias for etherscan_manual via lib/known-phishing.ts
 *
 * 2026-05-20: Created as part of Phase 1 federation layer.
 */

export type LabelSource =
  | 'etherscan_manual'
  | 'chainabuse'
  | 'goplus'
  | 'ofac'
  | 'ledgerhound_scam_db'
  | 'cex_whitelist'
  | 'known_entity'
  | 'known_phishing';

export type LabelCategory =
  | 'phishing'
  | 'scam'
  | 'sanctions'
  | 'mixer'
  | 'cex'
  | 'defi'
  | 'contract'
  | 'unknown';

export interface AddressLabel {
  source: LabelSource;
  /** Human-readable tag, e.g. "Fake_Phishing2243661", "Binance 14 (Hot Wallet)". */
  tag: string;
  category: LabelCategory;
  /** 0-1. Higher = more decisive. Government/explicit sources = 1.0, community-aggregated = 0.5-0.9. */
  confidence: number;
  /** Optional: number of community reports backing this label (Chainabuse). */
  reportCount?: number;
  /** Optional: ISO date when the label was last verified by us or its source. */
  verifiedAt?: string;
  /** Optional: link to the source page for verification by the user. */
  url?: string;
  /** Optional: free-text notes (entity name from OFAC, sanction program, etc.). */
  notes?: string;
}

export interface AddressLabelResponse {
  address: string;
  network: string;
  labels: AddressLabel[];
  cached_at: string;
  ttl_days: number;
  /* ─── Aggregated quick-look flags ──────────────────────────────── */
  hasPhishingFlag: boolean;
  hasSanctionsFlag: boolean;
  hasScamFlag: boolean;
  isKycExchange: boolean;
  /** Max confidence across all labels (helps prioritise display). */
  highestConfidence: number;
  /**
   * True when at least one source (scam_db/ofac/goplus/chainabuse) was
   * unavailable during this lookup. Caller may show a footnote warning.
   */
  hadExternalSourceFailure: boolean;
  /**
   * What each queried source answered for this address (audit F9). "No label from a source" has
   * three different meanings, and only `no_match` is a negative result:
   *   no_match    the source answered and has nothing on the address;
   *   unavailable the source could not be read (timeout, HTTP error, bad answer);
   *   skipped     the source was not asked (see `reason`).
   * Absent only in a response synthesized or cached before this field existed.
   */
  sources?: Record<SourceName, SourceCheck>;
  /** Cache format; entries without the current value are ignored (see cache.ts). */
  schema?: number;
}

/** The sources the federation queries over the network or from storage. */
export type SourceName = 'scam_db' | 'ofac' | 'goplus' | 'chainabuse';
export const SOURCE_NAMES: readonly SourceName[] = ['scam_db', 'ofac', 'goplus', 'chainabuse'];

export type SourceStatus = 'match' | 'no_match' | 'unavailable' | 'skipped';

export interface SourceCheck {
  status: SourceStatus;
  /** Why the source was unavailable or skipped, e.g. 'timeout', 'http_429', 'rate_limit_reached', 'cex_whitelisted'. */
  reason?: string;
}

/** What one source lookup returns: the label on a match, and always the status. */
export interface SourceResult extends SourceCheck {
  label?: AddressLabel;
}

/** Current format of a cached federation response. */
export const LABELS_SCHEMA = 2;
