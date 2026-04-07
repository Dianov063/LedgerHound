import 'dotenv/config';
import { listResearchedCountries, getPipelineStatus, savePipelineStatus } from '../../lib/legal-packs/s3';
import { generateTemplatesForCountry } from './template-generator';

interface BatchResult {
  code: string;
  success: boolean;
  templatesGenerated: number;
  error?: string;
}

async function main(): Promise<void> {
  console.log('Listing researched countries...\n');
  const countries = await listResearchedCountries();

  if (countries.length === 0) {
    console.log('No researched countries found. Run research-agent or research-all first.');
    return;
  }

  console.log(`Found ${countries.length} researched countries: ${countries.join(', ')}\n`);

  const results: BatchResult[] = [];

  for (let i = 0; i < countries.length; i++) {
    const code = countries[i];
    const progress = `[${i + 1}/${countries.length}]`;

    try {
      console.log(`${progress} Generating templates for ${code}...`);
      const count = await generateTemplatesForCountry(code);
      results.push({ code, success: true, templatesGenerated: count });
    } catch (err: any) {
      console.error(`${progress} Failed ${code}: ${err.message}`);
      results.push({ code, success: false, templatesGenerated: 0, error: err.message });
    }
  }

  // Update pipeline status with batch timestamp
  try {
    const status = await getPipelineStatus();
    status.lastFullRefresh = new Date().toISOString();
    await savePipelineStatus(status);
  } catch (err: any) {
    console.error(`Failed to update pipeline status: ${err.message}`);
  }

  // Summary
  const succeeded = results.filter((r) => r.success);
  const failed = results.filter((r) => !r.success);
  const totalTemplates = results.reduce((sum, r) => sum + r.templatesGenerated, 0);

  console.log('\n--- Summary ---');
  console.log(`Countries processed: ${results.length}`);
  console.log(`Succeeded: ${succeeded.length}`);
  console.log(`Failed: ${failed.length}`);
  console.log(`Total templates generated: ${totalTemplates}`);

  if (failed.length > 0) {
    console.log('\nFailed countries:');
    for (const r of failed) {
      console.log(`  ${r.code}: ${r.error}`);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
