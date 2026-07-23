'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import {
  AlertTriangle,
  CheckCircle2,
  Database,
  ExternalLink,
  FileText,
  Loader2,
  Lock,
  Search,
  ShieldCheck,
} from 'lucide-react';

type PaymentRail =
  | 'zelle'
  | 'cashapp'
  | 'venmo'
  | 'paypal'
  | 'apple_cash'
  | 'chime'
  | 'wise'
  | 'revolut'
  | 'iban'
  | 'bank_account'
  | 'phone'
  | 'email'
  | 'social_handle'
  | 'marketplace_profile'
  | 'other';

type ScamCategory =
  | 'non_delivery_goods'
  | 'fake_service'
  | 'deposit_advance_fee'
  | 'rental_scam'
  | 'ticket_scam'
  | 'marketplace_scam'
  | 'employment_scam'
  | 'other';

type SaleChannel =
  | 'facebook_marketplace'
  | 'instagram'
  | 'tiktok'
  | 'craigslist'
  | 'offerup'
  | 'nextdoor'
  | 'telegram'
  | 'discord'
  | 'direct_website'
  | 'text_message'
  | 'other';

type CommunityLanguage =
  | 'english'
  | 'russian'
  | 'spanish'
  | 'chinese'
  | 'arabic'
  | 'french'
  | 'portuguese'
  | 'ukrainian'
  | 'vietnamese'
  | 'hindi'
  | 'other';

type ReportDestination =
  | 'payment_provider'
  | 'bank_or_card_issuer'
  | 'marketplace'
  | 'ftc'
  | 'state_attorney_general'
  | 'ic3';

interface IdentityView {
  identityHash: string;
  country: string;
  rail: PaymentRail;
  identityMask: string;
  categories: ScamCategory[];
  paymentMethodDetails: string[];
  categoryDetails: string[];
  aliases: string[];
  states: string[];
  reportCount: number;
  independentReporters: number;
  paymentProofCount: number;
  totalReportedAmount: number;
  currency: string;
  firstReported: string;
  lastReported: string;
  publicLevel: string;
  publicEligible: boolean;
  indexedEligible: boolean;
}

interface PublicStats {
  totalReports: number;
  totalIdentities: number;
  publicEligibleIdentities: number;
  paymentProofReports: number;
}

const RAILS: { value: PaymentRail; label: string }[] = [
  { value: 'zelle', label: 'Zelle' },
  { value: 'cashapp', label: 'Cash App' },
  { value: 'venmo', label: 'Venmo' },
  { value: 'paypal', label: 'PayPal' },
  { value: 'apple_cash', label: 'Apple Cash' },
  { value: 'chime', label: 'Chime' },
  { value: 'wise', label: 'Wise' },
  { value: 'revolut', label: 'Revolut' },
  { value: 'iban', label: 'IBAN' },
  { value: 'bank_account', label: 'Bank account' },
  { value: 'phone', label: 'Phone' },
  { value: 'email', label: 'Email' },
  { value: 'social_handle', label: 'Social handle' },
  { value: 'marketplace_profile', label: 'Marketplace profile' },
  { value: 'other', label: 'Other' },
];

const CATEGORIES: { value: ScamCategory; label: string }[] = [
  { value: 'non_delivery_goods', label: 'Goods not delivered' },
  { value: 'fake_service', label: 'Fake service' },
  { value: 'deposit_advance_fee', label: 'Deposit / advance fee' },
  { value: 'rental_scam', label: 'Rental scam' },
  { value: 'ticket_scam', label: 'Ticket scam' },
  { value: 'marketplace_scam', label: 'Marketplace scam' },
  { value: 'employment_scam', label: 'Employment scam' },
  { value: 'other', label: 'Other' },
];

const SALE_CHANNEL_OPTIONS: { value: SaleChannel; label: string }[] = [
  { value: 'facebook_marketplace', label: 'Facebook Marketplace' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'craigslist', label: 'Craigslist' },
  { value: 'offerup', label: 'OfferUp' },
  { value: 'nextdoor', label: 'Nextdoor' },
  { value: 'telegram', label: 'Telegram' },
  { value: 'discord', label: 'Discord' },
  { value: 'direct_website', label: 'Website' },
  { value: 'text_message', label: 'Text message' },
  { value: 'other', label: 'Other' },
];

const COMMUNITY_LANGUAGE_OPTIONS: { value: CommunityLanguage; label: string }[] = [
  { value: 'english', label: 'English-speaking' },
  { value: 'russian', label: 'Russian-speaking' },
  { value: 'spanish', label: 'Spanish-speaking' },
  { value: 'chinese', label: 'Chinese-speaking' },
  { value: 'arabic', label: 'Arabic-speaking' },
  { value: 'french', label: 'French-speaking' },
  { value: 'portuguese', label: 'Portuguese-speaking' },
  { value: 'ukrainian', label: 'Ukrainian-speaking' },
  { value: 'vietnamese', label: 'Vietnamese-speaking' },
  { value: 'hindi', label: 'Hindi-speaking' },
  { value: 'other', label: 'Other language' },
];

