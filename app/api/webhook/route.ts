import Stripe from 'stripe';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { generateReport } from '@/lib/generateReport';
import { generateEmergencyPack } from '@/lib/generateEmergencyPack';

const getS3 = () =>
  new S3Client({
    region: process.env.AWS_REGION || 'eu-central-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  });

const s3Bucket = () => process.env.AWS_S3_BUCKET!;

async function loadCaseData(caseId: string): Promise<Record<string, any> | null> {
  try {
    const resp = await getS3().send(
      new GetObjectCommand({
        Bucket: s3Bucket(),
        Key: `emergency-cases/${caseId}.json`,
      }),
    );
    const body = await resp.Body?.transformToString();
    return body ? JSON.parse(body) : null;
  } catch (err: any) {
    console.error('[webhook] Failed to load case data from S3:', err.message);
    return null;
  }
}

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
        const saved = await loadCaseData(caseId);

        const country = saved?.country || session.metadata?.country || 'US';
        const scamType = saved?.scamType || session.metadata?.scamType || '';
        const platformName = saved?.platformName || session.metadata?.platformName || '';
        const description = saved?.description || '';
        const txid = saved?.txid || session.metadata?.txid || '';
        const txDate = saved?.txDate || '';
        const detectedNetwork = saved?.detectedNetwork || session.metadata?.network || 'eth';
        const contactMethod = saved?.contactMethod || '';
        const userLossAmount = saved?.lossAmount
          ? parseFloat(String(saved.lossAmount))
          : session.metadata?.lossAmount
            ? parseFloat(session.metadata.lossAmount)
            : NaN;
        const lossAmount = !isNaN(userLossAmount) ? userLossAmount : (session.amount_total || 7900) / 100;

        console.log('[webhook] Generating Emergency Pack — case:', caseId, 'country:', country, 'lossAmount:', lossAmount);

        // 1. Generate Forensic Report FIRST to get enrichment data
        let enrichment: any = {};
        if (walletAddress) {
          try {
            const paymentId = session.payment_intent || session.id || '';
            const reportResult = await generateReport(walletAddress, email, {
              stripePaymentId: paymentId,
              amount: session.amount_total || 7900,
              network: detectedNetwork,
            });
            console.log('[webhook] Forensic Report generated, caseId:', reportResult.caseId);

            // Extract enrichment data for legal pack
            const exchanges = (reportResult.identifiedEntities || []).filter((e: any) => e.type === 'exchange');
            enrichment = {
              forensicCaseId: reportResult.caseId,
              riskScore: reportResult.riskScore,
              recoveryScore: reportResult.recoveryScore,
              recoveryLabel: reportResult.recoveryLabel,
              identifiedExchanges: exchanges.map((e: any) => ({
                name: e.label,
                address: e.address,
              })),
              mixerDetected: (reportResult.identifiedEntities || []).some((e: any) => e.type === 'mixer'),
              ofacWarning: reportResult.ofacWarning,
              hops: reportResult.graphData?.nodes?.length || 0,
              keyFindings: reportResult.keyFindings || [],
            };
          } catch (err) {
            console.error('[webhook] Forensic Report failed, continuing with legal pack:', err);
          }
        }

        // 2. Generate Emergency Pack with enrichment
        const packResult = await generateEmergencyPack({
          caseId,
          countryCode: country,
          email,
          victimName: session.customer_details?.name || '',
          lossAmount,
          scamType,
          walletAddress: walletAddress || '',
          txHashes: txid ? [txid] : [],
          description,
          txDate,
          platformName,
          network: detectedNetwork,
          contactMethod,
          enrichment,
        });
        console.log('[webhook] Emergency Pack generated:', packResult.templates?.length, 'templates');

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
