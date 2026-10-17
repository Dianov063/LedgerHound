import { S3Client, GetObjectCommand, HeadObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { generateReport } from '@/lib/generateReport';
import { generateEmergencyPack } from '@/lib/generateEmergencyPack';
import { createReportCaseId } from '@/lib/report-delivery';
import { getReports } from '@/lib/reports-log';
import { paymentIdOf, putJob, type WebhookJob } from '@/lib/webhook-jobs';
import logger from '@/lib/logger';

/**
 * Generates what a paid checkout bought: the forensic report, the summary
 * report, or the Emergency Pack (forensic report + legal PDFs).
 *
 * Throws when generation or delivery fails so the job runner can retry it.
 * Returns 'invalid' for checkouts that can never succeed (no retry), and
 * 'already-done' when a job finds its purchase already delivered.
 *
 * Retrying is safe at any point of a failed attempt: the forensic report keeps
 * the case id stored in the job (same S3 object, same log entry), and both
 * emails carry a per-payment Resend idempotency key, so a retry that finds
 * an email already sent does not send it again.
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function loadCaseData(caseId: string): Promise<Record<string, any> | null> {
  if (!caseId) return null;
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

/**
 * Written only after every document of the pack was saved AND the email with
 * the links went out. A partial set of PDFs (generation interrupted) has no
 * marker, so the pack is rebuilt instead of being treated as delivered.
 */
const packCompleteKey = (caseId: string) => `legal-packs/cases/${caseId}/complete.json`;

async function isPackComplete(caseId: string): Promise<boolean> {
  if (!caseId) return false;
  try {
    await getS3().send(new HeadObjectCommand({ Bucket: s3Bucket(), Key: packCompleteKey(caseId) }));
    return true;
  } catch (err: unknown) {
    const e = err as { name?: string; $metadata?: { httpStatusCode?: number } };
    if (e.$metadata?.httpStatusCode === 404 || e.name === 'NotFound' || e.name === 'NoSuchKey') return false;
    throw err;
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

/** A report counts as delivered once logged with its email sent (legacy entries predate the flag). */
async function reportDeliveredFor(paymentId: string): Promise<boolean> {
  if (!paymentId) return false;
  const reports = await getReports();
  return reports.some((r) => r.stripePaymentId === paymentId && r.emailed !== false);
}

/** Fixes the report case id in the job before the first attempt, so every retry reuses it. */
async function ensureReportCaseId(job: WebhookJob): Promise<string> {
  if (!job.reportCaseId) {
    job.reportCaseId = createReportCaseId();
    await putJob(job);
  }
  return job.reportCaseId;
}

export async function processCheckoutJob(job: WebhookJob, opts: { resumed: boolean }): Promise<CheckoutOutcome> {
  const { session, eventId } = job;
  const product = session.metadata?.product || 'forensic_report';
  const walletAddress = session.metadata?.walletAddress;
  const email = session.metadata?.email;
  const network = session.metadata?.network || 'eth';
  const caseId = session.metadata?.caseId || '';
  // Phase 3: report language (en|es). Falls back to en if absent/unsupported.
  const reportLocale = session.metadata?.locale || 'en';
  // Phase 3: victim's country (ISO-ish code, e.g. PE). Unlocks country-specific
  // recovery guidance. Empty string → generic guidance.
  const reportCountry = session.metadata?.country || '';
  const paymentId = paymentIdOf(session);

  logger.info({ product, eventId, resumed: opts.resumed }, '[webhook] Processing checkout');

  if (!email) {
    logger.error({ eventId }, '[webhook] Missing email in metadata');
    return 'invalid';
  }

  if (product === 'emergency_pack') {
    /* ── Emergency Pack: 4 legal PDFs + Forensic Report ── */
    if (await isPackComplete(caseId)) {
      logger.info({ eventId, caseId }, '[webhook] Pack already delivered, skipping');
      return 'already-done';
    }
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

    logger.info({ caseId, country, lossAmount, eventId }, '[webhook] Generating Emergency Pack');

    // 1. Generate Forensic Report FIRST to get enrichment data. A resumed job
    //    whose report was already delivered skips it.
    let enrichment: Record<string, unknown> = {};
    if (walletAddress && !(opts.resumed && await reportDeliveredFor(paymentId))) {
      try {
        const reportResult = await generateReport(walletAddress, email, {
          caseId: await ensureReportCaseId(job),
          idempotencyKey: `ledgerhound:report:${paymentId}`,
          stripePaymentId: paymentId,
          amount: session.amount_total || 7900,
          network: detectedNetwork,
          locale: reportLocale,
          country: reportCountry,
        });
        logger.info({ caseId: reportResult.caseId, eventId }, '[webhook] Forensic Report generated');

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
        logger.error({ err, eventId }, '[webhook] Forensic Report failed, continuing with legal pack');
      }
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
    });
    // Reached only when every document was saved and the email went out.
    await markPackComplete(caseId, job, packResult.templates.map((t) => t.type));
    logger.info({ templateCount: packResult.templates?.length, eventId }, '[webhook] Emergency Pack generated');
    return 'done';
  }

  /* ── Summary Report ($19) or default Forensic Report ($49) ── */
  if (!walletAddress) {
    logger.error({ eventId, product }, '[webhook] Missing walletAddress for report');
    return 'invalid';
  }
  if (opts.resumed && await reportDeliveredFor(paymentId)) {
    logger.info({ eventId }, '[webhook] Resumed job: report already delivered, skipping');
    return 'already-done';
  }
  // Throws unless the report was uploaded, emailed and logged (lib/report-delivery.ts).
  const result = await generateReport(walletAddress, email, {
    caseId: await ensureReportCaseId(job),
    idempotencyKey: `ledgerhound:report:${paymentId}`,
    stripePaymentId: paymentId,
    amount: session.amount_total || (product === 'summary_report' ? 1900 : 4900),
    network,
    locale: reportLocale,
    country: reportCountry,
  });
  logger.info({ caseId: result.caseId, eventId, product }, '[webhook] Report generated');
  return 'done';
}
