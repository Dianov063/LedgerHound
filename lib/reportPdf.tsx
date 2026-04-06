import React from 'react';
import { Document, Page, Text, View, StyleSheet, Svg, Circle, Line, Rect, G, Image } from '@react-pdf/renderer';
import { fmtEth, type ReportData } from './generateReport';
import { getNodeColor, type GraphData, type GraphNode, type GraphEdge } from './generateGraphData';

const blue = '#2563eb';
const slate900 = '#0f172a';
const slate600 = '#475569';
const slate400 = '#94a3b8';
const red = '#dc2626';
const green = '#16a34a';
const amber = '#d97706';

const darkRed = '#7f1d1d';
const TOTAL_PAGES = 8;

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
    <Text>Page {pageNum} of {TOTAL_PAGES} · {data.caseId}</Text>
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

// Page 1: Cover
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
      <Text style={{ fontSize: 10, color: red, fontFamily: 'Helvetica-Bold', marginTop: 40 }}>CONFIDENTIAL — For Legal Use</Text>
      <Text style={{ fontSize: 8, color: slate400, marginTop: 20 }}>Generated by LedgerHound · USPROJECT LLC</Text>
    </View>
    <Footer data={data} pageNum={1} />
  </Page>
);

// Page 2: Executive Summary
const SummaryPage = ({ data }: { data: ReportData }) => (
  <Page size="A4" style={s.page}>
    <Header data={data} />
    <Text style={s.h2}>Executive Summary</Text>

    {/* OFAC Warning Banner */}
    {data.ofacWarning && (
      <View style={{ backgroundColor: '#7f1d1d', borderRadius: 6, padding: 12, marginBottom: 16 }}>
        <Text style={{ fontSize: 11, fontFamily: 'Helvetica-Bold', color: 'white', marginBottom: 4 }}>OFAC SANCTIONS ALERT</Text>
        <Text style={{ fontSize: 9, color: '#fecaca', lineHeight: 1.4 }}>
          This wallet has interacted with OFAC-sanctioned addresses. US persons are prohibited from transacting with sanctioned entities under penalty of law.
        </Text>
      </View>
    )}

    {/* Risk + Recovery scores side by side */}
    <View style={{ ...s.row, marginBottom: 20, gap: 12 }}>
      <View style={{ flex: 1, alignItems: 'center', padding: 16, backgroundColor: '#f8fafc', borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0' }}>
        <Text style={{ fontSize: 8, color: slate400, marginBottom: 6, letterSpacing: 1 }}>RISK ASSESSMENT</Text>
        <View style={{ width: 64, height: 64, borderRadius: 32, borderWidth: 3, borderColor: riskColor(data.riskScore), alignItems: 'center', justifyContent: 'center', marginBottom: 6 }}>
          <Text style={{ fontSize: 26, fontFamily: 'Helvetica-Bold', color: riskColor(data.riskScore) }}>{data.riskScore}</Text>
        </View>
        <Text style={{ ...s.badge, backgroundColor: riskColor(data.riskScore), color: 'white', fontSize: 9, paddingHorizontal: 10, paddingVertical: 4 }}>{data.riskLabel}</Text>
      </View>
      <View style={{ flex: 1, alignItems: 'center', padding: 16, backgroundColor: '#f8fafc', borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0' }}>
        <Text style={{ fontSize: 8, color: slate400, marginBottom: 6, letterSpacing: 1 }}>RECOVERY PROBABILITY</Text>
        <View style={{ width: 64, height: 64, borderRadius: 32, borderWidth: 3, borderColor: recoveryColor(data.recoveryScore), alignItems: 'center', justifyContent: 'center', marginBottom: 6 }}>
          <Text style={{ fontSize: 26, fontFamily: 'Helvetica-Bold', color: recoveryColor(data.recoveryScore) }}>{data.recoveryScore}</Text>
        </View>
        <Text style={{ fontSize: 8, color: slate600, textAlign: 'center', maxWidth: 180 }}>{data.recoveryLabel}</Text>
      </View>
    </View>

    {/* Scam Database Matches with QR codes */}
    {data.scamDbMatches && data.scamDbMatches.length > 0 && (
      <View style={{ backgroundColor: '#fef2f2', borderRadius: 6, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: '#fecaca' }}>
        <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', color: red, marginBottom: 6 }}>Linked to LedgerHound Scam Database</Text>
        {data.scamDbMatches.map((m, i) => (
          <View key={i} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
            {m.qrDataUri && (
              <Image src={m.qrDataUri} style={{ width: 36, height: 36, marginRight: 8 }} />
            )}
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 9, color: slate900, fontFamily: 'Helvetica-Bold' }}>
                {m.platformNames.join(', ')}
              </Text>
              <Text style={{ fontSize: 8, color: slate600 }}>
                {shortAddr(m.address)} — {m.reports} reports, ${m.totalLoss.toLocaleString()} losses
              </Text>
              {m.platformSlugs[0] && (
                <Text style={{ fontSize: 7, color: blue }}>
                  www.ledgerhound.vip/scam-database/platform/{m.platformSlugs[0]}
                </Text>
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

    <View style={s.sectionDivider} />

    <Text style={s.h3}>Recommended Actions</Text>
    {data.recommendations.map((r, i) => (
      <Text key={i} style={s.bullet}>{i + 1}. {r}</Text>
    ))}

    <Footer data={data} pageNum={2} />
  </Page>
);

// Page 3: Wallet Analytics
const AnalyticsPage = ({ data }: { data: ReportData }) => (
  <Page size="A4" style={s.page}>
    <Header data={data} />
    <Text style={s.h2}>Wallet Analytics</Text>

    {/* Native currency stats */}
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

    {data.spamFiltered > 0 && (
      <Text style={{ fontSize: 8, color: slate400, fontStyle: 'italic', marginBottom: 8 }}>
        * Totals include {data.nativeCurrency || 'ETH'} and major tokens only. {data.spamFiltered} spam/airdrop token transfers filtered out.
      </Text>
    )}

    {data.inactiveDays > 365 && (
      <View style={{ backgroundColor: '#fffbeb', borderRadius: 6, padding: 10, marginBottom: 8, borderWidth: 1, borderColor: '#fde68a' }}>
        <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: amber, marginBottom: 4 }}>Wallet Inactive — {data.inactiveDays} Days</Text>
        <Text style={{ fontSize: 8, color: slate600, marginBottom: 4 }}>
          Last activity: {data.lastActivity}. This wallet has shown no on-chain activity for {data.inactiveDays} days. Possible explanations:
        </Text>
        <Text style={{ fontSize: 8, color: slate600, paddingLeft: 8, marginBottom: 1 }}>{'\u2022'} Loss of private key access</Text>
        <Text style={{ fontSize: 8, color: slate600, paddingLeft: 8, marginBottom: 1 }}>{'\u2022'} Intentional cooling-off period by bad actor</Text>
        <Text style={{ fontSize: 8, color: slate600, paddingLeft: 8, marginBottom: 1 }}>{'\u2022'} Funds moved to different wallet (check Graph Tracer)</Text>
        <Text style={{ fontSize: 8, color: slate600, paddingLeft: 8 }}>{'\u2022'} Abandoned after achieving objectives</Text>
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

    <Footer data={data} pageNum={3} />
  </Page>
);

// Page 4: Entity Identification
const EntitiesPage = ({ data }: { data: ReportData }) => (
  <Page size="A4" style={s.page}>
    <Header data={data} />
    <Text style={s.h2}>Entity Identification</Text>

    {data.identifiedEntities.length === 0 ? (
      <View style={s.card}>
        <Text style={s.p}>No known entities identified in automated analysis. This does not mean the addresses are unrelated to known entities — manual investigation with commercial tools may reveal additional attributions.</Text>
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

    {data.identifiedEntities.some((e) => e.type === 'mixer') && (
      <View style={{ backgroundColor: '#fef2f2', borderRadius: 6, padding: 12, marginTop: 16 }}>
        <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', color: red, marginBottom: 4 }}>WARNING: Mixer Activity Detected</Text>
        <Text style={{ fontSize: 9, color: slate600, lineHeight: 1.4 }}>
          This wallet has interacted with known cryptocurrency mixing services. Mixing services are commonly used to obscure the origin of funds and are associated with money laundering. Tornado Cash was sanctioned by OFAC in August 2022.
        </Text>
      </View>
    )}

    {data.identifiedEntities.some((e) => e.type === 'exchange') && (
      <View style={{ backgroundColor: '#f0fdf4', borderRadius: 6, padding: 12, marginTop: 12 }}>
        <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', color: green, marginBottom: 4 }}>Exchange Identified — Subpoena Target Available</Text>
        <Text style={{ fontSize: 9, color: slate600, lineHeight: 1.4 }}>
          Funds from this wallet interacted with KYC-compliant exchanges. These exchanges maintain identity records that can be obtained via legal subpoena, potentially revealing the account holder's identity.
        </Text>
      </View>
    )}

    <Footer data={data} pageNum={4} />
  </Page>
);

// Page 5: Fund Flow Graph
const ArrowHead = ({ x, y, ux, uy, color }: { x: number; y: number; ux: number; uy: number; color: string }) => {
  const size = 5;
  const px = -uy; const py = ux; // perpendicular
  const x1 = x - ux * size + px * size * 0.5;
  const y1 = y - uy * size + py * size * 0.5;
  const x2 = x - ux * size - px * size * 0.5;
  const y2 = y - uy * size - py * size * 0.5;
  return <Line x1={x1} y1={y1} x2={x2} y2={y2} style={{ stroke: color, strokeWidth: 0 }} />;
};

const FundFlowPage = ({ data }: { data: ReportData }) => {
  const graph = data.graphData;

  return (
    <Page size="A4" style={s.page}>
      <Header data={data} />
      <Text style={s.h2}>Fund Flow Graph</Text>
      <Text style={{ ...s.p, marginBottom: 12 }}>
        Visual representation of fund movements between the analyzed wallet and its top counterparties by transaction volume.
      </Text>

      {graph ? (
        <View>
          {/* SVG Graph */}
          <View style={{ alignItems: 'center', marginBottom: 16 }}>
            <Svg width={graph.width} height={graph.height} viewBox={`0 0 ${graph.width} ${graph.height}`}>
              {/* Background */}
              <Rect x={0} y={0} width={graph.width} height={graph.height} rx={8} style={{ fill: '#f8fafc' }} />

              {/* Edges */}
              {graph.edges.map((edge, i) => {
                const color = edge.direction === 'OUT' ? red : green;
                const dx = edge.x2 - edge.x1;
                const dy = edge.y2 - edge.y1;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const ux = dist > 0 ? dx / dist : 0;
                const uy = dist > 0 ? dy / dist : 0;
                // Arrow triangle path
                const ax = edge.x2;
                const ay = edge.y2;
                const aSize = 6;
                const px = -uy;
                const py = ux;
                const triPath = `M ${ax} ${ay} L ${ax - ux * aSize + px * aSize * 0.4} ${ay - uy * aSize + py * aSize * 0.4} L ${ax - ux * aSize - px * aSize * 0.4} ${ay - uy * aSize - py * aSize * 0.4} Z`;

                return (
                  <G key={`edge-${i}`}>
                    <Line
                      x1={edge.x1} y1={edge.y1}
                      x2={edge.x2 - ux * 4} y2={edge.y2 - uy * 4}
                      style={{ stroke: color, strokeWidth: 1.2, strokeOpacity: 0.6 }}
                    />
                  </G>
                );
              })}

              {/* Nodes */}
              {graph.nodes.map((node, i) => {
                const color = getNodeColor(node.type);
                return (
                  <G key={`node-${i}`}>
                    {/* Outer ring */}
                    <Circle cx={node.x} cy={node.y} r={node.radius + 2} style={{ fill: 'white', stroke: color, strokeWidth: 1.5 }} />
                    {/* Inner fill */}
                    <Circle cx={node.x} cy={node.y} r={node.radius} style={{ fill: color, fillOpacity: 0.15 }} />
                    {/* Center dot */}
                    <Circle cx={node.x} cy={node.y} r={3} style={{ fill: color }} />
                  </G>
                );
              })}
            </Svg>
          </View>

          {/* Node labels (outside SVG for proper PDF text rendering) */}
          <View style={{ ...s.table, marginBottom: 12 }}>
            <View style={s.tableHeader}>
              <Text style={{ ...s.th, width: '8%' }}>#</Text>
              <Text style={{ ...s.th, width: '32%' }}>Label</Text>
              <Text style={{ ...s.th, width: '20%' }}>Type</Text>
              <Text style={{ ...s.th, width: '20%' }}>Volume</Text>
              <Text style={{ ...s.th, width: '20%' }}>Direction</Text>
            </View>
            {graph.nodes.filter(n => n.type !== 'source').map((node, i) => {
              const edge = graph.edges.find(e => e.fromId === node.id || e.toId === node.id);
              return (
                <View key={i} style={i % 2 === 0 ? s.tableRow : s.tableRowAlt}>
                  <Text style={{ ...s.td, width: '8%' }}>{i + 1}</Text>
                  <Text style={{ ...s.td, width: '32%', fontFamily: 'Helvetica-Bold' }}>{node.label}</Text>
                  <Text style={{ ...s.td, width: '20%', color: getNodeColor(node.type) }}>{node.type.toUpperCase()}</Text>
                  <Text style={{ ...s.td, width: '20%' }}>{edge?.label || '—'}</Text>
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

      <Footer data={data} pageNum={5} />
    </Page>
  );
};

// Page 6: Transaction History
const TransactionsPage = ({ data }: { data: ReportData }) => (
  <Page size="A4" style={s.page} wrap>
    <Header data={data} />
    <Text style={s.h2}>Transaction History (Top {data.transactions.length})</Text>

    <View style={s.table}>
      {/* Repeated header on each page via fixed */}
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

    <Footer data={data} pageNum={6} />
  </Page>
);

// Page 7: Legal Recommendations
const LegalPage = ({ data }: { data: ReportData }) => (
  <Page size="A4" style={s.page}>
    <Header data={data} />
    <Text style={s.h2}>Legal Recommendations</Text>

    {/* OFAC Compliance Notice */}
    {data.ofacWarning && (
      <View style={{ backgroundColor: '#7f1d1d', borderRadius: 6, padding: 12, marginBottom: 12 }}>
        <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', color: 'white', marginBottom: 4 }}>OFAC COMPLIANCE NOTICE</Text>
        <Text style={{ fontSize: 8, color: '#fecaca', lineHeight: 1.5 }}>
          Interaction with addresses on the SDN (Specially Designated Nationals) list triggers blocking obligations for financial institutions under 31 CFR 501. Tier-1 exchanges will likely reject deposits from this wallet without prior remediation. Consult OFAC compliance counsel before attempting any further transactions.
        </Text>
      </View>
    )}

    {/* Recovery Action Plan */}
    {data.recoveryScore >= 60 && (
      <View style={{ backgroundColor: '#f0fdf4', borderRadius: 6, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: '#bbf7d0' }}>
        <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', color: green, marginBottom: 4 }}>HIGH RECOVERY PROBABILITY</Text>
        <Text style={{ fontSize: 8, color: slate600, lineHeight: 1.5, marginBottom: 4 }}>
          Funds detected on KYC-compliant exchange(s). Recommended immediate steps:
        </Text>
        <Text style={{ fontSize: 8, color: slate900, paddingLeft: 8, marginBottom: 2 }}>1. File police report immediately (within 72 hours of discovery)</Text>
        <Text style={{ fontSize: 8, color: slate900, paddingLeft: 8, marginBottom: 2 }}>2. Request Preservation Letter through attorney to freeze exchange accounts</Text>
        <Text style={{ fontSize: 8, color: slate900, paddingLeft: 8, marginBottom: 2 }}>3. Submit SAR reference to exchange compliance department</Text>
        <Text style={{ fontSize: 8, color: slate900, paddingLeft: 8 }}>4. Consider civil asset recovery proceedings in parallel</Text>
      </View>
    )}
    {data.recoveryScore < 35 && (
      <View style={{ backgroundColor: '#fef2f2', borderRadius: 6, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: '#fecaca' }}>
        <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', color: red, marginBottom: 4 }}>LOW RECOVERY PROBABILITY</Text>
        <Text style={{ fontSize: 8, color: slate600, lineHeight: 1.5 }}>
          Funds passed through mixing services or were distributed across multiple wallets. Recovery requires extensive legal resources and specialized demixing analysis. Consider cost-benefit analysis before proceeding with legal action. Professional forensic investigation may still uncover traceable paths.
        </Text>
      </View>
    )}

    {data.identifiedEntities.some((e) => e.type === 'exchange') && (
      <View style={{ ...s.card, marginBottom: 12 }}>
        <Text style={{ fontSize: 11, fontFamily: 'Helvetica-Bold', color: blue, marginBottom: 6 }}>Subpoena Target Identified</Text>
        {data.identifiedEntities.filter((e) => e.type === 'exchange').map((e, i) => (
          <Text key={i} style={{ fontSize: 10, color: slate900, marginBottom: 2 }}>
            {'\u2022'} {e.label} ({shortAddr(e.address)}) — {e.interactions} interaction(s)
          </Text>
        ))}
        <Text style={{ fontSize: 9, color: slate600, marginTop: 8, lineHeight: 1.4 }}>
          An attorney can file a subpoena or discovery request compelling the exchange to produce account holder identification, including name, address, government ID, and banking information associated with the receiving account.
        </Text>
      </View>
    )}

    <View style={s.sectionDivider} />

    <Text style={s.h3}>Recommended Next Steps</Text>
    <Text style={s.bullet}>1. File an FBI IC3 complaint at ic3.gov if not already done.</Text>
    <Text style={s.bullet}>2. Preserve all evidence: screenshots, communications, transaction records.</Text>
    <Text style={s.bullet}>3. Consult with an attorney experienced in cryptocurrency fraud cases.</Text>
    <Text style={s.bullet}>4. Consider filing a SAR (Suspicious Activity Report) if applicable.</Text>
    {data.identifiedEntities.some((e) => e.type === 'exchange') && (
      <Text style={s.bullet}>5. Engage attorney to file emergency subpoena to identified exchange(s).</Text>
    )}
    <Text style={s.bullet}>{data.identifiedEntities.some((e) => e.type === 'exchange') ? '6' : '5'}. For comprehensive certified investigation: contact LedgerHound.</Text>

    <View style={s.sectionDivider} />

    <View style={{ ...s.card, backgroundColor: '#eff6ff' }}>
      <Text style={{ fontSize: 11, fontFamily: 'Helvetica-Bold', color: blue, marginBottom: 6 }}>Need a Certified Forensic Investigation?</Text>
      <Text style={{ fontSize: 9, color: slate600, lineHeight: 1.5 }}>
        This automated report provides a preliminary analysis based on publicly available blockchain data. For court-ready forensic investigations with certified methodology, expert testimony, and full chain-of-custody documentation, contact our forensic team.
      </Text>
      <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', color: blue, marginTop: 10 }}>
        contact@ledgerhound.vip · +1 (833) 559-1334
      </Text>
      <Text style={{ fontSize: 9, color: slate600, marginTop: 4 }}>
        www.ledgerhound.vip/free-evaluation
      </Text>
    </View>

    <Footer data={data} pageNum={7} />
  </Page>
);

// Page 8: Disclaimer
const DisclaimerPage = ({ data }: { data: ReportData }) => (
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

    <Footer data={data} pageNum={8} />
  </Page>
);

export const ReportDocument = ({ data }: { data: ReportData }) => (
  <Document>
    <CoverPage data={data} />
    <SummaryPage data={data} />
    <AnalyticsPage data={data} />
    <EntitiesPage data={data} />
    <FundFlowPage data={data} />
    <TransactionsPage data={data} />
    <LegalPage data={data} />
    <DisclaimerPage data={data} />
  </Document>
);
