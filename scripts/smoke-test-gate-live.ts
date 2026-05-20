/**
 * Live integration smoke test for Phase A + Phase B (Chainabuse gating).
 *
 * Hits 4 fresh addresses (no cache yet) — verifies that for each one we get
 * either a skip log OR a call log from the federation, depending on what
 * Phase A returns.
 *
 * Run: npx tsx scripts/smoke-test-gate-live.ts
 */
import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: path.join(process.cwd(), '.env.local') });
dotenv.config({ path: path.join(process.cwd(), '.env.production.local') });

import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getAddressLabels } from '../lib/labels/federation';

const TARGETS: Array<{ addr: string; expect: string }> = [
  // CEX — Phase A flags as cex_whitelist → expect chainabuse_skip reason=cex_whitelisted
  { addr: '0x28c6c06298d514db089934071355e5743bf21d60', expect: 'skip cex_whitelisted' },
  // Known phishing — expect skip known_phishing
  { addr: '0x073acba9caa50d332666a0eb361a47ad1d66609f', expect: 'skip known_phishing' },
  // OFAC — expect skip ofac_match (Phase A finds the OFAC hit, gate skips Chainabuse)
  { addr: '0x098b716b8aaf21512996dc57eb0615e2383e2f96', expect: 'skip ofac_match' },
  // Vitalik's wallet — not on any list locally, no labels expected from Phase A
  // → should attempt Chainabuse call (gate allows it) — but in local env with
  //   no CHAINABUSE_API_KEY, gate returns reason=no_api_key.
  { addr: '0xd8da6bf26964af9d7eed9e03e53415d37aa96045', expect: 'call OR skip no_api_key (no key locally)' },
];

async function clearCache(s3: S3Client, bucket: string, addr: string) {
  try {
    await s3.send(new DeleteObjectCommand({
      Bucket: bucket,
      Key: `address-labels/eth/${addr.toLowerCase()}.json`,
    }));
  } catch {
    // ignore — may not exist yet
  }
}

async function main() {
  const bucket = process.env.AWS_S3_BUCKET!;
  const s3 = new S3Client({
    region: process.env.AWS_REGION || 'eu-central-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  });

  for (const { addr, expect } of TARGETS) {
    console.log('═'.repeat(70));
    console.log(`  ${addr}`);
    console.log(`  EXPECT: ${expect}`);
    console.log('═'.repeat(70));
    await clearCache(s3, bucket, addr);
    const r = await getAddressLabels(addr, 'eth');
    console.log(`  → labels: ${r.labels.length}, phishing=${r.hasPhishingFlag}, sanctions=${r.hasSanctionsFlag}, cex=${r.isKycExchange}`);
    console.log();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
