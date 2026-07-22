import { NextRequest, NextResponse } from 'next/server';
import {
  createNonCryptoEmailVerification,
  verifyNonCryptoEmailToken,
} from '@/lib/non-crypto-scam-db';
import { sendPaymentReportVerification } from '@/lib/payment-safety-emails';
import { checkRateLimit } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token') || '';
  try {
    const result = await verifyNonCryptoEmailToken(token);
    const localePrefix = result.locale === 'en' ? '' : `/${result.locale}`;
    return NextResponse.redirect(new URL(`${localePrefix}/payment-safety?emailVerified=1&reportId=${encodeURIComponent(result.reportId)}`, req.url));
  } catch {
    return NextResponse.redirect(new URL('/payment-safety?emailVerificationError=1', req.url));
  }
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
    const rl = await checkRateLimit(ip, { name: 'non-crypto-email-verification', limit: 5, windowSec: 3600 });
    if (!rl.success) return Response.json({ error: 'Try again in 1 hour.' }, { status: 429 });

    const body = await req.json();
    const reportId = String(body.reportId || '');
    const email = String(body.email || '').trim();
    if (!reportId || !/^\S+@\S+\.\S+$/.test(email)) {
      return Response.json({ error: 'Report ID and email are required.' }, { status: 400 });
    }

    const verification = await createNonCryptoEmailVerification(reportId, email, String(body.locale || 'en'));
    await sendPaymentReportVerification({ to: email, reportId, token: verification.token });
    return Response.json({ sent: true });
  } catch (err: any) {
    console.error('[non-crypto-scam-database/verify-email POST]', err);
    return Response.json({ error: err.message === 'Email is already verified' ? err.message : 'Unable to send verification email.' }, { status: 400 });
  }
}
