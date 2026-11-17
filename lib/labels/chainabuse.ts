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
 *   (lib/labels/chainabuse.ts: getMonthlyUsage, shouldQueryChainabuse).
 * 2026-11-17: the slot is reserved before the call (reserveChainabuseCall).
 */

import type { AddressLabel, LabelCategory, SourceResult } from './types';
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
 *
 * The answer always says what happened (audit F9): a failed call is `unavailable`, never
 * "no reports". Before, timeout, 401/403, 429, 5xx and an unreadable body all looked exactly
 * like an address without reports.
 *   match        reports exist (with the label);
 *   no_match     Chainabuse answered and has none (404, or an empty list);
 *   unavailable  the call failed or the answer could not be understood (`reason`);
 *   skipped      no API key, so no call was made.
 */
export async function queryChainabuse(address: string): Promise<SourceResult> {
  const apiKey = process.env.CHAINABUSE_API_KEY;
  if (!apiKey) {
    // Not an error — federation is meant to degrade gracefully without keys.
    return { status: 'skipped', reason: 'no_api_key' };
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
    return { status: 'unavailable', reason: isTimeout ? 'timeout' : 'network_error' };
  }

  if (res.status === 404) return { status: 'no_match' }; // no reports
  if (res.status === 401 || res.status === 403) {
    console.warn(`[chainabuse] auth failure ${res.status} — check CHAINABUSE_API_KEY`);
    return { status: 'unavailable', reason: `http_${res.status}` };
  }
  if (res.status === 429) {
    console.warn('[chainabuse] rate limit (429) — consider Partner tier');
    return { status: 'unavailable', reason: 'http_429' };
  }
  if (!res.ok) {
    console.warn(`[chainabuse] HTTP ${res.status} for ${address}`);
    return { status: 'unavailable', reason: `http_${res.status}` };
  }

  let data: any;
  try {
    data = await res.json();
  } catch (e: any) {
    console.warn(`[chainabuse] JSON parse failure for ${address}: ${e?.message}`);
    return { status: 'unavailable', reason: 'invalid_json' };
  }

  // Chainabuse response shape: { reports: [...], pagination: {...} } OR a
  // flat array. Anything else is not an answer we can read as "no reports".
  const reports: any[] | null = Array.isArray(data?.reports)
    ? data.reports
    : Array.isArray(data?.items)
      ? data.items
      : Array.isArray(data)
        ? data
        : null;

  if (reports === null) {
    console.warn(`[chainabuse] unexpected response shape for ${address}`);
    return { status: 'unavailable', reason: 'unexpected_response' };
  }
  if (reports.length === 0) return { status: 'no_match' };

  const categories = reports.map((r) => r?.scamCategory || r?.category).filter(Boolean) as string[];
  const primary = mostCommon(categories);
  const category = mapChainabuseCategory(primary);

  // Confidence scales with report count, capped at 0.95.
  const confidence = Math.min(0.95, 0.5 + reports.length * 0.05);

  return {
    status: 'match',
    label: {
      source: 'chainabuse',
      tag: `${reports.length} community report${reports.length > 1 ? 's' : ''} — ${primary || 'scam'}`,
      category,
      confidence,
      reportCount: reports.length,
      url: `https://www.chainabuse.com/address/${address}`,
      verifiedAt: new Date().toISOString().split('T')[0],
    },
  };
}

/* ─── Monthly usage tracking (free tier = 10 calls / month) ─────────────
 *
 * Stored in S3 at `chainabuse-usage/<YYYY-MM>.json`.
 *
 * A call is made only after a slot has been RESERVED (reserveChainabuseCall): the counter is
 * raised by a conditional write (If-Match on the ETag that was read, If-None-Match for the first
 * call of a month) before the request goes out. Two lookups that read the same counter cannot
 * both take the last slot: the second write is refused and that lookup reads again. When the
 * counter cannot be read or written, no call is made. A reserved slot stays spent whatever the
 * call returns (audit F9, review of package 63).
 *
 * Before, the counter was read, the call made, and the counter written afterwards without a
 * condition: parallel lookups overspent the quota, and a failed read counted as zero calls used.
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
  /** ISO timestamp of the most recent reserved call, or null. */
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
 * Read the current month's usage from S3, for display and diagnostics only. Returns a zeroed
 * counter when the file is missing, the bucket is unset or the read fails, so it must NOT be
 * used to decide whether a call may be made: that is reserveChainabuseCall's job.
 */
