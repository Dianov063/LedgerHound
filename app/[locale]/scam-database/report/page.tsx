'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import {
  ArrowRight,
  ArrowLeft,
  Shield,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertTriangle,
  FileText,
  Hash,
  DollarSign,
  Mail,
  Globe,
  Plus,
  Trash2,
} from 'lucide-react';

type ScamType = 'fake_exchange' | 'pig_butchering' | 'rug_pull' | 'phishing' | 'ponzi' | 'other';

const SCAM_TYPES: { id: ScamType; label: string; emoji: string }[] = [
  { id: 'fake_exchange', label: 'Fake Exchange', emoji: '🏦' },
  { id: 'pig_butchering', label: 'Pig Butchering / Romance Scam', emoji: '💔' },
  { id: 'rug_pull', label: 'Rug Pull / DeFi Scam', emoji: '🔌' },
  { id: 'phishing', label: 'Phishing / Impersonation', emoji: '🎣' },
  { id: 'ponzi', label: 'Ponzi / Pyramid Scheme', emoji: '🔺' },
  { id: 'other', label: 'Other', emoji: '❓' },
];

interface TxVerification {
  verified: boolean;
  from?: string;
  to?: string;
  value?: number;
  token?: string;
  network?: string;
  networkLabel?: string;
  timestamp?: string;
  error?: string;
}

