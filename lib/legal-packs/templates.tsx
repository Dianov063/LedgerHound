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

/* Disable hyphenation for non-Latin scripts */
Font.registerHyphenationCallback((word: string) => [word]);

const blue = '#2563eb';
const slate900 = '#0f172a';
const slate600 = '#475569';
const slate400 = '#94a3b8';
const red = '#dc2626';

const s = StyleSheet.create({
  page: { padding: 50, fontFamily: 'NotoSans', fontSize: 10, color: slate900 },
  header: { marginBottom: 20, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  logo: { fontSize: 11, fontFamily: 'NotoSans', fontWeight: 700, color: blue, marginBottom: 4 },
  title: { fontSize: 16, fontFamily: 'NotoSans', fontWeight: 700, color: slate900, marginBottom: 4 },
  subtitle: { fontSize: 10, color: slate600 },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 12, fontFamily: 'NotoSans', fontWeight: 700, color: slate900, marginBottom: 8, backgroundColor: '#f1f5f9', padding: 6, borderRadius: 4 },
  label: { fontSize: 8, color: slate400, marginBottom: 2 },
  value: { fontSize: 10, color: slate900, marginBottom: 8 },
  row: { flexDirection: 'row', gap: 16, marginBottom: 4 },
  col: { flex: 1 },
  p: { fontSize: 10, color: slate600, lineHeight: 1.6, marginBottom: 8 },
  bullet: { fontSize: 10, color: slate600, lineHeight: 1.5, marginBottom: 3, paddingLeft: 12 },
  bold: { fontFamily: 'NotoSans', fontWeight: 700 },
  footer: { position: 'absolute', bottom: 30, left: 50, right: 50, flexDirection: 'row', justifyContent: 'space-between', fontSize: 7, color: slate400, borderTopWidth: 0.5, borderTopColor: '#e2e8f0', paddingTop: 8 },
  alertBox: { backgroundColor: '#fef2f2', borderRadius: 6, padding: 10, marginBottom: 12, borderWidth: 1, borderColor: '#fecaca' },
  infoBox: { backgroundColor: '#eff6ff', borderRadius: 6, padding: 10, marginBottom: 12, borderWidth: 1, borderColor: '#bfdbfe' },
  field: { borderBottomWidth: 0.5, borderBottomColor: '#cbd5e1', paddingBottom: 4, marginBottom: 10 },
  checkbox: { fontSize: 10, color: slate900, marginBottom: 4, paddingLeft: 16 },
});

const DocHeader = ({ title, subtitle, caseData }: { title: string; subtitle: string; caseData: CaseData }) => (
  <View style={s.header}>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <View>
        <Text style={s.logo}>LedgerHound</Text>
        <Text style={s.title}>{title}</Text>
        <Text style={s.subtitle}>{subtitle}</Text>
      </View>
      <View style={{ textAlign: 'right' as any }}>
        <Text style={{ fontSize: 8, color: slate400 }}>Case ID: {caseData.caseId}</Text>
        <Text style={{ fontSize: 8, color: slate400 }}>Date: {caseData.date}</Text>
      </View>
    </View>
  </View>
);

const DocFooter = ({ caseData, pageLabel }: { caseData: CaseData; pageLabel: string }) => (
  <View style={s.footer} fixed>
    <Text>LedgerHound · USPROJECT LLC · Confidential</Text>
    <Text>{pageLabel} · {caseData.caseId}</Text>
  </View>
);

