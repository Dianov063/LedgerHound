import 'dotenv/config';
import { listResearchedCountries } from '../../lib/legal-packs/s3';
import { getCountry } from '../../lib/legal-packs/countries';
import { validateCountry } from './validator-agent';
import type { ValidationResult } from '../../lib/legal-packs/types';

async function main() {
  console.log('\nListing researched countries from S3...\n');

  const countryCodes = await listResearchedCountries();
  if (countryCodes.length === 0) {
    console.log('No researched countries found in S3. Run research-agent first.');
    process.exit(0);
  }

  console.log(`Found ${countryCodes.length} countries to validate.\n`);

  const results: (ValidationResult & { name: string })[] = [];

  for (const code of countryCodes) {
    try {
      const result = await validateCountry(code);
      const country = getCountry(code);
      results.push({ ...result, name: country?.name || code });
    } catch (err: any) {
      results.push({
        country: code,
        name: getCountry(code)?.name || code,
        template: 'police-complaint',
        passed: false,
        checks: [{ name: 'validation_error', passed: false, message: err.message }],
      });
    }
  }

  // Print summary table
  console.log('='.repeat(70));
  console.log(
    'Country'.padEnd(8),
    'Name'.padEnd(22),
    'Status'.padEnd(8),
    'Passed'.padEnd(8),
    'Failed'.padEnd(8),
  );
  console.log('-'.repeat(70));

  let totalPassed = 0;
  let totalFailed = 0;

  for (const r of results) {
    const failedCount = r.checks.filter(c => !c.passed).length;
    const passedCount = r.checks.filter(c => c.passed).length;
    const status = r.passed ? 'PASS' : 'FAIL';

    console.log(
      r.country.padEnd(8),
      r.name.padEnd(22),
      status.padEnd(8),
      String(passedCount).padEnd(8),
      String(failedCount).padEnd(8),
    );

    if (r.passed) totalPassed++;
    else totalFailed++;
  }

  console.log('-'.repeat(70));
  console.log(
    `Total: ${results.length} countries | ${totalPassed} passed | ${totalFailed} failed`,
  );
  console.log('='.repeat(70));

  // Print details for failed countries
  const failedResults = results.filter(r => !r.passed);
  if (failedResults.length > 0) {
    console.log('\nFailed validation details:\n');
    for (const r of failedResults) {
      const failedChecks = r.checks.filter(c => !c.passed);
      console.log(`  ${r.country} (${r.name}) - ${failedChecks.length} issue(s):`);
      for (const c of failedChecks) {
        console.log(`    - ${c.name}: ${c.message}`);
      }
      console.log('');
    }
  }

  process.exit(totalFailed > 0 ? 1 : 0);
}

main().catch(err => {
  console.error(`Error: ${err.message || err}`);
  process.exit(1);
});
