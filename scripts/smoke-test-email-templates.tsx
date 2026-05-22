/**
 * Phase 3 Part 4 smoke test — Spanish recovery email templates.
 *
 * Verifies:
 *   1. The generated templates.ts is in sync with the .md source files
 *      (re-run `node scripts/build-email-templates.cjs` if this fails).
 *   2. All 3 templates are present with the expected filenames + key content.
 *   3. The {caseId} token substitution leaves no residue.
 *
 * Run: npx tsx scripts/smoke-test-email-templates.tsx
 */
import fs from 'fs';
import path from 'path';
import { EMAIL_TEMPLATES_ES } from '../lib/email-templates/templates';

let pass = 0, fail = 0;
const ok = (cond: boolean, msg: string) => {
  if (cond) { pass++; console.log(`  ✓ ${msg}`); }
  else { fail++; console.log(`  ✗ ${msg}`); }
};

console.log('═'.repeat(70));
console.log('  Smoke test: Spanish email templates (Phase 3 Part 4)');
console.log('═'.repeat(70));

const DIR = path.join(process.cwd(), 'lib', 'email-templates');

/* ── 1. Drift guard: .ts must match .md ── */
console.log('\n[1] templates.ts in sync with .md sources');
ok(EMAIL_TEMPLATES_ES.length === 3, `3 templates exported (got ${EMAIL_TEMPLATES_ES.length})`);
for (const t of EMAIL_TEMPLATES_ES) {
  const md = fs.readFileSync(path.join(DIR, t.filename), 'utf8');
  ok(md === t.content, `${t.filename} content matches .md source`);
}

/* ── 2. Expected templates + content ── */
console.log('\n[2] Expected filenames + critical content');
const byFile = Object.fromEntries(EMAIL_TEMPLATES_ES.map((t) => [t.filename, t.content]));
ok('binance-compliance-es.md' in byFile, 'binance-compliance-es.md present');
ok('tether-legal-es.md' in byFile, 'tether-legal-es.md present');
ok('divindat-denuncia-es.md' in byFile, 'divindat-denuncia-es.md present');

ok(byFile['binance-compliance-es.md']?.includes('ce@binance.com'), 'Binance compliance address present');
ok(byFile['tether-legal-es.md']?.includes('legal@tether.to'), 'Tether legal address present');
ok(byFile['tether-legal-es.md']?.includes('a discreción de Tether'), 'Tether softened-language (no freeze promise) intact');
ok(byFile['divindat-denuncia-es.md']?.includes('DIVINDAT'), 'DIVINDAT title present');
ok(byFile['divindat-denuncia-es.md']?.includes('Art. 196'), 'DIVINDAT statute citation present');
ok(EMAIL_TEMPLATES_ES.every((t) => t.content.includes('{caseId}')), 'all templates carry a {caseId} token');

/* ── 2b. DIVINDAT legal hardening (Phase 3.1 Stage 2-3) ── */
console.log('\n[2b] DIVINDAT legal hardening');
const div = byFile['divindat-denuncia-es.md'] || '';
// Softened wording present
ok(div.includes('modalidad compatible con fraude de inversión'), 'pig-butchering framed as "compatible con" (not asserted)');
ok(div.includes('operadores desconocidos asociados a la plataforma DZHLWK'), 'DZHLWK framed as "operadores asociados" (defamation-safe)');
ok(div.includes('compatible con operación coordinada multi-wallet'), 'statistics softened (no exact probability)');
// Risky language removed
ok(!div.includes('Lavado de activos'), 'NO "Lavado de activos" overcharge');
ok(!div.includes('1 en 4.3 mil millones'), 'NO "1 en 4.3 mil millones" probability claim');
ok(!div.includes('operación fraudulenta DZHLWK'), 'NO "operación fraudulenta DZHLWK" (defamation risk) removed');
// New sections present
ok(div.includes('## II. PÉRDIDA ECONÓMICA'), 'PÉRDIDA ECONÓMICA section added');
ok(div.includes('## VI. ANEXOS DIGITALES (CADENA DE CUSTODIA)') && div.includes('SHA256'), 'chain-of-custody section + SHA256 added');
ok(div.includes('### 2. ORDEN DE PRESERVACIÓN INMEDIATA'), 'preservation order added to petitorio');
// Sections renumbered consistently I→VI
ok(['## I. HECHOS', '## II. PÉRDIDA', '## III. EVIDENCIA', '## IV. PETITORIO', '## V. ANEXOS', '## VI. ANEXOS DIGITALES'].every((h) => div.includes(h)), 'sections renumbered I→VI consistently');

/* ── 3. caseId substitution leaves no residue ── */
console.log('\n[3] {caseId} substitution');
const caseId = 'LH-TEST123';
for (const t of EMAIL_TEMPLATES_ES) {
  const filled = t.content.replace(/\[\{caseId\}\]/g, caseId).replace(/\{caseId\}/g, caseId);
  ok(!filled.includes('{caseId}'), `${t.filename}: no leftover {caseId} after fill`);
  ok(filled.includes(caseId), `${t.filename}: caseId injected`);
}

/* ── 4. Country-conditional delivery ── */
console.log('\n[4] Country-gated attachment selection');
// Mirrors the filter used in lib/sendReport.ts.
const selectFor = (locale: string, country: string): string[] => {
  if (locale !== 'es') return [];
  return EMAIL_TEMPLATES_ES
    .filter((t) => t.country === null || t.country === country)
    .map((t) => t.id);
};
const eq = (a: string[], b: string[]) => a.length === b.length && a.every((x, i) => x === b[i]);

ok(EMAIL_TEMPLATES_ES.find((t) => t.id === 'divindat')?.country === 'PE', 'divindat gated to country PE');
ok(EMAIL_TEMPLATES_ES.find((t) => t.id === 'binance')?.country === null, 'binance is universal (country null)');
ok(EMAIL_TEMPLATES_ES.find((t) => t.id === 'tether')?.country === null, 'tether is universal (country null)');

ok(eq(selectFor('es', 'PE'), ['binance', 'tether', 'divindat']), 'es + PE → binance, tether, divindat (3)');
ok(eq(selectFor('es', 'MX'), ['binance', 'tether']), 'es + MX → binance, tether (2, NO divindat)');
ok(eq(selectFor('es', ''), ['binance', 'tether']), 'es + "" → binance, tether (2)');
ok(eq(selectFor('en', 'PE'), []), 'en + PE → 0 templates (English report)');

console.log('\n' + '─'.repeat(70));
console.log(`  ${pass} passed · ${fail} failed`);
console.log('─'.repeat(70));
process.exit(fail === 0 ? 0 : 1);
