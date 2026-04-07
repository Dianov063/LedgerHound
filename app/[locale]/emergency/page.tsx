'use client';

import { useState, useEffect, useCallback } from 'react';
import { useLocale } from 'next-intl';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import {
  ArrowRight,
  ArrowLeft,
  Shield,
  Zap,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Users,
  FileText,
  Search,
  Loader2,
} from 'lucide-react';

/* ───────── constants ───────── */

const AGENCIES: Record<string, string> = {
  US: 'FBI IC3',
  UK: 'Action Fraud',
  DE: 'Polizei Online',
  FR: 'PHAROS',
  CA: 'CAFC',
  AU: 'ReportCyber',
  NL: 'Politie',
  ES: 'Policía Nacional',
  IT: 'Polizia Postale',
  CH: 'MELANI',
  RU: 'МВД (ОВД)',
  UA: 'Кіберполіція',
  KZ: 'МВД РК',
  AE: 'Dubai Police eCrime',
  SG: 'SPF',
};

const COUNTRIES = [
  { code: 'US', name: 'United States', flag: '\u{1F1FA}\u{1F1F8}' },
  { code: 'UK', name: 'United Kingdom', flag: '\u{1F1EC}\u{1F1E7}' },
  { code: 'DE', name: 'Germany', flag: '\u{1F1E9}\u{1F1EA}' },
  { code: 'FR', name: 'France', flag: '\u{1F1EB}\u{1F1F7}' },
  { code: 'CA', name: 'Canada', flag: '\u{1F1E8}\u{1F1E6}' },
  { code: 'AU', name: 'Australia', flag: '\u{1F1E6}\u{1F1FA}' },
  { code: 'NL', name: 'Netherlands', flag: '\u{1F1F3}\u{1F1F1}' },
  { code: 'ES', name: 'Spain', flag: '\u{1F1EA}\u{1F1F8}' },
  { code: 'IT', name: 'Italy', flag: '\u{1F1EE}\u{1F1F9}' },
  { code: 'CH', name: 'Switzerland', flag: '\u{1F1E8}\u{1F1ED}' },
  { code: 'RU', name: 'Russia', flag: '\u{1F1F7}\u{1F1FA}' },
  { code: 'UA', name: 'Ukraine', flag: '\u{1F1FA}\u{1F1E6}' },
  { code: 'KZ', name: 'Kazakhstan', flag: '\u{1F1F0}\u{1F1FF}' },
  { code: 'AE', name: 'UAE', flag: '\u{1F1E6}\u{1F1EA}' },
  { code: 'SG', name: 'Singapore', flag: '\u{1F1F8}\u{1F1EC}' },
];

const BRACKETS = [
  { label: '<$10K', min: 0, max: 10000, mid: 5000 },
  { label: '$10K\u2013$50K', min: 10000, max: 50000, mid: 30000 },
  { label: '$50K\u2013$100K', min: 50000, max: 100000, mid: 75000 },
  { label: '>$100K', min: 100000, max: Infinity, mid: 150000 },
];

const SCAM_TYPES = [
  { id: 'romance', emoji: '\u{1F494}', label: 'Romance / Pig Butchering' },
  { id: 'fake_platform', emoji: '\u{1F4C8}', label: 'Fake Trading Platform' },
  { id: 'ponzi', emoji: '\u{1F4B0}', label: 'Investment / Ponzi' },
  { id: 'phishing', emoji: '\u{1F3A3}', label: 'Phishing / Wallet Drain' },
  { id: 'rug_pull', emoji: '\u{1F525}', label: 'Rug Pull / Exit Scam' },
  { id: 'other', emoji: '\u{2753}', label: 'Other' },
];

const CONTACT_METHODS = [
  'Tinder',
  'WhatsApp',
  'Telegram',
  'Instagram',
  'Facebook',
  'Twitter/X',
  'Email',
  'Phone Call',
  'Website Ad',
  'LinkedIn',
  'Other',
];

function detectNetwork(addr: string): string {
  if (!addr || addr.length < 10) return '';
  if (/^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,}$/.test(addr)) return 'btc';
  if (/^T[a-zA-Z0-9]{33}$/.test(addr)) return 'trx';
  if (/^0x[a-fA-F0-9]{40}$/.test(addr)) return 'eth';
  if (/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(addr) && !addr.startsWith('0x')) return 'sol';
  return '';
}

/* ───────── component ───────── */