const US_STATE_CODES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'DC', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA',
  'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM',
  'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA',
  'WV', 'WI', 'WY', 'PR',
];

const REPORT_DESTINATION_OPTIONS: { value: ReportDestination; label: string }[] = [
  { value: 'payment_provider', label: 'Payment app' },
  { value: 'bank_or_card_issuer', label: 'Bank or card issuer' },
  { value: 'marketplace', label: 'Marketplace' },
  { value: 'ftc', label: 'FTC' },
  { value: 'state_attorney_general', label: 'State attorney general' },
  { value: 'ic3', label: 'IC3' },
];

const PROVIDER_RECOVERY: Partial<Record<PaymentRail, { instruction: string; href: string; linkLabel: string }>> = {
  zelle: {
    instruction: 'Contact the bank or credit union that provides your Zelle service immediately.',
    href: 'https://www.zellepay.com/safety-education/zeller-safety-101',
    linkLabel: 'Zelle safety guidance',
  },
  cashapp: {
    instruction: 'Open the payment, choose Report an Issue, then I was scammed.',
    href: 'https://cash.app/outsmart-scams',
    linkLabel: 'Cash App scam reporting',
  },
  venmo: {
    instruction: 'Open Venmo support from the app and report the payment and recipient profile.',
    href: 'https://help.venmo.com/cs/contact-us',
    linkLabel: 'Contact Venmo',
  },
  paypal: {
    instruction: 'Open a dispute in the PayPal Resolution Center if the transaction is eligible.',
    href: 'https://www.paypal.com/disputes/',
    linkLabel: 'PayPal Resolution Center',
  },
  apple_cash: {
    instruction: 'Review the transaction and contact an Apple Cash Specialist at Green Dot Bank.',
    href: 'https://support.apple.com/en-us/117946',
    linkLabel: 'Apple Cash transaction help',
  },
  chime: {
    instruction: 'Contact Chime support and report the Pay Anyone transfer.',
    href: 'https://help.chime.com/can-i-file-a-dispute-for-a-pay-anyone-transfer-b7e0ebd3',
    linkLabel: 'Chime Pay Anyone help',
  },
};

const ISO_COUNTRY_CODES = [
  'AD', 'AE', 'AF', 'AG', 'AI', 'AL', 'AM', 'AO', 'AQ', 'AR', 'AS', 'AT', 'AU', 'AW', 'AX', 'AZ',
  'BA', 'BB', 'BD', 'BE', 'BF', 'BG', 'BH', 'BI', 'BJ', 'BL', 'BM', 'BN', 'BO', 'BQ', 'BR', 'BS',
  'BT', 'BV', 'BW', 'BY', 'BZ', 'CA', 'CC', 'CD', 'CF', 'CG', 'CH', 'CI', 'CK', 'CL', 'CM', 'CN',
  'CO', 'CR', 'CU', 'CV', 'CW', 'CX', 'CY', 'CZ', 'DE', 'DJ', 'DK', 'DM', 'DO', 'DZ', 'EC', 'EE',
  'EG', 'EH', 'ER', 'ES', 'ET', 'FI', 'FJ', 'FK', 'FM', 'FO', 'FR', 'GA', 'GB', 'GD', 'GE', 'GF',
  'GG', 'GH', 'GI', 'GL', 'GM', 'GN', 'GP', 'GQ', 'GR', 'GS', 'GT', 'GU', 'GW', 'GY', 'HK', 'HM',
  'HN', 'HR', 'HT', 'HU', 'ID', 'IE', 'IL', 'IM', 'IN', 'IO', 'IQ', 'IR', 'IS', 'IT', 'JE', 'JM',
  'JO', 'JP', 'KE', 'KG', 'KH', 'KI', 'KM', 'KN', 'KP', 'KR', 'KW', 'KY', 'KZ', 'LA', 'LB', 'LC',
  'LI', 'LK', 'LR', 'LS', 'LT', 'LU', 'LV', 'LY', 'MA', 'MC', 'MD', 'ME', 'MF', 'MG', 'MH', 'MK',
  'ML', 'MM', 'MN', 'MO', 'MP', 'MQ', 'MR', 'MS', 'MT', 'MU', 'MV', 'MW', 'MX', 'MY', 'MZ', 'NA',
  'NC', 'NE', 'NF', 'NG', 'NI', 'NL', 'NO', 'NP', 'NR', 'NU', 'NZ', 'OM', 'PA', 'PE', 'PF', 'PG',
  'PH', 'PK', 'PL', 'PM', 'PN', 'PR', 'PS', 'PT', 'PW', 'PY', 'QA', 'RE', 'RO', 'RS', 'RU', 'RW',
  'SA', 'SB', 'SC', 'SD', 'SE', 'SG', 'SH', 'SI', 'SJ', 'SK', 'SL', 'SM', 'SN', 'SO', 'SR', 'SS',
  'ST', 'SV', 'SX', 'SY', 'SZ', 'TC', 'TD', 'TF', 'TG', 'TH', 'TJ', 'TK', 'TL', 'TM', 'TN', 'TO',
  'TR', 'TT', 'TV', 'TW', 'TZ', 'UA', 'UG', 'UM', 'US', 'UY', 'UZ', 'VA', 'VC', 'VE', 'VG', 'VI',
  'VN', 'VU', 'WF', 'WS', 'YE', 'YT', 'ZA', 'ZM', 'ZW',
] as const;

