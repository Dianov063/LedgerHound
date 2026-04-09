'use client';

import { Suspense } from 'react';
import { useTranslations } from 'next-intl';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ExchangeLetterForm from '@/components/ExchangeLetterForm';
import { Shield, FileText, Mail, Clock } from 'lucide-react';

function Features() {
  const t = useTranslations('exchange_letter');
  const features = [
    { icon: Shield, title: t('feat_exchanges'), desc: t('feat_exchanges_desc') },
    { icon: FileText, title: t('feat_templates'), desc: t('feat_templates_desc') },
    { icon: Mail, title: t('feat_email'), desc: t('feat_email_desc') },
    { icon: Clock, title: t('feat_fast'), desc: t('feat_fast_desc') },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
      {features.map((f, i) => (
        <div key={i} className="text-center p-4 bg-white rounded-xl border border-slate-100 shadow-sm">
          <f.icon size={24} className="mx-auto text-blue-600 mb-2" />
          <p className="text-sm font-bold text-slate-900">{f.title}</p>
          <p className="text-xs text-slate-500 mt-1">{f.desc}</p>
        </div>
      ))}
    </div>
  );
}

function ExchangeLetterInner() {
  const t = useTranslations('exchange_letter');

  return (
    <>
      <Navbar />
      <main className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-slate-50 min-h-screen">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-xs font-bold px-3 py-1.5 rounded-full mb-4">
              <Shield size={14} />
              {t('badge')}
            </div>
            <h1 className="text-3xl sm:text-4xl font-display font-bold text-slate-900 mb-4">
              {t('title')}
            </h1>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              {t('subtitle')}
            </p>
          </div>

          <Features />
          <ExchangeLetterForm />
        </div>
      </main>
      <Footer />
    </>
  );
}

export default function ExchangeLetterPage() {
  return (
    <Suspense>
      <ExchangeLetterInner />
    </Suspense>
  );
}
