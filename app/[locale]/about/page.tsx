import { useLocale } from 'next-intl';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Shield, Award, Users, Globe, ArrowRight } from 'lucide-react';
import { makeMetadata } from '@/lib/metadata';



export function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
  return makeMetadata({
    locale,
    path: '/about',
    title: "About LedgerHound | Blockchain Forensics Experts",
    description: "Meet the certified blockchain forensics team at LedgerHound. Years of experience tracing stolen cryptocurrency across Bitcoin, Ethereum, TRON, and 10+ networks.",
    keywords: ["about ledgerhound","blockchain forensics team","crypto investigators"],
  });
}

export default function AboutPage() {
  const locale = useLocale();
  const base = locale === 'en' ? '' : `/${locale}`;

  const values = [
    { icon: Shield, title: 'Integrity First', desc: 'We provide honest assessments. If we can\'t help, we say so — upfront, before you spend a dollar.' },
    { icon: Award, title: 'Certified Excellence', desc: 'Every investigation is led by CTCE and CFE certified professionals using industry-standard tools.' },
    { icon: Users, title: 'Client-Centered', desc: 'We explain everything in plain language. No jargon, no mystery — just clear communication throughout.' },
    { icon: Globe, title: 'Multilingual Team', desc: 'We serve clients in English, Russian, Spanish, Chinese, French, and Arabic — no translators needed.' },
  ];

  const certifications = [
    { name: 'CTCE', full: 'Cryptocurrency Tracing Certified Examiner', org: 'Chainalysis' },
    { name: 'CFE', full: 'Certified Fraud Examiner', org: 'ACFE' },
    { name: 'CCI', full: 'Certified Cryptocurrency Investigator', org: 'Blockchain Intelligence Group' },
  ];

  const tools = ['Chainalysis Reactor', 'TRM Labs Forensics', 'Elliptic Investigator', 'OXT (Bitcoin Analytics)', 'Etherscan Pro', 'Maltego (OSINT)', 'Crystal Blockchain', 'Breadcrumbs'];

  return (
    <div className="min-h-screen">
      <Navbar />

      <div className="pt-24 pb-16 bg-gradient-to-br from-slate-50 to-white border-b border-slate-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="section-tag">About LedgerHound</p>
          <h1 className="font-display font-bold text-4xl lg:text-5xl text-slate-900 mb-5">
            Certified Investigators.<br /><span className="text-brand-600">Real Results.</span>
          </h1>
          <p className="text-lg text-slate-600 leading-relaxed max-w-2xl">
            LedgerHound is a blockchain forensics firm bringing certified investigation capabilities to fraud victims, attorneys, and businesses who need to trace, document, and act on misappropriated cryptocurrency.
          </p>
        </div>
      </div>

      {/* Mission */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="section-tag">Our Mission</p>
              <h2 className="section-title text-3xl mb-4">Why We Built LedgerHound</h2>
              <div className="space-y-4 text-slate-600 leading-relaxed">
                <p>Cryptocurrency fraud costs victims billions every year. Yet most people who lose funds have nowhere to turn — law enforcement is overwhelmed, existing firms are expensive and opaque, and victims often don't know where to start.</p>
                <p>We built LedgerHound to change that. We believe every victim deserves honest answers: Can my funds be traced? What evidence can we build? What will it cost? What are the realistic outcomes?</p>
                <p>Our team combines blockchain forensics expertise with a commitment to transparency — publishing our prices, providing free evaluations, and serving clients in six languages including Russian, the native language of a large segment of crypto fraud victims in the US.</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { num: '48h', label: 'Average report delivery' },
                { num: '10+', label: 'Blockchains covered' },
                { num: '6', label: 'Languages served' },
                { num: '100%', label: 'Court-ready reports' },
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
            <p className="section-tag">Our Values</p>
            <h2 className="section-title text-3xl">How We Work</h2>
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
              <p className="section-tag">Credentials</p>
              <h2 className="section-title text-3xl mb-6">Certifications We Hold</h2>
              <div className="space-y-4">
                {certifications.map((cert) => (
                  <div key={cert.name} className="card flex items-center gap-4">
                    <div className="w-14 h-14 bg-brand-600 text-white rounded-xl flex items-center justify-center flex-shrink-0">
                      <span className="font-display font-bold text-xs text-center leading-tight">{cert.name}</span>
                    </div>
                    <div>
                      <p className="font-display font-bold text-slate-900">{cert.full}</p>
                      <p className="text-sm text-slate-500">Issued by {cert.org}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="section-tag">Technology</p>
              <h2 className="section-title text-3xl mb-6">Tools We Use</h2>
              <div className="grid grid-cols-2 gap-3">
                {tools.map((tool) => (
                  <div key={tool} className="card flex items-center gap-2.5 text-sm text-slate-700">
                    <div className="w-2 h-2 bg-brand-500 rounded-full flex-shrink-0" />
                    {tool}
                  </div>
                ))}
              </div>
              <div className="mt-5 bg-slate-50 border border-slate-100 rounded-xl p-4 text-sm text-slate-600">
                <strong className="text-slate-900">Note:</strong> We use industry-standard professional tools. Our reports are generated using court-admissible blockchain intelligence data — not free consumer tools.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Legal Entity */}
      <section className="py-16 bg-slate-50 border-y border-slate-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <p className="section-tag">Legal Entity</p>
            <h2 className="section-title text-3xl">Corporate Information</h2>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 max-w-2xl mx-auto">
            <div className="grid sm:grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Company</p>
                <p className="font-display font-bold text-slate-900">USPROJECT LLC</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">EIN</p>
                <p className="font-display font-bold text-slate-900">83-3989558</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">State of Formation</p>
                <p className="font-display font-bold text-slate-900">New York, USA</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">DOS ID</p>
                <p className="font-display font-bold text-slate-900">5514622</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Website</p>
                <p className="font-display font-bold text-brand-600">ledgerhound.vip</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Contact</p>
                <p className="font-display font-bold text-slate-900">contact@ledgerhound.vip</p>
              </div>
            </div>
            <div className="border-t border-slate-100 pt-4">
              <p className="text-sm text-slate-600 leading-relaxed">
                LedgerHound is a registered brand operating under USPROJECT LLC, a New York limited liability company. All forensic investigations are conducted by certified professionals operating under applicable US law and professional standards.
              </p>
              <p className="text-xs text-slate-400 mt-3">
                Not a law firm. We do not provide legal advice. Forensic investigation services only.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-brand-600">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="font-display font-bold text-3xl text-white mb-4">Ready to work with us?</h2>
          <p className="text-brand-100 mb-6">Start with a free, confidential case evaluation. We respond within 24 hours.</p>
          <Link href={`${base}/free-evaluation`} className="bg-white text-brand-700 font-bold px-7 py-3.5 rounded-lg hover:bg-brand-50 transition-colors inline-flex items-center gap-2">
            Get Free Evaluation <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
