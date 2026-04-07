import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import React from 'react';
import { renderToBuffer } from '@react-pdf/renderer';
import { getResearch, saveGeneratedPdf, updateCountryStatus } from '../../lib/legal-packs/s3';
import { getCountry } from '../../lib/legal-packs/countries';
import {
  PoliceComplaintDoc,
  PreservationLetterDoc,
  RegulatorComplaintDoc,
  ActionGuideDoc,
} from '../../lib/legal-packs/templates';
import type { CountryResearch, CaseData, TemplateType } from '../../lib/legal-packs/types';

const TEMPLATE_TYPES: TemplateType[] = [
  'police-complaint',
  'preservation-letter',
  'regulator-complaint',
  'action-guide',
];

function buildPlaceholderCaseData(research: CountryResearch): CaseData {
  return {
    caseId: `TEMPLATE-${research.code}`,
    date: new Date().toISOString().split('T')[0],
    victimName: '',
    victimEmail: '',
    country: research.code,
    incidentDate: '',
    lossAmount: 0,
    lossCurrency: 'USD',
    cryptoType: '',
    scammerAddress: '',
    txid: '',
    platformName: '',
    network: '',
    scamType: '',
    description: '',
  };
}

function getDocumentComponent(
  templateType: TemplateType,
  research: CountryResearch,
  caseData: CaseData,
): React.ReactElement {
  const props = { research, caseData };
  switch (templateType) {
    case 'police-complaint':
      return React.createElement(PoliceComplaintDoc, props);
    case 'preservation-letter':
      return React.createElement(PreservationLetterDoc, props);
    case 'regulator-complaint':
      return React.createElement(RegulatorComplaintDoc, props);
    case 'action-guide':
      return React.createElement(ActionGuideDoc, props);
  }
}

export async function generateTemplatesForCountry(countryCode: string): Promise<number> {
  const code = countryCode.toUpperCase();
  const country = getCountry(code);
  if (!country) {
    throw new Error(`Unknown country code: ${code}`);
  }

  console.log(`Loading research for ${country.name} (${code})...`);
  const research = await getResearch(code);
  if (!research) {
    throw new Error(`No research found for ${code}. Run research-agent first.`);
  }

  const caseData = buildPlaceholderCaseData(research);
  let generated = 0;

  for (const templateType of TEMPLATE_TYPES) {
    try {
      console.log(`  Rendering ${templateType}...`);
      const doc = getDocumentComponent(templateType, research, caseData);
      const buffer = await renderToBuffer(doc);
      const pdfBuffer = Buffer.from(buffer);

      const key = await saveGeneratedPdf(code, templateType, pdfBuffer);
      console.log(`  Saved: ${key}`);
      generated++;
    } catch (err: any) {
      console.error(`  Failed to generate ${templateType}: ${err.message}`);
    }
  }

  await updateCountryStatus(code, {
    generatedAt: new Date().toISOString(),
    templatesGenerated: generated,
    status: generated === TEMPLATE_TYPES.length ? 'needs_review' : 'error',
    ...(generated < TEMPLATE_TYPES.length && {
      error: `Only ${generated}/${TEMPLATE_TYPES.length} templates generated`,
    }),
  });

  console.log(`Generated ${generated}/${TEMPLATE_TYPES.length} templates for ${country.name}`);
  return generated;
}

// CLI entry point
if (require.main === module) {
  const countryArg = process.argv[2];
  if (!countryArg) {
    console.error('Usage: npx tsx scripts/legal-packs/template-generator.ts <COUNTRY_CODE>');
    console.error('Example: npx tsx scripts/legal-packs/template-generator.ts US');
    process.exit(1);
  }

  generateTemplatesForCountry(countryArg)
    .then((count) => {
      console.log(`\nDone! Generated ${count} templates.`);
      process.exit(0);
    })
    .catch((err) => {
      console.error(`\nError: ${err.message}`);
      process.exit(1);
    });
}
