import type { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import WalletTracker from '@/components/WalletTracker';
import { ArrowRight, Shield } from 'lucide-react';
import { useTranslations } from 'next-intl';

export const metadata: Metadata = {
  title: 'Free Ethereum Wallet Tracker | LedgerHound',
  description:
    'Track any Ethereum wallet address instantly. See complete transaction history, token transfers, and analytics. Free blockchain forensics tool by LedgerHound.',
  keywords: [
    'ethereum wallet tracker',
    'check wallet address',
    'trace bitcoin wallet',
    'blockchain transaction history',
    'crypto wallet checker',
    'track crypto transactions',
  ],
};

export default function WalletTrackerPage() {
  const t = useTranslations('tracker_page');

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* SEO Hero */}
      <div className="pt-24 pb-12 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border-b border-slate-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-brand-950 border border-brand-800 text-brand-400 text-xs font-semibold px-4 py-2 rounded-full mb-6">
            <Shield size={12} />
            {t('badge')}
          </div>
          <h1 className="font-display font-bold text-4xl lg:text-5xl text-white mb-5">
            {t('title')} <span className="text-brand-500">{t('title_highlight')}</span>
          </h1>
          <p className="text-slate-400 text-base leading-relaxed max-w-2xl mx-auto">
            {t('subtitle')}
          </p>
        </div>
      </div>

      {/* Tracker */}
      <WalletTracker />

      {/* CTA Banner */}
      <div className="bg-gradient-to-r from-brand-600 to-brand-700 py-12">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="font-display font-bold text-2xl text-white mb-3">
            {t('cta_title')}
          </h2>
          <p className="text-brand-100 mb-6">
            {t('cta_desc')}
          </p>
          <Link
            href="/free-evaluation"
            className="inline-flex items-center gap-2 bg-white text-brand-700 font-bold px-7 py-3.5 rounded-lg hover:bg-brand-50 transition-colors"
          >
            {t('cta_btn')} <ArrowRight size={16} />
          </Link>
        </div>
      </div>

      <Footer />
    </div>
  );
}
