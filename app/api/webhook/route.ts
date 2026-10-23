export const maxDuration = 120; // Vercel: waitUntil keeps the function alive while a report generates (30-60s)

import Stripe from 'stripe';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { isDraining, runInBackground } from '@/lib/background-tasks';
import { acquireJob, claimPaymentFor, deleteJob, jobFromEvent, saveJob } from '@/lib/webhook-jobs';
import { startJobInBackground } from '@/lib/webhook-job-runner';
import logger from '@/lib/logger';

const getS3 = () =>
  new S3Client({
    region: process.env.AWS_REGION || 'eu-central-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  });

const s3Bucket = () => process.env.AWS_S3_BUCKET!;

const IDEMPOTENCY_PREFIX = 'webhook-events/';

/**
 * Atomic idempotency: try to claim the event using S3 conditional write.
 * IfNoneMatch: '*' ensures only the FIRST writer succeeds.
 * Returns true if we successfully claimed the event (proceed with processing).
 * Returns false if someone else already claimed it (skip).
 */
async function claimEvent(eventId: string): Promise<boolean> {
  try {
    await getS3().send(new PutObjectCommand({
      Bucket: s3Bucket(),
      Key: `${IDEMPOTENCY_PREFIX}${eventId}`,
      Body: JSON.stringify({ claimedAt: new Date().toISOString() }),
      ContentType: 'application/json',
      ServerSideEncryption: 'aws:kms',
      IfNoneMatch: '*', // ATOMIC: fails with 412 if object already exists
    }));
    logger.info({ eventId }, '[webhook] Event claimed for processing');
    return true;
  } catch (err: unknown) {
    const statusCode = (err as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode;
    const errName = (err as { name?: string }).name;
    if (statusCode === 412 || errName === 'PreconditionFailed' || errName === 'ConditionalCheckFailed') {
      logger.info({ eventId }, '[webhook] Event already claimed — skipping (Stripe retry or race)');
      return false;
    }
    // Unexpected S3 error — log but allow processing (better one duplicate than zero)
    logger.error({ err, eventId }, '[webhook] S3 claimEvent failed unexpectedly — proceeding anyway');
    return true;
  }
}

/**
 * Log every incoming webhook event to S3 for debugging.
 * Non-blocking — fire and forget.
 */
async function logWebhookEvent(event: { id: string; type: string; data?: { object?: Record<string, unknown> } }): Promise<void> {
  try {
    const ts = new Date().toISOString();
    const session = event.data?.object as Record<string, unknown> | undefined;
    await getS3().send(new PutObjectCommand({
      Bucket: s3Bucket(),
      Key: `webhook-debug/${ts.slice(0, 10)}/${event.id}-${Date.now()}.json`,
      Body: JSON.stringify({
        receivedAt: ts,
        eventId: event.id,
        eventType: event.type,
        paymentIntent: session?.payment_intent || null,
        sessionId: session?.id || null,
        metadata: session?.metadata || null,
        amountTotal: session?.amount_total || null,
      }, null, 2),
      ContentType: 'application/json',
    }));
  } catch {
    // Non-critical — don't fail the webhook
  }
}

const getStripe = () => {
  // @ts-expect-error Stripe types mismatch with ESM default import
  return new Stripe(process.env.STRIPE_SECRET_KEY!);
};

/* GET /api/webhook — minimal health check */
export async function GET() {
  return Response.json({ status: 'ok' });
}

/**
 * POST /api/webhook — Stripe webhook handler.
 *
 * Architecture:
 * 1. Verify Stripe signature
 * 2. Log event for debugging (non-blocking)
 * 3. checkout.session.completed: write a durable job record FIRST
 *    (webhook-jobs/pending/<eventId>.json). Failing that, answer 500 so
 *    Stripe redelivers; nothing has been claimed yet.
 * 4. Claim event atomically via S3 conditional write (prevents race conditions)
 * 5. Payment ownership: the payment lock records the owning event; another
 *    event for the same payment is a duplicate and its job record is removed.
 *    Then the right to run is taken by an atomic CAS on the job record
 *    (acquireJob); a sweep or another delivery racing us cannot also run it.
 * 6. Return 200 IMMEDIATELY to Stripe (prevents retries)
 * 7. Generate in the background, tracked for graceful shutdown. The job
 *    record is removed on success; if the process dies first, the recovery
 *    sweep (/api/admin/resume-webhook-jobs) resumes it.
 */
export async function POST(request: Request) {
  logger.info('[webhook] POST received');

  if (isDraining()) {
    // Shutting down: do not start new work in a process that is about to exit.
    // Stripe redelivers on non-2xx, to the next process.
    return Response.json({ error: 'Shutting down, retry later' }, { status: 503 });
  }

  const rawBody = await request.text();
  const sig = request.headers.get('stripe-signature');

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    logger.error('[webhook] STRIPE_WEBHOOK_SECRET is not set');
    return Response.json({ error: 'Webhook secret not configured' }, { status: 500 });
  }

  if (!sig) {
    logger.error('[webhook] Missing stripe-signature header');
    return Response.json({ error: 'Missing signature' }, { status: 400 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let event: any;

  try {
    event = getStripe().webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err: unknown) {
    logger.error({ err }, '[webhook] Signature verification failed');
    return Response.json({ error: 'Invalid signature' }, { status: 400 });
  }

  logger.info({ type: event.type, eventId: event.id }, '[webhook] Event verified');

  // ── Debug: log every event to S3 ──
  runInBackground(logWebhookEvent(event));

  if (event.type !== 'checkout.session.completed') {
    // Nothing to generate; keep the event-level idempotency record as before.
    await claimEvent(event.id);
    return Response.json({ received: true });
  }

  // ── Durable job record before any lock is taken ──
  const job = jobFromEvent(event);
  let created: 'created' | 'exists';
  try {
    created = await saveJob(job);
  } catch (err) {
    logger.error({ err, eventId: event.id }, '[webhook] Could not persist job; asking Stripe to retry');
    return Response.json({ error: 'Temporary failure' }, { status: 500 });
  }

  const dropDuplicate = async () => {
    if (created === 'created') {
      try { await deleteJob(job.eventId); } catch (err) {
        logger.warn({ err, eventId: job.eventId }, '[webhook] Could not remove duplicate job record');
      }
    }
  };

  // ── LAYER 1: Atomic event-level idempotency ──
  const claimed = await claimEvent(event.id);
  if (!claimed && created === 'created') {
    // The event was handled before and its job is gone (finished or parked in
    // failed/), so the record we just created is a stray duplicate.
    await dropDuplicate();
    return Response.json({ received: true });
  }
  // Either we claimed the event, or this redelivers an event whose job is
  // still pending (an earlier delivery took the event lock and may have died
  // before the payment lock). In both cases the atomic payment lock decides
  // who runs it.

  // ── LAYER 2: Payment-level deduplication ──
  // The payment lock records which event owns the payment. A different event
  // for the same payment is a duplicate. Owning it is not the right to run.
  const session = event.data.object;
  const paymentId = session.payment_intent || session.id || '';
  let owner: 'owner' | 'other';
  try {
    owner = await claimPaymentFor(paymentId, event.id, 'webhook');
  } catch (err) {
    logger.error({ err, eventId: event.id }, '[webhook] Could not verify payment ownership; asking Stripe to retry');
    return Response.json({ error: 'Temporary failure' }, { status: 500 });
  }
  if (owner === 'other') {
    logger.warn({ eventId: event.id, paymentId }, '[webhook] Payment owned by another event; duplicate dropped');
    await dropDuplicate();
    return Response.json({ received: true });
  }

  // ── LAYER 3: the right to run this attempt (atomic CAS on the job record) ──
  // A sweep or another delivery may be racing us for the same job; exactly
  // one acquire succeeds. Losing means someone else runs (or ran) it.
  let acquired;
  try {
    acquired = await acquireJob(job.eventId);
  } catch (err) {
    logger.error({ err, eventId: event.id }, '[webhook] Could not acquire job; asking Stripe to retry');
    return Response.json({ error: 'Temporary failure' }, { status: 500 });
  }
  if (!acquired) {
    logger.info({ eventId: event.id }, '[webhook] Job already running or finished elsewhere');
    return Response.json({ received: true });
  }
  if (created === 'exists') {
    logger.info({ eventId: event.id }, '[webhook] Resuming job written by an earlier delivery');
  }

  // ── Return 200 immediately, process in background ──
  startJobInBackground(acquired);
  return Response.json({ received: true });
}
