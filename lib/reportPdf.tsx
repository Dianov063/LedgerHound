import React from 'react';
import { Document, Page, Text, View, StyleSheet, Svg, Circle, Line, Rect, G, Image, Path } from '@react-pdf/renderer';
import { fmtEth, type ReportData, type RiskBreakdown, type TimelineEvent, type ExitPoint, type RecoveryScenario, type AssetSummary, type PatternAnalysis, type ScamPattern, type CrossChainTrace, type BridgeInteraction, type ChainActivity, type CrossChainHop } from './generateReport';
import { getNodeColor, type GraphData, type GraphNode, type GraphEdge } from './generateGraphData';

const blue = '#2563eb';
const slate900 = '#0f172a';
const slate600 = '#475569';
const slate400 = '#94a3b8';
const red = '#dc2626';
const green = '#16a34a';
const amber = '#d97706';
const darkRed = '#7f1d1d';
const purple = '#7c3aed';

function getTotalPages(data: ReportData): number {
  const hasCrossChain = data.crossChainTrace?.detected === true;
  return hasCrossChain ? 12 : 11;
}

const s = StyleSheet.create({
  page: { padding: 50, fontFamily: 'Helvetica', fontSize: 10, color: slate900 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingBottom: 10, borderBottomWidth: 0.5, borderBottomColor: '#e2e8f0' },
  logo: { fontSize: 13, fontFamily: 'Helvetica-Bold', color: blue },
  headerRight: { textAlign: 'right', fontSize: 7, color: slate400 },
  footer: { position: 'absolute', bottom: 30, left: 50, right: 50, flexDirection: 'row', justifyContent: 'space-between', fontSize: 7, color: slate400, borderTopWidth: 0.5, borderTopColor: '#e2e8f0', paddingTop: 8 },
  h1: { fontSize: 22, fontFamily: 'Helvetica-Bold', color: slate900, marginBottom: 6 },
  h2: { fontSize: 15, fontFamily: 'Helvetica-Bold', color: slate900, marginBottom: 10, marginTop: 4 },
  h3: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: slate900, marginBottom: 6 },
  p: { fontSize: 10, color: slate600, lineHeight: 1.5, marginBottom: 8 },
  label: { fontSize: 8, color: slate400, marginBottom: 2 },
  value: { fontSize: 14, fontFamily: 'Helvetica-Bold', color: slate900 },
  row: { flexDirection: 'row', gap: 16 },
  col: { flex: 1 },
  card: { backgroundColor: '#f8fafc', borderRadius: 6, padding: 12, marginBottom: 8 },
  table: { marginTop: 4 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#f1f5f9', paddingVertical: 6, paddingHorizontal: 8, borderRadius: 4 },
  tableRow: { flexDirection: 'row', paddingVertical: 5, paddingHorizontal: 8, borderBottomWidth: 0.5, borderBottomColor: '#e2e8f0' },
  tableRowAlt: { flexDirection: 'row', paddingVertical: 5, paddingHorizontal: 8, borderBottomWidth: 0.5, borderBottomColor: '#e2e8f0', backgroundColor: '#fafbfc' },
  th: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: slate600 },
  td: { fontSize: 8, color: slate900 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4, fontSize: 10, fontFamily: 'Helvetica-Bold' },
  bullet: { fontSize: 10, color: slate600, lineHeight: 1.5, marginBottom: 4, paddingLeft: 12 },
  mono: { fontFamily: 'Courier', fontSize: 8 },
  divider: { borderBottomWidth: 0.5, borderBottomColor: '#e2e8f0', marginVertical: 14 },
  sectionDivider: { borderBottomWidth: 1, borderBottomColor: '#cbd5e1', marginVertical: 16 },
});

const Header = ({ data }: { data: ReportData }) => (
  <View style={s.header}>
    <Text style={s.logo}>LedgerHound</Text>
    <View style={s.headerRight}>
      <Text>Case ID: {data.caseId}</Text>
      <Text>{data.date}</Text>
    </View>
  </View>
);

const Footer = ({ data, pageNum }: { data: ReportData; pageNum: number }) => (
  <View style={s.footer} fixed>
    <Text>LedgerHound · USPROJECT LLC · Confidential</Text>
    <Text>Page {pageNum} of {getTotalPages(data)} · {data.caseId}</Text>
  </View>
);

const shortAddr = (addr: string) =>
  addr && addr.length >= 14 ? `${addr.slice(0, 8)}...${addr.slice(-6)}` : addr || '—';

const truncToken = (t: string) => (t.length > 8 ? t.slice(0, 7) + '…' : t);

const riskColor = (score: number) => {
  if (score >= 85) return darkRed;
  if (score >= 70) return red;
  if (score >= 40) return amber;
  return green;
};

const recoveryColor = (score: number) => {
  if (score >= 60) return green;
  if (score >= 35) return amber;
  return red;
};

/* ═══════════════════════════════════════════════════════════════
   PAGE 1: COVER
   ═══════════════════════════════════════════════════════════════ */
const CoverPage = ({ data }: { data: ReportData }) => (
  <Page size="A4" style={{ ...s.page, justifyContent: 'center', alignItems: 'center' }}>
    <View style={{ alignItems: 'center' }}>
      <Text style={{ fontSize: 28, fontFamily: 'Helvetica-Bold', color: blue, marginBottom: 40 }}>LedgerHound</Text>
      <Text style={{ fontSize: 20, fontFamily: 'Helvetica-Bold', color: slate900, marginBottom: 6 }}>FORENSIC WALLET</Text>
      <Text style={{ fontSize: 20, fontFamily: 'Helvetica-Bold', color: slate900, marginBottom: 30 }}>ANALYSIS REPORT</Text>
      <View style={{ backgroundColor: '#eff6ff', borderRadius: 8, paddingVertical: 6, paddingHorizontal: 16, marginBottom: 16 }}>
        <Text style={{ fontSize: 11, fontFamily: 'Helvetica-Bold', color: blue }}>{data.networkLabel || 'Ethereum (ETH)'}</Text>
      </View>
      <View style={{ backgroundColor: '#f1f5f9', borderRadius: 8, padding: 20, width: 400, alignItems: 'center', marginBottom: 30 }}>
        <Text style={{ fontSize: 8, color: slate400, marginBottom: 4 }}>WALLET ADDRESS</Text>
        <Text style={{ fontFamily: 'Courier', fontSize: data.walletAddress.length > 44 ? 8 : 10, color: slate900 }}>{data.walletAddress}</Text>
      </View>
      <View style={s.row}>
        <View style={{ alignItems: 'center', marginRight: 40 }}>
          <Text style={s.label}>DATE</Text>
          <Text style={{ fontSize: 12, fontFamily: 'Helvetica-Bold' }}>{data.date}</Text>
        </View>
        <View style={{ alignItems: 'center' }}>
          <Text style={s.label}>CASE ID</Text>
          <Text style={{ fontSize: 12, fontFamily: 'Helvetica-Bold' }}>{data.caseId}</Text>
        </View>
      </View>
      <Text style={{ fontSize: 8, color: slate400, marginTop: 30 }}>PREMIUM FORENSIC REPORT</Text>
      <Text style={{ fontSize: 10, color: red, fontFamily: 'Helvetica-Bold', marginTop: 10 }}>CONFIDENTIAL — For Legal Use</Text>
      <Text style={{ fontSize: 8, color: slate400, marginTop: 20 }}>Generated by LedgerHound · USPROJECT LLC</Text>
    </View>
    <Footer data={data} pageNum={1} />
  </Page>
);

/* ═══════════════════════════════════════════════════════════════
   PAGE 2: EXECUTIVE SUMMARY + RISK BREAKDOWN
   ═══════════════════════════════════════════════════════════════ */
