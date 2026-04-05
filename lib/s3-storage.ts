import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const getS3 = () =>
  new S3Client({
    region: process.env.AWS_REGION || 'eu-central-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  });

const bucket = () => process.env.AWS_S3_BUCKET!;

/**
 * Upload a PDF report to S3.
 * Returns the S3 object key.
 */
export async function uploadReport(pdfBuffer: Buffer, caseId: string): Promise<string> {
  const key = `reports/${caseId}.pdf`;
  const b = bucket();
  console.log(`[s3] Uploading ${pdfBuffer.length} bytes to s3://${b}/${key}`);
  const result = await getS3().send(
    new PutObjectCommand({
      Bucket: b,
      Key: key,
      Body: pdfBuffer,
      ContentType: 'application/pdf',
      Metadata: { caseid: caseId },
    }),
  );
  console.log(`[s3] Upload complete: ${key}, ETag: ${result.ETag}, status: ${result.$metadata.httpStatusCode}`);
  return key;
}

/**
 * Generate a presigned download URL for a report.
 * Default expiry: 7 days (604800 seconds).
 */
export async function getReportDownloadUrl(caseId: string, expiresIn = 604800): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: bucket(),
    Key: `reports/${caseId}.pdf`,
    ResponseContentDisposition: `attachment; filename="LedgerHound-Report-${caseId}.pdf"`,
  });
  return getSignedUrl(getS3(), command, { expiresIn });
}
