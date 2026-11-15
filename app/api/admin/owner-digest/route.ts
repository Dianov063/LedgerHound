import { NextRequest } from 'next/server';
import { requireCronOrAdmin } from '@/lib/admin-auth';
import { ALREADY_RUNNING, withRunLock } from '@/lib/run-lock';
import { EmailNotSentError, sendEmail } from '@/lib/idempotent-email';
import { createOwnerDigestRecord, listAllReportsStrict, markOwnerDigestDelivered, readOwnerDigestRecord } from '@/lib/scam-db';
import { DigestNotDeliveredError, digestConfigFromEnv, runOwnerDigest, type DigestRecord, type DigestStore } from '@/lib/owner-digest';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const maxDuration = 120;

const store: DigestStore = {
  listReportsStrict: listAllReportsStrict,
  readRecord: (day) => readOwnerDigestRecord<DigestRecord>(day),
  createRecord: (day, record) => createOwnerDigestRecord(day, record),
  markDelivered: (day, result, at) => markOwnerDigestDelivered(day, result, at),
};

/**
 * Daily owner digest of the scam database. The cron runner calls it every 15 minutes when
 * OWNER_DIGEST_SCHEDULE=on in cron.env; the digest of day D is due from 09:00 America/New_York
 * on D+1 and retried by every run until it is accepted by the provider (or 08:59 on D+2).
 * Sends nothing unless OWNER_DIGEST_ENABLED=true and OWNER_DIGEST_TO is set.
 * `?dryRun=1` returns the counts without sending (admin or cron auth).
 */
async function handle(req: NextRequest): Promise<Response> {
  const dryRun = new URL(req.url).searchParams.get('dryRun') === '1';
  let config;
  try {
    config = digestConfigFromEnv();
  } catch (error) {
    console.error('[owner-digest] configuration', error instanceof Error ? error.message : error);
    return Response.json({ status: 'error', code: 'config' }, { status: 500 });
  }
  try {
    const result = await runOwnerDigest({ now: new Date(), config, store, send: sendEmail, dryRun });
    return Response.json(result);
  } catch (error) {
    if (error instanceof EmailNotSentError) {
      console.error('[owner-digest] send failed', error.code);
      return Response.json({ status: 'error', code: 'send_failed', reason: error.code }, { status: 502 });
    }
    if (error instanceof DigestNotDeliveredError) {
      // e.g. recipient suppressed or log-only transport: not delivered, not recorded, retried.
      console.error('[owner-digest] not accepted by the provider', error.result);
      return Response.json({ status: 'error', code: 'not_delivered', reason: error.result }, { status: 502 });
    }
    // Storage could not be read completely (or the delivery record could not be read/written):
    // no digest of zeros is sent and nothing is marked as delivered.
    console.error('[owner-digest] storage', error instanceof Error ? error.message : error);
    return Response.json({ status: 'error', code: 'storage_unavailable' }, { status: 503 });
  }
}

export async function GET(req: NextRequest) {
  const denied = await requireCronOrAdmin(req);
  if (denied) return denied;
  return (await withRunLock('owner-digest', () => handle(req))) ?? ALREADY_RUNNING();
}
