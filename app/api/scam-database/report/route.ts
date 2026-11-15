import { NextRequest } from 'next/server';
import { saveReport, isTxidRefused, calcRecoveryScore } from '@/lib/scam-db';
import type { ScamType } from '@/lib/scam-db';
import { checkRateLimit } from '@/lib/rate-limit';
import { getPublicOrigin } from '@/lib/public-origin';
import { isSubmissionKey } from '@/lib/submission-key';

const VALID_TYPES: ScamType[] = ['fake_exchange', 'pig_butchering', 'rug_pull', 'phishing', 'ponzi', 'other'];

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
    const rl = await checkRateLimit(ip, { name: 'scam-report', limit: 3, windowSec: 3600 });
    if (!rl.success) {
      return Response.json({ error: 'Too many reports. Try again in 1 hour.' }, { status: 429 });
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
      submissionKey,
    } = body;

    /* The form's submission key: every retry of one submission completes the same report. */
    if (submissionKey !== undefined && !isSubmissionKey(submissionKey)) {
      return Response.json({ error: 'Invalid submission key.' }, { status: 400 });
    }

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

    /* Check TXID uniqueness (early, before the transaction lookup; lib/scam-db isTxidRefused).
       saveReport enforces the same rule in every case. */
    if (txHash && typeof txHash === 'string' && txHash.trim().length > 0) {
      if (await isTxidRefused(txHash.trim(), submissionKey)) {
        return Response.json({ error: 'This transaction hash has already been used in a previous report.' }, { status: 409 });
      }
    }

    /* Auto-verify TXID via our /api/tx endpoint */
    let blockchainConfirmed = false;
    let trustTier: 1 | 2 | 3 = 1; // Default: community
    let verifiedTxData: any = null;

    if (txHash && txHash.trim()) {
      // Outside the try below: a misconfigured site must fail the request, not
      // quietly save a verifiable report as unverified.
      const baseUrl = getPublicOrigin(req);
      try {
        const txNet = network || 'auto';
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
    }, { submissionKey });

    /* Calculate recovery score */
    const recoveryScore = calcRecoveryScore({
      lossDate: report.lossDate,
      blockchainConfirmed: report.blockchainConfirmed,
      network: report.network,
      lossAmount: report.lossAmount,
    });

    // The answer describes the SAVED report: on a retry that is the first saved version, which may
    // differ from this attempt (e.g. a hash added or removed after an error).
    const sameTx = (report.txHash?.toLowerCase() ?? '') === (txHash?.trim().toLowerCase() ?? '');
    return Response.json({
      reportId: id,
      trustTier: report.trustTier,
      verified: report.blockchainConfirmed,
      verifiedTxData: sameTx ? verifiedTxData : null,
      recoveryScore,
      message: report.blockchainConfirmed
        ? 'Report submitted and blockchain-verified. It will be reviewed by our team.'
        : 'Report submitted. It will be reviewed by our team.',
    });
  } catch (err: any) {
    // Two reports with the same hash at the same moment: the second loses the atomic claim.
    if (err?.name === 'TxidAlreadyUsedError') {
      return Response.json({ error: 'This transaction hash has already been used in a previous report.' }, { status: 409 });
    }
    console.error('[scam-database/report]', err);
    return Response.json({ error: 'Failed to submit report' }, { status: 500 });
  }
}
