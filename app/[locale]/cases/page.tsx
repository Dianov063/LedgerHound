import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { CheckCircle2, ArrowRight, Shield } from 'lucide-react';

export default function CasesPage() {
  const t = useTranslations('cases');
  const locale = useLocale();
  const base = locale === 'en' ? '' : `/${locale}`;

  const cases = [
    {
      type: 'Romance Scam · New York',
      amount: '$84,000',
      duration: '6 months',
      chains: 4,
      txCount: 47,
      color: 'border-t-blue-500',
      tagColor: 'bg-blue-50 text-blue-700 border-blue-100',
      desc: 'Victim was introduced to a "trading expert" through LinkedIn. Over 6 months, they sent $84,000 to what appeared to be a legitimate trading platform called "CryptoEdge Pro."',
      approach: 'We traced 47 transactions across 4 blockchains (Bitcoin, Ethereum, Tron, BNB). Identified 2 KYC-compliant exchanges in Singapore and Hong Kong that received the majority of funds.',
      result: 'Attorney filed international freezing orders within 72 hours of receiving our report. Exchange accounts were frozen pending formal legal process.',
      outcome: 'Funds Frozen · Legal Action Ongoing',
    },
    {
      type: 'Divorce Proceeding · California',
      amount: '$230,000',
      duration: '3 years',
      chains: 2,
      txCount: 89,
      color: 'border-t-emerald-500',
      tagColor: 'bg-emerald-50 text-emerald-700 border-emerald-100',
      desc: 'During divorce proceedings, a spouse claimed all cryptocurrency holdings had been "lost" in a market crash. The opposing attorney suspected concealment.',
      approach: 'We conducted a comprehensive blockchain analysis and identified 6 previously undisclosed wallets with a combined balance of approximately $230,000. Documented full transfer history and current holdings.',
      result: 'Evidence submitted to family court. The case settled within 30 days of our report being filed, with the assets included in the division.',
      outcome: 'Hidden Assets Identified · Case Settled in Client\'s Favor',
    },
    {
      type: 'Corporate Fraud · Texas',
      amount: '$310,000',
      duration: '18 months',
      chains: 3,
      txCount: 134,
      color: 'border-t-violet-500',
      tagColor: 'bg-violet-50 text-violet-700 border-violet-100',
      desc: 'A CFO discovered that a senior financial employee had been diverting vendor payments to cryptocurrency addresses over 18 months, totaling $310,000.',
      approach: 'We traced 134 transactions across 3 blockchains, establishing a clear chain of custody from corporate accounts to personal wallets and ultimately to cash-out exchanges.',
      result: 'Report submitted to the Dallas County DA\'s office. Criminal charges filed. Civil recovery action commenced in parallel.',
      outcome: 'Criminal Charges Filed · Civil Recovery Underway',
    },
    {
      type: 'Investment Fraud · Florida',
      amount: '$1,200,000',
      duration: '14 months',
      chains: 5,
      txCount: 312,
      color: 'border-t-rose-500',
      tagColor: 'bg-rose-50 text-rose-700 border-rose-100',
      desc: 'A group of 12 investors lost a combined $1.2M to a fraudulent DeFi yield farming scheme. The operator disappeared after promising "guaranteed 40% monthly returns."',
      approach: 'We traced the full flow of funds across 5 chains, identified the operators\' withdrawal patterns, and located funds at 3 major exchanges. OSINT identified real-world entities behind the project.',
      result: 'Multi-jurisdictional legal action supported. Law enforcement in two countries engaged based on our report.',
      outcome: 'Law Enforcement Engaged · Multi-Jurisdictional Action',
    },
    {
      type: 'Ransomware · Healthcare · Ohio',
      amount: '$425,000',
      duration: '1 payment',
      chains: 2,
      txCount: 28,
      color: 'border-t-amber-500',
      tagColor: 'bg-amber-50 text-amber-700 border-amber-100',
      desc: 'A mid-sized healthcare provider paid a $425,000 Bitcoin ransom to restore encrypted systems. They engaged us after recovery to trace where the funds went.',
      approach: 'Traced ransom payment through 28 hops across 2 chains. Identified the mixing service used and attributed portions of funds to a known ransomware operation previously sanctioned by OFAC.',
      result: 'Report submitted to FBI Cyber Division. OFAC sanctions implications identified and reported to compliance counsel.',
      outcome: 'FBI Referral Filed · OFAC Sanctions Investigation',
    },
    {
      type: 'Estate Dispute · Illinois',
      amount: '$340,000',
      duration: '2 years',
      chains: 3,
      txCount: 67,
      color: 'border-t-teal-500',
      tagColor: 'bg-teal-50 text-teal-700 border-teal-100',
      desc: 'A deceased individual\'s estate included approximately $340,000 in cryptocurrency. The executor could not locate wallet credentials and suspected assets had been transferred.',
      approach: 'Working with the estate attorney, we conducted blockchain analysis to identify all addresses associated with the deceased\'s known wallets and trace all outgoing transactions.',
      result: 'Located $340,000 in assets across 3 blockchains. Provided full documentation for probate court proceedings.',
      outcome: 'Assets Located · Probate Proceedings Supported',
    },
  ];

  return (
    <div className="min-h-screen">
      <Navbar />

      <div className="pt-24 pb-12 bg-gradient-to-br from-slate-50 to-white border-b border-slate-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="section-tag">{t('tag')}</p>
          <h1 className="font-display font-bold text-4xl lg:text-5xl text-slate-900 mb-4">
            {t('title').split('\n').map((l, i) => (
              <span key={i}>{l}{i === 0 && <br />}</span>
            ))}
          </h1>
          <p className="text-slate-600 text-lg max-w-xl mx-auto">{t('subtitle')}</p>
          <div className="mt-6 flex justify-center">
            <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold px-4 py-2 rounded-full">
              <Shield size={12} />
              All case details are anonymized to protect client confidentiality
            </div>
          </div>
        </div>
      </div>

      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-6">
            {cases.map((c) => (
              <div key={c.type} className={`card border-t-4 ${c.color}`}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${c.tagColor}`}>{c.type}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-display font-bold text-2xl text-slate-900">{c.amount}</p>
                    <p className="text-xs text-slate-400">involved</p>
                  </div>
                </div>

                <div className="flex gap-4 text-xs text-slate-500 mb-4">
                  <span>{c.chains} chains</span>
                  <span>·</span>
                  <span>{c.txCount} transactions</span>
                  <span>·</span>
                  <span>{c.duration}</span>
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Situation</p>
                    <p className="text-sm text-slate-700 leading-relaxed">{c.desc}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Our Approach</p>
                    <p className="text-sm text-slate-700 leading-relaxed">{c.approach}</p>
                  </div>
                  <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3">
                    <p className="text-xs font-bold text-emerald-600 uppercase tracking-wide mb-1">Result</p>
                    <p className="text-sm text-emerald-800 leading-relaxed">{c.result}</p>
                  </div>
                  <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700">
                    <CheckCircle2 size={14} />
                    {c.outcome}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-brand-600">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="font-display font-bold text-3xl text-white mb-4">Your case could be next.</h2>
          <p className="text-brand-100 mb-6">Start with a free evaluation. We'll tell you honestly what we can do for your specific situation.</p>
          <Link href={`${base}/free-evaluation`} className="bg-white text-brand-700 font-bold px-7 py-3.5 rounded-lg hover:bg-brand-50 transition-colors inline-flex items-center gap-2">
            Get Free Evaluation <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
