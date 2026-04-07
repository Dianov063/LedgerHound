import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import type { CountryResearch, CaseData } from './types';
import { getPdfTranslations, type PdfTranslations } from './pdf-i18n';

/* Register Noto Sans — FULL font files with Latin + Cyrillic + Greek + Vietnamese */
Font.register({
  family: 'NotoSans',
  fonts: [
    {
      src: 'https://cdn.jsdelivr.net/gh/notofonts/notofonts.github.io@main/fonts/NotoSans/hinted/ttf/NotoSans-Regular.ttf',
      fontWeight: 400,
    },
    {
      src: 'https://cdn.jsdelivr.net/gh/notofonts/notofonts.github.io@main/fonts/NotoSans/hinted/ttf/NotoSans-Bold.ttf',
      fontWeight: 700,
    },
  ],
});

Font.registerHyphenationCallback((word: string) => [word]);

/* ─── Colors ─── */
const blue = '#2563eb';
const slate900 = '#0f172a';
const slate600 = '#475569';
const slate400 = '#94a3b8';
const slate200 = '#e2e8f0';
const red = '#dc2626';
const green = '#16a34a';
const amber = '#d97706';

/* ─── Base Styles ─── */
const s = StyleSheet.create({
  page: { padding: 50, fontFamily: 'NotoSans', fontSize: 10, color: slate900 },
  bold: { fontFamily: 'NotoSans', fontWeight: 700 },
  // Section separator
  separator: { borderBottomWidth: 1.5, borderBottomColor: slate900, marginBottom: 10, marginTop: 4 },
  thinSep: { borderBottomWidth: 0.5, borderBottomColor: slate200, marginBottom: 8, marginTop: 4 },
  // Footer
  footer: { position: 'absolute', bottom: 30, left: 50, right: 50, flexDirection: 'row', justifyContent: 'space-between', fontSize: 7, color: slate400, borderTopWidth: 0.5, borderTopColor: slate200, paddingTop: 8 },
});

/* ─── Shared Components ─── */
const DocHeader = ({ title, subtitle, caseData }: { title: string; subtitle: string; caseData: CaseData }) => (
  <View style={{ marginBottom: 16, paddingBottom: 12, borderBottomWidth: 2, borderBottomColor: slate900 }}>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <View>
        <Text style={{ fontSize: 16, fontFamily: 'NotoSans', fontWeight: 700, color: slate900, marginBottom: 2 }}>{title}</Text>
        <Text style={{ fontSize: 10, color: slate600 }}>{subtitle}</Text>
      </View>
      <View style={{ alignItems: 'flex-end' as any }}>
        <Text style={{ fontSize: 9, color: slate600 }}>Case ID: {caseData.caseId}</Text>
        <Text style={{ fontSize: 9, color: slate600 }}>Date: {caseData.date}</Text>
      </View>
    </View>
  </View>
);

const DocFooter = ({ caseData, pageLabel, t }: { caseData: CaseData; pageLabel: string; t?: PdfTranslations }) => (
  <View style={s.footer} fixed>
    <Text>{(t?.common.prepared_with || 'Prepared with LedgerHound')} · ledgerhound.vip · {caseData.caseId}</Text>
    <Text>{pageLabel}</Text>
  </View>
);

const SectionTitle = ({ children }: { children: string }) => (
  <View>
    <Text style={{ fontSize: 11, fontFamily: 'NotoSans', fontWeight: 700, color: slate900, marginTop: 12, marginBottom: 2 }}>{children}</Text>
    <View style={s.separator} />
  </View>
);

const Field = ({ label, value, mono }: { label: string; value?: string; mono?: boolean }) => (
  <View style={{ flexDirection: 'row', marginBottom: 3, paddingLeft: 2 }}>
    <Text style={{ fontSize: 9, color: slate400, width: 130 }}>{label}:</Text>
    <Text style={{ fontSize: 9, color: slate900, flex: 1, fontFamily: mono ? 'Courier' : 'NotoSans', fontWeight: mono ? 400 : 700 }}>{value || '[TO BE FILLED]'}</Text>
  </View>
);

const Checkbox = ({ label, checked }: { label: string; checked?: boolean }) => (
  <Text style={{ fontSize: 9, color: slate900, marginBottom: 3, paddingLeft: 8 }}>{checked ? '\u2611' : '\u2610'} {label}</Text>
);

