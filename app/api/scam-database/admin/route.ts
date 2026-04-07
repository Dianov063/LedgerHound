import { NextRequest } from 'next/server';
import { listAllReports, updateReportStatus, listDisputes, deleteReportAndPlatform, updateDisputeStatus, getDispute } from '@/lib/scam-db';
import { sendDisputeResolution } from '@/lib/dispute-emails';

/* ── Admin auth rate limiting: 5 attempts/min per IP ── */
const authRateLimit = new Map<string, { count: number; reset: number }>();
setInterval(() => { const now = Date.now(); Array.from(authRateLimit.entries()).forEach(([k, v]) => { if (v.reset <= now) authRateLimit.delete(k); }); }, 60000);

function checkAdmin(req: NextRequest): Response | null {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
  const now = Date.now();
  const entry = authRateLimit.get(ip);
  if (entry && entry.reset > now) {
    if (entry.count >= 5) {
      return Response.json({ error: 'Too many auth attempts. Try again later.' }, { status: 429 });
    }
    entry.count++;
  } else {
    authRateLimit.set(ip, { count: 1, reset: now + 60000 });
  }

  const authHeader = req.headers.get('x-admin-key');
  if (!authHeader || authHeader !== process.env.ADMIN_PASSWORD) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return null;
}

export async function GET(req: NextRequest) {
  const denied = checkAdmin(req);
  if (denied) return denied;

  try {
    const [reports, disputes] = await Promise.all([
      listAllReports(),
      listDisputes(),
    ]);

    return Response.json({ reports, disputes });
  } catch (err: any) {
    console.error('[scam-database/admin]', err);
    return Response.json({ error: err.message || 'Failed' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const denied = checkAdmin(req);
  if (denied) return denied;

  try {
    const body = await req.json();
    const { action, reportId, status, trustTier, platformSlug, disputeId, resolutionNote, sendEmail } = body;

    if (action === 'updateStatus') {
      if (!reportId || !status) {
        return Response.json({ error: 'Missing reportId or status' }, { status: 400 });
      }
      await updateReportStatus(reportId, status, trustTier);
      return Response.json({ success: true, message: `Report ${reportId} updated to ${status}` });
    }

    if (action === 'deleteReportAndPlatform') {
      if (!reportId || !platformSlug) {
        return Response.json({ error: 'Missing reportId or platformSlug' }, { status: 400 });
      }
      const result = await deleteReportAndPlatform(reportId, platformSlug);
      return Response.json({ success: true, ...result });
    }

    if (action === 'updateDispute') {
      if (!disputeId || !status) {
        return Response.json({ error: 'Missing disputeId or status' }, { status: 400 });
      }
      if (!['pending', 'under_review', 'resolved', 'rejected'].includes(status)) {
        return Response.json({ error: 'Invalid status' }, { status: 400 });
      }

      const updated = await updateDisputeStatus(disputeId, status, resolutionNote);
      if (!updated) {
        return Response.json({ error: 'Dispute not found' }, { status: 404 });
      }

      // Send resolution email if requested
      if (sendEmail && ['resolved', 'rejected'].includes(status) && updated.contactEmail) {
        try {
          await sendDisputeResolution(
            updated.contactEmail,
            disputeId,
            updated.platformSlug || 'unknown',
            status as 'resolved' | 'rejected',
            resolutionNote || ''
          );
        } catch (emailErr) {
          console.error('[admin] Failed to send dispute email:', emailErr);
        }
      }

      return Response.json({ success: true, dispute: updated });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err: any) {
    console.error('[scam-database/admin]', err);
    return Response.json({ error: err.message || 'Failed' }, { status: 500 });
  }
}
