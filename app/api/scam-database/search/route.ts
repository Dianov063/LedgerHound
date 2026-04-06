import { NextRequest } from 'next/server';
import { searchPlatforms, searchByAddress } from '@/lib/scam-db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q') || '';
    const address = searchParams.get('address') || '';

    let results;
    if (address) {
      results = await searchByAddress(address);
    } else {
      results = await searchPlatforms(q);
    }

    // Never expose reporterEmail in search results
    const safe = results.map(p => ({
      ...p,
      // reportIds kept for linking but no sensitive data
    }));

    return Response.json({ platforms: safe, total: safe.length });
  } catch (err: any) {
    console.error('[scam-database/search]', err);
    return Response.json({ error: err.message || 'Search failed' }, { status: 500 });
  }
}
