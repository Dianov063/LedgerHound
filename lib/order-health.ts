import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';
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

export interface OrderHealth {
  status: 'ok' | 'attention' | 'unknown';
  pending: number | null;
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

interface Queue { count: number; oldest: number | null }

/** Counts the records of one queue (and the oldest one's age by LastModified). Throws on any error. */
async function readQueue(prefix: string): Promise<Queue> {
  let count = 0;
  let oldest: number | null = null;
  let token: string | undefined;
  do {
    const r = await getS3().send(new ListObjectsV2Command({ Bucket: bucket(), Prefix: prefix, ContinuationToken: token }));
    for (const o of r.Contents ?? []) {
      if (!o.Key || o.Key === prefix) continue;
      count++;
      const t = o.LastModified ? new Date(o.LastModified).getTime() : NaN;
      if (Number.isFinite(t) && (oldest === null || t < oldest)) oldest = t;
    }
    token = r.IsTruncated ? r.NextContinuationToken : undefined;
  } while (token);
  return { count, oldest };
}

const settledQueue = (p: Promise<Queue>) => p.then((q) => q, () => null);

/**
 * Pending age uses the record's LastModified: it moves when an attempt starts
 * or fails, so a job that keeps being retried looks younger than its payment.
 * The sweep parks jobs older than 23 h in failed/ anyway, where they count.
 */
export async function readOrderHealth(now = Date.now()): Promise<OrderHealth> {
  const [pending, failed, manual] = await Promise.all([
    settledQueue(readQueue(PENDING_PREFIX)),
    settledQueue(readQueue(FAILED_PREFIX)),
    settledQueue(readQueue(MANUAL_REVIEW_PREFIX)),
  ]);
  const oldestPendingAgeSeconds = pending === null ? null
    : pending.oldest === null ? 0 : Math.max(0, Math.round((now - pending.oldest) / 1000));
  const known = pending !== null && failed !== null && manual !== null;
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
