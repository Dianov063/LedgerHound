import { useTranslations } from 'next-intl';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { makeMetadata } from '@/lib/metadata';

export function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
  return makeMetadata({
    locale,
    path: '/disclaimer',
    title: 'Legal Disclaimer | LedgerHound',
    description: 'Legal disclaimer for LedgerHound blockchain forensics services by USPROJECT LLC. Not a law firm. No guarantee of recovery.',
  });
}

export default function DisclaimerPage() {
  const t = useTranslations('disclaimer');

  const s4Items = [
    t('s4_i1'),
    t('s4_i2'),
    t('s4_i3'),
    t('s4_i4'),
  ];

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero */}
      <div className="pt-24 pb-12 bg-gradient-to-br from-slate-50 to-white border-b border-slate-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="font-display font-bold text-4xl lg:text-5xl text-slate-900 mb-3">
            {t('title')}
          </h1>
          <p className="text-slate-500 text-sm">{t('effective')}</p>
        </div>
      </div>

      {/* Content */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 prose prose-slate max-w-none">
          {/* Section 1 */}
          <h2 className="font-display font-bold text-xl text-slate-900 mt-0 mb-3">
            {t('s1_title')}
          </h2>
          <p className="text-slate-600 leading-relaxed mb-8">{t('s1_p1')}</p>

          {/* Section 2 */}
          <h2 className="font-display font-bold text-xl text-slate-900 mb-3">
            {t('s2_title')}
          </h2>
          <p className="text-slate-600 leading-relaxed mb-8">{t('s2_p1')}</p>

          {/* Section 3 */}
          <h2 className="font-display font-bold text-xl text-slate-900 mb-3">
            {t('s3_title')}
          </h2>
          <p className="text-slate-600 leading-relaxed">{t('s3_p1')}</p>
          <p className="text-slate-600 leading-relaxed mb-8">{t('s3_p2')}</p>

          {/* Section 4 */}
          <h2 className="font-display font-bold text-xl text-slate-900 mb-3">
            {t('s4_title')}
          </h2>
          <p className="text-slate-600 leading-relaxed">{t('s4_p1')}</p>
          <ul className="list-disc pl-6 mb-4 space-y-1">
            {s4Items.map((item, i) => (
              <li key={i} className="text-slate-600">
                {item}
              </li>
            ))}
          </ul>
          <p className="text-slate-600 leading-relaxed mb-8">{t('s4_p2')}</p>

          {/* Section 5 */}
          <h2 className="font-display font-bold text-xl text-slate-900 mb-3">
            {t('s5_title')}
          </h2>
          <p className="text-slate-600 leading-relaxed mb-8">{t('s5_p1')}</p>

          {/* Section 6 */}
          <h2 className="font-display font-bold text-xl text-slate-900 mb-3">
            {t('s6_title')}
          </h2>
          <p className="text-slate-600 leading-relaxed mb-8">{t('s6_p1')}</p>

          {/* Section 7 */}
          <h2 className="font-display font-bold text-xl text-slate-900 mb-3">
            {t('s7_title')}
          </h2>
          <p className="text-slate-600 leading-relaxed mb-8">{t('s7_p1')}</p>

          {/* Section 8 - Contact */}
          <h2 className="font-display font-bold text-xl text-slate-900 mb-3">
            {t('s8_title')}
          </h2>
          <p className="text-slate-600 leading-relaxed mb-2">{t('s8_p1')}</p>
          <div className="text-slate-600 space-y-1">
            <p className="font-semibold">{t('s8_company')}</p>
            <p>
              <a
                href={`mailto:${t('s8_email')}`}
                className="text-brand-600 hover:text-brand-700 underline"
              >
                {t('s8_email')}
              </a>
            </p>
            <p>{t('s8_phone')}</p>
            <p>{t('s8_address')}</p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