export default function EmergencyPage() {
  const locale = useLocale();
  const base = locale === 'en' ? '' : `/${locale}`;

  /* ── state ── */
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    country: '',
    lossAmount: '',
    lossBracket: '',
    walletAddress: '',
    txid: '',
    txDate: '',
    platformName: '',
    detectedNetwork: '',
    scamType: '',
    description: '',
    contactMethod: '',
    email: '',
  });
  const [route, setRoute] = useState<'EMERGENCY' | 'URGENT' | 'AGGREGATOR' | null>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  /* ── helpers ── */
  const set = useCallback(
    (fields: Partial<typeof form>) => setForm((prev) => ({ ...prev, ...fields })),
    [],
  );

  /* auto-detect network */
  useEffect(() => {
    const net = detectNetwork(form.walletAddress);
    if (net) set({ detectedNetwork: net });
  }, [form.walletAddress, set]);

  /* auto-set bracket from amount */
  useEffect(() => {
    const num = parseFloat(form.lossAmount);
    if (isNaN(num)) return;
    const bracket = BRACKETS.find((b) => num >= b.min && num < b.max);
    if (bracket) set({ lossBracket: bracket.label });
  }, [form.lossAmount, set]);

  /* ── validation per step ── */
  const stepValid = (): boolean => {
    switch (step) {
      case 1:
        return form.country !== '' && form.lossAmount !== '';
      case 2:
        return form.walletAddress.length >= 10 && form.txDate !== '';
      case 3:
        return form.scamType !== '' && form.description.length >= 100 && form.email.length > 3;
      default:
        return true;
    }
  };

  /* ── analysis checklist animation (step 4) ── */
  const [visibleChecks, setVisibleChecks] = useState(0);

  useEffect(() => {
    if (step !== 4) return;
    setVisibleChecks(0);
    const items = 5;
    let count = 0;
    const interval = setInterval(() => {
      count++;
      setVisibleChecks(count);
      if (count >= items) {
        clearInterval(interval);
        setTimeout(() => setStep(5), 600);
      }
    }, 600);
    return () => clearInterval(interval);
  }, [step]);

  /* ── analyze handler ── */
  const handleAnalyze = async () => {
    setAnalyzing(true);
    try {
      const res = await fetch('/api/emergency/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      setRoute(data.route);
      setAnalysis({ ...data.analysis, caseId: data.caseId });
    } catch {
      setRoute('URGENT');
      setAnalysis({
        recoveryScore: 35,
        destination: null,
        exchange: null,
        daysSince: 14,
        scamDbMatch: null,
        victimCount: 0,
        totalLoss: 0,
        threshold: 500000,
      });
    }
    setAnalyzing(false);
    setStep(4);
  };

  /* ── checkout handler ── */
  const handleCheckout = async (product: 'emergency_pack' | 'summary_report') => {
    setCheckoutLoading(true);
    try {
      const res = await fetch('/api/emergency/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product, caseId: analysis?.caseId, ...form, route }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
        return;
      }
    } catch {
      /* fall through */
    }
    setCheckoutLoading(false);
  };

  /* ── join aggregator ── */
  const handleJoinGroup = async () => {
    setCheckoutLoading(true);
    try {
      const res = await fetch('/api/emergency/join-group', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caseId: analysis?.caseId || '',
          email: form.email,
          country: form.country,
          walletAddress: form.walletAddress,
          platformName: form.platformName,
          lossAmount: parseFloat(form.lossAmount) || 0,
          scamType: form.scamType,
        }),
      });
      const data = await res.json();
      if (data.success) {
        const params = new URLSearchParams({
          product: 'group_joined',
          victims: String(data.victims || 0),
          total_loss: String(data.totalLoss || 0),
        });
        window.location.href = `${base}/emergency/success?${params.toString()}`;
        return;
      }
    } catch {
      /* ignore */
    }
    setCheckoutLoading(false);
  };

  /* ── progress bar ── */
  const totalSteps = 5;
  const progress = Math.round((Math.min(step, totalSteps) / totalSteps) * 100);

  /* ───────── render ───────── */
  const inputCls = 'w-full bg-white border border-slate-200 shadow-sm rounded-lg px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-transparent';

  return (
    <div className="min-h-screen">
      <Navbar />

      <div className="pt-28 pb-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* progress bar — hidden on step 1 landing */}
          {step > 1 && (
            <div className="mb-10">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span>Step {Math.min(step, totalSteps)} of {totalSteps}</span>
                <span>{progress}%</span>
              </div>
              <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-brand-600 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* ═══════ STEP 1: Hero + Country + Amount ═══════ */}
          {step === 1 && (
            <div>
              {/* Hero */}
              <div className="text-center mb-10">
                <div className="inline-flex items-center gap-2 bg-red-50 text-red-700 px-4 py-1.5 rounded-full text-sm font-medium mb-5">
                  <AlertTriangle size={14} />
                  Time-sensitive — act now
                </div>
                <h1 className="font-display font-bold text-3xl sm:text-4xl text-slate-900 mb-3">
                  Were You Scammed? Act Now.
                </h1>
                <p className="text-slate-500 text-lg max-w-xl mx-auto">
                  Get your Emergency Recovery Pack — ready in 2 minutes
                </p>
              </div>

              {/* Value proposition — 3 columns */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
                <div className="bg-white border border-slate-200 rounded-xl p-5 text-center shadow-sm">
                  <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <FileText size={20} className="text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-slate-900 text-sm mb-1">Police Report</h3>
                  <p className="text-xs text-slate-500">Ready-to-file complaint for your country</p>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-5 text-center shadow-sm">
                  <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <Shield size={20} className="text-amber-600" />
                  </div>
                  <h3 className="font-semibold text-slate-900 text-sm mb-1">Freeze Request</h3>
                  <p className="text-xs text-slate-500">Letter to exchange to freeze funds</p>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-5 text-center shadow-sm">
                  <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <CheckCircle2 size={20} className="text-emerald-600" />
                  </div>
                  <h3 className="font-semibold text-slate-900 text-sm mb-1">Action Plan</h3>
                  <p className="text-xs text-slate-500">Step-by-step recovery instructions</p>
                </div>
              </div>

              {/* Compact form */}
              <div className="max-w-lg mx-auto">
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 sm:p-8">
                  {/* Country dropdown */}
                  <div className="mb-5">
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Where are you located?
                    </label>
                    <select
                      value={form.country}
                      onChange={(e) => set({ country: e.target.value })}
                      className={inputCls}
                    >
                      <option value="">Select country...</option>
                      {COUNTRIES.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.flag} {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Amount */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      How much did you lose?
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">$</span>
                      <input
                        type="number"
                        min="0"
                        value={form.lossAmount}
                        onChange={(e) => set({ lossAmount: e.target.value })}
                        placeholder="0"
                        className={`${inputCls} pl-8`}
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">USD</span>
                    </div>
                  </div>

                  {/* CTA button */}
                  <button
                    disabled={!stepValid()}
                    onClick={() => setStep(2)}
                    className="w-full flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-lg text-base transition-colors"
                  >
                    Analyze My Case <ArrowRight size={16} />
                  </button>
                </div>

                {/* Trust bar */}
                <div className="flex items-center justify-center gap-6 mt-5 text-xs text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <Shield size={12} /> Encrypted
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Zap size={12} /> Instant
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 size={12} /> 500+ helped
                  </span>
                </div>
              </div>

              {/* How It Works */}
              <div className="mt-14 max-w-lg mx-auto">
                <h3 className="font-display font-semibold text-lg text-slate-900 text-center mb-6">
                  How It Works
                </h3>
                <div className="space-y-4">
                  {[
                    'Enter transaction details',
                    'We trace where your funds went',
                    'Get your recovery probability score',
                    'Download ready-to-use legal documents',
                  ].map((text, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-full bg-brand-50 border border-brand-200 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-bold text-brand-600">{i + 1}</span>
                      </div>
                      <span className="text-sm text-slate-600">{text}</span>
                    </div>
                  ))}
                </div>
                <p className="text-center text-xs text-slate-400 mt-5">
                  Takes 2 minutes &middot; Documents ready instantly
                </p>
              </div>
            </div>
          )}

          {/* ═══════ STEP 2: Transaction Data ═══════ */}
          {step === 2 && (
            <div>
              <h2 className="font-display font-bold text-2xl sm:text-3xl mb-8 text-center">
                Enter transaction details
              </h2>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm text-slate-500 mb-2">
                    Wallet Address{' '}
                    {form.detectedNetwork && (
                      <span className="ml-2 text-xs text-brand-400 bg-brand-600/10 px-2 py-0.5 rounded">
                        {form.detectedNetwork.toUpperCase()} detected
                      </span>
                    )}
                  </label>
                  <input
                    type="text"
                    value={form.walletAddress}
                    onChange={(e) => set({ walletAddress: e.target.value })}
                    placeholder="0x... or bc1... or T..."
                    className={`${inputCls} font-mono text-sm`}
                  />
                </div>

                <div>
                  <label className="block text-sm text-slate-500 mb-2">Transaction Hash</label>
                  <input
                    type="text"
                    value={form.txid}
                    onChange={(e) => set({ txid: e.target.value })}
                    placeholder="TXID (optional)"
                    className={`${inputCls} font-mono text-sm`}
                  />
                </div>

                <div>
                  <label className="block text-sm text-slate-500 mb-2">
                    When did this happen? <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="date"
                    value={form.txDate}
                    onChange={(e) => set({ txDate: e.target.value })}
                    className={inputCls}
                  />
                </div>

                <div>
                  <label className="block text-sm text-slate-500 mb-2">Platform Name</label>
                  <input
                    type="text"
                    value={form.platformName}
                    onChange={(e) => set({ platformName: e.target.value })}
                    placeholder="e.g. CryptoTrade Pro"
                    className={inputCls}
                  />
                </div>
              </div>

              <div className="mt-8 flex justify-between">
                <button
                  onClick={() => setStep(1)}
                  className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors"
                >
                  <ArrowLeft size={16} /> Back
                </button>
                <button
                  disabled={!stepValid()}
                  onClick={() => setStep(3)}
                  className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold px-6 py-3 rounded-lg transition-colors"
                >
                  Next <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* ═══════ STEP 3: Scam Type + Description + Email ═══════ */}
          {step === 3 && (
            <div>
              <h2 className="font-display font-bold text-2xl sm:text-3xl mb-8 text-center">
                Tell us what happened
              </h2>

              {/* Scam type grid */}
              <div className="mb-6">
                <label className="block text-sm text-slate-500 mb-3">Type of scam</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {SCAM_TYPES.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => set({ scamType: s.id })}
                      className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-all text-left ${
                        form.scamType === s.id
                          ? 'border-brand-600 bg-brand-600/10'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <span className="text-xl">{s.emoji}</span>
                      <span className="text-xs text-slate-600 leading-tight">{s.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div className="mb-5">
                <label className="block text-sm text-slate-500 mb-2">Describe what happened</label>
                <textarea
                  rows={4}
                  value={form.description}
                  onChange={(e) => set({ description: e.target.value })}
                  placeholder="Describe what happened, include any relevant details..."
                  className={`${inputCls} resize-none`}
                />
                <div className="flex justify-end mt-1">
                  <span className={`text-xs ${form.description.length >= 100 ? 'text-emerald-500' : 'text-slate-400'}`}>
                    {form.description.length} / 100 min
                  </span>
                </div>
              </div>

              {/* Contact method — US only */}
              {form.country === 'US' && (
                <div className="mb-5">
                  <label className="block text-sm text-slate-500 mb-2">How were you contacted?</label>
                  <select
                    value={form.contactMethod}
                    onChange={(e) => set({ contactMethod: e.target.value })}
                    className={inputCls}
                  >
                    <option value="">Select...</option>
                    {CONTACT_METHODS.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Email */}
              <div className="mb-6">
                <label className="block text-sm text-slate-500 mb-2">
                  Your email <span className="text-red-400">*</span>
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => set({ email: e.target.value })}
                  placeholder="you@email.com"
                  className={inputCls}
                />
              </div>

              <div className="flex justify-between">
                <button
                  onClick={() => setStep(2)}
                  className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors"
                >
                  <ArrowLeft size={16} /> Back
                </button>
                <button
                  disabled={!stepValid() || analyzing}
                  onClick={handleAnalyze}
                  className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold px-6 py-3 rounded-lg transition-colors"
                >
                  {analyzing ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> Analyzing...
                    </>
                  ) : (
                    <>
                      <Search size={16} /> Analyze My Case
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* ═══════ STEP 4: Animated Analysis ═══════ */}
          {step === 4 && (
            <div>
              <h2 className="font-display font-bold text-2xl sm:text-3xl mb-10 text-center">
                Analyzing your case...
              </h2>

              <div className="max-w-md mx-auto space-y-4">
                {[
                  'Checking OFAC sanctions database...',
                  'Tracing fund movements...',
                  'Identifying destination exchange...',
                  'Checking scam database for matches...',
                  'Calculating recovery probability...',
                ].map((text, i) => (
                  <div
                    key={i}
                    className={`flex items-center gap-3 transition-all duration-500 ${
                      i < visibleChecks ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
                    }`}
                  >
                    <CheckCircle2 size={20} className="text-emerald-400 flex-shrink-0" />
                    <span className="text-slate-600">{text}</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-center mt-10">
                <Loader2 size={24} className="animate-spin text-brand-500" />
              </div>
            </div>
          )}

          {/* ═══════ STEP 5: Results ═══════ */}
          {step === 5 && route === 'EMERGENCY' && (
            <div>
              {/* urgent banner */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 mb-8 text-center">
                <Zap size={28} className="mx-auto text-emerald-400 mb-3" />
                <h2 className="font-display font-bold text-2xl sm:text-3xl text-emerald-700 mb-2">
                  URGENT: Funds can still be frozen!
                </h2>
                <p className="text-slate-500 text-sm">Act immediately to maximize recovery chances</p>
              </div>

              {/* score + details */}
              <div className="grid sm:grid-cols-3 gap-4 mb-8">
                {/* recovery score */}
                <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-6 flex flex-col items-center justify-center">
                  <span className="text-xs text-slate-400 uppercase tracking-wider mb-2">
                    Recovery Score
                  </span>
                  <div className="relative w-24 h-24 flex items-center justify-center">
                    <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
                      <circle
                        cx="50"
                        cy="50"
                        r="42"
                        stroke="currentColor"
                        className="text-slate-200"
                        strokeWidth="8"
                        fill="none"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="42"
                        stroke="currentColor"
                        className="text-emerald-400"
                        strokeWidth="8"
                        fill="none"
                        strokeDasharray={`${(analysis?.recoveryScore ?? 0) * 2.64} 264`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <span className="absolute text-2xl font-bold text-emerald-400">
                      {analysis?.recoveryScore ?? 0}%
                    </span>
                  </div>
                </div>

                {/* destination */}
                <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-6 flex flex-col items-center justify-center text-center">
                  <span className="text-xs text-slate-400 uppercase tracking-wider mb-2">
                    Destination
                  </span>
                  <span className="text-lg font-semibold text-slate-900">
                    {analysis?.exchange || 'Exchange detected'}
                  </span>
                </div>

                {/* time remaining */}
                <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-6 flex flex-col items-center justify-center text-center">
                  <span className="text-xs text-slate-400 uppercase tracking-wider mb-2">
                    Time Remaining
                  </span>
                  <Clock size={20} className="text-amber-400 mb-1" />
                  <span className="text-lg font-semibold text-amber-400">
                    ~{Math.max(0, 72 - (analysis?.daysSince ?? 0) * 24)} hours
                  </span>
                </div>
              </div>

              {/* emergency pack card */}
              <div className="bg-white border border-emerald-200 shadow-sm rounded-xl p-6 sm:p-8 mb-8">
                <div className="flex items-center gap-3 mb-5">
                  <Shield size={24} className="text-emerald-400" />
                  <h3 className="font-display font-bold text-xl text-slate-900">
                    Emergency Preservation Pack
                  </h3>
                </div>

                <ul className="space-y-3 mb-6">
                  {[
                    `Police Report (${AGENCIES[form.country] || 'Local Authority'})`,
                    `Preservation Letter for ${analysis?.exchange || 'Exchange'}`,
                    'Chain of Custody Evidence',
                    'Step-by-step instructions',
                    'Affidavit of Ownership template',
                    'Executive summary for attorney',
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle2
                        size={18}
                        className="text-emerald-400 flex-shrink-0 mt-0.5"
                      />
                      <span className="text-slate-600 text-sm">{item}</span>
                    </li>
                  ))}
                </ul>

                <button
                  disabled={checkoutLoading}
                  onClick={() => handleCheckout('emergency_pack')}
                  className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold py-4 rounded-lg text-lg transition-colors"
                >
                  {checkoutLoading ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    <>
                      $79 &mdash; Get Documents Now <ArrowRight size={18} />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {step === 5 && route === 'AGGREGATOR' && (
            <div>
              {/* header */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 mb-8 text-center">
                <AlertTriangle size={28} className="mx-auto text-amber-400 mb-3" />
                <h2 className="font-display font-bold text-xl sm:text-2xl text-amber-700 mb-2">
                  Direct freeze unlikely ({analysis?.daysSince ?? '?'} days ago)
                </h2>
                <p className="text-lg font-semibold text-slate-900 mt-3">
                  BUT: You&apos;re not alone!
                </p>
              </div>

              {/* stats */}
              <div className="grid sm:grid-cols-3 gap-4 mb-8">
                <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-5 text-center">
                  <span className="text-xs text-slate-400 uppercase tracking-wider block mb-1">
                    Platform
                  </span>
                  <span className="text-slate-900 font-semibold">
                    {analysis?.scamDbMatch?.name || form.platformName || 'Unknown'}
                  </span>
                </div>

                <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-5 text-center">
                  <Users size={18} className="mx-auto text-brand-400 mb-1" />
                  <span className="text-xs text-slate-400 uppercase tracking-wider block mb-1">
                    Victims in Group
                  </span>
                  <span className="text-slate-900 font-semibold text-lg">
                    {analysis?.victimCount ?? 0}
                  </span>
                </div>

                <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-5 text-center">
                  <span className="text-xs text-slate-400 uppercase tracking-wider block mb-1">
                    Total Losses
                  </span>
                  <span className="text-slate-900 font-semibold text-lg">
                    ${(analysis?.totalLoss ?? 0).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* threshold progress */}
              <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-6 mb-8">
                <div className="flex items-center justify-between text-sm mb-3">
                  <span className="text-slate-400">Threshold for legal action</span>
                  <span className="text-slate-900 font-semibold">
                    ${(analysis?.threshold ?? 500000).toLocaleString()}
                  </span>
                </div>
                <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full transition-all duration-700"
                    style={{
                      width: `${Math.min(
                        100,
                        ((analysis?.totalLoss ?? 0) / (analysis?.threshold ?? 500000)) * 100,
                      )}%`,
                    }}
                  />
                </div>
                <div className="text-right mt-1">
                  <span className="text-xs text-slate-400">
                    {Math.min(
                      100,
                      Math.round(
                        ((analysis?.totalLoss ?? 0) / (analysis?.threshold ?? 500000)) * 100,
                      ),
                    )}
                    % reached
                  </span>
                </div>
              </div>

              {/* actions */}
              <div className="space-y-3">
                <button
                  disabled={checkoutLoading}
                  onClick={handleJoinGroup}
                  className="w-full flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-bold py-4 rounded-lg text-lg transition-colors"
                >
                  {checkoutLoading ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    <>
                      <Users size={18} /> Join Recovery Group &mdash; FREE
                    </>
                  )}
                </button>

                <button
                  disabled={checkoutLoading}
                  onClick={() => handleCheckout('summary_report')}
                  className="w-full flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 disabled:opacity-50 text-slate-900 font-semibold py-3 rounded-lg transition-colors"
                >
                  {checkoutLoading ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    <>
                      <FileText size={16} /> Get Summary Report for $19
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {step === 5 && route === 'URGENT' && (
            <div>
              {/* warning banner */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 mb-8 text-center">
                <AlertTriangle size={28} className="mx-auto text-amber-400 mb-3" />
                <h2 className="font-display font-bold text-xl sm:text-2xl text-amber-700 mb-2">
                  Chances reduced but not zero. Act within 24 hours.
                </h2>
              </div>

              {/* emergency pack card */}
              <div className="bg-white border border-amber-200 shadow-sm rounded-xl p-6 sm:p-8 mb-8">
                <div className="flex items-center gap-3 mb-5">
                  <Shield size={24} className="text-amber-400" />
                  <h3 className="font-display font-bold text-xl text-slate-900">
                    Emergency Preservation Pack
                  </h3>
                </div>

                <ul className="space-y-3 mb-6">
                  {[
                    `Police Report (${AGENCIES[form.country] || 'Local Authority'})`,
                    `Preservation Letter for ${analysis?.exchange || 'Exchange'}`,
                    'Chain of Custody Evidence',
                    'Step-by-step instructions',
                    'Affidavit of Ownership template',
                    'Executive summary for attorney',
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle2
                        size={18}
                        className="text-amber-400 flex-shrink-0 mt-0.5"
                      />
                      <span className="text-slate-600 text-sm">{item}</span>
                    </li>
                  ))}
                </ul>

                <button
                  disabled={checkoutLoading}
                  onClick={() => handleCheckout('emergency_pack')}
                  className="w-full flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold py-4 rounded-lg text-lg transition-colors"
                >
                  {checkoutLoading ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    <>
                      $79 &mdash; Get Documents Now <ArrowRight size={18} />
                    </>
                  )}
                </button>
              </div>

              {/* aggregator link */}
              <div className="text-center">
                <button
                  onClick={() => setRoute('AGGREGATOR')}
                  className="text-brand-400 hover:text-brand-300 underline underline-offset-4 transition-colors"
                >
                  Or join the Victim Recovery Group
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