const RiskBreakdownRow = ({ label, score }: { label: string; score: number }) => {
  if (score === 0) return null;
  const color = score > 0 ? red : green;
  const prefix = score > 0 ? '+' : '';
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3, paddingHorizontal: 8, borderBottomWidth: 0.5, borderBottomColor: '#e2e8f0' }}>
      <Text style={{ fontSize: 8, color: slate600 }}>{label}</Text>
      <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', color }}>{prefix}{score}</Text>
    </View>
  );
};

const SummaryPage = ({ data }: { data: ReportData }) => {
  const bd = data.riskBreakdown;
  return (
    <Page size="A4" style={s.page}>
      <Header data={data} />
      <Text style={s.h2}>Executive Summary</Text>

      {/* OFAC Warning Banner */}
      {data.ofacWarning && (
        <View style={{ backgroundColor: darkRed, borderRadius: 6, padding: 12, marginBottom: 16 }}>
          <Text style={{ fontSize: 11, fontFamily: 'Helvetica-Bold', color: 'white', marginBottom: 4 }}>OFAC SANCTIONS ALERT</Text>
          <Text style={{ fontSize: 9, color: '#fecaca', lineHeight: 1.4 }}>
            This wallet has interacted with OFAC-sanctioned addresses. US persons are prohibited from transacting with sanctioned entities under penalty of law.
          </Text>
        </View>
      )}

      {/* Risk + Recovery scores side by side */}
      <View style={{ ...s.row, marginBottom: 14, gap: 12 }}>
        <View style={{ flex: 1, alignItems: 'center', padding: 14, backgroundColor: '#f8fafc', borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0' }}>
          <Text style={{ fontSize: 8, color: slate400, marginBottom: 6, letterSpacing: 1 }}>RISK ASSESSMENT</Text>
          <View style={{ width: 56, height: 56, borderRadius: 28, borderWidth: 3, borderColor: riskColor(data.riskScore), alignItems: 'center', justifyContent: 'center', marginBottom: 6 }}>
            <Text style={{ fontSize: 22, fontFamily: 'Helvetica-Bold', color: riskColor(data.riskScore) }}>{data.riskScore}</Text>
          </View>
          <Text style={{ ...s.badge, backgroundColor: riskColor(data.riskScore), color: 'white', fontSize: 8, paddingHorizontal: 10, paddingVertical: 3 }}>{data.riskLabel}</Text>
        </View>
        <View style={{ flex: 1, alignItems: 'center', padding: 14, backgroundColor: '#f8fafc', borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0' }}>
          <Text style={{ fontSize: 8, color: slate400, marginBottom: 6, letterSpacing: 1 }}>RECOVERY PROBABILITY</Text>
          <View style={{ width: 56, height: 56, borderRadius: 28, borderWidth: 3, borderColor: recoveryColor(data.recoveryScore), alignItems: 'center', justifyContent: 'center', marginBottom: 6 }}>
            <Text style={{ fontSize: 22, fontFamily: 'Helvetica-Bold', color: recoveryColor(data.recoveryScore) }}>{data.recoveryScore}</Text>
          </View>
          <Text style={{ fontSize: 8, color: slate600, textAlign: 'center', maxWidth: 180 }}>{data.recoveryLabel}</Text>
        </View>
      </View>

      {/* RISK BREAKDOWN TABLE */}
      {bd && (
        <View style={{ ...s.card, padding: 10, marginBottom: 12 }}>
          <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: slate900, marginBottom: 6 }}>RISK SCORE BREAKDOWN</Text>
          <View style={{ backgroundColor: '#f1f5f9', borderRadius: 4, paddingVertical: 4, paddingHorizontal: 8, marginBottom: 2 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 7, fontFamily: 'Helvetica-Bold', color: slate600 }}>Factor</Text>
              <Text style={{ fontSize: 7, fontFamily: 'Helvetica-Bold', color: slate600 }}>Score</Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3, paddingHorizontal: 8, borderBottomWidth: 0.5, borderBottomColor: '#e2e8f0' }}>
            <Text style={{ fontSize: 8, color: slate600 }}>Baseline</Text>
            <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', color: slate400 }}>50</Text>
          </View>
          <RiskBreakdownRow label="Unknown wallet interactions (>80% unidentified)" score={bd.unknownWalletInteraction} />
          <RiskBreakdownRow label="Mixer/tumbler interaction detected" score={bd.mixerInteraction} />
          <RiskBreakdownRow label="KYC exchange interaction (recovery aid)" score={bd.exchangeInteraction} />
          <RiskBreakdownRow label="Multi-hop transfer pattern (3+ same day)" score={bd.multiHopTransfers} />
          <RiskBreakdownRow label="Stablecoin movement detected" score={bd.stablecoinUsage} />
          <RiskBreakdownRow label="OFAC sanctioned address interaction" score={bd.sanctionedAddress} />
          <RiskBreakdownRow label="LedgerHound Scam Database match" score={bd.scamDbMatch} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5, paddingHorizontal: 8, backgroundColor: '#f1f5f9', borderRadius: 4, marginTop: 4 }}>
            <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: slate900 }}>TOTAL RISK SCORE</Text>
            <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: riskColor(data.riskScore) }}>{data.riskScore} {data.riskLabel}</Text>
          </View>
        </View>
      )}

      {/* Scam Database Matches */}
      {data.scamDbMatches && data.scamDbMatches.length > 0 && (
        <View style={{ backgroundColor: '#fef2f2', borderRadius: 6, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: '#fecaca' }}>
          <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', color: red, marginBottom: 6 }}>Linked to LedgerHound Scam Database</Text>
          {data.scamDbMatches.map((m, i) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
              {m.qrDataUri && (
                <Image src={m.qrDataUri} style={{ width: 36, height: 36, marginRight: 8 }} />
              )}
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 9, color: slate900, fontFamily: 'Helvetica-Bold' }}>{m.platformNames.join(', ')}</Text>
                <Text style={{ fontSize: 8, color: slate600 }}>{shortAddr(m.address)} — {m.reports} reports, ${m.totalLoss.toLocaleString()} losses</Text>
                {m.platformSlugs[0] && (
                  <Text style={{ fontSize: 7, color: blue }}>www.ledgerhound.vip/scam-database/platform/{m.platformSlugs[0]}</Text>
                )}
              </View>
            </View>
          ))}
        </View>
      )}

      <View style={s.sectionDivider} />

      <Text style={s.h3}>Key Findings</Text>
      {data.keyFindings.map((f, i) => (
        <Text key={i} style={s.bullet}>{'\u2022'} {f}</Text>
      ))}

      <Footer data={data} pageNum={2} />
    </Page>
  );
};

/* ═══════════════════════════════════════════════════════════════
   PAGE 3: ASSET SUMMARY + ACTIVITY TIMELINE
   ═══════════════════════════════════════════════════════════════ */
