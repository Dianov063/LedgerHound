import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import WalletTracker from '@/components/WalletTracker';
import { ArrowRight, Shield } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { makeMetadata } from '@/lib/metadata';

export function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
  return makeMetadata({
    locale,
    path: '/wallet-tracker',
    title: 'Free Multi-Chain Wallet Tracker \u2014 14 Blockchains | LedgerHound',
    description: 'Track any wallet address across 14 blockchains: Bitcoin, Ethereum, Solana, TRON, BNB Chain, Polygon, Arbitrum, Base, Optimism, Avalanche, Linea, zkSync, Scroll, Mantle. Free blockchain forensics tool.',
    keywords: ['multi-chain wallet tracker', 'ethereum wallet tracker', 'bitcoin wallet tracker', 'solana wallet tracker', 'tron wallet tracker', 'check wallet address', 'blockchain transaction history', 'crypto wallet checker', 'track crypto transactions'],
  });
}

export default function WalletTrackerPage() {
  const t = useTranslations('tracker_page');

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* SEO Hero */}
      <div className="pt-28 pb-12 bg-gradient-to-br from-slate-50 to-white border-b border-slate-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-brand-50 border border-brand-100 text-brand-700 text-xs font-semibold px-4 py-2 rounded-full mb-6">
            <Shield size={12} />
            {t('badge')}
          </div>
          <h1 className="font-display font-bold text-4xl lg:text-5xl text-slate-900 mb-5">
            {t('title')} <span className="text-brand-600">{t('title_highlight')}</span>
          </h1>
          <p className="text-slate-600 text-base leading-relaxed max-w-2xl mx-auto">
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
