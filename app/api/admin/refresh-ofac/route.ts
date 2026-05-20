/**
 * Weekly OFAC SDN refresh — invoked by Vercel Cron (Mon 06:00 UTC).
 *
 * Source: github mirror `0xB10C/ofac-sanctioned-digital-currency-addresses`,
 * branch `lists`. Produces a consolidated JSON list across all available
 * asset codes (ETH, XBT, TRX, SOL, USDC, USDT) and uploads to S3 at
 * `ofac-sdn/crypto-addresses.json` (KMS encrypted).
 *
 * Auth:
 *   - Vercel Cron: `Authorization: Bearer <CRON_SECRET>` (auto-supplied)
 *   - Manual admin: `X-Admin-Token: <ADMIN_PASSWORD>` header
 *
 * 2026-05-20: Phase 1 federation.
 */

import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const ASSETS = ['ETH', 'XBT', 'TRX', 'SOL', 'USDC', 'USDT'] as const;
type Asset = (typeof ASSETS)[number];

const BASE =
  'https://raw.githubusercontent.com/0xB10C/ofac-sanctioned-digital-currency-addresses/lists';

interface OfacEntry {
  address: string;
  currency: Asset;
  source: string;
  added: string;
}

async function fetchAssetList(asset: Asset): Promise<string[]> {
  const url = `${BASE}/sanctioned_addresses_${asset}.json`;
  const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
  if (!res.ok) {
    if (res.status === 404) return [];
    throw new Error(`Failed to fetch ${asset}: HTTP ${res.status}`);
  }
  const parsed = await res.json();
  if (!Array.isArray(parsed)) throw new Error(`${asset}: expected JSON array`);
  return parsed.filter((a) => typeof a === 'string' && a.length > 0);
}

function isAuthorized(req: NextRequest): boolean {
  // Vercel Cron sends the secret in the Authorization header.
  const cronSecret = process.env.CRON_SECRET;
  const auth = req.headers.get('Authorization');
  if (cronSecret && auth === `Bearer ${cronSecret}`) return true;

  // Manual admin fallback.
  const adminPw = process.env.ADMIN_PASSWORD;
  const adminToken = req.headers.get('X-Admin-Token');
  if (adminPw && adminToken === adminPw) return true;

  return false;
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startedAt = Date.now();
  const today = new Date().toISOString().split('T')[0];

  try {
    const breakdown: Record<string, number> = {};
    const entries: OfacEntry[] = [];

    for (const asset of ASSETS) {
      const addrs = await fetchAssetList(asset);
      breakdown[asset] = addrs.length;
      for (const a of addrs) {
        const stored = a.startsWith('0x') ? a.toLowerCase() : a;
        entries.push({ address: stored, currency: asset, source: 'OFAC SDN', added: today });
      }
    }

    // Dedupe on (currency, address)
    const seen = new Set<string>();
    const deduped: OfacEntry[] = [];
    for (const e of entries) {
      const k = `${e.currency}:${e.address}`;
      if (seen.has(k)) continue;
      seen.add(k);
      deduped.push(e);
    }

    const bucket = process.env.AWS_S3_BUCKET;
    if (!bucket) return NextResponse.json({ error: 'AWS_S3_BUCKET not configured' }, { status: 500 });

    const s3 = new S3Client({
      region: process.env.AWS_REGION || 'eu-central-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });

    await s3.send(new PutObjectCommand({
      Bucket: bucket,
      Key: 'ofac-sdn/crypto-addresses.json',
      Body: JSON.stringify(deduped, null, 2),
      ContentType: 'application/json',
      ServerSideEncryption: 'aws:kms',
      Metadata: {
        source: 'github-0xB10C-lists-branch',
        seededat: today,
        totalentries: String(deduped.length),
      },
    }));

    return NextResponse.json({
      ok: true,
      total: deduped.length,
      breakdown,
      duration_ms: Date.now() - startedAt,
      timestamp: new Date().toISOString(),
    });
  } catch (e: any) {
    console.error('[refresh-ofac] failed:', e);
    return NextResponse.json({ error: e?.message || String(e) }, { status: 500 });
  }
}
