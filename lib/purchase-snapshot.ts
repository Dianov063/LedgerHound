import { createHash, randomBytes } from 'node:crypto';
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';

/**
 * Immutable purchase snapshot of an Emergency checkout.
 *
 * Written once (If-None-Match) by /api/emergency/checkout BEFORE the payment
 * link exists. Its id and the SHA-256 of its exact bytes go into the Stripe
 * session metadata (signed back to us in the webhook event), into the session
 * record and into the durable webhook job. The processor builds the purchase
 * only from this snapshot, so editing the case afterwards, or opening another
 * checkout for it, cannot change what an earlier link bought.
 *
 * Reading rules (lib/checkout-processor.ts):
 *  - any S3 error other than a confirmed 404 (throttling, 5xx, network, access
 *    denied) is retryable: the attempt stops before generation, nothing is
 *    emailed or marked complete, and the job is retried;
 *  - a confirmed 404, unreadable JSON, a hash mismatch or fields that do not
 *    match the session put the order in manual review. It is never generated
 *    from substitute data.
 */

export const SNAPSHOT_PREFIX = 'emergency-purchases/';
export const PURCHASE_ID_RE = /^pur_[0-9a-f]{24}$/;
export const SNAPSHOT_SHA_RE = /^[0-9a-f]{64}$/;

export const snapshotKey = (caseId: string, purchaseId: string) => `${SNAPSHOT_PREFIX}${caseId}/${purchaseId}.json`;
/** Snapshot frozen at processing time for a session created before snapshots existed. */
export const legacySnapshotKey = (caseId: string, sessionId: string) => `${SNAPSHOT_PREFIX}${caseId}/legacy-${sessionId}.json`;

export interface PurchaseRef {
  purchaseId: string;
  caseId: string;
  product: string;
  snapshotSha256: string;
}

export interface PurchaseSnapshot {
  version: 1;
  purchaseId: string;
  caseId: string;
  product: string;
  createdAt: string;
  /** What was charged. Never a substitute for the loss amount. */
  amountCents: number;
  currency: 'usd';
  /** 'checkout': written before the link. 'legacy-verified': rebuilt for an older session after checks. */
  source: 'checkout' | 'legacy-verified';
  /** Only for legacy snapshots: the session they were verified against. */
  sessionId?: string;
  /** The case exactly as submitted for this purchase (owner secret hash removed). */
  case: Record<string, unknown>;
}

/** The order cannot be completed from its data; an operator has to decide. Never retried automatically. */
export class ManualReviewError extends Error {
  constructor(readonly code: string, message: string) {
    super(`Manual review (${code}): ${message}`);
    this.name = 'ManualReviewError';
  }
}

