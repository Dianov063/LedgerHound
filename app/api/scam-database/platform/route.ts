import { NextRequest } from 'next/server';
import { getPublicPlatform } from '@/lib/scam-db';

// Reads request.url (query params) → must be dynamic, like the sibling scam-db
// API routes. Silences the build-time "Dynamic server usage" warning.
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get('slug');

    if (!slug) {
      return Response.json({ error: 'Missing slug parameter' }, { status: 400 });
    }

    // Rejected reports and everything derived from them are not public.
    const found = await getPublicPlatform(slug);
    if (!found) {
      return Response.json({ error: 'Platform not found' }, { status: 404 });
    }
    const { platform, reports } = found;

    // Strip private data from the published reports
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
    return Response.json({ error: 'Failed to fetch platform' }, { status: 500 });
  }
}
