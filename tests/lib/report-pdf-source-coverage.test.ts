// @vitest-environment node
/**
 * Audit F9, end to end on the real PDF: the paid report's address verification page says which
 * sources failed and which were not asked, and marks the addresses concerned. The text is read
 * back from the rendered file, not from the components.
 */
import { describe, expect, it } from 'vitest';
import React from 'react';
import { inflateSync } from 'node:zlib';
import { renderToBuffer } from '@react-pdf/renderer';
import { ReportDocument } from '@/lib/reportPdf';
import type { ReportData } from '@/lib/generateReport';
import { summarizeCoverage } from '@/lib/labels/coverage';
import { scamDbEvidenceFactor, subjectScamDbReasoning } from '@/lib/report-scam-db';
import { getReportTranslations } from '@/lib/report-i18n';
import { LABELS_SCHEMA, type AddressLabel, type AddressLabelResponse, type SourceCheck, type SourceName } from '@/lib/labels/types';

const SUBJECT = '0x' + '1'.repeat(40);
const addr = (c: string) => '0x' + c.repeat(40);
const ok: SourceCheck = { status: 'no_match' };

function labelled(address: string, sources: Record<SourceName, SourceCheck>, labels: AddressLabel[] = []): AddressLabelResponse {
  return {
    address, network: 'eth', labels, cached_at: '2026-11-17T00:00:00.000Z', ttl_days: 7,
    hasPhishingFlag: labels.some((l) => l.category === 'phishing'), hasSanctionsFlag: labels.some((l) => l.category === 'sanctions'),
    hasScamFlag: labels.some((l) => l.category === 'scam'), isKycExchange: false,
    highestConfidence: labels.reduce((m, l) => Math.max(m, l.confidence), 0),
    hadExternalSourceFailure: Object.values(sources).some((c) => c.status === 'unavailable'), sources, schema: LABELS_SCHEMA,
  };
}

const LABELS: AddressLabelResponse[] = [
  // complete, nothing found
  labelled(addr('a'), { scam_db: ok, ofac: ok, goplus: ok, chainabuse: ok }),
  // GoPlus failed, Chainabuse not asked (quota)
  labelled(addr('b'), { scam_db: ok, ofac: ok, goplus: { status: 'unavailable', reason: 'timeout' }, chainabuse: { status: 'skipped', reason: 'rate_limit_reached' } }),
  // Chainabuse failed
  labelled(addr('c'), { scam_db: ok, ofac: ok, goplus: ok, chainabuse: { status: 'unavailable', reason: 'http_429' } }),
  // sanctioned: Chainabuse not needed
  labelled(addr('d'), { scam_db: ok, ofac: { status: 'match' }, goplus: ok, chainabuse: { status: 'skipped', reason: 'ofac_match' } },
    [{ source: 'ofac', tag: 'OFAC SDN (ETH)', category: 'sanctions', confidence: 1 }]),
  // a label from one source while another did not answer
  labelled(addr('e'), { scam_db: ok, ofac: ok, goplus: { status: 'match' }, chainabuse: { status: 'unavailable', reason: 'timeout' } },
    [{ source: 'goplus', tag: 'GoPlus risk: phishing', category: 'phishing', confidence: 0.8 }]),
];

