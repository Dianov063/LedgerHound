import { getStats, getPlatformIndex } from '@/lib/scam-db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    console.log('[stats/route] Fetching stats...');
    const [stats, platforms] = await Promise.all([
      getStats(),
      getPlatformIndex(),
    ]);
    console.log('[stats/route] Stats:', JSON.stringify(stats));
    console.log('[stats/route] Platform count:', platforms.length);

    // If stats show 0 but platforms exist, recalculate from index
    if (stats.totalPlatforms === 0 && platforms.length > 0) {
      console.log('[stats/route] Stats stale — recalculating from platform index');
      stats.totalPlatforms = platforms.length;
      stats.totalReports = platforms.reduce((sum, p) => sum + p.victims, 0);
      stats.totalLoss = platforms.reduce((sum, p) => sum + p.totalLoss, 0);
    }

    return Response.json(stats);
  } catch (err: any) {
    console.error('[scam-database/stats]', err);
    return Response.json({ error: err.message || 'Failed to fetch stats' }, { status: 500 });
  }
}
