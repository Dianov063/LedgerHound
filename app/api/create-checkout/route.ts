import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import logger from '@/lib/logger';

const getStripe = () => {
  // @ts-expect-error Stripe types mismatch with ESM default import
  return new Stripe(process.env.STRIPE_SECRET_KEY!);
};

const NETWORK_LABELS: Record<string, string> = {
  eth: 'Ethereum', btc: 'Bitcoin', sol: 'Solana', trx: 'TRON',
  bnb: 'BNB Chain', base: 'Base', arb: 'Arbitrum', op: 'Optimism',
  avax: 'Avalanche', linea: 'Linea', zksync: 'zkSync', scroll: 'Scroll',
  mantle: 'Mantle', polygon: 'Polygon',
};

const ADDRESS_VALIDATORS: Record<string, RegExp> = {
  eth: /^0x[a-fA-F0-9]{40}$/,
  btc: /^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,62}$/,
  sol: /^[1-9A-HJ-NP-Za-km-z]{32,44}$/,
  trx: /^T[a-zA-Z0-9]{33}$/,
  bnb: /^0x[a-fA-F0-9]{40}$/,
  base: /^0x[a-fA-F0-9]{40}$/,
  arb: /^0x[a-fA-F0-9]{40}$/,
  op: /^0x[a-fA-F0-9]{40}$/,
  avax: /^0x[a-fA-F0-9]{40}$/,
  linea: /^0x[a-fA-F0-9]{40}$/,
  zksync: /^0x[a-fA-F0-9]{40}$/,
  scroll: /^0x[a-fA-F0-9]{40}$/,
  mantle: /^0x[a-fA-F0-9]{40}$/,
  polygon: /^0x[a-fA-F0-9]{40}$/,
};

const RATE_LIMIT_WINDOW = 3600000;
const rateLimit = new Map<string, { count: number; reset: number }>();
setInterval(() => { const now = Date.now(); Array.from(rateLimit.entries()).forEach(([k, v]) => { if (v.reset <= now) rateLimit.delete(k); }); }, 600000);

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
    const now = Date.now();
    const entry = rateLimit.get(ip);
    if (entry && entry.reset > now) {
      if (entry.count >= 10) {
        return NextResponse.json({ error: 'Rate limit exceeded. Try again later.' }, { status: 429 });
      }
      entry.count++;
    } else {
      rateLimit.set(ip, { count: 1, reset: now + RATE_LIMIT_WINDOW });
    }

    const { walletAddress, email, network = 'eth' } = await req.json();

    const net = (network || 'eth').toLowerCase();
    const validator = ADDRESS_VALIDATORS[net];
    if (!validator) {
      return NextResponse.json({ error: `Unsupported network: ${net}` }, { status: 400 });
    }

    if (!walletAddress || !validator.test(walletAddress)) {
      return NextResponse.json({ error: `Invalid ${NETWORK_LABELS[net] || net} address` }, { status: 400 });
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }

    const networkLabel = NETWORK_LABELS[net] || net.toUpperCase();
    const shortAddr = `${walletAddress.slice(0, 10)}...${walletAddress.slice(-6)}`;

    const session = await getStripe().checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `LedgerHound ${networkLabel} Forensic Report`,
              description: `Automated forensic analysis for ${shortAddr} on ${networkLabel}`,
            },
            unit_amount: 4900,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      metadata: {
        walletAddress: net === 'btc' || net === 'sol' || net === 'trx'
          ? walletAddress
          : walletAddress.toLowerCase(),
        email,
        network: net,
      },
      customer_email: email,
      success_url: `${req.nextUrl.origin}/report/success?session_id={CHECKOUT_SESSION_ID}&email=${encodeURIComponent(email)}`,
      cancel_url: `${req.nextUrl.origin}/report`,
    });

    logger.info({ network: net, sessionId: session.id }, '[checkout] Session created');

    return NextResponse.json({ url: session.url });
  } catch (err: unknown) {
    logger.error({ err }, '[checkout] Error');
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed to create checkout' }, { status: 500 });
  }
}
