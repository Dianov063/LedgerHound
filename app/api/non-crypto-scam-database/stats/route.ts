import { getNonCryptoStats } from '@/lib/non-crypto-scam-db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const stats = await getNonCryptoStats();
    return Response.json(stats);
  } catch (err: any) {
    console.error('[non-crypto-scam-database/stats]', err);
    return Response.json({ error: err.message || 'Failed to fetch stats' }, { status: 500 });
  }
}
