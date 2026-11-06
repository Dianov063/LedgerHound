import { NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { isDraining, runInBackground } from '@/lib/background-tasks';
import { readOrderHealth } from '@/lib/order-health';
import { acquireJob, listParkedJobs, requeueParkedJob } from '@/lib/webhook-jobs';
import { runJob } from '@/lib/webhook-job-runner';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const maxDuration = 300;

/**
 * Operator view and manual re-run of paid orders that were parked.
 *
 * GET  — order health plus every parked job: event, state (failed |
 *        manual-review), product, case, purchase and payment ids, reason.
 *        No email addresses or case content.
 * POST { eventId, emailChecked? } — re-runs one parked job now.
 *
 * Safe manual recovery:
 *  1. GET: read the reason of the parked job.
 *  2. Fix the cause without editing the purchase snapshot
 *     (emergency-purchases/<caseId>/<purchaseId>.json is never rewritten):
 *     - failed (temporary cause that outlasted the retries, e.g. an S3 or
 *       email outage): make sure the cause is gone;
 *     - manual-review snapshot_missing / snapshot_integrity /
 *       snapshot_reference_invalid: the data bought cannot be proven; do not
 *       re-run. Contact the customer or refund in Stripe;
 *     - manual-review legacy_*: an older link whose case changed or vanished;
 *       confirm the data with the customer, then refund or deliver by hand;
 *     - manual-review case_paid_twice: a second payment for an already
 *       delivered case; refund the duplicate payment in Stripe.
 *  3. POST to re-run only when the cause is gone. A payment already marked
 *     delivered is refused, so a re-run never sends a second delivery. The
 *     re-run restarts the attempt budget but keeps the job's
 *     emailRetryDeadline (fixed 23 h after the payment arrived): automatic
 *     attempts still stop there. Past that deadline the request is refused
 *     with the idempotency keys of every email of the purchase (forensic
 *     report and pack); check each of them in the provider log and pass
 *     `emailChecked: true` only if none was accepted. That confirmation is
 *     recorded on the job (emailChecks) and opens one new 23 h window.
 */
export async function GET(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) return denied;
  try {
    const [orders, parked] = await Promise.all([readOrderHealth(), listParkedJobs()]);
    return Response.json({ orders, parked }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (err) {
    console.error('[admin/webhook-jobs] list failed', err);
    return Response.json({ error: 'Could not read parked jobs.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) return denied;
  if (isDraining()) return Response.json({ error: 'Shutting down' }, { status: 503 });

  let body: { eventId?: unknown; emailChecked?: unknown };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const eventId = typeof body.eventId === 'string' ? body.eventId : '';
  if (!/^evt_[A-Za-z0-9]+$/.test(eventId)) return Response.json({ error: 'Invalid eventId' }, { status: 400 });

  try {
    const requeued = await requeueParkedJob(eventId, { emailChecked: body.emailChecked === true });
    if (requeued.result !== 'requeued') {
      const status = requeued.result === 'not-found' ? 404 : 409;
      return Response.json(requeued, { status });
    }
    // Start now. If the sweep or a redelivery won the race, it runs it instead.
    const acquired = await acquireJob(eventId);
    if (!acquired) return Response.json({ result: 'requeued', from: requeued.from, started: false });
    const run = runJob(acquired, { resumed: true });
    runInBackground(run, eventId);
    return Response.json({ result: 'requeued', from: requeued.from, started: true, outcome: await run });
  } catch (err) {
    console.error('[admin/webhook-jobs] re-run failed', err);
    return Response.json({ error: 'Re-run failed.' }, { status: 500 });
  }
}
