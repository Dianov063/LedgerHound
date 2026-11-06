import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { generateReport } from '@/lib/generateReport';
import { generateEmergencyPack } from '@/lib/generateEmergencyPack';
import { deliverFrozenReport, getFrozenReport, summarizeReport, type ReportSummary } from '@/lib/report-delivery';
import { getDelivered, markDelivered, paymentIdOf, type WebhookJob } from '@/lib/webhook-jobs';
import { claimPackOwner, readPackManifest } from '@/lib/legal-packs/manifest';
import {
  ManualReviewError,
  RetryableReadError,
  isNotFound,
  lossAmountOf,
  purchaseRefFrom,
  readSnapshot,
  type PurchaseSnapshot,
} from '@/lib/purchase-snapshot';
import logger from '@/lib/logger';

/**
 * Generates what a paid checkout bought: the forensic report, the summary
 * report, or the Emergency Pack (forensic report + legal PDFs).
 *
 * Throws when generation or delivery fails so the job runner can retry it.
 * Returns 'invalid' for checkouts that can never succeed (no retry), and
 * 'already-done' when a job finds its purchase already delivered.
 *
 * Retrying is safe at any point of a failed attempt. The forensic report is
 * frozen (PDF, hash, email payload, summary) before its first email under the
 * case id stored in the job; a retry delivers that frozen version instead of
 * rendering a new one. The pack freezes its document set and email the same
 * way (lib/generateEmergencyPack.ts). Both emails carry a per-payment
 * idempotency key over an identical body, so the selected transport never
 * sends twice.
 *
 * Emergency purchases are built ONLY from their immutable purchase snapshot
 * (lib/purchase-snapshot.ts). A read that fails for a temporary reason throws
 * RetryableReadError before anything is generated, emailed or marked; a
 * confirmed missing or inconsistent snapshot throws ManualReviewError, which
 * the runner parks in webhook-jobs/manual-review/. Sessions created before
 * snapshots existed cannot prove what they bought (the old checkout rewrote
 * one shared case file per link), so they go to manual review.
 *
 * A delivered purchase is recorded per payment (webhook-deliveries/); any
 * later run for that payment (webhook replay, sweep, manual re-run) stops
 * there, so one payment gets one delivery and one email.
 */
export type CheckoutOutcome = 'done' | 'already-done' | 'invalid';

