import { NextRequest, NextResponse } from 'next/server';
import { getReports } from '@/lib/reports-log';
import { getReportDownloadUrl } from '@/lib/s3-storage';

/* ── Admin auth rate limiting: 5 attempts/min per IP ── */
const authRateLimit = new Map<string, { count: number; reset: number }>();
setInterval(() => { const now = Date.now(); Array.from(authRateLimit.entries()).forEach(([k, v]) => { if (v.reset <= now) authRateLimit.delete(k); }); }, 60000);

function checkAdmin(req: NextRequest): NextResponse | null {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
  const now = Date.now();
  const entry = authRateLimit.get(ip);
  if (entry && entry.reset > now) {
    if (entry.count >= 5) {
      return NextResponse.json({ error: 'Too many auth attempts. Try again later.' }, { status: 429 });
    }
    entry.count++;
  } else {
    authRateLimit.set(ip, { count: 1, reset: now + 60000 });
  }

  const authHeader = req.headers.get('x-admin-key');
  if (!authHeader || authHeader !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return null;
}

export async function GET(req: NextRequest) {
  const denied = checkAdmin(req);
  if (denied) return denied;

  try {
    const reports = await getReports();

    // Generate fresh download URLs for each report
    const settled = await Promise.allSettled(
      reports.map(async (r) => {
        let freshUrl = r.downloadUrl;
        try {
          freshUrl = await getReportDownloadUrl(r.caseId);
        } catch {
          // If report was deleted from S3, keep the old URL
        }
        return { ...r, downloadUrl: freshUrl };
      }),
    );
    const failedUrls = settled.filter(r => r.status === 'rejected');
    if (failedUrls.length > 0) {
      console.warn(`[admin/reports] ${failedUrls.length}/${settled.length} download URL refreshes failed`);
    }
    const enriched = settled
      .filter((r): r is PromiseFulfilledResult<typeof reports[number] & { downloadUrl: string }> => r.status === 'fulfilled')
      .map(r => r.value);

    // Sort newest first
    enriched.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({ reports: enriched, total: enriched.length });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch reports' }, { status: 500 });
  }
}
