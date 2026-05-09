/**
 * GET /api/blog-agent/validation-stats?days=30
 *
 * Returns aggregated link-stripping stats for the last N days (default 30).
 * Auth: x-admin-key header matching ADMIN_PASSWORD.
 *
 * Use this to:
 *   - Spot whether DeepSeek is improving or getting worse at avoiding bad links
 *   - Find the most-frequently-hallucinated paths (signals: maybe whitelist
 *     prompt isn't being read; maybe a specific page should be added; maybe
 *     a slug name is too tempting)
 *   - Detect mode-specific regressions (e.g., translate suddenly mangling URLs)
 */

import { NextRequest } from 'next/server';
import { getValidationStats } from '@/lib/blog/validation-log';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const adminKey = req.headers.get('x-admin-key');
  if (!process.env.ADMIN_PASSWORD || adminKey !== process.env.ADMIN_PASSWORD) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(req.url);
  const daysParam = url.searchParams.get('days');
  const days = Math.max(1, Math.min(180, parseInt(daysParam || '30', 10) || 30));

  try {
    const stats = await getValidationStats(days);
    return Response.json({ ok: true, stats });
  } catch (err: any) {
    return Response.json({ error: err.message || 'Failed to compute stats' }, { status: 500 });
  }
}
