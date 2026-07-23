'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { translatePaymentSafety } from '@/lib/payment-safety-i18n';
import {
  AlertTriangle,
  ArrowRight,
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

const REPORT_DRAFT_STORAGE_KEY = 'ledgerhound:payment-report-draft:v2';
const REPORT_STEP_COUNT = 6;

interface PaymentReportDraft {
  fields: Record<string, string | boolean>;
  step: number;
  updatedAt: string;
}

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
  const t = (text: string) => translatePaymentSafety(locale, text);
  const [countryOptions, setCountryOptions] = useState<{ code: string; label: string }[]>(() => [
    ...ISO_COUNTRY_CODES.map((code) => ({ code, label: code })),
    { code: 'EU', label: 'EU' },
    { code: 'OTHER', label: 'OTHER' },
  ]);

  useEffect(() => {
    const displayNames = new Intl.DisplayNames([locale, 'en'], { type: 'region' });
    const countries: { code: string; label: string }[] = ISO_COUNTRY_CODES
      .map((code) => ({ code, label: displayNames.of(code) || code }))
      .sort((a, b) => a.label.localeCompare(b.label, locale));
    setCountryOptions([
      ...countries,
      { code: 'EU', label: translatePaymentSafety(locale, 'European Union') },
      { code: 'OTHER', label: translatePaymentSafety(locale, 'Other territory') },
    ]);
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
  const [reportStep, setReportStep] = useState(0);
  const [draftFields, setDraftFields] = useState<Record<string, string | boolean>>({});
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [showDraftPrompt, setShowDraftPrompt] = useState(false);
  const [draftSavedAt, setDraftSavedAt] = useState('');
  const [draftTouched, setDraftTouched] = useState(false);
  const reportFormRef = useRef<HTMLFormElement>(null);

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
    try {
      const saved = localStorage.getItem(REPORT_DRAFT_STORAGE_KEY);
      if (saved) {
        const draft = JSON.parse(saved) as PaymentReportDraft;
        if (draft?.fields && typeof draft.fields === 'object') {
          setDraftFields(draft.fields);
          setReportStep(Math.min(Math.max(Number(draft.step) || 0, 0), REPORT_STEP_COUNT - 1));
          setReportCountry(String(draft.fields.country || 'US'));
          setReportRail((draft.fields.rail as PaymentRail) || 'zelle');
          setReportCategory((draft.fields.category as ScamCategory) || 'non_delivery_goods');
          setReportSaleChannel((draft.fields.saleChannel as SaleChannel) || 'facebook_marketplace');
          setReportCommunityLanguage((draft.fields.communityLanguage as CommunityLanguage) || 'english');
          setRefundRequested(draft.fields.refundRequested === true);
          setDraftSavedAt(draft.updatedAt || '');
          setDraftTouched(true);
          setShowDraftPrompt(true);
        }
      }
    } catch {
      localStorage.removeItem(REPORT_DRAFT_STORAGE_KEY);
    } finally {
      setDraftLoaded(true);
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('emailVerified') === '1') setVerificationNotice('verified');
    if (params.get('emailVerificationError') === '1') setVerificationNotice('error');
    if (params.get('mode') === 'report') setMode('report');
    if (localStorage.getItem(REPORT_DRAFT_STORAGE_KEY)) return;
    const category = params.get('category') as ScamCategory | null;
    if (category && CATEGORIES.some((item) => item.value === category)) setReportCategory(category);
    const channel = params.get('channel') as SaleChannel | null;
    if (channel && SALE_CHANNEL_OPTIONS.some((item) => item.value === channel)) setReportSaleChannel(channel);
    const language = params.get('language') as CommunityLanguage | null;
    if (language && COMMUNITY_LANGUAGE_OPTIONS.some((item) => item.value === language)) setReportCommunityLanguage(language);
  }, []);

  useEffect(() => {
    if (!draftLoaded || !draftTouched || showDraftPrompt || reportStatus === 'success') return;
    const fields = {
      ...draftFields,
      country: reportCountry,
      rail: reportRail,
      category: reportCategory,
      saleChannel: reportSaleChannel,
      communityLanguage: reportCommunityLanguage,
      refundRequested,
    };
    const updatedAt = new Date().toISOString();
    const draft: PaymentReportDraft = { fields, step: reportStep, updatedAt };
    localStorage.setItem(REPORT_DRAFT_STORAGE_KEY, JSON.stringify(draft));
    setDraftSavedAt(updatedAt);
  }, [
    draftFields,
    draftLoaded,
    draftTouched,
    refundRequested,
    reportCategory,
    reportCommunityLanguage,
    reportCountry,
    reportRail,
    reportSaleChannel,
    reportStatus,
    reportStep,
    showDraftPrompt,
  ]);

  function handleDraftFieldChange(event: FormEvent<HTMLFormElement>) {
    const target = event.target as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
    if (!target.name || target instanceof HTMLInputElement && target.type === 'file') return;
    const value = target instanceof HTMLInputElement && target.type === 'checkbox'
      ? target.checked
      : target.value;
    setDraftFields((current) => ({ ...current, [target.name]: value }));
    setDraftTouched(true);
  }

  function resetDraftToQueryDefaults() {
    const params = new URLSearchParams(window.location.search);
    const category = params.get('category') as ScamCategory | null;
    const channel = params.get('channel') as SaleChannel | null;
    const language = params.get('language') as CommunityLanguage | null;
    setDraftFields({});
    setReportStep(0);
    setReportCountry('US');
    setReportRail('zelle');
    setReportCategory(category && CATEGORIES.some((item) => item.value === category) ? category : 'non_delivery_goods');
    setReportSaleChannel(channel && SALE_CHANNEL_OPTIONS.some((item) => item.value === channel) ? channel : 'facebook_marketplace');
    setReportCommunityLanguage(language && COMMUNITY_LANGUAGE_OPTIONS.some((item) => item.value === language) ? language : 'english');
    setRefundRequested(false);
    setReportFiles([]);
    setDraftSavedAt('');
    setDraftTouched(false);
    setShowDraftPrompt(false);
    localStorage.removeItem(REPORT_DRAFT_STORAGE_KEY);
    reportFormRef.current?.reset();
  }

  function moveToReportStep(step: number) {
    setReportStep(Math.min(Math.max(step, 0), REPORT_STEP_COUNT - 1));
    setDraftTouched(true);
    setReportError('');
    requestAnimationFrame(() => reportFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  }

  function pauseReportDraft() {
    const fields = {
      ...draftFields,
      country: reportCountry,
      rail: reportRail,
      category: reportCategory,
      saleChannel: reportSaleChannel,
      communityLanguage: reportCommunityLanguage,
      refundRequested,
    };
    const updatedAt = new Date().toISOString();
    localStorage.setItem(REPORT_DRAFT_STORAGE_KEY, JSON.stringify({ fields, step: reportStep, updatedAt } satisfies PaymentReportDraft));
    setDraftSavedAt(updatedAt);
    setDraftTouched(true);
    setShowDraftPrompt(true);
  }

  function draftValue(name: string): string {
    const value = draftFields[name];
    return typeof value === 'string' ? value : '';
  }

  function draftChecked(name: string): boolean {
    return draftFields[name] === true;
  }

  const requiredChecklist = [
    { label: t('Country where it happened'), done: Boolean(reportCountry), step: 0 },
    { label: t('What was promised'), done: draftValue('itemOrService').trim().length >= 3, step: 0 },
    { label: t('Scam category'), done: Boolean(reportCategory), step: 0 },
    { label: t('Payment method'), done: Boolean(reportRail), step: 1 },
    { label: t('Recipient payment details'), done: draftValue('paymentIdentifier').trim().length >= 3, step: 1 },
    { label: t('Where you found the seller'), done: Boolean(reportSaleChannel), step: 2 },
    { label: t('Your story'), done: draftValue('description').trim().length >= 80, step: 3 },
    { label: t('Email for private verification'), done: /^\S+@\S+\.\S+$/.test(draftValue('reporterEmail').trim()), step: 4 },
    ...(reportRail === 'other'
      ? [{ label: t('Payment method details'), done: draftValue('paymentMethodDetails').trim().length >= 3, step: 1 }]
      : []),
    ...(reportCategory === 'other'
      ? [{ label: t('Category details'), done: draftValue('categoryDetails').trim().length >= 3, step: 0 }]
      : []),
    ...(reportSaleChannel === 'other'
      ? [{ label: t('Sale channel details'), done: draftValue('saleChannelDetails').trim().length >= 3, step: 2 }]
      : []),
  ];
  const requiredCompleted = requiredChecklist.filter((item) => item.done).length;
  const reportCompletion = Math.round((requiredCompleted / requiredChecklist.length) * 100);
  const optionalChecklist = [
    { label: t('Seller profile, group, or listing link'), done: Boolean(draftValue('sellerProfile') || draftValue('communityName') || draftValue('listingUrl')), step: 2 },
    { label: t('Incident or delivery dates'), done: Boolean(draftValue('incidentDate') || draftValue('promisedDeliveryDate')), step: 3 },
    { label: t('Transaction reference'), done: Boolean(draftValue('transactionReference')), step: 1 },
    { label: t('Evidence type selected'), done: draftChecked('payment_receipt') || draftChecked('chat_screenshot') || draftChecked('marketplace_listing'), step: 4 },
  ];
  const reportSteps = [
    t('What happened'),
    t('The payment'),
    t('The seller'),
    t('Tell your story'),
    t('Evidence and contact'),
    t('Review and send'),
  ];
  const paymentRecipientHint: Partial<Record<PaymentRail, string>> = {
    zelle: 'Zelle email or phone number',
    cashapp: 'Cash App $cashtag, phone, or email',
    venmo: 'Venmo username, phone, or email',
    paypal: 'PayPal email or username',
    apple_cash: 'Apple Cash phone number or email',
    chime: 'Chime $ChimeSign, phone, or email',
    wise: 'Wise email, phone, or recipient account',
    revolut: 'Revolut phone, email, or Revtag',
    iban: 'IBAN or beneficiary account',
    bank_account: 'Account number or beneficiary details',
    phone: 'Recipient phone number',
    email: 'Recipient email',
    social_handle: 'Recipient social handle',
    marketplace_profile: 'Recipient marketplace profile',
  };

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
    const data = new FormData(e.currentTarget);
    const missingRequired = requiredChecklist.filter((item) => !item.done);
    if (missingRequired.length > 0) {
      setReportStep(REPORT_STEP_COUNT - 1);
      setReportError(t('Complete the highlighted answers before submitting. Your draft is saved.'));
      return;
    }
    setReportStatus('loading');
    setReportError('');
    setReportId('');
    setUploadStatus(reportFiles.length > 0 ? `Uploading ${reportFiles.length} evidence file(s)...` : '');

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
      setDraftFields({});
      setReportStep(0);
      setDraftTouched(false);
      setDraftSavedAt('');
      localStorage.removeItem(REPORT_DRAFT_STORAGE_KEY);
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
                ? t('Email verified. Your report can now be reviewed by the moderation team.')
                : t('This verification link is invalid, expired, or already used.')}
            </div>
          </div>
        )}
        <section className="border-b border-slate-200 bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
            <div className="grid lg:grid-cols-[1fr_26rem] gap-10 items-start">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-bold text-brand-700 mb-5">
                  <Database size={13} />
                  {t('Payment recipient safety')}
                </div>
                <h1 className="font-display font-bold text-4xl lg:text-5xl text-slate-950 leading-tight mb-4">
                  {t('Check a payment recipient before sending money.')}
                </h1>
                <p className="text-lg text-slate-600 max-w-2xl">
                  {t('Search by Zelle, Cash App, Venmo, PayPal, Apple Cash, Chime, bank account, phone, email, or marketplace handle. Full identifiers are matched privately; public results show masked details only.')}
                </p>
              </div>

              <div className="bg-slate-950 text-white rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Lock size={18} className="text-emerald-400" />
                  <h2 className="font-display font-bold text-lg">{t('Privacy defaults')}</h2>
                </div>
                <div className="space-y-3 text-sm text-slate-300">
                  <p>{t('One report stays private.')}</p>
                  <p>{t('Three independent reports can create a public warning.')}</p>
                  <p>{t('Five reports, or three with payment proof, can become index-eligible.')}</p>
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
              {t('Check recipient')}
            </button>
            <button
              type="button"
              onClick={() => setMode('report')}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                mode === 'report' ? 'bg-brand-600 text-white' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <FileText size={15} />
              {t('Report recipient')}
            </button>
          </div>

          {mode === 'check' ? (
            <div className="grid lg:grid-cols-[1fr_24rem] gap-8 items-start">
              <form onSubmit={handleCheck} className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
                <h2 className="font-display font-bold text-2xl text-slate-950 mb-6">{t('Recipient check')}</h2>
                <div className="grid sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">{t('Country')}</label>
                    <select value={checkCountry} onChange={(e) => setCheckCountry(e.target.value)} className="input bg-white">
                      {countryOptions.map(({ code, label }) => (
                        <option key={code} value={code}>{label} ({code})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">{t('Payment method')}</label>
                    <select value={checkRail} onChange={(e) => setCheckRail(e.target.value as PaymentRail)} className="input bg-white">
                      {RAILS.map((r) => <option key={r.value} value={r.value}>{t(r.label)}</option>)}
                    </select>
                  </div>
                </div>
                <div className="mb-5">
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">{t('Recipient identifier')}</label>
                  <input
                    value={checkIdentifier}
                    onChange={(e) => setCheckIdentifier(e.target.value)}
                    required
                    className="input"
                    placeholder={t('Phone, email, $cashtag, @handle, IBAN, account')}
                  />
                </div>
                {checkError && (
                  <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {checkError}
                  </div>
                )}
                <button type="submit" disabled={checkLoading} className="btn-primary w-full justify-center py-3 disabled:opacity-60">
                  {checkLoading ? <Loader2 size={17} className="animate-spin" /> : <Search size={17} />}
                  {t('Check recipient')}
                </button>
              </form>

              <ResultPanel result={checkResult} />
            </div>
          ) : !draftLoaded ? (
            <div className="rounded-xl border border-slate-200 bg-white px-5 py-8 text-center text-sm text-slate-500">
              <Loader2 size={18} className="mx-auto mb-3 animate-spin" />
              {t('Loading your private draft')}
            </div>
          ) : showDraftPrompt ? (
            <div className="mx-auto max-w-2xl border border-brand-200 bg-white p-6 sm:p-8 shadow-sm rounded-lg">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-brand-50 text-brand-700 mb-5">
                <FileText size={21} />
              </div>
              <h2 className="font-display text-2xl font-bold text-slate-950">{t('You have an unfinished private report')}</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                {t('Continue where you stopped, or start a new report. The draft is stored only in this browser.')}
              </p>
              <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full bg-brand-600" style={{ width: `${reportCompletion}%` }} />
              </div>
              <div className="mt-2 flex items-center justify-between text-xs font-semibold text-slate-500">
                <span>{reportCompletion}% {t('complete')}</span>
                {draftSavedAt && <span>{t('Saved')} {new Date(draftSavedAt).toLocaleString(locale)}</span>}
              </div>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <button type="button" onClick={() => setShowDraftPrompt(false)} className="btn-primary justify-center">
                  {t('Continue draft')} <ArrowRight size={16} />
                </button>
                <button type="button" onClick={resetDraftToQueryDefaults} className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:border-brand-300 hover:text-brand-700">
                  {t('Start a new report')}
                </button>
              </div>
            </div>
          ) : (
            <form
              ref={reportFormRef}
              onSubmit={handleReport}
              onChange={handleDraftFieldChange}
              className="bg-white border border-slate-200 p-5 sm:p-8 shadow-sm rounded-lg scroll-mt-24"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase text-brand-700">{t('Private report')}</p>
                  <h2 className="font-display font-bold text-2xl text-slate-950 mt-1">{reportSteps[reportStep]}</h2>
                  <p className="text-sm text-slate-500 mt-1">{t('Answer what you know. You can skip optional questions and return later.')}</p>
                </div>
                <ShieldCheck size={26} className="text-brand-600 shrink-0" />
              </div>

              <div className="mt-6 border-y border-slate-200 py-4">
                <div className="flex items-center justify-between gap-3 text-xs font-semibold text-slate-500">
                  <span>{t('Step')} {reportStep + 1} {t('of')} {REPORT_STEP_COUNT}</span>
                  <span>{reportCompletion}% {t('complete')}</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full bg-brand-600 transition-all" style={{ width: `${Math.max(((reportStep + 1) / REPORT_STEP_COUNT) * 100, reportCompletion)}%` }} />
                </div>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <span className="text-xs text-emerald-700">
                    {draftSavedAt ? `${t('Saved on this device')} · ${new Date(draftSavedAt).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}` : t('Autosave is on')}
                  </span>
                  <button type="button" onClick={() => moveToReportStep(REPORT_STEP_COUNT - 1)} className="text-xs font-bold text-brand-700 hover:underline">
                    {t('See what is missing')}
                  </button>
                </div>
              </div>

              <div className={reportStep === 0 || reportStep === 1 ? 'grid md:grid-cols-2 gap-4 mt-6 mb-4' : 'hidden'}>
                <div className={reportStep === 0 ? '' : 'hidden'}>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">{t('Country')}</label>
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
                <div className={reportStep === 1 ? '' : 'hidden'}>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">{t('Payment method')}</label>
                  <select
                    name="rail"
                    value={reportRail}
                    onChange={(e) => setReportRail(e.target.value as PaymentRail)}
                    className="input bg-white"
                  >
                    {RAILS.map((r) => <option key={r.value} value={r.value}>{t(r.label)}</option>)}
                  </select>
                </div>
                <div className={reportStep === 0 ? '' : 'hidden'}>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">{t('Category')}</label>
                  <input type="hidden" name="category" value={reportCategory} readOnly />
                  <div className="grid grid-cols-2 gap-2">
                    {CATEGORIES.map((category) => {
                      const selected = reportCategory === category.value;
                      return (
                        <button
                          key={category.value}
                          type="button"
                          onClick={() => {
                            setReportCategory(category.value);
                            setDraftTouched(true);
                          }}
                          className={`flex min-h-[52px] items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm font-semibold transition-colors ${
                            selected
                              ? 'border-brand-500 bg-brand-50 text-brand-800'
                              : 'border-slate-200 bg-white text-slate-700 hover:border-brand-300'
                          }`}
                        >
                          <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${selected ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-300'}`}>
                            {selected && <CheckCircle2 size={13} />}
                          </span>
                          {t(category.label)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {(reportRail === 'other' || reportCategory === 'other') && (
                <div className={reportStep === 0 || reportStep === 1 ? 'grid md:grid-cols-2 gap-4 mb-4' : 'hidden'}>
                  {reportRail === 'other' && (
                    <div className={reportStep === 1 ? '' : 'hidden'}>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">{t('Payment method details')}</label>
                      <input
                        name="paymentMethodDetails"
                        minLength={3}
                        defaultValue={draftValue('paymentMethodDetails')}
                        className="input"
                        placeholder={t('SEPA transfer, local wallet, courier deposit')}
                      />
                    </div>
                  )}
                  {reportCategory === 'other' && (
                    <div className={reportStep === 0 ? '' : 'hidden'}>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">{t('Category details')}</label>
                      <input
                        name="categoryDetails"
                        minLength={3}
                        defaultValue={draftValue('categoryDetails')}
                        className="input"
                        placeholder={t('Cake order, repair service, pet deposit')}
                      />
                    </div>
                  )}
                </div>
              )}

              <div className={reportStep === 1 || reportStep === 4 ? 'grid md:grid-cols-2 gap-4 mb-4' : 'hidden'}>
                <div className={reportStep === 1 ? '' : 'hidden'}>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">{t('Who did you send the money to?')}</label>
                  <input
                    name="paymentIdentifier"
                    minLength={3}
                    defaultValue={draftValue('paymentIdentifier')}
                    className="input"
                    placeholder={t(paymentRecipientHint[reportRail] || 'Phone, email, $cashtag, account')}
                  />
                </div>
                <div className={reportStep === 4 ? '' : 'hidden'}>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">{t('Your email')}</label>
                  <input name="reporterEmail" type="email" defaultValue={draftValue('reporterEmail')} className="input" placeholder="you@example.com" />
                </div>
              </div>

              <div className={reportStep === 2 ? 'grid md:grid-cols-3 gap-4 mt-6 mb-4' : 'hidden'}>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">{t('Recipient name')}</label>
                  <input name="recipientName" defaultValue={draftValue('recipientName')} className="input" placeholder={t('Name shown on payment')} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">{t('Business name')}</label>
                  <input name="businessName" defaultValue={draftValue('businessName')} className="input" placeholder={t('Shop, profile, company')} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">{t('Aliases')}</label>
                  <input name="aliases" defaultValue={draftValue('aliases')} className="input" placeholder={t('Comma-separated names')} />
                </div>
              </div>

              <div className={reportStep === 0 || reportStep === 2 ? 'border-t border-slate-200 pt-5 mt-5 mb-4' : 'hidden'}>
                <h3 className="font-display font-bold text-base text-slate-950 mb-4">
                  {reportStep === 0 ? t('What did you pay for?') : t('How did you meet the seller?')}
                </h3>
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div className={reportStep === 0 ? '' : 'hidden'}>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">{t('Item or service')}</label>
                    <input name="itemOrService" minLength={3} maxLength={120} defaultValue={draftValue('itemOrService')} className="input" placeholder={t('Concert ticket, cake order, repair')} />
                  </div>
                  <div className={reportStep === 2 ? '' : 'hidden'}>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">{t('Where you found the seller')}</label>
                    <select
                      name="saleChannel"
                      value={reportSaleChannel}
                      onChange={(e) => setReportSaleChannel(e.target.value as SaleChannel)}
                      className="input bg-white"
                    >
                      {SALE_CHANNEL_OPTIONS.map((channel) => (
                        <option key={channel.value} value={channel.value}>{t(channel.label)}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {reportSaleChannel === 'other' && (
                  <div className={reportStep === 2 ? 'mb-4' : 'hidden'}>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">{t('Sale channel details')}</label>
                    <input name="saleChannelDetails" minLength={3} maxLength={120} defaultValue={draftValue('saleChannelDetails')} className="input" placeholder={t('Local group, community board, messaging app')} />
                  </div>
                )}

                <div className={reportStep === 2 ? 'grid md:grid-cols-3 gap-4 mb-4' : 'hidden'}>
                  {reportCountry === 'US' ? (
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">{t('US state')}</label>
                      <select name="usState" defaultValue={draftValue('usState')} className="input bg-white">
                        <option value="">{t('Not specified')}</option>
                        {US_STATE_CODES.map((state) => <option key={state} value={state}>{state}</option>)}
                      </select>
                    </div>
                  ) : null}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">{t('Community language')}</label>
                    <select
                      name="communityLanguage"
                      value={reportCommunityLanguage}
                      onChange={(event) => setReportCommunityLanguage(event.target.value as CommunityLanguage)}
                      className="input bg-white"
                    >
                      {COMMUNITY_LANGUAGE_OPTIONS.map((language) => (
                        <option key={language.value} value={language.value}>{t(language.label)}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">{t('Group or channel name')}</label>
                    <input name="communityName" maxLength={160} defaultValue={draftValue('communityName')} className="input" placeholder={t('Kept private for moderation')} />
                  </div>
                </div>

                <div className={reportStep === 2 ? 'grid md:grid-cols-2 gap-4' : 'hidden'}>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">{t('Seller profile or handle')}</label>
                    <input name="sellerProfile" maxLength={200} defaultValue={draftValue('sellerProfile')} className="input" placeholder={t('@seller or profile name')} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">{t('Listing URL')}</label>
                    <input name="listingUrl" type="url" maxLength={500} defaultValue={draftValue('listingUrl')} className="input" placeholder="https://..." />
                  </div>
                </div>
              </div>

              <div className={reportStep === 1 ? 'grid md:grid-cols-4 gap-4 mt-5 mb-4' : 'hidden'}>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">{t('Amount')}</label>
                  <input name="amount" type="number" min="0.01" step="0.01" defaultValue={draftValue('amount')} className="input" placeholder="35" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">{t('Currency')}</label>
                  <input name="currency" defaultValue={draftValue('currency') || 'USD'} className="input" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">{t('Incident date')}</label>
                  <input name="incidentDate" type="date" defaultValue={draftValue('incidentDate')} className="input" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">{t('Transaction reference')}</label>
                  <input name="transactionReference" maxLength={160} defaultValue={draftValue('transactionReference')} className="input" placeholder={t('From payment receipt')} />
                </div>
              </div>

              <div className={reportStep === 3 ? 'grid md:grid-cols-3 gap-4 mt-5 mb-4' : 'hidden'}>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">{t('Promised delivery date')}</label>
                  <input name="promisedDeliveryDate" type="date" defaultValue={draftValue('promisedDeliveryDate')} className="input" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">{t('Last seller response')}</label>
                  <input name="lastContactDate" type="date" defaultValue={draftValue('lastContactDate')} className="input" />
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
                    {t('Refund requested')}
                  </label>
                </div>
              </div>

              {refundRequested && (
                <div className={reportStep === 3 ? 'mb-4 max-w-sm' : 'hidden'}>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">{t('Refund request date')}</label>
                  <input name="refundRequestDate" type="date" defaultValue={draftValue('refundRequestDate')} className="input" />
                </div>
              )}

              <div className={reportStep === 4 ? 'mt-6 mb-4' : 'hidden'}>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">{t('Evidence available')}</label>
                <div className="grid sm:grid-cols-3 gap-2">
                  {[
                    ['payment_receipt', t('Payment receipt')],
                    ['chat_screenshot', t('Chat screenshot')],
                    ['marketplace_listing', t('Listing/profile')],
                  ].map(([name, label]) => (
                    <label key={name} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                      <input type="checkbox" name={name} defaultChecked={draftChecked(name)} className="accent-brand-600" />
                      {label}
                    </label>
                  ))}
                </div>
              </div>

              <div className={reportStep === 4 ? 'mb-5' : 'hidden'}>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">{t('Upload evidence')}</label>
                <input
                  type="file"
                  multiple
                  accept="image/png,image/jpeg,image/webp,application/pdf"
                  onChange={(e) => setReportFiles(Array.from(e.target.files || []).slice(0, 5))}
                  className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-slate-800"
                />
                <p className="mt-1 text-xs text-slate-500">{t('Optional. Up to 5 files, 10MB each. PDF, PNG, JPG, or WebP.')}</p>
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

              <details className={reportStep === 4 ? 'border-t border-slate-200 pt-5 mt-5 mb-5' : 'hidden'}>
                <summary className="cursor-pointer text-sm font-bold text-slate-700">
                  {t('Did you report it anywhere else?')} <span className="font-normal text-slate-500">({t('optional')})</span>
                </summary>
                <p className="text-xs text-slate-500 mt-2 mb-3">
                  {t('It is okay if you did not. Small scam reports often receive no response, and this does not block your report here.')}
                </p>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2 mb-4">
                  {REPORT_DESTINATION_OPTIONS.map(({ value, label }) => (
                    <label key={value} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                      <input type="checkbox" name={`reportedTo_${value}`} defaultChecked={draftChecked(`reportedTo_${value}`)} className="accent-brand-600" />
                      {t(label)}
                    </label>
                  ))}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">{t('External report number')}</label>
                  <input name="externalReportReference" maxLength={160} defaultValue={draftValue('externalReportReference')} className="input" placeholder={t('FTC, marketplace, bank, or provider case number')} />
                </div>
              </details>

              <div className={reportStep === 3 ? 'mt-6 mb-5' : 'hidden'}>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">{t('What happened?')}</label>
                <textarea
                  name="description"
                  minLength={80}
                  rows={6}
                  defaultValue={draftValue('description')}
                  className="input resize-none"
                  placeholder={t('Include the product or service, promised delivery date, payment method, and what happened after payment.')}
                />
                <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                  <span>{t('Write in your own words. You can edit it later.')}</span>
                  <span>{draftValue('description').trim().length}/80</span>
                </div>
              </div>

              {reportStep === REPORT_STEP_COUNT - 1 && (
                <div className="mt-6 space-y-6">
                  <section>
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <h3 className="font-display text-lg font-bold text-slate-950">{t('Required before sending')}</h3>
                      <span className={`text-xs font-bold ${requiredCompleted === requiredChecklist.length ? 'text-emerald-700' : 'text-amber-700'}`}>
                        {requiredCompleted}/{requiredChecklist.length}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {requiredChecklist.map((item) => (
                        <button
                          key={item.label}
                          type="button"
                          onClick={() => moveToReportStep(item.step)}
                          className={`flex w-full items-center justify-between gap-3 rounded-lg border px-3 py-3 text-left text-sm ${
                            item.done
                              ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                              : 'border-amber-200 bg-amber-50 text-amber-900'
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            {item.done ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                            {item.label}
                          </span>
                          <ArrowRight size={15} />
                        </button>
                      ))}
                    </div>
                  </section>

                  <section>
                    <h3 className="font-display text-lg font-bold text-slate-950 mb-1">{t('Helpful, but you can add it later')}</h3>
                    <p className="text-xs text-slate-500 mb-3">{t('These details can make matching and moderation stronger. They are not required to save your draft.')}</p>
                    <div className="grid sm:grid-cols-2 gap-2">
                      {optionalChecklist.map((item) => (
                        <button
                          key={item.label}
                          type="button"
                          onClick={() => moveToReportStep(item.step)}
                          className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-left text-sm text-slate-700"
                        >
                          <span className="flex items-center gap-2">
                            {item.done ? <CheckCircle2 size={16} className="text-emerald-600" /> : <span className="h-4 w-4 rounded-full border border-slate-300" />}
                            {item.label}
                          </span>
                          <ArrowRight size={15} />
                        </button>
                      ))}
                    </div>
                    <p className="mt-3 text-xs text-slate-500">
                      {t('Uploaded files cannot be kept in a browser draft. If you return later, choose those files again before sending.')}
                    </p>
                  </section>
                </div>
              )}

              {reportStatus === 'success' && (
                <div className="mb-5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-800">
                  <p className="font-semibold">{t('Report received. ID:')} <span className="font-mono">{reportId}</span></p>
                  <p className="mt-1">
                    {verificationEmailSent
                      ? `${t('Verification email sent to')} ${submittedEmail}.`
                      : t('The verification email could not be sent.')}
                  </p>
                  <button type="button" onClick={resendVerification} className="mt-2 font-semibold underline underline-offset-2">
                    {t('Resend verification email')}
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

              <div className="mt-7 flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex gap-2">
                  {reportStep > 0 && (
                    <button type="button" onClick={() => moveToReportStep(reportStep - 1)} className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:border-brand-300 hover:text-brand-700">
                      {t('Back')}
                    </button>
                  )}
                  <button type="button" onClick={pauseReportDraft} className="inline-flex items-center justify-center rounded-lg px-3 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-50 hover:text-slate-800">
                    {t('Finish later')}
                  </button>
                </div>

                {reportStep < REPORT_STEP_COUNT - 1 ? (
                  <button type="button" onClick={() => moveToReportStep(reportStep + 1)} className="btn-primary justify-center">
                    {t('Continue')} <ArrowRight size={16} />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={reportStatus === 'loading' || requiredCompleted !== requiredChecklist.length}
                    className="btn-primary justify-center py-3 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {reportStatus === 'loading' ? <Loader2 size={17} className="animate-spin" /> : <FileText size={17} />}
                    {requiredCompleted === requiredChecklist.length
                      ? t('Submit private report')
                      : `${t('Complete required answers')} (${requiredChecklist.length - requiredCompleted})`}
                  </button>
                )}
              </div>
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
  const locale = useLocale();
  const t = (text: string) => translatePaymentSafety(locale, text);
  if (!stats) return null;
  const items = [
    [t('Private reports'), stats.totalReports],
    [t('Payment recipients'), stats.totalIdentities],
    [t('Public warnings'), stats.publicEligibleIdentities],
    [t('Accepted payment proofs'), stats.paymentProofReports],
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
  const locale = useLocale();
  const t = (text: string) => translatePaymentSafety(locale, text);
  const provider = PROVIDER_RECOVERY[rail];
  return (
    <div className="border-t border-emerald-200 mt-3 pt-3">
      <p className="font-semibold mb-2">{t('Act now')}</p>
      <ol className="list-decimal pl-5 space-y-1.5 text-emerald-900">
        {provider && <li>{provider.instruction}</li>}
        <li>{t('Contact the bank or card issuer that funded the payment and ask what dispute options apply.')}</li>
        <li>{t('Report the seller profile to the marketplace or social platform.')}</li>
        <li>{t('Report the incident to the cybercrime or consumer protection authority in your country.')}</li>
      </ol>
      <div className="flex flex-wrap gap-3 mt-3">
        {provider && (
          <a href={provider.href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-semibold underline underline-offset-2">
            {provider.linkLabel} <ExternalLink size={13} />
          </a>
        )}
        <a href="https://reportfraud.ftc.gov/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-semibold underline underline-offset-2">
          {t('Report to the FTC')} <ExternalLink size={13} />
        </a>
      </div>
      <p className="text-xs text-emerald-700 mt-3">{t('Recovery is not guaranteed. Never pay anyone who promises a refund for an upfront fee.')}</p>
    </div>
  );
}

function PublicWarningsSection({ warnings, loading, base }: { warnings: IdentityView[]; loading: boolean; base: string }) {
  const locale = useLocale();
  const t = (text: string) => translatePaymentSafety(locale, text);
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
            <h2 className="font-display font-bold text-2xl text-slate-950">{t('Public payment warnings')}</h2>
            <p className="text-sm text-slate-500 mt-1">
              {t('Only recipients with corroborated independent reports appear here.')}
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
            <ShieldCheck size={13} />
            {t('Masked identifiers')}
          </div>
        </div>
        <div className="mb-5">
          <Link href={`${base}/payment-safety/correction`} className="text-sm font-semibold text-brand-600 hover:text-brand-700">
            {t('Request a correction or appeal a warning')}
          </Link>
        </div>

        <div className="grid sm:grid-cols-3 gap-3 mb-6" aria-label={t('Warning filters')}>
          <select value={railFilter} onChange={(event) => setRailFilter(event.target.value)} className="input bg-white" aria-label={t('Filter by payment method')}>
            <option value="">{t('All payment methods')}</option>
            {RAILS.map((rail) => <option key={rail.value} value={rail.value}>{t(rail.label)}</option>)}
          </select>
          <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} className="input bg-white" aria-label={t('Filter by category')}>
            <option value="">{t('All categories')}</option>
            {CATEGORIES.map((category) => <option key={category.value} value={category.value}>{t(category.label)}</option>)}
          </select>
          <select value={stateFilter} onChange={(event) => setStateFilter(event.target.value)} className="input bg-white" aria-label={t('Filter by US state')}>
            <option value="">{t('All US states')}</option>
            {availableStates.map((state) => <option key={state} value={state}>{state}</option>)}
          </select>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-500">
            <Loader2 size={16} className="animate-spin" />
            {t('Loading public warnings')}
          </div>
        ) : visible.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-500">
            {t('No public warnings match these filters. Single reports remain private until corroborated.')}
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
                    <span className="text-slate-500">{t('reports')}</span>
                  </div>
                  <div className="rounded-lg bg-white border border-amber-100 p-2">
                    <span className="block font-bold text-slate-950">{identity.independentReporters}</span>
                    <span className="text-slate-500">{t('people')}</span>
                  </div>
                  <div className="rounded-lg bg-white border border-amber-100 p-2">
                    <span className="block font-bold text-slate-950">{identity.paymentProofCount}</span>
                    <span className="text-slate-500">{t('proofs')}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {identity.categories.map((category) => (
                    <span key={category} className="rounded-full bg-white border border-amber-100 px-2 py-1 text-xs font-semibold text-amber-700">
                      {t(formatCategory(category))}
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
  const locale = useLocale();
  const t = (text: string) => translatePaymentSafety(locale, text);
  if (!result) {
    return (
      <aside className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center mb-4">
          <Search size={20} className="text-slate-500" />
        </div>
        <h3 className="font-display font-bold text-lg text-slate-950 mb-2">{t('No search yet')}</h3>
        <p className="text-sm text-slate-500">{t('Results appear here after a recipient check.')}</p>
      </aside>
    );
  }

  if (!result.matched || !result.identity) {
    return (
      <aside className="bg-white border border-emerald-200 rounded-2xl p-6 shadow-sm">
        <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center mb-4">
          <CheckCircle2 size={21} className="text-emerald-600" />
        </div>
        <h3 className="font-display font-bold text-lg text-slate-950 mb-2">{t('No matching reports found')}</h3>
        <p className="text-sm text-slate-500">{t('This is not a guarantee. Verify identity, delivery terms, and payment protections before sending funds.')}</p>
      </aside>
    );
  }

  const identity = result.identity;
  return (
    <aside className="bg-white border border-amber-200 rounded-2xl p-6 shadow-sm">
      <div className="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center mb-4">
        <AlertTriangle size={21} className="text-amber-600" />
      </div>
      <h3 className="font-display font-bold text-lg text-slate-950 mb-2">{t('Matching reports found')}</h3>
      <p className="text-sm text-slate-500 mb-5">{identity.identityMask}</p>

      <div className="space-y-3 text-sm">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <span className="text-slate-500">{t('Reports')}</span>
          <span className="font-bold text-slate-900">{identity.reportCount}</span>
        </div>
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <span className="text-slate-500">{t('Independent reporters')}</span>
          <span className="font-bold text-slate-900">{identity.independentReporters}</span>
        </div>
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <span className="text-slate-500">{t('Payment proof reports')}</span>
          <span className="font-bold text-slate-900">{identity.paymentProofCount}</span>
        </div>
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <span className="text-slate-500">{t('Reported amount')}</span>
          <span className="font-bold text-slate-900">{formatAmount(identity.totalReportedAmount, identity.currency)}</span>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {identity.categories.map((c) => (
          <span key={c} className="rounded-full bg-amber-50 border border-amber-200 px-2.5 py-1 text-xs font-semibold text-amber-700">
            {t(formatCategory(c))}
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