function reportData(over: Partial<ReportData>): ReportData {
  return {
    walletAddress: SUBJECT, caseId: 'LH-F9RENDER', date: '2026-11-17', network: 'eth', networkLabel: 'Ethereum (ETH)', nativeCurrency: 'ETH',
    totalReceived: 50, totalSent: 49, netBalance: 1, ethReceived: 50, ethSent: 49, transactionCount: 12, uniqueTokens: ['USDT', 'ETH'], spamFiltered: 0,
    firstActivity: '2026-02-01', lastActivity: '2026-04-05', inactiveDays: 46,
    topCounterparties: [{ address: addr('a'), label: 'Unknown', count: 2, volume: 27187 }], counterpartyVolumeSymbol: 'USDT',
    identifiedEntities: [], riskScore: 55, riskLabel: 'MODERATE',
    recoveryAssessment: { score: 20, label: 'Low', tier: 'LOW', disclaimer: 'Statistical estimate. Not a guarantee.', factors: { positive: [], negative: ['Funds forwarded rapidly'] } },
    recoveryScore: 20, recoveryLabel: 'Low', ofacWarning: false, scamDbMatches: [], keyFindings: ['Test finding.'], recommendations: ['File a report.'],
    transactions: [{ date: '2026-03-07', direction: 'OUT', from: SUBJECT, to: addr('a'), value: 11020.5, token: 'USDT' }],
    graphData: null, riskBreakdown: [{ label: 'Test factor', value: 5 }], timeline: [{ date: '2026-03-07', type: 'MAJOR_OUTFLOW', description: 'Sent 11020 USDT', highlight: true }],
    exitPointAnalysis: { exitPoints: [], hasKycExit: false, hasMixerUsage: false, hasCrossChain: false, overallRecoveryAssessment: 'LOW' },
    recoveryScenarios: [], assetSummary: { realAssets: [{ symbol: 'USDT', totalIn: 22187, totalOut: 11020 }], spamTokens: [], spoofTokens: [], spamCount: 0 },
    patternAnalysis: { overallRisk: 'SUSPICIOUS', interpretation: 'Test', patterns: [] }, crossChainTrace: null,
    narrative: { walletType: 'victim', walletTypeLabel: 'Victim Wallet', roleConfidence: 0.85, roleReasoning: ['test'], uniqueSenders: 5, uniqueReceivers: 4, realReceiverCount: 2,
      spoofOnlyReceiverCount: 0, forwardingPercent: 80, primaryExitExchange: '', primaryExitExchangeEmail: '', summary: 'Victim wallet.', conclusion: 'Conclusion.' },
    evidenceStrength: { score: 40, label: 'MODERATE', factors: [{ label: 'Test factor', met: true, severity: 'high' }] },
    topInflows: [], exchangeComplianceEmails: [], legalWeight: [{ label: 'Law enforcement submission', suitable: true }],
    primaryAsset: { symbol: 'USDT', totalIn: 22187, totalOut: 11020 }, counterpartyPhishingFlags: 0, counterpartyScamDbMatches: 0,
    addressLabels: [], externalIntelligenceDegraded: false,
    exchangeAnalysis: { entryPoints: [], exitPoints: [], hasEntryKyc: false, hasExitKyc: false },
    ...over,
  } as unknown as ReportData;
}

/** Text of a PDF made with the standard fonts: inflates the content streams and reads the hex strings of TJ/Tj. */
function pdfText(pdf: Buffer): string {
  const out: string[] = [];
  const raw = pdf.toString('latin1');
  const streams = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
  for (let m = streams.exec(raw); m; m = streams.exec(raw)) {
    let content: string;
    try { content = inflateSync(Buffer.from(m[1], 'latin1')).toString('latin1'); } catch { continue; }
    const shown = /\[((?:[^\]])*)\]\s*TJ|<([0-9a-fA-F]+)>\s*Tj/g;
    for (let t = shown.exec(content); t; t = shown.exec(content)) {
      const hex = (t[1] ?? `<${t[2]}>`).match(/<([0-9a-fA-F]+)>/g) ?? [];
      out.push(hex.map((h) => Buffer.from(h.slice(1, -1), 'hex').toString('latin1')).join(''));
    }
  }
  return out.join(' ');
}
/** Line wrapping and hyphenation split phrases: compare without spaces and hyphens. */
const squash = (text: string) => text.replace(/[\s-]+/g, '');
const render = async (data: ReportData, locale: 'en' | 'es') =>
  squash(pdfText(await renderToBuffer(React.createElement(ReportDocument, { data, locale }) as never)));