/** A read failed for a reason that may pass (S3 outage, throttling, access). The attempt is retried. */
export class RetryableReadError extends Error {
  constructor(what: string, cause: unknown) {
    const e = cause as { name?: string; $metadata?: { httpStatusCode?: number } };
    super(`Could not read ${what} (${e?.name || 'Error'}${e?.$metadata?.httpStatusCode ? ' ' + e.$metadata.httpStatusCode : ''}); will retry`);
    this.name = 'RetryableReadError';
  }
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

export function isNotFound(err: unknown): boolean {
  const e = err as { name?: string; $metadata?: { httpStatusCode?: number } };
  return e?.$metadata?.httpStatusCode === 404 || e?.name === 'NoSuchKey' || e?.name === 'NotFound';
}

function isPreconditionFailed(err: unknown): boolean {
  const e = err as { name?: string; $metadata?: { httpStatusCode?: number } };
  return e?.$metadata?.httpStatusCode === 412 || e?.name === 'PreconditionFailed' || e?.name === 'ConditionalCheckFailed';
}

export const sha256 = (text: string) => createHash('sha256').update(text, 'utf8').digest('hex');

export function newPurchaseId(): string {
  return `pur_${randomBytes(12).toString('hex')}`;
}

/** Reads an object as text: null only for a confirmed 404; any other failure is retryable. */
export async function readText(key: string, what: string): Promise<string | null> {
  try {
    const r = await getS3().send(new GetObjectCommand({ Bucket: bucket(), Key: key }));
    const text = await r.Body?.transformToString();
    return text ?? '';
  } catch (err) {
    if (isNotFound(err)) return null;
    throw new RetryableReadError(what, err);
  }
}

/**
 * Writes a new snapshot once. Throws on any failure, including an existing
 * object (a purchase id is never reused), so no payment link is created
 * without its own snapshot.
 */
export async function writeSnapshot(snapshot: PurchaseSnapshot): Promise<{ key: string; snapshotSha256: string }> {
  const body = JSON.stringify(snapshot);
  const key = snapshotKey(snapshot.caseId, snapshot.purchaseId);
  await getS3().send(new PutObjectCommand({
    Bucket: bucket(),
    Key: key,
    Body: body,
    ContentType: 'application/json',
    ServerSideEncryption: 'aws:kms',
    IfNoneMatch: '*',
  }));
  return { key, snapshotSha256: sha256(body) };
}

/** The reference carried by the session metadata, or null when the session has none (legacy). */
export function purchaseRefFrom(metadata: Record<string, string> | undefined): PurchaseRef | null {
  if (!metadata?.purchaseId && !metadata?.snapshotSha256) return null;
  return {
    purchaseId: metadata.purchaseId || '',
    caseId: metadata.caseId || '',
    product: metadata.product || '',
    snapshotSha256: metadata.snapshotSha256 || '',
  };
}

/** Loads the snapshot the session points to and proves it is the one written for that link. */
export async function readSnapshot(ref: PurchaseRef): Promise<PurchaseSnapshot> {
  if (!PURCHASE_ID_RE.test(ref.purchaseId) || !SNAPSHOT_SHA_RE.test(ref.snapshotSha256) || !ref.caseId) {
    throw new ManualReviewError('snapshot_reference_invalid', 'the session carries an incomplete snapshot reference');
  }
  const text = await readText(snapshotKey(ref.caseId, ref.purchaseId), 'purchase snapshot');
  if (text === null) throw new ManualReviewError('snapshot_missing', 'the purchase snapshot does not exist');
  if (sha256(text) !== ref.snapshotSha256) {
    throw new ManualReviewError('snapshot_integrity', 'the purchase snapshot differs from the one recorded with the payment link');
  }
  let snapshot: PurchaseSnapshot;
  try {
    snapshot = JSON.parse(text) as PurchaseSnapshot;
  } catch {
    throw new ManualReviewError('snapshot_integrity', 'the purchase snapshot is not valid JSON');
  }
  if (snapshot?.version !== 1 || snapshot.purchaseId !== ref.purchaseId || snapshot.caseId !== ref.caseId
    || snapshot.product !== ref.product || !snapshot.case || typeof snapshot.case !== 'object') {
    throw new ManualReviewError('snapshot_integrity', 'the purchase snapshot does not belong to this payment');
  }
  return snapshot;
}

/**
 * Freezes the legacy snapshot once. If another attempt froze it first, that
 * version wins (same session, so the same verified data).
 */
export async function freezeLegacySnapshot(snapshot: PurchaseSnapshot): Promise<PurchaseSnapshot> {
  const key = legacySnapshotKey(snapshot.caseId, snapshot.sessionId!);
  try {
    await getS3().send(new PutObjectCommand({
      Bucket: bucket(),
      Key: key,
      Body: JSON.stringify(snapshot),
      ContentType: 'application/json',
      ServerSideEncryption: 'aws:kms',
      IfNoneMatch: '*',
    }));
    return snapshot;
  } catch (err) {
    if (!isPreconditionFailed(err)) throw err;
    const existing = await readLegacySnapshot(snapshot.caseId, snapshot.sessionId!);
    if (!existing) throw new RetryableReadError('legacy purchase snapshot', err);
    return existing;
  }
}

export async function readLegacySnapshot(caseId: string, sessionId: string): Promise<PurchaseSnapshot | null> {
  const text = await readText(legacySnapshotKey(caseId, sessionId), 'legacy purchase snapshot');
  if (text === null) return null;
  try {
    const snapshot = JSON.parse(text) as PurchaseSnapshot;
    if (snapshot.source === 'legacy-verified' && snapshot.caseId === caseId && snapshot.sessionId === sessionId && snapshot.case) return snapshot;
  } catch { /* falls through */ }
  throw new ManualReviewError('snapshot_integrity', 'the frozen legacy snapshot is unreadable');
}

/** Positive finite loss amount, or null. The price of the pack is never used in its place. */
export function lossAmountOf(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const n = typeof value === 'number' ? value : parseFloat(String(value));
  return Number.isFinite(n) && n > 0 ? n : null;
}
