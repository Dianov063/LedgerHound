import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useTranslations } from 'next-intl';
import { makeMetadata } from '@/lib/metadata';

export function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
  return makeMetadata({
    locale,
    path: '/terms',
    title: 'Terms of Service | LedgerHound',
    description: 'LedgerHound terms of service. Legal terms governing the use of USPROJECT LLC blockchain forensics services.',
  });
}

export default function TermsPage() {
  const t = useTranslations('terms');

  const s4Items = [t('s4_i1'), t('s4_i2'), t('s4_i3'), t('s4_i4'), t('s4_i5'), t('s4_i6')];

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero */}
      <div className="pt-24 pb-12 bg-gradient-to-br from-slate-50 to-white border-b border-slate-100">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="font-display font-bold text-4xl lg:text-5xl text-slate-900 mb-4">
            {t('title')}
          </h1>
          <p className="text-sm text-slate-500">{t('effective')}</p>
        </div>
      </div>

      {/* Content */}
      <section className="py-16 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-slate-600 leading-relaxed mb-12">{t('intro')}</p>

          {/* Section 1 */}
          <div className="mb-10">
            <h2 className="font-display font-bold text-xl text-slate-900 mb-3">
              1. {t('s1_title')}
            </h2>
            <p className="text-slate-600 leading-relaxed">{t('s1_p1')}</p>
          </div>

          {/* Section 2 */}
          <div className="mb-10">
            <h2 className="font-display font-bold text-xl text-slate-900 mb-3">
              2. {t('s2_title')}
            </h2>
            <p className="text-slate-600 leading-relaxed mb-3">{t('s2_p1')}</p>
            <p className="text-slate-600 leading-relaxed">{t('s2_p2')}</p>
          </div>

          {/* Section 3 */}
          <div className="mb-10">
            <h2 className="font-display font-bold text-xl text-slate-900 mb-3">
              3. {t('s3_title')}
            </h2>
            <p className="text-slate-600 leading-relaxed mb-3">{t('s3_p1')}</p>
            <p className="text-slate-600 leading-relaxed">{t('s3_p2')}</p>
          </div>

          {/* Section 4 */}
          <div className="mb-10">
            <h2 className="font-display font-bold text-xl text-slate-900 mb-3">
              4. {t('s4_title')}
            </h2>
            <p className="text-slate-600 leading-relaxed mb-3">{t('s4_p1')}</p>
            <ul className="list-disc list-inside space-y-1.5 text-slate-600">
              {s4Items.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>

          {/* Section 5 */}
          <div className="mb-10">
            <h2 className="font-display font-bold text-xl text-slate-900 mb-3">
              5. {t('s5_title')}
            </h2>
            <p className="text-slate-600 leading-relaxed">{t('s5_p1')}</p>
          </div>

          {/* Section 6 */}
          <div className="mb-10">
            <h2 className="font-display font-bold text-xl text-slate-900 mb-3">
              6. {t('s6_title')}
            </h2>
            <p className="text-slate-600 leading-relaxed mb-3">{t('s6_p1')}</p>
            <p className="text-slate-600 leading-relaxed">{t('s6_p2')}</p>
          </div>

          {/* Section 7 */}
          <div className="mb-10">
            <h2 className="font-display font-bold text-xl text-slate-900 mb-3">
              7. {t('s7_title')}
            </h2>
            <p className="text-slate-600 leading-relaxed">{t('s7_p1')}</p>
          </div>

          {/* Section 8 */}
          <div className="mb-10">
            <h2 className="font-display font-bold text-xl text-slate-900 mb-3">
              8. {t('s8_title')}
            </h2>
            <p className="text-slate-600 leading-relaxed">{t('s8_p1')}</p>
          </div>

          {/* Section 9 */}
          <div className="mb-10">
            <h2 className="font-display font-bold text-xl text-slate-900 mb-3">
              9. {t('s9_title')}
            </h2>
            <p className="text-slate-600 leading-relaxed">{t('s9_p1')}</p>
          </div>

          {/* Section 10 */}
          <div className="mb-10">
            <h2 className="font-display font-bold text-xl text-slate-900 mb-3">
              10. {t('s10_title')}
            </h2>
            <p className="text-slate-600 leading-relaxed mb-3">{t('s10_p1')}</p>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-1.5">
              <p className="font-semibold text-slate-900">{t('s10_company')}</p>
              <p className="text-slate-600">{t('s10_email')}</p>
              <p className="text-slate-600">{t('s10_phone')}</p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
