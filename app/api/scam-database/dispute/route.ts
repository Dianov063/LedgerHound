import { NextRequest } from 'next/server';
import { saveDispute } from '@/lib/scam-db';

const rateLimit = new Map<string, { count: number; reset: number }>();

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
    const now = Date.now();
    const entry = rateLimit.get(ip);
    if (entry && entry.reset > now) {
      if (entry.count >= 5) {
        return Response.json({ error: 'Rate limit exceeded.' }, { status: 429 });
      }
      entry.count++;
    } else {
      rateLimit.set(ip, { count: 1, reset: now + 3600000 });
    }

    const { platformSlug, reportId, contactEmail, reason } = await req.json();

    if (!contactEmail || typeof contactEmail !== 'string' || !contactEmail.includes('@')) {
      return Response.json({ error: 'Valid contact email is required.' }, { status: 400 });
    }
    if (!reason || typeof reason !== 'string' || reason.trim().length < 20) {
      return Response.json({ error: 'Please provide a detailed reason (minimum 20 characters).' }, { status: 400 });
    }

    const id = await saveDispute({
      platformSlug: platformSlug || undefined,
      reportId: reportId || undefined,
      contactEmail: contactEmail.trim(),
      reason: reason.trim(),
    });

    return Response.json({
      disputeId: id,
      message: 'Your dispute has been submitted and will be reviewed by our team within 48 hours.',
    });
  } catch (err: any) {
    console.error('[scam-database/dispute]', err);
    return Response.json({ error: err.message || 'Failed to submit dispute' }, { status: 500 });
  }
}
