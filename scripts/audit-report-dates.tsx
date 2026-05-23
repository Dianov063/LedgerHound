/**
 * Definitive date audit — renders the full ReportDocument React tree (executing
 * every page/sub component) and collects every text string, then reports all
 * yyyy-mm-dd dates with counts. Verifies the report-generation date is uniform
 * across all pages and that no future (>=2027) date leaks in.
 *
 * Unlike PDF byte-extraction, this reads the actual rendered Text nodes (the
 * PDF embeds CID-subsetted fonts, so dates are not plain bytes in the file).
 *
 * Run: npx tsx scripts/audit-report-dates.tsx
 */
import React from 'react';
import { ReportDocument } from '../lib/reportPdf';
import { getReportTranslations } from '../lib/report-i18n';
import type { ReportData } from '../lib/generateReport';
import { detectAddressPoisoning } from '../lib/address-poisoning';
import { detectUnicodeSpoofing } from '../lib/unicode-spoofing';

const GEN_DATE = '2026-05-22'; // the single report-generation date under test

const SUBJECT = '0xbc8996a9a5ff12ebf8702e857cc0faa451dc9569';
const REAL = '0x073a4abbf262d8f946866f3ce62660ee7cf4609f';
const SPOOF_MIS = '0x073a4e18d36d6158475358eed4796235d84d609f';
const SPOOF1 = '0x073acba9caa50d332666a0eb361a47ad1d66609f';
const lisuUSDT = '\u{A4F4}\u{A4E2}\u{A4D3}\u{A4D4}';
const mixedUSDT = '\u{00DA}\u{0405}D\u{0422}';
const attackTxs = [
  { from: SUBJECT, to: REAL, value: 22187.44, asset: 'USDT', assetRaw: 'USDT', metadata: { blockTimestamp: '2026-04-01T00:00:00Z' }, hash: '0xr1' },
  { from: SPOOF1, to: SUBJECT, value: 0.001, asset: 'USDT', assetRaw: 'USDT', metadata: { blockTimestamp: '2026-03-15T00:00:00Z' }, hash: '0xd1' },
  { from: SPOOF_MIS, to: SUBJECT, value: 0.05, asset: 'USDT', assetRaw: 'USDT', metadata: { blockTimestamp: '2026-03-05T00:00:00Z' }, hash: '0xd2' },
  { from: SUBJECT, to: SPOOF_MIS, value: 11020.50, asset: 'USDT', assetRaw: 'USDT', metadata: { blockTimestamp: '2026-03-07T00:00:00Z' }, hash: '0xm1' },
  { from: SPOOF1, to: SUBJECT, value: 1, asset: null, assetRaw: lisuUSDT, metadata: { blockTimestamp: '2026-02-25T00:00:00Z' }, hash: '0xs1' },
  { from: SPOOF_MIS, to: SUBJECT, value: 1, asset: 'UD', assetRaw: mixedUSDT, metadata: { blockTimestamp: '2026-04-01T00:00:00Z' }, hash: '0xs2' },
];
const addressPoisoning = detectAddressPoisoning({ allTransactions: attackTxs as any, subjectAddress: SUBJECT });
const unicodeSpoofing = detectUnicodeSpoofing({ allTransactions: attackTxs as any });

