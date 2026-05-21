import React from 'react';
import path from 'path';
import { Document, Page, Text, View, StyleSheet, Svg, Circle, Line, Rect, G, Image, Path, Font } from '@react-pdf/renderer';
import { fmtEth, type ReportData, type RiskBreakdown, type TimelineEvent, type ExitPoint, type RecoveryScenario, type AssetSummary, type PatternAnalysis, type ScamPattern, type CrossChainTrace, type BridgeInteraction, type ChainActivity, type CrossChainHop, type NarrativeData, type EvidenceStrength, type RecoveryAssessment, type WalletRole } from './generateReport';
import { getNodeColor, type GraphData, type GraphNode, type GraphEdge } from './generateGraphData';
import { firstDifferingChar } from './address-poisoning';
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

const SummaryPage = ({ data, t }: { data: ReportData; t: ReportTranslations }) => {
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

      <Text style={s.h3}>{t.exec.keyFindings}</Text>
      {data.keyFindings.map((f, i) => (
        <Text key={i} style={s.bullet}>{'\u2022'} {f}</Text>
      ))}

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
          <Text style={{ fontSize: 8, color: slate400 }}>Confidence: {Math.round(n.roleConfidence * 100)}%</Text>
        )}
      </View>

      {/* How we classified this wallet — reasoning bullets.
          2026-05-20: Added for transparency. The classifier is a priority
          cascade (scam-db → KNOWN_ENTITIES → victim heuristic → other roles).
          See lib/generateReport.ts for the rules. */}
      {n.roleReasoning && n.roleReasoning.length > 0 && (
        <View style={{ backgroundColor: '#f8fafc', borderRadius: 6, padding: 10, marginBottom: 10, borderWidth: 1, borderColor: '#e2e8f0' }}>
          <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', color: slate900, marginBottom: 4 }}>HOW WE CLASSIFIED THIS WALLET</Text>
          {n.roleReasoning.slice(0, 5).map((r, i) => (
            <Text key={i} style={{ fontSize: 8, color: slate600, lineHeight: 1.4, paddingLeft: 4, marginBottom: 2 }}>{'•'} {r}</Text>
          ))}
        </View>
      )}

      {/* Key Stats Row */}
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10 }}>
        <View style={{ flex: 1, backgroundColor: '#eff6ff', borderRadius: 6, padding: 8, alignItems: 'center', borderWidth: 1, borderColor: '#bfdbfe' }}>
          <Text style={{ fontSize: 18, fontFamily: 'Helvetica-Bold', color: blue }}>{n.uniqueSenders}</Text>
          <Text style={{ fontSize: 6, color: slate600, marginTop: 2 }}>UNIQUE SENDERS</Text>
        </View>
        <View style={{ flex: 1, backgroundColor: '#f0fdf4', borderRadius: 6, padding: 8, alignItems: 'center', borderWidth: 1, borderColor: '#bbf7d0' }}>
          <Text style={{ fontSize: 18, fontFamily: 'Helvetica-Bold', color: green }}>{flowIn}</Text>
          <Text style={{ fontSize: 6, color: slate600, marginTop: 2 }}>{flowSymbol} IN</Text>
        </View>
        <View style={{ flex: 1, backgroundColor: '#fef2f2', borderRadius: 6, padding: 8, alignItems: 'center', borderWidth: 1, borderColor: '#fecaca' }}>
          <Text style={{ fontSize: 18, fontFamily: 'Helvetica-Bold', color: red }}>{flowOut}</Text>
          <Text style={{ fontSize: 6, color: slate600, marginTop: 2 }}>{flowSymbol} OUT</Text>
        </View>
        <View style={{ flex: 1, backgroundColor: n.forwardingPercent >= 70 ? '#fef2f2' : '#f8fafc', borderRadius: 6, padding: 8, alignItems: 'center', borderWidth: 1, borderColor: n.forwardingPercent >= 70 ? '#fecaca' : '#e2e8f0' }}>
          <Text style={{ fontSize: 18, fontFamily: 'Helvetica-Bold', color: n.forwardingPercent >= 70 ? red : slate900 }}>{n.forwardingPercent}%</Text>
          <Text style={{ fontSize: 6, color: slate600, marginTop: 2 }}>FORWARDED {'<'}24H</Text>
        </View>
      </View>

      {/* Narrative Text */}
      <View style={{ backgroundColor: '#f8fafc', borderRadius: 6, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: '#e2e8f0' }}>
        <Text style={{ ...s.p, fontSize: 9, lineHeight: 1.5, marginBottom: 4 }}>{n.summary}</Text>
        <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: isVictim ? amber : isDangerous ? red : blue, lineHeight: 1.4 }}>{n.conclusion}</Text>
      </View>

      {/* Simplified Fund Flow Diagram — 3 boxes, 1 line */}
      <View style={{ marginBottom: 10 }}>
        <Text style={{ ...s.h3, marginBottom: 6 }}>Fund Flow</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
          <View style={{ alignItems: 'center', backgroundColor: '#eff6ff', borderRadius: 6, padding: 8, flex: 1, borderWidth: 1, borderColor: '#bfdbfe' }}>
            <Text style={{ fontSize: isVictim ? 10 : 14, fontFamily: 'Helvetica-Bold', color: blue, textAlign: 'center' }}>
              {isVictim ? `~${n.uniqueSenders} Source Deposit(s)` : `${n.uniqueSenders} Victims`}
            </Text>
            <Text style={{ fontSize: 7, color: slate600, marginTop: 2 }}>{flowIn} {flowSymbol}</Text>
            {isVictim && (
              <Text style={{ fontSize: 6, color: slate400, marginTop: 1, textAlign: 'center' }}>(incl. CEX deposits)</Text>
            )}
          </View>
          <Text style={{ fontSize: 14, color: slate400, paddingHorizontal: 2 }}>{'\u2192'}</Text>
          <View style={{ alignItems: 'center', backgroundColor: isVictim ? '#fffbeb' : '#fef2f2', borderRadius: 6, padding: 8, flex: 1, borderWidth: 2, borderColor: isVictim ? amber : red }}>
            <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', color: isVictim ? amber : red }}>
              {isVictim ? 'VICTIM WALLET' : 'SCAM WALLET'}
            </Text>
            <Text style={{ fontFamily: 'Courier', fontSize: 6, color: slate600, marginTop: 1 }}>{shortAddr(data.walletAddress)}</Text>
          </View>
          <Text style={{ fontSize: 14, color: slate400, paddingHorizontal: 2 }}>{'\u2192'}</Text>
          <View style={{ alignItems: 'center', backgroundColor: isVictim ? '#fef2f2' : n.primaryExitExchange ? '#f0fdf4' : '#fffbeb', borderRadius: 6, padding: 8, flex: 1, borderWidth: 1, borderColor: isVictim ? '#fecaca' : n.primaryExitExchange ? '#bbf7d0' : '#fde68a' }}>
            <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', color: isVictim ? red : n.primaryExitExchange ? green : amber }}>
              {isVictim ? `${n.uniqueReceivers} Counterparty Wallet(s)` : (n.primaryExitExchange || `${n.uniqueReceivers} Receivers`)}
            </Text>
            <Text style={{ fontSize: 7, color: slate600, marginTop: 2 }}>{flowOut} {flowSymbol}</Text>
            {!isVictim && n.primaryExitExchange && <Text style={{ fontSize: 6, color: green, marginTop: 1 }}>KYC Exchange</Text>}
            {isVictim && <Text style={{ fontSize: 6, color: red, marginTop: 1 }}>Suspected Scammer Cluster</Text>}
          </View>
        </View>
        {/* Victim-context note: this wallet is one of N senders — see user spec on Elayne case */}
        {isVictim && (
          <Text style={{ fontSize: 7, color: slate600, marginTop: 6, paddingHorizontal: 8, lineHeight: 1.4 }}>
            Note: This wallet is one of approximately {n.uniqueSenders > 0 ? n.uniqueSenders : 'several'} source(s) sending funds to the same recipient cluster. The pattern is consistent with the wallet owner being a victim, not a scam operator.
          </Text>
        )}
      </View>

      {/* Victim Guidance Block */}
      <View style={{ backgroundColor: '#eff6ff', borderRadius: 6, padding: 10, marginBottom: 10, borderWidth: 1, borderColor: '#bfdbfe' }}>
        <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: blue, marginBottom: 4 }}>If You Sent Funds to This Wallet:</Text>
        <Text style={{ fontSize: 8, color: slate600, lineHeight: 1.5, marginBottom: 3 }}>
          Your transaction likely followed this path: YOU {'\u2192'} This Wallet ({n.walletTypeLabel}) {n.primaryExitExchange ? `\u2192 ${n.primaryExitExchange} (Cash-out)` : ''}
        </Text>
        <Text style={{ fontSize: 8, color: slate900, marginBottom: 1 }}>To locate your specific transaction:</Text>
        <Text style={{ fontSize: 7, color: slate600, paddingLeft: 8 }}>1. Find your TXID in the Transaction History section of this report</Text>
        <Text style={{ fontSize: 7, color: slate600, paddingLeft: 8 }}>2. Note the date, amount, and transaction hash</Text>
        <Text style={{ fontSize: 7, color: slate600, paddingLeft: 8 }}>3. Include this information in your police report and exchange complaint</Text>
      </View>

      <View style={s.divider} />

      {/* Evidence Strength + Legal Weight — side by side */}
      <View style={{ flexDirection: 'row', gap: 10 }}>
        {/* Evidence Strength */}
        <View style={{ flex: 1 }}>
          <Text style={{ ...s.h3, marginBottom: 4 }}>Evidence Strength</Text>
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
          <Text style={{ ...s.h3, marginBottom: 4 }}>Report Suitability</Text>
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
              <Text style={{ fontSize: 7, fontFamily: 'Helvetica-Bold', color: slate900, marginBottom: 3 }}>Exchange KYC — Entry vs Exit</Text>

              {/* Entry */}
              <Text style={{ fontSize: 6.5, fontFamily: 'Helvetica-Bold', color: amber, marginTop: 2 }}>KYC ENTRY POINT (victim&apos;s funding source)</Text>
              {data.exchangeAnalysis.entryPoints.length > 0 ? (
                data.exchangeAnalysis.entryPoints.slice(0, 3).map((e, i) => (
                  <Text key={i} style={{ fontSize: 6.5, color: slate900 }}>
                    {e.parentEntity}: {e.interactionCount} interaction(s){e.complianceEmail ? ` · ${e.complianceEmail}` : ''}
                  </Text>
                ))
              ) : (
                <Text style={{ fontSize: 6.5, color: slate400 }}>None detected.</Text>
              )}
              <Text style={{ fontSize: 6, color: slate400, marginTop: 1, lineHeight: 1.3 }}>
                Identifies the VICTIM&apos;S exchange account — useful to confirm victim identity for legal proceedings, not the scammer&apos;s.
              </Text>

              {/* Exit */}
              <Text style={{ fontSize: 6.5, fontFamily: 'Helvetica-Bold', color: red, marginTop: 4 }}>KYC EXIT POINT (scammer cash-out)</Text>
              {data.exchangeAnalysis.exitPoints.length > 0 ? (
                data.exchangeAnalysis.exitPoints.slice(0, 3).map((e, i) => (
                  <Text key={i} style={{ fontSize: 6.5, color: slate900 }}>
                    {e.parentEntity}: {e.interactionCount} interaction(s){e.complianceEmail ? ` · ${e.complianceEmail}` : ''}
                  </Text>
                ))
              ) : (
                <Text style={{ fontSize: 6.5, color: slate600, lineHeight: 1.3 }}>
                  Not detected in subject wallet&apos;s direct history. The fraud cluster controls the funds; identifying a cash-out exchange requires an expanded counterparty trace (one or more hops beyond this wallet).
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

  return (
    <Page size="A4" style={s.page}>
      <Header data={data} t={t} />

      {/* ASSET SUMMARY */}
      <Text style={s.h2}>{t.sections.assetSummary}</Text>
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

      {/* 2026-05-21 (Phase 2 / 2.5): Unicode-spoofing evidence — kept SEPARATE
          from spam. Spoof symbols render in Noto Sans Lisu where available;
          codepoints are ALWAYS shown so evidence survives any font failure. */}
      {assets && assets.spoofTokens && assets.spoofTokens.length > 0 && (
        <View style={{ backgroundColor: '#fef2f2', borderRadius: 6, padding: 10, marginBottom: 12, borderWidth: 1, borderColor: '#fecaca' }}>
          <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: red, marginBottom: 4 }}>
            Unicode Spoofing Evidence: {assets.spoofTokens.length} fake token{assets.spoofTokens.length > 1 ? 's' : ''} detected
          </Text>
          {assets.spoofTokens.slice(0, 6).map((t, i) => {
            const display = t.symbolDisplay || t.symbol;
            const composed = display !== t.symbol;
            return (
              <View key={i} style={{ marginBottom: 3 }}>
                <Text style={{ fontSize: 7, color: slate900 }}>
                  <Text style={{ fontFamily: fontForScript(t.scriptCategory) }}>{display}</Text>
                  {' '}— mimicking {t.mimicsLegitimate} ({t.scriptCategory}, {t.count} transfer{t.count > 1 ? 's' : ''})
                </Text>
                <Text style={{ ...s.mono, fontSize: 6, color: slate600 }}>
                  {composed ? 'Original: ' : 'Codepoints: '}{getCodepoints(t.symbol)}
                </Text>
                {composed && (
                  <Text style={{ ...s.mono, fontSize: 6, color: slate600 }}>Display: {getCodepoints(display)}</Text>
                )}
              </View>
            );
          })}
          <Text style={{ fontSize: 7, color: slate400, marginTop: 3 }}>
            These tokens use non-Latin characters to impersonate real currencies. See Attack Technique Analysis for full detail.
          </Text>
        </View>
      )}

      {/* 2026-05-21 (Phase 2.5 / Part 4): footnote — apparent net balance
          understates the true loss when funds went to poisoning spoofs. */}
      {data.attackTechniques?.addressPoisoning?.totalMisdirectedToSecondarySpoofs > 0 && (
        <View style={{ backgroundColor: '#f8fafc', borderRadius: 6, padding: 8, marginBottom: 12, borderLeftWidth: 3, borderLeftColor: amber }}>
          <Text style={{ fontSize: 7, color: slate600, lineHeight: 1.4 }}>
            Note: The apparent net balance understates the true economic loss. {data.attackTechniques.addressPoisoning.totalMisdirectedToSecondarySpoofs.toFixed(2)} {data.attackTechniques.addressPoisoning.campaigns[0]?.primaryToken || ''} was sent to address-poisoning spoof addresses (see Attack Technique Analysis). These funds were lost to visual address confusion, not legitimately transferred — the full loss to this victim exceeds the on-chain net figure.
          </Text>
        </View>
      )}

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
                        <Text style={{ fontSize: 6, color: 'white', fontFamily: 'Helvetica-Bold', backgroundColor: amber, paddingHorizontal: 4, paddingVertical: 1, borderRadius: 2 }}>⚠ MISDIRECTION</Text>
                      ) : isHighlight && (
                        <Text style={{ fontSize: 6, color: red, fontFamily: 'Helvetica-Bold', backgroundColor: '#fef2f2', paddingHorizontal: 4, paddingVertical: 1, borderRadius: 2 }}>KEY EVENT</Text>
                      )}
                    </View>
                    <Text style={{ fontSize: 8, color: slate600, marginTop: 1 }}>{event.description}</Text>
                    {isMisdirection && (
                      <Text style={{ fontSize: 6.5, color: amber, marginTop: 0.5, fontStyle: 'italic' }}>
                        Sent to an address-poisoning spoof — not the intended recipient.
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
  const isVictim = data.narrative.walletType === 'victim';
  const effectiveRisk = isVictim ? 'VICTIM_PATTERN' : (pa?.overallRisk || 'CLEAN');
  const effectiveLabel = isVictim ? 'VICTIM PATTERN DETECTED' : overallRiskLabel(pa?.overallRisk || 'CLEAN');
  const effectiveColor = isVictim ? amber : overallRiskColor(pa?.overallRisk || 'CLEAN');
  const bannerBg = isVictim ? '#fffbeb' : pa?.overallRisk === 'CLEAN' ? '#f0fdf4' : pa?.overallRisk === 'SUSPICIOUS' ? '#fffbeb' : '#fef2f2';
  const bannerBorder = isVictim ? '#fde68a' : pa?.overallRisk === 'CLEAN' ? '#bbf7d0' : pa?.overallRisk === 'SUSPICIOUS' ? '#fde68a' : '#fecaca';

  return (
    <Page size="A4" style={s.page}>
      <Header data={data} t={t} />
      <Text style={s.h2}>{t.sections.behavioralPatterns}</Text>
      <Text style={{ ...s.p, marginBottom: 12 }}>
        {isVictim
          ? 'The subject wallet was classified as a victim wallet. The patterns below describe characteristics of the counterparty cluster that received funds, not allegations against the subject wallet.'
          : 'Automated detection of scam-associated behavioral patterns based on transaction timing, flow structure, and counterparty analysis.'}
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
          <Text style={{ fontSize: 8, color: slate400, letterSpacing: 1, marginBottom: 6 }}>OVERALL BEHAVIORAL ASSESSMENT</Text>
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
            {isVictim
              ? 'The subject wallet shows the behavioral fingerprint of a victim wallet (CEX-funded, low-history, rapid forwarding to a small unknown counterparty set). Detected patterns characterise the counterparty cluster — not the subject.'
              : pa.interpretation}
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

      <Footer data={data} t={t} />
    </Page>
  );
};

/* ═══════════════════════════════════════════════════════════════
   PAGE 6: WALLET ANALYTICS
   ═══════════════════════════════════════════════════════════════ */
const AnalyticsPage = ({ data, t }: { data: ReportData; t: ReportTranslations }) => {
  return (
  <Page size="A4" style={s.page}>
    <Header data={data} t={t} />
    <Text style={s.h2}>{t.sections.walletAnalytics}</Text>

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

  return (
    <Page size="A4" style={s.page}>
      <Header data={data} t={t} />
      <Text style={s.h2}>{t.sections.addressVerification}</Text>
      <Text style={{ ...s.p, marginBottom: 10 }}>
        Top counterparty addresses (by volume) cross-referenced with multiple verification sources: LedgerHound Scam Database, OFAC SDN, Chainabuse community reports, GoPlus Security risk flags, and our curated Etherscan Fake_Phishing list. Sources are queried independently; agreement across sources increases confidence.
      </Text>

      {data.externalIntelligenceDegraded && (
        <View style={{ backgroundColor: '#fffbeb', borderRadius: 6, padding: 8, marginBottom: 10, borderWidth: 1, borderColor: '#fde68a' }}>
          <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', color: amber, marginBottom: 2 }}>External intelligence partially unavailable</Text>
          <Text style={{ fontSize: 7, color: slate600, lineHeight: 1.4 }}>
            One or more external sources (Chainabuse, GoPlus, OFAC) were unavailable during report generation. Some labels may be incomplete. Internal database matches and curated Etherscan tags are unaffected.
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
              <Text style={{ fontSize: 6, color: slate400 }}>{r.labels.length} source{r.labels.length === 1 ? '' : 's'}</Text>
            </View>
            {r.labels.length === 0 ? (
              <Text style={{ fontSize: 7, color: slate400, fontStyle: 'italic' }}>No matches in any verification source.</Text>
            ) : (
              r.labels.slice(0, 4).map((l, j) => (
                <Text key={j} style={{ fontSize: 7, color: slate600, marginBottom: 1, lineHeight: 1.3 }}>
                  [{SOURCE_LABELS[l.source] || l.source}] {l.tag}
                  {l.reportCount ? `  (${l.reportCount} reports)` : ''}
                  {l.confidence < 1 ? `  conf=${Math.round(l.confidence * 100)}%` : ''}
                </Text>
              ))
            )}
          </View>
        );
      })}

      {remaining > 0 && (
        <Text style={{ fontSize: 7, color: slate400, marginTop: 4, fontStyle: 'italic' }}>
          + {remaining} more counterpart{remaining === 1 ? 'y' : 'ies'} analyzed but not shown (capped at {MAX_ENTRIES}). Full data available via the LedgerHound API.
        </Text>
      )}

      <View style={{ marginTop: 'auto', paddingTop: 10 }}>
        <Text style={{ fontSize: 6, color: slate400, lineHeight: 1.4 }}>
          Methodology: Labels are aggregated from independent sources. OFAC SDN entries reflect the US Treasury sanctions list as published by the github mirror `0xB10C/ofac-sanctioned-digital-currency-addresses`. Chainabuse confidence scales with community report count. GoPlus scores reflect on-chain risk signals (phishing, blacklisting, stolen-funds attribution). Federation results are cached in S3 for 7 days.
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
  // Skip page entirely when nothing detected (no "all clear" placeholder).
  if ((!ap || !ap.detected) && (!us || !us.detected)) return null;

  return (
    <Page size="A4" style={s.page}>
      <Header data={data} t={t} />
      <Text style={s.h2}>{t.sections.attackTechnique}</Text>
      <Text style={{ ...s.p, marginBottom: 10 }}>
        Forensic analysis identified specific scam techniques used against this wallet. These are professional methods employed by organized cryptocurrency fraud operations and constitute critical evidence for law enforcement and civil litigation.
      </Text>

      {/* ─── Address Poisoning Campaign (Phase 2.5 model) ─── */}
      {ap && ap.detected && ap.campaigns.map((campaign, ci) => (
        <View key={ci} style={{ marginBottom: 14 }}>
          <Text style={{ ...s.h3, color: red, marginBottom: 4 }}>Address Poisoning Campaign Detected</Text>
          <Text style={{ fontSize: 8, color: slate600, lineHeight: 1.5, marginBottom: 8 }}>
            A coordinated address poisoning attack was identified. The attacker deployed a cluster of visually similar addresses (sharing prefix and suffix patterns) to confuse the victim and distribute fraudulent inflows across multiple wallets — making blacklisting and seizure more difficult. All addresses in this cluster are attacker-controlled; the highest-volume address is the main collector, the rest are secondary spoofs.
          </Text>

          {/* Cluster overview */}
          <View style={{ ...s.card, padding: 8, marginBottom: 8 }}>
            <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', color: slate900, marginBottom: 4 }}>Vanity Cluster: {campaign.vanityPattern}</Text>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              <AttackStat label="CLUSTER ADDRESSES" value={String(campaign.totalClusterAddresses)} />
              <AttackStat label="SUCCESSFUL SPOOFS" value={String(campaign.successfulMisdirections)} highlight={campaign.successfulMisdirections > 0} />
              <AttackStat label={`TO CLUSTER (${campaign.primaryToken})`} value={fmtEth(campaign.totalSentByVictim)} highlight />
              <AttackStat label={`TO SPOOFS (${campaign.primaryToken})`} value={fmtEth(campaign.totalToSecondarySpoofs)} highlight={campaign.totalToSecondarySpoofs > 0} />
            </View>
            {campaign.hasFakePhishingTag && (
              <Text style={{ fontSize: 7, color: red, marginTop: 4 }}>
                {campaign.fakePhishingAddresses.length} address(es) in this cluster are officially tagged by Etherscan as Fake_Phishing.
              </Text>
            )}
          </View>

          {/* Main collector */}
          <View style={{ backgroundColor: '#fef2f2', borderRadius: 6, padding: 8, marginBottom: 8, borderWidth: 1, borderColor: '#fecaca' }}>
            <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', color: red, marginBottom: 2 }}>Main Collector (Highest Volume)</Text>
            <Text style={{ ...s.mono, fontSize: 6.5, color: slate900 }}>{campaign.mainCollector.address}</Text>
            <Text style={{ fontSize: 7, color: slate600, marginTop: 2 }}>
              Received {campaign.mainCollector.totalReceivedFromSubject.toFixed(2)} {campaign.mainCollector.totalReceivedToken} across {campaign.mainCollector.transactionCount} transaction(s) — the primary scam wallet in this fraud network.
            </Text>
            {campaign.mainCollector.etherscanFakePhishingTag && (
              <Text style={{ fontSize: 6.5, color: red, marginTop: 1 }}>Etherscan: {campaign.mainCollector.etherscanFakePhishingTag}</Text>
            )}
          </View>

          {/* Secondary spoofs */}
          {campaign.secondarySpoofs.length > 0 && (
            <View>
              <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', color: slate900, marginBottom: 2 }}>Secondary Spoofs (Address Poisoning Targets)</Text>
              <Text style={{ fontSize: 7, color: slate600, lineHeight: 1.4, marginBottom: 4 }}>
                These addresses share the same visual pattern as the main collector but are separate wallets. Funds the victim sent here indicate successful confusion induced by the poisoning attack.
              </Text>
              {campaign.secondarySpoofs.slice(0, 10).map((spoof, si) => {
                const misdirected = spoof.totalReceivedFromSubject > 0;
                return (
                  <View key={si} style={{ ...s.card, padding: 5, marginBottom: 4, borderLeftWidth: 2, borderLeftColor: misdirected ? red : slate400 }}>
                    <Text style={{ ...s.mono, fontSize: 6, color: misdirected ? red : slate600 }}>✖ {spoof.address}</Text>
                    <Text style={{ fontSize: 6.5, color: slate900, marginTop: 1 }}>
                      {misdirected
                        ? `MISDIRECTION CONFIRMED: ${spoof.totalReceivedFromSubject.toFixed(2)} ${spoof.totalReceivedToken} across ${spoof.transactionCount} tx`
                        : 'No funds received (poisoning only)'}
                      {spoof.receivedDustFromCluster ? ' · dusted the victim' : ''}
                    </Text>
                    <Text style={{ fontSize: 6, color: slate400, marginTop: 0.5 }}>
                      Differs from main collector at {firstDifferingChar(campaign.mainCollector.address, spoof.address)}
                    </Text>
                    {spoof.etherscanFakePhishingTag && (
                      <Text style={{ fontSize: 6, color: red }}>Etherscan: {spoof.etherscanFakePhishingTag}</Text>
                    )}
                  </View>
                );
              })}
              {campaign.secondarySpoofs.length > 10 && (
                <Text style={{ fontSize: 6, color: slate400 }}>+ {campaign.secondarySpoofs.length - 10} additional spoof addresses in cluster</Text>
              )}
            </View>
          )}

          {/* Forensic interpretation */}
          <View style={{ ...s.card, padding: 8, marginTop: 6 }}>
            <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', color: slate900, marginBottom: 2 }}>Forensic Interpretation</Text>
            <Text style={{ fontSize: 7, color: slate600, lineHeight: 1.4 }}>
              The vanity pattern ({campaign.vanityPattern}) shared across {campaign.totalClusterAddresses} addresses is statistically improbable by chance (~1 in 4.3 billion per pair for 8 matching characters). This is characteristic of a deliberate, coordinated address poisoning campaign by an organized fraud operation, with three goals: (1) confusion — trick the victim into copying the wrong address from history; (2) risk distribution — spread inflows across wallets to evade blacklisting; (3) investigation obfuscation — fragment the destination to complicate tracing.
            </Text>
          </View>
        </View>
      ))}

      {/* ─── Unicode Spoofing ─── */}
      {us && us.detected && (
        <View style={{ marginBottom: 10 }}>
          <Text style={{ ...s.h3, color: red, marginBottom: 4 }}>Unicode Spoofing Attack</Text>
          <Text style={{ fontSize: 8, color: slate600, lineHeight: 1.5, marginBottom: 8 }}>
            Fake tokens use characters from non-Latin scripts (Lisu Letters, Cyrillic, Greek) that visually resemble legitimate ticker symbols. For example, &quot;<Text style={{ fontFamily: LISU_FONT_FAMILY }}>{'ꓴꓢꓓꓔ'}</Text>&quot; (Lisu Letters, U+A4F4 U+A4E2 U+A4D3 U+A4D4) appears identical to &quot;USDT&quot; but is a worthless contract. Attackers send these fake &quot;deposits&quot; to fabricate the appearance of returns or refunds in wallet history.
          </Text>

          <View style={{ flexDirection: 'row', gap: 6, marginBottom: 8 }}>
            <AttackStat label="UNIQUE FAKE TOKENS" value={String(us.uniqueSpoofSymbols)} highlight />
            <AttackStat label="SPOOF TRANSFERS" value={String(us.totalSpoofTokenTransfers)} />
          </View>

          {us.evidence.slice(0, 6).map((e, i) => {
            const display = e.fakeSymbolDisplay || e.fakeSymbol;
            const composed = display !== e.fakeSymbol;
            return (
              <View key={i} style={{ ...s.card, padding: 6, marginBottom: 5, borderLeftWidth: 3, borderLeftColor: red }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                  <Text style={{ fontFamily: fontForScript(e.scriptCategory), fontSize: 11, color: slate900 }}>{display}</Text>
                  <Text style={{ fontSize: 8, color: slate600, marginLeft: 6 }}>— masquerading as </Text>
                  <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', color: red }}>{e.mimicsLegitimate}</Text>
                </View>
                <Text style={{ ...s.mono, fontSize: 6.5, color: slate600 }}>
                  {composed ? 'Original Unicode: ' : 'Unicode: '}{e.fakeSymbolCodepoints}
                </Text>
                {composed && (
                  <Text style={{ ...s.mono, fontSize: 6.5, color: slate600 }}>Display (NFC): {e.fakeSymbolDisplayCodepoints}</Text>
                )}
                <Text style={{ fontSize: 6.5, color: slate600 }}>Script: {e.scriptCategory} {'·'} {e.occurrences} transfer{e.occurrences > 1 ? 's' : ''}{e.sourceAddresses.length ? ` from ${e.sourceAddresses.length} address(es)` : ''}</Text>
                {composed && (
                  <Text style={{ fontSize: 6, color: slate400, marginTop: 1, fontStyle: 'italic' }}>
                    Uses combining diacritical marks; display shows NFC-normalised form for readability — original byte sequence preserved above.
                  </Text>
                )}
                {e.transactionExamples.length > 0 && (
                  <Text style={{ fontSize: 6, color: slate400, marginTop: 1 }}>
                    e.g. {(e.transactionExamples[0].timestamp || '').split('T')[0]} {'·'} from {shortAddr(e.transactionExamples[0].from)}
                  </Text>
                )}
              </View>
            );
          })}
        </View>
      )}

      <View style={{ marginTop: 'auto', paddingTop: 8 }}>
        <Text style={{ fontSize: 6, color: slate400, lineHeight: 1.4 }}>
          Methodology: Address poisoning detection matches counterparty addresses against actual recipients on a 4-character prefix + 4-character suffix basis (8 hex characters of visual overlap). Unicode spoofing detection normalises token symbols (NFKD decomposition + a curated confusable-character map across Lisu, Cyrillic, Greek and fullwidth Latin) and compares against legitimate tickers. Codepoints are shown in standard U+ notation so the evidence is verifiable independent of font rendering.
        </Text>
      </View>

      <Footer data={data} t={t} />
    </Page>
  );
};

const EntitiesExitPage = ({ data, t }: { data: ReportData; t: ReportTranslations }) => {
  const exits = data.exitPointAnalysis;

  return (
    <Page size="A4" style={s.page}>
      <Header data={data} t={t} />
      <Text style={s.h2}>{t.sections.entityIdentification}</Text>

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
          <Text style={{ fontSize: 8, color: slate600, lineHeight: 1.4 }}>KYC exchanges maintain identity records that may be obtainable via legal subpoena (subject to exchange policy and data availability).</Text>
        </View>
      )}

      <View style={s.sectionDivider} />

      {/* EXIT POINT ANALYSIS */}
      <Text style={s.h2}>{t.sections.exitPointAnalysis}</Text>
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

  return (
    <Page size="A4" style={s.page}>
      <Header data={data} t={t} />
      <Text style={s.h2}>{t.sections.fundFlow}</Text>
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
                // 2026-05-21 (Phase 2.5 / Part 5): spoof edges drawn amber + ⚠.
                const color = edge.isSpoof ? amber : edge.direction === 'OUT' ? red : green;
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

      <Footer data={data} t={t} />
    </Page>
  );
};

/* ═══════════════════════════════════════════════════════════════
   PAGE 9/10: TRANSACTION HISTORY (filtered to real assets, top 30)
   ═══════════════════════════════════════════════════════════════ */
const TransactionsPage = ({ data, t }: { data: ReportData; t: ReportTranslations }) => {
  return (
  <Page size="A4" style={s.page} wrap>
    <Header data={data} t={t} />
    <Text style={s.h2}>{t.sections.transactionHistory} (Top {data.transactions.length})</Text>

    <View style={s.table}>
      <View style={s.tableHeader} fixed>
        <Text style={{ ...s.th, width: '14%' }}>Date</Text>
        <Text style={{ ...s.th, width: '8%' }}>Dir</Text>
        <Text style={{ ...s.th, width: '26%' }}>From</Text>
        <Text style={{ ...s.th, width: '26%' }}>To</Text>
        <Text style={{ ...s.th, width: '14%' }}>Value</Text>
        <Text style={{ ...s.th, width: '12%' }}>Token</Text>
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
        ⚠ Highlighted rows are Unicode-spoof tokens (fake symbols mimicking real currencies) — see Attack Technique Analysis.
      </Text>
    )}

    {data.spamFiltered > 0 && (
      <Text style={{ fontSize: 7, color: slate400, fontStyle: 'italic', marginTop: 6 }}>
        Showing legitimate transfers only. {data.spamFiltered} spam/airdrop token transfers were filtered from this analysis.
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

      {/* Overall recovery — uses structured recoveryAssessment.
          2026-05-20: Score hard-capped at 35%; disclaimer is mandatory. */}
      <View style={{ backgroundColor: '#f1f5f9', borderRadius: 6, padding: 12, marginBottom: 14, alignItems: 'center' }}>
        <Text style={{ fontSize: 8, color: slate400, letterSpacing: 1, marginBottom: 6 }}>OVERALL RECOVERY PROBABILITY</Text>
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
          <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: 'white', marginBottom: 3 }}>OFAC COMPLIANCE NOTICE</Text>
          <Text style={{ fontSize: 8, color: '#fecaca', lineHeight: 1.4 }}>Interaction with SDN addresses triggers blocking obligations. Consult OFAC compliance counsel.</Text>
        </View>
      )}

      {/* 2026-05-21 (Phase 2.5 Fix 2): structured, entry/exit-aware
          recommendations. Resolves the contradiction where the report both
          said "Binance = victim entry" (p.4) and "Subpoena Binance to
          identify the account holder" (here) — which could mislead counsel
          into thinking a Binance subpoena yields the scammer's identity. */}
      <Text style={s.h3}>Recommended Actions</Text>
      {(() => {
        const ea = data.exchangeAnalysis;
        const entryBrand = ea?.entryPoints?.[0]?.parentEntity;
        const usesUsdt = (data.assetSummary?.realAssets || []).some(a => a.symbol === 'USDT')
          || (data.attackTechniques?.unicodeSpoofing?.evidence || []).some(e => e.mimicsLegitimate === 'USDT')
          || (data.attackTechniques?.addressPoisoning?.campaigns || []).some(c => c.primaryToken === 'USDT');
        const items: { bold: string; text: string }[] = [];

        if (ea?.hasEntryKyc && entryBrand) {
          items.push({
            bold: `${entryBrand} Entry Point (Victim Funding):`,
            text: `The victim funded this wallet via ${entryBrand}. A subpoena to ${entryBrand} compliance can confirm victim identity for case-file completeness, but does NOT identify the scammer. Use this primarily for (a) victim identity verification in legal proceedings, and (b) detecting whether the scammer ever transferred funds back to a ${entryBrand} account.`,
          });
        }
        if (!ea?.hasExitKyc) {
          items.push({
            bold: 'Counterparty Exit Trace (required for scammer identification):',
            text: 'The fraud cluster controls the funds within this wallet’s transaction history. Identifying the scammer’s cash-out exchange requires tracing one or more hops beyond the cluster — this expanded analysis is the recommended next investigative step.',
          });
        } else {
          items.push({
            bold: 'KYC Exit Point Identified:',
            text: `Funds reached ${ea.exitPoints[0]?.parentEntity || 'a KYC exchange'}. File an urgent preservation/discovery request with that exchange’s compliance team to pursue the account holder behind the cash-out.`,
          });
        }
        items.push({
          bold: 'File FBI IC3 / Local Police Report:',
          text: 'Report at ic3.gov (if US-based) or via your local cybercrime unit. Reference this Case ID and attach this report as supporting documentation.',
        });
        items.push({
          bold: 'Exchange Compliance Notification:',
          text: 'Submit a preservation request to the compliance teams of the identified exchanges. Even absent a scammer KYC exit, this creates an official record and may trigger internal blacklisting.',
        });
        if (usesUsdt) {
          items.push({
            bold: 'Token Issuer Coordination:',
            text: 'For USDT-denominated transfers to flagged wallets, contact Tether legal (legal@tether.to) to request blacklist inclusion / freeze of the implicated addresses.',
          });
        }
        items.push({
          bold: 'Court-Certified Forensic Investigation:',
          text: 'For court testimony, certified methodology, or an expanded counterparty trace, contact LedgerHound at contact@ledgerhound.vip for a full forensic engagement.',
        });

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

  return (
    <Page size="A4" style={s.page}>
      <Header data={data} t={t} />
      <Text style={s.h2}>{t.sections.actionableSteps}</Text>

      {/* Priority banner */}
      <View style={{ backgroundColor: hasExchanges ? '#f0fdf4' : '#fef2f2', borderRadius: 6, padding: 12, marginBottom: 14, borderWidth: 1, borderColor: hasExchanges ? '#bbf7d0' : '#fecaca' }}>
        <Text style={{ fontSize: 11, fontFamily: 'Helvetica-Bold', color: hasExchanges ? green : red, marginBottom: 4 }}>
          {hasExchanges ? 'RECOVERY PATH IDENTIFIED' : 'RECOVERY REQUIRES INVESTIGATION'}
        </Text>
        <Text style={{ fontSize: 9, color: slate600, lineHeight: 1.5 }}>
          {hasExchanges
            ? `Funds were traced to KYC-regulated exchange(s). The account holder identity may be obtainable through legal process (subject to exchange cooperation and data availability). Time-sensitive action is required to prevent fund withdrawal.`
            : `No direct exchange exits identified. Recovery may require advanced tracing, law enforcement cooperation, or specialized forensic analysis.`}
        </Text>
      </View>

      {/* Step 1: Exchange Compliance Contact */}
      {hasExchanges && (
        <View style={{ ...s.card, marginBottom: 10, borderLeftWidth: 3, borderLeftColor: blue }}>
          <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', color: blue, marginBottom: 2 }}>STEP 1: Submit Preservation Request to Exchange Compliance</Text>
          <Text style={{ fontSize: 7, color: slate600, lineHeight: 1.4, marginBottom: 6 }}>
            The exchange(s) below hold the relevant KYC records AND the technical ability to flag the receiving wallets in their internal blacklist. Even where the scammer did not cash out through this exchange directly, an early preservation request becomes part of the official record.
          </Text>
          {exchangeBrands.slice(0, 3).map((b, i) => (
            <View key={i} style={{ backgroundColor: '#f8fafc', borderRadius: 4, padding: 8, marginBottom: 6, borderWidth: 1, borderColor: '#e2e8f0' }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 }}>
                <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: slate900 }}>{b.brand}</Text>
                <Text style={{ fontSize: 8, color: slate600 }}>
                  {b.interactions} interaction(s) · {b.addresses.length} hot wallet{b.addresses.length > 1 ? 's' : ''}
                </Text>
              </View>
              <Text style={{ ...s.mono, fontSize: 7, color: slate600, marginBottom: 3 }}>
                {b.addresses.slice(0, 3).map(a => shortAddr(a)).join(', ')}{b.addresses.length > 3 ? ` (+${b.addresses.length - 3} more)` : ''}
              </Text>
              {b.email ? (
                <Text style={{ fontSize: 8, color: blue }}>{b.email}</Text>
              ) : (
                <Text style={{ fontSize: 7, color: slate400, fontStyle: 'italic' }}>
                  No published law-enforcement contact recorded — consult attorney for proper service channel.
                </Text>
              )}
            </View>
          ))}
          <Text style={{ fontSize: 8, color: slate600, lineHeight: 1.5, marginTop: 4 }}>
            Send a preservation request to the compliance department referencing your police report number and this case ID ({data.caseId}). Request immediate account freeze and subscriber information disclosure.
          </Text>
        </View>
      )}

      {/* Step 2: Law Enforcement */}
      <View style={{ ...s.card, marginBottom: 10, borderLeftWidth: 3, borderLeftColor: amber }}>
        <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', color: amber, marginBottom: 6 }}>
          {hasExchanges ? 'STEP 2' : 'STEP 1'}: File Law Enforcement Reports
        </Text>
        <Text style={{ fontSize: 8, color: slate900, paddingLeft: 8, marginBottom: 3 }}>{'\u2022'} FBI IC3 complaint — ic3.gov (reference this report)</Text>
        <Text style={{ fontSize: 8, color: slate900, paddingLeft: 8, marginBottom: 3 }}>{'\u2022'} Local police report — needed for exchange compliance requests</Text>
        <Text style={{ fontSize: 8, color: slate900, paddingLeft: 8, marginBottom: 3 }}>{'\u2022'} FTC report — reportfraud.ftc.gov</Text>
        {data.narrative.walletType === 'transit' && (
          <Text style={{ fontSize: 8, color: slate900, paddingLeft: 8, marginBottom: 3 }}>{'\u2022'} Request SAR filing — transit wallet pattern indicates organized fraud</Text>
        )}
        <Text style={{ fontSize: 8, color: slate600, lineHeight: 1.5, marginTop: 4 }}>
          Include Case ID {data.caseId}, wallet address, and attach this forensic report as evidence.
        </Text>
      </View>

      {/* Step 3: Legal Action */}
      <View style={{ ...s.card, marginBottom: 10, borderLeftWidth: 3, borderLeftColor: purple }}>
        <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', color: purple, marginBottom: 6 }}>
          {hasExchanges ? 'STEP 3' : 'STEP 2'}: Legal Proceedings
        </Text>
        {hasExchanges ? (
          <>
            <Text style={{ fontSize: 8, color: slate900, paddingLeft: 8, marginBottom: 3 }}>{'\u2022'} Retain attorney for emergency subpoena to {exchangeBrands[0].brand}</Text>
            <Text style={{ fontSize: 8, color: slate900, paddingLeft: 8, marginBottom: 3 }}>{'\u2022'} Request account holder identity: name, address, government ID, bank info</Text>
            <Text style={{ fontSize: 8, color: slate900, paddingLeft: 8, marginBottom: 3 }}>{'\u2022'} File civil asset recovery proceedings once identity obtained</Text>
            <Text style={{ fontSize: 8, color: slate900, paddingLeft: 8, marginBottom: 3 }}>{'\u2022'} Send Preservation Letter to freeze suspect accounts</Text>
          </>
        ) : (
          <>
            <Text style={{ fontSize: 8, color: slate900, paddingLeft: 8, marginBottom: 3 }}>{'\u2022'} Consult attorney experienced in cryptocurrency fraud recovery</Text>
            <Text style={{ fontSize: 8, color: slate900, paddingLeft: 8, marginBottom: 3 }}>{'\u2022'} Explore advanced blockchain tracing and cross-chain analysis</Text>
            <Text style={{ fontSize: 8, color: slate900, paddingLeft: 8, marginBottom: 3 }}>{'\u2022'} Consider international cooperation if funds crossed jurisdictions</Text>
          </>
        )}
      </View>

      {/* Step 4: Evidence Preservation */}
      <View style={{ ...s.card, marginBottom: 10, borderLeftWidth: 3, borderLeftColor: slate400 }}>
        <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', color: slate600, marginBottom: 6 }}>
          {hasExchanges ? 'STEP 4' : 'STEP 3'}: Preserve Evidence
        </Text>
        <Text style={{ fontSize: 8, color: slate900, paddingLeft: 8, marginBottom: 3 }}>{'\u2022'} Save all communications with the scammer (screenshots, emails, messages)</Text>
        <Text style={{ fontSize: 8, color: slate900, paddingLeft: 8, marginBottom: 3 }}>{'\u2022'} Preserve this forensic report as supporting documentation for legal proceedings</Text>
        <Text style={{ fontSize: 8, color: slate900, paddingLeft: 8, marginBottom: 3 }}>{'\u2022'} Document the timeline of events in writing</Text>
        <Text style={{ fontSize: 8, color: slate900, paddingLeft: 8 }}>{'\u2022'} Do not communicate with the scammer further</Text>
      </View>

      {/* CTA */}
      <View style={{ ...s.card, backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#bfdbfe' }}>
        <Text style={{ fontSize: 11, fontFamily: 'Helvetica-Bold', color: blue, marginBottom: 6 }}>Need Help Executing These Steps?</Text>
        <Text style={{ fontSize: 9, color: slate600, lineHeight: 1.5 }}>
          LedgerHound offers certified forensic investigations with expert testimony, full chain-of-custody documentation, and direct coordination with law enforcement and exchanges.
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
  return (
  <Page size="A4" style={s.page}>
    <Header data={data} t={t} />
    <Text style={s.h2}>{t.sections.disclaimer}</Text>

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

    <Footer data={data} t={t} />
  </Page>
  );
};

/* ═══════════════════════════════════════════════════════════════
   DOCUMENT
   ═══════════════════════════════════════════════════════════════ */
export const ReportDocument = ({ data, locale }: { data: ReportData; locale?: ReportLocale | string }) => {
  const hasCrossChain = data.crossChainTrace?.detected === true;
  // 2026-05-20 Phase 1: only render the new federation page when at least
  // one counterparty was analyzed. Avoids a blank section on tiny wallets.
  const hasAddressLabels = (data.addressLabels?.length ?? 0) > 0;
  // Phase 2: only render the attack page when a technique was detected.
  const at = data.attackTechniques;
  const hasAttackTechniques = !!at && (at.addressPoisoning?.detected || at.unicodeSpoofing?.detected);
  // Phase 3: resolve translations and provide via context (English default).
  const t = getReportTranslations(locale);

  return (
    <Document>
      <CoverPage data={data} t={t} />
      <SummaryPage data={data} t={t} />
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
      <ActionableStepsPage data={data} t={t} />
      <DisclaimerPage data={data} t={t} />
    </Document>
  );
};
