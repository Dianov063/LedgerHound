import { NextRequest } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

export const dynamic = 'force-dynamic';

const getS3 = () =>
  new S3Client({
    region: process.env.AWS_REGION || 'eu-central-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  });

const ALLOWED_TYPES: Record<string, string> = {
  'application/pdf': 'pdf',
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
};

const MAX_SIZE = 10 * 1024 * 1024; // 10MB

const rateLimit = new Map<string, { count: number; reset: number }>();

export async function POST(req: NextRequest) {
  try {
    // Rate limit: 10 uploads per hour
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
    const now = Date.now();
    const entry = rateLimit.get(ip);
    if (entry && entry.reset > now) {
      if (entry.count >= 10) {
        return Response.json({ error: 'Upload rate limit exceeded.' }, { status: 429 });
      }
      entry.count++;
    } else {
      rateLimit.set(ip, { count: 1, reset: now + 3600000 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return Response.json({ error: 'No file provided.' }, { status: 400 });
    }

    const ext = ALLOWED_TYPES[file.type];
    if (!ext) {
      return Response.json({ error: 'File type not allowed. Use PDF, PNG, JPG, or WebP.' }, { status: 400 });
    }

    if (file.size > MAX_SIZE) {
      return Response.json({ error: 'File too large. Maximum 10MB.' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    const key = `scam-database/disputes/evidence/${fileId}.${ext}`;

    await getS3().send(
      new PutObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET!,
        Key: key,
        Body: buffer,
        ContentType: file.type,
      })
    );

    return Response.json({ key, fileName: file.name });
  } catch (err: any) {
    console.error('[dispute/upload]', err);
    return Response.json({ error: 'Upload failed.' }, { status: 500 });
  }
}
