import type { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import GraphTracer from '@/components/GraphTracer';
import { ArrowRight, Shield } from 'lucide-react';
import { useTranslations } from 'next-intl';

export const metadata: Metadata = {
  title: 'Free Transaction Flow Graph | Ethereum Fund Tracing | LedgerHound',
  description:
    'Visualize Ethereum fund flows with our free transaction graph tool. Multi-hop tracing, known entity detection (exchanges, mixers, DeFi), and export capabilities. Used by investigators and attorneys.',
  keywords: [
    'ethereum transaction graph',
    'crypto fund flow visualization',
    'blockchain tracing tool',
    'trace crypto funds',
    'ethereum flow chart',
    'crypto forensics tool',
    'transaction flow analysis',
  ],
};

export default function GraphTracerPage() {
  const t = useTranslations('graph_page');

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* SEO Hero */}
      <div className="pt-24 pb-12 bg-gradient-to-br from-slate-50 to-white border-b border-slate-100">
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

      {/* Graph Tracer */}
      <GraphTracer />

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
