import { NextRequest, NextResponse } from 'next/server';
import { getReports } from '@/lib/reports-log';
import { getReportDownloadUrl } from '@/lib/s3-storage';

export async function GET(req: NextRequest) {
  const password = req.nextUrl.searchParams.get('password');
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword || password !== adminPassword) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const reports = await getReports();

    // Generate fresh download URLs for each report
    const enriched = await Promise.all(
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

    // Sort newest first
    enriched.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({ reports: enriched, total: enriched.length });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch reports' }, { status: 500 });
  }
}
