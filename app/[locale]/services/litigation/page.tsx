import { useLocale } from 'next-intl';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Scale, CheckCircle2, ArrowRight, ChevronRight, FileText } from 'lucide-react';
import { makeMetadata } from '@/lib/metadata';



export function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
  return makeMetadata({
    locale,
    path: '/services/litigation',
    title: "Litigation Support & Expert Witness | Blockchain Forensics | LedgerHound",
    description: "Court-ready blockchain forensic reports and expert witness testimony. We support attorneys with cryptocurrency evidence for civil and criminal litigation.",
    keywords: ["crypto expert witness","blockchain litigation support","court ready crypto report"],
  });
}

export default function LitigationPage() {
  const locale = useLocale();
  const base = locale === 'en' ? '' : `/${locale}`;

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="pt-28 pb-16 bg-gradient-to-br from-slate-50 to-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
            <Link href={base || '/'} className="hover:text-brand-600">Home</Link>
            <ChevronRight size={14} />
            <Link href={`${base}/services`} className="hover:text-brand-600">Services</Link>
            <ChevronRight size={14} />
            <span>Litigation Support</span>
          </div>
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-brand-50 border border-brand-100 text-brand-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-5">
                <Scale size={12} /> For Attorneys & Legal Teams
              </div>
              <h1 className="font-display font-bold text-4xl lg:text-5xl text-slate-900 leading-tight mb-5">
                Litigation<br /><span className="text-brand-600">Support</span>
              </h1>
              <p className="text-lg text-slate-600 leading-relaxed mb-6">
                Court-ready blockchain forensic reports, expert witness services, and direct collaboration with your legal team — from discovery through trial.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link href={`${base}/contact`} className="btn-primary">Attorney Inquiry <ArrowRight size={16} /></Link>
                <Link href={`${base}/free-evaluation`} className="btn-secondary">Submit a Case</Link>
              </div>
            </div>
            <div className="space-y-3">
              {[
                { icon: FileText, title: 'Expert Witness Reports', desc: 'Forensic reports structured to meet federal and state evidentiary standards.' },
                { icon: Scale, title: 'Deposition Support', desc: 'We prepare and attend depositions, explaining technical blockchain concepts in plain language.' },
                { icon: CheckCircle2, title: 'Court Testimony', desc: 'Certified investigators available to testify as expert witnesses in civil and criminal proceedings.' },
              ].map(({ icon: Icon, title, desc }) => (
                <div key={title} className="card flex gap-4">
                  <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Icon size={18} className="text-brand-600" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-slate-900 text-sm mb-1">{title}</h3>
                    <p className="text-sm text-slate-600">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12">
            <div>
              <h2 className="section-title text-3xl mb-5">Practice Areas We Support</h2>
              <ul className="space-y-2.5">
                {[
                  'Cryptocurrency fraud — civil and criminal',
                  'Divorce and family law with digital assets',
                  'Probate and estate disputes',
                  'Business disputes involving crypto payments',
                  'Bankruptcy proceedings with crypto assets',
                  'Regulatory enforcement and SEC/CFTC matters',
                  'RICO and money laundering cases',
                  'International asset recovery',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2.5 text-sm text-slate-700">
                    <CheckCircle2 size={14} className="text-brand-600 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className="section-title text-3xl mb-5">Why Attorneys Choose Us</h2>
              <div className="space-y-4">
                {[
                  { title: 'Clear, Plain-Language Reports', desc: 'Our reports explain complex blockchain concepts in language that judges and juries can understand.' },
                  { title: 'Litigation-Ready from Day One', desc: 'Every report includes methodology documentation, tool citations, and investigator credentials — what courts require.' },
                  { title: 'Collaborative Approach', desc: 'We work alongside your team from initial discovery through trial preparation, available for calls and consultations.' },
                  { title: 'Volume Pricing Available', desc: 'Law firms and litigation support companies with ongoing caseloads can discuss preferred partner arrangements.' },
                ].map((item) => (
                  <div key={item.title} className="card">
                    <h3 className="font-display font-bold text-slate-900 text-sm mb-1">{item.title}</h3>
                    <p className="text-sm text-slate-600">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-brand-600">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="font-display font-bold text-3xl text-white mb-4">Working on a crypto case?</h2>
          <p className="text-brand-100 mb-6">Attorney inquiries receive priority response. We're available for preliminary case discussions at no charge.</p>
          <Link href={`${base}/contact`} className="bg-white text-brand-700 font-bold px-7 py-3.5 rounded-lg hover:bg-brand-50 transition-colors inline-flex items-center gap-2">
            Contact Our Team <ArrowRight size={16} />
          </Link>
        </div>
      </section>
      <Footer />
    </div>
  );
}
