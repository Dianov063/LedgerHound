import { NextRequest } from 'next/server';
import { getPlatformBySlug, getReportsForPlatform } from '@/lib/scam-db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get('slug');

    if (!slug) {
      return Response.json({ error: 'Missing slug parameter' }, { status: 400 });
    }

    const platform = await getPlatformBySlug(slug);
    if (!platform) {
      return Response.json({ error: 'Platform not found' }, { status: 404 });
    }

    // Fetch individual reports (strip private data)
    const reports = await getReportsForPlatform(platform.reportIds);
    const safeReports = reports.map(r => ({
      id: r.id,
      createdAt: r.createdAt,
      platformType: r.platformType,
      scamAddress: r.scamAddress,
      network: r.network,
      lossAmount: r.lossAmount,
      lossCurrency: r.lossCurrency,
      lossDate: r.lossDate,
      description: r.description,
      blockchainConfirmed: r.blockchainConfirmed,
      trustTier: r.trustTier,
      status: r.status,
      // Never expose: reporterEmail, txHash
    }));

    return Response.json({ platform, reports: safeReports });
  } catch (err: any) {
    console.error('[scam-database/platform]', err);
    return Response.json({ error: err.message || 'Failed to fetch platform' }, { status: 500 });
  }
}
