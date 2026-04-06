import { useLocale } from 'next-intl';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Users, CheckCircle2, ArrowRight, ChevronRight } from 'lucide-react';
import { makeMetadata } from '@/lib/metadata';



export function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
  return makeMetadata({
    locale,
    path: '/services/divorce-crypto',
    title: "Cryptocurrency in Divorce & Estates | Hidden Crypto Forensics | LedgerHound",
    description: "Expert blockchain forensics for divorce and estate proceedings. We uncover hidden cryptocurrency wallets, trace transfers, and provide court-admissible reports.",
    keywords: ["crypto divorce","hidden cryptocurrency","divorce crypto forensics","estate crypto investigation"],
  });
}

export default function DivorceCryptoPage() {
  const locale = useLocale();
  const base = locale === 'en' ? '' : `/${locale}`;

  const scenarios = [
    { title: 'Hidden Wallet Discovery', desc: 'Your spouse claims they have no crypto, or that it was lost. We analyze the blockchain to find wallets linked to their known addresses.' },
    { title: 'Asset Valuation', desc: 'We identify all cryptocurrency holdings — including staking rewards, DeFi positions, and NFTs — and document their value for court.' },
    { title: 'Transfer Tracing', desc: 'Did your spouse move funds before or during proceedings? We trace transfers and establish when and where assets were moved.' },
    { title: 'Historical Documentation', desc: 'We compile a complete, chronological record of all cryptocurrency activity — essential for establishing the marital estate.' },
  ];

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="pt-24 pb-16 bg-gradient-to-br from-slate-50 to-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
            <Link href={base || '/'} className="hover:text-brand-600">Home</Link>
            <ChevronRight size={14} />
            <Link href={`${base}/services`} className="hover:text-brand-600">Services</Link>
            <ChevronRight size={14} />
            <span>Divorce & Crypto</span>
          </div>
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-violet-50 border border-violet-100 text-violet-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-5">
              <Users size={12} /> Family Law · Probate & Estates
            </div>
            <h1 className="font-display font-bold text-4xl lg:text-5xl text-slate-900 leading-tight mb-5">
              Cryptocurrency in<br /><span className="text-brand-600">Divorce & Estates</span>
            </h1>
            <p className="text-lg text-slate-600 leading-relaxed mb-6">
              Hidden crypto assets are increasingly common in divorce proceedings and estate disputes. Our blockchain forensics uncover what your spouse or beneficiary claims doesn't exist.
            </p>
            <Link href={`${base}/free-evaluation`} className="btn-primary">Start Free Evaluation <ArrowRight size={16} /></Link>
          </div>
        </div>
      </div>

      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="section-tag">How We Help</p>
            <h2 className="section-title text-3xl mb-4">Forensic Crypto Analysis for Family Law</h2>
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
          <h2 className="section-title text-3xl mb-6 text-center">What We Deliver to Attorneys</h2>
          <ul className="space-y-3">
            {[
              'Court-admissible forensic report with methodology documentation',
              'Complete list of identified cryptocurrency addresses and balances',
              'Transaction history with timestamps and USD values at time of transfer',
              'Expert witness availability for depositions and trial',
              'Ongoing collaboration with your legal team throughout proceedings',
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
          <h2 className="font-display font-bold text-3xl text-white mb-4">Working on a divorce or estate case?</h2>
          <p className="text-brand-100 mb-6">Attorney inquiries welcome. We respond within 24 hours and offer volume pricing for law firms.</p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link href={`${base}/free-evaluation`} className="bg-white text-brand-700 font-bold px-6 py-3 rounded-lg hover:bg-brand-50 transition-colors">
              Free Evaluation
            </Link>
            <Link href={`${base}/contact`} className="border border-white/30 text-white font-semibold px-6 py-3 rounded-lg hover:bg-white/10 transition-colors">
              Attorney Inquiry
            </Link>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
