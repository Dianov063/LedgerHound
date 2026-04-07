import 'dotenv/config';
import { getCountry, COUNTRIES } from '../../lib/legal-packs/countries';
import { updateCountryStatus } from '../../lib/legal-packs/s3';
import { researchCountry } from './research-agent';
import { validateCountry } from './validator-agent';
import { generateTemplatesForCountry } from './template-generator';

export async function refreshCountry(countryCode: string): Promise<{ success: boolean; error?: string }> {
  const code = countryCode.toUpperCase();
  const country = getCountry(code);
  if (!country) {
    throw new Error(`Unknown country code: ${code}`);
  }

  console.log(`\n--- Refresh pipeline for ${country.flag} ${country.name} (${code}) ---\n`);

  // Step 1: Research
  console.log('[1/3] Running research...');
  try {
    await updateCountryStatus(code, {
      status: 'needs_review',
      researchedAt: null,
      validatedAt: null,
      generatedAt: null,
      templatesGenerated: 0,
      validationPassed: false,
    });

    await researchCountry(code);

    await updateCountryStatus(code, {
      researchedAt: new Date().toISOString(),
    });
    console.log('[1/3] Research complete.\n');
  } catch (err: any) {
    const message = `Research failed: ${err.message}`;
    console.error(`[1/3] ${message}`);
    await updateCountryStatus(code, {
      status: 'error',
      error: message,
    });
    return { success: false, error: message };
  }

  // Step 2: Validate
  console.log('[2/3] Running validation...');
  try {
    const result = await validateCountry(code);
    const failedChecks = result.checks.filter(c => !c.passed);

    await updateCountryStatus(code, {
      validatedAt: new Date().toISOString(),
      validationPassed: result.passed,
    });

    if (!result.passed) {
      const message = `Validation failed with ${failedChecks.length} issue(s)`;
      console.error(`[2/3] ${message}:`);
      for (const c of failedChecks) {
        console.error(`  - ${c.name}: ${c.message}`);
      }
      await updateCountryStatus(code, {
        status: 'needs_review',
        error: message,
      });
      return { success: false, error: message };
    }

    console.log(`[2/3] Validation passed (${result.checks.length} checks).\n`);
  } catch (err: any) {
    const message = `Validation error: ${err.message}`;
    console.error(`[2/3] ${message}`);
    await updateCountryStatus(code, {
      status: 'error',
      error: message,
    });
    return { success: false, error: message };
  }

  // Step 3: Generate templates
  console.log('[3/3] Generating templates...');
  try {
    const count = await generateTemplatesForCountry(code);

    await updateCountryStatus(code, {
      generatedAt: new Date().toISOString(),
      templatesGenerated: count,
      status: 'ready',
      error: undefined,
    });

    console.log(`[3/3] Generated ${count} templates.\n`);
    console.log(`--- ${country.flag} ${country.name} refresh complete ---\n`);
    return { success: true };
  } catch (err: any) {
    const message = `Template generation failed: ${err.message}`;
    console.error(`[3/3] ${message}`);
    await updateCountryStatus(code, {
      status: 'error',
      error: message,
    });
    return { success: false, error: message };
  }
}

// CLI entry point
if (require.main === module) {
  const countryArg = process.argv[2];
  if (!countryArg) {
    console.error('Usage: npx tsx scripts/legal-packs/refresh-pipeline.ts <COUNTRY_CODE>');
    console.error('Example: npx tsx scripts/legal-packs/refresh-pipeline.ts US');
    console.error('\nAvailable countries:');
    COUNTRIES.forEach(c => console.error(`  ${c.flag} ${c.code} - ${c.name}`));
    process.exit(1);
  }

  refreshCountry(countryArg)
    .then(result => {
      if (result.success) {
        console.log('Done!');
        process.exit(0);
      } else {
        console.error(`Pipeline stopped: ${result.error}`);
        process.exit(1);
      }
    })
    .catch(err => {
      console.error(`Error: ${err.message || err}`);
      process.exit(1);
    });
}
