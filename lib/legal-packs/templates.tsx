import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import type { CountryResearch, CaseData } from './types';

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

const DocFooter = ({ caseData, pageLabel }: { caseData: CaseData; pageLabel: string }) => (
  <View style={s.footer} fixed>
    <Text>Prepared with LedgerHound · ledgerhound.vip · {caseData.caseId}</Text>
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
const scamTypes: [string, string[]][] = [
  ['Romance Scam / Pig Butchering', ['romance', 'pig']],
  ['Fake Investment Platform', ['fake', 'platform']],
  ['Ponzi / Pyramid Scheme', ['ponzi', 'pyramid', 'investment']],
  ['Phishing / Wallet Drain', ['phishing', 'drain']],
  ['Rug Pull / Exit Scam', ['rug', 'exit']],
];

const isScamChecked = (scamType: string, keywords: string[]) =>
  scamType ? keywords.some(k => scamType.toLowerCase().includes(k)) : false;

const fraudTypeLocalized = (scamType: string) => {
  for (const [label, kws] of scamTypes) {
    if (isScamChecked(scamType, kws)) return label;
  }
  return scamType || 'Unknown';
};

/* ═══════════════════════════════════════════════════════════════
   DOCUMENT 1: POLICE COMPLAINT
   ═══════════════════════════════════════════════════════════════ */
export const PoliceComplaintDoc = ({ research, caseData }: { research: CountryResearch; caseData: CaseData }) => {
  const score = caseData.recoveryScore ?? 0;
  const exchanges = caseData.detectedExchange || 'None';
  const riskScore = caseData.recoveryScore ?? 0;

  return (
    <Document>
      <Page size="A4" style={s.page}>
        <DocHeader title="POLICE COMPLAINT" subtitle="Cryptocurrency Fraud Report" caseData={caseData} />

        {/* FILING INFORMATION */}
        <SectionTitle>FILING INFORMATION</SectionTitle>
        <Field label="Filing with" value={research.policeAgency.name} />
        <Field label="Jurisdiction" value={research.policeAgency.jurisdiction} />
        <Field label="Online portal" value={research.policeAgency.url} />
        <Field label="Reference" value={caseData.caseId} />

        {/* COMPLAINANT */}
        <SectionTitle>COMPLAINANT</SectionTitle>
        <Field label="Full Name" value={caseData.victimName} />
        <Field label="Email" value={caseData.victimEmail} />
        <Field label="Phone" value={caseData.victimPhone || '[OPTIONAL]'} />
        <Field label="Country" value={caseData.country} />
        <Field label="State/Region" value={caseData.state || 'N/A'} />

        {/* INCIDENT DETAILS */}
        <SectionTitle>INCIDENT DETAILS</SectionTitle>
        <Field label="Date of Incident" value={caseData.incidentDate} />
        <Field label="Amount Lost" value={fmtMoney(caseData.lossAmount, caseData.lossCurrency)} />
        <Field label="Cryptocurrency" value={caseData.cryptoType} />
        <Field label="Network" value={caseData.network} />
        <Field label="Fraud Type" value={fraudTypeLocalized(caseData.scamType)} />
        <View style={s.thinSep} />
        <Field label="Platform Name" value={caseData.platformName || '[UNKNOWN]'} />
        <Field label="Platform URL" value={caseData.platformUrl || '[UNKNOWN]'} />

        {/* TRANSACTION EVIDENCE */}
        <SectionTitle>TRANSACTION EVIDENCE</SectionTitle>
        <Field label="Scammer Wallet" value={caseData.scammerAddress} mono />
        <Field label="Transaction Hash" value={caseData.txid} mono />
        <Field label="Date/Time" value={caseData.txDateTime || caseData.incidentDate} />
        <Field label="My Wallet" value={caseData.sourceWallet || '[See attached records]'} mono />

        {/* BLOCKCHAIN VERIFICATION */}
        <SectionTitle>BLOCKCHAIN VERIFICATION (by LedgerHound)</SectionTitle>
        <View style={{ backgroundColor: '#eff6ff', borderRadius: 4, padding: 8, marginBottom: 8, borderWidth: 1, borderColor: '#93c5fd' }}>
          <Field label="Risk Score" value={`${riskScore}/100`} />
          <Field label="Recovery Probability" value={`${score}%`} />
          <Field label="Exchanges Identified" value={exchanges} />
          <Field label="Full Report" value={`ledgerhound.vip/case/${caseData.caseId}`} />
        </View>

        <DocFooter caseData={caseData} pageLabel="Police Complaint — Page 1" />
      </Page>

      {/* PAGE 2 */}
      <Page size="A4" style={s.page}>
        {/* TYPE OF FRAUD */}
        <SectionTitle>TYPE OF FRAUD</SectionTitle>
        {scamTypes.map(([label, kws]) => (
          <Checkbox key={label} label={label} checked={isScamChecked(caseData.scamType, kws)} />
        ))}
        <Checkbox label={`Other: ${!scamTypes.some(([, kws]) => isScamChecked(caseData.scamType, kws)) ? (caseData.scamType || '___') : '___'}`} checked={!scamTypes.some(([, kws]) => isScamChecked(caseData.scamType, kws)) && !!caseData.scamType} />

        {/* DESCRIPTION */}
        <SectionTitle>DESCRIPTION</SectionTitle>
        <Text style={{ fontSize: 9, color: slate600, lineHeight: 1.6, marginBottom: 12, minHeight: 60 }}>
          {caseData.description || 'Please describe how you were contacted, what was promised, and when you realized it was fraud.'}
        </Text>

        {/* APPLICABLE LAW */}
        <SectionTitle>APPLICABLE LAW</SectionTitle>
        <Text style={{ fontSize: 9, color: slate600, marginBottom: 4 }}>This complaint is filed under:</Text>
        <Text style={{ fontSize: 9, color: slate900, lineHeight: 1.6, marginBottom: 8 }}>{research.legalBasis.criminalCode}</Text>
        <Field label="Statute of Limitations" value={research.legalBasis.statuteOfLimitations} />

        {/* EVIDENCE CHECKLIST */}
        <SectionTitle>EVIDENCE CHECKLIST</SectionTitle>
        <Checkbox label="Blockchain transaction proof (LedgerHound verified)" checked />
        <Checkbox label="Screenshots of communications" />
        <Checkbox label="Platform screenshots" />
        <Checkbox label="Bank/exchange statements" />
        <Checkbox label="Other: _______________" />

        {/* DECLARATION */}
        <SectionTitle>DECLARATION</SectionTitle>
        <Text style={{ fontSize: 9, color: slate600, lineHeight: 1.6, marginBottom: 20 }}>
          I, {caseData.victimName || '[NAME]'}, declare under penalty of perjury that the information provided in this complaint is true and accurate to the best of my knowledge.
        </Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
          <View>
            <Text style={{ fontSize: 8, color: slate400, marginBottom: 20 }}>_______________________</Text>
            <Text style={{ fontSize: 8, color: slate400 }}>Signature</Text>
          </View>
          <View>
            <Text style={{ fontSize: 8, color: slate400, marginBottom: 20 }}>_______________________</Text>
            <Text style={{ fontSize: 8, color: slate400 }}>Date</Text>
          </View>
        </View>

        <DocFooter caseData={caseData} pageLabel="Police Complaint — Page 2" />
      </Page>
    </Document>
  );
};

/* ═══════════════════════════════════════════════════════════════
   DOCUMENT 2: PRESERVATION LETTER
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
   DOCUMENT 3: REGULATOR COMPLAINT
   ═══════════════════════════════════════════════════════════════ */
export const RegulatorComplaintDoc = ({ research, caseData }: { research: CountryResearch; caseData: CaseData }) => {
  const exchanges = caseData.detectedExchange || 'Under investigation';

  /* Violation type checkboxes based on fraud type */
  const violationTypes: [string, string[]][] = [
    ['Unregistered securities offering', ['investment', 'ico', 'token']],
    ['Investment fraud', ['investment', 'fake', 'platform', 'romance', 'pig']],
    ['Market manipulation', ['manipulation', 'pump']],
    ['Unlicensed money transmission', ['exchange', 'transmission']],
    ['Misleading advertising', ['misleading', 'advertising']],
    ['Ponzi/pyramid scheme', ['ponzi', 'pyramid']],
  ];

  return (
    <Document>
      <Page size="A4" style={s.page}>
        <DocHeader title="FINANCIAL REGULATOR COMPLAINT" subtitle="Cryptocurrency Investment Fraud" caseData={caseData} />

        {/* REGULATORY BODY */}
        <SectionTitle>REGULATORY BODY</SectionTitle>
        <Field label="Filing with" value={research.financialRegulator.name} />
        <Field label="Online portal" value={research.financialRegulator.url} />
        <Field label="Scope" value={research.financialRegulator.scope} />

        {/* COMPLAINANT */}
        <SectionTitle>COMPLAINANT</SectionTitle>
        <Field label="Name" value={caseData.victimName} />
        <Field label="Email" value={caseData.victimEmail} />
        <Field label="Country" value={caseData.country} />
        <Field label="Police Report" value={caseData.policeReportNumber || 'To be filed'} />

        {/* SUBJECT OF COMPLAINT */}
        <SectionTitle>SUBJECT OF COMPLAINT</SectionTitle>
        <Field label="Platform/Entity" value={caseData.platformName || '[UNKNOWN]'} />
        <Field label="Website" value={caseData.platformUrl || '[UNKNOWN]'} />
        <Field label="Type of Activity" value={fraudTypeLocalized(caseData.scamType)} />
        <Field label="Period" value={`${caseData.incidentDate} to ${caseData.date}`} />

        {/* FINANCIAL DETAILS */}
        <SectionTitle>FINANCIAL DETAILS</SectionTitle>
        <Field label="Amount Lost" value={fmtMoney(caseData.lossAmount, caseData.lossCurrency)} />
        <Field label="Cryptocurrency" value={`${caseData.cryptoType} on ${caseData.network}`} />
        <Field label="Payment Method" value={caseData.paymentMethod || 'Cryptocurrency transfer'} />

        {/* NATURE OF VIOLATION */}
        <SectionTitle>NATURE OF VIOLATION</SectionTitle>
        {violationTypes.map(([label, kws]) => (
          <Checkbox key={label} label={label} checked={isScamChecked(caseData.scamType, kws)} />
        ))}
        <Checkbox label={`Other: ${caseData.scamType || '___'}`} checked={!violationTypes.some(([, kws]) => isScamChecked(caseData.scamType, kws)) && !!caseData.scamType} />

        {/* DESCRIPTION */}
        <SectionTitle>DESCRIPTION</SectionTitle>
        <Text style={{ fontSize: 9, color: slate600, lineHeight: 1.6, marginBottom: 8, minHeight: 40 }}>
          {caseData.description || '[Please describe the fraudulent activity]'}
        </Text>

        <DocFooter caseData={caseData} pageLabel="Regulator Complaint — Page 1" />
      </Page>

      {/* PAGE 2 */}
      <Page size="A4" style={s.page}>
        {/* EVIDENCE SUMMARY */}
        <SectionTitle>EVIDENCE SUMMARY</SectionTitle>
        <View style={{ backgroundColor: '#eff6ff', borderRadius: 4, padding: 8, marginBottom: 8, borderWidth: 1, borderColor: '#93c5fd' }}>
          <Text style={{ fontSize: 9, color: slate600, lineHeight: 1.5 }}>
            {'\u2022'} Blockchain evidence verified by LedgerHound (Case: {caseData.caseId}){'\n'}
            {'\u2022'} Transaction traced to: {exchanges}{'\n'}
            {'\u2022'} Police complaint filed with {research.policeAgency.name}
          </Text>
        </View>

        {/* OTHER VICTIMS */}
        <SectionTitle>OTHER VICTIMS</SectionTitle>
        <Checkbox label="I am aware of other victims" checked={!!caseData.otherVictimsCount} />
        <Checkbox label={`Estimated number of victims: ${caseData.otherVictimsCount || '___'}`} />
        <Checkbox label={`Total estimated losses: $${caseData.totalEstimatedLosses?.toLocaleString() || '___'}`} />

        {/* REQUESTED ACTION */}
        <SectionTitle>REQUESTED ACTION</SectionTitle>
        <Text style={{ fontSize: 9, color: slate900, marginBottom: 3, paddingLeft: 4 }}>1. Investigation of {caseData.platformName || '[Platform]'}</Text>
        <Text style={{ fontSize: 9, color: slate900, marginBottom: 3, paddingLeft: 4 }}>2. Enforcement action if violations confirmed</Text>
        <Text style={{ fontSize: 9, color: slate900, marginBottom: 3, paddingLeft: 4 }}>3. Coordination with {research.policeAgency.name}</Text>
        <Text style={{ fontSize: 9, color: slate900, marginBottom: 12, paddingLeft: 4 }}>4. Public warning to prevent additional victims</Text>

        {/* DECLARATION */}
        <SectionTitle>DECLARATION</SectionTitle>
        <Text style={{ fontSize: 9, color: slate600, lineHeight: 1.6, marginBottom: 20 }}>
          I, {caseData.victimName || '[NAME]'}, declare under penalty of perjury that the information provided is true and accurate to the best of my knowledge.
        </Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
          <View>
            <Text style={{ fontSize: 8, color: slate400, marginBottom: 20 }}>_______________________</Text>
            <Text style={{ fontSize: 8, color: slate400 }}>Signature</Text>
          </View>
          <View>
            <Text style={{ fontSize: 8, color: slate400, marginBottom: 20 }}>_______________________</Text>
            <Text style={{ fontSize: 8, color: slate400 }}>Date</Text>
          </View>
        </View>

        <DocFooter caseData={caseData} pageLabel="Regulator Complaint — Page 2" />
      </Page>
    </Document>
  );
};

/* ═══════════════════════════════════════════════════════════════
   DOCUMENT 4: EMERGENCY RECOVERY ACTION GUIDE (3 pages)
   ═══════════════════════════════════════════════════════════════ */
export const ActionGuideDoc = ({ research, caseData }: { research: CountryResearch; caseData: CaseData }) => {
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

  /* Loss-based recommendation */
  const getLossAdvice = () => {
    if (lossUSD < 1000) return {
      tier: 'SMALL LOSS (< $1,000)',
      advice: 'Complete Steps 1-4. Legal fees likely exceed recovery. Focus on reporting to prevent future victims. Join victim group if available.',
    };
    if (lossUSD < 10000) return {
      tier: 'MEDIUM LOSS ($1,000 - $10,000)',
      advice: `Complete Steps 1-4. Consider small claims court${research.hasSmallClaims ? ` (threshold: ${research.smallClaimsThreshold})` : ''}. Preservation letters may recover funds without litigation.`,
    };
    if (lossUSD < 50000) return {
      tier: 'SIGNIFICANT LOSS ($10,000 - $50,000)',
      advice: 'Complete Steps 1-4. Consult attorney experienced in crypto fraud. Civil suit may be viable. Consider LedgerHound Full Investigation.',
    };
    return {
      tier: 'MAJOR LOSS (> $50,000)',
      advice: 'Complete Steps 1-4 IMMEDIATELY. Retain attorney ASAP. Request emergency asset freeze via court order. LedgerHound Full Investigation recommended. Civil recovery likely viable.',
    };
  };
  const lossAdvice = getLossAdvice();

  return (
    <Document>
      {/* ─── PAGE 1: Summary + Recovery Analysis + Steps 1-2 ─── */}
      <Page size="A4" style={s.page}>
        <DocHeader title="EMERGENCY RECOVERY ACTION GUIDE" subtitle="Personalized Recovery Plan" caseData={caseData} />

        {/* CASE SUMMARY */}
        <View style={{ backgroundColor: '#eff6ff', borderRadius: 6, padding: 10, marginBottom: 12, borderWidth: 1, borderColor: '#93c5fd' }}>
          <Text style={{ fontSize: 11, fontFamily: 'NotoSans', fontWeight: 700, color: blue, marginBottom: 6 }}>YOUR CASE SUMMARY</Text>
          <Field label="Victim" value={caseData.victimName} />
          <Field label="Loss Amount" value={fmtMoney(caseData.lossAmount, caseData.lossCurrency)} />
          <Field label="Date of Loss" value={caseData.incidentDate} />
          <Field label="Fraud Type" value={fraudTypeLocalized(caseData.scamType)} />
        </View>

        {/* RECOVERY ANALYSIS */}
        <SectionTitle>RECOVERY ANALYSIS</SectionTitle>
        <View style={{ flexDirection: 'row', marginBottom: 10, gap: 12 }}>
          {/* Score circle */}
          <View style={{ width: 80, height: 80, borderRadius: 40, borderWidth: 3, borderColor: getRiskColor(riskLevel), alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 20, fontFamily: 'NotoSans', fontWeight: 700, color: getRiskColor(riskLevel) }}>{score}%</Text>
            <Text style={{ fontSize: 6, color: slate400 }}>RECOVERY</Text>
          </View>
          {/* Stats */}
          <View style={{ flex: 1 }}>
            <Field label="Risk Score" value={`${score}/100 (${riskLevel.toUpperCase()})`} />
            <Field label="Fund Status" value={hasExchanges ? `KYC exchange detected: ${identifiedExchanges}` : mixerDetected ? 'Funds mixed — reduced traceability' : 'No KYC exchange detected yet'} />
            <Field label="Exchanges Found" value={hasExchanges ? 'YES' : 'NO'} />
          </View>
        </View>

        {/* Exchange status box */}
        {hasExchanges ? (
          <View style={{ backgroundColor: '#f0fdf4', borderRadius: 4, padding: 8, marginBottom: 10, borderWidth: 1, borderColor: '#86efac' }}>
            <Text style={{ fontSize: 9, fontFamily: 'NotoSans', fontWeight: 700, color: green, marginBottom: 2 }}>{'\u2713'} POSITIVE: Funds detected on KYC exchange(s): {identifiedExchanges}</Text>
            <Text style={{ fontSize: 8, color: slate600, lineHeight: 1.4 }}>This significantly increases recovery chances. Exchanges can be compelled to freeze assets and provide account holder information via subpoena.</Text>
          </View>
        ) : (
          <View style={{ backgroundColor: '#fffbeb', borderRadius: 4, padding: 8, marginBottom: 10, borderWidth: 1, borderColor: '#fde68a' }}>
            <Text style={{ fontSize: 9, fontFamily: 'NotoSans', fontWeight: 700, color: amber, marginBottom: 2 }}>{'\u26A0'} CAUTION: No KYC exchanges identified yet.</Text>
            <Text style={{ fontSize: 8, color: slate600, lineHeight: 1.4 }}>Funds may be in private wallets or unregulated platforms. Recovery will require deeper investigation.</Text>
          </View>
        )}

        {/* CRITICAL WINDOW */}
        <View style={{ backgroundColor: '#fef2f2', borderRadius: 4, padding: 8, marginBottom: 12, borderWidth: 1, borderColor: '#fecaca' }}>
          <Text style={{ fontSize: 9, fontFamily: 'NotoSans', fontWeight: 700, color: red, marginBottom: 2 }}>{'\u23F0'} CRITICAL WINDOW</Text>
          <Text style={{ fontSize: 8, color: slate600, lineHeight: 1.4 }}>The first 24-72 hours are critical. Exchanges are more likely to freeze assets BEFORE funds are withdrawn. EVERY HOUR OF DELAY REDUCES YOUR CHANCES.</Text>
        </View>

        {/* STEP 1 */}
        <Text style={{ fontSize: 13, fontFamily: 'NotoSans', fontWeight: 700, color: slate900, marginBottom: 8, textAlign: 'center' as any }}>5-STEP ACTION PLAN</Text>

        <StepBox num={1} title="REPORT TO POLICE" timing="TODAY" why="Creates official record required by exchanges and courts. Without it, your case has no legal standing.">
          <Field label="WHERE" value={research.policeAgency.name} />
          <Field label="URL" value={research.policeAgency.url} />
          <Text style={{ fontSize: 8, color: slate600, lineHeight: 1.4, paddingLeft: 8, marginTop: 4 }}>
            1. Use attached "Police Complaint" document{'\n'}2. Submit online or in person{'\n'}3. SAVE your complaint reference number
          </Text>
          <Field label="Expected response" value={research.policeAgency.responseTime} />
        </StepBox>

        {/* STEP 2 */}
        <StepBox num={2} title="NOTIFY EXCHANGES" timing="TODAY" why="Exchanges can freeze accounts within HOURS. This prevents scammer from withdrawing your funds.">
          {hasExchanges ? (
            <View style={{ marginBottom: 4 }}>
              <Text style={{ fontSize: 9, fontFamily: 'NotoSans', fontWeight: 700, color: slate900, marginBottom: 4 }}>SEND PRESERVATION LETTER TO:</Text>
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
            <Text style={{ fontSize: 8, color: slate600, lineHeight: 1.4 }}>No exchanges identified yet. If you discover exchange involvement, send the attached Preservation Letter immediately.</Text>
          )}
          <Text style={{ fontSize: 8, color: slate600, lineHeight: 1.4, paddingLeft: 8, marginTop: 4 }}>
            1. Use attached "Preservation Letter" document{'\n'}2. Include your police report reference{'\n'}3. Send via email AND certified mail if possible{'\n'}4. Follow up in 24-48 hours if no response
          </Text>
        </StepBox>

        <DocFooter caseData={caseData} pageLabel="Action Guide — Page 1" />
      </Page>

      {/* ─── PAGE 2: Steps 3-5 + Additional Agencies ─── */}
      <Page size="A4" style={s.page}>
        {/* STEP 3 */}
        <StepBox num={3} title="REPORT TO FINANCIAL REGULATOR" timing="THIS WEEK" why="Regulatory complaints trigger investigations. Multiple complaints about same entity lead to enforcement action.">
          <Field label="WHERE" value={research.financialRegulator.name} />
          <Field label="URL" value={research.financialRegulator.url} />
          <Text style={{ fontSize: 8, color: slate600, lineHeight: 1.4, paddingLeft: 8, marginTop: 4 }}>
            1. Use attached "Regulator Complaint" document{'\n'}2. Reference your police report number{'\n'}3. Submit online
          </Text>
        </StepBox>

        {/* STEP 4 */}
        <StepBox num={4} title="PRESERVE ALL EVIDENCE" timing="ONGOING" why="Digital evidence disappears. Scammers delete profiles, platforms go offline, chats expire.">
          <Text style={{ fontSize: 9, fontFamily: 'NotoSans', fontWeight: 700, color: slate900, marginBottom: 4 }}>SAVE NOW:</Text>
          <Checkbox label="Screenshots of ALL conversations" />
          <Checkbox label="Transaction receipts and confirmations" />
          <Checkbox label="All wallet addresses involved" />
          <Checkbox label="Platform URLs and screenshots" />
          <Checkbox label="Complete timeline with dates" />
          <Checkbox label="Exported chat histories (WhatsApp, Telegram, email)" />
          <Checkbox label="Social media profiles of scammer" />
          <Checkbox label="Bank statements showing fiat transfers" />
          <Text style={{ fontSize: 8, color: slate600, marginTop: 4 }}>STORAGE: Use cloud backup (Google Drive, iCloud). NOT on same device that may be compromised.</Text>
        </StepBox>

        {/* STEP 5 */}
        <StepBox num={5} title="EVALUATE LEGAL OPTIONS" timing="1-2 WEEKS" why="Civil litigation can recover funds even when criminal prosecution stalls.">
          <View style={{ backgroundColor: '#f1f5f9', borderRadius: 4, padding: 8, marginBottom: 6 }}>
            <Text style={{ fontSize: 9, fontFamily: 'NotoSans', fontWeight: 700, color: slate900, marginBottom: 2 }}>{lossAdvice.tier}</Text>
            <Text style={{ fontSize: 8, color: slate600, lineHeight: 1.4 }}>{lossAdvice.advice}</Text>
          </View>
          <Text style={{ fontSize: 9, fontFamily: 'NotoSans', fontWeight: 700, color: slate900, marginTop: 4, marginBottom: 4 }}>CIVIL REMEDIES IN {caseData.country}:</Text>
          {research.legalBasis.civilRemedies.map((r, i) => (
            <Text key={i} style={{ fontSize: 8, color: slate600, marginBottom: 2, paddingLeft: 8 }}>{'\u2022'} {r}</Text>
          ))}
          <Field label="Statute of Limitations" value={research.legalBasis.statuteOfLimitations} />
        </StepBox>

        {/* ADDITIONAL AGENCIES */}
        <SectionTitle>ADDITIONAL AGENCIES</SectionTitle>
        {(research.additionalAgencies || []).map((agency, i) => (
          <View key={i} style={{ backgroundColor: '#f8fafc', borderRadius: 4, padding: 6, marginBottom: 6, borderWidth: 0.5, borderColor: slate200 }} wrap={false}>
            <Text style={{ fontSize: 9, fontFamily: 'NotoSans', fontWeight: 700, color: slate900 }}>{agency.name}</Text>
            <Text style={{ fontSize: 8, color: blue }}>{agency.url}</Text>
            <Text style={{ fontSize: 8, color: slate600, marginTop: 2 }}>When to use: {(agency as any).when_to_use || agency.when}</Text>
          </View>
        ))}

        <DocFooter caseData={caseData} pageLabel="Action Guide — Page 2" />
      </Page>

      {/* ─── PAGE 3: Timeline + Contacts + CTA ─── */}
      <Page size="A4" style={s.page}>
        {/* EXPECTED TIMELINE */}
        <SectionTitle>EXPECTED TIMELINE</SectionTitle>
        <View style={{ marginBottom: 12 }}>
          {[
            ['Report submission', 'Same day'],
            ['Exchange preservation response', '1-7 days'],
            ['Police acknowledgment', research.policeAgency.responseTime],
            ['Regulatory review', '2-8 weeks'],
            ['Investigation phase', '1-3 months'],
            ['Legal action / recovery', '3-12 months'],
          ].map(([stage, time], i) => (
            <View key={i} style={{ flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: slate200, paddingVertical: 4 }}>
              <Text style={{ fontSize: 9, color: slate900, width: 220 }}>{stage}</Text>
              <Text style={{ fontSize: 9, color: slate600, flex: 1 }}>{time}</Text>
            </View>
          ))}
        </View>

        {/* EMERGENCY CONTACTS */}
        <SectionTitle>EMERGENCY CONTACTS</SectionTitle>
        <View style={{ marginBottom: 12 }}>
          <Field label={research.policeAgency.shortName || 'Police'} value={research.contacts.emergencyPhone} />
          <Field label="Cybercrime" value={research.contacts.cybercrimeEmail} />
          <Field label="Consumer Protection" value={research.contacts.consumerProtection} />
        </View>

        {/* CTA BOX */}
        <View style={{ backgroundColor: '#1e293b', borderRadius: 8, padding: 16, marginTop: 12 }}>
          <Text style={{ fontSize: 12, fontFamily: 'NotoSans', fontWeight: 700, color: '#ffffff', marginBottom: 6 }}>NEED DEEPER INVESTIGATION?</Text>
          <Text style={{ fontSize: 9, color: '#cbd5e1', lineHeight: 1.5, marginBottom: 8 }}>
            This automated pack provides templates based on blockchain analysis. For complex cases requiring multi-hop fund tracing, identification of additional exchange endpoints, links to other victims, court-ready forensic reports, or expert witness testimony:
          </Text>
          <Text style={{ fontSize: 10, fontFamily: 'NotoSans', fontWeight: 700, color: '#60a5fa' }}>Email: contact@ledgerhound.vip</Text>
          <Text style={{ fontSize: 10, fontFamily: 'NotoSans', fontWeight: 700, color: '#60a5fa' }}>Phone: +1 (833) 559-1334</Text>
          <Text style={{ fontSize: 10, fontFamily: 'NotoSans', fontWeight: 700, color: '#60a5fa' }}>Web: ledgerhound.vip/full-investigation</Text>
        </View>

        {/* DISCLAIMER */}
        <View style={{ marginTop: 16 }}>
          <View style={s.separator} />
          <Text style={{ fontSize: 7, color: slate400, lineHeight: 1.4, marginTop: 4 }}>
            DISCLAIMER: This guide is for informational purposes only and does not constitute legal advice. LedgerHound (USPROJECT LLC) is not a law firm. Recovery is not guaranteed. Consult qualified legal counsel in your jurisdiction.
          </Text>
        </View>

        <DocFooter caseData={caseData} pageLabel="Action Guide — Page 3" />
      </Page>
    </Document>
  );
};
