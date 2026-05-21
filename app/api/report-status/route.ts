import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getReports } from '@/lib/reports-log';
import { getReportDownloadUrl } from '@/lib/s3-storage';
import logger from '@/lib/logger';

const getStripe = (): any => {
  // @ts-expect-error Stripe types mismatch with ESM default import
  return new Stripe(process.env.STRIPE_SECRET_KEY!);
};

/**
 * GET /api/report-status?session_id=cs_...
 *
 * Looks up a completed Stripe checkout session, extracts the payment intent,
 * then searches the reports log for a report generated for THIS specific
 * payment. Match is by stripePaymentId ONLY — never by wallet+email+network,
 * which would return stale reports from previous purchases of the same wallet.
 */
export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get('session_id');

  if (!sessionId) {
    return NextResponse.json({ error: 'Missing session_id' }, { status: 400 });
  }

  try {
    const session = await getStripe().checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== 'paid') {
      return NextResponse.json({ status: 'pending', message: 'Payment not yet confirmed' });
    }

    const paymentId = session.payment_intent || session.id || '';
    const email = session.metadata?.email || session.customer_email || '';
    const walletAddress = session.metadata?.walletAddress || '';

    const reports = await getReports();
    const report = reports.find((r) => r.stripePaymentId === paymentId);

    if (!report) {
      logger.info({ paymentId, walletAddress, sessionId }, '[report-status] No report yet for this payment — still generating');
      return NextResponse.json({
        status: 'processing',
        message: 'Report is being generated. This usually takes 30-60 seconds.',
        email,
        walletAddress,
      });
    }

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
    logger.error({ err: err.message, sessionId }, '[report-status] Error');
    return NextResponse.json({ error: err.message || 'Failed to check status' }, { status: 500 });
  }
}
