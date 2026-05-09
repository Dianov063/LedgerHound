import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Shield, Award, Users, Globe, ArrowRight } from 'lucide-react';
import { makeMetadata } from '@/lib/metadata';



export async function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
  return await makeMetadata({
    locale,
    path: '/about',
    metadataKey: 'about',
});
}

export default function AboutPage() {
  const locale = useLocale();
  const t = useTranslations('about_page');
  const base = locale === 'en' ? '' : `/${locale}`;

  const values = [
    { icon: Shield, title: t('values.integrity_title'), desc: t('values.integrity_desc') },
    { icon: Award, title: t('values.certified_title'), desc: t('values.certified_desc') },
    { icon: Users, title: t('values.client_title'), desc: t('values.client_desc') },
    { icon: Globe, title: t('values.multilingual_title'), desc: t('values.multilingual_desc') },
  ];

  // Acronyms (CTCE/CFE/CCI) and orgs (Chainalysis, ACFE, Blockchain Intelligence Group)
  // are brand/cert codes — kept as literals. Only the full name is translated.
  const certifications = [
    { name: 'CTCE', full: t('credentials.ctce_full'), org: 'Chainalysis' },
    { name: 'CFE', full: t('credentials.cfe_full'), org: 'ACFE' },
    { name: 'CCI', full: t('credentials.cci_full'), org: 'Blockchain Intelligence Group' },
  ];

  // Tool names are brands — kept as literals.
  const tools = ['Chainalysis Reactor', 'TRM Labs Forensics', 'Elliptic Investigator', 'OXT (Bitcoin Analytics)', 'Etherscan Pro', 'Maltego (OSINT)', 'Crystal Blockchain', 'Breadcrumbs'];

  return (
    <div className="min-h-screen">
      <Navbar />

      <div className="pt-32 pb-16 bg-gradient-to-br from-slate-50 to-white border-b border-slate-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="section-tag">{t('hero.tag')}</p>
          <h1 className="font-display font-bold text-4xl lg:text-5xl text-slate-900 mb-5">
            {t('hero.title_line1')}<br /><span className="text-brand-600">{t('hero.title_line2')}</span>
          </h1>
          <p className="text-lg text-slate-600 leading-relaxed max-w-2xl">
            {t('hero.subtitle')}
          </p>
        </div>
      </div>

      {/* Mission */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="section-tag">{t('mission.tag')}</p>
              <h2 className="section-title text-3xl mb-4">{t('mission.title')}</h2>
              <div className="space-y-4 text-slate-600 leading-relaxed">
                <p>{t('mission.p1')}</p>
                <p>{t('mission.p2')}</p>
                <p>{t('mission.p3')}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { num: t('stats.delivery_value'), label: t('stats.delivery_label') },
                { num: t('stats.chains_value'), label: t('stats.chains_label') },
                { num: t('stats.languages_value'), label: t('stats.languages_label') },
                { num: t('stats.court_value'), label: t('stats.court_label') },
              ].map(({ num, label }) => (
                <div key={label} className="card text-center">
                  <div className="font-display font-bold text-3xl text-brand-600 mb-2">{num}</div>
                  <div className="text-sm text-slate-500">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <p className="section-tag">{t('values.tag')}</p>
            <h2 className="section-title text-3xl">{t('values.title')}</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {values.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="card text-center">
                <div className="w-12 h-12 bg-brand-50 border border-brand-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Icon size={22} className="text-brand-600" />
                </div>
                <h3 className="font-display font-bold text-slate-900 mb-2">{title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Certifications */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12">
            <div>
              <p className="section-tag">{t('credentials.tag')}</p>
              <h2 className="section-title text-3xl mb-6">{t('credentials.title')}</h2>
              <div className="space-y-4">
                {certifications.map((cert) => (
                  <div key={cert.name} className="card flex items-center gap-4">
                    <div className="w-14 h-14 bg-brand-600 text-white rounded-xl flex items-center justify-center flex-shrink-0">
                      <span className="font-display font-bold text-xs text-center leading-tight">{cert.name}</span>
                    </div>
                    <div>
                      <p className="font-display font-bold text-slate-900">{cert.full}</p>
                      <p className="text-sm text-slate-500">{t('credentials.issued_by')} {cert.org}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="section-tag">{t('tech.tag')}</p>
              <h2 className="section-title text-3xl mb-6">{t('tech.title')}</h2>
              <div className="grid grid-cols-2 gap-3">
                {tools.map((tool) => (
                  <div key={tool} className="card flex items-center gap-2.5 text-sm text-slate-700">
                    <div className="w-2 h-2 bg-brand-500 rounded-full flex-shrink-0" />
                    {tool}
                  </div>
                ))}
              </div>
              <div className="mt-5 bg-slate-50 border border-slate-100 rounded-xl p-4 text-sm text-slate-600">
                <strong className="text-slate-900">{t('tech.note_label')}</strong> {t('tech.note_text')}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Legal Entity */}
      <section className="py-16 bg-slate-50 border-y border-slate-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <p className="section-tag">{t('corporate.tag')}</p>
            <h2 className="section-title text-3xl">{t('corporate.title')}</h2>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 max-w-2xl mx-auto">
            <div className="grid sm:grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">{t('corporate.company_label')}</p>
                <p className="font-display font-bold text-slate-900">USPROJECT LLC</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">{t('corporate.ein_label')}</p>
                <p className="font-display font-bold text-slate-900">83-3989558</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">{t('corporate.state_label')}</p>
                <p className="font-display font-bold text-slate-900">New York, USA</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">{t('corporate.dos_label')}</p>
                <p className="font-display font-bold text-slate-900">5514622</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">{t('corporate.website_label')}</p>
                <p className="font-display font-bold text-brand-600">ledgerhound.vip</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">{t('corporate.contact_label')}</p>
                <p className="font-display font-bold text-slate-900">contact@ledgerhound.vip</p>
              </div>
            </div>
            <div className="border-t border-slate-100 pt-4">
              <p className="text-sm text-slate-600 leading-relaxed">
                {t('corporate.description')}
              </p>
              <p className="text-xs text-slate-400 mt-3">
                {t('corporate.not_law_firm')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-brand-600">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="font-display font-bold text-3xl text-white mb-4">{t('cta.title')}</h2>
          <p className="text-brand-100 mb-6">{t('cta.subtitle')}</p>
          <Link href={`${base}/free-evaluation`} className="bg-white text-brand-700 font-bold px-7 py-3.5 rounded-lg hover:bg-brand-50 transition-colors inline-flex items-center gap-2">
            {t('cta.button')} <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
