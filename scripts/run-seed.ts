/**
 * Seed the scam-database from lib/scam-db-verified-seed.ts.
 *
 * Referenced by the seed-file docs; writes to the production S3 bucket using
 * the AWS credentials from .env.local. seedDatabase() skips if the database
 * already has platforms unless FORCE=1 is set.
 *
 * Run: npx tsx scripts/run-seed.ts          (safe: skips if non-empty)
 *      FORCE=1 npx tsx scripts/run-seed.ts  (re-seed over existing)
 */
import { config } from 'dotenv';
import path from 'path';

config({ path: path.join(process.cwd(), '.env.local') });

async function main() {
  const { seedDatabase, getStats } = await import('../lib/scam-db');
  const force = process.env.FORCE === '1';
  console.log(`[run-seed] force=${force}`);
  const result = await seedDatabase(force);
  console.log('[run-seed] result:', result);
  const stats = await getStats();
  console.log('[run-seed] stats now:', stats);
}

main().catch((e) => { console.error('[run-seed] FAILED:', e); process.exit(1); });