export default function ReportScamPage() {
  const t = useTranslations('scamDatabase');
  const locale = useLocale();
  const base = locale === 'en' ? '' : `/${locale}`;

  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitResult, setSubmitResult] = useState<any>(null);
  const [error, setError] = useState('');

  // Step 1: Platform
  const [platformName, setPlatformName] = useState('');
  const [platformUrl, setPlatformUrl] = useState('');
  const [mirrorDomains, setMirrorDomains] = useState<string[]>([]);
  const [scamType, setScamType] = useState<ScamType | ''>('');
  const [description, setDescription] = useState('');

  // Step 2: Evidence
  const [txHash, setTxHash] = useState('');
  const [txVerifying, setTxVerifying] = useState(false);
  const [txVerification, setTxVerification] = useState<TxVerification | null>(null);
  const [scamAddress, setScamAddress] = useState('');
  const [network, setNetwork] = useState('');

  // Step 3: Losses
  const [lossAmount, setLossAmount] = useState('');
  const [lossCurrency, setLossCurrency] = useState('USD');
  const [lossDate, setLossDate] = useState('');

  // Step 4: Contact
  const [reporterEmail, setReporterEmail] = useState('');

  const addMirrorDomain = () => setMirrorDomains([...mirrorDomains, '']);
  const removeMirrorDomain = (i: number) => setMirrorDomains(mirrorDomains.filter((_, idx) => idx !== i));
  const updateMirrorDomain = (i: number, val: string) => {
    const updated = [...mirrorDomains];
    updated[i] = val;
    setMirrorDomains(updated);
  };

  const verifyTxHash = async () => {
    if (!txHash.trim()) return;
    setTxVerifying(true);
    setTxVerification(null);
    try {
      const res = await fetch('/api/tx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hash: txHash.trim(), network: 'auto' }),
      });
      const data = await res.json();
      if (data.error) {
        setTxVerification({ verified: false, error: data.error });
      } else {
        setTxVerification({
          verified: true,
          from: data.from,
          to: data.to,
          value: data.value,
          token: data.token,
          network: data.network,
          networkLabel: data.networkLabel,
          timestamp: data.timestamp,
        });
        // Auto-fill fields from verified TX
        if (data.to) setScamAddress(data.to);
        if (data.network) setNetwork(data.network);
      }
    } catch {
      setTxVerification({ verified: false, error: 'Failed to verify transaction' });
    }
    setTxVerifying(false);
  };

  const canProceed = (s: number): boolean => {
    switch (s) {
      case 1: return !!platformName.trim() && !!scamType && description.trim().length >= 100;
      case 2: return true; // Evidence is optional
      case 3: return true; // Losses optional
      case 4: return true; // Email optional
      default: return false;
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/scam-database/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platformName: platformName.trim(),
          platformUrl: platformUrl.trim() || undefined,
          platformUrls: mirrorDomains.filter(Boolean),
          platformType: scamType,
          description: description.trim(),
          txHash: txHash.trim() || undefined,
          scamAddress: scamAddress.trim() || undefined,
          network: network || undefined,
          lossAmount: lossAmount ? parseFloat(lossAmount) : undefined,
          lossCurrency,
          lossDate: lossDate || undefined,
          reporterEmail: reporterEmail.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setSubmitted(true);
        setSubmitResult(data);
      }
    } catch {
      setError('Failed to submit report. Please try again.');
    }
    setSubmitting(false);
  };

  if (submitted && submitResult) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="pt-24 pb-16">
          <div className="max-w-2xl mx-auto px-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center">
              <CheckCircle2 className="mx-auto text-emerald-500 mb-4" size={48} />
              <h2 className="font-display font-bold text-2xl text-slate-900 mb-3">{t('report_submitted_title')}</h2>
              <p className="text-slate-600 mb-6">{t('report_submitted_desc')}</p>

              <div className="bg-slate-50 rounded-xl p-4 mb-6 text-sm text-left space-y-2">
                <p><span className="font-semibold text-slate-700">Report ID:</span> <code className="text-brand-600">{submitResult.reportId}</code></p>
                <p>
                  <span className="font-semibold text-slate-700">Trust Tier:</span>{' '}
                  {submitResult.trustTier === 3 && <span className="text-brand-600 font-bold">🔒 Expert Verified</span>}
                  {submitResult.trustTier === 2 && <span className="text-emerald-600 font-bold">✅ Blockchain Verified</span>}
                  {submitResult.trustTier === 1 && <span className="text-amber-600 font-bold">Community Reported</span>}
                </p>
                {submitResult.verified && (
                  <p className="text-emerald-600 font-semibold flex items-center gap-1">
                    <CheckCircle2 size={14} /> Transaction verified on blockchain
                  </p>
                )}
              </div>

              {/* Recovery Score */}
              <div className="bg-brand-50 border border-brand-200 rounded-xl p-6 mb-6">
                <h3 className="font-display font-bold text-lg text-slate-900 mb-2">{t('recovery_title')}</h3>
                <p className="text-slate-600 text-sm mb-4">{t('recovery_desc')}</p>
                <Link
                  href={`${base}/free-evaluation`}
                  className="inline-flex items-center gap-2 bg-brand-600 text-white font-bold px-6 py-3 rounded-lg hover:bg-brand-700 transition-colors"
                >
                  {t('recovery_cta')} <ArrowRight size={16} />
                </Link>
              </div>

              <Link href={`${base}/scam-database`} className="text-sm text-brand-600 font-semibold hover:underline">
                {t('back_to_database')}
              </Link>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Header */}
      <div className="pt-24 pb-8 bg-gradient-to-br from-red-50 to-white border-b border-slate-100">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h1 className="font-display font-bold text-3xl text-slate-900 mb-3">{t('report_title')}</h1>
          <p className="text-slate-600 text-sm">{t('report_subtitle')}</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-10">
        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          {[1, 2, 3, 4].map(s => (
            <div key={s} className="flex-1">
              <div className={`h-2 rounded-full transition-colors ${s <= step ? 'bg-brand-600' : 'bg-slate-200'}`} />
              <p className={`text-[10px] font-semibold mt-1 ${s <= step ? 'text-brand-600' : 'text-slate-400'}`}>
                {s === 1 && t('step_platform')}
                {s === 2 && t('step_evidence')}
                {s === 3 && t('step_losses')}
                {s === 4 && t('step_contact')}
              </p>
            </div>
          ))}
        </div>

        {/* Step 1: Platform */}
        {step === 1 && (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">{t('field_platform_name')} *</label>
              <input
                type="text"
                value={platformName}
                onChange={(e) => setPlatformName(e.target.value)}
                placeholder={t('field_platform_name_ph')}
                className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 text-sm outline-none focus:border-brand-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">{t('field_platform_url')}</label>
              <div className="relative">
                <Globe size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={platformUrl}
                  onChange={(e) => setPlatformUrl(e.target.value)}
                  placeholder="cryptoscam.com"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-slate-200 text-sm outline-none focus:border-brand-500 transition-colors"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">{t('field_mirrors')}</label>
              {mirrorDomains.map((d, i) => (
                <div key={i} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={d}
                    onChange={(e) => updateMirrorDomain(i, e.target.value)}
                    placeholder="mirror-domain.com"
                    className="flex-1 px-4 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-brand-500"
                  />
                  <button onClick={() => removeMirrorDomain(i)} className="text-red-400 hover:text-red-600 p-2"><Trash2 size={14} /></button>
                </div>
              ))}
              <button
                onClick={addMirrorDomain}
                className="flex items-center gap-1 text-xs text-brand-600 font-semibold hover:underline"
              >
                <Plus size={12} /> {t('add_mirror')}
              </button>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">{t('field_scam_type')} *</label>
              <div className="grid grid-cols-2 gap-2">
                {SCAM_TYPES.map(st => (
                  <button
                    key={st.id}
                    onClick={() => setScamType(st.id)}
                    className={`p-3 rounded-xl border-2 text-left text-sm transition-colors ${
                      scamType === st.id
                        ? 'border-brand-500 bg-brand-50 text-brand-700'
                        : 'border-slate-200 hover:border-slate-300 text-slate-600'
                    }`}
                  >
                    <span className="text-lg">{st.emoji}</span>
                    <p className="font-semibold mt-1">{st.label}</p>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">{t('field_description')} *</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t('field_description_ph')}
                rows={5}
                className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 text-sm outline-none focus:border-brand-500 transition-colors resize-none"
              />
              <p className={`text-[10px] mt-1 ${description.length >= 100 ? 'text-emerald-600' : 'text-slate-400'}`}>
                {description.length}/100 {t('min_chars')}
              </p>
            </div>
          </div>
        )}

        {/* Step 2: Evidence */}
        {step === 2 && (
          <div className="space-y-5">
            <div className="bg-brand-50 border border-brand-200 rounded-xl p-4 text-sm text-brand-700">
              <p className="font-semibold">{t('evidence_tip_title')}</p>
              <p className="mt-1 text-brand-600">{t('evidence_tip_desc')}</p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">{t('field_txid')}</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Hash size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={txHash}
                    onChange={(e) => { setTxHash(e.target.value); setTxVerification(null); }}
                    placeholder="0x... or transaction hash"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-slate-200 text-sm font-mono outline-none focus:border-brand-500 transition-colors"
                  />
                </div>
                <button
                  onClick={verifyTxHash}
                  disabled={!txHash.trim() || txVerifying}
                  className="px-4 py-3 rounded-xl bg-brand-600 text-white font-semibold text-sm hover:bg-brand-700 disabled:opacity-40 transition-all flex items-center gap-1.5"
                >
                  {txVerifying ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                  {t('verify_btn')}
                </button>
              </div>
              {txVerification && (
                <div className={`mt-3 rounded-xl p-3 text-sm ${
                  txVerification.verified
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                    : 'bg-red-50 border border-red-200 text-red-700'
                }`}>
                  {txVerification.verified ? (
                    <div className="flex items-start gap-2">
                      <CheckCircle2 size={16} className="mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-semibold">
                          {t('tx_verified')}: {txVerification.value} {txVerification.token} on {txVerification.networkLabel}
                        </p>
                        {txVerification.timestamp && (
                          <p className="text-emerald-600 text-xs mt-0.5">
                            {new Date(txVerification.timestamp).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <XCircle size={16} />
                      <span>{txVerification.error || t('tx_not_found')}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">{t('field_address')}</label>
              <input
                type="text"
                value={scamAddress}
                onChange={(e) => setScamAddress(e.target.value)}
                placeholder="0x... / T... / bc1..."
                className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 text-sm font-mono outline-none focus:border-brand-500 transition-colors"
              />
              {txVerification?.verified && scamAddress && (
                <p className="text-[10px] text-emerald-600 mt-1">{t('address_autofilled')}</p>
              )}
            </div>
          </div>
        )}

        {/* Step 3: Losses */}
        {step === 3 && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">{t('field_loss_amount')}</label>
                <div className="relative">
                  <DollarSign size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="number"
                    value={lossAmount}
                    onChange={(e) => setLossAmount(e.target.value)}
                    placeholder="50000"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-slate-200 text-sm outline-none focus:border-brand-500 transition-colors"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">{t('field_currency')}</label>
                <select
                  value={lossCurrency}
                  onChange={(e) => setLossCurrency(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 text-sm outline-none focus:border-brand-500 transition-colors bg-white"
                >
                  <option value="USD">USD</option>
                  <option value="USDT">USDT</option>
                  <option value="ETH">ETH</option>
                  <option value="BTC">BTC</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                  <option value="RUB">RUB</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">{t('field_loss_date')}</label>
              <input
                type="date"
                value={lossDate}
                onChange={(e) => setLossDate(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 text-sm outline-none focus:border-brand-500 transition-colors"
              />
            </div>
          </div>
        )}

        {/* Step 4: Contact */}
        {step === 4 && (
          <div className="space-y-5">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm text-slate-600">
              <p className="font-semibold text-slate-700 mb-1">{t('contact_privacy_title')}</p>
              <p>{t('contact_privacy_desc')}</p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">{t('field_email')}</label>
              <div className="relative">
                <Mail size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  value={reporterEmail}
                  onChange={(e) => setReporterEmail(e.target.value)}
                  placeholder="your@email.com (optional)"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-slate-200 text-sm outline-none focus:border-brand-500 transition-colors"
                />
              </div>
            </div>

            {/* Summary */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3 text-sm">
              <h3 className="font-display font-bold text-lg text-slate-900">{t('summary_title')}</h3>
              <div className="grid grid-cols-2 gap-3">
                <div><span className="text-slate-400 text-xs">{t('field_platform_name')}</span><p className="font-semibold">{platformName}</p></div>
                <div><span className="text-slate-400 text-xs">{t('field_scam_type')}</span><p className="font-semibold">{SCAM_TYPES.find(s => s.id === scamType)?.label}</p></div>
                {lossAmount && <div><span className="text-slate-400 text-xs">{t('field_loss_amount')}</span><p className="font-semibold text-red-600">${parseFloat(lossAmount).toLocaleString()} {lossCurrency}</p></div>}
                {txVerification?.verified && <div><span className="text-slate-400 text-xs">TXID</span><p className="font-semibold text-emerald-600">✅ Verified</p></div>}
              </div>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 flex items-start gap-2">
            <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8">
          {step > 1 ? (
            <button onClick={() => setStep(step - 1)} className="flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-slate-800">
              <ArrowLeft size={14} /> {t('btn_back')}
            </button>
          ) : (
            <Link href={`${base}/scam-database`} className="flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-slate-800">
              <ArrowLeft size={14} /> {t('back_to_database')}
            </Link>
          )}

          {step < 4 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={!canProceed(step)}
              className="flex items-center gap-1.5 px-6 py-3 rounded-xl bg-brand-600 text-white font-semibold text-sm hover:bg-brand-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              {t('btn_next')} <ArrowRight size={14} />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex items-center gap-1.5 px-6 py-3 rounded-xl bg-red-600 text-white font-semibold text-sm hover:bg-red-700 disabled:opacity-60 transition-all"
            >
              {submitting ? <Loader2 size={14} className="animate-spin" /> : <Shield size={14} />}
              {t('btn_submit')}
            </button>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
