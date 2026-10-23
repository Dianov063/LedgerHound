import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { createReportCaseId } from '@/lib/report-delivery';

/**
 * Durable record of a paid checkout that still needs its report / pack.
 *
 * Ownership: the payment lock records which Stripe event owns the payment,
 * and the right to RUN a job is granted only by an atomic compare-and-swap on
 * the job record itself (If-Match on its ETag, pending -> running). The
 * webhook and the recovery sweep both go through acquireJob(), so whichever
 * order they race in, exactly one of them runs a given attempt.
 *
 * The Stripe webhook claims the event and the payment (S3 idempotency locks)
 * BEFORE generation starts and answers 200 immediately, so Stripe never
 * retries a claimed event. If the process dies mid-generation the work would
 * be lost for good. The job record survives the process: it is written
 * before the locks, removed on success, and picked up by the recovery sweep
 * (/api/admin/resume-webhook-jobs) when its runner has gone away.
 */

const getS3 = () =>
  new S3Client({
    region: process.env.AWS_REGION || 'eu-central-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  });

const bucket = () => process.env.AWS_S3_BUCKET!;

export const PENDING_PREFIX = 'webhook-jobs/pending/';
export const FAILED_PREFIX = 'webhook-jobs/failed/';
export const PAYMENT_LOCK_PREFIX = 'webhook-payment-locks/';

export const MAX_ATTEMPTS = 3;
/** A running job with no completion after this long has lost its runner. */
export const STALE_RUNNING_MS = 15 * 60 * 1000;
/** A claimed job that never started (runner died right after claiming). */
export const NEVER_STARTED_MS = 10 * 60 * 1000;
/** Wait between attempts of a job that failed. */
export const RETRY_BACKOFF_MS = 10 * 60 * 1000;
/**
 * Jobs older than this are parked in failed/ instead of being retried. Kept
 * inside Resend's 24 h idempotency window, so a retry can never send a
 * customer a second copy of an email an earlier attempt already sent.
 */
export const EXPIRE_MS = 23 * 60 * 60 * 1000;

/** The subset of the Stripe checkout session the processor reads. */
export interface JobSession {
  id: string;
  payment_intent: string | null;
  amount_total: number | null;
  metadata: Record<string, string>;
  customer_details: { name: string | null } | null;
}

export interface WebhookJob {
  eventId: string;
  createdAt: string;
  status: 'pending' | 'running';
  attempts: number;
  startedAt?: string;
  lastAttemptAt?: string;
  lastError?: string;
  /** Forensic report case id, fixed when the job is created so every attempt reuses it. */
  reportCaseId?: string;
  session: JobSession;
}

export function paymentIdOf(session: JobSession): string {
  return session.payment_intent || session.id || '';
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function jobFromEvent(event: any, now = new Date()): WebhookJob {
  const s = event?.data?.object ?? {};
  return {
    eventId: String(event.id),
    createdAt: now.toISOString(),
    status: 'pending',
    attempts: 0,
    reportCaseId: createReportCaseId(now.getTime()),
    session: {
      id: String(s.id ?? ''),
      payment_intent: typeof s.payment_intent === 'string' ? s.payment_intent : null,
      amount_total: typeof s.amount_total === 'number' ? s.amount_total : null,
      metadata: { ...(s.metadata ?? {}) },
      customer_details: s.customer_details ? { name: s.customer_details.name ?? null } : null,
    },
  };
}

export type JobDecision = 'skip-in-flight' | 'expire' | 'resume' | 'wait' | 'check-claim';

/**
 * What the recovery sweep should do with a pending job. Pure: no I/O.
 *  - 'check-claim': written long ago but never started. Its delivery died
 *    somewhere between writing the job and starting it (possibly between the
 *    event and the payment lock). The sweep resumes it if the payment lock is
 *    held, or if it can take the payment lock itself; the lock is atomic, so
 *    a concurrent Stripe redelivery and the sweep never both run it.
 */
export function classifyJob(job: WebhookJob, now: number, inFlight: boolean): JobDecision {
  if (inFlight) return 'skip-in-flight';
  const age = now - Date.parse(job.createdAt);
  if (!(age >= 0) || age > EXPIRE_MS) return 'expire';
  if (job.attempts >= MAX_ATTEMPTS) return 'expire';
  if (job.status === 'running') {
    const since = now - Date.parse(job.startedAt || job.createdAt);
    return since > STALE_RUNNING_MS ? 'resume' : 'wait';
  }
  if (job.attempts === 0) return age > NEVER_STARTED_MS ? 'check-claim' : 'wait';
  const sinceLast = now - Date.parse(job.lastAttemptAt || job.createdAt);
  return sinceLast > RETRY_BACKOFF_MS ? 'resume' : 'wait';
}

function isStatus(err: unknown, codes: number[], names: string[]): boolean {
  const e = err as { name?: string; $metadata?: { httpStatusCode?: number } };
  return codes.includes(e.$metadata?.httpStatusCode ?? -1) || names.includes(e.name ?? '');
}

function body(job: WebhookJob) {
  return {
    Bucket: bucket(),
    Body: JSON.stringify(job),
    ContentType: 'application/json',
    ServerSideEncryption: 'aws:kms' as const,
  };
}

/** Creates the record; 'exists' when a delivery of this event already did. */
export async function saveJob(job: WebhookJob): Promise<'created' | 'exists'> {
  try {
    await getS3().send(new PutObjectCommand({ ...body(job), Key: `${PENDING_PREFIX}${job.eventId}.json`, IfNoneMatch: '*' }));
    return 'created';
  } catch (err) {
    if (isStatus(err, [412], ['PreconditionFailed', 'ConditionalCheckFailed'])) return 'exists';
    throw err;
  }
}

export async function putJob(job: WebhookJob): Promise<void> {
  await getS3().send(new PutObjectCommand({ ...body(job), Key: `${PENDING_PREFIX}${job.eventId}.json` }));
}

export interface StoredJob {
  job: WebhookJob;
  /** ETag of the record as read; the CAS token for acquireJob(). */
  etag: string;
}

export async function getStoredJob(eventId: string): Promise<StoredJob | null> {
  try {
    const r = await getS3().send(new GetObjectCommand({ Bucket: bucket(), Key: `${PENDING_PREFIX}${eventId}.json` }));
    const text = await r.Body?.transformToString();
    return text ? { job: JSON.parse(text) as WebhookJob, etag: String(r.ETag ?? '') } : null;
  } catch (err) {
    if (isStatus(err, [404], ['NoSuchKey'])) return null;
    throw err;
  }
}

export async function getJob(eventId: string): Promise<WebhookJob | null> {
  return (await getStoredJob(eventId))?.job ?? null;
}

/** True when a new attempt may start: pending, or running with a runner that went silent. */
export function isAcquirable(job: WebhookJob, now: number): boolean {
  if (job.attempts >= MAX_ATTEMPTS) return false;
  if (job.status === 'pending') return true;
  return now - Date.parse(job.startedAt || job.createdAt) > STALE_RUNNING_MS;
}

/**
 * Atomically takes the right to run the next attempt of a job: rewrites the
 * record as running with If-Match on the ETag that was read. Concurrent
 * callers (webhook redelivery, recovery sweep, another process) race on the
 * same ETag and only one write succeeds. Returns the acquired job and its new
 * ETag, or null when the job is gone, not acquirable, or someone else won.
 *
 * `expectEtag` lets the sweep act only on the exact version it classified.
 */
export async function acquireJob(eventId: string, opts: { now?: number; expectEtag?: string } = {}): Promise<StoredJob | null> {
  const now = opts.now ?? Date.now();
  const current = await getStoredJob(eventId);
  if (!current) return null;
  if (opts.expectEtag !== undefined && current.etag !== opts.expectEtag) return null;
  if (!isAcquirable(current.job, now)) return null;

  const at = new Date(now).toISOString();
  const job: WebhookJob = {
    ...current.job,
    status: 'running',
    attempts: current.job.attempts + 1,
    startedAt: at,
    lastAttemptAt: at,
    reportCaseId: current.job.reportCaseId ?? createReportCaseId(now),
  };
  try {
    const r = await getS3().send(new PutObjectCommand({
      ...body(job),
      Key: `${PENDING_PREFIX}${eventId}.json`,
      IfMatch: current.etag,
    }));
    return { job, etag: String(r.ETag ?? '') };
  } catch (err) {
    if (isStatus(err, [412, 409], ['PreconditionFailed', 'ConditionalRequestConflict'])) return null;
    throw err;
  }
}

/**
 * Writes the job back only if this runner still owns it (If-Match). false
 * means another runner took it over (stale takeover) and this one must not
 * overwrite its state.
 */
export async function putJobIfOwned(job: WebhookJob, etag: string): Promise<boolean> {
  try {
    await getS3().send(new PutObjectCommand({ ...body(job), Key: `${PENDING_PREFIX}${job.eventId}.json`, IfMatch: etag }));
    return true;
  } catch (err) {
    if (isStatus(err, [412, 409, 404], ['PreconditionFailed', 'ConditionalRequestConflict', 'NoSuchKey'])) return false;
    throw err;
  }
}

export async function deleteJob(eventId: string): Promise<void> {
  await getS3().send(new DeleteObjectCommand({ Bucket: bucket(), Key: `${PENDING_PREFIX}${eventId}.json` }));
}

/** Parks a job for manual follow-up; it is never retried automatically. */
export async function moveToFailed(job: WebhookJob, reason: string): Promise<void> {
  await getS3().send(new PutObjectCommand({
    ...body({ ...job, lastError: reason }),
    Key: `${FAILED_PREFIX}${job.eventId}.json`,
  }));
  await deleteJob(job.eventId);
}

export async function listPendingJobs(): Promise<StoredJob[]> {
  const jobs: StoredJob[] = [];
  let token: string | undefined;
  do {
    const r = await getS3().send(new ListObjectsV2Command({ Bucket: bucket(), Prefix: PENDING_PREFIX, ContinuationToken: token }));
    for (const o of r.Contents ?? []) {
      const id = o.Key?.slice(PENDING_PREFIX.length).replace(/\.json$/, '');
      if (!id) continue;
      const stored = await getStoredJob(id);
      if (stored) jobs.push(stored);
    }
    token = r.IsTruncated ? r.NextContinuationToken : undefined;
  } while (token);
  return jobs;
}

/**
 * Takes or verifies ownership of a payment. The lock (same object the webhook
 * has always written) records the owning Stripe event id.
 *  - 'owner': this event holds the lock (just taken, or taken earlier by
 *    another delivery / the sweep acting for the same event).
 *  - 'other': a different event, or a lock written before owners were
 *    recorded, owns the payment; this event is a duplicate.
 * Owning the payment does NOT grant the right to run: that is acquireJob().
 */
export async function claimPaymentFor(paymentId: string, eventId: string, by: 'webhook' | 'recovery-sweep'): Promise<'owner' | 'other'> {
  if (!paymentId) return 'owner';
  const Key = `${PAYMENT_LOCK_PREFIX}${paymentId}`;
  try {
    await getS3().send(new PutObjectCommand({
      Bucket: bucket(),
      Key,
      Body: JSON.stringify({ claimedAt: new Date().toISOString(), eventId, by }),
      ContentType: 'application/json',
      ServerSideEncryption: 'aws:kms',
      IfNoneMatch: '*',
    }));
    return 'owner';
  } catch (err) {
    if (!isStatus(err, [412], ['PreconditionFailed', 'ConditionalCheckFailed'])) throw err;
  }
  const r = await getS3().send(new GetObjectCommand({ Bucket: bucket(), Key }));
  const lock = JSON.parse((await r.Body?.transformToString()) || '{}') as { eventId?: string };
  return lock.eventId === eventId ? 'owner' : 'other';
}
