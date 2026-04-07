import 'dotenv/config';
import { COUNTRIES } from '../../lib/legal-packs/countries';
import { savePipelineStatus, getPipelineStatus } from '../../lib/legal-packs/s3';
import { refreshCountry } from './refresh-pipeline';

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  // Sort by priority (1 first)
  const sorted = [...COUNTRIES].sort((a, b) => a.priority - b.priority);

  console.log(`\nRefreshing ${sorted.length} countries (research -> validate -> generate)...\n`);

  const results: { code: string; name: string; success: boolean; error?: string }[] = [];

  for (let i = 0; i < sorted.length; i++) {
    const c = sorted[i];
    const progress = `[${i + 1}/${sorted.length}]`;

    console.log(`${'='.repeat(60)}`);
    console.log(`${progress} ${c.flag} ${c.name} (${c.code})`);
    console.log(`${'='.repeat(60)}`);

    try {
      const result = await refreshCountry(c.code);
      results.push({
        code: c.code,
        name: c.name,
        success: result.success,
        error: result.error,
      });
    } catch (err: any) {
      results.push({
        code: c.code,
        name: c.name,
        success: false,
        error: err.message,
      });
      console.error(`Unexpected error for ${c.code}: ${err.message}`);
    }

    // Rate limit: 5-second delay between countries
    if (i < sorted.length - 1) {
      console.log('Waiting 5 seconds (API rate limiting)...\n');
      await sleep(5000);
    }
  }

  // Update pipeline status with last full refresh timestamp
  try {
    const status = await getPipelineStatus();
    status.lastFullRefresh = new Date().toISOString();
    await savePipelineStatus(status);
  } catch (err: any) {
    console.error(`Warning: failed to update pipeline status: ${err.message}`);
  }

  // Print summary
  const succeeded = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  console.log('\n' + '='.repeat(60));
  console.log('REFRESH SUMMARY');
  console.log('='.repeat(60));
  console.log(
    'Country'.padEnd(8),
    'Name'.padEnd(22),
    'Result'.padEnd(10),
  );
  console.log('-'.repeat(60));

  for (const r of results) {
    console.log(
      r.code.padEnd(8),
      r.name.padEnd(22),
      (r.success ? 'OK' : 'FAILED').padEnd(10),
    );
  }

  console.log('-'.repeat(60));
  console.log(`Total: ${results.length} | Succeeded: ${succeeded.length} | Failed: ${failed.length}`);
  console.log('='.repeat(60));

  if (failed.length > 0) {
    console.log('\nFailed countries:');
    for (const r of failed) {
      console.log(`  ${r.code} (${r.name}): ${r.error}`);
    }
  }

  process.exit(failed.length > 0 ? 1 : 0);
}

main().catch(err => {
  console.error(`Fatal error: ${err.message || err}`);
  process.exit(1);
});