const AssetTimelinePage = ({ data }: { data: ReportData }) => {
  const assets = data.assetSummary;
  const timeline = data.timeline;

  return (
    <Page size="A4" style={s.page}>
      <Header data={data} />

      {/* ASSET SUMMARY */}
      <Text style={s.h2}>Asset Summary</Text>
      {assets && assets.realAssets.length > 0 && (
        <View style={{ ...s.card, marginBottom: 12 }}>
          <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: green, marginBottom: 6 }}>Real Assets</Text>
          <View style={s.tableHeader}>
            <Text style={{ ...s.th, width: '25%' }}>Token</Text>
            <Text style={{ ...s.th, width: '25%' }}>Total In</Text>
            <Text style={{ ...s.th, width: '25%' }}>Total Out</Text>
            <Text style={{ ...s.th, width: '25%' }}>Net</Text>
          </View>
          {assets.realAssets.slice(0, 10).map((a, i) => (
            <View key={i} style={i % 2 === 0 ? s.tableRow : s.tableRowAlt}>
              <Text style={{ ...s.td, width: '25%', fontFamily: 'Helvetica-Bold' }}>{a.symbol}</Text>
              <Text style={{ ...s.td, width: '25%', color: green }}>{fmtEth(a.totalIn)}</Text>
              <Text style={{ ...s.td, width: '25%', color: red }}>{fmtEth(a.totalOut)}</Text>
              <Text style={{ ...s.td, width: '25%' }}>{fmtEth(a.totalIn - a.totalOut)}</Text>
            </View>
          ))}
        </View>
      )}

      {assets && assets.spamCount > 0 && (
        <View style={{ backgroundColor: '#fffbeb', borderRadius: 6, padding: 10, marginBottom: 12, borderWidth: 1, borderColor: '#fde68a' }}>
          <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: amber, marginBottom: 4 }}>
            Spam/Airdrop Tokens Filtered: {assets.spamCount}
          </Text>
          <Text style={{ fontSize: 7, color: slate600 }}>
            {assets.spamTokens.slice(0, 8).map(t => t.symbol).join(', ')}{assets.spamCount > 8 ? '...' : ''}
          </Text>
          <Text style={{ fontSize: 7, color: slate400, marginTop: 3 }}>
            Spam tokens are common on active wallets and typically have no real value.
          </Text>
        </View>
      )}

      <View style={s.sectionDivider} />

      {/* ACTIVITY TIMELINE */}
      <Text style={s.h2}>Activity Timeline</Text>
      {timeline && timeline.length > 0 ? (
        <View style={{ paddingLeft: 8 }}>
          {timeline.map((event, i) => {
            const isHighlight = event.highlight;
            const typeColor = event.type === 'MAJOR_OUTFLOW' ? red
              : event.type === 'EXCHANGE_INTERACTION' ? green
              : event.type === 'MIXER_INTERACTION' ? red
              : event.type === 'MAJOR_INFLOW' ? green
              : blue;

            return (
              <View key={i} style={{ flexDirection: 'row', marginBottom: 8 }}>
                {/* Timeline dot and line */}
                <View style={{ width: 20, alignItems: 'center' }}>
                  <View style={{
                    width: isHighlight ? 10 : 8,
                    height: isHighlight ? 10 : 8,
                    borderRadius: isHighlight ? 5 : 4,
                    backgroundColor: typeColor,
                    marginTop: 2,
                  }} />
                  {i < timeline.length - 1 && (
                    <View style={{ width: 1, flex: 1, backgroundColor: '#e2e8f0', marginTop: 2 }} />
                  )}
                </View>
                {/* Event content */}
                <View style={{ flex: 1, paddingLeft: 8 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', color: slate900 }}>{event.date}</Text>
                    {isHighlight && (
                      <Text style={{ fontSize: 6, color: red, fontFamily: 'Helvetica-Bold', backgroundColor: '#fef2f2', paddingHorizontal: 4, paddingVertical: 1, borderRadius: 2 }}>KEY EVENT</Text>
                    )}
                  </View>
                  <Text style={{ fontSize: 8, color: slate600, marginTop: 1 }}>{event.description}</Text>
                </View>
              </View>
            );
          })}

          {/* Active period */}
          {data.firstActivity !== 'N/A' && data.lastActivity !== 'N/A' && (
            <View style={{ backgroundColor: '#f1f5f9', borderRadius: 4, padding: 8, marginTop: 8 }}>
              <Text style={{ fontSize: 8, color: slate600 }}>
                Total Active Period: {data.firstActivity} to {data.lastActivity}
                {data.inactiveDays > 0 ? ` (inactive for ${data.inactiveDays} days)` : ''}
              </Text>
            </View>
          )}
        </View>
      ) : (
        <View style={s.card}>
          <Text style={s.p}>No timestamped transactions available for timeline construction.</Text>
        </View>
      )}

      <Footer data={data} pageNum={3} />
    </Page>
  );
};

/* ═══════════════════════════════════════════════════════════════
   PAGE 4: BEHAVIORAL PATTERN ANALYSIS
   ═══════════════════════════════════════════════════════════════ */
const severityColor = (sev: string) => {
  switch (sev) {
    case 'CRITICAL': return darkRed;
    case 'HIGH': return red;
    case 'MEDIUM': return amber;
    default: return slate600;
  }
};

const overallRiskColor = (risk: string) => {
  switch (risk) {
    case 'CONFIRMED_SCAM': return darkRed;
    case 'LIKELY_SCAM': return red;
    case 'SUSPICIOUS': return amber;
    default: return green;
  }
};

const overallRiskLabel = (risk: string) => {
  switch (risk) {
    case 'CONFIRMED_SCAM': return 'CONFIRMED SCAM';
    case 'LIKELY_SCAM': return 'LIKELY SCAM';
    case 'SUSPICIOUS': return 'SUSPICIOUS';
    default: return 'CLEAN';
  }
};

