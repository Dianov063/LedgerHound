import { timingSafeEqual } from 'crypto';
import { NextRequest } from 'next/server';
import { cleanupExpiredNonCryptoIntake } from '@/lib/non-crypto-scam-db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const maxDuration = 60;

function safeEqual(left: string, right: string): boolean {
  const leftBytes = Buffer.from(left, 'utf8');
  const rightBytes = Buffer.from(right, 'utf8');
  return leftBytes.length === rightBytes.length && timingSafeEqual(leftBytes, rightBytes);
}

function isAuthorized(req: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET || '';
  const authorization = req.headers.get('authorization') || '';
  if (cronSecret && safeEqual(authorization, `Bearer ${cronSecret}`)) return true;

  const adminPassword = process.env.ADMIN_PASSWORD || '';
  const adminToken = req.headers.get('x-admin-token') || '';
  return !!adminPassword && safeEqual(adminToken, adminPassword);
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await cleanupExpiredNonCryptoIntake();
    return Response.json({
      ok: true,
      ...result,
      completedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[cleanup-payment-safety]', error);
    return Response.json({ error: 'Cleanup failed.' }, { status: 500 });
  }
}
