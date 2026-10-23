import { isInFlight, runInBackground } from '@/lib/background-tasks';
import { processCheckoutJob, type CheckoutOutcome } from '@/lib/checkout-processor';
import {
  MAX_ATTEMPTS,
  acquireJob,
  claimPaymentFor,
  classifyJob,
  deleteJob,
  listPendingJobs,
  moveToFailed,
  paymentIdOf,
  putJobIfOwned,
  type StoredJob,
} from '@/lib/webhook-jobs';
import logger from '@/lib/logger';

export type RunResult = CheckoutOutcome | 'failed';

/**
 * Runs one attempt of a job that this caller has ACQUIRED (acquireJob: the
 * record is already marked running with attempts incremented). Removes the
 * job on success, parks it in failed/ (invalid or out of attempts), or puts
 * it back as pending for a later retry. Failure writes are conditional on the
 * ETag from acquiring, so a runner that was taken over cannot clobber the new
 * runner's state. Never throws.
 */
export async function runJob(acquired: StoredJob, opts: { resumed: boolean }): Promise<RunResult> {
  const { job, etag } = acquired;
  try {
    const outcome = await processCheckoutJob(job, opts);
    if (outcome === 'invalid') {
      await moveToFailed(job, 'invalid checkout metadata');
      logger.error({ eventId: job.eventId }, '[webhook-jobs] Invalid checkout parked in webhook-jobs/failed/');
    } else {
      await deleteJob(job.eventId);
    }
    return outcome;
  } catch (err) {
    const reason = err instanceof Error ? err.message.slice(0, 300) : String(err).slice(0, 300);
    try {
      if (job.attempts >= MAX_ATTEMPTS) {
        await moveToFailed(job, reason);
        logger.error({ eventId: job.eventId, attempts: job.attempts }, '[webhook-jobs] Job failed permanently; manual follow-up needed (webhook-jobs/failed/)');
      } else if (await putJobIfOwned({ ...job, status: 'pending', lastError: reason }, etag)) {
        logger.warn({ eventId: job.eventId, attempts: job.attempts }, '[webhook-jobs] Job failed; will retry');
      } else {
        logger.warn({ eventId: job.eventId }, '[webhook-jobs] Job failed after another runner took it over; leaving its state alone');
      }
    } catch (storeErr) {
      logger.error({ err: storeErr, eventId: job.eventId }, '[webhook-jobs] Could not record job failure');
    }
    return 'failed';
  }
}

/** Runs an acquired job after the HTTP response, tracked for graceful shutdown. */
export function startJobInBackground(acquired: StoredJob): void {
  runInBackground(runJob(acquired, { resumed: false }), acquired.job.eventId);
}

export interface SweepSummary {
  pending: number;
  resumed: number;
  succeeded: number;
  failed: number;
  expired: number;
  waiting: number;
  skippedInFlight: number;
  /** Lost the acquire race (another runner started it) or found it changed. */
  skippedTaken: number;
  /** Jobs whose payment is owned by a different event (duplicates), removed. */
  duplicates: number;
}

/**
 * Recovery sweep: resumes jobs whose runner went away (crash, OOM kill,
 * container restart, deploy) and retries failed attempts after a backoff.
 * Every start goes through acquireJob() on the exact version classified, so a
 * concurrent webhook redelivery and the sweep never both run an attempt.
 * Runs jobs one at a time to keep peak memory bounded.
 */
export async function resumeStaleJobs(opts: { limit?: number; now?: number } = {}): Promise<SweepSummary> {
  const limit = opts.limit ?? 5;
  const now = opts.now ?? Date.now();
  const jobs = await listPendingJobs();
  const summary: SweepSummary = {
    pending: jobs.length, resumed: 0, succeeded: 0, failed: 0, expired: 0, waiting: 0, skippedInFlight: 0, skippedTaken: 0, duplicates: 0,
  };

  for (const { job, etag } of jobs) {
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
      // Never started: its delivery died after writing the job (possibly
      // between the event and the payment lock). Make sure this event owns
      // the payment; a different event owning it means this job is a duplicate.
      if (await claimPaymentFor(paymentIdOf(job.session), job.eventId, 'recovery-sweep') === 'other') {
        await deleteJob(job.eventId);
        logger.warn({ eventId: job.eventId }, '[webhook-jobs] Payment owned by another event; duplicate job removed');
        summary.duplicates++;
        continue;
      }
    }

    const acquired = await acquireJob(job.eventId, { now, expectEtag: etag });
    if (!acquired) { summary.skippedTaken++; continue; }

    summary.resumed++;
    const run = runJob(acquired, { resumed: true });
    runInBackground(run, job.eventId); // tracked so SIGTERM drains it too
    const result = await run;
    if (result === 'failed') summary.failed++;
    else summary.succeeded++;
  }
  return summary;
}
