/**
 * One-shot cleanup of fabricated scam-database entries from S3.
 *
 * Usage:
 *   npx tsx scripts/cleanup-fabricated-scam-db.ts --dry-run    (default — prints, does NOT delete)
 *   npx tsx scripts/cleanup-fabricated-scam-db.ts --execute    (real deletion — requires --execute flag)
 *
 * Safety:
 *   - Default is dry-run. --execute must be passed explicitly.
 *   - Idempotent: re-running after --execute is a no-op (objects already gone).
 *   - Lists all objects it intends to delete BEFORE touching anything.
 *   - Does NOT delete the bucket itself or anything outside scam-database/ prefix.
 *
 * What gets deleted (matches Tier A list):
 *   - 10 fabricated platforms in scam-database/platforms/
 *   - Their 10 corresponding address index entries in scam-database/addresses/
 *   - All reports created by seedDatabase() (matching the platform reportIds)
 *   - Cached index files (scam-database/index/*.json) — regenerated empty
 *   - Cached stats file (scam-database/stats.json if exists)
 *
 * Backup: prints recommended `aws s3 sync` command for backup before --execute.
 */

import {
  S3Client,
  ListObjectsV2Command,
  GetObjectCommand,
  DeleteObjectsCommand,
  PutObjectCommand,
} from '@aws-sdk/client-s3';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });
dotenv.config({ path: path.join(process.cwd(), '.env.production.local') });
dotenv.config({ path: path.join(process.cwd(), '.env') });

const DRY_RUN = !process.argv.includes('--execute');
const PREFIX = 'scam-database';

// EXACT slugs from fabricated SEED in lib/scam-db.ts:561-572
const FABRICATED_SLUGS = [
  'cryptotrade-pro',
  'bitinvestment-club',
  'coinprofit-ai',
  'metatrader-crypto-pro',
  'cryptoyield-platform',
  'tradingproai',
  'coinbase-pro-trade',
  'btc-cloud-mining-pro',
  'cryptofx-global-markets',
  'defi-yield-optimizer',
];

// Lowercase addresses from fabricated SEED (matches addresses/<lower>.json keys)
const FABRICATED_ADDRESSES = [
  '0xd882cfc20f52f2599d84b8e8d58c7fb62cfe344b',
  '0x3cffd56b47b7b41c56258d9c7731abadc360e460',
  'txf1ynp2yvuwuvsgzustfp8vfn5jah5rzy', // TRON addresses also lowercased per scam-db convention?
  '0x19aa5fe80d33a56d56c78e82ea5e50e5d80b4dff',
  '0x56eddb7aa87536c09ccc2793473599fd21a8b17f',
  'tdqvegmpeb3jufckems9k94xvcnsc5eyag',
  '0xef3a930e1ffffffacd2b664822cb7d1c51e0c36e',
  '0x707012c9cf97c4c3a481603f98d593ecd3a44621',
  '0x39d908dac893cbcb53cc86e0ecc369aa4def1a29',
  '0x0681d8db095565fe8a346fa0277bffde9c0edbbf',
  // Also include uppercase TRON variants since scam-db code uses .toLowerCase() but TRON addresses are case-sensitive
  'TXF1yNp2yvUwUvSgzUSTfP8VFN5jAH5rzy',
  'TDqVegmPEb3juFCkEMS9K94xVcNSc5EYAG',
];

