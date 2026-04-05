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
}

interface ReportsLog {
  reports: ReportLogEntry[];
}

/**
 * Fetch the current reports log from S3.
 * Returns empty array if the log doesn't exist yet.
 */
export async function getReports(): Promise<ReportLogEntry[]> {
  try {
    const res = await getS3().send(
      new GetObjectCommand({ Bucket: bucket(), Key: LOG_KEY }),
    );
    const body = await res.Body?.transformToString();
    if (!body) return [];
    const data: ReportsLog = JSON.parse(body);
    return data.reports || [];
  } catch (err: any) {
    // NoSuchKey means log file doesn't exist yet
    if (err.name === 'NoSuchKey' || err.Code === 'NoSuchKey') {
      return [];
    }
    console.error('[reports-log] Failed to fetch reports log:', err);
    return [];
  }
}

/**
 * Append a new report entry to the log in S3.
 */
export async function logReport(entry: ReportLogEntry): Promise<void> {
  const existing = await getReports();
  existing.push(entry);

  const data: ReportsLog = { reports: existing };
  await getS3().send(
    new PutObjectCommand({
      Bucket: bucket(),
      Key: LOG_KEY,
      Body: JSON.stringify(data, null, 2),
      ContentType: 'application/json',
    }),
  );
  console.log(`[reports-log] Logged report: ${entry.caseId}`);
}
