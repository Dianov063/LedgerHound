/**
 * OFAC SDN lookup.
 *
 * The list lives in S3 (one consolidated JSON file across all currencies) and
 * is refreshed weekly by `scripts/seed-ofac-initial.ts` (manual or cron).
 *
 * Source: github mirror `0xB10C/ofac-sanctioned-digital-currency-addresses`
 * (branch `lists`). Maintained as community-curated parse of Treasury data.
 * 2026-05-20: Phase 1 federation.
 */

import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import type { AddressLabel } from './types';

const OFAC_S3_KEY = 'ofac-sdn/crypto-addresses.json';

export interface OfacEntry {
  /** Address as stored (case preserved for non-EVM; EVM lower-cased). */
  address: string;
  /** Asset code from the source list: ETH, XBT, USDT, USDC, TRX, SOL, … */
  currency: string;
  /** Always "OFAC SDN" for entries from the github mirror. */
  source: string;
  /** Date this entry was added to our seed file (ISO). */
  added: string;
}

let ofacMap: Map<string, OfacEntry> | null = null;
let ofacLoadedAt = 0;
/** When the CONTENT of the loaded list was last refreshed (the S3 object's LastModified), or 0 if unknown. */
let ofacListAsOf = 0;
const MEM_TTL_MS = 24 * 60 * 60 * 1000; // 24h in-memory cache

/**
 * How old the list may be for "not listed" to count as a result (audit F9).
 *
 * The list is refreshed weekly (refresh-ofac, Monday 06:00 UTC). Nothing limited its age before:
 * if the refresh kept failing, or a process kept reusing the list it had loaded, an address
 * sanctioned since then was reported as not listed for as long as that lasted. 16 days allows one
 * missed weekly refresh and two days of margin. OFAC_MAX_AGE_DAYS overrides it.
 *
 * A HIT is valid from a list of any age: a listed address is listed. Only a miss needs a fresh list.
 */
export const OFAC_MAX_AGE_DAYS = 16;

function maxAgeMs(): number {
  const configured = Number(process.env.OFAC_MAX_AGE_DAYS);
  return (Number.isFinite(configured) && configured > 0 ? configured : OFAC_MAX_AGE_DAYS) * 24 * 60 * 60 * 1000;
}

/** Age of the loaded list's content in ms, or null when it is unknown (no list, or no date for it). */
export function ofacListAgeMs(now: number = Date.now()): number | null {
  return ofacMap && ofacListAsOf > 0 ? Math.max(0, now - ofacListAsOf) : null;
}

/** True when the loaded list is recent enough for a miss to mean "not listed". */
export function isOfacListFresh(now: number = Date.now()): boolean {
  const age = ofacListAgeMs(now);
  return age !== null && age <= maxAgeMs();
}

function getS3(): S3Client {
  return new S3Client({
    region: process.env.AWS_REGION || 'eu-central-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  });
}

/** The list could not be read, so an address cannot be called clear. */
export class OfacUnavailableError extends Error {
  constructor(reason: string) {
    super(`OFAC SDN list unavailable: ${reason}`);
    this.name = 'OfacUnavailableError';
  }
}

/**
 * Load the OFAC list from S3 (with 24h in-memory cache).
 *
 * Only a successful read is cached. When a reload fails, the last list that
 * did load is reused (the source changes weekly); with no list loaded yet the
 * failure is thrown as OfacUnavailableError, so callers can tell "not listed"
 * from "not checked". A missing object counts as a failure, not an empty list.
 *
 * The list's own date is kept (`ofacListAgeMs`): it is the S3 object's
 * LastModified, and does not move when a reload fails, so a reused list ages.
 * checkOfac refuses to call an address clear from a list that is too old.
 */
export async function loadOfacList(): Promise<Map<string, OfacEntry>> {
  if (ofacMap && Date.now() - ofacLoadedAt < MEM_TTL_MS) {
    return ofacMap;
  }

  let reason: string;
  const bucket = process.env.AWS_S3_BUCKET;
  if (!bucket) {
    reason = 'AWS_S3_BUCKET not set';
  } else {
    try {
      const res = await getS3().send(new GetObjectCommand({ Bucket: bucket, Key: OFAC_S3_KEY }));
      const body = await (res.Body as { transformToString(): Promise<string> }).transformToString();
      const entries: OfacEntry[] = JSON.parse(body);
      if (!Array.isArray(entries) || entries.length === 0) throw new Error('list is empty');
      // The refresh job rewrites the whole object, so its LastModified is the date of the content.
      // Without it (never the case on S3) the newest `added` date of the entries is used.
      const modified = res.LastModified instanceof Date ? res.LastModified.getTime() : NaN;
      const newestAdded = entries.reduce((max, e) => Math.max(max, Date.parse(e?.added) || 0), 0);
      const asOf = Number.isFinite(modified) ? modified : newestAdded;
      // Use lower-case lookup for EVM addresses; non-EVM keys keep their case.
      const map = new Map<string, OfacEntry>();
      for (const e of entries) {
        const key = e.address.startsWith('0x') ? e.address.toLowerCase() : e.address;
        // Only set if not already present, so first source wins (deterministic).
        if (!map.has(key)) map.set(key, e);
      }
      ofacMap = map;
      ofacLoadedAt = Date.now();
      ofacListAsOf = asOf;
      console.log(`[ofac] Loaded ${map.size} OFAC SDN entries from s3://${bucket}/${OFAC_S3_KEY}, list dated ${asOf ? new Date(asOf).toISOString() : 'unknown'}`);
      return ofacMap;
    } catch (e: any) {
      reason = e?.name === 'NoSuchKey' || e?.Code === 'NoSuchKey'
        ? `no list in S3 (${OFAC_S3_KEY}); run scripts/seed-ofac-initial.ts`
        : e?.message || String(e);
    }
  }

  if (ofacMap) {
    console.warn(`[ofac] Reload failed (${reason}); keeping the list loaded at ${new Date(ofacLoadedAt).toISOString()}`);
    return ofacMap;
  }
  console.warn(`[ofac] ${reason}`);
  throw new OfacUnavailableError(reason);
}

/**
 * Check if an address is on the OFAC SDN list. Returns an AddressLabel if so,
 * null if not listed. Throws OfacUnavailableError when the list cannot be read,
 * or when the address is not on it but the list is too old (or undated) for
 * that to mean "not listed". A hit is returned from a list of any age.
 */
export async function checkOfac(address: string): Promise<AddressLabel | null> {
  const list = await loadOfacList();
  const key = address.startsWith('0x') ? address.toLowerCase() : address;
  const entry = list.get(key);
  if (!entry) {
    if (!isOfacListFresh()) {
      const age = ofacListAgeMs();
      const reason = age === null
        ? 'the list has no date, so "not listed" cannot be confirmed'
        : `the list is ${Math.floor(age / 86_400_000)} days old (limit ${Math.round(maxAgeMs() / 86_400_000)}), so "not listed" cannot be confirmed`;
      console.warn(`[ofac] ${reason}`);
      throw new OfacUnavailableError(reason);
    }
    return null;
  }

  return {
    source: 'ofac',
    tag: `OFAC SDN (${entry.currency})`,
    category: 'sanctions',
    confidence: 1.0, // government source — max confidence
    url: 'https://sanctionssearch.ofac.treas.gov/',
    verifiedAt: entry.added,
    notes: entry.source,
  };
}

/**
 * For tests / admin: clear the in-memory cache so the next call re-reads
 * from S3.
 */
export function _clearOfacCache(): void {
  ofacMap = null;
  ofacLoadedAt = 0;
  ofacListAsOf = 0;
}
