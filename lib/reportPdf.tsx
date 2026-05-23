import React from 'react';
import path from 'path';
import { Document, Page, Text, View, StyleSheet, Svg, Circle, Line, Rect, G, Image, Path, Font } from '@react-pdf/renderer';
import { fmtEth, type ReportData, type RiskBreakdown, type TimelineEvent, type ExitPoint, type RecoveryScenario, type AssetSummary, type PatternAnalysis, type ScamPattern, type CrossChainTrace, type BridgeInteraction, type ChainActivity, type CrossChainHop, type NarrativeData, type EvidenceStrength, type RecoveryAssessment, type WalletRole } from './generateReport';
import { getNodeColor, type GraphData, type GraphNode, type GraphEdge } from './generateGraphData';
import { firstDifferingCharParts } from './address-poisoning';
import { getCodepoints, normalizeForDisplay, detectScriptCategory } from './unicode-spoofing';
import { getReportTranslations, type ReportTranslations, type ReportLocale } from './report-i18n';

/**
 * Report i18n. Translations are resolved once in ReportDocument via
 * getReportTranslations(locale) and prop-drilled (`t`) into every page +
 * Header/Footer. We deliberately do NOT use React.createContext/useContext:
 * those are stripped from the `react-server` build Next.js uses for route
 * handlers, so any module-level createContext crashes the production build
 * ("collect page data"). Mirrors lib/legal-packs/templates.tsx. 2026-05-21.
 */

/**
 * Noto Sans Lisu — needed to render the Lisu-letter token spoofs (e.g.
 * "ꓴꓢꓓꓔ" = USDT) in the Attack Technique Analysis page. Same local-first /
 * CDN-fallback strategy as legal-packs/templates.tsx. 2026-05-21 (Phase 2).
 *
 * If the font can't be resolved at render time, codepoints are ALWAYS shown
 * alongside the glyph, so forensic value is never lost.
 */
const NOTO_LISU_CDN = 'https://fonts.gstatic.com/s/notosanslisu/v27/uk-3EGO3o6EruUbnwovcYhz6kh57_nqbcTdjJnHP2Vwt2w.ttf';
let LISU_FONT_FAMILY = 'Helvetica'; // safe fallback — overwritten on success
try {
  const resolveLisu = (): string => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const fs = require('fs');
      const local = path.resolve(process.cwd(), 'lib', 'fonts', 'NotoSansLisu-Regular.ttf');
      if (fs.existsSync(local)) return local;
    } catch { /* bundled env — use CDN */ }
    return NOTO_LISU_CDN;
  };
  Font.register({ family: 'NotoSansLisu', src: resolveLisu() });
  LISU_FONT_FAMILY = 'NotoSansLisu';
} catch (e) {
  // Registration failed — keep Helvetica fallback. Codepoints still render.
  // eslint-disable-next-line no-console
  console.warn('[reportPdf] NotoSansLisu registration failed, using codepoint fallback:', (e as Error)?.message);
}

/**
 * Noto Sans (Latin + Cyrillic + Greek) — needed to render Cyrillic/mixed
 * spoof symbols like "ÚЅDТ". NotoSansLisu does NOT cover Cyrillic, so we pick
 * the font per script: Lisu → NotoSansLisu, everything else → NotoSansRpt.
 * 2026-05-21 (Phase 2.5 polish). Distinct family name avoids colliding with
 * legal-packs' global 'NotoSans' registration.
 */
const NOTO_SANS_CDN = 'https://fonts.gstatic.com/s/notosans/v42/o-0mIpQlx3QUlC5A4PNB6Ryti20_6n1iPHjcz6L1SoM-jCpoiyD9A99d.ttf';
let SANS_FONT_FAMILY = 'Helvetica'; // fallback (Helvetica lacks Cyrillic, but never crashes)
try {
  const resolveSans = (): string => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const fs = require('fs');
      const local = path.resolve(process.cwd(), 'lib', 'fonts', 'NotoSans-Regular.ttf');
      if (fs.existsSync(local)) return local;
    } catch { /* bundled env — use CDN */ }
    return NOTO_SANS_CDN;
  };
  Font.register({ family: 'NotoSansRpt', src: resolveSans() });
  SANS_FONT_FAMILY = 'NotoSansRpt';
} catch (e) {
  // eslint-disable-next-line no-console
  console.warn('[reportPdf] NotoSansRpt registration failed, using Helvetica fallback:', (e as Error)?.message);
}

/**
 * Pick the right font for a spoof symbol based on its Unicode script.
 * Lisu needs NotoSansLisu; Cyrillic/Greek/Latin-diacritic/Mixed need
 * NotoSansRpt (Latin+Cyrillic+Greek). 2026-05-21.
 */
function fontForScript(scriptCategory: string): string {
  return scriptCategory === 'Lisu' ? LISU_FONT_FAMILY : SANS_FONT_FAMILY;
}

const blue = '#2563eb';
const slate900 = '#0f172a';
const slate600 = '#475569';
const slate400 = '#94a3b8';
const red = '#dc2626';
const green = '#16a34a';
const amber = '#d97706';
const darkRed = '#7f1d1d';
const purple = '#7c3aed';

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

const Header = ({ data, t }: { data: ReportData; t: ReportTranslations }) => {
  return (
    <View style={s.header}>
      <Text style={s.logo}>LedgerHound</Text>
      <View style={s.headerRight}>
        <Text>{t.common.caseId}: {data.caseId}</Text>
        <Text>{data.date}</Text>
      </View>
    </View>
  );
};

const Footer = ({ data, t }: { data: ReportData; t: ReportTranslations }) => {
  return (
    <View style={s.footer} fixed>
      <Text>{t.common.confidential}</Text>
      <Text render={({ pageNumber, totalPages }) => `${t.common.pageOf(pageNumber, totalPages)} · ${data.caseId}`} />
    </View>
  );
};

const shortAddr = (addr: string) =>
  addr && addr.length >= 14 ? `${addr.slice(0, 8)}...${addr.slice(-6)}` : addr || '—';

const truncToken = (t: string) => (t.length > 8 ? t.slice(0, 7) + '…' : t);

/** Phase 2.7: format a {symbol: amount} record, e.g. "11,020.50 USDT, 0.50 ETH". */
const fmtTokenRecord = (rec?: Record<string, number>): string => {
  if (!rec) return '';
  return Object.entries(rec)
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([sym, v]) => `${v.toLocaleString('en-US', { maximumFractionDigits: 2 })} ${sym}`)
    .join(', ');
};

const riskColor = (score: number) => {
  if (score >= 85) return darkRed;
  if (score >= 70) return red;
  if (score >= 40) return amber;
  return green;
};

/**
 * Recovery score color scale.
 * 2026-05-20: Recovery score is now hard-capped at 35% (see recoveryAssessment
 * in generateReport.ts). The old thresholds (>=60 green) are unreachable now,
 * so we use the new tiers: HIGHER_THAN_AVERAGE (>=25) is amber; MODERATE/LOW
 * (15-24, 8-14) is amber; VERY_LOW (<8) is red. We deliberately never return
 * green — the cap exists precisely because we don't want to imply high recovery.
 */
const recoveryColor = (score: number) => {
  if (score >= 15) return amber;
  return red;
};

/* ═══════════════════════════════════════════════════════════════
   PAGE 1: COVER
   ═══════════════════════════════════════════════════════════════ */
const CoverPage = ({ data, t }: { data: ReportData; t: ReportTranslations }) => {
  return (
    <Page size="A4" style={{ ...s.page, justifyContent: 'center', alignItems: 'center' }}>
      <View style={{ alignItems: 'center' }}>
        <Text style={{ fontSize: 28, fontFamily: 'Helvetica-Bold', color: blue, marginBottom: 40 }}>LedgerHound</Text>
        <Text style={{ fontSize: 20, fontFamily: 'Helvetica-Bold', color: slate900, marginBottom: 6 }}>{t.cover.line1}</Text>
        <Text style={{ fontSize: 20, fontFamily: 'Helvetica-Bold', color: slate900, marginBottom: 30 }}>{t.cover.line2}</Text>
        <View style={{ backgroundColor: '#eff6ff', borderRadius: 8, paddingVertical: 6, paddingHorizontal: 16, marginBottom: 16 }}>
          <Text style={{ fontSize: 11, fontFamily: 'Helvetica-Bold', color: blue }}>{data.networkLabel || 'Ethereum (ETH)'}</Text>
        </View>
        <View style={{ backgroundColor: '#f1f5f9', borderRadius: 8, padding: 20, width: 400, alignItems: 'center', marginBottom: 30 }}>
          <Text style={{ fontSize: 8, color: slate400, marginBottom: 4 }}>{t.cover.walletAddress}</Text>
          <Text style={{ fontFamily: 'Courier', fontSize: data.walletAddress.length > 44 ? 8 : 10, color: slate900 }}>{data.walletAddress}</Text>
        </View>
        <View style={s.row}>
          <View style={{ alignItems: 'center', marginRight: 40 }}>
            <Text style={s.label}>{t.cover.date}</Text>
            <Text style={{ fontSize: 12, fontFamily: 'Helvetica-Bold' }}>{data.date}</Text>
          </View>
          <View style={{ alignItems: 'center' }}>
            <Text style={s.label}>{t.cover.caseId}</Text>
            <Text style={{ fontSize: 12, fontFamily: 'Helvetica-Bold' }}>{data.caseId}</Text>
          </View>
        </View>
        <Text style={{ fontSize: 8, color: slate400, marginTop: 30 }}>{t.cover.premium}</Text>
        <Text style={{ fontSize: 10, color: red, fontFamily: 'Helvetica-Bold', marginTop: 10 }}>{t.cover.confidential}</Text>
        <Text style={{ fontSize: 8, color: slate400, marginTop: 20 }}>{t.cover.generatedBy}</Text>
      </View>
      <Footer data={data} t={t} />
    </Page>
  );
};

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

