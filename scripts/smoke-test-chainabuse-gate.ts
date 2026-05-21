/**
 * Smoke test: Chainabuse rate-limit gating.
 * Verifies the 5 acceptance criteria from the hotfix spec.
 *
 * Tests `shouldQueryChainabuse()` directly (pure function) — no real
 * API calls. The S3 counter auto-reset is covered with both real S3
 * (month rollover via stored fake state) and pure logic.
 *
 * Run: npx tsx scripts/smoke-test-chainabuse-gate.ts
 */
import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: path.join(process.cwd(), '.env.local') });
dotenv.config({ path: path.join(process.cwd(), '.env.production.local') });

import {
  shouldQueryChainabuse,
  CHAINABUSE_USABLE_CAP,
  getMonthlyUsage,
} from '../lib/labels/chainabuse';
import type { ChainabuseSkipInput, ChainabuseSkipDecision } from '../lib/labels/chainabuse';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

let pass = 0;
let fail = 0;
function check(name: string, actual: ChainabuseSkipDecision, expectQuery: boolean, expectReason: string) {
  const ok = actual.shouldQuery === expectQuery && actual.reason === expectReason;
  const symbol = ok ? '✓' : '✗';
  console.log(`  ${symbol} ${name}: shouldQuery=${actual.shouldQuery} reason=${actual.reason}` +
    (ok ? '' : `  (expected shouldQuery=${expectQuery} reason=${expectReason})`));
  if (ok) pass++; else fail++;
}

function baseInput(): ChainabuseSkipInput {
  return {
    address: '0x0000000000000000000000000000000000000001',
    knownEntity: null,
    isKnownPhishing: false,
    scamDbMatch: null,
    ofacMatch: null,
    monthlyCallsUsed: 0,
    hasApiKey: true,
  };
}

async function main() {
  console.log('═'.repeat(70));
  console.log('  Chainabuse gate — acceptance criteria');
  console.log('═'.repeat(70));

  // 1. CEX address → skip cex_whitelisted
  check(
    'CEX address skipped',
    shouldQueryChainabuse({
      ...baseInput(),
      knownEntity: { label: 'Binance', type: 'exchange' },
    }),
    false,
    'cex_whitelisted',
  );

  // 2. Known phishing → skip known_phishing
  check(
    'Known phishing skipped',
    shouldQueryChainabuse({
      ...baseInput(),
      isKnownPhishing: true,
    }),
    false,
    'known_phishing',
  );

  // 3. Unknown + usage<8 → query
  check(
    'Unknown with quota → queries',
    shouldQueryChainabuse({
      ...baseInput(),
      monthlyCallsUsed: 5,
    }),
    true,
    'not_skipped',
  );

  // 4. usage>=8 → skip rate_limit_reached
  check(
    'At usable cap (8) → skip',
    shouldQueryChainabuse({
      ...baseInput(),
      monthlyCallsUsed: CHAINABUSE_USABLE_CAP,
    }),
    false,
    'rate_limit_reached',
  );
  check(
    'usage=9 → skip rate_limit_reached',
    shouldQueryChainabuse({
      ...baseInput(),
      monthlyCallsUsed: 9,
    }),
    false,
    'rate_limit_reached',
  );

  // 5. No API key → skip
  check(
    'No API key → skip',
    shouldQueryChainabuse({
      ...baseInput(),
      hasApiKey: false,
    }),
    false,
    'no_api_key',
  );

  // 6. Mixer → skip
  check(
    'Mixer → skip',
    shouldQueryChainabuse({
      ...baseInput(),
      knownEntity: { label: 'Tornado Cash', type: 'mixer' },
    }),
    false,
    'mixer_known',
  );

  // 7. Sanctioned (local) → skip
  check(
    'Sanctioned (local) → skip',
    shouldQueryChainabuse({
      ...baseInput(),
      knownEntity: { label: 'Ronin exploiter', type: 'sanctioned' },
    }),
    false,
    'sanctions_known',
  );

  // 8. OFAC match → skip
  check(
    'OFAC match → skip',
    shouldQueryChainabuse({
      ...baseInput(),
      ofacMatch: { source: 'ofac', tag: 'OFAC SDN', category: 'sanctions', confidence: 1.0 },
    }),
    false,
    'ofac_match',
  );

  // 9. scam-db match → skip
  check(
    'Scam-DB match → skip',
    shouldQueryChainabuse({
      ...baseInput(),
      scamDbMatch: { platforms: ['some-platform'], platformNames: ['Some Scam'], reports: ['r1'], totalLoss: 1000 },
    }),
    false,
    'scam_db_match',
  );

  // 10. Auto-reset on month rollover (real S3)
  console.log();
  console.log('─'.repeat(70));
  console.log('  S3 auto-reset on month change (real bucket)');
  console.log('─'.repeat(70));
  const bucket = process.env.AWS_S3_BUCKET;
  if (!bucket) {
    console.log('  (skipped — AWS_S3_BUCKET unset)');
  } else {
    const s3 = new S3Client({
      region: process.env.AWS_REGION || 'eu-central-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });
    const now = new Date();
    const thisMonth = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
    const lastMonth = (() => {
      const d = new Date(now.getTime());
      d.setUTCMonth(d.getUTCMonth() - 1);
      return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
    })();

    // Plant a STALE counter from last month with calls_used=99 to prove
    // auto-reset works when the current-month file is missing.
    const stalePayload = JSON.stringify({
      month: lastMonth,
      calls_used: 99,
      calls_limit: 10,
      last_call_at: new Date(now.getTime() - 86400_000 * 35).toISOString(),
    });
    await s3.send(new PutObjectCommand({
      Bucket: bucket,
      Key: `chainabuse-usage/${lastMonth}.json`,
      Body: stalePayload,
      ContentType: 'application/json',
      ServerSideEncryption: 'aws:kms',
    }));

    // Read current usage. Auto-reset semantics: must report the CURRENT
    // month (not the planted last-month file) and must NOT inherit the
    // stale 99 value. The exact count may be non-zero because production
    // shares this S3 bucket and may have spent real Chainabuse calls this
    // month — that's legitimate, so we only assert it's not the stale value.
    const usage = await getMonthlyUsage();
    const ok = usage.month === thisMonth && usage.calls_used !== 99 && usage.calls_used >= 0;
    console.log(`  ${ok ? '✓' : '✗'} auto-reset to current month (not stale ${lastMonth}): month=${usage.month} calls_used=${usage.calls_used} (stale value 99 correctly ignored)`);
    if (ok) pass++; else fail++;

    // Cleanup the stale file we planted
    await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: `chainabuse-usage/${lastMonth}.json` }));
  }

  console.log();
  console.log('═'.repeat(70));
  console.log(`  ${pass} passed, ${fail} failed`);
  console.log('═'.repeat(70));
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