const getS3 = () =>
  new S3Client({
    region: process.env.AWS_REGION || 'eu-central-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  });

const s3Bucket = () => process.env.AWS_S3_BUCKET!;

/** The snapshot this Emergency purchase bought, or null for products that never had one. */
async function purchaseSnapshotOf(job: WebhookJob, product: string): Promise<PurchaseSnapshot | null> {
  const ref = job.purchase ?? purchaseRefFrom(job.session.metadata);
  if (ref) {
    const meta = job.session.metadata;
    // The job copy must agree with the signed session it came from.
    if (ref.purchaseId !== (meta.purchaseId || '') || ref.snapshotSha256 !== (meta.snapshotSha256 || '')
      || ref.caseId !== (meta.caseId || '') || ref.product !== product) {
      throw new ManualReviewError('snapshot_reference_invalid', 'the job and its session disagree about the purchase');
    }
    return readSnapshot(ref);
  }
  if (product === 'emergency_pack') {
    // The old checkout kept one case file per case and rewrote it for every new
    // link; neither timestamps nor the few fields copied into the session can
    // prove which version this payment bought (two checkouts can interleave).
    throw new ManualReviewError('legacy_unverifiable', 'this older pack link has no purchase snapshot; its data cannot be proven');
  }
  // Summary report before snapshots: it was always built from its own session
  // metadata alone (never from the shared case), which Stripe keeps unchanged.
  return null;
}

/**
 * Written only after every document of the pack was saved AND the email with
 * the links went out. A partial set of PDFs (generation interrupted) has no
 * marker, so the pack is rebuilt instead of being treated as delivered.
 */
const packCompleteKey = (caseId: string) => `legal-packs/cases/${caseId}/complete.json`;

/** The completion record of a case's pack, or null. Only a confirmed 404 is "none". */
async function packCompletion(caseId: string): Promise<{ paymentId?: string } | null> {
  if (!caseId) return null;
  try {
    const r = await getS3().send(new GetObjectCommand({ Bucket: s3Bucket(), Key: packCompleteKey(caseId) }));
    const text = (await r.Body?.transformToString()) || '{}';
    try { return JSON.parse(text) as { paymentId?: string }; } catch { return {}; }
  } catch (err: unknown) {
    if (isNotFound(err)) return null;
    throw new RetryableReadError('pack completion marker', err);
  }
}

async function markPackComplete(caseId: string, job: WebhookJob, templates: string[]): Promise<void> {
  await getS3().send(new PutObjectCommand({
    Bucket: s3Bucket(),
    Key: packCompleteKey(caseId),
    Body: JSON.stringify({ completedAt: new Date().toISOString(), eventId: job.eventId, paymentId: paymentIdOf(job.session), templates }),
    ContentType: 'application/json',
    ServerSideEncryption: 'aws:kms',
  }));
}

/**
 * Delivers the forensic report of this purchase and returns its summary.
 * If an earlier attempt froze it, that exact report is delivered again
 * (idempotent); otherwise it is generated, frozen and delivered. Throws
 * unless the customer has it (uploaded, emailed, logged).
 */
async function deliverForensicReport(
  job: WebhookJob,
  args: { walletAddress: string; email: string; amount: number; network: string; locale: string; country: string },
): Promise<{ summary: ReportSummary; reused: boolean }> {
  const caseId = job.reportCaseId;
  if (!caseId) throw new Error('Job has no reportCaseId (it must be acquired through acquireJob)');
  const paymentId = paymentIdOf(job.session);

  const frozen = await getFrozenReport(caseId);
  if (frozen) {
    await deliverFrozenReport(frozen);
    return { summary: frozen.summary ?? summarizeReport({}), reused: true };
  }
  const result = await generateReport(args.walletAddress, args.email, {
    caseId,
    idempotencyKey: `ledgerhound:report:${paymentId}`,
    stripePaymentId: paymentId,
    amount: args.amount,
    network: args.network,
    locale: args.locale,
    country: args.country,
  });
  return { summary: summarizeReport(result), reused: false };
}

const str = (v: unknown) => (typeof v === 'string' ? v : v === null || v === undefined ? '' : String(v));

export async function processCheckoutJob(job: WebhookJob, opts: { resumed: boolean }): Promise<CheckoutOutcome> {
  const { session, eventId } = job;
  const product = session.metadata?.product || 'forensic_report';
  const paymentId = paymentIdOf(session);

  logger.info({ product, eventId, resumed: opts.resumed }, '[webhook] Processing checkout');

  // One payment, one delivery: a run after the recorded delivery does nothing.
  let delivered;
  try {
    delivered = await getDelivered(paymentId);
  } catch (err) {
    throw new RetryableReadError('delivery record', err);
  }
  if (delivered) {
    logger.info({ eventId, product }, '[webhook] Purchase already delivered for this payment, skipping');
    return 'already-done';
  }

  // Emergency purchases: the snapshot is the only source of the purchase data.
  const snapshot = await purchaseSnapshotOf(job, product);
  const data: Record<string, unknown> = snapshot ? snapshot.case : session.metadata ?? {};
  const walletAddress = str(data.walletAddress);
  const email = str(data.email);
  const network = str(data.network) || 'eth';
  const caseId = snapshot ? snapshot.caseId : str(session.metadata?.caseId);
  // Phase 3: report language (en|es). Falls back to en if absent/unsupported.
  const reportLocale = session.metadata?.locale || 'en';
  // Phase 3: victim's country (ISO-ish code, e.g. PE). Unlocks country-specific
  // recovery guidance. Empty string → generic guidance.
  const reportCountry = str(data.country);
  const finish = async (outcome: CheckoutOutcome): Promise<CheckoutOutcome> => {
    await markDelivered({ paymentId, eventId, product, purchaseId: snapshot?.purchaseId, deliveredAt: new Date().toISOString() });
    return outcome;
  };

  if (!email) {
    logger.error({ eventId }, '[webhook] Missing email in purchase data');
    return 'invalid';
  }

  if (product === 'emergency_pack') {
    /* ── Emergency Pack: 4 legal PDFs + Forensic Report ── */
    // The pack is stored per case. A second payment for the same case (two
    // open links both paid) must not receive or overwrite the first one.
    const completion = await packCompletion(caseId);
    if (completion) {
      if (!completion.paymentId) {
        throw new ManualReviewError('pack_artifacts_unowned', 'a pack of this case was completed without a recorded payment');
      }
      if (completion.paymentId !== paymentId) {
        throw new ManualReviewError('case_paid_twice', 'the pack of this case was already delivered for another payment');
      }
      logger.info({ eventId, caseId }, '[webhook] Pack already delivered, skipping');
      return finish('already-done');
    }
    // Own the case's document set before the forensic report, the first PDF
    // or any email: a competing payment goes to manual review here.
    await claimPackOwner(caseId, paymentId, snapshot?.purchaseId);
    let manifest;
    try {
      manifest = await readPackManifest(caseId);
    } catch (err) {
      throw new RetryableReadError('pack manifest', err);
    }
    if (manifest?.paymentId && manifest.paymentId !== paymentId) {
      throw new ManualReviewError('case_paid_twice', 'the pack of this case is being delivered for another payment');
    }

    const country = str(data.country) || 'US';
    const scamType = str(data.scamType);
    const platformName = str(data.platformName);
    const description = str(data.description);
    const txid = str(data.txid);
    const txDate = str(data.txDate);
    const detectedNetwork = str(data.detectedNetwork) || network;
    const contactMethod = str(data.contactMethod);
    const victimPhone = str(data.victimPhone);
    const victimState = str(data.victimState);
    const platformUrl = str(data.platformUrl);
    const victimWallet = str(data.victimWallet);
    const lossCurrency = str(data.lossCurrency) || 'USD';
    // Never the price of the pack: an unknown loss is printed as a blank to fill in.
    const lossAmount = lossAmountOf(data.lossAmount);

    logger.info({ caseId, country, purchase: snapshot?.purchaseId, eventId }, '[webhook] Generating Emergency Pack');

    // 1. The forensic report is part of the pack: it must be delivered before
    //    the legal documents, and a failure fails the attempt (the job is
    //    retried) instead of shipping the pack without it. Its frozen summary
    //    provides the enrichment, so every attempt builds the same documents.
    let enrichment: Record<string, unknown> = {};
    if (walletAddress) {
      const { summary } = await deliverForensicReport(job, {
        walletAddress, email, amount: session.amount_total || 7900, network: detectedNetwork, locale: reportLocale, country: reportCountry,
      });
      const exchanges = summary.identifiedEntities.filter((e) => e.type === 'exchange');
      enrichment = {
        forensicCaseId: job.reportCaseId,
        riskScore: summary.riskScore,
        recoveryScore: summary.recoveryScore,
        recoveryLabel: summary.recoveryLabel,
        identifiedExchanges: exchanges.map((e) => ({ name: e.label, address: e.address })),
        mixerDetected: summary.identifiedEntities.some((e) => e.type === 'mixer'),
        ofacWarning: summary.ofacWarning,
        hops: summary.hops,
        keyFindings: summary.keyFindings,
      };
      logger.info({ caseId: job.reportCaseId, eventId }, '[webhook] Forensic Report delivered');
    }

    // 2. Generate Emergency Pack with enrichment (throws → job is retried)
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
      idempotencyKey: `ledgerhound:pack:${paymentId}`,
      paymentId,
      purchaseId: snapshot?.purchaseId,
    });
    // Reached only when every document was saved and the email went out.
    await markPackComplete(caseId, job, packResult.templates.map((t) => t.type));
    logger.info({ templateCount: packResult.templates?.length, eventId }, '[webhook] Emergency Pack generated');
    return finish('done');
  }

  /* ── Summary Report ($19) or default Forensic Report ($49) ── */
  if (!walletAddress) {
    logger.error({ eventId, product }, '[webhook] Missing walletAddress for report');
    return 'invalid';
  }
  // Throws unless the report was uploaded, emailed and logged (lib/report-delivery.ts).
  const { reused } = await deliverForensicReport(job, {
    walletAddress, email, amount: session.amount_total || (product === 'summary_report' ? 1900 : 4900), network, locale: reportLocale, country: reportCountry,
  });
  logger.info({ caseId: job.reportCaseId, eventId, product, reused }, '[webhook] Report delivered');
  return finish(reused ? 'already-done' : 'done');
}
