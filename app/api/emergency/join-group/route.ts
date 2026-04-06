import { NextRequest, NextResponse } from 'next/server';
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';

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

/* ── Types ── */
interface VictimGroup {
  platformName: string;
  slug: string;
  victims: number;
  totalLoss: number;
  threshold: number;
  jurisdictions: string[];
  emails: string[]; // encrypted/hashed in production
  createdAt: string;
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

async function streamToString(stream: any): Promise<string> {
  const chunks: Uint8Array[] = [];
  for await (const chunk of stream) {
    chunks.push(typeof chunk === 'string' ? new TextEncoder().encode(chunk) : chunk);
  }
  return new TextDecoder().decode(Buffer.concat(chunks));
}

async function s3Get(key: string): Promise<any | null> {
  try {
    const data = await getS3().send(
      new GetObjectCommand({ Bucket: bucket(), Key: key }),
    );
    const str = await streamToString(data.Body);
    return JSON.parse(str);
  } catch (err: any) {
    if (err.name === 'NoSuchKey' || err.$metadata?.httpStatusCode === 404) return null;
    throw err;
  }
}

async function s3Put(key: string, data: any): Promise<void> {
  await getS3().send(
    new PutObjectCommand({
      Bucket: bucket(),
      Key: key,
      Body: JSON.stringify(data),
      ContentType: 'application/json',
    }),
  );
}

/* ── Rate limiter: 3/hour per IP ── */
const rateLimit = new Map<string, { count: number; reset: number }>();

export async function POST(req: NextRequest) {
  try {
    /* ── Rate limiting ── */
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
    const now = Date.now();
    const entry = rateLimit.get(ip);
    if (entry && entry.reset > now) {
      if (entry.count >= 3) {
        return NextResponse.json(
          { error: 'Rate limit exceeded. Try again later.' },
          { status: 429 },
        );
      }
      entry.count++;
    } else {
      rateLimit.set(ip, { count: 1, reset: now + 3600000 });
    }

    /* ── Parse body ── */
    const { caseId, email, country, walletAddress, platformName, lossAmount, scamType } =
      await req.json();

    /* ── Validate ── */
    if (!caseId) {
      return NextResponse.json({ error: 'Missing caseId' }, { status: 400 });
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }

    if (!platformName) {
      return NextResponse.json({ error: 'Missing platformName' }, { status: 400 });
    }

    if (!lossAmount || typeof lossAmount !== 'number' || lossAmount <= 0) {
      return NextResponse.json({ error: 'Invalid lossAmount' }, { status: 400 });
    }

    /* ── Generate slug ── */
    const slug = slugify(platformName);
    if (!slug) {
      return NextResponse.json({ error: 'Invalid platformName' }, { status: 400 });
    }

    /* ── Load or create group ── */
    const groupKey = `scam-database/groups/${slug}.json`;
    let group: VictimGroup | null = await s3Get(groupKey);

    const nowISO = new Date().toISOString();

    if (!group) {
      group = {
        platformName,
        slug,
        victims: 0,
        totalLoss: 0,
        threshold: 500000,
        jurisdictions: [],
        emails: [],
        createdAt: nowISO,
        updatedAt: nowISO,
      };
    }

    /* ── Add victim to group ── */
    group.victims++;
    group.totalLoss += lossAmount;

    if (country && !group.jurisdictions.includes(country)) {
      group.jurisdictions.push(country);
    }

    if (!group.emails.includes(email)) {
      group.emails.push(email);
    }

    group.threshold = Math.max(group.totalLoss * 2, 500000);
    group.updatedAt = nowISO;

    /* ── Save back to S3 ── */
    await s3Put(groupKey, group);

    const progress = Math.round((group.totalLoss / group.threshold) * 100);

    console.log(
      `[emergency/join-group] Victim joined group "${slug}": ${group.victims} victims, $${group.totalLoss} total loss`,
    );

    return NextResponse.json({
      success: true,
      groupSlug: slug,
      victims: group.victims,
      totalLoss: group.totalLoss,
      threshold: group.threshold,
      progress,
    });
  } catch (err: any) {
    console.error('[emergency/join-group] Error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to join group' },
      { status: 500 },
    );
  }
}
