import { NextRequest } from 'next/server';
import { listAllReports, updateReportStatus, listDisputes, deleteReportAndPlatform } from '@/lib/scam-db';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const password = searchParams.get('password');

  if (password !== process.env.ADMIN_PASSWORD) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

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
  try {
    const { searchParams } = new URL(req.url);
    const password = searchParams.get('password');

    if (password !== process.env.ADMIN_PASSWORD) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { action, reportId, status, trustTier, platformSlug } = body;

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

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err: any) {
    console.error('[scam-database/admin]', err);
    return Response.json({ error: err.message || 'Failed' }, { status: 500 });
  }
}
