import { NextRequest, NextResponse } from 'next/server';
import { generateEmergencyPack } from '@/lib/generateEmergencyPack';
import { requireAdmin } from '@/lib/admin-auth';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const maxDuration = 60; // PDF rendering can be slow

// SECURITY: the real, paid Emergency Pack is generated from the Stripe webhook
// (lib/generateEmergencyPack) AFTER payment. This HTTP route is an admin/ops-only
// manual regeneration tool — it must NOT be publicly callable, otherwise anyone
// could generate the $79 product for free, overwrite another buyer's case PDFs,
// or spam arbitrary emails with download links via our Resend account.
export async function POST(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  try {
    const body = await req.json();
    const {
      caseId,
      countryCode,
      email,
      victimName,
      lossAmount,
      scamType,
      walletAddress,
      txHashes,
      description,
    } = body;

    // Validate required fields
    if (!caseId || !countryCode || !email) {
      return NextResponse.json(
        { error: 'Missing required fields: caseId, countryCode, email' },
        { status: 400 },
      );
    }

    const txHashArray = Array.isArray(txHashes) ? txHashes : txHashes ? [txHashes] : [];

    const result = await generateEmergencyPack({
      caseId,
      countryCode,
      email,
      victimName: victimName || '',
      lossAmount: lossAmount || 0,
      scamType: scamType || '',
      walletAddress: walletAddress || '',
      txHashes: txHashArray,
      description: description || '',
    });

    return NextResponse.json(result);
  } catch (err: unknown) {
    logger.error({ err }, '[generate-pack] Failed');
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Internal server error' }, { status: 500 });
  }
}