const fmtMoney = (amount: number, currency: string = 'USD') =>
  `${currency} ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const shortAddr = (addr: string) =>
  addr && addr.length > 20 ? `${addr.slice(0, 10)}...${addr.slice(-8)}` : addr || '';

/* ─── Scam type matching ─── */
const scamKeywords: [string, string[]][] = [
  ['romance', ['romance', 'pig']],
  ['investment', ['fake', 'platform']],
  ['ponzi', ['ponzi', 'pyramid', 'investment']],
  ['phishing', ['phishing', 'drain']],
  ['rugpull', ['rug', 'exit']],
];

const isScamChecked = (scamType: string, keywords: string[]) =>
  scamType ? keywords.some(k => scamType.toLowerCase().includes(k)) : false;

const getLocalizedScamTypes = (t: PdfTranslations): [string, string[]][] => [
  [t.police.fraud_romance, ['romance', 'pig']],
  [t.police.fraud_investment, ['fake', 'platform']],
  [t.police.fraud_ponzi, ['ponzi', 'pyramid', 'investment']],
  [t.police.fraud_phishing, ['phishing', 'drain']],
  [t.police.fraud_rugpull, ['rug', 'exit']],
];

const fraudTypeLocalized = (scamType: string, t?: PdfTranslations) => {
  const types = t ? getLocalizedScamTypes(t) : getLocalizedScamTypes(getPdfTranslations('en'));
  for (const [label, kws] of types) {
    if (isScamChecked(scamType, kws)) return label;
  }
  return scamType || 'Unknown';
};

/* ─── Helper: interpolate {name}, {platform}, {police} in translation strings ─── */
const interp = (str: string, vars: Record<string, string>) =>
  Object.entries(vars).reduce((s, [k, v]) => s.replace(`{${k}}`, v), str);

/* ═══════════════════════════════════════════════════════════════
   DOCUMENT 1: POLICE COMPLAINT (localized)
   ═══════════════════════════════════════════════════════════════ */
export const PoliceComplaintDoc = ({ research, caseData }: { research: CountryResearch; caseData: CaseData }) => {
  const t = getPdfTranslations(caseData.country);
  const score = caseData.recoveryScore ?? 0;
  const exchanges = caseData.detectedExchange || t.common.none;
  const riskScore = caseData.recoveryScore ?? 0;
  const scamTypes = getLocalizedScamTypes(t);

  return (
    <Document>
      <Page size="A4" style={s.page}>
        <DocHeader title={t.police.title} subtitle={t.police.subtitle} caseData={caseData} />

        {/* FILING INFORMATION */}
        <SectionTitle>{t.police.filing_info}</SectionTitle>
        <Field label={t.police.filing_with} value={research.policeAgency.name} />
        <Field label={t.police.jurisdiction} value={research.policeAgency.jurisdiction} />
        <Field label={t.police.online_portal} value={research.policeAgency.url} />
        <Field label={t.police.reference} value={caseData.caseId} />

        {/* COMPLAINANT */}
        <SectionTitle>{t.police.complainant}</SectionTitle>
        <Field label={t.police.full_name} value={caseData.victimName} />
        <Field label={t.police.email} value={caseData.victimEmail} />
        <Field label={t.police.phone} value={caseData.victimPhone || t.common.optional} />
        <Field label={t.police.country} value={caseData.country} />
        <Field label={t.police.state_region} value={caseData.state || 'N/A'} />

        {/* INCIDENT DETAILS */}
        <SectionTitle>{t.police.incident_details}</SectionTitle>
        <Field label={t.police.date_of_incident} value={caseData.incidentDate} />
        <Field label={t.police.amount_lost} value={fmtMoney(caseData.lossAmount, caseData.lossCurrency)} />
        <Field label={t.police.cryptocurrency} value={caseData.cryptoType} />
        <Field label={t.police.network} value={caseData.network} />
        <Field label={t.police.fraud_type} value={fraudTypeLocalized(caseData.scamType, t)} />
        <View style={s.thinSep} />
        <Field label={t.police.platform_name} value={caseData.platformName || t.common.unknown} />
        <Field label={t.police.platform_url} value={caseData.platformUrl || t.common.unknown} />

        {/* TRANSACTION EVIDENCE */}
        <SectionTitle>{t.police.transaction_evidence}</SectionTitle>
        <Field label={t.police.scammer_wallet} value={caseData.scammerAddress} mono />
        <Field label={t.police.transaction_hash} value={caseData.txid} mono />
        <Field label={t.police.datetime} value={caseData.txDateTime || caseData.incidentDate} />
        <Field label={t.police.my_wallet} value={caseData.sourceWallet || t.common.see_attached} mono />

        {/* BLOCKCHAIN VERIFICATION */}
        <SectionTitle>{t.police.blockchain_verification}</SectionTitle>
        <View style={{ backgroundColor: '#eff6ff', borderRadius: 4, padding: 8, marginBottom: 8, borderWidth: 1, borderColor: '#93c5fd' }}>
          <Field label={t.police.risk_score} value={`${riskScore}/100`} />
          <Field label={t.police.recovery_probability} value={`${score}%`} />
          <Field label={t.police.exchanges_identified} value={exchanges} />
          <Field label={t.police.full_report} value={`ledgerhound.vip/case/${caseData.caseId}`} />
        </View>

        <DocFooter caseData={caseData} pageLabel={`${t.police.title} — ${t.common.page} 1`} t={t} />
      </Page>

      {/* PAGE 2 */}
      <Page size="A4" style={s.page}>
        {/* TYPE OF FRAUD */}
        <SectionTitle>{t.police.type_of_fraud}</SectionTitle>
        {scamTypes.map(([label, kws]) => (
          <Checkbox key={label} label={label} checked={isScamChecked(caseData.scamType, kws)} />
        ))}
        <Checkbox label={`${t.police.fraud_other}: ${!scamTypes.some(([, kws]) => isScamChecked(caseData.scamType, kws)) ? (caseData.scamType || '___') : '___'}`} checked={!scamTypes.some(([, kws]) => isScamChecked(caseData.scamType, kws)) && !!caseData.scamType} />

        {/* DESCRIPTION */}
        <SectionTitle>{t.police.description}</SectionTitle>
        <Text style={{ fontSize: 9, color: slate600, lineHeight: 1.6, marginBottom: 12, minHeight: 60 }}>
          {caseData.description || t.police.description_placeholder}
        </Text>

        {/* APPLICABLE LAW */}
        <SectionTitle>{t.police.applicable_law}</SectionTitle>
        <Text style={{ fontSize: 9, color: slate600, marginBottom: 4 }}>{t.police.filed_under}</Text>
        <Text style={{ fontSize: 9, color: slate900, lineHeight: 1.6, marginBottom: 8 }}>{research.legalBasis.criminalCode}</Text>
        <Field label={t.police.statute_of_limitations} value={research.legalBasis.statuteOfLimitations} />

        {/* EVIDENCE CHECKLIST */}
        <SectionTitle>{t.police.evidence_checklist}</SectionTitle>
        <Checkbox label={t.police.evidence_blockchain} checked />
        <Checkbox label={t.police.evidence_screenshots} />
        <Checkbox label={t.police.evidence_platform} />
        <Checkbox label={t.police.evidence_bank} />
        <Checkbox label={`${t.police.evidence_other}: _______________`} />

        {/* DECLARATION */}
        <SectionTitle>{t.police.declaration}</SectionTitle>
        <Text style={{ fontSize: 9, color: slate600, lineHeight: 1.6, marginBottom: 20 }}>
          {interp(t.police.declaration_text, { name: caseData.victimName || '[NAME]' })}
        </Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
          <View>
            <Text style={{ fontSize: 8, color: slate400, marginBottom: 20 }}>_______________________</Text>
            <Text style={{ fontSize: 8, color: slate400 }}>{t.police.signature}</Text>
          </View>
          <View>
            <Text style={{ fontSize: 8, color: slate400, marginBottom: 20 }}>_______________________</Text>
            <Text style={{ fontSize: 8, color: slate400 }}>{t.police.date}</Text>
          </View>
        </View>

        <DocFooter caseData={caseData} pageLabel={`${t.police.title} — ${t.common.page} 2`} t={t} />
      </Page>
    </Document>
  );
};

/* ═══════════════════════════════════════════════════════════════
   DOCUMENT 2: PRESERVATION LETTER (always English)
   Generated PER EXCHANGE (or generic if no exchanges identified)
   ═══════════════════════════════════════════════════════════════ */
export const PreservationLetterDoc = ({ research, caseData }: { research: CountryResearch; caseData: CaseData }) => {
  const exchangeName = caseData.exchange || '[Exchange Name]';
  const exchangeEmail = caseData.exchangeEmail || '[compliance@exchange.com]';
  const exchangeAddr = caseData.exchangeAddress || '';

  return (
    <Document>
      <Page size="A4" style={s.page}>
        <DocHeader title="PRESERVATION LETTER" subtitle="Urgent Request for Asset Freeze" caseData={caseData} />

        {/* TO */}
        <View style={{ marginBottom: 12 }}>
          <Text style={{ fontSize: 10, fontFamily: 'NotoSans', fontWeight: 700, color: slate900 }}>TO: {exchangeName} Compliance Department</Text>
          <Text style={{ fontSize: 9, color: slate600, paddingLeft: 28 }}>{exchangeEmail}</Text>
        </View>

        <Text style={{ fontSize: 10, fontFamily: 'NotoSans', fontWeight: 700, color: red, marginBottom: 12 }}>RE: URGENT — ASSET PRESERVATION REQUEST — Suspected Cryptocurrency Fraud</Text>
        <View style={s.separator} />

        <Text style={{ fontSize: 9, color: slate600, lineHeight: 1.6, marginBottom: 12 }}>
          Dear Compliance Team,{'\n\n'}I am a victim of cryptocurrency fraud. I am requesting IMMEDIATE preservation and review of assets associated with the following transaction on your platform.
        </Text>

        {/* TRANSACTION DETAILS */}
        <SectionTitle>TRANSACTION DETAILS</SectionTitle>
        <Field label="Amount" value={`${fmtMoney(caseData.lossAmount, caseData.lossCurrency)}`} />
        <Field label="Network" value={caseData.network} />
        <Field label="Transaction Hash" value={caseData.txid} mono />
        <Field label="Date/Time" value={caseData.txDateTime || caseData.incidentDate} />
        {exchangeAddr ? (
          <View style={{ marginTop: 6 }}>
            <Text style={{ fontSize: 8, color: slate400, marginBottom: 2 }}>Receiving Address on Your Platform:</Text>
            <Text style={{ fontSize: 8, fontFamily: 'Courier', color: slate900 }}>{exchangeAddr}</Text>
          </View>
        ) : null}

        {/* FRAUD SUMMARY */}
        <SectionTitle>FRAUD SUMMARY</SectionTitle>
        <Field label="Type" value={fraudTypeLocalized(caseData.scamType)} />
        <Field label="Platform Used" value={caseData.platformName || '[Under investigation]'} />
        <Field label="Police Report" value={`Filed with ${research.policeAgency.name}`} />
        <Field label="Reference" value={caseData.policeReportNumber || '[Pending]'} />

        {/* BLOCKCHAIN VERIFICATION */}
        <SectionTitle>BLOCKCHAIN VERIFICATION</SectionTitle>
        <View style={{ backgroundColor: '#eff6ff', borderRadius: 4, padding: 8, marginBottom: 8, borderWidth: 1, borderColor: '#93c5fd' }}>
          <Text style={{ fontSize: 9, color: slate600, lineHeight: 1.5 }}>
            This transaction has been verified by LedgerHound blockchain forensics:{'\n'}
            {'\u2022'} Funds traced from victim wallet to your platform{'\n'}
            {'\u2022'} Risk Score: {caseData.recoveryScore ?? 0}/100{'\n'}
            {'\u2022'} Full forensic report: ledgerhound.vip/case/{caseData.caseId}
          </Text>
        </View>

        {/* REQUESTED ACTIONS */}
        <SectionTitle>REQUESTED ACTIONS</SectionTitle>
        <View style={{ marginBottom: 6 }}>
          <Text style={{ fontSize: 10, fontFamily: 'NotoSans', fontWeight: 700, color: slate900, marginBottom: 2 }}>1. IMMEDIATE ASSET FREEZE</Text>
          <Text style={{ fontSize: 9, color: slate600, paddingLeft: 16, lineHeight: 1.5 }}>Freeze assets associated with address:{'\n'}{exchangeAddr || caseData.scammerAddress}</Text>
        </View>
        <View style={{ marginBottom: 6 }}>
          <Text style={{ fontSize: 10, fontFamily: 'NotoSans', fontWeight: 700, color: slate900, marginBottom: 2 }}>2. EVIDENCE PRESERVATION</Text>
          <Text style={{ fontSize: 9, color: slate600, paddingLeft: 16, lineHeight: 1.5 }}>
            Preserve all records including:{'\n'}{'\u2022'} KYC/identity documents{'\n'}{'\u2022'} Login history and IP logs{'\n'}{'\u2022'} All transaction records{'\n'}{'\u2022'} Communication records
          </Text>
        </View>
        <View style={{ marginBottom: 6 }}>
          <Text style={{ fontSize: 10, fontFamily: 'NotoSans', fontWeight: 700, color: slate900, marginBottom: 2 }}>3. CONFIRMATION</Text>
          <Text style={{ fontSize: 9, color: slate600, paddingLeft: 16 }}>Please confirm receipt and actions taken within 48 hours.</Text>
        </View>

        {/* LEGAL BASIS */}
        <SectionTitle>LEGAL BASIS</SectionTitle>
        <Text style={{ fontSize: 9, color: slate600, lineHeight: 1.5, marginBottom: 8 }}>{research.preservationLetter.legalBasis}</Text>
        <Text style={{ fontSize: 9, color: slate600, marginBottom: 12 }}>A formal police report has been filed with {research.policeAgency.name}.</Text>

        {/* CONTACT */}
        <SectionTitle>CONTACT</SectionTitle>
        <Field label="Name" value={caseData.victimName} />
        <Field label="Email" value={caseData.victimEmail} />
        <Field label="Phone" value={caseData.victimPhone || '[Available upon request]'} />
        <Field label="Case Ref" value={caseData.caseId} />

        {/* LEGAL NOTICE */}
        <View style={{ backgroundColor: '#fef2f2', borderRadius: 4, padding: 8, marginTop: 12, borderWidth: 1, borderColor: '#fecaca' }}>
          <Text style={{ fontSize: 8, fontFamily: 'NotoSans', fontWeight: 700, color: red, marginBottom: 2 }}>LEGAL NOTICE</Text>
          <Text style={{ fontSize: 8, color: slate600, lineHeight: 1.5 }}>This letter serves as formal notice of suspected criminal activity. Failure to preserve potentially fraudulent assets may result in liability.</Text>
        </View>

        {/* SIGNATURE */}
        <View style={{ marginTop: 20 }}>
          <Text style={{ fontSize: 9, color: slate600 }}>Sincerely,</Text>
          <Text style={{ fontSize: 8, color: slate400, marginTop: 20 }}>_______________________</Text>
          <Text style={{ fontSize: 9, color: slate900 }}>{caseData.victimName || '[NAME]'}</Text>
          <Text style={{ fontSize: 9, color: slate600 }}>{caseData.date}</Text>
        </View>

        <DocFooter caseData={caseData} pageLabel={`Preservation Letter${caseData.exchange ? ` — ${caseData.exchange}` : ''}`} />
      </Page>
    </Document>
  );
};

/* ═══════════════════════════════════════════════════════════════
   DOCUMENT 3: REGULATOR COMPLAINT (localized)
   ═══════════════════════════════════════════════════════════════ */
export const RegulatorComplaintDoc = ({ research, caseData }: { research: CountryResearch; caseData: CaseData }) => {
  const t = getPdfTranslations(caseData.country);
  const exchanges = caseData.detectedExchange || t.common.under_investigation;

  /* Violation type checkboxes — localized */
  const violationTypes: [string, string[]][] = [
    [t.regulator.violation_unregistered, ['investment', 'ico', 'token']],
    [t.regulator.violation_investment, ['investment', 'fake', 'platform', 'romance', 'pig']],
    [t.regulator.violation_manipulation, ['manipulation', 'pump']],
    [t.regulator.violation_unlicensed, ['exchange', 'transmission']],
    [t.regulator.violation_misleading, ['misleading', 'advertising']],
    [t.regulator.violation_ponzi, ['ponzi', 'pyramid']],
  ];

  return (
    <Document>
      <Page size="A4" style={s.page}>
        <DocHeader title={t.regulator.title} subtitle={t.regulator.subtitle} caseData={caseData} />

        {/* REGULATORY BODY */}
        <SectionTitle>{t.regulator.regulatory_body}</SectionTitle>
        <Field label={t.regulator.filing_with} value={research.financialRegulator.name} />
        <Field label={t.regulator.online_portal} value={research.financialRegulator.url} />
        <Field label={t.regulator.scope} value={research.financialRegulator.scope} />

        {/* COMPLAINANT */}
        <SectionTitle>{t.regulator.complainant}</SectionTitle>
        <Field label={t.regulator.name} value={caseData.victimName} />
        <Field label={t.regulator.email} value={caseData.victimEmail} />
        <Field label={t.regulator.country} value={caseData.country} />
        <Field label={t.regulator.police_report} value={caseData.policeReportNumber || t.common.pending} />

        {/* SUBJECT OF COMPLAINT */}
        <SectionTitle>{t.regulator.subject_of_complaint}</SectionTitle>
        <Field label={t.regulator.platform_entity} value={caseData.platformName || t.common.unknown} />
        <Field label={t.regulator.website} value={caseData.platformUrl || t.common.unknown} />
        <Field label={t.regulator.type_of_activity} value={fraudTypeLocalized(caseData.scamType, t)} />
        <Field label={t.regulator.period} value={`${caseData.incidentDate} to ${caseData.date}`} />

        {/* FINANCIAL DETAILS */}
        <SectionTitle>{t.regulator.financial_details}</SectionTitle>
        <Field label={t.regulator.amount_lost} value={fmtMoney(caseData.lossAmount, caseData.lossCurrency)} />
        <Field label={t.regulator.cryptocurrency} value={`${caseData.cryptoType} on ${caseData.network}`} />
        <Field label={t.regulator.payment_method} value={caseData.paymentMethod || t.regulator.crypto_transfer} />

        {/* NATURE OF VIOLATION */}
        <SectionTitle>{t.regulator.nature_of_violation}</SectionTitle>
        {violationTypes.map(([label, kws]) => (
          <Checkbox key={label} label={label} checked={isScamChecked(caseData.scamType, kws)} />
        ))}
        <Checkbox label={`${t.regulator.violation_other}: ${caseData.scamType || '___'}`} checked={!violationTypes.some(([, kws]) => isScamChecked(caseData.scamType, kws)) && !!caseData.scamType} />

        {/* DESCRIPTION */}
        <SectionTitle>{t.regulator.description}</SectionTitle>
        <Text style={{ fontSize: 9, color: slate600, lineHeight: 1.6, marginBottom: 8, minHeight: 40 }}>
          {caseData.description || t.common.to_be_filled}
        </Text>

        <DocFooter caseData={caseData} pageLabel={`${t.regulator.title} — ${t.common.page} 1`} t={t} />
      </Page>

      {/* PAGE 2 */}
      <Page size="A4" style={s.page}>
        {/* EVIDENCE SUMMARY */}
        <SectionTitle>{t.regulator.evidence_summary}</SectionTitle>
        <View style={{ backgroundColor: '#eff6ff', borderRadius: 4, padding: 8, marginBottom: 8, borderWidth: 1, borderColor: '#93c5fd' }}>
          <Text style={{ fontSize: 9, color: slate600, lineHeight: 1.5 }}>
            {'\u2022'} {t.regulator.blockchain_verified} (Case: {caseData.caseId}){'\n'}
            {'\u2022'} {t.regulator.transaction_traced}: {exchanges}{'\n'}
            {'\u2022'} {t.regulator.police_filed} {research.policeAgency.name}
          </Text>
        </View>

        {/* OTHER VICTIMS */}
        <SectionTitle>{t.regulator.other_victims}</SectionTitle>
        <Checkbox label={t.regulator.aware_of_victims} checked={!!caseData.otherVictimsCount} />
        <Checkbox label={`${t.regulator.estimated_victims}: ${caseData.otherVictimsCount || '___'}`} />
        <Checkbox label={`${t.regulator.total_losses}: $${caseData.totalEstimatedLosses?.toLocaleString() || '___'}`} />

        {/* REQUESTED ACTION */}
        <SectionTitle>{t.regulator.requested_action}</SectionTitle>
        <Text style={{ fontSize: 9, color: slate900, marginBottom: 3, paddingLeft: 4 }}>1. {interp(t.regulator.action_investigate, { platform: caseData.platformName || '[Platform]' })}</Text>
        <Text style={{ fontSize: 9, color: slate900, marginBottom: 3, paddingLeft: 4 }}>2. {t.regulator.action_enforcement}</Text>
        <Text style={{ fontSize: 9, color: slate900, marginBottom: 3, paddingLeft: 4 }}>3. {interp(t.regulator.action_coordination, { police: research.policeAgency.name })}</Text>
        <Text style={{ fontSize: 9, color: slate900, marginBottom: 12, paddingLeft: 4 }}>4. {t.regulator.action_warning}</Text>

        {/* DECLARATION */}
        <SectionTitle>{t.regulator.declaration}</SectionTitle>
        <Text style={{ fontSize: 9, color: slate600, lineHeight: 1.6, marginBottom: 20 }}>
          {interp(t.regulator.declaration_text, { name: caseData.victimName || '[NAME]' })}
        </Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
          <View>
            <Text style={{ fontSize: 8, color: slate400, marginBottom: 20 }}>_______________________</Text>
            <Text style={{ fontSize: 8, color: slate400 }}>{t.regulator.signature}</Text>
          </View>
          <View>
            <Text style={{ fontSize: 8, color: slate400, marginBottom: 20 }}>_______________________</Text>
            <Text style={{ fontSize: 8, color: slate400 }}>{t.regulator.date}</Text>
          </View>
        </View>

        <DocFooter caseData={caseData} pageLabel={`${t.regulator.title} — ${t.common.page} 2`} t={t} />
      </Page>
    </Document>
  );
};

/* ═══════════════════════════════════════════════════════════════
   DOCUMENT 4: EMERGENCY RECOVERY ACTION GUIDE (3 pages, localized)
   ═══════════════════════════════════════════════════════════════ */
export const ActionGuideDoc = ({ research, caseData }: { research: CountryResearch; caseData: CaseData }) => {
  const t = getPdfTranslations(caseData.country);
  const ag = t.action_guide;

  const score = caseData.recoveryScore ?? 45;
  const riskLevel = caseData.riskLevel ?? 'medium';
  const daysOld = caseData.daysOld ?? 0;
  const hops = caseData.hops ?? 0;
  const exchangeSupportsLE = caseData.exchangeSupportsLE ?? false;
  const mixerDetected = caseData.mixerDetected ?? false;
  const urgencyLevel = caseData.urgencyLevel ?? 'MODERATE';
  const timeWindow = caseData.timeWindow ?? '1 week';
  const identifiedExchanges = caseData.detectedExchange || '';
  const hasExchanges = !!identifiedExchanges;
  const lossUSD = caseData.lossAmount || 0;

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'critical': return red;
      case 'high': return amber;
      case 'medium': return '#2563eb';
      default: return green;
    }
  };

  /* Step box component */
  const StepBox = ({ num, title, timing, why, children }: { num: number; title: string; timing: string; why: string; children: React.ReactNode }) => (
    <View style={{ marginBottom: 14 }} wrap={false}>
      <View style={{ backgroundColor: '#f1f5f9', borderRadius: 4, padding: 8, marginBottom: 6, flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={{ fontSize: 11, fontFamily: 'NotoSans', fontWeight: 700, color: slate900 }}>STEP {num}: {title}</Text>
        <Text style={{ fontSize: 9, color: slate600 }}>{timing}</Text>
      </View>
      <View style={{ backgroundColor: '#fffbeb', borderRadius: 3, padding: 6, marginBottom: 6, borderWidth: 0.5, borderColor: '#fde68a' }}>
        <Text style={{ fontSize: 8, fontFamily: 'NotoSans', fontWeight: 700, color: amber, marginBottom: 1 }}>WHY THIS MATTERS:</Text>
        <Text style={{ fontSize: 8, color: slate600, lineHeight: 1.4 }}>{why}</Text>
      </View>
      {children}
    </View>
  );

  /* Loss-based recommendation — localized */
  const getLossAdvice = () => {
    if (lossUSD < 1000) return { tier: ag.loss_small_title, advice: ag.loss_small_text };
    if (lossUSD < 10000) return {
      tier: ag.loss_medium_title,
      advice: research.hasSmallClaims ? `${ag.loss_medium_text} (${research.smallClaimsThreshold})` : ag.loss_medium_text,
    };
    if (lossUSD < 50000) return { tier: ag.loss_significant_title, advice: ag.loss_significant_text };
    return { tier: ag.loss_major_title, advice: ag.loss_major_text };
  };
  const lossAdvice = getLossAdvice();

  return (
    <Document>
      {/* ─── PAGE 1: Summary + Recovery Analysis + Steps 1-2 ─── */}
      <Page size="A4" style={s.page}>
        <DocHeader title={ag.title} subtitle={ag.subtitle} caseData={caseData} />

        {/* CASE SUMMARY */}
        <View style={{ backgroundColor: '#eff6ff', borderRadius: 6, padding: 10, marginBottom: 12, borderWidth: 1, borderColor: '#93c5fd' }}>
          <Text style={{ fontSize: 11, fontFamily: 'NotoSans', fontWeight: 700, color: blue, marginBottom: 6 }}>{ag.case_summary}</Text>
          <Field label={ag.victim} value={caseData.victimName} />
          <Field label={ag.loss_amount} value={fmtMoney(caseData.lossAmount, caseData.lossCurrency)} />
          <Field label={ag.date_of_loss} value={caseData.incidentDate} />
          <Field label={ag.fraud_type} value={fraudTypeLocalized(caseData.scamType, t)} />
        </View>

        {/* RECOVERY ANALYSIS */}
        <SectionTitle>{ag.recovery_analysis}</SectionTitle>
        <View style={{ flexDirection: 'row', marginBottom: 10, gap: 12 }}>
          {/* Score circle */}
          <View style={{ width: 80, height: 80, borderRadius: 40, borderWidth: 3, borderColor: getRiskColor(riskLevel), alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 20, fontFamily: 'NotoSans', fontWeight: 700, color: getRiskColor(riskLevel) }}>{score}%</Text>
            <Text style={{ fontSize: 6, color: slate400 }}>{ag.recovery}</Text>
          </View>
          {/* Stats */}
          <View style={{ flex: 1 }}>
            <Field label={ag.risk_score} value={`${score}/100 (${riskLevel.toUpperCase()})`} />
            <Field label={ag.fund_status} value={hasExchanges ? `${ag.exchange_detected}: ${identifiedExchanges}` : mixerDetected ? ag.mixer_warning : ag.no_exchange} />
            <Field label={ag.exchanges_found} value={hasExchanges ? t.common.yes : t.common.no} />
          </View>
        </View>

        {/* Exchange status box */}
        {hasExchanges ? (
          <View style={{ backgroundColor: '#f0fdf4', borderRadius: 4, padding: 8, marginBottom: 10, borderWidth: 1, borderColor: '#86efac' }}>
            <Text style={{ fontSize: 9, fontFamily: 'NotoSans', fontWeight: 700, color: green, marginBottom: 2 }}>{'\u2713'} {ag.exchange_positive}: {identifiedExchanges}</Text>
            <Text style={{ fontSize: 8, color: slate600, lineHeight: 1.4 }}>{ag.exchange_positive_text}</Text>
          </View>
        ) : (
          <View style={{ backgroundColor: '#fffbeb', borderRadius: 4, padding: 8, marginBottom: 10, borderWidth: 1, borderColor: '#fde68a' }}>
            <Text style={{ fontSize: 9, fontFamily: 'NotoSans', fontWeight: 700, color: amber, marginBottom: 2 }}>{'\u26A0'} {ag.no_exchange_caution}</Text>
            <Text style={{ fontSize: 8, color: slate600, lineHeight: 1.4 }}>{ag.no_exchange_caution_text}</Text>
          </View>
        )}

        {/* CRITICAL WINDOW */}
        <View style={{ backgroundColor: '#fef2f2', borderRadius: 4, padding: 8, marginBottom: 12, borderWidth: 1, borderColor: '#fecaca' }}>
          <Text style={{ fontSize: 9, fontFamily: 'NotoSans', fontWeight: 700, color: red, marginBottom: 2 }}>{'\u23F0'} {ag.critical_window}</Text>
          <Text style={{ fontSize: 8, color: slate600, lineHeight: 1.4 }}>{ag.critical_window_text}</Text>
        </View>

        {/* STEP 1 */}
        <Text style={{ fontSize: 13, fontFamily: 'NotoSans', fontWeight: 700, color: slate900, marginBottom: 8, textAlign: 'center' as any }}>{ag.action_plan}</Text>

        <StepBox num={1} title={ag.step1_title} timing={ag.step1_when} why={ag.step1_why}>
          <Field label="WHERE" value={research.policeAgency.name} />
          <Field label="URL" value={research.policeAgency.url} />
          <Text style={{ fontSize: 8, color: slate600, lineHeight: 1.4, paddingLeft: 8, marginTop: 4 }}>
            {ag.step1_instructions}
          </Text>
          <Field label={ag.expected_response} value={research.policeAgency.responseTime} />
        </StepBox>

        {/* STEP 2 */}
        <StepBox num={2} title={ag.step2_title} timing={ag.step2_when} why={ag.step2_why}>
          {hasExchanges ? (
            <View style={{ marginBottom: 4 }}>
              <Text style={{ fontSize: 9, fontFamily: 'NotoSans', fontWeight: 700, color: slate900, marginBottom: 4 }}>{ag.send_to}</Text>
              {identifiedExchanges.split(', ').map((name: string) => {
                const contact = research.exchangeContacts?.find(c => c.name.toLowerCase() === name.toLowerCase());
                return (
                  <View key={name} style={{ paddingLeft: 8, marginBottom: 4 }}>
                    <Text style={{ fontSize: 9, fontFamily: 'NotoSans', fontWeight: 700, color: slate900 }}>{name}</Text>
                    <Text style={{ fontSize: 8, color: slate600 }}>Email: {contact?.complianceEmail || `compliance@${name.toLowerCase().replace(/\s+/g, '')}.com`}</Text>
                  </View>
                );
              })}
            </View>
          ) : (
            <Text style={{ fontSize: 8, color: slate600, lineHeight: 1.4 }}>{ag.step2_no_exchange}</Text>
          )}
          <Text style={{ fontSize: 8, color: slate600, lineHeight: 1.4, paddingLeft: 8, marginTop: 4 }}>
            {ag.step2_instructions}
          </Text>
        </StepBox>

        <DocFooter caseData={caseData} pageLabel={`${ag.title} — ${t.common.page} 1`} t={t} />
      </Page>

      {/* ─── PAGE 2: Steps 3-5 + Additional Agencies ─── */}
      <Page size="A4" style={s.page}>
        {/* STEP 3 */}
        <StepBox num={3} title={ag.step3_title} timing={ag.step3_when} why={ag.step3_why}>
          <Field label="WHERE" value={research.financialRegulator.name} />
          <Field label="URL" value={research.financialRegulator.url} />
          <Text style={{ fontSize: 8, color: slate600, lineHeight: 1.4, paddingLeft: 8, marginTop: 4 }}>
            {ag.step3_instructions}
          </Text>
        </StepBox>

        {/* STEP 4 */}
        <StepBox num={4} title={ag.step4_title} timing={ag.step4_when} why={ag.step4_why}>
          <Text style={{ fontSize: 9, fontFamily: 'NotoSans', fontWeight: 700, color: slate900, marginBottom: 4 }}>{ag.save_now}</Text>
          <Checkbox label={ag.evidence_screenshots} />
          <Checkbox label={ag.evidence_receipts} />
          <Checkbox label={ag.evidence_wallets} />
          <Checkbox label={ag.evidence_platform} />
          <Checkbox label={ag.evidence_timeline} />
          <Checkbox label={ag.evidence_chats} />
          <Checkbox label={ag.evidence_social} />
          <Checkbox label={ag.evidence_bank} />
          <Text style={{ fontSize: 8, color: slate600, marginTop: 4 }}>{ag.evidence_storage}</Text>
        </StepBox>

        {/* STEP 5 */}
        <StepBox num={5} title={ag.step5_title} timing={ag.step5_when} why={ag.step5_why}>
          <View style={{ backgroundColor: '#f1f5f9', borderRadius: 4, padding: 8, marginBottom: 6 }}>
            <Text style={{ fontSize: 9, fontFamily: 'NotoSans', fontWeight: 700, color: slate900, marginBottom: 2 }}>{lossAdvice.tier}</Text>
            <Text style={{ fontSize: 8, color: slate600, lineHeight: 1.4 }}>{lossAdvice.advice}</Text>
          </View>
          <Text style={{ fontSize: 9, fontFamily: 'NotoSans', fontWeight: 700, color: slate900, marginTop: 4, marginBottom: 4 }}>{ag.civil_remedies_in} {caseData.country}:</Text>
          {research.legalBasis.civilRemedies.map((r, i) => (
            <Text key={i} style={{ fontSize: 8, color: slate600, marginBottom: 2, paddingLeft: 8 }}>{'\u2022'} {r}</Text>
          ))}
          <Field label={ag.statute_of_limitations} value={research.legalBasis.statuteOfLimitations} />
        </StepBox>

        {/* ADDITIONAL AGENCIES */}
        <SectionTitle>{ag.additional_agencies}</SectionTitle>
        {(research.additionalAgencies || []).map((agency, i) => (
          <View key={i} style={{ backgroundColor: '#f8fafc', borderRadius: 4, padding: 6, marginBottom: 6, borderWidth: 0.5, borderColor: slate200 }} wrap={false}>
            <Text style={{ fontSize: 9, fontFamily: 'NotoSans', fontWeight: 700, color: slate900 }}>{agency.name}</Text>
            <Text style={{ fontSize: 8, color: blue }}>{agency.url}</Text>
            <Text style={{ fontSize: 8, color: slate600, marginTop: 2 }}>{ag.when_to_use}: {(agency as any).when_to_use || agency.when}</Text>
          </View>
        ))}

        <DocFooter caseData={caseData} pageLabel={`${ag.title} — ${t.common.page} 2`} t={t} />
      </Page>

      {/* ─── PAGE 3: Timeline + Contacts + CTA ─── */}
      <Page size="A4" style={s.page}>
        {/* EXPECTED TIMELINE */}
        <SectionTitle>{ag.expected_timeline}</SectionTitle>
        <View style={{ marginBottom: 12 }}>
          {[
            [ag.timeline_report, 'Same day'],
            [ag.timeline_exchange, '1-7 days'],
            [ag.timeline_police, research.policeAgency.responseTime],
            [ag.timeline_regulator, '2-8 weeks'],
            [ag.timeline_investigation, '1-3 months'],
            [ag.timeline_recovery, '3-12 months'],
          ].map(([stage, time], i) => (
            <View key={i} style={{ flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: slate200, paddingVertical: 4 }}>
              <Text style={{ fontSize: 9, color: slate900, width: 220 }}>{stage}</Text>
              <Text style={{ fontSize: 9, color: slate600, flex: 1 }}>{time}</Text>
            </View>
          ))}
        </View>

        {/* EMERGENCY CONTACTS */}
        <SectionTitle>{ag.emergency_contacts}</SectionTitle>
        <View style={{ marginBottom: 12 }}>
          <Field label={research.policeAgency.shortName || 'Police'} value={research.contacts.emergencyPhone} />
          <Field label="Cybercrime" value={research.contacts.cybercrimeEmail} />
          <Field label="Consumer Protection" value={research.contacts.consumerProtection} />
        </View>

        {/* CTA BOX */}
        <View style={{ backgroundColor: '#1e293b', borderRadius: 8, padding: 16, marginTop: 12 }}>
          <Text style={{ fontSize: 12, fontFamily: 'NotoSans', fontWeight: 700, color: '#ffffff', marginBottom: 6 }}>{ag.need_investigation}</Text>
          <Text style={{ fontSize: 9, color: '#cbd5e1', lineHeight: 1.5, marginBottom: 8 }}>
            {ag.need_investigation_text}
          </Text>
          <Text style={{ fontSize: 10, fontFamily: 'NotoSans', fontWeight: 700, color: '#60a5fa' }}>Email: contact@ledgerhound.vip</Text>
          <Text style={{ fontSize: 10, fontFamily: 'NotoSans', fontWeight: 700, color: '#60a5fa' }}>Phone: +1 (833) 559-1334</Text>
          <Text style={{ fontSize: 10, fontFamily: 'NotoSans', fontWeight: 700, color: '#60a5fa' }}>Web: ledgerhound.vip/full-investigation</Text>
        </View>

        {/* DISCLAIMER */}
        <View style={{ marginTop: 16 }}>
          <View style={s.separator} />
          <Text style={{ fontSize: 7, color: slate400, lineHeight: 1.4, marginTop: 4 }}>
            {ag.disclaimer}
          </Text>
        </View>

        <DocFooter caseData={caseData} pageLabel={`${ag.title} — ${t.common.page} 3`} t={t} />
      </Page>
    </Document>
  );
};
