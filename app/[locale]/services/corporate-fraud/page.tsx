import { useLocale } from 'next-intl';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Building2, CheckCircle2, ArrowRight, ChevronRight } from 'lucide-react';
import { makeMetadata } from '@/lib/metadata';



export function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
  return makeMetadata({
    locale,
    path: '/services/corporate-fraud',
    title: "Corporate Crypto Fraud Investigation | LedgerHound",
    description: "Enterprise-grade blockchain forensics for corporate fraud, embezzlement, insider threats, and cryptocurrency theft investigation.",
    keywords: ["corporate crypto fraud","blockchain investigation corporate","crypto embezzlement"],
  });
}

export default function CorporateFraudPage() {
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
            <span>Corporate Fraud</span>
          </div>
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-100 text-amber-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-5">
              <Building2 size={12} /> For Businesses & Organizations
            </div>
            <h1 className="font-display font-bold text-4xl lg:text-5xl text-slate-900 leading-tight mb-5">
              Corporate &<br /><span className="text-brand-600">Business Fraud</span>
            </h1>
            <p className="text-lg text-slate-600 leading-relaxed mb-6">
              Employee theft, investment fraud, and ransomware payments via cryptocurrency leave forensic trails. We trace them and build evidence for criminal prosecution and civil recovery.
            </p>
            <Link href={`${base}/free-evaluation`} className="btn-primary">Get Case Assessment <ArrowRight size={16} /></Link>
          </div>
        </div>
      </div>

      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-5 mb-12">
            {[
              { title: 'Employee Theft', desc: 'An employee diverting company funds to crypto wallets. We trace the complete path and establish the chain of custody for prosecution.' },
              { title: 'Ransomware Payments', desc: 'After paying ransomware attackers, we trace where funds went — often identifying OFAC-sanctioned entities with significant legal implications.' },
              { title: 'Investment Fraud', desc: 'Crypto investment schemes targeting your organization or employees. We identify operators and exchange interactions for legal action.' },
            ].map((item) => (
              <div key={item.title} className="card border-l-4 border-l-amber-400">
                <h3 className="font-display font-bold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 sm:p-8">
            <h2 className="section-title text-2xl mb-5">What We Deliver</h2>
            <div className="grid md:grid-cols-2 gap-3">
              {[
                'Complete transaction history with timestamps',
                'Chain-of-custody documentation for court',
                'Exchange and VASP identification',
                'OFAC sanctions screening',
                'Criminal referral package preparation',
                'Civil recovery evidence package',
                'Expert witness support',
                'Ongoing investigation updates',
              ].map((item) => (
                <div key={item} className="flex items-center gap-2.5 text-sm text-slate-700">
                  <CheckCircle2 size={14} className="text-brand-600 flex-shrink-0" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-brand-600">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="font-display font-bold text-3xl text-white mb-4">Suspect crypto fraud in your organization?</h2>
          <p className="text-brand-100 mb-6">Confidential assessment within 24 hours. We work with your legal and compliance teams.</p>
          <Link href={`${base}/free-evaluation`} className="bg-white text-brand-700 font-bold px-7 py-3.5 rounded-lg hover:bg-brand-50 transition-colors inline-flex items-center gap-2">
            Get Confidential Assessment <ArrowRight size={16} />
          </Link>
        </div>
      </section>
      <Footer />
    </div>
  );
}