const SummaryPage = ({ data, t, country }: { data: ReportData; t: ReportTranslations; country?: string }) => {
  const bd = data.riskBreakdown;
  // Map the data-driven risk enum to its localized label.
  const riskLabelL = t.riskLabels[data.riskLabel as keyof typeof t.riskLabels] ?? data.riskLabel;
  return (
    <Page size="A4" style={s.page}>
      <Header data={data} t={t} />
      <Text style={s.h2}>{t.sections.executiveSummary}</Text>

      {/* OFAC Warning Banner */}
      {data.ofacWarning && (
        <View style={{ backgroundColor: darkRed, borderRadius: 6, padding: 12, marginBottom: 16 }}>
          <Text style={{ fontSize: 11, fontFamily: 'Helvetica-Bold', color: 'white', marginBottom: 4 }}>{t.exec.ofacAlertTitle}</Text>
          <Text style={{ fontSize: 9, color: '#fecaca', lineHeight: 1.4 }}>
            {t.exec.ofacAlertBody}
          </Text>
        </View>
      )}

      {/* Risk + Recovery scores side by side */}
      <View style={{ ...s.row, marginBottom: 14, gap: 12 }}>
        <View style={{ flex: 1, alignItems: 'center', padding: 14, backgroundColor: '#f8fafc', borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0' }}>
          <Text style={{ fontSize: 8, color: slate400, marginBottom: 6, letterSpacing: 1 }}>{t.exec.riskScore}</Text>
          <View style={{ width: 56, height: 56, borderRadius: 28, borderWidth: 3, borderColor: riskColor(data.riskScore), alignItems: 'center', justifyContent: 'center', marginBottom: 6 }}>
            <Text style={{ fontSize: 22, fontFamily: 'Helvetica-Bold', color: riskColor(data.riskScore) }}>{data.riskScore}</Text>
          </View>
          <Text style={{ ...s.badge, backgroundColor: riskColor(data.riskScore), color: 'white', fontSize: 8, paddingHorizontal: 10, paddingVertical: 3 }}>{riskLabelL}</Text>
        </View>
        <View style={{ flex: 1, alignItems: 'center', padding: 14, backgroundColor: '#f8fafc', borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0' }}>
          <Text style={{ fontSize: 8, color: slate400, marginBottom: 6, letterSpacing: 1 }}>{t.exec.recoveryProbability}</Text>
          <View style={{ width: 56, height: 56, borderRadius: 28, borderWidth: 3, borderColor: recoveryColor(data.recoveryAssessment.score), alignItems: 'center', justifyContent: 'center', marginBottom: 6 }}>
            <Text style={{ fontSize: 22, fontFamily: 'Helvetica-Bold', color: recoveryColor(data.recoveryAssessment.score) }}>{data.recoveryAssessment.score}%</Text>
          </View>
          <Text style={{ fontSize: 8, color: slate600, textAlign: 'center', maxWidth: 180 }}>{data.recoveryAssessment.label}</Text>
        </View>
      </View>

      {/* Recovery disclaimer + factors — mandatory transparency block.
          2026-05-20: New since recoveryAssessment was introduced; we always
          show the disclaimer to avoid implying guarantees. */}
      <View style={{ backgroundColor: '#fffbeb', borderRadius: 6, padding: 10, marginBottom: 12, borderWidth: 1, borderColor: '#fde68a' }}>
        <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', color: amber, marginBottom: 4 }}>{t.exec.recoveryDisclaimerTitle}</Text>
        <Text style={{ fontSize: 7, color: slate600, lineHeight: 1.5, marginBottom: 6 }}>{data.recoveryAssessment.disclaimer}</Text>
        {(data.recoveryAssessment.factors.positive.length > 0 || data.recoveryAssessment.factors.negative.length > 0) && (
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {data.recoveryAssessment.factors.positive.length > 0 && (
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 7, fontFamily: 'Helvetica-Bold', color: green, marginBottom: 2 }}>{t.exec.positiveFactors}</Text>
                {data.recoveryAssessment.factors.positive.slice(0, 5).map((f, i) => (
                  <Text key={i} style={{ fontSize: 7, color: slate600, marginBottom: 1, paddingLeft: 4 }}>+ {f}</Text>
                ))}
              </View>
            )}
            {data.recoveryAssessment.factors.negative.length > 0 && (
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 7, fontFamily: 'Helvetica-Bold', color: red, marginBottom: 2 }}>{t.exec.negativeFactors}</Text>
                {data.recoveryAssessment.factors.negative.slice(0, 5).map((f, i) => (
                  <Text key={i} style={{ fontSize: 7, color: slate600, marginBottom: 1, paddingLeft: 4 }}>- {f}</Text>
                ))}
              </View>
            )}
          </View>
        )}
      </View>

      {/* RISK BREAKDOWN TABLE */}
      {bd && (
        <View style={{ ...s.card, padding: 10, marginBottom: 12 }}>
          <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: slate900, marginBottom: 6 }}>{t.exec.riskBreakdownTitle}</Text>
          <View style={{ backgroundColor: '#f1f5f9', borderRadius: 4, paddingVertical: 4, paddingHorizontal: 8, marginBottom: 2 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 7, fontFamily: 'Helvetica-Bold', color: slate600 }}>{t.exec.colFactor}</Text>
              <Text style={{ fontSize: 7, fontFamily: 'Helvetica-Bold', color: slate600 }}>{t.exec.colScore}</Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3, paddingHorizontal: 8, borderBottomWidth: 0.5, borderBottomColor: '#e2e8f0' }}>
            <Text style={{ fontSize: 8, color: slate600 }}>{t.exec.baseline}</Text>
            <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', color: slate400 }}>50</Text>
          </View>
          <RiskBreakdownRow label={t.exec.rowUnknownWallet} score={bd.unknownWalletInteraction} />
          <RiskBreakdownRow label={t.exec.rowMixer} score={bd.mixerInteraction} />
          <RiskBreakdownRow label={t.exec.rowKycExchange} score={bd.exchangeInteraction} />
          <RiskBreakdownRow label={t.exec.rowMultiHop} score={bd.multiHopTransfers} />
          <RiskBreakdownRow label={t.exec.rowStablecoin} score={bd.stablecoinUsage} />
          <RiskBreakdownRow label={t.exec.rowOfac} score={bd.sanctionedAddress} />
          <RiskBreakdownRow label={t.exec.rowScamDb} score={bd.scamDbMatch} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5, paddingHorizontal: 8, backgroundColor: '#f1f5f9', borderRadius: 4, marginTop: 4 }}>
            <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: slate900 }}>{t.exec.totalRiskScore}</Text>
            <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: riskColor(data.riskScore) }}>{data.riskScore} {riskLabelL}</Text>
          </View>
        </View>
      )}

      {/* Scam Database Matches.
          2026-05-20: For victim subject, scamDbMatches are all COUNTERPARTY
          hits (the scammer cluster), not the subject. Disambiguate the header
          to avoid implying the subject wallet itself is in the scam DB. */}
      {data.scamDbMatches && data.scamDbMatches.length > 0 && (() => {
        const subjectMatched = data.scamDbMatches.some(m => m.address.toLowerCase() === data.walletAddress.toLowerCase());
        const headerText = subjectMatched
          ? t.exec.scamDbLinked
          : t.exec.scamDbCounterpartyLinked;
        return (
        <View style={{ backgroundColor: '#fef2f2', borderRadius: 6, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: '#fecaca' }}>
          <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', color: red, marginBottom: 6 }}>{headerText}</Text>
          {data.scamDbMatches.map((m, i) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
              {m.qrDataUri && (
                <Image src={m.qrDataUri} style={{ width: 36, height: 36, marginRight: 8 }} />
              )}
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 9, color: slate900, fontFamily: 'Helvetica-Bold' }}>{m.platformNames.join(', ')}</Text>
                <Text style={{ fontSize: 8, color: slate600 }}>{shortAddr(m.address)} — {t.exec.reportsLosses(m.reports, m.totalLoss.toLocaleString())}</Text>
                {m.platformSlugs[0] && (
                  <Text style={{ fontSize: 7, color: blue }}>www.ledgerhound.vip/scam-database/platform/{m.platformSlugs[0]}</Text>
                )}
              </View>
            </View>
          ))}
        </View>
        );
      })()}

      <View style={s.sectionDivider} />

      {/* Phase 3.1 Stage 6/7 (T1/A1): unit-separated economic-loss line.
          Real currency to the cluster + the misdirected portion, with worthless
          spoof-token units reported SEPARATELY (never summed — that mixed-unit
          sum was the 90,439.94 regression). */}
      {(() => {
        const apz = data.attackTechniques?.addressPoisoning;
        const lc = apz?.detected ? apz.campaigns[0] : null;
        if (!lc) return null;
        const realStr = fmtTokenRecord(lc.totalRealByVictim);
        if (!realStr) return null; // only show when there is real-currency loss
        const misStr = fmtTokenRecord(lc.totalMisdirectedReal);
        const spoofTotal = Object.values(lc.totalSpoofByVictim || {}).reduce((s, v) => s + v, 0);
        const spoofStr = spoofTotal > 0 ? spoofTotal.toLocaleString('en-US', { maximumFractionDigits: 2 }) : '';
        return (
          <View style={{ backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fecaca', borderRadius: 6, padding: 10, marginBottom: 10 }}>
            <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: darkRed, lineHeight: 1.5 }}>
              {t.investigation.totalEconomicLossLine(realStr, misStr, spoofStr)}
            </Text>
          </View>
        );
      })()}

      <Text style={s.h3}>{t.exec.keyFindings}</Text>
      {data.keyFindings.map((f, i) => (
        <Text key={i} style={s.bullet}>{'\u2022'} {f}</Text>
      ))}

      {/* Phase 3.1 Stage 11 (B2): documents-in-package checklist (Peru ES only). */}
      {t.locale === 'es' && country === 'PE' && (() => {
        const pg = t.countryGuidance.peru;
        return (
          <View style={{ ...s.card, backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#bfdbfe', marginTop: 10 }}>
            <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: blue, marginBottom: 3 }}>{pg.documentsTitle}</Text>
            <Text style={{ fontSize: 7.5, color: slate600, marginBottom: 4 }}>{pg.documentsIntro}</Text>
            <Text style={{ fontSize: 7.5, color: slate900, marginBottom: 2 }}>1. {pg.documentsDivindat}</Text>
            <Text style={{ fontSize: 7.5, color: slate900, marginBottom: 2 }}>2. {pg.documentsBinance}</Text>
            <Text style={{ fontSize: 7.5, color: slate900, marginBottom: 4 }}>3. {pg.documentsTether}</Text>
            <Text style={{ fontSize: 7, color: slate600, fontStyle: 'italic' }}>{pg.documentsOrder}</Text>
          </View>
        );
      })()}

      <Footer data={data} t={t} />
    </Page>
  );
};

/* ═══════════════════════════════════════════════════════════════
   PAGE 3: INVESTIGATION NARRATIVE + EVIDENCE STRENGTH + VICTIM FLOW
   ═══════════════════════════════════════════════════════════════ */
/* ─── Recovery Readiness Assessment (Phase 2.5 / Part 9) ───
   Inserted after Executive Summary. Page numbers in footers are dynamic
   (react-pdf render callback), so no hardcoded numbers shift. */
interface ReadinessResult {
  score: number;
  tier: 'Excellent' | 'Strong' | 'Moderate' | 'Limited';
  label: string;
  evidenceItems: { included: boolean; label: string }[];
}

/**
 * 2026-05-21 (Phase 2.5 Fix 1): A subject→CEX transfer only counts as the
 * SCAMMER's cash-out exit when the subject is NOT the victim. For a victim
 * wallet, sends to a CEX are the victim's OWN exchange — the scammer's
 * cash-out lies one or more hops beyond the cluster and isn't in this
 * wallet's direct history. Used consistently across the readiness checklist
 * and the difficulty factors so the page can't contradict itself.
 */
function scammerCashOutDetected(data: ReportData): boolean {
  return data.narrative?.walletType !== 'victim' && !!data.exchangeAnalysis?.hasExitKyc;
}

function calculateReadinessScore(data: ReportData, t: ReportTranslations): ReadinessResult {
  const r = t.readiness;
  const ap = data.attackTechniques?.addressPoisoning;
  const us = data.attackTechniques?.unicodeSpoofing;
  const scammerExit = scammerCashOutDetected(data);
  const items = [
    { included: true, label: r.evOnChain, weight: 5 },
    { included: !!data.exchangeAnalysis?.hasEntryKyc, label: r.evVictimEntry, weight: 10 },
    {
      included: scammerExit,
      label: scammerExit ? r.evScammerExit : r.evScammerExitNot,
      weight: 25,
    },
    { included: (data.scamDbMatches?.length > 0) || !!ap?.detected, label: r.evFraudNetwork, weight: 15 },
    { included: data.addressLabels?.some(l => l.hasPhishingFlag) || false, label: r.evEtherscanTag, weight: 15 },
    { included: !!ap?.detected, label: r.evPoisoning, weight: 10 },
    { included: !!us?.detected, label: r.evUnicode, weight: 5 },
    { included: data.narrative?.walletType === 'victim', label: r.evVictimClass, weight: 5 },
    { included: (data.patternAnalysis?.patterns?.length ?? 0) > 0, label: r.evBehavioral, weight: 5 },
    { included: true, label: r.evRecoveryProb, weight: 5 },
  ];
  const score = items.reduce((sum, it) => sum + (it.included ? it.weight : 0), 0);
  let tier: ReadinessResult['tier'];
  let label: string;
  if (score >= 75) { tier = 'Excellent'; label = r.labelExcellent; }
  else if (score >= 55) { tier = 'Strong'; label = r.labelStrong; }
  else if (score >= 35) { tier = 'Moderate'; label = r.labelModerate; }
  else { tier = 'Limited'; label = r.labelLimited; }
  return { score, tier, label, evidenceItems: items.map(({ included, label }) => ({ included, label })) };
}

interface DifficultyResult {
  tier: 'LOW' | 'MEDIUM' | 'HIGH';
  explanation: string;
  factors: { positive: boolean; text: string }[];
}

function calculateInvestigationDifficulty(data: ReportData, t: ReportTranslations): DifficultyResult {
  const r = t.readiness;
  const factors: { positive: boolean; text: string }[] = [];
  let d = 50;
  const hasMixer = data.identifiedEntities?.some(e => e.type === 'mixer') || (data.riskBreakdown?.mixerInteraction ?? 0) > 0;
  const hasCrossChain = data.crossChainTrace?.detected === true;
  const ap = data.attackTechniques?.addressPoisoning;

  if (data.exchangeAnalysis?.hasEntryKyc) { factors.push({ positive: true, text: r.dfKycEntry }); d -= 15; }
  if (data.addressLabels?.some(l => l.hasPhishingFlag)) { factors.push({ positive: true, text: r.dfEtherscanVerified }); d -= 10; }
  if (ap?.detected) { factors.push({ positive: true, text: r.dfCampaignDocumented }); d -= 10; }

  if (hasMixer) { factors.push({ positive: false, text: r.dfMixer }); d += 30; }
  if (hasCrossChain) { factors.push({ positive: false, text: r.dfCrossChain }); d += 25; }
  if ((ap?.campaigns?.length ?? 0) > 1) { factors.push({ positive: false, text: r.dfMultiCluster }); d += 15; }
  // Consistent with the readiness checklist: a victim's own CEX sends are not
  // the scammer's cash-out, so use the role-aware helper here too.
  if (!scammerCashOutDetected(data)) { factors.push({ positive: false, text: r.dfNoExit }); d += 20; }

  // tier stays an English enum ('LOW'|'MEDIUM'|'HIGH') for color logic; the
  // localized label is resolved at display via r.diffLow/diffMedium/diffHigh.
  let tier: DifficultyResult['tier'];
  let explanation: string;
  if (d <= 30) { tier = 'LOW'; explanation = r.diffLowExpl; }
  else if (d <= 65) { tier = 'MEDIUM'; explanation = r.diffMediumExpl; }
  else { tier = 'HIGH'; explanation = r.diffHighExpl; }
  return { tier, explanation, factors };
}

const ReadinessCheck = ({ checked, label }: { checked: boolean; label: string }) => (
  <View style={{ flexDirection: 'row', marginBottom: 3, alignItems: 'flex-start' }}>
    <Text style={{ fontSize: 8, width: 12, color: checked ? green : slate400 }}>{checked ? '✔' : '✖'}</Text>
    <Text style={{ fontSize: 7, color: checked ? slate900 : slate400, flex: 1, lineHeight: 1.3 }}>{label}</Text>
  </View>
);

const RecoveryReadinessPage = ({ data, t }: { data: ReportData; t: ReportTranslations }) => {
  const r = t.readiness;
  const readiness = calculateReadinessScore(data, t);
  const difficulty = calculateInvestigationDifficulty(data, t);
  const tierColor = readiness.score >= 55 ? green : readiness.score >= 35 ? amber : red;
  const diffColor = difficulty.tier === 'LOW' ? green : difficulty.tier === 'MEDIUM' ? amber : red;
  const tierLabel = { Excellent: r.tierExcellent, Strong: r.tierStrong, Moderate: r.tierModerate, Limited: r.tierLimited }[readiness.tier];
  const diffLabel = { LOW: r.diffLow, MEDIUM: r.diffMedium, HIGH: r.diffHigh }[difficulty.tier];

  return (
    <Page size="A4" style={s.page}>
      <Header data={data} t={t} />
      <Text style={s.h2}>{t.sections.recoveryReadiness}</Text>
      <Text style={{ ...s.p, marginBottom: 10 }}>
        {r.subtitle}
      </Text>

      <View style={{ alignItems: 'center', backgroundColor: '#f8fafc', borderRadius: 8, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: '#e2e8f0' }}>
        <Text style={{ fontSize: 30, fontFamily: 'Helvetica-Bold', color: tierColor }}>{readiness.score}%</Text>
        <Text style={{ fontSize: 11, fontFamily: 'Helvetica-Bold', color: tierColor, marginTop: 2 }}>{tierLabel}</Text>
        <Text style={{ fontSize: 8, color: slate600, textAlign: 'center', maxWidth: 380, marginTop: 4, lineHeight: 1.4 }}>{readiness.label}</Text>
      </View>
      <Text style={{ fontSize: 7, color: slate400, textAlign: 'center', marginBottom: 12, lineHeight: 1.4 }}>
        {r.disclaimerNote}
      </Text>

      <View style={{ flexDirection: 'row', gap: 12 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ ...s.h3, marginBottom: 6 }}>{r.evidencePackageIncluded}</Text>
          <View style={{ ...s.card, padding: 8 }}>
            {readiness.evidenceItems.map((it, i) => (
              <ReadinessCheck key={i} checked={it.included} label={it.label} />
            ))}
          </View>
        </View>

        <View style={{ flex: 1 }}>
          <Text style={{ ...s.h3, marginBottom: 6 }}>{r.investigationDifficulty}</Text>
          <View style={{ ...s.card, padding: 8 }}>
            <View style={{ alignSelf: 'flex-start', backgroundColor: diffColor, borderRadius: 4, paddingHorizontal: 10, paddingVertical: 3, marginBottom: 6 }}>
              <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', color: 'white' }}>{diffLabel}</Text>
            </View>
            <Text style={{ fontSize: 7, color: slate600, lineHeight: 1.4, marginBottom: 6 }}>{difficulty.explanation}</Text>
            <Text style={{ fontSize: 7, fontFamily: 'Helvetica-Bold', color: slate900, marginBottom: 2 }}>{r.keyFactors}</Text>
            {difficulty.factors.map((f, i) => (
              <Text key={i} style={{ fontSize: 7, color: f.positive ? green : red, marginBottom: 1, lineHeight: 1.3 }}>
                {f.positive ? '+ ' : '− '}{f.text}
              </Text>
            ))}
          </View>
        </View>
      </View>

      <View style={{ ...s.card, padding: 10, marginTop: 10, backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#bfdbfe' }}>
        <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: blue, marginBottom: 4 }}>{r.howToUseTitle}</Text>
        <Text style={{ fontSize: 8, color: slate900, marginBottom: 2 }}>1. <Text style={{ fontFamily: 'Helvetica-Bold' }}>{r.howToUse1Bold}</Text> {r.howToUse1}</Text>
        <Text style={{ fontSize: 8, color: slate900, marginBottom: 2 }}>2. <Text style={{ fontFamily: 'Helvetica-Bold' }}>{r.howToUse2Bold}</Text> {r.howToUse2}</Text>
        <Text style={{ fontSize: 8, color: slate900, marginBottom: 2 }}>3. <Text style={{ fontFamily: 'Helvetica-Bold' }}>{r.howToUse3Bold}</Text> {r.howToUse3}</Text>
        <Text style={{ fontSize: 8, color: slate900 }}>4. <Text style={{ fontFamily: 'Helvetica-Bold' }}>{r.howToUse4Bold}</Text> {r.howToUse4}</Text>
      </View>

      <Footer data={data} t={t} />
    </Page>
  );
};

