import type { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import RecoveryCalculator from '@/components/RecoveryCalculator';
import { ArrowRight, Shield, Calculator } from 'lucide-react';
import { useTranslations } from 'next-intl';

export const metadata: Metadata = {
  title: 'Crypto Recovery Chances Calculator | LedgerHound',
  description:
    'Find out your chances of recovering stolen cryptocurrency. Free assessment based on case details — used by fraud victims and attorneys.',
  keywords: [
    'crypto recovery calculator',
    'stolen cryptocurrency recovery chances',
    'bitcoin recovery assessment',
    'crypto fraud recovery',
    'blockchain tracing chances',
    'crypto scam recovery odds',
  ],
};

export default function RecoveryCalculatorPage() {
  const t = useTranslations('calculator');

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero */}
      <div className="pt-24 pb-12 bg-gradient-to-br from-slate-50 to-white border-b border-slate-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-brand-50 border border-brand-100 text-brand-700 text-xs font-semibold px-4 py-2 rounded-full mb-6">
            <Calculator size={12} />
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

      {/* Calculator */}
      <section className="py-12 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <RecoveryCalculator />
        </div>
      </section>

      {/* SEO Intro Text */}
      <section className="py-16 bg-white border-t border-slate-100">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-display font-bold text-2xl text-slate-900 mb-4">{t('intro_h2')}</h2>
          <p className="text-slate-600 leading-relaxed mb-4">{t('intro_p1')}</p>
          <p className="text-slate-600 leading-relaxed">{t('intro_p2')}</p>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-16 bg-gradient-to-r from-brand-600 to-brand-700">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <Shield className="mx-auto text-brand-200 mb-4" size={32} />
          <h2 className="font-display font-bold text-2xl text-white mb-3">{t('cta_page_title')}</h2>
          <p className="text-brand-100 mb-6 max-w-lg mx-auto">{t('cta_page_desc')}</p>
          <Link
            href="/free-evaluation"
            className="inline-flex items-center gap-2 bg-white text-brand-700 font-bold px-7 py-3.5 rounded-lg hover:bg-brand-50 transition-colors"
          >
            {t('cta_page_btn')} <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
