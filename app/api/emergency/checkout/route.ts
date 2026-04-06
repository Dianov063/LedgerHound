import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const getStripe = () => {
  // @ts-expect-error Stripe types mismatch with ESM default import
  return new Stripe(process.env.STRIPE_SECRET_KEY!);
};

/* ── Rate limiter: 5/hour per IP ── */
const rateLimit = new Map<string, { count: number; reset: number }>();

/* ── Product definitions ── */
const PRODUCTS = {
  emergency_pack: {
    name: 'Emergency Preservation Pack',
    description: 'Police report, preservation letters, chain of custody evidence',
    unit_amount: 7900,
  },
  summary_report: {
    name: 'Victim Summary Report',
    description: 'Evidence package for local police filing',
    unit_amount: 1900,
  },
} as const;

type ProductKey = keyof typeof PRODUCTS;

export async function POST(req: NextRequest) {
  try {
    /* ── Rate limiting ── */
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
    const now = Date.now();
    const entry = rateLimit.get(ip);
    if (entry && entry.reset > now) {
      if (entry.count >= 5) {
        return NextResponse.json(
          { error: 'Rate limit exceeded. Try again later.' },
          { status: 429 },
        );
      }
      entry.count++;
    } else {
      rateLimit.set(ip, { count: 1, reset: now + 3600000 });
    }

    /* ── Parse body ── */
    const {
      product,
      caseId,
      email,
      country,
      walletAddress,
      network,
      platformName,
      scamType,
      route,
    } = await req.json();

    /* ── Validate product ── */
    if (!product || !(product in PRODUCTS)) {
      return NextResponse.json(
        { error: `Invalid product. Must be one of: ${Object.keys(PRODUCTS).join(', ')}` },
        { status: 400 },
      );
    }

    if (!caseId) {
      return NextResponse.json({ error: 'Missing caseId' }, { status: 400 });
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }

    const productDef = PRODUCTS[product as ProductKey];

    /* ── Create Stripe checkout session ── */
    const session = await getStripe().checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: productDef.name,
              description: productDef.description,
            },
            unit_amount: productDef.unit_amount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      metadata: {
        caseId,
        product,
        email,
        country: country || '',
        walletAddress: walletAddress || '',
        network: network || '',
        platformName: platformName || '',
        scamType: scamType || '',
        route: route || '',
      },
      customer_email: email,
      success_url: `${req.nextUrl.origin}/emergency/success?session_id={CHECKOUT_SESSION_ID}&case_id=${encodeURIComponent(caseId)}&product=${encodeURIComponent(product)}`,
      cancel_url: `${req.nextUrl.origin}/emergency`,
    });

    console.log(`[emergency/checkout] Session created: ${session.id} for case ${caseId}, product ${product}`);

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error('[emergency/checkout] Error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to create checkout session' },
      { status: 500 },
    );
  }
}
