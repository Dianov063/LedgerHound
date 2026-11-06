import { S3Client, GetObjectCommand, ListObjectsV2Command, PutObjectCommand } from '@aws-sdk/client-s3';
import type { CreateEmailOptions } from 'resend';
import type { EmailTransport } from '@/lib/idempotent-email';
import { ManualReviewError, RetryableReadError } from '@/lib/purchase-snapshot';

/**
 * The Emergency Pack manifest: written once (If-None-Match) after EVERY
 * document of the pack is stored and before its email is sent. It is:
 *  - the "complete set" signal for /api/emergency/status (partial sets of
 *    PDFs from an interrupted run have no manifest);
 *  - the frozen email, so a retry sends the identical idempotent request with
 *    links to the same documents.
 */
export interface PackManifest {
  caseId: string;
  createdAt: string;
  documents: { type: string; label: string; key: string; url: string }[];
  email: CreateEmailOptions;
  /** Missing only on manifests written before selectable transports existed. */
  emailTransport?: EmailTransport;
  /** Payment the pack was built for; missing on manifests written before purchase snapshots. */
  paymentId?: string;
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

/**
 * Owner of a case's document set: the one payment whose pack may be stored
 * under legal-packs/cases/<caseId>/. Taken with If-None-Match BEFORE the
 * forensic report, the first PDF or any email of a pack, so documents of two
 * purchases can never mix (PDFs are stored once per case key and an earlier
 * attempt's file is kept). Another payment finds the owner and goes to
 * manual review.
 *
 * Compatibility: documents that exist without an owner record (written
 * before owners existed, or by the admin generate-pack tool) cannot be
 * attributed to any payment, so a payment finding them goes to manual review
 * instead of adopting them.
 */
export const packOwnerKey = (caseId: string) => `legal-packs/cases/${caseId}/owner.json`;

export interface PackOwner {
  caseId: string;
  paymentId: string;
  purchaseId?: string;
  claimedAt: string;
}

async function readPackOwner(caseId: string): Promise<PackOwner | null> {
  try {
    const r = await getS3().send(new GetObjectCommand({ Bucket: bucket(), Key: packOwnerKey(caseId) }));
    const text = (await r.Body?.transformToString()) || '';
    try {
      const owner = JSON.parse(text) as PackOwner;
      if (owner && typeof owner.paymentId === 'string' && owner.paymentId) return owner;
    } catch { /* below */ }
    throw new ManualReviewError('pack_owner_unreadable', 'the owner record of the case documents is unreadable');
  } catch (err) {
    if (err instanceof ManualReviewError) throw err;
    if (isStatus(err, [404], ['NoSuchKey'])) return null;
    throw new RetryableReadError('pack owner', err);
  }
}

function sameOwner(owner: PackOwner, paymentId: string): void {
  if (owner.paymentId !== paymentId) {
    throw new ManualReviewError('case_paid_twice', 'the documents of this case belong to another payment');
  }
}

/** Makes `paymentId` the owner of the case's document set, or proves it already is. */
export async function claimPackOwner(caseId: string, paymentId: string, purchaseId?: string): Promise<void> {
  if (!caseId || !paymentId) throw new ManualReviewError('pack_owner_unknown', 'the pack has no case or payment to own it');
  const existing = await readPackOwner(caseId);
  if (existing) return sameOwner(existing, paymentId);

  let objects: string[];
  try {
    const r = await getS3().send(new ListObjectsV2Command({ Bucket: bucket(), Prefix: `legal-packs/cases/${caseId}/`, MaxKeys: 5 }));
    objects = (r.Contents ?? []).map((o) => o.Key || '').filter(Boolean);
  } catch (err) {
    throw new RetryableReadError('pack documents', err);
  }
  if (objects.some((k) => k !== packOwnerKey(caseId))) {
    // Someone may have claimed in between; otherwise these documents have no provable owner.
    const raced = await readPackOwner(caseId);
    if (raced) return sameOwner(raced, paymentId);
    throw new ManualReviewError('pack_artifacts_unowned', 'documents of this case exist without a recorded owner');
  }

  const owner: PackOwner = { caseId, paymentId, ...(purchaseId ? { purchaseId } : {}), claimedAt: new Date().toISOString() };
  try {
    await getS3().send(new PutObjectCommand({
      Bucket: bucket(),
      Key: packOwnerKey(caseId),
      Body: JSON.stringify(owner),
      ContentType: 'application/json',
      ServerSideEncryption: 'aws:kms',
      IfNoneMatch: '*',
    }));
  } catch (err) {
    if (!isStatus(err, [412], ['PreconditionFailed', 'ConditionalCheckFailed'])) throw err;
    const winner = await readPackOwner(caseId);
    if (!winner) throw new RetryableReadError('pack owner', err);
    sameOwner(winner, paymentId);
  }
}
