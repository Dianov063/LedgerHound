/**
 * Chainabuse API integration — community scam-report lookup.
 *
 * Endpoint:  GET https://api.chainabuse.com/v0/reports?address=<addr>
 * Auth:      Basic auth (API key as username, blank password) — per
 *            https://docs.chainabuse.com/reference/reports-1
 *
 * Rate limits (per Chainabuse docs):
 *   - Standard (free) tier: 10 calls / MONTH. We treat the key as free
 *     tier and apply our own monthly counter in S3 with a buffer (8 of 10
 *     calls usable; 2 reserved for emergencies / clock skew).
 *   - Per-call result cap: 50 reports.
 *
 * 2026-05-20: Phase 1 federation.
 * 2026-05-20 hotfix: S3 monthly counter + smart-skip gating
 *   (lib/labels/chainabuse.ts: getMonthlyUsage, incrementUsage,
 *    shouldQueryChainabuse).
 */

import type { AddressLabel, LabelCategory } from './types';
import type { KnownEntity } from '../known-entities';
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';

const ENDPOINT = 'https://api.chainabuse.com/v0/reports';
const TIMEOUT_MS = 8000;

function buildAuthHeader(apiKey: string): string {
  // Basic Auth: base64("<key>:") — empty password is conventional for
  // API-key-as-username schemes.
  const encoded = Buffer.from(`${apiKey}:`).toString('base64');
  return `Basic ${encoded}`;
}

function mapChainabuseCategory(cat: string | undefined): LabelCategory {
  if (!cat) return 'scam';
  const lower = cat.toLowerCase();
  if (lower.includes('phishing')) return 'phishing';
  if (lower.includes('sanction')) return 'sanctions';
  if (lower.includes('mixer') || lower.includes('tumbler')) return 'mixer';
  return 'scam';
}

function mostCommon<T>(arr: T[]): T | undefined {
  if (arr.length === 0) return undefined;
  const counts = new Map<T, number>();
  for (const item of arr) counts.set(item, (counts.get(item) || 0) + 1);
  let max = 0;
  let result: T | undefined;
  for (const entry of Array.from(counts.entries())) {
    if (entry[1] > max) {
      max = entry[1];
      result = entry[0];
    }
  }
  return result;
}

/**
 * Query Chainabuse for community reports on a single address.
 * Returns null on any failure or when no reports exist.
 */