const mock: ReportData = {
  walletAddress: SUBJECT, caseId: 'LH-DATEAUDIT', date: GEN_DATE,
  network: 'eth', networkLabel: 'Ethereum (ETH)', nativeCurrency: 'ETH',
  totalReceived: 50, totalSent: 49, netBalance: 1, ethReceived: 50, ethSent: 49,
  transactionCount: 27, uniqueTokens: ['USDT', 'ETH'], spamFiltered: 1,
  firstActivity: '2026-02-01', lastActivity: '2026-04-05', inactiveDays: 46,
  topCounterparties: [{ address: REAL, label: 'Unknown', count: 2, volume: 27187 }],
  identifiedEntities: [{ address: '0x28c6c06298d514db089934071355e5743bf21d60', label: 'Binance', type: 'exchange', interactions: 3, parentEntity: 'Binance', complianceEmail: 'ce@binance.com' }],
  riskScore: 55, riskLabel: 'MODERATE',
  recoveryAssessment: { score: 20, label: 'Low', tier: 'LOW', disclaimer: 'Estimate.', factors: { positive: ['KYC exit'], negative: ['Rapid forward'] } } as any,
  recoveryScore: 20, recoveryLabel: 'Low', ofacWarning: false, scamDbMatches: [],
  keyFindings: ['Address poisoning detected.'], recommendations: ['File IC3 report.'],
  transactions: [
    { date: '2026-03-07', direction: 'OUT', from: SUBJECT, to: SPOOF_MIS, value: 11020.5, token: 'USDT' },
    { date: '2026-04-01', direction: 'IN', from: REAL, to: SUBJECT, value: 22187.44, token: 'USDT' },
  ],
  graphData: null,
  riskBreakdown: { unknownWalletInteraction: 20, mixerInteraction: 0, exchangeInteraction: -10, multiHopTransfers: 0, stablecoinUsage: 5, sanctionedAddress: 0, scamDbMatch: 0 } as any,
  timeline: [
    { date: '2026-02-25', type: 'FIRST_ACTIVITY', description: 'First activity', highlight: false } as any,
    { date: '2026-03-07', type: 'MAJOR_OUTFLOW', description: 'Sent 11020 USDT', highlight: true } as any,
    { date: '2026-04-05', type: 'LAST_ACTIVITY', description: 'Last activity', highlight: false } as any,
  ],
  // Elayne-representative: victim funded via KYC exchange, but NO scammer KYC exit.
  exitPointAnalysis: { exitPoints: [], hasKycExit: false, hasMixerUsage: false, hasCrossChain: false, overallRecoveryAssessment: 'MEDIUM' } as any,
  recoveryScenarios: [], assetSummary: { realAssets: [{ symbol: 'USDT', totalIn: 22187, totalOut: 11020 }], spamTokens: [{ symbol: 'HEX', count: 1 }], spoofTokens: [], spamCount: 1 } as any,
  patternAnalysis: { overallRisk: 'SUSPICIOUS', interpretation: 'Test', patterns: [] } as any,
  crossChainTrace: null,
  narrative: { walletType: 'victim', walletTypeLabel: 'Victim', roleConfidence: 0.85, roleReasoning: ['CEX-funded'], uniqueSenders: 5, uniqueReceivers: 4, forwardingPercent: 80, primaryExitExchange: '', primaryExitExchangeEmail: '', summary: 'Victim.', conclusion: 'Conclusion.' } as any,
  evidenceStrength: { score: 70, label: 'STRONG', factors: [{ label: 'Poisoning identified', met: true, severity: 'high' }] } as any,
  topInflows: [{ from: REAL, value: 22187.44, token: 'USDT', date: '2026-04-01' }],
  exchangeComplianceEmails: [{ name: 'Binance', email: 'ce@binance.com' }],
  legalWeight: [{ label: 'Law enforcement submission', suitable: true }],
  primaryAsset: { symbol: 'USDT', totalIn: 22187, totalOut: 11020 },
  counterpartyPhishingFlags: 1, counterpartyScamDbMatches: 0, addressLabels: [],
  externalIntelligenceDegraded: false,
  attackTechniques: { addressPoisoning, unicodeSpoofing },
  exchangeAnalysis: { entryPoints: [{ address: '0x28c6c06298d514db089934071355e5743bf21d60', label: 'Binance 14', parentEntity: 'Binance', type: 'entry', interactionCount: 9, totalValue: 30, token: 'ETH', complianceEmail: 'ce@binance.com' }], exitPoints: [], hasEntryKyc: true, hasExitKyc: false } as any,
};

