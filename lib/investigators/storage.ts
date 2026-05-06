/**
 * S3 storage helpers for the Investigator Network.
 *
 * Layout:
 *   investigators/approved/{id}.json     — approved profiles shown publicly
 *   investigators/applications/{id}.json — pending applications
 *   investigators/resumes/{id}.pdf       — uploaded CVs (private)
 *   investigators/contact-requests/{ts}-{investigatorId}.json — public contact form
 */

import { S3Client, GetObjectCommand, PutObjectCommand, ListObjectsV2Command, DeleteObjectCommand } from '@aws-sdk/client-s3';
import type { Investigator, InvestigatorApplication } from './schema';
import { SEED_INVESTIGATORS } from './seed';

const APPROVED_PREFIX = 'investigators/approved/';
const APPLICATIONS_PREFIX = 'investigators/applications/';
const RESUMES_PREFIX = 'investigators/resumes/';
const CONTACT_PREFIX = 'investigators/contact-requests/';

const getS3 = () =>
  new S3Client({
    region: process.env.AWS_REGION || 'eu-central-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  });

const bucket = () => process.env.AWS_S3_BUCKET!;

/* ── Approved investigators ─────────────────────────────────────────── */

export async function listApproved(): Promise<Investigator[]> {
  try {
    const resp = await getS3().send(new ListObjectsV2Command({
      Bucket: bucket(),
      Prefix: APPROVED_PREFIX,
      MaxKeys: 200,
    }));
    const keys = (resp.Contents || []).map((o) => o.Key!).filter(Boolean);
    if (keys.length === 0) return SEED_INVESTIGATORS;

    const settled = await Promise.allSettled(
      keys.map(async (key) => {
        const r = await getS3().send(new GetObjectCommand({ Bucket: bucket(), Key: key }));
        const body = await r.Body?.transformToString();
        return body ? (JSON.parse(body) as Investigator) : null;
      }),
    );
    const real = settled
      .filter((s): s is PromiseFulfilledResult<Investigator | null> => s.status === 'fulfilled')
      .map((s) => s.value)
      .filter((v): v is Investigator => v !== null && v.isApproved && v.isActive);

    // If S3 returned nothing useful, fall back to seed
    if (real.length === 0) return SEED_INVESTIGATORS;
    return real;
  } catch (err) {
    console.error('[investigators/storage] listApproved failed, using seed:', err);
    return SEED_INVESTIGATORS;
  }
}

export async function getApproved(id: string): Promise<Investigator | null> {
  // Check seed first (cheap)
  const seedHit = SEED_INVESTIGATORS.find((s) => s.id === id);
  if (seedHit) return seedHit;

  try {
    const r = await getS3().send(new GetObjectCommand({
      Bucket: bucket(),
      Key: `${APPROVED_PREFIX}${id}.json`,
    }));
    const body = await r.Body?.transformToString();
    return body ? (JSON.parse(body) as Investigator) : null;
  } catch {
    return null;
  }
}

export async function saveApproved(inv: Investigator): Promise<void> {
  await getS3().send(new PutObjectCommand({
    Bucket: bucket(),
    Key: `${APPROVED_PREFIX}${inv.id}.json`,
    Body: JSON.stringify(inv, null, 2),
    ContentType: 'application/json',
    ServerSideEncryption: 'aws:kms',
  }));
}

export async function deleteApproved(id: string): Promise<void> {
  await getS3().send(new DeleteObjectCommand({
    Bucket: bucket(),
    Key: `${APPROVED_PREFIX}${id}.json`,
  }));
}

/* ── Applications ───────────────────────────────────────────────────── */

export async function listApplications(): Promise<Investigator[]> {
  try {
    const resp = await getS3().send(new ListObjectsV2Command({
      Bucket: bucket(),
      Prefix: APPLICATIONS_PREFIX,
      MaxKeys: 200,
    }));
    const keys = (resp.Contents || []).map((o) => o.Key!).filter(Boolean);
    const settled = await Promise.allSettled(
      keys.map(async (key) => {
        const r = await getS3().send(new GetObjectCommand({ Bucket: bucket(), Key: key }));
        const body = await r.Body?.transformToString();
        return body ? (JSON.parse(body) as Investigator) : null;
      }),
    );
    return settled
      .filter((s): s is PromiseFulfilledResult<Investigator | null> => s.status === 'fulfilled')
      .map((s) => s.value)
      .filter((v): v is Investigator => v !== null);
  } catch (err) {
    console.error('[investigators/storage] listApplications failed:', err);
    return [];
  }
}

export async function saveApplication(inv: Investigator): Promise<void> {
  await getS3().send(new PutObjectCommand({
    Bucket: bucket(),
    Key: `${APPLICATIONS_PREFIX}${inv.id}.json`,
    Body: JSON.stringify(inv, null, 2),
    ContentType: 'application/json',
    ServerSideEncryption: 'aws:kms',
  }));
}

export async function getApplication(id: string): Promise<Investigator | null> {
  try {
    const r = await getS3().send(new GetObjectCommand({
      Bucket: bucket(),
      Key: `${APPLICATIONS_PREFIX}${id}.json`,
    }));
    const body = await r.Body?.transformToString();
    return body ? (JSON.parse(body) as Investigator) : null;
  } catch {
    return null;
  }
}

export async function deleteApplication(id: string): Promise<void> {
  await getS3().send(new DeleteObjectCommand({
    Bucket: bucket(),
    Key: `${APPLICATIONS_PREFIX}${id}.json`,
  }));
}

/**
 * Move an application from `applications/` to `approved/`.
 */
export async function approveApplication(id: string): Promise<Investigator | null> {
  const app = await getApplication(id);
  if (!app) return null;
  app.isApproved = true;
  app.isActive = true;
  app.approvedAt = new Date().toISOString();
  app.updatedAt = new Date().toISOString();
  await saveApproved(app);
  await deleteApplication(id);
  return app;
}

/* ── Resumes ────────────────────────────────────────────────────────── */

export async function saveResume(id: string, base64Content: string, fileName: string): Promise<string> {
  const buf = Buffer.from(base64Content, 'base64');
  // Cap at 5 MB
  if (buf.length > 5 * 1024 * 1024) {
    throw new Error('Resume exceeds 5 MB limit');
  }
  const key = `${RESUMES_PREFIX}${id}.pdf`;
  await getS3().send(new PutObjectCommand({
    Bucket: bucket(),
    Key: key,
    Body: buf,
    ContentType: 'application/pdf',
    Metadata: { 'original-filename': fileName.replace(/[^\x20-\x7E]/g, '_').slice(0, 200) },
    ServerSideEncryption: 'aws:kms',
  }));
  return key;
}

/* ── Contact requests (public form on profile) ──────────────────────── */

export interface ContactRequest {
  ts: string;
  investigatorId: string;
  investigatorName: string;
  fromName: string;
  fromEmail: string;
  fromPhone?: string;
  caseSummary: string;        // short description
  estimatedLoss?: string;     // e.g. "$10K-$50K"
  urgency: 'urgent' | 'normal' | 'consultation';
  // Audit
  ip?: string;
  userAgent?: string;
}

export async function saveContactRequest(req: ContactRequest): Promise<string> {
  const ts = req.ts.replace(/[:.]/g, '-');
  const key = `${CONTACT_PREFIX}${ts}-${req.investigatorId}.json`;
  await getS3().send(new PutObjectCommand({
    Bucket: bucket(),
    Key: key,
    Body: JSON.stringify(req, null, 2),
    ContentType: 'application/json',
    ServerSideEncryption: 'aws:kms',
  }));
  return key;
}

/* ── ID generation ──────────────────────────────────────────────────── */

export function generateInvestigatorId(): string {
  // INV-XXXX format
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < 8; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return `inv-${s}`;
}
