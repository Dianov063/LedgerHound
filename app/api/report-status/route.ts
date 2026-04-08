import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getReports } from '@/lib/reports-log';
import { getReportDownloadUrl } from '@/lib/s3-storage';

const getStripe = (): any => {
  // @ts-expect-error Stripe types mismatch with ESM default import
  return new Stripe(process.env.STRIPE_SECRET_KEY!);
};

/**
 * GET /api/report-status?session_id=cs_...
 *
 * Looks up a completed Stripe checkout session, extracts the payment intent,
 * then searches the reports log for a matching report. Returns the download URL
 * and case ID if found.
 */
export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get('session_id');

  if (!sessionId) {
    return NextResponse.json({ error: 'Missing session_id' }, { status: 400 });
  }

  try {
    // Get the Stripe session to find payment intent and metadata
    const session = await getStripe().checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== 'paid') {
      return NextResponse.json({ status: 'pending', message: 'Payment not yet confirmed' });
    }

    const paymentId = session.payment_intent || session.id || '';
    const email = session.metadata?.email || session.customer_email || '';
    const walletAddress = session.metadata?.walletAddress || '';
    const network = session.metadata?.network || 'eth';

    // Search the reports log for this payment
    // First try exact match by paymentId, then by wallet+email+network
    const reports = await getReports();
    const report = reports.find(
      (r) => r.stripePaymentId === paymentId ||
             (r.walletAddress === walletAddress && r.email === email && r.network === network),
    );

    if (!report) {
      return NextResponse.json({
        status: 'processing',
        message: 'Report is being generated. This usually takes 30-60 seconds.',
        email,
        walletAddress,
      });
    }

    // Generate a fresh presigned URL
    let downloadUrl = report.downloadUrl;
    try {
      downloadUrl = await getReportDownloadUrl(report.caseId);
    } catch {
      // Keep existing URL if refresh fails
    }

    return NextResponse.json({
      status: 'ready',
      caseId: report.caseId,
      downloadUrl,
      email,
      walletAddress,
    });
  } catch (err: any) {
    console.error('[report-status] Error:', err.message);
    return NextResponse.json({ error: err.message || 'Failed to check status' }, { status: 500 });
  }
}