// @react-pdf primitive component names — recurse into children, do NOT execute.
const PRIMITIVES = new Set(['Document', 'Page', 'View', 'Text', 'Link', 'Image', 'Note', 'Canvas', 'Svg', 'G', 'Path', 'Rect', 'Line', 'Circle', 'Ellipse', 'Polygon', 'Polyline', 'Defs', 'ClipPath', 'LinearGradient', 'RadialGradient', 'Stop', 'Tspan']);

const texts: string[] = [];
function walk(node: any, depth = 0): void {
  if (node == null || node === false || node === true) return;
  if (typeof node === 'string') { texts.push(node); return; }
  if (typeof node === 'number') { texts.push(String(node)); return; }
  if (Array.isArray(node)) { node.forEach((c) => walk(c, depth)); return; }
  if (depth > 200) return;
  const type = node.type;
  if (typeof type === 'function') {
    const name = type.displayName || type.name || '';
    if (!PRIMITIVES.has(name)) {
      // My component — execute it to get its subtree.
      let rendered;
      try { rendered = type(node.props || {}); } catch (e) { return; }
      walk(rendered, depth + 1);
      return;
    }
  }
  // Primitive (string type or @react-pdf primitive): recurse into children.
  const children = node.props ? node.props.children : undefined;
  if (children !== undefined) walk(children, depth + 1);
}

const tree = (ReportDocument as any)({ data: mock, locale: 'es', country: 'PE' });
walk(tree);

const joined = texts.join('');
const dateRe = /\b(\d{4})-(\d{2})-(\d{2})\b/g;
const counts = new Map<string, number>();
let m;
while ((m = dateRe.exec(joined)) !== null) counts.set(m[0], (counts.get(m[0]) || 0) + 1);

console.log('═'.repeat(70));
console.log('  Report date audit (full React tree walk, locale=es country=PE)');
console.log('═'.repeat(70));
console.log(`  Text nodes collected: ${texts.length}`);
console.log(`  Generation date under test: ${GEN_DATE}`);
console.log('\n  All yyyy-mm-dd dates rendered:');
for (const [date, n] of Array.from(counts.entries()).sort()) {
  const yr = +date.slice(0, 4);
  console.log(`    ${date}  x${n}${yr >= 2027 ? '   <-- FUTURE/SUSPECT' : ''}`);
}

const future = Array.from(counts.keys()).filter((x) => +x.slice(0, 4) >= 2027);
const genCount = counts.get(GEN_DATE) || 0;

