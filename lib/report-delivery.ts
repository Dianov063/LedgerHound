import { randomBytes } from 'crypto';
import { uploadReport, getReportDownloadUrl } from './s3-storage';
import { sendReport } from './sendReport';
import { logReport } from './reports-log';
import logger from './logger';

/** Report case ids: unguessable, and stable across retries of one purchase. */
export const REPORT_CASE_ID_RE = /^LH-[0-9A-Z]{6,12}-[0-9a-f]{16}$/;

export function createReportCaseId(now = Date.now()): string {
  return `LH-${now.toString(36).toUpperCase()}-${randomBytes(8).toString('hex')}`;
}

/** Thrown when the customer cannot get the report yet; the job will retry. */
export class ReportDeliveryError extends Error {
  constructor(readonly uploaded: boolean, readonly emailed: boolean) {
    super(`Report not delivered (uploaded=${uploaded}, emailed=${emailed})`);
    this.name = 'ReportDeliveryError';
  }
}

export interface DeliverReportInput {
  buf: Buffer;
  caseId: string;
  email: string;
  walletAddress: string;
  network: string;
  locale: string;
  country: string;
  pdfSha256: string;
  stripePaymentId: string;
  amount: number;
  /** Same key on every retry of one purchase (see lib/idempotent-email.ts). */
  idempotencyKey?: string;
  /** Tools that only regenerate a PDF; never set for a paid order. */
  skipEmail?: boolean;
}

/**
 * Uploads the PDF, emails it, and records it in the reports log.
 *
 * A paid report counts as delivered only when all three succeed: the PDF is
 * in S3 (the success page links to it), the email went out (or was already
 * sent by an earlier attempt with the same idempotency key), and the log
 * entry is saved (the success page finds the report through it). Otherwise
 * it throws so the webhook job retries. Retries are safe: the case id is
 * stable, so the upload overwrites the same object, the email is not sent
 * twice, and the log entry is updated in place.
 */
export async function deliverReport(input: DeliverReportInput): Promise<{ downloadUrl: string; s3Key: string }> {
  const { caseId } = input;

  let downloadUrl = '';
  let s3Key = '';
  let uploaded = false;
  try {
    logger.info({ pdfBytes: input.buf.length }, '[generateReport] Uploading to S3');
    s3Key = await uploadReport(input.buf, caseId);
    downloadUrl = await getReportDownloadUrl(caseId);
    uploaded = true;
    logger.info({ s3Key }, '[generateReport] S3 upload OK');
  } catch (err: unknown) {
    logger.error({ err, caseId }, '[generateReport] S3 upload failed');
  }

  let emailed = false;
  if (!input.skipEmail) {
    try {
      const result = await sendReport(
        input.email, input.walletAddress, input.buf, caseId, downloadUrl,
        input.locale, input.country, input.pdfSha256, input.idempotencyKey,
      );
      emailed = true;
      logger.info({ caseId, result }, '[generateReport] Email delivered');
    } catch (err: unknown) {
      logger.error({ err, caseId }, '[generateReport] Email send failed');
    }
  }

  if (uploaded) {
    // Throws if it cannot be saved: the success page could not find the report.
    await logReport({
      caseId,
      walletAddress: input.walletAddress,
      email: input.email,
      network: input.network,
      s3Key,
      downloadUrl,
      stripePaymentId: input.stripePaymentId,
      createdAt: new Date().toISOString(),
      amount: input.amount,
      emailed,
    });
  }

  if (!uploaded || (!emailed && !input.skipEmail)) throw new ReportDeliveryError(uploaded, emailed);
  return { downloadUrl, s3Key };
}
