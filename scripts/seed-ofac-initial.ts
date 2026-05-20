/**
 * One-shot: seed the OFAC SDN crypto address list into S3.
 *
 * Source: github mirror `0xB10C/ofac-sanctioned-digital-currency-addresses`
 * (branch `lists`) — community-maintained parse of Treasury SDN list.
 *
 * Output:
 *   s3://<AWS_S3_BUCKET>/ofac-sdn/crypto-addresses.json
 *
 * Run: `npx tsx scripts/seed-ofac-initial.ts`
 *
 * The script is idempotent — it overwrites the existing object with the
 * current consolidated list. Designed to be re-runnable from the weekly
 * cron at /api/admin/refresh-ofac as well.
 *
 * 2026-05-20: Phase 1 initial seed.
 */

import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: path.join(process.cwd(), '.env.local') });
dotenv.config({ path: path.join(process.cwd(), '.env.production.local') });

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

// Currency files known to exist on the github mirror's `lists` branch.
// 2026-05-20 enumerated: ETH, XBT, TRX, SOL, USDC, USDT return 200; the rest
// return 404 (no entries for that currency yet).
const ASSETS = ['ETH', 'XBT', 'TRX', 'SOL', 'USDC', 'USDT'] as const;
type Asset = (typeof ASSETS)[number];

const BASE = 'https://raw.githubusercontent.com/0xB10C/ofac-sanctioned-digital-currency-addresses/lists';

interface OfacEntry {
  address: string;
  currency: Asset;
  source: string;
  added: string;
}

async function fetchAssetList(asset: Asset): Promise<string[]> {
  const url = `${BASE}/sanctioned_addresses_${asset}.json`;
  const res = await fetch(url);
  if (!res.ok) {
    if (res.status === 404) {
      console.log(`  ${asset}: not available (404) — skipping`);
      return [];
    }
    throw new Error(`Failed to fetch ${asset}: HTTP ${res.status}`);
  }
  const text = await res.text();
  const parsed = JSON.parse(text);
  if (!Array.isArray(parsed)) throw new Error(`${asset}: expected JSON array, got ${typeof parsed}`);
  return parsed.filter((a) => typeof a === 'string' && a.length > 0);
}

async function main() {
  const startedAt = Date.now();
  console.log('═'.repeat(70));
  console.log('  OFAC SDN seed — sourcing 0xB10C/ofac-sanctioned-digital-currency-addresses');
  console.log('═'.repeat(70));

  const today = new Date().toISOString().split('T')[0];
  const entries: OfacEntry[] = [];

  for (const asset of ASSETS) {
    const addrs = await fetchAssetList(asset);
    console.log(`  ${asset}: ${addrs.length} address(es)`);
    for (const a of addrs) {
      // EVM addresses we lowercase for lookup consistency.
      const stored = a.startsWith('0x') ? a.toLowerCase() : a;
      entries.push({ address: stored, currency: asset, source: 'OFAC SDN', added: today });
    }
  }

  // Dedupe across assets (same address could appear under multiple currencies).
  const seen = new Set<string>();
  const deduped: OfacEntry[] = [];
  for (const e of entries) {
    const key = `${e.currency}:${e.address}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(e);
  }

  console.log();
  console.log(`  Total raw rows: ${entries.length}`);
  console.log(`  After (currency,address) dedupe: ${deduped.length}`);

  // Upload to S3
  const bucket = process.env.AWS_S3_BUCKET;
  if (!bucket) {
    console.error('FATAL: AWS_S3_BUCKET is not set in env');
    process.exit(1);
  }

  const s3 = new S3Client({
    region: process.env.AWS_REGION || 'eu-central-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  });

  const key = 'ofac-sdn/crypto-addresses.json';
  const body = JSON.stringify(deduped, null, 2);
  console.log();
  console.log(`Uploading to s3://${bucket}/${key} (${body.length} bytes)…`);
  await s3.send(new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: body,
    ContentType: 'application/json',
    ServerSideEncryption: 'aws:kms',
    Metadata: {
      source: 'github-0xB10C-lists-branch',
      seededat: today,
      totalentries: String(deduped.length),
    },
  }));

  const breakdown = new Map<string, number>();
  for (const e of deduped) breakdown.set(e.currency, (breakdown.get(e.currency) || 0) + 1);

  console.log();
  console.log('  Per-currency breakdown:');
  for (const [cur, n] of Array.from(breakdown.entries()).sort()) {
    console.log(`    ${cur}: ${n}`);
  }

  const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1);
  console.log();
  console.log('═'.repeat(70));
  console.log(`  ✓ Done in ${elapsed}s. ${deduped.length} entries seeded to S3.`);
  console.log('═'.repeat(70));
}

main().catch((err) => {
  console.error('FATAL:', err);
  process.exit(1);
});
