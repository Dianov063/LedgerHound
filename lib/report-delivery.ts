import { randomBytes } from 'crypto';
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import type { CreateEmailOptions } from 'resend';
import { getReportDownloadUrl } from './s3-storage';
import { buildReportEmail } from './sendReport';
import { sendEmailOnce } from './idempotent-email';
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

/** What the Emergency Pack needs from a forensic report; frozen with it. */
export interface ReportSummary {
  riskScore?: number;
  recoveryScore?: number;
  recoveryLabel?: string;
  identifiedEntities: { type: string; label: string; address: string }[];
  ofacWarning?: boolean | string;
  hops: number;
  keyFindings: string[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function summarizeReport(r: any): ReportSummary {
  return {
    riskScore: r?.riskScore,
    recoveryScore: r?.recoveryScore,
    recoveryLabel: r?.recoveryLabel,
    identifiedEntities: (r?.identifiedEntities || []).map((e: { type: string; label: string; address: string }) => ({
      type: e.type, label: e.label, address: e.address,
    })),
    ofacWarning: r?.ofacWarning,
    hops: r?.graphData?.nodes?.length || 0,
    keyFindings: r?.keyFindings || [],
  };
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
  summary?: ReportSummary;
}

type FrozenAttachment = { filename: string; pdf: true } | { filename: string; base64: string };

/**
 * The canonical result of a report, written once (If-None-Match) BEFORE the
 * first email is sent. Every later attempt delivers exactly this: the same PDF
 * bytes (the object is write-once too), the same hash and the same email
 * payload, so Resend recognises a retry as the same request and the
 * attachment always matches the file behind the download link.
 */
export interface FrozenReport {
  caseId: string;
  pdfKey: string;
  pdfSha256: string;
  downloadUrl: string;
  frozenAt: string;
  email: null | { payload: Omit<CreateEmailOptions, 'attachments'>; attachments: FrozenAttachment[]; idempotencyKey?: string };
  log: { walletAddress: string; email: string; network: string; stripePaymentId: string; amount: number };
  summary?: ReportSummary;
}

const getS3 = () =>
  new S3Client({
    region: process.env.AWS_REGION || 'eu-central-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  });
const bucket = () => process.env.AWS_S3_BUCKET!;
const pdfKeyOf = (caseId: string) => `reports/${caseId}.pdf`;
const frozenKeyOf = (caseId: string) => `reports/${caseId}.delivery.json`;

function isStatus(err: unknown, codes: number[], names: string[]): boolean {
  const e = err as { name?: string; $metadata?: { httpStatusCode?: number } };
  return codes.includes(e.$metadata?.httpStatusCode ?? -1) || names.includes(e.name ?? '');
}

export async function getFrozenReport(caseId: string): Promise<FrozenReport | null> {
  try {
    const r = await getS3().send(new GetObjectCommand({ Bucket: bucket(), Key: frozenKeyOf(caseId) }));
    const text = await r.Body?.transformToString();
    return text ? (JSON.parse(text) as FrozenReport) : null;
  } catch (err) {
    if (isStatus(err, [404], ['NoSuchKey'])) return null;
    throw err;
  }
}

async function readPdf(key: string): Promise<{ bytes: Buffer; sha256?: string }> {
  const r = await getS3().send(new GetObjectCommand({ Bucket: bucket(), Key: key }));
  const bytes = Buffer.from((await r.Body!.transformToByteArray()) as Uint8Array);
  return { bytes, sha256: r.Metadata?.sha256 };
}

/**
 * Freezes the report. The PDF object is written once: if an earlier attempt
 * already stored one (and crashed before freezing), that document is kept and
 * the freshly rendered one is discarded. Throws if S3 is unavailable, in which
 * case nothing has been sent.
 */
async function freezeReport(input: DeliverReportInput): Promise<FrozenReport> {
  const existing = await getFrozenReport(input.caseId);
  if (existing) return existing;

  const pdfKey = pdfKeyOf(input.caseId);
  let pdf = input.buf;
  let pdfSha256 = input.pdfSha256;
  try {
    await getS3().send(new PutObjectCommand({
      Bucket: bucket(),
      Key: pdfKey,
      Body: input.buf,
      ContentType: 'application/pdf',
      ServerSideEncryption: 'aws:kms',
      Metadata: { caseid: input.caseId, sha256: input.pdfSha256 },
      IfNoneMatch: '*',
    }));
  } catch (err) {
    if (!isStatus(err, [412], ['PreconditionFailed'])) throw err;
    const stored = await readPdf(pdfKey);
    pdf = stored.bytes;
    pdfSha256 = stored.sha256 || pdfSha256;
    logger.info({ caseId: input.caseId }, '[report-delivery] Keeping the PDF stored by an earlier attempt');
  }
  const downloadUrl = await getReportDownloadUrl(input.caseId);

  let email: FrozenReport['email'] = null;
  if (!input.skipEmail) {
    const built = buildReportEmail(
      input.email, input.walletAddress, pdf, input.caseId, downloadUrl, input.locale, input.country, pdfSha256,
    );
    const { attachments = [], ...payload } = built;
    email = {
      payload,
      idempotencyKey: input.idempotencyKey,
      attachments: attachments.map((a, i) => (i === 0
        ? { filename: String(a.filename), pdf: true as const }
        : { filename: String(a.filename), base64: Buffer.from(a.content as Buffer).toString('base64') })),
    };
  }

  const frozen: FrozenReport = {
    caseId: input.caseId,
    pdfKey,
    pdfSha256,
    downloadUrl,
    frozenAt: new Date().toISOString(),
    email,
    log: {
      walletAddress: input.walletAddress,
      email: input.email,
      network: input.network,
      stripePaymentId: input.stripePaymentId,
      amount: input.amount,
    },
    summary: input.summary,
  };
  try {
    await getS3().send(new PutObjectCommand({
      Bucket: bucket(),
      Key: frozenKeyOf(input.caseId),
      Body: JSON.stringify(frozen),
      ContentType: 'application/json',
      ServerSideEncryption: 'aws:kms',
      IfNoneMatch: '*',
    }));
    return frozen;
  } catch (err) {
    if (!isStatus(err, [412], ['PreconditionFailed'])) throw err;
    return (await getFrozenReport(input.caseId))!; // another runner froze first: deliver theirs
  }
}

/**
 * Delivers a frozen report: sends the frozen email (Resend dedupes the
 * identical request) and records the report in the log. Throws unless the
 * email went out (or was already sent) and the log entry is saved.
 */
export async function deliverFrozenReport(frozen: FrozenReport): Promise<{ downloadUrl: string; s3Key: string }> {
  let emailed = false;
  if (frozen.email) {
    try {
      const { bytes } = await readPdf(frozen.pdfKey);
      const attachments = frozen.email.attachments.map((a) => ('pdf' in a
        ? { filename: a.filename, content: bytes }
        : { filename: a.filename, content: Buffer.from(a.base64, 'base64') }));
      const result = await sendEmailOnce({ ...frozen.email.payload, attachments } as CreateEmailOptions, frozen.email.idempotencyKey);
      emailed = true;
      logger.info({ caseId: frozen.caseId, result }, '[generateReport] Email delivered');
    } catch (err) {
      logger.error({ err, caseId: frozen.caseId }, '[generateReport] Email send failed');
    }
  }

  // Throws if it cannot be saved: the success page could not find the report.
  await logReport({
    caseId: frozen.caseId,
    ...frozen.log,
    s3Key: frozen.pdfKey,
    downloadUrl: frozen.downloadUrl,
    createdAt: frozen.frozenAt,
    emailed,
  });

  if (frozen.email && !emailed) throw new ReportDeliveryError(true, false);
  return { downloadUrl: frozen.downloadUrl, s3Key: frozen.pdfKey };
}

/**
 * Freezes, then delivers. A paid report counts as delivered only when the
 * frozen PDF is in S3, its email went out, and the log entry is saved;
 * otherwise this throws and the webhook job retries. Retries deliver the
 * frozen version, never a newly rendered one.
 */
export async function deliverReport(input: DeliverReportInput): Promise<{ downloadUrl: string; s3Key: string }> {
  let frozen: FrozenReport;
  try {
    frozen = await freezeReport(input);
  } catch (err) {
    logger.error({ err, caseId: input.caseId }, '[generateReport] Could not store the report; nothing sent');
    throw new ReportDeliveryError(false, false);
  }
  return deliverFrozenReport(frozen);
}
