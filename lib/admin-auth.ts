import { timingSafeEqual } from 'crypto';
import { checkRateLimit } from '@/lib/rate-limit';

/**
 * Shared admin gate for every `/api/**` admin route.
 *
 * Replaces the per-route pattern that (a) compared the secret with `!==`
 * (non-constant-time) and (b) rate-limited auth attempts in a process-local Map
 * that resets on cold start and is not shared across serverless instances,
 * and which several routes lacked entirely.
 *
 * Returns a `Response` to send back when the request is rejected (rate-limited
 * or unauthorized), or `null` when the caller is a verified admin.
 */
export async function requireAdmin(req: Request): Promise<Response | null> {
  const provided = req.headers.get('x-admin-key') || '';
  const expected = process.env.ADMIN_PASSWORD || '';

  if (expected && safeEqual(provided, expected)) return null;

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const rl = await checkRateLimit(ip, { name: 'admin-auth', limit: 5, windowSec: 60 });
  if (!rl.success) {
    return Response.json({ error: 'Too many auth attempts. Try again later.' }, { status: 429 });
  }
  return Response.json({ error: 'Unauthorized' }, { status: 401 });
}

/** Constant-time string comparison that does not leak length via early return. */
function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a, 'utf8');
  const bb = Buffer.from(b, 'utf8');
  // timingSafeEqual requires equal lengths; hash-independent length guard first.
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}
