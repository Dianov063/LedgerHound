import 'dotenv/config';
import { getResearch } from '../../lib/legal-packs/s3';
import { getCountry, COUNTRIES } from '../../lib/legal-packs/countries';
import type { CountryResearch, ValidationResult } from '../../lib/legal-packs/types';

const URL_REGEX = /^https:\/\/.+/;

function check(name: string, passed: boolean, message?: string) {
  return { name, passed, message: passed ? undefined : message };
}

export async function validateCountry(countryCode: string): Promise<ValidationResult> {
  const code = countryCode.toUpperCase();
  const country = getCountry(code);
  if (!country) {
    return {
      country: code,
      template: 'police-complaint',
      passed: false,
      checks: [check('country_exists', false, `Unknown country code: ${code}`)],
    };
  }

  const research = await getResearch(code);
  if (!research) {
    return {
      country: code,
      template: 'police-complaint',
      passed: false,
      checks: [check('research_exists', false, `No research data found for ${code}. Run research-agent first.`)],
    };
  }

  const checks: ValidationResult['checks'] = [];

  // --- Required top-level sections ---
  const requiredSections: (keyof CountryResearch)[] = [
    'policeAgency',
    'financialRegulator',
    'additionalAgencies',
    'legalBasis',
    'preservationLetter',
    'localizedTerms',
    'contacts',
    'notes',
  ];

  for (const section of requiredSections) {
    const value = research[section];
    const present = value !== undefined && value !== null;
    checks.push(check(`section_${section}`, present, `Missing required section: ${section}`));
  }

  // --- No empty arrays ---
  const arrayFields: { path: string; value: unknown }[] = [
    { path: 'additionalAgencies', value: research.additionalAgencies },
    { path: 'legalBasis.civilRemedies', value: research.legalBasis?.civilRemedies },
    { path: 'preservationLetter.requiredElements', value: research.preservationLetter?.requiredElements },
    { path: 'policeAgency.requiredFields', value: research.policeAgency?.requiredFields },
    { path: 'notes', value: research.notes },
  ];

  for (const { path, value } of arrayFields) {
    if (Array.isArray(value)) {
      checks.push(check(`non_empty_array_${path}`, value.length > 0, `Array is empty: ${path}`));
    }
  }

  // --- No empty strings in key fields ---
  const stringFields: { path: string; value: unknown }[] = [
    { path: 'code', value: research.code },
    { path: 'name', value: research.name },
    { path: 'language', value: research.language },
    { path: 'lastUpdated', value: research.lastUpdated },
    { path: 'legalBasis.criminalCode', value: research.legalBasis?.criminalCode },
    { path: 'legalBasis.statuteOfLimitations', value: research.legalBasis?.statuteOfLimitations },
    { path: 'preservationLetter.legalBasis', value: research.preservationLetter?.legalBasis },
    { path: 'preservationLetter.typicalResponse', value: research.preservationLetter?.typicalResponse },
    { path: 'localizedTerms.police', value: research.localizedTerms?.police },
    { path: 'localizedTerms.complaint', value: research.localizedTerms?.complaint },
    { path: 'localizedTerms.fraud', value: research.localizedTerms?.fraud },
    { path: 'localizedTerms.cryptoFraud', value: research.localizedTerms?.cryptoFraud },
    { path: 'contacts.emergencyPhone', value: research.contacts?.emergencyPhone },
    { path: 'contacts.cybercrimeEmail', value: research.contacts?.cybercrimeEmail },
    { path: 'contacts.consumerProtection', value: research.contacts?.consumerProtection },
  ];

  for (const { path, value } of stringFields) {
    if (typeof value === 'string') {
      checks.push(check(`non_empty_${path}`, value.trim().length > 0, `Empty string: ${path}`));
    }
  }

  // --- URL validation (https://) ---
  const urlFields: { path: string; value: unknown }[] = [
    { path: 'policeAgency.url', value: research.policeAgency?.url },
    { path: 'policeAgency.complaintUrl', value: research.policeAgency?.complaintUrl },
    { path: 'financialRegulator.url', value: research.financialRegulator?.url },
    { path: 'financialRegulator.tipUrl', value: research.financialRegulator?.tipUrl },
  ];

  for (const { path, value } of urlFields) {
    if (typeof value === 'string' && value.trim().length > 0) {
      checks.push(check(`valid_url_${path}`, URL_REGEX.test(value), `Invalid URL (must start with https://): ${path} = "${value}"`));
    } else {
      checks.push(check(`valid_url_${path}`, false, `Missing or empty URL: ${path}`));
    }
  }

  // Validate additional agency URLs
  if (Array.isArray(research.additionalAgencies)) {
    for (let i = 0; i < research.additionalAgencies.length; i++) {
      const agency = research.additionalAgencies[i];
      const agencyUrl = agency?.url;
      if (typeof agencyUrl === 'string' && agencyUrl.trim().length > 0) {
        checks.push(check(
          `valid_url_additionalAgencies[${i}].url`,
          URL_REGEX.test(agencyUrl),
          `Invalid URL for agency "${agency.name}": "${agencyUrl}"`,
        ));
      }
    }
  }

  // --- Agency names non-empty ---
  const agencyNameFields: { path: string; value: unknown }[] = [
    { path: 'policeAgency.name', value: research.policeAgency?.name },
    { path: 'policeAgency.shortName', value: research.policeAgency?.shortName },
    { path: 'financialRegulator.name', value: research.financialRegulator?.name },
    { path: 'financialRegulator.shortName', value: research.financialRegulator?.shortName },
  ];

  for (const { path, value } of agencyNameFields) {
    if (typeof value === 'string') {
      checks.push(check(`agency_name_${path}`, value.trim().length > 0, `Empty agency name: ${path}`));
    } else {
      checks.push(check(`agency_name_${path}`, false, `Missing agency name: ${path}`));
    }
  }

  // Check additional agency names
  if (Array.isArray(research.additionalAgencies)) {
    for (let i = 0; i < research.additionalAgencies.length; i++) {
      const agency = research.additionalAgencies[i];
      checks.push(check(
        `agency_name_additionalAgencies[${i}]`,
        typeof agency?.name === 'string' && agency.name.trim().length > 0,
        `Empty or missing name for additional agency at index ${i}`,
      ));
    }
  }

  const passed = checks.every(c => c.passed);

  return {
    country: code,
    template: 'police-complaint',
    passed,
    checks,
  };
}

// CLI entry point
if (require.main === module) {
  const countryArg = process.argv[2];
  if (!countryArg) {
    console.error('Usage: npx tsx scripts/legal-packs/validator-agent.ts <COUNTRY_CODE>');
    console.error('Example: npx tsx scripts/legal-packs/validator-agent.ts US');
    console.error('\nAvailable countries:');
    COUNTRIES.forEach(c => console.error(`  ${c.flag} ${c.code} - ${c.name}`));
    process.exit(1);
  }

  validateCountry(countryArg)
    .then(result => {
      const failedChecks = result.checks.filter(c => !c.passed);
      const passedChecks = result.checks.filter(c => c.passed);

      console.log(`\nValidation for ${result.country}: ${result.passed ? 'PASSED' : 'FAILED'}`);
      console.log(`  ${passedChecks.length} passed, ${failedChecks.length} failed out of ${result.checks.length} checks\n`);

      if (failedChecks.length > 0) {
        console.log('Failed checks:');
        for (const c of failedChecks) {
          console.log(`  - ${c.name}: ${c.message}`);
        }
      }

      process.exit(result.passed ? 0 : 1);
    })
    .catch(err => {
      console.error(`Error: ${err.message || err}`);
      process.exit(1);
    });
}
