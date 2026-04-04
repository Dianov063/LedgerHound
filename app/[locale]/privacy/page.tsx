import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useTranslations } from 'next-intl';

export const metadata: Metadata = {
  title: 'Privacy Policy | LedgerHound',
  description:
    'LedgerHound privacy policy. How USPROJECT LLC collects, uses, and protects your information. GDPR and CCPA compliant.',
};

export default function PrivacyPolicyPage() {
  const t = useTranslations('privacy');

  const s1Items = [t('s1_i1'), t('s1_i2'), t('s1_i3'), t('s1_i4')];
  const s2Items = [t('s2_i1'), t('s2_i2'), t('s2_i3'), t('s2_i4'), t('s2_i5'), t('s2_i6')];
  const s4Items = [t('s4_i1'), t('s4_i2'), t('s4_i3'), t('s4_i4')];
  const s6Items = [t('s6_i1'), t('s6_i2'), t('s6_i3'), t('s6_i4'), t('s6_i5'), t('s6_i6')];

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero */}
      <div className="pt-24 pb-12 bg-gradient-to-br from-slate-50 to-white border-b border-slate-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="font-display font-bold text-4xl lg:text-5xl text-slate-900 mb-4">
            {t('title')}
          </h1>
          <p className="text-slate-500 text-sm">{t('effective')}</p>
        </div>
      </div>

      {/* Content */}
      <section className="py-16 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-10 text-slate-600 leading-relaxed">
            {/* Intro */}
            <p>{t('intro')}</p>

            {/* Section 1 */}
            <div>
              <h2 className="font-display font-bold text-xl text-slate-900 mb-3">
                {t('s1_title')}
              </h2>
              <p className="mb-3">{t('s1_p1')}</p>
              <ul className="list-disc pl-6 space-y-1.5 mb-3">
                {s1Items.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
              <p>{t('s1_p2')}</p>
            </div>

            {/* Section 2 */}
            <div>
              <h2 className="font-display font-bold text-xl text-slate-900 mb-3">
                {t('s2_title')}
              </h2>
              <ul className="list-disc pl-6 space-y-1.5">
                {s2Items.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>

            {/* Section 3 */}
            <div>
              <h2 className="font-display font-bold text-xl text-slate-900 mb-3">
                {t('s3_title')}
              </h2>
              <p>{t('s3_p1')}</p>
            </div>

            {/* Section 4 */}
            <div>
              <h2 className="font-display font-bold text-xl text-slate-900 mb-3">
                {t('s4_title')}
              </h2>
              <p className="mb-3">{t('s4_p1')}</p>
              <ul className="list-disc pl-6 space-y-1.5 mb-3">
                {s4Items.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
              <p>{t('s4_p2')}</p>
            </div>

            {/* Section 5 */}
            <div>
              <h2 className="font-display font-bold text-xl text-slate-900 mb-3">
                {t('s5_title')}
              </h2>
              <p>{t('s5_p1')}</p>
            </div>

            {/* Section 6 */}
            <div>
              <h2 className="font-display font-bold text-xl text-slate-900 mb-3">
                {t('s6_title')}
              </h2>
              <p className="mb-3">{t('s6_p1')}</p>
              <ul className="list-disc pl-6 space-y-1.5 mb-3">
                {s6Items.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
              <p>{t('s6_p2')}</p>
            </div>

            {/* Section 7 */}
            <div>
              <h2 className="font-display font-bold text-xl text-slate-900 mb-3">
                {t('s7_title')}
              </h2>
              <p>{t('s7_p1')}</p>
            </div>

            {/* Section 8 */}
            <div>
              <h2 className="font-display font-bold text-xl text-slate-900 mb-3">
                {t('s8_title')}
              </h2>
              <p>{t('s8_p1')}</p>
            </div>

            {/* Section 9 */}
            <div>
              <h2 className="font-display font-bold text-xl text-slate-900 mb-3">
                {t('s9_title')}
              </h2>
              <p>{t('s9_p1')}</p>
            </div>

            {/* Section 10 */}
            <div>
              <h2 className="font-display font-bold text-xl text-slate-900 mb-3">
                {t('s10_title')}
              </h2>
              <p className="mb-3">{t('s10_p1')}</p>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-1.5 text-sm">
                <p className="font-semibold text-slate-900">{t('s10_company')}</p>
                <p>{t('s10_email')}</p>
                <p>{t('s10_phone')}</p>
                <p>{t('s10_address')}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
