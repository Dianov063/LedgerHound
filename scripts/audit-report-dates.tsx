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
  counterpartyVolumeSymbol: 'USDT',
  identifiedEntities: [{ address: '0x28c6c06298d514db089934071355e5743bf21d60', label: 'Binance', type: 'exchange', interactions: 3, parentEntity: 'Binance', complianceEmail: '' }],
  riskScore: 55, riskLabel: 'MODERATE',
  recoveryAssessment: { score: 20, label: 'Low', tier: 'LOW', disclaimer: 'Estimate.', factors: { positive: ['KYC exit'], negative: ['Rapid forward'] } } as any,
  recoveryScore: 20, recoveryLabel: 'Low', ofacWarning: false, scamDbMatches: [],
  keyFindings: ['Address poisoning detected.'], recommendations: ['File IC3 report.'],
  transactions: [
    { date: '2026-03-07', direction: 'OUT', from: SUBJECT, to: SPOOF_MIS, value: 11020.5, token: 'USDT' },
    { date: '2026-04-01', direction: 'IN', from: REAL, to: SUBJECT, value: 22187.44, token: 'USDT' },
  ],
  // Phase 3.1 Stage 10: graph with one REAL edge + one SPOOF edge to exercise
  // the de-emphasized (grey/dashed) spoof rendering + "no value" label/legend.
  graphData: {
    width: 500, height: 300,
    nodes: [
      { id: 'src', label: 'Su Wallet', type: 'source', x: 250, y: 150, radius: 12, volume: 0 },
      { id: 'real', label: '0x073a4abb...', type: 'unknown', x: 410, y: 100, radius: 8, volume: 22187 },
      { id: 'spoof', label: '0x073a4e18...', type: 'scam', x: 410, y: 220, radius: 8, volume: 26191 },
    ],
    edges: [
      { fromId: 'src', toId: 'real', x1: 262, y1: 150, x2: 400, y2: 105, direction: 'OUT', label: '22.2K USDT', labelX: 331, labelY: 127, isSpoof: false },
      { fromId: 'src', toId: 'spoof', x1: 262, y1: 150, x2: 400, y2: 215, direction: 'OUT', label: '26.2K USDT ⚠', labelX: 331, labelY: 182, isSpoof: true },
    ],
  } as any,
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
  exchangeComplianceEmails: [{ name: 'Binance', email: '' }],
  legalWeight: [{ label: 'Law enforcement submission', suitable: true }],
  primaryAsset: { symbol: 'USDT', totalIn: 22187, totalOut: 11020 },
  counterpartyPhishingFlags: 1, counterpartyScamDbMatches: 0, addressLabels: [],
  externalIntelligenceDegraded: false,
  attackTechniques: { addressPoisoning, unicodeSpoofing },
  exchangeAnalysis: { entryPoints: [{ address: '0x28c6c06298d514db089934071355e5743bf21d60', label: 'Binance 14', parentEntity: 'Binance', type: 'entry', interactionCount: 9, totalValue: 30, token: 'ETH', complianceEmail: '' }], exitPoints: [], hasEntryKyc: true, hasExitKyc: false } as any,
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
// Phase 3.1 Stage 6/7 (T1/A1): unit-separated economic-loss line renders.
ok(joined.includes('Pérdida económica confirmada de la víctima'), 'T1/A1: economic-loss line rendered in Exec Summary');
ok(!joined.includes('90,439'), 'A1: no mixed-unit 90,439.x total (regression guard)');
// A4: senders-vs-transactions footnote renders on the Attack Technique page.
ok(joined.includes('puede diferir del número total de remitentes'), 'A4: senders/transactions footnote present');

