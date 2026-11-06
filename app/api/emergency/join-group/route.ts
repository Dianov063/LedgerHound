import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { checkRateLimit } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/* ── S3 client ── */
const getS3 = () =>
  new S3Client({
    region: process.env.AWS_REGION || 'eu-central-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  });

const bucket = () => process.env.AWS_S3_BUCKET!;

/*
 * The list of people affected by a platform (review/44, option A).
 *
 * One record per person and platform: scam-database/groups/<slug>/members/<id>.json,
 * where <id> is a hash of the platform and the normalised email. The record links the
 * email to the country, loss and case it came with. It is created with If-None-Match,
 * so two parallel joins cannot overwrite each other, and a repeat join finds the
 * existing record instead of counting the person twice.
 *
 * Nothing here proves who sent the request, so an existing record is never changed
 * by it: knowing someone's email must not let anyone rewrite their entry. Editing
 * needs a confirmed owner (e.g. a link sent to that email) and is not offered yet.
 * For the same reason the answer is identical whether or not the email was already
 * on the list, and carries no counts that would reveal it.
 *
 * The older one-file-per-group format (scam-database/groups/<slug>.json, emails kept
 * apart from amounts) is left untouched; moving it is a separate, backed-up step.
 */
interface GroupMember {
  slug: string;
  platformName: string;
  email: string;
  country: string;
  lossAmount: number;
  scamType: string;
  caseId: string;
  walletAddress: string;
  joinedAt: string;
  updatedAt: string;
}

/* ── Helpers ── */
const slugify = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

const membersPrefix = (slug: string) => `scam-database/groups/${slug}/members/`;
const memberId = (slug: string, email: string) =>
  createHash('sha256').update(`${slug}\n${email.trim().toLowerCase()}`).digest('hex').slice(0, 32);

const isPreconditionFailed = (err: any) =>
  err?.$metadata?.httpStatusCode === 412 || err?.name === 'PreconditionFailed';

/** Create the record only if it does not exist yet (412 otherwise). */
async function createMember(key: string, member: GroupMember) {
  await getS3().send(new PutObjectCommand({
    Bucket: bucket(),
    Key: key,
    Body: JSON.stringify(member),
    ContentType: 'application/json',
    ServerSideEncryption: 'aws:kms',
    IfNoneMatch: '*',
  }));
}

export async function POST(req: NextRequest) {
  try {
    /* ── Rate limiting (distributed via Upstash) ── */
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
    const rl = await checkRateLimit(ip, { name: 'emergency-join-group', limit: 3, windowSec: 3600 });
    if (!rl.success) {
      return NextResponse.json({ error: 'Rate limit exceeded. Try again later.' }, { status: 429 });
    }

    /* ── Parse body ── */
    const body = await req.json().catch(() => null);
    const { caseId, email: rawEmail, country, walletAddress, platformName, lossAmount, scamType } = body ?? {};
    const email = typeof rawEmail === 'string' ? rawEmail.trim() : rawEmail;

    /* ── Validate ── */
    if (!caseId || typeof caseId !== 'string') {
      return NextResponse.json({ error: 'Missing caseId' }, { status: 400 });
    }

    if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }

    if (!platformName || typeof platformName !== 'string') {
      return NextResponse.json({ error: 'Missing platformName' }, { status: 400 });
    }

    if (!lossAmount || typeof lossAmount !== 'number' || !Number.isFinite(lossAmount) || lossAmount <= 0) {
      return NextResponse.json({ error: 'Invalid lossAmount' }, { status: 400 });
    }

    /* ── Generate slug ── */
    const slug = slugify(platformName).slice(0, 60);
    if (!slug) {
      return NextResponse.json({ error: 'Invalid platformName' }, { status: 400 });
    }

    const now = new Date().toISOString();
    const key = `${membersPrefix(slug)}${memberId(slug, email)}.json`;
    const fresh: GroupMember = {
      slug,
      platformName: platformName.slice(0, 200),
      email: email.trim(),
      country: typeof country === 'string' ? country.slice(0, 8) : '',
      lossAmount,
      scamType: typeof scamType === 'string' ? scamType.slice(0, 40) : '',
      caseId: caseId.slice(0, 80),
      walletAddress: typeof walletAddress === 'string' ? walletAddress.slice(0, 128) : '',
      joinedAt: now,
      updatedAt: now,
    };

    /* ── Add the person once; an existing record is left exactly as it is ── */
    try {
      await createMember(key, fresh);
      console.log(`[emergency/join-group] Added a member to "${slug}"`);
    } catch (err) {
      // 412: this email is already on the list (or joined at the same moment). Keep it.
      if (!isPreconditionFailed(err)) throw err;
    }

    return NextResponse.json({ success: true, groupSlug: slug });
  } catch (err: any) {
    console.error('[emergency/join-group] Error:', err?.name || err);
    return NextResponse.json(
      { error: 'Failed to join group' },
      { status: 500 },
    );
  }
}