/* ═══════════════════════════════════════════════════════════════
   PAGE 4: INVESTIGATION NARRATIVE + EVIDENCE STRENGTH + VICTIM FLOW
   ═══════════════════════════════════════════════════════════════ */
const NarrativePage = ({ data, t }: { data: ReportData; t: ReportTranslations }) => {
  const n = data.narrative;
  const ev = data.evidenceStrength;
  const evColor = ev.score >= 70 ? green : ev.score >= 40 ? amber : red;
  // 2026-05-20: Classify role for badge colouring and copy.
  // - 'isVictim' must NEVER trigger the red "SCAM WALLET" badge or "LIKELY SCAM" labels:
  //   the subject wallet is the victim, the scammer is the counterparty cluster.
  // - 'isDangerous' (transit / aggregator / aggregation) keeps the original red treatment.
  const isVictim = n.walletType === 'victim';
  const isDangerous = n.walletType === 'transit' || n.walletType === 'aggregator' || n.walletType === 'aggregation';
  // Use primary asset (by volume) if it exists and is different from native currency
  const pa = data.primaryAsset;
  const flowIn = pa ? fmtEth(pa.totalIn) : fmtEth(data.ethReceived);
  const flowOut = pa ? fmtEth(pa.totalOut) : fmtEth(data.ethSent);
  const flowSymbol = pa ? pa.symbol : data.nativeCurrency;

  return (
    <Page size="A4" style={s.page}>
      <Header data={data} t={t} />
      <Text style={s.h2}>{t.sections.investigationSummary}</Text>

      {/* Wallet Type Badge */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 10 }}>
        <View style={{ backgroundColor: isVictim ? '#fffbeb' : isDangerous ? '#fef2f2' : n.walletType === 'exchange_deposit' ? '#fffbeb' : '#f0fdf4', borderRadius: 6, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: isVictim ? '#fde68a' : isDangerous ? '#fecaca' : n.walletType === 'exchange_deposit' ? '#fde68a' : '#bbf7d0' }}>
          <Text style={{ fontSize: 11, fontFamily: 'Helvetica-Bold', color: isVictim ? amber : isDangerous ? red : n.walletType === 'exchange_deposit' ? amber : green }}>{n.walletTypeLabel}</Text>
        </View>
        {n.roleConfidence > 0 && (
          <Text style={{ fontSize: 8, color: slate400 }}>{t.investigation.confidence(Math.round(n.roleConfidence * 100))}</Text>
        )}
      </View>

      {/* How we classified this wallet — reasoning bullets.
          2026-05-20: Added for transparency. The classifier is a priority
          cascade (scam-db → KNOWN_ENTITIES → victim heuristic → other roles).
          See lib/generateReport.ts for the rules. */}
      {n.roleReasoning && n.roleReasoning.length > 0 && (
        <View style={{ backgroundColor: '#f8fafc', borderRadius: 6, padding: 10, marginBottom: 10, borderWidth: 1, borderColor: '#e2e8f0' }}>
          <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', color: slate900, marginBottom: 4 }}>{t.investigation.howWeClassified}</Text>
          {n.roleReasoning.slice(0, 5).map((r, i) => (
            <Text key={i} style={{ fontSize: 8, color: slate600, lineHeight: 1.4, paddingLeft: 4, marginBottom: 2 }}>{'•'} {r}</Text>
          ))}
        </View>
      )}

      {/* Key Stats Row */}
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10 }}>
        <View style={{ flex: 1, backgroundColor: '#eff6ff', borderRadius: 6, padding: 8, alignItems: 'center', borderWidth: 1, borderColor: '#bfdbfe' }}>
          <Text style={{ fontSize: 18, fontFamily: 'Helvetica-Bold', color: blue }}>{n.uniqueSenders}</Text>
          <Text style={{ fontSize: 6, color: slate600, marginTop: 2 }}>{t.investigation.uniqueSenders}</Text>
        </View>
        <View style={{ flex: 1, backgroundColor: '#f0fdf4', borderRadius: 6, padding: 8, alignItems: 'center', borderWidth: 1, borderColor: '#bbf7d0' }}>
          <Text style={{ fontSize: 18, fontFamily: 'Helvetica-Bold', color: green }}>{flowIn}</Text>
          <Text style={{ fontSize: 6, color: slate600, marginTop: 2 }}>{t.investigation.assetIn(flowSymbol)}</Text>
        </View>
        <View style={{ flex: 1, backgroundColor: '#fef2f2', borderRadius: 6, padding: 8, alignItems: 'center', borderWidth: 1, borderColor: '#fecaca' }}>
          <Text style={{ fontSize: 18, fontFamily: 'Helvetica-Bold', color: red }}>{flowOut}</Text>
          <Text style={{ fontSize: 6, color: slate600, marginTop: 2 }}>{t.investigation.assetOut(flowSymbol)}</Text>
        </View>
        <View style={{ flex: 1, backgroundColor: n.forwardingPercent >= 70 ? '#fef2f2' : '#f8fafc', borderRadius: 6, padding: 8, alignItems: 'center', borderWidth: 1, borderColor: n.forwardingPercent >= 70 ? '#fecaca' : '#e2e8f0' }}>
          <Text style={{ fontSize: 18, fontFamily: 'Helvetica-Bold', color: n.forwardingPercent >= 70 ? red : slate900 }}>{n.forwardingPercent}%</Text>
          <Text style={{ fontSize: 6, color: slate600, marginTop: 2 }}>{t.investigation.forwarded24h}</Text>
        </View>
      </View>

      {/* Narrative Text */}
      <View style={{ backgroundColor: '#f8fafc', borderRadius: 6, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: '#e2e8f0' }}>
        <Text style={{ ...s.p, fontSize: 9, lineHeight: 1.5, marginBottom: 4 }}>{n.summary}</Text>
        <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: isVictim ? amber : isDangerous ? red : blue, lineHeight: 1.4 }}>{n.conclusion}</Text>
      </View>

      {/* Simplified Fund Flow Diagram — 3 boxes, 1 line */}
      <View style={{ marginBottom: 10 }}>
        <Text style={{ ...s.h3, marginBottom: 6 }}>{t.investigation.fundFlow}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
          <View style={{ alignItems: 'center', backgroundColor: '#eff6ff', borderRadius: 6, padding: 8, flex: 1, borderWidth: 1, borderColor: '#bfdbfe' }}>
            <Text style={{ fontSize: isVictim ? 10 : 14, fontFamily: 'Helvetica-Bold', color: blue, textAlign: 'center' }}>
              {isVictim ? t.investigation.sourceDeposits(n.uniqueSenders) : t.investigation.victimsCount(n.uniqueSenders)}
            </Text>
            <Text style={{ fontSize: 7, color: slate600, marginTop: 2 }}>{flowIn} {flowSymbol}</Text>
            {isVictim && (
              <Text style={{ fontSize: 6, color: slate400, marginTop: 1, textAlign: 'center' }}>{t.investigation.inclCexDeposits}</Text>
            )}
          </View>
          <Text style={{ fontSize: 14, color: slate400, paddingHorizontal: 2 }}>{'\u2192'}</Text>
          <View style={{ alignItems: 'center', backgroundColor: isVictim ? '#fffbeb' : '#fef2f2', borderRadius: 6, padding: 8, flex: 1, borderWidth: 2, borderColor: isVictim ? amber : red }}>
            <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', color: isVictim ? amber : red }}>
              {isVictim ? t.investigation.victimWalletBadge : t.investigation.scamWalletBadge}
            </Text>
            <Text style={{ fontFamily: 'Courier', fontSize: 6, color: slate600, marginTop: 1 }}>{shortAddr(data.walletAddress)}</Text>
          </View>
          <Text style={{ fontSize: 14, color: slate400, paddingHorizontal: 2 }}>{'\u2192'}</Text>
          <View style={{ alignItems: 'center', backgroundColor: isVictim ? '#fef2f2' : n.primaryExitExchange ? '#f0fdf4' : '#fffbeb', borderRadius: 6, padding: 8, flex: 1, borderWidth: 1, borderColor: isVictim ? '#fecaca' : n.primaryExitExchange ? '#bbf7d0' : '#fde68a' }}>
            <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', color: isVictim ? red : n.primaryExitExchange ? green : amber }}>
              {isVictim ? t.investigation.counterpartyWallets(n.uniqueReceivers) : (n.primaryExitExchange || t.investigation.receiversCount(n.uniqueReceivers))}
            </Text>
            <Text style={{ fontSize: 7, color: slate600, marginTop: 2 }}>{flowOut} {flowSymbol}</Text>
            {!isVictim && n.primaryExitExchange && <Text style={{ fontSize: 6, color: green, marginTop: 1 }}>{t.investigation.kycExchange}</Text>}
            {isVictim && <Text style={{ fontSize: 6, color: red, marginTop: 1 }}>{t.investigation.suspectedScammerCluster}</Text>}
          </View>
        </View>
        {/* Victim-context note: this wallet is one of N senders — see user spec on Elayne case */}
        {isVictim && (
          <Text style={{ fontSize: 7, color: slate600, marginTop: 6, paddingHorizontal: 8, lineHeight: 1.4 }}>
            {t.investigation.oneOfManySources(n.uniqueSenders)}
          </Text>
        )}
      </View>

      {/* Victim Guidance Block */}
      <View style={{ backgroundColor: '#eff6ff', borderRadius: 6, padding: 10, marginBottom: 10, borderWidth: 1, borderColor: '#bfdbfe' }}>
        <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: blue, marginBottom: 4 }}>{t.investigation.ifYouSentFunds}</Text>
        <Text style={{ fontSize: 8, color: slate600, lineHeight: 1.5, marginBottom: 3 }}>
          {t.investigation.transactionPath(n.walletTypeLabel)}{n.primaryExitExchange ? t.investigation.cashOutSuffix(n.primaryExitExchange) : ''}
        </Text>
        <Text style={{ fontSize: 8, color: slate900, marginBottom: 1 }}>{t.investigation.toLocateTransaction}</Text>
        <Text style={{ fontSize: 7, color: slate600, paddingLeft: 8 }}>1. {t.investigation.locateStep1}</Text>
        <Text style={{ fontSize: 7, color: slate600, paddingLeft: 8 }}>2. {t.investigation.locateStep2}</Text>
        <Text style={{ fontSize: 7, color: slate600, paddingLeft: 8 }}>3. {t.investigation.locateStep3}</Text>
      </View>

      <View style={s.divider} />

      {/* Evidence Strength + Legal Weight — side by side */}
      <View style={{ flexDirection: 'row', gap: 10 }}>
        {/* Evidence Strength */}
        <View style={{ flex: 1 }}>
          <Text style={{ ...s.h3, marginBottom: 4 }}>{t.investigation.evidenceStrengthTitle}</Text>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 6, alignItems: 'center' }}>
            <View style={{ width: 50, height: 50, borderRadius: 25, borderWidth: 3, borderColor: evColor, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 16, fontFamily: 'Helvetica-Bold', color: evColor }}>{ev.score}%</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', color: evColor, marginBottom: 4 }}>{ev.label}</Text>
              <View style={{ height: 6, backgroundColor: '#e2e8f0', borderRadius: 3 }}>
                <View style={{ height: 6, width: `${ev.score}%`, backgroundColor: evColor, borderRadius: 3 }} />
              </View>
            </View>
          </View>
          <View style={{ ...s.card, padding: 6 }}>
            {ev.factors.map((f, i) => {
              // 2026-05-21: critical factors (e.g. confirmed misdirection)
              // render red + bold; high-severity stays slate but bold.
              const isCritical = f.severity === 'critical';
              const textColor = isCritical ? red : f.met ? slate900 : slate400;
              return (
                <View key={i} style={{ flexDirection: 'row', marginBottom: 2, alignItems: 'center' }}>
                  <Text style={{ fontSize: 8, width: 12, color: isCritical ? red : f.met ? green : slate400 }}>{f.met ? '\u2714' : '\u2716'}</Text>
                  <Text style={{ fontSize: 7, color: textColor, flex: 1, fontFamily: isCritical ? 'Helvetica-Bold' : 'Helvetica' }}>{f.label}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Legal Weight */}
        <View style={{ flex: 1 }}>
          <Text style={{ ...s.h3, marginBottom: 4 }}>{t.investigation.reportSuitabilityTitle}</Text>
          <View style={{ ...s.card, padding: 6 }}>
            {data.legalWeight.map((lw, i) => (
              <View key={i} style={{ flexDirection: 'row', marginBottom: 3, alignItems: 'center' }}>
                <Text style={{ fontSize: 8, width: 12, color: lw.suitable ? green : amber }}>{lw.suitable ? '\u2714' : '\u25CB'}</Text>
                <Text style={{ fontSize: 7, color: lw.suitable ? slate900 : slate400, flex: 1 }}>{lw.label}</Text>
              </View>
            ))}
          </View>
          {/* 2026-05-21 (Phase 2.5 / Part 7): KYC Entry vs Exit — do NOT
              conflate the victim's own funding exchange with a scammer
              cash-out exchange. */}
          {data.exchangeAnalysis && (data.exchangeAnalysis.hasEntryKyc || data.exchangeAnalysis.hasExitKyc) && (
            <View style={{ ...s.card, padding: 6, marginTop: 4 }}>
              <Text style={{ fontSize: 7, fontFamily: 'Helvetica-Bold', color: slate900, marginBottom: 3 }}>{t.investigation.exchangeKycEntryVsExit}</Text>

              {/* Entry */}
              <Text style={{ fontSize: 6.5, fontFamily: 'Helvetica-Bold', color: amber, marginTop: 2 }}>{t.investigation.kycEntryPointLabel}</Text>
              {data.exchangeAnalysis.entryPoints.length > 0 ? (
                data.exchangeAnalysis.entryPoints.slice(0, 3).map((e, i) => (
                  <Text key={i} style={{ fontSize: 6.5, color: slate900 }}>
                    {e.parentEntity}: {t.investigation.interactions(e.interactionCount)}{e.complianceEmail ? ` · ${e.complianceEmail}` : (e.parentEntity && e.parentEntity.includes('Binance') ? ` · ${t.investigation.binanceComplianceChannel}` : '')}
                  </Text>
                ))
              ) : (
                <Text style={{ fontSize: 6.5, color: slate400 }}>{t.investigation.noneDetected}</Text>
              )}
              <Text style={{ fontSize: 6, color: slate400, marginTop: 1, lineHeight: 1.3 }}>
                {t.investigation.identifiesVictimAccount}
              </Text>

              {/* Exit */}
              <Text style={{ fontSize: 6.5, fontFamily: 'Helvetica-Bold', color: red, marginTop: 4 }}>{t.investigation.kycExitPointLabel}</Text>
              {data.exchangeAnalysis.exitPoints.length > 0 ? (
                data.exchangeAnalysis.exitPoints.slice(0, 3).map((e, i) => (
                  <Text key={i} style={{ fontSize: 6.5, color: slate900 }}>
                    {e.parentEntity}: {t.investigation.interactions(e.interactionCount)}{e.complianceEmail ? ` · ${e.complianceEmail}` : (e.parentEntity && e.parentEntity.includes('Binance') ? ` · ${t.investigation.binanceComplianceChannel}` : '')}
                  </Text>
                ))
              ) : (
                <Text style={{ fontSize: 6.5, color: slate600, lineHeight: 1.3 }}>
                  {t.investigation.exitNotDetected}
                </Text>
              )}
            </View>
          )}
        </View>
      </View>

      <Footer data={data} t={t} />
    </Page>
  );
};

/* ═══════════════════════════════════════════════════════════════
   PAGE 4: ASSET SUMMARY + ACTIVITY TIMELINE
   ═══════════════════════════════════════════════════════════════ */
const AssetTimelinePage = ({ data, t }: { data: ReportData; t: ReportTranslations }) => {
  const assets = data.assetSummary;
  const timeline = data.timeline;
  const as = t.assetSummary;
  const tl = t.timeline;
  const sname = t.attackTechnique.scriptName;

  return (
    <Page size="A4" style={s.page}>
      <Header data={data} t={t} />

      {/* ASSET SUMMARY */}
      <Text style={s.h2}>{t.sections.assetSummary}</Text>
      {assets && assets.realAssets.length > 0 && (
        <View style={{ ...s.card, marginBottom: 12 }}>
          <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: green, marginBottom: 6 }}>{as.realAssetsHeader}</Text>
          <View style={s.tableHeader}>
            <Text style={{ ...s.th, width: '25%' }}>{as.colToken}</Text>
            <Text style={{ ...s.th, width: '25%' }}>{as.colTotalIn}</Text>
            <Text style={{ ...s.th, width: '25%' }}>{as.colTotalOut}</Text>
            <Text style={{ ...s.th, width: '25%' }}>{as.colNet}</Text>
          </View>
          {assets.realAssets.slice(0, 10).map((a, i) => (
            <View key={i} style={i % 2 === 0 ? s.tableRow : s.tableRowAlt}>
              <Text style={{ ...s.td, width: '25%', fontFamily: 'Helvetica-Bold' }}>{a.symbol}</Text>
              <Text style={{ ...s.td, width: '25%', color: green }}>{fmtEth(a.totalIn)}</Text>
              <Text style={{ ...s.td, width: '25%', color: red }}>{fmtEth(a.totalOut)}</Text>
              <Text style={{ ...s.td, width: '25%' }}>{fmtEth(a.totalIn - a.totalOut)}</Text>
            </View>
          ))}
          {/* Phase 3.1 Stage 11 (A1): net flow != economic loss disambiguation. */}
          <Text style={{ fontSize: 6.5, color: slate600, fontStyle: 'italic', marginTop: 5, lineHeight: 1.4 }}>
            {as.netFlowClarification}
          </Text>
        </View>
      )}

      {assets && assets.spamCount > 0 && (
        <View style={{ backgroundColor: '#fffbeb', borderRadius: 6, padding: 10, marginBottom: 12, borderWidth: 1, borderColor: '#fde68a' }}>
          <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: amber, marginBottom: 4 }}>
            {as.spamFiltered(assets.spamCount)}
          </Text>
          <Text style={{ fontSize: 7, color: slate600 }}>
            {assets.spamTokens.slice(0, 8).map(st => st.symbol).join(', ')}{assets.spamCount > 8 ? '...' : ''}
          </Text>
          <Text style={{ fontSize: 7, color: slate400, marginTop: 3 }}>
            {as.spamNote}
          </Text>
        </View>
      )}

      {/* 2026-05-21 (Phase 2 / 2.5): Unicode-spoofing evidence — kept SEPARATE
          from spam. Spoof symbols render in Noto Sans Lisu where available;
          codepoints are ALWAYS shown so evidence survives any font failure. */}
      {assets && assets.spoofTokens && assets.spoofTokens.length > 0 && (
        <View style={{ backgroundColor: '#fef2f2', borderRadius: 6, padding: 10, marginBottom: 12, borderWidth: 1, borderColor: '#fecaca' }}>
          <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: red, marginBottom: 4 }}>
            {as.unicodeEvidenceHeader(assets.spoofTokens.length)}
          </Text>
          {assets.spoofTokens.slice(0, 6).map((tok, i) => {
            const display = tok.symbolDisplay || tok.symbol;
            const composed = display !== tok.symbol;
            return (
              <View key={i} style={{ marginBottom: 3 }}>
                <Text style={{ fontSize: 7, color: slate900 }}>
                  <Text style={{ fontFamily: fontForScript(tok.scriptCategory) }}>{display}</Text>
                  {as.mimickingSuffix(tok.mimicsLegitimate, sname(tok.scriptCategory), tok.count)}
                </Text>
                <Text style={{ ...s.mono, fontSize: 6, color: slate600 }}>
                  {composed ? as.originalLabel : as.codepointsLabel}{getCodepoints(tok.symbol)}
                </Text>
                {composed && (
                  <Text style={{ ...s.mono, fontSize: 6, color: slate600 }}>{as.displayLabel}{getCodepoints(display)}</Text>
                )}
              </View>
            );
          })}
          <Text style={{ fontSize: 7, color: slate400, marginTop: 3 }}>
            {as.spoofTokensNote}
          </Text>
        </View>
      )}

      {/* 2026-05-21 (Phase 2.5 / Part 4): footnote — apparent net balance
          understates the true loss when funds went to poisoning spoofs.
          2026-05-22 (Phase 2.7.1 / Issue #6): report REAL economic loss
          separately from worthless spoof-token units so this footnote agrees
          with the Attack Technique Analysis page (was a mixed-unit total). */}
      {(() => {
        const apz = data.attackTechniques?.addressPoisoning;
        if (!apz) return null;
        const realStr = fmtTokenRecord(apz.totalRealEconomicLoss);
        const spoofStr = fmtTokenRecord(apz.totalSpoofUnitsRouted);
        if (!realStr && !spoofStr) return null;
        return (
          <View style={{ backgroundColor: '#f8fafc', borderRadius: 6, padding: 8, marginBottom: 12, borderLeftWidth: 3, borderLeftColor: amber }}>
            <Text style={{ fontSize: 7, color: slate600, lineHeight: 1.4 }}>
              {as.footnoteNote}{realStr ? as.footnoteRealMisdirected(realStr) : ''}{spoofStr ? as.footnoteSpoofUnits(spoofStr) : ''}{as.footnoteTail}
            </Text>
          </View>
        );
      })()}

      <View style={s.sectionDivider} />

      {/* ACTIVITY TIMELINE */}
      <Text style={s.h2}>{t.sections.activityTimeline}</Text>
      {timeline && timeline.length > 0 ? (
        <View style={{ paddingLeft: 8 }}>
          {(() => {
            // 2026-05-21 (Phase 2.5 Fix 3): set of secondary-spoof addresses
            // that actually received victim funds — used to flag misdirection
            // events distinctly from legitimate sends.
            const spoofAddrs = new Set<string>();
            for (const c of data.attackTechniques?.addressPoisoning?.campaigns || []) {
              for (const sp of c.secondarySpoofs) {
                if (sp.totalReceivedFromSubject > 0) spoofAddrs.add(sp.address.toLowerCase());
              }
            }
            return timeline.map((event, i) => {
              const isHighlight = event.highlight;
              const isMisdirection = !!event.counterparty && spoofAddrs.has(event.counterparty.toLowerCase());
              const typeColor = isMisdirection ? amber
                : event.type === 'MAJOR_OUTFLOW' ? red
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
                      {isMisdirection ? (
                        <Text style={{ fontSize: 6, color: 'white', fontFamily: 'Helvetica-Bold', backgroundColor: amber, paddingHorizontal: 4, paddingVertical: 1, borderRadius: 2 }}>{tl.misdirectionBadge}</Text>
                      ) : isHighlight && (
                        <Text style={{ fontSize: 6, color: red, fontFamily: 'Helvetica-Bold', backgroundColor: '#fef2f2', paddingHorizontal: 4, paddingVertical: 1, borderRadius: 2 }}>{tl.keyEventBadge}</Text>
                      )}
                    </View>
                    <Text style={{ fontSize: 8, color: slate600, marginTop: 1 }}>{event.description}</Text>
                    {isMisdirection && (
                      <Text style={{ fontSize: 6.5, color: amber, marginTop: 0.5, fontStyle: 'italic' }}>
                        {tl.sentToSpoofNote}
                      </Text>
                    )}
                  </View>
                </View>
              );
            });
          })()}

          {/* Active period */}
          {data.firstActivity !== 'N/A' && data.lastActivity !== 'N/A' && (
            <View style={{ backgroundColor: '#f1f5f9', borderRadius: 4, padding: 8, marginTop: 8 }}>
              <Text style={{ fontSize: 8, color: slate600 }}>
                {tl.totalActivePeriod(data.firstActivity, data.lastActivity)}
                {data.inactiveDays > 0 ? tl.inactiveSuffix(data.inactiveDays) : ''}
              </Text>
            </View>
          )}
        </View>
      ) : (
        <View style={s.card}>
          <Text style={s.p}>{tl.noTimeline}</Text>
        </View>
      )}

      <Footer data={data} t={t} />
    </Page>
  );
};

