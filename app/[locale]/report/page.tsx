'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import {
  ArrowRight,
  Shield,
  FileText,
  CheckCircle2,
  Lock,
  Zap,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export default function ReportPage() {
  const t = useTranslations('report');
  const locale = useLocale();
  const base = locale === 'en' ? '' : `/${locale}`;

  const [wallet, setWallet] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const isValidWallet = /^0x[a-fA-F0-9]{40}$/.test(wallet);
  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const canSubmit = isValidWallet && isValidEmail && !loading;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: wallet, email }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
        setLoading(false);
        return;
      }
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  const includes = Array.from({ length: 8 }, (_, i) => t(`include_${i + 1}`));
  const faqs = Array.from({ length: 4 }, (_, i) => ({
    q: t(`faq_${i + 1}_q`),
    a: t(`faq_${i + 1}_a`),
  }));

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero */}
      <div className="pt-24 pb-12 bg-gradient-to-br from-slate-50 to-white border-b border-slate-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-brand-50 border border-brand-100 text-brand-700 text-xs font-semibold px-4 py-2 rounded-full mb-6">
            <Zap size={12} />
            {t('badge')}
          </div>
          <h1 className="font-display font-bold text-4xl lg:text-5xl text-slate-900 mb-5">
            {t('title')} <span className="text-brand-600">{t('title_highlight')}</span>
          </h1>
          <p className="text-slate-600 max-w-2xl mx-auto leading-relaxed">
            {t('subtitle')}
          </p>
        </div>
      </div>

      {/* Main Content */}
      <section className="py-12 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-10">
            {/* Left: Form */}
            <div>
              <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
                <div className="flex items-center gap-2 mb-6">
                  <FileText size={20} className="text-brand-600" />
                  <h2 className="font-display font-bold text-lg text-slate-900">Order Your Report</h2>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">{t('wallet_label')}</label>
                    <input
                      type="text"
                      value={wallet}
                      onChange={(e) => setWallet(e.target.value.trim())}
                      placeholder={t('wallet_placeholder')}
                      className={`w-full px-4 py-3 rounded-xl border-2 text-sm font-mono transition-colors outline-none ${
                        wallet && !isValidWallet
                          ? 'border-red-300 bg-red-50'
                          : wallet && isValidWallet
                          ? 'border-emerald-300 bg-emerald-50'
                          : 'border-slate-200 bg-white focus:border-brand-500'
                      }`}
                    />
                    {wallet && !isValidWallet && (
                      <p className="text-xs text-red-500 mt-1">Enter a valid Ethereum address (0x...)</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">{t('email_label')}</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value.trim())}
                      placeholder={t('email_placeholder')}
                      className={`w-full px-4 py-3 rounded-xl border-2 text-sm transition-colors outline-none ${
                        email && !isValidEmail
                          ? 'border-red-300 bg-red-50'
                          : email && isValidEmail
                          ? 'border-emerald-300 bg-emerald-50'
                          : 'border-slate-200 bg-white focus:border-brand-500'
                      }`}
                    />
                  </div>

                  {error && (
                    <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">{error}</p>
                  )}

                  <button
                    onClick={handleSubmit}
                    disabled={!canSubmit}
                    className={`w-full flex items-center justify-center gap-2 font-bold py-4 rounded-xl transition-all text-sm ${
                      canSubmit
                        ? 'bg-brand-600 text-white hover:bg-brand-700 shadow-sm'
                        : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                        Redirecting to Stripe...
                      </span>
                    ) : (
                      <>
                        <Lock size={14} />
                        {t('buy_btn')}
                      </>
                    )}
                  </button>

                  <p className="text-xs text-slate-400 text-center flex items-center justify-center gap-1.5">
                    <Lock size={10} /> {t('secure_note')}
                  </p>
                </div>
              </div>
            </div>

            {/* Right: What's included */}
            <div>
              <h2 className="font-display font-bold text-lg text-slate-900 mb-4">{t('whats_included')}</h2>
              <div className="space-y-3">
                {includes.map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <CheckCircle2 size={18} className="text-brand-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-slate-600">{item}</span>
                  </div>
                ))}
              </div>

              <div className="mt-8 bg-slate-50 border border-slate-200 rounded-xl p-5">
                <h3 className="font-display font-bold text-slate-900 mb-2">{t('sample_title')}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{t('sample_desc')}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 bg-slate-50 border-t border-slate-100">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-display font-bold text-2xl text-slate-900 mb-8 text-center">{t('faq_title')}</h2>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left"
                >
                  <span className="font-semibold text-sm text-slate-900">{faq.q}</span>
                  {openFaq === i ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-4">
                    <p className="text-sm text-slate-600 leading-relaxed">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-16 bg-gradient-to-r from-brand-600 to-brand-700">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <Shield className="mx-auto text-brand-200 mb-4" size={32} />
          <h2 className="font-display font-bold text-2xl text-white mb-3">{t('cta_title')}</h2>
          <p className="text-brand-100 mb-6 max-w-lg mx-auto">{t('cta_desc')}</p>
          <Link
            href={`${base}/free-evaluation`}
            className="inline-flex items-center gap-2 bg-white text-brand-700 font-bold px-7 py-3.5 rounded-lg hover:bg-brand-50 transition-colors"
          >
            {t('cta_btn')} <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