const fmtMoney = (amount: number, currency: string = 'USD') =>
  `${currency} ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const shortAddr = (addr: string) =>
  addr && addr.length > 20 ? `${addr.slice(0, 10)}...${addr.slice(-8)}` : addr || '—';

// ─── Shared form styles ───
const form = StyleSheet.create({
  fieldBox: { backgroundColor: '#f8fafc', borderRadius: 4, borderWidth: 0.5, borderColor: '#e2e8f0', padding: 8, marginBottom: 8 },
  fieldRow: { flexDirection: 'row', marginBottom: 4 },
  fieldLabel: { fontSize: 8, color: slate400, width: 120 },
  fieldValue: { fontSize: 9, color: slate900, flex: 1, fontFamily: 'NotoSans', fontWeight: 700 },
  monoValue: { fontSize: 8, color: slate900, fontFamily: 'Courier', flex: 1 },
  evidenceBox: { backgroundColor: '#eff6ff', borderRadius: 6, padding: 10, marginBottom: 12, borderWidth: 1, borderColor: '#93c5fd' },
  lhFooter: { borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingTop: 8, marginTop: 'auto' as any },
  lhFooterLine: { fontSize: 7, color: slate400, textAlign: 'center' as any, marginBottom: 2 },
});

const FormField = ({ label, value, mono }: { label: string; value: string; mono?: boolean }) => (
  <View style={form.fieldRow}>
    <Text style={form.fieldLabel}>{label}:</Text>
    <Text style={mono ? form.monoValue : form.fieldValue}>{value || '________________________'}</Text>
  </View>
);

const scamTypes: [string, string[]][] = [
  ['Romance Scam / Pig Butchering', ['romance', 'pig']],
  ['Fake Investment Platform', ['fake', 'platform']],
  ['Investment / Ponzi Scheme', ['ponzi', 'investment']],
  ['Phishing / Wallet Drain', ['phishing', 'drain']],
  ['Rug Pull / Exit Scam', ['rug', 'exit']],
  ['Other', ['other']],
];

const isScamChecked = (scamType: string, keywords: string[]) =>
  scamType ? keywords.some(k => scamType.toLowerCase().includes(k)) : false;

// ─── 1. POLICE COMPLAINT (Enhanced) ───
export const PoliceComplaintDoc = ({ research, caseData }: { research: CountryResearch; caseData: CaseData }) => {
  const score = caseData.recoveryScore ?? 0;
  const riskLevel = caseData.riskLevel ?? 'medium';
  const hops = caseData.hops ?? 0;

  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* Header with badge */}
        <View style={s.header}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View>
              <Text style={s.logo}>LedgerHound</Text>
              <Text style={s.title}>CRYPTOCURRENCY FRAUD COMPLAINT</Text>
              <Text style={s.subtitle}>To: {research.policeAgency.name}</Text>
            </View>
            <View>
              <View style={{ backgroundColor: blue, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 3, marginBottom: 4 }}>
                <Text style={{ color: 'white', fontSize: 8, fontFamily: 'NotoSans', fontWeight: 700 }}>LH-{caseData.caseId}</Text>
              </View>
              <Text style={{ fontSize: 8, color: slate400, textAlign: 'right' as any }}>Date: {caseData.date}</Text>
            </View>
          </View>
        </View>

        {/* Section 1: Filing Information */}
        <View style={{ backgroundColor: '#f1f5f9', borderRadius: 6, padding: 10, marginBottom: 14 }}>
          <Text style={{ fontSize: 9, fontFamily: 'NotoSans', fontWeight: 700, color: slate900, marginBottom: 6 }}>FILING INFORMATION</Text>
          <FormField label="Filing with" value={`${research.policeAgency.name} (${research.policeAgency.shortName})`} />
          <FormField label="Jurisdiction" value={research.policeAgency.jurisdiction} />
          <FormField label="Online submission" value={research.policeAgency.complaintUrl} />
          <FormField label="Reference" value={`LH-${caseData.caseId}`} />
        </View>

        {/* Section 2: Complainant */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>COMPLAINANT INFORMATION</Text>
          <View style={form.fieldBox}>
            <FormField label="Full Name" value={caseData.victimName} />
            <FormField label="Email" value={caseData.victimEmail} />
            <FormField label="Phone" value={caseData.victimPhone || ''} />
            <FormField label="Country" value={research.name} />
            <FormField label="State/Region" value={caseData.state || ''} />
            <FormField label="Date of Filing" value={caseData.date} />
          </View>
        </View>

        {/* Section 3: Incident Details */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>INCIDENT DETAILS</Text>
          <View style={form.fieldBox}>
            <FormField label="Date of Incident" value={caseData.incidentDate} />
            <View style={form.fieldRow}>
              <Text style={form.fieldLabel}>Amount Lost:</Text>
              <Text style={{ fontSize: 9, color: red, fontFamily: 'NotoSans', fontWeight: 700, flex: 1 }}>{fmtMoney(caseData.lossAmount, caseData.lossCurrency)}</Text>
            </View>
            <FormField label="Cryptocurrency" value={caseData.cryptoType || 'ETH'} />
            <FormField label="Network" value={caseData.network?.toUpperCase() || 'Ethereum'} />
            <FormField label="Method of Contact" value={caseData.contactMethod || ''} />
            <FormField label="Platform Name" value={caseData.platformName} />
            <FormField label="Platform URL" value={caseData.platformUrl || ''} />
          </View>
        </View>

        {/* Section 4: Transaction Details */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>TRANSACTION DETAILS</Text>
          <View style={form.fieldBox}>
            <Text style={{ fontSize: 8, color: slate400, marginBottom: 2 }}>Scammer Wallet Address:</Text>
            <Text style={{ fontFamily: 'Courier', fontSize: 8, color: slate900, marginBottom: 6 }}>{caseData.scammerAddress || '________________________'}</Text>
            <Text style={{ fontSize: 8, color: slate400, marginBottom: 2 }}>Transaction Hash (TXID):</Text>
            <Text style={{ fontFamily: 'Courier', fontSize: 7, color: slate900, marginBottom: 6 }}>{caseData.txid || '________________________'}</Text>
            <FormField label="Sending Wallet" value={caseData.sourceWallet || ''} />
            <FormField label="Date/Time" value={caseData.txDateTime || caseData.incidentDate} />
          </View>
        </View>

        {/* Section 5: Blockchain Evidence */}
        <View style={form.evidenceBox}>
          <Text style={{ fontSize: 10, fontFamily: 'NotoSans', fontWeight: 700, color: blue, marginBottom: 6 }}>BLOCKCHAIN EVIDENCE (Verified by LedgerHound)</Text>
          <View style={form.fieldRow}>
            <Text style={form.fieldLabel}>Recovery Probability:</Text>
            <Text style={{ fontSize: 9, fontFamily: 'NotoSans', fontWeight: 700, color: score >= 60 ? '#16a34a' : score >= 35 ? '#d97706' : red, flex: 1 }}>{score}%</Text>
          </View>
          <View style={form.fieldRow}>
            <Text style={form.fieldLabel}>Risk Assessment:</Text>
            <Text style={{ fontSize: 9, fontFamily: 'NotoSans', fontWeight: 700, color: slate900, flex: 1 }}>{riskLevel.toUpperCase()}</Text>
          </View>
          <FormField label="Fund Destination" value={caseData.finalDestination || caseData.detectedExchange || 'Under investigation'} />
          {hops > 0 ? (
            <FormField label="Trace Summary" value={`Funds moved through ${hops} hops to ${caseData.finalDestination || 'unknown destination'}`} />
          ) : null}
          <Text style={{ fontSize: 8, color: blue, marginTop: 4 }}>Full trace report: www.ledgerhound.vip/case/{caseData.caseId}</Text>
        </View>

        <DocFooter caseData={caseData} pageLabel="Police Complaint — Page 1 of 2" />
      </Page>

      {/* Page 2 */}
      <Page size="A4" style={s.page}>
        <View style={{ marginBottom: 12 }}>
          <Text style={{ fontSize: 8, color: slate400 }}>LH-{caseData.caseId} — Cryptocurrency Fraud Complaint (continued)</Text>
        </View>

        {/* Section 6: Type of Fraud */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>TYPE OF FRAUD</Text>
          {scamTypes.map(([label, keywords], i) => (
            <Text key={i} style={s.checkbox}>
              [{isScamChecked(caseData.scamType, keywords) ? 'X' : ' '}] {label}
              {label === 'Other' && caseData.scamType && !scamTypes.slice(0, -1).some(([, kw]) => isScamChecked(caseData.scamType, kw))
                ? `: ${caseData.scamType}` : ''}
            </Text>
          ))}
        </View>

        {/* Section 7: Description */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>DESCRIPTION OF FRAUD</Text>
          <View style={{ backgroundColor: '#f8fafc', borderRadius: 4, padding: 10, borderWidth: 0.5, borderColor: '#e2e8f0', minHeight: 80 }}>
            <Text style={s.p}>{caseData.description || '[Victim to describe the fraud in detail — include how you were contacted, what was promised, what happened, and when you realized it was fraud]'}</Text>
          </View>
        </View>

        {/* Section 8: Applicable Law */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>APPLICABLE LAW</Text>
          <Text style={{ fontSize: 9, color: slate600, marginBottom: 4 }}>This complaint is filed under:</Text>
          {research.legalBasis.criminalCode.split(',').map((law, i) => (
            <Text key={i} style={{ fontSize: 9, color: slate900, paddingLeft: 12, marginBottom: 2 }}>{'\u2022'} {law.trim()}</Text>
          ))}
          <Text style={{ fontSize: 9, color: slate600, marginTop: 6 }}>
            Statute of Limitations: {research.legalBasis.statuteOfLimitations}
          </Text>
        </View>

        {/* Section 9: Evidence Attached */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>EVIDENCE ATTACHED</Text>
          <Text style={s.checkbox}>[X] Blockchain transaction proof (LedgerHound verified)</Text>
          <Text style={s.checkbox}>[ ] Screenshots of communications</Text>
          <Text style={s.checkbox}>[ ] Platform screenshots</Text>
          <Text style={s.checkbox}>[ ] Bank/exchange statements</Text>
          <Text style={s.checkbox}>[ ] Other: _______________</Text>
        </View>

        {/* Section 10: Declaration */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>DECLARATION</Text>
          <Text style={s.p}>
            I, {caseData.victimName || '[Name]'}, declare under penalty of perjury that the information provided in this complaint is true and accurate to the best of my knowledge. I understand that filing a false report may result in legal consequences.
          </Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 24 }}>
            <View>
              <Text style={s.label}>Signature</Text>
              <Text style={{ borderBottomWidth: 0.5, borderBottomColor: '#000', width: 200, paddingBottom: 20 }}> </Text>
            </View>
            <View>
              <Text style={s.label}>Date</Text>
              <Text style={{ borderBottomWidth: 0.5, borderBottomColor: '#000', width: 120, paddingBottom: 20 }}> </Text>
            </View>
          </View>
        </View>

        {/* Footer branding */}
        <View style={form.lhFooter}>
          <Text style={form.lhFooterLine}>Prepared with assistance from LedgerHound</Text>
          <Text style={form.lhFooterLine}>Blockchain Forensics · www.ledgerhound.vip</Text>
          <Text style={form.lhFooterLine}>Case Reference: LH-{caseData.caseId}</Text>
        </View>

        <DocFooter caseData={caseData} pageLabel="Police Complaint — Page 2 of 2" />
      </Page>
    </Document>
  );
};


// ─── 2. PRESERVATION LETTER (Enhanced Formal Letter) ───
export const PreservationLetterDoc = ({ research, caseData }: { research: CountryResearch; caseData: CaseData }) => {
  const score = caseData.recoveryScore ?? 0;
  const riskLevel = caseData.riskLevel ?? 'medium';
  const hops = caseData.hops ?? 0;

  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* Letterhead */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
          <View>
            <Text style={{ fontSize: 10, color: slate600 }}>Date: {caseData.date}</Text>
            <Text style={{ fontSize: 10, color: slate600 }}>Reference: LH-{caseData.caseId}</Text>
          </View>
          <View style={{ textAlign: 'right' as any }}>
            <Text style={s.logo}>LedgerHound</Text>
            <Text style={{ fontSize: 7, color: slate400 }}>Blockchain Forensics</Text>
          </View>
        </View>

        {/* Recipient */}
        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 10, fontFamily: 'NotoSans', fontWeight: 700, color: slate900 }}>{caseData.exchange || caseData.detectedExchange || '[Exchange Name]'} Compliance Department</Text>
        </View>

        {/* Subject */}
        <View style={{ borderBottomWidth: 1, borderBottomColor: slate900, paddingBottom: 8, marginBottom: 16 }}>
          <Text style={{ fontSize: 11, fontFamily: 'NotoSans', fontWeight: 700, color: slate900 }}>
            RE: URGENT REQUEST FOR TRANSACTION REVIEW AND ASSET PRESERVATION
          </Text>
          <Text style={{ fontSize: 9, color: slate600, marginTop: 2 }}>
            Suspected Cryptocurrency Fraud — Immediate Action Required
          </Text>
        </View>

        {/* Introduction */}
        <Text style={s.p}>Dear Compliance Team,</Text>
        <Text style={s.p}>
          I am writing to report suspected fraudulent activity involving cryptocurrency assets that were transferred to your platform. I am a victim of cryptocurrency fraud and am requesting your immediate assistance in reviewing and potentially freezing the associated assets pending investigation.
        </Text>

        {/* Transaction Details Box */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>TRANSACTION DETAILS</Text>
          <View style={form.fieldBox}>
            <FormField label="Cryptocurrency" value={caseData.cryptoType || 'ETH'} />
            <FormField label="Network" value={caseData.network?.toUpperCase() || 'Ethereum'} />
            <View style={form.fieldRow}>
              <Text style={form.fieldLabel}>USD Value:</Text>
              <Text style={{ fontSize: 9, color: red, fontFamily: 'NotoSans', fontWeight: 700, flex: 1 }}>{fmtMoney(caseData.lossAmount, caseData.lossCurrency)}</Text>
            </View>
            <Text style={{ fontSize: 8, color: slate400, marginBottom: 2, marginTop: 4 }}>Transaction Hash (TXID):</Text>
            <Text style={{ fontFamily: 'Courier', fontSize: 7, color: slate900, marginBottom: 6 }}>{caseData.txid || '________________________'}</Text>
            <Text style={{ fontSize: 8, color: slate400, marginBottom: 2 }}>Receiving Wallet Address:</Text>
            <Text style={{ fontFamily: 'Courier', fontSize: 8, color: slate900, marginBottom: 6 }}>{caseData.scammerAddress || '________________________'}</Text>
            <FormField label="Date/Time" value={caseData.txDateTime || caseData.incidentDate} />
            {caseData.blockNumber ? <FormField label="Block Number" value={caseData.blockNumber} /> : null}
          </View>
        </View>

        {/* Nature of Fraud */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>NATURE OF FRAUD</Text>
          <FormField label="Type" value={caseData.scamType || ''} />
          <FormField label="Platform Used" value={caseData.platformName} />
          <Text style={{ fontSize: 9, color: slate600, marginTop: 4, lineHeight: 1.5 }}>
            {caseData.description ? caseData.description.slice(0, 200) + (caseData.description.length > 200 ? '...' : '') : '[Description of fraud]'}
          </Text>
        </View>

        {/* Blockchain Evidence */}
        <View style={form.evidenceBox}>
          <Text style={{ fontSize: 10, fontFamily: 'NotoSans', fontWeight: 700, color: blue, marginBottom: 6 }}>BLOCKCHAIN EVIDENCE</Text>
          <Text style={{ fontSize: 9, color: slate600, marginBottom: 6 }}>
            This transaction has been traced and verified by LedgerHound, a blockchain forensics service. Our analysis indicates:
          </Text>
          <Text style={{ fontSize: 9, color: slate600, marginBottom: 2, paddingLeft: 8 }}>{'\u2022'} Funds originated from victim wallet: {shortAddr(caseData.sourceWallet || '')}</Text>
          <Text style={{ fontSize: 9, color: slate600, marginBottom: 2, paddingLeft: 8 }}>{'\u2022'} Funds arrived at address on your platform: {shortAddr(caseData.scammerAddress)}</Text>
          {hops > 0 ? <Text style={{ fontSize: 9, color: slate600, marginBottom: 2, paddingLeft: 8 }}>{'\u2022'} Number of hops: {hops}</Text> : null}
          <Text style={{ fontSize: 9, color: slate600, marginBottom: 2, paddingLeft: 8 }}>{'\u2022'} Risk Score: {score}/100 ({riskLevel.toUpperCase()})</Text>
          <Text style={{ fontSize: 8, color: blue, marginTop: 6 }}>Full forensic report: www.ledgerhound.vip/case/{caseData.caseId}</Text>
        </View>

        <DocFooter caseData={caseData} pageLabel="Preservation Letter — Page 1 of 2" />
      </Page>

      {/* Page 2 */}
      <Page size="A4" style={s.page}>
        <View style={{ marginBottom: 12 }}>
          <Text style={{ fontSize: 8, color: slate400 }}>LH-{caseData.caseId} — Preservation Letter (continued)</Text>
        </View>

        {/* Actions Requested */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>ACTIONS REQUESTED</Text>
          <View style={{ paddingLeft: 4 }}>
            <Text style={{ fontSize: 10, fontFamily: 'NotoSans', fontWeight: 700, color: slate900, marginBottom: 4 }}>1. IMMEDIATE ASSET FREEZE</Text>
            <Text style={{ fontSize: 9, color: slate600, marginBottom: 8, paddingLeft: 16 }}>Freeze any assets associated with wallet address {shortAddr(caseData.scammerAddress)} pending investigation.</Text>

            <Text style={{ fontSize: 10, fontFamily: 'NotoSans', fontWeight: 700, color: slate900, marginBottom: 4 }}>2. ACCOUNT REVIEW</Text>
            <Text style={{ fontSize: 9, color: slate600, marginBottom: 8, paddingLeft: 16 }}>Review the account associated with this wallet for suspicious activity.</Text>

            <Text style={{ fontSize: 10, fontFamily: 'NotoSans', fontWeight: 700, color: slate900, marginBottom: 4 }}>3. EVIDENCE PRESERVATION</Text>
            <Text style={{ fontSize: 9, color: slate600, marginBottom: 8, paddingLeft: 16 }}>Preserve all records, KYC documents, login history, and transaction records for this account.</Text>

            <Text style={{ fontSize: 10, fontFamily: 'NotoSans', fontWeight: 700, color: slate900, marginBottom: 4 }}>4. CONFIRMATION</Text>
            <Text style={{ fontSize: 9, color: slate600, marginBottom: 8, paddingLeft: 16 }}>Please confirm receipt of this request and any actions taken within 48 hours.</Text>
          </View>
        </View>

        {/* Legal Basis */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>LEGAL BASIS</Text>
          <Text style={s.p}>{research.preservationLetter.legalBasis}</Text>
          <Text style={s.p}>
            A formal police report has been filed with {research.policeAgency.name} (Reference: {caseData.policeReportNumber || 'pending'}).
          </Text>
        </View>

        {/* Contact Information */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>CONTACT INFORMATION</Text>
          <View style={form.fieldBox}>
            <FormField label="Victim Name" value={caseData.victimName} />
            <FormField label="Email" value={caseData.victimEmail} />
            {caseData.victimPhone ? <FormField label="Phone" value={caseData.victimPhone} /> : null}
            <FormField label="Case Reference" value={`LH-${caseData.caseId}`} />
          </View>
        </View>

        {/* Legal Notice */}
        <View style={s.alertBox}>
          <Text style={{ fontSize: 9, fontFamily: 'NotoSans', fontWeight: 700, color: red, marginBottom: 4 }}>LEGAL NOTICE</Text>
          <Text style={{ fontSize: 8, color: '#991b1b', lineHeight: 1.5 }}>
            Failure to take reasonable steps to preserve potentially fraudulent assets may result in liability. This letter serves as formal notice of suspected criminal activity on your platform.
          </Text>
        </View>

        {/* Closing */}
        <Text style={s.p}>
          I request a response within 48 hours confirming: (1) receipt of this request, (2) actions taken or planned, and (3) any additional information required.
        </Text>
        <Text style={s.p}>Thank you for your immediate attention to this matter.</Text>

        <Text style={{ fontSize: 10, marginTop: 16 }}>Sincerely,</Text>
        <View style={{ marginTop: 24 }}>
          <Text style={{ borderBottomWidth: 0.5, borderBottomColor: '#000', width: 250, paddingBottom: 20, marginBottom: 4 }}> </Text>
          <Text style={{ fontSize: 9, color: slate900 }}>{caseData.victimName || '[Name]'}</Text>
          <Text style={{ fontSize: 8, color: slate600 }}>{caseData.victimEmail || '[Email]'}</Text>
          <Text style={{ fontSize: 8, color: slate600 }}>{caseData.date}</Text>
        </View>

        {/* Footer branding */}
        <View style={{ ...form.lhFooter, marginTop: 30 }}>
          <Text style={form.lhFooterLine}>Prepared with assistance from LedgerHound</Text>
          <Text style={form.lhFooterLine}>Blockchain Forensics · www.ledgerhound.vip · +1 (833) 559-1334</Text>
        </View>

        <DocFooter caseData={caseData} pageLabel="Preservation Letter — Page 2 of 2" />
      </Page>
    </Document>
  );
};


// ─── 3. REGULATOR COMPLAINT (Enhanced) ───

const violationTypes: [string, string[]][] = [
  ['Unregistered securities offering', ['investment', 'ponzi', 'platform']],
  ['Investment fraud', ['investment', 'ponzi', 'fake']],
  ['Market manipulation', ['manipulation', 'pump']],
  ['Unlicensed money transmission', ['exchange', 'transfer']],
  ['Misleading advertising', ['fake', 'platform', 'romance']],
  ['Ponzi/pyramid scheme', ['ponzi', 'pyramid']],
  ['Other', ['other']],
];

export const RegulatorComplaintDoc = ({ research, caseData }: { research: CountryResearch; caseData: CaseData }) => (
  <Document>
    <Page size="A4" style={s.page}>
      {/* Header */}
      <View style={s.header}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View>
            <Text style={s.logo}>LedgerHound</Text>
            <Text style={s.title}>COMPLAINT TO FINANCIAL REGULATOR</Text>
            <Text style={s.subtitle}>Re: Cryptocurrency Investment Fraud</Text>
          </View>
          <View>
            <View style={{ backgroundColor: blue, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 3, marginBottom: 4 }}>
              <Text style={{ color: 'white', fontSize: 8, fontFamily: 'NotoSans', fontWeight: 700 }}>LH-{caseData.caseId}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Section 1: Regulatory Body */}
      <View style={s.infoBox}>
        <Text style={{ fontSize: 9, fontFamily: 'NotoSans', fontWeight: 700, color: blue, marginBottom: 6 }}>REGULATORY BODY</Text>
        <FormField label="Filing with" value={`${research.financialRegulator.name} (${research.financialRegulator.shortName})`} />
        <FormField label="Online" value={research.financialRegulator.tipUrl} />
        <FormField label="Scope" value={research.financialRegulator.scope} />
      </View>

      {/* Section 2: Complainant */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>COMPLAINANT</Text>
        <View style={form.fieldBox}>
          <FormField label="Name" value={caseData.victimName} />
          <FormField label="Email" value={caseData.victimEmail} />
          <FormField label="Country" value={research.name} />
          <FormField label="Date" value={caseData.date} />
          <FormField label="Police Report" value={caseData.policeReportNumber || 'To be filed'} />
        </View>
      </View>

      {/* Section 3: Subject of Complaint */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>SUBJECT OF COMPLAINT</Text>
        <View style={form.fieldBox}>
          <FormField label="Platform/Entity" value={caseData.platformName} />
          <FormField label="Website" value={caseData.platformUrl || ''} />
          <FormField label="Type of Activity" value={caseData.scamType || ''} />
          <FormField label="Period of Activity" value={`${caseData.incidentDate} to ${caseData.date}`} />
        </View>
      </View>

      {/* Section 4: Financial Details */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>FINANCIAL DETAILS</Text>
        <View style={form.fieldBox}>
          <View style={form.fieldRow}>
            <Text style={form.fieldLabel}>Amount Lost:</Text>
            <Text style={{ fontSize: 9, color: red, fontFamily: 'NotoSans', fontWeight: 700, flex: 1 }}>{fmtMoney(caseData.lossAmount, caseData.lossCurrency)}</Text>
          </View>
          <FormField label="Cryptocurrency" value={caseData.cryptoType || 'ETH'} />
          <FormField label="Payment Method" value={caseData.paymentMethod || 'Cryptocurrency transfer'} />
          {caseData.promisedReturns ? <FormField label="Promised Returns" value={caseData.promisedReturns} /> : null}
        </View>
      </View>

      {/* Section 5: Nature of Violation */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>NATURE OF VIOLATION</Text>
        {violationTypes.map(([label, keywords], i) => (
          <Text key={i} style={s.checkbox}>
            [{caseData.scamType && keywords.some(k => caseData.scamType.toLowerCase().includes(k)) ? 'X' : ' '}] {label}
          </Text>
        ))}
      </View>

      {/* Section 6: Description */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>DESCRIPTION</Text>
        <View style={{ backgroundColor: '#f8fafc', borderRadius: 4, padding: 10, borderWidth: 0.5, borderColor: '#e2e8f0', minHeight: 60 }}>
          <Text style={s.p}>{caseData.description || '[Describe how you were contacted, what was promised, and what happened]'}</Text>
        </View>
      </View>

      <DocFooter caseData={caseData} pageLabel="Regulator Complaint — Page 1 of 2" />
    </Page>

    {/* Page 2 */}
    <Page size="A4" style={s.page}>
      <View style={{ marginBottom: 12 }}>
        <Text style={{ fontSize: 8, color: slate400 }}>LH-{caseData.caseId} — Complaint to Financial Regulator (continued)</Text>
      </View>

      {/* Section 7: Evidence Summary */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>EVIDENCE SUMMARY</Text>
        <View style={form.evidenceBox}>
          <Text style={{ fontSize: 9, color: slate600, marginBottom: 2, paddingLeft: 4 }}>{'\u2022'} Blockchain evidence verified by LedgerHound (Case: LH-{caseData.caseId})</Text>
          <Text style={{ fontSize: 9, color: slate600, marginBottom: 2, paddingLeft: 4 }}>{'\u2022'} Transaction traced to: {caseData.finalDestination || caseData.detectedExchange || 'under investigation'}</Text>
          {caseData.txid ? <Text style={{ fontSize: 9, color: slate600, marginBottom: 2, paddingLeft: 4 }}>{'\u2022'} Transaction hash: {shortAddr(caseData.txid)}</Text> : null}
          <Text style={{ fontSize: 9, color: slate600, paddingLeft: 4 }}>{'\u2022'} Police complaint filed with {research.policeAgency.shortName}</Text>
        </View>
      </View>

      {/* Section 8: Other Victims */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>OTHER VICTIMS</Text>
        <Text style={s.checkbox}>[{caseData.otherVictimsCount ? 'X' : ' '}] I am aware of other victims</Text>
        <Text style={s.checkbox}>[{caseData.otherVictimsCount ? 'X' : ' '}] Estimated number of victims: {caseData.otherVictimsCount || '___'}</Text>
        <Text style={s.checkbox}>[{caseData.totalEstimatedLosses ? 'X' : ' '}] Total estimated losses: {caseData.totalEstimatedLosses ? fmtMoney(caseData.totalEstimatedLosses) : '$___'}</Text>
        {caseData.victimGroupSlug ? (
          <Text style={s.checkbox}>[X] Victim group: www.ledgerhound.vip/recovery-group/{caseData.victimGroupSlug}</Text>
        ) : (
          <Text style={s.checkbox}>[ ] Victim group exists</Text>
        )}
      </View>

      {/* Section 9: Requested Action */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>REQUESTED ACTION</Text>
        <Text style={{ fontSize: 9, color: slate900, marginBottom: 4, paddingLeft: 4 }}>1. Investigation of {caseData.platformName || '[Platform]'}</Text>
        <Text style={{ fontSize: 9, color: slate900, marginBottom: 4, paddingLeft: 4 }}>2. Enforcement action if violations confirmed</Text>
        <Text style={{ fontSize: 9, color: slate900, marginBottom: 4, paddingLeft: 4 }}>3. Coordination with law enforcement ({research.policeAgency.shortName})</Text>
        <Text style={{ fontSize: 9, color: slate900, marginBottom: 4, paddingLeft: 4 }}>4. Public warning to prevent additional victims</Text>
      </View>

      {/* Declaration */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>DECLARATION</Text>
        <Text style={s.p}>
          I, {caseData.victimName || '[Name]'}, declare under penalty of perjury that the information provided in this complaint is true and accurate to the best of my knowledge. I request that the {research.financialRegulator.shortName} investigate this matter and take appropriate enforcement action.
        </Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 24 }}>
          <View>
            <Text style={s.label}>Signature</Text>
            <Text style={{ borderBottomWidth: 0.5, borderBottomColor: '#000', width: 200, paddingBottom: 20 }}> </Text>
          </View>
          <View>
            <Text style={s.label}>Date</Text>
            <Text style={{ borderBottomWidth: 0.5, borderBottomColor: '#000', width: 120, paddingBottom: 20 }}> </Text>
          </View>
        </View>
      </View>

      {/* Footer branding */}
      <View style={form.lhFooter}>
        <Text style={form.lhFooterLine}>Prepared with assistance from LedgerHound</Text>
        <Text style={form.lhFooterLine}>Blockchain Forensics · www.ledgerhound.vip</Text>
        <Text style={form.lhFooterLine}>Case Reference: LH-{caseData.caseId}</Text>
      </View>

      <DocFooter caseData={caseData} pageLabel="Regulator Complaint — Page 2 of 2" />
    </Page>
  </Document>
);


// ─── 4. ACTION GUIDE (Enhanced Multi-Page) ───

const green = '#16a34a';
const amber = '#d97706';
const purple = '#7c3aed';
const emerald = '#059669';

const ag = StyleSheet.create({
  caseBadge: { backgroundColor: blue, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 3, alignSelf: 'flex-start' as any },
  caseBadgeText: { color: 'white', fontSize: 8, fontFamily: 'NotoSans', fontWeight: 700 },
  summaryBox: { backgroundColor: '#eff6ff', borderRadius: 8, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: '#bfdbfe' },
  summaryRow: { flexDirection: 'row', marginBottom: 6 },
  summaryLabel: { fontSize: 9, color: slate600, width: 110 },
  summaryValue: { fontSize: 9, fontFamily: 'NotoSans', fontWeight: 700, color: slate900, flex: 1 },
  analysisBox: { backgroundColor: '#f0fdf4', borderRadius: 8, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: '#bbf7d0' },
  scoreCircle: { width: 56, height: 56, borderRadius: 28, borderWidth: 3, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  scoreText: { fontSize: 18, fontFamily: 'NotoSans', fontWeight: 700 },
  scoreLabel: { fontSize: 7, color: slate600, marginTop: 1 },
  riskBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start' as any },
  riskText: { fontSize: 8, fontFamily: 'NotoSans', fontWeight: 700, color: 'white' },
  warningBox: { borderRadius: 8, padding: 12, marginBottom: 16, borderWidth: 1.5 },
  stepContainer: { marginBottom: 14 },
  stepHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  stepCircle: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  stepNum: { color: 'white', fontFamily: 'NotoSans', fontWeight: 700, fontSize: 13 },
  stepTitle: { fontSize: 12, fontFamily: 'NotoSans', fontWeight: 700, color: slate900 },
  stepWhy: { backgroundColor: '#f8fafc', borderRadius: 4, padding: 8, marginBottom: 6, borderLeftWidth: 3, borderLeftColor: '#cbd5e1' },
  stepWhyText: { fontSize: 8, color: slate600, fontStyle: 'italic' },
  checkItem: { flexDirection: 'row', marginBottom: 3, paddingLeft: 36 },
  checkBox: { width: 10, height: 10, borderWidth: 1, borderColor: '#94a3b8', borderRadius: 2, marginRight: 6, marginTop: 1 },
  checkText: { fontSize: 9, color: slate900, flex: 1 },
  stepLink: { fontSize: 8, color: blue, paddingLeft: 36, marginTop: 2 },
  timelineRow: { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: '#e2e8f0', paddingVertical: 6 },
  timelineStage: { flex: 1, fontSize: 9, color: slate900, fontFamily: 'NotoSans', fontWeight: 700 },
  timelineTime: { flex: 1, fontSize: 9, color: slate600 },
  timelineHeader: { flexDirection: 'row', backgroundColor: '#f1f5f9', paddingVertical: 5, paddingHorizontal: 4, borderRadius: 4, marginBottom: 2 },
  insightBox: { borderRadius: 8, padding: 12, marginBottom: 16, borderWidth: 1 },
  ctaBox: { backgroundColor: '#0f172a', borderRadius: 8, padding: 16, marginBottom: 16 },
  ctaTitle: { fontSize: 12, fontFamily: 'NotoSans', fontWeight: 700, color: '#38bdf8', marginBottom: 6 },
  ctaBullet: { fontSize: 9, color: '#e2e8f0', marginBottom: 3, paddingLeft: 8 },
  ctaContact: { fontSize: 10, fontFamily: 'NotoSans', fontWeight: 700, color: '#38bdf8', marginTop: 10 },
});

const getRiskColor = (level?: string) => {
  switch (level) {
    case 'low': return green;
    case 'medium': return amber;
    case 'high': return '#ea580c';
    case 'critical': return red;
    default: return slate600;
  }
};

const getScoreColor = (score?: number) => {
  if (!score) return slate400;
  if (score >= 60) return green;
  if (score >= 35) return amber;
  return red;
};

const StepBlock = ({ num, title, color, why, children }: {
  num: number; title: string; color: string; why: string; children: React.ReactNode;
}) => (
  <View style={ag.stepContainer} wrap={false}>
    <View style={ag.stepHeader}>
      <View style={{ ...ag.stepCircle, backgroundColor: color }}>
        <Text style={ag.stepNum}>{num}</Text>
      </View>
      <Text style={ag.stepTitle}>{title}</Text>
    </View>
    <View style={ag.stepWhy}>
      <Text style={ag.stepWhyText}>Why this matters: {why}</Text>
    </View>
    {children}
  </View>
);

const CheckItem = ({ text }: { text: string }) => (
  <View style={ag.checkItem}>
    <View style={ag.checkBox} />
    <Text style={ag.checkText}>{text}</Text>
  </View>
);

export const ActionGuideDoc = ({ research, caseData }: { research: CountryResearch; caseData: CaseData }) => {
  const score = caseData.recoveryScore ?? 45;
  const riskLevel = caseData.riskLevel ?? 'medium';
  const daysOld = caseData.daysOld ?? 0;
  const hops = caseData.hops ?? 0;
  const detectedExchange = caseData.detectedExchange;
  const exchangeSupportsLE = caseData.exchangeSupportsLE ?? false;
  const mixerDetected = caseData.mixerDetected ?? false;
  const urgencyLevel = caseData.urgencyLevel ?? (daysOld <= 3 ? 'CRITICAL' : daysOld <= 7 ? 'HIGH' : 'MODERATE');
  const timeWindow = caseData.timeWindow ?? (daysOld <= 3 ? '24 hours' : daysOld <= 7 ? '48 hours' : '1 week');

  return (
    <Document>
      {/* ─── PAGE 1: Summary + Analysis + Warning + Steps 1-2 ─── */}
      <Page size="A4" style={s.page}>
        {/* Header */}
        <View style={s.header}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View>
              <Text style={s.logo}>LedgerHound</Text>
              <Text style={{ fontSize: 16, fontFamily: 'NotoSans', fontWeight: 700, color: slate900, marginBottom: 6 }}>
                Emergency Recovery Action Guide
              </Text>
            </View>
            <View style={ag.caseBadge}>
              <Text style={ag.caseBadgeText}>LH-{caseData.caseId}</Text>
            </View>
          </View>
        </View>

        {/* Section 1: Case Summary */}
        <View style={ag.summaryBox}>
          <Text style={{ fontSize: 10, fontFamily: 'NotoSans', fontWeight: 700, color: blue, marginBottom: 8 }}>CASE SUMMARY</Text>
          <View style={ag.summaryRow}>
            <Text style={ag.summaryLabel}>Case ID:</Text>
            <Text style={ag.summaryValue}>LH-{caseData.caseId}</Text>
          </View>
          <View style={ag.summaryRow}>
            <Text style={ag.summaryLabel}>Date:</Text>
            <Text style={ag.summaryValue}>{caseData.date}</Text>
          </View>
          {caseData.victimName ? (
            <View style={ag.summaryRow}>
              <Text style={ag.summaryLabel}>Victim:</Text>
              <Text style={ag.summaryValue}>{caseData.victimName}</Text>
            </View>
          ) : null}
          <View style={ag.summaryRow}>
            <Text style={ag.summaryLabel}>Estimated Loss:</Text>
            <Text style={{ ...ag.summaryValue, color: red }}>{fmtMoney(caseData.lossAmount, caseData.lossCurrency)}</Text>
          </View>
          {caseData.platformName ? (
            <View style={ag.summaryRow}>
              <Text style={ag.summaryLabel}>Platform:</Text>
              <Text style={ag.summaryValue}>{caseData.platformName}</Text>
            </View>
          ) : null}
        </View>

        {/* Section 2: Recovery Analysis */}
        <View style={ag.analysisBox}>
          <Text style={{ fontSize: 10, fontFamily: 'NotoSans', fontWeight: 700, color: emerald, marginBottom: 10 }}>RECOVERY ANALYSIS</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
            {/* Score Circle */}
            <View style={{ ...ag.scoreCircle, borderColor: getScoreColor(score) }}>
              <Text style={{ ...ag.scoreText, color: getScoreColor(score) }}>{score}%</Text>
              <Text style={ag.scoreLabel}>Recovery</Text>
            </View>
            {/* Fund Status */}
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 9, fontFamily: 'NotoSans', fontWeight: 700, color: slate900, marginBottom: 4 }}>Fund Status:</Text>
              <Text style={{ fontSize: 8, color: slate600, marginBottom: 2 }}>
                {'\u2022'} {detectedExchange ? `Funds traced to ${detectedExchange}` : 'Funds in unknown wallet'}
              </Text>
              <Text style={{ fontSize: 8, color: slate600, marginBottom: 2 }}>
                {'\u2022'} {exchangeSupportsLE ? 'Exchange supports law enforcement requests' : 'No KYC exchange detected'}
              </Text>
              {hops > 0 ? (
                <Text style={{ fontSize: 8, color: slate600, marginBottom: 2 }}>
                  {'\u2022'} {hops} hop{hops !== 1 ? 's' : ''} from source
                </Text>
              ) : null}
              {mixerDetected ? (
                <Text style={{ fontSize: 8, color: red, marginBottom: 2 }}>
                  {'\u2022'} Mixer/tumbler detected — tracing difficulty increased
                </Text>
              ) : null}
            </View>
          </View>
          {/* Risk + Urgency row */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ fontSize: 8, color: slate600, marginRight: 6 }}>Risk Level:</Text>
              <View style={{ ...ag.riskBadge, backgroundColor: getRiskColor(riskLevel) }}>
                <Text style={ag.riskText}>{riskLevel.toUpperCase()}</Text>
              </View>
            </View>
            <Text style={{ fontSize: 8, color: slate900, fontFamily: 'NotoSans', fontWeight: 700 }}>
              {urgencyLevel} — Action required within {timeWindow}
            </Text>
          </View>
        </View>

        {/* Section 3: Warning Box */}
        {daysOld <= 3 ? (
          <View style={{ ...ag.warningBox, backgroundColor: '#fef2f2', borderColor: '#fca5a5' }}>
            <Text style={{ fontSize: 10, fontFamily: 'NotoSans', fontWeight: 700, color: red, marginBottom: 4 }}>
              CRITICAL WINDOW
            </Text>
            <Text style={{ fontSize: 9, color: '#991b1b', lineHeight: 1.5 }}>
              The first 24-72 hours are critical for fund recovery. Exchanges are more likely to freeze assets before funds are withdrawn or laundered. Every hour of delay reduces your chance of recovery. Act NOW.
            </Text>
          </View>
        ) : daysOld > 7 ? (
          <View style={{ ...ag.warningBox, backgroundColor: '#fffbeb', borderColor: '#fcd34d' }}>
            <Text style={{ fontSize: 10, fontFamily: 'NotoSans', fontWeight: 700, color: amber, marginBottom: 4 }}>
              REDUCED CHANCES
            </Text>
            <Text style={{ fontSize: 9, color: '#92400e', lineHeight: 1.5 }}>
              Your transaction was {daysOld} days ago. While recovery is still possible, the probability decreases significantly after 72 hours. Focus on building the strongest possible paper trail for legal proceedings.
            </Text>
          </View>
        ) : (
          <View style={{ ...ag.warningBox, backgroundColor: '#fffbeb', borderColor: '#fcd34d' }}>
            <Text style={{ fontSize: 10, fontFamily: 'NotoSans', fontWeight: 700, color: amber, marginBottom: 4 }}>
              URGENT — TIME-SENSITIVE
            </Text>
            <Text style={{ fontSize: 9, color: '#92400e', lineHeight: 1.5 }}>
              Your transaction was {daysOld} days ago. You are still within the effective recovery window but must act immediately. Exchanges typically process preservation requests within 24-48 hours.
            </Text>
          </View>
        )}

        {/* Section 4: Steps 1-2 */}
        <StepBlock
          num={1} title="Report the Crime" color={blue}
          why="A police report creates an official record that exchanges and courts require. Without it, your case has no legal standing."
        >
          <CheckItem text={`File complaint with ${research.policeAgency.name} (${research.policeAgency.shortName})`} />
          <CheckItem text="Use the attached Police Complaint form as your template" />
          <CheckItem text="Save your complaint reference number — you will need it for all other steps" />
          <CheckItem text={`Expected response: ${research.policeAgency.responseTime}`} />
          <Text style={ag.stepLink}>Online portal: {research.policeAgency.complaintUrl}</Text>
        </StepBlock>

        <StepBlock
          num={2} title={detectedExchange ? `Notify ${detectedExchange}` : 'Notify the Exchange'} color={red}
          why="Exchanges can freeze accounts within hours of receiving a valid preservation request, preventing the scammer from withdrawing your funds."
        >
          <CheckItem text={`Send Preservation Letter to ${detectedExchange || caseData.exchange || 'the exchange'} compliance department`} />
          <CheckItem text="Attach your police report reference number" />
          <CheckItem text={`Include: TXID, wallet address, amount (${fmtMoney(caseData.lossAmount, caseData.lossCurrency)})`} />
          <CheckItem text="Send via email AND certified mail if possible" />
          <CheckItem text="Follow up if no response within 24-48 hours" />
          <Text style={ag.stepLink}>Expected response: {research.preservationLetter.typicalResponse}</Text>
        </StepBlock>

        <DocFooter caseData={caseData} pageLabel="Action Guide — Page 1 of 3" />
      </Page>

      {/* ─── PAGE 2: Steps 3-5 + Additional Agencies + Timeline ─── */}
      <Page size="A4" style={s.page}>
        <View style={{ marginBottom: 12 }}>
          <Text style={{ fontSize: 8, color: slate400 }}>LH-{caseData.caseId} — Emergency Recovery Action Guide (continued)</Text>
        </View>

        <StepBlock
          num={3} title="Report to Financial Authorities" color={amber}
          why="Regulatory complaints trigger investigations and create a paper trail. Multiple complaints about the same entity increase the chance of enforcement action."
        >
          <CheckItem text={`File complaint with ${research.financialRegulator.name} (${research.financialRegulator.shortName})`} />
          <CheckItem text="Use the attached Regulator Complaint form" />
          <CheckItem text="Reference your police report number" />
          <Text style={ag.stepLink}>Online: {research.financialRegulator.tipUrl}</Text>
        </StepBlock>

        <StepBlock
          num={4} title="Preserve Evidence" color={green}
          why="Digital evidence disappears quickly. Scammers delete profiles, platforms go offline, and chat histories expire. Preservation NOW is critical for any legal action later."
        >
          <CheckItem text="Screenshots of all conversations with the scammer" />
          <CheckItem text="Transaction receipts and confirmations" />
          <CheckItem text="All wallet addresses involved" />
          <CheckItem text="Platform URLs (screenshot the site before it goes down)" />
          <CheckItem text="Complete timeline of events with dates" />
          <CheckItem text="Export chat histories (WhatsApp, Telegram, email)" />
          <CheckItem text="Save social media profiles of the scammer" />
        </StepBlock>

        <StepBlock
          num={5} title="Evaluate Legal Options" color={purple}
          why="Civil litigation can recover funds even when criminal prosecution stalls. An attorney can also issue subpoenas to exchanges and request court-ordered asset freezes."
        >
          <Text style={{ fontSize: 9, color: slate600, paddingLeft: 36, marginBottom: 4 }}>
            Civil remedies available in {research.name}:
          </Text>
          {research.legalBasis.civilRemedies.map((remedy, i) => (
            <CheckItem key={i} text={remedy} />
          ))}
          <CheckItem text="Consult an attorney experienced in cryptocurrency fraud" />
          <Text style={{ fontSize: 8, color: slate400, paddingLeft: 36, marginTop: 4 }}>
            Statute of limitations: {research.legalBasis.statuteOfLimitations}
          </Text>
        </StepBlock>

        {/* Additional Agencies */}
        {research.additionalAgencies.length > 0 && (
          <View style={{ ...s.section, marginTop: 4 }}>
            <Text style={s.sectionTitle}>ADDITIONAL AGENCIES TO CONTACT</Text>
            {research.additionalAgencies.map((agency, i) => (
              <View key={i} style={{ flexDirection: 'row', marginBottom: 6, paddingLeft: 4 }}>
                <Text style={{ fontSize: 9, color: blue, marginRight: 6 }}>{'\u25B8'}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 9, fontFamily: 'NotoSans', fontWeight: 700, color: slate900 }}>{agency.name}</Text>
                  <Text style={{ fontSize: 8, color: blue }}>{agency.url}</Text>
                  <Text style={{ fontSize: 7, color: slate400 }}>When: {agency.when}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Section 5: Expected Timeline */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>EXPECTED TIMELINE</Text>
          <View style={ag.timelineHeader}>
            <Text style={{ ...ag.timelineStage, fontSize: 8, color: slate600 }}>Stage</Text>
            <Text style={{ ...ag.timelineTime, fontSize: 8, color: slate600 }}>Timeframe</Text>
          </View>
          {[
            ['Report submission', 'Same day'],
            ['Exchange preservation response', '1-7 days'],
            ['Police acknowledgment', research.policeAgency.responseTime || '1-4 weeks'],
            ['Regulatory review', '2-8 weeks'],
            ['Investigation phase', '1-3 months'],
            ['Legal action / recovery', '3-12 months'],
          ].map(([stage, time], i) => (
            <View key={i} style={{ ...ag.timelineRow, backgroundColor: i % 2 === 0 ? '#f8fafc' : 'white' }}>
              <Text style={ag.timelineStage}>{stage}</Text>
              <Text style={ag.timelineTime}>{time}</Text>
            </View>
          ))}
        </View>

        <DocFooter caseData={caseData} pageLabel="Action Guide — Page 2 of 3" />
      </Page>

      {/* ─── PAGE 3: Insight + Contacts + CTA + Disclaimer ─── */}
      <Page size="A4" style={s.page}>
        <View style={{ marginBottom: 12 }}>
          <Text style={{ fontSize: 8, color: slate400 }}>LH-{caseData.caseId} — Emergency Recovery Action Guide (continued)</Text>
        </View>

        {/* Section 6: Personalized Insight */}
        {score >= 60 ? (
          <View style={{ ...ag.insightBox, backgroundColor: '#f0fdf4', borderColor: '#86efac' }}>
            <Text style={{ fontSize: 10, fontFamily: 'NotoSans', fontWeight: 700, color: green, marginBottom: 4 }}>RECOVERY OUTLOOK: FAVORABLE</Text>
            <Text style={{ fontSize: 9, color: '#166534', lineHeight: 1.6 }}>
              Good news: {detectedExchange ? `Funds were detected on ${detectedExchange}, a KYC-compliant exchange.` : 'Funds are traceable on the blockchain.'} This significantly increases recovery chances. KYC exchanges are legally required to cooperate with law enforcement and can freeze accounts quickly. Focus on filing your police report and preservation letter immediately — speed is your greatest advantage.
            </Text>
          </View>
        ) : score >= 35 ? (
          <View style={{ ...ag.insightBox, backgroundColor: '#fffbeb', borderColor: '#fcd34d' }}>
            <Text style={{ fontSize: 10, fontFamily: 'NotoSans', fontWeight: 700, color: amber, marginBottom: 4 }}>RECOVERY OUTLOOK: MODERATE</Text>
            <Text style={{ fontSize: 9, color: '#92400e', lineHeight: 1.6 }}>
              Recovery is possible but will require persistence. {mixerDetected ? 'A mixer/tumbler was detected in the transaction chain, which complicates tracing.' : 'The funds have moved through multiple hops.'} Complete all five steps in this guide. Building a comprehensive evidence package will be crucial for any legal action. Consider a professional forensic trace to identify additional leads.
            </Text>
          </View>
        ) : (
          <View style={{ ...ag.insightBox, backgroundColor: '#fef2f2', borderColor: '#fca5a5' }}>
            <Text style={{ fontSize: 10, fontFamily: 'NotoSans', fontWeight: 700, color: red, marginBottom: 4 }}>RECOVERY OUTLOOK: CHALLENGING</Text>
            <Text style={{ fontSize: 9, color: '#991b1b', lineHeight: 1.6 }}>
              Recovery will be challenging{mixerDetected ? ' due to mixer/tumbler usage in the transaction chain' : daysOld > 30 ? ` — your transaction was ${daysOld} days ago and funds have likely been moved` : ''}. However, completing all steps still provides value: it creates a legal record, may help identify the perpetrator, and contributes to broader fraud investigations. Consider joining our Victim Recovery Group to combine resources with other affected individuals.
            </Text>
          </View>
        )}

        {/* Emergency Contacts */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>EMERGENCY CONTACTS</Text>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1, backgroundColor: '#f8fafc', borderRadius: 6, padding: 10 }}>
              <Text style={{ fontSize: 8, fontFamily: 'NotoSans', fontWeight: 700, color: blue, marginBottom: 4 }}>Cybercrime</Text>
              {research.contacts.emergencyPhone ? (
                <Text style={{ fontSize: 8, color: slate600, marginBottom: 2 }}>Phone: {research.contacts.emergencyPhone}</Text>
              ) : null}
              {research.contacts.cybercrimeEmail ? (
                <Text style={{ fontSize: 8, color: slate600 }}>Email: {research.contacts.cybercrimeEmail}</Text>
              ) : null}
            </View>
            <View style={{ flex: 1, backgroundColor: '#f8fafc', borderRadius: 6, padding: 10 }}>
              <Text style={{ fontSize: 8, fontFamily: 'NotoSans', fontWeight: 700, color: blue, marginBottom: 4 }}>Consumer Protection</Text>
              <Text style={{ fontSize: 8, color: slate600 }}>{research.contacts.consumerProtection || 'See regulator above'}</Text>
            </View>
          </View>
        </View>

        {/* Section 7: Upsell CTA */}
        <View style={ag.ctaBox}>
          <Text style={ag.ctaTitle}>ADVANCED BLOCKCHAIN FORENSIC TRACE</Text>
          <Text style={{ fontSize: 9, color: '#94a3b8', marginBottom: 8, lineHeight: 1.5 }}>
            Our forensic team uses advanced blockchain analysis tools to build court-ready evidence packages:
          </Text>
          <Text style={ag.ctaBullet}>{'\u2022'} Track funds across multiple wallets and chains</Text>
          <Text style={ag.ctaBullet}>{'\u2022'} Identify exchange endpoints and off-ramp locations</Text>
          <Text style={ag.ctaBullet}>{'\u2022'} Detect links to other victims for group legal action</Text>
          <Text style={ag.ctaBullet}>{'\u2022'} Build court-ready forensic report with visualizations</Text>
          <Text style={ag.ctaBullet}>{'\u2022'} Expert witness testimony available</Text>
          <View style={{ marginTop: 10, borderTopWidth: 0.5, borderTopColor: '#334155', paddingTop: 10 }}>
            <Text style={{ fontSize: 10, fontFamily: 'NotoSans', fontWeight: 700, color: 'white', marginBottom: 4 }}>
              Request Full Forensic Analysis
            </Text>
            <Text style={ag.ctaContact}>contact@ledgerhound.vip | +1 (833) 559-1334</Text>
            <Text style={{ fontSize: 8, color: '#64748b', marginTop: 4 }}>www.ledgerhound.vip</Text>
          </View>
        </View>

        {/* Disclaimer */}
        <View style={{ marginTop: 'auto' as any, paddingTop: 12, borderTopWidth: 0.5, borderTopColor: '#e2e8f0' }}>
          <Text style={{ fontSize: 7, color: slate400, lineHeight: 1.5 }}>
            DISCLAIMER: This guide is provided for informational purposes only and does not constitute legal advice. LedgerHound (USPROJECT LLC) is not a law firm and does not provide legal representation. Recovery of cryptocurrency funds is not guaranteed. The recovery score is an estimate based on blockchain analysis and does not guarantee any specific outcome. Consult with a qualified attorney in your jurisdiction for legal advice specific to your situation. Past recovery performance does not guarantee future results.
          </Text>
        </View>

        <DocFooter caseData={caseData} pageLabel="Action Guide — Page 3 of 3" />
      </Page>
    </Document>
  );
};
