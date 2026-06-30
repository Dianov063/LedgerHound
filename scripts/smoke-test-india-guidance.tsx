/**
 * India country-module smoke test.
 *
 * Verifies:
 *   1. countryGuidance.india exists in both en + es locales with the verified
 *      authority content (1930, cybercrime.gov.in, RBI CMS, FIU-IND).
 *   2. ReportDocument includes the India page when country==='IN' in ANY locale
 *      (English-first), and excludes it otherwise.
 *
 * Run: npx tsx scripts/smoke-test-india-guidance.tsx
 */
import React from 'react';
import { getReportTranslations } from '../lib/report-i18n';
import { ReportDocument } from '../lib/reportPdf';

let pass = 0, fail = 0;
const ok = (cond: boolean, msg: string) => {
  if (cond) { pass++; console.log(`  ✓ ${msg}`); }
  else { fail++; console.log(`  ✗ ${msg}`); }
};

console.log('  Smoke test: India guidance (country-module)');

/* ── 1. Namespace + verified content ── */
console.log('\n[1] countryGuidance.india namespace');
const en = getReportTranslations('en').countryGuidance.india;
const es = getReportTranslations('es').countryGuidance.india;
ok(!!en && !!es, 'india namespace present in both en and es');
ok(en.title.includes('India'), `en.title mentions India ("${en.title}")`);
// English-first: shared content across locales until hi/bn/mr land.
ok(en.title === es.title, 'india content shared across locales (English-first)');
ok(en.i4cHelpline.includes('1930'), 'I4C card cites the 1930 helpline');
ok(en.i4cPortal.includes('cybercrime.gov.in'), 'I4C card cites cybercrime.gov.in (NCRP)');
ok(en.i4cGoldenHour.toLowerCase().includes('golden hour') || en.i4cGoldenHour.includes('1 hour'), 'golden-hour guidance present');
ok(en.i4cZeroFir.includes('₹10 lakh') && en.i4cZeroFir.includes('Zero FIR'), 'e-Zero FIR / ₹10 lakh threshold present');
ok(en.rbiPortal.includes('cms.rbi.org.in'), 'RBI card cites cms.rbi.org.in');
ok(en.exchangeTitle.includes('FIU-IND'), 'exchange card cites FIU-IND');
// Honesty guard: we deliberately do NOT route victims to CERT-In.
ok(!JSON.stringify(en).includes('CERT-In'), 'CERT-In not presented as a victim channel');

/* ── 2. Conditional rendering (country === 'IN' in ANY locale) ── */
console.log('\n[2] ReportDocument conditional rendering');
const data: any = {
  caseId: 'LH-TEST', date: '2026-06-29',
  crossChainTrace: { detected: false }, addressLabels: [], attackTechniques: undefined,
};
const hasIndiaPage = (locale: string, country: string): boolean => {
  const tree: any = (ReportDocument as any)({ data, locale, country });
  const children = ([] as any[]).concat(tree?.props?.children ?? []);
  return children.some((c) => c && c.type && (c.type.name === 'IndiaGuidancePage'));
};

ok(hasIndiaPage('en', 'IN') === true, 'en + IN → India page INCLUDED');
ok(hasIndiaPage('es', 'IN') === true, 'es + IN → India page INCLUDED (English-first, any locale)');
ok(hasIndiaPage('en', '') === false, 'en + ""  → India page excluded (no country)');
ok(hasIndiaPage('en', 'PE') === false, 'en + PE  → India page excluded (other country)');
ok(hasIndiaPage('en', undefined as any) === false, 'en + undefined → India page excluded');

console.log('\n' + '─'.repeat(70));
console.log(`  ${pass} passed · ${fail} failed`);
console.log('─'.repeat(70));
process.exit(fail === 0 ? 0 : 1);