export async function queryChainabuse(address: string): Promise<AddressLabel | null> {
  const apiKey = process.env.CHAINABUSE_API_KEY;
  if (!apiKey) {
    // Not an error — federation is meant to degrade gracefully without keys.
    return null;
  }

  const url = `${ENDPOINT}?address=${encodeURIComponent(address)}&perPage=50`;

  let res: Response;
  try {
    res = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: buildAuthHeader(apiKey),
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (e: any) {
    const isTimeout = e?.name === 'TimeoutError' || e?.name === 'AbortError';
    console.warn(`[chainabuse] ${isTimeout ? 'timeout' : 'fetch error'} for ${address}: ${e?.message}`);
    return null;
  }

  if (res.status === 404) return null; // no reports
  if (res.status === 401 || res.status === 403) {
    console.warn(`[chainabuse] auth failure ${res.status} — check CHAINABUSE_API_KEY`);
    return null;
  }
  if (res.status === 429) {
    console.warn('[chainabuse] rate limit (429) — consider Partner tier');
    return null;
  }
  if (!res.ok) {
    console.warn(`[chainabuse] HTTP ${res.status} for ${address}`);
    return null;
  }

  let data: any;
  try {
    data = await res.json();
  } catch (e: any) {
    console.warn(`[chainabuse] JSON parse failure for ${address}: ${e?.message}`);
    return null;
  }

  // Chainabuse response shape: { reports: [...], pagination: {...} } OR a
  // flat array. Be defensive.
  const reports: any[] = Array.isArray(data?.reports)
    ? data.reports
    : Array.isArray(data?.items)
      ? data.items
      : Array.isArray(data)
        ? data
        : [];

  if (reports.length === 0) return null;

  const categories = reports.map((r) => r?.scamCategory || r?.category).filter(Boolean) as string[];
  const primary = mostCommon(categories);
  const category = mapChainabuseCategory(primary);

  // Confidence scales with report count, capped at 0.95.
  const confidence = Math.min(0.95, 0.5 + reports.length * 0.05);

  return {
    source: 'chainabuse',
    tag: `${reports.length} community report${reports.length > 1 ? 's' : ''} — ${primary || 'scam'}`,
    category,
    confidence,
    reportCount: reports.length,
    url: `https://www.chainabuse.com/address/${address}`,
    verifiedAt: new Date().toISOString().split('T')[0],
  };
}

/* ─── Monthly usage tracking (free tier = 10 calls / month) ─────────────
 *
 * Stored in S3 at `chainabuse-usage/<YYYY-MM>.json`. Read-modify-write is
 * acceptable here because:
 *   - Volume is tiny (max ~10 writes per month per key)
 *   - Worst-case race: two concurrent reports both read calls=7 and write
 *     calls=8 — we lose one count. The 8/10 soft cap absorbs this.
 *
 * Auto-reset: when reading, if the stored `month` doesn't match the current
 * YYYY-MM we treat it as a fresh counter for the new month.
 * ────────────────────────────────────────────────────────────────────── */

const USAGE_PREFIX = 'chainabuse-usage';
/** Hard limit (10) with a 2-call safety buffer — we stop ourselves at 8. */
export const CHAINABUSE_MONTHLY_CAP = 10;
export const CHAINABUSE_USABLE_CAP = 8;

export interface ChainabuseMonthlyUsage {
  /** "YYYY-MM" for the calendar month this counter belongs to. */
  month: string;
  /** Calls used so far this month. */
  calls_used: number;
  /** The hard quota (for context — informational). */
  calls_limit: number;
  /** ISO timestamp of the most recent successful billable call, or null. */
  last_call_at: string | null;
}

function currentMonth(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

function getUsageS3(): S3Client {
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

function keyForMonth(month: string): string {
  return `${USAGE_PREFIX}/${month}.json`;
}

function freshUsage(month: string): ChainabuseMonthlyUsage {
  return { month, calls_used: 0, calls_limit: CHAINABUSE_MONTHLY_CAP, last_call_at: null };
}

/**
 * Read the current month's usage from S3. Returns a fresh (zeroed) counter
 * when the file is missing, the bucket is unset, or the stored `month`
 * doesn't match (auto-reset on month rollover).
 *
 * Failures are best-effort — if S3 is unreachable we return a fresh counter
 * so the federation isn't blocked.
 */
export async function getMonthlyUsage(): Promise<ChainabuseMonthlyUsage> {
  const month = currentMonth();
  const bucket = process.env.AWS_S3_BUCKET;
  if (!bucket) return freshUsage(month);

  try {
    const res = await getUsageS3().send(new GetObjectCommand({ Bucket: bucket, Key: keyForMonth(month) }));
    const body = await streamToString(res.Body);
    const parsed = JSON.parse(body) as ChainabuseMonthlyUsage;
    // Sanity: if the file is from a different month (e.g. a stale clone),
    // treat as fresh. Auto-reset.
    if (parsed.month !== month) return freshUsage(month);
    return {
      month: parsed.month,
      calls_used: Number(parsed.calls_used) || 0,
      calls_limit: Number(parsed.calls_limit) || CHAINABUSE_MONTHLY_CAP,
      last_call_at: parsed.last_call_at || null,
    };
  } catch (e: any) {
    if (e?.name === 'NoSuchKey' || e?.Code === 'NoSuchKey') return freshUsage(month);
    console.warn('[chainabuse-usage] read failed:', e?.message || e);
    return freshUsage(month);
  }
}

/**
 * Increment the monthly counter. Writes a fresh counter on month rollover.
 * Best-effort — write failures are logged but do not throw.
 */
export async function incrementUsage(): Promise<ChainabuseMonthlyUsage> {
  const current = await getMonthlyUsage();
  const next: ChainabuseMonthlyUsage = {
    month: current.month,
    calls_used: current.calls_used + 1,
    calls_limit: current.calls_limit,
    last_call_at: new Date().toISOString(),
  };

  const bucket = process.env.AWS_S3_BUCKET;
  if (!bucket) return next;

  try {
    await getUsageS3().send(new PutObjectCommand({
      Bucket: bucket,
      Key: keyForMonth(next.month),
      Body: JSON.stringify(next, null, 2),
      ContentType: 'application/json',
      ServerSideEncryption: 'aws:kms',
    }));
  } catch (e: any) {
    console.warn('[chainabuse-usage] write failed:', e?.message || e);
  }
  return next;
}

/* ─── Smart-skip decision gate ──────────────────────────────────────────
 *
 * Free tier is 10 calls/month. We only spend a call when:
 *   1. We have remaining quota (calls_used < CHAINABUSE_USABLE_CAP = 8).
 *   2. No other source has already labelled the address as risky/known —
 *      if KNOWN_ENTITIES says it's a CEX/mixer/sanctions entry, or
 *      KNOWN_PHISHING/scam-db/OFAC already flagged it, Chainabuse can't
 *      add new information worth spending quota on.
 *   3. The address is therefore "unknown but worth checking" —
 *      potentially a community-flagged scam not yet in our local data.
 * ────────────────────────────────────────────────────────────────────── */

export type ChainabuseSkipReason =
  | 'rate_limit_reached'
  | 'no_api_key'
  | 'cex_whitelisted'
  | 'mixer_known'
  | 'sanctions_known'
  | 'known_phishing'
  | 'scam_db_match'
  | 'ofac_match'
  | 'not_skipped';

export interface ChainabuseSkipInput {
  address: string;
  knownEntity: KnownEntity | null | undefined;
  isKnownPhishing: boolean;
  scamDbMatch: unknown | null;
  ofacMatch: AddressLabel | null;
  monthlyCallsUsed: number;
  hasApiKey: boolean;
}

export interface ChainabuseSkipDecision {
  shouldQuery: boolean;
  reason: ChainabuseSkipReason;
}

export function shouldQueryChainabuse(input: ChainabuseSkipInput): ChainabuseSkipDecision {
  if (!input.hasApiKey) return { shouldQuery: false, reason: 'no_api_key' };
  if (input.monthlyCallsUsed >= CHAINABUSE_USABLE_CAP) {
    return { shouldQuery: false, reason: 'rate_limit_reached' };
  }
  const e = input.knownEntity;
  if (e?.type === 'exchange') return { shouldQuery: false, reason: 'cex_whitelisted' };
  if (e?.type === 'mixer') return { shouldQuery: false, reason: 'mixer_known' };
  if (e?.type === 'sanctioned') return { shouldQuery: false, reason: 'sanctions_known' };
  if (input.isKnownPhishing) return { shouldQuery: false, reason: 'known_phishing' };
  if (input.scamDbMatch) return { shouldQuery: false, reason: 'scam_db_match' };
  if (input.ofacMatch) return { shouldQuery: false, reason: 'ofac_match' };
  return { shouldQuery: true, reason: 'not_skipped' };
}
