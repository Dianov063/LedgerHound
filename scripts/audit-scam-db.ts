/**
 * Audit S3 scam-database for orphans + consistency.
 * Run: npx tsx scripts/audit-scam-db.ts
 */

import { S3Client, ListObjectsV2Command, GetObjectCommand } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });
dotenv.config({ path: path.join(process.cwd(), '.env.production.local') });

const s3 = new S3Client({
  region: process.env.AWS_REGION || 'eu-central-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});
const bucket = process.env.AWS_S3_BUCKET!;
const PREFIX = 'scam-database';

async function listUnder(prefix: string): Promise<string[]> {
  const out: string[] = [];
  let token: string | undefined;
  do {
    const r: any = await s3.send(new ListObjectsV2Command({
      Bucket: bucket, Prefix: prefix, ContinuationToken: token,
    }));
    for (const o of r.Contents || []) if (o.Key) out.push(o.Key);
    token = r.IsTruncated ? r.NextContinuationToken : undefined;
  } while (token);
  return out;
}

async function readJson<T>(key: string): Promise<T | null> {
  try {
    const r = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
    const text = await r.Body!.transformToString();
    return JSON.parse(text);
  } catch { return null; }
}

async function main() {
  console.log('═'.repeat(70));
  console.log(`  Audit ${bucket}/${PREFIX}/`);
  console.log('═'.repeat(70));

  let orphans = 0;
  let issues = 0;

  // 1. Compare platforms/ contents vs index/platforms.json
  const platformKeys = await listUnder(`${PREFIX}/platforms/`);
  const platformSlugsInS3 = platformKeys.map(k => k.split('/').pop()!.replace('.json', ''));

  const index = (await readJson<any[]>(`${PREFIX}/index/platforms.json`)) || [];
  const indexSlugs = index.map(p => p.slug);

  console.log(`\n  platforms/*.json:           ${platformSlugsInS3.length} files`);
  console.log(`  index/platforms.json:       ${indexSlugs.length} entries`);

  // Orphans: in platforms/ but not in index
  for (const slug of platformSlugsInS3) {
    if (!indexSlugs.includes(slug)) {
      console.log(`  ⚠ Orphan platform file (not in index): platforms/${slug}.json`);
      orphans++;
    }
  }
  // Orphans: in index but no file
  for (const slug of indexSlugs) {
    if (!platformSlugsInS3.includes(slug)) {
      console.log(`  ⚠ Index references missing file: ${slug}`);
      orphans++;
    }
  }

  // 2. Compare addresses/ contents vs platforms' addresses[]
  const addrKeys = await listUnder(`${PREFIX}/addresses/`);
  console.log(`\n  addresses/*.json:           ${addrKeys.length} files`);

  // Collect all addresses claimed by platforms in index
  const claimedAddrs = new Set<string>();
  for (const slug of indexSlugs) {
    const p = await readJson<any>(`${PREFIX}/platforms/${slug}.json`);
    if (p?.addresses) {
      for (const a of p.addresses) claimedAddrs.add(a.toLowerCase());
    }
  }

  // Orphans: address file but no platform references it
  for (const key of addrKeys) {
    const addr = key.split('/').pop()!.replace('.json', '').toLowerCase();
    if (!claimedAddrs.has(addr)) {
      const data = await readJson<any>(key);
      if (data?.platforms?.length > 0) {
        console.log(`  ⚠ Orphan address (refers to deleted platform): ${addr}`);
        console.log(`     references: ${(data.platforms || []).join(', ')}`);
        orphans++;
      }
    }
  }

  // 3. Check stats consistency
  const stats = await readJson<any>(`${PREFIX}/index/stats.json`);
  if (stats) {
    console.log(`\n  index/stats.json:           totalPlatforms=${stats.totalPlatforms}, totalReports=${stats.totalReports}, totalLoss=${stats.totalLoss}`);
    if (stats.totalPlatforms !== indexSlugs.length) {
      console.log(`  ⚠ Stats inconsistency: stats.totalPlatforms=${stats.totalPlatforms} but index has ${indexSlugs.length} entries`);
      issues++;
    }
  } else {
    console.log(`  ⚠ stats.json missing`);
    issues++;
  }

  // 4. Reports
  const reportKeys = await listUnder(`${PREFIX}/reports/`);
  console.log(`\n  reports/*.json:             ${reportKeys.length} files`);

  // 5. Summary
  console.log('\n' + '═'.repeat(70));
  if (orphans === 0 && issues === 0) {
    console.log('  ✅ No orphans detected. Database is consistent.');
  } else {
    console.log(`  ⚠ Found ${orphans} orphans + ${issues} consistency issues.`);
  }
  console.log('═'.repeat(70));
}

main().catch(e => { console.error(e); process.exit(1); });
