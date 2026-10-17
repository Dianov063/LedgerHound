import { NextRequest } from 'next/server';
import { requireCronOrAdmin } from '@/lib/admin-auth';
import { ALREADY_RUNNING, withRunLock } from '@/lib/run-lock';
import { isDraining } from '@/lib/background-tasks';
import { resumeStaleJobs } from '@/lib/webhook-job-runner';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const maxDuration = 300;

/**
 * GET /api/admin/resume-webhook-jobs — recovery sweep for paid checkouts
 * whose report/pack generation was interrupted (see lib/webhook-jobs.ts).
 * Called every 5 minutes by the self-hosted cron runner. Returns counts only.
 */
export async function GET(req: NextRequest) {
  const denied = await requireCronOrAdmin(req);
  if (denied) return denied;
  if (isDraining()) return Response.json({ error: 'Shutting down' }, { status: 503 });

  try {
    const summary = await withRunLock('resume-webhook-jobs', () => resumeStaleJobs({ limit: 5 }));
    if (!summary) return ALREADY_RUNNING();
    return Response.json({ ok: true, ...summary, completedAt: new Date().toISOString() });
  } catch (err) {
    console.error('[resume-webhook-jobs]', err);
    return Response.json({ error: 'Sweep failed.' }, { status: 500 });
  }
}
