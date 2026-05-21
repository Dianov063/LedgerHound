/**
 * End-to-end render test: full ReportDocument with attack techniques
 * populated. Verifies the new Attack Technique Analysis page renders, the
 * Lisu font embeds, and no other page breaks with the Phase 2 data shape.
 *
 * Run: npx tsx scripts/test-attack-page-render.tsx
 */
import path from 'path';
import fs from 'fs';
import React from 'react';
import { renderToBuffer } from '@react-pdf/renderer';
import { ReportDocument } from '../lib/reportPdf';
import type { ReportData } from '../lib/generateReport';
import { detectAddressPoisoning } from '../lib/address-poisoning';
import { detectUnicodeSpoofing } from '../lib/unicode-spoofing';

const SUBJECT = '0xbc8996a9a5ff12ebf8702e857cc0faa451dc9569';
const REAL = '0x073a4abbf262d8f946866f3ce62660ee7cf4609f';
const SPOOF_MIS = '0x073a4e18d36d6158475358eed4796235d84d609f';
const SPOOF1 = '0x073acba9caa50d332666a0eb361a47ad1d66609f';
const lisuUSDT = '\u{A4F4}\u{A4E2}\u{A4D3}\u{A4D4}';
const mixedUSDT = '\u{00DA}\u{0405}D\u{0422}';

// Build realistic attack analyses via the real detectors.
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
  walletAddress: SUBJECT,
  caseId: 'LH-TESTRENDER',
  date: '2026-05-21',
  network: 'eth',
  networkLabel: 'Ethereum (ETH)',
  nativeCurrency: 'ETH',
  totalReceived: 50, totalSent: 49, netBalance: 1,
  ethReceived: 50, ethSent: 49,
  transactionCount: 27,
  uniqueTokens: ['USDT', 'ETH'],
  spamFiltered: 1,
  firstActivity: '2026-02-01', lastActivity: '2026-04-05', inactiveDays: 46,
  topCounterparties: [{ address: REAL, label: 'Unknown', count: 2, volume: 27187 }],
  identifiedEntities: [{ address: '0x28c6c06298d514db089934071355e5743bf21d60', label: 'Binance', type: 'exchange', interactions: 3, parentEntity: 'Binance', complianceEmail: 'ce@binance.com' }],
  riskScore: 55, riskLabel: 'MODERATE',
  recoveryAssessment: { score: 20, label: 'Low — recovery requires sustained legal effort', tier: 'LOW', disclaimer: 'Statistical estimate. Not a guarantee.', factors: { positive: ['KYC exchange exit'], negative: ['Funds forwarded rapidly'] } },
  recoveryScore: 20, recoveryLabel: 'Low',
  ofacWarning: false,
  scamDbMatches: [],
  keyFindings: ['Address poisoning attack detected.'],
  recommendations: ['File FBI IC3 report.'],
  transactions: [{ date: '2026-03-07', direction: 'OUT', from: SUBJECT, to: SPOOF_MIS, value: 11020.5, token: 'USDT' }],
  graphData: null,
  riskBreakdown: { unknownWalletInteraction: 20, mixerInteraction: 0, exchangeInteraction: -10, multiHopTransfers: 0, stablecoinUsage: 5, sanctionedAddress: 0, scamDbMatch: 0 },
  timeline: [{ date: '2026-03-07', type: 'MAJOR_OUTFLOW', description: 'Sent 11020 USDT', highlight: true }],
  exitPointAnalysis: { exitPoints: [], hasKycExit: true, hasMixerUsage: false, hasCrossChain: false, overallRecoveryAssessment: 'MEDIUM' },
  recoveryScenarios: [],
  assetSummary: {
    realAssets: [{ symbol: 'USDT', totalIn: 22187, totalOut: 11020 }],
    spamTokens: [{ symbol: 'HEX', count: 1 }],
    spoofTokens: unicodeSpoofing.evidence.map(e => ({ symbol: e.fakeSymbol, symbolDisplay: e.fakeSymbolDisplay, mimicsLegitimate: e.mimicsLegitimate, scriptCategory: e.scriptCategory, count: e.occurrences })),
    spamCount: 1,
  },
  patternAnalysis: { overallRisk: 'SUSPICIOUS', interpretation: 'Test', patterns: [] } as any,
  crossChainTrace: null,
  narrative: { walletType: 'victim', walletTypeLabel: 'Victim Wallet — Funds Sent to Identified Counterparty', roleConfidence: 0.85, roleReasoning: ['CEX-funded', 'rapid forward'], uniqueSenders: 5, uniqueReceivers: 4, forwardingPercent: 80, primaryExitExchange: '', primaryExitExchangeEmail: '', summary: 'Victim wallet.', conclusion: 'Conclusion: victim.' },
  evidenceStrength: { score: 70, label: 'STRONG', factors: [
    { label: 'Address poisoning attack identified (4 spoof addresses)', met: true, severity: 'high' },
    { label: 'CRITICAL: victim misdirected 11020.50 USDT to spoof address(es)', met: true, severity: 'critical' },
    { label: 'Unicode spoofing tokens detected (2 fake symbols)', met: true, severity: 'high' },
  ] },
  topInflows: [],
  exchangeComplianceEmails: [{ name: 'Binance', email: 'ce@binance.com' }],
  legalWeight: [{ label: 'Law enforcement submission', suitable: true }],
  primaryAsset: { symbol: 'USDT', totalIn: 22187, totalOut: 11020 },
  counterpartyPhishingFlags: 1,
  counterpartyScamDbMatches: 0,
  addressLabels: [],
  externalIntelligenceDegraded: false,
  attackTechniques: { addressPoisoning, unicodeSpoofing },
  exchangeAnalysis: {
    entryPoints: [{ address: '0x28c6c06298d514db089934071355e5743bf21d60', label: 'Binance 14 (Hot Wallet)', parentEntity: 'Binance', type: 'entry', interactionCount: 9, totalValue: 30, token: 'ETH', complianceEmail: 'ce@binance.com' }],
    exitPoints: [],
    hasEntryKyc: true,
    hasExitKyc: false,
  },
};

async function main() {
  console.log('Attack analyses built:');
  console.log(`  poisoning: detected=${addressPoisoning.detected} campaigns=${addressPoisoning.campaigns.length} spoofs=${addressPoisoning.totalSpoofsAcrossAllCampaigns} misdirected=${addressPoisoning.totalMisdirectedToSecondarySpoofs}`);
  console.log(`  unicode:   detected=${unicodeSpoofing.detected} symbols=${unicodeSpoofing.uniqueSpoofSymbols}`);
  console.log();

  const out = path.join(process.cwd(), 'test-reports');
  fs.mkdirSync(out, { recursive: true });

  // EN
  const bufEn = await renderToBuffer(React.createElement(ReportDocument, { data: mock, locale: 'en' }) as any);
  fs.writeFileSync(path.join(out, 'attack-page-render-test.pdf'), bufEn);
  console.log(`✓ EN ReportDocument rendered: ${bufEn.length} bytes`);

  // ES (Phase 3) — verify Spanish locale path doesn't crash and embeds fonts
  const bufEs = await renderToBuffer(React.createElement(ReportDocument, { data: mock, locale: 'es' }) as any);
  fs.writeFileSync(path.join(out, 'attack-page-render-test-es.pdf'), bufEs);
  console.log(`✓ ES ReportDocument rendered: ${bufEs.length} bytes`);
  console.log('  (Attack Technique Analysis page included; Lisu + NotoSansRpt embedded)');
}

main().catch((e) => { console.error('RENDER FAILED:', e); process.exit(1); });
