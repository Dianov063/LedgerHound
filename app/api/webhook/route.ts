import Stripe from 'stripe';
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { generateReport } from '@/lib/generateReport';
import { generateEmergencyPack } from '@/lib/generateEmergencyPack';
import logger from '@/lib/logger';

const getS3 = () =>
  new S3Client({
    region: process.env.AWS_REGION || 'eu-central-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  });

const s3Bucket = () => process.env.AWS_S3_BUCKET!;

const processedEvents = new Set<string>();
const IDEMPOTENCY_PREFIX = 'webhook-events/';

async function isEventProcessed(eventId: string): Promise<boolean> {
  if (processedEvents.has(eventId)) return true;
  try {
    await getS3().send(new GetObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET!,
      Key: `${IDEMPOTENCY_PREFIX}${eventId}`,
    }));
    processedEvents.add(eventId);
    return true;
  } catch {
    return false;
  }
}

async function markEventProcessed(eventId: string): Promise<void> {
  processedEvents.add(eventId);
  await getS3().send(new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET!,
    Key: `${IDEMPOTENCY_PREFIX}${eventId}`,
    Body: JSON.stringify({ processedAt: new Date().toISOString() }),
    ContentType: 'application/json',
    ServerSideEncryption: 'aws:kms',
  }));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  } catch (err: unknown) {
    logger.error({ err }, '[webhook] Failed to load case data from S3');
    return null;
  }
}

const getStripe = () => {
  // @ts-expect-error Stripe types mismatch with ESM default import
  return new Stripe(process.env.STRIPE_SECRET_KEY!);
};

/* GET /api/webhook — minimal health check */
export async function GET() {
  return Response.json({ status: 'ok' });
}

export async function POST(request: Request) {
  logger.info('[webhook] POST received');

  const rawBody = await request.text();
  const sig = request.headers.get('stripe-signature');

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    logger.error('[webhook] STRIPE_WEBHOOK_SECRET is not set — add it to Vercel env vars');
    return Response.json({ error: 'Webhook secret not configured' }, { status: 500 });
  }

  if (!sig) {
    logger.error('[webhook] Missing stripe-signature header');
    return Response.json({ error: 'Missing signature' }, { status: 400 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let event: any;

  try {
    event = getStripe().webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err: unknown) {
    logger.error({ err }, '[webhook] Signature verification failed');
    return Response.json({ error: 'Invalid signature' }, { status: 400 });
  }

  logger.info({ type: event.type, eventId: event.id }, '[webhook] Event verified');

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const product = session.metadata?.product || 'forensic_report';
    const walletAddress = session.metadata?.walletAddress;
    const email = session.metadata?.email;
    const network = session.metadata?.network || 'eth';
    const caseId = session.metadata?.caseId || '';

    logger.info({ product, walletAddress, email }, '[webhook] Checkout completed');

    if (!email) {
      logger.error('[webhook] Missing email in metadata');
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
        const victimPhone = saved?.victimPhone || '';
        const victimState = saved?.victimState || '';
        const platformUrl = saved?.platformUrl || '';
        const victimWallet = saved?.victimWallet || '';
        const lossCurrency = saved?.lossCurrency || 'USD';
        const userLossAmount = saved?.lossAmount
          ? parseFloat(String(saved.lossAmount))
          : session.metadata?.lossAmount
            ? parseFloat(session.metadata.lossAmount)
            : NaN;
        const lossAmount = !isNaN(userLossAmount) ? userLossAmount : (session.amount_total || 7900) / 100;

        logger.info({ caseId, country, lossAmount }, '[webhook] Generating Emergency Pack');

        // 1. Generate Forensic Report FIRST to get enrichment data
        let enrichment: Record<string, unknown> = {};
        if (walletAddress) {
          try {
            const paymentId = session.payment_intent || session.id || '';
            const reportResult = await generateReport(walletAddress, email, {
              stripePaymentId: paymentId,
              amount: session.amount_total || 7900,
              network: detectedNetwork,
            });
            logger.info({ caseId: reportResult.caseId }, '[webhook] Forensic Report generated');

            // Extract enrichment data for legal pack
            const entities = reportResult.identifiedEntities || [];
            const exchanges = entities.filter((e: { type: string }) => e.type === 'exchange');
            enrichment = {
              forensicCaseId: reportResult.caseId,
              riskScore: reportResult.riskScore,
              recoveryScore: reportResult.recoveryScore,
              recoveryLabel: reportResult.recoveryLabel,
              identifiedExchanges: exchanges.map((e: { label: string; address: string }) => ({
                name: e.label,
                address: e.address,
              })),
              mixerDetected: entities.some((e: { type: string }) => e.type === 'mixer'),
              ofacWarning: reportResult.ofacWarning,
              hops: reportResult.graphData?.nodes?.length || 0,
              keyFindings: reportResult.keyFindings || [],
            };
          } catch (err) {
            logger.error({ err }, '[webhook] Forensic Report failed, continuing with legal pack');
          }
        }

        // 2. Generate Emergency Pack with enrichment
        const packResult = await generateEmergencyPack({
          caseId,
          countryCode: country,
          email,
          victimName: session.customer_details?.name || '',
          lossAmount,
          lossCurrency,
          scamType,
          walletAddress: walletAddress || '',
          victimWallet,
          txHashes: txid ? [txid] : [],
          description,
          txDate,
          platformName,
          platformUrl,
          network: detectedNetwork,
          contactMethod,
          victimPhone,
          victimState,
          enrichment,
        });
        logger.info({ templateCount: packResult.templates?.length }, '[webhook] Emergency Pack generated');

      } else if (product === 'summary_report') {
        /* ── Summary Report: just the Forensic Report ── */
        if (walletAddress) {
          const paymentId = session.payment_intent || session.id || '';
          const result = await generateReport(walletAddress, email, {
            stripePaymentId: paymentId,
            amount: session.amount_total || 1900,
            network,
          });
          logger.info({ caseId: result.caseId }, '[webhook] Summary Report generated');
        } else {
          logger.error('[webhook] Summary Report: missing walletAddress');
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
          logger.info({ caseId: result.caseId }, '[webhook] Forensic Report generated');
        } else {
          logger.error('[webhook] Missing walletAddress for forensic report');
        }
      }
    } catch (err) {
      logger.error({ err, product }, '[webhook] Generation failed');
    }
  }

  return Response.json({ received: true });
}
