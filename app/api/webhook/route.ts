export const maxDuration = 120; // waitUntil background work: report generation takes 30-60s

import Stripe from 'stripe';
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { waitUntil } from '@vercel/functions';
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

const IDEMPOTENCY_PREFIX = 'webhook-events/';

/**
 * Atomic idempotency: try to claim the event using S3 conditional write.
 * IfNoneMatch: '*' ensures only the FIRST writer succeeds.
 * Returns true if we successfully claimed the event (proceed with processing).
 * Returns false if someone else already claimed it (skip).
 */
async function claimEvent(eventId: string): Promise<boolean> {
  try {
    await getS3().send(new PutObjectCommand({
      Bucket: s3Bucket(),
      Key: `${IDEMPOTENCY_PREFIX}${eventId}`,
      Body: JSON.stringify({ claimedAt: new Date().toISOString() }),
      ContentType: 'application/json',
      ServerSideEncryption: 'aws:kms',
      IfNoneMatch: '*', // ATOMIC: fails with 412 if object already exists
    }));
    logger.info({ eventId }, '[webhook] Event claimed for processing');
    return true;
  } catch (err: unknown) {
    // S3 returns 412 PreconditionFailed if object exists (another instance already claimed it)
    // or ConditionalCheckFailed
    const statusCode = (err as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode;
    const errName = (err as { name?: string }).name;
    if (statusCode === 412 || errName === 'PreconditionFailed' || errName === 'ConditionalCheckFailed') {
      logger.info({ eventId }, '[webhook] Event already claimed — skipping (Stripe retry or race)');
      return false;
    }
    // Unexpected S3 error — log but allow processing (better one duplicate than zero)
    logger.error({ err, eventId }, '[webhook] S3 claimEvent failed unexpectedly — proceeding anyway');
    return true;
  }
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

/**
 * POST /api/webhook — Stripe webhook handler.
 *
 * Architecture:
 * 1. Verify Stripe signature
 * 2. Claim event atomically via S3 conditional write (prevents race conditions)
 * 3. Return 200 IMMEDIATELY to Stripe (prevents retries)
 * 4. Process report generation in background via waitUntil()
 */
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

  // ── Atomic idempotency: claim the event or skip ──
  // Uses S3 conditional write (IfNoneMatch: '*') — only the first writer wins.
  // No race condition: even if two requests arrive simultaneously,
  // only one PutObject succeeds; the other gets 412.
  const claimed = await claimEvent(event.id);
  if (!claimed) {
    return Response.json({ received: true });
  }

  // ── Return 200 immediately, process in background ──
  // Stripe won't retry because it gets a fast 200 response.
  // waitUntil() keeps the serverless function alive for background work.
  if (event.type === 'checkout.session.completed') {
    waitUntil(processCheckout(event));
  }

  return Response.json({ received: true });
}

/**
 * Background processing of checkout.session.completed events.
 * Runs via waitUntil() — does NOT block the HTTP response.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function processCheckout(event: any): Promise<void> {
  const session = event.data.object;
  const product = session.metadata?.product || 'forensic_report';
  const walletAddress = session.metadata?.walletAddress;
  const email = session.metadata?.email;
  const network = session.metadata?.network || 'eth';
  const caseId = session.metadata?.caseId || '';

  logger.info({ product, walletAddress, email, eventId: event.id }, '[webhook] Processing checkout (background)');

  if (!email) {
    logger.error({ eventId: event.id }, '[webhook] Missing email in metadata');
    return;
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

      logger.info({ caseId, country, lossAmount, eventId: event.id }, '[webhook] Generating Emergency Pack');

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
          logger.info({ caseId: reportResult.caseId, eventId: event.id }, '[webhook] Forensic Report generated');

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
          logger.error({ err, eventId: event.id }, '[webhook] Forensic Report failed, continuing with legal pack');
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
      logger.info({ templateCount: packResult.templates?.length, eventId: event.id }, '[webhook] Emergency Pack generated');

    } else if (product === 'summary_report') {
      /* ── Summary Report: just the Forensic Report ── */
      if (walletAddress) {
        const paymentId = session.payment_intent || session.id || '';
        const result = await generateReport(walletAddress, email, {
          stripePaymentId: paymentId,
          amount: session.amount_total || 1900,
          network,
        });
        logger.info({ caseId: result.caseId, eventId: event.id }, '[webhook] Summary Report generated');
      } else {
        logger.error({ eventId: event.id }, '[webhook] Summary Report: missing walletAddress');
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
        logger.info({ caseId: result.caseId, eventId: event.id }, '[webhook] Forensic Report generated');
      } else {
        logger.error({ eventId: event.id }, '[webhook] Missing walletAddress for forensic report');
      }
    }
  } catch (err) {
    logger.error({ err, product, eventId: event.id }, '[webhook] Generation failed');
  }
}
