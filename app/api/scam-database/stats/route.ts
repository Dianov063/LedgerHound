import { getPublicStats } from '@/lib/scam-db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    // Totals of what the public may see; rejected reports do not count.
    return Response.json(await getPublicStats());
  } catch (err: any) {
    console.error('[scam-database/stats]', err);
    return Response.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
