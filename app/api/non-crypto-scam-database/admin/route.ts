import { NextRequest } from 'next/server';
import {
  getNonCryptoAdminSnapshot,
  markNonCryptoIdentityStaffReviewed,
  updateNonCryptoReportStatus,
  type NonCryptoScamReport,
} from '@/lib/non-crypto-scam-db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function unauthorized() {
  return Response.json({ error: 'Unauthorized' }, { status: 401 });
}

function checkAdmin(req: NextRequest): boolean {
  const key = req.headers.get('x-admin-key');
  return !!process.env.ADMIN_PASSWORD && key === process.env.ADMIN_PASSWORD;
}

export async function GET(req: NextRequest) {
  if (!checkAdmin(req)) return unauthorized();

  try {
    const snapshot = await getNonCryptoAdminSnapshot();
    return Response.json(snapshot);
  } catch (err: any) {
    console.error('[non-crypto-scam-database/admin GET]', err);
    return Response.json({ error: err.message || 'Failed to load admin data' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!checkAdmin(req)) return unauthorized();

  try {
    const body = await req.json();
    if (body.action === 'updateReportStatus') {
      const status = body.status as NonCryptoScamReport['status'];
      const report = await updateNonCryptoReportStatus(String(body.reportId || ''), status);
      return Response.json({ report });
    }

    if (body.action === 'staffReviewIdentity') {
      const identity = await markNonCryptoIdentityStaffReviewed(String(body.identityHash || ''));
      return Response.json({ identity });
    }

    return Response.json({ error: 'Unknown admin action' }, { status: 400 });
  } catch (err: any) {
    console.error('[non-crypto-scam-database/admin POST]', err);
    return Response.json({ error: err.message || 'Admin action failed' }, { status: 500 });
  }
}
