/**
 * Seeds synthetic non-crypto payment safety reports for UI/API testing.
 *
 * These records are intentionally fictional and visibly marked as TEST/DEMO.
 * Run:
 *   npx tsx scripts/seed-non-crypto-demo-reports.ts --execute
 */
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import {
  saveNonCryptoReport,
  searchPaymentIdentity,
  type EvidenceType,
  type NonCryptoScamCategory,
  type PaymentRail,
} from '../lib/non-crypto-scam-db';

dotenv.config({ path: '.env.local' });

interface DemoReport {
  country: string;
  rail: PaymentRail;
  paymentMethodDetails?: string;
  paymentIdentifier: string;
  recipientName?: string;
  businessName?: string;
  aliases?: string[];
  category: NonCryptoScamCategory;
  categoryDetails?: string;
  amount?: number;
  currency?: string;
  incidentDate?: string;
  description: string;
  reporterEmail?: string;
  evidenceTypes?: EvidenceType[];
}

async function main() {
  const execute = process.argv.includes('--execute');
  if (!execute) {
    console.log('Dry run only. Add --execute to write synthetic TEST/DEMO reports.');
  }

  const fixturePath = path.join(process.cwd(), 'tests', 'fixtures', 'non-crypto-demo-reports.json');
  const reports = JSON.parse(fs.readFileSync(fixturePath, 'utf8')) as DemoReport[];
  let created = 0;
  let skipped = 0;

  for (const report of reports) {
    const existing = await searchPaymentIdentity({
      country: report.country,
      rail: report.rail,
      paymentIdentifier: report.paymentIdentifier,
    });

    if (existing) {
      skipped += 1;
      console.log(`SKIP existing ${report.country}/${report.rail}: ${existing.identityMask}`);
      continue;
    }

    if (!execute) {
      console.log(`WOULD CREATE ${report.country}/${report.rail}: ${report.paymentIdentifier}`);
      continue;
    }

    const result = await saveNonCryptoReport({
      ...report,
      description: `TEST SCAM REPORT - FICTIONAL DEMO DATA. ${report.description}`,
      ip: `demo-seed-${report.country.toLowerCase()}-${report.rail}`,
    });
    created += 1;
    console.log(`CREATED ${result.id} ${report.country}/${report.rail}: ${result.identity.identityMask}`);
  }

  console.log(JSON.stringify({ created, skipped, total: reports.length }, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
