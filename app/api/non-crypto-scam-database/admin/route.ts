import { NextRequest } from 'next/server';
import {
  getNonCryptoAdminSnapshot,
  markNonCryptoIdentityStaffReviewed,
  updatePaymentSafetyCorrectionStatus,
  updateNonCryptoReportStatus,
  type NonCryptoScamReport,
  type PaymentSafetyCorrectionStatus,
} from '@/lib/non-crypto-scam-db';
import { requireAdmin } from '@/lib/admin-auth';
import { sendPaymentCorrectionResolution } from '@/lib/payment-safety-emails';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  try {
    const snapshot = await getNonCryptoAdminSnapshot();
    return Response.json(snapshot);
  } catch (err: any) {
    console.error('[non-crypto-scam-database/admin GET]', err);
    return Response.json({ error: err.message || 'Failed to load admin data' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

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

    if (body.action === 'updateCorrectionStatus') {
      const correction = await updatePaymentSafetyCorrectionStatus(
        String(body.correctionId || ''),
        body.status as PaymentSafetyCorrectionStatus,
        typeof body.resolutionNote === 'string' ? body.resolutionNote : undefined,
      );
      if (['resolved', 'rejected'].includes(correction.status)) {
        sendPaymentCorrectionResolution(correction).catch((emailError) =>
          console.error('[payment-safety correction resolution email]', emailError),
        );
      }
      return Response.json({ correction });
    }

    return Response.json({ error: 'Unknown admin action' }, { status: 400 });
  } catch (err: any) {
    console.error('[non-crypto-scam-database/admin POST]', err);
    return Response.json({ error: err.message || 'Admin action failed' }, { status: 500 });
  }
}