console.log('\n  ── Assertions ──');
let fail = 0;
const ok = (c: boolean, msg: string) => { if (c) console.log(`  ✓ ${msg}`); else { fail++; console.log(`  ✗ ${msg}`); } };
ok(future.length === 0, `no future (>=2027) dates present${future.length ? ' → ' + future.join(', ') : ''}`);
ok(!counts.has('2028-05-22'), 'no 2028-05-22 anywhere (the audit-reported bug)');
ok(genCount >= 2, `generation date ${GEN_DATE} rendered ${genCount}x (cover + per-page headers)`);
ok(Array.from(counts.keys()).every((d) => d.startsWith('2026')), 'every rendered date is in 2026 (mock data year)');
// Phase 3.1 Issue #5: victim/no-exit STEP 1 banner renders (legal-defensive framing).
ok(joined.includes('PUNTO DE FINANCIAMIENTO KYC IDENTIFICADO (VÍCTIMA)'), 'victim KYC banner rendered (es)');
ok(!joined.includes('congelamiento inmediato'), 'no unconditional "congelamiento inmediato" freeze wording');
// Phase 3.1 Stage 5 (R1): top banner must NOT overpromise a recovery path for victim/no-exit.
ok(!joined.includes('CAMINO DE RECUPERACIÓN IDENTIFICADO'), 'R1: no "CAMINO DE RECUPERACIÓN IDENTIFICADO" for victim/no-exit');
// Phase 3.1 Stage 5 (R2): attack-technique forensic interpretation softened.
ok(!joined.includes('operación de fraude multi-wallet'), 'R2: no "operación de fraude multi-wallet"');
ok(joined.includes('operación coordinada multi-wallet'), 'R2: uses "operación coordinada multi-wallet"');
// Phase 3.1 Stage 5 (R3): attack-technique intro aligned with "documentación de apoyo".
ok(!joined.includes('evidencia crítica para las autoridades'), 'R3: no "evidencia crítica para las autoridades"');
ok(joined.includes('documentación de apoyo importante'), 'R3: uses "documentación de apoyo importante"');
// Phase 3.1 Stage 6 (F1): no aggressive freeze in STEP 3 preservation letter.
ok(!joined.includes('congelar las cuentas sospechosas'), 'F1: no "congelar las cuentas sospechosas"');
ok(joined.includes('preservación y revisión de cumplimiento de las cuentas relacionadas'), 'F1: uses preservation/compliance-review wording');
// Phase 3.1 Stage 6 (F2): main collector described observationally, not as "scam wallet".
ok(!joined.includes('wallet principal de la estafa'), 'F2: no "wallet principal de la estafa"');
ok(!joined.includes('en esta red de fraude'), 'F2: no "en esta red de fraude"');
ok(joined.includes('wallet receptora principal observada'), 'F2: uses "wallet receptora principal observada"');
// Phase 3.1 Stage 6 (F3): address-control attribution softened (incl. footnote).
ok(!joined.includes('controladas por el atacante'), 'F3: no "controladas por el atacante" anywhere');
ok(!joined.includes('El atacante desplegó'), 'F3: no "El atacante desplegó" (passive instead)');
ok(joined.includes('consistentes con control coordinado'), 'F3: uses "consistentes con control coordinado"');
// Phase 3.1 Stage 6 (T1): unambiguous economic-loss line renders in Exec Summary.
ok(joined.includes('Pérdida económica total de la víctima'), 'T1: economic-loss line rendered in Exec Summary');

// ── Direct i18n checks for generated prose not exercised by the mock render ──
const es6 = getReportTranslations('es');
ok(es6.investigation.totalEconomicLossLine('64,248.31 USDT', '11,020.50 USDT').includes('de los cuales 11,020.50 USDT'), 'T1: loss-line function interpolates misdirected');
ok(es6.investigation.narrative.summaryVictim('x', 1, 98, 4, 'y', '').includes('(por volumen)'), 'T2: narrative pct labeled "(por volumen)"');
ok(es6.behavioral.rapidForwardingEv(70, 7, 10)[0].includes('(por número de depósitos)'), 'T2: behavioral pct labeled "(por número de depósitos)"');
ok(es6.recovery.factorPhishingTag(1).includes('evidencia independiente'), 'T4: phishing-tag factor has cluster-evidence context');
ok(es6.steps.legalPreservationLetter.includes('preservación y revisión de cumplimiento'), 'F1: preservation-letter wording (es)');
ok(!es6.steps.legalPreservationLetter.includes('congelar'), 'F1: no "congelar" in preservation letter');
ok(es6.entityId.exitTruncatedNote.includes('Historial Completo'), 'T3: exit-points truncation footnote exists');
ok(es6.attackTechnique.combiningMarksNote.includes('Normalization Form Canonical Composition'), 'T7: NFC acronym expanded');
ok(es6.addressVerification.remaining(17).includes('más'), 'T7: "+N más" (not "more") in Spanish');

console.log('\n' + '─'.repeat(70));
console.log(`  ${fail === 0 ? 'PASS — dates uniform + Stage 5 wording resolved' : 'FAIL'}`);
console.log('─'.repeat(70));
process.exit(fail === 0 ? 0 : 1);
