'use client';

import { FormEvent, useState } from 'react';
import { useLocale } from 'next-intl';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import {
  AlertTriangle,
  CheckCircle2,
  Database,
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

interface IdentityView {
  identityHash: string;
  country: string;
  rail: PaymentRail;
  identityMask: string;
  categories: ScamCategory[];
  paymentMethodDetails: string[];
  categoryDetails: string[];
  aliases: string[];
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

const RAILS: { value: PaymentRail; label: string }[] = [
  { value: 'zelle', label: 'Zelle' },
  { value: 'cashapp', label: 'Cash App' },
  { value: 'venmo', label: 'Venmo' },
  { value: 'paypal', label: 'PayPal' },
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

const DEFAULT_COUNTRIES = ['US', 'GB', 'CA', 'EU', 'UA', 'RU', 'OTHER'];

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

  const [mode, setMode] = useState<'check' | 'report'>('check');

  const [checkCountry, setCheckCountry] = useState('US');
  const [checkRail, setCheckRail] = useState<PaymentRail>('zelle');
  const [checkIdentifier, setCheckIdentifier] = useState('');
  const [checkLoading, setCheckLoading] = useState(false);
  const [checkError, setCheckError] = useState('');
  const [checkResult, setCheckResult] = useState<{ matched: boolean; identity: IdentityView | null } | null>(null);

  const [reportStatus, setReportStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [reportError, setReportError] = useState('');
  const [reportId, setReportId] = useState('');
  const [reportRail, setReportRail] = useState<PaymentRail>('zelle');
  const [reportCategory, setReportCategory] = useState<ScamCategory>('non_delivery_goods');

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

    const data = new FormData(e.currentTarget);
    const evidenceTypes = [
      data.get('payment_receipt') ? 'payment_receipt' : '',
      data.get('chat_screenshot') ? 'chat_screenshot' : '',
      data.get('marketplace_listing') ? 'marketplace_listing' : '',
    ].filter(Boolean);

    try {
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
          description: data.get('description'),
          reporterEmail: data.get('reporterEmail'),
          evidenceTypes,
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || 'Report failed');
      setReportId(body.reportId);
      setReportStatus('success');
      e.currentTarget.reset();
      setReportRail('zelle');
      setReportCategory('non_delivery_goods');
    } catch (err: any) {
      setReportError(err.message || 'Report failed');
      setReportStatus('error');
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="pt-32 pb-20">
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
                  Search by Zelle, Cash App, Venmo, PayPal, bank account, IBAN, phone, email, or marketplace handle. Full identifiers are matched privately; public results show masked details only.
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
                      {DEFAULT_COUNTRIES.map((c) => <option key={c}>{c}</option>)}
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
                  <select name="country" defaultValue="US" className="input bg-white">
                    {DEFAULT_COUNTRIES.map((c) => <option key={c}>{c}</option>)}
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
                  <input name="reporterEmail" type="email" className="input" placeholder="you@example.com" />
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

              <div className="grid md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Amount</label>
                  <input name="amount" type="number" min="0" step="0.01" className="input" placeholder="150" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Currency</label>
                  <input name="currency" defaultValue="USD" className="input" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Incident date</label>
                  <input name="incidentDate" type="date" className="input" />
                </div>
              </div>

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
                <div className="mb-5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  Report received. ID: <span className="font-mono font-semibold">{reportId}</span>
                </div>
              )}
              {reportStatus === 'error' && (
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
      </main>

      <Footer />
    </div>
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
