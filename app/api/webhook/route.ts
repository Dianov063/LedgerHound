import Stripe from 'stripe';
import { generateReport } from '@/lib/generateReport';
import { generateEmergencyPack } from '@/lib/generateEmergencyPack';

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
    const product = session.metadata?.product || 'forensic_report';
    const walletAddress = session.metadata?.walletAddress;
    const email = session.metadata?.email;
    const network = session.metadata?.network || 'eth';
    const caseId = session.metadata?.caseId || '';

    console.log('[webhook] Checkout completed — product:', product, 'wallet:', walletAddress, 'email:', email);

    if (!email) {
      console.error('[webhook] Missing email in metadata');
      return Response.json({ received: true });
    }

    try {
      if (product === 'emergency_pack') {
        /* ── Emergency Pack: 4 legal PDFs + Forensic Report ── */
        const country = session.metadata?.country || 'US';
        const scamType = session.metadata?.scamType || '';
        const platformName = session.metadata?.platformName || '';

        console.log('[webhook] Generating Emergency Pack — case:', caseId, 'country:', country);

        // 1. Generate 4 legal PDFs (police complaint, preservation letter, regulator complaint, action guide)
        const packResult = await generateEmergencyPack({
          caseId,
          countryCode: country,
          email,
          victimName: session.customer_details?.name || '',
          lossAmount: (session.amount_total || 7900) / 100,
          scamType,
          walletAddress: walletAddress || '',
          txHashes: [],
          description: '',
        });
        console.log('[webhook] Emergency Pack generated:', packResult.templates?.length, 'templates');

        // 2. Also generate Forensic Report if wallet address provided
        if (walletAddress) {
          const paymentId = session.payment_intent || session.id || '';
          const reportResult = await generateReport(walletAddress, email, {
            stripePaymentId: paymentId,
            amount: session.amount_total || 7900,
            network,
          });
          console.log('[webhook] Forensic Report also generated, caseId:', reportResult.caseId);
        }

      } else if (product === 'summary_report') {
        /* ── Summary Report: just the Forensic Report ── */
        if (walletAddress) {
          const paymentId = session.payment_intent || session.id || '';
          const result = await generateReport(walletAddress, email, {
            stripePaymentId: paymentId,
            amount: session.amount_total || 1900,
            network,
          });
          console.log('[webhook] Summary Report generated, caseId:', result.caseId);
        } else {
          console.error('[webhook] Summary Report: missing walletAddress');
        }

      } else {
        /* ── Default: Forensic Report ($49) ── */
        if (walletAddress) {
          const paymentId = session.payment_intent || session.id || '';
          const result = await generateReport(walletAddress, email, {
            stripePaymentId: paymentId,
            amount: session.amount_total || 4900,
            network,
          });
          console.log('[webhook] Forensic Report generated, caseId:', result.caseId);
        } else {
          console.error('[webhook] Missing walletAddress for forensic report');
        }
      }
    } catch (err) {
      console.error('[webhook] Generation failed for product:', product, err);
    }
  }

  return Response.json({ received: true });
}
