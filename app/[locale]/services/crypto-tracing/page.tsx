import { useLocale } from 'next-intl';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Search, CheckCircle2, ArrowRight, Shield, Clock, FileText, ChevronRight } from 'lucide-react';
import { makeMetadata } from '@/lib/metadata';



export function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
  return makeMetadata({
    locale,
    path: '/services/crypto-tracing',
    title: "Cryptocurrency Tracing Service | Trace Stolen Crypto | LedgerHound",
    description: "Professional cryptocurrency tracing across Bitcoin, Ethereum, TRON, and 10+ blockchains. We trace stolen funds to exchange deposit addresses for legal recovery.",
    keywords: ["crypto tracing","trace stolen crypto","cryptocurrency investigation","bitcoin tracing"],
  });
}

export default function CryptoTracingPage() {
  const locale = useLocale();
  const base = locale === 'en' ? '' : `/${locale}`;

  const chains = ['Bitcoin (BTC)', 'Ethereum (ETH)', 'Tron (TRX)', 'BNB Chain', 'Solana (SOL)', 'Polygon (MATIC)', 'Litecoin (LTC)', 'Avalanche (AVAX)', 'Arbitrum', 'Optimism', 'DeFi Protocols', 'NFT Platforms'];

  const techniques = [
    { title: 'Transaction Mapping', desc: 'Every transaction involving your funds is documented and visualized as a clear flow diagram — showing exactly where money moved and when.' },
    { title: 'Cluster Analysis', desc: 'We identify groups of wallet addresses controlled by the same person or entity, dramatically expanding the available evidence.' },
    { title: 'Exchange Attribution', desc: 'Using blockchain intelligence tools, we identify when funds reached a KYC-compliant exchange — creating a path to real-world identity.' },
    { title: 'IP & Metadata Analysis', desc: 'In some cases, blockchain surveillance systems can capture IP addresses associated with transactions, providing geographic location data.' },
    { title: 'Mixer & Tumbler Analysis', desc: 'We use specialized demixing techniques to trace funds even through privacy-enhancing services like mixers and CoinJoin.' },
    { title: 'Subpoena Targeting', desc: 'We identify the specific exchanges and VASPs that should receive legal process — giving your attorney the highest chance of success.' },
  ];

  const faqs = [
    { q: 'Can all stolen cryptocurrency be traced?', a: 'Most major cryptocurrencies (Bitcoin, Ethereum, etc.) are fully traceable. Privacy coins like Monero are more difficult but not impossible. In most cases a single wallet address or transaction hash is enough to begin.' },
    { q: 'How long does a crypto tracing investigation take?', a: 'A Basic Trace report is delivered within 48 hours. More complex multi-chain investigations typically take 3–5 business days for the Full Investigation package.' },
    { q: 'What do I need to get started?', a: 'In most cases a single wallet address or transaction ID is enough to start. Additional information like scammer names, platform names, or dates of transactions helps us move faster.' },
    { q: 'Is blockchain forensic evidence admissible in court?', a: 'Yes. When properly documented by certified investigators, blockchain evidence meets the evidentiary standards of US federal and state courts. Our reports are specifically structured for legal use.' },
    { q: 'Will tracing my crypto guarantee recovery?', a: 'Tracing identifies where your funds went and who received them. Actual recovery depends on legal action — freezing orders, law enforcement involvement, or civil litigation. We provide the evidence; legal counsel takes the action.' },
  ];

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero */}
      <div className="pt-28 pb-16 bg-gradient-to-br from-slate-50 to-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
            <Link href={base || '/'} className="hover:text-brand-600">Home</Link>
            <ChevronRight size={14} />
            <Link href={`${base}/services`} className="hover:text-brand-600">Services</Link>
            <ChevronRight size={14} />
            <span className="text-slate-900">Crypto Asset Tracing</span>
          </div>
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-brand-50 border border-brand-100 text-brand-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-5">
                <Search size={12} /> Most Popular Service
              </div>
              <h1 className="font-display font-bold text-4xl lg:text-5xl text-slate-900 leading-tight mb-5">
                Cryptocurrency<br /><span className="text-brand-600">Asset Tracing</span>
              </h1>
              <p className="text-lg text-slate-600 leading-relaxed mb-6">
                We follow your stolen, lost, or misappropriated cryptocurrency across blockchains — delivering a forensic report that identifies where your funds went and who received them.
              </p>
              <div className="flex flex-wrap gap-3 mb-6">
                <Link href={`${base}/free-evaluation`} className="btn-primary">
                  Start Free Evaluation <ArrowRight size={16} />
                </Link>
                <Link href={`${base}/pricing`} className="btn-secondary">View Pricing</Link>
              </div>
              <div className="flex flex-wrap gap-4 text-sm text-slate-500">
                <span className="flex items-center gap-1.5"><Clock size={13} className="text-brand-500" /> 48–72h delivery</span>
                <span className="flex items-center gap-1.5"><Shield size={13} className="text-brand-500" /> CTCE certified</span>
                <span className="flex items-center gap-1.5"><FileText size={13} className="text-brand-500" /> Court-ready report</span>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 shadow-lg p-6">
              <h3 className="font-display font-bold text-slate-900 mb-4">Supported Blockchains</h3>
              <div className="grid grid-cols-2 gap-2">
                {chains.map((chain) => (
                  <div key={chain} className="flex items-center gap-2 text-sm text-slate-700 bg-slate-50 rounded-lg px-3 py-2">
                    <CheckCircle2 size={13} className="text-emerald-500 flex-shrink-0" />
                    {chain}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Techniques */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="section-tag">Methodology</p>
            <h2 className="section-title text-3xl lg:text-4xl mb-4">How We Trace Cryptocurrency</h2>
            <p className="text-slate-600 max-w-2xl mx-auto">Our certified investigators use professional-grade blockchain intelligence tools and proven forensic techniques.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {techniques.map((tech, i) => (
              <div key={tech.title} className="card">
                <div className="w-8 h-8 rounded-lg bg-brand-600 text-white font-display font-bold text-sm flex items-center justify-center mb-4">
                  {String(i + 1).padStart(2, '0')}
                </div>
                <h3 className="font-display font-bold text-slate-900 mb-2">{tech.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{tech.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What's in the report */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="section-tag">Deliverable</p>
              <h2 className="section-title text-3xl mb-4">What's in Your Forensic Report</h2>
              <p className="text-slate-600 mb-6">Every report is structured to meet legal evidentiary standards — usable in civil litigation, criminal proceedings, and regulatory enforcement.</p>
              <ul className="space-y-3">
                {[
                  'Executive summary with key findings',
                  'Visual transaction flow diagrams',
                  'Complete list of wallet addresses identified',
                  'Exchange and VASP identification',
                  'Attribution data and entity analysis',
                  'Risk scoring of identified addresses',
                  'Recommended legal next steps',
                  'Methodology and tool documentation',
                  'Investigator certification & signature',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-slate-700">
                    <CheckCircle2 size={15} className="text-brand-600 mt-0.5 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 shadow-lg p-6">
              <div className="flex items-center gap-3 mb-5 pb-5 border-b border-slate-100">
                <FileText size={20} className="text-brand-600" />
                <div>
                  <p className="font-display font-bold text-slate-900">LedgerHound Forensic Report</p>
                  <p className="text-xs text-slate-500">Case #LH-2026-XXXX · Certified Investigator</p>
                </div>
              </div>
              {['Executive Summary', 'Transaction Analysis', 'Fund Flow Diagram', 'Entity Attribution', 'Exchange Identification', 'Legal Recommendations', 'Methodology', 'Certifications'].map((section, i) => (
                <div key={section} className="flex items-center gap-3 py-2.5 border-b border-slate-50 last:border-0">
                  <span className="text-xs text-slate-400 w-5">{i + 1}</span>
                  <span className="text-sm text-slate-700 font-medium">{section}</span>
                  <CheckCircle2 size={13} className="text-emerald-500 ml-auto" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <p className="section-tag">FAQ</p>
            <h2 className="section-title text-3xl">Common Questions</h2>
          </div>
          <div className="space-y-4">
            {faqs.map((faq) => (
              <div key={faq.q} className="card">
                <h3 className="font-display font-bold text-slate-900 mb-2">{faq.q}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-brand-600">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="font-display font-bold text-3xl text-white mb-4">Ready to trace your funds?</h2>
          <p className="text-brand-100 mb-6">Free case evaluation — we'll tell you within 24 hours if your funds are traceable and what we can find.</p>
          <Link href={`${base}/free-evaluation`} className="bg-white text-brand-700 font-bold px-7 py-3.5 rounded-lg hover:bg-brand-50 transition-colors inline-flex items-center gap-2">
            Start Free Evaluation <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