function formatAmount(amount: number, currency: string) {
  if (!amount) return '$0';
  return `${currency || 'USD'} ${amount.toLocaleString()}`;
}

function formatCategory(category: string) {
  return CATEGORIES.find((c) => c.value === category)?.label || category;
}

export default function PaymentSafetyPage() {
  const locale = useLocale();
  const base = locale === 'en' ? '' : `/${locale}`;
  const countryOptions = useMemo(() => {
    const displayNames = new Intl.DisplayNames([locale, 'en'], { type: 'region' });
    const countries: { code: string; label: string }[] = ISO_COUNTRY_CODES
      .map((code) => ({ code, label: displayNames.of(code) || code }))
      .sort((a, b) => a.label.localeCompare(b.label, locale));
    return [
      ...countries,
      { code: 'EU', label: locale === 'ru' ? 'Европейский союз' : 'European Union' },
      { code: 'OTHER', label: locale === 'ru' ? 'Другая территория' : 'Other territory' },
    ];
  }, [locale]);

  const [mode, setMode] = useState<'check' | 'report'>('check');

  const [checkCountry, setCheckCountry] = useState('US');
  const [checkRail, setCheckRail] = useState<PaymentRail>('zelle');
  const [checkIdentifier, setCheckIdentifier] = useState('');
  const [checkLoading, setCheckLoading] = useState(false);
  const [checkError, setCheckError] = useState('');
  const [checkResult, setCheckResult] = useState<{ matched: boolean; identity: IdentityView | null } | null>(null);
  const [publicWarnings, setPublicWarnings] = useState<IdentityView[]>([]);
  const [warningsLoading, setWarningsLoading] = useState(true);
  const [publicStats, setPublicStats] = useState<PublicStats | null>(null);

  const [reportStatus, setReportStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [reportError, setReportError] = useState('');
  const [reportId, setReportId] = useState('');
  const [submittedEmail, setSubmittedEmail] = useState('');
  const [verificationEmailSent, setVerificationEmailSent] = useState(false);
  const [verificationNotice, setVerificationNotice] = useState<'verified' | 'error' | ''>('');
  const [reportRail, setReportRail] = useState<PaymentRail>('zelle');
  const [reportCountry, setReportCountry] = useState('US');
  const [reportCategory, setReportCategory] = useState<ScamCategory>('non_delivery_goods');
  const [reportSaleChannel, setReportSaleChannel] = useState<SaleChannel>('facebook_marketplace');
  const [reportCommunityLanguage, setReportCommunityLanguage] = useState<CommunityLanguage>('english');
  const [refundRequested, setRefundRequested] = useState(false);
  const [submittedRail, setSubmittedRail] = useState<PaymentRail>('zelle');
  const [reportFiles, setReportFiles] = useState<File[]>([]);
  const [uploadStatus, setUploadStatus] = useState('');

  useEffect(() => {
    fetch('/api/non-crypto-scam-database/search')
      .then((res) => res.json())
      .then((data) => setPublicWarnings(Array.isArray(data.identities) ? data.identities : []))
      .catch(() => setPublicWarnings([]))
      .finally(() => setWarningsLoading(false));
  }, []);

  useEffect(() => {
    fetch('/api/non-crypto-scam-database/stats')
      .then((res) => res.json())
      .then((data) => setPublicStats(typeof data.totalReports === 'number' ? data : null))
      .catch(() => setPublicStats(null));
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('emailVerified') === '1') setVerificationNotice('verified');
    if (params.get('emailVerificationError') === '1') setVerificationNotice('error');
    if (params.get('mode') === 'report') setMode('report');
    const category = params.get('category') as ScamCategory | null;
    if (category && CATEGORIES.some((item) => item.value === category)) setReportCategory(category);
    const channel = params.get('channel') as SaleChannel | null;
    if (channel && SALE_CHANNEL_OPTIONS.some((item) => item.value === channel)) setReportSaleChannel(channel);
    const language = params.get('language') as CommunityLanguage | null;
    if (language && COMMUNITY_LANGUAGE_OPTIONS.some((item) => item.value === language)) setReportCommunityLanguage(language);
  }, []);

  async function handleCheck(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setCheckLoading(true);
    setCheckError('');
    setCheckResult(null);
    try {
      const params = new URLSearchParams({
        country: checkCountry,
        rail: checkRail,
        paymentIdentifier: checkIdentifier,
      });
      const res = await fetch(`/api/non-crypto-scam-database/search?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Search failed');
      setCheckResult({ matched: data.matched, identity: data.identity || null });
    } catch (err: any) {
      setCheckError(err.message || 'Search failed');
    } finally {
      setCheckLoading(false);
    }
  }

  async function handleReport(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setReportStatus('loading');
    setReportError('');
    setReportId('');
    setUploadStatus(reportFiles.length > 0 ? `Uploading ${reportFiles.length} evidence file(s)...` : '');

    const data = new FormData(e.currentTarget);
    const evidenceTypes = [
      data.get('payment_receipt') ? 'payment_receipt' : '',
      data.get('chat_screenshot') ? 'chat_screenshot' : '',
      data.get('marketplace_listing') ? 'marketplace_listing' : '',
    ].filter(Boolean);
    const reportedTo = REPORT_DESTINATION_OPTIONS
      .filter(({ value }) => data.get(`reportedTo_${value}`))
      .map(({ value }) => value);

    try {
      const evidenceFiles: string[] = [];
      for (const file of reportFiles.slice(0, 5)) {
        const uploadData = new FormData();
        uploadData.append('file', file);
        const uploadRes = await fetch('/api/non-crypto-scam-database/upload', {
          method: 'POST',
          body: uploadData,
        });
        const uploaded = await uploadRes.json();
        if (!uploadRes.ok) throw new Error(uploaded.error || `Failed to upload ${file.name}`);
        evidenceFiles.push(uploaded.key);
      }
      setUploadStatus(evidenceFiles.length > 0 ? 'Evidence uploaded. Submitting report...' : '');

      const res = await fetch('/api/non-crypto-scam-database/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          country: data.get('country'),
          rail: data.get('rail'),
          paymentMethodDetails: data.get('paymentMethodDetails'),
          paymentIdentifier: data.get('paymentIdentifier'),
          recipientName: data.get('recipientName'),
          businessName: data.get('businessName'),
          aliases: String(data.get('aliases') || '')
            .split(',')
            .map((a) => a.trim())
            .filter(Boolean),
          category: data.get('category'),
          categoryDetails: data.get('categoryDetails'),
          amount: data.get('amount'),
          currency: data.get('currency') || 'USD',
          incidentDate: data.get('incidentDate'),
          saleChannel: data.get('saleChannel'),
          saleChannelDetails: data.get('saleChannelDetails'),
          usState: data.get('usState'),
          communityLanguage: data.get('communityLanguage'),
          communityName: data.get('communityName'),
          sellerProfile: data.get('sellerProfile'),
          listingUrl: data.get('listingUrl'),
          itemOrService: data.get('itemOrService'),
          promisedDeliveryDate: data.get('promisedDeliveryDate'),
          refundRequested: data.get('refundRequested') === 'on',
          refundRequestDate: data.get('refundRequestDate'),
          lastContactDate: data.get('lastContactDate'),
          transactionReference: data.get('transactionReference'),
          reportedTo,
          externalReportReference: data.get('externalReportReference'),
          description: data.get('description'),
          reporterEmail: data.get('reporterEmail'),
          locale,
          evidenceTypes,
          evidenceFiles,
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || 'Report failed');
      setSubmittedRail(reportRail);
      setSubmittedEmail(String(data.get('reporterEmail') || ''));
      setVerificationEmailSent(body.verificationEmailSent === true);
      setReportId(body.reportId);
      setReportStatus('success');
      e.currentTarget.reset();
      setReportFiles([]);
      setUploadStatus('');
      setReportRail('zelle');
      setReportCountry('US');
      setReportCategory('non_delivery_goods');
      setReportSaleChannel('facebook_marketplace');
      setReportCommunityLanguage('english');
      setRefundRequested(false);
    } catch (err: any) {
      setReportError(err.message || 'Report failed');
      setReportStatus('error');
      setUploadStatus('');
    }
  }

  async function resendVerification() {
    setReportError('');
    try {
      const res = await fetch('/api/non-crypto-scam-database/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportId, email: submittedEmail, locale }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || 'Unable to resend verification email');
      setVerificationEmailSent(true);
    } catch (err: any) {
      setReportError(err.message || 'Unable to resend verification email');
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="pt-32 pb-20">
        {verificationNotice && (
          <div className={`max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-5 ${verificationNotice === 'verified' ? 'text-emerald-800' : 'text-red-800'}`}>
            <div className={`rounded-lg border px-4 py-3 text-sm font-semibold ${verificationNotice === 'verified' ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50'}`}>
              {verificationNotice === 'verified'
                ? 'Email verified. Your report can now be reviewed by the moderation team.'
                : 'This verification link is invalid, expired, or already used.'}
            </div>
          </div>
        )}
        <section className="border-b border-slate-200 bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
            <div className="grid lg:grid-cols-[1fr_26rem] gap-10 items-start">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-bold text-brand-700 mb-5">
                  <Database size={13} />
                  Payment recipient safety
                </div>
                <h1 className="font-display font-bold text-4xl lg:text-5xl text-slate-950 leading-tight mb-4">
                  Check a payment recipient before sending money.
                </h1>
                <p className="text-lg text-slate-600 max-w-2xl">
                  Search by Zelle, Cash App, Venmo, PayPal, Apple Cash, Chime, bank account, phone, email, or marketplace handle. Full identifiers are matched privately; public results show masked details only.
                </p>
              </div>

              <div className="bg-slate-950 text-white rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Lock size={18} className="text-emerald-400" />
                  <h2 className="font-display font-bold text-lg">Privacy defaults</h2>
                </div>
                <div className="space-y-3 text-sm text-slate-300">
                  <p>One report stays private.</p>
                  <p>Three independent reports can create a public warning.</p>
                  <p>Five reports, or three with payment proof, can become index-eligible.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 mb-6">
            <button
              type="button"
              onClick={() => setMode('check')}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                mode === 'check' ? 'bg-brand-600 text-white' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Search size={15} />
              Check recipient
            </button>
            <button
              type="button"
              onClick={() => setMode('report')}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                mode === 'report' ? 'bg-brand-600 text-white' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <FileText size={15} />
              Report recipient
            </button>
          </div>

          {mode === 'check' ? (
            <div className="grid lg:grid-cols-[1fr_24rem] gap-8 items-start">
              <form onSubmit={handleCheck} className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
                <h2 className="font-display font-bold text-2xl text-slate-950 mb-6">Recipient check</h2>
                <div className="grid sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Country</label>
                    <select value={checkCountry} onChange={(e) => setCheckCountry(e.target.value)} className="input bg-white">
                      {countryOptions.map(({ code, label }) => (
                        <option key={code} value={code}>{label} ({code})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Payment method</label>
                    <select value={checkRail} onChange={(e) => setCheckRail(e.target.value as PaymentRail)} className="input bg-white">
                      {RAILS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                    </select>
                  </div>
                </div>
                <div className="mb-5">
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Recipient identifier</label>
                  <input
                    value={checkIdentifier}
                    onChange={(e) => setCheckIdentifier(e.target.value)}
                    required
                    className="input"
                    placeholder="Phone, email, $cashtag, @handle, IBAN, account"
                  />
                </div>
                {checkError && (
                  <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {checkError}
                  </div>
                )}
                <button type="submit" disabled={checkLoading} className="btn-primary w-full justify-center py-3 disabled:opacity-60">
                  {checkLoading ? <Loader2 size={17} className="animate-spin" /> : <Search size={17} />}
                  Check recipient
                </button>
              </form>

              <ResultPanel result={checkResult} />
            </div>
          ) : (
            <form onSubmit={handleReport} className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
              <div className="flex items-start justify-between gap-4 mb-6">
                <div>
                  <h2 className="font-display font-bold text-2xl text-slate-950">Report a payment recipient</h2>
                  <p className="text-sm text-slate-500 mt-1">The report is private until enough independent reports match the same recipient.</p>
                </div>
                <ShieldCheck size={26} className="text-brand-600 shrink-0" />
              </div>

              <div className="grid md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Country</label>
                  <select
                    name="country"
                    value={reportCountry}
                    onChange={(event) => setReportCountry(event.target.value)}
                    className="input bg-white"
                  >
                    {countryOptions.map(({ code, label }) => (
                      <option key={code} value={code}>{label} ({code})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Payment method</label>
                  <select
                    name="rail"
                    value={reportRail}
                    onChange={(e) => setReportRail(e.target.value as PaymentRail)}
                    className="input bg-white"
                  >
                    {RAILS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Category</label>
                  <select
                    name="category"
                    value={reportCategory}
                    onChange={(e) => setReportCategory(e.target.value as ScamCategory)}
                    className="input bg-white"
                  >
                    {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
              </div>

              {(reportRail === 'other' || reportCategory === 'other') && (
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  {reportRail === 'other' && (
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">Payment method details</label>
                      <input
                        name="paymentMethodDetails"
                        required
                        minLength={3}
                        className="input"
                        placeholder="SEPA transfer, local wallet, courier deposit"
                      />
                    </div>
                  )}
                  {reportCategory === 'other' && (
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">Category details</label>
                      <input
                        name="categoryDetails"
                        required
                        minLength={3}
                        className="input"
                        placeholder="Cake order, repair service, pet deposit"
                      />
                    </div>
                  )}
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Recipient identifier</label>
                  <input name="paymentIdentifier" required minLength={3} className="input" placeholder="Phone, email, $cashtag, account" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Your email</label>
                  <input name="reporterEmail" type="email" required className="input" placeholder="you@example.com" />
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Recipient name</label>
                  <input name="recipientName" className="input" placeholder="Name shown on payment" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Business name</label>
                  <input name="businessName" className="input" placeholder="Shop, profile, company" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Aliases</label>
                  <input name="aliases" className="input" placeholder="Comma-separated names" />
                </div>
              </div>

              <div className="border-t border-slate-200 pt-5 mt-5 mb-4">
                <h3 className="font-display font-bold text-base text-slate-950 mb-4">Sale details</h3>
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Item or service</label>
                    <input name="itemOrService" required minLength={3} maxLength={120} className="input" placeholder="Concert ticket, cake order, repair" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Where you found the seller</label>
                    <select
                      name="saleChannel"
                      value={reportSaleChannel}
                      onChange={(e) => setReportSaleChannel(e.target.value as SaleChannel)}
                      className="input bg-white"
                    >
                      {SALE_CHANNEL_OPTIONS.map((channel) => (
                        <option key={channel.value} value={channel.value}>{channel.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {reportSaleChannel === 'other' && (
                  <div className="mb-4">
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Sale channel details</label>
                    <input name="saleChannelDetails" required minLength={3} maxLength={120} className="input" placeholder="Local group, community board, messaging app" />
                  </div>
                )}

                <div className="grid md:grid-cols-3 gap-4 mb-4">
                  {reportCountry === 'US' ? (
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">US state</label>
                      <select name="usState" defaultValue="" className="input bg-white">
                        <option value="">Not specified</option>
                        {US_STATE_CODES.map((state) => <option key={state} value={state}>{state}</option>)}
                      </select>
                    </div>
                  ) : null}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Community language</label>
                    <select
                      name="communityLanguage"
                      value={reportCommunityLanguage}
                      onChange={(event) => setReportCommunityLanguage(event.target.value as CommunityLanguage)}
                      className="input bg-white"
                    >
                      {COMMUNITY_LANGUAGE_OPTIONS.map((language) => (
                        <option key={language.value} value={language.value}>{language.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Group or channel name</label>
                    <input name="communityName" maxLength={160} className="input" placeholder="Kept private for moderation" />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Seller profile or handle</label>
                    <input name="sellerProfile" maxLength={200} className="input" placeholder="@seller or profile name" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Listing URL</label>
                    <input name="listingUrl" type="url" maxLength={500} className="input" placeholder="https://..." />
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-4 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Amount</label>
                  <input name="amount" type="number" min="0.01" step="0.01" className="input" placeholder="35" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Currency</label>
                  <input name="currency" defaultValue="USD" className="input" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Incident date</label>
                  <input name="incidentDate" type="date" className="input" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Transaction reference</label>
                  <input name="transactionReference" maxLength={160} className="input" placeholder="From payment receipt" />
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Promised delivery date</label>
                  <input name="promisedDeliveryDate" type="date" className="input" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Last seller response</label>
                  <input name="lastContactDate" type="date" className="input" />
                </div>
                <div className="flex flex-col justify-end">
                  <label className="flex min-h-[46px] items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      name="refundRequested"
                      checked={refundRequested}
                      onChange={(e) => setRefundRequested(e.target.checked)}
                      className="accent-brand-600"
                    />
                    Refund requested
                  </label>
                </div>
              </div>

              {refundRequested && (
                <div className="mb-4 max-w-sm">
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Refund request date</label>
                  <input name="refundRequestDate" type="date" className="input" />
                </div>
              )}

              <div className="mb-4">
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Evidence available</label>
                <div className="grid sm:grid-cols-3 gap-2">
                  {[
                    ['payment_receipt', 'Payment receipt'],
                    ['chat_screenshot', 'Chat screenshot'],
                    ['marketplace_listing', 'Listing/profile'],
                  ].map(([name, label]) => (
                    <label key={name} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                      <input type="checkbox" name={name} className="accent-brand-600" />
                      {label}
                    </label>
                  ))}
                </div>
              </div>

              <div className="mb-5">
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Upload evidence</label>
                <input
                  type="file"
                  multiple
                  accept="image/png,image/jpeg,image/webp,application/pdf"
                  onChange={(e) => setReportFiles(Array.from(e.target.files || []).slice(0, 5))}
                  className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-slate-800"
                />
                <p className="mt-1 text-xs text-slate-500">Optional. Up to 5 files, 10MB each. PDF, PNG, JPG, or WebP.</p>
                {reportFiles.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {reportFiles.map((file) => (
                      <span key={`${file.name}-${file.size}`} className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600">
                        {file.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="border-t border-slate-200 pt-5 mt-5 mb-5">
                <h3 className="font-display font-bold text-base text-slate-950 mb-1">Reports already filed</h3>
                <p className="text-xs text-slate-500 mb-3">Select every organization you already contacted.</p>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2 mb-4">
                  {REPORT_DESTINATION_OPTIONS.map(({ value, label }) => (
                    <label key={value} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                      <input type="checkbox" name={`reportedTo_${value}`} className="accent-brand-600" />
                      {label}
                    </label>
                  ))}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">External report number</label>
                  <input name="externalReportReference" maxLength={160} className="input" placeholder="FTC, marketplace, bank, or provider case number" />
                </div>
              </div>

              <div className="mb-5">
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">What happened?</label>
                <textarea
                  name="description"
                  required
                  minLength={80}
                  rows={6}
                  className="input resize-none"
                  placeholder="Include the product or service, promised delivery date, payment method, and what happened after payment."
                />
              </div>

              {reportStatus === 'success' && (
                <div className="mb-5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-800">
                  <p className="font-semibold">Report received. ID: <span className="font-mono">{reportId}</span></p>
                  <p className="mt-1">
                    {verificationEmailSent
                      ? `Verification email sent to ${submittedEmail}.`
                      : 'The verification email could not be sent.'}
                  </p>
                  <button type="button" onClick={resendVerification} className="mt-2 font-semibold underline underline-offset-2">
                    Resend verification email
                  </button>
                  <RecoveryActions rail={submittedRail} />
                </div>
              )}
              {uploadStatus && (
                <div className="mb-5 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
                  {uploadStatus}
                </div>
              )}
              {reportError && (
                <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {reportError}
                </div>
              )}

              <button type="submit" disabled={reportStatus === 'loading'} className="btn-primary w-full justify-center py-3 disabled:opacity-60">
                {reportStatus === 'loading' ? <Loader2 size={17} className="animate-spin" /> : <FileText size={17} />}
                Submit private report
              </button>
            </form>
          )}
        </section>

        <PublicStatsBand stats={publicStats} />
        <PublicWarningsSection warnings={publicWarnings} loading={warningsLoading} base={base} />
      </main>

      <Footer />
    </div>
  );
}

function PublicStatsBand({ stats }: { stats: PublicStats | null }) {
  if (!stats) return null;
  const items = [
    ['Private reports', stats.totalReports],
    ['Payment recipients', stats.totalIdentities],
    ['Public warnings', stats.publicEligibleIdentities],
    ['Accepted payment proofs', stats.paymentProofReports],
  ];
  return (
    <section className="border-t border-slate-200 bg-slate-950 text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-7 grid grid-cols-2 lg:grid-cols-4 gap-5">
        {items.map(([label, value]) => (
          <div key={String(label)}>
            <p className="font-display text-2xl font-bold">{Number(value).toLocaleString()}</p>
            <p className="text-xs text-slate-400 mt-1">{label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function RecoveryActions({ rail }: { rail: PaymentRail }) {
  const provider = PROVIDER_RECOVERY[rail];
  return (
    <div className="border-t border-emerald-200 mt-3 pt-3">
      <p className="font-semibold mb-2">Act now</p>
      <ol className="list-decimal pl-5 space-y-1.5 text-emerald-900">
        {provider && <li>{provider.instruction}</li>}
        <li>Contact the bank or card issuer that funded the payment and ask what dispute options apply.</li>
        <li>Report the seller profile to the marketplace or social platform.</li>
        <li>File a report with the Federal Trade Commission.</li>
      </ol>
      <div className="flex flex-wrap gap-3 mt-3">
        {provider && (
          <a href={provider.href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-semibold underline underline-offset-2">
            {provider.linkLabel} <ExternalLink size={13} />
          </a>
        )}
        <a href="https://reportfraud.ftc.gov/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-semibold underline underline-offset-2">
          Report to the FTC <ExternalLink size={13} />
        </a>
      </div>
      <p className="text-xs text-emerald-700 mt-3">Recovery is not guaranteed. Never pay anyone who promises a refund for an upfront fee.</p>
    </div>
  );
}

function PublicWarningsSection({ warnings, loading, base }: { warnings: IdentityView[]; loading: boolean; base: string }) {
  const [railFilter, setRailFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const availableStates = Array.from(new Set(warnings.flatMap((warning) => warning.states || []))).sort();
  const visible = [...warnings]
    .filter((warning) => !railFilter || warning.rail === railFilter)
    .filter((warning) => !categoryFilter || warning.categories.includes(categoryFilter as ScamCategory))
    .filter((warning) => !stateFilter || warning.states?.includes(stateFilter))
    .sort((a, b) => b.lastReported.localeCompare(a.lastReported))
    .slice(0, 12);

  return (
    <section className="border-t border-slate-200 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h2 className="font-display font-bold text-2xl text-slate-950">Public payment warnings</h2>
            <p className="text-sm text-slate-500 mt-1">
              Only recipients with corroborated independent reports appear here.
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
            <ShieldCheck size={13} />
            Masked identifiers
          </div>
        </div>
        <div className="mb-5">
          <Link href={`${base}/payment-safety/correction`} className="text-sm font-semibold text-brand-600 hover:text-brand-700">
            Request a correction or appeal a warning
          </Link>
        </div>

        <div className="grid sm:grid-cols-3 gap-3 mb-6" aria-label="Warning filters">
          <select value={railFilter} onChange={(event) => setRailFilter(event.target.value)} className="input bg-white" aria-label="Filter by payment method">
            <option value="">All payment methods</option>
            {RAILS.map((rail) => <option key={rail.value} value={rail.value}>{rail.label}</option>)}
          </select>
          <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} className="input bg-white" aria-label="Filter by category">
            <option value="">All categories</option>
            {CATEGORIES.map((category) => <option key={category.value} value={category.value}>{category.label}</option>)}
          </select>
          <select value={stateFilter} onChange={(event) => setStateFilter(event.target.value)} className="input bg-white" aria-label="Filter by US state">
            <option value="">All US states</option>
            {availableStates.map((state) => <option key={state} value={state}>{state}</option>)}
          </select>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-500">
            <Loader2 size={16} className="animate-spin" />
            Loading public warnings
          </div>
        ) : visible.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-500">
            No public warnings match these filters. Single reports remain private until corroborated.
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {visible.map((identity) => (
              <article key={identity.identityHash} className="rounded-xl border border-amber-200 bg-amber-50/40 p-5">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-amber-700">
                      {identity.country}{identity.states?.length ? ` (${identity.states.join(', ')})` : ''} / {RAILS.find((r) => r.value === identity.rail)?.label || identity.rail}
                    </p>
                    <h3 className="font-display font-bold text-base text-slate-950 mt-1">
                      {identity.identityMask}
                    </h3>
                  </div>
                  <AlertTriangle size={18} className="text-amber-600 shrink-0" />
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs mb-4">
                  <div className="rounded-lg bg-white border border-amber-100 p-2">
                    <span className="block font-bold text-slate-950">{identity.reportCount}</span>
                    <span className="text-slate-500">reports</span>
                  </div>
                  <div className="rounded-lg bg-white border border-amber-100 p-2">
                    <span className="block font-bold text-slate-950">{identity.independentReporters}</span>
                    <span className="text-slate-500">people</span>
                  </div>
                  <div className="rounded-lg bg-white border border-amber-100 p-2">
                    <span className="block font-bold text-slate-950">{identity.paymentProofCount}</span>
                    <span className="text-slate-500">proofs</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {identity.categories.map((category) => (
                    <span key={category} className="rounded-full bg-white border border-amber-100 px-2 py-1 text-xs font-semibold text-amber-700">
                      {formatCategory(category)}
                    </span>
                  ))}
                  {[...identity.paymentMethodDetails, ...identity.categoryDetails].map((detail) => (
                    <span key={detail} className="rounded-full bg-white border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-600">
                      {detail}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function ResultPanel({ result }: { result: { matched: boolean; identity: IdentityView | null } | null }) {
  if (!result) {
    return (
      <aside className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center mb-4">
          <Search size={20} className="text-slate-500" />
        </div>
        <h3 className="font-display font-bold text-lg text-slate-950 mb-2">No search yet</h3>
        <p className="text-sm text-slate-500">Results appear here after a recipient check.</p>
      </aside>
    );
  }

  if (!result.matched || !result.identity) {
    return (
      <aside className="bg-white border border-emerald-200 rounded-2xl p-6 shadow-sm">
        <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center mb-4">
          <CheckCircle2 size={21} className="text-emerald-600" />
        </div>
        <h3 className="font-display font-bold text-lg text-slate-950 mb-2">No matching reports found</h3>
        <p className="text-sm text-slate-500">This is not a guarantee. Verify identity, delivery terms, and payment protections before sending funds.</p>
      </aside>
    );
  }

  const identity = result.identity;
  return (
    <aside className="bg-white border border-amber-200 rounded-2xl p-6 shadow-sm">
      <div className="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center mb-4">
        <AlertTriangle size={21} className="text-amber-600" />
      </div>
      <h3 className="font-display font-bold text-lg text-slate-950 mb-2">Matching reports found</h3>
      <p className="text-sm text-slate-500 mb-5">{identity.identityMask}</p>

      <div className="space-y-3 text-sm">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <span className="text-slate-500">Reports</span>
          <span className="font-bold text-slate-900">{identity.reportCount}</span>
        </div>
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <span className="text-slate-500">Independent reporters</span>
          <span className="font-bold text-slate-900">{identity.independentReporters}</span>
        </div>
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <span className="text-slate-500">Payment proof reports</span>
          <span className="font-bold text-slate-900">{identity.paymentProofCount}</span>
        </div>
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <span className="text-slate-500">Reported amount</span>
          <span className="font-bold text-slate-900">{formatAmount(identity.totalReportedAmount, identity.currency)}</span>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {identity.categories.map((c) => (
          <span key={c} className="rounded-full bg-amber-50 border border-amber-200 px-2.5 py-1 text-xs font-semibold text-amber-700">
            {formatCategory(c)}
          </span>
        ))}
        {[...identity.paymentMethodDetails, ...identity.categoryDetails].map((detail) => (
          <span key={detail} className="rounded-full bg-slate-50 border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700">
            {detail}
          </span>
        ))}
      </div>
    </aside>
  );
}
