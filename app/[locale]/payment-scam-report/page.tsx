import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import {
  AlertTriangle,
  ArrowRight,
  Banknote,
  CheckCircle2,
  Database,
  FileText,
  Lock,
  Search,
  ShieldCheck,
} from 'lucide-react';

const paymentMethods = [
  'zelle',
  'cashapp',
  'venmo',
  'paypal',
  'apple_cash',
  'chime',
  'wise_revolut',
  'bank',
  'contact',
  'profiles',
  'telegram',
  'local',
];

const scamTypes = ['goods', 'services', 'rental', 'tickets', 'marketplace', 'employment', 'custom'];

const scenarioPages = [
  ['telegram-payment-scams', 'telegram'],
  ['marketplace-payment-scam', 'marketplace'],
  ['ticket-payment-scam', 'tickets'],
  ['goods-not-delivered-payment-scam', 'goods'],
  ['fake-local-service-scam', 'local'],
];

export default function PaymentScamReportSeoPage() {
  const locale = useLocale();
  const t = useTranslations('payment_scam_report');
  const base = locale === 'en' ? '' : `/${locale}`;
  const toolHref = `${base}/payment-safety`;

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: t('faq.noncrypto_q'),
        acceptedAnswer: {
          '@type': 'Answer',
          text: t('faq.noncrypto_a'),
        },
      },
      {
        '@type': 'Question',
        name: t('faq.public_q'),
        acceptedAnswer: {
          '@type': 'Answer',
          text: t('faq.public_a'),
        },
      },
      {
        '@type': 'Question',
        name: t('faq.check_q'),
        acceptedAnswer: {
          '@type': 'Answer',
          text: t('faq.check_a'),
        },
      },
    ],
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <main className="pt-32">
        <section className="border-b border-slate-200 bg-slate-50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
            <div className="grid lg:grid-cols-[1fr_23rem] gap-10 items-start">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700 mb-5">
                  <AlertTriangle size={13} />
                  {t('eyebrow')}
                </div>
                <h1 className="font-display font-bold text-4xl lg:text-5xl text-slate-950 leading-tight mb-5">
                  {t('title')}
                </h1>
                <p className="text-lg text-slate-600 max-w-3xl leading-relaxed mb-7">
                  {t('intro')}
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link href={toolHref} className="btn-primary justify-center px-5 py-3">
                    <FileText size={17} />
                    {t('cta_report')}
                    <ArrowRight size={17} />
                  </Link>
                  <Link
                    href={`${toolHref}?mode=check`}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700 hover:border-brand-300 hover:text-brand-700 transition-colors"
                  >
                    <Search size={17} />
                    {t('cta_check')}
                  </Link>
                </div>
              </div>

              <aside className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <Lock size={18} className="text-emerald-600" />
                  <h2 className="font-display font-bold text-lg text-slate-950">{t('privacy_title')}</h2>
                </div>
                <div className="space-y-3 text-sm text-slate-600">
                  <p>{t('privacy_one')}</p>
                  <p>{t('privacy_multiple')}</p>
                  <p>{t('privacy_masked')}</p>
                </div>
              </aside>
            </div>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid lg:grid-cols-2 gap-10">
            <div>
              <div className="flex items-center gap-3 mb-5">
                <Banknote size={22} className="text-brand-600" />
                <h2 className="font-display font-bold text-2xl text-slate-950">{t('methods_title')}</h2>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                {paymentMethods.map((method) => (
                  <div key={method} className="flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                    <CheckCircle2 size={15} className="text-emerald-600 mt-0.5 shrink-0" />
                    <span>{t(`methods.${method}`)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-3 mb-5">
                <Database size={22} className="text-brand-600" />
                <h2 className="font-display font-bold text-2xl text-slate-950">{t('types_title')}</h2>
              </div>
              <div className="space-y-3">
                {scamTypes.map((type) => (
                  <div key={type} className="flex items-start gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
                    <ShieldCheck size={15} className="text-brand-600 mt-0.5 shrink-0" />
                    <span>{t(`types.${type}`)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-slate-200 bg-slate-950 text-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="grid md:grid-cols-3 gap-8">
              <div>
                <p className="text-sm font-bold text-emerald-400 mb-2">{t('step1_title')}</p>
                <p className="text-sm text-slate-300 leading-relaxed">
                  {t('step1_text')}
                </p>
              </div>
              <div>
                <p className="text-sm font-bold text-emerald-400 mb-2">{t('step2_title')}</p>
                <p className="text-sm text-slate-300 leading-relaxed">
                  {t('step2_text')}
                </p>
              </div>
              <div>
                <p className="text-sm font-bold text-emerald-400 mb-2">{t('step3_title')}</p>
                <p className="text-sm text-slate-300 leading-relaxed">
                  {t('step3_text')}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h2 className="font-display font-bold text-2xl text-slate-950 mb-4">
            {t('why_title')}
          </h2>
          <div className="space-y-4 text-slate-600 leading-relaxed">
            <p>
              {t('why_p1')}
            </p>
            <p>
              {t('why_p2')}
            </p>
          </div>

          <div className="mt-8 rounded-xl border border-brand-200 bg-brand-50 p-6">
            <h3 className="font-display font-bold text-xl text-slate-950 mb-2">
              {t('ready_title')}
            </h3>
            <p className="text-sm text-slate-600 mb-5">
              {t('ready_text')}
            </p>
            <Link href={toolHref} className="btn-primary inline-flex">
              {t('ready_cta')}
              <ArrowRight size={17} />
            </Link>
          </div>

          <div className="mt-10 border-t border-slate-200 pt-8">
            <h2 className="font-display font-bold text-2xl text-slate-950 mb-4">{t('situations_title')}</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {scenarioPages.map(([slug, key]) => (
                <Link key={slug} href={`${base}/payment-scam/${slug}`} className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 hover:border-brand-300 hover:text-brand-700">
                  {t(`situations.${key}`)}<ArrowRight size={16} />
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
