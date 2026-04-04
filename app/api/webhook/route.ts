import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { generateReport } from '@/lib/generateReport';

const getStripe = (): any => {
  // @ts-expect-error Stripe types mismatch with ESM default import
  return new Stripe(process.env.STRIPE_SECRET_KEY!);
};

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature');

  if (!sig) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event: any;

  try {
    event = getStripe().webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET || '');
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const walletAddress = session.metadata?.walletAddress;
    const email = session.metadata?.email;

    if (walletAddress && email) {
      generateReport(walletAddress, email).catch((err) => {
        console.error('Report generation failed:', err);
      });
    }
  }

  return NextResponse.json({ received: true });
}
