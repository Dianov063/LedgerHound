'use client';

import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import {
  ArrowRight,
  CheckCircle2,
  Mail,
  Shield,
  Search,
  FileText,
} from 'lucide-react';

export default function ReportSuccessPage() {
  const t = useTranslations('report');
  const locale = useLocale();
  const base = locale === 'en' ? '' : `/${locale}`;

  return (
    <div className="min-h-screen">
      <Navbar />

      <div className="pt-24 pb-20 bg-gradient-to-br from-slate-50 to-white min-h-[80vh] flex items-center">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Success Icon */}
          <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-100 rounded-full mb-6">
            <CheckCircle2 size={40} className="text-emerald-600" />
          </div>

          <h1 className="font-display font-bold text-3xl lg:text-4xl text-slate-900 mb-4">
            {t('success_title')}
          </h1>
          <p className="text-slate-600 text-lg mb-8">
            {t('success_subtitle')}
          </p>

          {/* Email notice */}
          <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-700 text-sm font-medium px-5 py-3 rounded-xl mb-10">
            <Mail size={16} />
            {t('success_email')}
          </div>

          {/* Cards */}
          <div className="grid sm:grid-cols-2 gap-4 mt-8">
            <div className="bg-white border border-slate-200 rounded-xl p-6 text-left">
              <Search size={20} className="text-brand-600 mb-3" />
              <h3 className="font-display font-bold text-slate-900 mb-1">{t('success_try_tools')}</h3>
              <p className="text-sm text-slate-500 mb-4">{t('success_try_tools_desc')}</p>
              <div className="space-y-2">
                <Link
                  href={`${base}/wallet-tracker`}
                  className="flex items-center gap-1.5 text-sm text-brand-600 font-semibold hover:text-brand-700"
                >
                  Wallet Tracker <ArrowRight size={12} />
                </Link>
                <Link
                  href={`${base}/graph-tracer`}
                  className="flex items-center gap-1.5 text-sm text-brand-600 font-semibold hover:text-brand-700"
                >
                  Graph Tracer <ArrowRight size={12} />
                </Link>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-6 text-left">
              <FileText size={20} className="text-brand-600 mb-3" />
              <h3 className="font-display font-bold text-slate-900 mb-1">{t('success_need_more')}</h3>
              <p className="text-sm text-slate-500 mb-4">{t('success_need_more_desc')}</p>
              <Link
                href={`${base}/free-evaluation`}
                className="inline-flex items-center gap-1.5 bg-brand-600 text-white font-semibold text-sm px-4 py-2 rounded-lg hover:bg-brand-700 transition-colors"
              >
                {t('success_cta')} <ArrowRight size={12} />
              </Link>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