export async function getMonthlyUsage(): Promise<ChainabuseMonthlyUsage> {
  const month = currentMonth();
  const bucket = process.env.AWS_S3_BUCKET;
  if (!bucket) return freshUsage(month);

  try {
    const res = await getUsageS3().send(new GetObjectCommand({ Bucket: bucket, Key: keyForMonth(month) }));
    const body = await streamToString(res.Body);
    const parsed = JSON.parse(body) as ChainabuseMonthlyUsage;
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

export type ChainabuseReservation =
  | { reserved: true; usage: ChainabuseMonthlyUsage }
  /**
   * rate_limit_reached   the month's usable calls are spent;
   * quota_check_failed   the counter could not be read, understood or written: its state is
   *                      unknown, so no call is made.
   */
  | { reserved: false; reason: 'rate_limit_reached' | 'quota_check_failed'; usage?: ChainabuseMonthlyUsage };

/**
 * Attempts to win the conditional write when other lookups reserve at the same moment. A write
 * is refused only because another reservation went through, and at most CHAINABUSE_USABLE_CAP
 * of those fit in a month: after that many refusals the next read shows the cap. The margin
 * covers conflicts S3 reports while a concurrent write is still in flight (409).
 */
const RESERVE_ATTEMPTS = CHAINABUSE_USABLE_CAP + 4;

const isMissing = (e: any): boolean =>
  e?.name === 'NoSuchKey' || e?.Code === 'NoSuchKey' || e?.$metadata?.httpStatusCode === 404;
const isWriteConflict = (e: any): boolean =>
  e?.name === 'PreconditionFailed' || e?.$metadata?.httpStatusCode === 412
  || e?.name === 'ConditionalRequestConflict' || e?.$metadata?.httpStatusCode === 409;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Reserve one Chainabuse call for the current month BEFORE making it. Returns `reserved: true`
 * only when the counter was raised by a conditional write; every other outcome means the call
 * must not be made. The slot is spent even if the call then fails.
 */
export async function reserveChainabuseCall(): Promise<ChainabuseReservation> {
  const month = currentMonth();
  const bucket = process.env.AWS_S3_BUCKET;
  const refuse = (why: string): ChainabuseReservation => {
    console.warn(`[chainabuse-usage] no call: ${why}`);
    return { reserved: false, reason: 'quota_check_failed' };
  };
  if (!bucket) return refuse('no bucket for the monthly counter');

  const s3 = getUsageS3();
  const Key = keyForMonth(month);

  for (let attempt = 1; attempt <= RESERVE_ATTEMPTS; attempt++) {
    let current = freshUsage(month);
    let etag: string | undefined;
    try {
      const res = await s3.send(new GetObjectCommand({ Bucket: bucket, Key }));
      const parsed = JSON.parse(await streamToString(res.Body));
      const used = parsed?.calls_used;
      // A counter that cannot be understood is not a counter at zero.
      if (!parsed || parsed.month !== month || typeof used !== 'number' || !Number.isInteger(used) || used < 0) {
        return refuse('the monthly counter is not readable as a counter');
      }
      if (typeof res.ETag !== 'string' || !res.ETag) return refuse('the monthly counter has no ETag');
      etag = res.ETag;
      current = {
        month,
        calls_used: used,
        calls_limit: Number(parsed.calls_limit) || CHAINABUSE_MONTHLY_CAP,
        last_call_at: parsed.last_call_at || null,
      };
    } catch (e: any) {
      if (!isMissing(e)) return refuse(`counter read failed (${e?.name || 'error'})`);
      // No file yet: the first call of the month creates it (If-None-Match below).
    }

    if (current.calls_used >= CHAINABUSE_USABLE_CAP) {
      return { reserved: false, reason: 'rate_limit_reached', usage: current };
    }

    const next: ChainabuseMonthlyUsage = {
      month,
      calls_used: current.calls_used + 1,
      calls_limit: current.calls_limit,
      last_call_at: new Date().toISOString(),
    };
    try {
      await s3.send(new PutObjectCommand({
        Bucket: bucket,
        Key,
        Body: JSON.stringify(next, null, 2),
        ContentType: 'application/json',
        ServerSideEncryption: 'aws:kms',
        ...(etag ? { IfMatch: etag } : { IfNoneMatch: '*' }),
      }));
      return { reserved: true, usage: next };
    } catch (e: any) {
      // Another lookup changed the counter between our read and write (412/409, or 404 when
      // the object was replaced): read it again. Anything else leaves the state unknown.
      if (!(isWriteConflict(e) || (etag && isMissing(e)))) return refuse(`counter write failed (${e?.name || 'error'})`);
      await sleep(Math.min(200, 5 * 2 ** attempt) * (0.5 + Math.random()));
    }
  }
  return refuse(`counter still contended after ${RESERVE_ATTEMPTS} attempts`);
}

/* ─── Smart-skip decision gate ──────────────────────────────────────────
 *
 * Free tier is 10 calls/month. We only spend a call when:
 *   1. We have remaining quota (calls_used < CHAINABUSE_USABLE_CAP = 8). The federation
 *      passes 0 here and lets reserveChainabuseCall decide: only the reservation is atomic.
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