// ── Direct i18n checks for generated prose not exercised by the mock render ──
const es6 = getReportTranslations('es');
{
  // A1: real currency and worthless spoof units must be SEPARATE, never summed.
  const line = es6.investigation.totalEconomicLossLine('64,248.31 USDT', '11,020.50 USDT', '26,191.64');
  ok(line.includes('64,248.31 USDT'), 'A1: loss line shows real currency total');
  ok(line.includes('11,020.50 USDT'), 'A1: loss line shows misdirected portion');
  ok(line.includes('26,191.64') && line.includes('sin valor económico'), 'A1: spoof units shown SEPARATELY (no economic value)');
  ok(!line.includes('90,439'), 'A1: loss line never sums real + spoof units');
}
// P2: timeline role markers — prominent body text with correct prepositions.
ok(es6.timeline.roleMainCollector === 'al RECOLECTOR PRINCIPAL', 'P2: collector role label (uppercase + preposition)');
ok(es6.timeline.roleSpoofAddress === 'a una DIRECCIÓN DE SUPLANTACIÓN', 'P2: spoof role label');
ok(es6.timeline.sentToRole('11,020.50', 'USDT', es6.timeline.roleMainCollector) === 'Enviado 11,020.50 USDT al RECOLECTOR PRINCIPAL', 'P2: sentToRole grammar (collector)');
ok(es6.timeline.sentToRole('11,020.50', 'USDT', es6.timeline.roleSpoofAddress) === 'Enviado 11,020.50 USDT a una DIRECCIÓN DE SUPLANTACIÓN', 'P2: sentToRole grammar (spoof)');
ok(es6.timeline.misdirectionBadge.includes('DESVÍO POR ENVENENAMIENTO'), 'P2: misdirection badge renamed');
// P4: Page 5 Binance channel explicit "no direct email" warning.
ok(es6.investigation.binanceComplianceChannel.includes('NO use un email de cumplimiento directo'), 'P4: Page 5 Binance "no direct email" warning');
// P5: KYC recovery factor softened.
ok(!es6.recovery.factorKycExchange('Binance').includes('citación judicial'), 'P5: no "citación judicial posible"');
ok(es6.recovery.factorKycExchange('Binance').includes('proceso legal'), 'P5: uses "proceso legal"');
// ── Phase 3.1 Stage 10: Fund Flow Graph real vs spoof visual separation ──
ok(joined.includes('Flujo de fondos reales'), 'S10: real-flow legend entry rendered');
ok(joined.includes('Token falsificado (sin valor de mercado)'), 'S10: spoof-flow legend entry rendered');
ok(joined.includes('26.2K USDT ⚠ sin valor'), 'S10: spoof edge label carries "sin valor" warning');
ok(es6.fundFlow.fakeNoValueWarning === 'sin valor', 'S10: fakeNoValueWarning (es)');
ok(getReportTranslations('en').fundFlow.spoofFlowLegend === 'Fake token (no market value)', 'S10: spoof-flow legend (en)');

// ── Phase 3.1 Stage 11 ──
// A1: Asset Summary net-flow disambiguation.
ok(joined.includes('Flujo neto en cuenta'), 'A1: net column renamed "Flujo neto en cuenta"');
ok(joined.includes('NO la pérdida económica'), 'A1: clarification note (net flow != economic loss) rendered');
// A3: inside-report softening (no hard attribution / no marketing-heavy / no seizure).
ok(!joined.includes('grupo de fraude controla los fondos'), 'A3: no "grupo de fraude controla los fondos"');
ok(!joined.includes('bloqueo y la incautación'), 'A3: no "bloqueo y la incautación"');
ok(!joined.includes('servicio forense completo'), 'A3: no "servicio forense completo"');
ok(es6.investigation.exitNotDetected.includes('consistente con control coordinado'), 'A3: exit-not-detected softened');
ok(!es6.investigation.roleReasoning.victimForwarded(4).includes('controladas por el estafador'), 'A3: victimForwarded no "controladas por el estafador"');
ok(es6.recovery.courtCertifiedText.includes('investigación forense ampliada certificada'), 'A3: court-certified wording softened');
// A4: counterparty volume column uses the dominant asset (USDT here), not ETH.
ok(joined.includes('Volumen (USDT)'), 'A4: counterparty volume column labeled USDT');
// B2: documents-in-package checklist (es + PE).
ok(joined.includes('Documentos en este paquete'), 'B2: documents checklist rendered (es+PE)');
ok(joined.includes('divindat-denuncia-es.md') && joined.includes('binance-compliance-es.md') && joined.includes('tether-legal-es.md'), 'B2: all 3 templates listed in order');
// ── Phase 3.1 Stage 8: PDF/template channel consistency ──
ok(!joined.includes('ce@binance.com'), 'S8 #1: no ce@binance.com anywhere in PDF');
ok(joined.includes("'Report fraud/scam'") || joined.includes('ticket de soporte'), 'S8 #1: Binance routed to support-ticket channel');
ok(!joined.includes('bloqueo interno'), 'S8 #3: no "bloqueo interno" wording');
ok(es6.recovery.exchangeComplianceText.includes('revisión interna de riesgo'), 'S8 #3: softened to "revisión interna de riesgo"');
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
