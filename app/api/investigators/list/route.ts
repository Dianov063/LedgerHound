/**
 * GET /api/investigators/list
 *
 * Returns approved investigators (public-safe view).
 *
 * Query params (all optional):
 *   certification: string  — filter by cert code (e.g., "CTCE")
 *   country: string        — filter by country name (substring match)
 *   specialization: string — filter by specialization
 *   language: string       — filter by language code (e.g., "RU")
 *   availability: string   — "available" | "limited" | "unavailable"
 *   page: number           — 1-indexed
 *   pageSize: number       — default 24, max 100
 */

import { NextRequest } from 'next/server';
import { listApproved } from '@/lib/investigators/storage';
import { toPublic } from '@/lib/investigators/schema';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const cert = searchParams.get('certification');
    const country = searchParams.get('country')?.toLowerCase();
    const specialization = searchParams.get('specialization');
    const language = searchParams.get('language')?.toUpperCase();
    const availability = searchParams.get('availability');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '24', 10)));

    const all = await listApproved();

    // Apply filters
    let filtered = all;
    if (cert) filtered = filtered.filter((i) => i.certifications.includes(cert as any));
    if (country) filtered = filtered.filter((i) => i.country.toLowerCase().includes(country));
    if (specialization) filtered = filtered.filter((i) => i.specializations.includes(specialization as any));
    if (language) filtered = filtered.filter((i) => i.languages.includes(language as any));
    if (availability) filtered = filtered.filter((i) => i.availability === availability);

    // Sort: team first, then top investigators, then by name
    filtered.sort((a, b) => {
      if (a.isTeam !== b.isTeam) return a.isTeam ? -1 : 1;
      if (a.topInvestigator !== b.topInvestigator) return a.topInvestigator ? -1 : 1;
      return a.name.localeCompare(b.name);
    });

    const total = filtered.length;
    const start = (page - 1) * pageSize;
    const paged = filtered.slice(start, start + pageSize);

    return Response.json({
      investigators: paged.map(toPublic),
      total,
      page,
      pageSize,
      hasMore: start + pageSize < total,
    });
  } catch (err: any) {
    console.error('[investigators/list] error:', err);
    return Response.json({ error: err.message || 'Failed to list investigators' }, { status: 500 });
  }
}
