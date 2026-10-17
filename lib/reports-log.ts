import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';

const getS3 = () =>
  new S3Client({
    region: process.env.AWS_REGION || 'eu-central-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  });

const bucket = () => process.env.AWS_S3_BUCKET!;
const LOG_KEY = 'logs/reports.json';

export interface ReportLogEntry {
  caseId: string;
  walletAddress: string;
  email: string;
  network: string;
  s3Key: string;
  downloadUrl: string;
  stripePaymentId: string;
  createdAt: string;
  amount: number;
  /** False while the report is uploaded but its email has not gone out yet. Absent on legacy entries. */
  emailed?: boolean;
}

interface ReportsLog {
  reports: ReportLogEntry[];
}

/** The log plus its ETag, for conditional writes. */
async function readLog(): Promise<{ reports: ReportLogEntry[]; etag: string | null }> {
  try {
    const res = await getS3().send(
      new GetObjectCommand({ Bucket: bucket(), Key: LOG_KEY }),
    );
    const body = await res.Body?.transformToString();
    const data: ReportsLog = body ? JSON.parse(body) : { reports: [] };
    return { reports: data.reports || [], etag: res.ETag ?? null };
  } catch (err: any) {
    // NoSuchKey means log file doesn't exist yet
    if (err.name === 'NoSuchKey' || err.Code === 'NoSuchKey') {
      return { reports: [], etag: null };
    }
    throw err;
  }
}

/**
 * Fetch the current reports log from S3.
 * Returns empty array if the log doesn't exist yet.
 */
export async function getReports(): Promise<ReportLogEntry[]> {
  try {
    return (await readLog()).reports;
  } catch (err) {
    console.error('[reports-log] Failed to fetch reports log:', err);
    return [];
  }
}

/**
 * Insert or update (by caseId) a report entry. Conditional writes (If-Match
 * the ETag that was read, or If-None-Match for a new log) make concurrent
 * writers retry instead of overwriting each other, and a retried delivery
 * updates its entry instead of adding a duplicate. Throws if it cannot save,
 * so the caller does not treat the report as delivered.
 */
export async function logReport(entry: ReportLogEntry): Promise<void> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const { reports, etag } = await readLog();
    const i = reports.findIndex((r) => r.caseId === entry.caseId);
    if (i >= 0) reports[i] = { ...reports[i], ...entry };
    else reports.push(entry);

    const data: ReportsLog = { reports };
    try {
      await getS3().send(
        new PutObjectCommand({
          Bucket: bucket(),
          Key: LOG_KEY,
          Body: JSON.stringify(data, null, 2),
          ContentType: 'application/json',
          ...(etag ? { IfMatch: etag } : { IfNoneMatch: '*' }),
        }),
      );
      console.log(`[reports-log] Logged report: ${entry.caseId}`);
      return;
    } catch (err: any) {
      const status = err?.$metadata?.httpStatusCode;
      if (status === 412 || status === 409 || err?.name === 'PreconditionFailed' || err?.name === 'ConditionalRequestConflict') continue;
      throw err;
    }
  }
  throw new Error('[reports-log] Could not save entry: concurrent updates kept conflicting');
}