const PatternPage = ({ data }: { data: ReportData }) => {
  const pa = data.patternAnalysis;

  return (
    <Page size="A4" style={s.page}>
      <Header data={data} />
      <Text style={s.h2}>Behavioral Pattern Analysis</Text>
      <Text style={{ ...s.p, marginBottom: 12 }}>
        Automated detection of scam-associated behavioral patterns based on transaction timing, flow structure, and counterparty analysis.
      </Text>

      {/* Overall Assessment */}
      {pa && (
        <View style={{
          backgroundColor: pa.overallRisk === 'CLEAN' ? '#f0fdf4' : pa.overallRisk === 'SUSPICIOUS' ? '#fffbeb' : '#fef2f2',
          borderRadius: 8,
          padding: 14,
          marginBottom: 16,
          borderWidth: 1,
          borderColor: pa.overallRisk === 'CLEAN' ? '#bbf7d0' : pa.overallRisk === 'SUSPICIOUS' ? '#fde68a' : '#fecaca',
          alignItems: 'center',
        }}>
          <Text style={{ fontSize: 8, color: slate400, letterSpacing: 1, marginBottom: 6 }}>OVERALL BEHAVIORAL ASSESSMENT</Text>
          <Text style={{
            ...s.badge,
            fontSize: 12,
            backgroundColor: overallRiskColor(pa.overallRisk),
            color: 'white',
            paddingHorizontal: 16,
            paddingVertical: 5,
          }}>
            {overallRiskLabel(pa.overallRisk)}
          </Text>
          <Text style={{ fontSize: 8, color: slate600, marginTop: 8, textAlign: 'center', maxWidth: 400, lineHeight: 1.4 }}>
            {pa.interpretation}
          </Text>
        </View>
      )}

      {/* Detected Patterns */}
      {pa && pa.patterns.length > 0 ? (
        <View>
          <Text style={{ ...s.h3, marginBottom: 8 }}>Detected Patterns ({pa.patterns.length})</Text>
          {pa.patterns.map((pattern, i) => (
            <View key={i} style={{
              ...s.card,
              marginBottom: 8,
              borderLeftWidth: 3,
              borderLeftColor: severityColor(pattern.severity),
            }}>
              {/* Pattern header */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', color: slate900 }}>
                  {pattern.name}
                </Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <View style={{
                    backgroundColor: severityColor(pattern.severity),
                    paddingHorizontal: 6,
                    paddingVertical: 2,
                    borderRadius: 3,
                  }}>
                    <Text style={{ fontSize: 7, color: 'white', fontFamily: 'Helvetica-Bold' }}>{pattern.severity}</Text>
                  </View>
                  <Text style={{ fontSize: 8, color: slate600 }}>Confidence: {pattern.confidence}%</Text>
                </View>
              </View>

              {/* Confidence bar */}
              <View style={{ height: 4, backgroundColor: '#e2e8f0', borderRadius: 2, marginBottom: 8 }}>
                <View style={{
                  height: 4,
                  width: `${pattern.confidence}%`,
                  backgroundColor: severityColor(pattern.severity),
                  borderRadius: 2,
                }} />
              </View>

              {/* Evidence */}
              {pattern.evidence.map((ev, j) => (
                <Text key={j} style={{ fontSize: 8, color: slate600, paddingLeft: 8, marginBottom: 2, lineHeight: 1.4 }}>
                  {'\u2022'} {ev}
                </Text>
              ))}
            </View>
          ))}
        </View>
      ) : (
        <View style={{ ...s.card, alignItems: 'center', paddingVertical: 20 }}>
          <Text style={{ fontSize: 11, fontFamily: 'Helvetica-Bold', color: green, marginBottom: 6 }}>No Suspicious Patterns Detected</Text>
          <Text style={{ fontSize: 9, color: slate600, textAlign: 'center', maxWidth: 350, lineHeight: 1.4 }}>
            Automated behavioral analysis did not detect scam-associated patterns. This does not guarantee legitimacy — manual review may still be warranted for comprehensive assessment.
          </Text>
        </View>
      )}

      {/* Methodology note */}
      <View style={{ marginTop: 'auto', paddingTop: 12 }}>
        <Text style={{ fontSize: 7, color: slate400, lineHeight: 1.4 }}>
          Methodology: Patterns are detected by analyzing transaction timing, flow direction, counterparty diversity, asset types, and known entity interactions. Confidence scores reflect the strength of evidence. This is automated analysis — professional forensic review may identify additional patterns.
        </Text>
      </View>

      <Footer data={data} pageNum={4} />
    </Page>
  );
};

/* ═══════════════════════════════════════════════════════════════
   PAGE 5: WALLET ANALYTICS (was 4)
   ═══════════════════════════════════════════════════════════════ */
const AnalyticsPage = ({ data }: { data: ReportData }) => (
  <Page size="A4" style={s.page}>
    <Header data={data} />
    <Text style={s.h2}>Wallet Analytics</Text>

    <View style={{ ...s.row, marginBottom: 12 }}>
      <View style={{ ...s.card, ...s.col }}>
        <Text style={s.label}>{(data.nativeCurrency || 'ETH')} RECEIVED</Text>
        <Text style={{ ...s.value, color: green }}>{fmtEth(data.ethReceived)} {data.nativeCurrency || 'ETH'}</Text>
      </View>
      <View style={{ ...s.card, ...s.col }}>
        <Text style={s.label}>{(data.nativeCurrency || 'ETH')} SENT</Text>
        <Text style={{ ...s.value, color: red }}>{fmtEth(data.ethSent)} {data.nativeCurrency || 'ETH'}</Text>
      </View>
      <View style={{ ...s.card, ...s.col }}>
        <Text style={s.label}>{(data.nativeCurrency || 'ETH')} NET FLOW</Text>
        <Text style={s.value}>{fmtEth(data.ethReceived - data.ethSent)} {data.nativeCurrency || 'ETH'}</Text>
      </View>
    </View>

    <View style={s.divider} />

    <View style={{ ...s.row, marginBottom: 12 }}>
      <View style={{ ...s.card, ...s.col }}>
        <Text style={s.label}>TRANSACTIONS</Text>
        <Text style={s.value}>{data.transactionCount.toLocaleString('en-US')}</Text>
      </View>
      <View style={{ ...s.card, ...s.col }}>
        <Text style={s.label}>ACTIVE PERIOD</Text>
        <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold' }}>{data.firstActivity} — {data.lastActivity}</Text>
      </View>
      <View style={{ ...s.card, ...s.col }}>
        <Text style={s.label}>UNIQUE TOKENS</Text>
        <Text style={s.value}>{data.uniqueTokens.length}</Text>
      </View>
    </View>

    {data.inactiveDays > 365 && (
      <View style={{ backgroundColor: '#fffbeb', borderRadius: 6, padding: 10, marginBottom: 8, borderWidth: 1, borderColor: '#fde68a' }}>
        <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: amber, marginBottom: 4 }}>Wallet Inactive — {data.inactiveDays} Days</Text>
        <Text style={{ fontSize: 8, color: slate600 }}>Last activity: {data.lastActivity}. Possible: key loss, cooling-off, or fund redistribution.</Text>
      </View>
    )}

    <View style={s.sectionDivider} />

    <Text style={s.h3}>Top 5 Counterparty Addresses</Text>
    <View style={s.table}>
      <View style={s.tableHeader}>
        <Text style={{ ...s.th, width: '40%' }}>Address</Text>
        <Text style={{ ...s.th, width: '20%' }}>Entity</Text>
        <Text style={{ ...s.th, width: '20%' }}>Interactions</Text>
        <Text style={{ ...s.th, width: '20%' }}>Volume ({data.nativeCurrency || 'ETH'})</Text>
      </View>
      {data.topCounterparties.map((cp, i) => (
        <View key={i} style={i % 2 === 0 ? s.tableRow : s.tableRowAlt}>
          <Text style={{ ...s.td, ...s.mono, width: '40%' }}>{shortAddr(cp.address)}</Text>
          <Text style={{ ...s.td, width: '20%' }}>{cp.label}</Text>
          <Text style={{ ...s.td, width: '20%' }}>{cp.count}</Text>
          <Text style={{ ...s.td, width: '20%' }}>{fmtEth(cp.volume)}</Text>
        </View>
      ))}
    </View>

    <Footer data={data} pageNum={5} />
  </Page>
);

/* ═══════════════════════════════════════════════════════════════
   PAGE 6: ENTITY IDENTIFICATION + EXIT POINT ANALYSIS
   ═══════════════════════════════════════════════════════════════ */
const recoveryDiffColor = (d: string) => {
  if (d.startsWith('LOW')) return green;
  if (d.startsWith('MEDIUM')) return amber;
  if (d.startsWith('HIGH')) return red;
  return slate600;
};

