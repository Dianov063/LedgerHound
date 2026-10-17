import { NextRequest, NextResponse } from 'next/server';
import { getReports } from '@/lib/reports-log';
import { getReportDownloadUrl } from '@/lib/s3-storage';
import { requireAdmin } from '@/lib/admin-auth';

export async function GET(req: NextRequest) {
  const denied = await requireAdmin(req);
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
    console.error('[admin/reports]', err);
    return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 });
  }
}
