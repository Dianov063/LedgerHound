import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Users, CheckCircle2, ArrowRight, ChevronRight } from 'lucide-react';
import { makeMetadata } from '@/lib/metadata';



export async function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
  return await makeMetadata({
    locale,
    path: '/services/divorce-crypto',
    metadataKey: 'services.divorceCrypto',
});
}

export default function DivorceCryptoPage() {
  const locale = useLocale();
  const t = useTranslations('services_divorce_page');
  const base = locale === 'en' ? '' : `/${locale}`;

  const scenarios = [
    { title: t('scenarios.hidden_title'), desc: t('scenarios.hidden_desc') },
    { title: t('scenarios.valuation_title'), desc: t('scenarios.valuation_desc') },
    { title: t('scenarios.transfer_title'), desc: t('scenarios.transfer_desc') },
    { title: t('scenarios.historical_title'), desc: t('scenarios.historical_desc') },
  ];

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="pt-32 pb-16 bg-gradient-to-br from-slate-50 to-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
            <Link href={base || '/'} className="hover:text-brand-600">{t('breadcrumb.home')}</Link>
            <ChevronRight size={14} />
            <Link href={`${base}/services`} className="hover:text-brand-600">{t('breadcrumb.services')}</Link>
            <ChevronRight size={14} />
            <span>{t('breadcrumb.current')}</span>
          </div>
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-violet-50 border border-violet-100 text-violet-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-5">
              <Users size={12} /> {t('hero.badge')}
            </div>
            <h1 className="font-display font-bold text-4xl lg:text-5xl text-slate-900 leading-tight mb-5">
              {t('hero.title_line1')}<br /><span className="text-brand-600">{t('hero.title_line2')}</span>
            </h1>
            <p className="text-lg text-slate-600 leading-relaxed mb-6">
              {t('hero.subtitle')}
            </p>
            <Link href={`${base}/free-evaluation`} className="btn-primary">{t('hero.cta')} <ArrowRight size={16} /></Link>
          </div>
        </div>
      </div>

      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="section-tag">{t('scenarios.tag')}</p>
            <h2 className="section-title text-3xl mb-4">{t('scenarios.title')}</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-5">
            {scenarios.map((s) => (
              <div key={s.title} className="card border-l-4 border-l-violet-400">
                <h3 className="font-display font-bold text-slate-900 mb-2">{s.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-slate-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="section-title text-3xl mb-6 text-center">{t('deliverables.title')}</h2>
          <ul className="space-y-3">
            {[
              t('deliverables.item1'),
              t('deliverables.item2'),
              t('deliverables.item3'),
              t('deliverables.item4'),
              t('deliverables.item5'),
            ].map((item) => (
              <li key={item} className="card flex items-start gap-3 text-sm text-slate-700">
                <CheckCircle2 size={15} className="text-brand-600 mt-0.5 flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="py-16 bg-brand-600">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="font-display font-bold text-3xl text-white mb-4">{t('cta.title')}</h2>
          <p className="text-brand-100 mb-6">{t('cta.subtitle')}</p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link href={`${base}/free-evaluation`} className="bg-white text-brand-700 font-bold px-6 py-3 rounded-lg hover:bg-brand-50 transition-colors">
              {t('cta.button_evaluation')}
            </Link>
            <Link href={`${base}/contact`} className="border border-white/30 text-white font-semibold px-6 py-3 rounded-lg hover:bg-white/10 transition-colors">
              {t('cta.button_attorney')}
            </Link>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