const EntitiesExitPage = ({ data }: { data: ReportData }) => {
  const exits = data.exitPointAnalysis;

  return (
    <Page size="A4" style={s.page}>
      <Header data={data} />
      <Text style={s.h2}>Entity Identification</Text>

      {data.identifiedEntities.length === 0 ? (
        <View style={s.card}>
          <Text style={s.p}>No known entities identified in automated analysis. Manual investigation with commercial tools may reveal additional attributions.</Text>
        </View>
      ) : (
        <View style={s.table}>
          <View style={s.tableHeader}>
            <Text style={{ ...s.th, width: '35%' }}>Address</Text>
            <Text style={{ ...s.th, width: '25%' }}>Entity</Text>
            <Text style={{ ...s.th, width: '20%' }}>Type</Text>
            <Text style={{ ...s.th, width: '20%' }}>Interactions</Text>
          </View>
          {data.identifiedEntities.map((e, i) => (
            <View key={i} style={{ ...s.tableRow, backgroundColor: e.type === 'mixer' ? '#fef2f2' : e.type === 'exchange' ? '#f0fdf4' : i % 2 === 0 ? undefined : '#fafbfc' }}>
              <Text style={{ ...s.td, ...s.mono, width: '35%' }}>{shortAddr(e.address)}</Text>
              <Text style={{ ...s.td, width: '25%', fontFamily: 'Helvetica-Bold' }}>{e.label}</Text>
              <Text style={{ ...s.td, width: '20%', color: e.type === 'mixer' ? red : e.type === 'exchange' ? green : slate600 }}>{e.type.toUpperCase()}</Text>
              <Text style={{ ...s.td, width: '20%' }}>{e.interactions}</Text>
            </View>
          ))}
        </View>
      )}

      {data.identifiedEntities.some(e => e.type === 'mixer') && (
        <View style={{ backgroundColor: '#fef2f2', borderRadius: 6, padding: 10, marginTop: 10 }}>
          <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: red, marginBottom: 3 }}>WARNING: Mixer Activity Detected</Text>
          <Text style={{ fontSize: 8, color: slate600, lineHeight: 1.4 }}>Mixing services obscure fund origins and are associated with money laundering.</Text>
        </View>
      )}

      {data.identifiedEntities.some(e => e.type === 'exchange') && (
        <View style={{ backgroundColor: '#f0fdf4', borderRadius: 6, padding: 10, marginTop: 8 }}>
          <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: green, marginBottom: 3 }}>Exchange Identified — Subpoena Target Available</Text>
          <Text style={{ fontSize: 8, color: slate600, lineHeight: 1.4 }}>KYC exchanges maintain identity records obtainable via legal subpoena.</Text>
        </View>
      )}

      <View style={s.sectionDivider} />

      {/* EXIT POINT ANALYSIS */}
      <Text style={s.h2}>Exit Point Analysis</Text>
      {exits && exits.exitPoints.length > 0 ? (
        <View>
          <View style={s.table}>
            <View style={s.tableHeader}>
              <Text style={{ ...s.th, width: '28%' }}>Destination</Text>
              <Text style={{ ...s.th, width: '18%' }}>Amount</Text>
              <Text style={{ ...s.th, width: '10%' }}>Token</Text>
              <Text style={{ ...s.th, width: '14%' }}>Type</Text>
              <Text style={{ ...s.th, width: '30%' }}>Recovery Difficulty</Text>
            </View>
            {exits.exitPoints.slice(0, 6).map((ep, i) => (
              <View key={i} style={i % 2 === 0 ? s.tableRow : s.tableRowAlt}>
                <Text style={{ ...s.td, ...s.mono, width: '28%' }}>{ep.entityName || shortAddr(ep.address)}</Text>
                <Text style={{ ...s.td, width: '18%' }}>{fmtEth(ep.amount)}</Text>
                <Text style={{ ...s.td, width: '10%' }}>{ep.token}</Text>
                <Text style={{ ...s.td, width: '14%', color: ep.entityType === 'exchange' ? green : ep.entityType === 'mixer' ? red : slate600 }}>{ep.entityType.toUpperCase()}</Text>
                <Text style={{ ...s.td, width: '30%', fontSize: 7, color: recoveryDiffColor(ep.recoveryDifficulty) }}>{ep.recoveryDifficulty}</Text>
              </View>
            ))}
          </View>

          {/* Assessment box */}
          <View style={{ ...s.card, marginTop: 10, borderLeftWidth: 3, borderLeftColor: exits.hasKycExit ? green : exits.hasMixerUsage ? red : amber }}>
            <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: slate900, marginBottom: 3 }}>
              {exits.hasKycExit ? 'KYC Exchange Exit Detected' : exits.hasMixerUsage ? 'Mixer Exit Detected' : 'No KYC Exchange Exit Detected'}
            </Text>
            <Text style={{ fontSize: 8, color: slate600, lineHeight: 1.4 }}>
              {exits.hasKycExit
                ? 'Funds reached a KYC-compliant exchange. Attorney can file discovery request for account holder identification.'
                : exits.hasMixerUsage
                  ? 'Funds passed through mixing services. Professional demixing analysis recommended.'
                  : 'Without exchange interaction, recovery requires deeper investigation. The largest outflow destination should be traced further.'}
            </Text>
          </View>
        </View>
      ) : (
        <View style={s.card}>
          <Text style={s.p}>No significant outflows detected for exit point analysis.</Text>
        </View>
      )}

      <Footer data={data} pageNum={6} />
    </Page>
  );
};

/* ═══════════════════════════════════════════════════════════════
   PAGE 7: CROSS-CHAIN TRACE (conditional — only if detected)
   ═══════════════════════════════════════════════════════════════ */
const intentColor = (label: string) => {
  switch (label) {
    case 'LAUNDERING': return darkRed;
    case 'OBFUSCATION': return amber;
    default: return green;
  }
};

