import { S3Client, GetObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { generateReport } from '@/lib/generateReport';
import { generateEmergencyPack } from '@/lib/generateEmergencyPack';
import { getReports } from '@/lib/reports-log';
import { paymentIdOf, type WebhookJob } from '@/lib/webhook-jobs';
import logger from '@/lib/logger';

/**
 * Generates what a paid checkout bought: the forensic report, the summary
 * report, or the Emergency Pack (forensic report + legal PDFs).
 *
 * Throws when generation fails so the job runner can retry it. Returns
 * 'invalid' for checkouts that can never succeed (no retry), and
 * 'already-done' when a resumed job finds its output already exists, so a
 * recovery run never emails the customer twice.
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

async function hasGeneratedPack(caseId: string): Promise<boolean> {
  if (!caseId) return false;
  const list = await getS3().send(
    new ListObjectsV2Command({ Bucket: s3Bucket(), Prefix: `legal-packs/cases/${caseId}/`, MaxKeys: 1 }),
  );
  return (list.KeyCount ?? list.Contents?.length ?? 0) > 0;
}

async function reportExistsFor(paymentId: string): Promise<boolean> {
  if (!paymentId) return false;
  const reports = await getReports();
  return reports.some((r) => r.stripePaymentId === paymentId);
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
    if (opts.resumed && await hasGeneratedPack(caseId)) {
      logger.info({ eventId, caseId }, '[webhook] Resumed job: pack already generated, skipping');
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
    //    whose report was already emailed skips it rather than sending twice.
    let enrichment: Record<string, unknown> = {};
    if (walletAddress && !(opts.resumed && await reportExistsFor(paymentId))) {
      try {
        const reportResult = await generateReport(walletAddress, email, {
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
    });
    logger.info({ templateCount: packResult.templates?.length, eventId }, '[webhook] Emergency Pack generated');
    return 'done';
  }

  /* ── Summary Report ($19) or default Forensic Report ($49) ── */
  if (!walletAddress) {
    logger.error({ eventId, product }, '[webhook] Missing walletAddress for report');
    return 'invalid';
  }
  if (opts.resumed && await reportExistsFor(paymentId)) {
    logger.info({ eventId }, '[webhook] Resumed job: report already generated, skipping');
    return 'already-done';
  }
  const result = await generateReport(walletAddress, email, {
    stripePaymentId: paymentId,
    amount: session.amount_total || (product === 'summary_report' ? 1900 : 4900),
    network,
    locale: reportLocale,
    country: reportCountry,
  });
  logger.info({ caseId: result.caseId, eventId, product }, '[webhook] Report generated');
  return 'done';
}
