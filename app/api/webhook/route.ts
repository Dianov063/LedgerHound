import Stripe from 'stripe';
import { generateReport } from '@/lib/generateReport';

const getStripe = (): any => {
  // @ts-expect-error Stripe types mismatch with ESM default import
  return new Stripe(process.env.STRIPE_SECRET_KEY!);
};

/* GET /api/webhook — health check to verify the route is reachable */
export async function GET() {
  return Response.json({
    status: 'ok',
    hasSecret: !!process.env.STRIPE_WEBHOOK_SECRET,
    hasStripeKey: !!process.env.STRIPE_SECRET_KEY,
  });
}

export async function POST(request: Request) {
  console.log('[webhook] POST received');

  const rawBody = await request.text();
  const sig = request.headers.get('stripe-signature');

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.error('[webhook] STRIPE_WEBHOOK_SECRET is not set — add it to Vercel env vars');
    return Response.json({ error: 'Webhook secret not configured' }, { status: 500 });
  }

  if (!sig) {
    console.error('[webhook] Missing stripe-signature header');
    return Response.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event: any;

  try {
    event = getStripe().webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err: any) {
    console.error('[webhook] Signature verification failed:', err.message);
    return Response.json({ error: 'Invalid signature' }, { status: 400 });
  }

  console.log('[webhook] Event verified:', event.type, event.id);

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const walletAddress = session.metadata?.walletAddress;
    const email = session.metadata?.email;
    const network = session.metadata?.network || 'eth';

    console.log('[webhook] Checkout completed — wallet:', walletAddress, 'email:', email, 'network:', network);

    if (walletAddress && email) {
      try {
        const paymentId = session.payment_intent || session.id || '';
        const amount = session.amount_total || 4900;
        const result = await generateReport(walletAddress, email, {
          stripePaymentId: paymentId,
          amount,
          network,
        });
        console.log('[webhook] Report generated successfully, caseId:', result.caseId, 'downloadUrl:', result.downloadUrl ? 'yes' : 'no');
      } catch (err) {
        console.error('[webhook] Report generation failed:', err);
      }
    } else {
      console.error('[webhook] Missing metadata — walletAddress or email is empty');
    }
  }

  return Response.json({ received: true });
}
