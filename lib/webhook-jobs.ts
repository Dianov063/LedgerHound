import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command, HeadObjectCommand } from '@aws-sdk/client-s3';

/**
 * Durable record of a paid checkout that still needs its report / pack.
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
/** Jobs older than this are parked in failed/ instead of being retried. */
export const EXPIRE_MS = 48 * 60 * 60 * 1000;

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
 *  - 'check-claim': never started; resume only if this deployment won the
 *    payment lock (otherwise Stripe is still retrying the delivery).
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

export async function getJob(eventId: string): Promise<WebhookJob | null> {
  try {
    const r = await getS3().send(new GetObjectCommand({ Bucket: bucket(), Key: `${PENDING_PREFIX}${eventId}.json` }));
    const text = await r.Body?.transformToString();
    return text ? (JSON.parse(text) as WebhookJob) : null;
  } catch (err) {
    if (isStatus(err, [404], ['NoSuchKey'])) return null;
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

export async function listPendingJobs(): Promise<WebhookJob[]> {
  const jobs: WebhookJob[] = [];
  let token: string | undefined;
  do {
    const r = await getS3().send(new ListObjectsV2Command({ Bucket: bucket(), Prefix: PENDING_PREFIX, ContinuationToken: token }));
    for (const o of r.Contents ?? []) {
      const id = o.Key?.slice(PENDING_PREFIX.length).replace(/\.json$/, '');
      if (!id) continue;
      const job = await getJob(id);
      if (job) jobs.push(job);
    }
    token = r.IsTruncated ? r.NextContinuationToken : undefined;
  } while (token);
  return jobs;
}

export async function paymentLockExists(paymentId: string): Promise<boolean> {
  if (!paymentId) return false;
  try {
    await getS3().send(new HeadObjectCommand({ Bucket: bucket(), Key: `${PAYMENT_LOCK_PREFIX}${paymentId}` }));
    return true;
  } catch (err) {
    if (isStatus(err, [404], ['NotFound', 'NoSuchKey'])) return false;
    throw err;
  }
}
