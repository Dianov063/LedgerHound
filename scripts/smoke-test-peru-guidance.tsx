/**
 * Phase 3 Part 3 smoke test — Peru-specific recovery guidance.
 *
 * Verifies, with NO network calls:
 *   1. The countryGuidance.peru namespace exists in both en + es and the es
 *      strings are genuinely Spanish (EN ≠ ES on a few keys).
 *   2. ReportDocument includes the Peru page ONLY when locale==='es' && country==='PE'.
 *      (en+PE, es+'' , es+MX must NOT include it.)
 *
 * Run: npx tsx scripts/smoke-test-peru-guidance.tsx
 */

import { getReportTranslations } from '../lib/report-i18n';
import { ReportDocument } from '../lib/reportPdf';

let pass = 0;
let fail = 0;
const ok = (cond: boolean, msg: string) => {
  if (cond) { pass++; console.log(`  ✓ ${msg}`); }
  else { fail++; console.log(`  ✗ ${msg}`); }
};

console.log('═'.repeat(70));
console.log('  Smoke test: Peru guidance (Phase 3 Part 3)');
console.log('═'.repeat(70));

/* ── 1. i18n namespace presence + Spanish-ness ── */
console.log('\n[1] countryGuidance.peru namespace');
const en = getReportTranslations('en').countryGuidance.peru;
const es = getReportTranslations('es').countryGuidance.peru;
ok(!!en && !!es, 'peru namespace present in both en and es');
ok(es.title === 'Recursos Específicos para Perú', `es.title = "${es.title}"`);
ok(en.title === 'Peru-Specific Recovery Resources', `en.title = "${en.title}"`);
ok(es.title !== en.title, 'es.title ≠ en.title (translated)');
ok(es.intro !== en.intro, 'es.intro ≠ en.intro (translated)');
ok(es.divindatDescription !== en.divindatDescription, 'es.divindatDescription ≠ en (translated)');
ok(es.divindatTitle.includes('DIVINDAT'), 'es DIVINDAT title present');
ok(es.sbsTitle.includes('SBS'), 'es SBS title present');
ok(es.indecopiTitle.includes('INDECOPI'), 'es INDECOPI title present');
ok(es.calTitle.includes('CAL'), 'es CAL title present');
ok(es.reniecTitle.includes('RENIEC'), 'es RENIEC title present');
ok(es.ministerioPublicoUrl === 'https://denuncias.mpfn.gob.pe/', 'es Ministerio Público URL intact');

/* ── 2. Conditional rendering ── */
console.log('\n[2] ReportDocument conditional rendering');

// Minimal data — ReportDocument only reads crossChainTrace / addressLabels /
// attackTechniques at the top level; child components are NOT invoked when we
// inspect the element tree (JSX creates elements lazily).
const data: any = {
  caseId: 'LH-TEST',
  date: '2026-05-22',
  crossChainTrace: { detected: false },
  addressLabels: [],
  attackTechniques: undefined,
};

const hasPeruPage = (locale: string, country: string): boolean => {
  const tree: any = (ReportDocument as any)({ data, locale, country });
  const children = ([] as any[]).concat(tree?.props?.children ?? []);
  return children.some((c) => c && c.type && (c.type.name === 'PeruGuidancePage'));
};

ok(hasPeruPage('es', 'PE') === true, 'es + PE  → Peru page INCLUDED');
ok(hasPeruPage('en', 'PE') === false, 'en + PE  → Peru page excluded (English report)');
ok(hasPeruPage('es', '') === false, 'es + ""  → Peru page excluded (no country)');
ok(hasPeruPage('es', 'MX') === false, 'es + MX  → Peru page excluded (other country)');
ok(hasPeruPage('es', undefined as any) === false, 'es + undefined → Peru page excluded');

/* ── Summary ── */
console.log('\n' + '─'.repeat(70));
console.log(`  ${pass} passed · ${fail} failed`);
console.log('─'.repeat(70));
process.exit(fail === 0 ? 0 : 1);
