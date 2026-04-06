import { useLocale } from 'next-intl';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Heart, CheckCircle2, ArrowRight, AlertTriangle, ChevronRight } from 'lucide-react';
import { makeMetadata } from '@/lib/metadata';



export function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
  return makeMetadata({
    locale,
    path: '/services/romance-scams',
    title: "Romance Scam & Pig Butchering Recovery | LedgerHound",
    description: "Specialized recovery assistance for romance scam and pig butchering victims. We trace cryptocurrency sent to scammers and identify exchange deposit points.",
    keywords: ["romance scam recovery","pig butchering scam","crypto romance scam","pig butchering recovery"],
  });
}

export default function RomanceScamsPage() {
  const locale = useLocale();
  const base = locale === 'en' ? '' : `/${locale}`;

  const scamTypes = [
    { title: 'Pig Butchering (Shā Zhū Pán)', desc: 'Elaborate long-term scam where fraudsters build a relationship over weeks or months, then introduce a "can\'t miss" crypto investment opportunity that eventually drains all your funds.' },
    { title: 'Fake Trading Platforms', desc: 'Victims are directed to professional-looking but fraudulent crypto exchanges where deposits can go in but never come out. We identify the real operators behind these platforms.' },
    { title: 'Dating App Crypto Scams', desc: 'Scammers on Tinder, Hinge, Bumble, and Instagram build romantic connections before introducing cryptocurrency investment opportunities.' },
    { title: 'Celebrity & Influencer Impersonation', desc: 'Fraudsters impersonate Elon Musk, crypto influencers, or financial experts to promote fake giveaways and investment platforms.' },
  ];

  const warningSign = [
    'You met them online and they quickly became very close',
    'They introduced you to a "special" crypto investment opportunity',
    'You made profits at first (to build trust)',
    'You were asked to send more and more money',
    'Now they\'re asking for "taxes" or "fees" to withdraw',
    'Or they\'ve disappeared entirely',
  ];

  const steps = [
    { n: '01', title: 'Stop & Preserve', desc: 'Stop sending money immediately. Preserve all communications — screenshots, emails, chat logs. These are evidence.' },
    { n: '02', title: 'Document Everything', desc: 'Note all wallet addresses, platform names, transaction dates, and amounts. The more detail, the better.' },
    { n: '03', title: 'Get Free Evaluation', desc: 'Contact us for a free 24-hour assessment. We\'ll tell you honestly if your funds are traceable and what evidence we can build.' },
    { n: '04', title: 'Investigation & Report', desc: 'Our certified investigators trace the funds, identify exchanges and entities, and deliver a court-ready forensic report.' },
    { n: '05', title: 'Legal Action', desc: 'Armed with our report, your attorney or law enforcement can pursue freezing orders, exchange subpoenas, and criminal referrals.' },
  ];

  return (
    <div className="min-h-screen">
      <Navbar />

      <div className="pt-24 pb-16 bg-gradient-to-br from-rose-50 to-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
            <Link href={base || '/'} className="hover:text-brand-600">Home</Link>
            <ChevronRight size={14} />
            <Link href={`${base}/services`} className="hover:text-brand-600">Services</Link>
            <ChevronRight size={14} />
            <span className="text-slate-900">Romance Scam Investigations</span>
          </div>
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-rose-50 border border-rose-100 text-rose-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-5">
                <Heart size={12} /> For Victims of Crypto Romance Fraud
              </div>
              <h1 className="font-display font-bold text-4xl lg:text-5xl text-slate-900 leading-tight mb-5">
                Romance Scam<br /><span className="text-brand-600">Investigations</span>
              </h1>
              <p className="text-lg text-slate-600 leading-relaxed mb-6">
                If you've been a victim of a pig butchering scam, fake trading platform, or online romance fraud involving cryptocurrency — your funds left a trail. We find it.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link href={`${base}/free-evaluation`} className="btn-primary">
                  Get Free Case Evaluation <ArrowRight size={16} />
                </Link>
              </div>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle size={18} className="text-amber-600" />
                <h3 className="font-display font-bold text-amber-900">Warning Signs You Were Scammed</h3>
              </div>
              <ul className="space-y-2.5">
                {warningSign.map((sign) => (
                  <li key={sign} className="flex items-start gap-2.5 text-sm text-amber-800">
                    <span className="w-5 h-5 rounded-full bg-amber-200 flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold text-amber-700">✓</span>
                    {sign}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Scam Types */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="section-tag">Types We Investigate</p>
            <h2 className="section-title text-3xl mb-4">Common Crypto Romance Scam Types</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-5">
            {scamTypes.map((type) => (
              <div key={type.title} className="card border-l-4 border-l-brand-400">
                <h3 className="font-display font-bold text-slate-900 mb-2">{type.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{type.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Steps */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="section-tag">What To Do Now</p>
            <h2 className="section-title text-3xl mb-4">Your Next Steps</h2>
          </div>
          <div className="space-y-4">
            {steps.map((step) => (
              <div key={step.n} className="card flex gap-5">
                <div className="w-10 h-10 rounded-xl bg-brand-600 text-white font-display font-bold text-sm flex items-center justify-center flex-shrink-0">
                  {step.n}
                </div>
                <div>
                  <h3 className="font-display font-bold text-slate-900 mb-1">{step.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What we find */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="section-tag">Investigation Output</p>
              <h2 className="section-title text-3xl mb-4">What We Can Uncover</h2>
              <p className="text-slate-600 mb-6">Most romance scam operations have fingerprints all over the blockchain. Our investigators know exactly where to look.</p>
              <ul className="space-y-3">
                {[
                  'Which exchanges received your funds',
                  'Other victims who sent to the same addresses',
                  'The network of wallets used by the scammers',
                  'Geographic indicators from IP metadata',
                  'Connection to known fraud operations',
                  'Which VASPs to subpoena for KYC data',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-slate-700">
                    <CheckCircle2 size={15} className="text-brand-600 mt-0.5 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-brand-50 border border-brand-100 rounded-2xl p-6">
              <h3 className="font-display font-bold text-slate-900 mb-4">Case Example</h3>
              <div className="space-y-3">
                <div className="bg-white rounded-xl p-4">
                  <p className="text-xs text-slate-500 mb-1">Situation</p>
                  <p className="text-sm font-semibold text-slate-800">Victim sent $127,000 to fake trading platform "CryptoAI Pro" over 5 months after meeting someone on LinkedIn.</p>
                </div>
                <div className="bg-white rounded-xl p-4">
                  <p className="text-xs text-slate-500 mb-1">What we found</p>
                  <p className="text-sm font-semibold text-slate-800">Funds traced through 4 chains to 2 KYC exchanges in Asia. Identified 14 other victim wallets in the same cluster.</p>
                </div>
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
                  <p className="text-xs text-emerald-600 mb-1">Result</p>
                  <p className="text-sm font-bold text-emerald-800">Attorney filed international freezing orders. Exchange accounts frozen pending investigation.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-brand-600">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="font-display font-bold text-3xl text-white mb-3">You are not alone. We can help.</h2>
          <p className="text-brand-100 mb-6">Free, confidential case evaluation within 24 hours. Tell us what happened — we'll tell you what's possible.</p>
          <Link href={`${base}/free-evaluation`} className="bg-white text-brand-700 font-bold px-7 py-3.5 rounded-lg hover:bg-brand-50 transition-colors inline-flex items-center gap-2">
            Get Free Evaluation <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
