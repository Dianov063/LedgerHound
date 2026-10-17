import { isInFlight, runInBackground } from '@/lib/background-tasks';
import { processCheckoutJob, type CheckoutOutcome } from '@/lib/checkout-processor';
import {
  MAX_ATTEMPTS,
  claimPaymentLock,
  classifyJob,
  deleteJob,
  listPendingJobs,
  moveToFailed,
  paymentIdOf,
  paymentLockExists,
  putJob,
  type WebhookJob,
} from '@/lib/webhook-jobs';
import logger from '@/lib/logger';

export type RunResult = CheckoutOutcome | 'failed';

/**
 * Runs one job: marks it running, generates, then removes it (success),
 * parks it in failed/ (invalid or out of attempts), or puts it back as
 * pending with the error for a later retry. Never throws.
 */
export async function runJob(job: WebhookJob, opts: { resumed: boolean }): Promise<RunResult> {
  const now = new Date().toISOString();
  const running: WebhookJob = {
    ...job,
    status: 'running',
    attempts: job.attempts + 1,
    startedAt: now,
    lastAttemptAt: now,
  };
  try {
    await putJob(running);
  } catch (err) {
    // The record still exists from saveJob; recovery just sees older timestamps.
    logger.warn({ err, eventId: job.eventId }, '[webhook-jobs] Could not mark job running');
  }

  try {
    const outcome = await processCheckoutJob(running, opts);
    if (outcome === 'invalid') {
      await moveToFailed(running, 'invalid checkout metadata');
      logger.error({ eventId: job.eventId }, '[webhook-jobs] Invalid checkout parked in webhook-jobs/failed/');
    } else {
      await deleteJob(running.eventId);
    }
    return outcome;
  } catch (err) {
    const reason = err instanceof Error ? err.message.slice(0, 300) : String(err).slice(0, 300);
    try {
      if (running.attempts >= MAX_ATTEMPTS) {
        await moveToFailed(running, reason);
        logger.error({ eventId: job.eventId, attempts: running.attempts }, '[webhook-jobs] Job failed permanently; manual follow-up needed (webhook-jobs/failed/)');
      } else {
        await putJob({ ...running, status: 'pending', lastError: reason });
        logger.warn({ eventId: job.eventId, attempts: running.attempts }, '[webhook-jobs] Job failed; will retry');
      }
    } catch (storeErr) {
      logger.error({ err: storeErr, eventId: job.eventId }, '[webhook-jobs] Could not record job failure');
    }
    return 'failed';
  }
}

/** Starts a job after the HTTP response, tracked for graceful shutdown. */
export function startJobInBackground(job: WebhookJob): void {
  runInBackground(runJob(job, { resumed: false }), job.eventId);
}

export interface SweepSummary {
  pending: number;
  resumed: number;
  succeeded: number;
  failed: number;
  expired: number;
  waiting: number;
  skippedInFlight: number;
}

/**
 * Recovery sweep: resumes jobs whose runner went away (crash, OOM kill,
 * container restart, deploy) and retries failed attempts after a backoff.
 * Runs jobs one at a time to keep peak memory bounded.
 */
export async function resumeStaleJobs(opts: { limit?: number; now?: number } = {}): Promise<SweepSummary> {
  const limit = opts.limit ?? 5;
  const now = opts.now ?? Date.now();
  const jobs = await listPendingJobs();
  const summary: SweepSummary = {
    pending: jobs.length, resumed: 0, succeeded: 0, failed: 0, expired: 0, waiting: 0, skippedInFlight: 0,
  };

  for (const job of jobs) {
    const decision = classifyJob(job, now, isInFlight(job.eventId));
    if (decision === 'skip-in-flight') { summary.skippedInFlight++; continue; }
    if (decision === 'wait') { summary.waiting++; continue; }
    if (decision === 'expire') {
      await moveToFailed(job, job.attempts >= MAX_ATTEMPTS ? 'out of attempts' : 'expired before completion');
      logger.error({ eventId: job.eventId }, '[webhook-jobs] Job expired; parked in webhook-jobs/failed/');
      summary.expired++;
      continue;
    }
    if (summary.resumed >= limit) { summary.waiting++; continue; }
    if (decision === 'check-claim') {
      // Its delivery died before starting it: after writing the job, after the
      // event lock, or after the payment lock. Run it if the payment lock is
      // held, or take the lock now. A Stripe redelivery racing us competes for
      // the same atomic lock, so exactly one of us runs it.
      const paymentId = paymentIdOf(job.session);
      const held = await paymentLockExists(paymentId);
      if (!held && !(await claimPaymentLock(paymentId, job.eventId))) {
        summary.waiting++;
        continue;
      }
    }

    summary.resumed++;
    const run = runJob(job, { resumed: true });
    runInBackground(run, job.eventId); // tracked so SIGTERM drains it too
    const result = await run;
    if (result === 'failed') summary.failed++;
    else summary.succeeded++;
  }
  return summary;
}
