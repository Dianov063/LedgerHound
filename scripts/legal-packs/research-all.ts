import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { COUNTRIES } from '../../lib/legal-packs/countries';
import type { PipelineStatus } from '../../lib/legal-packs/types';
import { researchCountry } from './research-agent';

const getS3 = () =>
  new S3Client({
    region: process.env.AWS_REGION || 'eu-central-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  });

const bucket = () => process.env.AWS_S3_BUCKET!;

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log(`\n🌍 Researching ${COUNTRIES.length} countries...\n`);

  const results: { code: string; success: boolean; error?: string }[] = [];
  const status: PipelineStatus = { lastFullRefresh: new Date().toISOString(), countries: {} };

  // Sort by priority (1 first)
  const sorted = [...COUNTRIES].sort((a, b) => a.priority - b.priority);

  for (let i = 0; i < sorted.length; i++) {
    const c = sorted[i];
    const progress = `[${i + 1}/${sorted.length}]`;

    try {
      console.log(`${progress} ${c.flag} ${c.name}...`);
      const research = await researchCountry(c.code);

      status.countries[c.code] = {
        researchedAt: new Date().toISOString(),
        generatedAt: null,
        validatedAt: null,
        status: 'needs_review',
        templatesGenerated: 0,
        validationPassed: false,
      };

      results.push({ code: c.code, success: true });
      console.log(`  ✅ ${research.policeAgency?.shortName || '?'} | ${research.financialRegulator?.shortName || '?'}`);
    } catch (err: any) {
      results.push({ code: c.code, success: false, error: err.message });
      status.countries[c.code] = {
        researchedAt: null,
        generatedAt: null,
        validatedAt: null,
        status: 'error',
        templatesGenerated: 0,
        validationPassed: false,
        error: err.message,
      };
      console.log(`  ❌ Error: ${err.message}`);
    }

    // Rate limit: wait 5 seconds between countries
    if (i < sorted.length - 1) {
      console.log('  ⏳ Waiting 5s...');
      await sleep(5000);
    }
  }

  // Save pipeline status
  await getS3().send(new PutObjectCommand({
    Bucket: bucket(),
    Key: 'legal-packs/metadata/pipeline-status.json',
    Body: JSON.stringify(status, null, 2),
    ContentType: 'application/json',
  }));

  // Summary
  const success = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  console.log(`\n📊 Results: ${success} success, ${failed} failed out of ${sorted.length}`);
  if (failed > 0) {
    console.log('Failed countries:');
    results.filter(r => !r.success).forEach(r => console.log(`  ❌ ${r.code}: ${r.error}`));
  }
}

main()
  .then(() => process.exit(0))
  .catch(err => { console.error(err); process.exit(1); });
