import { NextRequest } from 'next/server';
import {
  getPublicPaymentIdentityIndex,
  searchPublicPaymentIdentities,
  type PaymentRail,
} from '@/lib/non-crypto-scam-db';
import { checkRateLimit } from '@/lib/rate-limit';
import { ALL_PAYMENT_SEARCH, PAYMENT_SEARCH_RAILS, paymentSearchNeedsCountry, SEARCH_COUNTRY_REQUIRED } from '@/lib/payment-recipient-search';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const VALID_RAILS: readonly PaymentRail[] = PAYMENT_SEARCH_RAILS;

export async function GET(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
    const rl = await checkRateLimit(ip, { name: 'non-crypto-scam-search', limit: 60, windowSec: 3600 });
    if (!rl.success) {
      return Response.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    const { searchParams } = new URL(req.url);
    const railValue = searchParams.get('rail');
    const rail = railValue && railValue !== ALL_PAYMENT_SEARCH ? railValue as PaymentRail : undefined;
    const paymentIdentifier = searchParams.get('paymentIdentifier') || '';
    const countryValue = searchParams.get('country') || undefined;
    const country = countryValue?.toLowerCase() === ALL_PAYMENT_SEARCH ? undefined : countryValue;

    if (!railValue && !paymentIdentifier) {
      const publicIdentities = await getPublicPaymentIdentityIndex();
      return Response.json({ identities: publicIdentities, total: publicIdentities.length });
    }

    if (rail && !VALID_RAILS.includes(rail)) {
      return Response.json({ error: `Invalid payment rail. Must be one of: ${VALID_RAILS.join(', ')}` }, { status: 400 });
    }
    if (!paymentIdentifier.trim()) {
      return Response.json({ error: 'Payment identifier is required.' }, { status: 400 });
    }
    if (paymentIdentifier.length > 512) return Response.json({ error: 'Recipient identifier is too long.' }, { status: 400 });
    if (country && !/^(?:[a-z]{2,3}|OTHER)$/i.test(country)) {
      return Response.json({ error: 'Valid country is required.' }, { status: 400 });
    }
    if (paymentSearchNeedsCountry(country, rail, paymentIdentifier)) {
      return Response.json({ error: SEARCH_COUNTRY_REQUIRED }, { status: 400 });
    }
    const identities = await searchPublicPaymentIdentities({ country, rail, paymentIdentifier });
    const publicMatch = identities[0] || null;
    return Response.json({
      matched: identities.length > 0,
      identities,
      identity: publicMatch,
      publicWarning: publicMatch,
    });
  } catch (err: any) {
    console.error('[non-crypto-scam-database/search]', err);
    return Response.json({ error: 'Search failed' }, { status: 500 });
  }
}
