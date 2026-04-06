import { NextRequest } from 'next/server';
import { saveReport, isTxidUsed, calcRecoveryScore } from '@/lib/scam-db';
import type { ScamType } from '@/lib/scam-db';

const VALID_TYPES: ScamType[] = ['fake_exchange', 'pig_butchering', 'rug_pull', 'phishing', 'ponzi', 'other'];

/* Rate limiting */
const rateLimit = new Map<string, { count: number; reset: number }>();

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
    const now = Date.now();
    const entry = rateLimit.get(ip);
    if (entry && entry.reset > now) {
      if (entry.count >= 3) {
        return Response.json({ error: 'Too many reports. Try again in 1 hour.' }, { status: 429 });
      }
      entry.count++;
    } else {
      rateLimit.set(ip, { count: 1, reset: now + 3600000 });
    }

    const body = await req.json();
    const {
      platformName,
      platformUrl,
      platformUrls,
      platformType,
      scamAddress,
      network,
      txHash,
      lossAmount,
      lossCurrency,
      lossDate,
      description,
      reporterEmail,
    } = body;

    /* Validate required fields */
    if (!platformName || typeof platformName !== 'string' || platformName.trim().length < 2) {
      return Response.json({ error: 'Platform name is required (min 2 characters).' }, { status: 400 });
    }
    if (!platformType || !VALID_TYPES.includes(platformType)) {
      return Response.json({ error: `Invalid scam type. Must be one of: ${VALID_TYPES.join(', ')}` }, { status: 400 });
    }
    if (!description || typeof description !== 'string' || description.trim().length < 100) {
      return Response.json({ error: 'Description is required (minimum 100 characters).' }, { status: 400 });
    }

    /* Check TXID uniqueness */
    if (txHash && typeof txHash === 'string' && txHash.trim().length > 0) {
      const used = await isTxidUsed(txHash.trim());
      if (used) {
        return Response.json({ error: 'This transaction hash has already been used in a previous report.' }, { status: 409 });
      }
    }

    /* Auto-verify TXID via our /api/tx endpoint */
    let blockchainConfirmed = false;
    let trustTier: 1 | 2 | 3 = 1; // Default: community
    let verifiedTxData: any = null;

    if (txHash && txHash.trim()) {
      try {
        const txNet = network || 'auto';
        const baseUrl = req.nextUrl.origin;
        const txRes = await fetch(`${baseUrl}/api/tx`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ hash: txHash.trim(), network: txNet }),
        });
        const txData = await txRes.json();
        if (!txData.error && txData.hash) {
          blockchainConfirmed = true;
          trustTier = 2; // Blockchain verified
          verifiedTxData = {
            from: txData.from,
            to: txData.to,
            value: txData.value,
            token: txData.token,
            network: txData.network,
            networkLabel: txData.networkLabel,
            timestamp: txData.timestamp,
          };
        }
      } catch {
        // TX verification failed — still accept report as Tier 1
      }
    }

    /* Save report */
    const { id, report } = await saveReport({
      platformName: platformName.trim(),
      platformUrl: platformUrl?.trim() || undefined,
      platformUrls: Array.isArray(platformUrls) ? platformUrls.filter(Boolean).map((u: string) => u.trim()) : undefined,
      platformType,
      scamAddress: verifiedTxData?.to || scamAddress?.trim() || undefined,
      network: verifiedTxData?.network || network || undefined,
      txHash: txHash?.trim() || undefined,
      lossAmount: typeof lossAmount === 'number' ? lossAmount : (parseFloat(lossAmount) || undefined),
      lossCurrency: lossCurrency || 'USD',
      lossDate: lossDate || undefined,
      verified: blockchainConfirmed,
      verifiedAt: blockchainConfirmed ? new Date().toISOString() : undefined,
      blockchainConfirmed,
      description: description.trim(),
      reporterEmail: reporterEmail?.trim() || undefined,
      status: 'pending',
      trustTier,
    });

    /* Calculate recovery score */
    const recoveryScore = calcRecoveryScore({
      lossDate: report.lossDate,
      blockchainConfirmed: report.blockchainConfirmed,
      network: report.network,
      lossAmount: report.lossAmount,
    });

    return Response.json({
      reportId: id,
      trustTier: report.trustTier,
      verified: report.blockchainConfirmed,
      verifiedTxData,
      recoveryScore,
      message: blockchainConfirmed
        ? 'Report submitted and blockchain-verified. It will be reviewed by our team.'
        : 'Report submitted. It will be reviewed by our team.',
    });
  } catch (err: any) {
    console.error('[scam-database/report]', err);
    return Response.json({ error: err.message || 'Failed to submit report' }, { status: 500 });
  }
}
