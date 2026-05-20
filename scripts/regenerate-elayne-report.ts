/**
 * One-shot: regenerate the report for Elayne's wallet to verify
 * post-cleanup state (no "CryptoYield" / no Binance-as-scam / no broken pages).
 *
 * What this script does:
 *   1. Calls generateReport() with an invalid email so Resend rejects
 *      (sendReport throws, generateReport catches it and continues).
 *   2. PDF uploads to S3 as usual (caseId = LH-...).
 *   3. Download the PDF from S3 to ./test-reports/elayne-cleanup-verify.pdf
 *   4. Delete the S3 object + report log entry to keep prod clean.
 *
 * Run: npx tsx scripts/regenerate-elayne-report.ts
 */

import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });
dotenv.config({ path: path.join(process.cwd(), '.env.production.local') });

import { generateReport } from '../lib/generateReport';
import { S3Client, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

const WALLET = '0xbc8996a9a5ff12ebf8702e857cc0faa451dc9569';
const NETWORK = 'eth';
// Invalid TLD → Resend rejects → sendReport throws → generateReport catches.
// PDF still renders + uploads to S3.
const TEST_EMAIL = 'noreply@local.invalid';

async function main() {
  const startedAt = Date.now();
  console.log('═'.repeat(70));
  console.log('  Regenerate Elayne report — post-cleanup regression test');
  console.log('═'.repeat(70));
  console.log(`  wallet:   ${WALLET}`);
  console.log(`  network:  ${NETWORK}`);
  console.log(`  email:    ${TEST_EMAIL}  (intentionally invalid — no real send)`);
  console.log();

  console.log('Calling generateReport()... (30-90s for Alchemy fetch + PDF render)');
  const result = await generateReport(WALLET, TEST_EMAIL, { network: NETWORK });
  console.log();
  console.log('✓ generateReport returned');
  console.log(`  caseId:        ${result.caseId}`);
  console.log(`  s3Key:         ${result.s3Key || '(empty — S3 upload failed)'}`);
  console.log(`  transactions:  ${result.transactionCount}`);
  console.log(`  ethReceived:   ${result.ethReceived}`);
  console.log(`  ethSent:       ${result.ethSent}`);
  console.log(`  riskScore:     ${result.riskScore} (${result.riskLabel})`);
  console.log(`  recoveryScore: ${result.recoveryScore} (${result.recoveryLabel})`);
  console.log(`  scamDbMatches: ${result.scamDbMatches.length}`);
  if (result.scamDbMatches.length > 0) {
    for (const m of result.scamDbMatches) {
      console.log(`    - ${m.address.slice(0, 12)}... platforms=${(m.platformNames || []).join(',')}`);
    }
  }
  console.log(`  identifiedEntities: ${result.identifiedEntities.length}`);
  for (const e of result.identifiedEntities.slice(0, 10)) {
    console.log(`    - ${e.address.slice(0, 12)}... ${e.label} (${e.type})`);
  }
  console.log();

  if (!result.s3Key) {
    console.log('⚠️  No s3Key — cannot download PDF. Exiting.');
    process.exit(1);
  }

  // Download the PDF from S3
  const s3 = new S3Client({
    region: process.env.AWS_REGION || 'eu-central-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  });
  const bucket = process.env.AWS_S3_BUCKET!;

  console.log(`Downloading PDF from s3://${bucket}/${result.s3Key} ...`);
  const obj = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: result.s3Key }));
  const chunks: Buffer[] = [];
  for await (const chunk of obj.Body as any) chunks.push(chunk as Buffer);
  const pdfBuf = Buffer.concat(chunks);

  const localDir = path.join(process.cwd(), 'test-reports');
  fs.mkdirSync(localDir, { recursive: true });
  const localFile = path.join(localDir, `elayne-cleanup-verify-${result.caseId}.pdf`);
  fs.writeFileSync(localFile, pdfBuf);
  console.log(`✓ Saved to ${localFile}`);
  console.log(`  size: ${pdfBuf.length} bytes`);

  // Delete from S3 to keep prod clean
  console.log();
  console.log('Cleaning up S3 (deleting test report)...');
  await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: result.s3Key }));
  console.log(`✓ Deleted s3://${bucket}/${result.s3Key}`);

  const elapsedSec = Math.round((Date.now() - startedAt) / 1000);
  console.log();
  console.log('═'.repeat(70));
  console.log(`  Done in ${elapsedSec}s. PDF saved locally for manual review.`);
  console.log('═'.repeat(70));
}

main().catch((err) => {
  console.error('FATAL:', err);
  process.exit(1);
});
