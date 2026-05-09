import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { CheckCircle2, ArrowRight, HelpCircle } from 'lucide-react';
import { makeMetadata } from '@/lib/metadata';



export async function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
  return await makeMetadata({
    locale,
    path: '/pricing',
    metadataKey: 'pricing',
});
}

export default function PricingPage() {
  const t = useTranslations('pricing');
  const tp = useTranslations('pricing_page');
  const locale = useLocale();
  const base = locale === 'en' ? '' : `/${locale}`;

  const faqs = [
    { q: tp('faq.q1'), a: tp('faq.a1') },
    { q: tp('faq.q2'), a: tp('faq.a2') },
    { q: tp('faq.q3'), a: tp('faq.a3') },
    { q: tp('faq.q4'), a: tp('faq.a4') },
    { q: tp('faq.q5'), a: tp('faq.a5') },
    { q: tp('faq.q6'), a: tp('faq.a6') },
  ];

  return (
    <div className="min-h-screen">
      <Navbar />

      <div className="pt-32 pb-12 bg-gradient-to-br from-slate-50 to-white border-b border-slate-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="section-tag">{t('tag')}</p>
          <h1 className="font-display font-bold text-4xl lg:text-5xl text-slate-900 mb-4">
            {t('title').split('\n').map((l, i) => (
              <span key={i}>{l}{i === 0 && <br />}</span>
            ))}
          </h1>
          <p className="text-slate-600 text-lg max-w-xl mx-auto">{t('subtitle')}</p>
        </div>
      </div>

      {/* Pricing Cards */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-6">
            {/* Basic */}
            <div className="card border border-slate-100">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">{t('basic_name')}</p>
              <div className="mb-2">
                <span className="font-display font-bold text-4xl text-slate-900">{t('basic_price')}</span>
              </div>
              <p className="text-sm text-slate-500 mb-1 font-medium">{t('basic_period')}</p>
              <p className="text-sm text-slate-500 mb-6 pb-6 border-b border-slate-100">{t('basic_desc')}</p>
              <ul className="space-y-3 mb-8">
                {['basic_f1', 'basic_f2', 'basic_f3', 'basic_f4'].map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-slate-700">
                    <CheckCircle2 size={15} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                    {t(f)}
                  </li>
                ))}
              </ul>
              <Link href={`${base}/free-evaluation`} className="btn-outline text-sm">{t('cta')}</Link>
              <p className="text-xs text-slate-400 text-center mt-3">{tp('best_for.basic')}</p>
            </div>

            {/* Full - Featured */}
            <div className="relative card border-2 border-brand-400 bg-gradient-to-b from-brand-50 to-white shadow-xl">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-brand-600 text-white text-xs font-bold px-5 py-1.5 rounded-full">
                {t('full_badge')}
              </div>
              <p className="text-xs font-bold text-brand-600 uppercase tracking-widest mb-4">{t('full_name')}</p>
              <div className="mb-2">
                <span className="font-display font-bold text-4xl text-slate-900">{t('full_price')}</span>
              </div>
              <p className="text-sm text-slate-500 mb-1 font-medium">{t('full_period')}</p>
              <p className="text-sm text-slate-500 mb-6 pb-6 border-b border-brand-100">{t('full_desc')}</p>
              <ul className="space-y-3 mb-8">
                {['full_f1', 'full_f2', 'full_f3', 'full_f4', 'full_f5'].map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-slate-700">
                    <CheckCircle2 size={15} className="text-brand-600 mt-0.5 flex-shrink-0" />
                    {t(f)}
                  </li>
                ))}
              </ul>
              <Link href={`${base}/free-evaluation`} className="btn-primary w-full justify-center text-sm">
                {t('cta')} <ArrowRight size={15} />
              </Link>
              <p className="text-xs text-brand-600 text-center mt-3 font-medium">{tp('best_for.full')}</p>
            </div>

            {/* Expert */}
            <div className="card border border-slate-100">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">{t('expert_name')}</p>
              <div className="mb-2">
                <span className="font-display font-bold text-3xl text-slate-900">{t('expert_price')}</span>
              </div>
              <p className="text-sm text-slate-500 mb-1 font-medium">{t('expert_period')}</p>
              <p className="text-sm text-slate-500 mb-6 pb-6 border-b border-slate-100">{t('expert_desc')}</p>
              <ul className="space-y-3 mb-8">
                {['expert_f1', 'expert_f2', 'expert_f3', 'expert_f4'].map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-slate-700">
                    <CheckCircle2 size={15} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                    {t(f)}
                  </li>
                ))}
              </ul>
              <Link href={`${base}/contact`} className="btn-outline text-sm">{t('cta_quote')}</Link>
              <p className="text-xs text-slate-400 text-center mt-3">{tp('best_for.expert')}</p>
            </div>
          </div>

          {/* Note */}
          <div className="mt-10 bg-slate-50 border border-slate-100 rounded-2xl p-6 text-center">
            <p className="text-sm text-slate-600">
              <strong className="text-slate-900">{tp('not_sure.title')}</strong>{' '}
              {tp('not_sure.body')}{' '}
              <Link href={`${base}/free-evaluation`} className="text-brand-600 font-semibold hover:underline">
                {tp('not_sure.link')}
              </Link>
            </p>
          </div>
        </div>
      </section>

      {/* What's included */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="section-title text-3xl">{tp('all_plans.title')}</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { icon: '🔒', title: tp('all_plans.confidential_title'), desc: tp('all_plans.confidential_desc') },
              { icon: '📋', title: tp('all_plans.certified_title'), desc: tp('all_plans.certified_desc') },
              { icon: '⚡', title: tp('all_plans.fast_title'), desc: tp('all_plans.fast_desc') },
              { icon: '🤝', title: tp('all_plans.attorney_title'), desc: tp('all_plans.attorney_desc') },
            ].map((item) => (
              <div key={item.title} className="card text-center">
                <div className="text-3xl mb-3">{item.icon}</div>
                <h3 className="font-display font-bold text-slate-900 text-sm mb-2">{item.title}</h3>
                <p className="text-xs text-slate-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-10 h-10 bg-brand-50 rounded-xl mb-4">
              <HelpCircle size={20} className="text-brand-600" />
            </div>
            <h2 className="section-title text-3xl">{tp('faq.title')}</h2>
          </div>
          <div className="space-y-4">
            {faqs.map((faq) => (
              <div key={faq.q} className="card">
                <h3 className="font-display font-bold text-slate-900 mb-2">{faq.q}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