const CrossChainPage = ({ data, pageNum }: { data: ReportData; pageNum: number }) => {
  const cc = data.crossChainTrace;
  if (!cc || !cc.detected) return null;

  return (
    <Page size="A4" style={s.page}>
      <Header data={data} />
      <Text style={s.h2}>Cross-Chain Trace Summary</Text>
      <Text style={{ ...s.p, marginBottom: 12 }}>
        Analysis of cross-chain bridge interactions and multi-chain activity for this wallet address.
      </Text>

      {/* Escape path summary */}
      <View style={{ ...s.card, borderLeftWidth: 3, borderLeftColor: intentColor(cc.intent.label), marginBottom: 12 }}>
        <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: slate900, marginBottom: 4 }}>Escape Path</Text>
        <Text style={{ fontSize: 8, color: slate600, lineHeight: 1.5 }}>{cc.escapePathSummary}</Text>
      </View>

      {/* Active chains */}
      {cc.activeChains.length > 0 && (
        <View style={{ marginBottom: 12 }}>
          <Text style={{ ...s.h3, marginBottom: 6 }}>Multi-Chain Activity ({cc.activeChains.length + 1} chains)</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {/* Origin chain */}
            <View style={{ backgroundColor: blue, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 4 }}>
              <Text style={{ fontSize: 8, color: 'white', fontFamily: 'Helvetica-Bold' }}>{data.networkLabel} (origin)</Text>
            </View>
            {cc.activeChains.map((chain, i) => (
              <View key={i} style={{ backgroundColor: '#f1f5f9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 4, borderWidth: 1, borderColor: '#e2e8f0' }}>
                <Text style={{ fontSize: 8, color: slate900 }}>{chain.chainLabel} ({chain.txCount} tx)</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Bridge interactions table */}
      {cc.bridgeInteractions.length > 0 && (
        <View style={{ marginBottom: 12 }}>
          <Text style={{ ...s.h3, marginBottom: 6 }}>Bridge Interactions ({cc.bridgeInteractions.length})</Text>
          <View style={s.table}>
            <View style={s.tableHeader}>
              <Text style={{ ...s.th, width: '14%' }}>Date</Text>
              <Text style={{ ...s.th, width: '8%' }}>Dir</Text>
              <Text style={{ ...s.th, width: '22%' }}>Bridge</Text>
              <Text style={{ ...s.th, width: '16%' }}>Amount</Text>
              <Text style={{ ...s.th, width: '10%' }}>Token</Text>
              <Text style={{ ...s.th, width: '30%' }}>Possible Dest.</Text>
            </View>
            {cc.bridgeInteractions.slice(0, 10).map((bi, i) => (
              <View key={i} style={i % 2 === 0 ? s.tableRow : s.tableRowAlt}>
                <Text style={{ ...s.td, width: '14%', fontSize: 7 }}>{bi.date}</Text>
                <Text style={{ ...s.td, width: '8%', color: bi.direction === 'OUT' ? red : green, fontFamily: 'Helvetica-Bold', fontSize: 7 }}>{bi.direction}</Text>
                <Text style={{ ...s.td, width: '22%', fontSize: 7 }}>{bi.bridgeName}</Text>
                <Text style={{ ...s.td, width: '16%', fontSize: 7 }}>{fmtEth(bi.amount)}</Text>
                <Text style={{ ...s.td, width: '10%', fontSize: 7 }}>{bi.token}</Text>
                <Text style={{ ...s.td, width: '30%', fontSize: 6 }}>{bi.possibleDestChains.slice(0, 4).join(', ')}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Cross-chain hops visualization */}
      {cc.hops.length > 0 && (
        <View style={{ marginBottom: 12 }}>
          <Text style={{ ...s.h3, marginBottom: 6 }}>Traced Path ({cc.hops.length} hop{cc.hops.length > 1 ? 's' : ''})</Text>
          {cc.hops.map((hop, i) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
              <View style={{ backgroundColor: blue, width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 7, color: 'white', fontFamily: 'Helvetica-Bold' }}>{hop.step}</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 8, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <View style={{ backgroundColor: '#eff6ff', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 3 }}>
                  <Text style={{ fontSize: 7, fontFamily: 'Helvetica-Bold', color: blue }}>{(hop.fromChain || '').toUpperCase()}</Text>
                </View>
                <Text style={{ fontSize: 8, color: red }}>{'\u2192'}</Text>
                <View style={{ backgroundColor: '#eff6ff', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 3 }}>
                  <Text style={{ fontSize: 7, fontFamily: 'Helvetica-Bold', color: blue }}>{(hop.toChain || '').toUpperCase()}</Text>
                </View>
                <Text style={{ fontSize: 7, color: slate600 }}>via {hop.bridge}</Text>
                <Text style={{ fontSize: 7, color: slate900, fontFamily: 'Helvetica-Bold' }}>{fmtEth(hop.amount)} {hop.token}</Text>
                <Text style={{ fontSize: 6, color: slate400 }}>({hop.confidence}%)</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Final destination */}
      {cc.finalDestination && cc.finalDestination.entityName && (
        <View style={{
          backgroundColor: cc.finalDestination.entityType === 'exchange' ? '#f0fdf4' : cc.finalDestination.entityType === 'mixer' ? '#fef2f2' : '#f8fafc',
          borderRadius: 6, padding: 12, marginBottom: 12,
          borderWidth: 1, borderColor: cc.finalDestination.entityType === 'exchange' ? '#bbf7d0' : cc.finalDestination.entityType === 'mixer' ? '#fecaca' : '#e2e8f0',
        }}>
          <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', color: cc.finalDestination.entityType === 'exchange' ? green : red, marginBottom: 4 }}>
            Final Destination: {cc.finalDestination.entityName}
          </Text>
          <Text style={{ fontSize: 8, color: slate600 }}>
            Chain: {cc.finalDestination.chain.toUpperCase()} | Type: {cc.finalDestination.entityType.toUpperCase()}
          </Text>
          {cc.finalDestination.entityType === 'exchange' && (
            <Text style={{ fontSize: 8, color: blue, marginTop: 4 }}>
              Subpoena target: {cc.finalDestination.entityName} compliance can identify account holder.
            </Text>
          )}
        </View>
      )}

      {/* Intent analysis */}
      <View style={{
        ...s.card,
        borderLeftWidth: 3,
        borderLeftColor: intentColor(cc.intent.label),
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', color: slate900 }}>Intent Analysis</Text>
          <View style={{ backgroundColor: intentColor(cc.intent.label), paddingHorizontal: 8, paddingVertical: 2, borderRadius: 3 }}>
            <Text style={{ fontSize: 7, color: 'white', fontFamily: 'Helvetica-Bold' }}>{cc.intent.label}</Text>
          </View>
          <Text style={{ fontSize: 8, color: slate600 }}>Confidence: {cc.intent.confidence}%</Text>
        </View>
        <Text style={{ fontSize: 8, color: slate600, lineHeight: 1.4 }}>{cc.intent.reason}</Text>
      </View>

      <Footer data={data} pageNum={pageNum} />
    </Page>
  );
};

/* ═══════════════════════════════════════════════════════════════
   PAGE 7/8: FUND FLOW GRAPH
   ═══════════════════════════════════════════════════════════════ */
const FundFlowPage = ({ data, pageNum }: { data: ReportData; pageNum: number }) => {
  const graph = data.graphData;

  return (
    <Page size="A4" style={s.page}>
      <Header data={data} />
      <Text style={s.h2}>Fund Flow Graph</Text>
      <Text style={{ ...s.p, marginBottom: 12 }}>
        Visual representation of fund movements between the analyzed wallet and its top counterparties by transaction volume.
      </Text>

      {graph && graph.nodes.length > 1 ? (
        <View>
          {/* SVG Graph */}
          <View style={{ alignItems: 'center', marginBottom: 14 }}>
            <Svg width={graph.width} height={graph.height} viewBox={`0 0 ${graph.width} ${graph.height}`}>
              {/* Background */}
              <Rect x={0} y={0} width={graph.width} height={graph.height} rx={6}
                style={{ fill: '#f0f4f8', stroke: '#cbd5e1', strokeWidth: 1 }} />

              {/* Edges with arrows */}
              {graph.edges.map((edge, i) => {
                const color = edge.direction === 'OUT' ? red : green;
                const dx = edge.x2 - edge.x1;
                const dy = edge.y2 - edge.y1;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 1) return null;
                const ux = dx / dist;
                const uy = dy / dist;
                const px = -uy;
                const py = ux;
                // Arrowhead triangle
                const aSize = 7;
                const ax = edge.x2;
                const ay = edge.y2;
                const triPath = `M ${ax} ${ay} L ${ax - ux * aSize + px * aSize * 0.45} ${ay - uy * aSize + py * aSize * 0.45} L ${ax - ux * aSize - px * aSize * 0.45} ${ay - uy * aSize - py * aSize * 0.45} Z`;

                return (
                  <G key={`edge-${i}`}>
                    <Line
                      x1={edge.x1} y1={edge.y1}
                      x2={edge.x2 - ux * 5} y2={edge.y2 - uy * 5}
                      style={{ stroke: color, strokeWidth: 1.5 }}
                    />
                    <Path d={triPath} style={{ fill: color }} />
                    {/* Edge value label */}
                    <Text
                      x={edge.labelX + px * 8}
                      y={edge.labelY + py * 8}
                      style={{ fontSize: 5.5, fill: color, fontFamily: 'Helvetica' }}
                    >
                      {edge.label}
                    </Text>
                  </G>
                );
              })}

              {/* Nodes */}
              {graph.nodes.map((node, i) => {
                const color = getNodeColor(node.type);
                const isSource = node.type === 'source';
                return (
                  <G key={`node-${i}`}>
                    {/* Outer ring */}
                    <Circle cx={node.x} cy={node.y} r={node.radius + 2}
                      style={{ fill: 'white', stroke: color, strokeWidth: isSource ? 3 : 2 }} />
                    {/* Inner fill */}
                    <Circle cx={node.x} cy={node.y} r={node.radius}
                      style={{ fill: color, fillOpacity: isSource ? 0.35 : 0.2 }} />
                    {/* Center dot */}
                    <Circle cx={node.x} cy={node.y} r={isSource ? 5 : 3.5}
                      style={{ fill: color }} />
                    {/* Node label */}
                    <Text
                      x={node.x}
                      y={node.y + node.radius + 12}
                      style={{ fontSize: isSource ? 6.5 : 6, fill: slate900, fontFamily: isSource ? 'Helvetica-Bold' : 'Helvetica', textAnchor: 'middle' }}
                    >
                      {node.label}
                    </Text>
                  </G>
                );
              })}
            </Svg>
          </View>

          {/* Node legend table */}
          <View style={{ ...s.table, marginBottom: 10 }}>
            <View style={s.tableHeader}>
              <Text style={{ ...s.th, width: '6%' }}>#</Text>
              <Text style={{ ...s.th, width: '30%' }}>Label</Text>
              <Text style={{ ...s.th, width: '22%' }}>Type</Text>
              <Text style={{ ...s.th, width: '22%' }}>Volume</Text>
              <Text style={{ ...s.th, width: '20%' }}>Direction</Text>
            </View>
            {graph.nodes.filter(n => n.type !== 'source').map((node, i) => {
              const edge = graph.edges.find(e => e.fromId === node.id || e.toId === node.id);
              return (
                <View key={i} style={i % 2 === 0 ? s.tableRow : s.tableRowAlt}>
                  <Text style={{ ...s.td, width: '6%' }}>{i + 1}</Text>
                  <Text style={{ ...s.td, width: '30%', fontFamily: 'Helvetica-Bold' }}>{node.label}</Text>
                  <Text style={{ ...s.td, width: '22%', color: getNodeColor(node.type) }}>{node.type.toUpperCase()}</Text>
                  <Text style={{ ...s.td, width: '22%' }}>{edge?.label || '—'}</Text>
                  <Text style={{ ...s.td, width: '20%', color: edge?.direction === 'IN' ? green : red }}>{edge?.direction || '—'}</Text>
                </View>
              );
            })}
          </View>

          {/* Legend */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 4 }}>
            {[
              { label: 'Your Wallet', color: '#1a7de9' },
              { label: 'Exchange', color: '#00c853' },
              { label: 'Mixer', color: '#ff1744' },
              { label: 'DeFi', color: '#7c3aed' },
              { label: 'Scam', color: '#ff6d00' },
              { label: 'Scam DB', color: '#8B0000' },
              { label: 'Unknown', color: '#546e7a' },
            ].map((item, i) => (
              <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: item.color }} />
                <Text style={{ fontSize: 7, color: slate600 }}>{item.label}</Text>
              </View>
            ))}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <View style={{ width: 12, height: 2, backgroundColor: green }} />
              <Text style={{ fontSize: 7, color: slate600 }}>Incoming</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <View style={{ width: 12, height: 2, backgroundColor: red }} />
              <Text style={{ fontSize: 7, color: slate600 }}>Outgoing</Text>
            </View>
          </View>
        </View>
      ) : (
        <View style={s.card}>
          <Text style={s.p}>
            Fund flow graph could not be generated for this wallet. This may occur when the wallet has very few transactions or all counterparties are filtered as dust.
          </Text>
          <Text style={{ fontSize: 9, color: blue, marginTop: 4 }}>
            For an interactive fund flow visualization, visit www.ledgerhound.vip/graph-tracer
          </Text>
        </View>
      )}

      <Footer data={data} pageNum={pageNum} />
    </Page>
  );
};

/* ═══════════════════════════════════════════════════════════════
   PAGE 8/9: TRANSACTION HISTORY (filtered to real assets, top 30)
   ═══════════════════════════════════════════════════════════════ */
const TransactionsPage = ({ data, pageNum }: { data: ReportData; pageNum: number }) => (
  <Page size="A4" style={s.page} wrap>
    <Header data={data} />
    <Text style={s.h2}>Transaction History (Top {data.transactions.length})</Text>

    <View style={s.table}>
      <View style={s.tableHeader} fixed>
        <Text style={{ ...s.th, width: '14%' }}>Date</Text>
        <Text style={{ ...s.th, width: '8%' }}>Dir</Text>
        <Text style={{ ...s.th, width: '26%' }}>From</Text>
        <Text style={{ ...s.th, width: '26%' }}>To</Text>
        <Text style={{ ...s.th, width: '14%' }}>Value</Text>
        <Text style={{ ...s.th, width: '12%' }}>Token</Text>
      </View>
      {data.transactions.map((tx, i) => (
        <View key={i} style={i % 2 === 0 ? s.tableRow : s.tableRowAlt} wrap={false}>
          <Text style={{ ...s.td, width: '14%', fontSize: 7 }}>{tx.date || '—'}</Text>
          <Text style={{ ...s.td, width: '8%', color: tx.direction === 'IN' ? green : red, fontFamily: 'Helvetica-Bold', fontSize: 7 }}>{tx.direction}</Text>
          <Text style={{ ...s.td, ...s.mono, width: '26%', fontSize: 6 }}>{shortAddr(tx.from)}</Text>
          <Text style={{ ...s.td, ...s.mono, width: '26%', fontSize: 6 }}>{shortAddr(tx.to)}</Text>
          <Text style={{ ...s.td, width: '14%', fontSize: 7 }}>{tx.value > 0 ? fmtEth(tx.value) : '—'}</Text>
          <Text style={{ ...s.td, width: '12%', fontSize: 7 }}>{truncToken(tx.token)}</Text>
        </View>
      ))}
    </View>

    {data.spamFiltered > 0 && (
      <Text style={{ fontSize: 7, color: slate400, fontStyle: 'italic', marginTop: 6 }}>
        Showing legitimate transfers only. {data.spamFiltered} spam/airdrop token transfers were filtered from this analysis.
      </Text>
    )}

    <Footer data={data} pageNum={pageNum} />
  </Page>
);

/* ═══════════════════════════════════════════════════════════════
   PAGE 9/10: RECOVERY SCENARIOS + LEGAL RECOMMENDATIONS
   ═══════════════════════════════════════════════════════════════ */
const probColor = (p: string) => p === 'HIGH' ? red : p === 'LOW' ? green : amber;

const RecoveryLegalPage = ({ data, pageNum }: { data: ReportData; pageNum: number }) => {
  const scenarios = data.recoveryScenarios;

  return (
    <Page size="A4" style={s.page}>
      <Header data={data} />
      <Text style={s.h2}>Recovery Assessment</Text>

      {/* Recovery Scenarios */}
      {scenarios && scenarios.length > 0 && (
        <View style={{ marginBottom: 14 }}>
          {scenarios.map((sc, i) => (
            <View key={i} style={{ ...s.card, marginBottom: 6, borderLeftWidth: 3, borderLeftColor: sc.probability === 'HIGH' ? (sc.recoveryChance === 'HIGH' ? green : red) : slate400 }}>
              <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: slate900, marginBottom: 4 }}>{sc.name}</Text>
              <View style={{ flexDirection: 'row', gap: 16, marginBottom: 4 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Text style={{ fontSize: 7, color: slate400 }}>Probability:</Text>
                  <Text style={{ fontSize: 7, fontFamily: 'Helvetica-Bold', color: probColor(sc.probability) }}>{sc.probability}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Text style={{ fontSize: 7, color: slate400 }}>Recovery if confirmed:</Text>
                  <Text style={{ fontSize: 7, fontFamily: 'Helvetica-Bold', color: sc.recoveryChance === 'HIGH' ? green : sc.recoveryChance === 'MEDIUM' ? amber : red }}>{sc.recoveryChance}</Text>
                </View>
              </View>
              <Text style={{ fontSize: 8, color: slate600, lineHeight: 1.4, marginBottom: 3 }}>{sc.description}</Text>
              <Text style={{ fontSize: 8, color: blue }}>{'\u2192'} {sc.action}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Overall recovery */}
      <View style={{ backgroundColor: '#f1f5f9', borderRadius: 6, padding: 12, marginBottom: 14, alignItems: 'center' }}>
        <Text style={{ fontSize: 8, color: slate400, letterSpacing: 1, marginBottom: 6 }}>OVERALL RECOVERY PROBABILITY</Text>
        <Text style={{ fontSize: 20, fontFamily: 'Helvetica-Bold', color: recoveryColor(data.recoveryScore) }}>{data.recoveryScore}%</Text>
        <Text style={{ fontSize: 8, color: slate600, textAlign: 'center', marginTop: 4 }}>{data.recoveryLabel}</Text>
      </View>

      <View style={s.sectionDivider} />

      {/* Legal Recommendations */}
      <Text style={s.h2}>Legal Recommendations</Text>

      {data.ofacWarning && (
        <View style={{ backgroundColor: darkRed, borderRadius: 6, padding: 10, marginBottom: 10 }}>
          <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: 'white', marginBottom: 3 }}>OFAC COMPLIANCE NOTICE</Text>
          <Text style={{ fontSize: 8, color: '#fecaca', lineHeight: 1.4 }}>Interaction with SDN addresses triggers blocking obligations. Consult OFAC compliance counsel.</Text>
        </View>
      )}

      <Text style={s.h3}>Recommended Actions</Text>
      {data.recommendations.map((r, i) => (
        <Text key={i} style={s.bullet}>{i + 1}. {r}</Text>
      ))}

      <Footer data={data} pageNum={pageNum} />
    </Page>
  );
};

/* ═══════════════════════════════════════════════════════════════
   PAGE 10/11: SUBPOENA TARGETS + INVESTIGATION NEXT STEPS
   ═══════════════════════════════════════════════════════════════ */
const InvestigationPage = ({ data, pageNum }: { data: ReportData; pageNum: number }) => (
  <Page size="A4" style={s.page}>
    <Header data={data} />
    <Text style={s.h2}>Investigation Next Steps</Text>

    {/* Subpoena targets */}
    {data.identifiedEntities.some(e => e.type === 'exchange') && (
      <View style={{ ...s.card, marginBottom: 12, borderLeftWidth: 3, borderLeftColor: green }}>
        <Text style={{ fontSize: 11, fontFamily: 'Helvetica-Bold', color: blue, marginBottom: 6 }}>Subpoena Targets Identified</Text>
        {data.identifiedEntities.filter(e => e.type === 'exchange').map((e, i) => (
          <Text key={i} style={{ fontSize: 10, color: slate900, marginBottom: 2 }}>
            {'\u2022'} {e.label} ({shortAddr(e.address)}) — {e.interactions} interaction(s)
          </Text>
        ))}
        <Text style={{ fontSize: 9, color: slate600, marginTop: 8, lineHeight: 1.4 }}>
          An attorney can file a subpoena compelling the exchange to produce account holder identification, including name, address, government ID, and banking information.
        </Text>
      </View>
    )}

    {/* Recovery action plan */}
    {data.recoveryScore >= 60 && (
      <View style={{ backgroundColor: '#f0fdf4', borderRadius: 6, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: '#bbf7d0' }}>
        <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', color: green, marginBottom: 4 }}>HIGH RECOVERY PROBABILITY — ACTION PLAN</Text>
        <Text style={{ fontSize: 8, color: slate900, paddingLeft: 8, marginBottom: 2 }}>1. File police report immediately (within 72 hours)</Text>
        <Text style={{ fontSize: 8, color: slate900, paddingLeft: 8, marginBottom: 2 }}>2. Request Preservation Letter through attorney to freeze exchange accounts</Text>
        <Text style={{ fontSize: 8, color: slate900, paddingLeft: 8, marginBottom: 2 }}>3. Submit SAR reference to exchange compliance department</Text>
        <Text style={{ fontSize: 8, color: slate900, paddingLeft: 8 }}>4. Consider civil asset recovery proceedings</Text>
      </View>
    )}
    {data.recoveryScore < 35 && (
      <View style={{ backgroundColor: '#fef2f2', borderRadius: 6, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: '#fecaca' }}>
        <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', color: red, marginBottom: 4 }}>LOW RECOVERY PROBABILITY</Text>
        <Text style={{ fontSize: 8, color: slate600, lineHeight: 1.5 }}>
          Funds passed through mixing services or were distributed across wallets. Recovery requires extensive resources and specialized analysis.
        </Text>
      </View>
    )}

    <View style={s.sectionDivider} />

    {/* General next steps */}
    <Text style={s.h3}>Standard Procedures</Text>
    <Text style={s.bullet}>1. File an FBI IC3 complaint at ic3.gov if not already done.</Text>
    <Text style={s.bullet}>2. Preserve all evidence: screenshots, communications, transaction records.</Text>
    <Text style={s.bullet}>3. Consult with an attorney experienced in cryptocurrency fraud cases.</Text>
    <Text style={s.bullet}>4. Consider filing a SAR (Suspicious Activity Report) if applicable.</Text>
    {data.identifiedEntities.some(e => e.type === 'exchange') && (
      <Text style={s.bullet}>5. Engage attorney to file emergency subpoena to identified exchange(s).</Text>
    )}

    <View style={s.sectionDivider} />

    <View style={{ ...s.card, backgroundColor: '#eff6ff' }}>
      <Text style={{ fontSize: 11, fontFamily: 'Helvetica-Bold', color: blue, marginBottom: 6 }}>Need a Certified Forensic Investigation?</Text>
      <Text style={{ fontSize: 9, color: slate600, lineHeight: 1.5 }}>
        This automated report provides preliminary analysis. For court-ready forensic investigations with certified methodology, expert testimony, and full chain-of-custody documentation, contact our forensic team.
      </Text>
      <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', color: blue, marginTop: 10 }}>
        contact@ledgerhound.vip · +1 (833) 559-1334
      </Text>
      <Text style={{ fontSize: 9, color: slate600, marginTop: 4 }}>
        www.ledgerhound.vip/free-evaluation
      </Text>
    </View>

    <Footer data={data} pageNum={pageNum} />
  </Page>
);

/* ═══════════════════════════════════════════════════════════════
   PAGE 11: DISCLAIMER
   ═══════════════════════════════════════════════════════════════ */
const DisclaimerPage = ({ data, pageNum }: { data: ReportData; pageNum: number }) => (
  <Page size="A4" style={s.page}>
    <Header data={data} />
    <Text style={s.h2}>Disclaimer & Legal Notice</Text>

    <Text style={{ ...s.p, lineHeight: 1.6 }}>
      This report was generated automatically by LedgerHound, a service of USPROJECT LLC. It is provided for informational purposes only and does not constitute legal, financial, or investment advice.
    </Text>
    <Text style={{ ...s.p, lineHeight: 1.6 }}>
      The analysis contained herein is based on publicly available blockchain data retrieved at the time of report generation. Blockchain data is permanent and immutable; however, the attribution of wallet addresses to known entities is based on proprietary and open-source intelligence databases that may not be comprehensive.
    </Text>
    <Text style={{ ...s.p, lineHeight: 1.6 }}>
      This automated report is not a substitute for a certified forensic investigation conducted by a qualified blockchain forensic analyst. For matters requiring court testimony, certified methodology, or regulatory compliance, a full forensic engagement is recommended.
    </Text>
    <Text style={{ ...s.p, lineHeight: 1.6 }}>
      Risk scores are generated algorithmically and should be interpreted as preliminary indicators only. A low risk score does not guarantee legitimacy, and a high risk score does not definitively indicate criminal activity.
    </Text>
    <Text style={{ ...s.p, lineHeight: 1.6 }}>
      LedgerHound and USPROJECT LLC are not law firms and do not provide legal representation. Users should consult with qualified legal counsel before taking any legal action based on the contents of this report.
    </Text>
    <Text style={{ ...s.p, lineHeight: 1.6 }}>
      By purchasing and using this report, you agree that USPROJECT LLC's liability is limited to the purchase price of the report.
    </Text>

    <View style={s.sectionDivider} />

    <View style={{ alignItems: 'center', marginTop: 20 }}>
      <Text style={{ fontSize: 12, fontFamily: 'Helvetica-Bold', color: blue, marginBottom: 8 }}>LedgerHound</Text>
      <Text style={{ fontSize: 9, color: slate600 }}>Blockchain Forensics & Crypto Asset Tracing</Text>
      <Text style={{ fontSize: 9, color: slate600, marginTop: 4 }}>USPROJECT LLC</Text>
      <Text style={{ fontSize: 9, color: slate400, marginTop: 8 }}>contact@ledgerhound.vip · www.ledgerhound.vip</Text>
      <Text style={{ fontSize: 9, color: slate400 }}>+1 (833) 559-1334</Text>
    </View>

    <Footer data={data} pageNum={pageNum} />
  </Page>
);

/* ═══════════════════════════════════════════════════════════════
   DOCUMENT
   ═══════════════════════════════════════════════════════════════ */
export const ReportDocument = ({ data }: { data: ReportData }) => {
  const hasCrossChain = data.crossChainTrace?.detected === true;
  const ccOffset = hasCrossChain ? 1 : 0;

  return (
    <Document>
      <CoverPage data={data} />
      <SummaryPage data={data} />
      <AssetTimelinePage data={data} />
      <PatternPage data={data} />
      <AnalyticsPage data={data} />
      <EntitiesExitPage data={data} />
      {hasCrossChain && <CrossChainPage data={data} pageNum={7} />}
      <FundFlowPage data={data} pageNum={7 + ccOffset} />
      <TransactionsPage data={data} pageNum={8 + ccOffset} />
      <RecoveryLegalPage data={data} pageNum={9 + ccOffset} />
      <InvestigationPage data={data} pageNum={10 + ccOffset} />
      <DisclaimerPage data={data} pageNum={11 + ccOffset} />
    </Document>
  );
};
