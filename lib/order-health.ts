import { S3Client, GetObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { FAILED_PREFIX, MANUAL_REVIEW_PREFIX, PENDING_PREFIX } from '@/lib/webhook-jobs';

/**
 * Health of paid orders, separate from the container's /api/health.
 *
 * - Counts only: no event ids, emails or case data, so it is safe to expose.
 * - A failed read of a queue is reported as null ("unknown"), never as 0, and
 *   makes the overall status 'unknown'.
 * - It never affects /api/health: a stuck or parked order must not make a
 *   healthy container unhealthy (Docker would restart it in a loop, and a
 *   restart cannot fix an order).
 *
 * Who watches it (until external alerts are connected): the cron container
 * calls the recovery sweep every 5 minutes; the sweep returns this summary and
 * the cron runner logs `"result":"attention"` with the counts whenever the
 * status is not 'ok' (docker logs ledgerhound-cron). The release and
 * observation checklists read /api/health/orders. An external monitor can
 * poll the same URL for `"status":"ok"` once one is chosen.
 */

/** A pending job older than this is late: normal retries finish well before it. */
export const PENDING_ATTENTION_MS = 60 * 60 * 1000;
const CACHE_MS = 60 * 1000;
/** Above this many pending records their ages are not read one by one; the age is then unknown. */
const MAX_AGE_READS = 100;

export interface OrderHealth {
  status: 'ok' | 'attention' | 'unknown';
  pending: number | null;
  /** Age of the oldest pending ORDER (from its first job record), not of its last retry. */
  oldestPendingAgeSeconds: number | null;
  failed: number | null;
  manualReview: number | null;
  checkedAt: string;
}

const getS3 = () =>
  new S3Client({
    region: process.env.AWS_REGION || 'eu-central-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  });
const bucket = () => process.env.AWS_S3_BUCKET!;

/** Keys of one queue. Throws on any error. */
async function listQueue(prefix: string): Promise<string[]> {
  const keys: string[] = [];
  let token: string | undefined;
  do {
    const r = await getS3().send(new ListObjectsV2Command({ Bucket: bucket(), Prefix: prefix, ContinuationToken: token }));
    for (const o of r.Contents ?? []) if (o.Key && o.Key !== prefix) keys.push(o.Key);
    token = r.IsTruncated ? r.NextContinuationToken : undefined;
  } while (token);
  return keys;
}

/**
 * When the order behind a pending record started: originalCreatedAt (kept
 * across manual re-runs) or the first record's createdAt. Retries and
 * acquisitions rewrite the record but never these fields, so a late order
 * cannot look new. Throws when the record or its time cannot be read.
 */
async function orderStartOf(key: string): Promise<number> {
  const r = await getS3().send(new GetObjectCommand({ Bucket: bucket(), Key: key }));
  const job = JSON.parse((await r.Body?.transformToString()) || '') as { originalCreatedAt?: string; createdAt?: string };
  const t = Date.parse(job.originalCreatedAt || job.createdAt || '');
  if (!Number.isFinite(t)) throw new Error('pending record without a valid creation time');
  return t;
}

/** Age (s) of the oldest pending order; null when any record cannot be read (never 0 by default). */
async function oldestPendingAge(keys: string[], now: number): Promise<number | null> {
  if (keys.length === 0) return 0;
  if (keys.length > MAX_AGE_READS) return null;
  try {
    const starts = await Promise.all(keys.map(orderStartOf));
    return Math.max(0, Math.round((now - Math.min(...starts)) / 1000));
  } catch {
    return null;
  }
}

const settled = <T,>(p: Promise<T>) => p.then((v) => v, () => null);

export async function readOrderHealth(now = Date.now()): Promise<OrderHealth> {
  const [pendingKeys, failedKeys, manualKeys] = await Promise.all([
    settled(listQueue(PENDING_PREFIX)),
    settled(listQueue(FAILED_PREFIX)),
    settled(listQueue(MANUAL_REVIEW_PREFIX)),
  ]);
  const oldestPendingAgeSeconds = pendingKeys === null ? null : await oldestPendingAge(pendingKeys, now);
  const pending = pendingKeys && { count: pendingKeys.length };
  const failed = failedKeys && { count: failedKeys.length };
  const manual = manualKeys && { count: manualKeys.length };
  const known = pending !== null && failed !== null && manual !== null && oldestPendingAgeSeconds !== null;
  const attention = (failed?.count ?? 0) > 0 || (manual?.count ?? 0) > 0
    || (oldestPendingAgeSeconds ?? 0) * 1000 > PENDING_ATTENTION_MS;
  return {
    status: attention ? 'attention' : known ? 'ok' : 'unknown',
    pending: pending?.count ?? null,
    oldestPendingAgeSeconds,
    failed: failed?.count ?? null,
    manualReview: manual?.count ?? null,
    checkedAt: new Date(now).toISOString(),
  };
}

let cached: { at: number; value: Promise<OrderHealth> } | null = null;

/** readOrderHealth() shared for a minute, so a public endpoint cannot multiply S3 list calls. */
export function getOrderHealth(now = Date.now()): Promise<OrderHealth> {
  if (!cached || now - cached.at > CACHE_MS) cached = { at: now, value: readOrderHealth(now) };
  return cached.value;
}

export function __resetOrderHealthCacheForTests(): void {
  cached = null;
}
