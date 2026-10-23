import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import type { CreateEmailOptions } from 'resend';

/**
 * The Emergency Pack manifest: written once (If-None-Match) after EVERY
 * document of the pack is stored and before its email is sent. It is:
 *  - the "complete set" signal for /api/emergency/status (partial sets of
 *    PDFs from an interrupted run have no manifest);
 *  - the frozen email, so a retry sends the identical request (Resend
 *    dedupes it) with links to the same documents.
 */
export interface PackManifest {
  caseId: string;
  createdAt: string;
  documents: { type: string; label: string; key: string; url: string }[];
  email: CreateEmailOptions;
}

export const packManifestKey = (caseId: string) => `legal-packs/cases/${caseId}/manifest.json`;

const getS3 = () =>
  new S3Client({
    region: process.env.AWS_REGION || 'eu-central-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  });
const bucket = () => process.env.AWS_S3_BUCKET!;

function isStatus(err: unknown, codes: number[], names: string[]): boolean {
  const e = err as { name?: string; $metadata?: { httpStatusCode?: number } };
  return codes.includes(e.$metadata?.httpStatusCode ?? -1) || names.includes(e.name ?? '');
}

export async function readPackManifest(caseId: string): Promise<PackManifest | null> {
  try {
    const r = await getS3().send(new GetObjectCommand({ Bucket: bucket(), Key: packManifestKey(caseId) }));
    const text = await r.Body?.transformToString();
    return text ? (JSON.parse(text) as PackManifest) : null;
  } catch (err) {
    if (isStatus(err, [404], ['NoSuchKey'])) return null;
    throw err;
  }
}

/** Writes the manifest once; if another run wrote it first, returns theirs. */
export async function writePackManifestOnce(manifest: PackManifest): Promise<PackManifest> {
  try {
    await getS3().send(new PutObjectCommand({
      Bucket: bucket(),
      Key: packManifestKey(manifest.caseId),
      Body: JSON.stringify(manifest),
      ContentType: 'application/json',
      ServerSideEncryption: 'aws:kms',
      IfNoneMatch: '*',
    }));
    return manifest;
  } catch (err) {
    if (!isStatus(err, [412], ['PreconditionFailed'])) throw err;
    return (await readPackManifest(manifest.caseId))!;
  }
}
