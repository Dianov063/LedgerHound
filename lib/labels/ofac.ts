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
const MEM_TTL_MS = 24 * 60 * 60 * 1000; // 24h in-memory cache

function getS3(): S3Client {
  return new S3Client({
    region: process.env.AWS_REGION || 'eu-central-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  });
}

async function streamToString(stream: any): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  return Buffer.concat(chunks).toString('utf-8');
}

/**
 * Load the OFAC list from S3 (with 24h in-memory cache).
 * Returns an empty Map if the S3 object is missing — caller should treat
 * "no match" as the same as "no entry recorded" (graceful degradation).
 */
export async function loadOfacList(): Promise<Map<string, OfacEntry>> {
  if (ofacMap && Date.now() - ofacLoadedAt < MEM_TTL_MS) {
    return ofacMap;
  }

  const bucket = process.env.AWS_S3_BUCKET;
  if (!bucket) {
    console.warn('[ofac] AWS_S3_BUCKET not set — skipping OFAC list load');
    ofacMap = new Map();
    ofacLoadedAt = Date.now();
    return ofacMap;
  }

  try {
    const res = await getS3().send(new GetObjectCommand({ Bucket: bucket, Key: OFAC_S3_KEY }));
    const body = await streamToString(res.Body);
    const entries: OfacEntry[] = body ? JSON.parse(body) : [];
    // Use lower-case lookup for EVM addresses; non-EVM keys keep their case.
    const map = new Map<string, OfacEntry>();
    for (const e of entries) {
      const key = e.address.startsWith('0x') ? e.address.toLowerCase() : e.address;
      // Only set if not already present, so first source wins (deterministic).
      if (!map.has(key)) map.set(key, e);
    }
    ofacMap = map;
    ofacLoadedAt = Date.now();
    console.log(`[ofac] Loaded ${map.size} OFAC SDN entries from s3://${bucket}/${OFAC_S3_KEY}`);
    return ofacMap;
  } catch (e: any) {
    if (e?.name === 'NoSuchKey' || e?.Code === 'NoSuchKey') {
      console.warn(`[ofac] No OFAC list in S3 yet (${OFAC_S3_KEY}). Run scripts/seed-ofac-initial.ts.`);
    } else {
      console.warn('[ofac] Failed to load OFAC list:', e?.message || e);
    }
    ofacMap = new Map();
    ofacLoadedAt = Date.now();
    return ofacMap;
  }
}

/**
 * Check if an address is on the OFAC SDN list. Returns an AddressLabel if so.
 */
export async function checkOfac(address: string): Promise<AddressLabel | null> {
  const list = await loadOfacList();
  const key = address.startsWith('0x') ? address.toLowerCase() : address;
  const entry = list.get(key);
  if (!entry) return null;

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
}
