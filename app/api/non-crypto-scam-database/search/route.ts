import { NextRequest } from 'next/server';
import {
  getPublicPaymentIdentityIndex,
  searchPaymentIdentity,
  type PaymentRail,
} from '@/lib/non-crypto-scam-db';
import { checkRateLimit } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const VALID_RAILS: PaymentRail[] = [
  'zelle',
  'cashapp',
  'venmo',
  'paypal',
  'wise',
  'revolut',
  'iban',
  'bank_account',
  'phone',
  'email',
  'social_handle',
  'marketplace_profile',
  'other',
];

export async function GET(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
    const rl = await checkRateLimit(ip, { name: 'non-crypto-scam-search', limit: 60, windowSec: 3600 });
    if (!rl.success) {
      return Response.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    const { searchParams } = new URL(req.url);
    const rail = searchParams.get('rail') as PaymentRail | null;
    const paymentIdentifier = searchParams.get('paymentIdentifier') || '';
    const country = searchParams.get('country') || undefined;

    if (!rail && !paymentIdentifier) {
      const publicIdentities = await getPublicPaymentIdentityIndex();
      return Response.json({ identities: publicIdentities, total: publicIdentities.length });
    }

    if (!rail || !VALID_RAILS.includes(rail)) {
      return Response.json({ error: `Invalid payment rail. Must be one of: ${VALID_RAILS.join(', ')}` }, { status: 400 });
    }
    if (!paymentIdentifier.trim()) {
      return Response.json({ error: 'Payment identifier is required.' }, { status: 400 });
    }

    const match = await searchPaymentIdentity({ country, rail, paymentIdentifier });
    const publicMatch = match?.publicEligible ? match : null;
    return Response.json({
      matched: !!publicMatch,
      identity: publicMatch,
      publicWarning: publicMatch,
    });
  } catch (err: any) {
    console.error('[non-crypto-scam-database/search]', err);
    return Response.json({ error: err.message || 'Search failed' }, { status: 500 });
  }
}