const s3 = new S3Client({
  region: process.env.AWS_REGION || 'eu-central-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const bucket = process.env.AWS_S3_BUCKET!;

interface PlannedDeletion {
  key: string;
  reason: string;
  size?: number;
  exists: boolean;
}

async function listKeysUnder(prefix: string): Promise<{ Key: string; Size?: number }[]> {
  const out: { Key: string; Size?: number }[] = [];
  let ContinuationToken: string | undefined;
  do {
    const r: any = await s3.send(new ListObjectsV2Command({
      Bucket: bucket, Prefix: prefix, ContinuationToken,
    }));
    for (const o of r.Contents || []) {
      if (o.Key) out.push({ Key: o.Key, Size: o.Size });
    }
    ContinuationToken = r.IsTruncated ? r.NextContinuationToken : undefined;
  } while (ContinuationToken);
  return out;
}

async function readJson<T>(key: string): Promise<T | null> {
  try {
    const r = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
    const text = await r.Body!.transformToString();
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

async function plan(): Promise<PlannedDeletion[]> {
  const planned: PlannedDeletion[] = [];

  // ─── 1. Platforms ───
  for (const slug of FABRICATED_SLUGS) {
    const key = `${PREFIX}/platforms/${slug}.json`;
    const exists = (await readJson(key)) !== null;
    planned.push({
      key,
      reason: `Fabricated platform: ${slug}`,
      exists,
    });
  }

  // ─── 2. Address indexes (both lower + original case for TRON) ───
  for (const addr of FABRICATED_ADDRESSES) {
    const key = `${PREFIX}/addresses/${addr.toLowerCase()}.json`;
    const exists = (await readJson(key)) !== null;
    if (exists || addr.startsWith('T')) {
      // Include even if not found for TRON (might be cased differently)
      planned.push({
        key,
        reason: `Address index for fabricated SEED: ${addr}`,
        exists,
      });
    }
  }

  // ─── 3. Reports created by seedDatabase() ───
  // seedDatabase() generates IDs via generateId() and saves to scam-database/reports/<id>.json.
  // We can't know IDs in advance — list all reports, fetch metadata, filter by platformSlug match.
  const allReports = await listKeysUnder(`${PREFIX}/reports/`);
  for (const obj of allReports) {
    if (!obj.Key) continue;
    const report = await readJson<any>(obj.Key);
    if (!report) continue;
    const slug = (report.platformSlug || '').toString();
    const platformName = (report.platformName || '').toString().toLowerCase();
    const matchesSlug = FABRICATED_SLUGS.includes(slug);
    const matchesName = FABRICATED_SLUGS.some(s => platformName === s.replace(/-/g, ' '));
    if (matchesSlug || matchesName) {
      planned.push({
        key: obj.Key,
        reason: `Report for fabricated platform: ${slug || platformName}`,
        size: obj.Size,
        exists: true,
      });
    }
  }

  // ─── 4. Index files (will regenerate empty after cleanup) ───
  // FIXED: stats.json is at scam-database/index/stats.json, NOT scam-database/stats.json
  const indexKeys = [
    `${PREFIX}/index/platforms.json`,
    `${PREFIX}/index/addresses.json`,  // may not exist
    `${PREFIX}/index/stats.json`,      // correct path
  ];
  for (const key of indexKeys) {
    const exists = (await readJson(key)) !== null;
    if (exists) {
      planned.push({
        key,
        reason: 'Cached aggregate index — will be regenerated empty',
        exists,
      });
    }
  }

  return planned;
}

async function execute(planned: PlannedDeletion[]): Promise<void> {
  const toDelete = planned.filter(p => p.exists).map(p => ({ Key: p.key }));
  if (toDelete.length === 0) {
    console.log('Nothing to delete (all objects already absent — idempotent re-run).');
    return;
  }

  // S3 DeleteObjects accepts up to 1000 keys per call
  const chunks: { Key: string }[][] = [];
  for (let i = 0; i < toDelete.length; i += 1000) {
    chunks.push(toDelete.slice(i, i + 1000));
  }

  for (const chunk of chunks) {
    const result = await s3.send(new DeleteObjectsCommand({
      Bucket: bucket,
      Delete: { Objects: chunk, Quiet: false },
    }));
    for (const d of result.Deleted || []) {
      console.log(`  ✓ deleted ${d.Key}`);
    }
    for (const e of result.Errors || []) {
      console.error(`  ✗ FAILED ${e.Key}: ${e.Code} — ${e.Message}`);
    }
  }

  // Write empty index files so reads don't 404
  const now = new Date().toISOString();
  const emptyIndex: any[] = [];
  const emptyStats = {
    totalReports: 0, totalPlatforms: 0, totalLoss: 0, blockchainVerified: 0,
    updatedAt: now,
  };
  await s3.send(new PutObjectCommand({
    Bucket: bucket, Key: `${PREFIX}/index/platforms.json`,
    Body: JSON.stringify(emptyIndex), ContentType: 'application/json',
  }));
  await s3.send(new PutObjectCommand({
    Bucket: bucket, Key: `${PREFIX}/index/stats.json`,
    Body: JSON.stringify(emptyStats), ContentType: 'application/json',
  }));
  console.log('  ✓ wrote empty index/platforms.json + index/stats.json');
}

async function main() {
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY || !bucket) {
    console.error('Missing AWS credentials or AWS_S3_BUCKET env var. Aborting.');
    process.exit(1);
  }

  console.log('═'.repeat(70));
  console.log('  Scam DB cleanup — fabricated SEED data');
  console.log(`  Bucket: ${bucket}`);
  console.log(`  Region: ${process.env.AWS_REGION || 'eu-central-1'}`);
  console.log(`  Mode:   ${DRY_RUN ? 'DRY-RUN (no changes)' : '!!! EXECUTE (real deletion) !!!'}`);
  console.log('═'.repeat(70));
  console.log();

  if (!DRY_RUN) {
    console.log('⚠️  REAL DELETION INCOMING — backup first if not already done:');
    console.log(`    aws s3 sync s3://${bucket}/scam-database/ ./backups/scam-db-pre-cleanup-$(date +%Y%m%d)/`);
    console.log();
    console.log('   Waiting 5 seconds for last-chance Ctrl+C...');
    await new Promise(r => setTimeout(r, 5000));
  }

  console.log('Computing deletion plan...');
  const planned = await plan();

  console.log();
  console.log(`Total objects in plan: ${planned.length}`);
  const present = planned.filter(p => p.exists);
  const absent = planned.filter(p => !p.exists);
  console.log(`  ${present.length} present in S3 (will be deleted)`);
  console.log(`  ${absent.length} not present (already clean, no-op)`);
  console.log();

  console.log('Detailed plan:');
  console.log('─'.repeat(70));
  for (const p of planned) {
    const flag = p.exists ? '🗑 ' : '   ';
    console.log(`${flag} ${p.key}`);
    console.log(`     ${p.reason}${p.size ? ` (${p.size} bytes)` : ''}`);
  }
  console.log('─'.repeat(70));
  console.log();

  if (DRY_RUN) {
    console.log('✓ Dry-run complete. No changes made.');
    console.log('  To execute: npx tsx scripts/cleanup-fabricated-scam-db.ts --execute');
  } else {
    console.log('Executing deletion...');
    await execute(planned);
    console.log();
    console.log('✓ Cleanup complete. Run audit-scam-db.ts to verify no orphans.');
  }
}

main().catch(err => { console.error(err); process.exit(1); });