describe('paid report PDF: source coverage on the address verification page', () => {
  const degraded = reportData({ addressLabels: LABELS, externalIntelligenceDegraded: true, sourceCoverage: summarizeCoverage(LABELS) });

  it('en: names the failed sources, the sources not queried, and the addresses concerned', async () => {
    const text = await render(degraded, 'en');
    expect(text).toContain(squash('Unavailable: GoPlus for 1 of 5 addresses; Chainabuse for 2 of 5 addresses.'));
    expect(text).toContain(squash('Not queried: Chainabuse for 1 of 5 addresses.'));
    expect(text).toContain(squash('the absence of a label from it is not a negative result'));
    expect(text).toContain(squash('No matches in the sources that answered.'));
    expect(text).toContain(squash('Not checked: GoPlus, Chainabuse.'));
    expect(text).toContain(squash('Not checked: Chainabuse.'));
    // exactly one address was fully checked and clean; the sanctioned one lists nothing as unchecked
    expect(text.split(squash('No matches in any verification source.')).length - 1).toBe(1);
    expect(text.split(squash('Not checked:')).length - 1).toBe(3);
  }, 60_000);

  it('es: the same notes in Spanish', async () => {
    const text = await render(degraded, 'es');
    expect(text).toContain(squash('No disponibles: GoPlus en 1 de 5 direcciones; Chainabuse en 2 de 5 direcciones.'));
    expect(text).toContain(squash('No consultadas: Chainabuse en 1 de 5 direcciones.'));
    expect(text).toContain(squash('Sin coincidencias en las fuentes que respondieron.'));
    expect(text).toContain(squash('No verificado: GoPlus, Chainabuse.'));
  }, 60_000);

  it('every source answered: no note, and clean addresses are called clean', async () => {
    const complete = [labelled(addr('a'), { scam_db: ok, ofac: ok, goplus: ok, chainabuse: ok }), labelled(addr('b'), { scam_db: ok, ofac: ok, goplus: ok, chainabuse: ok })];
    const text = await render(reportData({ addressLabels: complete, sourceCoverage: summarizeCoverage(complete) }), 'en');
    expect(text.split(squash('No matches in any verification source.')).length - 1).toBe(2);
    for (const phrase of ['Unavailable:', 'Not queried:', 'Not checked:', 'No matches in the sources that answered.']) {
      expect(text, phrase).not.toContain(squash(phrase));
    }
  }, 60_000);

  it('the verification failed as a whole: the page stays and says nothing was checked', async () => {
    const text = await render(reportData({ addressLabels: [], externalIntelligenceDegraded: true }), 'en');
    expect(text).toContain(squash('Address verification not performed'));
    expect(text).not.toContain(squash('partially unavailable'));
    expect(text).toContain(squash('Counterparty address verification could not be performed'));
    expect(text).toContain(squash('this report makes no statement about them'));
    // and without a failure a wallet with no counterparties gets no such page
    const none = await render(reportData({ addressLabels: [], externalIntelligenceDegraded: false }), 'en');
    expect(none).not.toContain(squash('could not be performed'));
  }, 120_000);

  it.each([
    ['en', 'Scam Database check incomplete: 2 of 30 counterparties could not be checked', 'the OFAC check is repeated against the current list for every report'],
    ['es', 'incompleta: 2 de 30 contrapartes sin comprobar', 'OFAC se repite con la lista vigente en cada informe'],
  ] as const)('%s: the evidence list says the scam-database check is incomplete', async (locale, line, methodology) => {
    const strings = getReportTranslations(locale).investigation.evidence;
    const factor = scamDbEvidenceFactor({ isVictimRole: true, counterpartyMatches: 0, totalMatches: 0, check: { checked: 30, failed: 2 }, strings });
    const data = reportData({
      addressLabels: LABELS, sourceCoverage: summarizeCoverage(LABELS), externalIntelligenceDegraded: true, scamDbCheck: { checked: 30, failed: 2 },
      evidenceStrength: { score: 0, label: 'WEAK', factors: [factor] },
    });
    const text = await render(data, locale);
    expect(text).toContain(squash(line));
    expect(text).not.toContain(squash(strings.counterpartyScamDbGeneric));
    expect(text).toContain(squash(methodology));
  }, 60_000);

  it.each([
    ['en', 'at least 1 report; some could not be read', 'lower bound: some reports could not be read'],
    ['es', 'al menos 1 reporte; algunos no pudieron leerse', 'algunos reportes no pudieron leerse'],
  ] as const)('%s: a scam-database match read only in part shows its counts as a lower bound', async (locale, labelMark, summaryMark) => {
    const partial = [labelled(addr('a'), { scam_db: { status: 'match', reason: 'incomplete_read', partial: true }, ofac: ok, goplus: ok, chainabuse: { status: 'skipped', reason: 'scam_db_match' } },
      [{ source: 'ledgerhound_scam_db', tag: 'Demo Platform', category: 'scam', confidence: 0.85, reportCount: 1, countIncomplete: true }])];
    const match = { address: addr('a'), platformNames: ['Demo Platform'], platformSlugs: ['demo-platform'], totalLoss: 1200, reports: 1 };
    const text = await render(reportData({ addressLabels: partial, sourceCoverage: summarizeCoverage(partial), scamDbMatches: [{ ...match, incomplete: true }] }), locale);
    expect(text).toContain(squash(labelMark));
    expect(text).toContain(squash(summaryMark));
    // the same data read in full carries neither mark
    const whole = [labelled(addr('a'), { scam_db: { status: 'match' }, ofac: ok, goplus: ok, chainabuse: { status: 'skipped', reason: 'scam_db_match' } },
      [{ source: 'ledgerhound_scam_db', tag: 'Demo Platform', category: 'scam', confidence: 0.85, reportCount: 1 }])];
    const clean = await render(reportData({ addressLabels: whole, sourceCoverage: summarizeCoverage(whole), scamDbMatches: [match] }), locale);
    expect(clean).not.toContain(squash(labelMark));
    expect(clean).not.toContain(squash(summaryMark));
  }, 120_000);

  it.each([
    ['en', 'Linked to documented losses of at least $950 (some reports could not be read)', 'approximately $950'],
    ['es', 'documentadas de al menos $950 (algunos reportes no pudieron leerse)', 'aproximadamente $950'],
  ] as const)('%s: "How we classified this wallet" words a partly read subject match as a lower bound', async (locale, lowerBound, estimate) => {
    const strings = getReportTranslations(locale).investigation.roleReasoning;
    const hit = { address: SUBJECT, platformNames: ['Demo Platform'], platformSlugs: ['demo-platform'], totalLoss: 950, reports: 1 };
    const withReasoning = (match: typeof hit & { incomplete?: boolean }) => {
      const base = reportData({});
      return reportData({
        scamDbMatches: [match],
        narrative: { ...base.narrative, walletType: 'aggregator', roleReasoning: subjectScamDbReasoning(match, strings) },
      });
    };
    const partial = await render(withReasoning({ ...hit, incomplete: true }), locale);
    expect(partial).toContain(squash(lowerBound));
    expect(partial).not.toContain(squash(estimate));
    // read in full, the same block keeps the estimate wording
    const whole = await render(withReasoning(hit), locale);
    expect(whole).toContain(squash(estimate));
    expect(whole).not.toContain(squash(lowerBound));
  }, 120_000);

  it('report data saved before the coverage summary existed still renders, with the general note', async () => {
    const legacy = LABELS.map(({ sources: _s, schema: _v, ...rest }) => rest as AddressLabelResponse);
    const text = await render(reportData({ addressLabels: legacy, externalIntelligenceDegraded: true }), 'en');
    expect(text).toContain(squash('One or more sources were unavailable during report generation.'));
    expect(text).not.toContain(squash('Unavailable:'));
    // an old entry carries only the flag: where it is set, the address is not called clean,
    // and no source is named as failed, because the old format cannot say which one it was
    expect(text).toContain(squash('No matches in the sources that answered.'));
    expect(text).toContain(squash('One or more sources did not answer for this address.'));
    expect(text).not.toContain(squash('Not checked:'));
  }, 60_000);
});