/* ═══════════════════════════════════════════════════════════════
   PAGE 5: BEHAVIORAL PATTERN ANALYSIS
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

const PatternPage = ({ data, t }: { data: ReportData; t: ReportTranslations }) => {
  const pa = data.patternAnalysis;
  // 2026-05-20: When the subject wallet is itself the victim, we must NOT
  // label this wallet as "LIKELY SCAM" / "CONFIRMED SCAM" — the detected
  // patterns describe the counterparty cluster's behaviour, not the subject.
  // Show "VICTIM PATTERN DETECTED" with the subject framed as the harmed party.
  const bh = t.behavioral;
  const isVictim = data.narrative.walletType === 'victim';
  const effectiveRisk = isVictim ? 'VICTIM_PATTERN' : (pa?.overallRisk || 'CLEAN');
  const effectiveLabel = isVictim ? bh.victimPatternBadge : bh.riskLabel[pa?.overallRisk || 'CLEAN'];
  const effectiveColor = isVictim ? amber : overallRiskColor(pa?.overallRisk || 'CLEAN');
  const bannerBg = isVictim ? '#fffbeb' : pa?.overallRisk === 'CLEAN' ? '#f0fdf4' : pa?.overallRisk === 'SUSPICIOUS' ? '#fffbeb' : '#fef2f2';
  const bannerBorder = isVictim ? '#fde68a' : pa?.overallRisk === 'CLEAN' ? '#bbf7d0' : pa?.overallRisk === 'SUSPICIOUS' ? '#fde68a' : '#fecaca';

  return (
    <Page size="A4" style={s.page}>
      <Header data={data} t={t} />
      <Text style={s.h2}>{t.sections.behavioralPatterns}</Text>
      <Text style={{ ...s.p, marginBottom: 12 }}>
        {isVictim ? bh.introVictim : bh.introNonVictim}
      </Text>

      {/* Overall Assessment */}
      {pa && (
        <View style={{
          backgroundColor: bannerBg,
          borderRadius: 8,
          padding: 14,
          marginBottom: 16,
          borderWidth: 1,
          borderColor: bannerBorder,
          alignItems: 'center',
        }}>
          <Text style={{ fontSize: 8, color: slate400, letterSpacing: 1, marginBottom: 6 }}>{bh.overallAssessment}</Text>
          <Text style={{
            ...s.badge,
            fontSize: 12,
            backgroundColor: effectiveColor,
            color: 'white',
            paddingHorizontal: 16,
            paddingVertical: 5,
          }}>
            {effectiveLabel}
          </Text>
          <Text style={{ fontSize: 8, color: slate600, marginTop: 8, textAlign: 'center', maxWidth: 400, lineHeight: 1.4 }}>
            {isVictim ? bh.victimAssessmentText : pa.interpretation}
          </Text>
        </View>
      )}

      {/* Detected Patterns */}
      {pa && pa.patterns.length > 0 ? (
        <View>
          <Text style={{ ...s.h3, marginBottom: 8 }}>{bh.detectedPatterns(pa.patterns.length)}</Text>
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
                    <Text style={{ fontSize: 7, color: 'white', fontFamily: 'Helvetica-Bold' }}>{bh.severity[pattern.severity] ?? pattern.severity}</Text>
                  </View>
                  <Text style={{ fontSize: 8, color: slate600 }}>{bh.confidence(pattern.confidence)}</Text>
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
          <Text style={{ fontSize: 11, fontFamily: 'Helvetica-Bold', color: green, marginBottom: 6 }}>{bh.noPatternsTitle}</Text>
          <Text style={{ fontSize: 9, color: slate600, textAlign: 'center', maxWidth: 350, lineHeight: 1.4 }}>
            {bh.noPatternsBody}
          </Text>
        </View>
      )}

      {/* Methodology note */}
      <View style={{ marginTop: 'auto', paddingTop: 12 }}>
        <Text style={{ fontSize: 7, color: slate400, lineHeight: 1.4 }}>
          {bh.methodologyFootnote}
        </Text>
      </View>

      <Footer data={data} t={t} />
    </Page>
  );
};

/* ═══════════════════════════════════════════════════════════════
   PAGE 6: WALLET ANALYTICS
   ═══════════════════════════════════════════════════════════════ */
