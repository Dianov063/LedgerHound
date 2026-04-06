import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getPlatformIndex, slugify } from '@/lib/scam-db';
import type { PlatformIndexEntry } from '@/lib/scam-db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/* ── S3 client (same pattern as scam-db.ts) ── */
const getS3 = () =>
  new S3Client({
    region: process.env.AWS_REGION || 'eu-central-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  });

const bucket = () => process.env.AWS_S3_BUCKET!;

/* ── Rate limiter: 5/hour per IP ── */
const rateLimit = new Map<string, { count: number; reset: number }>();

/* ── Known exchange addresses for destination detection ── */
const KNOWN_EXCHANGES: Record<string, string> = {
  '0x28c6c06298d514db089934071355e5743bf21d60': 'Binance',
  '0xbe0eb53f46cd790cd13851d5eff43d12404d33e8': 'Binance',
  '0x71660c4005ba85c37ccec55d0c4493e66fe775d3': 'Coinbase',
  '0x503828976d22510aad0201ac7ec88293211d23da': 'Coinbase',
  '0x2910543af39aba0cd09dbb2d50200b3e800a63d2': 'Kraken',
  '0x6cc5f688a315f3dc28a7781717a9a798a59fda7b': 'OKX',
  '0xab5c66752a9e8167967685f1450532fb96d5d24f': 'Huobi',
  '0xf89d7b9c864f589bbf53a82105107622b35eaa40': 'Bybit',
  '0x2b5634c42055806a59e9107ed44d43c426e58258': 'KuCoin',
  '0x77134cbc06cb00b66f4c7e623d5fdbf6777635ec': 'Bitfinex',
};

/* ── Known mixer patterns ── */
const MIXER_KEYWORDS = ['tornado', 'mixer', 'blender', 'wasabi', 'chipmixer', 'sinbad'];

export async function POST(req: NextRequest) {
  try {
    /* ── Rate limiting ── */
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
    const now = Date.now();
    const entry = rateLimit.get(ip);
    if (entry && entry.reset > now) {
      if (entry.count >= 5) {
        return NextResponse.json(
          { error: 'Rate limit exceeded. Try again later.' },
          { status: 429 },
        );
      }
      entry.count++;
    } else {
      rateLimit.set(ip, { count: 1, reset: now + 3600000 });
    }

    /* ── Parse body ── */
    const {
      country,
      lossAmount,
      walletAddress,
      txid,
      txDate,
      platformName,
      detectedNetwork,
      scamType,
      description,
      contactMethod,
      email,
    } = await req.json();

    /* ── Calculate daysSince ── */
    const txDateMs = txDate ? new Date(txDate).getTime() : now;
    const daysSince = Math.max(0, Math.floor((now - txDateMs) / 86400000));

    /* ── Determine route ── */
    let route: 'EMERGENCY' | 'URGENT' | 'AGGREGATOR';
    if (daysSince <= 3) {
      route = 'EMERGENCY';
    } else if (daysSince <= 7) {
      route = 'URGENT';
    } else {
      route = 'AGGREGATOR';
    }

    /* ── Detect exchange destination from wallet address ── */
    let exchange: string | null = null;
    let destination: string | null = null;
    let hasMixer = false;

    if (walletAddress) {
      const addr = walletAddress.toLowerCase();
      // Direct match against known exchange addresses
      if (KNOWN_EXCHANGES[addr]) {
        exchange = KNOWN_EXCHANGES[addr];
        destination = exchange;
      }
    }

    // Check description for mixer mentions
    if (description) {
      const descLower = description.toLowerCase();
      hasMixer = MIXER_KEYWORDS.some((kw) => descLower.includes(kw));
    }

    /* ── Search scam database for platform match ── */
    let scamDbMatch: PlatformIndexEntry | null = null;
    let victimCount = 1;
    let totalLoss = lossAmount || 0;
    let threshold = 500000;
    let hasOfac = false;

    if (platformName) {
      try {
        const platforms = await getPlatformIndex();
        const slug = slugify(platformName);
        const nameNorm = platformName.toLowerCase().trim();

        scamDbMatch =
          platforms.find((p) => p.slug === slug) ||
          platforms.find((p) => p.name.toLowerCase() === nameNorm) ||
          platforms.find(
            (p) =>
              p.name.toLowerCase().includes(nameNorm) ||
              nameNorm.includes(p.name.toLowerCase()),
          ) ||
          null;

        if (scamDbMatch) {
          victimCount = scamDbMatch.victims;
          totalLoss = scamDbMatch.totalLoss;
          threshold = Math.max(totalLoss * 2, 500000);
        }
      } catch (err) {
        console.error('[emergency/analyze] scam-db lookup failed:', err);
      }
    }

    // Defaults for AGGREGATOR when no platform match
    if (!scamDbMatch) {
      victimCount = 1;
      totalLoss = lossAmount || 0;
      threshold = 500000;
    }

    /* ── Calculate recovery score ── */
    let recoveryScore = 50; // base

    if (daysSince <= 3) recoveryScore += 30;
    else if (daysSince <= 7) recoveryScore += 15;

    if (exchange) recoveryScore += 20;
    if (hasMixer) recoveryScore -= 25;
    if ((lossAmount || 0) > 50000) recoveryScore += 5;

    // Clamp 5-95
    recoveryScore = Math.max(5, Math.min(95, recoveryScore));

    const recoveryLabel =
      recoveryScore >= 70
        ? 'High recovery potential'
        : recoveryScore >= 45
          ? 'Moderate recovery potential'
          : 'Limited recovery potential';

    /* ── Generate case ID and save to S3 ── */
    const caseId = `ER-${Date.now().toString(36).toUpperCase()}`;

    const caseData = {
      caseId,
      route,
      createdAt: new Date().toISOString(),
      country,
      lossAmount,
      walletAddress,
      txid,
      txDate,
      daysSince,
      platformName,
      detectedNetwork,
      scamType,
      description,
      contactMethod,
      email,
      analysis: {
        recoveryScore,
        recoveryLabel,
        destination,
        exchange,
        hasMixer,
        scamDbMatch: scamDbMatch
          ? { slug: scamDbMatch.slug, name: scamDbMatch.name, victims: scamDbMatch.victims, totalLoss: scamDbMatch.totalLoss }
          : null,
        victimCount,
        totalLoss,
        threshold,
        hasOfac,
      },
    };

    try {
      await getS3().send(
        new PutObjectCommand({
          Bucket: bucket(),
          Key: `emergency-cases/${caseId}.json`,
          Body: JSON.stringify(caseData),
          ContentType: 'application/json',
        }),
      );
      console.log(`[emergency/analyze] Saved case ${caseId} to S3`);
    } catch (err) {
      console.error(`[emergency/analyze] Failed to save case ${caseId} to S3:`, err);
      // Non-fatal: still return the analysis even if S3 save fails
    }

    /* ── Response ── */
    return NextResponse.json({
      route,
      caseId,
      analysis: {
        recoveryScore,
        recoveryLabel,
        destination,
        exchange,
        daysSince,
        scamDbMatch: scamDbMatch
          ? { slug: scamDbMatch.slug, name: scamDbMatch.name, victims: scamDbMatch.victims, totalLoss: scamDbMatch.totalLoss }
          : null,
        victimCount,
        totalLoss,
        threshold,
        hasOfac,
      },
    });
  } catch (err: any) {
    console.error('[emergency/analyze] Error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to analyze emergency case' },
      { status: 500 },
    );
  }
}
