import { getStats } from '@/lib/scam-db';

export async function GET() {
  try {
    const stats = await getStats();
    return Response.json(stats);
  } catch (err: any) {
    console.error('[scam-database/stats]', err);
    return Response.json({ error: err.message || 'Failed to fetch stats' }, { status: 500 });
  }
}