const AnalyticsPage = ({ data, t }: { data: ReportData; t: ReportTranslations }) => {
  // Phase 2.7 (Issue #2): surface the dominant stablecoin's volume alongside
  // native ETH so the substantive money movement isn't hidden behind gas-dust.
  const STABLE = ['USDT', 'USDC', 'DAI', 'BUSD', 'TUSD', 'USDP', 'PYUSD'];
  const stable = (data.assetSummary?.realAssets || [])
    .filter((a) => STABLE.includes(a.symbol) && (a.totalIn + a.totalOut) > 0)
    .sort((a, b) => (b.totalIn + b.totalOut) - (a.totalIn + a.totalOut))[0];
  const an = t.analytics;
  const nativeSym = data.nativeCurrency || 'ETH';
  return (
  <Page size="A4" style={s.page}>
    <Header data={data} t={t} />
    <Text style={s.h2}>{t.sections.walletAnalytics}</Text>

    {stable && (
      <View style={{ ...s.row, marginBottom: 12 }}>
        <View style={{ ...s.card, ...s.col }}>
          <Text style={s.label}>{an.received(stable.symbol)}</Text>
          <Text style={{ ...s.value, color: green }}>{fmtEth(stable.totalIn)} {stable.symbol}</Text>
        </View>
        <View style={{ ...s.card, ...s.col }}>
          <Text style={s.label}>{an.sent(stable.symbol)}</Text>
          <Text style={{ ...s.value, color: red }}>{fmtEth(stable.totalOut)} {stable.symbol}</Text>
        </View>
        <View style={{ ...s.card, ...s.col }}>
          <Text style={s.label}>{an.netFlow(stable.symbol)}</Text>
          <Text style={s.value}>{fmtEth(stable.totalIn - stable.totalOut)} {stable.symbol}</Text>
        </View>
      </View>
    )}

    <View style={{ ...s.row, marginBottom: 12 }}>
      <View style={{ ...s.card, ...s.col }}>
        <Text style={s.label}>{an.received(nativeSym)}</Text>
        <Text style={{ ...s.value, color: green }}>{fmtEth(data.ethReceived)} {nativeSym}</Text>
      </View>
      <View style={{ ...s.card, ...s.col }}>
        <Text style={s.label}>{an.sent(nativeSym)}</Text>
        <Text style={{ ...s.value, color: red }}>{fmtEth(data.ethSent)} {nativeSym}</Text>
      </View>
      <View style={{ ...s.card, ...s.col }}>
        <Text style={s.label}>{an.netFlow(nativeSym)}</Text>
        <Text style={s.value}>{fmtEth(data.ethReceived - data.ethSent)} {nativeSym}</Text>
      </View>
    </View>

    <View style={s.divider} />

    <View style={{ ...s.row, marginBottom: 12 }}>
      <View style={{ ...s.card, ...s.col }}>
        <Text style={s.label}>{an.transactions}</Text>
        <Text style={s.value}>{data.transactionCount.toLocaleString('en-US')}</Text>
      </View>
      <View style={{ ...s.card, ...s.col }}>
        <Text style={s.label}>{an.activePeriod}</Text>
        <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold' }}>{data.firstActivity} — {data.lastActivity}</Text>
      </View>
      <View style={{ ...s.card, ...s.col }}>
        <Text style={s.label}>{an.uniqueTokens}</Text>
        <Text style={s.value}>{data.uniqueTokens.length}</Text>
      </View>
    </View>

    {data.inactiveDays > 365 && (
      <View style={{ backgroundColor: '#fffbeb', borderRadius: 6, padding: 10, marginBottom: 8, borderWidth: 1, borderColor: '#fde68a' }}>
        <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: amber, marginBottom: 4 }}>{an.inactiveTitle(data.inactiveDays)}</Text>
        <Text style={{ fontSize: 8, color: slate600 }}>{an.inactiveBody(data.lastActivity)}</Text>
      </View>
    )}

    <View style={s.sectionDivider} />

    <Text style={s.h3}>{an.topCounterparties}</Text>
    <View style={s.table}>
      <View style={s.tableHeader}>
        <Text style={{ ...s.th, width: '40%' }}>{an.colAddress}</Text>
        <Text style={{ ...s.th, width: '20%' }}>{an.colEntity}</Text>
        <Text style={{ ...s.th, width: '20%' }}>{an.colInteractions}</Text>
        <Text style={{ ...s.th, width: '20%' }}>{an.colVolume(data.counterpartyVolumeSymbol || nativeSym)}</Text>
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

    <Footer data={data} t={t} />
  </Page>
  );
};

/* ═══════════════════════════════════════════════════════════════
   PAGE 7: ENTITY IDENTIFICATION + EXIT POINT ANALYSIS
   ═══════════════════════════════════════════════════════════════ */
const recoveryDiffColor = (d: string) => {
  if (d.startsWith('LOW')) return green;
  if (d.startsWith('MEDIUM')) return amber;
  if (d.startsWith('HIGH')) return red;
  return slate600;
};

/* ═══════════════════════════════════════════════════════════════
   PAGE: ADDRESS VERIFICATION & EXTERNAL INTELLIGENCE
   2026-05-20 (Phase 1): cross-reference counterparty addresses with
   Chainabuse, GoPlus, OFAC SDN, KNOWN_ENTITIES, KNOWN_PHISHING and the
   LedgerHound Scam Database. Capped at 15 entries to keep the section
   within 1-2 pages. Hidden when federation produced no labels at all.
   ═══════════════════════════════════════════════════════════════ */
const SOURCE_LABELS: Record<string, string> = {
  etherscan_manual: 'ETHERSCAN',
  chainabuse: 'CHAINABUSE',
  goplus: 'GOPLUS',
  ofac: 'OFAC SDN',
  ledgerhound_scam_db: 'LEDGERHOUND DB',
  cex_whitelist: 'KYC EXCHANGE',
  known_entity: 'KNOWN ENTITY',
  known_phishing: 'ETHERSCAN',
};

function severityRankFor(r: { hasSanctionsFlag: boolean; hasPhishingFlag: boolean; hasScamFlag: boolean; isKycExchange: boolean; labels: { length: number } }): number {
  // Higher = more important to surface. Sanctions > phishing > scam > CEX > other > clean.
  if (r.hasSanctionsFlag) return 4;
  if (r.hasPhishingFlag) return 3;
  if (r.hasScamFlag) return 2;
  if (r.isKycExchange) return 1;
  if (r.labels.length > 0) return 0;
  return -1;
}

const AddressLabelsPage = ({ data, t }: { data: ReportData; t: ReportTranslations }) => {
  if (!data.addressLabels || data.addressLabels.length === 0) return null;

  // Sort: severity DESC, then by highestConfidence DESC.
  const sorted = [...data.addressLabels].sort((a, b) => {
    const sa = severityRankFor(a);
    const sb = severityRankFor(b);
    if (sa !== sb) return sb - sa;
    return b.highestConfidence - a.highestConfidence;
  });

  const MAX_ENTRIES = 15;
  const shown = sorted.slice(0, MAX_ENTRIES);
  const remaining = Math.max(0, sorted.length - MAX_ENTRIES);
  const av = t.addressVerification;

  return (
    <Page size="A4" style={s.page}>
      <Header data={data} t={t} />
      <Text style={s.h2}>{t.sections.addressVerification}</Text>
      <Text style={{ ...s.p, marginBottom: 10 }}>
        {av.intro}
      </Text>

      {data.externalIntelligenceDegraded && (
        <View style={{ backgroundColor: '#fffbeb', borderRadius: 6, padding: 8, marginBottom: 10, borderWidth: 1, borderColor: '#fde68a' }}>
          <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', color: amber, marginBottom: 2 }}>{av.degradedTitle}</Text>
          <Text style={{ fontSize: 7, color: slate600, lineHeight: 1.4 }}>
            {av.degradedBody}
          </Text>
        </View>
      )}

      {shown.map((r, i) => {
        const sev = severityRankFor(r);
        const borderColor = sev >= 3 ? red : sev === 2 ? amber : sev === 1 ? green : slate400;
        const bg = sev >= 3 ? '#fef2f2' : sev === 2 ? '#fffbeb' : sev === 1 ? '#f0fdf4' : '#f8fafc';
        const symbol = sev >= 3 ? '!!' : sev === 2 ? '!' : sev === 1 ? '✓' : '·';
        return (
          <View key={i} style={{ backgroundColor: bg, borderRadius: 4, padding: 6, marginBottom: 5, borderLeftWidth: 3, borderLeftColor: borderColor }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 }}>
              <Text style={{ ...s.mono, fontSize: 7, color: slate900 }}>{symbol} {shortAddr(r.address)}</Text>
              <Text style={{ fontSize: 6, color: slate400 }}>{av.sourcesSuffix(r.labels.length)}</Text>
            </View>
            {r.labels.length === 0 ? (
              <Text style={{ fontSize: 7, color: slate400, fontStyle: 'italic' }}>{av.noMatches}</Text>
            ) : (
              r.labels.slice(0, 4).map((l, j) => (
                <Text key={j} style={{ fontSize: 7, color: slate600, marginBottom: 1, lineHeight: 1.3 }}>
                  [{av.sourceLabel(l.source)}] {l.tag}
                  {l.reportCount ? av.reportsSuffix(l.reportCount) : ''}
                  {l.confidence < 1 ? av.confLabel(Math.round(l.confidence * 100)) : ''}
                </Text>
              ))
            )}
          </View>
        );
      })}

      {remaining > 0 && (
        <Text style={{ fontSize: 7, color: slate400, marginTop: 4, fontStyle: 'italic' }}>
          {av.remaining(remaining)}
        </Text>
      )}

      <View style={{ marginTop: 'auto', paddingTop: 10 }}>
        <Text style={{ fontSize: 6, color: slate400, lineHeight: 1.4 }}>
          {av.methodology}
        </Text>
      </View>

      <Footer data={data} t={t} />
    </Page>
  );
};

/* ═══════════════════════════════════════════════════════════════
   PAGE: ATTACK TECHNIQUE ANALYSIS (Phase 2)
   Address Poisoning + Unicode Spoofing deep-dive. Rendered only when at
   least one technique is detected. Placed after Address Verification so the
   evidence sections read as escalating detail. 2026-05-21.
   ═══════════════════════════════════════════════════════════════ */
