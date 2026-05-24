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

ok(byFile['binance-compliance-es.md']?.includes('binance.com/en/support'), 'Binance correct support channel present');
ok(byFile['tether-legal-es.md']?.includes('legal@tether.to'), 'Tether legal address present');
ok(byFile['tether-legal-es.md']?.includes('a discreción de Tether'), 'Tether softened-language (no freeze promise) intact');

/* ── 2c. Stage 4: Binance + Tether legal hardening (consistency with DIVINDAT) ── */
console.log('\n[2c] Binance + Tether legal hardening');
const bin = byFile['binance-compliance-es.md'] || '';
const teth = byFile['tether-legal-es.md'] || '';
// Defamation: no template names DZHLWK as "fraudulenta"
for (const [name, body] of [['binance', bin], ['tether', teth], ['divindat', byFile['divindat-denuncia-es.md'] || '']] as const) {
  ok(!body.includes('plataforma fraudulenta'), `${name}: no "plataforma fraudulenta" (defamation-safe)`);
  ok(!body.includes('Plataforma fraudulenta'), `${name}: no "Plataforma fraudulenta:" label`);
  ok(!body.includes('operación fraudulenta'), `${name}: no generic "operación fraudulenta"`);
}
// Binance pig-butchering softened (no bare assertion)
ok(!bin.includes('estafa "pig butchering"'), 'binance: no bare "estafa pig butchering" assertion');
ok(bin.includes('compatible con esquemas conocidos como "pig butchering"'), 'binance: pig-butchering framed as "compatible con"');
ok(bin.includes('REVISIÓN DE CUMPLIMIENTO Y MONITOREO DE RIESGO'), 'binance: blacklist reframed as compliance review');
// Chain-of-custody present in all 3
ok(bin.includes('CADENA DE CUSTODIA DIGITAL') && bin.includes('SHA256'), 'binance: chain-of-custody + SHA256 added');
ok(teth.includes('CADENA DE CUSTODIA DIGITAL') && teth.includes('SHA256'), 'tether: chain-of-custody + SHA256 added');
ok(teth.includes('Plataforma involucrada'), 'tether: "Plataforma involucrada" (neutral label)');

/* ── 2d. Stage 6 T6: template channel corrections ── */
console.log('\n[2d] Stage 6 T6 — channel corrections');
const divv = byFile['divindat-denuncia-es.md'] || '';
// Binance: correct victim channel + UID requirement
ok(bin.includes('Report fraud/scam'), 'binance: routes victims to "Report fraud/scam" ticket');
ok(bin.includes('UID'), 'binance: UID requirement present');
ok(bin.includes('law-enforcement'), 'binance: LE portal noted as authorities-only');
ok(!bin.includes('ce@binance.com'), 'binance: no longer points victims at ce@binance.com');
// Tether: direct-victim limitation + full contract
ok(teth.includes('DESPUÉS de presentar'), 'tether: direct-victim limitation note present');
ok(teth.includes('0x9a0c5ce706b1b7242158065e4aef90750775cee5'), 'tether: full spoof contract address (not truncated)');
ok(!teth.includes('0x9a0C...Cee5'), 'tether: truncated contract removed');
// Stage 15 P1-3: count-agnostic wording for spoof addresses that received real funds.
ok(teth.includes('recibieron fondos reales (una o más)'), 'tether: count-agnostic real-fund spoof wording (P1-3)');
ok(!teth.includes('Suplantaciones secundarias adicionales'), 'tether: plural-implying "Suplantaciones secundarias adicionales" removed (P1-3)');
// Stage 16 P2-2: DIVINDAT clarifies why funds to the collector count as loss.
const divi = byFile['divindat-denuncia-es.md'] || '';
ok(divi.includes('El recolector NO es un destinatario legítimo'), 'divindat: loss-computation clarification (collector not legitimate) (P2-2)');
// DIVINDAT: accurate Art. 196 / 196-A + contact block
ok(divv.includes('Art. 196-A'), 'divindat: references Art. 196-A (estafa agravada)');
ok(divv.includes('participación de dos o más personas'), 'divindat: accurate 196-A aggravator (2+ persons, NOT 20-UIT)');
ok(!divv.includes('20 UIT'), 'divindat: no incorrect "20 UIT" basis');
ok(divv.includes('(01) 431-8898') && divv.includes('divindat.pnp@gmail.com'), 'divindat: contact block (phone + email)');
// SHA256 references the PDF integrity section (primary) + email (backup) — Stage 11.2.
ok([bin, teth, divv].every((b) => b.includes('Verificación de Integridad')), 'all 3: SHA256 references the integrity section');
ok([bin, teth, divv].every((b) => b.includes('informe forense PDF')), 'all 3: SHA256 points to the PDF (primary) + email (backup)');

/* ── 2e. Stage 9 P3: anti-bait guard-rails (real vs spoof) in Binance + Tether ── */
console.log('\n[2e] Stage 9 P3 — anti-bait guard-rails');
ok(bin.includes('NO sume con la cantidad real'), 'binance: "NO sume" guard-rail present');
ok(teth.includes('NO sume con la pérdida real'), 'tether: "NO sume" guard-rail present');
ok(bin.includes('Pérdida económica confirmada'), 'binance: references "Pérdida económica confirmada" section');
ok(teth.includes('Pérdida económica confirmada'), 'tether: references "Pérdida económica confirmada" section');
ok(!bin.includes('Aproximadamente $[monto] USD en USDT'), 'binance: old ambiguous loss field replaced');
// Phase 3.1 Stage 10 P-bonus: "controladas por" qualified with "presuntamente".
for (const [name, body] of [['binance', bin], ['tether', teth], ['divindat', byFile['divindat-denuncia-es.md'] || '']] as const) {
  ok(!/(?<!presuntamente )controladas por los operadores del fraude/.test(body), `${name}: no unqualified "controladas por"`);
  ok(body.includes('presuntamente controladas por los operadores del fraude'), `${name}: uses "presuntamente controladas"`);
}
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
// Phase 3.1 Stage 7 (A2): [monto] fields reference the report section + warn against summing spoof tokens.
ok(div.includes('Pérdida económica confirmada'), 'A2: PÉRDIDA fields reference the report "Pérdida económica confirmada" section');
ok(div.includes('NO sume los tokens falsificados'), 'A2: explicit warning not to sum worthless spoof tokens');
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
