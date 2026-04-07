import { S3Client, GetObjectCommand, PutObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type { CountryResearch, PipelineStatus, CountryStatus } from './types';

const getS3 = () =>
  new S3Client({
    region: process.env.AWS_REGION || 'eu-central-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  });

const bucket = () => process.env.AWS_S3_BUCKET!;
const PREFIX = 'legal-packs';

async function streamToString(stream: any): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks).toString('utf-8');
}

export async function getResearch(countryCode: string): Promise<CountryResearch | null> {
  try {
    const res = await getS3().send(new GetObjectCommand({
      Bucket: bucket(),
      Key: `${PREFIX}/research/${countryCode}.json`,
    }));
    return JSON.parse(await streamToString(res.Body));
  } catch {
    return null;
  }
}

export async function saveResearch(countryCode: string, data: CountryResearch): Promise<void> {
  await getS3().send(new PutObjectCommand({
    Bucket: bucket(),
    Key: `${PREFIX}/research/${countryCode}.json`,
    Body: JSON.stringify(data, null, 2),
    ContentType: 'application/json',
  }));
}

export async function getPipelineStatus(): Promise<PipelineStatus> {
  try {
    const res = await getS3().send(new GetObjectCommand({
      Bucket: bucket(),
      Key: `${PREFIX}/metadata/pipeline-status.json`,
    }));
    return JSON.parse(await streamToString(res.Body));
  } catch {
    return { lastFullRefresh: '', countries: {} };
  }
}

export async function savePipelineStatus(status: PipelineStatus): Promise<void> {
  await getS3().send(new PutObjectCommand({
    Bucket: bucket(),
    Key: `${PREFIX}/metadata/pipeline-status.json`,
    Body: JSON.stringify(status, null, 2),
    ContentType: 'application/json',
  }));
}

export async function updateCountryStatus(countryCode: string, update: Partial<CountryStatus>): Promise<void> {
  const status = await getPipelineStatus();
  status.countries[countryCode] = { ...status.countries[countryCode], ...update } as CountryStatus;
  await savePipelineStatus(status);
}

export async function saveGeneratedPdf(caseId: string, templateType: string, pdfBuffer: Buffer): Promise<string> {
  const key = `${PREFIX}/generated/${caseId}/${templateType}.pdf`;
  await getS3().send(new PutObjectCommand({
    Bucket: bucket(),
    Key: key,
    Body: pdfBuffer,
    ContentType: 'application/pdf',
    ServerSideEncryption: 'aws:kms',
    Metadata: { 'generated-at': new Date().toISOString() },
  }));
  return key;
}

export async function getGeneratedPdfUrl(caseId: string, templateType: string): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: bucket(),
    Key: `${PREFIX}/generated/${caseId}/${templateType}.pdf`,
    ResponseContentDisposition: `attachment; filename="LedgerHound-${templateType}-${caseId}.pdf"`,
  });
  return getSignedUrl(getS3(), command, { expiresIn: 86400 }); // 24h
}

export async function listResearchedCountries(): Promise<string[]> {
  const res = await getS3().send(new ListObjectsV2Command({
    Bucket: bucket(),
    Prefix: `${PREFIX}/research/`,
  }));
  if (!res.Contents) return [];
  return res.Contents
    .map(obj => obj.Key?.replace(`${PREFIX}/research/`, '').replace('.json', '') || '')
    .filter(Boolean);
}