const AttackStat = ({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) => (
  <View style={{ flex: 1, backgroundColor: highlight ? '#fef2f2' : '#f8fafc', borderRadius: 6, padding: 8, alignItems: 'center', borderWidth: 1, borderColor: highlight ? '#fecaca' : '#e2e8f0' }}>
    <Text style={{ fontSize: 14, fontFamily: 'Helvetica-Bold', color: highlight ? red : slate900 }}>{value}</Text>
    <Text style={{ fontSize: 6, color: slate600, marginTop: 2, textAlign: 'center' }}>{label}</Text>
  </View>
);

const AttackTechniqueAnalysisPage = ({ data, t }: { data: ReportData; t: ReportTranslations }) => {
  const ap = data.attackTechniques?.addressPoisoning;
  const us = data.attackTechniques?.unicodeSpoofing;
  const ta = t.attackTechnique;
  // Skip page entirely when nothing detected (no "all clear" placeholder).
  if ((!ap || !ap.detected) && (!us || !us.detected)) return null;

  return (
    <Page size="A4" style={s.page}>
      <Header data={data} t={t} />
      <Text style={s.h2}>{t.sections.attackTechnique}</Text>
      <Text style={{ ...s.p, marginBottom: 10 }}>
        {ta.intro}
      </Text>

      {/* ─── Address Poisoning Campaign (Phase 2.5 model) ─── */}
      {ap && ap.detected && ap.campaigns.map((campaign, ci) => {
        // Phase 2.7: present real economic loss separately from worthless
        // spoof-token units so the figures are legally defensible.
        const mc = campaign.mainCollector;
        const realLossStr = fmtTokenRecord(campaign.totalMisdirectedReal);
        const spoofUnitsStr = fmtTokenRecord(campaign.totalMisdirectedSpoof);
        const unknownStr = fmtTokenRecord(campaign.totalMisdirectedUnknown);
        const mcDesc = mc.tokenCategory === 'spoof'
          ? ta.mainCollectorSpoofAmount(fmtEth(mc.totalReceivedFromSubject), mc.spoofMimicsToken || '')
          : ta.mainCollectorRealAmount(fmtEth(mc.totalReceivedFromSubject), mc.totalReceivedToken);
        return (
        <View key={ci} style={{ marginBottom: 14 }}>
          <Text style={{ ...s.h3, color: red, marginBottom: 4 }}>{ta.poisoningHeader}</Text>
          <Text style={{ fontSize: 8, color: slate600, lineHeight: 1.5, marginBottom: 8 }}>
            {ta.poisoningIntro}
          </Text>

          {/* Cluster overview */}
          <View style={{ ...s.card, padding: 8, marginBottom: 8 }}>
            <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', color: slate900, marginBottom: 4 }}>{ta.vanityCluster(campaign.vanityPattern)}</Text>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              <AttackStat label={ta.statClusterAddresses} value={String(campaign.totalClusterAddresses)} />
              <AttackStat label={ta.statRealMisdirections} value={String(campaign.successfulMisdirections)} highlight={campaign.successfulMisdirections > 0} />
              <AttackStat label={ta.statSecondarySpoofs} value={String(campaign.secondarySpoofs.length)} />
            </View>
            {realLossStr ? (
              <Text style={{ fontSize: 7, color: red, marginTop: 4 }}>{ta.realFundsMisdirected(realLossStr)}</Text>
            ) : null}
            {spoofUnitsStr ? (
              <Text style={{ fontSize: 7, color: amber, marginTop: 2 }}>{ta.worthlessSpoofUnits(spoofUnitsStr)}</Text>
            ) : null}
            {unknownStr ? (
              <Text style={{ fontSize: 6.5, color: slate400, marginTop: 2 }}>{ta.unclassifiedUnits(unknownStr)}</Text>
            ) : null}
            {campaign.hasFakePhishingTag && (
              <Text style={{ fontSize: 7, color: red, marginTop: 4 }}>
                {ta.fakePhishingTagged(campaign.fakePhishingAddresses.length)}
              </Text>
            )}
          </View>

          {/* Main collector */}
          <View style={{ backgroundColor: '#fef2f2', borderRadius: 6, padding: 8, marginBottom: 8, borderWidth: 1, borderColor: '#fecaca' }}>
            <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', color: red, marginBottom: 2 }}>{ta.mainCollectorTitle}</Text>
            <Text style={{ ...s.mono, fontSize: 6.5, color: slate900 }}>{mc.address}</Text>
            <Text style={{ fontSize: 7, color: slate600, marginTop: 2 }}>
              {ta.mainCollectorDesc(mcDesc, mc.transactionCount)}
            </Text>
            {mc.etherscanFakePhishingTag && (
              <Text style={{ fontSize: 6.5, color: red, marginTop: 1 }}>{ta.etherscan(mc.etherscanFakePhishingTag)}</Text>
            )}
            {/* Phase 3.1 Stage 7 (A4): clarify senders-vs-transactions mismatch. */}
            <Text style={{ fontSize: 6, color: slate400, fontStyle: 'italic', marginTop: 3 }}>{ta.mainCollectorSendersNote}</Text>
          </View>

          {/* Secondary spoofs */}
          {campaign.secondarySpoofs.length > 0 && (
            <View>
              <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', color: slate900, marginBottom: 2 }}>{ta.secondarySpoofsTitle}</Text>
              <Text style={{ fontSize: 7, color: slate600, lineHeight: 1.4, marginBottom: 4 }}>
                {ta.secondarySpoofsIntro}
              </Text>
              {campaign.secondarySpoofs.slice(0, 10).map((spoof, si) => {
                const realSlices = spoof.tokenBreakdown.filter((b) => b.category === 'real' && b.value > 0);
                const spoofSlices = spoof.tokenBreakdown.filter((b) => b.category === 'spoof' && b.value > 0);
                const unknownSlices = spoof.tokenBreakdown.filter((b) => b.category === 'unknown' && b.value > 0);
                const hasReal = realSlices.length > 0;
                const anyValue = spoof.tokenBreakdown.some((b) => b.value > 0);
                const borderColor = hasReal ? red : (anyValue ? amber : slate400);
                return (
                  <View key={si} style={{ ...s.card, padding: 5, marginBottom: 4, borderLeftWidth: 2, borderLeftColor: borderColor }}>
                    <Text style={{ ...s.mono, fontSize: 6, color: hasReal ? red : slate600 }}>✖ {spoof.address}</Text>
                    {hasReal && (
                      <Text style={{ fontSize: 6.5, color: red, marginTop: 1 }}>
                        {ta.misdirectionConfirmedReal(realSlices.map((b) => `${fmtEth(b.value)} ${b.symbol}`).join(', '), spoof.transactionCount)}
                      </Text>
                    )}
                    {spoofSlices.map((b, bi) => (
                      <Text key={`s${bi}`} style={{ fontSize: 6.5, color: amber, marginTop: 1 }}>
                        {ta.spoofTokenRouted(fmtEth(b.value), b.mimics || '', b.scriptCategory ? ta.scriptName(b.scriptCategory) : undefined, b.codepoints, b.contract)}
                      </Text>
                    ))}
                    {unknownSlices.map((b, bi) => (
                      <Text key={`u${bi}`} style={{ fontSize: 6.5, color: slate600, marginTop: 1 }}>
                        {ta.unclassifiedTokenUnits(fmtEth(b.value), b.symbol)}
                      </Text>
                    ))}
                    {!anyValue && (
                      <Text style={{ fontSize: 6.5, color: slate900, marginTop: 1 }}>
                        {ta.noFundsReceived(spoof.receivedDustFromCluster)}
                      </Text>
                    )}
                    {(() => {
                      const dp = firstDifferingCharParts(mc.address, spoof.address);
                      return dp ? (
                        <Text style={{ fontSize: 6, color: slate400, marginTop: 0.5 }}>
                          {ta.differsFromMainCollector(dp.position, dp.a, dp.b)}
                        </Text>
                      ) : null;
                    })()}
                    {spoof.etherscanFakePhishingTag && (
                      <Text style={{ fontSize: 6, color: red }}>{ta.etherscan(spoof.etherscanFakePhishingTag)}</Text>
                    )}
                  </View>
                );
              })}
              {campaign.secondarySpoofs.length > 10 && (
                <Text style={{ fontSize: 6, color: slate400 }}>{ta.additionalSpoofs(campaign.secondarySpoofs.length - 10)}</Text>
              )}
            </View>
          )}

          {/* Forensic interpretation */}
          <View style={{ ...s.card, padding: 8, marginTop: 6 }}>
            <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', color: slate900, marginBottom: 2 }}>{ta.forensicInterpretationTitle}</Text>
            <Text style={{ fontSize: 7, color: slate600, lineHeight: 1.4 }}>
              {ta.forensicInterpretationBody(campaign.vanityPattern, campaign.totalClusterAddresses)}
            </Text>
            {/* Phase 2.6: methodology footnote so the ~1-in-4.3-billion figure
                is defensible if challenged by opposing counsel. */}
            <Text style={{ fontSize: 6.5, color: slate400, fontStyle: 'italic', lineHeight: 1.4, marginTop: 4 }}>
              {ta.methodologyFootnote}
            </Text>
            {spoofUnitsStr ? (
              <Text style={{ fontSize: 6.5, color: slate600, fontStyle: 'italic', lineHeight: 1.4, marginTop: 4 }}>
                {ta.forensicNote}
              </Text>
            ) : null}
          </View>
        </View>
        );
      })}

      {/* ─── Unicode Spoofing ─── */}
      {us && us.detected && (
        <View style={{ marginBottom: 10 }}>
          <Text style={{ ...s.h3, color: red, marginBottom: 4 }}>{ta.unicodeHeader}</Text>
          <Text style={{ fontSize: 8, color: slate600, lineHeight: 1.5, marginBottom: 8 }}>
            {ta.unicodeIntroPart1}<Text style={{ fontFamily: LISU_FONT_FAMILY }}>{'ꓴꓢꓓꓔ'}</Text>{ta.unicodeIntroPart2}
          </Text>

          <View style={{ flexDirection: 'row', gap: 6, marginBottom: 8 }}>
            <AttackStat label={ta.statUniqueFakeTokens} value={String(us.uniqueSpoofSymbols)} highlight />
            <AttackStat label={ta.statSpoofTransfers} value={String(us.totalSpoofTokenTransfers)} />
          </View>

          {us.evidence.slice(0, 6).map((e, i) => {
            const display = e.fakeSymbolDisplay || e.fakeSymbol;
            const composed = display !== e.fakeSymbol;
            return (
              <View key={i} style={{ ...s.card, padding: 6, marginBottom: 5, borderLeftWidth: 3, borderLeftColor: red }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                  <Text style={{ fontFamily: fontForScript(e.scriptCategory), fontSize: 11, color: slate900 }}>{display}</Text>
                  <Text style={{ fontSize: 8, color: slate600, marginLeft: 6 }}>{ta.masqueradingAs}</Text>
                  <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', color: red }}>{e.mimicsLegitimate}</Text>
                </View>
                <Text style={{ ...s.mono, fontSize: 6.5, color: slate600 }}>
                  {composed ? ta.originalUnicodeLabel : ta.unicodeLabel}{e.fakeSymbolCodepoints}
                </Text>
                {composed && (
                  <Text style={{ ...s.mono, fontSize: 6.5, color: slate600 }}>{ta.displayNfcLabel}{e.fakeSymbolDisplayCodepoints}</Text>
                )}
                <Text style={{ fontSize: 6.5, color: slate600 }}>{ta.scriptLine(ta.scriptName(e.scriptCategory), e.occurrences, e.sourceAddresses.length)}</Text>
                {composed && (
                  <Text style={{ fontSize: 6, color: slate400, marginTop: 1, fontStyle: 'italic' }}>
                    {ta.combiningMarksNote}
                  </Text>
                )}
                {e.transactionExamples.length > 0 && (
                  <Text style={{ fontSize: 6, color: slate400, marginTop: 1 }}>
                    {ta.exampleLine((e.transactionExamples[0].timestamp || '').split('T')[0], shortAddr(e.transactionExamples[0].from))}
                  </Text>
                )}
              </View>
            );
          })}
        </View>
      )}

      <View style={{ marginTop: 'auto', paddingTop: 8 }}>
        <Text style={{ fontSize: 6, color: slate400, lineHeight: 1.4 }}>
          {ta.bottomMethodology}
        </Text>
      </View>

      <Footer data={data} t={t} />
    </Page>
  );
};

const EntitiesExitPage = ({ data, t }: { data: ReportData; t: ReportTranslations }) => {
  const exits = data.exitPointAnalysis;
  const ei = t.entityId;

  return (
    <Page size="A4" style={s.page}>
      <Header data={data} t={t} />
      <Text style={s.h2}>{t.sections.entityIdentification}</Text>

      {data.identifiedEntities.length === 0 ? (
        <View style={s.card}>
          <Text style={s.p}>{ei.noEntities}</Text>
        </View>
      ) : (
        <View style={s.table}>
          <View style={s.tableHeader}>
            <Text style={{ ...s.th, width: '35%' }}>{ei.colAddress}</Text>
            <Text style={{ ...s.th, width: '25%' }}>{ei.colEntity}</Text>
            <Text style={{ ...s.th, width: '20%' }}>{ei.colType}</Text>
            <Text style={{ ...s.th, width: '20%' }}>{ei.colInteractions}</Text>
          </View>
          {data.identifiedEntities.map((e, i) => (
            <View key={i} style={{ ...s.tableRow, backgroundColor: e.type === 'mixer' ? '#fef2f2' : e.type === 'exchange' ? '#f0fdf4' : i % 2 === 0 ? undefined : '#fafbfc' }}>
              <Text style={{ ...s.td, ...s.mono, width: '35%' }}>{shortAddr(e.address)}</Text>
              <Text style={{ ...s.td, width: '25%', fontFamily: 'Helvetica-Bold' }}>{e.label}</Text>
              <Text style={{ ...s.td, width: '20%', color: e.type === 'mixer' ? red : e.type === 'exchange' ? green : slate600 }}>{ei.entityType(e.type)}</Text>
              <Text style={{ ...s.td, width: '20%' }}>{e.interactions}</Text>
            </View>
          ))}
        </View>
      )}

      {data.identifiedEntities.some(e => e.type === 'mixer') && (
        <View style={{ backgroundColor: '#fef2f2', borderRadius: 6, padding: 10, marginTop: 10 }}>
          <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: red, marginBottom: 3 }}>{ei.mixerWarningTitle}</Text>
          <Text style={{ fontSize: 8, color: slate600, lineHeight: 1.4 }}>{ei.mixerWarningBody}</Text>
        </View>
      )}

      {data.identifiedEntities.some(e => e.type === 'exchange') && (
        <View style={{ backgroundColor: '#f0fdf4', borderRadius: 6, padding: 10, marginTop: 8 }}>
          <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: green, marginBottom: 3 }}>{ei.exchangeIdentifiedTitle}</Text>
          <Text style={{ fontSize: 8, color: slate600, lineHeight: 1.4 }}>{ei.exchangeIdentifiedBody}</Text>
        </View>
      )}

      <View style={s.sectionDivider} />

      {/* EXIT POINT ANALYSIS */}
      <Text style={s.h2}>{t.sections.exitPointAnalysis}</Text>
      {exits && exits.exitPoints.length > 0 ? (
        <View>
          <View style={s.table}>
            <View style={s.tableHeader}>
              <Text style={{ ...s.th, width: '28%' }}>{ei.exitColDestination}</Text>
              <Text style={{ ...s.th, width: '18%' }}>{ei.exitColAmount}</Text>
              <Text style={{ ...s.th, width: '10%' }}>{ei.exitColToken}</Text>
              <Text style={{ ...s.th, width: '14%' }}>{ei.exitColType}</Text>
              <Text style={{ ...s.th, width: '30%' }}>{ei.exitColRecovery}</Text>
            </View>
            {exits.exitPoints.slice(0, 6).map((ep, i) => (
              <View key={i} style={i % 2 === 0 ? s.tableRow : s.tableRowAlt}>
                <Text style={{ ...s.td, ...s.mono, width: '28%' }}>{ep.entityName || shortAddr(ep.address)}</Text>
                <Text style={{ ...s.td, width: '18%' }}>{fmtEth(ep.amount)}</Text>
                <Text style={{ ...s.td, width: '10%' }}>{ep.token}</Text>
                <Text style={{ ...s.td, width: '14%', color: ep.entityType === 'exchange' ? green : ep.entityType === 'mixer' ? red : slate600 }}>{ei.entityType(ep.entityType)}</Text>
                <Text style={{ ...s.td, width: '30%', fontSize: 7, color: ep.entityType === 'exchange' ? green : ep.entityType === 'mixer' ? red : ep.entityType === 'defi' ? amber : slate600 }}>{ep.recoveryDifficulty}</Text>
              </View>
            ))}
          </View>
          {/* Phase 3.1 Stage 6 (T3): truncation footnote when >6 destinations. */}
          {exits.exitPoints.length > 6 && (
            <Text style={{ fontSize: 7, color: slate400, fontStyle: 'italic', marginTop: 4 }}>{ei.exitTruncatedNote}</Text>
          )}

          {/* Assessment box */}
          <View style={{ ...s.card, marginTop: 10, borderLeftWidth: 3, borderLeftColor: exits.hasKycExit ? green : exits.hasMixerUsage ? red : amber }}>
            <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: slate900, marginBottom: 3 }}>
              {exits.hasKycExit ? ei.exitKycTitle : exits.hasMixerUsage ? ei.exitMixerTitle : ei.exitNoneTitle}
            </Text>
            <Text style={{ fontSize: 8, color: slate600, lineHeight: 1.4 }}>
              {exits.hasKycExit ? ei.exitKycBody : exits.hasMixerUsage ? ei.exitMixerBody : ei.exitNoneBody}
            </Text>
          </View>
        </View>
      ) : (
        <View style={s.card}>
          <Text style={s.p}>{ei.noOutflows}</Text>
        </View>
      )}

      <Footer data={data} t={t} />
    </Page>
  );
};

/* ═══════════════════════════════════════════════════════════════
   PAGE 8: CROSS-CHAIN TRACE (conditional — only if detected)
   ═══════════════════════════════════════════════════════════════ */
const intentColor = (label: string) => {
  switch (label) {
    case 'LAUNDERING': return darkRed;
    case 'OBFUSCATION': return amber;
    default: return green;
  }
};

const CrossChainPage = ({ data, t }: { data: ReportData; t: ReportTranslations }) => {
  const cc = data.crossChainTrace;
  if (!cc || !cc.detected) return null;

  return (
    <Page size="A4" style={s.page}>
      <Header data={data} t={t} />
      <Text style={s.h2}>{t.sections.crossChainTrace}</Text>
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

      <Footer data={data} t={t} />
    </Page>
  );
};

/* ═══════════════════════════════════════════════════════════════
   PAGE 8/9: FUND FLOW GRAPH
   ═══════════════════════════════════════════════════════════════ */
const FundFlowPage = ({ data, t }: { data: ReportData; t: ReportTranslations }) => {
  const graph = data.graphData;
  const ff = t.fundFlow;

  return (
    <Page size="A4" style={s.page}>
      <Header data={data} t={t} />
      <Text style={s.h2}>{t.sections.fundFlow}</Text>
      <Text style={{ ...s.p, marginBottom: 12 }}>
        {ff.intro}
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
                // Phase 3.1 Stage 10: spoof (worthless) flows are visually
                // de-emphasized — grey, dashed, faded — so they can never be
                // mistaken for real economic flow (visual mixed-unit guard).
                const color = edge.isSpoof ? slate400 : edge.direction === 'OUT' ? red : green;
                const edgeLabel = edge.isSpoof ? `${edge.label} ${ff.fakeNoValueWarning}` : edge.label;
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
                      strokeDasharray={edge.isSpoof ? '4 2' : undefined}
                      strokeOpacity={edge.isSpoof ? 0.55 : 1}
                      style={{ stroke: color, strokeWidth: edge.isSpoof ? 1 : 1.5 }}
                    />
                    <Path d={triPath} fillOpacity={edge.isSpoof ? 0.55 : 1} style={{ fill: color }} />
                    {/* Edge value label */}
                    <Text
                      x={edge.labelX + px * 8}
                      y={edge.labelY + py * 8}
                      style={{ fontSize: 5.5, fill: color, fontFamily: 'Helvetica' }}
                    >
                      {edgeLabel}
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
              <Text style={{ ...s.th, width: '6%' }}>{ff.colNum}</Text>
              <Text style={{ ...s.th, width: '30%' }}>{ff.colLabel}</Text>
              <Text style={{ ...s.th, width: '22%' }}>{ff.colType}</Text>
              <Text style={{ ...s.th, width: '22%' }}>{ff.colVolume}</Text>
              <Text style={{ ...s.th, width: '20%' }}>{ff.colDirection}</Text>
            </View>
            {graph.nodes.filter(n => n.type !== 'source').map((node, i) => {
              const edge = graph.edges.find(e => e.fromId === node.id || e.toId === node.id);
              return (
                <View key={i} style={i % 2 === 0 ? s.tableRow : s.tableRowAlt}>
                  <Text style={{ ...s.td, width: '6%' }}>{i + 1}</Text>
                  <Text style={{ ...s.td, width: '30%', fontFamily: 'Helvetica-Bold' }}>{node.label}</Text>
                  <Text style={{ ...s.td, width: '22%', color: getNodeColor(node.type) }}>{ff.nodeType(node.type)}</Text>
                  <Text style={{ ...s.td, width: '22%', color: edge?.isSpoof ? slate400 : slate900 }}>{edge ? (edge.isSpoof ? `${edge.label} ${ff.fakeNoValueWarning}` : edge.label) : '—'}</Text>
                  <Text style={{ ...s.td, width: '20%', color: edge?.direction === 'IN' ? green : red }}>{edge?.direction || '—'}</Text>
                </View>
              );
            })}
          </View>

          {/* Legend */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 4 }}>
            {[
              { label: ff.legendYourWallet, color: '#1a7de9' },
              { label: ff.legendExchange, color: '#00c853' },
              { label: ff.legendMixer, color: '#ff1744' },
              { label: ff.legendDefi, color: '#7c3aed' },
              { label: ff.legendScam, color: '#ff6d00' },
              { label: ff.legendScamDb, color: '#8B0000' },
              { label: ff.legendUnknown, color: '#546e7a' },
            ].map((item, i) => (
              <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: item.color }} />
                <Text style={{ fontSize: 7, color: slate600 }}>{item.label}</Text>
              </View>
            ))}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <View style={{ width: 12, height: 2, backgroundColor: green }} />
              <Text style={{ fontSize: 7, color: slate600 }}>{ff.legendIncoming}</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <View style={{ width: 12, height: 2, backgroundColor: red }} />
              <Text style={{ fontSize: 7, color: slate600 }}>{ff.legendOutgoing}</Text>
            </View>
            {/* Phase 3.1 Stage 10: real (solid) vs spoof (dashed grey) flow. */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <View style={{ width: 12, height: 2, backgroundColor: slate900 }} />
              <Text style={{ fontSize: 7, color: slate600 }}>{ff.realFlowLegend}</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <View style={{ width: 12, height: 0, borderTopWidth: 1.5, borderTopColor: slate400, borderStyle: 'dashed' }} />
              <Text style={{ fontSize: 7, color: slate600 }}>{ff.spoofFlowLegend}</Text>
            </View>
          </View>
        </View>
      ) : (
        <View style={s.card}>
          <Text style={s.p}>
            {ff.noGraph}
          </Text>
          <Text style={{ fontSize: 9, color: blue, marginTop: 4 }}>
            {ff.interactiveLine}
          </Text>
        </View>
      )}

      <Footer data={data} t={t} />
    </Page>
  );
};

/* ═══════════════════════════════════════════════════════════════
   PAGE 9/10: TRANSACTION HISTORY (filtered to real assets, top 30)
   ═══════════════════════════════════════════════════════════════ */
const TransactionsPage = ({ data, t }: { data: ReportData; t: ReportTranslations }) => {
  const tr = t.transactions;
  return (
  <Page size="A4" style={s.page} wrap>
    <Header data={data} t={t} />
    <Text style={s.h2}>{t.sections.transactionHistory}{tr.titleSuffix(data.transactions.length)}</Text>

    <View style={s.table}>
      <View style={s.tableHeader} fixed>
        <Text style={{ ...s.th, width: '14%' }}>{tr.colDate}</Text>
        <Text style={{ ...s.th, width: '8%' }}>{tr.colDir}</Text>
        <Text style={{ ...s.th, width: '26%' }}>{tr.colFrom}</Text>
        <Text style={{ ...s.th, width: '26%' }}>{tr.colTo}</Text>
        <Text style={{ ...s.th, width: '14%' }}>{tr.colValue}</Text>
        <Text style={{ ...s.th, width: '12%' }}>{tr.colToken}</Text>
      </View>
      {data.transactions.map((tx, i) => {
        // 2026-05-21 (Phase 2.5 / Part 6): highlight Unicode-spoof token rows.
        const rowBase = i % 2 === 0 ? s.tableRow : s.tableRowAlt;
        const rowStyle = tx.isSpoof ? { ...rowBase, backgroundColor: '#fffbeb' } : rowBase;
        return (
          <View key={i} style={rowStyle} wrap={false}>
            <Text style={{ ...s.td, width: '14%', fontSize: 7 }}>{tx.date || '—'}</Text>
            <Text style={{ ...s.td, width: '8%', color: tx.direction === 'IN' ? green : red, fontFamily: 'Helvetica-Bold', fontSize: 7 }}>{tx.direction}</Text>
            <Text style={{ ...s.td, ...s.mono, width: '26%', fontSize: 6 }}>{shortAddr(tx.from)}</Text>
            <Text style={{ ...s.td, ...s.mono, width: '26%', fontSize: 6 }}>{shortAddr(tx.to)}</Text>
            <Text style={{ ...s.td, width: '14%', fontSize: 7 }}>{tx.value > 0 ? fmtEth(tx.value) : '—'}</Text>
            {tx.isSpoof ? (
              <Text style={{ ...s.td, width: '12%', fontSize: 6, color: red }}>
                <Text style={{ fontFamily: fontForScript(detectScriptCategory(tx.token)) }}>{truncToken(normalizeForDisplay(tx.token))}</Text> {'⚠'}
              </Text>
            ) : (
              <Text style={{ ...s.td, width: '12%', fontSize: 7 }}>{truncToken(tx.token)}</Text>
            )}
          </View>
        );
      })}
    </View>

    {data.transactions.some(tx => tx.isSpoof) && (
      <Text style={{ fontSize: 7, color: red, marginTop: 6 }}>
        {tr.spoofFootnote}
      </Text>
    )}

    {data.spamFiltered > 0 && (
      <Text style={{ fontSize: 7, color: slate400, fontStyle: 'italic', marginTop: 6 }}>
        {tr.spamFilteredNote(data.spamFiltered)}
      </Text>
    )}

    <Footer data={data} t={t} />
  </Page>
  );
};

/* ═══════════════════════════════════════════════════════════════
   PAGE 10/11: RECOVERY SCENARIOS + LEGAL RECOMMENDATIONS
   ═══════════════════════════════════════════════════════════════ */
const probColor = (p: string) => p === 'HIGH' ? red : p === 'LOW' ? green : amber;

const RecoveryLegalPage = ({ data, t }: { data: ReportData; t: ReportTranslations }) => {
  const scenarios = data.recoveryScenarios;
  const rc = t.recovery;

  return (
    <Page size="A4" style={s.page}>
      <Header data={data} t={t} />
      <Text style={s.h2}>{t.sections.recoveryAssessment}</Text>

      {/* Recovery Scenarios */}
      {scenarios && scenarios.length > 0 && (
        <View style={{ marginBottom: 14 }}>
          {scenarios.map((sc, i) => (
            <View key={i} style={{ ...s.card, marginBottom: 6, borderLeftWidth: 3, borderLeftColor: sc.probability === 'HIGH' ? (sc.recoveryChance === 'HIGH' ? green : red) : slate400 }}>
              <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: slate900, marginBottom: 4 }}>{sc.name}</Text>
              <View style={{ flexDirection: 'row', gap: 16, marginBottom: 4 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Text style={{ fontSize: 7, color: slate400 }}>{rc.probabilityLabel}</Text>
                  <Text style={{ fontSize: 7, fontFamily: 'Helvetica-Bold', color: probColor(sc.probability) }}>{rc.chance[sc.probability] ?? sc.probability}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Text style={{ fontSize: 7, color: slate400 }}>{rc.recoveryIfConfirmedLabel}</Text>
                  <Text style={{ fontSize: 7, fontFamily: 'Helvetica-Bold', color: sc.recoveryChance === 'HIGH' ? green : sc.recoveryChance === 'MEDIUM' ? amber : red }}>{rc.chance[sc.recoveryChance] ?? sc.recoveryChance}</Text>
                </View>
              </View>
              <Text style={{ fontSize: 8, color: slate600, lineHeight: 1.4, marginBottom: 3 }}>{sc.description}</Text>
              <Text style={{ fontSize: 8, color: blue }}>{'\u2192'} {sc.action}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Overall recovery — uses structured recoveryAssessment.
          2026-05-20: Score hard-capped at 35%; disclaimer is mandatory. */}
      <View style={{ backgroundColor: '#f1f5f9', borderRadius: 6, padding: 12, marginBottom: 14, alignItems: 'center' }}>
        <Text style={{ fontSize: 8, color: slate400, letterSpacing: 1, marginBottom: 6 }}>{rc.overallRecoveryProbability}</Text>
        <Text style={{ fontSize: 20, fontFamily: 'Helvetica-Bold', color: recoveryColor(data.recoveryAssessment.score) }}>{data.recoveryAssessment.score}%</Text>
        <Text style={{ fontSize: 8, color: slate600, textAlign: 'center', marginTop: 4 }}>{data.recoveryAssessment.label}</Text>
        <Text style={{ fontSize: 7, color: slate400, textAlign: 'center', marginTop: 8, maxWidth: 420, lineHeight: 1.4, fontStyle: 'italic' }}>
          {data.recoveryAssessment.disclaimer}
        </Text>
      </View>

      <View style={s.sectionDivider} />

      {/* Legal Recommendations */}
      <Text style={s.h2}>{t.sections.legalRecommendations}</Text>

      {data.ofacWarning && (
        <View style={{ backgroundColor: darkRed, borderRadius: 6, padding: 10, marginBottom: 10 }}>
          <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: 'white', marginBottom: 3 }}>{rc.ofacNoticeTitle}</Text>
          <Text style={{ fontSize: 8, color: '#fecaca', lineHeight: 1.4 }}>{rc.ofacNoticeBody}</Text>
        </View>
      )}

      {/* 2026-05-21 (Phase 2.5 Fix 2): structured, entry/exit-aware
          recommendations. Resolves the contradiction where the report both
          said "Binance = victim entry" (p.4) and "Subpoena Binance to
          identify the account holder" (here) — which could mislead counsel
          into thinking a Binance subpoena yields the scammer's identity. */}
      <Text style={s.h3}>{rc.recommendedActions}</Text>
      {(() => {
        const ea = data.exchangeAnalysis;
        const entryBrand = ea?.entryPoints?.[0]?.parentEntity;
        const usesUsdt = (data.assetSummary?.realAssets || []).some(a => a.symbol === 'USDT')
          || (data.attackTechniques?.unicodeSpoofing?.evidence || []).some(e => e.mimicsLegitimate === 'USDT')
          || (data.attackTechniques?.addressPoisoning?.campaigns || []).some(c => c.primaryToken === 'USDT');
        const items: { bold: string; text: string }[] = [];

        if (ea?.hasEntryKyc && entryBrand) {
          items.push({ bold: rc.entryPointBold(entryBrand), text: rc.entryPointText(entryBrand) });
        }
        if (!ea?.hasExitKyc) {
          items.push({ bold: rc.counterpartyExitBold, text: rc.counterpartyExitText });
        } else {
          items.push({ bold: rc.kycExitBold, text: rc.kycExitText(ea.exitPoints[0]?.parentEntity || 'a KYC exchange') });
        }
        items.push({ bold: rc.ic3Bold, text: rc.ic3Text });
        items.push({ bold: rc.exchangeComplianceBold, text: rc.exchangeComplianceText });
        if (usesUsdt) {
          items.push({ bold: rc.tokenIssuerBold, text: rc.tokenIssuerText });
        }
        items.push({ bold: rc.courtCertifiedBold, text: rc.courtCertifiedText });

        return items.map((it, i) => (
          <Text key={i} style={{ ...s.bullet, marginBottom: 5 }}>
            {i + 1}. <Text style={{ fontFamily: 'Helvetica-Bold' }}>{it.bold}</Text> {it.text}
          </Text>
        ));
      })()}

      <Footer data={data} t={t} />
    </Page>
  );
};

/* ═══════════════════════════════════════════════════════════════
   COUNTRY GUIDANCE: PERU (Phase 3 Part 3)
   Only rendered when locale === 'es' && country === 'PE' (see ReportDocument).
   ═══════════════════════════════════════════════════════════════ */
const PeruGuidancePage = ({ data, t }: { data: ReportData; t: ReportTranslations }) => {
  const pg = t.countryGuidance.peru;

  /** One institution card with a coloured left border. */
  const OrgCard = ({
    num, color, title, lines, description,
  }: { num: number; color: string; title: string; lines: string[]; description: string }) => (
    <View style={{ ...s.card, marginBottom: 8, borderLeftWidth: 3, borderLeftColor: color }}>
      <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', color, marginBottom: 3 }}>
        {num}. {title}
      </Text>
      {lines.map((ln, i) => (
        <Text key={i} style={{ fontSize: 8, color: slate900, marginBottom: 1 }}>{ln}</Text>
      ))}
      <Text style={{ fontSize: 8, color: slate600, lineHeight: 1.4, marginTop: 4 }}>{description}</Text>
    </View>
  );

  return (
    <Page size="A4" style={s.page}>
      <Header data={data} t={t} />
      <Text style={s.h2}>{pg.title}</Text>
      <Text style={{ ...s.p, fontSize: 9 }}>{pg.intro}</Text>

      <OrgCard
        num={1}
        color={blue}
        title={pg.divindatTitle}
        lines={[pg.divindatAddress, pg.divindatPhone, pg.divindatEmail, pg.divindatHours]}
        description={pg.divindatDescription}
      />
      <OrgCard
        num={2}
        color={purple}
        title={pg.ministerioPublicoTitle}
        lines={[pg.ministerioPublicoUrl]}
        description={pg.ministerioPublicoDescription}
      />
      <OrgCard
        num={3}
        color={green}
        title={pg.sbsTitle}
        lines={[pg.sbsPhone, pg.sbsEmail]}
        description={pg.sbsDescription}
      />
      <OrgCard
        num={4}
        color={amber}
        title={pg.indecopiTitle}
        lines={[pg.indecopiPhone, pg.indecopiUrl]}
        description={pg.indecopiDescription}
      />
      <OrgCard
        num={5}
        color={slate600}
        title={pg.calTitle}
        lines={[pg.calUrl]}
        description={pg.calDescription}
      />
      <OrgCard
        num={6}
        color={blue}
        title={pg.reniecTitle}
        lines={[pg.reniecUrl]}
        description={pg.reniecDescription}
      />

      <View style={{ ...s.card, backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#bfdbfe', marginTop: 2 }}>
        <Text style={{ fontSize: 8, color: slate600, lineHeight: 1.5 }}>{pg.disclaimer}</Text>
      </View>

      <Footer data={data} t={t} />
    </Page>
  );
};

/* ═══════════════════════════════════════════════════════════════
   PAGE 11/12: ACTIONABLE NEXT STEPS
   ═══════════════════════════════════════════════════════════════ */
const ActionableStepsPage = ({ data, t }: { data: ReportData; t: ReportTranslations }) => {
  const n = data.narrative;
  // 2026-05-20 fix 1.2: group exchanges by parentEntity so we render one row
  // per brand instead of five identical "Binance Hot Wallet" cards. Each
  // brand row shows the brand name, summed interactions, comma-separated
  // short hot-wallet addresses, and the brand-wide compliance email.
  type ExchangeBrandView = {
    brand: string;
    interactions: number;
    addresses: string[];
    email: string;
  };
  const brandMap = new Map<string, ExchangeBrandView>();
  for (const e of data.identifiedEntities) {
    if (e.type !== 'exchange') continue;
    const brand = e.parentEntity || e.label;
    const existing = brandMap.get(brand);
    if (existing) {
      existing.interactions += e.interactions;
      existing.addresses.push(e.address);
      if (!existing.email && e.complianceEmail) existing.email = e.complianceEmail;
    } else {
      const found = data.exchangeComplianceEmails.find(ec => ec.name === brand);
      brandMap.set(brand, {
        brand,
        interactions: e.interactions,
        addresses: [e.address],
        email: e.complianceEmail || found?.email || '',
      });
    }
  }
  const exchangeBrands: ExchangeBrandView[] = Array.from(brandMap.values())
    .sort((a, b) => b.interactions - a.interactions);
  const hasExchanges = exchangeBrands.length > 0;
  const st = t.steps;

  // Phase 3.1 Issue #5/#6: role-aware STEP 1. The page must not imply a
  // scammer KYC cash-out point was found when it was not (resolves the
  // Page 5 "no exit detected" vs Page 17 STEP 1 contradiction).
  const hasKycExit = data.exitPointAnalysis?.hasKycExit === true;
  const step1Scenario: 'victim' | 'exit' | 'generic' =
    data.narrative.walletType === 'victim' && !hasKycExit ? 'victim'
      : hasKycExit ? 'exit'
        : 'generic';
  const step1Title = step1Scenario === 'victim' ? st.step1TitleVictim : step1Scenario === 'exit' ? st.step1Title : st.step1TitleGeneric;
  const step1Body = step1Scenario === 'victim' ? st.step1BodyVictim : step1Scenario === 'exit' ? st.step1Body : st.step1BodyGeneric;
  const step1Closing = step1Scenario === 'victim' ? st.step1ClosingVictim : step1Scenario === 'exit' ? st.step1Closing : st.step1ClosingGeneric;

  // Phase 3.1 Stage 5 (R1): scenario-aware top priority banner. Only the
  // "exit" scenario (scammer KYC cash-out actually found) claims a recovery
  // path; victim/generic use honest, non-overpromising headers. This also
  // carries the victim funding-point framing (consolidated from the former
  // inner STEP 1 banner to avoid duplicate text on the same page).
  const bannerScenario: 'victim' | 'exit' | 'generic' | 'none' = !hasExchanges ? 'none' : step1Scenario;
  const bannerHeader = bannerScenario === 'victim' ? st.step1BannerVictim
    : bannerScenario === 'exit' ? st.recoveryPathIdentified
      : bannerScenario === 'generic' ? st.recoveryPathGeneric
        : st.recoveryRequiresInvestigation;
  const bannerBody = bannerScenario === 'victim' ? st.recoveryPathVictimBody
    : bannerScenario === 'exit' ? st.recoveryPathBody
      : bannerScenario === 'generic' ? st.recoveryPathGenericBody
        : st.recoveryRequiresBody;
  const bannerColor = bannerScenario === 'exit' ? green : bannerScenario === 'none' ? red : amber;
  const bannerBg = bannerScenario === 'exit' ? '#f0fdf4' : bannerScenario === 'none' ? '#fef2f2' : '#fffbeb';
  const bannerBorder = bannerScenario === 'exit' ? '#bbf7d0' : bannerScenario === 'none' ? '#fecaca' : '#fde68a';

  return (
    <Page size="A4" style={s.page}>
      <Header data={data} t={t} />
      <Text style={s.h2}>{t.sections.actionableSteps}</Text>

      {/* Priority banner — scenario-aware (Phase 3.1 Stage 5 R1) */}
      <View style={{ backgroundColor: bannerBg, borderRadius: 6, padding: 12, marginBottom: 14, borderWidth: 1, borderColor: bannerBorder }}>
        <Text style={{ fontSize: 11, fontFamily: 'Helvetica-Bold', color: bannerColor, marginBottom: 4 }}>
          {bannerHeader}
        </Text>
        <Text style={{ fontSize: 9, color: slate600, lineHeight: 1.5 }}>
          {bannerBody}
        </Text>
      </View>

      {/* Step 1: Exchange Compliance Contact */}
      {hasExchanges && (
        <View style={{ ...s.card, marginBottom: 10, borderLeftWidth: 3, borderLeftColor: blue }}>
          <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', color: blue, marginBottom: 2 }}>{st.stepLabel(1)}: {step1Title}</Text>
          <Text style={{ fontSize: 7, color: slate600, lineHeight: 1.4, marginBottom: 6 }}>
            {step1Body}
          </Text>
          {exchangeBrands.slice(0, 3).map((b, i) => (
            <View key={i} style={{ backgroundColor: '#f8fafc', borderRadius: 4, padding: 8, marginBottom: 6, borderWidth: 1, borderColor: '#e2e8f0' }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 }}>
                <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: slate900 }}>{b.brand}</Text>
                <Text style={{ fontSize: 8, color: slate600 }}>
                  {st.step1Interactions(b.interactions, b.addresses.length)}
                </Text>
              </View>
              <Text style={{ ...s.mono, fontSize: 7, color: slate600, marginBottom: 3 }}>
                {b.addresses.slice(0, 3).map(a => shortAddr(a)).join(', ')}{b.addresses.length > 3 ? st.step1MoreAddrs(b.addresses.length - 3) : ''}
              </Text>
              {b.email ? (
                <Text style={{ fontSize: 8, color: blue }}>{b.email}</Text>
              ) : b.brand.includes('Binance') ? (
                <Text style={{ fontSize: 7, color: slate600, lineHeight: 1.3 }}>
                  {st.step1BinanceChannel}
                </Text>
              ) : (
                <Text style={{ fontSize: 7, color: slate400, fontStyle: 'italic' }}>
                  {st.step1NoContact}
                </Text>
              )}
            </View>
          ))}
          <Text style={{ fontSize: 8, color: slate600, lineHeight: 1.5, marginTop: 4 }}>
            {step1Closing(data.caseId)}
          </Text>
        </View>
      )}

      {/* Step 2: Law Enforcement */}
      <View style={{ ...s.card, marginBottom: 10, borderLeftWidth: 3, borderLeftColor: amber }}>
        <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', color: amber, marginBottom: 6 }}>
          {st.stepLabel(hasExchanges ? 2 : 1)}: {st.lawEnforcementTitle}
        </Text>
        <Text style={{ fontSize: 8, color: slate900, paddingLeft: 8, marginBottom: 3 }}>{'\u2022'} {st.ic3Bullet}</Text>
        <Text style={{ fontSize: 8, color: slate900, paddingLeft: 8, marginBottom: 3 }}>{'\u2022'} {st.localPoliceBullet}</Text>
        <Text style={{ fontSize: 8, color: slate900, paddingLeft: 8, marginBottom: 3 }}>{'\u2022'} {st.ftcBullet}</Text>
        {data.narrative.walletType === 'transit' && (
          <Text style={{ fontSize: 8, color: slate900, paddingLeft: 8, marginBottom: 3 }}>{'\u2022'} {st.sarBullet}</Text>
        )}
        <Text style={{ fontSize: 8, color: slate600, lineHeight: 1.5, marginTop: 4 }}>
          {st.lawEnforcementClosing(data.caseId)}
        </Text>
      </View>

      {/* Step 3: Legal Action */}
      <View style={{ ...s.card, marginBottom: 10, borderLeftWidth: 3, borderLeftColor: purple }}>
        <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', color: purple, marginBottom: 6 }}>
          {st.stepLabel(hasExchanges ? 3 : 2)}: {st.legalProceedingsTitle}
        </Text>
        {hasExchanges ? (
          <>
            <Text style={{ fontSize: 8, color: slate900, paddingLeft: 8, marginBottom: 3 }}>{'\u2022'} {st.legalSubpoena(exchangeBrands[0].brand)}</Text>
            <Text style={{ fontSize: 8, color: slate900, paddingLeft: 8, marginBottom: 3 }}>{'\u2022'} {st.legalIdentityRequest}</Text>
            <Text style={{ fontSize: 8, color: slate900, paddingLeft: 8, marginBottom: 3 }}>{'\u2022'} {st.legalCivilRecovery}</Text>
            <Text style={{ fontSize: 8, color: slate900, paddingLeft: 8, marginBottom: 3 }}>{'\u2022'} {st.legalPreservationLetter}</Text>
          </>
        ) : (
          <>
            <Text style={{ fontSize: 8, color: slate900, paddingLeft: 8, marginBottom: 3 }}>{'\u2022'} {st.legalConsultAttorney}</Text>
            <Text style={{ fontSize: 8, color: slate900, paddingLeft: 8, marginBottom: 3 }}>{'\u2022'} {st.legalAdvancedTracing}</Text>
            <Text style={{ fontSize: 8, color: slate900, paddingLeft: 8, marginBottom: 3 }}>{'\u2022'} {st.legalInternational}</Text>
          </>
        )}
      </View>

      {/* Step 4: Evidence Preservation */}
      <View style={{ ...s.card, marginBottom: 10, borderLeftWidth: 3, borderLeftColor: slate400 }}>
        <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', color: slate600, marginBottom: 6 }}>
          {st.stepLabel(hasExchanges ? 4 : 3)}: {st.preserveEvidenceTitle}
        </Text>
        <Text style={{ fontSize: 8, color: slate900, paddingLeft: 8, marginBottom: 3 }}>{'\u2022'} {st.preserve1}</Text>
        <Text style={{ fontSize: 8, color: slate900, paddingLeft: 8, marginBottom: 3 }}>{'\u2022'} {st.preserve2}</Text>
        <Text style={{ fontSize: 8, color: slate900, paddingLeft: 8, marginBottom: 3 }}>{'\u2022'} {st.preserve3}</Text>
        <Text style={{ fontSize: 8, color: slate900, paddingLeft: 8 }}>{'\u2022'} {st.preserve4}</Text>
      </View>

      {/* CTA */}
      <View style={{ ...s.card, backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#bfdbfe' }}>
        <Text style={{ fontSize: 11, fontFamily: 'Helvetica-Bold', color: blue, marginBottom: 6 }}>{st.ctaTitle}</Text>
        <Text style={{ fontSize: 9, color: slate600, lineHeight: 1.5 }}>
          {st.ctaBody}
        </Text>
        <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', color: blue, marginTop: 8 }}>
          contact@ledgerhound.vip {'\u00B7'} +1 (833) 559-1334
        </Text>
        <Text style={{ fontSize: 9, color: slate600, marginTop: 3 }}>
          www.ledgerhound.vip/free-evaluation
        </Text>
      </View>

      <Footer data={data} t={t} />
    </Page>
  );
};

/* ═══════════════════════════════════════════════════════════════
   PAGE 12/13: DISCLAIMER
   ═══════════════════════════════════════════════════════════════ */
const DisclaimerPage = ({ data, t }: { data: ReportData; t: ReportTranslations }) => {
  const d = t.disclaimer;
  return (
  <Page size="A4" style={s.page}>
    <Header data={data} t={t} />
    <Text style={s.h2}>{t.sections.disclaimer}</Text>

    <Text style={{ ...s.p, lineHeight: 1.6 }}>
      {d.para1}
    </Text>
    <Text style={{ ...s.p, lineHeight: 1.6 }}>
      {d.para2}
    </Text>
    <Text style={{ ...s.p, lineHeight: 1.6 }}>
      {d.para3}
    </Text>
    <Text style={{ ...s.p, lineHeight: 1.6 }}>
      {d.para4}
    </Text>
    <Text style={{ ...s.p, lineHeight: 1.6 }}>
      {d.para5}
    </Text>
    <Text style={{ ...s.p, lineHeight: 1.6 }}>
      {d.para6}
    </Text>

    <View style={s.sectionDivider} />

    <View style={{ alignItems: 'center', marginTop: 20 }}>
      <Text style={{ fontSize: 12, fontFamily: 'Helvetica-Bold', color: blue, marginBottom: 8 }}>LedgerHound</Text>
      <Text style={{ fontSize: 9, color: slate600 }}>{d.tagline}</Text>
      <Text style={{ fontSize: 9, color: slate600, marginTop: 4 }}>USPROJECT LLC</Text>
      <Text style={{ fontSize: 9, color: slate400, marginTop: 8 }}>contact@ledgerhound.vip · www.ledgerhound.vip</Text>
      <Text style={{ fontSize: 9, color: slate400 }}>+1 (833) 559-1334</Text>
    </View>

    <Footer data={data} t={t} />
  </Page>
  );
};

/* ═══════════════════════════════════════════════════════════════
   DOCUMENT
   ═══════════════════════════════════════════════════════════════ */
export const ReportDocument = ({ data, locale, country }: { data: ReportData; locale?: ReportLocale | string; country?: string }) => {
  const hasCrossChain = data.crossChainTrace?.detected === true;
  // 2026-05-20 Phase 1: only render the new federation page when at least
  // one counterparty was analyzed. Avoids a blank section on tiny wallets.
  const hasAddressLabels = (data.addressLabels?.length ?? 0) > 0;
  // Phase 2: only render the attack page when a technique was detected.
  const at = data.attackTechniques;
  const hasAttackTechniques = !!at && (at.addressPoisoning?.detected || at.unicodeSpoofing?.detected);
  // Phase 3: resolve translations and provide via context (English default).
  const t = getReportTranslations(locale);
  // Phase 3 Part 3: country-specific recovery guidance. Currently only Peru (PE)
  // has a dedicated section, and only when the report is rendered in Spanish
  // (the audience is Peruvian authorities — DIVINDAT, Ministerio Público, etc.).
  // TODO: add MexicoGuidancePage (Policía Cibernética, CONDUSEF, etc.)
  // TODO: add ColombiaGuidancePage (DIJIN, SIC, etc.)
  // TODO: add ArgentinaGuidancePage / ChileGuidancePage
  // TODO: add SpainGuidancePage (Policía Nacional, Banco de España, etc.)
  const showPeruGuidance = locale === 'es' && country === 'PE';

  return (
    <Document>
      <CoverPage data={data} t={t} />
      <SummaryPage data={data} t={t} country={country} />
      <RecoveryReadinessPage data={data} t={t} />
      <NarrativePage data={data} t={t} />
      <AssetTimelinePage data={data} t={t} />
      <PatternPage data={data} t={t} />
      <AnalyticsPage data={data} t={t} />
      <EntitiesExitPage data={data} t={t} />
      {hasAddressLabels && <AddressLabelsPage data={data} t={t} />}
      {hasAttackTechniques && <AttackTechniqueAnalysisPage data={data} t={t} />}
      {hasCrossChain && <CrossChainPage data={data} t={t} />}
      <FundFlowPage data={data} t={t} />
      <TransactionsPage data={data} t={t} />
      <RecoveryLegalPage data={data} t={t} />
      {showPeruGuidance && <PeruGuidancePage data={data} t={t} />}
      <ActionableStepsPage data={data} t={t} />
      <DisclaimerPage data={data} t={t} />
    </Document>
  );
};
